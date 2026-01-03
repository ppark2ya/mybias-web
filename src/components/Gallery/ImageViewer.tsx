import { useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GalleryImage } from "../../api/gallery";

interface ImageViewerProps {
  image: GalleryImage;
  isDownloading: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export function ImageViewer({
  image,
  isDownloading,
  onClose,
  onDownload,
}: ImageViewerProps) {
  const { t } = useTranslation();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Close when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Top bar with buttons */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end gap-2 p-4">
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="flex items-center justify-center w-10 h-10 text-white transition-colors rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          aria-label={t("gallery.download")}
        >
          {isDownloading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 text-white transition-colors rounded-full bg-white/10 hover:bg-white/20"
          type="button"
          aria-label={t("gallery.close")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-200">
        <img
          src={image.imageUrl}
          alt={`AI Enhanced ${image.predictionId}`}
          className="object-contain max-w-full max-h-[90vh] rounded-lg shadow-2xl"
        />
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-sm text-white/60">
          {new Date(image.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
