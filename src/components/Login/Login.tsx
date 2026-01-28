import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { trackLoginStart, trackLoginSuccess } from "../../utils/analytics";
import type { AuthMode } from "./types";
import { EmailSentView } from "./EmailSentView";
import { SelectModeView } from "./SelectModeView";
import { MagicLinkModeView } from "./MagicLinkModeView";
import { LoginModeView } from "./LoginModeView";
import { SignupModeView } from "./SignupModeView";

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

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const validateEmail = (emailToValidate: string): boolean => {
    if (!emailToValidate) {
      toast.error(t("login.enterEmail"));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate)) {
      toast.error(t("login.invalidEmail"));
      return false;
    }
    return true;
  };

  const validatePassword = (passwordToValidate: string): boolean => {
    if (!passwordToValidate) {
      toast.error(t("login.enterPassword"));
      return false;
    }
    return true;
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    trackLoginStart("google");
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  const handleEmailContinue = async () => {
    if (!validateEmail(email)) return;

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
    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;

    setIsLoading(true);
    trackLoginStart("password");
    const { error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    trackLoginSuccess("password");
    navigate({ to: "/" });
  };

  const handleSignUp = async () => {
    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;

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

  const renderContent = () => {
    if (emailSent) {
      return (
        <EmailSentView email={email} authMode={authMode} onReset={resetForm} />
      );
    }

    switch (authMode) {
      case "select":
        return (
          <SelectModeView
            isLoading={isLoading}
            onGoogleLogin={handleGoogleLogin}
            onSelectMode={setAuthMode}
          />
        );
      case "magiclink":
        return (
          <MagicLinkModeView
            email={email}
            onEmailChange={setEmail}
            isLoading={isLoading}
            onSubmit={handleEmailContinue}
            onBack={resetForm}
          />
        );
      case "login":
        return (
          <LoginModeView
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            isLoading={isLoading}
            onSubmit={handlePasswordLogin}
            onSelectMode={setAuthMode}
            onBack={resetForm}
          />
        );
      case "signup":
        return (
          <SignupModeView
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            isLoading={isLoading}
            onSubmit={handleSignUp}
            onSelectMode={setAuthMode}
            onBack={resetForm}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Link
        to="/"
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm sm:text-base font-medium">
          {t("login.backToHome")}
        </span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {t("login.title")}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            {t("login.subtitle")}
          </p>
        </div>

        {renderContent()}

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
