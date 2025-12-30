import type { PredictionStatus } from "../generate/types";

/**
 * Response type for /api/status/:id endpoint
 * Same structure as GenerateResponse from Replicate API
 */
export interface StatusResponse {
  /** Prediction ID */
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
}

/**
 * Error response type
 */
export interface StatusErrorResponse {
  error: string;
}
