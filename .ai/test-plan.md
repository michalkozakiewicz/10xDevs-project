# Plan Testów - BucketEstimate AI

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu

Niniejszy dokument określa kompleksową strategię testowania aplikacji BucketEstimate AI - webowego narzędzia do szybkiej estymacji zadań metodą Bucket System z wykorzystaniem sztucznej inteligencji.

### 1.2 Cele testowania

- **Weryfikacja funkcjonalności**: Potwierdzenie, że wszystkie 19 historyjek użytkowników (US-001 do US-019) są zrealizowane zgodnie z kryteriami akceptacji
- **Zapewnienie bezpieczeństwa**: Weryfikacja mechanizmów autentykacji, autoryzacji i Row Level Security (RLS)
- **Walidacja integracji AI**: Sprawdzenie poprawności estymacji AI oraz obsługi błędów zewnętrznego API
- **Testowanie wydajności**: Weryfikacja płynności działania przy maksymalnym obciążeniu (50 kart)
- **Kompatybilność**: Zapewnienie działania w różnych przeglądarkach i rozdzielczościach
- **Niezawodność**: Potwierdzenie odporności na błędy i prawidłowej obsługi stanów wyjątkowych

### 1.3 Metryki sukcesu

Zgodnie z PRD, testy mają zweryfikować:
- Redukcję czasu sesji estymacji o minimum 30% w porównaniu do tradycyjnych metod
- Co najmniej 60% zadań pozostaje w kubełkach zaproponowanych przez AI
- 100% poprawności zapisu embeddingów dla zadań zawierających opis techniczny
- Minimum 90% udanych sesji bez krytycznych błędów aplikacji

---

## 2. Zakres testów

### 2.1 W zakresie testów (In Scope)

#### 2.1.1 Moduły funkcjonalne
- **Autentykacja i autoryzacja** (US-001, US-002, US-003, US-004, US-005)
  - Rejestracja użytkownika
  - Logowanie i wylogowanie
  - Izolacja danych między użytkownikami
  - Obsługa wygasłej sesji

- **Zarządzanie sesjami** (US-006, US-007)
  - Przeglądanie listy sesji
  - Tworzenie nowej sesji
  - Usuwanie sesji (US-016)
  - Aktualizacja kontekstu sesji (US-017)

- **Zarządzanie kartami** (US-008, US-009, US-010, US-011, US-012)
  - Import kart z CSV
  - Ręczne dodawanie kart
  - Wyświetlanie i przeciąganie kart (drag-and-drop)
  - Podgląd szczegółów zadania
  - Usuwanie pojedynczej karty

- **Moduł AI** (US-013)
  - Automatyczna estymacja przez AI
  - Generowanie embeddingów
  - Obsługa błędów API OpenRouter

- **Podsumowanie i raportowanie** (US-014, US-015)
  - Podsumowanie estymacji
  - Czyszczenie sesji

- **Obsługa błędów** (US-019)
  - Komunikaty błędów
  - Walidacja danych wejściowych
  - Optimistic UI updates

#### 2.1.2 Integracje
- Supabase (PostgreSQL, Auth, RLS)
- OpenRouter API (Claude Sonnet, embeddingi)
- dnd-kit (drag-and-drop)

#### 2.1.3 Bezpieczeństwo
- Row Level Security (RLS) policies
- Middleware autentykacji
- Walidacja danych (Zod schemas)
- CORS i cookie security

### 2.2 Poza zakresem testów (Out of Scope)

Zgodnie z PRD, poza zakresem MVP znajdują się:
- Tryb multiplayer i synchronizacja real-time wielu użytkowników
- Integracje z zewnętrznymi systemami (Jira, Azure DevOps)
- Historia zmian oraz funkcje undo/redo
- Możliwość edycji wyceny w widoku podsumowania
- Zaawansowana analityka i raportowanie historyczne w UI
- Testowanie infrastruktury CI/CD (GitHub Actions)
- Testowanie wdrożenia na DigitalOcean
- Testy penetracyjne i security audit

---

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)

**Cel**: Weryfikacja poprawności pojedynczych funkcji i metod w izolacji

**Narzędzia**: Vitest, Testing Library

**Zakres**:

#### 3.1.1 Serwisy Business Logic
- **session.service.ts**
  - `createSession()` - tworzenie sesji z kontekstem i bez
  - `listUserSessions()` - paginacja, filtrowanie po is_active
  - `updateSession()` - aktualizacja context i is_active
  - `getSessionById()` - weryfikacja ownership, obsługa błędów 404

- **cards.service.ts**
  - `createCard()` - walidacja danych wejściowych
  - `getCards()` - filtrowanie po bucket_value
  - `updateCard()` - partial update, walidacja bucket_value
  - `deleteCard()` - usuwanie karty
  - `batchUpdateCards()` - batch update wielu kart
  - `checkExternalIdUniqueness()` - sprawdzanie unikalności
  - `validateSessionOwnership()` - weryfikacja uprawnień
  - `transformCardEntityToDTO()` - konwersja embedding → has_embedding

- **ai-estimate.service.ts**
  - `runAIEstimation()` - flow estymacji AI (mock OpenRouter)
  - Parsowanie odpowiedzi AI
  - Walidacja JSON Schema
  - Obsługa błędów API

- **openrouter.service.ts**
  - `completeChat()` - wywołanie API (mock)
  - `streamChat()` - streaming SSE (mock)
  - Parsowanie structured outputs

#### 3.1.2 Komponenty React
- **useSessionCards hook**
  - Zarządzanie stanem kart
  - Operacje CRUD
  - Optimistic updates
  - Error handling

- **useModals hook**
  - Zarządzanie stanem modali
  - Otwieranie i zamykanie

- **Bucket component**
  - Renderowanie kart
  - Obsługa drag-and-drop events

- **TaskCard component**
  - Wyświetlanie danych karty
  - Kliknięcie otwiera modal

#### 3.1.3 Walidacja (Zod Schemas)
- SessionCreateSchema
- SessionUpdateSchema
- SessionsQuerySchema
- CardCreateSchema
- CardUpdateSchema
- BucketValueSchema

**Kryteria akceptacji**:
- Pokrycie kodu minimum 80% dla serwisów
- Pokrycie kodu minimum 70% dla komponentów React
- Wszystkie edge cases obsłużone
- Mocki dla zewnętrznych zależności (Supabase, OpenRouter)

---

### 3.2 Testy integracyjne (Integration Tests)

**Cel**: Weryfikacja współpracy między modułami aplikacji

**Narzędzia**: Vitest, Supertest (dla API), Testing Library

**Zakres**:

#### 3.2.1 API Endpoints
- **Autentykacja**
  - POST `/api/auth/register`
    - Poprawna rejestracja
    - Duplikat email (409)
    - Walidacja formatu email
    - Walidacja hasła (min 8 znaków)
  - POST `/api/auth/login`
    - Poprawne logowanie
    - Błędne dane (401)
    - Email bez konta
  - POST `/api/auth/logout`
    - Wylogowanie usuwa sesję

- **Sesje**
  - GET `/api/sessions`
    - Lista sesji użytkownika
    - Paginacja (limit, offset)
    - Filtrowanie po is_active
    - Izolacja danych (RLS)
  - POST `/api/sessions`
    - Tworzenie sesji z kontekstem
    - Tworzenie sesji bez kontekstu
    - Brak autentykacji (401)
  - GET `/api/sessions/:sessionId`
    - Pobranie szczegółów sesji
    - Brak uprawnień (404)
    - Nieistniejąca sesja (404)
  - PATCH `/api/sessions/:sessionId`
    - Aktualizacja context
    - Aktualizacja is_active
    - Brak uprawnień (404)

- **Karty**
  - POST `/api/sessions/:sessionId/cards`
    - Dodanie karty z pełnymi danymi
    - Duplikat external_id (409)
    - Limit 50 kart (422)
    - Walidacja wymaganych pól
  - GET `/api/sessions/:sessionId/cards`
    - Pobranie wszystkich kart
    - Filtrowanie po bucket_value
    - Pusta sesja
  - PATCH `/api/sessions/:sessionId/cards/:id`
    - Aktualizacja title
    - Aktualizacja bucket_value
    - Partial update
  - DELETE `/api/sessions/:sessionId/cards/:id`
    - Usunięcie karty
    - Brak uprawnień (404)
  - PATCH `/api/sessions/:sessionId/cards` (batch)
    - Batch update wielu kart
    - Optimistic update

- **AI Estymacja**
  - POST `/api/sessions/:sessionId/ai/estimate`
    - Estymacja wszystkich kart
    - Estymacja z kontekstem projektu
    - Błąd API (503)
    - Retry mechanism
    - Walidacja JSON response

#### 3.2.2 Integracja z Supabase
- **RLS Policies**
  - Weryfikacja izolacji danych między użytkownikami
  - Próba dostępu do cudzej sesji przez manipulację ID
  - Próba dostępu do cudzych kart
  - INSERT/UPDATE/DELETE tylko dla własnych danych

- **Triggers**
  - `update_updated_at` - automatyczna aktualizacja timestamp
  - Weryfikacja działania dla sessions i cards

#### 3.2.3 Integracja z OpenRouter API
- Wywołanie API z rzeczywistymi danymi (staging environment)
- Obsługa timeout
- Obsługa rate limiting
- Parsowanie structured outputs (JSON Schema)
- Generowanie embeddingów (text-embedding-3-small)

