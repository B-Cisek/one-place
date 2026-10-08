# 05. Implementacja początkowa: Etap 0 (plan nauki)

Ten plik prowadzi przez [Etap 0 z roadmapy](04-roadmapa.md#etap-0-fundament-i-sprawdzenie-ryzyk). Implementujesz sam. Każde zadanie mówi, **co** zrobić, **dlaczego** i **jak sprawdzić**, że działa. Gotowy kod jest schowany w zwijanych blokach „Rozwiązanie”: najpierw spróbuj, potem porównaj.

**Cel:** działający szkielet monorepo, w którym nowa karta przeglądarki pokazuje komponenty Nuxt UI, zmienia akcent i tryb w trakcie działania oraz łączy się z API Hono, które sprawdza bazę.

**Architektura:** trzy pakiety w pnpm workspace: `packages/shared` (wspólny kod), `apps/api` (Hono na Node, Drizzle, Postgres, a w testach PGlite) i `apps/extension` (WXT, Vue 3, Nuxt UI). Rozszerzenie importuje z API **tylko typ** `AppType`, dzięki czemu klient HTTP jest w pełni typowany.

**Specyfikacja:** [01-wizja.md](01-wizja.md), [02-specyfikacja.md](02-specyfikacja.md), [03-architektura.md](03-architektura.md), [04-roadmapa.md](04-roadmapa.md).

> Rozwiązania sprawdziłem na prototypie 9.10.2026 (macOS, Node 24.7, pnpm 10.24, Chromium 156): testy, lint, typecheck, build oraz działanie nowej karty w przeglądarce, w tym połączenie z API.

## Jak korzystać z planu

1. Przeczytaj całe zadanie przed rozpoczęciem.
2. Odhaczaj kroki (`- [ ]` na `- [x]`).
3. W krokach z testem **najpierw zobacz czerwony test**, dopiero potem pisz implementację (TDD).
4. Gdy utkniesz na ponad 15 minut, otwórz „Podpowiedź”, a potem „Rozwiązanie”.
5. Każde zadanie kończy się zielonym `pnpm check` i commitem.
6. Na końcu zadania odpowiedz na pytania kontrolne. Jeśli nie umiesz, wróć do linków z sekcji [Materiały](#materiały).

## Wymagania wstępne

- [ ] Node 24 LTS: `node -v` pokazuje `v24.x`
- [ ] pnpm 10: `corepack enable`, potem `pnpm -v`
- [ ] Docker Desktop uruchomiony: `docker info` działa bez błędu
- [ ] Chrome lub Brave
- [ ] Repozytorium istnieje (`git log` pokazuje commit z dokumentacją)

## Ograniczenia globalne

Obowiązują w każdym zadaniu.

| Pakiet | Wersja | Uwagi |
|---|---|---|
| TypeScript | `~6.0.3` | **Nie 7.x:** `typescript-eslint` obsługuje TypeScript poniżej 6.1 |
| Node | `>=24` | `"type": "module"` w każdym `package.json` |
| Vitest | `^5` | |
| ESLint | `^10` | flat config, `typescript-eslint`, `eslint-plugin-vue` |
| Zod | `^4` | API różni się od Zod 3, np. `z.url()` i `z.prettifyError()` |
| Hono | `^4.13` | `@hono/node-server` `^2` |
| Drizzle ORM | `^0.45` | `@electric-sql/pglite` `^0.5` w testach |
| WXT | `^0.21` | `@wxt-dev/module-vue` `^1` |
| Nuxt UI | `^4.11` | Tailwind CSS `^4`, Vue `^3.5` |
| PostgreSQL | `18` | obraz `postgres:18` |

- Pakiety wewnętrzne: `@one-place/shared`, `@one-place/api`, `@one-place/extension`. Zależności między nimi przez `workspace:*`.
- Rozszerzenie ma tylko uprawnienie `storage` i stały `key`.
- Nazwy w kodzie po angielsku. Teksty w UI i komunikaty błędów po polsku (w Etapie 1 przejdą do i18n).

## Na co uważać

Pięć sytuacji, których testy jednostkowe łatwo nie obejmują, a które najczęściej psują wrażenie z używania:

1. **API startuje bez bazy:** `/api/health` ma zwrócić 503, a nie wywrócić procesu. Test w zadaniu 3.
2. **Brak lub zła zmienna środowiskowa:** proces kończy się czytelnym błędem z nazwą zmiennej. Test w zadaniu 2.
3. **Żądanie z obcego originu:** odpowiedź nie ma nagłówka `Access-Control-Allow-Origin`. Test w zadaniu 6.
4. **API wyłączone przy otwartej karcie:** plakietka pokazuje `unreachable`, bez nieobsłużonego wyjątku w konsoli. Sprawdzenie ręczne w zadaniu 6.
5. **Nowa karta bez internetu:** ikony się wyświetlają, a żądań do `api.iconify.design` jest zero. Sprawdzenie ręczne w zadaniu 4.

## Struktura po Etapie 0

```
one-place/
├─ .gitignore  .npmrc  .prettierrc.json  .prettierignore
├─ eslint.config.js  tsconfig.base.json  pnpm-workspace.yaml  package.json
├─ docker-compose.yml
├─ scripts/generate-extension-key.mjs
├─ packages/shared/
│  ├─ package.json  tsconfig.json
│  └─ src/  index.ts  theme.ts  theme.test.ts
├─ apps/api/
│  ├─ package.json  tsconfig.json  .env.example  (.env)
│  ├─ src/  index.ts  app.ts  env.ts  env.test.ts  db/client.ts
│  └─ test/  create-test-app.ts  health.test.ts
└─ apps/extension/
   ├─ package.json  tsconfig.json  wxt.config.ts  .env.example  (.env)
   └─ src/
      ├─ env.d.ts
      ├─ assets/main.css
      ├─ api/  client.ts  use-api-health.ts
      └─ entrypoints/newtab/  index.html  main.ts  App.vue
```

---

## Zadanie 1: monorepo i pakiet `shared` (pierwszy test)

**Cel:** monorepo z narzędziami jakości i pierwszą funkcją napisaną metodą TDD.

**Czego się nauczysz:** pnpm workspaces, wspólny `tsconfig`, ESLint flat config, Prettier, Vitest, cykl czerwony → zielony.

**Pliki:**
- Utwórz: `pnpm-workspace.yaml`, `package.json`, `.gitignore`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`
- Utwórz: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/theme.ts`, `packages/shared/src/index.ts`
- Test: `packages/shared/src/theme.test.ts`

**Interfejsy:**
- Wytwarza: `ACCENT_COLORS` (krotka 10 nazw kolorów), `type AccentColor`, `COLOR_SHADES` (`50 … 950`), `accentCssVariables(accent: AccentColor): Record<string, string>`. Funkcja zwraca mapę `--ui-color-primary-<odcień>` → `var(--color-<akcent>-<odcień>)`. Używa jej zadanie 5.

**Kroki:**

- [ ] **1. Konfiguracja workspace.** Utwórz `pnpm-workspace.yaml` (pakiety z `apps/*` i `packages/*`), główny `package.json` (prywatny, `"type": "module"`, `engines.node >= 24`, skrypty poniżej) i `.gitignore`.

  Skrypty w głównym `package.json`:

  ```json
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "check": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test"
  }
  ```

- [ ] **2. Wspólny TypeScript.** Utwórz `tsconfig.base.json` z trybem strict. Pakiety będą go rozszerzać.
- [ ] **3. Narzędzia.** Zainstaluj w katalogu głównym:

  ```bash
  pnpm add -w -D typescript@~6.0.3 vitest@^5 eslint@^10 @eslint/js@^10 typescript-eslint@^8 eslint-plugin-vue globals prettier@^3
  ```

- [ ] **4. ESLint i Prettier.** Utwórz `eslint.config.js` (JS, TypeScript i Vue z regułami `flat/essential`), `.prettierrc.json` i `.prettierignore`.
- [ ] **5. Pakiet `shared`.** Utwórz `packages/shared/package.json` z `"exports": { ".": "./src/index.ts" }` oraz skryptami `typecheck` (`tsc --noEmit`) i `test` (`vitest run`). Dodaj `tsconfig.json` rozszerzający bazowy.
- [ ] **6. Czerwony test.** Napisz `src/theme.test.ts` z dwoma przypadkami: (a) dla `'green'` zmienna `--ui-color-primary-500` ma wartość `var(--color-green-500)`, a `-950` ma `var(--color-green-950)`; (b) funkcja zwraca dokładnie tyle wpisów, ile jest odcieni.
- [ ] **7. Uruchom test.** `pnpm --filter @one-place/shared test`. Oczekiwany wynik: **FAIL**, bo moduł `./theme` nie istnieje.
- [ ] **8. Implementacja.** Napisz `src/theme.ts` (stałe, typ i funkcję) oraz `src/index.ts`, który eksportuje wszystko z `./theme`.
- [ ] **9. Zielony test.** `pnpm --filter @one-place/shared test`. Oczekiwany wynik: **PASS (2 testy)**.
- [ ] **10. Cały check.** `pnpm format`, potem `pnpm check`. Oczekiwany wynik: lint bez błędów, formatowanie OK, typecheck OK, testy przechodzą.
- [ ] **11. Commit.**

  ```bash
  git add -A && git commit -m "chore: monorepo, narzędzia jakości i pakiet shared"
  ```

<details>
<summary>Podpowiedź</summary>

- `as const` na tablicy daje typ krotki z literałami, a `(typeof ACCENT_COLORS)[number]` zamienia ją na unię `'blue' | 'indigo' | …`.
- `Object.fromEntries(tablica.map(x => [klucz, wartość]))` buduje obiekt z par.
- Pakiet `shared` nie ma kroku budowania: `exports` wskazuje bezpośrednio na plik `.ts`, a kompiluje go ten, kto importuje (Vite w rozszerzeniu, `tsx` w API).

</details>

<details>
<summary>Rozwiązanie: pliki konfiguracyjne</summary>

`pnpm-workspace.yaml`
```yaml
packages:
  - apps/*
  - packages/*
```

`package.json` (bez `devDependencies`, które dopisze `pnpm add`)
```json
{
  "name": "one-place",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.24.0",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "check": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test"
  }
}
```

`.gitignore`
```
node_modules
.output
.wxt
.env
*.local
apps/extension/components.d.ts
apps/extension/auto-imports.d.ts
```

`tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

`eslint.config.js`
```js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['**/node_modules', '**/.output', '**/.wxt', '**/*.d.ts'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
)
```

`.prettierrc.json`
```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

`.prettierignore`
```
pnpm-lock.yaml
.output
.wxt
*.d.ts
```

`packages/shared/package.json`
```json
{
  "name": "@one-place/shared",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

`packages/shared/tsconfig.json`
```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

</details>

<details>
<summary>Rozwiązanie: test i implementacja</summary>

`packages/shared/src/theme.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { accentCssVariables, COLOR_SHADES } from './theme'

describe('accentCssVariables', () => {
  it('mapuje każdy odcień primary na odcień wybranego akcentu', () => {
    const vars = accentCssVariables('green')
    expect(vars['--ui-color-primary-500']).toBe('var(--color-green-500)')
    expect(vars['--ui-color-primary-950']).toBe('var(--color-green-950)')
  })

  it('zwraca dokładnie jedną zmienną na każdy odcień', () => {
    expect(Object.keys(accentCssVariables('blue'))).toHaveLength(COLOR_SHADES.length)
  })
})
```

`packages/shared/src/theme.ts`
```ts
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

export type AccentColor = (typeof ACCENT_COLORS)[number]

export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export function accentCssVariables(accent: AccentColor): Record<string, string> {
  return Object.fromEntries(
    COLOR_SHADES.map((shade) => [`--ui-color-primary-${shade}`, `var(--color-${accent}-${shade})`]),
  )
}
```

`packages/shared/src/index.ts`
```ts
export * from './theme'
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego `exports` w `shared` wskazuje na `.ts`, a nie na zbudowany `.js`?** Bo każdy konsument i tak ma kompilator TypeScriptu (Vite, `tsx`, Vitest). Odpada krok budowania i watch na pakiecie.
2. **Co zmienia `noUncheckedIndexedAccess` dla `vars['--ui-color-primary-500']`?** Typ to `string | undefined`, bo kompilator nie wie, czy klucz istnieje. Zmusza to do obsługi braku wartości w kodzie produkcyjnym.
3. **Po co `pnpm -r` w skryptach?** Uruchamia skrypt o tej nazwie w każdym pakiecie, który go ma, więc jedno `pnpm check` sprawdza cały monorepo.

</details>

---

## Zadanie 2: konfiguracja API (`parseEnv`, TDD)

**Cel:** API sprawdza zmienne środowiskowe przy starcie i kończy pracę czytelnym błędem, zanim cokolwiek zepsuje.

**Czego się nauczysz:** Zod 4 (`safeParse`, `coerce`, `default`, `transform`, `prettifyError`), funkcja testowalna dzięki przyjmowaniu źródła danych jako parametru.

**Pliki:**
- Utwórz: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/env.ts`, `apps/api/.env.example`
- Test: `apps/api/src/env.test.ts`

**Interfejsy:**
- Wytwarza: `parseEnv(source: Record<string, string | undefined>): Env`, gdzie `Env = { DATABASE_URL: string; PORT: number; ALLOWED_ORIGINS: string[] }`. Używają go zadania 3 i 6.

**Kroki:**

- [ ] **1. Pakiet API.** Utwórz `apps/api/package.json` (`@one-place/api`, `"type": "module"`, skrypty `typecheck`: `tsc --noEmit` i `test`: `vitest run`) oraz `tsconfig.json` z `"types": ["node"]` i `include: ["src", "test"]`.
- [ ] **2. Zależności.**

  ```bash
  pnpm --filter @one-place/api add zod@^4
  pnpm --filter @one-place/api add -D @types/node@^24
  ```

- [ ] **3. Czerwone testy.** W `src/env.test.ts` napisz trzy przypadki:
  - poprawny `DATABASE_URL` bez innych zmiennych daje `PORT === 3000` i `ALLOWED_ORIGINS` równe `[]`;
  - `ALLOWED_ORIGINS: 'chrome-extension://a, chrome-extension://b'` daje tablicę dwóch originów bez spacji;
  - pusty obiekt rzuca błąd, którego treść zawiera `DATABASE_URL`.
- [ ] **4. Uruchom.** `pnpm --filter @one-place/api test`. Oczekiwany wynik: **FAIL**.
- [ ] **5. Implementacja** `src/env.ts`: schemat Zod i funkcja `parseEnv`, która przy błędzie rzuca `Error` z treścią z `z.prettifyError`.
- [ ] **6. Zielone testy.** Oczekiwany wynik: **PASS (3 testy)**.
- [ ] **7. `.env.example`** z przykładowymi wartościami (patrz rozwiązanie).
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(api): walidacja zmiennych środowiskowych`.

<details>
<summary>Podpowiedź</summary>

- `z.url()` w Zod 4 to samodzielny schemat (w Zod 3 było `z.string().url()`).
- `z.coerce.number()` zamienia tekst `"3000"` na liczbę, bo wszystkie zmienne środowiskowe są tekstem.
- `.default('')` przed `.transform(...)` sprawia, że brak zmiennej daje pustą tablicę, a nie błąd.
- `parseEnv` przyjmuje `source` zamiast czytać `process.env`, więc w teście podajesz dowolny obiekt.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/package.json` (bez sekcji zależności)
```json
{
  "name": "@one-place/api",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

`apps/api/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["src", "test"]
}
```

`apps/api/src/env.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

describe('parseEnv', () => {
  it('parsuje poprawną konfigurację i ustawia domyślny port', () => {
    const env = parseEnv({ DATABASE_URL: 'postgres://one:one@localhost:5432/one_place' })
    expect(env.PORT).toBe(3000)
    expect(env.ALLOWED_ORIGINS).toEqual([])
  })

  it('dzieli ALLOWED_ORIGINS po przecinkach i obcina spacje', () => {
    const env = parseEnv({
      DATABASE_URL: 'postgres://one:one@localhost:5432/one_place',
      ALLOWED_ORIGINS: 'chrome-extension://a, chrome-extension://b',
    })
    expect(env.ALLOWED_ORIGINS).toEqual(['chrome-extension://a', 'chrome-extension://b'])
  })

  it('rzuca czytelny błąd, gdy brakuje DATABASE_URL', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/)
  })
})
```

`apps/api/src/env.ts`
```ts
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3000),
  ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
})

