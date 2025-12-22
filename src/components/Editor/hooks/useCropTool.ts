import { useState, useEffect, useRef } from "react";
import { cropImage, type CropArea } from "../../../utils/imageEditor";
import { trackToolApply } from "../../../utils/analytics";
import type { ImageState } from "./useEditorState";

export function useCropTool(
  currentImageState: ImageState | undefined,
  selectedIndex: number,
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void,
  updateImageState: (blobUrl: string) => Promise<void>
) {
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Update crop area when selecting a new image
  useEffect(() => {
    if (currentImageState) {
      setCropArea({
        x: 0,
        y: 0,
        width: currentImageState.width,
        height: currentImageState.height,
      });
    }
  }, [selectedIndex, currentImageState]);

  const isCropChanged = currentImageState
    ? cropArea.x !== 0 ||
      cropArea.y !== 0 ||
      cropArea.width !== currentImageState.width ||
      cropArea.height !== currentImageState.height
    : false;

  // Helper to get client coordinates from mouse or touch event
  const getEventCoordinates = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent
  ) => {
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const getDisplayedImageBounds = () => {
    if (!currentImageState || !imageContainerRef.current || !imageRef.current) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0, scale: 1 };
    }

    const imgElement = imageRef.current;
    const displayedWidth = imgElement.clientWidth;
    const displayedHeight = imgElement.clientHeight;
    const imageWidth = currentImageState.width;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const imgRect = imgElement.getBoundingClientRect();
    const offsetX = imgRect.left - containerRect.left;
    const offsetY = imgRect.top - containerRect.top;
    const scale = displayedWidth / imageWidth;

    return {
      width: displayedWidth,
      height: displayedHeight,
      offsetX,
      offsetY,
      scale,
    };
  };

  const getCropOverlayStyle = () => {
    if (!currentImageState || !imageContainerRef.current) return {};

    const bounds = getDisplayedImageBounds();

    return {
      left: cropArea.x * bounds.scale + bounds.offsetX,
      top: cropArea.y * bounds.scale + bounds.offsetY,
      width: cropArea.width * bounds.scale,
      height: cropArea.height * bounds.scale,
    };
  };

  const handleCropMouseDown = (e: React.MouseEvent, isResize = false) => {
    e.preventDefault();
    if (isResize) {
      setIsResizing(true);
    } else {
      setIsDragging(true);
    }
    const coords = getEventCoordinates(e);
    setDragStart(coords);
  };

  const handleCropTouchStart = (e: React.TouchEvent, isResize = false) => {
    e.preventDefault();
    if (isResize) {
      setIsResizing(true);
    } else {
      setIsDragging(true);
    }
    const coords = getEventCoordinates(e);
    setDragStart(coords);
  };

  const handleCropMove = (clientX: number, clientY: number) => {
    if (!isDragging && !isResizing) return;
    if (!imageContainerRef.current || !currentImageState) return;

    const bounds = getDisplayedImageBounds();
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    const deltaImageX = deltaX / bounds.scale;
    const deltaImageY = deltaY / bounds.scale;

    if (isDragging) {
      setCropArea((prev) => ({
        ...prev,
        x: Math.max(
          0,
          Math.min(currentImageState.width - prev.width, prev.x + deltaImageX)
        ),
        y: Math.max(
          0,
          Math.min(currentImageState.height - prev.height, prev.y + deltaImageY)
        ),
      }));
    } else if (isResizing) {
      setCropArea((prev) => ({
        ...prev,
        width: Math.max(
          50,
          Math.min(currentImageState.width - prev.x, prev.width + deltaImageX)
        ),
        height: Math.max(
          50,
          Math.min(currentImageState.height - prev.y, prev.height + deltaImageY)
        ),
      }));
    }

    setDragStart({ x: clientX, y: clientY });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    handleCropMove(e.clientX, e.clientY);
  };

  const handleCropTouchMove = (e: React.TouchEvent) => {
    const coords = getEventCoordinates(e);
    handleCropMove(coords.x, coords.y);
  };

  const handleCropEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleApplyCrop = async () => {
    if (!currentImageState || isProcessing) return;
    trackToolApply("CROP");

    setIsProcessing(true);
    try {
      const normalizedCropArea = {
        x: Math.round(cropArea.x),
        y: Math.round(cropArea.y),
        width: Math.round(cropArea.width),
        height: Math.round(cropArea.height),
      };

      const croppedBlobUrl = await cropImage(
        currentImageState.blobUrl,
        normalizedCropArea
      );
      await updateImageState(croppedBlobUrl);
    } catch (error) {
      console.error("Failed to crop image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    cropArea,
    isCropChanged,
    isDragging,
    isResizing,
    imageContainerRef,
    imageRef,
    getCropOverlayStyle,
    handleCropMouseDown,
    handleCropTouchStart,
    handleCropMouseMove,
    handleCropTouchMove,
    handleCropEnd,
    handleApplyCrop,
  };
}
