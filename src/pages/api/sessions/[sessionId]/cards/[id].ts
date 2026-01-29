import type { APIRoute } from "astro";
import { sessionIdParamSchema, cardIdParamSchema, cardUpdateSchema } from "@/lib/schemas/cards.schema";
import { validateSessionOwnership, getCardById, updateCard, deleteCard } from "@/lib/services/cards.service";
import type { APIErrorDTO, CardResponseDTO } from "@/types";
import { z } from "zod";

export const prerender = false;

/**
 * PATCH /api/sessions/:sessionId/cards/:id
 * Updates an existing card in a session
 */
export const PATCH: APIRoute = async ({ request, params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Walidacja sessionId i cardId z URL
    const sessionId = sessionIdParamSchema.parse(params.sessionId);
    const cardId = cardIdParamSchema.parse(params.id);

    // 2. Walidacja request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: APIErrorDTO = {
        code: "INVALID_JSON",
        message: "Invalid JSON in request body",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedBody = cardUpdateSchema.parse(body);

    // TODO: Re-enable authentication later
    // 3. Sprawdzenie autentykacji
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser();

    // if (authError || !user) {
    //   const errorResponse: APIErrorDTO = {
    //     code: "UNAUTHORIZED",
    //     message: "Authentication required",
    //   };
    //   return new Response(JSON.stringify(errorResponse), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // 4. Sprawdzenie czy sesja istnieje i należy do użytkownika
    // const session = await validateSessionOwnership(supabase, user.id, sessionId);

    // if (!session) {
    //   const errorResponse: APIErrorDTO = {
    //     code: "SESSION_NOT_FOUND",
    //     message: "Session not found or access denied",
    //   };
    //   return new Response(JSON.stringify(errorResponse), {
    //     status: 404,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // 5. Sprawdzenie czy karta istnieje w sesji
    const existingCard = await getCardById(supabase, cardId, sessionId);

    if (!existingCard) {
      const errorResponse: APIErrorDTO = {
        code: "CARD_NOT_FOUND",
        message: "Card not found or access denied",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Aktualizacja karty
    const updatedCard = await updateCard(supabase, cardId, validatedBody);

    // 7. Zwrócenie odpowiedzi 200
    const response: CardResponseDTO = {
      data: updatedCard,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa błędów walidacji Zod
    if (error instanceof z.ZodError) {
      const errorResponse: APIErrorDTO = {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ogólny błąd serwera
    console.error("Error updating card:", error);
    const errorResponse: APIErrorDTO = {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/sessions/:sessionId/cards/:id
 * Deletes a card from a session
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Walidacja sessionId i cardId z URL
    const sessionId = sessionIdParamSchema.parse(params.sessionId);
    const cardId = cardIdParamSchema.parse(params.id);

    // TODO: Re-enable authentication later
    // 2. Sprawdzenie autentykacji
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser();

    // if (authError || !user) {
    //   const errorResponse: APIErrorDTO = {
    //     code: "UNAUTHORIZED",
    //     message: "Authentication required",
    //   };
    //   return new Response(JSON.stringify(errorResponse), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // 3. Sprawdzenie czy sesja istnieje i należy do użytkownika
    // const session = await validateSessionOwnership(supabase, user.id, sessionId);

    // if (!session) {
    //   const errorResponse: APIErrorDTO = {
    //     code: "SESSION_NOT_FOUND",
    //     message: "Session not found or access denied",
    //   };
    //   return new Response(JSON.stringify(errorResponse), {
    //     status: 404,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // 4. Sprawdzenie czy karta istnieje w sesji
    const existingCard = await getCardById(supabase, cardId, sessionId);

    if (!existingCard) {
      const errorResponse: APIErrorDTO = {
        code: "CARD_NOT_FOUND",
        message: "Card not found or access denied",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Usunięcie karty
    await deleteCard(supabase, cardId);

    // 6. Zwrócenie odpowiedzi 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Obsługa błędów walidacji Zod
    if (error instanceof z.ZodError) {
      const errorResponse: APIErrorDTO = {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ogólny błąd serwera
    console.error("Error deleting card:", error);
    const errorResponse: APIErrorDTO = {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
