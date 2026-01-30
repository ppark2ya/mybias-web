import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SocialButton } from "./SocialButton";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { trackLoginStart, trackLoginSuccess } from "../../utils/analytics";

type AuthMode = "select" | "login" | "signup" | "magiclink";

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    signInWithGoogle,
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
    isAuthenticated,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    trackLoginStart("google");
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
    // If no error, user will be redirected to Google OAuth
  };

  const handleEmailContinue = async () => {
    if (!email) {
      toast.error(t("login.enterEmail"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("login.invalidEmail"));
      return;
    }

    setIsLoading(true);
    trackLoginStart("email");
    const { error } = await signInWithEmail(email);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setEmailSent(true);
    toast.success(t("login.emailSent"));
  };

  const handlePasswordLogin = async () => {
    if (!email) {
      toast.error(t("login.enterEmail"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("login.invalidEmail"));
      return;
    }

    if (!password) {
      toast.error(t("login.enterPassword"));
      return;
    }

    setIsLoading(true);
    trackLoginStart("password");
    const { error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Login successful - track and redirect to home
    trackLoginSuccess("password");
    navigate({ to: "/" });
  };

  const handleSignUp = async () => {
    if (!email) {
      toast.error(t("login.enterEmail"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("login.invalidEmail"));
      return;
    }

    if (!password) {
      toast.error(t("login.enterPassword"));
      return;
    }

    if (password.length < 6) {
      toast.error(t("login.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("login.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    trackLoginStart("signup");
    const { error } = await signUpWithPassword(email, password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setEmailSent(true);
    toast.success(t("login.signupEmailSent"));
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setEmailSent(false);
    setAuthMode("select");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Back to Home Link */}
      <Link
        to="/"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm sm:text-base font-medium">{t("login.backToHome")}</span>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {t("login.title")}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            {t("login.subtitle")}
          </p>
        </div>

        {/* Email Sent Confirmation */}
        {emailSent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("login.checkEmail")}
            </h3>
            <p className="text-gray-600 mb-6">
              {authMode === "signup"
                ? t("login.signupEmailSentDescription", { email })
                : t("login.emailSentDescription", { email })}
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {t("login.tryAnotherMethod")}
            </button>
          </div>
        ) : authMode === "select" ? (
          /* Social Login Buttons */
          <div className="space-y-3 mb-6">
            <SocialButton
              provider="google"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("login.continueWithGoogle")
              )}
            </SocialButton>
          </div>
        ) : authMode === "magiclink" ? (
          /* Magic Link Email Form */
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("login.emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.emailPlaceholder")}
              disabled={isLoading}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleEmailContinue();
                }
              }}
            />
          </div>
        ) : (
          /* Email/Password Login or Signup Form */
          <div className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("login.emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                disabled={isLoading}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading && authMode === "login") {
                      handlePasswordLogin();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            {authMode === "signup" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("login.confirmPasswordLabel")}
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("login.confirmPasswordPlaceholder")}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading) {
                      handleSignUp();
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Divider - hide when email sent */}
        {!emailSent && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                {t("login.or")}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons - hide when email sent */}
        {!emailSent && authMode === "select" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.loginWithEmail")}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-purple-600 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.createAccount")}
            </button>
          </div>
        )}

        {!emailSent && authMode === "magiclink" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleEmailContinue}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("login.sending")}
                </>
              ) : (
                t("login.sendMagicLink")
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.back")}
            </button>
          </div>
        )}

        {!emailSent && authMode === "login" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handlePasswordLogin}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("login.loggingIn")}
                </>
              ) : (
                t("login.loginButton")
              )}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("magiclink")}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-purple-600 hover:text-purple-700 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.forgotPassword")}
            </button>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
              <span>{t("login.noAccount")}</span>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                disabled={isLoading}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {t("login.signupLink")}
              </button>
            </div>
            <button
              type="button"
              onClick={resetForm}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.back")}
            </button>
          </div>
        )}

        {!emailSent && authMode === "signup" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("login.signingUp")}
                </>
              ) : (
                t("login.signupButton")
              )}
            </button>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
              <span>{t("login.haveAccount")}</span>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                disabled={isLoading}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {t("login.loginLink")}
              </button>
            </div>
            <button
              type="button"
              onClick={resetForm}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.back")}
            </button>
          </div>
        )}

        {/* Terms & Privacy */}
        <p className="mt-8 text-xs sm:text-sm text-center text-gray-500 leading-relaxed">
          {t("login.termsText")}{" "}
          <Link
            to="/terms"
            className="text-purple-600 hover:text-purple-700 underline"
          >
            {t("login.termsLink")}
          </Link>{" "}
          {t("login.and")}{" "}
          <Link
            to="/privacy"
            className="text-purple-600 hover:text-purple-700 underline"
          >
            {t("login.privacyLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
