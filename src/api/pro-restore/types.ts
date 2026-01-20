import type { PredictionStatus } from "../generate/types";

/**
 * Request type for /api/pro-restore endpoint
 * Uses Real-ESRGAN + CodeFormer blending for natural high-quality restoration
 */
export interface ProRestoreRequest {
  /** Base64 encoded image */
  image: string;
  /** Upscale factor (default: 2) */
  upscale?: number;
  /** CodeFormer fidelity (0.5-0.6 recommended for face restoration) */
  fidelity?: number;
  /** Blend ratio for CodeFormer (0.7 = 70% CodeFormer, 30% Real-ESRGAN) */
  blendRatio?: number;
}

/**
 * Individual prediction info
 */
export interface PredictionInfo {
  id: string;
  status: PredictionStatus;
}

/**
 * Dual predictions for blending
 */
export interface DualPredictions {
  /** Real-ESRGAN prediction (skin texture, pores) */
  realEsrgan: PredictionInfo;
  /** CodeFormer prediction (facial features) */
  codeformer: PredictionInfo;
}

/**
 * Response type for /api/pro-restore endpoint
 */
export interface ProRestoreResponse {
  /** Primary prediction ID (CodeFormer) for compatibility */
  id: string;
  /** Current prediction status */
  status: PredictionStatus;
  /** Dual prediction IDs for blending */
  predictions: DualPredictions;
  /** Blend ratio for client-side blending (0.7 = 70% CodeFormer) */
  blendRatio: number;
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
