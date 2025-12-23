import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableDefaultKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined;

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableDefaultKey
);

// Create Supabase client
// Using generic client without strict typing to avoid build issues
// Types are enforced at the application level using our custom types
function createSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableDefaultKey) {
    // Return a mock client for build time / when env vars are missing
    console.warn(
      "Supabase environment variables not configured. Authentication will not work."
    );
    // Create with placeholder values - will fail at runtime but allows build
    return createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(supabaseUrl, supabasePublishableDefaultKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}

export const supabase = createSupabaseClient();

export default supabase;
