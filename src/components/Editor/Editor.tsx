import { useState, useEffect, useRef } from "react";
import {
  fileToDataURL,
  cropImage,
  blurImage,
  resizeImage,
  getImageDimensions,
  downloadImage,
  type CropArea,
} from "../../utils/imageEditor";

type EditorTool = "CROP" | "BLUR" | "RESIZE" | null;

interface EditorProps {
  files: File[];
  onClose: () => void;
}

interface ImageState {
  dataURL: string;
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

  // Resize state
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(1);

  // Initialize image states from files
  useEffect(() => {
    const initializeImages = async () => {
      const newImageStates = new Map<number, ImageState>();
      const newHistory = new Map<number, string[]>();

      for (let i = 0; i < files.length; i++) {
        const dataURL = await fileToDataURL(files[i]);
        const dimensions = await getImageDimensions(dataURL);
        newImageStates.set(i, {
          dataURL,
          width: dimensions.width,
          height: dimensions.height,
        });
        newHistory.set(i, [dataURL]);
      }

      setImageStates(newImageStates);
      setHistory(newHistory);
    };

    initializeImages();
  }, [files]);

  // Update resize dimensions when selecting a new image
  useEffect(() => {
    const currentState = imageStates.get(selectedIndex);
    if (currentState) {
      setResizeWidth(currentState.width);
      setResizeHeight(currentState.height);
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

  const updateImageState = async (newDataURL: string) => {
    const dimensions = await getImageDimensions(newDataURL);

    setImageStates((prev) => {
      const newMap = new Map(prev);
      newMap.set(selectedIndex, {
        dataURL: newDataURL,
        width: dimensions.width,
        height: dimensions.height,
      });
      return newMap;
    });

    setHistory((prev) => {
      const newMap = new Map(prev);
      const currentHistory = newMap.get(selectedIndex) || [];
      newMap.set(selectedIndex, [...currentHistory, newDataURL]);
      return newMap;
    });
  };

  const handleUndo = () => {
    if (!canUndo) return;

    setHistory((prev) => {
      const newMap = new Map(prev);
      const currentHistory = newMap.get(selectedIndex) || [];
      const newHistory = currentHistory.slice(0, -1);
      newMap.set(selectedIndex, newHistory);

      // Update image state to previous
      const previousDataURL = newHistory[newHistory.length - 1];
      if (previousDataURL) {
        getImageDimensions(previousDataURL).then((dimensions) => {
          setImageStates((prevStates) => {
            const newStatesMap = new Map(prevStates);
            newStatesMap.set(selectedIndex, {
              dataURL: previousDataURL,
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

      const bounds = getDisplayedImageBounds();

      console.log("=== Applying Crop ===");
      console.log(
        "Image Natural Size (original):",
        currentImageState.width,
        "x",
        currentImageState.height
      );
      console.log(
        "Image Displayed Size (on screen):",
        bounds.width,
        "x",
        bounds.height
      );
      console.log("Scale Factor:", bounds.scale);
      console.log("Crop Area (image coords):", normalizedCropArea);
      console.log("Display Bounds:", bounds);
      console.log("Crop Area (screen coords):", {
        left: normalizedCropArea.x * bounds.scale + bounds.offsetX,
        top: normalizedCropArea.y * bounds.scale + bounds.offsetY,
        width: normalizedCropArea.width * bounds.scale,
        height: normalizedCropArea.height * bounds.scale,
      });
      console.log(
        "Expected cropped image size:",
        normalizedCropArea.width,
        "x",
        normalizedCropArea.height
      );

      const croppedDataURL = await cropImage(
        currentImageState.dataURL,
        normalizedCropArea
      );
      await updateImageState(croppedDataURL);
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
      const blurredDataURL = await blurImage(currentImageState.dataURL, {
        radius: blurRadius,
      });
      await updateImageState(blurredDataURL);
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
      const resizedDataURL = await resizeImage(currentImageState.dataURL, {
        width: resizeWidth,
        height: resizeHeight,
        maintainAspectRatio,
      });
      await updateImageState(resizedDataURL);
    } catch (error) {
      console.error("Failed to resize image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download handler
  const handleDownload = async () => {
    if (!currentImageState || isProcessing) return;

    setIsProcessing(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `mybias-${timestamp}.png`;
      await downloadImage(currentImageState.dataURL, filename);
    } catch (error) {
      console.error("Failed to download image:", error);
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
        {/* Header with Close button */}
        <div className="absolute z-10 top-4 right-4">
          <button
            onClick={onClose}
            className="
              group flex items-center gap-2 px-4 py-2
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
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500 transition-all duration-300 group-hover:text-white group-hover:rotate-90"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="text-sm font-medium text-gray-600 transition-colors duration-300 group-hover:text-white">
              닫기
            </span>
          </button>
        </div>

        {/* Main Preview Area - 9:20 aspect ratio for mobile wallpaper */}
        <div className="p-2 pb-2 sm:p-4 sm:pb-2 lg:p-6 lg:pb-4 flex justify-center">
          <div
            ref={imageContainerRef}
            className="relative flex items-center justify-center overflow-hidden bg-gray-100 rounded-2xl aspect-[9/20] max-h-[70vh] w-auto touch-none"
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
                  src={currentImageState.dataURL}
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
                          ? "border-violet-500 shadow-[0_0_0_2px_rgba(139,92,246,0.3)]"
                          : "border-transparent hover:border-gray-300"
                      }
                    `}
                    type="button"
                  >
                    <img
                      src={state?.dataURL || URL.createObjectURL(file)}
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
          <div className="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 lg:p-4 bg-white">
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
                    ? "bg-violet-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                    ? "bg-violet-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                    ? "bg-violet-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
              <span className="text-[10px] sm:text-xs font-semibold">RESIZE</span>
            </button>

            <button
              onClick={handleUndo}
              disabled={isProcessing || !canUndo}
              className={`
                flex flex-col items-center justify-center gap-0.5 sm:gap-1
                px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
                transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                bg-gray-100 text-gray-700 hover:bg-gray-200
              `}
              type="button"
              aria-label="Undo"
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
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span className="text-[10px] sm:text-xs font-semibold">UNDO</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isProcessing || !currentImageState}
              className={`
                flex flex-col items-center justify-center gap-0.5 sm:gap-1
                px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
                transition-all duration-200 cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                bg-emerald-500 text-white hover:bg-emerald-600
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
          {activeTool && (
            <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-200 bg-gray-50">
              {activeTool === "CROP" && (
                <div className="flex flex-col items-center gap-4">
                  <p className="m-0 text-sm text-gray-600">
                    Drag the selection box to position, drag the corner to
                    resize
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>X: {Math.round(cropArea.x)}</span>
                    <span>Y: {Math.round(cropArea.y)}</span>
                    <span>W: {Math.round(cropArea.width)}</span>
                    <span>H: {Math.round(cropArea.height)}</span>
                  </div>
                  <button
                    onClick={handleApplyCrop}
                    disabled={isProcessing}
                    className="px-6 py-2 font-semibold text-white transition-all duration-200 rounded-lg  bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Apply Crop
                  </button>
                </div>
              )}

              {activeTool === "BLUR" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center w-full max-w-md gap-4">
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
                  <button
                    onClick={handleApplyBlur}
                    disabled={isProcessing}
                    className="px-6 py-2 font-semibold text-white transition-all duration-200 rounded-lg  bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Apply Blur
                  </button>
                </div>
              )}

              {activeTool === "RESIZE" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Width:</label>
                      <input
                        type="number"
                        value={resizeWidth}
                        onChange={(e) =>
                          handleWidthChange(Number(e.target.value))
                        }
                        className="w-24 px-2 py-1 text-center border border-gray-300 rounded"
                        min="1"
                      />
                      <span className="text-sm text-gray-500">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Height:</label>
                      <input
                        type="number"
                        value={resizeHeight}
                        onChange={(e) =>
                          handleHeightChange(Number(e.target.value))
                        }
                        className="w-24 px-2 py-1 text-center border border-gray-300 rounded"
                        min="1"
                      />
                      <span className="text-sm text-gray-500">px</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintainAspectRatio}
                        onChange={(e) =>
                          setMaintainAspectRatio(e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600">
                        Lock aspect ratio
                      </span>
                    </label>
                  </div>
                  <button
                    onClick={handleApplyResize}
                    disabled={isProcessing}
                    className="px-6 py-2 font-semibold text-white transition-all duration-200 rounded-lg  bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Apply Resize
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
