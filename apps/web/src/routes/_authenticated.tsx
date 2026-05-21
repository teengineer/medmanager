import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMe } from "~/features/auth/hooks";
import { ExpiredMedicinesModal } from "~/features/medicines/ExpiredMedicinesModal";
import { useMedicines } from "~/features/medicines/hooks";
import { AppHeader } from "~/features/navigation/AppHeader";

const SEEN_EXPIRED_KEY = "mm_seen_expired_ids";

function useExpiredMedicinesAlert() {
  const { data, isLoading } = useMedicines({ expired: true });
  const [dismissed, setDismissed] = useState(false);

  const seenIds = useMemo<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(SEEN_EXPIRED_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  }, []);

  const unseen = useMemo(
    () => (data?.items ?? []).filter((m) => !seenIds.has(m.id)),
    [data, seenIds],
  );

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(
        SEEN_EXPIRED_KEY,
        JSON.stringify([...seenIds, ...unseen.map((m) => m.id)]),
      );
    } catch {
      // ignore storage errors
    }
    setDismissed(true);
  }, [seenIds, unseen]);

  return {
    medicines: unseen,
    show: !dismissed && !isLoading && unseen.length > 0,
    dismiss,
  };
}

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
  const expiredAlert = useExpiredMedicinesAlert();

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
      {expiredAlert.show && (
        <ExpiredMedicinesModal
          medicines={expiredAlert.medicines}
          onDismiss={expiredAlert.dismiss}
        />
      )}
    </div>
  );
}
