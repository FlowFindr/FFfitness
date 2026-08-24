/* ---------------- supabase client ---------------- */
/* Null whenever the env vars are absent, which is the normal state for a
   fresh clone and for anyone running the app without a backend. Every caller
   handles null by carrying on locally. */

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
