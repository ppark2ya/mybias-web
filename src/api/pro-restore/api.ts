import { apiClient } from "../../lib/axios";
import type { ProRestoreRequest, ProRestoreResponse } from "./types";

/**
 * Default prompts optimized for K-pop idol photo restoration
 */
export const PRO_RESTORE_PROMPTS = {
  positive: "high quality, natural skin tone, studio lighting, detailed pores, k-pop idol, sharp focus, professional photo",
  negative: "red skin, blue skin, strong color cast, blurry, waxy skin, cartoon, illustration, distorted, artifacts, noise",
};

/**
 * Start Pro AI image restoration
 * Uses SUPIR model with prompt engineering for superior results
 * @param request - Restoration request parameters
 * @returns Promise with prediction response
 */
export async function proRestoreImage(
  request: ProRestoreRequest
): Promise<ProRestoreResponse> {
  const { data } = await apiClient.post<ProRestoreResponse>("/pro-restore", request);
  return data;
}

/**
 * Default request parameters for Pro restoration
 */
export const DEFAULT_PRO_RESTORE_PARAMS: Partial<ProRestoreRequest> = {
  upscale: 2,
  prompt: PRO_RESTORE_PROMPTS.positive,
  negativePrompt: PRO_RESTORE_PROMPTS.negative,
  denoisingStrength: 0.3,
};

/**
 * Create a pro-restore request with default parameters
 * @param image - Base64 encoded image
 * @param overrides - Optional parameter overrides
 */
export function createProRestoreRequest(
  image: string,
  overrides?: Partial<Omit<ProRestoreRequest, "image">>
): ProRestoreRequest {
  return {
    ...DEFAULT_PRO_RESTORE_PARAMS,
    ...overrides,
    image,
  };
}
