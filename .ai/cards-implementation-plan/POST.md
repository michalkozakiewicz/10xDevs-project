# API Endpoint Implementation Plan: POST /api/sessions/:sessionId/cards

## 1. Przegląd punktu końcowego

Endpoint umożliwia ręczne utworzenie pojedynczej karty zadania w ramach istniejącej sesji estymacji. Karta reprezentuje pojedyncze zadanie do oszacowania w systemie Bucket Estimation.

**Kluczowe funkcjonalności:**

- Tworzenie karty z zewnętrznym identyfikatorem (np. ID z Jira)
- Walidacja limitu 50 kart per sesja
- Zapewnienie unikalności external_id w ramach sesji
- Automatyczne ustawienie bucket_value na null (nieoszacowana)
- Zwracanie pełnego obiektu karty z has_embedding = false

---

## 2. Szczegóły żądania

### Metoda HTTP

`POST`

### Struktura URL

```
/api/sessions/:sessionId/cards
```

### Parametry URL

- **sessionId** (UUID, wymagany)
  - Unikalny identyfikator sesji
  - Musi być prawidłowym UUID
  - Sesja musi należeć do zalogowanego użytkownika

### Request Body

```typescript
{
  external_id: string;      // Wymagany, min 1 znak
  title: string;            // Wymagany, min 1 znak
  description?: string | null;  // Opcjonalny
}
```

### Headers

```
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

### Przykładowe żądanie

```json
{
  "external_id": "TASK-123",
  "title": "Implement login feature",
  "description": "Add OAuth2 authentication with Google and GitHub providers"
}
```

---

## 3. Wykorzystywane typy

### Request Types

```typescript
// z src/types.ts
interface CardCreateCommand {
  external_id: string;
  title: string;
  description?: string | null;
}
```

### Response Types

```typescript
// z src/types.ts
interface CardResponseDTO {
  data: CardDTO;
}

interface CardDTO {
  id: string;
  session_id: string;
  external_id: string;
  title: string;
  description: string | null;
  bucket_value: BucketValue; // null dla nowych kart
  has_embedding: boolean; // false dla nowych kart
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
}

type BucketValue = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | null;
```

### Database Types

```typescript
// z src/types.ts
type CardInsert = Database["public"]["Tables"]["cards"]["Insert"];
type CardEntity = Database["public"]["Tables"]["cards"]["Row"];
```

### Error Types

```typescript
// z src/types.ts
interface APIErrorDTO {
  code: string;
  message: string;
  details?: APIErrorDetail[];
}

interface APIErrorDetail {
  field: string;
  message: string;
}
```

---

## 4. Szczegóły odpowiedzi

### Success Response (201 Created)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "123e4567-e89b-12d3-a456-426614174000",
    "external_id": "TASK-123",
    "title": "Implement login feature",
    "description": "Add OAuth2 authentication with Google and GitHub providers",
    "bucket_value": null,
    "has_embedding": false,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Nieprawidłowe dane wejściowe

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "external_id",
      "message": "external_id is required"
    },
    {
      "field": "title",
      "message": "title is required"
    }
  ]
}
```

#### 401 Unauthorized - Brak autentykacji

```json
{
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

#### 404 Not Found - Sesja nie istnieje lub nie należy do użytkownika

```json
{
  "code": "SESSION_NOT_FOUND",
  "message": "Session not found or access denied"
}
```

#### 409 Conflict - Duplikat external_id

```json
{
  "code": "DUPLICATE_EXTERNAL_ID",
  "message": "Card with this external_id already exists in session"
}
```

#### 422 Unprocessable Entity - Limit 50 kart

```json
{
  "code": "CARDS_LIMIT_EXCEEDED",
  "message": "Session has reached the maximum limit of 50 cards"
}
```

#### 500 Internal Server Error - Błąd serwera

```json
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

---

## 5. Przepływ danych

### Szczegółowy flow:

