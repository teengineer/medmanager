import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { medicines } from "~/db/schema";
import { auth } from "~/lib/auth";

const DATA_URL_RE = /^data:([\w/+.-]+);base64,(.+)$/s;

export const Route = createFileRoute("/api/medicines/$id/image")({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const [row] = await db
          .select({ image: medicines.image })
          .from(medicines)
          .where(and(eq(medicines.id, params.id), eq(medicines.userId, session.user.id)))
          .limit(1);
        if (!row?.image) return new Response(null, { status: 404 });

        const match = row.image.match(DATA_URL_RE);
        if (!match) return new Response(null, { status: 404 });
        const [, mime, b64] = match;
        const bytes = Buffer.from(b64!, "base64");

        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": mime ?? "image/jpeg",
            "Content-Length": String(bytes.byteLength),
            // URL is versioned with ?v=updatedAt, so the payload is immutable.
            "Cache-Control": "private, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
