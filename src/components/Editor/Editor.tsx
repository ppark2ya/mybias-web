import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  fileToBlobUrl,
  cropImage,
  blurImage,
  resizeImage,
  getImageDimensions,
  downloadImage,
  revokeBlobUrl,
  urlToBlobUrl,
  type CropArea,
} from "../../utils/imageEditor";
import {
  trackEditorOpen,
  trackEditorClose,
  trackToolSelect,
  trackToolApply,
  trackUndo,
  trackRedo,
  trackFileDownload,
  trackAIEnhanceStart,
  trackAIEnhanceSuccess,
  trackAIEnhanceFail,
} from "../../utils/analytics";
import {
  getRemainingAIUsage,
  canUseAI,
  incrementAIUsage,
} from "../../utils/rateLimit";
import { toast } from "sonner";
import {
  Undo2,
  Redo2,
  Check,
  X,
  Crop,
  Sparkles,
  Maximize,
  Download,
  Share2,
  Lock,
  Unlock,
  Star,
} from "lucide-react";
import ShareModal from "../ShareModal";

type EditorTool = "CROP" | "BLUR" | "RESIZE" | null;

interface EditorProps {
  files: File[];
  onClose: () => void;
}

interface ImageState {
  blobUrl: string;
  width: number;
  height: number;
}

