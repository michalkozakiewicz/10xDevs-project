import type { SupabaseClient } from "@/db/supabase.client";
import type { CardDTO, BucketValue, ChatMessage, ResponseFormatSchema } from "@/types";
import { getCards, updateCard } from "./cards.service";
import { getSessionById } from "./session.service";
import { OpenRouterService } from "./openrouter.service";

/**
 * Valid Fibonacci bucket values for estimation
 */
const FIBONACCI_VALUES: number[] = [1, 2, 3, 5, 8, 13, 21];

/**
 * Result of AI estimation for a single card
 */
export interface EstimatedCard {
  id: string;
  external_id: string;
  title: string;
  bucket_value: BucketValue;
}

/**
 * Result of the AI estimation process
 */
export interface EstimationResult {
  estimated_cards: number;
  cards: EstimatedCard[];
}

/**
 * AI response schema for a single card estimation
 */
interface AICardEstimation {
  id: string;
  bucket_value: number;
}

/**
 * AI response schema for batch estimation
 */
interface AIEstimationResponse {
  estimations: AICardEstimation[];
}

/**
 * Builds the system prompt for AI estimation
 * @param context - Optional session context
 * @returns System message for AI
 */
export function buildSystemPrompt(context: string | null): ChatMessage {
  let systemContent = `Jesteś ekspertem w estymacji zadań programistycznych metodą Bucket System.
Twoim zadaniem jest oszacowanie złożoności zadań i przypisanie ich do odpowiednich kubełków.

ZASADY ESTYMACJI:
1. Używaj TYLKO wartości z sekwencji Fibonacciego: 1, 2, 3, 5, 8, 13, 21
2. Wartości oznaczają względną złożoność zadania:
   - 1: Trywialne, kilka minut pracy
   - 2: Bardzo proste, do godziny
   - 3: Proste, kilka godzin
   - 5: Średnie, jeden dzień pracy
   - 8: Złożone, 2-3 dni pracy
   - 13: Bardzo złożone, tydzień pracy
   - 21: Ekstremalne złożone, więcej niż tydzień
3. Oceń każde zadanie niezależnie na podstawie tytułu i opisu
4. Jeśli brakuje opisu, oceń na podstawie samego tytułu
5. Zwróć odpowiedź WYŁĄCZNIE w formacie JSON zgodnym ze schematem`;

  if (context) {
    systemContent += `

KONTEKST PROJEKTU:
${context}

Uwzględnij powyższy kontekst przy estymacji zadań.`;
  }

  return {
    role: "system",
    content: systemContent,
  };
}

/**
 * Builds the user prompt with cards list
 * @param cards - List of cards to estimate
 * @returns User message for AI
 */
export function buildUserPrompt(cards: CardDTO[]): ChatMessage {
  const cardsList = cards
    .map((card) => {
      const description = card.description ? `\nOpis: ${card.description}` : "";
      return `ID: ${card.id}\nTytuł: ${card.title}${description}`;
    })
    .join("\n\n---\n\n");

  return {
    role: "user",
    content: `Oszacuj następujące zadania i przypisz każdemu wartość z sekwencji Fibonacciego (1, 2, 3, 5, 8, 13, 21):

${cardsList}

Zwróć JSON z estymacjami dla każdego zadania.`,
  };
}

/**
 * Response format schema for structured AI response
 * Uses enum to enforce only valid Fibonacci bucket values
 */
const ESTIMATION_RESPONSE_FORMAT: ResponseFormatSchema = {
  type: "json_schema",
  json_schema: {
    name: "EstimationResponse",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        estimations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              bucket_value: { type: "number", enum: FIBONACCI_VALUES },
            },
            required: ["id", "bucket_value"],
          },
        },
      },
      required: ["estimations"],
    },
  },
};

/**
 * Runs AI estimation on all cards in a session
 *
 * @param supabase - Supabase client instance
 * @param sessionId - Session ID to estimate
 * @param userId - User ID for ownership verification
 * @returns Estimation result with updated cards
 * @throws Error if session not found, no cards, or AI service fails
 */
export async function runAIEstimation(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<EstimationResult> {
  // 1. Get session with context
  const session = await getSessionById(supabase, sessionId, userId);
  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }

  // 2. Get all cards in session
  const cards = await getCards(supabase, sessionId);
  if (cards.length === 0) {
    throw new Error("NO_CARDS_IN_SESSION");
  }

  // 3. Build prompts
  const systemPrompt = buildSystemPrompt(session.context);
  const userPrompt = buildUserPrompt(cards);

  // 4. Call OpenRouter API
  const openRouter = new OpenRouterService({});

  const response = await openRouter.completeChat([systemPrompt, userPrompt], {
    params: {
      temperature: 0.2,
      max_tokens: 4096,
    },
    response_format: ESTIMATION_RESPONSE_FORMAT,
  });

  // 5. Parse AI response
  let aiResponse: AIEstimationResponse;
  try {
    aiResponse = response.structured as AIEstimationResponse;
    if (!aiResponse?.estimations || !Array.isArray(aiResponse.estimations)) {
      throw new Error("Invalid AI response structure");
    }
  } catch {
    throw new Error("AI_RESPONSE_PARSE_ERROR");
  }

  // 6. Create a map of card IDs to their data for quick lookup
  const cardsMap = new Map(cards.map((card) => [card.id, card]));

  // 7. Update cards with estimated values
  const updatedCards: EstimatedCard[] = [];

  for (const estimation of aiResponse.estimations) {
    const card = cardsMap.get(estimation.id);
    if (!card) {
      continue; // Skip if card not found (shouldn't happen)
    }

    // Use bucket value directly (enum in JSON Schema ensures valid values)
    const bucketValue = estimation.bucket_value as BucketValue;

    try {
      // Update card in database
      await updateCard(supabase, card.id, { bucket_value: bucketValue });

      updatedCards.push({
        id: card.id,
        external_id: card.external_id,
        title: card.title,
        bucket_value: bucketValue,
      });
    } catch {
      // Skip cards that failed to update
      continue;
    }
  }

  return {
    estimated_cards: updatedCards.length,
    cards: updatedCards,
  };
}