export type Env = z.infer<typeof EnvSchema>

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(source)
  if (!result.success) {
    throw new Error(`Niepoprawna konfiguracja środowiska:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}
```

`apps/api/.env.example`
```
DATABASE_URL=postgres://one:one@localhost:5432/one_place
PORT=3000
ALLOWED_ORIGINS=
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego walidować env przy starcie, a nie przy pierwszym użyciu?** Błąd konfiguracji ujawnia się od razu przy wdrożeniu, a nie po godzinie przy pierwszym żądaniu, które akurat potrzebuje danej zmiennej.
2. **Czym różni się `parse` od `safeParse`?** `parse` rzuca `ZodError`, a `safeParse` zwraca `{ success, data | error }`, więc możesz sam zbudować komunikat.
3. **Czemu `.env` jest w `.gitignore`, a `.env.example` nie?** `.env` zawiera lokalne (a później produkcyjne) sekrety. `.env.example` dokumentuje, jakie zmienne są potrzebne.

</details>

---

## Zadanie 3: Hono, baza i `/api/health`

**Cel:** serwer HTTP z endpointem, który sprawdza połączenie z bazą. Testy działają na PGlite (Postgres w pamięci), a lokalny serwer łączy się z Postgresem w Dockerze.

**Czego się nauczysz:** Hono (`basePath`, `c.json`, `app.request()` w testach), Drizzle (połączenie, surowe zapytanie `sql`), wstrzykiwanie zależności przez fabrykę `createApp`, PGlite, Docker Compose.

**Pliki:**
- Utwórz: `apps/api/src/db/client.ts`, `apps/api/src/app.ts`, `apps/api/src/index.ts`, `docker-compose.yml`
- Test: `apps/api/test/create-test-app.ts`, `apps/api/test/health.test.ts`
- Zmień: `apps/api/package.json` (skrypt `dev`)

**Interfejsy:**
- Korzysta z: `parseEnv` (zadanie 2).
- Wytwarza: `type Database`, `createDb(url: string): Database`, `createApp({ db }: { db: Database })` zwracające aplikację Hono z trasą `GET /api/health` (`200 { status: 'ok', db: 'ok' }` lub `503 { status: 'error', db: 'unreachable' }`), `type AppType` oraz `createTestApp(): { app, client }` w testach.

**Kroki:**

- [ ] **1. Zależności.**

  ```bash
  pnpm --filter @one-place/api add hono@^4 @hono/node-server@^2 drizzle-orm@^0.45 pg@^8
  pnpm --filter @one-place/api add -D tsx @types/pg @electric-sql/pglite@^0.5
  ```

- [ ] **2. Typ bazy.** W `src/db/client.ts` zdefiniuj `type Database` wspólny dla Postgresa i PGlite oraz funkcję `createDb(databaseUrl)`.
- [ ] **3. Pomocnik testowy.** W `test/create-test-app.ts` utwórz `createTestApp()`, który tworzy `new PGlite()`, opakowuje go przez `drizzle({ client })` i zwraca `{ app, client }`.
- [ ] **4. Czerwone testy** w `test/health.test.ts`:
  - `GET /api/health` zwraca `200` i `{ status: 'ok', db: 'ok' }`;
  - po `await client.close()` zwraca `503` i `{ status: 'error', db: 'unreachable' }` (to jest punkt 1 z [Na co uważać](#na-co-uważać)).
- [ ] **5. Uruchom.** Oczekiwany wynik: **FAIL**, bo `createApp` nie istnieje.
- [ ] **6. Implementacja** `src/app.ts`: `new Hono().basePath('/api').get('/health', …)`. Zapytanie `select 1` umieść w `try`/`catch`. Wyeksportuj `type AppType = ReturnType<typeof createApp>`.
- [ ] **7. Zielone testy.** Oczekiwany wynik: **PASS (5 testów w pakiecie API)**.
- [ ] **8. Punkt wejścia** `src/index.ts`: `parseEnv(process.env)` → `createDb` → `createApp` → `serve()`. Dodaj skrypt `"dev": "tsx watch --env-file=.env src/index.ts"`.
- [ ] **9. Postgres w Dockerze.** Utwórz `docker-compose.yml` z obrazem `postgres:18` i uruchom `docker compose up -d`.
- [ ] **10. Sprawdzenie ręczne.**

  ```bash
  cp apps/api/.env.example apps/api/.env
  pnpm --filter @one-place/api dev
  curl -i localhost:3000/api/health      # 200 {"status":"ok","db":"ok"}
  docker compose stop
  curl -i localhost:3000/api/health      # 503 {"status":"error","db":"unreachable"}, serwer działa dalej
  docker compose start
  ```

  Sprawdź też punkt 2 z [Na co uważać](#na-co-uważać): uruchom serwer z pustym `DATABASE_URL` i zobacz komunikat z nazwą zmiennej.
- [ ] **11.** `pnpm format && pnpm check`, potem commit: `feat(api): Hono, połączenie z bazą i /api/health`.

<details>
<summary>Podpowiedź</summary>

- Drizzle ma osobne „drivery”: `drizzle-orm/node-postgres` dla produkcji i `drizzle-orm/pglite` dla testów. Oba zwracają obiekty dziedziczące po `PgDatabase` z `drizzle-orm/pg-core`, więc to dobry wspólny typ.
- `` db.execute(sql`select 1`) `` wykonuje surowe zapytanie bez definiowania tabel.
- `app.request('/api/health')` wywołuje aplikację Hono bez uruchamiania serwera HTTP. Testy są dzięki temu szybkie i nie zajmują portów.
- `c.json(obiekt, 503)` ustawia status. `as const` przy obiekcie zawęża typy literałów, co przyda się klientowi RPC w zadaniu 6.
- **Pułapka Postgres 18:** w obrazie `postgres:18` wolumen montuje się do `/var/lib/postgresql`, a nie do `/var/lib/postgresql/data` jak we wcześniejszych wersjach.
- Jeśli port 5432 jest zajęty przez lokalnego Postgresa, zmień mapowanie na `"55432:5432"` i port w `DATABASE_URL`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/db/client.ts`
```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'

export type Database = PgDatabase<PgQueryResultHKT>

export function createDb(databaseUrl: string): Database {
  return drizzle(databaseUrl)
}
```

`apps/api/test/create-test-app.ts`
```ts
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { createApp } from '../src/app'

export function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  const app = createApp({ db })
  return { app, client }
}
```

`apps/api/test/health.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { createTestApp } from './create-test-app'

describe('GET /api/health', () => {
  it('zwraca ok, gdy baza odpowiada', async () => {
    const { app } = createTestApp()
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' })
  })

  it('zwraca 503, gdy baza nie odpowiada', async () => {
    const { app, client } = createTestApp()
    await client.close()
    const res = await app.request('/api/health')
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ status: 'error', db: 'unreachable' })
  })
})
```

`apps/api/src/app.ts`
```ts
import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import type { Database } from './db/client'

interface AppDeps {
  db: Database
}

export function createApp({ db }: AppDeps) {
  return new Hono().basePath('/api').get('/health', async (c) => {
    try {
      await db.execute(sql`select 1`)
      return c.json({ status: 'ok', db: 'ok' } as const)
    } catch {
      return c.json({ status: 'error', db: 'unreachable' } as const, 503)
    }
  })
}

export type AppType = ReturnType<typeof createApp>
```

`apps/api/src/index.ts`
```ts
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { createDb } from './db/client'
import { parseEnv } from './env'

const env = parseEnv(process.env)
const app = createApp({ db: createDb(env.DATABASE_URL) })

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API działa na http://localhost:${info.port}`)
})
```

`docker-compose.yml` (w katalogu głównym repozytorium)
```yaml
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_USER: one
      POSTGRES_PASSWORD: one
      POSTGRES_DB: one_place
    ports:
      - '5432:5432'
    volumes:
      - db-data:/var/lib/postgresql

