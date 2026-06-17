import { boolean, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const isoNow = () => new Date().toISOString();

// ─── Better Auth tables ─────────────────────────────────────────────────────

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
    // bundanvar-specific custom fields
    firstName: text("first_name"),
    lastName: text("last_name"),
    locale: text("locale").notNull().default("tr"),
    timeZone: text("time_zone").notNull().default("Europe/Istanbul"),
  },
  (t) => ({
    emailIdx: uniqueIndex("user_email_unique").on(t.email),
  }),
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "date" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
});

// ─── Domain tables ──────────────────────────────────────────────────────────

export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relation: text("relation"),
    color: text("color"),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
    updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
  },
  (t) => ({
    userIdx: index("profiles_user").on(t.userId),
  }),
);

export const medicines = pgTable(
  "medicines",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    profileId: text("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    activeIngredient: text("active_ingredient"),
    strength: text("strength"),
    form: text("form"),
    barcode: text("barcode"),
    expiryDate: text("expiry_date").notNull(),
    openedAt: text("opened_at"),
    openedShelfLifeDays: integer("opened_shelf_life_days"),
    quantity: text("quantity").notNull().default("1"),
    unit: text("unit").notNull().default("unit"),
    packageCount: integer("package_count").notNull().default(1),
    consumed: integer("consumed").notNull().default(0), // units already used out of quantity
    dosePerDay: integer("dose_per_day"),
    notes: text("notes"),
    image: text("image"),
    archivedAt: text("archived_at"),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
    updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
  },
  (t) => ({
    userIdx: index("medicines_user").on(t.userId),
    userExpiryIdx: index("medicines_user_expiry").on(t.userId, t.expiryDate),
    profileIdx: index("medicines_profile").on(t.profileId),
  }),
);

export const useCases = pgTable(
  "use_cases",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull(),
    nameTr: text("name_tr").notNull(),
    nameEn: text("name_en").notNull(),
    icd10Code: text("icd10_code"),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => ({
    slugIdx: uniqueIndex("use_cases_slug_unique").on(t.slug),
    userIdx: index("use_cases_user").on(t.userId),
  }),
);

export const medicineUseCases = pgTable(
  "medicine_use_cases",
  {
    medicineId: text("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "cascade" }),
    useCaseId: text("use_case_id")
      .notNull()
      .references(() => useCases.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.medicineId, t.useCaseId] }),
  }),
);

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    profileId: text("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    doctorName: text("doctor_name"),
    prescriptionDate: text("prescription_date").notNull(),
    notes: text("notes"),
    medicinesJson: text("medicines_json"),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
    updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
  },
  (t) => ({
    userIdx: index("prescriptions_user").on(t.userId),
    profileIdx: index("prescriptions_profile").on(t.profileId),
  }),
);

export const usageLogs = pgTable(
  "usage_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    medicineId: text("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    taken: boolean("taken").notNull(),
    count: integer("count").notNull().default(1), // how many times taken that day
    notes: text("notes"),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
  },
  (t) => ({
    userIdx: index("usage_logs_user").on(t.userId),
    medicineIdx: index("usage_logs_medicine").on(t.medicineId),
    uniqueEntry: uniqueIndex("usage_logs_medicine_date").on(t.medicineId, t.date),
  }),
);
export type UsageLog = typeof usageLogs.$inferSelect;

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
  },
  (t) => ({
    endpointIdx: uniqueIndex("push_subscriptions_endpoint_unique").on(t.endpoint),
    userIdx: index("push_subscriptions_user").on(t.userId),
  }),
);

// TİTCK licensed products reference list (public data, imported via scripts/import-drugs.ts)
export const drugProducts = pgTable("drug_products", {
  barcode: text("barcode").primaryKey(), // 13-digit EAN as published by TİTCK
  name: text("name").notNull(),
  activeIngredient: text("active_ingredient"),
  atcCode: text("atc_code"),
  updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
});

// User-contributed dietary-supplement catalog. Supplements (takviye edici gıda)
// are regulated as food (Tarım ve Orman Bakanlığı), carry no İTS karekod and are
// absent from the TİTCK list — so there is no official barcode dataset to import.
// Users build this shared lookup themselves: the first person to add a supplement
// seeds it, everyone after can search and pick it.
export const supplementProducts = pgTable(
  "supplement_products",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    barcode: text("barcode"), // EAN-13 retail barcode when known (nullable)
    name: text("name").notNull(),
    form: text("form"),
    usageCount: integer("usage_count").notNull().default(1),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: text("created_at").notNull().$defaultFn(isoNow),
    updatedAt: text("updated_at").notNull().$defaultFn(isoNow),
  },
  (t) => ({
    // Unique when present; Postgres treats NULLs as distinct so barcode-less
    // supplements are still allowed.
    barcodeIdx: uniqueIndex("supplement_products_barcode_unique").on(t.barcode),
    nameIdx: index("supplement_products_name").on(t.name),
  }),
);
export type SupplementProduct = typeof supplementProducts.$inferSelect;

export type User = typeof user.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type UseCase = typeof useCases.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
