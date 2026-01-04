import { useEffect, useRef, useState, useCallback } from "react";
import { X, Sparkles, Check, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ImageCompareSlider } from "../ImageCompareSlider";

type ModalMode = "preview" | "result";

interface AIPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (fidelity: number) => void;
  beforeImageUrl: string;
  afterImageUrl?: string;
  remainingUsage?: number;
  mode?: ModalMode;
}

// CSS filter로 fidelity에 따른 예상 결과 시뮬레이션
// AI 보정 효과를 극적으로 표현 (실제 CodeFormer 결과와 유사하게)
function getPreviewFilter(fidelity: number): React.CSSProperties {
  // fidelity가 낮을수록 더 강한 보정 (복원 품질 우선)
  // fidelity가 높을수록 원본에 가깝게 (원본 특징 유지)
  const intensity = 1 - fidelity; // 0 ~ 1 (보정 강도)

  // 극적인 AI 보정 효과
  const contrast = 1.05 + intensity * 0.20; // 1.05 ~ 1.25
  const saturation = 1.10 + intensity * 0.30; // 1.10 ~ 1.40
  const brightness = 1.02 + intensity * 0.08; // 1.02 ~ 1.10

  return {
    filter: `
      contrast(${contrast.toFixed(3)})
      saturate(${saturation.toFixed(3)})
      brightness(${brightness.toFixed(3)})
    `.replace(/\s+/g, ' ').trim(),
  };
}

// Before 이미지에 적용할 "저화질/노이즈" 필터 (극적인 대비를 위해)
function getBeforeFilter(): React.CSSProperties {
  return {
    // 블러 + 낮은 대비 + 탈색 + 약간 어둡게 = 저화질 느낌
    filter: 'blur(0.5px) contrast(0.88) saturate(0.75) brightness(0.92) grayscale(0.08)',
  };
}

const DEFAULT_FIDELITY = 0.5;

// Inner component that resets state when key changes
function AIPreviewModalContent({
  onClose,
  onConfirm,
  beforeImageUrl,
  afterImageUrl,
  remainingUsage,
  isResultMode,
}: {
  onClose: () => void;
  onConfirm?: (fidelity: number) => void;
  beforeImageUrl: string;
  afterImageUrl?: string;
  remainingUsage: number;
  isResultMode: boolean;
}) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const [fidelity, setFidelity] = useState(DEFAULT_FIDELITY);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onClose();
      onConfirm(fidelity);
    }
  }, [onConfirm, onClose, fidelity]);

  const handleFidelityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFidelity(parseFloat(e.target.value));
  }, []);

  // Get filter styles for preview mode
  const previewStyle = !isResultMode ? getPreviewFilter(fidelity) : undefined;

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
          overflow-y-auto
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
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${
                isResultMode
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-violet-500 to-purple-600"
              }`}>
                {isResultMode ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {isResultMode
                    ? t("editor.ai.result.title")
                    : t("editor.ai.preview.title")}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {isResultMode
                    ? t("editor.ai.result.subtitle")
                    : t("editor.ai.preview.subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 transition-colors rounded-full hover:text-gray-600 hover:bg-gray-100"
              type="button"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area with Slider */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {isResultMode && afterImageUrl ? (
            /* Result Mode - Use actual before/after images */
            <ImageCompareSlider
              beforeImage={beforeImageUrl}
              afterImage={afterImageUrl}
              beforeLabel={t("editor.ai.result.before")}
              afterLabel={t("editor.ai.result.after")}
              className="rounded-xl sm:rounded-2xl overflow-hidden"
            />
          ) : (
            /* Preview Mode - Use CSS filter simulation */
            <ImageCompareSlider
              beforeImage={beforeImageUrl}
              afterImage={beforeImageUrl}
              beforeLabel={t("editor.ai.preview.before")}
              afterLabel={t("editor.ai.preview.after")}
              className="rounded-xl sm:rounded-2xl overflow-hidden"
              beforeStyle={getBeforeFilter()}
              afterStyle={previewStyle}
            />
          )}

          {/* Fidelity Slider - Only in Preview Mode */}
          {!isResultMode && (
            <div className="mt-4 sm:mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t("editor.ai.preview.fidelity")}
                </span>
                <span className="ml-auto text-sm font-semibold text-violet-600">
                  {Math.round(fidelity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={fidelity}
                onChange={handleFidelityChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{t("editor.ai.preview.fidelityLow")}</span>
                <span>{t("editor.ai.preview.fidelityHigh")}</span>
              </div>
            </div>
          )}

          {/* Info Message */}
          <div className={`p-3 sm:p-4 mt-4 rounded-xl ${
            isResultMode
              ? "bg-gradient-to-r from-emerald-50 to-teal-50"
              : "bg-gradient-to-r from-violet-50 to-purple-50"
          }`}>
            <p className="text-xs sm:text-sm text-center text-gray-600">
              {isResultMode
                ? t("editor.ai.result.info")
                : t("editor.ai.preview.info")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
          {isResultMode ? (
            /* Result mode footer */
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-center">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                type="button"
              >
                <Check className="w-4 h-4" />
                {t("editor.ai.result.confirm")}
              </button>
            </div>
          ) : (
            /* Preview mode footer */
            <>
              <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                {t("editor.ai.preview.remaining", { count: remainingUsage })}
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  {t("editor.ai.preview.cancel")}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                  type="button"
                >
                  <Sparkles className="w-4 h-4" />
                  {t("editor.ai.preview.enhance")}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom sm:hidden" />
      </div>
    </div>
  );
}

// Wrapper component that controls mounting/unmounting
export function AIPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  beforeImageUrl,
  afterImageUrl,
  remainingUsage = 0,
  mode = "preview",
}: AIPreviewModalProps) {
  const isResultMode = mode === "result";

  if (!isOpen) return null;

  // Key based on isOpen ensures fresh state on each open
  return (
    <AIPreviewModalContent
      key={`${isOpen}-${mode}`}
      onClose={onClose}
      onConfirm={onConfirm}
      beforeImageUrl={beforeImageUrl}
      afterImageUrl={afterImageUrl}
      remainingUsage={remainingUsage}
      isResultMode={isResultMode}
    />
  );
}

export default AIPreviewModal;
