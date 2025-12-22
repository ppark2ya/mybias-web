import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Footer from "../components/Footer";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex flex-col">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Back Button */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t("legal.backToHome")}</span>
        </Link>
      </div>

      {/* Content */}
      <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
            {t("terms.title")}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {t("terms.lastUpdated")}: {t("terms.updateDate")}
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            {/* Section 1 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t("terms.section1.title")}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t("terms.section1.content")}
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t("terms.section2.title")}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t("terms.section2.content")}
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t("terms.section3.title")}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t("terms.section3.content")}
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t("terms.section4.title")}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t("terms.section4.content")}
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t("terms.section5.title")}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t("terms.section5.content")}
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t("terms.section6.title")}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t("terms.section6.content")}
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {t("terms.section7.title")}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t("terms.section7.content")}
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

export default TermsPage;
