import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const { seedUseCases } = await import("../src/db/seed");

await seedUseCases();
console.log("[bundanvar] seed complete");
process.exit(0);
