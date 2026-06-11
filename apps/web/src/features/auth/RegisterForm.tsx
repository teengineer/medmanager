import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useRegister } from "./hooks";

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const register = useRegister();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const locale = (i18n.language.startsWith("tr") ? "tr" : "en") as "tr" | "en";
    try {
      await register.mutateAsync({ ...values, locale });
      await navigate({ to: "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("exist") || message.includes("taken") || message.includes("already")) {
        form.setError("email", { message: t("auth.email_taken") });
      } else {
        form.setError("root", { message: t("auth.generic_error") });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">{t("profile.first_name")}</span>
          <input
            type="text"
            autoComplete="given-name"
            className="input-base"
            {...form.register("firstName")}
          />
          {form.formState.errors.firstName && (
            <span className="text-xs text-red-600">{t("profile.name_required")}</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">{t("profile.last_name")}</span>
          <input
            type="text"
            autoComplete="family-name"
            className="input-base"
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName && (
            <span className="text-xs text-red-600">{t("profile.name_required")}</span>
          )}
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-soft">{t("auth.email")}</span>
        <input
          type="email"
          autoComplete="email"
          className="input-base"
          placeholder="ornek@eposta.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <span className="text-xs text-red-600">
            {form.formState.errors.email.message ?? t("auth.email_invalid")}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-soft">{t("auth.password")}</span>
        <input
          type="password"
          autoComplete="new-password"
          className="input-base"
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <span className="text-xs text-red-600">{t("auth.password_min")}</span>
        )}
      </label>

      {form.formState.errors.root && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      )}

      <button type="submit" disabled={register.isPending} className="btn-primary mt-1 w-full">
        {register.isPending ? t("auth.creating_account") : t("auth.create_account")}
      </button>
    </form>
  );
}
