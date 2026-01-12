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
  // Image Object Removal - LaMa with Fast Fourier Convolutions (dpakkk/image-object-removal)
  // High-quality object removal without prompt, fills with natural background
  // Very cost-effective: ~4,545 runs per $1
  IMAGE_OBJECT_REMOVAL: "40e67426e1bf78199d78b36580389fbbdcb4c9cdc2bc2b489e99d713f167b3c5",
} as const;

export type ReplicateModelType = (typeof ReplicateModels)[keyof typeof ReplicateModels];
