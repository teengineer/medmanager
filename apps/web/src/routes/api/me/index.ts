import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { account, user as userTable } from "~/db/schema";
import { auth } from "~/lib/auth";

const updateSchema = z.object({
  locale: z.enum(["tr", "en"]).optional(),
  timeZone: z.string().min(1).max(64).optional(),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
});

async function meDto(u: typeof userTable.$inferSelect) {
  const credentialAccounts = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, u.id), eq(account.providerId, "credential")))
    .limit(1);
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    locale: u.locale,
    timeZone: u.timeZone,
    emailVerified: u.emailVerified,
    hasPassword: credentialAccounts.length > 0 && Boolean(credentialAccounts[0]?.password),
    createdAt: u.createdAt.toISOString(),
  };
}

async function loadUser(userId: string) {
  const rows = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
  return rows[0] ?? null;
}

export const Route = createFileRoute("/api/me/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });
        const u = await loadUser(session.user.id);
        if (!u) return new Response(null, { status: 404 });
        return Response.json(await meDto(u));
      },
      PATCH: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const body = updateSchema.parse(await request.json());
        const updates: Partial<typeof userTable.$inferInsert> = { updatedAt: new Date() };
        if (body.locale !== undefined) updates.locale = body.locale;
        if (body.timeZone !== undefined) updates.timeZone = body.timeZone;
        if (body.firstName !== undefined) updates.firstName = body.firstName?.trim() || null;
        if (body.lastName !== undefined) updates.lastName = body.lastName?.trim() || null;

        await db.update(userTable).set(updates).where(eq(userTable.id, session.user.id));
        const u = await loadUser(session.user.id);
        if (!u) return new Response(null, { status: 404 });
        return Response.json(await meDto(u));
      },
      DELETE: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });
        await db.delete(userTable).where(eq(userTable.id, session.user.id));
        return new Response(null, { status: 204 });
      },
    },
  },
});
