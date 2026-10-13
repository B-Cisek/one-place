x# 07. Etap 2: Konteksty i warstwa danych (plan nauki)

Ten plik prowadzi przez [Etap 2 z roadmapy](04-roadmapa.md#etap-2-konteksty-i-warstwa-danych). Format jest taki sam jak w [planie Etapu 1](06-etap-1-logowanie.md): każde zadanie mówi, **co** zrobić, **dlaczego** i **jak sprawdzić**, że działa. Gotowy kod jest schowany w zwijanych blokach „Rozwiązanie”.

**Cel:** użytkownik tworzy konteksty, przełącza się między nimi, zmienia ich nazwę, ikonę i kolejność oraz je usuwa. Wszystkie zmiany są widoczne od razu, a odrzucona przez API zmiana jest cofana z komunikatem. Po przeładowaniu karty pulpit pojawia się z cache bez szkieletów, a bez sieci widać zapisane dane i baner offline. Język interfejsu można zapisać na koncie.

**Architektura:** API dostaje dwa moduły, `settings` i `contexts`. Każdy składa się z tras Hono (walidacja przez `@hono/zod-validator`) i serwisu z zapytaniami Drizzle, które zawsze filtrują po `user_id`. Rozszerzenie pobiera dane przez TanStack Query. Cache zapytań jest zapisywany w `chrome.storage.local` i odtwarzany **przed** zamontowaniem aplikacji, więc pierwszy render ma już dane. Zmiany są optymistyczne: mutacja najpierw zmienia cache, a gdy API ją odrzuci, przywraca poprzedni stan i pokazuje toast. ID nowych rekordów generuje rozszerzenie (UUIDv7), a kolejność kontekstów zapisuje indeks ułamkowy (`fractional-indexing`). Aktywny kontekst jest pamiętany na urządzeniu w store Pinia.

**Specyfikacja:** F-CTX-01 … F-CTX-08, F-SYNC-01 … F-SYNC-07 i F-I18N-01 … F-I18N-03 w [02-specyfikacja.md](02-specyfikacja.md#konteksty-ctx) oraz sekcje „Model danych”, „API” i „Warstwa danych” w [03-architektura.md](03-architektura.md).

> Rozwiązania sprawdziłem na prototypie 12–13.10.2026 (macOS, Node 24.7, pnpm 10.24, Postgres 18 w Dockerze, Chrome for Testing 156): 116 testów, lint, typecheck i build. W przeglądarce z załadowanym rozszerzeniem sprawdziłem pierwszy kontekst, przełączanie, zmianę nazwy i ikony, przeciąganie, usuwanie, limit 20 kontekstów, przeładowanie z cache, kartę otwartą offline, zmianę zrobioną offline, wyłączone API, odświeżenie po powrocie do karty, język zapisany na koncie i wylogowanie. Scenariusze sprawdziłem w zbudowanej paczce i w `pnpm dev`. Wyjątkiem jest karta otwarta offline, którą sprawdziłem tylko w paczce (powód w zadaniu 14).

## Jak korzystać z planu

Tak samo jak w Etapach 0 i 1:

1. Przeczytaj całe zadanie przed rozpoczęciem.
2. Odhaczaj kroki (`- [ ]` na `- [x]`).
3. W krokach z testem **najpierw zobacz czerwony test**, dopiero potem pisz implementację.
4. Gdy utkniesz na ponad 15 minut, otwórz „Podpowiedź”, a potem „Rozwiązanie”.
5. Każde zadanie kończy się zielonym `pnpm check` i commitem.
6. Na końcu zadania odpowiedz na pytania kontrolne.

Kroki oznaczone jako **eksperyment** celowo pokazują błąd, zanim go naprawisz. W tym etapie jest ich więcej niż wcześniej, bo większość pułapek warstwy danych nie daje żadnego komunikatu: aplikacja po prostu po cichu gubi dane albo wysyła żądania tam, gdzie nie powinna.

## Wymagania wstępne

- [ ] Etap 1 jest skończony, a `pnpm check` przechodzi (51 testów)
- [ ] Postgres działa: `docker compose up -d`
- [ ] Migracja z Etapu 1 jest zastosowana: `pnpm --filter @one-place/api db:migrate`
- [ ] `pnpm dev` uruchamia API i przeglądarkę z rozszerzeniem, a logowanie działa

## Ograniczenia globalne

Obowiązują [ograniczenia z Etapu 0](05-implementacja-poczatkowa.md#ograniczenia-globalne) i [z Etapu 1](06-etap-1-logowanie.md#ograniczenia-globalne) oraz:

| Pakiet                                    | Wersja | Gdzie              | Uwagi                                                       |
| ----------------------------------------- | ------ | ------------------ | ----------------------------------------------------------- |
| `@hono/zod-validator`                     | `^0.9` | API                | walidacja wejścia tras, opakowana we własny `validate()`    |
| `@tanstack/vue-query`                     | `^5`   | rozszerzenie       | zapytania, cache, mutacje                                   |
| `@tanstack/query-persist-client-core`     | `^5`   | rozszerzenie       | `persistQueryClientRestore` i `persistQueryClientSubscribe` |
| `@tanstack/query-async-storage-persister` | `^5`   | rozszerzenie       | zapis cache z throttlingiem                                 |
| `pinia`                                   | `^4`   | rozszerzenie       | store stanu UI                                              |
| `@vue/devtools-api`                       | `^8`   | rozszerzenie (dev) | wymagany przez Pinia 4 (peer), patrz zadanie 10             |
| `uuid`                                    | `^14`  | rozszerzenie       | `v7()` dla ID tworzonych w rozszerzeniu                     |
| `fractional-indexing`                     | `^4`   | rozszerzenie       | `generateKeyBetween()` dla kolejności                       |
| `vue-draggable-plus`                      | `^0.6` | rozszerzenie       | przeciąganie na liście kontekstów, ładowane leniwie         |

- Komponenty i widgety nigdy nie wołają API bezpośrednio. Robią to tylko composables z `src/queries/` ([03-architektura.md](03-architektura.md#warstwa-danych)).
- Każde zapytanie do bazy w serwisach API jest ograniczone do właściciela. Cudzy zasób daje 404, tak samo jak nieistniejący.
- Teksty w UI tylko przez i18n. Nazwy w kodzie, opisy testów, komunikaty błędów API, logi i commity po angielsku.

## Decyzje dla tego etapu

Ustalone przed napisaniem planu. Zadanie 16 przenosi je do dokumentacji.

1. **Budżet startowego JS dostaje nową wartość z pomiaru.** Sam TanStack Query z persisterem dokłada około 40 kB, a stary budżet (335 kB) miał tylko 9 kB zapasu. Właściwym wymaganiem jest pierwszy render z cache poniżej 200 ms, więc mierzymy też jego czas. Wszystko, czego nie widać przy starcie, ładuje się leniwie. Zadanie 15.
2. **Stan UI trzyma Pinia**, zgodnie z architekturą.
3. **Kolumny motywu dochodzą dopiero w Etapie 5.** Tabela `user_settings` ma teraz tylko `locale`. Kolumny `user_settings.theme` i `contexts.theme_override` dojdą z nową migracją i zmianą `CACHE_SCHEMA_VERSION`, więc F-SYNC-07 przećwiczysz w praktyce.
4. **Modal usuwania kontekstu nie pokazuje jeszcze liczby widgetów** (F-CTX-07), bo widgety powstaną w Etapie 3. Wtedy dojdzie licznik.
5. **Persister zapisuje tylko zapytania, bez mutacji.** Zmiana zrobiona offline czeka na sieć, dopóki karta jest otwarta, a po jej zamknięciu przepada (znane ograniczenie MVP, ryzyko R7).
6. **Wylogowanie czyści wszystko lokalne:** cache w pamięci, cache w storage i `activeContextId`. Dotyczy to też odpowiedzi 401 i wylogowania w innej karcie.
7. **Aktywny kontekst jest pamiętany per urządzenie, bez synchronizacji na żywo między otwartymi kartami.** Przełączenie w jednej karcie nie przestawia drugiej, ale nowa karta otworzy się z ostatnim wyborem.
8. **Przełącznik kontekstów to zakładki (`UTabs`), a nie menu rozwijane.** `UDropdownMenu` dokłada do startowego JS około 100 kB. Zmierzysz to w zadaniu 15.

## Na co uważać

Siedem sytuacji, które łatwo przeoczyć, bo nie dają błędu w konsoli, tylko po cichu psują dane albo wrażenie z używania:

1. **Kontekst przeciągnięty na początek listy.** Nowa pozycja to np. `Zz`. Bez kolumny z kolacją `C` Postgres z Dockera (domyślnie `en_US.utf8`) stawia `Zz` za `a0`, a PGlite (zawsze `C`) przed nim. Testy na PGlite tego nie wykryją. Zadanie 2.
2. **Ponowione żądanie.** `POST` powtórzony po zerwanym połączeniu nie tworzy duplikatu, a przy limicie 20 kontekstów zwraca istniejący rekord, a nie 422. Zadanie 5.
3. **Cudze i zepsute ID.** Cudzy kontekst daje 404, a ID, które nie jest UUID, daje 400, a nie 500. Zadania 3 i 6.
4. **Wylogowanie i drugi użytkownik.** Po wylogowaniu w jednej karcie cache znika we wszystkich kartach i nie wraca przy następnym zapisie. Kolejna osoba na tym samym urządzeniu nie zobaczy cudzych kontekstów. Zadanie 8.
5. **API wyłączone, sieć działa.** Nieudane odświeżenia nie mogą usunąć danych z zapisanego cache. Inaczej kolejna karta otworzy się bez danych. Zadania 8 i 14.
6. **Karta otwarta bez sieci.** Pokazuje dane z cache i baner offline, a zmiana zrobiona offline czeka na sieć, zamiast od razu się cofać. Zadanie 14.
7. **Ikony z danych.** Ikona kontekstu pochodzi z bazy, a nie z szablonu, więc skaner Nuxt UI jej nie widzi i przeglądarka pobiera ją z `api.iconify.design`. To łamie wymaganie prywatności. Zadanie 11.

## Struktura po Etapie 2

Nowe i zmienione pliki:

```
one-place/
├─ package.json                                  + skrypt size
├─ scripts/startup-js-size.mjs
├─ packages/shared/src/  contexts.ts  settings.ts  index.ts  (+ testy)
├─ apps/api/
│  ├─ src/
│  │  ├─ app.ts
│  │  ├─ db/schema/  columns.ts  contexts.ts  settings.ts  index.ts
│  │  ├─ db/migrations/0001_contexts_and_settings.sql
│  │  ├─ lib/  errors.ts  validate.ts
│  │  └─ modules/  deps.ts  settings/  contexts/   (routes.ts, service.ts)
│  └─ test/  auth-helpers.ts  fixtures.ts
│            migrations  validate  settings  contexts  (.test.ts)
└─ apps/extension/
   ├─ wxt.config.ts  package.json
   └─ src/
      ├─ entrypoints/newtab/  main.ts  App.vue
      ├─ api/  api-error.ts  (+ test)
      ├─ queries/  query-client.ts  cache.ts  optimistic.ts  testing.ts  use-online.ts
      │            me.ts  contexts.ts  settings.ts  (+ testy)
      ├─ stores/  ui.ts  (+ test)
      ├─ features/auth/sign-out.ts
      ├─ features/contexts/  ContextSwitcher.vue  ContextForm.vue  IconPicker.vue
      │                      FirstContext.vue  ManageContextsModal.vue  ManageContexts.vue
      │                      ContextRow.vue  active-context.ts  positions.ts
      │                      use-add-context.ts  (+ testy)
      ├─ features/dashboard/  DashboardScreen.vue  AppHeader.vue
      ├─ features/errors/  mutation-error.ts  use-mutation-error-toasts.ts  (+ test)
      ├─ features/settings/  SettingsSlideover.vue  use-account-locale.ts
      └─ i18n/  locale.ts  pl.json  en.json  (+ test)
```

Usunięte: `features/home/HomeScreen.vue` i `api/use-api-health.ts`. Pulpit zastępuje ekran powitalny z Etapu 1, a baner offline zastępuje plakietkę stanu API.

---

## Zadanie 1: schematy kontekstów i ustawień w `shared` (TDD)

**Cel:** jedno źródło reguł dla formularzy i API. Nazwa kontekstu ma 1–40 znaków po przycięciu, ikona pochodzi ze stałej listy, ID jest UUID, a pozycja jest kluczem indeksu ułamkowego. Język konta to `pl`, `en` albo `null` (F-CTX-02, F-I18N-03).

**Czego się nauczysz:** `z.enum()` na liście `as const`, `z.uuid()`, `.omit()`, `.pick()` i `.partial()` do budowania schematów z jednego wzorca, różnica między `.nullable()` a `.optional()`.

**Pliki:**

- Utwórz: `packages/shared/src/contexts.ts`, `packages/shared/src/settings.ts`
- Zmień: `packages/shared/src/index.ts`, `apps/extension/src/i18n/locale.ts`, `apps/extension/src/i18n/index.ts`
- Test: `packages/shared/src/contexts.test.ts`, `packages/shared/src/settings.test.ts`

**Interfejsy:**

- Wytwarza: stałe `CONTEXT_NAME_MAX_LENGTH`, `MAX_CONTEXTS`, `CONTEXT_ICONS` i `LOCALES`; typy `ContextIcon` i `Locale`; schematy `PositionSchema`, `ContextNameSchema`, `CreateContextSchema` (`{ id, name, icon, position }`), `UpdateContextSchema` (te same pola bez `id`, wszystkie opcjonalne), `ContextFormSchema` (`{ name, icon }`) i `UpdateSettingsSchema` (`{ locale? }`); typy wejścia `CreateContextInput`, `UpdateContextInput`, `ContextFormInput` i `UpdateSettingsInput`; typy wyjścia `ContextDto` i `SettingsDto`. Używają ich prawie wszystkie kolejne zadania.

**Kroki:**

- [x] **1. Czerwone testy kontekstów** w `src/contexts.test.ts` (dla `CreateContextSchema`, chyba że napisano inaczej):
  - poprawne dane przechodzą, a nazwa `'  Praca  '` po parsowaniu to `'Praca'`;
  - nazwa z samych spacji daje `validation.contextNameRequired`, 40 znaków przechodzi, a 41 daje `validation.contextNameTooLong`;
  - ikona spoza `CONTEXT_ICONS` (np. `'i-lucide-skull'`) nie przechodzi;
  - `id` równe `'42'` nie przechodzi;
  - pozycje `'a0'`, `'Zz'` i `'a0V'` przechodzą, a `''`, `'a 0'` i `'a-0'` nie;
  - `UpdateContextSchema.parse({ name: ' Dom ' })` daje `{ name: 'Dom' }`, a sama ikona `'i-lucide-skull'` nie przechodzi.
- [x] **2. Uruchom.** `pnpm --filter @one-place/shared test`. Oczekiwany wynik: **FAIL**, bo moduł `./contexts` nie istnieje.
- [x] **3. Implementacja** `src/contexts.ts`. Listę ikon skopiuj z [03-architektura.md](03-architektura.md#pakiet-shared). `ContextDto` to zwykły interfejs TypeScript, a nie schemat.
- [x] **4. Czerwony test ustawień** w `src/settings.test.ts`: `{ locale: 'pl' }` i `{ locale: null }` przechodzą bez zmian, a `{ locale: 'de' }` nie.
- [x] **5. Implementacja** `src/settings.ts`. Przenieś tu `LOCALES` i `Locale` z `apps/extension/src/i18n/locale.ts`, bo od teraz język sprawdza też API. W rozszerzeniu importuj je z `@one-place/shared`. W `src/index.ts` dopisz eksporty obu nowych modułów.
- [x] **6. Zielone testy.** Oczekiwany wynik: **PASS (16 testów w `shared`)**.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(shared): add context and settings schemas`.

<details>
<summary>Podpowiedź</summary>

- `z.enum(CONTEXT_ICONS)` przyjmuje tablicę `as const` i daje unię literałów. Typ ikony to `(typeof CONTEXT_ICONS)[number]`.
- `CreateContextSchema.omit({ id: true }).partial()` daje schemat zmian: te same reguły, ale każde pole może nie wystąpić. `.pick({ name: true, icon: true })` daje to, co wypełnia użytkownik.
- Pozycja ze znakami `0-9A-Za-z` to `.regex(/^[0-9A-Za-z]+$/)`. Dodaj `.max(100)`, żeby nikt nie przysłał megabajtowego „klucza”.
- `z.enum(LOCALES).nullable()` przyjmuje `null`, a `.partial()` na obiekcie pozwala pominąć pole. To dwa różne znaczenia: `null` to „ustaw język przeglądarki”, brak pola to „nie zmieniaj”.

</details>

<details>
<summary>Rozwiązanie</summary>

`packages/shared/src/contexts.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { CreateContextSchema, UpdateContextSchema } from './contexts'

const validContext = {
  id: '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b10',
  name: 'Praca',
  icon: 'i-lucide-briefcase',
  position: 'a0',
}

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('CreateContextSchema', () => {
  it('accepts valid input and trims the name', () => {
    const result = CreateContextSchema.safeParse({ ...validContext, name: '  Praca  ' })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Praca')
  })

  it('requires a name of 1 to 40 characters after trimming', () => {
    expect(firstMessage(CreateContextSchema.safeParse({ ...validContext, name: '   ' }))).toBe(
      'validation.contextNameRequired',
    )
    expect(CreateContextSchema.safeParse({ ...validContext, name: 'a'.repeat(40) }).success).toBe(
      true,
    )
    expect(
      firstMessage(CreateContextSchema.safeParse({ ...validContext, name: 'a'.repeat(41) })),
    ).toBe('validation.contextNameTooLong')
  })

  it('accepts only icons from CONTEXT_ICONS', () => {
    expect(CreateContextSchema.safeParse({ ...validContext, icon: 'i-lucide-skull' }).success).toBe(
      false,
    )
  })

  it('requires a UUID as the id', () => {
    expect(CreateContextSchema.safeParse({ ...validContext, id: '42' }).success).toBe(false)
  })

  it('accepts fractional index keys as the position', () => {
    for (const position of ['a0', 'Zz', 'a0V']) {
      expect(CreateContextSchema.safeParse({ ...validContext, position }).success).toBe(true)
    }
    for (const position of ['', 'a 0', 'a-0']) {
      expect(CreateContextSchema.safeParse({ ...validContext, position }).success).toBe(false)
    }
  })
})

describe('UpdateContextSchema', () => {
  it('accepts a single field and validates it', () => {
    expect(UpdateContextSchema.parse({ name: ' Dom ' })).toEqual({ name: 'Dom' })
    expect(UpdateContextSchema.safeParse({ icon: 'i-lucide-skull' }).success).toBe(false)
  })
})
```

`packages/shared/src/contexts.ts`

```ts
import { z } from 'zod'

export const CONTEXT_NAME_MAX_LENGTH = 40
export const MAX_CONTEXTS = 20

// A fixed list, because every icon has to be in the bundle (no requests to the Iconify API)
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
] as const

export type ContextIcon = (typeof CONTEXT_ICONS)[number]

// Keys from `fractional-indexing` use only digits and letters, and are compared byte by byte
export const PositionSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[0-9A-Za-z]+$/)

export const ContextNameSchema = z
  .string()
  .trim()
  .min(1, 'validation.contextNameRequired')
  .max(CONTEXT_NAME_MAX_LENGTH, 'validation.contextNameTooLong')

export const CreateContextSchema = z.object({
  id: z.uuid(),
  name: ContextNameSchema,
  icon: z.enum(CONTEXT_ICONS),
  position: PositionSchema,
})

export const UpdateContextSchema = CreateContextSchema.omit({ id: true }).partial()

// What the user fills in. The id and the position come from the extension.
export const ContextFormSchema = CreateContextSchema.pick({ name: true, icon: true })

export type CreateContextInput = z.infer<typeof CreateContextSchema>
export type UpdateContextInput = z.infer<typeof UpdateContextSchema>
export type ContextFormInput = z.infer<typeof ContextFormSchema>

export interface ContextDto {
  id: string
  name: string
  icon: ContextIcon
  position: string
  createdAt: string
  updatedAt: string
  version: number
}
```

`packages/shared/src/settings.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { UpdateSettingsSchema } from './settings'

describe('UpdateSettingsSchema', () => {
  it('accepts a supported locale or null for the browser language', () => {
    expect(UpdateSettingsSchema.parse({ locale: 'pl' })).toEqual({ locale: 'pl' })
    expect(UpdateSettingsSchema.parse({ locale: null })).toEqual({ locale: null })
  })

  it('rejects an unsupported locale', () => {
    expect(UpdateSettingsSchema.safeParse({ locale: 'de' }).success).toBe(false)
  })
})
```

`packages/shared/src/settings.ts`

```ts
import { z } from 'zod'

export const LOCALES = ['pl', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const UpdateSettingsSchema = z
  .object({
    // null means "follow the browser language" (F-I18N-02)
    locale: z.enum(LOCALES).nullable(),
  })
  .partial()

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>

export interface SettingsDto {
  locale: Locale | null
  // null and 0 until the user saves settings for the first time
  updatedAt: string | null
  version: number
}
```

`packages/shared/src/index.ts`

```ts
export * from './auth'
export * from './contexts'
export * from './settings'
export * from './theme'
```

`apps/extension/src/i18n/locale.ts`

```ts
import type { Locale } from '@one-place/shared'

// F-I18N-02: before sign-in the language comes from the browser, `pl*` means Polish
export function detectLocale(browserLanguage: string): Locale {
  return browserLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}
```

`apps/extension/src/i18n/index.ts` (zmieniony import)

```ts
import { createI18n } from 'vue-i18n'
import en from './en.json'
import type { Locale } from '@one-place/shared'
import { detectLocale } from './locale'
import pl from './pl.json'
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego pozycja to tekst, a nie liczba całkowita?** Przy liczbach przesunięcie jednego elementu wymaga przenumerowania wszystkich za nim, czyli wielu zapisów naraz. Klucz ułamkowy zawsze da się wstawić między dwa sąsiednie (`a0` < `a0V` < `a1`), więc przesunięcie to jeden `PATCH` jednego rekordu.
2. **Czym różni się `{ locale: null }` od `{}` w `PATCH /settings`?** `null` zapisuje „używaj języka przeglądarki”, a pusty obiekt niczego nie zmienia. Dlatego `locale` jest `.nullable()`, a cały obiekt `.partial()`.
3. **Dlaczego `ContextDto` jest interfejsem, a nie schematem Zod?** To kształt odpowiedzi, której nikt nie waliduje: API ją buduje, a rozszerzenie jej ufa. Schemat byłby potrzebny dopiero wtedy, gdyby rozszerzenie miało sprawdzać dane z serwera.

</details>

---

## Zadanie 2: tabele `contexts` i `user_settings`, druga migracja

**Cel:** w bazie są tabele na dane użytkownika z modelu w [03-architektura.md](03-architektura.md#model-danych), a kolumna `position` porównuje klucze bajtowo, także w Postgresie z kolacją `en_US.utf8`.

**Czego się nauczysz:** kolejne migracje drizzle-kit, `customType` na typ kolumny, którego Drizzle nie obsługuje, `timestamp` z `withTimezone`, kolacje w Postgresie i to, dlaczego test na PGlite może nie wykryć błędu z produkcji.

**Pliki:**

- Utwórz: `apps/api/src/db/schema/columns.ts`, `apps/api/src/db/schema/contexts.ts`, `apps/api/src/db/schema/settings.ts`
- Zmień: `apps/api/src/db/schema/index.ts`, `apps/api/test/migrations.test.ts`
- Wygeneruj: `apps/api/src/db/migrations/0001_contexts_and_settings.sql`

**Interfejsy:**

- Korzysta z: `ContextIcon` i `Locale` (zadanie 1), tabeli `user` (Etap 1).
- Wytwarza: tabele Drizzle `contexts` i `userSettings`, pomocnicze `fractionalIndex` i `timestamps`. Używają ich zadania 4–6.

**Kroki:**

- [x] **1. Eksperyment: kolacja w Postgresie.** Uruchom w bazie z Dockera dwa zapytania:

  ```bash
  docker compose exec db psql -U one one_place -c "select p from unnest(array['a0','Zz','a1','a0V']) p order by p"
  docker compose exec db psql -U one one_place -c "select p from unnest(array['a0','Zz','a1','a0V']) p order by p collate \"C\""
  ```

  **Oczekiwany wynik:** pierwsze daje `a0, a0V, a1, Zz`, a drugie `Zz, a0, a0V, a1`. `fractional-indexing` dla „przed `a0`” zwraca `Zz`, więc bez kolacji `C` kontekst przeciągnięty na początek trafiłby na koniec. PGlite ma domyślnie kolację `C`, więc test sortowania na PGlite przeszedłby mimo błędu. Dlatego test w kroku 2 sprawdza kolację kolumny, a nie wynik sortowania.

- [x] **2. Czerwone testy** w `test/migrations.test.ts`:
  - lista tabel to `['account', 'contexts', 'session', 'user', 'user_settings', 'verification']` (zmień istniejący test);
  - `collation_name` kolumny `contexts.position` w `information_schema.columns` to `'C'`.

  Oczekiwany wynik: **FAIL** obu testów.

- [x] **3. Schemat.** `columns.ts`: `timestamps` (`created_at`, `updated_at` jako `timestamptz` z `defaultNow()`, `version` z domyślną wartością 1) oraz `fractionalIndex`. `contexts.ts` i `settings.ts` według tabel z architektury, bez kolumn motywu (decyzja 3). W `schema/index.ts` dopisz eksporty.
- [x] **4. Migracja.** `pnpm --filter @one-place/api db:generate --name contexts_and_settings`. Przeczytaj `0001_contexts_and_settings.sql` i znajdź `"position" text COLLATE "C" NOT NULL`. Uruchom `db:generate` drugi raz: ma odpowiedzieć „No schema changes, nothing to migrate”.
- [x] **5. Zielone testy.** Oczekiwany wynik: **PASS (28 testów w pakiecie API)**.
- [x] **6. Sprawdź, czy test pilnuje kolacji.** Usuń na chwilę `COLLATE "C"` z pliku SQL i uruchom testy: `expected [ { collation_name: null } ] to deeply equal [ { collation_name: 'C' } ]`. Przywróć plik.
- [x] **7. Migracja w Dockerze.** `pnpm --filter @one-place/api db:migrate`, potem `docker compose exec db psql -U one one_place -c '\d contexts'`. W kolumnie „Collation” przy `position` jest `C`.
- [x] **8.** `pnpm format && pnpm check`, potem commit: `feat(api): add contexts and user settings tables`.

**Pułapki (sprawdzone na prototypie):**

- **Drizzle 0.45 nie ma opcji kolacji kolumny.** Nie ma jej ani `text()`, ani drizzle-kit. Działa `customType` z `dataType: () => 'text COLLATE "C"'`: drizzle-kit wpisuje ten tekst do `CREATE TABLE` i przy kolejnym `generate` nie widzi zmian.
- **Sortowanie z `collate "C"` w samym zapytaniu to gorsze rozwiązanie.** Każde zapytanie musiałoby o tym pamiętać, a indeks `(user_id, position)` z domyślną kolacją nie pomógłby w takim sortowaniu.
- **`timestamp` bez `withTimezone`** zapisuje czas bez strefy, a serwer i przeglądarka mogą być w różnych strefach. Tabele Better Auth z Etapu 1 mają kolumny bez strefy, bo tak je generuje CLI. Nowe tabele używają `timestamptz`, zgodnie z architekturą.
- **CLI Better Auth nadpisuje tylko `schema/auth.ts`.** Nowe tabele trzymaj w osobnych plikach, bo kolejne `db:auth-schema` skasowałoby zmiany w `auth.ts`.

<details>
<summary>Podpowiedź</summary>

- `customType<{ data: string }>({ dataType: () => '…' })` zwraca funkcję, którą wołasz jak `text('position')`.
- Klucz obcy z kaskadą: `.references(() => user.id, { onDelete: 'cascade' })`.
- `$type<ContextIcon>()` zawęża typ kolumny w TypeScript bez zmiany typu w bazie.
- Indeks złożony: trzeci argument `pgTable` to `(table) => [index('nazwa').on(table.userId, table.position)]`.
- W teście: `client.query<{ collation_name: string | null }>(…)` z `where table_name = 'contexts' and column_name = 'position'`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/db/schema/columns.ts`

```ts
import { customType, integer, timestamp } from 'drizzle-orm/pg-core'

// Drizzle has no option for a column collation. Keys from `fractional-indexing` must be compared
// byte by byte, and the default collation of Postgres (e.g. en_US.utf8) would sort them differently.
export const fractionalIndex = customType<{ data: string }>({
  dataType: () => 'text COLLATE "C"',
})

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
}
```

`apps/api/src/db/schema/contexts.ts`

```ts
import type { ContextIcon } from '@one-place/shared'
import { index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { fractionalIndex, timestamps } from './columns'

export const contexts = pgTable(
  'contexts',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 40 }).notNull(),
    icon: varchar('icon', { length: 64 }).$type<ContextIcon>().notNull(),
    position: fractionalIndex('position').notNull(),
    ...timestamps,
  },
  (table) => [index('contexts_user_id_position_idx').on(table.userId, table.position)],
)
```

`apps/api/src/db/schema/settings.ts`

```ts
import type { Locale } from '@one-place/shared'
import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  // null means "follow the browser language"
  locale: varchar('locale', { length: 8 }).$type<Locale>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
})
```

`apps/api/src/db/schema/index.ts`

```ts
export * from './auth'
export * from './contexts'
export * from './settings'
```

`apps/api/test/migrations.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { createTestApp } from './create-test-app'

describe('database migrations', () => {
  it('create the Better Auth and data tables', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`,
    )
    expect(rows.map((row) => row.table_name)).toEqual([
      'account',
      'contexts',
      'session',
      'user',
      'user_settings',
      'verification',
    ])
  })

  // PGlite always uses the C collation, so sorting in tests would pass even without it.
  // Postgres in Docker uses en_US.utf8, which puts 'Zz' after 'a0'.
  it('compare context positions byte by byte', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ collation_name: string | null }>(
      `select collation_name from information_schema.columns
       where table_name = 'contexts' and column_name = 'position'`,
    )
    expect(rows).toEqual([{ collation_name: 'C' }])
  })
})
```

Wygenerowany `apps/api/src/db/migrations/0001_contexts_and_settings.sql` (do porównania):

```sql
CREATE TABLE "contexts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(40) NOT NULL,
	"icon" varchar(64) NOT NULL,
	"position" text COLLATE "C" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"locale" varchar(8),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contexts" ADD CONSTRAINT "contexts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contexts_user_id_position_idx" ON "contexts" USING btree ("user_id","position");
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego test sprawdza `collation_name`, a nie kolejność wyników?** PGlite zawsze porównuje bajtowo, więc test kolejności przeszedłby także bez `COLLATE "C"`. Test kolacji kolumny przechodzi tylko wtedy, gdy migracja ją ustawia, a ta sama migracja trafia do Postgresa.
2. **Co usuwa `ON DELETE CASCADE` w tych tabelach?** Usunięcie użytkownika usuwa jego konteksty i ustawienia. Bez kaskady baza odrzuciłaby usunięcie konta, dopóki ma ono jakiekolwiek dane.
3. **Do czego posłuży `version`, skoro w MVP wygrywa ostatni zapis?** Każdy zapis zwiększa `version`, a klient dostaje ją w odpowiedzi. Gdy kiedyś dojdzie wykrywanie konfliktów (`409 VERSION_CONFLICT`), serwer porówna wersję z żądania z wersją w bazie, bez zmiany schematu.

</details>

---

## Zadanie 3: walidacja wejścia w standardowym formacie błędów

**Cel:** każda trasa API waliduje dane schematami z `shared`, a błędne dane dają 400 w formacie z [03-architektura.md](03-architektura.md#format-błędów), również wtedy, gdy treść żądania nie jest poprawnym JSON-em.

**Czego się nauczysz:** `zValidator` i jego `hook`, typy `c.req.valid()`, `HTTPException` w Hono.

**Pliki:**

- Utwórz: `apps/api/src/lib/validate.ts`
- Zmień: `apps/api/src/lib/errors.ts`, `apps/api/package.json` (zależność)
- Test: `apps/api/test/validate.test.ts`

**Interfejsy:**

- Korzysta z: `handleError` (Etap 1).
- Wytwarza: `validate(target, schema)`, czyli middleware o tych samych typach co `zValidator`, oraz `IdParamSchema` (`{ id: uuid }`). Używają ich zadania 4–6.

**Kroki:**

- [x] **1. Zależność.** `pnpm --filter @one-place/api add @hono/zod-validator@^0.9`
- [x] **2. Eksperyment: domyślna odpowiedź walidatora.** W `test/validate.test.ts` zbuduj małą aplikację: `new Hono().post('/items/:id', zValidator('json', z.object({ name: z.string().trim().min(1) })), handler).onError(handleError)`. Dopisz test: `{ name: '' }` daje 400 i `body.error.code === 'VALIDATION_ERROR'`. **Oczekiwany wynik: FAIL**, a treść odpowiedzi wygląda tak: `{"success":false,"error":{"name":"ZodError","message":"[\n {\n \"origin\": \"string\", …"}}`. Zastanów się, skąd ten kształt, zanim otworzysz wyjaśnienie.
- [x] **3. Implementacja** `src/lib/validate.ts`: `validate()` woła `zValidator` z trzecim argumentem (hook), który przy błędzie rzuca `result.error`. W teście zamień `zValidator` na `validate`. Dodaj test, że poprawne dane docierają do handlera już przycięte (`'  Praca  '` → `'Praca'`). Oczekiwany wynik: **PASS**.
- [x] **4. Eksperyment: zepsuty JSON.** Dopisz test, który wysyła treść `'{"name":'` z nagłówkiem `Content-Type: application/json`. **Oczekiwany wynik: FAIL, `expected 500 to be 400`.** Zastanów się, kto rzucił błąd, skoro Zod nie dostał żadnych danych.
- [x] **5. Poprawka** w `handleError`: `HTTPException` ze statusem 400 zamień na `VALIDATION_ERROR` z komunikatem wyjątku.
- [x] **6. ID w ścieżce.** Dodaj `IdParamSchema` i walidację parametru (`validate('param', …)` przed walidacją JSON). Test: `/items/42` daje 400 z `VALIDATION_ERROR`.
- [x] **7. Zielone testy.** Oczekiwany wynik: **PASS (32 testy w pakiecie API)**.
- [x] **8.** `pnpm format && pnpm check`, potem commit: `feat(api): add request validation in the standard error format`.

<details>
<summary>Wyjaśnienie eksperymentów (otwórz po kroku 4)</summary>

- **Krok 2.** Bez hooka `zValidator` sam odpowiada `c.json(result, 400)`, gdzie `result` to wynik `safeParse`. `ZodError` zamieniony na JSON to tylko `name` i `message` z listą błędów jako tekstem. Rozszerzenie dostałoby więc inny format niż przy pozostałych błędach.
- **Hook, który rzuca.** Wyjątek trafia do `app.onError`, a `handleError` z Etapu 1 umie już zamienić `ZodError` na 400 z `fieldErrors`. Jeden format błędów obsługuje jedno miejsce.
- **Krok 4.** Zanim Zod cokolwiek sprawdzi, walidator Hono musi odczytać treść jako JSON. Gdy się nie da, rzuca `HTTPException(400, 'Malformed JSON in request body')`. `handleError` traktował każdy nieznany wyjątek jako błąd serwera: odpowiadał 500 i zapisywał go w logach jako błąd. Do tej pory żadna trasa Hono nie czytała treści żądania, więc ten przypadek nie wystąpił.

</details>

<details>
<summary>Podpowiedź</summary>

- Hook to trzeci argument `zValidator(target, schema, (result, c) => …)`. Gdy `result.success` jest `false`, `result.error` to `ZodError`.
- Żeby `validate` zachował typy `c.req.valid('json')`, zrób z niego funkcję generyczną: `<Target extends keyof ValidationTargets, Schema extends z.ZodType>(target: Target, schema: Schema)`.
- `HTTPException` importujesz z `hono/http-exception`. Ma pole `status`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/lib/validate.ts`

```ts
import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import { z } from 'zod'

// Without it, a malformed id would reach Postgres and fail as a 500 (invalid uuid syntax)
export const IdParamSchema = z.object({ id: z.uuid() })

// zValidator answers invalid input with its own JSON. Throwing the ZodError instead
// lets handleError return it in the standard error format.
export function validate<Target extends keyof ValidationTargets, Schema extends z.ZodType>(
  target: Target,
  schema: Schema,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) throw result.error
  })
}
```

`apps/api/src/lib/errors.ts` (nowy import i nowy warunek w `handleError`)

```ts
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'

// AppError i errorBody bez zmian

export function handleError(error: Error, c: Context) {
  if (error instanceof AppError) {
    return c.json(errorBody(error.code, error.message, error.details), error.status)
  }
  if (error instanceof z.ZodError) {
    return c.json(errorBody('VALIDATION_ERROR', 'Invalid request data', z.flattenError(error)), 400)
  }
  // Hono's validator throws HTTPException(400) for a body that is not valid JSON
  if (error instanceof HTTPException && error.status === 400) {
    return c.json(errorBody('VALIDATION_ERROR', error.message), 400)
  }
  // Details of unexpected errors go to the logs only (see middleware/logger.ts).
  return c.json(errorBody('INTERNAL_ERROR', 'Internal server error'), 500)
}
```

`apps/api/test/validate.test.ts`

```ts
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { handleError } from '../src/lib/errors'
import { validate } from '../src/lib/validate'

const app = new Hono()
  .post(
    '/items/:id',
    validate('param', z.object({ id: z.uuid() })),
    validate('json', z.object({ name: z.string().trim().min(1) })),
    (c) => c.json({ id: c.req.valid('param').id, name: c.req.valid('json').name }),
  )
  .onError(handleError)

const id = '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b10'

function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('validate', () => {
  it('passes parsed data to the handler', async () => {
    const res = await post(`/items/${id}`, { name: '  Praca  ' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id, name: 'Praca' })
  })

  it('returns invalid JSON body in the standard error format', async () => {
    const res = await post(`/items/${id}`, { name: '' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details.fieldErrors).toHaveProperty('name')
  })

  it('rejects a malformed JSON body with 400 instead of 500', async () => {
    const res = await app.request(`/items/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":',
    })
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a path parameter that is not a UUID', async () => {
    const res = await post('/items/42', { name: 'Praca' })
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co by się stało z ID `42` w ścieżce bez `IdParamSchema`?** Zapytanie dotarłoby do Postgresa, który odrzuciłby `'42'` jako niepoprawny UUID. To wyjątek bazy, więc odpowiedź to 500 i wpis błędu w logach, choć zawinił klient. Sprawdzisz to w zadaniu 6.
2. **Dlaczego hook rzuca wyjątek, zamiast zwracać odpowiedź?** Wtedy formatem błędów zajmuje się tylko `handleError`. Gdyby hook budował odpowiedź, format byłby zdefiniowany w dwóch miejscach, które z czasem się rozjadą.
3. **Czy klient `hc` w rozszerzeniu zna typ odpowiedzi 400?** Nie. Hono RPC zna tylko odpowiedzi zwracane przez handlery (`c.json(…)`). Błędy rzucane do `onError` nie są w typach, dlatego rozszerzenie odczytuje kod błędu samo (zadanie 7).

</details>

---

## Zadanie 4: moduł `settings` (leniwy wiersz)

**Cel:** `GET /api/settings` zwraca ustawienia zalogowanego użytkownika albo wartości domyślne, gdy jeszcze nic nie zapisał, a `PATCH /api/settings` zapisuje zmianę i zwraca pełny rekord ([03-architektura.md](03-architektura.md#tabele)).

**Czego się nauczysz:** struktura modułu (`routes.ts` i `service.ts`), router Hono z `requireAuth` dołączanym przez `.use()`, `app.route()` w łańcuchu, upsert w Drizzle (`onConflictDoUpdate`) i zwiększanie `version` w SQL.

**Pliki:**

- Utwórz: `apps/api/src/modules/deps.ts`, `apps/api/src/modules/settings/service.ts`, `apps/api/src/modules/settings/routes.ts`
- Zmień: `apps/api/src/app.ts`, `apps/api/test/auth-helpers.ts`
- Test: `apps/api/test/settings.test.ts`

**Interfejsy:**

- Korzysta z: `UpdateSettingsSchema` i `SettingsDto` (zadanie 1), `userSettings` (zadanie 2), `validate` (zadanie 3), `requireAuth`, `signUp` i `TEST_USER` (Etap 1).
- Wytwarza: `ModuleDeps` (`{ db, auth }`), `settingsRoutes(deps)`, trasy `GET` i `PATCH /api/settings`, pomocnik testowy `asUser(app, token)` z metodami `get`, `post`, `patch` i `delete`. Używają ich zadania 5, 6 i 13.

**Kroki:**

- [x] **1. Pomocnik testowy.** W `test/auth-helpers.ts` dodaj `asUser(app, token)`, który wysyła żądania z nagłówkami `Authorization: Bearer …` i `Content-Type: application/json`. Testy czytają się wtedy jak opis: `await alice.patch('/api/settings', { locale: 'en' })`.
- [x] **2. Czerwone testy** w `test/settings.test.ts`:
  - `GET` bez tokenu daje 401;
  - `GET` przed pierwszym zapisem daje `{ locale: null, updatedAt: null, version: 0 }`;
  - pierwszy `PATCH { locale: 'en' }` daje 200 i `{ locale: 'en', updatedAt: <tekst>, version: 1 }`, a kolejny `GET` zwraca `locale: 'en'`;
  - drugi `PATCH { locale: null }` daje `version: 2`;
  - `PATCH { locale: 'de' }` daje 400 z `VALIDATION_ERROR`;
  - ustawienia Alicji nie zmieniają ustawień Boba (drugi użytkownik z e-mailem `bob@example.com`).

  Oczekiwany wynik: **FAIL** wszystkich sześciu (trasa nie istnieje, więc wszędzie 404).

- [x] **3. Serwis** `modules/settings/service.ts`: `getSettings(db, userId)` i `updateSettings(db, userId, input)`. Rekord z bazy zamieniaj na DTO w jednym miejscu (`toSettingsDto`), daty przez `toISOString()`.
- [x] **4. Trasy** `modules/settings/routes.ts`: `settingsRoutes({ db, auth })` zwraca `new Hono().use(requireAuth(auth)).get(…).patch(…)`. Typ `ModuleDeps` trzymaj w `modules/deps.ts`.
- [x] **5. Podłączenie.** W `app.ts` dopisz `.route('/settings', settingsRoutes({ db, auth }))` w łańcuchu, zaraz po `/me`.
- [x] **6. Zielone testy.** Oczekiwany wynik: **PASS (38 testów w pakiecie API)**.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(api): add settings module`.

**Pułapki (sprawdzone na prototypie):**

- **`.route()` musi być w łańcuchu.** Tak jak trasy z Etapu 1: `AppType` to typ wyniku całego łańcucha. Wywołanie `app.route()` w osobnej instrukcji działa w runtime, ale klient `hc` w rozszerzeniu nie zobaczy `api.settings`.
- **`c.var.user` ma typ dzięki `.use(requireAuth(auth))`.** Middleware z Etapu 1 deklaruje zmienną `user` w typach, a `.use()` na routerze przenosi ją do każdej trasy tego routera.
- **`version + 1` musi powstać w SQL.** `` sql`${userSettings.version} + 1` `` w `onConflictDoUpdate` odnosi się do istniejącego wiersza. Wartość wyliczona w JavaScripcie wymagałaby wcześniejszego odczytu, a dwa równoczesne zapisy dałyby tę samą wersję.
- **`.returning()` zwraca tablicę.** Przy włączonym `noUncheckedIndexedAccess` `const [row]` ma typ `… | undefined`. Upsert zawsze zwraca dokładnie jeden wiersz, więc `row!` z komentarzem jest tu w porządku.

<details>
<summary>Podpowiedź</summary>

- Upsert: ``db.insert(userSettings).values({ userId, ...input }).onConflictDoUpdate({ target: userSettings.userId, set: { ...input, updatedAt: sql`now()`, version: … } }).returning()``.
- Pusty `input` (`PATCH {}`) też jest poprawny: zwiększy tylko wersję i datę.
- W teście drugiego użytkownika załóż przez `signUp(app, { ...TEST_USER, email: 'bob@example.com' })`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/test/auth-helpers.ts` (nowa funkcja na końcu pliku)

```ts
// Requests on behalf of a signed-in user, e.g. `const alice = asUser(app, await signUp(app))`
export function asUser(app: AppType, token: string) {
  const send = (method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  return {
    get: (path: string) => send('GET', path),
    post: (path: string, body: unknown) => send('POST', path, body),
    patch: (path: string, body: unknown) => send('PATCH', path, body),
    delete: (path: string) => send('DELETE', path),
  }
}
```

`apps/api/test/settings.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { asUser, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'

async function setup() {
  const { app } = await createTestApp()
  const alice = asUser(app, await signUp(app))
  return { app, alice }
}

describe('GET /api/settings', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request('/api/settings')
    expect(res.status).toBe(401)
  })

  it('returns defaults before the first save', async () => {
    const { alice } = await setup()
    const res = await alice.get('/api/settings')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ locale: null, updatedAt: null, version: 0 })
  })
})

describe('PATCH /api/settings', () => {
  it('creates the row on the first save and returns it', async () => {
    const { alice } = await setup()
    const res = await alice.patch('/api/settings', { locale: 'en' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ locale: 'en', updatedAt: expect.any(String), version: 1 })
    expect(await (await alice.get('/api/settings')).json()).toMatchObject({ locale: 'en' })
  })

  it('updates the row and increments the version', async () => {
    const { alice } = await setup()
    await alice.patch('/api/settings', { locale: 'en' })
    const res = await alice.patch('/api/settings', { locale: null })
    expect(await res.json()).toMatchObject({ locale: null, version: 2 })
  })

  it('rejects an unsupported locale', async () => {
    const { alice } = await setup()
    const res = await alice.patch('/api/settings', { locale: 'de' })
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it('keeps settings of each user separate', async () => {
    const { app, alice } = await setup()
    const bob = asUser(app, await signUp(app, { ...TEST_USER, email: 'bob@example.com' }))
    await alice.patch('/api/settings', { locale: 'en' })
    expect(await (await bob.get('/api/settings')).json()).toMatchObject({ locale: null })
  })
})
```

`apps/api/src/modules/deps.ts`

```ts
import type { Auth } from '../auth'
import type { Database } from '../db/client'

export interface ModuleDeps {
  db: Database
  auth: Auth
}
```

`apps/api/src/modules/settings/service.ts`

```ts
import type { SettingsDto, UpdateSettingsInput } from '@one-place/shared'
import { eq, sql } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { userSettings } from '../../db/schema'

// The row is created on the first save, so sign-up does not need an extra hook
const DEFAULT_SETTINGS: SettingsDto = { locale: null, updatedAt: null, version: 0 }

function toSettingsDto(row: typeof userSettings.$inferSelect): SettingsDto {
  return { locale: row.locale, updatedAt: row.updatedAt.toISOString(), version: row.version }
}

export async function getSettings(db: Database, userId: string): Promise<SettingsDto> {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId))
  return row ? toSettingsDto(row) : DEFAULT_SETTINGS
}

export async function updateSettings(
  db: Database,
  userId: string,
  input: UpdateSettingsInput,
): Promise<SettingsDto> {
  const [row] = await db
    .insert(userSettings)
    .values({ userId, ...input })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { ...input, updatedAt: sql`now()`, version: sql`${userSettings.version} + 1` },
    })
    .returning()
  // An upsert always returns exactly one row
  return toSettingsDto(row!)
}
```

`apps/api/src/modules/settings/routes.ts`

```ts
import { UpdateSettingsSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { validate } from '../../lib/validate'
import { requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { getSettings, updateSettings } from './service'

export function settingsRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .get('/', async (c) => c.json(await getSettings(db, c.var.user.id)))
    .patch('/', validate('json', UpdateSettingsSchema), async (c) =>
      c.json(await updateSettings(db, c.var.user.id, c.req.valid('json'))),
    )
}
```

`apps/api/src/app.ts` (nowy import i nowa linia w łańcuchu)

```ts
import { settingsRoutes } from './modules/settings/routes'

// …
    .get('/me', requireAuth(auth), (c) => {
      const { id, name, email } = c.var.user
      return c.json({ id, name, email })
    })
    .route('/settings', settingsRoutes({ db, auth }))
    .onError(handleError)
    .notFound(handleNotFound)
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego wiersz ustawień nie powstaje przy rejestracji?** Wymagałoby to hooka w Better Auth i dodatkowej obsługi błędu, gdyby zapis się nie udał. Wartości domyślne w `GET` i upsert w `PATCH` dają ten sam efekt bez zależności między rejestracją a modułem ustawień.
2. **Co się stanie, gdy dwa pierwsze `PATCH` przyjdą jednocześnie?** Oba wykonają `INSERT … ON CONFLICT DO UPDATE`. Postgres wykonuje taką instrukcję atomowo, więc jeden wstawi wiersz, a drugi go zaktualizuje. Nie ma błędu duplikatu klucza ani zgubionej wersji.
3. **Po co `version: 0` w wartościach domyślnych?** Odróżnia „nigdy nie zapisano” od zapisanego wiersza, który ma `version` od 1. Klient nie musi zgadywać po `updatedAt: null`.

</details>

---

## Zadanie 5: moduł `contexts`: lista i idempotentne tworzenie

**Cel:** `GET /api/contexts` zwraca konteksty użytkownika posortowane po pozycji, a `POST /api/contexts` tworzy kontekst z ID wygenerowanym przez klienta. Ponowienie tego samego żądania zwraca istniejący rekord, cudze ID daje 409, a dwudziesty pierwszy kontekst 422 (F-CTX-02, F-CTX-08).

**Czego się nauczysz:** idempotencja dzięki ID z klienta, kolejność sprawdzeń w serwisie, `db.$count`, różne statusy odpowiedzi z jednej trasy (`201` i `200`).

**Pliki:**

- Utwórz: `apps/api/src/modules/contexts/service.ts`, `apps/api/src/modules/contexts/routes.ts`, `apps/api/test/fixtures.ts`
- Zmień: `apps/api/src/app.ts`
- Test: `apps/api/test/contexts.test.ts`

**Interfejsy:**

- Korzysta z: `CreateContextSchema`, `ContextDto` i `MAX_CONTEXTS` (zadanie 1), `contexts` (zadanie 2), `validate` (zadanie 3), `ModuleDeps` i `asUser` (zadanie 4).
- Wytwarza: `contextsRoutes(deps)`, trasy `GET` i `POST /api/contexts`, fabrykę testową `contextInput(overrides)`. Zadanie 6 dopisuje do tego modułu `PATCH` i `DELETE`.

**Kroki:**

- [x] **1. Fabryka testowa** `test/fixtures.ts`: `contextInput(overrides)` zwraca poprawne `CreateContextInput` z nowym `randomUUID()` i nazwą `'Praca'`.
- [x] **2. Czerwone testy** w `test/contexts.test.ts` (`setup()` zakłada dwóch użytkowników, Alicję i Boba):
  - `GET` bez tokenu daje 401;
  - `GET` zwraca tylko konteksty Alicji w kolejności pozycji: po utworzeniu `a1`, `Zz` i `a0V` (oraz kontekstu Boba) nazwy idą w kolejności `Zz`, xa0V`, `a1`;
  - `POST` daje 201 i pełny rekord (`createdAt`, `updatedAt`, `version: 1`), a nazwa jest przycięta;
  - ponowiony identyczny `POST` daje 200, ten sam rekord i nadal jeden kontekst na liście;
  - `POST` z ID kontekstu Alicji wysłany przez Boba daje 409 `ID_CONFLICT`;
  - nazwa z 41 znaków daje 400 `VALIDATION_ERROR`;
  - przy 20 kontekstach kolejny `POST` daje 422 `LIMIT_EXCEEDED`, ale ponowienie jednego z istniejących nadal daje 200.

  Oczekiwany wynik: **FAIL** wszystkich siedmiu.

- [x] **3. Serwis:** `listContexts(db, userId)` i `createContext(db, userId, input)`, który zwraca `{ context, created }`. Kolejność w `createContext`: najpierw szukanie istniejącego ID, potem limit, na końcu `insert`.
- [x] **4. Trasy i podłączenie.** `contextsRoutes` jak `settingsRoutes`. `POST` odpowiada `c.json(context, created ? 201 : 200)`. W `app.ts` dodaj `.route('/contexts', contextsRoutes({ db, auth }))`.
- [x] **5. Zielone testy.** Oczekiwany wynik: **PASS (45 testów w pakiecie API)**.
- [x] **6. Sprawdź kolejność sprawdzeń.** Przenieś na chwilę sprawdzenie limitu przed szukanie istniejącego ID. Oczekiwany wynik: test limitu **FAIL** (`expected 422 to be 200`). Przywróć kolejność.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(api): add contexts list and idempotent create`.

**Pułapki (sprawdzone na prototypie):**

- **Najpierw istniejące ID, potem limit.** Klient ponawia `POST`, gdy nie dostał odpowiedzi, choć serwer mógł już zapisać rekord. Przy 20 kontekstach ponowienie dwudziestego musi zwrócić ten rekord, a nie 422, bo inaczej rozszerzenie cofnęłoby kontekst, który istnieje w bazie.
- **Remis pozycji.** Dwa urządzenia mogą jednocześnie dodać kontekst „na końcu” i obu dać tę samą pozycję (`a1`). Sortowanie `orderBy(asc(contexts.position), asc(contexts.id))` daje wtedy za każdym razem tę samą kolejność. Rozszerzenie sortuje tak samo (zadanie 9).
- **Dwa jednoczesne `POST` z tym samym ID** mogą oba nie znaleźć rekordu i jeden z nich dostanie błąd klucza głównego (500). Rozszerzenie nie wysyła tej samej mutacji równolegle, więc w MVP to akceptujemy. To samo dotyczy limitu przy równoczesnych `POST`.

<details>
<summary>Podpowiedź</summary>

- `db.$count(contexts, eq(contexts.userId, userId))` zwraca liczbę wierszy.
- `AppError(409, 'ID_CONFLICT', …)` i `AppError(422, 'LIMIT_EXCEEDED', …)` obsłuży `handleError` z Etapu 1.
- Do testu limitu: `Array.from({ length: MAX_CONTEXTS }, () => contextInput())`, wysłane po kolei w pętli `for … of`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/test/fixtures.ts`

```ts
import { randomUUID } from 'node:crypto'
import type { CreateContextInput } from '@one-place/shared'

export function contextInput(overrides: Partial<CreateContextInput> = {}): CreateContextInput {
  return {
    id: randomUUID(),
    name: 'Praca',
    icon: 'i-lucide-briefcase',
    position: 'a0',
    ...overrides,
  }
}
```

`apps/api/test/contexts.test.ts` (stan po tym zadaniu; zadanie 6 dopisze kolejne bloki)

```ts
import { MAX_CONTEXTS } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { asUser, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'
import { contextInput } from './fixtures'

async function setup() {
  const { app, client } = await createTestApp()
  const alice = asUser(app, await signUp(app))
  const bob = asUser(app, await signUp(app, { ...TEST_USER, email: 'bob@example.com' }))
  return { app, client, alice, bob }
}

describe('GET /api/contexts', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    expect((await app.request('/api/contexts')).status).toBe(401)
  })

  it('returns only own contexts sorted by position', async () => {
    const { alice, bob } = await setup()
    await alice.post('/api/contexts', contextInput({ name: 'Second', position: 'a1' }))
    await alice.post('/api/contexts', contextInput({ name: 'First', position: 'Zz' }))
    await alice.post('/api/contexts', contextInput({ name: 'Middle', position: 'a0V' }))
    await bob.post('/api/contexts', contextInput({ name: 'Bob', position: 'a0' }))
    const res = await alice.get('/api/contexts')
    expect(res.status).toBe(200)
    const names = (await res.json()).map((context: { name: string }) => context.name)
    expect(names).toEqual(['First', 'Middle', 'Second'])
  })
})

describe('POST /api/contexts', () => {
  it('creates a context and returns the full record with 201', async () => {
    const { alice } = await setup()
    const input = contextInput({ name: '  Praca  ' })
    const res = await alice.post('/api/contexts', input)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      id: input.id,
      name: 'Praca',
      icon: input.icon,
      position: input.position,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      version: 1,
    })
  })

  it('returns the existing record with 200 when the same request is retried', async () => {
    const { alice } = await setup()
    const input = contextInput()
    const first = await (await alice.post('/api/contexts', input)).json()
    const retry = await alice.post('/api/contexts', input)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toEqual(first)
    expect(await (await alice.get('/api/contexts')).json()).toHaveLength(1)
  })

  it('returns 409 when the id belongs to another user', async () => {
    const { alice, bob } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await bob.post('/api/contexts', input)
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('ID_CONFLICT')
  })

  it('rejects invalid input', async () => {
    const { alice } = await setup()
    const res = await alice.post('/api/contexts', contextInput({ name: 'a'.repeat(41) }))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it(`allows at most ${MAX_CONTEXTS} contexts, but still answers a retry`, async () => {
    const { alice } = await setup()
    const inputs = Array.from({ length: MAX_CONTEXTS }, () => contextInput())
    for (const input of inputs) await alice.post('/api/contexts', input)
    const res = await alice.post('/api/contexts', contextInput())
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('LIMIT_EXCEEDED')
    expect((await alice.post('/api/contexts', inputs[0])).status).toBe(200)
  })
})
```

`apps/api/src/modules/contexts/service.ts` (stan po tym zadaniu)

```ts
import { type ContextDto, type CreateContextInput, MAX_CONTEXTS } from '@one-place/shared'
import { asc, eq } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { contexts } from '../../db/schema'
import { AppError } from '../../lib/errors'

function toContextDto(row: typeof contexts.$inferSelect): ContextDto {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  }
}

export async function listContexts(db: Database, userId: string): Promise<ContextDto[]> {
  const rows = await db
    .select()
    .from(contexts)
    .where(eq(contexts.userId, userId))
    // Two devices may give two contexts the same position. The id keeps their order stable.
    .orderBy(asc(contexts.position), asc(contexts.id))
  return rows.map(toContextDto)
}

export async function createContext(
  db: Database,
  userId: string,
  input: CreateContextInput,
): Promise<{ context: ContextDto; created: boolean }> {
  // The client generates the id, so a retried request (e.g. after a lost response)
  // finds the record it created the first time. Check it before the limit.
  const [existing] = await db.select().from(contexts).where(eq(contexts.id, input.id))
  if (existing) {
    if (existing.userId !== userId) {
      throw new AppError(409, 'ID_CONFLICT', 'This id is already used by another record')
    }
    return { context: toContextDto(existing), created: false }
  }
  const count = await db.$count(contexts, eq(contexts.userId, userId))
  if (count >= MAX_CONTEXTS) {
    throw new AppError(422, 'LIMIT_EXCEEDED', `A user can have at most ${MAX_CONTEXTS} contexts`)
  }
  const [row] = await db
    .insert(contexts)
    .values({ ...input, userId })
    .returning()
  return { context: toContextDto(row!), created: true }
}
```

`apps/api/src/modules/contexts/routes.ts` (stan po tym zadaniu)

```ts
import { CreateContextSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { validate } from '../../lib/validate'
import { requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createContext, listContexts } from './service'

export function contextsRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .get('/', async (c) => c.json(await listContexts(db, c.var.user.id)))
    .post('/', validate('json', CreateContextSchema), async (c) => {
      const { context, created } = await createContext(db, c.var.user.id, c.req.valid('json'))
      return c.json(context, created ? 201 : 200)
    })
}
```

`apps/api/src/app.ts` (nowy import i nowa linia w łańcuchu)

```ts
import { contextsRoutes } from './modules/contexts/routes'

// …
    .route('/settings', settingsRoutes({ db, auth }))
    .route('/contexts', contextsRoutes({ db, auth }))
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego idempotencja wymaga ID z klienta?** Gdy ID nadaje serwer, ponowione żądanie wygląda jak zupełnie nowe i tworzy drugi rekord. ID z klienta pozwala serwerowi rozpoznać, że to ta sama operacja.
2. **Po co rozróżniać 201 i 200?** 201 mówi „utworzyłem teraz”, a 200 „to już istniało, oto rekord”. Klient traktuje oba tak samo, ale w logach i testach widać, które żądanie było ponowieniem.
3. **Czy 409 nie zdradza, że cudze ID istnieje?** Zdradza tylko tyle, że ktoś ma rekord o tym ID. UUIDv7 ma 74 losowe bity, więc zgadnięcie cudzego ID jest praktycznie niemożliwe, a do samego rekordu i tak nie ma dostępu.

</details>

---

## Zadanie 6: moduł `contexts`: zmiana i usuwanie

**Cel:** `PATCH /api/contexts/:id` zmienia nazwę, ikonę lub pozycję i zwraca pełny rekord, a `DELETE /api/contexts/:id` usuwa kontekst. Cudzy kontekst daje 404, a ID, które nie jest UUID, daje 400 (F-CTX-05 … F-CTX-07, obowiązkowe przypadki z [03-architektura.md](03-architektura.md#testy)).

**Czego się nauczysz:** filtrowanie po właścicielu w samym `WHERE`, `update … returning`, `delete … returning`, odpowiedź 204 przez `c.body(null, 204)` oraz test, który przechodzi z niewłaściwego powodu.

**Pliki:**

- Zmień: `apps/api/src/modules/contexts/service.ts`, `apps/api/src/modules/contexts/routes.ts`
- Test: `apps/api/test/contexts.test.ts`

**Interfejsy:**

- Korzysta z: `UpdateContextSchema` (zadanie 1), `IdParamSchema` (zadanie 3).
- Wytwarza: trasy `PATCH` i `DELETE /api/contexts/:id`. Rozszerzenie korzysta z nich w zadaniach 9 i 12.

**Kroki:**

- [x] **1. Czerwone testy** (nowe bloki `describe` w `test/contexts.test.ts`):
  - `PATCH` i `DELETE` bez tokenu dają 401;
  - `PATCH { name: 'Dom', position: 'a5' }` daje 200 z nowymi polami, starą ikoną i `version: 2`;
  - `PATCH` cudzego kontekstu daje 404 z kodem `NOT_FOUND`, a kontekst Alicji się nie zmienia;
  - `PATCH /api/contexts/42` i `PATCH { name: '' }` dają 400;
  - `DELETE` daje 204, lista jest pusta, a drugi `DELETE` daje 404;
  - `DELETE` cudzego kontekstu daje 404, a kontekst Alicji zostaje;
  - usunięcie użytkownika w bazie (`delete from "usex"`) usuwa jego konteksty.
- [x] **2. Uruchom.** Oczekiwany wynik: **FAIL tylko trzech testów**, choć tras jeszcze nie ma. Zastanów się, dlaczego pozostałe przechodzą, zanim otworzysz wyjaśnienie poniżej.
- [x] **3. Popraw testy 404.** Oba testy cudzego kontekstu porównują całą treść odpowiedzi z `{ error: { code: 'NOT_FOUND', message: 'Context not found' } }`. Oczekiwany wynik: **FAIL pięciu testów**.
- [x] **4. Serwis:** `updateContext(db, userId, id, input)` i `deleteContext(db, userId, id)`. Warunek `id = :id AND user_id = :userId` jest w jednym zapytaniu, a brak wiersza w `returning()` oznacza 404 z komunikatem `Context not found`.
- [x] **5. Trasy:** `.patch('/:id', validate('param', IdParamSchema), validate('json', UpdateContextSchema), …)` i `.delete('/:id', validate('param', IdParamSchema), …)` z `c.body(null, 204)`.
- [x] **6. Zielone testy.** Oczekiwany wynik: **PASS (53 testy w pakiecie API)**.
- [x] **7. Sprawdź walidację ID.** Usuń na chwilę `validate('param', IdParamSchema)` z `PATCH` i weź ID przez `c.req.param('id')`. Oczekiwany wynik: `expected 500 to be 400`. To błąd Postgresa „invalid input syntax for type uuid”. Przywróć walidację.
- [x] **8.** `pnpm format && pnpm check`, potem commit: `feat(api): add context update and delete`.

<details>
<summary>Wyjaśnienie (otwórz po kroku 2)</summary>

- **401** przechodzi, bo `.use(requireAuth(auth))` działa dla wszystkich ścieżek pod `/api/contexts`, także dla tych bez trasy.
- **404 dla cudzego kontekstu** przechodzi, bo nieistniejąca trasa też daje 404 z kodem `NOT_FOUND`. Test sprawdzał tylko status i kod, więc nie odróżniał „cudzy kontekst” od „brak trasy”. Komunikat `Context not found` jest inny niż `Route not found`, więc porównanie całej treści naprawia test.
- **Kaskada** przechodzi, bo zapewnia ją migracja z zadania 2, a nie kod tego zadania. To w porządku: test dokumentuje wymaganie i będzie pilnował go przy kolejnych migracjach.

</details>

<details>
<summary>Podpowiedź</summary>

- `and(eq(contexts.id, id), eq(contexts.userId, userId))` z `drizzle-orm`.
- ``db.update(contexts).set({ ...input, updatedAt: sql`now()`, version: sql`${contexts.version} + 1` }).where(…).returning()``.
- `db.delete(contexts).where(…).returning({ id: contexts.id })` zwraca listę usuniętych ID.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/test/contexts.test.ts` (nowa stała pod importami i nowe bloki na końcu pliku)

```ts
// The message tells this 404 apart from the one for an unknown route
const notFound = { error: { code: 'NOT_FOUND', message: 'Context not found' } }

// …

describe('PATCH /api/contexts/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/contexts/${contextInput().id}`, { method: 'PATCH' })
    expect(res.status).toBe(401)
  })

  it('updates the given fields and increments the version', async () => {
    const { alice } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await alice.patch(`/api/contexts/${input.id}`, { name: 'Dom', position: 'a5' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      id: input.id,
      name: 'Dom',
      icon: input.icon,
      position: 'a5',
      version: 2,
    })
  })

  it("returns 404 for another user's context and leaves it unchanged", async () => {
    const { alice, bob } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await bob.patch(`/api/contexts/${input.id}`, { name: 'Hacked' })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(notFound)
    expect(await (await alice.get('/api/contexts')).json()).toMatchObject([{ name: 'Praca' }])
  })

  it('rejects an id that is not a UUID and invalid fields', async () => {
    const { alice } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    expect((await alice.patch('/api/contexts/42', { name: 'Dom' })).status).toBe(400)
    expect((await alice.patch(`/api/contexts/${input.id}`, { name: '' })).status).toBe(400)
  })
})

