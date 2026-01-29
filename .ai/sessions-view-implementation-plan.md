# Plan implementacji widoku Dashboard - Lista sesji

## 1. Przegląd

Widok Dashboard - Lista sesji (`/sessions`) stanowi główny punkt wejścia dla zalogowanych użytkowników do aplikacji BucketEstimate AI. Jego celem jest prezentacja wszystkich sesji estymacji należących do użytkownika oraz umożliwienie tworzenia nowych sesji. Widok zapewnia szybki przegląd sesji z informacją o liczbie kart w każdej z nich, umożliwiając facylitatorowi efektywne zarządzanie procesem estymacji.

## 2. Routing widoku

**Ścieżka:** `/sessions`

**Plik:** `src/pages/sessions.astro`

**Wymagania dostępu:**

- Widok wymaga uwierzytelnienia użytkownika
- Niezalogowani użytkownicy są automatycznie przekierowywani do `/login`
- Weryfikacja autentykacji odbywa się na poziomie strony Astro przed renderowaniem

## 3. Struktura komponentów

```
sessions.astro (Astro Page)
└── Layout.astro
    ├── TopBar (React, client:load)
    │   ├── Logo / Nazwa aplikacji (lewa strona)
    │   └── UserAvatar (prawa strona)
    │
    └── SessionsDashboard (React, client:load)
        ├── PageHeader
        │   └── <h1> "Twoje sesje"
        │
        ├── [Loading State] SessionCardSkeleton[] (3-4 sztuki)
        │
        └── [Data State] SessionGrid
            ├── NewSessionCard (pierwsza pozycja - karta z przyciskiem "+")
            └── SessionCard[] (dla każdej sesji)
                └── CardsBadge
```

**Uwaga:** `EmptySessionsState` zostaje usunięty - zamiast niego zawsze wyświetlamy `SessionGrid` z `NewSessionCard` jako pierwszą kartą. Gdy użytkownik nie ma sesji, widzi tylko kartę tworzenia nowej sesji.

## 4. Szczegóły komponentów

### 4.1 TopBar

**Opis:** Górny pasek nawigacji aplikacji oparty na komponencie NavigationMenu z shadcn/ui. Zawiera nazwę aplikacji z miejscem na logo po lewej stronie oraz awatar zalogowanego użytkownika po prawej stronie.

**Główne elementy:**

- Kontener `<header>` z flexbox layout (justify-between)
- Lewa strona: Logo (opcjonalne) + nazwa aplikacji "BucketEstimate AI"
- Prawa strona: Komponent `Avatar` z shadcn/ui z inicjałami lub zdjęciem użytkownika
- Opcjonalnie: `DropdownMenu` z shadcn/ui po kliknięciu awatara (wylogowanie)

**Obsługiwane interakcje:**

- Kliknięcie logo/nazwy → nawigacja do `/sessions` (strona główna)
- Kliknięcie awatara → otwarcie dropdown menu z opcją wylogowania

**Obsługiwana walidacja:**

- Brak

**Typy:**

```typescript
interface UserInfo {
  email: string;
  avatarUrl?: string;
}
```

**Propsy:**

```typescript
interface TopBarProps {
  user: UserInfo;
  onLogout?: () => void;
}
```

---

### 4.2 SessionsDashboard

**Opis:** Główny komponent React zarządzający całym widokiem listy sesji. Odpowiada za pobieranie danych, zarządzanie stanem i koordynację między komponentami potomnymi.

**Główne elementy:**

- `<div>` kontener główny z klasami Tailwind dla layoutu
- `PageHeader` z tytułem
- `SessionGrid` zawierający `NewSessionCard` + listę `SessionCard`
- Alternatywnie: `SessionCardSkeleton[]` podczas ładowania

**Obsługiwane interakcje:**

- Inicjalne pobranie listy sesji przy montowaniu
- Obsługa tworzenia nowej sesji
- Nawigacja do wybranej sesji

**Obsługiwana walidacja:**

- Sprawdzenie odpowiedzi 401 i przekierowanie do `/login`
- Walidacja poprawności struktury odpowiedzi API

