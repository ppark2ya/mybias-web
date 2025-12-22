import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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

export function useAIEnhance(
  currentImageState: ImageState | undefined,
  selectedIndex: number,
  setImageStates: React.Dispatch<React.SetStateAction<Map<number, ImageState>>>,
  historyIndex: Map<number, number>,
  setHistory: React.Dispatch<React.SetStateAction<Map<number, string[]>>>,
  setHistoryIndex: React.Dispatch<React.SetStateAction<Map<number, number>>>,
  setProcessingMessage: (message: string) => void,
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void
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

      const startResponse = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          upscale: 1,
          fidelity: 0.6,
          backgroundEnhance: true,
          faceUpsample: true,
        }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.error || "Failed to start enhancement");
      }

      const startData = await startResponse.json();
      const predictionId = startData.id;

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
              const statusResponse = await fetch(`/api/status/${predictionId}`);
              const statusData = await statusResponse.json();

              if (statusData.status === "succeeded") {
                clearInterval(interval);
                resolve(statusData.output);
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
          }, 3000);
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
        const newMap = new Map(prev);
        newMap.set(selectedIndex, {
          blobUrl,
          width: dimensions.width,
          height: dimensions.height,
        });
        return newMap;
      });
      setHistory((prev) => {
        const newMap = new Map(prev);
        const currentHistory = newMap.get(selectedIndex) || [];
        const newHistory = [...currentHistory.slice(0, currentIdx + 1), blobUrl];
        newMap.set(selectedIndex, newHistory);
        return newMap;
      });
      setHistoryIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedIndex, currentIdx + 1);
        return newMap;
      });
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
