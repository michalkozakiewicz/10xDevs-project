# API Endpoint Implementation Plan: POST /api/sessions

## 1. Przegląd punktu końcowego

Endpoint `POST /api/sessions` służy do tworzenia nowej sesji estymacji Bucket System dla zalogowanego użytkownika. Sesja jest podstawowym kontenerem dla kart zadań i umożliwia facylitatorowi zarządzanie procesem estymacji. Opcjonalnie można przekazać kontekst projektu, który będzie wykorzystywany przez AI podczas automatycznej estymacji.

**Kluczowe cechy:**

- Wymaga autentykacji użytkownika
- Automatycznie przypisuje user_id z tokenu auth
- Inicjalizuje sesję jako aktywną (is_active: true)
- Generuje UUID oraz timestamps automatycznie

---

## 2. Szczegóły żądania

### Metoda HTTP

`POST`

### Struktura URL

```
/api/sessions
```

### Nagłówki

```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Parametry

**Body Parameters:**
| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| context | string \| null | NIE | Opcjonalny kontekst projektu przekazywany do AI (np. opis technologii, specyfiki domeny) |

### Request Body Example

```json
{
  "context": "E-commerce platform using React and Node.js. Focus on payment processing features."
}
```

Lub z null context:

```json
{
  "context": null
}
```

Lub puste body (context będzie undefined):

```json
{}
```

---

## 3. Wykorzystywane typy

### Command Model (Request)

```typescript
import type { SessionCreateCommand } from "@/types";

// Definicja w src/types.ts (linie 116-118)
interface SessionCreateCommand {
  context?: string | null;
}
```

### Response DTO

```typescript
import type { SessionDTO, SessionResponseDTO } from "@/types";

// Definicja w src/types.ts (linie 77-84)
interface SessionDTO {
  id: string; // uuid
  user_id: string; // uuid
  is_active: boolean;
  context: string | null;
  created_at: string; // ISO8601 timestamp
  updated_at: string; // ISO8601 timestamp
}

// Wrapper (linie 104-106)
interface SessionResponseDTO {
  data: SessionDTO;
}
```

### Error DTO

```typescript
import type { APIErrorDTO } from "@/types";

// Definicja w src/types.ts (linie 50-54)
interface APIErrorDTO {
  code: string;
  message: string;
  details?: APIErrorDetail[];
}
```

### Insert Type (do użycia w service)

```typescript
import type { SessionInsert } from "@/types";

// Definicja w src/types.ts (linia 421)
type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
```

---

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "is_active": true,
    "context": "E-commerce platform using React and Node.js",
    "created_at": "2024-01-26T10:30:00.000Z",
    "updated_at": "2024-01-26T10:30:00.000Z"
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
      "field": "context",
      "message": "Must be a string or null"
    }
  ]
}
```

### Błąd 500 Internal Server Error

```json
{
  "code": "INTERNAL_ERROR",
  "message": "Failed to create session"
}
```

---

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/sessions
       │ { context?: string | null }
       │ + Authorization header
       ▼
┌─────────────────────────────┐
│  Astro Middleware           │
│  - Dodaje supabase do ctx   │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│  POST Handler               │
│  /src/pages/api/sessions.ts │
└──────────┬──────────────────┘
           │
           ├─► 1. Walidacja auth
           │      - supabase.auth.getUser()
           │      - Sprawdź czy user istnieje
           │
           ├─► 2. Walidacja payload
           │      - Zod schema validation
           │      - Parsowanie SessionCreateCommand
           │
           ├─► 3. Wywołanie service
           │      - sessionService.createSession()
           │
           ▼
┌─────────────────────────────┐
│  Session Service            │
│  /src/lib/services/         │
│  session.service.ts         │
└──────────┬──────────────────┘
           │
           ├─► Przygotowanie SessionInsert
           │    { user_id, context, is_active: true }
           │
           ├─► Insert do bazy przez Supabase
           │    supabase.from('sessions').insert()
           │
           ▼
┌─────────────────────────────┐
│  Supabase (PostgreSQL)      │
│  - Walidacja RLS policies   │
│  - Insert do tabeli sessions│
│  - Trigger: updated_at      │
└──────────┬──────────────────┘
           │
           ▼ Return SessionEntity
┌─────────────────────────────┐
│  Session Service            │
│  - Transform do SessionDTO  │
└──────────┬──────────────────┘
           │
           ▼ Return SessionDTO
┌─────────────────────────────┐
│  POST Handler               │
│  - Wrap w SessionResponseDTO│
│  - Return Response(201)     │
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
- **Policy INSERT**: `"Users can create own sessions"` z `with check (user_id = auth.uid())`
- **Niemożliwe podszywanie**: Nawet jeśli ktoś spróbuje podmienić user_id w payload, RLS policy to zablokuje

### Walidacja danych wejściowych

