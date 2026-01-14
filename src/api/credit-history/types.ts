/**
 * Credit transaction type
 */
export type CreditTransactionType = "usage" | "purchase" | "refund";

/**
 * Credit transaction item
 */
export interface CreditTransaction {
  /** Unique transaction ID */
  id: string;
  /** Credit amount (+충전, -사용) */
  amount: number;
  /** Transaction type */
  type: CreditTransactionType;
  /** Reference ID (predictionId for usage, orderId for purchase) */
  referenceId: string | null;
  /** Human-readable description */
  description: string | null;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Request parameters for fetching credit history
 */
export interface CreditHistoryParams {
  /** Cursor for pagination (createdAt timestamp) */
  cursor?: string;
  /** Number of items to fetch (default: 20, max: 50) */
  limit?: number;
}

/**
 * Response type for /api/credit-history endpoint
 */
export interface CreditHistoryResponse {
  /** List of credit transactions */
  transactions: CreditTransaction[];
  /** Cursor for next page (null if no more) */
  nextCursor: string | null;
  /** Whether there are more results */
  hasMore: boolean;
}

/**
 * Error response type for credit history API
 */
export interface CreditHistoryErrorResponse {
  error: string;
  code?: string;
}
