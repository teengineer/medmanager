import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
  const { t } = useTranslation();
  const me = useMe();

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
