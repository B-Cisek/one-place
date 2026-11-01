# 04. Roadmapa

## Jak pracujemy

- Każdy etap dostaje własny plan implementacji, rozpisany na małe kroki przed rozpoczęciem pracy.
- Kod powstaje w trybie TDD: najpierw test, potem implementacja.
- Etap jest skończony, gdy spełnia swoją definicję ukończenia (DoD), a `pnpm check` przechodzi.
- Etapy po MVP przed planem implementacji dostają własną krótką specyfikację, bo ich szczegóły (np. model danych Pomodoro czy harmonogram health-checków) nie są jeszcze ustalone.

## MVP (demo)

### Etap 0. Fundament i sprawdzenie ryzyk

**Cel:** działający szkielet monorepo i odpowiedź na ryzyka R1–R3, zanim powstanie właściwy kod.

**Plan nauki krok po kroku:** [05-implementacja-poczatkowa.md](05-implementacja-poczatkowa.md).

**Zakres:**

- monorepo pnpm (`apps/extension`, `apps/api`, `packages/shared`), TypeScript strict, ESLint, Prettier, Vitest, `pnpm check`;
- WXT z Vue 3, Nuxt UI (`@nuxt/ui/vite`) i Tailwind v4, punkt wejścia `newtab`, stały `key` w manifeście;
- **R1:** komponent Nuxt UI renderuje się na nowej karcie;
- **R2:** ikona Lucide wyświetla się bez żądań do API Iconify;
- **R3:** zmiana akcentu w trakcie działania przez zmienne `--ui-color-primary-*` i tryb ciemny sterowany własną klasą;
- Hono na Node z `/api/health` (sprawdza połączenie z bazą), `env.ts`, `createApp({ db, allowedOrigins })`, CORS;
- Drizzle z Postgresem (`docker-compose.yml`), helper `createTestApp()` na PGlite;
- połączenie nowej karty z API przez klienta Hono RPC (`hc<AppType>`), plakietka ze stanem API;
- pomiar rozmiaru startowego JS i ustalenie budżetu.

**DoD:** `pnpm dev` uruchamia API i przeglądarkę z rozszerzeniem. Nowa karta pokazuje przycisk Nuxt UI z ikoną bez żądań do zewnętrznych hostów, akcent zmienia się w trakcie działania, a plakietka pokazuje stan API. `/api/health` odpowiada, testy na PGlite przechodzą. Dla każdego ryzyka R1–R3 jest zapisany wynik, a w razie porażki wybrany plan awaryjny.

### Etap 1. Logowanie

**Wymagania:** F-AUTH-01 … F-AUTH-06.

**Plan nauki krok po kroku:** [06-etap-1-logowanie.md](06-etap-1-logowanie.md).

**Zakres:**

- API: Better Auth (e-mail i hasło, `bearer`, `trustedOrigins`, rate limiting), tabele auth w Drizzle, konfiguracja `drizzle-kit` i pierwsza migracja, `requestId`, `logger`, `requireAuth`, `app.onError` i format błędów;
- rozszerzenie: klient API z tokenem, `createAuthClient`, ekrany logowania i rejestracji (`UForm` ze schematami z `shared`), obsługa 401, wylogowanie;
- infrastruktura i18n (`vue-i18n`, PL i EN dla ekranów auth);
- **R5:** potwierdzenie działania Better Auth z originem `chrome-extension://`.

**DoD:** da się założyć konto, zalogować, przeładować kartę bez utraty sesji i wylogować. Testy API pokrywają 401 dla chronionego endpointu testowego.

### Etap 2. Konteksty i warstwa danych

**Wymagania:** F-CTX-01 … F-CTX-08, F-SYNC-01 … F-SYNC-07, F-I18N-01 … F-I18N-03.

**Plan nauki krok po kroku:** [07-etap-2-konteksty.md](07-etap-2-konteksty.md).

**Zakres:**

