-- Wyłącz RLS dla tabeli sessions (tymczasowo dla developmentu)
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- Opcjonalnie: usuń wszystkie istniejące polityki
DROP POLICY IF EXISTS sessions_select_policy ON sessions;
DROP POLICY IF EXISTS sessions_insert_policy ON sessions;
DROP POLICY IF EXISTS sessions_update_policy ON sessions;
DROP POLICY IF EXISTS sessions_delete_policy ON sessions;

-- Wyłącz RLS również dla tabeli cards
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cards_select_policy ON cards;
DROP POLICY IF EXISTS cards_insert_policy ON cards;
DROP POLICY IF EXISTS cards_update_policy ON cards;
DROP POLICY IF EXISTS cards_delete_policy ON cards;