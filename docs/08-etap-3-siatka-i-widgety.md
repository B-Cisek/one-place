xx# 08. Etap 3: Siatka i system widgetów (plan nauki)

Ten plik prowadzi przez [Etap 3 z roadmapy](04-roadmapa.md#etap-3-siatka-i-system-widgetów). Format jest taki sam jak w [planie Etapu 2](07-etap-2-konteksty.md): każde zadanie mówi, **co** zrobić, **dlaczego** i **jak sprawdzić**, że działa. Gotowy kod jest schowany w zwijanych blokach „Rozwiązanie”.

**Cel:** każdy kontekst ma własny pulpit z widgetami na siatce 12 kolumn. W trybie edycji widgety można dodawać z katalogu, przeciągać za nagłówek, skalować i usuwać, a układ zapisuje się sam. Widget ma menu z ustawieniami i usuwaniem. Błąd w jednym widgecie zostaje w jego ramce, a widget typu nieznanego tej wersji rozszerzenia pokazuje komunikat. W oknie węższym niż 768 px widgety układają się w jednej kolumnie. Typ `todo` istnieje jako zaślepka, która pokazuje sam tytuł.

**Architektura:** API dostaje moduł `widgets`. Trasy listy, tworzenia i układu siedzą pod `/api/contexts/:id`, a zmiana konfiguracji i usuwanie pod `/api/widgets/:id`. Układ zapisuje jedno żądanie w transakcji. Konfigurację sprawdza schemat Zod jej typu, zarówno w API, jak i w rozszerzeniu. Rozszerzenie trzyma widgety w cache osobno dla każdego kontekstu (`['widgets', contextId]`), a zmiany są optymistyczne, tak jak przy kontekstach. W trybie podglądu siatkę rysuje zwykły CSS grid, a biblioteka `grid-layout-plus` ładuje się dopiero w trybie edycji. Rejestr typów widgetów jest mały i nie zna Zoda: komponenty widgetów, ich schematy i menu ładują się leniwie.

**Specyfikacja:** F-GRID-01 … F-GRID-05, F-WGT-01 … F-WGT-07 i licznik widgetów z F-CTX-07 w [02-specyfikacja.md](02-specyfikacja.md#siatka-grid), sekcje „Model danych”, „API”, „System widgetów” i „Siatka” w [03-architektura.md](03-architektura.md) oraz ryzyko R4.

> Rozwiązania sprawdziłem na prototypie 18.10.2026 (macOS, Node 24.7, pnpm 10.24, Postgres 18 w Dockerze, Chrome for Testing 156, `grid-layout-plus` 1.1.1, Vue 3.5.43): 177 testów, lint, typecheck i build. W przeglądarce z załadowanym rozszerzeniem sprawdziłem pusty pulpit, katalog i dodawanie, siatkę w podglądzie i w edycji (zgodność położenia co do piksela), przeciąganie, skalowanie, minimalny rozmiar, zapis układu, menu, ustawienia, usuwanie, nieznany typ, błąd w zaślepce, jedną kolumnę, limit 50 widgetów, licznik w modalu usuwania kontekstu, kartę otwartą offline, odrzucony układ i prywatność (żadnych żądań poza API). Scenariusze sprawdziłem w zbudowanej paczce, a główny przepływ także w `pnpm dev`.

## Jak korzystać z planu

Tak samo jak w poprzednich etapach:

1. Przeczytaj całe zadanie przed rozpoczęciem.
2. Odhaczaj kroki (`- [ ]` na `- [x]`).
3. W krokach z testem **najpierw zobacz czerwony test**, dopiero potem pisz implementację.
4. Gdy utkniesz na ponad 15 minut, otwórz „Podpowiedź”, a potem „Rozwiązanie”.
5. Każde zadanie kończy się zielonym `pnpm check` i commitem.
6. Na końcu zadania odpowiedz na pytania kontrolne.

Kroki oznaczone jako **eksperyment** celowo pokazują błąd, zanim go naprawisz. W tym etapie większość z nich dotyczy rzeczy, których nie widać w konsoli: rozmiaru startowego JS, żądań do obcych hostów i zapisów wysyłanych w pętli.

## Wymagania wstępne

- [ ] Etap 2 jest skończony, a `pnpm check` przechodzi (116 testów)
- [ ] Postgres działa: `docker compose up -d`
- [ ] Migracje z Etapów 1 i 2 są zastosowane: `pnpm --filter @one-place/api db:migrate`
- [ ] `pnpm dev` uruchamia API i przeglądarkę z rozszerzeniem, a konteksty działają
- [ ] `pnpm --filter @one-place/extension build && pnpm size` pokazuje około 473 kB

## Ograniczenia globalne

Obowiązują ograniczenia z [Etapu 0](05-implementacja-poczatkowa.md#ograniczenia-globalne), [Etapu 1](06-etap-1-logowanie.md#ograniczenia-globalne) i [Etapu 2](07-etap-2-konteksty.md#ograniczenia-globalne) oraz:

| Pakiet               | Wersja | Gdzie              | Uwagi                                                             |
| -------------------- | ------ | ------------------ | ----------------------------------------------------------------- |
| `grid-layout-plus`   | `^1.1` | rozszerzenie       | siatka w trybie edycji, ładowana leniwie; wersja 2.0 jest w becie |
| `@vueuse/core`       | `^14`  | rozszerzenie       | `useBreakpoints` i `useDebounceFn`                                |
| `@vue/test-utils`    | `^2.5` | rozszerzenie (dev) | testy komponentów                                                 |
| `happy-dom`          | `^21`  | rozszerzenie (dev) | DOM w testach komponentów                                         |
| `@vitejs/plugin-vue` | `^6`   | rozszerzenie (dev) | pliki `.vue` w Vitest                                             |

- Komponenty i widgety nigdy nie wołają API bezpośrednio. Robią to tylko composables z `src/queries/`.
- `grid-layout-plus` zna tylko jeden plik aplikacji: `GridEditor.vue` (ryzyko R4). Wyjątkiem jest test zgodności z zadania 7, który korzysta z algorytmu biblioteki.
- Każde zapytanie do bazy w serwisach API jest ograniczone do właściciela. Cudzy kontekst i cudzy widget dają 404.
- Startowy JS mieści się w budżecie 550 kB. Wszystko, czego nie widać przy pierwszym renderze pulpitu, ładuje się leniwie.
- Teksty w UI tylko przez i18n. Nazwy w kodzie, opisy testów, komunikaty błędów API, logi i commity po angielsku.

## Decyzje dla tego etapu

Ustalone przed napisaniem planu. Zadanie 16 przenosi je do dokumentacji.

1. **Podgląd rysuje własna siatka CSS, a `grid-layout-plus` ładuje się dopiero w trybie edycji.** Sama biblioteka dokłada do startowego JS około 139 kB (pomiar: 473 → 612 kB), czyli 62 kB ponad budżet. Podgląd nie potrzebuje przeciągania, więc wystarczy mu CSS grid z tą samą geometrią i ten sam algorytm dosuwania widgetów w pionie. Budżet zostaje 550 kB. Zadania 7, 10 i 12.
2. **Menu widgetu ładuje się przy pierwszym kliknięciu.** `UDropdownMenu` kosztuje około 100 kB (pomiar z Etapu 2). Ramka pokazuje zwykły przycisk, a pierwsze kliknięcie montuje menu razem z modalami ustawień i usuwania. To ten sam wzór co okno kontekstów z Etapu 2. Zadanie 13.
3. **Zaślepka Zadań ma ustawienia z samym tytułem.** Dzięki temu cały mechanizm ustawień (modal, mutacja optymistyczna, walidacja konfiguracji) działa już w tym etapie. Etap 4 dopisze „Ukryj ukończone” i listę zadań. Zadanie 13.
4. **`grid-layout-plus` w wersji 1.1 (stabilnej).** Wersja 2.0 jest w becie. Ocena ryzyka R4 i plan awaryjny są w zadaniach 12 i 16.
5. **Liczba widgetów w modalu usuwania kontekstu pochodzi z `useWidgets`.** Kontekst, którego na tym urządzeniu nigdy nie otwarto, pobiera listę widgetów przy otwarciu modalu. `ContextDto` nie dostaje licznika, więc nie trzeba utrzymywać go przy każdej zmianie. Zadanie 14.

## Na co uważać

Osiem sytuacji, które łatwo przeoczyć, bo nie dają błędu w konsoli albo pojawiają się dopiero w przeglądarce:

1. **Zod na ścieżce startowej.** Import jednej stałej z modułu `shared`, który tworzy schematy, dokłada do startowego JS około 93 kB. Tak samo kosztuje walidacja konfiguracji w ramce widgetu. Zadanie 8.
2. **Zapis układu w pętli.** `grid-layout-plus` zgłasza „nowy układ” także po zamontowaniu i po każdej zmianie danych z cache. Bez porównania z cache każda odpowiedź API wywołuje kolejny zapis, około dwóch na sekundę. Zadanie 12.
3. **Nowy kontekst i jego widgety.** Kontekst utworzony w tej karcie jest w cache, zanim API go zapisze. Pulpit od razu prosi o jego widgety i dostaje 404, a zamiast pustego pulpitu widać „Nie udało się wczytać danych”. Zadanie 10.
4. **Ikony z rejestru.** Ikona typu widgetu jest zapisana w pliku `.ts`, którego skaner Nuxt UI domyślnie nie czyta. Katalog widgetów pobiera ją z `api.iconify.design`. Zadanie 11.
5. **Błąd w widgecie.** Bez `return false` w `onErrorCaptured` błąd idzie dalej i wywraca komponent nadrzędny, czyli cały pulpit. Zadanie 9.
6. **Częściowy zapis układu.** Bez transakcji pierwszy poprawny element zostaje zapisany, choć całe żądanie dostaje 400. Zadanie 5.
7. **Widgety usuniętego kontekstu.** Bez sprzątania zostają w cache zapisanym w `chrome.storage.local` aż do wylogowania, choć nikt już ich nie pokaże ani nie odświeży. Zadanie 6.
8. **Ikony w testach komponentów.** Bez skanera ikon w konfiguracji Vitest `UIcon` pobiera ikony z sieci także w testach, a happy-dom przerywa te żądania przy zamykaniu środowiska. Zadanie 9.

## Struktura po Etapie 3

Nowe i zmienione pliki:

```
one-place/
├─ packages/shared/src/  widget-types.ts  widgets.ts  index.ts  (+ test)
├─ apps/api/
│  ├─ src/
│  │  ├─ app.ts
│  │  ├─ db/schema/  widgets.ts  index.ts
│  │  ├─ db/migrations/0002_widgets.sql
│  │  ├─ middleware/require-auth.ts
│  │  └─ modules/  contexts/ (routes.ts, service.ts)  widgets/ (routes.ts, service.ts)
│  └─ test/  auth-helpers.ts  fixtures.ts  migrations.test.ts  widgets.test.ts
└─ apps/extension/
   ├─ package.json  wxt.config.ts  vitest.config.ts  nuxt-ui.config.ts
   └─ src/
      ├─ queries/  keys.ts  widgets.ts  contexts.ts  (+ testy)
      ├─ stores/ui.ts  (+ test)
      ├─ widgets/  types.ts  registry.ts  config.ts  (+ testy)
      │            todo/  TodoWidget.vue  TodoSettings.vue  (+ test)
      ├─ features/dashboard/  DashboardScreen.vue  AppHeader.vue  ContextDashboard.vue
      │                       DashboardGrid.vue  GridEditor.vue  WidgetFrame.vue
      │                       WidgetActions.vue  grid.ts  layout.ts  use-narrow-screen.ts
      │                       (+ testy)
      ├─ features/widgets/  WidgetCatalog.vue  use-add-widget.ts
      ├─ features/contexts/ManageContexts.vue
      └─ i18n/  index.ts  plural.ts  pl.json  en.json  (+ test)
```

---

## Zadanie 1: typy, konfiguracja i układ widgetów w `shared` (TDD)

**Cel:** jedno źródło reguł dla API i rozszerzenia. Typ widgetu pochodzi z listy, konfiguracja jest zgodna ze schematem swojego typu, a widget mieści się w 12 kolumnach i nie jest mniejszy niż minimalny rozmiar typu ([02-specyfikacja.md](02-specyfikacja.md#limity-i-walidacja)).

**Czego się nauczysz:** `.default()` na każdym polu, schemat zależny od wartości innego pola (`.transform()` z `ctx.addIssue`), ścieżki błędów w zagnieżdżonych danych, `z.input` i `z.output`, `satisfies Record<…>`.

**Pliki:**

- Utwórz: `packages/shared/src/widgets.ts`
- Zmień: `packages/shared/src/index.ts`
- Test: `packages/shared/src/widgets.test.ts`

**Interfejsy:**

- Wytwarza: stałe `WIDGET_TYPES`, `GRID_COLUMNS`, `MAX_WIDGETS_PER_CONTEXT`, `TODO_TITLE_MAX_LENGTH` i `WIDGET_SIZES` (minimalny i domyślny rozmiar każdego typu); typy `WidgetType`, `WidgetSize` i `TodoConfig`; funkcję `isWidgetType(type)`; schematy `TodoConfigSchema`, `widgetConfigSchemas` (mapa typ → schemat), `CreateWidgetSchema`, `LayoutItemSchema`, `LayoutSchema` i `UpdateWidgetSchema`; typy `CreateWidgetInput`, `LayoutItem`, `UpdateWidgetInput` i `WidgetDto`. Używają ich prawie wszystkie kolejne zadania.

**Kroki:**

- [x] **1. Czerwone testy** w `src/widgets.test.ts`:
  - `TodoConfigSchema.parse({})` daje `{ title: '', hideCompleted: false, source: { type: 'local' } }`;
  - tytuł `'  Zakupy  '` jest przycinany, 60 znaków przechodzi, a 61 daje błąd `validation.widgetTitleTooLong` na ścieżce `['title']`;
  - dla każdego typu z `WIDGET_TYPES` schemat z `widgetConfigSchemas` przyjmuje `{}`;
  - `CreateWidgetSchema` przyjmuje poprawny widget z `config: {}` i zwraca pełną konfigurację domyślną;
  - typ `'notes'` nie przechodzi;
  - tytuł z 61 znaków daje błąd na ścieżce `['config', 'title']`;
  - `x: 8, w: 4` przechodzi, a `x: 9, w: 4` nie;
  - `w: 2` i `h: 2` (minimum dla `todo` to 3×3), `x: 1.5` i `y: -1` nie przechodzą;
  - `LayoutSchema` przyjmuje listę `{ id, x, y, w, h }`, ale odrzuca ten sam widget dwa razy i element, który nie mieści się w siatce.
- [x] **2. Uruchom.** `pnpm --filter @one-place/shared test`. Oczekiwany wynik: **FAIL**, bo moduł `./widgets` nie istnieje.
- [x] **3. Implementacja** `src/widgets.ts`. `WidgetDto` to zwykły interfejs, tak jak `ContextDto`. W `src/index.ts` dopisz eksport.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (26 testów w `shared`)**.
- [x] **5. Eksperyment: ścieżka błędu.** W `transform` przekaż błąd konfiguracji bez zmiany ścieżki: `ctx.addIssue({ ...issue })`. Oczekiwany wynik: test konfiguracji **FAIL**, bo błąd ma ścieżkę `['title']`. Rozszerzenie i API nie wiedziałyby, że chodzi o pole konfiguracji, a nie o pole widgetu. Przywróć `path: ['config', ...issue.path]`.
- [x] **6.** `pnpm format && pnpm check`, potem commit: `feat(shared): add widget types, config and layout schemas`.

**Pułapki (sprawdzone na prototypie):**

- **Schemat konfiguracji zależy od typu.** `z.object()` sprawdza każde pole osobno, więc nie wie, którym schematem sprawdzić `config`. Dlatego `config` jest w obiekcie `z.unknown()`, a właściwą walidację robi `.transform()`, który zna już `input.type`. Ten sam `transform` zwraca konfigurację z wartościami domyślnymi.
- **`z.NEVER` po błędzie.** Gdy `ctx.addIssue` zgłosi błąd, `transform` musi coś zwrócić. `return z.NEVER` mówi TypeScriptowi, że ta gałąź nie daje wyniku, więc typ `config` w wyniku to `TodoConfig`, a nie `TodoConfig | undefined`.
- **`z.input` a `z.infer`.** Po `transform` typ wejścia i wyjścia się różnią: klient wysyła `config: unknown`, a trasa dostaje pełny `TodoConfig`. `CreateWidgetInput` to `z.input<…>`, bo opisuje to, co wysyła rozszerzenie.
- **`.default()` na każdym polu.** Rozszerzenie doda widget z `config: {}`, a API uzupełni resztę. Test „pełna konfiguracja domyślna dla `{}`” pilnuje, żeby nowe pole nie zostało bez wartości domyślnej.
- **`type` w `WidgetDto` to `string`, a nie `WidgetType`.** Starsza wersja rozszerzenia może dostać z API typ dodany w nowszej (F-WGT-06). Typ `WidgetType` obiecywałby coś, czego nie da się zagwarantować.

<details>
<summary>Podpowiedź</summary>

- `z.int()` w Zod 4 przyjmuje tylko liczby całkowite. `.min(0)` i `.max(GRID_COLUMNS)` dokładają zakres.
- Warunek „mieści się w siatce” dotyczy dwóch pól, więc to `.refine((rect) => rect.x + rect.w <= GRID_COLUMNS, { message, path: ['w'] })` na całym obiekcie.
- Pozostałe pola widgetu (`x`, `y`, `w`, `h`) przydadzą się też w `LayoutItemSchema`. Trzymaj je w jednym `GridRectSchema` i rozkładaj przez `...GridRectSchema.shape` albo `.extend()`.
- Unikalne ID: `.refine((items) => new Set(items.map((item) => item.id)).size === items.length)`.

</details>

<details>
<summary>Rozwiązanie</summary>

`packages/shared/src/widgets.test.ts`

```ts
impxrt { describe, expect, it } from 'vitest'
import {
  CreateWidgetSchema,
  LayoutSchema,
  TodoConfigSchema,
  WIDGET_TYPES,
  widgetConfigSchemas,
} from './widgets'

const validWidget = {
  id: '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b10',
  type: 'todo',
  config: {},
  x: 0,
  y: 0,
  w: 4,
  h: 6,
}

function issues(result: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return result.error?.issues.map((issue) => ({ path: issue.path, message: issue.message }))
}

describe('TodoConfigSchema', () => {
  it('fills in the default config', () => {
    expect(TodoConfigSchema.parse({})).toEqual({
      title: '',
      hideCompleted: false,
      source: { type: 'local' },
    })
  })

  it('trims the title and allows at most 60 characters', () => {
    expect(TodoConfigSchema.parse({ title: '  Zakupy  ' }).title).toBe('Zakupy')
    expect(TodoConfigSchema.safeParse({ title: 'a'.repeat(60) }).success).toBe(true)
    expect(issues(TodoConfigSchema.safeParse({ title: 'a'.repeat(61) }))).toEqual([
      { path: ['title'], message: 'validation.widgetTitleTooLong' },
    ])
  })
})

describe('widgetConfigSchemas', () => {
  // The extension adds widgets with `config: {}` and fixes invalid fields with the defaults
  it('give every widget type a full default config', () => {
    for (const type of WIDGET_TYPES) {
      expect(widgetConfigSchemas[type].safeParse({}).success).toBe(true)
    }
  })
})

describe('CreateWidgetSchema', () => {
  it('accepts a valid widget and fills in its config', () => {
    const result = CreateWidgetSchema.safeParse(validWidget)
    expect(result.success).toBe(true)
    expect(result.data?.config).toEqual({
      title: '',
      hideCompleted: false,
      source: { type: 'local' },
    })
  })

  it('accepts only types from WIDGET_TYPES', () => {
    expect(CreateWidgetSchema.safeParse({ ...validWidget, type: 'notes' }).success).toBe(false)
  })

  it('validates the config with the schema of its type', () => {
    const result = CreateWidgetSchema.safeParse({
      ...validWidget,
      config: { title: 'a'.repeat(61) },
    })
    expect(issues(result)).toEqual([
      { path: ['config', 'title'], message: 'validation.widgetTitleTooLong' },
    ])
  })

  it('requires the widget to fit in 12 columns', () => {
    expect(CreateWidgetSchema.safeParse({ ...validWidget, x: 8, w: 4 }).success).toBe(true)
    expect(CreateWidgetSchema.safeParse({ ...validWidget, x: 9, w: 4 }).success).toBe(false)
  })

  it('rejects sizes below the minimum of the type and positions that are not whole numbers', () => {
    expect(CreateWidgetSchema.safeParse({ ...validWidget, w: 2 }).success).toBe(false)
    expect(CreateWidgetSchema.safeParse({ ...validWidget, h: 2 }).success).toBe(false)
    expect(CreateWidgetSchema.safeParse({ ...validWidget, x: 1.5 }).success).toBe(false)
    expect(CreateWidgetSchema.safeParse({ ...validWidget, y: -1 }).success).toBe(false)
  })
})

describe('LayoutSchema', () => {
  const item = { id: validWidget.id, x: 0, y: 0, w: 4, h: 6 }

  it('accepts a list of positions and sizes', () => {
    expect(LayoutSchema.safeParse([item]).success).toBe(true)
  })

  it('rejects the same widget twice and items that do not fit', () => {
    expect(LayoutSchema.safeParse([item, { ...item, y: 6 }]).success).toBe(false)
    expect(LayoutSchema.safeParse([{ ...item, x: 10 }]).success).toBe(false)
  })
})
```

`packages/shared/src/widgets.ts` (stan po tym zadaniu; zadanie 8 przeniesie stałe do osobnego pliku)

```ts
import { z } from 'zod'

export const WIDGET_TYPES = ['todo'] as const
export const GRID_COLUMNS = 12
export const MAX_WIDGETS_PER_CONTEXT = 50
export const TODO_TITLE_MAX_LENGTH = 60

export type WidgetType = (typeof WIDGET_TYPES)[number]

export interface WidgetSize {
  w: number
  h: number
}

// In grid units. The API checks the minimum, the extension uses both when adding and resizing.
export const WIDGET_SIZES: Record<WidgetType, { min: WidgetSize; default: WidgetSize }> = {
  todo: { min: { w: 3, h: 3 }, default: { w: 4, h: 6 } },
}

export function isWidgetType(type: string): type is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(type)
}

export const TodoConfigSchema = z.object({
  title: z.string().trim().max(TODO_TITLE_MAX_LENGTH, 'validation.widgetTitleTooLong').default(''),
  hideCompleted: z.boolean().default(false),
  // Where the tasks come from. The MVP has only the One Place API (D11).
  source: z
    .discriminatedUnion('type', [z.object({ type: z.literal('local') })])
    .default({ type: 'local' }),
})

export type TodoConfig = z.infer<typeof TodoConfigSchema>

export const widgetConfigSchemas = {
  todo: TodoConfigSchema,
} satisfies Record<WidgetType, z.ZodType>

const GridRectSchema = z.object({
  x: z.int().min(0),
  y: z.int().min(0),
  w: z.int().min(1).max(GRID_COLUMNS),
  h: z.int().min(1),
})

function fitsGrid(rect: { x: number; w: number }) {
  return rect.x + rect.w <= GRID_COLUMNS
}

const fitsGridError = { message: `A widget must fit in ${GRID_COLUMNS} columns`, path: ['w'] }

export const CreateWidgetSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(WIDGET_TYPES),
    config: z.unknown(),
    ...GridRectSchema.shape,
  })
  .refine(fitsGrid, fitsGridError)
  .transform((input, ctx) => {
    const { min } = WIDGET_SIZES[input.type]
    if (input.w < min.w || input.h < min.h) {
      ctx.addIssue({
        code: 'custom',
        message: `A ${input.type} widget must be at least ${min.w}x${min.h}`,
        path: ['w'],
      })
    }
    // The config schema depends on the type, so it is checked here and not in z.object()
    const config = widgetConfigSchemas[input.type].safeParse(input.config)
    if (!config.success) {
      for (const issue of config.error.issues) {
        ctx.addIssue({ ...issue, path: ['config', ...issue.path] })
      }
      return z.NEVER
    }
    return { ...input, config: config.data }
  })

export const LayoutItemSchema = GridRectSchema.extend({ id: z.uuid() }).refine(
  fitsGrid,
  fitsGridError,
)

export const LayoutSchema = z
  .array(LayoutItemSchema)
  .max(MAX_WIDGETS_PER_CONTEXT)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, {
    message: 'Each widget can appear in the layout only once',
  })

// The whole config is replaced. The API validates it with the schema of the widget's type.
export const UpdateWidgetSchema = z.object({ config: z.record(z.string(), z.unknown()) })

export type CreateWidgetInput = z.input<typeof CreateWidgetSchema>
export type LayoutItem = z.infer<typeof LayoutItemSchema>
export type UpdateWidgetInput = z.infer<typeof UpdateWidgetSchema>

export interface WidgetDto<TConfig = unknown> {
  id: string
  contextId: string
  // A string, not WidgetType: a newer version of the extension may have added a type (F-WGT-06)
  type: string
  config: TConfig
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
  version: number
}
```

`packages/shared/src/index.ts`

```ts
export * from './auth'
export * from './contexts'
export * from './settings'
export * from './theme'
export * from './widgets'
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego minimalny rozmiar jest w `shared`, a nie tylko w definicji widgetu w rozszerzeniu?** API też musi go sprawdzić: żądanie wysłane z pominięciem rozszerzenia nie może zapisać widgetu 1×1. Jedna stała w `shared` daje tę samą regułę po obu stronach.
2. **Czym różni się `UpdateWidgetSchema` od `CreateWidgetSchema` w sprawdzaniu konfiguracji?** Przy tworzeniu typ jest w żądaniu, więc schemat może od razu sprawdzić konfigurację. Przy zmianie w żądaniu jest tylko `config`, a typ zna dopiero baza. Dlatego `UpdateWidgetSchema` sprawdza tylko, że to obiekt, a resztę robi serwis (zadanie 4).
3. **Po co `source` w konfiguracji Zadań, skoro jedyną wartością jest `local`?** Pole jest unią z dyskryminatorem `type`. Integracja (np. Todoist) dojdzie jako nowa gałąź unii bez zmiany kształtu istniejących konfiguracji (decyzja D11).

</details>

---

## Zadanie 2: tabela `widgets` i trzecia migracja

**Cel:** w bazie jest tabela widgetów z modelu w [03-architektura.md](03-architektura.md#tabele). Usunięcie kontekstu albo użytkownika usuwa jego widgety.

**Czego się nauczysz:** kolumna `jsonb` w Drizzle, klucz obcy do tabeli danych (nie tylko do `user`), sprawdzanie reguł kluczy obcych w `information_schema`.

**Pliki:**

- Utwórz: `apps/api/src/db/schema/widgets.ts`
- Zmień: `apps/api/src/db/schema/index.ts`, `apps/api/test/migrations.test.ts`
- Wygeneruj: `apps/api/src/db/migrations/0002_widgets.sql`

**Interfejsy:**

- Korzysta z: `timestamps` (Etap 2), tabel `user` i `contexts`.
- Wytwarza: tabelę Drizzle `widgets`. Używają jej zadania 3–5.

**Kroki:**

- [x] **1. Czerwone testy** w `test/migrations.test.ts`:
  - na liście tabel jest `'widgets'` (na końcu, alfabetycznie); zmień też nazwę testu na „create the Better Auth and data tables”;
  - klucze obce tabeli `widgets` mają regułę `CASCADE`: `[{ column_name: 'context_id', delete_rule: 'CASCADE' }, { column_name: 'user_id', delete_rule: 'CASCADE' }]`.

  Oczekiwany wynik: **FAIL** obu testów.

- [x] **2. Schemat** `schema/widgets.ts` według tabeli z architektury: `context_id` z kaskadą do `contexts.id`, `type` jako `varchar(32)`, `config` jako `jsonb`, `x`, `y`, `w`, `h` jako `integer`, `...timestamps` i indeks na `context_id`. Dopisz eksport w `schema/index.ts`.
- [x] **3. Migracja.** `pnpm --filter @one-place/api db:generate --name widgets`. Przeczytaj plik SQL i znajdź `ON DELETE cascade` przy obu kluczach obcych. Drugie `db:generate` ma odpowiedzieć „No schema changes, nothing to migrate”.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (54 testy w pakiecie API)**.
- [x] **5. Sprawdź, czy test pilnuje kaskady.** W pliku SQL zmień na chwilę `ON DELETE cascade` przy `context_id` na `ON DELETE no action`. Oczekiwany wynik: `"delete_rule": "NO ACTION"` zamiast `"CASCADE"`. Przywróć plik.
- [x] **6. Migracja w Dockerze.** `pnpm --filter @one-place/api db:migrate`, potem `docker compose exec db psql -U one one_place -c '\d widgets'`. W „Foreign-key constraints” oba klucze mają `ON DELETE CASCADE`.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(api): add widgets table`.

**Pułapki (sprawdzone na prototypie):**

- **`type` bez `$type<WidgetType>()`.** Kolumna przechowa też typy, których bieżąca wersja kodu nie zna (np. po wycofaniu typu). `string` w TypeScript mówi prawdę o tym, co może przyjść z bazy.
- **`jsonb` zwraca `unknown`.** Drizzle nie wie, jaki kształt ma JSON, i to dobrze: konfigurację sprawdza schemat typu przy zapisie, a rozszerzenie przy odczycie.
- **`user_id` mimo `context_id`.** Właściciela da się ustalić przez kontekst, ale własna kolumna pozwala filtrować każde zapytanie po `user_id` bez łączenia tabel, zgodnie z konwencją z architektury.

<details>
<summary>Podpowiedź</summary>

- Kolumna `jsonb`: `jsonb('config').notNull()` z `drizzle-orm/pg-core`.
- Reguły kluczy obcych są w `information_schema.referential_constraints` (kolumna `delete_rule`), a nazwy kolumn w `information_schema.key_column_usage`. Połącz je po `constraint_name` i filtruj po `table_name = 'widgets'`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/db/schema/widgets.ts`

```ts
import { index, integer, jsonb, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { timestamps } from './columns'
import { contexts } from './contexts'

export const widgets = pgTable(
  'widgets',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Deleting a context deletes its widgets (F-CTX-07)
    contextId: uuid('context_id')
      .notNull()
      .references(() => contexts.id, { onDelete: 'cascade' }),
    // Not WidgetType: the column also keeps types the API may stop knowing about
    type: varchar('type', { length: 32 }).notNull(),
    config: jsonb('config').notNull(),
    x: integer('x').notNull(),
    y: integer('y').notNull(),
    w: integer('w').notNull(),
    h: integer('h').notNull(),
    ...timestamps,
  },
  (table) => [index('widgets_context_id_idx').on(table.contextId)],
)
```

`apps/api/src/db/schema/index.ts`

```ts
export * from './auth'
export * from './contexts'
export * from './settings'
export * from './widgets'
```

`apps/api/test/migrations.test.ts` (zmieniony pierwszy test i nowy test na końcu)

```ts
  it('create the Better Auth and data tables', async () => {
    // … bez zmian, tylko na końcu listy:
      'verification',
      'widgets',
    ])
  })

  // …

  // Without the cascade, deleting a context with widgets would fail on the foreign key
  it('delete widgets together with their context and user', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ column_name: string; delete_rule: string }>(
      `select kcu.column_name, rc.delete_rule
       from information_schema.referential_constraints rc
       join information_schema.key_column_usage kcu on kcu.constraint_name = rc.constraint_name
       where kcu.table_name = 'widgets'
       order by kcu.column_name`,
    )
    expect(rows).toEqual([
      { column_name: 'context_id', delete_rule: 'CASCADE' },
      { column_name: 'user_id', delete_rule: 'CASCADE' },
    ])
  })
```

Wygenerowany `apps/api/src/db/migrations/0002_widgets.sql` (do porównania):

```sql
CREATE TABLE "widgets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"context_id" uuid NOT NULL,
	"type" varchar(32) NOT NULL,
	"config" jsonb NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"w" integer NOT NULL,
	"h" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_context_id_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "widgets_context_id_idx" ON "widgets" USING btree ("context_id");
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co się stanie przy `DELETE /api/contexts/:id`, gdy kontekst ma widgety, a klucz obcy nie ma kaskady?** Postgres odrzuci usunięcie kontekstu błędem klucza obcego. Serwis tego nie obsługuje, więc odpowiedź to 500, a kontekst zostaje.
2. **Dlaczego wystarczy indeks na `context_id`, a nie `(user_id, context_id)`?** Każde zapytanie o widgety zaczyna od konkretnego kontekstu, który ma najwyżej 50 widgetów. Indeks na `context_id` zawęża wynik do tych kilkudziesięciu wierszy, a warunek na `user_id` sprawdza już tylko je.
3. **Czy test kaskady sprawdza zachowanie, czy schemat?** Schemat: pyta Postgresa o regułę klucza. Zachowanie (usunięcie kontekstu przez API usuwa widgety) sprawdzi test w zadaniu 3.

</details>

---

## Zadanie 3: moduł `widgets`: lista i idempotentne tworzenie

**Cel:** `GET /api/contexts/:id/widgets` zwraca widgety kontekstu, a `POST` tworzy widget z ID wygenerowanym przez klienta i konfiguracją uzupełnioną wartościami domyślnymi. Ponowienie zwraca istniejący rekord, cudzy kontekst daje 404, a pięćdziesiąty pierwszy widget 422 (F-WGT-02, F-WGT-07).

**Czego się nauczysz:** router zagnieżdżony w innym routerze (`.route('/', …)`), typ `Hono<AuthEnv>` dla tras za cudzym `requireAuth`, ścieżki middleware w Hono, sprawdzanie właściciela zasobu nadrzędnego.

**Pliki:**

- Utwórz: `apps/api/src/modules/widgets/service.ts`, `apps/api/src/modules/widgets/routes.ts`
- Zmień: `apps/api/src/middleware/require-auth.ts`, `apps/api/src/modules/contexts/service.ts`, `apps/api/src/modules/contexts/routes.ts`, `apps/api/test/fixtures.ts`
- Test: `apps/api/test/widgets.test.ts`

**Interfejsy:**

- Korzysta z: `CreateWidgetSchema`, `WidgetDto`, `MAX_WIDGETS_PER_CONTEXT` (zadanie 1), `widgets` (zadanie 2), `validate`, `IdParamSchema`, `asUser`, `contextInput` (Etap 2).
- Wytwarza: typ `AuthEnv`, eksportowane `contextNotFound()` i `ownContext()` z serwisu kontekstów, `contextWidgetsRoutes({ db })`, trasy `GET` i `POST /api/contexts/:id/widgets`, fabrykę `widgetInput(overrides)`. Zadania 4 i 5 rozbudowują ten moduł.

**Kroki:**

- [x] **1. Fabryka testowa.** W `test/fixtures.ts` dodaj `widgetInput(overrides)`: nowy `randomUUID()`, typ `todo`, `config: {}`, `x: 0, y: 0, w: 4, h: 6`.
- [x] **2. Czerwone testy** w `test/widgets.test.ts` (`setup()` zakłada Alicję z jednym kontekstem i Boba):
  - `GET` bez tokenu daje 401;
  - `GET` zwraca tylko widgety podanego kontekstu (drugi kontekst Alicji też ma widget);
  - `GET` dla kontekstu Alicji wysłany przez Boba daje 404 z treścią `{ error: { code: 'NOT_FOUND', message: 'Context not found' } }`;
  - `POST` daje 201 i pełny rekord: `contextId`, konfiguracja `{ title: '', hideCompleted: false, source: { type: 'local' } }`, `version: 1`;
  - ponowiony `POST` daje 200 i ten sam rekord, a na liście jest jeden widget;
  - `POST` z ID widgetu Alicji wysłany przez Boba (do jego własnego kontekstu) daje 409 `ID_CONFLICT`;
  - `POST` Boba do kontekstu Alicji daje 404 jak wyżej;
  - nieznany typ, tytuł z 61 znaków i `x: 10, w: 4` dają 400 `VALIDATION_ERROR`;
  - przy 50 widgetach kolejny `POST` daje 422 `LIMIT_EXCEEDED`, a ponowienie pierwszego nadal 200;
  - `DELETE /api/contexts/:id` usuwa widgety kontekstu (`select id from widgets` jest puste).

  Oczekiwany wynik: **FAIL ośmiu testów**. 401 i usuwanie z kontekstem przechodzą już teraz. Zastanów się dlaczego (podpowiedź jest w zadaniu 6 Etapu 2).

- [x] **3. Serwis** `modules/widgets/service.ts`: `listWidgets(db, userId, contextId)` i `createWidget(db, userId, contextId, input)`. Właściciela kontekstu sprawdza wspólna funkcja `assertOwnContext`, która korzysta z `ownContext` i `contextNotFound` z serwisu kontekstów (wyeksportuj je). Kolejność w `createWidget`: istniejące ID, kontekst, limit, `insert`. Listę sortuj po `(y, x, id)`.
- [x] **4. Eksperyment: dwa routery pod `/contexts`.** Napisz trasy w nowym routerze z własnym `.use(requireAuth(auth))` i podłącz go w `app.ts` drugim `.route('/contexts', …)`. Dodaj na chwilę `console.count('session check')` na początku `requireAuth` i uruchom jeden test: `pnpm --filter @one-place/api exec vitest run test/widgets.test.ts -t "returns only the widgets" --silent=false`. **Oczekiwany wynik:** licznik dochodzi do 8, choć test wysyła 5 żądań z tokenem. Zastanów się, skąd różnica, zanim otworzysz wyjaśnienie.
- [x] **5. Poprawka.** Dopisz w `require-auth.ts` typ `AuthEnv`. `contextWidgetsRoutes({ db })` zwraca `new Hono<AuthEnv>()` bez `requireAuth`, a `contextsRoutes` podłącza go na końcu łańcucha: `.route('/', contextWidgetsRoutes({ db }))`. Usuń drugi `.route('/contexts', …)` z `app.ts`. Licznik pokazuje 5. Usuń `console.count`.
- [x] **6. Zielone testy.** Oczekiwany wynik: **PASS (64 testy w pakiecie API)**.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(api): add widget list and idempotent create`.

**Pułapki (sprawdzone na prototypie):**

- **Najpierw istniejące ID, potem kontekst i limit.** Ta sama kolejność co przy kontekstach i z tego samego powodu: ponowienie musi znaleźć rekord, który już powstał. Zamiana kolejności zepsułaby ostatnią asercję testu limitu.
- **Cudzy kontekst sprawdza osobne zapytanie.** Sam filtr po `user_id` dałby dla cudzego i nieistniejącego kontekstu odpowiedź 200 z pustą listą. Klient wziąłby ją za pusty pulpit, a architektura wymaga 404 dla każdego zasobu, którego użytkownik nie może zobaczyć.
- **`c.req.valid('json')` to wynik `transform`.** Trasa dostaje dane po `transform` z zadania 1, więc `input.config` ma już wartości domyślne i do bazy trafia pełna konfiguracja. Typ wejścia serwisu to dlatego `z.output<typeof CreateWidgetSchema>`, a nie `CreateWidgetInput`.
- **`Hono<AuthEnv>` to obietnica.** Typ mówi, że `c.var.user` istnieje, ale router sam go nie ustawia. Dlatego `contextWidgetsRoutes` nie przyjmuje `auth` i ma komentarz, że działa tylko za `requireAuth` z `contextsRoutes`.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 4)</summary>

- `.use(requireAuth(auth))` w routerze podłączonym pod `/contexts` rejestruje middleware dla wzorca `/api/contexts/*`. Ten wzorzec pasuje także do `/api/contexts/:id/widgets`.
- Hono wykonuje wszystkie pasujące middleware w kolejności rejestracji. Żądanie do widgetów przechodzi więc przez `requireAuth` z `contextsRoutes`, a potem przez `requireAuth` z drugiego routera. Każde z nich woła `auth.api.getSession`, czyli zapytanie do bazy.
- W teście trzy żądania idą do tras widgetów (dwa `POST` i `GET`), więc licznik pokazuje 2 + 3 × 2 = 8. Nic nie działa źle, ale każde żądanie do widgetów kosztuje dwa zapytania o sesję.
- Router zagnieżdżony przez `.route('/', …)` wewnątrz `contextsRoutes` dziedziczy jego `requireAuth`, więc sesja jest sprawdzana raz. `Hono<AuthEnv>` daje mu typ `c.var.user` bez własnego middleware.

</details>

<details>
<summary>Podpowiedź</summary>

- `AuthEnv` to `{ Variables: { user: SessionUser } }`, czyli dokładnie to, co dotąd było generykiem `createMiddleware` w `requireAuth`.
- `assertOwnContext`: `db.select({ id: contexts.id }).from(contexts).where(ownContext(userId, contextId))`, a przy braku wiersza `throw contextNotFound()`.
- Licznik widgetów kontekstu: `db.$count(widgets, eq(widgets.contextId, contextId))`.
- W teście nieznanego typu TypeScript nie przepuści `type: 'notes'`. Wystarczy `'notes' as 'todo'`: test i tak sprawdza, co zrobi API.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/test/fixtures.ts` (nowy import typu i nowa funkcja)

```ts
import type { CreateContextInput, CreateWidgetInput } from '@one-place/shared'

// …

export function widgetInput(overrides: Partial<CreateWidgetInput> = {}): CreateWidgetInput {
  return { id: randomUUID(), type: 'todo', config: {}, x: 0, y: 0, w: 4, h: 6, ...overrides }
}
```

`apps/api/test/widgets.test.ts` (stan po tym zadaniu; zadania 4 i 5 dopiszą kolejne bloki)

```ts
import { MAX_WIDGETS_PER_CONTEXT } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { asUser, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'
import { contextInput, widgetInput } from './fixtures'

const contextNotFound = { error: { code: 'NOT_FOUND', message: 'Context not found' } }

async function setup() {
  const { app, client } = await createTestApp()
  const alice = asUser(app, await signUp(app))
  const bob = asUser(app, await signUp(app, { ...TEST_USER, email: 'bob@example.com' }))
  const context = contextInput()
  await alice.post('/api/contexts', context)
  return { app, client, alice, bob, contextId: context.id }
}

describe('GET /api/contexts/:id/widgets', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/contexts/${contextInput().id}/widgets`)
    expect(res.status).toBe(401)
  })

  it('returns only the widgets of the given context', async () => {
    const { alice, contextId } = await setup()
    const other = contextInput()
    await alice.post('/api/contexts', other)
    const widget = widgetInput()
    await alice.post(`/api/contexts/${contextId}/widgets`, widget)
    await alice.post(`/api/contexts/${other.id}/widgets`, widgetInput())
    const res = await alice.get(`/api/contexts/${contextId}/widgets`)
    expect(res.status).toBe(200)
    expect((await res.json()).map((item: { id: string }) => item.id)).toEqual([widget.id])
  })

  it("returns 404 for another user's context", async () => {
    const { bob, contextId } = await setup()
    const res = await bob.get(`/api/contexts/${contextId}/widgets`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(contextNotFound)
  })
})

describe('POST /api/contexts/:id/widgets', () => {
  it('creates a widget with the default config and returns it with 201', async () => {
    const { alice, contextId } = await setup()
    const input = widgetInput({ x: 4, y: 2 })
    const res = await alice.post(`/api/contexts/${contextId}/widgets`, input)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      id: input.id,
      contextId,
      type: 'todo',
      config: { title: '', hideCompleted: false, source: { type: 'local' } },
      x: 4,
      y: 2,
      w: 4,
      h: 6,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      version: 1,
    })
  })

  it('returns the existing widget with 200 when the request is retried', async () => {
    const { alice, contextId } = await setup()
    const input = widgetInput()
    const first = await (await alice.post(`/api/contexts/${contextId}/widgets`, input)).json()
    const retry = await alice.post(`/api/contexts/${contextId}/widgets`, input)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toEqual(first)
    expect(await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()).toHaveLength(1)
  })

  it('returns 409 when the id belongs to another user', async () => {
    const { alice, bob, contextId } = await setup()
    const input = widgetInput()
    await alice.post(`/api/contexts/${contextId}/widgets`, input)
    const bobsContext = contextInput()
    await bob.post('/api/contexts', bobsContext)
    const res = await bob.post(`/api/contexts/${bobsContext.id}/widgets`, input)
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('ID_CONFLICT')
  })

  it("returns 404 for another user's context", async () => {
    const { bob, contextId } = await setup()
    const res = await bob.post(`/api/contexts/${contextId}/widgets`, widgetInput())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(contextNotFound)
  })

  it('rejects an unknown type, an invalid config and a widget outside the grid', async () => {
    const { alice, contextId } = await setup()
    const path = `/api/contexts/${contextId}/widgets`
    for (const input of [
      widgetInput({ type: 'notes' as 'todo' }),
      widgetInput({ config: { title: 'a'.repeat(61) } }),
      widgetInput({ x: 10, w: 4 }),
    ]) {
      const res = await alice.post(path, input)
      expect(res.status).toBe(400)
      expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
    }
  })

  it(`allows at most ${MAX_WIDGETS_PER_CONTEXT} widgets in a context`, async () => {
    const { alice, contextId } = await setup()
    const path = `/api/contexts/${contextId}/widgets`
    const inputs = Array.from({ length: MAX_WIDGETS_PER_CONTEXT }, () => widgetInput())
    for (const input of inputs) await alice.post(path, input)
    const res = await alice.post(path, widgetInput())
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('LIMIT_EXCEEDED')
    expect((await alice.post(path, inputs[0])).status).toBe(200)
  })
})

describe('DELETE /api/contexts/:id', () => {
  it('deletes the widgets of the context', async () => {
    const { client, alice, contextId } = await setup()
    await alice.post(`/api/contexts/${contextId}/widgets`, widgetInput())
    await alice.delete(`/api/contexts/${contextId}`)
    const { rows } = await client.query('select id from widgets')
    expect(rows).toEqual([])
  })
})
```

`apps/api/src/middleware/require-auth.ts`

```ts
import { createMiddleware } from 'hono/factory'
import type { Auth } from '../auth'
import { AppError } from '../lib/errors'

export type SessionUser = Auth['$Infer']['Session']['user']

// The variables requireAuth sets. A router mounted behind requireAuth can declare them
// with `new Hono<AuthEnv>()`.
export type AuthEnv = { Variables: { user: SessionUser } }

export function requireAuth(auth: Auth) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    c.set('user', session.user)
    await next()
  })
}
```

`apps/api/src/modules/contexts/service.ts` (dwie funkcje dostają `export`)

```ts
export function contextNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Context not found')
}

export function ownContext(userId: string, id: string) {
  return and(eq(contexts.id, id), eq(contexts.userId, userId))
}
```

`apps/api/src/modules/widgets/service.ts` (stan po tym zadaniu)

```ts
import { type CreateWidgetSchema, MAX_WIDGETS_PER_CONTEXT, type WidgetDto } from '@one-place/shared'
import { and, asc, eq } from 'drizzle-orm'
import type { z } from 'zod'
import type { Database } from '../../db/client'
import { contexts, widgets } from '../../db/schema'
import { AppError } from '../../lib/errors'
import { contextNotFound, ownContext } from '../contexts/service'

// The parsed input: the config is already checked with the schema of its type
type CreateWidgetData = z.output<typeof CreateWidgetSchema>

function toWidgetDto(row: typeof widgets.$inferSelect): WidgetDto {
  return {
    id: row.id,
    contextId: row.contextId,
    type: row.type,
    config: row.config,
    x: row.x,
    y: row.y,
    w: row.w,
    h: row.h,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  }
}

async function assertOwnContext(db: Database, userId: string, contextId: string) {
  const [context] = await db
    .select({ id: contexts.id })
    .from(contexts)
    .where(ownContext(userId, contextId))
  if (!context) throw contextNotFound()
}

export async function listWidgets(
  db: Database,
  userId: string,
  contextId: string,
): Promise<WidgetDto[]> {
  await assertOwnContext(db, userId, contextId)
  const rows = await db
    .select()
    .from(widgets)
    .where(and(eq(widgets.contextId, contextId), eq(widgets.userId, userId)))
    .orderBy(asc(widgets.y), asc(widgets.x), asc(widgets.id))
  return rows.map(toWidgetDto)
}

export async function createWidget(
  db: Database,
  userId: string,
  contextId: string,
  input: CreateWidgetData,
): Promise<{ widget: WidgetDto; created: boolean }> {
  // The same order as for contexts: a retry finds its record before any other check
  const [existing] = await db.select().from(widgets).where(eq(widgets.id, input.id))
  if (existing) {
    if (existing.userId !== userId) {
      throw new AppError(409, 'ID_CONFLICT', 'This id is already used by another record')
    }
    return { widget: toWidgetDto(existing), created: false }
  }
  await assertOwnContext(db, userId, contextId)
  const count = await db.$count(widgets, eq(widgets.contextId, contextId))
  if (count >= MAX_WIDGETS_PER_CONTEXT) {
    throw new AppError(
      422,
      'LIMIT_EXCEEDED',
      `A context can have at most ${MAX_WIDGETS_PER_CONTEXT} widgets`,
    )
  }
  const [row] = await db
    .insert(widgets)
    .values({ ...input, userId, contextId })
    .returning()
  return { widget: toWidgetDto(row!), created: true }
}
```

`apps/api/src/modules/widgets/routes.ts` (stan po tym zadaniu)

```ts
import { CreateWidgetSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import type { AuthEnv } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createWidget, listWidgets } from './service'

// /api/contexts/:id/widgets. Mounted inside contextsRoutes, behind its requireAuth, so the
// session is checked once per request.
export function contextWidgetsRoutes({ db }: Pick<ModuleDeps, 'db'>) {
  return new Hono<AuthEnv>()
    .get('/:id/widgets', validate('param', IdParamSchema), async (c) =>
      c.json(await listWidgets(db, c.var.user.id, c.req.valid('param').id)),
    )
    .post(
      '/:id/widgets',
      validate('param', IdParamSchema),
      validate('json', CreateWidgetSchema),
      async (c) => {
        const { id: contextId } = c.req.valid('param')
        const { widget, created } = await createWidget(
          db,
          c.var.user.id,
          contextId,
          c.req.valid('json'),
        )
        return c.json(widget, created ? 201 : 200)
      },
    )
}
```

`apps/api/src/modules/contexts/routes.ts` (nowy import i nowa linia na końcu łańcucha)

```ts
import { contextWidgetsRoutes } from '../widgets/routes'

// …
    .delete('/:id', validate('param', IdParamSchema), async (c) => {
      await deleteContext(db, c.var.user.id, c.req.valid('param').id)
      return c.body(null, 204)
    })
    .route('/', contextWidgetsRoutes({ db }))
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego test 401 przeszedł, zanim powstały trasy widgetów?** `requireAuth` z `contextsRoutes` działa dla każdej ścieżki pod `/api/contexts/*`, także nieistniejącej. Żądanie bez tokenu kończy się na nim, zanim Hono sprawdzi, czy trasa istnieje.
2. **Czy klient `hc` w rozszerzeniu zobaczy `api.contexts[':id'].widgets`?** Tak. `.route('/', …)` jest w łańcuchu `contextsRoutes`, a ten w łańcuchu `app.ts`, więc typ `AppType` niesie zagnieżdżone trasy. To samo wymaganie co przy `settingsRoutes` w Etapie 2.
3. **Po co sortować listę, skoro siatka i tak ustawia widgety po `x` i `y`?** Stała kolejność daje powtarzalne testy i ten sam porządek w cache na każdym urządzeniu. Widok jednokolumnowy i tak sortuje po swojemu (zadanie 7).

</details>

---

## Zadanie 4: zmiana konfiguracji i usuwanie widgetu

**Cel:** `PATCH /api/widgets/:id` zastępuje konfigurację i sprawdza ją schematem typu zapisanego w bazie, a `DELETE /api/widgets/:id` usuwa widget. Cudzy widget daje 404 (F-WGT-03, F-WGT-04).

**Czego się nauczysz:** walidacja, która zależy od danych w bazie, `ZodError` rzucony z serwisu, drugi router modułu.

**Pliki:**

- Zmień: `apps/api/src/modules/widgets/service.ts`, `apps/api/src/modules/widgets/routes.ts`, `apps/api/src/app.ts`
- Test: `apps/api/test/widgets.test.ts`

**Interfejsy:**

- Korzysta z: `UpdateWidgetSchema`, `widgetConfigSchemas`, `isWidgetType` (zadanie 1).
- Wytwarza: `widgetsRoutes({ db, auth })`, trasy `PATCH` i `DELETE /api/widgets/:id`. Rozszerzenie korzysta z nich w zadaniach 6 i 13.

**Kroki:**

- [x] **1. Czerwone testy** (nowe bloki w `test/widgets.test.ts`, z pomocnikiem `setupWithWidget()`):
  - `PATCH` i `DELETE` bez tokenu dają 401;
  - `PATCH { config: { title: '  Zakupy  ' } }` daje 200, konfigurację `{ title: 'Zakupy', hideCompleted: false, source: { type: 'local' } }`, niezmienione `x` i `w` oraz `version: 2`;
  - `PATCH` cudzego widgetu daje 404 z treścią `{ error: { code: 'NOT_FOUND', message: 'Widget not found' } }`, a widget Alicji się nie zmienia;
  - `PATCH { config: { title: 123 } }` i `PATCH /api/widgets/42` dają 400;
  - `DELETE` daje 204, lista jest pusta, a drugi `DELETE` daje 404;
  - `DELETE` cudzego widgetu daje 404 jak wyżej, a widget zostaje.

  Oczekiwany wynik: **FAIL wszystkich siedmiu**. Tym razem także 401, bo pod `/api/widgets` nie ma jeszcze żadnego routera z `requireAuth`.

- [x] **2. Eksperyment: zapis bez walidacji typu.** Napisz `updateWidgetConfig(db, userId, id, input)`, który od razu robi `update … set({ config: input.config, … })` z warunkiem właściciela, oraz `deleteWidget`. Dodaj `widgetsRoutes` (`.use(requireAuth(auth))`, `PATCH` i `DELETE` pod `/:id`) i podłącz go w `app.ts` jako `.route('/widgets', …)`. **Oczekiwany wynik: FAIL dwóch testów:** konfiguracja nie jest przycięta ani uzupełniona, a `{ title: 123 }` daje 200 zamiast 400.
- [x] **3. Poprawka.** Serwis najpierw czyta typ widgetu (z warunkiem właściciela, brak wiersza to 404), potem sprawdza konfigurację schematem tego typu (`parseConfig`) i dopiero zapisuje. `parse()` rzuca `ZodError`, który `handleError` zamienia na 400.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (71 testów w pakiecie API)**.
- [x] **5.** `pnpm format && pnpm check`, potem commit: `feat(api): add widget config update and delete`.

**Pułapki (sprawdzone na prototypie):**

- **Trasa nie może sprawdzić konfiguracji.** W żądaniu jest tylko `config`, a schemat zależy od typu zapisanego w bazie. Bez sprawdzenia w serwisie każdy klient mógłby zapisać dowolny JSON, a rozszerzenie musiałoby się przed nim bronić przy każdym odczycie.
- **Dwa zapytania i okno między nimi.** Widget może zniknąć między odczytem typu a zapisem (np. usunięty na innym urządzeniu). `update … returning()` z warunkiem właściciela zwróci wtedy pustą listę, którą serwis zamienia na 404.
- **Typ spoza `WIDGET_TYPES` w bazie.** Gdyby kiedyś typ wycofano, jego widgety zostaną w bazie. `parseConfig` odpowiada wtedy 400 zamiast rzucać nieobsłużony wyjątek przy `widgetConfigSchemas[type]`.

<details>
<summary>Podpowiedź</summary>

- Odczyt typu: `db.select({ type: widgets.type }).from(widgets).where(ownWidget(userId, id))`, gdzie `ownWidget` to `and(eq(widgets.id, id), eq(widgets.userId, userId))`.
- `widgetConfigSchemas[type].parse(config)` wymaga, żeby `type` był typu `WidgetType`. Zawężysz go przez `isWidgetType(type)`.
- `widgetsRoutes` wygląda jak `settingsRoutes` z Etapu 2: własny `new Hono().use(requireAuth(auth))`, bo ścieżka `/api/widgets` nie leży pod `/api/contexts`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/test/widgets.test.ts` (nowe bloki na końcu pliku)

```ts
const widgetNotFound = { error: { code: 'NOT_FOUND', message: 'Widget not found' } }

async function setupWithWidget() {
  const result = await setup()
  const widget = widgetInput()
  await result.alice.post(`/api/contexts/${result.contextId}/widgets`, widget)
  return { ...result, widgetId: widget.id }
}

describe('PATCH /api/widgets/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/widgets/${widgetInput().id}`, { method: 'PATCH' })
    expect(res.status).toBe(401)
  })

  it('replaces the config and increments the version', async () => {
    const { alice, widgetId } = await setupWithWidget()
    const res = await alice.patch(`/api/widgets/${widgetId}`, { config: { title: '  Zakupy  ' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      id: widgetId,
      config: { title: 'Zakupy', hideCompleted: false, source: { type: 'local' } },
      x: 0,
      w: 4,
      version: 2,
    })
  })

  it("returns 404 for another user's widget and leaves it unchanged", async () => {
    const { alice, bob, contextId, widgetId } = await setupWithWidget()
    const res = await bob.patch(`/api/widgets/${widgetId}`, { config: { title: 'Hacked' } })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(widgetNotFound)
    const [widget] = await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()
    expect(widget.config.title).toBe('')
  })

  it('rejects a config that does not match the type and an id that is not a UUID', async () => {
    const { alice, widgetId } = await setupWithWidget()
    const invalid = await alice.patch(`/api/widgets/${widgetId}`, { config: { title: 123 } })
    expect(invalid.status).toBe(400)
    expect((await invalid.json()).error.code).toBe('VALIDATION_ERROR')
    expect((await alice.patch('/api/widgets/42', { config: {} })).status).toBe(400)
  })
})

describe('DELETE /api/widgets/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/widgets/${widgetInput().id}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('deletes the widget', async () => {
    const { alice, contextId, widgetId } = await setupWithWidget()
    expect((await alice.delete(`/api/widgets/${widgetId}`)).status).toBe(204)
    expect(await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()).toEqual([])
    expect((await alice.delete(`/api/widgets/${widgetId}`)).status).toBe(404)
  })

  it("returns 404 for another user's widget and keeps it", async () => {
    const { alice, bob, contextId, widgetId } = await setupWithWidget()
    const res = await bob.delete(`/api/widgets/${widgetId}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(widgetNotFound)
    expect(await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()).toHaveLength(1)
  })
})
```

`apps/api/src/modules/widgets/service.ts` (nowe importy i nowe funkcje na końcu pliku)

```ts
import {
  type CreateWidgetSchema,
  isWidgetType,
  MAX_WIDGETS_PER_CONTEXT,
  type UpdateWidgetInput,
  widgetConfigSchemas,
  type WidgetDto,
} from '@one-place/shared'
import { and, asc, eq, sql } from 'drizzle-orm'

// …

// Another user's widget gives the same answer as a missing one
function widgetNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Widget not found')
}

function ownWidget(userId: string, id: string) {
  return and(eq(widgets.id, id), eq(widgets.userId, userId))
}

// The schema depends on the type saved in the database, so the route cannot check the config.
// parse() throws a ZodError, which handleError turns into 400 VALIDATION_ERROR.
function parseConfig(type: string, config: unknown) {
  if (!isWidgetType(type)) {
    throw new AppError(400, 'VALIDATION_ERROR', `Widgets of type ${type} have no config`)
  }
  return widgetConfigSchemas[type].parse(config)
}

export async function updateWidgetConfig(
  db: Database,
  userId: string,
  id: string,
  input: UpdateWidgetInput,
): Promise<WidgetDto> {
  const [existing] = await db
    .select({ type: widgets.type })
    .from(widgets)
    .where(ownWidget(userId, id))
  if (!existing) throw widgetNotFound()
  const [row] = await db
    .update(widgets)
    .set({
      config: parseConfig(existing.type, input.config),
      updatedAt: sql`now()`,
      version: sql`${widgets.version} + 1`,
    })
    .where(ownWidget(userId, id))
    .returning()
  // Deleted between the two queries, e.g. on another device
  if (!row) throw widgetNotFound()
  return toWidgetDto(row)
}

export async function deleteWidget(db: Database, userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(widgets)
    .where(ownWidget(userId, id))
    .returning({ id: widgets.id })
  if (deleted.length === 0) throw widgetNotFound()
}
```

`apps/api/src/modules/widgets/routes.ts` (nowe importy i nowy router na końcu pliku)

```ts
import { CreateWidgetSchema, UpdateWidgetSchema } from '@one-place/shared'
import { type AuthEnv, requireAuth } from '../../middleware/require-auth'
import { createWidget, deleteWidget, listWidgets, updateWidgetConfig } from './service'

// …

// /api/widgets/:id
export function widgetsRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .patch(
      '/:id',
      validate('param', IdParamSchema),
      validate('json', UpdateWidgetSchema),
      async (c) => {
        const { id } = c.req.valid('param')
        return c.json(await updateWidgetConfig(db, c.var.user.id, id, c.req.valid('json')))
      },
    )
    .delete('/:id', validate('param', IdParamSchema), async (c) => {
      await deleteWidget(db, c.var.user.id, c.req.valid('param').id)
      return c.body(null, 204)
    })
}
```

`apps/api/src/app.ts` (nowy import i nowa linia w łańcuchu)

```ts
import { widgetsRoutes } from './modules/widgets/routes'

// …
    .route('/contexts', contextsRoutes({ db, auth }))
    .route('/widgets', widgetsRoutes({ db, auth }))
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego `PATCH` zastępuje całą konfigurację, a nie scala pól?** Konfiguracja jest małym obiektem, który zawsze sprawdza schemat typu. Cała konfiguracja w żądaniu daje jeden przypadek do walidacji i jedną regułę konfliktów: ostatni zapis wygrywa (F-SYNC-06).
2. **Skąd 400 w odpowiedzi, skoro walidacja jest w serwisie, a nie w trasie?** Serwis rzuca `ZodError`, a globalny `handleError` z Etapu 2 zamienia go na `VALIDATION_ERROR`. Miejsce walidacji nie zmienia formatu błędu.
3. **Czy usunięcie widgetu usunie też jego zadania?** W Etapie 4 tabela `todo_items` dostanie klucz obcy do `widgets.id` z kaskadą, więc tak. Teraz widget nie ma jeszcze danych.

</details>

---

## Zadanie 5: zapis układu w transakcji

**Cel:** `PUT /api/contexts/:id/layout` zapisuje położenie i rozmiar podanych widgetów jednym żądaniem. Każdy widget musi należeć do tego kontekstu i nie może być mniejszy niż minimum swojego typu. Jeden niepoprawny element odrzuca całe żądanie (`400 LAYOUT_INVALID`) i niczego nie zmienia (F-GRID-04).

**Czego się nauczysz:** `db.transaction()` w Drizzle, wycofanie transakcji przez wyjątek, `update … returning` jako sprawdzenie przynależności.

**Pliki:**

- Zmień: `apps/api/src/modules/widgets/service.ts`, `apps/api/src/modules/widgets/routes.ts`, `apps/api/test/auth-helpers.ts`
- Test: `apps/api/test/widgets.test.ts`

**Interfejsy:**

- Korzysta z: `LayoutSchema`, `LayoutItem`, `WIDGET_SIZES` (zadanie 1), `listWidgets` (zadanie 3).
- Wytwarza: `saveLayout(db, userId, contextId, items)`, trasę `PUT /api/contexts/:id/layout`, która zwraca wszystkie widgety kontekstu, i metodę `put` w `asUser`. Rozszerzenie korzysta z niej w zadaniach 6 i 12.

**Kroki:**

- [x] **1. Pomocnik.** Dodaj `put` do obiektu zwracanego przez `asUser` w `test/auth-helpers.ts`.
- [x] **2. Czerwone testy** (nowy blok z pomocnikiem `setupWithTwoWidgets()`: widgety w `(0, 0)` i `(4, 0)`):
  - `PUT` bez tokenu daje 401;
  - `PUT [{ id: pierwszy, x: 0, y: 6, w: 6, h: 4 }]` daje 200 i listę wszystkich widgetów: pierwszy ma nowe pole i `version: 2`, drugi stare pole i `version: 1`;
  - `PUT` Boba do kontekstu Alicji daje 404 z `Context not found`;
  - lista z poprawnym pierwszym widgetem i widgetem z innego kontekstu Alicji daje 400 `LAYOUT_INVALID`, a pierwszy widget ma nadal `y: 0` i `version: 1`;
  - `w: 2` dla widgetu `todo` daje 400 `LAYOUT_INVALID`;
  - ten sam widget dwa razy i `x: 10, w: 4` dają 400 `VALIDATION_ERROR`.

  Oczekiwany wynik: **FAIL pięciu testów** (401 przechodzi z tego samego powodu co w zadaniu 3).

- [x] **3. Implementacja.** `saveLayout`: sprawdzenie kontekstu, potem w `db.transaction(async (tx) => …)` dla każdego elementu `update` z warunkiem `id`, `context_id` i `user_id` oraz `returning({ type })`. Brak wiersza albo za mały rozmiar to wyjątek `LAYOUT_INVALID`. Na końcu `listWidgets`. Trasa: `.put('/:id/layout', validate('param', …), validate('json', LayoutSchema), …)` w `contextWidgetsRoutes`.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (77 testów w pakiecie API)**.
- [x] **5. Eksperyment: bez transakcji.** Zamień na chwilę `db.transaction(async (tx) => { … })` na wywołanie tej samej pętli z `db` zamiast `tx`. Oczekiwany wynik: test „changes nothing…” **FAIL** z `"y": 6, "version": 2`. Pierwszy widget został zapisany, zanim drugi element zgłosił błąd. Przywróć transakcję.
- [x] **6.** `pnpm format && pnpm check`, potem commit: `feat(api): save the widget layout in a transaction`.

**Pułapki (sprawdzone na prototypie):**

- **Wyjątek wycofuje transakcję.** Drizzle wykonuje `ROLLBACK`, gdy funkcja przekazana do `transaction` rzuci wyjątek, i przekazuje go dalej. `handleError` zamienia `AppError` na odpowiedź 400, tak jak poza transakcją.
- **Sprawdzenie przynależności w `WHERE`.** `update` z warunkiem `context_id` i `user_id` zwraca pusty wynik dla widgetu z innego kontekstu albo innego użytkownika. Nie trzeba osobnego zapytania, które zostawiałoby okno między sprawdzeniem a zapisem.
- **Widgety spoza listy zostają.** Rozszerzenie wysyła tylko to, co się zmieniło (zadanie 12). Brak widgetu na liście nie znaczy „usuń”.
- **Ograniczenia ze schematu też obowiązują.** Duplikat ID i element poza siatką odrzuca `LayoutSchema`, zanim żądanie dotrze do serwisu, więc kod błędu to `VALIDATION_ERROR`, a nie `LAYOUT_INVALID`.

<details>
<summary>Podpowiedź</summary>

- `db.transaction(async (tx) => { … })`: wewnątrz używaj `tx` zamiast `db`, inaczej zapytanie pójdzie poza transakcją.
- Minimalny rozmiar: `WIDGET_SIZES[type].min`, po zawężeniu `type` przez `isWidgetType`. Nieznany typ nie ma minimum.
- `for (const { id, ...rect } of items)` daje osobno ID i pola do `set()`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/test/auth-helpers.ts` (nowa linia w `asUser`)

```ts
    put: (path: string, body: unknown) => send('PUT', path, body),
```

`apps/api/test/widgets.test.ts` (nowy blok na końcu pliku)

```ts
describe('PUT /api/contexts/:id/layout', () => {
  async function setupWithTwoWidgets() {
    const result = await setup()
    const first = widgetInput({ x: 0, y: 0 })
    const second = widgetInput({ x: 4, y: 0 })
    await result.alice.post(`/api/contexts/${result.contextId}/widgets`, first)
    await result.alice.post(`/api/contexts/${result.contextId}/widgets`, second)
    return { ...result, first, second }
  }

  function layoutPath(contextId: string) {
    return `/api/contexts/${contextId}/layout`
  }

  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(layoutPath(contextInput().id), { method: 'PUT' })
    expect(res.status).toBe(401)
  })

  it('moves and resizes the given widgets and keeps the others', async () => {
    const { alice, contextId, first, second } = await setupWithTwoWidgets()
    const res = await alice.put(layoutPath(contextId), [{ id: first.id, x: 0, y: 6, w: 6, h: 4 }])
    expect(res.status).toBe(200)
    const byId = Object.fromEntries(
      (await res.json()).map((widget: { id: string }) => [widget.id, widget]),
    )
    expect(byId[first.id]).toMatchObject({ x: 0, y: 6, w: 6, h: 4, version: 2 })
    expect(byId[second.id]).toMatchObject({ x: 4, y: 0, w: 4, h: 6, version: 1 })
  })

  it("returns 404 for another user's context", async () => {
    const { bob, contextId, first } = await setupWithTwoWidgets()
    const res = await bob.put(layoutPath(contextId), [{ id: first.id, x: 0, y: 0, w: 4, h: 6 }])
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(contextNotFound)
  })

  it('changes nothing when one widget is from another context', async () => {
    const { alice, contextId, first } = await setupWithTwoWidgets()
    const other = contextInput()
    await alice.post('/api/contexts', other)
    const stranger = widgetInput()
    await alice.post(`/api/contexts/${other.id}/widgets`, stranger)
    const res = await alice.put(layoutPath(contextId), [
      { id: first.id, x: 0, y: 6, w: 4, h: 6 },
      { id: stranger.id, x: 4, y: 6, w: 4, h: 6 },
    ])
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('LAYOUT_INVALID')
    const widgets = await (await alice.get(`/api/contexts/${contextId}/widgets`)).json()
    expect(widgets.find((widget: { id: string }) => widget.id === first.id)).toMatchObject({
      y: 0,
      version: 1,
    })
  })

  it('rejects a widget smaller than the minimum size of its type', async () => {
    const { alice, contextId, first } = await setupWithTwoWidgets()
    const res = await alice.put(layoutPath(contextId), [{ id: first.id, x: 0, y: 0, w: 2, h: 6 }])
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('LAYOUT_INVALID')
  })

  it('rejects the same widget twice and widgets outside the grid', async () => {
    const { alice, contextId, first } = await setupWithTwoWidgets()
    const item = { id: first.id, x: 0, y: 0, w: 4, h: 6 }
    for (const layout of [[item, { ...item, y: 6 }], [{ ...item, x: 10 }]]) {
      const res = await alice.put(layoutPath(contextId), layout)
      expect(res.status).toBe(400)
      expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
    }
  })
})
```

`apps/api/src/modules/widgets/service.ts` (nowe importy i nowe funkcje na końcu pliku)

```ts
import {
  type CreateWidgetSchema,
  isWidgetType,
  type LayoutItem,
  MAX_WIDGETS_PER_CONTEXT,
  type UpdateWidgetInput,
  WIDGET_SIZES,
  widgetConfigSchemas,
  type WidgetDto,
} from '@one-place/shared'

// …

function layoutInvalid(message: string) {
  return new AppError(400, 'LAYOUT_INVALID', message)
}

function isTooSmall(type: string, item: LayoutItem) {
  if (!isWidgetType(type)) return false
  const { min } = WIDGET_SIZES[type]
  return item.w < min.w || item.h < min.h
}

// F-GRID-04: one request saves the whole drag or resize. Widgets missing from the list keep
// their place. One invalid item rejects the whole layout, so the transaction undoes the
// updates made before it.
export async function saveLayout(
  db: Database,
  userId: string,
  contextId: string,
  items: LayoutItem[],
): Promise<WidgetDto[]> {
  await assertOwnContext(db, userId, contextId)
  await db.transaction(async (tx) => {
    for (const { id, ...rect } of items) {
      const [row] = await tx
        .update(widgets)
        .set({ ...rect, updatedAt: sql`now()`, version: sql`${widgets.version} + 1` })
        .where(
          and(eq(widgets.id, id), eq(widgets.contextId, contextId), eq(widgets.userId, userId)),
        )
        .returning({ type: widgets.type })
      if (!row) throw layoutInvalid(`Widget ${id} does not belong to this context`)
      if (isTooSmall(row.type, { id, ...rect })) {
        throw layoutInvalid(`Widget ${id} is smaller than the minimum size of its type`)
      }
    }
  })
  return listWidgets(db, userId, contextId)
}
```

`apps/api/src/modules/widgets/routes.ts` (ostateczny)

```ts
import { CreateWidgetSchema, LayoutSchema, UpdateWidgetSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import { type AuthEnv, requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createWidget, deleteWidget, listWidgets, saveLayout, updateWidgetConfig } from './service'

// /api/contexts/:id/widgets and /api/contexts/:id/layout. Mounted inside contextsRoutes, behind
// its requireAuth, so the session is checked once per request.
export function contextWidgetsRoutes({ db }: Pick<ModuleDeps, 'db'>) {
  return new Hono<AuthEnv>()
    .get('/:id/widgets', validate('param', IdParamSchema), async (c) =>
      c.json(await listWidgets(db, c.var.user.id, c.req.valid('param').id)),
    )
    .post(
      '/:id/widgets',
      validate('param', IdParamSchema),
      validate('json', CreateWidgetSchema),
      async (c) => {
        const { id: contextId } = c.req.valid('param')
        const { widget, created } = await createWidget(
          db,
          c.var.user.id,
          contextId,
          c.req.valid('json'),
        )
        return c.json(widget, created ? 201 : 200)
      },
    )
    .put(
      '/:id/layout',
      validate('param', IdParamSchema),
      validate('json', LayoutSchema),
      async (c) => {
        const { id: contextId } = c.req.valid('param')
        return c.json(await saveLayout(db, c.var.user.id, contextId, c.req.valid('json')))
      },
    )
}

// /api/widgets/:id
export function widgetsRoutes({ db, auth }: ModuleDeps) {
  // … bez zmian (zadanie 4)
}
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Po co transakcja, skoro błąd przerywa pętlę?** Przerwanie pętli nie cofa zapisów, które już się wykonały. Bez transakcji pierwszy widget zostałby przesunięty, a klient dostałby 400 i cofnąłby zmianę u siebie. Baza i cache rozjechałyby się po cichu.
2. **Dlaczego trasa zwraca wszystkie widgety kontekstu, a nie tylko zmienione?** Klient podmienia nimi cały wpis `['widgets', contextId]` w cache. Dostaje przy okazji zmiany z innych urządzeń, np. widget dodany w międzyczasie.
3. **Co się stanie, gdy dwa urządzenia jednocześnie zapiszą różne układy?** Każde żądanie jest osobną transakcją, więc wygrywa późniejsza, rekord po rekordzie (F-SYNC-06). Widgety mogą wtedy na siebie nachodzić, ale siatka w rozszerzeniu je rozsunie (zadanie 7).

</details>

---

## Zadanie 6: `useWidgets()` i mutacje widgetów

**Cel:** widgety kontekstu pochodzą z jednego zapytania z kluczem `['widgets', contextId]`, a dodawanie, zmiana konfiguracji, usuwanie i zapis układu są optymistyczne (F-SYNC-04). Po usunięciu kontekstu jego widgety znikają z cache.

**Czego się nauczysz:** reaktywny klucz zapytania (`computed` i `toValue`), `enabled`, mutacje, które znają klucz z danych wejściowych, `removeQueries`.

**Pliki:**

- Utwórz: `apps/extension/src/queries/widgets.ts`
- Zmień: `apps/extension/src/queries/contexts.ts`
- Test: `apps/extension/src/queries/widgets.test.ts`, `apps/extension/src/queries/contexts.test.ts`

**Interfejsy:**

- Korzysta z: `WidgetDto`, `CreateWidgetInput`, `LayoutItem`, `UpdateWidgetInput` (zadanie 1), tras API (zadania 3–5), `changeOptimistically`, `withQueryClient`, `jsonResponse`, `deferred` (Etap 2).
- Wytwarza: `widgetsKey(contextId)`, `useWidgets(contextId)`, `useCreateWidget()` (przyjmuje `{ contextId, ...widget }`), `useUpdateWidgetConfig()` (`{ id, contextId, config }`), `useDeleteWidget()` (`{ id, contextId }`), `useSaveLayout()` (`{ contextId, items }`). Używają ich zadania 10–15.

**Kroki:**

- [x] **1. Czerwone testy** w `src/queries/widgets.test.ts`. `vi.mock('@/api/client', …)` podmienia `contexts[':id'].widgets.$post`, `contexts[':id'].layout.$put` oraz `widgets[':id'].$patch` i `$delete`. W cache kontekstu `work` są dwa widgety, `tasks` i `shopping`:
  - nowy widget jest w cache, zanim API odpowie, a po odpowiedzi 201 zostaje podmieniony na rekord z serwera;
  - odpowiedź 422 przywraca `[tasks, shopping]`;
  - zapis układu przesuwa `tasks` od razu, a odpowiedź 400 `LAYOUT_INVALID` przywraca poprzednie położenie;
  - zmiana konfiguracji jest widoczna od razu, a potem zostaje rekord z serwera (przycięty tytuł, `version: 2`);
  - `DELETE` z odpowiedzią 404 usuwa widget z cache i kończy się sukcesem.
- [x] **2. Czerwony test** w `src/queries/contexts.test.ts`: po udanym usunięciu kontekstu `work` w cache nie ma wpisu `widgetsKey('work')`.

  Oczekiwany wynik obu plików: **FAIL**.

- [x] **3. Implementacja** `src/queries/widgets.ts` według wzoru z `contexts.ts`. Każda mutacja dostaje `contextId` w danych wejściowych, bo z niego powstaje klucz cache. `useWidgets` przyjmuje `MaybeRefOrGetter<string | null>`: klucz to `computed`, a `enabled` jest `false`, gdy ID nie ma.
- [x] **4. Sprzątanie.** W `useDeleteContext` dodaj `onSuccess`, który woła `queryClient.removeQueries({ queryKey: widgetsKey(id) })`.
- [x] **5. Zielone testy.** Oczekiwany wynik: **PASS (53 testy w rozszerzeniu)**.
- [x] **6. Sprawdź, czy test pilnuje sprzątania.** Usuń na chwilę `onSuccess` z `useDeleteContext`. Test „forgets the cached widgets…” **FAIL**. Bez tego widgety usuniętego kontekstu zostałyby w `chrome.storage.local` aż do wylogowania: persister zapisuje każde zapytanie z danymi, a nikt już tego klucza nie odświeży. Przywróć.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(extension): add widget queries with optimistic mutations`.

**Pułapki (sprawdzone na prototypie):**

- **Klucz zapytania musi być reaktywny.** `useWidgets(() => props.context.id)` z kluczem `computed` przełącza zapytanie przy zmianie kontekstu. Klucz policzony raz (`widgetsKey(toValue(contextId))` poza `computed`) zostałby przy pierwszym kontekście.
- **`onSuccess`, a nie `onMutate`, przy sprzątaniu.** Gdy usunięcie kontekstu się nie uda, kontekst wraca na listę. Jego widgety muszą wtedy nadal być w cache.
- **`useSaveLayout` w `onSuccess` podmienia całą listę.** API zwraca wszystkie widgety kontekstu (zadanie 5), więc cache dostaje też zmiany z innych urządzeń.
- **Kolejność w cache nie ma znaczenia dla siatki.** Nowy widget trafia na koniec listy, a siatka i tak ustawia widgety według `x` i `y`. Nie trzeba sortować jak przy kontekstach.

<details>
<summary>Podpowiedź</summary>

- `queryKey: computed(() => widgetsKey(toValue(contextId) ?? ''))` i `enabled: computed(() => toValue(contextId) !== null)`. Pusty tekst w kluczu nigdy nie trafi do API, bo zapytanie jest wtedy wyłączone.
- `queryFn` dostaje klucz w kontekście: `({ queryKey: [, id] }) => …`.
- Wspólne funkcje: `withWidget(list, widget)` podmienia rekord o tym samym `id` albo dopisuje nowy, a `withLayout(list, items)` nakłada `x`, `y`, `w`, `h` z listy na widgety.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/widgets.ts` (stan po tym zadaniu; zadania 10 i 15 go zmienią)

```ts
import type { CreateWidgetInput, LayoutItem, UpdateWidgetInput, WidgetDto } from '@one-place/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { apiErrorInfo } from '@/api/api-error'
import { apiClient } from '@/api/client'
import { changeOptimistically } from './optimistic'

// One cache entry per context, so switching back to a context shows its widgets at once
export function widgetsKey(contextId: string) {
  return ['widgets', contextId] as const
}

interface WidgetRef {
  id: string
  contextId: string
}

// Replaces the widget with the same id, or adds it at the end
function withWidget(list: WidgetDto[], widget: WidgetDto) {
  return list.some((item) => item.id === widget.id)
    ? list.map((item) => (item.id === widget.id ? widget : item))
    : [...list, widget]
}

function withLayout(list: WidgetDto[], items: LayoutItem[]) {
  const byId = new Map(items.map((item) => [item.id, item]))
  return list.map((widget) => {
    const item = byId.get(widget.id)
    return item ? { ...widget, x: item.x, y: item.y, w: item.w, h: item.h } : widget
  })
}

export function useWidgets(contextId: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => widgetsKey(toValue(contextId) ?? '')),
    queryFn: ({ queryKey: [, id] }) =>
      parseResponse(apiClient.api.contexts[':id'].widgets.$get({ param: { id } })),
    enabled: computed(() => toValue(contextId) !== null),
  })
}

export function useCreateWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contextId, ...input }: CreateWidgetInput & { contextId: string }) =>
      parseResponse(
        apiClient.api.contexts[':id'].widgets.$post({ param: { id: contextId }, json: input }),
      ),
    onMutate: ({ contextId, ...input }) => {
      const now = new Date().toISOString()
      const draft: WidgetDto = { ...input, contextId, createdAt: now, updatedAt: now, version: 1 }
      return changeOptimistically<WidgetDto[]>(queryClient, widgetsKey(contextId), (list) =>
        withWidget(list, draft),
      )
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<WidgetDto[]>(widgetsKey(saved.contextId), (list = []) =>
        withWidget(list, saved),
      ),
  })
}

export function useUpdateWidgetConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, config }: WidgetRef & UpdateWidgetInput) =>
      parseResponse(apiClient.api.widgets[':id'].$patch({ param: { id }, json: { config } })),
    onMutate: ({ id, contextId, config }) =>
      changeOptimistically<WidgetDto[]>(queryClient, widgetsKey(contextId), (list) =>
        list.map((item) => (item.id === id ? { ...item, config } : item)),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<WidgetDto[]>(widgetsKey(saved.contextId), (list = []) =>
        withWidget(list, saved),
      ),
  })
}

export function useDeleteWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: WidgetRef) => {
      try {
        await parseResponse(apiClient.api.widgets[':id'].$delete({ param: { id } }))
      } catch (error) {
        // Already deleted, e.g. on another device
        if (apiErrorInfo(error)?.status !== 404) throw error
      }
    },
    onMutate: ({ id, contextId }) =>
      changeOptimistically<WidgetDto[]>(queryClient, widgetsKey(contextId), (list) =>
        list.filter((item) => item.id !== id),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
  })
}

export function useSaveLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contextId, items }: { contextId: string; items: LayoutItem[] }) =>
      parseResponse(
        apiClient.api.contexts[':id'].layout.$put({ param: { id: contextId }, json: items }),
      ),
    onMutate: ({ contextId, items }) =>
      changeOptimistically<WidgetDto[]>(queryClient, widgetsKey(contextId), (list) =>
        withLayout(list, items),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
    // The API returns every widget of the context
    onSuccess: (saved, { contextId }) => queryClient.setQueryData(widgetsKey(contextId), saved),
  })
}
```

`apps/extension/src/queries/widgets.test.ts` (stan po tym zadaniu; zadanie 10 dopisze test)

```ts
import type { WidgetDto } from '@one-place/shared'
import { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, jsonResponse, withQueryClient } from './testing'
import {
  useCreateWidget,
  useDeleteWidget,
  useSaveLayout,
  useUpdateWidgetConfig,
  widgetsKey,
} from './widgets'

const api = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }))

vi.mock('@/api/client', () => ({
  apiClient: {
    api: {
      contexts: { ':id': { widgets: { $post: api.post }, layout: { $put: api.put } } },
      widgets: { ':id': { $patch: api.patch, $delete: api.delete } },
    },
  },
}))

function widget(overrides: Partial<WidgetDto>): WidgetDto {
  return {
    id: 'id',
    contextId: 'work',
    type: 'todo',
    config: { title: '' },
    x: 0,
    y: 0,
    w: 4,
    h: 6,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
    ...overrides,
  }
}

const tasks = widget({ id: 'tasks' })
const shopping = widget({ id: 'shopping', x: 4 })
const key = widgetsKey('work')

let queryClient: QueryClient

function cached() {
  return queryClient.getQueryData<WidgetDto[]>(key)
}

beforeEach(() => {
  vi.resetAllMocks()
  queryClient = new QueryClient()
  queryClient.setQueryData(key, [tasks, shopping])
})

describe('useCreateWidget', () => {
  it('shows the new widget at once and then replaces it with the saved one', async () => {
    const response = deferred<Response>()
    api.post.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useCreateWidget)
    const input = { id: 'new', type: 'todo', config: {}, x: 0, y: 6, w: 4, h: 6 } as const

    const saving = mutateAsync({ contextId: 'work', ...input })
    await vi.waitFor(() =>
      expect(cached()?.map((item) => item.id)).toEqual(['tasks', 'shopping', 'new']),
    )

    const saved = widget({ ...input, config: { title: '', hideCompleted: false } })
    response.resolve(jsonResponse(201, saved))
    await saving
    expect(cached()?.[2]).toEqual(saved)
  })

  it('removes the new widget when the API rejects it', async () => {
    api.post.mockResolvedValue(
      jsonResponse(422, { error: { code: 'LIMIT_EXCEEDED', message: 'Too many widgets' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useCreateWidget)
    const input = { id: 'new', type: 'todo', config: {}, x: 0, y: 6, w: 4, h: 6 } as const
    await expect(mutateAsync({ contextId: 'work', ...input })).rejects.toThrow()
    expect(cached()).toEqual([tasks, shopping])
  })
})

describe('useSaveLayout', () => {
  it('moves widgets at once and moves them back when the API rejects the layout', async () => {
    const response = deferred<Response>()
    api.put.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useSaveLayout)

    const saving = mutateAsync({
      contextId: 'work',
      items: [{ id: 'tasks', x: 0, y: 6, w: 6, h: 4 }],
    })
    await vi.waitFor(() => expect(cached()?.[0]).toMatchObject({ y: 6, w: 6, h: 4 }))

    response.resolve(jsonResponse(400, { error: { code: 'LAYOUT_INVALID', message: 'Invalid' } }))
    await expect(saving).rejects.toThrow()
    expect(cached()).toEqual([tasks, shopping])
  })
})

describe('useUpdateWidgetConfig', () => {
  it('changes the config at once and keeps the saved one', async () => {
    const response = deferred<Response>()
    api.patch.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useUpdateWidgetConfig)

    const saving = mutateAsync({ id: 'tasks', contextId: 'work', config: { title: 'Zakupy ' } })
    await vi.waitFor(() => expect(cached()?.[0]?.config).toEqual({ title: 'Zakupy ' }))

    const saved = { ...tasks, config: { title: 'Zakupy' }, version: 2 }
    response.resolve(jsonResponse(200, saved))
    await saving
    expect(cached()?.[0]).toEqual(saved)
  })
})

describe('useDeleteWidget', () => {
  it('treats a widget deleted on another device as deleted', async () => {
    api.delete.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Widget not found' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useDeleteWidget)
    await mutateAsync({ id: 'tasks', contextId: 'work' })
    expect(cached()).toEqual([shopping])
  })
})
```

`apps/extension/src/queries/contexts.ts` (nowy import i `onSuccess` w `useDeleteContext`)

```ts
import { widgetsKey } from './widgets'

// …

export function useDeleteContext() {
  const queryClient = useQueryClient()
  return useMutation({
    // … mutationFn, onMutate i onError bez zmian
    onError: (_error, _id, rollback) => rollback?.(),
    // The API deleted the widgets together with the context. Without this, they would stay in
    // the saved cache for good.
    onSuccess: (_data, id) => queryClient.removeQueries({ queryKey: widgetsKey(id) }),
  })
}
```

`apps/extension/src/queries/contexts.test.ts` (nowy import i nowy test w bloku `useDeleteContext`)

```ts
import { widgetsKey } from './widgets'

// …

it('forgets the cached widgets of the deleted context', async () => {
  api.delete.mockResolvedValue(new Response(null, { status: 204 }))
  queryClient.setQueryData(widgetsKey('work'), [{ id: 'tasks' }])
  const { mutateAsync } = withQueryClient(queryClient, useDeleteContext)
  await mutateAsync('work')
  expect(queryClient.getQueryData(widgetsKey('work'))).toBeUndefined()
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Czy nowe zapytanie `['widgets', contextId]` wymaga zmiany `CACHE_SCHEMA_VERSION`?** Nie. Stary cache nie ma żadnych wpisów widgetów, więc nie ma czego odrzucać: nowe zapytanie po prostu pobierze dane przy pierwszym otwarciu kontekstu. Wersję zmienia się, gdy zmienia się kształt danych, które już są w cache (Etap 5).
2. **Skąd mutacja zmiany konfiguracji wie, który wpis cache zmienić, skoro trasa `PATCH /api/widgets/:id` nie zna kontekstu?** Z danych wejściowych: komponent podaje `contextId` z `WidgetDto`. API go nie potrzebuje, ale cache tak.
3. **Co się stanie z wpisem `['widgets', id]`, gdy kontekst usunięto na innym urządzeniu?** Ta karta dowie się o tym przy odświeżeniu listy kontekstów, ale wpis widgetów zostanie w cache. To drobny wyciek miejsca w storage, który zniknie przy wylogowaniu. Sprzątanie po każdym odświeżeniu listy kontekstów to dobry pomysł na później.

</details>

---

## Zadanie 7: czyste funkcje układu (TDD)

**Cel:** logika siatki niezależna od biblioteki: dosuwanie widgetów w pionie identyczne z `grid-layout-plus`, miejsce dla nowego widgetu, różnica między układami i kolejność w jednej kolumnie (F-GRID-03, F-GRID-05, F-WGT-02).

**Czego się nauczysz:** algorytm dosuwania z `react-grid-layout`, test zgodności z biblioteką, czyste funkcje jako sposób na ograniczenie ryzyka R4.

**Pliki:**

- Utwórz: `apps/extension/src/features/dashboard/layout.ts`
- Zmień: `apps/extension/package.json`
- Test: `apps/extension/src/features/dashboard/layout.test.ts`

**Interfejsy:**

- Korzysta z: `LayoutItem`, `WidgetSize` (zadanie 1).
- Wytwarza: typ `GridRect`, `compactLayout(items)`, `placeNewWidget(items, size)`, `changedLayout(saved, current)` i `columnOrder(items)`. Używają ich zadania 10–12.

**Kroki:**

- [ ] **1. Zależność.** `pnpm --filter @one-place/extension add grid-layout-plus@^1.1`. Komponentu siatki jeszcze nie piszesz, ale test zgodności skorzysta z jej algorytmu.
- [ ] **2. Czerwone testy** w `src/features/dashboard/layout.test.ts` (pomocnik `rect(id, x, y, w = 4, h = 2)`):
  - widget pod przerwą po usuniętym widgecie przesuwa się w górę: `b` z `y: 5` trafia na `y: 2`;
  - widget, nad którym nic nie ma, trafia na `y: 0`;
  - dwa widgety w tym samym miejscu (dodane jednocześnie na dwóch urządzeniach) się rozsuwają: `a` zostaje na `y: 0`, `b` trafia na `y: 2`, a wynik zachowuje kolejność wejścia;
  - dla trzech różnych układów wynik jest taki sam jak `compact(…, true)` z `grid-layout-plus/es/helpers/common`;
  - `placeNewWidget([], { w: 4, h: 6 })` to `{ x: 0, y: 0, w: 4, h: 6 }`, a przy widgetach `(0, 0, 4, 6)` i `(4, 0, 4, 2)` nowy trafia na `y: 6`;
  - `changedLayout` zwraca tylko przesunięte i przeskalowane widgety;
  - `columnOrder` sortuje po wierszu, potem po kolumnie.

  Oczekiwany wynik: **FAIL**.

- [ ] **3. Implementacja** `src/features/dashboard/layout.ts`. Przeczytaj wcześniej `compact` i `compactItem` w `node_modules/grid-layout-plus/src/helpers/common.ts`. Oczekiwany wynik: **PASS (60 testów w rozszerzeniu)**.
- [ ] **4. Sprawdź test zgodności.** Zamień na chwilę kolejność sortowania na „najpierw kolumna, potem wiersz”. Oczekiwany wynik: **FAIL** testu zgodności i testu kolejności w kolumnie. Przywróć.
- [ ] **5.** `pnpm format && pnpm check`, potem commit: `feat(extension): add layout helpers for the grid`.

**Pułapki (sprawdzone na prototypie):**

- **Ten sam algorytm co w edytorze.** Podgląd (zadanie 10) nie korzysta z biblioteki, a edytor (zadanie 12) tak. Gdyby dosuwały inaczej, przełączenie trybu przesuwałoby widgety. Test zgodności porównuje oba algorytmy na tych samych danych.
- **Biblioteka zmienia elementy w miejscu.** `compact` z `grid-layout-plus` modyfikuje przekazane obiekty i zamiast `id` używa `i`. Test podaje jej kopie z polem `i`. Własna funkcja nie zmienia wejścia, bo dane pochodzą z cache TanStack Query.
- **Remis rozstrzyga `id`.** Dwa widgety w tym samym miejscu biblioteka zostawia w kolejności tablicy. `id` w sortowaniu daje ten sam wynik na każdym urządzeniu, niezależnie od kolejności w cache.
- **Import z wnętrza paczki tylko w teście.** `grid-layout-plus/es/helpers/common` to wewnętrzny plik biblioteki. W teście to zaleta: po aktualizacji biblioteki, która zmieni algorytm, test od razu to pokaże.

<details>
<summary>Podpowiedź</summary>

- Dwa prostokąty nachodzą na siebie, gdy `a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h`.
- Dosuwanie: sortuj od lewego górnego rogu, a dla każdego widgetu najpierw zmniejszaj `y`, dopóki nie nachodzi na żaden wcześniej ułożony, potem przesuwaj w dół pod każdy, na który nachodzi (`y = collision.y + collision.h`).
- `placeNewWidget`: `Math.max(0, ...items.map((item) => item.y + item.h))`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/features/dashboard/layout.test.ts`

```ts
import { compact } from 'grid-layout-plus/es/helpers/common'
import { describe, expect, it } from 'vitest'
import { changedLayout, columnOrder, compactLayout, placeNewWidget } from './layout'

const rect = (id: string, x: number, y: number, w = 4, h = 2) => ({ id, x, y, w, h })

describe('compactLayout', () => {
  it('moves a widget up into the gap left by a deleted one', () => {
    expect(compactLayout([rect('a', 0, 0), rect('b', 0, 5)])).toEqual([
      rect('a', 0, 0),
      rect('b', 0, 2),
    ])
  })

  it('moves a widget to the top when nothing is above it', () => {
    expect(compactLayout([rect('a', 0, 0), rect('b', 4, 3)])[1]).toEqual(rect('b', 4, 0))
  })

  it('pushes down a widget that overlaps another, e.g. added at once on two devices', () => {
    expect(compactLayout([rect('b', 0, 0), rect('a', 0, 0)])).toEqual([
      rect('b', 0, 2),
      rect('a', 0, 0),
    ])
  })

  it('places widgets exactly like the grid in edit mode', () => {
    const layouts = [
      [rect('a', 0, 3), rect('b', 2, 0, 4, 1), rect('c', 4, 6, 8, 3)],
      [rect('a', 0, 0, 12, 1), rect('b', 0, 4, 6), rect('c', 6, 2, 6, 5), rect('d', 3, 9)],
      [rect('a', 0, 0), rect('b', 0, 0), rect('c', 2, 1), rect('d', 8, 7, 4, 4)],
    ]
    for (const layout of layouts) {
      // grid-layout-plus works on `i` instead of `id` and changes the items in place
      const expected = compact(
        layout.map(({ id, ...item }) => ({ ...item, i: id })),
        true,
      ).map(({ i, x, y, w, h }) => ({ id: String(i), x, y, w, h }))
      expect(compactLayout(layout)).toEqual(expected)
    }
  })
})

describe('placeNewWidget', () => {
  it('puts a new widget below all the others, at the left edge', () => {
    expect(placeNewWidget([], { w: 4, h: 6 })).toEqual({ x: 0, y: 0, w: 4, h: 6 })
    const layout = [rect('a', 0, 0, 4, 6), rect('b', 4, 0, 4, 2)]
    expect(placeNewWidget(layout, { w: 4, h: 6 })).toEqual({ x: 0, y: 6, w: 4, h: 6 })
  })
})

describe('changedLayout', () => {
  it('returns only the widgets that moved or changed size', () => {
    const saved = [rect('a', 0, 0), rect('b', 4, 0), rect('c', 8, 0)]
    const current = [rect('a', 0, 2), rect('b', 4, 0), rect('c', 8, 0, 4, 3)]
    expect(changedLayout(saved, current)).toEqual([rect('a', 0, 2), rect('c', 8, 0, 4, 3)])
  })
})

describe('columnOrder', () => {
  it('sorts widgets by row and then by column for the one-column view', () => {
    const layout = [rect('c', 0, 6), rect('b', 4, 0), rect('a', 0, 0)]
    expect(columnOrder(layout).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
})
```

`apps/extension/src/features/dashboard/layout.ts`

```ts
import type { LayoutItem, WidgetSize } from '@one-place/shared'

export interface GridRect {
  x: number
  y: number
  w: number
  h: number
}

type Placed = GridRect & { id: string }

function collides(a: GridRect, b: GridRect) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

// Top left first. The id breaks ties, so every device gets the same result.
function byRowThenColumn(a: Placed, b: Placed) {
  return a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : 1)
}

// F-GRID-03: widgets do not overlap and move up as far as they can. The same algorithm as
// `verticalCompact` in grid-layout-plus, so the preview looks exactly like the editor.
export function compactLayout<T extends Placed>(items: T[]): T[] {
  const placed: T[] = []
  for (const item of [...items].sort(byRowThenColumn)) {
    const next = { ...item }
    while (next.y > 0 && !placed.some((other) => collides(other, next))) next.y -= 1
    let collision: T | undefined
    while ((collision = placed.find((other) => collides(other, next)))) {
      next.y = collision.y + collision.h
    }
    placed.push(next)
  }
  // The same order as the input
  return items.map((item) => placed.find((other) => other.id === item.id)!)
}

// F-WGT-02: a new widget goes below all the others
export function placeNewWidget(items: GridRect[], size: WidgetSize): GridRect {
  const bottom = Math.max(0, ...items.map((item) => item.y + item.h))
  return { x: 0, y: bottom, ...size }
}

// Only what really changed is saved, so a click without a move sends nothing
export function changedLayout(saved: Placed[], current: Placed[]): LayoutItem[] {
  const savedById = new Map(saved.map((item) => [item.id, item]))
  return current
    .filter((item) => {
      const before = savedById.get(item.id)
      return (
        before !== undefined &&
        (before.x !== item.x || before.y !== item.y || before.w !== item.w || before.h !== item.h)
      )
    })
    .map(({ id, x, y, w, h }) => ({ id, x, y, w, h }))
}

// F-GRID-05: in one column the widgets keep the reading order of the grid
export function columnOrder<T extends Placed>(items: T[]): T[] {
  return [...items].sort(byRowThenColumn)
}
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego pętla „w górę” zatrzymuje się dopiero po kolizji, a potem pętla „w dół” cofa widget?** Pierwsza pętla schodzi o jeden wiersz za daleko: zatrzymuje się w miejscu, w którym widget już na coś nachodzi. Druga przesuwa go pod tę przeszkodę. Ta sama druga pętla rozsuwa widgety, które nachodziły na siebie od początku.
2. **Po co `changedLayout`, skoro API przyjmie też niezmienione widgety?** Każdy zapisany widget dostaje nową wersję i datę, a edytor zgłasza „nowy układ” także wtedy, gdy nic się nie zmieniło. W zadaniu 12 zobaczysz, że bez porównania zapis wpada w pętlę.
3. **Czy podgląd mógłby po prostu pokazywać zapisane `y` bez dosuwania?** Wtedy po usunięciu widgetu w podglądzie zostałaby dziura, której edytor by nie miał. Przełączenie trybu przesunęłoby widgety, a użytkownik zobaczyłby dwa różne pulpity.

</details>

---

## Zadanie 8: kontrakt widgetu, rejestr i zaślepka Zadań

**Cel:** rozszerzenie zna typy widgetów przez rejestr. Definicja typu ma nazwę, opis, ikonę i rozmiary, a komponent ładuje się leniwie. Widget odczytuje swoją konfigurację tak, że niepoprawne pola dostają wartości domyślne (F-WGT-06, odporność z [03-architektura.md](03-architektura.md#system-widgetów)). Startowy JS nie rośnie o Zoda.

**Czego się nauczysz:** `AsyncComponentLoader` i dzielenie kodu na chunki, `satisfies` przy rejestrze, `sideEffects: false` i to, czego tree shaking nie usunie, odczyt danych z odzyskiwaniem po błędzie.

**Pliki:**

- Utwórz: `apps/extension/src/widgets/types.ts`, `apps/extension/src/widgets/registry.ts`, `apps/extension/src/widgets/config.ts`, `apps/extension/src/widgets/todo/TodoWidget.vue`, `packages/shared/src/widget-types.ts`
- Zmień: `packages/shared/src/widgets.ts`, `packages/shared/src/widgets.test.ts`, `packages/shared/src/index.ts`, `apps/extension/src/i18n/pl.json`, `en.json`
- Test: `apps/extension/src/widgets/config.test.ts`, `apps/extension/src/widgets/registry.test.ts`

**Interfejsy:**

- Korzysta z: `WIDGET_SIZES`, `isWidgetType`, `TodoConfigSchema` (zadanie 1).
- Wytwarza: interfejs `WidgetDefinition`, `widgetRegistry`, `findWidgetDefinition(type)` (`null` dla nieznanego typu), `resolveConfig(schema, config)`, komponent `TodoWidget` (prop `widget`) i klucze `widgets.todo.*`. Używają ich zadania 9–13.

**Kroki:**

- [ ] **1. Czerwone testy:**
  - `src/widgets/config.test.ts`: `resolveConfig(TodoConfigSchema, { title: ' Zakupy ' })` daje pełną konfigurację z tytułem `'Zakupy'`; `{ title: 123, hideCompleted: true }` daje domyślny tytuł i `hideCompleted: true`, a `console.warn` jest wołany raz; `null` i `'oops'` dają konfigurację domyślną;
  - `src/widgets/registry.test.ts`: `findWidgetDefinition('todo')` ma typ `todo` i rozmiary z `WIDGET_SIZES`, a `findWidgetDefinition('notes')` to `null`.

  Oczekiwany wynik: **FAIL**.

- [ ] **2. Implementacja.** `types.ts` z interfejsem `WidgetDefinition` (bez schematu konfiguracji, wyjaśnienie w kroku 5). `registry.ts` z wpisem `todo`: klucze i18n, ikona `i-lucide-list-checks`, rozmiary z `WIDGET_SIZES` i `component: () => import('./todo/TodoWidget.vue')`. `config.ts` z `resolveConfig`. `TodoWidget.vue` pokazuje tytuł z konfiguracji albo nazwę typu. W `pl.json` i `en.json` dodaj grupę `widgets.todo` (`name`, `description`). Oczekiwany wynik: **PASS (65 testów w rozszerzeniu)**.
- [ ] **3. Eksperyment: rejestr na ścieżce startowej.** Rejestr trafi do startowego JS razem z ramką widgetu (zadanie 9). Sprawdź to już teraz: dodaj na chwilę w `DashboardScreen.vue` import `findWidgetDefinition` i `console.log(findWidgetDefinition('todo'))`, zbuduj rozszerzenie i uruchom `pnpm size`. **Oczekiwany wynik: około 566 kB, czyli +93 kB i ponad budżet.** Rejestr nie importuje Zoda, a komponent Zadań jest leniwy. Zastanów się, skąd Zod na ścieżce startowej, zanim otworzysz wyjaśnienie.
- [ ] **4. Poprawka.** Przenieś z `packages/shared/src/widgets.ts` do nowego `widget-types.ts` wszystko, co nie potrzebuje Zoda: `WIDGET_TYPES`, `GRID_COLUMNS`, `MAX_WIDGETS_PER_CONTEXT`, `WidgetType`, `WidgetSize`, `WIDGET_SIZES`, `isWidgetType` i `WidgetDto`. `widgets.ts` importuje je z `./widget-types`, a `index.ts` eksportuje oba pliki. W `widgets.test.ts` zmień import `WIDGET_TYPES`. Zbuduj i powtórz pomiar: **około 474 kB.** Usuń tymczasowy import z `DashboardScreen.vue`.
- [ ] **5. Dlaczego definicja nie ma schematu.** Architektura zakładała pola `configSchema` i `defaultConfig` w definicji oraz walidację w ramce. Każde z nich przyniosłoby do startowego JS te same 93 kB, bo ramka jest w pierwszym renderze. Schemat przychodzi więc z leniwym komponentem widgetu, który sam woła `resolveConfig`. Na prototypie wariant z `zod/mini` kosztował nadal około 52 kB.
- [ ] **6.** `pnpm format && pnpm check`, potem commit: `feat(extension): add widget registry with the todo placeholder`.

**Pułapki (sprawdzone na prototypie):**

- **`sideEffects: false` usuwa nieużywane moduły, ale nie nieużywany kod z używanego modułu.** Bundler pominie cały plik, z którego nic nie jest importowane. Plik, z którego bierzesz jedną stałą, zostaje w całości, a wywołania `z.object(…)` na jego najwyższym poziomie zostają razem z Zodem, bo bundler nie wie, że nie mają skutków ubocznych.
- **Rejestr bez Zoda, komponenty z Zodem.** `TodoWidget.vue` importuje `TodoConfigSchema` i to w porządku: jest w osobnym chunku ładowanym dopiero wtedy, gdy na pulpicie jest widget Zadań. Zod trafia do chunka wspólnego z innymi leniwymi częściami (np. formularzami).
- **`resolveConfig` nie importuje Zoda.** Woła tylko metody schematu, który dostaje w argumencie (`schema.safeParse`), a typ `ZodType` importuje przez `import type`. Taka funkcja nie zmienia rozmiaru chunka, w którym jest.
- **Każde pole ma wartość domyślną.** Dlatego `schema.parse({})` daje konfigurację domyślną, a `resolveConfig` nie potrzebuje osobnego `defaultConfig`. Pilnuje tego test w `shared` z zadania 1.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 3)</summary>

- Rejestr importuje `WIDGET_SIZES` i `isWidgetType` z `@one-place/shared`. Te stałe były w pliku `widgets.ts`, który na najwyższym poziomie tworzy schematy przez `z.object(…)`, `z.int()` i inne.
- Bundler usuwa nieużywane eksporty, ale wywołanie funkcji na najwyższym poziomie modułu może mieć skutki uboczne. Zod nie oznacza wszystkich swoich funkcji jako czystych, więc bundler zostawia te wywołania, a z nimi cały rdzeń Zoda.
- `"sideEffects": false` w `packages/shared/package.json` działa na poziomie plików: plik, z którego nic nie jest używane, znika w całości. Dlatego po przeniesieniu stałych do pliku bez Zoda `widgets.ts` nie trafia do startowego JS.
- To ta sama lekcja co z ekranem logowania w Etapie 1, tylko od strony importu: nie wystarczy, że kod jest leniwy, trzeba też sprawdzić, co ciągnie za sobą każdy import na ścieżce startowej.

</details>

<details>
<summary>Podpowiedź</summary>

- `AsyncComponentLoader` importujesz z `vue` jako typ. `() => import('./todo/TodoWidget.vue')` to dokładnie taki loader.
- `widgetRegistry` z `satisfies Record<WidgetType, WidgetDefinition>` sprawdza, że każdy typ z `WIDGET_TYPES` ma wpis, a zachowuje dokładny typ obiektu.
- `resolveConfig`: przy błędzie weź z `result.error.issues` pierwsze elementy ścieżek (`issue.path[0]`), usuń te pola z konfiguracji i sparsuj resztę jeszcze raz. Gdy i to się nie uda, zwróć `schema.parse({})`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/widgets/config.test.ts`

```ts
import { TodoConfigSchema } from '@one-place/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveConfig } from './config'

const defaults = { title: '', hideCompleted: false, source: { type: 'local' } }

describe('resolveConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a valid config with the missing fields filled in', () => {
    expect(resolveConfig(TodoConfigSchema, { title: ' Zakupy ' })).toEqual({
      ...defaults,
      title: 'Zakupy',
    })
  })

  it('keeps the valid fields and resets the invalid ones, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(resolveConfig(TodoConfigSchema, { title: 123, hideCompleted: true })).toEqual({
      ...defaults,
      hideCompleted: true,
    })
    expect(warn).toHaveBeenCalledOnce()
  })

  it('uses the default config when the saved one is not an object', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(resolveConfig(TodoConfigSchema, null)).toEqual(defaults)
    expect(resolveConfig(TodoConfigSchema, 'oops')).toEqual(defaults)
  })
})
```

`apps/extension/src/widgets/registry.test.ts`

```ts
import { WIDGET_SIZES } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { findWidgetDefinition } from './registry'

describe('findWidgetDefinition', () => {
  it('returns the definition of a known type with the sizes from shared', () => {
    expect(findWidgetDefinition('todo')).toMatchObject({
      type: 'todo',
      defaultSize: WIDGET_SIZES.todo.default,
      minSize: WIDGET_SIZES.todo.min,
    })
  })

  it('returns null for a type added in a newer version of the extension', () => {
    expect(findWidgetDefinition('notes')).toBeNull()
  })
})
```

`apps/extension/src/widgets/types.ts`

```ts
import type { WidgetSize, WidgetType } from '@one-place/shared'
import type { AsyncComponentLoader } from 'vue'

// What the dashboard knows about a widget type before the widget's code is loaded. It is on the
// start-up path, so it has no Zod schema: the components bring their config schema with them.
export interface WidgetDefinition {
  type: WidgetType
  // i18n keys
  name: string
  description: string
  icon: string
  defaultSize: WidgetSize
  minSize: WidgetSize
  // Gets the prop `widget: WidgetDto`
  component: AsyncComponentLoader
  // Gets the prop `widget: WidgetDto` and emits `save` with the new config
  settingsComponent?: AsyncComponentLoader
}
```

`apps/extension/src/widgets/registry.ts` (stan po tym zadaniu; zadanie 13 dopisze `settingsComponent`)

```ts
import { isWidgetType, WIDGET_SIZES, type WidgetType } from '@one-place/shared'
import type { WidgetDefinition } from './types'

export const widgetRegistry = {
  todo: {
    type: 'todo',
    name: 'widgets.todo.name',
    description: 'widgets.todo.description',
    icon: 'i-lucide-list-checks',
    defaultSize: WIDGET_SIZES.todo.default,
    minSize: WIDGET_SIZES.todo.min,
    component: () => import('./todo/TodoWidget.vue'),
  },
} satisfies Record<WidgetType, WidgetDefinition>

// F-WGT-06: null for a type this version of the extension does not know
export function findWidgetDefinition(type: string): WidgetDefinition | null {
  return isWidgetType(type) ? widgetRegistry[type] : null
}
```

`apps/extension/src/widgets/config.ts`

```ts
import type { ZodType } from 'zod'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// The API validates every config it saves, but a newer version of the extension may save a field
// in a shape this one does not expect. Invalid fields get their default value, the valid ones stay.
// Every field of a config schema has a default, so `schema.parse({})` is the default config.
export function resolveConfig<T>(schema: ZodType<T>, config: unknown): T {
  const result = schema.safeParse(config)
  if (result.success) return result.data
  console.warn('Invalid widget config, using defaults for the invalid fields', result.error.issues)
  const invalid = new Set(result.error.issues.map((issue) => issue.path[0]))
  const valid = isRecord(config)
    ? Object.fromEntries(Object.entries(config).filter(([key]) => !invalid.has(key)))
    : {}
  return schema.safeParse(valid).data ?? schema.parse({})
}
```

`apps/extension/src/widgets/todo/TodoWidget.vue`

```vue
<script setup lang="ts">
import { TodoConfigSchema, type WidgetDto } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveConfig } from '../config'

// A placeholder with the title only. The task list comes in Stage 4.
const props = defineProps<{ widget: WidgetDto }>()
const { t } = useI18n()
const config = computed(() => resolveConfig(TodoConfigSchema, props.widget.config))
</script>

<template>
  <h2 class="truncate font-semibold text-highlighted">
    {{ config.title || t('widgets.todo.name') }}
  </h2>
</template>
```

`packages/shared/src/widget-types.ts`

```ts
// Constants without Zod. The extension imports them on the start-up path, and a module with
// schemas would bring the whole Zod with it (about 90 kB), even if only a constant is used.
export const WIDGET_TYPES = ['todo'] as const
export const GRID_COLUMNS = 12
export const MAX_WIDGETS_PER_CONTEXT = 50

export type WidgetType = (typeof WIDGET_TYPES)[number]

export interface WidgetSize {
  w: number
  h: number
}

// In grid units. The API checks the minimum, the extension uses both when adding and resizing.
export const WIDGET_SIZES: Record<WidgetType, { min: WidgetSize; default: WidgetSize }> = {
  todo: { min: { w: 3, h: 3 }, default: { w: 4, h: 6 } },
}

export function isWidgetType(type: string): type is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(type)
}

export interface WidgetDto<TConfig = unknown> {
  id: string
  contextId: string
  // A string, not WidgetType: a newer version of the extension may have added a type (F-WGT-06)
  type: string
  config: TConfig
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
  version: number
}
```

`packages/shared/src/widgets.ts` (początek pliku; stałe i `WidgetDto` przeniesione, reszta bez zmian)

```ts
import { z } from 'zod'
import {
  GRID_COLUMNS,
  MAX_WIDGETS_PER_CONTEXT,
  WIDGET_SIZES,
  WIDGET_TYPES,
  type WidgetType,
} from './widget-types'

export const TODO_TITLE_MAX_LENGTH = 60

export const TodoConfigSchema = z.object({
  // … bez zmian
```

`packages/shared/src/index.ts`

```ts
export * from './auth'
export * from './contexts'
export * from './settings'
export * from './theme'
export * from './widget-types'
export * from './widgets'
```

`packages/shared/src/widgets.test.ts` (zmienione importy)

```ts
import { WIDGET_TYPES } from './widget-types'
import { CreateWidgetSchema, LayoutSchema, TodoConfigSchema, widgetConfigSchemas } from './widgets'
```

Teksty: `"widgets": { "todo": { "name": "Zadania", "description": "Lista rzeczy do zrobienia" } }` w `pl.json` (przed grupą `settings`) i `"widgets": { "todo": { "name": "Tasks", "description": "A list of things to do" } }` w `en.json`.

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co zobaczy starsza wersja rozszerzenia, gdy nowsza zapisze w konfiguracji Zadań pole `title` jako obiekt?** `resolveConfig` odrzuci tylko to pole: tytuł wróci do domyślnego, a pozostałe pola (np. `hideCompleted`) zostaną. W konsoli pojawi się ostrzeżenie, a widget dalej działa.
2. **Dlaczego `findWidgetDefinition` korzysta z `isWidgetType`, zamiast od razu czytać `widgetRegistry[type]`?** `type` z API to dowolny tekst. Odczyt z obiektu po nieznanym kluczu daje w TypeScript błąd typu, a w JavaScripcie może trafić w pola z prototypu, np. `'constructor'`. `isWidgetType` sprawdza listę znanych typów i zawęża typ.
3. **Gdzie w tym etapie jest Zod w rozszerzeniu i kiedy się ładuje?** W chunkach leniwych części: komponentu Zadań, ustawień widgetu, formularzy kontekstu i ekranu logowania. Ładuje się przy pierwszym widgecie Zadań na pulpicie, a nie przed pierwszym renderem.

</details>

---

## Zadanie 9: `WidgetFrame` i pierwsze testy komponentów

**Cel:** każdy widget jest w ramce, która ładuje jego kod leniwie, pokazuje błąd widgetu z przyciskiem „Spróbuj ponownie” (F-WGT-05) i komunikat dla nieznanego typu (F-WGT-06). Ramkę sprawdzają testy komponentów z prawdziwym Nuxt UI.

**Czego się nauczysz:** `onErrorCaptured`, `defineAsyncComponent`, `@vue/test-utils` (`mount`, `flushPromises`, `trigger`), środowisko `happy-dom` dla jednego pliku, konfiguracja Vitest z pluginami Vue i Nuxt UI.

**Pliki:**

- Utwórz: `apps/extension/nuxt-ui.config.ts`, `apps/extension/src/features/dashboard/WidgetFrame.vue`
- Zmień: `apps/extension/vitest.config.ts`, `apps/extension/wxt.config.ts`, `apps/extension/package.json`, `apps/extension/src/i18n/pl.json`, `en.json`
- Test: `apps/extension/src/features/dashboard/WidgetFrame.test.ts`

**Interfejsy:**

- Korzysta z: `findWidgetDefinition`, `WidgetDefinition` (zadanie 8), `WidgetDto` (zadanie 1).
- Wytwarza: komponent `WidgetFrame` (propsy `widget` i `editMode`; w trybie edycji nagłówek z klasą `widget-drag-handle`), funkcję `nuxtUiOptions(dataIcons)` wspólną dla buildu i testów, klucze `widgets.unknown.*` i `widgets.error.*`. Używają ich zadania 10–13.

**Kroki:**

- [ ] **1. Zależności.** `pnpm --filter @one-place/extension add -D @vue/test-utils@^2.5 happy-dom@^21 @vitejs/plugin-vue@^6`
- [ ] **2. Czerwone testy** w `src/features/dashboard/WidgetFrame.test.ts` (pierwsza linia: `// @vitest-environment happy-dom`). `vi.mock('@/widgets/registry', …)` zwraca dla typu `todo` definicję z komponentem `FlakyWidget`, który rzuca błąd, dopóki flaga `fails` jest `true`:
  - widget znanego typu się renderuje;
  - błąd widgetu pokazuje w ramce „This widget stopped working”, a po kliknięciu „Try again” (z `fails = false`) widget renderuje się poprawnie;
  - typ `notes` pokazuje „This widget needs a newer version of the extension”.
- [ ] **3. Uruchom.** `pnpm --filter @one-place/extension test`. Oczekiwany wynik: **FAIL** z błędem `"./vue-plugin" is not exported under the conditions ["node", "development", "import"] from package …/@nuxt/ui`. `WxtVitest()` dodaje fake browser i aliasy, ale nie pluginy z `wxt.config.ts`. Bez nich Vitest nie rozwiąże `@nuxt/ui/vue-plugin` (robi to plugin Nuxt UI) ani nie skompiluje plików `.vue` (robi to `@vitejs/plugin-vue`).
- [ ] **4. Konfiguracja Vitest.** W `vitest.config.ts` dodaj `vue()` z `@vitejs/plugin-vue` i `ui({ router: false, colorMode: false })` z `@nuxt/ui/vite`. Napisz `WidgetFrame.vue` (wskazówki w podpowiedzi) i teksty `widgets.unknown` oraz `widgets.error`. Oczekiwany wynik: **PASS (68 testów w rozszerzeniu)**.
- [ ] **5. Eksperyment: ikony w testach.** Przeczytaj koniec wyniku testów. **Oczekiwany wynik:** dwa razy `DOMException [AbortError]: The operation was aborted.`, choć wszystkie testy przeszły. Zastanów się, co happy-dom przerwał, zanim otworzysz wyjaśnienie.
- [ ] **6. Poprawka.** Utwórz `nuxt-ui.config.ts` z funkcją `nuxtUiOptions(dataIcons = [])`, która zwraca opcje Nuxt UI z `wxt.config.ts` (`router`, `colorMode`, `ui.colors`, `icon.clientBundle` ze `scan: true` i listą `dataIcons`). `wxt.config.ts` woła `ui(nuxtUiOptions(CONTEXT_ICONS))`, a `vitest.config.ts` `ui(nuxtUiOptions())`. Import w `vitest.config.ts` zapisz z rozszerzeniem: `'./nuxt-ui.config.ts'`. Uruchom testy: bez `AbortError`.
- [ ] **7. Eksperyment: `return false`.** Usuń na chwilę `return false` z `onErrorCaptured`. Oczekiwany wynik: test błędu **FAIL** (`expected '' to contain 'This widget stopped working'`) i `Unhandled Rejection … Error: Boom`. Przywróć.
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): add widget frame with error boundary and component tests`.

**Pułapki (sprawdzone na prototypie):**

- **`nuxt-ui.config.ts` nie może importować `@one-place/shared`.** `wxt.config.ts` wczytuje WXT przez `jiti`, który kompiluje TypeScript z pakietów workspace. `vitest.config.ts` wczytuje Vite inaczej: pakiety z `node_modules` zostawia Node.js, a ten nie rozwiąże importów `./auth` bez rozszerzenia w źródłach `shared` (`ERR_MODULE_NOT_FOUND …/shared/src/auth`). Dlatego ikony kontekstów przychodzą do `nuxtUiOptions` jako argument z `wxt.config.ts`.
- **Rozszerzenie `.ts` w imporcie pliku konfiguracji.** Bez niego Vite ostrzega, że przyszły domyślny sposób wczytywania konfiguracji (`configLoader: 'native'`) tego nie obsłuży. `.wxt/tsconfig.json` ma `allowImportingTsExtensions`, więc typecheck to przyjmuje.
- **happy-dom tylko tam, gdzie trzeba.** Komentarz `// @vitest-environment happy-dom` włącza DOM dla jednego pliku. Testy zapytań i store'ów dalej działają w środowisku Node, szybciej i bez DOM.
- **Język w testach.** happy-dom zgłasza `navigator.language` jako `en-US`, więc `detectLocale` wybiera angielski, a testy sprawdzają angielskie teksty.
- **Błąd w zdarzeniu też trafia do ramki.** Vue przekazuje do `onErrorCaptured` błędy z renderu, `setup`, hooków i procedur obsługi zdarzeń, a także błąd ładowania leniwego komponentu. Nie przechwyci błędu w `setTimeout` ani w niezłapanej obietnicy, bo te dzieją się poza Vue.

<details>
<summary>Wyjaśnienie eksperymentów (otwórz po kroku 7)</summary>

- **Krok 5.** `UIcon` z Nuxt UI korzysta z `@iconify/vue`. Ikony, których nie ma w paczce, Iconify pobiera z `api.iconify.design`. Bez opcji `icon.clientBundle` plugin Nuxt UI w testach nie dołącza ikon używanych w ramce (np. `i-lucide-puzzle` i `i-lucide-bug`), więc happy-dom wysyła prawdziwe żądania do internetu. Przy zamykaniu środowiska happy-dom przerywa niezakończone żądania i stąd `AbortError`. Testy zależały więc od sieci, a w trybie offline zachowałyby się inaczej. To ryzyko R2 z Etapu 0, tylko w testach.
- **Krok 7.** `onErrorCaptured` dostaje błąd jako pierwszy, ale bez `return false` Vue przekazuje go dalej: do kolejnych przodków i do `app.config.errorHandler`. W teście błąd przerywa render komponentu nadrzędnego, więc w drzewie nie zostaje nic. Na pulpicie zniknąłby cały widok, a nie jeden widget.

</details>

<details>
<summary>Podpowiedź</summary>

- Definicję typu przeczytaj raz w `setup`: `findWidgetDefinition(props.widget.type)`. Typ widgetu się nie zmienia.
- `defineAsyncComponent(definition.component)` daje komponent, który ładuje kod widgetu dopiero przy pierwszym renderze.
- W szablonie trzy przypadki: `v-if="!WidgetBody"` (nieznany typ), `v-else-if="error"` (błąd z przyciskiem) i `<component :is="WidgetBody" v-else :widget="widget" />`.
- `UEmpty` z `variant="naked"` nie dokłada drugiej ramki wewnątrz ramki widgetu.
- W teście `mount(WidgetFrame, { props, global: { plugins: [ui, i18n] } })`, gdzie `ui` to `@nuxt/ui/vue-plugin`, a `i18n` z `@/i18n`. Po `mount` wywołaj `await flushPromises()`, bo komponent widgetu ładuje się asynchronicznie.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/features/dashboard/WidgetFrame.test.ts`

```ts
// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { WidgetDto } from '@one-place/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { i18n } from '@/i18n'
import type { WidgetDefinition } from '@/widgets/types'
import WidgetFrame from './WidgetFrame.vue'

const widgetComponent = vi.hoisted(() => ({ fails: false }))

// A widget whose render throws while `fails` is true
const FlakyWidget = defineComponent({
  props: { widget: { type: Object, required: true } },
  setup() {
    return () => {
      if (widgetComponent.fails) throw new Error('Boom')
      return h('p', 'Flaky widget works')
    }
  },
})

vi.mock('@/widgets/registry', () => ({
  findWidgetDefinition: (type: string): Partial<WidgetDefinition> | null =>
    type === 'todo'
      ? {
          type: 'todo',
          name: 'widgets.todo.name',
          icon: 'i-lucide-list-checks',
          component: () => Promise.resolve(FlakyWidget),
        }
      : null,
}))

function widget(type: string): WidgetDto {
  return {
    id: 'tasks',
    contextId: 'work',
    type,
    config: {},
    x: 0,
    y: 0,
    w: 4,
    h: 6,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
  }
}

async function mountFrame(type: string) {
  const wrapper = mount(WidgetFrame, {
    props: { widget: widget(type), editMode: false },
    global: { plugins: [ui, i18n] },
  })
  await flushPromises()
  return wrapper
}

describe('WidgetFrame', () => {
  // happy-dom reports navigator.language as en-US, so the texts are English
  beforeEach(() => {
    widgetComponent.fails = false
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders the widget of a known type', async () => {
    const wrapper = await mountFrame('todo')
    expect(wrapper.text()).toContain('Flaky widget works')
  })

  it('shows an error in the frame and mounts the widget again on retry', async () => {
    widgetComponent.fails = true
    const wrapper = await mountFrame('todo')
    expect(wrapper.text()).toContain('This widget stopped working')

    widgetComponent.fails = false
    const retry = wrapper.findAll('button').find((button) => button.text() === 'Try again')
    await retry?.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Flaky widget works')
  })

  it('asks for a newer version of the extension for an unknown type', async () => {
    const wrapper = await mountFrame('notes')
    expect(wrapper.text()).toContain('This widget needs a newer version of the extension')
  })
})
```

`apps/extension/src/features/dashboard/WidgetFrame.vue` (stan po tym zadaniu; zadanie 13 doda menu)

```vue
<script setup lang="ts">
import type { WidgetDto } from '@one-place/shared'
import { defineAsyncComponent, onErrorCaptured, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { findWidgetDefinition } from '@/widgets/registry'

const props = defineProps<{ widget: WidgetDto; editMode: boolean }>()
const { t } = useI18n()

// The type of a widget never changes, so the definition is read once
const definition = findWidgetDefinition(props.widget.type)
// The widget's code is loaded only when it is on the dashboard
const WidgetBody = definition ? defineAsyncComponent(definition.component) : null

const error = ref<unknown>(null)

// F-WGT-05: an error thrown while rendering the widget (or loading its code) stays in its frame.
// Returning false stops it from reaching the rest of the dashboard.
onErrorCaptured((caught) => {
  console.error(`Widget ${props.widget.id} (${props.widget.type}) failed`, caught)
  error.value = caught
  return false
})

// The error message replaced the widget, so clearing it mounts the widget from scratch
function retry() {
  error.value = null
}
</script>

<template>
  <article
    class="relative flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default"
  >
    <header
      v-if="editMode"
      class="widget-drag-handle flex h-9 shrink-0 cursor-move items-center gap-2 border-b border-default bg-elevated px-2 text-sm"
    >
      <UIcon name="i-lucide-grip-vertical" class="size-4 text-dimmed" />
      <UIcon :name="definition?.icon ?? 'i-lucide-puzzle'" class="size-4 text-muted" />
      <span class="truncate">{{
        definition ? t(definition.name) : t('widgets.unknown.name')
      }}</span>
    </header>
    <div class="min-h-0 flex-1 overflow-auto p-3">
      <!-- F-WGT-06 -->
      <UEmpty
        v-if="!WidgetBody"
        icon="i-lucide-puzzle"
        :title="t('widgets.unknown.title')"
        variant="naked"
        size="sm"
      />
      <UEmpty
        v-else-if="error"
        icon="i-lucide-bug"
        :title="t('widgets.error.title')"
        :actions="[
          { label: t('widgets.error.retry'), icon: 'i-lucide-rotate-ccw', onClick: retry },
        ]"
        variant="naked"
        size="sm"
      />
      <component :is="WidgetBody" v-else :widget="widget" />
    </div>
  </article>
</template>
```

`apps/extension/nuxt-ui.config.ts` (stan po tym zadaniu; zadanie 11 zmieni skaner)

```ts
import type ui from '@nuxt/ui/vite'

// The same Nuxt UI options in the build (wxt.config.ts) and in component tests (vitest.config.ts).
// The scanner finds icons written in .vue files. Icons that come from data (e.g. context icons)
// are passed in, otherwise UIcon would fetch them from the Iconify API.
export function nuxtUiOptions(dataIcons: readonly string[] = []) {
  return {
    router: false,
    colorMode: false,
    ui: { colors: { primary: 'blue', neutral: 'zinc' } },
    icon: { clientBundle: { scan: true, icons: [...dataIcons] } },
  } satisfies Parameters<typeof ui>[0]
}
```

`apps/extension/vitest.config.ts`

```ts
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'
import { nuxtUiOptions } from './nuxt-ui.config.ts'

export default defineConfig({
  // WxtVitest() adds the fake browser and aliases, but not the plugins from wxt.config.ts.
  // Component tests need Vue and Nuxt UI (with the same icons as the build).
  plugins: [WxtVitest(), vue(), ui(nuxtUiOptions())],
})
```

`apps/extension/wxt.config.ts` (nowy import i zmieniony plugin `ui`; reszta bez zmian)

```ts
import { CONTEXT_ICONS } from '@one-place/shared'
import { nuxtUiOptions } from './nuxt-ui.config'

// …
      ui(nuxtUiOptions(CONTEXT_ICONS)),
```

Teksty w grupie `widgets`:

```json
"unknown": {
  "name": "Nieznany widget",
  "title": "Ten widget wymaga nowszej wersji rozszerzenia"
},
"error": {
  "title": "Ten widget przestał działać",
  "retry": "Spróbuj ponownie"
}
```

```json
"unknown": {
  "name": "Unknown widget",
  "title": "This widget needs a newer version of the extension"
},
"error": {
  "title": "This widget stopped working",
  "retry": "Try again"
}
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego „Spróbuj ponownie” nie potrzebuje `:key`, żeby zamontować widget od nowa?** Gdy błąd jest ustawiony, `v-else-if` zastępuje komponent widgetu komunikatem, więc Vue go odmontowuje. Wyczyszczenie błędu tworzy nową instancję z nowym stanem.
2. **Co pokaże ramka, gdy po aktualizacji rozszerzenia nie da się załadować chunka widgetu?** Błąd ładowania leniwego komponentu też trafia do `onErrorCaptured`, więc ramka pokaże komunikat błędu. „Spróbuj ponownie” spróbuje załadować chunk jeszcze raz, bo `defineAsyncComponent` nie zapamiętuje nieudanej próby.
3. **Po co prawdziwy Nuxt UI w testach, skoro można podmienić komponenty na zaślepki?** Zaślepki trzeba pisać i utrzymywać, a test sprawdzałby wtedy własne zaślepki zamiast prawdziwego `UEmpty` z akcjami. Wspólne `nuxtUiOptions` dają w testach te same komponenty i ikony co w paczce.

</details>

---

## Zadanie 10: pulpit z siatką w podglądzie i jedną kolumną

**Cel:** pulpit aktywnego kontekstu pokazuje widgety na siatce 12 kolumn ze stałą wysokością wiersza (F-GRID-01). Poniżej 768 px widgety są w jednej kolumnie w kolejności `(y, x)` (F-GRID-05). Bez cache widać szkielety (F-SYNC-02), a nowy kontekst od razu pokazuje pusty pulpit.

**Czego się nauczysz:** CSS grid z jawnym położeniem (`grid-column`, `grid-row`), `useBreakpoints` z VueUse, `useMutationState`, warunkowe `enabled` zapytania.

**Pliki:**

- Utwórz: `apps/extension/src/features/dashboard/grid.ts`, `use-narrow-screen.ts`, `DashboardGrid.vue`, `ContextDashboard.vue`, `apps/extension/src/queries/keys.ts`
- Zmień: `apps/extension/src/features/dashboard/DashboardScreen.vue`, `apps/extension/src/queries/widgets.ts`, `apps/extension/src/queries/contexts.ts`, `apps/extension/src/queries/widgets.test.ts`, `apps/extension/src/queries/contexts.test.ts`, `apps/extension/package.json`

**Interfejsy:**

- Korzysta z: `useWidgets` (zadanie 6), `compactLayout`, `columnOrder` (zadanie 7), `WidgetFrame` (zadanie 9).
- Wytwarza: `ROW_HEIGHT`, `GRID_GAP`, `widgetHeight(h)`, `useNarrowScreen()`, `DashboardGrid` (prop `widgets`), `ContextDashboard` (prop `context`), `createContextKey`, przeniesiony `widgetsKey`. Zadania 11 i 12 rozbudują `DashboardGrid` i `ContextDashboard`.

**Kroki:**

- [ ] **1. Zależność.** `pnpm --filter @one-place/extension add @vueuse/core@^14`
- [ ] **2. Siatka.** `grid.ts`: `ROW_HEIGHT = 40`, `GRID_GAP = 10` i `widgetHeight(h)`. `use-narrow-screen.ts`: `useBreakpoints(breakpointsTailwind).smaller('md')`. `DashboardGrid.vue`: na wąskim ekranie kolumna `WidgetFrame` w kolejności `columnOrder`, każdy o wysokości `widgetHeight(h)`, a na szerokim CSS grid z `repeat(12, minmax(0, 1fr))`, `grid-auto-rows: 40px`, `gap` i `padding` 10 px oraz położeniem z `compactLayout`.
- [ ] **3. Pulpit kontekstu.** `ContextDashboard.vue`: `useWidgets(() => props.context.id)`, szkielety albo błąd z „Spróbuj ponownie”, gdy nie ma danych, `UEmpty` z nazwą i ikoną kontekstu dla pustej listy i `DashboardGrid` dla reszty. W `DashboardScreen.vue` zamień `UEmpty` aktywnego kontekstu na `<ContextDashboard v-else-if="active" :context="active" />`.
- [ ] **4. Sprawdzenie ręczne** (`pnpm dev`). Widgetów nie da się jeszcze dodać z UI, więc wstaw je w bazie (wpisz swój e-mail):

  ```bash
  docker compose exec db psql -U one one_place -c "insert into widgets (id, user_id, context_id, type, config, x, y, w, h) select gen_random_uuid(), c.user_id, c.id, v.type, v.config::jsonb, v.x, v.y, v.w, v.h from contexts c join \"user\" u on u.id = c.user_id cross join (values ('todo', '{}', 0, 0, 4, 6), ('todo', '{\"title\": \"Zakupy\"}', 4, 0, 4, 6), ('notes', '{}', 8, 0, 4, 4), ('todo', '{\"title\": \"Pod spodem\"}', 0, 10, 6, 4)) as v(type, config, x, y, w, h) where c.name = 'Praca' and u.email = 'twoj@email.pl'"
  ```

  Przejdź na inną kartę i wróć. **Oczekiwany wynik:** „Zadania”, „Zakupy” i komunikat o nowszej wersji w pierwszym rzędzie, a „Pod spodem” zaraz pod nimi, na `y: 6` zamiast zapisanego `y: 10`. Zwęź okno poniżej 768 px: jedna kolumna w kolejności Zadania, Zakupy, nieznany widget, Pod spodem.

- [ ] **5. Eksperyment: nowy kontekst.** Otwórz „Konteksty”, dodaj kontekst „Hobby” i spójrz na pulpit. **Oczekiwany wynik:** „Nie udało się wczytać danych.” zamiast pustego pulpitu, a w DevTools → Network `GET /api/contexts/<id>/widgets` z odpowiedzią 404. Po kliknięciu „Spróbuj ponownie” pulpit jest już pusty, jak powinien. Zastanów się, skąd 404, zanim otworzysz wyjaśnienie.
- [ ] **6. Czerwony test** w `src/queries/widgets.test.ts`: po `mutate` z `useCreateContext` (odpowiedź API wstrzymana przez `deferred`) `useWidgets('hobby')` od razu ma `[]` i nie woła API, a po odpowiedzi 201 woła je raz. Rozszerz mock o `contexts.$post` i `contexts[':id'].widgets.$get`. Oczekiwany wynik: **FAIL** (`expected "vi.fn()" to not be called at all`).
- [ ] **7. Poprawka.**
  - Utwórz `queries/keys.ts` z `createContextKey` i przenieś do niego `widgetsKey`. Oba pliki zapytań będą potrzebować kluczy drugiego, a wspólny plik zapobiega cyklowi importów. Popraw importy (także w testach).
  - `useCreateContext` dostaje `mutationKey: createContextKey`, w `onMutate` zapisuje w cache pustą listę widgetów nowego kontekstu, a w `onError` ją usuwa.
  - `useWidgets` czyta przez `useMutationState` ID kontekstów, które czekają na zapis, i wyłącza dla nich zapytanie.

  Oczekiwany wynik: **PASS (69 testów w rozszerzeniu)**. Powtórz krok 5: pusty pulpit od razu i żadnego 404.

- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): show widgets in a grid with a one-column view`.

**Pułapki (sprawdzone na prototypie):**

- **Ta sama geometria co w `grid-layout-plus`.** Biblioteka liczy szerokość kolumny jako `(szerokość − margines × 13) / 12` i ustawia widget w odległości `margines + x × (kolumna + margines)` od lewej. CSS grid z `padding` i `gap` równymi marginesowi daje te same liczby, co sprawdzisz co do piksela w zadaniu 12.
- **`grid-row` liczy od 1.** Widget z `y: 0` zaczyna się w wierszu 1: `grid-row: ${y + 1} / span ${h}`. To samo dotyczy kolumn.
- **Przerwy znikają w podglądzie.** Zapisane `y: 10` pod widgetami wysokimi na 6 wierszy to przerwa po usuniętym widgecie. `compactLayout` dosuwa widget tak samo jak edytor, a zapisze to dopiero edytor (zadanie 12).
- **Szkielety tylko przy pierwszym otwarciu kontekstu.** Każdy kontekst ma własny wpis w cache, więc kontekst otwarty wcześniej (także w poprzedniej karcie) pokazuje widgety od razu, a odświeża je w tle.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 5)</summary>

- `useAddContext` z Etapu 2 dodaje kontekst do cache i od razu go wybiera. Pulpit przełącza się na nowy kontekst w tej samej klatce, a `useWidgets` widzi nowy klucz bez danych i wysyła `GET`.
- Żądanie `POST /api/contexts` jest w tym momencie w drodze albo czeka w kolejce. API nie zna jeszcze kontekstu, więc odpowiada 404 `Context not found`. Zapytanie nie ponawia błędów 4xx (Etap 2), więc zostaje w stanie błędu.
- Nowy kontekst na pewno nie ma widgetów, więc nie trzeba o nie pytać: wystarczy wpisać do cache pustą listę. Zapytanie zaczeka, aż mutacja tworzenia się skończy, i dopiero wtedy sprawdzi stan na serwerze. Offline wstrzymana mutacja trzyma zapytanie wyłączone, a pulpit i tak pokazuje pustą listę.

</details>

<details>
<summary>Podpowiedź</summary>

- `useMutationState({ filters: { mutationKey: createContextKey, status: 'pending' }, select: (mutation) => (mutation.state.variables as CreateContextInput).id })` daje `Ref<string[]>` z ID kontekstów w trakcie zapisu.
- `enabled: computed(() => { const id = toValue(contextId); return id !== null && !unsaved.value.includes(id) })`.
- `onMutate` w `useCreateContext` stanie się funkcją `async`: najpierw `const rollback = await changeOptimistically(…)`, potem `setQueryData`, na końcu `return rollback`.
- W teście wywołaj `mutate` przed `withQueryClient(queryClient, () => useWidgets('hobby'))`, tak jak w aplikacji: najpierw dodanie, potem pulpit nowego kontekstu.

</details>

<details>
<summary>Rozwiązanie: siatka i pulpit</summary>

`apps/extension/src/features/dashboard/grid.ts`

```ts
// Shared by the grid in preview (CSS grid) and in edit mode (grid-layout-plus), so a widget does
// not move when the mode changes. grid-layout-plus puts `GRID_GAP` around and between widgets.
export const ROW_HEIGHT = 40
export const GRID_GAP = 10

// The height of a widget `h` rows tall, gaps between its rows included
export function widgetHeight(h: number) {
  return h * ROW_HEIGHT + (h - 1) * GRID_GAP
}
```

`apps/extension/src/features/dashboard/use-narrow-screen.ts`

```ts
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

// F-GRID-05: below 768 px (Tailwind's `md`) the widgets are in one column and cannot be edited
export function useNarrowScreen() {
  return useBreakpoints(breakpointsTailwind).smaller('md')
}
```

`apps/extension/src/features/dashboard/DashboardGrid.vue` (stan po tym zadaniu; zadanie 12 doda edytor)

```vue
<script setup lang="ts">
import { GRID_COLUMNS, type WidgetDto } from '@one-place/shared'
import { computed } from 'vue'
import { GRID_GAP, ROW_HEIGHT, widgetHeight } from './grid'
import { columnOrder, compactLayout } from './layout'
import { useNarrowScreen } from './use-narrow-screen'
import WidgetFrame from './WidgetFrame.vue'

const props = defineProps<{ widgets: WidgetDto[] }>()

// F-GRID-05: one column, in the reading order of the grid
const narrow = useNarrowScreen()

// The saved layout may have gaps (e.g. after a widget was deleted). The editor would close them,
// so the preview does the same.
const layout = computed(() => compactLayout(props.widgets))
const column = computed(() => columnOrder(layout.value))
</script>

<template>
  <div v-if="narrow" class="flex flex-col" :style="{ gap: `${GRID_GAP}px` }">
    <div
      v-for="widget in column"
      :key="widget.id"
      :style="{ height: `${widgetHeight(widget.h)}px` }"
    >
      <WidgetFrame :widget="widget" :edit-mode="false" />
    </div>
  </div>
  <!-- The same geometry as grid-layout-plus: GRID_GAP around and between the cells -->
  <div
    v-else
    class="grid"
    :style="{
      gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
      gridAutoRows: `${ROW_HEIGHT}px`,
      gap: `${GRID_GAP}px`,
      padding: `${GRID_GAP}px`,
    }"
  >
    <div
      v-for="widget in layout"
      :key="widget.id"
      :style="{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }"
    >
      <WidgetFrame :widget="widget" :edit-mode="false" />
    </div>
  </div>
</template>
```

`apps/extension/src/features/dashboard/ContextDashboard.vue` (stan po tym zadaniu)

```vue
<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import { useWidgets } from '@/queries/widgets'
import DashboardGrid from './DashboardGrid.vue'

const props = defineProps<{ context: ContextDto }>()
const { t } = useI18n()
const { data: widgets, isError, refetch } = useWidgets(() => props.context.id)
</script>

<template>
  <!-- F-SYNC-02: the widgets of this context are not in the cache yet -->
  <template v-if="!widgets">
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
  <UEmpty
    v-else-if="widgets.length === 0"
    :icon="context.icon"
    :title="context.name"
    :description="t('dashboard.empty')"
    class="mt-16"
  />
  <DashboardGrid v-else :widgets="widgets" />
</template>
```

`apps/extension/src/features/dashboard/DashboardScreen.vue` (nowy import i zmieniona gałąź szablonu)

```ts
import ContextDashboard from './ContextDashboard.vue'
```

```vue
<FirstContext v-else-if="contexts.length === 0" />
<ContextDashboard v-else-if="active" :context="active" />
```

</details>

<details>
<summary>Rozwiązanie: nowy kontekst</summary>

`apps/extension/src/queries/keys.ts`

```ts
// Keys used by more than one file in queries/. Here, so contexts.ts and widgets.ts do not
// import each other.

// Lets useWidgets() find contexts that are in the cache but not saved by the API yet
export const createContextKey = ['contexts', 'create'] as const

// One cache entry per context, so switching back to a context shows its widgets at once
export function widgetsKey(contextId: string) {
  return ['widgets', contextId] as const
}
```

`apps/extension/src/queries/widgets.ts` (nowe importy, usunięty `widgetsKey` i nowy `useWidgets`)

```ts
import type {
  CreateContextInput,
  CreateWidgetInput,
  LayoutItem,
  UpdateWidgetInput,
  WidgetDto,
} from '@one-place/shared'
import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/vue-query'
import { createContextKey, widgetsKey } from './keys'

// …

export function useWidgets(contextId: MaybeRefOrGetter<string | null>) {
  // A context created in this tab is in the cache before the API saves it. Asking for its widgets
  // earlier would get 404, so the query waits. Until then the cache has [] from useCreateContext().
  const unsaved = useMutationState({
    filters: { mutationKey: createContextKey, status: 'pending' },
    select: (mutation) => (mutation.state.variables as CreateContextInput).id,
  })
  return useQuery({
    queryKey: computed(() => widgetsKey(toValue(contextId) ?? '')),
    queryFn: ({ queryKey: [, id] }) =>
      parseResponse(apiClient.api.contexts[':id'].widgets.$get({ param: { id } })),
    enabled: computed(() => {
      const id = toValue(contextId)
      return id !== null && !unsaved.value.includes(id)
    }),
  })
}
```

`apps/extension/src/queries/contexts.ts` (nowe importy i zmieniony `useCreateContext`)

```ts
import type {
  ContextDto,
  CreateContextInput,
  UpdateContextInput,
  WidgetDto,
} from '@one-place/shared'
import { createContextKey, widgetsKey } from './keys'

// …

export function useCreateContext() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: createContextKey,
    mutationFn: (input: CreateContextInput) =>
      parseResponse(apiClient.api.contexts.$post({ json: input })),
    onMutate: async (input) => {
      const now = new Date().toISOString()
      const draft: ContextDto = { ...input, createdAt: now, updatedAt: now, version: 1 }
      const rollback = await changeOptimistically<ContextDto[]>(queryClient, contextsKey, (list) =>
        withContext(list, draft),
      )
      // A new context has no widgets. Its dashboard shows that at once, also offline.
      queryClient.setQueryData<WidgetDto[]>(widgetsKey(input.id), [])
      return rollback
    },
    onError: (_error, input, rollback) => {
      rollback?.()
      queryClient.removeQueries({ queryKey: widgetsKey(input.id) })
    },
    onSuccess: (saved) =>
      queryClient.setQueryData<ContextDto[]>(contextsKey, (list = []) => withContext(list, saved)),
  })
}
```

`apps/extension/src/queries/widgets.test.ts` (nowe importy, rozszerzony mock i nowy blok na końcu)

```ts
import { contextsKey, useCreateContext } from './contexts'
import { widgetsKey } from './keys'
import {
  useCreateWidget,
  useDeleteWidget,
  useSaveLayout,
  useUpdateWidgetConfig,
  useWidgets,
} from './widgets'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  createContext: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  apiClient: {
    api: {
      contexts: {
        $post: api.createContext,
        ':id': { widgets: { $get: api.get, $post: api.post }, layout: { $put: api.put } },
      },
      widgets: { ':id': { $patch: api.patch, $delete: api.delete } },
    },
  },
}))

// …

describe('useWidgets', () => {
  it('waits with the widgets of a new context until the API saves the context', async () => {
    const saved = deferred<Response>()
    api.createContext.mockReturnValue(saved.promise)
    api.get.mockResolvedValue(jsonResponse(200, []))
    queryClient.setQueryData(contextsKey, [])
    const input = { id: 'hobby', name: 'Hobby', icon: 'i-lucide-music', position: 'a0' } as const
    const { mutate } = withQueryClient(queryClient, useCreateContext)

    mutate(input)
    // The dashboard of the new context opens at once, like after useAddContext()
    const { data } = withQueryClient(queryClient, () => useWidgets('hobby'))
    await vi.waitFor(() => expect(data.value).toEqual([]))
    expect(api.get).not.toHaveBeenCalled()

    saved.resolve(jsonResponse(201, { ...input, createdAt: 'now', updatedAt: 'now', version: 1 }))
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledOnce())
  })
})
```

`apps/extension/src/queries/contexts.test.ts` (zmieniony import)

```ts
import { widgetsKey } from './keys'
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego podgląd nie korzysta z `grid-layout-plus` z wyłączonym przeciąganiem?** Biblioteka dokłada do startowego JS około 139 kB, a podgląd potrzebuje tylko ułożyć prostokąty. CSS grid robi to bez JavaScriptu, a ten sam algorytm dosuwania daje te same położenia (decyzja 1).
2. **Co pokaże pulpit nowego kontekstu, gdy jego zapis się nie uda?** Kontekst zniknie z listy (cofnięcie z Etapu 2), a `onError` usunie jego pustą listę widgetów z cache. Pulpit przełączy się na pierwszy kontekst, a toast powie, że zmiana została cofnięta.
3. **Dlaczego mutacja dostaje `mutationKey` dopiero teraz?** Wcześniej nikt nie musiał wiedzieć, że tworzenie kontekstu trwa. `useMutationState` szuka mutacji po kluczu, więc to jej „adres” dla innych części aplikacji.

</details>

---

## Zadanie 11: katalog widgetów, dodawanie i tryb edycji

**Cel:** przycisk „Edytuj pulpit” w nagłówku włącza tryb edycji, który nie jest zapamiętywany (F-GRID-02). „Dodaj widget” (w trybie edycji i na pustym pulpicie) otwiera katalog typów z nazwą, ikoną i opisem (F-WGT-01). Nowy widget trafia pod istniejące, z domyślnym rozmiarem i konfiguracją (F-WGT-02). Na wąskim ekranie edycji nie ma (F-GRID-05).

**Czego się nauczysz:** stan tylko w pamięci w store Pinia, `aria-pressed`, leniwy modal z kolejnym przyciskiem, ikony zapisane w plikach `.ts`.

**Pliki:**

- Utwórz: `apps/extension/src/features/widgets/use-add-widget.ts`, `apps/extension/src/features/widgets/WidgetCatalog.vue`
- Zmień: `apps/extension/src/stores/ui.ts`, `apps/extension/src/features/dashboard/AppHeader.vue`, `ContextDashboard.vue`, `DashboardScreen.vue`, `apps/extension/nuxt-ui.config.ts`, `apps/extension/src/i18n/pl.json`, `en.json`
- Test: `apps/extension/src/stores/ui.test.ts`

**Interfejsy:**

- Korzysta z: `widgetRegistry` (zadanie 8), `useWidgets`, `useCreateWidget` (zadanie 6), `compactLayout`, `placeNewWidget` (zadanie 7), `useNarrowScreen` (zadanie 10).
- Wytwarza: `editMode` w `useUiStore`, `useAddWidget(contextId)` → funkcja `(type) => void`, komponent `WidgetCatalog` (`v-model:open`, prop `contextId`), zdarzenie `addWidget` w `AppHeader` i `ContextDashboard`. Zadanie 12 użyje `editMode`.

**Kroki:**

- [ ] **1. Czerwony test** w `src/stores/ui.test.ts`: `editMode` ustawione na `true` w jednej karcie jest `false` w nowej karcie po `load()`. Oczekiwany wynik: **FAIL**. Po dodaniu `editMode` (zwykły `ref(false)`, także w `reset()`): **PASS (70 testów w rozszerzeniu)**.
- [ ] **2. Dodawanie.** `use-add-widget.ts`: miejsce z `placeNewWidget(compactLayout(widgets), definition.defaultSize)`, ID z `v7()`, `config: {}` i `mutate` z `useCreateWidget`.
- [ ] **3. Katalog.** `WidgetCatalog.vue`: `UModal` z listą przycisków dla `Object.values(widgetRegistry)`. Kliknięcie dodaje widget i zamyka okno. `DashboardScreen` ładuje katalog leniwie i montuje go przy pierwszym otwarciu, tak jak okno kontekstów.
- [ ] **4. Nagłówek i pusty pulpit.** `AppHeader`: przy aktywnym kontekście i szerokim ekranie przycisk „Edytuj pulpit” / „Gotowe” (`aria-pressed`) oraz, w trybie edycji, „Dodaj widget”, który emituje `addWidget`. `ContextDashboard`: akcja „Dodaj widget” w `UEmpty` pustego pulpitu. Teksty: `dashboard.edit`, `dashboard.done`, `dashboard.addWidget`, `widgets.catalog.title`.
- [ ] **5. Eksperyment: ikona z rejestru.** Zbuduj rozszerzenie, załaduj `.output/chrome-mv3`, zaloguj się i otwórz DevTools → Network. Kliknij „Dodaj widget” na pustym pulpicie. **Oczekiwany wynik:** żądanie do `https://api.iconify.design/lucide.json?icons=list-checks`. Ikona `i-lucide-list-checks` jest w `registry.ts`, a nie w `.vue`.
- [ ] **6. Poprawka.** W `nuxt-ui.config.ts` zamień `scan: true` na `scan: { globInclude: ['src/**/*.{vue,ts}'] }`. Zbuduj i powtórz krok 5: żadnych żądań poza API. Ikony kontekstów nadal przychodzą z `wxt.config.ts`, bo leżą poza `src` rozszerzenia.
- [ ] **7. Sprawdzenie ręczne** (`pnpm dev`):
  - nowy kontekst: pusty pulpit z „Dodaj widget”; po wyborze „Zadania” widget pojawia się od razu;
  - „Edytuj pulpit”: przycisk zmienia się na „Gotowe”, obok jest „Dodaj widget”; kolejny widget trafia pod pierwszy (`x: 0, y: 6`);
  - zwęź okno poniżej 768 px: przyciski edycji znikają;
  - przeładuj kartę: „Edytuj pulpit”, czyli tryb podglądu.
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): add widget catalog and edit mode switch`.

**Pułapki (sprawdzone na prototypie):**

- **Skaner Nuxt UI czyta domyślnie `**/*.{vue,jsx,tsx,md,mdc,mdx}`.** Plik `.ts` z rejestrem jest dla niego niewidoczny. W Etapie 2 ikony kontekstów miały ten sam problem z innego powodu: przychodziły z danych.
- **Miejsce nowego widgetu z ułożonej siatki.** `placeNewWidget` dostaje widgety po `compactLayout`, czyli tak, jak je widać. Zapisane `y` mogą mieć przerwy, a nowy widget i tak zostałby dosunięty, ale w bazie lądowałaby niepotrzebnie duża wartość.
- **`config: {}` wystarczy.** API uzupełnia konfigurację wartościami domyślnymi (zadanie 1), a do czasu odpowiedzi widget robi to samo przez `resolveConfig`. Katalog nie potrzebuje schematu, więc nie ciągnie Zoda.
- **Tryb edycji po zwężeniu okna.** Store może mieć `editMode: true`, ale nagłówek i siatka sprawdzają też szerokość. Po poszerzeniu okna tryb edycji wraca.

<details>
<summary>Podpowiedź</summary>

- W szablonie store'u nie trzeba `.value`: `@click="ui.editMode = !ui.editMode"`.
- Akcje `UEmpty` przyjmują tablicę obiektów z `label`, `icon` i `onClick`, tak jak `UAlert` z Etapu 2.
- `useAddWidget(contextId: MaybeRefOrGetter<string>)` korzysta z `useWidgets(contextId)`, więc widzi te same dane co pulpit i nie wysyła drugiego żądania.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/stores/ui.test.ts` (nowy test na końcu bloku)

```ts
// F-GRID-02: a new tab always opens in preview mode
it('does not remember edit mode', async () => {
  storeInNewTab().editMode = true
  const nextTab = storeInNewTab()
  await nextTab.load()
  expect(nextTab.editMode).toBe(false)
})
```

`apps/extension/src/stores/ui.ts` (fragmenty)

```ts
export const useUiStore = defineStore('ui', () => {
  const activeContextId = ref<string | null>(null)
  // F-GRID-02: only in memory, so every new tab opens in preview mode
  const editMode = ref(false)

  // … load i selectContext bez zmian

  async function reset() {
    activeContextId.value = null
    editMode.value = false
    await activeContextItem.removeValue()
  }

  return { activeContextId, editMode, load, selectContext, reset }
})
```

`apps/extension/src/features/widgets/use-add-widget.ts`

```ts
import type { WidgetType } from '@one-place/shared'
import { v7 as uuidv7 } from 'uuid'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { compactLayout, placeNewWidget } from '@/features/dashboard/layout'
import { useCreateWidget, useWidgets } from '@/queries/widgets'
import { widgetRegistry } from '@/widgets/registry'

export function useAddWidget(contextId: MaybeRefOrGetter<string>) {
  const { data: widgets } = useWidgets(contextId)
  const { mutate } = useCreateWidget()

  return (type: WidgetType) => {
    // F-WGT-02: below the other widgets (as the grid shows them), with the default size and config.
    // The API fills in the config from `{}`, and so does the widget until the API answers.
    const place = placeNewWidget(
      compactLayout(widgets.value ?? []),
      widgetRegistry[type].defaultSize,
    )
    mutate({ contextId: toValue(contextId), id: uuidv7(), type, config: {}, ...place })
  }
}
```

`apps/extension/src/features/widgets/WidgetCatalog.vue`

```vue
<script setup lang="ts">
import type { WidgetType } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import { widgetRegistry } from '@/widgets/registry'
import { useAddWidget } from './use-add-widget'

const props = defineProps<{ contextId: string }>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const addWidget = useAddWidget(() => props.contextId)

// F-WGT-01: every type from the registry, with its name, icon and description
const definitions = Object.values(widgetRegistry)

function add(type: WidgetType) {
  addWidget(type)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="t('widgets.catalog.title')">
    <template #body>
      <ul class="space-y-2">
        <li v-for="definition in definitions" :key="definition.type">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border border-default p-3 text-left hover:bg-elevated"
            @click="add(definition.type)"
          >
            <UIcon :name="definition.icon" class="size-6 shrink-0 text-primary" />
            <span class="min-w-0">
              <span class="block font-medium text-highlighted">{{ t(definition.name) }}</span>
              <span class="block text-sm text-muted">{{ t(definition.description) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </template>
  </UModal>
</template>
```

`apps/extension/src/features/dashboard/AppHeader.vue`

```vue
<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import ContextSwitcher from '@/features/contexts/ContextSwitcher.vue'
import { useUiStore } from '@/stores/ui'
import { useNarrowScreen } from './use-narrow-screen'

defineProps<{ contexts: ContextDto[] | undefined; active: ContextDto | null }>()
const emit = defineEmits<{ manageContexts: []; openSettings: []; addWidget: [] }>()
const { t } = useI18n()
const ui = useUiStore()
const narrow = useNarrowScreen()
</script>

<template>
  <header class="flex h-14 items-center justify-between gap-2 border-b border-default px-4">
    <USkeleton v-if="!contexts" class="h-8 w-40" />
    <ContextSwitcher
      v-else-if="active"
      :contexts="contexts"
      :active="active"
      @manage="emit('manageContexts')"
    />
    <span v-else />
    <div class="flex shrink-0 items-center gap-1">
      <!-- F-GRID-02, F-GRID-05: no edit mode on a narrow screen -->
      <template v-if="active && !narrow">
        <UButton
          v-if="ui.editMode"
          icon="i-lucide-plus"
          :label="t('dashboard.addWidget')"
          color="neutral"
          variant="outline"
          @click="emit('addWidget')"
        />
        <UButton
          :icon="ui.editMode ? 'i-lucide-check' : 'i-lucide-layout-dashboard'"
          :label="ui.editMode ? t('dashboard.done') : t('dashboard.edit')"
          :color="ui.editMode ? 'primary' : 'neutral'"
          :variant="ui.editMode ? 'solid' : 'ghost'"
          :aria-pressed="ui.editMode"
          @click="ui.editMode = !ui.editMode"
        />
      </template>
      <UButton
        icon="i-lucide-settings"
        :aria-label="t('settings.title')"
        color="neutral"
        variant="ghost"
        @click="emit('openSettings')"
      />
    </div>
  </header>
</template>
```

`apps/extension/src/features/dashboard/ContextDashboard.vue` (nowe zdarzenie i akcja pustego pulpitu)

```ts
const emit = defineEmits<{ addWidget: [] }>()
```

```vue
<!-- F-WGT-01: the empty dashboard has its own "Add widget" button -->
<UEmpty
  v-else-if="widgets.length === 0"
  :icon="context.icon"
  :title="context.name"
  :description="t('dashboard.empty')"
  :actions="[
    { label: t('dashboard.addWidget'), icon: 'i-lucide-plus', onClick: () => emit('addWidget') },
  ]"
  class="mt-16"
/>
```

`apps/extension/src/features/dashboard/DashboardScreen.vue` (nowe fragmenty)

```ts
const WidgetCatalog = defineAsyncComponent(() => import('@/features/widgets/WidgetCatalog.vue'))

const catalogOpen = ref(false)
const catalogUsed = ref(false)

function openCatalog() {
  catalogUsed.value = true
  catalogOpen.value = true
}
```

```vue
<AppHeader
  :contexts="contexts"
  :active="active"
  @manage-contexts="openManage"
  @open-settings="openSettings"
  @add-widget="openCatalog"
/>
<!-- … -->
<ContextDashboard v-else-if="active" :context="active" @add-widget="openCatalog" />
<!-- … -->
<WidgetCatalog v-if="catalogUsed && active" v-model:open="catalogOpen" :context-id="active.id" />
```

`apps/extension/nuxt-ui.config.ts` (ostateczny)

```ts
import type ui from '@nuxt/ui/vite'

// The same Nuxt UI options in the build (wxt.config.ts) and in component tests (vitest.config.ts).
// The scanner puts in the bundle the icons it finds in src, also in .ts files (e.g. widget icons
// in registry.ts). Icons from outside src (context icons from shared) are passed in. Any other
// icon would be fetched from the Iconify API.
export function nuxtUiOptions(dataIcons: readonly string[] = []) {
  return {
    router: false,
    colorMode: false,
    ui: { colors: { primary: 'blue', neutral: 'zinc' } },
    icon: { clientBundle: { scan: { globInclude: ['src/**/*.{vue,ts}'] }, icons: [...dataIcons] } },
  } satisfies Parameters<typeof ui>[0]
}
```

Teksty: w `dashboard` klucze `"edit": "Edytuj pulpit"`, `"done": "Gotowe"`, `"addWidget": "Dodaj widget"` (EN: `"Edit dashboard"`, `"Done"`, `"Add widget"`), a w `widgets` grupa `"catalog": { "title": "Dodaj widget" }` (EN: `"Add widget"`).

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego tryb edycji jest w store, skoro nie jest zapamiętywany?** Korzystają z niego nagłówek (przycisk) i pulpit (siatka), czyli komponenty w różnych gałęziach drzewa. Store daje im wspólny stan bez przekazywania propsów i zdarzeń przez `DashboardScreen`.
2. **Czy skanowanie plików `.ts` może dołożyć zbędne ikony?** Może, np. ikony z testów. Skaner dołącza tylko nazwy, które istnieją w kolekcji Lucide, a każda ikona to kilkaset bajtów, więc to tani koszt w porównaniu z żądaniem do zewnętrznego hosta.
3. **Co się stanie, gdy dodasz widget w kontekście, który ma już 50 widgetów?** Widget pojawi się od razu, API odpowie 422, mutacja go cofnie, a toast powie „Osiągnięto limit…”. To ten sam mechanizm co przy 21. kontekście w Etapie 2.

</details>

---

## Zadanie 12: tryb edycji z `grid-layout-plus` (R4)

**Cel:** w trybie edycji widgety można przeciągać za nagłówek ramki i skalować, ale nie poniżej minimalnego rozmiaru typu. Widgety nie nachodzą na siebie i są dosuwane w górę (F-GRID-03). Układ zapisuje się sam po zakończeniu przeciągania albo skalowania (F-GRID-04). Biblioteka ładuje się dopiero przy pierwszym włączeniu edycji.

**Czego się nauczysz:** `GridLayout` i `GridItem`, lokalna kopia danych dla biblioteki, która zmienia tablicę w miejscu, `useDebounceFn`, zdarzenia biblioteki, które nie znaczą tego, co sugeruje nazwa, zmienne CSS biblioteki.

**Pliki:**

- Utwórz: `apps/extension/src/features/dashboard/GridEditor.vue`
- Zmień: `apps/extension/src/features/dashboard/DashboardGrid.vue`, `ContextDashboard.vue`

**Interfejsy:**

- Korzysta z: `useSaveLayout` (zadanie 6), `compactLayout`, `changedLayout` (zadanie 7), `findWidgetDefinition` (zadanie 8), `WidgetFrame` (zadanie 9), `ROW_HEIGHT`, `GRID_GAP` (zadanie 10), `editMode` (zadanie 11).
- Wytwarza: `GridEditor` (propsy `contextId` i `widgets`), `DashboardGrid` z propsami `contextId`, `widgets` i `editMode`.

**Kroki:**

- [ ] **1. Edytor.** `GridEditor.vue`: lokalna tablica `layout` z elementami `{ i, x, y, w, h, minW, minH }` budowana z `compactLayout(widgets)` i odświeżana przez `watch` po każdej zmianie propsa `widgets`. `GridLayout` z `v-model:layout`, `col-num` 12, `row-height` i `margin` z `grid.ts`, `vertical-compact`, `is-draggable`, `is-resizable`. W każdym `GridItem` z `drag-allow-from=".widget-drag-handle"` jest `WidgetFrame` w trybie edycji.
- [ ] **2. Podłączenie.** `DashboardGrid` dostaje propsy `contextId` i `editMode` oraz leniwy `GridEditor` (`defineAsyncComponent`) między widokiem jednokolumnowym a podglądem: `v-else-if="editMode"`. `ContextDashboard` przekazuje `context.id` i `ui.editMode`.
- [ ] **3. Eksperyment: zapis każdego zgłoszenia.** Dodaj zapis wprost: `@layout-updated` woła `useDebounceFn` (500 ms), który wysyła **cały** układ przez `useSaveLayout`. Zbuduj albo uruchom `pnpm dev`, wejdź w tryb edycji na pulpicie z widgetem i patrz w DevTools → Network, niczego nie dotykając. **Oczekiwany wynik:** `PUT /api/contexts/<id>/layout` mniej więcej dwa razy na sekundę, bez końca. Zastanów się, co zamyka pętlę, zanim otworzysz wyjaśnienie.
- [ ] **4. Poprawka.** W funkcji zapisu porównaj układ z cache: `changedLayout(props.widgets, …)` i wysyłaj tylko niepustą różnicę. Powtórz krok 3: zero żądań bez ruchu.
- [ ] **5. Sprawdzenie ręczne** (`pnpm dev`, na pulpicie widgety z zadania 10):
  - włącz i wyłącz edycję kilka razy: widgety nie przesuwają się ani o piksel; pierwsze włączenie wysyła jeden `PUT` z widgetem „Pod spodem” (`y: 6` zamiast `10`), kolejne nic;
  - przeciągnij widget za nagłówek w prawo: jeden `PUT` z nowym `x`; przeciąganie za treść widgetu nic nie robi;
  - zmniejsz widget uchwytem w prawym dolnym rogu: nie da się zejść poniżej 3×3;
  - podczas przeciągania miejsce docelowe ma kolor akcentu, a nie czerwony;
  - kliknij „Gotowe”, przeładuj kartę: układ zostaje, karta jest w podglądzie.
- [ ] **6. Pomiar.** `pnpm --filter @one-place/extension build && pnpm size`. Oczekiwany wynik: **około 489 kB**, a w liście plików z buildu osobny `GridEditor-….js` (około 140 kB).
- [ ] **7. Ocena R4.** Zapisz w notatkach do zadania 16, co widzisz: wersja biblioteki, data ostatniego wydania i aktywność repozytorium (`npm view grid-layout-plus time`), działanie z bieżącym Vue, ostrzeżenia w konsoli, rozmiar chunka i zachowanie w trybie edycji. Na prototypie: 1.1.1 (październik 2025), 2.0 w becie, commity z października 2026, Vue 3.5.43 bez ostrzeżeń.
- [ ] **8.** `pnpm format && pnpm check`, potem commit: `feat(extension): edit the layout with grid-layout-plus`.

**Pułapki (sprawdzone na prototypie):**

- **Nie dawaj bibliotece tablicy z cache.** `grid-layout-plus` przesuwa elementy w przekazanej tablicy w trakcie przeciągania. Tablica z TanStack Query zmieniłaby się bez wiedzy cache, a cofnięcie zmiany nie miałoby do czego wrócić. To ta sama lekcja co z `VueDraggable` w Etapie 2.
- **Przeciąganie tylko za nagłówek.** `drag-allow-from=".widget-drag-handle"` wskazuje nagłówek ramki. Domyślne `drag-ignore-from: 'a, button'` sprawia, że przycisk menu w nagłówku (zadanie 13) nie zaczyna przeciągania.
- **CSS biblioteki przychodzi w JavaScripcie.** Wersja 1.x wstawia własny `<style>` przy imporcie. CSP stron rozszerzenia w MV3 ogranicza skrypty, a nie style, więc to działa. Kolor miejsca docelowego zmienia zmienna `--vgl-placeholder-bg`.
- **Edytor ładuje się raz.** Pierwsze włączenie edycji pobiera chunk (na prototypie edytor był widoczny po około 50 ms od kliknięcia), kolejne korzystają z załadowanego modułu.
- **Zmiana kontekstu w trybie edycji.** Prop `widgets` dostaje wtedy nową tablicę, `watch` buduje nowy `layout`, a biblioteka zgłasza „nowy układ”. Porównanie z cache nowego kontekstu nie znajduje różnic, więc nic nie zostaje wysłane.

<details>
<summary>Wyjaśnienie eksperymentu (otwórz po kroku 3)</summary>

- `layout-updated` nie znaczy „użytkownik coś przesunął”. Biblioteka emituje je po zamontowaniu (po dosunięciu widgetów), po zakończeniu przeciągania i skalowania oraz po **każdej** zmianie propsa `layout`.
- Zapis jest optymistyczny, a odpowiedź API podmienia listę widgetów w cache. `watch` na `props.widgets` buduje z niej nową tablicę `layout`, biblioteka zgłasza `layout-updated`, a debounce po 500 ms wysyła kolejny zapis. Każda odpowiedź uruchamia następne żądanie.
- `changedLayout` przerywa pętlę: po odpowiedzi API układ w edytorze jest taki sam jak w cache, więc nie ma czego wysłać. Ten sam warunek sprawia, że kliknięcie bez przesunięcia niczego nie zapisuje.

</details>

<details>
<summary>Podpowiedź</summary>

- Element dla biblioteki: `{ i: id, x, y, w, h, minW: min.w, minH: min.h }`, gdzie `min` to `findWidgetDefinition(type)?.minSize ?? { w: 1, h: 1 }`.
- `GridItem` przyjmuje te pola jako propsy, więc wystarczy `v-bind="item"`.
- Widget do ramki: `computed` z mapą `id → WidgetDto` zbudowaną z `props.widgets`.
- Zmienne CSS biblioteki ustawisz w `<style scoped>` na klasie przekazanej do `GridLayout`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/features/dashboard/GridEditor.vue`

