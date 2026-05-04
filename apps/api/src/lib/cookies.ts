import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { config, isDev, isTest } from "../config.js";

export const REFRESH_COOKIE = "medmanager.rt";

function isSecure(): boolean {
  return !isDev() && !isTest();
}

export function setRefreshCookie(c: Context, value: string, expiresAt: Date): void {
  setCookie(c, REFRESH_COOKIE, value, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: "Lax",
    expires: expiresAt,
    path: "/",
  });
}

export function clearRefreshCookie(c: Context): void {
  deleteCookie(c, REFRESH_COOKIE, {
    path: "/",
    secure: isSecure(),
  });
}

export { config };
