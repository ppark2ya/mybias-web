import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  History,
  Loader2,
  Plus,
  Minus,
  ShoppingCart,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  useCreditHistoryInfiniteQuery,
  type CreditTransaction,
  type CreditTransactionType,
} from "../api/credit-history";

export const Route = createFileRoute("/credit-history")({
  component: CreditHistoryPage,
});

function CreditHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCreditHistoryInfiniteQuery({
    enabled: isAuthenticated,
  });

  const transactions = data?.pages.flatMap((page) => page.transactions) ?? [];

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400">
        <div className="w-8 h-8 border-4 rounded-full border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen px-2 py-4 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 sm:py-6 sm:px-4 lg:py-8 lg:px-6">
      {/* Back Button */}
      <div className="fixed z-50 top-4 left-4 sm:top-6 sm:left-6">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white transition-all duration-200 border rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">
            {t("creditHistory.backToHome", "Back")}
          </span>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-2xl pt-16 mx-auto sm:pt-20">
        <div className="overflow-hidden bg-white shadow-2xl rounded-3xl">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {t("creditHistory.title", "Credit History")}
                </h1>
                <p className="text-sm text-gray-500">
                  {t("creditHistory.subtitle", "View your credit usage")}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-red-500">
                  {t("creditHistory.loadError", "Failed to load history")}
                </p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                  <History className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-600">
                  {t("creditHistory.empty", "No credit history")}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {t(
                    "creditHistory.emptyHint",
                    "Start using credits to see your history"
                  )}
                </p>
                <Link
                  to="/pricing"
                  className="px-4 py-2 mt-4 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
                >
                  {t("creditHistory.buyCredits", "Buy Credits")}
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </div>

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="flex items-center justify-center py-8"
                  >
                    <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: CreditTransaction }) {
  const { t } = useTranslation();
  const isPositive = transaction.amount > 0;

  const getTypeIcon = (type: CreditTransactionType) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="w-4 h-4" />;
      case "usage":
        return <Sparkles className="w-4 h-4" />;
      case "refund":
        return <RotateCcw className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: CreditTransactionType) => {
    switch (type) {
      case "purchase":
        return t("creditHistory.type.purchase", "Purchase");
      case "usage":
        return t("creditHistory.type.usage", "Usage");
      case "refund":
        return t("creditHistory.type.refund", "Refund");
      default:
        return type;
    }
  };

  const getTypeColor = (type: CreditTransactionType) => {
    switch (type) {
      case "purchase":
        return "bg-green-100 text-green-700";
      case "usage":
        return "bg-purple-100 text-purple-700";
      case "refund":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 transition-colors rounded-xl bg-gray-50 hover:bg-gray-100">
      {/* Type Icon */}
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full ${getTypeColor(transaction.type)}`}
      >
        {getTypeIcon(transaction.type)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}
          >
            {getTypeLabel(transaction.type)}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600 truncate">
          {transaction.description || "-"}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {new Date(transaction.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-1">
        {isPositive ? (
          <Plus className="w-4 h-4 text-green-500" />
        ) : (
          <Minus className="w-4 h-4 text-red-500" />
        )}
        <span
          className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}
        >
          {Math.abs(transaction.amount)}
        </span>
      </div>
    </div>
  );
}

export default CreditHistoryPage;
