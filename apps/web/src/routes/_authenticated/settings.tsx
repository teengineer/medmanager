import { createFileRoute, Link as RLink, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { api } from "~/lib/api/client";
import { authClient } from "~/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton } from "~/features/navigation/BackButton";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleExport = async () => {
    const res = await fetch("/api/me/export", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bundanvar-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t("legal.confirm_delete_account"))) return;
    try {
      await api<void>("/me", { method: "DELETE" });
    } finally {
      await authClient.signOut().catch(() => undefined);
      qc.clear();
      await navigate({ to: "/login" });
    }
  };

  return (
    <main className="mx-auto max-w-xl p-4 pb-24 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("profile.data_and_privacy")}
        </h1>
      </div>

      <section className="surface-card flex flex-col divide-y divide-slate-100 p-2">
        <SettingRow
          onClick={handleExport}
          icon={<DownloadIcon />}
          title={t("legal.export")}
        />
        <SettingLink to="/privacy" icon={<LockIcon />} title={t("legal.privacy")} />
        <SettingLink to="/terms" icon={<DocIcon />} title={t("legal.terms")} />
      </section>

      <button
        onClick={handleDeleteAccount}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 text-left text-red-700 transition hover:bg-red-50"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" strokeLinecap="round" />
          </svg>
        </span>
        <span className="flex-1 font-medium">{t("legal.delete_account")}</span>
      </button>
    </main>
  );
}

function SettingRow({
  onClick,
  icon,
  title,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-light text-brand">
        {icon}
      </span>
      <span className="flex-1 font-medium text-slate-800">{title}</span>
      <ChevronIcon />
    </button>
  );
}

function SettingLink({ to, icon, title }: { to: string; icon: React.ReactNode; title: string }) {
  return (
    <RLink
      to={to}
      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </span>
      <span className="flex-1 font-medium text-slate-800">{title}</span>
      <ChevronIcon />
    </RLink>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4v12M7 11l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <path d="M14 3v6h6M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  );
}
