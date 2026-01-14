import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import {
  proRestoreImage,
  createProRestoreRequest,
  getStatus,
  getOutputUrl,
} from "../../../api";
import type { ProRestoreErrorResponse } from "../../../api/pro-restore/types";
import { creditHistoryKeys } from "../../../api/credit-history";
import { POLLING } from "../../../constants/times";
import {
  getImageDimensions,
  urlToBlobUrl,
} from "../../../utils/imageEditor";
import {
  trackAIEnhanceStart,
  trackAIEnhanceSuccess,
  trackAIEnhanceFail,
} from "../../../utils/analytics";
import { useAuth } from "../../../hooks/useAuth";
import type { ImageState } from "./useEditorState";

export interface ProRestoreResult {
  beforeImageUrl: string;
  afterImageUrl: string;
}

/** Pro Restore costs 3 credits per use */
export const PRO_RESTORE_CREDIT_COST = 3;

export function useProRestore(
  currentImageState: ImageState | undefined,
  selectedIndex: number,
  setImageStates: React.Dispatch<React.SetStateAction<Map<number, ImageState>>>,
  historyIndex: Map<number, number>,
  setHistory: React.Dispatch<React.SetStateAction<Map<number, string[]>>>,
  setHistoryIndex: React.Dispatch<React.SetStateAction<Map<number, number>>>,
  setProcessingMessage: (message: string) => void,
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void,
  onRestoreComplete?: (result: ProRestoreResult) => void
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { profile, isAuthenticated, refreshProfile } = useAuth();

  // Get remaining credits from profile (server-side)
  const [remainingCredits, setRemainingCredits] = useState<number>(
    profile?.credits ?? 0
  );

  // Sync with profile changes
  if (profile?.credits !== undefined && profile.credits !== remainingCredits) {
    setRemainingCredits(profile.credits);
  }

  const handleProRestore = async (denoisingStrength: number = 0.3) => {
    if (!currentImageState || isProcessing) return;

    // Check authentication
    if (!isAuthenticated) {
      toast.error(t("editor.ai.loginRequired"), {
        className: "text-center",
      });
      return;
    }

    // Check credits (client-side pre-check) - Pro Restore costs 3 credits
    if (remainingCredits < PRO_RESTORE_CREDIT_COST) {
      toast.error(t("editor.ai.insufficientCredits"), {
        className: "text-center",
      });
      return;
    }

    // Store the original image URL before processing
    const beforeImageUrl = currentImageState.blobUrl;

    trackAIEnhanceStart();
    setIsProcessing(true);
    setProcessingMessage(t("editor.proRestore.preparingImage"));

    try {
      const startTime = Date.now();
      const response = await fetch(currentImageState.blobUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      setProcessingMessage(t("editor.proRestore.requestingServer"));

      const generateResponse = await proRestoreImage(
        createProRestoreRequest(base64, { denoisingStrength })
      );
      const predictionId = generateResponse.id;

      // Update remaining credits from server response
      if (generateResponse.remainingCredits !== undefined) {
        setRemainingCredits(generateResponse.remainingCredits);
      }

      if (!predictionId) {
        throw new Error("No prediction ID received");
      }

      setProcessingMessage(t("editor.proRestore.analyzingImage"));
      const pollForResult = (): Promise<string> => {
        return new Promise((resolve, reject) => {
          const maxAttempts = 180; // Pro restore may take longer
          let attempts = 0;
          const messages = [
            t("editor.proRestore.analyzingImage"),
            t("editor.proRestore.restoringDetails"),
            t("editor.proRestore.enhancingSkinTone"),
            t("editor.proRestore.optimizingColors"),
            t("editor.proRestore.upscaling"),
            t("editor.proRestore.almostDone"),
          ];

          const interval = setInterval(async () => {
            attempts++;
            const messageIdx = Math.min(
              Math.floor(attempts / 6),
              messages.length - 1
            );
            setProcessingMessage(messages[messageIdx]);

            try {
              const statusData = await getStatus(predictionId);

              if (statusData.status === "succeeded") {
                clearInterval(interval);
                const outputUrl = getOutputUrl(statusData);
                if (outputUrl) {
                  resolve(outputUrl);
                } else {
                  console.error("No output URL in succeeded status");
                  reject(new Error(t("editor.proRestore.failed")));
                }
              } else if (statusData.status === "failed") {
                clearInterval(interval);
                if (statusData.error) {
                  console.error("Pro restoration failed:", statusData.error);
                }
                reject(new Error(t("editor.proRestore.failed")));
              } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error("Pro restoration timed out after", maxAttempts, "attempts");
                reject(new Error(t("editor.proRestore.timeout")));
              }
            } catch (error) {
              clearInterval(interval);
              console.error("Status polling error:", error);
              reject(new Error(t("editor.proRestore.failed")));
            }
          }, POLLING.DEFAULT);
        });
      };

      const outputUrl = await pollForResult();
      const durationMs = Date.now() - startTime;
      trackAIEnhanceSuccess(durationMs);

      // Refresh profile and credit history to sync credits
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: creditHistoryKeys.all });

      setProcessingMessage(t("editor.proRestore.downloadingImage"));

      const [dimensions, blobUrl] = await Promise.all([
        getImageDimensions(outputUrl),
        urlToBlobUrl(outputUrl),
      ]);

      const currentIdx = historyIndex.get(selectedIndex) ?? 0;

      setImageStates((prev) => {
        const newMap = new Map(prev || new Map());
        newMap.set(selectedIndex, {
          blobUrl,
          width: dimensions.width,
          height: dimensions.height,
        });
        return newMap;
      });
      setHistory((prev) => {
        const newMap = new Map(prev || new Map());
        const currentHistory = newMap.get(selectedIndex) || [];
        const newHistory = [...currentHistory.slice(0, currentIdx + 1), blobUrl];
        newMap.set(selectedIndex, newHistory);
        return newMap;
      });
      setHistoryIndex((prev) => {
        const newMap = new Map(prev || new Map());
        newMap.set(selectedIndex, currentIdx + 1);
        return newMap;
      });

      // Call the completion callback with before/after URLs
      if (onRestoreComplete) {
        onRestoreComplete({
          beforeImageUrl,
          afterImageUrl: blobUrl,
        });
      }
    } catch (error) {
      console.error("Failed to restore image:", error);

      // Handle API error responses
      const axiosError = error as AxiosError<ProRestoreErrorResponse>;
      const errorCode = axiosError.response?.data?.code;

      let displayMessage: string;

      // Map error codes to user-friendly messages
      if (errorCode === "UNAUTHORIZED") {
        displayMessage = t("editor.ai.loginRequired");
      } else if (errorCode === "INSUFFICIENT_CREDITS") {
        displayMessage = t("editor.ai.insufficientCredits");
        setRemainingCredits(0);
      } else if (errorCode === "INTERNAL_ERROR") {
        displayMessage = t("editor.proRestore.failed");
      } else if (error instanceof Error && error.message) {
        displayMessage = error.message;
      } else {
        displayMessage = t("editor.proRestore.failed");
      }

      trackAIEnhanceFail(displayMessage);
      toast.error(displayMessage, {
        className: "text-center",
      });
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  return {
    remainingCredits,
    handleProRestore,
  };
}
