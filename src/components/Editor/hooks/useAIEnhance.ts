import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  generateImage,
  createGenerateRequest,
  getStatus,
  getOutputUrl,
} from "../../../api";
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
import {
  getRemainingAIUsage,
  canUseAI,
  incrementAIUsage,
} from "../../../utils/rateLimit";
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
  const [remainingAIUsage, setRemainingAIUsage] = useState(() =>
    getRemainingAIUsage()
  );

  const handleAIEnhance = async () => {
    if (!currentImageState || isProcessing) return;

    if (!canUseAI()) {
      toast.error(t("editor.ai.limitReached"), {
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

      const generateResponse = await generateImage(createGenerateRequest(base64));
      const predictionId = generateResponse.id;

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
                  reject(new Error("No output URL received"));
                }
              } else if (statusData.status === "failed") {
                clearInterval(interval);
                reject(new Error(statusData.error || "Enhancement failed"));
              } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error("Enhancement timed out"));
              }
            } catch (error) {
              clearInterval(interval);
              reject(error);
            }
          }, POLLING.DEFAULT);
        });
      };

      const outputUrl = await pollForResult();
      const durationMs = Date.now() - startTime;
      trackAIEnhanceSuccess(durationMs);

      const remaining = incrementAIUsage();
      setRemainingAIUsage(remaining);

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
      const errorMessage =
        error instanceof Error ? error.message : t("editor.ai.failed");
      trackAIEnhanceFail(errorMessage);
      toast.error(errorMessage, {
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
