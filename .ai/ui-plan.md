# Architektura UI dla BucketEstimate AI

## 1. Przegląd struktury UI

BucketEstimate AI to aplikacja webowa zoptymalizowana dla urządzeń desktopowych, wspierająca zespoły Scrumowe w estymacji zadań metodą Bucket System. Struktura UI opiera się na trzech głównych widokach połączonych prostą nawigacją:

```
┌─────────────────────────────────────────────────────────────┐
│                         TOPBAR                              │
│  Logo ─────────────────────────── Email użytkownika [Wyloguj]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    GŁÓWNA ZAWARTOŚĆ                         │
│                                                             │
│   /login      → Formularz logowania                         │
│   /sessions   → Dashboard z listą sesji                     │
│   /sessions/[id] → Widok sesji (Estymacja | Podsumowanie)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Kluczowe założenia architektoniczne:

- **Desktop-only**: Brak optymalizacji dla urządzeń mobilnych ze względu na naturę drag-and-drop
- **Stack technologiczny**: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui, dnd-kit
- **Zarządzanie stanem**: React Context + custom hooks
- **Komunikacja z API**: Optimistic UI z powiadomieniami toast przy błędach

---

## 2. Lista widoków

### 2.1 Strona logowania (`/login`)

**Główny cel:** Uwierzytelnienie użytkownika poprzez magic link

**Kluczowe informacje do wyświetlenia:**

- Logo/nazwa aplikacji
- Formularz z polem email
- Komunikat o wysłaniu linku (po akcji)
- Komunikat o cooldown przy ponownej próbie

**Kluczowe komponenty widoku:**

| Komponent      | Opis                                             |
| -------------- | ------------------------------------------------ |
| Logo           | Branding aplikacji "BucketEstimate"              |
| EmailInput     | Pole tekstowe z walidacją email (Shadcn Input)   |
| SubmitButton   | Przycisk "Wyślij link logowania" (Shadcn Button) |
| SuccessMessage | Komunikat po wysłaniu z instrukcją               |
| ResendLink     | Link do ponownego wysłania (z cooldown 60s)      |

**UX, dostępność i bezpieczeństwo:**

- Formularz wyśrodkowany pionowo i poziomo
- Autofocus na polu email
- Walidacja email przed wysłaniem
- Wyraźny feedback po wysłaniu linku
- Aria-labels dla wszystkich interaktywnych elementów
- Obsługa stanu ładowania na przycisku
- Zachowanie `return_to` URL dla przekierowania po zalogowaniu

---

### 2.2 Dashboard - Lista sesji (`/sessions`)

**Główny cel:** Przegląd istniejących sesji i tworzenie nowych

**Kluczowe informacje do wyświetlenia:**

- Lista sesji użytkownika
- ID każdej sesji (tymczasowo jako nazwa)
- Liczba kart w każdej sesji
- Empty state dla nowych użytkowników

**Kluczowe komponenty widoku:**

| Komponent           | Opis                                     |
| ------------------- | ---------------------------------------- |
| PageHeader          | Tytuł "Twoje sesje" + przycisk tworzenia |
| CreateSessionButton | Przycisk "+ Utwórz nową sesję" (primary) |
| SessionGrid         | Siatka kart sesji (CSS Grid)             |
| SessionCard         | Karta sesji z ID i badge liczby zadań    |
| EmptySessionsState  | Ilustracja + CTA dla nowych użytkowników |
| SessionCardSkeleton | Skeleton loading podczas ładowania       |

**UX, dostępność i bezpieczeństwo:**

- Skeleton loading przy pierwszym renderze (3-4 placeholder cards)
- Karty sesji jako klikalne elementy (cała powierzchnia)
- Badge z liczbą kart w prawym dolnym rogu z tooltip
- Sortowanie sesji od najnowszych
- Keyboard navigation między kartami
- Role="button" dla kart sesji
- Automatyczne przekierowanie do /login przy 401

---

### 2.3 Widok sesji (`/sessions/[id]`)

**Główny cel:** Estymacja zadań metodą Bucket System z możliwością AI

**Kluczowe informacje do wyświetlenia:**

- Akcje sesji (Dodaj zadanie, Importuj zadania, Auto estymacja)
- Tabs przełączające widok
- Tab Estymacja: 8 kubełków z kartami
- Tab Podsumowanie: Tabela z wycenami
- Możliwość usuwania poszczególnych kart

**Kluczowe komponenty widoku:**

| Komponent       | Opis                                           |
| --------------- | ---------------------------------------------- |
| SessionHeader   | Przycisk wstecz do widoku sekcji + akcje sesji |
| SessionTabs     | Tabs "Estymacja" / "Podsumowanie"              |
| EstimationBoard | Kontener dla kubełków z drag-and-drop          |
| Bucket          | Pojedynczy kubełek z nagłówkiem i listą kart   |
| TaskCard        | Karta zadania (ID + tytuł)                     |
| SummaryTable    | Tabela podsumowania (ID, Tytuł, Wycena)        |
| EmptyBoardState | Stan pustej sesji z CTA                        |

**Modale:**

| Modal             | Trigger                     | Zawartość                                               |
| ----------------- | --------------------------- | ------------------------------------------------------- |
| AddTaskModal      | Przycisk "Dodaj zadanie"    | Formularz: ID*, Tytuł*, Opis                            |
| ImportCsvModal    | Przycisk "Importuj CSV"     | Drag-drop zone + wynik importu                          |
| AiEstimationModal | Przycisk "Estymuj przez AI" | Select modelu, textarea kontekstu, ostrzeżenie          |
| TaskDetailModal   | Kliknięcie karty            | ID, Tytuł, Opis, Badge wyceny + Przycisk "Usuń zadanie" |

**UX, dostępność i bezpieczeństwo:**

- Skeleton loading dla kubełków przy ładowaniu kart
- Drag-and-drop z wizualnym feedbackiem (shadow, opacity, scale)
- Kubełek "Do wyceny" (?) wizualnie wyróżniony (szare tło, przerywana obwódka)
- Gradient kolorów kubełków: zielony (1) → żółty (5,8) → czerwony (21)
- Sticky headers kubełków
- Karty o stałej wysokości z line-clamp-2 dla tytułu
- Tooltip z pełnym tytułem przy hover
- Toast przy błędzie zapisu (bez rollback)
- Modal AI blokujący interakcję z tłem
- AlertDialog do potwierdzenia usunięcia karty (destructive action)
- Optimistic UI przy usuwaniu: karta znika natychmiast po potwierdzeniu
- Keyboard accessible drag-and-drop (dnd-kit)
- Focus trap w modalach
- Escape zamyka modale (ale nie wykonuje destrukcyjnych akcji)

---

## 3. Mapa podróży użytkownika

### 3.1 Przepływ główny

```
┌─────────┐     ┌─────────┐     ┌──────────────┐     ┌─────────────────┐
│    /    │ ──▶ │ /login  │ ──▶ │  /sessions   │ ──▶ │ /sessions/[id]  │
└─────────┘     └─────────┘     └──────────────┘     └─────────────────┘
     │               │                  │                     │
     │               │                  │                     ▼
     │               │                  │           ┌─────────────────┐
     │               │                  │           │   Tab:          │
     │               │                  │           │   Estymacja     │
     │               │                  │           │   ◄──────────▶  │
     │               │                  │           │   Podsumowanie  │
     │               │                  │           └─────────────────┘
     ▼               ▼                  ▼
  Redirect      Magic Link         Utwórz/Otwórz
  (auth check)   Email              sesję
