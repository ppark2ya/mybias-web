import { apiClient } from "../../lib/axios";
import type { ProRestoreRequest, ProRestoreResponse } from "./types";

/**
 * Start Pro AI image restoration
 * Uses Real-ESRGAN + CodeFormer blending for natural high-quality results
 * - Real-ESRGAN: Preserves skin texture and pores
 * - CodeFormer: Restores sharp facial features (eyes, nose, lips)
 * - Blending: Combines both for natural look without "AI waxy skin"
 * @param request - Restoration request parameters
 * @returns Promise with dual prediction response for client-side blending
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
  fidelity: 0.5, // CodeFormer fidelity (0.5 = good balance of restoration vs preservation)
  blendRatio: 0.7, // 70% CodeFormer, 30% Real-ESRGAN (golden ratio for natural look)
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
