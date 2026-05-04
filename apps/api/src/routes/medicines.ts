import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, like, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.js";
import { medicineUseCases, medicines, useCases } from "../db/schema.js";
import type { AuthVariables } from "../lib/auth-middleware.js";
import { currentUserId, requireAuth } from "../lib/auth-middleware.js";
import { resolveLocale } from "../lib/locale.js";
import { toMedicineDto } from "../lib/medicines.js";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

const createSchema = z.object({
  name: z.string().min(1).max(200),
  activeIngredient: z.string().max(200).nullable().optional(),
  strength: z.string().max(50).nullable().optional(),
  form: z.string().max(50).nullable().optional(),
  barcode: z.string().max(64).nullable().optional(),
  expiryDate: dateString,
  openedAt: dateString.nullable().optional(),
  openedShelfLifeDays: z.number().int().positive().nullable().optional(),
  quantity: z.number().min(0),
  unit: z.string().min(1).max(32),
  notes: z.string().max(1000).nullable().optional(),
  useCaseIds: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial().extend({
  clearOpenedAt: z.boolean().optional(),
});

const openSchema = z.object({
  openedShelfLifeDays: z.number().int().positive().optional(),
});

const listQuerySchema = z.object({
  q: z.string().optional(),
  useCase: z.string().optional(),
  expired: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
  opened: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
});

async function loadWithTags(userId: string, medicineId?: string) {
  const whereClause = medicineId
    ? and(eq(medicines.userId, userId), eq(medicines.id, medicineId))
    : eq(medicines.userId, userId);
  const rows = await db.select().from(medicines).where(whereClause).orderBy(asc(medicines.expiryDate));
  if (rows.length === 0) return [];

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
    const existing = byMedicine.get(tag.medicineId);
    if (existing) existing.push(tag);
    else byMedicine.set(tag.medicineId, [tag]);
  }

  return rows.map((m) => ({ medicine: m, tags: byMedicine.get(m.id) ?? [] }));
}

export const medicinesRouter = new Hono<{ Variables: AuthVariables }>();

medicinesRouter.get(
  "/medicines",
  requireAuth,
  zValidator("query", listQuerySchema),
  async (c) => {
    const userId = currentUserId(c);
    const params = c.req.valid("query");
    const locale = await resolveLocale(c);
    let data = await loadWithTags(userId);

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
      params.expired === undefined
        ? dtos
        : dtos.filter((d) => d.isExpired === params.expired);

    return c.json({ items: filtered, total: filtered.length });
  },
);

medicinesRouter.get("/medicines/:id", requireAuth, async (c) => {
  const userId = currentUserId(c);
  const id = c.req.param("id") ?? "";
  const locale = await resolveLocale(c);
  const loaded = await loadWithTags(userId, id);
  const entry = loaded[0];
  if (!entry) return c.body(null, 404);
  return c.json(toMedicineDto(entry.medicine, entry.tags, locale));
});

medicinesRouter.post("/medicines", requireAuth, zValidator("json", createSchema), async (c) => {
  const userId = currentUserId(c);
  const body = c.req.valid("json");
  const locale = await resolveLocale(c);

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
    })
    .returning();
  if (!row) return c.body(null, 500);

  if (body.useCaseIds && body.useCaseIds.length > 0) {
    const unique = Array.from(new Set(body.useCaseIds));
    await db
      .insert(medicineUseCases)
      .values(unique.map((useCaseId) => ({ medicineId: row.id, useCaseId })));
  }

  const [entry] = await loadWithTags(userId, row.id);
  if (!entry) return c.body(null, 500);
  return c.json(toMedicineDto(entry.medicine, entry.tags, locale), 201);
});

medicinesRouter.patch("/medicines/:id", requireAuth, zValidator("json", updateSchema), async (c) => {
  const userId = currentUserId(c);
  const id = c.req.param("id") ?? "";
  const body = c.req.valid("json");
  const locale = await resolveLocale(c);

  const [existing] = await db
    .select()
    .from(medicines)
    .where(and(eq(medicines.id, id), eq(medicines.userId, userId)))
    .limit(1);
  if (!existing) return c.body(null, 404);

  const patch: Partial<typeof medicines.$inferInsert> = { updatedAt: new Date().toISOString() };
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
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;

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

  const [entry] = await loadWithTags(userId, id);
  if (!entry) return c.body(null, 404);
  return c.json(toMedicineDto(entry.medicine, entry.tags, locale));
});

medicinesRouter.delete("/medicines/:id", requireAuth, async (c) => {
  const userId = currentUserId(c);
  const id = c.req.param("id") ?? "";
  await db.delete(medicines).where(and(eq(medicines.id, id), eq(medicines.userId, userId)));
  return c.body(null, 204);
});

medicinesRouter.post("/medicines/:id/open", requireAuth, zValidator("json", openSchema), async (c) => {
  const userId = currentUserId(c);
  const id = c.req.param("id") ?? "";
  const body = c.req.valid("json");
  const locale = await resolveLocale(c);

  const [existing] = await db
    .select()
    .from(medicines)
    .where(and(eq(medicines.id, id), eq(medicines.userId, userId)))
    .limit(1);
  if (!existing) return c.body(null, 404);

  const patch: Partial<typeof medicines.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (!existing.openedAt) patch.openedAt = new Date().toISOString().slice(0, 10);
  if (body.openedShelfLifeDays !== undefined) patch.openedShelfLifeDays = body.openedShelfLifeDays;

  await db.update(medicines).set(patch).where(eq(medicines.id, id));
  const [entry] = await loadWithTags(userId, id);
  if (!entry) return c.body(null, 404);
  return c.json(toMedicineDto(entry.medicine, entry.tags, locale));
});
