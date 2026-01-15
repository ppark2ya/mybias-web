import { useEffect, useRef, useState, useCallback } from "react";
import { X, Crown, Check, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ImageCompareSlider } from "../ImageCompareSlider";
import { PRO_RESTORE_CREDIT_COST } from "../Editor/hooks/useProRestore";

type ModalMode = "preview" | "result";

interface ProRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (fidelity: number) => void;
  beforeImageUrl: string;
  afterImageUrl?: string;
  remainingUsage?: number;
  mode?: ModalMode;
}

// CSS filter simulation for Pro Restore preview
function getPreviewFilter(fidelity: number): React.CSSProperties {
  // Lower fidelity = stronger restoration (more AI processing)
  // Higher fidelity = keep more original features
  const intensity = 1 - fidelity; // Invert: low fidelity = high intensity

  const contrast = 1.08 + intensity * 0.15; // 1.08 ~ 1.23
  const saturation = 1.15 + intensity * 0.25; // 1.15 ~ 1.40
  const brightness = 1.03 + intensity * 0.07; // 1.03 ~ 1.10
  const sharpness = 0.8 + intensity * 0.4; // pseudo-sharpness via contrast

  return {
    filter: `
      contrast(${(contrast * sharpness).toFixed(3)})
      saturate(${saturation.toFixed(3)})
      brightness(${brightness.toFixed(3)})
    `.replace(/\s+/g, " ").trim(),
  };
}

// Before image filter (lower quality look)
function getBeforeFilter(): React.CSSProperties {
  return {
    filter: "blur(0.6px) contrast(0.85) saturate(0.70) brightness(0.90) grayscale(0.1)",
  };
}

const DEFAULT_FIDELITY = 0.5;

function ProRestoreModalContent({
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

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onClose();
      onConfirm(fidelity);
    }
  }, [onConfirm, onClose, fidelity]);

  const handleFidelityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFidelity(parseFloat(e.target.value));
    },
    []
  );

  const hasEnoughCredits = remainingUsage >= PRO_RESTORE_CREDIT_COST;
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
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${
                  isResultMode
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-amber-500 to-orange-600"
                }`}
              >
                {isResultMode ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  {isResultMode
                    ? t("editor.proRestore.result.title")
                    : t("editor.proRestore.preview.title")}
                  {!isResultMode && (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full">
                      PRO
                    </span>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {isResultMode
                    ? t("editor.proRestore.result.subtitle")
                    : t("editor.proRestore.preview.subtitle")}
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
            <ImageCompareSlider
              beforeImage={beforeImageUrl}
              afterImage={afterImageUrl}
              beforeLabel={t("editor.proRestore.result.before")}
              afterLabel={t("editor.proRestore.result.after")}
              className="rounded-xl sm:rounded-2xl overflow-hidden"
            />
          ) : (
            <ImageCompareSlider
              beforeImage={beforeImageUrl}
              afterImage={beforeImageUrl}
              beforeLabel={t("editor.proRestore.preview.before")}
              afterLabel={t("editor.proRestore.preview.after")}
              className="rounded-xl sm:rounded-2xl overflow-hidden"
              beforeStyle={getBeforeFilter()}
              afterStyle={previewStyle}
            />
          )}

          {/* Fidelity Slider - Only in Preview Mode */}
          {!isResultMode && (
            <div className="mt-4 sm:mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t("editor.proRestore.preview.fidelity")}
                </span>
                <span className="ml-auto text-sm font-semibold text-amber-600">
                  {Math.round(fidelity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={fidelity}
                onChange={handleFidelityChange}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{t("editor.proRestore.preview.fidelityLow")}</span>
                <span>{t("editor.proRestore.preview.fidelityHigh")}</span>
              </div>
            </div>
          )}

          {/* Feature Highlights - Only in Preview Mode */}
          {!isResultMode && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-green-500">✓</span>
                <span className="text-gray-600">{t("editor.proRestore.features.upscale2x")}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-green-500">✓</span>
                <span className="text-gray-600">{t("editor.proRestore.features.skinTone")}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-green-500">✓</span>
                <span className="text-gray-600">{t("editor.proRestore.features.colorCorrection")}</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-green-500">✓</span>
                <span className="text-gray-600">{t("editor.proRestore.features.promptGuided")}</span>
              </div>
            </div>
          )}

          {/* Info Message */}
          <div
            className={`p-3 sm:p-4 mt-4 rounded-xl ${
              isResultMode
                ? "bg-gradient-to-r from-emerald-50 to-teal-50"
                : "bg-gradient-to-r from-amber-50 to-orange-50"
            }`}
          >
            <p className="text-xs sm:text-sm text-center text-gray-600">
              {isResultMode
                ? t("editor.proRestore.result.info")
                : t("editor.proRestore.preview.info")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
          {isResultMode ? (
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-center">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                type="button"
              >
                <Check className="w-4 h-4" />
                {t("editor.proRestore.result.confirm")}
              </button>
            </div>
          ) : (
            <>
              <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">
                  <Crown className="w-3 h-3" />
                  {PRO_RESTORE_CREDIT_COST}
                </span>
                <span>{t("editor.proRestore.preview.creditCost")}</span>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  {t("editor.proRestore.preview.cancel")}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!hasEnoughCredits}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Crown className="w-4 h-4" />
                  {t("editor.proRestore.preview.restore")}
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

export function ProRestoreModal({
  isOpen,
  onClose,
  onConfirm,
  beforeImageUrl,
  afterImageUrl,
  remainingUsage = 0,
  mode = "preview",
}: ProRestoreModalProps) {
  const isResultMode = mode === "result";

  if (!isOpen) return null;

  return (
    <ProRestoreModalContent
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

export default ProRestoreModal;
