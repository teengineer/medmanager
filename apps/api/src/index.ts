import { serve } from "@hono/node-server";
import { migrate } from "drizzle-orm/libsql/migrator";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { db } from "./db/client.js";
import { seedUseCases } from "./db/seed.js";
import { startExpiryNotifier } from "./workers/expiryNotifier.js";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await seedUseCases();

  const app = buildApp();
  const stopNotifier = startExpiryNotifier();

  serve({ fetch: app.fetch, port: config.port }, (info) => {
    console.log(`medmanager API listening on http://localhost:${info.port}`);
  });

  const shutdown = () => {
    stopNotifier();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
