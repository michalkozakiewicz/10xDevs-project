# API Endpoint Implementation Plan: PATCH /api/sessions/:sessionId

> **Plik implementacji:** `src/pages/api/sessions/[sessionId]/index.ts`

## 1. Przegląd punktu końcowego

Endpoint `PATCH /api/sessions/:sessionId` umożliwia częściową aktualizację właściwości istniejącej sesji estymacji. Najczęściej wykorzystywany do zmiany statusu aktywności sesji (`is_active`) lub aktualizacji kontekstu projektu dla AI (`context`).

**Kluczowe cechy:**

- Wymaga autentykacji użytkownika
- Zabezpieczony przez RLS (użytkownik może edytować tylko własne sesje)
- Obsługuje aktualizację częściową (można wysłać tylko jedno z pól)
- Automatycznie aktualizuje pole `updated_at` (poprzez trigger bazy danych)

---

## 2. Szczegóły żądania

### Metoda HTTP

`PATCH`

### Struktura URL

```
/api/sessions/:sessionId
```

Gdzie `:sessionId` to UUID sesji.

### Nagłówki

```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Parametry

**Path Parameters:**

| Parametr  | Typ  | Wymagany | Opis                                         |
| --------- | ---- | -------- | -------------------------------------------- |
| sessionId | uuid | TAK      | Unikalny identyfikator sesji do aktualizacji |

**Body Parameters (SessionUpdateCommand):**

| Parametr  | Typ            | Wymagany | Opis                          |
| --------- | -------------- | -------- | ----------------------------- |
| context   | string \| null | NIE      | Nowy kontekst projektu dla AI |
| is_active | boolean        | NIE      | Status aktywności sesji       |

### Request Body Example

```json
{
  "is_active": false
}
```

Lub aktualizacja kontekstu:

```json
{
  "context": "Zaktualizowany kontekst projektu"
}
```

Lub obie wartości jednocześnie:

```json
{
  "context": "Nowy kontekst",
  "is_active": false
}
```

---

## 3. Wykorzystywane typy

### Command Model (Request)

```typescript
import type { SessionUpdateCommand } from "@/types";

// Definicja w src/types.ts
interface SessionUpdateCommand {
  context?: string | null;
  is_active?: boolean;
}
```

### Response DTO

```typescript
import type { SessionDTO, SessionResponseDTO } from "@/types";

// Definicja w src/types.ts
interface SessionDTO {
  id: string; // uuid
  user_id: string; // uuid
  is_active: boolean;
  context: string | null;
  created_at: string; // ISO8601 timestamp
  updated_at: string; // ISO8601 timestamp
}

// Wrapper
interface SessionResponseDTO {
  data: SessionDTO;
}
```

### Update Type (Database)

```typescript
import type { SessionUpdate } from "@/types";

// Definicja generowana z Database["public"]["Tables"]["sessions"]["Update"]
type SessionUpdate = {
  context?: string | null;
  is_active?: boolean;
  user_id?: string;
  // ... pozostałe pola są opcjonalne przy update
};
```

---

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

Zwraca pełny, zaktualizowany obiekt sesji.

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "is_active": false,
    "context": "Zaktualizowany kontekst projektu",
    "created_at": "2024-01-26T10:30:00.000Z",
    "updated_at": "2024-01-26T10:35:00.000Z"
  }
}
```

### Błąd 401 Unauthorized

```json
{
  "code": "UNAUTHORIZED",
  "message": "User not authenticated"
}
```

### Błąd 400 Bad Request

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request payload",
  "details": [
    {
      "field": "is_active",
      "message": "Expected boolean, received string"
    }
  ]
}
```

Lub dla pustego body:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request payload",
  "details": [
    {
      "field": "",
      "message": "At least one field must be provided for update"
    }
  ]
}
```

### Błąd 404 Not Found

```json
{
  "code": "NOT_FOUND",
  "message": "Session not found"
}
```

### Błąd 500 Internal Server Error

```json
{
  "code": "INTERNAL_ERROR",
  "message": "Failed to update session"
}
```

---

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ PATCH /api/sessions/:sessionId
       │ { context?, is_active? }
       │ + Authorization header
       ▼
