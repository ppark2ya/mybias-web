import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { EmailInput } from "./EmailInput";
import { PasswordInput } from "./PasswordInput";
import { Divider } from "./Divider";
import type { AuthMode } from "./types";

interface LoginModeViewProps {
  email: string;
  onEmailChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  isLoading: boolean;
  onSubmit: () => void;
  onSelectMode: (mode: AuthMode) => void;
  onBack: () => void;
}

export function LoginModeView({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
  isLoading,
  onSubmit,
  onSelectMode,
  onBack,
}: LoginModeViewProps) {
  const { t } = useTranslation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      onSubmit();
    }
  };

  return (
    <>
      <div className="space-y-4 mb-6">
        <EmailInput
          value={email}
          onChange={onEmailChange}
          disabled={isLoading}
        />
        <PasswordInput
          id="password"
          value={password}
          onChange={onPasswordChange}
          showPassword={showPassword}
          onToggleShowPassword={onToggleShowPassword}
          disabled={isLoading}
          onKeyDown={handleKeyDown}
          labelKey="login.passwordLabel"
          placeholderKey="login.passwordPlaceholder"
        />
      </div>

      <Divider />

      <div className="space-y-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("login.loggingIn")}
            </>
          ) : (
            t("login.loginButton")
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("magiclink")}
          disabled={isLoading}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-purple-600 hover:text-purple-700 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("login.forgotPassword")}
        </button>
        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
          <span>{t("login.noAccount")}</span>
          <button
            type="button"
            onClick={() => onSelectMode("signup")}
            disabled={isLoading}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            {t("login.signupLink")}
          </button>
        </div>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("login.back")}
        </button>
      </div>
    </>
  );
}
