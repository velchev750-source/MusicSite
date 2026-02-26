import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://khztkgeipeieixmxsnmk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9YXVaXbLATXHwTswXa9bZg_hRIGkS8D";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Supabase credentials are missing.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
