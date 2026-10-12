# 06. Etap 1: Logowanie (plan nauki)

Ten plik prowadzi przez [Etap 1 z roadmapy](04-roadmapa.md#etap-1-logowanie). Format jest taki sam jak w [planie Etapu 0](05-implementacja-poczatkowa.md): każde zadanie mówi, **co** zrobić, **dlaczego** i **jak sprawdzić**, że działa. Gotowy kod jest schowany w zwijanych blokach „Rozwiązanie”.

**Cel:** użytkownik zakłada konto, loguje się, po przeładowaniu karty nadal jest zalogowany i może się wylogować. API ma jednolity format błędów, logi JSON z `requestId` i pierwszy chroniony endpoint.

**Architektura:** Better Auth działa w API pod `/api/auth/*` z adapterem Drizzle. Tabele generuje CLI Better Auth, a migracje drizzle-kit. Te same migracje trafiają do Postgresa i do PGlite w testach. Rozszerzenie nie używa ciasteczek: token sesji z nagłówka `set-auth-token` trafia do `chrome.storage.local`, a każde żądanie niesie go w nagłówku `Authorization: Bearer`. Rozszerzenie ma dwóch klientów: `authClient` z Better Auth (rejestracja, logowanie, wylogowanie) i `apiClient` z Hono RPC (pozostałe endpointy, odpowiedź 401 kończy sesję).

**Specyfikacja:** F-AUTH-01 … F-AUTH-06 w [02-specyfikacja.md](02-specyfikacja.md#logowanie-auth), sekcje „API”, „Better Auth” i „Warstwa danych” w [03-architektura.md](03-architektura.md) oraz ryzyko R5.

> Rozwiązania sprawdziłem na prototypie 11.10.2026 (macOS, Node 24.7, pnpm 10.24, Better Auth 1.7.7, Chrome for Testing 156): 51 testów, lint, typecheck i build. W przeglądarce z załadowanym rozszerzeniem sprawdziłem rejestrację, logowanie, przeładowanie karty, kilka otwartych kart, wylogowanie, wygasłą sesję, limit prób logowania, wyłączone API oraz język polski i angielski, zarówno w `pnpm dev`, jak i w zbudowanej paczce.

## Jak korzystać z planu

Tak samo jak w Etapie 0:

1. Przeczytaj całe zadanie przed rozpoczęciem.
2. Odhaczaj kroki (`- [ ]` na `- [x]`).
3. W krokach z testem **najpierw zobacz czerwony test**, dopiero potem pisz implementację.
4. Gdy utkniesz na ponad 15 minut, otwórz „Podpowiedź”, a potem „Rozwiązanie”.
5. Każde zadanie kończy się zielonym `pnpm check` i commitem.
6. Na końcu zadania odpowiedz na pytania kontrolne.

Niektóre kroki to **eksperymenty**: celowo zostawiasz coś niedokończone, żeby zobaczyć błąd na własne oczy, zanim go naprawisz.

## Wymagania wstępne

- [ ] Etap 0 jest skończony, a `pnpm check` przechodzi
- [ ] Postgres działa: `docker compose up -d`
- [ ] `apps/api/.env` i `apps/extension/.env` istnieją (z Etapu 0)
- [ ] `openssl` jest dostępny (w macOS jest domyślnie), posłuży do wygenerowania sekretu

## Ograniczenia globalne

Obowiązują [ograniczenia z Etapu 0](05-implementacja-poczatkowa.md#ograniczenia-globalne) oraz:

| Pakiet                       | Wersja  | Gdzie                | Uwagi                                                                 |
| ---------------------------- | ------- | -------------------- | --------------------------------------------------------------------- |
| `better-auth`                | `^1.7`  | API i rozszerzenie   | serwer oraz klient z `better-auth/vue`                                |
| `auth`                       | `^1.7`  | API (dev)            | CLI Better Auth. Dawny `@better-auth/cli` zatrzymał się na wersji 1.4 |
| `drizzle-kit`                | `^0.31` | API (dev)            | pasuje do `drizzle-orm` `^0.45`                                       |
| `pino`                       | `^10`   | API                  | logi JSON                                                             |
| `vue-i18n`                   | `^11`   | rozszerzenie         | tryb Composition API (`legacy: false`)                                |
| `@intlify/unplugin-vue-i18n` | `^11`   | rozszerzenie (dev)   | dopiero w zadaniu 11                                                  |
| `zod`                        | `^4`    | shared, rozszerzenie | w rozszerzeniu importujesz z niego tylko typy                         |

- Token sesji jest przechowywany tylko w `chrome.storage.local` (wymaganie „Bezpieczeństwo”). Rozszerzenie nie używa ciasteczek, więc jego żądania mają `credentials: 'omit'`, a CORS w API nie dopuszcza credentials.
- Teksty w UI tylko przez i18n (`pl.json`, `en.json`). Nazwy w kodzie, opisy testów, komunikaty błędów API, logi i commity po angielsku.
- Telemetria Better Auth jest jawnie wyłączona (`telemetry: { enabled: false }`). Tę samą konfigurację czyta CLI, więc wyłączenie obejmuje też je.

## Na co uważać

Pięć sytuacji, które łatwo przeoczyć, a które najbardziej psują wrażenie z używania:

1. **Złe hasło to nie wygasła sesja.** Logowanie z błędnym hasłem zwraca 401. Ma się wtedy pojawić „Nieprawidłowy e-mail lub hasło”, a nie wylogowanie z komunikatem „Sesja wygasła”. Dlatego na 401 reaguje tylko `apiClient`, a `authClient` nie. Zadania 8 i 9.
2. **API niedostępne.** Logowanie pokazuje „Brak połączenia z serwerem”. Zalogowany użytkownik nie traci tokenu, gdy API nie odpowiada, a wylogowanie działa lokalnie bez nieobsłużonego wyjątku w konsoli. Zadanie 10.
3. **Ktoś omija formularz.** Żądanie wysłane do API z pominięciem rozszerzenia: nazwa z 51 znaków daje 400, a logowanie z obcego originu 403. Testy w zadaniu 5.
4. **Zgadywanie hasła.** Czwarta próba logowania w ciągu 10 sekund z jednego adresu IP daje 429, a formularz pokazuje komunikat. Test w zadaniu 5, sprawdzenie ręczne w zadaniu 9.
5. **Kilka otwartych kart.** Wylogowanie w jednej karcie przełącza pozostałe na ekran logowania, a zalogowanie przełącza je na pulpit. Test w zadaniu 8, sprawdzenie ręczne w zadaniu 10.

## Struktura po Etapie 1

Nowe i zmienione pliki:

```
one-place/
├─ .prettierignore                         + migracje
├─ packages/shared/src/  auth.ts  auth.test.ts  index.ts
├─ apps/api/
│  ├─ auth.config.ts  drizzle.config.ts  package.json  tsconfig.json  .env.example
│  ├─ src/
│  │  ├─ app.ts  index.ts  env.ts  env.test.ts  auth.ts
│  │  ├─ db/  schema/index.ts  schema/auth.ts  migrations/
│  │  ├─ lib/errors.ts
│  │  └─ middleware/  logger.ts  require-auth.ts
│  └─ test/
│     ├─ create-test-app.ts  auth-helpers.ts
│     └─ health  errors  logger  migrations  auth  me  (.test.ts)
└─ apps/extension/
   ├─ vitest.config.ts  wxt.config.ts  package.json
   └─ src/
      ├─ api/  client.ts  auth-client.ts  auth-fetch.ts  session.ts  (+ testy)
      ├─ i18n/  index.ts  locale.ts  form-errors.ts  pl.json  en.json  (+ testy)
      ├─ features/auth/  AuthScreen.vue  SignInForm.vue  SignUpForm.vue
      │                  use-auth-request.ts  auth-error.ts  (+ test)
      ├─ features/home/HomeScreen.vue
      └─ entrypoints/newtab/  App.vue  main.ts
```

---

## Zadanie 1: schematy logowania w `shared` (TDD)

**Cel:** jedno źródło reguł dla formularzy i API: nazwa ma 1–50 znaków, e-mail jest poprawny, a hasło ma 8–128 znaków (F-AUTH-01).

**Czego się nauczysz:** Zod 4 (`z.email()`, `.trim()` jako normalizacja, własne komunikaty), komunikaty walidacji jako klucze i18n.

**Pliki:**

- Utwórz: `packages/shared/src/auth.ts`
- Zmień: `packages/shared/src/index.ts`, `packages/shared/package.json` (zależność `zod`)
- Test: `packages/shared/src/auth.test.ts`

**Interfejsy:**

- Wytwarza: stałe `NAME_MAX_LENGTH`, `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`; schematy `NameSchema`, `SignUpSchema` (`{ name, email, password }`) i `SignInSchema` (`{ email, password }`); typy `SignUpInput` i `SignInInput`. Komunikaty błędów to klucze `validation.*`. Używają ich zadania 4, 5 i 9.

**Kroki:**

- [x] **1. Zależność.** `pnpm --filter @one-place/shared add zod@^4`
- [x] **2. Czerwone testy** w `src/auth.test.ts`:
  - poprawne dane przechodzą, a nazwa `'  Bartek  '` po parsowaniu to `'Bartek'`;
  - nazwa z samych spacji daje komunikat `validation.nameRequired`;
  - nazwa z 50 znaków przechodzi, a z 51 daje `validation.nameTooLong`;
  - hasło z 8 i 128 znaków przechodzi, z 7 daje `validation.passwordTooShort`, a ze 129 `validation.passwordTooLong`;
  - zły e-mail daje `validation.emailInvalid`;
  - `SignInSchema` przyjmuje hasło `'x'` (sprawdza tylko, czy jest), a puste daje `validation.passwordRequired`.
- [x] **3. Uruchom.** `pnpm --filter @one-place/shared test`. Oczekiwany wynik: **FAIL**, bo moduł `./auth` nie istnieje.
- [x] **4. Implementacja** `src/auth.ts`, a w `src/index.ts` dopisz `export * from './auth'`.
- [x] **5. Zielone testy.** Oczekiwany wynik: **PASS (8 testów w `shared`)**.
- [x] **6.** `pnpm format && pnpm check`, potem commit: `feat(shared): add sign-up and sign-in schemas`.

<details>
<summary>Podpowiedź</summary>

- Drugi argument `.min(1, 'validation.nameRequired')` to komunikat błędu. Wpisujesz klucz i18n, a nie zdanie, bo schemat nie wie, w jakim języku jest użytkownik.
- Kolejność ma znaczenie: `.trim()` przed `.min(1)` sprawia, że `'   '` ma długość 0.
- `z.email()` to w Zod 4 osobny schemat (w Zod 3 było `z.string().email()`).
- W teście komunikat pierwszego błędu znajdziesz w `result.error?.issues[0]?.message`.

</details>

<details>
<summary>Rozwiązanie</summary>

`packages/shared/src/auth.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { SignInSchema, SignUpSchema } from './auth'

const validSignUp = { name: 'Bartek', email: 'bartek@example.com', password: 'correct-horse' }

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('SignUpSchema', () => {
  it('accepts valid input and trims the name', () => {
    const result = SignUpSchema.safeParse({ ...validSignUp, name: '  Bartek  ' })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Bartek')
  })

  it('rejects a name made only of whitespace', () => {
    const result = SignUpSchema.safeParse({ ...validSignUp, name: '   ' })
    expect(firstMessage(result)).toBe('validation.nameRequired')
  })

  it('accepts a 50-character name and rejects a 51-character one', () => {
    expect(SignUpSchema.safeParse({ ...validSignUp, name: 'a'.repeat(50) }).success).toBe(true)
    const result = SignUpSchema.safeParse({ ...validSignUp, name: 'a'.repeat(51) })
    expect(firstMessage(result)).toBe('validation.nameTooLong')
  })

  it('enforces password length between 8 and 128 characters', () => {
    expect(SignUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(8) }).success).toBe(true)
    expect(SignUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(128) }).success).toBe(true)
    expect(firstMessage(SignUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(7) }))).toBe(
      'validation.passwordTooShort',
    )
    expect(
      firstMessage(SignUpSchema.safeParse({ ...validSignUp, password: 'a'.repeat(129) })),
    ).toBe('validation.passwordTooLong')
  })

  it('rejects an invalid email', () => {
    const result = SignUpSchema.safeParse({ ...validSignUp, email: 'not-an-email' })
    expect(firstMessage(result)).toBe('validation.emailInvalid')
  })
})

describe('SignInSchema', () => {
  it('does not check password length, only presence', () => {
    expect(SignInSchema.safeParse({ email: 'bartek@example.com', password: 'x' }).success).toBe(
      true,
    )
    const result = SignInSchema.safeParse({ email: 'bartek@example.com', password: '' })
    expect(firstMessage(result)).toBe('validation.passwordRequired')
  })
})
```

`packages/shared/src/auth.ts`

```ts
import { z } from 'zod'

export const NAME_MAX_LENGTH = 50
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

// Messages are i18n keys. The extension translates them, the API never shows them to users.
export const NameSchema = z
  .string()
  .trim()
  .min(1, 'validation.nameRequired')
  .max(NAME_MAX_LENGTH, 'validation.nameTooLong')

const EmailSchema = z.email('validation.emailInvalid')

export const SignUpSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, 'validation.passwordTooShort')
    .max(PASSWORD_MAX_LENGTH, 'validation.passwordTooLong'),
})

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'validation.passwordRequired'),
})

export type SignUpInput = z.infer<typeof SignUpSchema>
export type SignInInput = z.infer<typeof SignInSchema>
```

`packages/shared/src/index.ts`

```ts
export * from './auth'
export * from './theme'
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego komunikaty w schematach to klucze i18n, a nie gotowe zdania?** Schemat jest wspólny dla API i rozszerzenia, a język użytkownika zna tylko rozszerzenie. Klucz tłumaczy dopiero UI (zadanie 9).
2. **Dlaczego `SignInSchema` nie sprawdza długości hasła?** Logowanie ma tylko porównać hasło z zapisanym. Gdyby reguły się kiedyś zaostrzyły, starsze konta i tak muszą móc się zalogować.
3. **Co by się stało przy kolejności `.min(1).trim()`?** `min` sprawdziłby tekst przed obcięciem, więc `'   '` (3 znaki) by przeszło, a potem zamieniło się w pustą nazwę.

</details>

---

## Zadanie 2: format błędów API

**Cel:** każdy błąd API ma kształt `{ error: { code, message, details? } }` z [architektury](03-architektura.md#format-błędów), a nieoczekiwany błąd nie zdradza szczegółów.

**Czego się nauczysz:** `app.onError` i `app.notFound` w Hono, własna klasa błędu, `z.flattenError`, testowanie handlera na małej aplikacji testowej.

**Pliki:**

- Utwórz: `apps/api/src/lib/errors.ts`
- Zmień: `apps/api/src/app.ts`
- Test: `apps/api/test/errors.test.ts`

**Interfejsy:**

- Wytwarza: `class AppError(status, code, message, details?)`, `errorBody(code, message, details?)`, `handleError(error, c)` i `handleNotFound(c)`. `AppError` rzuca `requireAuth` w zadaniu 6, a z `handleError` korzysta logger w zadaniu 3.

**Kroki:**

- [x] **1. Czerwone testy** w `test/errors.test.ts`. Do pierwszych trzech zbuduj w teście małą aplikację Hono z trasą `/boom`, która rzuca podany błąd, i z `.onError(handleError)`:
  - `AppError(422, 'LIMIT_EXCEEDED', …)` daje status 422 i ten kod;
  - `ZodError` daje 400, kod `VALIDATION_ERROR` i `details.fieldErrors` z nazwą pola;
  - zwykły `Error('… postgres://secret')` daje 500 z kodem `INTERNAL_ERROR`, a tekst odpowiedzi nie zawiera `secret`;
  - w `createTestApp()` żądanie `/api/does-not-exist` daje 404 z kodem `NOT_FOUND`.
- [x] **2. Uruchom.** `pnpm --filter @one-place/api test`. Oczekiwany wynik: **FAIL**, bo `../src/lib/errors` nie istnieje.
- [x] **3. Implementacja** `src/lib/errors.ts`, a na końcu łańcucha w `createApp` dopisz `.onError(handleError).notFound(handleNotFound)`.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (10 testów w pakiecie API)**.
- [x] **5.** `pnpm format && pnpm check`, potem commit: `feat(api): add error format with onError and notFound`.

<details>
<summary>Podpowiedź</summary>

- `onError` dostaje każdy wyjątek rzucony w handlerze lub middleware. `notFound` obsługuje żądania, do których nie pasuje żadna trasa.
- Typ statusu dla `c.json(body, status)` to `ContentfulStatusCode` z `hono/utils/http-status`.
- `z.flattenError(error)` zamienia `ZodError` na `{ formErrors, fieldErrors }`.
- `.onError()` i `.notFound()` zwracają tę samą aplikację, więc łańcuch i typ `AppType` dla klienta RPC zostają nienaruszone.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/lib/errors.ts`

```ts
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'

export class AppError extends Error {
  readonly status: ContentfulStatusCode
  readonly code: string
  readonly details?: unknown

  constructor(status: ContentfulStatusCode, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function errorBody(code: string, message: string, details?: unknown) {
  return { error: { code, message, ...(details === undefined ? {} : { details }) } }
}

export function handleError(error: Error, c: Context) {
  if (error instanceof AppError) {
    return c.json(errorBody(error.code, error.message, error.details), error.status)
  }
  if (error instanceof z.ZodError) {
    return c.json(errorBody('VALIDATION_ERROR', 'Invalid request data', z.flattenError(error)), 400)
  }
  // Details of unexpected errors go to the logs only (see middleware/logger.ts).
  return c.json(errorBody('INTERNAL_ERROR', 'Internal server error'), 500)
}

export function handleNotFound(c: Context) {
  return c.json(errorBody('NOT_FOUND', 'Route not found'), 404)
}
```

`apps/api/test/errors.test.ts`

```ts
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AppError, handleError } from '../src/lib/errors'
import { createTestApp } from './create-test-app'

function appThatThrows(error: Error) {
  return new Hono()
    .get('/boom', () => {
      throw error
    })
    .onError(handleError)
}

describe('error handling', () => {
  it('maps AppError to its status and code', async () => {
    const app = appThatThrows(new AppError(422, 'LIMIT_EXCEEDED', 'Too many contexts'))
    const res = await app.request('/boom')
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({
      error: { code: 'LIMIT_EXCEEDED', message: 'Too many contexts' },
    })
  })

  it('maps ZodError to 400 with field errors', async () => {
    const result = z.object({ name: z.string() }).safeParse({})
    const app = appThatThrows(result.error!)
    const res = await app.request('/boom')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details.fieldErrors).toHaveProperty('name')
  })

  it('hides details of unexpected errors', async () => {
    const app = appThatThrows(new Error('connection string postgres://secret'))
    const res = await app.request('/boom')
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    })
    expect(text).not.toContain('secret')
  })

  it('returns NOT_FOUND in the standard format for unknown API routes', async () => {
    const { app } = createTestApp()
    const res = await app.request('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
  })
})
```

`apps/api/src/app.ts`: import `handleError` i `handleNotFound` z `./lib/errors`, a łańcuch kończy się tak:

```ts
    .get('/health', async (c) => {
      // bez zmian
    })
    .onError(handleError)
    .notFound(handleNotFound)
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Po co w testach osobna, mała aplikacja Hono?** W API nie ma jeszcze tras, które rzucają takie błędy. Handler sprawdzasz w izolacji, bez bazy i bez czekania na kolejne zadania.
2. **Dlaczego odpowiedź 500 nie zawiera `error.message`?** Komunikat nieoczekiwanego błędu może zawierać szczegóły infrastruktury, np. adres bazy albo fragment SQL. Klient dostaje ogólny komunikat, a szczegóły trafiają do logów (zadanie 3).
3. **Czym różni się `notFound` od `onError`?** `notFound` działa, gdy żadna trasa nie pasuje do żądania. `onError` działa, gdy pasująca trasa albo middleware rzuci wyjątek.

</details>

---

## Zadanie 3: `requestId` i logi JSON

**Cel:** każde żądanie ma identyfikator w nagłówku `X-Request-Id` i jedną linię logu JSON z tym samym identyfikatorem. Nieoczekiwany błąd trafia do logu ze stosem wywołań.

**Czego się nauczysz:** middleware w Hono (`createMiddleware`, kod przed i po `await next()`, `c.var`, `c.error`), wbudowany `requestId`, pino, wstrzykiwanie loggera.

**Pliki:**

- Utwórz: `apps/api/src/middleware/logger.ts`
- Zmień: `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/env.ts`, `apps/api/src/env.test.ts`, `apps/api/test/create-test-app.ts`, `apps/api/.env.example`
- Test: `apps/api/test/logger.test.ts`

**Interfejsy:**

- Korzysta z: `handleError` (zadanie 2), `parseEnv` (Etap 0).
- Wytwarza: `requestLogger(logger: Logger)`, pole `LOG_LEVEL` w `Env` oraz nową zależność `createApp({ db, allowedOrigins, logger })`.

**Kroki:**

- [x] **1. Zależność.** `pnpm --filter @one-place/api add pino@^10`
- [x] **2. `LOG_LEVEL`.** W pierwszym teście `env.test.ts` (zmień jego nazwę na `parses a valid config and sets defaults`) dopisz `expect(env.LOG_LEVEL).toBe('info')`. Zobacz czerwony test, potem dodaj do schematu `LOG_LEVEL` jako `z.enum([...]).default('info')` z poziomami pino. Dopisz `LOG_LEVEL=info` do `.env.example`.
- [x] **3. Czerwone testy** w `test/logger.test.ts`. Zbuduj w teście aplikację z `requestId()`, `requestLogger(logger)` i trasami `/ok` oraz `/boom`. Logger pino zapisuje linie do tablicy:
  - żądanie `/ok?token=secret` daje dokładnie jedną linię z poziomem 30 (info), `requestId` równym nagłówkowi `X-Request-Id`, `method`, `path: '/ok'`, `status: 200` i `durationMs`, a linia nie zawiera `secret`;
  - `/boom` daje jedną linię z poziomem 50 (error), `status: 500` i `err` z `message` oraz `stack`;
  - odpowiedź `/api/health` z `createTestApp()` ma nagłówek `X-Request-Id`.
- [x] **4. Uruchom.** Oczekiwany wynik: **FAIL**, bo `../src/middleware/logger` nie istnieje.
- [x] **5. Implementacja** `src/middleware/logger.ts`.
- [x] **6. Podłączenie.** `createApp` przyjmuje `logger` i zaczyna łańcuch od `.use(requestId()).use(requestLogger(logger))`, przed `cors`. `createTestApp` podaje `pino({ level: 'silent' })`, a `index.ts` tworzy `pino({ level: env.LOG_LEVEL })` i nim zastępuje `console.log` w `serve`.
- [x] **7. Zielone testy.** Oczekiwany wynik: **PASS (13 testów w pakiecie API)**.
- [x] **8. Sprawdzenie ręczne.** `pnpm --filter @one-place/api dev`, a w drugim terminalu `curl -i localhost:3000/api/health`. Odpowiedź ma nagłówek `X-Request-Id`, a w terminalu API pojawia się linia JSON z tym samym `requestId`.
- [x] **9.** `pnpm format && pnpm check`, potem commit: `feat(api): add request id and JSON request logs`.

**Pułapki (sprawdzone na prototypie):**

- **`c.error` zamiast `try`/`catch` w middleware.** Gdy handler rzuci wyjątek, Hono najpierw wywołuje `onError`, a dopiero potem wraca do middleware po `await next()`. Wyjątek nie dociera więc do middleware, ale Hono zostawia go w `c.error`.
- **Loguj `c.req.path`, nie `c.req.url`.** W query stringu mogą się znaleźć tokeny lub dane osobowe. Pierwszy test pilnuje tego za pomocą `?token=secret`.

<details>
<summary>Podpowiedź</summary>

- `createMiddleware<{ Variables: RequestIdVariables }>(async (c, next) => { … })` z `hono/factory` daje typowane `c.var.requestId`.
- `requestId()` z `hono/request-id` generuje UUID, zapisuje go w `c.var.requestId` i dodaje nagłówek `X-Request-Id` do odpowiedzi.
- Kod przed `await next()` działa przed handlerem, a kod po nim, gdy odpowiedź już istnieje (`c.res.status`).
- pino przyjmuje jako drugi argument dowolny obiekt z metodą `write(line)`. W teście parsujesz każdą linię przez `JSON.parse`.
- Pod kluczem `err` pino serializuje błąd razem z `message` i `stack`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/middleware/logger.ts`

```ts
import { createMiddleware } from 'hono/factory'
import type { RequestIdVariables } from 'hono/request-id'
import type { Logger } from 'pino'

export function requestLogger(logger: Logger) {
  return createMiddleware<{ Variables: RequestIdVariables }>(async (c, next) => {
    const start = performance.now()
    await next()
    // path without the query string: query parameters may carry secrets
    const entry = {
      requestId: c.var.requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - start),
    }
    if (c.res.status >= 500) {
      // c.error is set by Hono when a handler threw and onError produced the response
      logger.error({ ...entry, err: c.error }, 'request failed')
    } else {
      logger.info(entry, 'request completed')
    }
  })
}
```

`apps/api/test/logger.test.ts`

```ts
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { pino } from 'pino'
import { describe, expect, it } from 'vitest'
import { handleError } from '../src/lib/errors'
import { requestLogger } from '../src/middleware/logger'
import { createTestApp } from './create-test-app'

function createLoggedApp() {
  const lines: Record<string, unknown>[] = []
  const logger = pino({ level: 'info' }, { write: (line: string) => lines.push(JSON.parse(line)) })
  const app = new Hono()
    .use(requestId())
    .use(requestLogger(logger))
    .get('/ok', (c) => c.text('ok'))
    .get('/boom', () => {
      throw new Error('kaboom')
    })
    .onError(handleError)
  return { app, lines }
}

describe('request logging', () => {
  it('writes one JSON line per request with the request id', async () => {
    const { app, lines } = createLoggedApp()
    const res = await app.request('/ok?token=secret')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      level: 30,
      requestId: res.headers.get('X-Request-Id'),
      method: 'GET',
      path: '/ok',
      status: 200,
    })
    expect(lines[0]).toHaveProperty('durationMs')
    expect(JSON.stringify(lines[0])).not.toContain('secret')
  })

  it('logs unexpected errors with the stack at error level', async () => {
    const { app, lines } = createLoggedApp()
    await app.request('/boom')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ level: 50, status: 500, err: { message: 'kaboom' } })
    expect(lines[0]?.err).toHaveProperty('stack')
  })

  it('adds X-Request-Id to API responses', async () => {
    const { app } = createTestApp()
    const res = await app.request('/api/health')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })
})
```

Nowe pole w `apps/api/src/env.ts` (w obiekcie `EnvSchema`)

```ts
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
```

`apps/api/src/app.ts` (stan po tym zadaniu)

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { sql } from 'drizzle-orm'
import type { Logger } from 'pino'
import type { Database } from './db/client'
import { handleError, handleNotFound } from './lib/errors'
import { requestLogger } from './middleware/logger'

interface AppDeps {
  db: Database
  allowedOrigins: string[]
  logger: Logger
}

export function createApp({ db, allowedOrigins, logger }: AppDeps) {
  return new Hono()
    .basePath('/api')
    .use(requestId())
    .use(requestLogger(logger))
    .use(cors({ origin: allowedOrigins }))
    .get('/health', async (c) => {
      try {
        await db.execute(sql`select 1`)
        return c.json({ status: 'ok', db: 'ok' } as const)
      } catch {
        return c.json({ status: 'error', db: 'unreachable' } as const, 503)
      }
    })
    .onError(handleError)
    .notFound(handleNotFound)
}

export type AppType = ReturnType<typeof createApp>
```

`apps/api/test/create-test-app.ts` (stan po tym zadaniu)

```ts
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { pino } from 'pino'
import { createApp } from '../src/app'

export const TEST_ORIGIN = 'chrome-extension://test-extension-id'

export function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  const logger = pino({ level: 'silent' })
  const app = createApp({ db, allowedOrigins: [TEST_ORIGIN], logger })
  return { app, client }
}
```

`apps/api/src/index.ts` (stan po tym zadaniu)

```ts
import { serve } from '@hono/node-server'
import { pino } from 'pino'
import { createApp } from './app'
import { createDb } from './db/client'
import { parseEnv } from './env'

const env = parseEnv(process.env)
const logger = pino({ level: env.LOG_LEVEL })
const app = createApp({
  db: createDb(env.DATABASE_URL),
  allowedOrigins: env.ALLOWED_ORIGINS,
  logger,
})

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`API works at http://localhost:${info.port}`)
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Po co `requestId` w nagłówku odpowiedzi?** Gdy coś pójdzie nie tak, rozszerzenie lub użytkownik może podać ten identyfikator, a ty w logach znajdziesz dokładnie to żądanie.
2. **Dlaczego logi w JSON, a nie zwykły tekst?** Narzędzia do logów filtrują po polach (`requestId`, `status`, `level`) bez pisania wyrażeń regularnych.
3. **Dlaczego logger jest parametrem `createApp`, a nie globalnym obiektem?** W testach podajesz logger wyciszony albo zapisujący do tablicy, a w produkcji poziom z `LOG_LEVEL`. To ten sam wzorzec co z bazą danych.

</details>

---

## Zadanie 4: schemat bazy, drizzle-kit i pierwsza migracja

**Cel:** w bazie są tabele Better Auth (`user`, `session`, `account`, `verification`) utworzone migracją. Testy uruchamiają tę samą migrację na PGlite.

**Czego się nauczysz:** CLI Better Auth, konfiguracja `drizzle-kit`, `generate` i `migrate`, migrator Drizzle w testach.

**Pliki:**

- Utwórz: `apps/api/src/auth.ts`, `apps/api/auth.config.ts`, `apps/api/drizzle.config.ts`, `apps/api/src/db/schema/index.ts`
- Wygeneruj: `apps/api/src/db/schema/auth.ts`, `apps/api/src/db/migrations/`
- Zmień: `apps/api/package.json` (skrypty), `apps/api/tsconfig.json`, `apps/api/test/create-test-app.ts`, `.prettierignore` oraz wszystkie testy, które wołają `createTestApp()`
- Test: `apps/api/test/migrations.test.ts`

**Interfejsy:**

- Korzysta z: `PASSWORD_MIN_LENGTH` i `PASSWORD_MAX_LENGTH` (zadanie 1), `type Database` (Etap 0).
- Wytwarza: `createAuth({ db, secret, baseURL, trustedOrigins, logger })`, `type Auth`, skrypty `db:auth-schema`, `db:generate` i `db:migrate`. `createTestApp()` staje się **asynchroniczne** i zwraca bazę z zastosowanymi migracjami.

**Kroki:**

- [x] **1. Zależności.**

  ```bash
  pnpm --filter @one-place/api add better-auth@^1.7 '@one-place/shared@workspace:*'
  pnpm --filter @one-place/api add -D drizzle-kit@^0.31 auth@^1.7
  ```

- [x] **2. Pierwsza wersja `createAuth`** w `src/auth.ts`, **na razie bez** opcji `schema` w adapterze, bo schematu jeszcze nie ma. Opcje: `secret`, `baseURL`, `basePath: '/api/auth'`, `trustedOrigins`, `database: drizzleAdapter(db, { provider: 'pg' })`, `emailAndPassword` (włączone, długości hasła ze stałych z `shared`), `telemetry: { enabled: false }`, `logger` przekierowany do pino i `plugins: [bearer()]`. Pozostałe opcje dojdą w zadaniu 5, razem z testami.
- [x] **3. Konfiguracja dla CLI.** Utwórz `auth.config.ts`, który eksportuje `auth = createAuth({ db: drizzle.mock(), … })` z wymyślonymi wartościami. Dodaj skrypt `"db:auth-schema": "auth generate --config auth.config.ts --output src/db/schema/auth.ts --yes"`, a w `tsconfig.json` rozszerz `include` o `"*.config.ts"`.
- [x] **4. Generowanie schematu.** `pnpm --filter @one-place/api db:auth-schema`. Powstaje `src/db/schema/auth.ts` z czterema tabelami. Utwórz `src/db/schema/index.ts` z `export * from './auth'` i uruchom `pnpm format` (CLI pisze w cudzysłowach).
- [x] **5. Schemat w adapterze.** W `src/auth.ts` zaimportuj `* as schema from './db/schema'` i przekaż go: `drizzleAdapter(db, { provider: 'pg', schema })`.
- [x] **6. drizzle-kit.** Utwórz `drizzle.config.ts` (dialekt `postgresql`, schemat `./src/db/schema/index.ts`, katalog `./src/db/migrations`, adres z `DATABASE_URL`). Dodaj skrypty `"db:generate": "drizzle-kit generate"` i `"db:migrate": "drizzle-kit migrate"`. W `.prettierignore` dopisz w nowej linii `apps/api/src/db/migrations`.
- [x] **7. Migracja.** `pnpm --filter @one-place/api db:generate --name auth`. Przeczytaj powstały `src/db/migrations/0000_auth.sql`: cztery `CREATE TABLE`, klucze obce z `ON DELETE cascade` i indeksy.
- [x] **8. Czerwony test** w `test/migrations.test.ts`: po `await createTestApp()` lista tabel w schemacie `public` (z `information_schema.tables`) to `['account', 'session', 'user', 'verification']`. Oczekiwany wynik: **FAIL** (`expected [] to deeply equal [...]`).
- [x] **9. Implementacja.** `createTestApp` staje się `async` i przed `createApp` wywołuje `await migrate(db, { migrationsFolder })` z `drizzle-orm/pglite/migrator`. W pozostałych testach zamień `createTestApp()` na `await createTestApp()`.
- [x] **10. Zielone testy.** Oczekiwany wynik: **PASS (14 testów w pakiecie API)**.
- [x] **11. Migracja w Dockerze.** `pnpm --filter @one-place/api db:migrate`, potem sprawdź tabele: `docker compose exec db psql -U one one_place -c '\dt'`. Oczekiwany wynik: cztery tabele.
- [x] **12.** `pnpm format && pnpm check`, potem commit: `feat(api): add Better Auth schema and first migration`.

**Pułapki (sprawdzone na prototypie):**

- **CLI nazywa się teraz `auth`.** Pakiet `@better-auth/cli` zatrzymał się na wersji 1.4 i jest oznaczony jako nieobsługiwany. Nowe CLI ma polecenie `auth` (oraz alias `better-auth`).
- **CLI potrzebuje gotowej instancji.** Importuje plik konfiguracyjny i szuka eksportu `auth`. Nasz `src/auth.ts` eksportuje fabrykę, bo baza jest wstrzykiwana, dlatego osobny `auth.config.ts` tworzy instancję z `drizzle.mock()`, czyli Drizzle'em bez połączenia. Do generowania schematu CLI potrzebuje tylko opcji.
- **Kolejność kroków 2–5.** Przy pierwszym generowaniu `src/auth.ts` nie może importować `./db/schema`, bo tego pliku jeszcze nie ma. Przy kolejnych zmianach schematu import już zostaje.
- **drizzle-kit nie czyta `.env`.** `drizzle.config.ts` wczytuje go sam przez `process.loadEnvFile()`, jeśli plik istnieje. `db:generate` w ogóle nie łączy się z bazą, więc działa także bez `.env`.
- **Prettier i pliki migracji.** drizzle-kit przy każdym `generate` przepisuje `meta/_journal.json` po swojemu. Bez wpisu w `.prettierignore` `pnpm format` i drizzle-kit poprawiałyby się nawzajem. Dopisz wpis w edytorze: jeśli plik nie kończy się znakiem nowej linii, `echo >>` sklei go z ostatnią linią.
- **`--name auth`** daje czytelną nazwę `0000_auth.sql` zamiast losowej.

<details>
<summary>Podpowiedź</summary>

- Opcja `logger` w Better Auth przyjmuje `log(level, message, ...args)`. Poziomy `debug`, `info`, `warn` i `error` mają w pino metody o tych samych nazwach, więc wystarczy `logger[level]({ args }, message)`.
- `drizzle.mock()` z `drizzle-orm/node-postgres` tworzy instancję bez klienta bazy.
- Folder migracji w teście: `fileURLToPath(new URL('../src/db/migrations', import.meta.url))`.
- `client.query<{ table_name: string }>(sql)` na PGlite zwraca `{ rows }`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/auth.ts` (stan po kroku 5)

```ts
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@one-place/shared'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import type { Logger } from 'pino'
import type { Database } from './db/client'
import * as schema from './db/schema'

interface AuthDeps {
  db: Database
  secret: string
  baseURL: string
  trustedOrigins: string[]
  logger: Logger
}

export function createAuth({ db, secret, baseURL, trustedOrigins, logger }: AuthDeps) {
  return betterAuth({
    secret,
    baseURL,
    basePath: '/api/auth',
    trustedOrigins,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    telemetry: { enabled: false },
    logger: { log: (level, message, ...args) => logger[level]({ args }, message) },
    plugins: [bearer()],
  })
}

export type Auth = ReturnType<typeof createAuth>
```

`apps/api/auth.config.ts`

```ts
// Used only by the Better Auth CLI (`pnpm db:auth-schema`). The CLI reads the auth options
// to find out which tables and columns they need. It never connects to a database.
import { drizzle } from 'drizzle-orm/node-postgres'
import { pino } from 'pino'
import { createAuth } from './src/auth'

export const auth = createAuth({
  db: drizzle.mock(),
  secret: 'cli-only-secret-that-is-never-used-at-runtime',
  baseURL: 'http://localhost:3000',
  trustedOrigins: [],
  logger: pino({ level: 'silent' }),
})
```

`apps/api/drizzle.config.ts`

```ts
import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit does not read .env by itself
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
```

`apps/api/package.json` (skrypty)

```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "dev": "tsx watch --env-file=.env src/index.ts",
  "db:auth-schema": "auth generate --config auth.config.ts --output src/db/schema/auth.ts --yes",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

`apps/api/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["src", "test", "*.config.ts"]
}
```

`apps/api/test/migrations.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { createTestApp } from './create-test-app'

describe('database migrations', () => {
  it('create the Better Auth tables', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`,
    )
    expect(rows.map((row) => row.table_name)).toEqual([
      'account',
      'session',
      'user',
      'verification',
    ])
  })
})
```

`apps/api/test/create-test-app.ts` (stan po tym zadaniu)

```ts
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { pino } from 'pino'
import { createApp } from '../src/app'

