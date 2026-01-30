import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client";

/**
 * Disable prerendering for this API route
 * Required for SSR functionality
 */
export const prerender = false;

/**
 * Zod schema for registration request validation
 * Validates email format and password strength
 */
const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format adresu email"),
    password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są zgodne",
    path: ["passwordConfirm"],
  });

/**
 * POST /api/auth/register
 * Creates a new user account using Supabase Auth
 *
 * @param request - Request body should contain { email, password, passwordConfirm }
 * @param cookies - Astro cookies for session management
 * @returns 200 with user data on success, 400 on validation/auth error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

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

    // Attempt to create new user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Return specific error message from Supabase
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

    // Return basic user information on success
    // Note: Depending on Supabase settings, user may need to verify email
    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        message: "Konto zostało utworzone pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    console.error("[API /auth/register] Unexpected error:", error);

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
