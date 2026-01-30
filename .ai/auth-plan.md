# Specyfikacja techniczna modułu autentykacji (Auth) – BucketEstimate AI

Dokument opisuje architekturę modułu rejestracji, logowania, wylogowywania i odzyskiwania hasła z wykorzystaniem Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui oraz Supabase Auth. Specyfikacja jest zgodna z PRD (`US-001`) oraz z regułami projektowymi.

> **Uwaga:** Autentykacja wykorzystuje natywny mechanizm Supabase Auth (email/password) bez dodatkowej warstwy mapowania użytkowników.

---

## 1. Architektura interfejsu użytkownika

### 1.1. Przegląd widoków i layoutów

#### 1.1.1. Layouty Astro

- `src/layouts/Layout.astro`: Layout bazowy (HTML, Head, Meta) - używany w całej aplikacji.
- `src/layouts/AuthLayout.astro` (opcjonalnie): Dedykowany dla stron auth. Skupiony układ: panel formularza + sekcja informacyjna. Obsługuje dark mode (Tailwind 4).
- Layout dla widoków po zalogowaniu zawiera `TopBar` z nawigacją i przyciskiem „Wyloguj". Odczytuje sesję z `Astro.locals.supabase`.

### 1.2. Strony Astro i routing

- `/auth/register`: Implementacja `US-001`. Osadza Reactowy `RegisterForm`.
- `/auth/login`: Formularz logowania przez email i hasło.
- `/auth/reset-password`: Formularz prośby o reset hasła (opcjonalnie).
- `/sessions`: Chroniona strona główna aplikacji - lista sesji estymacji (wymaga auth).

### 1.3. Komponenty React (Client-side)

Wykorzystują Shadcn/ui, React Hook Form oraz Zod do walidacji.

- `RegisterForm.tsx`: Pola `email`, `password`, `passwordConfirm`.
- `LoginForm.tsx`: Pola `email`, `password`.
- `UserNav.tsx`: Wyświetla email zalogowanego facylitatora i akcję wylogowania.

### 1.4. Rozdział odpowiedzialności

- **Astro**: Routing, ochrona stron na poziomie serwera (SSR Redirects), wstrzykiwanie sesji do `locals`.
- **React**: Interakcja, walidacja pól "w locie", obsługa stanów `loading` i komunikatów o błędach API.

---

## 2. Logika backendowa

### 2.1. Middleware (`src/middleware/index.ts`)

Główny strażnik dostępu:

- Sprawdza ważność tokenów JWT w ciasteczkach.
- Wymusza przekierowanie do `/auth/login`, jeśli użytkownik próbuje wejść na chronioną ścieżkę bez sesji.
- Wstrzykuje klienta Supabase do `context.locals.supabase`.

### 2.2. Endpointy API (`src/pages/api/auth/*.ts`)

- `POST /api/auth/register`: Tworzy użytkownika w Supabase Auth (email/password).
- `POST /api/auth/login`: Implementuje logikę logowania przez email (natywny Supabase Auth).
- `POST /api/auth/logout`: Czyści sesję i ciasteczka.

### 2.3. Walidacja (Zod)

Wszystkie dane wejściowe są walidowane schematami (np. `registerSchema`), co zapobiega przesyłaniu niekompletnych danych do Supabase.

---

## 3. System autentykacji i bezpieczeństwo

### 3.1. Integracja z Supabase

- **Metoda**: Natywne Email/Password (Supabase Auth).
- **Sesje**: JWT przechowywane w ciasteczkach `httpOnly` (Secure, SameSite=Lax).
- **RLS**: Izolacja danych na poziomie bazy. Każda sesja estymacji jest przypisana do `auth.uid()`.

---

## 4. Uwagi techniczne i implementacyjne

Podczas wdrażania należy uwzględnić następujące aspekty:

1. **Natywne logowanie przez email**: Wykorzystujemy bezpośrednio mechanizm Supabase Auth `signInWithPassword` z adresem email jako identyfikatorem użytkownika.
2. **Komunikaty błędów**: Zgodnie z dobrą praktyką bezpieczeństwa, błąd logowania powinien być generyczny ("Niepoprawny email lub hasło"), aby nie potwierdzać istnienia konkretnych adresów email w bazie.
3. **Przekierowania (Redirects)**: Po udanej rejestracji użytkownik powinien zostać przekierowany do logowania z jasnym komunikatem sukcesu w parametrze URL, aby uniknąć dezorientacji.
4. **Astro Actions**: Rozważ wykorzystanie `Astro Actions` zamiast tradycyjnych endpointów API w celu uzyskania pełnego bezpieczeństwa typów (Type-safety) między komponentem React a kodem serwerowym.
5. **Walidacja email**: Wykorzystaj Zod do walidacji formatu adresu email po stronie klienta i serwera.

---

### 5. Scenariusze testowe (Kryteria akceptacji)

- [ ] Próba wejścia na `/sessions` bez zalogowania skutkuje redirectem do `/auth/login`.
- [ ] Rejestracja z dwoma różnymi hasłami pokazuje błąd walidacji "Hasła nie są zgodne".
- [ ] Rejestracja z niepoprawnym formatem email pokazuje błąd walidacji.
- [ ] Po wylogowaniu i kliknięciu "wstecz" w przeglądarce, użytkownik nie ma dostępu do danych sesji.
- [ ] Logowanie z niepoprawnym emailem lub hasłem wyświetla generyczny komunikat błędu.
- [ ] Po poprawnym zalogowaniu użytkownik zostaje przekierowany do `/sessions`.
