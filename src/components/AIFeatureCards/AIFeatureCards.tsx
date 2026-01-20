import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ImageUp, Eraser, Shirt, Pencil, Sparkles, Crown, Coins } from "lucide-react";

interface AIFeatureCardsProps {
  onDirectEdit?: () => void;
}

export function AIFeatureCards({ onDirectEdit }: AIFeatureCardsProps) {
  const { t } = useTranslation();

  const features = [
    {
      id: "direct-edit",
      name: t("aiFeatures.directEdit.name", "Direct Edit"),
      description: t("aiFeatures.directEdit.description", "Crop, resize, blur and more"),
      icon: Pencil,
      gradient: "from-gray-500 to-gray-600",
      bgGradient: "from-gray-50 to-slate-50",
      borderColor: "border-gray-200",
      credits: 0,
      href: null,
      onClick: onDirectEdit,
    },
    {
      id: "upscale",
      name: t("aiFeatures.upscale.name", "AI Upscale"),
      description: t("aiFeatures.upscale.description", "Enhance quality & restore faces"),
      icon: ImageUp,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
      credits: 1,
      href: null,
      onClick: onDirectEdit,
    },
    {
      id: "pro-restore",
      name: t("aiFeatures.proRestore.name", "Pro Restore"),
      description: t("aiFeatures.proRestore.description", "Premium dual AI blending"),
      icon: Crown,
      gradient: "from-purple-500 to-indigo-500",
      bgGradient: "from-purple-50 to-indigo-50",
      borderColor: "border-purple-200",
      credits: 3,
      isPro: true,
      href: null,
      onClick: onDirectEdit,
    },
    {
      id: "eraser",
      name: t("aiFeatures.eraser.name", "Magic Eraser"),
      description: t("aiFeatures.eraser.description", "Remove unwanted objects"),
      icon: Eraser,
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-50 to-pink-50",
      borderColor: "border-rose-200",
      credits: 2,
      href: null,
      onClick: onDirectEdit,
    },
    {
      id: "lookbook",
      name: t("aiFeatures.lookbook.name", "AI Lookbook"),
      description: t("aiFeatures.lookbook.description", "Virtual clothing try-on"),
      icon: Shirt,
      gradient: "from-cyan-500 to-teal-500",
      bgGradient: "from-cyan-50 to-teal-50",
      borderColor: "border-cyan-200",
      credits: 2,
      isNew: true,
      href: "/ai-lookbook",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Hero Text */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-sm font-medium text-white">
            {t("aiFeatures.badge", "AI-Powered Photo Tools")}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-lg">
          {t("aiFeatures.title", "What would you like to do?")}
        </h2>
        <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto">
          {t("aiFeatures.subtitle", "Choose a tool to enhance your photos with cutting-edge AI technology")}
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {features.map((feature) => {
          const CardWrapper = feature.href ? Link : "button";
          const cardProps = feature.href
            ? { to: feature.href }
            : { type: "button" as const, onClick: feature.onClick };

          return (
            <CardWrapper
              key={feature.id}
              {...cardProps}
              className="group relative bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`} />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>

                {/* Title with badges */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {feature.name}
                  </h3>
                  {feature.isNew && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full uppercase">
                      New
                    </span>
                  )}
                  {feature.isPro && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 rounded-full uppercase">
                      Pro
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {feature.description}
                </p>

                {/* Credits */}
                <div className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-medium text-gray-600">
                    {feature.credits === 0
                      ? t("aiFeatures.free", "Free")
                      : t("aiFeatures.credits", "{{count}} credits", { count: feature.credits })}
                  </span>
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Or Upload Directly */}
      <div className="text-center mt-8">
        <button
          type="button"
          onClick={onDirectEdit}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-full transition-all hover:scale-105 active:scale-95 border border-white/20"
        >
          <ImageUp className="w-5 h-5" />
          {t("aiFeatures.uploadDirect", "Or upload photos directly")}
        </button>
      </div>
    </div>
  );
}

export default AIFeatureCards;
