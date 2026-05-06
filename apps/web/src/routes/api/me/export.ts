import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { medicineUseCases, medicines, useCases, user as userTable } from "~/db/schema";
import { auth } from "~/lib/auth";
import { toMedicineDto } from "~/lib/medicines";

export const Route = createFileRoute("/api/me/export")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const userId = session.user.id;
        const [u] = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
        if (!u) return new Response(null, { status: 404 });

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

        const locale = u.locale === "en" ? "en" : "tr";
        const payload = {
          exportedAt: new Date().toISOString(),
          user: {
            id: u.id,
            email: u.email,
            locale: u.locale,
            timeZone: u.timeZone,
            createdAt: u.createdAt.toISOString(),
          },
          medicines: mine.map((m) => toMedicineDto(m, tagsByMedicine.get(m.id) ?? [], locale)),
        };

        const filename = `medmanager-export-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;
        return new Response(JSON.stringify(payload, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      },
    },
  },
});
