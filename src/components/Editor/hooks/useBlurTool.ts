import { useState, useCallback } from "react";
import { blurImage } from "../../../utils/imageEditor";
import { trackToolApply } from "../../../utils/analytics";
import type { ImageState } from "./useEditorState";

const DEFAULT_BLUR_RADIUS = 0;

export function useBlurTool(
  currentImageState: ImageState | undefined,
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void,
  updateImageState: (blobUrl: string) => Promise<void>
) {
  // Preview blur radius (for CSS filter)
  const [previewBlurRadius, setPreviewBlurRadius] = useState(DEFAULT_BLUR_RADIUS);

  const isBlurChanged = previewBlurRadius !== DEFAULT_BLUR_RADIUS;

  // Reset blur radius when tool is closed or applied
  const resetBlurRadius = useCallback(() => {
    setPreviewBlurRadius(DEFAULT_BLUR_RADIUS);
  }, []);

  const handleApplyBlur = async () => {
    if (!currentImageState || isProcessing || !isBlurChanged) return;
    trackToolApply("BLUR");

    setIsProcessing(true);
    try {
      const blurredBlobUrl = await blurImage(currentImageState.blobUrl, {
        radius: previewBlurRadius,
      });
      await updateImageState(blurredBlobUrl);
      // Reset preview after applying
      resetBlurRadius();
    } catch (error) {
      console.error("Failed to blur image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    blurRadius: previewBlurRadius,
    setBlurRadius: setPreviewBlurRadius,
    isBlurChanged,
    handleApplyBlur,
    resetBlurRadius,
  };
}
