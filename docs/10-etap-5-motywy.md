# 10. Etap 5: Motywy (plan nauki)

Ten plik prowadzi przez [Etap 5 z roadmapy](04-roadmapa.md#etap-5-motywy). Format jest taki sam jak w [planie Etapu 4](09-etap-4-zadania.md): każde zadanie mówi, **co** zrobić, **dlaczego** i **jak sprawdzić**, że działa. Gotowy kod jest schowany w zwijanych blokach „Rozwiązanie”.

**Cel:** w panelu ustawień wybierasz tryb (jasny, ciemny, systemowy) i kolor akcentu, a pulpit zmienia się od razu. Sekcja „Wygląd kontekstu” pozwala aktywnemu kontekstowi nadpisać tryb, akcent albo oba, a przełącznik „Używaj motywu globalnego” usuwa nadpisanie. Motyw jest zapisany na koncie, więc działa też w drugiej przeglądarce. Nowa karta od pierwszej klatki ma właściwy motyw, bez mignięcia jasnym tłem.

**Architektura:** `shared` dostaje typy motywu, `DEFAULT_THEME` i `resolveTheme` w pliku bez Zoda oraz schematy w osobnym pliku. API zapisuje motyw globalny w kolumnie `user_settings.theme`, a nadpisanie w `contexts.theme_override` (obie `jsonb`, `null` oznacza „domyślny” albo „bez nadpisania”). W rozszerzeniu `applyTheme` ustawia klasę `dark` i zmienne `--ui-color-primary-*` na `<html>` i zapisuje motyw w `localStorage`. Mały klasyczny skrypt `public/theme-boot.js` odtwarza ten zapis, zanim przeglądarka cokolwiek namaluje. `useAccountTheme` składa motyw globalny z nadpisaniem aktywnego kontekstu, a `useAppliedTheme` stosuje wynik i reaguje na zmianę motywu systemu.

**Specyfikacja:** F-THEME-01 … F-THEME-06 w [02-specyfikacja.md](02-specyfikacja.md#motywy-theme), sekcje „Motywy”, „Start nowej karty” i „Persister” w [03-architektura.md](03-architektura.md) oraz decyzja D8.

> Rozwiązania sprawdziłem na prototypie 2.11.2026 (macOS, Node 24.7, pnpm 10.24, Postgres 18 w Dockerze, Chrome for Testing 156, Vue 3.5.43, TanStack Query 5.104, Nuxt UI 4.11, VueUse 14.4): 281 testów, lint, typecheck i build. Prototyp zbudowałem na zweryfikowanym prototypie Etapu 4. W przeglądarce z załadowanym rozszerzeniem sprawdziłem: wybór trybu i akcentu w panelu, nadpisanie w kontekście i jego usunięcie, przełączanie kontekstów, stan po przeładowaniu, wygląd pierwszej klatki z `theme-boot.js` i bez niego, zmianę motywu systemu bez przeładowania (także na ekranie logowania), wylogowanie, zmianę motywu offline, szybkie klikanie akcentów przy wolnej sieci, stary cache bez nowych pól (offline i przy wyłączonym API), migrację na bazie z istniejącymi wierszami, czas pierwszego renderu i prywatność (żadnych żądań poza API). Scenariusze sprawdziłem w zbudowanej paczce, a główny przepływ także w `pnpm dev`.

## Jak korzystać z planu

Tak samo jak w poprzednich etapach:

1. Przeczytaj całe zadanie przed rozpoczęciem.
2. Odhaczaj kroki (`- [ ]` na `- [x]`).
3. W krokach z testem **najpierw zobacz czerwony test**, dopiero potem pisz implementację.
4. Gdy utkniesz na ponad 15 minut, otwórz „Podpowiedź”, a potem „Rozwiązanie”.
5. Każde zadanie kończy się zielonym `pnpm check` i commitem.
6. Na końcu zadania odpowiedz na pytania kontrolne.

Kroki oznaczone jako **eksperyment** celowo pokazują błąd, zanim go naprawisz. W tym etapie większość z nich dotyczy rzeczy, które dzieją się szybciej, niż widać gołym okiem: pierwszej klatki przed zamontowaniem aplikacji, odpowiedzi starszej zmiany, która na chwilę przywraca poprzedni kolor, i danych z cache zapisanych przez starszą wersję rozszerzenia.

## Wymagania wstępne

- [ ] Etap 4 jest skończony, a `pnpm check` przechodzi (234 testy)
- [ ] Postgres działa: `docker compose up -d`
- [ ] Migracje z Etapów 1–4 są zastosowane: `pnpm --filter @one-place/api db:migrate`
- [ ] `pnpm dev` uruchamia API i przeglądarkę z rozszerzeniem
- [ ] `pnpm --filter @one-place/extension build && pnpm size` pokazuje około 492 kB

## Ograniczenia globalne

Obowiązują ograniczenia z [Etapu 0](05-implementacja-poczatkowa.md#ograniczenia-globalne), [Etapu 1](06-etap-1-logowanie.md#ograniczenia-globalne), [Etapu 2](07-etap-2-konteksty.md#ograniczenia-globalne), [Etapu 3](08-etap-3-siatka-i-widgety.md#ograniczenia-globalne) i [Etapu 4](09-etap-4-zadania.md#ograniczenia-globalne) oraz:

- **Ten etap nie dodaje pakietów.** `@vueuse/core` (`usePreferredDark`) jest w rozszerzeniu od Etapu 3.
- Na ścieżce startowej rozszerzenia nie ma Zoda. Motyw jest potrzebny przed pierwszym renderem, więc wszystko, czego używa `applyTheme` i `useAccountTheme`, pochodzi z `shared/theme.ts`, a nie z `theme-schemas.ts`.
- Komponenty nigdy nie wołają API bezpośrednio. Robią to tylko composables z `src/queries/`.
- Akcent ustawiamy wyłącznie przez zmienne `--ui-color-primary-*` na `<html>` (decyzja z ryzyka R3), a tryb przez klasę `dark`. Wbudowany color mode Nuxt UI zostaje wyłączony (`colorMode: false`).
- Startowy JS mieści się w budżecie 550 kB.
- Teksty w UI tylko przez i18n. Nazwy w kodzie, opisy testów, komunikaty błędów API, logi i commity po angielsku.

## Decyzje dla tego etapu

Ustalone przed napisaniem planu. Zadanie 14 przenosi je do dokumentacji.

1. **„Wygląd kontekstu” jest w panelu ustawień, dla aktywnego kontekstu.** Panel ma sekcję „Wygląd” (motyw globalny) i pod nią „Wygląd kontekstu »Praca«”. Każdą zmianę widać od razu na pulpicie za panelem. Okno „Zarządzaj kontekstami” zostaje bez zmian. Zadanie 12.
2. **Nadpisanie działa pole po polu.** Po wyłączeniu „Używaj motywu globalnego” tryb i akcent mają dodatkową opcję „Globalny”. Można nadpisać sam akcent, a tryb dalej idzie za motywem globalnym (F-THEME-03). Wyłączenie przełącznika zapisuje puste nadpisanie `{}`, a włączenie zapisuje `null`. Zadania 1 i 12.
3. **Typy motywu są w `theme.ts`, a schematy w `theme-schemas.ts`.** Architektura trzyma je razem, ale rozszerzenie potrzebuje `DEFAULT_THEME` i `resolveTheme` przy starcie, a jeden import ze Zodem kosztuje około 92 kB (lekcja z Etapu 3). Test typów (`expectTypeOf`) pilnuje, żeby schemat i typ opisywały te same dane. Zadania 2 i 13.
4. **`null` w bazie oznacza wartość domyślną.** `user_settings.theme` i `contexts.theme_override` mogą być `null`. API zamienia `null` w ustawieniach na `DEFAULT_THEME`, więc `SettingsDto.theme` zawsze jest pełne. Kolumny można więc dodać do tabel z istniejącymi wierszami, a nowy motyw domyślny nie wymaga migracji. Zadania 3 i 4.
5. **`PATCH /settings` przyjmuje cały motyw.** Rozszerzenie zawsze ma pełny `theme` w cache, więc wysyła go w całości. API nie musi scalać fragmentów. Zadanie 4.
6. **Skrypt startowy dostaje gotowe zmienne CSS i tryb, a nie wynik.** `applyTheme` zapisuje `{ mode, vars }`. Skrypt nie powtarza listy odcieni, a w trybie systemowym sam pyta system, więc zmiana motywu systemu przy zamkniętej przeglądarce nie miga starym. Zadania 6 i 7.
7. **Bez zalogowania obowiązuje motyw domyślny.** Ekran logowania stosuje `DEFAULT_THEME` (systemowy, niebieski). Wylogowanie zapisuje go w miejsce motywu konta, zgodnie z F-AUTH-04 (wylogowanie usuwa dane lokalne). Zadanie 8.
8. **Motyw konta stosujemy dopiero, gdy są ustawienia i konteksty.** Do tego czasu strona zostaje z motywem ze skryptu startowego. Zadanie 8.

## Na co uważać

Dziewięć sytuacji, które łatwo przeoczyć, bo nie dają błędu w konsoli albo pojawiają się dopiero w przeglądarce:

1. **Spread kopiuje `undefined`.** `{ ...global, ...{ accent: undefined } }` daje `accent: undefined`, a nie akcent globalny. Opcja „Globalny” w panelu ustawia właśnie `undefined`, więc przyciski straciłyby kolor. Zadanie 1.
2. **`vitest run` nie sprawdza typów.** `expectTypeOf` w teście łapie rozjazd schematu i typu tylko w `pnpm typecheck`. Same testy przechodzą. Zadanie 2.
3. **Jeden import, cały Zod.** `ThemeSettingsSchema.safeParse` w kodzie startowym dokłada około 92 kB i przekracza budżet. Zadania 2 i 13.
4. **PGlite startuje z pustą bazą.** Kolumna `NOT NULL` bez wartości domyślnej przechodzi wszystkie testy, a `db:migrate` na bazie z istniejącymi ustawieniami kończy się błędem. `drizzle-kit migrate` wychodzi wtedy z kodem 1 bez żadnego komunikatu. Zadanie 3.
5. **Zapisany wynik zamiast trybu.** Skrypt startowy z zapisanym `dark: false` pokaże jasny motyw, nawet jeśli system przełączył się na ciemny, gdy przeglądarka była zamknięta. Zadania 6 i 7.
6. **Aplikacja nie zdąży przed pierwszą klatką.** Bez `theme-boot.js` w większości przeładowań pierwsza klatka jest jasna z domyślnym akcentem, a w `pnpm dev` zawsze. Zadania 7 i 13.
7. **Motyw domyślny „na chwilę”.** Zastosowanie `DEFAULT_THEME`, zanim wczytają się ustawienia (np. po odrzuceniu cache), nadpisuje dobry motyw ze skryptu startowego. Zadanie 8.
8. **Cache bez nowych pól.** Bez zmiany `CACHE_SCHEMA_VERSION` rozszerzenie wczytuje ustawienia bez `theme` i rzuca `TypeError`, a bez sieci motyw w ogóle się nie stosuje. Zadanie 9.
9. **Starsza odpowiedź po nowszej zmianie.** Dwa szybkie kliknięcia akcentu przy wolnej sieci: odpowiedź na pierwsze na chwilę przywraca pierwszy kolor. Zadanie 10.

## Struktura po Etapie 5

Nowe i zmienione pliki:

```
one-place/
├─ packages/shared/src/  theme.ts  theme-schemas.ts  settings.ts  contexts.ts  index.ts  (+ testy)
├─ apps/api/
│  ├─ src/
│  │  ├─ db/schema/  settings.ts  contexts.ts
│  │  ├─ db/migrations/0004_theme.sql
│  │  └─ modules/  settings/service.ts  contexts/service.ts
│  └─ test/  migrations.test.ts  settings.test.ts  contexts.test.ts
└─ apps/extension/
   ├─ public/theme-boot.js
   └─ src/
      ├─ entrypoints/newtab/index.html
      ├─ theme/  apply-theme.ts  use-applied-theme.ts  (+ testy, theme-boot.test.ts)
      ├─ queries/  optimistic.ts  settings.ts  contexts.ts  todos.ts  cache.ts  (+ testy)
      ├─ features/settings/  use-account-theme.ts  ThemeModePicker.vue  AccentPicker.vue
      │                      ThemeOverrideFields.vue  SettingsSlideover.vue  (+ testy)
      ├─ features/auth/AuthScreen.vue
      ├─ features/dashboard/DashboardScreen.vue
      └─ i18n/  pl.json  en.json
```

---

## Zadanie 1: `DEFAULT_THEME` i `resolveTheme` w `shared` (TDD)

**Cel:** jedno miejsce, które mówi, jak wygląda motyw i jak składa się motyw efektywny. Każde pole nadpisania, które nie jest `undefined`, zastępuje pole globalne ([03-architektura.md](03-architektura.md#motywy)). Plik zostaje bez Zoda, bo rozszerzenie potrzebuje go przed pierwszym renderem.

**Czego się nauczysz:** typy pochodne (`Partial<Omit<…>>`), unia z jednym wariantem przygotowana na kolejne, różnica między spreadem a `??` przy polach z `undefined`.

**Pliki:**

- Zmień: `packages/shared/src/theme.ts`
- Test: `packages/shared/src/theme.test.ts`

**Interfejsy:**

- Korzysta z: `ACCENT_COLORS`, `AccentColor`, `COLOR_SHADES` i `accentCssVariables` (Etap 0, ten sam plik).
- Wytwarza: `THEME_MODES`, `ThemeMode`, `ThemeBackground`, `ThemeSettings`, `ThemeOverride`, `DEFAULT_THEME`, `resolveTheme(global, override?)`. Używają ich zadania 2, 4, 6, 8, 11 i 12.

**Kroki:**

- [ ] **1. Czerwone testy** w `src/theme.test.ts`, w nowym `describe('resolveTheme')`, z motywem globalnym `{ ...DEFAULT_THEME, mode: 'dark', accent: 'green' }`:
  - bez nadpisania (`undefined`, `null` i `{}`) wynik równa się motywowi globalnemu;
  - `{ accent: 'rose' }` zmienia tylko akcent, a `{ mode: 'light' }` tylko tryb;
  - `{ mode: 'system', accent: 'teal' }` zmienia oba pola;
  - `{ accent: undefined }` daje motyw globalny;
  - wywołanie nie zmienia obiektu motywu globalnego.
- [ ] **2. Uruchom.** `pnpm --filter @one-place/shared test`. Oczekiwany wynik: **FAIL**, bo `DEFAULT_THEME` i `resolveTheme` nie istnieją.
- [ ] **3. Implementacja** w `src/theme.ts`: stałe trybów, typy, `DEFAULT_THEME` (`system`, `blue`, tło `none`) i `resolveTheme`, które składa wynik pole po polu przez `??`. Na górze pliku dopisz komentarz, że plik jest bez Zoda.
- [ ] **4. Zielone testy.** Oczekiwany wynik: **PASS (36 testów w `shared`)**.
- [ ] **5. Eksperyment: spread.** Zamień ciało `resolveTheme` na `return { ...global, ...override }`. Oczekiwany wynik: wszystkie testy przechodzą poza `ignores a field set to undefined`, który daje **FAIL**: wynik ma `accent: undefined`. Przywróć `??`.
- [ ] **6.** `pnpm format && pnpm check`, potem commit: `feat(shared): add theme types and resolveTheme`.

**Pułapki (sprawdzone na prototypie):**

- **Klucz z `undefined` to też klucz.** Spread kopiuje wszystkie własne pola obiektu, także te z wartością `undefined`. W zadaniu 12 opcja „Globalny” ustawia pole nadpisania na `undefined` (`{ ...override, accent: undefined }`), a optymistyczny cache trzyma ten obiekt, zanim odpowie API. `JSON.stringify` pomija takie pola, więc w bazie ich nie ma, ale w karcie są.
- **TypeScript na to pozwala.** `tsconfig.base.json` nie ma `exactOptionalPropertyTypes`, więc `{ accent: undefined }` pasuje do `ThemeOverride`. Test jest jedynym zabezpieczeniem.
- **Tło w nadpisaniu.** `ThemeOverride` obejmuje też `background`, choć UI go nie pokazuje (F-THEME-06). Gdy dojdzie tło pulpitu, kontekst będzie mógł mieć własne bez zmiany typów.
- **Bez Zoda.** Ten plik importuje rozszerzenie przy starcie (`applyTheme`, `useAccountTheme`). Schematy trafią do osobnego pliku w zadaniu 2.

<details>
<summary>Podpowiedź</summary>

- `ThemeOverride` to `Partial<Omit<ThemeSettings, 'schemaVersion'>>`.
- `resolveTheme` zwraca nowy obiekt z czterema polami. `schemaVersion` zawsze bierze z motywu globalnego, a pozostałe pola jako `override?.pole ?? global.pole`.

</details>

<details>
<summary>Rozwiązanie</summary>

`packages/shared/src/theme.ts`

```ts
// Constants, types and functions without Zod: the extension uses them on the start-up path.
// The schemas are in theme-schemas.ts.

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

export const THEME_MODES = ['light', 'dark', 'system'] as const

export type ThemeMode = (typeof THEME_MODES)[number]

// F-THEME-06: the MVP has no background yet. Later: color, gradient, image.
export type ThemeBackground = { type: 'none' }

export interface ThemeSettings {
  schemaVersion: 1
  mode: ThemeMode
  accent: AccentColor
  background: ThemeBackground
}

// A context overrides only the fields it has (F-THEME-03)
export type ThemeOverride = Partial<Omit<ThemeSettings, 'schemaVersion'>>

export const DEFAULT_THEME: ThemeSettings = {
  schemaVersion: 1,
  mode: 'system',
  accent: 'blue',
  background: { type: 'none' },
}

export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export function accentCssVariables(accent: AccentColor): Record<string, string> {
  return Object.fromEntries(
    COLOR_SHADES.map((shade) => [`--ui-color-primary-${shade}`, `var(--color-${accent}-${shade})`]),
  )
}

// The effective theme: each field of the override that is set replaces the global one
export function resolveTheme(
  global: ThemeSettings,
  override?: ThemeOverride | null,
): ThemeSettings {
  return {
    schemaVersion: global.schemaVersion,
    mode: override?.mode ?? global.mode,
    accent: override?.accent ?? global.accent,
    background: override?.background ?? global.background,
  }
}
```

`packages/shared/src/theme.test.ts` (nowe importy i nowy `describe` na końcu pliku)

```ts
import { describe, expect, it } from 'vitest'
import {
  accentCssVariables,
  COLOR_SHADES,
  DEFAULT_THEME,
  resolveTheme,
  type ThemeSettings,
} from './theme'

// … describe('accentCssVariables') bez zmian …

describe('resolveTheme', () => {
  const global: ThemeSettings = { ...DEFAULT_THEME, mode: 'dark', accent: 'green' }

  it('returns the global theme without an override', () => {
    expect(resolveTheme(global)).toEqual(global)
    expect(resolveTheme(global, null)).toEqual(global)
    expect(resolveTheme(global, {})).toEqual(global)
  })

  it('replaces only the fields the override has', () => {
    expect(resolveTheme(global, { accent: 'rose' })).toEqual({ ...global, accent: 'rose' })
    expect(resolveTheme(global, { mode: 'light' })).toEqual({ ...global, mode: 'light' })
  })

  it('replaces both fields', () => {
    expect(resolveTheme(global, { mode: 'system', accent: 'teal' })).toEqual({
      ...global,
      mode: 'system',
      accent: 'teal',
    })
  })

  // The settings panel removes a field by setting it to undefined ("same as the global theme")
  it('ignores a field set to undefined', () => {
    expect(resolveTheme(global, { accent: undefined })).toEqual(global)
  })

  it('does not change the global theme', () => {
    resolveTheme(global, { accent: 'rose' })
    expect(global.accent).toBe('green')
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co zwróci `{ ...{ accent: 'green' }, ...{ accent: undefined } }`?** `{ accent: undefined }`. Spread kopiuje każde własne pole obiektu, także to z wartością `undefined`, więc późniejszy obiekt nadpisuje wcześniejszy. `??` sprawdza wartość, a nie obecność klucza.
2. **Dlaczego `ThemeOverride` nie ma `schemaVersion`?** Wersja opisuje kształt całego zapisanego motywu. Nadpisanie nigdy nie występuje samo, zawsze składa się z motywem globalnym, który tę wersję niesie. Gdy kształt się zmieni, migracja obejmie obie kolumny.
3. **Dlaczego `resolveTheme` jest w `shared`, a nie w rozszerzeniu?** To czysta reguła modelu danych, opisana w architekturze i testowana jednostkowo bez przeglądarki. W `shared` jest dostępna także dla API, gdyby kiedyś musiało znać motyw efektywny (np. przy eksporcie danych).

</details>

---

## Zadanie 2: schematy motywu bez wpływu na ścieżkę startową

**Cel:** schematy Zod, którymi API sprawdzi motyw w zadaniach 4 i 5. Leżą w osobnym pliku, więc rozszerzenie może importować typy i funkcje z `theme.ts` bez Zoda. Test typów pilnuje, żeby schemat i ręcznie napisany typ nie rozjechały się.

**Czego się nauczysz:** `z.discriminatedUnion` z jednym wariantem, `.omit().partial()` na schemacie, `expectTypeOf` z Vitest i to, kto go naprawdę sprawdza.

**Pliki:**

- Utwórz: `packages/shared/src/theme-schemas.ts`
- Zmień: `packages/shared/src/index.ts`
- Test: `packages/shared/src/theme-schemas.test.ts`

**Interfejsy:**

- Korzysta z: `ACCENT_COLORS`, `THEME_MODES`, `ThemeSettings`, `ThemeOverride`, `DEFAULT_THEME` (zadanie 1).
- Wytwarza: `ThemeSettingsSchema` i `ThemeOverrideSchema`. Używają ich zadania 4 i 5.

**Kroki:**

- [ ] **1. Czerwone testy** w `src/theme-schemas.test.ts`:
  - `ThemeSettingsSchema` przyjmuje `DEFAULT_THEME`;
  - odrzuca tryb `'sepia'`, akcent `'red'`, tło `{ type: 'image' }` i `schemaVersion: 2`;
  - odrzuca niepełny motyw `{ mode: 'dark' }`;
  - `ThemeOverrideSchema` przyjmuje `{}`, `{ accent: 'rose' }` i `{ mode: 'dark', accent: 'teal' }`, a odrzuca `{ accent: 'red' }`;
  - `ThemeOverrideSchema.parse({ schemaVersion: 1, mode: 'light' })` daje `{ mode: 'light' }`;
  - dwa testy typów: `expectTypeOf<z.infer<typeof ThemeSettingsSchema>>().toEqualTypeOf<ThemeSettings>()` i to samo dla nadpisania.
- [ ] **2. Uruchom.** Oczekiwany wynik: **FAIL**, bo moduł `./theme-schemas` nie istnieje.
- [ ] **3. Implementacja** `src/theme-schemas.ts`. W `src/index.ts` dopisz eksport pod `./theme`.
- [ ] **4. Zielone testy** i typy: `pnpm --filter @one-place/shared test` (**PASS, 44 testy**) oraz `pnpm --filter @one-place/shared typecheck` (bez błędów).
- [ ] **5. Eksperyment: kto sprawdza `expectTypeOf`.** W pierwszym teście typów zamień `toEqualTypeOf<ThemeSettings>()` na `toEqualTypeOf<ThemeOverride>()`. `pnpm --filter @one-place/shared test`: **PASS**, wszystkie 44. `pnpm --filter @one-place/shared typecheck`: błąd TS2344. Przywróć.
- [ ] **6. Eksperyment: węższy schemat.** W `ThemeSettingsSchema` zamień `z.enum(THEME_MODES)` na `z.enum(['light', 'dark'])`. Testy: **FAIL** jeden (`accepts the default theme`, bo domyślny tryb to `system`). Typecheck: dwa błędy TS2344 w testach typów, bo `z.infer` nie zgadza się już z `ThemeSettings` ani z `ThemeOverride`. Przywróć.
- [ ] **7.** `pnpm format && pnpm check`, potem commit: `feat(shared): add theme schemas`.

**Pułapki (sprawdzone na prototypie):**

- **`expectTypeOf` w czasie działania nic nie robi.** To funkcja, której sygnatura każe kompilatorowi porównać typy. `vitest run` uruchamia testy przez esbuild, który typy usuwa, więc błąd widzi dopiero `tsc` (`pnpm typecheck`). `pnpm check` uruchamia oba, dlatego commit po zielonym `pnpm check` jest bezpieczny.
- **Dlaczego nie `z.infer`.** Można by wyprowadzić typy przez `z.infer` w `theme-schemas.ts` i wziąć je do `theme.ts` przez `import type`, który znika po kompilacji. Wtedy oba pliki importowałyby się nawzajem, a o tym, czy Zod trafi na ścieżkę startową, decydowałoby jedno słowo `type`. Typ napisany ręcznie i test zgodności są czytelniejsze (decyzja 3).
- **Jedna gałąź unii.** `z.discriminatedUnion('type', [z.object({ type: z.literal('none') })])` wygląda na przesadę, ale nowe tło (np. `color`) to jedna nowa gałąź, bez zmiany kształtu danych w bazie.
- **`.omit().partial()` usuwa nieznane pola.** `schemaVersion` w nadpisaniu nie przejdzie do bazy, tak jak `widgetId` przy zadaniu w Etapie 4.

<details>
<summary>Podpowiedź</summary>

- Nadpisanie to `ThemeSettingsSchema.omit({ schemaVersion: true }).partial()`.
- W teście `z` jest potrzebne tylko jako typ: `import type { z } from 'zod'`.

</details>

<details>
<summary>Rozwiązanie</summary>

`packages/shared/src/theme-schemas.ts`

```ts
import { z } from 'zod'
import { ACCENT_COLORS, THEME_MODES } from './theme'

// The types are in theme.ts, so the start-up path does not need Zod. The tests check that the
// schemas and the types describe the same data.
export const ThemeSettingsSchema = z.object({
  schemaVersion: z.literal(1),
  mode: z.enum(THEME_MODES),
  accent: z.enum(ACCENT_COLORS),
  background: z.discriminatedUnion('type', [z.object({ type: z.literal('none') })]),
})

export const ThemeOverrideSchema = ThemeSettingsSchema.omit({ schemaVersion: true }).partial()
```

`packages/shared/src/theme-schemas.test.ts`

```ts
import { describe, expect, expectTypeOf, it } from 'vitest'
import type { z } from 'zod'
import { DEFAULT_THEME, type ThemeOverride, type ThemeSettings } from './theme'
import { ThemeOverrideSchema, ThemeSettingsSchema } from './theme-schemas'

describe('ThemeSettingsSchema', () => {
  it('accepts the default theme', () => {
    expect(ThemeSettingsSchema.parse(DEFAULT_THEME)).toEqual(DEFAULT_THEME)
  })

  it('rejects an unknown mode, accent, background or schema version', () => {
    expect(ThemeSettingsSchema.safeParse({ ...DEFAULT_THEME, mode: 'sepia' }).success).toBe(false)
    expect(ThemeSettingsSchema.safeParse({ ...DEFAULT_THEME, accent: 'red' }).success).toBe(false)
    const image = { ...DEFAULT_THEME, background: { type: 'image' } }
    expect(ThemeSettingsSchema.safeParse(image).success).toBe(false)
    expect(ThemeSettingsSchema.safeParse({ ...DEFAULT_THEME, schemaVersion: 2 }).success).toBe(
      false,
    )
  })

  it('requires every field', () => {
    expect(ThemeSettingsSchema.safeParse({ mode: 'dark' }).success).toBe(false)
  })

  it('matches the ThemeSettings type', () => {
    expectTypeOf<z.infer<typeof ThemeSettingsSchema>>().toEqualTypeOf<ThemeSettings>()
  })
})

describe('ThemeOverrideSchema', () => {
  it('accepts any subset of the fields', () => {
    expect(ThemeOverrideSchema.parse({})).toEqual({})
    expect(ThemeOverrideSchema.parse({ accent: 'rose' })).toEqual({ accent: 'rose' })
    expect(ThemeOverrideSchema.parse({ mode: 'dark', accent: 'teal' })).toEqual({
      mode: 'dark',
      accent: 'teal',
    })
  })

  it('validates the fields it has', () => {
    expect(ThemeOverrideSchema.safeParse({ accent: 'red' }).success).toBe(false)
  })

  it('drops the schema version', () => {
    expect(ThemeOverrideSchema.parse({ schemaVersion: 1, mode: 'light' })).toEqual({
      mode: 'light',
    })
  })

  it('matches the ThemeOverride type', () => {
    expectTypeOf<z.infer<typeof ThemeOverrideSchema>>().toEqualTypeOf<ThemeOverride>()
  })
})
```

`packages/shared/src/index.ts` (nowa linia pod `./theme`)

```ts
export * from './theme-schemas'
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Rozszerzenie importuje wszystko z `@one-place/shared`, a indeks eksportuje też `theme-schemas.ts`. Dlaczego Zod nie trafia na ścieżkę startową?** `"sideEffects": false` w `package.json` pakietu pozwala bundlerowi pominąć moduły, z których nic nie jest używane. Dopóki kod startowy nie użyje żadnej wartości z `theme-schemas.ts`, plik (i Zod) zostaje poza paczką. Zadanie 13 pokazuje, co się stanie, gdy użyje.
2. **Co by się stało bez testów typów, gdyby ktoś dopisał `'red'` do `ACCENT_COLORS`, ale schemat budował listę sam?** Rozszerzenie pokazałoby próbkę `red`, a API odrzuciłoby zapis z 400 i zmiana by się cofnęła. Tutaj schemat bierze listę z tej samej stałej, a test typów łapie każdy inny rozjazd.
3. **Dlaczego `ThemeSettingsSchema` nie ma `.default()` na polach, jak `TodoConfigSchema`?** Konfiguracja widgetu może być pusta (`{}`) i dostaje wartości domyślne przy odczycie. Motyw zawsze przychodzi w całości (decyzja 5), a brak motywu w bazie oznacza `null` i `DEFAULT_THEME` w serwisie (zadanie 4).

</details>

---

## Zadanie 3: kolumny motywu i piąta migracja

**Cel:** `user_settings.theme` i `contexts.theme_override` jako `jsonb` z możliwą wartością `null`. Migracja musi przejść na bazie, w której są już ustawienia i konteksty z poprzednich etapów.

**Czego się nauczysz:** kolumna `jsonb` z typem (`$type<…>()`) w Drizzle, `ALTER TABLE … ADD COLUMN` na tabeli z danymi, dlaczego testy na pustej bazie nie wystarczą.

**Pliki:**

- Zmień: `apps/api/src/db/schema/settings.ts`, `apps/api/src/db/schema/contexts.ts`
- Utwórz (wygeneruje drizzle-kit): `apps/api/src/db/migrations/0004_theme.sql` i `meta/0004_snapshot.json`
- Test: `apps/api/test/migrations.test.ts`

**Interfejsy:**

- Korzysta z: `ThemeSettings`, `ThemeOverride` (zadanie 1).
- Wytwarza: kolumny `userSettings.theme` i `contexts.themeOverride`. Używają ich zadania 4 i 5.

**Kroki:**

- [ ] **1. Czerwony test** w `test/migrations.test.ts`: zapytanie do `information_schema.columns` o kolumny `theme` i `theme_override` zwraca dwa wiersze z `data_type: 'jsonb'` i `is_nullable: 'YES'`. Oczekiwany wynik: **FAIL** (pusta lista).
- [ ] **2. Schemat.** W `settings.ts` dopisz `theme: jsonb('theme').$type<ThemeSettings>()`, a w `contexts.ts` `themeOverride: jsonb('theme_override').$type<ThemeOverride>()`. Bez `.notNull()`.
- [ ] **3. Migracja.** `pnpm --filter @one-place/api db:generate --name theme`. W pliku SQL są dwa `ALTER TABLE … ADD COLUMN … jsonb`.
- [ ] **4. Zielony test.** `pnpm --filter @one-place/api test`. Oczekiwany wynik: **PASS (98 testów w API)**.
- [ ] **5. Eksperyment: `NOT NULL` na istniejących danych.** Najpierw upewnij się, że baza w Dockerze ma wiersz w `user_settings` (np. zmieniłeś język w Etapie 2): `docker compose exec db psql -U one one_place -c 'select count(*) from user_settings'`. Jeśli jest 0, zmień język w panelu ustawień. Teraz dopisz `.notNull()` do kolumny `theme`, usuń `0004_theme.sql` i `meta/0004_snapshot.json`, przywróć `meta/_journal.json` (`git checkout apps/api/src/db/migrations/meta/_journal.json`) i wygeneruj migrację jeszcze raz. W SQL jest `ADD COLUMN "theme" jsonb NOT NULL`. `pnpm --filter @one-place/api db:migrate`: **błąd z kodem 1 bez komunikatu**. Uruchom to samo polecenie ręcznie: `docker compose exec db psql -U one one_place -c 'ALTER TABLE "user_settings" ADD COLUMN "theme" jsonb NOT NULL'`. Odpowiedź: `column "theme" of relation "user_settings" contains null values`. Testy na PGlite w tym czasie: test migracji **FAIL** i dwa testy `PATCH /api/settings` **FAIL**. Testy ustawień padają tylko dlatego, że serwis jeszcze nie zapisuje motywu, a po zadaniu 4 by przechodziły. Na stałe pilnuje tego test migracji. Usuń `.notNull()`, powtórz usunięcie plików i przywrócenie `_journal.json` z kroku i wygeneruj migrację z kroku 3.
- [ ] **6. Migracja w Dockerze.** `pnpm --filter @one-place/api db:migrate`, potem `docker compose exec db psql -U one one_place -c 'select user_id, locale, theme from user_settings'`. Istniejące wiersze mają `theme` puste (`null`).
- [ ] **7.** `pnpm format && pnpm check`, potem commit: `feat(api): add theme columns`.

**Pułapki (sprawdzone na prototypie):**

- **PGlite zawsze startuje od zera.** `createTestApp()` stosuje wszystkie migracje na pustej bazie, więc `ADD COLUMN … NOT NULL` przechodzi, bo nie ma wierszy, które naruszyłyby warunek. Test migracji sprawdza `is_nullable`, bo inaczej żaden test nie zauważy problemu.
- **`drizzle-kit migrate` milczy.** Przy błędzie SQL pokazuje tylko kręcący się wskaźnik i `ELIFECYCLE Command failed with exit code 1`. Komunikat Postgresa widać dopiero, gdy uruchomisz SQL ręcznie w `psql`.
- **Migracja jest transakcją.** Po błędzie drugiej instrukcji pierwsza (`theme_override`) też się wycofuje, więc baza zostaje w stanie sprzed migracji i można ją powtórzyć.
- **Dlaczego nie `NOT NULL DEFAULT '{…}'`.** Zadziałałoby, ale motyw domyślny byłby wtedy zapisany w dwóch miejscach: w migracji i w `DEFAULT_THEME`. Zmiana motywu domyślnego wymagałaby migracji, a wiersze sprzed niej miałyby stary (decyzja 4).

<details>
<summary>Podpowiedź</summary>

- `jsonb` importujesz z `drizzle-orm/pg-core`, tak jak `varchar`.
- Kolumna bez `.notNull()` ma w Drizzle typ `ThemeSettings | null`. W zadaniu 4 TypeScript wymusi obsługę `null`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/db/schema/settings.ts`

```ts
import type { Locale, ThemeSettings } from '@one-place/shared'
import { integer, jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  // null means "follow the browser language"
  locale: varchar('locale', { length: 8 }).$type<Locale>(),
  // null means the default theme, so a new default does not need a migration
  theme: jsonb('theme').$type<ThemeSettings>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
})
```

`apps/api/src/db/schema/contexts.ts` (zmienione importy i nowa kolumna pod `position`)

```ts
import type { ContextIcon, ThemeOverride } from '@one-place/shared'
import { index, jsonb, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'

// …
    position: fractionalIndex('position').notNull(),
    // null means the context uses the global theme
    themeOverride: jsonb('theme_override').$type<ThemeOverride>(),
    ...timestamps,
```

`apps/api/src/db/migrations/0004_theme.sql` (wygenerowany)

```sql
ALTER TABLE "contexts" ADD COLUMN "theme_override" jsonb;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "theme" jsonb;
```

`apps/api/test/migrations.test.ts` (nowy test na końcu `describe`)

```ts
// null means the default theme (or no override), so the columns can be added to tables that
// already have rows. PGlite starts empty, so it would not notice a NOT NULL column.
it('add nullable theme columns', async () => {
  const { client } = await createTestApp()
  const { rows } = await client.query(
    `select table_name, column_name, data_type, is_nullable from information_schema.columns
       where column_name in ('theme', 'theme_override') order by table_name`,
  )
  expect(rows).toEqual([
    {
      table_name: 'contexts',
      column_name: 'theme_override',
      data_type: 'jsonb',
      is_nullable: 'YES',
    },
    { table_name: 'user_settings', column_name: 'theme', data_type: 'jsonb', is_nullable: 'YES' },
  ])
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego `jsonb`, a nie osobne kolumny `mode` i `accent`?** Motyw ma `schemaVersion` i unię `background`, która w przyszłości dostanie warianty z różnymi polami (kolor, gradient, obraz). W `jsonb` nowy wariant nie wymaga migracji, a cały motyw i tak jest czytany i zapisywany w całości. Walidację robi schemat Zod w API.
2. **Czym różni się `jsonb` od `json` w Postgresie?** `jsonb` jest zapisany w postaci binarnej: bez zbędnych spacji, z kluczami bez powtórzeń, z możliwością indeksowania. `json` przechowuje dokładny tekst. Drizzle zwraca w obu przypadkach obiekt JavaScript.
3. **Co się stanie z kontekstami utworzonymi przed migracją?** Dostaną `theme_override = null`, czyli „Używaj motywu globalnego”. To dokładnie to, czego chcemy, i dlatego kolumna może być pusta.

</details>

---

## Zadanie 4: motyw globalny w `/settings`

**Cel:** `GET /settings` zawsze zwraca pełny motyw (domyślny, gdy go jeszcze nie zapisano), a `PATCH /settings` przyjmuje cały motyw i zapisuje go obok języka. Zmiana języka nie rusza motywu i odwrotnie.

**Czego się nauczysz:** jak TypeScript prowadzi przez zmianę DTO w trzech pakietach, wartość domyślna przy odczycie zamiast w bazie, upsert, który zmienia tylko podane pola.

**Pliki:**

- Zmień: `packages/shared/src/settings.ts`, `apps/api/src/modules/settings/service.ts`, `apps/extension/src/queries/settings.test.ts`
- Test: `packages/shared/src/settings.test.ts`, `apps/api/test/settings.test.ts`

**Interfejsy:**

- Korzysta z: `ThemeSettingsSchema` (zadanie 2), `DEFAULT_THEME` i `ThemeSettings` (zadanie 1), kolumny `userSettings.theme` (zadanie 3).
- Wytwarza: `theme` w `UpdateSettingsSchema` i `SettingsDto`. Używają go zadania 8, 10 i 11.

**Kroki:**

- [ ] **1. Czerwony test** w `packages/shared/src/settings.test.ts`: `UpdateSettingsSchema` przyjmuje `{ theme: { ...DEFAULT_THEME, mode: 'dark' } }` i odrzuca `{ theme: { mode: 'dark' } }`. Oczekiwany wynik: **FAIL**.
- [ ] **2. Implementacja w `shared`.** `theme: ThemeSettingsSchema` w `UpdateSettingsSchema` i `theme: ThemeSettings` w `SettingsDto`. Oczekiwany wynik: **PASS (45 testów w `shared`)**.
- [ ] **3. Niech TypeScript pokaże resztę.** `pnpm typecheck`. Oczekiwany wynik: błędy w `apps/api/src/modules/settings/service.ts` (dwa obiekty bez `theme`). Rozszerzenie zgłosi swój błąd (fikstura w `queries/settings.test.ts`) dopiero wtedy, gdy API przestanie mieć błędy, bo `pnpm -r typecheck` zatrzymuje się na pierwszym pakiecie z błędem.
- [ ] **4. Czerwone testy API** w `test/settings.test.ts`:
  - `GET` bez zapisanych ustawień i pierwszy `PATCH` z samym językiem zwracają też `theme: DEFAULT_THEME` (popraw dwa istniejące `toEqual`);
  - zapisany motyw `{ ...DEFAULT_THEME, mode: 'dark', accent: 'green' }` wraca w odpowiedzi i zostaje po zmianie języka;
  - język zostaje po zmianie motywu;
  - motyw z akcentem `'red'` i sam fragment `{ accent: 'green' }` dają 400 `VALIDATION_ERROR`.

  Oczekiwany wynik: **FAIL**.

- [ ] **5. Implementacja w serwisie.** `DEFAULT_SETTINGS` dostaje `theme: DEFAULT_THEME`, a `toSettingsDto` zamienia `null` z kolumny na `DEFAULT_THEME`. `updateSettings` nie wymaga zmian. Oczekiwany wynik: **PASS (101 testów w API)**.
- [ ] **6. Fikstura w rozszerzeniu.** W `apps/extension/src/queries/settings.test.ts` obiekt `saved` dostaje `theme: DEFAULT_THEME`. `pnpm typecheck` przechodzi.
- [ ] **7. Eksperyment: wiersz bez motywu.** W `toSettingsDto` zamień `row.theme ?? DEFAULT_THEME` na samo `row.theme`. `pnpm --filter @one-place/api typecheck`: błąd `Type 'ThemeSettings | null' is not assignable to type 'ThemeSettings'`. Teraz „ucisz” go: `row.theme!`. Typecheck przechodzi, a test `creates the row on the first save and returns it` daje **FAIL**: wiersz utworzony przez zmianę języka ma `theme: null`. Przywróć `?? DEFAULT_THEME`.
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(api): save the global theme in settings`.

**Pułapki (sprawdzone na prototypie):**

- **Upsert zmienia tylko to, co dostał.** `.values({ userId, ...input })` i `set: { ...input, … }` zawierają `theme` tylko wtedy, gdy przyszedł w żądaniu. Zmiana języka nie nadpisuje więc motywu, a test z kroku 4 pilnuje, żeby nikt nie wpisał tam np. `theme: input.theme ?? DEFAULT_THEME`.
- **`!` to obietnica, nie sprawdzenie.** Operator `!` mówi kompilatorowi „tu nie ma `null`”, ale niczego nie sprawdza. Wiersz z `null` istnieje naprawdę: każdy użytkownik, który przed Etapem 5 zmienił język, ma w bazie ustawienia bez motywu.
- **Cały motyw.** Fragment `{ accent: 'green' }` dostaje 400, bo `ThemeSettingsSchema` wymaga wszystkich pól (decyzja 5). Gdyby API przyjmowało fragmenty, musiałoby je scalać z zapisanym motywem, a dwie karty zmieniające różne pola nadpisywałyby sobie nawzajem stan.

<details>
<summary>Podpowiedź</summary>

- W `settings.ts` w `shared` typ importuj przez `import type { ThemeSettings } from './theme'`, a schemat zwykłym importem z `./theme-schemas`.
- Serwis: `DEFAULT_THEME` jest wartością, więc import `{ DEFAULT_THEME, type SettingsDto, type UpdateSettingsInput }`.

</details>

<details>
<summary>Rozwiązanie</summary>

`packages/shared/src/settings.ts`

```ts
import { z } from 'zod'
import type { ThemeSettings } from './theme'
import { ThemeSettingsSchema } from './theme-schemas'

export const LOCALES = ['pl', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const UpdateSettingsSchema = z
  .object({
    // null means "follow the browser language" (F-I18N-02)
    locale: z.enum(LOCALES).nullable(),
    // The whole theme, not single fields: the extension always has it (F-THEME-04)
    theme: ThemeSettingsSchema,
  })
  .partial()

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>

export interface SettingsDto {
  locale: Locale | null
  theme: ThemeSettings
  // null and 0 until the user saves settings for the first time
  updatedAt: string | null
  version: number
}
```

`packages/shared/src/settings.test.ts` (nowy import i nowy test)

```ts
import { DEFAULT_THEME } from './theme'

// …
it('accepts a whole theme and rejects a part of it', () => {
  const theme = { ...DEFAULT_THEME, mode: 'dark' }
  expect(UpdateSettingsSchema.parse({ theme })).toEqual({ theme })
  expect(UpdateSettingsSchema.safeParse({ theme: { mode: 'dark' } }).success).toBe(false)
})
```

`apps/api/src/modules/settings/service.ts` (początek pliku, `updateSettings` bez zmian)

```ts
import { DEFAULT_THEME, type SettingsDto, type UpdateSettingsInput } from '@one-place/shared'
import { eq, sql } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { userSettings } from '../../db/schema'

// The row is created on the first save, so sign-up does not need an extra hook
const DEFAULT_SETTINGS: SettingsDto = {
  locale: null,
  theme: DEFAULT_THEME,
  updatedAt: null,
  version: 0,
}

function toSettingsDto(row: typeof userSettings.$inferSelect): SettingsDto {
  return {
    locale: row.locale,
    // A row saved before the user chose a theme (e.g. only the language) has null
    theme: row.theme ?? DEFAULT_THEME,
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  }
}
```

`apps/api/test/settings.test.ts` (nowy import, poprawione oczekiwania i trzy nowe testy przed `keeps settings of each user separate`)

```ts
import { DEFAULT_THEME } from '@one-place/shared'

// w 'returns defaults before the first save':
expect(await res.json()).toEqual({
  locale: null,
  theme: DEFAULT_THEME,
  updatedAt: null,
  version: 0,
})

// w 'creates the row on the first save and returns it':
expect(await res.json()).toEqual({
  locale: 'en',
  theme: DEFAULT_THEME,
  updatedAt: expect.any(String),
  version: 1,
})

// nowe testy:
it('saves the theme and keeps it when the language changes', async () => {
  const { alice } = await setup()
  const theme = { ...DEFAULT_THEME, mode: 'dark', accent: 'green' }
  const res = await alice.patch('/api/settings', { theme })
  expect(await res.json()).toMatchObject({ theme, locale: null })
  await alice.patch('/api/settings', { locale: 'en' })
  expect(await (await alice.get('/api/settings')).json()).toMatchObject({ theme, locale: 'en' })
})

it('keeps the language when the theme changes', async () => {
  const { alice } = await setup()
  await alice.patch('/api/settings', { locale: 'en' })
  await alice.patch('/api/settings', { theme: { ...DEFAULT_THEME, accent: 'rose' } })
  expect(await (await alice.get('/api/settings')).json()).toMatchObject({
    locale: 'en',
    theme: { accent: 'rose' },
  })
})

it('rejects an unknown accent and a part of a theme', async () => {
  const { alice } = await setup()
  for (const theme of [{ ...DEFAULT_THEME, accent: 'red' }, { accent: 'green' }]) {
    const res = await alice.patch('/api/settings', { theme })
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  }
})
```

`apps/extension/src/queries/settings.test.ts` (import i fikstura)

```ts
import { DEFAULT_THEME, type SettingsDto } from '@one-place/shared'

const saved: SettingsDto = { locale: null, theme: DEFAULT_THEME, updatedAt: null, version: 0 }
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Gdzie jest wartość domyślna motywu i dlaczego tylko tam?** W `DEFAULT_THEME` w `shared`. API zwraca ją dla wiersza z `null` i dla braku wiersza, a rozszerzenie używa jej na ekranie logowania. Baza jej nie zna, więc zmiana motywu domyślnego to zmiana jednej stałej.
2. **Dlaczego `GET /settings` nie zapisuje motywu domyślnego w bazie przy pierwszym odczycie?** Odczyt nie powinien zmieniać danych, a wiersz i tak powstanie przy pierwszym zapisie (Etap 2). Gdyby zapisywał, użytkownik dostałby na stałe motyw domyślny z dnia odczytu.
3. **Co zobaczy rozszerzenie z Etapu 4, jeśli rozmawia z nowym API?** Dodatkowe pole `theme`, którego nie używa. Nowe pole w odpowiedzi jest zmianą zgodną wstecz. Problem pojawia się w drugą stronę: nowe rozszerzenie ze starym cache (zadanie 9).

</details>

---

## Zadanie 5: nadpisanie motywu w `/contexts/:id`

**Cel:** `PATCH /contexts/:id` przyjmuje `themeOverride` (obiekt albo `null`), a każdy kontekst w odpowiedziach ma pole `themeOverride`. Nowy kontekst zaczyna bez nadpisania.

**Czego się nauczysz:** `.extend()` na schemacie zbudowanym z innego, kolejność `.extend()` i `.partial()`, `null` jako jawne „usuń”.

**Pliki:**

- Zmień: `packages/shared/src/contexts.ts`, `apps/api/src/modules/contexts/service.ts`, `apps/extension/src/queries/contexts.ts`, `apps/extension/src/queries/contexts.test.ts`
- Test: `packages/shared/src/contexts.test.ts`, `apps/api/test/contexts.test.ts`

**Interfejsy:**

- Korzysta z: `ThemeOverrideSchema` (zadanie 2), `ThemeOverride` (zadanie 1), kolumny `contexts.themeOverride` (zadanie 3).
- Wytwarza: `themeOverride` w `UpdateContextSchema` i `ContextDto`. Używają go zadania 8, 10 i 12.

**Kroki:**

- [ ] **1. Czerwone testy** w `packages/shared/src/contexts.test.ts`:
  - `UpdateContextSchema` przyjmuje `{ themeOverride: { accent: 'rose' } }` i `{ themeOverride: null }`, a odrzuca `{ themeOverride: { accent: 'red' } }`;
  - `CreateContextSchema` pomija `themeOverride` (wynik równa się danym bez niego).

  Oczekiwany wynik: **FAIL**.

- [ ] **2. Implementacja w `shared`.** `UpdateContextSchema` to `CreateContextSchema.omit({ id: true }).extend({ themeOverride: ThemeOverrideSchema.nullable() }).partial()`. `ContextDto` dostaje `themeOverride: ThemeOverride | null`. Oczekiwany wynik: **PASS (47 testów w `shared`)**.
- [ ] **3. Czerwone testy API** w `test/contexts.test.ts`:
  - `POST` zwraca `themeOverride: null`;
  - `PATCH` z `{ themeOverride: { accent: 'rose' } }` zapisuje nadpisanie, późniejsza zmiana nazwy go nie rusza, a `{ themeOverride: null }` je usuwa;
  - `{ themeOverride: { accent: 'red' } }` daje 400.

  Oczekiwany wynik: **FAIL**.

- [ ] **4. Implementacja.** W `toContextDto` dopisz `themeOverride: row.themeOverride`. `updateContext` nie wymaga zmian. Oczekiwany wynik: **PASS (102 testy w API)**.
- [ ] **5. Rozszerzenie.** `pnpm typecheck` pokaże dwa miejsca: szkic kontekstu w `useCreateContext` (`queries/contexts.ts`) i fiksturę `context()` w `queries/contexts.test.ts`. W obu dopisz `themeOverride: null`. Oczekiwany wynik: `pnpm check` przechodzi (106 testów w rozszerzeniu).
- [ ] **6. Eksperyment: kolejność `.partial()` i `.extend()`.** Zamień kolejność na `CreateContextSchema.omit({ id: true }).partial().extend({ … })`. Oczekiwany wynik: w `shared` **FAIL** `accepts a single field and validates it`, w API **FAIL** trzy testy `PATCH` (zmiana samej nazwy dostaje 400), a `pnpm typecheck` zgłasza błędy w `ContextRow.vue` i `ManageContexts.vue`, bo `themeOverride` stał się wymagany w każdej zmianie kontekstu. Przywróć kolejność.
- [ ] **7.** `pnpm format && pnpm check`, potem commit: `feat(api): save a theme override in a context`.

**Pułapki (sprawdzone na prototypie):**

- **`.partial()` działa na polach, które już są.** Pole dodane przez `.extend()` po `.partial()` jest wymagane. Stąd kolejność: najpierw zbierz wszystkie pola, na końcu `.partial()`.
- **`null` i brak pola to co innego.** `{ name: 'Dom' }` nie dotyka nadpisania, bo Drizzle pomija w `set()` klucze, których nie ma. `{ themeOverride: null }` zapisuje `null` w kolumnie. Test z kroku 3 sprawdza oba przypadki.
- **`themeOverride` tylko w `PATCH`.** Nowy kontekst zawsze zaczyna z motywem globalnym, więc `CreateContextSchema` go nie zna, a Zod po cichu usuwa takie pole (test z kroku 1).
- **Szkic w cache.** Mutacja optymistyczna buduje `ContextDto` sama, zanim odpowie API. Bez `themeOverride: null` nowy kontekst miałby w cache `undefined`, czyli inny kształt niż z serwera.

<details>
<summary>Podpowiedź</summary>

- W `contexts.ts` w `shared` dopisz `import type { ThemeOverride } from './theme'` i `import { ThemeOverrideSchema } from './theme-schemas'`.
- `ThemeOverrideSchema.nullable()` przyjmuje obiekt nadpisania albo `null`.

</details>

<details>
<summary>Rozwiązanie</summary>

`packages/shared/src/contexts.ts` (importy, `UpdateContextSchema` i `ContextDto`)

```ts
import { z } from 'zod'
import type { ThemeOverride } from './theme'
import { ThemeOverrideSchema } from './theme-schemas'

// …

export const UpdateContextSchema = CreateContextSchema.omit({ id: true })
  .extend({
    // null removes the override, so the context uses the global theme (F-THEME-03)
    themeOverride: ThemeOverrideSchema.nullable(),
  })
  .partial()

// …

export interface ContextDto {
  id: string
  name: string
  icon: ContextIcon
  position: string
  themeOverride: ThemeOverride | null
  createdAt: string
  updatedAt: string
  version: number
}
```

`packages/shared/src/contexts.test.ts` (dwa nowe testy w `describe('UpdateContextSchema')`)

```ts
it('accepts a theme override or null that removes it', () => {
  expect(UpdateContextSchema.parse({ themeOverride: { accent: 'rose' } })).toEqual({
    themeOverride: { accent: 'rose' },
  })
  expect(UpdateContextSchema.parse({ themeOverride: null })).toEqual({ themeOverride: null })
  expect(UpdateContextSchema.safeParse({ themeOverride: { accent: 'red' } }).success).toBe(false)
})

it('does not take a theme override when creating a context', () => {
  expect(CreateContextSchema.parse({ ...validContext, themeOverride: {} })).toEqual(validContext)
})
```

`apps/api/src/modules/contexts/service.ts` (w `toContextDto`)

```ts
    position: row.position,
    themeOverride: row.themeOverride,
    createdAt: row.createdAt.toISOString(),
```

`apps/api/test/contexts.test.ts` (w `creates a context and returns the full record with 201`, pod `position`)

```ts
      themeOverride: null,
```

`apps/api/test/contexts.test.ts` (nowy test przed `returns 404 for another user's context and leaves it unchanged`)

```ts
it('saves a theme override and removes it with null', async () => {
  const { alice } = await setup()
  const input = contextInput()
  await alice.post('/api/contexts', input)
  const path = `/api/contexts/${input.id}`
  const res = await alice.patch(path, { themeOverride: { accent: 'rose' } })
  expect(await res.json()).toMatchObject({ themeOverride: { accent: 'rose' } })
  await alice.patch(path, { name: 'Dom' })
  expect(await (await alice.get('/api/contexts')).json()).toMatchObject([
    { name: 'Dom', themeOverride: { accent: 'rose' } },
  ])
  expect(await (await alice.patch(path, { themeOverride: null })).json()).toMatchObject({
    themeOverride: null,
  })
})
```

`apps/api/test/contexts.test.ts` (na końcu `rejects an id that is not a UUID and invalid fields`)

```ts
const override = { themeOverride: { accent: 'red' } }
expect((await alice.patch(`/api/contexts/${input.id}`, override)).status).toBe(400)
```

`apps/extension/src/queries/contexts.ts` (szkic w `useCreateContext`)

```ts
const draft: ContextDto = {
  ...input,
  themeOverride: null,
  createdAt: now,
  updatedAt: now,
  version: 1,
}
```

`apps/extension/src/queries/contexts.test.ts` (w fiksturze `context()`, pod `position`)

```ts
    themeOverride: null,
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Czym różnią się `themeOverride: null` i `themeOverride: {}`?** `null` to „Używaj motywu globalnego” (przełącznik włączony). `{}` to nadpisanie bez żadnego pola: motyw efektywny jest taki sam jak globalny, ale przełącznik jest wyłączony, a pola pokazują „Globalny”. Zadanie 12 korzysta z tej różnicy.
2. **Dlaczego `updateContext` w serwisie nie wymagał zmian?** Przyjmuje `UpdateContextInput` i przekazuje go do `set()`. Nowe pole w schemacie przechodzi przez walidację i trafia do bazy bez nowego kodu. Zmienił się tylko odczyt (`toContextDto`), bo DTO jest pisane ręcznie.
3. **Co zwróci API na `PATCH` z `{ themeOverride: { schemaVersion: 1 } }`?** 200 z `themeOverride: {}`. `ThemeOverrideSchema` pomija `schemaVersion` (zadanie 2), więc zostaje puste nadpisanie.

</details>

---

## Zadanie 6: `applyTheme`

**Cel:** jedna funkcja, która nakłada motyw na stronę: klasa `dark` na `<html>`, zmienne akcentu jako styl inline i zapis w `localStorage` dla skryptu startowego. Nie wie nic o API ani o Vue.

**Czego się nauczysz:** testy DOM w happy-dom, `classList.toggle(name, force)`, `style.setProperty` dla zmiennych CSS, bezpieczny zapis w `localStorage`.

**Pliki:**

- Utwórz: `apps/extension/src/theme/apply-theme.ts`
- Test: `apps/extension/src/theme/apply-theme.test.ts`

**Interfejsy:**

- Korzysta z: `accentCssVariables`, `ThemeMode`, `ThemeSettings` (`shared/theme.ts`).
- Wytwarza: `THEME_STORAGE_KEY` (`'one-place:theme'`), `StoredTheme` (`{ mode, vars }`), `isDark(mode, systemDark)`, `applyTheme(theme, systemDark)`. Używają ich zadania 7 i 8.

**Kroki:**

- [ ] **1. Czerwone testy** w `src/theme/apply-theme.test.ts` (pierwsza linia: `// @vitest-environment happy-dom`). Po każdym teście wyczyść klasę i styl `<html>` oraz `localStorage`:
  - tryb `dark` ustawia klasę `dark`, a `light` ją zdejmuje, także gdy system jest ciemny;
  - tryb `system` idzie za drugim argumentem;
  - drugi akcent zastępuje pierwszy (`--ui-color-primary-500` i `-950`);
  - w `localStorage` pod `THEME_STORAGE_KEY` jest `{ mode: 'system', vars: { … } }` z wartościami akcentu;
  - gdy `localStorage.setItem` rzuca wyjątek, motyw i tak trafia na stronę.
- [ ] **2. Uruchom.** `pnpm --filter @one-place/extension test`. Oczekiwany wynik: **FAIL**, bo moduł nie istnieje.
- [ ] **3. Implementacja** `src/theme/apply-theme.ts`.
- [ ] **4. Zielone testy.** Oczekiwany wynik: **PASS (111 testów w rozszerzeniu)**.
- [ ] **5. Eksperyment: środowisko testu.** Usuń komentarz `// @vitest-environment happy-dom` i uruchom testy. Oczekiwany wynik: `ReferenceError: document is not defined` jeszcze przed pierwszym testem, a Vitest pokazuje plik z „no tests”. Przywróć komentarz.
- [ ] **6.** `pnpm format && pnpm check`, potem commit: `feat(extension): apply the theme to the page`.

**Pułapki (sprawdzone na prototypie):**

- **Zapisuj tryb, a nie wynik.** `applyTheme` zna `systemDark` i mogłoby zapisać gotowe `dark: true`. Wtedy skrypt startowy nie zauważyłby, że system zmienił motyw, gdy przeglądarka była zamknięta. Zadanie 7 ma na to test i eksperyment.
- **Styl inline wygrywa.** Nuxt UI wstrzykuje w trakcie działania regułę `:root` z `--ui-color-primary-*` dla koloru z konfiguracji (`blue`). Styl inline na `<html>` ma wyższy priorytet niż każda reguła z arkusza (R3).
- **`localStorage` może rzucić.** Pełny albo zablokowany storage rzuca `QuotaExceededError` lub `SecurityError`. Motyw na stronie jest ważniejszy niż jego zapis, więc `try/catch` obejmuje tylko `setItem`.
- **`vi.restoreAllMocks()`.** `vi.spyOn(Storage.prototype, 'setItem')` podmienia metodę dla wszystkich testów w pliku, dopóki jej nie przywrócisz.

<details>
<summary>Podpowiedź</summary>

- `root.classList.toggle('dark', isDark(theme.mode, systemDark))` dodaje albo usuwa klasę w jednym wywołaniu.
- W teście spy na `Storage.prototype.setItem` z `mockImplementation(() => { throw new Error('QuotaExceededError') })`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/theme/apply-theme.ts`

```ts
import { accentCssVariables, type ThemeMode, type ThemeSettings } from '@one-place/shared'

// public/theme-boot.js reads this entry before the first paint (F-THEME-05)
export const THEME_STORAGE_KEY = 'one-place:theme'

// The mode, not the result: in the system mode the boot script asks the system itself, so a
// change of the system theme while the browser was closed does not flash the old one
export interface StoredTheme {
  mode: ThemeMode
  vars: Record<string, string>
}

export function isDark(mode: ThemeMode, systemDark: boolean) {
  return mode === 'dark' || (mode === 'system' && systemDark)
}

export function applyTheme(theme: ThemeSettings, systemDark: boolean) {
  const root = document.documentElement
  const vars = accentCssVariables(theme.accent)
  root.classList.toggle('dark', isDark(theme.mode, systemDark))
  // An inline style wins over the :root rule that Nuxt UI adds at run time
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
  const stored: StoredTheme = { mode: theme.mode, vars }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Storage may be blocked or full. The theme still works until the tab is closed.
  }
}
```

`apps/extension/src/theme/apply-theme.test.ts`

```ts
// @vitest-environment happy-dom
import { DEFAULT_THEME, type ThemeSettings } from '@one-place/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, THEME_STORAGE_KEY } from './apply-theme'

const root = document.documentElement
const theme = (changes: Partial<ThemeSettings>) => ({ ...DEFAULT_THEME, ...changes })

afterEach(() => {
  root.className = ''
  root.removeAttribute('style')
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('applyTheme', () => {
  it('sets the dark class for the dark mode and removes it for the light one', () => {
    applyTheme(theme({ mode: 'dark' }), false)
    expect(root.classList.contains('dark')).toBe(true)
    applyTheme(theme({ mode: 'light' }), true)
    expect(root.classList.contains('dark')).toBe(false)
  })

  it('follows the system in the system mode', () => {
    applyTheme(theme({ mode: 'system' }), true)
    expect(root.classList.contains('dark')).toBe(true)
    applyTheme(theme({ mode: 'system' }), false)
    expect(root.classList.contains('dark')).toBe(false)
  })

  it('replaces the accent variables', () => {
    applyTheme(theme({ accent: 'green' }), false)
    applyTheme(theme({ accent: 'rose' }), false)
    expect(root.style.getPropertyValue('--ui-color-primary-500')).toBe('var(--color-rose-500)')
    expect(root.style.getPropertyValue('--ui-color-primary-950')).toBe('var(--color-rose-950)')
  })

  it('saves the mode and the variables for the boot script', () => {
    applyTheme(theme({ mode: 'system', accent: 'teal' }), true)
    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')
    expect(stored.mode).toBe('system')
    expect(stored.vars['--ui-color-primary-500']).toBe('var(--color-teal-500)')
  })

  it('still applies the theme when the storage is not available', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    applyTheme(theme({ mode: 'dark' }), false)
    expect(root.classList.contains('dark')).toBe(true)
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego `applyTheme` dostaje `systemDark` jako argument, zamiast samo zapytać `matchMedia`?** Funkcja zostaje czysta względem systemu: test podaje wartość wprost, bez podmieniania `matchMedia`. Nasłuchiwanie zmian i tak należy do warstwy Vue (`usePreferredDark` w zadaniu 8), która przy każdej zmianie wywoła `applyTheme` z nową wartością.
2. **Dlaczego `localStorage`, a nie `chrome.storage.local`, jak reszta danych?** `chrome.storage` jest asynchroniczne, więc skrypt startowy nie zdążyłby odczytać motywu przed pierwszą klatką. `localStorage` czyta się synchronicznie. Na stronie rozszerzenia jest przypisane do originu `chrome-extension://<id>`, więc nie miesza się z niczym innym.
3. **Co zrobi `applyTheme`, gdy `theme.background` będzie miało nowy typ?** Na razie nic, ignoruje tło (F-THEME-06). Nowy wariant tła to nowa gałąź w `applyTheme`, a kształt zapisu `StoredTheme` dostanie wtedy nowe pole.

</details>

---

## Zadanie 7: `theme-boot.js`: motyw przed pierwszym malowaniem

**Cel:** mały klasyczny skrypt w `<head>` nowej karty odtwarza zapisany motyw, zanim przeglądarka cokolwiek namaluje (F-THEME-05). Test pilnuje, że skrypt i `applyTheme` dają identyczny `<html>`.

**Czego się nauczysz:** skrypt klasyczny a modułowy, katalog `public/` w WXT, import pliku jako tekstu (`?raw`), uruchamianie takiego skryptu w teście.

**Pliki:**

- Utwórz: `apps/extension/public/theme-boot.js`
- Zmień: `apps/extension/src/entrypoints/newtab/index.html`
- Test: `apps/extension/src/theme/theme-boot.test.ts`

**Interfejsy:**

- Korzysta z: `applyTheme`, `THEME_STORAGE_KEY` (zadanie 6).
- Wytwarza: `/theme-boot.js` w zbudowanym rozszerzeniu.

**Kroki:**

- [ ] **1. Czerwone testy** w `src/theme/theme-boot.test.ts` (happy-dom). Skrypt wczytaj jako tekst: `import bootScript from '../../public/theme-boot.js?raw'`, a uruchamiaj przez `new Function(bootScript)()` po podmianie `matchMedia` (`vi.stubGlobal`):
  - po `applyTheme({ …, mode: 'dark', accent: 'green' }, false)` i wyczyszczeniu `<html>` skrypt odtwarza tę samą klasę i ten sam atrybut `style`;
  - zapisany tryb `system` i system ciemny dają klasę `dark`;
  - bez zapisu i z uszkodzonym zapisem (`'{broken'`) skrypt stosuje tryb systemowy.

  Oczekiwany wynik: **FAIL**, bo pliku nie ma.

- [ ] **2. Skrypt** `apps/extension/public/theme-boot.js`: odczyt zapisu w `try/catch`, tryb systemowy jako wartość domyślna, klasa `dark` i zmienne z zapisu. Całość w bloku `{ … }`, żeby zmienne nie trafiły do zakresu globalnego. Oczekiwany wynik: **PASS (114 testów w rozszerzeniu)**.
- [ ] **3. Podłączenie.** W `index.html` dopisz w `<head>`, pod `<title>`, linię `<script src="/theme-boot.js"></script>` (bez `type="module"`).
- [ ] **4. Build.** `pnpm --filter @one-place/extension build`. W `.output/chrome-mv3/` jest `theme-boot.js` (około 0,8 kB), a w `newtab.html` skrypt stoi w `<head>` przed `<script type="module" …>`.
- [ ] **5. Eksperyment: wynik zamiast trybu.** W `applyTheme` zapisz `mode: isDark(theme.mode, systemDark) ? 'dark' : 'light'` zamiast `mode: theme.mode`. Oczekiwany wynik: **FAIL** dwa testy: `saves the mode and the variables for the boot script` i `asks the system in the system mode`. Tak wyglądałby zapis „gotowego wyniku”: zapisany jasny motyw, choć system jest już ciemny. Przywróć.
- [ ] **6.** `pnpm format && pnpm check`, potem commit: `feat(extension): apply the saved theme before the first paint`.

**Pułapki (sprawdzone na prototypie):**

- **Klasyczny, nie modułowy.** Skrypt z `type="module"` jest odroczony: wykonuje się dopiero po sparsowaniu całego dokumentu. Klasyczny `<script src>` w `<head>` wstrzymuje parsowanie, więc wykonuje się przed pierwszym malowaniem. Vite zostawia go w HTML bez zmian.
- **Plik, nie skrypt inline.** CSP w MV3 nie pozwala na skrypty inline na stronach rozszerzenia. Plik z `public/` jest częścią rozszerzenia, więc jest dozwolony.
- **`public/` obok `src/`.** WXT szuka katalogu `public` w katalogu projektu (`apps/extension/public`), a nie w `srcDir`. Pliki z niego trafiają do paczki bez przetwarzania, także w `pnpm dev`.
- **`readFileSync` w happy-dom.** `readFileSync(new URL('…', import.meta.url))` w środowisku happy-dom kończy się błędem `The URL must be of scheme file`, bo `URL` jest wtedy klasą z happy-dom. Import `?raw` przez Vite nie ma tego problemu, a WXT zna już jego typy.
- **`JSON.parse(null)` to `null`.** Bez zapisu `localStorage.getItem` zwraca `null`, a `JSON.parse(null)` daje `null`, stąd `?? theme`. Uszkodzony zapis rzuca wyjątek, stąd `try/catch`.
- **Skrypt nie czeka na CSS.** Ustawia tylko klasę i zmienne na `<html>`. Arkusz z `<link rel="stylesheet">` i tak blokuje malowanie, więc pierwsza klatka ma już właściwe kolory.

<details>
<summary>Podpowiedź</summary>

- W skrypcie: `let theme = { mode: 'system', vars: {} }`, potem `theme = JSON.parse(localStorage.getItem('one-place:theme')) ?? theme` w `try`.
- W teście `vi.stubGlobal('matchMedia', () => ({ matches: systemDark }))`, a w `afterEach` `vi.unstubAllGlobals()`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/public/theme-boot.js`

```js
// Runs before the first paint, so the new tab never flashes another theme (F-THEME-05).
// A classic script file, not a module: modules run only after the page is parsed, and MV3 does
// not allow inline scripts. It repeats what applyTheme() in src/theme/apply-theme.ts does with
// the saved entry. The block keeps the variables out of the global scope.
{
  let theme = { mode: 'system', vars: {} }
  try {
    theme = JSON.parse(localStorage.getItem('one-place:theme')) ?? theme
  } catch {
    // A broken entry: the system mode until the app applies the right theme
  }
  const root = document.documentElement
  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches
  root.classList.toggle('dark', theme.mode === 'dark' || (theme.mode === 'system' && systemDark))
  for (const [name, value] of Object.entries(theme.vars)) root.style.setProperty(name, value)
}
```

`apps/extension/src/entrypoints/newtab/index.html` (w `<head>`)

```html
<title>Nowa karta</title>
<script src="/theme-boot.js"></script>
```

`apps/extension/src/theme/theme-boot.test.ts`

```ts
// @vitest-environment happy-dom
import { DEFAULT_THEME } from '@one-place/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import bootScript from '../../public/theme-boot.js?raw'
import { applyTheme, THEME_STORAGE_KEY } from './apply-theme'

const root = document.documentElement

function resetPage() {
  root.className = ''
  root.removeAttribute('style')
}

function boot(systemDark: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: systemDark }))
  new Function(bootScript)()
}

afterEach(() => {
  resetPage()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('theme-boot.js', () => {
  it('gives the page the same look as applyTheme', () => {
    applyTheme({ ...DEFAULT_THEME, mode: 'dark', accent: 'green' }, false)
    const applied = { className: root.className, style: root.getAttribute('style') }
    resetPage()
    boot(false)
    expect({ className: root.className, style: root.getAttribute('style') }).toEqual(applied)
  })

  it('asks the system in the system mode', () => {
    applyTheme({ ...DEFAULT_THEME, mode: 'system' }, false)
    resetPage()
    boot(true)
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('uses the system mode without a saved theme or with a broken one', () => {
    boot(true)
    expect(root.classList.contains('dark')).toBe(true)
    resetPage()
    localStorage.setItem(THEME_STORAGE_KEY, '{broken')
    boot(true)
    expect(root.classList.contains('dark')).toBe(true)
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Klucz `'one-place:theme'` jest wpisany w skrypcie ręcznie, a nie importowany. Co pilnuje, że zgadza się z `THEME_STORAGE_KEY`?** Pierwszy test: `applyTheme` zapisuje pod stałą, a skrypt czyta pod swoim kluczem. Literówka w którymkolwiek miejscu daje pusty `<html>` po `boot()` i **FAIL**.
2. **Dlaczego skrypt bez zapisu stosuje tryb systemowy, a nie zostawia strony bez zmian?** Tryb systemowy to `DEFAULT_THEME.mode`. Bez zapisu (pierwsze uruchomienie, ekran logowania) aplikacja i tak zastosuje motyw domyślny, więc skrypt robi to samo wcześniej. Inaczej przy ciemnym systemie pierwsza klatka byłaby jasna.
3. **Dlaczego skrypt nie ustawia zmiennych akcentu, gdy nie ma zapisu?** Bez zapisu obowiązuje akcent domyślny (`blue`), a ten sam kolor Nuxt UI ustawia z konfiguracji (`ui.colors.primary`). Pusty `vars` daje więc ten sam wygląd.

</details>

---

## Zadanie 8: motyw efektywny konta

**Cel:** pulpit stosuje motyw globalny złożony z nadpisaniem aktywnego kontekstu, od razu po każdej zmianie i po zmianie motywu systemu (F-THEME-01). Dopóki ustawienia i konteksty nie są wczytane, strona zostaje z motywem ze skryptu startowego. Ekran logowania stosuje motyw domyślny.

**Czego się nauczysz:** `watchEffect` z getterem jako źródłem, `usePreferredDark` z VueUse, testowanie composable w `effectScope` z podmienionym `matchMedia`, wydzielenie czystej funkcji z composable.

**Pliki:**

- Utwórz: `apps/extension/src/theme/use-applied-theme.ts`, `apps/extension/src/features/settings/use-account-theme.ts`
- Zmień: `apps/extension/src/features/dashboard/DashboardScreen.vue`, `apps/extension/src/features/auth/AuthScreen.vue`
- Test: `apps/extension/src/theme/use-applied-theme.test.ts`, `apps/extension/src/features/settings/use-account-theme.test.ts`

**Interfejsy:**

- Korzysta z: `applyTheme` (zadanie 6), `resolveTheme`, `DEFAULT_THEME` (zadanie 1), `useSettings`, `useContexts`, `useActiveContext` (Etap 2).
- Wytwarza: `useAppliedTheme(theme: () => ThemeSettings | null)`, `accountTheme(settings, contexts, active)` i `useAccountTheme()`.

**Kroki:**

- [ ] **1. Czerwone testy** w `src/theme/use-applied-theme.test.ts` (happy-dom). Podmień `matchMedia` na obiekt z getterem `matches` i `addEventListener`, który zapamiętuje słuchacza, żeby test mógł „przełączyć system”. Composable uruchamiaj w `effectScope().run(…)`:
  - motyw jest na stronie od razu, a po zmianie `ref` z motywem po `nextTick()` jest nowy;
  - w trybie `system` przełączenie systemu na ciemny i wywołanie słuchacza dodaje klasę `dark`;
  - getter zwracający `null` zostawia `<html>` bez zmian i niczego nie zapisuje.

  Oczekiwany wynik: **FAIL**.

- [ ] **2. Implementacja** `src/theme/use-applied-theme.ts`: `usePreferredDark()` i `watchEffect`, który woła `applyTheme`, gdy getter zwraca motyw.
- [ ] **3. Eksperyment: jednorazowy odczyt systemu.** Zamień `usePreferredDark()` na `{ value: matchMedia('(prefers-color-scheme: dark)').matches }`. Oczekiwany wynik: **FAIL** `follows a change of the system theme without a reload`. Przywróć.
- [ ] **4. Czerwone testy** w `src/features/settings/use-account-theme.test.ts` dla czystej funkcji `accountTheme`:
  - bez ustawień albo bez kontekstów zwraca `null`;
  - z nadpisaniem aktywnego kontekstu zwraca motyw złożony;
  - dla kontekstu bez nadpisania i bez żadnego kontekstu zwraca motyw globalny.

  Oczekiwany wynik: **FAIL**.

- [ ] **5. Implementacja** `src/features/settings/use-account-theme.ts`: `accountTheme` i `useAccountTheme`, który podaje ją do `useAppliedTheme`. Oczekiwany wynik: **PASS (120 testów w rozszerzeniu)**.
- [ ] **6. Podłączenie.** `useAccountTheme()` w `DashboardScreen.vue` pod `useAccountLocale()`. `useAppliedTheme(() => DEFAULT_THEME)` w `AuthScreen.vue`.
- [ ] **7. Sprawdzenie w przeglądarce** (`pnpm dev`). Zaloguj się i otwórz DevTools na nowej karcie. W zakładce Elements `<html>` ma styl z `--ui-color-primary-*: var(--color-blue-*)`. Rendering → „Emulate CSS media feature prefers-color-scheme” → `dark`: klasa `dark` pojawia się bez przeładowania. Teraz ustaw motyw przez API, wklejając w konsoli tej karty:

  ```js
  const { authToken } = await chrome.storage.local.get('authToken')
  await fetch('http://localhost:3000/api/settings', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      theme: { schemaVersion: 1, mode: 'dark', accent: 'green', background: { type: 'none' } },
    }),
  })
  ```

  Przejdź na inną kartę i wróć (odświeżenie po powrocie): pulpit jest ciemny z zielonym akcentem. Wyloguj się: ekran logowania wraca do motywu domyślnego i dalej reaguje na emulację `prefers-color-scheme`.

- [ ] **8. Eksperyment: motyw domyślny „na chwilę”.** Zaloguj się ponownie (motyw konta jest ciemny i zielony). W `accountTheme` zastąp obie linie ciała jedną: `return resolveTheme(settings?.theme ?? DEFAULT_THEME, active?.themeOverride)` (z importem `DEFAULT_THEME`). Na nowej karcie w konsoli usuń cache zapytań: `await chrome.storage.local.remove('one-place:query-cache')` i zamknij kartę. Zatrzymaj bazę: `docker compose stop db` (API odpowiada wtedy 500, sesja zostaje). Otwórz nową kartę. **Oczekiwany wynik:** jasny motyw z niebieskim akcentem, choć konto ma ciemny i zielony, a w `localStorage` (Application → Local Storage) zapisał się `"mode":"system"`. Przywróć kod, uruchom bazę (`docker compose start db`), otwórz kartę, żeby zapisał się motyw konta, i powtórz: usunięcie cache, `docker compose stop db`, nowa karta. Teraz zostaje ciemny i zielony z ostatniego zapisu. Na koniec `docker compose start db`.
- [ ] **9.** `pnpm format && pnpm check`, potem commit: `feat(extension): apply the effective theme of the account`.

**Pułapki (sprawdzone na prototypie):**

- **`null` znaczy „jeszcze nie wiem”.** Gdy cache zniknął (np. po zmianie `CACHE_SCHEMA_VERSION` w zadaniu 9 albo po 30 dniach), ustawienia przychodzą dopiero z sieci. Motyw domyślny zastosowany w tym czasie nadpisuje dobry motyw ze skryptu startowego, a jeśli API nie odpowie, zostaje na dłużej i trafia do `localStorage`.
- **Czekamy też na konteksty.** Bez kontekstów nie wiadomo, który jest aktywny. Gdyby motyw globalny wszedł przed listą kontekstów, kontekst z nadpisaniem mignąłby motywem globalnym.
- **`usePreferredDark` ustawia wartość od razu.** VueUse odczytuje `matchMedia` przy utworzeniu, a nie dopiero po `onMounted`, więc pierwsze `applyTheme` dostaje właściwy stan systemu, także poza komponentem (w teście w `effectScope`).
- **Ekran logowania też ma słuchacza.** `useAppliedTheme(() => DEFAULT_THEME)` w `AuthScreen` sprawia, że po wylogowaniu motyw wraca do domyślnego i dalej reaguje na zmianę motywu systemu. To jest też miejsce, które spełnia decyzję 7: po wylogowaniu w `localStorage` jest motyw domyślny.
- **Kolejność w `watchEffect`.** Getter i `systemDark.value` są czytane w jednym efekcie, więc efekt zależy od obu. Zmiana kontekstu, ustawień albo systemu wywołuje go ponownie.

<details>
<summary>Podpowiedź</summary>

- `watchEffect(() => { const current = theme(); if (current) applyTheme(current, systemDark.value) })`.
- Słuchacz w podmienionym `matchMedia`: `addEventListener: (_type, listener) => { notify = () => listener({ matches: systemDark }) }`. VueUse czyta `event.matches`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/theme/use-applied-theme.ts`

```ts
import type { ThemeSettings } from '@one-place/shared'
import { usePreferredDark } from '@vueuse/core'
import { watchEffect } from 'vue'
import { applyTheme } from './apply-theme'

// Applies the theme now and after every change, also of the system theme in the system mode
// (F-THEME-01). null means the data is not there yet: the page keeps the theme from the boot script.
export function useAppliedTheme(theme: () => ThemeSettings | null) {
  const systemDark = usePreferredDark()
  watchEffect(() => {
    const current = theme()
    if (current) applyTheme(current, systemDark.value)
  })
}
```

`apps/extension/src/theme/use-applied-theme.test.ts`

```ts
// @vitest-environment happy-dom
import { DEFAULT_THEME, type ThemeSettings } from '@one-place/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { THEME_STORAGE_KEY } from './apply-theme'
import { useAppliedTheme } from './use-applied-theme'

const root = document.documentElement
let systemDark = false
let notify: (() => void) | undefined

// A system whose theme the test can switch, like matchMedia() in the browser
beforeEach(() => {
  systemDark = false
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return systemDark
    },
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      notify = () => listener({ matches: systemDark })
    },
    removeEventListener: () => {},
  }))
})

afterEach(() => {
  root.className = ''
  root.removeAttribute('style')
  localStorage.clear()
  vi.unstubAllGlobals()
})

function setUp(theme: () => ThemeSettings | null) {
  const scope = effectScope()
  scope.run(() => useAppliedTheme(theme))
  return scope
}

describe('useAppliedTheme', () => {
  it('applies the theme at once and after a change', async () => {
    const theme = ref<ThemeSettings>({ ...DEFAULT_THEME, mode: 'dark' })
    setUp(() => theme.value)
    expect(root.classList.contains('dark')).toBe(true)
    theme.value = { ...DEFAULT_THEME, mode: 'light', accent: 'rose' }
    await nextTick()
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.style.getPropertyValue('--ui-color-primary-500')).toBe('var(--color-rose-500)')
  })

  it('follows a change of the system theme without a reload', async () => {
    setUp(() => ({ ...DEFAULT_THEME, mode: 'system' }))
    expect(root.classList.contains('dark')).toBe(false)
    systemDark = true
    notify?.()
    await nextTick()
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('keeps the page as it is until the theme is known', () => {
    root.classList.add('dark')
    setUp(() => null)
    expect(root.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })
})
```

`apps/extension/src/features/settings/use-account-theme.ts`

```ts
import {
  type ContextDto,
  resolveTheme,
  type SettingsDto,
  type ThemeSettings,
} from '@one-place/shared'
import { useActiveContext } from '@/features/contexts/active-context'
import { useContexts } from '@/queries/contexts'
import { useSettings } from '@/queries/settings'
import { useAppliedTheme } from '@/theme/use-applied-theme'

// The effective theme of the dashboard: the global one with the override of the active context.
// null until both the settings and the contexts are loaded: the default theme for a moment
// (or the global one before the override arrives) would flash.
export function accountTheme(
  settings: SettingsDto | undefined,
  contexts: ContextDto[] | undefined,
  active: ContextDto | null,
): ThemeSettings | null {
  if (!settings || !contexts) return null
  return resolveTheme(settings.theme, active?.themeOverride)
}

export function useAccountTheme() {
  const { data: settings } = useSettings()
  const { data: contexts } = useContexts()
  const active = useActiveContext()
  useAppliedTheme(() => accountTheme(settings.value, contexts.value, active.value))
}
```

`apps/extension/src/features/settings/use-account-theme.test.ts`

```ts
import { type ContextDto, DEFAULT_THEME, type SettingsDto } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { accountTheme } from './use-account-theme'

const settings = {
  theme: { ...DEFAULT_THEME, mode: 'dark', accent: 'green' },
} as SettingsDto
const work = { id: 'work', themeOverride: { accent: 'rose' } } as ContextDto
const home = { id: 'home', themeOverride: null } as ContextDto

describe('accountTheme', () => {
  it('waits for both the settings and the contexts', () => {
    expect(accountTheme(undefined, [work], work)).toBeNull()
    expect(accountTheme(settings, undefined, null)).toBeNull()
  })

  it('uses the override of the active context', () => {
    expect(accountTheme(settings, [work, home], work)).toEqual({
      ...settings.theme,
      accent: 'rose',
    })
  })

  it('uses the global theme in a context without an override and without contexts', () => {
    expect(accountTheme(settings, [work, home], home)).toEqual(settings.theme)
    expect(accountTheme(settings, [], null)).toEqual(settings.theme)
  })
})
```

`apps/extension/src/features/dashboard/DashboardScreen.vue` (import i wywołanie)

```ts
import { useAccountTheme } from '@/features/settings/use-account-theme'

// …
useMutationErrorToasts()
useAccountLocale()
useAccountTheme()
```

`apps/extension/src/features/auth/AuthScreen.vue` (skrypt)

```ts
import { DEFAULT_THEME } from '@one-place/shared'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { session } from '@/api/session'
import { useAppliedTheme } from '@/theme/use-applied-theme'
import SignInForm from './SignInForm.vue'
import SignUpForm from './SignUpForm.vue'

const { t } = useI18n()
const mode = ref<'sign-in' | 'sign-up'>('sign-in')
// Signed out there is no account theme. Signing out also removes the saved one (F-AUTH-04).
useAppliedTheme(() => DEFAULT_THEME)
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego `useAccountTheme` jest w `features/settings/`, a `useAppliedTheme` w `theme/`?** `useAppliedTheme` nie wie nic o koncie ani o API: dostaje motyw i go stosuje, więc używa go też ekran logowania. `useAccountTheme` łączy zapytania i aktywny kontekst, tak jak `useAccountLocale` obok niego.
2. **Dlaczego `accountTheme` jest osobną, eksportowaną funkcją?** Cała logika („czekaj na dane, złóż motyw”) siedzi w czystej funkcji, którą da się przetestować bez `QueryClient`, Pinii i przeglądarki. Composable tylko podaje do niej reaktywne dane.
3. **Pulpit z cache: kiedy pierwszy raz wywoła się `applyTheme`?** Przy montażu `DashboardScreen`, bo `main.ts` odtwarza cache przed `mount`, więc ustawienia i konteksty są od razu. Zwykle zastosuje ten sam motyw, który skrypt startowy już ustawił, więc nic się nie zmienia na ekranie.

</details>

---

## Zadanie 9: `CACHE_SCHEMA_VERSION`

**Cel:** rozszerzenie odrzuca cache zapisany przez wersję sprzed Etapu 5, bo ustawienia nie mają w nim `theme`, a konteksty `themeOverride` (F-SYNC-07). Najpierw zobaczysz, co się dzieje bez tej zmiany.

**Czego się nauczysz:** dlaczego typy nie chronią przed danymi z dysku, jak działa `buster` w persisterze, jak przygotować „stary” cache w konsoli.

**Pliki:**

- Zmień: `apps/extension/src/queries/cache.ts`

**Interfejsy:**

- Korzysta z: persistera z Etapu 2 (`buster: CACHE_SCHEMA_VERSION`).
- Wytwarza: `CACHE_SCHEMA_VERSION = '2'`.

**Kroki:**

- [ ] **1. Przygotuj „stary” cache.** W `pnpm dev`, zalogowany, z motywem konta ciemnym i zielonym (zadanie 8), otwórz nową kartę i w konsoli DevTools wklej:

  ```js
  const key = 'one-place:query-cache'
  const cache = JSON.parse((await chrome.storage.local.get(key))[key])
  for (const query of cache.clientState.queries) {
    if (query.queryKey[0] === 'settings') delete query.state.data.theme
    if (query.queryKey[0] === 'contexts')
      for (const context of query.state.data) delete context.themeOverride
  }
  cache.buster = '1'
  await chrome.storage.local.set({ [key]: JSON.stringify(cache) })
  localStorage.removeItem('one-place:theme')
  ```

  Tak wygląda stan po aktualizacji z Etapu 4: cache bez nowych pól i jeszcze bez zapisanego motywu. Zamknij kartę.

- [ ] **2. Eksperyment: bez zmiany wersji.** Zatrzymaj bazę (`docker compose stop db`) i otwórz nową kartę. **Oczekiwany wynik:** w konsoli `TypeError: Cannot read properties of undefined (reading 'schemaVersion')`, a pulpit z cache jest w motywie domyślnym zamiast ciemnego z zielonym. Uruchom bazę (`docker compose start db`) i przejdź na inną kartę i z powrotem: dane przychodzą z API i motyw wraca. Błąd w konsoli zostaje jako ślad.
- [ ] **3. Zmiana wersji.** W `cache.ts` ustaw `CACHE_SCHEMA_VERSION = '2'`.
- [ ] **4. Ten sam stan z nową wersją.** Powtórz krok 1 (fragment ustawia `buster: '1'`, czyli tak, jak zapisała stara wersja) i krok 2. **Oczekiwany wynik:** bez `TypeError`. Pulpit nie ma cache, więc pokazuje szkielety (F-SYNC-02), a motyw jest domyślny, bo nic nie było zapisane. Po `docker compose start db` pulpit i motyw konta przychodzą z API.
- [ ] **5.** `pnpm format && pnpm check` (120 testów w rozszerzeniu, bez zmian), potem commit: `feat(extension): drop the cache saved without theme fields`.

**Pułapki (sprawdzone na prototypie):**

- **Typ mówi „zawsze jest”, dysk mówi co innego.** `SettingsDto.theme` jest wymagane, więc TypeScript nie każe sprawdzać `undefined`. Dane w `chrome.storage.local` zapisała jednak starsza wersja kodu, której ten typ nie dotyczył.
- **Online błąd „sam znika”.** Zapytania z cache są od razu odświeżane, więc z działającym API dane bez `theme` żyją ułamek sekundy. Łatwo to przeoczyć w `pnpm dev`. Widać to dopiero bez sieci albo przy niedziałającym API.
- **Dlaczego nie `settings.theme ?? DEFAULT_THEME`.** Taka łatka naprawiłaby jedno miejsce, ale każde inne, które czyta nowe pola (panel ustawień w zadaniach 11 i 12), potrzebowałoby własnej. `buster` jest jednym mechanizmem na każdą zmianę kształtu cache.
- **Motyw przetrwa zmianę wersji.** `buster` odrzuca tylko cache zapytań. Zapis motywu w `localStorage` zostaje, więc po kolejnej takiej zmianie (np. w Etapie 6) skrypt startowy dalej ustawia właściwy motyw, a `useAccountTheme` czeka na dane, zamiast stosować motyw domyślny (zadanie 8).

<details>
<summary>Podpowiedź</summary>

- W kroku 2 baza musi być zatrzymana, zanim otworzysz kartę. Inaczej odświeżenie zapytań nadpisze stary cache, zanim zobaczysz błąd.
- Po kroku 1 nie przełączaj się do otwartej karty pulpitu: odświeżenie po powrocie też nadpisze cache.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/cache.ts` (stała na początku pliku)

```ts
// F-SYNC-07: bump it whenever the shape of cached data changes. A cache saved with another
// value is thrown away, and the data is fetched again.
export const CACHE_SCHEMA_VERSION = '2'
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Kiedy trzeba zmienić `CACHE_SCHEMA_VERSION`?** Gdy kod zaczyna polegać na kształcie danych, którego stary cache nie ma: nowe wymagane pole, zmieniona nazwa albo typ pola. Nowe pole, którego żaden kod nie czyta, nie wymaga zmiany.
2. **Ile kosztuje zmiana wersji użytkownika?** Jedno otwarcie karty bez cache: szkielety do pierwszej odpowiedzi API, a bez sieci tylko szkielety i baner offline. Motyw zostaje dzięki `localStorage`.
3. **Dlaczego w kroku 1 fragment usuwa też `one-place:theme` z `localStorage`?** Rozszerzenie z Etapu 4 nigdy go nie zapisało. Bez tego skrypt startowy pokazałby ciemny motyw z ostatniego zapisu, a błąd zostałby tylko w konsoli.

</details>

---

## Zadanie 10: ostatnia zmiana wygrywa

**Cel:** dwa szybkie kliknięcia akcentu (albo trybu, albo nadpisania kontekstu) nie migają pierwszym wyborem, gdy odpowiedź na pierwszą zmianę przychodzi, zanim zapisze się druga. To ten sam problem, który Etap 4 rozwiązał dla zadań, więc rozwiązanie staje się wspólne.

**Czego się nauczysz:** `isMutating` z `mutationKey`, przeniesienie funkcji do wspólnego modułu z parametrem, test kolejności odpowiedzi z `deferred`.

**Pliki:**

- Zmień: `apps/extension/src/queries/optimistic.ts`, `queries/settings.ts`, `queries/contexts.ts`, `queries/todos.ts`
- Test: `apps/extension/src/queries/settings.test.ts`, `apps/extension/src/queries/contexts.test.ts`

**Interfejsy:**

- Korzysta z: `createQueryClient` (wspólna kolejka mutacji z Etapu 4), `deferred`, `jsonResponse`, `withQueryClient` (`queries/testing.ts`).
- Wytwarza: `hasLaterChanges(queryClient, mutationKey)` w `optimistic.ts`. Klucze mutacji `['settings', 'change']` i `['contexts', 'change']`.

**Kroki:**

- [ ] **1. Czerwony test** w `settings.test.ts` z klientem z `createQueryClient()` (ustawienia aplikacji, więc zmiany idą po kolei): dwie zmiany motywu (`green`, potem `rose`) z odpowiedziami z `deferred`. Po rozwiązaniu pierwszej odpowiedzi, gdy wyszło już drugie żądanie, akcent w cache nadal jest `rose`. Po drugiej odpowiedzi cache ma `version: 2`. Oczekiwany wynik: **FAIL** `expected 'green' to be 'rose'`.
- [ ] **2. Czerwony test** w `contexts.test.ts` tak samo dla `useUpdateContext` i `themeOverride`. Oczekiwany wynik: **FAIL**.
- [ ] **3. Wspólna funkcja.** Przenieś `hasLaterChanges` z `todos.ts` do `optimistic.ts` i dodaj parametr `mutationKey`. W `todos.ts` wołaj ją z `todoChangeKey` (usuń lokalną wersję i nieużywany import `QueryClient`).
- [ ] **4. Ustawienia i konteksty.** `useUpdateSettings` dostaje `mutationKey: settingsChangeKey`, a `useUpdateContext` `mutationKey: contextChangeKey`. W `onSuccess` obu: `if (hasLaterChanges(queryClient, klucz)) return` przed zapisem odpowiedzi. Oczekiwany wynik: **PASS (122 testy w rozszerzeniu)**.
- [ ] **5.** `pnpm format && pnpm check`, potem commit: `fix(extension): keep the latest theme change while an earlier one is answered`.

Miganie zobaczysz w przeglądarce w zadaniu 13, gdy będzie już panel z próbkami kolorów.

**Pułapki (sprawdzone na prototypie):**

- **Test z ustawieniami aplikacji.** `new QueryClient()` nie ma wspólnej kolejki (`mutations.scope`). Test ma odtworzyć to, co dzieje się w aplikacji, więc używa `createQueryClient()`, tak jak testy kolejności w Etapie 4.
- **`> 1`, a nie `> 0`.** Mutacja, której `onSuccess` właśnie się wykonuje, nadal ma status `pending`, więc `isMutating` liczy także ją.
- **Osobny klucz dla każdego zasobu.** Czekająca zmiana zadania nie powinna blokować zapisu odpowiedzi ustawień. Dlatego `hasLaterChanges` dostaje klucz, a każdy moduł ma swój.
- **Tworzenia kontekstu to nie obejmuje.** `useCreateContext` ma własny klucz (`createContextKey`) i zapisuje odpowiedź zawsze. Nadpisanie motywu w tym samym ułamku sekundy co utworzenie kontekstu jest mało prawdopodobne, bo sekcja dotyczy aktywnego kontekstu, a nowy kontekst trzeba najpierw wybrać.

<details>
<summary>Podpowiedź</summary>

- Test z Etapu 4 (`keeps showing the latest change while an earlier one is answered` w `todos.test.ts`) ma dokładnie ten układ: dwa `deferred`, `mockReturnValueOnce` dwa razy, `vi.waitFor` na drugie wywołanie API.
- Typ klucza to `MutationKey` z `@tanstack/vue-query`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/optimistic.ts` (nowy import typu i nowa funkcja na końcu)

```ts
import type { MutationKey, QueryClient, QueryKey } from '@tanstack/vue-query'

// … changeOptimistically bez zmian …

// Changes wait in one queue, so a later change of the same data may still be waiting when this one
// is answered. Its optimistic state is newer than this response: writing the response would show an
// older state for a moment (a task ticked twice in a row, or the accent clicked twice, would
// blink). The last change writes.
export function hasLaterChanges(queryClient: QueryClient, mutationKey: MutationKey) {
  // This mutation is still pending while its onSuccess runs, so it counts too
  return queryClient.isMutating({ mutationKey }) > 1
}
```

`apps/extension/src/queries/todos.ts` (importy i dwa wywołania; lokalna `hasLaterChanges` z komentarzem znika)

```ts
import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/vue-query'
// …
import { changeOptimistically, hasLaterChanges } from './optimistic'

// w onSuccess useAddTodo i useUpdateTodo:
if (hasLaterChanges(queryClient, todoChangeKey)) return
```

`apps/extension/src/queries/settings.ts`

```ts
import type { SettingsDto, UpdateSettingsInput } from '@one-place/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { apiClient } from '@/api/client'
import { changeOptimistically, hasLaterChanges } from './optimistic'

export const settingsKey = ['settings'] as const
const settingsChangeKey = ['settings', 'change'] as const

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => parseResponse(apiClient.api.settings.$get()),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: settingsChangeKey,
    mutationFn: (changes: UpdateSettingsInput) =>
      parseResponse(apiClient.api.settings.$patch({ json: changes })),
    onMutate: (changes) =>
      changeOptimistically<SettingsDto>(queryClient, settingsKey, (settings) => ({
        ...settings,
        ...changes,
      })),
    onError: (_error, _changes, rollback) => rollback?.(),
    onSuccess: (saved) => {
      if (hasLaterChanges(queryClient, settingsChangeKey)) return
      queryClient.setQueryData(settingsKey, saved)
    },
  })
}
```

`apps/extension/src/queries/contexts.ts` (import, klucz i `useUpdateContext`)

```ts
import { changeOptimistically, hasLaterChanges } from './optimistic'

export const contextsKey = ['contexts'] as const
const contextChangeKey = ['contexts', 'change'] as const

// …

export function useUpdateContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: contextChangeKey,
    mutationFn: ({ id, ...changes }: UpdateContextInput & { id: string }) =>
      parseResponse(apiClient.api.contexts[':id'].$patch({ param: { id }, json: changes })),
    onMutate: ({ id, ...changes }) =>
      changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) => {
        const current = list.find((item) => item.id === id)
        return current ? withContext(list, { ...current, ...changes }) : list
      }),
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) => {
      if (hasLaterChanges(queryClient, contextChangeKey)) return
      queryClient.setQueryData<ContextDto[]>(contextsKey, (list = []) => withContext(list, saved))
    },
  })
}
```

`apps/extension/src/queries/settings.test.ts` (nowy import i nowy test)

```ts
import { createQueryClient } from './query-client'

// …
it('keeps showing the latest accent while an earlier change is answered', async () => {
  // With the defaults of the app, so changes go to the API one after another
  const queryClient = createQueryClient()
  queryClient.setQueryData(settingsKey, saved)
  const first = deferred<Response>()
  const second = deferred<Response>()
  api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
  const { mutate } = withQueryClient(queryClient, useUpdateSettings)
  const accent = () => queryClient.getQueryData<SettingsDto>(settingsKey)?.theme.accent

  // Two quick clicks on the accent swatches
  mutate({ theme: { ...DEFAULT_THEME, accent: 'green' } })
  mutate({ theme: { ...DEFAULT_THEME, accent: 'rose' } })
  await vi.waitFor(() => expect(accent()).toBe('rose'))

  const green = { ...DEFAULT_THEME, accent: 'green' }
  first.resolve(jsonResponse(200, { ...saved, theme: green, version: 1 }))
  await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2))
  expect(accent()).toBe('rose')

  const rose = { ...DEFAULT_THEME, accent: 'rose' }
  second.resolve(jsonResponse(200, { ...saved, theme: rose, version: 2 }))
  await vi.waitFor(() =>
    expect(queryClient.getQueryData<SettingsDto>(settingsKey)?.version).toBe(2),
  )
})
```

`apps/extension/src/queries/contexts.test.ts` (nowy import i nowy test w `describe('useUpdateContext')`)

```ts
import { createQueryClient } from './query-client'

// …
it('keeps showing the latest change while an earlier one is answered', async () => {
  queryClient = createQueryClient()
  queryClient.setQueryData(contextsKey, [work, home])
  const first = deferred<Response>()
  const second = deferred<Response>()
  api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
  const { mutate } = withQueryClient(queryClient, useUpdateContext)
  const accent = () =>
    queryClient.getQueryData<ContextDto[]>(contextsKey)?.[0]?.themeOverride?.accent

  mutate({ id: 'work', themeOverride: { accent: 'green' } })
  mutate({ id: 'work', themeOverride: { accent: 'rose' } })
  await vi.waitFor(() => expect(accent()).toBe('rose'))

  first.resolve(jsonResponse(200, { ...work, themeOverride: { accent: 'green' }, version: 2 }))
  await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2))
  expect(accent()).toBe('rose')

  second.resolve(jsonResponse(200, { ...work, themeOverride: { accent: 'rose' }, version: 3 }))
  await vi.waitFor(() =>
    expect(queryClient.getQueryData<ContextDto[]>(contextsKey)?.[0]?.version).toBe(3),
  )
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Pominięta odpowiedź pierwszej zmiany ma nowsze `updatedAt` i `version` niż cache. Czy to problem?** Nie. Odpowiedź drugiej zmiany przychodzi zaraz potem i zapisuje stan serwera po obu zmianach. W MVP `version` nie służy jeszcze do wykrywania konfliktów.
2. **Co się stanie, gdy pierwsza zmiana się nie uda, a druga czeka?** Cofnięcie pierwszej przywróci stan sprzed obu zmian, więc na chwilę zniknie też druga. Gdy druga się zapisze, jej odpowiedź wróci do cache. To ten sam znany kompromis co przy zadaniach w Etapie 4.
3. **Dlaczego nie debounce na kliknięciach zamiast tego?** Debounce opóźniłby zapis i nadal nie chroniłby przed dwoma zmianami w odstępie dłuższym niż jego okno przy wolnej sieci. Zmiana na ekranie i tak jest natychmiastowa, więc problemem jest tylko kolejność zapisów do cache.

</details>

---

## Zadanie 11: sekcja „Wygląd”

**Cel:** w panelu ustawień wybierasz tryb i kolor akcentu, a pulpit zmienia się od razu (F-THEME-01, F-THEME-02, F-THEME-04). Oba wybieraki obsługują opcję „Globalny”, której zadanie 12 użyje w nadpisaniu kontekstu.

**Czego się nauczysz:** `defineModel` z typem dopuszczającym `undefined`, wzorzec `radiogroup` z `IconPicker`, kolor z danych jako styl inline, wariant `aria-checked:` w Tailwind v4.

**Pliki:**

- Utwórz: `apps/extension/src/features/settings/ThemeModePicker.vue`, `AccentPicker.vue`
- Zmień: `apps/extension/src/features/settings/SettingsSlideover.vue`, `apps/extension/src/i18n/pl.json`, `en.json`
- Test: `apps/extension/src/features/settings/ThemeModePicker.test.ts`, `AccentPicker.test.ts`

**Interfejsy:**

- Korzysta z: `THEME_MODES`, `ACCENT_COLORS` (`shared/theme.ts`), `useSettings`, `useUpdateSettings`.
- Wytwarza: `ThemeModePicker` i `AccentPicker` z `v-model` (`ThemeMode | undefined`, `AccentColor | undefined`) i propsem `inherit`. Używa ich zadanie 12.

**Kroki:**

- [ ] **1. Tłumaczenia.** W `settings` dopisz `theme` (tytuł, tryb, nazwy trybów, akcent, nazwy 10 akcentów, `inherit`) i `contextTheme` (tytuł z `{name}`, „Używaj motywu globalnego”). Klucz `contextTheme` przyda się w zadaniu 12.
- [ ] **2. Czerwone testy** `ThemeModePicker.test.ts` (happy-dom, pluginy `ui` i `i18n`, jak w `TodoSettings.test.ts`):
  - pokazuje „Light”, „Dark”, „System”, zaznacza wybrany (`aria-checked="true"`), a kliknięcie emituje `update:modelValue` z nowym trybem;
  - z `inherit` pierwsza opcja to „Global”, jest zaznaczona dla `undefined`, a kliknięcie emituje `undefined`.
- [ ] **3. Implementacja** `ThemeModePicker.vue`: `role="radiogroup"` z przyciskami `UButton role="radio"`, tak jak `IconPicker`. Ikony `i-lucide-sun`, `i-lucide-moon`, `i-lucide-monitor`, a dla „Globalny” `i-lucide-globe`.
- [ ] **4. Czerwone testy** `AccentPicker.test.ts`:
  - 10 próbek z nazwami (`aria-label`), próbka „Green” ma w stylu `var(--color-green-500)`;
  - zaznacza wybrany akcent, a kliknięcie „Teal” emituje `'teal'`;
  - z `inherit` pierwsza próbka to „Global”, a kliknięcie emituje `undefined`.
- [ ] **5. Implementacja** `AccentPicker.vue`: okrągłe przyciski z tłem `var(--color-<akcent>-500)` w stylu inline i obrysem dla zaznaczonego. Oczekiwany wynik: **PASS (127 testów w rozszerzeniu)**.
- [ ] **6. Panel.** W `SettingsSlideover.vue` nad językiem sekcja „Wygląd” z oboma wybierakami. Zmiana woła `updateSettings({ theme: { ...settings.theme, ...zmiana } })`.
- [ ] **7. Sprawdzenie w przeglądarce** (`pnpm dev`). Otwórz ustawienia, kliknij „Ciemny”, potem „Zielony”. Pulpit za panelem zmienia się od razu, a w DevTools → Network są dwa `PATCH /api/settings`, każdy z pełnym motywem. Przeładuj kartę: motyw zostaje.
- [ ] **8. Eksperyment: klasa z szablonu tekstowego.** W `AccentPicker.vue` zamień styl inline na klasę ``:class="[swatch, `bg-${accent}-500`]"`` i usuń `:style`. Oczekiwany wynik: próbki są przezroczyste (sam obrys po zaznaczeniu). Tailwind nie znalazł w kodzie klas `bg-green-500` i innych, więc ich nie wygenerował. Przywróć styl inline.
- [ ] **9.** `pnpm format && pnpm check`, potem commit: `feat(extension): choose the mode and the accent in settings`.

**Pułapki (sprawdzone na prototypie):**

- **Tailwind czyta kod jak tekst.** Generuje tylko klasy, które w całości występują w plikach źródłowych. `` `bg-${accent}-500` `` to dla niego nie jest żadna klasa. Zmienne `--color-*-500` są w CSS dzięki `theme(static)` (R3), więc `var(--color-green-500)` w stylu inline działa.
- **Obrys przez `aria-checked:`.** Tailwind v4 ma wariant `aria-checked:`, który działa dla `aria-checked="true"`. `outline-inverted` to kolor z tokenów Nuxt UI (`--ui-border-inverted`), więc obrys jest ciemny w jasnym trybie i jasny w ciemnym. Ten sam atrybut służy czytnikom ekranu i testom.
- **Kolejne kliknięcia składają się poprawnie.** `updateTheme` bierze motyw z cache, a cache ma już stan optymistyczny po poprzednim kliknięciu. „Ciemny”, a zaraz potem „Zielony” wysyła drugi `PATCH` z ciemnym trybem i zielonym akcentem.
- **`value &&` w setterze.** Wybieraki mają typ z `undefined` (dla opcji „Globalny”). W sekcji globalnej tej opcji nie ma, ale TypeScript tego nie wie, a motyw globalny nie może mieć pustego pola.
- **Panel ładuje się leniwie.** Nowe komponenty trafiają do chunka `SettingsSlideover` (około 36 kB). Na ścieżce startowej są tylko tłumaczenia (zadanie 13).

<details>
<summary>Podpowiedź</summary>

- Opcje trybu: tablica `{ value, label, icon }` w `computed`, z opcją „Globalny” (`value: undefined`) na początku, gdy `inherit` jest ustawione.
- W `SettingsSlideover` wzoruj się na `language`: `computed` z `get` i `set`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/i18n/pl.json` (w `settings`, między `title` a `language`)

```json
    "theme": {
      "title": "Wygląd",
      "mode": "Tryb",
      "modes": {
        "light": "Jasny",
        "dark": "Ciemny",
        "system": "Systemowy"
      },
      "accent": "Kolor akcentu",
      "accents": {
        "blue": "Niebieski",
        "indigo": "Indygo",
        "violet": "Fioletowy",
        "pink": "Różowy",
        "rose": "Malinowy",
        "orange": "Pomarańczowy",
        "amber": "Bursztynowy",
        "green": "Zielony",
        "emerald": "Szmaragdowy",
        "teal": "Morski"
      },
      "inherit": "Globalny"
    },
    "contextTheme": {
      "title": "Wygląd kontekstu „{name}”",
      "useGlobal": "Używaj motywu globalnego"
    },
```

`apps/extension/src/i18n/en.json` (w tym samym miejscu)

```json
    "theme": {
      "title": "Appearance",
      "mode": "Mode",
      "modes": {
        "light": "Light",
        "dark": "Dark",
        "system": "System"
      },
      "accent": "Accent color",
      "accents": {
        "blue": "Blue",
        "indigo": "Indigo",
        "violet": "Violet",
        "pink": "Pink",
        "rose": "Rose",
        "orange": "Orange",
        "amber": "Amber",
        "green": "Green",
        "emerald": "Emerald",
        "teal": "Teal"
      },
      "inherit": "Global"
    },
    "contextTheme": {
      "title": "Appearance of “{name}”",
      "useGlobal": "Use the global theme"
    },
```

`apps/extension/src/features/settings/ThemeModePicker.vue`

```vue
<script setup lang="ts">
import { THEME_MODES, type ThemeMode } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// With `inherit` the first option means "same as the global theme", and its value is undefined
const model = defineModel<ThemeMode | undefined>({ required: true })
const props = defineProps<{ inherit?: boolean }>()
const { t } = useI18n()

const icons: Record<ThemeMode, string> = {
  light: 'i-lucide-sun',
  dark: 'i-lucide-moon',
  system: 'i-lucide-monitor',
}
const options = computed(() => [
  ...(props.inherit
    ? [{ value: undefined, label: t('settings.theme.inherit'), icon: 'i-lucide-globe' }]
    : []),
  ...THEME_MODES.map((mode) => ({
    value: mode,
    label: t(`settings.theme.modes.${mode}`),
    icon: icons[mode],
  })),
])
</script>

<template>
  <div role="radiogroup" class="flex flex-wrap gap-1">
    <UButton
      v-for="option in options"
      :key="option.value ?? 'inherit'"
      role="radio"
      :aria-checked="model === option.value"
      :label="option.label"
      :icon="option.icon"
      :color="model === option.value ? 'primary' : 'neutral'"
      :variant="model === option.value ? 'solid' : 'outline'"
      @click="model = option.value"
    />
  </div>
</template>
```

`apps/extension/src/features/settings/AccentPicker.vue`

```vue
<script setup lang="ts">
import { ACCENT_COLORS, type AccentColor } from '@one-place/shared'
import { useI18n } from 'vue-i18n'

// With `inherit` the first swatch means "same as the global theme", and its value is undefined
const model = defineModel<AccentColor | undefined>({ required: true })
defineProps<{ inherit?: boolean }>()
const { t } = useI18n()

const swatch =
  'size-7 cursor-pointer rounded-full aria-checked:outline-2 aria-checked:outline-offset-2 aria-checked:outline-inverted'
</script>

<template>
  <div role="radiogroup" class="flex flex-wrap gap-2">
    <button
      v-if="inherit"
      type="button"
      role="radio"
      :aria-checked="model === undefined"
      :aria-label="t('settings.theme.inherit')"
      :title="t('settings.theme.inherit')"
      :class="[swatch, 'grid place-items-center border border-default text-muted']"
      @click="model = undefined"
    >
      <UIcon name="i-lucide-globe" class="size-4" />
    </button>
    <!-- An inline style, because Tailwind does not see class names built at run time -->
    <button
      v-for="accent in ACCENT_COLORS"
      :key="accent"
      type="button"
      role="radio"
      :aria-checked="model === accent"
      :aria-label="t(`settings.theme.accents.${accent}`)"
      :title="t(`settings.theme.accents.${accent}`)"
      :class="swatch"
      :style="{ backgroundColor: `var(--color-${accent}-500)` }"
      @click="model = accent"
    />
  </div>
</template>
```

`apps/extension/src/features/settings/ThemeModePicker.test.ts`

```ts
// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { ThemeMode } from '@one-place/shared'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import ThemeModePicker from './ThemeModePicker.vue'

function render(modelValue: ThemeMode | undefined, inherit = false) {
  return mount(ThemeModePicker, {
    props: { modelValue, inherit },
    global: { plugins: [ui, i18n] },
  })
}

function checked(wrapper: ReturnType<typeof render>) {
  return wrapper
    .findAll('[role="radio"]')
    .filter((option) => option.attributes('aria-checked') === 'true')
    .map((option) => option.text())
}

describe('ThemeModePicker', () => {
  it('marks the chosen mode and emits another one', async () => {
    const wrapper = render('dark')
    expect(wrapper.findAll('[role="radio"]').map((option) => option.text())).toEqual([
      'Light',
      'Dark',
      'System',
    ])
    expect(checked(wrapper)).toEqual(['Dark'])
    await wrapper.findAll('[role="radio"]')[2]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['system']])
  })

  it('offers the global mode first and emits undefined for it', async () => {
    const wrapper = render(undefined, true)
    expect(checked(wrapper)).toEqual(['Global'])
    await wrapper.setProps({ modelValue: 'light' })
    await wrapper.findAll('[role="radio"]')[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
  })
})
```

`apps/extension/src/features/settings/AccentPicker.test.ts`

```ts
// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import { ACCENT_COLORS, type AccentColor } from '@one-place/shared'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import AccentPicker from './AccentPicker.vue'

function render(modelValue: AccentColor | undefined, inherit = false) {
  return mount(AccentPicker, {
    props: { modelValue, inherit },
    global: { plugins: [ui, i18n] },
  })
}

describe('AccentPicker', () => {
  it('shows a named swatch in the color of each accent', () => {
    const swatches = render('blue').findAll('[role="radio"]')
    expect(swatches).toHaveLength(ACCENT_COLORS.length)
    expect(swatches[7]!.attributes('aria-label')).toBe('Green')
    expect(swatches[7]!.attributes('style')).toContain('var(--color-green-500)')
  })

  it('marks the chosen accent and emits another one', async () => {
    const wrapper = render('rose')
    const checked = wrapper.findAll('[aria-checked="true"]')
    expect(checked.map((swatch) => swatch.attributes('aria-label'))).toEqual(['Rose'])
    await wrapper.get('[aria-label="Teal"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['teal']])
  })

  it('offers the global accent first and emits undefined for it', async () => {
    const wrapper = render('green', true)
    const first = wrapper.findAll('[role="radio"]')[0]!
    expect(first.attributes('aria-label')).toBe('Global')
    expect(first.attributes('aria-checked')).toBe('false')
    await first.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[undefined]])
  })
})
```

`apps/extension/src/features/settings/SettingsSlideover.vue` (importy, nowy kod w skrypcie i sekcja w szablonie nad językiem)

```vue
<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'
import type { AccentColor, Locale, ThemeMode, ThemeSettings } from '@one-place/shared'
// … pozostałe importy bez zmian …
import AccentPicker from './AccentPicker.vue'
import ThemeModePicker from './ThemeModePicker.vue'

// … dotychczasowy kod (open, t, me, settings, updateSettings, languages, language) …

// F-THEME-04: the theme changes at once (optimistic cache), the API saves it in the background
function updateTheme(changes: Partial<ThemeSettings>) {
  if (settings.value) updateSettings({ theme: { ...settings.value.theme, ...changes } })
}
const mode = computed({
  get: () => settings.value?.theme.mode,
  set: (value?: ThemeMode) => value && updateTheme({ mode: value }),
})
const accent = computed({
  get: () => settings.value?.theme.accent,
  set: (value?: AccentColor) => value && updateTheme({ accent: value }),
})
</script>

<template>
  <!-- … -->
        <UUser v-if="me" :name="me.name" :description="me.email" icon="i-lucide-circle-user" />
        <section v-if="settings" class="space-y-3">
          <h3 class="font-semibold text-highlighted">{{ t('settings.theme.title') }}</h3>
          <UFormField :label="t('settings.theme.mode')">
            <ThemeModePicker v-model="mode" />
          </UFormField>
          <UFormField :label="t('settings.theme.accent')">
            <AccentPicker v-model="accent" />
          </UFormField>
        </section>
        <UFormField :label="t('settings.language.label')">
  <!-- … -->
</template>
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego próbki to zwykłe `<button>`, a tryby `UButton`?** Próbka to sam kolor bez tekstu i ikony, a `UButton` dodałby własne tło i padding, które trzeba by nadpisywać. Tryb to przycisk z ikoną i etykietą, czyli dokładnie to, co daje `UButton`.
2. **Skąd testy wiedzą, że etykiety są po angielsku?** `i18n` wybiera język przy imporcie z `navigator.language`, a happy-dom zgłasza `en-US`. Ten sam `i18n` dostają wszystkie testy komponentów przez `global.plugins`.
3. **Dlaczego `v-if="settings"` na sekcji?** Panel otwiera się z pulpitu, który ma ustawienia w cache, więc zwykle są. Bez nich nie ma z czego zbudować pełnego motywu do `PATCH`, a wybieraki pokazałyby pusty wybór.

</details>

---

## Zadanie 12: „Wygląd kontekstu”

**Cel:** pod motywem globalnym jest sekcja „Wygląd kontekstu »Praca«” dla aktywnego kontekstu. Przełącznik „Używaj motywu globalnego” jest włączony, gdy kontekst nie ma nadpisania. Po wyłączeniu tryb i akcent pokazują opcję „Globalny”, a każde pole można nadpisać osobno (F-THEME-03, decyzje 1 i 2).

**Czego się nauczysz:** komponent prezentacyjny z `v-model` na obiekcie, `USwitch`, `computed` z setterem budującym nowy obiekt, rozdzielenie widoku od mutacji.

**Pliki:**

- Utwórz: `apps/extension/src/features/settings/ThemeOverrideFields.vue`
- Zmień: `apps/extension/src/features/settings/SettingsSlideover.vue`
- Test: `apps/extension/src/features/settings/ThemeOverrideFields.test.ts`

**Interfejsy:**

- Korzysta z: `ThemeModePicker`, `AccentPicker` (zadanie 11), `useActiveContext`, `useUpdateContext`, `ThemeOverride`.
- Wytwarza: `ThemeOverrideFields` z `v-model` typu `ThemeOverride | null`.

**Kroki:**

- [ ] **1. Czerwone testy** `ThemeOverrideFields.test.ts`:
  - `null`: przełącznik (`role="switch"`) ma `aria-checked="true"`, a wybieraków nie ma;
  - kliknięcie przełącznika przy `null` emituje `{}`;
  - przy `{}` oba wybieraki mają zaznaczone „Global”;
  - przy `{ mode: 'dark' }` kliknięcie „Rose” emituje `{ mode: 'dark', accent: 'rose' }`;
  - kliknięcie przełącznika przy `{ accent: 'rose' }` emituje `null`.

  Oczekiwany wynik: **FAIL**.

- [ ] **2. Implementacja** `ThemeOverrideFields.vue`: `defineModel<ThemeOverride | null>`, trzy `computed` (`useGlobal`, `mode`, `accent`), `USwitch` i oba wybieraki z `inherit`. Oczekiwany wynik: **PASS (132 testy w rozszerzeniu)**.
- [ ] **3. Panel.** W `SettingsSlideover.vue` pod sekcją „Wygląd” sekcja z tytułem `t('settings.contextTheme.title', { name: active.name })` i `ThemeOverrideFields`. Jej `v-model` to `computed`, który czyta `active.themeOverride` i zapisuje przez `updateContext({ id: active.id, themeOverride })`.
- [ ] **4. Sprawdzenie w przeglądarce** (`pnpm dev`, dwa konteksty „Praca” i „Dom”, motyw globalny ciemny z zielonym). W „Praca” otwórz ustawienia, wyłącz „Używaj motywu globalnego” i wybierz „Malinowy”: pulpit od razu ma malinowy akcent. Przełącz się na „Dom”: zielony. Wróć do „Praca”: malinowy. Przeładuj kartę w każdym z nich: bez mignięcia innym akcentem. W „Praca” wybierz akcent „Globalny” (zielony), potem włącz przełącznik. W Network ostatni `PATCH /api/contexts/:id` ma `{"themeOverride":null}`.
- [ ] **5. Eksperyment: spread wraca.** Wróć na chwilę do eksperymentu z zadania 1: w `resolveTheme` wpisz `return { ...global, ...override }`, zbuduj (`pnpm --filter @one-place/extension build`) i załaduj `.output/chrome-mv3`. W „Praca” ustaw nadpisanie akcentu „Malinowy” i odczekaj chwilę. Włącz DevTools → Network → „Offline” i wybierz akcent „Globalny”. **Oczekiwany wynik:** w Elements `<html>` ma `--ui-color-primary-500: var(--color-undefined-500)`, a elementy w kolorze akcentu tracą kolor, dopóki nie wrócisz online i nie przyjdzie odpowiedź z `{}` bez pola `accent`. Przywróć `??` i zbuduj ponownie.
- [ ] **6.** `pnpm format && pnpm check`, potem commit: `feat(extension): override the theme in the active context`.

**Pułapki (sprawdzone na prototypie):**

- **Wyłączenie przełącznika zapisuje `{}`, a nie `null`.** Dzięki temu po zamknięciu i otwarciu panelu przełącznik zostaje wyłączony, nawet jeśli nie wybrałeś jeszcze żadnego pola. Motyw efektywny i tak jest wtedy globalny.
- **„Globalny” to `undefined` w polu.** Setter buduje `{ ...override, accent: undefined }`. Do API idzie `{}`, bo `JSON.stringify` pomija pola z `undefined`, ale do odpowiedzi cache trzyma klucz z `undefined`. Dlatego zadanie 1 ma test z `{ accent: undefined }`, a krok 5 pokazuje, co by było bez niego.
- **Komponent nie zna API.** `ThemeOverrideFields` dostaje nadpisanie i emituje nowe, więc testy nie potrzebują `QueryClient`. Mutację robi panel, tak jak `TaskList` i `TodoWidget` w Etapie 4.
- **Offline na zbudowanej paczce.** Tryb Offline w DevTools blokuje też serwer Vite, więc w `pnpm dev` strona może przestać się doładowywać. Tak jak w poprzednich etapach, krok 5 rób na zbudowanej paczce.
- **Te same nazwy w dwóch sekcjach.** Próbki „Rose” są w obu sekcjach panelu. W testach end-to-end albo w Playwright trzeba je rozróżniać (np. przez sekcję albo `nth(1)`).

<details>
<summary>Podpowiedź</summary>

- `useGlobal`: `get: () => override.value === null`, `set: (value) => (override.value = value ? null : {})`.
- `mode`: `set: (value) => (override.value = { ...override.value, mode: value })`. Spread `null` w obiekcie nie rzuca błędu, ale tu i tak `override` nie jest `null`, bo pola widać tylko przy wyłączonym przełączniku.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/features/settings/ThemeOverrideFields.vue`

```vue
<script setup lang="ts">
import type { AccentColor, ThemeMode, ThemeOverride } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AccentPicker from './AccentPicker.vue'
import ThemeModePicker from './ThemeModePicker.vue'

// null: the context uses the global theme. Otherwise each field it has replaces the global one
// (F-THEME-03), and undefined in a field means "same as the global theme".
const override = defineModel<ThemeOverride | null>({ required: true })
const { t } = useI18n()

const useGlobal = computed({
  get: () => override.value === null,
  set: (value: boolean) => (override.value = value ? null : {}),
})
const mode = computed({
  get: () => override.value?.mode,
  set: (value?: ThemeMode) => (override.value = { ...override.value, mode: value }),
})
const accent = computed({
  get: () => override.value?.accent,
  set: (value?: AccentColor) => (override.value = { ...override.value, accent: value }),
})
</script>

<template>
  <div class="space-y-3">
    <USwitch v-model="useGlobal" :label="t('settings.contextTheme.useGlobal')" />
    <template v-if="!useGlobal">
      <UFormField :label="t('settings.theme.mode')">
        <ThemeModePicker v-model="mode" inherit />
      </UFormField>
      <UFormField :label="t('settings.theme.accent')">
        <AccentPicker v-model="accent" inherit />
      </UFormField>
    </template>
  </div>
</template>
```

`apps/extension/src/features/settings/ThemeOverrideFields.test.ts`

```ts
// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { ThemeOverride } from '@one-place/shared'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import ThemeOverrideFields from './ThemeOverrideFields.vue'

function render(modelValue: ThemeOverride | null) {
  return mount(ThemeOverrideFields, {
    props: { modelValue },
    global: { plugins: [ui, i18n] },
  })
}

describe('ThemeOverrideFields', () => {
  it('uses the global theme without an override and hides the fields', () => {
    const wrapper = render(null)
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(false)
  })

  it('starts an empty override when the switch is turned off', async () => {
    const wrapper = render(null)
    await wrapper.get('[role="switch"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[{}]])
  })

  it('shows both fields as global in an empty override', () => {
    const wrapper = render({})
    const checked = wrapper.findAll('[aria-checked="true"][role="radio"]')
    expect(checked).toHaveLength(2)
    for (const option of checked) {
      expect(option.attributes('aria-label') ?? option.text()).toBe('Global')
    }
  })

  it('overrides one field and keeps the other', async () => {
    const wrapper = render({ mode: 'dark' })
    await wrapper.get('[aria-label="Rose"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[{ mode: 'dark', accent: 'rose' }]])
  })

  it('removes the override when the switch is turned on', async () => {
    const wrapper = render({ accent: 'rose' })
    await wrapper.get('[role="switch"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })
})
```

`apps/extension/src/features/settings/SettingsSlideover.vue` (całość po zadaniach 11 i 12)

```vue
<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'
import type {
  AccentColor,
  Locale,
  ThemeMode,
  ThemeOverride,
  ThemeSettings,
} from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { signOut } from '@/features/auth/sign-out'
import { useActiveContext } from '@/features/contexts/active-context'
import { useUpdateContext } from '@/queries/contexts'
import { useMe } from '@/queries/me'
import { useSettings, useUpdateSettings } from '@/queries/settings'
import AccentPicker from './AccentPicker.vue'
import ThemeModePicker from './ThemeModePicker.vue'
import ThemeOverrideFields from './ThemeOverrideFields.vue'

const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const { data: me } = useMe()
const { data: settings } = useSettings()
const { mutate: updateSettings } = useUpdateSettings()
const active = useActiveContext()
const { mutate: updateContext } = useUpdateContext()

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

// F-THEME-04: the theme changes at once (optimistic cache), the API saves it in the background
function updateTheme(changes: Partial<ThemeSettings>) {
  if (settings.value) updateSettings({ theme: { ...settings.value.theme, ...changes } })
}
const mode = computed({
  get: () => settings.value?.theme.mode,
  set: (value?: ThemeMode) => value && updateTheme({ mode: value }),
})
const accent = computed({
  get: () => settings.value?.theme.accent,
  set: (value?: AccentColor) => value && updateTheme({ accent: value }),
})

// The section is about the active context, so its effect is visible behind the panel
const themeOverride = computed({
  get: () => active.value?.themeOverride ?? null,
  set: (value: ThemeOverride | null) => {
    if (active.value) updateContext({ id: active.value.id, themeOverride: value })
  },
})
</script>

<template>
  <USlideover v-model:open="open" :title="t('settings.title')">
    <template #body>
      <div class="space-y-6">
        <UUser v-if="me" :name="me.name" :description="me.email" icon="i-lucide-circle-user" />
        <section v-if="settings" class="space-y-3">
          <h3 class="font-semibold text-highlighted">{{ t('settings.theme.title') }}</h3>
          <UFormField :label="t('settings.theme.mode')">
            <ThemeModePicker v-model="mode" />
          </UFormField>
          <UFormField :label="t('settings.theme.accent')">
            <AccentPicker v-model="accent" />
          </UFormField>
        </section>
        <section v-if="active" class="space-y-3">
          <h3 class="font-semibold text-highlighted">
            {{ t('settings.contextTheme.title', { name: active.name }) }}
          </h3>
          <ThemeOverrideFields v-model="themeOverride" />
        </section>
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

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co się stanie, gdy nadpisanie ma oba pola równe „Globalny” (`{}`), a włączysz przełącznik?** Zapisze się `null`. Motyw na ekranie się nie zmieni, bo `{}` i `null` dają ten sam motyw efektywny. Zmieni się tylko widok panelu: pola znikną.
2. **Dlaczego sekcja dotyczy tylko aktywnego kontekstu?** Zmiana motywu innego kontekstu nie byłaby widoczna, dopóki się na niego nie przełączysz (decyzja 1). Żeby zmienić motyw „Dom”, przełącz się na „Dom” i otwórz panel. Sekcja pokaże wtedy jego nazwę.
3. **Co zobaczysz po przełączeniu kontekstu przy otwartym panelu?** Panel zasłania nagłówek, więc w praktyce trzeba go zamknąć. Gdyby kontekst zmienił się w tle (np. na innym urządzeniu usunięto aktywny), `active` wskaże inny kontekst, a sekcja pokaże jego nazwę i nadpisanie, bo cała sekcja czyta `useActiveContext()`.

</details>

---

## Zadanie 13: budżet, mignięcie i przypadki brzegowe w przeglądarce

**Cel:** startowy JS po Etapie 5 mieści się w budżecie, pierwsza klatka nowej karty ma właściwy motyw, motyw systemowy reaguje na żywo, zmiany offline i szybkie kliknięcia działają poprawnie w zbudowanej paczce.

**Czego się nauczysz:** zrzuty klatek w panelu Performance, emulacja `prefers-color-scheme` i opóźnienia sieci w DevTools, sprawdzanie, przed czym chroni zabezpieczenie, przez jego chwilowe wyłączenie.

**Pliki:** bez zmian w kodzie (eksperymenty cofasz).

**Kroki:**

- [ ] **1. Pomiar.** `pnpm --filter @one-place/extension build && pnpm size`. Oczekiwany wynik: **około 495,6 kB** (Etap 4: 492,1 kB, budżet 550 kB). Około 1 kB to moduł motywu, a resztę dają tłumaczenia, które jak dotąd są w paczce startowej. Komponenty panelu są w leniwym chunku `SettingsSlideover` (około 36,5 kB), a `theme-boot.js` (0,8 kB) leży poza `chunks/` i nie wlicza się do sumy.
- [ ] **2. Eksperyment: Zod na ścieżce startowej.** W `accountTheme` dopisz przed `return resolveTheme(…)` linię `if (!ThemeSettingsSchema.safeParse(settings.theme).success) return null` (z importem z `@one-place/shared`). Zbuduj i uruchom `pnpm size`. **Oczekiwany wynik:** około 587 kB, `Start-up JS is 37.4 kB over the budget` i kod wyjścia 1. Przywróć.
- [ ] **3. Pierwsza klatka.** W zbudowanej paczce ustaw motyw ciemny z zielonym akcentem. DevTools → Performance → ⚙ → zaznacz „Screenshots”, ustaw CPU na „4x slowdown” i kliknij „Record and reload”. **Oczekiwany wynik:** pierwszy zrzut jest już ciemny. Na prototypie mierzyłem to skryptem, który zapisuje wygląd `<html>` w `requestAnimationFrame` przed pierwszym malowaniem: 15 z 15 przeładowań ciemnych z zielonym akcentem.
- [ ] **4. Eksperyment: bez skryptu startowego.** Usuń z `index.html` linię z `theme-boot.js`, zbuduj i powtórz krok 3 kilka razy. **Oczekiwany wynik:** w części nagrań pierwszy zrzut jest jasny, a następny ciemny. Na prototypie 11 z 15 przeładowań zbudowanej paczki miało jasną pierwszą klatkę z domyślnym akcentem. W pozostałych aplikacja zdążyła zamontować się przed malowaniem. W `pnpm dev` aplikacja ani razu (0 z 15) nie zdążyła przed pierwszą klatką. Przywróć linię i zbuduj.
- [ ] **5. Motyw systemu na żywo.** Ustaw tryb „Systemowy”. DevTools → ⋮ → More tools → Rendering → „Emulate CSS media feature prefers-color-scheme”: przełączaj `light` i `dark`. **Oczekiwany wynik:** pulpit zmienia się od razu, bez przeładowania. Kontekst z nadpisaniem trybu „Ciemny” zostaje ciemny.
- [ ] **6. Zmiana offline.** Otwórz ustawienia, włącz DevTools → Network → „Offline”, kliknij „Ciemny” i „Morski”. **Oczekiwany wynik:** zmiana od razu, bez toastów, a w Network nie ma żądań. Wyłącz Offline: dwa `PATCH /api/settings` po kolei, oba 200. Po przeładowaniu motyw zostaje.
- [ ] **7. Eksperyment: miganie bez zadania 10.** W `queries/settings.ts` zakomentuj linię `if (hasLaterChanges(queryClient, settingsChangeKey)) return` i zbuduj. DevTools → Network → throttling → „Add…” → własny profil z opóźnieniem (latency) 800 ms, potem go wybierz. W panelu szybko kliknij „Zielony” i „Malinowy”. **Oczekiwany wynik:** akcent zmienia się na zielony, malinowy, po chwili znowu na zielony i na końcu na malinowy. Na prototypie zapis zmian zmiennej akcentu: `green, rose, green, rose`, a z zabezpieczeniem: `green, rose`. Przywróć linię, zbuduj i wyłącz throttling.
- [ ] **8. Wylogowanie.** Wyloguj się przy motywie ciemnym z zielonym. **Oczekiwany wynik:** ekran logowania ma motyw domyślny (systemowy, niebieski) i reaguje na emulację z kroku 5. W Application → Local Storage `one-place:theme` ma `"mode":"system"`.
- [ ] **9. Czas pierwszego renderu.** Przeładuj kartę kilka razy i w konsoli wpisz `performance.getEntriesByName('dashboard-rendered')[0].startTime`. Na prototypie w Chromium headless: 27–57 ms. Wymaganie to poniżej 200 ms.
- [ ] **10. Prywatność.** Przejdź przez kroki 3–8 z otwartym DevTools → Network i filtrem `-domain:localhost`. Nie ma żadnych żądań.

**Pułapki (sprawdzone na prototypie):**

- **Mignięcie zależy od szczęścia.** Zbudowana paczka ładuje się szybko i aplikacja czasem montuje się przed pierwszym malowaniem, więc bez skryptu startowego część przeładowań wygląda dobrze. Dlatego krok 4 powtarzasz kilka razy, a CPU zwalniasz.
- **Emulacja to prawdziwe zdarzenie.** Emulacja `prefers-color-scheme` w DevTools wywołuje `change` na obiekcie z `matchMedia`, tak jak zmiana w systemie. To ten sam mechanizm, który testuje `use-applied-theme.test.ts`.
- **Throttling dotyczy tylko tej karty.** Profil sieci z DevTools działa w karcie, w której jest otwarty DevTools. Klikaj w tej samej karcie.

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego pomiar z kroku 3 robisz przy zwolnionym CPU?** Bez spowolnienia aplikacja często montuje się przed pierwszą klatką i maskuje brak skryptu startowego. Spowolnienie odtwarza słabszy komputer albo zajętą przeglądarkę, czyli warunki, w których mignięcie widać najlepiej.
2. **Skąd wzrost startowego JS, skoro panel ustawień ładuje się leniwie?** `applyTheme`, `useAppliedTheme`, `resolveTheme` i `accountTheme` muszą działać przed pierwszym renderem pulpitu. Tłumaczenia obu języków są kompilowane do paczki startowej od Etapu 1, więc nowe klucze też tam trafiają.
3. **Co jeszcze oprócz motywu zapisałby skrypt startowy, gdyby doszło tło pulpitu?** Typ i parametry tła (np. kolor), żeby pierwsza klatka miała także właściwe tło. `StoredTheme` dostałby nowe pole, a skrypt nową gałąź, tak samo jak `applyTheme`.

</details>

---

## Zadanie 14: domknięcie Etapu 5

**Cel:** spełniona definicja ukończenia Etapu 5, decyzje z tego planu zapisane w dokumentacji, a dokumentacja zgodna z kodem.

**Kroki:**

- [ ] **1. Architektura.** W [03-architektura.md](03-architektura.md):
  - w „Struktura repozytorium”: `src/theme/` (`apply-theme.ts`, `use-applied-theme.ts`) i komponenty panelu (`ThemeModePicker.vue`, `AccentPicker.vue`, `ThemeOverrideFields.vue`, `use-account-theme.ts`);
  - w „Pakiet `shared`”: typy, `DEFAULT_THEME` i `resolveTheme` w `theme.ts` bez Zoda, a `ThemeSettingsSchema` i `ThemeOverrideSchema` w `theme-schemas.ts`; testy typów (`expectTypeOf`) pilnują zgodności (decyzja 3);
  - w „Model danych”: `user_settings.theme` i `contexts.theme_override` to `jsonb` z możliwym `null` (`null` to motyw domyślny albo brak nadpisania), dodane w migracji `0004_theme`; usuń uwagę, że w Etapie 2 tabela ma tylko `locale`;
  - w „API”: `PATCH /settings` przyjmuje cały `theme`, `GET /settings` zwraca `DEFAULT_THEME` dla `null`; `themeOverride: null` usuwa nadpisanie;
  - w „Start nowej karty”: `theme-boot.js` czyta `one-place:theme` (`{ mode, vars }`), w trybie systemowym sam pyta `matchMedia`, bez zapisu stosuje tryb systemowy; startowy JS po Etapie 5 (Twój pomiar, na prototypie około 495,6 kB);
  - w „Persister”: `CACHE_SCHEMA_VERSION` po Etapie 5 to `'2'`;
  - w „Warstwa danych”: `hasLaterChanges(queryClient, mutationKey)` w `optimistic.ts`, klucze mutacji ustawień i zmian kontekstu;
  - w „Motywy”: `useAppliedTheme` (z `usePreferredDark`) i `useAccountTheme`, motyw stosowany dopiero po wczytaniu ustawień i kontekstów, ekran logowania z `DEFAULT_THEME`, wylogowanie zapisuje motyw domyślny, sekcja „Wygląd kontekstu” dla aktywnego kontekstu, opcja „Globalny” pole po polu;
  - w rejestrze decyzji: typy motywu bez Zoda i schematy osobno (odrzucone: `z.infer` z `import type`, schematy w tym samym pliku), kolumny z `null` (odrzucone: `NOT NULL DEFAULT`), zapis trybu zamiast wyniku w `localStorage`.
- [ ] **2. Specyfikacja.** W [02-specyfikacja.md](02-specyfikacja.md) sprawdź F-THEME-01 … F-THEME-06. W F-THEME-03 dopisz opcję „Globalny” w każdym polu, a w F-AUTH-04, że wylogowanie przywraca motyw domyślny.
- [ ] **3. Roadmapa.** Przy Etapie 5 w [04-roadmapa.md](04-roadmapa.md) jest odnośnik do tego planu. Sprawdź, czy zakres się zgadza (`ThemeSettingsSchema` i `ThemeOverrideSchema` są w `theme-schemas.ts`, a „sekcja »Wygląd« w ustawieniach kontekstu” to sekcja w panelu ustawień).
- [ ] **4. Definicja ukończenia** z [roadmapy](04-roadmapa.md#etap-5-motywy):
  - [ ] motyw globalny i nadpisanie w kontekście działają natychmiast (zadania 11 i 12);
  - [ ] są zachowane po przeładowaniu, bez mignięcia (zadania 7 i 13);
  - [ ] tryb systemowy reaguje na zmianę ustawień systemu bez przeładowania (zadania 8 i 13);
  - [ ] testy API sprawdzają motyw domyślny, zapis całego motywu, 400 dla niepoprawnego motywu i nadpisania oraz usunięcie nadpisania przez `null` (`settings.test.ts`, `contexts.test.ts`);
  - [ ] kolumny motywu mogą być `null` (test migracji i krok 6 zadania 3);
  - [ ] `CACHE_SCHEMA_VERSION` jest zmienione (zadanie 9);
  - [ ] startowy JS mieści się w budżecie, a pierwszy render z cache trwa poniżej 200 ms.
- [ ] **5.** `pnpm check` (oczekiwany wynik: 47 + 102 + 132 = **281 testów**), potem commit: `docs: add stage 5 results`.

---

## Materiały

| Temat                                               | Gdzie czytać                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Skrypty klasyczne i modułowe (`defer`)              | https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script                                |
| `prefers-color-scheme` i `matchMedia`               | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme                    |
| `localStorage`                                      | https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage                            |
| CSP w rozszerzeniach MV3                            | https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy         |
| WXT: struktura projektu (`public/`)                 | https://wxt.dev/guide/essentials/project-structure.html                                         |
| Vite: import pliku jako tekstu (`?raw`)             | https://vite.dev/guide/assets#importing-asset-as-string                                         |
| VueUse: `usePreferredDark`                          | https://vueuse.org/core/usePreferredDark/                                                       |
| Tailwind: wykrywanie klas w kodzie                  | https://tailwindcss.com/docs/detecting-classes-in-source-files                                  |
| Tailwind: warianty `aria-*`                         | https://tailwindcss.com/docs/hover-focus-and-other-states#aria-states                           |
| Nuxt UI: Switch                                     | https://ui.nuxt.com/docs/components/switch                                                      |
| Zod: obiekty (`extend`, `partial`, `omit`)          | https://zod.dev/api#objects                                                                     |
| Vitest: testowanie typów (`expectTypeOf`)           | https://vitest.dev/guide/testing-types                                                          |
| Drizzle: kolumna `jsonb`                            | https://orm.drizzle.team/docs/column-types/pg#jsonb                                             |
| Postgres: `ALTER TABLE … ADD COLUMN`                | https://www.postgresql.org/docs/current/sql-altertable.html                                     |
| TanStack Query: `buster` w persisterze              | https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient#cache-busting |
| TanStack Query: `isMutating`                        | https://tanstack.com/query/latest/docs/reference/QueryClient#queryclientismutating              |
| Chrome DevTools: emulacja `prefers-color-scheme`    | https://developer.chrome.com/docs/devtools/rendering/emulate-css                                |
| Chrome DevTools: zrzuty klatek w panelu Performance | https://developer.chrome.com/docs/devtools/performance/reference#screenshots                    |

## Co dalej

Po Etapie 5 kolejnym krokiem jest [Etap 6: Domknięcie MVP](04-roadmapa.md#etap-6-domknięcie-mvp): testy E2E dla wszystkich 10 scenariuszy akceptacyjnych (w tym motywu i drugiej przeglądarki), komplet tłumaczeń EN, pomiar wydajności i budżetu JS, ręczna checklista w Brave i README. Przygotuję dla niego podobny plan nauki, gdy będziesz gotowy.
