import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { medicineUseCases, medicines } from "~/db/schema";
import { auth } from "~/lib/auth";
import { localeFromUser } from "~/lib/locale";
import type { Medicine } from "~/db/schema";
import { jsonError, loadTagsForIds, loadWithTags, toMedicineDto, updateSchema } from "~/server/medicines";

export const Route = createFileRoute("/api/medicines/$id/")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const userId = session.user.id;
        const locale = localeFromUser(session.user, request.headers.get("accept-language"));
        const [entry] = await loadWithTags(userId, { medicineId: params.id });
        if (!entry) return new Response(null, { status: 404 });
        return Response.json(toMedicineDto(entry.medicine, entry.tags, locale));
      },
      PATCH: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = updateSchema.safeParse(await request.json());
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
        if (body.profileId !== undefined) patch.profileId = body.profileId ?? null;
        if (body.name !== undefined) patch.name = body.name.trim();
        if (body.activeIngredient !== undefined)
          patch.activeIngredient = body.activeIngredient?.trim() || null;
        if (body.strength !== undefined) patch.strength = body.strength?.trim() || null;
        if (body.form !== undefined) patch.form = body.form?.trim() || null;
        if (body.barcode !== undefined) patch.barcode = body.barcode?.trim() || null;
        if (body.expiryDate !== undefined) patch.expiryDate = body.expiryDate;
        if (body.clearOpenedAt) patch.openedAt = null;
        else if (body.openedAt !== undefined) patch.openedAt = body.openedAt;
        if (body.openedShelfLifeDays !== undefined)
          patch.openedShelfLifeDays = body.openedShelfLifeDays;
        if (body.quantity !== undefined) patch.quantity = String(body.quantity);
        if (body.unit !== undefined) patch.unit = body.unit.trim();
        if (body.packageCount !== undefined) patch.packageCount = body.packageCount;
        if (body.dosePerDay !== undefined) patch.dosePerDay = body.dosePerDay ?? null;
        if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
        if (body.image !== undefined) patch.image = body.image ?? null;
        if (body.archive !== undefined) {
          patch.archivedAt = body.archive ? new Date().toISOString() : null;
        }

        await db.update(medicines).set(patch).where(eq(medicines.id, id));

        if (body.useCaseIds !== undefined) {
          await db.delete(medicineUseCases).where(eq(medicineUseCases.medicineId, id));
          const unique = Array.from(new Set(body.useCaseIds));
          if (unique.length > 0) {
            await db
              .insert(medicineUseCases)
              .values(unique.map((useCaseId) => ({ medicineId: id, useCaseId })));
          }
        }

        const updatedMed = { ...existing, ...patch } as Medicine;
        const tagMap = await loadTagsForIds([id]);
        return Response.json(toMedicineDto(updatedMed, tagMap.get(id) ?? [], locale));
      },
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });
        const userId = session.user.id;
        await db
          .delete(medicines)
          .where(and(eq(medicines.id, params.id), eq(medicines.userId, userId)));
        return new Response(null, { status: 204 });
      },
    },
  },
});
