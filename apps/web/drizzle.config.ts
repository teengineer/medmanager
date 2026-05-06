import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./medmanager.db";
const isRemote = url.startsWith("libsql:") || url.startsWith("http");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: isRemote
    ? { url, authToken: process.env.DATABASE_AUTH_TOKEN ?? "" }
    : { url },
  verbose: false,
  strict: true,
});