┌─────────────────────────────┐
│  Astro Middleware           │
│  - Dodaje supabase do ctx   │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│  PATCH Handler              │
│  /src/pages/api/sessions/    │
│  [sessionId]/index.ts                    │
└──────────┬──────────────────┘
           │
           ├─► 1. Walidacja :id (UUID)
           │      - SessionIdSchema.safeParse()
           │
           ├─► 2. Walidacja auth
           │      - supabase.auth.getUser()
           │      - Sprawdź czy user istnieje
           │
           ├─► 3. Walidacja payload
           │      - Zod schema validation
           │      - Minimum jedno pole wymagane
           │
           ├─► 4. Wywołanie service
           │      - sessionService.updateSession()
           │
           ▼
┌─────────────────────────────┐
│  Session Service            │
│  /src/lib/services/         │
│  session.service.ts         │
└──────────┬──────────────────┘
           │
           ├─► Update w bazie przez Supabase
           │    supabase.from('sessions').update()
           │    .eq('id', sessionId)
           │
           ▼
┌─────────────────────────────┐
│  Supabase (PostgreSQL)      │
│  - Walidacja RLS policies   │
│  - UPDATE tabeli sessions   │
│  - Trigger: updated_at      │
└──────────┬──────────────────┘
           │
           ▼ Return SessionEntity
┌─────────────────────────────┐
│  Session Service            │
│  - Transform do SessionDTO  │
│  - Obsługa błędu PGRST116   │
└──────────┬──────────────────┘
           │
           ▼ Return SessionDTO
┌─────────────────────────────┐
│  PATCH Handler              │
│  - Wrap w SessionResponseDTO│
│  - Return Response(200)     │
└──────────┬──────────────────┘
           │
           ▼ { data: SessionDTO }
