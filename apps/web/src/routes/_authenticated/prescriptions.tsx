import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { BackButton } from "../../features/navigation/BackButton";
import {
  useCreatePrescription,
  useDeletePrescription,
  usePrescriptions,
  type PrescriptionDto,
} from "../../features/prescriptions/hooks";
import { useProfiles } from "../../features/profiles/hooks";

export const Route = createFileRoute("/_authenticated/prescriptions")({
  component: PrescriptionsPage,
});

const rxMedSchema = z.object({
  name: z.string().min(1).max(200),
  activeIngredient: z.string().max(200).optional(),
  strength: z.string().max(50).optional(),
  form: z.string().max(50).optional(),
});

const rxSchema = z.object({
  profileId: z.string().optional(),
  doctorName: z.string().max(200).optional(),
  prescriptionDate: z.string().min(1),
  notes: z.string().max(2000).optional(),
  medicines: z.array(rxMedSchema).min(0),
});

type RxFormValues = z.infer<typeof rxSchema>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function PrescriptionsPage() {
  const { t } = useTranslation();
  const prescriptions = usePrescriptions();
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...(prescriptions.data ?? [])].sort(
    (a, b) => b.prescriptionDate.localeCompare(a.prescriptionDate),
  );

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {t("prescriptions.title")}
        </h1>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="btn-primary text-sm"
        >
          + {t("prescriptions.add")}
        </button>
      </div>

      {showAdd && (
        <div className="surface-card mb-4 p-4 animate-rise">
          <PrescriptionForm onSave={() => setShowAdd(false)} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {prescriptions.isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-line bg-white" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line-strong bg-white/60 p-10 text-center animate-fade-in">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
            <RxIcon />
          </span>
          <p className="mt-3 font-medium text-ink-soft">{t("prescriptions.empty")}</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn-primary mt-5 inline-flex"
          >
            {t("prescriptions.add")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 animate-fade-in">
          {sorted.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              rx={rx}
              expanded={expandedId === rx.id}
              onToggle={() => setExpandedId(expandedId === rx.id ? null : rx.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function PrescriptionCard({
  rx,
  expanded,
  onToggle,
}: {
  rx: PrescriptionDto;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const del = useDeletePrescription();

  return (
    <div className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-canvas-soft transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink">
              {rx.prescriptionDate}
            </span>
            {rx.profileName && (
              <span className="chip-soft text-xs font-medium">
                {rx.profileName}
              </span>
            )}
          </div>
          {rx.doctorName && (
            <p className="mt-0.5 text-sm text-mute truncate">{rx.doctorName}</p>
          )}
          <p className="mt-1 text-xs text-mute">
            {t("prescriptions.medicine_count", { count: rx.medicines.length })}
          </p>
        </div>
        <ChevronIcon className={`size-4 text-mute shrink-0 mt-0.5 transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-line px-4 pb-4 pt-3 animate-fade-in">
          {rx.notes && (
            <p className="mb-3 text-sm text-ink-soft italic">{rx.notes}</p>
          )}

          {rx.medicines.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">
                {t("prescriptions.medicines_in_prescription")}
              </p>
              <div className="grid gap-2">
                {rx.medicines.map((m, i) => (
                  <div key={i} className="rounded-xl bg-canvas-soft px-3 py-2">
                    <p className="font-medium text-ink text-sm">{m.name}</p>
                    <p className="text-xs text-mute">
                      {[m.activeIngredient, m.strength, m.form].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={del.isPending}
              onClick={() => {
                if (window.confirm(t("prescriptions.confirm_delete"))) {
                  del.mutate(rx.id);
                }
              }}
              className="text-sm font-medium text-brand hover:text-brand-dark disabled:opacity-50 transition"
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PrescriptionForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreatePrescription();
  const profiles = useProfiles();

  const form = useForm<RxFormValues>({
    resolver: zodResolver(rxSchema),
    defaultValues: {
      profileId: "",
      doctorName: "",
      prescriptionDate: todayISO(),
      notes: "",
      medicines: [{ name: "", activeIngredient: "", strength: "", form: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "medicines" });

  const handle = form.handleSubmit(async (values) => {
    await create.mutateAsync({
      profileId: values.profileId || null,
      doctorName: values.doctorName?.trim() || null,
      prescriptionDate: values.prescriptionDate,
      notes: values.notes?.trim() || null,
      medicines: values.medicines
        .filter((m) => m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          activeIngredient: m.activeIngredient?.trim() || undefined,
          strength: m.strength?.trim() || undefined,
          form: m.form?.trim() || undefined,
        })),
    });
    onSave();
  });

  return (
    <form onSubmit={handle} className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink-soft">{t("prescriptions.add")}</p>

      {profiles.data && profiles.data.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">{t("prescriptions.profile")}</span>
          <select className="input-base" {...form.register("profileId")}>
            <option value="">{t("prescriptions.no_profile")}</option>
            {profiles.data.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">{t("prescriptions.doctor_name")}</span>
          <input className="input-base" {...form.register("doctorName")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">{t("prescriptions.date")}</span>
          <input type="date" className="input-base" {...form.register("prescriptionDate")} />
          {form.formState.errors.prescriptionDate && (
            <span className="text-xs text-red-600">{form.formState.errors.prescriptionDate.message}</span>
          )}
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-soft">{t("prescriptions.notes")}</span>
        <textarea rows={2} className="input-base" {...form.register("notes")} />
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink-soft">{t("prescriptions.medicines_in_prescription")}</p>
        {fields.map((field, i) => (
          <div key={field.id} className="relative rounded-xl border border-line bg-canvas-soft p-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 col-span-2">
                <span className="text-xs text-mute">{t("medicine.name")} *</span>
                <input className="input-base text-sm" {...form.register(`medicines.${i}.name`)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-mute">{t("medicine.active_ingredient")}</span>
                <input className="input-base text-sm" {...form.register(`medicines.${i}.activeIngredient`)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-mute">{t("medicine.strength")}</span>
                <input className="input-base text-sm" {...form.register(`medicines.${i}.strength`)} />
              </label>
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-2 top-2 text-xs text-mute hover:text-brand-dark transition"
              >
                {t("prescriptions.remove_medicine_row")}
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ name: "", activeIngredient: "", strength: "", form: "" })}
          className="text-sm font-medium text-brand hover:text-brand-dark transition text-left"
        >
          + {t("prescriptions.add_medicine_row")}
        </button>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">
          {t("common.cancel")}
        </button>
        <button type="submit" disabled={create.isPending} className="btn-primary text-sm">
          {create.isPending ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </form>
  );
}

function RxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
