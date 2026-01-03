import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
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
 * Hook for fetching gallery images with infinite scroll
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   error,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useGalleryInfiniteQuery({
 *   enabled: isAuthenticated,
 * });
 *
 * const images = data?.pages.flatMap(page => page.images) ?? [];
 * ```
 */
export function useGalleryInfiniteQuery(options?: { enabled?: boolean }) {
  return useInfiniteQuery<
    GalleryResponse,
    AxiosError<GalleryErrorResponse>,
    InfiniteData<GalleryResponse>,
    readonly ["gallery", "list"],
    string | undefined
  >({
    queryKey: galleryKeys.list(),
    queryFn: ({ pageParam }) => fetchGallery({ cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    enabled: options?.enabled,
  });
}