**Kryteria akceptacji**:
- Wszystkie endpointy zwracają poprawne kody HTTP
- RLS policies blokują nieautoryzowany dostęp
- Walidacja Zod działa dla wszystkich endpoints
- Error handling działa zgodnie z dokumentacją
- Optimistic updates synchronizują się z backendem

---

### 3.3 Testy end-to-end (E2E Tests)

**Cel**: Weryfikacja pełnych ścieżek użytkownika w rzeczywistym środowisku

**Narzędzia**: Playwright

**Zakres**:

#### 3.3.1 User Flows - Autentykacja
- **Flow US-001: Rejestracja konta**
  1. Otwarcie `/auth/register`
  2. Wypełnienie formularza (email, hasło, potwierdzenie)
  3. Submit
  4. Weryfikacja przekierowania do `/auth/login`
  5. Weryfikacja komunikatu sukcesu

- **Flow US-002: Logowanie**
  1. Otwarcie `/auth/login`
  2. Wypełnienie formularza
  3. Submit
  4. Weryfikacja przekierowania do `/sessions`
  5. Weryfikacja widoczności dashboardu

- **Flow US-003: Wylogowanie**
  1. Kliknięcie przycisku wylogowania w topbarze
  2. Weryfikacja przekierowania do `/auth/login`
  3. Próba dostępu do `/sessions` (powinno przekierować)

#### 3.3.2 User Flows - Sesje
- **Flow US-006 + US-007: Tworzenie i przeglądanie sesji**
  1. Logowanie
  2. Dashboard pusty (empty state)
  3. Kliknięcie "Utwórz nową sesję"
  4. Weryfikacja przekierowania do `/sessions/:id`
  5. Powrót do dashboardu
  6. Weryfikacja pojawienia się sesji na liście

#### 3.3.3 User Flows - Karty
- **Flow US-009: Ręczne dodanie karty**
  1. Otwarcie sesji
  2. Kliknięcie "Dodaj zadanie"
  3. Wypełnienie formularza (external_id, title, description)
  4. Submit
  5. Weryfikacja pojawienia się karty w kubełku "?" (Do wyceny)

- **Flow US-008: Import CSV**
  1. Kliknięcie "Import CSV"
  2. Wybór pliku CSV (poprawny format)
  3. Submit
  4. Weryfikacja liczby zaimportowanych kart
  5. Weryfikacja pojawienia się kart na boardzie

- **Flow US-010: Drag-and-drop**
  1. Przeciągnięcie karty z kubełka "?" do kubełka "5"
  2. Weryfikacja optimistic update
  3. Odświeżenie strony
  4. Weryfikacja, że karta pozostała w kubełku "5"

- **Flow US-011: Podgląd szczegółów**
  1. Kliknięcie karty
  2. Weryfikacja otwarcia modalu
  3. Weryfikacja wyświetlenia external_id, title, description, bucket_value
  4. Zamknięcie modalu

- **Flow US-012: Usuwanie karty**
  1. Otwarcie modalu karty
  2. Kliknięcie "Usuń zadanie"
  3. Potwierdzenie w AlertDialog
  4. Weryfikacja zniknięcia karty z boardu
  5. Weryfikacja toastu z potwierdzeniem

#### 3.3.4 User Flows - AI
- **Flow US-013: Automatyczna estymacja AI**
  1. Dodanie 5 kart do sesji
  2. Kliknięcie "Estymuj AI"
  3. Podanie kontekstu projektu (opcjonalnie)
  4. Potwierdzenie nadpisania układu
  5. Oczekiwanie na response (spinner)
  6. Weryfikacja przypisania kart do kubełków
  7. Weryfikacja, że karty NIE są w kubełku "?"

#### 3.3.5 User Flows - Podsumowanie
- **Flow US-014: Podsumowanie estymacji**
  1. Przeciągnięcie kart do różnych kubełków
  2. Przejście do zakładki "Podsumowanie"
  3. Weryfikacja tabeli (external_id, title, bucket_value)
  4. Weryfikacja sortowania według wyceny
  5. Weryfikacja read-only (brak możliwości edycji)

- **Flow US-015: Czyszczenie sesji**
  1. Kliknięcie "Wyczyść sesję"
  2. Potwierdzenie
  3. Weryfikacja, że wszystkie karty wróciły do kubełka "?"
  4. Weryfikacja, że liczba kart się nie zmieniła

#### 3.3.6 User Flows - Error Handling
- **Flow US-019: Obsługa błędów**
  1. Próba dodania karty z duplikatem external_id
     - Weryfikacja inline error (409)
  2. Próba dodania 51. karty
     - Weryfikacja komunikatu o limicie (422)
  3. Utrata połączenia podczas drag-and-drop
     - Weryfikacja optimistic UI
     - Weryfikacja toastu z błędem
  4. Wygaśnięcie sesji JWT
     - Weryfikacja przekierowania do `/auth/login?redirect=...`

**Kryteria akceptacji**:
- Wszystkie 19 historyjek użytkowników przechodzą E2E testy
- Kryteria akceptacji z PRD są spełnione
- Testy działają w Firefox, Chrome, Safari
- Testy działają na desktop i tablet (responsywność)

---

### 3.4 Testy wydajności (Performance Tests)

**Cel**: Weryfikacja wydajności i skalowalności aplikacji

**Narzędzia**: Lighthouse, Playwright Performance API, k6 (dla API load testing)

**Zakres**:

#### 3.4.1 Frontend Performance
- **Metrics**:
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - Time to Interactive (TTI) < 3.5s
  - Cumulative Layout Shift (CLS) < 0.1
  - First Input Delay (FID) < 100ms

- **Scenarios**:
  - Ładowanie strony głównej
  - Ładowanie dashboardu z 20 sesjami
  - Ładowanie sesji z 50 kartami
  - Drag-and-drop performance przy 50 kartach

#### 3.4.2 Backend Performance
- **API Response Times** (p95):
  - GET endpoints < 200ms
  - POST/PATCH < 500ms
  - AI estimation < 30s (dla 50 kart)

- **Load Testing**:
  - 10 równoczesnych użytkowników
  - 100 requests/min
  - Stress test: 50 równoczesnych użytkowników

#### 3.4.3 Database Performance
- **Query Performance**:
  - `listUserSessions()` z liczeniem kart < 100ms
  - `getCards()` dla 50 kart < 50ms
  - Batch update 50 kart < 200ms

- **RLS Performance**:
  - Weryfikacja, że RLS policies nie spowalniają zapytań znacząco
  - Index performance (`idx_sessions_user_id`, `idx_cards_session_bucket`)

**Kryteria akceptacji**:
- Lighthouse score > 90 dla wszystkich kategorii
- Wszystkie API calls spełniają target response times
- Brak memory leaks w długich sesjach
- Płynne drag-and-drop przy 50 kartach (60fps)

---

### 3.5 Testy bezpieczeństwa (Security Tests)

**Cel**: Weryfikacja bezpieczeństwa aplikacji i ochrony danych użytkowników

**Narzędzia**: OWASP ZAP (do scanowania), manual testing

**Zakres**:

#### 3.5.1 Autentykacja i Autoryzacja
- **Session Management**:
  - Weryfikacja httpOnly, secure, sameSite flags dla cookies
  - Weryfikacja timeout sesji
  - Logout invalidates session

- **Password Security**:
  - Minimum 8 znaków
  - Hasła nie są logowane ani zwracane w response

- **Authorization**:
  - Próba dostępu do `/sessions/:id` innego użytkownika (404)
  - Próba POST/PATCH/DELETE na cudzych zasobach
  - Weryfikacja RLS policies w bazie danych

#### 3.5.2 Walidacja Input
- **SQL Injection**:
  - Próba SQL injection w polach external_id, title, description
  - Weryfikacja, że Supabase używa prepared statements

- **XSS (Cross-Site Scripting)**:
  - Próba wstrzyknięcia `<script>` w title, description
  - Weryfikacja sanitization w React
  - Weryfikacja CSP headers

- **CSV Injection**:
  - Próba wstrzyknięcia formuł Excel w CSV (`=cmd|...`)
  - Weryfikacja escapowania specjalnych znaków

#### 3.5.3 API Security
- **Rate Limiting**:
  - Weryfikacja limitów request dla endpointów (TODO: obecnie brak)
  - Szczególnie dla AI estimation (costly)

- **CORS**:
  - Weryfikacja allowed origins
  - Weryfikacja, że cross-origin requests są blokowane

- **Data Exposure**:
  - Weryfikacja, że API nie zwraca sensitive data (hashe haseł, klucze API)
  - Weryfikacja, że error messages nie ujawniają stack traces

#### 3.5.4 Row Level Security (RLS)
- **Direct Database Access Test**:
  - Próba bezpośredniego dostępu do tabeli `sessions` z innym user_id
  - Próba bezpośredniego dostępu do tabeli `cards` bez ownership
  - Weryfikacja, że wszystkie policies działają poprawnie

**Kryteria akceptacji**:
- Brak krytycznych luk bezpieczeństwa (OWASP Top 10)
- RLS policies blokują 100% nieautoryzowanych dostępów
- Wszystkie inputy są walidowane i sanitized
- Sesje są bezpiecznie zarządzane

---

### 3.6 Testy kompatybilności (Compatibility Tests)

**Cel**: Zapewnienie działania we wszystkich wspieranych środowiskach

**Narzędzia**: BrowserStack, Playwright (multi-browser)

