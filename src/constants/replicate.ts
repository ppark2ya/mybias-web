/**
 * Replicate API constants
 * @see https://replicate.com/docs/reference/http#predictions.get
 */

/**
 * Replicate prediction status constants
 */
export const ReplicatePredictionStatus = {
  STARTING: "starting",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELED: "canceled",
} as const;

export type ReplicatePredictionStatusType =
  (typeof ReplicatePredictionStatus)[keyof typeof ReplicatePredictionStatus];

/**
 * Replicate model versions
 */
export const ReplicateModels = {
  // CodeFormer - Face Restoration model (sczhou/codeformer)
  CODEFORMER: "cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
  // Bria Eraser - Professional object removal model (bria/eraser)
  // High-quality inpainting without prompt, fills removed areas with natural background
  // No smudging, trained on licensed data for commercial use
  BRIA_ERASER: "204e6eb4d3d835a30bf64cdd90c650cebd441248fd13f70205c70e43d75b9bf8",
} as const;

export type ReplicateModelType = (typeof ReplicateModels)[keyof typeof ReplicateModels];