```vue
<script setup lang="ts">
import { GRID_COLUMNS, type WidgetDto } from '@one-place/shared'
import { useDebounceFn } from '@vueuse/core'
import { GridItem, GridLayout } from 'grid-layout-plus'
import { computed, ref, watch } from 'vue'
import { useSaveLayout } from '@/queries/widgets'
import { findWidgetDefinition } from '@/widgets/registry'
import { GRID_GAP, ROW_HEIGHT } from './grid'
import { changedLayout, compactLayout } from './layout'
import WidgetFrame from './WidgetFrame.vue'

// The only file that knows grid-layout-plus (risk R4). It is loaded lazily, when edit mode
// is switched on for the first time.
const props = defineProps<{ contextId: string; widgets: WidgetDto[] }>()
const { mutate: saveLayout } = useSaveLayout()

interface EditorItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW: number
  minH: number
}

function toEditorLayout(widgets: WidgetDto[]): EditorItem[] {
  return compactLayout(widgets).map(({ id, type, x, y, w, h }) => {
    // F-GRID-03: no smaller than the minimum size of the type
    const min = findWidgetDefinition(type)?.minSize ?? { w: 1, h: 1 }
    return { i: id, x, y, w, h, minW: min.w, minH: min.h }
  })
}

// grid-layout-plus moves items in this copy while dragging. The cache changes only on save, and
// a new cache (a save, a rollback or a refetch) replaces the copy.
const layout = ref<EditorItem[]>([])
watch(
  () => props.widgets,
  (widgets) => {
    layout.value = toEditorLayout(widgets)
  },
  { immediate: true },
)

const widgetsById = computed(() => new Map(props.widgets.map((widget) => [widget.id, widget])))

// F-GRID-04. grid-layout-plus reports a new layout after a drag or resize, but also on mount and
// after every change of `layout`, so only a real difference from the cache is saved.
const save = useDebounceFn(() => {
  const current = layout.value.map(({ i, x, y, w, h }) => ({ id: i, x, y, w, h }))
  const items = changedLayout(props.widgets, current)
  if (items.length > 0) saveLayout({ contextId: props.contextId, items })
}, 500)
</script>

<template>
  <GridLayout
    v-model:layout="layout"
    :col-num="GRID_COLUMNS"
    :row-height="ROW_HEIGHT"
    :margin="[GRID_GAP, GRID_GAP]"
    vertical-compact
    is-draggable
    is-resizable
    class="grid-editor"
    @layout-updated="save"
  >
    <GridItem
      v-for="item in layout"
      :key="item.i"
      v-bind="item"
      drag-allow-from=".widget-drag-handle"
    >
      <WidgetFrame v-if="widgetsById.get(item.i)" :widget="widgetsById.get(item.i)!" edit-mode />
    </GridItem>
  </GridLayout>
</template>

<style scoped>
/* The place where a dragged widget will land, in the accent color instead of red */
.grid-editor {
  --vgl-placeholder-bg: var(--ui-primary);
}
</style>
```

