# Diagram architektury autentykacji - BucketEstimate AI

## Przegląd

Diagram przedstawia kompletny przepływ autentykacji w aplikacji BucketEstimate AI, wykorzystującej Astro 5, React 19 oraz Supabase Auth. Pokazuje interakcje między przeglądarką, middleware, API oraz Supabase Auth podczas rejestracji, logowania, dostępu do chronionych zasobów i wylogowania.

## Diagram Mermaid

```mermaid
sequenceDiagram
    autonumber

    participant Browser as Przeglądarka
    participant Middleware as Middleware Astro
    participant API as API Astro
    participant Supabase as Supabase Auth
    participant DB as Postgres + RLS

    Note over Browser,DB: Przepływ rejestracji

    Browser->>Browser: Wypełnienie formularza rejestracji
    Browser->>Browser: Walidacja Zod po stronie klienta
    Browser->>API: POST /api/auth/register
    activate API
    API->>API: Walidacja Zod po stronie serwera
    API->>Supabase: Utworzenie użytkownika email/password
    activate Supabase

    alt Rejestracja pomyślna
        Supabase-->>API: Użytkownik utworzony
        deactivate Supabase
        API-->>Browser: Sukces z przekierowaniem
        deactivate API
        Browser->>Browser: Redirect do /auth/login
    else Email już istnieje
        Supabase-->>API: Błąd - email zajęty
        deactivate Supabase
        API-->>Browser: Komunikat błędu
        deactivate API
    end

    Note over Browser,DB: Przepływ logowania

    Browser->>Browser: Wypełnienie formularza logowania
    Browser->>API: POST /api/auth/login
    activate API
    API->>API: Walidacja danych wejściowych
    API->>Supabase: signInWithPassword
    activate Supabase

    alt Credentials poprawne
        Supabase-->>API: JWT token + refresh token
        deactivate Supabase
        API->>API: Ustawienie httpOnly cookies
        API-->>Browser: Sukces z przekierowaniem
        deactivate API
        Browser->>Browser: Redirect do /sessions
    else Credentials niepoprawne
        Supabase-->>API: Błąd autentykacji
        deactivate Supabase
        API-->>Browser: Generyczny komunikat błędu
        deactivate API
        Note over Browser: Bez ujawniania czy email istnieje
    end

    Note over Browser,DB: Dostęp do chronionej strony

    Browser->>Middleware: GET /sessions
    activate Middleware
    Middleware->>Middleware: Sprawdzenie JWT w cookies

    alt Token ważny
        Middleware->>Supabase: Weryfikacja tokenu
        activate Supabase
        Supabase-->>Middleware: Token poprawny + user data
        deactivate Supabase
        Middleware->>Middleware: Wstrzyknięcie supabase do locals
        Middleware->>Browser: Renderowanie strony /sessions
        deactivate Middleware
        Browser->>API: GET /api/sessions
        activate API
        API->>DB: SELECT * FROM sessions WHERE user_id
        activate DB
        Note over DB: RLS wymusza auth.uid()
        DB-->>API: Dane sesji użytkownika
        deactivate DB
        API-->>Browser: JSON z danymi
        deactivate API
    else Token wygasł lub brak tokenu
        Middleware->>Middleware: Sesja nieważna
        Middleware-->>Browser: Redirect 302 do /auth/login
        deactivate Middleware
        Browser->>Browser: Wyświetlenie strony logowania
    end

    Note over Browser,DB: Przepływ wylogowania

    Browser->>API: POST /api/auth/logout
    activate API
    API->>Supabase: signOut
    activate Supabase
    Supabase-->>API: Sesja zakończona
    deactivate Supabase
    API->>API: Czyszczenie ciasteczek JWT
    API-->>Browser: Sukces + redirect
    deactivate API
    Browser->>Browser: Redirect do /auth/login

    Note over Browser,DB: Obsługa wygaśniętej sesji

    Browser->>Middleware: GET /sessions po wygaśnięciu
    activate Middleware
    Middleware->>Supabase: Weryfikacja tokenu
    activate Supabase
    Supabase-->>Middleware: Token wygasły
    deactivate Supabase
    Middleware-->>Browser: Redirect do /auth/login
    deactivate Middleware
    Browser->>Browser: Komunikat o wygaśnięciu sesji
```

## Opis przepływów

### 1. Rejestracja (US-001)

- Użytkownik wypełnia formularz rejestracji z polami: email, password, passwordConfirm
- Walidacja następuje dwukrotnie: po stronie klienta (React Hook Form + Zod) oraz po stronie serwera (Zod)
- API komunikuje się z Supabase Auth, który tworzy nowego użytkownika
- Po pomyślnej rejestracji użytkownik zostaje przekierowany do strony logowania z komunikatem sukcesu
- W przypadku błędu (np. email już istnieje) wyświetlany jest odpowiedni komunikat

### 2. Logowanie (US-002)

- Użytkownik podaje email i hasło
- API używa metody `signInWithPassword` z Supabase Auth
- Po weryfikacji Supabase zwraca JWT token oraz refresh token
- Tokeny są zapisywane w httpOnly cookies (Secure, SameSite=Lax) dla bezpieczeństwa
- Użytkownik zostaje przekierowany do `/sessions`
- W przypadku błędu wyświetlany jest generyczny komunikat bez ujawniania, czy konto istnieje

### 3. Dostęp do chronionej strony

- Middleware Astro przechwytuje każde żądanie do chronionych ścieżek
- Sprawdza obecność i ważność JWT w ciasteczkach
- Jeśli token jest ważny: weryfikuje go w Supabase i wstrzykuje klienta Supabase do `context.locals`
- Następnie renderuje żądaną stronę
- Jeśli token jest nieważny lub brak tokenu: przekierowuje użytkownika do `/auth/login`
- Row Level Security (RLS) w Postgres zapewnia izolację danych między użytkownikami

### 4. Wylogowanie (US-003)

- Użytkownik klika przycisk "Wyloguj" w nawigacji
- API wywołuje metodę `signOut` z Supabase Auth
- Ciasteczka z tokenami JWT są czyszczone
- Użytkownik zostaje przekierowany do strony logowania

### 5. Obsługa wygaśniętej sesji (US-005)

- Gdy użytkownik próbuje uzyskać dostęp do chronionej strony z wygasłym tokenem
- Middleware wykrywa nieważną sesję podczas weryfikacji w Supabase
- Użytkownik jest przekierowywany do `/auth/login`
- Wyświetlany jest komunikat o wygaśnięciu sesji

## Bezpieczeństwo

- **JWT w httpOnly cookies**: Tokeny są niedostępne dla JavaScript, co chroni przed atakami XSS
- **Secure flag**: Tokeny są przesyłane tylko przez HTTPS
- **SameSite=Lax**: Ochrona przed atakami CSRF
- **Row Level Security (RLS)**: Każdy użytkownik ma dostęp tylko do swoich danych
- **Generyczne komunikaty błędów**: Logowanie nie ujawnia, czy email istnieje w systemie
- **Walidacja dwustronna**: Dane są walidowane zarówno po stronie klienta, jak i serwera