```
1. Request → Astro API Route Handler
   ├─ Parsowanie sessionId z URL
   ├─ Parsowanie request body
   └─ Walidacja formatu danych (Zod)

2. Authentication Check
   ├─ Sprawdzenie czy user jest zalogowany (auth.uid())
   └─ Jeśli nie → 401 Unauthorized

3. Service Layer: cards.service.ts
   │
   ├─ validateSessionOwnership(supabase, userId, sessionId)
   │  ├─ Query: SELECT user_id FROM sessions WHERE id = sessionId
   │  ├─ Sprawdzenie czy user_id === auth.uid()
   │  └─ Jeśli nie istnieje lub nie należy → 404 Not Found
   │
   ├─ getCardsCountInSession(supabase, sessionId)
   │  ├─ Query: SELECT COUNT(*) FROM cards WHERE session_id = sessionId
   │  └─ Jeśli count >= 50 → 422 Unprocessable Entity
   │
   ├─ checkExternalIdUniqueness(supabase, sessionId, external_id)
   │  ├─ Query: SELECT id FROM cards WHERE session_id = sessionId AND external_id = external_id
   │  └─ Jeśli istnieje → 409 Conflict
   │
   └─ createCard(supabase, sessionId, command)
      ├─ INSERT INTO cards (session_id, external_id, title, description)
      │  VALUES (sessionId, external_id, title, description)
      │  RETURNING *
      ├─ Transformacja CardEntity → CardDTO (has_embedding = embedding !== null)
      └─ Return CardDTO

4. Response
   └─ 201 Created + CardResponseDTO
```

### Interakcje z bazą danych:

**Tabela: sessions**

- SELECT dla weryfikacji właściciela
- Wykorzystanie RLS policy: "Users can view own sessions"

**Tabela: cards**

- SELECT dla sprawdzenia limitu i unikalności
- INSERT dla utworzenia karty
- Wykorzystanie RLS policy: "Users can create cards in own sessions"

### Automatyczne operacje bazy danych:

- `created_at` → automatycznie `now()` przez DEFAULT
- `updated_at` → automatycznie `now()` przez DEFAULT
- `id` → automatycznie `gen_random_uuid()` przez DEFAULT
- Trigger `cards_updated_at` → automatyczna aktualizacja `updated_at` przy UPDATE

---

## 6. Względy bezpieczeństwa

### 1. Uwierzytelnianie (Authentication)

- **Mechanizm**: Supabase JWT token w header Authorization
- **Weryfikacja**: `context.locals.supabase.auth.getUser()`
- **Response**: 401 Unauthorized jeśli token brak/nieprawidłowy

### 2. Autoryzacja (Authorization)

- **RLS Policy**: "Users can create cards in own sessions"
  ```sql
  with check (
    exists (
      select 1 from sessions
      where sessions.id = cards.session_id
        and sessions.user_id = auth.uid()
    )
  )
  ```
- **Dodatkowa weryfikacja**: Jawne sprawdzenie właściciela sesji przed operacją
- **Protection**: IDOR (Insecure Direct Object Reference) prevention

### 3. Walidacja danych wejściowych (Input Validation)

- **Zod schema**: Walidacja typu i formatu danych
- **SQL Injection**: Zapobieganie przez parametryzowane zapytania Supabase
- **XSS Prevention**: Sanityzacja automatyczna przez Supabase
- **Length limits**: Sprawdzenie min długości dla external_id i title

### 4. Business Logic Security

- **Rate limiting**: Limit 50 kart per sesja (DoS prevention)
- **Unikalność**: external_id unikalny w ramach sesji (data integrity)
- **Izolacja danych**: Użytkownik widzi tylko własne sesje/karty

### 5. Error Disclosure

- **Nie ujawniać**: Stack traces, szczegóły bazy danych, wewnętrzne ścieżki
- **Zwracać**: Ogólne komunikaty błędów (500: "An unexpected error occurred")
- **Logować**: Szczegółowe błędy po stronie serwera (console.error)

---

## 7. Obsługa błędów

### Hierarchia błędów (kolejność sprawdzania):

#### 1. Format danych (400 Bad Request)

**Sytuacja:**

- Brak wymaganych pól (external_id, title)
- Nieprawidłowy typ danych
- Nieprawidłowy format UUID dla sessionId

**Handling:**

```typescript
try {
  const validatedBody = cardCreateSchema.parse(await request.json());
  const validatedSessionId = sessionIdSchema.parse(sessionId);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      }),
      { status: 400 }
    );
  }
}
```

#### 2. Autentykacja (401 Unauthorized)

**Sytuacja:**

- Brak tokena JWT
- Token wygasły lub nieprawidłowy

**Handling:**

