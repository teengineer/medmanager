import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const KEY = "bundanvar.disclaimer.v1";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm sm:items-center animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-line bg-white shadow-pop animate-pop">
        <div className="bg-gradient-to-br from-brand-50 to-white p-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-brand text-white shadow-brand">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            <h2 className="text-xl font-bold text-ink">{t("disclaimer.title")}</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t("disclaimer.body")}</p>
        </div>
        <div className="border-t border-line bg-white p-4">
          <button
            onClick={() => {
              window.localStorage.setItem(KEY, new Date().toISOString());
              setShown(false);
            }}
            className="btn-primary w-full"
          >
            {t("disclaimer.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
