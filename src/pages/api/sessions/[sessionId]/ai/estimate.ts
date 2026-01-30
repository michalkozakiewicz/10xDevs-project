import type { APIRoute } from "astro";
import type { APIErrorDTO } from "@/types";
import { SessionIdSchema } from "@/lib/schemas/session.schema";
import { runAIEstimation, type EstimationResult } from "@/lib/services/ai-estimate.service";

export const prerender = false;

/**
 * Response DTO for AI estimation endpoint
 */
interface EstimationResponseDTO {
  data: EstimationResult;
}

/**
 * POST /api/sessions/:sessionId/estimate
 * Runs AI estimation on all cards in the session
 *
 * @description
 * Uses AI (Claude Opus 4.5) to estimate all cards in the session based on:
 * - Card titles and descriptions
 * - Session context (if provided)
 *
 * Cards are assigned bucket values from Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21
 *
 * @returns {EstimationResponseDTO} List of cards that were successfully estimated
 */
export const POST: APIRoute = async ({ params, locals }) => {
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

    // Step 2: Run AI estimation
    const result = await runAIEstimation(locals.supabase, sessionId!, locals.user.id);

    // Step 3: Return success response
    const response: EstimationResponseDTO = {
      data: result,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known errors
    if (error instanceof Error) {
      if (error.message === "SESSION_NOT_FOUND") {
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

      if (error.message === "NO_CARDS_IN_SESSION") {
        return new Response(
          JSON.stringify({
            code: "BAD_REQUEST",
            message: "No cards in session to estimate",
          } as APIErrorDTO),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "AI_RESPONSE_PARSE_ERROR") {
        return new Response(
          JSON.stringify({
            code: "SERVICE_ERROR",
            message: "Failed to parse AI response",
          } as APIErrorDTO),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // OpenRouter API errors
      if (error.message.startsWith("OpenRouter error")) {
        // eslint-disable-next-line no-console
        console.error("[POST /api/sessions/:sessionId/ai/estimate] OpenRouter error:", error.message);
        return new Response(
          JSON.stringify({
            code: "SERVICE_UNAVAILABLE",
            message: error.message,
          } as APIErrorDTO),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("[POST /api/sessions/:sessionId/ai/estimate] Internal error:", error);

    // Return generic error to client
    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "Failed to run AI estimation",
      } as APIErrorDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
