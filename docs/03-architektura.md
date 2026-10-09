# 03. Architektura

Dokument opisuje, **jak** zrealizować [specyfikację MVP](02-specyfikacja.md). Identyfikatory wymagań (`F-…`) odsyłają do specyfikacji.

## Przegląd

```
┌──────────────── Przeglądarka (Chrome / Brave) ────────────────┐
│  Nowa karta: WXT · Vue 3 · Nuxt UI                             │
│   ├─ TanStack Query ── persister ──► chrome.storage.local      │
│   │                                  (cache zapytań)           │
│   ├─ Pinia (stan UI) ─────────────► chrome.storage.local       │
│   │                                  (activeContextId)         │
│   └─ skrypt startowy motywu ◄─────── localStorage              │
│                                      (ostatni motyw efektywny) │
└────────────────────────────┬──────────────────────────────────┘
                             │ HTTPS · JSON · Authorization: Bearer
┌────────────────────────────▼──────────────────────────────────┐
│  API: Hono · Node 24                                           │
│   ├─ Better Auth             /api/auth/*                       │
│   └─ moduły                  settings · contexts · widgets · todos │
└────────────────────────────┬──────────────────────────────────┘
                             │ Drizzle ORM
                      ┌──────▼──────┐
                      │ PostgreSQL  │
                      └─────────────┘
```

Serwer jest źródłem prawdy. Rozszerzenie trzyma kopię danych w cache zapytań, żeby pulpit renderował się natychmiast, i odświeża ją w tle (stale-while-revalidate). Zmiany są optymistyczne.

## Stack

| Warstwa         | Technologia                                              | Rola                                                                       |
| --------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| Monorepo        | pnpm workspaces                                          | `apps/extension`, `apps/api`, `packages/shared`                            |
| Język           | TypeScript 6.0 (strict)                                  | cały kod; nie 7.x, bo `typescript-eslint` obsługuje TypeScript poniżej 6.1 |
| Rozszerzenie    | WXT (Manifest V3)                                        | build, manifest, dev z hot reloadem                                        |
| UI              | Vue 3, Nuxt UI (plugin `@nuxt/ui/vite`), Tailwind CSS v4 | komponenty, motywy                                                         |
| Dane w UI       | `@tanstack/vue-query` z persisterem                      | cache, odświeżanie, mutacje optymistyczne                                  |
| Stan UI         | Pinia                                                    | aktywny kontekst, tryb edycji                                              |
| Siatka          | `grid-layout-plus`                                       | przeciąganie i skalowanie widgetów                                         |
| Sortowanie list | `vue-draggable-plus`                                     | kolejność zadań i kontekstów                                               |
| i18n            | `vue-i18n`                                               | PL i EN                                                                    |
| Kolejność       | `fractional-indexing`                                    | pozycje jako indeksy ułamkowe                                              |
| ID              | UUIDv7 (np. pakiet `uuid`)                               | ID generowane po stronie klienta                                           |
| API             | Hono na Node 24 LTS (`@hono/node-server`)                | HTTP, klient RPC `hc`                                                      |
| Walidacja       | Zod, `@hono/zod-validator`                               | wspólne schematy dla frontu i API                                          |
| Auth            | Better Auth (e-mail i hasło, plugin `bearer`)            | konta i sesje                                                              |
| Baza            | PostgreSQL 18, Drizzle ORM, drizzle-kit                  | dane i migracje                                                            |
| Testy           | Vitest, `@vue/test-utils`, PGlite, Playwright            | jednostkowe, integracyjne, E2E                                             |
| Jakość          | ESLint, Prettier                                         | `pnpm check`                                                               |

Konkretne wersje pakietów ustalamy przy instalacji w Etapie 0 i zapisujemy w `package.json`.

## Struktura repozytorium

