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

type Mode = "useCase" | "activeIngredient";

function CheckPage() {
  const { t } = useTranslation();
  const useCases = useUseCases();
  const createUseCase = useCreateUseCase();
  const [mode, setMode] = useState<Mode>("useCase");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [q, setQ] = useState("");

  const search = useQuery<{ items: Medicine[] }>({
    queryKey: ["search", "useCase", selected?.id],
    queryFn: () => api<{ items: Medicine[] }>(`/search?useCase=${selected!.id}`),
    enabled: Boolean(selected),
  });

  const normalized = q.trim().toLocaleLowerCase();
  const ingredientQuery = mode === "activeIngredient" ? q.trim() : "";

  const ingredientSearch = useQuery<{ items: Medicine[] }>({
    queryKey: ["search", "activeIngredient", ingredientQuery.toLocaleLowerCase()],
    queryFn: () =>
      api<{ items: Medicine[] }>(
        `/search?activeIngredient=${encodeURIComponent(ingredientQuery)}`,
      ),
    enabled: mode === "activeIngredient" && ingredientQuery.length >= 2,
  });

  const [showcase, setShowcase] = useState<Medicine | null>(null);

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

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setQ("");
    setSelected(null);
  };

  if (showcase) {
    return <FullscreenCard medicine={showcase} onClose={() => setShowcase(null)} />;
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t("check.title")}
          </h1>
          <p className="mt-0.5 text-sm text-mute">{t("check.subtitle")}</p>
        </div>
      </div>

      {!selected ? (
        <>
          <div
            role="tablist"
            aria-label={t("check.mode_label")}
            className="surface-card mb-4 grid grid-cols-2 gap-1 p-1"
          >
            <button
              role="tab"
              aria-selected={mode === "useCase"}
              onClick={() => switchMode("useCase")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                mode === "useCase"
                  ? "bg-brand text-white shadow-soft"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t("check.mode_use_case")}
            </button>
            <button
              role="tab"
              aria-selected={mode === "activeIngredient"}
              onClick={() => switchMode("activeIngredient")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                mode === "activeIngredient"
                  ? "bg-brand text-white shadow-soft"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t("check.mode_active_ingredient")}
            </button>
          </div>

          <div className="relative mb-5">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mute"
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
              placeholder={
                mode === "useCase"
                  ? t("check.search_placeholder")
                  : t("check.search_placeholder_ingredient")
              }
              className="input-base py-3.5 pl-12 pr-4 text-base"
            />
          </div>

          {mode === "useCase" ? (
            useCases.isLoading ? (
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl border border-line bg-white" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 animate-fade-in">
                  {filteredUseCases.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelected({ id: u.id, name: u.name })}
                      className="group rounded-2xl border border-line bg-white px-4 py-4 text-left text-base font-medium text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:bg-brand-50 hover:text-brand-dark hover:shadow-pop"
                    >
                      <span className="line-clamp-2">{u.name}</span>
                    </button>
                  ))}
                </div>
                {normalized.length >= 2 && !exactExists && (
                  <button
                    onClick={addAndSelect}
                    disabled={createUseCase.isPending}
                    className="mt-3 flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-brand bg-white px-4 py-4 text-base font-semibold text-brand transition hover:bg-brand-50 disabled:opacity-60"
                  >
                    {t("check.add_use_case", { name: q.trim() })}
                  </button>
                )}
                {!useCases.isLoading && filteredUseCases.length === 0 && normalized.length < 2 && (
                  <p className="mt-6 text-center text-sm text-mute">{t("check.type_to_search")}</p>
                )}
              </>
            )
          ) : ingredientQuery.length < 2 ? (
            <p className="mt-6 text-center text-sm text-mute">
              {t("check.type_ingredient_to_search")}
            </p>
          ) : ingredientSearch.isLoading ? (
            <p className="text-mute">{t("common.loading")}</p>
          ) : (ingredientSearch.data?.items ?? []).length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line-strong bg-white/60 p-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-canvas-soft text-mute">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3M8 11h6" strokeLinecap="round" />
                </svg>
              </span>
              <p className="mt-3 text-ink-soft">{t("check.no_ingredient_matches")}</p>
            </div>
          ) : (
            <div className="grid gap-3 animate-fade-in">
              {ingredientSearch.data!.items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setShowcase(m)}
                  className="group relative overflow-hidden rounded-2xl border-2 border-brand/30 bg-gradient-to-br from-white to-brand-50 p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-brand hover:shadow-pop"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xl font-bold text-ink">{m.name}</p>
                      {m.activeIngredient && (
                        <p className="text-sm font-medium text-brand-dark">{m.activeIngredient}</p>
                      )}
                      {m.strength && <p className="text-sm text-ink-soft">{m.strength}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark shadow-soft">
                      {t("medicine.days_left", { count: m.daysUntilExpiry })}
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
                    <svg viewBox="0 0 24 24" className="size-3.5 text-mute" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                    </svg>
                    {t("medicine.quantity")}: <strong className="font-semibold text-ink">{m.quantity} {m.unit}</strong>
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="surface-card mb-5 flex items-center gap-3 p-3">
            <button
              onClick={() => setSelected(null)}
              className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition hover:border-brand hover:text-brand"
              aria-label={t("common.back")}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-ink">{selected.name}</h2>
          </div>

          {search.isLoading ? (
            <p className="text-mute">{t("common.loading")}</p>
          ) : (search.data?.items ?? []).length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line-strong bg-white/60 p-10 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-canvas-soft text-mute">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3M8 11h6" strokeLinecap="round" />
                </svg>
              </span>
              <p className="mt-3 text-ink-soft">{t("check.no_matches")}</p>
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
                      <p className="text-xl font-bold text-ink">{m.name}</p>
                      {m.strength && <p className="text-sm text-ink-soft">{m.strength}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark shadow-soft">
                      {t("medicine.days_left", { count: m.daysUntilExpiry })}
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
                    <svg viewBox="0 0 24 24" className="size-3.5 text-mute" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                    </svg>
                    {t("medicine.quantity")}: <strong className="font-semibold text-ink">{m.quantity} {m.unit}</strong>
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
        className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-soft shadow-soft transition hover:bg-canvas-soft"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
        {t("check.close")}
      </button>
      <div className="flex max-w-3xl flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-brand-light px-4 py-1 text-sm font-semibold uppercase tracking-wider text-brand-dark">
          Bundan Var
        </span>
        <p className="bg-gradient-to-br from-brand-400 to-brand-dark bg-clip-text text-6xl font-bold text-transparent sm:text-7xl">
          {medicine.name}
        </p>
        {medicine.strength && (
          <p className="text-3xl font-medium text-ink-soft sm:text-4xl">{medicine.strength}</p>
        )}
        <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
          <div className="surface-card p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-mute">
              {t("medicine.effective_expiry")}
            </p>
            <p className="mt-1 text-xl font-bold text-ink">{medicine.effectiveExpiry}</p>
          </div>
          <div className="surface-card p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-mute">
              {t("medicine.quantity")}
            </p>
            <p className="mt-1 text-xl font-bold text-ink">
              {medicine.quantity} {medicine.unit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
