import { eq } from "drizzle-orm";
import type { AuthContext } from "./auth-middleware.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

export async function resolveLocale(c: AuthContext): Promise<"tr" | "en"> {
  const user = c.get("user");
  if (user?.sub) {
    const rows = await db.select().from(users).where(eq(users.id, user.sub)).limit(1);
    const row = rows[0];
    if (row) return row.locale === "en" ? "en" : "tr";
  }
  const al = c.req.header("accept-language");
  if (al) {
    const first = al.split(",")[0]?.trim().toLowerCase() ?? "";
    if (first.startsWith("en")) return "en";
    if (first.startsWith("tr")) return "tr";
  }
  return "tr";
}
