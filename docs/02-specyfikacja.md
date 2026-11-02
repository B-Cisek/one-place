# 02. Specyfikacja MVP

Dokument opisuje **co** robi MVP. Sposób realizacji opisuje [03-architektura.md](03-architektura.md).

## Słownik

| Pojęcie                    | Znaczenie                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Kontekst**               | Nazwany obszar (np. „Praca”, „Prywatne”) z własnym pulpitem i opcjonalnym nadpisaniem motywu.        |
| **Pulpit**                 | Siatka widgetów należąca do dokładnie jednego kontekstu. Nie istnieje osobno.                        |
| **Typ widgetu**            | Rodzaj funkcjonalności (np. `todo`) zdefiniowany w kodzie rozszerzenia.                              |
| **Widget**                 | Konkretne wystąpienie typu na pulpicie, z własną konfiguracją, pozycją i rozmiarem.                  |
| **Źródło danych**          | Miejsce, z którego widget pobiera dane. W MVP jedyne źródło to `local`, czyli API One Place.         |
| **Motyw globalny**         | Ustawienia wyglądu konta: tryb i kolor akcentu.                                                      |
| **Nadpisanie motywu**      | Opcjonalne ustawienia kontekstu, które zastępują wybrane pola motywu globalnego.                     |
| **Motyw efektywny**        | Wynik złożenia motywu globalnego i nadpisania aktywnego kontekstu.                                   |
| **Tryb podglądu / edycji** | W trybie podglądu korzysta się z widgetów. W trybie edycji przesuwa się je, skaluje, dodaje i usuwa. |

## Wymagania funkcjonalne

### Logowanie (AUTH)

| ID        | Wymaganie                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-AUTH-01 | Rejestracja: nazwa (1–50 znaków), e-mail, hasło (8–128 znaków). Po rejestracji użytkownik jest od razu zalogowany.                                            |
| F-AUTH-02 | Logowanie e-mailem i hasłem. Przy błędnych danych pojawia się jeden ogólny komunikat „Nieprawidłowy e-mail lub hasło”, bez wskazania, które pole jest błędne. |
| F-AUTH-03 | Sesja jest ważna 30 dni i odnawia się przy użyciu. Po wygaśnięciu pojawia się ekran logowania.                                                                |
| F-AUTH-04 | Wylogowanie usuwa token i cały lokalny cache danych, a motyw wraca do domyślnego.                                                                             |
| F-AUTH-05 | Odpowiedź 401 z API w dowolnym momencie działa jak wylogowanie i pokazuje komunikat „Sesja wygasła”.                                                          |
| F-AUTH-06 | Bez zalogowania rozszerzenie pokazuje wyłącznie ekran logowania lub rejestracji.                                                                              |

Poza MVP: reset hasła, weryfikacja adresu e-mail, magic link (wymagają wysyłki e-maili).

### Konteksty (CTX)

| ID       | Wymaganie                                                                                                                                                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-CTX-01 | Konto nie ma domyślnych kontekstów. Gdy użytkownik nie ma żadnego kontekstu, pulpit pokazuje pusty stan z formularzem „Utwórz swój pierwszy kontekst” (nazwa i ikona).                                                                                     |
| F-CTX-02 | Tworzenie kontekstu: nazwa (1–40 znaków) i ikona z predefiniowanej listy. Nowy kontekst trafia na koniec listy i staje się aktywny.                                                                                                                        |
| F-CTX-03 | Przełącznik kontekstów w nagłówku zmienia pulpit bez przeładowania strony.                                                                                                                                                                                 |
| F-CTX-04 | Aktywny kontekst jest zapamiętywany osobno na każdym urządzeniu. Jeśli zapamiętany kontekst nie istnieje (np. usunięto go na innym urządzeniu), aktywny staje się pierwszy kontekst z listy.                                                               |
| F-CTX-05 | Zmiana nazwy i ikony kontekstu.                                                                                                                                                                                                                            |
| F-CTX-06 | Zmiana kolejności kontekstów przez przeciąganie na liście w zarządzaniu kontekstami.                                                                                                                                                                       |
| F-CTX-07 | Usunięcie kontekstu wymaga potwierdzenia w modalu z liczbą widgetów, które zostaną usunięte. Usuwa też widgety i ich dane. Po usunięciu aktywnego kontekstu aktywny staje się pierwszy pozostały, a gdy nie ma żadnego, pojawia się pusty stan z F-CTX-01. |
| F-CTX-08 | Limit: 20 kontekstów na konto.                                                                                                                                                                                                                             |

