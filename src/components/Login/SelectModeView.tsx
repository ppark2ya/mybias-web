import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { SocialButton } from "./SocialButton";
import { Divider } from "./Divider";
import type { AuthMode } from "./types";

interface SelectModeViewProps {
  isLoading: boolean;
  onGoogleLogin: () => void;
  onSelectMode: (mode: AuthMode) => void;
}

export function SelectModeView({
  isLoading,
  onGoogleLogin,
  onSelectMode,
}: SelectModeViewProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-3 mb-6">
        <SocialButton
          provider="google"
          onClick={onGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t("login.continueWithGoogle")
          )}
        </SocialButton>
      </div>

      <Divider />

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSelectMode("login")}
          disabled={isLoading}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("login.loginWithEmail")}
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("signup")}
          disabled={isLoading}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-purple-600 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("login.createAccount")}
        </button>
      </div>
    </>
  );
}
