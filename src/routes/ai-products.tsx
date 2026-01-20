import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ImageUp,
  Eraser,
  Shirt,
  ArrowRight,
} from "lucide-react";
import Footer from "../components/Footer";

export const Route = createFileRoute("/ai-products")({
  component: AIProducts,
});

interface AIModel {
  id: string;
  name: string;
  modelName: string;
  credits: number;
  description: string;
  technicalDetails: string;
  useCases: string[];
  beforeImage: string;
  afterImage: string;
  icon: React.ReactNode;
  color: string;
}

const models: AIModel[] = [
  {
    id: "codeformer",
    name: "Standard Upscale",
    modelName: "CodeFormer",
    credits: 1,
    description: "얼굴 복원 AI로 흐릿한 사진을 선명하게 보정합니다",
    technicalDetails:
      "Face Restoration model (sczhou/codeformer) - Fast & cost-effective enhancement for general photos",
    useCases: [
      "흐릿한 팬캠 사진 선명하게",
      "저화질 콘서트 사진 개선",
      "오래된 사진 복원",
    ],
    beforeImage: "https://assets.savemybias.com/ai-examples/virtual-standard-before.png",
    afterImage: "https://assets.savemybias.com/ai-examples/virtual-standard-after.png",
    icon: <ImageUp className="w-6 h-6" />,
    color: "from-yellow-400 to-orange-500",
  },
  {
    id: "inpainting",
    name: "Magic Eraser",
    modelName: "Stable Diffusion Inpainting",
    credits: 2,
    description: "사진에서 원하지 않는 사람이나 물건을 자연스럽게 지웁니다",
    technicalDetails:
      "High-quality generative inpainting v2.0 - Better for natural blending and background reconstruction",
    useCases: [
      "방해되는 사람 제거",
      "배경 잡티 제거",
      "자연스러운 배경 채우기",
    ],
    beforeImage: "https://assets.savemybias.com/ai-examples/virtual-eraser-before.png",
    afterImage: "https://assets.savemybias.com/ai-examples/virtual-eraser-after.png",
    icon: <Eraser className="w-6 h-6" />,
    color: "from-pink-400 to-rose-500",
  },
  {
    id: "lookbook",
    name: "AI Lookbook",
    modelName: "Virtual Try-On + Face Swap",
    credits: 7,
    description: "가상으로 옷을 입어볼 수 있습니다. AI가 자동으로 얼굴을 복원하여 자연스러운 결과를 제공합니다",
    technicalDetails:
      "Two-stage AI processing: IDM-VTON for virtual try-on + Face Swap for natural face restoration (7 credits total)",
    useCases: [
      "구매 전 가상 피팅",
      "다양한 스타일 시도",
      "자연스러운 얼굴 복원",
    ],
    beforeImage: "https://assets.savemybias.com/ai-examples/virtual-lookbook-before-v2.png",
    afterImage: "https://assets.savemybias.com/ai-examples/virtual-lookbook-after-v2.png",
    icon: <Shirt className="w-6 h-6" />,
    color: "from-cyan-400 to-teal-500",
  },
];

function AIModelCard({ model }: { model: AIModel }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 bg-gradient-to-br ${model.color} rounded-xl text-white`}
          >
            {model.icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{model.name}</h3>
            <p className="text-white/70 text-sm">{model.modelName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-white">{model.credits}</div>
          <div className="text-xs text-white/70">
            {t("aiProducts.credits", "Credits")}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-white text-base mb-4">{model.description}</p>
      <p className="text-white/60 text-sm mb-6 font-mono">
        {model.technicalDetails}
      </p>

      {/* Before/After Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative group">
          <img
            src={model.beforeImage}
            alt={`${model.name} Before`}
            className="w-full rounded-xl shadow-lg aspect-square object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-semibold">
            Before
          </div>
        </div>
        <div className="relative group">
          <img
            src={model.afterImage}
            alt={`${model.name} After`}
            className="w-full rounded-xl shadow-lg aspect-square object-cover ring-2 ring-white/30"
          />
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
            After
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="mb-6">
        <h4 className="text-white font-semibold mb-3">
          {t("aiProducts.useCases", "주요 사용 사례")}
        </h4>
        <ul className="space-y-2">
          {model.useCases.map((useCase, idx) => (
            <li key={idx} className="flex items-center gap-2 text-white/80">
              <ArrowRight className="w-4 h-4 text-green-400" />
              <span className="text-sm">{useCase}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AIProducts() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 py-4 px-2 sm:py-6 sm:px-4 lg:py-8 lg:px-6">
      {/* Back button */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white transition-all duration-200 border rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.back", "Back")}</span>
        </Link>
      </div>

      {/* Header */}
      <header className="text-center mb-12 pt-16 sm:pt-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.25)] tracking-tight">
          {t("aiProducts.title", "AI 상품 소개")}
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
          {t(
            "aiProducts.subtitle",
            "3가지 최첨단 AI 기술로 여러분의 사진을 완벽하게 만들어 드립니다"
          )}
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {models.map((model) => (
            <AIModelCard key={model.id} model={model} />
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t("aiProducts.cta.title", "지금 바로 시작하세요")}
          </h2>
          <p className="text-white/80 mb-6">
            {t(
              "aiProducts.cta.description",
              "크레딧을 구매하고 모든 AI 편집 도구를 사용해보세요"
            )}
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95"
          >
            {t("aiProducts.cta.button", "크레딧 구매하기")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AIProducts;
