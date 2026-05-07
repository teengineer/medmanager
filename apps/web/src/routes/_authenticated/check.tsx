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
    <main className="mx-auto max-w-2xl p-4 pb-24 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("check.title")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{t("check.subtitle")}</p>
        </div>
      </div>

      {!selected ? (
        <>
          <div className="relative mb-5">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("check.search_placeholder")}
              className="input-base py-3.5 pl-12 pr-4 text-base"
            />
          </div>

          {useCases.isLoading ? (
            <div className="grid grid-cols-2 gap-2.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 animate-fade-in">
                {filteredUseCases.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected({ id: u.id, name: u.name })}
                    className="group rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-base font-medium text-slate-800 shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:bg-brand-50 hover:text-brand-dark hover:shadow-pop"
                  >
                    <span className="line-clamp-2">{u.name}</span>
                  </button>
                ))}
              </div>
              {normalized.length >= 2 && !exactExists && (
                <button
                  onClick={addAndSelect}
                  disabled={createUseCase.isPending}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand bg-white px-4 py-4 text-base font-semibold text-brand transition hover:bg-brand-50 disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  {t("check.add_use_case", { name: q.trim() })}
                </button>
              )}
              {!useCases.isLoading && filteredUseCases.length === 0 && normalized.length < 2 && (
                <p className="mt-6 text-center text-sm text-slate-500">{t("check.type_to_search")}</p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
            <button
              onClick={() => setSelected(null)}
              className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand hover:text-brand"
              aria-label={t("common.back")}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-slate-900">{selected.name}</h2>
          </div>

          {search.isLoading ? (
            <p className="text-slate-500">{t("common.loading")}</p>
          ) : (search.data?.items ?? []).length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3M8 11h6" strokeLinecap="round" />
                </svg>
              </span>
              <p className="mt-3 text-slate-600">{t("check.no_matches")}</p>
            </div>
          ) : (
            <div className="grid gap-3 animate-fade-in">
              {search.data!.items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setShowcase(m)}
                  className="group relative overflow-hidden rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-white to-brand-50 p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:shadow-pop"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-slate-900">{m.name}</p>
                      {m.strength && <p className="text-sm text-slate-600">{m.strength}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark shadow-soft">
                      {t("medicine.days_left", { count: m.daysUntilExpiry })}
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                    <svg viewBox="0 0 24 24" className="size-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                    </svg>
                    {t("medicine.quantity")}: <strong className="font-semibold text-slate-800">{m.quantity} {m.unit}</strong>
                  </p>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-white via-brand-50 to-white p-6 animate-fade-in">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-soft transition hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
        {t("check.close")}
      </button>
      <div className="flex max-w-3xl flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-brand-light px-4 py-1 text-sm font-semibold uppercase tracking-wider text-brand-dark">
          MedManager
        </span>
        <p className="bg-gradient-to-br from-brand to-brand-dark bg-clip-text text-6xl font-bold text-transparent sm:text-7xl">
          {medicine.name}
        </p>
        {medicine.strength && (
          <p className="text-3xl font-medium text-slate-700 sm:text-4xl">{medicine.strength}</p>
        )}
        <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {t("medicine.effective_expiry")}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">{medicine.effectiveExpiry}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {t("medicine.quantity")}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {medicine.quantity} {medicine.unit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
