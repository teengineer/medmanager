import type { Medicine } from "~/db/schema";

export interface UseCaseTag {
  id: string;
  slug: string;
  name: string;
}

export interface MedicineDto {
  id: string;
  profileId: string | null;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  form: string | null;
  barcode: string | null;
  expiryDate: string;
  openedAt: string | null;
  openedShelfLifeDays: number | null;
  effectiveExpiry: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  isOpened: boolean;
  quantity: number;
  /** quantity minus logged "taken" doses — present on search results */
  remainingQuantity?: number;
  unit: string;
  dosePerDay: number | null;
  notes: string | null;
  /** Versioned URL of the photo (served by /api/medicines/:id/image) — base64 never travels in JSON. */
  imageUrl: string | null;
  archivedAt: string | null;
  useCases: UseCaseTag[];
}

function toDateOnly(value: string): Date {
  const d = value.length >= 10 ? new Date(value.slice(0, 10)) : new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function effectiveExpiryOf(
  expiryDate: string,
  openedAt: string | null,
  shelfLife: number | null,
): string {
  const expiry = toDateOnly(expiryDate);
  if (!openedAt || !shelfLife) return expiry.toISOString().slice(0, 10);
  const opened = toDateOnly(openedAt);
  const openedEnd = new Date(opened.getTime() + shelfLife * 24 * 60 * 60 * 1000);
  const earlier = openedEnd < expiry ? openedEnd : expiry;
  return earlier.toISOString().slice(0, 10);
}

/** Row shape accepted by toMedicineDto: full row, or one queried without the
 * heavy image column but carrying a hasImage flag instead. */
export type MedicineForDto = Omit<Medicine, "image"> & {
  image?: string | null;
  hasImage?: boolean;
};

export interface MedicineWithTags {
  medicine: MedicineForDto;
  tags: { useCaseId: string; slug: string; nameTr: string; nameEn: string }[];
}

export function toMedicineDto(
  m: MedicineForDto,
  tags: MedicineWithTags["tags"],
  locale: "tr" | "en",
): MedicineDto {
  const effective = effectiveExpiryOf(m.expiryDate, m.openedAt, m.openedShelfLifeDays);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const effDate = new Date(effective);
  const days = Math.round((effDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return {
    id: m.id,
    profileId: m.profileId ?? null,
    name: m.name,
    activeIngredient: m.activeIngredient,
    strength: m.strength,
    form: m.form,
    barcode: m.barcode,
    expiryDate: m.expiryDate.slice(0, 10),
    openedAt: m.openedAt ? m.openedAt.slice(0, 10) : null,
    openedShelfLifeDays: m.openedShelfLifeDays,
    effectiveExpiry: effective,
    daysUntilExpiry: days,
    isExpired: days < 0,
    isOpened: Boolean(m.openedAt),
    quantity: Number(m.quantity),
    unit: m.unit,
    dosePerDay: m.dosePerDay ?? null,
    notes: m.notes,
    imageUrl:
      (m.hasImage ?? Boolean(m.image))
        ? `/api/medicines/${m.id}/image?v=${encodeURIComponent(m.updatedAt)}`
        : null,
    archivedAt: m.archivedAt ?? null,
    useCases: tags.map((tag) => ({
      id: tag.useCaseId,
      slug: tag.slug,
      name: locale === "en" ? tag.nameEn : tag.nameTr,
    })),
  };
}
