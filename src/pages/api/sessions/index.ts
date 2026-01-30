import type { APIRoute } from "astro";
import type { SessionCreateCommand, SessionResponseDTO, APIErrorDTO, SessionsListResponseDTO } from "@/types";
import { SessionCreateSchema, SessionsQuerySchema } from "@/lib/schemas/session.schema";
import { createSession, listUserSessions } from "@/lib/services/session.service";

export const prerender = false;

/**
 * POST /api/sessions
 * Creates a new estimation session for authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 0: Verify user is authenticated (should be guaranteed by middleware)
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        } as APIErrorDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parseResult = SessionCreateSchema.safeParse(body);

    if (!parseResult.success) {
      const details = parseResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details,
        } as APIErrorDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Create session through service
    const command: SessionCreateCommand = parseResult.data;
    const session = await createSession(locals.supabase, locals.user.id, command);

    // Step 3: Return success response
    const response: SessionResponseDTO = {
      data: session,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Return generic error to client
    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "Failed to create session",
      } as APIErrorDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/sessions
 * Lists all sessions for authenticated user
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 0: Verify user is authenticated (should be guaranteed by middleware)
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        } as APIErrorDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const queryParams = {
      is_active: url.searchParams.get("is_active") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
    };

    // Validate
    const parseResult = SessionsQuerySchema.safeParse(queryParams);

    if (!parseResult.success) {
      const details = parseResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details,
        } as APIErrorDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch sessions for authenticated user
    const result = await listUserSessions(locals.supabase, locals.user.id, parseResult.data);

    const response: SessionsListResponseDTO = {
      data: result.data,
      pagination: result.pagination,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ code: "INTERNAL_ERROR", message: "Failed to fetch sessions" } as APIErrorDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