`apps/extension/src/features/dashboard/DashboardGrid.vue` (ostateczny `<script setup>` i nowa gałąź szablonu)

```ts
import { GRID_COLUMNS, type WidgetDto } from '@one-place/shared'
import { computed, defineAsyncComponent } from 'vue'
import { GRID_GAP, ROW_HEIGHT, widgetHeight } from './grid'
import { columnOrder, compactLayout } from './layout'
import { useNarrowScreen } from './use-narrow-screen'
import WidgetFrame from './WidgetFrame.vue'

const props = defineProps<{ contextId: string; widgets: WidgetDto[]; editMode: boolean }>()

// grid-layout-plus adds about 140 kB, needed only in edit mode
const GridEditor = defineAsyncComponent(() => import('./GridEditor.vue'))

// F-GRID-05: one column, in the reading order of the grid
const narrow = useNarrowScreen()

// The saved layout may have gaps (e.g. after a widget was deleted). The editor would close them,
// so the preview does the same.
const layout = computed(() => compactLayout(props.widgets))
const column = computed(() => columnOrder(layout.value))
```

```vue
<div v-if="narrow" class="flex flex-col" :style="{ gap: `${GRID_GAP}px` }">
  <!-- … bez zmian -->
</div>
<GridEditor v-else-if="editMode" :context-id="contextId" :widgets="widgets" />
<!-- The same geometry as grid-layout-plus: GRID_GAP around and between the cells -->
<div v-else class="grid" …>
  <!-- … bez zmian -->
</div>
```

