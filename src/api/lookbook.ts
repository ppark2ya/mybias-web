import { apiClient } from "../lib/axios";
import type { GenerateResponse } from "./generate/types";

export interface LookbookRequest {
  human_image: string;
  garm_image: string;
  garment_des?: string;
}

export const virtualTryOn = async (
  data: LookbookRequest
): Promise<GenerateResponse> => {
  const response = await apiClient.post<GenerateResponse>("/api/lookbook", data);
  return response.data;
};
