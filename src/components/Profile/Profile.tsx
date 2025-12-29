import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";

export function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isLoading, signOut } = useAuth();

  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const userEmail = user?.email || profile?.email;
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleCharge = () => {
    // TODO: Implement charge/payment flow
    console.log("Charge button clicked");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 py-4 px-2 sm:py-6 sm:px-4 lg:py-8 lg:px-6">
      {/* Back Button */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white transition-all duration-200 border rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t("profile.backToHome")}</span>
        </Link>
      </div>

      {/* Profile Card */}
      <div className="max-w-md mx-auto pt-16 sm:pt-20">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="relative h-24 sm:h-32 bg-gradient-to-r from-fuchsia-500 to-purple-600">
            <div className="absolute -bottom-12 sm:-bottom-14 left-1/2 transform -translate-x-1/2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-14 sm:pt-16 pb-6 px-6">
            {/* User Name */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {userName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{t("profile.title")}</p>
            </div>

            {/* User Info Cards */}
            <div className="space-y-3 mb-6">
              {/* Email */}
              {userEmail && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{t("profile.email")}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>
              )}

              {/* Member Since */}
              {createdAt && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                    <Calendar className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">
                      {t("profile.memberSince")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {createdAt}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Usage - Placeholder for future */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-fuchsia-50 to-purple-50 rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                  <Sparkles className="w-5 h-5 text-fuchsia-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    {t("profile.aiCredits")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {t("profile.creditsRemaining", { count: 3 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Charge Button */}
              <button
                onClick={handleCharge}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 transition-all shadow-lg shadow-fuchsia-500/25"
                type="button"
              >
                <CreditCard className="w-5 h-5" />
                {t("profile.charge")}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                type="button"
              >
                <LogOut className="w-4 h-4" />
                {t("user.logout")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
