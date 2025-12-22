import { useState, useEffect } from "react";
import { fileToBlobUrl, getImageDimensions, revokeBlobUrl } from "../../../utils/imageEditor";
import { trackEditorOpen, trackEditorClose } from "../../../utils/analytics";

export type EditorTool = "CROP" | "BLUR" | "RESIZE" | null;

export interface ImageState {
  blobUrl: string;
  width: number;
  height: number;
}

export function useEditorState(files: File[]) {
  const [activeTool, setActiveTool] = useState<EditorTool>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Map<number, ImageState>>(() => new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Initialize image states from files
  useEffect(() => {
    trackEditorOpen(files.length);

    const initializeImages = async () => {
      const newImageStates = new Map<number, ImageState>();

      for (let i = 0; i < files.length; i++) {
        const blobUrl = fileToBlobUrl(files[i]);
        const dimensions = await getImageDimensions(blobUrl);
        newImageStates.set(i, {
          blobUrl,
          width: dimensions.width,
          height: dimensions.height,
        });
      }

      setImageStates(newImageStates);
    };

    initializeImages();

    // Cleanup blob URLs on unmount
    return () => {
      trackEditorClose();
      imageStates.forEach((state) => {
        revokeBlobUrl(state.blobUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const currentImageState = imageStates.get(selectedIndex);

  return {
    activeTool,
    setActiveTool,
    selectedIndex,
    setSelectedIndex,
    imageStates,
    setImageStates,
    currentImageState,
    isProcessing,
    setIsProcessing,
    processingMessage,
    setProcessingMessage,
    isShareModalOpen,
    setIsShareModalOpen,
  };
}
