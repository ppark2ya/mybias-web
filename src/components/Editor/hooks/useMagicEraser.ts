import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import {
  eraseImage,
  createEraserRequest,
  getStatus,
  getOutputUrl,
} from "../../../api";
import type { EraserErrorResponse } from "../../../api/eraser/types";
import { POLLING } from "../../../constants/times";
import {
  getImageDimensions,
  urlToBlobUrl,
} from "../../../utils/imageEditor";
import {
  trackMagicEraserStart,
  trackMagicEraserSuccess,
  trackMagicEraserFail,
} from "../../../utils/analytics";
import { useAuth } from "../../../hooks/useAuth";
import type { ImageState } from "./useEditorState";

export interface MagicEraserResult {
  beforeImageUrl: string;
  afterImageUrl: string;
}

export function useMagicEraser(
  currentImageState: ImageState | undefined,
  selectedIndex: number,
  setImageStates: React.Dispatch<React.SetStateAction<Map<number, ImageState>>>,
  historyIndex: Map<number, number>,
  setHistory: React.Dispatch<React.SetStateAction<Map<number, string[]>>>,
  setHistoryIndex: React.Dispatch<React.SetStateAction<Map<number, number>>>,
  setProcessingMessage: (message: string) => void,
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void,
  onEraseComplete?: (result: MagicEraserResult) => void
) {
  const { t } = useTranslation();
  const { profile, isAuthenticated, refreshProfile } = useAuth();

  // Get remaining credits from profile (server-side)
  const [remainingCredits, setRemainingCredits] = useState<number>(
    profile?.credits ?? 0
  );

  // Sync with profile changes
  if (profile?.credits !== undefined && profile.credits !== remainingCredits) {
    setRemainingCredits(profile.credits);
  }

  const handleMagicErase = async (maskBase64: string) => {
    if (!currentImageState || isProcessing) return;

    // Check authentication
    if (!isAuthenticated) {
      toast.error(t("editor.eraser.loginRequired"), {
        className: "text-center",
      });
      return;
    }

    // Check credits (client-side pre-check)
    if (remainingCredits <= 0) {
      toast.error(t("editor.eraser.insufficientCredits"), {
        className: "text-center",
      });
      return;
    }

    // Store the original image URL before processing
    const beforeImageUrl = currentImageState.blobUrl;

    trackMagicEraserStart();
    setIsProcessing(true);
    setProcessingMessage(t("editor.eraser.preparingImage"));

    try {
      const startTime = Date.now();

      // Convert current image to base64
      const response = await fetch(currentImageState.blobUrl);
      const blob = await response.blob();
      const imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setProcessingMessage(t("editor.eraser.requestingServer"));

      const eraserResponse = await eraseImage(
        createEraserRequest(imageBase64, maskBase64)
      );
      const predictionId = eraserResponse.id;

      // Update remaining credits from server response
      if (eraserResponse.remainingCredits !== undefined) {
        setRemainingCredits(eraserResponse.remainingCredits);
      }

      if (!predictionId) {
        throw new Error("No prediction ID received");
      }

      setProcessingMessage(t("editor.eraser.processingAI"));

      const pollForResult = (): Promise<string> => {
        return new Promise((resolve, reject) => {
          const maxAttempts = 120;
          let attempts = 0;
          const messages = [
            t("editor.eraser.processingAI"),
            t("editor.eraser.analyzingArea"),
            t("editor.eraser.removingObject"),
            t("editor.eraser.fillingBackground"),
            t("editor.eraser.almostDone"),
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
                  console.error("No output URL in succeeded status");
                  reject(new Error(t("editor.eraser.failed")));
                }
              } else if (statusData.status === "failed") {
                clearInterval(interval);
                if (statusData.error) {
                  console.error("Magic eraser failed:", statusData.error);
                }
                reject(new Error(t("editor.eraser.failed")));
              } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.error(
                  "Magic eraser timed out after",
                  maxAttempts,
                  "attempts"
                );
                reject(new Error(t("editor.eraser.timeout")));
              }
            } catch (error) {
              clearInterval(interval);
              console.error("Status polling error:", error);
              reject(new Error(t("editor.eraser.failed")));
            }
          }, POLLING.DEFAULT);
        });
      };

      const outputUrl = await pollForResult();
      const durationMs = Date.now() - startTime;
      trackMagicEraserSuccess(durationMs);

      // Refresh profile to sync credits
      refreshProfile();

      setProcessingMessage(t("editor.eraser.downloadingImage"));

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
      if (onEraseComplete) {
        onEraseComplete({
          beforeImageUrl,
          afterImageUrl: blobUrl,
        });
      }
    } catch (error) {
      console.error("Failed to erase object:", error);

      // Handle API error responses
      const axiosError = error as AxiosError<EraserErrorResponse>;
      const errorCode = axiosError.response?.data?.code;

      let displayMessage: string;

      // Map error codes to user-friendly messages
      if (errorCode === "UNAUTHORIZED") {
        displayMessage = t("editor.eraser.loginRequired");
      } else if (errorCode === "INSUFFICIENT_CREDITS") {
        displayMessage = t("editor.eraser.insufficientCredits");
        setRemainingCredits(0);
      } else if (error instanceof Error && error.message) {
        displayMessage = error.message;
      } else {
        displayMessage = t("editor.eraser.failed");
      }

      trackMagicEraserFail(displayMessage);
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
    handleMagicErase,
  };
}
