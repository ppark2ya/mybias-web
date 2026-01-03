import { useEffect, useRef } from "react";
import { Copy, Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trackEvent, EventCategory } from "../../utils/analytics";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

type SharePlatform =
  | "twitter"
  | "threads"
  | "kakaotalk"
  | "telegram"
  | "copy"
  | "download";

interface ShareOption {
  id: SharePlatform;
  name: string;
  color: string;
  hoverColor: string;
  icon: React.ReactNode;
}

// ShareOptions will be defined inside component to use t() function

export function ShareModal({ isOpen, onClose, imageUrl }: ShareModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = t("share.message");

  const shareOptions: ShareOption[] = [
    {
      id: "twitter",
      name: "X",
      color: "bg-black",
      hoverColor: "hover:bg-zinc-800",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: "threads",
      name: "Threads",
      color: "bg-black",
      hoverColor: "hover:bg-zinc-800",
      icon: (
        <svg viewBox="0 0 192 192" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
          <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.6 96c.208-24.682 5.636-43.966 16.128-57.317 11.214-14.258 28.466-21.573 51.275-21.742 22.996.173 40.526 7.557 52.128 21.958 5.673 7.034 9.908 15.632 12.627 25.471l16.168-4.276c-3.253-11.787-8.551-22.166-15.857-31.009C147.479 11.141 125.907 2.07 97.003 1.875h-.135C68.029 2.07 46.741 11.142 32.394 29.085 16.873 48.452 9.035 75.467 8.8 96c.235 20.533 8.073 47.548 23.594 66.915 14.347 17.943 35.635 27.015 64.469 27.21h.135c24.685-.169 41.985-6.711 56.138-21.227 18.026-18.49 17.466-41.577 11.206-56.158-4.5-10.481-13.417-18.978-25.805-24.752Zm-45.104 38.055c-10.442.574-21.3-4.108-22.083-14.797-.575-7.84 5.29-16.576 22.474-17.567 1.969-.113 3.893-.17 5.775-.17 6.239 0 12.063.59 17.371 1.749-1.975 22.385-13.508 30.191-23.537 30.785Z" />
        </svg>
      ),
    },
    {
      id: "kakaotalk",
      name: t("share.kakaotalk"),
      color: "bg-[#FEE500]",
      hoverColor: "hover:bg-[#F5DC00]",
      icon: (
        <svg viewBox="0 0 24 24" fill="#000000" className="w-5 h-5 sm:w-6 sm:h-6">
          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184-.526 0-1.044-.027-1.553-.079l-4.3 2.86c-.398.263-.618.165-.485-.303l.732-3.014c-2.755-1.481-4.394-3.996-4.394-6.648C2 6.664 6.201 3 12 3z" />
        </svg>
      ),
    },
    {
      id: "telegram",
      name: "Telegram",
      color: "bg-[#26A5E4]",
      hoverColor: "hover:bg-[#1E96D1]",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
    },
    {
      id: "copy",
      name: t("share.copyLink"),
      color: "bg-gray-100",
      hoverColor: "hover:bg-gray-200",
      icon: <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />,
    },
    {
      id: "download",
      name: t("share.saveImage"),
      color: "bg-gray-100",
      hoverColor: "hover:bg-gray-200",
      icon: <Download className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />,
    },
  ];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleShare = async (platform: SharePlatform) => {
    trackEvent({
      category: EventCategory.NAVIGATION,
      action: "share_click" as "editor_open",
      label: platform,
    });

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank",
          "width=550,height=420"
        );
        break;

      case "threads":
        window.open(
          `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
          "_blank",
          "width=550,height=420"
        );
        break;

      case "kakaotalk": {
        const kakaoWindow = window as unknown as {
          Kakao?: {
            Share?: { sendDefault: (config: object) => void };
            isInitialized?: () => boolean;
          };
        };
        if (kakaoWindow.Kakao?.Share) {
          // Kakao SDK가 초기화되어 있으면 공유 API 사용
          kakaoWindow.Kakao.Share.sendDefault({
            objectType: "feed",
            content: {
              title: t("home.title"),
              description: shareText,
              imageUrl: imageUrl,
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
            buttons: [
              {
                title: t("share.viewOnWeb"),
                link: {
                  mobileWebUrl: shareUrl,
                  webUrl: shareUrl,
                },
              },
            ],
          });
        } else {
          // SDK 없을 때: 모바일은 앱 스킴, 데스크탑은 안내 메시지
          const isMobile = /iPhone|iPad|iPod|Android/i.test(
            navigator.userAgent
          );
          if (isMobile) {
            // 모바일: 클립보드에 복사 후 카카오톡 앱 열기 시도
            try {
              await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
              toast.info(t("share.linkCopiedKakao"));
              // 카카오톡 앱 열기 시도
              window.open("kakaotalk://", "_self");
            } catch {
              toast.info(t("share.shareFromKakaoApp"));
            }
          } else {
            // 데스크탑: 링크 복사 안내
            try {
              await navigator.clipboard.writeText(shareUrl);
              toast.info(t("share.linkCopiedKakao"));
            } catch {
              toast.error(t("share.copyFailed"));
            }
          }
        }
        break;
      }

      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
          "_blank",
          "width=550,height=420"
        );
        break;

      case "copy":
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.info(t("share.linkCopied"));
        } catch {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          navigator.clipboard.writeText(shareUrl);
          document.body.removeChild(textArea);
          toast.info(t("share.linkCopied"));
        }
        break;

      case "download": {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `mybias-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      }
    }

    if (platform !== "copy") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center duration-200 sm:items-center bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={handleBackdropClick}
    >
      {/* Bottom Sheet / Modal */}
      <div
        ref={modalRef}
        className="
          w-full sm:w-auto sm:min-w-[360px] sm:max-w-[420px]
          bg-white
          rounded-t-3xl sm:rounded-3xl
          shadow-2xl
          animate-in slide-in-from-bottom duration-300 sm:zoom-in-95 sm:slide-in-from-bottom-0
          overflow-hidden
        "
      >
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-3 sm:pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
              {t("share.title")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 transition-colors rounded-full hover:text-gray-600 hover:bg-gray-100"
              type="button"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share Options Grid */}
        <div className="px-6 pb-6 sm:pb-8">
          <div className="grid grid-cols-4 gap-4">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleShare(option.id)}
                className="flex flex-col items-center gap-2 group"
                type="button"
              >
                <div
                  className={`
                    w-14 h-14 sm:w-16 sm:h-16
                    flex items-center justify-center
                    rounded-2xl
                    ${option.color} ${option.hoverColor}
                    ${option.id === "kakaotalk" ? "text-[#3C1E1E]" : "text-white"}
                    transition-all duration-200
                    group-hover:scale-110 group-hover:shadow-lg
                    group-active:scale-95
                  `}
                >
                  {option.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 sm:text-sm">
                  {option.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom sm:hidden" />
      </div>
    </div>
  );
}

export default ShareModal;
