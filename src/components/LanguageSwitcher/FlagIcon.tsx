import type { SVGProps, ReactElement } from "react";
import { LanguageCode, type LanguageCodeType } from "../../constants/locales";

interface FlagIconProps extends SVGProps<SVGSVGElement> {
  code: LanguageCodeType;
}

export function FlagIcon({ code, ...props }: FlagIconProps) {
  const flags: Record<LanguageCodeType, ReactElement> = {
    [LanguageCode.EN]: (
      // US Flag (Stars and Stripes simplified)
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <rect width="24" height="24" rx="2" fill="#B22234" />
        <rect y="3" width="24" height="1.5" fill="white" />
        <rect y="6" width="24" height="1.5" fill="white" />
        <rect y="9" width="24" height="1.5" fill="white" />
        <rect y="12" width="24" height="1.5" fill="white" />
        <rect y="15" width="24" height="1.5" fill="white" />
        <rect y="18" width="24" height="1.5" fill="white" />
        <rect y="21" width="24" height="1.5" fill="white" />
        <rect width="10" height="12" fill="#3C3B6E" />
        <circle cx="2.5" cy="2.5" r="0.5" fill="white" />
        <circle cx="5" cy="2.5" r="0.5" fill="white" />
        <circle cx="7.5" cy="2.5" r="0.5" fill="white" />
        <circle cx="2.5" cy="5" r="0.5" fill="white" />
        <circle cx="5" cy="5" r="0.5" fill="white" />
        <circle cx="7.5" cy="5" r="0.5" fill="white" />
        <circle cx="2.5" cy="7.5" r="0.5" fill="white" />
        <circle cx="5" cy="7.5" r="0.5" fill="white" />
        <circle cx="7.5" cy="7.5" r="0.5" fill="white" />
        <circle cx="2.5" cy="10" r="0.5" fill="white" />
        <circle cx="5" cy="10" r="0.5" fill="white" />
        <circle cx="7.5" cy="10" r="0.5" fill="white" />
      </svg>
    ),
    [LanguageCode.KO]: (
      // South Korean Flag (Taegukgi simplified)
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <rect width="24" height="24" rx="2" fill="white" />
        <circle cx="12" cy="12" r="5" fill="#CD2E3A" />
        <path
          d="M12 7 A5 5 0 0 1 12 17 A5 5 0 0 0 12 7"
          fill="#0047A0"
        />
        {/* Simplified trigrams */}
        <g stroke="#000000" strokeWidth="0.8">
          <line x1="17" y1="5" x2="19" y2="5" />
          <line x1="17" y1="6.5" x2="19" y2="6.5" />
          <line x1="17" y1="8" x2="19" y2="8" />
        </g>
      </svg>
    ),
    [LanguageCode.ES]: (
      // Spanish Flag
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <rect width="24" height="24" rx="2" fill="#AA151B" />
        <rect y="6" width="24" height="12" fill="#F1BF00" />
        <circle cx="8" cy="12" r="2" fill="#AA151B" />
      </svg>
    ),
    [LanguageCode.JA]: (
      // Japanese Flag (Hinomaru)
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <rect width="24" height="24" rx="2" fill="white" />
        <circle cx="12" cy="12" r="5" fill="#BC002D" />
      </svg>
    ),
    [LanguageCode.ZH]: (
      // Chinese Flag
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <rect width="24" height="24" rx="2" fill="#DE2910" />
        <path
          d="M6 6 L6.5 7.5 L8 7.5 L6.8 8.5 L7.2 10 L6 9 L4.8 10 L5.2 8.5 L4 7.5 L5.5 7.5 Z"
          fill="#FFDE00"
        />
        <path
          d="M10 4 L10.3 4.8 L11 4.5 L10.7 5.3 L11.5 5.5 L10.7 5.7 L11 6.5 L10.3 6.2 L10 7 L9.7 6.2 Z"
          fill="#FFDE00"
        />
        <path
          d="M11.5 8 L11.8 8.8 L12.5 8.5 L12.2 9.3 L13 9.5 L12.2 9.7 L12.5 10.5 L11.8 10.2 L11.5 11 L11.2 10.2 Z"
          fill="#FFDE00"
        />
      </svg>
    ),
  };

  return flags[code];
}

export default FlagIcon;