`apps/extension/src/features/dashboard/ContextDashboard.vue` (nowy import, store i zmieniona linia szablonu)

```ts
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
```

```vue
<DashboardGrid v-else :context-id="context.id" :widgets="widgets" :edit-mode="ui.editMode" />
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego pierwsze włączenie edycji wysyła zapis, choć niczego nie przesunięto?** Zapisany układ miał przerwę (`y: 10`). Edytor dosuwa widgety i zgłasza nowy układ, a `changedLayout` widzi różnicę z cache. Od tej chwili baza ma te same położenia, które widać na ekranie.
2. **Co się stanie z widgetem, gdy API odrzuci zapis układu?** Mutacja cofnie zmianę w cache, `watch` zbuduje z niego nowy `layout`, a widget wróci na poprzednie miejsce. Toast powie „Serwer odrzucił zmianę”. Sprawdzisz to w zadaniu 15.
3. **Jak wymienić `grid-layout-plus` na inną bibliotekę (plan awaryjny R4)?** Wystarczy nowy `GridEditor.vue` z tymi samymi propsami: przyjmuje `widgets`, zapisuje przez `useSaveLayout` tylko różnicę z cache i umieszcza `WidgetFrame` w trybie edycji. Podgląd, ramka i zapytania nie znają biblioteki.

</details>

---

## Zadanie 13: menu widgetu, ustawienia i usuwanie

**Cel:** każdy widget ma menu: w trybie edycji w nagłówku ramki, w podglądzie w jej prawym górnym rogu. „Ustawienia” (jeśli typ je ma) otwierają modal (F-WGT-04), a „Usuń” wymaga potwierdzenia (F-WGT-03). Widget nieznanego typu można usunąć (F-WGT-06). Menu ładuje się przy pierwszym kliknięciu (decyzja 2).

**Czego się nauczysz:** komponent montowany przy pierwszym użyciu z `v-model:open`, `UDropdownMenu` sterowane z zewnątrz, formularz w modalu, test komponentu z formularzem i walidacją.

**Pliki:**

- Utwórz: `apps/extension/src/features/dashboard/WidgetActions.vue`, `apps/extension/src/widgets/todo/TodoSettings.vue`
- Zmień: `apps/extension/src/features/dashboard/WidgetFrame.vue`, `apps/extension/src/widgets/registry.ts`, `apps/extension/src/i18n/pl.json`, `en.json`
- Test: `apps/extension/src/widgets/todo/TodoSettings.test.ts`

**Interfejsy:**

- Korzysta z: `useUpdateWidgetConfig`, `useDeleteWidget` (zadanie 6), `resolveConfig`, `WidgetDefinition` (zadanie 8), `WidgetFrame` (zadanie 9), `formErrors` (Etap 1).
- Wytwarza: `WidgetActions` (propsy `widget` i `definition`, `v-model:open`), `TodoSettings` (prop `widget`, zdarzenie `save` z nową konfiguracją), `settingsComponent` typu `todo`, klucze `widgets.menu.*`, `widgets.settings.*`, `widgets.delete.*`, `widgets.todo.settings.*` i `validation.widgetTitleTooLong`.

**Kroki:**

- [ ] **1. Czerwone testy** w `src/widgets/todo/TodoSettings.test.ts` (happy-dom, prawdziwy Nuxt UI i i18n jak w zadaniu 9):
  - tytuł `'  Zakupy  '` wysłany dla konfiguracji `{ title: 'Stary', hideCompleted: true }` emituje `save` z `{ title: 'Zakupy', hideCompleted: true, source: { type: 'local' } }`;
  - tytuł z 61 znaków nie emituje `save`, a formularz pokazuje komunikat z „at most 60 characters”.

  Oczekiwany wynik: **FAIL**.

- [ ] **2. Ustawienia Zadań.** `TodoSettings.vue`: konfiguracja z `resolveConfig`, `UForm` z `:validate="formErrors(TodoConfigSchema, t)"`, jedno pole „Tytuł” z podpowiedzią i przycisk „Zapisz”. Przy wysyłce `emit('save', TodoConfigSchema.parse({ ...config, ...state }))`. W `registry.ts` dodaj `settingsComponent: () => import('./todo/TodoSettings.vue')`. Teksty `widgets.todo.settings.*`, `widgets.settings.save` i `validation.widgetTitleTooLong`. Oczekiwany wynik: **PASS (72 testy w rozszerzeniu)**.
- [ ] **3. Menu.** `WidgetActions.vue`: `UDropdownMenu` z `v-model:open` i przyciskiem `i-lucide-ellipsis`, pozycje „Ustawienia” (tylko gdy definicja ma `settingsComponent`) i „Usuń”, modal ustawień z leniwym komponentem ustawień typu i modal potwierdzenia usunięcia. Zapis ustawień woła `useUpdateWidgetConfig`, a potwierdzenie `useDeleteWidget`.
- [ ] **4. Ramka.** W `WidgetFrame` dodaj w prawym górnym rogu (`absolute end-1.5 top-1.5`) zwykły `UButton` z tą samą ikoną. Kliknięcie ustawia `menuUsed` i `menuOpen` na `true`, a od tej chwili zamiast przycisku jest leniwy `WidgetActions` z `v-model:open="menuOpen"`. Nagłówek w trybie edycji dostaje `pe-10`, żeby tytuł nie wchodził pod przycisk.
- [ ] **5. Eksperyment: menu na ścieżce startowej.** Zaimportuj na chwilę `WidgetActions` w ramce statycznie (`import WidgetActions from './WidgetActions.vue'` zamiast `defineAsyncComponent`), zbuduj i uruchom `pnpm size`. **Oczekiwany wynik: około 633 kB, czyli +142 kB i ponad budżet.** `UDropdownMenu` ciągnie warstwę menu z `reka-ui` i pozycjonowanie z `@floating-ui`, a `UModal` warstwę okien. Przywróć leniwy import.
- [ ] **6. Sprawdzenie ręczne** (`pnpm dev`):
  - kliknij menu widgetu: otwiera się za pierwszym razem (na prototypie po około 60 ms), z pozycjami „Ustawienia” i „Usuń”;
  - „Ustawienia” → tytuł z 61 znaków: komunikat „Tytuł może mieć najwyżej 60 znaków”; tytuł `  Zakupy  `: modal się zamyka, a widget od razu pokazuje „Zakupy”;
  - menu widgetu nieznanego typu ma tylko „Usuń”;
  - w trybie edycji menu jest w nagłówku, a kliknięcie go nie zaczyna przeciągania;
  - „Usuń” → modal „Usunąć widget „Zadania”?” → „Usuń”: widget znika, a reszta się dosuwa.
- [ ] **7.** `pnpm format && pnpm check`, potem commit: `feat(extension): add widget menu with settings and delete`.

**Pułapki (sprawdzone na prototypie):**

- **Pierwsze kliknięcie otwiera menu.** `WidgetActions` montuje się z `open: true`, więc `UDropdownMenu` otwiera się od razu przy swoim przycisku. Przycisk zastępczy i prawdziwy mają ten sam rozmiar i miejsce, więc nic nie skacze.
- **Modale żyją w `WidgetActions`.** Ustawienia i usuwanie korzystają z tych samych komponentów Nuxt UI co menu, więc trafiają do tego samego leniwego chunka. Ramka nie wie o żadnym z nich.
- **Formularz zastępuje całą konfigurację.** `PATCH` przyjmuje pełną konfigurację, a formularz pokazuje tylko tytuł. `{ ...config, ...state }` zachowuje pola, których formularz nie zna (np. `hideCompleted` ustawione na innym urządzeniu).
- **Bez `maxlength` w polu tytułu.** Tytuł z 60 znakami i spacjami na końcu jest poprawny po przycięciu, a `maxlength="60"` nie pozwoliłby ich wpisać. Komunikat walidacji wystarczy.
- **Menu otwarte blokuje resztę strony dla czytników ekranu.** Reka UI ustawia `aria-hidden` poza otwartym menu. W testach Playwright przycisk „Edytuj pulpit” nie jest wtedy widoczny dla `getByRole`, dopóki menu się nie zamknie.

<details>
<summary>Podpowiedź</summary>

- Pozycje menu to `DropdownMenuItem[]` z `label`, `icon`, `color` i `onSelect`. Pozycję warunkową dołożysz przez `...(warunek ? [pozycja] : [])`.
- `defineModel<boolean>('open', { required: true })` w `WidgetActions` przekazujesz dalej do `UDropdownMenu` jako `v-model:open`.
- Komponent ustawień: `const WidgetSettings = settingsLoader ? defineAsyncComponent(settingsLoader) : null` i `<component :is="WidgetSettings" :widget="widget" @save="saveSettings" />`.
- W teście formularza: `await wrapper.get('input').setValue(title)`, `await wrapper.get('form').trigger('submit')`, potem `await flushPromises()`, bo walidacja `UForm` jest asynchroniczna.

</details>

<details>
<summary>Rozwiązanie: ustawienia Zadań</summary>

`apps/extension/src/widgets/todo/TodoSettings.test.ts`

```ts
// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { WidgetDto } from '@one-place/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import TodoSettings from './TodoSettings.vue'

