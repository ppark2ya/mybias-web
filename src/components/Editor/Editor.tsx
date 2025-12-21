import { useState, useEffect, useRef } from "react";
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
  const [activeTool, setActiveTool] = useState<EditorTool>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageStates, setImageStates] = useState<Map<number, ImageState>>(
    () => new Map()
  );
  const [history, setHistory] = useState<Map<number, string[]>>(
    () => new Map()
  );
  const [isProcessing, setIsProcessing] = useState(false);

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
    };

    initializeImages();

    // Cleanup blob URLs on unmount
    return () => {
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
  const canUndo = currentHistory.length > 1;

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
      newMap.set(selectedIndex, [...currentHistory, newBlobUrl]);
      return newMap;
    });
  };

  const handleUndo = () => {
    if (!canUndo) return;

    setHistory((prev) => {
      const newMap = new Map(prev);
      const currentHistory = newMap.get(selectedIndex) || [];

      // Revoke the current (last) blob URL being removed
      const removedUrl = currentHistory[currentHistory.length - 1];
      if (removedUrl) {
        revokeBlobUrl(removedUrl);
      }

      const newHistory = currentHistory.slice(0, -1);
      newMap.set(selectedIndex, newHistory);

      // Update image state to previous
      const previousBlobUrl = newHistory[newHistory.length - 1];
      if (previousBlobUrl) {
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

      return newMap;
    });
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

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `mybias-${timestamp}.png`;
    downloadImage(currentImageState.blobUrl, filename);
  };

  // AI Enhance handler with polling
  const handleAIEnhance = async () => {
    if (!currentImageState || isProcessing) return;

    setIsProcessing(true);
    try {
      // Convert blob URL to base64 for API request
      const response = await fetch(currentImageState.blobUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

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

      // 2. Poll for status
      const pollForResult = (): Promise<string> => {
        return new Promise((resolve, reject) => {
          const maxAttempts = 120; // 2 minutes max
          let attempts = 0;

          const interval = setInterval(async () => {
            attempts++;

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
          }, 1000);
        });
      };

      const outputUrl = await pollForResult();

      // 3. Immediately show AI result using external URL (faster user feedback)
      const dimensions = await getImageDimensions(outputUrl);
      setImageStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedIndex, {
          blobUrl: outputUrl, // Use external URL directly for instant display
          width: dimensions.width,
          height: dimensions.height,
        });
        return newMap;
      });
      setHistory((prev) => {
        const newMap = new Map(prev);
        const currentHistory = newMap.get(selectedIndex) || [];
        newMap.set(selectedIndex, [...currentHistory, outputUrl]);
        return newMap;
      });

      // 4. Background: Convert to blob URL for reliable download/editing
      urlToBlobUrl(outputUrl).then((blobUrl) => {
        setImageStates((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(selectedIndex);
          if (current && current.blobUrl === outputUrl) {
            newMap.set(selectedIndex, { ...current, blobUrl });
          }
          return newMap;
        });
        setHistory((prev) => {
          const newMap = new Map(prev);
          const currentHistory = newMap.get(selectedIndex) || [];
          // Replace external URL with blob URL in history
          const updatedHistory = currentHistory.map((url) =>
            url === outputUrl ? blobUrl : url
          );
          newMap.set(selectedIndex, updatedHistory);
          return newMap;
        });
      });
    } catch (error) {
      console.error("Failed to enhance image:", error);
      alert("AI 보정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsProcessing(false);
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
          {/* Undo button */}
          {canUndo && (
            <button
              onClick={handleUndo}
              disabled={isProcessing}
              className="
                group flex items-center gap-1 sm:gap-1.5 lg:gap-2
                px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2
                bg-white/90 backdrop-blur-sm
                border border-gray-200
                rounded-full cursor-pointer
                shadow-lg shadow-black/5
                transition-all duration-300 ease-out
                hover:bg-slate-100
                hover:scale-105
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              type="button"
              aria-label="Undo"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-slate-600"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span className="text-xs font-medium sm:text-sm text-slate-600">
                되돌리기
              </span>
            </button>
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
                group flex items-center gap-1 sm:gap-1.5 lg:gap-2
                px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2
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
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-white"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs font-medium text-white sm:text-sm">
                완료
              </span>
            </button>
          )}
          <button
            onClick={onClose}
            className="
              group flex items-center gap-1 sm:gap-1.5 lg:gap-2
              px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2
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
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-gray-500 transition-all duration-300 group-hover:text-white group-hover:rotate-90"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="text-xs font-medium text-gray-600 transition-colors duration-300 sm:text-sm group-hover:text-white">
              닫기
            </span>
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-lg text-white">Processing...</div>
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
                setActiveTool(activeTool === "CROP" ? null : "CROP")
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
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
                <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
              </svg>
              <span className="text-[10px] sm:text-xs font-semibold">CROP</span>
            </button>

            <button
              onClick={() =>
                setActiveTool(activeTool === "BLUR" ? null : "BLUR")
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
                setActiveTool(activeTool === "RESIZE" ? null : "RESIZE")
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
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 3 21 3 21 8" />
                <line x1="14" y1="10" x2="21" y2="3" />
              </svg>
              <span className="text-[10px] sm:text-xs font-semibold">
                RESIZE
              </span>
            </button>

            <button
              onClick={handleAIEnhance}
              disabled={isProcessing || !currentImageState}
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
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span className="text-[10px] sm:text-xs font-semibold">AI</span>
            </button>

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
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="text-[10px] sm:text-xs font-semibold">SAVE</span>
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
                    title={maintainAspectRatio ? "비율 고정 해제" : "비율 고정"}
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {maintainAspectRatio ? (
                        <>
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </>
                      ) : (
                        <>
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Editor;
