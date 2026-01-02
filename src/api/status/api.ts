import { apiClient } from "../../lib/axios";
import type { StatusResponse } from "./types";

/**
 * Get prediction status by ID
 * @param predictionId - The prediction ID from generate response
 * @returns Promise with status response
 */
export async function getStatus(predictionId: string): Promise<StatusResponse> {
  const { data } = await apiClient.get<StatusResponse>(
    `/status/${predictionId}`
  );
  return data;
}

/**
 * Check if prediction is still processing
 */
export function isProcessing(status: StatusResponse["status"]): boolean {
  return status === "pending" || status === "processing";
}

/**
 * Check if prediction has completed (success or failure)
 */
export function isCompleted(status: StatusResponse["status"]): boolean {
  return (
    status === "succeeded" || status === "failed" || status === "canceled"
  );
}

/**
 * Get output URL from status response
 * @param response - Status response
 * @returns Output URL or undefined
 */
export function getOutputUrl(response: StatusResponse): string | undefined {
  if (response.status !== "succeeded" || !response.output) {
    return undefined;
  }
  return response.output;
}
