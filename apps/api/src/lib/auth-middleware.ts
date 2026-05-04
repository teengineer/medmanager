import type { Context, Next } from "hono";
import { verifyAccessToken, type AccessTokenClaims } from "./tokens.js";

export interface AuthVariables {
  user?: AccessTokenClaims;
}

export type AuthContext = Context<{ Variables: AuthVariables }>;

export async function optionalAuth(c: AuthContext, next: Next) {
  const header = c.req.header("Authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    const claims = await verifyAccessToken(token);
    if (claims) c.set("user", claims);
  }
  await next();
}

export async function requireAuth(c: AuthContext, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return c.body(null, 401);
  }
  const token = header.slice(7).trim();
  const claims = await verifyAccessToken(token);
  if (!claims?.sub) return c.body(null, 401);
  c.set("user", claims);
  await next();
}

export function currentUserId(c: AuthContext): string {
  const user = c.get("user");
  if (!user?.sub) throw new Error("Not authenticated");
  return user.sub;
}