volumes:
  db-data:
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Po co fabryka `createApp({ db })` zamiast globalnego `app` z bazą utworzoną w środku?** Testy podają PGlite, a produkcja Postgresa. Ten sam kod tras działa na obu bazach, bez mocków.
2. **Dlaczego PGlite, a nie mock bazy?** PGlite to prawdziwy Postgres (skompilowany do WASM). Testy sprawdzają prawdziwe SQL, ograniczenia i kolacje, a mock sprawdzałby tylko, czy wywołałeś funkcję.
3. **Dlaczego błąd bazy daje 503, a nie 500?** 503 (Service Unavailable) mówi, że serwis chwilowo nie działa z powodu zależności. Monitoring i load balancery traktują to inaczej niż błąd w kodzie.

</details>

---

## Zadanie 4: rozszerzenie z WXT, Vue i Nuxt UI (ryzyka R1 i R2)

**Cel:** nowa karta przeglądarki pokazuje przycisk Nuxt UI z ikoną, a ikona nie jest pobierana z internetu. Rozszerzenie ma stałe ID.

**Czego się nauczysz:** struktura projektu WXT, nadpisanie nowej karty, plugin Vite Nuxt UI w trybie Vue (bez Nuxta), wkompilowanie ikon w paczkę, klucz i ID rozszerzenia, ładowanie rozszerzenia w trybie deweloperskim.

