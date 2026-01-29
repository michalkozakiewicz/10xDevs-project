# Plan bazy danych - BucketEstimate AI (MVP)

## Decyzje projektowe

1. **Embeddingi** - przechowywane jako kolumna typu `pgvector` bezpośrednio w tabeli kart (zadań)
2. **Unikalność kart** - każda karta unikalna przez UUID (`id`), przypisana do sesji przez `session_id`
3. **Dane historyczne** - brak separacji; wszystkie karty pozostają w jednej tabeli, sesje historyczne będą dostępne w przyszłości poprzez filtrowanie
4. **Wartość kubełka** - typ `smallint`, gdzie `0` reprezentuje kubełek "?"; bez CHECK constraint
5. **Kontekst projektu** - sesja zawiera opcjonalne pole `context` typu `text` dla AI
6. **RLS** - polityki bezpieczeństwa oparte o `user_id` z tabeli `auth.users`
7. **Śledzenie zmian** - pole `updated_at` z triggerem automatycznej aktualizacji; bez mechanizmu blokowania współbieżnego
8. **Indeksowanie** - indeks na `(session_id, bucket_value)`; indeks wektorowy HNSW dodany później gdy dane urosną
9. **Historia estymacji** - nie przechowujemy historii zmian pozycji kart w ramach sesji
10. **Walidacja limitu 50 kart** - tylko na poziomie aplikacji, baza nie kontroluje
11. **Status sesji** - pole `is_active` typu `boolean` z wartością domyślną `true` dla nowej sesji
12. **Tabela użytkowników** - korzystamy bezpośrednio z `auth.users` Supabase, bez dodatkowej tabeli `profiles`
13. **Kolejność kart w kubełku** - pominięta dla MVP
14. **Pola wymagane dla karty** - `id` (UUID), `session_id`, `external_id`, `title`; opcjonalne: `description`, `embedding`, `bucket_value`
15. **Unikalność external_id** - baza nie pilnuje unikalności w ramach sesji
16. **Typ daty/czasu** - `timestamptz` (timestamp with time zone) dla wszystkich pól czasowych
17. **Nazwa sesji** - pole `name` nie jest konieczne na ten moment
18. **Kaskadowe usuwanie** - nie wprowadzamy `ON DELETE CASCADE` na tym etapie
19. **Tabela definicji kubełków** - nie potrzebna; wartości ciągu Fibonacciego są stałe w kodzie

## Dopasowane rekomendacje

1. **Embedding jako pgvector** - kolumna `embedding` typu `vector(1536)` w tabeli kart dla modelu text-embedding-3-small
2. **UUID jako klucz główny** - wszystkie tabele używają UUID jako primary key dla lepszej dystrybucji i bezpieczeństwa
3. **Pole context w sesji** - opcjonalne pole `text` przekazywane do LLM podczas automatycznej estymacji
4. **RLS na user_id** - polityki SELECT/INSERT/UPDATE/DELETE dla roli `authenticated` sprawdzające `session.user_id = auth.uid()`
5. **Trigger updated_at** - automatyczna aktualizacja znacznika czasu przy każdej modyfikacji rekordu
6. **Indeks złożony** - `CREATE INDEX ON cards (session_id, bucket_value)` dla szybkiego filtrowania
7. **Nullable bucket_value** - wartość NULL oznacza kartę nieprzypisaną do żadnego kubełka (przed estymacją AI lub ręczną)
8. **Timestamptz** - wszystkie pola czasowe w UTC z konwersją w aplikacji
9. **Brak indeksu wektorowego na start** - sequential scan wystarczy dla MVP; HNSW dodany później
10. **Bezpośrednie użycie auth.users** - uproszczenie architektury bez dodatkowej warstwy abstrakcji

## Podsumowanie planowania bazy danych

### Główne wymagania schematu bazy danych

Aplikacja BucketEstimate AI wymaga prostego schematu z dwiema głównymi tabelami: `sessions` i `cards`. System korzysta z wbudowanego uwierzytelniania Supabase (`auth.users`) bez dodatkowej tabeli profili.

