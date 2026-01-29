# Podsumowanie planowania architektury UI - BucketEstimate AI

## Decyzje projektowe

1. **Platforma docelowa**: Aplikacja zoptymalizowana wyłącznie dla urządzeń desktopowych ze względu na naturę drag-and-drop.

2. **Struktura nawigacji**: Po zalogowaniu użytkownik trafia na listę sesji z przyciskiem "Utwórz sesję". Widok sesji podzielony na tabs: "Estymacja" (kubełki) i "Podsumowanie" (tabela).

3. **Drag-and-drop**: Zawsze przeciąganie pojedynczej karty (bez multi-select). Wykorzystanie biblioteki **dnd-kit**.

4. **Import CSV**: Prosty proces - przycisk w widoku sesji, zaimportowane karty trafiają do kubełka "Do wyceny" bez podglądu przed importem.

5. **Modal estymacji AI**: Zawiera select z wyborem modelu (hardcoded: 2 opcje), opcjonalne pole kontekstu, przyciski "Uruchom" i "Anuluj". Prosty spinner podczas przetwarzania.

6. **Wygląd karty**: ID w prawym górnym rogu (mała czcionka), tytuł na środku (max 2 linie z ellipsis). Status embeddingu nie jest wyświetlany.

7. **Zapis stanu**: Optimistic UI z automatycznym zapisem. Przy błędzie tylko toast z informacją (bez rollback do poprzedniej pozycji).

8. **Logowanie**: Minimalistyczny ekran z polem email i magic link. Cooldown 60s na ponowne wysłanie. JWT implementowane później.

9. **Kubełek "Do wyceny"**: Pierwsza kolumna (po lewej), szare tło z przerywaną obwódką, wizualnie wyróżniony.

10. **Widok podsumowania**: Statyczna tabela sortowana po wycenie, bez możliwości eksportu.

11. **Akcje w widoku sesji**: "Dodaj zadanie", "Importuj z CSV", "Estymuj przez AI".

12. **Context sesji**: To NIE jest nazwa sesji - to długa treść pomocnicza dla AI do wyceny zadań.

13. **Lista sesji**: Wyświetlana jako cards z ID sesji jako tytuł, badge z liczbą kart w prawym dolnym rogu.

14. **Kolorystyka kubełków**: Gradient od zielonego (1) przez żółty (5, 8) do czerwonego (21) wskazujący złożoność.

15. **Układ kart w kubełku**: Pionowy (jedna pod drugą), kolejność według czasu dodania.

16. **Formularz dodawania karty**: Modal z polami ID (wymagane), Tytuł (wymagane), Opis (opcjonalny).

17. **Obsługa konfliktu ID**: Komunikat błędu pod polem, użytkownik musi zmienić ID.

18. **Modal szczegółów karty**: Read-only z ID, tytułem, opisem i wycena (badge).

19. **Modal AI blokujący**: Użytkownik nie może interagować z kubełkami podczas estymacji.

20. **Zarządzanie stanem**: React Context + custom hooks (bez zewnętrznych bibliotek jak Zustand).

21. **Stany ładowania**: Skeleton loading dla kubełków i listy sesji.

22. **Błąd 401**: Automatyczne przekierowanie do logowania z zachowaniem return_to.

23. **Brak funkcji na MVP**: Kasowanie sesji, czyszczenie sesji, obsługa rate limiting, tryb offline.

24. **Topbar**: Navigation Menu z Shadcn/ui - logo, spacer, email użytkownika, przycisk wyloguj.

25. **Empty states**: Dedykowane widoki dla braku sesji i pustej sesji z CTA.

---

## Dopasowane rekomendacje

1. **Biblioteka UI**: Shadcn/ui jako główna biblioteka komponentów (Card, Dialog, Button, Table, Tabs, Badge, Skeleton, Toast, Tooltip, NavigationMenu, Input, Textarea, Select).

2. **Drag-and-drop z dnd-kit**: Przeciągana karta z efektami (shadow-lg, opacity-80, scale-105), kubełek docelowy z podświetleniem border-primary.

3. **Routing Astro**:
   - `/` → przekierowanie
   - `/login` → logowanie
   - `/sessions` → lista sesji
   - `/sessions/[id]` → widok sesji

