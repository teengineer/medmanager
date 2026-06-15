import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { api } from "../../lib/api/client";
import { useProfiles } from "../profiles/hooks";
import { BarcodeScanner } from "./BarcodeScanner";
import type { Gs1Result } from "./gs1";
import { useCreateUseCase, useUseCases, type Medicine, type MedicineInput } from "./hooks";

interface GtinLookup {
  found: boolean;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  form: string | null;
  packageCount: number | null;
  packageUnit: string | null;
}

const schema = z.object({
  name: z.string().min(1).max(200),
  profileId: z.string().optional(),
  activeIngredient: z.string().optional(),
  strength: z.string().optional(),
  form: z.string().optional(),
  barcode: z.string().max(64).optional(),
  expiryDate: z.string().min(1),
  openedAt: z.string().optional(),
  openedShelfLifeDays: z
    .union([z.string().length(0), z.coerce.number().int().positive()])
    .optional(),
  quantity: z.coerce.number().min(0),
  unit: z.string().min(1).max(32),
  packageCount: z.coerce.number().int().min(0),
  dosePerDay: z
    .union([z.string().length(0), z.coerce.number().int().positive()])
    .optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
  imageRemoved: z.boolean().optional(),
  useCaseIds: z.array(z.string()),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

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
  const profiles = useProfiles();
  const [query, setQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanInfo, setScanInfo] = useState<Gs1Result | null>(null);
  const [scanProduct, setScanProduct] = useState<"loading" | "not_found" | GtinLookup | null>(null);

  const applyScan = async (res: Gs1Result) => {
    if (res.gtin) form.setValue("barcode", res.gtin, { shouldDirty: true });
    if (res.expiryDate) {
      form.setValue("expiryDate", res.expiryDate, { shouldDirty: true, shouldValidate: true });
    }
    setScanInfo(res);
    setScannerOpen(false);
    if (!res.gtin) return;

    setScanProduct("loading");
    try {
      const p = await api<GtinLookup>(`/gtin/${res.gtin}`);
      setScanProduct(p);
      // Fill only fields the user hasn't typed yet — never overwrite manual input.
      if (p.name && !form.getValues("name")) {
        form.setValue("name", p.name, { shouldDirty: true, shouldValidate: true });
      }
      if (p.activeIngredient && !form.getValues("activeIngredient")) {
        form.setValue("activeIngredient", p.activeIngredient, { shouldDirty: true });
      }
      if (p.strength && !form.getValues("strength")) {
        form.setValue("strength", p.strength, { shouldDirty: true });
      }
      if (p.form && !form.getValues("form")) {
        form.setValue("form", p.form, { shouldDirty: true });
      }
      const qty = form.getValues("quantity");
      if (p.packageCount && (qty === 1 || qty === "1" || qty === "" || qty == null)) {
        form.setValue("quantity", p.packageCount, { shouldDirty: true });
        if (p.packageUnit) {
          form.setValue("unit", p.packageUnit, { shouldDirty: true, shouldValidate: true });
        }
      }
    } catch {
      setScanProduct("not_found");
    }
  };

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      profileId: initial?.profileId ?? "",
      activeIngredient: initial?.activeIngredient ?? "",
      strength: initial?.strength ?? "",
      form: initial?.form ?? "",
      barcode: initial?.barcode ?? "",
      expiryDate: initial?.expiryDate ?? "",
      openedAt: initial?.openedAt ?? "",
      openedShelfLifeDays: initial?.openedShelfLifeDays ?? undefined,
      quantity: initial?.quantity ?? 1,
      unit: initial?.unit ?? "tablet",
      packageCount: initial?.packageCount ?? 1,
      dosePerDay: initial?.dosePerDay ?? undefined,
      notes: initial?.notes ?? "",
      image: undefined, // only set when the user picks a new photo
      imageRemoved: false,
      useCaseIds: initial?.useCases.map((u) => u.id) ?? [],
    },
  });

  const handle = form.handleSubmit(async (values) => {
    const input: MedicineInput = {
      name: values.name,
      profileId: values.profileId || null,
      activeIngredient: values.activeIngredient || undefined,
      strength: values.strength || undefined,
      form: values.form || undefined,
      barcode: values.barcode || undefined,
      expiryDate: values.expiryDate,
      openedAt: values.openedAt || null,
      openedShelfLifeDays:
        typeof values.openedShelfLifeDays === "number" ? values.openedShelfLifeDays : null,
      quantity: values.quantity,
      unit: values.unit,
      packageCount: values.packageCount,
      dosePerDay: typeof values.dosePerDay === "number" ? values.dosePerDay : null,
      notes: values.notes || undefined,
      // tri-state: new photo → send it; removed → null; untouched → undefined (PATCH keeps existing)
      image: values.image ? values.image : values.imageRemoved ? null : undefined,
      useCaseIds: values.useCaseIds,
    };
    await onSubmit(input);
  });

  return (
    <form onSubmit={handle} className="flex flex-col gap-4">
      {profiles.data && profiles.data.length > 0 && (
        <Field label={t("prescriptions.profile")}>
          <select className={inputCls} {...form.register("profileId")}>
            <option value="">—</option>
            {profiles.data.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.relation ? ` (${p.relation})` : ""}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label={t("medicine.name")} error={form.formState.errors.name && t("common.required")}>
        <input className={inputCls} {...form.register("name")} />
      </Field>

      <Field label={t("medicine.barcode")}>
        <div className="flex gap-2">
          <input className={inputCls} inputMode="numeric" placeholder="8699…" {...form.register("barcode")} />
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="btn-secondary shrink-0 whitespace-nowrap text-sm"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" strokeLinecap="round" />
              <path d="M7 12h2m2 0h2m2 0h2" strokeLinecap="round" />
            </svg>
            {t("medicine.scan_button")}
          </button>
        </div>
        {scanInfo && (scanInfo.gtin || scanInfo.expiryDate) && (
          <span className="text-xs font-medium text-emerald-700">
            {scanInfo.expiryDate
              ? t("medicine.scan_filled", { date: scanInfo.expiryDate })
              : t("medicine.scan_filled_barcode")}
          </span>
        )}
        {scanProduct === "loading" && (
          <span className="text-xs text-mute">{t("medicine.scan_product_loading")}</span>
        )}
        {scanProduct === "not_found" && (
          <span className="text-xs text-amber-700">{t("medicine.scan_product_not_found")}</span>
        )}
        {scanProduct && typeof scanProduct === "object" && (
          <span className="text-xs font-medium text-emerald-700">
            {t("medicine.scan_product_found", { name: scanProduct.name })}
          </span>
        )}
      </Field>

      {scannerOpen && (
        <BarcodeScanner
          onClose={() => setScannerOpen(false)}
          onResult={(res) => void applyScan(res)}
        />
      )}

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
        <Field label={t("medicine.unit")} error={form.formState.errors.unit && t("common.required")}>
          <input className={inputCls} {...form.register("unit")} />
        </Field>
      </div>

      <Field label={t("medicine.package_count")}>
        <input
          type="number"
          min="0"
          step="1"
          className={inputCls}
          placeholder={t("medicine.package_count_hint")}
          {...form.register("packageCount")}
        />
      </Field>

      <Field label={t("medicine.dose_per_day")}>
        <input
          type="number"
          min="1"
          className={inputCls}
          placeholder={t("medicine.dose_per_day_hint")}
          {...form.register("dosePerDay")}
        />
      </Field>

      <Field label={t("medicine.expiry")} error={form.formState.errors.expiryDate && t("common.required")}>
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
          <p className="text-sm text-mute">{t("common.loading")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(() => {
              const selectedIds = form.watch("useCaseIds");
              if (selectedIds.length === 0) return null;
              const byId = new Map((useCases.data ?? []).map((uc) => [uc.id, uc]));
              return (
                <div className="flex flex-wrap gap-2">
                  {selectedIds.map((id) => {
                    const uc = byId.get(id);
                    if (!uc) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-brand-dark"
                      >
                        {uc.name}
                        <button
                          type="button"
                          aria-label={t("common.remove")}
                          onClick={() =>
                            form.setValue(
                              "useCaseIds",
                              form.getValues("useCaseIds").filter((x) => x !== id),
                              { shouldDirty: true },
                            )
                          }
                          className="text-brand-dark/60 hover:text-brand-dark"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              );
            })()}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("medicine.use_case_search_placeholder")}
              className={inputCls}
            />
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-line bg-canvas-soft p-2">
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
                          ? "bg-brand-light text-brand-dark"
                          : "border border-line bg-white text-ink-soft hover:border-line-strong hover:bg-canvas-soft"
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
                    <span className="text-sm text-mute">
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

      <ImageInput form={form} initialImageUrl={initial?.imageUrl ?? null} />

      <button type="submit" disabled={pending} className="btn-primary mt-2 w-full">
        {pending ? t("common.saving") : submitLabel}
      </button>
    </form>
  );
}

// Downscale + JPEG-compress before storing: a raw phone photo is 3–5 MB and
// would otherwise travel to the DB as a ~7 MB base64 string on every save/list.
const IMAGE_MAX_DIMENSION = 1024;
const IMAGE_JPEG_QUALITY = 0.8;

async function compressImage(file: File): Promise<string> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Fallback for browsers without createImageBitmap(file)
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("image load failed"));
      };
      img.src = url;
    });
  }

  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  return canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY);
}

