import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { drugProducts } from "~/db/schema";
import { auth } from "~/lib/auth";
import { gtinToEan13, parseDrugName } from "~/server/drugs";

export const Route = createFileRoute("/api/gtin/$code")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { code: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const ean13 = gtinToEan13(params.code);
        if (!/^\d{8,14}$/.test(ean13)) {
          return Response.json({ error: "invalid_barcode" }, { status: 400 });
        }

        const [row] = await db
          .select()
          .from(drugProducts)
          .where(eq(drugProducts.barcode, ean13))
          .limit(1);

        if (!row) return Response.json({ found: false }, { status: 404 });

        const info = parseDrugName(row.name);
        return Response.json({
          found: true,
          barcode: row.barcode,
          fullName: row.name,
          name: info.baseName,
          activeIngredient: row.activeIngredient,
          atcCode: row.atcCode,
          strength: info.strength ?? null,
          form: info.form ?? null,
          packageCount: info.packageCount ?? null,
          packageUnit: info.packageUnit ?? null,
        });
      },
    },
  },
});