### Motywy (THEME)

| ID         | Wymaganie                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-THEME-01 | Tryb: jasny, ciemny lub systemowy (domyślnie systemowy). Tryb systemowy reaguje na zmianę ustawień systemu bez przeładowania.                                         |
| F-THEME-02 | Kolor akcentu z predefiniowanej listy (domyślnie `blue`).                                                                                                             |
| F-THEME-03 | Nadpisanie w kontekście: tryb, akcent lub oba. Każde pole ma opcję „Globalny”, więc można nadpisać np. sam akcent. Opcja „Używaj motywu globalnego” usuwa nadpisanie. |
| F-THEME-04 | Zmiany są widoczne natychmiast, a zapis odbywa się w tle.                                                                                                             |
| F-THEME-05 | Otwarcie nowej karty nie powoduje mignięcia innym motywem niż efektywny.                                                                                              |
| F-THEME-06 | Model motywu ma pole `background`. W MVP jego jedyna wartość to `none` i UI go nie pokazuje. To przygotowanie pod tło pulpitu.                                        |

Lista akcentów w MVP: `blue`, `indigo`, `violet`, `pink`, `rose`, `orange`, `amber`, `green`, `emerald`, `teal`.

### Siatka (GRID)

| ID        | Wymaganie                                                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-GRID-01 | Siatka ma 12 kolumn i stałą wysokość wiersza.                                                                                                                                      |
| F-GRID-02 | Domyślny jest tryb podglądu. Przełącznik „Edytuj pulpit” w nagłówku włącza tryb edycji. Tryb edycji nie jest zapamiętywany: nowa karta zawsze otwiera się w podglądzie.            |
| F-GRID-03 | W trybie edycji widgety można przeciągać (za nagłówek ramki) i skalować, ale nie poniżej minimalnego rozmiaru typu. Widgety nie nachodzą na siebie i są dosuwane w pionie do góry. |
| F-GRID-04 | Układ zapisuje się automatycznie po zakończeniu przeciągania lub skalowania.                                                                                                       |
| F-GRID-05 | W oknie węższym niż 768 px widgety układają się w jednej kolumnie w kolejności (y, x), a edycja układu jest niedostępna.                                                           |

### Widgety (WGT)

| ID       | Wymaganie                                                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-WGT-01 | Przycisk „Dodaj widget” (w trybie edycji oraz na pustym pulpicie) otwiera katalog typów z nazwą, ikoną i opisem.                                                 |
| F-WGT-02 | Nowy widget trafia pod istniejące, z domyślnym rozmiarem i konfiguracją typu.                                                                                    |
| F-WGT-03 | Usunięcie widgetu z jego menu wymaga potwierdzenia i usuwa też dane widgetu.                                                                                     |
| F-WGT-04 | Ustawienia widgetu (jeśli typ je ma) otwierają się z menu widgetu w modalu.                                                                                      |
| F-WGT-05 | Błąd wewnątrz widgetu pokazuje komunikat w jego ramce z przyciskiem „Spróbuj ponownie”. Reszta pulpitu działa normalnie.                                         |
| F-WGT-06 | Widget nieznanego typu (np. dodany w nowszej wersji rozszerzenia) pokazuje ramkę z komunikatem „Ten widget wymaga nowszej wersji rozszerzenia”. Można go usunąć. |
| F-WGT-07 | Limit: 50 widgetów na kontekst.                                                                                                                                  |

### Widget Zadania (TODO)

