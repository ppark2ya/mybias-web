import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { downloadImage } from "../../utils/imageEditor";
import { useAuth } from "../../hooks/useAuth";
import { trackToolSelect, trackFileDownload } from "../../utils/analytics";
import {
  Undo2,
  Redo2,
  Check,
  X,
  Crop,
  Sparkles,
  Crown,
  Maximize,
  Download,
  Eraser,
  // Share2, // TODO: Share button temporarily disabled
} from "lucide-react";
// import ShareModal from "../ShareModal"; // TODO: Share button temporarily disabled
import AIPreviewModal from "../AIPreviewModal";
import ProRestoreModal from "../ProRestoreModal";
import EraserModal from "../EraserModal";
import { useEditorState } from "./hooks/useEditorState";
import { useImageHistory } from "./hooks/useImageHistory";
import { useCropTool } from "./hooks/useCropTool";
import { useBlurTool } from "./hooks/useBlurTool";
import { useResizeTool } from "./hooks/useResizeTool";
import { useAIEnhance } from "./hooks/useAIEnhance";
import { useProRestore } from "./hooks/useProRestore";
import { useMagicEraser } from "./hooks/useMagicEraser";
import { IconButton } from "./components/IconButton";
import { ToolButton } from "./components/ToolButton";
import { CropOverlay } from "./components/CropOverlay";
import { ProcessingOverlay } from "./components/ProcessingOverlay";
import { ToolSettingsPanel } from "./components/ToolSettingsPanel";

interface EditorProps {
  files: File[];
  onClose: () => void;
}

