import { apiClient } from "../../lib/axios";
import type { GenerateRequest, GenerateResponse } from "./types";

/**
 * Start AI image enhancement
 * @param request - Generation request parameters
 * @returns Promise with prediction response
 */
export async function generateImage(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const { data } = await apiClient.post<GenerateResponse>("/generate", request);
  return data;
}

/**
 * Default request parameters for AI enhancement
 */
export const DEFAULT_GENERATE_PARAMS: Partial<GenerateRequest> = {
  upscale: 1,
  fidelity: 0.6,
  backgroundEnhance: true,
  faceUpsample: true,
};

/**
 * Create a generate request with default parameters
 * @param image - Base64 encoded image
 * @param overrides - Optional parameter overrides
 */
export function createGenerateRequest(
  image: string,
  overrides?: Partial<Omit<GenerateRequest, "image">>
): GenerateRequest {
  return {
    ...DEFAULT_GENERATE_PARAMS,
    ...overrides,
    image,
  };
}