**Pliki:**
- Utwórz: `.npmrc`, `scripts/generate-extension-key.mjs`
- Utwórz: `apps/extension/package.json`, `apps/extension/wxt.config.ts`, `apps/extension/tsconfig.json`
- Utwórz: `apps/extension/src/entrypoints/newtab/index.html`, `main.ts`, `App.vue`, `apps/extension/src/assets/main.css`

**Interfejsy:**
- Wytwarza: zbudowane rozszerzenie w `apps/extension/.output/chrome-mv3/` oraz **ID rozszerzenia** (32 litery a–p), które w zadaniu 6 trafi do `ALLOWED_ORIGINS`.

**Kroki:**

- [ ] **1. `.npmrc` w katalogu głównym** z linią `public-hoist-pattern[]=@wxt-dev/*`. Dlaczego, wyjaśnia sekcja „Pułapki” poniżej.
- [ ] **2. `package.json` rozszerzenia, na razie bez `postinstall`.** Nazwa `@one-place/extension`, skrypty `dev`: `wxt`, `build`: `wxt build`, `typecheck`: `vue-tsc --noEmit`, `test`: `vitest run --passWithNoTests`.
- [ ] **3. Zależności.**

  ```bash
  pnpm --filter @one-place/extension add vue@^3.5 @nuxt/ui@^4 tailwindcss@^4
  pnpm --filter @one-place/extension add -D wxt@^0.21 @wxt-dev/module-vue@^1 vue-tsc@^3 @iconify-json/lucide
  ```