describe('DELETE /api/contexts/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/contexts/${contextInput().id}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('deletes the context', async () => {
    const { alice } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await alice.delete(`/api/contexts/${input.id}`)
    expect(res.status).toBe(204)
    expect(await (await alice.get('/api/contexts')).json()).toEqual([])
    expect((await alice.delete(`/api/contexts/${input.id}`)).status).toBe(404)
  })

  it("returns 404 for another user's context and keeps it", async () => {
    const { alice, bob } = await setup()
    const input = contextInput()
    await alice.post('/api/contexts', input)
    const res = await bob.delete(`/api/contexts/${input.id}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(notFound)
    expect(await (await alice.get('/api/contexts')).json()).toHaveLength(1)
  })

  it('happens automatically when the user is deleted', async () => {
    const { client, alice } = await setup()
    await alice.post('/api/contexts', contextInput())
    await client.query(`delete from "user" where email = $1`, [TEST_USER.email])
    const { rows } = await client.query('select id from contexts')
    expect(rows).toEqual([])
  })
})
```

`apps/api/src/modules/contexts/service.ts` (nowe importy i nowe funkcje na końcu pliku)

```ts
import {
  type ContextDto,
  type CreateContextInput,
  MAX_CONTEXTS,
  type UpdateContextInput,
} from '@one-place/shared'
import { and, asc, eq, sql } from 'drizzle-orm'

// …

// Another user's context gives the same answer as a missing one, so ids of other users
// cannot be discovered
function contextNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Context not found')
}

function ownContext(userId: string, id: string) {
  return and(eq(contexts.id, id), eq(contexts.userId, userId))
}

export async function updateContext(
  db: Database,
  userId: string,
  id: string,
  input: UpdateContextInput,
): Promise<ContextDto> {
  const [row] = await db
    .update(contexts)
    .set({ ...input, updatedAt: sql`now()`, version: sql`${contexts.version} + 1` })
    .where(ownContext(userId, id))
    .returning()
  if (!row) throw contextNotFound()
  return toContextDto(row)
}

export async function deleteContext(db: Database, userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(contexts)
    .where(ownContext(userId, id))
    .returning({ id: contexts.id })
  if (deleted.length === 0) throw contextNotFound()
}
```

`apps/api/src/modules/contexts/routes.ts`

```ts
import { CreateContextSchema, UpdateContextSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import { requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createContext, deleteContext, listContexts, updateContext } from './service'

export function contextsRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .get('/', async (c) => c.json(await listContexts(db, c.var.user.id)))
    .post('/', validate('json', CreateContextSchema), async (c) => {
      const { context, created } = await createContext(db, c.var.user.id, c.req.valid('json'))
      return c.json(context, created ? 201 : 200)
    })
    .patch(
      '/:id',
      validate('param', IdParamSchema),
      validate('json', UpdateContextSchema),
      async (c) => {
        const { id } = c.req.valid('param')
        return c.json(await updateContext(db, c.var.user.id, id, c.req.valid('json')))
      },
    )
    .delete('/:id', validate('param', IdParamSchema), async (c) => {
      await deleteContext(db, c.var.user.id, c.req.valid('param').id)
      return c.body(null, 204)
    })
}
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego cudzy kontekst daje 404, a nie 403?** 403 mówi „istnieje, ale nie twój”, więc pozwalałoby sprawdzać, które ID istnieją. 404 jest takie samo dla cudzego i nieistniejącego rekordu ([03-architektura.md](03-architektura.md#format-błędów)).
2. **Dlaczego właściciel jest w `WHERE`, a nie sprawdzany po odczycie?** Jedno zapytanie nie zostawia okna między sprawdzeniem a zapisem i nie da się go zapomnieć w jednej z gałęzi kodu. Rekord spoza `WHERE` po prostu nie istnieje dla tego użytkownika.
3. **Drugi `DELETE` tego samego kontekstu daje 404. Czy to problem dla rozszerzenia?** Nie, jeśli rozszerzenie traktuje 404 przy usuwaniu jak sukces: kontekstu nie ma, czyli cel został osiągnięty. Tak zrobisz w zadaniu 9.

</details>

---

## Zadanie 7: TanStack Query i błędy API

**Cel:** rozszerzenie pobiera dane przez TanStack Query. Błąd API trafia do zapytania z kodem i statusem, a zapytanie ponawia tylko to, co ma szansę się udać: błąd sieci i 5xx tak, 4xx nie.

**Czego się nauczysz:** `QueryClient` i `VueQueryPlugin`, `useQuery`, `parseResponse` i `DetailedError` z `hono/client`, opcja `retry` jako funkcja.

**Pliki:**

- Utwórz: `apps/extension/src/api/api-error.ts`, `apps/extension/src/queries/query-client.ts`, `apps/extension/src/queries/me.ts`
- Zmień: `apps/extension/src/entrypoints/newtab/main.ts`, `apps/extension/src/features/home/HomeScreen.vue`, `apps/extension/package.json`
- Test: `apps/extension/src/api/api-error.test.ts`

**Interfejsy:**

- Korzysta z: `apiClient` (Etap 1), formatu błędów API.
- Wytwarza: `apiErrorInfo(error)` → `{ status, code } | null`, `shouldRetry(failureCount, error)`, `createQueryClient()`, `useMe()` z kluczem `['me']`. Używają ich zadania 8–13.

**Kroki:**

- [x] **1. Zależność.** `pnpm --filter @one-place/extension add @tanstack/vue-query@^5`
- [x] **2. Czerwone testy** w `src/api/api-error.test.ts`. Błędy buduj prawdziwym `parseResponse` z `hono/client` na obiekcie `Response`, tak jak powstaną w aplikacji:
  - odpowiedź 422 z `{ error: { code: 'LIMIT_EXCEEDED', … } }` daje `{ status: 422, code: 'LIMIT_EXCEEDED' }`;
  - odpowiedź 502 z HTML-em (np. z reverse proxy) daje `{ status: 502, code: 'UNKNOWN' }`;
  - `new TypeError('Failed to fetch')` daje `null`;
  - `shouldRetry(0, błąd 422)` to `false`;
  - przy 500 i przy błędzie sieci `shouldRetry(2, …)` to `true`, a `shouldRetry(3, …)` to `false`.

  Oczekiwany wynik: **FAIL**, bo moduł `./api-error` nie istnieje.

- [x] **3. Implementacja** `src/api/api-error.ts`. Oczekiwany wynik: **PASS (21 testów w rozszerzeniu)**.
- [x] **4. Klient zapytań.** `src/queries/query-client.ts`: `createQueryClient()` z `defaultOptions.queries.retry = shouldRetry`. W `main.ts` utwórz klienta i dodaj `.use(VueQueryPlugin, { queryClient })`.
- [x] **5. Pierwsze zapytanie.** `src/queries/me.ts`: `useMe()` z `queryFn: () => parseResponse(apiClient.api.me.$get())`. W `HomeScreen.vue` zamień `onMounted` z ręcznym `fetch` na `const { data: me } = useMe()`, a w szablonie użyj `me.name`.
- [x] **6. Sprawdzenie ręczne.** Uruchom API i rozszerzenie w osobnych terminalach (jak w [zadaniu 10 Etapu 1](06-etap-1-logowanie.md#zadanie-10-wygasła-sesja-kilka-kart-i-brak-api)).
  - Zalogowany widzisz powitanie, tak jak wcześniej.
  - Zatrzymaj API i przeładuj kartę. W DevTools → Network żądanie `/api/me` pojawia się 4 razy: pierwsze i 3 ponowienia, w odstępach około 1, 2 i 4 sekund.
  - Uruchom API, usuń sesje w bazie (`docker compose exec db psql -U one one_place -c 'delete from session'`) i przeładuj kartę: jedno żądanie z 401, bez ponowień, i ekran logowania z „Sesja wygasła”.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(extension): add TanStack Query with API error handling`.

**Pułapki (sprawdzone na prototypie):**

- **`res.json()` nie rzuca przy 4xx.** `fetch` traktuje każdą odpowiedź jako sukces, a TanStack Query uznaje zapytanie za nieudane tylko wtedy, gdy `queryFn` rzuci wyjątek. `parseResponse` rzuca `DetailedError` dla statusu spoza 2xx, a dla 204 zwraca `undefined`, zamiast próbować czytać pustą treść.
- **`DetailedError` ma pola typu `any`.** Treść odpowiedzi jest w `error.detail.data`, a status w `error.statusCode`. `apiErrorInfo` zamyka to w jednym typowanym miejscu.
- **`failureCount` w `retry` liczy od 0.** `shouldRetry(3, …)` jest wołane po czwartej nieudanej próbie.

<details>
<summary>Podpowiedź</summary>

- W teście: `await parseResponse(response as unknown as ClientResponse<unknown>)` w `try`/`catch` zwraca dokładnie ten błąd, który dostanie zapytanie.
- `error instanceof DetailedError` odróżnia odpowiedź API od błędu sieci.
- Domyślne opóźnienie ponowień w TanStack Query rośnie wykładniczo (1 s, 2 s, 4 s …), więc wystarczy podać `retry`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/api/api-error.test.ts`

```ts
import { type ClientResponse, parseResponse } from 'hono/client'
import { describe, expect, it } from 'vitest'
import { apiErrorInfo, shouldRetry } from './api-error'

// The same error parseResponse() throws for a real API response
async function errorFor(response: Response) {
  try {
    await parseResponse(response as unknown as ClientResponse<unknown>)
  } catch (error) {
    return error
  }
  throw new Error('parseResponse did not throw')
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const limitExceeded = jsonResponse(422, {
  error: { code: 'LIMIT_EXCEEDED', message: 'A user can have at most 20 contexts' },
})

describe('apiErrorInfo', () => {
  it('reads the status and code of an API error', async () => {
    expect(apiErrorInfo(await errorFor(limitExceeded.clone()))).toEqual({
      status: 422,
      code: 'LIMIT_EXCEEDED',
    })
  })

  it('uses UNKNOWN when the body is not in the API error format', async () => {
    const error = await errorFor(new Response('<h1>Bad Gateway</h1>', { status: 502 }))
    expect(apiErrorInfo(error)).toEqual({ status: 502, code: 'UNKNOWN' })
  })

  it('returns null when the API was not reached', () => {
    expect(apiErrorInfo(new TypeError('Failed to fetch'))).toBeNull()
  })
})

describe('shouldRetry', () => {
  it('does not retry client errors', async () => {
    expect(shouldRetry(0, await errorFor(limitExceeded.clone()))).toBe(false)
  })

  it('retries server and network errors up to 3 times', async () => {
    const serverError = await errorFor(jsonResponse(500, {}))
    expect(shouldRetry(2, serverError)).toBe(true)
    expect(shouldRetry(3, serverError)).toBe(false)
    expect(shouldRetry(2, new TypeError('Failed to fetch'))).toBe(true)
  })
})
```

`apps/extension/src/api/api-error.ts`

```ts
import { DetailedError } from 'hono/client'

export interface ApiErrorInfo {
  status: number
  code: string
}

// parseResponse() from hono/client throws DetailedError for a non-2xx answer.
// Any other error (e.g. TypeError: Failed to fetch) means the API was not reached.
export function apiErrorInfo(error: unknown): ApiErrorInfo | null {
  if (!(error instanceof DetailedError)) return null
  const code: unknown = error.detail?.data?.error?.code
  return { status: error.statusCode, code: typeof code === 'string' ? code : 'UNKNOWN' }
}

const MAX_RETRIES = 3

// A 4xx answer will be the same next time. A network error or a 5xx may pass on retry.
export function shouldRetry(failureCount: number, error: unknown) {
  const info = apiErrorInfo(error)
  if (info && info.status < 500) return false
  return failureCount < MAX_RETRIES
}
```

`apps/extension/src/queries/query-client.ts` (stan po tym zadaniu)

```ts
import { QueryClient } from '@tanstack/vue-query'
import { shouldRetry } from '@/api/api-error'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry },
    },
  })
}
```

`apps/extension/src/queries/me.ts`

```ts
import { useQuery } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { apiClient } from '@/api/client'

