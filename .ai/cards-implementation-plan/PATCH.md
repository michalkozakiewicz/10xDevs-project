# API Endpoint Implementation Plan: PATCH /api/sessions/:sessionId/cards/:id

## 1. PrzeglÄ…d punktu koĹ„cowego

Endpoint umoĹĽliwia aktualizacjÄ™ danych pojedynczej karty zadania w ramach sesji estymacji. Pozwala na zmianÄ™ tytuĹ‚u, opisu i wartoĹ›ci kubeĹ‚ka.

**Kluczowe funkcjonalnoĹ›ci:**

- Aktualizacja tytuĹ‚u karty
- Aktualizacja opisu karty
- Aktualizacja bucket_value (przypisanie do kubeĹ‚ka)
- Weryfikacja dostÄ™pu do karty przez sesjÄ™
- Wszystkie pola sÄ… opcjonalne (partial update)

---

## 2. SzczegĂłĹ‚y ĹĽÄ…dania

### Metoda HTTP

`PATCH`

### Struktura URL

```
/api/sessions/:sessionId/cards/:id
```

### Parametry URL

- **sessionId** (UUID, wymagany)
  - Unikalny identyfikator sesji
  - Musi byÄ‡ prawidĹ‚owym UUID
  - Sesja musi naleĹĽeÄ‡ do zalogowanego uĹĽytkownika

- **id** (UUID, wymagany)
  - Unikalny identyfikator karty
  - Musi byÄ‡ prawidĹ‚owym UUID
  - Karta musi naleĹĽeÄ‡ do podanej sesji

### Request Body

```typescript
{
  title?: string;              // Opcjonalny, min 1 znak
  description?: string | null; // Opcjonalny, null aby usunÄ…Ä‡
  bucket_value?: BucketValue;  // Opcjonalny (null, 0-21)
}
```

**Wszystkie pola sÄ… opcjonalne** - moĹĽna zaktualizowaÄ‡ tylko wybrane pola.

### Headers

```
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

### PrzykĹ‚adowe ĹĽÄ…dania

```json
// Aktualizacja tylko bucket_value
{
  "bucket_value": 8
}

// Aktualizacja tytuĹ‚u i opisu
{
  "title": "Updated task title",
  "description": "Updated description"
}

// UsuniÄ™cie opisu
{
  "description": null
}

// Aktualizacja wszystkich pĂłl
{
  "title": "New title",
  "description": "New description",
  "bucket_value": 5
}
```

---

## 3. Wykorzystywane typy

### Request Types

```typescript
// z src/types.ts
interface CardUpdateCommand {
  title?: string;
  description?: string | null;
  bucket_value?: BucketValue;
}

type BucketValue = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | null;
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
  bucket_value: BucketValue;
  has_embedding: boolean;
  created_at: string; // ISO8601
  updated_at: string; // ISO8601 - zostanie automatycznie zaktualizowane
}
```

### Database Types

```typescript
// z src/types.ts
type CardUpdate = Database["public"]["Tables"]["cards"]["Update"];
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
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "123e4567-e89b-12d3-a456-426614174000",
    "external_id": "TASK-123",
    "title": "Updated title",
    "description": "Updated description",
    "bucket_value": 8,
    "has_embedding": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - NieprawidĹ‚owe dane wejĹ›ciowe

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

#### 400 Bad Request - Puste body

```json
{
  "code": "EMPTY_UPDATE",
  "message": "At least one field must be provided for update"
}
```

#### 401 Unauthorized - Brak autentykacji

