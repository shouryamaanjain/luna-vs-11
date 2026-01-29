import { createBrowserClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Get environment variables with fallback for build time
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Return a placeholder during build if env var is not set or invalid
  if (!url || !url.startsWith("http")) {
    return "https://placeholder.supabase.co";
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return key || "placeholder-key";
};

// Browser client for client-side operations
export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}

// Server client for API routes
export function createSupabaseServerClient(): SupabaseClient {
  return createClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}

// Export a singleton browser client for convenience
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }
  return browserClient;
}
