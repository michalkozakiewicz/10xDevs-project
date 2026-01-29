# API Endpoint Implementation Plan: GET /api/sessions

## 1. Przegląd punktu końcowego

Endpoint `GET /api/sessions` zwraca paginowaną listę sesji należących do zalogowanego użytkownika wraz z liczbą kart w każdej sesji.

**Kluczowe cechy:**

- Wymaga autentykacji
- Zwraca tylko sesje zalogowanego użytkownika (RLS)
- Automatycznie liczy karty dla każdej sesji
- Obsługuje filtrowanie po `is_active`
- Paginacja: limit (default: 20, max: 100), offset (default: 0)
- Sortowanie po `created_at DESC`

---

## 2. Szczegóły żądania

### Metoda HTTP

`GET`

### Struktura URL

```
/api/sessions?is_active={boolean}&limit={number}&offset={number}
```

### Query Parameters

| Parametr  | Typ     | Wymagany | Default | Ograniczenia | Opis                       |
| --------- | ------- | -------- | ------- | ------------ | -------------------------- |
| is_active | boolean | NIE      | -       | true/false   | Filtrowanie po statusie    |
| limit     | number  | NIE      | 20      | 1-100        | Liczba wyników             |
| offset    | number  | NIE      | 0       | >= 0         | Przesunięcie dla paginacji |

---

## 3. Wykorzystywane typy

```typescript
import type {
  SessionsQueryParams,
  SessionListItemDTO,
  SessionsListResponseDTO,
  PaginationDTO,
  APIErrorDTO,
} from "@/types";

// Query params (linie 392-396)
interface SessionsQueryParams {
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

// List item (linie 64-71) - bez user_id, z cards_count
interface SessionListItemDTO {
  id: string;
  is_active: boolean;
  context: string | null;
  cards_count: number;
  created_at: string;
  updated_at: string;
}

// Response wrapper (linie 96-99)
interface SessionsListResponseDTO {
  data: SessionListItemDTO[];
  pagination: PaginationDTO;
}
```

---

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "is_active": true,
      "context": "E-commerce platform",
      "cards_count": 15,
      "created_at": "2024-01-26T10:30:00.000Z",
      "updated_at": "2024-01-26T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

### Pusta lista (200 OK)

```json
{
  "data": [],
  "pagination": { "total": 0, "limit": 20, "offset": 0 }
}
```

### Błąd 401 / 400 / 500

Jak w POST endpoint.

---

## 5. Etapy wdrożenia

### Krok 1: Rozszerz Zod schema

**Plik**: `src/lib/schemas/session.schema.ts`

```typescript
/**
 * Validation schema for GET /api/sessions query parameters
 */
export const SessionsQuerySchema = z.object({
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      throw new Error("Must be 'true' or 'false'");
    }),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .default("0")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0)),
});
```

### Krok 2: Rozszerz Session Service

**Plik**: `src/lib/services/session.service.ts`

Dodaj funkcję:

```typescript
/**
 * Lists all sessions for authenticated user with pagination
 */
export async function listUserSessions(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: SessionsQueryParams
): Promise<{
  data: SessionListItemDTO[];
  pagination: { total: number; limit: number; offset: number };
}> {
  const { is_active, limit = 20, offset = 0 } = params;

  // Build query
  let query = supabase
    .from("sessions")
    .select("id, is_active, context, created_at, updated_at", { count: "exact" })
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
```

### Krok 3: Dodaj GET handler

**Plik**: `src/pages/api/sessions.ts`

Dodaj do istniejącego pliku:

```typescript
import { SessionsQuerySchema } from "@/lib/schemas/session.schema";
import { listUserSessions } from "@/lib/services/session.service";
import type { SessionsListResponseDTO } from "@/types";

/**
 * GET /api/sessions
 * Lists all sessions for authenticated user
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ code: "UNAUTHORIZED", message: "User not authenticated" } as APIErrorDTO), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse query params
    const url = new URL(request.url);
    const queryParams = {
      is_active: url.searchParams.get("is_active") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      offset: url.searchParams.get("offset") || undefined,
    };

    // Validate
    const parseResult = SessionsQuerySchema.safeParse(queryParams);

    if (!parseResult.success) {
      const details = parseResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details,
        } as APIErrorDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch sessions
    const result = await listUserSessions(locals.supabase, user.id, parseResult.data);

    const response: SessionsListResponseDTO = {
      data: result.data,
      pagination: result.pagination,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /api/sessions] Internal error:", error);

    return new Response(
      JSON.stringify({ code: "INTERNAL_ERROR", message: "Failed to fetch sessions" } as APIErrorDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Krok 4: Testowanie

```bash
# Test 1: Wszystkie sesje
curl -H "Authorization: Bearer <token>" http://localhost:4321/api/sessions

# Test 2: Filtrowanie
curl -H "Authorization: Bearer <token>" "http://localhost:4321/api/sessions?is_active=true"

# Test 3: Paginacja
curl -H "Authorization: Bearer <token>" "http://localhost:4321/api/sessions?limit=5&offset=0"

# Test 4: Błąd limit > 100
curl -H "Authorization: Bearer <token>" "http://localhost:4321/api/sessions?limit=101"

# Test 5: Brak auth
curl http://localhost:4321/api/sessions
```

---

## 6. Dodatkowe uwagi

### Wydajność

- `Promise.all()` dla równoległego zliczania kart
- Rozważyć PostgreSQL function dla JOIN + COUNT w przyszłości
- Indeks `idx_sessions_user_id` wspomaga filtrowanie

### Przyszłe rozszerzenia

- Search po context
- Sortowanie (sort_by, sort_order)
- Filtrowanie po dacie (created_after, created_before)
- Cursor-based pagination
