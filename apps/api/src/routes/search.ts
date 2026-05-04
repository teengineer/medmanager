import { zValidator } from "@hono/zod-validator";
import { and, eq, gt } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.js";
import { medicineUseCases, medicines, useCases } from "../db/schema.js";
import type { AuthVariables } from "../lib/auth-middleware.js";
import { currentUserId, requireAuth } from "../lib/auth-middleware.js";
import { resolveLocale } from "../lib/locale.js";
import { toMedicineDto } from "../lib/medicines.js";

const querySchema = z.object({
  useCase: z.string().uuid().or(z.string().min(1)),
});

export const searchRouter = new Hono<{ Variables: AuthVariables }>();

searchRouter.get("/search", requireAuth, zValidator("query", querySchema), async (c) => {
  const userId = currentUserId(c);
  const locale = await resolveLocale(c);
  const { useCase } = c.req.valid("query");

  const rows = await db
    .select({ medicine: medicines })
    .from(medicines)
    .innerJoin(medicineUseCases, eq(medicineUseCases.medicineId, medicines.id))
    .where(and(eq(medicines.userId, userId), eq(medicineUseCases.useCaseId, useCase), gt(medicines.quantity, "0")));

  if (rows.length === 0) return c.json({ items: [] });

  const medicineIds = rows.map((r) => r.medicine.id);
  const tagRows = medicineIds.length
    ? await db
        .select({
          medicineId: medicineUseCases.medicineId,
          useCaseId: useCases.id,
          slug: useCases.slug,
          nameTr: useCases.nameTr,
          nameEn: useCases.nameEn,
        })
        .from(medicineUseCases)
        .innerJoin(useCases, eq(useCases.id, medicineUseCases.useCaseId))
    : [];

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

  return c.json({ items });
});