export const meKey = ['me'] as const

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: () => parseResponse(apiClient.api.me.$get()) })
}
```

`apps/extension/src/entrypoints/newtab/main.ts` (stan po tym zadaniu)

```ts
import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { loadSession } from '@/api/session'
import { i18n } from '@/i18n'
import { createQueryClient } from '@/queries/query-client'
import App from './App.vue'
import '~/assets/main.css'

const queryClient = createQueryClient()

// Read the token before the first render, so a signed-in user never sees the sign-in screen flash
loadSession().then(() => {
  createApp(App).use(ui).use(i18n).use(VueQueryPlugin, { queryClient }).mount('#app')
})
```

`apps/extension/src/features/home/HomeScreen.vue` (początek `<script setup>`; `signOut` i szablon bez zmian poza `me.name`)

```ts
import { useI18n } from 'vue-i18n'
import { endSession } from '@/api/session'
import { useApiHealth } from '@/api/use-api-health'
import { useMe } from '@/queries/me'

const { t } = useI18n()
const { health } = useApiHealth()
const { data: me } = useMe()
```

```vue
<h1 v-if="me" class="text-2xl font-semibold text-highlighted">
  {{ t('home.greeting', { name: me.name }) }}
</h1>
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego 4xx nie są ponawiane?** Odpowiedź 400, 404 czy 422 zależy od danych żądania, a nie od chwilowej awarii. Ponowienie dałoby ten sam wynik, a przy 401 opóźniłoby przejście na ekran logowania.
2. **Skąd TanStack Query wie, że trzeba ponowić?** Ze zwykłego wyjątku w `queryFn`. Funkcja `retry` dostaje liczbę dotychczasowych porażek i błąd, a zwraca `true` albo `false`.
3. **Co się stało z ręcznym `onMounted` w `HomeScreen`?** Zastąpiło go zapytanie z kluczem `['me']`. Wynik trafia do cache, który w zadaniu 8 przetrwa przeładowanie karty, a kolejne komponenty z tym samym kluczem nie wyślą drugiego żądania.

