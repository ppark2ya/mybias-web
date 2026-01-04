import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import {
  generateImage,
  createGenerateRequest,
  getStatus,
  getOutputUrl,
} from "../../../api";
import type { GenerateErrorResponse } from "../../../api/generate/types";
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

export interface AIEnhanceResult {
  beforeImageUrl: string;
  afterImageUrl: string;
}

export function useAIEnhance(
  currentImageState: ImageState | undefined,
  selectedIndex: number,
  setImageStates: React.Dispatch<React.SetStateAction<Map<number, ImageState>>>,
  historyIndex: Map<number, number>,
  setHistory: React.Dispatch<React.SetStateAction<Map<number, string[]>>>,
  setHistoryIndex: React.Dispatch<React.SetStateAction<Map<number, number>>>,
  setProcessingMessage: (message: string) => void,
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void,
  onEnhanceComplete?: (result: AIEnhanceResult) => void
) {
  const { t } = useTranslation();
  const { profile, isAuthenticated, refreshProfile } = useAuth();

  // Get remaining credits from profile (server-side)
  const [remainingAIUsage, setRemainingAIUsage] = useState<number>(
    profile?.credits ?? 0
  );

  // Sync with profile changes
  if (profile?.credits !== undefined && profile.credits !== remainingAIUsage) {
    setRemainingAIUsage(profile.credits);
  }

  const handleAIEnhance = async (fidelity: number = 0.5) => {
    if (!currentImageState || isProcessing) return;

    // Check authentication
    if (!isAuthenticated) {
      toast.error(t("editor.ai.loginRequired"), {
        className: "text-center",
      });
      return;
    }

    // Check credits (client-side pre-check)
    if (remainingAIUsage <= 0) {
      toast.error(t("editor.ai.insufficientCredits"), {
        className: "text-center",
      });
      return;
    }

    // Store the original image URL before processing
    const beforeImageUrl = currentImageState.blobUrl;

    trackAIEnhanceStart();
    setIsProcessing(true);
    setProcessingMessage(t("editor.ai.preparingImage"));

    try {
      const startTime = Date.now();
      const response = await fetch(currentImageState.blobUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      setProcessingMessage(t("editor.ai.requestingServer"));

      const generateResponse = await generateImage(createGenerateRequest(base64, { fidelity }));
      const predictionId = generateResponse.id;

      // Update remaining credits from server response
      if (generateResponse.remainingCredits !== undefined) {
        setRemainingAIUsage(generateResponse.remainingCredits);
      }

      if (!predictionId) {
        throw new Error("No prediction ID received");
      }

      setProcessingMessage(t("editor.ai.analyzingFaces"));
      const pollForResult = (): Promise<string> => {
        return new Promise((resolve, reject) => {
          const maxAttempts = 120;
          let attempts = 0;
          const messages = [
            t("editor.ai.analyzingFaces"),
            t("editor.ai.enhancingSkinTone"),
            t("editor.ai.sharpeningEyes"),
            t("editor.ai.enhancingDetails"),
            t("editor.ai.almostDone"),
          ];

          const interval = setInterval(async () => {
            attempts++;
            const messageIdx = Math.min(
              Math.floor(attempts / 5),
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
                  // Log technical error for debugging
                  console.error("No output URL in succeeded status");
                  reject(new Error(t("editor.ai.failed")));
                }
              } else if (statusData.status === "failed") {
                clearInterval(interval);
                // Log technical error for debugging, show user-friendly message
                if (statusData.error) {
                  console.error("AI enhancement failed:", statusData.error);
                }
                reject(new Error(t("editor.ai.failed")));
              } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error("AI enhancement timed out after", maxAttempts, "attempts");
                reject(new Error(t("editor.ai.timeout")));
              }
            } catch (error) {
              clearInterval(interval);
              // Log technical error, reject with user-friendly message
              console.error("Status polling error:", error);
              reject(new Error(t("editor.ai.failed")));
            }
          }, POLLING.DEFAULT);
        });
      };

      const outputUrl = await pollForResult();
      const durationMs = Date.now() - startTime;
      trackAIEnhanceSuccess(durationMs);

      // Refresh profile to sync credits
      refreshProfile();

      setProcessingMessage(t("editor.ai.downloadingImage"));

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
      if (onEnhanceComplete) {
        onEnhanceComplete({
          beforeImageUrl,
          afterImageUrl: blobUrl,
        });
      }
    } catch (error) {
      console.error("Failed to enhance image:", error);

      // Handle API error responses
      const axiosError = error as AxiosError<GenerateErrorResponse>;
      const errorCode = axiosError.response?.data?.code;

      let displayMessage: string;

      // Map error codes to user-friendly messages
      if (errorCode === "UNAUTHORIZED") {
        displayMessage = t("editor.ai.loginRequired");
      } else if (errorCode === "INSUFFICIENT_CREDITS") {
        displayMessage = t("editor.ai.insufficientCredits");
        setRemainingAIUsage(0);
      } else if (errorCode === "INTERNAL_ERROR") {
        // Server internal error - show generic message
        displayMessage = t("editor.ai.failed");
      } else if (error instanceof Error && error.message) {
        // Error message already translated (from pollForResult)
        displayMessage = error.message;
      } else {
        displayMessage = t("editor.ai.failed");
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
    remainingAIUsage,
    handleAIEnhance,
  };
}
