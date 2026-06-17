// GS1 DataMatrix payload parser for Turkish pharmaceutical karekods (İTS).
// Payload is a sequence of (AI, value) pairs; variable-length values are
// terminated by the GS character (ASCII 29) or end of input.

const GS = String.fromCharCode(29);

// AIs we care about: fixed lengths per GS1 spec.
const FIXED_AI: Record<string, number> = {
  "01": 14, // GTIN
  "11": 6, // production date YYMMDD
  "15": 6, // best-before YYMMDD
  "17": 6, // expiry YYMMDD
};
const VARIABLE_AI = new Set(["10", "21", "30", "240", "241"]);

export interface Gs1Result {
  gtin?: string;
  /** ISO YYYY-MM-DD */
  expiryDate?: string;
  lot?: string;
  serial?: string;
  raw: string;
}

export function yymmddToIso(v: string): string | undefined {
  if (!/^\d{6}$/.test(v)) return undefined;
  const yy = parseInt(v.slice(0, 2), 10);
  const mm = parseInt(v.slice(2, 4), 10);
  let dd = parseInt(v.slice(4, 6), 10);
  if (mm < 1 || mm > 12) return undefined;
  const year = 2000 + yy; // pharma expiry dates are always 20xx
  // GS1: DD=00 means "end of month"
  if (dd === 0) dd = new Date(year, mm, 0).getDate();
  const iso = `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}

/** Parse a scanned code. Handles GS1 DataMatrix payloads and plain EAN-13. */
export function parseScannedCode(text: string): Gs1Result {
  const raw = text;
  // Strip symbology identifier if the scanner included it (e.g. "]d2", "]Q3")
  const s = text.replace(/^\][A-Za-z]\d/, "");
  // Some readers map FNC1 to the literal GS char already; normalize nothing else.

  // Plain EAN-13 / UPC barcode (old boxes without karekod)
  if (/^\d{12,14}$/.test(s)) {
    return { gtin: s.padStart(14, "0"), raw };
  }

  const out: Gs1Result = { raw };
  let i = 0;
  while (i < s.length) {
    // Skip stray GS separators between elements
    if (s[i] === GS) {
      i += 1;
      continue;
    }
    const ai2 = s.slice(i, i + 2);
    const ai3 = s.slice(i, i + 3);

    if (FIXED_AI[ai2] !== undefined) {
      const len = FIXED_AI[ai2];
      const value = s.slice(i + 2, i + 2 + len);
      i += 2 + len;
      if (ai2 === "01") out.gtin = value;
      if (ai2 === "17") out.expiryDate = yymmddToIso(value);
      continue;
    }

    const varAi = VARIABLE_AI.has(ai3) ? ai3 : VARIABLE_AI.has(ai2) ? ai2 : null;
    if (varAi) {
      const start = i + varAi.length;
      const gsIdx = s.indexOf(GS, start);
      const value = gsIdx === -1 ? s.slice(start) : s.slice(start, gsIdx);
      i = gsIdx === -1 ? s.length : gsIdx + 1;
      if (varAi === "10") out.lot = value;
      if (varAi === "21") out.serial = value;
      continue;
    }

    // Unknown AI — cannot determine its length reliably; skip to next GS.
    const gsIdx = s.indexOf(GS, i);
    if (gsIdx === -1) break;
    i = gsIdx + 1;
  }

  return out;
}