- [ ] **4. `wxt.config.ts`:** `srcDir: 'src'`, moduł Vue, plugin `ui()` z `router: false`, `colorMode: false` i `icon.clientBundle.scan: true` oraz manifest z nazwą, wersją i `permissions: ['storage']`.
- [ ] **5. Punkt wejścia `newtab`.** WXT rozpoznaje nazwę katalogu `newtab` i sam dodaje `chrome_url_overrides.newtab` do manifestu. Utwórz `index.html`, `main.ts` (montuje Vue z pluginem Nuxt UI i importuje CSS), `App.vue` (`<UApp>` z jednym `<UButton icon="i-lucide-rocket">`) i `src/assets/main.css` (import Tailwind i Nuxt UI).
- [ ] **6. Typy WXT.** Dodaj skrypt `"postinstall": "wxt prepare"`, `tsconfig.json` z `{ "extends": "./.wxt/tsconfig.json" }` i uruchom `pnpm install`.
- [ ] **7. Stałe ID.** Napisz `scripts/generate-extension-key.mjs`, który generuje parę kluczy RSA i wypisuje klucz publiczny (base64 DER) oraz wyliczone z niego ID. Uruchom go: `node scripts/generate-extension-key.mjs`. Wklej klucz do `manifest.key` w `wxt.config.ts`, a **ID zapisz**, bo przyda się w zadaniu 6.
- [ ] **8. Uruchomienie.** `pnpm --filter @one-place/extension dev`. WXT buduje rozszerzenie i otwiera przeglądarkę. Otwórz nową kartę: widać przycisk z ikoną rakiety.

  Jeśli przeglądarka się nie otworzy albo nie ma w niej rozszerzenia, załaduj je ręcznie: `chrome://extensions` → włącz „Tryb dewelopera” → „Załaduj rozpakowane” → wskaż `apps/extension/.output/chrome-mv3-dev`.