**Typy:**

- `SessionsViewState` (wewnętrzny stan)
- `SessionsListResponseDTO` (odpowiedź API)
- `SessionCreateCommand` (żądanie tworzenia)

**Propsy:**

- Brak (komponent główny)

---

### 4.3 PageHeader

**Opis:** Nagłówek sekcji zawierający tytuł widoku. Uproszczony komponent bez przycisku tworzenia (przeniesiony do `NewSessionCard`).

**Główne elementy:**

- `<header>` z odpowiednim paddingiem
- `<h1>` z tekstem "Twoje sesje"

**Obsługiwane interakcje:**

- Brak

**Obsługiwana walidacja:**

- Brak

**Typy:**

- Brak specyficznych

**Propsy:**

```typescript
interface PageHeaderProps {
  title: string;
}
```

---

### 4.4 SessionGrid

**Opis:** Kontener siatki CSS Grid wyświetlający karty sesji. Zapewnia responsywny układ dostosowujący liczbę kolumn do szerokości ekranu. Pierwszym elementem jest zawsze `NewSessionCard`.

**Główne elementy:**

- `<div>` z CSS Grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`)
- `NewSessionCard` jako pierwszy element
- Lista komponentów `SessionCard`

**Obsługiwane interakcje:**

- Keyboard navigation (Tab między kartami)

**Obsługiwana walidacja:**

- Brak

**Typy:**

- `SessionListItemDTO[]`

**Propsy:**

```typescript
interface SessionGridProps {
  sessions: SessionListItemDTO[];
  onSessionClick: (sessionId: string) => void;
  onCreateSession: () => void;
  isCreating: boolean;
}
```

---

### 4.5 NewSessionCard

**Opis:** Specjalna karta służąca do tworzenia nowej sesji. Wyświetlana jako pierwsza karta w siatce. Zawiera duży przycisk z ikoną "+" i tekstem "Utwórz sesję". Wizualnie wyróżniona (np. obramowanie przerywane, tło z akcentem).

**Główne elementy:**

- Komponent `Card` z shadcn/ui z wyróżniającym stylem (dashed border, hover effect)
- Duża ikona `Plus` z lucide-react (wycentrowana)
- Tekst "Utwórz sesję" pod ikoną
- `Spinner` podczas stanu ładowania (zastępuje ikonę "+")

**Obsługiwane interakcje:**

- `onClick` → wywołanie funkcji tworzenia sesji
- `onKeyDown` (Enter/Space) → wywołanie funkcji tworzenia sesji
- `hover` → wizualne podświetlenie karty
- Blokada podczas `isCreating`

**Obsługiwana walidacja:**

- Brak (tworzenie sesji nie wymaga pól formularza)

**Typy:**

- Brak specyficznych

**Propsy:**

```typescript
interface NewSessionCardProps {
  onClick: () => void;
  isLoading: boolean;
}
```

**Atrybuty dostępności:**

- `role="button"`
- `tabIndex={0}`
- `aria-label="Utwórz nową sesję"`
- `aria-busy={isLoading}`

---

### 4.6 SessionCard

**Opis:** Interaktywna karta reprezentująca pojedynczą sesję. Wyświetla ID sesji oraz badge z liczbą kart. Cała powierzchnia karty jest klikalna.

**Główne elementy:**

- Komponent `Card` z shadcn/ui
- `<div role="button">` dla dostępności
- `CardHeader` z ID sesji (skrócone UUID lub pełne)
- `CardContent` z opcjonalnym kontekstem
- `CardsBadge` w prawym dolnym rogu

**Obsługiwane interakcje:**

- `onClick` → nawigacja do `/sessions/:id`
- `onKeyDown` (Enter/Space) → nawigacja do `/sessions/:id`
- `hover` → wizualne podświetlenie karty

**Obsługiwana walidacja:**

- Brak

**Typy:**

- `SessionListItemDTO`

**Propsy:**

```typescript
interface SessionCardProps {
  session: SessionListItemDTO;
  onClick: (sessionId: string) => void;
}
```

**Atrybuty dostępności:**

- `role="button"`
- `tabIndex={0}`
- `aria-label="Otwórz sesję {id}"`

---

### 4.7 CardsBadge

**Opis:** Badge wyświetlający liczbę kart w sesji z tooltipem wyjaśniającym znaczenie.

**Główne elementy:**

- Komponent `Badge` z shadcn/ui
- Komponent `Tooltip` z shadcn/ui
- Ikona kart (opcjonalnie `Layers` z lucide-react)
- Liczba kart

**Obsługiwane interakcje:**

- Hover → wyświetlenie tooltipa "Liczba kart w sesji"

**Obsługiwana walidacja:**

- Brak

**Typy:**

- `number` (cards_count)

**Propsy:**

```typescript
interface CardsBadgeProps {
  count: number;
}
```

---

### 4.8 SessionCardSkeleton

**Opis:** Komponent placeholder wyświetlany podczas ładowania danych. Imituje wygląd `SessionCard` z animacją pulsowania.

**Główne elementy:**

- Komponent `Card` z shadcn/ui
- `Skeleton` z shadcn/ui dla poszczególnych elementów
- Animacja `animate-pulse`

**Obsługiwane interakcje:**

- Brak

**Obsługiwana walidacja:**

- Brak

**Typy:**

- Brak

**Propsy:**

- Brak

---

### 4.9 UserAvatar

**Opis:** Komponent awatara użytkownika wyświetlany w TopBar. Pokazuje inicjały użytkownika lub zdjęcie profilowe. Po kliknięciu otwiera menu z opcjami.

**Główne elementy:**

- Komponent `Avatar`, `AvatarImage`, `AvatarFallback` z shadcn/ui
- Komponent `DropdownMenu` z shadcn/ui
- Opcje menu: "Wyloguj się"

**Obsługiwane interakcje:**

- `onClick` → otwarcie dropdown menu
- Wybór opcji "Wyloguj się" → wywołanie funkcji logout

**Obsługiwana walidacja:**

- Brak

**Typy:**

- `UserInfo`

**Propsy:**

```typescript
interface UserAvatarProps {
  user: UserInfo;
  onLogout: () => void;
}
```

---

## 5. Typy

### 5.1 Typy z API (z `src/types.ts`)

```typescript
// Element listy sesji z API
interface SessionListItemDTO {
  id: string; // UUID sesji
  is_active: boolean; // Status aktywności
  context: string | null; // Opcjonalny kontekst projektu
  cards_count: number; // Liczba kart w sesji
  created_at: string; // ISO8601 timestamp utworzenia
  updated_at: string; // ISO8601 timestamp aktualizacji
}

