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
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-brand">{t("auth.create_account_title")}</h1>
        <RegisterForm />
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-500">{t("auth.or")}</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleSignInButton />
        <p className="mt-4 text-sm text-slate-600">
          {t("auth.have_account")}{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            {t("auth.sign_in")}
          </Link>
        </p>
      </div>
    </main>
  );
}