```
one-place/
├─ apps/
│  ├─ extension/
│  │  ├─ public/theme-boot.js     skrypt startowy motywu (klasyczny, blokujący)
│  │  ├─ src/                     srcDir WXT (aliasy @ i ~)
│  │  │  ├─ entrypoints/newtab/   index.html, main.ts, App.vue
│  │  │  ├─ assets/main.css       Tailwind (theme(static)) i Nuxt UI
│  │  │  ├─ api/                  klient hc<AppType>, token, obsługa 401
│  │  │  ├─ queries/              composables per zasób, klucze zapytań
│  │  │  ├─ stores/               Pinia: ui.ts
│  │  │  ├─ theme/                resolveTheme, applyTheme, cache motywu
│  │  │  ├─ features/
│  │  │  │  ├─ auth/              ekrany logowania i rejestracji
│  │  │  │  ├─ contexts/          przełącznik, pusty stan, zarządzanie
│  │  │  │  ├─ settings/          slideover ustawień (motyw, język)
│  │  │  │  └─ dashboard/         DashboardGrid, WidgetFrame, katalog widgetów
│  │  │  ├─ widgets/              registry.ts, types.ts, todo/
│  │  │  └─ i18n/                 pl.json, en.json
│  │  ├─ tests/e2e/               Playwright
│  │  └─ wxt.config.ts
│  └─ api/
│     ├─ src/
│     │  ├─ index.ts              serve()
│     │  ├─ app.ts                createApp({ db }) i eksport AppType
│     │  ├─ env.ts                walidacja zmiennych środowiskowych (Zod)
│     │  ├─ auth.ts               konfiguracja Better Auth
│     │  ├─ db/                   client.ts, schema/, migrations/
│     │  ├─ middleware/           requestId, logger, cors, requireAuth
│     │  ├─ lib/errors.ts         AppError, onError
│     │  └─ modules/              settings/, contexts/, widgets/, todos/
│     └─ test/                    createTestApp() na PGlite, fabryki danych
├─ packages/
│  └─ shared/src/                 schematy Zod, typy DTO, stałe (WIDGET_TYPES, ACCENT_COLORS, CONTEXT_ICONS)
├─ docs/
├─ scripts/generate-extension-key.mjs   klucz i stałe ID rozszerzenia
├─ docker-compose.yml             Postgres do developmentu
├─ .npmrc                         public-hoist-pattern dla @wxt-dev/* (wymagane przez WXT na Node 24)
└─ pnpm-workspace.yaml
```

## Pakiet `shared`

Jedno źródło prawdy dla kształtu danych. Używają go oba końce: API do walidacji wejścia, a rozszerzenie do formularzy, walidacji konfiguracji widgetów i typów.

```ts
// Stałe
export const ACCENT_COLORS = [
  'blue',
  'indigo',
  'violet',
  'pink',
  'rose',
  'orange',
  'amber',
  'green',
  'emerald',
  'teal',
] as const
export const CONTEXT_ICONS = [
  'i-lucide-briefcase',
  'i-lucide-house',
  'i-lucide-user',
  'i-lucide-heart',
  'i-lucide-code',
  'i-lucide-book-open',
  'i-lucide-graduation-cap',
  'i-lucide-dumbbell',
  'i-lucide-plane',
  'i-lucide-coffee',
  'i-lucide-music',
  'i-lucide-gamepad-2',
  'i-lucide-palette',
  'i-lucide-wallet',
  'i-lucide-shopping-cart',
  'i-lucide-star',
] as const // stała lista, bo ikony muszą być w paczce
export const WIDGET_TYPES = ['todo'] as const
export const GRID_COLUMNS = 12

// Motyw
export const ThemeSettingsSchema = z.object({
  schemaVersion: z.literal(1),
  mode: z.enum(['light', 'dark', 'system']),
  accent: z.enum(ACCENT_COLORS),
  background: z.discriminatedUnion('type', [
    z.object({ type: z.literal('none') }),
    // później: color | gradient | image
  ]),
})
export const ThemeOverrideSchema = ThemeSettingsSchema.omit({ schemaVersion: true }).partial()
export const DEFAULT_THEME: ThemeSettings = {
  schemaVersion: 1,
  mode: 'system',
  accent: 'blue',
  background: { type: 'none' },
}
export function resolveTheme(global: ThemeSettings, override?: ThemeOverride | null): ThemeSettings

// Konfiguracje widgetów: mapa typ → schemat
export const TodoConfigSchema = z.object({
  title: z.string().max(60).default(''),
  hideCompleted: z.boolean().default(false),
  source: z.discriminatedUnion('type', [z.object({ type: z.literal('local') })]),
})
export const widgetConfigSchemas = { todo: TodoConfigSchema } satisfies Record<WidgetType, ZodType>
```

Pakiet zawiera też schematy wejścia i DTO dla każdego zasobu (`CreateContextInput`, `ContextDto`, `WidgetDto`, `LayoutItem`, `TodoDto`…).

## Model danych

Tabele Better Auth (`user`, `session`, `account`, `verification`) mają standardowy kształt i są generowane przez CLI Better Auth do schematu Drizzle.

### Konwencje

