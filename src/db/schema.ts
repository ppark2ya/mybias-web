import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

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

/**
 * Image generation status enum
 */
export const imageGenerationStatusEnum = pgEnum("image_generation_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "canceled",
]);

/**
 * Image generations table - tracks AI image generation requests
 * Maps Replicate prediction IDs to users and stores results
 */
export const imageGenerations = pgTable("image_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  predictionId: text("prediction_id").notNull().unique(), // Replicate prediction ID
  status: imageGenerationStatusEnum("status").default("pending").notNull(),
  inputImageUrl: text("input_image_url"), // Original image URL (optional, for reference)
  outputImageUrl: text("output_image_url"), // R2 stored image URL
  replicateOutputUrl: text("replicate_output_url"), // Original Replicate output URL
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type NewImageGeneration = typeof imageGenerations.$inferInsert;
