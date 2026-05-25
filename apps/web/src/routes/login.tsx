import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { GoogleSignInButton } from "~/features/auth/GoogleSignInButton";
import { LoginForm } from "~/features/auth/LoginForm";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

function LoginPage() {
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
            <img src="/favicon.png" alt="" className="size-14" />
            <h1 className="mt-4 bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-2xl font-bold text-transparent">
              Bundan Var
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t("tagline")}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-pop backdrop-blur">
            <h2 className="mb-5 text-xl font-semibold text-slate-900">{t("auth.sign_in_title")}</h2>
            <LoginForm />
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-wider text-slate-400">{t("auth.or")}</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleSignInButton />
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            {t("auth.no_account")}{" "}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              {t("auth.create_account")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