- **ID: UUIDv7 generowany przez klienta.** Mutacja optymistyczna zna docelowe ID od razu, więc nie trzeba podmieniać tymczasowych identyfikatorów. Ponowienie `POST` z tym samym ID jest idempotentne (patrz [API](#api)).
- **`user_id` w każdej tabeli** z kluczem obcym do `user.id` i `ON DELETE CASCADE`. Każde zapytanie w serwisach filtruje po `user_id`.
- **`created_at`, `updated_at` (`timestamptz`) i `version` (`int`, start 1)** w każdej tabeli danych. Każdy zapis ustawia `updated_at = now()` i `version = version + 1`.
- **`position` jako indeks ułamkowy** (`text COLLATE "C"`). Kolacja `"C"` jest obowiązkowa, bo klucze `fractional-indexing` są porównywane bajtowo, a domyślna kolacja Postgresa może je sortować inaczej.

### Tabele

**`user_settings`**

| Kolumna                 | Typ                     | Uwagi                             |
| ----------------------- | ----------------------- | --------------------------------- |
| `user_id`               | `text` PK, FK `user.id` |                                   |
| `theme`                 | `jsonb`                 | `ThemeSettings`                   |
| `locale`                | `varchar(8)` null       | `null` oznacza język przeglądarki |
| `updated_at`, `version` |                         |                                   |

Wiersz powstaje leniwie. `GET /settings` zwraca wartości domyślne, gdy go nie ma, a `PATCH /settings` robi upsert. Rejestracja nie zależy więc od dodatkowego hooka.

**`contexts`**

| Kolumna                               | Typ                | Uwagi                        |
| ------------------------------------- | ------------------ | ---------------------------- |
| `id`                                  | `uuid` PK          |                              |
| `user_id`                             | `text` FK          | indeks `(user_id, position)` |
| `name`                                | `varchar(40)`      |                              |
| `icon`                                | `varchar(64)`      | z `CONTEXT_ICONS`            |
| `position`                            | `text COLLATE "C"` |                              |
| `theme_override`                      | `jsonb` null       | `ThemeOverride`              |
| `created_at`, `updated_at`, `version` |                    |                              |

**`widgets`**

| Kolumna                               | Typ                                          | Uwagi                     |
| ------------------------------------- | -------------------------------------------- | ------------------------- |
| `id`                                  | `uuid` PK                                    |                           |
| `user_id`                             | `text` FK                                    |                           |
| `context_id`                          | `uuid` FK `contexts.id`, `ON DELETE CASCADE` | indeks                    |
| `type`                                | `varchar(32)`                                | z `WIDGET_TYPES`          |
| `config`                              | `jsonb`                                      | walidowany schematem typu |
| `x`, `y`, `w`, `h`                    | `int`                                        |                           |
| `created_at`, `updated_at`, `version` |                                              |                           |

**`todo_items`**

| Kolumna                               | Typ                                         | Uwagi                          |
| ------------------------------------- | ------------------------------------------- | ------------------------------ |
| `id`                                  | `uuid` PK                                   |                                |
| `user_id`                             | `text` FK                                   |                                |
| `widget_id`                           | `uuid` FK `widgets.id`, `ON DELETE CASCADE` | indeks `(widget_id, position)` |
| `text`                                | `varchar(500)`                              |                                |
| `done`                                | `boolean` default `false`                   |                                |
| `position`                            | `text COLLATE "C"`                          |                                |
| `created_at`, `updated_at`, `version` |                                             |                                |

Kaskady: usunięcie użytkownika usuwa wszystko, usunięcie kontekstu usuwa jego widgety, a usunięcie widgetu usuwa jego zadania.

## API

Prefiks `/api`, JSON. Wszystkie endpointy poza `/api/auth/*` i `/api/health` wymagają sesji.

| Metoda   | Ścieżka                 | Wejście                                       | Wynik                                      |
| -------- | ----------------------- | --------------------------------------------- | ------------------------------------------ |
| `*`      | `/auth/*`               | Better Auth                                   | sign-up, sign-in, sign-out, get-session    |
| `GET`    | `/health`               |                                               | `{ status: 'ok' }`                         |
| `GET`    | `/settings`             |                                               | `SettingsDto` (domyślne, gdy brak wiersza) |
| `PATCH`  | `/settings`             | `{ theme?, locale? }`                         | `SettingsDto`                              |
| `GET`    | `/contexts`             |                                               | `ContextDto[]` posortowane po `position`   |
| `POST`   | `/contexts`             | `{ id, name, icon, position }`                | `ContextDto`                               |
| `PATCH`  | `/contexts/:id`         | `{ name?, icon?, position?, themeOverride? }` | `ContextDto`                               |
| `DELETE` | `/contexts/:id`         |                                               | `204`                                      |
| `GET`    | `/contexts/:id/widgets` |                                               | `WidgetDto[]`                              |
| `POST`   | `/contexts/:id/widgets` | `{ id, type, config, x, y, w, h }`            | `WidgetDto`                                |
| `PUT`    | `/contexts/:id/layout`  | `LayoutItem[]` (`{ id, x, y, w, h }`)         | `WidgetDto[]`                              |
| `PATCH`  | `/widgets/:id`          | `{ config }`                                  | `WidgetDto`                                |
| `DELETE` | `/widgets/:id`          |                                               | `204`                                      |
| `GET`    | `/widgets/:id/todos`    |                                               | `TodoDto[]` posortowane po `position`      |
| `POST`   | `/widgets/:id/todos`    | `{ id, text, position }`                      | `TodoDto`                                  |
| `PATCH`  | `/todos/:id`            | `{ text?, done?, position? }`                 | `TodoDto`                                  |
| `DELETE` | `/todos/:id`            |                                               | `204`                                      |

### Zasady

- **`POST` i `PATCH` zwracają pełny rekord** z aktualnymi `updatedAt` i `version`. Klient podmienia nim wpis w cache.
- **Idempotentne tworzenie.** `POST` z ID, które już istnieje u tego samego użytkownika, zwraca istniejący rekord ze statusem `200`. To samo ID u innego użytkownika daje `409 ID_CONFLICT`.
- **Układ zapisywany hurtowo.** `PUT /contexts/:id/layout` aktualizuje w jednej transakcji pozycje i rozmiary podanych widgetów. Każde ID musi należeć do tego kontekstu i użytkownika, w przeciwnym razie całe żądanie jest odrzucane (`400 LAYOUT_INVALID`). Widgety spoza listy pozostają bez zmian.
- **Walidacja typu widgetu.** `POST /contexts/:id/widgets` sprawdza, czy `type` należy do `WIDGET_TYPES`, oraz waliduje `config` schematem z `widgetConfigSchemas`. `POST /widgets/:id/todos` sprawdza, czy widget jest typu `todo`.
- **Konflikty: ostatni zapis wygrywa** (F-SYNC-06). Klient może wysyłać `version`, ale w MVP serwer go nie porównuje. Przejście na `409 VERSION_CONFLICT` jest w roadmapie.
- **Limity** (F-CTX-08, F-WGT-07, F-TODO-08) są sprawdzane w serwisach i zwracają `422 LIMIT_EXCEEDED`.
- **Trasy są definiowane łańcuchowo** i składane w `app.ts` przez `app.route()`, żeby `AppType` niósł pełne typy dla klienta `hc` (wymóg Hono RPC).

### Format błędów

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { "fieldErrors": {} } } }
```

| Status | `code`                               | Kiedy                                                   |
| ------ | ------------------------------------ | ------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`, `LAYOUT_INVALID` | niepoprawne dane wejściowe                              |
| 401    | `UNAUTHORIZED`                       | brak lub nieważna sesja                                 |
| 404    | `NOT_FOUND`                          | zasób nie istnieje **lub należy do innego użytkownika** |
| 409    | `ID_CONFLICT`                        | ID zajęte przez innego użytkownika                      |
| 422    | `LIMIT_EXCEEDED`                     | przekroczony limit liczności                            |
| 429    | (Better Auth)                        | rate limiting logowania                                 |
| 500    | `INTERNAL_ERROR`                     | błąd nieoczekiwany; szczegóły tylko w logach            |

