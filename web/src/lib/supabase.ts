import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Thrown at build/request time rather than silently returning empty data,
  // so a missing .env.local is obvious instead of a blank dashboard.
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Copy web/.env.local.example to web/.env.local and fill in your Supabase project's values."
  );
}

// The anon key is safe to ship to the browser: the `eda_samples` table only
// grants it SELECT via the "Public read access" RLS policy in
// supabase/schema.sql — it can never write.
//
// Falls back to a placeholder URL when unset so `createClient` doesn't throw
// at build/import time (it validates the URL shape eagerly) — an actual
// request against the placeholder fails at fetch time instead, which the
// callers in src/lib/data/eda.ts already catch and surface as a friendly
// "couldn't reach Supabase" message.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  { auth: { persistSession: false } }
);
