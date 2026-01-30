# Plan implementacji widoku Sesji Estymacji

## 1. Przegląd

Widok sesji estymacji jest głównym interfejsem aplikacji BucketEstimate AI, umożliwiającym zespołom Scrumowym szybką estymację zadań metodą Bucket System. Widok obsługuje do 50 zadań, oferuje interfejs drag-and-drop do organizacji kart w 8 kubełkach (wartości Fibonacciego: 1, 2, 3, 5, 8, 13, 21 oraz ? dla nieoszacowanych), oraz wykorzystuje AI do automatycznej estymacji. Użytkownik może ręcznie dodawać zadania, importować je z CSV, przeciągać między kubełkami oraz przeglądać podsumowanie estymacji w formie tabelarycznej.

## 2. Routing widoku

**Ścieżka:** `/sessions/[id]`

**Implementacja:**

- Plik Astro: `src/pages/sessions/[id].astro`
- Dynamiczny routing z parametrem `id` (UUID sesji)
- Server-side sprawdzenie autentykacji użytkownika
- Weryfikacja dostępu do sesji (czy należy do zalogowanego użytkownika)
- Wstępne załadowanie danych sesji i kart do przekazania do komponentu klienckiego

## 3. Struktura komponentów

### Hierarchia komponentów:

```
SessionView (Astro page)
└── SessionClient (React, główny kontener)
    ├── SessionHeader (React)
    │   └── Button[] (Dodaj zadanie, Importuj CSV, Estymuj przez AI)
    ├── SessionTabs (React, Shadcn/ui Tabs)
    │   ├── TabsList
    │   │   ├── TabsTrigger "Estymacja"
    │   │   └── TabsTrigger "Podsumowanie"
    │   ├── TabsContent value="estimation"
    │   │   ├── EstimationBoard (React, DndContext)
    │   │   │   └── Bucket[] (8 sztuk - dla wartości 1,2,3,5,8,13,21,?)
    │   │   │       └── TaskCard[] (Draggable)
    │   │   └── EmptyBoardState (conditionally, gdy brak kart)
    │   └── TabsContent value="summary"
    │       └── SummaryTable (React)
    ├── AddTaskModal (Dialog)
    │   └── Form (external_id, title, description)
    ├── ImportCsvModal (Dialog)
    │   ├── DropZone
    │   └── ImportResults
    ├── AiEstimationModal (Dialog)
    │   └── Form (confirm_override, context)
    └── TaskDetailModal (Dialog)
        ├── CardDetails
        └── AlertDialog (potwierdzenie usunięcia)
```

## 4. Szczegóły komponentów

### 4.1 SessionView (Astro Page)

**Opis:** Główna strona Astro służąca jako entry point dla widoku sesji. Obsługuje server-side rendering, autentykację i początkowe załadowanie danych.

**Główne elementy:**

- Server-side sprawdzenie autentykacji (`Astro.locals.supabase.auth.getUser()`)
- Pobranie danych sesji z API (`GET /api/sessions/:id`)
- Pobranie listy kart z API (`GET /api/sessions/:id/cards`)
- Przekazanie danych do `SessionClient` jako props
- Obsługa błędów 401 (redirect do logowania) i 404 (redirect do `/sessions`)

**Obsługiwane zdarzenia:**

- Brak (server-side only)

**Warunki walidacji:**

- Użytkownik musi być zalogowany
- Sesja musi istnieć
- Sesja musi należeć do zalogowanego użytkownika (sprawdzane przez RLS)

**Typy:**

- `SessionDTO` - dane sesji
- `CardDTO[]` - lista kart

**Props:** Brak (Astro page)

---

### 4.2 SessionClient (React)

**Opis:** Główny komponent kliencki zarządzający stanem widoku sesji, modal'ami i komunikacją z API. Orkiestruje wszystkie interakcje użytkownika.

**Główne elementy:**

- `SessionHeader` - nagłówek z akcjami
- `SessionTabs` - zakładki Estymacja/Podsumowanie
- `EstimationBoard` lub `SummaryTable` (zależnie od aktywnej zakładki)
- `EmptyBoardState` - gdy brak kart
- Wszystkie modale: `AddTaskModal`, `ImportCsvModal`, `AiEstimationModal`, `TaskDetailModal`
- Toast notifications (Shadcn/ui Toaster)

**Obsługiwane zdarzenia:**

- `onAddTask` - otwarcie modala dodawania zadania
- `onImportCsv` - otwarcie modala importu CSV
- `onAiEstimate` - otwarcie modala AI estymacji
- `onCardClick` - otwarcie szczegółów karty
- `onCardsUpdate` - aktualizacja kart po drag-and-drop
- `onCardDelete` - usunięcie karty
- `onTabChange` - zmiana zakładki

**Warunki walidacji:**

- Limit 50 kart w sesji (sprawdzany przed dodaniem/importem)
- Sesja musi być aktywna (is_active === true)

**Typy:**

- `CardDTO[]` - lista kart
- `TabValue` - "estimation" | "summary"
- `ModalState` - stan otwarcia modali

**Props:**

```typescript
interface SessionClientProps {
  sessionId: string;
  initialCards: CardDTO[];
  sessionData: SessionDTO;
}
```

---

### 4.3 SessionHeader (React)

**Opis:** Nagłówek widoku sesji zawierający przycisk powrotu do listy sesji oraz akcje (Dodaj zadanie, Importuj CSV, Estymuj przez AI).

**Główne elementy:**

- `Button` - powrót do `/sessions` (variant="ghost", icon: ArrowLeft)
- `div` - kontener na akcje (flex gap)
- `Button` - "Dodaj zadanie" (variant="default", icon: Plus)
- `Button` - "Importuj CSV" (variant="outline", icon: Upload)
- `Button` - "Estymuj przez AI" (variant="secondary", icon: Sparkles)

**Obsługiwane zdarzenia:**

- `onClick` na przycisku powrotu - nawigacja do `/sessions`
- `onClick` na "Dodaj zadanie" - wywołanie `onAddTask`
- `onClick` na "Importuj CSV" - wywołanie `onImportCsv`
- `onClick` na "Estymuj przez AI" - wywołanie `onAiEstimate`

**Warunki walidacji:**

- Przycisk "Estymuj przez AI" wyłączony gdy `cards.length === 0`

**Typy:**

- Brak specjalnych

**Props:**

```typescript
interface SessionHeaderProps {
  sessionId: string;
  cardsCount: number;
  onAddTask: () => void;
  onImportCsv: () => void;
  onAiEstimate: () => void;
}
```

---

### 4.4 SessionTabs (React, Shadcn/ui Tabs)

**Opis:** Komponent zakładek przełączający widok między estymacją a podsumowaniem.

**Główne elementy:**

- `Tabs` (Shadcn/ui) - root component
- `TabsList` - kontener na triggery
- `TabsTrigger` value="estimation" - "Estymacja"
- `TabsTrigger` value="summary" - "Podsumowanie"
- `TabsContent` value="estimation" - zawiera EstimationBoard
- `TabsContent` value="summary" - zawiera SummaryTable

**Obsługiwane zdarzenia:**

- `onValueChange` - zmiana aktywnej zakładki

**Warunki walidacji:**

- Brak

**Typy:**

- `TabValue` = "estimation" | "summary"

**Props:**