</details>

---

## Zadanie 8: cache zapytań w `chrome.storage.local`

**Cel:** po przeładowaniu karty dane są dostępne od pierwszego renderu (F-SYNC-01). Cache po zmianie kształtu danych jest odrzucany (F-SYNC-07), przetrwa niedziałające API, a przy wylogowaniu znika ze wszystkich kart (F-AUTH-04).

**Czego się nauczysz:** persister TanStack Query (`persistQueryClientRestore`, `persistQueryClientSubscribe`), `buster` i `maxAge`, throttling zapisu, `dehydrateOptions`, `gcTime`, odtworzenie stanu przed zamontowaniem aplikacji.

**Pliki:**

- Utwórz: `apps/extension/src/queries/cache.ts`
- Zmień: `apps/extension/src/queries/query-client.ts`, `apps/extension/src/entrypoints/newtab/main.ts`, `apps/extension/package.json`
- Test: `apps/extension/src/queries/cache.test.ts`

**Interfejsy:**

- Korzysta z: `createQueryClient()` (zadanie 7), `session.token` (Etap 1), `storage` z WXT.
- Wytwarza: `CACHE_SCHEMA_VERSION`, `CACHE_MAX_AGE`, `CACHE_KEY`, `restoreCache(queryClient)`, `persistCache(queryClient)` i `clearCache(queryClient)`. Zadanie 10 dopisze w `main.ts` reset store'u przy wylogowaniu.

**Kroki:**

- [x] **1. Zależności.** `pnpm --filter @one-place/extension add @tanstack/query-persist-client-core@^5 @tanstack/query-async-storage-persister@^5`
- [x] **2. Czerwone testy** w `src/queries/cache.test.ts` (z `fakeBrowser.reset()` przed każdym). „Nowa karta” to nowy `QueryClient`, w którym wywołujesz `restoreCache`:
  - dane zapisane przez jedną kartę (`persistCache` i `setQueryData(['contexts'], …)`) nowa karta odtwarza;
  - cache z innym `buster` nowa karta odrzuca, a klucz znika ze storage;
  - uszkodzony cache (`'{not json'`) nie przerywa startu i nie daje danych;
  - po `clearCache` dane znikają z pamięci karty, a nowa karta nic nie odtwarza, zarówno od razu, jak i po kolejnym zapisie.

  Persister zapisuje najwyżej raz na sekundę, więc czekaj na zapis przez `vi.waitFor(…, { timeout: 3000 })`. Oczekiwany wynik: **FAIL**.

- [x] **3. Implementacja** `src/queries/cache.ts`: persister z `createAsyncStoragePersister` na storage WXT (`local:` przed kluczem), `buster: CACHE_SCHEMA_VERSION`, `maxAge` 30 dni, `throttleTime: 1000`, `shouldDehydrateMutation: () => false` (decyzja 5). `restoreCache` łapie wyjątek, a `clearCache` woła `queryClient.clear()` i `persister.removeClient()`. Oczekiwany wynik: **PASS (25 testów w rozszerzeniu)**.
- [x] **4. Eksperyment: `gcTime`.** Dokumentacja TanStack Query zaleca `gcTime` co najmniej tak długi jak `maxAge` persistera. Ustaw w `createQueryClient()` `gcTime: CACHE_MAX_AGE` i uruchom testy. **Oczekiwany wynik:** `TimeoutOverflowWarning: 2592000000 does not fit into a 32-bit signed integer` i nieudane testy odtwarzania. Zastanów się, co się stało z odtworzonymi zapytaniami, zanim otworzysz wyjaśnienie. Potem ustaw `gcTime: Infinity`.
- [x] **5. Eksperyment: API nie działa.** Dopisz test: karta z zapisanymi kontekstami odświeża je nieudanie (`fetchQuery` z `queryFn`, który rzuca `TypeError`, i `retry: false`), potem zapisuje coś jeszcze (`setQueryData(['me'], …)`), a nowa karta nadal odtwarza konteksty. **Oczekiwany wynik: FAIL.** Zastanów się dlaczego, potem dodaj w `dehydrateOptions` `shouldDehydrateQuery: (query) => query.state.data !== undefined`. Oczekiwany wynik: **PASS (26 testów w rozszerzeniu)**.
- [x] **6. Start aplikacji.** W `main.ts`: `await Promise.all([loadSession(), restoreCache(queryClient)])`, potem `persistCache(queryClient)`, `watch(session.token, …)`, który przy braku tokenu woła `clearCache`, i dopiero na końcu `mount`.
- [ ] **7. Sprawdzenie ręczne** (`pnpm dev`, zalogowany):
  - DevTools karty → Application → Extension storage → Local: klucz `one-place:query-cache` zawiera zapytanie `["me"]`;
  - zatrzymaj API i przeładuj kartę: powitanie jest od razu, a plakietka pokazuje `unreachable`;
  - odczekaj 10 sekund (ponowienia się skończą) i otwórz nową kartę: powitanie nadal jest;
  - uruchom API i wyloguj się: w `one-place:query-cache` nie ma żadnych zapytań (zostaje najwyżej pusta lista `queries`).
- [x] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): persist the query cache in chrome.storage.local`.

**Pułapki (sprawdzone na prototypie):**

- **Odtwórz cache przed `mount`.** `VueQueryPlugin` ma opcję `clientPersister`, ale odtwarza cache dopiero po zainstalowaniu pluginu. Do tego czasu zapytania czekają w stanie `isRestoring`, więc pierwszy render byłby bez danych, ze szkieletami. Ręczne `persistQueryClientRestore` przed `mount` daje dane już w pierwszym renderze.
- **Throttling to kompromis.** Zapis następuje najwyżej raz na sekundę. Przeładowanie karty zaraz po zmianie może odtworzyć cache sprzed tej zmiany. Nic nie ginie, bo dane i tak odświeżą się z serwera, ale przy sprawdzaniu „pulpit bez szkieletów” odczekaj sekundę przed przeładowaniem.
- **Czyść przy aktywnej subskrypcji.** Throttle zapisuje zawsze **ostatnie** podane dane. `queryClient.clear()` przy aktywnej subskrypcji podmienia zaplanowany zapis na pusty cache. Gdybyś najpierw wyłączył subskrypcję, zapis zaplanowany przed wylogowaniem mógłby po `removeClient()` przywrócić dane poprzedniego użytkownika.
- **`removeClient()` mimo subskrypcji.** Bez niego test nadal przejdzie, bo pusty cache zapisze się po sekundzie. Ale gdy karta zamknie się w tej sekundzie, w storage zostałyby stare dane. Sprawdzenie „od razu” w ostatnim teście pilnuje właśnie tego.
- **Wylogowanie w innej karcie.** `watch(session.token, …)` działa w każdej karcie, bo `tokenItem.watch` z Etapu 1 zmienia `session.token` po zmianie w storage. Każda karta czyści więc własną pamięć i nie zapisze starych danych z powrotem.

<details>
<summary>Wyjaśnienie eksperymentów (otwórz po kroku 5)</summary>

- **Krok 4.** `gcTime` to czas, po którym zapytanie bez obserwatorów zostaje usunięte z pamięci. TanStack Query odmierza go przez `setTimeout`, a ten przyjmuje najwyżej 2³¹−1 ms, czyli około 24,8 dnia. 30 dni to 2 592 000 000 ms, więc Node i przeglądarka zamieniają czas na 1 ms. Odtworzone zapytania znikają wtedy niemal natychmiast, a przy następnym zapisie znikają też ze storage. `Infinity` wyłącza odliczanie: zapytanie żyje, dopóki karta jest otwarta.
- **Krok 5.** Domyślnie zapisywane są tylko zapytania w stanie `success`. Nieudane odświeżenie zmienia stan na `error`, choć dane z poprzedniego pobrania zostają w pamięci. Przy kolejnym zapisie takie zapytanie wypada z cache. Gdy API nie działa dłużej, następna karta otworzyłaby się bez danych, ze szkieletami. Warunek `data !== undefined` zapisuje każde zapytanie, które ma dane.

</details>

<details>
<summary>Podpowiedź</summary>

- Persister potrzebuje obiektu z `getItem`, `setItem` i `removeItem`. Storage WXT ma odpowiedniki: `storage.getItem<string>('local:…')`, `storage.setItem(…)` i `storage.removeItem(…)`.
- `persistQueryClientRestore` i `persistQueryClientSubscribe` przyjmują te same opcje, więc zbuduj je w jednej funkcji `options(queryClient)`.
- `persistQueryClientRestore` przy uszkodzonym cache usuwa go i rzuca wyjątek dalej. Bez `try`/`catch` w `restoreCache` aplikacja w ogóle by się nie zamontowała.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/cache.test.ts`

```ts
import type { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { CACHE_KEY, clearCache, persistCache, restoreCache } from './cache'
import { createQueryClient } from './query-client'

const contexts = [{ id: '1', name: 'Praca' }]

// What a new tab opened right now would find in the saved cache
async function restoredInNewTab(queryKey: string[]) {
  const newTab = createQueryClient()
  await restoreCache(newTab)
  return newTab.getQueryData(queryKey)
}

// The persister saves at most once per second, so wait for the save
function eventually(assertion: () => Promise<void>) {
  return vi.waitFor(assertion, { timeout: 3000, interval: 100 })
}

async function tabWithSavedContexts() {
  const tab = createQueryClient()
  persistCache(tab)
  tab.setQueryData(['contexts'], contexts)
  await eventually(async () => expect(await restoredInNewTab(['contexts'])).toEqual(contexts))
  return tab
}

function failRefetch(tab: QueryClient) {
  return tab
    .fetchQuery({
      queryKey: ['contexts'],
      queryFn: () => Promise.reject(new TypeError('Failed to fetch')),
      retry: false,
    })
    .catch(() => {})
}

describe('query cache in chrome.storage.local', () => {
  beforeEach(() => {
    fakeBrowser.reset()
  })

  it('restores data saved by a previous tab', async () => {
    await tabWithSavedContexts()
  })

  it('keeps cached data when a refetch fails, e.g. while the API is down', async () => {
    const tab = await tabWithSavedContexts()
    await failRefetch(tab)
    tab.setQueryData(['me'], { name: 'Bartek' })
    await eventually(async () => expect(await restoredInNewTab(['me'])).toBeDefined())
    expect(await restoredInNewTab(['contexts'])).toEqual(contexts)
  })

  it('drops a cache saved by a version with a different data shape', async () => {
    await tabWithSavedContexts()
    const { [CACHE_KEY]: saved } =
      await fakeBrowser.storage.local.get<Record<string, string>>(CACHE_KEY)
    await fakeBrowser.storage.local.set({
      [CACHE_KEY]: JSON.stringify({ ...JSON.parse(saved!), buster: '0' }),
    })
    expect(await restoredInNewTab(['contexts'])).toBeUndefined()
    expect(await fakeBrowser.storage.local.get(CACHE_KEY)).toEqual({})
  })

  it('ignores a damaged cache instead of failing to start', async () => {
    await fakeBrowser.storage.local.set({ [CACHE_KEY]: '{not json' })
    expect(await restoredInNewTab(['contexts'])).toBeUndefined()
  })

  it('removes all data from memory and storage on sign-out', async () => {
    const tab = await tabWithSavedContexts()
    await clearCache(tab)
    expect(tab.getQueryData(['contexts'])).toBeUndefined()
    // At once, in case the tab closes before the next throttled save
    expect(await restoredInNewTab(['contexts'])).toBeUndefined()
    await eventually(async () => expect(await restoredInNewTab(['contexts'])).toBeUndefined())
  })
})
```

`apps/extension/src/queries/cache.ts`

```ts
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import {
  type PersistQueryClientOptions,
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/query-persist-client-core'
import type { QueryClient } from '@tanstack/vue-query'
import { storage } from 'wxt/utils/storage'

// F-SYNC-07: bump it whenever the shape of cached data changes. A cache saved with another
// value is thrown away, and the data is fetched again.
export const CACHE_SCHEMA_VERSION = '1'
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 30
export const CACHE_KEY = 'one-place:query-cache'

const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => storage.getItem<string>(`local:${key}`),
    setItem: (key, value) => storage.setItem(`local:${key}`, value),
    removeItem: (key) => storage.removeItem(`local:${key}`),
  },
  key: CACHE_KEY,
  throttleTime: 1000,
})

function options(queryClient: QueryClient): PersistQueryClientOptions {
  return {
    queryClient,
    persister,
    buster: CACHE_SCHEMA_VERSION,
    maxAge: CACHE_MAX_AGE,
    dehydrateOptions: {
      // By default only queries in the 'success' state are saved. A failed refetch (API down)
      // switches a query to 'error' but keeps its data, which must stay in the cache.
      shouldDehydrateQuery: (query) => query.state.data !== undefined,
      // A change made offline is lost when the tab closes (known MVP limitation)
      shouldDehydrateMutation: () => false,
    },
  }
}

export async function restoreCache(queryClient: QueryClient) {
  try {
    await persistQueryClientRestore(options(queryClient))
  } catch {
    // The damaged cache is already removed. Start without it.
  }
}

export function persistCache(queryClient: QueryClient) {
  return persistQueryClientSubscribe(options(queryClient))
}

// F-AUTH-04. The subscription stays on, so the last save (throttled) writes the empty cache
// and cannot bring back data saved before.
export async function clearCache(queryClient: QueryClient) {
  queryClient.clear()
  await persister.removeClient()
}
```

`apps/extension/src/queries/query-client.ts`

```ts
import { QueryClient } from '@tanstack/vue-query'
import { shouldRetry } from '@/api/api-error'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // A query nobody watches is removed after gcTime (5 minutes by default), and then it is
        // also gone from the saved cache. CACHE_MAX_AGE (30 days) does not fit into setTimeout
        // (max about 24.8 days) and would become 1 ms, so the cache is never collected.
        gcTime: Infinity,
      },
    },
  })
}
```

`apps/extension/src/entrypoints/newtab/main.ts` (stan po tym zadaniu)

```ts
import { createApp, watch } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { loadSession, session } from '@/api/session'
import { i18n } from '@/i18n'
import { clearCache, persistCache, restoreCache } from '@/queries/cache'
import { createQueryClient } from '@/queries/query-client'
import App from './App.vue'
import '~/assets/main.css'

const queryClient = createQueryClient()

async function start() {
  // Before the first render: the token decides between the dashboard and the sign-in screen,
  // and the restored cache lets the dashboard appear at once (F-SYNC-01)
  await Promise.all([loadSession(), restoreCache(queryClient)])
  persistCache(queryClient)
  // F-AUTH-04: sign-out in this tab, in another tab or after a 401 removes all cached data
  watch(session.token, (token) => {
    if (!token) void clearCache(queryClient)
  })
  createApp(App).use(ui).use(i18n).use(VueQueryPlugin, { queryClient }).mount('#app')
}

void start()
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Kiedy zmienić `CACHE_SCHEMA_VERSION`?** Gdy zmienia się kształt danych w cache, np. w Etapie 5 do `SettingsDto` dojdzie `theme`. Nowa wersja rozszerzenia odrzuci wtedy stary cache i pobierze dane od nowa, zamiast renderować obiekty bez nowego pola (F-SYNC-07).
2. **Dwie otwarte karty zapisują ten sam klucz. Czy to problem?** Nie. Obie trzymają kopię tych samych danych z serwera. Wygrywa późniejszy zapis, a każda karta i tak odświeża dane przy powrocie do niej.
3. **Dlaczego mutacje nie są zapisywane?** Odtworzona wstrzymana mutacja potrzebowałaby zarejestrowanej funkcji (`setMutationDefaults`), żeby się wznowić po restarcie. To krok w stronę trwałej kolejki offline, którą roadmapa odkłada na później (R7). W MVP zmiana offline czeka tylko w otwartej karcie.

</details>

---

## Zadanie 9: `useContexts()` i mutacje optymistyczne

**Cel:** lista kontekstów pochodzi z jednego zapytania, a tworzenie, zmiana i usuwanie są optymistyczne. UI zmienia się od razu, a gdy API odrzuci zmianę, cache wraca do poprzedniego stanu (F-SYNC-04).

**Czego się nauczysz:** `useMutation` (`onMutate`, `onError`, `onSuccess`), `cancelQueries`, `setQueryData`, testowanie composables poza komponentem (`app.runWithContext`), `vi.mock` z `vi.hoisted`, sortowanie zgodne z bazą.

**Pliki:**

- Utwórz: `apps/extension/src/queries/optimistic.ts`, `apps/extension/src/queries/contexts.ts`, `apps/extension/src/queries/testing.ts`
- Test: `apps/extension/src/queries/contexts.test.ts`

**Interfejsy:**

- Korzysta z: `ContextDto`, `CreateContextInput`, `UpdateContextInput` (zadanie 1), tras `contexts` (zadania 5 i 6), `apiErrorInfo` (zadanie 7).
- Wytwarza: `contextsKey`, `useContexts()`, `useCreateContext()`, `useUpdateContext()` (przyjmuje `{ id, ...zmiany }`), `useDeleteContext()` (przyjmuje `id`), `changeOptimistically(queryClient, key, change)` → funkcja cofająca, pomocniki testowe `withQueryClient`, `jsonResponse` i `deferred`. Używają ich zadania 10–13.

**Kroki:**

- [ ] **1. Pomocniki testowe** `src/queries/testing.ts`:
  - `withQueryClient(queryClient, composable)` uruchamia composable tak, jakby był w `setup()`: `createApp({}).use(VueQueryPlugin, { queryClient })`, a potem `effectScope().run(() => app.runWithContext(composable))`;
  - `jsonResponse(status, body)`;
  - `deferred()` daje obietnicę, którą test rozwiązuje, kiedy chce, np. po sprawdzeniu stanu pośredniego.
- [ ] **2. Czerwone testy tworzenia** w `src/queries/contexts.test.ts`. `vi.mock('@/api/client', …)` podmienia `apiClient.api.contexts.$post` (oraz `[':id'].$patch` i `$delete`) na `vi.fn()`. W cache są `Praca` (`a0`) i `Dom` (`a1`):
  - po `mutateAsync` nowy kontekst jest w cache, **zanim** API odpowie, a po odpowiedzi 201 zostaje podmieniony na rekord z serwera;
  - gdy API odpowie 422, mutacja się nie udaje, a cache wraca do `['Praca', 'Dom']`.

  Oczekiwany wynik: **FAIL**.

- [ ] **3. Implementacja:** `changeOptimistically` w `optimistic.ts`, a w `contexts.ts` `useContexts` i `useCreateContext`. Lista w cache jest zawsze posortowana tak samo jak w API. Oczekiwany wynik: **PASS (28 testów w rozszerzeniu)**.
- [ ] **4. Czerwone testy zmiany i usuwania:**
  - przesunięcie `Dom` na pozycję `Zz` ustawia go od razu przed `Praca` i tak zostaje po odpowiedzi;
  - nieudana zmiana nazwy (`TypeError: Failed to fetch`) przywraca `['Praca', 'Dom']`;
  - `DELETE` z odpowiedzią 404 usuwa kontekst z cache i kończy mutację sukcesem.
- [ ] **5. Implementacja** `useUpdateContext` i `useDeleteContext`. Oczekiwany wynik: **PASS (31 testów w rozszerzeniu)**.
- [ ] **6. Sprawdź sortowanie.** Zamień na chwilę porównanie pozycji na `a.position.localeCompare(b.position)`. Oczekiwany wynik: test przesunięcia **FAIL**. Przywróć porównanie bajtowe.
- [ ] **7.** `pnpm format && pnpm check`, potem commit: `feat(extension): add context queries with optimistic mutations`.

**Pułapki (sprawdzone na prototypie):**

- **`cancelQueries` przed zapamiętaniem stanu.** Gdy w tle trwa pobieranie listy, jego odpowiedź przyszłaby po zmianie optymistycznej i nadpisałaby ją starymi danymi.
- **Wynik `onMutate` trafia do `onError` jako trzeci argument.** Tutaj to funkcja cofająca z `changeOptimistically`, stąd `onError: (_error, _input, rollback) => rollback?.()`.
- **Porównanie bajtowe zamiast `localeCompare`.** `localeCompare` porównuje według języka, tak jak kolacja `en_US.utf8`, i stawia `Zz` za `a0`. Zwykłe `<` na tekstach z samych liter i cyfr ASCII daje tę samą kolejność co `COLLATE "C"`. Przy równych pozycjach decyduje `id`, tak jak w API.
- **404 przy usuwaniu to sukces.** Kontekst usunięty wcześniej na innym urządzeniu daje 404. Cofnięcie przywróciłoby na liście coś, czego już nie ma.
- **`vi.mock` jest przenoszony na początek pliku.** Zmienne użyte w fabryce mocka twórz przez `vi.hoisted(() => …)`, inaczej fabryka zobaczy je jako niezainicjalizowane.

<details>
<summary>Podpowiedź</summary>

- `changeOptimistically`: `await queryClient.cancelQueries({ queryKey })`, potem `getQueryData`, `setQueryData(queryKey, change(previous))` i zwrot `() => queryClient.setQueryData(queryKey, previous)`.
- Wspólna funkcja `withContext(list, context)` usuwa z listy rekord o tym samym `id`, dopisuje nowy i sortuje. Przyda się w `onMutate` i w `onSuccess`.
- Szkic kontekstu w `onMutate`: `{ ...input, createdAt: now, updatedAt: now, version: 1 }`. Rekord z serwera podmieni go w `onSuccess`.
- `deferred()`: `let resolve!: (value: T) => void` i `new Promise((done) => { resolve = done })`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/testing.ts`

