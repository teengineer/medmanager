import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { refreshTokens, type User } from "../db/schema.js";

const encoder = new TextEncoder();
const signingKey = encoder.encode(config.jwt.signingKey);

export interface AccessTokenClaims {
  sub: string;
  email: string;
  locale: string;
}

export async function createAccessToken(user: User): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    locale: user.locale,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(config.jwt.issuer)
    .setAudience(config.jwt.audience)
    .setIssuedAt()
    .setExpirationTime(`${config.jwt.accessMinutes}m`)
    .sign(signingKey);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    return {
      sub: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      locale: String(payload.locale ?? "tr"),
    };
  } catch {
    return null;
  }
}

function generatePlainTextToken(bytes = 32): string {
  return randomBytes(bytes)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function hashToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

export interface IssuedRefresh {
  plainText: string;
  expiresAt: Date;
}

export async function issueRefreshToken(userId: string): Promise<IssuedRefresh> {
  const plain = generatePlainTextToken();
  const expires = new Date(Date.now() + config.jwt.refreshDays * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(plain),
    expiresAt: expires.toISOString(),
  });
  return { plainText: plain, expiresAt: expires };
}

export async function findActiveRefresh(plain: string) {
  const hash = hashToken(plain);
  const nowIso = new Date().toISOString();
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(
      and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, nowIso)),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function revokeRefresh(id: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(refreshTokens.id, id));
}
