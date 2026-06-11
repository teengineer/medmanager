import { useTranslation } from "react-i18next";

export function BackButton({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={`flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-soft transition hover:bg-canvas-soft hover:text-brand ${className}`}
      aria-label={t("common.back")}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
