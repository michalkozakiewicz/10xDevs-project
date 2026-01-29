# API Endpoint Implementation Plan: GET /api/sessions/:sessionId/cards

## 1. PrzeglÄ…d punktu koĹ„cowego

Endpoint umoĹĽliwia pobranie listy wszystkich kart zadaĹ„ w ramach sesji estymacji. ObsĹ‚uguje opcjonalne filtrowanie po wartoĹ›ci kubeĹ‚ka (bucket_value).

**Kluczowe funkcjonalnoĹ›ci:**

- Pobieranie wszystkich kart w sesji
- Opcjonalne filtrowanie po bucket_value
- Zwracanie listy CardDTO z has_embedding
- Weryfikacja dostÄ™pu do sesji (RLS + jawna walidacja)

---

## 2. SzczegĂłĹ‚y ĹĽÄ…dania

### Metoda HTTP

`GET`

### Struktura URL

```
/api/sessions/:sessionId/cards
```

### Parametry URL

- **sessionId** (UUID, wymagany)
  - Unikalny identyfikator sesji
  - Musi byÄ‡ prawidĹ‚owym UUID
  - Sesja musi naleĹĽeÄ‡ do zalogowanego uĹĽytkownika

### Query Parameters

- **bucket_value** (integer | null, opcjonalny)
  - Filtrowanie po wartoĹ›ci kubeĹ‚ka
  - Dozwolone wartoĹ›ci: `null`, `0`, `1`, `2`, `3`, `5`, `8`, `13`, `21`
  - PrzykĹ‚ad: `?bucket_value=5` lub `?bucket_value=null`

### Headers

```
Authorization: Bearer <supabase_jwt_token>
```

### PrzykĹ‚adowe ĹĽÄ…dania

```bash
# Wszystkie karty w sesji
GET /api/sessions/123e4567-e89b-12d3-a456-426614174000/cards

# Karty z wartoĹ›ciÄ… kubeĹ‚ka 5
GET /api/sessions/123e4567-e89b-12d3-a456-426614174000/cards?bucket_value=5

# Karty nieoszacowane (bucket_value = null)
GET /api/sessions/123e4567-e89b-12d3-a456-426614174000/cards?bucket_value=null
```

---

## 3. Wykorzystywane typy

### Query Parameter Types

```typescript
// z src/types.ts
interface CardsQueryParams {
  bucket_value?: BucketValue;
}

type BucketValue = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | null;
```

### Response Types

