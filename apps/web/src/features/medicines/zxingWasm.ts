// Lazy wrapper around zxing-wasm (zxing-cpp compiled to WebAssembly).
// zxing-cpp decodes GS1 DataMatrix far more reliably than the pure-JS
// @zxing/library, so it serves as the DataMatrix engine on browsers that lack
// the native BarcodeDetector API (notably iOS Safari). The wasm binary is
// self-hosted from our own origin (no third-party CDN — KVKK/GDPR friendly)
// and fetched only on first use, so it never weighs on the initial page load.

let modulePromise: Promise<typeof import("zxing-wasm/reader")> | null = null;

async function loadReader() {
  if (!modulePromise) {
    modulePromise = (async () => {
      const mod = await import("zxing-wasm/reader");
      const { default: wasmUrl } = await import("zxing-wasm/reader/zxing_reader.wasm?url");
      // Override the default jsDelivr CDN lookup with our own asset URL.
      mod.prepareZXingModule({
        overrides: { locateFile: () => wasmUrl },
        fireImmediately: true,
      });
      return mod;
    })();
  }
  return modulePromise;
}

/**
 * Decode a single frame. Returns the raw text of the first valid
 * DataMatrix / QR / EAN-13 symbol, or null when nothing decodes.
 */
export async function decodeImageDataWasm(imageData: ImageData): Promise<string | null> {
  const mod = await loadReader();
  const results = await mod.readBarcodes(imageData, {
    formats: ["DataMatrix", "QRCode", "EAN-13"],
    tryHarder: true,
    tryInvert: true,
    tryDownscale: true,
    maxNumberOfSymbols: 1,
  });
  for (const r of results) {
    if (r.isValid && r.text) return r.text;
  }
  return null;
}

/** Warm up the wasm module ahead of the first decode (fire-and-forget). */
export function preloadZxingWasm() {
  void loadReader().catch(() => {});
}
