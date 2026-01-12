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
  // LaMa - Large Mask Inpainting model (zylim0702/remove-object)
  // Better AI inpainting that fills removed areas with natural background
  LAMA: "0e3a841c913f597c1e4c321560aa69e2bc1f15c65f8c366caafc379240efd8ba",
} as const;

export type ReplicateModelType = (typeof ReplicateModels)[keyof typeof ReplicateModels];
