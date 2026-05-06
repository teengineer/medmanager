import { createFileRoute } from "@tanstack/react-router";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { medicineUseCases, medicines, useCases } from "~/db/schema";
import { auth } from "~/lib/auth";
import { resolveLocale } from "~/lib/locale";
import { toMedicineDto } from "~/lib/medicines";
import { jsonError } from "~/server/medicines";

const querySchema = z.object({
  useCase: z.string().min(1),
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
        const locale = await resolveLocale(userId, request.headers.get("accept-language"));
        const { useCase } = parsed.data;

        const rows = await db
          .select({ medicine: medicines })
          .from(medicines)
          .innerJoin(medicineUseCases, eq(medicineUseCases.medicineId, medicines.id))
          .where(
            and(
              eq(medicines.userId, userId),
              eq(medicineUseCases.useCaseId, useCase),
              gt(medicines.quantity, "0"),
            ),
          );

        if (rows.length === 0) return Response.json({ items: [] });

        const medicineIds = rows.map((r) => r.medicine.id);
        const tagRows = await db
          .select({
            medicineId: medicineUseCases.medicineId,
            useCaseId: useCases.id,
            slug: useCases.slug,
            nameTr: useCases.nameTr,
            nameEn: useCases.nameEn,
          })
          .from(medicineUseCases)
          .innerJoin(useCases, eq(useCases.id, medicineUseCases.useCaseId));

        const byMedicine = new Map<string, typeof tagRows>();
        for (const tag of tagRows) {
          if (!medicineIds.includes(tag.medicineId)) continue;
          const existing = byMedicine.get(tag.medicineId);
          if (existing) existing.push(tag);
          else byMedicine.set(tag.medicineId, [tag]);
        }

        const today = new Date().toISOString().slice(0, 10);
        const items = rows
          .map((r) => toMedicineDto(r.medicine, byMedicine.get(r.medicine.id) ?? [], locale))
          .filter((d) => d.effectiveExpiry >= today)
          .sort((a, b) => a.effectiveExpiry.localeCompare(b.effectiveExpiry));

        return Response.json({ items });
      },
    },
  },
});
