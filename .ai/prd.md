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
Opis: Jako użytkownik chcę założyć konto używając nazwy użytkownika i hasła, aby zapisywać fiszki i postępy.
Kryteria akceptacji:

Formularz rejestracji zawiera pola: nazwa użytkownika, hasło, potwierdzenie hasła.
Walidacja: nazwa użytkownika wymagana; hasło wymagane; hasła muszą być zgodne.
Po udanej rejestracji użytkownik jest zalogowany lub przekierowany do logowania z jasnym komunikatem sukcesu.
Próba rejestracji z zajętą nazwą użytkownika kończy się komunikatem błędu.

### US-002

ID: US-002
Tytuł: Logowanie
Opis: Jako użytkownik chcę zalogować się nazwą użytkownika i hasłem, aby uzyskać dostęp do swoich fiszek.
Kryteria akceptacji:

Formularz logowania zawiera pola: nazwa użytkownika, hasło.
Poprawne dane logują użytkownika i zapewniają dostęp do widoków aplikacji.
Błędne dane nie logują użytkownika i pokazują komunikat błędu bez ujawniania, czy konto istnieje.

### US-003

ID: US-003
Tytuł: Wylogowanie
Opis: Jako użytkownik chcę się wylogować, aby zakończyć sesję na współdzielonym urządzeniu.
Kryteria akceptacji:

Widoczny jest przycisk wylogowania dla zalogowanego użytkownika.
Po wylogowaniu zasoby wymagające autoryzacji nie są dostępne bez ponownego logowania.

### US-004

ID: US-004
Tytuł: Izolacja danych między użytkownikami (autoryzacja)
Opis: Jako użytkownik chcę mieć pewność, że inni użytkownicy nie mają dostępu do moich fiszek i postępów.
Kryteria akceptacji:

Zalogowany użytkownik widzi wyłącznie fiszki i dane powtórek przypisane do jego konta.
Próba dostępu do zasobu innego użytkownika (np. przez manipulację ID) skutkuje odmową (np. 403/404) i nie ujawnia danych.

### US-005

ID: US-005
Tytuł: Obsługa wygaśniętej sesji
Opis: Jako użytkownik chcę dostać jasną informację i możliwość ponownego logowania, gdy moja sesja wygaśnie.
Kryteria akceptacji:

Gdy sesja wygaśnie, próba wejścia na chroniony widok przekierowuje do logowania.
Po zalogowaniu użytkownik wraca do głównego widoku aplikacji.

### US-006

Tytuł: Import kart z CSV  
Opis: Jako facylitator chcę zaimportować listę zadań z pliku CSV, aby szybko rozpocząć sesję.  
Kryteria akceptacji:

- System akceptuje tylko pliki CSV o wymaganych kolumnach.
- Po imporcie wyświetlana jest liczba poprawnie wczytanych kart.
- Błędne wiersze są pomijane i raportowane.

### US-007

Tytuł: Ręczne dodanie karty  
Opis: Jako facylitator chcę dodać pojedyncze zadanie ręcznie, aby uzupełnić backlog ad-hoc.  
Kryteria akceptacji:

- Formularz wymaga podania id i title.
- Po zapisaniu karta pojawia się w sesji.
- Embedding jest generowany automatycznie.

### US-008

Tytuł: Wyświetlenie i przeciąganie kart  
Opis: Jako użytkownik chcę przeciągać karty między kubełkami, aby ustalić wycenę.  
Kryteria akceptacji:

- Karty można swobodnie przenosić między kolumnami.
- Zmiana pozycji jest zapisywana w czasie rzeczywistym.
- Interfejs działa płynnie dla do 50 kart.

### US-009

Tytuł: Podgląd szczegółów zadania  
Opis: Jako deweloper chcę otworzyć opis zadania w modalu, aby zrozumieć zakres pracy.  
Kryteria akceptacji:

- Kliknięcie karty otwiera modal.
- Modal wyświetla pełny description.
- Modal można zamknąć bez utraty stanu sesji.

### US-010

Tytuł: Automatyczna estymacja przez AI  
Opis: Jako facylitator chcę, aby AI wstępnie przypisało zadania do kubełków.  
Kryteria akceptacji:

- System wyświetla modal potwierdzenia przed uruchomieniem AI.
- AI przypisuje wszystkie karty do kubełków.
- Poprzedni układ zostaje zastąpiony.

### US-011

Tytuł: Podsumowanie estymacji  
Opis: Jako facylitator chcę zobaczyć tabelaryczne podsumowanie wycen.  
Kryteria akceptacji:

- Tabela zawiera ID, tytuł i wycenę.
- Dane są tylko do odczytu.
- Widok odzwierciedla aktualny stan sesji.

### US-012

Tytuł: Czyszczenie sesji  
Opis: Jako facylitator chcę wyczyścić sesję po zakończeniu planowania.  
Kryteria akceptacji:

- Bieżący stan sesji zostaje usunięty.
- Dane analityczne są zachowane w bazie.
- Użytkownik otrzymuje pustą sesję gotową do ponownego użycia.

### US-013

Tytuł: Obsługa błędów i stanów skrajnych  
Opis: Jako użytkownik chcę otrzymywać jasne komunikaty o błędach, aby wiedzieć jak zareagować.  
Kryteria akceptacji:

- System informuje o błędach importu, zapisu i AI.
- Brak połączenia z backendem jest sygnalizowany w UI.
- Aplikacja nie traci danych przy chwilowych błędach sieci.

## 6. Metryki sukcesu

- Redukcja czasu sesji estymacji o minimum 30% w porównaniu do tradycyjnych metod.
- Co najmniej 60% zadań pozostaje w kubełkach zaproponowanych przez AI bez ręcznej zmiany.
- 100% poprawności zapisu embeddingów dla zadań zawierających opis techniczny.
- Minimum 90% udanych sesji bez krytycznych błędów aplikacji.
