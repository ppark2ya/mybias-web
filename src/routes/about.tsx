import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import SeoContent from "../components/SeoContent";
import Footer from "../components/Footer";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t("about.backToHome", "Back to Home")}</span>
          </Link>
          <Link to="/" className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
            MyBias
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20">
        <SeoContent />
      </main>

      <Footer />
    </div>
  );
}

export default AboutPage;
