import type { Database } from "./db/database.types";

// ============================================================================
// Base Entity Types (derived from Database schema)
// ============================================================================

/**
 * Base Session entity from database
 */
export type SessionEntity = Database["public"]["Tables"]["sessions"]["Row"];

/**
 * Base Card entity from database
 */
export type CardEntity = Database["public"]["Tables"]["cards"]["Row"];

/**
 * Valid bucket values for card estimation (Fibonacci sequence + null for unestimated)
 */
export type BucketValue = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | null;

// ============================================================================
// Pagination DTO
// ============================================================================

/**
 * Standard pagination metadata for list responses
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Single field validation error detail
 */
export interface APIErrorDetail {
  field: string;
  message: string;
}

/**
 * Standard API error response format
 */
export interface APIErrorDTO {
  code: string;
  message: string;
  details?: APIErrorDetail[];
}

// ============================================================================
// Session DTOs
// ============================================================================

/**
 * Session list item DTO - includes computed cards_count
 * Used in: GET /api/sessions
 * Note: context excluded as it can contain large amounts of text
 */
export interface SessionListItemDTO {
  id: SessionEntity["id"];
  is_active: SessionEntity["is_active"];
  cards_count: number;
  created_at: SessionEntity["created_at"];
  updated_at: SessionEntity["updated_at"];
}

/**
 * Full session DTO - includes user_id
 * Used in: GET /api/sessions/:id, POST /api/sessions, PATCH /api/sessions/:id
 */
export interface SessionDTO {
  id: SessionEntity["id"];
  user_id: SessionEntity["user_id"];
  is_active: SessionEntity["is_active"];
  context: SessionEntity["context"];
  created_at: SessionEntity["created_at"];
  updated_at: SessionEntity["updated_at"];
}

/**
 * Session with cards count - used in GET /api/sessions/:id response
 */
export interface SessionWithCardsCountDTO extends SessionDTO {
  cards_count: number;
}

/**
 * Paginated sessions list response
 */
export interface SessionsListResponseDTO {
  data: SessionListItemDTO[];
  pagination: PaginationDTO;
}

/**
 * Single session response wrapper
 */
export interface SessionResponseDTO {
  data: SessionDTO | SessionWithCardsCountDTO;
}

// ============================================================================
// Session Command Models
// ============================================================================

/**
 * Command for creating a new session
 * Used in: POST /api/sessions
 */
export interface SessionCreateCommand {
  context?: string | null;
}

/**
 * Command for updating an existing session
 * Used in: PATCH /api/sessions/:id
 */
export interface SessionUpdateCommand {
  context?: string | null;
  is_active?: boolean;
}

// ============================================================================
// Session Clear Response DTO
// ============================================================================

/**
 * Response from session clear operation
 * Used in: POST /api/sessions/:id/clear
 */
export interface SessionClearResponseDTO {
  data: {
    id: SessionEntity["id"];
    is_active: SessionEntity["is_active"];
    cards_cleared: number;
    message: string;
  };
}

// ============================================================================
// Session Summary DTOs
// ============================================================================

/**
 * Card summary item in session summary
 */
export interface CardSummaryItemDTO {
  id: CardEntity["id"];
  external_id: CardEntity["external_id"];
  title: CardEntity["title"];
  bucket_value: BucketValue;
}

/**
 * Bucket distribution statistics
 */
export interface BucketDistribution {
  "1": number;
  "2": number;
  "3": number;
  "5": number;
  "8": number;
  "13": number;
  "21": number;
  "?": number;
}

/**
 * Session statistics
 */
export interface SessionStatistics {
  total_cards: number;
  estimated_cards: number;
  unestimated_cards: number;
  bucket_distribution: BucketDistribution;
}

/**
 * Session summary response
 * Used in: GET /api/sessions/:id/summary
 */
export interface SessionSummaryDTO {
  data: {
    session_id: SessionEntity["id"];
    cards: CardSummaryItemDTO[];
    statistics: SessionStatistics;
  };
}

// ============================================================================
// Card DTOs
// ============================================================================

/**
 * Card DTO - transforms embedding to has_embedding boolean
 * Used in: GET /api/sessions/:sessionId/cards, GET /api/sessions/:sessionId/cards/:id
 */
export interface CardDTO {
  id: CardEntity["id"];
  session_id: CardEntity["session_id"];
  external_id: CardEntity["external_id"];
  title: CardEntity["title"];
  description: CardEntity["description"];
  bucket_value: BucketValue;
  has_embedding: boolean;
  created_at: CardEntity["created_at"];
  updated_at: CardEntity["updated_at"];
}

/**
 * Cards list response wrapper
 */
export interface CardsListResponseDTO {
  data: CardDTO[];
}

/**
 * Single card response wrapper
 */