```typescript
interface SessionTabsProps {
  value: TabValue;
  onValueChange: (value: TabValue) => void;
  cards: CardDTO[];
  sessionId: string;
  onCardClick: (card: CardDTO) => void;
  onCardsUpdate: (updates: CardBatchUpdateItem[]) => void;
}
```

---

### 4.5 EstimationBoard (React, dnd-kit)

**Opis:** Główny kontener dla kubełków estymacji z obsługą drag-and-drop używając biblioteki dnd-kit. Zarządza stanem przeciągania i komunikacją z API przy zmianie pozycji kart.

**Główne elementy:**

- `DndContext` - context dla drag-and-drop (sensors: pointer, keyboard, touch)
- `div` - scrollable container (horizontal scroll)
- `Bucket[]` - 8 kubełków dla wartości: null, 1, 2, 3, 5, 8, 13, 21

**Obsługiwane zdarzenia:**

- `onDragStart` - rozpoczęcie przeciągania (visual feedback)
- `onDragEnd` - zakończenie przeciągania (aktualizacja stanu, API call)
- `onDragCancel` - anulowanie przeciągania

**Warunki walidacji:**

- Sprawdzenie czy karta należy do sesji
- Sprawdzenie czy docelowy bucket jest prawidłowy
- Batch update do API tylko gdy pozycja się zmieniła

**Typy:**

- `CardsByBucket` - mapa kart pogrupowanych po bucket_value
- `DragEndEvent` - event z dnd-kit

**Props:**

```typescript
interface EstimationBoardProps {
  cards: CardDTO[];
  sessionId: string;
  onCardsUpdate: (updates: CardBatchUpdateItem[]) => void;
  onCardClick: (card: CardDTO) => void;
}
```

---

### 4.6 Bucket (React, dnd-kit Droppable)

**Opis:** Pojedynczy kubełek reprezentujący wartość estymacji. Obsługuje drop zone dla kart oraz wyświetla nagłówek z wartością i liczbą kart.

**Główne elementy:**

- `useDroppable` hook z dnd-kit
- `div` - kontener kubełka (sticky header, gradient background)
- `div` - header (value label, cards count badge)
- `div` - cards container (scrollable)
- `TaskCard[]` - lista kart w kubełku

**Obsługiwane zdarzenia:**

- Drop event (obsługiwane przez DndContext w EstimationBoard)

**Warunki walidacji:**

- Brak (walidacja w EstimationBoard)

**Typy:**

- `BucketConfig` - konfiguracja kubełka (value, label, color)

**Props:**

```typescript
interface BucketProps {
  config: BucketConfig;
  cards: CardDTO[];
  onCardClick: (card: CardDTO) => void;
  isOver: boolean; // z dnd-kit
}

interface BucketConfig {
  value: BucketValue;
  label: string;
  colorClass: string; // Tailwind classes dla gradientu
}
```

**Kolory gradientu (Tailwind):**

- 1: `bg-green-50 border-green-200` (zielony)
- 2: `bg-green-100 border-green-300`
- 3: `bg-yellow-50 border-yellow-200` (żółty)
- 5: `bg-yellow-100 border-yellow-300`
- 8: `bg-orange-50 border-orange-200`
- 13: `bg-orange-100 border-orange-300` (pomarańczowy)
- 21: `bg-red-50 border-red-200` (czerwony)
- ?: `bg-gray-50 border-dashed border-gray-300` (szary, przerywana obwódka)

---

### 4.7 TaskCard (React, dnd-kit Draggable)

**Opis:** Pojedyncza karta zadania w kubełku. Draggable element z wizualnym feedbackiem przy przeciąganiu.

**Główne elementy:**

- `useDraggable` hook z dnd-kit
- `Card` (Shadcn/ui)
- `div` - external_id (badge, small text)
- `p` - title (line-clamp-2, truncate)
- `Tooltip` (Shadcn/ui) - pełny tytuł na hover

**Obsługiwane zdarzenia:**

- `onClick` - otwarcie TaskDetailModal
- Drag events (obsługiwane przez dnd-kit)

**Warunki walidacji:**

- Brak

**Typy:**

- `CardDTO`

**Props:**

```typescript
interface TaskCardProps {
  card: CardDTO;
  onClick: (card: CardDTO) => void;
  isDragging: boolean; // z dnd-kit
}
```

**Style podczas drag:**

- `opacity-50` - gdy isDragging
- `shadow-lg scale-105` - visual feedback

---

### 4.8 SummaryTable (React, Shadcn/ui Table)

**Opis:** Tabelaryczne podsumowanie estymacji wszystkich kart. Widok read-only.

**Główne elementy:**

- `Table` (Shadcn/ui)
- `TableHeader` - nagłówki kolumn (ID, Tytuł, Wycena)
- `TableBody`
- `TableRow[]` - wiersz dla każdej karty
- `TableCell` - external_id
- `TableCell` - title
- `TableCell` - bucket_value (badge z kolorem)

**Obsługiwane zdarzenia:**

- Brak (read-only)

**Warunki walidacji:**

- Brak

**Typy:**

- `CardDTO[]`

**Props:**

```typescript
interface SummaryTableProps {
  cards: CardDTO[];
}
```

**Sortowanie:** Domyślnie według bucket_value (ASC), potem według external_id

---

### 4.9 EmptyBoardState (React)

**Opis:** Stan pustej sesji wyświetlany gdy brak kart. Zawiera CTA do dodania zadania lub importu CSV.

**Główne elementy:**

- `div` - kontener (centered, flex column)
- `Icon` - ilustracja (Inbox lub podobna)
- `h3` - "Brak zadań w sesji"
- `p` - opis "Dodaj pierwsze zadanie lub zaimportuj z CSV"
- `div` - buttons container
- `Button` - "Dodaj zadanie" (primary)
- `Button` - "Importuj CSV" (secondary)

**Obsługiwane zdarzenia:**

- `onClick` na "Dodaj zadanie" - wywołanie `onAddTask`
- `onClick` na "Importuj CSV" - wywołanie `onImportCsv`

**Warunki walidacji:**

- Wyświetlany tylko gdy `cards.length === 0`

**Typy:**

- Brak

**Props:**

```typescript
interface EmptyBoardStateProps {
  onAddTask: () => void;
  onImportCsv: () => void;
}
```

---

### 4.10 AddTaskModal (React, Shadcn/ui Dialog)

**Opis:** Modal z formularzem do ręcznego dodania pojedynczego zadania.

**Główne elementy:**

- `Dialog` (Shadcn/ui) - root
- `DialogContent` - modal content
- `DialogHeader` - "Dodaj zadanie"
- `Form` - formularz z react-hook-form + zod
- `FormField` - external_id (Input, required)
- `FormField` - title (Input, required)
- `FormField` - description (Textarea, optional)
- `DialogFooter`
- `Button` - "Anuluj" (variant="outline")
- `Button` - "Dodaj zadanie" (type="submit", disabled gdy invalid)

**Obsługiwane zdarzenia:**

- `onSubmit` - walidacja i wywołanie API POST /cards
- `onOpenChange` - zamknięcie modala (Escape lub klik poza)

**Warunki walidacji:**

- `external_id`: required, min 1 znak
- `title`: required, min 1 znak
- `description`: optional
- Frontend sprawdzenie: czy sesja ma < 50 kart (przed otwarciem modala)

**Typy:**

- `CardCreateCommand` - request body
- `CardResponseDTO` - response

