import { useTranslation } from "react-i18next";

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function EmailInput({
  value,
  onChange,
  disabled,
  onKeyDown,
}: EmailInputProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label
        htmlFor="email"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {t("login.emailLabel")}
      </label>
      <input
        id="email"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("login.emailPlaceholder")}
        disabled={disabled}
        onKeyDown={onKeyDown}
        className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}
