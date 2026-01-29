import type { APIRoute } from "astro";
import { cardCreateSchema, sessionIdParamSchema, cardsQuerySchema } from "@/lib/schemas/cards.schema";
import {
  validateSessionOwnership,
  getCardsCountInSession,
  checkExternalIdUniqueness,
  createCard,
  getCards,
  batchUpdateCards,
} from "@/lib/services/cards.service";
import type {
  APIErrorDTO,
  CardResponseDTO,
  CardsListResponseDTO,
  CardBatchUpdateCommand,
  CardBatchUpdateResponseDTO,
} from "@/types";
import { z } from "zod";

export const prerender = false;

/**
 * POST /api/sessions/:sessionId/cards
 * Creates a new card in an existing estimation session
 */
export const POST: APIRoute = async ({ request, params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Walidacja sessionId z URL
    const sessionId = sessionIdParamSchema.parse(params.sessionId);

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

    const validatedBody = cardCreateSchema.parse(body);

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

    // 5. Sprawdzenie limitu 50 kart
    const cardsCount = await getCardsCountInSession(supabase, sessionId);

    if (cardsCount >= 50) {
      const errorResponse: APIErrorDTO = {
        code: "CARDS_LIMIT_EXCEEDED",
        message: "Session has reached the maximum limit of 50 cards",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Sprawdzenie unikalności external_id
    const isDuplicate = await checkExternalIdUniqueness(supabase, sessionId, validatedBody.external_id);

    if (isDuplicate) {
      const errorResponse: APIErrorDTO = {
        code: "DUPLICATE_EXTERNAL_ID",
        message: "Card with this external_id already exists in session",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. Utworzenie karty
    const card = await createCard(supabase, sessionId, validatedBody);

    // 8. Zwrócenie odpowiedzi 201
    const response: CardResponseDTO = {
      data: card,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
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
    console.error("Error creating card:", error);
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
 * GET /api/sessions/:sessionId/cards
 * Retrieves all cards in a session with optional filtering by bucket_value
 */
export const GET: APIRoute = async ({ request, params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Walidacja sessionId z URL
    const sessionId = sessionIdParamSchema.parse(params.sessionId);

    // 2. Parsowanie query parameters
    const url = new URL(request.url);
    const bucketValueParam = url.searchParams.get("bucket_value");

    // Konwersja bucket_value z string na odpowiedni typ
    let bucketValue: number | null | undefined = undefined;
    if (bucketValueParam !== null) {
      if (bucketValueParam === "null") {
        bucketValue = null;
      } else {
        const parsed = parseInt(bucketValueParam, 10);
        if (!isNaN(parsed)) {
          bucketValue = parsed;
        }
      }
    }

    // Walidacja query params
    const validatedQuery = cardsQuerySchema.parse({
      bucket_value: bucketValue,
    });

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

    // 5. Pobranie kart z opcjonalnym filtrowaniem
    const cards = await getCards(supabase, sessionId, validatedQuery);

    // 6. Zwrócenie odpowiedzi 200
    const response: CardsListResponseDTO = {
      data: cards,
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
    console.error("Error fetching cards:", error);
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
 * PATCH /api/sessions/:sessionId/cards
 * Batch updates multiple cards (for drag-and-drop)
 */
export const PATCH: APIRoute = async ({ request, params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Walidacja sessionId z URL
    const sessionId = sessionIdParamSchema.parse(params.sessionId);

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

    // Validate batch update command
    if (!body.cards || !Array.isArray(body.cards)) {
      const errorResponse: APIErrorDTO = {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload - cards array is required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const batchCommand: CardBatchUpdateCommand = body as CardBatchUpdateCommand;

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

    // 5. Batch update kart
    const updatedCount = await batchUpdateCards(supabase, sessionId, batchCommand.cards);

    // 6. Zwrócenie odpowiedzi 200
    const response: CardBatchUpdateResponseDTO = {
      data: {
        updated: updatedCount,
        cards: batchCommand.cards,
      },
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
    console.error("Error batch updating cards:", error);
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