Globalny `app.onError` mapuje `ZodError` na 400, `AppError` na jego status i kod, a pozostałe błędy na 500. Odpowiedź nigdy nie zawiera stack trace'a.

### Middleware

Kolejność: `requestId` → `logger` (ustrukturyzowane logi JSON z `requestId`) → `cors` → trasy auth → `requireAuth` → moduły.

- **`cors`**: `origin` tylko z listy `ALLOWED_ORIGINS`, `credentials: false`, nagłówki `Authorization` i `Content-Type`. Ekspozycja nagłówka `set-auth-token`.
- **`requireAuth`**: `auth.api.getSession({ headers })` i wstawienie użytkownika do `c.var.user`. Brak sesji daje 401.

### Better Auth

- `emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 }`.
- `session: { expiresIn: 30 dni, updateAge: 1 dzień }` (F-AUTH-03).
- `plugins: [bearer()]`: token sesji wraca w nagłówku `set-auth-token`, a klient wysyła go w `Authorization: Bearer`.
- `trustedOrigins`: te same originy co `ALLOWED_ORIGINS` (Better Auth sprawdza `Origin` przy żądaniach zmieniających stan).
- Adapter Drizzle (`provider: 'pg'`) na tej samej instancji bazy.
- Wbudowany rate limiting dla `/auth/*`.
- Długość `name` (1–50) walidowana w formularzu i po stronie serwera w `databaseHooks.user.create.before`, bo Better Auth domyślnie jej nie ogranicza.

