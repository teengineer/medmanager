import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMe } from "~/features/auth/hooks";
import { AppHeader } from "~/features/navigation/AppHeader";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { t, i18n } = useTranslation();
  const me = useMe();

  useEffect(() => {
    const userLocale = me.data?.locale;
    if (userLocale && (userLocale === "tr" || userLocale === "en") && i18n.language !== userLocale) {
      void i18n.changeLanguage(userLocale);
    }
  }, [me.data?.locale, i18n]);

  if (me.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="flex items-center gap-3 text-slate-500">
          <span className="size-5 animate-spin rounded-full border-2 border-brand-light border-t-brand" />
          {t("common.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <Outlet />
    </div>
  );
}
