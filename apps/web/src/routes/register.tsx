import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { GoogleSignInButton } from "~/features/auth/GoogleSignInButton";
import { RegisterForm } from "~/features/auth/RegisterForm";

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: "/" });
  },
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 size-96 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 size-96 rounded-full bg-accent/15 blur-3xl" />
      </div>
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-brand">
              <svg viewBox="0 0 24 24" className="size-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </span>
            <h1 className="mt-4 bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-2xl font-bold text-transparent">
              MedManager
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t("tagline")}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-pop backdrop-blur">
            <h2 className="mb-5 text-xl font-semibold text-slate-900">{t("auth.create_account_title")}</h2>
            <RegisterForm />
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-wider text-slate-400">{t("auth.or")}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleSignInButton />
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            {t("auth.have_account")}{" "}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              {t("auth.sign_in")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
