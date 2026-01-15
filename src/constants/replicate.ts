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
  // Good for facial features (eyes, nose, lips) but can look waxy on skin
  CODEFORMER: "cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
  // Real-ESRGAN - General upscaling model (nightmareai/real-esrgan)
  // Good for skin texture and pores but facial features may be blurry
  REAL_ESRGAN: "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
  // Image Object Removal - LaMa with Fast Fourier Convolutions (dpakkk/image-object-removal)
  // High-quality object removal without prompt, fills with natural background
  // Very cost-effective: ~4,545 runs per $1
  IMAGE_OBJECT_REMOVAL: "40e67426e1bf78199d78b36580389fbbdcb4c9cdc2bc2b489e99d713f167b3c5",
  // Stable Diffusion Inpainting v2.0
  // Higher quality generative inpainting, better for natural blending
  STABLE_DIFFUSION_INPAINTING: "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
  // Clarity Upscaler - SDXL-based upscaler with prompt support (philz1337x/clarity-upscaler)
  // High-quality 2x upscaling with prompt engineering for natural skin tones
  // Costs ~3x more than CodeFormer but produces superior results
  CLARITY_UPSCALER: "dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
} as const;

export type ReplicateModelType = (typeof ReplicateModels)[keyof typeof ReplicateModels];