function widget(config: unknown): WidgetDto {
  return {
    id: 'tasks',
    contextId: 'work',
    type: 'todo',
    config,
    x: 0,
    y: 0,
    w: 4,
    h: 6,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
  }
}

async function submitTitle(title: string, config: unknown = {}) {
  const wrapper = mount(TodoSettings, {
    props: { widget: widget(config) },
    global: { plugins: [ui, i18n] },
  })
  await wrapper.get('input').setValue(title)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  return wrapper
}

describe('TodoSettings', () => {
  it('saves the trimmed title and keeps the other fields of the config', async () => {
    const wrapper = await submitTitle('  Zakupy  ', { title: 'Stary', hideCompleted: true })
    expect(wrapper.emitted('save')).toEqual([
      [{ title: 'Zakupy', hideCompleted: true, source: { type: 'local' } }],
    ])
  })

  it('does not save a title longer than 60 characters', async () => {
    const wrapper = await submitTitle('a'.repeat(61))
    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.text()).toContain('at most 60 characters')
  })
})
```

`apps/extension/src/widgets/todo/TodoSettings.vue`

```vue
<script setup lang="ts">
import { TodoConfigSchema, type TodoConfig, type WidgetDto } from '@one-place/shared'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { formErrors } from '@/i18n/form-errors'
import { resolveConfig } from '../config'

