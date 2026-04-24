import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMe } from "../../features/auth/hooks";
import { useMedicines } from "../../features/medicines/hooks";
import { useNotifications } from "../../features/notifications/useNotifications";
import { displayName } from "../../lib/api/client";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  const me = useMe();
  const medicines = useMedicines();
  const notifications = useNotifications();

  const items = medicines.data?.items ?? [];
  const expired = items.filter((m) => m.isExpired).length;
  const expiring = items.filter((m) => !m.isExpired && m.daysUntilExpiry <= 30).length;
  const valid = items.length - expired - expiring;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {t("hello")}
          {me.data && (
            <span className="ml-2 text-brand">{displayName(me.data)}</span>
          )}
        </h1>
        <p className="mt-1 text-slate-600">{t("tagline")}</p>
      </div>

      <section className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label={t("profile.stats.total")} value={items.length} />
        <StatCard label={t("profile.stats.valid")} value={valid} tone="brand" />
        <StatCard label={t("profile.stats.critical")} value={expired + expiring} tone="amber" />
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/medicines"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <p className="text-sm font-medium text-slate-500">{t("medicine.my_medicines")}</p>
          <p className="mt-1 text-lg font-semibold text-brand">
            {t("medicine.my_medicines")} →
          </p>
        </Link>
        <Link
          to="/check"
          className="rounded-2xl border-2 border-brand bg-brand-light p-5 shadow-sm transition hover:shadow-md"
        >
          <p className="text-sm font-medium text-brand-dark">{t("check.title")}</p>
          <p className="mt-1 text-lg font-semibold text-brand-dark">
            {t("check.subtitle")} →
          </p>
        </Link>
      </section>

      {notifications.supported && notifications.configured && !notifications.subscribed && (
        <button
          onClick={() => void notifications.enable()}
          className="w-full rounded-md border border-brand bg-white px-4 py-2 text-sm text-brand hover:bg-brand-light"
        >
          {t("notifications.enable")}
        </button>
      )}
      {notifications.subscribed && (
        <p className="text-center text-xs text-brand-dark">✓ {t("notifications.enabled")}</p>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "brand" | "amber";
}) {
  const toneCls =
    tone === "brand"
      ? "text-brand-dark"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className={`text-2xl font-bold ${toneCls}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
