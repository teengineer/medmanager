// Lazy wrapper around tesseract.js for reading the *printed* GS1 lines under an
// İTS karekod when the DataMatrix itself won't decode (small, low-contrast print
// on iOS Safari). All engine assets — worker, wasm core and the eng language
// model — are self-hosted under /tesseract (no third-party CDN — KVKK/GDPR
// friendly, matching zxingWasm.ts) and fetched only on first OCR use.

import { yymmddToIso, type Gs1Result } from "./gs1";

type TesseractWorker = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
  setParameters: (params: Record<string, string>) => Promise<unknown>;
};

let workerPromise: Promise<TesseractWorker> | null = null;

async function getWorker(): Promise<TesseractWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, OEM, PSM } = await import("tesseract.js");
      // Self-hosted paths (served from our own origin's /public).
      const worker = await createWorker("eng", OEM.LSTM_ONLY, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract",
        langPath: "/tesseract",
      });
      await worker.setParameters({
        // The printed strip is a few short lines of GS1 data.
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        // Only the glyphs that appear in GS1 human-readable text.
        tessedit_char_whitelist: "0123456789()./:-SKTskt ",
      });
      return worker as unknown as TesseractWorker;
    })();
  }
  return workerPromise;
}

/** EAN-13 / GTIN-13 checksum — used to pick the real barcode out of OCR noise. */
function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += (code.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10 === code.charCodeAt(12) - 48;
}

/** Parse the OCR'd text of the printed GS1 strip into a scan result. */
export function parseOcrText(text: string): Gs1Result | null {
  const out: Gs1Result = { raw: text };

  // GTIN: the (01) line, e.g. "(01)08699546099429".
  const gtinMatch = text.match(/\(?\s*0?1\s*\)?\s*([0-9]{13,14})/);
  if (gtinMatch?.[1]) {
    out.gtin = gtinMatch[1].padStart(14, "0");
  } else {
    // Fallback: any 13-digit run that passes the EAN-13 checksum (avoids
    // mistaking the 12-digit serial for the barcode).
    const candidates = text.match(/\d{13}/g) ?? [];
    const valid = candidates.find(isValidEan13);
    if (valid) out.gtin = valid.padStart(14, "0");
  }

  // Expiry: printed human-readable as MM.YYYY, e.g. "(17)S.K.T.:01.2028".
  const expMatch = text.match(/\(?\s*17\s*\)?[^0-9]*([0-9]{2})[.\-/]([0-9]{4})/);
  if (expMatch?.[1] && expMatch[2]) {
    const mm = expMatch[1];
    const yyyy = expMatch[2];
    // Reuse the shared YYMMDD→ISO helper (DD=00 → end of month).
    out.expiryDate = yymmddToIso(`${yyyy.slice(2)}${mm}00`);
  }

  return out.gtin || out.expiryDate ? out : null;
}

/**
 * OCR a single captured frame. Returns the parsed printed GS1 data, or null
 * when nothing usable is recognized.
 */
export async function ocrGs1FromCanvas(canvas: HTMLCanvasElement): Promise<Gs1Result | null> {
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas);
  return parseOcrText(data.text);
}