```

### 3.2 Szczegółowy przepływ estymacji (główny przypadek użycia)

```
1. Użytkownik wchodzi na /sessions/[id]
   │
   ├─▶ [Pusta sesja] ──▶ EmptyBoardState z CTA
   │
   └─▶ [Sesja z kartami] ──▶ Karty w kubełkach
                              │
2. Dodawanie kart:           │
   ├─▶ "Dodaj zadanie" ──▶ AddTaskModal ──▶ Karta w "Do wyceny"
   │
   └─▶ "Importuj CSV" ──▶ ImportCsvModal ──▶ Karty w "Do wyceny"
                              │
3. Estymacja:                │
   ├─▶ Ręczna ──▶ Drag-and-drop kart między kubełkami
   │              │
   │              └─▶ Optimistic UI + zapis API
   │
   └─▶ AI ──▶ AiEstimationModal
              │
              ├─▶ Wybór modelu (GPT-4o-mini / Gemini)
              ├─▶ Opcjonalny kontekst
              └─▶ "Uruchom" ──▶ Spinner ──▶ Karty rozłożone w kubełkach
                              │
4. Podgląd i zarządzanie:    │
   └─▶ Kliknięcie karty ──▶ TaskDetailModal
                              ├─▶ Podgląd szczegółów (ID, Tytuł, Opis, Wycena)
                              └─▶ Opcja "Usuń zadanie"
                                   ├─▶ Dialog potwierdzenia
                                   └─▶ DELETE API ──▶ Karta znika z kubełka
                              │