export const TEST_ORIGIN = 'chrome-extension://test-extension-id'

const migrationsFolder = fileURLToPath(new URL('../src/db/migrations', import.meta.url))

export async function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  await migrate(db, { migrationsFolder })
  const logger = pino({ level: 'silent' })
  const app = createApp({ db, allowedOrigins: [TEST_ORIGIN], logger })
  return { app, client }
}
```

`.prettierignore`

```
pnpm-lock.yaml
.output
.wxt
*.d.ts
apps/api/src/db/migrations
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Czym różni się `drizzle-kit generate` z `migrate` od `drizzle-kit push`?** `generate` zapisuje zmianę schematu jako plik SQL w repozytorium, który można przejrzeć i powtórzyć na każdej bazie. `migrate` stosuje pliki i zapisuje, które już wykonał (tabela `drizzle.__drizzle_migrations`). `push` zmienia bazę od razu, bez pliku, co wystarcza do szybkich prototypów, ale nie zostawia historii.
2. **Dlaczego testy uruchamiają te same migracje na PGlite?** Testy sprawdzają dokładnie ten schemat, który trafi na produkcję. Jeśli migracja ma błąd, wyjdzie w testach, a nie przy wdrożeniu.
3. **Co by się stało, gdyby ktoś zmienił `src/db/schema/auth.ts` i zapomniał o `db:generate`?** Kod widziałby nowe kolumny, ale bazy (i PGlite w testach) by ich nie miały. Testy na PGlite zgłoszą to od razu.

