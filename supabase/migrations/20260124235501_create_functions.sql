-- ============================================
-- Migration: 20260124235501_create_functions
-- Description: Utworzenie funkcji pomocniczych dla bazy danych
-- Functions: update_updated_at()
--
-- Purpose: Tworzy funkcję trigger używaną do automatycznej
-- aktualizacji pola updated_at przy modyfikacji rekordów.
-- ============================================

-- Funkcja automatycznie aktualizująca pole updated_at przy każdej modyfikacji rekordu
-- Używana przez triggery na tabelach sessions i cards
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function update_updated_at() is 'Automatycznie aktualizuje pole updated_at na bieżący timestamp przy każdej modyfikacji rekordu';
