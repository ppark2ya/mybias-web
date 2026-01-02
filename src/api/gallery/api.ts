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
