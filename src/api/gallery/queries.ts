import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { fetchGallery } from "./api";
import type { GalleryResponse, GalleryErrorResponse } from "./types";

/**
 * Query keys for gallery API
 */
export const galleryKeys = {
  all: ["gallery"] as const,
  list: () => [...galleryKeys.all, "list"] as const,
};

/**
 * Hook for fetching gallery images
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGalleryQuery({
 *   enabled: isAuthenticated,
 * });
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 *
 * return <GalleryGrid images={data.images} />;
 * ```
 */
export function useGalleryQuery(
  options?: Omit<
    UseQueryOptions<GalleryResponse, AxiosError<GalleryErrorResponse>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: galleryKeys.list(),
    queryFn: fetchGallery,
    ...options,
  });
}
