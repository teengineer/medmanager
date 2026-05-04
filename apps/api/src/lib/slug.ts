export function slugify(input: string): string {
  const trMap: Record<string, string> = {
    ı: "i", İ: "i", ğ: "g", Ğ: "g", ü: "u", Ü: "u",
    ş: "s", Ş: "s", ö: "o", Ö: "o", ç: "c", Ç: "c",
  };
  const normalized = [...input]
    .map((ch) => trMap[ch] ?? ch)
    .join("")
    .toLowerCase();

  let slug = "";
  for (const ch of normalized) {
    if (/[a-z0-9]/.test(ch)) slug += ch;
    else if (/[\s\-_]/.test(ch)) slug += "-";
  }
  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slug || "custom";
}
