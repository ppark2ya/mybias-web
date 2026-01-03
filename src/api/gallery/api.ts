import { apiClient } from "../../lib/axios";
import type { GalleryResponse, GalleryParams } from "./types";

/**
 * Fetch user's gallery images with pagination
 * @param params - Pagination parameters (cursor, limit)
 * @returns Promise with gallery images and pagination info
 */
export async function fetchGallery(params?: GalleryParams): Promise<GalleryResponse> {
  const { data } = await apiClient.get<GalleryResponse>("/gallery", {
    params: {
      cursor: params?.cursor,
      limit: params?.limit,
    },
  });
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
