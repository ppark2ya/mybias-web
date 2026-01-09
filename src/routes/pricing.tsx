import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Check, ArrowLeft, Sparkles, Zap, Crown, Star } from "lucide-react";
import Footer from "../components/Footer";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
});

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  credits: string;
  icon: React.ReactNode;
  popular?: boolean;
  buttonText: string;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started with basic features",
    credits: "10 credits/month",
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      "10 AI credits per month",
      "Basic image editing",
      "Standard quality output",
      "Community support",
    ],
    buttonText: "Get Started",
  },
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "Perfect for casual users",
    credits: "100 credits/month",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "100 AI credits per month",
      "All editing tools",
      "High quality output",
      "Email support",
      "No watermark",
    ],
    buttonText: "Subscribe",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Best for professionals",
    credits: "500 credits/month",
    icon: <Star className="w-6 h-6" />,
    popular: true,
    features: [
      "500 AI credits per month",
      "All editing tools",
      "Ultra high quality output",
      "Priority support",
      "No watermark",
      "API access",
    ],
    buttonText: "Subscribe",
  },
  {
    name: "Master",
    price: "$99",
    period: "/month",
    description: "For teams and enterprises",
    credits: "Unlimited credits",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "Unlimited AI credits",
      "All editing tools",
      "Maximum quality output",
      "24/7 dedicated support",
      "No watermark",
      "API access",
      "Custom integrations",
      "Team management",
    ],
    buttonText: "Contact Sales",
  },
];

function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <div
      className={`
        relative flex flex-col p-6 bg-white rounded-2xl shadow-lg
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1
        ${plan.popular ? "ring-2 ring-purple-500 scale-105" : ""}
      `}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div
          className={`
            p-2 rounded-xl
            ${plan.popular ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"}
          `}
        >
          {plan.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
      </div>

      <div className="mb-4">
        <span className="text-4xl font-extrabold text-gray-900">
          {plan.price}
        </span>
        <span className="text-gray-500">{plan.period}</span>
      </div>

      <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
      <p className="text-sm font-semibold text-purple-600 mb-6">
        {plan.credits}
      </p>

      <ul className="space-y-3 mb-8 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`
          w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200
          ${
            plan.popular
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
          {t("pricing.title", "Choose Your Plan")}
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
          {t(
            "pricing.subtitle",
            "Unlock the full power of AI image editing with our flexible pricing plans"
          )}
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/80 text-sm">
            {t(
              "pricing.guarantee",
              "All plans include a 7-day money-back guarantee. No questions asked."
            )}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Pricing;