**Props:**

```typescript
interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CardCreateCommand) => Promise<void>;
  sessionId: string;
  currentCardsCount: number;
}
```

**Obsługa błędów:**

- 409 Conflict (duplicate external_id) - error message przy polu external_id
- 422 Unprocessable Entity (limit) - toast error, close modal
- 400 Bad Request - toast z opisem błędu

---

### 4.11 ImportCsvModal (React, Shadcn/ui Dialog)

**Opis:** Modal do importu zadań z pliku CSV. Zawiera drag-drop zone i wyświetla wyniki importu.

**Główne elementy:**

- `Dialog` (Shadcn/ui)
- `DialogContent`
- `DialogHeader` - "Importuj zadania z CSV"
- `div` - instrukcje (format CSV: id, title, description)
- `DropZone` - drag-drop area dla pliku
- `Input` type="file" (hidden, trigger przez DropZone)
- `div` - preview CSV (tabela z parsed data)
- `div` - import results (po submit)
  - Success count
  - Failed count
  - Lista błędów (jeśli są)
- `DialogFooter`
- `Button` - "Anuluj"
- `Button` - "Importuj" (disabled gdy brak pliku, loading podczas importu)

**Obsługiwane zdarzenia:**

- `onDrop` - parsowanie pliku CSV
- `onSubmit` - wywołanie API POST /cards/import
- `onOpenChange` - zamknięcie modala

**Warunki walidacji:**

- Format CSV: musi mieć kolumny id, title (description opcjonalne)
- Max 50 kart total w sesji (frontend check)
- Parsowanie CSV: sprawdzenie czy każdy wiersz ma wymagane pola

**Typy:**

- `CardImportCommand` - request body (csv_content jako string)
- `CardImportResultDTO` - response

**Props:**

```typescript
interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CardImportCommand) => Promise<void>;
  sessionId: string;
  currentCardsCount: number;
}
```

**Obsługa błędów:**

- 400 Bad Request (invalid CSV) - toast error z opisem
- 422 Unprocessable Entity (limit) - toast error
- Wyświetlenie listy failed rows z opisem błędów

---

### 4.12 AiEstimationModal (React, Shadcn/ui Dialog)

**Opis:** Modal do uruchomienia automatycznej estymacji przez AI. Zawiera ostrzeżenie o nadpisaniu obecnego układu.

**Główne elementy:**

- `Dialog` (Shadcn/ui)
- `DialogContent`
- `DialogHeader` - "Automatyczna estymacja przez AI"
- `Alert` (Shadcn/ui, variant="warning") - ostrzeżenie o nadpisaniu
- `Form`
- `FormField` - context (Textarea, optional) - kontekst projektu dla AI
- `FormField` - confirm_override (Checkbox, required)
  - Label: "Potwierdzam nadpisanie obecnego układu kart"
- `div` - informacja o liczbie kart do estymacji
- `DialogFooter`
- `Button` - "Anuluj"
- `Button` - "Estymuj" (disabled gdy !confirm_override, loading podczas estymacji)

**Obsługiwane zdarzenia:**

- `onSubmit` - walidacja i wywołanie API POST /ai/estimate
- `onOpenChange` - zamknięcie modala

**Warunki walidacji:**

- `confirm_override`: required (checkbox must be checked)
- Sesja musi mieć karty (sprawdzane przed otwarciem modala)

**Typy:**

- `AIEstimateCommand` - request body
- `AIEstimateResultDTO` - response

**Props:**

```typescript
interface AiEstimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AIEstimateCommand) => Promise<void>;
  sessionId: string;
  cardsCount: number;
}
```

**Obsługa błędów:**

- 400 Bad Request (no cards) - nie powinno się zdarzyć (walidacja przed otwarciem)
- 503 Service Unavailable - toast error, możliwość retry
- 429 Too Many Requests - toast error z informacją o limicie

---

### 4.13 TaskDetailModal (React, Shadcn/ui Dialog)

**Opis:** Modal ze szczegółami zadania. Wyświetla pełny opis oraz umożliwia usunięcie zadania.

**Główne elementy:**

- `Dialog` (Shadcn/ui)
- `DialogContent`
- `DialogHeader` - title z external_id badge
- `div` - card details
  - `Badge` - external_id
  - `h2` - title (full text)
  - `Badge` - bucket_value (z kolorem)
  - `p` - description (full text) lub "Brak opisu"
  - `div` - metadata (created_at, updated_at)
- `DialogFooter`
- `Button` - "Zamknij"
- `AlertDialog` (Shadcn/ui) - potwierdzenie usunięcia
  - Trigger: `Button` "Usuń zadanie" (variant="destructive")
  - `AlertDialogContent`
  - `AlertDialogHeader` - "Czy na pewno chcesz usunąć to zadanie?"
  - `AlertDialogDescription` - ostrzeżenie o nieodwracalności
  - `AlertDialogFooter`
  - `AlertDialogCancel` - "Anuluj"
  - `AlertDialogAction` - "Usuń" (variant="destructive")

**Obsługiwane zdarzenia:**

- `onOpenChange` - zamknięcie modala
- `onClick` na "Usuń zadanie" - otwarcie AlertDialog
- `onClick` na AlertDialogAction - wywołanie API DELETE /cards/:id (optimistic)

**Warunki walidacji:**

- Karta musi istnieć
- Karta musi należeć do sesji

**Typy:**

- `CardDTO`

**Props:**

```typescript
interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardDTO | null;
  onDelete: (cardId: string) => Promise<void>;
  sessionId: string;
}
```

**Obsługa błędów:**

- 404 Not Found - toast error, close modal
- 500 Internal Server Error - toast error

**Optimistic UI:**

- Natychmiastowe usunięcie karty z UI po kliknięciu "Usuń"
- Toast success
- Jeśli błąd API - toast error (karta pozostaje usunięta, user musi ręcznie odświeżyć)

---

## 5. Typy

### 5.1 Typy DTO (z `src/types.ts` - istniejące)

```typescript
// Podstawowe entity
export type CardDTO = {
  id: string;
  session_id: string;
  external_id: string;
  title: string;
  description: string | null;
  bucket_value: BucketValue;
  has_embedding: boolean;
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
};

export type BucketValue = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | null;

export type SessionDTO = {
  id: string;
  user_id: string;
  is_active: boolean;
  context: string | null;
  created_at: string;
  updated_at: string;
};

// Command models
export interface CardCreateCommand {
  external_id: string;
  title: string;
  description?: string | null;
}

export interface CardUpdateCommand {
  title?: string;
  description?: string | null;
  bucket_value?: BucketValue;
}

export interface CardBatchUpdateItem {
  id: string;
  bucket_value: BucketValue;
}

export interface CardBatchUpdateCommand {
  cards: CardBatchUpdateItem[];
}

export interface CardImportCommand {
  csv_content: string;
}

export interface AIEstimateCommand {
  confirm_override: boolean;
}

// Response DTOs
export interface CardsListResponseDTO {
  data: CardDTO[];
}

export interface CardResponseDTO {
  data: CardDTO;
}

export interface CardBatchUpdateResponseDTO {
  data: {
    updated: number;
    cards: CardBatchUpdateItem[];
  };
}

export interface CardImportResultDTO {
  data: {
    imported: number;
    failed: number;
    errors: CardImportError[];
    cards: ImportedCardSummary[];
  };
}

export interface CardImportError {
  row: number;
  external_id: string;
  error: string;
}

export interface ImportedCardSummary {
  id: string;
  external_id: string;
  title: string;
}

export interface AIEstimateResultDTO {
  data: {
    estimated_cards: number;
    cards: EstimatedCardDTO[];
  };
}

export interface EstimatedCardDTO {
  id: string;
  external_id: string;
  title: string;
  bucket_value: BucketValue;
  ai_confidence: number;
}
```

