import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

interface ProcessingOverlayProps {
  message?: string;
}

export function ProcessingOverlay({ message }: ProcessingOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-sm">
      {/* Animated sparkle loader */}
      <div className="relative w-20 h-20">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-fuchsia-400 border-r-purple-400 animate-spin" />
        {/* Inner pulsing circle */}
        <div className="absolute rounded-full inset-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 animate-pulse" />
        {/* Center star icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Star className="w-8 h-8 text-white animate-bounce" fill="currentColor" />
        </div>
      </div>
      {/* Message */}
      <div className="text-center">
        <p className="text-lg font-medium text-white animate-pulse">
          {message || t("editor.processing")}
        </p>
        <p className="mt-1 text-sm text-white/60">{t("editor.pleaseWait")}</p>
      </div>
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-2 h-2 rounded-full bg-fuchsia-400/50 top-1/4 left-1/4 animate-ping"
          style={{ animationDuration: "2s" }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/50 top-1/3 right-1/3 animate-ping"
          style={{
            animationDuration: "2.5s",
            animationDelay: "0.5s",
          }}
        />
        <div
          className="absolute w-2 h-2 rounded-full bg-violet-400/50 bottom-1/3 left-1/3 animate-ping"
          style={{ animationDuration: "3s", animationDelay: "1s" }}
        />
        <div
          className="absolute w-1 h-1 rounded-full bg-pink-400/50 bottom-1/4 right-1/4 animate-ping"
          style={{
            animationDuration: "2.2s",
            animationDelay: "0.3s",
          }}
        />
      </div>
    </div>
  );
}