// Stage 3 has only the title. Stage 4 adds "Hide completed".
const props = defineProps<{ widget: WidgetDto }>()
const emit = defineEmits<{ save: [config: TodoConfig] }>()

const { t } = useI18n()
const config = resolveConfig(TodoConfigSchema, props.widget.config)
const state = reactive({ title: config.title })
const validate = formErrors(TodoConfigSchema, t)

function onSubmit() {
  // The whole config is replaced, so the fields this form does not show are kept as they were
  emit('save', TodoConfigSchema.parse({ ...config, ...state }))
}
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField
      name="title"
      :label="t('widgets.todo.settings.title')"
      :help="t('widgets.todo.settings.titleHelp')"
    >
      <UInput
        v-model="state.title"
        :placeholder="t('widgets.todo.name')"
        autofocus
        class="w-full"
      />
    </UFormField>
    <UButton type="submit" :label="t('widgets.settings.save')" block />
  </UForm>
</template>
```

`apps/extension/src/widgets/registry.ts` (nowa linia we wpisie `todo`)

```ts
    component: () => import('./todo/TodoWidget.vue'),
    settingsComponent: () => import('./todo/TodoSettings.vue'),
```

</details>

<details>
<summary>Rozwiązanie: menu i ramka</summary>

`apps/extension/src/features/dashboard/WidgetActions.vue`

```vue
<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { WidgetDto } from '@one-place/shared'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDeleteWidget, useUpdateWidgetConfig } from '@/queries/widgets'
import type { WidgetDefinition } from '@/widgets/types'

