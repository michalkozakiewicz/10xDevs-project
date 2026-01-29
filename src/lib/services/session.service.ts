import type { SupabaseClient } from "@/db/supabase.client";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import type {
  SessionCreateCommand,
  SessionDTO,
  SessionInsert,
  SessionListItemDTO,
  SessionsQueryParams,
  SessionUpdateCommand,
  SessionWithCardsCountDTO,
} from "@/types";

/**
 * Creates a new estimation session for the development user
 *
 * @param supabase - Supabase client instance
 * @param command - Session creation command with optional context
 * @returns Created session DTO
 * @throws Error if database operation fails
 */
export async function createSession(supabase: SupabaseClient, command: SessionCreateCommand): Promise<SessionDTO> {
  // Prepare insert payload
  const sessionInsert: SessionInsert = {
    user_id: DEFAULT_USER_ID,
    context: command.context ?? null,
    is_active: true,
  };

  // Insert into database
  const { data, error } = await supabase.from("sessions").insert(sessionInsert).select().single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  // Transform to DTO
  return {
    id: data.id,
    user_id: data.user_id,
    is_active: data.is_active,
    context: data.context,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Lists all sessions for authenticated user with pagination
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID from auth.uid()
 * @param params - Query parameters for filtering and pagination
 * @returns Object with sessions array and pagination metadata
 * @throws Error if database operation fails
 */
export async function listUserSessions(
  supabase: SupabaseClient,
  userId: string,
  params: SessionsQueryParams
): Promise<{
  data: SessionListItemDTO[];
  pagination: { total: number; limit: number; offset: number };
}> {
  const { is_active, limit = 20, offset = 0 } = params;

  // Build query
  // Note: context excluded from list view as it can contain large amounts of text
  let query = supabase
    .from("sessions")
    .select("id, is_active, created_at, updated_at", { count: "exact" })
    .eq("user_id", userId);

  if (is_active !== undefined) {
    query = query.eq("is_active", is_active);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data: sessions, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }

  // Count cards for each session (parallel)
  const sessionsWithCount = await Promise.all(
    (sessions || []).map(async (session) => {
      const { count: cardsCount } = await supabase
        .from("cards")
        .select("*", { count: "exact", head: true })
        .eq("session_id", session.id);

      return { ...session, cards_count: cardsCount || 0 };
    })
  );

  return {
    data: sessionsWithCount,
    pagination: { total: count || 0, limit, offset },
  };
}

/**
 * Updates an existing session
 *
 * @param supabase - Supabase client instance
 * @param sessionId - Session ID to update
 * @param command - Update command with optional fields
 * @returns Updated session DTO
 * @throws Error with "SESSION_NOT_FOUND" if session doesn't exist or RLS blocks access
 * @throws Error if database operation fails
 */
export async function updateSession(
  supabase: SupabaseClient,
  sessionId: string,
  command: SessionUpdateCommand
): Promise<SessionDTO> {
  const { data, error } = await supabase.from("sessions").update(command).eq("id", sessionId).select().single();

  if (error) {
    // PGRST116 oznacza brak wyników (np. błędne ID lub brak uprawnień RLS)
    if (error.code === "PGRST116") {
      throw new Error("SESSION_NOT_FOUND");
    }
    throw new Error(`Failed to update session: ${error.message}`);
  }

  return {
    id: data.id,
    user_id: data.user_id,
    is_active: data.is_active,
    context: data.context,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Gets a session by ID with cards count
 *
 * @param supabase - Supabase client instance
 * @param sessionId - Session ID to fetch
 * @param userId - User ID for ownership verification
 * @returns Session DTO with cards count, or null if not found
 * @throws Error if database operation fails
 */
export async function getSessionById(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<SessionWithCardsCountDTO | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch session: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Count cards in session
  const { count: cardsCount } = await supabase
    .from("cards")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  return {
    id: data.id,
    user_id: data.user_id,
    is_active: data.is_active,
    context: data.context,
    created_at: data.created_at,
    updated_at: data.updated_at,
    cards_count: cardsCount || 0,
  };
}
