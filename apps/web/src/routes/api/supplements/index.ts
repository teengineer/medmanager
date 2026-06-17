import { createFileRoute } from "@tanstack/react-router";
import { desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { supplementProducts } from "~/db/schema";
import { auth } from "~/lib/auth";
import { gtinToEan13 } from "~/server/drugs";
import { jsonError } from "~/server/medicines";

const createSchema = z.object({
  barcode: z.string().max(64).nullable().optional(),
  name: z.string().min(2).max(200),
  form: z.string().max(50).nullable().optional(),
});

function toDto(row: typeof supplementProducts.$inferSelect) {
  return { id: row.id, barcode: row.barcode, name: row.name, form: row.form };
}

export const Route = createFileRoute("/api/supplements/")({
  server: {
    handlers: {
      // Search the shared supplement catalog by barcode (exact) or name (prefix/substring).
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const url = new URL(request.url);
        const barcode = url.searchParams.get("barcode")?.trim();
        const q = url.searchParams.get("q")?.trim();

        if (barcode) {
          const ean13 = gtinToEan13(barcode);
          const rows = await db
            .select()
            .from(supplementProducts)
            .where(eq(supplementProducts.barcode, ean13))
            .limit(1);
          return Response.json({ items: rows.map(toDto) });
        }

        if (!q || q.length < 2) return Response.json({ items: [] });

        const rows = await db
          .select()
          .from(supplementProducts)
          .where(ilike(supplementProducts.name, `%${q}%`))
          .orderBy(desc(supplementProducts.usageCount))
          .limit(20);
        return Response.json({ items: rows.map(toDto) });
      },

      // Contribute a supplement to the shared catalog (called when a user saves a
      // supplement that wasn't already found). Deduped by barcode, else by name.
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = createSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);

        const userId = session.user.id;
        const name = parsed.data.name.trim();
        const form = parsed.data.form?.trim() || null;
        const barcode = parsed.data.barcode?.trim() ? gtinToEan13(parsed.data.barcode.trim()) : null;

        // With a barcode we can upsert atomically (barcode is unique when present).
        if (barcode) {
          const [row] = await db
            .insert(supplementProducts)
            .values({ barcode, name, form, createdBy: userId })
            .onConflictDoUpdate({
              target: supplementProducts.barcode,
              // Bump popularity; keep the original name to resist drive-by edits.
              set: {
                usageCount: sql`${supplementProducts.usageCount} + 1`,
                updatedAt: new Date().toISOString(),
              },
            })
            .returning();
          if (!row) return new Response(null, { status: 500 });
          return Response.json(toDto(row), { status: 201 });
        }

        // No barcode: dedupe on a case-insensitive name match.
        const [existing] = await db
          .select()
          .from(supplementProducts)
          .where(ilike(supplementProducts.name, name))
          .limit(1);
        if (existing) {
          const [row] = await db
            .update(supplementProducts)
            .set({
              usageCount: sql`${supplementProducts.usageCount} + 1`,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(supplementProducts.id, existing.id))
            .returning();
          return Response.json(toDto(row ?? existing), { status: 200 });
        }

        const [row] = await db
          .insert(supplementProducts)
          .values({ name, form, createdBy: userId })
          .returning();
        if (!row) return new Response(null, { status: 500 });
        return Response.json(toDto(row), { status: 201 });
      },
    },
  },
});
