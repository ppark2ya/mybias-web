import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { User, LogIn, UserCircle } from "lucide-react";

export function UserAvatar() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // TODO: Replace with actual auth state management
  const isLoggedIn = false;
  const userName = "User";

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

  // If not logged in, show login button
  if (!isLoggedIn) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 px-2 py-1 text-sm text-white transition-all duration-200 border rounded-lg sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 sm:rounded-xl sm:text-base hover:scale-105 active:scale-95"
        aria-label={t("user.login")}
      >
        <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">{t("user.login")}</span>
      </Link>
    );
  }

  // If logged in, show avatar with dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 text-sm text-white transition-all duration-200 border rounded-lg sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 sm:rounded-xl sm:text-base hover:scale-105 active:scale-95"
        type="button"
        aria-label={t("user.menu")}
      >
        <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-white/20 rounded-full">
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span className="hidden sm:inline">{userName}</span>
      </button>

      {isOpen && (
        <div
          className="
          absolute top-full right-0 mt-2
          bg-white rounded-lg sm:rounded-xl
          shadow-lg border border-gray-200
          overflow-hidden
          min-w-[180px]
          z-50
          animate-in fade-in slide-in-from-top-2 duration-200
        "
        >
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="
              w-full flex items-center gap-3 px-4 py-3
              text-left text-sm text-gray-700
              transition-colors duration-150
              hover:bg-gray-50
            "
          >
            <UserCircle className="w-4 h-4" />
            <span>{t("user.profile")}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              // TODO: Implement logout logic
            }}
            className="
              w-full flex items-center gap-3 px-4 py-3
              text-left text-sm text-red-600
              transition-colors duration-150
              hover:bg-red-50
            "
          >
            <LogIn className="w-4 h-4" />
            <span>{t("user.logout")}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default UserAvatar;