```ts
import { type QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp, effectScope } from 'vue'

// Runs a composable that uses useQueryClient() outside a component, as if inside setup()
export function withQueryClient<T>(queryClient: QueryClient, composable: () => T): T {
  const app = createApp({}).use(VueQueryPlugin, { queryClient })
  return effectScope().run(() => app.runWithContext(composable))!
}

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// A promise that the test resolves when it wants, e.g. to look at the state in between
export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
```

`apps/extension/src/queries/optimistic.ts`

```ts
import type { QueryClient, QueryKey } from '@tanstack/vue-query'

// The first step of an optimistic change (F-SYNC-04). Cancels running fetches of the key, so a
// late response cannot overwrite the change, applies the change to the cached data, and returns
// a function that brings back the data from before the change.
export async function changeOptimistically<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  change: (data: T) => T,
) {
  await queryClient.cancelQueries({ queryKey })
  const previous = queryClient.getQueryData<T>(queryKey)
  if (previous !== undefined) queryClient.setQueryData<T>(queryKey, change(previous))
  return () => queryClient.setQueryData(queryKey, previous)
}
```

`apps/extension/src/queries/contexts.ts`

```ts
import type { ContextDto, CreateContextInput, UpdateContextInput } from '@one-place/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { apiErrorInfo } from '@/api/api-error'
import { apiClient } from '@/api/client'
import { changeOptimistically } from './optimistic'

export const contextsKey = ['contexts'] as const

// The same order as the API: byte order (COLLATE "C"), then the id. localeCompare() would put
// 'Zz' after 'a0'.
function byPosition(a: ContextDto, b: ContextDto) {
  if (a.position !== b.position) return a.position < b.position ? -1 : 1
  return a.id < b.id ? -1 : 1
}

// Adds the context or replaces the one with the same id, keeping the list sorted
function withContext(list: ContextDto[], context: ContextDto) {
  return [...list.filter((item) => item.id !== context.id), context].sort(byPosition)
}

export function useContexts() {
  return useQuery({
    queryKey: contextsKey,
    queryFn: () => parseResponse(apiClient.api.contexts.$get()),
  })
}

export function useCreateContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateContextInput) =>
      parseResponse(apiClient.api.contexts.$post({ json: input })),
    onMutate: (input) => {
      const now = new Date().toISOString()
      const draft: ContextDto = { ...input, createdAt: now, updatedAt: now, version: 1 }
      return changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) =>
        withContext(list, draft),
      )
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<ContextDto[]>(contextsKey, (list = []) => withContext(list, saved)),
  })
}

export function useUpdateContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...changes }: UpdateContextInput & { id: string }) =>
      parseResponse(apiClient.api.contexts[':id'].$patch({ param: { id }, json: changes })),
    onMutate: ({ id, ...changes }) =>
      changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) => {
        const current = list.find((item) => item.id === id)
        return current ? withContext(list, { ...current, ...changes }) : list
      }),
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<ContextDto[]>(contextsKey, (list = []) => withContext(list, saved)),
  })
}

export function useDeleteContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await parseResponse(apiClient.api.contexts[':id'].$delete({ param: { id } }))
      } catch (error) {
        // Already deleted, e.g. on another device. What the user wanted has happened.
        if (apiErrorInfo(error)?.status !== 404) throw error
      }
    },
    onMutate: (id) =>
      changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) =>
        list.filter((item) => item.id !== id),
      ),
    onError: (_error, _id, rollback) => rollback?.(),
  })
}
```

`apps/extension/src/queries/contexts.test.ts`

```ts
import type { ContextDto } from '@one-place/shared'
import { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { contextsKey, useCreateContext, useDeleteContext, useUpdateContext } from './contexts'
import { deferred, jsonResponse, withQueryClient } from './testing'

const api = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))

vi.mock('@/api/client', () => ({
  apiClient: {
    api: {
      contexts: {
        $post: api.post,
        ':id': { $patch: api.patch, $delete: api.delete },
      },
    },
  },
}))

function context(overrides: Partial<ContextDto>): ContextDto {
  return {
    id: 'id',
    name: 'Praca',
    icon: 'i-lucide-briefcase',
    position: 'a0',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
    ...overrides,
  }
}

const work = context({ id: 'work', name: 'Praca', position: 'a0' })
const home = context({ id: 'home', name: 'Dom', position: 'a1' })

let queryClient: QueryClient

function cachedNames() {
  return queryClient.getQueryData<ContextDto[]>(contextsKey)?.map((item) => item.name)
}

beforeEach(() => {
  vi.resetAllMocks()
  queryClient = new QueryClient()
  queryClient.setQueryData(contextsKey, [work, home])
})

describe('useCreateContext', () => {
  it('shows the new context at once and then replaces it with the saved one', async () => {
    const response = deferred<Response>()
    api.post.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useCreateContext)
    const input = { id: 'new', name: 'Hobby', icon: 'i-lucide-music', position: 'a2' } as const

    const saving = mutateAsync(input)
    await vi.waitFor(() => expect(cachedNames()).toEqual(['Praca', 'Dom', 'Hobby']))

    const saved = context({ ...input, version: 1, createdAt: '2026-10-12T08:00:00.000Z' })
    response.resolve(jsonResponse(201, saved))
    await saving
    expect(queryClient.getQueryData<ContextDto[]>(contextsKey)?.[2]).toEqual(saved)
  })

  it('removes the new context when the API rejects it', async () => {
    api.post.mockResolvedValue(
      jsonResponse(422, { error: { code: 'LIMIT_EXCEEDED', message: 'Too many contexts' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useCreateContext)
    const input = { id: 'new', name: 'Hobby', icon: 'i-lucide-music', position: 'a2' } as const
    await expect(mutateAsync(input)).rejects.toThrow()
    expect(cachedNames()).toEqual(['Praca', 'Dom'])
  })
})

describe('useUpdateContext', () => {
  it('keeps the list sorted by position after a move', async () => {
    const response = deferred<Response>()
    api.patch.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useUpdateContext)

    // 'Zz' sorts before 'a0' only in byte order
    const saving = mutateAsync({ id: 'home', position: 'Zz' })
    await vi.waitFor(() => expect(cachedNames()).toEqual(['Dom', 'Praca']))

    response.resolve(jsonResponse(200, { ...home, position: 'Zz', version: 2 }))
    await saving
    expect(cachedNames()).toEqual(['Dom', 'Praca'])
  })

  it('brings back the old name when the API rejects the change', async () => {
    api.patch.mockRejectedValue(new TypeError('Failed to fetch'))
    const { mutateAsync } = withQueryClient(queryClient, useUpdateContext)
    await expect(mutateAsync({ id: 'work', name: 'Robota' })).rejects.toThrow()
    expect(cachedNames()).toEqual(['Praca', 'Dom'])
  })
})

describe('useDeleteContext', () => {
  it('treats a context deleted on another device as deleted', async () => {
    api.delete.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Context not found' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useDeleteContext)
    await mutateAsync('work')
    expect(cachedNames()).toEqual(['Dom'])
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Po co podmieniać rekord na wersję z serwera, skoro szkic ma te same pola?** Szkic ma czas z zegara przeglądarki i `version: 1` wpisane na sztywno. Serwer zwraca prawdziwe `createdAt`, `updatedAt` i `version`, a przy `PATCH` także nazwę po przycięciu.
2. **Dwie zmiany idą jedna po drugiej, a pierwsza się nie udaje. Co widzi użytkownik?** Cofnięcie przywraca stan sprzed pierwszej zmiany, więc na chwilę znika też druga. Gdy druga się powiedzie, `onSuccess` wstawia jej rekord z powrotem, a pełną zgodność przywraca następne odświeżenie listy. W MVP to akceptowalne: konflikty rozstrzyga reguła „ostatni zapis wygrywa” (F-SYNC-06).
3. **Dlaczego mutacja nie potrzebuje tymczasowego ID?** ID generuje rozszerzenie (UUIDv7) jeszcze przed wysłaniem żądania. Szkic i rekord z serwera mają ten sam `id`, więc nie trzeba niczego przepinać, gdy przyjdzie odpowiedź (decyzja D10).

</details>

---

## Zadanie 10: `stores/ui.ts` z aktywnym kontekstem (Pinia)

**Cel:** każde urządzenie pamięta swój aktywny kontekst. Gdy zapamiętany kontekst nie istnieje, aktywny jest pierwszy z listy (F-CTX-04). Wylogowanie zapomina wybór.

**Czego się nauczysz:** Pinia w wariancie setup store, store poza komponentem (`useUiStore(pinia)`), peer dependencies w pnpm, czysta funkcja zamiast logiki w store.

**Pliki:**

- Utwórz: `apps/extension/src/stores/ui.ts`, `apps/extension/src/features/contexts/active-context.ts`
- Zmień: `apps/extension/src/entrypoints/newtab/main.ts`, `apps/extension/package.json`
- Test: `apps/extension/src/stores/ui.test.ts`, `apps/extension/src/features/contexts/active-context.test.ts`

**Interfejsy:**

- Korzysta z: `useContexts` (zadanie 9), `storage` z WXT.
- Wytwarza: `useUiStore()` z `activeContextId`, `load()`, `selectContext(id)` i `reset()`; `pickActiveContext(contexts, id)`; `useActiveContext()` → `computed` z aktywnym kontekstem albo `null`. Używają ich zadania 11 i 12.

**Kroki:**

- [ ] **1. Zależności.** `pnpm --filter @one-place/extension add pinia@^4`. Przeczytaj ostrzeżenie pnpm: `✕ unmet peer @vue/devtools-api@^8.1.5: found 6.6.4`. Potem `pnpm --filter @one-place/extension add -D @vue/devtools-api@^8`.
- [ ] **2. Czerwone testy store'u** w `src/stores/ui.test.ts` („nowa karta” to nowa instancja Pinia przez `setActivePinia(createPinia())`):
  - kontekst wybrany w jednej karcie nowa karta wczytuje przez `load()`;
  - po `reset()` wartość to `null`, także w nowej karcie.
- [ ] **3. Czerwone testy** `pickActiveContext` w `src/features/contexts/active-context.test.ts`:
  - zwraca zapamiętany kontekst;
  - gdy zapamiętanego nie ma na liście albo wartość to `null`, zwraca pierwszy;
  - dla pustej listy zwraca `null`.

  Oczekiwany wynik: **FAIL** obu plików.

- [ ] **4. Implementacja.** Store trzyma wartość w `ref` i w storage WXT (`local:activeContextId`). `active-context.ts` zawiera `pickActiveContext` i composable `useActiveContext()`, który łączy store z `useContexts()`. Oczekiwany wynik: **PASS (36 testów w rozszerzeniu)**.
- [ ] **5. Start aplikacji.** W `main.ts` utwórz `pinia` i `uiStore = useUiStore(pinia)`, dodaj `uiStore.load()` do `Promise.all`, w `watch` na token wołaj też `uiStore.reset()`, a w łańcuchu `createApp` dodaj `.use(pinia)`.
- [ ] **6.** `pnpm format && pnpm check`, potem commit: `feat(extension): add ui store with the active context`.

**Pułapki (sprawdzone na prototypie):**

- **Pinia 4 wymaga `@vue/devtools-api` w wersji 8.** Pakiet jest wymaganą peer dependency. vue-i18n i TanStack Query zależą od wersji 6, więc pnpm podpina 6.6.4 i tylko ostrzega. Jawna zależność dev z wersją 8 rozwiązuje konflikt.
- **Store poza komponentem potrzebuje instancji.** Pinia ustawia aktywną instancję dopiero w `app.use(pinia)`, więc `useUiStore()` bez argumentu w `main.ts` rzuca `"getActivePinia()" was called but there was no active Pinia`. `useUiStore(pinia)` wskazuje instancję wprost.
- **Store rozpakowuje `ref`.** Poza store'em czytasz `store.activeContextId`, a nie `store.activeContextId.value`.
- **Logika wyboru poza store'em.** `pickActiveContext` to czysta funkcja testowana bez Pinia i bez zapytań. Store przechowuje tylko to, co wybrał użytkownik.

<details>
<summary>Podpowiedź</summary>

- Setup store: `defineStore('ui', () => { const activeContextId = ref<string | null>(null); …; return { activeContextId, load, selectContext, reset } })`.
- `storage.defineItem<string | null>('local:activeContextId', { fallback: null })` ma `getValue`, `setValue` i `removeValue`, tak jak `tokenItem` z Etapu 1.
- `contexts.find(…) ?? contexts[0] ?? null`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/stores/ui.test.ts`

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { useUiStore } from './ui'

// A new Pinia instance is what a newly opened tab gets
function storeInNewTab() {
  setActivePinia(createPinia())
  return useUiStore()
}

describe('ui store', () => {
  beforeEach(() => {
    fakeBrowser.reset()
  })

  it('remembers the selected context for the next tab on this device', async () => {
    await storeInNewTab().selectContext('work')
    const nextTab = storeInNewTab()
    await nextTab.load()
    expect(nextTab.activeContextId).toBe('work')
  })

  it('forgets the selected context on reset', async () => {
    const store = storeInNewTab()
    await store.selectContext('work')
    await store.reset()
    expect(store.activeContextId).toBeNull()
    const nextTab = storeInNewTab()
    await nextTab.load()
    expect(nextTab.activeContextId).toBeNull()
  })
})
```

`apps/extension/src/stores/ui.ts`

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from 'wxt/utils/storage'

// F-CTX-04: each device remembers its own active context, so it is not saved on the account
const activeContextItem = storage.defineItem<string | null>('local:activeContextId', {
  fallback: null,
})

export const useUiStore = defineStore('ui', () => {
  const activeContextId = ref<string | null>(null)

  async function load() {
    activeContextId.value = await activeContextItem.getValue()
  }

  async function selectContext(id: string) {
    activeContextId.value = id
    await activeContextItem.setValue(id)
  }

  async function reset() {
    activeContextId.value = null
    await activeContextItem.removeValue()
  }

  return { activeContextId, load, selectContext, reset }
})
```

`apps/extension/src/features/contexts/active-context.test.ts`

```ts
import type { ContextDto } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { pickActiveContext } from './active-context'

const work = { id: 'work', name: 'Praca' } as ContextDto
const home = { id: 'home', name: 'Dom' } as ContextDto

describe('pickActiveContext', () => {
  it('returns the remembered context', () => {
    expect(pickActiveContext([work, home], 'home')).toBe(home)
  })

  it('falls back to the first context when the remembered one is gone', () => {
    expect(pickActiveContext([work, home], 'deleted-on-another-device')).toBe(work)
    expect(pickActiveContext([work, home], null)).toBe(work)
  })

  it('returns null when there are no contexts', () => {
    expect(pickActiveContext([], 'work')).toBeNull()
  })
})
```

`apps/extension/src/features/contexts/active-context.ts`

```ts
import type { ContextDto } from '@one-place/shared'
import { computed } from 'vue'
import { useContexts } from '@/queries/contexts'
import { useUiStore } from '@/stores/ui'

// F-CTX-04: the remembered context may no longer exist (e.g. deleted on another device)
export function pickActiveContext(contexts: ContextDto[], activeId: string | null) {
  return contexts.find((context) => context.id === activeId) ?? contexts[0] ?? null
}

export function useActiveContext() {
  const ui = useUiStore()
  const { data } = useContexts()
  return computed(() => pickActiveContext(data.value ?? [], ui.activeContextId))
}
```

`apps/extension/src/entrypoints/newtab/main.ts` (stan po tym zadaniu)

```ts
import { createApp, watch } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { loadSession, session } from '@/api/session'
import { i18n } from '@/i18n'
import { clearCache, persistCache, restoreCache } from '@/queries/cache'
import { createQueryClient } from '@/queries/query-client'
import { useUiStore } from '@/stores/ui'
import App from './App.vue'
import '~/assets/main.css'

const queryClient = createQueryClient()
const pinia = createPinia()
const uiStore = useUiStore(pinia)

async function start() {
  // Before the first render: the token decides between the dashboard and the sign-in screen,
  // and the restored cache and active context let the dashboard appear at once (F-SYNC-01)
  await Promise.all([loadSession(), restoreCache(queryClient), uiStore.load()])
  persistCache(queryClient)
  // F-AUTH-04: sign-out in this tab, in another tab or after a 401 removes all local data
  watch(session.token, (token) => {
    if (token) return
    void clearCache(queryClient)
    void uiStore.reset()
  })
  createApp(App).use(ui).use(i18n).use(pinia).use(VueQueryPlugin, { queryClient }).mount('#app')
}

void start()
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego aktywny kontekst nie jest zapisany na koncie?** F-CTX-04 wymaga, żeby każde urządzenie pamiętało własny wybór: w pracy „Praca”, w domu „Prywatne”. Zapis na koncie przełączałby wszystkie urządzenia naraz.
2. **Dlaczego otwarte karty nie przełączają się razem?** Decyzja 7: przełączenie w jednej karcie nie powinno zmieniać tego, na co patrzysz w drugiej. Wystarczy, że nowa karta otworzy się z ostatnim wyborem, a to daje odczyt storage przy starcie.
3. **Po co `load()` przed `mount`?** Bez tego pierwszy render pokazałby pierwszy kontekst z listy, a chwilę później zapamiętany, czyli widoczne mignięcie innego pulpitu.

</details>

---

## Zadanie 11: pulpit, pierwszy kontekst i przełącznik

**Cel:** po zalogowaniu widać pulpit. Bez cache pokazuje szkielety (F-SYNC-02), bez kontekstów formularz „Utwórz swój pierwszy kontekst” (F-CTX-01), a z kontekstami zakładki w nagłówku, które przełączają pulpit bez przeładowania (F-CTX-02, F-CTX-03).

**Czego się nauczysz:** stany zapytania w UI (brak danych, błąd, pusta lista), `UTabs`, `UForm` z własną walidacją z Etapu 1, `defineModel`, `uuid` v7 i `generateKeyBetween`, ikony w paczce, gdy ich nazwy pochodzą z danych.

**Pliki:**

- Utwórz: `apps/extension/src/features/contexts/positions.ts`, `use-add-context.ts`, `IconPicker.vue`, `ContextForm.vue`, `FirstContext.vue`, `ContextSwitcher.vue` (w `features/contexts/`), `apps/extension/src/features/dashboard/AppHeader.vue`, `DashboardScreen.vue`, `apps/extension/src/features/auth/sign-out.ts`
- Zmień: `apps/extension/src/entrypoints/newtab/App.vue`, `apps/extension/src/i18n/pl.json`, `en.json`, `apps/extension/wxt.config.ts`, `apps/extension/package.json`
- Usuń: `apps/extension/src/features/home/HomeScreen.vue`, `apps/extension/src/api/use-api-health.ts`
- Test: `apps/extension/src/features/contexts/positions.test.ts`

**Interfejsy:**

- Korzysta z: `ContextFormSchema`, `CONTEXT_ICONS` (zadanie 1), `useContexts`, `useCreateContext` (zadanie 9), `useUiStore`, `useActiveContext` (zadanie 10), `formErrors` i `endSession` (Etap 1).
- Wytwarza: `positionAfterLast(list)`, `positionAt(list, index)`, `useAddContext()` → funkcja `({ name, icon }) => void`, komponenty `ContextForm` (prop `submitLabel`, zdarzenie `submit`), `IconPicker` (`v-model`), `ContextSwitcher`, `AppHeader`, `DashboardScreen` oraz `signOut()`. Rozbudowują je zadania 12–15.

**Kroki:**

- [ ] **1. Zależności.** `pnpm --filter @one-place/extension add uuid@^14 fractional-indexing@^4`
- [ ] **2. Czerwone testy** w `src/features/contexts/positions.test.ts`:
  - `positionAfterLast([])` to `'a0'`, a po `a0` i `a1` wynik jest większy od `'a1'`;
  - `positionAt` dostaje listę **już w nowej kolejności** i indeks przesuniętego elementu: na początku daje klucz mniejszy od `'a0'`, w środku klucz między sąsiadami, a na końcu klucz większy od ostatniego;
  - sąsiedzi z tą samą pozycją (`['a1', 'a0', 'a1']`, indeks 1) nie powodują wyjątku.

  Oczekiwany wynik: **FAIL**.

- [ ] **3. Implementacja** `positions.ts`. Oczekiwany wynik: **PASS (41 testów w rozszerzeniu)**.
- [ ] **4. Teksty.** W `pl.json` i `en.json` dodaj grupy `contexts` (`first`, `fields`, `icons`) i `dashboard` oraz klucze `validation.contextNameRequired` i `validation.contextNameTooLong`. Usuń grupę `home`.
- [ ] **5. Wylogowanie jako funkcja.** Przenieś `signOut` z `HomeScreen.vue` do `features/auth/sign-out.ts`. Przyda się w nagłówku, a potem w ustawieniach.
- [ ] **6. Formularz kontekstu.** `IconPicker.vue`: siatka 16 przycisków z `role="radio"`, `aria-checked` i `aria-label` z `contexts.icons.*`. `ContextForm.vue`: `UForm` z `:validate="formErrors(ContextFormSchema, t)"`, nazwa i ikona, a przy wysyłce `emit('submit', ContextFormSchema.parse(state))` i czyszczenie nazwy.
- [ ] **7. Pierwszy kontekst.** `use-add-context.ts`: nowe `id` z `v7()`, pozycja z `positionAfterLast`, `mutate` z `useCreateContext` i od razu `ui.selectContext(id)` (F-CTX-02). `FirstContext.vue` to karta z tytułem, opisem i `ContextForm`.
- [ ] **8. Pulpit.** `ContextSwitcher.vue`: `UTabs` z `:content="false"`, wartością `active.id` i `selectContext` przy zmianie. `AppHeader.vue`: przełącznik (szkielet, gdy nie ma danych) i przycisk wylogowania. `DashboardScreen.vue`: nagłówek, a pod nim szkielety, błąd z przyciskiem „Spróbuj ponownie” (brak danych i błąd zapytania), `FirstContext` (ładowany leniwie) albo `UEmpty` z nazwą i ikoną aktywnego kontekstu.
- [ ] **9. Podłączenie.** W `App.vue` zamień `HomeScreen` na `DashboardScreen`. Usuń `HomeScreen.vue` i `use-api-health.ts`.
- [ ] **10. Eksperyment: ikony z danych.** Zbuduj rozszerzenie (`pnpm --filter @one-place/extension build`), załaduj `.output/chrome-mv3` jako rozpakowane rozszerzenie i załóż nowe konto. Na ekranie pierwszego kontekstu otwórz DevTools → Network. **Oczekiwany wynik:** żądania do `api.iconify.design/lucide.json?icons=book-open,briefcase,…` i `api.simplesvg.com/…`, mimo że w Etapie 0 ikony były w paczce. Zastanów się dlaczego, zanim otworzysz wyjaśnienie.
- [ ] **11. Poprawka.** W `wxt.config.ts` zaimportuj `CONTEXT_ICONS` z `@one-place/shared` i dodaj `icons: [...CONTEXT_ICONS]` do `icon.clientBundle`. Zbuduj i powtórz krok 10: żadnych żądań poza API.
- [ ] **12. Sprawdzenie ręczne** (`pnpm dev`):
  - nowe konto: na chwilę szkielety, potem „Utwórz swój pierwszy kontekst”;
  - pusty formularz: „Podaj nazwę kontekstu”;
  - nazwa `  Praca  `: zakładka „Praca” z ikoną i pusty pulpit „Tu pojawią się widgety.”;
  - odczekaj sekundę i przeładuj kartę: pulpit bez szkieletów; nowa karta tak samo;
  - wyloguj się i zaloguj ponownie: znowu pulpit z „Praca”.
- [ ] **13.** `pnpm format && pnpm check`, potem commit: `feat(extension): add dashboard with first context and switcher`.

**Pułapki (sprawdzone na prototypie):**

- **Zakładki przy 20 kontekstach.** `UTabs` w orientacji poziomej ma w korzeniu `flex-col items-center`, a lista ma `w-full`, więc zakładki się ściskają i ucinają nazwy. Po dodaniu `list: 'w-max'` i `trigger: 'shrink-0'` lista jest szersza od nagłówka i wyśrodkowana, więc jej lewa część wystaje poza obszar przewijania. Pomaga `root: 'items-start'` i `overflow-x-auto` na komponencie.
- **`FirstContext` ładuje się leniwie.** Sam komponent jest mały, ale ciągnie Zod (`formErrors`, `ContextFormSchema`) i komponenty formularza. To ta sama lekcja co z ekranem logowania w [zadaniu 11 Etapu 1](06-etap-1-logowanie.md#zadanie-11-budżet-rozmiaru-js).
- **`parse()` przed wysłaniem.** Przy `:validate` `UForm` oddaje stan bez przekształceń. `ContextFormSchema.parse(state)` przycina nazwę tak samo jak API, więc szkic optymistyczny wygląda od razu tak jak zapisany rekord.
- **`wxt.config.ts` może importować z `shared`.** WXT wczytuje konfigurację jako TypeScript, więc import z pakietu w workspace działa.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 10)</summary>

- Nuxt UI dołącza do paczki tylko te ikony, które znajdzie skaner. Skaner czyta pliki `*.vue`, `*.md`, `*.yml` i podobne w katalogu rozszerzenia i szuka w nich dosłownych nazw, np. `i-lucide-log-out`.
- Ikona kontekstu trafia do szablonu przez zmienną (`:icon="context.icon"`), a lista `CONTEXT_ICONS` jest w pliku `.ts` w innym pakiecie. Skaner nie ma jak jej znaleźć. W paczce była tylko `star`, bo jest wśród ikon używanych przez samo Nuxt UI.
- Brakującej ikony komponent `UIcon` szuka w API Iconify, a potem w serwerze zapasowym. To dokładnie ryzyko R2 z Etapu 0, tylko od innej strony, i złamanie wymagania „Prywatność”.
- `icon.clientBundle.icons` to jawna lista ikon do dołączenia, niezależna od skanera.

</details>

<details>
<summary>Podpowiedź</summary>

- `generateKeyBetween(a, b)` z `fractional-indexing` przyjmuje `null` jako „brak sąsiada”. Dla `a >= b` rzuca wyjątek, dlatego przy równych sąsiadach użyj `generateKeyBetween(before, null)`.
- `UTabs` przyjmuje `items` z polami `label`, `icon` i `value`, a `:content="false"` wyłącza panele treści.
- `defineModel<ContextIcon>({ required: true })` w `IconPicker` daje `v-model` bez ręcznego `emit`.
- Zapytanie bez danych i bez błędu to `!contexts && !isError`, czyli pierwszy start bez cache.

</details>

<details>
<summary>Rozwiązanie: pozycje i dodawanie</summary>

`apps/extension/src/features/contexts/positions.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { positionAfterLast, positionAt } from './positions'