**Zakres**:

#### 3.6.1 Przeglądarki
- **Desktop**:
  - Chrome (latest, latest-1)
  - Firefox (latest, latest-1)
  - Safari (latest, latest-1)
  - Edge (latest)

- **Mobile**:
  - Chrome Android (latest)
  - Safari iOS (latest)

#### 3.6.2 Rozdzielczości
- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024, 1024x768
- Mobile: 375x667, 414x896

#### 3.6.3 Systemy Operacyjne
- Windows 11
- macOS (latest)
- Linux (Ubuntu latest)
- iOS (latest)
- Android (latest)

**Kryteria akceptacji**:
- Aplikacja działa poprawnie we wszystkich wspieranych przeglądarkach
- UI jest responsywny i użyteczny na wszystkich rozdzielczościach
- Drag-and-drop działa na urządzeniach dotykowych

---

### 3.7 Testy użyteczności (Usability Tests)

**Cel**: Weryfikacja intuicyjności interfejsu i user experience

**Metoda**: Manual testing, user feedback sessions

**Zakres**:

#### 3.7.1 Nawigacja (US-018)
- Przejście z dashboardu do sesji i z powrotem
- Przełączanie między zakładkami "Estymacja" i "Podsumowanie"
- Przycisk "Wróć" w widoku sesji

#### 3.7.2 Accessibility (A11y)
- **Keyboard Navigation**:
  - Tab order jest logiczny
  - Wszystkie interaktywne elementy dostępne z klawiatury
  - Drag-and-drop wspiera nawigację klawiaturą (US-010)
  - Focus indicators są widoczne

- **Screen Reader Support**:
  - ARIA labels dla wszystkich controls
  - ARIA live regions dla dynamicznych aktualizacji
  - Semantyczne HTML (button, nav, main, etc.)

- **Color Contrast**:
  - WCAG AA compliance (4.5:1 dla tekstu)
  - Kubełek "?" jest wizualnie wyróżniony (szare tło, przerywana obwódka)

#### 3.7.3 Feedback i Komunikaty
- **Toast Notifications**:
  - Sukces: zielony, ikona checkmark
  - Błąd: czerwony, ikona error
  - Czas wyświetlania: 3-5s
  - Możliwość zamknięcia ręcznie

- **Loading States**:
  - Spinner podczas AI estimation
  - Skeleton loaders dla list
  - Disabled buttons podczas operacji

- **Error Messages**:
  - Inline errors pod polami formularza
  - Toast dla błędów globalnych
  - Jasne komunikaty (bez technicznych detali)

**Kryteria akceptacji**:
- Aplikacja spełnia WCAG 2.1 Level AA
- Wszystkie akcje mają wizualny feedback
- Error messages są zrozumiałe dla użytkownika
- Loading states są widoczne dla operacji > 1s

---

### 3.8 Testy regresyjne (Regression Tests)

**Cel**: Zapewnienie, że nowe zmiany nie psują istniejącej funkcjonalności

**Metoda**: Automatyzacja E2E testów, continuous testing w CI/CD

**Zakres**:
- Wszystkie testy E2E powinny być uruchamiane przed każdym release
- Krytyczne user flows (logowanie, tworzenie sesji, drag-and-drop, AI estimation)
- Integration tests dla wszystkich API endpoints

**Kryteria akceptacji**:
- 100% testów regresyjnych przechodzi przed merge do main
- Czas wykonania full test suite < 15 minut
- Flaky tests < 2%

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Moduł Autentykacji

#### TC-AUTH-001: Rejestracja z poprawnymi danymi (US-001)
- **Priorytet**: Krytyczny
- **Typ**: E2E
- **Warunki wstępne**: Przeglądarka otwarta na `/auth/register`
- **Kroki**:
  1. Wpisz email: `test@example.com`
  2. Wpisz hasło: `SecurePass123!`
  3. Wpisz potwierdzenie hasła: `SecurePass123!`
  4. Kliknij "Zarejestruj się"
- **Oczekiwany rezultat**:
  - Przekierowanie do `/auth/login`
  - Toast: "Rejestracja zakończona sukcesem. Możesz się teraz zalogować."
  - Nowe konto utworzone w bazie danych

#### TC-AUTH-002: Rejestracja z błędnym formatem email (US-001)
- **Priorytet**: Wysoki
- **Typ**: E2E
- **Kroki**:
  1. Wpisz email: `invalid-email`
  2. Wpisz hasło: `SecurePass123!`
  3. Wpisz potwierdzenie: `SecurePass123!`
  4. Kliknij "Zarejestruj się"
- **Oczekiwany rezultat**:
  - Inline error pod polem email: "Nieprawidłowy format adresu email"
  - Formularz nie jest submitowany

#### TC-AUTH-003: Rejestracja z niezgodnymi hasłami (US-001)
- **Priorytet**: Wysoki
- **Typ**: E2E
- **Kroki**:
  1. Wpisz email: `test@example.com`
  2. Wpisz hasło: `SecurePass123!`
  3. Wpisz potwierdzenie: `DifferentPass456!`
  4. Kliknij "Zarejestruj się"
- **Oczekiwany rezultat**:
  - Inline error: "Hasła muszą być zgodne"

#### TC-AUTH-004: Rejestracja z zajętym emailem (US-001)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Warunki wstępne**: Użytkownik `existing@example.com` już istnieje
- **Kroki**:
  1. POST `/api/auth/register`
  2. Body: `{ email: "existing@example.com", password: "Pass123!" }`
- **Oczekiwany rezultat**:
  - Status: 409 Conflict
  - Response: `{ code: "EMAIL_ALREADY_EXISTS", message: "..." }`

#### TC-AUTH-005: Logowanie z poprawnymi danymi (US-002)
- **Priorytet**: Krytyczny
- **Typ**: E2E
- **Warunki wstępne**: Konto `test@example.com` istnieje
- **Kroki**:
  1. Otwórz `/auth/login`
  2. Wpisz email: `test@example.com`
  3. Wpisz hasło: `SecurePass123!`
  4. Kliknij "Zaloguj się"
- **Oczekiwany rezultat**:
  - Przekierowanie do `/sessions`
  - Cookie sesji ustawione (httpOnly, secure, sameSite=lax)
  - Dashboard sesji wyświetlony

#### TC-AUTH-006: Logowanie z błędnym hasłem (US-002)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Kroki**:
  1. POST `/api/auth/login`
  2. Body: `{ email: "test@example.com", password: "WrongPass" }`
- **Oczekiwany rezultat**:
  - Status: 401 Unauthorized
  - Response: `{ code: "INVALID_CREDENTIALS", message: "..." }`
  - Komunikat NIE ujawnia, czy email istnieje

#### TC-AUTH-007: Wylogowanie (US-003)
- **Priorytet**: Krytyczny
- **Typ**: E2E
- **Warunki wstępne**: Użytkownik zalogowany
- **Kroki**:
  1. Kliknij przycisk wylogowania w topbarze
  2. Próba dostępu do `/sessions`
- **Oczekiwany rezultat**:
  - Przekierowanie do `/auth/login`
  - Cookie sesji usunięte
  - Dostęp do `/sessions` przekierowuje do logowania

#### TC-AUTH-008: Izolacja danych między użytkownikami (US-004)
- **Priorytet**: Krytyczny
- **Typ**: Integration + Security
- **Warunki wstępne**: Użytkownik A ma sesję `session-A-id`, użytkownik B jest zalogowany
- **Kroki**:
  1. Użytkownik B próbuje: GET `/api/sessions/session-A-id`
- **Oczekiwany rezultat**:
  - Status: 404 Not Found
  - RLS policy blokuje dostęp
  - Brak danych w response

#### TC-AUTH-009: Wygaśnięcie sesji JWT (US-005)
- **Priorytet**: Wysoki
- **Typ**: E2E
- **Warunki wstępne**: Token JWT wygasł (symulowane przez ustawienie starego tokenu)
- **Kroki**:
  1. Próba dostępu do `/sessions/some-id`
- **Oczekiwany rezultat**:
  - Przekierowanie do `/auth/login?redirect=/sessions/some-id`
  - Po zalogowaniu: przekierowanie z powrotem do `/sessions/some-id`

---

### 4.2 Moduł Zarządzania Sesjami

#### TC-SESSION-001: Tworzenie nowej sesji bez kontekstu (US-007)
- **Priorytet**: Krytyczny
- **Typ**: Integration
- **Warunki wstępne**: Użytkownik zalogowany
- **Kroki**:
  1. POST `/api/sessions`
  2. Body: `{}`
- **Oczekiwany rezultat**:
  - Status: 201 Created
  - Response: `{ id: "uuid", user_id: "uuid", is_active: true, context: null, ... }`
  - Nowa sesja utworzona w bazie

#### TC-SESSION-002: Tworzenie sesji z kontekstem (US-017)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Kroki**:
  1. POST `/api/sessions`
  2. Body: `{ context: "E-commerce project with React" }`
- **Oczekiwany rezultat**:
  - Status: 201 Created
  - Response zawiera context

#### TC-SESSION-003: Lista sesji użytkownika (US-006)
- **Priorytet**: Krytyczny
- **Typ**: E2E
- **Warunki wstępne**: Użytkownik ma 3 sesje
- **Kroki**:
  1. Zaloguj się
  2. Przejdź do `/sessions`
