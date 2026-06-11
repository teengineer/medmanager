import { createFileRoute } from "@tanstack/react-router";
import { and, count, eq, getTableColumns, gt, inArray, isNotNull, like, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { medicineUseCases, medicines, usageLogs, useCases } from "~/db/schema";
import { auth } from "~/lib/auth";
import { localeFromUser } from "~/lib/locale";
import { toMedicineDto } from "~/lib/medicines";
import { jsonError } from "~/server/medicines";

const querySchema = z
  .object({
    useCase: z.string().min(1).optional(),
    activeIngredient: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.useCase) !== Boolean(v.activeIngredient), {
    message: "Provide exactly one of useCase or activeIngredient",
  });

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const url = new URL(request.url);
        const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) return jsonError(parsed.error);

        const userId = session.user.id;
        const locale = localeFromUser(session.user, request.headers.get("accept-language"));
        const { useCase, activeIngredient } = parsed.data;

        // Results don't show photos — skip the (potentially multi-MB base64)
        // image column so rows stay tiny on the wire.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { image: _image, ...medicineCols } = getTableColumns(medicines);

        const rows = activeIngredient
          ? await db
              .select({ medicine: medicineCols })
              .from(medicines)
              .where(
                and(
                  eq(medicines.userId, userId),
                  gt(medicines.quantity, "0"),
                  isNotNull(medicines.activeIngredient),
                  like(
                    sql`lower(${medicines.activeIngredient})`,
                    `%${activeIngredient.toLowerCase()}%`,
                  ),
                ),
              )
          : await db
              .select({ medicine: medicineCols })
              .from(medicines)
              .innerJoin(medicineUseCases, eq(medicineUseCases.medicineId, medicines.id))
              .where(
                and(
                  eq(medicines.userId, userId),
                  eq(medicineUseCases.useCaseId, useCase!),
                  gt(medicines.quantity, "0"),
                ),
              );

        if (rows.length === 0) return Response.json({ items: [] });

        const medicineIds = rows.map((r) => r.medicine.id);

        // Doses logged as "taken" reduce what's left in the box.
        const takenRows = await db
          .select({ medicineId: usageLogs.medicineId, taken: count() })
          .from(usageLogs)
          .where(and(inArray(usageLogs.medicineId, medicineIds), eq(usageLogs.taken, true)))
          .groupBy(usageLogs.medicineId);
        const takenByMedicine = new Map(takenRows.map((r) => [r.medicineId, r.taken]));
        const tagRows = await db
          .select({
            medicineId: medicineUseCases.medicineId,
            useCaseId: useCases.id,
            slug: useCases.slug,
            nameTr: useCases.nameTr,
            nameEn: useCases.nameEn,
          })
          .from(medicineUseCases)
          .innerJoin(useCases, eq(useCases.id, medicineUseCases.useCaseId))
          .where(inArray(medicineUseCases.medicineId, medicineIds));

        const byMedicine = new Map<string, typeof tagRows>();
        for (const tag of tagRows) {
          const existing = byMedicine.get(tag.medicineId);
          if (existing) existing.push(tag);
          else byMedicine.set(tag.medicineId, [tag]);
        }

        const today = new Date().toISOString().slice(0, 10);
        const items = rows
          .map((r) => {
            const dto = toMedicineDto(r.medicine, byMedicine.get(r.medicine.id) ?? [], locale);
            // usage logs are per-day; a "taken" day consumes dosePerDay units (default 1)
            const takenDays = takenByMedicine.get(r.medicine.id) ?? 0;
            const perDay = dto.dosePerDay && dto.dosePerDay > 0 ? dto.dosePerDay : 1;
            return { ...dto, remainingQuantity: Math.max(0, dto.quantity - takenDays * perDay) };
          })
          .filter((d) => d.effectiveExpiry >= today)
          .sort((a, b) => a.effectiveExpiry.localeCompare(b.effectiveExpiry));

        return Response.json({ items });
      },
    },
  },
});
