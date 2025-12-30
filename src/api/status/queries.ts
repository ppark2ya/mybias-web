import {
  useQuery,
  type UseQueryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { getStatus, isProcessing } from "./api";
import type { StatusResponse, StatusErrorResponse } from "./types";
import { POLLING } from "../../constants/times";

/**
 * Query keys for status API
 */
export const statusKeys = {
  all: ["status"] as const,
  detail: (id: string) => [...statusKeys.all, id] as const,
};

/**
 * Hook for fetching prediction status
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useStatusQuery('prediction-id', {
 *   refetchInterval: (query) =>
 *     query.state.data?.status === 'succeeded' ? false : 3000,
 * });
 * ```
 */
export function useStatusQuery(
  predictionId: string,
  options?: Omit<
    UseQueryOptions<StatusResponse, AxiosError<StatusErrorResponse>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: statusKeys.detail(predictionId),
    queryFn: () => getStatus(predictionId),
    ...options,
  });
}

/**
 * Hook for polling prediction status until completion
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useStatusPolling('prediction-id', {
 *   onSuccess: (data) => {
 *     if (data.status === 'succeeded') {
 *       console.log('Done!', data.output);
 *     }
 *   },
 * });
 * ```
 */
export function useStatusPolling(
  predictionId: string | null,
  options?: Omit<
    UseQueryOptions<StatusResponse, AxiosError<StatusErrorResponse>>,
    "queryKey" | "queryFn" | "refetchInterval"
  >
) {
  return useQuery({
    queryKey: statusKeys.detail(predictionId ?? ""),
    queryFn: () => getStatus(predictionId!),
    enabled: !!predictionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling when completed
      if (status && !isProcessing(status)) {
        return false;
      }
      return POLLING.DEFAULT;
    },
    ...options,
  });
}

/**
 * Prefetch status query
 */
export function prefetchStatus(queryClient: QueryClient, predictionId: string) {
  return queryClient.prefetchQuery({
    queryKey: statusKeys.detail(predictionId),
    queryFn: () => getStatus(predictionId),
  });
}

/**
 * Invalidate status query
 */
export function invalidateStatus(
  queryClient: QueryClient,
  predictionId: string
) {
  return queryClient.invalidateQueries({
    queryKey: statusKeys.detail(predictionId),
  });
}