</details>

---

## Zadanie 5: Better Auth w API (rejestracja, logowanie, R5)

**Cel:** API rejestruje i loguje użytkowników, zwraca token w `set-auth-token`, odrzuca obce originy i ogranicza liczbę prób logowania.

**Czego się nauczysz:** podłączenie Better Auth do Hono, opcje `session`, `rateLimit`, `advanced` i `databaseHooks`, różnica między CORS a `trustedOrigins`, testy, które pilnują konfiguracji.

**Pliki:**

- Zmień: `apps/api/src/auth.ts`, `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/env.ts`, `apps/api/src/env.test.ts`, `apps/api/test/create-test-app.ts`, `apps/api/.env.example`, `apps/api/.env`
- Test: `apps/api/test/auth-helpers.ts`, `apps/api/test/auth.test.ts`

**Interfejsy:**

- Korzysta z: `createAuth` (zadanie 4), `NameSchema` (zadanie 1).
- Zmienia: `createApp({ db, auth, allowedOrigins, logger })`; `Env` dostaje `BETTER_AUTH_SECRET` i `BETTER_AUTH_URL`.
- Wytwarza: trasy `GET|POST /api/auth/*`, pomocniki testowe `TEST_USER`, `postJson(app, path, body, headers?)` i `signUp(app, user?)`, które zwracają token z `set-auth-token`.

**Kroki:**

- [x] **1. Zmienne środowiskowe.** W `env.test.ts` wprowadź obiekt `validEnv` z poprawnymi `DATABASE_URL`, `BETTER_AUTH_SECRET` (`'a'.repeat(32)`) i `BETTER_AUTH_URL`, przepisz na niego istniejące testy i dodaj test: sekret krótszy niż 32 znaki daje błąd z nazwą `BETTER_AUTH_SECRET`. Zobacz czerwony test, potem dodaj do schematu `BETTER_AUTH_SECRET: z.string().min(32)` i `BETTER_AUTH_URL: z.url()`.
- [ ] **2. Sekret.** Wygeneruj sekret poleceniem `openssl rand -base64 32` i dopisz do `apps/api/.env` razem z `BETTER_AUTH_URL=http://localhost:3000`. Zaktualizuj `.env.example` (pusty sekret i komentarz, jak go wygenerować).
- [x] **3. Pomocniki testowe** w `test/auth-helpers.ts`: `TEST_USER`, `postJson` (POST z JSON, nagłówkiem `Origin: TEST_ORIGIN` i **unikalnym** `X-Forwarded-For`) oraz `signUp`, który zwraca token z nagłówka `set-auth-token`. Po co unikalne IP, wyjaśnia sekcja „Pułapki”.
- [x] **4. Czerwone testy** w `test/auth.test.ts`:
  - rejestracja zwraca 200, nagłówek `set-auth-token`, a nazwa `'  Ala  '` jest zapisana jako `'Ala'`;
  - sesja jest ważna 30 dni: `extract(epoch from expires_at - created_at) / 86400` z tabeli `session` wynosi 30 (F-AUTH-03);
  - nazwa z 51 znaków daje 400, a tabela `user` jest pusta;
  - złe hasło i nieznany e-mail dają 401 z **tym samym** kodem (F-AUTH-02);
  - `GET /api/auth/get-session` z `Authorization: Bearer <token>` zwraca użytkownika;
  - logowanie z `Origin: https://evil.example` daje 403 (punkt 3 z [Na co uważać](#na-co-uważać));
  - cztery błędne logowania z tego samego `X-Forwarded-For` dają statusy `[401, 401, 401, 429]` (punkt 4);
  - preflight `OPTIONS` z `TEST_ORIGIN` dopuszcza nagłówek `authorization`, a odpowiedź na rejestrację ma `set-auth-token` w `Access-Control-Expose-Headers`.

  Oczekiwany wynik: **FAIL**, wszystkie 404, bo trasy jeszcze nie ma.

- [x] **5. Trasy i podłączenie.**
  - `createApp` przyjmuje `auth` i po `cors` rejestruje `.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))`.
  - `cors` dostaje `allowHeaders: ['Authorization', 'Content-Type']` i `exposeHeaders: ['set-auth-token']`.
  - `createTestApp` tworzy `auth` przez `createAuth` z `trustedOrigins: [TEST_ORIGIN]`.
  - `index.ts` tworzy `auth` z `env.BETTER_AUTH_SECRET`, `env.BETTER_AUTH_URL` i `trustedOrigins: env.ALLOWED_ORIGINS`.
- [x] **6. Uruchom testy.** Oczekiwany wynik: **3 przechodzą, 5 pada**. Każdy czerwony test wskazuje jedną brakującą opcję. Dodawaj je po kolei i obserwuj, jak testy zmieniają kolor:
  - nazwa nie jest obcinana, a 51 znaków przechodzi → `databaseHooks.user.create.before`: waliduj nazwę `NameSchema`, przy błędzie rzuć `APIError('BAD_REQUEST', …)`, przy sukcesie zwróć `{ data: { ...user, name } }`;
  - sesja ma 7 dni, czyli domyślną wartość → `session: { expiresIn: 30 dni, updateAge: 1 dzień }` (w sekundach);
  - brak 429 → `rateLimit: { enabled: true }`;
  - obcy origin dostaje 200 → `advanced: { disableOriginCheck: false }`.
- [x] **7. Zielone testy.** Oczekiwany wynik: **PASS (23 testy w pakiecie API)**.
- [x] **8. Eksperyment R5.** W `create-test-app.ts` ustaw tymczasowo `trustedOrigins: []` i uruchom testy. Oczekiwany wynik: prawie wszystkie testy auth padają z 403, choć CORS dalej przepuszcza `TEST_ORIGIN`. Przywróć `[TEST_ORIGIN]`.
- [x] **9. Sprawdzenie ręczne.** Uruchom API i wyślij rejestrację z originem rozszerzenia (ID z `ALLOWED_ORIGINS`):

  ```bash
  curl -i -X POST localhost:3000/api/auth/sign-up/email \
    -H 'Content-Type: application/json' \
    -H 'Origin: chrome-extension://<ID>' \
    -d '{"name":"Ala","email":"ala@example.com","password":"correct-horse-battery"}'
  ```

  Odpowiedź ma status 200 i nagłówek `set-auth-token`. Porównaj go z polem `token` w treści odpowiedzi: nagłówek ma dodatkowo kropkę i podpis. Ta różnica przyda się w zadaniu 6.

- [x] **10.** `pnpm format && pnpm check`, potem commit: `feat(api): add Better Auth with email and password`.

**Pułapki (sprawdzone na prototypie):**

- **W testach Better Auth domyślnie nie sprawdza originu.** Gdy `NODE_ENV=test` (Vitest ustawia to sam), domyślne `skipOriginCheck` ma wartość `true`, więc test z `evil.example` przechodziłby bez względu na konfigurację. Jawne `advanced: { disableOriginCheck: false }` sprawia, że testy działają jak produkcja.
- **Rate limiting jest domyślnie włączony tylko przy `NODE_ENV=production`.** Bez `rateLimit: { enabled: true }` nie działa ani w testach, ani w `pnpm dev`.
- **Liczniki prób są wspólne dla wszystkich testów w pliku.** Better Auth trzyma je w `Map` na poziomie modułu, a nie w instancji `auth`. Gdy żądanie nie ma nagłówka `X-Forwarded-For`, w testach i developmencie przyjmuje IP `127.0.0.1`. Czwarta rejestracja w tym samym pliku testów dostałaby więc 429. Dlatego `postJson` wysyła za każdym razem inny adres.
- **Ostrzeżenie o IP w logach `pnpm dev`.** Gdy `NODE_ENV` nie jest ustawione, Better Auth nie zna IP klienta i wrzuca wszystkie żądania do jednego wspólnego licznika („Rate limiting could not determine a client IP…”). Lokalnie to nie przeszkadza. Na serwerze za reverse proxy (Etap 7) trzeba ustawić `advanced.ipAddress`, inaczej trzy błędne próby kogokolwiek zablokują logowanie wszystkim na 10 sekund.
- **Formularz logowania zawsze sprawdza `Origin`.** Rejestracja i logowanie odrzucają (403 `INVALID_ORIGIN`) każde żądanie z nagłówkiem `Origin` lub `Sec-Fetch-*` spoza `trustedOrigins`. Przeglądarka wysyła je zawsze, więc origin rozszerzenia musi być i w CORS, i w `trustedOrigins`. W `index.ts` obie listy pochodzą z `ALLOWED_ORIGINS`.
- **Błędy Better Auth mają własny format** (`{ code, message }`), a nie nasz `{ error: { … } }`. Nie przerabiamy ich, bo klient Better Auth w rozszerzeniu rozumie właśnie ten format.

<details>
<summary>Podpowiedź</summary>

- `auth.handler(request)` przyjmuje standardowy `Request` i zwraca `Response`. W Hono surowe żądanie to `c.req.raw`.
- `basePath: '/api/auth'` z zadania 4 musi pasować do ścieżki trasy w Hono (`/api` z `basePath` aplikacji + `/auth/*`).
- `APIError` importujesz z `better-auth/api`. Hook `before` może zwrócić `{ data }`, żeby zapisać zmienione dane.
- Better Auth dla każdego żądania wybiera regułę limitu po ścieżce: `/sign-in/*` i `/sign-up/*` mają domyślnie 3 próby na 10 sekund.

</details>

<details>
<summary>Rozwiązanie: konfiguracja i aplikacja</summary>

`apps/api/src/auth.ts` (stan po tym zadaniu)

```ts
import { NameSchema, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@one-place/shared'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { bearer } from 'better-auth/plugins'
import type { Logger } from 'pino'
import type { Database } from './db/client'
import * as schema from './db/schema'

const DAY_IN_SECONDS = 60 * 60 * 24

interface AuthDeps {
  db: Database
  secret: string
  baseURL: string
  trustedOrigins: string[]
  logger: Logger
}

export function createAuth({ db, secret, baseURL, trustedOrigins, logger }: AuthDeps) {
  return betterAuth({
    secret,
    baseURL,
    basePath: '/api/auth',
    trustedOrigins,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    session: { expiresIn: 30 * DAY_IN_SECONDS, updateAge: DAY_IN_SECONDS },
    rateLimit: { enabled: true },
    telemetry: { enabled: false },
    logger: { log: (level, message, ...args) => logger[level]({ args }, message) },
    plugins: [bearer()],
    // Better Auth skips the Origin check when NODE_ENV=test. Explicit false keeps tests honest.
    advanced: { disableOriginCheck: false },
    databaseHooks: {
      user: {
        create: {
          // Better Auth does not limit the name length, so we do it before the insert
          before: async (user) => {
            const name = NameSchema.safeParse(user.name)
            if (!name.success) {
              throw new APIError('BAD_REQUEST', {
                code: 'INVALID_NAME',
                message: 'Name must be between 1 and 50 characters long',
              })
            }
            return { data: { ...user, name: name.data } }
          },
        },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
```

`apps/api/src/app.ts` (stan po tym zadaniu)

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { sql } from 'drizzle-orm'
import type { Logger } from 'pino'
import type { Auth } from './auth'
import type { Database } from './db/client'
import { handleError, handleNotFound } from './lib/errors'
import { requestLogger } from './middleware/logger'

interface AppDeps {
  db: Database
  auth: Auth
  allowedOrigins: string[]
  logger: Logger
}

export function createApp({ db, auth, allowedOrigins, logger }: AppDeps) {
  return new Hono()
    .basePath('/api')
    .use(requestId())
    .use(requestLogger(logger))
    .use(
      cors({
        origin: allowedOrigins,
        allowHeaders: ['Authorization', 'Content-Type'],
        exposeHeaders: ['set-auth-token'],
      }),
    )
    .on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))
    .get('/health', async (c) => {
      try {
        await db.execute(sql`select 1`)
        return c.json({ status: 'ok', db: 'ok' } as const)
      } catch {
        return c.json({ status: 'error', db: 'unreachable' } as const, 503)
      }
    })
    .onError(handleError)
    .notFound(handleNotFound)
}

