import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const { migrate } = await import("drizzle-orm/libsql/migrator");
const { db } = await import("../src/db/index");
const { seedUseCases } = await import("../src/db/seed");

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("[bundanvar] migrations applied");
await seedUseCases();
console.log("[bundanvar] seed complete");
process.exit(0);
