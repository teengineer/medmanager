import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { medicines } from "~/db/schema";
import { auth } from "~/lib/auth";
import { resolveLocale } from "~/lib/locale";
import { jsonError, loadWithTags, openSchema, toMedicineDto } from "~/server/medicines";

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
        const locale = await resolveLocale(userId, request.headers.get("accept-language"));

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
        const [entry] = await loadWithTags(userId, id);
        if (!entry) return new Response(null, { status: 404 });
        return Response.json(toMedicineDto(entry.medicine, entry.tags, locale));
      },
    },
  },
});
