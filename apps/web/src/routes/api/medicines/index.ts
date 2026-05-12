import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { db } from "~/db";
import { medicineUseCases, medicines } from "~/db/schema";
import { auth } from "~/lib/auth";
import { resolveLocale } from "~/lib/locale";
import {
  createSchema,
  jsonError,
  listQuerySchema,
  loadWithTags,
  toMedicineDto,
} from "~/server/medicines";

export const Route = createFileRoute("/api/medicines/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const url = new URL(request.url);
        const parsed = listQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return jsonError(parsed.error);

        const userId = session.user.id;
        const locale = await resolveLocale(userId, request.headers.get("accept-language"));
        let data = await loadWithTags(userId);

        const params = parsed.data;
        if (params.q) {
          const q = params.q.trim().toLowerCase();
          data = data.filter(
            (d) =>
              d.medicine.name.toLowerCase().includes(q) ||
              (d.medicine.activeIngredient?.toLowerCase().includes(q) ?? false),
          );
        }
        if (params.useCase) {
          const ucId = params.useCase;
          data = data.filter((d) => d.tags.some((t) => t.useCaseId === ucId));
        }
        if (params.opened !== undefined) {
          data = data.filter((d) => Boolean(d.medicine.openedAt) === params.opened);
        }

        const dtos = data.map((d) => toMedicineDto(d.medicine, d.tags, locale));
        const filtered =
          params.expired === undefined ? dtos : dtos.filter((d) => d.isExpired === params.expired);

        return Response.json({ items: filtered, total: filtered.length });
      },
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = createSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);
        const body = parsed.data;
        const userId = session.user.id;
        const locale = await resolveLocale(userId, request.headers.get("accept-language"));

        const [row] = await db
          .insert(medicines)
          .values({
            userId,
            name: body.name.trim(),
            activeIngredient: body.activeIngredient?.trim() || null,
            strength: body.strength?.trim() || null,
            form: body.form?.trim() || null,
            barcode: body.barcode?.trim() || null,
            expiryDate: body.expiryDate,
            openedAt: body.openedAt ?? null,
            openedShelfLifeDays: body.openedShelfLifeDays ?? null,
            quantity: String(body.quantity),
            unit: body.unit.trim(),
            notes: body.notes?.trim() || null,
            image: body.image ?? null,
          })
          .returning();
        if (!row) return new Response(null, { status: 500 });

        if (body.useCaseIds && body.useCaseIds.length > 0) {
          const unique = Array.from(new Set(body.useCaseIds));
          await db
            .insert(medicineUseCases)
            .values(unique.map((useCaseId) => ({ medicineId: row.id, useCaseId })));
        }

        const [entry] = await loadWithTags(userId, row.id);
        if (!entry) return new Response(null, { status: 500 });
        return Response.json(toMedicineDto(entry.medicine, entry.tags, locale), { status: 201 });
      },
    },
  },
});

export type ListQuery = z.infer<typeof listQuerySchema>;
