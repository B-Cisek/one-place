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
│  │  │  ├─ lib/                  positions.ts (indeks ułamkowy), by-position.ts (sortowanie jak w API)
│  │  │  ├─ stores/               Pinia: ui.ts
│  │  │  ├─ theme/                resolveTheme, applyTheme, cache motywu
│  │  │  ├─ features/
│  │  │  │  ├─ auth/              ekrany logowania i rejestracji
│  │  │  │  ├─ contexts/          przełącznik, pusty stan, zarządzanie
│  │  │  │  ├─ settings/          slideover ustawień (motyw, język)
│  │  │  │  ├─ dashboard/         ContextDashboard, DashboardGrid (podgląd), GridEditor (edycja), WidgetFrame, WidgetActions, layout.ts
│  │  │  │  └─ widgets/           WidgetCatalog, use-add-widget.ts (katalog i dodawanie)
│  │  │  ├─ widgets/              registry.ts, types.ts, config.ts (resolveConfig), todo/
│  │  │  │  └─ todo/              TodoWidget, TodoSettings, TaskList (prezentacyjny), task-source.ts, local-task-source.ts
│  │  │  └─ i18n/                 pl.json, en.json
│  │  ├─ tests/e2e/               Playwright
│  │  ├─ nuxt-ui.config.ts        opcje Nuxt UI wspólne dla buildu i testów komponentów
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
// Stałe widgetów bez Zoda (widget-types.ts): WIDGET_TYPES, GRID_COLUMNS, MAX_WIDGETS_PER_CONTEXT,
// WIDGET_SIZES (rozmiar minimalny i domyślny typu), isWidgetType(), WidgetDto
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

