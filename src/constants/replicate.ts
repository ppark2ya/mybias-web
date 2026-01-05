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
  // LaMa - Large Mask Inpainting model (allenhooo/lama)
  LAMA: "cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72",
} as const;

export type ReplicateModelType = (typeof ReplicateModels)[keyof typeof ReplicateModels];
