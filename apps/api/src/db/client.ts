import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "../config.js";
import * as schema from "./schema.js";

const client = createClient({
  url: config.database.url,
  authToken: config.database.authToken,
});

export const db = drizzle(client, { schema });
export type Db = typeof db;
export { client as rawClient };
