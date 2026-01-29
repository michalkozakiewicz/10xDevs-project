# API Endpoint Implementation Plan: DELETE /api/sessions/:sessionId/cards/:id

## 1. Przegląd punktu końcowego

Endpoint umożliwia usunięcie pojedynczej karty zadania z sesji estymacji. Jest to operacja nieodwracalna.

**Kluczowe funkcjonalności:**

- Trwałe usunięcie karty z sesji
- Weryfikacja dostępu do karty przez sesję
- Brak request body
- Odpowiedź 204 No Content bez body

---

## 2. Szczegóły żądania

### Metoda HTTP

`DELETE`

### Struktura URL

```
/api/sessions/:sessionId/cards/:id
```

### Parametry URL

- **sessionId** (UUID, wymagany)
  - Unikalny identyfikator sesji
  - Musi być prawidłowym UUID
  - Sesja musi należeć do zalogowanego użytkownika

- **id** (UUID, wymagany)
  - Unikalny identyfikator karty
  - Musi być prawidłowym UUID
  - Karta musi należeć do podanej sesji

### Request Body

Brak - DELETE nie przyjmuje body.

### Headers

```
Authorization: Bearer <supabase_jwt_token>
```

### Przykładowe żądanie

```bash
DELETE /api/sessions/123e4567-e89b-12d3-a456-426614174000/cards/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

---

## 3. Wykorzystywane typy

### Request Types

Brak - endpoint nie przyjmuje request body.

### Response Types

```typescript
// 204 No Content - brak response body
```

### Database Types

```typescript
// z src/types.ts
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

### Success Response (204 No Content)

Pusty response body.

```
HTTP/1.1 204 No Content
```

### Error Responses

#### 400 Bad Request - Nieprawidłowy format UUID

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "sessionId",
      "message": "Invalid session ID format"
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

#### 404 Not Found - Karta nie istnieje lub sesja nie należy do użytkownika

```json
{
  "code": "CARD_NOT_FOUND",
  "message": "Card not found or access denied"
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
   ├─ Parsowanie sessionId i cardId z URL
   └─ Walidacja formatu UUID (Zod)

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
   ├─ getCardById(supabase, cardId, sessionId)
   │  ├─ Query: SELECT * FROM cards WHERE id = cardId AND session_id = sessionId
   │  └─ Jeśli nie istnieje → 404 Not Found
   │
   └─ deleteCard(supabase, cardId)
      ├─ DELETE FROM cards WHERE id = cardId
      └─ Return void

4. Response
   └─ 204 No Content (pusty body)
```

### Interakcje z bazą danych:

**Tabela: sessions**

- SELECT dla weryfikacji właściciela
- Wykorzystanie RLS policy: "Users can view own sessions"

**Tabela: cards**

- SELECT dla sprawdzenia czy karta istnieje w sesji
- DELETE dla usunięcia karty
- Wykorzystanie RLS policy: "Users can delete cards from own sessions"

### Automatyczne operacje bazy danych:

- CASCADE nie dotyczy (karty nie mają zależnych tabel)
- RLS policy automatycznie weryfikuje dostęp do karty przez sesję

---

## 6. Względy bezpieczeństwa

### 1. Uwierzytelnianie (Authentication)

- **Mechanizm**: Supabase JWT token w header Authorization
- **Weryfikacja**: `context.locals.supabase.auth.getUser()`
- **Response**: 401 Unauthorized jeśli token brak/nieprawidłowy

### 2. Autoryzacja (Authorization)

