import { useEffect, useRef } from "react";
import { X, Sparkles, ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

type ModalMode = "preview" | "result";

interface AIPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  beforeImageUrl: string;
  afterImageUrl?: string;
  remainingUsage?: number;
  mode?: ModalMode;
}

export function AIPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  beforeImageUrl,
  afterImageUrl,
  remainingUsage = 0,
  mode = "preview",
}: AIPreviewModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const isResultMode = mode === "result";

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onClose();
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 duration-200 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="
          w-full sm:max-w-3xl
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

        {/* Preview Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="flex flex-row gap-3 sm:gap-6">
            {/* Before Image */}
            <div className="flex-1 min-w-0">
              <div className="mb-2 text-center">
                <span className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
                  {isResultMode
                    ? t("editor.ai.result.before")
                    : t("editor.ai.preview.before")}
                </span>
              </div>
              <div className="overflow-hidden bg-gray-100 rounded-xl sm:rounded-2xl aspect-square">
                <img
                  src={beforeImageUrl}
                  alt="Before"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            {/* Arrow - hidden on mobile for more space */}
            <div className="hidden sm:flex items-center justify-center">
              <div className={`p-2 rounded-full ${
                isResultMode
                  ? "bg-gradient-to-r from-emerald-100 to-teal-100"
                  : "bg-gradient-to-r from-violet-100 to-purple-100"
              }`}>
                <ArrowRight className={`w-5 h-5 ${
                  isResultMode ? "text-emerald-600" : "text-violet-600"
                }`} />
              </div>
            </div>

            {/* After Image */}
            <div className="flex-1 min-w-0">
              <div className="mb-2 text-center">
                <span className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-white rounded-full ${
                  isResultMode
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-gradient-to-r from-violet-500 to-purple-500"
                }`}>
                  {isResultMode
                    ? t("editor.ai.result.after")
                    : t("editor.ai.preview.after")}
                </span>
              </div>
              <div className="relative overflow-hidden bg-gray-100 rounded-xl sm:rounded-2xl aspect-square">
                <img
                  src={isResultMode ? afterImageUrl : beforeImageUrl}
                  alt="After"
                  className="object-cover w-full h-full"
                  style={isResultMode ? undefined : {
                    filter: "contrast(1.08) saturate(1.15) brightness(1.03)",
                  }}
                />
                {/* Enhancement overlay effect - only in preview mode */}
                {!isResultMode && (
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
                )}
                {/* Sparkle decorations */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                  <Sparkles className={`w-3 h-3 sm:w-4 sm:h-4 animate-pulse ${
                    isResultMode ? "text-emerald-400" : "text-yellow-400"
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className={`p-3 sm:p-4 mt-4 sm:mt-6 rounded-xl ${
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

export default AIPreviewModal;
