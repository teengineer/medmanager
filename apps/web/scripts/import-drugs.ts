/**
 * Imports the TİTCK licensed medicinal products list into the drug_products table.
 *
 * Usage:
 *   pnpm db:import-drugs                  # auto-discovers the newest list on titck.gov.tr
 *   pnpm db:import-drugs --file=path.xlsx # use a local file instead
 *   pnpm db:import-drugs --url=https://…  # use a specific URL
 *
 * Re-running is safe: rows are upserted by barcode. Run periodically (e.g. monthly)
 * to pick up newly licensed products.
 */
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const LIST_PAGE = "https://www.titck.gov.tr/dinamikmodul/85";
const UA = "Mozilla/5.0 (compatible; bundanvar-import/1.0)";

function argValue(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.slice(name.length + 3);
}

async function discoverLatestUrl(): Promise<string> {
  const res = await fetch(LIST_PAGE, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`TİTCK list page fetch failed: ${res.status}`);
  const html = await res.text();
  const matches = html.match(
    /https?:\/\/(?:www\.)?titck\.gov\.tr\/storage\/Archive\/\d+\/dynamicModulesAttachment\/[^"'\s]+\.xlsx/g,
  );
  if (!matches || matches.length === 0) {
    throw new Error("No .xlsx link found on the TİTCK page — pass --url= or --file= manually.");
  }
  return matches[0]; // page lists newest first
}

async function loadWorkbook(): Promise<XLSX.WorkBook> {
  const file = argValue("file");
  if (file) {
    console.log(`[import-drugs] reading local file: ${file}`);
    return XLSX.read(readFileSync(file), { type: "buffer" });
  }
  const url = argValue("url") ?? (await discoverLatestUrl());
  console.log(`[import-drugs] downloading: ${url}`);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return XLSX.read(Buffer.from(await res.arrayBuffer()), { type: "buffer" });
}

const wb = await loadWorkbook();
const sheetName = wb.SheetNames.find((n) => n.toLocaleUpperCase("tr").includes("RUHSATLI")) ?? wb.SheetNames[0];
const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
if (!sheet) throw new Error("Workbook has no sheets");
const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

// Find the header row (contains BARKOD) and column indices.
const headerIdx = rows.findIndex((r) => Array.isArray(r) && r.some((c) => String(c).trim() === "BARKOD"));
if (headerIdx === -1) throw new Error("BARKOD header not found in sheet");
const header = (rows[headerIdx] ?? []).map((c) => String(c ?? "").trim());
const col = {
  barcode: header.indexOf("BARKOD"),
  name: header.indexOf("ÜRÜN ADI"),
  active: header.indexOf("ETKİN MADDE"),
  atc: header.indexOf("ATC KODU"),
};
if (col.barcode === -1 || col.name === -1) throw new Error(`Unexpected columns: ${header.join(" | ")}`);

type Row = { barcode: string; name: string; activeIngredient: string | null; atcCode: string | null };
const products = new Map<string, Row>();
for (const r of rows.slice(headerIdx + 1)) {
  if (!Array.isArray(r)) continue;
  const barcode = String(r[col.barcode] ?? "").trim();
  const name = String(r[col.name] ?? "").trim();
  if (!/^\d{12,14}$/.test(barcode) || !name) continue;
  products.set(barcode, {
    barcode,
    name,
    activeIngredient: String(r[col.active] ?? "").trim() || null,
    atcCode: String(r[col.atc] ?? "").trim() || null,
  });
}
console.log(`[import-drugs] parsed ${products.size} products from sheet "${sheetName}"`);

const { db } = await import("../src/db/index");
const { drugProducts } = await import("../src/db/schema");
const { sql } = await import("drizzle-orm");

const all = [...products.values()];
const BATCH = 1000;
const now = new Date().toISOString();
for (let i = 0; i < all.length; i += BATCH) {
  const batch = all.slice(i, i + BATCH).map((p) => ({ ...p, updatedAt: now }));
  await db
    .insert(drugProducts)
    .values(batch)
    .onConflictDoUpdate({
      target: drugProducts.barcode,
      set: {
        name: sql`excluded.name`,
        activeIngredient: sql`excluded.active_ingredient`,
        atcCode: sql`excluded.atc_code`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
  console.log(`[import-drugs] upserted ${Math.min(i + BATCH, all.length)}/${all.length}`);
}

console.log("[import-drugs] done");
process.exit(0);