- API: moduły `settings` (z leniwym tworzeniem wiersza) i `contexts`, idempotentne `POST`, limity, testy 401/404/400;
- rozszerzenie: TanStack Query z persisterem na `chrome.storage.local` (`buster`, throttle), wzorzec mutacji optymistycznej, `stores/ui.ts` z `activeContextId`;
- pusty stan „pierwszy kontekst”, przełącznik w nagłówku, zarządzanie kontekstami (nazwa, ikona, kolejność, usuwanie z potwierdzeniem);
- szkielety ładowania, baner offline, toasty błędów;
- wybór języka w ustawieniach.

**DoD:** konteksty działają zgodnie ze specyfikacją. Po przeładowaniu karty pulpit pojawia się z cache bez szkieletów. Odrzucona przez API zmiana jest cofana z toastem.

### Etap 3. Siatka i system widgetów

**Wymagania:** F-GRID-01 … F-GRID-05, F-WGT-01 … F-WGT-07.

**Plan nauki krok po kroku:** [08-etap-3-siatka-i-widgety.md](08-etap-3-siatka-i-widgety.md).

**Zakres:**

- `shared`: `WIDGET_TYPES`, `widgetConfigSchemas`, schematy układu;
- API: moduł `widgets` (`GET`, `POST`, `PATCH`, `DELETE`, `PUT layout` w transakcji), walidacja typu i konfiguracji, limity;
- rozszerzenie: kontrakt `WidgetDefinition`, `registry.ts`, `WidgetFrame` (menu ładowane przy pierwszym kliknięciu, błędy, nieznany typ), odczyt konfiguracji przez `resolveConfig` w komponencie widgetu, podgląd na CSS grid i leniwy `GridEditor` z `grid-layout-plus` w trybie edycji, katalog widgetów, zapis układu z debounce, widok jednokolumnowy;
- typ `todo` istnieje w rejestrze z komponentem-zaślepką (sam tytuł), żeby siatkę można było testować przed Etapem 4;
- liczba widgetów w modalu usuwania kontekstu (F-CTX-07); w Etapie 2 modal jej nie pokazuje, bo widgetów jeszcze nie ma;
- **R4:** ocena `grid-layout-plus`.

**DoD:** w trybie edycji można dodać, przesunąć, przeskalować i usunąć widget, a układ zostaje zachowany po przeładowaniu. Błąd rzucony w zaślepce nie wywraca pulpitu.

### Etap 4. Widget Zadania

**Wymagania:** F-TODO-01 … F-TODO-08.

**Plan nauki krok po kroku:** [09-etap-4-zadania.md](09-etap-4-zadania.md).

**Zakres:**

- API: moduł `todos` z sortowaniem po `position COLLATE "C"`, limit 500, sprawdzenie typu widgetu;
- rozszerzenie: `useTodos()`, `TaskSource` z implementacją `local`, `TaskList.vue` (dodawanie, checkbox, edycja w miejscu, usuwanie, przeciąganie przez `vue-draggable-plus`), w `TodoSettings.vue` pole „Ukryj ukończone”.

Z Etapu 3 są już gotowe `TodoConfigSchema` ze źródłem `{ type: 'local' }` w konfiguracji domyślnej oraz `TodoSettings.vue` z tytułem, więc Etap 4 dopisuje „Ukryj ukończone”, listę zadań i moduł `todos`.

**DoD:** wszystkie operacje na zadaniach działają optymistycznie i przetrwają przeładowanie. `TaskList` ma testy komponentu niezależne od API.

### Etap 5. Motywy

**Wymagania:** F-THEME-01 … F-THEME-06.

**Plan nauki krok po kroku:** [10-etap-5-motywy.md](10-etap-5-motywy.md).

**Zakres:**

- `shared`: `ThemeSettingsSchema`, `ThemeOverrideSchema`, `resolveTheme` z testami;
- API: kolumny `user_settings.theme` i `contexts.theme_override` z nową migracją, `theme` w `PATCH /settings` i `themeOverride` w `PATCH /contexts/:id`, zmiana `CACHE_SCHEMA_VERSION` (w Etapie 2 tych kolumn jeszcze nie ma);
- rozszerzenie: `applyTheme`, `public/theme-boot.js`, ustawienia globalne (tryb, próbki akcentów), sekcja „Wygląd” w ustawieniach kontekstu z opcją „Używaj motywu globalnego”;
- obsługa zmiany motywu systemu na żywo.