const items = (...positions: string[]) => positions.map((position) => ({ position }))

describe('positionAfterLast', () => {
  it('starts with a0 and then goes after the last item', () => {
    expect(positionAfterLast([])).toBe('a0')
    expect(positionAfterLast(items('a0', 'a1')) > 'a1').toBe(true)
  })
})

describe('positionAt', () => {
  it('puts an item moved to the top before the first one', () => {
    // The list is already in the new order, the moved item is at index 0
    const position = positionAt(items('a2', 'a0', 'a1'), 0)
    expect(position < 'a0').toBe(true)
  })

  it('puts an item moved to the middle between its neighbours', () => {
    const position = positionAt(items('a0', 'a2', 'a1'), 1)
    expect(position > 'a0' && position < 'a1').toBe(true)
  })

  it('puts an item moved to the end after the last one', () => {
    expect(positionAt(items('a1', 'a2', 'a0'), 2) > 'a2').toBe(true)
  })

  it('does not throw when two neighbours have the same position', () => {
    // Two devices added a context at the same time, both after 'a0'
    expect(() => positionAt(items('a1', 'a0', 'a1'), 1)).not.toThrow()
  })
})
```

`apps/extension/src/features/contexts/positions.ts`

```ts
import { generateKeyBetween } from 'fractional-indexing'

interface Positioned {
  position: string
}

export function positionAfterLast(list: Positioned[]) {
  return generateKeyBetween(list.at(-1)?.position ?? null, null)
}

// `list` is already in the new order. Only the moved item gets a new position, between its
// new neighbours, so a move is a single PATCH.
export function positionAt(list: Positioned[], index: number) {
  const before = list[index - 1]?.position ?? null
  const after = list[index + 1]?.position ?? null
  // Equal neighbours (added on two devices at once) leave no room in between, and
  // generateKeyBetween() would throw. Going right after `before` is close enough.
  if (before !== null && after !== null && before >= after) {
    return generateKeyBetween(before, null)
  }
  return generateKeyBetween(before, after)
}
```

`apps/extension/src/features/contexts/use-add-context.ts`

```ts
import type { ContextFormInput } from '@one-place/shared'
import { v7 as uuidv7 } from 'uuid'
import { useContexts, useCreateContext } from '@/queries/contexts'
import { useUiStore } from '@/stores/ui'
import { positionAfterLast } from './positions'

export function useAddContext() {
  const { data: contexts } = useContexts()
  const { mutate } = useCreateContext()
  const ui = useUiStore()

  return ({ name, icon }: ContextFormInput) => {
    // The id is known before the API answers, so the optimistic context needs no temporary id
    const id = uuidv7()
    mutate({ id, name, icon, position: positionAfterLast(contexts.value ?? []) })
    // F-CTX-02: the new context goes to the end of the list and becomes active
    void ui.selectContext(id)
  }
}
```

`apps/extension/src/features/auth/sign-out.ts`

```ts
import { endSession } from '@/api/session'

export async function signOut() {
  try {
    // Loaded only now, so the new tab of a signed-in user does not download the auth client
    const { authClient } = await import('@/api/auth-client')
    await authClient.signOut()
  } catch {
    // API unreachable: the server session will expire on its own
  }
  // F-AUTH-04: the local session always ends
  await endSession()
}
```

</details>

<details>
<summary>Rozwiązanie: komponenty</summary>

`apps/extension/src/features/contexts/IconPicker.vue`

```vue
<script setup lang="ts">
import { CONTEXT_ICONS, type ContextIcon } from '@one-place/shared'
import { useI18n } from 'vue-i18n'

const model = defineModel<ContextIcon>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div role="radiogroup" class="grid grid-cols-8 gap-1">
    <UButton
      v-for="icon in CONTEXT_ICONS"
      :key="icon"
      role="radio"
      :aria-checked="model === icon"
      :aria-label="t(`contexts.icons.${icon.replace('i-lucide-', '')}`)"
      :icon="icon"
      :color="model === icon ? 'primary' : 'neutral'"
      :variant="model === icon ? 'solid' : 'ghost'"
      square
      @click="model = icon"
    />
  </div>
</template>
```

`apps/extension/src/features/contexts/ContextForm.vue`

```vue
<script setup lang="ts">
import { CONTEXT_ICONS, ContextFormSchema, type ContextFormInput } from '@one-place/shared'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { formErrors } from '@/i18n/form-errors'
import IconPicker from './IconPicker.vue'

defineProps<{ submitLabel: string }>()
const emit = defineEmits<{ submit: [values: ContextFormInput] }>()

const { t } = useI18n()
const state = reactive<ContextFormInput>({ name: '', icon: CONTEXT_ICONS[0] })
const validate = formErrors(ContextFormSchema, t)

function onSubmit() {
  // parse() trims the name, the same way the API will
  emit('submit', ContextFormSchema.parse(state))
  state.name = ''
}
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField name="name" :label="t('contexts.fields.name')">
      <UInput
        v-model="state.name"
        :placeholder="t('contexts.fields.namePlaceholder')"
        autofocus
        class="w-full"
      />
    </UFormField>
    <UFormField name="icon" :label="t('contexts.fields.icon')">
      <IconPicker v-model="state.icon" />
    </UFormField>
    <UButton type="submit" :label="submitLabel" block />
  </UForm>
</template>
```

`apps/extension/src/features/contexts/FirstContext.vue`

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ContextForm from './ContextForm.vue'
import { useAddContext } from './use-add-context'

const { t } = useI18n()
const addContext = useAddContext()
</script>

<template>
  <UCard class="mx-auto mt-16 w-full max-w-md">
    <template #header>
      <h1 class="text-xl font-semibold text-highlighted">{{ t('contexts.first.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ t('contexts.first.description') }}</p>
    </template>
    <ContextForm :submit-label="t('contexts.first.submit')" @submit="addContext" />
  </UCard>
</template>
```

`apps/extension/src/features/contexts/ContextSwitcher.vue` (stan po tym zadaniu)

```vue
<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { ContextDto } from '@one-place/shared'
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ contexts: ContextDto[]; active: ContextDto }>()
const ui = useUiStore()

const items = computed<TabsItem[]>(() =>
  props.contexts.map((context) => ({ label: context.name, icon: context.icon, value: context.id })),
)
</script>

<template>
  <UTabs
    :items="items"
    :model-value="active.id"
    :content="false"
    variant="link"
    :ui="{ root: 'items-start', list: 'w-max', trigger: 'shrink-0' }"
    class="min-w-0 overflow-x-auto"
    @update:model-value="(id) => void ui.selectContext(String(id))"
  />
</template>
```

`apps/extension/src/features/dashboard/AppHeader.vue` (stan po tym zadaniu)

```vue
<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import { signOut } from '@/features/auth/sign-out'
import ContextSwitcher from '@/features/contexts/ContextSwitcher.vue'

defineProps<{ contexts: ContextDto[] | undefined; active: ContextDto | null }>()
const { t } = useI18n()
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-default px-4">
    <USkeleton v-if="!contexts" class="h-8 w-40" />
    <ContextSwitcher v-else-if="active" :contexts="contexts" :active="active" />
    <span v-else />
    <UButton
      icon="i-lucide-log-out"
      :aria-label="t('auth.signOut')"
      color="neutral"
      variant="ghost"
      @click="signOut"
    />
  </header>
</template>
```

`apps/extension/src/features/dashboard/DashboardScreen.vue` (stan po tym zadaniu)

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useActiveContext } from '@/features/contexts/active-context'
import { useContexts } from '@/queries/contexts'
import AppHeader from './AppHeader.vue'

// Not needed for the first render, so its form (and Zod) stays out of the start-up bundle
const FirstContext = defineAsyncComponent(() => import('@/features/contexts/FirstContext.vue'))

const { t } = useI18n()
const { data: contexts, isError, refetch } = useContexts()
const active = useActiveContext()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-default text-default">
    <AppHeader :contexts="contexts" :active="active" />
    <main class="flex-1 space-y-4 p-4">
      <!-- F-SYNC-02: no cache yet, so skeletons until the first answer -->
      <template v-if="!contexts">
        <UAlert
          v-if="isError"
          color="error"
          variant="subtle"
          icon="i-lucide-cloud-off"
          :title="t('dashboard.loadError')"
          :actions="[{ label: t('dashboard.retry'), onClick: () => void refetch() }]"
        />
        <div v-else class="grid gap-4 sm:grid-cols-3">
          <USkeleton v-for="n in 3" :key="n" class="h-40" />
        </div>
      </template>
      <FirstContext v-else-if="contexts.length === 0" />
      <UEmpty
        v-else-if="active"
        :icon="active.icon"
        :title="active.name"
        :description="t('dashboard.empty')"
        class="mt-16"
      />
    </main>
  </div>
</template>
```

`apps/extension/src/entrypoints/newtab/App.vue` (zmienione linie)

```ts
import DashboardScreen from '@/features/dashboard/DashboardScreen.vue'
```

```vue
<DashboardScreen v-if="session.token.value" />
```

`apps/extension/wxt.config.ts` (nowy import i zmieniona opcja `icon` w `ui({ … })`; reszta bez zmian)

```ts
import { CONTEXT_ICONS } from '@one-place/shared'

// …
        // The scanner finds icons written in .vue files. Context icons come from data,
        // so they are listed here, otherwise they would be fetched from the Iconify API.
        icon: { clientBundle: { scan: true, icons: [...CONTEXT_ICONS] } },
```

</details>

<details>
<summary>Rozwiązanie: teksty</summary>

`apps/extension/src/i18n/pl.json` (nowe grupy; `home` usunięta, w `validation` dwa nowe klucze)

```json
"contexts": {
  "first": {
    "title": "Utwórz swój pierwszy kontekst",
    "description": "Kontekst to osobny pulpit, np. „Praca” albo „Prywatne”.",
    "submit": "Utwórz kontekst"
  },
  "fields": {
    "name": "Nazwa",
    "namePlaceholder": "np. Praca",
    "icon": "Ikona"
  },
  "icons": {
    "briefcase": "Teczka",
    "house": "Dom",
    "user": "Osoba",
    "heart": "Serce",
    "code": "Kod",
    "book-open": "Książka",
    "graduation-cap": "Nauka",
    "dumbbell": "Sport",
    "plane": "Podróże",
    "coffee": "Kawa",
    "music": "Muzyka",
    "gamepad-2": "Gry",
    "palette": "Sztuka",
    "wallet": "Finanse",
    "shopping-cart": "Zakupy",
    "star": "Gwiazdka"
  }
},
"dashboard": {
  "empty": "Tu pojawią się widgety.",
  "loadError": "Nie udało się wczytać danych.",
  "retry": "Spróbuj ponownie"
},
"validation": {
  "contextNameRequired": "Podaj nazwę kontekstu",
  "contextNameTooLong": "Nazwa może mieć najwyżej 40 znaków"
}
```

`apps/extension/src/i18n/en.json`

```json
"contexts": {
  "first": {
    "title": "Create your first context",
    "description": "A context is a separate dashboard, e.g. “Work” or “Personal”.",
    "submit": "Create context"
  },
  "fields": {
    "name": "Name",
    "namePlaceholder": "e.g. Work",
    "icon": "Icon"
  },
  "icons": {
    "briefcase": "Briefcase",
    "house": "House",
    "user": "Person",
    "heart": "Heart",
    "code": "Code",
    "book-open": "Book",
    "graduation-cap": "Learning",
    "dumbbell": "Sport",
    "plane": "Travel",
    "coffee": "Coffee",
    "music": "Music",
    "gamepad-2": "Games",
    "palette": "Art",
    "wallet": "Finance",
    "shopping-cart": "Shopping",
    "star": "Star"
  }
},
"dashboard": {
  "empty": "Your widgets will appear here.",
  "loadError": "Could not load your data.",
  "retry": "Try again"
},
"validation": {
  "contextNameRequired": "Enter a context name",
  "contextNameTooLong": "Name can be at most 40 characters long"
}
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co zobaczy użytkownik, gdy API odrzuci pierwszy kontekst?** Szkic zniknie z cache, lista wróci do pustej, więc znowu pojawi się formularz. Aktywny pozostanie zapamiętany identyfikator, ale `pickActiveContext` go pominie. Komunikat o cofnięciu dojdzie w zadaniu 12.
2. **Dlaczego `positionAt` dostaje listę po przesunięciu, a nie indeksy „skąd” i „dokąd”?** Biblioteka przeciągania i tak zmienia kolejność tablicy. Sąsiedzi przesuniętego elementu w nowej tablicy to dokładnie te klucze, między którymi ma trafić.
3. **Dlaczego w nagłówku są zakładki, a nie menu rozwijane?** Decyzja 8: menu rozwijane dokłada około 100 kB do startowego JS. Zakładki dają też przełączanie jednym kliknięciem. Pomiar zrobisz w zadaniu 15.

</details>

---

## Zadanie 12: zarządzanie kontekstami i toasty błędów

**Cel:** w oknie „Konteksty” można zmienić nazwę i ikonę, przeciągnąć kontekst na inne miejsce, dodać nowy i usunąć istniejący po potwierdzeniu (F-CTX-05 … F-CTX-07). Każda zmiana odrzucona przez API wraca do poprzedniego stanu z toastem (F-SYNC-04).

**Czego się nauczysz:** `vue-draggable-plus` na lokalnej kopii listy, `UModal` (także zagnieżdżony), `UPopover`, zapis pola przy Enter i utracie fokusu, subskrypcja `MutationCache`, `useToast` w composable.

**Pliki:**

- Utwórz: `apps/extension/src/features/errors/mutation-error.ts`, `apps/extension/src/features/errors/use-mutation-error-toasts.ts`, `apps/extension/src/features/contexts/ContextRow.vue`, `ManageContexts.vue`, `ManageContextsModal.vue`
- Zmień: `apps/extension/src/features/contexts/ContextSwitcher.vue`, `apps/extension/src/features/dashboard/AppHeader.vue`, `DashboardScreen.vue`, `apps/extension/src/i18n/pl.json`, `en.json`, `apps/extension/package.json`
- Test: `apps/extension/src/features/errors/mutation-error.test.ts`

**Interfejsy:**

- Korzysta z: `useUpdateContext`, `useDeleteContext` (zadanie 9), `positionAt`, `useAddContext`, `ContextForm`, `IconPicker` (zadanie 11), `apiErrorInfo` (zadanie 7), `ContextNameSchema` (zadanie 1).
- Wytwarza: `mutationErrorKey(error)` → klucz `errors.*` albo `null`, `useMutationErrorToasts()`, okno zarządzania otwierane przyciskiem obok zakładek. Zadanie 13 doda obok przycisk ustawień.

**Kroki:**

- [ ] **1. Zależność.** `pnpm --filter @one-place/extension add vue-draggable-plus@^0.6`
- [ ] **2. Czerwone testy** w `src/features/errors/mutation-error.test.ts` (błędy buduj przez `parseResponse` i `jsonResponse` z `queries/testing.ts`):
  - błąd sieci daje `errors.network`;
  - `LIMIT_EXCEEDED` daje `errors.limitExceeded`, `NOT_FOUND` daje `errors.notFound`, a 500 daje `errors.rejected`;
  - 401 daje `null`, bo ekran logowania sam wyjaśnia, co się stało.

  Oczekiwany wynik: **FAIL**.

- [ ] **3. Implementacja** `mutation-error.ts`. Oczekiwany wynik: **PASS (44 testy w rozszerzeniu)**.
- [ ] **4. Toasty.** `use-mutation-error-toasts.ts`: `useQueryClient().getMutationCache().subscribe(…)` i dla zdarzenia `updated` z akcją `error` toast `errors.changeReverted` z opisem z `mutationErrorKey`. Subskrypcję zamknij w `onScopeDispose`. Wywołaj composable w `DashboardScreen.vue`.
- [ ] **5. Wiersz kontekstu.** `ContextRow.vue`: uchwyt przeciągania (`i-lucide-grip-vertical` z klasą `drag-handle`), przycisk ikony z `UPopover` i `IconPicker`, `UInput` z nazwą (zapis przy Enter i utracie fokusu, pusta nazwa wraca do zapisanej) oraz przycisk usuwania.
- [ ] **6. Lista.** `ManageContexts.vue`: `VueDraggable` z `handle=".drag-handle"` na lokalnej kopii listy, `@update` liczy pozycję przez `positionAt` i woła `update`. Pod listą `ContextForm` z `useAddContext`. Usunięcie otwiera drugi `UModal` z pytaniem „Usunąć kontekst „{name}”?” i przyciskami „Anuluj” i „Usuń”.
- [ ] **7. Okno.** `ManageContextsModal.vue` to `UModal` z `ManageContexts` w treści. `DashboardScreen` ładuje go leniwie i montuje przy pierwszym otwarciu. `ContextSwitcher` dostaje przycisk `i-lucide-pencil` („Zarządzaj kontekstami”), który emituje `manage`, a `AppHeader` przekazuje zdarzenie dalej jako `manageContexts`.
- [ ] **8. Teksty:** `contexts.manage.*`, `contexts.delete.*` i grupa `errors`.
- [ ] **9. Sprawdzenie ręczne** (`pnpm dev`):
  - dodaj „Dom” i „Hobby”: każdy nowy kontekst od razu staje się aktywny;
  - wyczyść nazwę „Dom” i naciśnij Enter: pole wraca do „Dom”; wpisz „Dom i ogród”: zakładka zmienia się od razu;
  - zmień ikonę „Hobby” na nutę;
  - przeciągnij „Hobby” na górę listy, a potem sprawdź bazę: `docker compose exec db psql -U one one_place -c 'select name, position from contexts order by position'`. „Hobby” ma pozycję zaczynającą się od `Z` i jest pierwsze, mimo kolacji `en_US.utf8` w bazie;
  - usuń aktywny kontekst: po potwierdzeniu aktywny staje się pierwszy z pozostałych (F-CTX-07);
  - przeładuj kartę: kolejność i nazwy zostają.
- [ ] **10.** `pnpm format && pnpm check`, potem commit: `feat(extension): add context management with drag and drop`.

**Pułapki (sprawdzone na prototypie):**

- **Nie dawaj `VueDraggable` tablicy z cache.** `v-model` przestawia elementy w tablicy, którą dostał. Tablica z TanStack Query zmieniłaby się bez wiedzy cache, a cofnięcie przywróciłoby już zmienioną listę. Lokalna kopia jest odświeżana przez `watch(contexts, …)` po każdej zmianie cache.
- **Pusta nazwa nie jest wysyłana.** `ContextNameSchema.safeParse` w wierszu oszczędza żądanie, które API i tak by odrzuciło. `maxlength="40"` w polu nie pozwala wpisać za długiej nazwy.
- **`useToast` tylko w `setup()`.** Nuxt UI pobiera konfigurację toastów przez `inject`, więc composable woła się w komponencie, a subskrypcja `MutationCache` działa potem dla wszystkich mutacji.
- **Czysta funkcja w osobnym pliku.** `useToast` importujesz jawnie z `@nuxt/ui/composables`, a ten moduł działa tylko z wtyczką Nuxt UI dla Vite. Vitest jej nie ładuje i import kończy się błędem `Package import specifier "#imports" is not defined`. Dlatego test importuje tylko `mutation-error.ts`.
- **Okno ładowane leniwie.** `UModal`, `UPopover` i `vue-draggable-plus` trafiają do osobnego chunka (około 126 kB), pobieranego przy pierwszym otwarciu. Sam `UModal` w `DashboardScreen` dodałby do startowego JS około 25 kB.

<details>
<summary>Podpowiedź</summary>

- Zdarzenie `MutationCache`: `event.type === 'updated' && event.action.type === 'error'`, a błąd jest w `event.action.error`.
- `VueDraggable` emituje `update` z obiektem, w którym `newIndex` to nowe miejsce elementu. Tablica z `v-model` jest już wtedy przestawiona.
- Zagnieżdżony `UModal` może mieć `:open="toDelete !== null"` i `@update:open`, które przy zamknięciu czyści `toDelete`.
- `watch(() => props.context.name, …)` w wierszu aktualizuje pole, gdy nazwa zmieni się z zewnątrz, np. po cofnięciu.

</details>

<details>
<summary>Rozwiązanie: błędy i toasty</summary>

`apps/extension/src/features/errors/mutation-error.test.ts`

```ts
import { type ClientResponse, parseResponse } from 'hono/client'
import { describe, expect, it } from 'vitest'
import { jsonResponse } from '@/queries/testing'
import { mutationErrorKey } from './mutation-error'

async function apiError(status: number, code: string) {
  const response = jsonResponse(status, { error: { code, message: code } })
  return parseResponse(response as unknown as ClientResponse<unknown>).catch((error) => error)
}

describe('mutationErrorKey', () => {
  it('explains a missing connection', () => {
    expect(mutationErrorKey(new TypeError('Failed to fetch'))).toBe('errors.network')
  })

  it('names the reason for known API errors', async () => {
    expect(mutationErrorKey(await apiError(422, 'LIMIT_EXCEEDED'))).toBe('errors.limitExceeded')
    expect(mutationErrorKey(await apiError(404, 'NOT_FOUND'))).toBe('errors.notFound')
    expect(mutationErrorKey(await apiError(500, 'INTERNAL_ERROR'))).toBe('errors.rejected')
  })

  it('stays silent on 401, because the sign-in screen explains it', async () => {
    expect(mutationErrorKey(await apiError(401, 'UNAUTHORIZED'))).toBeNull()
  })
})
```

