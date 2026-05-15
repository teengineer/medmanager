import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { medicineUseCases, medicines, useCases } from "~/db/schema";
import { toMedicineDto } from "~/lib/medicines";

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const createSchema = z.object({
  name: z.string().min(1).max(200),
  profileId: z.string().nullable().optional(),
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
  image: z.string().max(10_000_000).nullable().optional(),
  useCaseIds: z.array(z.string()).optional(),
});

export const updateSchema = createSchema.partial().extend({
  clearOpenedAt: z.boolean().optional(),
});

export const openSchema = z.object({
  openedShelfLifeDays: z.number().int().positive().optional(),
});

export const listQuerySchema = z.object({
  q: z.string().optional(),
  useCase: z.string().optional(),
  profileId: z.string().optional(),
  expired: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
  opened: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
});

export async function loadWithTags(userId: string, medicineId?: string, profileId?: string) {
  let whereClause;
  if (medicineId) {
    whereClause = and(eq(medicines.userId, userId), eq(medicines.id, medicineId));
  } else if (profileId === "none") {
    whereClause = and(eq(medicines.userId, userId), isNull(medicines.profileId));
  } else if (profileId) {
    whereClause = and(eq(medicines.userId, userId), eq(medicines.profileId, profileId));
  } else {
    whereClause = eq(medicines.userId, userId);
  }
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

export function jsonError(zodError: z.ZodError, status = 400) {
  return Response.json(
    {
      errors: zodError.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    },
    { status },
  );
}

export { toMedicineDto };
