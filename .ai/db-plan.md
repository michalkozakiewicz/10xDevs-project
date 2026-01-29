# Schemat bazy danych - BucketEstimate AI

## 1. Lista tabel

### 1.0 Tabela `auth.users` (Supabase Auth)

> ⚠️ **Tabela zarządzana przez Supabase Auth** - nie tworzymy jej ręcznie. Supabase automatycznie tworzy i zarządza tą tabelą. Schemat może ulec zmianie - używamy tylko `id` jako klucza obcego.
>
> Źródło: [Supabase Auth Users Documentation](https://supabase.com/docs/guides/auth/users)

| Kolumna            | Typ         | Opis                                                     |
| ------------------ | ----------- | -------------------------------------------------------- |
| id                 | uuid        | Unikalny identyfikator użytkownika (**używany jako FK**) |
| aud                | string      | Audience claim                                           |
| role               | string      | Rola użytkownika dla Postgres RLS                        |
| email              | string      | Adres email użytkownika                                  |
| email_confirmed_at | timestamptz | Data potwierdzenia emaila (NULL jeśli niepotwierdzone)   |
| phone              | string      | Numer telefonu użytkownika                               |
| phone_confirmed_at | timestamptz | Data potwierdzenia telefonu (NULL jeśli niepotwierdzone) |
| confirmed_at       | timestamptz | Data pierwszego potwierdzenia (email lub telefon)        |
| last_sign_in_at    | timestamptz | Data ostatniego logowania                                |
| app_metadata       | jsonb       | Metadane aplikacji (provider, providers)                 |
| user_metadata      | jsonb       | Niestandardowe dane użytkownika                          |
| identities         | jsonb       | Tablica powiązanych tożsamości (OAuth, etc.)             |
| created_at         | timestamptz | Data utworzenia konta                                    |
| updated_at         | timestamptz | Data ostatniej aktualizacji                              |
| is_anonymous       | boolean     | Czy użytkownik jest anonimowy                            |

**Ważne:** Używamy tylko kolumny `id` jako klucza obcego. Pozostałe kolumny mogą ulec zmianie w przyszłych wersjach Supabase.

Funkcja `auth.uid()` zwraca `id` aktualnie zalogowanego użytkownika i jest używana w politykach RLS.

---

### 1.1 Tabela `sessions`

Przechowuje informacje o sesjach estymacji użytkowników.

| Kolumna    | Typ         | Ograniczenia                           | Opis                                |
| ---------- | ----------- | -------------------------------------- | ----------------------------------- |
| id         | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator sesji        |
| user_id    | uuid        | NOT NULL, REFERENCES auth.users(id)    | Właściciel sesji (facylitator)      |
| is_active  | boolean     | NOT NULL, DEFAULT true                 | Czy sesja jest aktywna              |
| context    | text        | NULL                                   | Opcjonalny kontekst projektu dla AI |
| created_at | timestamptz | NOT NULL, DEFAULT now()                | Data utworzenia                     |
| updated_at | timestamptz | NOT NULL, DEFAULT now()                | Data ostatniej modyfikacji          |

### 1.2 Tabela `cards`

Przechowuje karty zadań przypisane do sesji estymacji.

| Kolumna      | Typ          | Ograniczenia                           | Opis                                                               |
| ------------ | ------------ | -------------------------------------- | ------------------------------------------------------------------ |
| id           | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator karty                                       |
| session_id   | uuid         | NOT NULL, REFERENCES sessions(id)      | Powiązana sesja                                                    |
| external_id  | text         | NOT NULL                               | ID zadania z pliku CSV                                             |
| title        | text         | NOT NULL                               | Tytuł zadania                                                      |
| description  | text         | NULL                                   | Opis zadania                                                       |
| embedding    | vector(1536) | NULL                                   | Wektor embedding z modelu text-embedding-3-small                   |
| bucket_value | smallint     | NULL                                   | Wartość kubełka (0=?, 1, 2, 3, 5, 8, 13, 21); NULL = nieprzypisana |
| created_at   | timestamptz  | NOT NULL, DEFAULT now()                | Data utworzenia                                                    |
| updated_at   | timestamptz  | NOT NULL, DEFAULT now()                | Data ostatniej modyfikacji                                         |

## 2. Relacje między tabelami

```
auth.users (1) ←──────── (N) sessions
     │                        │
     │                        │
     └── user_id              └── session_id
                                    │
                                    ▼
                              cards (N)
```

### Opis relacji

| Relacja               | Kardynalność | Opis                                                            |
| --------------------- | ------------ | --------------------------------------------------------------- |
| auth.users → sessions | 1:N          | Jeden użytkownik może mieć wiele sesji estymacji                |
| sessions → cards      | 1:N          | Jedna sesja zawiera wiele kart (max 50, walidowane w aplikacji) |

## 3. Indeksy

```sql
-- Indeks dla szybkiego filtrowania kart w kubełkach w ramach sesji
create index idx_cards_session_bucket on cards (session_id, bucket_value);

-- Indeks dla wyszukiwania sesji użytkownika
create index idx_sessions_user_id on sessions (user_id);

-- Indeks wektorowy HNSW na embedding - do dodania w przyszłości gdy dane urosną
-- create index idx_cards_embedding on cards using hnsw (embedding vector_cosine_ops);
```

## 4. Polityki PostgreSQL Row Level Security (RLS)

### 4.1 Włączenie RLS

```sql
alter table sessions enable row level security;
alter table cards enable row level security;
```

### 4.2 Polityki dla tabeli `sessions`

```sql
-- Polityka SELECT dla authenticated
-- Użytkownik może odczytywać tylko swoje sesje
create policy "Users can view own sessions"
  on sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Polityka INSERT dla authenticated
-- Użytkownik może tworzyć sesje tylko dla siebie
create policy "Users can create own sessions"
  on sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Polityka UPDATE dla authenticated
-- Użytkownik może aktualizować tylko swoje sesje
create policy "Users can update own sessions"
  on sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Polityka DELETE dla authenticated
-- Użytkownik może usuwać tylko swoje sesje
create policy "Users can delete own sessions"
  on sessions
  for delete
  to authenticated
  using (user_id = auth.uid());
```

### 4.3 Polityki dla tabeli `cards`

```sql
-- Polityka SELECT dla authenticated
-- Użytkownik może odczytywać karty tylko z własnych sesji
create policy "Users can view cards from own sessions"
  on cards
  for select
  to authenticated
  using (
    exists (
      select 1 from sessions
      where sessions.id = cards.session_id
        and sessions.user_id = auth.uid()
    )
  );

-- Polityka INSERT dla authenticated
-- Użytkownik może dodawać karty tylko do własnych sesji
create policy "Users can create cards in own sessions"
  on cards
  for insert
  to authenticated
  with check (
    exists (
      select 1 from sessions
      where sessions.id = cards.session_id
        and sessions.user_id = auth.uid()
    )
  );

-- Polityka UPDATE dla authenticated
-- Użytkownik może aktualizować karty tylko w własnych sesjach
create policy "Users can update cards in own sessions"
  on cards
  for update
  to authenticated
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
  );

-- Polityka DELETE dla authenticated
-- Użytkownik może usuwać karty tylko z własnych sesji
create policy "Users can delete cards from own sessions"
  on cards
  for delete
  to authenticated
  using (
    exists (
      select 1 from sessions
      where sessions.id = cards.session_id
        and sessions.user_id = auth.uid()
    )
  );
```

## 5. Funkcje i triggery

### 5.1 Funkcja aktualizacji `updated_at`

```sql
-- Funkcja automatycznie aktualizująca pole updated_at przy każdej modyfikacji
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

### 5.2 Triggery dla tabel

```sql
-- Trigger dla tabeli sessions
create trigger sessions_updated_at
  before update on sessions
  for each row
  execute function update_updated_at();

-- Trigger dla tabeli cards
create trigger cards_updated_at
  before update on cards
  for each row
  execute function update_updated_at();
```

## 6. Rozszerzenia PostgreSQL

```sql
-- Wymagane dla typu vector i operacji similarity search
create extension if not exists vector;
```

## 7. Pełna migracja SQL

```sql
-- Migration: create_initial_schema
-- Description: Tworzenie początkowego schematu dla BucketEstimate AI
-- Tables: sessions, cards
-- Extensions: pgvector

-- ============================================
-- ROZSZERZENIA
-- ============================================

create extension if not exists vector;

-- ============================================
-- FUNKCJE
-- ============================================

-- Funkcja automatycznie aktualizująca pole updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================
-- TABELA: sessions
-- ============================================

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  is_active boolean not null default true,
  context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Komentarz do tabeli
comment on table sessions is 'Sesje estymacji Bucket System';
comment on column sessions.user_id is 'Właściciel sesji (facylitator)';
comment on column sessions.is_active is 'Czy sesja jest aktywna (false = wyczyszczona)';
comment on column sessions.context is 'Opcjonalny kontekst projektu przekazywany do AI';

-- Indeks dla wyszukiwania sesji użytkownika
create index idx_sessions_user_id on sessions (user_id);

-- RLS dla sessions
alter table sessions enable row level security;

create policy "Users can view own sessions"
  on sessions for select to authenticated
  using (user_id = auth.uid());

create policy "Users can create own sessions"
  on sessions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own sessions"
  on sessions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own sessions"
  on sessions for delete to authenticated
  using (user_id = auth.uid());

-- Trigger updated_at dla sessions
create trigger sessions_updated_at
  before update on sessions
  for each row
  execute function update_updated_at();

-- ============================================
-- TABELA: cards
-- ============================================

create table cards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id),
  external_id text not null,
  title text not null,
  description text,
  embedding vector(1536),
  bucket_value smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Komentarze do tabeli
