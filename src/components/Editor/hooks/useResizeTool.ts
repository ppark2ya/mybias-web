import { useState, useEffect } from "react";
import { resizeImage } from "../../../utils/imageEditor";
import { trackToolApply } from "../../../utils/analytics";
import type { ImageState } from "./useEditorState";

export function useResizeTool(
  currentImageState: ImageState | undefined,
  selectedIndex: number,
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void,
  updateImageState: (blobUrl: string) => Promise<void>
) {
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [initialResizeWidth, setInitialResizeWidth] = useState(800);
  const [initialResizeHeight, setInitialResizeHeight] = useState(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(1);

  // Update resize dimensions when selecting a new image
  useEffect(() => {
    if (currentImageState) {
      setResizeWidth(currentImageState.width);
      setResizeHeight(currentImageState.height);
      setInitialResizeWidth(currentImageState.width);
      setInitialResizeHeight(currentImageState.height);
      setOriginalAspectRatio(currentImageState.width / currentImageState.height);
    }
  }, [selectedIndex, currentImageState]);

  const isResizeChanged =
    resizeWidth !== initialResizeWidth || resizeHeight !== initialResizeHeight;

  const handleWidthChange = (newWidth: number) => {
    setResizeWidth(newWidth);
    if (maintainAspectRatio) {
      setResizeHeight(Math.round(newWidth / originalAspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setResizeHeight(newHeight);
    if (maintainAspectRatio) {
      setResizeWidth(Math.round(newHeight * originalAspectRatio));
    }
  };

  const handleApplyResize = async () => {
    if (!currentImageState || isProcessing) return;
    trackToolApply("RESIZE");

    setIsProcessing(true);
    try {
      const resizedBlobUrl = await resizeImage(currentImageState.blobUrl, {
        width: resizeWidth,
        height: resizeHeight,
        maintainAspectRatio,
      });
      await updateImageState(resizedBlobUrl);
    } catch (error) {
      console.error("Failed to resize image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    resizeWidth,
    resizeHeight,
    maintainAspectRatio,
    setMaintainAspectRatio,
    isResizeChanged,
    handleWidthChange,
    handleHeightChange,
    handleApplyResize,
  };
}