// Konfiguracje widgetów (widgets.ts): mapa typ → schemat. Każde pole ma wartość domyślną,
// więc schemat.parse({}) daje konfigurację domyślną.
export const TodoConfigSchema = z.object({
  title: z.string().trim().max(60).default(''),
  hideCompleted: z.boolean().default(false),
  source: z
    .discriminatedUnion('type', [z.object({ type: z.literal('local') })])
    .default({ type: 'local' }),
})
export const widgetConfigSchemas = { todo: TodoConfigSchema } satisfies Record<WidgetType, ZodType>
```

Pakiet zawiera też schematy wejścia i DTO dla każdego zasobu (`CreateContextInput`, `ContextDto`, `WidgetDto`, `LayoutItem`, `TodoDto`…).

**Pliki z Zodem i bez niego.** Stałe i typy widgetów, których rozszerzenie potrzebuje na ścieżce startowej, są w `widget-types.ts`, a schematy w `widgets.ts`. `"sideEffects": false` usuwa z paczki tylko pliki, z których nic nie jest importowane, więc import jednej stałej z pliku ze schematami dokładał do startowego JS cały rdzeń Zoda (około 93 kB, pomiar z Etapu 3). Na ścieżce startowej rozszerzenia importuje się tylko pliki bez Zoda.

## Model danych

Tabele Better Auth (`user`, `session`, `account`, `verification`) mają standardowy kształt i są generowane przez CLI Better Auth do schematu Drizzle.

### Konwencje

- **ID: UUIDv7 generowany przez klienta.** Mutacja optymistyczna zna docelowe ID od razu, więc nie trzeba podmieniać tymczasowych identyfikatorów. Ponowienie `POST` z tym samym ID jest idempotentne (patrz [API](#api)).
- **`user_id` w każdej tabeli** z kluczem obcym do `user.id` i `ON DELETE CASCADE`. Każde zapytanie w serwisach filtruje po `user_id`.
- **`created_at`, `updated_at` (`timestamptz`) i `version` (`int`, start 1)** w każdej tabeli danych. Każdy zapis ustawia `updated_at = now()` i `version = version + 1`.
- **`position` jako indeks ułamkowy** (`text COLLATE "C"`). Kolacja `"C"` jest obowiązkowa, bo klucze `fractional-indexing` są porównywane bajtowo, a domyślna kolacja Postgresa może je sortować inaczej (np. `en_US.utf8` stawia `Zz` za `a0`). Drizzle nie ma opcji kolacji kolumny, więc kolumnę tworzy `customType` z `dataType: () => 'text COLLATE "C"'` (`db/schema/columns.ts`). Test migracji sprawdza `collation_name` kolumny, bo PGlite zawsze sortuje bajtowo.
- **Listy sortowane po `(position, id)`.** Dwa urządzenia mogą nadać tę samą pozycję. `id` daje wtedy stabilną kolejność, a rozszerzenie sortuje w cache tak samo (porównanie bajtowe, nie `localeCompare`).

### Tabele

**`user_settings`**

| Kolumna                 | Typ                     | Uwagi                             |
| ----------------------- | ----------------------- | --------------------------------- |
| `user_id`               | `text` PK, FK `user.id` |                                   |
| `theme`                 | `jsonb`                 | `ThemeSettings`, od Etapu 5       |
| `locale`                | `varchar(8)` null       | `null` oznacza język przeglądarki |
| `updated_at`, `version` |                         |                                   |

Wiersz powstaje leniwie. `GET /settings` zwraca wartości domyślne, gdy go nie ma, a `PATCH /settings` robi upsert (`onConflictDoUpdate`, `version` zwiększane w SQL). Rejestracja nie zależy więc od dodatkowego hooka.

W Etapie 2 tabela ma tylko `locale`. Kolumny `user_settings.theme` i `contexts.theme_override` dochodzą w Etapie 5 razem z nową migracją i zmianą `CACHE_SCHEMA_VERSION`.

**`contexts`**

| Kolumna                               | Typ                | Uwagi                        |
| ------------------------------------- | ------------------ | ---------------------------- |
| `id`                                  | `uuid` PK          |                              |
| `user_id`                             | `text` FK          | indeks `(user_id, position)` |
| `name`                                | `varchar(40)`      |                              |
| `icon`                                | `varchar(64)`      | z `CONTEXT_ICONS`            |
| `position`                            | `text COLLATE "C"` |                              |
| `theme_override`                      | `jsonb` null       | `ThemeOverride`, od Etapu 5  |
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

| Metoda   | Ścieżka                 | Wejście                                       | Wynik                                       |
| -------- | ----------------------- | --------------------------------------------- | ------------------------------------------- |
| `*`      | `/auth/*`               | Better Auth                                   | sign-up, sign-in, sign-out, get-session     |
| `GET`    | `/health`               |                                               | `{ status: 'ok' }`                          |
| `GET`    | `/me`                   |                                               | `{ id, name, email }` (chroniony)           |
| `GET`    | `/settings`             |                                               | `SettingsDto` (domyślne, gdy brak wiersza)  |
| `PATCH`  | `/settings`             | `{ theme?, locale? }`                         | `SettingsDto`                               |
| `GET`    | `/contexts`             |                                               | `ContextDto[]` posortowane po `position`    |
| `POST`   | `/contexts`             | `{ id, name, icon, position }`                | `ContextDto`                                |
| `PATCH`  | `/contexts/:id`         | `{ name?, icon?, position?, themeOverride? }` | `ContextDto`                                |
| `DELETE` | `/contexts/:id`         |                                               | `204`                                       |
| `GET`    | `/contexts/:id/widgets` |                                               | `WidgetDto[]`                               |
| `POST`   | `/contexts/:id/widgets` | `{ id, type, config, x, y, w, h }`            | `WidgetDto`                                 |
| `PUT`    | `/contexts/:id/layout`  | `LayoutItem[]` (`{ id, x, y, w, h }`)         | `WidgetDto[]`                               |
| `PATCH`  | `/widgets/:id`          | `{ config }`                                  | `WidgetDto`                                 |
| `DELETE` | `/widgets/:id`          |                                               | `204`                                       |
| `GET`    | `/widgets/:id/todos`    |                                               | `TodoDto[]` posortowane po `(position, id)` |
| `POST`   | `/widgets/:id/todos`    | `{ id, text, position }`                      | `TodoDto`                                   |
| `PATCH`  | `/todos/:id`            | `{ text?, done?, position? }`                 | `TodoDto`                                   |
| `DELETE` | `/todos/:id`            |                                               | `204`                                       |

### Zasady

- **`POST` i `PATCH` zwracają pełny rekord** z aktualnymi `updatedAt` i `version`. Klient podmienia nim wpis w cache.
- **`SettingsDto` to `{ locale, updatedAt, version }`.** Przed pierwszym zapisem `GET /settings` zwraca `{ locale: null, updatedAt: null, version: 0 }`. `version: 0` odróżnia „nigdy nie zapisano” od zapisanego wiersza.
- **Walidacja wejścia przez `validate(target, schema)`** (`lib/validate.ts`): `zValidator` z hookiem, który rzuca `ZodError`, więc błędne dane dają `400 VALIDATION_ERROR` w standardowym formacie z `handleError`. ID w ścieżce sprawdza `IdParamSchema` (UUID), zanim trafi do Postgresa. Treść, która nie jest poprawnym JSON-em (`HTTPException(400)` z walidatora Hono), też daje `400 VALIDATION_ERROR`, a nie 500.
- **Idempotentne tworzenie.** `POST` tworzący rekord odpowiada `201`. `POST` z ID, które już istnieje u tego samego użytkownika, zwraca istniejący rekord ze statusem `200`. To samo ID u innego użytkownika daje `409 ID_CONFLICT`. Istniejące ID jest sprawdzane przed limitem, więc ponowienie dwudziestego kontekstu przy limicie 20 dostaje `200`, a nie `422`.
- **Układ zapisywany hurtowo.** `PUT /contexts/:id/layout` aktualizuje w jednej transakcji pozycje i rozmiary podanych widgetów. Każde ID musi należeć do tego kontekstu i użytkownika, w przeciwnym razie całe żądanie jest odrzucane (`400 LAYOUT_INVALID`). Widgety spoza listy pozostają bez zmian.
- **Walidacja typu widgetu.** `POST /contexts/:id/widgets` sprawdza, czy `type` należy do `WIDGET_TYPES`, oraz waliduje `config` schematem z `widgetConfigSchemas` i uzupełnia go wartościami domyślnymi (klient wysyła `config: {}`). Rozmiar nie może być mniejszy niż `WIDGET_SIZES[type].min`, a widget musi się mieścić w 12 kolumnach. `PATCH /widgets/:id` zastępuje całą konfigurację, sprawdzaną schematem typu zapisanego w bazie. `POST /widgets/:id/todos` sprawdza, czy widget jest typu `todo`.
- **Trasy widgetów kontekstu.** `/contexts/:id/widgets` i `/contexts/:id/layout` są w routerze zagnieżdżonym w `contextsRoutes` (`new Hono<AuthEnv>()` podłączony przez `.route('/', …)`), więc sesja jest sprawdzana raz. Osobny router z własnym `requireAuth` pod `/contexts` sprawdzałby ją dwa razy, bo wzorzec `/api/contexts/*` pasuje do obu. Cudzy albo nieistniejący kontekst daje w tych trasach 404 (osobne zapytanie o właściciela), a nie pustą listę.
- **Trasy zadań.** `/widgets/:id/todos` (`GET`, `POST`) są w routerze zagnieżdżonym w `widgetsRoutes`, tak jak widgety w `contextsRoutes`. `/todos/:id` (`PATCH`, `DELETE`) to osobny router z własnym `requireAuth`, bo żaden inny router nie pasuje do tej ścieżki. Zadania widgetu innego typu niż `todo` dają `400 VALIDATION_ERROR` (widget istnieje, więc 404 byłoby nieprawdą), a cudzy albo nieistniejący widget i cudze zadanie dają 404. Lista zadań jest sortowana po `(position, id)`: kolumna `position` ma kolację `"C"`, a `id` rozstrzyga kolejność zadań z tą samą pozycją (dodanych na dwóch urządzeniach naraz). Zmiana zadania to jeden `UPDATE … WHERE id AND user_id … RETURNING`; `UpdateTodoSchema` nie ma `widgetId`, więc zadania nie da się przenieść do innego widgetu.
- **Układ w jednej transakcji.** `PUT /contexts/:id/layout` sprawdza przynależność każdego widgetu w samym `UPDATE … WHERE id AND context_id AND user_id`. Gdy któryś `UPDATE` nie zmieni wiersza, transakcja jest wycofywana i nic nie zostaje zapisane.
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
- **`requireAuth`**: `auth.api.getSession({ headers })` i wstawienie użytkownika do `c.var.user`. Brak sesji daje 401. Jest dołączany do pojedynczych tras (`.get('/me', requireAuth(auth), …)`) i do routerów modułów, a nie globalnie przez `.use()`, bo globalny middleware zwracałby 401 zamiast 404 dla nieistniejących ścieżek.

### Better Auth

- `emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 }`.
- `session: { expiresIn: 30 dni, updateAge: 1 dzień }` (F-AUTH-03).
- `plugins: [bearer({ requireSignature: true })]`: podpisany token sesji wraca w nagłówku `set-auth-token`, a klient wysyła go w `Authorization: Bearer`. Surowy token z bazy (bez podpisu `BETTER_AUTH_SECRET`) jest odrzucany.
- `trustedOrigins`: te same originy co `ALLOWED_ORIGINS` (Better Auth sprawdza `Origin` przy żądaniach zmieniających stan).
- Adapter Drizzle (`provider: 'pg'`) na tej samej instancji bazy.
- `rateLimit: { enabled: true }`: wbudowany rate limiting dla `/auth/*` (logowanie i rejestracja: 3 próby na 10 s na IP). Bez jawnego `enabled` działa tylko przy `NODE_ENV=production`. Za reverse proxy trzeba ustawić `advanced.ipAddress`.
- `advanced: { disableOriginCheck: false }`: sprawdzanie `Origin` także przy `NODE_ENV=test`, żeby testy działały jak produkcja.
- `telemetry: { enabled: false }` (obejmuje też CLI).
- Schemat tabel generuje CLI `auth` (`pnpm --filter @one-place/api db:auth-schema`, konfiguracja w `auth.config.ts`), a migracje drizzle-kit (`db:generate`, `db:migrate`).
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
3. **Montaż aplikacji.** Aplikacja montuje się dopiero po wczytaniu tokenu z `chrome.storage.local`. Bez tokenu pokazuje się ekran logowania, ładowany leniwie (`defineAsyncComponent`) razem z formularzami, Zod i klientem Better Auth. Z tokenem renderuje się pulpit z cache, a zapytania nieświeże są odświeżane w tle.

Kroki 2 i 3 dzieją się przed `mount`: `main.ts` czeka na `Promise.all([loadSession(), restoreCache(queryClient), uiStore.load()])`. Opcja `clientPersister` z `VueQueryPlugin` odtwarzałaby cache dopiero po zainstalowaniu pluginu, więc pierwszy render pokazałby szkielety.

Startowy JS nowej karty liczymy jako sumę skryptu wejściowego i chunków z `modulepreload` (`pnpm size` po buildzie). Po Etapie 1: **325,6 kB**. Po Etapie 2: **473 kB**. Po Etapie 3: **490,6 kB**. Po Etapie 4: **492,1 kB** (budżet 550 kB). Leniwie w Etapie 3 ładują się: edytor siatki `GridEditor` z `grid-layout-plus` (około 140 kB, przy pierwszym włączeniu edycji), menu widgetu z modalami ustawień i usuwania (`WidgetActions`, około 25 kB, przy pierwszym kliknięciu), katalog widgetów, ustawienia Zadań i komponenty widgetów. Sam `newtab-*.js` ma około 200 kB, bo Vite wydziela kod wspólny z leniwymi komponentami (Vue, Nuxt UI) do osobnych chunków, które strona i tak pobiera przy starcie. W Etapie 4 lista zadań ładuje się razem z leniwym `TodoWidget` (około 22 kB z `TaskList`), ustawienia Zadań w `TodoSettings` (około 10 kB), a `vue-draggable-plus` (około 41 kB) to ten sam leniwy chunk co w oknie kontekstów. `byPosition` jest w osobnym pliku `lib/by-position.ts`, a nie w `lib/positions.ts`: zapytania kontekstów sortują przy starcie, a `positions.ts` importuje `fractional-indexing` (+3,6 kB startowego JS), potrzebny dopiero przy dodawaniu i przeciąganiu. Leniwie ładują się ekran logowania, formularz pierwszego kontekstu, okno zarządzania kontekstami (około 126 kB z `UModal`, `UPopover` i `vue-draggable-plus`) i panel ustawień.

`performance.mark('dashboard-rendered')` w `DashboardScreen` (tylko gdy lista kontekstów jest w cache) mierzy wymaganie wydajnościowe. Po Etapie 2 pierwszy render z cache: mediana 22–26 ms na prototypie (około 80 ms przy `CPU 4x slowdown`) i 68 ms w Chromium headless w maszynie wirtualnej. Po Etapie 3 z 23 widgetami na pulpicie w Chromium headless w maszynie wirtualnej: mediana około 140 ms (115–188 ms), a przy `CPU 4x slowdown` około 600 ms. Prototyp z sześcioma widgetami miał 30 ms i 86 ms. Po Etapie 4 z jednym widgetem Zadania w Chromium headless w maszynie wirtualnej: mediana 93 ms przy 3 zadaniach i 94 ms przy 50 (pusty pulpit: około 95 ms), a przy 500 zadaniach mediana 172–192 ms z pojedynczymi pomiarami powyżej 200 ms, bo odtworzenie dużego cache z `chrome.storage.local` trwa dłużej. Prototyp z 500 zadaniami miał 59–73 ms. Pełny pomiar we wszystkich scenariuszach dojdzie w Etapie 6.

### Warstwa danych

**Klient API (`src/api/`).** `hc<AppType>(WXT_API_URL)` z nagłówkiem `Authorization: Bearer <token>`. Token jest trzymany w `chrome.storage.local` i w pamięci (kopia wczytana przy starcie). Odpowiedź 401 z dowolnego żądania kończy sesję i przełącza na ekran logowania z komunikatem (F-AUTH-05). `main.ts` obserwuje `session.token`: brak tokenu (wylogowanie w tej karcie, w innej karcie albo 401) woła `clearCache(queryClient)` i `uiStore.reset()`. Zapytania czytają odpowiedź przez `parseResponse` z `hono/client`, który rzuca `DetailedError` dla statusu spoza 2xx, a `apiErrorInfo()` zamienia go na `{ status, code }`. Logowanie i rejestracja idą przez `createAuthClient` z `better-auth/vue`, a token z nagłówka `set-auth-token` trafia do storage.

**Klucze zapytań:**

| Klucz                    | Endpoint                    | Composable              |
| ------------------------ | --------------------------- | ----------------------- |
| `['settings']`           | `GET /settings`             | `useSettings()`         |
| `['contexts']`           | `GET /contexts`             | `useContexts()`         |
| `['widgets', contextId]` | `GET /contexts/:id/widgets` | `useWidgets(contextId)` |
| `['todos', widgetId]`    | `GET /widgets/:id/todos`    | `useTodos(widgetId)`    |

Mutacje są udostępniane przez composables w `src/queries/` (`useCreateContext()`, `useSaveLayout()`, `useAddTodo()`…). **Widgety i komponenty nigdy nie wołają API bezpośrednio.**

Klucze używane przez więcej niż jeden plik (`widgetsKey(contextId)`, `todosKey(widgetId)` oraz klucze mutacji tworzenia kontekstu `createContextKey` i widgetu `createWidgetKey`) są w `queries/keys.ts`, żeby `contexts.ts`, `widgets.ts` i `todos.ts` nie importowały się nawzajem. Zależności między wpisami cache:

- nowy kontekst dostaje w `onMutate` pustą listę widgetów w cache, a `useWidgets` jest wyłączone, dopóki mutacja tworzenia tego kontekstu czeka na API (`useMutationState` po `createContextKey`). Bez tego pulpit nowego kontekstu dostawał 404 zamiast pustej listy;
- nowy widget Zadania dostaje w `onMutate` pustą listę zadań w cache (tylko typ `todo`), a `useTodos` jest wyłączone, dopóki mutacja tworzenia tego widgetu czeka na API (`useMutationState` po `createWidgetKey`). Bez tego nowy widget dostawał 404, a offline pokazywał szkielety bez końca. Gdy tworzenie widgetu się nie uda, wpis zadań jest usuwany;
- usunięcie kontekstu usuwa wpisy zadań jego widgetów (czytane z wpisu widgetów, więc przed nim), a potem wpis widgetów (`removeQueries`), bo inaczej zostałyby w `chrome.storage.local` do wylogowania. Usunięcie widgetu usuwa wpis jego zadań;
- lista zadań w cache jest zawsze posortowana przez `byPosition` (`lib/by-position.ts`), tak samo jak w API, także po optymistycznym przesunięciu;
- mutacje zadań mają wspólny `mutationKey` (`['todos', 'change']`). `onSuccess` dodania i zmiany zapisuje odpowiedź w cache tylko wtedy, gdy nie czeka żadna nowsza zmiana zadań (`isMutating(…) > 1`), bo jej optymistyczny stan jest nowszy niż ta odpowiedź (podwójne kliknięcie checkboxa nie miga);
- zmiana zadania odrzucona z 404 (zadanie usunięte na innym urządzeniu) po cofnięciu unieważnia listę zadań widgetu, więc zadanie znika po odświeżeniu. `404` przy usuwaniu zadania to sukces;
- odrzucony układ (`useSaveLayout` → `onError`) po cofnięciu unieważnia zapytanie widgetów, bo odrzucenie zwykle znaczy, że cache jest nieaktualny (np. widget usunięty na innym urządzeniu). Pozostałe mutacje widgetów tylko cofają zmianę.

**Schemat mutacji optymistycznej (F-SYNC-04):**

1. `onMutate`: `cancelQueries(klucz)`, zapamiętanie poprzedniego stanu, `setQueryData` z optymistyczną zmianą (rekord z ID wygenerowanym przez klienta).
2. `mutationFn`: wywołanie API.
3. `onError`: przywrócenie poprzedniego stanu (funkcja cofająca z `changeOptimistically()` w `queries/optimistic.ts`).
4. `onSuccess`: podmiana rekordu na wersję z serwera.

Toast „Zmiana została cofnięta” pokazuje jeden słuchacz `MutationCache` (`useMutationErrorToasts()`), a nie `onError` każdej mutacji. Przy 401 milczy, bo ekran logowania sam wyjaśnia, co się stało. `404` przy `DELETE` mutacja traktuje jak sukces: kontekst usunięty np. na innym urządzeniu nie wraca na listę.

**Persister (F-SYNC-01, F-SYNC-07):**

- storage: adapter na `chrome.storage.local`, klucz `one-place:query-cache`;
- `buster`: stała `CACHE_SCHEMA_VERSION`, zwiększana przy każdej zmianie kształtu DTO, co powoduje odrzucenie starego cache;
- `maxAge`: 30 dni;
- zapis ograniczony do jednego na sekundę (throttle);
- `shouldDehydrateQuery: (query) => query.state.data !== undefined`: zapisywane są wszystkie zapytania z danymi, także w stanie `error` po nieudanym odświeżeniu (API nie działa). Domyślny warunek (tylko `success`) usunąłby je z cache przy następnym zapisie;
- mutacje nie są zapisywane (`shouldDehydrateMutation: () => false`): zmiana zrobiona offline czeka tylko w otwartej karcie (R7);
- `gcTime: Infinity` w `QueryClient`, bo 30 dni nie mieści się w `setTimeout` (max około 24,8 dnia) i zamieniłoby się na 1 ms;
- uszkodzony cache jest usuwany, a start idzie dalej bez niego;
- `clearCache()` woła `queryClient.clear()` przy aktywnej subskrypcji persistera i od razu `persister.removeClient()`.

**Zachowanie sieciowe:**

- `refetchOnWindowFocus: true` (F-SYNC-03); inne otwarte karty odświeżają dane przy powrocie do nich;
- `retry: 3` z rosnącym odstępem dla zapytań i bez ponowień dla błędów 4xx;
- `networkMode: 'online'`: offline mutacje są wstrzymywane i wznawiane po powrocie sieci (F-SYNC-05). Baner offline korzysta z `onlineManager`;
- wszystkie mutacje mają domyślnie `scope: { id: 'api' }` (`createQueryClient`), więc idą do API po kolei, w kolejności wykonania, także po powrocie sieci. Zmiana optymistyczna (`onMutate`) działa od razu, a w kolejce czeka tylko żądanie (`isPaused`). Bez kolejki zmiana zadania mogła dotrzeć przed zapisem zadania albo widgetu i dostać 404. Kosztem jest to, że jedno zawieszone żądanie wstrzymuje następne, aż przeglądarka je przerwie;
- `onlineManager.setOnline(navigator.onLine)` na starcie, przed utworzeniem klienta. TanStack Query v5 zakłada stan „online”, dopóki nie przyjdzie zdarzenie `offline`, więc karta otwarta bez sieci nie pokazałaby banera, a zmiana od razu by się cofnęła;
- baner oznacza brak sieci w przeglądarce, a nie niedziałające API. Gdy nie odpowiada samo API, pulpit zostaje z danymi z cache, a nieudane zmiany cofają się z toastem.

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
interface WidgetDefinition {
  type: WidgetType // z packages/shared
  name: string // klucz i18n
  description: string // klucz i18n
  icon: string // ikona Lucide
  defaultSize: WidgetSize // z WIDGET_SIZES
  minSize: WidgetSize // z WIDGET_SIZES
  component: AsyncComponentLoader // otrzymuje props { widget: WidgetDto }
  settingsComponent?: AsyncComponentLoader // otrzymuje props { widget }, emituje save z nową konfiguracją
}
```

`widgets/registry.ts` eksportuje mapę `type → WidgetDefinition` (`satisfies Record<WidgetType, WidgetDefinition>`) i `findWidgetDefinition(type)`, która dla nieznanego typu zwraca `null`. Komponenty są ładowane leniwie (`defineAsyncComponent`).

**Definicja nie ma schematu konfiguracji.** Rejestr i ramka są w pierwszym renderze, więc `configSchema` i `defaultConfig` w definicji (albo walidacja w ramce) dołożyłyby do startowego JS cały Zod (+93 kB; `zod/mini` +52 kB). Schemat przychodzi z leniwym komponentem widgetu, który sam woła `resolveConfig(schema, widget.config)` z `widgets/config.ts`: niepoprawne pola dostają wartości domyślne, poprawne zostają, a w konsoli jest ostrzeżenie. `resolveConfig` nie importuje Zoda, tylko woła metody przekazanego schematu.

**`WidgetFrame.vue`** opakowuje każdy widget:

- nagłówek tylko w trybie edycji: uchwyt przeciągania z ikoną i nazwą typu (F-GRID-03); tytuł z konfiguracji pokazuje sam widget;
- menu (Ustawienia, jeśli typ je ma, i Usuń) w prawym górnym rogu. Ramka pokazuje zwykły przycisk, a pierwsze kliknięcie ładuje `WidgetActions.vue` z `UDropdownMenu` i modalami ustawień i usuwania (statyczny import kosztował +142 kB startowego JS);
- `onErrorCaptured` z `return false`: komunikat błędu i przycisk „Spróbuj ponownie”, który ponownie montuje komponent (F-WGT-05). Bez `return false` błąd idzie dalej i wywraca cały pulpit;
- nieznany typ (brak w rejestrze): placeholder z F-WGT-06; taki widget można usunąć.

**Źródła danych.** Widget, którego dane mogą w przyszłości pochodzić z różnych miejsc, oddziela UI od źródła. Dla Zadań (`widgets/todo/task-source.ts`):

```ts
interface TaskItem {
  id: string
  text: string
  done: boolean // bez position: kolejność to sprawa źródła
}

interface TaskSource {
  items: Readonly<Ref<TaskItem[] | undefined>> // undefined do pierwszego wczytania
  isError: Readonly<Ref<boolean>>
  retry(): void
  capabilities: { reorder: boolean }
  add(text: string): void
  toggle(id: string): void
  edit(id: string, text: string): void
  remove(id: string): void
  move(id: string, beforeId: string | null, afterId: string | null): void // ID nowych sąsiadów
}
function useTaskSource(source: TodoConfig['source'], widgetId: string): TaskSource
```

- `useTaskSource` to composable wołany raz w `setup()`. Wybiera implementację wyczerpującym `switch (source.type)`, więc nowy wariant unii `source` bez implementacji to błąd TypeScriptu. Zmiana źródła w konfiguracji wymaga nowego widgetu.
- `TaskList.vue` jest czysto prezentacyjny: dostaje `items` i `capabilities`, emituje `add`, `toggle`, `edit`, `remove`, `move` i nie importuje niczego z `src/queries/`. Przeciąga lokalną kopię listy (`vue-draggable-plus`, uchwyt `.task-drag-handle`, osobny od `.widget-drag-handle` ramki), a przy `capabilities.reorder: false` nie pokazuje uchwytów. Edycję w miejscu kończy pierwsze z Enter, Escape i `blur` (jedno `editingId`).
- `TodoWidget.vue` łączy `useTaskSource()` z `TaskList`: szkielety do pierwszego wczytania, komunikat z „Spróbuj ponownie” przy błędzie bez danych w cache, a przy „Ukryj ukończone” (F-TODO-06) filtruje listę, zanim trafi do `TaskList`. Przeciąganie zgłasza więc sąsiadów z widocznej listy, a źródło szuka ich pozycji wśród wszystkich zadań.
- W MVP jedyną implementacją jest `local` (`useLocalTaskSource`) oparta na `useTodos()` i mutacjach zadań. Nowe zadanie dostaje `positionAfterLast`, a przesunięcie `positionBetween(pozycja poprzedniego, pozycja następnego)` z `lib/positions.ts`, czyli jeden `PATCH`.
- Przyszłe integracje (np. Todoist) idą **przez backend**: tokeny OAuth są przechowywane zaszyfrowane na serwerze, a backend tłumaczy dane zewnętrzne na `TaskItem`.

**Dodanie nowego typu widgetu:**

1. `packages/shared`: typ w `WIDGET_TYPES` i rozmiary w `WIDGET_SIZES` (`widget-types.ts`), schemat konfiguracji z wartością domyślną na każdym polu w `widgetConfigSchemas` (`widgets.ts`).
2. `apps/extension/src/widgets/<typ>/`: komponent (sam woła `resolveConfig` ze swoim schematem) i opcjonalnie ustawienia, wpis w `registry.ts` bez schematu, klucze i18n PL i EN. Ikona typu jest w pliku `.ts`, więc skaner ikon Nuxt UI musi czytać też `.ts` (`scan: { globInclude: ['src/**/*.{vue,ts}'] }` w `nuxt-ui.config.ts`).
3. Jeśli widget ma dane: moduł w `apps/api/src/modules/`, tabela, migracja i testy.