comment on table cards is 'Karty zadań do estymacji';
comment on column cards.external_id is 'ID zadania z zewnętrznego źródła (np. CSV)';
comment on column cards.embedding is 'Wektor embedding z modelu text-embedding-3-small (1536 wymiarów)';
comment on column cards.bucket_value is 'Wartość kubełka: NULL=nieprzypisana, 0=?, 1,2,3,5,8,13,21=wartości Fibonacci';

-- Indeks dla filtrowania kart w sesji po kubełku
create index idx_cards_session_bucket on cards (session_id, bucket_value);

-- RLS dla cards
alter table cards enable row level security;

create policy "Users can view cards from own sessions"
  on cards for select to authenticated
  using (exists (
    select 1 from sessions
    where sessions.id = cards.session_id
      and sessions.user_id = auth.uid()
  ));

create policy "Users can create cards in own sessions"
  on cards for insert to authenticated
  with check (exists (
    select 1 from sessions
    where sessions.id = cards.session_id
      and sessions.user_id = auth.uid()
  ));

create policy "Users can update cards in own sessions"
  on cards for update to authenticated
  using (exists (
    select 1 from sessions
    where sessions.id = cards.session_id
      and sessions.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from sessions
    where sessions.id = cards.session_id
      and sessions.user_id = auth.uid()
  ));

