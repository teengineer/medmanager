import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { Medicine } from "./hooks";

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { t } = useTranslation();

  const status = medicine.isExpired
    ? "expired"
    : medicine.daysUntilExpiry <= 30
      ? "expiring"
      : "ok";

  const accentBar =
    status === "expired"
      ? "bg-slate-300"
      : status === "expiring"
        ? "bg-amber-400"
        : "bg-brand";

  const badgeCls =
    status === "expired"
      ? "bg-slate-100 text-slate-600 border-slate-200"
      : status === "expiring"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-brand-light text-brand-dark border-brand/20";

  const dotCls =
    status === "expired"
      ? "bg-slate-400"
      : status === "expiring"
        ? "bg-amber-500"
        : "bg-brand";

  return (
    <Link
      to="/medicines/$id"
      params={{ id: medicine.id }}
      className="group relative flex gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accentBar}`} aria-hidden />

      {medicine.image && (
        <img
          src={medicine.image}
          alt={medicine.name}
          className="h-20 w-20 shrink-0 rounded-lg object-contain"
        />
      )}

      <div className="flex w-full flex-col gap-2 pl-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={`truncate text-lg font-semibold ${status === "expired" ? "text-slate-500" : "text-slate-900"}`}>
              {medicine.name}
            </h3>
            {medicine.strength && (
              <p className="text-sm text-slate-500">{medicine.strength}</p>
            )}
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}>
            <span className={`size-1.5 rounded-full ${dotCls}`} />
            {status === "expired"
              ? t("medicine.expired")
              : status === "expiring"
                ? t("medicine.expiring_in_days", { count: medicine.daysUntilExpiry })
                : t("medicine.valid")}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-slate-600">
          <svg viewBox="0 0 24 24" className="size-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
          </svg>
          <span>
            {t("medicine.effective_expiry")}: <strong className="font-semibold text-slate-800">{medicine.effectiveExpiry}</strong>
          </span>
        </p>

        {medicine.useCases.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {medicine.useCases.slice(0, 4).map((uc) => (
              <span
                key={uc.id}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
              >
                {uc.name}
              </span>
            ))}
            {medicine.useCases.length > 4 && (
              <span className="self-center text-xs text-slate-500">+{medicine.useCases.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
