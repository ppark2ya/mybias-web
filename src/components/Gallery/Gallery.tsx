import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { ArrowLeft, ImageIcon, Download, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useGalleryQuery, downloadImage } from "../../api/gallery";

export function Gallery() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data,
    isLoading,
    error,
  } = useGalleryQuery({
    enabled: isAuthenticated,
  });

  const images = data?.images ?? [];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleDownload = async (predictionId: string) => {
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
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 py-4 px-2 sm:py-6 sm:px-4 lg:py-8 lg:px-6">
      {/* Back Button */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white transition-all duration-200 border rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t("gallery.backToHome")}</span>
        </Link>
      </div>

      {/* Gallery Content */}
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
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
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
                <p className="mt-3 text-sm text-gray-500">
                  {t("gallery.loading")}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-red-500">
                  {error.response?.data?.error ?? t("gallery.loadError")}
                </p>
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">
                  {t("gallery.empty")}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {t("gallery.emptyHint")}
                </p>
                <Link
                  to="/"
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-lg hover:from-fuchsia-600 hover:to-purple-700 transition-all"
                >
                  {t("gallery.startCreating")}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                  >
                    <img
                      src={image.imageUrl}
                      alt={`AI Enhanced ${image.predictionId}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleDownload(image.predictionId)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
                        type="button"
                      >
                        <Download className="w-4 h-4" />
                        {t("gallery.download")}
                      </button>
                    </div>
                    {/* Date */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white/80">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gallery;
