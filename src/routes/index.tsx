import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import AIFeatureCards from "../components/AIFeatureCards";
import Uploader from "../components/Uploader";
import Editor from "../components/Editor";
import SeoContent from "../components/SeoContent";
import Footer from "../components/Footer";

export const Route = createFileRoute("/")({
  component: Home,
});

type ViewMode = "features" | "uploader" | "editor";

export function Home() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("features");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    setViewMode("editor");
  };

  const handleCloseEditor = () => {
    setUploadedFiles([]);
    setViewMode("features");
  };

  const handleDirectEdit = () => {
    // Trigger file input click
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(Array.from(files));
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const isEditing = viewMode === "editor" && uploadedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400">
      {/* Hidden file input for direct edit */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Header - Hidden when editing */}
      {!isEditing && <Header />}

      {/* Main Content */}
      <main className={`${isEditing ? "py-4 px-2 sm:py-6 sm:px-4" : "pt-24 sm:pt-28 pb-8 px-4"}`}>
        {isEditing ? (
          <div className="max-w-[1200px] mx-auto">
            <Editor files={uploadedFiles} onClose={handleCloseEditor} />
          </div>
        ) : viewMode === "uploader" ? (
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {t("home.title")}
              </h1>
              <p className="text-white/80 text-sm sm:text-base">
                {t("home.subtitle")}
              </p>
            </div>
            <Uploader onUpload={handleUpload} />
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setViewMode("features")}
                className="text-white/80 hover:text-white text-sm underline transition-colors"
              >
                {t("aiFeatures.backToFeatures", "Back to AI tools")}
              </button>
            </div>
          </div>
        ) : (
          <AIFeatureCards onDirectEdit={handleDirectEdit} />
        )}
      </main>

      {/* SEO Content & Footer - Visible only on features view */}
      {viewMode === "features" && (
        <>
          <SeoContent />
          <Footer />
        </>
      )}
    </div>
  );
}

export default Home;
