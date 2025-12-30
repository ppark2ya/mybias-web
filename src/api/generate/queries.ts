import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { generateImage } from "./api";
import type {
  GenerateRequest,
  GenerateResponse,
  GenerateErrorResponse,
} from "./types";

/**
 * Query keys for generate API
 */
export const generateKeys = {
  all: ["generate"] as const,
  mutation: () => [...generateKeys.all, "mutation"] as const,
};

/**
 * Hook for AI image generation mutation
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useGenerateMutation({
 *   onSuccess: (data) => {
 *     console.log('Prediction ID:', data.id);
 *   },
 * });
 *
 * mutate({ image: base64Image });
 * ```
 */
export function useGenerateMutation(
  options?: Omit<
    UseMutationOptions<
      GenerateResponse,
      AxiosError<GenerateErrorResponse>,
      GenerateRequest
    >,
    "mutationFn"
  >
) {
  return useMutation({
    mutationFn: generateImage,
    ...options,
  });
}
