import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Footer from "../components/Footer";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
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
            Refund Policy
          </h1>

          <div className="prose prose-gray max-w-none space-y-6">
            {/* Section 1 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                1. General Policy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Due to the nature of digital assets and AI processing costs,
                Save My Bias generally does not offer refunds on purchases once
                the credits have been utilized. Since our service incurs
                immediate GPU computing costs upon usage, all sales are
                considered final once the service is used.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                2. Eligibility for Refunds
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We offer a full refund within 14 days of purchase, provided that
                none of the purchased credits have been used.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  If you have purchased a credit pack and have not generated any
                  images, you are eligible for a full refund.
                </li>
                <li>
                  If you have used even 1 credit from the purchased pack, the
                  purchase is non-refundable.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                3. Technical Issues & Quality Disputes
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                If you experience a technical failure (e.g., system error where
                credits were deducted but no image was generated), we will
                restore the deducted credits to your account.
              </p>
              <p className="text-gray-600 leading-relaxed">
                AI generation results may vary depending on the original image
                quality. Dissatisfaction with the AI's artistic interpretation
                or output quality does not qualify for a monetary refund.
                However, in cases of severe technical errors (e.g., corrupted
                files), please contact support for a credit restoration.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                4. How to Request a Refund
              </h2>
              <p className="text-gray-600 leading-relaxed">
                To request a refund, please contact us at{" "}
                <a
                  href="mailto:support@savemybias.com"
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  support@savemybias.com
                </a>{" "}
                with your order ID. We will review your usage history and
                process the refund if you meet the eligibility criteria.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

export default RefundPolicyPage;
