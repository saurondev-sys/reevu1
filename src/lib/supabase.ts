import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)?.trim();

function isPlaceholder(value: string) {
  return /your[-_ ]?(project|supabase)|example/i.test(value);
}

function hasValidSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) return false;

  try {
    const url = new URL(supabaseUrl);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = hasValidSupabaseConfig();

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
