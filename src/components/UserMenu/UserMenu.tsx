import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { User, LogIn, LogOut, UserCircle, ChevronRight, Globe, Check } from "lucide-react";
import { FlagIcon } from "../LanguageSwitcher/FlagIcon";
import { LANGUAGES } from "../../constants/locales";

export function UserMenu() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // TODO: Replace with actual auth state management
  const isLoggedIn = false;
  const userName = "User";

  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowLanguages(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowLanguages(false);
      }
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
    setShowLanguages(false);
    setIsOpen(false);
  };

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setShowLanguages(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button - Always visible */}
      <button
        onClick={handleToggleMenu}
        className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-white transition-all duration-200 border rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:scale-105 active:scale-95"
        type="button"
        aria-label={t("user.menu")}
      >
        {isLoggedIn ? (
          <User className="w-5 h-5" />
        ) : (
          <User className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute top-full right-0 mt-2
            bg-white rounded-xl
            shadow-xl border border-gray-100
            overflow-hidden
            min-w-[200px]
            z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {showLanguages ? (
            /* Language Selection View */
            <>
              <button
                type="button"
                onClick={() => setShowLanguages(false)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-100"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>{t("user.back")}</span>
              </button>
              {LANGUAGES.map((lang) => (
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
                  <span className="flex-1">{lang.name}</span>
                  {i18n.language === lang.code && (
                    <Check className="w-4 h-4 text-fuchsia-600" />
                  )}
                </button>
              ))}
            </>
          ) : (
            /* Main Menu View */
            <>
              {isLoggedIn ? (
                /* Logged In Menu */
                <>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      // TODO: Navigate to profile
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>{t("user.profile")}</span>
                  </button>
                </>
              ) : (
                /* Not Logged In - Login Button */
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t("user.login")}</span>
                </Link>
              )}

              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setShowLanguages(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Globe className="w-4 h-4" />
                <span className="flex-1">{t("user.language")}</span>
                <div className="flex items-center gap-2 text-gray-400">
                  <FlagIcon code={currentLanguage.code} className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {isLoggedIn && (
                /* Logout Button */
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Implement logout
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t("user.logout")}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UserMenu;