- **Oczekiwany rezultat**:
  - Dashboard wyświetla 3 sesje
  - Każda sesja pokazuje: ID (skrócone), datę utworzenia, liczbę kart
  - Sesje sortowane od najnowszych

#### TC-SESSION-004: Paginacja listy sesji (US-006)
- **Priorytet**: Średni
- **Typ**: Integration
- **Warunki wstępne**: Użytkownik ma 30 sesji
- **Kroki**:
  1. GET `/api/sessions?limit=10&offset=0`
  2. GET `/api/sessions?limit=10&offset=10`
- **Oczekiwany rezultat**:
  - Pierwsze wywołanie: 10 sesji (najnowsze)
  - Drugie wywołanie: następne 10 sesji
  - Response zawiera pagination metadata

#### TC-SESSION-005: Empty state dashboardu (US-006)
- **Priorytet**: Średni
- **Typ**: E2E
- **Warunki wstępne**: Nowy użytkownik bez sesji
- **Kroki**:
  1. Zaloguj się
  2. Przejdź do `/sessions`
- **Oczekiwany rezultat**:
  - Empty state wyświetlony
  - CTA button: "Utwórz pierwszą sesję"
  - Kliknięcie tworzy nową sesję

#### TC-SESSION-006: Aktualizacja kontekstu sesji (US-017)
- **Priorytet**: Średni
- **Typ**: Integration
- **Kroki**:
  1. PATCH `/api/sessions/:sessionId`
  2. Body: `{ context: "Updated project context" }`
- **Oczekiwany rezultat**:
  - Status: 200 OK
  - Response zawiera zaktualizowany context
  - Pole `updated_at` zaktualizowane

#### TC-SESSION-007: Usunięcie sesji (US-016)
- **Priorytet**: Wysoki
- **Typ**: E2E
- **Warunki wstępne**: Sesja z 5 kartami
- **Kroki**:
  1. W dashboardzie lub widoku sesji: kliknij "Usuń sesję"
  2. Potwierdź w AlertDialog
- **Oczekiwany rezultat**:
  - Sesja usunięta z bazy (CASCADE usunie także karty)
  - Przekierowanie do `/sessions`
  - Toast: "Sesja usunięta"
  - Sesja znika z listy

---

### 4.3 Moduł Zarządzania Kartami

#### TC-CARD-001: Ręczne dodanie karty z pełnymi danymi (US-009)
- **Priorytet**: Krytyczny
- **Typ**: E2E
- **Kroki**:
  1. W widoku sesji kliknij "Dodaj zadanie"
  2. Wypełnij: external_id="TASK-001", title="Fix login bug", description="Details..."
  3. Kliknij "Zapisz"
- **Oczekiwany rezultat**:
  - Modal zamknięty
  - Karta pojawia się w kubełku "?" (bucket_value=null)
  - Toast: "Zadanie dodane"

#### TC-CARD-002: Dodanie karty bez opisu (US-009)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Kroki**:
  1. POST `/api/sessions/:sessionId/cards`
  2. Body: `{ external_id: "TASK-002", title: "Simple task" }`
- **Oczekiwany rezultat**:
  - Status: 201 Created
  - description = null
  - Karta utworzona

#### TC-CARD-003: Próba dodania karty z duplikatem external_id (US-009)
- **Priorytet**: Krytyczny
- **Typ**: Integration
- **Warunki wstępne**: Karta z external_id="TASK-001" już istnieje w sesji
- **Kroki**:
  1. POST `/api/sessions/:sessionId/cards`
  2. Body: `{ external_id: "TASK-001", title: "Duplicate" }`
- **Oczekiwany rezultat**:
  - Status: 409 Conflict
  - Response: `{ code: "DUPLICATE_EXTERNAL_ID", message: "...", details: [...] }`
  - Inline error w UI pod polem external_id

#### TC-CARD-004: Próba dodania 51. karty (US-009)
- **Priorytet**: Krytyczny
- **Typ**: Integration
- **Warunki wstępne**: Sesja ma już 50 kart
- **Kroki**:
  1. POST `/api/sessions/:sessionId/cards`
  2. Body: `{ external_id: "TASK-051", title: "Over limit" }`
- **Oczekiwany rezultat**:
  - Status: 422 Unprocessable Entity
  - Response: `{ code: "CARDS_LIMIT_EXCEEDED", message: "Limit 50 kart...", details: { current: 50, max: 50 } }`
  - Toast w UI: "Przekroczono limit 50 kart"

#### TC-CARD-005: Import poprawnego pliku CSV (US-008)
- **Priorytet**: Krytyczny
- **Typ**: E2E
- **Warunki wstępne**: Plik `tasks.csv` z 10 wierszami (id, title, description)
- **Kroki**:
  1. Kliknij "Import CSV"
  2. Wybierz plik `tasks.csv`
  3. Kliknij "Importuj"
- **Oczekiwany rezultat**:
  - Modal pokazuje: "Zaimportowano 10 zadań"
  - Modal zamknięty
  - 10 kart pojawia się w kubełku "?"
  - Toast: "Import zakończony sukcesem"

#### TC-CARD-006: Import CSV z błędnymi wierszami (US-008)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Warunki wstępne**: CSV z 5 poprawnymi wierszami i 2 błędnymi (brak title)
- **Kroki**:
  1. POST `/api/sessions/:sessionId/cards/import`
  2. Body: `{ csv_content: "..." }`
- **Oczekiwany rezultat**:
  - Status: 200 OK (partial success)
  - Response: `{ imported: 5, failed: 2, errors: [{ row: 3, reason: "..." }, ...], cards: [...] }`
  - UI pokazuje: "Zaimportowano 5 z 7. Błędy: wiersz 3, wiersz 6"

#### TC-CARD-007: Import CSV przekraczający limit (US-008)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Warunki wstępne**: Sesja ma 45 kart, CSV zawiera 10 kart
- **Kroki**:
  1. POST `/api/sessions/:sessionId/cards/import`
- **Oczekiwany rezultat**:
  - Status: 422
  - Response: `{ code: "CARDS_LIMIT_EXCEEDED", message: "...", details: { available: 5, requested: 10 } }`

#### TC-CARD-008: Drag-and-drop karty (US-010)
- **Priorytet**: Krytyczny
- **Typ**: E2E
- **Kroki**:
  1. Przeciągnij kartę z kubełka "?" do kubełka "5"
  2. Poczekaj 1s (optimistic update + API call)
  3. Odśwież stronę
- **Oczekiwany rezultat**:
  - Karta natychmiast pojawia się w kubełku "5" (optimistic UI)
  - Po odświeżeniu: karta nadal w kubełku "5"
  - API call: PATCH `/api/sessions/:sessionId/cards` z `[{ id, bucket_value: 5 }]`

#### TC-CARD-009: Drag-and-drop wielu kart jednocześnie (US-010)
- **Priorytet**: Średni
- **Typ**: E2E
- **Kroki**:
  1. Przeciągnij kartę A do kubełka "3"
  2. Natychmiast przeciągnij kartę B do kubełka "8"
  3. Przeciągnij kartę C do kubełka "13"
- **Oczekiwany rezultat**:
  - Wszystkie karty przesuwają się optimistically
  - Batch API call z 3 zmianami
  - Po odświeżeniu: wszystkie zmiany zapisane

#### TC-CARD-010: Podgląd szczegółów karty (US-011)
- **Priorytet**: Wysoki
- **Typ**: E2E
- **Kroki**:
  1. Kliknij kartę "TASK-001"
- **Oczekiwany rezultat**:
  - Modal otwiera się
  - Wyświetla: external_id="TASK-001", title="...", description="...", badge z bucket_value
  - Wszystkie pola read-only
  - Przycisk "Usuń zadanie" widoczny

#### TC-CARD-011: Usunięcie karty przez modal (US-012)
- **Priorytet**: Wysoki
- **Typ**: E2E
- **Kroki**:
  1. Kliknij kartę
  2. W modalu kliknij "Usuń zadanie"
  3. Potwierdź w AlertDialog
- **Oczekiwany rezultat**:
  - Modal zamknięty
  - Karta znika z boardu (optimistic UI)
  - Toast: "Zadanie usunięte"
  - DELETE `/api/sessions/:sessionId/cards/:id`

#### TC-CARD-012: Aktualizacja karty (partial update)
- **Priorytet**: Średni
- **Typ**: Integration
- **Kroki**:
  1. PATCH `/api/sessions/:sessionId/cards/:id`
  2. Body: `{ title: "Updated title" }` (bez description i bucket_value)
- **Oczekiwany rezultat**:
  - Status: 200 OK
  - Tylko title zaktualizowane
  - description i bucket_value pozostają bez zmian

---

### 4.4 Moduł AI

#### TC-AI-001: Estymacja AI wszystkich kart (US-013)
- **Priorytet**: Krytyczny
- **Typ**: E2E
- **Warunki wstępne**: Sesja z 10 kartami w kubełku "?"
- **Kroki**:
  1. Kliknij "Estymuj AI"
  2. W modalu wpisz kontekst: "E-commerce React app"
  3. Zaznacz "Potwierdzam nadpisanie układu"
  4. Kliknij "Rozpocznij estymację"
  5. Poczekaj na zakończenie (spinner)
- **Oczekiwany rezultat**:
  - Po zakończeniu: karty przypisane do kubełków (1, 2, 3, 5, 8, 13, 21)
  - Brak kart w kubełku "?" (wszystkie wycenione)
  - Toast: "Estymacja AI zakończona"
  - Co najmniej 60% kart ma sensowną wycenę (zgodnie z metrykami sukcesu)

