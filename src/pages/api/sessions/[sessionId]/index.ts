import type { APIRoute } from "astro";
import type { SessionUpdateCommand, SessionResponseDTO, APIErrorDTO } from "@/types";
import { SessionIdSchema, SessionUpdateSchema } from "@/lib/schemas/session.schema";
import { updateSession } from "@/lib/services/session.service";

export const prerender = false;

/**
 * GET /api/sessions/:sessionId
 * Retrieves a single session by ID
 * TODO: Add authentication when auth system is implemented
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { sessionId } = params;

    // Validate session ID format
    const idParse = SessionIdSchema.safeParse(sessionId);
    if (!idParse.success) {
      return new Response(
        JSON.stringify({
          code: "BAD_REQUEST",
          message: "Invalid session ID format",
        } as APIErrorDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch session from database
    const { data: session, error } = await locals.supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId!)
      .single();

    if (error || !session) {
      return new Response(
        JSON.stringify({
          code: "NOT_FOUND",
          message: "Session not found",
        } as APIErrorDTO),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    const response: SessionResponseDTO = {
      data: session,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/sessions/:sessionId] Internal error:", error);

    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch session",
      } as APIErrorDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * PATCH /api/sessions/:sessionId
 * Updates an existing estimation session
 * TODO: Add authentication when auth system is implemented
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { sessionId } = params;

    // Step 1: Validate session ID format
    const idParse = SessionIdSchema.safeParse(sessionId);
    if (!idParse.success) {
      return new Response(
        JSON.stringify({
          code: "BAD_REQUEST",
          message: "Invalid session ID format",
        } as APIErrorDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parseResult = SessionUpdateSchema.safeParse(body);

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

    // Step 3: Update session through service
    const command: SessionUpdateCommand = parseResult.data;
    const session = await updateSession(locals.supabase, sessionId!, command);

    // Step 4: Return success response
    const response: SessionResponseDTO = {
      data: session,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known errors
    if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
      return new Response(
        JSON.stringify({
          code: "NOT_FOUND",
          message: "Session not found",
        } as APIErrorDTO),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log error for debugging
    console.error("[PATCH /api/sessions/:sessionId] Internal error:", error);

    // Return generic error to client
    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "Failed to update session",
      } as APIErrorDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
