import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

/**
 * Profiles table - extends Supabase auth.users
 * Stores additional user information
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // References auth.users.id
  email: text("email"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * User settings table - stores user preferences and usage data
 */
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  dailyAiUsage: integer("daily_ai_usage").default(0).notNull(),
  lastUsageReset: timestamp("last_usage_reset", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
