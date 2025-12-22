import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  return (
    <article className="border-b border-gray-200 last:border-b-0">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-between py-4 text-left text-gray-700 hover:text-fuchsia-600 transition-colors"
        >
          <span className="font-medium text-sm sm:text-base pr-4">
            {question}
          </span>
          <ChevronDown
            className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        }`}
      >
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          {answer}
        </p>
      </div>
    </article>
  );
}

export function SeoContent() {
  const { t } = useTranslation();
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const faqs = [
    { q: t("seo.faq.q1"), a: t("seo.faq.a1") },
    { q: t("seo.faq.q2"), a: t("seo.faq.a2") },
    { q: t("seo.faq.q3"), a: t("seo.faq.a3") },
    { q: t("seo.faq.q4"), a: t("seo.faq.a4") },
  ];

  return (
    <section className="mt-8 sm:mt-12 lg:mt-16 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
        {/* Intro Section */}
        <article className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
            {t("seo.intro.title")}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("seo.intro.description1")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            {t("seo.intro.description2")}
          </p>
        </article>

        {/* How-to Section */}
        <article className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-6">
            {t("seo.howto.title")}
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {t("seo.howto.step1.title")}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {t("seo.howto.step1.description")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {t("seo.howto.step2.title")}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {t("seo.howto.step2.description")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {t("seo.howto.step3.title")}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {t("seo.howto.step3.description")}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Features Section */}
        <article className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-6">
            {t("seo.features.title")}
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-fuchsia-500">&#10003;</span>
                {t("seo.features.ai.title")}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed pl-6">
                {t("seo.features.ai.description")}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-fuchsia-500">&#10003;</span>
                {t("seo.features.privacy.title")}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed pl-6">
                {t("seo.features.privacy.description")}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-fuchsia-500">&#10003;</span>
                {t("seo.features.mobile.title")}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed pl-6">
                {t("seo.features.mobile.description")}
              </p>
            </div>
          </div>
        </article>

        {/* FAQ Section */}
        <article className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4">
            {t("seo.faq.title")}
          </h2>

          <div className="divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <FaqItem
                key={index}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaqs[index] ?? false}
                onToggle={() => toggleFaq(index)}
              />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export default SeoContent;
