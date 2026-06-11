// Heuristics for splitting a TİTCK product name like
// "PAROL 500 MG TABLET, 30 TABLET" or "CALPOL 120 MG/5 ML SÜSPANSİYON, 100 ML"
// into structured hints for the medicine form.

export interface DrugNameInfo {
  /** Product name without the trailing package segment */
  baseName: string;
  /** e.g. "500 mg", "120 mg/5 ml", "%1" */
  strength?: string;
  /** canonical lowercase form, e.g. "tablet", "şurup" */
  form?: string;
  packageCount?: number;
  /** unit matching the form's quantity field, e.g. "tablet", "ml" */
  packageUnit?: string;
}

const FORM_KEYWORDS: Array<[RegExp, string]> = [
  [/KAPS[UÜ]L/u, "kapsül"],
  [/TABLET/u, "tablet"],
  [/DRAJE/u, "draje"],
  [/ŞURUP/u, "şurup"],
  [/S[UÜ]SPANSİYON|S[UÜ]SPANSIYON/u, "süspansiyon"],
  [/SOL[UÜ]SYON/u, "solüsyon"],
  [/DAMLA/u, "damla"],
  [/SPREY/u, "sprey"],
  [/KREM/u, "krem"],
  [/JEL/u, "jel"],
  [/POMAD|MERHEM/u, "pomad"],
  [/LOSYON/u, "losyon"],
  [/ŞAMPUAN/u, "şampuan"],
  [/AMPUL/u, "ampul"],
  [/FLAKON/u, "flakon"],
  [/ENJEKSİYON|ENJEKTABL/u, "enjeksiyon"],
  [/SUPOZİTUVAR/u, "supozituvar"],
  [/OV[UÜ]L/u, "ovül"],
  [/GRAN[UÜ]L/u, "granül"],
  [/SAŞE|ŞASE/u, "saşe"],
  [/PAST[İI]L/u, "pastil"],
];

const COUNTABLE_UNITS =
  /(TABLET|KAPS[UÜ]L|DRAJE|SAŞE|ŞASE|AMPUL|FLAKON|SUPOZİTUVAR|OV[UÜ]L|PAST[İI]L|ADET|DOZ|KAPSUL)/u;

export function parseDrugName(rawName: string): DrugNameInfo {
  const name = rawName.trim();
  const upper = name.toLocaleUpperCase("tr");

  // Package segment: text after the last comma, e.g. ", 30 TABLET" / ", 100 ML"
  let baseName = name;
  let packageCount: number | undefined;
  let packageUnit: string | undefined;

  const lastComma = name.lastIndexOf(",");
  if (lastComma !== -1) {
    const tail = upper.slice(lastComma + 1).trim();
    const countable = tail.match(new RegExp(`^(\\d+)\\s*${COUNTABLE_UNITS.source}`, "u"));
    const measurable = tail.match(/^(\d+(?:[.,]\d+)?)\s*(ML|GR?|L)\b/u);
    if (countable?.[1] && countable[2]) {
      packageCount = parseInt(countable[1], 10);
      const unitWord = countable[2].toLocaleLowerCase("tr");
      packageUnit = unitWord === "kapsul" ? "kapsül" : unitWord;
      baseName = name.slice(0, lastComma).trim();
    } else if (measurable?.[1] && measurable[2]) {
      packageCount = parseFloat(measurable[1].replace(",", "."));
      const mUnit = measurable[2].toLocaleLowerCase("tr");
      packageUnit = mUnit === "gr" ? "g" : mUnit;
      baseName = name.slice(0, lastComma).trim();
    }
  }

  // Strength: "500 MG", "120 MG/5 ML", "%1", "1000 IU"
  const upperBase = baseName.toLocaleUpperCase("tr");
  const strengthMatch =
    upperBase.match(/(\d+(?:[.,]\d+)?)\s*(MG|MCG|MIKROGRAM|G|IU|İ\.?Ü\.?|TU|M[İI]U)(\s*\/\s*\d+(?:[.,]\d+)?\s*(?:ML|MG|G|DOZ))?/u) ??
    upperBase.match(/%\s*\d+(?:[.,]\d+)?/u);
  const strength = strengthMatch
    ? strengthMatch[0].toLocaleLowerCase("tr").replace(/\s+/g, " ").trim()
    : undefined;

  let form: string | undefined;
  for (const [re, canonical] of FORM_KEYWORDS) {
    if (re.test(upperBase)) {
      form = canonical;
      break;
    }
  }

  return { baseName, strength, form, packageCount, packageUnit };
}

/** Normalize a scanned GTIN (12–14 digits) to the 13-digit EAN used by TİTCK. */
export function gtinToEan13(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (digits.length === 14 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}
