import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client";

/**
 * Disable prerendering for this API route
 * Required for SSR functionality
 */
export const prerender = false;

/**
 * Zod schema for login request validation
 * Validates email format and ensures password is provided
 */
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * POST /api/auth/login
 * Authenticates user with email and password using Supabase Auth
 *
 * @param request - Request body should contain { email, password }
 * @param cookies - Astro cookies for session management
 * @returns 200 with user data on success, 400 on validation/auth error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase client instance with SSR support
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic error message to prevent email enumeration attacks
      // Per security best practices in auth-plan.md
      return new Response(
        JSON.stringify({
          error: "Niepoprawny email lub hasło",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return basic user information on success
    // Cookies are automatically set by @supabase/ssr
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("[API /auth/login] Unexpected error:", error);

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas logowania. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
