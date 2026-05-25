import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const GITHUB_URL = "https://github.com/teengineer/medmanager";

function AboutPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-xl p-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        bundanvar
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <img src="/favicon.png" alt="" className="size-12" />
        <div>
          <h1 className="text-3xl font-bold text-brand">Bundan Var</h1>
          <p className="text-sm text-slate-500">{t("tagline")}</p>
        </div>
      </div>

      <p className="mt-6 text-slate-700">{t("about.description")}</p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("about.source_code")}
        </h2>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md border border-slate-200 px-4 py-3 hover:border-brand hover:bg-brand-light"
        >
          <svg viewBox="0 0 24 24" className="size-6 text-slate-900" aria-hidden>
            <path
              fill="currentColor"
              d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.38.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.54-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.95 0-1.32.47-2.39 1.24-3.24-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.24a11.5 11.5 0 0 1 6 0c2.29-1.56 3.3-1.24 3.3-1.24.66 1.65.24 2.88.12 3.18.77.85 1.24 1.92 1.24 3.24 0 4.62-2.81 5.64-5.49 5.94.43.37.82 1.1.82 2.22v3.3c0 .32.22.69.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"
            />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-slate-900">GitHub</p>
            <p className="text-xs text-slate-500">{GITHUB_URL.replace("https://", "")}</p>
          </div>
          <svg viewBox="0 0 24 24" className="size-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-500">
        <Link to="/privacy" className="hover:text-brand">
          {t("legal.privacy")}
        </Link>
        <span>·</span>
        <Link to="/terms" className="hover:text-brand">
          {t("legal.terms")}
        </Link>
      </div>
    </main>
  );
}