**DoD:** motyw globalny i nadpisanie w kontekście działają natychmiast i są zachowane po przeładowaniu bez mignięcia.

### Etap 6. Domknięcie MVP

**Zakres:**

- testy E2E dla wszystkich 10 scenariuszy akceptacyjnych, w tym test prywatności;
- komplet tłumaczeń EN;
- pomiar wydajności (pierwszy render z cache poniżej 200 ms) i sprawdzenie budżetu JS;
- ręczna checklista w Brave (R6): instalacja, logowanie, nowa karta, motyw, siatka, zadania;
- README: uruchomienie lokalne, struktura, odnośniki do `docs/`.

**DoD:** wszystkie kryteria sukcesu z [01-wizja.md](01-wizja.md#kryteria-sukcesu-mvp) są spełnione. **Demo gotowe.**

## Po MVP

Kolejność jest propozycją i może się zmienić po demie.

### Etap 7. Wdrożenie na VPS

Postgres produkcyjny, proces API pod systemd lub w kontenerze, reverse proxy z HTTPS i domeną, backupy bazy (`pg_dump` z rotacją), migracje przy wdrożeniu, produkcyjny `WXT_API_URL`. Ten etap jest pierwszy, bo bez niego synchronizacja między urządzeniami nie działa w praktyce.

### Etap 8. Kolejne widgety

Każdy widget dostaje własną krótką specyfikację.

- **Notatki:** szybkie notatki; edytor do wyboru w specyfikacji.
- **Linki:** zapisane linki z faviconami (favicony bez zewnętrznych usług lub jako uprawnienie opcjonalne).
- **Pomodoro:** timer w service workerze (`chrome.alarms`), powiadomienia jako uprawnienie opcjonalne (`optional_permissions`).
- **Pogoda:** Open-Meteo przez backend z cache po stronie serwera; lokalizacja wybierana ręcznie (bez uprawnienia geolokalizacji).

### Etap 9. Paleta Cmd+K

`UCommandPalette` z rejestrem akcji: przełączanie kontekstu, dodawanie widgetu, ustawienia. Definicja widgetu dostaje opcjonalne pole `commands`, przez które widgety dopisują własne akcje (np. „Dodaj zadanie”).

### Etap 10. Health-checki

Sprawdzanie uruchamiane cyklicznie na backendzie, więc monitoring działa także przy zamkniętej przeglądarce. Lista monitorowanych endpointów i VPS-ów, historia statusów, widget z podglądem. Zależy od Etapu 7.

### Etap 11. Publikacja w Chrome Web Store

- tryb bez konta: dane tylko lokalnie, a przy zalogowaniu migracja na konto;
- wysyłka e-maili: reset hasła, weryfikacja adresu, logowanie magic linkiem;
- eksport danych i usunięcie konta (RODO), polityka prywatności;
- nazwa i opis rozszerzenia w `_locales`, zrzuty ekranu, uzasadnienie uprawnień;
- klucz rozszerzenia ze sklepu w `ALLOWED_ORIGINS`.

## Pomysły bez terminu

- tło pulpitu: kolor, gradient, obraz (także per kontekst; obraz wymaga przechowywania plików);
- automatyczne przełączanie kontekstów według harmonogramu (np. „Praca” w dni robocze 9–17);
- osobne układy siatki per breakpoint;
- integracja Zadań z Todoist (nowe źródło w `TaskSource`, OAuth przez backend);
- wykrywanie konfliktów zapisu (`409 VERSION_CONFLICT` na podstawie `version`);
- trwała kolejka mutacji offline lub własny silnik synchronizacji;
- logowanie przez Google;
- obsługa przeciągania z klawiatury (dostępność).
