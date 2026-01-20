import { apiClient } from "../lib/axios";
import type { GenerateResponse } from "./generate/types";

export interface LookbookRequest {
  human_image: string;
  garm_image: string;
  garment_des?: string;
}

export interface ChildPredictionResponse {
  child: {
    id: string;
    status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    output: string | null;
    error: string | null;
    stage: number;
    created_at: string;
    completed_at: string | null;
  } | null;
}

export const virtualTryOn = async (
  data: LookbookRequest
): Promise<GenerateResponse> => {
  const response = await apiClient.post<GenerateResponse>("/lookbook", data);
  return response.data;
};

/**
 * Get child prediction (Stage 2) for a parent prediction ID
 */
export const getChildPrediction = async (
  parentId: string
): Promise<ChildPredictionResponse> => {
  const response = await apiClient.get<ChildPredictionResponse>(
    `/status/child?parentId=${parentId}`
  );
  return response.data;
};
