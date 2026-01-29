import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

console.log("[supabase.client] Initializing Supabase client");
console.log("[supabase.client] SUPABASE_URL exists:", !!supabaseUrl);
console.log("[supabase.client] SUPABASE_KEY exists:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
console.log("[supabase.client] Supabase client created successfully");

export type SupabaseClient = typeof supabaseClient;

/**
 * Default user ID for development purposes
 * Used instead of real authentication during initial development phase
 * TODO: Remove this and implement proper authentication
 */
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
