import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { profiles } from "~/db/schema";
import { auth } from "~/lib/auth";
import { jsonError } from "~/server/medicines";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  relation: z.string().max(50).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
});

export const Route = createFileRoute("/api/profiles/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const [row] = await db
          .select()
          .from(profiles)
          .where(and(eq(profiles.id, params.id), eq(profiles.userId, session.user.id)))
          .limit(1);
        if (!row) return new Response(null, { status: 404 });

        return Response.json(row);
      },
      PATCH: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = updateProfileSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);

        const [existing] = await db
          .select()
          .from(profiles)
          .where(and(eq(profiles.id, params.id), eq(profiles.userId, session.user.id)))
          .limit(1);
        if (!existing) return new Response(null, { status: 404 });

        const patch: Partial<typeof profiles.$inferInsert> = {
          updatedAt: new Date().toISOString(),
        };
        if (parsed.data.name !== undefined) patch.name = parsed.data.name.trim();
        if (parsed.data.relation !== undefined) patch.relation = parsed.data.relation?.trim() || null;
        if (parsed.data.color !== undefined) patch.color = parsed.data.color?.trim() || null;

        const [updated] = await db
          .update(profiles)
          .set(patch)
          .where(eq(profiles.id, params.id))
          .returning();

        return Response.json(updated);
      },
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        await db
          .delete(profiles)
          .where(and(eq(profiles.id, params.id), eq(profiles.userId, session.user.id)));

        return new Response(null, { status: 204 });
      },
    },
  },
});
