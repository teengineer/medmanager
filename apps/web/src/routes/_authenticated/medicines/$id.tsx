import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useDeleteMedicine, useMedicine, useOpenMedicine } from "../../../features/medicines/hooks";
import type { Medicine } from "../../../features/medicines/hooks";

export const Route = createFileRoute("/_authenticated/medicines/$id")({
  component: MedicineDetailPage,
});

function MedicineDetailPage() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const medicine = useMedicine(id);
  const open = useOpenMedicine();
  const del = useDeleteMedicine();

  if (medicine.isLoading) {
    return <p className="p-6 text-slate-500">{t("common.loading")}</p>;
  }
  if (!medicine.data) {
    return <p className="p-6 text-slate-500">{t("medicine.not_found")}</p>;
  }
  const m = medicine.data;
  const status = statusOf(m);
  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fmt = (isoDate: string) => dateFmt.format(new Date(isoDate));

  return (
    <main className="mx-auto max-w-2xl p-4 pb-28">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/medicines" className="hover:text-brand">
          {t("medicine.my_medicines")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{m.name}</span>
      </nav>

      {/* Hero card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{m.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
              {m.strength && <span>{m.strength}</span>}
              {m.strength && m.form && <span>·</span>}
              {m.form && <span className="capitalize">{m.form}</span>}
              {m.activeIngredient && (
                <>
                  <span>·</span>
                  <span className="italic">{m.activeIngredient}</span>
                </>
              )}
            </div>
          </div>
          <StatusBadge status={status} medicine={m} />
        </div>

        {/* Countdown */}
        <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-4">
          <CountdownTile status={status} days={m.daysUntilExpiry} />
          <dl className="space-y-2 text-sm">
            <DateRow label={t("medicine.effective_expiry")} value={fmt(m.effectiveExpiry)} bold />
            <DateRow label={t("medicine.expiry")} value={fmt(m.expiryDate)} />
          </dl>
        </div>
      </section>

      {/* Info tiles */}
      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InfoTile label={t("medicine.quantity")} value={`${m.quantity} ${m.unit}`} />
        <InfoTile
          label={t("medicine.opened_at")}
          value={m.openedAt ? fmt(m.openedAt) : t("medicine.unopened_state")}
          tone={m.isOpened ? "default" : "muted"}
        />
        {m.openedShelfLifeDays != null && (
          <InfoTile
            label={t("medicine.opened_shelf_life_days")}
            value={`${m.openedShelfLifeDays} ${t("medicine.days_unit")}`}
          />
        )}
      </section>

      {/* Use cases */}
      {m.useCases.length > 0 && (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("medicine.use_cases")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {m.useCases.map((uc) => (
              <span
                key={uc.id}
                className="rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-brand-dark"
              >
                {uc.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      {m.notes && (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("medicine.notes")}
          </h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{m.notes}</p>
        </section>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {!m.isOpened && (
          <button
            onClick={() => open.mutate({ id: m.id })}
            disabled={open.isPending}
            className="flex-1 rounded-xl bg-brand px-4 py-3 font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {open.isPending ? t("common.saving") : t("medicine.open_lid")}
          </button>
        )}
        <Link
          to="/medicines/$id/edit"
          params={{ id: m.id }}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-medium text-slate-700 hover:bg-slate-50"
        >
          {t("common.edit")}
        </Link>
        <button
          onClick={async () => {
            if (!confirm(t("medicine.confirm_delete"))) return;
            await del.mutateAsync(m.id);
            await navigate({ to: "/medicines" });
          }}
          disabled={del.isPending}
          className="rounded-xl border border-red-200 bg-white px-4 py-3 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 sm:w-auto"
        >
          {t("common.delete")}
        </button>
      </div>
    </main>
  );
}

type Status = "expired" | "expiring" | "valid";

function statusOf(m: Medicine): Status {
  if (m.isExpired) return "expired";
  if (m.daysUntilExpiry <= 30) return "expiring";
  return "valid";
}

function StatusBadge({ status, medicine }: { status: Status; medicine: Medicine }) {
  const { t } = useTranslation();
  if (status === "expired") {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
        {t("medicine.expired")}
      </span>
    );
  }
  if (status === "expiring") {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
        {t("medicine.expiring_in_days", { count: medicine.daysUntilExpiry })}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-brand-dark">
      {t("medicine.valid")}
    </span>
  );
}

function CountdownTile({ status, days }: { status: Status; days: number }) {
  const { t } = useTranslation();

  if (status === "expired") {
    return (
      <div className="flex min-w-28 flex-col items-center rounded-2xl bg-slate-50 px-5 py-4 text-center">
        <svg viewBox="0 0 24 24" className="size-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
        </svg>
        <p className="mt-1 text-xs font-medium text-slate-500">{t("medicine.expired")}</p>
      </div>
    );
  }

  const tone =
    status === "expiring"
      ? "bg-amber-50 text-amber-900"
      : "bg-brand-light text-brand-dark";

  return (
    <div className={`flex min-w-28 flex-col items-center rounded-2xl px-5 py-4 text-center ${tone}`}>
      <p className="text-3xl font-bold leading-none">{days}</p>
      <p className="mt-1 text-xs font-medium opacity-80">{t("medicine.days_remaining")}</p>
    </div>
  );
}

function DateRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={bold ? "font-semibold text-slate-900" : "text-slate-700"}>{value}</dd>
    </div>
  );
}

function InfoTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${tone === "muted" ? "text-slate-400" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
