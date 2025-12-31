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
