import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;

function getDb(): LibSQLDatabase<typeof schema> {
  if (_db) return _db;
  _client = createClient({
    url: process.env.DATABASE_URL ?? "file:./medmanager.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Db = LibSQLDatabase<typeof schema>;
