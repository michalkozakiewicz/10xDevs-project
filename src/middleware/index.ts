import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";

/**
 * Public paths that don't require authentication
 * Includes auth pages and API endpoints
 */
const PUBLIC_PATHS = [
  // Home page (public)
  "/",
  // Server-rendered auth pages
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

/**
 * Authentication middleware
 * - Creates Supabase SSR client for each request
 * - Checks user session and injects user data into locals
 * - Redirects unauthenticated users from protected routes to login
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase client instance for this request
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Inject user data into locals (available in all Astro components)
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? "",
    };
  } else {
    locals.user = null;
  }

  // Inject Supabase client into locals for use in API routes
  locals.supabase = supabase;

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

  // Redirect unauthenticated users from protected routes to login
  // Save original path to redirect back after successful login
  if (!user && !isPublicPath) {
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    return redirect(redirectUrl);
  }

  return next();
});
