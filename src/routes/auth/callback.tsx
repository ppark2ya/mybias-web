import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

// Get initial error from URL params (stable reference, computed once per page load)
const initialUrlError = (() => {
  if (typeof window === "undefined") return null;
  const queryParams = new URLSearchParams(window.location.search);
  const errorParam = queryParams.get("error");
  const errorDescription = queryParams.get("error_description");
  return errorParam ? (errorDescription || errorParam) : null;
})();

function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Runtime error state (for timeout, session errors, etc.)
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Combined error: URL error takes precedence
  const error = initialUrlError || runtimeError;

  useEffect(() => {
    // If there's an error from URL params, don't proceed with auth
    if (initialUrlError) return;

    let isMounted = true;

    // Check session and handle result
    const checkSessionAndRedirect = async (): Promise<boolean> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) return false;

      if (sessionError) {
        console.error("Session error:", sessionError);
        setRuntimeError(sessionError.message);
        return false;
      }

      if (session) {
        navigate({ to: "/" });
        return true;
      }

      return false;
    };

    // Supabase client with detectSessionInUrl: true will automatically
    // handle the OAuth callback and exchange the code for a session.
    // We just need to listen for the auth state change.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        navigate({ to: "/" });
      }
    });

    // Check if there's already a session (in case the event already fired)
    checkSessionAndRedirect();

    // Set a timeout to handle cases where auth doesn't complete
    const timeout = setTimeout(async () => {
      const hasSession = await checkSessionAndRedirect();
      if (!hasSession && isMounted) {
        setRuntimeError("Authentication timed out. Please try again.");
      }
    }, 10000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("auth.error")}</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t("auth.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-400 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center">
        <div className="animate-spin w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{t("auth.signingIn")}</p>
      </div>
    </div>
  );
}

export default AuthCallback;
