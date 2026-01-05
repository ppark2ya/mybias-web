import type { PredictionStatus } from "../generate/types";

/**
 * Request type for /api/eraser endpoint
 */
export interface EraserRequest {
  /** Base64 encoded original image */
  image: string;
  /** Base64 encoded mask image (white = erase, black = keep) */
  mask: string;
}

/**
 * Response type for /api/eraser endpoint
 */
export interface EraserResponse {
  /** Prediction ID from Replicate */
  id: string;
  /** Model identifier */
  model: string;
  /** Model version */
  version: string;
  /** Current prediction status */
  status: PredictionStatus;
  /** Input parameters */
  input: Record<string, unknown>;
  /** Output URL(s) when succeeded */
  output?: string | string[] | null;
  /** Error message if failed */
  error?: string | null;
  /** Processing logs */
  logs?: string;
  /** Performance metrics */
  metrics?: {
    predict_time?: number;
  };
  /** Creation timestamp */
  created_at: string;
  /** Processing start timestamp */
  started_at?: string;
  /** Completion timestamp */
  completed_at?: string;
  /** Related URLs */
  urls: {
    get: string;
    cancel: string;
  };
  /** Remaining credits after this request */
  remainingCredits?: number;
}

/**
 * Error codes for eraser API
 */
export type EraserErrorCode = "UNAUTHORIZED" | "INSUFFICIENT_CREDITS";

/**
 * Error response type
 */
export interface EraserErrorResponse {
  error: string;
  code?: EraserErrorCode;
}
