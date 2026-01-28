import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { EmailInput } from "./EmailInput";
import { Divider } from "./Divider";

interface MagicLinkModeViewProps {
  email: string;
  onEmailChange: (email: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function MagicLinkModeView({
  email,
  onEmailChange,
  isLoading,
  onSubmit,
  onBack,
}: MagicLinkModeViewProps) {
  const { t } = useTranslation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      onSubmit();
    }
  };

  return (
    <>
      <div className="mb-6">
        <EmailInput
          value={email}
          onChange={onEmailChange}
          disabled={isLoading}
          onKeyDown={handleKeyDown}
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
              {t("login.sending")}
            </>
          ) : (
            t("login.sendMagicLink")
          )}
        </button>
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
