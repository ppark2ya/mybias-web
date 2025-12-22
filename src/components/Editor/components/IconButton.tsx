import type { ReactNode } from "react";

interface IconButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  variant?: "default" | "primary" | "close";
  className?: string;
}

export function IconButton({
  onClick,
  disabled = false,
  icon,
  label,
  variant = "default",
  className = "",
}: IconButtonProps) {
  const baseClasses = `
    flex items-center justify-center
    w-8 h-8 sm:w-9 sm:h-9
    rounded-full cursor-pointer
    shadow-lg
    transition-all duration-300 ease-out
    hover:scale-105
    active:scale-95
    disabled:opacity-30 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    default: `
      bg-white/90 backdrop-blur-sm
      border border-gray-200
      shadow-black/5
      hover:bg-slate-100
    `,
    primary: `
      bg-gradient-to-r from-fuchsia-500 to-purple-500
      border border-transparent
      shadow-fuchsia-500/20
      hover:from-fuchsia-600 hover:to-purple-600
      hover:shadow-xl hover:shadow-fuchsia-500/30
    `,
    close: `
      group
      bg-white/90 backdrop-blur-sm
      border border-gray-200
      shadow-black/5
      hover:bg-gray-900 hover:border-gray-900
      hover:shadow-xl hover:shadow-black/10
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      type="button"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