// Odpowiedź listy sesji
interface SessionsListResponseDTO {
  data: SessionListItemDTO[]; // Lista sesji
  pagination: PaginationDTO; // Metadane paginacji
}

// Metadane paginacji
interface PaginationDTO {
  total: number; // Całkowita liczba sesji
  limit: number; // Limit na stronę
  offset: number; // Przesunięcie
}

// Komenda tworzenia sesji
interface SessionCreateCommand {
  context?: string | null; // Opcjonalny kontekst
}

// Odpowiedź pojedynczej sesji
interface SessionResponseDTO {
  data: SessionDTO;
}

// Pełny obiekt sesji
interface SessionDTO {
  id: string;
  user_id: string;
  is_active: boolean;
  context: string | null;
  created_at: string;
  updated_at: string;
}

// Błąd API
interface APIErrorDTO {
  code: string;
  message: string;
  details?: APIErrorDetail[];
}
```

### 5.2 Typy ViewModel (nowe, dla widoku)

```typescript
// Stan widoku sesji
interface SessionsViewState {
  sessions: SessionListItemDTO[]; // Lista sesji
  pagination: PaginationDTO | null; // Dane paginacji
  isLoading: boolean; // Stan ładowania listy
  isCreating: boolean; // Stan tworzenia nowej sesji
  error: string | null; // Komunikat błędu
}

