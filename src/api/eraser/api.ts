import { apiClient } from "../../lib/axios";
import type { EraserRequest, EraserResponse } from "./types";

/**
 * Start AI magic eraser (inpainting)
 * @param request - Eraser request with image and mask
 * @returns Promise with prediction response
 */
export async function eraseImage(
  request: EraserRequest
): Promise<EraserResponse> {
  const { data } = await apiClient.post<EraserResponse>("/eraser", request);
  return data;
}

/**
 * Create an eraser request
 * @param image - Base64 encoded original image
 * @param mask - Base64 encoded mask image (white = erase, black = keep)
 */
export function createEraserRequest(image: string, mask: string): EraserRequest {
  return {
    image,
    mask,
  };
}