4. **Struktura komponentów**: Podział na foldery: layout/, auth/, sessions/, estimation/, summary/, modals/, hooks/, contexts/.

5. **Custom hooks**: `useSession()`, `useCards()`, `useDragAndDrop()` dla logiki biznesowej.

6. **SessionContext**: Jeden kontekst obejmujący widok kubełków i podsumowania ze współdzielonym stanem.

7. **Walidacja limitu kart**: Sprawdzenie przed importem z komunikatem "Możesz dodać jeszcze X kart".

8. **Tabs dla widoku sesji**: Shadcn Tabs z płynnym przejściem bez przeładowania.

9. **Obsługa błędów formularzy**: Inline validation pod polami z podświetleniem na czerwono.

10. **Stała wysokość kart**: Dla spójnego wyglądu siatki z line-clamp-2 dla tytułu.

---

## Podsumowanie architektury UI

### Główne wymagania architektury UI

Aplikacja BucketEstimate AI to narzędzie desktopowe wspierające zespoły Scrumowe w estymacji zadań metodą Bucket System. Interfejs musi obsługiwać do 50 kart zadań rozmieszczonych w 8 kubełkach (?, 1, 2, 3, 5, 8, 13, 21) z funkcjonalnością drag-and-drop. Stack technologiczny obejmuje Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui oraz dnd-kit.

### Kluczowe widoki i przepływy użytkownika

#### Przepływ główny:

```
Logowanie (magic link) → Lista sesji → Utwórz/Otwórz sesję → Estymacja (drag-drop) ↔ Podsumowanie (tabela)
```

#### Widoki:

1. **Strona logowania** (`/login`): Minimalistyczny formularz z polem email, komunikat po wysłaniu linku
2. **Dashboard** (`/sessions`): Grid/lista kart sesji z ID i badge liczbą zadań, przycisk tworzenia sesji
3. **Widok sesji** (`/sessions/[id]`):
   - Nagłówek z akcjami (Dodaj, Import, AI)
   - Tabs: Estymacja | Podsumowanie
   - Kubełki z kartami (drag-drop) lub tabela read-only

#### Modale:

- Dodaj zadanie (formularz)
- Import CSV (drag-drop zone + wynik)
- Estymacja AI (wybór modelu, kontekst, spinner)
- Szczegóły karty (read-only)

### Strategia integracji z API i zarządzania stanem

#### Zarządzanie stanem:

- **React Context** (`SessionContext`) dla stanu sesji i kart
- **Custom hooks**: `useSession()`, `useCards()`, `useDragAndDrop()`
- **Optimistic UI**: Natychmiastowa aktualizacja UI, toast przy błędzie API (bez rollback)

#### Integracja z API:

| Operacja        | Endpoint                            | Obsługa UI              |
| --------------- | ----------------------------------- | ----------------------- |
| Lista sesji     | GET /api/sessions                   | Skeleton → Cards        |
| Tworzenie sesji | POST /api/sessions                  | Modal → Redirect        |
| Pobieranie kart | GET /api/sessions/:id/cards         | Skeleton w kubełkach    |
| Dodanie karty   | POST /api/sessions/:id/cards        | Modal → Zamknij         |
| Import CSV      | POST /api/sessions/:id/cards/import | Modal z wynikiem        |
| Przeciągnięcie  | PATCH /api/sessions/:id/cards/:id   | Optimistic UI           |
| Estymacja AI    | POST /api/sessions/:id/ai/estimate  | Modal blokujący+spinner |
| Podsumowanie    | GET /api/sessions/:id/summary       | Tabela                  |

### Kwestie responsywności, dostępności i bezpieczeństwa

#### Responsywność:

- Aplikacja **desktop-only** - brak optymalizacji dla urządzeń mobilnych
- Układ poziomy kubełków z przewijaniem
- Karty o stałej wysokości dla spójności

#### Dostępność:

- dnd-kit zapewnia podstawowe wsparcie dla keyboard navigation
- Shadcn/ui ma wbudowane atrybuty ARIA
- Tooltips dla skróconych treści

#### Bezpieczeństwo:

- JWT authentication (implementacja później)
- Automatyczne przekierowanie do logowania przy 401
- Middleware Astro dla chronionych tras
- Zachowanie return_to URL po zalogowaniu

