import { apiClient } from "../../lib/axios";
import type { CreditHistoryResponse, CreditHistoryParams } from "./types";

/**
 * Fetch user's credit history with pagination
 * @param params - Pagination parameters (cursor, limit)
 * @returns Promise with credit transactions and pagination info
 */
export async function fetchCreditHistory(
  params?: CreditHistoryParams
): Promise<CreditHistoryResponse> {
  const { data } = await apiClient.get<CreditHistoryResponse>(
    "/credit-history",
    {
      params: {
        cursor: params?.cursor,
        limit: params?.limit,
      },
    }
  );
  return data;
}
