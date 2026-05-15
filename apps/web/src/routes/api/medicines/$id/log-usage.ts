import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
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

        const [existing] = await db
          .select()
          .from(medicines)
          .where(and(eq(medicines.id, medicineId), eq(medicines.userId, userId)))
          .limit(1);
        if (!existing) return new Response(null, { status: 404 });

        const [row] = await db
          .insert(usageLogs)
          .values({
            userId,
            medicineId,
            date: body.date,
            taken: body.taken,
            notes: body.notes ?? null,
          })
          .onConflictDoUpdate({
            target: [usageLogs.medicineId, usageLogs.date],
            set: { taken: body.taken, notes: body.notes ?? null },
          })
          .returning();

        return Response.json(row, { status: 200 });
      },
    },
  },
});
