import { useState } from "react";
import { blurImage } from "../../../utils/imageEditor";
import { trackToolApply } from "../../../utils/analytics";
import type { ImageState } from "./useEditorState";

export function useBlurTool(
  currentImageState: ImageState | undefined,
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void,
  updateImageState: (blobUrl: string) => Promise<void>
) {
  const [blurRadius, setBlurRadius] = useState(5);
  const [initialBlurRadius] = useState(5);

  const isBlurChanged = blurRadius !== initialBlurRadius;

  const handleApplyBlur = async () => {
    if (!currentImageState || isProcessing) return;
    trackToolApply("BLUR");

    setIsProcessing(true);
    try {
      const blurredBlobUrl = await blurImage(currentImageState.blobUrl, {
        radius: blurRadius,
      });
      await updateImageState(blurredBlobUrl);
    } catch (error) {
      console.error("Failed to blur image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    blurRadius,
    setBlurRadius,
    isBlurChanged,
    handleApplyBlur,
  };
}
