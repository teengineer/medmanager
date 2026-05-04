import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.js";
import { medicineUseCases, medicines, useCases, users } from "../db/schema.js";
import type { AuthVariables } from "../lib/auth-middleware.js";
import { currentUserId, requireAuth } from "../lib/auth-middleware.js";
import { clearRefreshCookie } from "../lib/cookies.js";
import { toMeDto } from "../lib/me.js";
import { toMedicineDto } from "../lib/medicines.js";
import { hashPassword, verifyPassword } from "../lib/password.js";

const updateSchema = z.object({
  locale: z.enum(["tr", "en"]).optional(),
  timeZone: z.string().min(1).max(64).optional(),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(200),
});

export const meRouter = new Hono<{ Variables: AuthVariables }>();

meRouter.get("/me", requireAuth, async (c) => {
  const userId = currentUserId(c);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return c.body(null, 404);
  return c.json(toMeDto(user));
});

meRouter.patch("/me", requireAuth, zValidator("json", updateSchema), async (c) => {
  const userId = currentUserId(c);
  const body = c.req.valid("json");

  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (body.locale !== undefined) updates.locale = body.locale;
  if (body.timeZone !== undefined) updates.timeZone = body.timeZone;
  if (body.firstName !== undefined)
    updates.firstName = body.firstName?.trim() || null;
  if (body.lastName !== undefined) updates.lastName = body.lastName?.trim() || null;

  await db.update(users).set(updates).where(eq(users.id, userId));
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return c.body(null, 404);
  return c.json(toMeDto(user));
});

meRouter.post(
  "/me/password",
  requireAuth,
  zValidator("json", changePasswordSchema),
  async (c) => {
    const userId = currentUserId(c);
    const body = c.req.valid("json");
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return c.body(null, 404);

    const hasExisting = Boolean(user.passwordHash);
    if (hasExisting) {
      if (!body.currentPassword || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
        return c.json(
          { errors: [{ field: "currentPassword", message: "Current password is incorrect." }] },
          400,
        );
      }
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(body.newPassword), updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId));
    return c.body(null, 204);
  },
);

meRouter.post("/me/export", requireAuth, async (c) => {
  const userId = currentUserId(c);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return c.body(null, 404);

  const mine = await db.select().from(medicines).where(eq(medicines.userId, userId));
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

  const tagsByMedicine = new Map<string, typeof tagRows>();
  for (const tag of tagRows) {
    const existing = tagsByMedicine.get(tag.medicineId);
    if (existing) existing.push(tag);
    else tagsByMedicine.set(tag.medicineId, [tag]);
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      locale: user.locale,
      timeZone: user.timeZone,
      createdAt: user.createdAt,
    },
    medicines: mine.map((m) => toMedicineDto(m, tagsByMedicine.get(m.id) ?? [], user.locale === "en" ? "en" : "tr")),
  };

  const filename = `medmanager-export-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});

meRouter.delete("/me", requireAuth, async (c) => {
  const userId = currentUserId(c);
  await db.delete(users).where(eq(users.id, userId));
  clearRefreshCookie(c);
  return c.body(null, 204);
});
