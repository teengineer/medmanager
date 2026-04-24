import { createFileRoute, Link as RLink, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { auth, api } from "../../lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton } from "../../features/navigation/BackButton";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleExport = async () => {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
    const res = await fetch(`${base}/me/export`, {
      method: "POST",
      credentials: "include",
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medmanager-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t("legal.confirm_delete_account"))) return;
    try {
      await api<void>("/me", { method: "DELETE" });
    } finally {
      auth.token = null;
      qc.clear();
      await navigate({ to: "/login" });
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6 pb-24">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold text-brand">{t("profile.data_and_privacy")}</h1>
      </div>

      <section className="mt-8 flex flex-col gap-3">
        <button
          onClick={handleExport}
          className="rounded-md border border-slate-300 px-4 py-3 text-left text-slate-800 hover:bg-slate-50"
        >
          <span className="font-medium">{t("legal.export")}</span>
        </button>
        <RLink
          to="/privacy"
          className="rounded-md border border-slate-300 px-4 py-3 text-slate-800 hover:bg-slate-50"
        >
          {t("legal.privacy")}
        </RLink>
        <RLink
          to="/terms"
          className="rounded-md border border-slate-300 px-4 py-3 text-slate-800 hover:bg-slate-50"
        >
          {t("legal.terms")}
        </RLink>
        <button
          onClick={handleDeleteAccount}
          className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-left text-red-700 hover:bg-red-100"
        >
          <span className="font-medium">{t("legal.delete_account")}</span>
        </button>
      </section>
    </main>
  );
}
