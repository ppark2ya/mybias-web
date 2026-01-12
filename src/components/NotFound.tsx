import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import Footer from "./Footer";
import { Home, TriangleAlert } from "lucide-react";

export function NotFound() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 sm:p-12 border border-white/20 shadow-2xl max-w-lg w-full flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
                        <TriangleAlert className="w-10 h-10 text-yellow-300" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 drop-shadow-md">
                        404
                    </h1>

                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                        {t("404.title", "Page Not Found")}
                    </h2>

                    <p className="text-white/90 text-lg mb-8">
                        {t("404.subtitle", "The page you are looking for does not exist.")}
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                    >
                        <Home className="w-5 h-5" />
                        {t("404.backToHome", "Back to Home")}
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default NotFound;
