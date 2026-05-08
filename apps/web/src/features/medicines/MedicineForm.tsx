import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useCreateUseCase, useUseCases, type Medicine, type MedicineInput } from "./hooks";

const schema = z.object({
  name: z.string().min(1).max(200),
  activeIngredient: z.string().optional(),
  strength: z.string().optional(),
  form: z.string().optional(),
  expiryDate: z.string().min(1),
  openedAt: z.string().optional(),
  openedShelfLifeDays: z
    .union([z.string().length(0), z.coerce.number().int().positive()])
    .optional(),
  quantity: z.coerce.number().min(0),
  unit: z.string().min(1).max(32),
  notes: z.string().optional(),
  useCaseIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  initial?: Medicine;
  submitLabel: string;
  onSubmit: (input: MedicineInput) => Promise<unknown>;
  pending?: boolean;
}

export function MedicineForm({ initial, submitLabel, onSubmit, pending }: Props) {
  const { t } = useTranslation();
  const useCases = useUseCases();
  const createUseCase = useCreateUseCase();
  const [query, setQuery] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      activeIngredient: initial?.activeIngredient ?? "",
      strength: initial?.strength ?? "",
      form: initial?.form ?? "",
      expiryDate: initial?.expiryDate ?? "",
      openedAt: initial?.openedAt ?? "",
      openedShelfLifeDays: initial?.openedShelfLifeDays ?? undefined,
      quantity: initial?.quantity ?? 1,
      unit: initial?.unit ?? "tablet",
      notes: initial?.notes ?? "",
      useCaseIds: initial?.useCases.map((u) => u.id) ?? [],
    },
  });

  const handle = form.handleSubmit(async (values) => {
    const input: MedicineInput = {
      name: values.name,
      activeIngredient: values.activeIngredient || undefined,
      strength: values.strength || undefined,
      form: values.form || undefined,
      expiryDate: values.expiryDate,
      openedAt: values.openedAt || null,
      openedShelfLifeDays:
        typeof values.openedShelfLifeDays === "number" ? values.openedShelfLifeDays : null,
      quantity: values.quantity,
      unit: values.unit,
      notes: values.notes || undefined,
      useCaseIds: values.useCaseIds,
    };
    await onSubmit(input);
  });

  return (
    <form onSubmit={handle} className="flex flex-col gap-4">
      <Field label={t("medicine.name")} error={form.formState.errors.name?.message}>
        <input className={inputCls} {...form.register("name")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("medicine.strength")}>
          <input className={inputCls} {...form.register("strength")} />
        </Field>
        <Field label={t("medicine.form")}>
          <input className={inputCls} placeholder={t("medicine.form_hint")} {...form.register("form")} />
        </Field>
      </div>

      <Field label={t("medicine.active_ingredient")}>
        <input className={inputCls} {...form.register("activeIngredient")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("medicine.quantity")}>
          <input type="number" step="0.01" min="0" className={inputCls} {...form.register("quantity")} />
        </Field>
        <Field label={t("medicine.unit")}>
          <input className={inputCls} {...form.register("unit")} />
        </Field>
      </div>

      <Field label={t("medicine.expiry")}>
        <input type="date" className={inputCls} {...form.register("expiryDate")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("medicine.opened_at")}>
          <input type="date" className={inputCls} {...form.register("openedAt")} />
        </Field>
        <Field label={t("medicine.opened_shelf_life_days")}>
          <input
            type="number"
            min="1"
            className={inputCls}
            placeholder="30"
            {...form.register("openedShelfLifeDays")}
          />
        </Field>
      </div>

      <Field label={t("medicine.use_cases")}>
        {useCases.isLoading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("medicine.use_case_search_placeholder")}
              className={inputCls}
            />
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
              {(() => {
                const normalized = query.trim().toLocaleLowerCase();
                const filtered = (useCases.data ?? []).filter((uc) =>
                  uc.name.toLocaleLowerCase().includes(normalized),
                );
                const exactExists = (useCases.data ?? []).some(
                  (uc) => uc.name.toLocaleLowerCase() === normalized,
                );

                const tags = filtered.map((uc) => {
                  const selected = form.watch("useCaseIds").includes(uc.id);
                  return (
                    <button
                      type="button"
                      key={uc.id}
                      onClick={() => {
                        const current = form.getValues("useCaseIds");
                        form.setValue(
                          "useCaseIds",
                          selected
                            ? current.filter((id) => id !== uc.id)
                            : [...current, uc.id],
                          { shouldDirty: true },
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        selected
                          ? "bg-gradient-to-br from-brand to-brand-dark text-white shadow-brand"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {uc.name}
                    </button>
                  );
                });

                if (normalized.length >= 2 && !exactExists) {
                  tags.push(
                    <button
                      type="button"
                      key="__add__"
                      disabled={createUseCase.isPending}
                      onClick={async () => {
                        const created = await createUseCase.mutateAsync(query.trim());
                        form.setValue(
                          "useCaseIds",
                          [...form.getValues("useCaseIds"), created.id],
                          { shouldDirty: true },
                        );
                        setQuery("");
                      }}
                      className="rounded-full border-2 border-dashed border-brand px-3 py-1 text-sm font-medium text-brand transition hover:bg-brand-50 disabled:opacity-60"
                    >
                      {t("medicine.add_use_case", { name: query.trim() })}
                    </button>,
                  );
                }

                if (tags.length === 0) {
                  return (
                    <span className="text-sm text-slate-500">
                      {t("medicine.no_use_cases")}
                    </span>
                  );
                }
                return tags;
              })()}
            </div>
          </div>
        )}
      </Field>

      <Field label={t("medicine.notes")}>
        <textarea rows={2} className={inputCls} {...form.register("notes")} />
      </Field>

      <button type="submit" disabled={pending} className="btn-primary mt-2 w-full">
        {pending ? t("common.saving") : submitLabel}
      </button>
    </form>
  );
}

const inputCls = "input-base";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
