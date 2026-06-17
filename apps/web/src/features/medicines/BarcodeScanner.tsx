import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseScannedCode, type Gs1Result } from "./gs1";
import { ocrGs1FromCanvas } from "./ocr";
import { decodeImageDataWasm, preloadZxingWasm } from "./zxingWasm";

interface Props {
  onResult: (result: Gs1Result) => void;
  onClose: () => void;
}

// zoom / focusMode are not yet in the TS lib for MediaTrack* types
interface ExtendedCapabilities extends MediaTrackCapabilities {
  zoom?: { min: number; max: number; step: number };
  focusMode?: string[];
}

/**
 * Camera modal that scans GS1 DataMatrix (İTS karekod), QR and EAN-13 codes.
 * The zxing decoder is imported lazily so it never lands in the main bundle.
 * Opens the camera at high resolution and exposes a digital zoom slider so
 * small codes can be read without moving inside the lens' focus distance.
 */
interface CanvasDecoder {
  decodeFromCanvas(canvas: HTMLCanvasElement): { getText(): string };
}

// Native Barcode Detection API — available on Android Chrome and decodes
// GS1 DataMatrix far more reliably (and faster) than zxing's pure-JS engine.
// Not yet in TS lib DOM types, so we declare the slice we use.
interface NativeBarcode {
  rawValue: string;
  format: string;
}
interface NativeDetector {
  detect(source: CanvasImageSource): Promise<NativeBarcode[]>;
}
interface NativeDetectorCtor {
  new (opts?: { formats?: string[] }): NativeDetector;
  getSupportedFormats?(): Promise<string[]>;
}
const NATIVE_FORMATS = ["data_matrix", "qr_code", "ean_13"];