### Komponenty Shadcn/ui do wykorzystania

| Komponent                       | Zastosowanie        |
| ------------------------------- | ------------------- |
| NavigationMenu                  | Topbar              |
| Card                            | Sesje, karty zadań  |
| Dialog                          | Wszystkie modale    |
| Button, Input, Textarea, Select | Formularze          |
| Table                           | Podsumowanie        |
| Tabs                            | Przełącznik widoków |
| Badge                           | Liczniki, wyceny    |
| Skeleton                        | Stany ładowania     |
| Toast                           | Komunikaty błędów   |
| Tooltip                         | Podpowiedzi         |

---

## Nierozwiązane kwestie

1. **Nazwa/identyfikacja sesji**: Aktualnie wyświetlane jest ID sesji jako tytuł karty - zaznaczono do zmiany w przyszłości. Brak decyzji jak sesje będą identyfikowane dla użytkownika (pole name? automatyczna nazwa z daty?).

2. **Obsługa błędu 404 dla sesji**: Pominięto w dyskusji - brak decyzji jak obsłużyć nieistniejącą sesję.

3. **Rate limiting AI (429)**: Odłożone - brak obsługi na MVP, ale API to wspiera.

4. **Kasowanie sesji**: Wyłączone z MVP - użytkownik nie może usunąć sesji.

5. **Czyszczenie sesji**: Wyłączone z MVP - użytkownik nie może zresetować wycen.

6. **Eksport danych**: Brak możliwości eksportu podsumowania do CSV.

7. **Sortowanie w tabeli podsumowania**: Domyślnie po wycenie, ale nie ustalono czy użytkownik może zmieniać sortowanie.

8. **Modele AI**: Hardcoded lista 2 modeli - nie ustalono konkretnych nazw/wartości.

9. **Walidacja formatu CSV**: API definiuje format (id, title, description), ale nie ustalono szczegółów komunikatów błędów dla użytkownika.

10. **Timeout dla operacji AI**: Brak ustaleń dotyczących maksymalnego czasu oczekiwania i obsługi timeout.

---

## Wireframes

### Strona logowania (`/login`)

```
┌─────────────────────────────────────┐
│                                     │
│         🪣 BucketEstimate           │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ Email                       │   │
│   └─────────────────────────────┘   │
│                                     │
│   [ Wyślij link logowania ]         │
│                                     │
└─────────────────────────────────────┘
```

### Lista sesji (`/sessions`)

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Twoje sesje                    [ + Utwórz nową sesję ]     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ abc-123...  │  │ def-456...  │  │ ghi-789...  │          │
│  │             │  │             │  │             │          │
│  │        [15] │  │         [8] │  │        [32] │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Widok sesji (`/sessions/[id]`)

```
┌─────────────────────────────────────────────────────────────┐
│  TOPBAR                                                     │
├─────────────────────────────────────────────────────────────┤
│  ← Wróć    [Dodaj zadanie] [Importuj CSV] [✨ Estymuj AI]   │
├─────────────────────────────────────────────────────────────┤
│  [ Estymacja ]  [ Podsumowanie ]                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  │ TAB CONTENT (kubełki lub tabela)                     │   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tab: Estymacja (kubełki)

```
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│   ?    │   1    │   2    │   3    │   5    │   8    │   13   │   21   │
│  Do    │        │        │        │        │        │        │        │
│ wyceny │        │        │        │        │        │        │        │
├────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ ┌────┐ │ ┌────┐ │        │ ┌────┐ │        │ ┌────┐ │        │        │
│ │Card│ │ │Card│ │        │ │Card│ │        │ │Card│ │        │        │
│ └────┘ │ └────┘ │        │ └────┘ │        │ └────┘ │        │        │
│ ┌────┐ │        │        │        │        │        │        │        │
│ │Card│ │        │        │        │        │        │        │        │
│ └────┘ │        │        │        │        │        │        │        │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

### Tab: Podsumowanie

