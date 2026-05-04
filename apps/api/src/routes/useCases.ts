import { zValidator } from "@hono/zod-validator";
import { asc, isNull, or, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.js";
import { useCases } from "../db/schema.js";
import type { AuthVariables } from "../lib/auth-middleware.js";
import { currentUserId, optionalAuth, requireAuth } from "../lib/auth-middleware.js";
import { resolveLocale } from "../lib/locale.js";
import { slugify } from "../lib/slug.js";

const createSchema = z.object({
  name: z.string().min(2).max(200),
});

export const useCasesRouter = new Hono<{ Variables: AuthVariables }>();

useCasesRouter.get("/use-cases", optionalAuth, async (c) => {
  const locale = await resolveLocale(c);
  const userId = c.get("user")?.sub ?? null;

  const rows = userId
    ? await db
        .select()
        .from(useCases)
        .where(or(isNull(useCases.userId), eq(useCases.userId, userId)))
    : await db.select().from(useCases).where(isNull(useCases.userId));

  const sorted = rows
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      name: locale === "en" ? r.nameEn : r.nameTr,
      icd10Code: r.icd10Code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  return c.json(sorted);
});

useCasesRouter.post("/use-cases", requireAuth, zValidator("json", createSchema), async (c) => {
  const userId = currentUserId(c);
  const name = c.req.valid("json").name.trim();
  const baseSlug = slugify(name);
  const finalSlug = `${baseSlug}-${userId.replace(/-/g, "").slice(0, 12)}`.slice(0, 64);

  const [row] = await db
    .insert(useCases)
    .values({ slug: finalSlug, nameTr: name, nameEn: name, userId })
    .returning();
  if (!row) return c.body(null, 500);
  return c.json({ id: row.id, slug: row.slug, name, icd10Code: null }, 201);
});