`apps/extension/src/features/errors/mutation-error.ts`

```ts
import { apiErrorInfo } from '@/api/api-error'

export function mutationErrorKey(error: unknown): string | null {
  const info = apiErrorInfo(error)
  if (!info) return 'errors.network'
  // F-AUTH-05: the session ends and the sign-in screen says why
  if (info.status === 401) return null
  if (info.code === 'LIMIT_EXCEEDED') return 'errors.limitExceeded'
  if (info.code === 'NOT_FOUND') return 'errors.notFound'
  return 'errors.rejected'
}
```

`apps/extension/src/features/errors/use-mutation-error-toasts.ts`

```ts
import { useToast } from '@nuxt/ui/composables'
import { useQueryClient } from '@tanstack/vue-query'
import { onScopeDispose } from 'vue'
import { useI18n } from 'vue-i18n'
import { mutationErrorKey } from './mutation-error'

// F-SYNC-04: each mutation rolls back its own change. This one listener tells the user about it.
export function useMutationErrorToasts() {
  const toast = useToast()
  const { t } = useI18n()
  const unsubscribe = useQueryClient()
    .getMutationCache()
    .subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'error') return
      const key = mutationErrorKey(event.action.error)
      if (!key) return
      toast.add({
        title: t('errors.changeReverted'),
        description: t(key),
        color: 'error',
        icon: 'i-lucide-circle-alert',
      })
    })
  onScopeDispose(unsubscribe)
}
```

</details>

<details>
<summary>Rozwiązanie: okno zarządzania</summary>

`apps/extension/src/features/contexts/ContextRow.vue`

```vue
<script setup lang="ts">
import { type ContextDto, type ContextIcon, ContextNameSchema } from '@one-place/shared'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUpdateContext } from '@/queries/contexts'
import IconPicker from './IconPicker.vue'

const props = defineProps<{ context: ContextDto }>()
const emit = defineEmits<{ delete: [] }>()

const { t } = useI18n()
const { mutate: update } = useUpdateContext()
const name = ref(props.context.name)

// The name can also change from outside: a rollback, or a refetch after a change on another device
watch(
  () => props.context.name,
  (saved) => {
    name.value = saved
  },
)

function saveName() {
  const result = ContextNameSchema.safeParse(name.value)
  // An empty name is not saved, the field goes back to the saved one
  if (!result.success) {
    name.value = props.context.name
    return
  }
  if (result.data !== props.context.name) update({ id: props.context.id, name: result.data })
}

function saveIcon(icon: ContextIcon) {
  if (icon !== props.context.icon) update({ id: props.context.id, icon })
}
</script>

<template>
  <li class="flex items-center gap-2">
    <UIcon
      name="i-lucide-grip-vertical"
      class="drag-handle size-5 shrink-0 cursor-grab text-muted"
      :aria-label="t('contexts.manage.drag')"
    />
    <UPopover>
      <UButton
        :icon="context.icon"
        :aria-label="t('contexts.manage.changeIcon')"
        color="neutral"
        variant="outline"
        square
      />
      <template #content>
        <div class="w-80 p-2">
          <IconPicker :model-value="context.icon" @update:model-value="saveIcon" />
        </div>
      </template>
    </UPopover>
    <UInput
      v-model="name"
      :aria-label="t('contexts.fields.name')"
      :maxlength="40"
      class="flex-1"
      @blur="saveName"
      @keydown.enter="saveName"
    />
    <UButton
      icon="i-lucide-trash-2"
      :aria-label="t('contexts.manage.delete')"
      color="error"
      variant="ghost"
      @click="emit('delete')"
    />
  </li>
</template>
```

`apps/extension/src/features/contexts/ManageContexts.vue`

```vue
<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { ref, watch } from 'vue'
import { VueDraggable, type DraggableEvent } from 'vue-draggable-plus'
import { useI18n } from 'vue-i18n'
import { useContexts, useDeleteContext, useUpdateContext } from '@/queries/contexts'
import ContextForm from './ContextForm.vue'
import ContextRow from './ContextRow.vue'
import { positionAt } from './positions'
import { useAddContext } from './use-add-context'

const { t } = useI18n()
const { data: contexts } = useContexts()
const { mutate: update } = useUpdateContext()
const { mutate: remove } = useDeleteContext()
const addContext = useAddContext()

// VueDraggable reorders this copy while dragging. The cache changes only after the drop.
const items = ref<ContextDto[]>([])
watch(contexts, (list) => (items.value = [...(list ?? [])]), { immediate: true })

function onMove(event: DraggableEvent<ContextDto>) {
  const index = event.newIndex
  const moved = index === undefined ? undefined : items.value[index]
  if (index === undefined || !moved) return
  update({ id: moved.id, position: positionAt(items.value, index) })
}

const toDelete = ref<ContextDto | null>(null)

function onDeleteModalOpen(open: boolean) {
  if (!open) toDelete.value = null
}

function confirmDelete() {
  if (toDelete.value) remove(toDelete.value.id)
  toDelete.value = null
}
</script>

<template>
  <div class="space-y-6">
    <VueDraggable
      v-model="items"
      tag="ul"
      handle=".drag-handle"
      :animation="150"
      class="space-y-2"
      @update="onMove"
    >
      <ContextRow
        v-for="context in items"
        :key="context.id"
        :context="context"
        @delete="toDelete = context"
      />
    </VueDraggable>
    <USeparator :label="t('contexts.manage.add')" />
    <ContextForm :submit-label="t('contexts.manage.add')" @submit="addContext" />

    <UModal
      :open="toDelete !== null"
      :title="t('contexts.delete.title', { name: toDelete?.name ?? '' })"
      :description="t('contexts.delete.description')"
      @update:open="onDeleteModalOpen"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            :label="t('contexts.delete.cancel')"
            color="neutral"
            variant="outline"
            @click="toDelete = null"
          />
          <UButton :label="t('contexts.delete.confirm')" color="error" @click="confirmDelete" />
        </div>
      </template>
    </UModal>
  </div>
</template>
```

`apps/extension/src/features/contexts/ManageContextsModal.vue`

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ManageContexts from './ManageContexts.vue'

const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
</script>

<template>
  <UModal v-model:open="open" :title="t('contexts.manage.title')">
    <template #body>
      <ManageContexts />
    </template>
  </UModal>
</template>
```

`apps/extension/src/features/contexts/ContextSwitcher.vue`

```vue
<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { ContextDto } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ contexts: ContextDto[]; active: ContextDto }>()
const emit = defineEmits<{ manage: [] }>()
const { t } = useI18n()
const ui = useUiStore()

const items = computed<TabsItem[]>(() =>
  props.contexts.map((context) => ({ label: context.name, icon: context.icon, value: context.id })),
)
</script>

<template>
  <div class="flex min-w-0 items-center gap-1">
    <UTabs
      :items="items"
      :model-value="active.id"
      :content="false"
      variant="link"
      :ui="{ root: 'items-start', list: 'w-max', trigger: 'shrink-0' }"
      class="min-w-0 overflow-x-auto"
      @update:model-value="(id) => void ui.selectContext(String(id))"
    />
    <UButton
      icon="i-lucide-pencil"
      :aria-label="t('contexts.manage.open')"
      color="neutral"
      variant="ghost"
      @click="emit('manage')"
    />
  </div>
</template>
```

`apps/extension/src/features/dashboard/AppHeader.vue` (zmienione fragmenty)

```ts
const emit = defineEmits<{ manageContexts: [] }>()
```

```vue
<ContextSwitcher
  v-else-if="active"
  :contexts="contexts"
  :active="active"
  @manage="emit('manageContexts')"
/>
```

`apps/extension/src/features/dashboard/DashboardScreen.vue` (nowe fragmenty)

```ts
import { defineAsyncComponent, ref } from 'vue'
import { useMutationErrorToasts } from '@/features/errors/use-mutation-error-toasts'

const ManageContextsModal = defineAsyncComponent(
  () => import('@/features/contexts/ManageContextsModal.vue'),
)

const manageOpen = ref(false)
// Mounted on the first open and kept, so the modal can animate when it closes
const manageUsed = ref(false)
useMutationErrorToasts()

function openManage() {
  manageUsed.value = true
  manageOpen.value = true
}
```

```vue
<AppHeader :contexts="contexts" :active="active" @manage-contexts="openManage" />
<!-- … <main> bez zmian … -->
<ManageContextsModal v-if="manageUsed" v-model:open="manageOpen" />
```

</details>

<details>
<summary>Rozwiązanie: teksty</summary>

`pl.json` (w `contexts` dwie nowe grupy i nowa grupa `errors` na najwyższym poziomie)

```json
"manage": {
  "open": "Zarządzaj kontekstami",
  "title": "Konteksty",
  "add": "Dodaj kontekst",
  "changeIcon": "Zmień ikonę",
  "delete": "Usuń kontekst",
  "drag": "Przeciągnij, aby zmienić kolejność"
},
"delete": {
  "title": "Usunąć kontekst „{name}”?",
  "description": "Kontekst zniknie na wszystkich urządzeniach. Tej operacji nie można cofnąć.",
  "confirm": "Usuń",
  "cancel": "Anuluj"
}
```

```json
"errors": {
  "changeReverted": "Zmiana została cofnięta",
  "network": "Brak połączenia z serwerem.",
  "limitExceeded": "Osiągnięto limit. Usuń coś, zanim dodasz kolejny element.",
  "notFound": "Ten element został już usunięty, np. na innym urządzeniu.",
  "rejected": "Serwer odrzucił zmianę. Spróbuj ponownie."
}
```

`en.json`

```json
"manage": {
  "open": "Manage contexts",
  "title": "Contexts",
  "add": "Add context",
  "changeIcon": "Change icon",
  "delete": "Delete context",
  "drag": "Drag to reorder"
},
"delete": {
  "title": "Delete the context “{name}”?",
  "description": "The context will disappear on all devices. This cannot be undone.",
  "confirm": "Delete",
  "cancel": "Cancel"
}
```

```json
"errors": {
  "changeReverted": "Your change was reverted",
  "network": "Cannot connect to the server.",
  "limitExceeded": "Limit reached. Remove something before adding more.",
  "notFound": "This item was already deleted, e.g. on another device.",
  "rejected": "The server rejected the change. Please try again."
}
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Ile żądań wysyła przeciągnięcie kontekstu na górę listy?** Jedno: `PATCH` z nową pozycją przesuniętego kontekstu. Pozostałe zachowują swoje klucze.
2. **Dlaczego toasty pokazuje jeden słuchacz, a nie `onError` każdej mutacji?** Każda mutacja odpowiada tylko za własny cache. Komunikat jest wspólny i ma te same zasady (np. cisza przy 401), więc trzymanie go w jednym miejscu zapobiega rozjechaniu się zachowania między mutacjami.
3. **Co się dzieje z zapamiętanym `activeContextId` po usunięciu aktywnego kontekstu?** Zostaje w storage, ale `pickActiveContext` go nie znajduje i wybiera pierwszy kontekst. Gdy kontekstów nie ma wcale, pulpit pokazuje formularz pierwszego kontekstu.

</details>

---

## Zadanie 13: język zapisany na koncie

**Cel:** w ustawieniach można wybrać język: polski, angielski albo język przeglądarki. Wybór jest zapisywany na koncie i obowiązuje na każdym urządzeniu po zalogowaniu, a przed zalogowaniem decyduje przeglądarka (F-I18N-02, F-I18N-03).

**Czego się nauczysz:** globalny `locale` w vue-i18n z composable, `watchEffect` i `onScopeDispose`, `USlideover`, `URadioGroup`, `UUser`, mutacja optymistyczna na pojedynczym obiekcie.

**Pliki:**

- Utwórz: `apps/extension/src/queries/settings.ts`, `apps/extension/src/features/settings/use-account-locale.ts`, `apps/extension/src/features/settings/SettingsSlideover.vue`
- Zmień: `apps/extension/src/i18n/locale.ts`, `apps/extension/src/features/dashboard/AppHeader.vue`, `DashboardScreen.vue`, `apps/extension/src/i18n/pl.json`, `en.json`
- Test: `apps/extension/src/i18n/locale.test.ts`, `apps/extension/src/queries/settings.test.ts`

**Interfejsy:**

- Korzysta z: `SettingsDto`, `UpdateSettingsInput`, `Locale` (zadanie 1), tras `settings` (zadanie 4), `changeOptimistically` i pomocników testowych (zadanie 9), `useMe` (zadanie 7), `signOut` (zadanie 11).
- Wytwarza: `resolveLocale(saved, browserLanguage)`, `settingsKey`, `useSettings()`, `useUpdateSettings()`, `useAccountLocale()`, panel ustawień otwierany przyciskiem w nagłówku.

**Kroki:**

- [ ] **1. Czerwone testy** `resolveLocale` w `src/i18n/locale.test.ts`: `resolveLocale('en', 'pl-PL')` to `'en'`, `resolveLocale(null, 'pl-PL')` to `'pl'`, a `resolveLocale(undefined, 'de-DE')` to `'en'`. Oczekiwany wynik: **FAIL**. Po implementacji: **PASS (46 testów w rozszerzeniu)**.
- [ ] **2. Czerwony test** w `src/queries/settings.test.ts`: `useUpdateSettings` zmienia `locale` w cache na `'en'`, zanim API odpowie, a gdy API odpowie 500, cache wraca do `{ locale: null, updatedAt: null, version: 0 }`. Oczekiwany wynik: **FAIL**.
- [ ] **3. Implementacja** `queries/settings.ts` według wzoru z zadania 9. Oczekiwany wynik: **PASS (47 testów w rozszerzeniu)**.
- [ ] **4. Język konta.** `use-account-locale.ts`: `watchEffect` ustawia globalny `locale` na `resolveLocale(settings?.locale, navigator.language)`, a `onScopeDispose` przywraca język przeglądarki. Wywołaj go w `DashboardScreen`.
- [ ] **5. Panel ustawień.** `SettingsSlideover.vue`: `UUser` z nazwą i e-mailem z `useMe`, `URadioGroup` z trzema opcjami i przycisk wylogowania w stopce. Załaduj go leniwie w `DashboardScreen`, tak jak okno kontekstów. W `AppHeader` zamień przycisk wylogowania na przycisk ustawień (`i-lucide-settings`), który emituje `openSettings`.
- [ ] **6. Teksty:** grupa `settings` (`title`, `language.label`, `language.browser`).
- [ ] **7. Sprawdzenie ręczne** (`pnpm dev`):
  - Ustawienia → „English”: interfejs zmienia się od razu, a `<html lang>` to `en`;
  - odczekaj sekundę i przeładuj kartę: pulpit jest po angielsku od pierwszej klatki, bez mignięcia polskiego;
  - zaloguj się na to samo konto w drugim profilu przeglądarki: interfejs po angielsku (F-I18N-03); wybierz „Browser language”: wraca polski;
  - wyloguj się: ekran logowania jest w języku przeglądarki.
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): add language saved on the account`.

**Pułapki (sprawdzone na prototypie):**

- **`useI18n({ useScope: 'global' })`.** Composable zmienia język całej aplikacji, a nie lokalnego zakresu komponentu.
- **Radio nie przyjmuje `null`.** Wartość `'browser'` w `URadioGroup` oznacza „brak języka na koncie”, a `computed` z getterem i setterem tłumaczy ją na `null` i z powrotem.
- **Bez mignięcia dzięki zadaniu 8.** Ustawienia są w cache odtworzonym przed `mount`, a `watchEffect` wykonuje się od razu w `setup()`, więc pierwszy render jest już we właściwym języku. Lokalizacja Nuxt UI (`UApp :locale`) idzie za `locale` dzięki `computed` z Etapu 1.
- **Wylogowanie odmontowuje pulpit.** `onScopeDispose` w `useAccountLocale` przywraca wtedy język przeglądarki, więc ekran logowania nie zostaje w języku poprzedniego konta.

<details>
<summary>Podpowiedź</summary>

- `useUpdateSettings`: `changeOptimistically<SettingsDto>(queryClient, settingsKey, (settings) => ({ ...settings, ...changes }))`.
- `const language = computed({ get: () => settings.value?.locale ?? 'browser', set: (value) => updateSettings({ locale: value === 'browser' ? null : value }) })`.
- `USlideover` ma `v-model:open`, `title` i sloty `body` i `footer`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/i18n/locale.ts` (nowa funkcja na końcu pliku)

```ts
// F-I18N-02: after sign-in the language saved on the account wins
export function resolveLocale(saved: Locale | null | undefined, browserLanguage: string): Locale {
  return saved ?? detectLocale(browserLanguage)
}
```

`apps/extension/src/i18n/locale.test.ts` (nowy import i nowy blok)

```ts
import { detectLocale, resolveLocale } from './locale'

// …

describe('resolveLocale', () => {
  it('uses the language saved on the account', () => {
    expect(resolveLocale('en', 'pl-PL')).toBe('en')
  })

  it('follows the browser when the account has no language', () => {
    expect(resolveLocale(null, 'pl-PL')).toBe('pl')
    expect(resolveLocale(undefined, 'de-DE')).toBe('en')
  })
})
```

`apps/extension/src/queries/settings.test.ts`

```ts
import type { SettingsDto } from '@one-place/shared'
import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it, vi } from 'vitest'
import { settingsKey, useUpdateSettings } from './settings'
import { deferred, jsonResponse, withQueryClient } from './testing'

const api = vi.hoisted(() => ({ patch: vi.fn() }))

vi.mock('@/api/client', () => ({ apiClient: { api: { settings: { $patch: api.patch } } } }))

const saved: SettingsDto = { locale: null, updatedAt: null, version: 0 }

describe('useUpdateSettings', () => {
  it('changes the language at once and brings it back when the API rejects it', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(settingsKey, saved)
    const response = deferred<Response>()
    api.patch.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useUpdateSettings)

    const saving = mutateAsync({ locale: 'en' })
    await vi.waitFor(() =>
      expect(queryClient.getQueryData<SettingsDto>(settingsKey)?.locale).toBe('en'),
    )

    response.resolve(jsonResponse(500, { error: { code: 'INTERNAL_ERROR', message: 'Boom' } }))
    await expect(saving).rejects.toThrow()
    expect(queryClient.getQueryData(settingsKey)).toEqual(saved)
  })
})
```

`apps/extension/src/queries/settings.ts`

```ts
import type { SettingsDto, UpdateSettingsInput } from '@one-place/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { apiClient } from '@/api/client'
import { changeOptimistically } from './optimistic'

export const settingsKey = ['settings'] as const

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => parseResponse(apiClient.api.settings.$get()),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (changes: UpdateSettingsInput) =>
      parseResponse(apiClient.api.settings.$patch({ json: changes })),
    onMutate: (changes) =>
      changeOptimistically<SettingsDto>(queryClient, settingsKey, (settings) => ({
        ...settings,
        ...changes,
      })),
    onError: (_error, _changes, rollback) => rollback?.(),
    onSuccess: (saved) => queryClient.setQueryData(settingsKey, saved),
  })
}
```

`apps/extension/src/features/settings/use-account-locale.ts`

```ts
import { onScopeDispose, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { detectLocale, resolveLocale } from '@/i18n/locale'
import { useSettings } from '@/queries/settings'

// F-I18N-02: while signed in, the language saved on the account wins. The settings come from
// the cache before the first render, so the dashboard never flashes in the other language.
export function useAccountLocale() {
  const { locale } = useI18n({ useScope: 'global' })
  const { data: settings } = useSettings()
  watchEffect(() => {
    locale.value = resolveLocale(settings.value?.locale, navigator.language)
  })
  // Signed out: back to the browser language
  onScopeDispose(() => {
    locale.value = detectLocale(navigator.language)
  })
}
```

`apps/extension/src/features/settings/SettingsSlideover.vue`

```vue
<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'
import type { Locale } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { signOut } from '@/features/auth/sign-out'
import { useMe } from '@/queries/me'
import { useSettings, useUpdateSettings } from '@/queries/settings'

const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const { data: me } = useMe()
const { data: settings } = useSettings()
const { mutate: updateSettings } = useUpdateSettings()

// A radio value cannot be null, so 'browser' stands for "no language saved on the account"
const languages = computed<RadioGroupItem[]>(() => [
  { label: t('settings.language.browser'), value: 'browser' },
  { label: 'Polski', value: 'pl' },
  { label: 'English', value: 'en' },
])
const language = computed({
  get: () => settings.value?.locale ?? 'browser',
  set: (value: string) =>
    updateSettings({ locale: value === 'browser' ? null : (value as Locale) }),
})
</script>

<template>
  <USlideover v-model:open="open" :title="t('settings.title')">
    <template #body>
      <div class="space-y-6">
        <UUser v-if="me" :name="me.name" :description="me.email" icon="i-lucide-circle-user" />
        <UFormField :label="t('settings.language.label')">
          <URadioGroup v-model="language" :items="languages" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <UButton
        icon="i-lucide-log-out"
        :label="t('auth.signOut')"
        color="neutral"
        variant="outline"
        block
        @click="signOut"
      />
    </template>
  </USlideover>
</template>
```

`apps/extension/src/features/dashboard/AppHeader.vue` (stan po tym zadaniu)

```vue
<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import ContextSwitcher from '@/features/contexts/ContextSwitcher.vue'

defineProps<{ contexts: ContextDto[] | undefined; active: ContextDto | null }>()
const emit = defineEmits<{ manageContexts: []; openSettings: [] }>()
const { t } = useI18n()
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-default px-4">
    <USkeleton v-if="!contexts" class="h-8 w-40" />
    <ContextSwitcher
      v-else-if="active"
      :contexts="contexts"
      :active="active"
      @manage="emit('manageContexts')"
    />
    <span v-else />
    <UButton
      icon="i-lucide-settings"
      :aria-label="t('settings.title')"
      color="neutral"
      variant="ghost"
      @click="emit('openSettings')"
    />
  </header>
</template>
```

`apps/extension/src/features/dashboard/DashboardScreen.vue` (nowe fragmenty)

```ts
import { useAccountLocale } from '@/features/settings/use-account-locale'

const SettingsSlideover = defineAsyncComponent(
  () => import('@/features/settings/SettingsSlideover.vue'),
)

const settingsOpen = ref(false)
const settingsUsed = ref(false)
useAccountLocale()

function openSettings() {
  settingsUsed.value = true
  settingsOpen.value = true
}
```

```vue
<AppHeader
  :contexts="contexts"
  :active="active"
  @manage-contexts="openManage"
  @open-settings="openSettings"
/>
<!-- … -->
<SettingsSlideover v-if="settingsUsed" v-model:open="settingsOpen" />
```

Teksty: `"settings": { "title": "Ustawienia", "language": { "label": "Język", "browser": "Język przeglądarki" } }` w `pl.json` i `"settings": { "title": "Settings", "language": { "label": "Language", "browser": "Browser language" } }` w `en.json`.

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego język jest na koncie, a aktywny kontekst na urządzeniu?** Język to preferencja osoby, która chce go mieć wszędzie tak samo (F-I18N-03). Aktywny kontekst zależy od miejsca, w którym siedzi (F-CTX-04).
2. **Co widzi użytkownik, gdy zapis języka się nie uda?** Interfejs zmienia język od razu, a po odrzuceniu wraca do poprzedniego i pokazuje toast „Zmiana została cofnięta”. To ten sam mechanizm co przy kontekstach.
3. **Skąd ekran logowania wie, w jakim języku się pokazać, skoro konto nie jest jeszcze znane?** Z przeglądarki (`detectLocale`), tak jak w Etapie 1. Język konta obowiązuje dopiero po zalogowaniu, kiedy są znane ustawienia (F-I18N-02).

</details>

---

## Zadanie 14: offline, wyłączone API i odrzucone zmiany

