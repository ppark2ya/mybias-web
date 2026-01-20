import { eq, desc, lt, and } from "drizzle-orm";
import { creditTransactions } from "../../src/db/schema";
import type { ContextData } from "../types.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export const onRequestGet: PagesFunction<unknown, string, ContextData> = async (
  context
) => {
  try {
    const { data, request } = context;
    const db = data.db;

    // Check if user is authenticated
    const user = data.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam
      ? Math.min(parseInt(limitParam, 10), MAX_LIMIT)
      : DEFAULT_LIMIT;

    // Build query conditions
    const conditions = [eq(creditTransactions.userId, user.id)];

    // Add cursor condition if provided (cursor is the createdAt timestamp)
    if (cursor) {
      const cursorDate = new Date(cursor);
      conditions.push(lt(creditTransactions.createdAt, cursorDate));
    }

    // Query user's credit transactions with pagination
    const transactions = await db
      .select({
        id: creditTransactions.id,
        amount: creditTransactions.amount,
        type: creditTransactions.type,
        referenceId: creditTransactions.referenceId,
        description: creditTransactions.description,
        createdAt: creditTransactions.createdAt,
      })
      .from(creditTransactions)
      .where(and(...conditions))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Check if there are more results
    const hasMore = transactions.length > limit;
    const results = hasMore ? transactions.slice(0, limit) : transactions;

    // Format results
    const formattedTransactions = results.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      referenceId: t.referenceId,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));

    // Get next cursor from the last item
    const nextCursor =
      hasMore && results.length > 0
        ? results[results.length - 1].createdAt.toISOString()
        : null;

    return new Response(
      JSON.stringify({
        transactions: formattedTransactions,
        nextCursor,
        hasMore,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    // Log technical error for debugging
    console.error("Credit history error:", error);

    // Return empty list on DB error
    return new Response(
      JSON.stringify({ transactions: [], nextCursor: null, hasMore: false }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};