// Parametry zapytania dla listy sesji
interface SessionsQueryParams {
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

// Informacje o użytkowniku dla TopBar
interface UserInfo {
  email: string;
  avatarUrl?: string;
}
```

---

## 6. Zarządzanie stanem

### 6.1 Custom Hook: `useSessions`

Hook `useSessions` centralizuje logikę zarządzania stanem i komunikacji z API dla widoku listy sesji.

**Lokalizacja:** `src/components/hooks/useSessions.ts`

```typescript
interface UseSessionsReturn {
  // Stan
  sessions: SessionListItemDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  // Akcje
  fetchSessions: (params?: SessionsQueryParams) => Promise<void>;
  createSession: (command?: SessionCreateCommand) => Promise<SessionDTO | null>;
  clearError: () => void;
}
```

**Funkcjonalności:**

1. **fetchSessions** - pobiera listę sesji z opcjonalnymi parametrami filtrowania i paginacji
2. **createSession** - tworzy nową sesję i zwraca utworzony obiekt
3. **clearError** - czyści stan błędu

**Stan początkowy:**

```typescript
const initialState: SessionsViewState = {
  sessions: [],
  pagination: null,
  isLoading: true, // true przy pierwszym renderze
  isCreating: false,
  error: null,
};
```

### 6.2 Przepływ stanu

1. **Montowanie komponentu:**
   - `isLoading: true`
   - Wywołanie `fetchSessions()`
   - Po sukcesie: `isLoading: false`, `sessions: [...]`

2. **Tworzenie sesji (przez NewSessionCard):**
   - `isCreating: true`
   - Wywołanie `createSession()`
   - Po sukcesie: nawigacja do `/sessions/:newId`
   - Po błędzie: `isCreating: false`, `error: "..."`

3. **Obsługa błędów:**
   - 401 → przekierowanie do `/login`
   - Inne → ustawienie `error` z komunikatem

---

## 7. Integracja API

### 7.1 GET /api/sessions

**Cel:** Pobieranie listy sesji użytkownika

**Implementacja w hooku:**

```typescript
const fetchSessions = async (params?: SessionsQueryParams): Promise<void> => {
  setState((prev) => ({ ...prev, isLoading: true, error: null }));

  try {
    const searchParams = new URLSearchParams();
    if (params?.is_active !== undefined) {
      searchParams.set("is_active", String(params.is_active));
    }
    if (params?.limit) {
      searchParams.set("limit", String(params.limit));
    }
    if (params?.offset) {
      searchParams.set("offset", String(params.offset));
    }

    const response = await fetch(`/api/sessions?${searchParams}`);

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      throw new Error("Nie udało się pobrać sesji");
    }

    const data: SessionsListResponseDTO = await response.json();

    setState((prev) => ({
      ...prev,
      sessions: data.data,
      pagination: data.pagination,
      isLoading: false,
    }));
  } catch (error) {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: error instanceof Error ? error.message : "Wystąpił nieznany błąd",
    }));
  }
};
```

**Typ żądania:** Brak body, query params opcjonalne

**Typ odpowiedzi:** `SessionsListResponseDTO`

---

### 7.2 POST /api/sessions

**Cel:** Tworzenie nowej sesji

**Implementacja w hooku:**

```typescript
const createSession = async (command?: SessionCreateCommand): Promise<SessionDTO | null> => {
  setState((prev) => ({ ...prev, isCreating: true, error: null }));

  try {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command ?? {}),
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return null;
    }

    if (!response.ok) {
      const errorData: APIErrorDTO = await response.json();
      throw new Error(errorData.message || "Nie udało się utworzyć sesji");
    }

    const data: SessionResponseDTO = await response.json();

    setState((prev) => ({ ...prev, isCreating: false }));

    return data.data as SessionDTO;
  } catch (error) {
    setState((prev) => ({
      ...prev,
      isCreating: false,
      error: error instanceof Error ? error.message : "Wystąpił nieznany błąd",
    }));
    return null;
  }
};
```

**Typ żądania:** `SessionCreateCommand` (opcjonalne)

**Typ odpowiedzi:** `SessionResponseDTO`

---

## 8. Interakcje użytkownika

### 8.1 Tworzenie nowej sesji

**Trigger:** Kliknięcie `NewSessionCard` (karty z dużym przyciskiem "+")

**Przepływ:**

1. Użytkownik klika kartę "Utwórz sesję"
2. Karta przechodzi w stan ładowania (`isCreating: true`, spinner zamiast ikony "+")
3. Wywołanie `POST /api/sessions`
4. Po sukcesie: nawigacja do `/sessions/:newSessionId`
5. Po błędzie: wyświetlenie komunikatu błędu, karta wraca do stanu normalnego

---

### 8.2 Nawigacja do sesji

**Trigger:** Kliknięcie `SessionCard` lub naciśnięcie Enter/Space na fokusowanej karcie

**Przepływ:**

1. Użytkownik klika kartę sesji lub naciska Enter/Space
2. Wywołanie `onClick(session.id)`
3. Nawigacja do `/sessions/:sessionId`

**Implementacja:**

```typescript
const handleSessionClick = (sessionId: string) => {
  window.location.href = `/sessions/${sessionId}`;
};
```

---

### 8.3 Keyboard navigation

**Trigger:** Użycie klawiatury Tab/Shift+Tab

**Przepływ:**

1. Użytkownik używa Tab do nawigacji między kartami
2. Fokus przenosi się sekwencyjnie: NewSessionCard → SessionCard[0] → SessionCard[1] → ...
3. Enter/Space na fokusowanej karcie wykonuje akcję (tworzenie lub nawigacja)

**Implementacja:** Natywna obsługa przez `tabIndex={0}` i `onKeyDown`

---

### 8.4 Wylogowanie użytkownika

**Trigger:** Kliknięcie opcji "Wyloguj się" w menu awatara

**Przepływ:**

1. Użytkownik klika awatar w TopBar
2. Otwiera się dropdown menu
3. Użytkownik wybiera "Wyloguj się"
4. Wywołanie funkcji logout (Supabase auth)
5. Przekierowanie do `/login`

---

## 9. Warunki i walidacja

### 9.1 Walidacja autentykacji

**Warunek:** Użytkownik musi być zalogowany

**Weryfikacja:**

- Na poziomie strony Astro: sprawdzenie `locals.supabase.auth.getUser()`
- Na poziomie API: odpowiedź 401 przy braku autentykacji

**Wpływ na UI:**

- Przekierowanie do `/login` przy 401
- Brak wyświetlania widoku dla niezalogowanych

### 9.2 Walidacja odpowiedzi API

**Warunek:** Odpowiedź API musi zawierać poprawną strukturę

**Weryfikacja:**

- Sprawdzenie `response.ok`
- Parsowanie JSON i walidacja struktury

**Wpływ na UI:**

- Wyświetlenie komunikatu błędu przy niepoprawnej odpowiedzi

### 9.3 Stan ładowania

**Warunek:** `isLoading === true`

**Wpływ na UI:**

- Wyświetlenie 3-4 komponentów `SessionCardSkeleton`

### 9.4 Stan pustej listy

**Warunek:** `sessions.length === 0 && !isLoading`

**Wpływ na UI:**

- Wyświetlenie `SessionGrid` z samym `NewSessionCard`
- Brak dodatkowego empty state - karta tworzenia jest zachętą do działania

---

## 10. Obsługa błędów

### 10.1 Błąd 401 Unauthorized

**Scenariusz:** Użytkownik nie jest zalogowany lub token wygasł

**Obsługa:**

- Automatyczne przekierowanie do `/login`
- Opcjonalnie: zapisanie aktualnego URL do przekierowania po zalogowaniu

### 10.2 Błąd sieci

**Scenariusz:** Brak połączenia z serwerem

**Obsługa:**

- Wyświetlenie komunikatu "Nie udało się połączyć z serwerem"
- Przycisk "Spróbuj ponownie" do ponownego wywołania `fetchSessions()`

### 10.3 Błąd serwera (500)

**Scenariusz:** Wewnętrzny błąd serwera

**Obsługa:**

- Wyświetlenie komunikatu "Wystąpił błąd serwera. Spróbuj ponownie później."
- Log błędu do konsoli

### 10.4 Błąd tworzenia sesji

**Scenariusz:** Nie udało się utworzyć nowej sesji

**Obsługa:**

- Wyświetlenie komunikatu błędu (toast lub inline)
- NewSessionCard wraca do stanu normalnego
- Użytkownik może spróbować ponownie

### 10.5 Komponent obsługi błędów

**Implementacja:**

```typescript
interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => (
  <div className="text-center py-8">
    <p className="text-destructive mb-4">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline">
        Spróbuj ponownie
      </Button>
    )}
  </div>
);
```

---

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

Utworzenie następujących plików:

- `src/pages/sessions.astro`
- `src/components/TopBar.tsx`
- `src/components/UserAvatar.tsx`
- `src/components/sessions/SessionsDashboard.tsx`
- `src/components/sessions/PageHeader.tsx`
- `src/components/sessions/SessionGrid.tsx`
- `src/components/sessions/NewSessionCard.tsx`
- `src/components/sessions/SessionCard.tsx`
- `src/components/sessions/CardsBadge.tsx`
- `src/components/sessions/SessionCardSkeleton.tsx`
- `src/components/hooks/useSessions.ts`

### Krok 2: Instalacja wymaganych komponentów shadcn/ui

```bash
npx shadcn@latest add card badge tooltip avatar dropdown-menu skeleton
```

### Krok 3: Implementacja custom hooka `useSessions`

1. Zdefiniowanie interfejsu `SessionsViewState`
2. Implementacja stanu z `useState`
3. Implementacja `fetchSessions` z obsługą błędów i 401
4. Implementacja `createSession` z obsługą błędów
5. Implementacja `clearError`
6. Wywołanie `fetchSessions` w `useEffect` przy montowaniu

### Krok 4: Implementacja komponentów TopBar

1. **TopBar** - główny pasek nawigacji z flexbox layout
2. **UserAvatar** - awatar z dropdown menu

### Krok 5: Implementacja komponentów atomowych

1. **CardsBadge** - prosty badge z tooltipem
2. **SessionCardSkeleton** - skeleton z animacją
3. **PageHeader** - uproszczony nagłówek z tytułem

### Krok 6: Implementacja komponentów złożonych

1. **NewSessionCard** - karta z dużym przyciskiem "+" do tworzenia sesji
2. **SessionCard** - karta z obsługą kliknięcia i keyboard
3. **SessionGrid** - siatka z NewSessionCard + mapowaniem sesji

### Krok 7: Implementacja głównego komponentu `SessionsDashboard`

1. Użycie hooka `useSessions`
2. Warunkowe renderowanie stanów (loading, data, error)
3. Obsługa nawigacji do sesji
4. Obsługa tworzenia sesji przez NewSessionCard

### Krok 8: Implementacja strony Astro

1. Utworzenie `sessions.astro`
2. Sprawdzenie autentykacji na poziomie strony
3. Przekierowanie do `/login` przy braku auth
4. Pobranie danych użytkownika dla TopBar
5. Renderowanie `TopBar` i `SessionsDashboard` z `client:load`

### Krok 9: Styling i responsywność

1. Dodanie klas Tailwind dla responsywnej siatki
2. Stylowanie NewSessionCard (dashed border, wyróżnione tło)
3. Implementacja hover i focus states
4. Animacje skeleton
5. Ciemny motyw (dark mode)

### Krok 10: Dostępność

1. Dodanie `role="button"` do kart
2. Implementacja `aria-label` dla kart
3. `aria-busy` dla NewSessionCard podczas ładowania
4. Obsługa keyboard navigation (Tab, Enter, Space)
5. Tooltips dla badge'y

### Krok 11: Testowanie

1. Testy manualne wszystkich interakcji
2. Testy keyboard navigation
3. Testy responsywności
4. Testy obsługi błędów (symulacja 401, błędów sieci)
5. Testy wylogowania

### Krok 12: Optymalizacja

1. Memoizacja komponentów (`React.memo` dla `SessionCard`, `NewSessionCard`)
2. Optymalizacja re-renderów
3. Lazy loading dla dużej liczby sesji (jeśli potrzebne)