export type AppType = ReturnType<typeof createApp>
```

`apps/api/src/index.ts`

```ts
import { serve } from '@hono/node-server'
import { pino } from 'pino'
import { createApp } from './app'
import { createAuth } from './auth'
import { createDb } from './db/client'
import { parseEnv } from './env'

const env = parseEnv(process.env)
const logger = pino({ level: env.LOG_LEVEL })
const db = createDb(env.DATABASE_URL)
const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.ALLOWED_ORIGINS,
  logger,
})
const app = createApp({ db, auth, allowedOrigins: env.ALLOWED_ORIGINS, logger })

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`API works at http://localhost:${info.port}`)
})
```

`apps/api/src/env.ts` (nowe pola w `EnvSchema`, zaraz pod `DATABASE_URL`)

```ts
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
```

`apps/api/.env.example`

```
DATABASE_URL=postgres://one:one@localhost:5432/one_place
# generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
PORT=3000
ALLOWED_ORIGINS=chrome-extension://abcdefghijklmnopabcdefghijklmnop
LOG_LEVEL=info
```

`apps/api/test/create-test-app.ts` (ostateczny)

```ts
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { pino } from 'pino'
import { createApp } from '../src/app'
import { createAuth } from '../src/auth'

export const TEST_ORIGIN = 'chrome-extension://test-extension-id'

const migrationsFolder = fileURLToPath(new URL('../src/db/migrations', import.meta.url))

export async function createTestApp() {
  const client = new PGlite()
  const db = drizzle({ client })
  await migrate(db, { migrationsFolder })
  const logger = pino({ level: 'silent' })
  const auth = createAuth({
    db,
    secret: 'test-secret-at-least-32-characters-long',
    baseURL: 'http://localhost:3000',
    trustedOrigins: [TEST_ORIGIN],
    logger,
  })
  const app = createApp({ db, auth, allowedOrigins: [TEST_ORIGIN], logger })
  return { app, client }
}
```

</details>

<details>
<summary>Rozwiązanie: testy</summary>

`apps/api/src/env.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

const validEnv = {
  DATABASE_URL: 'postgres://one:one@localhost:5432/one_place',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
}

describe('parseEnv', () => {
  it('parses a valid config and sets defaults', () => {
    const env = parseEnv(validEnv)
    expect(env.PORT).toBe(3000)
    expect(env.ALLOWED_ORIGINS).toEqual([])
    expect(env.LOG_LEVEL).toBe('info')
  })

  it('splits ALLOWED_ORIGINS on commas and trims whitespace', () => {
    const env = parseEnv({
      ...validEnv,
      ALLOWED_ORIGINS: 'chrome-extension://a, chrome-extension://b',
    })
    expect(env.ALLOWED_ORIGINS).toEqual(['chrome-extension://a', 'chrome-extension://b'])
  })

  it('throws a readable error when DATABASE_URL is missing', () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/)
  })

  it('requires a BETTER_AUTH_SECRET of at least 32 characters', () => {
    expect(() => parseEnv({ ...validEnv, BETTER_AUTH_SECRET: 'too-short' })).toThrow(
      /BETTER_AUTH_SECRET/,
    )
  })
})
```

`apps/api/test/auth-helpers.ts`

```ts
import type { AppType } from '../src/app'
import { TEST_ORIGIN } from './create-test-app'

export const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'correct-horse-battery',
}

let ipCounter = 0

// Better Auth limits sign-in and sign-up to 3 requests per 10 s per IP, and keeps the counters
// in memory shared by all tests in a file. A fresh IP per request keeps tests independent.
export function uniqueIp() {
  ipCounter += 1
  return `10.0.${Math.floor(ipCounter / 256)}.${ipCounter % 256}`
}

