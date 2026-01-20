import { useState, useRef, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Upload, ImageUp, Eraser, Shirt, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import Header from "../components/Header";
import Editor from "../components/Editor";
import Footer from "../components/Footer";

export const Route = createFileRoute("/")({
  component: Home,
});

export function Home() {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback((files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(Array.from(files));
    }
    e.target.value = "";
  }, [handleUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      handleUpload(files);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const isEditing = uploadedFiles.length > 0;

  const aiTools = [
    {
      id: "upscale",
      name: t("aiFeatures.upscale.name", "AI Upscale"),
      description: t("aiFeatures.upscale.description", "Enhance quality & restore faces"),
      icon: ImageUp,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      id: "eraser",
      name: t("aiFeatures.eraser.name", "Magic Eraser"),
      description: t("aiFeatures.eraser.description", "Remove unwanted objects"),
      icon: Eraser,
      gradient: "from-rose-500 to-pink-500",
    },
    {
      id: "lookbook",
      name: t("aiFeatures.lookbook.name", "AI Lookbook"),
      description: t("aiFeatures.lookbook.description", "Virtual clothing try-on"),
      icon: Shirt,
      gradient: "from-cyan-500 to-teal-500",
      href: "/ai-lookbook",
      isNew: true,
    },
  ];

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 py-4 px-2 sm:py-6 sm:px-4">
        <div className="max-w-[1200px] mx-auto">
          <Editor files={uploadedFiles} onClose={handleCloseEditor} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 sm:pt-28 pb-8">
        {/* Hero Section */}
        <div className="text-center mb-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">
              {t("aiFeatures.badge", "AI-Powered Photo Tools")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg leading-tight">
            {t("home.heroTitle", "Transform Your Photos with AI")}
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto">
            {t("home.heroSubtitle", "Upscale, enhance, and edit your photos with cutting-edge AI technology. Free to start.")}
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full max-w-xl
            bg-white rounded-2xl p-8 sm:p-12
            border-2 border-dashed
            cursor-pointer
            transition-all duration-300
            ${isDragOver
              ? "border-fuchsia-500 bg-fuchsia-50 scale-105"
              : "border-gray-300 hover:border-fuchsia-400 hover:bg-gray-50"
            }
          `}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${isDragOver ? "bg-fuchsia-100" : "bg-gray-100"}
              transition-colors
            `}>
              <Upload className={`w-8 h-8 ${isDragOver ? "text-fuchsia-600" : "text-gray-500"}`} />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              {isDragOver
                ? t("uploader.dragActive", "Drop here")
                : t("home.uploadTitle", "Drop your image here")}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {t("home.uploadDesc", "or click to browse from your device")}
            </p>
            <button
              type="button"
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-medium rounded-xl hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {t("home.uploadButton", "Choose Image")}
            </button>
            <p className="text-gray-400 text-xs mt-4">
              {t("home.uploadFormats", "Supports JPG, PNG, WEBP up to 10MB")}
            </p>
          </div>
        </div>

        {/* AI Tools Quick Links */}
        <div className="mt-12 w-full max-w-3xl">
          <h3 className="text-white/80 text-sm font-medium text-center mb-4">
            {t("home.orTryTools", "Or try our AI tools directly")}
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {aiTools.map((tool) => {
              const Wrapper = tool.href ? Link : "button";
              const wrapperProps = tool.href
                ? { to: tool.href }
                : { type: "button" as const, onClick: () => fileInputRef.current?.click() };

              return (
                <Wrapper
                  key={tool.id}
                  {...wrapperProps}
                  className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 transition-all hover:-translate-y-1 text-left border border-white/10"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-white font-medium text-sm">{tool.name}</span>
                    {tool.isNew && (
                      <span className="px-1.5 py-0.5 text-[8px] font-bold text-white bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-white/60 text-xs line-clamp-1">{tool.description}</p>
                </Wrapper>
              );
            })}
          </div>
        </div>

        {/* Learn More Link */}
        <div className="mt-8">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t("home.learnMore", "Learn more about our AI tools")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