| ID        | Wymaganie                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| F-TODO-01 | Pole „Dodaj zadanie”: Enter dodaje zadanie na końcu listy. Tekst jest przycinany (trim) i musi mieć 1–500 znaków. Pusty tekst jest ignorowany. |
| F-TODO-02 | Checkbox oznacza zadanie jako ukończone lub nieukończone. Ukończone zadania są przekreślone i zostają na swoim miejscu.                        |
| F-TODO-03 | Kliknięcie tekstu włącza edycję w miejscu. Enter lub utrata fokusu zapisuje, Escape anuluje. Pusty tekst oznacza anulowanie.                   |
| F-TODO-04 | Usunięcie zadania ikoną przy zadaniu, bez potwierdzenia.                                                                                       |
| F-TODO-05 | Zmiana kolejności przez przeciąganie zadań.                                                                                                    |
| F-TODO-06 | Ustawienia widgetu: tytuł (0–60 znaków, pusty oznacza nazwę typu „Zadania”) oraz „Ukryj ukończone”.                                            |
| F-TODO-07 | Pusta lista pokazuje stan „Brak zadań”.                                                                                                        |
| F-TODO-08 | Limit: 500 zadań na widget.                                                                                                                    |

### Synchronizacja i cache (SYNC)

| ID        | Wymaganie                                                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-SYNC-01 | Jeśli istnieje lokalny cache, pulpit jest widoczny od razu po otwarciu karty, a dane odświeżają się w tle.                                                                         |
| F-SYNC-02 | Bez cache (pierwsze uruchomienie, po wylogowaniu) do czasu pobrania danych widoczne są szkielety (skeleton) zamiast spinnera.                                                      |
| F-SYNC-03 | Powrót do karty (fokus okna) odświeża dane.                                                                                                                                        |
| F-SYNC-04 | Zmiany są optymistyczne: UI aktualizuje się od razu. Gdy serwer odrzuci zmianę, zostaje ona cofnięta, a użytkownik widzi komunikat (toast).                                        |
| F-SYNC-05 | Bez sieci widoczny jest baner „Offline, pokazuję zapisane dane”. Zmiany czekają na powrót sieci, dopóki karta jest otwarta, i są wysyłane w kolejności, w jakiej zostały zrobione. |
| F-SYNC-06 | Konflikty między urządzeniami rozstrzyga reguła „ostatni zapis wygrywa” na poziomie rekordu.                                                                                       |
| F-SYNC-07 | Po aktualizacji rozszerzenia, która zmienia kształt danych w cache, stary cache jest odrzucany i dane pobierane od nowa.                                                           |

**Znane ograniczenie MVP:** zmiana wykonana offline przepada, jeśli karta zostanie zamknięta przed powrotem sieci.

### Język (I18N)

| ID        | Wymaganie                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-I18N-01 | Interfejs jest dostępny po polsku i angielsku.                                                                                                                                  |
| F-I18N-02 | Przed zalogowaniem język wynika z przeglądarki (`pl*` daje PL, inne EN). Po zalogowaniu obowiązuje `locale` z ustawień konta, a gdy go nie ustawiono, nadal język przeglądarki. |
| F-I18N-03 | Język można zmienić w ustawieniach. Wybór jest zapisywany na koncie.                                                                                                            |

## Wymagania niefunkcjonalne