- **Zod schema**: Ścisła walidacja typów przed przetwarzaniem
- **Type safety**: TypeScript zapewnia zgodność typów w całym pipeline
- **Sanityzacja**: Supabase automatycznie escapuje dane przed SQL injection

### Ochrona przed atakami

- **SQL Injection**: Supabase ORM chroni przez prepared statements
- **XSS**: Context jest przechowywany jako plain text, renderowany będzie z odpowiednim escapowaniem
- **CSRF**: Rozważyć dodanie CSRF protection w przyszłości (nie w MVP)

### Bezpieczeństwo danych

- **Minimalizacja ekspozycji**: Response zawiera tylko niezbędne dane
- **Brak wrażliwych danych**: Sesja nie zawiera haseł ani tokenów
- **Audit trail**: Timestamps `created_at` i `updated_at` dla audytu

---

## 7. Obsługa błędów

### Tabela błędów

| Kod HTTP | Error Code       | Scenariusz                   | Message                    | Działanie                            |
| -------- | ---------------- | ---------------------------- | -------------------------- | ------------------------------------ |
| 401      | UNAUTHORIZED     | Brak tokenu auth             | "User not authenticated"   | Zwróć error bez details              |
| 401      | UNAUTHORIZED     | Token wygasły                | "User not authenticated"   | Zwróć error bez details              |
| 400      | VALIDATION_ERROR | Nieprawidłowy payload        | "Invalid request payload"  | Zwróć error z details (pole + powód) |
| 400      | VALIDATION_ERROR | Context nie jest string/null | "Invalid request payload"  | Zwróć error z details                |
| 500      | INTERNAL_ERROR   | Błąd bazy danych             | "Failed to create session" | Log do konsoli, zwróć generic error  |
| 500      | INTERNAL_ERROR   | RLS policy violation         | "Failed to create session" | Log do konsoli, zwróć generic error  |

### Szczegółowa obsługa błędów

#### 1. Błąd autentykacji (401)

```typescript
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      code: "UNAUTHORIZED",
      message: "User not authenticated",
    } as APIErrorDTO),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 2. Błąd walidacji (400)

```typescript
const parseResult = SessionCreateSchema.safeParse(await request.json());

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
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 3. Błąd bazy danych (500)

```typescript
try {
  const session = await sessionService.createSession(supabase, user.id, command);
  // ...
} catch (error) {
  console.error("Failed to create session:", error);

  return new Response(
    JSON.stringify({
      code: "INTERNAL_ERROR",
      message: "Failed to create session",
    } as APIErrorDTO),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Logowanie błędów

- **Konsola serwera**: Wszystkie błędy 500 logowane z pełnym stack trace
- **Format**: `console.error('[POST /api/sessions]', error)`
- **Bez wrażliwych danych**: Nie logować tokenów ani user_id w plaintext

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Połączenie z bazą danych**: Insert do PostgreSQL przez Supabase API
2. **Walidacja RLS**: PostgreSQL musi sprawdzić policy dla każdego insert
3. **Network latency**: Komunikacja Client → Astro → Supabase → PostgreSQL

### Strategie optymalizacji

#### 1. Connection Pooling

- Supabase automatycznie zarządza connection poolingiem
- Middleware tworzy singleton client (`context.locals.supabase`)

#### 2. Indeksy bazy danych

- **Istniejący indeks**: `idx_sessions_user_id` na kolumnie `user_id` (zdefiniowany w migracji)
- **Cel**: Szybkie filtrowanie sesji użytkownika w innych endpointach

#### 3. Minimalizacja roundtrip

- Single insert operation (nie ma dodatkowych query)
- Brak JOIN-ów w tym endpointcie

#### 4. Response size

- Mały payload (~200 bytes)
- Brak paginacji (single resource)

### Oczekiwana wydajność

- **Latency**: ~100-300ms (zależnie od regionu Supabase)
- **Throughput**: ~50-100 req/s per user (ograniczone przez Supabase rate limits)
- **Database load**: Minimalny (simple insert z default values)

### Monitoring

- Rozważyć dodanie timing logs:
  ```typescript
  const startTime = performance.now();
  // ... operacje
  console.log(`[POST /api/sessions] Completed in ${performance.now() - startTime}ms`);
  ```

---

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury katalogów

```bash
# Sprawdzić czy katalogi istnieją, jeśli nie - utworzyć
mkdir -p src/pages/api
mkdir -p src/lib/services
```

### Krok 2: Utworzenie Zod schema

**Plik**: `src/lib/schemas/session.schema.ts` (nowy plik)

```typescript
import { z } from "zod";

/**
 * Validation schema for POST /api/sessions request payload
 */
