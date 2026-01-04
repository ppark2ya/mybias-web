import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";

const SUPPORT_EMAIL = "support@savemybias.com";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright & Contact */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <p className="text-gray-400 text-sm">
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

          {/* Legal Links */}
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/terms"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t("footer.privacy")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