#### TC-AI-002: Estymacja AI bez kontekstu (US-013)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Kroki**:
  1. POST `/api/sessions/:sessionId/ai/estimate`
  2. Body: `{ confirm_override: true }`
- **Oczekiwany rezultat**:
  - Status: 200 OK
  - AI używa tylko treści kart (bez kontekstu projektu)
  - Wszystkie karty dostają bucket_value

#### TC-AI-003: Estymacja bez potwierdzenia nadpisania (US-013)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Kroki**:
  1. POST `/api/sessions/:sessionId/ai/estimate`
  2. Body: `{ confirm_override: false }`
- **Oczekiwany rezultat**:
  - Status: 400 Bad Request
  - Response: `{ code: "CONFIRMATION_REQUIRED", message: "..." }`

#### TC-AI-004: Błąd API OpenRouter (US-013)
- **Priorytet**: Krytyczny
- **Typ**: Integration (mock)
- **Warunki wstępne**: OpenRouter API zwraca 503 Service Unavailable
- **Kroki**:
  1. POST `/api/sessions/:sessionId/ai/estimate`
- **Oczekiwany rezultat**:
  - Status: 503
  - Response: `{ code: "AI_SERVICE_UNAVAILABLE", message: "..." }`
  - Toast w UI: "Błąd AI. Spróbuj ponownie."
  - Karty pozostają w poprzednich kubełkach (rollback)

#### TC-AI-005: Generowanie embeddingów (implicit test)
- **Priorytet**: Wysoki
- **Typ**: Integration
- **Warunki wstępne**: Karta z description
- **Kroki**:
  1. POST `/api/sessions/:sessionId/cards`
  2. Body: `{ external_id: "TASK-001", title: "...", description: "Technical details..." }`
  3. GET `/api/sessions/:sessionId/cards`
- **Oczekiwany rezultat**:
  - Karta ma `has_embedding: true` w response
  - Embedding zapisany w kolumnie `embedding` (vector 1536)
  - 100% poprawności dla zadań z opisem (zgodnie z metrykami sukcesu)

#### TC-AI-006: Walidacja JSON Schema w response AI
- **Priorytet**: Średni
- **Typ**: Unit
- **Warunki wstępne**: Mock odpowiedzi AI z błędnym formatem
- **Kroki**:
  1. Wywołaj `runAIEstimation()` z mock response: `{ tasks: [{ id: "TASK-001", estimate: 99 }] }` (99 nie jest w Fibonacci)
- **Oczekiwany rezultat**:
  - Funkcja rzuca error: `AI_INVALID_RESPONSE`
  - Zod validation schema blokuje niepoprawne wartości

---

### 4.5 Moduł Podsumowania

#### TC-SUMMARY-001: Wyświetlenie podsumowania estymacji (US-014)
- **Priorytet**: Wysoki
- **Typ**: E2E
- **Warunki wstępne**: Sesja z 10 kartami, wszystkie wycenione
- **Kroki**:
  1. W widoku sesji kliknij zakładkę "Podsumowanie"
- **Oczekiwany rezultat**:
  - Tabela wyświetla 10 wierszy
  - Kolumny: ID, Tytuł, Wycena
  - Wiersze sortowane według wyceny (ascending)
  - Wszystkie pola read-only (brak input fields)

#### TC-SUMMARY-002: Podsumowanie z kartami "?" (US-014)
- **Priorytet**: Średni
- **Typ**: E2E
- **Warunki wstępne**: 5 kart wycenionych, 3 karty w kubełku "?"
- **Kroki**:
  1. Przejdź do zakładki "Podsumowanie"
- **Oczekiwany rezultat**:
  - Tabela pokazuje wszystkie 8 kart
  - Karty z bucket_value=null mają wycenę "?" lub "Nie wycenione"
  - Sortowanie: wycenione na początku, niewycenione na końcu

#### TC-SUMMARY-003: Czyszczenie sesji (US-015)
- **Priorytet**: Wysoki
- **Typ**: E2E
- **Warunki wstępne**: Sesja z 10 kartami, wszystkie wycenione
- **Kroki**:
  1. Kliknij "Wyczyść sesję"
  2. Potwierdź w AlertDialog
- **Oczekiwany rezultat**:
  - Wszystkie karty mają bucket_value=null
  - Wszystkie karty wracają do kubełka "?"
  - Liczba kart pozostaje 10
  - Toast: "Wyczyszczono 10 kart"
  - Embeddingi zachowane (has_embedding=true dla kart z opisem)

#### TC-SUMMARY-004: Synchronizacja między zakładkami (US-018)
- **Priorytet**: Średni
- **Typ**: E2E
- **Kroki**:
  1. W zakładce "Estymacja" przeciągnij kartę do kubełka "8"
  2. Przejdź do zakładki "Podsumowanie"
  3. Wróć do zakładki "Estymacja"
- **Oczekiwany rezultat**:
  - Tabela podsumowania pokazuje aktualną wycenę "8"
  - Stan sesji zachowany przy nawigacji
  - URL się nie zmienia przy przełączaniu zakładek

---

### 4.6 Scenariusze Edge Case

#### TC-EDGE-001: Concurrent drag-and-drop
- **Priorytet**: Średni
- **Typ**: E2E
- **Kroki**:
  1. Otwórz sesję w dwóch zakładkach
  2. W zakładce A: przeciągnij kartę do kubełka "5"
  3. Jednocześnie w zakładce B: przeciągnij tę samą kartę do kubełka "8"
- **Oczekiwany rezultat**:
  - Ostatnia operacja wygrywa
  - Obie zakładki: karta w kubełku "8" (po odświeżeniu)

#### TC-EDGE-002: AI estymacja podczas drag-and-drop
- **Priorytet**: Niski
- **Typ**: E2E
- **Kroki**:
  1. Rozpocznij estymację AI
  2. Podczas oczekiwania na response: przeciągnij kartę do innego kubełka
- **Oczekiwany rezultat**:
  - Opcja 1: Drag-and-drop blokowany podczas AI estimation (UI disabled)
  - Opcja 2: Drag-and-drop działa, AI nadpisuje układ po zakończeniu

#### TC-EDGE-003: Import CSV z polskimi znakami
- **Priorytet**: Średni
- **Typ**: Integration
- **Warunki wstępne**: CSV z UTF-8 encoding: `TASK-001,Naprawić błąd,Szczegóły zadania ąćęłńóśźż`
- **Kroki**:
  1. POST `/api/sessions/:sessionId/cards/import`
- **Oczekiwany rezultat**:
  - Karta utworzona poprawnie
  - Polskie znaki wyświetlane prawidłowo

#### TC-EDGE-004: Bardzo długi opis karty
- **Priorytet**: Niski
- **Typ**: Integration
- **Kroki**:
  1. POST `/api/sessions/:sessionId/cards`
  2. Body z description o długości 10,000 znaków
- **Oczekiwany rezultat**:
  - Karta utworzona
  - Embedding wygenerowany poprawnie
  - Modal szczegółów renderuje pełny opis (ze scrollem)

#### TC-EDGE-005: Session bez kart
- **Priorytet**: Niski
- **Typ**: E2E
- **Kroki**:
  1. Utwórz nową sesję
  2. Nie dodawaj kart
  3. Kliknij "Estymuj AI"
- **Oczekiwany rezultat**:
  - Przycisk "Estymuj AI" disabled lub
  - Modal pokazuje komunikat: "Brak kart do estymacji"

---

## 5. Środowisko testowe

### 5.1 Środowiska

| Środowisko | URL | Cel | Backend |
|------------|-----|-----|---------|
| **Development** | http://localhost:4321 | Lokalne testy deweloperskie | Supabase Local (Docker) |
| **Staging** | https://staging.bucketestimate.app | Testy integracyjne i E2E | Supabase Cloud (staging project) |
| **Production** | https://bucketestimate.app | Smoke tests po deployment | Supabase Cloud (prod project) |

### 5.2 Konfiguracja środowisk

#### Development
```env
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbG... (local anon key)
OPENROUTER_API_KEY=sk-or-... (dev API key z limitem)
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
```

#### Staging
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbG... (staging anon key)
OPENROUTER_API_KEY=sk-or-... (staging API key)
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
```

#### Production
```env
SUPABASE_URL=https://yyy.supabase.co
SUPABASE_KEY=eyJhbG... (prod anon key)
OPENROUTER_API_KEY=sk-or-... (prod API key z rate limiting)
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5
```

### 5.3 Dane testowe

#### Użytkownicy testowi (Staging)
- `qa-user-1@example.com` / `TestPass123!` - użytkownik z 10 sesjami, różne stany
- `qa-user-2@example.com` / `TestPass123!` - użytkownik bez sesji (empty state)
- `qa-admin@example.com` / `TestPass123!` - admin do weryfikacji RLS

#### Fixtures
- `test-data/users.sql` - użytkownicy testowi
- `test-data/sessions.sql` - przykładowe sesje
- `test-data/cards.sql` - karty w różnych stanach
- `test-data/sample-import.csv` - poprawny CSV do importu
- `test-data/invalid-import.csv` - CSV z błędami

### 5.4 Reset środowiska testowego

Przed każdym cyklem testów:
1. Uruchom skrypt: `npm run test:reset-db`
2. Załaduj fixtures: `npm run test:seed`
3. Wyczyść cache przeglądarki
4. Zweryfikuj działanie OpenRouter API (health check)

---

## 6. Narzędzia do testowania

### 6.1 Framework testowy

| Typ testów | Framework | Wersja | Uzasadnienie |
|------------|-----------|--------|--------------|
| **Unit Tests** | Vitest | ^2.x | Szybki, kompatybilny z Vite/Astro, wbudowane mocking |
| **Component Tests** | Testing Library | ^16.x | Best practices dla React, accessibility first |
| **Integration Tests** | Vitest + Supertest | ^7.x | Testowanie API endpoints bez uruchamiania przeglądarki |
| **E2E Tests** | Playwright | ^1.48 | Multi-browser, auto-wait, parallel execution |
| **Performance Tests** | Lighthouse CI + k6 | latest | Core Web Vitals + load testing |
| **Security Tests** | OWASP ZAP | ^2.15 | Automatyczne skanowanie luk bezpieczeństwa |

### 6.2 Biblioteki pomocnicze

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitest/ui": "^2.0.0",
    "vitest": "^2.0.0",
    "playwright": "^1.48.0",
    "@playwright/test": "^1.48.0",
    "supertest": "^7.0.0",
    "msw": "^2.6.0",
    "faker-js/faker": "^9.0.0"
  }
}
```

