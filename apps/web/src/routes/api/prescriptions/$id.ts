import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { prescriptions, profiles } from "~/db/schema";
import { auth } from "~/lib/auth";
import { jsonError } from "~/server/medicines";
import type { PrescriptionDto, PrescriptionMedicine } from "./index";

const updatePrescriptionSchema = z.object({
  profileId: z.string().nullable().optional(),
  doctorName: z.string().max(200).nullable().optional(),
  prescriptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(2000).nullable().optional(),
  medicines: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        activeIngredient: z.string().max(200).nullable().optional(),
        strength: z.string().max(50).nullable().optional(),
        form: z.string().max(50).nullable().optional(),
      }),
    )
    .optional(),
});

async function buildProfilesMap(userId: string): Promise<Map<string, string>> {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return new Map(rows.map((p) => [p.id, p.name]));
}

function toDto(
  row: typeof prescriptions.$inferSelect,
  profilesMap: Map<string, string>,
): PrescriptionDto {
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

export const Route = createFileRoute("/api/prescriptions/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const [row] = await db
          .select()
          .from(prescriptions)
          .where(and(eq(prescriptions.id, params.id), eq(prescriptions.userId, session.user.id)))
          .limit(1);
        if (!row) return new Response(null, { status: 404 });

        const profilesMap = await buildProfilesMap(session.user.id);
        return Response.json(toDto(row, profilesMap));
      },
      PATCH: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = updatePrescriptionSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);

        const [existing] = await db
          .select()
          .from(prescriptions)
          .where(and(eq(prescriptions.id, params.id), eq(prescriptions.userId, session.user.id)))
          .limit(1);
        if (!existing) return new Response(null, { status: 404 });

        const body = parsed.data;
        const patch: Partial<typeof prescriptions.$inferInsert> = {
          updatedAt: new Date().toISOString(),
        };
        if (body.profileId !== undefined) patch.profileId = body.profileId ?? null;
        if (body.doctorName !== undefined) patch.doctorName = body.doctorName?.trim() || null;
        if (body.prescriptionDate !== undefined) patch.prescriptionDate = body.prescriptionDate;
        if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
        if (body.medicines !== undefined) patch.medicinesJson = JSON.stringify(body.medicines);

        const [updated] = await db
          .update(prescriptions)
          .set(patch)
          .where(eq(prescriptions.id, params.id))
          .returning();
        if (!updated) return new Response(null, { status: 404 });

        const profilesMap = await buildProfilesMap(session.user.id);
        return Response.json(toDto(updated, profilesMap));
      },
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        await db
          .delete(prescriptions)
          .where(and(eq(prescriptions.id, params.id), eq(prescriptions.userId, session.user.id)));

        return new Response(null, { status: 204 });
      },
    },
  },
});