### Struktura modułu

```
modules/contexts/
  routes.ts    trasy Hono z zValidator, wołają serwis, zwracają DTO
  service.ts   logika i zapytania Drizzle; każda funkcja przyjmuje userId
```

Serwisy nie znają Hono, a trasy nie znają Drizzle. `createApp({ db })` przyjmuje instancję bazy, więc testy podają PGlite, a produkcja Postgresa.

### Konfiguracja (env)

| Zmienna              | Przykład                                      | Opis                         |
| -------------------- | --------------------------------------------- | ---------------------------- |
| `DATABASE_URL`       | `postgres://one:one@localhost:5432/one_place` |                              |
| `BETTER_AUTH_SECRET` | losowy ciąg ≥ 32 znaki                        |                              |
| `BETTER_AUTH_URL`    | `http://localhost:3000`                       | publiczny adres API          |
| `ALLOWED_ORIGINS`    | `chrome-extension://<id>`                     | lista oddzielona przecinkami |
| `PORT`               | `3000`                                        |                              |
| `LOG_LEVEL`          | `info`                                        |                              |

`env.ts` waliduje zmienne przy starcie. Gdy któraś jest niepoprawna, proces kończy się z czytelnym komunikatem.

## Rozszerzenie

### Manifest

- `permissions: ['storage']`, bez `host_permissions`. Do API łączymy się przez CORS (wymaganie niefunkcjonalne „Uprawnienia”).
- Nadpisanie nowej karty: WXT generuje `chrome_url_overrides.newtab` z punktu wejścia `src/entrypoints/newtab/`.
- `key` w manifeście developerskim, żeby ID rozszerzenia (a więc origin w `ALLOWED_ORIGINS`) było stałe między instalacjami. Przy publikacji używamy klucza z panelu Chrome Web Store.
- Adres API pochodzi ze zmiennej `WXT_API_URL` ustawianej przy buildzie (domyślnie `http://localhost:3000`).

### Start nowej karty

1. **Motyw przed pierwszym renderem (F-THEME-05).** `public/theme-boot.js` to mały, klasyczny (nie modułowy) skrypt w `<head>`, który blokuje parsowanie, więc wykonuje się przed pierwszym malowaniem. Czyta z `localStorage` ostatni motyw efektywny i ustawia klasę `dark` oraz zmienne akcentu na `<html>`. Jest zgodny z CSP MV3, bo jest plikiem z rozszerzenia, a nie skryptem inline.
2. **Odtworzenie cache.** Persister TanStack Query wczytuje cache z `chrome.storage.local`, a Pinia wczytuje `activeContextId`.
3. **Montaż aplikacji.** Bez tokenu pokazuje się ekran logowania. Z tokenem renderuje się pulpit z cache, a zapytania nieświeże są odświeżane w tle.

`performance.mark('dashboard-rendered')` pozwala mierzyć wymaganie wydajnościowe.

### Warstwa danych

**Klient API (`src/api/`).** `hc<AppType>(WXT_API_URL)` z nagłówkiem `Authorization: Bearer <token>`. Token jest trzymany w `chrome.storage.local` i w pamięci (kopia wczytana przy starcie). Odpowiedź 401 z dowolnego żądania wywołuje `handleUnauthorized()`: czyści token, cache zapytań i zapisany cache, a potem przełącza na ekran logowania z komunikatem (F-AUTH-05). Logowanie i rejestracja idą przez `createAuthClient` z `better-auth/vue`, a token z nagłówka `set-auth-token` trafia do storage.

**Klucze zapytań:**

| Klucz                    | Endpoint                    | Composable              |
| ------------------------ | --------------------------- | ----------------------- |
| `['settings']`           | `GET /settings`             | `useSettings()`         |
| `['contexts']`           | `GET /contexts`             | `useContexts()`         |
| `['widgets', contextId]` | `GET /contexts/:id/widgets` | `useWidgets(contextId)` |
| `['todos', widgetId]`    | `GET /widgets/:id/todos`    | `useTodos(widgetId)`    |

Mutacje są udostępniane przez composables w `src/queries/` (`useCreateContext()`, `useSaveLayout()`, `useAddTodo()`…). **Widgety i komponenty nigdy nie wołają API bezpośrednio.**

**Schemat mutacji optymistycznej (F-SYNC-04):**