```typescript
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    }),
    { status: 401 }
  );
}
```

#### 3. Sesja nie istnieje / brak dostępu (404 Not Found)

**Sytuacja:**

- Sesja o danym ID nie istnieje
- Sesja istnieje, ale należy do innego użytkownika

**Handling:**

```typescript
const session = await validateSessionOwnership(supabase, user.id, sessionId);

if (!session) {
  return new Response(
    JSON.stringify({
      code: "SESSION_NOT_FOUND",
      message: "Session not found or access denied",
    }),
    { status: 404 }
  );
}
```

#### 4. Duplikat external_id (409 Conflict)

**Sytuacja:**

- Karta z tym external_id już istnieje w tej sesji

**Handling:**

```typescript
const isDuplicate = await checkExternalIdUniqueness(supabase, sessionId, validatedBody.external_id);

if (isDuplicate) {
  return new Response(
    JSON.stringify({
      code: "DUPLICATE_EXTERNAL_ID",
      message: "Card with this external_id already exists in session",
    }),
    { status: 409 }
  );
}
```

#### 5. Limit kart przekroczony (422 Unprocessable Entity)

**Sytuacja:**

- Sesja ma już 50 kart

**Handling:**

```typescript
const cardsCount = await getCardsCountInSession(supabase, sessionId);

if (cardsCount >= 50) {
  return new Response(
    JSON.stringify({
      code: "CARDS_LIMIT_EXCEEDED",
      message: "Session has reached the maximum limit of 50 cards",
    }),
    { status: 422 }
  );
}
```

#### 6. Błąd bazy danych (500 Internal Server Error)

**Sytuacja:**

- Nieoczekiwany błąd podczas operacji na bazie
- Błąd połączenia z Supabase

**Handling:**

```typescript
try {
  // ... operacje na bazie
} catch (error) {
  console.error("Error creating card:", error);
  return new Response(
    JSON.stringify({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    }),
    { status: 500 }
  );
}
```

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

#### 1. Wielokrotne zapytania do bazy danych

**Problem:**

- 3 osobne SELECT (session ownership, cards count, external_id uniqueness)
- Każde zapytanie = round-trip do Supabase

**Optymalizacja:**

```typescript
// Zamiast 3 zapytań, użyj 1 zapytania z JOIN i agregacją
const { data } = await supabase
  .from("sessions")
  .select(
    `
    id,
    user_id,
    cards:cards(count, external_id)
  `
  )
  .eq("id", sessionId)
  .single();

// Sprawdzenie w jednym zapytaniu:
// - Czy sesja istnieje
// - Czy należy do użytkownika (RLS)
// - Ile ma kart
// - Czy external_id istnieje
```

#### 2. Indeksy bazy danych

**Wykorzystywane indeksy:**

- `idx_sessions_user_id` → dla session ownership check
- `idx_cards_session_bucket` → dla cards count (partial, może być nieoptymalne)

**Rekomendacja:**
Rozważyć dodanie indeksu dla unikalności external_id:

```sql
create unique index idx_cards_session_external_id
  on cards (session_id, external_id);
```

Zaletą jest automatyczna walidacja unikalności na poziomie bazy + szybsze sprawdzanie.

#### 3. N+1 problem

**Nie dotyczy** - tworzymy pojedynczą kartę, nie ma zapytań w pętli.

#### 4. Transformacja danych

**Problem:**

- Transformacja CardEntity → CardDTO wymaga obliczenia has_embedding

**Optymalizacja:**

```typescript
// Zamiast pobierać cały embedding (1536 wymiarów), sprawdź tylko czy istnieje
const hasEmbedding = entity.embedding !== null;
// Supabase automatycznie nie zwraca pola embedding jeśli nie jest w select
```

### Strategie cachowania:

- **Brak cachowania** dla tego endpointu (POST operation)
- Session ownership można cache'ować w ramach jednego żądania (memoization)

### Monitoring wydajności:

- Logowanie czasu wykonania operacji
- Tracking liczby zapytań do bazy
- Monitoring błędów rate limiting (jeśli dodane)

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Zod schemas dla walidacji

**Plik:** `src/lib/schemas/cards.schema.ts`

```typescript
import { z } from "zod";

export const cardCreateSchema = z.object({
  external_id: z.string().min(1, "external_id is required"),
  title: z.string().min(1, "title is required"),
  description: z.string().nullable().optional(),
});

export const sessionIdParamSchema = z.string().uuid("Invalid session ID format");
```

