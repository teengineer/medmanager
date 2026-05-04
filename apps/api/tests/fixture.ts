import { migrate } from "drizzle-orm/libsql/migrator";
import type { Hono } from "hono";
import { asCookieJar } from "./helpers.js";

let appPromise: Promise<Hono> | null = null;

export async function getApp(): Promise<Hono> {
  if (!appPromise) {
    appPromise = (async () => {
      const { buildApp } = await import("../src/app.js");
      const { db } = await import("../src/db/client.js");
      const { seedUseCases } = await import("../src/db/seed.js");
      await migrate(db, { migrationsFolder: "./drizzle" });
      await seedUseCases();
      return buildApp();
    })();
  }
  return appPromise;
}

export function createClient() {
  const jar = asCookieJar();

  async function request(path: string, init: RequestInit = {}) {
    const app = await getApp();
    const headers = new Headers(init.headers);
    if (!headers.has("Cookie")) {
      const cookie = jar.header();
      if (cookie) headers.set("Cookie", cookie);
    }
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const res = await app.request(path, { ...init, headers });
    jar.captureFrom(res);
    return res;
  }

  return { request, jar };
}

export type TestClient = ReturnType<typeof createClient>;
