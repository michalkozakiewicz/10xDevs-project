# Dokument wymagań produktu (PRD) - BucketEstimate AI

## 1. Przegląd produktu

BucketEstimate AI to webowa aplikacja wspierająca zespoły Scrumowe w szybkiej estymacji dużej liczby zadań przy użyciu metody Bucket System. Narzędzie umożliwia import do 50 kart zadań, ich wizualną organizację w kubełkach opartych o sekwencję Fibonacciego oraz wykorzystanie sztucznej inteligencji do wstępnego przypisania zadań do odpowiednich poziomów złożoności.

Główne cele produktu:

- Drastyczne skrócenie czasu planowania i refinementu backlogu.
- Odciążenie facylitatora poprzez automatyzację pierwszego kroku estymacji.
- Zapewnienie intuicyjnego, wizualnego interfejsu typu drag-and-drop.
- Budowa bazy wiedzy estymacyjnej poprzez zapisywanie embeddingów i wyników historycznych.

Produkt jest przeznaczony do użytku przez jednego facylitatora w trakcie sesji zespołowej, bez trybu wieloosobowej edycji w czasie rzeczywistym.

## 2. Problem użytkownika

Zespoły deweloperskie regularnie mierzą się z koniecznością estymacji kilkudziesięciu małych lub średnich zadań w ramach backlog refinementu. Tradycyjne metody, takie jak Planning Poker, są czasochłonne, nużące i słabo skalują się przy dużej liczbie kart. Proces wymaga intensywnej facylitacji, a zespoły często zaczynają estymację bez wspólnego punktu odniesienia.

Użytkownicy potrzebują narzędzia, które:

- Pozwoli szybko załadować dużą liczbę zadań.
- Wizualnie uporządkuje proces estymacji.
- Zaproponuje sensowny punkt startowy dzięki AI.
- Zminimalizuje czas poświęcony na dyskusje oczywistych lub podobnych zadań.

## 3. Wymagania funkcjonalne

### 3.1 Import i zarządzanie kartami

- System umożliwia import zadań z pliku CSV o sztywnym formacie: id, title, description.
- Po imporcie użytkownik otrzymuje informację o liczbie poprawnie wczytanych kart oraz ewentualnych błędach.
- Użytkownik może ręcznie dodać pojedynczą kartę zadania poprzez formularz w UI.
- Maksymalna liczba kart w jednej sesji wynosi 50.

### 3.2 Interfejs estymacji (UI/UX)

- Interfejs zawiera 8 poziomych kolumn (kubełków) o wartościach: 1, 2, 3, 5, 8, 13, 21 oraz ?.
- Kolumny są przewijane poziomo, z nagłówkami zablokowanymi (sticky headers).
- Karty zadań można przeciągać pomiędzy kubełkami metodą drag-and-drop.
- Widok karty zawiera id oraz title.
- Kliknięcie karty otwiera modal z pełnym description zadania.

### 3.3 Moduł AI

- Po imporcie lub ręcznym dodaniu zadania system automatycznie generuje embedding tekstu (model text-embedding-3-small).
- Użytkownik może uruchomić funkcję automatycznego ułożenia wszystkich kart przez AI (do 50 jednocześnie).
- Model LLM (np. GPT-4o-mini) przypisuje zadania do kubełków na podstawie treści i opcjonalnego kontekstu projektu.
- Przed uruchomieniem AI wyświetlany jest modal ostrzegający o nadpisaniu aktualnego układu kart.

### 3.4 Zarządzanie sesją i wynikami

- Stan sesji (pozycje kart w kubełkach) jest zapisywany w Supabase w czasie rzeczywistym.
- Po zakończeniu estymacji dostępny jest widok podsumowania w formie tabeli: ID, Tytuł, Wycena.
- Widok podsumowania jest tylko do odczytu.
- Użytkownik może wyczyścić sesję, co usuwa bieżący stan, ale zachowuje dane analityczne (id, tytuł, wycena, embedding) w bazie Postgres.

