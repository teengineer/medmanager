import { useTranslation } from "react-i18next";
import type { Medicine } from "./hooks";

interface Props {
  medicines: Medicine[];
  onDismiss: () => void;
}

export function ExpiredMedicinesModal({ medicines, onDismiss }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expired-alert-title"
    >
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onDismiss}
      />
      <div className="animate-pop relative w-full max-w-md rounded-[2rem] border border-line bg-white p-6 shadow-pop">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-dark">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h2 id="expired-alert-title" className="font-bold text-ink">
              {t("medicine.expired_alert.title")}
            </h2>
            <p className="mt-0.5 text-sm text-mute">
              {t("medicine.expired_alert.subtitle")}
            </p>
          </div>
        </div>

        <ul className="mb-5 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-line bg-canvas-soft p-3">
          {medicines.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-ink">{m.name}</span>
              <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-dark">
                {m.effectiveExpiry.slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onDismiss} className="btn-primary w-full">
          {t("medicine.expired_alert.dismiss")}
        </button>
      </div>
    </div>
  );
}
