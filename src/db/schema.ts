import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

/**
 * Default credits for new users
 */
export const DEFAULT_USER_CREDITS = 5;

/**
 * Profiles table - extends Supabase auth.users
 * Stores additional user information
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // References auth.users.id
  email: text("email"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  credits: integer("credits").default(DEFAULT_USER_CREDITS).notNull(),
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
 * Image generation status constants for type-safe usage
 */
export const ImageGenerationStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELED: "canceled",
} as const;

export type ImageGenerationStatusType =
  (typeof ImageGenerationStatus)[keyof typeof ImageGenerationStatus];

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
  stage: integer("stage"), // 1 = IDM-VTON, 2 = Face Swap
  parentId: text("parent_id"), // Links stage 2 to stage 1
  originalImageUrl: text("original_image_url"), // R2 URL to original image (for face swap)
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Credit transaction type enum
 */
export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "usage", // 이미지 생성 등으로 사용
  "purchase", // 크레딧 구매
  "refund", // 환불
]);

/**
 * Credit transaction type constants for type-safe usage
 */
export const CreditTransactionType = {
  USAGE: "usage",
  PURCHASE: "purchase",
  REFUND: "refund",
} as const;

export type CreditTransactionTypeValue =
  (typeof CreditTransactionType)[keyof typeof CreditTransactionType];

/**
 * Credit transactions table - tracks all credit changes
 * Records both credit usage (negative) and credit purchases (positive)
 */
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // +충전, -사용
    type: creditTransactionTypeEnum("type").notNull(),
    referenceId: text("reference_id"), // predictionId (usage) or orderId (purchase)
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("credit_transactions_user_id_idx").on(table.userId)]
);

// Type exports for use in application
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type NewImageGeneration = typeof imageGenerations.$inferInsert;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
