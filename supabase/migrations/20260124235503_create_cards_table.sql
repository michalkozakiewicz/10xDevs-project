-- ============================================
-- Migration: 20260124235503_create_cards_table
-- Description: Utworzenie tabeli cards z RLS
-- Tables: cards
--
-- Purpose: Tworzy tabelę przechowującą karty zadań do estymacji.
-- Każda karta jest przypisana do jednej sesji i może mieć przypisany kubełek.
--
-- Dependencies:
--   - sessions table
--   - pgvector extension
--   - update_updated_at() function
-- ============================================

-- ============================================
-- TABELA: cards
-- ============================================

-- Tabela przechowująca karty zadań do estymacji
-- Każda karta jest przypisana do jednej sesji i może mieć przypisany kubełek
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

-- Komentarze do tabeli cards
comment on table cards is 'Karty zadań do estymacji - każda karta reprezentuje jedno zadanie importowane z CSV';
comment on column cards.id is 'Unikalny identyfikator karty (UUID)';
comment on column cards.session_id is 'Sesja, do której należy karta - referencja do sessions';
comment on column cards.external_id is 'ID zadania z zewnętrznego źródła (np. Jira, CSV) - używane do identyfikacji przy eksporcie';
comment on column cards.title is 'Tytuł zadania wyświetlany na karcie';
comment on column cards.description is 'Opcjonalny opis zadania z dodatkowymi szczegółami';
comment on column cards.embedding is 'Wektor embedding z modelu text-embedding-3-small (1536 wymiarów) - używany do sugestii AI';
comment on column cards.bucket_value is 'Wartość kubełka: NULL=nieprzypisana, 0=? (brak estymacji), 1,2,3,5,8,13,21=wartości Fibonacci';
comment on column cards.created_at is 'Data i czas utworzenia karty';
comment on column cards.updated_at is 'Data i czas ostatniej modyfikacji karty';

-- ============================================
-- INDEKSY
-- ============================================

-- Indeks kompozytowy dla szybkiego filtrowania kart w ramach sesji po kubełku
-- Optymalizuje zapytania wyświetlające karty pogrupowane według kubełków
create index idx_cards_session_bucket on cards (session_id, bucket_value);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Włączenie Row Level Security dla tabeli cards
-- Zapewnia, że użytkownicy mają dostęp tylko do kart z własnych sesji
alter table cards enable row level security;

-- Polityka SELECT dla roli authenticated
-- Użytkownik może odczytywać karty tylko z własnych sesji
-- Uzasadnienie: Karty są częścią prywatnej sesji użytkownika
create policy "cards_select_authenticated"
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

comment on policy "cards_select_authenticated" on cards is
  'Użytkownicy zalogowani mogą odczytywać karty tylko z własnych sesji';

-- Polityka INSERT dla roli authenticated
-- Użytkownik może dodawać karty tylko do własnych sesji
-- Uzasadnienie: Zapobiega dodawaniu kart do cudzych sesji
create policy "cards_insert_authenticated"
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

comment on policy "cards_insert_authenticated" on cards is
  'Użytkownicy zalogowani mogą dodawać karty tylko do własnych sesji';

-- Polityka UPDATE dla roli authenticated
-- Użytkownik może aktualizować karty tylko w własnych sesjach
-- Uzasadnienie: Tylko właściciel sesji może modyfikować karty
create policy "cards_update_authenticated"
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

comment on policy "cards_update_authenticated" on cards is
  'Użytkownicy zalogowani mogą aktualizować karty tylko w własnych sesjach';

-- Polityka DELETE dla roli authenticated
-- Użytkownik może usuwać karty tylko z własnych sesji
-- Uzasadnienie: Tylko właściciel sesji może usuwać karty
create policy "cards_delete_authenticated"
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

comment on policy "cards_delete_authenticated" on cards is
  'Użytkownicy zalogowani mogą usuwać karty tylko z własnych sesji';

-- ============================================
-- TRIGGER
-- ============================================

-- Trigger automatycznie aktualizujący pole updated_at przy każdej modyfikacji karty
create trigger cards_updated_at
  before update on cards
  for each row
  execute function update_updated_at();