5. Podsumowanie:             │
   └─▶ Tab "Podsumowanie" ──▶ SummaryTable (sortowana po wycenie)
```

### 3.3 Przepływ logowania

```
1. Użytkownik wchodzi na /login
   │
   ├─▶ [Niezalogowany] ──▶ Formularz email
   │                        │
   │                        └─▶ "Wyślij link" ──▶ SuccessMessage
   │                                              │
   │                                              └─▶ Sprawdź email
   │                                                   │
   │                                                   └─▶ Klik w link
   │                                                        │
   └─▶ [Zalogowany] ◀────────────────────────────────────────┘
        │
        └─▶ Redirect do /sessions (lub return_to URL)
```

### 3.4 Przepływy obsługi błędów

```
Błąd 401 (Unauthorized):
  Dowolny widok ──▶ Redirect do /login?return_to={current_url}

Błąd sieci (drag-drop):
  Przeciągnięcie karty ──▶ Toast "Nie udało się zapisać zmiany"

Błąd sieci (usuwanie karty):
  TaskDetailModal DELETE ──▶ Toast "Nie udało się usunąć zadania"

Błąd importu CSV:
  Import ──▶ Modal z listą błędów (numer wiersza + przyczyna)

Konflikt ID (409):
  AddTaskModal ──▶ Inline error pod polem ID

Limit kart (422):
  Import/Dodaj ──▶ Komunikat "Możesz dodać jeszcze X kart"

AI niedostępne (503):
  AiEstimationModal ──▶ Error message + przycisk "Ponów"

Karta nie istnieje (404):
  TaskDetailModal DELETE ──▶ Toast "Zadanie zostało już usunięte"
```

---

## 4. Układ i struktura nawigacji

### 4.1 Globalny layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              TOPBAR (sticky)                            │
│  ┌────────────────┐                           ┌───────────────────────┐ │
│  │ 🪣 BucketEstimate │ ◀── link do /sessions  │ user@email.com [Wyloguj]│ │
│  └────────────────┘                           └───────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                          MAIN CONTENT AREA                              │
│                                                                         │
│                     (renderowany przez router)                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Struktura nawigacji

| Element               | Akcja | Cel                             |
| --------------------- | ----- | ------------------------------- |
| Logo "BucketEstimate" | Klik  | /sessions                       |
| "Wyloguj"             | Klik  | Wylogowanie + /login            |
| "← Wróć" (w sesji)    | Klik  | /sessions                       |
| SessionCard           | Klik  | /sessions/[id]                  |
| Tab "Estymacja"       | Klik  | Widok kubełków (bez zmiany URL) |
| Tab "Podsumowanie"    | Klik  | Widok tabeli (bez zmiany URL)   |

### 4.3 Hierarchia routingu (Astro)

```
src/pages/
├── index.astro           # / → redirect do /sessions lub /login
├── login.astro           # /login
└── sessions/
    ├── index.astro       # /sessions
    └── [id].astro        # /sessions/[id]
```

### 4.4 Ochrona tras (Middleware)

```
Chronione trasy (wymagają auth):
  - /sessions
  - /sessions/[id]

Publiczne trasy:
  - /login

Middleware flow:
  1. Sprawdź token JWT (Supabase)
  2. Jeśli brak/nieważny → redirect do /login?return_to={url}
  3. Jeśli ważny → kontynuuj + dodaj user do context.locals