1. `onMutate`: `cancelQueries(klucz)`, zapamiętanie poprzedniego stanu, `setQueryData` z optymistyczną zmianą (rekord z ID wygenerowanym przez klienta).
2. `mutationFn`: wywołanie API.
3. `onError`: przywrócenie poprzedniego stanu i toast z komunikatem błędu.
4. `onSuccess`: podmiana rekordu na wersję z serwera.

**Persister (F-SYNC-01, F-SYNC-07):**

- storage: adapter na `chrome.storage.local`, klucz `one-place:query-cache`;
- `buster`: stała `CACHE_SCHEMA_VERSION`, zwiększana przy każdej zmianie kształtu DTO, co powoduje odrzucenie starego cache;
- `maxAge`: 30 dni;
- zapis ograniczony do jednego na sekundę (throttle);
- zapisywane są tylko zapytania zakończone sukcesem.

**Zachowanie sieciowe:**

- `refetchOnWindowFocus: true` (F-SYNC-03); inne otwarte karty odświeżają dane przy powrocie do nich;
- `retry: 3` z rosnącym odstępem dla zapytań i bez ponowień dla błędów 4xx;
- `networkMode: 'online'`: offline mutacje są wstrzymywane i wznawiane po powrocie sieci (F-SYNC-05). Baner offline korzysta z `onlineManager`.

**Stan UI (Pinia, `stores/ui.ts`):**

- `activeContextId` zapisywany w `chrome.storage.local` (osobno na urządzeniu, F-CTX-04), z rozwiązaniem awaryjnym na pierwszy kontekst;
- `editMode` tylko w pamięci (F-GRID-02).

### Motywy

- `resolveTheme(settings.theme, activeContext.themeOverride)` daje motyw efektywny. Złożenie działa pole po polu: każde pole nadpisania, które nie jest `undefined`, zastępuje pole globalne.
- `applyTheme(theme)`:
  - ustawia lub zdejmuje klasę `dark` na `<html>`; dla `system` nasłuchuje `matchMedia('(prefers-color-scheme: dark)')`;
  - ustawia akcent przez nadpisanie zmiennych `--ui-color-primary-50 … -950` na `:root` wartościami `var(--color-<accent>-<odcień>)`;
  - zapisuje motyw efektywny w `localStorage` dla `theme-boot.js`.
- Ten sam mechanizm zmiennych CSS jest używany w `theme-boot.js` i w aplikacji, więc oba miejsca dają identyczny wynik.
- Wbudowane zarządzanie trybem kolorów Nuxt UI jest wyłączone (`colorMode: false` w pluginie Vite), bo trybem zarządza moduł `theme/`.
- Akcent ustawiamy jako styl inline na `<html>`. Wygrywa on z regułą `:root`, którą Nuxt UI wstrzykuje w trakcie działania.
- Palety wszystkich `ACCENT_COLORS` muszą być obecne w wynikowym CSS. Tailwind v4 domyślnie usuwa nieużywane zmienne motywu, więc `main.css` importuje Tailwind przez `@import 'tailwindcss' theme(static)`. Bez tego `var(--color-green-500)` jest puste, a tło przycisków znika (sprawdzone w prototypie).
- Tło pulpitu (F-THEME-06): `applyTheme` w MVP ignoruje `background.type === 'none'`. Kolejne typy tła dojdą jako nowe gałęzie unii i nowa obsługa w `applyTheme`.

### System widgetów

**Kontrakt (`widgets/types.ts`):**

```ts
interface WidgetDefinition<TConfig> {
  type: WidgetType // z packages/shared
  name: string // klucz i18n
  description: string // klucz i18n
  icon: string // ikona Lucide
  defaultSize: { w: number; h: number }
  minSize: { w: number; h: number }
  configSchema: ZodType<TConfig> // z widgetConfigSchemas
  defaultConfig: TConfig
  component: AsyncComponentLoader // otrzymuje props { widget: WidgetDto<TConfig> }
  settingsComponent?: AsyncComponentLoader
}
```

`widgets/registry.ts` eksportuje mapę `type → WidgetDefinition`. Komponenty są ładowane leniwie (`defineAsyncComponent`).

**`WidgetFrame.vue`** opakowuje każdy widget:

- nagłówek z tytułem i menu (Ustawienia, Usuń); w trybie edycji nagłówek jest uchwytem przeciągania (F-GRID-03);
- `onErrorCaptured`: komunikat błędu i przycisk „Spróbuj ponownie”, który ponownie montuje komponent (F-WGT-05);
- nieznany typ (brak w rejestrze): placeholder z F-WGT-06;
- walidacja `config` przez `configSchema.safeParse`. Gdy się nie powiedzie, ramka scala dane z `defaultConfig` i zapisuje ostrzeżenie w konsoli.