function ImageInput({
  form,
  initialImageUrl,
}: {
  form: UseFormReturn<FormInput, unknown, FormValues>;
  initialImageUrl: string | null;
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(initialImageUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Generous cap — the photo is compressed client-side right after.
    const maxSizeBytes = 20 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(t("medicine.image_size_error"));
      return;
    }

    try {
      const dataUrl = await compressImage(file);
      form.setValue("image", dataUrl, { shouldDirty: true });
      form.setValue("imageRemoved", false);
      setPreview(dataUrl);
    } catch {
      alert(t("medicine.image_size_error"));
    }
  };

  const handleClearImage = () => {
    form.setValue("image", undefined, { shouldDirty: true });
    form.setValue("imageRemoved", true);
    setPreview(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Field label={t("medicine.image")}>
      <div className="flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="input-base cursor-pointer text-left"
        >
          {preview ? `✓ ${t("medicine.image_selected")}` : t("medicine.image_placeholder")}
        </button>
        {preview && (
          <div className="flex flex-col gap-2">
            <img src={preview} alt="Medicine" className="h-40 w-full rounded-2xl object-contain" />
            <button
              type="button"
              onClick={handleClearImage}
              className="w-full rounded-full border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-dark hover:bg-brand-100"
            >
              {t("common.remove")}
            </button>
          </div>
        )}
      </div>
    </Field>
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
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
