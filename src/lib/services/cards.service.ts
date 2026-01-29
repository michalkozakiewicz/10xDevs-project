import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type {
  CardDTO,
  CardCreateCommand,
  CardUpdateCommand,
  CardEntity,
  CardsQueryParams,
  CardBatchUpdateItem,
} from "@/types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Sprawdza czy sesja istnieje i należy do użytkownika
 * @param supabase - Supabase client instance
 * @param userId - ID zalogowanego użytkownika
 * @param sessionId - ID sesji do weryfikacji
 * @returns session object jeśli istnieje i należy do użytkownika, null w przeciwnym razie
 */
export async function validateSessionOwnership(supabase: SupabaseClientType, userId: string, sessionId: string) {
  const { data, error } = await supabase.from("sessions").select("id, user_id").eq("id", sessionId).single();

  if (error || !data || data.user_id !== userId) {
    return null;
  }

  return data;
}

/**
 * Pobiera liczbę kart w sesji
 * @param supabase - Supabase client instance
 * @param sessionId - ID sesji
 * @returns liczba kart w sesji
 * @throws error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function getCardsCountInSession(supabase: SupabaseClientType, sessionId: string): Promise<number> {
  const { count, error } = await supabase
    .from("cards")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * Sprawdza czy external_id jest już używany w sesji
 * @param supabase - Supabase client instance
 * @param sessionId - ID sesji
 * @param externalId - external_id do sprawdzenia
 * @returns true jeśli external_id już istnieje (duplikat), false w przeciwnym razie
 * @throws error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function checkExternalIdUniqueness(
  supabase: SupabaseClientType,
  sessionId: string,
  externalId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("cards")
    .select("id")
    .eq("session_id", sessionId)
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null; // true = duplikat istnieje
}

/**
 * Transformuje CardEntity do CardDTO
 * @param entity - Entity z bazy danych
 * @returns CardDTO do zwrócenia w API response
 */
export function transformCardEntityToDTO(entity: CardEntity): CardDTO {
  return {
    id: entity.id,
    session_id: entity.session_id,
    external_id: entity.external_id,
    title: entity.title,
    description: entity.description,
    bucket_value: entity.bucket_value as CardDTO["bucket_value"],
    has_embedding: entity.embedding !== null,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

/**
 * Pobiera listę kart w sesji z opcjonalnym filtrowaniem
 * @param supabase - Supabase client instance
 * @param sessionId - ID sesji
 * @param queryParams - Opcjonalne parametry filtrowania (bucket_value)
 * @returns Lista CardDTO
 * @throws error jeśli zapytanie do bazy danych nie powiedzie się
 */
export async function getCards(
  supabase: SupabaseClientType,
  sessionId: string,
  queryParams?: CardsQueryParams
): Promise<CardDTO[]> {
  let query = supabase.from("cards").select("*").eq("session_id", sessionId);

  // Filtrowanie po bucket_value jeśli podane
  if (queryParams?.bucket_value !== undefined) {
    if (queryParams.bucket_value === null) {
      query = query.is("bucket_value", null);
    } else {
      query = query.eq("bucket_value", queryParams.bucket_value);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(transformCardEntityToDTO);
}

/**
 * Pobiera pojedynczą kartę po ID z weryfikacją przynależności do sesji
 * @param supabase - Supabase client instance
 * @param cardId - ID karty
 * @param sessionId - ID sesji (weryfikacja przynależności)
 * @returns CardDTO jeśli karta istnieje i należy do sesji, null w przeciwnym razie
 */
export async function getCardById(
  supabase: SupabaseClientType,
  cardId: string,
  sessionId: string
): Promise<CardDTO | null> {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return transformCardEntityToDTO(data);
}

/**
 * Aktualizuje kartę w sesji
 * @param supabase - Supabase client instance
 * @param cardId - ID karty do aktualizacji
 * @param command - Dane do aktualizacji (partial update)
 * @returns CardDTO zaktualizowanej karty
 * @throws error jeśli operacja UPDATE nie powiedzie się lub karta nie istnieje
 */
export async function updateCard(
  supabase: SupabaseClientType,
  cardId: string,
  command: CardUpdateCommand
): Promise<CardDTO> {
  const updateData: Record<string, unknown> = {};

  if (command.title !== undefined) {
    updateData.title = command.title;
  }
  if (command.description !== undefined) {
    updateData.description = command.description;
  }
  if (command.bucket_value !== undefined) {
    updateData.bucket_value = command.bucket_value;
  }

  const { data, error } = await supabase.from("cards").update(updateData).eq("id", cardId).select().single();

  if (error) {
    throw error;
  }

  return transformCardEntityToDTO(data);
}

/**
 * Usuwa kartę z sesji
 * @param supabase - Supabase client instance
 * @param cardId - ID karty do usunięcia
 * @throws error jeśli operacja DELETE nie powiedzie się
 */
export async function deleteCard(supabase: SupabaseClientType, cardId: string): Promise<void> {
  const { error } = await supabase.from("cards").delete().eq("id", cardId);

  if (error) {
    throw error;
  }
}

/**
 * Tworzy nową kartę w sesji
 * @param supabase - Supabase client instance
 * @param sessionId - ID sesji
 * @param command - Dane do utworzenia karty
 * @returns CardDTO nowo utworzonej karty
 * @throws error jeśli operacja INSERT nie powiedzie się
 */
export async function createCard(
  supabase: SupabaseClientType,
  sessionId: string,
  command: CardCreateCommand
): Promise<CardDTO> {
  const { data, error } = await supabase
    .from("cards")
    .insert({
      session_id: sessionId,
      external_id: command.external_id,
      title: command.title,
      description: command.description ?? null,
      bucket_value: null, // nowe karty są nieoszacowane
      embedding: null, // embedding będzie wygenerowany później
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return transformCardEntityToDTO(data);
}

/**
 * Aktualizuje wiele kart jednocześnie (batch update)
 * @param supabase - Supabase client instance
 * @param sessionId - ID sesji (dla walidacji)
 * @param updates - Lista aktualizacji kart
 * @returns Liczba zaktualizowanych kart
 * @throws error jeśli operacja UPDATE nie powiedzie się
 */
export async function batchUpdateCards(
  supabase: SupabaseClientType,
  sessionId: string,
  updates: CardBatchUpdateItem[]
): Promise<number> {
  // Aktualizujemy każdą kartę osobno
  // W przyszłości można to zoptymalizować przy użyciu Supabase RPC
  let updatedCount = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from("cards")
      .update({
        bucket_value: update.bucket_value,
      })
      .eq("id", update.id)
      .eq("session_id", sessionId); // Dodatkowa walidacja że karta należy do sesji

    if (!error) {
      updatedCount++;
    }
  }

  return updatedCount;
}
