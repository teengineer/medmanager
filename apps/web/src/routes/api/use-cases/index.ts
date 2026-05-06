import { createFileRoute } from "@tanstack/react-router";
import { eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { useCases } from "~/db/schema";
import { auth } from "~/lib/auth";
import { resolveLocale } from "~/lib/locale";
import { slugify } from "~/lib/slug";
import { jsonError } from "~/server/medicines";

const createSchema = z.object({
  name: z.string().min(2).max(200),
});

export const Route = createFileRoute("/api/use-cases/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        const userId = session?.user.id ?? null;
        const locale = await resolveLocale(userId, request.headers.get("accept-language"));

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

        return Response.json(sorted);
      },
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = createSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);

        const userId = session.user.id;
        const name = parsed.data.name.trim();
        const baseSlug = slugify(name);
        const finalSlug = `${baseSlug}-${userId.replace(/-/g, "").slice(0, 12)}`.slice(0, 64);

        const [row] = await db
          .insert(useCases)
          .values({ slug: finalSlug, nameTr: name, nameEn: name, userId })
          .returning();
        if (!row) return new Response(null, { status: 500 });
        return Response.json({ id: row.id, slug: row.slug, name, icd10Code: null }, { status: 201 });
      },
    },
  },
});

export type { z };
