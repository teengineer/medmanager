import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  useCreateProfile,
  useDeleteProfile,
  useProfiles,
  useUpdateProfile,
  type Profile,
} from "../../features/profiles/hooks";
import { BackButton } from "../../features/navigation/BackButton";

export const Route = createFileRoute("/_authenticated/family-profiles")({
  component: FamilyProfilesPage,
});

const PRESET_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
] as const;

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  relation: z.string().max(50).optional(),
  color: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

function FamilyProfilesPage() {
  const { t } = useTranslation();
  const profiles = useProfiles();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {t("family_profiles.title")}
        </h1>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="btn-primary text-sm"
        >
          + {t("family_profiles.add")}
        </button>
      </div>

      {showAdd && (
        <div className="surface-card mb-4 p-4 animate-rise">
          <ProfileForm
            onSave={() => setShowAdd(false)}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {profiles.isLoading ? (
        <div className="grid gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-line bg-white" />
          ))}
        </div>
      ) : !profiles.data || profiles.data.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line-strong bg-white/60 p-10 text-center animate-fade-in">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
            <PeopleIcon />
          </span>
          <p className="mt-3 font-medium text-ink-soft">{t("family_profiles.empty")}</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn-primary mt-5 inline-flex"
          >
            {t("family_profiles.add")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 animate-fade-in">
          {profiles.data.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              isEditing={editingId === p.id}
              onEdit={() => setEditingId(p.id)}
              onEditDone={() => setEditingId(null)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function ProfileCard({
  profile,
  isEditing,
  onEdit,
  onEditDone,
}: {
  profile: Profile;
  isEditing: boolean;
  onEdit: () => void;
  onEditDone: () => void;
}) {
  const { t } = useTranslation();
  const del = useDeleteProfile();

  if (isEditing) {
    return (
      <div className="surface-card p-4 animate-rise">
        <ProfileForm
          initial={profile}
          onSave={onEditDone}
          onCancel={onEditDone}
        />
      </div>
    );
  }

  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <div
        className="size-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white"
        style={{ backgroundColor: profile.color ?? "#94A3B8" }}
      >
        {profile.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">{profile.name}</p>
        {profile.relation && (
          <p className="text-sm text-mute truncate">{profile.relation}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="flex size-8 items-center justify-center rounded-full text-mute transition hover:bg-canvas hover:text-ink"
          aria-label={t("common.edit")}
        >
          <EditIcon />
        </button>
        <button
          type="button"
          disabled={del.isPending}
          onClick={() => {
            if (window.confirm(t("family_profiles.confirm_delete"))) {
              del.mutate(profile.id);
            }
          }}
          className="flex size-8 items-center justify-center rounded-full text-mute transition hover:bg-brand-50 hover:text-brand-dark disabled:opacity-50"
          aria-label={t("common.delete")}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Profile;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateProfile();
  const update = useUpdateProfile(initial?.id ?? "");
  const isPending = create.isPending || update.isPending;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initial?.name ?? "",
      relation: initial?.relation ?? "",
      color: initial?.color ?? "",
    },
  });

  const selectedColor = form.watch("color");

  const handle = form.handleSubmit(async (values) => {
    const input = {
      name: values.name.trim(),
      relation: values.relation?.trim() || null,
      color: values.color?.trim() || null,
    };
    if (initial) {
      await update.mutateAsync(input);
    } else {
      await create.mutateAsync(input);
    }
    onSave();
  });

  return (
    <form onSubmit={handle} className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink-soft">
        {initial ? t("family_profiles.edit") : t("family_profiles.add")}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">{t("family_profiles.name")}</span>
          <input
            className="input-base"
            placeholder="Anne, Baba…"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">{t("family_profiles.relation")}</span>
          <input
            className="input-base"
            placeholder={t("family_profiles.relation_placeholder")}
            {...form.register("relation")}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-soft">{t("family_profiles.color")}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => form.setValue("color", "", { shouldDirty: true })}
            className={`size-7 rounded-full border-2 transition ${
              !selectedColor ? "border-brand shadow-brand scale-110" : "border-line-strong"
            } bg-line`}
            aria-label="No color"
          />
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => form.setValue("color", c, { shouldDirty: true })}
              className={`size-7 rounded-full border-2 transition ${
                selectedColor === c ? "border-ink scale-110 shadow-pop" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-sm"
        >
          {t("common.cancel")}
        </button>
        <button type="submit" disabled={isPending} className="btn-primary text-sm">
          {isPending ? t("family_profiles.saving") : t("common.save")}
        </button>
      </div>
    </form>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-1a6 6 0 0112 0v1" strokeLinecap="round" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M21 21v-0.5a4.5 4.5 0 00-5-4.47" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