### 6.3 Mocki i stuby

#### Mock Service Worker (MSW)
- Mock OpenRouter API dla unit/integration testów
- Mock Supabase responses dla izolowanych testów komponentów
- Handlers dla różnych scenariuszy (success, error, timeout)

#### Test Doubles
```typescript
// Przykład mock dla OpenRouter
export const mockOpenRouterSuccess = {
  choices: [{
    message: {
      content: JSON.stringify({
        tasks: [
          { external_id: "TASK-001", bucket_value: 5 },
          { external_id: "TASK-002", bucket_value: 8 }
        ]
      })
    }
  }]
};

export const mockOpenRouterError = {
  error: { message: "Rate limit exceeded", code: 429 }
};
```

### 6.4 CI/CD Integration

**GitHub Actions Workflow:**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v4

  integration-tests:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/supabase-local:latest
    steps:
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e -- --project=${{ matrix.browser }}
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
```

### 6.5 Komendy testowe

```bash
# Unit tests
npm run test:unit                 # Wszystkie testy jednostkowe
npm run test:unit -- --watch      # Watch mode
npm run test:unit -- --coverage   # Z pokryciem kodu

# Integration tests
npm run test:integration          # API + RLS + DB
npm run test:integration -- --grep "auth" # Tylko auth tests

# E2E tests
npm run test:e2e                  # Wszystkie przeglądarki
npm run test:e2e:chrome           # Tylko Chrome
npm run test:e2e:headed           # Z widoczną przeglądarką
npm run test:e2e -- --grep "@smoke" # Tylko smoke tests

# Performance tests
npm run test:perf                 # Lighthouse + k6
npm run test:perf:lighthouse      # Tylko Lighthouse
npm run test:perf:load            # Tylko load testing (k6)

# All tests
npm run test                      # Wszystkie testy (CI)
npm run test:watch                # Watch mode dla dev
```

---

## 7. Harmonogram testów

### 7.1 Podział na iteracje

#### **Sprint 1: Autentykacja i Sesje** (2 tygodnie)
- **Tydzień 1**: Implementacja + Unit Tests
  - Autentykacja (US-001, US-002, US-003)
  - Middleware
  - RLS policies
  - Unit tests dla auth services
- **Tydzień 2**: Integration + E2E Tests
  - Integration tests dla API auth
  - E2E tests dla user flows (logowanie, rejestracja, wylogowanie)
  - Security tests (RLS, session management)
  - **Exit criteria**: Wszystkie testy US-001 do US-005 przechodzą

#### **Sprint 2: Zarządzanie Kartami** (2 tygodnie)
- **Tydzień 1**: CRUD + Import CSV
  - Dodawanie kart (US-009)
  - Import CSV (US-008)
  - Unit tests dla cards.service.ts
  - Integration tests dla API cards
- **Tydzień 2**: Drag-and-drop + Szczegóły
  - Drag-and-drop (US-010)
  - Modal szczegółów (US-011)
  - Usuwanie kart (US-012)
  - E2E tests dla wszystkich user flows kart
  - **Exit criteria**: US-008 do US-012 przechodzą

#### **Sprint 3: AI i Podsumowanie** (2 tygodnie)
- **Tydzień 1**: Integracja AI
  - AI estymacja (US-013)
  - Embeddingi
  - Unit tests dla ai-estimate.service.ts
  - Integration tests z mock OpenRouter
  - Integration tests z rzeczywistym API (staging)
- **Tydzień 2**: Podsumowanie i raportowanie
  - Podsumowanie (US-014)
  - Czyszczenie sesji (US-015)
  - E2E tests dla AI flow
  - Performance tests (AI latency, embedding generation)
  - **Exit criteria**: US-013 do US-015 + metryki sukcesu AI

#### **Sprint 4: Finalizacja i Regresja** (1.5 tygodnia)
- **Tydzień 1**: Pozostałe US + Edge Cases
  - Usuwanie sesji (US-016)
  - Kontekst sesji (US-017)
  - Nawigacja (US-018)
  - Obsługa błędów (US-019)
  - E2E tests dla wszystkich pozostałych flows
  - Testy edge cases (TC-EDGE-001 do TC-EDGE-005)
- **Dzień 6-7**: Testy regresyjne
  - Uruchomienie full test suite
  - Weryfikacja wszystkich 19 US
  - **Exit criteria**: 100% testów przechodzi

#### **Sprint 5: Wydajność i Bezpieczeństwo** (1 tydzień)
- **Dzień 1-3**: Performance Testing
  - Lighthouse audits
  - k6 load testing
  - Database query optimization
  - Frontend performance (drag-and-drop przy 50 kartach)
- **Dzień 4-5**: Security Testing
  - OWASP ZAP scanning
  - RLS penetration testing
  - Input validation audits
  - CORS, CSP, cookie security

### 7.2 Timeline

```
Tydzień 1-2:   [Sprint 1: Auth + Sesje]
Tydzień 3-4:   [Sprint 2: Karty + DnD]
Tydzień 5-6:   [Sprint 3: AI + Podsumowanie]
Tydzień 7-8:   [Sprint 4: Finalizacja + Regresja]
Tydzień 9:     [Sprint 5: Performance + Security]
Tydzień 10:    [UAT + Bug Fixes]
```

**Całkowity czas**: ~10 tygodni (2.5 miesiąca)

### 7.3 Daily Testing Activities

#### Daily (dla deweloperów)
- Uruchamianie unit testów przed commit (`npm run test:unit`)
- Pre-commit hook: linting + unit tests
- Pre-push hook: integration tests dla zmienionych modułów

#### Per Pull Request
- GitHub Actions: unit + integration tests
- Code coverage check (minimum 80% dla nowych plików)
- Lighthouse audit dla zmian frontend
- Playwright E2E dla affected user flows

#### Weekly (dla QA)
- Pełny E2E test suite na staging
- Smoke tests na production po deployment
- Security scan (OWASP ZAP)
- Performance regression tests

---

## 8. Kryteria akceptacji testów

### 8.1 Kryteria wyjścia (Exit Criteria)

Testy uznaje się za zakończone, gdy:

#### Funkcjonalność
- ✅ Wszystkie 19 historyjek użytkowników (US-001 do US-019) przechodzą testy E2E
- ✅ 100% kryteriów akceptacji z PRD jest spełnionych
- ✅ Wszystkie krytyczne i wysokie priority testy przechodzą (0 failed)
- ✅ Średnie priority testy: max 5% failed (z akceptacją Product Ownera)

#### Code Coverage
- ✅ Unit tests: ≥80% dla serwisów business logic
- ✅ Unit tests: ≥70% dla komponentów React
- ✅ Integration tests: 100% API endpoints pokrytych
- ✅ E2E tests: 100% krytycznych user flows pokrytych

#### Wydajność (zgodnie z sekcją 3.4)
- ✅ Lighthouse score >90 dla wszystkich kategorii
- ✅ API response times spełniają SLA (p95)
- ✅ Drag-and-drop działa płynnie przy 50 kartach (60fps)

#### Bezpieczeństwo
- ✅ 0 krytycznych luk bezpieczeństwa (OWASP ZAP)
- ✅ RLS policies blokują 100% nieautoryzowanych dostępów
- ✅ Wszystkie inputy walidowane i sanitized

#### Metryki sukcesu z PRD
- ✅ Co najmniej 60% zadań pozostaje w kubełkach zaproponowanych przez AI (benchmark test)
- ✅ 100% poprawności zapisu embeddingów dla zadań z opisem technicznym (test integracji)
- ✅ Minimum 90% udanych sesji bez krytycznych błędów (monitoring staging przez tydzień)

### 8.2 Definicja "Done" dla testów

Test jest "Done", gdy:
1. Test case jest zaimplementowany i działa lokalnie
2. Test przechodzi w CI/CD pipeline
3. Test jest deterministyczny (nie flaky)
4. Test ma czytelną dokumentację (komentarze, nazwy)
5. Test raportuje jasny komunikat błędu przy failure
6. Test jest dodany do test suite w odpowiedniej kategorii

### 8.3 Bug Severity Classification

| Severity | Definicja | Przykład | Wymagana akcja |
|----------|-----------|----------|----------------|
| **Critical** | Aplikacja nie działa, brak workaround, dotyczy kluczowej funkcji | Nie można się zalogować, RLS nie działa | Fix natychmiast, block release |
| **High** | Znaczący wpływ na użytkownika, ograniczony workaround | Drag-and-drop nie zapisuje zmian, AI estymacja zawsze failuje | Fix przed release |
| **Medium** | Mały wpływ, workaround istnieje | Toast notification nie znika, sortowanie w podsumowaniu odwrotne | Fix w następnej iteracji |
| **Low** | Kosmetyczny, nie wpływa na funkcjonalność | Typo w komunikacie, odstęp w UI | Backlog |

### 8.4 Bug Tracking

**Wymagane informacje w raporcie błędu:**
1. **Tytuł**: Krótki opis (np. "Drag-and-drop nie działa w Firefox")
2. **Severity**: Critical / High / Medium / Low
3. **Środowisko**: Browser, OS, URL, wersja aplikacji
4. **Kroki do reprodukcji**: Dokładne kroki 1-2-3
5. **Oczekiwany rezultat**: Co powinno się stać
6. **Aktualny rezultat**: Co się stało (+ screenshot/video)
7. **Dodatkowe informacje**: Console errors, network logs, stack trace

**Narzędzie**: GitHub Issues z labelami:
- `bug:critical`, `bug:high`, `bug:medium`, `bug:low`
- `area:auth`, `area:cards`, `area:ai`, `area:ui`
- `status:new`, `status:in-progress`, `status:ready-for-test`, `status:closed`

---

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 Zespół testowy

| Rola | Osoba | Odpowiedzialności |
|------|-------|-------------------|
| **QA Lead** | [Imię] | Strategia testowania, plan testów, review wyników, raportowanie do PM |
| **QA Engineer 1** | [Imię] | Unit tests, integration tests, test automation |
| **QA Engineer 2** | [Imię] | E2E tests (Playwright), regression testing, manual exploratory testing |
| **Performance Engineer** | [Imię] | Performance testing (Lighthouse, k6), optimization recommendations |
| **Security Tester** | [Imię] | Security audits, OWASP ZAP, RLS verification, penetration testing |
| **Developers** | Cały zespół dev | Unit tests, code reviews, fix bugs, implement test feedback |
| **Product Owner** | [Imię] | Akceptacja kryteriów, priorytetyzacja bug fixes, UAT |

### 9.2 RACI Matrix

| Aktywność | QA Lead | QA Engineers | Dev Team | PO | Sec Tester |
|-----------|---------|--------------|----------|----|----|
| **Plan testów** | R/A | C | C | I | C |
| **Unit tests** | I | C | R/A | I | I |
| **Integration tests** | C | R/A | C | I | I |
| **E2E tests** | C | R/A | I | I | I |
| **Performance tests** | I | C | I | I | R/A |
| **Security tests** | C | I | I | I | R/A |
| **Bug triage** | R | C | C | A | C |
| **Bug fixing** | I | I | R/A | C | I |
| **Regression testing** | A | R | I | I | I |
| **Test reporting** | R/A | C | I | I | I |
| **UAT** | C | C | I | R/A | I |

**Legenda**: R = Responsible, A = Accountable, C = Consulted, I = Informed

### 9.3 Workflow testowania

```
1. Developer implementuje feature
   ↓
