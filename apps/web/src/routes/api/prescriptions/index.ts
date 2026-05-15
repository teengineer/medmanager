import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { prescriptions, profiles } from "~/db/schema";
import { auth } from "~/lib/auth";
import { jsonError } from "~/server/medicines";

const prescriptionMedicineSchema = z.object({
  name: z.string().min(1).max(200),
  activeIngredient: z.string().max(200).nullable().optional(),
  strength: z.string().max(50).nullable().optional(),
  form: z.string().max(50).nullable().optional(),
});

const createPrescriptionSchema = z.object({
  profileId: z.string().nullable().optional(),
  doctorName: z.string().max(200).nullable().optional(),
  prescriptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2000).nullable().optional(),
  medicines: z.array(prescriptionMedicineSchema).optional(),
});

export type PrescriptionMedicine = z.infer<typeof prescriptionMedicineSchema>;

export interface PrescriptionDto {
  id: string;
  profileId: string | null;
  profileName: string | null;
  doctorName: string | null;
  prescriptionDate: string;
  notes: string | null;
  medicines: PrescriptionMedicine[];
  createdAt: string;
}

async function toPrescriptionDto(
  row: typeof prescriptions.$inferSelect,
  profilesMap: Map<string, string>,
): Promise<PrescriptionDto> {
  return {
    id: row.id,
    profileId: row.profileId ?? null,
    profileName: row.profileId ? (profilesMap.get(row.profileId) ?? null) : null,
    doctorName: row.doctorName ?? null,
    prescriptionDate: row.prescriptionDate,
    notes: row.notes ?? null,
    medicines: row.medicinesJson ? (JSON.parse(row.medicinesJson) as PrescriptionMedicine[]) : [],
    createdAt: row.createdAt,
  };
}

async function buildProfilesMap(userId: string): Promise<Map<string, string>> {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return new Map(rows.map((p) => [p.id, p.name]));
}

export const Route = createFileRoute("/api/prescriptions/")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const url = new URL(request.url);
        const profileId = url.searchParams.get("profile_id") ?? undefined;

        const userId = session.user.id;
        const whereClause = profileId
          ? and(eq(prescriptions.userId, userId), eq(prescriptions.profileId, profileId))
          : eq(prescriptions.userId, userId);

        const rows = await db
          .select()
          .from(prescriptions)
          .where(whereClause)
          .orderBy(asc(prescriptions.prescriptionDate));

        const profilesMap = await buildProfilesMap(userId);
        const items = await Promise.all(rows.map((r) => toPrescriptionDto(r, profilesMap)));

        return Response.json({ items, total: items.length });
      },
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = createPrescriptionSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);

        const body = parsed.data;
        const userId = session.user.id;

        const [row] = await db
          .insert(prescriptions)
          .values({
            userId,
            profileId: body.profileId ?? null,
            doctorName: body.doctorName?.trim() || null,
            prescriptionDate: body.prescriptionDate,
            notes: body.notes?.trim() || null,
            medicinesJson: body.medicines ? JSON.stringify(body.medicines) : null,
          })
          .returning();
        if (!row) return new Response(null, { status: 500 });

        const profilesMap = await buildProfilesMap(userId);
        const dto = await toPrescriptionDto(row, profilesMap);
        return Response.json(dto, { status: 201 });
      },
    },
  },
});