function getNativeDetectorCtor(): NativeDetectorCtor | null {
  return (globalThis as unknown as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector ?? null;
}

/** Draw the current video frame into `canvas`, downscaled so its longest side
 * is at most `maxSide`, and return its pixels for a wasm decode. */
function frameToImageData(
  video: HTMLVideoElement,
  maxSide: number,
  canvas: HTMLCanvasElement,
): ImageData | null {
  const longest = Math.max(video.videoWidth, video.videoHeight);
  if (!longest) return null;
  const scale = Math.min(1, maxSide / longest);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Crop the centre `fraction` of the frame (the guide-box area) at native
 * resolution and return its pixels. Small DataMatrix codes survive far better
 * here than in a whole-frame downscale — critical on iOS Safari where zxing-wasm
 * is the only decoder. */
function centerCropImageData(
  video: HTMLVideoElement,
  fraction: number,
  canvas: HTMLCanvasElement,
): ImageData | null {
  if (!video.videoWidth) return null;
  const side = Math.floor(Math.min(video.videoWidth, video.videoHeight) * fraction);
  if (!side) return null;
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(
    video,
    (video.videoWidth - side) / 2,
    (video.videoHeight - side) / 2,
    side,
    side,
    0,
    0,
    side,
    side,
  );
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function BarcodeScanner({ onResult, onClose }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const readerRef = useRef<CanvasDecoder | null>(null);
  const nativeDetectorRef = useRef<NativeDetector | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [zoomCaps, setZoomCaps] = useState<{ min: number; max: number; step: number } | null>(null);
  const [captureReady, setCaptureReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [captureFailed, setCaptureFailed] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);
  // Camera stays off until the user explicitly starts scanning.
  const [phase, setPhase] = useState<"idle" | "scanning">("idle");

  // Keep latest callbacks in refs so the effect runs exactly once.
  const onResultRef = useRef(onResult);
  const onCloseRef = useRef(onClose);
  onResultRef.current = onResult;
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (phase !== "scanning") return;
    let stopped = false;
    let controls: { stop: () => void } | null = null;
    let nativeTimer: ReturnType<typeof setInterval> | null = null;
    let wasmTimer: ReturnType<typeof setInterval> | null = null;
    const wasmCanvas = document.createElement("canvas");

    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
          await Promise.all([import("@zxing/browser"), import("@zxing/library")]);

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints);
        readerRef.current = reader;

        if (stopped || !videoRef.current) return;
        // High resolution lets zxing resolve small DataMatrix codes from a
        // comfortable distance instead of forcing the user inside macro range.
        controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 2560 },
              height: { ideal: 1440 },
            },
          },
          videoRef.current,
          (result) => {
            if (!result || stopped) return;
            const parsed = parseScannedCode(result.getText());
            if (!parsed.gtin && !parsed.expiryDate) return; // keep scanning
            stopped = true;
            controls?.stop();
            onResultRef.current(parsed);
          },
        );

        // Native detector (Android Chrome) runs in parallel on the same video
        // stream — it reads DataMatrix far better than zxing, so whichever fires
        // first wins. Falls through silently when the API is unavailable.
        const Ctor = getNativeDetectorCtor();
        if (Ctor) {
          try {
            const supported = (await Ctor.getSupportedFormats?.()) ?? null;
            const formats = supported
              ? NATIVE_FORMATS.filter((f) => supported.includes(f))
              : NATIVE_FORMATS;
            if (formats.length > 0) {
              const detector = new Ctor({ formats });
              nativeDetectorRef.current = detector;
              nativeTimer = setInterval(async () => {
                const video = videoRef.current;
                if (stopped || !video || !video.videoWidth) return;
                try {
                  const codes = await detector.detect(video);
                  for (const code of codes) {
                    const parsed = parseScannedCode(code.rawValue);
                    if (parsed.gtin || parsed.expiryDate) {
                      stopped = true;
                      if (nativeTimer) clearInterval(nativeTimer);
                      controls?.stop();
                      onResultRef.current(parsed);
                      return;
                    }
                  }
                } catch {
                  // transient detect() failure (e.g. video not ready) — retry next tick
                }
              }, 250);
            }
          } catch {
            // detector construction failed — zxing fallback already running
          }
        }

        // zxing-wasm (zxing-cpp) fallback — only when the native detector is
        // missing (iOS Safari, older browsers). On Android the native path
        // already reads DataMatrix instantly, so we skip the wasm CPU cost
        // there entirely.
        if (!Ctor) {
          preloadZxingWasm();
          let wasmBusy = false;
          let tick = 0;
          wasmTimer = setInterval(async () => {
            const video = videoRef.current;
            if (stopped || wasmBusy || !video || !video.videoWidth) return;
            wasmBusy = true;
            try {
              // Alternate: even ticks read the centre guide-box crop at native
              // resolution (best for small DataMatrix), odd ticks read the whole
              // downscaled frame (catches codes outside the box). The crop is the
              // one that actually rescues tiny İTS karekods on iOS Safari.
              const imageData =
                tick % 2 === 0
                  ? centerCropImageData(video, 0.6, wasmCanvas)
                  : frameToImageData(video, 1280, wasmCanvas);
              tick += 1;
              if (imageData) {
                const text = await decodeImageDataWasm(imageData);
                if (text && !stopped) {
                  const parsed = parseScannedCode(text);
                  if (parsed.gtin || parsed.expiryDate) {
                    stopped = true;
                    if (wasmTimer) clearInterval(wasmTimer);
                    controls?.stop();
                    onResultRef.current(parsed);
                    return;
                  }
                }
              }
            } catch {
              // wasm still warming up or no symbol in frame — retry next tick
            } finally {
              wasmBusy = false;
            }
          }, 400);
        }

        // Post-setup: continuous autofocus + digital zoom where supported.
        const stream = videoRef.current?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0] ?? null;
        trackRef.current = track;
        if (track && typeof track.getCapabilities === "function") {
          const caps = track.getCapabilities() as ExtendedCapabilities;
          if (caps.focusMode?.includes("continuous")) {
            track
              .applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] })
              .catch(() => {});
          }
          if (caps.zoom && caps.zoom.max > caps.zoom.min) {
            const step = caps.zoom.step || 0.1;
            setZoomCaps({ min: caps.zoom.min, max: caps.zoom.max, step });
            // Start mildly zoomed-in: code appears larger while the box stays
            // at a distance the lens can still focus on.
            const initial = Math.min(caps.zoom.min + (caps.zoom.max - caps.zoom.min) * 0.35, 3);
            setZoom(initial);
            track
              .applyConstraints({ advanced: [{ zoom: initial } as MediaTrackConstraintSet] })
              .catch(() => {});
          }
        }
      } catch (err) {
        if (stopped) return;
        const name = err instanceof Error ? err.name : "";
        setError(
          name === "NotAllowedError" || name === "NotFoundError"
            ? t("medicine.scan_camera_error")
            : t("medicine.scan_generic_error"),
        );
      }
    })();

    // If continuous scanning hasn't succeeded within 3s, offer a photo capture.
    const captureTimer = setTimeout(() => setCaptureReady(true), 3000);

    return () => {
      stopped = true;
      controls?.stop();
      if (nativeTimer) clearInterval(nativeTimer);
      if (wasmTimer) clearInterval(wasmTimer);
      nativeDetectorRef.current = null;
      clearTimeout(captureTimer);
    };
  }, [phase, t]);

  const handleCapture = () => {
    const video = videoRef.current;
    const reader = readerRef.current;
    if (!video || !reader || !video.videoWidth) return;
    setAnalyzing(true);
    setCaptureFailed(false);

    // Defer so the "analyzing" state paints before the sync decode work.
    setTimeout(async () => {
      try {
        const attempts: HTMLCanvasElement[] = [];

        // 1) Full frame at native camera resolution
        const full = document.createElement("canvas");
        full.width = video.videoWidth;
        full.height = video.videoHeight;
        full.getContext("2d")?.drawImage(video, 0, 0);
        attempts.push(full);

        // 2) Center crop (the guide-frame area) upscaled 2× — helps tiny codes
        const side = Math.floor(Math.min(video.videoWidth, video.videoHeight) * 0.6);
        const crop = document.createElement("canvas");
        crop.width = side * 2;
        crop.height = side * 2;
        crop
          .getContext("2d")
          ?.drawImage(
            video,
            (video.videoWidth - side) / 2,
            (video.videoHeight - side) / 2,
            side,
            side,
            0,
            0,
            side * 2,
            side * 2,
          );
        attempts.push(crop);

        // Priority: native detector → zxing-wasm (zxing-cpp) → zxing-js.
        const nativeDetector = nativeDetectorRef.current;
        for (const canvas of attempts) {
          if (nativeDetector) {
            try {
              const codes = await nativeDetector.detect(canvas);
              for (const code of codes) {
                const parsed = parseScannedCode(code.rawValue);
                if (parsed.gtin || parsed.expiryDate) {
                  setAnalyzing(false);
                  onResultRef.current(parsed);
                  return;
                }
              }
            } catch {
              // native detect failed for this canvas — fall through
            }
          }
          if (!nativeDetector) {
            try {
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
              const text = imageData ? await decodeImageDataWasm(imageData) : null;
              if (text) {
                const parsed = parseScannedCode(text);
                if (parsed.gtin || parsed.expiryDate) {
                  setAnalyzing(false);
                  onResultRef.current(parsed);
                  return;
                }
              }
            } catch {
              // wasm decode failed for this canvas — fall through to zxing-js
            }
          }
          try {
            const result = reader.decodeFromCanvas(canvas);
            const parsed = parseScannedCode(result.getText());
            if (parsed.gtin || parsed.expiryDate) {
              setAnalyzing(false);
              onResultRef.current(parsed);
              return;
            }
          } catch {
            // not found in this attempt — try the next one
          }
        }
        setCaptureFailed(true);
      } finally {
        setAnalyzing(false);
      }
    }, 30);
  };

  // OCR fallback: when the DataMatrix won't decode, read the *printed* GS1 lines
  // (the (01)/(17) text beside the karekod) with tesseract.js and feed the result
  // through the same parent lookup as a normal scan.
  const handleOcr = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setOcrBusy(true);
    setOcrFailed(false);
    setTimeout(async () => {
      try {
        // Full frame at native resolution — the printed digits are tiny, so we
        // keep every pixel rather than downscaling.
        const full = document.createElement("canvas");
        full.width = video.videoWidth;
        full.height = video.videoHeight;
        full.getContext("2d")?.drawImage(video, 0, 0);

        const parsed = await ocrGs1FromCanvas(full);
        if (parsed && (parsed.gtin || parsed.expiryDate)) {
          onResultRef.current(parsed);
          return;
        }
        setOcrFailed(true);
      } catch {
        setOcrFailed(true);
      } finally {
        setOcrBusy(false);
      }
    }, 30);
  };

  // Manual fallback: the user types the human-readable barcode (the (01) line
  // above the karekod) when the camera can't decode the DataMatrix. We feed it
  // through the same parser so the parent's GTIN lookup runs identically.
  const handleManualSubmit = () => {
    const digits = manualCode.replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 14) {
      setManualError(true);
      return;
    }
    const parsed = parseScannedCode(digits);
    if (!parsed.gtin) {
      setManualError(true);
      return;
    }
    onResultRef.current(parsed);
  };

  const applyZoom = (value: number) => {
    setZoom(value);
    trackRef.current
      ?.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] })
      .catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("medicine.scan_title")}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-line bg-white shadow-pop animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">{t("medicine.scan_title")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-mute transition hover:bg-canvas hover:text-ink"
            aria-label={t("common.cancel")}
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="relative mx-5 overflow-hidden rounded-2xl bg-ink">
          {error ? (
            <p className="px-4 py-10 text-center text-sm text-white/80">{error}</p>
          ) : phase === "idle" ? (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 p-6">
              <svg viewBox="0 0 24 24" className="size-12 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" strokeLinecap="round" />
                <path d="M7 12h2m2 0h2m2 0h2" strokeLinecap="round" />
              </svg>
              <button type="button" onClick={() => setPhase("scanning")} className="btn-primary text-sm">
                {t("medicine.scan_start")}
              </button>
              <p className="text-center text-xs text-white/60">{t("medicine.scan_start_hint")}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="size-44 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
              </div>
              {zoomCaps && zoom !== null && (
                <div className="absolute inset-x-6 bottom-3 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-white/90" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3M9 11h4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="range"
                    min={zoomCaps.min}
                    max={zoomCaps.max}
                    step={zoomCaps.step}
                    value={zoom}
                    onChange={(e) => applyZoom(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer accent-white"
                    aria-label={t("medicine.scan_zoom")}
                  />
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-white/90" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3M9 11h4M11 9v4" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </>
          )}
        </div>

        {!error && captureReady && (
          <div className="px-5 pt-4">
            <button
              type="button"
              onClick={handleCapture}
              disabled={analyzing}
              className="btn-primary w-full text-sm"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 8a2 2 0 012-2h1.2a2 2 0 001.6-.8l.9-1.2a2 2 0 011.6-.8h1.4a2 2 0 011.6.8l.9 1.2a2 2 0 001.6.8H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
                <circle cx="12" cy="12.5" r="3.2" />
              </svg>
              {analyzing ? t("medicine.scan_capture_analyzing") : t("medicine.scan_capture_button")}
            </button>
            {captureFailed && (
              <p className="mt-2 text-center text-xs text-amber-700">
                {t("medicine.scan_capture_failed")}
              </p>
            )}

            <button
              type="button"
              onClick={handleOcr}
              disabled={ocrBusy}
              className="btn-secondary mt-2 w-full text-sm"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7V5a1 1 0 011-1h2M17 4h2a1 1 0 011 1v2M20 17v2a1 1 0 01-1 1h-2M7 20H5a1 1 0 01-1-1v-2" strokeLinecap="round" />
                <path d="M8 9h2m4 0h2M8 12h8M8 15h5" strokeLinecap="round" />
              </svg>
              {ocrBusy ? t("medicine.scan_ocr_analyzing") : t("medicine.scan_ocr_button")}
            </button>
            {ocrFailed && (
              <p className="mt-2 text-center text-xs text-amber-700">
                {t("medicine.scan_ocr_failed")}
              </p>
            )}

            <div className="mt-4 border-t border-line pt-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-soft">
                  {t("medicine.scan_manual_label")}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={manualCode}
                    onChange={(e) => {
                      setManualCode(e.target.value);
                      setManualError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleManualSubmit();
                      }
                    }}
                    placeholder={t("medicine.scan_manual_placeholder")}
                    className="input-base"
                  />
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={!manualCode.trim()}
                    className="btn-secondary shrink-0 whitespace-nowrap text-sm"
                  >
                    {t("medicine.scan_manual_submit")}
                  </button>
                </div>
              </label>
              <p className="mt-1.5 text-xs text-mute">{t("medicine.scan_manual_hint")}</p>
              {manualError && (
                <p className="mt-1 text-xs text-red-600">{t("medicine.scan_manual_invalid")}</p>
              )}
            </div>
          </div>
        )}

        <p className="px-5 py-4 text-center text-sm text-mute">{t("medicine.scan_hint")}</p>
      </div>
    </div>
  );
}
