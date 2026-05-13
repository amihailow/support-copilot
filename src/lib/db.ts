import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabasePublic: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
  if (!supabasePublic) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Supabase public env vars are missing");
    }
    supabasePublic = createClient(url, key);
  }
  return supabasePublic;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Supabase admin env vars are missing");
    }
    supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseAdmin;
}
