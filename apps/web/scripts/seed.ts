import { seedUseCases } from "../src/db/seed";

async function main() {
  await seedUseCases();
  console.log("[medmanager] seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("[medmanager] seed failed:", err);
  process.exit(1);
});