### 3.5 Uwierzytelnianie i dostęp

- Aplikacja wymaga uwierzytelnienia użytkownika (np. email + magic link).
- Dostęp do sesji estymacji mają tylko uwierzytelnieni użytkownicy.
- Każda sesja jest powiązana z jednym użytkownikiem-facylitatorem.

## 4. Granice produktu

Poza zakresem MVP znajdują się:

- Tryb multiplayer i synchronizacja wielu użytkowników w czasie rzeczywistym.
- Integracje z zewnętrznymi systemami (Jira, Azure DevOps).
- Historia zmian oraz funkcje undo/redo.
- Możliwość edycji wyceny w widoku podsumowania.
- Zaawansowana analityka i raportowanie historyczne w UI.

## 5. Historyjki użytkowników

### US-001

ID: US-001
Tytuł: Rejestracja konta
Opis: Jako użytkownik chcę założyć konto używając adresu email i hasła, aby mieć dostęp do aplikacji BucketEstimate.
Kryteria akceptacji:

- Formularz rejestracji zawiera pola: email, hasło, potwierdzenie hasła.
- Walidacja: email wymagany i poprawny format; hasło wymagane (min. 6 znaków); hasła muszą być zgodne.
- Po udanej rejestracji użytkownik jest przekierowany do logowania z jasnym komunikatem sukcesu.
- Próba rejestracji z zajętym adresem email kończy się komunikatem błędu.

### US-002

ID: US-002
Tytuł: Logowanie
Opis: Jako użytkownik chcę zalogować się adresem email i hasłem, aby uzyskać dostęp do moich sesji estymacji.
Kryteria akceptacji:

- Formularz logowania zawiera pola: email, hasło.
- Poprawne dane logują użytkownika i przekierowują do dashboardu sesji.
- Błędne dane nie logują użytkownika i pokazują komunikat błędu bez ujawniania, czy konto istnieje.
- System zachowuje URL powrotu (return_to) dla przekierowania po zalogowaniu.

### US-003

ID: US-003
Tytuł: Wylogowanie
Opis: Jako użytkownik chcę się wylogować, aby zakończyć sesję na współdzielonym urządzeniu.
Kryteria akceptacji:

- W topbarze widoczny jest przycisk wylogowania z adresem email użytkownika.
- Po wylogowaniu użytkownik jest przekierowany do strony logowania.
- Chronione widoki nie są dostępne bez ponownego logowania.

### US-004

ID: US-004
Tytuł: Izolacja danych między użytkownikami (autoryzacja)
Opis: Jako użytkownik chcę mieć pewność, że inni użytkownicy nie mają dostępu do moich sesji estymacji.
Kryteria akceptacji:

- Zalogowany użytkownik widzi wyłącznie sesje przypisane do swojego konta.
- Próba dostępu do sesji innego użytkownika (np. przez manipulację ID w URL) skutkuje błędem 404.
- Row Level Security (RLS) w bazie danych wymusza izolację danych.

### US-005

ID: US-005
Tytuł: Obsługa wygaśniętej sesji autoryzacyjnej
Opis: Jako użytkownik chcę dostać jasną informację i możliwość ponownego logowania, gdy moja sesja wygaśnie.
Kryteria akceptacji:

- Gdy sesja JWT wygaśnie, próba wejścia na chroniony widok przekierowuje do logowania.
- Oryginalny URL jest zachowany jako parametr return_to.
- Po zalogowaniu użytkownik wraca do poprzedniego widoku.

### US-006

ID: US-006
Tytuł: Przeglądanie listy sesji
Opis: Jako facylitator chcę zobaczyć listę moich sesji estymacji, aby wybrać sesję do pracy lub utworzyć nową.
Kryteria akceptacji:

- Po zalogowaniu użytkownik widzi dashboard z listą swoich sesji.
- Każda sesja wyświetla ID (skrócone), datę utworzenia i liczbę kart.
- Sesje są sortowane od najnowszych.
- Przy braku sesji wyświetlany jest empty state z CTA do utworzenia pierwszej sesji.
- Kliknięcie karty sesji otwiera widok estymacji.

