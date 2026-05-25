import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { medicines } from "~/db/schema";
import { auth } from "~/lib/auth";
import { localeFromUser } from "~/lib/locale";
import type { Medicine } from "~/db/schema";
import { jsonError, loadTagsForIds, openSchema, toMedicineDto } from "~/server/medicines";

export const Route = createFileRoute("/api/medicines/$id/open")({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = openSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);
        const body = parsed.data;
        const userId = session.user.id;
        const id = params.id;
        const locale = localeFromUser(session.user, request.headers.get("accept-language"));

        const [existing] = await db
          .select()
          .from(medicines)
          .where(and(eq(medicines.id, id), eq(medicines.userId, userId)))
          .limit(1);
        if (!existing) return new Response(null, { status: 404 });

        const patch: Partial<typeof medicines.$inferInsert> = {
          updatedAt: new Date().toISOString(),
        };
        if (!existing.openedAt) patch.openedAt = new Date().toISOString().slice(0, 10);
        if (body.openedShelfLifeDays !== undefined)
          patch.openedShelfLifeDays = body.openedShelfLifeDays;

        await db.update(medicines).set(patch).where(eq(medicines.id, id));
        const updatedMed = { ...existing, ...patch } as Medicine;
        const tagMap = await loadTagsForIds([id]);
        return Response.json(toMedicineDto(updatedMed, tagMap.get(id) ?? [], locale));
      },
    },
  },
});
