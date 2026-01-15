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
  blendImages,
  resizeImage,
  loadImage,
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

/** Maximum image dimension before downscaling (to prevent OOM errors) */
const MAX_INPUT_DIMENSION = 1500;

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

  /**
   * Poll for a single prediction result
   */
  const pollForResult = async (
    predictionId: string,
    maxAttempts: number = 180
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const interval = setInterval(async () => {
        attempts++;

        try {
          const statusData = await getStatus(predictionId);

          if (statusData.status === "succeeded") {
            clearInterval(interval);
            const outputUrl = getOutputUrl(statusData);
            if (outputUrl) {
              resolve(outputUrl);
            } else {
              console.error("No output URL in succeeded status");
              reject(new Error("No output URL"));
            }
          } else if (statusData.status === "failed") {
            clearInterval(interval);
            if (statusData.error) {
              console.error("Prediction failed:", statusData.error);
            }
            reject(new Error("Prediction failed"));
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.error("Prediction timed out after", maxAttempts, "attempts");
            reject(new Error("Prediction timed out"));
          }
        } catch (error) {
          clearInterval(interval);
          console.error("Status polling error:", error);
          reject(error);
        }
      }, POLLING.DEFAULT);
    });
  };

  const handleProRestore = async (fidelity: number = 0.5) => {
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

      // Check if image needs downscaling to prevent OOM errors
      let imageSrcForApi = currentImageState.blobUrl;
      const img = await loadImage(currentImageState.blobUrl);
      const maxDim = Math.max(img.width, img.height);

      if (maxDim > MAX_INPUT_DIMENSION) {
        setProcessingMessage(t("editor.proRestore.resizingImage"));
        const scale = MAX_INPUT_DIMENSION / maxDim;
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        imageSrcForApi = await resizeImage(currentImageState.blobUrl, {
          width: newWidth,
          height: newHeight,
        });
      }

      // Convert image to base64
      setProcessingMessage(t("editor.proRestore.preparingImage"));
      const response = await fetch(imageSrcForApi);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Request dual predictions (Real-ESRGAN + CodeFormer)
      setProcessingMessage(t("editor.proRestore.requestingServer"));
      const generateResponse = await proRestoreImage(
        createProRestoreRequest(base64, { fidelity })
      );

      // Update remaining credits from server response
      if (generateResponse.remainingCredits !== undefined) {
        setRemainingCredits(generateResponse.remainingCredits);
      }

      const { predictions, blendRatio } = generateResponse;

      if (!predictions?.realEsrgan?.id || !predictions?.codeformer?.id) {
        throw new Error("No prediction IDs received");
      }

      // Poll for both results in parallel with progress messages
      setProcessingMessage(t("editor.proRestore.analyzingImage"));

      // Create progress message updater
      const messages = [
        t("editor.proRestore.analyzingImage"),
        t("editor.proRestore.restoringDetails"),
        t("editor.proRestore.enhancingSkinTone"),
        t("editor.proRestore.optimizingColors"),
        t("editor.proRestore.upscaling"),
        t("editor.proRestore.almostDone"),
      ];

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        messageIndex = Math.min(messageIndex + 1, messages.length - 1);
        setProcessingMessage(messages[messageIndex]);
      }, 5000); // Update message every 5 seconds

      try {
        // Poll for both predictions in parallel
        const [realEsrganUrl, codeformerUrl] = await Promise.all([
          pollForResult(predictions.realEsrgan.id),
          pollForResult(predictions.codeformer.id),
        ]);

        clearInterval(messageInterval);

        // Blend the two results
        setProcessingMessage(t("editor.proRestore.blending"));

        // Download both images and blend them
        // blendRatio = 0.7 means 70% CodeFormer, 30% Real-ESRGAN
        const [realEsrganBlobUrl, codeformerBlobUrl] = await Promise.all([
          urlToBlobUrl(realEsrganUrl),
          urlToBlobUrl(codeformerUrl),
        ]);

        // Blend: Real-ESRGAN (skin texture) + CodeFormer (facial features)
        const blendedBlobUrl = await blendImages(
          realEsrganBlobUrl, // Image A: skin texture
          codeformerBlobUrl, // Image B: facial features
          blendRatio // 0.7 = 70% CodeFormer, 30% Real-ESRGAN
        );

        const durationMs = Date.now() - startTime;
        trackAIEnhanceSuccess(durationMs);

        // Refresh profile and credit history to sync credits
        refreshProfile();
        queryClient.invalidateQueries({ queryKey: creditHistoryKeys.all });

        setProcessingMessage(t("editor.proRestore.downloadingImage"));

        const dimensions = await getImageDimensions(blendedBlobUrl);
        const currentIdx = historyIndex.get(selectedIndex) ?? 0;

        setImageStates((prev) => {
          const newMap = new Map(prev || new Map());
          newMap.set(selectedIndex, {
            blobUrl: blendedBlobUrl,
            width: dimensions.width,
            height: dimensions.height,
          });
          return newMap;
        });
        setHistory((prev) => {
          const newMap = new Map(prev || new Map());
          const currentHistory = newMap.get(selectedIndex) || [];
          const newHistory = [...currentHistory.slice(0, currentIdx + 1), blendedBlobUrl];
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
            afterImageUrl: blendedBlobUrl,
          });
        }
      } catch (pollError) {
        clearInterval(messageInterval);
        throw pollError;
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
