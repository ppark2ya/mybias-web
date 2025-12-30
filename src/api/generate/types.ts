/**
 * Request type for /api/generate endpoint
 */
export interface GenerateRequest {
  /** Base64 encoded image */
  image: string;
  /** Upscale factor (default: 2) */
  upscale?: number;
  /** CodeFormer fidelity (0-1, default: 0.6) */
  fidelity?: number;
  /** Enable background enhancement (default: true) */
  backgroundEnhance?: boolean;
  /** Enable face upsampling (default: true) */
  faceUpsample?: boolean;
}

/**
 * Prediction status types from Replicate API
 */
export type PredictionStatus =
  | "starting"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

/**
 * Response type for /api/generate endpoint
 */
export interface GenerateResponse {
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
}

/**
 * Error response type
 */
export interface GenerateErrorResponse {
  error: string;
}