export const SessionCreateSchema = z.object({
  context: z.string().nullable().optional(),
});
```

### Krok 3: Utworzenie Session Service

**Plik**: `src/lib/services/session.service.ts` (nowy plik)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { SessionCreateCommand, SessionDTO, SessionInsert } from "@/types";

/**
 * Creates a new estimation session for the authenticated user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID from auth.uid()
 * @param command - Session creation command with optional context
 * @returns Created session DTO
 * @throws Error if database operation fails
 */
export async function createSession(
  supabase: SupabaseClient<Database>,
  userId: string,
  command: SessionCreateCommand
): Promise<SessionDTO> {
  // Prepare insert payload
  const sessionInsert: SessionInsert = {
    user_id: userId,
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
```

### Krok 4: Utworzenie API endpoint handler

**Plik**: `src/pages/api/sessions.ts` (nowy plik)

```typescript
import type { APIRoute } from "astro";
import type { SessionCreateCommand, SessionResponseDTO, APIErrorDTO } from "@/types";
import { SessionCreateSchema } from "@/lib/schemas/session.schema";
import { createSession } from "@/lib/services/session.service";

export const prerender = false;

/**
 * POST /api/sessions
 * Creates a new estimation session for the authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Verify authentication
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

    // Step 2: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parseResult = SessionCreateSchema.safeParse(body);

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

    // Step 3: Create session through service
    const command: SessionCreateCommand = parseResult.data;
    const session = await createSession(locals.supabase, user.id, command);

    // Step 4: Return success response
    const response: SessionResponseDTO = {
      data: session,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging
    console.error("[POST /api/sessions] Internal error:", error);

    // Return generic error to client
    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "Failed to create session",
      } as APIErrorDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Krok 5: Testowanie manualne

#### Test 1: Sukces (201 Created)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"context": "Test project context"}'
```

**Oczekiwany wynik**: Status 201, response z pełnym obiektem sesji

#### Test 2: Brak autentykacji (401)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"context": "Test"}'
```

**Oczekiwany wynik**: Status 401, error message "User not authenticated"

#### Test 3: Nieprawidłowy payload (400)

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"context": 123}'
```

**Oczekiwany wynik**: Status 400, validation error z details

#### Test 4: Context null

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"context": null}'
```

**Oczekiwany wynik**: Status 201, response z context: null

#### Test 5: Pusty body

```bash
curl -X POST http://localhost:4321/api/sessions \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Oczekiwany wynik**: Status 201, response z context: null

### Krok 6: Weryfikacja w bazie danych

Po każdym sukcesie sprawdzić w Supabase Dashboard:

1. Nowy rekord w tabeli `sessions`
2. `user_id` odpowiada zalogowanemu użytkownikowi
3. `is_active` = true
4. `created_at` i `updated_at` są poprawnie ustawione

### Krok 7: Testowanie RLS policies

Sprawdzić że próba podmienienia user_id jest blokowana:

- RLS policy powinna automatycznie egzekwować `user_id = auth.uid()`
- Nawet jeśli frontend wyśle inny user_id, Supabase go zignoruje

### Krok 8: Code review checklist

- [ ] Wszystkie typy są importowane z `@/types`
- [ ] Używany jest `locals.supabase`, nie importowany `supabaseClient`
- [ ] Wszystkie error paths zwracają odpowiednie kody statusu
- [ ] Błędy 500 są logowane do konsoli
- [ ] Response zawsze ma header `Content-Type: application/json`
- [ ] Brak hardcoded strings (używane typy z APIErrorDTO)
- [ ] Funkcje mają JSDoc komentarze
- [ ] Kod jest zgodny z clean code guidelines z CLAUDE.md

### Krok 9: Dokumentacja

- [ ] Zaktualizować `.ai/api-plan.md` jeśli są zmiany w specyfikacji
- [ ] Dodać przykłady użycia w dokumentacji API (jeśli istnieje)
- [ ] Zaktualizować listę zaimplementowanych endpointów

### Krok 10: Finalizacja

- [ ] Commit zmian z opisowym message
- [ ] Push do repozytorium
- [ ] Oznaczenie task jako ukończony

---

## 10. Dodatkowe uwagi

### Przyszłe rozszerzenia

1. **Rate limiting**: Dodać rate limiting per user (np. max 10 sesji/minutę)
2. **Walidacja context**: Ograniczyć długość context (np. max 2000 znaków)
3. **Soft delete**: Rozważyć soft delete zamiast trwałego usuwania sesji
4. **Webhook events**: Emitować event po utworzeniu sesji (dla integracji)

### Zależności

Ten endpoint jest fundamentem dla innych endpointów:

- `POST /api/sessions/:sessionId/cards` - wymaga istniejącej sesji
- `PATCH /api/sessions/:id` - wymaga istniejącej sesji
- `DELETE /api/sessions/:id` - wymaga istniejącej sesji

### Testy jednostkowe (opcjonalnie, poza MVP)

Rozważyć dodanie testów dla:

- Session service: `createSession()`
- Zod schema: `SessionCreateSchema`
- Error handling w API route

### Metryki do śledzenia

- Liczba utworzonych sesji per user
- Średni czas tworzenia sesji
- Rate błędów 500 (powinien być bliski 0)
