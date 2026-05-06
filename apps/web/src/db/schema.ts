import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ─── Better Auth tables ─────────────────────────────────────────────────────

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    // medmanager-specific custom fields
    firstName: text("first_name"),
    lastName: text("last_name"),
    locale: text("locale").notNull().default("tr"),
    timeZone: text("time_zone").notNull().default("Europe/Istanbul"),
  },
  (t) => ({
    emailIdx: uniqueIndex("user_email_unique").on(t.email),
  }),
);

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ─── Domain tables ──────────────────────────────────────────────────────────

export const medicines = sqliteTable(
  "medicines",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    userIdx: index("medicines_user").on(t.userId),
    userExpiryIdx: index("medicines_user_expiry").on(t.userId, t.expiryDate),
  }),
);

export const useCases = sqliteTable(
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

export const medicineUseCases = sqliteTable(
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

export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    endpointIdx: uniqueIndex("push_subscriptions_endpoint_unique").on(t.endpoint),
    userIdx: index("push_subscriptions_user").on(t.userId),
  }),
);

export type User = typeof user.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type UseCase = typeof useCases.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
