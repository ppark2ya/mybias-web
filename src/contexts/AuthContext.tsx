import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/database";

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithEmail: (email: string) => Promise<{ error: AuthError | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithUsername: (username: string, password: string) => Promise<{ error: AuthError | null }>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          // Mark loading as done immediately after session check
          setIsLoading(false);

          // Fetch profile in background (non-blocking)
          if (initialSession?.user) {
            fetchProfile(initialSession.user.id).then((profileData) => {
              if (mounted) {
                setProfile(profileData);
              }
            });
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Handle specific auth events
      if (event === "SIGNED_OUT") {
        setProfile(null);
      } else if (newSession?.user) {
        // Fetch profile in background (non-blocking)
        fetchProfile(newSession.user.id).then((profileData) => {
          if (mounted) {
            setProfile(profileData);
          }
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  // Sign in with Email (Magic Link)
  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  // Sign up with Email and Password
  const signUpWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  // Sign in with Email and Password
  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Check if username is available
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (error) {
        console.error("Error checking username:", error);
        return false;
      }

      // Username is available if no matching record found
      return !data;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  // Sign up with Username and Password
  const signUpWithUsername = async (username: string, password: string) => {
    try {
      // First check if username is available
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        return { error: { message: "Username already taken" } as AuthError };
      }

      // Use username as email with .local domain
      const email = `${username}@mybias.local`;

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error };
      }

      // Update profile with username
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("Error updating profile with username:", profileError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error("Error signing up with username:", error);
      return { error: error as AuthError };
    }
  };

  // Sign in with Username and Password
  const signInWithUsername = async (username: string, password: string) => {
    // Convert username to email format
    const email = `${username}@mybias.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithPassword,
    signInWithPassword,
    signUpWithUsername,
    signInWithUsername,
    checkUsernameAvailability,
    signOut,
    refreshProfile,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthContext;