```json
{
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

#### 404 Not Found - Karta nie istnieje lub sesja nie naleĹĽy do uĹĽytkownika

```json
{
  "code": "CARD_NOT_FOUND",
  "message": "Card not found or access denied"
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
   â”śâ”€ Parsowanie sessionId i cardId z URL
   â”śâ”€ Parsowanie request body
   â””â”€ Walidacja formatu danych (Zod)

2. Authentication Check
   â”śâ”€ Sprawdzenie czy user jest zalogowany (auth.uid())
   â””â”€ JeĹ›li nie â†’ 401 Unauthorized

3. Validation Check
   â”śâ”€ Sprawdzenie czy body nie jest pusty
   â””â”€ JeĹ›li pusty â†’ 400 Bad Request (EMPTY_UPDATE)

4. Service Layer: cards.service.ts
   â”‚
   â”śâ”€ validateSessionOwnership(supabase, userId, sessionId)
   â”‚  â”śâ”€ Query: SELECT user_id FROM sessions WHERE id = sessionId
   â”‚  â”śâ”€ Sprawdzenie czy user_id === auth.uid()
   â”‚  â””â”€ JeĹ›li nie istnieje lub nie naleĹĽy â†’ 404 Not Found
   â”‚
   â”śâ”€ getCardById(supabase, cardId, sessionId)
   â”‚  â”śâ”€ Query: SELECT * FROM cards WHERE id = cardId AND session_id = sessionId
   â”‚  â””â”€ JeĹ›li nie istnieje â†’ 404 Not Found
   â”‚
   â””â”€ updateCard(supabase, cardId, command)
      â”śâ”€ UPDATE cards SET
      â”‚  title = COALESCE(command.title, title),
      â”‚  description = COALESCE(command.description, description),
      â”‚  bucket_value = COALESCE(command.bucket_value, bucket_value)
      â”‚  WHERE id = cardId
      â”‚  RETURNING *
      â”śâ”€ Transformacja CardEntity â†’ CardDTO (has_embedding = embedding !== null)
      â””â”€ Return CardDTO

5. Response
   â””â”€ 200 OK + CardResponseDTO
```

### Interakcje z bazÄ… danych:

**Tabela: sessions**

- SELECT dla weryfikacji wĹ‚aĹ›ciciela
- Wykorzystanie RLS policy: "Users can view own sessions"

**Tabela: cards**

- SELECT dla sprawdzenia czy karta istnieje w sesji
- UPDATE dla aktualizacji danych karty
- Wykorzystanie RLS policy: "Users can update cards in own sessions"

### Automatyczne operacje bazy danych:

- `updated_at` â†’ automatycznie `now()` przez Trigger `cards_updated_at`
- RLS policy automatycznie weryfikuje dostÄ™p do karty przez sesjÄ™

---

## 6. WzglÄ™dy bezpieczeĹ„stwa

### 1. Uwierzytelnianie (Authentication)

- **Mechanizm**: Supabase JWT token w header Authorization
- **Weryfikacja**: `context.locals.supabase.auth.getUser()`
- **Response**: 401 Unauthorized jeĹ›li token brak/nieprawidĹ‚owy

### 2. Autoryzacja (Authorization)

- **RLS Policy**: "Users can update cards in own sessions"
  ```sql
  using (
    exists (
      select 1 from sessions
      where sessions.id = cards.session_id
        and sessions.user_id = auth.uid()
    )
  )
  with check (
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

- **Zod schema**: Walidacja typu i formatu danych
- **Partial update**: Wszystkie pola opcjonalne, ale minimum jedno wymagane
- **Bucket value**: Walidacja dozwolonych wartoĹ›ci (null, 0-21)
- **SQL Injection**: Zapobieganie przez parametryzowane zapytania Supabase
- **Length limits**: Sprawdzenie min dĹ‚ugoĹ›ci dla title (jeĹ›li podany)

### 4. Business Logic Security

- **Immutable fields**: external_id nie moĹĽe byÄ‡ zaktualizowany (nie ma w UpdateCommand)
- **Izolacja danych**: UĹĽytkownik aktualizuje tylko karty z wĹ‚asnych sesji
- **Weryfikacja sesji**: Karta musi naleĹĽeÄ‡ do podanej sesji

### 5. Error Disclosure

- **Nie ujawniaÄ‡**: Stack traces, szczegĂłĹ‚y bazy danych, wewnÄ™trzne Ĺ›cieĹĽki
- **ZwracaÄ‡**: OgĂłlne komunikaty bĹ‚Ä™dĂłw (500: "An unexpected error occurred")
- **LogowaÄ‡**: SzczegĂłĹ‚owe bĹ‚Ä™dy po stronie serwera (console.error)

---

## 7. ObsĹ‚uga bĹ‚Ä™dĂłw

### Hierarchia bĹ‚Ä™dĂłw (kolejnoĹ›Ä‡ sprawdzania):

#### 1. Format danych (400 Bad Request)

**Sytuacja:**

- NieprawidĹ‚owy format UUID dla sessionId lub cardId
- NieprawidĹ‚owy typ danych w body
- NieprawidĹ‚owa wartoĹ›Ä‡ bucket_value

**Handling:**

```typescript
try {
  const sessionId = sessionIdParamSchema.parse(params.sessionId);
  const cardId = cardIdParamSchema.parse(params.id);

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        code: "INVALID_JSON",
        message: "Invalid JSON in request body",
      }),
      { status: 400 }
    );
  }

  const validatedBody = cardUpdateSchema.parse(body);
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

#### 2. Puste body (400 Bad Request)

**Sytuacja:**

- Request body jest pusty (brak pĂłl do aktualizacji)

**Handling:**

```typescript
if (Object.keys(validatedBody).length === 0) {
  return new Response(
    JSON.stringify({
      code: "EMPTY_UPDATE",
      message: "At least one field must be provided for update",
    }),
    { status: 400 }
  );
}
```

#### 3. Autentykacja (401 Unauthorized)

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

#### 4. Sesja nie istnieje / brak dostÄ™pu (404 Not Found)

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

#### 5. Karta nie istnieje (404 Not Found)

**Sytuacja:**

- Karta o danym ID nie istnieje
- Karta istnieje, ale nie naleĹĽy do podanej sesji

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

#### 6. BĹ‚Ä…d bazy danych (500 Internal Server Error)

**Sytuacja:**

- Nieoczekiwany bĹ‚Ä…d podczas operacji na bazie
- BĹ‚Ä…d poĹ‚Ä…czenia z Supabase

**Handling:**

```typescript
try {
  // ... operacje na bazie
} catch (error) {
  console.error("Error updating card:", error);
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

#### 1. Wielokrotne zapytania do bazy danych

**Problem:**

- 2 osobne SELECT (session ownership, card existence)
- 1 UPDATE
- KaĹĽde zapytanie = round-trip do Supabase

**Optymalizacja:**

```typescript
// MoĹĽliwe poĹ‚Ä…czenie sprawdzenia sesji i karty w jedno zapytanie
const { data } = await supabase
  .from("cards")
  .select(
    `
    *,
    session:sessions!inner(user_id)
  `
  )
  .eq("id", cardId)
  .eq("session_id", sessionId)
  .eq("session.user_id", userId)
  .single();

// Sprawdzenie w jednym zapytaniu:
// - Czy karta istnieje
// - Czy naleĹĽy do sesji
// - Czy sesja naleĹĽy do uĹĽytkownika (RLS + JOIN)
```

#### 2. Partial update optimization

**Problem:**

- Aktualizacja tylko zmienionych pĂłl

**Optymalizacja:**

```typescript
// Budowanie dynamicznego UPDATE tylko dla podanych pĂłl
const updateData: Partial<CardUpdate> = {};

if (validatedBody.title !== undefined) {
  updateData.title = validatedBody.title;
}
if (validatedBody.description !== undefined) {
  updateData.description = validatedBody.description;
}
if (validatedBody.bucket_value !== undefined) {
  updateData.bucket_value = validatedBody.bucket_value;
}

// UPDATE tylko z podanymi polami
await supabase.from("cards").update(updateData).eq("id", cardId);
```

#### 3. Indeksy bazy danych

**Wykorzystywane indeksy:**

- Primary key index na `cards.id` â†’ dla UPDATE
- `idx_sessions_user_id` â†’ dla session ownership check

**Optymalizacja:**
IstniejÄ…ce indeksy sÄ… wystarczajÄ…ce dla tego endpointu.

#### 4. Trigger updated_at

**Automatyczna operacja:**

- Trigger `cards_updated_at` automatycznie aktualizuje `updated_at`
- Niewielki overhead, ale konieczny dla audytu

### Strategie cachowania:

- **Brak cachowania** dla tego endpointu (PATCH operation)
- Session ownership moĹĽna cache'owaÄ‡ w ramach jednego ĹĽÄ…dania (memoization)
- Cache invalidation: Po UPDATE naleĹĽy invalidate cache dla GET operations

### Monitoring wydajnoĹ›ci:

- Logowanie czasu wykonania operacji
- Tracking liczby zapytaĹ„ do bazy
- Monitoring czÄ™stotliwoĹ›ci aktualizacji bucket_value vs title/description

---

## 9. Etapy wdroĹĽenia

### Krok 1: Rozszerzenie Zod schemas dla walidacji

**Plik:** `src/lib/schemas/cards.schema.ts`

```typescript
import { z } from "zod";

// IstniejÄ…ce schemas...

// Nowy schema dla PATCH request
const VALID_BUCKET_VALUES = [0, 1, 2, 3, 5, 8, 13, 21];

export const cardUpdateSchema = z.object({
  title: z.string().min(1, "title must not be empty").optional(),
  description: z.string().nullable().optional(),
  bucket_value: z
    .union([z.literal(null), z.number().int()])
    .refine((val) => val === null || VALID_BUCKET_VALUES.includes(val), {
      message: "Invalid bucket_value. Must be one of: null, 0, 1, 2, 3, 5, 8, 13, 21",
    })
    .optional(),
});

export const cardIdParamSchema = z.string().uuid("Invalid card ID format");
```

**Weryfikacja:**

- Schema parsuje poprawne partial updates
- Schema odrzuca nieprawidĹ‚owe wartoĹ›ci z odpowiednimi komunikatami
- Wszystkie pola sÄ… opcjonalne

---

### Krok 2: Rozszerzenie serwisu dla logiki biznesowej

**Plik:** `src/lib/services/cards.service.ts`

```typescript
// IstniejÄ…ce funkcje...

/**
 * Pobiera kartÄ™ po ID z weryfikacjÄ… sesji
 * @param supabase - Klient Supabase
 * @param cardId - ID karty
 * @param sessionId - ID sesji
 * @returns CardEntity jeĹ›li istnieje i naleĹĽy do sesji, null w przeciwnym razie
 */
export async function getCardById(
  supabase: SupabaseClientType,
  cardId: string,
  sessionId: string
): Promise<CardEntity | null> {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .eq("session_id", sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Aktualizuje kartÄ™
 * @param supabase - Klient Supabase
 * @param cardId - ID karty
 * @param command - Dane do aktualizacji
 * @returns Zaktualizowana karta jako CardDTO
 */
export async function updateCard(
  supabase: SupabaseClientType,
  cardId: string,
  command: CardUpdateCommand
): Promise<CardDTO> {
  // Budowanie obiektu update tylko z podanymi polami
  const updateData: Partial<CardUpdate> = {};

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
```

**Weryfikacja:**

- `getCardById` zwraca kartÄ™ jeĹ›li istnieje w sesji
- `getCardById` zwraca null jeĹ›li karta nie istnieje lub nie naleĹĽy do sesji
- `updateCard` aktualizuje tylko podane pola
- Typy sÄ… poprawne

---

### Krok 3: Utworzenie API route handler

**Plik:** `src/pages/api/sessions/[sessionId]/cards/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { cardUpdateSchema, sessionIdParamSchema, cardIdParamSchema } from "@/lib/schemas/cards.schema";
import { validateSessionOwnership, getCardById, updateCard } from "@/lib/services/cards.service";
import type { APIErrorDTO, CardResponseDTO } from "@/types";
import { z } from "zod";

export const prerender = false;

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  const supabase = locals.supabase;

  try {
    // 1. Walidacja sessionId i cardId z URL
    const sessionId = sessionIdParamSchema.parse(params.sessionId);
    const cardId = cardIdParamSchema.parse(params.id);

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

    const validatedBody = cardUpdateSchema.parse(body);

    // 3. Sprawdzenie czy body nie jest pusty
    if (Object.keys(validatedBody).length === 0) {
      const errorResponse: APIErrorDTO = {
        code: "EMPTY_UPDATE",
        message: "At least one field must be provided for update",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Sprawdzenie autentykacji
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

    // 5. Sprawdzenie czy sesja istnieje i naleĹĽy do uĹĽytkownika
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

    // 6. Sprawdzenie czy karta istnieje w sesji
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

    // 7. Aktualizacja karty
    const updatedCard = await updateCard(supabase, cardId, validatedBody);

    // 8. ZwrĂłcenie odpowiedzi 200
    const response: CardResponseDTO = {
      data: updatedCard,
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
    console.error("Error updating card:", error);
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

- Endpoint odpowiada na PATCH requests
- Wszystkie kody statusu sÄ… poprawne
- Partial update dziaĹ‚a poprawnie
- Error handling dziaĹ‚a zgodnie z planem

---

### Krok 4: Testowanie endpointu

#### Test 1: Sukces - aktualizacja bucket_value (200 OK)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "bucket_value": 8
  }'
```

**Oczekiwany rezultat:** 200 + CardResponseDTO z zaktualizowanym bucket_value

#### Test 2: Sukces - aktualizacja title i description (200 OK)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "title": "Updated task title",
    "description": "Updated description"
  }'
```

**Oczekiwany rezultat:** 200 + CardResponseDTO z zaktualizowanymi danymi

#### Test 3: Sukces - usuniÄ™cie description (200 OK)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "description": null
  }'
```

**Oczekiwany rezultat:** 200 + CardResponseDTO z description = null

#### Test 4: Sukces - aktualizacja wszystkich pĂłl (200 OK)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "title": "Completely new title",
    "description": "Completely new description",
    "bucket_value": 13
  }'
```

**Oczekiwany rezultat:** 200 + CardResponseDTO z wszystkimi zaktualizowanymi polami

#### Test 5: Brak autentykacji (401)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -d '{
    "bucket_value": 5
  }'
```

**Oczekiwany rezultat:** 401 + UNAUTHORIZED error

#### Test 6: NieprawidĹ‚owy sessionId (400)

```bash
curl -X PATCH http://localhost:4321/api/sessions/invalid-uuid/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "bucket_value": 5
  }'
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR

#### Test 7: NieprawidĹ‚owy cardId (400)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/invalid-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "bucket_value": 5
  }'
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR

#### Test 8: NieprawidĹ‚owy bucket_value (400)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "bucket_value": 999
  }'
```

**Oczekiwany rezultat:** 400 + VALIDATION_ERROR z komunikatem o nieprawidĹ‚owym bucket_value

#### Test 9: Pusty request body (400)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{}'
```

**Oczekiwany rezultat:** 400 + EMPTY_UPDATE error

#### Test 10: Sesja nie istnieje (404)

```bash
curl -X PATCH http://localhost:4321/api/sessions/00000000-0000-0000-0000-000000000000/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "bucket_value": 5
  }'
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND

#### Test 11: Karta nie istnieje (404)

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "bucket_value": 5
  }'
```

**Oczekiwany rezultat:** 404 + CARD_NOT_FOUND

#### Test 12: Karta z innej sesji (404)

```bash
# UĹĽyj valid-card-id z session-1, ale podaj session-2 w URL
curl -X PATCH http://localhost:4321/api/sessions/{session-2-id}/cards/{session-1-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "bucket_value": 5
  }'
```

**Oczekiwany rezultat:** 404 + CARD_NOT_FOUND

---

### Krok 5: Testowanie bezpieczeĹ„stwa

#### Test RLS: PrĂłba aktualizacji karty w cudzej sesji

```bash
# User A tworzy sesjÄ™ z kartÄ…
# User B prĂłbuje zaktualizowaÄ‡ kartÄ™ z sesji User A
curl -X PATCH http://localhost:4321/api/sessions/{user-a-session-id}/cards/{user-a-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {user-b-jwt-token}" \
  -d '{
    "bucket_value": 5
  }'
```

**Oczekiwany rezultat:** 404 + SESSION_NOT_FOUND (RLS policy blokuje dostÄ™p)

#### Test immutable fields: PrĂłba zmiany external_id

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "external_id": "HACKED-001",
    "title": "New title"
  }'
```