2. Developer pisze unit tests (minimum 80% coverage)
   ↓
3. Developer tworzy Pull Request
   ↓
4. GitHub Actions uruchamia: unit + integration tests
   ↓ (jeśli pass)
5. Code review (dev + QA Lead)
   ↓ (jeśli approved)
6. Merge do main branch
   ↓
7. Deploy do staging (auto)
   ↓
8. QA Engineers uruchamiają E2E tests na staging
   ↓ (jeśli pass)
9. Exploratory testing przez QA
   ↓ (jeśli pass)
10. Performance + Security tests (weekly)
   ↓ (jeśli pass)
11. Product Owner: UAT
   ↓ (jeśli approved)
12. Deploy do production
   ↓
13. Smoke tests na production
```

### 9.4 Komunikacja i raportowanie

#### Daily Standups (dla QA)
- Co zostało przetestowane wczoraj?
- Co będzie testowane dziś?
- Czy są blokery?

#### Weekly Test Reports (QA Lead → PM)
Format:
```markdown
## Weekly Test Report - Week 23

### Summary
- Total tests executed: 523
- Passed: 510 (97.5%)
- Failed: 13 (2.5%)
- Flaky: 3 (0.6%)

### New Bugs Found
- Critical: 0
- High: 2 (JIRA-123, JIRA-124)
- Medium: 5
- Low: 8

### Test Coverage
- Unit: 82% (+2% vs last week)
- Integration: 100%
- E2E: 95% (pending US-017)

### Risks
- AI API rate limiting w staging (porozmawiać z OpenRouter)
- Performance degradation przy 50 kartach (avg 55fps, target 60fps)

### Next Week Plan
- Finalizacja E2E dla US-017, US-018
- Performance optimization testing
- Security audit z OWASP ZAP
```

#### Slack Channels
- `#testing` - ogólne dyskusje o testach
- `#test-alerts` - automatyczne notyfikacje z CI/CD (failures)
- `#bugs` - raportowanie i dyskusja o bugach

---

## 10. Procedury raportowania błędów

### 10.1 Proces raportowania

#### Krok 1: Wykrycie błędu
- QA Engineer napotyka błąd podczas testowania
- Sprawdza, czy błąd jest reprodukowalny
- Sprawdza, czy błąd już istnieje w GitHub Issues (duplikat)

#### Krok 2: Tworzenie raportu błędu
Utwórz nowy GitHub Issue z szablonem:

```markdown
## 🐛 Bug Report

### Tytuł
[Krótki opis błędu w jednym zdaniu]

### Severity
- [ ] Critical
- [x] High
- [ ] Medium
- [ ] Low

### Środowisko
- **URL**: https://staging.bucketestimate.app/sessions/abc-123
- **Browser**: Chrome 130.0.6723.92
- **OS**: Windows 11
- **User**: qa-user-1@example.com
- **Date/Time**: 2025-01-30 14:32 CET

### Kroki do reprodukcji
1. Zaloguj się jako qa-user-1@example.com
2. Otwórz sesję z ID: abc-123
3. Przeciągnij kartę "TASK-001" z kubełka "?" do kubełka "5"
4. Odśwież stronę

### Oczekiwany rezultat
Karta "TASK-001" powinna pozostać w kubełku "5" po odświeżeniu.

### Aktualny rezultat
Karta "TASK-001" wraca do kubełka "?" po odświeżeniu.

### Screenshots/Videos
[Załącz screenshot lub video]

### Console Errors
```
Error: Failed to update card
  at updateCard (cards.service.ts:123)
  at handleDragEnd (SessionClient.tsx:89)
```

### Network Logs
```
PATCH /api/sessions/abc-123/cards
Status: 500 Internal Server Error
Response: { code: "INTERNAL_ERROR", message: "Database connection failed" }
```

### Dodatkowe informacje
- Błąd występuje tylko w staging (local działa poprawnie)
- Występuje dla wszystkich użytkowników
- Workaround: brak

### Labels
`bug:high`, `area:cards`, `status:new`
```

#### Krok 3: Triage (QA Lead + Dev Lead)
- **W ciągu 24h** od zgłoszenia
- Weryfikacja severity
- Przypisanie do developera
- Dodanie do aktualnego sprintu (jeśli Critical/High)

#### Krok 4: Fixing (Developer)
- Developer tworzy branch: `fix/ISSUE-123-drag-and-drop`
- Implementuje fix
- Pisze test regression dla błędu (aby się nie powtórzył)
- Tworzy Pull Request z linkiem do Issue

#### Krok 5: Verification (QA)
- QA Engineer testuje fix na staging
- Weryfikuje, że błąd jest naprawiony
- Weryfikuje, że fix nie wprowadził nowych błędów (smoke test)
- Zmienia status na `status:ready-for-test` → `status:closed`

#### Krok 6: Deployment
- Fix wchodzi do produkcji w następnym release
- QA wykonuje smoke test na production

### 10.2 Bug Lifecycle

```
[New] → [Triaged] → [In Progress] → [Ready for Test] → [Closed]
                                   ↓
                            [Reopened] (jeśli nie naprawiony)
```

### 10.3 Eskalacja

**Eskalacja Critical Bugs:**
1. QA Lead natychmiast informuje PM i Dev Lead (Slack + @mention)
2. Zespół spotyka się w ciągu 1h (standup lub ad-hoc meeting)
3. Podejmuje decję: fix natychmiast vs. rollback vs. workaround
4. Daily updates o statusie (Slack `#bugs`)

**Eskalacja High Bugs:**
- Informacja na daily standup
- Fix w ciągu 2-3 dni roboczych
- Blokuje release, jeśli nie naprawiony

### 10.4 Metrics i KPI

#### Bug Metrics (monitorowane weekly)
- **Bug Detection Rate**: liczba bugów znalezionych przez QA vs. przez użytkowników production
  - Target: >90% bugów znalezionych przed production
- **Bug Fix Time**: średni czas od zgłoszenia do zamknięcia
  - Critical: <24h
  - High: <72h
  - Medium: <1 tydzień
  - Low: <2 tygodnie
- **Bug Reopen Rate**: % bugów reopened po fix
  - Target: <5%
