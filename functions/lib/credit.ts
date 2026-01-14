/**
 * Credit transaction utility for Cloudflare Pages Functions
 * Records all credit changes for history tracking
 */
import {
  creditTransactions,
  type CreditTransactionTypeValue,
} from "../../src/db/schema";
import type { DbClient } from "../types.d.ts";

/**
 * Record a credit transaction to the database
 *
 * @param db - Database client
 * @param userId - User ID
 * @param amount - Credit amount (+충전, -사용)
 * @param type - Transaction type (usage, purchase, refund)
 * @param referenceId - Reference ID (predictionId for usage, orderId for purchase)
 * @param description - Human-readable description
 *
 * @example
 * ```ts
 * // Record credit usage for image generation
 * await recordCreditTransaction(db, userId, -1, "usage", predictionId, "Image enhancement");
 *
 * // Record credit purchase
 * await recordCreditTransaction(db, userId, 60, "purchase", orderId, "Basic Plan");
 * ```
 */
export async function recordCreditTransaction(
  db: DbClient,
  userId: string,
  amount: number,
  type: CreditTransactionTypeValue,
  referenceId: string,
  description: string
): Promise<void> {
  try {
    await db.insert(creditTransactions).values({
      userId,
      amount,
      type,
      referenceId,
      description,
    });
  } catch (error) {
    // Log error but don't throw - transaction recording should not block main operation
    console.error("Failed to record credit transaction:", error);
  }
}