### Kluczowe encje i ich atrybuty

#### Tabela `sessions`

| Kolumna    | Typ         | Ograniczenia                  | Opis                                |
| ---------- | ----------- | ----------------------------- | ----------------------------------- |
| id         | uuid        | PK, DEFAULT gen_random_uuid() | Unikalny identyfikator sesji        |
| user_id    | uuid        | FK → auth.users(id), NOT NULL | Właściciel sesji (facylitator)      |
| is_active  | boolean     | NOT NULL, DEFAULT true        | Czy sesja jest aktywna              |
| context    | text        | NULL                          | Opcjonalny kontekst projektu dla AI |
| created_at | timestamptz | NOT NULL, DEFAULT now()       | Data utworzenia                     |
| updated_at | timestamptz | NOT NULL, DEFAULT now()       | Data ostatniej modyfikacji          |

#### Tabela `cards`

| Kolumna      | Typ          | Ograniczenia                  | Opis                                   |
| ------------ | ------------ | ----------------------------- | -------------------------------------- |
| id           | uuid         | PK, DEFAULT gen_random_uuid() | Unikalny identyfikator karty           |
| session_id   | uuid         | FK → sessions(id), NOT NULL   | Powiązana sesja                        |
| external_id  | text         | NOT NULL                      | ID z pliku CSV                         |
| title        | text         | NOT NULL                      | Tytuł zadania                          |
| description  | text         | NULL                          | Opis zadania                           |
| embedding    | vector(1536) | NULL                          | Wektor embedding z AI                  |
| bucket_value | smallint     | NULL                          | Wartość kubełka (0=?, 1,2,3,5,8,13,21) |
| created_at   | timestamptz  | NOT NULL, DEFAULT now()       | Data utworzenia                        |
| updated_at   | timestamptz  | NOT NULL, DEFAULT now()       | Data ostatniej modyfikacji             |

### Relacje między encjami

```
auth.users (1) ←──────── (N) sessions
                              │
                              │
sessions (1) ←─────────── (N) cards
```

- Jeden użytkownik może mieć wiele sesji
- Jedna sesja zawiera wiele kart (max 50, walidowane w aplikacji)
- Karty nie są usuwane kaskadowo przy usunięciu sesji

### Indeksy

1. `CREATE INDEX idx_cards_session_bucket ON cards (session_id, bucket_value)` - filtrowanie kart w kubełkach
2. Indeks wektorowy HNSW na `embedding` - do dodania w przyszłości gdy dane urosną

### Bezpieczeństwo (RLS)

Włączone Row Level Security na obu tabelach z politykami:

**sessions:**

- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()`

**cards:**

- SELECT: `EXISTS (SELECT 1 FROM sessions WHERE sessions.id = cards.session_id AND sessions.user_id = auth.uid())`
- INSERT: analogicznie
- UPDATE: analogicznie
- DELETE: analogicznie

### Triggery

```sql
-- Trigger dla automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Zastosowanie do obu tabel
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Rozszerzenia PostgreSQL

- `pgvector` - wymagane dla typu `vector` i przyszłych operacji similarity search

## Nierozwiązane kwestie

1. **Soft delete vs hard delete** - nie ustalono czy sesje/karty będą usuwane permanentnie czy oznaczane jako usunięte (pole `deleted_at`). Dla dostępu do sesji historycznych może być potrzebne doprecyzowanie.

2. **Archiwizacja starych sesji** - brak strategii dla długoterminowego przechowywania nieaktywnych sesji (partycjonowanie, przenoszenie do cold storage).

3. **Obsługa błędów importu** - nie określono czy błędne wiersze CSV powinny być logowane w bazie danych czy tylko zwracane w odpowiedzi API.

4. **Limity na użytkownika** - nie ustalono czy istnieje maksymalna liczba sesji na użytkownika lub całkowita liczba kart w bazie per użytkownik.

5. **Retencja danych** - brak polityki dotyczącej czasu przechowywania danych i automatycznego usuwania starych sesji.
