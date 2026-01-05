import { useEffect, useRef, useState, useCallback } from "react";
import { X, Eraser, Undo2, Redo2, Trash2, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MaskCanvas, type MaskCanvasRef } from "../MaskCanvas";

interface EraserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (maskBase64: string) => void;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  remainingUsage: number;
  isProcessing?: boolean;
}

const BRUSH_SIZES = [15, 30, 50, 80];
const DEFAULT_BRUSH_INDEX = 1; // 30px

function EraserModalContent({
  onClose,
  onConfirm,
  imageUrl,
  imageWidth,
  imageHeight,
  remainingUsage,
  isProcessing = false,
}: Omit<EraserModalProps, "isOpen">) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<MaskCanvasRef>(null);
  const [brushSizeIndex, setBrushSizeIndex] = useState(DEFAULT_BRUSH_INDEX);
  const [hasStrokes, setHasStrokes] = useState(false);

  const brushSize = BRUSH_SIZES[brushSizeIndex];

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose, isProcessing]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isProcessing) {
        onClose();
      }
    },
    [onClose, isProcessing]
  );

  const handleConfirm = useCallback(async () => {
    if (!maskCanvasRef.current || !hasStrokes || isProcessing) return;

    try {
      const maskBase64 = await maskCanvasRef.current.exportMask();
      onClose();
      onConfirm(maskBase64);
    } catch (error) {
      console.error("Failed to export mask:", error);
    }
  }, [onConfirm, onClose, hasStrokes, isProcessing]);

  const handleUndo = useCallback(() => {
    maskCanvasRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    maskCanvasRef.current?.redo();
  }, []);

  const handleClear = useCallback(() => {
    maskCanvasRef.current?.clearCanvas();
    setHasStrokes(false);
  }, []);

  const handleDecreaseBrush = useCallback(() => {
    setBrushSizeIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleIncreaseBrush = useCallback(() => {
    setBrushSizeIndex((prev) => Math.min(BRUSH_SIZES.length - 1, prev + 1));
  }, []);

  const handleStrokesChange = useCallback((has: boolean) => {
    setHasStrokes(has);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 duration-200 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="
          w-full sm:max-w-2xl
          max-h-[95vh] sm:max-h-[90vh]
          bg-white
          rounded-t-3xl sm:rounded-3xl
          shadow-2xl
          animate-in slide-in-from-bottom sm:zoom-in-95 duration-300
          overflow-hidden
          flex flex-col
        "
      >
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 px-4 sm:px-6 pt-2 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600">
                <Eraser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {t("editor.eraser.title")}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {t("editor.eraser.subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 -mr-2 text-gray-400 transition-colors rounded-full hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              type="button"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-hidden">
          <div
            className="relative w-full bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden"
            style={{
              aspectRatio: `${imageWidth} / ${imageHeight}`,
              maxHeight: "50vh",
            }}
          >
            <MaskCanvas
              ref={maskCanvasRef}
              imageUrl={imageUrl}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              brushSize={brushSize}
              onStrokesChange={handleStrokesChange}
            />
          </div>

          {/* Tool Controls */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
              <button
                onClick={handleUndo}
                disabled={isProcessing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                type="button"
                aria-label="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={isProcessing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                type="button"
                aria-label="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1" />
              <button
                onClick={handleClear}
                disabled={isProcessing || !hasStrokes}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                type="button"
                aria-label="Clear"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Brush Size */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
              <button
                onClick={handleDecreaseBrush}
                disabled={isProcessing || brushSizeIndex === 0}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                type="button"
                aria-label="Decrease brush size"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center w-12 text-sm font-medium text-gray-700">
                {brushSize}px
              </div>
              <button
                onClick={handleIncreaseBrush}
                disabled={isProcessing || brushSizeIndex === BRUSH_SIZES.length - 1}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                type="button"
                aria-label="Increase brush size"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Message */}
          <div className="p-3 sm:p-4 mt-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50">
            <p className="text-xs sm:text-sm text-center text-gray-600">
              {t("editor.eraser.info")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
            {t("editor.eraser.remaining", { count: remainingUsage })}
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              type="button"
            >
              {t("editor.eraser.cancel")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || !hasStrokes}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <Eraser className="w-4 h-4" />
              {t("editor.eraser.erase")}
            </button>
          </div>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom sm:hidden" />
      </div>
    </div>
  );
}

export function EraserModal({
  isOpen,
  onClose,
  onConfirm,
  imageUrl,
  imageWidth,
  imageHeight,
  remainingUsage,
  isProcessing = false,
}: EraserModalProps) {
  if (!isOpen) return null;

  return (
    <EraserModalContent
      key={`${isOpen}`}
      onClose={onClose}
      onConfirm={onConfirm}
      imageUrl={imageUrl}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      remainingUsage={remainingUsage}
      isProcessing={isProcessing}
    />
  );
}

export default EraserModal;
