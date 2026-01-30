import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Cookie options for Supabase auth
 * Ensures secure, httpOnly cookies with proper SameSite settings
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parses the Cookie header string into an array of { name, value } objects
 * Required by @supabase/ssr for cookie management
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server client instance with SSR support
 * This function must be called on every request to ensure proper session management
 *
 * @param context - Object containing request headers and Astro cookies
 * @returns Supabase client instance configured for SSR
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

/**
 * Type helper for Supabase client instance
 */
export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
