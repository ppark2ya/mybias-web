import type { PredictionStatus } from "../generate/types";

/**
 * Response type for /api/status/:id endpoint
 * Returns image generation status from database
 */
export interface StatusResponse {
  /** Prediction ID */
  id: string;
  /** Current generation status */
  status: PredictionStatus;
  /** Output image URL (R2 URL) when succeeded */
  output: string | null;
  /** Error message if failed */
  error: string | null;
  /** Creation timestamp (ISO string) */
  created_at: string;
  /** Completion timestamp (ISO string) */
  completed_at: string | null;
}

/**
 * Error response type
 */
export interface StatusErrorResponse {
  error: string;
}
