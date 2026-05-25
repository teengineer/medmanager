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
  const valid = items.length - expired;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-brand-50 p-6 shadow-soft sm:p-8 animate-rise">
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-dark/70">
            Bundan Var
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t("hello")}
            {me.data && (
              <span className="ml-2 bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">
                {displayName(me.data)}
              </span>
            )}
          </h1>
          <p className="mt-2 max-w-md text-slate-600">{t("tagline")}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-3 gap-3 animate-rise" style={{ animationDelay: "60ms" }}>
        <StatCard
          label={t("profile.stats.total")}
          value={items.length}
          to="/medicines"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
              <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label={t("profile.stats.valid")}
          value={valid}
          tone="brand"
          to="/medicines"
          search={{ filter: "valid" }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          label={t("profile.stats.critical")}
          value={expired + expiring}
          tone="amber"
          to="/medicines"
          search={{ filter: "critical" }}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M12 9v4M12 17h.01M10.3 3.86l-8.06 14a2 2 0 001.74 3h16.04a2 2 0 001.74-3l-8.06-14a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </section>

      {/* Action cards */}
      <section className="mt-5 grid gap-3 sm:grid-cols-2 animate-rise" style={{ animationDelay: "120ms" }}>
        <ActionCard
          to="/medicines"
          title={t("medicine.my_medicines")}
          subtitle={t("home.my_medicines_subtitle")}
          tone="neutral"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-7">
              <rect x="3" y="7" width="18" height="13" rx="3" />
              <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" />
            </svg>
          }
        />
        <ActionCard
          to="/check"
          title={t("check.title")}
          subtitle={t("home.check_subtitle")}
          tone="brand"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-7">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          }
        />
      </section>

      {/* Notifications */}
      {notifications.supported && notifications.configured && !notifications.subscribed && (
        <button
          onClick={() => void notifications.enable()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/30 bg-white px-4 py-3 text-sm font-medium text-brand shadow-soft transition hover:border-brand hover:bg-brand-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.42L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 17a3 3 0 006 0" strokeLinecap="round" />
          </svg>
          {t("notifications.enable")}
        </button>
      )}
      {notifications.subscribed && (
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-brand-dark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
            <path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("notifications.enabled")}
        </p>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
  to,
  search,
}: {
  label: string;
  value: number;
  tone?: "brand" | "amber";
  icon?: React.ReactNode;
  to?: "/medicines";
  search?: { filter?: "valid" | "critical" };
}) {
  const valueCls =
    tone === "brand"
      ? "text-brand-dark"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-900";
  const iconCls =
    tone === "brand"
      ? "bg-brand-light text-brand-dark"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";

  const content = (
    <>
      {icon && (
        <span className={`flex size-9 items-center justify-center rounded-full ${iconCls}`}>
          {icon}
        </span>
      )}
      <p className={`text-2xl font-bold ${valueCls}`}>{value}</p>
      <p className="text-center text-[11px] font-medium uppercase tracking-wide text-mute">{label}</p>
    </>
  );

  const className =
    "surface-card flex flex-col items-center gap-1.5 p-4 transition hover:-translate-y-0.5 hover:shadow-pop hover:border-slate-300 active:scale-[0.98]";

  if (to) {
    return (
      <Link to={to} search={search ?? {}} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

function ActionCard({
  to,
  title,
  subtitle,
  tone,
  icon,
}: {
  to: string;
  title: string;
  subtitle: string;
  tone: "neutral" | "brand";
  icon: React.ReactNode;
}) {
  const isBrand = tone === "brand";
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-2xl p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop ${
        isBrand
          ? "border border-brand/30 bg-gradient-to-br from-brand to-brand-dark text-white"
          : "border border-slate-200 bg-white text-slate-900"
      }`}
    >
      {isBrand && (
        <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl" />
      )}
      <div className="relative flex items-start gap-3">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
            isBrand ? "bg-white/15 text-white" : "bg-brand-light text-brand"
          }`}
        >
          {icon}
        </span>
        <div className="flex-1">
          <p className={`text-base font-semibold ${isBrand ? "text-white" : "text-slate-900"}`}>
            {title}
          </p>
          <p className={`mt-0.5 text-sm ${isBrand ? "text-white/80" : "text-mute"}`}>
            {subtitle}
          </p>
        </div>
        <span
          className={`mt-1 transition-transform group-hover:translate-x-1 ${
            isBrand ? "text-white/90" : "text-brand"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
