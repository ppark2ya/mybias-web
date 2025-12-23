import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { FlagIcon } from "./FlagIcon";

const languages = [
  { code: "en" as const, name: "English" },
  { code: "ko" as const, name: "한국어" },
  { code: "es" as const, name: "Español" },
  { code: "ja" as const, name: "日本語" },
  { code: "zh" as const, name: "中文" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 text-sm text-white transition-all duration-200 border rounded-lg sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 sm:rounded-xl sm:text-base hover:scale-105 active:scale-95"
        type="button"
        aria-label="Change language"
      >
        <FlagIcon code={currentLanguage.code} className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="
          absolute top-full right-0 mt-2
          bg-white rounded-lg sm:rounded-xl
          shadow-lg border border-gray-200
          overflow-hidden
          min-w-[160px]
          z-50
          animate-in fade-in slide-in-from-top-2 duration-200
        "
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`
                w-full flex items-center gap-3 px-4 py-3
                text-left text-sm
                transition-colors duration-150
                ${
                  i18n.language === lang.code
                    ? "bg-fuchsia-50 text-fuchsia-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }
              `}
              type="button"
            >
              <FlagIcon code={lang.code} className="w-5 h-5" />
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
