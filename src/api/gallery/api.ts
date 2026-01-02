import { apiClient } from "../../lib/axios";
import type { GalleryResponse } from "./types";

/**
 * Fetch user's gallery images
 * @returns Promise with gallery images
 */
export async function fetchGallery(): Promise<GalleryResponse> {
  const { data } = await apiClient.get<GalleryResponse>("/gallery");
  return data;
}

/**
 * Download image by prediction ID
 * Returns the image as a Blob for client-side download
 * @param predictionId - The prediction ID of the image to download
 * @returns Promise with image Blob
 */
export async function downloadImage(predictionId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/download/${predictionId}`, {
    responseType: "blob",
  });
  return data;
}
