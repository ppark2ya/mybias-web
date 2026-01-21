import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Check,
  ArrowLeft,
  Sparkles,
  Zap,
  Star,
  Flame,
  Crown,
  ChevronDown,
  ChevronUp,
  ImageUp,
  Eraser,
  Shirt,
} from "lucide-react";
import Footer from "../components/Footer";
import { useAuth } from "../hooks/useAuth";

// Lemon Squeezy Store URL
const LEMONSQUEEZY_STORE = "https://savemybias.lemonsqueezy.com";

// Variant IDs for each plan (to be configured in Lemon Squeezy)
const PLAN_VARIANT_IDS: Record<string, string> = {
  tiny: "a92ae8c9-945a-4bff-bcc3-cb7600e9e51d", // TODO: Replace with actual variant ID
  basic: "a92ae8c9-945a-4bff-bcc3-cb7600e9e51d", // TODO: Replace with actual variant ID
  pro: "a92ae8c9-945a-4bff-bcc3-cb7600e9e51d", // TODO: Replace with actual variant ID
  ultra: "a92ae8c9-945a-4bff-bcc3-cb7600e9e51d", // TODO: Replace with actual variant ID
  master: "a92ae8c9-945a-4bff-bcc3-cb7600e9e51d", // TODO: Replace with actual variant ID
};

export const Route = createFileRoute("/pricing")({
  component: Pricing,
});

interface PricingPlan {
  id: string;
  name: string;
  concept: string;
  price: string;
  credits: number;
  pricePerCredit: string;
  description: string;
  targetPsychology: string;
  icon: React.ReactNode;
  popular?: boolean;
  bonus?: string;
  buttonText: string;
  tier: "hidden" | "main";
}

const plans: PricingPlan[] = [
  {
    id: "tiny",
    name: "Tiny",
    concept: "Try it out",
    price: "$3.90",
    credits: 20,
    pricePerCredit: "$0.195",
    description: "Perfect for testing the waters",
    targetPsychology: "Just want to try 5 photos first",
    icon: <Sparkles className="w-6 h-6" />,
    buttonText: "Get Started",
    tier: "hidden",
  },
  {
    id: "basic",
    name: "Basic",
    concept: "Light User",
    price: "$9.90",
    credits: 60,
    pricePerCredit: "$0.165",
    description: "Great for occasional use",
    targetPsychology: "Got a few concert photos to enhance",
    icon: <Zap className="w-6 h-6" />,
    buttonText: "Buy Credits",
    tier: "main",
  },
  {
    id: "pro",
    name: "Pro",
    concept: "Best Value",
    price: "$19.90",
    credits: 150,
    pricePerCredit: "$0.132",
    description: "Most popular choice",
    targetPsychology: "Might as well stock up",
    icon: <Star className="w-6 h-6" />,
    popular: true,
    bonus: "+10% Bonus",
    buttonText: "Buy Credits",
    tier: "main",
  },
  {
    id: "ultra",
    name: "Ultra",
    concept: "Power User",
    price: "$49.90",
    credits: 450,
    pricePerCredit: "$0.110",
    description: "For dedicated fans",
    targetPsychology: "This comeback season, I'm enhancing everything",
    icon: <Flame className="w-6 h-6" />,
    buttonText: "Buy Credits",
    tier: "main",
  },
  {
    id: "master",
    name: "Master",
    concept: "Professional",
    price: "$99.90",
    credits: 1000,
    pricePerCredit: "$0.099",
    description: "For professionals & group buys",
    targetPsychology: "Running group orders or professional editing",
    icon: <Crown className="w-6 h-6" />,
    buttonText: "Buy Credits",
    tier: "hidden",
  },
];