- [ ] **9. Sprawdź ID.** Na `chrome://extensions` ID rozszerzenia musi być takie samo jak to z kroku 7.
- [ ] **10. Sprawdź R2 (punkt 5 z [Na co uważać](#na-co-uważać)).** Na nowej karcie otwórz DevTools → Network → zaznacz „Offline” → przeładuj. Ikona nadal widoczna, a w filtrze `iconify` brak żądań.
- [ ] **11.** `pnpm --filter @one-place/extension build` przechodzi, potem `pnpm format && pnpm check` i commit: `feat(extension): nowa karta z WXT, Vue i Nuxt UI`.

**Pułapki (sprawdzone na prototypie):**
- **WXT nie znajduje `@wxt-dev/module-vue`** („Cannot find package”). WXT wczytuje moduły przez `import.meta.resolve(id, rodzic)`, a Node 24 bez flagi eksperymentalnej ignoruje drugi argument. Moduł jest więc szukany od miejsca, w którym leży sam WXT, a pnpm izoluje pakiety. `public-hoist-pattern[]=@wxt-dev/*` wynosi te pakiety do głównego `node_modules`. Jeśli zmienisz `.npmrc` po instalacji, pnpm zapyta o przebudowę `node_modules`: potwierdź.
- **`postinstall: wxt prepare` przed konfiguracją** kończy instalację błędem, bo nie ma jeszcze `wxt.config.ts` ani modułów. Dlatego skrypt dochodzi dopiero w kroku 6.
- **zsh i `workspace:*`:** w zsh gwiazdka jest wzorcem plików. Pisz `pnpm add '@one-place/shared@workspace:*'` w apostrofach.
- **Alias `@` i `~`** w WXT wskazuje na `srcDir`. Bez `srcDir: 'src'` import `@/api/...` nie zadziała, bo alias wskazywałby katalog `apps/extension`.
- **`document` w szablonie Vue jest niedostępne.** Operacje na DOM umieszczaj w funkcjach w `<script setup>`.

<details>
<summary>Podpowiedź</summary>

- Opcje pluginu Nuxt UI dla Vue opisuje [instalacja w Vue](https://ui.nuxt.com/docs/getting-started/installation/vue), a wkompilowanie ikon [ikony w Vue](https://ui.nuxt.com/docs/getting-started/integrations/icons/vue#collections). Typy opcji znajdziesz też w `node_modules/@nuxt/ui/dist/unplugin.d.mts`.
- `router: false` jest potrzebne, bo nie używamy `vue-router`, a Nuxt UI domyślnie zakłada router.
- `colorMode: false` wyłącza wbudowane przełączanie trybu, bo trybem będzie zarządzał nasz moduł motywu.
- ID rozszerzenia to pierwsze 32 znaki szesnastkowe SHA-256 z klucza publicznego (DER), z cyframi `0–f` zamienionymi na litery `a–p`.

</details>

<details>
<summary>Rozwiązanie</summary>

`.npmrc`
```
public-hoist-pattern[]=@wxt-dev/*
```

`apps/extension/package.json` (stan po kroku 6, bez sekcji zależności)
```json
{
  "name": "@one-place/extension",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "postinstall": "wxt prepare"
  }
}
```

`apps/extension/wxt.config.ts`
```ts
import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [
      ui({
        router: false,
        colorMode: false,
        ui: { colors: { primary: 'blue', neutral: 'zinc' } },
        icon: { clientBundle: { scan: true } },
      }),
    ],
  }),
  manifest: {
    name: 'One Place',
    version: '0.0.1',
    permissions: ['storage'],
    key: '<KLUCZ Z generate-extension-key.mjs>',
  },
})
```

`apps/extension/tsconfig.json`
```json
{ "extends": "./.wxt/tsconfig.json" }
```

`apps/extension/src/entrypoints/newtab/index.html`
```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nowa karta</title>
  </head>
  <body>
    <div id="app" class="isolate"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

`apps/extension/src/entrypoints/newtab/main.ts`
```ts
import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import '~/assets/main.css'

createApp(App).use(ui).mount('#app')
```

`apps/extension/src/entrypoints/newtab/App.vue`
```vue
<template>
  <UApp>
    <main class="grid min-h-screen place-items-center bg-default text-default">
      <UButton icon="i-lucide-rocket" label="Nuxt UI działa" />
    </main>
  </UApp>
</template>
```

`apps/extension/src/assets/main.css`
```css
@import 'tailwindcss';
@import '@nuxt/ui';
```

`scripts/generate-extension-key.mjs`
```js
import { createHash, generateKeyPairSync } from 'node:crypto'

const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const der = publicKey.export({ type: 'spki', format: 'der' })
const id = createHash('sha256')
  .update(der)
  .digest('hex')
  .slice(0, 32)
  .split('')
  .map((char) => String.fromCharCode(97 + parseInt(char, 16)))
  .join('')

console.log(`KEY=${der.toString('base64')}`)
console.log(`ID=${id}`)
```

Klucz publiczny nie jest sekretem i może być w repozytorium. Klucz prywatny nie jest potrzebny: przy publikacji Chrome Web Store dostarcza własny klucz (Etap 11).

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Po co stałe ID rozszerzenia?** Origin rozszerzenia to `chrome-extension://<ID>`. Bez `key` ID zależy od ścieżki instalacji i zmienia się między komputerami, a API musi znać origin, żeby przepuścić żądania przez CORS.
2. **Dlaczego ikony muszą być w paczce?** Ze względu na prywatność (bez żądań do zewnętrznych serwisów), działanie offline i review w Chrome Web Store, które sprawdza zdalnie ładowane zasoby.
3. **Skąd WXT wie, że ta strona zastępuje nową kartę?** Z nazwy punktu wejścia: katalog `entrypoints/newtab/` jest konwencją WXT dla `chrome_url_overrides.newtab`.

</details>

---

## Zadanie 5: akcent i tryb ciemny w trakcie działania (ryzyko R3)

**Cel:** kliknięcie koloru zmienia akcent całego UI bez przeładowania, a przycisk przełącza tryb jasny i ciemny.

**Czego się nauczysz:** jak Nuxt UI buduje kolory ze zmiennych CSS, kaskada (styl inline kontra arkusz), tree-shaking zmiennych motywu w Tailwind v4, import pakietu z workspace'u.

**Pliki:**
- Zmień: `apps/extension/package.json` (zależność `@one-place/shared`), `apps/extension/src/entrypoints/newtab/App.vue`, `apps/extension/src/assets/main.css`

**Interfejsy:**
- Korzysta z: `ACCENT_COLORS`, `AccentColor` i `accentCssVariables` z `@one-place/shared` (zadanie 1).

**Kroki:**

- [ ] **1. Zależność od `shared`.** `pnpm --filter @one-place/extension add '@one-place/shared@workspace:*'`
- [ ] **2. Przyciski akcentów.** W `App.vue` wyrenderuj przycisk dla każdego koloru z `ACCENT_COLORS`. Kliknięcie wywołuje `setAccent(accent)`, które ustawia każdą zmienną z `accentCssVariables(accent)` na `document.documentElement.style`.
- [ ] **3. Tryb ciemny.** Przycisk z ikoną `i-lucide-moon` lub `i-lucide-sun` przełącza klasę `dark` na `<html>`.
- [ ] **4. Eksperyment.** Uruchom rozszerzenie i kliknij `green`. **Oczekiwany wynik: przycisk „Nuxt UI działa” traci kolor tła (staje się przezroczysty).**
- [ ] **5. Diagnoza.** W DevTools → Elements zaznacz `<html>`, zakładka Computed i znajdź `--color-green-500`. Wartość jest pusta. Zastanów się dlaczego, zanim otworzysz wyjaśnienie poniżej.
- [ ] **6. Poprawka.** W `main.css` zmień pierwszy import na `@import 'tailwindcss' theme(static);`.
- [ ] **7. Sprawdzenie.** Wszystkie 10 akcentów działa w trybie jasnym i ciemnym. W trybie ciemnym kolor jest jaśniejszy (odcień 400 zamiast 500). Zanotuj, o ile urósł CSS po buildzie (w prototypie było to około 14 kB).
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): zmiana akcentu i trybu w trakcie działania`.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 5)</summary>

- Nuxt UI w trakcie działania wstrzykuje styl `:root { --ui-color-primary-500: var(--color-blue-500, <wartość zapasowa>) … }`, a komponenty używają `--ui-primary`, które wskazuje na `--ui-color-primary-500` (lub 400 w trybie ciemnym).
- Nasze `setAccent` ustawia te same zmienne jako **styl inline** na `<html>`. Styl inline wygrywa z każdą regułą z arkusza, więc nadpisuje ustawienia Nuxt UI.
- Ustawiamy jednak `var(--color-green-500)` **bez wartości zapasowej**. Tailwind v4 emituje do CSS tylko te zmienne motywu, których faktycznie używasz w klasach, więc `--color-green-500` nie istnieje. Zmienna jest wtedy nieważna i tło przycisku znika.
- `theme(static)` każe Tailwindowi wyemitować wszystkie zmienne motywu, w tym wszystkie palety. Kosztuje to kilkanaście kB CSS, co dla lokalnie ładowanego rozszerzenia nie ma znaczenia.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/assets/main.css`
```css
@import 'tailwindcss' theme(static);
@import '@nuxt/ui';
```

`apps/extension/src/entrypoints/newtab/App.vue`
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ACCENT_COLORS, accentCssVariables, type AccentColor } from '@one-place/shared'

const isDark = ref(false)

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

function setAccent(accent: AccentColor) {
  for (const [name, value] of Object.entries(accentCssVariables(accent))) {
    document.documentElement.style.setProperty(name, value)
  }
}
</script>

<template>
  <UApp>
    <main class="grid min-h-screen place-items-center bg-default text-default">
      <div class="flex flex-col items-center gap-6">
        <UButton icon="i-lucide-rocket" label="Nuxt UI działa" />
        <div class="flex flex-wrap justify-center gap-2">
          <UButton
            v-for="accent in ACCENT_COLORS"
            :key="accent"
            :label="accent"
            size="xs"
            variant="soft"
            @click="setAccent(accent)"
          />
        </div>
        <UButton
          :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          variant="outline"
          @click="toggleDark"
        />
      </div>
    </main>
  </UApp>
</template>
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego styl inline jest dobrym miejscem na akcent?** Wygrywa z arkuszami bez `!important`, a ten sam mechanizm zadziała w skrypcie startowym przed załadowaniem Vue (Etap 5), więc oba miejsca dadzą identyczny wynik.
2. **Dlaczego `accentCssVariables` leży w `shared`, a nie w rozszerzeniu?** Bo jest czystą funkcją bez zależności od przeglądarki: łatwo ją testować, a w Etapie 5 skorzysta z niej zarówno aplikacja, jak i skrypt startowy motywu.
3. **Co robi klasa `dark` na `<html>`?** Nuxt UI definiuje wariant `dark` jako `.dark` oraz jego potomków i w nim przełącza zmienne tła, tekstu i odcień `--ui-primary`.

</details>

---

## Zadanie 6: rozszerzenie rozmawia z API (CORS i Hono RPC)

**Cel:** nowa karta pokazuje plakietkę ze stanem API. Po drodze zobaczysz błąd CORS na własne oczy i naprawisz go testem.

**Czego się nauczysz:** klient RPC Hono (`hc<AppType>`) z typami prosto z backendu, composable w Vue, zmienne środowiskowe w WXT, CORS i origin rozszerzenia.

**Pliki:**
- Utwórz: `apps/extension/src/api/client.ts`, `apps/extension/src/api/use-api-health.ts`, `apps/extension/src/env.d.ts`, `apps/extension/.env.example`
- Zmień: `apps/extension/src/entrypoints/newtab/App.vue`, `apps/api/package.json` (`exports`), `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/test/create-test-app.ts`, `apps/api/.env.example`
- Test: `apps/api/test/health.test.ts` (nowy przypadek CORS)

**Interfejsy:**
- Korzysta z: `AppType` i `createApp` (zadanie 3), `parseEnv` z polem `ALLOWED_ORIGINS` (zadanie 2), ID rozszerzenia (zadanie 4).
- Zmienia: `createApp({ db, allowedOrigins }: { db: Database; allowedOrigins: string[] })`. Eksportuje `TEST_ORIGIN` z pomocnika testowego.
- Wytwarza: `apiClient` (`hc<AppType>`) oraz `useApiHealth(): { health: Ref<'checking' | 'ok' | 'db-down' | 'unreachable'> }`.

**Kroki:**

- [ ] **1. Eksport typów z API.** W `apps/api/package.json` dodaj `"exports": { ".": "./src/app.ts" }`.
- [ ] **2. Zależności rozszerzenia.**

  ```bash
  pnpm --filter @one-place/extension add hono@^4
  pnpm --filter @one-place/extension add -D '@one-place/api@workspace:*'
  ```

  API jest zależnością deweloperską, bo importujesz z niego **tylko typ** (`import type`), który znika po kompilacji.
- [ ] **3. Adres API.** `apps/extension/.env` i `.env.example` z `WXT_API_URL=http://localhost:3000`. Typ zmiennej zadeklaruj w `src/env.d.ts`.
- [ ] **4. Klient i composable.** `src/api/client.ts` tworzy `apiClient = hc<AppType>(import.meta.env.WXT_API_URL)`. `src/api/use-api-health.ts` po zamontowaniu woła `apiClient.api.health.$get()` i ustawia stan: `ok`, `db-down` (odpowiedź inna niż 2xx) albo `unreachable` (wyjątek sieciowy).
- [ ] **5. Plakietka.** W `App.vue` pokaż `` <UBadge :label="`API: ${health}`"> `` w kolorze `success` dla `ok`, a w pozostałych przypadkach `error`.
- [ ] **6. Eksperyment.** Uruchom API i rozszerzenie (`pnpm dev` w katalogu głównym uruchomi oba). **Oczekiwany wynik: plakietka `API: unreachable`, a w konsoli DevTools błąd CORS** („blocked by CORS policy: No 'Access-Control-Allow-Origin' header”).
- [ ] **7. Czerwony test.** W `health.test.ts` dodaj przypadek: żądanie z nagłówkiem `Origin: TEST_ORIGIN` dostaje `Access-Control-Allow-Origin: TEST_ORIGIN`, a żądanie z `Origin: https://evil.example` nie dostaje tego nagłówka wcale (punkt 3 z [Na co uważać](#na-co-uważać)). W `create-test-app.ts` wyeksportuj `TEST_ORIGIN = 'chrome-extension://test-extension-id'` i przekaż go do `createApp`. Oczekiwany wynik: **FAIL** (typecheck lub brak nagłówka).
- [ ] **8. Implementacja.** `createApp` przyjmuje `allowedOrigins` i dodaje `.use(cors({ origin: allowedOrigins }))` z `hono/cors`. `index.ts` przekazuje `env.ALLOWED_ORIGINS`.
- [ ] **9. Zielone testy.** Oczekiwany wynik: **PASS (6 testów w pakiecie API)**.
- [ ] **10. Konfiguracja.** W `apps/api/.env` ustaw `ALLOWED_ORIGINS=chrome-extension://<ID z zadania 4>`. Zaktualizuj `.env.example` (z przykładowym, nie prawdziwym ID). Zrestartuj API i przeładuj kartę. **Oczekiwany wynik: `API: ok`.**
- [ ] **11. Odporność (punkt 4 z [Na co uważać](#na-co-uważać)).** Zatrzymaj API i przeładuj kartę: plakietka `API: unreachable`, w konsoli tylko informacja o nieudanym żądaniu, bez „Uncaught”. Zatrzymaj tylko Dockera: plakietka `API: db-down`.
- [ ] **12.** `pnpm format && pnpm check`, potem commit: `feat: połączenie nowej karty z API (CORS, Hono RPC)`.

<details>
<summary>Podpowiedź</summary>

- Ścieżka w kliencie RPC odpowiada ścieżce URL: trasa `/api/health` to `apiClient.api.health.$get()`.
- Typy klienta działają, bo trasy w `createApp` są zdefiniowane **łańcuchowo** (`new Hono().basePath(...).use(...).get(...)`). Gdybyś pisał `app.get(...)` w osobnych instrukcjach, `AppType` nie znałby tras.
- Zmienne środowiskowe w WXT muszą mieć prefiks `WXT_` (lub `VITE_`), żeby trafiły do `import.meta.env`.
- `hono/cors` z tablicą originów odsyła nagłówek tylko wtedy, gdy origin żądania jest na liście.

</details>

<details>
<summary>Rozwiązanie: API</summary>

`apps/api/src/app.ts`
```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sql } from 'drizzle-orm'
import type { Database } from './db/client'

interface AppDeps {
  db: Database
  allowedOrigins: string[]
}

export function createApp({ db, allowedOrigins }: AppDeps) {
  return new Hono()
    .basePath('/api')
    .use(cors({ origin: allowedOrigins }))
    .get('/health', async (c) => {
      try {
        await db.execute(sql`select 1`)
        return c.json({ status: 'ok', db: 'ok' } as const)
      } catch {
        return c.json({ status: 'error', db: 'unreachable' } as const, 503)
      }
    })
}

export type AppType = ReturnType<typeof createApp>
```

`apps/api/src/index.ts` (zmieniona linia)
```ts
const app = createApp({ db: createDb(env.DATABASE_URL), allowedOrigins: env.ALLOWED_ORIGINS })
```

`apps/api/test/create-test-app.ts`
```ts
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { createApp } from '../src/app'

export const TEST_ORIGIN = 'chrome-extension://test-extension-id'

export function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  const app = createApp({ db, allowedOrigins: [TEST_ORIGIN] })
  return { app, client }
}
```

Nowy przypadek w `apps/api/test/health.test.ts` (import `TEST_ORIGIN` z `./create-test-app`)
```ts
it('pozwala na CORS tylko dla originu rozszerzenia', async () => {
  const { app } = createTestApp()
  const allowed = await app.request('/api/health', { headers: { Origin: TEST_ORIGIN } })
  expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe(TEST_ORIGIN)
  const denied = await app.request('/api/health', { headers: { Origin: 'https://evil.example' } })
  expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull()
})
```

`apps/api/.env.example`
```
DATABASE_URL=postgres://one:one@localhost:5432/one_place
PORT=3000
ALLOWED_ORIGINS=chrome-extension://abcdefghijklmnopabcdefghijklmnop
```

</details>

<details>
<summary>Rozwiązanie: rozszerzenie</summary>

`apps/extension/.env.example`
```
WXT_API_URL=http://localhost:3000
```

`apps/extension/src/env.d.ts`
```ts
interface ImportMetaEnv {
  readonly WXT_API_URL: string
}
```

`apps/extension/src/api/client.ts`
```ts
import { hc } from 'hono/client'
import type { AppType } from '@one-place/api'

export const apiClient = hc<AppType>(import.meta.env.WXT_API_URL)
```

`apps/extension/src/api/use-api-health.ts`
```ts
import { onMounted, ref } from 'vue'
import { apiClient } from './client'

export type ApiHealth = 'checking' | 'ok' | 'db-down' | 'unreachable'

export function useApiHealth() {
  const health = ref<ApiHealth>('checking')

  onMounted(async () => {
    try {
      const res = await apiClient.api.health.$get()
      health.value = res.ok ? 'ok' : 'db-down'
    } catch {
      health.value = 'unreachable'
    }
  })

  return { health }
}
```

`App.vue`: w `<script setup>` dodaj
```ts
import { useApiHealth } from '@/api/use-api-health'

const { health } = useApiHealth()
```
a w szablonie, pod przyciskiem „Nuxt UI działa”:
```vue
<UBadge
  :label="`API: ${health}`"
  :color="health === 'ok' ? 'success' : 'error'"
  variant="subtle"
/>
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego bez CORS żądanie się nie udaje, skoro rozszerzenie i API działają na tym samym komputerze?** Origin `chrome-extension://<ID>` różni się od `http://localhost:3000`, więc przeglądarka wymaga zgody serwera. Rozszerzenie mogłoby ją obejść przez `host_permissions`, ale celowo z nich rezygnujemy (decyzja D12).
2. **Skąd klient zna typy odpowiedzi, skoro nie ma generowania kodu?** `AppType` to typ zbudowany z łańcucha tras Hono. `hc<AppType>` odczytuje z niego ścieżki, metody i typy `c.json(...)`.
3. **Dlaczego `@one-place/api` jest w `devDependencies` rozszerzenia?** Importujesz tylko typ. Po kompilacji nic z API nie trafia do paczki rozszerzenia.

</details>

---

## Zadanie 7: domknięcie Etapu 0

**Cel:** spełniona definicja ukończenia Etapu 0, zapisane wyniki ryzyk i budżet rozmiaru.

**Kroki:**

- [ ] **1. Pomiar.** `pnpm --filter @one-place/extension build` i zanotuj rozmiary JS i CSS z podsumowania. W prototypie było to około 268 kB JS i 211 kB CSS (bez kompresji).
- [ ] **2. Budżet.** Wpisz budżet startowego JS do [02-specyfikacja.md](02-specyfikacja.md) w wierszu „Wydajność”, np. „zmierzony rozmiar + 25%”, w miejsce zdania o ustaleniu budżetu w Etapie 0.
- [ ] **3. Wyniki ryzyk.** W [03-architektura.md](03-architektura.md), w tabeli ryzyk, oznacz R1, R2 i R3 jako potwierdzone i krótko opisz zastosowane rozwiązania: `.npmrc` z hoistem, `srcDir`, `icon.clientBundle`, `colorMode: false`, `theme(static)`.
- [ ] **4. README.** Dodaj sekcję „Uruchomienie lokalne”: wymagania, `docker compose up -d`, kopiowanie obu plików `.env.example`, generowanie klucza, `pnpm install`, `pnpm dev` i odnośnik do `docs/`.
- [ ] **5. Definicja ukończenia** z [roadmapy](04-roadmapa.md#etap-0-fundament-i-sprawdzenie-ryzyk):
  - [ ] `pnpm dev` uruchamia API i przeglądarkę z rozszerzeniem;
  - [ ] nowa karta pokazuje przycisk Nuxt UI z ikoną bez żądań do zewnętrznych hostów;
  - [ ] akcent i tryb zmieniają się w trakcie działania;
  - [ ] `/api/health` odpowiada, a testy na PGlite przechodzą;
  - [ ] wyniki R1–R3 są zapisane.
- [ ] **6.** `pnpm check`, potem commit: `docs: wyniki Etapu 0, budżet rozmiaru i uruchomienie lokalne`.

---

## Materiały

| Temat | Gdzie czytać |
|---|---|
| pnpm workspaces | https://pnpm.io/workspaces |
| WXT (struktura, punkty wejścia, env) | https://wxt.dev |
| Nuxt UI w Vue (bez Nuxta) | https://ui.nuxt.com/docs/getting-started/installation/vue |
| Ikony Nuxt UI w Vue | https://ui.nuxt.com/docs/getting-started/integrations/icons/vue |
| Tailwind v4: zmienne motywu | https://tailwindcss.com/docs/theme |
| Hono: testowanie | https://hono.dev/docs/guides/testing |
| Hono: RPC | https://hono.dev/docs/guides/rpc |
| Drizzle z Postgresem | https://orm.drizzle.team/docs/get-started-postgresql |
| Zod 4 | https://zod.dev |
| Vitest | https://vitest.dev/guide/ |
| Klucz manifestu i ID rozszerzenia | https://developer.chrome.com/docs/extensions/reference/manifest/key |
| CORS | https://developer.mozilla.org/docs/Web/HTTP/CORS |

## Co dalej

Po Etapie 0 kolejnym krokiem jest [Etap 1: Logowanie](04-roadmapa.md#etap-1-logowanie). Przygotuję dla niego podobny plan nauki, gdy będziesz gotowy. Etap 1 wprowadzi pierwsze tabele (Better Auth), konfigurację `drizzle-kit` i migracje.
