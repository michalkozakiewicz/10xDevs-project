# Dokumentacja Testów - 10xDevs Project

## Spis treści

1. [Struktura Testów](#struktura-testów)
2. [Uruchamianie Testów](#uruchamianie-testów)
3. [Pisanie Testów Jednostkowych](#pisanie-testów-jednostkowych)
4. [Pisanie Testów E2E](#pisanie-testów-e2e)
5. [Code Coverage](#code-coverage)
6. [Best Practices](#best-practices)

---

## Struktura Testów

```
src/tests/
├── setup.ts              # Konfiguracja środowiska testowego Vitest
├── unit/                 # Testy jednostkowe
│   ├── Button.test.tsx   # Przykład testu komponentu React
│   ├── test-helpers.test.ts # Przykład testu funkcji utility
│   └── session.service.test.ts # Przykład testu serwisu z mockami
├── integration/          # Testy integracyjne (API, baza danych)
│   └── (do implementacji)
└── utils/               # Helpery testowe
    └── test-helpers.ts  # Funkcje pomocnicze dla testów

e2e/                     # Testy End-to-End (Playwright)
└── homepage.spec.ts     # Przykład testu E2E
```

---

## Uruchamianie Testów

### Testy Jednostkowe (Vitest)

```bash
# Uruchom wszystkie testy jednostkowe
npm run test

# Uruchom tylko testy jednostkowe
npm run test:unit

# Uruchom tylko testy integracyjne
npm run test:integration

# Tryb watch (automatyczne uruchamianie przy zmianach)
npm run test:watch

# UI Vitest (interaktywny interfejs)
npm run test:ui

# Generowanie raportu pokrycia kodu
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy E2E w trybie UI
npm run test:e2e:ui

# Uruchom testy E2E w trybie debug
npm run test:e2e:debug
```

---

## Pisanie Testów Jednostkowych

### Testowanie Funkcji Utility

```typescript
import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/utils";

describe("formatPrice", () => {
  it("poprawnie formatuje cenę w PLN", () => {
    expect(formatPrice(100)).toBe("100,00 zł");
  });

  it("obsługuje liczby ujemne", () => {
    expect(formatPrice(-50)).toBe("-50,00 zł");
  });
});
```

### Testowanie Komponentów React

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  it("renderuje button z tekstem", () => {
    render(<Button>Kliknij</Button>);
    expect(screen.getByRole("button", { name: /kliknij/i })).toBeInTheDocument();
  });

  it("wywołuje onClick handler", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Kliknij</Button>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testowanie Serwisów z Mockami

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSession } from "@/lib/services/session.service";

describe("SessionService", () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("powinno utworzyć nową sesję", async () => {
    const mockData = {
      id: "session-123",
      user_id: "user-123",
      is_active: true,
      context: "Test",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mockowanie Supabase chain
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    });

    const result = await createSession(mockSupabase as any, "user-123", { context: "Test" });

    expect(result.id).toBe(mockData.id);
  });
});
```

---

## Pisanie Testów E2E

### Przykład Testu Strony

```typescript
import { test, expect } from "@playwright/test";

test.describe("Strona główna", () => {
  test("powinno załadować stronę główną", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/10xDevs/i);
  });

  test("powinno wyświetlić nawigację", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });
});
```

### Testowanie Interakcji Użytkownika

```typescript
test("powinno umożliwić logowanie", async ({ page }) => {
  await page.goto("/login");

  // Wypełnij formularz
  await page.fill('input[name="email"]', "test@example.com");
  await page.click('button[type="submit"]');

  // Sprawdź przekierowanie
  await expect(page).toHaveURL(/.*dashboard/);
});
```

---

## Code Coverage

Raport pokrycia kodu generowany jest przez Vitest i zapisywany w folderze `coverage/`.

```bash
# Generuj raport pokrycia
npm run test:coverage

# Raport będzie dostępny w:
# - coverage/index.html (HTML)
# - coverage/lcov.info (LCOV)
# - coverage/coverage-final.json (JSON)
```

### Minimalne Wymagania Pokrycia

- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

---

## Best Practices

### 1. Nazewnictwo Testów

✅ **Dobre:**

```typescript
it("powinno zwrócić błąd gdy email jest niepoprawny", () => {});
```

❌ **Złe:**

```typescript
it("test1", () => {});
```

### 2. Testuj Zachowanie, Nie Implementację

✅ **Dobre:**

```typescript
it("powinno wyświetlić komunikat o błędzie gdy formularz jest niepoprawny", () => {
  // Test sprawdza rezultat dla użytkownika
});
```

❌ **Złe:**

```typescript
it("powinno ustawić state.error na true", () => {
  // Test sprawdza szczegóły implementacji
});
```

### 3. Arrange-Act-Assert (AAA)

```typescript
it("powinno dodać użytkownika do listy", () => {
  // Arrange - przygotowanie
  const user = { name: "Jan", age: 30 };

  // Act - akcja
  const result = addUser(user);

  // Assert - sprawdzenie
  expect(result).toContain(user);
});
```

### 4. Izolacja Testów

Każdy test powinien być niezależny i nie wpływać na inne testy.

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Wyczyść mocki przed każdym testem
});
```

### 5. Mockowanie Zależności

Mockuj zewnętrzne zależności (API, baza danych, Supabase client).

```typescript
vi.mock("@/lib/supabase", () => ({
  supabaseClient: mockSupabase,
}));
```

### 6. Testuj Edge Cases

Zawsze testuj:

- Przypadki brzegowe (puste wartości, null, undefined)
- Błędy i wyjątki
- Walidację danych
- Ograniczenia (limity, max długość, itp.)

---

## Dodatkowe Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Troubleshooting

### Problem: Testy nie znajdują modułów z aliasem @

**Rozwiązanie:** Sprawdź czy `vitest.config.ts` ma poprawnie skonfigurowane aliasy:

```typescript
resolve: {
  alias: {
    "@": resolve(__dirname, "./src"),
  },
},
```

### Problem: Playwright nie może uruchomić przeglądarek

**Rozwiązanie:** Zainstaluj przeglądarki:

```bash
npx playwright install
```

### Problem: Testy są wolne

**Rozwiązanie:**

- Użyj `test.concurrent` dla testów niezależnych
- Zmniejsz liczbę workers w `vitest.config.ts`
- Użyj `happy-dom` zamiast `jsdom` (szybsze)
