import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { pushSubscriptions } from "../db/schema.js";
import type { AuthVariables } from "../lib/auth-middleware.js";
import { currentUserId, requireAuth } from "../lib/auth-middleware.js";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1024),
  p256dh: z.string().min(1).max(256),
  auth: z.string().min(1).max(128),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(1024),
});

export const pushRouter = new Hono<{ Variables: AuthVariables }>();

pushRouter.get("/push/vapid-public-key", (c) =>
  c.json({ publicKey: config.push.publicKey || null, configured: config.push.configured }),
);

pushRouter.post(
  "/me/push-subscriptions",
  requireAuth,
  zValidator("json", subscribeSchema),
  async (c) => {
    const userId = currentUserId(c);
    const body = c.req.valid("json");

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
    return c.body(null, 204);
  },
);

pushRouter.delete(
  "/me/push-subscriptions",
  requireAuth,
  zValidator("json", unsubscribeSchema),
  async (c) => {
    const userId = currentUserId(c);
    const { endpoint } = c.req.valid("json");
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)));
    return c.body(null, 204);
  },
);
