import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SocialButton } from "./SocialButton";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isEmailMode, setIsEmailMode] = useState(false);

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement actual OAuth login logic
    toast.info(`${provider} ${t("login.comingSoon")}`);
  };

  const handleEmailContinue = () => {
    if (!email) {
      toast.error(t("login.enterEmail"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("login.invalidEmail"));
      return;
    }

    // TODO: Implement email login logic
    toast.info(t("login.comingSoon"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Back to Home Link */}
      <Link
        to="/"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm sm:text-base font-medium">{t("login.backToHome")}</span>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {t("login.title")}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Social Login Buttons */}
        {!isEmailMode ? (
          <div className="space-y-3 mb-6">
            <SocialButton
              provider="google"
              onClick={() => handleSocialLogin("Google")}
            >
              {t("login.continueWithGoogle")}
            </SocialButton>

            <SocialButton
              provider="apple"
              onClick={() => handleSocialLogin("Apple")}
            >
              {t("login.continueWithApple")}
            </SocialButton>

            <SocialButton
              provider="kakao"
              onClick={() => handleSocialLogin("Kakao")}
            >
              {t("login.continueWithKakao")}
            </SocialButton>
          </div>
        ) : (
          /* Email Login Form */
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("login.emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.emailPlaceholder")}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEmailContinue();
                }
              }}
            />
          </div>
        )}

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              {t("login.or")}
            </span>
          </div>
        </div>

        {/* Email Login Toggle / Continue Button */}
        {!isEmailMode ? (
          <button
            type="button"
            onClick={() => setIsEmailMode(true)}
            className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-purple-600 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            {t("login.continueWithEmail")}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleEmailContinue}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {t("login.continue")}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEmailMode(false);
                setEmail("");
              }}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              {t("login.back")}
            </button>
          </div>
        )}

        {/* Terms & Privacy */}
        <p className="mt-8 text-xs sm:text-sm text-center text-gray-500 leading-relaxed">
          {t("login.termsText")}{" "}
          <Link
            to="/terms"
            className="text-purple-600 hover:text-purple-700 underline"
          >
            {t("login.termsLink")}
          </Link>{" "}
          {t("login.and")}{" "}
          <Link
            to="/privacy"
            className="text-purple-600 hover:text-purple-700 underline"
          >
            {t("login.privacyLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
