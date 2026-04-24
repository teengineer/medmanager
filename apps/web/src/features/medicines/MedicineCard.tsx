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

  const statusCls =
    status === "expired"
      ? "bg-slate-100 text-slate-500 border-slate-300 line-through"
      : status === "expiring"
        ? "bg-amber-100 text-amber-900 border-amber-300"
        : "bg-brand-light text-brand-dark border-brand/30";

  return (
    <Link
      to="/medicines/$id"
      params={{ id: medicine.id }}
      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{medicine.name}</h3>
          {medicine.strength && (
            <p className="text-sm text-slate-500">{medicine.strength}</p>
          )}
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${statusCls}`}>
          {status === "expired"
            ? t("medicine.expired")
            : status === "expiring"
              ? t("medicine.expiring_in_days", { count: medicine.daysUntilExpiry })
              : t("medicine.valid")}
        </span>
      </div>

      <p className="text-sm text-slate-600">
        {t("medicine.effective_expiry")}: <strong>{medicine.effectiveExpiry}</strong>
      </p>

      {medicine.useCases.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {medicine.useCases.slice(0, 4).map((uc) => (
            <span key={uc.id} className="rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark">
              {uc.name}
            </span>
          ))}
          {medicine.useCases.length > 4 && (
            <span className="text-xs text-slate-500">+{medicine.useCases.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  );
}