**Źródła danych.** Widget, którego dane mogą w przyszłości pochodzić z różnych miejsc, oddziela UI od źródła. Dla Zadań:

```ts
interface TaskSource {
  items: Ref<TaskItem[]> // { id, text, done, position }
  isLoading: Ref<boolean>
  error: Ref<unknown>
  capabilities: { reorder: boolean; dueDates: boolean }
  add(text: string): void
  toggle(id: string): void
  edit(id: string, text: string): void
  remove(id: string): void
  move(id: string, beforeId: string | null, afterId: string | null): void
}
function useTaskSource(config: TodoConfig, widgetId: string): TaskSource
```

- `TaskList.vue` jest czysto prezentacyjny: dostaje `items` i `capabilities`, emituje `add`, `toggle`, `edit`, `remove`, `move`.
- `TodoWidget.vue` łączy `useTaskSource()` z `TaskList`.
- W MVP jedyną implementacją jest `local` oparta na `useTodos()`. Nowa pozycja to `generateKeyBetween(poprzednia, następna)`.
- Przyszłe integracje (np. Todoist) idą **przez backend**: tokeny OAuth są przechowywane zaszyfrowane na serwerze, a backend tłumaczy dane zewnętrzne na `TaskItem`.

**Dodanie nowego typu widgetu:**

1. `packages/shared`: typ w `WIDGET_TYPES` i schemat konfiguracji w `widgetConfigSchemas`.
2. `apps/extension/src/widgets/<typ>/`: definicja i komponenty, wpis w `registry.ts`, klucze i18n PL i EN.
3. Jeśli widget ma dane: moduł w `apps/api/src/modules/`, tabela, migracja i testy.

### Siatka

- `DashboardGrid.vue` jest **jedynym** miejscem, które zna `grid-layout-plus`. Reszta aplikacji operuje na `LayoutItem[]`, więc wymiana biblioteki dotyczy jednego komponentu (ryzyko R4).
- Konfiguracja: `colNum: 12`, stała `rowHeight`, `verticalCompact: true`, `isDraggable` i `isResizable` równe `editMode`, przeciąganie tylko za nagłówek ramki, `minW` i `minH` z definicji typu.
- Zapis: zdarzenie zmiany układu → debounce 500 ms → porównanie z układem w cache → `useSaveLayout()` tylko przy faktycznej różnicy.
- Nowy widget: `x = 0`, `y = max(y + h)` istniejących, rozmiar `defaultSize`.
- Poniżej 768 px (`useBreakpoints` z VueUse) zamiast siatki renderowana jest kolumna `WidgetFrame` posortowana po `(y, x)`, a przycisk edycji jest ukryty (F-GRID-05).

### i18n

- `vue-i18n` z plikami `pl.json` i `en.json`. Klucze są pogrupowane według funkcji (`auth.*`, `contexts.*`, `widgets.todo.*`).
- Wybór języka zgodnie z F-I18N-02. Lokalizacja Nuxt UI jest przełączana razem z `vue-i18n`.

## Testy

