import type { PredictionStatus } from "../generate/types";

/**
 * Request type for /api/pro-restore endpoint
 * Uses SUPIR model for high-quality restoration with prompt engineering
 */
export interface ProRestoreRequest {
  /** Base64 encoded image */
  image: string;
  /** Upscale factor (default: 2) */
  upscale?: number;
  /** Positive prompt for guiding restoration */
  prompt?: string;
  /** Negative prompt to avoid unwanted artifacts */
  negativePrompt?: string;
  /** Denoising strength (0-1, default: 0.3) */
  denoisingStrength?: number;
}

/**
 * Response type for /api/pro-restore endpoint
 */
export interface ProRestoreResponse {
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
  /** Remaining credits after this request (costs 3 credits) */
  remainingCredits?: number;
}

/**
 * Error codes for pro-restore API
 */
export type ProRestoreErrorCode = "UNAUTHORIZED" | "INSUFFICIENT_CREDITS" | "INTERNAL_ERROR";

/**
 * Error response type
 */
export interface ProRestoreErrorResponse {
  error: string;
  code?: ProRestoreErrorCode;
}
