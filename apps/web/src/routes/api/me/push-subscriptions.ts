import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { pushSubscriptions } from "~/db/schema";
import { auth } from "~/lib/auth";
import { jsonError } from "~/server/medicines";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1024),
  p256dh: z.string().min(1).max(256),
  auth: z.string().min(1).max(128),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(1024),
});

export const Route = createFileRoute("/api/me/push-subscriptions")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = subscribeSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);
        const body = parsed.data;
        const userId = session.user.id;

        const [existing] = await db
          .select()
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, body.endpoint))
          .limit(1);

        if (!existing) {
          await db.insert(pushSubscriptions).values({
            userId,
            endpoint: body.endpoint,
            p256dh: body.p256dh,
            auth: body.auth,
          });
        } else {
          await db
            .update(pushSubscriptions)
            .set({ userId, p256dh: body.p256dh, auth: body.auth })
            .where(eq(pushSubscriptions.id, existing.id));
        }
        return new Response(null, { status: 204 });
      },
      DELETE: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });

        const parsed = unsubscribeSchema.safeParse(await request.json());
        if (!parsed.success) return jsonError(parsed.error);

        const userId = session.user.id;
        await db
          .delete(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.endpoint, parsed.data.endpoint),
              eq(pushSubscriptions.userId, userId),
            ),
          );
        return new Response(null, { status: 204 });
      },
    },
  },
});