**Weryfikacja:**

- Schema parsuje poprawne dane
- Schema odrzuca nieprawidłowe dane z odpowiednimi komunikatami

---

### Krok 2: Utworzenie serwisu dla logiki biznesowej

**Plik:** `src/lib/services/cards.service.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { CardDTO, CardCreateCommand, CardEntity } from "@/types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Sprawdza czy sesja istnieje i należy do użytkownika
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
 * Tworzy nową kartę w sesji
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
```

**Weryfikacja:**

- Każda funkcja działa poprawnie z mockami Supabase
- Obsługa błędów jest odpowiednia
- Typy są poprawne

---

### Krok 3: Utworzenie API route handler

**Plik:** `src/pages/api/sessions/[sessionId]/cards/index.ts`

```typescript
import type { APIRoute } from "astro";
import { cardCreateSchema, sessionIdParamSchema } from "@/lib/schemas/cards.schema";
import {
  validateSessionOwnership,
  getCardsCountInSession,
  checkExternalIdUniqueness,
  createCard,
} from "@/lib/services/cards.service";
import type { APIErrorDTO, CardResponseDTO } from "@/types";
import { z } from "zod";

export const prerender = false;

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

    // 3. Sprawdzenie autentykacji
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: APIErrorDTO = {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Sprawdzenie czy sesja istnieje i należy do użytkownika
    const session = await validateSessionOwnership(supabase, user.id, sessionId);

    if (!session) {
      const errorResponse: APIErrorDTO = {
        code: "SESSION_NOT_FOUND",
        message: "Session not found or access denied",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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
```

**Weryfikacja:**

- Endpoint odpowiada na POST requests
- Wszystkie kody statusu są poprawne
- Error handling działa zgodnie z planem

---

### Krok 4: Testowanie endpointu

#### Test 1: Sukces (201 Created)

```bash
curl -X POST http://localhost:4321/api/sessions/{valid-session-id}/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "external_id": "TASK-001",
    "title": "Test card",
    "description": "Test description"
  }'
```

**Oczekiwany rezultat:** 201 + CardResponseDTO

#### Test 2: Brak autentykacji (401)

```bash
curl -X POST http://localhost:4321/api/sessions/{valid-session-id}/cards \
  -H "Content-Type: application/json" \
  -d '{
    "external_id": "TASK-001",
    "title": "Test card"
  }'
```

**Oczekiwany rezultat:** 401 + UNAUTHORIZED error

#### Test 3: Nieprawidłowy sessionId (400)

```bash
curl -X POST http://localhost:4321/api/sessions/invalid-uuid/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "external_id": "TASK-001",
    "title": "Test card"
  }'
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR

#### Test 4: Sesja nie istnieje (404)

```bash
curl -X POST http://localhost:4321/api/sessions/00000000-0000-0000-0000-000000000000/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "external_id": "TASK-001",
    "title": "Test card"
  }'
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND

#### Test 5: Duplikat external_id (409)

```bash
# Najpierw utwórz kartę
curl -X POST http://localhost:4321/api/sessions/{valid-session-id}/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{"external_id": "TASK-DUP", "title": "First"}'

# Następnie spróbuj utworzyć kartę z tym samym external_id
curl -X POST http://localhost:4321/api/sessions/{valid-session-id}/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{"external_id": "TASK-DUP", "title": "Second"}'
```

**Oczekiwany rezultat:** 409 + DUPLICATE_EXTERNAL_ID

#### Test 6: Limit 50 kart (422)

```bash
# Utwórz 50 kart w sesji, następnie spróbuj dodać 51-szą
# (test można wykonać przez skrypt)
```

**Oczekiwany rezultat:** 422 + CARDS_LIMIT_EXCEEDED

#### Test 7: Brak wymaganych pól (400)

```bash
curl -X POST http://localhost:4321/api/sessions/{valid-session-id}/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{}'
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR z details dla external_id i title

---

### Krok 5: Testowanie bezpieczeństwa

#### Test RLS: Próba dodania karty do cudzej sesji

```bash
# User A tworzy sesję
# User B próbuje dodać kartę do sesji User A
curl -X POST http://localhost:4321/api/sessions/{user-a-session-id}/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {user-b-jwt-token}" \
  -d '{
    "external_id": "HACK-001",
    "title": "Malicious card"
  }'
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND (RLS policy blokuje dostęp)

