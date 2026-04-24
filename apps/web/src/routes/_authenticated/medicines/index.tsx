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
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">{t("medicine.my_medicines")}</h1>
        <Link
          to="/medicines/new"
          className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
        >
          {t("medicine.add")}
        </Link>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("medicine.search_placeholder")}
        className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "valid", "expiring", "expired", "opened", "unopened"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              filter === f
                ? "border-brand bg-brand text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t(`medicine.filter.${f}`)}
          </button>
        ))}
      </div>

      {medicines.isLoading ? (
        <p className="text-slate-500">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-500">{t("medicine.empty")}</p>
          <Link
            to="/medicines/new"
            className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-white"
          >
            {t("medicine.add_first")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <MedicineCard key={m.id} medicine={m} />
          ))}
        </div>
      )}
    </main>
  );
}
