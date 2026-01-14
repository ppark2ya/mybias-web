import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { fetchCreditHistory } from "./api";
import type { CreditHistoryResponse, CreditHistoryErrorResponse } from "./types";

/**
 * Query keys for credit history API
 */
export const creditHistoryKeys = {
  all: ["credit-history"] as const,
  list: () => [...creditHistoryKeys.all, "list"] as const,
};

/**
 * Hook for fetching credit history with infinite scroll
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
 * } = useCreditHistoryInfiniteQuery({
 *   enabled: isAuthenticated,
 * });
 *
 * const transactions = data?.pages.flatMap(page => page.transactions) ?? [];
 * ```
 */
export function useCreditHistoryInfiniteQuery(options?: { enabled?: boolean }) {
  return useInfiniteQuery<
    CreditHistoryResponse,
    AxiosError<CreditHistoryErrorResponse>,
    InfiniteData<CreditHistoryResponse>,
    readonly ["credit-history", "list"],
    string | undefined
  >({
    queryKey: creditHistoryKeys.list(),
    queryFn: ({ pageParam }) => fetchCreditHistory({ cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    enabled: options?.enabled,
  });
}
