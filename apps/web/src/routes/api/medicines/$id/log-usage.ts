import { createFileRoute } from "@tanstack/react-router";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { medicines, usageLogs } from "~/db/schema";
import { auth } from "~/lib/auth";
import { dateString, jsonError } from "~/server/medicines";

const logUsageSchema = z.object({
  date: dateString,
  taken: z.boolean(),
  notes: z.string().max(500).optional(),
});

const unlogSchema = z.object({
  date: dateString,
});

async function ownsMedicine(userId: string, medicineId: string) {
  const [existing] = await db
    .select({ id: medicines.id })
    .from(medicines)
    .where(and(eq(medicines.id, medicineId), eq(medicines.userId, userId)))
    .limit(1);
  return Boolean(existing);
}

export const Route = createFileRoute("/api/medicines/$id/log-usage")({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = logUsageSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);
        const body = parsed.data;

        const userId = session.user.id;
        const medicineId = params.id;
        if (!(await ownsMedicine(userId, medicineId))) return new Response(null, { status: 404 });

        // "Taken" stacks: a second tap the same day bumps the count so the user
        // can record multiple doses in one day. "Skipped" resets to a single
        // skip entry (count 0, taken false).
        const [row] = await db
          .insert(usageLogs)
          .values({
            userId,
            medicineId,
            date: body.date,
            taken: body.taken,
            count: body.taken ? 1 : 0,
            notes: body.notes ?? null,
          })
          .onConflictDoUpdate({
            target: [usageLogs.medicineId, usageLogs.date],
            set: {
              taken: body.taken,
              count: body.taken ? sql`${usageLogs.count} + 1` : 0,
              notes: body.notes ?? null,
            },
          })
          .returning();

        return Response.json(row, { status: 200 });
      },
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = unlogSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);

        const userId = session.user.id;
        const medicineId = params.id;
        if (!(await ownsMedicine(userId, medicineId))) return new Response(null, { status: 404 });

        // Decrement one dose; drop the row entirely once it hits zero.
        const [row] = await db
          .update(usageLogs)
          .set({ count: sql`${usageLogs.count} - 1` })
          .where(and(eq(usageLogs.medicineId, medicineId), eq(usageLogs.date, parsed.data.date)))
          .returning();

        if (row && row.count <= 0) {
          await db
            .delete(usageLogs)
            .where(and(eq(usageLogs.medicineId, medicineId), eq(usageLogs.date, parsed.data.date)));
          return Response.json(null, { status: 200 });
        }

        return Response.json(row ?? null, { status: 200 });
      },
    },
  },
});