| Poziom                  | Narzędzia                                                        | Zakres                                                                                      |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Jednostkowe: `shared`   | Vitest                                                           | schematy, `resolveTheme`, walidacja układu                                                  |
| Integracyjne: `api`     | Vitest, `app.request()`, PGlite                                  | każdy endpoint; świeża baza z migracjami w każdym pliku testowym                            |
| Komponenty: `extension` | Vitest, `@vue/test-utils`, fake-browser WXT                      | `TaskList`, `WidgetFrame` (błąd, nieznany typ), `applyTheme`, composables z mockowanym API  |
| E2E                     | Playwright, Chromium z rozszerzeniem, API na testowym Postgresie | scenariusze akceptacyjne z [02-specyfikacja.md](02-specyfikacja.md#kryteria-akceptacji-mvp) |

**Obowiązkowe przypadki dla każdego chronionego endpointu:** brak sesji daje 401, zasób innego użytkownika daje 404, niepoprawne dane dają 400.

**Prywatność w E2E:** test nasłuchuje `page.on('request')` i sprawdza, że jedynym hostem docelowym jest API.

`pnpm check` w katalogu głównym uruchamia lint, typecheck i testy (bez E2E). `pnpm test:e2e` uruchamia E2E.

## Development lokalny

```bash
docker compose up -d          # Postgres
pnpm install
pnpm --filter api db:migrate
pnpm dev                      # API (watch) + WXT dev, który uruchamia przeglądarkę z rozszerzeniem
```

## Rejestr decyzji

| #   | Decyzja                                                                      | Odrzucone alternatywy                                        | Uzasadnienie                                                                                                 |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| D1  | Backend jest źródłem prawdy, lokalnie tylko cache                            | `chrome.storage.sync`, tylko lokalnie                        | synchronizacja między urządzeniami bez limitów `storage.sync`                                                |
| D2  | TanStack Query z persisterem (stale-while-revalidate, mutacje optymistyczne) | własny silnik sync (outbox i delta), Zero/Electric/PowerSync | najkrótsza droga do działającego MVP; API z `version` i `updatedAt` pozwala później przejść na własny silnik |
| D3  | Hono na Node 24 LTS, docelowo VPS                                            | Cloudflare Workers                                           | wybór autora; wdrożenie po MVP                                                                               |
| D4  | PostgreSQL i Drizzle; PGlite w testach                                       | SQLite                                                       | `jsonb`, współbieżne zapisy wielu użytkowników, zgodność z silnikami synchronizacji                          |
| D5  | Better Auth, e-mail i hasło, plugin `bearer`                                 | Google OAuth, klucz synchronizacji, ciasteczka               | prostota; token w nagłówku działa przewidywalnie z originu rozszerzenia; magic link później                  |
| D6  | Logowanie wymagane w MVP                                                     | tryb lokalny z opcjonalnym kontem                            | mniej przypadków brzegowych; tryb bez konta przed publikacją                                                 |
| D7  | Vue 3, Nuxt UI, WXT                                                          | React (`react-grid-layout`, `cmdk`), Svelte                  | preferencja autora; `UCommandPalette` pod przyszłe Cmd+K                                                     |
| D8  | Motyw globalny z opcjonalnym nadpisaniem w kontekście                        | tylko globalny, tylko per kontekst                           | elastyczność bez migracji przy dodaniu tła per kontekst                                                      |
| D9  | Brak domyślnych kontekstów                                                   | seed „Praca” i „Prywatne”                                    | użytkownik sam decyduje o strukturze                                                                         |
| D10 | UUIDv7 generowany przez klienta                                              | ID z serwera                                                 | mutacje optymistyczne bez podmiany ID, idempotentne `POST`                                                   |
| D11 | Jeden widget Zadania z wymiennym źródłem danych                              | osobny widget per integracja                                 | jeden UI listy, zmiana źródła w ustawieniach                                                                 |
| D12 | Bez `host_permissions`, CORS z allowlistą originów                           | `host_permissions` do API                                    | mniej uprawnień, łatwiejsze review w sklepie                                                                 |
| D13 | Integracje zewnętrzne przez backend                                          | wywołania z rozszerzenia                                     | tokeny poza przeglądarką, konfiguracja raz na koncie                                                         |

## Ryzyka

| #   | Ryzyko                                                                                                                                            | Kiedy sprawdzamy                                     | Plan awaryjny                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| R1  | Integracja WXT z `@nuxt/ui/vite` (konfiguracja Vite, Tailwind v4, brak `vue-router`)                                                              | Etap 0                                               | czysty Vite z ręcznie złożonym manifestem lub `@crxjs/vite-plugin`       |
| R2  | Ikony Nuxt UI pobierane w trakcie działania z API Iconify zamiast z paczki                                                                        | Etap 0: zakładka Network, potem test E2E prywatności | zainstalowane kolekcje `@iconify-json/lucide` i jawne bundlowanie ikon   |
| R3  | Zmiana akcentu w trakcie działania: zmienne `--ui-color-primary-*`, obecność palet w CSS (Tailwind v4), wyłączenie wbudowanego color mode Nuxt UI | Etap 0                                               | jawne zdefiniowanie palet w CSS; własny zestaw zmiennych akcentu         |
| R4  | `grid-layout-plus`: stan utrzymania i zgodność z aktualnym Vue                                                                                    | Etap 3                                               | gridstack.js za tym samym interfejsem `DashboardGrid.vue`                |
| R5  | Better Auth z originem `chrome-extension://` (sprawdzanie `Origin`, `trustedOrigins`, ekspozycja `set-auth-token` przez CORS)                     | Etap 1                                               | konfiguracja `trustedOrigins` lub własny endpoint wymiany sesji na token |
| R6  | Różnice w Brave (Shields, polityki storage)                                                                                                       | Etap 6, ręcznie                                      | dokumentacja ograniczeń; poprawki punktowe                               |
| R7  | Utrata zmian offline po zamknięciu karty                                                                                                          | świadome ograniczenie MVP                            | trwała kolejka mutacji lub własny silnik sync (roadmapa)                 |
