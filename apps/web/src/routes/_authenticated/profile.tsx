import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useChangePassword, useMe, useUpdateProfile } from "../../features/auth/hooks";
import { useMedicines } from "../../features/medicines/hooks";
import { BackButton } from "../../features/navigation/BackButton";
import { ApiError } from "../../lib/api/client";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const TIMEZONES = [
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Amsterdam",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
];

function ProfilePage() {
  const { t, i18n } = useTranslation();
  const me = useMe();
  const updateProfile = useUpdateProfile();

  if (me.isLoading) {
    return <p className="p-6 text-slate-500">{t("common.loading")}</p>;
  }
  if (!me.data) return null;
  const user = me.data;

  return (
    <main className="mx-auto max-w-xl p-4 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold text-brand">{t("profile.title")}</h1>
      </div>

      <NameSection />

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("profile.account")}
        </h2>
        <dl className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">{t("auth.email")}</dt>
            <dd className="flex items-center gap-2 font-medium">
              {user.email}
              {!user.hasPassword && (
                <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark">
                  Google
                </span>
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">{t("profile.member_since")}</dt>
            <dd className="font-medium">
              {new Intl.DateTimeFormat(i18n.language, {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(user.createdAt))}
            </dd>
          </div>
        </dl>
      </section>

      <StatsSection />

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("profile.preferences")}
        </h2>
        <div className="grid gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t("profile.language")}</label>
            <div className="flex gap-2">
              {(["tr", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => updateProfile.mutate({ locale: lang })}
                  disabled={updateProfile.isPending}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                    user.locale === lang
                      ? "border-brand bg-brand text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {lang === "tr" ? "Türkçe" : "English"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t("profile.timezone")}</label>
            <select
              value={user.timeZone}
              onChange={(e) => updateProfile.mutate({ timeZone: e.target.value })}
              disabled={updateProfile.isPending}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
              {!TIMEZONES.includes(user.timeZone) && (
                <option value={user.timeZone}>{user.timeZone}</option>
              )}
            </select>
          </div>
        </div>
      </section>

      {user.hasPassword && <ChangePasswordSection />}
      {!user.hasPassword && <SetPasswordSection />}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("profile.data_and_privacy")}
        </h2>
        <Link
          to="/settings"
          className="block rounded-md border border-slate-300 px-4 py-3 text-sm text-slate-800 hover:bg-slate-50"
        >
          {t("profile.manage_data")}
        </Link>
      </section>
    </main>
  );
}

function NameSection() {
  const { t } = useTranslation();
  const me = useMe();
  const update = useUpdateProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editing, setEditing] = useState(false);

  const user = me.data;
  if (!user) return null;

  const current = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  const start = () => {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEditing(true);
  };

  const save = async () => {
    await update.mutateAsync({
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
    });
    setEditing(false);
  };

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t("profile.name")}
      </h2>
      {!editing ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-medium">
            {current || <span className="text-slate-400">{t("profile.no_name")}</span>}
          </p>
          <button
            onClick={start}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {t("common.edit")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("profile.first_name")}
              className="rounded-md border border-slate-300 px-3 py-2"
              autoComplete="given-name"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("profile.last_name")}
              className="rounded-md border border-slate-300 px-3 py-2"
              autoComplete="family-name"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={update.isPending}
              className="flex-1 rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {update.isPending ? t("common.saving") : t("common.save")}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StatsSection() {
  const { t } = useTranslation();
  const medicines = useMedicines();

  if (medicines.isLoading || !medicines.data) return null;

  const all = medicines.data.items;
  const expired = all.filter((m) => m.isExpired).length;
  const expiring = all.filter((m) => !m.isExpired && m.daysUntilExpiry <= 30).length;
  const valid = all.length - expired - expiring;

  return (
    <section className="mb-6 grid grid-cols-3 gap-3">
      <StatCard label={t("profile.stats.total")} value={all.length} />
      <StatCard label={t("profile.stats.valid")} value={valid} tone="brand" />
      <StatCard label={t("profile.stats.critical")} value={expired + expiring} tone="amber" />
    </section>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "brand" | "amber";
}) {
  const toneCls =
    tone === "brand"
      ? "text-brand-dark"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className={`text-2xl font-bold ${toneCls}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordSection() {
  const { t } = useTranslation();
  const change = useChangePassword();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const [successful, setSuccessful] = [
    change.isSuccess,
    () => {
      /* no-op placeholder */
    },
  ];
  void setSuccessful;

  const submit = form.handleSubmit(async (values) => {
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      form.reset();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        form.setError("currentPassword", { message: t("profile.current_password_wrong") });
      } else {
        form.setError("root", { message: t("auth.generic_error") });
      }
    }
  });

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t("profile.change_password")}
      </h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          autoComplete="current-password"
          placeholder={t("profile.current_password")}
          className="rounded-md border border-slate-300 px-3 py-2"
          {...form.register("currentPassword")}
        />
        {form.formState.errors.currentPassword && (
          <span className="text-sm text-red-600">
            {form.formState.errors.currentPassword.message ?? t("auth.password_required")}
          </span>
        )}
        <input
          type="password"
          autoComplete="new-password"
          placeholder={t("profile.new_password")}
          className="rounded-md border border-slate-300 px-3 py-2"
          {...form.register("newPassword")}
        />
        {form.formState.errors.newPassword && (
          <span className="text-sm text-red-600">{t("auth.password_min")}</span>
        )}
        <input
          type="password"
          autoComplete="new-password"
          placeholder={t("profile.confirm_password")}
          className="rounded-md border border-slate-300 px-3 py-2"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <span className="text-sm text-red-600">{t("profile.passwords_dont_match")}</span>
        )}
        {form.formState.errors.root && (
          <span className="text-sm text-red-600">{form.formState.errors.root.message}</span>
        )}
        {successful && (
          <p className="text-sm text-brand-dark">{t("profile.password_updated")}</p>
        )}
        <button
          type="submit"
          disabled={change.isPending}
          className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {change.isPending ? t("common.saving") : t("profile.change_password")}
        </button>
      </form>
    </section>
  );
}

const setPasswordSchema = z
  .object({
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

type SetPasswordValues = z.infer<typeof setPasswordSchema>;

function SetPasswordSection() {
  const { t } = useTranslation();
  const me = useMe();
  const qc = useChangePassword();
  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    await qc.mutateAsync({ newPassword: values.newPassword });
    form.reset();
    await me.refetch();
  });

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t("profile.set_password")}
      </h2>
      <p className="mb-4 text-sm text-slate-600">{t("profile.set_password_hint")}</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          autoComplete="new-password"
          placeholder={t("profile.new_password")}
          className="rounded-md border border-slate-300 px-3 py-2"
          {...form.register("newPassword")}
        />
        {form.formState.errors.newPassword && (
          <span className="text-sm text-red-600">{t("auth.password_min")}</span>
        )}
        <input
          type="password"
          autoComplete="new-password"
          placeholder={t("profile.confirm_password")}
          className="rounded-md border border-slate-300 px-3 py-2"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <span className="text-sm text-red-600">{t("profile.passwords_dont_match")}</span>
        )}
        <button
          type="submit"
          disabled={qc.isPending}
          className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {qc.isPending ? t("common.saving") : t("profile.set_password")}
        </button>
      </form>
    </section>
  );
}