#### Test SQL Injection

```bash
curl -X POST http://localhost:4321/api/sessions/{valid-session-id}/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "external_id": "'; DROP TABLE cards; --",
    "title": "SQL injection attempt"
  }'
```

**Oczekiwany rezultat:** 201 (parametryzowane zapytania Supabase chronią przed SQL injection)

#### Test XSS

```bash
curl -X POST http://localhost:4321/api/sessions/{valid-session-id}/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "external_id": "XSS-001",
    "title": "<script>alert(\"XSS\")</script>"
  }'
```

**Oczekiwany rezultat:** 201 (dane zapisane as-is, sanityzacja powinna być wykonana podczas renderowania w UI)

---

### Krok 6: Optymalizacja (opcjonalne)

#### Rozważenie unique index dla external_id

```sql
-- W nowej migracji supabase/migrations/
create unique index idx_cards_session_external_id
  on cards (session_id, external_id);
```

**Korzyści:**

- Automatyczna walidacja unikalności na poziomie bazy
- Szybsze sprawdzanie duplikatów
- Eliminacja race condition

**Zmiana w service:**

```typescript
// Można usunąć checkExternalIdUniqueness
// INSERT automatycznie zwróci błąd unique constraint violation
// Obsługa w try-catch w route handler
```

#### Połączenie zapytań walidacyjnych

```typescript
// Zamiast 2 osobnych zapytań (count + uniqueness check)
const { data, error } = await supabase
  .from("sessions")
  .select(
    `
    id,
    cards:cards!cards_session_id_fkey(count, external_id)
  `
  )
  .eq("id", sessionId)
  .single();

// Sprawdzenie w jednym miejscu:
const cardsCount = data?.cards?.length ?? 0;
const hasDuplicate = data?.cards?.some((c) => c.external_id === externalId);
```

---

### Krok 7: Dokumentacja

#### Dodanie JSDoc do funkcji serwisu

- Wszystkie funkcje publiczne powinny mieć JSDoc
- Opis parametrów, zwracanych wartości, możliwych błędów

#### Aktualizacja API documentation

- Dodanie przykładów użycia w README lub docs
- Link do tego planu implementacji

#### Code review checklist

- [ ] Wszystkie typy są poprawne
- [ ] Walidacja Zod działa
- [ ] Wszystkie scenariusze błędów obsłużone
- [ ] RLS policies testowane
- [ ] Brak SQL injection vulnerabilities
- [ ] Proper error logging
- [ ] Kod zgodny z Prettier config
- [ ] Early returns dla błędów
- [ ] Brak nested if statements

---

### Krok 8: Monitoring i logging

#### Dodanie logowania dla production

```typescript
// W route handler
console.log(`[POST /api/sessions/:sessionId/cards] User ${user.id} creating card in session ${sessionId}`);

// W przypadku błędów
console.error(`[POST /api/sessions/:sessionId/cards] Error creating card:`, {
  userId: user.id,
  sessionId,
  error: error.message,
  stack: error.stack,
});
```

#### Metryki do trackowania

- Liczba utworzonych kart per user/session
- Częstotliwość błędów 409 (duplikaty)
- Częstotliwość błędów 422 (limit)
- Czas wykonania endpointu

---

## 10. Podsumowanie

Endpoint **POST /api/sessions/:sessionId/cards** został zaprojektowany z naciskiem na:

✅ **Bezpieczeństwo**

- RLS policies + jawna walidacja właściciela
- Parametryzowane zapytania (SQL injection protection)
- Input validation (Zod)

✅ **Walidacja biznesowa**

- Limit 50 kart per sesja
- Unikalność external_id w ramach sesji
- Prawidłowe kody statusu HTTP

✅ **Clean code**

- Logika wyodrębniona do service layer
- Early returns dla błędów
- Proper error handling
- Zgodność z Prettier config

✅ **Wydajność**

- Możliwość optymalizacji zapytań
- Unique index dla duplikatów
- Proper indexing

✅ **Testowalność**

- Service functions łatwe do mockowania
- Jasne scenariusze testowe
- Kompletna obsługa błędów
