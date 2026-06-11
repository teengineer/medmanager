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
        <div className="absolute -top-32 -left-20 size-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 size-96 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-6 flex flex-col items-center text-center">
            <img src="/favicon.png" alt="" className="size-14" />
            <h1 className="mt-4 bg-gradient-to-r from-brand-400 to-brand-dark bg-clip-text text-2xl font-bold text-transparent">
              Bundan Var
            </h1>
            <p className="mt-1 text-sm text-mute">{t("tagline")}</p>
          </div>

          <div className="rounded-[2rem] border border-line bg-white/85 p-6 shadow-pop backdrop-blur-xl sm:p-7">
            <h2 className="mb-5 text-xl font-semibold text-ink">{t("auth.create_account_title")}</h2>
            <RegisterForm />
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs uppercase tracking-wider text-mute/70">{t("auth.or")}</span>
              <div className="h-px flex-1 bg-line" />
            </div>
            <GoogleSignInButton />
          </div>

          <p className="mt-5 text-center text-sm text-ink-soft">
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