- **RLS Policy**: "Users can delete cards from own sessions"
  ```sql
  using (
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

- **Zod schema**: Walidacja formatu UUID dla sessionId i cardId
- **SQL Injection**: Zapobieganie przez parametryzowane zapytania Supabase
- **Brak body**: Nie ma ryzyka złośliwych danych w request body

### 4. Business Logic Security

- **Izolacja danych**: Użytkownik usuwa tylko karty z własnych sesji
- **Weryfikacja sesji**: Karta musi należeć do podanej sesji
- **Nieodwracalność**: Operacja DELETE jest trwała (brak soft delete)

### 5. Error Disclosure

- **Nie ujawniać**: Stack traces, szczegóły bazy danych, wewnętrzne ścieżki
- **Zwracać**: Ogólne komunikaty błędów (500: "An unexpected error occurred")
- **Logować**: Szczegółowe błędy po stronie serwera (console.error)

---

## 7. Obsługa błędów

### Hierarchia błędów (kolejność sprawdzania):

#### 1. Format danych (400 Bad Request)

**Sytuacja:**

- Nieprawidłowy format UUID dla sessionId lub cardId

**Handling:**

```typescript
try {
  const sessionId = sessionIdParamSchema.parse(params.sessionId);
  const cardId = cardIdParamSchema.parse(params.id);
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

#### 4. Karta nie istnieje (404 Not Found)

**Sytuacja:**

- Karta o danym ID nie istnieje
- Karta istnieje, ale nie należy do podanej sesji

**Handling:**

```typescript
const card = await getCardById(supabase, cardId, sessionId);

if (!card) {
  return new Response(
    JSON.stringify({
      code: "CARD_NOT_FOUND",
      message: "Card not found or access denied",
    }),
    { status: 404 }
  );
}
```

#### 5. Błąd bazy danych (500 Internal Server Error)

**Sytuacja:**

- Nieoczekiwany błąd podczas operacji na bazie
- Błąd połączenia z Supabase

**Handling:**

```typescript
try {
  // ... operacje na bazie
} catch (error) {
  console.error("Error deleting card:", error);
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

- 2 osobne SELECT (session ownership, card existence)
- 1 DELETE
- Każde zapytanie = round-trip do Supabase

**Optymalizacja:**

```typescript
// Możliwe połączenie sprawdzenia sesji i karty w jedno zapytanie
const { data } = await supabase
  .from("cards")
  .select(
    `
    id,
    session:sessions!inner(user_id)
  `
  )
  .eq("id", cardId)
  .eq("session_id", sessionId)
  .eq("session.user_id", userId)
  .single();

// Sprawdzenie w jednym zapytaniu:
// - Czy karta istnieje
// - Czy należy do sesji
// - Czy sesja należy do użytkownika (RLS + JOIN)
```

#### 2. Indeksy bazy danych

**Wykorzystywane indeksy:**

- Primary key index na `cards.id` → dla DELETE
- `idx_sessions_user_id` → dla session ownership check

**Optymalizacja:**
Istniejące indeksy są wystarczające dla tego endpointu.

#### 3. CASCADE considerations

**Brak zależności:**

- Tabela `cards` nie ma zależnych tabel (brak FK do cards)
- DELETE jest prostą operacją bez kaskadowych usunięć

### Strategie cachowania:

- **Brak cachowania** dla tego endpointu (DELETE operation)
- **Cache invalidation**: Po DELETE należy invalidate cache dla GET operations
  - Invalidate `cards:${sessionId}` (lista kart)
  - Invalidate `card:${cardId}` (pojedyncza karta)

### Monitoring wydajności:

- Logowanie czasu wykonania operacji
- Tracking liczby zapytań do bazy
- Monitoring częstotliwości usuwania kart

---

## 9. Etapy wdrożenia

### Krok 1: Wykorzystanie istniejących Zod schemas

**Plik:** `src/lib/schemas/cards.schema.ts`

Istniejące schemas wystarczą:

```typescript
// Już zdefiniowane w projekcie
export const sessionIdParamSchema = z.string().uuid("Invalid session ID format");
export const cardIdParamSchema = z.string().uuid("Invalid card ID format");
```

**Weryfikacja:**

- Schema parsuje poprawne UUID
- Schema odrzuca nieprawidłowe formaty

---

### Krok 2: Rozszerzenie serwisu dla logiki biznesowej

**Plik:** `src/lib/services/cards.service.ts`

```typescript
// Istniejące funkcje: validateSessionOwnership, getCardById

/**
 * Usuwa kartę z bazy danych
 * @param supabase - Klient Supabase
 * @param cardId - ID karty do usunięcia
 * @throws {Error} Jeśli operacja DELETE nie powiedzie się
 */
export async function deleteCard(supabase: SupabaseClientType, cardId: string): Promise<void> {
  const { error } = await supabase.from("cards").delete().eq("id", cardId);

  if (error) {
    throw error;
  }
}
```

**Weryfikacja:**

- `deleteCard` usuwa kartę bez błędów
- Funkcja rzuca wyjątek jeśli DELETE się nie powiedzie
- Brak zwracanych danych (void)

---

### Krok 3: Rozszerzenie API route handler

**Plik:** `src/pages/api/sessions/[sessionId]/cards/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { sessionIdParamSchema, cardIdParamSchema } from "@/lib/schemas/cards.schema";
import { validateSessionOwnership, getCardById, deleteCard } from "@/lib/services/cards.service";
import type { APIErrorDTO } from "@/types";
import { z } from "zod";

export const prerender = false;

// Istniejący PATCH handler...

export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Walidacja sessionId i cardId z URL
    const sessionId = sessionIdParamSchema.parse(params.sessionId);
    const cardId = cardIdParamSchema.parse(params.id);

    // 2. Sprawdzenie autentykacji
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

    // 3. Sprawdzenie czy sesja istnieje i należy do użytkownika
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

    // 4. Sprawdzenie czy karta istnieje w sesji
    const card = await getCardById(supabase, cardId, sessionId);

    if (!card) {
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
```

**Weryfikacja:**

- Endpoint odpowiada na DELETE requests
- Zwraca 204 No Content bez body
- Wszystkie kody statusu są poprawne
- Error handling działa zgodnie z planem

---

### Krok 4: Testowanie endpointu

#### Test 1: Sukces - usunięcie karty (204 No Content)

```bash
curl -X DELETE http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -v
```

**Oczekiwany rezultat:** 204 No Content, pusty body

#### Test 2: Weryfikacja usunięcia - próba pobrania usuniętej karty (404)

```bash
# Po usunięciu karty, próba jej pobrania
curl -X GET http://localhost:4321/api/sessions/{valid-session-id}/cards/{deleted-card-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 404 + CARD_NOT_FOUND

#### Test 3: Brak autentykacji (401)

```bash
curl -X DELETE http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id}
```

**Oczekiwany rezultat:** 401 + UNAUTHORIZED error

#### Test 4: Nieprawidłowy sessionId (400)

```bash
curl -X DELETE http://localhost:4321/api/sessions/invalid-uuid/cards/{valid-card-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR

#### Test 5: Nieprawidłowy cardId (400)

```bash
curl -X DELETE http://localhost:4321/api/sessions/{valid-session-id}/cards/invalid-uuid \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR

#### Test 6: Sesja nie istnieje (404)

```bash
curl -X DELETE http://localhost:4321/api/sessions/00000000-0000-0000-0000-000000000000/cards/{valid-card-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND

#### Test 7: Karta nie istnieje (404)

```bash
curl -X DELETE http://localhost:4321/api/sessions/{valid-session-id}/cards/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 404 + CARD_NOT_FOUND

#### Test 8: Karta z innej sesji (404)

```bash
# Użyj valid-card-id z session-1, ale podaj session-2 w URL
curl -X DELETE http://localhost:4321/api/sessions/{session-2-id}/cards/{session-1-card-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 404 + CARD_NOT_FOUND

#### Test 9: Idempotentność - ponowne usunięcie (404)

```bash
# Pierwsze usunięcie
curl -X DELETE http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Authorization: Bearer {valid-jwt-token}"

# Drugie usunięcie tej samej karty
curl -X DELETE http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:**

- Pierwsze: 204 No Content
- Drugie: 404 + CARD_NOT_FOUND

---

### Krok 5: Testowanie bezpieczeństwa

#### Test RLS: Próba usunięcia karty z cudzej sesji

```bash
# User A tworzy sesję z kartą
# User B próbuje usunąć kartę z sesji User A
curl -X DELETE http://localhost:4321/api/sessions/{user-a-session-id}/cards/{user-a-card-id} \
  -H "Authorization: Bearer {user-b-jwt-token}"
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND (RLS policy blokuje dostęp)

#### Test SQL Injection w URL

```bash
curl -X DELETE "http://localhost:4321/api/sessions/{valid-session-id}/cards/'; DROP TABLE cards; --" \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR (Zod validation odrzuca nieprawidłowy UUID)

#### Test nieistniejącej sesji z istniejącą kartą

```bash
# Próba usunięcia karty przez podanie nieprawidłowego sessionId
curl -X DELETE http://localhost:4321/api/sessions/00000000-0000-0000-0000-000000000001/cards/{valid-card-id} \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND (weryfikacja sesji przed kartą)

---

### Krok 6: Optymalizacja (opcjonalne)

#### Połączenie zapytań walidacyjnych

```typescript
// Zamiast 2 osobnych zapytań (session ownership + card existence)
const { data: card } = await supabase
  .from("cards")
  .select(
    `
    id,
    session:sessions!inner(user_id)
  `
  )
  .eq("id", cardId)
  .eq("session_id", sessionId)
  .single();

// Sprawdzenie w jednym zapytaniu:
// - Czy karta istnieje
// - Czy należy do sesji
// - Czy sesja należy do użytkownika (przez JOIN)

if (!card || card.session.user_id !== user.id) {
  return 404;
}

// Następnie DELETE
await supabase.from("cards").delete().eq("id", cardId);
```

#### Bezpośrednie DELETE z weryfikacją

```typescript
// Alternatywnie: DELETE z sprawdzeniem wyniku
const { data, error } = await supabase
  .from("cards")
  .delete()
  .eq("id", cardId)
  .eq("session_id", sessionId)
  .select("id")
  .single();

// Jeśli data jest null, karta nie istniała lub nie należy do sesji
if (!data) {
  return 404;
}
```

#### Cache invalidation

```typescript
// Po DELETE, invalidate cache dla GET operations
// Jeśli cache zostanie dodany w przyszłości
await cache.del(`cards:${sessionId}`);
await cache.del(`card:${cardId}`);
```

---

### Krok 7: Dokumentacja

#### Dodanie JSDoc do funkcji serwisu

```typescript
/**
 * Usuwa kartę z bazy danych
 *
 * @param supabase - Klient Supabase z typami Database
 * @param cardId - UUID karty do usunięcia
 * @returns Promise<void>
 * @throws {Error} Jeśli operacja DELETE nie powiedzie się
 *
 * @remarks
 * Operacja jest nieodwracalna. Przed wywołaniem należy zweryfikować:
 * - Czy użytkownik jest właścicielem sesji
 * - Czy karta należy do podanej sesji
 *
 * @example
 * // Usuń kartę po weryfikacji dostępu
 * await deleteCard(supabase, cardId);
 */
```

#### Code review checklist

- [ ] Walidacja UUID dla obu parametrów (sessionId, cardId)
- [ ] Sprawdzenie autentykacji przed operacją
- [ ] Weryfikacja właściciela sesji
- [ ] Weryfikacja przynależności karty do sesji
- [ ] RLS policies testowane
- [ ] Brak SQL injection vulnerabilities
- [ ] Proper error logging
- [ ] Kod zgodny z Prettier config
- [ ] Early returns dla błędów
- [ ] Response 204 No Content bez body
- [ ] Idempotentność przetestowana

---

### Krok 8: Monitoring i logging

#### Dodanie logowania dla production

```typescript
// W route handler - przed usunięciem
console.log(
  `[DELETE /api/sessions/:sessionId/cards/:id] User ${user.id} deleting card ${cardId} from session ${sessionId}`
);

// Po pomyślnym usunięciu
console.log(`[DELETE /api/sessions/:sessionId/cards/:id] Card ${cardId} deleted successfully`);

// W przypadku błędów
console.error(`[DELETE /api/sessions/:sessionId/cards/:id] Error deleting card:`, {
  userId: user.id,
  sessionId,
  cardId,
  error: error.message,
  stack: error.stack,
});
```

#### Metryki do trackowania

- Liczba usuniętych kart per user/session
- Częstotliwość błędów 404 (card not found)
- Czas wykonania endpointu
- Ratio: usunięte karty vs utworzone karty

---

## 10. Podsumowanie

Endpoint **DELETE /api/sessions/:sessionId/cards/:id** został zaprojektowany z naciskiem na:

✅ **Bezpieczeństwo**

- RLS policies + jawna walidacja właściciela
- Parametryzowane zapytania (SQL injection protection)
- Weryfikacja przynależności karty do sesji
- UUID validation (Zod)

✅ **Prostota**

- Brak request body
- Odpowiedź 204 No Content
- Minimalny zestaw błędów (400, 401, 404, 500)

✅ **Clean code**

- Logika wyodrębniona do service layer
- Early returns dla błędów
- Proper error handling
- Zgodność z Prettier config

✅ **Wydajność**

- Możliwość połączenia zapytań walidacyjnych
- Wykorzystanie primary key index
- Prosta operacja DELETE

✅ **Testowalność**

- Service functions łatwe do mockowania
- Jasne scenariusze testowe
- Kompletna obsługa błędów
- Testowanie idempotentności
