import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "@/db/supabase.client";

/**
 * Disable prerendering for this API route
 * Required for SSR functionality
 */
export const prerender = false;

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies
 *
 * @param request - Request object for headers
 * @param cookies - Astro cookies for session management
 * @returns 200 on success, 400 on error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client instance with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out the user - this will also clear the session cookies automatically
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    return new Response(null, {
      status: 200,
    });
  } catch (error) {
    // Handle unexpected errors
    console.error("[API /auth/logout] Unexpected error:", error);

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