**Oczekiwany rezultat:** 200 + title zaktualizowany, ale external_id pozostaje bez zmian (pole nie jest w CardUpdateCommand)

#### Test SQL Injection

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "title": "'; DROP TABLE cards; --"
  }'
```

**Oczekiwany rezultat:** 200 (parametryzowane zapytania Supabase chroniÄ… przed SQL injection, tytuĹ‚ zapisany as-is)

#### Test XSS

```bash
curl -X PATCH http://localhost:4321/api/sessions/{valid-session-id}/cards/{valid-card-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {valid-jwt-token}" \
  -d '{
    "title": "<script>alert(\"XSS\")</script>"
  }'
```

**Oczekiwany rezultat:** 200 (dane zapisane as-is, sanityzacja powinna byÄ‡ wykonana podczas renderowania w UI)

---

### Krok 6: Optymalizacja (opcjonalne)

#### PoĹ‚Ä…czenie zapytaĹ„ walidacyjnych

```typescript
// Zamiast 2 osobnych zapytaĹ„ (session ownership + card existence)
const { data: card } = await supabase
  .from("cards")
  .select(
    `
    *,
    session:sessions!inner(user_id)
  `
  )
  .eq("id", cardId)
  .eq("session_id", sessionId)
  .single();

// Sprawdzenie w jednym zapytaniu:
// - Czy karta istnieje
// - Czy naleĹĽy do sesji
// - Czy sesja naleĹĽy do uĹĽytkownika (przez JOIN)

