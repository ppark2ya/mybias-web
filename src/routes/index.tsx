import { useState, useRef, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Upload, ImageUp, Eraser, Shirt, Sparkles, ArrowRight,
  Zap, Shield, Smartphone, CheckCircle2, ChevronRight,
  Eye, Wand2
} from "lucide-react";
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

  // AI Tool previews with before/after examples
  const aiToolPreviews = [
    {
      id: "upscale",
      name: t("landing.features.upscale.name", "AI Upscale"),
      description: t("landing.features.upscale.description", "Transform blurry, low-resolution photos into crystal-clear HD images. Our AI restores facial details, enhances skin tones, and sharpens every pixel."),
      icon: ImageUp,
      gradient: "from-amber-500 to-orange-500",
      beforeImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=40&blur=5",
      afterImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=90",
    },
    {
      id: "eraser",
      name: t("landing.features.eraser.name", "Magic Eraser"),
      description: t("landing.features.eraser.description", "Remove unwanted objects, people, or blemishes from your photos. AI intelligently fills the background for seamless results."),
      icon: Eraser,
      gradient: "from-rose-500 to-pink-500",
      beforeImage: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
      afterImage: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&q=80",
    },
    {
      id: "lookbook",
      name: t("landing.features.lookbook.name", "AI Lookbook"),
      description: t("landing.features.lookbook.description", "Try on any outfit virtually. Upload your photo and see how different clothes look on you before buying."),
      icon: Shirt,
      gradient: "from-cyan-500 to-teal-500",
      beforeImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80",
      afterImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80",
      href: "/ai-lookbook",
      isNew: true,
    },
  ];

  // Benefits section
  const benefits = [
    {
      icon: Zap,
      title: t("landing.benefits.fast.title", "Lightning Fast"),
      description: t("landing.benefits.fast.description", "Get results in seconds with our GPU-powered AI processing"),
      color: "text-yellow-500",
    },
    {
      icon: Shield,
      title: t("landing.benefits.secure.title", "Privacy First"),
      description: t("landing.benefits.secure.description", "Your photos are processed securely and never shared"),
      color: "text-green-500",
    },
    {
      icon: Smartphone,
      title: t("landing.benefits.mobile.title", "Works Everywhere"),
      description: t("landing.benefits.mobile.description", "Use on any device - mobile, tablet, or desktop"),
      color: "text-blue-500",
    },
    {
      icon: Wand2,
      title: t("landing.benefits.quality.title", "Pro Quality"),
      description: t("landing.benefits.quality.description", "Studio-quality results powered by state-of-the-art AI"),
      color: "text-purple-500",
    },
  ];

  // How it works steps
  const steps = [
    {
      number: "1",
      title: t("landing.howItWorks.step1.title", "Upload"),
      description: t("landing.howItWorks.step1.description", "Drop your image or click to upload"),
    },
    {
      number: "2",
      title: t("landing.howItWorks.step2.title", "Choose AI Tool"),
      description: t("landing.howItWorks.step2.description", "Select upscale, eraser, or other tools"),
    },
    {
      number: "3",
      title: t("landing.howItWorks.step3.title", "Download"),
      description: t("landing.howItWorks.step3.description", "Get your enhanced photo instantly"),
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
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400">
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

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">
              {t("aiFeatures.badge", "AI-Powered Photo Tools")}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg leading-tight">
            {t("home.heroTitle", "Transform Your Photos with AI")}
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            {t("home.heroSubtitle", "Upscale, enhance, and edit your photos with cutting-edge AI technology. Free to start.")}
          </p>

          {/* Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              w-full max-w-xl mx-auto
              bg-white rounded-2xl p-8 sm:p-10
              border-2 border-dashed
              cursor-pointer
              transition-all duration-300
              shadow-2xl
              ${isDragOver
                ? "border-fuchsia-500 bg-fuchsia-50 scale-105"
                : "border-gray-300 hover:border-fuchsia-400 hover:bg-gray-50"
              }
            `}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-4
                ${isDragOver ? "bg-fuchsia-100" : "bg-gradient-to-br from-fuchsia-100 to-purple-100"}
                transition-colors
              `}>
                <Upload className={`w-8 h-8 ${isDragOver ? "text-fuchsia-600" : "text-fuchsia-500"}`} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {isDragOver
                  ? t("uploader.dragActive", "Drop here")
                  : t("home.uploadTitle", "Drop your image here")}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {t("home.uploadDesc", "or click to browse from your device")}
              </p>
              <button
                type="button"
                className="px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold rounded-xl hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {t("home.uploadButton", "Choose Image")}
              </button>
              <p className="text-gray-400 text-xs mt-4">
                {t("home.uploadFormats", "Supports JPG, PNG, WEBP up to 10MB")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Preview Section */}
      <section className="py-16 px-4 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("landing.features.title", "Powerful AI Tools at Your Fingertips")}
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {t("landing.features.subtitle", "Professional photo editing made simple with our suite of AI-powered tools")}
            </p>
          </div>

          <div className="space-y-16">
            {aiToolPreviews.map((tool, index) => (
              <div
                key={tool.id}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12 items-center`}
              >
                {/* Preview Images */}
                <div className="flex-1 w-full">
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Before */}
                      <div className="relative">
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs font-medium text-white z-10">
                          {t("common.before", "Before")}
                        </div>
                        <img
                          src={tool.beforeImage}
                          alt="Before"
                          className="w-full aspect-[4/5] object-cover rounded-xl"
                        />
                      </div>
                      {/* After */}
                      <div className="relative">
                        <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded text-xs font-medium text-white z-10">
                          {t("common.after", "After")}
                        </div>
                        <img
                          src={tool.afterImage}
                          alt="After"
                          className="w-full aspect-[4/5] object-cover rounded-xl"
                        />
                        {/* Sparkle effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-xl pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} mb-4 shadow-lg`}>
                    <tool.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white">
                      {tool.name}
                    </h3>
                    {tool.isNew && (
                      <span className="px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full">
                        {t("common.new", "NEW")}
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-lg mb-6 max-w-md mx-auto lg:mx-0">
                    {tool.description}
                  </p>
                  {tool.href ? (
                    <Link
                      to={tool.href}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <Eye className="w-5 h-5" />
                      {t("landing.tryNow", "Try Now")}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <Eye className="w-5 h-5" />
                      {t("landing.tryNow", "Try Now")}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("landing.howItWorks.title", "How It Works")}
            </h2>
            <p className="text-white/70 text-lg">
              {t("landing.howItWorks.subtitle", "Get stunning results in just 3 simple steps")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-white/20" />
                )}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-white/60 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("landing.benefits.title", "Why Choose MyBias?")}
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-6 text-center hover:bg-white/15 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4 ${benefit.color}`}>
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                <p className="text-white/60 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {t("landing.cta.title", "Ready to Transform Your Photos?")}
          </h2>
          <p className="text-white/70 text-lg mb-8">
            {t("landing.cta.subtitle", "Join thousands of users who trust MyBias for their photo editing needs")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              <Upload className="w-5 h-5" />
              {t("landing.cta.button", "Start Editing for Free")}
            </button>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              {t("landing.cta.learnMore", "Learn More")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>{t("landing.trust.noSignup", "No signup required")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>{t("landing.trust.freeCredits", "5 free credits")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>{t("landing.trust.noWatermark", "No watermarks")}</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
