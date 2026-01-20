import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronDown, Sparkles, ImageUp, Eraser, Shirt, Coins } from "lucide-react";
import UserMenu from "../UserMenu";
import { useAuth } from "../../hooks/useAuth";

interface HeaderProps {
  variant?: "default" | "minimal";
}

export function Header({ variant = "default" }: HeaderProps) {
  const { t } = useTranslation();
  const { isAuthenticated, profile } = useAuth();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsToolsOpen(false);
      }
    };

    if (isToolsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isToolsOpen]);

  const aiTools = [
    {
      name: t("nav.tools.upscale", "AI Upscale"),
      description: t("nav.tools.upscaleDesc", "Enhance image quality"),
      icon: ImageUp,
      href: "/#upscale",
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      name: t("nav.tools.eraser", "Magic Eraser"),
      description: t("nav.tools.eraserDesc", "Remove unwanted objects"),
      icon: Eraser,
      href: "/#eraser",
      color: "text-rose-500",
      bgColor: "bg-rose-50",
    },
    {
      name: t("nav.tools.lookbook", "AI Lookbook"),
      description: t("nav.tools.lookbookDesc", "Virtual try-on"),
      icon: Shirt,
      href: "/ai-lookbook",
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
      isNew: true,
    },
  ];

  if (variant === "minimal") {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
            MyBias
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white transition-all duration-200 border rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:scale-105 active:scale-95"
            >
              <Coins className="w-4 h-4 text-yellow-300" />
              {isAuthenticated && profile?.credits !== undefined ? (
                <span className="font-bold">{profile.credits}</span>
              ) : (
                <span className="hidden sm:inline">{t("nav.credits", "Credits")}</span>
              )}
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg hover:scale-105 transition-transform">
          MyBias
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {/* AI Tools Dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10 ${isToolsOpen ? "bg-white/10" : ""}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t("nav.aiTools", "AI Tools")}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isToolsOpen ? "rotate-180" : ""}`} />
            </button>

            {isToolsOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {aiTools.map((tool) => (
                  <Link
                    key={tool.name}
                    to={tool.href}
                    onClick={() => setIsToolsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                      <tool.icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                        {tool.isNew && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{tool.description}</span>
                    </div>
                  </Link>
                ))}
                <div className="border-t border-gray-100">
                  <Link
                    to="/ai-products"
                    onClick={() => setIsToolsOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-fuchsia-600 hover:bg-fuchsia-50 transition-colors"
                  >
                    {t("nav.viewAllProducts", "View all AI products")}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Link */}
          <Link
            to="/pricing"
            className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            {t("nav.pricing", "Pricing")}
          </Link>
        </nav>

        {/* Right Side - Credits & User Menu */}
        <div className="flex items-center gap-2">
          {/* Credits Button */}
          <Link
            to="/pricing"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white transition-all duration-200 border rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:scale-105 active:scale-95"
          >
            <Coins className="w-4 h-4 text-yellow-300" />
            {isAuthenticated && profile?.credits !== undefined ? (
              <span className="font-bold">{profile.credits}</span>
            ) : (
              <span className="hidden sm:inline">{t("nav.credits", "Credits")}</span>
            )}
          </Link>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile Navigation - Bottom Sheet Style */}
      <nav className="md:hidden mt-3 flex items-center justify-center gap-1 overflow-x-auto pb-1 -mx-4 px-4">
        {aiTools.map((tool) => (
          <Link
            key={tool.name}
            to={tool.href}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:text-white whitespace-nowrap rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <tool.icon className="w-3.5 h-3.5" />
            <span>{tool.name}</span>
            {tool.isNew && (
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export default Header;
