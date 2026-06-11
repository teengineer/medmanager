import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseScannedCode, type Gs1Result } from "./gs1";

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

export function BarcodeScanner({ onResult, onClose }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const readerRef = useRef<CanvasDecoder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [zoomCaps, setZoomCaps] = useState<{ min: number; max: number; step: number } | null>(null);
  const [captureReady, setCaptureReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [captureFailed, setCaptureFailed] = useState(false);
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
    setTimeout(() => {
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

        for (const canvas of attempts) {
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
          </div>
        )}

        <p className="px-5 py-4 text-center text-sm text-mute">{t("medicine.scan_hint")}</p>
      </div>
    </div>
  );
}