// Loaded on the first click on the widget's menu button. UDropdownMenu alone adds about 100 kB,
// which the first render of the dashboard does not need.
const props = defineProps<{ widget: WidgetDto; definition: WidgetDefinition | null }>()
const menuOpen = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { mutate: updateConfig } = useUpdateWidgetConfig()
const { mutate: deleteWidget } = useDeleteWidget()

const name = computed(() =>
  props.definition ? t(props.definition.name) : t('widgets.unknown.name'),
)
const settingsLoader = props.definition?.settingsComponent
const WidgetSettings = settingsLoader ? defineAsyncComponent(settingsLoader) : null

const settingsOpen = ref(false)
const deleteOpen = ref(false)

const items = computed<DropdownMenuItem[]>(() => [
  // F-WGT-04: only types with settings have this item
  ...(WidgetSettings
    ? [
        {
          label: t('widgets.menu.settings'),
          icon: 'i-lucide-settings',
          onSelect: () => (settingsOpen.value = true),
        },
      ]
    : []),
  // F-WGT-06: a widget of an unknown type can still be deleted
  {
    label: t('widgets.menu.delete'),
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => (deleteOpen.value = true),
  },
])

function saveSettings(config: Record<string, unknown>) {
  updateConfig({ id: props.widget.id, contextId: props.widget.contextId, config })
  settingsOpen.value = false
}

// F-WGT-03
function confirmDelete() {
  deleteWidget({ id: props.widget.id, contextId: props.widget.contextId })
  deleteOpen.value = false
}
</script>

<template>
  <UDropdownMenu v-model:open="menuOpen" :items="items" :content="{ align: 'end' }">
    <UButton
      icon="i-lucide-ellipsis"
      :aria-label="t('widgets.menu.open')"
      color="neutral"
      variant="ghost"
      size="xs"
    />
  </UDropdownMenu>

  <UModal v-if="WidgetSettings" v-model:open="settingsOpen" :title="t('widgets.settings.title')">
    <template #body>
      <component :is="WidgetSettings" :widget="widget" @save="saveSettings" />
    </template>
  </UModal>

  <UModal
    v-model:open="deleteOpen"
    :title="t('widgets.delete.title', { name })"
    :description="t('widgets.delete.description')"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="t('widgets.delete.cancel')"
          color="neutral"
          variant="outline"
          @click="deleteOpen = false"
        />
        <UButton :label="t('widgets.delete.confirm')" color="error" @click="confirmDelete" />
      </div>
    </template>
  </UModal>
</template>
```

`apps/extension/src/features/dashboard/WidgetFrame.vue` (ostateczny)

```vue
<script setup lang="ts">
import type { WidgetDto } from '@one-place/shared'
import { defineAsyncComponent, onErrorCaptured, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { findWidgetDefinition } from '@/widgets/registry'

const props = defineProps<{ widget: WidgetDto; editMode: boolean }>()
const { t } = useI18n()

// The type of a widget never changes, so the definition is read once
const definition = findWidgetDefinition(props.widget.type)
// The widget's code is loaded only when it is on the dashboard
const WidgetBody = definition ? defineAsyncComponent(definition.component) : null
// The menu (with UDropdownMenu and the modals) is loaded on the first click
const WidgetActions = defineAsyncComponent(() => import('./WidgetActions.vue'))
const menuUsed = ref(false)
const menuOpen = ref(false)

function openMenu() {
  menuUsed.value = true
  menuOpen.value = true
}

const error = ref<unknown>(null)

// F-WGT-05: an error thrown while rendering the widget (or loading its code) stays in its frame.
// Returning false stops it from reaching the rest of the dashboard.
onErrorCaptured((caught) => {
  console.error(`Widget ${props.widget.id} (${props.widget.type}) failed`, caught)
  error.value = caught
  return false
})

// The error message replaced the widget, so clearing it mounts the widget from scratch
function retry() {
  error.value = null
}
</script>

<template>
  <article
    class="relative flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default"
  >
    <header
      v-if="editMode"
      class="widget-drag-handle flex h-9 shrink-0 cursor-move items-center gap-2 border-b border-default bg-elevated ps-2 pe-10 text-sm"
    >
      <UIcon name="i-lucide-grip-vertical" class="size-4 text-dimmed" />
      <UIcon :name="definition?.icon ?? 'i-lucide-puzzle'" class="size-4 text-muted" />
      <span class="truncate">{{
        definition ? t(definition.name) : t('widgets.unknown.name')
      }}</span>
    </header>
    <!-- F-WGT-03, F-WGT-04: in the header in edit mode, in the corner of the widget otherwise -->
    <div class="absolute end-1.5 top-1.5 z-10">
      <WidgetActions
        v-if="menuUsed"
        v-model:open="menuOpen"
        :widget="widget"
        :definition="definition"
      />
      <UButton
        v-else
        icon="i-lucide-ellipsis"
        :aria-label="t('widgets.menu.open')"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="openMenu"
      />
    </div>
    <div class="min-h-0 flex-1 overflow-auto p-3">
      <!-- F-WGT-06 -->
      <UEmpty
        v-if="!WidgetBody"
        icon="i-lucide-puzzle"
        :title="t('widgets.unknown.title')"
        variant="naked"
        size="sm"
      />
      <UEmpty
        v-else-if="error"
        icon="i-lucide-bug"
        :title="t('widgets.error.title')"
        :actions="[
          { label: t('widgets.error.retry'), icon: 'i-lucide-rotate-ccw', onClick: retry },
        ]"
        variant="naked"
        size="sm"
      />
      <component :is="WidgetBody" v-else :widget="widget" />
    </div>
  </article>
