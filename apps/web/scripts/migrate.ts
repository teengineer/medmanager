import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "../src/db/index";
import { seedUseCases } from "../src/db/seed";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[medmanager] migrations applied");
  await seedUseCases();
  console.log("[medmanager] seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("[medmanager] migrate failed:", err);
  process.exit(1);
});
