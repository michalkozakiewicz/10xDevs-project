# BucketEstimate AI

Webowa aplikacja wspierająca zespoły Scrumowe w szybkiej estymacji dużej liczby zadań przy użyciu metody Bucket System oraz sztucznej inteligencji.

## O aplikacji

BucketEstimate AI to narzędzie stworzone z myślą o zespołach deweloperskich, które regularnie muszą estymować kilkadziesiąt zadań w ramach backlog refinementu. Aplikacja umożliwia:

- **Import do 50 kart zadań** z pliku CSV lub dodawanie ich ręcznie
- **Wizualną organizację zadań** w kubełkach opartych o sekwencję Fibonacciego (1, 2, 3, 5, 8, 13, 21, ?)
- **Automatyczną estymację przez AI** - wykorzystanie modeli GPT do wstępnego przypisania zadań do odpowiednich poziomów złożoności
- **Intuicyjny interfejs drag-and-drop** do łatwego przesuwania zadań między kubełkami
- **Zapis historii estymacji** - budowanie bazy wiedzy poprzez embeddingi i wyniki historyczne

### Główne cele

- Drastyczne skrócenie czasu planowania i refinementu backlogu
- Odciążenie facylitatora poprzez automatyzację pierwszego kroku estymacji
- Zapewnienie intuicyjnego, wizualnego interfejsu
- Budowa bazy wiedzy estymacyjnej

## Tech Stack

### Frontend i Backend
- [Astro](https://astro.build/) v5 - Framework do budowy szybkich aplikacji webowych
- [React](https://react.dev/) v19 - Biblioteka UI do interaktywnych komponentów
- [TypeScript](https://www.typescriptlang.org/) v5 - Typowany JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Framework CSS utility-first
- [Shadcn/ui](https://ui.shadcn.com/) - Komponenty UI (wariant new-york, kolor neutral)
- [Supabase](https://supabase.com/) - Backend, uwierzytelnianie i baza danych (PostgreSQL)

### Testowanie
- [Vitest](https://vitest.dev/) v2 - Framework do testów jednostkowych i integracyjnych
- [Playwright](https://playwright.dev/) v1.48 - Framework do testów end-to-end (E2E)
- [Testing Library](https://testing-library.com/) v16 - Narzędzia do testowania komponentów React

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Rozpoczęcie pracy

1. Sklonuj repozytorium:

```bash
git clone https://github.com/michalkozakiewicz/10xDevs-project.git
cd 10xDevs-project
```

2. Zainstaluj zależności:

```bash
npm install
```

3. Skonfiguruj zmienne środowiskowe:

Skopiuj plik `.env.example` do `.env` i uzupełnij wymagane wartości:

```bash
cp .env.example .env
```

Wymagane zmienne:

- `SUPABASE_URL` - URL Twojego projektu Supabase
- `SUPABASE_KEY` - Klucz publiczny API Supabase
- `OPENROUTER_API_KEY` - Klucz API OpenRouter (do AI estymacji)

4. Uruchom migracje bazy danych:

```bash
npx supabase db push
```

5. Uruchom serwer deweloperski:

```bash
npm run dev
```

6. Zbuduj wersję produkcyjną:

```bash
npm run build
```

## Dostępne skrypty

### Rozwój
- `npm run dev` - Uruchom serwer deweloperski
- `npm run build` - Zbuduj wersję produkcyjną
- `npm run preview` - Podgląd buildu produkcyjnego

### Jakość kodu
- `npm run lint` - Uruchom ESLint
- `npm run lint:fix` - Napraw problemy ESLint
- `npm run format` - Sformatuj kod (Prettier)
- `npm run format:check` - Sprawdź formatowanie bez zmian

### Testowanie
- `npm run test` - Uruchom wszystkie testy
- `npm run test:unit` - Uruchom testy jednostkowe (Vitest)
- `npm run test:watch` - Testy w trybie watch
- `npm run test:ui` - Testy z interfejsem graficznym (Vitest UI)
- `npm run test:coverage` - Testy z pokryciem kodu
- `npm run test:integration` - Uruchom testy integracyjne
- `npm run test:e2e` - Uruchom testy E2E (Playwright)
- `npm run test:e2e:ui` - Testy E2E z interfejsem Playwright
- `npm run test:e2e:debug` - Testy E2E w trybie debugowania

### CI/CD
- Automatyczne workflow dla pull requestów (`.github/workflows/pull-request.yml`)
  - Uruchamia testy jednostkowe z pokryciem kodu
  - Buduje projekt i weryfikuje poprawność buildu
  - Dodaje komentarz ze statusem do pull requesta
  - Workflow testowy - weryfikacja działania CI/CD

## Struktura projektu

```
.
├── src/
│   ├── layouts/              # Layouty Astro
│   ├── pages/                # Strony Astro
│   │   ├── api/              # Endpointy API
│   │   │   └── sessions/     # API sesji i kart
│   │   └── sessions/         # Strony sesji estymacji
│   ├── components/           # Komponenty UI (Astro & React)
│   │   ├── ui/               # Komponenty Shadcn/ui
│   │   ├── sessions/         # Komponenty widoku sesji
│   │   └── hooks/            # Custom React hooks
│   ├── db/                   # Klienty Supabase i typy
│   ├── lib/
│   │   ├── services/         # Logika biznesowa
│   │   ├── schemas/          # Schematy walidacji Zod
│   │   └── types/            # Typy TypeScript
│   ├── middleware/           # Middleware Astro
│   └── styles/               # Style globalne
├── supabase/
│   └── migrations/           # Migracje bazy danych
└── public/                   # Zasoby publiczne
```

## Kluczowe funkcjonalności

### Import i zarządzanie zadaniami

- Import zadań z pliku CSV (format: id, title, description)
- Ręczne dodawanie pojedynczych zadań przez formularz
- Maksymalnie 50 kart w jednej sesji
- Automatyczne generowanie embeddingów dla każdego zadania

### Estymacja wizualna

- 8 kubełków o wartościach Fibonacciego: 1, 2, 3, 5, 8, 13, 21, ?
- Interfejs drag-and-drop do przesuwania kart
- Podgląd szczegółów zadania w modalu
- Zapis stanu w czasie rzeczywistym

### Moduł AI

- Automatyczne przypisanie wszystkich kart do kubełków przez AI
- Wykorzystanie modeli GPT (przez OpenRouter)
- Embeddingi tekstowe (text-embedding-3-small)
- Modal ostrzegający przed nadpisaniem aktualnego układu

### Podsumowanie i eksport

- Widok tabelaryczny z wynikami estymacji (ID, Tytuł, Wycena)
- Dane tylko do odczytu
- Możliwość wyczyszczenia sesji (z zachowaniem danych analitycznych)

### Bezpieczeństwo

- Uwierzytelnianie użytkowników (Supabase Auth)
- Row Level Security (RLS) na wszystkich tabelach
- Sesje powiązane z konkretnym facylitatorem

## Dokumentacja

Szczegółowa dokumentacja znajduje się w katalogu `.ai/`:

- `prd.md` - Pełny dokument wymagań produktu
- `tech-stack.md` - Szczegóły techniczne
- `db-plan.md` - Schemat bazy danych
- `api-plan.md` - Specyfikacja API
- `test-plan.md` - Kompleksowy plan testów (unit, integration, E2E, performance, security)

## Licencja

MIT