if (!card || card.session.user_id !== user.id) {
  return 404;
}
```

#### Optymalizacja partial update

```typescript
// Budowanie dynamicznego UPDATE tylko dla podanych pĂłl
// (juĹĽ zaimplementowane w updateCard function)
```

#### Cache invalidation

```typescript
// Po UPDATE, invalidate cache dla GET operations
// JeĹ›li cache zostanie dodany w przyszĹ‚oĹ›ci
await cache.del(`cards:${sessionId}`);
await cache.del(`card:${cardId}`);
```

---

### Krok 7: Dokumentacja

#### Dodanie JSDoc do funkcji serwisu

```typescript
/**
 * Pobiera kartÄ™ po ID z weryfikacjÄ… sesji
 *
 * @param supabase - Klient Supabase z typami Database
 * @param cardId - UUID karty
 * @param sessionId - UUID sesji (dla weryfikacji przynaleĹĽnoĹ›ci)
 * @returns Promise z CardEntity lub null jeĹ›li nie istnieje/brak dostÄ™pu
 *
 * @example
 * const card = await getCardById(supabase, cardId, sessionId);
 * if (!card) {
 *   return 404;
 * }
 */

/**
 * Aktualizuje kartÄ™ (partial update)
 *
 * @param supabase - Klient Supabase z typami Database
 * @param cardId - UUID karty do aktualizacji
 * @param command - Pola do aktualizacji (wszystkie opcjonalne)
 * @returns Promise z zaktualizowanÄ… kartÄ… jako CardDTO
 * @throws {Error} JeĹ›li zapytanie do bazy danych nie powiedzie siÄ™
 *
 * @example
 * // Aktualizacja tylko bucket_value
 * const card = await updateCard(supabase, cardId, { bucket_value: 8 });
 *
 * @example
 * // Aktualizacja wielu pĂłl
 * const card = await updateCard(supabase, cardId, {
 *   title: "New title",
 *   description: "New description",
 *   bucket_value: 5
 * });
 */
