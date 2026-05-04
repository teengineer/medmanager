import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from "../lib/cookies.js";
import { toMeDto } from "../lib/me.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  createAccessToken,
  findActiveRefresh,
  issueRefreshToken,
  revokeRefresh,
} from "../lib/tokens.js";

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  locale: z.enum(["tr", "en"]),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  accessToken: z.string().min(1),
});

export const authRouter = new Hono();

authRouter.post("/auth/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");
  const email = body.email.trim().toLowerCase();

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return c.json({ errors: [{ field: "email", message: "Email already registered." }] }, 409);
  }

  const [row] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword(body.password),
      locale: body.locale,
      firstName: body.firstName?.trim() || null,
      lastName: body.lastName?.trim() || null,
    })
    .returning();
  if (!row) return c.body(null, 500);

  const access = await createAccessToken(row);
  const refresh = await issueRefreshToken(row.id);
  setRefreshCookie(c, refresh.plainText, refresh.expiresAt);

  return c.json({
    accessToken: access,
    expiresInSeconds: config.jwt.accessMinutes * 60,
    user: toMeDto(row),
  });
});

authRouter.post("/auth/login", zValidator("json", loginSchema), async (c) => {
  const body = c.req.valid("json");
  const email = body.email.trim().toLowerCase();

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    return c.body(null, 401);
  }

  const access = await createAccessToken(user);
  const refresh = await issueRefreshToken(user.id);
  setRefreshCookie(c, refresh.plainText, refresh.expiresAt);

  return c.json({
    accessToken: access,
    expiresInSeconds: config.jwt.accessMinutes * 60,
    user: toMeDto(user),
  });
});

authRouter.post("/auth/refresh", async (c) => {
  const plain = getCookie(c, REFRESH_COOKIE);
  if (!plain) return c.body(null, 401);

  const existing = await findActiveRefresh(plain);
  if (!existing) {
    clearRefreshCookie(c);
    return c.body(null, 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, existing.userId)).limit(1);
  if (!user) return c.body(null, 401);

  await revokeRefresh(existing.id);
  const access = await createAccessToken(user);
  const refresh = await issueRefreshToken(user.id);
  setRefreshCookie(c, refresh.plainText, refresh.expiresAt);

  return c.json({
    accessToken: access,
    expiresInSeconds: config.jwt.accessMinutes * 60,
    user: toMeDto(user),
  });
});

authRouter.post("/auth/logout", async (c) => {
  const plain = getCookie(c, REFRESH_COOKIE);
  if (plain) {
    const existing = await findActiveRefresh(plain);
    if (existing) await revokeRefresh(existing.id);
  }
  clearRefreshCookie(c);
  return c.body(null, 204);
});

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
}

async function validateGoogle(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as GoogleUserInfo;
  } catch {
    return null;
  }
}

function splitName(full: string | undefined): { first: string | null; last: string | null } {
  if (!full?.trim()) return { first: null, last: null };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0] ?? null, last: null };
  return { first: parts[0] ?? null, last: parts.slice(1).join(" ") };
}

authRouter.post("/auth/google", zValidator("json", googleSchema), async (c) => {
  const body = c.req.valid("json");
  const info = await validateGoogle(body.accessToken);
  if (!info?.email) return c.body(null, 401);

  const email = info.email.trim().toLowerCase();
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    const { first, last } = splitName(info.name);
    const [row] = await db
      .insert(users)
      .values({
        email,
        passwordHash: "",
        locale: "tr",
        firstName: first,
        lastName: last,
      })
      .returning();
    user = row;
  } else if (!user.firstName && info.name) {
    const { first, last } = splitName(info.name);
    await db.update(users).set({ firstName: first, lastName: last }).where(eq(users.id, user.id));
    user = { ...user, firstName: first, lastName: last };
  }

  if (!user) return c.body(null, 500);

  const access = await createAccessToken(user);
  const refresh = await issueRefreshToken(user.id);
  setRefreshCookie(c, refresh.plainText, refresh.expiresAt);

  return c.json({
    accessToken: access,
    expiresInSeconds: config.jwt.accessMinutes * 60,
    user: toMeDto(user),
  });
});