export function Editor({ files, onClose }: EditorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isAIPreviewModalOpen, setIsAIPreviewModalOpen] = useState(false);
  const [isAIResultModalOpen, setIsAIResultModalOpen] = useState(false);
  const [aiResultImages, setAIResultImages] = useState<{
    beforeImageUrl: string;
    afterImageUrl: string;
  } | null>(null);
  const [isEraserModalOpen, setIsEraserModalOpen] = useState(false);
  const [eraserResultImages, setEraserResultImages] = useState<{
    beforeImageUrl: string;
    afterImageUrl: string;
  } | null>(null);
  const [isEraserResultModalOpen, setIsEraserResultModalOpen] = useState(false);
  const [isProRestoreModalOpen, setIsProRestoreModalOpen] = useState(false);
  const [proRestoreResultImages, setProRestoreResultImages] = useState<{
    beforeImageUrl: string;
    afterImageUrl: string;
  } | null>(null);
  const [isProRestoreResultModalOpen, setIsProRestoreResultModalOpen] = useState(false);

  // Editor state
  const {
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
    // isShareModalOpen, // TODO: Share button temporarily disabled
    // setIsShareModalOpen, // TODO: Share button temporarily disabled
  } = useEditorState(files);

  // History management
  const historyHook = useImageHistory(files, imageStates, setImageStates, selectedIndex);
  const {
    historyIndex,
    canUndo,
    canRedo,
    updateImageState,
    handleUndo,
    handleRedo,
  } = historyHook;

  // Crop tool
  const {
    isCropChanged,
    imageContainerRef,
    imageRef,
    getCropOverlayStyle,
    handleCropMouseDown,
    handleCropTouchStart,
    handleCropMouseMove,
    handleCropTouchMove,
    handleCropEnd,
    handleApplyCrop,
  } = useCropTool(
    currentImageState,
    selectedIndex,
    isProcessing,
    setIsProcessing,
    updateImageState
  );

  // Blur tool
  const { blurRadius, setBlurRadius, isBlurChanged, handleApplyBlur, resetBlurRadius } =
    useBlurTool(
      currentImageState,
      isProcessing,
      setIsProcessing,
      updateImageState
    );

  // Resize tool
  const {
    resizeWidth,
    resizeHeight,
    maintainAspectRatio,
    setMaintainAspectRatio,
    isResizeChanged,
    handleWidthChange,
    handleHeightChange,
    handleApplyResize,
  } = useResizeTool(
    currentImageState,
    selectedIndex,
    isProcessing,
    setIsProcessing,
    updateImageState
  );

  // AI Enhance
  const { remainingAIUsage, handleAIEnhance } = useAIEnhance(
    currentImageState,
    selectedIndex,
    setImageStates,
    historyIndex,
    historyHook.setHistory,
    historyHook.setHistoryIndex,
    setProcessingMessage,
    isProcessing,
    setIsProcessing,
    (result) => {
      setAIResultImages(result);
      setIsAIResultModalOpen(true);
    }
  );

  // Pro Restore
  const { remainingCredits: proRestoreCredits, handleProRestore } = useProRestore(
    currentImageState,
    selectedIndex,
    setImageStates,
    historyIndex,
    historyHook.setHistory,
    historyHook.setHistoryIndex,
    setProcessingMessage,
    isProcessing,
    setIsProcessing,
    (result) => {
      setProRestoreResultImages(result);
      setIsProRestoreResultModalOpen(true);
    }
  );

  // Magic Eraser
  const { remainingCredits: eraserCredits, handleMagicErase } = useMagicEraser(
    currentImageState,
    selectedIndex,
    setImageStates,
    historyIndex,
    historyHook.setHistory,
    historyHook.setHistoryIndex,
    setProcessingMessage,
    isProcessing,
    setIsProcessing,
    (result) => {
      setEraserResultImages(result);
      setIsEraserResultModalOpen(true);
    }
  );

  const handleActiveTool = (tool: typeof activeTool) => {
    // Reset blur preview when switching away from blur tool
    if (activeTool === "BLUR" && tool !== "BLUR") {
      resetBlurRadius();
    }
    setActiveTool(tool);
    if (tool) {
      trackToolSelect(tool);
    }
  };

  const handleDownload = () => {
    if (!currentImageState || isProcessing) return;
    trackFileDownload();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `mybias-${timestamp}.png`;
    downloadImage(currentImageState.blobUrl, filename);
  };

  const openAIPreviewModal = () => {
    if (!currentImageState || isProcessing) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    if (remainingAIUsage === 0) return;
    setIsAIPreviewModalOpen(true);
  };

  const openEraserModal = () => {
    if (!currentImageState || isProcessing) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    if (eraserCredits === 0) return;
    setIsEraserModalOpen(true);
  };

  const openProRestoreModal = () => {
    if (!currentImageState || isProcessing) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    if (proRestoreCredits < 3) return; // Pro Restore costs 3 credits
    setIsProRestoreModalOpen(true);
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto p-2 sm:p-4 lg:p-8">
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-[0_10px_60px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Header with action buttons */}
        <div className="absolute z-10 top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 flex items-center gap-1.5 sm:gap-2">
          {/* Undo/Redo buttons */}
          {(canUndo || canRedo) && (
            <div className="flex items-center gap-1">
              <IconButton
                onClick={handleUndo}
                disabled={isProcessing || !canUndo}
                icon={<Undo2 className="w-4 h-4 text-slate-600" strokeWidth={2.5} />}
                label={t("editor.undo")}
              />
              <IconButton
                onClick={handleRedo}
                disabled={isProcessing || !canRedo}
                icon={<Redo2 className="w-4 h-4 text-slate-600" strokeWidth={2.5} />}
                label={t("editor.redo")}
              />
            </div>
          )}
          {/* Apply button */}
          {activeTool && (
            <IconButton
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
              icon={<Check className="w-4 h-4 text-white" strokeWidth={2.5} />}
              label={t("editor.apply")}
              variant="primary"
            />
          )}
          {/* Close button */}
          <IconButton
            onClick={onClose}
            icon={
              <X
                className="w-4 h-4 text-gray-500 transition-all duration-300 group-hover:text-white group-hover:rotate-90"
                strokeWidth={2.5}
              />
            }
            label={t("editor.close")}
            variant="close"
          />
        </div>

        {/* Main Preview Area */}
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
                  className="object-contain max-w-full max-h-full transition-[filter] duration-150"
                  style={{
                    filter: activeTool === "BLUR" && blurRadius > 0
                      ? `blur(${blurRadius}px)`
                      : undefined,
                  }}
                  draggable={false}
                />

                {/* Crop overlay */}
                {activeTool === "CROP" && (
                  <CropOverlay
                    style={getCropOverlayStyle()}
                    onMouseDown={handleCropMouseDown}
                    onTouchStart={handleCropTouchStart}
                  />
                )}
              </>
            )}

            {isProcessing && <ProcessingOverlay message={processingMessage} />}
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
            <ToolButton
              onClick={() =>
                handleActiveTool(activeTool === "CROP" ? null : "CROP")
              }
              disabled={isProcessing}
              active={activeTool === "CROP"}
              icon={<Crop className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              label="CROP"
            />

            <ToolButton
              onClick={() =>
                handleActiveTool(activeTool === "BLUR" ? null : "BLUR")
              }
              disabled={isProcessing}
              active={activeTool === "BLUR"}
              icon={
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
              }
              label="BLUR"
            />

            <ToolButton
              onClick={() =>
                handleActiveTool(activeTool === "RESIZE" ? null : "RESIZE")
              }
              disabled={isProcessing}
              active={activeTool === "RESIZE"}
              icon={<Maximize className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              label="RESIZE"
            />

            <ToolButton
              onClick={openAIPreviewModal}
              disabled={isProcessing || !currentImageState || (isAuthenticated && remainingAIUsage === 0)}
              icon={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              label="UPSCALE"
              variant="ai"
            />

            <ToolButton
              onClick={openProRestoreModal}
              disabled={isProcessing || !currentImageState || (isAuthenticated && proRestoreCredits < 3)}
              icon={<Crown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              label="PRO"
              variant="pro"
            />

            <ToolButton
              onClick={openEraserModal}
              disabled={isProcessing || !currentImageState || (isAuthenticated && eraserCredits === 0)}
              icon={<Eraser className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              label="ERASER"
              variant="eraser"
            />

            <ToolButton
              onClick={handleDownload}
              disabled={isProcessing || !currentImageState}
              icon={<Download className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              label="SAVE"
              variant="download"
            />

{/* TODO: Share button temporarily disabled
            <ToolButton
              onClick={() => setIsShareModalOpen(true)}
              disabled={isProcessing || !currentImageState}
              icon={<Share2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
              label="SHARE"
              variant="share"
            />
            */}
          </div>

          {/* Tool Settings Panel */}
          <ToolSettingsPanel
            activeTool={activeTool}
            blurRadius={blurRadius}
            onBlurRadiusChange={setBlurRadius}
            resizeWidth={resizeWidth}
            resizeHeight={resizeHeight}
            maintainAspectRatio={maintainAspectRatio}
            onResizeWidthChange={handleWidthChange}
            onResizeHeightChange={handleHeightChange}
            onToggleAspectRatio={() => setMaintainAspectRatio(!maintainAspectRatio)}
          />
        </div>
      </div>

{/* TODO: Share Modal temporarily disabled
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={currentImageState?.blobUrl || ""}
      />
      */}

      {/* AI Preview Modal */}
      <AIPreviewModal
        isOpen={isAIPreviewModalOpen}
        onClose={() => setIsAIPreviewModalOpen(false)}
        onConfirm={handleAIEnhance}
        beforeImageUrl={currentImageState?.blobUrl || ""}
        remainingUsage={remainingAIUsage}
        mode="preview"
      />

      {/* AI Result Modal */}
      <AIPreviewModal
        isOpen={isAIResultModalOpen}
        onClose={() => setIsAIResultModalOpen(false)}
        beforeImageUrl={aiResultImages?.beforeImageUrl || ""}
        afterImageUrl={aiResultImages?.afterImageUrl || ""}
        mode="result"
      />

      {/* Eraser Modal */}
      <EraserModal
        isOpen={isEraserModalOpen}
        onClose={() => setIsEraserModalOpen(false)}
        onConfirm={handleMagicErase}
        imageUrl={currentImageState?.blobUrl || ""}
        imageWidth={currentImageState?.width || 0}
        imageHeight={currentImageState?.height || 0}
        remainingUsage={eraserCredits}
        isProcessing={isProcessing}
      />

      {/* Eraser Result Modal */}
      <AIPreviewModal
        isOpen={isEraserResultModalOpen}
        onClose={() => setIsEraserResultModalOpen(false)}
        beforeImageUrl={eraserResultImages?.beforeImageUrl || ""}
        afterImageUrl={eraserResultImages?.afterImageUrl || ""}
        mode="result"
      />

      {/* Pro Restore Preview Modal */}
      <ProRestoreModal
        isOpen={isProRestoreModalOpen}
        onClose={() => setIsProRestoreModalOpen(false)}
        onConfirm={handleProRestore}
        beforeImageUrl={currentImageState?.blobUrl || ""}
        remainingUsage={proRestoreCredits}
        mode="preview"
      />

      {/* Pro Restore Result Modal */}
      <ProRestoreModal
        isOpen={isProRestoreResultModalOpen}
        onClose={() => setIsProRestoreResultModalOpen(false)}
        beforeImageUrl={proRestoreResultImages?.beforeImageUrl || ""}
        afterImageUrl={proRestoreResultImages?.afterImageUrl || ""}
        mode="result"
      />
    </div>
  );
}

export default Editor;