### US-007

ID: US-007
Tytuł: Tworzenie nowej sesji
Opis: Jako facylitator chcę utworzyć nową sesję estymacji, aby rozpocząć planowanie zadań.
Kryteria akceptacji:

- Na dashboardzie dostępny jest przycisk "Utwórz nową sesję".
- Po kliknięciu tworzona jest nowa pusta sesja i użytkownik jest do niej przekierowany.
- Nowa sesja pojawia się na liście sesji.
- Sesja jest powiązana z zalogowanym użytkownikiem.

### US-008

ID: US-008
Tytuł: Import kart z CSV
Opis: Jako facylitator chcę zaimportować listę zadań z pliku CSV, aby szybko rozpocząć sesję.
Kryteria akceptacji:

- System akceptuje tylko pliki CSV o wymaganych kolumnach (id, title, description).
- Po imporcie wyświetlana jest liczba poprawnie wczytanych kart.
- Błędne wiersze są pomijane i raportowane z numerem wiersza i przyczyną.
- Import nie przekracza limitu 50 kart w sesji.
- Duplikaty external_id są odrzucane.

### US-009

ID: US-009
Tytuł: Ręczne dodanie karty
Opis: Jako facylitator chcę dodać pojedyncze zadanie ręcznie, aby uzupełnić backlog ad-hoc.
Kryteria akceptacji:

- Formularz wymaga podania id (external_id) i title.
- Opis (description) jest opcjonalny.
- Po zapisaniu karta pojawia się w kubełku "Do wyceny" (?).
- Próba dodania karty z istniejącym external_id kończy się błędem 409.
- Nie można przekroczyć limitu 50 kart w sesji.

### US-010

ID: US-010
Tytuł: Wyświetlenie i przeciąganie kart
Opis: Jako użytkownik chcę przeciągać karty między kubełkami, aby ustalić wycenę.
Kryteria akceptacji:

- Karty można swobodnie przenosić między 8 kolumnami (1, 2, 3, 5, 8, 13, 21, ?).
- Zmiana pozycji jest zapisywana w czasie rzeczywistym (optimistic UI).
- Interfejs działa płynnie dla do 50 kart.
- Kubełek "?" jest wizualnie wyróżniony (szare tło, przerywana obwódka).
- Drag-and-drop wspiera nawigację klawiaturą.

### US-011

ID: US-011
Tytuł: Podgląd szczegółów zadania
Opis: Jako deweloper chcę otworzyć opis zadania w modalu, aby zrozumieć zakres pracy.
Kryteria akceptacji:

- Kliknięcie karty otwiera modal ze szczegółami.
- Modal wyświetla: external_id, tytuł, opis, aktualną wycenę (badge).
- Wszystkie pola są tylko do odczytu.
- Modal można zamknąć bez utraty stanu sesji.

### US-012

ID: US-012
Tytuł: Usuwanie pojedynczej karty
Opis: Jako facylitator chcę usunąć pojedynczą kartę z sesji, aby usunąć błędnie dodane zadanie.
Kryteria akceptacji:

- W modalu szczegółów karty dostępny jest przycisk "Usuń zadanie".
- Przed usunięciem wyświetlany jest AlertDialog z potwierdzeniem.
- Po potwierdzeniu karta jest trwale usuwana z sesji.
- Użytkownik otrzymuje toast z potwierdzeniem usunięcia.
- Karta znika z kubełka natychmiast (optimistic UI).

### US-013

ID: US-013
Tytuł: Automatyczna estymacja przez AI
Opis: Jako facylitator chcę, aby AI wstępnie przypisało zadania do kubełków.
Kryteria akceptacji:

