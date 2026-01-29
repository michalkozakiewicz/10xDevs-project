-- ============================================
-- Migration: 20260124235502_create_sessions_table
-- Description: Utworzenie tabeli sessions z RLS
-- Tables: sessions
--
-- Purpose: Tworzy tabelę przechowującą sesje estymacji Bucket System.
-- Każda sesja należy do jednego użytkownika (facylitatora).
--
-- Dependencies:
--   - auth.users (Supabase Auth)
--   - update_updated_at() function
-- ============================================

-- ============================================
-- TABELA: sessions
-- ============================================

-- Tabela przechowująca sesje estymacji Bucket System
-- Każda sesja należy do jednego użytkownika (facylitatora)
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  is_active boolean not null default true,
  context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Komentarze do tabeli sessions
comment on table sessions is 'Sesje estymacji Bucket System - każda sesja reprezentuje pojedynczą sesję estymacji zadań';
comment on column sessions.id is 'Unikalny identyfikator sesji (UUID)';
comment on column sessions.user_id is 'Właściciel sesji (facylitator) - referencja do auth.users';
comment on column sessions.is_active is 'Czy sesja jest aktywna (false = sesja została wyczyszczona/zamknięta)';
comment on column sessions.context is 'Opcjonalny kontekst projektu przekazywany do AI dla lepszych sugestii';
comment on column sessions.created_at is 'Data i czas utworzenia sesji';
comment on column sessions.updated_at is 'Data i czas ostatniej modyfikacji sesji';

-- ============================================
-- INDEKSY
-- ============================================

-- Indeks dla szybkiego wyszukiwania sesji użytkownika
-- Optymalizuje zapytania filtrujące po user_id (częste przy wyświetlaniu listy sesji)
create index idx_sessions_user_id on sessions (user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Włączenie Row Level Security dla tabeli sessions
-- Zapewnia, że użytkownicy mają dostęp tylko do własnych sesji
alter table sessions enable row level security;

-- Polityka SELECT dla roli authenticated
-- Użytkownik może odczytywać tylko swoje własne sesje
-- Uzasadnienie: Sesje estymacji są prywatne dla każdego użytkownika
create policy "sessions_select_authenticated"
  on sessions
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy "sessions_select_authenticated" on sessions is
  'Użytkownicy zalogowani mogą odczytywać tylko swoje własne sesje';

-- Polityka INSERT dla roli authenticated
-- Użytkownik może tworzyć sesje tylko przypisane do siebie
-- Uzasadnienie: Zapobiega tworzeniu sesji w imieniu innych użytkowników
create policy "sessions_insert_authenticated"
  on sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "sessions_insert_authenticated" on sessions is
  'Użytkownicy zalogowani mogą tworzyć sesje tylko przypisane do własnego konta';

-- Polityka UPDATE dla roli authenticated
-- Użytkownik może aktualizować tylko swoje własne sesje
-- Uzasadnienie: Tylko właściciel sesji może modyfikować jej dane
create policy "sessions_update_authenticated"
  on sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on policy "sessions_update_authenticated" on sessions is
  'Użytkownicy zalogowani mogą aktualizować tylko swoje własne sesje';

-- Polityka DELETE dla roli authenticated
-- Użytkownik może usuwać tylko swoje własne sesje
-- Uzasadnienie: Tylko właściciel sesji może ją usunąć
create policy "sessions_delete_authenticated"
  on sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "sessions_delete_authenticated" on sessions is
  'Użytkownicy zalogowani mogą usuwać tylko swoje własne sesje';

-- ============================================
-- TRIGGER
-- ============================================

-- Trigger automatycznie aktualizujący pole updated_at przy każdej modyfikacji sesji
create trigger sessions_updated_at
  before update on sessions
  for each row
  execute function update_updated_at();
