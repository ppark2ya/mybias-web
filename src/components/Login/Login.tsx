import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SocialButton } from "./SocialButton";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { trackLoginStart } from "../../utils/analytics";

type AuthMode = "social" | "email" | "password" | "username";

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithPassword, signInWithPassword, signUpWithUsername, signInWithUsername } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("social");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

  const handlePasswordAuth = async () => {
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

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast.error(t("login.passwordMismatch"));
        return;
      }

      setIsLoading(true);
      trackLoginStart("email");
      const { error } = await signUpWithPassword(email, password);
      setIsLoading(false);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error(t("login.emailAlreadyExists"));
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success(t("login.signUpSuccess"));
      setEmailSent(true);
    } else {
      setIsLoading(true);
      trackLoginStart("email");
      const { error } = await signInWithPassword(email, password);
      setIsLoading(false);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error(t("login.invalidCredentials"));
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success(t("login.loginSuccess"));
      navigate({ to: "/" });
    }
  };

  const handleUsernameAuth = async () => {
    if (!username) {
      toast.error(t("login.enterUsername"));
      return;
    }

    // Validate username format
    if (username.length < 3) {
      toast.error(t("login.usernameTooShort"));
      return;
    }

    if (username.length > 20) {
      toast.error(t("login.usernameTooLong"));
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error(t("login.usernameInvalid"));
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

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast.error(t("login.passwordMismatch"));
        return;
      }

      setIsLoading(true);
      trackLoginStart("username");
      const { error } = await signUpWithUsername(username, password);
      setIsLoading(false);

      if (error) {
        if (error.message.includes("Username already taken")) {
          toast.error(t("login.usernameTaken"));
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success(t("login.signUpSuccess"));
      navigate({ to: "/" });
    } else {
      setIsLoading(true);
      trackLoginStart("username");
      const { error } = await signInWithUsername(username, password);
      setIsLoading(false);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error(t("login.invalidCredentials"));
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success(t("login.loginSuccess"));
      navigate({ to: "/" });
    }
  };

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setAuthMode("social");
    setIsSignUp(false);
    setEmailSent(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
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
              {isSignUp
                ? t("login.signUpEmailSentDescription", { email })
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
        ) : authMode === "social" ? (
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
        ) : authMode === "email" ? (
          /* Email Magic Link Form */
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
        ) : authMode === "username" ? (
          /* Username/Password Form */
          <div className="mb-6 space-y-4">
            {/* Login/Signup Toggle Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  !isSignUp
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("login.loginTab")}
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isSignUp
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("login.signUpTab")}
              </button>
            </div>

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("login.usernameLabel")}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("login.usernamePlaceholder")}
                disabled={isLoading}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="username-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  id="username-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading && !isSignUp) {
                      handleUsernameAuth();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up only) */}
            {isSignUp && (
              <div>
                <label
                  htmlFor="username-confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("login.confirmPasswordLabel")}
                </label>
                <div className="relative">
                  <input
                    id="username-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("login.confirmPasswordPlaceholder")}
                    disabled={isLoading}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading) {
                        handleUsernameAuth();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Email/Password Form */
          <div className="mb-6 space-y-4">
            {/* Login/Signup Toggle Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  !isSignUp
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("login.loginTab")}
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isSignUp
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("login.signUpTab")}
              </button>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("login.emailLabel")}
              </label>
              <input
                id="email-password"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                disabled={isLoading}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Field */}
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
                    if (e.key === "Enter" && !isLoading && !isSignUp) {
                      handlePasswordAuth();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up only) */}
            {isSignUp && (
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("login.confirmPasswordLabel")}
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("login.confirmPasswordPlaceholder")}
                    disabled={isLoading}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading) {
                        handlePasswordAuth();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
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
        {!emailSent && authMode === "social" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setAuthMode("username")}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-purple-600 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.continueWithUsername")}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("password")}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.continueWithEmail")}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("email")}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("login.continueWithMagicLink")}
            </button>
          </div>
        )}

        {!emailSent && authMode === "email" && (
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

        {!emailSent && authMode === "username" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleUsernameAuth}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSignUp ? t("login.signingUp") : t("login.loggingIn")}
                </>
              ) : isSignUp ? (
                t("login.signUp")
              ) : (
                t("login.login")
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

        {!emailSent && authMode === "password" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handlePasswordAuth}
              disabled={isLoading}
              className="w-full px-6 py-3.5 rounded-xl font-medium text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSignUp ? t("login.signingUp") : t("login.loggingIn")}
                </>
              ) : isSignUp ? (
                t("login.signUp")
              ) : (
                t("login.login")
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