export interface CardResponseDTO {
  data: CardDTO;
}

// ============================================================================
// Card Command Models
// ============================================================================

/**
 * Command for creating a new card
 * Used in: POST /api/sessions/:sessionId/cards
 */
export interface CardCreateCommand {
  external_id: string;
  title: string;
  description?: string | null;
}

/**
 * Command for updating a single card
 * Used in: PATCH /api/sessions/:sessionId/cards/:id
 */
export interface CardUpdateCommand {
  title?: string;
  description?: string | null;
  bucket_value?: BucketValue;
}

/**
 * Single card update item in batch operation
 */
export interface CardBatchUpdateItem {
  id: CardEntity["id"];
  bucket_value: BucketValue;
}

/**
 * Command for batch updating multiple cards
 * Used in: PATCH /api/sessions/:sessionId/cards
 */
export interface CardBatchUpdateCommand {
  cards: CardBatchUpdateItem[];
}

/**
 * Batch update response
 */
export interface CardBatchUpdateResponseDTO {
  data: {
    updated: number;
    cards: CardBatchUpdateItem[];
  };
}

// ============================================================================
// Card Import DTOs
// ============================================================================

/**
 * Command for importing cards from CSV
 * Used in: POST /api/sessions/:sessionId/cards/import
 */
export interface CardImportCommand {
  csv_content: string;
}

/**
 * Single import error detail
 */
export interface CardImportError {
  row: number;
  external_id: string;
  error: string;
}

/**
 * Imported card summary
 */
export interface ImportedCardSummary {
  id: CardEntity["id"];
  external_id: CardEntity["external_id"];
  title: CardEntity["title"];
}

/**
 * Card import result response
 * Used in: POST /api/sessions/:sessionId/cards/import
 */
export interface CardImportResultDTO {
  data: {
    imported: number;
    failed: number;
    errors: CardImportError[];
    cards: ImportedCardSummary[];
  };
}

// ============================================================================
// AI Estimation DTOs
// ============================================================================

/**
 * Command for running AI estimation
 * Used in: POST /api/sessions/:sessionId/ai/estimate
 */
export interface AIEstimateCommand {
  confirm_override: boolean;
}

/**
 * Single estimated card result
 */
export interface EstimatedCardDTO {
  id: CardEntity["id"];
  external_id: CardEntity["external_id"];
  title: CardEntity["title"];
  bucket_value: BucketValue;
  ai_confidence: number;
}

/**
 * AI estimation result response
 * Used in: POST /api/sessions/:sessionId/ai/estimate
 */
export interface AIEstimateResultDTO {
  data: {
    estimated_cards: number;
    cards: EstimatedCardDTO[];
  };
}

// ============================================================================
// Embedding DTOs
// ============================================================================

/**
 * Single card embedding generation result
 * Used in: POST /api/sessions/:sessionId/cards/:id/embedding
 */
export interface EmbeddingResultDTO {
  data: {
    id: CardEntity["id"];
    has_embedding: boolean;
    message: string;
  };
}

/**
 * Batch embedding generation result
 * Used in: POST /api/sessions/:sessionId/cards/embeddings
 */
export interface BatchEmbeddingResultDTO {
  data: {
    processed: number;
    skipped: number;
    failed: number;
  };
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for GET /api/sessions
 */
export interface SessionsQueryParams {
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for GET /api/sessions/:sessionId/cards
 */
export interface CardsQueryParams {
  bucket_value?: BucketValue;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Helper type to transform CardEntity to CardDTO
 * Omits embedding and adds has_embedding boolean
 */
export type CardEntityToDTO = Omit<CardEntity, "embedding"> & {
  has_embedding: boolean;
  bucket_value: BucketValue;
};

/**
 * Insert types from database schema
 */
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type CardInsert = Database["public"]["Tables"]["cards"]["Insert"];

/**
 * Update types from database schema
 */
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];
export type CardUpdate = Database["public"]["Tables"]["cards"]["Update"];

// ============================================================================
// OpenRouter Service Types
// ============================================================================

/**
 * Model parameters for OpenRouter API requests
 */
export interface ModelParams {
  temperature?: number; // 0–2 (depending on model)
  top_p?: number; // 0–1
  max_tokens?: number; // response limit
  presence_penalty?: number;
  frequency_penalty?: number;
}

/**
 * Response format schema for structured JSON responses
 */
export interface ResponseFormatSchema {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>; // JSON Schema object
  };
}

/**
 * Chat message for OpenRouter completion
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

/**
 * Options for chat completion requests
 */
export interface CompletionOptions {
  model?: string;
  params?: ModelParams;
  response_format?: ResponseFormatSchema;
  stream?: boolean;
  signal?: AbortSignal; // for timeout/cancellation handling
}
