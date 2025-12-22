import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import Uploader from "../components/Uploader";
import Editor from "../components/Editor";
import LanguageSwitcher from "../components/LanguageSwitcher";
import SeoContent from "../components/SeoContent";
import Footer from "../components/Footer";

export const Route = createFileRoute("/")({
  component: Home,
});

export function Home() {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleUpload = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleCloseEditor = () => {
    setUploadedFiles([]);
  };

  const isEditing = uploadedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 py-4 px-2 sm:py-6 sm:px-4 lg:py-8 lg:px-6">
      {/* Language Switcher - Fixed position on top right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <LanguageSwitcher />
      </div>

      <header className="text-center mb-2 py-1 sm:mb-3 sm:py-2 lg:mb-4 lg:py-3">
        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white m-0 mb-2 sm:mb-3 lg:mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.25)] tracking-tight">
          {t("home.title")}
        </h1>
        <p className="text-sm sm:text-base lg:text-xl text-white/90 m-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
          {t("home.subtitle")}
        </p>
      </header>

      <main className="max-w-[1200px] mx-auto">
        {isEditing ? (
          <Editor files={uploadedFiles} onClose={handleCloseEditor} />
        ) : (
          <Uploader onUpload={handleUpload} />
        )}
      </main>

      {/* SEO Content - Visible below main content for search engine optimization */}
      {!isEditing && <SeoContent />}

      {/* Footer with legal links */}
      {!isEditing && <Footer />}
    </div>
  );
}

export default Home;
