import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMe } from "../features/auth/hooks";
import { AppHeader } from "../features/navigation/AppHeader";
import { refreshTokens } from "../lib/api/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { t } = useTranslation();
  const me = useMe();

  if (me.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-slate-500">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader />
      <Outlet />
    </div>
  );
}
