import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useDeleteMedicine,
  useMedicine,
  useOpenMedicine,
  useArchiveMedicine,
  useUpdateMedicine,
} from "../../../features/medicines/hooks";
import type { Medicine } from "../../../features/medicines/hooks";
import { useProfiles } from "../../../features/profiles/hooks";

export const Route = createFileRoute("/_authenticated/medicines/$id/")({
  component: MedicineDetailPage,
});

function MedicineDetailPage() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const medicine = useMedicine(id);
  const profiles = useProfiles();
  const open = useOpenMedicine();
  const del = useDeleteMedicine();
  const archive = useArchiveMedicine();
  const update = useUpdateMedicine(id);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (medicine.isLoading) {
    return <p className="p-6 text-mute">{t("common.loading")}</p>;
  }
  if (!medicine.data) {
    return <p className="p-6 text-mute">{t("medicine.not_found")}</p>;
  }
  const m = medicine.data;
  const status = statusOf(m);
  const profile = m.profileId ? profiles.data?.find((p) => p.id === m.profileId) : null;
  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fmt = (isoDate: string) => dateFmt.format(new Date(isoDate));

  // Stock model: `quantity` is the units in a single box, `packageCount` how
  // many boxes are on hand, `consumed` how many units are already used. Total
  // units = quantity × packageCount. We paint one circle per unit; the first
  // `consumed` are filled. Remaining = total − consumed (the doctor-check value).
  const perBox = Math.max(0, Math.round(Number(m.quantity)) || 0);
  const boxes = Math.max(1, Math.round(m.packageCount ?? 1) || 1);
  const total = perBox * boxes;
  const consumed = Math.min(total, Math.max(0, m.consumed ?? 0));
  const remaining = total - consumed;
  const setConsumed = (next: number) => {
    const clamped = Math.min(total, Math.max(0, next));
    if (clamped === consumed) return;
    update.mutate({ consumed: clamped });
  };

  return (
    <main className="mx-auto max-w-2xl p-4 pb-28">
      <nav className="mb-4 text-sm text-mute">
        <Link to="/medicines" className="hover:text-brand">
          {t("medicine.my_medicines")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{m.name}</span>
      </nav>

      {/* Hero card */}
      <section className="surface-card rounded-[2rem] p-6 animate-rise">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold text-ink">{m.name}</h1>
              {m.archivedAt && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {t("medicine.archived_badge")}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-mute">
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
            {profile && (
              <div className="mt-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: profile.color ? `${profile.color}22` : "#f1f5f9",
                    color: profile.color ?? "#64748b",
                  }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: profile.color ?? "#94a3b8" }}
                  />
                  {profile.name}
                </span>
              </div>
            )}
          </div>
          <StatusBadge status={status} medicine={m} />
        </div>

        {/* Image — tap to open fullscreen */}
        {m.imageUrl && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block w-full cursor-zoom-in overflow-hidden rounded-2xl"
              aria-label={t("medicine.image_open")}
            >
              <img
                src={m.imageUrl}
                alt={m.name}
                className="h-40 w-full rounded-2xl object-contain transition hover:opacity-90"
              />
            </button>
          </div>
        )}
        {m.imageUrl && lightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-pop"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={m.name}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              aria-label={t("common.cancel")}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
            <img
              src={m.imageUrl}
              alt={m.name}
              onClick={(e) => e.stopPropagation()}
              className="max-h-screen max-w-full object-contain"
            />
          </div>
        )}

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
          label={t("medicine.package_count")}
          value={t("medicine.package_count_value", { count: m.packageCount })}
        />
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
        <section className="surface-card mt-4 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-mute">
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
        <section className="surface-card mt-4 p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
            {t("medicine.notes")}
          </h2>
          <p className="whitespace-pre-wrap text-sm text-ink-soft">{m.notes}</p>
        </section>
      )}

      {/* Usage tracking — one circle per unit; filled = consumed */}
      <section className="surface-card mt-4 p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-mute">
            {t("medicine.usage_log")}
          </h2>
          <p className="text-sm text-ink-soft">
            {t("medicine.remaining")}:{" "}
            <strong className="font-semibold text-ink">{remaining}</strong> / {total} {m.unit}
          </p>
        </div>

        {total === 0 ? (
          <p className="text-sm text-mute">{t("medicine.usage_no_quantity")}</p>
        ) : total <= 120 ? (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {Array.from({ length: total }, (_, i) => {
              const used = i < consumed;
              const target = i + 1 === consumed ? i : i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={Boolean(m.archivedAt) || update.isPending}
                  onClick={() => setConsumed(target)}
                  aria-label={`${i + 1}`}
                  title={`${i + 1}`}
                  className={`size-5 rounded-full transition ${
                    used ? "bg-brand-400 hover:bg-brand-dark" : "bg-line hover:bg-brand-100"
                  } ${m.archivedAt ? "cursor-default" : "cursor-pointer"}`}
                />
              );
            })}
          </div>
        ) : (
          // Too many units to draw individually — show a compact progress bar.
          <div className="mb-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand-400 transition-all"
                style={{ width: `${total ? (consumed / total) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-mute">
              {consumed} / {total} {m.unit}
            </p>
          </div>
        )}

        {!m.archivedAt && total > 0 && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setConsumed(consumed + 1)}
                disabled={remaining <= 0 || update.isPending}
                className="btn-primary flex-1 text-sm disabled:opacity-50"
              >
                {t("medicine.usage_taken")}
              </button>
              <button
                onClick={() => setConsumed(consumed - 1)}
                disabled={consumed <= 0 || update.isPending}
                className="flex-1 rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-50 disabled:opacity-50"
              >
                {t("medicine.usage_undo")}
              </button>
            </div>
            <p className="mt-3 text-xs text-mute">{t("medicine.usage_paint_hint")}</p>
          </>
        )}
      </section>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {!m.isOpened && !m.archivedAt && (
          <button
            onClick={() => open.mutate({ id: m.id })}
            disabled={open.isPending}
            className="flex-1 rounded-full bg-gradient-to-br from-brand-400 to-brand-dark px-4 py-3 font-medium text-white shadow-brand transition hover:opacity-90 disabled:opacity-60"
          >
            {open.isPending ? t("common.saving") : t("medicine.open_lid")}
          </button>
        )}
        <Link
          to="/medicines/$id/edit"
          params={{ id: m.id }}
          className="flex-1 rounded-full border border-line-strong bg-white px-4 py-3 text-center font-medium text-ink-soft hover:bg-canvas-soft"
        >
          {t("common.edit")}
        </Link>
        <button
          onClick={() => {
            if (!confirm(t("medicine.confirm_archive"))) return;
            archive.mutate({ id: m.id, archive: !m.archivedAt });
          }}
          disabled={archive.isPending}
          className="rounded-full border border-amber-200 bg-white px-4 py-3 font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60 sm:w-auto"
        >
          {m.archivedAt ? t("medicine.unarchive") : t("medicine.archive")}
        </button>
        <button
          onClick={async () => {
            if (!confirm(t("medicine.confirm_delete"))) return;
            await del.mutateAsync(m.id);
            await navigate({ to: "/medicines" });
          }}
          disabled={del.isPending}
          className="rounded-full border border-brand-100 bg-white px-4 py-3 font-medium text-brand-dark hover:bg-brand-50 disabled:opacity-60 sm:w-auto"
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
      <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-dark">
        {t("medicine.expired")}
      </span>
    );
  }
  if (status === "expiring") {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
        {t("medicine.expiring_in_days", { count: medicine.daysUntilExpiry })}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
      {t("medicine.valid")}
    </span>
  );
}

function CountdownTile({ status, days }: { status: Status; days: number }) {
  const { t } = useTranslation();

  if (status === "expired") {
    return (
      <div className="flex min-w-28 flex-col items-center rounded-2xl bg-brand-50 px-5 py-4 text-center">
        <svg viewBox="0 0 24 24" className="size-6 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
        </svg>
        <p className="mt-1 text-xs font-medium text-brand-dark">{t("medicine.expired")}</p>
      </div>
    );
  }

  const tone =
    status === "expiring"
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-emerald-700";

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
      <dt className="text-mute">{label}</dt>
      <dd className={bold ? "font-semibold text-ink" : "text-ink-soft"}>{value}</dd>
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
    <div className="surface-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-mute">{label}</p>
      <p className={`mt-1 text-base font-semibold ${tone === "muted" ? "text-mute" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