</template>
```

</details>

<details>
<summary>Rozwiązanie: teksty</summary>

`pl.json` (nowe klucze w grupie `widgets` i w `validation`)

```json
"todo": {
  "name": "Zadania",
  "description": "Lista rzeczy do zrobienia",
  "settings": {
    "title": "Tytuł",
    "titleHelp": "Pusty tytuł oznacza „Zadania”."
  }
},
"menu": {
  "open": "Opcje widgetu",
  "settings": "Ustawienia",
  "delete": "Usuń"
},
"settings": {
  "title": "Ustawienia widgetu",
  "save": "Zapisz"
},
"delete": {
  "title": "Usunąć widget „{name}”?",
  "description": "Widget i jego dane znikną na wszystkich urządzeniach. Tej operacji nie można cofnąć.",
  "confirm": "Usuń",
  "cancel": "Anuluj"
}
```

```json
"widgetTitleTooLong": "Tytuł może mieć najwyżej 60 znaków"
```

`en.json`

```json
"todo": {
  "name": "Tasks",
  "description": "A list of things to do",
  "settings": {
    "title": "Title",
    "titleHelp": "An empty title shows “Tasks”."
  }
},
"menu": {
  "open": "Widget options",
  "settings": "Settings",
  "delete": "Delete"
},
"settings": {
  "title": "Widget settings",
  "save": "Save"
},
"delete": {
  "title": "Delete the widget “{name}”?",
  "description": "The widget and its data will disappear on all devices. This cannot be undone.",
  "confirm": "Delete",
  "cancel": "Cancel"
}
```

```json
"widgetTitleTooLong": "Title can be at most 60 characters long"
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego modal usuwania mówi „Zadania”, a nie tytuł widgetu, np. „Zakupy”?** Tytuł jest w konfiguracji, a jej schemat zna tylko leniwy komponent widgetu. Menu jest wspólne dla wszystkich typów i nie wie, które pole konfiguracji jest tytułem. Etap 4 albo kolejne widgety mogą dodać do definicji funkcję, która zwraca nazwę z konfiguracji.
2. **Co zobaczy użytkownik, gdy API odrzuci nowy tytuł?** Tytuł zmieni się od razu, po odpowiedzi wróci poprzedni, a toast powie „Zmiana została cofnięta”. To ten sam mechanizm co przy nazwie kontekstu.
3. **Dlaczego ustawienia są osobnym leniwym komponentem, a nie częścią `TodoWidget`?** Widget jest na pulpicie zawsze, a ustawienia otwiera się rzadko. Formularz z `UForm` i `formErrors` ładuje się dopiero przy pierwszym otwarciu ustawień.

</details>

---

## Zadanie 14: liczba widgetów w modalu usuwania kontekstu

**Cel:** modal usuwania kontekstu mówi, ile widgetów zostanie usuniętych (F-CTX-07, decyzja 4 z Etapu 2). Polski tekst ma poprawną formę liczby mnogiej: 1 widget, 3 widgety, 5 widgetów, 22 widgety.

**Czego się nauczysz:** liczba mnoga w vue-i18n (`t(klucz, liczba)`), własna reguła `pluralRules` dla języka z trzema formami, zapytanie uruchamiane dopiero po otwarciu modalu.

**Pliki:**

- Utwórz: `apps/extension/src/i18n/plural.ts`
- Zmień: `apps/extension/src/i18n/index.ts`, `apps/extension/src/features/contexts/ManageContexts.vue`, `apps/extension/src/i18n/pl.json`, `en.json`
- Test: `apps/extension/src/i18n/plural.test.ts`

**Interfejsy:**

- Korzysta z: `useWidgets` (zadanie 6), `i18n` (Etap 1).
- Wytwarza: `polishPluralIndex(count)`, klucz `contexts.delete.widgets` z formami liczby mnogiej.

**Kroki:**

- [ ] **1. Teksty.** W `contexts.delete` dodaj klucz `widgets` z czterema formami po polsku: `"Kontekst nie ma widgetów. | Usunie też 1 widget. | Usunie też {count} widgety. | Usunie też {count} widgetów."` i trzema po angielsku: `"The context has no widgets. | Its widget will be deleted too. | Its {count} widgets will be deleted too."`.
- [ ] **2. Czerwone testy** w `src/i18n/plural.test.ts`:
  - `polishPluralIndex` dla `0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 104, 112` daje `0, 1, 2, 2, 3, 3, 3, 3, 3, 2, 3, 2, 3`;
  - `i18n.global.t('contexts.delete.widgets', 3, { locale: 'pl' })` to `'Usunie też 3 widgety.'`, dla 5 `'Usunie też 5 widgetów.'`, a po angielsku dla 3 `'Its 3 widgets will be deleted too.'`.

  Oczekiwany wynik: **FAIL**, bo moduł `./plural` nie istnieje.

- [ ] **3. Eksperyment: domyślna reguła.** Utwórz `plural.ts` z funkcją, ale nie podłączaj jej jeszcze do `createI18n`. Uruchom testy. **Oczekiwany wynik:** test funkcji przechodzi, a test komunikatów **FAIL** z `'Usunie też 5 widgety.'`. Dla 3 wynik był poprawny przypadkiem.
- [ ] **4. Poprawka.** W `i18n/index.ts` dodaj `pluralRules: { pl: polishPluralIndex }`. Oczekiwany wynik: **PASS (74 testy w rozszerzeniu)**.
- [ ] **5. Modal.** W `ManageContexts.vue`: `useWidgets(() => toDelete.value?.id ?? null)` i `computed` z opisem, który przed stałym tekstem dokłada `t('contexts.delete.widgets', count)`, gdy liczba jest znana.
- [ ] **6. Sprawdzenie ręczne** (`pnpm dev`): drugi kontekst z pięcioma widgetami (dodaj je w nim przez katalog), przełącz się z powrotem na pierwszy i przeładuj kartę. Otwórz „Konteksty” i kliknij usuwanie drugiego: po chwili „Usunie też 5 widgetów.” (lista została pobrana teraz). Anuluj i otwórz usuwanie aktywnego kontekstu z trzema widgetami: od razu „Usunie też 3 widgety.” z cache.
- [ ] **7.** `pnpm format && pnpm check`, potem commit: `feat(extension): show the widget count before deleting a context`.

**Pułapki (sprawdzone na prototypie):**

- **Domyślna reguła vue-i18n zna trzy formy:** zero, jeden i „wiele” (każda liczba od 2). Dla czterech form wybiera najwyżej trzecią, czyli „widgety” także dla 5, 12 i 25.
- **`{count}` bez przekazywania parametru.** vue-i18n przy `t(klucz, liczba)` sam udostępnia w komunikacie `{count}` i `{n}`.
- **Komunikaty są kompilowane przy buildzie.** `@intlify/unplugin-vue-i18n` z Etapu 1 kompiluje też komunikaty z `|`, a `pluralRules` działa na skompilowanych komunikatach tak samo. W testach vue-i18n kompiluje je w trakcie działania.
- **Zapytanie tylko przy otwartym modalu.** `toDelete` jest `null`, dopóki nikt nie kliknie usuwania, więc `useWidgets` jest wyłączone (zadanie 6) i nic nie pobiera.

<details>
<summary>Podpowiedź</summary>

- Forma „kilka” (indeks 2) to ostatnia cyfra 2–4, ale nie końcówki 12–14: `lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)`.
- `t(key, count)` w Composition API vue-i18n wybiera formę po liczbie. Trzeci argument `{ locale: 'pl' }` pozwala w teście wybrać język bez zmiany globalnego `locale`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/i18n/plural.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { i18n } from './index'
import { polishPluralIndex } from './plural'

describe('polishPluralIndex', () => {
  it('picks one of the forms: none, one, few (2-4) and many', () => {
    const forms = [0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 104, 112].map(polishPluralIndex)
    expect(forms).toEqual([0, 1, 2, 2, 3, 3, 3, 3, 3, 2, 3, 2, 3])
  })
})

describe('plural messages', () => {
  it('use the Polish rule for Polish and the default one for English', () => {
    const { t } = i18n.global
    expect(t('contexts.delete.widgets', 3, { locale: 'pl' })).toBe('Usunie też 3 widgety.')
    expect(t('contexts.delete.widgets', 5, { locale: 'pl' })).toBe('Usunie też 5 widgetów.')
    expect(t('contexts.delete.widgets', 3, { locale: 'en' })).toBe(
      'Its 3 widgets will be deleted too.',
    )
  })
})
```

`apps/extension/src/i18n/plural.ts`

```ts
// Polish messages with a count have four forms: none | one | few | many.
// "few" is 2–4, also 22–24, 32–34…, but not 12–14: 2 widgety, 5 widgetów, 12 widgetów, 22 widgety.
export function polishPluralIndex(count: number) {
  if (count === 0) return 0
  if (count === 1) return 1
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) return 2
  return 3
}
```

`apps/extension/src/i18n/index.ts`

```ts
import { createI18n } from 'vue-i18n'
import en from './en.json'
import type { Locale } from '@one-place/shared'
import { detectLocale } from './locale'
import { polishPluralIndex } from './plural'
import pl from './pl.json'

export type MessageSchema = typeof pl

export const i18n = createI18n<[MessageSchema], Locale>({
  legacy: false,
  locale: detectLocale(navigator.language),
  fallbackLocale: 'en',
  messages: { pl, en },
  // English uses the default rule (none | one | many)
  pluralRules: { pl: polishPluralIndex },
})
```

`apps/extension/src/features/contexts/ManageContexts.vue` (nowe importy, nowy fragment pod `toDelete` i zmieniony opis modalu)

```ts
import { computed, ref, watch } from 'vue'
import { useWidgets } from '@/queries/widgets'

// …

const toDelete = ref<ContextDto | null>(null)

// F-CTX-07: the widgets of a context that was never opened on this device are fetched now.
// Until they arrive (or offline) the modal shows the description without the count.
const { data: widgetsToDelete } = useWidgets(() => toDelete.value?.id ?? null)
const deleteDescription = computed(() => {
  const count = widgetsToDelete.value?.length
  const description = t('contexts.delete.description')
  return count === undefined ? description : `${t('contexts.delete.widgets', count)} ${description}`
})
```

```vue
<UModal
  :open="toDelete !== null"
  :title="t('contexts.delete.title', { name: toDelete?.name ?? '' })"
  :description="deleteDescription"
  @update:open="onDeleteModalOpen"
>
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co pokaże modal offline dla kontekstu, którego widgetów nie ma w cache?** Sam stały opis bez liczby: zapytanie czeka na sieć, a `count` jest `undefined`. Usunięcie i tak zadziała po powrocie sieci, bo mutacja też czeka.
2. **Dlaczego `ContextDto` nie dostał pola `widgetCount`?** Licznik w DTO trzeba by aktualizować przy każdym dodaniu i usunięciu widgetu, także optymistycznie w cache listy kontekstów. Zmiana kształtu DTO wymagałaby też zmiany `CACHE_SCHEMA_VERSION`. Modal usuwania otwiera się rzadko, więc tańsze jest pobranie listy widgetów na żądanie (decyzja 5).
3. **Czy angielski też potrzebuje własnej reguły?** Nie. Angielski ma formy „jeden” i „wiele”, a domyślna reguła vue-i18n dla trzech form (zero, jeden, wiele) pasuje do niego dokładnie.

</details>

---

## Zadanie 15: budżet, pierwszy render i przypadki brzegowe

**Cel:** startowy JS po Etapie 3 mieści się w budżecie, pierwszy render pulpitu z widgetami z cache trwa poniżej 200 ms, a wszystkie punkty z [Na co uważać](#na-co-uważać) działają w zbudowanej paczce, także DoD: błąd rzucony w zaślepce nie wywraca pulpitu.

**Czego się nauczysz:** sprawdzanie leniwego ładowania pomiarem, spowalnianie CPU w DevTools, `invalidateQueries` po odrzuconej zmianie, sprawdzanie przypadków brzegowych przez bazę.

**Pliki:**

- Zmień: `apps/extension/src/queries/widgets.ts`
- Test: `apps/extension/src/queries/widgets.test.ts`

**Kroki:**

- [ ] **1. Pomiar.** `pnpm --filter @one-place/extension build && pnpm size`. Oczekiwany wynik: **około 490 kB** (budżet 550 kB). W liście plików z buildu osobno: `GridEditor` (około 140 kB), `WidgetActions`, `WidgetCatalog`, `TodoWidget` i `TodoSettings`.
- [ ] **2. Eksperyment: edytor w pierwszym renderze.** W `DashboardGrid.vue` zamień na chwilę `defineAsyncComponent` na zwykły `import GridEditor from './GridEditor.vue'`, zbuduj i uruchom `pnpm size`. **Oczekiwany wynik: około 630 kB i błąd przekroczenia budżetu.** To liczba, od której zaczęła się decyzja 1. Przywróć leniwy import.
- [ ] **3. Czas pierwszego renderu.** Zbuduj, załaduj `.output/chrome-mv3`, dodaj sześć widgetów i odczekaj sekundę. Otwórz nową kartę i w konsoli wpisz `performance.getEntriesByName('dashboard-rendered')[0].startTime`. Powtórz kilka razy, potem z „CPU: 4x slowdown” w DevTools → Performance. Na prototypie: mediana 30 ms i 86 ms. Wymaganie to poniżej 200 ms.
- [ ] **4. Karta otwarta offline.** W zbudowanej paczce: DevTools → Network → „Offline”, przeładuj kartę. Widgety są z cache, widać baner offline. Włącz edycję (chunk edytora jest w paczce, więc ładuje się bez sieci) i przesuń widget: żadnego żądania i żadnego toastu. Wyłącz tryb Offline: wychodzi jeden `PUT` z nowym położeniem.
- [ ] **5. Eksperyment: widget usunięty na innym urządzeniu.** Włącz edycję. W `psql` usuń jeden z widgetów: `docker compose exec db psql -U one one_place -c "delete from widgets where config->>'title' = 'Zakupy'"`. Przeciągnij „Zakupy” w inne miejsce. **Oczekiwany wynik:** `PUT` z odpowiedzią 400 `LAYOUT_INVALID`, toast „Serwer odrzucił zmianę. Spróbuj ponownie.” i widget wraca na swoje miejsce. Ale zostaje na pulpicie, choć w bazie już go nie ma, dopóki nie przełączysz się na inną kartę i z powrotem.
- [ ] **6. Czerwony test.** W teście `useSaveLayout` z zadania 6 dopisz na końcu: `expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)`. Oczekiwany wynik: **FAIL**.
- [ ] **7. Poprawka.** W `onError` mutacji `useSaveLayout` po cofnięciu wywołaj `queryClient.invalidateQueries({ queryKey: widgetsKey(contextId) })`. Oczekiwany wynik: **PASS (74 testy w rozszerzeniu)**. Zbuduj i powtórz krok 5 z innym widgetem: po toaście usunięty widget znika sam.
- [ ] **8. Błąd w zaślepce (DoD).** W `TodoWidget.vue` dodaj na chwilę pod `config`: `if (config.value.title === 'Boom') throw new Error('Boom')`. Zbuduj, ustaw w ustawieniach jednego widgetu tytuł „Boom” i przeładuj kartę. **Oczekiwany wynik:** ta ramka pokazuje „Ten widget przestał działać” z „Spróbuj ponownie”, a nagłówek, pozostałe widgety i menu tej ramki działają. Zmień w jej ustawieniach tytuł na „Naprawiony” i kliknij „Spróbuj ponownie”: widget wraca. Usuń dodaną linię.
- [ ] **9. Limit 50 widgetów.** Uzupełnij kontekst „Praca” do 50 widgetów (wpisz swój e-mail):

  ```bash
  docker compose exec db psql -U one one_place -c "insert into widgets (id, user_id, context_id, type, config, x, y, w, h) select gen_random_uuid(), c.user_id, c.id, 'todo', '{}', 0, 100 + n * 6, 4, 6 from contexts c join \"user\" u on u.id = c.user_id cross join lateral generate_series(1, 50 - (select count(*)::int from widgets w where w.context_id = c.id)) n where c.name = 'Praca' and u.email = 'twoj@email.pl'"
  ```

  Przejdź na inną kartę i wróć, potem dodaj widget z katalogu. **Oczekiwany wynik:** widget pojawia się i znika, a toast mówi „Osiągnięto limit. Usuń coś, zanim dodasz kolejny element.”. Na koniec usuń widgety testowe: `delete from widgets where y >= 100`.

- [ ] **10. Prywatność.** W zbudowanej paczce przejdź przez kroki 4–9 z otwartym DevTools → Network i filtrem `-domain:localhost`. Nie ma żadnych żądań.
- [ ] **11.** `pnpm format && pnpm check`, potem commit: `fix(extension): refetch widgets after a rejected layout`.

**Pułapki (sprawdzone na prototypie):**

- **Cofnięcie przywraca cache, a nie prawdę z serwera.** Mutacja wraca do stanu sprzed zmiany, ale ten stan był już nieaktualny: widget usunięto gdzie indziej. Po odrzuconym układzie lepiej zapytać serwer od razu, niż czekać na powrót do karty.
- **Unieważnienie tylko po błędzie układu.** Odrzucone dodanie widgetu (limit) albo zmiana tytułu nie mówią nic o tym, że cache jest nieaktualny. `invalidateQueries` w każdej mutacji wysyłałby dodatkowe żądanie bez potrzeby.
- **Błąd w `setup` rzuca się tylko przy montowaniu.** Zmiana tytułu na „Boom” w działającym widgecie niczego nie psuje, bo `setup` się nie powtarza. Dlatego krok 8 przeładowuje kartę. Błąd rzucony w szablonie albo w `computed` używanym przez szablon pojawiłby się od razu.
- **Tryb Offline w `pnpm dev` blokuje też serwer Vite.** Tak jak w Etapie 2, karty otwartej offline nie sprawdzisz w trybie deweloperskim.

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/widgets.ts` (zmieniony `onError` w `useSaveLayout`)

```ts
    onError: (_error, { contextId }, rollback) => {
      rollback?.()
      // A rejected layout means the cache is out of date, e.g. a widget was deleted on another
      // device. Fetching the widgets again shows what the API has.
      void queryClient.invalidateQueries({ queryKey: widgetsKey(contextId) })
    },
```

`apps/extension/src/queries/widgets.test.ts` (koniec testu `useSaveLayout`)

```ts
response.resolve(jsonResponse(400, { error: { code: 'LAYOUT_INVALID', message: 'Invalid' } }))
await expect(saving).rejects.toThrow()
expect(cached()).toEqual([tasks, shopping])
// The layout was rejected because the cache is out of date (e.g. a widget deleted on another
// device), so the widgets are fetched again
expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego widget pojawił się mimo limitu 50?** UI jest optymistyczne, a limit sprawdza serwer, który jest źródłem prawdy. Odpowiedź 422 cofa zmianę, tak jak przy 21. kontekście w Etapie 2.
2. **Co się stanie ze zmianą układu zrobioną offline, gdy zamkniesz kartę przed powrotem sieci?** Przepadnie, tak jak każda zmiana offline w MVP: wstrzymana mutacja istnieje tylko w pamięci karty (ryzyko R7).
3. **Dlaczego pierwszy render z widgetami jest tylko trochę wolniejszy niż w Etapie 2?** Ramki i siatka CSS to mało kodu, a komponenty widgetów ładują się po pierwszym renderze. Treść widgetu pojawia się kilka milisekund później niż ramka, ale znacznik `dashboard-rendered` mierzy pulpit, który użytkownik widzi od razu.

</details>

---

## Zadanie 16: domknięcie Etapu 3

**Cel:** spełniona definicja ukończenia Etapu 3, decyzje z tego planu i wynik R4 zapisane w dokumentacji, a dokumentacja zgodna z kodem.

**Kroki:**

- [ ] **1. Architektura.** W [03-architektura.md](03-architektura.md):
  - w „Pakiet `shared`”: stałe bez Zoda w `widget-types.ts` (`WIDGET_TYPES`, `GRID_COLUMNS`, `MAX_WIDGETS_PER_CONTEXT`, `WIDGET_SIZES`, `isWidgetType`, `WidgetDto`), schematy w `widgets.ts`; na ścieżce startowej rozszerzenia importuje się tylko pliki bez Zoda; każde pole konfiguracji widgetu ma wartość domyślną, więc `{}` daje konfigurację domyślną;
  - w „Struktura repozytorium”: `features/widgets/` (katalog i dodawanie), `apps/extension/nuxt-ui.config.ts`;
  - w „API” (zasady): `PATCH /widgets/:id` zastępuje całą konfigurację, sprawdzaną schematem typu zapisanego w bazie; trasy `/contexts/:id/widgets` i `/contexts/:id/layout` są w routerze zagnieżdżonym w `contextsRoutes` (`Hono<AuthEnv>`), więc sesja jest sprawdzana raz; cudzy kontekst w tych trasach daje 404; układ sprawdza przynależność w `UPDATE … WHERE` i zapisuje się w jednej transakcji;
  - w „Warstwa danych”: klucz `['widgets', contextId]` i `createContextKey` w `queries/keys.ts`; `useWidgets` czeka, aż API zapisze nowy kontekst (`useMutationState`), a nowy kontekst dostaje w cache pustą listę widgetów; usunięcie kontekstu usuwa wpis jego widgetów; odrzucony układ unieważnia zapytanie widgetów;
  - w „Start nowej karty”: startowy JS po Etapie 3 (Twój pomiar, na prototypie około 490 kB), leniwe części (edytor siatki około 140 kB, menu widgetu, katalog, ustawienia, komponenty widgetów) i czas pierwszego renderu z widgetami;
  - w „System widgetów”: kontrakt `WidgetDefinition` bez `configSchema` i `defaultConfig` (schemat przychodzi z leniwym komponentem, który woła `resolveConfig`); `WidgetFrame` ma nagłówek tylko w trybie edycji (uchwyt z nazwą typu), menu w rogu ładowane przy pierwszym kliknięciu, a tytuł pokazuje sam widget; w „Dodanie nowego typu widgetu” definicja bez schematu;
  - w „Siatka”: podgląd rysuje CSS grid z położeniem z `compactLayout` (ten sam algorytm co `verticalCompact`), a `GridEditor.vue` jest jedynym plikiem, który zna `grid-layout-plus`, i ładuje się leniwie; `ROW_HEIGHT` 40 i `GRID_GAP` 10; zapis: `layout-updated` → debounce 500 ms → `changedLayout` → `useSaveLayout` tylko przy różnicy;
  - w „Testy”: komponenty w Vitest z `@vitejs/plugin-vue` i pluginem Nuxt UI (wspólne `nuxtUiOptions`), `happy-dom` włączany w pliku testu;
  - w rejestrze decyzji: podgląd na CSS grid z leniwym `grid-layout-plus` (odrzucone: biblioteka w obu trybach, +139 kB startowego JS) oraz rejestr widgetów bez Zoda ze schematem przy komponencie (odrzucone: walidacja w ramce, +93 kB, i `zod/mini`, +52 kB);
  - w „Ryzyka”: wynik R4 z notatek z zadania 12 (wersja, aktywność repozytorium, działanie z Vue, rozmiar chunka, plan awaryjny bez zmian).
- [ ] **2. Roadmapa.** Przy Etapie 3 w [04-roadmapa.md](04-roadmapa.md) jest odnośnik do tego planu. Sprawdź, czy zakres się zgadza. Przy Etapie 4 zaznacz, że `TodoConfigSchema` ze źródłem `local` i `TodoSettings.vue` z tytułem już istnieją, więc Etap 4 dopisuje „Ukryj ukończone”, listę zadań i moduł `todos`.
- [ ] **3. Specyfikacja.** Sprawdź, czy [02-specyfikacja.md](02-specyfikacja.md) zgadza się z tym, co powstało. Na prototypie nic nie trzeba było zmieniać: budżet 550 kB zostaje.
- [ ] **4. Definicja ukończenia** z [roadmapy](04-roadmapa.md#etap-3-siatka-i-system-widgetów):
  - [ ] w trybie edycji można dodać, przesunąć, przeskalować i usunąć widget, a układ zostaje zachowany po przeładowaniu (zadania 11–13);
  - [ ] błąd rzucony w zaślepce nie wywraca pulpitu (zadanie 15, krok 8);
  - [ ] modal usuwania kontekstu pokazuje liczbę widgetów (zadanie 14);
  - [ ] testy API sprawdzają 401 bez sesji, 404 dla cudzego kontekstu i widgetu, 400 dla niepoprawnych danych i `LAYOUT_INVALID` bez częściowego zapisu (`widgets.test.ts`);
  - [ ] ryzyko R4 ma zapisany wynik;
  - [ ] startowy JS mieści się w budżecie, a pierwszy render z cache trwa poniżej 200 ms.
- [ ] **5.** `pnpm check` (oczekiwany wynik: 26 + 77 + 74 = **177 testów**), potem commit: `docs: add stage 3 results`.

---

## Materiały

| Temat                                    | Gdzie czytać                                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `grid-layout-plus`                       | https://grid-layout-plus.netlify.app/                                                                 |
| Algorytm dosuwania (`react-grid-layout`) | https://github.com/react-grid-layout/react-grid-layout                                                |
| CSS grid: `grid-row` i `grid-column`     | https://developer.mozilla.org/en-US/docs/Web/CSS/grid-row                                             |
| VueUse: `useBreakpoints`                 | https://vueuse.org/core/useBreakpoints/                                                               |
| VueUse: `useDebounceFn`                  | https://vueuse.org/shared/useDebounceFn/                                                              |
| Vue: `onErrorCaptured`                   | https://vuejs.org/api/composition-api-lifecycle.html                                                  |
| Vue: komponenty asynchroniczne           | https://vuejs.org/guide/components/async.html                                                         |
| Vue Test Utils                           | https://test-utils.vuejs.org/                                                                         |
| Vitest: środowisko testów                | https://vitest.dev/guide/environment                                                                  |
| TanStack Query: `useMutationState`       | https://tanstack.com/query/latest/docs/framework/react/reference/useMutationState (w Vue to samo API) |
| TanStack Query: unieważnianie po mutacji | https://tanstack.com/query/latest/docs/framework/vue/guides/invalidations-from-mutations              |
| Drizzle: transakcje                      | https://orm.drizzle.team/docs/transactions                                                            |
| Hono: middleware i większe aplikacje     | https://hono.dev/docs/guides/middleware, https://hono.dev/docs/guides/best-practices                  |
| Zod: `transform` i `refine`              | https://zod.dev/api                                                                                   |
| vue-i18n: liczba mnoga                   | https://vue-i18n.intlify.dev/guide/essentials/pluralization                                           |
| Nuxt UI: DropdownMenu                    | https://ui.nuxt.com/docs/components/dropdown-menu                                                     |
| Nuxt UI: ikony w aplikacji Vue           | https://ui.nuxt.com/docs/getting-started/integrations/icons/vue                                       |
| Tree shaking i `sideEffects`             | https://webpack.js.org/guides/tree-shaking/                                                           |

## Co dalej

Po Etapie 3 kolejnym krokiem jest [Etap 4: Widget Zadania](04-roadmapa.md#etap-4-widget-zadania): moduł `todos` w API z sortowaniem po indeksie ułamkowym, `TaskSource` z implementacją `local`, lista zadań z dodawaniem, edycją w miejscu, usuwaniem i przeciąganiem oraz „Ukryj ukończone” w ustawieniach, które już istnieją. Przygotuję dla niego podobny plan nauki, gdy będziesz gotowy.
