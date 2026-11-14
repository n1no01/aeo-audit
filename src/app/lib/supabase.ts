import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;

// Server-only client. Prefer the service-role key so Row Level Security can be switched ON for every table
// (the anon key must never be able to read `users.api_key` or other users' rows).
// Falls back to the anon key so existing deployments keep working until the env var is added.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === "production") {
  console.warn("[supabase] SUPABASE_SERVICE_ROLE_KEY is not set - using the anon key. Enable RLS only after setting it.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