- **Escaped Bugs**: liczba bugów znalezionych w production
  - Target: <2 na release

#### Test Metrics (monitorowane weekly)
- **Test Pass Rate**: % testów passed
  - Target: >95%
- **Flaky Test Rate**: % testów flaky (niestabilnych)
  - Target: <2%
- **Test Execution Time**: czas wykonania full test suite
  - Target: <15 minut (dla CI/CD)
- **Code Coverage**: % kodu pokrytego testami
  - Target: >80% (unit tests)

---

## 11. Podsumowanie i wnioski

### 11.1 Kluczowe obszary ryzyka

Po analizie projektu BucketEstimate AI zidentyfikowano następujące obszary wymagające szczególnej uwagi:

#### 1. **Integracja z OpenRouter API (Krytyczne)**
- **Ryzyko**: Zewnętrzne API może być niestabilne, rate limiting, timeout
- **Mitygacja**:
  - Retry mechanism z exponential backoff
  - Fallback dla błędów API
  - Monitoring kosztów i limitów
  - Testy z mock API + testy z rzeczywistym API na staging

#### 2. **Row Level Security (RLS) - Krytyczne dla bezpieczeństwa**
- **Ryzyko**: Błędnie skonfigurowane RLS policies mogą ujawnić dane innych użytkowników
- **Mitygacja**:
  - Dedykowane testy security dla RLS
  - Penetration testing (próby dostępu do cudzych sesji)
  - Code review polityk RLS przez security testera
  - Automated tests w CI/CD

#### 3. **Optimistic UI Updates**
- **Ryzyko**: Niespójność między UI a backendem przy błędach sieci
- **Mitygacja**:
  - Testy scenariuszy offline/online
  - Rollback mechanism przy błędach API
  - Clear error messaging
  - Testy concurrent operations

#### 4. **Wydajność drag-and-drop przy 50 kartach**
- **Ryzyko**: Spadek FPS, sluggish UI przy maksymalnym obciążeniu
- **Mitygacja**:
  - Performance testing z 50 kartami (target 60fps)
  - Profiling i optimization (React.memo, virtualizacja jeśli potrzebne)
  - Batch updates zamiast individual API calls

#### 5. **Import CSV - podatność na błędy**
- **Ryzyko**: Różne encoding (UTF-8, Windows-1252), niepoprawny format, injection
- **Mitygacja**:
  - Robustny CSV parser z walidacją
  - Testy z różnymi encodingami
  - Sanitization input (XSS, CSV injection)
  - Clear error reporting

### 11.2 Priorytety testowe

**Tier 1 (Must Have - Block Release):**
1. Autentykacja i autoryzacja (US-001 do US-005)
2. RLS policies i izolacja danych
3. CRUD operacje na kartach (US-008, US-009, US-010)
4. AI estymacja (US-013)
5. Security (SQL injection, XSS, RLS)

**Tier 2 (Should Have - Fix przed release):**
6. Drag-and-drop performance przy 50 kartach
7. Import CSV (US-008)
8. Podsumowanie i czyszczenie sesji (US-014, US-015)
9. Error handling (US-019)
10. Performance (Core Web Vitals >90)

**Tier 3 (Nice to Have - Można odłożyć):**
11. Edge cases (concurrent operations, offline mode)
12. Accessibility (WCAG AA)
13. Cross-browser compatibility (Safari, Firefox)
14. Mobile responsiveness

### 11.3 Rekomendacje

#### Dla zespołu deweloperskiego:
1. **Testy piszemy równolegle z kodem** - nie odkładamy testów na koniec sprintu
2. **Test-Driven Development (TDD) dla logiki biznesowej** - szczególnie dla serwisów (session, cards, ai-estimate)
3. **Pre-commit hooks** - unit tests + linting przed każdym commitem
4. **Code reviews z QA** - QA Lead uczestniczy w review krytycznych PR-ów

#### Dla zespołu QA:
1. **Shift-left testing** - angażowanie QA od początku sprintu (planning, design)
2. **Test automation first** - automatyzacja testów regresyjnych od pierwszego sprintu
3. **Exploratory testing** - dedykowany czas (20% każdego sprintu) na manual exploratory testing
4. **Documentation** - aktualizacja test cases w miarę zmian w aplikacji

#### Dla Product Ownera:
1. **Jasne kryteria akceptacji** - każda historyjka użytkownika ma testowalne kryteria
2. **UAT sessions** - regularne sesje UAT co 2 tygodnie (koniec sprintu)
3. **Priorytetyzacja bug fixes** - wspólna decyzja z QA Lead i Dev Lead o severity

### 11.4 Definicja sukcesu projektu (z perspektywy testów)

Projekt BucketEstimate AI będzie uznany za sukces, gdy:

✅ **100% historyjek użytkowników (US-001 do US-019) jest zaimplementowanych i przetestowanych**

✅ **Metryki sukcesu z PRD są osiągnięte:**
- Redukcja czasu sesji estymacji o ≥30% (benchmark test)
- ≥60% zadań pozostaje w kubełkach AI bez zmian (user acceptance test)
- 100% poprawności embeddingów (automated test)
- ≥90% udanych sesji bez błędów (production monitoring)

✅ **Jakość techniczna:**
- Code coverage ≥80% (unit tests)
- Test pass rate ≥95% (wszystkie typy testów)
- Lighthouse score ≥90 (performance, accessibility, best practices, SEO)
- 0 krytycznych luk bezpieczeństwa (OWASP Top 10)

✅ **Przyjęcie przez użytkowników:**
- Pozytywne wyniki UAT sessions
- <5 critical/high bugs w pierwszym miesiącu produkcji
- Czas odpowiedzi API w ramach SLA (p95)

---

## Załączniki

### A. Glossary

| Termin | Definicja |
|--------|-----------|
| **Bucket System** | Metoda estymacji zadań polegająca na przypisywaniu zadań do "kubełków" reprezentujących poziomy złożoności (Fibonacci) |
| **RLS (Row Level Security)** | Mechanizm bezpieczeństwa PostgreSQL/Supabase izolujący dane na poziomie wierszy tabeli |
| **Embedding** | Numeryczna reprezentacja tekstu (vector 1536) generowana przez model AI dla semantic search |
| **Optimistic UI** | Wzorzec UI aktualizujący interfejs przed otrzymaniem potwierdzenia z serwera |
| **Drag-and-drop** | Metoda interakcji polegająca na przeciąganiu elementów UI (kart) między kontenerami (kubełkami) |
| **External ID** | Unikalny identyfikator zadania w ramach sesji (np. JIRA-123) |
| **Bucket Value** | Wartość estymacji zadania (0, 1, 2, 3, 5, 8, 13, 21 lub null) |

### B. Referencje

- **PRD**: [.ai/prd.md](.ai/prd.md)
- **Tech Stack**: [.ai/tech-stack.md](.ai/tech-stack.md)
- **CLAUDE.md**: [CLAUDE.md](CLAUDE.md) - coding guidelines
- **Supabase Docs**: https://supabase.com/docs
- **Astro Docs**: https://docs.astro.build
- **Playwright Docs**: https://playwright.dev
- **Vitest Docs**: https://vitest.dev
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

### C. Szablony

#### C.1 Test Case Template
```markdown
### TC-[MODULE]-[NUMBER]: [Tytuł]
- **Priorytet**: Critical / High / Medium / Low
- **Typ**: Unit / Integration / E2E / Performance / Security
- **User Story**: US-XXX
- **Warunki wstępne**: [Opis stanu przed testem]
- **Kroki**:
  1. [Krok 1]
  2. [Krok 2]
  3. [Krok 3]
- **Oczekiwany rezultat**: [Co powinno się stać]
- **Dane testowe**: [Jeśli potrzebne]
- **Cleanup**: [Jeśli potrzebne]
```

#### C.2 Bug Report Template
```markdown
## 🐛 Bug Report

### Tytuł
[Krótki opis]

### Severity
- [ ] Critical - [ ] High - [ ] Medium - [ ] Low

### Środowisko
- URL:
- Browser:
- OS:

### Kroki do reprodukcji
1.
2.
3.

### Oczekiwany rezultat
[...]

### Aktualny rezultat
[...]

### Screenshots/Videos
[...]

### Additional Info
[...]
```

### D. Test Data Examples

#### D.1 Sample CSV for Import
```csv
id,title,description
TASK-001,Implement login page,Create a login form with email and password fields
TASK-002,Add logout button,Add logout button to the topbar
TASK-003,Fix drag and drop bug,Cards are not staying in buckets after refresh
TASK-004,Optimize database queries,Improve performance of session listing
TASK-005,Write unit tests,Add unit tests for cards.service.ts
```

#### D.2 Sample Session Context
```
Project Context: E-commerce website built with React and Node.js.
Tech Stack: React 18, TypeScript, Express, PostgreSQL, Redis for caching.
Team Size: 5 developers (2 senior, 3 mid-level).
Sprint Length: 2 weeks.
Definition of Done: Code review + unit tests + E2E tests + deployed to staging.
```

---

**Wersja dokumentu**: 1.0
**Data utworzenia**: 2026-01-30
**Autor**: QA Team - BucketEstimate AI
**Status**: Draft - do zatwierdzenia przez Product Ownera i QA Lead

**Historia zmian**:
| Data | Wersja | Autor | Zmiany |
|------|--------|-------|--------|
| 2026-01-30 | 1.0 | QA Team | Inicjalna wersja planu testów |