### 5.2 Typy ViewModel (nowe, do dodania w komponencie lub osobnym pliku)

```typescript
// Tab state
export type TabValue = "estimation" | "summary";

// Bucket configuration
export interface BucketConfig {
  value: BucketValue;
  label: string;
  colorClass: string; // Tailwind classes
}

// Mapa kart pogrupowanych po bucket_value
export type CardsByBucket = {
  [key: string]: CardDTO[]; // key = bucket_value as string (np. "5", "null")
};

// Stan modali
export interface ModalState {
  addTask: boolean;
  importCsv: boolean;
  aiEstimate: boolean;
  taskDetail: boolean;
  selectedCard: CardDTO | null;
}

// DnD types (z dnd-kit)
export interface DragEndEvent {
  active: {
    id: string; // card id
  };
  over: {
    id: string; // bucket value as string
  } | null;
}

// CSV parsed row
export interface CsvRow {
  id: string;
  title: string;
  description?: string;
}

// Form data types (z react-hook-form)
export interface AddTaskFormData {
  external_id: string;
  title: string;
  description: string;
}

export interface AiEstimateFormData {
  context: string;
  confirm_override: boolean;
}
```

### 5.3 Konfiguracja kubełków

```typescript
export const BUCKET_CONFIGS: BucketConfig[] = [
  {
    value: null,
    label: "?",
    colorClass: "bg-gray-50 border-2 border-dashed border-gray-300",
  },
  {
    value: 1,
    label: "1",
    colorClass: "bg-green-50 border-green-200",
  },
  {
    value: 2,
    label: "2",
    colorClass: "bg-green-100 border-green-300",
  },
  {
    value: 3,
    label: "3",
    colorClass: "bg-yellow-50 border-yellow-200",
  },
  {
    value: 5,
    label: "5",
    colorClass: "bg-yellow-100 border-yellow-300",
  },
  {
    value: 8,
    label: "8",
    colorClass: "bg-orange-50 border-orange-200",
  },
  {
    value: 13,
    label: "13",
    colorClass: "bg-orange-100 border-orange-300",
  },
  {
    value: 21,
    label: "21",
    colorClass: "bg-red-50 border-red-200",
  },
];
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: `useSessionCards`

**Cel:** Centralizacja zarządzania stanem kart sesji oraz komunikacja z API.

**Stan:**

```typescript
interface UseSessionCardsState {
  cards: CardDTO[];
  loading: boolean;
  error: Error | null;
}
```

**Funkcje:**

```typescript
interface UseSessionCardsReturn {
  cards: CardDTO[];
  loading: boolean;
  error: Error | null;

  // CRUD operations
  fetchCards: () => Promise<void>;
  addCard: (data: CardCreateCommand) => Promise<CardDTO>;
  updateCard: (id: string, data: CardUpdateCommand) => Promise<CardDTO>;
  deleteCard: (id: string) => Promise<void>;
  batchUpdateCards: (updates: CardBatchUpdateItem[]) => Promise<void>;