| Obszar         | Wymaganie                                                                                                                                                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wydajność      | Pierwszy render pulpitu z cache w czasie poniżej 200 ms od otwarcia karty (mierzony przez `performance.mark`). Kod widgetów ładowany leniwie. Budżet startowego JS nowej karty: 550 kB bez kompresji (pomiar z Etapu 2: 473 kB + ok. 15%), liczony jako suma skryptu wejściowego i chunków z `modulepreload` (`pnpm size`). |
| Uprawnienia    | Wyłącznie `storage`. Bez `host_permissions`.                                                                                                                                                                                                                                                                                |
| Prywatność     | Bez telemetrii i analityki. Jedyne żądania sieciowe idą do API One Place. Ikony i fonty są w paczce lub systemowe.                                                                                                                                                                                                          |
| Bezpieczeństwo | Hasła hashowane przez Better Auth. Token sesji tylko w `chrome.storage.local`. Każde zapytanie do bazy jest ograniczone do właściciela. Cudzy zasób zwraca 404. CORS dopuszcza tylko originy rozszerzenia. Endpointy logowania mają rate limiting.                                                                          |
| Przeglądarki   | Aktualne stabilne Chrome i Brave na desktopie.                                                                                                                                                                                                                                                                              |
| Dostępność     | Komponenty Nuxt UI (Reka UI) zapewniają obsługę klawiatury i ARIA. **Znane ograniczenie MVP:** przeciąganie w siatce i na liście zadań działa tylko myszą.                                                                                                                                                                  |
| Jakość         | TypeScript w trybie strict. `pnpm check` (lint, typecheck, testy) przechodzi przed każdym commitem.                                                                                                                                                                                                                         |

## Limity i walidacja

| Pole                | Reguła                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `user.name`         | 1–50 znaków                                                                                         |
| `user.password`     | 8–128 znaków                                                                                        |
| `context.name`      | 1–40 znaków po przycięciu                                                                           |
| `context.icon`      | wartość z listy `CONTEXT_ICONS` w `packages/shared`                                                 |
| `theme.accent`      | wartość z listy `ACCENT_COLORS`                                                                     |
| `widget.type`       | wartość z `WIDGET_TYPES`                                                                            |
| `widget.x/y/w/h`    | liczby całkowite; `x ≥ 0`, `y ≥ 0`, `x + w ≤ 12`, `w` i `h` nie mniejsze niż minimalny rozmiar typu |
| `widget.config`     | zgodny ze schematem Zod typu                                                                        |
| `todo.text`         | 1–500 znaków po przycięciu                                                                          |
| `todo widget title` | 0–60 znaków                                                                                         |
| Liczności           | 20 kontekstów na konto, 50 widgetów na kontekst, 500 zadań na widget                                |

## Kryteria akceptacji MVP

Każdy scenariusz jest testem E2E (Playwright, Chromium z załadowanym rozszerzeniem).

1. **Rejestracja i pierwszy kontekst:** nowy użytkownik rejestruje się, widzi pusty stan, tworzy kontekst „Praca” i widzi pusty pulpit z przyciskiem „Dodaj widget”.
2. **Widget i zadania:** użytkownik dodaje widget Zadania, dodaje trzy zadania, oznacza jedno jako ukończone, edytuje drugie i usuwa trzecie. Po przeładowaniu karty stan jest taki sam.
3. **Kolejność zadań:** przeciągnięcie zadania zmienia kolejność, która zostaje zachowana po przeładowaniu.
4. **Układ:** w trybie edycji użytkownik przesuwa i skaluje widget. Po przeładowaniu układ jest zachowany, a karta otwiera się w trybie podglądu.
5. **Konteksty:** użytkownik tworzy drugi kontekst „Prywatne” i przełącza się między kontekstami, a każdy ma własne widgety. Usunięcie „Prywatne” (po potwierdzeniu) przełącza na „Praca”.
6. **Motyw:** zmiana na tryb ciemny i akcent `green` działa natychmiast i jest zachowana po przeładowaniu, bez mignięcia jasnym motywem. Nadpisanie akcentu w kontekście „Praca” zmienia akcent tylko w tym kontekście.
7. **Druga przeglądarka:** po zalogowaniu w nowym profilu przeglądarki widoczne są te same konteksty, widgety, zadania i motyw.
8. **Wylogowanie:** po wylogowaniu i ponownym otwarciu karty widoczny jest ekran logowania, a lokalny cache jest pusty.
9. **Offline:** przy wyłączonej sieci karta pokazuje dane z cache i baner offline.
10. **Prywatność:** podczas scenariuszy 1–6 rozszerzenie nie wysyła żądań do żadnego hosta poza API.
