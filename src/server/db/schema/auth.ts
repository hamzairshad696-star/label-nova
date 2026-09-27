import { bigint, boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

export const userStatus = pgEnum("user_status", ["active", "disabled", "pending"]);

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/** Better Auth "user" model, plus Label Nova's own columns. */
export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull().unique(),
    emailVerified: boolean().notNull().default(false),
    image: text(),
    company: text(),
    status: userStatus().notNull().default("active"),
    parentUserId: uuid().references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    lastLoginAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("users_parent_idx").on(t.parentUserId), index("users_status_idx").on(t.status)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Better Auth "account" model. Password hashes live here, never on `users`. */
export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("auth_accounts_user_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/** Better Auth rate-limit counters, kept in Postgres so limits hold across serverless instances. */
export const rateLimits = pgTable("rate_limits", {
  id: uuid().primaryKey().defaultRandom(),
  key: text().notNull().unique(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
});