### Siatka

- **Podgląd bez biblioteki.** `DashboardGrid.vue` w podglądzie rysuje CSS grid (`repeat(12, minmax(0, 1fr))`, `grid-auto-rows: ROW_HEIGHT`, `gap` i `padding` równe `GRID_GAP`) z położeniem z `compactLayout()`. To ten sam algorytm co `verticalCompact` w `grid-layout-plus` (pilnuje tego test zgodności w `layout.test.ts`), więc przełączenie trybu nie przesuwa widgetów. `ROW_HEIGHT` 40 px i `GRID_GAP` 10 px są w `grid.ts`.
- **Edycja.** `GridEditor.vue` jest **jedynym** plikiem, który zna `grid-layout-plus`, i ładuje się leniwie przy pierwszym włączeniu edycji. Dostaje `widgets` i `contextId`, trzyma własną kopię układu (biblioteka zmienia tablicę w miejscu) i odbudowuje ją po każdej zmianie cache. Wymiana biblioteki dotyczy tego jednego komponentu (ryzyko R4).
- Konfiguracja: `colNum: 12`, `rowHeight` i `margin` z `grid.ts`, `verticalCompact`, `isDraggable`, `isResizable`, przeciąganie tylko za nagłówek ramki (`.widget-drag-handle`), `minW` i `minH` z definicji typu.
- Zapis: `layout-updated` → 500 ms → `changedLayout()` (porównanie z cache) → `useSaveLayout()` tylko przy faktycznej różnicy. Biblioteka zgłasza `layout-updated` także po zamontowaniu i po każdej zmianie danych, więc bez porównania każda odpowiedź API wywoływała kolejny zapis. `move` i `resize` z `GridItem` wstrzymują zaplanowany zapis, żeby nie wysłać układu w trakcie przeciągania, a zapis czekający przy zamknięciu edytora jest wysyłany od razu.
- Nowy widget: `x = 0`, `y = max(y + h)` widgetów po `compactLayout()`, rozmiar `defaultSize`, `config: {}`.
- Poniżej 768 px (`useBreakpoints` z VueUse) zamiast siatki renderowana jest kolumna `WidgetFrame` posortowana po `(y, x)`, a przycisk edycji jest ukryty (F-GRID-05).