```

#### Code review checklist

- [ ] Wszystkie typy sÄ… poprawne
- [ ] Walidacja Zod dziaĹ‚a dla partial update
- [ ] Wszystkie scenariusze bĹ‚Ä™dĂłw obsĹ‚uĹĽone
- [ ] RLS policies testowane
- [ ] Brak SQL injection vulnerabilities
- [ ] Proper error logging
- [ ] Kod zgodny z Prettier config
- [ ] Early returns dla bĹ‚Ä™dĂłw
- [ ] Partial update dziaĹ‚a poprawnie
- [ ] Immutable fields (external_id) nie mogÄ… byÄ‡ zaktualizowane
- [ ] Trigger updated_at dziaĹ‚a automatycznie

---

### Krok 8: Monitoring i logging

#### Dodanie logowania dla production

```typescript
// W route handler
console.log(`[PATCH /api/sessions/:sessionId/cards/:id] User ${user.id} updating card ${cardId}`, {
  sessionId,
  fields: Object.keys(validatedBody),
});

// W przypadku bĹ‚Ä™dĂłw
console.error(`[PATCH /api/sessions/:sessionId/cards/:id] Error updating card:`, {
  userId: user.id,
  sessionId,
  cardId,
  updateFields: Object.keys(validatedBody),
  error: error.message,
  stack: error.stack,
});
```

#### Metryki do trackowania

- Liczba aktualizacji per user/session
- CzÄ™stotliwoĹ›Ä‡ aktualizacji bucket_value vs title/description
- CzÄ™stotliwoĹ›Ä‡ partial updates (ile pĂłl aktualizowanych)
- Czas wykonania endpointu
- CzÄ™stotliwoĹ›Ä‡ bĹ‚Ä™dĂłw 404 (card not found)

---

## 10. Podsumowanie

Endpoint **PATCH /api/sessions/:sessionId/cards/:id** zostaĹ‚ zaprojektowany z naciskiem na:

âś… **BezpieczeĹ„stwo**

- RLS policies + jawna walidacja wĹ‚aĹ›ciciela
- Parametryzowane zapytania (SQL injection protection)
- Immutable fields (external_id nie moĹĽe byÄ‡ zmieniony)
- Input validation (Zod)

âś… **FunkcjonalnoĹ›Ä‡**

- Partial update (wszystkie pola opcjonalne)
- Walidacja pustego body (minimum jedno pole wymagane)
- Automatyczna aktualizacja updated_at przez trigger
- ObsĹ‚uga null dla description (usuwanie wartoĹ›ci)

âś… **Clean code**

- Logika wyodrÄ™bniona do service layer
- Early returns dla bĹ‚Ä™dĂłw
- Proper error handling
- ZgodnoĹ›Ä‡ z Prettier config

âś… **WydajnoĹ›Ä‡**

- MoĹĽliwoĹ›Ä‡ poĹ‚Ä…czenia zapytaĹ„ walidacyjnych
- Dynamic UPDATE tylko dla podanych pĂłl
- Wykorzystanie primary key index

âś… **TestowalnoĹ›Ä‡**

- Service functions Ĺ‚atwe do mockowania
- Jasne scenariusze testowe
- Kompletna obsĹ‚uga bĹ‚Ä™dĂłw
- Testowanie partial updates