function PricingCard({
  plan,
  isCompact = false,
  onBuy,
}: {
  plan: PricingPlan;
  isCompact?: boolean;
  onBuy: (planId: string) => void;
}) {
  const isPro = plan.popular;

  return (
    <div
      className={`
        relative flex flex-col bg-white rounded-2xl shadow-lg
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        ${isPro ? "ring-2 ring-purple-500 lg:scale-110 z-10" : ""}
        ${isCompact ? "p-4" : "p-6"}
      `}
    >
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full whitespace-nowrap">
            MOST POPULAR
          </span>
        </div>
      )}

      {plan.bonus && (
        <div className="absolute -top-2 -right-2">
          <span className="px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg">
            {plan.bonus}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div
          className={`
            p-2 rounded-xl
            ${isPro ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"}
          `}
        >
          {plan.icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          <p className="text-xs text-gray-500">{plan.concept}</p>
        </div>
      </div>

      <div className="mb-2">
        <span className="text-4xl font-extrabold text-gray-900">
          {plan.price}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-lg font-semibold text-purple-600">
          {plan.credits} Credits
        </p>
        <p className="text-xs text-gray-500">
          {plan.pricePerCredit} per credit
        </p>
      </div>

      <p className="text-sm text-gray-600 mb-4 flex-grow">{plan.description}</p>

      <ul className={`space-y-2 mb-6 ${isCompact ? "hidden sm:block" : ""}`}>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="text-sm text-gray-600">All AI editing tools</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="text-sm text-gray-600">High quality output</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <span className="text-sm text-gray-600">Credits never expire</span>
        </li>
      </ul>

      <button
        onClick={() => onBuy(plan.id)}
        className={`
          w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200
          ${
            isPro
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          }
        `}
      >
        {plan.buttonText}
      </button>
    </div>
  );
}

export function Pricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showAllPlans, setShowAllPlans] = useState(false);

  const mainPlans = plans.filter((p) => p.tier === "main");
  const hiddenPlans = plans.filter((p) => p.tier === "hidden");
  const tinyPlan = hiddenPlans.find((p) => p.id === "tiny");
  const masterPlan = hiddenPlans.find((p) => p.id === "master");

  const handleBuyCredits = (planId: string) => {
    const variantId = PLAN_VARIANT_IDS[planId];
    if (!variantId) {
      console.error("Unknown plan:", planId);
      return;
    }

    // Build Lemon Squeezy checkout URL
    const checkoutUrl = new URL(
      `${LEMONSQUEEZY_STORE}/checkout/buy/${variantId}`
    );

    // Pass user email and ID as checkout data
    if (user?.email) {
      checkoutUrl.searchParams.set("checkout[email]", user.email);
    }
    if (user?.id) {
      checkoutUrl.searchParams.set("checkout[custom][user_id]", user.id);
    }

    // Open checkout in new tab
    window.open(checkoutUrl.toString(), "_blank");
  };

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

      <header className="text-center mb-8 pt-16 sm:pt-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.25)] tracking-tight">
          {t("pricing.title", "Credit Packs")}
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
          {t(
            "pricing.subtitle",
            "Buy credits once, use them anytime. No subscriptions, no expiration."
          )}
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {/* Main 3 plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center">
          {mainPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} onBuy={handleBuyCredits} />
          ))}
        </div>

        {/* Toggle for hidden plans */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAllPlans(!showAllPlans)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg"
          >
            {showAllPlans ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {t("pricing.showLess", "Show less options")}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {t(
                  "pricing.showMore",
                  "Looking for smaller or larger packs?"
                )}
              </>
            )}
          </button>
        </div>

        {/* Hidden plans (Tiny & Master) */}
        {showAllPlans && tinyPlan && masterPlan && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
            <PricingCard plan={tinyPlan} isCompact onBuy={handleBuyCredits} />
            <PricingCard plan={masterPlan} isCompact onBuy={handleBuyCredits} />
          </div>
        )}

        {/* Credit Usage Guide */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              {t("pricing.usageGuide.title", "Credit Usage Guide")}
            </h2>
            <p className="text-white/70 text-sm text-center mb-6">
              {t(
                "pricing.usageGuide.subtitle",
                "Different AI models use different amounts of credits"
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Standard Upscale */}
              <div className="bg-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-400/20 rounded-lg">
                    <ImageUp className="w-5 h-5 text-yellow-300" />
                  </div>
                  <span className="text-lg font-bold text-white">1 Credit</span>
                </div>
                <h3 className="font-semibold text-white mb-1">
                  {t("pricing.usageGuide.standard.title", "Standard Upscale")}
                </h3>
                <p className="text-xs text-white/70">
                  {t(
                    "pricing.usageGuide.standard.description",
                    "Fast & cost-effective. Perfect for general photos."
                  )}
                </p>
              </div>

              {/* AI Lookbook */}
              <div className="bg-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-cyan-400/20 rounded-lg">
                    <Shirt className="w-5 h-5 text-cyan-300" />
                  </div>
                  <span className="text-lg font-bold text-white">2 Credits</span>
                </div>
                <h3 className="font-semibold text-white mb-1">
                  {t("pricing.usageGuide.lookbook.title", "AI Lookbook")}
                </h3>
                <p className="text-xs text-white/70">
                  {t(
                    "pricing.usageGuide.lookbook.description",
                    "Virtual try-on. See how outfits look on you."
                  )}
                </p>
              </div>

              {/* Magic Eraser */}
              <div className="bg-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-pink-400/20 rounded-lg">
                    <Eraser className="w-5 h-5 text-pink-300" />
                  </div>
                  <span className="text-lg font-bold text-white">2 Credits</span>
                </div>
                <h3 className="font-semibold text-white mb-1">
                  {t("pricing.usageGuide.eraser.title", "Magic Eraser")}
                </h3>
                <p className="text-xs text-white/70">
                  {t(
                    "pricing.usageGuide.eraser.description",
                    "Remove people & distractions from your photos."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-white/90 text-sm font-medium">
            {t("pricing.noSubscription", "One-time purchase. No recurring fees.")}
          </p>
          <p className="text-white/70 text-sm">
            {t(
              "pricing.guarantee",
              "All purchases include a 7-day money-back guarantee. No questions asked."
            )}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Pricing;