### i18n

- `vue-i18n` z plikami `pl.json` i `en.json`. Klucze są pogrupowane według funkcji (`auth.*`, `contexts.*`, `widgets.todo.*`).
- Wybór języka zgodnie z F-I18N-02. Lokalizacja Nuxt UI jest przełączana razem z `vue-i18n`.

## Testy

| Poziom                  | Narzędzia                                                        | Zakres                                                                                      |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Jednostkowe: `shared`   | Vitest                                                           | schematy, `resolveTheme`, walidacja układu                                                  |
| Integracyjne: `api`     | Vitest, `app.request()`, PGlite                                  | każdy endpoint; świeża baza z migracjami w każdym pliku testowym                            |
| Komponenty: `extension` | Vitest, `@vue/test-utils`, `happy-dom`, fake-browser WXT         | `TaskList`, `WidgetFrame` (błąd, nieznany typ), `applyTheme`, composables z mockowanym API  |
| E2E                     | Playwright, Chromium z rozszerzeniem, API na testowym Postgresie | scenariusze akceptacyjne z [02-specyfikacja.md](02-specyfikacja.md#kryteria-akceptacji-mvp) |

**Testy komponentów.** `vitest.config.ts` dodaje do `WxtVitest()` pluginy `@vitejs/plugin-vue` i Nuxt UI z tymi samymi opcjami co build (`nuxtUiOptions()` z `nuxt-ui.config.ts`), więc testy montują prawdziwe komponenty Nuxt UI, a ikony są w paczce, a nie pobierane z sieci. DOM (`happy-dom`) włącza komentarz `// @vitest-environment happy-dom` w pliku testu; pozostałe testy działają w środowisku Node.

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

| #   | Decyzja                                                                         | Odrzucone alternatywy                                        | Uzasadnienie                                                                                                      |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| D1  | Backend jest źródłem prawdy, lokalnie tylko cache                               | `chrome.storage.sync`, tylko lokalnie                        | synchronizacja między urządzeniami bez limitów `storage.sync`                                                     |
| D2  | TanStack Query z persisterem (stale-while-revalidate, mutacje optymistyczne)    | własny silnik sync (outbox i delta), Zero/Electric/PowerSync | najkrótsza droga do działającego MVP; API z `version` i `updatedAt` pozwala później przejść na własny silnik      |
| D3  | Hono na Node 24 LTS, docelowo VPS                                               | Cloudflare Workers                                           | wybór autora; wdrożenie po MVP                                                                                    |
| D4  | PostgreSQL i Drizzle; PGlite w testach                                          | SQLite                                                       | `jsonb`, współbieżne zapisy wielu użytkowników, zgodność z silnikami synchronizacji                               |
| D5  | Better Auth, e-mail i hasło, plugin `bearer`                                    | Google OAuth, klucz synchronizacji, ciasteczka               | prostota; token w nagłówku działa przewidywalnie z originu rozszerzenia; magic link później                       |
| D6  | Logowanie wymagane w MVP                                                        | tryb lokalny z opcjonalnym kontem                            | mniej przypadków brzegowych; tryb bez konta przed publikacją                                                      |
| D7  | Vue 3, Nuxt UI, WXT                                                             | React (`react-grid-layout`, `cmdk`), Svelte                  | preferencja autora; `UCommandPalette` pod przyszłe Cmd+K                                                          |
| D8  | Motyw globalny z opcjonalnym nadpisaniem w kontekście                           | tylko globalny, tylko per kontekst                           | elastyczność bez migracji przy dodaniu tła per kontekst                                                           |
| D9  | Brak domyślnych kontekstów                                                      | seed „Praca” i „Prywatne”                                    | użytkownik sam decyduje o strukturze                                                                              |
| D10 | UUIDv7 generowany przez klienta                                                 | ID z serwera                                                 | mutacje optymistyczne bez podmiany ID, idempotentne `POST`                                                        |
| D11 | Jeden widget Zadania z wymiennym źródłem danych                                 | osobny widget per integracja                                 | jeden UI listy, zmiana źródła w ustawieniach                                                                      |
| D12 | Bez `host_permissions`, CORS z allowlistą originów                              | `host_permissions` do API                                    | mniej uprawnień, łatwiejsze review w sklepie                                                                      |
| D13 | Integracje zewnętrzne przez backend                                             | wywołania z rozszerzenia                                     | tokeny poza przeglądarką, konfiguracja raz na koncie                                                              |
| D14 | Przełącznik kontekstów jako zakładki (`UTabs`) w nagłówku                       | menu rozwijane (`UDropdownMenu`)                             | menu dokłada ponad 100 kB startowego JS (pomiar z Etapu 2: +104 kB); zakładki przełączają jednym kliknięciem      |
| D15 | Podgląd pulpitu na CSS grid, `grid-layout-plus` ładowany leniwie tylko w edycji | biblioteka w obu trybach                                     | biblioteka w pierwszym renderze to +139 kB startowego JS (ponad budżet); ten sam algorytm dosuwania w obu trybach |
| D16 | Rejestr widgetów bez Zoda, schemat konfiguracji przy leniwym komponencie        | walidacja w ramce (`configSchema` w definicji), `zod/mini`   | ramka jest w pierwszym renderze: walidacja w niej to +93 kB, a `zod/mini` nadal +52 kB                            |
| D17 | Wszystkie mutacje w jednej kolejce (`mutations.scope` w `QueryClient`)          | równoległe zapisy, blokada pola do zapisu widgetu i zadania  | równoległe zapisy po powrocie sieci dostawały 404 i gubiły zmiany; UI zostaje optymistyczne, kolejki nie widać    |

## Ryzyka

| #   | Ryzyko                                                                                                                                            | Kiedy sprawdzamy                                     | Plan awaryjny                                                            | Wynik                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Integracja WXT z `@nuxt/ui/vite` (konfiguracja Vite, Tailwind v4, brak `vue-router`)                                                              | Etap 0                                               | czysty Vite z ręcznie złożonym manifestem lub `@crxjs/vite-plugin`       | **zamknięte w Etapie 0:** plugin `ui()` w opcji `vite` z `wxt.config.ts` z `router: false`; `srcDir: 'src'`, żeby aliasy `@` i `~` wskazywały `src`; `.npmrc` z `public-hoist-pattern[]=@wxt-dev/*`, bo WXT szuka modułów od własnej lokalizacji; serwer deweloperski WXT na porcie 3001, bo domyślny 3000 koliduje z API                                                                                                                                                                                                             |
| R2  | Ikony Nuxt UI pobierane w trakcie działania z API Iconify zamiast z paczki                                                                        | Etap 0: zakładka Network, potem test E2E prywatności | zainstalowane kolekcje `@iconify-json/lucide` i jawne bundlowanie ikon   | **zamknięte w Etapie 0:** `@iconify-json/lucide` i `icon.clientBundle.scan: true`; ikony są w paczce, zero żądań do `api.iconify.design` (sprawdzone w trybie Offline)                                                                                                                                                                                                                                                                                                                                                                |
| R3  | Zmiana akcentu w trakcie działania: zmienne `--ui-color-primary-*`, obecność palet w CSS (Tailwind v4), wyłączenie wbudowanego color mode Nuxt UI | Etap 0                                               | jawne zdefiniowanie palet w CSS; własny zestaw zmiennych akcentu         | **zamknięte w Etapie 0:** `colorMode: false` i własne przełączanie klasy `dark`; akcent jako styl inline `--ui-color-primary-*` na `<html>`; `@import 'tailwindcss' theme(static)` emituje wszystkie palety (+14 kB CSS); 10 akcentów działa w obu trybach                                                                                                                                                                                                                                                                            |
| R4  | `grid-layout-plus`: stan utrzymania i zgodność z aktualnym Vue                                                                                    | Etap 3                                               | gridstack.js za tym samym interfejsem `GridEditor.vue`                   | **sprawdzone w Etapie 3:** wersja 1.1.1 (13.10.2025), 2.0.0-beta.0 od 04.08.2026; działa z Vue 3.5.43 bez ostrzeżeń w konsoli; chunk `GridEditor` około 140 kB, ładowany tylko w edycji; przeciąganie, skalowanie z minimalnym rozmiarem i dosuwanie działają, a podgląd zgadza się z edytorem co do piksela. `layout-updated` przychodzi też po zamontowaniu i po zmianie danych, więc zapis porównuje układ z cache. Plan awaryjny bez zmian: bibliotekę zna tylko `GridEditor.vue`. Ryzyko zostaje otwarte do stabilnej wersji 2.0 |
| R5  | Better Auth z originem `chrome-extension://` (sprawdzanie `Origin`, `trustedOrigins`, ekspozycja `set-auth-token` przez CORS)                     | Etap 1                                               | konfiguracja `trustedOrigins` lub własny endpoint wymiany sesji na token | **zamknięte w Etapie 1:** origin rozszerzenia w `trustedOrigins` (rejestracja i logowanie zawsze sprawdzają `Origin`, obcy origin daje 403); CORS z `allowHeaders: ['Authorization', 'Content-Type']` i `exposeHeaders: ['set-auth-token']`; klient Better Auth z `credentials: 'omit'` (z domyślnym `include` przeglądarka blokuje preflight); `bearer({ requireSignature: true })`                                                                                                                                                  |
| R6  | Różnice w Brave (Shields, polityki storage)                                                                                                       | Etap 6, ręcznie                                      | dokumentacja ograniczeń; poprawki punktowe                               | otwarte                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| R7  | Utrata zmian offline po zamknięciu karty                                                                                                          | świadome ograniczenie MVP                            | trwała kolejka mutacji lub własny silnik sync (roadmapa)                 | otwarte                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
