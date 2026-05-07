import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MedicineCard } from "../../../features/medicines/MedicineCard";
import { useMedicines } from "../../../features/medicines/hooks";

export const Route = createFileRoute("/_authenticated/medicines/")({
  component: MedicinesPage,
});

type Filter = "all" | "valid" | "expiring" | "expired" | "opened" | "unopened";

function MedicinesPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const params: Parameters<typeof useMedicines>[0] = { q: q || undefined };
  if (filter === "valid") params.expired = false;
  if (filter === "expired") params.expired = true;
  if (filter === "opened") params.opened = true;
  if (filter === "unopened") params.opened = false;

  const medicines = useMedicines(params);

  const items = (medicines.data?.items ?? []).filter((m) => {
    if (filter === "expiring") return !m.isExpired && m.daysUntilExpiry <= 30;
    return true;
  });

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24 sm:p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("medicine.my_medicines")}
          </h1>
          {medicines.data && (
            <p className="mt-0.5 text-sm text-slate-500">
              {t("medicine.count", { count: medicines.data.items.length })}
            </p>
          )}
        </div>
        <Link
          to="/medicines/new"
          className="btn-primary text-sm"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">{t("medicine.add")}</span>
        </Link>
      </header>

      <div className="relative mb-3">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("medicine.search_placeholder")}
          className="input-base pl-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-5 -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {(["all", "valid", "expiring", "expired", "opened", "unopened"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f
                ? "border-brand bg-gradient-to-br from-brand to-brand-dark text-white shadow-brand"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {t(`medicine.filter.${f}`)}
          </button>
        ))}
      </div>

      {medicines.isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-10 text-center animate-fade-in">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="7" width="18" height="13" rx="3" />
              <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" />
              <path d="M12 11v5M9.5 13.5h5" strokeLinecap="round" />
            </svg>
          </span>
          <p className="mt-3 font-medium text-slate-700">{t("medicine.empty")}</p>
          <Link to="/medicines/new" className="btn-primary mt-5 inline-flex">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            {t("medicine.add_first")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 animate-fade-in">
          {items.map((m) => (
            <MedicineCard key={m.id} medicine={m} />
          ))}
        </div>
      )}
    </main>
  );
}
