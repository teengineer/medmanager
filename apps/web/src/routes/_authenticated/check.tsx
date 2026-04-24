import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api/client";
import type { Medicine } from "../../features/medicines/hooks";
import { useCreateUseCase, useUseCases } from "../../features/medicines/hooks";
import { BackButton } from "../../features/navigation/BackButton";

export const Route = createFileRoute("/_authenticated/check")({
  component: CheckPage,
});

function CheckPage() {
  const { t } = useTranslation();
  const useCases = useUseCases();
  const createUseCase = useCreateUseCase();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [q, setQ] = useState("");

  const search = useQuery<{ items: Medicine[] }>({
    queryKey: ["search", selected?.id],
    queryFn: () => api<{ items: Medicine[] }>(`/search?useCase=${selected!.id}`),
    enabled: Boolean(selected),
  });

  const [showcase, setShowcase] = useState<Medicine | null>(null);

  const normalized = q.trim().toLocaleLowerCase();
  const filteredUseCases = (useCases.data ?? []).filter((u) =>
    u.name.toLocaleLowerCase().includes(normalized),
  );
  const exactExists = (useCases.data ?? []).some(
    (u) => u.name.toLocaleLowerCase() === normalized,
  );

  const addAndSelect = async () => {
    const name = q.trim();
    if (!name) return;
    const created = await createUseCase.mutateAsync(name);
    setSelected({ id: created.id, name: created.name });
    setQ("");
  };

  if (showcase) {
    return <FullscreenCard medicine={showcase} onClose={() => setShowcase(null)} />;
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold text-brand">{t("check.title")}</h1>
      </div>
      <p className="mb-6 text-slate-600">{t("check.subtitle")}</p>

      {!selected ? (
        <>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("check.search_placeholder")}
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-3 text-base"
          />
          {useCases.isLoading ? (
            <p className="text-slate-500">{t("common.loading")}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {filteredUseCases.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected({ id: u.id, name: u.name })}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-left text-lg font-medium text-slate-800 shadow-sm hover:border-brand hover:bg-brand-light"
                  >
                    {u.name}
                  </button>
                ))}
              </div>
              {normalized.length >= 2 && !exactExists && (
                <button
                  onClick={addAndSelect}
                  disabled={createUseCase.isPending}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand bg-white px-4 py-4 text-lg font-medium text-brand hover:bg-brand-light disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  {t("check.add_use_case", { name: q.trim() })}
                </button>
              )}
              {!useCases.isLoading && filteredUseCases.length === 0 && normalized.length < 2 && (
                <p className="mt-4 text-sm text-slate-500">{t("check.type_to_search")}</p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label={t("common.back")}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">{selected.name}</h2>
          </div>

          {search.isLoading ? (
            <p className="text-slate-500">{t("common.loading")}</p>
          ) : (search.data?.items ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              {t("check.no_matches")}
            </div>
          ) : (
            <div className="grid gap-3">
              {search.data!.items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setShowcase(m)}
                  className="rounded-xl border-2 border-brand bg-brand-light p-4 text-left shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xl font-bold">{m.name}</p>
                      {m.strength && <p className="text-sm text-slate-600">{m.strength}</p>}
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-brand-dark">
                      {t("medicine.days_left", { count: m.daysUntilExpiry })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {t("medicine.quantity")}: {m.quantity} {m.unit}
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function FullscreenCard({ medicine, onClose }: { medicine: Medicine; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white p-6">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700"
      >
        {t("check.close")}
      </button>
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-7xl font-bold text-brand">{medicine.name}</p>
        {medicine.strength && (
          <p className="text-4xl text-slate-700">{medicine.strength}</p>
        )}
        <p className="mt-8 text-2xl text-slate-600">
          {t("medicine.effective_expiry")}:{" "}
          <strong className="text-slate-900">{medicine.effectiveExpiry}</strong>
        </p>
        <p className="text-xl text-slate-500">
          {t("medicine.quantity")}: {medicine.quantity} {medicine.unit}
        </p>
      </div>
    </div>
  );
}
