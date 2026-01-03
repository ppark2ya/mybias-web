import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  useGalleryInfiniteQuery,
  downloadImage,
  type GalleryImage,
} from "../../api/gallery";
import { ImageViewer } from "./ImageViewer";
import { ImageSkeleton } from "./ImageSkeleton";
import { ShareModal } from "../ShareModal/ShareModal";

export function Gallery() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGalleryInfiniteQuery({
    enabled: isAuthenticated,
  });

  const images = data?.pages.flatMap((page) => page.images) ?? [];
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(
    () => new Set()
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleDownload = async (predictionId: string) => {
    if (downloadingId) return;

    setDownloadingId(predictionId);
    try {
      const blob = await downloadImage(predictionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mybias-${predictionId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleImageLoad = (imageId: string) => {
    setLoadedImages((prev) => new Set(prev).add(imageId));
  };

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  const handleCloseViewer = () => {
    setSelectedImage(null);
  };

  const handleDownloadFromViewer = () => {
    if (selectedImage) {
      handleDownload(selectedImage.predictionId);
    }
  };

  const handleShareFromViewer = () => {
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400">
        <div className="w-8 h-8 border-4 rounded-full border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen px-2 py-4 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 sm:py-6 sm:px-4 lg:py-8 lg:px-6">
      {/* Back Button */}
      <div className="fixed z-50 top-4 left-4 sm:top-6 sm:left-6">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white transition-all duration-200 border rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t("gallery.backToHome")}</span>
        </Link>
      </div>

      {/* Gallery Content */}
      <div className="max-w-4xl pt-16 mx-auto sm:pt-20">
        <div className="overflow-hidden bg-white shadow-2xl rounded-3xl">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {t("gallery.title")}
                </h1>
                <p className="text-sm text-gray-500">{t("gallery.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <ImageSkeleton count={6} />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-red-500">{t("gallery.loadError")}</p>
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-600">
                  {t("gallery.empty")}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {t("gallery.emptyHint")}
                </p>
                <Link
                  to="/"
                  className="px-4 py-2 mt-4 text-sm font-medium text-white transition-all rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
                >
                  {t("gallery.startCreating")}
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative overflow-hidden transition-transform duration-200 bg-gray-200 cursor-pointer group aspect-square rounded-xl hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => handleImageClick(image)}
                    >
                      {/* Skeleton placeholder */}
                      {!loadedImages.has(image.id) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
                      )}
                      <img
                        src={image.imageUrl}
                        alt={`AI Enhanced ${image.predictionId}`}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          loadedImages.has(image.id)
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-105"
                        }`}
                        loading="lazy"
                        onLoad={() => handleImageLoad(image.id)}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 transition-opacity duration-200 opacity-0 bg-black/20 group-hover:opacity-100" />
                      {/* Date badge */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 transition-opacity opacity-0 bg-gradient-to-t from-black/50 to-transparent group-hover:opacity-100">
                        <p className="text-xs text-white/80">
                          {new Date(image.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Loading more skeletons */}
                  {isFetchingNextPage && <ImageSkeleton count={3} />}
                </div>

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="flex items-center justify-center py-8"
                  >
                    <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          isDownloading={downloadingId === selectedImage.predictionId}
          onClose={handleCloseViewer}
          onDownload={handleDownloadFromViewer}
          onShare={handleShareFromViewer}
        />
      )}

      {/* Share Modal */}
      {selectedImage && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={handleCloseShareModal}
          imageUrl={selectedImage.imageUrl}
        />
      )}
    </div>
  );
}

export default Gallery;
