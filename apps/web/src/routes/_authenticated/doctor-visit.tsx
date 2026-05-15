import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMedicines } from "../../features/medicines/hooks";
import { useProfiles } from "../../features/profiles/hooks";
import type { Medicine } from "../../features/medicines/hooks";
import type { Profile } from "../../features/profiles/hooks";

export const Route = createFileRoute("/_authenticated/doctor-visit")({
  component: DoctorVisitPage,
});

function DoctorVisitPage() {
  const { t, i18n } = useTranslation();
  const medicines = useMedicines();
  const profiles = useProfiles();

  const today = new Date().toLocaleDateString(i18n.language, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const allItems = medicines.data?.items ?? [];
  const activeItems = allItems.filter((m) => !m.isExpired);
  const expiredItems = allItems.filter((m) => m.isExpired);

  const profileMap = new Map<string, Profile>();
  for (const p of profiles.data ?? []) {
    profileMap.set(p.id, p);
  }

  // Group medicines by profileId (null → "general")
  function groupByProfile(items: Medicine[]) {
    const groups = new Map<string | null, Medicine[]>();
    groups.set(null, []);
    for (const p of profiles.data ?? []) {
      groups.set(p.id, []);
    }
    for (const m of items) {
      const key = m.profileId ?? null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return groups;
  }

  const activeGroups = groupByProfile(activeItems);

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const fmt = (d: string) => dateFmt.format(new Date(d));

  return (
    <>
      <style>{`@media print { header { display: none!important; } nav { display: none!important; } .print-hide { display: none!important; } .print-show { display: block!important; } }`}</style>

      <main className="mx-auto max-w-3xl p-4 pb-24 sm:p-6">
        {/* Page header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t("doctor_visit.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{today}</p>
            <p className="mt-0.5 text-sm text-slate-400">{t("doctor_visit.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="print-hide btn-primary flex items-center gap-2 text-sm"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="6 9 6 2 18 2 18 9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeLinecap="round" />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
            {t("doctor_visit.print")}
          </button>
        </div>

        {medicines.isLoading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <p className="font-medium text-slate-500">{t("doctor_visit.no_medicines")}</p>
          </div>
        ) : (
          <>
            {/* Active medicines grouped by profile */}
            {Array.from(activeGroups.entries()).map(([profileId, meds]) => {
              if (meds.length === 0) return null;
              const profile = profileId ? profileMap.get(profileId) : null;
              const groupLabel = profile ? profile.name : t("doctor_visit.general");
              return (
                <section key={profileId ?? "general"} className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    {profile?.color && (
                      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: profile.color }} />
                    )}
                    <h2 className="text-base font-semibold text-slate-700">{groupLabel}</h2>
                  </div>
                  <div className="grid gap-3">
                    {meds.map((m) => (
                      <MedicineRow key={m.id} medicine={m} fmt={fmt} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Expired medicines */}
            {expiredItems.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-3 text-base font-semibold text-slate-400">
                  {t("doctor_visit.expired_section")}
                </h2>
                <div className="grid gap-3 opacity-60">
                  {expiredItems.map((m) => (
                    <MedicineRow key={m.id} medicine={m} fmt={fmt} muted />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Disclaimer */}
        <p className="mt-8 text-center text-xs text-slate-400">{t("doctor_visit.disclaimer")}</p>
      </main>
    </>
  );
}

function MedicineRow({
  medicine: m,
  fmt,
  muted = false,
}: {
  medicine: Medicine;
  fmt: (d: string) => string;
  muted?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${
        muted ? "border-slate-100" : "border-slate-200 shadow-sm"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={`font-semibold ${muted ? "text-slate-400" : "text-slate-900"}`}>{m.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {[m.strength, m.form, m.activeIngredient ? `(${m.activeIngredient})` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>
            {t("medicine.expiry")}: {fmt(m.expiryDate)}
          </p>
          <p>
            {m.quantity} {m.unit}
          </p>
        </div>
      </div>
      {m.useCases.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.useCases.map((uc) => (
            <span
              key={uc.id}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {uc.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