```
┌──────────────┬────────────────────────────────┬─────────┐
│ ID           │ Tytuł                          │ Wycena  │
├──────────────┼────────────────────────────────┼─────────┤
│ TASK-001     │ Implementacja logowania        │    3    │
│ TASK-002     │ Dashboard użytkownika          │    5    │
│ TASK-003     │ API integracja                 │    8    │
│ TASK-004     │ Jeszcze nie wycenione          │    ?    │
└──────────────┴────────────────────────────────┴─────────┘
```

### Karta w kubełku

```
┌─────────────────────────┐
│                TASK-123 │  ← ID, mała czcionka, prawy górny róg
│                         │
│   Tytuł zadania który   │  ← max 2 linie, line-clamp-2
│   może być długi...     │
│                         │
└─────────────────────────┘
```

### Modal: Dodaj zadanie

```
┌─────────────────────────────────────┐
│  Dodaj zadanie                  [X] │
├─────────────────────────────────────┤
│                                     │
│  ID zadania *                       │
│  ┌─────────────────────────────────┐│
│  │ TASK-123                        ││
│  └─────────────────────────────────┘│
│  ⚠ Zadanie o tym ID już istnieje   │
│                                     │
│  Tytuł *                            │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  Opis                               │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│             [ Anuluj ]  [ Dodaj ]   │
└─────────────────────────────────────┘
```

### Modal: Import CSV

```
┌─────────────────────────────────────┐
│  Importuj zadania z CSV         [X] │
├─────────────────────────────────────┤
│                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │                               │ │
│  │   Przeciągnij plik CSV tutaj  │ │
│  │   lub kliknij aby wybrać      │ │
│  │                               │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                     │
│  ────────────────────────────────   │
│  Wynik importu:                     │
│  ✓ Zaimportowano 12 kart            │
│  ✗ 2 błędy (brak tytułu w wierszu 5)│
│                                     │
│                         [ Zamknij ] │
└─────────────────────────────────────┘
```

### Modal: Estymacja AI

```
┌─────────────────────────────────────┐
│  Estymacja przez AI             [X] │
├─────────────────────────────────────┤
│                                     │
│  Model AI                           │
│  ┌─────────────────────────────────┐│
│  │ GPT-4o-mini              ▼     ││
│  └─────────────────────────────────┘│
│                                     │
│  Kontekst projektu (opcjonalnie)    │
│  ┌─────────────────────────────────┐│
│  │ Opisz projekt, technologie,    ││
│  │ specyfikę zespołu...           ││
│  └─────────────────────────────────┘│
│                                     │
│  ⚠ Ta operacja nadpisze obecne     │
│    wyceny wszystkich kart.          │
│                                     │
│            [ Anuluj ]  [ Uruchom ]  │
└─────────────────────────────────────┘
```

### Modal: Szczegóły karty

```
┌─────────────────────────────────────┐
│  TASK-123                       [X] │
├─────────────────────────────────────┤
│                                     │
│  Pełny tytuł zadania                │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Opis zadania...                 ││
│  │ (scrollowalny jeśli długi)      ││
│  └─────────────────────────────────┘│
│                                     │
│  Wycena: [5]                        │
│                                     │
│                         [ Zamknij ] │
└─────────────────────────────────────┘
```

---

## Struktura plików (propozycja)

```
src/
├── components/
│   ├── ui/                    # Shadcn/ui
│   ├── layout/
│   │   └── Topbar.tsx
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── sessions/
│   │   ├── SessionCard.tsx
│   │   ├── SessionList.tsx
│   │   ├── CreateSessionButton.tsx
│   │   └── EmptySessionsState.tsx
│   ├── estimation/
│   │   ├── EstimationBoard.tsx
│   │   ├── Bucket.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskDetailModal.tsx
│   │   └── EmptyBoardState.tsx
│   ├── summary/
│   │   └── SummaryTable.tsx
│   ├── modals/
│   │   ├── AddTaskModal.tsx
│   │   ├── ImportCsvModal.tsx
│   │   └── AiEstimationModal.tsx
│   └── hooks/
│       ├── useSession.ts
│       ├── useCards.ts
│       └── useDragAndDrop.ts
├── contexts/
│   └── SessionContext.tsx
├── pages/
│   ├── index.astro
│   ├── login.astro
│   ├── sessions/
│   │   ├── index.astro
│   │   └── [id].astro
│   └── api/
│       └── ...
└── layouts/
    └── Layout.astro
```
