import { Hono } from "hono";

export const healthRouter = new Hono().get("/health", (c) => c.json({ ok: true, version: "0.1.0" }));
