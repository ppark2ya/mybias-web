import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  labelKey: string;
  placeholderKey: string;
}

export function PasswordInput({
  id,
  value,
  onChange,
  showPassword,
  onToggleShowPassword,
  disabled,
  onKeyDown,
  labelKey,
  placeholderKey,
}: PasswordInputProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {t(labelKey)}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t(placeholderKey)}
          disabled={disabled}
          onKeyDown={onKeyDown}
          className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={onToggleShowPassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
