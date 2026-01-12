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

/**
 * Composite the inpainted result onto the original image using the mask
 */
async function compositeImages(
  originalUrl: string,
  inpaintedUrl: string,
  maskBase64: string,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    const imgOriginal = new Image();
    const imgInpainted = new Image();
    const imgMask = new Image();

    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 3) {
        draw();
      }
    };

    const draw = () => {
      // 1. Draw original (base)
      ctx.drawImage(imgOriginal, 0, 0, width, height);

      // 2. Prepare the mask as specific alpha
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) return;

      maskCtx.drawImage(imgMask, 0, 0, width, height);
      const maskData = maskCtx.getImageData(0, 0, width, height);

      // Convert White/Black mask to Alpha channel
      // We want to keep Inpainted where Mask is White (Alpha=255).
      // We want to discard Inpainted where Mask is Black (Alpha=0).
      // Since mask is grayscale (white on black), we can use the Red channel as Alpha.
      for (let i = 0; i < maskData.data.length; i += 4) {
        // R channel: 0 (black/keep) -> 255 (white/erase)
        const alpha = maskData.data[i];
        maskData.data[i + 3] = alpha;
      }
      maskCtx.putImageData(maskData, 0, 0);

      // 3. Composite Inpainted using the alpha-converted mask
      const patchCanvas = document.createElement("canvas");
      patchCanvas.width = width;
      patchCanvas.height = height;
      const patchCtx = patchCanvas.getContext("2d");
      if (!patchCtx) return;

      // Draw alpha mask
      patchCtx.drawImage(maskCanvas, 0, 0);
      // Source-in to keep inpainted only where mask is opaque
      patchCtx.globalCompositeOperation = "source-in";
      patchCtx.drawImage(imgInpainted, 0, 0, width, height);

      // 4. Draw patch over original
      ctx.drawImage(patchCanvas, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error("Failed to create blob"));
        }
      }, "image/png");
    };

    imgOriginal.onload = checkLoaded;
    imgOriginal.onerror = reject;
    imgOriginal.src = originalUrl;

    imgInpainted.onload = checkLoaded;
    imgInpainted.onerror = reject;
    imgInpainted.src = inpaintedUrl;

    imgMask.onload = checkLoaded;
    imgMask.onerror = reject;
    imgMask.src = maskBase64;
  });
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

      // Calculate optimal dimensions (max 1024, multiple of 64)
      const { width: originalWidth, height: originalHeight } =
        await getImageDimensions(currentImageState.blobUrl);

      const MAX_DIMENSION = 1024;
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
        const aspect = originalWidth / originalHeight;
        if (originalWidth > originalHeight) {
          targetWidth = MAX_DIMENSION;
          targetHeight = Math.round(MAX_DIMENSION / aspect);
        } else {
          targetHeight = MAX_DIMENSION;
          targetWidth = Math.round(MAX_DIMENSION * aspect);
        }
      }

      // Ensure multiple of 64 (required by some SD models)
      targetWidth = Math.round(targetWidth / 64) * 64;
      targetHeight = Math.round(targetHeight / 64) * 64;

      setProcessingMessage(t("editor.eraser.requestingServer"));

      const eraserResponse = await eraseImage(
        createEraserRequest(imageBase64, maskBase64, targetWidth, targetHeight)
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

      const [outputBlobUrl] = await Promise.all([
        urlToBlobUrl(outputUrl),
      ]);

      // Composite the result onto the original image
      // result = (original * (1-mask)) + (output * mask)
      const afterBlobUrl = await compositeImages(
        currentImageState.blobUrl,
        outputBlobUrl,
        maskBase64,
        originalWidth,
        originalHeight
      );

      const currentIdx = historyIndex.get(selectedIndex) ?? 0;

      setImageStates((prev) => {
        const newMap = new Map(prev || new Map());
        newMap.set(selectedIndex, {
          blobUrl: afterBlobUrl,
          width: originalWidth,
          height: originalHeight,
        });
        return newMap;
      });
      setHistory((prev) => {
        const newMap = new Map(prev || new Map());
        const currentHistory = newMap.get(selectedIndex) || [];
        const newHistory = [...currentHistory.slice(0, currentIdx + 1), afterBlobUrl];
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
          afterImageUrl: afterBlobUrl,
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
