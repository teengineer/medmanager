import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let _pool: pg.Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

function getDb(): NodePgDatabase<typeof schema> {
  if (_db) return _db;
  _pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  _db = drizzle(_pool, { schema });
  return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Db = NodePgDatabase<typeof schema>;
