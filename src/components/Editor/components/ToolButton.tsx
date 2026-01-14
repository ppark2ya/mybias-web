import type { ReactNode } from "react";

interface ToolButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  icon: ReactNode;
  label: string;
  badge?: number;
  variant?: "default" | "ai" | "pro" | "eraser" | "download" | "share";
  className?: string;
}

export function ToolButton({
  onClick,
  disabled = false,
  active = false,
  icon,
  label,
  badge,
  variant = "default",
  className = "",
}: ToolButtonProps) {
  const baseClasses = `
    flex flex-col items-center justify-center gap-0.5 sm:gap-1
    px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-lg
    transition-all duration-200 cursor-pointer
    disabled:cursor-not-allowed disabled:opacity-50
    relative
  `;

  const variantClasses = {
    default: active
      ? "bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-md"
      : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100",
    ai: "bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600",
    pro: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600",
    eraser:
      "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600",
    download:
      "bg-gradient-to-r from-cyan-400 to-teal-400 text-white hover:from-cyan-500 hover:to-teal-500",
    share:
      "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      type="button"
      aria-label={label}
    >
      {icon}
      <span className="text-[10px] sm:text-xs font-semibold">{label}</span>
      {badge !== undefined && (
        <span
          className={`
            absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2
            min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]
            flex items-center justify-center
            text-[10px] sm:text-xs font-bold
            rounded-full
            border-2 border-white
            shadow-sm
            ${
              badge > 0
                ? "bg-gradient-to-r from-emerald-400 to-teal-400 text-white"
                : "bg-gray-400 text-white"
            }
          `}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
