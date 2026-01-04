import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Mail, Coffee } from "lucide-react";

const SUPPORT_EMAIL = "support@savemybias.com";
const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/savemybias";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-gray-900/80 backdrop-blur-sm border-white/10">
      <div className="max-w-4xl px-4 py-6 mx-auto sm:py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Copyright & Contact */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="text-sm text-gray-400">
              © {currentYear} MyBias. {t("footer.rights")}
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>{SUPPORT_EMAIL}</span>
            </a>
          </div>

          {/* Legal Links & Support */}
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link
                to="/terms"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                {t("footer.terms")}
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                {t("footer.privacy")}
              </Link>
            </nav>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all"
            >
              <span>Support Server Cost</span>
              <Coffee className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
