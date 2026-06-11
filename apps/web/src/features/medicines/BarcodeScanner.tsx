import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { parseScannedCode, type Gs1Result } from "./gs1";

interface Props {
  onResult: (result: Gs1Result) => void;
  onClose: () => void;
}

/**
 * Camera modal that scans GS1 DataMatrix (İTS karekod), QR and EAN-13 codes.
 * The zxing decoder is imported lazily so it never lands in the main bundle.
 */
export function BarcodeScanner({ onResult, onClose }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep latest callbacks in refs so the effect runs exactly once.
  const onResultRef = useRef(onResult);
  const onCloseRef = useRef(onClose);
  onResultRef.current = onResult;
  onCloseRef.current = onClose;

  useEffect(() => {
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
        const reader = new BrowserMultiFormatReader(hints);

        if (stopped || !videoRef.current) return;
        controls = await reader.decodeFromVideoDevice(
          undefined, // default (environment-facing) camera
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

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      stopped = true;
      controls?.stop();
      document.removeEventListener("keydown", onKey);
    };
  }, [t]);

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
          ) : (
            <>
              <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="size-44 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
              </div>
            </>
          )}
        </div>

        <p className="px-5 py-4 text-center text-sm text-mute">{t("medicine.scan_hint")}</p>
      </div>
    </div>
  );
}
