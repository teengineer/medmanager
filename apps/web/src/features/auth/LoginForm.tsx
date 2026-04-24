import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApiError } from "../../lib/api/client";
import { useLogin } from "./hooks";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      await navigate({ to: "/" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        form.setError("password", { message: t("auth.invalid_credentials") });
      } else {
        form.setError("root", { message: t("auth.generic_error") });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("auth.email")}</span>
        <input
          type="email"
          autoComplete="email"
          className="rounded-md border border-slate-300 px-3 py-2"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <span className="text-sm text-red-600">{t("auth.email_invalid")}</span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("auth.password")}</span>
        <input
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-slate-300 px-3 py-2"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <span className="text-sm text-red-600">
            {form.formState.errors.password.message ?? t("auth.password_required")}
          </span>
        )}
      </label>

      {form.formState.errors.root && (
        <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {login.isPending ? t("auth.signing_in") : t("auth.sign_in")}
      </button>
    </form>
  );
}
