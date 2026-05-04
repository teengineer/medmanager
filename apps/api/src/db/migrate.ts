import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./client.js";
import { seedUseCases } from "./seed.js";

async function main() {
  console.log("Running migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Seeding use-cases…");
  await seedUseCases();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