export function Editor({ files, onClose }: EditorProps) {
  const { t } = useTranslation();
  const [activeTool, setActiveTool] = useState<EditorTool>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Map<number, ImageState>>(
    () => new Map()
  );
  const [history, setHistory] = useState<Map<number, string[]>>(
    () => new Map()
  );
  const [historyIndex, setHistoryIndex] = useState<Map<number, number>>(
    () => new Map()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  // AI rate limit state
  const [remainingAIUsage, setRemainingAIUsage] = useState(() =>
    getRemainingAIUsage()
  );

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Crop state
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

  // Blur state
  const [blurRadius, setBlurRadius] = useState(5);
  const [initialBlurRadius] = useState(5);

  // Resize state
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [initialResizeWidth, setInitialResizeWidth] = useState(800);
  const [initialResizeHeight, setInitialResizeHeight] = useState(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(1);

  // Initialize image states from files
  useEffect(() => {
    // Track editor open
    trackEditorOpen(files.length);

    const initializeImages = async () => {
      const newImageStates = new Map<number, ImageState>();
      const newHistory = new Map<number, string[]>();

      for (let i = 0; i < files.length; i++) {
        const blobUrl = fileToBlobUrl(files[i]);
        const dimensions = await getImageDimensions(blobUrl);
        newImageStates.set(i, {
          blobUrl,
          width: dimensions.width,
          height: dimensions.height,
        });
        newHistory.set(i, [blobUrl]);
      }

      setImageStates(newImageStates);
      setHistory(newHistory);
      // Initialize history index to last item (index 0)
      const newHistoryIndex = new Map<number, number>();
      for (let i = 0; i < files.length; i++) {
        newHistoryIndex.set(i, 0);
      }
      setHistoryIndex(newHistoryIndex);
    };

    initializeImages();

    // Cleanup blob URLs on unmount
    return () => {
      trackEditorClose();
      imageStates.forEach((state) => {
        revokeBlobUrl(state.blobUrl);
      });
      history.forEach((urls) => {
        urls.forEach((url) => revokeBlobUrl(url));
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Update resize dimensions when selecting a new image
  useEffect(() => {
    const currentState = imageStates.get(selectedIndex);
    if (currentState) {
      setResizeWidth(currentState.width);
      setResizeHeight(currentState.height);
      setInitialResizeWidth(currentState.width);
      setInitialResizeHeight(currentState.height);
      setOriginalAspectRatio(currentState.width / currentState.height);
      // Set crop area to cover entire image by default
      setCropArea({
        x: 0,
        y: 0,
        width: currentState.width,
        height: currentState.height,
      });
    }
  }, [selectedIndex, imageStates]);

  const currentImageState = imageStates.get(selectedIndex);
  const currentHistory = history.get(selectedIndex) || [];
  const currentHistoryIdx = historyIndex.get(selectedIndex) ?? 0;
  const canUndo = currentHistoryIdx > 0;
  const canRedo = currentHistoryIdx < currentHistory.length - 1;

  // Check if tool values have changed from initial state
  const isBlurChanged = blurRadius !== initialBlurRadius;
  const isResizeChanged =
    resizeWidth !== initialResizeWidth || resizeHeight !== initialResizeHeight;
  const isCropChanged = currentImageState
    ? cropArea.x !== 0 ||
      cropArea.y !== 0 ||
      cropArea.width !== currentImageState.width ||
      cropArea.height !== currentImageState.height
    : false;

  const updateImageState = async (newBlobUrl: string) => {
    const dimensions = await getImageDimensions(newBlobUrl);

    setImageStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(selectedIndex, {
        blobUrl: newBlobUrl,
        width: dimensions.width,
        height: dimensions.height,
      });
      return newMap;
    });

    setHistory((prev) => {
      const newMap = new Map(prev);
      const currentHistory = newMap.get(selectedIndex) || [];
      const currentIdx = historyIndex.get(selectedIndex) ?? 0;
      // If we're not at the end, truncate future history
      const newHistory = [
        ...currentHistory.slice(0, currentIdx + 1),
        newBlobUrl,
      ];
      newMap.set(selectedIndex, newHistory);
      return newMap;
    });

    setHistoryIndex((prev) => {
      const newMap = new Map(prev);
      const currentIdx = prev.get(selectedIndex) ?? 0;
      newMap.set(selectedIndex, currentIdx + 1);
      return newMap;
    });
  };

  const handleActiveTool = (tool: EditorTool) => {
    setActiveTool(tool);
    if (tool) {
      trackToolSelect(tool);
    }
  };

  const handleUndo = () => {
    if (!canUndo) return;
    trackUndo();

    const newIdx = currentHistoryIdx - 1;
    const previousBlobUrl = currentHistory[newIdx];

    if (previousBlobUrl) {
      setHistoryIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedIndex, newIdx);
        return newMap;
      });

      getImageDimensions(previousBlobUrl).then((dimensions) => {
        setImageStates((prevStates) => {
          const newStatesMap = new Map(prevStates);
          newStatesMap.set(selectedIndex, {
            blobUrl: previousBlobUrl,
            width: dimensions.width,
            height: dimensions.height,
          });
          return newStatesMap;
        });
      });
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;
    trackRedo();

    const newIdx = currentHistoryIdx + 1;
    const nextBlobUrl = currentHistory[newIdx];

    if (nextBlobUrl) {
      setHistoryIndex((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedIndex, newIdx);
        return newMap;
      });

      getImageDimensions(nextBlobUrl).then((dimensions) => {
        setImageStates((prevStates) => {
          const newStatesMap = new Map(prevStates);
          newStatesMap.set(selectedIndex, {
            blobUrl: nextBlobUrl,
            width: dimensions.width,
            height: dimensions.height,
          });
          return newStatesMap;
        });
      });
    }
  };

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

  // Crop handlers - Mouse events
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

  // Crop handlers - Touch events
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

    // Convert pixel deltas to image coordinates using the actual displayed scale
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
      // Round crop area values to integers for precise pixel cropping
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

  // Blur handler
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

  // Resize handlers
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

  // Download handler
  const handleDownload = () => {
    if (!currentImageState || isProcessing) return;

    trackFileDownload();

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `mybias-${timestamp}.png`;
    downloadImage(currentImageState.blobUrl, filename);
  };

  // AI Enhance handler with polling
  const handleAIEnhance = async () => {
    if (!currentImageState || isProcessing) return;

    // Check rate limit
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
      // Convert blob URL to base64 for API request
      const response = await fetch(currentImageState.blobUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      setProcessingMessage(t("editor.ai.requestingServer"));

      // 1. Start the prediction with CodeFormer
      const startResponse = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          upscale: 1,
          fidelity: 0.6, // 0.5~0.7 recommended for idol photos
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

      // 2. Poll for status with progress messages
      setProcessingMessage(t("editor.ai.analyzingFaces"));
      const pollForResult = (): Promise<string> => {
        return new Promise((resolve, reject) => {
          const maxAttempts = 120; // 2 minutes max
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
            // Update message every 5 seconds
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
              // If "starting" or "processing", continue polling
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

      // Update rate limit usage on success
      const remaining = incrementAIUsage();
      setRemainingAIUsage(remaining);

      setProcessingMessage(t("editor.ai.downloadingImage"));

      // 3. Download and convert to blob URL (blocking for better UX)
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
        const newHistory = [
          ...currentHistory.slice(0, currentIdx + 1),
          blobUrl,
        ];
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
        error instanceof Error
          ? error.message
          : t("editor.ai.failed");
      trackAIEnhanceFail(errorMessage);
      // alert(errorMessage);
      toast.error(errorMessage, {
        className: "text-center",
      });
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  // Calculate the actual displayed image size and position within the container (object-contain)
  const getDisplayedImageBounds = () => {
    if (!currentImageState || !imageContainerRef.current || !imageRef.current) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0, scale: 1 };
    }

    // Get the actual rendered size of the image element
    const imgElement = imageRef.current;
    const displayedWidth = imgElement.clientWidth;
    const displayedHeight = imgElement.clientHeight;

    // Get image natural (original) dimensions
    const imageWidth = currentImageState.width;

    // Get container dimensions to calculate offset
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const imgRect = imgElement.getBoundingClientRect();

    // Calculate offset from container's top-left to image's top-left
    const offsetX = imgRect.left - containerRect.left;
    const offsetY = imgRect.top - containerRect.top;

    // Calculate scale: displayed size / original size
    const scale = displayedWidth / imageWidth;

    return {
      width: displayedWidth,
      height: displayedHeight,
      offsetX,
      offsetY,
      scale,
    };
  };

  // Calculate crop overlay position for display
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

  return (
    <div className="w-full max-w-[1000px] mx-auto p-2 sm:p-4 lg:p-8">
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-[0_10px_60px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header with Close button, Undo button, and Apply button */}
        <div className="absolute z-10 top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 flex items-center gap-1.5 sm:gap-2">
          {/* Undo/Redo buttons */}
          {(canUndo || canRedo) && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={isProcessing || !canUndo}
                className="flex items-center justify-center w-8 h-8 transition-all duration-300 ease-out border border-gray-200 rounded-full shadow-lg cursor-pointer group sm:w-9 sm:h-9 bg-white/90 backdrop-blur-sm shadow-black/5 hover:bg-slate-100 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                type="button"
                aria-label="Undo"
                title={t("editor.undo")}
              >
                <Undo2 className="w-4 h-4 text-slate-600" strokeWidth={2.5} />
              </button>
              <button
                onClick={handleRedo}
                disabled={isProcessing || !canRedo}
                className="flex items-center justify-center w-8 h-8 transition-all duration-300 ease-out border border-gray-200 rounded-full shadow-lg cursor-pointer group sm:w-9 sm:h-9 bg-white/90 backdrop-blur-sm shadow-black/5 hover:bg-slate-100 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                type="button"
                aria-label="Redo"
                title={t("editor.redo")}
              >
                <Redo2 className="w-4 h-4 text-slate-600" strokeWidth={2.5} />
              </button>
            </div>
          )}
          {activeTool && (
            <button
              onClick={
                activeTool === "CROP"
                  ? handleApplyCrop
                  : activeTool === "BLUR"
                    ? handleApplyBlur
                    : activeTool === "RESIZE"
                      ? handleApplyResize
                      : undefined
              }
              disabled={
                isProcessing ||
                (activeTool === "CROP" && !isCropChanged) ||
                (activeTool === "BLUR" && !isBlurChanged) ||
                (activeTool === "RESIZE" && !isResizeChanged)
              }
              className="
                group flex items-center justify-center
                w-8 h-8 sm:w-9 sm:h-9
                bg-gradient-to-r from-fuchsia-500 to-purple-500
                border border-transparent
                rounded-full cursor-pointer
                shadow-lg shadow-fuchsia-500/20
                transition-all duration-300 ease-out
                hover:from-fuchsia-600 hover:to-purple-600
                hover:shadow-xl hover:shadow-fuchsia-500/30
                hover:scale-105
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              type="button"
              aria-label="Apply changes"
              title={t("editor.apply")}
            >
              <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={onClose}
            className="
              group flex items-center justify-center
              w-8 h-8 sm:w-9 sm:h-9
              bg-white/90 backdrop-blur-sm
              border border-gray-200
              rounded-full cursor-pointer
              shadow-lg shadow-black/5
              transition-all duration-300 ease-out
              hover:bg-gray-900 hover:border-gray-900
              hover:shadow-xl hover:shadow-black/10
              hover:scale-105
              active:scale-95
            "
            type="button"
            aria-label="Close editor"
            title={t("editor.close")}
          >
            <X className="w-4 h-4 text-gray-500 transition-all duration-300 group-hover:text-white group-hover:rotate-90" strokeWidth={2.5} />
          </button>
        </div>

        {/* Main Preview Area - 9:20 aspect ratio for mobile wallpaper */}
        <div className="flex justify-center px-2 pt-12 pb-2 sm:pt-14 lg:pt-16 sm:px-4 lg:px-6 lg:pb-4">
          <div
            ref={imageContainerRef}
            className="relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl aspect-[9/20] max-h-[70vh] w-auto touch-none"
            onMouseMove={handleCropMouseMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
            onTouchMove={handleCropTouchMove}
            onTouchEnd={handleCropEnd}
            onTouchCancel={handleCropEnd}
          >
            {currentImageState && (
              <>
                <img
                  ref={imageRef}
                  src={currentImageState.blobUrl}
                  alt="Editing"
                  className="object-contain max-w-full max-h-full"
                  draggable={false}
                />

                {/* Crop overlay */}
                {activeTool === "CROP" && (
                  <div
                    className="absolute border-2 cursor-move border-white bg-black/20 touch-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                    style={getCropOverlayStyle()}
                    onMouseDown={(e) => handleCropMouseDown(e, false)}
                    onTouchStart={(e) => handleCropTouchStart(e, false)}
                  >
                    {/* Corner resize handles - L-shaped brackets */}
                    {/* Top-left */}
                    <div
                      className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize md:w-8 md:h-8"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleCropMouseDown(e, true);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleCropTouchStart(e, true);
                      }}
                    >
                      <div className="absolute top-0 left-0 w-5 h-[3px] bg-white -translate-x-[2px] -translate-y-[2px]" />
                      <div className="absolute top-0 left-0 w-[3px] h-5 bg-white -translate-x-[2px] -translate-y-[2px]" />
                    </div>
                    {/* Top-right */}
                    <div
                      className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize md:w-8 md:h-8"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleCropMouseDown(e, true);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleCropTouchStart(e, true);
                      }}
                    >
                      <div className="absolute top-0 right-0 w-5 h-[3px] bg-white translate-x-[2px] -translate-y-[2px]" />
                      <div className="absolute top-0 right-0 w-[3px] h-5 bg-white translate-x-[2px] -translate-y-[2px]" />
                    </div>
                    {/* Bottom-left */}
                    <div
                      className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize md:w-8 md:h-8"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleCropMouseDown(e, true);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleCropTouchStart(e, true);
                      }}
                    >
                      <div className="absolute bottom-0 left-0 w-5 h-[3px] bg-white -translate-x-[2px] translate-y-[2px]" />
                      <div className="absolute bottom-0 left-0 w-[3px] h-5 bg-white -translate-x-[2px] translate-y-[2px]" />
                    </div>
                    {/* Bottom-right */}
                    <div
                      className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize md:w-8 md:h-8"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleCropMouseDown(e, true);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleCropTouchStart(e, true);
                      }}
                    >
                      <div className="absolute bottom-0 right-0 w-5 h-[3px] bg-white translate-x-[2px] translate-y-[2px]" />
                      <div className="absolute bottom-0 right-0 w-[3px] h-5 bg-white translate-x-[2px] translate-y-[2px]" />
                    </div>
                  </div>
                )}
              </>
            )}

            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-sm">
                {/* Animated sparkle loader */}
                <div className="relative w-20 h-20">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-fuchsia-400 border-r-purple-400 animate-spin" />
                  {/* Inner pulsing circle */}
                  <div className="absolute rounded-full inset-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 animate-pulse" />
                  {/* Center star icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Star className="w-8 h-8 text-white animate-bounce" fill="currentColor" />
                  </div>
                </div>
                {/* Message */}
                <div className="text-center">
                  <p className="text-lg font-medium text-white animate-pulse">
                    {processingMessage || t("editor.processing")}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {t("editor.pleaseWait")}
                  </p>
                </div>
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div
                    className="absolute w-2 h-2 rounded-full bg-fuchsia-400/50 top-1/4 left-1/4 animate-ping"
                    style={{ animationDuration: "2s" }}
                  />
                  <div
                    className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/50 top-1/3 right-1/3 animate-ping"
                    style={{
                      animationDuration: "2.5s",
                      animationDelay: "0.5s",
                    }}
                  />
                  <div
                    className="absolute w-2 h-2 rounded-full bg-violet-400/50 bottom-1/3 left-1/3 animate-ping"
                    style={{ animationDuration: "3s", animationDelay: "1s" }}
                  />
                  <div
                    className="absolute w-1 h-1 rounded-full bg-pink-400/50 bottom-1/4 right-1/4 animate-ping"
                    style={{
                      animationDuration: "2.2s",
                      animationDelay: "0.3s",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {files.length > 1 && (
          <div className="px-8 py-4 md:px-4 md:py-2">
            <div className="flex gap-3 pb-2 overflow-x-auto">
              {files.map((file, index) => {
                const state = imageStates.get(index);
                return (
                  <button
                    key={`${file.name}-${index}`}
                    onClick={() => setSelectedIndex(index)}
                    className={`
                      flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden
                      border-2 transition-all duration-200 cursor-pointer
                      ${
                        selectedIndex === index
                          ? "border-fuchsia-500 shadow-[0_0_0_2px_rgba(217,70,239,0.3)]"
                          : "border-transparent hover:border-gray-300"
                      }
                    `}
                    type="button"
                  >
                    <img
                      src={state?.blobUrl || URL.createObjectURL(file)}
                      alt={file.name}
                      className="object-cover w-full h-full"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="border-t border-gray-200">
          {/* Tool Buttons */}
          <div className="flex items-center justify-center gap-1 p-2 bg-white sm:gap-2 sm:p-3 lg:p-4">
            <button
              onClick={() =>
                handleActiveTool(activeTool === "CROP" ? null : "CROP")
              }
              disabled={isProcessing}
              className={`
                flex flex-col items-center justify-center gap-0.5 sm:gap-1
                px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
                transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  activeTool === "CROP"
                    ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-md"
                    : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                }
              `}
              type="button"
              aria-label="Crop tool"
            >
              <Crop className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              <span className="text-[10px] sm:text-xs font-semibold">CROP</span>
            </button>

            <button
              onClick={() =>
                handleActiveTool(activeTool === "BLUR" ? null : "BLUR")
              }
              disabled={isProcessing}
              className={`
                flex flex-col items-center justify-center gap-0.5 sm:gap-1
                px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
                transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  activeTool === "BLUR"
                    ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-md"
                    : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                }
              `}
              type="button"
              aria-label="Blur tool"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="7" opacity="0.5" />
                <circle cx="12" cy="12" r="11" opacity="0.3" />
              </svg>
              <span className="text-[10px] sm:text-xs font-semibold">BLUR</span>
            </button>

            <button
              onClick={() =>
                handleActiveTool(activeTool === "RESIZE" ? null : "RESIZE")
              }
              disabled={isProcessing}
              className={`
                flex flex-col items-center justify-center gap-0.5 sm:gap-1
                px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
                transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  activeTool === "RESIZE"
                    ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-md"
                    : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                }
              `}
              type="button"
              aria-label="Resize tool"
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              <span className="text-[10px] sm:text-xs font-semibold">
                RESIZE
              </span>
            </button>

            <div className="relative">
              <button
                onClick={handleAIEnhance}
                disabled={isProcessing || !currentImageState || remainingAIUsage === 0}
                className={`
                  flex flex-col items-center justify-center gap-0.5 sm:gap-1
                  px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
                  transition-all duration-200 cursor-pointer
                  disabled:cursor-not-allowed disabled:opacity-50
                  bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600
                `}
                type="button"
                aria-label="AI Enhance"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                <span className="text-[10px] sm:text-xs font-semibold">AI</span>
              </button>
              {/* AI Usage Badge */}
              <span
                className={`
                  absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2
                  min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]
                  flex items-center justify-center
                  text-[10px] sm:text-xs font-bold
                  rounded-full
                  border-2 border-white
                  shadow-sm
                  ${remainingAIUsage > 0
                    ? "bg-gradient-to-r from-emerald-400 to-teal-400 text-white"
                    : "bg-gray-400 text-white"
                  }
                `}
              >
                {remainingAIUsage}
              </span>
            </div>

            <button
              onClick={handleDownload}
              disabled={isProcessing || !currentImageState}
              className={`
                flex flex-col items-center justify-center gap-0.5 sm:gap-1
                px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
                transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                bg-gradient-to-r from-cyan-400 to-teal-400 text-white hover:from-cyan-500 hover:to-teal-500
              `}
              type="button"
              aria-label="Download"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              <span className="text-[10px] sm:text-xs font-semibold">SAVE</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              disabled={isProcessing || !currentImageState}
              className={`
                flex flex-col items-center justify-center gap-0.5 sm:gap-1
                px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
                transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600
              `}
              type="button"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              <span className="text-[10px] sm:text-xs font-semibold">SHARE</span>
            </button>
          </div>

          {/* Tool Settings Panel */}
          {activeTool && activeTool !== "CROP" && (
            <div className="p-3 border-t border-gray-200 sm:p-4 lg:p-6 bg-gray-50">
              {activeTool === "BLUR" && (
                <div className="flex items-center justify-center w-full max-w-md gap-4 mx-auto">
                  <label className="text-sm text-gray-600 whitespace-nowrap">
                    Blur Radius:
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={blurRadius}
                    onChange={(e) => setBlurRadius(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-8 text-sm text-gray-500">
                    {blurRadius}px
                  </span>
                </div>
              )}

              {activeTool === "RESIZE" && (
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <input
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded sm:w-20"
                    min="1"
                  />
                  <span className="font-medium text-gray-400">×</span>
                  <input
                    type="number"
                    value={resizeHeight}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded sm:w-20"
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                    className={`p-1.5 rounded transition-colors ${
                      maintainAspectRatio
                        ? "text-fuchsia-500 bg-fuchsia-50"
                        : "text-gray-400 bg-gray-100"
                    }`}
                    aria-label="Lock aspect ratio"
                    title={maintainAspectRatio ? t("editor.unlockAspectRatio") : t("editor.lockAspectRatio")}
                  >
                    {maintainAspectRatio ? (
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Unlock className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={currentImageState?.blobUrl || ""}
      />
    </div>
  );
}

export default Editor;
