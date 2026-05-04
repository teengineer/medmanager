import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull().default(""),
    firstName: text("first_name"),
    lastName: text("last_name"),
    locale: text("locale").notNull().default("tr"),
    timeZone: text("time_zone").notNull().default("Europe/Istanbul"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_unique").on(t.email),
  }),
);

export const refreshTokens = sqliteTable(
  "refresh_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    tokenIdx: uniqueIndex("refresh_tokens_hash_unique").on(t.tokenHash),
    userIdx: index("refresh_tokens_user").on(t.userId),
  }),
);

export const medicines = sqliteTable(
  "medicines",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
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
      .references(() => users.id, { onDelete: "cascade" }),
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

export type User = typeof users.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type UseCase = typeof useCases.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