┌─────────────┐
│   Client    │
└─────────────┘
```

---

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymagana autentykacja**: Endpoint dostępny tylko dla zalogowanych użytkowników
- **Weryfikacja tokenu**: Sprawdzanie tokenu JWT przez `supabase.auth.getUser()`
- **Zwracanie 401**: Gdy token jest nieprawidłowy, wygasły lub brakuje go

### Autoryzacja

- **RLS Policies**: PostgreSQL Row Level Security automatycznie wymusza `user_id = auth.uid()`
- **Policy UPDATE**: `"Users can update own sessions"` z `using (user_id = auth.uid())`
- **Niemożliwe edytowanie cudzych sesji**: RLS policy blokuje dostęp do sesji innych użytkowników (zwraca 404)

### Walidacja danych wejściowych

- **UUID validation**: Ścisła walidacja formatu UUID dla `:id`
- **Zod schema**: Walidacja typów dla `context` i `is_active`
- **Non-empty check**: Wymuszenie minimum jednego pola w body
- **Sanityzacja**: Supabase automatycznie escapuje dane przed SQL injection

---

## 7. Obsługa błędów

### Tabela błędów

| Kod HTTP | Error Code       | Scenariusz                                       | Message                     | Działanie                            |
| -------- | ---------------- | ------------------------------------------------ | --------------------------- | ------------------------------------ |
| 401      | UNAUTHORIZED     | Brak tokenu auth                                 | "User not authenticated"    | Zwróć error bez details              |
| 400      | BAD_REQUEST      | Nieprawidłowy format UUID                        | "Invalid session ID format" | Zwróć error bez details              |
| 400      | VALIDATION_ERROR | Nieprawidłowy payload                            | "Invalid request payload"   | Zwróć error z details (pole + powód) |
| 400      | VALIDATION_ERROR | Puste body                                       | "Invalid request payload"   | Zwróć error z details                |
| 404      | NOT_FOUND        | Sesja nie istnieje lub nie należy do użytkownika | "Session not found"         | Zwróć error bez details              |
| 500      | INTERNAL_ERROR   | Błąd bazy danych                                 | "Failed to update session"  | Log do konsoli, zwróć generic error  |

### Szczegółowa obsługa błędów

#### 1. Błąd walidacji UUID (400)

```typescript
const idParse = SessionIdSchema.safeParse(sessionId);
if (!idParse.success) {
  return new Response(
    JSON.stringify({
      code: "BAD_REQUEST",
      message: "Invalid session ID format",
    } as APIErrorDTO),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 2. Błąd 404 (sesja nie znaleziona)

```typescript
if (error.code === "PGRST116") {
  throw new Error("SESSION_NOT_FOUND");
}

// W handlerze:
if (error.message === "SESSION_NOT_FOUND") {
  return new Response(
    JSON.stringify({
      code: "NOT_FOUND",
      message: "Session not found",
    } as APIErrorDTO),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

---

## 8. Rozważania dotyczące wydajności

### Optymalizacje

- **Single query**: Jeden UPDATE + SELECT w jednym zapytaniu
- **Indeks**: `idx_sessions_user_id` wspomaga filtrowanie RLS
- **Minimalna zmiana**: Tylko przekazane pola są aktualizowane

### Oczekiwana wydajność

- **Latency**: ~50-150ms
- **Database load**: Minimalny (single UPDATE)

---

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie Zod Schema

**Plik**: `src/lib/schemas/session.schema.ts`

```typescript
import { z } from "zod";

/**
 * Validation schema for session ID path parameter
 */
export const SessionIdSchema = z.string().uuid();

/**
 * Validation schema for PATCH /api/sessions/:id request payload
 */
export const SessionUpdateSchema = z
  .object({
    context: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
```

### Krok 2: Implementacja w Service

**Plik**: `src/lib/services/session.service.ts`

```typescript
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
  supabase: SupabaseClient<Database>,
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
```

### Krok 3: Utworzenie API endpoint handler

**Plik**: `src/pages/api/session/[sessionId]/index.ts` (nowy plik)

```typescript
import type { APIRoute } from "astro";
import type { SessionUpdateCommand, SessionResponseDTO, APIErrorDTO } from "@/types";
import { SessionIdSchema, SessionUpdateSchema } from "@/lib/schemas/session.schema";
import { updateSession } from "@/lib/services/session.service";

export const prerender = false;

/**
 * PATCH /api/sessions/:id
 * Updates an existing estimation session
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

    // Step 2: Verify authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        } as APIErrorDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Parse and validate request body
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

    // Step 4: Update session through service
    const command: SessionUpdateCommand = parseResult.data;
    const session = await updateSession(locals.supabase, sessionId!, command);

    // Step 5: Return success response
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
    console.error("[PATCH /api/sessions/:id] Internal error:", error);

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
```

### Krok 4: Testowanie manualne

#### Test 1: Poprawna aktualizacja is_active (200 OK)

```bash
curl -X PATCH http://localhost:4321/api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

**Oczekiwany wynik**: Status 200, response z zaktualizowaną sesją

#### Test 2: Poprawna aktualizacja context (200 OK)

```bash
curl -X PATCH http://localhost:4321/api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"context": "Nowy kontekst projektu"}'
```

**Oczekiwany wynik**: Status 200, response z zaktualizowanym kontekstem

#### Test 3: Ustawienie context na null (200 OK)

```bash
curl -X PATCH http://localhost:4321/api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"context": null}'
```

**Oczekiwany wynik**: Status 200, response z context: null

#### Test 4: Nieistniejąca sesja (404)

```bash
curl -X PATCH http://localhost:4321/api/sessions/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'
```

**Oczekiwany wynik**: Status 404, error "Session not found"

#### Test 5: Nieprawidłowy format UUID (400)

```bash
curl -X PATCH http://localhost:4321/api/sessions/invalid-id \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'
```

**Oczekiwany wynik**: Status 400, error "Invalid session ID format"

#### Test 6: Błędny typ danych (400)

```bash
curl -X PATCH http://localhost:4321/api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": "tak"}'
```

**Oczekiwany wynik**: Status 400, validation error z details

#### Test 7: Puste body (400)

```bash
curl -X PATCH http://localhost:4321/api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Oczekiwany wynik**: Status 400, error "At least one field must be provided for update"

#### Test 8: Brak autentykacji (401)

```bash
curl -X PATCH http://localhost:4321/api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

**Oczekiwany wynik**: Status 401, error "User not authenticated"

### Krok 5: Code review checklist

- [ ] Wszystkie typy są importowane z `@/types`
- [ ] Używany jest `locals.supabase`, nie importowany `supabaseClient`
- [ ] UUID jest walidowany przed użyciem
- [ ] Wszystkie error paths zwracają odpowiednie kody statusu
- [ ] Błędy 500 są logowane do konsoli
- [ ] Response zawsze ma header `Content-Type: application/json`
- [ ] Funkcje mają JSDoc komentarze
- [ ] Obsługa błędu PGRST116 dla 404

---

## 10. Dodatkowe uwagi

### Różnice względem POST

- PATCH wymaga `:id` w URL
- Body może być częściowe (jedno lub więcej pól)
- Zwraca 404 zamiast tworzyć nowy zasób
- Zwraca 200 zamiast 201

### Przyszłe rozszerzenia

1. **Optimistic locking**: Dodanie `version` lub `updated_at` do walidacji konfliktów
2. **Audit log**: Logowanie zmian z poprzednią i nową wartością
3. **Webhooks**: Powiadomienia o zmianie statusu sesji