export function postJson(
  app: AppType,
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return app.request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: TEST_ORIGIN,
      'X-Forwarded-For': uniqueIp(),
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

export async function signUp(app: AppType, user = TEST_USER) {
  const res = await postJson(app, '/api/auth/sign-up/email', user)
  const token = res.headers.get('set-auth-token')
  if (!res.ok || !token) throw new Error(`Sign-up failed with status ${res.status}`)
  return token
}
```

`apps/api/test/auth.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { postJson, signUp, TEST_USER } from './auth-helpers'
import { createTestApp, TEST_ORIGIN } from './create-test-app'

describe('auth', () => {
  it('signs up a user and returns a session token', async () => {
    const { app } = await createTestApp()
    const res = await postJson(app, '/api/auth/sign-up/email', { ...TEST_USER, name: '  Ala  ' })
    expect(res.status).toBe(200)
    expect(res.headers.get('set-auth-token')).toBeTruthy()
    expect((await res.json()).user.name).toBe('Ala')
  })

  it('creates a session valid for 30 days', async () => {
    const { app, client } = await createTestApp()
    await signUp(app)
    const { rows } = await client.query<{ days: number }>(
      `select extract(epoch from expires_at - created_at) / 86400 as days from session`,
    )
    expect(Number(rows[0]?.days)).toBeCloseTo(30)
  })

  it('rejects a name longer than 50 characters and creates no user', async () => {
    const { app, client } = await createTestApp()
    const res = await postJson(app, '/api/auth/sign-up/email', {
      ...TEST_USER,
      name: 'a'.repeat(51),
    })
    expect(res.status).toBe(400)
    const { rows } = await client.query('select id from "user"')
    expect(rows).toHaveLength(0)
  })

  it('gives the same error for a wrong password and an unknown email', async () => {
    const { app } = await createTestApp()
    await signUp(app)
    const wrongPassword = await postJson(app, '/api/auth/sign-in/email', {
      email: TEST_USER.email,
      password: 'wrong-password',
    })
    const unknownEmail = await postJson(app, '/api/auth/sign-in/email', {
      email: 'nobody@example.com',
      password: 'wrong-password',
    })
    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect((await wrongPassword.json()).code).toBe((await unknownEmail.json()).code)
  })

  it('returns the session for a bearer token', async () => {
    const { app } = await createTestApp()
    const token = await signUp(app)
    const res = await app.request('/api/auth/get-session', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBe(200)
    expect((await res.json()).user.email).toBe(TEST_USER.email)
  })

  it('rejects sign-in from an origin outside the allowed list', async () => {
    const { app } = await createTestApp()
    await signUp(app)
    const res = await postJson(
      app,
      '/api/auth/sign-in/email',
      { email: TEST_USER.email, password: TEST_USER.password },
      { Origin: 'https://evil.example' },
    )
    expect(res.status).toBe(403)
  })

  it('limits sign-in attempts to 3 per 10 seconds per IP', async () => {
    const { app } = await createTestApp()
    const attempt = () =>
      postJson(
        app,
        '/api/auth/sign-in/email',
        { email: TEST_USER.email, password: 'wrong-password' },
        { 'X-Forwarded-For': '203.0.113.7' },
      )
    const statuses = []
    for (let i = 0; i < 4; i++) statuses.push((await attempt()).status)
    expect(statuses).toEqual([401, 401, 401, 429])
  })

  it('lets the extension send Authorization and read set-auth-token', async () => {
    const { app } = await createTestApp()
    const preflight = await app.request('/api/auth/sign-in/email', {
      method: 'OPTIONS',
      headers: {
        Origin: TEST_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    })
    expect(preflight.headers.get('Access-Control-Allow-Headers')?.toLowerCase()).toContain(
      'authorization',
    )
    const res = await postJson(app, '/api/auth/sign-up/email', TEST_USER)
    expect(res.headers.get('Access-Control-Expose-Headers')?.toLowerCase()).toContain(
      'set-auth-token',
    )
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **CORS i `trustedOrigins` to dwa różne mechanizmy. Co robi każdy z nich?** CORS mówi przeglądarce, czy skrypt z danego originu może **odczytać** odpowiedź. `trustedOrigins` to ochrona Better Auth przed CSRF: serwer sam odrzuca (403) żądanie zmieniające stan, gdy przyszło z obcego originu. Działa nawet wtedy, gdy CORS nic by nie zablokował, np. przy wysłaniu zwykłego formularza HTML z obcej strony.
2. **Dlaczego `curl` bez nagłówka `Origin` może się zalogować, a skrypt z obcej strony nie?** Sprawdzanie originu chroni użytkownika przeglądarki przed stronami, które działają w jego imieniu. `curl` nie działa w niczyim imieniu. Przed zgadywaniem haseł chroni rate limiting, a nie origin.
3. **Dlaczego złe hasło i nieznany e-mail dają ten sam kod?** Różne odpowiedzi pozwoliłyby sprawdzić, czy dany adres ma konto (enumeracja kont). F-AUTH-02 wymaga jednego ogólnego komunikatu.
4. **Po co test na 30 dni, skoro to jedna liczba w konfiguracji?** Domyślna wartość Better Auth to 7 dni. Test sprawdza wymaganie F-AUTH-03, a nie implementację: zmiana konfiguracji lub domyślnej wartości w bibliotece od razu go zaczerwieni.

</details>

---

## Zadanie 6: `requireAuth` i chroniony endpoint `/api/me`

**Cel:** pierwszy endpoint, który wymaga sesji. Bez tokenu, z tokenem bez podpisu i po wylogowaniu zwraca 401 w naszym formacie błędu. Spełnia to DoD: „Testy API pokrywają 401 dla chronionego endpointu testowego”.

**Czego się nauczysz:** `auth.api.getSession` po stronie serwera, middleware dla jednej trasy, zmienne kontekstu (`c.set`, `c.var`), podpisany token bearer.

**Pliki:**

- Utwórz: `apps/api/src/middleware/require-auth.ts`
- Zmień: `apps/api/src/app.ts`, `apps/api/src/auth.ts`
- Test: `apps/api/test/me.test.ts`

**Interfejsy:**

- Korzysta z: `AppError` (zadanie 2), `Auth` (zadanie 4), `postJson` i `signUp` (zadanie 5).
- Wytwarza: `requireAuth(auth)` z `c.var.user` oraz `GET /api/me` → `{ id, name, email }`. Z `/api/me` korzysta rozszerzenie w zadaniu 9.

**Kroki:**

- [x] **1. Czerwone testy** w `test/me.test.ts`:
  - bez nagłówka `Authorization`: 401 i `{ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }`;
  - z tokenem z **treści** odpowiedzi rejestracji (pole `token`, bez podpisu): 401 i ten sam błąd;
  - z tokenem z nagłówka `set-auth-token`: 200 i `{ id, name, email }`;
  - po `POST /api/auth/sign-out` z tym samym tokenem: 401.

  Oczekiwany wynik: **FAIL** (404).

- [x] **2. Implementacja** `requireAuth` i trasy `.get('/me', requireAuth(auth), handler)` przed `.onError`.
- [x] **3. Uruchom.** Oczekiwany wynik: 3 testy przechodzą, a test z tokenem bez podpisu dostaje 200 zamiast 401. Domyślnie wtyczka `bearer` przyjmuje też surowy token i sama go podpisuje.
- [x] **4. Podpis wymagany.** W `src/auth.ts` zmień `bearer()` na `bearer({ requireSignature: true })`.
- [x] **5. Zielone testy.** Oczekiwany wynik: **PASS (27 testów w pakiecie API)**.
- [x] **6. Sprawdzenie ręczne.** `curl -i localhost:3000/api/me` daje 401 w naszym formacie. Z `-H 'Authorization: Bearer <token z set-auth-token>'` z zadania 5 daje 200.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(api): add requireAuth and GET /api/me`.

<details>
<summary>Podpowiedź</summary>

- `auth.api.getSession({ headers })` zwraca `{ user, session }` albo `null`. Nagłówki żądania to `c.req.raw.headers`.
- Typ użytkownika: `Auth['$Infer']['Session']['user']`.
- `createMiddleware<{ Variables: { user: SessionUser } }>` sprawia, że w handlerze trasy `c.var.user` ma właściwy typ.
- Middleware podany jako drugi argument `.get(path, middleware, handler)` działa tylko dla tej trasy.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/middleware/require-auth.ts`

```ts
import { createMiddleware } from 'hono/factory'
import type { Auth } from '../auth'
import { AppError } from '../lib/errors'

export type SessionUser = Auth['$Infer']['Session']['user']

export function requireAuth(auth: Auth) {
  return createMiddleware<{ Variables: { user: SessionUser } }>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    c.set('user', session.user)
    await next()
  })
}
```

`apps/api/src/app.ts`: import `requireAuth` z `./middleware/require-auth` i nowa trasa między `/health` a `.onError`:

```ts
    .get('/me', requireAuth(auth), (c) => {
      const { id, name, email } = c.var.user
      return c.json({ id, name, email })
    })
```

`apps/api/src/auth.ts` (zmieniona linia)

```ts
    plugins: [bearer({ requireSignature: true })],
```

`apps/api/test/me.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { postJson, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'

const unauthorized = { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }

describe('GET /api/me', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request('/api/me')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(unauthorized)
  })

  it('returns 401 for a token without a valid signature', async () => {
    const { app } = await createTestApp()
    const signUpRes = await postJson(app, '/api/auth/sign-up/email', TEST_USER)
    // The body holds the raw token as stored in the database, without the signature
    const { token: rawToken } = await signUpRes.json()
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${rawToken}` } })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(unauthorized)
  })

  it('returns the signed-in user', async () => {
    const { app } = await createTestApp()
    const token = await signUp(app)
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${token}` } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: expect.any(String),
      name: TEST_USER.name,
      email: TEST_USER.email,
    })
  })

  it('returns 401 after sign-out', async () => {
    const { app } = await createTestApp()
    const token = await signUp(app)
    const auth = { Authorization: `Bearer ${token}` }
    const signOut = await postJson(app, '/api/auth/sign-out', {}, auth)
    expect(signOut.status).toBe(200)
    const res = await app.request('/api/me', { headers: auth })
    expect(res.status).toBe(401)
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Czym różni się 401 od 403?** 401 znaczy „nie wiem, kim jesteś” (brak sesji lub nieważna sesja). 403 znaczy „wiem, kim jesteś, ale nie wolno ci”. `requireAuth` zwraca 401, a rozszerzenie traktuje je jak wylogowanie (F-AUTH-05).
2. **Co daje `requireSignature: true`?** W tabeli `session` leżą surowe tokeny. Gdyby ktoś wykradł samą bazę, bez podpisu mógłby ich użyć od razu. Podpis wymaga jeszcze `BETTER_AUTH_SECRET`, który w bazie nie występuje.
3. **Dlaczego `requireAuth` jest przypięty do trasy, a nie dodany przez `.use()` dla całego API?** Globalny middleware dopisany na końcu łańcucha łapałby też nieistniejące ścieżki i zwracałby na nie 401 zamiast 404. Moduły z Etapu 2 dostaną `requireAuth` we własnych routerach.

</details>

---

## Zadanie 7: i18n w rozszerzeniu

**Cel:** rozszerzenie mówi po polsku, gdy przeglądarka ma język `pl*`, a w pozostałych przypadkach po angielsku (F-I18N-01, F-I18N-02 przed zalogowaniem). Teksty Nuxt UI też są przetłumaczone.

**Czego się nauczysz:** `vue-i18n` w trybie Composition API, pliki komunikatów JSON, `UApp :locale`, atrybut `lang` dokumentu.

**Pliki:**

- Utwórz: `apps/extension/src/i18n/locale.ts`, `apps/extension/src/i18n/index.ts`, `apps/extension/src/i18n/pl.json`, `apps/extension/src/i18n/en.json`
- Zmień: `apps/extension/src/entrypoints/newtab/main.ts`, `apps/extension/src/entrypoints/newtab/App.vue`
- Test: `apps/extension/src/i18n/locale.test.ts`

**Interfejsy:**

- Wytwarza: `LOCALES`, `type Locale = 'pl' | 'en'`, `detectLocale(browserLanguage: string): Locale` oraz instancję `i18n`. Klucze komunikatów: `app.*`, `auth.*`, `home.*`, `validation.*`. Używają ich zadania 9 i 10.

**Kroki:**

- [x] **1. Zależność.** `pnpm --filter @one-place/extension add vue-i18n@^11`
- [x] **2. Czerwony test** w `src/i18n/locale.test.ts`: `'pl'` i `'pl-PL'` dają `'pl'`, a `'en-US'`, `'de'` i pusty tekst dają `'en'`. Oczekiwany wynik: **FAIL**.
- [x] **3. Implementacja** `locale.ts`. Oczekiwany wynik: **PASS (2 testy w rozszerzeniu)**.
- [x] **4. Komunikaty.** Utwórz `pl.json` i `en.json` z rozwiązania. Zawierają już teksty ekranów z zadań 9 i 10.
- [x] **5. Instancja.** `src/i18n/index.ts`: `createI18n` z `legacy: false`, `locale: detectLocale(navigator.language)`, `fallbackLocale: 'en'` i oboma plikami. W `main.ts` dodaj `.use(i18n)`.
- [x] **6. Nuxt UI i dokument.** W `App.vue` przekaż `<UApp :locale="uiLocale">`, gdzie `uiLocale` to `pl` lub `en` z `@nuxt/ui/locale`. W `watchEffect` ustawiaj `document.documentElement.lang` i `document.title = t('app.title')`.
- [x] **7. Sprawdzenie ręczne.** `pnpm dev`: karta ma tytuł „Nowa karta”, a `<html lang="pl">` (DevTools → Elements). Żeby zobaczyć wersję angielską, zmień na chwilę w `i18n/index.ts` `detectLocale(navigator.language)` na `detectLocale('en')`: tytuł zmienia się na „New tab”. Cofnij zmianę.
- [x] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): add vue-i18n with Polish and English`.

**Pułapki (sprawdzone na prototypie):**

- **CSP rozszerzenia.** Manifest V3 zabrania `eval` i `new Function`. `vue-i18n` 11 kompiluje komunikaty bez nich, więc działa na nowej karcie bez dodatkowej konfiguracji. Kompilację podczas builda dodasz w zadaniu 11, ale tylko po to, żeby zmniejszyć paczkę.
- **Język przeglądarki w macOS.** Chrome na macOS ignoruje flagę `--lang` i bierze język z ustawień systemu, dlatego do sprawdzenia wersji angielskiej najprościej jest chwilowo podmienić argument `detectLocale`.

<details>
<summary>Podpowiedź</summary>

- `legacy: false` włącza tryb Composition API: w `<script setup>` używasz `const { t, locale } = useI18n()`.
- `createI18n<[MessageSchema], Locale>` z `MessageSchema = typeof pl` daje podpowiedzi kluczy w edytorze.
- `@nuxt/ui/locale` eksportuje gotowe tłumaczenia komponentów, m.in. `pl` i `en`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/i18n/locale.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { detectLocale } from './locale'

describe('detectLocale', () => {
  it('returns pl for any Polish browser language', () => {
    expect(detectLocale('pl')).toBe('pl')
    expect(detectLocale('pl-PL')).toBe('pl')
  })

  it('returns en for every other language', () => {
    expect(detectLocale('en-US')).toBe('en')
    expect(detectLocale('de')).toBe('en')
    expect(detectLocale('')).toBe('en')
  })
})
```

`apps/extension/src/i18n/locale.ts`

```ts
export const LOCALES = ['pl', 'en'] as const

export type Locale = (typeof LOCALES)[number]

// F-I18N-02: before sign-in the language comes from the browser, `pl*` means Polish
export function detectLocale(browserLanguage: string): Locale {
  return browserLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}
```

`apps/extension/src/i18n/index.ts`

```ts
import { createI18n } from 'vue-i18n'
import en from './en.json'
import { detectLocale, type Locale } from './locale'
import pl from './pl.json'

export type MessageSchema = typeof pl

export const i18n = createI18n<[MessageSchema], Locale>({
  legacy: false,
  locale: detectLocale(navigator.language),
  fallbackLocale: 'en',
  messages: { pl, en },
})
```

`apps/extension/src/i18n/pl.json`

```json
{
  "app": {
    "title": "Nowa karta"
  },
  "auth": {
    "signIn": {
      "title": "Zaloguj się",
      "submit": "Zaloguj się",
      "switch": "Nie masz konta?",
      "switchAction": "Załóż konto"
    },
    "signUp": {
      "title": "Załóż konto",
      "submit": "Załóż konto",
      "switch": "Masz już konto?",
      "switchAction": "Zaloguj się"
    },
    "fields": {
      "name": "Nazwa",
      "email": "E-mail",
      "password": "Hasło"
    },
    "errors": {
      "invalidCredentials": "Nieprawidłowy e-mail lub hasło",
      "emailTaken": "Konto z tym adresem e-mail już istnieje",
      "tooManyAttempts": "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
      "network": "Brak połączenia z serwerem",
      "unknown": "Coś poszło nie tak. Spróbuj ponownie."
    },
    "sessionExpired": "Sesja wygasła. Zaloguj się ponownie.",
    "signOut": "Wyloguj"
  },
  "home": {
    "greeting": "Cześć, {name}!"
  },
  "validation": {
    "nameRequired": "Podaj nazwę",
    "nameTooLong": "Nazwa może mieć najwyżej 50 znaków",
    "emailInvalid": "Podaj poprawny adres e-mail",
    "passwordRequired": "Podaj hasło",
    "passwordTooShort": "Hasło musi mieć co najmniej 8 znaków",
    "passwordTooLong": "Hasło może mieć najwyżej 128 znaków"
  }
}
```

`apps/extension/src/i18n/en.json`

```json
{
  "app": {
    "title": "New tab"
  },
  "auth": {
    "signIn": {
      "title": "Sign in",
      "submit": "Sign in",
      "switch": "Don't have an account?",
      "switchAction": "Sign up"
    },
    "signUp": {
      "title": "Create an account",
      "submit": "Sign up",
      "switch": "Already have an account?",
      "switchAction": "Sign in"
    },
    "fields": {
      "name": "Name",
      "email": "Email",
      "password": "Password"
    },
    "errors": {
      "invalidCredentials": "Invalid email or password",
      "emailTaken": "An account with this email already exists",
      "tooManyAttempts": "Too many attempts. Try again in a moment.",
      "network": "Cannot connect to the server",
      "unknown": "Something went wrong. Please try again."
    },
    "sessionExpired": "Your session has expired. Please sign in again.",
    "signOut": "Sign out"
  },
  "home": {
    "greeting": "Hi, {name}!"
  },
  "validation": {
    "nameRequired": "Enter your name",
    "nameTooLong": "Name can be at most 50 characters long",
    "emailInvalid": "Enter a valid email address",
    "passwordRequired": "Enter your password",
    "passwordTooShort": "Password must be at least 8 characters long",
    "passwordTooLong": "Password can be at most 128 characters long"
  }
}
```

`apps/extension/src/entrypoints/newtab/main.ts` (stan po tym zadaniu)

```ts
import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { i18n } from '@/i18n'
import App from './App.vue'
import '~/assets/main.css'

createApp(App).use(ui).use(i18n).mount('#app')
```

`App.vue`: w `<script setup>` zamień import z `vue` na pierwszą linię poniżej i dopisz resztę

```ts
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { en, pl } from '@nuxt/ui/locale'

const { locale, t } = useI18n()
const uiLocale = computed(() => (locale.value === 'pl' ? pl : en))

watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = t('app.title')
})
```

a w szablonie zamień `<UApp>` na `<UApp :locale="uiLocale">`. Reszta demo z Etapu 0 zostaje do zadania 9.

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Po co `UApp :locale`, skoro mamy `vue-i18n`?** Nuxt UI ma własne teksty (np. etykiety dostępności przycisków, „Zamknij” w oknach). `vue-i18n` ich nie zna, więc język trzeba podać komponentom osobno.
2. **Co daje `fallbackLocale: 'en'`?** Gdy w `pl.json` zabraknie klucza, użytkownik zobaczy tekst angielski zamiast nazwy klucza.
3. **Dlaczego ustawiamy `lang` na `<html>`?** Czytniki ekranu wybierają według niego wymowę, a przeglądarka dzielenie wyrazów i podpowiedzi tłumaczenia.

</details>

---

## Zadanie 8: sesja i klienci API w rozszerzeniu

**Cel:** token przetrwa zamknięcie karty, wszystkie karty widzą ten sam stan sesji, a odpowiedź 401 z API kończy sesję z komunikatem „Sesja wygasła” (F-AUTH-05).

**Czego się nauczysz:** `storage.defineItem` z WXT i `watch` (zmiany z innych kart), testy z `fakeBrowser`, własny `fetch` w kliencie Hono RPC, `createAuthClient` z tokenem bearer.

**Pliki:**

- Utwórz: `apps/extension/vitest.config.ts`, `apps/extension/src/api/session.ts`, `apps/extension/src/api/auth-fetch.ts`, `apps/extension/src/api/auth-client.ts`
- Zmień: `apps/extension/src/api/client.ts`, `apps/extension/src/entrypoints/newtab/main.ts`
- Test: `apps/extension/src/api/session.test.ts`, `apps/extension/src/api/auth-fetch.test.ts`

**Interfejsy:**

- Wytwarza:
  - `session.token` i `session.notice` (refy tylko do odczytu), `type SessionNotice = 'session-expired'`, `getToken(): string | null`, `loadSession()`, `startSession(token)`, `endSession(reason?)`;
  - `createAuthFetch({ getToken, onUnauthorized, fetch? }): typeof fetch`;
  - `apiClient` (Hono RPC z tokenem, 401 wywołuje `endSession('session-expired')`) i `authClient` (Better Auth).

  Używają ich zadania 9 i 10.

**Kroki:**

- [x] **1. Zależność i konfiguracja testów.** `pnpm --filter @one-place/extension add better-auth@^1.7`. Utwórz `vitest.config.ts` z wtyczką `WxtVitest()`: podmienia API przeglądarki na `fakeBrowser` z pamięcią zamiast prawdziwego `chrome.storage`.
- [x] **2. Czerwone testy sesji** w `src/api/session.test.ts`. W `beforeEach` wywołaj `fakeBrowser.reset()` i `await loadSession()`.
  - token zapisany w `storage.local` pod kluczem `authToken` jest dostępny po `loadSession()`;
  - `startSession('new-token')` zapisuje token i czyści wcześniejszy `notice`;
  - `endSession('session-expired')` usuwa token z pamięci i storage, a `notice` to `'session-expired'`;
  - zapis i usunięcie `authToken` w storage (czyli działanie innej karty) od razu zmienia `getToken()`.

  Oczekiwany wynik: **FAIL**.

- [x] **3. Implementacja** `session.ts`. Oczekiwany wynik: **PASS (6 testów w rozszerzeniu)**.
- [x] **4. Czerwone testy `createAuthFetch`** w `src/api/auth-fetch.test.ts`. Zamiast prawdziwego `fetch` podaj `vi.fn<typeof globalThis.fetch>`:
  - z tokenem wysyła `Authorization: Bearer token` i zachowuje inne nagłówki;
  - bez tokenu nie wysyła `Authorization`;
  - odpowiedź 401 wywołuje `onUnauthorized` dokładnie raz;
  - odpowiedź 503 go nie wywołuje.
- [x] **5. Implementacja** `auth-fetch.ts`. Oczekiwany wynik: **PASS (10 testów w rozszerzeniu)**.
- [x] **6. Klienci.** `api/client.ts`: `hc<AppType>(url, { fetch: createAuthFetch({ getToken, onUnauthorized }) })`, gdzie `onUnauthorized` wywołuje `endSession('session-expired')`. `api/auth-client.ts`: `createAuthClient` z `better-auth/vue` z `baseURL: import.meta.env.WXT_API_URL` i `fetchOptions.auth` typu `Bearer`, który bierze token z `getToken()`.
- [x] **7. Start.** W `main.ts` zamontuj aplikację dopiero po `loadSession()`.
- [x] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): add session storage and API clients with token`.

**Pułapki (sprawdzone na prototypie):**

- **Stan modułu przeżywa między testami.** `token` i `notice` to zmienne na poziomie modułu, a `fakeBrowser.reset()` czyści tylko storage. Dlatego `beforeEach` wywołuje też `loadSession()`, które synchronizuje pamięć ze storage i od nowa podpina `watch`.
- **Na 401 reaguje tylko `apiClient`.** `authClient` celowo nie używa `createAuthFetch`, bo 401 z logowania oznacza złe hasło, a nie wygasłą sesję (punkt 1 z [Na co uważać](#na-co-uważać)).
- **`vi.fn` bez typu** z parametrami `(_input, _init)` dostaje od ESLint błąd o nieużywanych zmiennych. `vi.fn<typeof globalThis.fetch>(async () => response)` daje te same typy bez parametrów.

<details>
<summary>Podpowiedź</summary>

- `storage.defineItem<string | null>('local:authToken', { fallback: null })` z `wxt/utils/storage` zwraca obiekt z `getValue`, `setValue`, `removeValue` i `watch(callback)`. `watch` zwraca funkcję, która kończy obserwację.
- Prefiks `local:` oznacza `chrome.storage.local`. Klucz w samym storage to `authToken`.
- `readonly(ref)` z Vue pozwala innym modułom czytać stan, ale nie zmieniać go z pominięciem funkcji.
- `new Headers(init?.headers)` przyjmuje obiekt, tablicę lub `Headers`, więc zachowasz nagłówki wysłane przez klienta Hono.

</details>

<details>
<summary>Rozwiązanie: sesja</summary>

`apps/extension/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
  plugins: [WxtVitest()],
})
```

`apps/extension/src/api/session.ts`

```ts
import { readonly, ref } from 'vue'
import { storage } from 'wxt/utils/storage'

export type SessionNotice = 'session-expired'

const tokenItem = storage.defineItem<string | null>('local:authToken', { fallback: null })

const token = ref<string | null>(null)
const notice = ref<SessionNotice | null>(null)
let stopWatching: (() => void) | undefined

export const session = { token: readonly(token), notice: readonly(notice) }

export function getToken() {
  return token.value
}

export async function loadSession() {
  token.value = await tokenItem.getValue()
  // Every open new tab has its own copy of the token. Keep them in sync.
  stopWatching?.()
  stopWatching = tokenItem.watch((value) => {
    token.value = value
  })
}

export async function startSession(newToken: string) {
  token.value = newToken
  notice.value = null
  await tokenItem.setValue(newToken)
}

export async function endSession(reason: SessionNotice | null = null) {
  token.value = null
  notice.value = reason
  await tokenItem.removeValue()
}
```

`apps/extension/src/api/session.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { endSession, getToken, loadSession, session, startSession } from './session'

describe('session', () => {
  beforeEach(async () => {
    fakeBrowser.reset()
    await loadSession()
  })

  it('restores the token saved by a previous tab', async () => {
    await fakeBrowser.storage.local.set({ authToken: 'saved-token' })
    await loadSession()
    expect(getToken()).toBe('saved-token')
  })

  it('saves the token on start and clears the previous notice', async () => {
    await endSession('session-expired')
    await startSession('new-token')
    expect(session.notice.value).toBeNull()
    expect(await fakeBrowser.storage.local.get('authToken')).toEqual({ authToken: 'new-token' })
  })

  it('removes the token on end and remembers why', async () => {
    await startSession('token')
    await endSession('session-expired')
    expect(getToken()).toBeNull()
    expect(session.notice.value).toBe('session-expired')
    expect(await fakeBrowser.storage.local.get('authToken')).toEqual({})
  })

  it('follows sign-in and sign-out in other tabs', async () => {
    await fakeBrowser.storage.local.set({ authToken: 'from-other-tab' })
    expect(getToken()).toBe('from-other-tab')
    await fakeBrowser.storage.local.remove('authToken')
    expect(getToken()).toBeNull()
  })
})
```

</details>

<details>
<summary>Rozwiązanie: klienci</summary>

`apps/extension/src/api/auth-fetch.ts`

```ts
interface AuthFetchDeps {
  getToken: () => string | null
  onUnauthorized: () => void
  fetch?: typeof globalThis.fetch
}

export function createAuthFetch({
  getToken,
  onUnauthorized,
  fetch = globalThis.fetch,
}: AuthFetchDeps): typeof globalThis.fetch {
  return async (input, init) => {
    const headers = new Headers(init?.headers)
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(input, { ...init, headers })
    if (response.status === 401) onUnauthorized()
    return response
  }
}
```

`apps/extension/src/api/auth-fetch.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest'
import { createAuthFetch } from './auth-fetch'

function setup({ token = 'token' as string | null, response = new Response('{}') } = {}) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => response)
  const onUnauthorized = vi.fn()
  const authFetch = createAuthFetch({ getToken: () => token, onUnauthorized, fetch })
  const sentHeaders = () => new Headers(fetch.mock.calls[0]?.[1]?.headers)
  return { authFetch, onUnauthorized, sentHeaders }
}

describe('createAuthFetch', () => {
  it('sends the token as a Bearer header and keeps other headers', async () => {
    const { authFetch, sentHeaders } = setup()
    await authFetch('http://api.test/api/me', { headers: { 'Content-Type': 'application/json' } })
    expect(sentHeaders().get('Authorization')).toBe('Bearer token')
    expect(sentHeaders().get('Content-Type')).toBe('application/json')
  })

  it('sends no Authorization header without a token', async () => {
    const { authFetch, sentHeaders } = setup({ token: null })
    await authFetch('http://api.test/api/me')
    expect(sentHeaders().has('Authorization')).toBe(false)
  })

  it('reports a 401 response', async () => {
    const { authFetch, onUnauthorized } = setup({ response: new Response('{}', { status: 401 }) })
    await authFetch('http://api.test/api/me')
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not report other errors', async () => {
    const { authFetch, onUnauthorized } = setup({ response: new Response('{}', { status: 503 }) })
    await authFetch('http://api.test/api/me')
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
```

`apps/extension/src/api/client.ts`

```ts
import { hc } from 'hono/client'
import type { AppType } from '@one-place/api'
import { createAuthFetch } from './auth-fetch'
import { endSession, getToken } from './session'

export const apiClient = hc<AppType>(import.meta.env.WXT_API_URL, {
  fetch: createAuthFetch({
    getToken,
    // F-AUTH-05: any 401 from the API works like signing out
    onUnauthorized: () => void endSession('session-expired'),
  }),
})
```

`apps/extension/src/api/auth-client.ts` (stan po tym zadaniu; w zadaniu 9 dojdzie jedna opcja)

```ts
import { createAuthClient } from 'better-auth/vue'
import { getToken } from './session'

export const authClient = createAuthClient({
  baseURL: import.meta.env.WXT_API_URL,
  fetchOptions: {
    auth: { type: 'Bearer', token: () => getToken() ?? undefined },
  },
})
```

`apps/extension/src/entrypoints/newtab/main.ts`

```ts
import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { loadSession } from '@/api/session'
import { i18n } from '@/i18n'
import App from './App.vue'
import '~/assets/main.css'

// Read the token before the first render, so a signed-in user never sees the sign-in screen flash
loadSession().then(() => {
  createApp(App).use(ui).use(i18n).mount('#app')
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Po co kopia tokenu w pamięci, skoro jest w storage?** Klient potrzebuje tokenu synchronicznie przy każdym żądaniu, a odczyt z `chrome.storage` jest asynchroniczny. Kopię wczytuje `loadSession()` przy starcie, a `watch` utrzymuje ją w zgodzie ze storage.
2. **Dlaczego `chrome.storage.local`, a nie `localStorage`?** Tak wymaga specyfikacja. Poza tym `chrome.storage` jest dostępny we wszystkich częściach rozszerzenia, także w service workerze z przyszłych etapów, i powiadamia inne karty o zmianach.
3. **Dlaczego `main.ts` czeka na `loadSession()` przed montażem?** Bez tego pierwszy render nie znałby tokenu i zalogowany użytkownik na moment zobaczyłby ekran logowania.

</details>

---

## Zadanie 9: ekrany logowania, rejestracji i wylogowanie (R5)

**Cel:** w nowej karcie można założyć konto, zalogować się i wylogować. Błędy są czytelne i przetłumaczone. Po drodze zobaczysz, dlaczego rozszerzenie wysyła żądania z `credentials: 'omit'`.

**Czego się nauczysz:** `UForm` z własną walidacją, `UFormField`, `UAlert`, klient Better Auth (`signIn.email`, `signUp.email`, `signOut`, `onSuccess`), tryb `credentials` w `fetch` i jego związek z CORS.

**Pliki:**

- Utwórz: `apps/extension/src/i18n/form-errors.ts`, `apps/extension/src/features/auth/auth-error.ts`, `apps/extension/src/features/auth/use-auth-request.ts`, `apps/extension/src/features/auth/SignInForm.vue`, `apps/extension/src/features/auth/SignUpForm.vue`, `apps/extension/src/features/auth/AuthScreen.vue`, `apps/extension/src/features/home/HomeScreen.vue`
- Zmień: `apps/extension/src/entrypoints/newtab/App.vue`, `apps/extension/src/api/auth-client.ts`, `apps/extension/package.json` (zależność `zod`)
- Test: `apps/extension/src/i18n/form-errors.test.ts`, `apps/extension/src/features/auth/auth-error.test.ts`

**Interfejsy:**

- Korzysta z: `SignInSchema` i `SignUpSchema` (zadanie 1), `GET /api/me` (zadanie 6), komunikatów `auth.*` (zadanie 7), `authClient`, `apiClient`, `startSession` i `endSession` (zadanie 8).
- Wytwarza: `formErrors(schema, t)` → funkcja dla `UForm :validate`; `authErrorKey({ status, code? })` → klucz `auth.errors.*`; `useAuthRequest()` → `{ loading, errorKey, run }`.

**Kroki:**

- [x] **1. Zależność.** `pnpm --filter @one-place/extension add zod@^4` (rozszerzenie importuje z niego typ).
- [x] **2. Czerwone testy `formErrors`** w `src/i18n/form-errors.test.ts`, z udawaną funkcją `t = (key) => 'translated:' + key`:
  - poprawne dane `SignUpSchema` dają `[]`;
  - pusta nazwa i hasło `'short'` dają `[{ name: 'name', message: 'translated:validation.nameRequired' }, { name: 'password', message: 'translated:validation.passwordTooShort' }]`.
- [x] **3. Implementacja** `form-errors.ts`. Oczekiwany wynik: **PASS (12 testów w rozszerzeniu)**.
- [x] **4. Czerwone testy `authErrorKey`** w `src/features/auth/auth-error.test.ts`: 401 → `auth.errors.invalidCredentials`, 422 z kodem `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` → `auth.errors.emailTaken`, 429 → `auth.errors.tooManyAttempts`, 500 → `auth.errors.unknown`.
- [x] **5. Implementacja** `auth-error.ts`. Oczekiwany wynik: **PASS (16 testów w rozszerzeniu)**.
- [x] **6. Wspólna logika formularzy** w `use-auth-request.ts`: `run(request)` ustawia `loading`, przekazuje do żądania `onSuccess`, który zapisuje token z nagłówka `set-auth-token` przez `startSession`, zamienia `error` na klucz przez `authErrorKey`, a wyjątek (brak sieci) na `auth.errors.network`.
- [x] **7. Formularze.** `SignInForm.vue` i `SignUpForm.vue`: `UForm` z `:validate="formErrors(schema, t)"` i `:state`, pola w `UFormField`, `UAlert` z błędem, przycisk z `:loading` i link przełączający na drugi formularz (zdarzenie `switch`). `AuthScreen.vue` to karta (`UCard`) z tytułem i jednym z formularzy.
- [x] **8. Ekran po zalogowaniu.** `HomeScreen.vue` zastępuje demo z Etapu 0: po zamontowaniu pobiera `apiClient.api.me.$get()` i pokazuje „Cześć, {name}!”, plakietkę stanu API oraz przycisk „Wyloguj”. Wylogowanie wywołuje `authClient.signOut()` w `try`/`catch`, a potem zawsze `endSession()`.
- [x] **9. Przełączanie.** `App.vue` renderuje `HomeScreen`, gdy `session.token.value` istnieje, a w przeciwnym razie `AuthScreen`.
- [x] **10. Eksperyment.** Uruchom `pnpm dev` i załóż konto. **Oczekiwany wynik: komunikat „Brak połączenia z serwerem”, a w konsoli DevTools:** „blocked by CORS policy: … The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true' when the request's credentials mode is 'include'”. Zastanów się nad przyczyną, zanim otworzysz wyjaśnienie poniżej.
- [x] **11. Poprawka.** W `auth-client.ts` dodaj `credentials: 'omit'` do `fetchOptions`. Załóż konto jeszcze raz: pojawia się „Cześć, {name}!” i `API: ok`.
- [x] **12. Sprawdzenie ręczne.**
  - Przeładuj kartę i otwórz nową: nadal jesteś zalogowany (DoD).
  - Wyloguj się, a potem zaloguj z błędnym hasłem: „Nieprawidłowy e-mail lub hasło”, bez komunikatu o wygasłej sesji (punkt 1 z [Na co uważać](#na-co-uważać)).
  - Spróbuj założyć drugie konto na ten sam e-mail: „Konto z tym adresem e-mail już istnieje”.
  - Wyślij pusty formularz rejestracji: trzy przetłumaczone komunikaty pod polami.
  - Cztery razy szybko wpisz złe hasło: „Zbyt wiele prób. Spróbuj ponownie za chwilę.” (punkt 4).
  - Zaloguj się poprawnie: w tabeli `session` przybywa wiersz, a po wylogowaniu znika (`docker compose exec db psql -U one one_place -c 'select count(*) from session'`).
- [x] **13.** `pnpm format && pnpm check`, potem commit: `feat(extension): add sign-in, sign-up and sign-out`.

**Pułapki (sprawdzone na prototypie):**

- **`UForm :schema` pokazałby klucze zamiast tekstów.** Nuxt UI wyświetla komunikat ze schematu bez zmian, czyli `validation.nameRequired`. Slot `#error` w `UFormField` mógłby go przetłumaczyć, ale gdy slot jest podany, Nuxt UI zawsze renderuje kontener błędu, także pusty, co dodaje odstęp pod każdym polem. Dlatego walidację robi `formErrors`, który tłumaczy komunikaty i zwraca `FormError[]` dla `:validate`.
- **Brak sieci to wyjątek, a nie `error`.** Klient Better Auth zwraca błędy HTTP jako `{ error: { status, code } }`, ale przy braku połączenia rzuca `TypeError: Failed to fetch`. Bez `try`/`catch` w `run` przycisk zostałby w stanie ładowania, a w konsoli pojawiłby się nieobsłużony wyjątek.
- **Kod „e-mail zajęty” zmienił nazwę.** W Better Auth 1.7 to `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`, a we wcześniejszych wersjach `USER_ALREADY_EXISTS`. `startsWith('USER_ALREADY_EXISTS')` obsługuje obie.
- **Token bierz z nagłówka.** Pole `token` w treści odpowiedzi to surowy token bez podpisu, a API od zadania 6 wymaga podpisu.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 10)</summary>

- Klient Better Auth domyślnie wysyła żądania z `credentials: 'include'`, bo zakłada sesję w ciasteczkach.
- Przy `include` przeglądarka dołącza ciasteczka i wymaga od serwera zgody na to: nagłówka `Access-Control-Allow-Credentials: true`. Nasze API go nie wysyła, bo celowo nie używa ciasteczek (decyzja D5). Przeglądarka odrzuca więc już odpowiedź na preflight, a do kodu dociera tylko `TypeError: Failed to fetch`, stąd „Brak połączenia z serwerem”.
- Włączenie credentials w CORS rozwiązałoby objaw, ale wpuściłoby ciasteczka, których nie chcemy: sesja rozszerzenia opiera się wyłącznie na tokenie w nagłówku. Właściwa poprawka to `credentials: 'omit'` po stronie klienta.
- To druga połowa odpowiedzi na ryzyko R5. Pierwszą sprawdziły testy w zadaniu 5: origin `chrome-extension://` musi być w `trustedOrigins`.

</details>

<details>
<summary>Podpowiedź</summary>

- `UForm` z `:validate` wywołuje twoją funkcję przy wysyłce i przy zmianach pól. Funkcja zwraca tablicę `{ name, message }`, a `UFormField` z pasującym `name` pokazuje komunikat.
- `issue.path.join('.')` zamienia ścieżkę błędu Zod na nazwę pola.
- Drugi argument metod klienta Better Auth to opcje fetch, m.in. `onSuccess: async ({ response }) => …`. Metody zwracają `{ data, error }`.
- Wynik `apiClient.api.me.$get()` sprawdzasz przez `res.ok`, a dane czytasz przez `await res.json()`.

</details>

<details>
<summary>Rozwiązanie: walidacja i błędy</summary>

`apps/extension/src/i18n/form-errors.ts`

```ts
import type { FormError } from '@nuxt/ui'
import type { z } from 'zod'

// Schemas in `shared` use i18n keys as messages. UForm shows messages as they are,
// so we validate ourselves and translate each message.
export function formErrors(schema: z.ZodType, t: (key: string) => string) {
  return (state: unknown): FormError[] => {
    const result = schema.safeParse(state)
    if (result.success) return []
    return result.error.issues.map((issue) => ({
      name: issue.path.join('.'),
      message: t(issue.message),
    }))
  }
}
```

`apps/extension/src/i18n/form-errors.test.ts`

```ts
import { SignUpSchema } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { formErrors } from './form-errors'

const t = (key: string) => `translated:${key}`

describe('formErrors', () => {
  it('returns no errors for valid input', () => {
    const validate = formErrors(SignUpSchema, t)
    expect(validate({ name: 'Ala', email: 'ala@example.com', password: 'correct-horse' })).toEqual(
      [],
    )
  })

  it('translates the message of every invalid field', () => {
    const validate = formErrors(SignUpSchema, t)
    expect(validate({ name: '', email: 'ala@example.com', password: 'short' })).toEqual([
      { name: 'name', message: 'translated:validation.nameRequired' },
      { name: 'password', message: 'translated:validation.passwordTooShort' },
    ])
  })
})
```

`apps/extension/src/features/auth/auth-error.ts`

```ts
export interface AuthError {
  status: number
  code?: string
}

export function authErrorKey(error: AuthError) {
  if (error.status === 401) return 'auth.errors.invalidCredentials'
  if (error.status === 422 && error.code?.startsWith('USER_ALREADY_EXISTS')) {
    return 'auth.errors.emailTaken'
  }
  if (error.status === 429) return 'auth.errors.tooManyAttempts'
  return 'auth.errors.unknown'
}
```

`apps/extension/src/features/auth/auth-error.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { authErrorKey } from './auth-error'

describe('authErrorKey', () => {
  it('uses one generic message for wrong email or password', () => {
    expect(authErrorKey({ status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(
      'auth.errors.invalidCredentials',
    )
  })

  it('recognizes an email that is already taken', () => {
    expect(authErrorKey({ status: 422, code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' })).toBe(
      'auth.errors.emailTaken',
    )
  })

  it('recognizes rate limiting', () => {
    expect(authErrorKey({ status: 429 })).toBe('auth.errors.tooManyAttempts')
  })

  it('falls back to a generic message', () => {
    expect(authErrorKey({ status: 500 })).toBe('auth.errors.unknown')
  })
})
```

`apps/extension/src/features/auth/use-auth-request.ts`

```ts
import { ref } from 'vue'
import { startSession } from '@/api/session'
import { authErrorKey, type AuthError } from './auth-error'

interface AuthRequestOptions {
  onSuccess: (context: { response: Response }) => Promise<void>
}

type AuthRequest = (options: AuthRequestOptions) => Promise<{ error: AuthError | null }>

// Shared by sign-in and sign-up: loading state, error message and saving the token.
export function useAuthRequest() {
  const loading = ref(false)
  const errorKey = ref<string | null>(null)

  async function run(request: AuthRequest) {
    loading.value = true
    errorKey.value = null
    try {
      const { error } = await request({
        onSuccess: async ({ response }) => {
          // The bearer plugin returns the signed session token in this header
          const token = response.headers.get('set-auth-token')
          if (token) await startSession(token)
        },
      })
      if (error) errorKey.value = authErrorKey(error)
    } catch {
      errorKey.value = 'auth.errors.network'
    } finally {
      loading.value = false
    }
  }

  return { loading, errorKey, run }
}
```

`apps/extension/src/api/auth-client.ts` (po kroku 11)

```ts
import { createAuthClient } from 'better-auth/vue'
import { getToken } from './session'

export const authClient = createAuthClient({
  baseURL: import.meta.env.WXT_API_URL,
  fetchOptions: {
    // The token travels in a header. Without 'omit' the browser would require CORS with credentials.
    credentials: 'omit',
    auth: { type: 'Bearer', token: () => getToken() ?? undefined },
  },
})
```

</details>

<details>
<summary>Rozwiązanie: komponenty</summary>

`apps/extension/src/features/auth/SignInForm.vue`

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { SignInSchema, type SignInInput } from '@one-place/shared'
import { authClient } from '@/api/auth-client'
import { formErrors } from '@/i18n/form-errors'
import { useAuthRequest } from './use-auth-request'

const emit = defineEmits<{ switch: [] }>()

const { t } = useI18n()
const state = reactive<SignInInput>({ email: '', password: '' })
const validate = formErrors(SignInSchema, t)
const { loading, errorKey, run } = useAuthRequest()

function onSubmit() {
  return run((options) => authClient.signIn.email(state, options))
}
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField name="email" :label="t('auth.fields.email')">
      <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
    </UFormField>
    <UFormField name="password" :label="t('auth.fields.password')">
      <UInput
        v-model="state.password"
        type="password"
        autocomplete="current-password"
        class="w-full"
      />
    </UFormField>
    <UAlert v-if="errorKey" color="error" variant="subtle" :title="t(errorKey)" />
    <UButton type="submit" :label="t('auth.signIn.submit')" :loading="loading" block />
    <p class="text-center text-sm text-muted">
      {{ t('auth.signIn.switch') }}
      <UButton variant="link" :label="t('auth.signIn.switchAction')" @click="emit('switch')" />
    </p>
  </UForm>
</template>
```

`apps/extension/src/features/auth/SignUpForm.vue`

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { SignUpSchema, type SignUpInput } from '@one-place/shared'
import { authClient } from '@/api/auth-client'
import { formErrors } from '@/i18n/form-errors'
import { useAuthRequest } from './use-auth-request'

const emit = defineEmits<{ switch: [] }>()

const { t } = useI18n()
const state = reactive<SignUpInput>({ name: '', email: '', password: '' })
const validate = formErrors(SignUpSchema, t)
const { loading, errorKey, run } = useAuthRequest()

function onSubmit() {
  return run((options) => authClient.signUp.email(state, options))
}
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField name="name" :label="t('auth.fields.name')">
      <UInput v-model="state.name" autocomplete="name" class="w-full" />
    </UFormField>
    <UFormField name="email" :label="t('auth.fields.email')">
      <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
    </UFormField>
    <UFormField name="password" :label="t('auth.fields.password')">
      <UInput v-model="state.password" type="password" autocomplete="new-password" class="w-full" />
    </UFormField>
    <UAlert v-if="errorKey" color="error" variant="subtle" :title="t(errorKey)" />
    <UButton type="submit" :label="t('auth.signUp.submit')" :loading="loading" block />
    <p class="text-center text-sm text-muted">
      {{ t('auth.signUp.switch') }}
      <UButton variant="link" :label="t('auth.signUp.switchAction')" @click="emit('switch')" />
    </p>
  </UForm>
</template>
```

`apps/extension/src/features/auth/AuthScreen.vue` (stan po tym zadaniu)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SignInForm from './SignInForm.vue'
import SignUpForm from './SignUpForm.vue'

const { t } = useI18n()
const mode = ref<'sign-in' | 'sign-up'>('sign-in')
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-default p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-center text-xl font-semibold text-highlighted">
          {{ t(mode === 'sign-in' ? 'auth.signIn.title' : 'auth.signUp.title') }}
        </h1>
      </template>
      <SignInForm v-if="mode === 'sign-in'" @switch="mode = 'sign-up'" />
      <SignUpForm v-else @switch="mode = 'sign-in'" />
    </UCard>
  </main>
</template>
```

`apps/extension/src/features/home/HomeScreen.vue` (stan po tym zadaniu)

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { authClient } from '@/api/auth-client'
import { apiClient } from '@/api/client'
import { endSession } from '@/api/session'
import { useApiHealth } from '@/api/use-api-health'

const { t } = useI18n()
const { health } = useApiHealth()
const name = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await apiClient.api.me.$get()
    if (res.ok) name.value = (await res.json()).name
  } catch {
    // Offline: keep the session, the greeting simply stays hidden
  }
})

async function signOut() {
  try {
    await authClient.signOut()
  } catch {
    // API unreachable: the server session will expire on its own
  }
  // F-AUTH-04: the local session always ends
  await endSession()
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-default text-default">
    <div class="flex flex-col items-center gap-6">
      <h1 v-if="name" class="text-2xl font-semibold text-highlighted">
        {{ t('home.greeting', { name }) }}
      </h1>
      <UBadge
        :label="`API: ${health}`"
        :color="health === 'ok' ? 'success' : 'error'"
        variant="subtle"
      />
      <UButton
        icon="i-lucide-log-out"
        :label="t('auth.signOut')"
        variant="outline"
        @click="signOut"
      />
    </div>
  </main>
</template>
```

`apps/extension/src/entrypoints/newtab/App.vue` (stan po tym zadaniu)

```vue
<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { en, pl } from '@nuxt/ui/locale'
import { session } from '@/api/session'
import AuthScreen from '@/features/auth/AuthScreen.vue'
import HomeScreen from '@/features/home/HomeScreen.vue'

const { locale, t } = useI18n()
const uiLocale = computed(() => (locale.value === 'pl' ? pl : en))

watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = t('app.title')
})
</script>

<template>
  <UApp :locale="uiLocale">
    <HomeScreen v-if="session.token.value" />
    <AuthScreen v-else />
  </UApp>
</template>
```

Demo akcentów i trybu ciemnego z Etapu 0 znika z nowej karty. Mechanizm wróci w Etapie 5 jako moduł motywu, a `accentCssVariables` zostaje w `shared` razem z testami.

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego z `credentials: 'include'` żądanie w ogóle nie dochodzi do skutku?** Przy `include` przeglądarka wymaga od serwera `Access-Control-Allow-Credentials: true`. API go nie wysyła, bo nie używa ciasteczek, więc przeglądarka blokuje odpowiedź już przy preflight. Kod widzi tylko błąd sieci.
2. **Dlaczego `useAuthRequest` przyjmuje funkcję, a nie dane formularza?** Logowanie i rejestracja różnią się tylko wywołaniem klienta. Reszta (ładowanie, błędy, zapis tokenu) jest wspólna, a funkcja pozwala zachować typy każdego wywołania.
3. **Dlaczego wylogowanie łapie wyjątek z `signOut()`?** Bez `catch` brak sieci przerwałby funkcję przed `endSession()`, więc użytkownik zostałby zalogowany wbrew swojej woli. Do tego w konsoli pojawiłby się nieobsłużony wyjątek. Sesja na serwerze i tak wygaśnie po 30 dniach.
4. **Logowanie nie zdradza, czy e-mail ma konto. A rejestracja?** Zdradza: komunikat „Konto z tym adresem e-mail już istnieje” odpowiada na to pytanie. To świadomy kompromis. Bez weryfikacji adresu e-mail (Etap 11) nie da się udawać udanej rejestracji, a limit 3 prób na 10 sekund utrudnia masowe sprawdzanie adresów.

</details>

---

## Zadanie 10: wygasła sesja, kilka kart i brak API

**Cel:** użytkownik rozumie, dlaczego został wylogowany (F-AUTH-05). Wszystkie przypadki brzegowe z [Na co uważać](#na-co-uważać) działają ręcznie.

**Czego się nauczysz:** sterowanie UI przez stan sesji, testowanie przypadków brzegowych ręcznie (baza, wyłączone API, kilka kart).

**Pliki:**

- Zmień: `apps/extension/src/features/auth/AuthScreen.vue`

**Interfejsy:**

- Korzysta z: `session.notice` (zadanie 8), klucza `auth.sessionExpired` (zadanie 7).

**Kroki:**

- [x] **1. Komunikat.** W `AuthScreen.vue`, nad formularzem, pokaż `UAlert` w kolorze `warning` z tekstem `t('auth.sessionExpired')`, gdy `session.notice.value === 'session-expired'`.
- [x] **2. Wygasła sesja.** Zaloguj się, potem usuń sesje w bazie: `docker compose exec db psql -U one one_place -c 'delete from session'`. Przeładuj kartę. **Oczekiwany wynik:** ekran logowania z „Sesja wygasła. Zaloguj się ponownie.”, a token zniknął ze storage (DevTools → Application → Extension storage → Local). Ścieżka: `/api/me` dostaje 401, `createAuthFetch` wywołuje `onUnauthorized`, a ono `endSession('session-expired')`.
- [x] **3. Kilka kart (punkt 5 z [Na co uważać](#na-co-uważać)).** Otwórz dwie nowe karty. Wyloguj się w jednej: druga od razu pokazuje ekran logowania. Zaloguj się w drugiej: pierwsza przełącza się na „Cześć, …!”.
- [x] **4. Brak API (punkt 2).** Uruchom API i rozszerzenie w osobnych terminalach (`pnpm --filter @one-place/api dev` i `pnpm --filter @one-place/extension dev`), bo Ctrl+C w `pnpm dev` zatrzymałoby oba. Zalogowany zatrzymaj samo API i przeładuj kartę: zostajesz zalogowany, plakietka pokazuje `API: unreachable`, a powitanie się nie pojawia. Kliknij „Wyloguj”: ekran logowania, a w konsoli tylko `net::ERR_CONNECTION_REFUSED`, bez `Uncaught` ani `Unhandled error`. Spróbuj się zalogować: „Brak połączenia z serwerem”. Uruchom API z powrotem.
- [x] **5.** `pnpm format && pnpm check`, potem commit: `feat(extension): show expired session notice`.

**Pułapki (sprawdzone na prototypie):**

- **`try`/`finally` bez `catch` przy wylogowaniu.** Lokalna sesja się kończy, ale wyjątek z `signOut()` leci dalej, a Vue wypisuje w konsoli `TypeError: Failed to fetch`. Jeśli widzisz go w kroku 4, porównaj `signOut` z rozwiązaniem zadania 9.
- **Brak sieci to nie 401.** Błąd sieci nie mówi nic o sesji. Gdyby kończył sesję, każde chwilowe zerwanie połączenia wylogowywałoby użytkownika, a w Etapie 2 pulpit ma działać z cache także offline.

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/features/auth/AuthScreen.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { session } from '@/api/session'
import SignInForm from './SignInForm.vue'
import SignUpForm from './SignUpForm.vue'

const { t } = useI18n()
const mode = ref<'sign-in' | 'sign-up'>('sign-in')
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-default p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-center text-xl font-semibold text-highlighted">
          {{ t(mode === 'sign-in' ? 'auth.signIn.title' : 'auth.signUp.title') }}
        </h1>
      </template>
      <UAlert
        v-if="session.notice.value === 'session-expired'"
        class="mb-4"
        color="warning"
        variant="subtle"
        icon="i-lucide-clock-alert"
        :title="t('auth.sessionExpired')"
      />
      <SignInForm v-if="mode === 'sign-in'" @switch="mode = 'sign-up'" />
      <SignUpForm v-else @switch="mode = 'sign-in'" />
    </UCard>
  </main>
</template>
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Skąd druga karta wie o wylogowaniu w pierwszej?** `endSession` usuwa token z `chrome.storage.local`. Przeglądarka wysyła zdarzenie zmiany do wszystkich stron rozszerzenia, a `tokenItem.watch` w każdej karcie ustawia `token` na `null`.
2. **Dlaczego komunikat o wygasłej sesji nie pojawia się w drugiej karcie?** `notice` jest stanem tej karty, która dostała 401. Inne karty widzą tylko zniknięcie tokenu, tak jak przy zwykłym wylogowaniu.
3. **Co się dzieje z sesją na serwerze, gdy wylogowanie nie dotrze do API?** Zostaje w tabeli `session` do wygaśnięcia (30 dni). Token zniknął z rozszerzenia, więc nikt go już nie wyśle.

</details>

---

## Zadanie 11: budżet rozmiaru JS

**Cel:** startowy JS nowej karty mieści się w budżecie 335 kB z [02-specyfikacja.md](02-specyfikacja.md), mimo nowych zależności.

**Czego się nauczysz:** analiza paczki (`rollup-plugin-visualizer`), leniwe ładowanie komponentów (`defineAsyncComponent`) i modułów (`import()`), kompilacja komunikatów i18n podczas builda, tree-shaking i pole `sideEffects`.

**Pliki:**

- Zmień: `apps/extension/src/entrypoints/newtab/App.vue`, `apps/extension/src/features/home/HomeScreen.vue`, `apps/extension/wxt.config.ts`, `apps/extension/package.json`, `packages/shared/package.json`

**Kroki:**

- [x] **1. Pomiar.** `pnpm --filter @one-place/extension build`. **Oczekiwany wynik: jeden chunk `newtab-*.js` o rozmiarze około 483 kB**, czyli o 148 kB ponad budżet (w Etapie 0 było 268 kB).
- [x] **2. Analiza.** Dodaj tymczasowo `pnpm --filter @one-place/extension add -D rollup-plugin-visualizer`, a w `wxt.config.ts` na początku listy `plugins` wpisz `visualizer({ filename: 'stats.html', template: 'treemap' })`. Zbuduj i otwórz `apps/extension/stats.html`. Znajdź największe nowe bloki. W prototypie były to: `zod` (około 78 kB), `vue-i18n` z kompilatorem komunikatów (około 58 kB, w tym `@intlify/message-compiler` 17 kB), klient Better Auth z `@better-fetch/fetch` (około 25 kB) i komponenty formularzy Nuxt UI.
- [x] **3. Pytanie.** Które z tych bloków są potrzebne zalogowanemu użytkownikowi, który otwiera nową kartę? Odpowiedz, zanim przejdziesz dalej.
- [x] **4. Leniwy ekran logowania.** W `App.vue` zamień statyczny import `AuthScreen` na `defineAsyncComponent(() => import('@/features/auth/AuthScreen.vue'))`. W `HomeScreen.vue` usuń import `authClient` z góry pliku i pobieraj go w `signOut` przez `await import('@/api/auth-client')`, wewnątrz `try`.
- [x] **5. Pomiar.** **Oczekiwany wynik: `newtab-*.js` około 347 kB, a obok nowe chunki `AuthScreen-*.js` (około 111 kB) i `auth-client-*.js` (około 30 kB).** Nadal ponad budżet.
- [x] **6. Kompilacja komunikatów.** `pnpm --filter @one-place/extension add -D @intlify/unplugin-vue-i18n@^11`. W `wxt.config.ts` dodaj `VueI18nPlugin({ include: [ścieżka do src/i18n/*.json], dropMessageCompiler: true })` przed `ui()`.
- [x] **7. Pomiar.** **Oczekiwany wynik: `newtab-*.js` około 326 kB, poniżej budżetu 335 kB.** Zanotuj swoje liczby, przydadzą się w zadaniu 12.
- [x] **8. Eksperyment: pułapka na kolejne etapy.** W `HomeScreen.vue` zaimportuj tymczasowo `ACCENT_COLORS` z `@one-place/shared` i wypisz je przez `console.log`. Zbuduj. **Oczekiwany wynik: `newtab-*.js` około 405 kB.** Zod wrócił do głównego chunka, choć `ACCENT_COLORS` z nim nie ma nic wspólnego. Zastanów się dlaczego, zanim otworzysz wyjaśnienie poniżej.
- [x] **9. Poprawka.** W `packages/shared/package.json` dodaj `"sideEffects": false`. Zbuduj: z tym samym importem znowu około 326 kB. Usuń tymczasowy import z `HomeScreen.vue`.
- [x] **10. Sprzątanie.** Usuń `visualizer` z konfiguracji, odinstaluj `rollup-plugin-visualizer` i skasuj `stats.html`.
- [x] **11. Sprawdzenie ręczne.** W `pnpm dev` i w zbudowanej paczce (załaduj `.output/chrome-mv3` jako rozpakowane rozszerzenie) teksty są przetłumaczone, a nie widać kluczy. Po wylogowaniu ekran logowania pojawia się bez widocznego opóźnienia.
- [x] **12.** `pnpm format && pnpm check`, potem commit: `perf(extension): lazy-load auth screens and precompile messages`.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 8)</summary>

- `@one-place/shared` ma jeden punkt wejścia, `index.ts`, który eksportuje i `theme.ts`, i `auth.ts`. Import `ACCENT_COLORS` wczytuje więc także `auth.ts`.
- W `auth.ts` schematy powstają na najwyższym poziomie modułu, przez wywołania funkcji (`z.object(…)`, `z.string()…`). Bundler nie wie, czy takie wywołanie czegoś nie zmienia poza modułem (efekt uboczny), więc na wszelki wypadek zostawia cały moduł razem z Zod, nawet gdy nikt nie używa schematów.
- `"sideEffects": false` to obietnica autora pakietu: „moje moduły nie mają efektów ubocznych”. Bundler może wtedy pominąć każdy moduł, z którego nic nie zostało użyte.
- Bez tej poprawki budżet pękłby w Etapie 5, przy pierwszym imporcie funkcji motywu z `shared`.

</details>

**Pułapki (sprawdzone na prototypie):**

- **`dropMessageCompiler: true` usuwa kompilator z paczki.** Działają tylko komunikaty skompilowane podczas builda, czyli pliki z `include`. Komunikat dodany w kodzie jako tekst (np. w `createI18n({ messages: … })` albo przez `mergeLocaleMessage`) przestałby działać.
- **`include` musi być ścieżką bezwzględną.** Najprościej przez `fileURLToPath(new URL('./src/i18n/*.json', import.meta.url))`.
- **`"sideEffects": false` to obietnica, której trzeba dotrzymać.** Gdyby moduł w `shared` kiedyś faktycznie coś robił przy imporcie (np. rejestrował coś globalnie), bundler mógłby go pominąć. Pakiet `shared` ma zawierać tylko stałe, schematy i czyste funkcje.

<details>
<summary>Podpowiedź</summary>

- Zalogowany użytkownik nie widzi formularzy, więc nie potrzebuje Zod, formularzy ani klienta Better Auth, dopóki się nie wyloguje.
- `defineAsyncComponent` z dynamicznym `import()` sprawia, że Vite tworzy osobny chunk, który przeglądarka pobiera dopiero przy pierwszym renderze komponentu.
- Plik z rozszerzenia ładuje się z dysku, a nie z sieci, więc leniwy chunk ładuje się praktycznie od razu.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/entrypoints/newtab/App.vue`

```vue
<script setup lang="ts">
import { computed, defineAsyncComponent, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { en, pl } from '@nuxt/ui/locale'
import { session } from '@/api/session'
import HomeScreen from '@/features/home/HomeScreen.vue'

// Sign-in screens (forms, Zod, auth client) are loaded only when needed,
// so a signed-in user's new tab does not download them
const AuthScreen = defineAsyncComponent(() => import('@/features/auth/AuthScreen.vue'))

const { locale, t } = useI18n()
const uiLocale = computed(() => (locale.value === 'pl' ? pl : en))

watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = t('app.title')
})
</script>

<template>
  <UApp :locale="uiLocale">
    <HomeScreen v-if="session.token.value" />
    <AuthScreen v-else />
  </UApp>
</template>
```

`apps/extension/src/features/home/HomeScreen.vue`: bez importu `authClient` na górze, a `signOut` wygląda tak:

```ts
async function signOut() {
  try {
    const { authClient } = await import('@/api/auth-client')
    await authClient.signOut()
  } catch {
    // API unreachable: the server session will expire on its own
  }
  // F-AUTH-04: the local session always ends
  await endSession()
}
```

`apps/extension/wxt.config.ts`

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  dev: {
    server: {
      port: 3001,
    },
  },
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [
      // Compiles pl.json and en.json at build time, so the runtime message compiler is not needed
      VueI18nPlugin({
        include: [fileURLToPath(new URL('./src/i18n/*.json', import.meta.url))],
        dropMessageCompiler: true,
      }),
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
    key: '<klucz bez zmian>',
  },
})
```

`packages/shared/package.json` (nowe pole, reszta bez zmian)

```json
{
  "name": "@one-place/shared",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": "./src/index.ts"
  }
}
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego budżet dotyczy startowego chunka, a nie całej paczki?** Wymaganie wydajności mówi o pierwszym renderze pulpitu. Liczy się to, co przeglądarka musi pobrać i wykonać przed tym renderem. Chunki ładowane później go nie spowalniają.
2. **Czy leniwy ekran logowania spowalnia logowanie?** Praktycznie nie: chunk ładuje się z dysku rozszerzenia, raz, i tylko wtedy, gdy ktoś jest wylogowany. Zalogowany użytkownik, czyli prawie każde otwarcie karty, w ogóle go nie pobiera.
3. **Skąd wiadomo, co wyrzucić z głównego chunka?** Z pomiaru, a nie z intuicji. Analiza pokazała, które pakiety są duże, a pytanie „kto ich potrzebuje przy starcie” wskazało, które można odłożyć.

</details>

---

## Zadanie 12: domknięcie Etapu 1

**Cel:** spełniona definicja ukończenia Etapu 1, zapisany wynik R5 i dokumentacja zgodna z kodem.

**Kroki:**

- [x] **1. Wynik R5.** W [03-architektura.md](03-architektura.md), w tabeli ryzyk, oznacz R5 jako zamknięte w Etapie 1 i krótko opisz rozwiązanie: origin rozszerzenia w `trustedOrigins` (rejestracja i logowanie zawsze sprawdzają `Origin`), CORS z `allowHeaders` i `exposeHeaders: ['set-auth-token']`, klient z `credentials: 'omit'`, `bearer({ requireSignature: true })`.
- [x] **2. Architektura.** W [03-architektura.md](03-architektura.md):
  - w tabeli API dopisz `GET /me` → `{ id, name, email }` (chroniony);
  - w sekcji „Better Auth” dopisz `rateLimit: { enabled: true }`, `advanced: { disableOriginCheck: false }`, `telemetry: { enabled: false }`, `requireSignature` i to, że schemat generuje CLI `auth` (`pnpm db:auth-schema`);
  - w sekcji „Middleware” zaznacz, że `requireAuth` jest dołączany do tras i routerów modułów, a nie globalnie;
  - w „Start nowej karty” dopisz, że ekran logowania jest ładowany leniwie, i podaj zmierzony rozmiar startowego JS z zadania 11.
- [x] **3. README.** W „Uruchomienie lokalne” dopisz wygenerowanie sekretu (`openssl rand -base64 32` do `BETTER_AUTH_SECRET` w `apps/api/.env`) oraz `pnpm --filter @one-place/api db:migrate` po `docker compose up -d`.
- [x] **4. Roadmapa.** Przy Etapie 1 w [04-roadmapa.md](04-roadmapa.md) jest już odnośnik do tego planu. Sprawdź, czy zakres się zgadza z tym, co powstało.
- [x] **5. Definicja ukończenia** z [roadmapy](04-roadmapa.md#etap-1-logowanie):
  - [x] da się założyć konto;
  - [x] da się zalogować;
  - [x] przeładowanie karty nie wylogowuje;
  - [x] da się wylogować;
  - [x] testy API pokrywają 401 dla chronionego endpointu (`me.test.ts`);
  - [x] R5 ma zapisany wynik.
- [x] **6.** `pnpm check` (oczekiwany wynik: 8 + 27 + 16 = **51 testów**), potem commit: `docs: add stage 1 results and R5 outcome`.

---

## Materiały

| Temat                                  | Gdzie czytać                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| Better Auth: instalacja i opcje        | https://www.better-auth.com/docs/installation                                |
| Better Auth z Hono                     | https://www.better-auth.com/docs/integrations/hono                           |
| Better Auth: plugin `bearer`           | https://www.better-auth.com/docs/plugins/bearer                              |
| Better Auth: rate limiting             | https://www.better-auth.com/docs/concepts/rate-limit                         |
| Better Auth: baza i `databaseHooks`    | https://www.better-auth.com/docs/concepts/database                           |
| Better Auth: bezpieczeństwo (origin)   | https://www.better-auth.com/docs/reference/security                          |
| Better Auth: CLI                       | https://www.better-auth.com/docs/concepts/cli                                |
| drizzle-kit: migracje i konfiguracja   | https://orm.drizzle.team/docs/migrations                                     |
| Hono: `requestId`                      | https://hono.dev/docs/middleware/builtin/request-id                          |
| Hono: `createMiddleware`               | https://hono.dev/docs/helpers/factory                                        |
| Hono: `onError` i `notFound`           | https://hono.dev/docs/api/hono                                               |
| pino                                   | https://getpino.io/                                                          |
| vue-i18n: Composition API              | https://vue-i18n.intlify.dev/guide/advanced/composition                      |
| `@intlify/unplugin-vue-i18n`           | https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n |
| WXT: testy jednostkowe i `fakeBrowser` | https://wxt.dev/guide/essentials/unit-testing                                |
| WXT: storage                           | https://wxt.dev/storage                                                      |
| Nuxt UI: Form                          | https://ui.nuxt.com/docs/components/form                                     |
| Vue: komponenty asynchroniczne         | https://vuejs.org/guide/components/async                                     |
| `fetch`: tryb `credentials`            | https://developer.mozilla.org/docs/Web/API/Request/credentials               |
| `rollup-plugin-visualizer`             | https://github.com/btd/rollup-plugin-visualizer                              |

## Co dalej

Po Etapie 1 kolejnym krokiem jest [Etap 2: Konteksty i warstwa danych](04-roadmapa.md#etap-2-konteksty-i-warstwa-danych): pierwsze tabele z danymi użytkownika, moduły API z `requireAuth`, TanStack Query z cache w `chrome.storage.local` i mutacje optymistyczne. Przygotuję dla niego podobny plan nauki, gdy będziesz gotowy.
