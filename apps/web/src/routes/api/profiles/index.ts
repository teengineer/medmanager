import { createFileRoute } from "@tanstack/react-router";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { profiles } from "~/db/schema";
import { auth } from "~/lib/auth";
import { jsonError } from "~/server/medicines";

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  relation: z.string().max(50).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
});

export const Route = createFileRoute("/api/profiles/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const items = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, session.user.id))
          .orderBy(asc(profiles.createdAt));

        return Response.json({ items, total: items.length });
      },
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = createProfileSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);

        const { name, relation, color } = parsed.data;
        const [row] = await db
          .insert(profiles)
          .values({
            userId: session.user.id,
            name: name.trim(),
            relation: relation?.trim() || null,
            color: color?.trim() || null,
          })
          .returning();
        if (!row) return new Response(null, { status: 500 });

        return Response.json(row, { status: 201 });
      },
    },
  },
});
