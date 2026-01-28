import { useTranslation } from "react-i18next";
import type { AuthMode } from "./types";

interface EmailSentViewProps {
  email: string;
  authMode: AuthMode;
  onReset: () => void;
}

export function EmailSentView({ email, authMode, onReset }: EmailSentViewProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {t("login.checkEmail")}
      </h3>
      <p className="text-gray-600 mb-6">
        {authMode === "signup"
          ? t("login.signupEmailSentDescription", { email })
          : t("login.emailSentDescription", { email })}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-purple-600 hover:text-purple-700 font-medium"
      >
        {t("login.tryAnotherMethod")}
      </button>
    </div>
  );
}
