import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const KEY = "medmanager.disclaimer.v1";

export function DisclaimerModal() {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const accepted = window.localStorage.getItem(KEY);
    if (!accepted) setShown(true);
  }, []);

  if (!shown) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <h2 className="text-xl font-bold text-brand">{t("disclaimer.title")}</h2>
        <p className="mt-3 text-sm text-slate-700">{t("disclaimer.body")}</p>
        <button
          onClick={() => {
            window.localStorage.setItem(KEY, new Date().toISOString());
            setShown(false);
          }}
          className="mt-5 w-full rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark"
        >
          {t("disclaimer.accept")}
        </button>
      </div>
    </div>
  );
}