**Cel:** bez sieci karta pokazuje zapisane dane i baner „Offline, pokazuję zapisane dane”, a zmiany czekają na powrót sieci (F-SYNC-05). Odświeżenie po powrocie do karty pobiera zmiany z innych urządzeń (F-SYNC-03). Wszystkie punkty z [Na co uważać](#na-co-uważać) działają ręcznie, w tym kryterium z DoD: odrzucona zmiana jest cofana z toastem.

**Czego się nauczysz:** `onlineManager` i `networkMode` w TanStack Query, `focusManager` (`visibilitychange`), sprawdzanie przypadków brzegowych na zbudowanej paczce.

**Pliki:**

- Utwórz: `apps/extension/src/queries/use-online.ts`
- Zmień: `apps/extension/src/entrypoints/newtab/main.ts`, `apps/extension/src/features/dashboard/DashboardScreen.vue`, `apps/extension/src/i18n/pl.json`, `en.json`

**Interfejsy:**

- Korzysta z: `onlineManager` z `@tanstack/vue-query`, całej warstwy danych z zadań 7–13.
- Wytwarza: `useOnline()` → `Ref<boolean>` i baner offline na pulpicie.

**Kroki:**

- [ ] **1. Baner.** `use-online.ts`: `ref(onlineManager.isOnline())` aktualizowany przez `onlineManager.subscribe`, a subskrypcja zamykana w `onScopeDispose`. W `DashboardScreen` nad treścią pokaż `UAlert` w kolorze `warning` z ikoną `i-lucide-wifi-off` i tekstem `dashboard.offline`, gdy `!online`.
- [ ] **2. Eksperyment: karta otwarta bez sieci.** Zbuduj rozszerzenie i załaduj `.output/chrome-mv3` (w `pnpm dev` skrypty strony ładuje serwer Vite z `localhost:3001`, a tryb Offline blokuje również jego). Zaloguj się, odczekaj sekundę, w DevTools → Network wybierz „Offline” i przeładuj kartę. **Oczekiwany wynik:** pulpit z cache, ale **bez banera**. Zmień nazwę kontekstu w oknie „Konteksty”: nazwa zmienia się i od razu wraca, a toast mówi „Brak połączenia z serwerem.”. Zastanów się, dlaczego zmiana nie czekała na sieć, zanim otworzysz wyjaśnienie.
- [ ] **3. Poprawka.** W `main.ts`, przed utworzeniem klienta zapytań, dodaj `onlineManager.setOnline(navigator.onLine)`. Zbuduj i powtórz krok 2: baner jest, a zmiana nazwy zostaje bez toastu. Wyłącz tryb Offline: baner znika, a zmiana trafia do bazy (sprawdź w drugiej karcie albo w `psql`).
- [ ] **4. Teksty:** `dashboard.offline` („Offline, pokazuję zapisane dane” i „Offline, showing saved data”).
- [ ] **5. Odrzucona zmiana (DoD).** Uzupełnij swoje konto do 20 kontekstów:

  ```bash
  docker compose exec db psql -U one one_place -c "insert into contexts (id, user_id, name, icon, position) select gen_random_uuid(), u.id, 'Test ' || n, 'i-lucide-star', 'b' || lpad(n::text, 2, '0') from \"user\" u cross join lateral generate_series(1, 20 - (select count(*)::int from contexts c where c.user_id = u.id)) n where u.email = 'twoj@email.pl'"
  ```

  Przełącz się na inną kartę przeglądarki i wróć: zakładek jest 20. Dodaj dwudziesty pierwszy kontekst w oknie „Konteksty”. **Oczekiwany wynik:** zakładka pojawia się i po chwili znika, a toast mówi „Zmiana została cofnięta. Osiągnięto limit. Usuń coś, zanim dodasz kolejny element.”.

- [ ] **6. Zmiana na innym urządzeniu.** Usuń w `psql` aktywny kontekst (`delete from contexts where name = '…'`), przejdź na inną kartę i wróć. Zakładka znika, a aktywny staje się pierwszy kontekst (F-CTX-04). Na koniec usuń konteksty testowe: `delete from contexts where name like 'Test %'`.
- [ ] **7. Wyłączone API, działająca sieć (punkt 5 z [Na co uważać](#na-co-uważać)).** Uruchom API i rozszerzenie w osobnych terminalach i zatrzymaj samo API. Przeładuj kartę: pulpit z cache, bez banera, bo sieć działa. Odczekaj 10 sekund, aż skończą się ponowienia, i otwórz nową kartę: pulpit nadal z danymi. Zmień nazwę kontekstu: wraca, a toast mówi „Brak połączenia z serwerem.”. Uruchom API.
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): add offline banner`.

**Pułapki (sprawdzone na prototypie):**

- **„Offline” to nie „API nie działa”.** Baner pokazuje stan sieci w przeglądarce. Gdy sieć działa, a nie odpowiada tylko API, zapytania kończą się błędem po ponowieniach, pulpit zostaje z danymi z cache, a nieudane zmiany cofają się z toastem.
- **Odświeżenie przy powrocie działa przez `visibilitychange`.** W TanStack Query v5 dane odświeża powrót do karty, czyli zmiana jej widoczności. Przełączenie z innego programu, gdy karta przez cały czas była widoczna, nie odświeża danych.
- **Karta otwarta offline tylko w paczce.** W `pnpm dev` strona ładuje moduły z serwera Vite, więc w trybie Offline w ogóle się nie wyrenderuje. To ograniczenie trybu deweloperskiego, a nie aplikacji.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 2)</summary>

- `networkMode: 'online'` (domyślny) wstrzymuje zapytania i mutacje, gdy `onlineManager` mówi „offline”, i wznawia je po powrocie sieci. Optymistyczna zmiana zostaje wtedy w cache i czeka.
- `onlineManager` w v5 zakłada na starcie, że jest online, i zmienia zdanie dopiero po zdarzeniu `offline` z `window`. Karta otwarta bez sieci takiego zdarzenia nie dostaje, bo sieci nie było od początku.
- Dla TanStack Query karta była więc online: mutacja wysłała żądanie, dostała `TypeError: Failed to fetch` i została cofnięta jak każdy inny błąd, a baner się nie pokazał.
- `onlineManager.setOnline(navigator.onLine)` ustawia stan początkowy z przeglądarki, a zdarzenia `online` i `offline` aktualizują go dalej.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/use-online.ts`

```ts
import { onlineManager } from '@tanstack/vue-query'
import { onScopeDispose, ref } from 'vue'

export function useOnline() {
  const online = ref(onlineManager.isOnline())
  const unsubscribe = onlineManager.subscribe((value) => {
    online.value = value
  })
  onScopeDispose(unsubscribe)
  return online
}
```

`apps/extension/src/entrypoints/newtab/main.ts` (ostateczny)

```ts
import { createApp, watch } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import { onlineManager, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { loadSession, session } from '@/api/session'
import { i18n } from '@/i18n'
import { clearCache, persistCache, restoreCache } from '@/queries/cache'
import { createQueryClient } from '@/queries/query-client'
import { useUiStore } from '@/stores/ui'
import App from './App.vue'
import '~/assets/main.css'

// TanStack Query assumes it is online until an 'offline' event comes. A tab opened without
// network would wait for answers instead of showing the cache with the offline banner.
onlineManager.setOnline(navigator.onLine)

const queryClient = createQueryClient()
const pinia = createPinia()
const uiStore = useUiStore(pinia)

async function start() {
  // Before the first render: the token decides between the dashboard and the sign-in screen,
  // and the restored cache and active context let the dashboard appear at once (F-SYNC-01)
  await Promise.all([loadSession(), restoreCache(queryClient), uiStore.load()])
  persistCache(queryClient)
  // F-AUTH-04: sign-out in this tab, in another tab or after a 401 removes all local data
  watch(session.token, (token) => {
    if (token) return
    void clearCache(queryClient)
    void uiStore.reset()
  })
  createApp(App).use(ui).use(i18n).use(pinia).use(VueQueryPlugin, { queryClient }).mount('#app')
}

void start()
```

`apps/extension/src/features/dashboard/DashboardScreen.vue` (nowe fragmenty)

```ts
import { useOnline } from '@/queries/use-online'

const online = useOnline()
```

```vue
<main class="flex-1 space-y-4 p-4">
  <!-- F-SYNC-05 -->
  <UAlert
    v-if="!online"
    color="warning"
    variant="subtle"
    icon="i-lucide-wifi-off"
    :title="t('dashboard.offline')"
  />
  <!-- … szkielety, pierwszy kontekst albo pusty pulpit bez zmian … -->
</main>
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co się stanie ze zmianą zrobioną offline, gdy zamkniesz kartę przed powrotem sieci?** Przepadnie. Wstrzymana mutacja istnieje tylko w pamięci karty, a persister zapisuje same zapytania (decyzja 5, ryzyko R7).
2. **Dlaczego dwudziesty pierwszy kontekst pojawił się na chwilę?** UI jest optymistyczne: pokazuje zmianę, zanim serwer ją oceni. Limit sprawdza serwer, który jest źródłem prawdy, więc odpowiedź 422 cofa zmianę.
3. **Dlaczego TanStack Query v5 nie czyta `navigator.onLine` sam?** `navigator.onLine === true` mówi tylko, że jest jakiś interfejs sieciowy, a nie że internet działa. Dlatego biblioteka opiera się na zdarzeniach, a stan początkowy zostawia aplikacji.

</details>

---

## Zadanie 15: budżet startowego JS i czas pierwszego renderu

**Cel:** znasz rozmiar startowego JS po Etapie 2 i czas pierwszego renderu z cache, a budżet ma nową wartość opartą na pomiarze (decyzja 1). Wymaganie wydajności z [02-specyfikacja.md](02-specyfikacja.md#wymagania-niefunkcjonalne) ma pomiar w kodzie.

**Czego się nauczysz:** dzielenie kodu na chunki przez Vite (`modulepreload`), koszt komponentów Nuxt UI, `performance.mark`, spowalnianie CPU w DevTools.

**Pliki:**

- Utwórz: `scripts/startup-js-size.mjs`
- Zmień: `package.json` (główny, skrypt `size`), `apps/extension/src/features/dashboard/DashboardScreen.vue`

**Kroki:**

- [ ] **1. Pomiar jak w Etapie 1.** `pnpm --filter @one-place/extension build`. **Oczekiwany wynik:** `newtab-*.js` ma około 200 kB, czyli mniej niż po Etapie 1 (325,6 kB), a obok są nowe chunki, m.in. jeden około 228 kB i jeden około 32 kB. Otwórz `apps/extension/.output/chrome-mv3/newtab.html`: obok `<script src="/chunks/newtab-….js">` są linie `<link rel="modulepreload" href="/chunks/….js">`. Zastanów się, co to znaczy dla pomiaru, zanim przejdziesz dalej.
- [ ] **2. Skrypt.** `scripts/startup-js-size.mjs` czyta `newtab.html`, sumuje rozmiary skryptu wejściowego i wszystkich chunków z `modulepreload` i wypisuje każdy plik. W głównym `package.json` dodaj `"size": "node scripts/startup-js-size.mjs"`. Uruchom `pnpm size`. **Oczekiwany wynik: około 473 kB.** Nazwy wspólnych chunków (np. `Button-…`, `session-…`) mogą się u Ciebie różnić.
- [ ] **3. Eksperyment: menu rozwijane.** Podmień na chwilę `ContextSwitcher.vue` na wersję z `UDropdownMenu` (w rozwiązaniu poniżej), zbuduj i uruchom `pnpm size`. **Oczekiwany wynik: około 577 kB, czyli +104 kB.** Przywróć zakładki.
- [ ] **4. Eksperyment (opcjonalny): modal w głównym chunku.** W `DashboardScreen` zamiast leniwego `ManageContextsModal` wstaw `UModal` z leniwym tylko `ManageContexts`. Oczekiwany wynik: około +25 kB. Przywróć.
- [ ] **5. Znacznik.** W `DashboardScreen` w `onMounted` wywołaj `performance.mark('dashboard-rendered')`, jeśli lista kontekstów jest już w cache. Wymaganie dotyczy pierwszego renderu z cache, a nie pierwszego uruchomienia.
- [ ] **6. Pomiar czasu.** Zbuduj, załaduj `.output/chrome-mv3`, zaloguj się i utwórz kontekst. Otwórz nową kartę, a w jej konsoli DevTools wpisz `performance.getEntriesByName('dashboard-rendered')[0].startTime`. **Oczekiwany wynik:** kilkadziesiąt milisekund (na prototypie mediana 22–26 ms). Potem w DevTools → Performance ustaw „CPU: 4x slowdown” i przeładuj kartę: na prototypie około 80 ms. Wymaganie to poniżej 200 ms.
- [ ] **7. Nowy budżet.** Pomiar z kroku 2 plus około 15% zapasu, zaokrąglony: **550 kB**. Dopisz w skrypcie stałą `BUDGET_KB` i kod wyjścia 1 przy przekroczeniu. Sprawdź oba przypadki: `pnpm size` przechodzi, a z menu rozwijanym z kroku 3 zgłasza przekroczenie.
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `perf(extension): mark the first dashboard render and check start-up JS size`.

**Pułapki (sprawdzone na prototypie):**

- **Mniejszy `newtab-*.js` nie znaczy mniej kodu.** Gdy kod leniwych komponentów (formularze, modal) i strony startowej korzysta z tych samych modułów (Vue, Nuxt UI), Vite wydziela je do wspólnych chunków. Strona i tak pobiera je przy starcie, co widać w `modulepreload`.
- **Jeden komponent może być drogi.** `UDropdownMenu` ciągnie warstwę menu z `reka-ui` i pozycjonowanie z `@floating-ui`. To ponad 100 kB, choć w kodzie to jedna linia.
- **Pomiar czasu z otwartymi DevTools jest zawyżony.** Liczby traktuj jako górne oszacowanie. Właściwy pomiar we wszystkich scenariuszach dojdzie w Etapie 6.

<details>
<summary>Podpowiedź</summary>

- Ścieżki do chunków: `[...html.matchAll(/(?:src|href)="\/(chunks\/[^"]+\.js)"/g)]`.
- `statSync(new URL(file, output)).size / 1000` daje kB tak, jak liczy je WXT (z dokładnością do zaokrągleń).
- `process.exitCode = 1` kończy skrypt błędem bez przerywania wypisywania.

</details>

<details>
<summary>Rozwiązanie</summary>

`scripts/startup-js-size.mjs`

```js
// Start-up JS of the new tab: the entry script and every chunk it preloads (<link rel="modulepreload">).
// Chunks loaded later with import() do not count. Run after `pnpm --filter @one-place/extension build`.
import { readFileSync, statSync } from 'node:fs'

const BUDGET_KB = 550
const output = new URL('../apps/extension/.output/chrome-mv3/', import.meta.url)

const html = readFileSync(new URL('newtab.html', output), 'utf8')
const files = [...html.matchAll(/(?:src|href)="\/(chunks\/[^"]+\.js)"/g)].map((match) => match[1])

let totalKb = 0
for (const file of files) {
  const kb = statSync(new URL(file, output)).size / 1000
  totalKb += kb
  console.log(`${kb.toFixed(1).padStart(7)} kB  ${file}`)
}
console.log(`${totalKb.toFixed(1).padStart(7)} kB  total (budget ${BUDGET_KB} kB)`)

if (totalKb > BUDGET_KB) {
  console.error(`Start-up JS is ${(totalKb - BUDGET_KB).toFixed(1)} kB over the budget`)
  process.exitCode = 1
}
```

`package.json` (główny, nowy skrypt)

```json
"size": "node scripts/startup-js-size.mjs"
```

`apps/extension/src/features/dashboard/DashboardScreen.vue` (ostateczny `<script setup>`; szablon jak po zadaniach 12–14)

```ts
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useActiveContext } from '@/features/contexts/active-context'
import { useMutationErrorToasts } from '@/features/errors/use-mutation-error-toasts'
import { useAccountLocale } from '@/features/settings/use-account-locale'
import { useContexts } from '@/queries/contexts'
import { useOnline } from '@/queries/use-online'
import AppHeader from './AppHeader.vue'

// Not needed for the first render, so their forms (and Zod) stay out of the start-up bundle
const FirstContext = defineAsyncComponent(() => import('@/features/contexts/FirstContext.vue'))
const ManageContextsModal = defineAsyncComponent(
  () => import('@/features/contexts/ManageContextsModal.vue'),
)
const SettingsSlideover = defineAsyncComponent(
  () => import('@/features/settings/SettingsSlideover.vue'),
)

const { t } = useI18n()
const { data: contexts, isError, refetch } = useContexts()
const active = useActiveContext()
const online = useOnline()
const manageOpen = ref(false)
// Mounted on the first open and kept, so the modal can animate when it closes
const manageUsed = ref(false)
const settingsOpen = ref(false)
const settingsUsed = ref(false)
useMutationErrorToasts()
useAccountLocale()

// Performance requirement: the first render from the cache within 200 ms of opening the tab.
// The mark's startTime counts from the start of the page load.
onMounted(() => {
  if (contexts.value) performance.mark('dashboard-rendered')
})

function openManage() {
  manageUsed.value = true
  manageOpen.value = true
}

function openSettings() {
  settingsUsed.value = true
  settingsOpen.value = true
}
```

`apps/extension/src/features/contexts/ContextSwitcher.vue` w wersji z menu rozwijanym (tylko do eksperymentu w kroku 3)

```vue
<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ContextDto } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ contexts: ContextDto[]; active: ContextDto }>()
const emit = defineEmits<{ manage: [] }>()
const { t } = useI18n()
const ui = useUiStore()

const items = computed<DropdownMenuItem[][]>(() => [
  props.contexts.map((context) => ({
    label: context.name,
    icon: context.icon,
    type: 'checkbox' as const,
    checked: context.id === props.active.id,
    onSelect: () => void ui.selectContext(context.id),
  })),
  [{ label: t('contexts.manage.open'), icon: 'i-lucide-pencil', onSelect: () => emit('manage') }],
])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      :icon="active.icon"
      :label="active.name"
      trailing-icon="i-lucide-chevrons-up-down"
      color="neutral"
      variant="ghost"
    />
  </UDropdownMenu>
</template>
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego sumujesz chunki z `modulepreload`, a nie tylko `newtab-*.js`?** Przeglądarka musi pobrać i wykonać je wszystkie przed pierwszym renderem. Podział na pliki zależy od tego, jak Vite rozłoży wspólny kod, więc rozmiar jednego pliku niczego nie mówi.
2. **Dlaczego właściwym wymaganiem jest czas, a nie rozmiar?** Użytkownik odczuwa czas do zobaczenia pulpitu. Rozmiar JS to tylko przybliżenie, które pomaga wcześnie zauważyć problem, dlatego budżet jest bezpiecznikiem, a znacznik `dashboard-rendered` właściwym pomiarem.
3. **Co w Etapie 3 trafi na ścieżkę startową, a co powinno zostać leniwe?** Siatka (`grid-layout-plus`) i ramka widgetu są potrzebne do pierwszego renderu pulpitu. Komponenty widgetów, katalog i ustawienia widgetu ładują się leniwie, tak jak zakłada rejestr w [03-architektura.md](03-architektura.md#system-widgetów).

</details>

---

## Zadanie 16: domknięcie Etapu 2

**Cel:** spełniona definicja ukończenia Etapu 2, decyzje z tego planu zapisane w dokumentacji i dokumentacja zgodna z kodem.

**Kroki:**

- [ ] **1. Specyfikacja.** W [02-specyfikacja.md](02-specyfikacja.md), w wymaganiu „Wydajność”, zmień budżet: 550 kB bez kompresji (pomiar z Etapu 2: 473 kB + ok. 15%), liczony jako suma skryptu wejściowego i chunków z `modulepreload` (`pnpm size`).
- [ ] **2. Architektura.** W [03-architektura.md](03-architektura.md):
  - w „Model danych”: `user_settings` ma w Etapie 2 tylko `locale`, a `theme` i `contexts.theme_override` dochodzą w Etapie 5; kolumna `position` powstaje przez `customType` z `text COLLATE "C"`; listy sortujemy po `(position, id)`;
  - w „API”: `GET /settings` zwraca `{ locale, updatedAt, version }` (domyślnie `null`, `null`, `0`); `POST /contexts` odpowiada 201 albo 200 przy ponowieniu; walidacja przez `validate()` (hook rzuca `ZodError`), a zepsuty JSON daje 400;
  - w „Warstwa danych”: cache odtwarzany przed `mount` (bez `clientPersister`), `shouldDehydrateQuery` zapisuje zapytania z danymi także w stanie `error`, `gcTime: Infinity`, `onlineManager.setOnline(navigator.onLine)` na starcie, toasty przez subskrypcję `MutationCache`, 404 przy `DELETE` traktowane jak sukces;
  - w „Start nowej karty”: startowy JS po Etapie 2 (Twój pomiar, na prototypie 473 kB) i czas pierwszego renderu z cache;
  - w rejestrze decyzji: przełącznik kontekstów jako zakładki (odrzucone: `UDropdownMenu`, +104 kB startowego JS).
- [ ] **3. Roadmapa.** Przy Etapie 2 w [04-roadmapa.md](04-roadmapa.md) jest odnośnik do tego planu. Sprawdź, czy zakres się zgadza, i czy w Etapie 3 jest licznik widgetów w modalu usuwania kontekstu, a w Etapie 5 kolumny motywu z migracją i zmianą `CACHE_SCHEMA_VERSION`.
- [ ] **4. README.** W „Uruchomienie lokalne” dopisz, że rozmiar startowego JS sprawdzisz po buildzie: `pnpm --filter @one-place/extension build && pnpm size`.
- [ ] **5. Definicja ukończenia** z [roadmapy](04-roadmapa.md#etap-2-konteksty-i-warstwa-danych):
  - [ ] konteksty działają zgodnie ze specyfikacją: pusty stan, tworzenie, przełączanie, pamiętanie aktywnego, zmiana nazwy i ikony, kolejność, usuwanie z potwierdzeniem, limit 20 (bez licznika widgetów, decyzja 4);
  - [ ] po przeładowaniu karty pulpit pojawia się z cache bez szkieletów;
  - [ ] odrzucona przez API zmiana jest cofana z toastem (zadanie 14, krok 5);
  - [ ] testy API sprawdzają 401 bez sesji, 404 dla cudzego kontekstu, 400 dla niepoprawnych danych i niezależność ustawień dwóch użytkowników (`settings.test.ts`, `contexts.test.ts`);
  - [ ] startowy JS mieści się w nowym budżecie, a pierwszy render z cache trwa poniżej 200 ms.
- [ ] **6.** `pnpm check` (oczekiwany wynik: 16 + 53 + 47 = **116 testów**), potem commit: `docs: add stage 2 results and new JS budget`.

---

## Materiały

| Temat                                         | Gdzie czytać                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| TanStack Query dla Vue                        | https://tanstack.com/query/latest/docs/framework/vue/overview                              |
| TanStack Query: mutacje optymistyczne         | https://tanstack.com/query/latest/docs/framework/vue/guides/optimistic-updates             |
| TanStack Query: ponowienia                    | https://tanstack.com/query/latest/docs/framework/vue/guides/query-retries                  |
| TanStack Query: tryb sieci                    | https://tanstack.com/query/latest/docs/framework/vue/guides/network-mode                   |
| TanStack Query: `onlineManager`               | https://tanstack.com/query/latest/docs/reference/onlineManager                             |
| TanStack Query: odświeżanie przy powrocie     | https://tanstack.com/query/latest/docs/framework/vue/guides/window-focus-refetching        |
| TanStack Query: persister                     | https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient          |
| TanStack Query: `createAsyncStoragePersister` | https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister |
| Pinia: setup stores                           | https://pinia.vuejs.org/core-concepts/                                                     |
| Pinia: store poza komponentem                 | https://pinia.vuejs.org/core-concepts/outside-component-usage.html                         |
| Hono: walidacja                               | https://hono.dev/docs/guides/validation                                                    |
| `@hono/zod-validator`                         | https://github.com/honojs/middleware/tree/main/packages/zod-validator                      |
| Hono RPC i `parseResponse`                    | https://hono.dev/docs/guides/rpc                                                           |
| Drizzle: własne typy kolumn                   | https://orm.drizzle.team/docs/custom-types                                                 |
| Drizzle: upsert (`onConflictDoUpdate`)        | https://orm.drizzle.team/docs/insert                                                       |
| Drizzle: `$count`                             | https://orm.drizzle.team/docs/query-utils                                                  |
| Postgres: kolacje                             | https://www.postgresql.org/docs/18/collation.html                                          |
| `fractional-indexing`                         | https://github.com/rocicorp/fractional-indexing                                            |
| `uuid` i UUIDv7 (RFC 9562)                    | https://github.com/uuidjs/uuid, https://www.rfc-editor.org/rfc/rfc9562                     |
| `vue-draggable-plus`                          | https://vue-draggable-plus.pages.dev/en/                                                   |
| Nuxt UI: Tabs, Modal, Slideover               | https://ui.nuxt.com/docs/components/tabs (oraz `/modal` i `/slideover`)                    |
| Nuxt UI: `useToast`                           | https://ui.nuxt.com/docs/composables/use-toast                                             |
| Nuxt UI: ikony w aplikacji Vue                | https://ui.nuxt.com/docs/getting-started/integrations/icons/vue                            |
| Vue: `app.runWithContext`                     | https://vuejs.org/api/application.html                                                     |
| vue-i18n: zakres globalny i lokalny           | https://vue-i18n.intlify.dev/guide/essentials/scope                                        |
| `setTimeout`: maksymalne opóźnienie           | https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout                         |
| `performance.mark`                            | https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark                          |
| `modulepreload`                               | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/modulepreload   |

## Co dalej

Po Etapie 2 kolejnym krokiem jest [Etap 3: Siatka i system widgetów](04-roadmapa.md#etap-3-siatka-i-system-widgetów): moduł `widgets` w API z zapisem układu w transakcji, rejestr typów widgetów, `WidgetFrame` z obsługą błędów, siatka `grid-layout-plus` w trybie edycji i ocena ryzyka R4. Przygotuję dla niego podobny plan nauki, gdy będziesz gotowy.
