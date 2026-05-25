import { eq } from "drizzle-orm";
import { db } from "~/db";
import { user as userTable } from "~/db/schema";

export function localeFromUser(
  user: { locale?: string | null } | null | undefined,
  acceptLanguage?: string | null,
): "tr" | "en" {
  const loc = user?.locale;
  if (loc === "en") return "en";
  if (loc === "tr") return "tr";
  if (acceptLanguage) {
    const first = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
    if (first.startsWith("en")) return "en";
  }
  return "tr";
}

export async function resolveLocale(
  userId: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Promise<"tr" | "en"> {
  if (userId) {
    const rows = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
    const row = rows[0];
    if (row) return row.locale === "en" ? "en" : "tr";
  }
  if (acceptLanguage) {
    const first = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
    if (first.startsWith("en")) return "en";
    if (first.startsWith("tr")) return "tr";
  }
  return "tr";
}