```typescript
// z src/types.ts
interface CardsListResponseDTO {
  data: CardDTO[];
}

interface CardDTO {
  id: string;
  session_id: string;
  external_id: string;
  title: string;
  description: string | null;
  bucket_value: BucketValue;
  has_embedding: boolean;
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
}
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

## 4. SzczegĂłĹ‚y odpowiedzi

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "session_id": "123e4567-e89b-12d3-a456-426614174000",
      "external_id": "TASK-123",
      "title": "Implement login feature",
      "description": "Add OAuth2 authentication with Google and GitHub providers",
      "bucket_value": 5,
      "has_embedding": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440111",
      "session_id": "123e4567-e89b-12d3-a456-426614174000",
      "external_id": "TASK-124",
      "title": "Create dashboard",
      "description": null,
      "bucket_value": null,
      "has_embedding": false,
      "created_at": "2024-01-15T10:35:00.000Z",
      "updated_at": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

### Success Response - Empty List (200 OK)

```json
{
  "data": []
}
```

### Error Responses

#### 400 Bad Request - NieprawidĹ‚owy bucket_value

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "bucket_value",
      "message": "Invalid bucket_value. Must be one of: null, 0, 1, 2, 3, 5, 8, 13, 21"
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

#### 404 Not Found - Sesja nie istnieje lub nie naleĹĽy do uĹĽytkownika

```json
{
  "code": "SESSION_NOT_FOUND",
  "message": "Session not found or access denied"
}
```

#### 500 Internal Server Error - BĹ‚Ä…d serwera

```json
{
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

---

## 5. PrzepĹ‚yw danych

### SzczegĂłĹ‚owy flow:

```
1. Request â†’ Astro API Route Handler
   â”śâ”€ Parsowanie sessionId z URL
   â”śâ”€ Parsowanie query parameters (bucket_value)
   â””â”€ Walidacja formatu danych (Zod)

2. Authentication Check
   â”śâ”€ Sprawdzenie czy user jest zalogowany (auth.uid())
   â””â”€ JeĹ›li nie â†’ 401 Unauthorized

3. Service Layer: cards.service.ts
   â”‚
   â”śâ”€ validateSessionOwnership(supabase, userId, sessionId)
   â”‚  â”śâ”€ Query: SELECT user_id FROM sessions WHERE id = sessionId
   â”‚  â”śâ”€ Sprawdzenie czy user_id === auth.uid()
   â”‚  â””â”€ JeĹ›li nie istnieje lub nie naleĹĽy â†’ 404 Not Found
   â”‚
   â””â”€ getCardsBySession(supabase, sessionId, filters?)
      â”śâ”€ Query: SELECT * FROM cards WHERE session_id = sessionId
      â”‚  [+ AND bucket_value = filter.bucket_value jeĹ›li podany]
      â”‚  ORDER BY created_at DESC
      â”śâ”€ Transformacja CardEntity[] â†’ CardDTO[] (has_embedding calculation)
      â””â”€ Return CardDTO[]

4. Response
   â””â”€ 200 OK + CardsListResponseDTO
```

### Interakcje z bazÄ… danych:

**Tabela: sessions**

- SELECT dla weryfikacji wĹ‚aĹ›ciciela
- Wykorzystanie RLS policy: "Users can view own sessions"

**Tabela: cards**

- SELECT dla pobrania listy kart z opcjonalnym filtrowaniem
- Wykorzystanie RLS policy: "Users can view cards from own sessions"

### Wykorzystywane indeksy:

- `idx_sessions_user_id` â†’ dla session ownership check
- `idx_cards_session_bucket` â†’ dla filtrowania po (session_id, bucket_value)

---

## 6. WzglÄ™dy bezpieczeĹ„stwa

### 1. Uwierzytelnianie (Authentication)

- **Mechanizm**: Supabase JWT token w header Authorization
- **Weryfikacja**: `context.locals.supabase.auth.getUser()`
- **Response**: 401 Unauthorized jeĹ›li token brak/nieprawidĹ‚owy

### 2. Autoryzacja (Authorization)

- **RLS Policy**: "Users can view cards from own sessions"
  ```sql
  using (
    exists (
      select 1 from sessions
      where sessions.id = cards.session_id
        and sessions.user_id = auth.uid()
    )
  )
  ```
- **Dodatkowa weryfikacja**: Jawne sprawdzenie wĹ‚aĹ›ciciela sesji przed operacjÄ…
- **Protection**: IDOR (Insecure Direct Object Reference) prevention

### 3. Walidacja danych wejĹ›ciowych (Input Validation)

- **Zod schema**: Walidacja bucket_value (jeĹ›li podany)
- **SQL Injection**: Zapobieganie przez parametryzowane zapytania Supabase
- **Type coercion**: Konwersja string query param â†’ number/null

### 4. Business Logic Security

- **Izolacja danych**: UĹĽytkownik widzi tylko karty z wĹ‚asnych sesji
- **Brak limitĂłw**: GET operation, brak limitu na liczbÄ™ zwracanych kart (max 50 per sesja)

### 5. Error Disclosure

- **Nie ujawniaÄ‡**: Stack traces, szczegĂłĹ‚y bazy danych, wewnÄ™trzne Ĺ›cieĹĽki
- **ZwracaÄ‡**: OgĂłlne komunikaty bĹ‚Ä™dĂłw (500: "An unexpected error occurred")
- **LogowaÄ‡**: SzczegĂłĹ‚owe bĹ‚Ä™dy po stronie serwera (console.error)

---

## 7. ObsĹ‚uga bĹ‚Ä™dĂłw

### Hierarchia bĹ‚Ä™dĂłw (kolejnoĹ›Ä‡ sprawdzania):

#### 1. Format danych (400 Bad Request)

**Sytuacja:**

- NieprawidĹ‚owy format UUID dla sessionId
- NieprawidĹ‚owa wartoĹ›Ä‡ bucket_value (nie w dozwolonym zbiorze)

**Handling:**

```typescript
try {
  const sessionId = sessionIdParamSchema.parse(params.sessionId);

  const url = new URL(request.url);
  const bucketValueParam = url.searchParams.get("bucket_value");

  if (bucketValueParam !== null) {
    const validatedParams = cardsQueryParamsSchema.parse({
      bucket_value: bucketValueParam,
    });
  }
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
- Token wygasĹ‚y lub nieprawidĹ‚owy

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

#### 3. Sesja nie istnieje / brak dostÄ™pu (404 Not Found)

**Sytuacja:**

- Sesja o danym ID nie istnieje
- Sesja istnieje, ale naleĹĽy do innego uĹĽytkownika

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

#### 4. BĹ‚Ä…d bazy danych (500 Internal Server Error)

**Sytuacja:**

- Nieoczekiwany bĹ‚Ä…d podczas operacji na bazie
- BĹ‚Ä…d poĹ‚Ä…czenia z Supabase

**Handling:**

```typescript
try {
  // ... operacje na bazie
} catch (error) {
  console.error("Error fetching cards:", error);
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

## 8. RozwaĹĽania dotyczÄ…ce wydajnoĹ›ci

### Potencjalne wÄ…skie gardĹ‚a:

#### 1. Pobieranie duĹĽej liczby kart

**Problem:**

- Maksymalnie 50 kart per sesja (limit aplikacji)
- Wszystkie karty zwracane w jednym response (brak paginacji)

**Optymalizacja:**

- Limit 50 kart jest akceptowalny dla pojedynczego response
- Brak potrzeby paginacji dla MVP
- MoĹĽliwe dodanie paginacji w przyszĹ‚oĹ›ci jeĹ›li limit zostanie zwiÄ™kszony

#### 2. Transformacja embedding â†’ has_embedding

**Problem:**

- Pole embedding ma 1536 wymiarĂłw (duĹĽy rozmiar)
- Transformacja do has_embedding wymaga sprawdzenia null

**Optymalizacja:**

```typescript
// W zapytaniu SELECT wykluczyÄ‡ pole embedding
const { data } = await supabase
  .from("cards")
  .select("id, session_id, external_id, title, description, bucket_value, created_at, updated_at, embedding")
  .eq("session_id", sessionId);

// Alternatywnie: uĹĽyÄ‡ SQL do obliczenia has_embedding
// embedding IS NOT NULL AS has_embedding
```

#### 3. Indeksy bazy danych

**Wykorzystywane indeksy:**

- `idx_sessions_user_id` â†’ dla session ownership check
- `idx_cards_session_bucket` â†’ dla filtrowania po (session_id, bucket_value)

**Optymalizacja:**
Indeks `idx_cards_session_bucket` jest optymalny dla tego endpointu:

- Filtrowanie po session_id + bucket_value
- Szybkie wyszukiwanie kart w kubeĹ‚kach

#### 4. Sortowanie wynikĂłw

**DomyĹ›lne sortowanie:**

- ORDER BY created_at DESC (najnowsze karty pierwsze)
- MoĹĽliwe dodanie innych opcji sortowania w przyszĹ‚oĹ›ci

### Strategie cachowania:

- **Cache sesji**: Session ownership moĹĽna cache'owaÄ‡ w ramach jednego ĹĽÄ…dania
- **Cache kart**: RozwaĹĽyÄ‡ cachowanie na poziomie aplikacji dla czÄ™sto odczytywanych sesji
- **ETag/Last-Modified**: MoĹĽliwe dodanie dla optymalizacji conditional requests

### Monitoring wydajnoĹ›ci:

- Logowanie czasu wykonania operacji
- Tracking liczby zapytaĹ„ do bazy
- Monitoring rozmiarĂłw response

---

## 9. Etapy wdroĹĽenia

### Krok 1: Rozszerzenie Zod schemas dla walidacji

**Plik:** `src/lib/schemas/cards.schema.ts`

```typescript
import { z } from "zod";

// IstniejÄ…ce schemas...

// Nowy schema dla query parameters
const VALID_BUCKET_VALUES = [0, 1, 2, 3, 5, 8, 13, 21];

export const cardsQueryParamsSchema = z.object({
  bucket_value: z
    .union([z.literal("null"), z.coerce.number().int()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === "null") return null;
      return val;
    })
    .refine((val) => val === undefined || val === null || VALID_BUCKET_VALUES.includes(val), {
      message: "Invalid bucket_value. Must be one of: null, 0, 1, 2, 3, 5, 8, 13, 21",
    }),
});
```

**Weryfikacja:**

- Schema parsuje poprawne wartoĹ›ci (0-21, null, undefined)
- Schema odrzuca nieprawidĹ‚owe wartoĹ›ci z odpowiednimi komunikatami
- Transformacja string "null" â†’ null dziaĹ‚a poprawnie

---

### Krok 2: Rozszerzenie serwisu dla logiki biznesowej

**Plik:** `src/lib/services/cards.service.ts`

```typescript
// IstniejÄ…ce funkcje...

/**
 * Pobiera karty z sesji z opcjonalnym filtrowaniem po bucket_value
 * @param supabase - Klient Supabase
 * @param sessionId - ID sesji
 * @param filters - Opcjonalne filtry (bucket_value)
 * @returns Lista kart jako CardDTO[]
 */
export async function getCardsBySession(
  supabase: SupabaseClientType,
  sessionId: string,
  filters?: { bucket_value?: BucketValue }
): Promise<CardDTO[]> {
  let query = supabase.from("cards").select("*").eq("session_id", sessionId).order("created_at", { ascending: false });

  // Filtrowanie po bucket_value jeĹ›li podane
  if (filters?.bucket_value !== undefined) {
    if (filters.bucket_value === null) {
      query = query.is("bucket_value", null);
    } else {
      query = query.eq("bucket_value", filters.bucket_value);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Transformacja do DTO
  return (data || []).map(transformCardEntityToDTO);
}
```

**Weryfikacja:**

- Funkcja zwraca wszystkie karty gdy brak filtrĂłw
- Funkcja filtruje po bucket_value gdy podany
- Funkcja obsĹ‚uguje bucket_value = null
- Sortowanie dziaĹ‚a poprawnie (created_at DESC)

---

### Krok 3: Rozszerzenie API route handler

**Plik:** `src/pages/api/sessions/[sessionId]/cards/index.ts`

```typescript
import type { APIRoute } from "astro";
import { cardCreateSchema, sessionIdParamSchema, cardsQueryParamsSchema } from "@/lib/schemas/cards.schema";
import {
  validateSessionOwnership,
  getCardsCountInSession,
  checkExternalIdUniqueness,
  createCard,
  getCardsBySession,
} from "@/lib/services/cards.service";
import type { APIErrorDTO, CardResponseDTO, CardsListResponseDTO } from "@/types";
import { z } from "zod";

export const prerender = false;

// IstniejÄ…cy POST handler...

export const GET: APIRoute = async ({ request, params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Walidacja sessionId z URL
    const sessionId = sessionIdParamSchema.parse(params.sessionId);

    // 2. Parsowanie i walidacja query parameters
    const url = new URL(request.url);
    const bucketValueParam = url.searchParams.get("bucket_value");

    let filters: { bucket_value?: number | null } | undefined;

    if (bucketValueParam !== null) {
      const validatedParams = cardsQueryParamsSchema.parse({
        bucket_value: bucketValueParam,
      });
      filters = { bucket_value: validatedParams.bucket_value };
    }

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

    // 4. Sprawdzenie czy sesja istnieje i naleĹĽy do uĹĽytkownika
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

    // 5. Pobranie kart z opcjonalnym filtrowaniem
    const cards = await getCardsBySession(supabase, sessionId, filters);

    // 6. ZwrĂłcenie odpowiedzi 200
    const response: CardsListResponseDTO = {
      data: cards,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ObsĹ‚uga bĹ‚Ä™dĂłw walidacji Zod
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

    // OgĂłlny bĹ‚Ä…d serwera
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
```

**Weryfikacja:**

- Endpoint odpowiada na GET requests
- Wszystkie kody statusu sÄ… poprawne
- Query parameters sÄ… poprawnie parsowane
- Error handling dziaĹ‚a zgodnie z planem

---

### Krok 4: Testowanie endpointu

#### Test 1: Sukces - wszystkie karty (200 OK)

```bash
curl -X GET http://localhost:4321/api/sessions/{valid-session-id}/cards \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 200 + CardsListResponseDTO z listÄ… wszystkich kart

#### Test 2: Sukces - filtrowanie po bucket_value (200 OK)

```bash
# Karty z bucket_value = 5
curl -X GET "http://localhost:4321/api/sessions/{valid-session-id}/cards?bucket_value=5" \
  -H "Authorization: Bearer {valid-jwt-token}"

# Karty nieoszacowane (bucket_value = null)
curl -X GET "http://localhost:4321/api/sessions/{valid-session-id}/cards?bucket_value=null" \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 200 + CardsListResponseDTO z przefiltrowanÄ… listÄ…

#### Test 3: Sukces - pusta lista (200 OK)

```bash
# Sesja bez kart lub brak kart speĹ‚niajÄ…cych filtr
curl -X GET "http://localhost:4321/api/sessions/{empty-session-id}/cards" \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 200 + `{ "data": [] }`

#### Test 4: Brak autentykacji (401)

```bash
curl -X GET http://localhost:4321/api/sessions/{valid-session-id}/cards
```

**Oczekiwany rezultat:** 401 + UNAUTHORIZED error

#### Test 5: NieprawidĹ‚owy sessionId (400)

```bash
curl -X GET http://localhost:4321/api/sessions/invalid-uuid/cards \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR

#### Test 6: NieprawidĹ‚owy bucket_value (400)

```bash
curl -X GET "http://localhost:4321/api/sessions/{valid-session-id}/cards?bucket_value=999" \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR z komunikatem o nieprawidĹ‚owym bucket_value

#### Test 7: Sesja nie istnieje (404)

```bash
curl -X GET http://localhost:4321/api/sessions/00000000-0000-0000-0000-000000000000/cards \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND

---

### Krok 5: Testowanie bezpieczeĹ„stwa

#### Test RLS: PrĂłba pobrania kart z cudzej sesji

```bash
# User A tworzy sesjÄ™ z kartami
# User B prĂłbuje pobraÄ‡ karty z sesji User A
curl -X GET http://localhost:4321/api/sessions/{user-a-session-id}/cards \
  -H "Authorization: Bearer {user-b-jwt-token}"
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND (RLS policy blokuje dostÄ™p)

#### Test SQL Injection w query parameters

```bash
curl -X GET "http://localhost:4321/api/sessions/{valid-session-id}/cards?bucket_value=5%20OR%201=1" \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR (Zod validation odrzuca nieprawidĹ‚owÄ… wartoĹ›Ä‡)

#### Test Large Response

```bash
# Sesja z 50 kartami (max limit)
curl -X GET http://localhost:4321/api/sessions/{full-session-id}/cards \
  -H "Authorization: Bearer {valid-jwt-token}"
```

**Oczekiwany rezultat:** 200 + wszystkie 50 kart w response

---

### Krok 6: Optymalizacja (opcjonalne)

#### Wykluczenie pola embedding z SELECT

```typescript
// W getCardsBySession()
let query = supabase
  .from("cards")
  .select("id, session_id, external_id, title, description, bucket_value, created_at, updated_at, embedding")
  .eq("session_id", sessionId);

// Alternatywnie: uĹĽyj computed column has_embedding na poziomie bazy
```

#### Dodanie cache dla czÄ™sto odczytywanych sesji

```typescript
// MoĹĽliwe w przyszĹ‚oĹ›ci
const cacheKey = `cards:${sessionId}:${JSON.stringify(filters)}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return cached;
}

const cards = await getCardsBySession(supabase, sessionId, filters);
await cache.set(cacheKey, cards, { ttl: 60 }); // 60 sekund
```

#### Conditional requests (ETag)

```typescript
// W przyszĹ‚oĹ›ci moĹĽna dodaÄ‡ ETag based caching
const etag = generateETag(cards);
response.headers.set("ETag", etag);

if (request.headers.get("If-None-Match") === etag) {
  return new Response(null, { status: 304 });
}
```

---

### Krok 7: Dokumentacja

#### Dodanie JSDoc do funkcji serwisu

```typescript
/**
 * Pobiera karty z sesji z opcjonalnym filtrowaniem po bucket_value
 *
 * @param supabase - Klient Supabase z typami Database
 * @param sessionId - UUID sesji
 * @param filters - Opcjonalne filtry
 * @param filters.bucket_value - WartoĹ›Ä‡ kubeĹ‚ka do filtrowania (null | 0-21)
 * @returns Promise z listÄ… CardDTO
 * @throws {Error} JeĹ›li zapytanie do bazy danych nie powiedzie siÄ™
 *
 * @example
 * // Wszystkie karty
 * const cards = await getCardsBySession(supabase, sessionId);
 *
 * @example
 * // Tylko karty z bucket_value = 5
 * const cards = await getCardsBySession(supabase, sessionId, { bucket_value: 5 });
 *
 * @example
 * // Tylko karty nieoszacowane
 * const cards = await getCardsBySession(supabase, sessionId, { bucket_value: null });
 */
```

#### Code review checklist

- [ ] Wszystkie typy sÄ… poprawne
- [ ] Walidacja Zod dziaĹ‚a dla query params
- [ ] Wszystkie scenariusze bĹ‚Ä™dĂłw obsĹ‚uĹĽone
- [ ] RLS policies testowane
- [ ] Brak SQL injection vulnerabilities
- [ ] Proper error logging
- [ ] Kod zgodny z Prettier config
- [ ] Early returns dla bĹ‚Ä™dĂłw
- [ ] Filtrowanie dziaĹ‚a dla wszystkich wartoĹ›ci bucket_value

---

### Krok 8: Monitoring i logging

#### Dodanie logowania dla production

```typescript
// W route handler
console.log(`[GET /api/sessions/:sessionId/cards] User ${user.id} fetching cards from session ${sessionId}`, {
  filters,
  cardsCount: cards.length,
});

// W przypadku bĹ‚Ä™dĂłw
console.error(`[GET /api/sessions/:sessionId/cards] Error fetching cards:`, {
  userId: user.id,
  sessionId,
  filters,
  error: error.message,
  stack: error.stack,
});
```

#### Metryki do trackowania

- Liczba pobranych kart per request
- CzÄ™stotliwoĹ›Ä‡ uĹĽycia filtrĂłw bucket_value
- Czas wykonania zapytania do bazy
- Rozmiar response (bytes)
- Cache hit rate (jeĹ›li cache zostanie dodany)

---

## 10. Podsumowanie

Endpoint **GET /api/sessions/:sessionId/cards** zostaĹ‚ zaprojektowany z naciskiem na:

âś… **BezpieczeĹ„stwo**

- RLS policies + jawna walidacja wĹ‚aĹ›ciciela
- Parametryzowane zapytania (SQL injection protection)
- Query parameter validation (Zod)

âś… **FunkcjonalnoĹ›Ä‡**

- Pobieranie wszystkich kart w sesji
- Opcjonalne filtrowanie po bucket_value (null, 0-21)
- Sortowanie po created_at DESC

âś… **Clean code**

- Logika wyodrÄ™bniona do service layer
- Early returns dla bĹ‚Ä™dĂłw
- Proper error handling
- ZgodnoĹ›Ä‡ z Prettier config

âś… **WydajnoĹ›Ä‡**

- Wykorzystanie istniejÄ…cych indeksĂłw (idx_cards_session_bucket)
- MoĹĽliwoĹ›Ä‡ dodania cache w przyszĹ‚oĹ›ci
- Optymalizacja SELECT (wykluczenie embedding)

âś… **TestowalnoĹ›Ä‡**

- Service functions Ĺ‚atwe do mockowania
- Jasne scenariusze testowe
- Kompletna obsĹ‚uga bĹ‚Ä™dĂłw
- Testowanie filtrĂłw