- System wyświetla modal z ostrzeżeniem przed uruchomieniem AI.
- Użytkownik może podać opcjonalny kontekst projektu.
- AI przypisuje wszystkie karty do kubełków na podstawie treści.
- Poprzedni układ zostaje zastąpiony.
- W przypadku błędu AI (503) wyświetlany jest komunikat z opcją ponowienia.

### US-014

ID: US-014
Tytuł: Podsumowanie estymacji
Opis: Jako facylitator chcę zobaczyć tabelaryczne podsumowanie wycen.
Kryteria akceptacji:

- Dostępna jest zakładka "Podsumowanie" w widoku sesji.
- Tabela zawiera: external_id, tytuł, wycenę (bucket_value).
- Dane są tylko do odczytu.
- Tabela jest sortowana według wyceny.
- Widok odzwierciedla aktualny stan sesji.

### US-015

ID: US-015
Tytuł: Czyszczenie sesji
Opis: Jako facylitator chcę wyczyścić sesję po zakończeniu planowania.
Kryteria akceptacji:

- Dostępna jest opcja czyszczenia sesji.
- Czyszczenie resetuje bucket_value wszystkich kart do null.
- Karty pozostają w sesji, ale wracają do kubełka "?".
- Dane analityczne (embeddingi) są zachowane.
- Użytkownik otrzymuje informację o liczbie wyczyszczonych kart.

### US-016

ID: US-016
Tytuł: Usuwanie sesji
Opis: Jako facylitator chcę usunąć całą sesję, której już nie potrzebuję.
Kryteria akceptacji:

- Na dashboardzie lub w widoku sesji dostępna jest opcja usunięcia.
- Przed usunięciem wyświetlany jest dialog potwierdzenia.
- Usunięcie sesji usuwa również wszystkie jej karty.
- Po usunięciu użytkownik jest przekierowany do dashboardu.
- Usunięta sesja nie pojawia się już na liście.

### US-017

ID: US-017
Tytuł: Aktualizacja kontekstu sesji
Opis: Jako facylitator chcę dodać kontekst projektu do sesji, aby AI lepiej rozumiało specyfikę zadań.
Kryteria akceptacji:

- W modalu AI estymacji dostępne jest pole tekstowe na kontekst.
- Kontekst jest zapisywany w sesji i używany przy kolejnych estymacjach AI.
- Maksymalna długość kontekstu to 10000 znaków.
- Kontekst jest opcjonalny.

### US-018

ID: US-018
Tytuł: Nawigacja między widokami
Opis: Jako użytkownik chcę łatwo nawigować między dashboardem a widokiem sesji.
Kryteria akceptacji:

- Logo w topbarze prowadzi do dashboardu sesji.
- W widoku sesji dostępny jest przycisk "Wróć" do dashboardu.
- Przełączanie między zakładkami "Estymacja" i "Podsumowanie" nie zmienia URL.
- Stan sesji jest zachowywany przy nawigacji.

### US-019

ID: US-019
Tytuł: Obsługa błędów i stanów skrajnych
Opis: Jako użytkownik chcę otrzymywać jasne komunikaty o błędach, aby wiedzieć jak zareagować.
Kryteria akceptacji:

- System informuje o błędach importu, zapisu i AI poprzez toast.
- Brak połączenia z backendem jest sygnalizowany w UI.
- Błąd 401 przekierowuje do logowania z zachowaniem return_to URL.
- Błąd 409 (konflikt ID) wyświetla inline error pod polem.
- Błąd 422 (limit kart) informuje o pozostałej liczbie dostępnych miejsc.
- Aplikacja nie traci danych przy chwilowych błędach sieci (optimistic UI).

## 6. Metryki sukcesu

- Redukcja czasu sesji estymacji o minimum 30% w porównaniu do tradycyjnych metod.
- Co najmniej 60% zadań pozostaje w kubełkach zaproponowanych przez AI bez ręcznej zmiany.
- 100% poprawności zapisu embeddingów dla zadań zawierających opis techniczny.
- Minimum 90% udanych sesji bez krytycznych błędów aplikacji.
