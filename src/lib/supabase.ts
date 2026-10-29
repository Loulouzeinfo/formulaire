import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

// Appeler uniquement depuis les composants clients : session gérée dans le navigateur.
export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Le client Supabase doit être utilisé dans le navigateur.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("La configuration publique Supabase est manquante.");
  if (!key.startsWith("sb_publishable_")) {
    throw new Error("Utilisez une clé publique Supabase publishable.");
  }
  client ??= createClient(url, key);
  return client;
}