  // Import & AI
  importCards: (data: CardImportCommand) => Promise<CardImportResultDTO>;
  runAiEstimation: (data: AIEstimateCommand) => Promise<AIEstimateResultDTO>;
}
```

**Implementacja:**

- Używa `useState` dla cards, loading, error
- Wszystkie funkcje API używają `fetch` z odpowiednimi headers
- Obsługa błędów: try-catch, ustawienie error state, toast notification
- Optimistic updates dla deleteCard (usunięcie ze state przed API call)
- Refresh cards po successful addCard, importCards, runAiEstimation

---

### 6.2 Custom Hook: `useModals`

**Cel:** Zarządzanie stanem otwarcia modali.

**Stan:**

```typescript
interface UseModalsState {
  addTask: boolean;
  importCsv: boolean;
  aiEstimate: boolean;
  taskDetail: boolean;
  selectedCard: CardDTO | null;
}
```

**Funkcje:**

```typescript
interface UseModalsReturn {
  modals: UseModalsState;
  openAddTask: () => void;
  closeAddTask: () => void;
  openImportCsv: () => void;
  closeImportCsv: () => void;
  openAiEstimate: () => void;
  closeAiEstimate: () => void;
  openTaskDetail: (card: CardDTO) => void;
  closeTaskDetail: () => void;
}
```

---

### 6.3 Local State w SessionClient

**Wykorzystanie:**

```typescript
const SessionClient: React.FC<SessionClientProps> = ({ sessionId, initialCards, sessionData }) => {
  const { cards, loading, error, ...cardActions } = useSessionCards(sessionId, initialCards);
  const { modals, ...modalActions } = useModals();
  const [activeTab, setActiveTab] = useState<TabValue>("estimation");

  // ... rest of component
};
```

---

### 6.4 Drag-and-Drop State (w EstimationBoard)

**Wykorzystanie dnd-kit:**

```typescript
const EstimationBoard: React.FC<EstimationBoardProps> = ({ cards, sessionId, onCardsUpdate, onCardClick }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor), useSensor(TouchSensor));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const cardId = active.id as string;
    const newBucketValue = over.id as BucketValue;

    // Update local state + API call
    onCardsUpdate([{ id: cardId, bucket_value: newBucketValue }]);
  };

  // ... rest
};
```

## 7. Integracja API

### 7.1 Initial Load (w SessionView Astro)

**Endpoint:** `GET /api/sessions/:id/cards`

**Request:**

```typescript
// Server-side fetch
const response = await fetch(`${Astro.url.origin}/api/sessions/${id}/cards`, {
  headers: {
    Authorization: `Bearer ${supabaseToken}`,
  },
});
```

**Response:** `CardsListResponseDTO`

```typescript
{
  data: CardDTO[]
}
```

**Obsługa błędów:**

- 401 → redirect do `/login`
- 404 → redirect do `/sessions` z toast "Sesja nie znaleziona"

---

### 7.2 Add Card

**Endpoint:** `POST /api/sessions/:sessionId/cards`

**Request:** `CardCreateCommand`

```typescript
{
  external_id: string;
  title: string;
  description?: string | null;
}
```

**Response:** `CardResponseDTO`

```typescript
{
  data: CardDTO;
}
```

**Obsługa błędów:**

- 400 → toast z opisem błędu
- 409 → error message przy polu external_id "Zadanie o tym ID już istnieje"
- 422 → toast "Przekroczono limit 50 zadań"

---

### 7.3 Import CSV

**Endpoint:** `POST /api/sessions/:sessionId/cards/import`

**Request:** `CardImportCommand`

```typescript
{
  csv_content: string; // CSV as string
}
```

**Response:** `CardImportResultDTO`

```typescript
{
  data: {
    imported: number;
    failed: number;
    errors: CardImportError[];
    cards: ImportedCardSummary[];
  }
}
```

**Obsługa błędów:**

- 400 → toast "Nieprawidłowy format CSV"
- 422 → toast "Import przekroczyłby limit 50 zadań"
- Wyświetlenie listy failed rows w modalu

---

### 7.4 Batch Update (Drag-and-Drop)

**Endpoint:** `PATCH /api/sessions/:sessionId/cards`

**Request:** `CardBatchUpdateCommand`

```typescript
{
  cards: [{ id: string, bucket_value: BucketValue }];
}
```

**Response:** `CardBatchUpdateResponseDTO`

```typescript
{
  data: {
    updated: number;
    cards: CardBatchUpdateItem[];
  }
}
```

**Obsługa błędów:**

- 400 → toast "Błąd podczas zapisywania" (brak rollback)
- 404 → toast "Zadanie nie znalezione", refresh cards

---

### 7.5 Delete Card

**Endpoint:** `DELETE /api/sessions/:sessionId/cards/:id`

**Request:** Brak body

**Response:** `204 No Content`

**Obsługa błędów:**

- 404 → toast "Zadanie nie znalezione"
- 500 → toast "Błąd podczas usuwania"

**Optimistic UI:**

- Natychmiastowe usunięcie ze state
- Toast success
- Jeśli error → toast error (karta pozostaje usunięta)

---

### 7.6 AI Estimation

**Endpoint:** `POST /api/sessions/:sessionId/ai/estimate`

**Request:** `AIEstimateCommand`

```typescript
{
  confirm_override: boolean;
}
```

**Response:** `AIEstimateResultDTO`

```typescript
{
  data: {
    estimated_cards: number;
    cards: EstimatedCardDTO[];
  }
}
```

**Obsługa błędów:**

- 400 → toast "Brak zadań do estymacji"
- 503 → toast "Usługa AI niedostępna, spróbuj ponownie"
- 429 → toast "Przekroczono limit zapytań, spróbuj za chwilę"

---

## 8. Interakcje użytkownika

### 8.1 Dodawanie zadania

**Przepływ:**

1. Klik "Dodaj zadanie" → `openAddTask()`
2. Otwarcie `AddTaskModal`
3. Wypełnienie formularza (external_id*, title*, description)
4. Walidacja: external_id min 1, title min 1
5. Submit → wywołanie `addCard(data)`
6. Loading state na przycisku "Dodaj zadanie"
7. **Sukces:**
   - Close modal
   - Toast "Zadanie dodane pomyślnie"
   - Refresh cards (nowa karta pojawia się w kubełku "?")
8. **Błąd:**
   - 409 → error message przy external_id
   - 422 → toast error, close modal
   - Inne → toast error, keep modal open

---

### 8.2 Import CSV

**Przepływ:**

1. Klik "Importuj CSV" → `openImportCsv()`
2. Otwarcie `ImportCsvModal`
3. Drag-and-drop pliku CSV lub klik na drop zone
4. Parsowanie CSV → preview w tabeli
5. Walidacja: format CSV (id, title, description)
6. Submit → wywołanie `importCards(data)`
7. Loading state
8. **Sukces:**
   - Wyświetlenie wyników importu:
     - "Zaimportowano: X zadań"
     - "Niepowodzenia: Y zadań"
     - Lista błędów (jeśli są)
   - Przycisk "Zamknij" → close modal, refresh cards
9. **Błąd:**
   - 400/422 → toast error
   - Lista failed rows w modalu

---

### 8.3 Drag-and-Drop karty

**Przepływ:**

1. Użytkownik zaczyna przeciągać kartę (`onDragStart`)
2. Visual feedback:
   - Karta: `opacity-50`
   - Bucket hover: highlight border
3. Użytkownik upuszcza kartę na bucket (`onDragEnd`)
4. **Optimistic update:**
   - Natychmiastowa zmiana bucket_value w local state
   - Karta przesuwa się do nowego kubełka
5. API call: `batchUpdateCards([{ id, bucket_value }])`
6. **Sukces:**
   - Toast "Zapisano" (opcjonalnie, może być wyłączone dla lepszego UX)
7. **Błąd:**
   - Toast "Błąd podczas zapisywania"
   - Brak rollback (karta pozostaje w nowym kubełku)

**Keyboard navigation:**

- Tab → focus na karcie
- Space → start drag
- Arrow keys → move between buckets
- Space → drop
- Escape → cancel

---

### 8.4 AI Estymacja

**Przepływ:**

1. Klik "Estymuj przez AI" → sprawdzenie `cards.length > 0`
2. Jeśli brak kart → toast "Brak zadań do estymacji", return
3. Otwarcie `AiEstimationModal`
4. Wyświetlenie ostrzeżenia o nadpisaniu obecnego układu
5. Opcjonalnie: wypełnienie kontekstu projektu
6. **Wymagane:** Zaznaczenie checkbox "Potwierdzam nadpisanie"
7. Submit → wywołanie `runAiEstimation({ confirm_override: true })`
8. Loading state (modal blokujący, spinner)
9. **Sukces:**
   - Close modal
   - Toast "Estymacja zakończona: X zadań oszacowanych"
   - Refresh cards (karty przesunięte do nowych kubełków)
10. **Błąd:**
    - 503 → toast error + przycisk "Spróbuj ponownie"
    - 429 → toast "Limit zapytań, spróbuj za chwilę"

---

### 8.5 Szczegóły zadania

**Przepływ:**

1. Klik na kartę → `openTaskDetail(card)`
2. Otwarcie `TaskDetailModal`
3. Wyświetlenie szczegółów:
   - Badge z external_id
   - Tytuł (pełny tekst)
   - Badge z bucket_value (z kolorem)
   - Opis (pełny tekst) lub "Brak opisu"
   - Metadata: created_at, updated_at
4. Klik "Usuń zadanie" → otwarcie `AlertDialog`
5. AlertDialog:
   - Tytuł: "Czy na pewno chcesz usunąć to zadanie?"
   - Opis: "Ta operacja jest nieodwracalna."
   - Przyciski: "Anuluj", "Usuń"
6. Klik "Usuń" → wywołanie `deleteCard(card.id)`
7. **Optimistic UI:**
   - Natychmiastowe zamknięcie modali
   - Usunięcie karty z UI
   - Toast "Zadanie usunięte"
8. API call: `DELETE /cards/:id`
9. **Błąd:**
   - Toast error (karta pozostaje usunięta)

---

### 8.6 Zmiana zakładki

**Przepływ:**

1. Klik "Podsumowanie" → `setActiveTab("summary")`
2. TabsContent zmienia się z EstimationBoard na SummaryTable
3. SummaryTable wyświetla tabelę:
   - Kolumny: ID, Tytuł, Wycena
   - Sortowanie: bucket_value ASC, external_id ASC
   - Badge z kolorem dla bucket_value

---

## 9. Warunki i walidacja

### 9.1 Walidacja frontend (przed wysłaniem do API)

**AddTaskModal:**

- `external_id`:
  - Required
  - Min length: 1
  - Error message: "ID zadania jest wymagane"
- `title`:
  - Required
  - Min length: 1
  - Error message: "Tytuł jest wymagany"
- `description`:
  - Optional
- **Dodatkowa walidacja:**
  - Sprawdzenie `currentCardsCount < 50` przed otwarciem modala
  - Jeśli >= 50 → toast "Osiągnięto limit 50 zadań", nie otwieraj modala

**ImportCsvModal:**

- Format CSV:
  - Musi mieć header: `id,title,description` (lub `id,title`)
  - Każdy wiersz musi mieć wypełnione `id` i `title`
  - Error: wyświetlenie w preview tabeli, wiersz oznaczony czerwonym
- **Dodatkowa walidacja:**
  - `currentCardsCount + importedCount <= 50`
  - Jeśli przekracza → toast error, disable przycisk "Importuj"

**AiEstimationModal:**

- `confirm_override`:
  - Required (checkbox must be checked)
  - Disable przycisk "Estymuj" gdy unchecked
- **Dodatkowa walidacja:**
  - `cards.length > 0` przed otwarciem modala
  - Jeśli brak → toast "Brak zadań do estymacji"

**Drag-and-Drop:**

- Sprawdzenie czy `over.id` (target bucket) jest prawidłowym `BucketValue`
- Jeśli invalid → cancel drop, brak API call

---

### 9.2 Walidacja backend (API responses)

**POST /cards:**

- 400 Bad Request → missing required fields
  - Toast: "Wypełnij wszystkie wymagane pola"
- 409 Conflict → duplicate external_id
  - Error message przy polu external_id: "Zadanie o tym ID już istnieje w sesji"
- 422 Unprocessable Entity → limit exceeded
  - Toast: "Sesja osiągnęła maksymalny limit 50 zadań"

**POST /cards/import:**

- 400 Bad Request → invalid CSV format
  - Toast: "Nieprawidłowy format CSV. Sprawdź czy plik zawiera kolumny: id, title"
- 422 Unprocessable Entity → import would exceed limit
  - Toast: "Import przekroczyłby limit 50 zadań. Obecna liczba: X, próba importu: Y"

**PATCH /cards (batch):**

- 400 Bad Request → invalid bucket_value
  - Toast: "Błąd podczas zapisywania zmian"
- 404 Not Found → card not found
  - Toast: "Zadanie nie znalezione", refresh cards

**DELETE /cards/:id:**

- 404 Not Found → card not found
  - Toast: "Zadanie nie znalezione"
- 500 Internal Server Error
  - Toast: "Błąd podczas usuwania zadania"

**POST /ai/estimate:**

- 400 Bad Request → no cards or missing confirm_override
  - Toast: "Brak zadań do estymacji"
- 503 Service Unavailable → AI service down
  - Toast: "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie za chwilę."
  - Przycisk "Spróbuj ponownie" w toaście
- 429 Too Many Requests → rate limit
  - Toast: "Przekroczono limit zapytań do AI. Spróbuj ponownie za kilka minut."

---

### 9.3 Warunki UI

**SessionHeader:**

- Przycisk "Estymuj przez AI":
  - Disabled gdy `cards.length === 0`
  - Tooltip: "Brak zadań do estymacji"

**EstimationBoard vs EmptyBoardState:**

- Jeśli `cards.length === 0` → wyświetl `EmptyBoardState`
- Jeśli `cards.length > 0` → wyświetl `EstimationBoard`

**SummaryTable:**

- Jeśli `cards.length === 0` → wyświetl pusty stan: "Brak zadań w sesji"
- Sortowanie:
  - Primary: `bucket_value` ASC (null first)
  - Secondary: `external_id` ASC

**TaskCard tooltip:**

- Wyświetl tooltip z pełnym tytułem tylko gdy tytuł jest obcięty (line-clamp-2)
- Sprawdzenie: `element.scrollHeight > element.clientHeight`

---

## 10. Obsługa błędów

### 10.1 Błędy autentykacji (401)

**Scenariusz:** Token JWT wygasł lub jest nieprawidłowy

**Obsługa:**

- Server-side (w SessionView Astro):
  - Redirect do `/login` z query param `?redirect=/sessions/${id}`
- Client-side (w useSessionCards):
  - Jeśli response 401 → `window.location.href = "/login"`

---

### 10.2 Błędy autoryzacji (404 Session Not Found)

**Scenariusz:** Sesja nie istnieje lub nie należy do użytkownika

**Obsługa:**

- Server-side (w SessionView Astro):
  - Redirect do `/sessions` z flash message "Sesja nie znaleziona"
- Client-side:
  - Jeśli response 404 podczas fetchCards → redirect do `/sessions`

---

### 10.3 Błędy walidacji (400, 409, 422)

**Obsługa:**

- 400 Bad Request:
  - Parse `APIErrorDTO.details` jeśli dostępne
  - Wyświetl toast z opisem błędu: `error.message`
  - Jeśli field-specific errors → wyświetl przy odpowiednim polu formularza
- 409 Conflict (duplicate external_id):
  - Wyświetl error message przy polu `external_id` w formularzu
  - "Zadanie o tym ID już istnieje w sesji"
  - Keep modal open
- 422 Unprocessable Entity (limit exceeded):
  - Toast error: "Osiągnięto limit 50 zadań"
  - Close modal
  - Disable przycisk "Dodaj zadanie" / "Importuj CSV"

---

### 10.4 Błędy serwera (500, 503)

**Obsługa:**

- 500 Internal Server Error:
  - Toast: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
  - Log error do console
  - Opcjonalnie: Sentry reporting
- 503 Service Unavailable (AI service):
  - Toast z przyciskiem retry: "Usługa AI niedostępna. [Spróbuj ponownie]"
  - Keep modal open
  - Retry button → ponowne wywołanie API

---

### 10.5 Błędy rate limiting (429)

**Obsługa:**

- Toast: "Przekroczono limit zapytań. Spróbuj ponownie za kilka minut."
- Parse `Retry-After` header jeśli dostępny
- Disable przycisk "Estymuj przez AI" na X sekund
- Timer countdown w toaście

---

### 10.6 Błędy sieci (NetworkError)

**Obsługa:**

- Catch w try-catch jako generic error
- Toast: "Błąd połączenia. Sprawdź połączenie internetowe."
- Opcjonalnie: Retry button
- Nie zamykaj modala (user może spróbować ponownie)

---

### 10.7 Błędy parsowania CSV

**Obsługa:**

- Podczas parsowania pliku w ImportCsvModal:
  - Sprawdzenie formatu (header, kolumny)
  - Walidacja każdego wiersza
  - Zbieranie błędów: `{ row: number, error: string }`
- Wyświetlenie błędów w preview tabeli:
  - Wiersz z błędem oznaczony czerwonym
  - Tooltip z opisem błędu
- Disable przycisk "Importuj" gdy są błędy
- Możliwość poprawy: re-upload pliku

---

## 11. Kroki implementacji

### Krok 1: Struktura projektu i typy

**Zadania:**

1. Utworzenie pliku strony: `src/pages/sessions/[id].astro`
2. Dodanie nowych typów ViewModel do pliku pomocniczego:
   - Utworzenie `src/lib/types/session-view.types.ts`
   - Dodanie typów: `TabValue`, `BucketConfig`, `CardsByBucket`, `ModalState`, `DragEndEvent`
   - Eksport konfiguracji: `BUCKET_CONFIGS`
3. Weryfikacja istniejących typów w `src/types.ts`

**Weryfikacja:**

- TypeScript compiles bez błędów
- Wszystkie typy zaimportowane poprawnie

---

### Krok 2: Astro page - SessionView

**Zadania:**

1. Implementacja server-side logic w `src/pages/sessions/[id].astro`:

   ```typescript
   // Sprawdzenie autentykacji
   const {
     data: { user },
     error: authError,
   } = await Astro.locals.supabase.auth.getUser();
   if (authError || !user) {
     return Astro.redirect("/login?redirect=" + Astro.url.pathname);
   }

   // Pobranie danych sesji
   const sessionId = Astro.params.id;
   const sessionResponse = await fetch(`${Astro.url.origin}/api/sessions/${sessionId}`, {
     headers: { Authorization: `Bearer ${token}` },
   });

   if (!sessionResponse.ok) {
     return Astro.redirect("/sessions");
   }

   const { data: session } = await sessionResponse.json();

   // Pobranie kart
   const cardsResponse = await fetch(`${Astro.url.origin}/api/sessions/${sessionId}/cards`, {
     headers: { Authorization: `Bearer ${token}` },
   });

   const { data: cards } = await cardsResponse.json();
   ```

2. Przekazanie danych do SessionClient:
   ```astro
   <SessionClient client:load sessionId={sessionId} initialCards={cards} sessionData={session} />
   ```

**Weryfikacja:**

- Autentykacja działa (redirect do /login gdy brak tokena)
- Dane sesji i kart są poprawnie pobrane
- Props przekazane do SessionClient

---

### Krok 3: Custom Hooks

**Zadania:**

1. Implementacja `src/components/hooks/useSessionCards.ts`:
   - Stan: cards, loading, error
   - Funkcje: fetchCards, addCard, updateCard, deleteCard, batchUpdateCards, importCards, runAiEstimation
   - Obsługa błędów: try-catch, toast notifications
   - Optimistic update dla deleteCard

2. Implementacja `src/components/hooks/useModals.ts`:
   - Stan: ModalState
   - Funkcje: open/close dla każdego modala

**Weryfikacja:**

- Hooks działają z mock data
- API calls są poprawnie wykonywane
- Error handling działa

---

### Krok 4: Komponenty podstawowe (non-modal)

**Zadania:**

1. **SessionClient** (`src/components/SessionClient.tsx`):
   - Import hooks: useSessionCards, useModals
   - Stan: activeTab
   - Renderowanie: SessionHeader, SessionTabs, modali

2. **SessionHeader** (`src/components/SessionHeader.tsx`):
   - Buttons z Shadcn/ui
   - Icons z lucide-react
   - Conditional disable dla "Estymuj przez AI"

3. **SessionTabs** (`src/components/SessionTabs.tsx`):
   - Użycie Shadcn/ui Tabs
   - TabsList, TabsTrigger, TabsContent
   - Conditional rendering: EstimationBoard lub SummaryTable

4. **EmptyBoardState** (`src/components/EmptyBoardState.tsx`):
   - Icon, text, buttons
   - CTA actions

**Weryfikacja:**

- Komponenty renderują się poprawnie
- Przyciski wywołują odpowiednie funkcje
- Tabs switching działa

---

### Krok 5: Estimation Board i Drag-and-Drop

**Zadania:**

1. Instalacja dnd-kit:

   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. **EstimationBoard** (`src/components/EstimationBoard.tsx`):
   - DndContext setup
   - Sensors: PointerSensor, KeyboardSensor, TouchSensor
   - handleDragStart, handleDragEnd
   - Grupowanie kart po bucket_value
   - Renderowanie Bucket[] components

3. **Bucket** (`src/components/Bucket.tsx`):
   - useDroppable hook
   - Sticky header z position: sticky
   - Gradient background (Tailwind classes z config)
   - Renderowanie TaskCard[]

4. **TaskCard** (`src/components/TaskCard.tsx`):
   - useDraggable hook
   - Card z Shadcn/ui
   - Badge dla external_id
   - Tytuł z line-clamp-2
   - Tooltip z pełnym tytułem

**Weryfikacja:**

- Drag-and-drop działa (mouse, touch, keyboard)
- Visual feedback podczas drag
- Bucket highlight podczas hover
- API call po drop

---

### Krok 6: Summary Table

**Zadania:**

1. **SummaryTable** (`src/components/SummaryTable.tsx`):
   - Table z Shadcn/ui
   - Kolumny: ID, Tytuł, Wycena
   - Sortowanie: bucket_value ASC, external_id ASC
   - Badge dla bucket_value z kolorem (reuse z Bucket)
   - Empty state: "Brak zadań w sesji"

**Weryfikacja:**

- Tabela renderuje wszystkie karty
- Sortowanie działa poprawnie
- Kolory badge są spójne z kubełkami

---

### Krok 7: Modale - AddTaskModal

**Zadania:**

1. **AddTaskModal** (`src/components/AddTaskModal.tsx`):
   - Dialog z Shadcn/ui
   - Form z react-hook-form + zod schema
   - FormFields: external_id, title, description
   - Walidacja: required fields, min length
   - Submit handler → wywołanie onSubmit prop
   - Loading state
   - Error handling: field errors, toast

**Weryfikacja:**

- Modal otwiera się i zamyka
- Walidacja działa
- Submit wywołuje API
- Błędy wyświetlają się poprawnie
- Success → close modal, refresh cards

---

### Krok 8: Modale - ImportCsvModal

**Zadania:**

1. **ImportCsvModal** (`src/components/ImportCsvModal.tsx`):
   - Dialog z Shadcn/ui
   - DropZone (custom lub biblioteka react-dropzone)
   - CSV parsing (biblioteka papaparse)
   - Preview tabeli z parsed data
   - Walidacja wierszy
   - Wyświetlenie wyników importu
   - Submit handler

**Weryfikacja:**

- Drag-and-drop działa
- CSV parsing działa
- Preview pokazuje dane
- Walidacja wykrywa błędy
- Submit wywołuje API
- Wyniki importu są wyświetlane

---

### Krok 9: Modale - AiEstimationModal

**Zadania:**

1. **AiEstimationModal** (`src/components/AiEstimationModal.tsx`):
   - Dialog z Shadcn/ui
   - Alert z ostrzeżeniem (Shadcn/ui Alert)
   - Form: context textarea, confirm_override checkbox
   - Walidacja: checkbox must be checked
   - Submit handler
   - Loading state (spinner, blocking)

**Weryfikacja:**

- Modal otwiera się
- Ostrzeżenie jest widoczne
- Checkbox required działa
- Submit wywołuje API
- Loading state blokuje interakcje
- Success → close modal, refresh cards

---

### Krok 10: Modale - TaskDetailModal

**Zadania:**

1. **TaskDetailModal** (`src/components/TaskDetailModal.tsx`):
   - Dialog z Shadcn/ui
   - Wyświetlenie szczegółów karty
   - Badge dla external_id i bucket_value (z kolorami)
   - Przycisk "Usuń zadanie" (variant="destructive")
   - AlertDialog dla potwierdzenia usunięcia
   - Delete handler (optimistic UI)

**Weryfikacja:**

- Modal otwiera się z poprawnymi danymi
- Wszystkie pola są wyświetlone
- AlertDialog działa
- Delete wywołuje API
- Optimistic UI działa (karta znika natychmiast)
- Error handling działa

---

### Krok 11: Toast Notifications

**Zadania:**

1. Dodanie Shadcn/ui Toaster do layoutu:

   ```bash
   npx shadcn@latest add toast
   ```

2. Import Toaster w SessionClient lub głównym layout:

   ```tsx
   import { Toaster } from "@/components/ui/toaster";
   ```

3. Użycie toast w hook'ach i komponentach:

   ```tsx
   import { toast } from "@/components/ui/use-toast";

   toast({
     title: "Sukces",
     description: "Zadanie dodane pomyślnie",
   });

   toast({
     title: "Błąd",
     description: "Wystąpił błąd podczas zapisywania",
     variant: "destructive",
   });
   ```

**Weryfikacja:**

- Toast wyświetla się po akcjach
- Różne warianty (success, error) działają
- Toast auto-dismiss działa

---

### Krok 12: Skeleton Loading

**Zadania:**

1. Dodanie Shadcn/ui Skeleton:

   ```bash
   npx shadcn@latest add skeleton
   ```

2. **LoadingSkeleton** component dla EstimationBoard:
   - 8 kubełków ze Skeleton cards
   - Wyświetlany gdy `loading === true`

3. Conditional rendering w SessionClient:
   ```tsx
   {
     loading ? <LoadingSkeleton /> : <EstimationBoard />;
   }
   ```

**Weryfikacja:**

- Skeleton wyświetla się podczas initial load
- Skeleton layout przypomina rzeczywisty widok
- Transition do rzeczywistych danych jest smooth

---

### Krok 13: Accessibility i Keyboard Navigation

**Zadania:**

1. **Focus trap w modalach:**
   - Shadcn/ui Dialog już ma focus trap
   - Weryfikacja: Tab key nie ucieka z modala

2. **Keyboard navigation dla drag-and-drop:**
   - KeyboardSensor w dnd-kit
   - Instrukcje dla screen readers:
     ```tsx
     <div aria-label="Przeciągnij kartę używając strzałek i spacji">
     ```

3. **ARIA labels:**
   - Buttons: aria-label dla icon-only buttons
   - Buckets: aria-label "Kubełek wartość X"
   - Cards: aria-label z tytułem zadania

4. **Escape key:**
   - Zamyka modale
   - Anuluje drag-and-drop

**Weryfikacja:**

- Screen reader test (NVDA/JAWS)
- Keyboard-only navigation test
- Focus indicators są widoczne

---

### Krok 14: Responsive Design

**Zadania:**

1. **Mobile layout:**
   - EstimationBoard: vertical scroll + horizontal scroll dla kubełków
   - Buckets: min-width 200px
   - Cards: full width w mobile
   - SessionHeader: stack buttons vertically w mobile

2. **Tablet layout:**
   - 4 kubełki per row
   - Horizontal scroll w każdym row

3. **Desktop layout:**
   - 8 kubełków w poziomym scroll
   - Sticky headers

**Weryfikacja:**

- Test na różnych rozdzielczościach (320px, 768px, 1024px, 1920px)
- Horizontal scroll działa
- Touch gestures działają na mobile

---

### Krok 15: Error Boundaries

**Zadania:**

1. Utworzenie ErrorBoundary component:

   ```tsx
   // src/components/ErrorBoundary.tsx
   class ErrorBoundary extends React.Component {
     // ... error boundary logic
   }
   ```

2. Wrap SessionClient w ErrorBoundary:

   ```tsx
   <ErrorBoundary fallback={<ErrorFallback />}>
     <SessionClient />
   </ErrorBoundary>
   ```

3. ErrorFallback component:
   - Friendly error message
   - Przycisk "Odśwież stronę"
   - Przycisk "Wróć do listy sesji"

**Weryfikacja:**

- Symulacja błędu renderowania
- ErrorBoundary wychwytuje błąd
- Fallback UI wyświetla się

---

### Krok 16: Testowanie

**Zadania:**

1. **Unit tests:**
   - useSessionCards hook (mocked fetch)
   - useModals hook
   - BUCKET_CONFIGS helper

2. **Component tests:**
   - TaskCard render
   - Bucket render
   - SummaryTable sortowanie

3. **Integration tests:**
   - Full drag-and-drop flow
   - Add task flow
   - Delete task flow

4. **E2E tests (opcjonalnie):**
   - Playwright/Cypress
   - Critical user journeys

**Weryfikacja:**

- Wszystkie testy przechodzą
- Coverage > 70%

---

### Krok 17: Performance Optimization

**Zadania:**

1. **React.memo dla komponentów:**
   - TaskCard (re-render tylko gdy card data zmienia się)
   - Bucket (re-render tylko gdy cards w bucket zmieniają się)

2. **useMemo dla grupowania kart:**

   ```tsx
   const cardsByBucket = useMemo(() => {
     return groupCardsByBucket(cards);
   }, [cards]);
   ```

3. **useCallback dla handlers:**

   ```tsx
   const handleCardClick = useCallback(
     (card: CardDTO) => {
       openTaskDetail(card);
     },
     [openTaskDetail]
   );
   ```

4. **Debounce dla search (jeśli dodane w przyszłości)**

**Weryfikacja:**

- React DevTools Profiler
- Brak niepotrzebnych re-renders
- Smooth drag-and-drop (60fps)

---

### Krok 18: Dokumentacja i Code Review

**Zadania:**

1. **JSDoc dla funkcji:**
   - Wszystkie exported functions
   - Props interfaces
   - Custom hooks

2. **README aktualizacja:**
   - Dodanie opisu widoku sesji
   - Instrukcje użycia

3. **Code review checklist:**
   - TypeScript strict mode
   - No any types
   - Prettier formatting
   - ESLint compliance
   - Accessibility guidelines

**Weryfikacja:**

- Code review passed
- Dokumentacja aktualna
- No TS/ESLint errors

---

### Krok 19: Deployment Preparation

**Zadania:**

1. **Environment variables:**
   - Weryfikacja wszystkich env vars
   - .env.example aktualizacja

2. **Build test:**

   ```bash
   npm run build
   ```

3. **Production checks:**
   - Source maps wyłączone (opcjonalnie)
   - Console.log usunięte (lub tylko w dev)
   - Error reporting (Sentry) skonfigurowane

**Weryfikacja:**

- Build succeeds
- No build warnings
- Preview działa lokalnie

---

### Krok 20: Final Testing i Launch

**Zadania:**

1. **Manual QA:**
   - Testowanie wszystkich user flows
   - Testowanie error scenarios
   - Cross-browser testing (Chrome, Firefox, Safari, Edge)
   - Mobile testing (iOS, Android)

2. **Performance testing:**
   - Lighthouse score > 90
   - Load time < 2s
   - Time to Interactive < 3s

3. **Security audit:**
   - XSS prevention
   - CSRF tokens (jeśli potrzebne)
   - Input sanitization

**Weryfikacja:**

- Wszystkie testy passed
- No critical bugs
- Ready for production

---

## Podsumowanie

Plan implementacji widoku sesji estymacji obejmuje:

- **20 kroków** od struktury projektu do deployment
- **13 głównych komponentów** (page, client, header, tabs, board, bucket, card, table, empty state, 4 modale)
- **2 custom hooks** (useSessionCards, useModals)
- **10 endpointów API** (CRUD kart, import, AI, embeddings)
- **Pełna obsługa błędów** (401, 404, 400, 409, 422, 500, 503, 429)
- **Accessibility** (keyboard navigation, ARIA, screen readers)
- **Performance** (React.memo, useMemo, useCallback)
- **Testing** (unit, component, integration, E2E)

Implementacja powinna zająć **2-3 tygodnie** dla doświadczonego frontend developera, z możliwością równoległej pracy nad różnymi komponentami.
