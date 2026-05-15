import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "~/db";
import { medicines, usageLogs } from "~/db/schema";
import { auth } from "~/lib/auth";

export const Route = createFileRoute("/api/medicines/$id/usage-logs")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const userId = session.user.id;
        const medicineId = params.id;

        const [existing] = await db
          .select()
          .from(medicines)
          .where(and(eq(medicines.id, medicineId), eq(medicines.userId, userId)))
          .limit(1);
        if (!existing) return new Response(null, { status: 404 });

        const url = new URL(request.url);
        const daysParam = url.searchParams.get("days");
        const days = Math.min(90, Math.max(1, daysParam ? parseInt(daysParam, 10) || 14 : 14));

        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

        const rows = await db
          .select()
          .from(usageLogs)
          .where(and(eq(usageLogs.medicineId, medicineId), gte(usageLogs.date, fromDate)))
          .orderBy(desc(usageLogs.date));

        return Response.json(rows);
      },
    },
  },
});