create policy "Users can delete cards from own sessions"
  on cards for delete to authenticated
  using (exists (
    select 1 from sessions
    where sessions.id = cards.session_id
      and sessions.user_id = auth.uid()
  ));

-- Trigger updated_at dla cards
create trigger cards_updated_at
  before update on cards
  for each row
  execute function update_updated_at();
```

## 8. Dodatkowe uwagi i decyzje projektowe

### 8.1 Zarządzanie użytkownikami

Tabela użytkowników **nie jest częścią tego schematu** - jest w pełni obsługiwana przez **Supabase Auth**.

- Supabase automatycznie tworzy i zarządza tabelą `auth.users`
- Referencje do użytkowników używają `auth.users(id)` jako klucza obcego
- Polityki RLS wykorzystują funkcję `auth.uid()` do identyfikacji zalogowanego użytkownika
- Nie tworzymy dodatkowej tabeli `profiles` - dla MVP wystarczą dane z `auth.users`

Jeśli w przyszłości pojawi się potrzeba przechowywania dodatkowych danych użytkownika (np. preferencje, avatar), można dodać tabelę `profiles` z relacją 1:1 do `auth.users`.

### 8.2 Decyzje architektoniczne

1. **Brak CASCADE DELETE** - Świadoma decyzja, aby uniknąć przypadkowego usunięcia danych historycznych. Usuwanie kart przy usunięciu sesji powinno być obsługiwane na poziomie aplikacji.

2. **Wartość `bucket_value`** - Używamy `smallint` zamiast enuma dla prostoty. Wartości:
   - `NULL` - karta nieprzypisana do żadnego kubełka
   - `0` - kubełek "?" (brak estymacji)
   - `1, 2, 3, 5, 8, 13, 21` - wartości sekwencji Fibonacciego

3. **Embedding jako `vector(1536)`** - Wymiar odpowiada modelowi `text-embedding-3-small` z OpenAI. Indeks HNSW zostanie dodany w przyszłości, gdy ilość danych uzasadni koszt utrzymania indeksu.

4. **Brak kolejności kart w kubełku** - Pominięte dla MVP. Można dodać pole `position` w przyszłości.

### 8.3 Walidacja na poziomie aplikacji

Następujące reguły są walidowane w kodzie aplikacji, nie w bazie danych:

- Maksymalna liczba kart w sesji: 50
- Dozwolone wartości `bucket_value`: NULL, 0, 1, 2, 3, 5, 8, 13, 21
- Unikalność `external_id` w ramach sesji

### 8.4 Przyszłe rozszerzenia

1. **Indeks wektorowy HNSW** - Do dodania gdy baza urośnie:

   ```sql
   create index idx_cards_embedding on cards
     using hnsw (embedding vector_cosine_ops);
   ```

2. **Soft delete** - Rozważyć dodanie `deleted_at` dla sesji/kart zamiast trwałego usuwania.

3. **Partycjonowanie** - Dla bardzo dużej liczby sesji rozważyć partycjonowanie po `created_at`.

### 8.5 Mapowanie na typy TypeScript

```typescript
// Typy generowane przez Supabase CLI (supabase gen types typescript)
interface Session {
  id: string;
  user_id: string;
  is_active: boolean;
  context: string | null;
  created_at: string;
  updated_at: string;
}

interface Card {
  id: string;
  session_id: string;
  external_id: string;
  title: string;
  description: string | null;
  embedding: number[] | null;
  bucket_value: number | null;
  created_at: string;
  updated_at: string;
}

// Wartości kubełków jako union type
type BucketValue = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | null;
```
