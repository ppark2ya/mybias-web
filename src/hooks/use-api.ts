import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { apiClient } from '@/api/axios-instance'
import type { ApiResponse, ApiError } from '@/types'
import type { AxiosError } from 'axios'

interface UseApiQueryOptions<T> extends Omit<UseQueryOptions<ApiResponse<T>, AxiosError<ApiError>>, 'queryKey' | 'queryFn'> {
  endpoint: string
}

interface UseApiMutationOptions<TData, TVariables> extends Omit<UseMutationOptions<ApiResponse<TData>, AxiosError<ApiError>, TVariables>, 'mutationFn'> {
  endpoint: string
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
}

export function useApiQuery<T>(options: UseApiQueryOptions<T>) {
  const { endpoint, ...queryOptions } = options

  return useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<T>>(endpoint)
      return response.data
    },
    ...queryOptions,
  })
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  options: UseApiMutationOptions<TData, TVariables>
) {
  const { endpoint, method = 'POST', ...mutationOptions } = options

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient.request<ApiResponse<TData>>({
        url: endpoint,
        method,
        data: variables,
      })
      return response.data
    },
    ...mutationOptions,
  })
}