```

---

## 5. Kluczowe komponenty

### 5.1 Komponenty layoutu

| Komponent      | Lokalizacja            | Opis                                                     |
| -------------- | ---------------------- | -------------------------------------------------------- |
| `Layout.astro` | src/layouts/           | Główny layout z Topbar, obsługa meta tags                |
| `Topbar.tsx`   | src/components/layout/ | NavigationMenu z Shadcn/ui, logo, user info, wylogowanie |

### 5.2 Komponenty autentykacji

| Komponent       | Lokalizacja          | Opis                                 |
| --------------- | -------------------- | ------------------------------------ |
| `LoginForm.tsx` | src/components/auth/ | Formularz email + obsługa magic link |

### 5.3 Komponenty sesji

| Komponent                 | Lokalizacja              | Opis                                       |
| ------------------------- | ------------------------ | ------------------------------------------ |
| `SessionList.tsx`         | src/components/sessions/ | Grid z SessionCard + obsługa loading/empty |
| `SessionCard.tsx`         | src/components/sessions/ | Karta sesji z ID i badge                   |
| `CreateSessionButton.tsx` | src/components/sessions/ | Przycisk tworzenia + logika API            |
| `EmptySessionsState.tsx`  | src/components/sessions/ | Ilustracja + CTA dla pustej listy          |

### 5.4 Komponenty estymacji

| Komponent             | Lokalizacja                | Opis                                             |
| --------------------- | -------------------------- | ------------------------------------------------ |
| `EstimationBoard.tsx` | src/components/estimation/ | Kontener DndContext z kubełkami                  |
| `Bucket.tsx`          | src/components/estimation/ | Droppable kubełek z nagłówkiem i listą kart      |
| `TaskCard.tsx`        | src/components/estimation/ | Draggable karta zadania                          |
| `TaskDetailModal.tsx` | src/components/estimation/ | Modal szczegółów z możliwością usunięcia zadania |
| `EmptyBoardState.tsx` | src/components/estimation/ | Stan pustej sesji z CTA                          |

### 5.5 Komponenty podsumowania

| Komponent          | Lokalizacja             | Opis                                        |
| ------------------ | ----------------------- | ------------------------------------------- |
| `SummaryTable.tsx` | src/components/summary/ | Tabela z ID, tytułem, wyceną (Shadcn Table) |

### 5.6 Komponenty modali

| Komponent               | Lokalizacja            | Opis                                 |
| ----------------------- | ---------------------- | ------------------------------------ |
| `AddTaskModal.tsx`      | src/components/modals/ | Formularz dodawania karty            |
| `ImportCsvModal.tsx`    | src/components/modals/ | Drag-drop zone + wyniki importu      |
| `AiEstimationModal.tsx` | src/components/modals/ | Select modelu, kontekst, ostrzeżenie |

#### TaskDetailModal - Szczegółowa specyfikacja

**Zawartość modalu:**

- **Header**: "Szczegóły zadania" + przycisk X (zamknij)
- **Body**:
  - ID zadania (read-only, pole wyłączone)
  - Tytuł zadania (read-only, pole wyłączone)
  - Opis zadania (read-only, textarea wyłączone lub div z tekstem)
  - Badge wyceny (jeśli bucket_value !== null): np. "Wycena: 5 punktów"
- **Footer**:
  - Przycisk "Usuń zadanie" (destructive variant, po lewej)
  - Przycisk "Zamknij" (secondary variant, po prawej)

**Przepływ usuwania:**

1. Użytkownik klika "Usuń zadanie"
2. Wyświetla się AlertDialog z potwierdzeniem:
   - Tytuł: "Czy na pewno usunąć zadanie?"
   - Treść: "Zadanie [ID] zostanie trwale usunięte. Tej operacji nie można cofnąć."
   - Przyciski: "Anuluj" + "Usuń" (destructive)
3. Po kliknięciu "Usuń":
   - Wyświetla się spinner na przycisku
   - Wywołanie DELETE /api/sessions/:sessionId/cards/:id
   - **Sukces (204)**:
     - Zamknięcie obu modali (AlertDialog + TaskDetailModal)
     - Optimistic UI: usunięcie karty z kubełka
     - Toast sukcesu: "Zadanie zostało usunięte"
   - **Błąd (404)**:
     - Toast: "Zadanie zostało już usunięte"
     - Zamknięcie modali
     - Odświeżenie listy kart
   - **Błąd (401)**:
     - Redirect do /login
   - **Błąd (500)**:
     - Toast: "Nie udało się usunąć zadania. Spróbuj ponownie."
     - Modal pozostaje otwarty

**UX Details:**

- AlertDialog używa komponentu Shadcn `AlertDialog` zamiast window.confirm
- Przycisk "Usuń zadanie" w kolorze destructive (czerwony)
- Optimistic UI: karta znika natychmiast po potwierdzeniu
- Focus trap w AlertDialog
- Escape zamyka AlertDialog (ale nie usuwa karty)
- Disabled state dla wszystkich pól formularza (read-only)

### 5.7 Custom hooks

| Hook                | Lokalizacja           | Opis                                                                         |
| ------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `useSession.ts`     | src/components/hooks/ | Pobieranie i zarządzanie danymi sesji                                        |
| `useCards.ts`       | src/components/hooks/ | CRUD operacje (CREATE, READ, UPDATE, DELETE) na kartach + optimistic updates |
| `useDragAndDrop.ts` | src/components/hooks/ | Logika dnd-kit + zapis bucket_value                                          |

### 5.8 Context

| Context              | Lokalizacja   | Opis                                        |
| -------------------- | ------------- | ------------------------------------------- |
| `SessionContext.tsx` | src/contexts/ | Stan sesji i kart współdzielony między tabs |

### 5.9 Komponenty Shadcn/ui do zainstalowania

```bash
npx shadcn@latest add button card dialog input textarea select table tabs badge skeleton toast tooltip navigation-menu alert-dialog
```

---

## 6. Mapowanie User Stories do komponentów UI

| User Story                      | Komponenty UI                                    |
| ------------------------------- | ------------------------------------------------ |
| **US-001** Uwierzytelnienie     | `LoginForm`, `Topbar` (wylogowanie), Middleware  |
| **US-002** Import CSV           | `ImportCsvModal`, Toast (błędy/sukces)           |
| **US-003** Ręczne dodanie       | `AddTaskModal`, inline validation                |
| **US-004** Drag-and-drop        | `EstimationBoard`, `Bucket`, `TaskCard`, dnd-kit |
| **US-005** Szczegóły i usuwanie | `TaskDetailModal`, Dialog potwierdzenia, Toast   |
| **US-006** Estymacja AI         | `AiEstimationModal`, spinner, Toast              |
| **US-007** Podsumowanie         | `SummaryTable`, `SessionTabs`                    |
| **US-008** Czyszczenie sesji    | _(nie w MVP)_                                    |
| **US-009** Obsługa błędów       | Toast, inline errors, empty states, skeletons    |

---

## 7. Stany UI i obsługa edge cases

### 7.1 Stany ładowania

| Widok                   | Komponent loading                           |
| ----------------------- | ------------------------------------------- |
| Lista sesji             | `SessionCardSkeleton` × 3-4                 |
| Widok sesji             | Skeleton cards w kubełkach (2-3 per bucket) |
| Operacje (save, import) | Spinner w przyciskach                       |

### 7.2 Empty states

| Stan        | Komponent            | CTA                                |
| ----------- | -------------------- | ---------------------------------- |
| Brak sesji  | `EmptySessionsState` | "Utwórz pierwszą sesję"            |
| Pusta sesja | `EmptyBoardState`    | "Importuj z CSV" + "Dodaj zadanie" |

### 7.3 Stany błędów

| Błąd                   | Obsługa UI                           |
| ---------------------- | ------------------------------------ |
| Błąd sieci (drag-drop) | Toast z komunikatem                  |
| Błąd usuwania (DELETE) | Toast "Nie udało się usunąć zadania" |
| Karta nie istnieje     | Toast + zamknięcie modalu            |
| Błąd importu CSV       | Lista błędów w modalu                |
| Konflikt ID (409)      | Inline error pod polem               |
| Limit 50 kart (422)    | Komunikat przed importem             |
| AI niedostępne (503)   | Error w modalu + "Ponów"             |
| Nieautoryzowany (401)  | Redirect do /login                   |

---

## 8. Responsywność i dostępność

### 8.1 Responsywność

- **Breakpoint docelowy**: Desktop (min. 1280px)
- **Układ kubełków**: 8 kolumn w grid, przewijanie poziome przy mniejszych ekranach
- **Brak wsparcia mobile**: Komunikat informacyjny dla urządzeń < 1024px

### 8.2 Dostępność (ARIA)

| Element     | Atrybuty ARIA                                        |
| ----------- | ---------------------------------------------------- |
| Topbar      | `role="navigation"`, `aria-label="Nawigacja główna"` |
| SessionCard | `role="button"`, `aria-label="Otwórz sesję {id}"`    |
| TaskCard    | `aria-label="Karta {id}: {title}"`, `aria-grabbed`   |
| Bucket      | `aria-label="Kubełek {value}"`, `aria-dropeffect`    |
| Modal       | `role="dialog"`, `aria-modal="true"`, focus trap     |
| Badge       | `aria-label="Liczba zadań: {count}"`                 |
| Toast       | `role="alert"`, `aria-live="polite"`                 |

### 8.3 Keyboard navigation

- **Tab**: Nawigacja między elementami
- **Enter/Space**: Aktywacja przycisków i kart
- **Escape**: Zamykanie modali
- **Arrow keys**: Nawigacja w obrębie dnd-kit (z włączonym keyboard sensor)

---

## 9. Bezpieczeństwo na poziomie UI

| Aspekt        | Implementacja                              |
| ------------- | ------------------------------------------ |
| Ochrona tras  | Middleware sprawdzający JWT przed renderem |
| Token storage | HttpOnly cookies (Supabase)                |
| CSRF          | Supabase Auth obsługuje automatycznie      |
| XSS           | React escaping + Content-Security-Policy   |
| Walidacja     | Zod schemas na frontendzie i backendzie    |
| Rate limiting | Obsługa 429 z komunikatem dla użytkownika  |
