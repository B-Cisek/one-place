# 09. Etap 4: Widget Zadania (plan nauki)

Ten plik prowadzi przez [Etap 4 z roadmapy](04-roadmapa.md#etap-4-widget-zadania). Format jest taki sam jak w [planie Etapu 3](08-etap-3-siatka-i-widgety.md): każde zadanie mówi, **co** zrobić, **dlaczego** i **jak sprawdzić**, że działa. Gotowy kod jest schowany w zwijanych blokach „Rozwiązanie”.

**Cel:** zaślepka z Etapu 3 staje się prawdziwą listą zadań. Enter w polu „Dodaj zadanie” dodaje zadanie na końcu listy, checkbox je odhacza, kliknięcie tekstu włącza edycję w miejscu, krzyżyk usuwa, a uchwyt pozwala przeciągnąć zadanie w inne miejsce. W ustawieniach widgetu dochodzi „Ukryj ukończone”. Wszystkie zmiany są optymistyczne, idą do API po kolei i przetrwają przeładowanie karty.

**Architektura:** API dostaje tabelę `todo_items` i moduł `todos`. Lista i dodawanie siedzą pod `/api/widgets/:id/todos`, a zmiana i usuwanie pod `/api/todos/:id`. Kolejność zadań to indeks ułamkowy w kolumnie `text COLLATE "C"`, tak jak przy kontekstach. Rozszerzenie trzyma zadania w cache osobno dla każdego widgetu (`['todos', widgetId]`). `TodoWidget` łączy źródło zadań (`TaskSource`, w MVP tylko `local`) z czysto prezentacyjnym `TaskList`, który nie wie nic o API. Wszystkie mutacje w aplikacji idą do API w jednej kolejce, w kolejności wykonania.

**Specyfikacja:** F-TODO-01 … F-TODO-08 w [02-specyfikacja.md](02-specyfikacja.md#widget-zadania-todo), tabela `todo_items` i sekcje „API”, „Warstwa danych” i „System widgetów” (źródła danych) w [03-architektura.md](03-architektura.md) oraz decyzja D11.

> Rozwiązania sprawdziłem na prototypie 1.11.2026 (macOS, Node 24.7, pnpm 10.24, Postgres 18 w Dockerze, Chrome for Testing 156, `vue-draggable-plus` 0.6.1, TanStack Query 5.104, Vue 3.5.43): 234 testy, lint, typecheck i build. W przeglądarce z załadowanym rozszerzeniem sprawdziłem dodawanie, odhaczanie, edycję (Enter, utrata fokusu, Escape), usuwanie, przeciąganie w podglądzie i w trybie edycji siatki, „Ukryj ukończone”, przewijanie do nowego zadania, stan po przeładowaniu, serię zmian zrobionych offline z kolejką i bez niej, zadanie usunięte na innym urządzeniu, limit 500 zadań, sortowanie w prawdziwym Postgresie z kolacją `"C"` i bez niej, czas pierwszego renderu i prywatność (żadnych żądań poza API). Scenariusze sprawdziłem w zbudowanej paczce, a główny przepływ także w `pnpm dev`.

## Jak korzystać z planu

Tak samo jak w poprzednich etapach:

1. Przeczytaj całe zadanie przed rozpoczęciem.
2. Odhaczaj kroki (`- [ ]` na `- [x]`).
3. W krokach z testem **najpierw zobacz czerwony test**, dopiero potem pisz implementację.
4. Gdy utkniesz na ponad 15 minut, otwórz „Podpowiedź”, a potem „Rozwiązanie”.
5. Każde zadanie kończy się zielonym `pnpm check` i commitem.
6. Na końcu zadania odpowiedz na pytania kontrolne.

Kroki oznaczone jako **eksperyment** celowo pokazują błąd, zanim go naprawisz. W tym etapie większość z nich dotyczy kolejności zdarzeń: dwóch zdarzeń po jednym naciśnięciu klawisza, zapisów, które wracają z sieci w innej kolejności, niż wyszły, i sortowania, które w testach działa, a w Dockerze nie.

## Wymagania wstępne

- [ ] Etap 3 jest skończony, a `pnpm check` przechodzi (177 testów)
- [ ] Postgres działa: `docker compose up -d`
- [ ] Migracje z Etapów 1–3 są zastosowane: `pnpm --filter @one-place/api db:migrate`
- [ ] `pnpm dev` uruchamia API i przeglądarkę z rozszerzeniem, a widget Zadania (zaślepka) da się dodać do pulpitu
- [ ] `pnpm --filter @one-place/extension build && pnpm size` pokazuje około 490 kB

## Ograniczenia globalne

Obowiązują ograniczenia z [Etapu 0](05-implementacja-poczatkowa.md#ograniczenia-globalne), [Etapu 1](06-etap-1-logowanie.md#ograniczenia-globalne), [Etapu 2](07-etap-2-konteksty.md#ograniczenia-globalne) i [Etapu 3](08-etap-3-siatka-i-widgety.md#ograniczenia-globalne) oraz:

- **Ten etap nie dodaje pakietów.** `vue-draggable-plus`, `fractional-indexing` i `uuid` są w rozszerzeniu od Etapu 2.
- Komponenty i widgety nigdy nie wołają API bezpośrednio. Robią to tylko composables z `src/queries/`.
- `TaskList.vue` nie importuje niczego z `src/queries/`. Dostaje zadania w propsach i zgłasza zdarzenia, więc jego testy nie potrzebują API ani `QueryClient`.
- Każde zapytanie do bazy w serwisach API jest ograniczone do właściciela. Cudzy widget i cudze zadanie dają 404.
- Startowy JS mieści się w budżecie 550 kB. Kod listy zadań ładuje się razem z leniwym `TodoWidget`.
- Teksty w UI tylko przez i18n. Nazwy w kodzie, opisy testów, komunikaty błędów API, logi i commity po angielsku.

## Decyzje dla tego etapu

Ustalone przed napisaniem planu. Zadanie 15 przenosi je do dokumentacji.

1. **Wszystkie zmiany idą do API w jednej kolejce.** TanStack Query domyślnie wysyła mutacje równolegle. Gdy zmiany czekają na sieć (offline albo wolne łącze), zmiana zadania może dotrzeć do API przed zapisaniem samego zadania albo jego widgetu i dostać 404. Jedna linia w `createQueryClient` (`mutations.scope`) ustawia wszystkie mutacje w kolejkę. UI pozostaje optymistyczne, więc kolejki nie widać. Ceną jest to, że jedno zawieszone żądanie wstrzymuje następne, aż przeglądarka je przerwie. Naprawia to też ten sam ukryty błąd przy kontekstach i widgetach z Etapów 2 i 3. Zadanie 7.
2. **Pole „Dodaj zadanie” jest na dole widgetu.** Nowe zadanie trafia na koniec listy (F-TODO-01), czyli tuż nad pole. Lista przewija się nad nim, a po dodaniu przewija się do nowego zadania. Zadanie 9.
3. **Przy „Ukryj ukończone” odhaczone zadanie znika od razu.** Filtruje `TodoWidget`, a `TaskList` dostaje tylko widoczne zadania. Przeciąganie zgłasza więc sąsiadów z widocznej listy, a źródło wylicza z nich pozycję. Zadania 11 i 12.
4. **Zadania widgetu innego typu dają 400 `VALIDATION_ERROR`.** Tak samo jak konfiguracja widgetu nieznanego typu w Etapie 3. Cudzy albo nieistniejący widget daje 404. Zadanie 3.
5. **`TaskSource` jest prostszy niż w architekturze.** `TaskItem` to `{ id, text, done }` bez `position`, bo kolejność to sprawa źródła (Todoist ma inną). Zamiast `isLoading` i `error` źródło ma `items` równe `undefined` do pierwszego wczytania, `isError` i `retry()`, a `capabilities` ma tylko `reorder`, bez nieużywanego jeszcze `dueDates`. Zadania 8 i 15.
6. **Komunikaty walidacji zadania są po angielsku, a nie kluczami i18n.** UI nigdy ich nie pokazuje: lista ignoruje pusty tekst, a pole nie przyjmie więcej niż 500 znaków. To ta sama zasada co przy komunikatach API. Zadanie 1.

## Na co uważać

Dziewięć sytuacji, które łatwo przeoczyć, bo nie dają błędu w konsoli albo pojawiają się dopiero w przeglądarce:

1. **Enter, Escape i utrata fokusu.** Chrome zgłasza `blur`, gdy usuwa z DOM pole, które ma fokus. Edycja zamykana Enterem zapisuje się wtedy dwa razy, a Escape zamiast anulować zapisuje zmieniony tekst. Zadanie 10.
2. **Równoległe zapisy po powrocie sieci.** Bez kolejki zadanie dodane i odhaczone offline traci odhaczenie, a zadanie dodane i od razu usunięte wraca po przeładowaniu. W konsoli widać tylko 404. Zadania 7 i 14.
3. **Odpowiedź starszej zmiany po nowszej.** Szybkie podwójne kliknięcie checkboxa: odpowiedź na pierwsze kliknięcie zapisana w cache na chwilę odhacza zadanie z powrotem. Zadanie 7.
4. **Kolejność `.trim()` i `.min(1)`.** `z.string().min(1).trim()` przepuszcza `'   '` jako pusty tekst, bo długość sprawdza przed przycięciem. Zadanie 1.
5. **Sortowanie w testach a w Dockerze.** PGlite zawsze porównuje teksty bajtowo, a Postgres w Dockerze używa `en_US.utf8`. Bez `COLLATE "C"` zadanie przeciągnięte na górę listy po przeładowaniu ląduje na dole, choć wszystkie testy przechodzą. Zadania 2 i 14.
6. **Jedna funkcja, cała biblioteka.** `byPosition` w pliku z `generateKeyBetween` wciąga `fractional-indexing` na ścieżkę startową (około 3,5 kB), bo zapytania kontekstów sortują przy starcie. Zadanie 5.
7. **Nowy widget i jego zadania.** Widget dodany w tej karcie jest w cache, zanim API go zapisze. Zapytanie o jego zadania dostaje wtedy 404, a offline widget pokazuje szkielety bez końca. Zadanie 6.
8. **Zadania usuniętego widgetu.** Bez sprzątania zostają w `chrome.storage.local` do wylogowania, także po usunięciu całego kontekstu. Zadanie 6.
9. **Zmiana zadania usuniętego na innym urządzeniu.** API odpowiada 404, cofnięcie przywraca zadanie, a ono zostaje na liście, dopóki nie wrócisz do karty. Zadanie 14.

## Struktura po Etapie 4

Nowe i zmienione pliki:

```
one-place/
├─ packages/shared/src/  todos.ts  index.ts  (+ test)
├─ apps/api/
│  ├─ src/
│  │  ├─ app.ts
│  │  ├─ db/schema/  todos.ts  index.ts
│  │  ├─ db/migrations/0003_todo_items.sql
│  │  └─ modules/  widgets/ (routes.ts, service.ts)  todos/ (routes.ts, service.ts)
│  └─ test/  fixtures.ts  migrations.test.ts  todos.test.ts
└─ apps/extension/src/
   ├─ lib/  positions.ts  by-position.ts  (+ testy; positions.ts przeniesiony z features/contexts/)
   ├─ queries/  keys.ts  query-client.ts  contexts.ts  widgets.ts  todos.ts  (+ test)
   ├─ features/contexts/  ManageContexts.vue  use-add-context.ts
   ├─ widgets/todo/  task-source.ts  local-task-source.ts  TaskList.vue
   │                 TodoWidget.vue  TodoSettings.vue  (+ testy)
   └─ i18n/  pl.json  en.json
```

---

## Zadanie 1: schematy zadań w `shared` (TDD)

**Cel:** jedno źródło reguł dla API i rozszerzenia. Tekst zadania po przycięciu ma 1–500 znaków, pozycja to klucz indeksu ułamkowego, a zmiana zadania nie może przenieść go do innego widgetu ([02-specyfikacja.md](02-specyfikacja.md#limity-i-walidacja)).

**Czego się nauczysz:** kolejność sprawdzeń w łańcuchu Zod (`.trim()` przed `.min()`), `.partial()` na schemacie wejścia, co Zod robi z polami spoza schematu.

**Pliki:**

- Utwórz: `packages/shared/src/todos.ts`
- Zmień: `packages/shared/src/index.ts`
- Test: `packages/shared/src/todos.test.ts`

**Interfejsy:**

- Korzysta z: `PositionSchema` (Etap 2, `contexts.ts`).
- Wytwarza: stałe `TODO_TEXT_MAX_LENGTH` i `MAX_TODOS_PER_WIDGET`, schematy `TodoTextSchema`, `CreateTodoSchema` i `UpdateTodoSchema`, typy `CreateTodoInput`, `UpdateTodoInput` i `TodoDto`. Używają ich zadania 3, 4, 6 i 9.

**Kroki:**

- [x] **1. Czerwone testy** w `src/todos.test.ts`:
  - `CreateTodoSchema` przyjmuje `{ id, text: '  Mleko  ', position: 'a0' }` i zwraca tekst `'Mleko'`;
  - tekst `'   '` i tekst z 501 znaków nie przechodzą, a 500 znaków przechodzi;
  - ID, które nie jest UUID, i pozycja `'a 0'` nie przechodzą;
  - `UpdateTodoSchema` przyjmuje samo `{ done: true }` i samo `{ text: ' Chleb ' }` (przycięte), a odrzuca `{ done: 'yes' }` i `{ text: '' }`;
  - `UpdateTodoSchema.parse({ widgetId: '…' })` daje `{}`.
- [x] **2. Uruchom.** `pnpm --filter @one-place/shared test`. Oczekiwany wynik: **FAIL**, bo moduł `./todos` nie istnieje.
- [x] **3. Implementacja** `src/todos.ts`. `TodoDto` to zwykły interfejs, tak jak `WidgetDto`. W `src/index.ts` dopisz eksport.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (31 testów w `shared`)**.
- [x] **5. Eksperyment: kolejność sprawdzeń.** Zamień w `TodoTextSchema` kolejność na `z.string().min(1, …).trim().max(…)`. Oczekiwany wynik: test tekstu **FAIL**, bo `'   '` przechodzi i daje pusty tekst. Zod sprawdza długość, zanim przytnie tekst. Przywróć `.trim()` na początek.
- [x] **6.** `pnpm format && pnpm check`, potem commit: `feat(shared): add todo schemas`.

**Pułapki (sprawdzone na prototypie):**

- **`.trim()` zawsze pierwsze.** W Zod 4 `.trim()` jest jednym z kroków łańcucha i działa w miejscu, w którym go wpiszesz. `ContextNameSchema` z Etapu 2 ma tę samą kolejność z tego samego powodu.
- **Zod usuwa nieznane pola.** `z.object()` domyślnie pomija klucze spoza schematu, więc `widgetId` w `PATCH /todos/:id` nie dotrze do serwisu. Test z `widgetId` pilnuje, żeby nikt nie dopisał go do `UpdateTodoSchema` „na wszelki wypadek”.
- **Komunikaty po angielsku.** Schematy formularzy (`ContextNameSchema`, `TodoConfigSchema`) mają klucze i18n, bo `UForm` je pokazuje. Tekstu zadania nie sprawdza żaden formularz: lista sama ignoruje pusty tekst, a pole ma `maxlength`. Komunikat trafia tylko do odpowiedzi API, jak `A widget must fit in 12 columns` (decyzja 6).
- **`done` nie jest w `CreateTodoSchema`.** Nowe zadanie zawsze jest nieukończone, a wartość domyślną daje kolumna w bazie.

<details>
<summary>Podpowiedź</summary>

- `UpdateTodoSchema` to obiekt ze wszystkimi trzema polami i `.partial()` na końcu, tak jak `UpdateContextSchema`.
- `PositionSchema` jest w `contexts.ts`. Import między plikami pakietu `shared` to zwykłe `import { PositionSchema } from './contexts'`.

</details>

<details>
<summary>Rozwiązanie</summary>

`packages/shared/src/todos.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { CreateTodoSchema, UpdateTodoSchema } from './todos'

const validTodo = { id: '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b10', text: 'Mleko', position: 'a0' }

describe('CreateTodoSchema', () => {
  it('accepts valid input and trims the text', () => {
    expect(CreateTodoSchema.parse({ ...validTodo, text: '  Mleko  ' })).toEqual(validTodo)
  })

  it('requires a text of 1 to 500 characters after trimming', () => {
    expect(CreateTodoSchema.safeParse({ ...validTodo, text: '   ' }).success).toBe(false)
    expect(CreateTodoSchema.safeParse({ ...validTodo, text: 'a'.repeat(500) }).success).toBe(true)
    expect(CreateTodoSchema.safeParse({ ...validTodo, text: 'a'.repeat(501) }).success).toBe(false)
  })

  it('requires a UUID and a fractional index key', () => {
    expect(CreateTodoSchema.safeParse({ ...validTodo, id: '42' }).success).toBe(false)
    expect(CreateTodoSchema.safeParse({ ...validTodo, position: 'a 0' }).success).toBe(false)
  })
})

describe('UpdateTodoSchema', () => {
  it('accepts a single field and validates it', () => {
    expect(UpdateTodoSchema.parse({ done: true })).toEqual({ done: true })
    expect(UpdateTodoSchema.parse({ text: ' Chleb ' })).toEqual({ text: 'Chleb' })
    expect(UpdateTodoSchema.safeParse({ done: 'yes' }).success).toBe(false)
    expect(UpdateTodoSchema.safeParse({ text: '' }).success).toBe(false)
  })

  it('does not move a task to another widget', () => {
    expect(UpdateTodoSchema.parse({ widgetId: '0199d5a6-6c6e-7cc4-8a4b-3c1f1f2a9b11' })).toEqual({})
  })
})
```

`packages/shared/src/todos.ts`

```ts
import { z } from 'zod'
import { PositionSchema } from './contexts'

export const TODO_TEXT_MAX_LENGTH = 500
export const MAX_TODOS_PER_WIDGET = 500

// The task list ignores an empty text (F-TODO-01, F-TODO-03) and the field cannot take more
// than 500 characters, so these messages are never shown in the UI
export const TodoTextSchema = z
  .string()
  .trim()
  .min(1, 'A task needs a text')
  .max(TODO_TEXT_MAX_LENGTH, `A task can have at most ${TODO_TEXT_MAX_LENGTH} characters`)

export const CreateTodoSchema = z.object({
  id: z.uuid(),
  text: TodoTextSchema,
  position: PositionSchema,
})

// No widgetId: a task cannot move to another widget
export const UpdateTodoSchema = z
  .object({ text: TodoTextSchema, done: z.boolean(), position: PositionSchema })
  .partial()

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>

export interface TodoDto {
  id: string
  widgetId: string
  text: string
  done: boolean
  position: string
  createdAt: string
  updatedAt: string
  version: number
}
```

`packages/shared/src/index.ts` (nowa linia na końcu)

```ts
export * from './todos'
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co zwróci `z.string().min(1).trim().parse('   ')`?** Pusty tekst `''`. Sprawdzenie długości widzi trzy spacje, a przycięcie dzieje się później. API zapisałoby zadanie bez tekstu.
2. **Dlaczego rozszerzenie nie importuje `todos.ts` na ścieżce startowej?** To moduł ze schematami, więc wciągnąłby Zoda (około 93 kB, pomiar z Etapu 3). `TODO_TEXT_MAX_LENGTH` jest potrzebne dopiero w liście zadań, która ładuje się leniwie razem z `TodoWidget`, i tam Zod i tak już jest.
3. **Co zrobi API z `PATCH /todos/:id` z treścią `{}`?** Przyjmie ją (każde pole jest opcjonalne), zapisze tylko `updated_at` i zwiększy `version`. Rozszerzenie takiego żądania nie wysyła.

</details>

---

## Zadanie 2: tabela `todo_items` i czwarta migracja

**Cel:** w bazie jest tabela zadań z modelu w [03-architektura.md](03-architektura.md#tabele). Pozycje porównuje się bajtowo, a usunięcie widgetu albo użytkownika usuwa jego zadania.

**Czego się nauczysz:** kolumna `boolean` z wartością domyślną, indeks na dwóch kolumnach, czym kolacja Postgresa w Dockerze różni się od PGlite.

**Pliki:**

- Utwórz: `apps/api/src/db/schema/todos.ts`
- Zmień: `apps/api/src/db/schema/index.ts`, `apps/api/test/migrations.test.ts`
- Wygeneruj: `apps/api/src/db/migrations/0003_todo_items.sql`

**Interfejsy:**

- Korzysta z: `fractionalIndex` i `timestamps` (`db/schema/columns.ts`), tabel `user` i `widgets`.
- Wytwarza: tabelę Drizzle `todoItems` (`todo_items` w bazie). Używają jej zadania 3 i 4.

**Kroki:**

- [x] **1. Czerwone testy** w `test/migrations.test.ts`:
  - na liście tabel jest `'todo_items'` (alfabetycznie między `'session'` a `'user'`);
  - test kolacji obejmuje wszystkie kolumny `position`: zmień jego nazwę na „compare positions byte by byte”, pytaj o `table_name, collation_name` wszystkich kolumn o nazwie `position` i oczekuj `contexts` i `todo_items` z kolacją `'C'`;
  - nowy test: klucze obce tabeli `todo_items` mają regułę `CASCADE` (`user_id` i `widget_id`).

  Oczekiwany wynik: **FAIL trzech testów**.

- [x] **2. Schemat** `schema/todos.ts` według tabeli z architektury: `widget_id` z kaskadą do `widgets.id`, `text` jako `varchar(500)`, `done` jako `boolean` z wartością domyślną `false`, `position` przez `fractionalIndex`, `...timestamps` i indeks na `(widget_id, position)`. Dopisz eksport w `schema/index.ts`.
- [x] **3. Migracja.** `pnpm --filter @one-place/api db:generate --name todo_items`. W pliku SQL znajdź `"position" text COLLATE "C"` i dwa `ON DELETE cascade`.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (78 testów w pakiecie API)**.
- [x] **5. Eksperyment: kolacja w Dockerze.** Postgres z `docker-compose.yml` ma domyślną kolację `en_US.utf8`. Porównaj dwa sortowania tych samych kluczy:

  ```bash
  docker compose exec db psql -U one one_place -c "select string_agg(p, ' ' order by p) from unnest(array['a0','Zz','a1']) p"
  docker compose exec db psql -U one one_place -c "select string_agg(p, ' ' order by p collate \"C\") from unnest(array['a0','Zz','a1']) p"
  ```

  **Oczekiwany wynik:** `a0 a1 Zz` i `Zz a0 a1`. `fractional-indexing` daje `Zz` jako pozycję przed `a0`, czyli dla zadania przeciągniętego na samą górę. W domyślnej kolacji to zadanie byłoby na końcu listy. PGlite w testach zawsze sortuje bajtowo, więc żaden test API tego nie pokaże. Dlatego test migracji pyta o kolację kolumny, a nie o kolejność wyników.

- [x] **6. Migracja w Dockerze.** `pnpm --filter @one-place/api db:migrate`, potem `docker compose exec db psql -U one one_place -c '\d todo_items'`. Kolumna `position` ma `Collation` równe `C`, a oba klucze obce mają `ON DELETE CASCADE`.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(api): add todo_items table`.

**Pułapki (sprawdzone na prototypie):**

- **`fractionalIndex`, a nie `text`.** Drizzle nie ma opcji kolacji kolumny. `customType` z `columns.ts` powstał w Etapie 2 dla kontekstów i tu przydaje się drugi raz.
- **Indeks `(widget_id, position)`.** Lista zadań to zawsze „zadania jednego widgetu w kolejności pozycji”, czyli dokładnie to, co ten indeks trzyma posortowane.
- **`user_id` mimo `widget_id`.** Ta sama konwencja co w `widgets`: każde zapytanie filtruje po właścicielu bez łączenia tabel.
- **Nazwa migracji.** Bez `--name` drizzle-kit wymyśli losową nazwę (np. `0003_brave_hulk.sql`). Poprzednie migracje mają nazwy opisowe.

<details>
<summary>Podpowiedź</summary>

- `boolean('done').default(false).notNull()` z `drizzle-orm/pg-core`.
- Indeks na dwóch kolumnach: `index('todo_items_widget_id_position_idx').on(table.widgetId, table.position)`.
- Test kolacji: `select table_name, collation_name from information_schema.columns where column_name = 'position' order by table_name`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/src/db/schema/todos.ts`

```ts
import { boolean, index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { fractionalIndex, timestamps } from './columns'
import { widgets } from './widgets'

export const todoItems = pgTable(
  'todo_items',
  {
    id: uuid('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Deleting a widget deletes its tasks (F-WGT-03)
    widgetId: uuid('widget_id')
      .notNull()
      .references(() => widgets.id, { onDelete: 'cascade' }),
    text: varchar('text', { length: 500 }).notNull(),
    done: boolean('done').default(false).notNull(),
    position: fractionalIndex('position').notNull(),
    ...timestamps,
  },
  (table) => [index('todo_items_widget_id_position_idx').on(table.widgetId, table.position)],
)
```

`apps/api/src/db/schema/index.ts` (nowa linia na końcu)

```ts
export * from './todos'
```

`apps/api/test/migrations.test.ts` (zmienione i nowe testy)

```ts
    expect(rows.map((row) => row.table_name)).toEqual([
      'account',
      'contexts',
      'session',
      'todo_items',
      'user',
      'user_settings',
      'verification',
      'widgets',
    ])
  })

  // PGlite always uses the C collation, so sorting in tests would pass even without it.
  // Postgres in Docker uses en_US.utf8, which puts 'Zz' after 'a0'.
  it('compare positions byte by byte', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ table_name: string; collation_name: string | null }>(
      `select table_name, collation_name from information_schema.columns
       where column_name = 'position' order by table_name`,
    )
    expect(rows).toEqual([
      { table_name: 'contexts', collation_name: 'C' },
      { table_name: 'todo_items', collation_name: 'C' },
    ])
  })

  // …test kaskady widgetów bez zmian…

  // Deleting a widget deletes its tasks (F-WGT-03), and deleting a context deletes its widgets
  it('delete tasks together with their widget and user', async () => {
    const { client } = await createTestApp()
    const { rows } = await client.query<{ column_name: string; delete_rule: string }>(
      `select kcu.column_name, rc.delete_rule
       from information_schema.referential_constraints rc
       join information_schema.key_column_usage kcu on kcu.constraint_name = rc.constraint_name
       where kcu.table_name = 'todo_items'
       order by kcu.column_name`,
    )
    expect(rows).toEqual([
      { column_name: 'user_id', delete_rule: 'CASCADE' },
      { column_name: 'widget_id', delete_rule: 'CASCADE' },
    ])
  })
```

Wygenerowany `apps/api/src/db/migrations/0003_todo_items.sql` (do porównania):

```sql
CREATE TABLE "todo_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"widget_id" uuid NOT NULL,
	"text" varchar(500) NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"position" text COLLATE "C" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_widget_id_widgets_id_fk" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "todo_items_widget_id_position_idx" ON "todo_items" USING btree ("widget_id","position");
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Usunięcie kontekstu usuwa zadania jego widgetów, choć `todo_items` nie ma klucza do `contexts`. Jak?** Kaskady się łączą: usunięcie kontekstu usuwa jego widgety (`widgets.context_id`), a usunięcie każdego widgetu usuwa jego zadania (`todo_items.widget_id`).
2. **Czy można by zmienić kolację całej bazy zamiast kolumny?** Można, ale wtedy poprawność sortowania zależałaby od tego, jak ktoś założył bazę (inny Docker, hosting). Kolacja w definicji kolumny jedzie razem z migracją.
3. **Dlaczego w eksperymencie `'a0' < 'Zz'` w `en_US.utf8`?** Ta kolacja porównuje najpierw litery bez względu na wielkość (`a` przed `z`), a wielkość liter rozstrzyga dopiero remis. Bajtowo wszystkie wielkie litery (65–90) są przed małymi (97–122).

</details>

---

## Zadanie 3: moduł `todos`: lista i idempotentne dodawanie

**Cel:** `GET /api/widgets/:id/todos` zwraca zadania widgetu w kolejności pozycji, a `POST` dodaje zadanie z ID wygenerowanym przez klienta. Ponowienie zwraca istniejący rekord, cudzy widget daje 404, widget innego typu 400, a pięćsetne pierwsze zadanie 422 (F-TODO-01, F-TODO-08).

**Czego się nauczysz:** drugi router zagnieżdżony w ten sam sposób co w Etapie 3, sprawdzanie typu zasobu nadrzędnego, przygotowanie danych testowych prosto w SQL (`generate_series`), stabilne sortowanie przy równych kluczach.

**Pliki:**

- Utwórz: `apps/api/src/modules/todos/service.ts`, `apps/api/src/modules/todos/routes.ts`
- Zmień: `apps/api/src/modules/widgets/service.ts`, `apps/api/src/modules/widgets/routes.ts`, `apps/api/test/fixtures.ts`
- Test: `apps/api/test/todos.test.ts`

**Interfejsy:**

- Korzysta z: `CreateTodoSchema`, `TodoDto`, `MAX_TODOS_PER_WIDGET` (zadanie 1), `todoItems` (zadanie 2), `AuthEnv`, `validate`, `IdParamSchema`, `asUser`, `contextInput`, `widgetInput` (Etapy 2 i 3).
- Wytwarza: eksportowane `widgetNotFound()` i `ownWidget()` z serwisu widgetów, `listTodos()` i `createTodo()`, `widgetTodosRoutes({ db })`, trasy `GET` i `POST /api/widgets/:id/todos`, fabrykę `todoInput(overrides)`. Zadanie 4 rozbudowuje ten moduł.

**Kroki:**

- [x] **1. Fabryka testowa.** W `test/fixtures.ts` dodaj `todoInput(overrides)`: nowy `randomUUID()`, tekst `'Mleko'`, pozycja `'a0'`.
- [x] **2. Czerwone testy** w `test/todos.test.ts`. `setup()` zakłada Alicję z kontekstem i widgetem Zadania oraz Boba i zwraca też `todosPath`. Pomocnik `insertNotesWidget(client, contextId)` wstawia przez SQL widget typu `'notes'` do kontekstu Alicji:
  - `GET` bez tokenu daje 401;
  - `GET` zwraca zadania w kolejności bajtowej pozycji (`'Zz'`, `'a0'`, `'a1'`, `'a1'`), a dwa zadania z tą samą pozycją `'a1'` w kolejności `id` (wyślij je w odwrotnej kolejności niż ich ID);
  - `GET` dla widgetu Alicji wysłany przez Boba daje 404 z treścią `{ error: { code: 'NOT_FOUND', message: 'Widget not found' } }`;
  - `GET` dla widgetu `'notes'` daje 400 `VALIDATION_ERROR`;
  - `POST` daje 201 i pełny rekord: tekst przycięty, `done: false`, `widgetId`, `version: 1`;
  - ponowiony `POST` daje 200 i ten sam rekord, a na liście jest jedno zadanie;
  - `POST` z ID zadania Alicji wysłany przez Boba (do jego własnego widgetu) daje 409 `ID_CONFLICT`;
  - `POST` Boba do widgetu Alicji daje 404 jak wyżej;
  - pusty tekst, tekst z 501 znaków i pozycja `'a 0'` dają 400 `VALIDATION_ERROR`;
  - `POST` do widgetu `'notes'` daje 400 `VALIDATION_ERROR`;
  - przy 500 zadaniach kolejny `POST` daje 422 `LIMIT_EXCEEDED`, a ponowienie pięćsetnego nadal 200 (wstaw 499 zadań przez SQL, a pięćsetne przez API);
  - `DELETE /api/widgets/:id` usuwa zadania widgetu (`select id from todo_items` jest puste).

  Oczekiwany wynik: **FAIL dziesięciu testów**. 401 i usuwanie z widgetem przechodzą już teraz. Zastanów się dlaczego, zanim przejdziesz dalej.

- [x] **3. Serwis** `modules/todos/service.ts`: `listTodos(db, userId, widgetId)` i `createTodo(db, userId, widgetId, input)`. Właściciela i typ widgetu sprawdza wspólna funkcja `assertTodoWidget`, która korzysta z `ownWidget` i `widgetNotFound` z serwisu widgetów (wyeksportuj je). Kolejność w `createTodo`: istniejące ID, widget, limit, `insert`. Listę sortuj po `(position, id)`.
- [x] **4. Trasy.** `widgetTodosRoutes({ db })` w `modules/todos/routes.ts` zwraca `new Hono<AuthEnv>()` z `GET` i `POST` `/:id/todos`. `widgetsRoutes` podłącza go na końcu łańcucha: `.route('/', widgetTodosRoutes({ db }))`. To ten sam wzór co `contextWidgetsRoutes` w `contextsRoutes`.
- [x] **5. Zielone testy.** Oczekiwany wynik: **PASS (90 testów w pakiecie API)**.
- [x] **6. Eksperyment: bez sprawdzenia typu.** Zakomentuj w `assertTodoWidget` warunek `widget.type !== 'todo'`. Oczekiwany wynik: dwa testy widgetu `'notes'` **FAIL**: `GET` zwraca `200 []`, a `POST` dodaje zadanie do widgetu, który nie ma listy zadań. Przywróć warunek.
- [x] **7. Eksperyment: równe pozycje.** Usuń `asc(todoItems.id)` z `orderBy`. Oczekiwany wynik: test kolejności **FAIL**, bo zadania z tą samą pozycją wracają w kolejności wstawienia. Rozszerzenie sortuje w cache po `(position, id)` (zadanie 5), więc bez `id` w API lista po odświeżeniu potrafiłaby zamienić dwa zadania miejscami. Przywróć sortowanie.
- [x] **8.** `pnpm format && pnpm check`, potem commit: `feat(api): add task list and idempotent create`.

**Pułapki (sprawdzone na prototypie):**

- **Widget innego typu przez SQL.** `WIDGET_TYPES` ma tylko `'todo'`, więc API nie pozwoli dodać widgetu `'notes'`. Wstawienie go prosto do bazy udaje stan po dodaniu nowego typu w nowszej wersji. To samo `client` z `createTestApp()` posłużyło w Etapie 3 do sprawdzania kaskad.
- **400 dla innego typu, 404 dla cudzego widgetu.** Widget Notatek istnieje i należy do Alicji, więc „nie znaleziono” byłoby nieprawdą. Cudzy widget daje 404, bo API nie zdradza, że taki zasób istnieje (decyzja 4).
- **Limit przez SQL.** Pętla 499 żądań przez API też by zadziałała (na prototypie trwa około 0,7 s). `insert … select … from generate_series(1, 499)` robi to samo jednym zapytaniem i pokazuje, jak przygotować dużo danych bez API. Przez API test sprawdza tylko to, co ważne: pięćsetne zadanie przechodzi, pięćset pierwsze nie, a ponowienie pięćsetnego tak.
- **`ownWidget` z serwisu widgetów.** Moduł `todos` korzysta z warunków modułu `widgets`, tak jak `widgets` korzysta z `ownContext`. Zależność idzie w jedną stronę: `widgets/routes.ts` importuje `todos/routes.ts`, ale serwis widgetów nie wie nic o zadaniach.

<details>
<summary>Dlaczego 401 i usuwanie z widgetem przechodzą przed implementacją (otwórz po kroku 2)</summary>

- `widgetsRoutes` ma `.use(requireAuth(auth))`, które pasuje do każdej ścieżki pod `/api/widgets/*`, także do `/api/widgets/:id/todos`. Żądanie bez tokenu kończy się na 401, zanim Hono zauważy, że trasy nie ma.
- Test usuwania dodaje zadanie przez `POST`, który przed implementacją dostaje 404 i niczego nie zapisuje. Tabela jest pusta, bo nikt do niej nie pisał. Test zaczyna znaczyć coś dopiero, gdy `POST` działa. Wtedy pilnuje kaskady w prawdziwym przepływie: usunięcie widgetu przez API usuwa jego zadania.

</details>

<details>
<summary>Podpowiedź</summary>

- `assertTodoWidget`: `db.select({ type: widgets.type }).from(widgets).where(ownWidget(userId, widgetId))`. Brak wiersza to `widgetNotFound()`, inny typ to `new AppError(400, 'VALIDATION_ERROR', …)`.
- Dwa zadania z tą samą pozycją w znanej kolejności: utwórz dwa `todoInput({ position: 'a1' })`, posortuj je po `id` i wyślij najpierw drugie, potem pierwsze.
- 499 zadań w SQL:

  ```sql
  insert into todo_items (id, user_id, widget_id, text, position)
  select gen_random_uuid(), user_id, id, 'Task ' || n, 'a' || n
  from widgets cross join generate_series(1, $2::int) n where id = $1
  ```

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/test/fixtures.ts` (nowy import typu i nowa funkcja)

```ts
import type { CreateContextInput, CreateTodoInput, CreateWidgetInput } from '@one-place/shared'

// …

export function todoInput(overrides: Partial<CreateTodoInput> = {}): CreateTodoInput {
  return { id: randomUUID(), text: 'Mleko', position: 'a0', ...overrides }
}
```

`apps/api/test/todos.test.ts`

```ts
import { MAX_TODOS_PER_WIDGET } from '@one-place/shared'
import { describe, expect, it } from 'vitest'
import { asUser, signUp, TEST_USER } from './auth-helpers'
import { createTestApp } from './create-test-app'
import { contextInput, todoInput, widgetInput } from './fixtures'

const widgetNotFound = { error: { code: 'NOT_FOUND', message: 'Widget not found' } }

async function setup() {
  const { app, client } = await createTestApp()
  const alice = asUser(app, await signUp(app))
  const bob = asUser(app, await signUp(app, { ...TEST_USER, email: 'bob@example.com' }))
  const context = contextInput()
  await alice.post('/api/contexts', context)
  const widget = widgetInput()
  await alice.post(`/api/contexts/${context.id}/widgets`, widget)
  const todosPath = `/api/widgets/${widget.id}/todos`
  return { app, client, alice, bob, contextId: context.id, widgetId: widget.id, todosPath }
}

// Only `todo` exists in WIDGET_TYPES, so a widget of another type goes straight to the database,
// as if a newer version of the API had added it
async function insertNotesWidget(
  client: Awaited<ReturnType<typeof setup>>['client'],
  contextId: string,
) {
  const { rows } = await client.query<{ id: string }>(
    `insert into widgets (id, user_id, context_id, type, config, x, y, w, h)
     select gen_random_uuid(), user_id, id, 'notes', '{}', 0, 0, 4, 4 from contexts where id = $1
     returning id`,
    [contextId],
  )
  return rows[0]!.id
}

describe('GET /api/widgets/:id/todos', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/widgets/${widgetInput().id}/todos`)
    expect(res.status).toBe(401)
  })

  it('returns the tasks in byte order of the position, then by id', async () => {
    const { alice, todosPath } = await setup()
    const [first, second] = [todoInput({ position: 'a1' }), todoInput({ position: 'a1' })].sort(
      (a, b) => (a.id < b.id ? -1 : 1),
    )
    for (const input of [todoInput({ text: 'a0', position: 'a0' }), second!, first!]) {
      await alice.post(todosPath, input)
    }
    await alice.post(todosPath, todoInput({ text: 'Zz', position: 'Zz' }))
    const res = await alice.get(todosPath)
    expect(res.status).toBe(200)
    const todos: { id: string; position: string }[] = await res.json()
    expect(todos.map((todo) => todo.position)).toEqual(['Zz', 'a0', 'a1', 'a1'])
    expect(todos.slice(2).map((todo) => todo.id)).toEqual([first!.id, second!.id])
  })

  it("returns 404 for another user's widget", async () => {
    const { bob, todosPath } = await setup()
    const res = await bob.get(todosPath)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(widgetNotFound)
  })

  it('returns 400 for a widget that is not a todo widget', async () => {
    const { client, alice, contextId } = await setup()
    const notesId = await insertNotesWidget(client, contextId)
    const res = await alice.get(`/api/widgets/${notesId}/todos`)
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })
})

describe('POST /api/widgets/:id/todos', () => {
  it('creates a task that is not done and returns it with 201', async () => {
    const { alice, widgetId, todosPath } = await setup()
    const input = todoInput({ text: '  Mleko  ' })
    const res = await alice.post(todosPath, input)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      id: input.id,
      widgetId,
      text: 'Mleko',
      done: false,
      position: 'a0',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      version: 1,
    })
  })

  it('returns the existing task with 200 when the request is retried', async () => {
    const { alice, todosPath } = await setup()
    const input = todoInput()
    const first = await (await alice.post(todosPath, input)).json()
    const retry = await alice.post(todosPath, input)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toEqual(first)
    expect(await (await alice.get(todosPath)).json()).toHaveLength(1)
  })

  it('returns 409 when the id belongs to another user', async () => {
    const { alice, bob, todosPath } = await setup()
    const input = todoInput()
    await alice.post(todosPath, input)
    const bobsContext = contextInput()
    await bob.post('/api/contexts', bobsContext)
    const bobsWidget = widgetInput()
    await bob.post(`/api/contexts/${bobsContext.id}/widgets`, bobsWidget)
    const res = await bob.post(`/api/widgets/${bobsWidget.id}/todos`, input)
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('ID_CONFLICT')
  })

  it("returns 404 for another user's widget", async () => {
    const { bob, todosPath } = await setup()
    const res = await bob.post(todosPath, todoInput())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(widgetNotFound)
  })

  it('rejects an empty text, a too long text and an invalid position', async () => {
    const { alice, todosPath } = await setup()
    for (const input of [
      todoInput({ text: '   ' }),
      todoInput({ text: 'a'.repeat(501) }),
      todoInput({ position: 'a 0' }),
    ]) {
      const res = await alice.post(todosPath, input)
      expect(res.status).toBe(400)
      expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('returns 400 for a widget that is not a todo widget', async () => {
    const { client, alice, contextId } = await setup()
    const notesId = await insertNotesWidget(client, contextId)
    const res = await alice.post(`/api/widgets/${notesId}/todos`, todoInput())
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it(`allows at most ${MAX_TODOS_PER_WIDGET} tasks in a widget`, async () => {
    const { client, alice, widgetId, todosPath } = await setup()
    const last = todoInput()
    // 499 tasks straight in the database, in one query instead of 499 requests
    await client.query(
      `insert into todo_items (id, user_id, widget_id, text, position)
       select gen_random_uuid(), user_id, id, 'Task ' || n, 'a' || n
       from widgets cross join generate_series(1, $2::int) n where id = $1`,
      [widgetId, MAX_TODOS_PER_WIDGET - 1],
    )
    expect((await alice.post(todosPath, last)).status).toBe(201)
    const res = await alice.post(todosPath, todoInput())
    expect(res.status).toBe(422)
    expect((await res.json()).error.code).toBe('LIMIT_EXCEEDED')
    expect((await alice.post(todosPath, last)).status).toBe(200)
  })
})

describe('DELETE /api/widgets/:id', () => {
  it('deletes the tasks of the widget', async () => {
    const { client, alice, widgetId, todosPath } = await setup()
    await alice.post(todosPath, todoInput())
    await alice.delete(`/api/widgets/${widgetId}`)
    const { rows } = await client.query('select id from todo_items')
    expect(rows).toEqual([])
  })
})
```

`apps/api/src/modules/widgets/service.ts` (dwie funkcje dostają `export`)

```ts
export function widgetNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Widget not found')
}

export function ownWidget(userId: string, id: string) {
  return and(eq(widgets.id, id), eq(widgets.userId, userId))
}
```

`apps/api/src/modules/todos/service.ts`

```ts
import { type CreateTodoInput, MAX_TODOS_PER_WIDGET, type TodoDto } from '@one-place/shared'
import { and, asc, eq } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { todoItems, widgets } from '../../db/schema'
import { AppError } from '../../lib/errors'
import { ownWidget, widgetNotFound } from '../widgets/service'

function toTodoDto(row: typeof todoItems.$inferSelect): TodoDto {
  return {
    id: row.id,
    widgetId: row.widgetId,
    text: row.text,
    done: row.done,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  }
}

// Only a todo widget has tasks. Another user's widget is 404, like everywhere else.
async function assertTodoWidget(db: Database, userId: string, widgetId: string) {
  const [widget] = await db
    .select({ type: widgets.type })
    .from(widgets)
    .where(ownWidget(userId, widgetId))
  if (!widget) throw widgetNotFound()
  if (widget.type !== 'todo') {
    throw new AppError(400, 'VALIDATION_ERROR', `Widgets of type ${widget.type} have no tasks`)
  }
}

export async function listTodos(
  db: Database,
  userId: string,
  widgetId: string,
): Promise<TodoDto[]> {
  await assertTodoWidget(db, userId, widgetId)
  const rows = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.widgetId, widgetId), eq(todoItems.userId, userId)))
    // Byte order (COLLATE "C"), then the id for tasks with the same position
    .orderBy(asc(todoItems.position), asc(todoItems.id))
  return rows.map(toTodoDto)
}

export async function createTodo(
  db: Database,
  userId: string,
  widgetId: string,
  input: CreateTodoInput,
): Promise<{ todo: TodoDto; created: boolean }> {
  // The same order as for contexts and widgets: a retry finds its record before any other check
  const [existing] = await db.select().from(todoItems).where(eq(todoItems.id, input.id))
  if (existing) {
    if (existing.userId !== userId) {
      throw new AppError(409, 'ID_CONFLICT', 'This id is already used by another record')
    }
    return { todo: toTodoDto(existing), created: false }
  }
  await assertTodoWidget(db, userId, widgetId)
  const count = await db.$count(todoItems, eq(todoItems.widgetId, widgetId))
  if (count >= MAX_TODOS_PER_WIDGET) {
    throw new AppError(
      422,
      'LIMIT_EXCEEDED',
      `A widget can have at most ${MAX_TODOS_PER_WIDGET} tasks`,
    )
  }
  const [row] = await db
    .insert(todoItems)
    .values({ ...input, userId, widgetId })
    .returning()
  return { todo: toTodoDto(row!), created: true }
}
```

`apps/api/src/modules/todos/routes.ts`

```ts
import { CreateTodoSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import type { AuthEnv } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createTodo, listTodos } from './service'

// /api/widgets/:id/todos. Mounted inside widgetsRoutes, behind its requireAuth, the same way as
// the widgets of a context.
export function widgetTodosRoutes({ db }: Pick<ModuleDeps, 'db'>) {
  return new Hono<AuthEnv>()
    .get('/:id/todos', validate('param', IdParamSchema), async (c) =>
      c.json(await listTodos(db, c.var.user.id, c.req.valid('param').id)),
    )
    .post(
      '/:id/todos',
      validate('param', IdParamSchema),
      validate('json', CreateTodoSchema),
      async (c) => {
        const { id: widgetId } = c.req.valid('param')
        const { todo, created } = await createTodo(db, c.var.user.id, widgetId, c.req.valid('json'))
        return c.json(todo, created ? 201 : 200)
      },
    )
}
```

`apps/api/src/modules/widgets/routes.ts` (nowy import i koniec `widgetsRoutes`)

```ts
import { widgetTodosRoutes } from '../todos/routes'

// …

    .delete('/:id', validate('param', IdParamSchema), async (c) => {
      await deleteWidget(db, c.var.user.id, c.req.valid('param').id)
      return c.body(null, 204)
    })
    .route('/', widgetTodosRoutes({ db }))
}
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego `GET` też sprawdza typ widgetu, skoro nie ma czego psuć?** Bez tego klient dostałby `200 []` dla widgetu Notatek i uznałby, że to pusta lista zadań. Błąd w kliencie (np. zły widget w zapytaniu) byłby niewidoczny.
2. **Ponowienie pięćsetnego zadania przy limicie daje 200, a nie 422. Dlaczego to ważne?** Odpowiedź na pierwsze żądanie mogła zginąć w sieci. Rozszerzenie ponawia je z tym samym ID i musi dostać zapisane zadanie, a nie błąd, po którym cofnęłoby zadanie, które w bazie istnieje.
3. **Jak dwa zadania mogą mieć tę samą pozycję?** Dwa urządzenia dodały zadanie na końcu listy w tym samym czasie: oba wyliczyły pozycję po tym samym ostatnim zadaniu. Indeks ułamkowy nie wymusza unikalności, więc kolejność rozstrzyga `id`.

</details>

---

## Zadanie 4: zmiana i usuwanie zadania

**Cel:** `PATCH /api/todos/:id` zmienia tekst, stan ukończenia albo pozycję zadania i zwraca pełny rekord z nową wersją, a `DELETE` usuwa zadanie. Cudze zadanie daje 404 (F-TODO-02 … F-TODO-05).

**Czego się nauczysz:** osobny router pod nowym prefiksem z własnym `requireAuth`, częściowa zmiana rekordu jednym `UPDATE … RETURNING`.

**Pliki:**

- Zmień: `apps/api/src/modules/todos/service.ts`, `apps/api/src/modules/todos/routes.ts`, `apps/api/src/app.ts`
- Test: `apps/api/test/todos.test.ts`

**Interfejsy:**

- Korzysta z: `UpdateTodoSchema` (zadanie 1), modułu z zadania 3.
- Wytwarza: `updateTodo()`, `deleteTodo()`, `todosRoutes({ db, auth })`, trasy `PATCH` i `DELETE /api/todos/:id`. Rozszerzenie woła je w zadaniu 6.

**Kroki:**

- [x] **1. Czerwone testy** w `test/todos.test.ts`. `setupWithTodo()` dokłada do `setup()` jedno zadanie Alicji:
  - `PATCH` bez tokenu daje 401;
  - `PATCH` z `{ done: true, text: ' Chleb ' }` daje 200, tekst `'Chleb'`, `done: true`, pozycję bez zmian i `version: 2`, a kolejny `PATCH` z samą pozycją zostawia tekst i `done` i daje `version: 3`;
  - `PATCH` Boba daje 404 `{ error: { code: 'NOT_FOUND', message: 'Task not found' } }`, a zadanie Alicji jest nieukończone;
  - `{ text: '' }`, `{ done: 'yes' }` i `{ position: '' }` dają 400 `VALIDATION_ERROR`, a ID `'42'` w ścieżce też 400;
  - `DELETE` bez tokenu daje 401;
  - `DELETE` daje 204, lista jest pusta, a drugi `DELETE` daje 404;
  - `DELETE` Boba daje 404, a zadanie Alicji zostaje.

  Oczekiwany wynik: **FAIL siedmiu testów**. Tym razem także 401: trasy `/api/todos` jeszcze nie ma, więc żądanie dostaje 404 z `handleNotFound`.

- [x] **2. Serwis:** `updateTodo(db, userId, id, input)` i `deleteTodo(db, userId, id)`. Wzór jak `updateContext` i `deleteContext`: jeden `UPDATE … WHERE id AND user_id … RETURNING` z ``updatedAt: sql`now()` `` i `version + 1`, a brak wiersza to `todoNotFound()`.
- [x] **3. Trasy:** `todosRoutes({ db, auth })` z `.use(requireAuth(auth))`, `PATCH /:id` i `DELETE /:id`. W `app.ts` dopisz `.route('/todos', todosRoutes({ db, auth }))` za widgetami.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (97 testów w pakiecie API)**.
- [x] **5.** `pnpm format && pnpm check`, potem commit: `feat(api): add task update and delete`.

**Pułapki (sprawdzone na prototypie):**

- **Osobny router, a nie zagnieżdżony.** `/api/todos/*` nie leży pod żadnym istniejącym prefiksem, więc potrzebuje własnego `requireAuth`. Podwójnego sprawdzania sesji z Etapu 3 tu nie ma: żaden inny router nie pasuje do tej ścieżki.
- **Jedno zapytanie zamiast dwóch.** `updateWidgetConfig` z Etapu 3 najpierw czyta typ widgetu, bo konfigurację sprawdza schemat tego typu. Zadanie nie ma takiej zależności, więc wystarczy sam `UPDATE` z warunkiem na właściciela.
- **`version` rośnie przy każdym zapisie.** Także przy zmianie samej pozycji. W MVP serwer jej nie porównuje (F-SYNC-06), ale klient dostaje aktualną wartość w odpowiedzi.

<details>
<summary>Podpowiedź</summary>

- ``.set({ ...input, updatedAt: sql`now()`, version: sql`${todoItems.version} + 1` })``. Pola, których nie ma w `input`, Drizzle pomija.
- `deleteTodo`: `db.delete(todoItems).where(ownTodo(userId, id)).returning({ id: todoItems.id })` i 404, gdy wynik jest pusty.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/api/test/todos.test.ts` (nowa stała obok `widgetNotFound` i nowe testy na końcu pliku)

```ts
const todoNotFound = { error: { code: 'NOT_FOUND', message: 'Task not found' } }

// …

async function setupWithTodo() {
  const result = await setup()
  const todo = todoInput()
  await result.alice.post(result.todosPath, todo)
  return { ...result, todoId: todo.id }
}

describe('PATCH /api/todos/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/todos/${todoInput().id}`, { method: 'PATCH' })
    expect(res.status).toBe(401)
  })

  it('changes the given fields and increments the version', async () => {
    const { alice, todoId } = await setupWithTodo()
    const res = await alice.patch(`/api/todos/${todoId}`, { done: true, text: ' Chleb ' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      text: 'Chleb',
      done: true,
      position: 'a0',
      version: 2,
    })
    const moved = await alice.patch(`/api/todos/${todoId}`, { position: 'a5' })
    expect(await moved.json()).toMatchObject({
      text: 'Chleb',
      done: true,
      position: 'a5',
      version: 3,
    })
  })

  it("returns 404 for another user's task and leaves it unchanged", async () => {
    const { alice, bob, todoId, todosPath } = await setupWithTodo()
    const res = await bob.patch(`/api/todos/${todoId}`, { done: true })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(todoNotFound)
    const [todo] = await (await alice.get(todosPath)).json()
    expect(todo.done).toBe(false)
  })

  it('rejects invalid fields and an id that is not a UUID', async () => {
    const { alice, todoId } = await setupWithTodo()
    for (const body of [{ text: '' }, { done: 'yes' }, { position: '' }]) {
      const res = await alice.patch(`/api/todos/${todoId}`, body)
      expect(res.status).toBe(400)
      expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
    }
    expect((await alice.patch('/api/todos/42', { done: true })).status).toBe(400)
  })
})

describe('DELETE /api/todos/:id', () => {
  it('returns 401 without a token', async () => {
    const { app } = await createTestApp()
    const res = await app.request(`/api/todos/${todoInput().id}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('deletes the task', async () => {
    const { alice, todoId, todosPath } = await setupWithTodo()
    expect((await alice.delete(`/api/todos/${todoId}`)).status).toBe(204)
    expect(await (await alice.get(todosPath)).json()).toEqual([])
    expect((await alice.delete(`/api/todos/${todoId}`)).status).toBe(404)
  })

  it("returns 404 for another user's task and keeps it", async () => {
    const { alice, bob, todoId, todosPath } = await setupWithTodo()
    const res = await bob.delete(`/api/todos/${todoId}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(todoNotFound)
    expect(await (await alice.get(todosPath)).json()).toHaveLength(1)
  })
})
```

`apps/api/src/modules/todos/service.ts` (nowe importy i funkcje na końcu pliku)

```ts
import {
  type CreateTodoInput,
  MAX_TODOS_PER_WIDGET,
  type TodoDto,
  type UpdateTodoInput,
} from '@one-place/shared'
import { and, asc, eq, sql } from 'drizzle-orm'

// …

function todoNotFound() {
  return new AppError(404, 'NOT_FOUND', 'Task not found')
}

function ownTodo(userId: string, id: string) {
  return and(eq(todoItems.id, id), eq(todoItems.userId, userId))
}

export async function updateTodo(
  db: Database,
  userId: string,
  id: string,
  input: UpdateTodoInput,
): Promise<TodoDto> {
  const [row] = await db
    .update(todoItems)
    .set({ ...input, updatedAt: sql`now()`, version: sql`${todoItems.version} + 1` })
    .where(ownTodo(userId, id))
    .returning()
  if (!row) throw todoNotFound()
  return toTodoDto(row)
}

export async function deleteTodo(db: Database, userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(todoItems)
    .where(ownTodo(userId, id))
    .returning({ id: todoItems.id })
  if (deleted.length === 0) throw todoNotFound()
}
```

`apps/api/src/modules/todos/routes.ts` (nowe importy i drugi router)

```ts
import { CreateTodoSchema, UpdateTodoSchema } from '@one-place/shared'
import { Hono } from 'hono'
import { IdParamSchema, validate } from '../../lib/validate'
import { type AuthEnv, requireAuth } from '../../middleware/require-auth'
import type { ModuleDeps } from '../deps'
import { createTodo, deleteTodo, listTodos, updateTodo } from './service'

// …widgetTodosRoutes bez zmian…

export function todosRoutes({ db, auth }: ModuleDeps) {
  return new Hono()
    .use(requireAuth(auth))
    .patch(
      '/:id',
      validate('param', IdParamSchema),
      validate('json', UpdateTodoSchema),
      async (c) => {
        const { id } = c.req.valid('param')
        return c.json(await updateTodo(db, c.var.user.id, id, c.req.valid('json')))
      },
    )
    .delete('/:id', validate('param', IdParamSchema), async (c) => {
      await deleteTodo(db, c.var.user.id, c.req.valid('param').id)
      return c.body(null, 204)
    })
}
```

`apps/api/src/app.ts` (nowy import i nowa trasa)

```ts
import { todosRoutes } from './modules/todos/routes'

// …

    .route('/widgets', widgetsRoutes({ db, auth }))
    .route('/todos', todosRoutes({ db, auth }))
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego `PATCH` przyjmuje pozycję zamiast „przesuń przed zadanie X”?** Pozycję wylicza klient z indeksu ułamkowego, więc przesunięcie to zmiana jednego rekordu. Serwer nie musi znać sąsiadów ani przenumerowywać listy, a ostatni zapis wygrywa jak przy każdym innym polu.
2. **Czy `PATCH` z `{ widgetId: … }` przeniesie zadanie do innego widgetu?** Nie. `UpdateTodoSchema` nie ma tego pola, a Zod usuwa nieznane klucze (test z zadania 1), więc do `set()` nic nie trafia.
3. **Co by się stało, gdyby `todosRoutes` nie miał `requireAuth`?** `c.var.user` byłby `undefined` i odczyt `c.var.user.id` rzuciłby wyjątek, czyli 500. TypeScript by tego nie złapał w `new Hono()` bez typu, a w `new Hono<AuthEnv>()` typ obiecywałby coś, czego nikt nie ustawił.

</details>

---

## Zadanie 5: wspólne funkcje pozycji w `src/lib/`

**Cel:** konteksty i zadania korzystają z tych samych funkcji kolejności. `positions.ts` przechodzi z `features/contexts/` do `src/lib/`, dostaje `positionBetween(before, after)`, a sortowanie z `queries/contexts.ts` staje się wspólnym `byPosition` w osobnym pliku.

**Czego się nauczysz:** refaktoryzacja z `git mv` przy zielonych testach, jak jeden import przesuwa bibliotekę na ścieżkę startową, mierzenie tego przez `pnpm size`.

**Pliki:**

- Przenieś: `apps/extension/src/features/contexts/positions.ts` → `apps/extension/src/lib/positions.ts` (razem z testem)
- Utwórz: `apps/extension/src/lib/by-position.ts`
- Zmień: `apps/extension/src/queries/contexts.ts`, `apps/extension/src/features/contexts/use-add-context.ts`, `apps/extension/src/features/contexts/ManageContexts.vue`
- Test: `apps/extension/src/lib/positions.test.ts`, `apps/extension/src/lib/by-position.test.ts`

**Interfejsy:**

- Wytwarza: `positionAfterLast(list)`, `positionAt(list, index)` (bez zmian), `positionBetween(before, after)` i `byPosition(a, b)`. Używają ich zadania 6 i 8.

**Kroki:**

- [x] **1. Przeniesienie.** `git mv apps/extension/src/features/contexts/positions.ts apps/extension/src/lib/positions.ts` i tak samo test. Popraw importy w `use-add-context.ts` i `ManageContexts.vue` na `@/lib/positions`. Oczekiwany wynik: **PASS (74 testy w rozszerzeniu)**. Refaktoryzacja nie zmienia zachowania, więc testy nie mogą się zmienić.
- [x] **2. Czerwone testy:**
  - w `lib/positions.test.ts`: `positionBetween(null, null)` to `'a0'`; `positionBetween(null, 'a0')` jest mniejsze od `'a0'`, `positionBetween('a1', null)` większe od `'a1'`, a `positionBetween('a0', 'a1')` leży między nimi; przy równych sąsiadach `positionBetween('a1', 'a1')` jest większe od `'a1'` i nie rzuca;
  - w nowym `lib/by-position.test.ts`: lista `[{ id: '2', position: 'a0' }, { id: '3', position: 'Zz' }, { id: '1', position: 'a0' }]` posortowana przez `byPosition` daje ID `['3', '1', '2']`.

  Oczekiwany wynik: **FAIL**, bo obu funkcji nie ma w `lib/`.

- [x] **3. Implementacja.** `positionBetween(before, after)` przejmuje ciało `positionAt` (z obsługą równych sąsiadów), a `positionAt` tylko wybiera sąsiadów z listy i woła `positionBetween`. Funkcję `byPosition` przenieś z `queries/contexts.ts` do `lib/by-position.ts` (typ parametrów: `{ id: string; position: string }`) i zaimportuj ją w `contexts.ts`.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (77 testów w rozszerzeniu)**.
- [x] **5. Eksperyment: `byPosition` w `positions.ts`.** Przenieś na chwilę `byPosition` do `lib/positions.ts` i importuj ją stamtąd w `queries/contexts.ts`. Zbuduj i uruchom `pnpm size`. **Oczekiwany wynik:** startowy JS rośnie o około 3,5 kB. `queries/contexts.ts` jest na ścieżce startowej, a `positions.ts` importuje `fractional-indexing`, który przy starcie nie jest potrzebny: klucze generuje się dopiero przy dodawaniu i przeciąganiu. Przywróć osobny plik.
- [x] **6.** `pnpm format && pnpm check`, potem commit: `refactor(extension): move position helpers to lib`.

**Pułapki (sprawdzone na prototypie):**

- **Najpierw przeniesienie, potem zmiana.** Krok 1 kończy się zielonymi testami bez nowej funkcjonalności. Gdyby coś się zepsuło przy przenoszeniu, wiadomo, że to import, a nie nowa logika.
- **Tree shaking nie pomaga w ramach jednego modułu z importem.** Vite wycina nieużywane funkcje, ale import `generateKeyBetween` na górze pliku sprawia, że moduł `fractional-indexing` trafia do tego samego chunka co `byPosition`. To ten sam mechanizm co z Zodem w Etapie 3, tylko mniejszy.
- **Sąsiedzi zamiast indeksu.** `positionAt(list, index)` zakłada, że lista zawiera wszystkie elementy. Lista zadań przy „Ukryj ukończone” pokazuje tylko część, więc źródło zadań dostaje ID sąsiadów i woła `positionBetween` z ich pozycjami (zadanie 8).

<details>
<summary>Podpowiedź</summary>

- `positionAt(list, index)` po zmianie to jedna linia: `positionBetween(list[index - 1]?.position ?? null, list[index + 1]?.position ?? null)`.
- `byPosition` nie potrzebuje żadnego importu. Typ parametrów możesz zapisać wprost, bez interfejsu.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/lib/positions.ts`

```ts
import { generateKeyBetween } from 'fractional-indexing'

interface Positioned {
  position: string
}

export function positionAfterLast(list: Positioned[]) {
  return generateKeyBetween(list.at(-1)?.position ?? null, null)
}

// A position between two neighbours, null meaning the start or the end of the list
export function positionBetween(before: string | null, after: string | null) {
  // Equal neighbours (added on two devices at once) leave no room in between, and
  // generateKeyBetween() would throw. Going right after `before` is close enough.
  if (before !== null && after !== null && before >= after) {
    return generateKeyBetween(before, null)
  }
  return generateKeyBetween(before, after)
}

// `list` is already in the new order. Only the moved item gets a new position, between its
// new neighbours, so a move is a single PATCH.
export function positionAt(list: Positioned[], index: number) {
  return positionBetween(list[index - 1]?.position ?? null, list[index + 1]?.position ?? null)
}
```

`apps/extension/src/lib/by-position.ts`

```ts
// Not in positions.ts: the queries sort on the start-up path, and positions.ts brings
// fractional-indexing with it, which only adding and moving need.

// The same order as the API: byte order (COLLATE "C"), then the id. localeCompare() would put
// 'Zz' after 'a0'.
export function byPosition(
  a: { id: string; position: string },
  b: { id: string; position: string },
) {
  if (a.position !== b.position) return a.position < b.position ? -1 : 1
  return a.id < b.id ? -1 : 1
}
```

`apps/extension/src/lib/positions.test.ts` (nowy import i nowe testy na końcu)

```ts
import { positionAfterLast, positionAt, positionBetween } from './positions'

// …

describe('positionBetween', () => {
  it('goes between the neighbours, or to the start or the end of the list', () => {
    expect(positionBetween(null, null)).toBe('a0')
    expect(positionBetween(null, 'a0') < 'a0').toBe(true)
    expect(positionBetween('a1', null) > 'a1').toBe(true)
    const middle = positionBetween('a0', 'a1')
    expect(middle > 'a0' && middle < 'a1').toBe(true)
  })

  it('goes right after the first neighbour when both have the same position', () => {
    expect(positionBetween('a1', 'a1') > 'a1').toBe(true)
  })
})
```

`apps/extension/src/lib/by-position.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { byPosition } from './by-position'

describe('byPosition', () => {
  it('sorts by bytes like the API, then by id', () => {
    const list = [
      { id: '2', position: 'a0' },
      { id: '3', position: 'Zz' },
      { id: '1', position: 'a0' },
    ]
    expect(list.sort(byPosition).map((item) => item.id)).toEqual(['3', '1', '2'])
  })
})
```

`apps/extension/src/queries/contexts.ts` (funkcja `byPosition` usunięta, nowy import)

```ts
import { apiClient } from '@/api/client'
import { byPosition } from '@/lib/by-position'
```

`use-add-context.ts` i `ManageContexts.vue`: import z `'@/lib/positions'` zamiast `'./positions'`.

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego `src/lib/`, a nie `features/contexts/`?** Z pozycji korzystają teraz konteksty i widget Zadania. Import z `features/contexts/` w `widgets/todo/` wiązałby widget z funkcją zarządzania kontekstami, z którą nie ma nic wspólnego.
2. **Czy `byPosition` nie mógłby używać `localeCompare`, skoro to tylko sortowanie w przeglądarce?** Nie. Cache musi mieć tę samą kolejność co API. `localeCompare` postawiłby `'Zz'` za `'a0'`, więc zadanie przeciągnięte na górę skakałoby na dół po optymistycznej zmianie i wracało na górę po odpowiedzi serwera.
3. **Co jest ważniejsze w kroku 5: 3,5 kB czy sam mechanizm?** Mechanizm. Kilka kilobajtów mieści się w budżecie, ale ten sam błąd z większą biblioteką (Zod, Nuxt UI) kosztował w poprzednich etapach dziesiątki kilobajtów. `pnpm size` po każdej zmianie importów na ścieżce startowej pokazuje to od razu.

</details>

---

## Zadanie 6: `useTodos()` i mutacje zadań

**Cel:** rozszerzenie czyta i zmienia zadania przez composables z `src/queries/`, optymistycznie i z cofaniem przy błędzie (F-SYNC-04). Nowy widget Zadania ma od razu pustą listę zadań w cache, a zadania usuniętego widgetu albo kontekstu znikają z cache.

**Czego się nauczysz:** cache z kluczem zależnym od widgetu, sortowanie optymistycznego wpisu tak jak robi to API, zależności między wpisami cache różnych zasobów, `useMutationState` drugi raz w innej roli.

**Pliki:**

- Utwórz: `apps/extension/src/queries/todos.ts`
- Zmień: `apps/extension/src/queries/keys.ts`, `apps/extension/src/queries/widgets.ts`, `apps/extension/src/queries/contexts.ts`
- Test: `apps/extension/src/queries/todos.test.ts`

**Interfejsy:**

- Korzysta z: `TodoDto`, `CreateTodoInput`, `UpdateTodoInput` (zadanie 1), tras z zadań 3 i 4, `byPosition` (zadanie 5), `changeOptimistically`, `withQueryClient`, `deferred`, `jsonResponse` (Etapy 2 i 3).
- Wytwarza: `todosKey(widgetId)` i `createWidgetKey` w `keys.ts`, `useTodos(widgetId)`, `useAddTodo()`, `useUpdateTodo()` i `useDeleteTodo()`. Używa ich źródło zadań w zadaniu 8.

**Kroki:**

- [x] **1. Klucze.** W `keys.ts` dopisz `createWidgetKey = ['widgets', 'create'] as const` i `todosKey(widgetId)` zwracające `['todos', widgetId] as const`.
- [x] **2. Czerwone testy** w `queries/todos.test.ts`. Mock `@/api/client` podmienia trasy zadań oraz `$post` widgetów, `$delete` widgetu i `$delete` kontekstu. Cache zaczyna od `[milk (a0), bread (a1)]` pod `todosKey('tasks')`:
  - `useAddTodo` pokazuje nowe zadanie od razu na końcu listy z `done: false` i `version: 1`, a po odpowiedzi podmienia je na zapisane;
  - `useAddTodo` usuwa nowe zadanie, gdy API odpowie 422;
  - `useUpdateTodo` z pozycją `'Zz'` od razu przestawia zadanie na początek listy, a po odpowiedzi ma `version: 2`;
  - `useUpdateTodo` przywraca zadanie, gdy API odpowie 400;
  - `useDeleteTodo` traktuje 404 jak sukces (zadanie usunięte na innym urządzeniu);
  - `useTodos` dla widgetu dodanego w tej karcie od razu zwraca `[]` i nie wysyła `GET`, dopóki API nie zapisze widgetu, a potem wysyła jeden;
  - po `useDeleteWidget` wpisu `todosKey('tasks')` nie ma w cache;
  - po `useDeleteContext('work')` nie ma w cache zadań widgetów tego kontekstu.

  Oczekiwany wynik: **FAIL**, bo moduł `./todos` nie istnieje.

- [x] **3. Implementacja** `queries/todos.ts`. Lista w cache jest zawsze posortowana: pomocnik `withTodo(list, todo)` podmienia albo dopisuje zadanie i sortuje przez `byPosition`, tak jak `withContext` w `contexts.ts`. `useTodos` czeka na zapis widgetu przez `useMutationState` z `createWidgetKey`, tak jak `useWidgets` czeka na zapis kontekstu.
- [x] **4. Zależności w cache.** W `widgets.ts`: `useCreateWidget` dostaje `mutationKey: createWidgetKey`, w `onMutate` wpisuje `[]` pod `todosKey(input.id)` dla widgetu typu `todo`, a w `onError` usuwa ten wpis; `useDeleteWidget` w `onSuccess` usuwa `todosKey(id)`. W `contexts.ts`: `useDeleteContext` w `onSuccess` usuwa zadania każdego widgetu z `widgetsKey(id)`, zanim usunie sam wpis widgetów.
- [x] **5. Zielone testy.** Oczekiwany wynik: **PASS (85 testów w rozszerzeniu)**.
- [x] **6. Eksperyment: zadania nowego widgetu.** Usuń na chwilę z `useTodos` opcję `enabled`. Oczekiwany wynik: test `useTodos` **FAIL**, bo `GET` wychodzi od razu. W przeglądarce oznaczałoby to 404 i komunikat błędu w widgecie, który dopiero powstał. Przywróć `enabled` i usuń z kolei wpis `[]` z `onMutate` w `useCreateWidget`: ten sam test **FAIL**, bo czeka na `[]`, którego nie ma, czyli widget dodany offline pokazywałby szkielety. Przywróć wpis. Na koniec usuń `removeQueries` z `useDeleteWidget`: test sprzątania **FAIL**.
- [x] **7.** `pnpm format && pnpm check`, potem commit: `feat(extension): add todo queries with optimistic mutations`.

**Pułapki (sprawdzone na prototypie):**

- **Wpis `[]` tylko dla typu `todo`.** `useCreateWidget` obsługuje wszystkie typy, a pusty wpis zadań dla przyszłych Notatek leżałby w `chrome.storage.local` bez powodu.
- **Zadania kontekstu usuwa się przed widgetami.** Lista widgetów kontekstu jest jedynym miejscem, z którego wiadomo, czyje zadania usunąć. Po `removeQueries(widgetsKey(id))` tej informacji już nie ma.
- **`mutationFn` wybiera pola wprost.** `({ id, text, done, position })` zamiast `({ id, widgetId: _, ...changes })`: ESLint w tym repozytorium zgłasza nieużywaną zmienną `_`. Pola `undefined` i tak znikają w `JSON.stringify`.
- **Sortowanie w `onMutate`, a nie w komponencie.** Przesunięcie zadania zmienia tylko jego pozycję. Bez sortowania w cache lista pokazałaby je w starym miejscu aż do odpowiedzi serwera.

<details>
<summary>Podpowiedź</summary>

- `useTodos` to prawie kopia `useWidgets`: inny klucz mutacji, inny klucz zapytania i `enabled: computed(() => !unsaved.value.includes(toValue(widgetId)))`.
- Szkic optymistycznego zadania: `{ ...input, widgetId, done: false, createdAt: now, updatedAt: now, version: 1 }`.
- Usunięcie zadań widgetów kontekstu: `for (const widget of queryClient.getQueryData<WidgetDto[]>(widgetsKey(id)) ?? []) queryClient.removeQueries({ queryKey: todosKey(widget.id) })`.
- `useCreateWidget` w `onMutate` musi teraz poczekać na `changeOptimistically` (`async` i `await`), zanim dopisze drugi wpis i zwróci funkcję cofającą.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/keys.ts` (na końcu pliku)

```ts
// Lets useTodos() find widgets that are in the cache but not saved by the API yet
export const createWidgetKey = ['widgets', 'create'] as const

export function todosKey(widgetId: string) {
  return ['todos', widgetId] as const
}
```

`apps/extension/src/queries/todos.ts`

```ts
import type {
  CreateTodoInput,
  CreateWidgetInput,
  TodoDto,
  UpdateTodoInput,
} from '@one-place/shared'
import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parseResponse } from 'hono/client'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { apiErrorInfo } from '@/api/api-error'
import { apiClient } from '@/api/client'
import { byPosition } from '@/lib/by-position'
import { createWidgetKey, todosKey } from './keys'
import { changeOptimistically } from './optimistic'

interface TodoRef {
  id: string
  widgetId: string
}

// Adds the task or replaces the one with the same id, keeping the list sorted
function withTodo(list: TodoDto[], todo: TodoDto) {
  return [...list.filter((item) => item.id !== todo.id), todo].sort(byPosition)
}

export function useTodos(widgetId: MaybeRefOrGetter<string>) {
  // The same as with a new context: a widget added in this tab is in the cache before the API
  // saves it, and its tasks would get 404. Until then the cache has [] from useCreateWidget().
  const unsaved = useMutationState({
    filters: { mutationKey: createWidgetKey, status: 'pending' },
    select: (mutation) => (mutation.state.variables as CreateWidgetInput).id,
  })
  return useQuery({
    queryKey: computed(() => todosKey(toValue(widgetId))),
    queryFn: ({ queryKey: [, id] }) =>
      parseResponse(apiClient.api.widgets[':id'].todos.$get({ param: { id } })),
    enabled: computed(() => !unsaved.value.includes(toValue(widgetId))),
  })
}

export function useAddTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ widgetId, ...input }: CreateTodoInput & { widgetId: string }) =>
      parseResponse(
        apiClient.api.widgets[':id'].todos.$post({ param: { id: widgetId }, json: input }),
      ),
    onMutate: ({ widgetId, ...input }) => {
      const now = new Date().toISOString()
      const draft: TodoDto = {
        ...input,
        widgetId,
        done: false,
        createdAt: now,
        updatedAt: now,
        version: 1,
      }
      return changeOptimistically<TodoDto[]>(queryClient, todosKey(widgetId), (list) =>
        withTodo(list, draft),
      )
    },
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<TodoDto[]>(todosKey(saved.widgetId), (list = []) =>
        withTodo(list, saved),
      ),
  })
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, text, done, position }: TodoRef & UpdateTodoInput) =>
      parseResponse(
        apiClient.api.todos[':id'].$patch({ param: { id }, json: { text, done, position } }),
      ),
    onMutate: ({ id, widgetId, ...changes }) =>
      changeOptimistically<TodoDto[]>(queryClient, todosKey(widgetId), (list) => {
        const current = list.find((item) => item.id === id)
        return current ? withTodo(list, { ...current, ...changes }) : list
      }),
    onError: (_error, _input, rollback) => rollback?.(),
    onSuccess: (saved) =>
      queryClient.setQueryData<TodoDto[]>(todosKey(saved.widgetId), (list = []) =>
        withTodo(list, saved),
      ),
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: TodoRef) => {
      try {
        await parseResponse(apiClient.api.todos[':id'].$delete({ param: { id } }))
      } catch (error) {
        // Already deleted, e.g. on another device
        if (apiErrorInfo(error)?.status !== 404) throw error
      }
    },
    onMutate: ({ id, widgetId }) =>
      changeOptimistically<TodoDto[]>(queryClient, todosKey(widgetId), (list) =>
        list.filter((item) => item.id !== id),
      ),
    onError: (_error, _input, rollback) => rollback?.(),
  })
}
```

`apps/extension/src/queries/widgets.ts` (nowy import, `useCreateWidget` i koniec `useDeleteWidget`)

```ts
import { createContextKey, createWidgetKey, todosKey, widgetsKey } from './keys'

// …

export function useCreateWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: createWidgetKey,
    mutationFn: ({ contextId, ...input }: CreateWidgetInput & { contextId: string }) =>
      parseResponse(
        apiClient.api.contexts[':id'].widgets.$post({ param: { id: contextId }, json: input }),
      ),
    onMutate: async ({ contextId, ...input }) => {
      const now = new Date().toISOString()
      const draft: WidgetDto = { ...input, contextId, createdAt: now, updatedAt: now, version: 1 }
      const rollback = await changeOptimistically<WidgetDto[]>(
        queryClient,
        widgetsKey(contextId),
        (list) => withWidget(list, draft),
      )
      // A new todo widget has no tasks. It shows that at once, also offline.
      if (input.type === 'todo') queryClient.setQueryData(todosKey(input.id), [])
      return rollback
    },
    onError: (_error, input, rollback) => {
      rollback?.()
      queryClient.removeQueries({ queryKey: todosKey(input.id) })
    },
    onSuccess: (saved) =>
      queryClient.setQueryData<WidgetDto[]>(widgetsKey(saved.contextId), (list = []) =>
        withWidget(list, saved),
      ),
  })
}

// …w useDeleteWidget, za onError:

    // Otherwise the tasks would stay in chrome.storage.local until sign-out
    onSuccess: (_data, { id }) => queryClient.removeQueries({ queryKey: todosKey(id) }),
```

`apps/extension/src/queries/contexts.ts` (nowy import i `onSuccess` w `useDeleteContext`)

```ts
import { createContextKey, todosKey, widgetsKey } from './keys'

// …

    onSuccess: (_data, id) => {
      // The API deleted the widgets and their tasks, so their cache entries go too
      for (const widget of queryClient.getQueryData<WidgetDto[]>(widgetsKey(id)) ?? []) {
        queryClient.removeQueries({ queryKey: todosKey(widget.id) })
      }
      queryClient.removeQueries({ queryKey: widgetsKey(id) })
    },
```

`apps/extension/src/queries/todos.test.ts`

```ts
import type { TodoDto, WidgetDto } from '@one-place/shared'
import { QueryClient } from '@tanstack/vue-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDeleteContext } from './contexts'
import { todosKey, widgetsKey } from './keys'
import { deferred, jsonResponse, withQueryClient } from './testing'
import { useAddTodo, useDeleteTodo, useTodos, useUpdateTodo } from './todos'
import { useCreateWidget, useDeleteWidget } from './widgets'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  createWidget: vi.fn(),
  deleteWidget: vi.fn(),
  deleteContext: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  apiClient: {
    api: {
      contexts: {
        ':id': { widgets: { $post: api.createWidget }, $delete: api.deleteContext },
      },
      widgets: {
        ':id': { todos: { $get: api.get, $post: api.post }, $delete: api.deleteWidget },
      },
      todos: { ':id': { $patch: api.patch, $delete: api.delete } },
    },
  },
}))

function todo(overrides: Partial<TodoDto>): TodoDto {
  return {
    id: 'id',
    widgetId: 'tasks',
    text: 'Mleko',
    done: false,
    position: 'a0',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
    ...overrides,
  }
}

const milk = todo({ id: 'milk', position: 'a0' })
const bread = todo({ id: 'bread', text: 'Chleb', position: 'a1' })
const key = todosKey('tasks')

let queryClient: QueryClient

function cached() {
  return queryClient.getQueryData<TodoDto[]>(key)
}

function ids() {
  return cached()?.map((item) => item.id)
}

beforeEach(() => {
  vi.resetAllMocks()
  queryClient = new QueryClient()
  queryClient.setQueryData(key, [milk, bread])
})

describe('useAddTodo', () => {
  it('shows the new task at once and then replaces it with the saved one', async () => {
    const response = deferred<Response>()
    api.post.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useAddTodo)

    const saving = mutateAsync({ widgetId: 'tasks', id: 'butter', text: 'Masło', position: 'a2' })
    await vi.waitFor(() => expect(ids()).toEqual(['milk', 'bread', 'butter']))
    expect(cached()?.[2]).toMatchObject({ done: false, version: 1 })

    const saved = todo({ id: 'butter', text: 'Masło', position: 'a2' })
    response.resolve(jsonResponse(201, saved))
    await saving
    expect(cached()?.[2]).toEqual(saved)
  })

  it('removes the new task when the API rejects it', async () => {
    api.post.mockResolvedValue(
      jsonResponse(422, { error: { code: 'LIMIT_EXCEEDED', message: 'Too many tasks' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useAddTodo)
    await expect(
      mutateAsync({ widgetId: 'tasks', id: 'butter', text: 'Masło', position: 'a2' }),
    ).rejects.toThrow()
    expect(cached()).toEqual([milk, bread])
  })
})

describe('useUpdateTodo', () => {
  it('moves a task at once, keeping the list sorted by position', async () => {
    const response = deferred<Response>()
    api.patch.mockReturnValue(response.promise)
    const { mutateAsync } = withQueryClient(queryClient, useUpdateTodo)

    const saving = mutateAsync({ id: 'bread', widgetId: 'tasks', position: 'Zz' })
    await vi.waitFor(() => expect(ids()).toEqual(['bread', 'milk']))

    response.resolve(jsonResponse(200, { ...bread, position: 'Zz', version: 2 }))
    await saving
    expect(cached()?.[0]).toMatchObject({ id: 'bread', version: 2 })
  })

  it('brings back the task when the API rejects the change', async () => {
    api.patch.mockResolvedValue(
      jsonResponse(400, { error: { code: 'VALIDATION_ERROR', message: 'Invalid' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useUpdateTodo)
    await expect(mutateAsync({ id: 'milk', widgetId: 'tasks', done: true })).rejects.toThrow()
    expect(cached()).toEqual([milk, bread])
  })
})

describe('useDeleteTodo', () => {
  it('treats a task deleted on another device as deleted', async () => {
    api.delete.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Task not found' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useDeleteTodo)
    await mutateAsync({ id: 'milk', widgetId: 'tasks' })
    expect(cached()).toEqual([bread])
  })
})

describe('useTodos', () => {
  it('waits with the tasks of a new widget until the API saves the widget', async () => {
    const saved = deferred<Response>()
    api.createWidget.mockReturnValue(saved.promise)
    api.get.mockResolvedValue(jsonResponse(200, []))
    queryClient.setQueryData(widgetsKey('work'), [])
    const input = { id: 'shopping', type: 'todo', config: {}, x: 0, y: 0, w: 4, h: 6 } as const
    const { mutate } = withQueryClient(queryClient, useCreateWidget)

    mutate({ contextId: 'work', ...input })
    const { data } = withQueryClient(queryClient, () => useTodos('shopping'))
    await vi.waitFor(() => expect(data.value).toEqual([]))
    expect(api.get).not.toHaveBeenCalled()

    saved.resolve(jsonResponse(201, { ...input, contextId: 'work', createdAt: 'now' }))
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledOnce())
  })
})

describe('cache of deleted widgets', () => {
  it('removes the tasks of a deleted widget', async () => {
    api.deleteWidget.mockResolvedValue(new Response(null, { status: 204 }))
    queryClient.setQueryData(widgetsKey('work'), [{ id: 'tasks' }])
    const { mutateAsync } = withQueryClient(queryClient, useDeleteWidget)
    await mutateAsync({ id: 'tasks', contextId: 'work' })
    expect(cached()).toBeUndefined()
  })

  it('removes the tasks of the widgets of a deleted context', async () => {
    api.deleteContext.mockResolvedValue(new Response(null, { status: 204 }))
    queryClient.setQueryData<Partial<WidgetDto>[]>(widgetsKey('work'), [{ id: 'tasks' }])
    const { mutateAsync } = withQueryClient(queryClient, useDeleteContext)
    await mutateAsync('work')
    expect(cached()).toBeUndefined()
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Czy trzeba zmienić `CACHE_SCHEMA_VERSION`?** Nie. Dochodzi nowy klucz `['todos', …]`, a kształt istniejących wpisów (konteksty, widgety, ustawienia) się nie zmienia. Stary cache po aktualizacji jest nadal poprawny, a zadania pobiorą się przy pierwszym otwarciu widgetu.
2. **Dlaczego `useTodos` nie sprawdza po prostu, czy widget ma `version: 1` i świeże `createdAt`?** Bo zapisany widget też ma `version: 1`. Jedyną pewną informacją, że API jeszcze nie zna widgetu, jest czekająca mutacja jego utworzenia.
3. **Po co sortować w `onSuccess`, skoro `onMutate` już posortował?** Zapisane zadanie podmienia szkic. Gdyby inne urządzenie zmieniło w międzyczasie listę i przyszło odświeżenie, `withTodo` i tak wstawia rekord w miejsce wynikające z pozycji, a nie na koniec.

</details>

---

## Zadanie 7: kolejka zapisów i ostatnia zmiana

**Cel:** wszystkie zmiany idą do API po kolei, w kolejności wykonania, także po powrocie sieci (decyzja 1). Odpowiedź na starszą zmianę zadań nie nadpisuje w cache nowszej zmiany, która jeszcze czeka. W przeglądarce, z gotową listą zadań, sprawdzisz to w zadaniu 14, także z wyłączoną kolejką.

**Czego się nauczysz:** `scope` mutacji w TanStack Query, `isPaused` i `isMutating`, wspólne `mutationKey` dla kilku mutacji, testowanie kolejności odpowiedzi przez `deferred`.

**Pliki:**

- Zmień: `apps/extension/src/queries/query-client.ts`, `apps/extension/src/queries/todos.ts`
- Test: `apps/extension/src/queries/todos.test.ts`

**Interfejsy:**

- Korzysta z: `createQueryClient()` (Etap 2), mutacji z zadania 6.
- Wytwarza: domyślne `mutations.scope` w `createQueryClient` (dotyczy wszystkich mutacji w aplikacji) i regułę „ostatnia zmiana zapisuje” w mutacjach zadań.

**Kroki:**

- [x] **1. Czerwony test kolejki.** W `todos.test.ts` zmień `beforeEach` na `queryClient = createQueryClient()`, żeby testy miały ustawienia aplikacji. Dopisz test: `add.mutate(…butter…)` z odpowiedzią `deferred`, zaraz potem `remove.mutate({ id: 'butter', … })`. Usunięcie ma czekać w kolejce: `await vi.waitFor(() => expect(remove.isPaused.value).toBe(true))`, `api.delete` nie zostało wywołane, a po odpowiedzi na `POST` zostaje wywołane raz. Oczekiwany wynik: **FAIL** (`isPaused` nigdy nie staje się `true`).
- [x] **2. Kolejka.** W `createQueryClient` dopisz `mutations: { scope: { id: 'api' } }`. Oczekiwany wynik: test kolejki **PASS**.
- [x] **3. Czerwony test ostatniej zmiany.** Szybkie podwójne kliknięcie checkboxa: `mutate({ id: 'milk', …, done: true })`, zaraz potem `done: false`, obie odpowiedzi `deferred`. Po odpowiedzi na pierwsze (`done: true`) cache ma nadal pokazywać `done: false`, a po odpowiedzi na drugie `version: 3`. Oczekiwany wynik: **FAIL**, bo `onSuccess` pierwszej mutacji zapisuje `done: true`.
- [x] **4. Ostatnia zmiana zapisuje.** Trzy mutacje zadań dostają wspólne `mutationKey: todoChangeKey` (`['todos', 'change']`). Funkcja `hasLaterChanges(queryClient)` sprawdza, czy `isMutating({ mutationKey: todoChangeKey }) > 1`, a `onSuccess` w `useAddTodo` i `useUpdateTodo` nic nie zapisuje, gdy tak jest. Oczekiwany wynik: **PASS (87 testów w rozszerzeniu)**.
- [x] **5.** `pnpm format && pnpm check`, potem commit: `feat(extension): send changes to the API one after another`.

**Pułapki (sprawdzone na prototypie):**

- **`onMutate` działa od razu, `mutationFn` czeka.** Mutacja w kolejce ma status `pending` i `isPaused: true`, ale jej zmiana optymistyczna jest już w cache. Dlatego UI wygląda tak samo z kolejką i bez niej, a różnica jest tylko w Network.
- **Ta mutacja liczy się w `isMutating`.** `onSuccess` wykonuje się, zanim mutacja zmieni status na `success`, więc „żadnych późniejszych zmian” to `isMutating(…) === 1`, a nie `0`. Stąd `> 1` w `hasLaterChanges`.
- **Kolejka nie naprawia wszystkiego.** Gdy pierwsza z dwóch czekających zmian dostanie błąd, jej cofnięcie przywraca cache sprzed niej i przy okazji zdejmuje zmianę optymistyczną drugiej. Druga i tak wychodzi do API, a jej odpowiedź albo odświeżenie przy powrocie do karty (F-SYNC-03) pokaże prawdę. Przy jednym użytkowniku i rzadkich błędach to rzadki przypadek, więc plan go nie łata.
- **Jedno zawieszone żądanie wstrzymuje resztę.** To koszt decyzji 1. `fetch` nie ma domyślnego limitu czasu, więc kolejka stoi, aż przeglądarka przerwie połączenie. UI dalej działa optymistycznie.
- **Test kolejki sprawdza `isPaused`, a nie samo `api.delete`.** Bez kolejki `api.delete` w chwili asercji też jeszcze nie zostało wywołane, bo `mutationFn` startuje dopiero po asynchronicznym `onMutate`. Asercja na samym wywołaniu przeszła na prototypie także bez poprawki. `isPaused` odróżnia „czeka w kolejce” od „jeszcze nie zdążyło”.

<details>
<summary>Podpowiedź</summary>

- `scope` w opcjach domyślnych: `new QueryClient({ defaultOptions: { queries: {…}, mutations: { scope: { id: 'api' } } } })`.
- `isPaused` jest w wyniku `useMutation`, tak jak `mutate`: `const remove = withQueryClient(queryClient, useDeleteTodo)`, potem `remove.isPaused.value`.
- Dwie różne odpowiedzi dla kolejnych wywołań: `api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)`.
- Druga mutacja czeka w kolejce, więc po odpowiedzi na pierwszą poczekaj na `expect(api.patch).toHaveBeenCalledTimes(2)`. Wtedy `onSuccess` pierwszej już się wykonał.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/query-client.ts`

```ts
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        // …komentarz bez zmian…
        gcTime: Infinity,
      },
      mutations: {
        // All changes go to the API one after another, in the order they were made. Otherwise a
        // change of a task could reach the API before the task (or its widget) is saved and get 404,
        // e.g. after coming back online.
        scope: { id: 'api' },
      },
    },
  })
}
```

`apps/extension/src/queries/todos.ts` (nowy import, klucz i funkcja przed `useTodos`, zmiany w mutacjach)

```ts
import {
  type QueryClient,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query'

// …

const todoChangeKey = ['todos', 'change'] as const

// Changes wait in one queue, so a later change of the tasks may still be waiting when this one is
// answered. Its optimistic state is newer than this response: writing the response would show an
// older state for a moment (a task ticked twice in a row would blink). The last change writes.
function hasLaterChanges(queryClient: QueryClient) {
  // This mutation is still pending while its onSuccess runs, so it counts too
  return queryClient.isMutating({ mutationKey: todoChangeKey }) > 1
}

// …w useAddTodo, useUpdateTodo i useDeleteTodo, pierwsza opcja:

    mutationKey: todoChangeKey,

// …onSuccess w useAddTodo i useUpdateTodo:

    onSuccess: (saved) => {
      if (hasLaterChanges(queryClient)) return
      queryClient.setQueryData<TodoDto[]>(todosKey(saved.widgetId), (list = []) =>
        withTodo(list, saved),
      )
    },
```

`apps/extension/src/queries/todos.test.ts` (importy, `beforeEach` i nowe testy na końcu)

```ts
import type { QueryClient } from '@tanstack/vue-query'
// …
import { createQueryClient } from './query-client'

// …

beforeEach(() => {
  vi.resetAllMocks()
  // With the defaults of the app, so changes go to the API one after another
  queryClient = createQueryClient()
  queryClient.setQueryData(key, [milk, bread])
})

// …

describe('order of changes', () => {
  it('sends a change of a new task only after the API saves the task', async () => {
    const created = deferred<Response>()
    api.post.mockReturnValue(created.promise)
    api.delete.mockResolvedValue(new Response(null, { status: 204 }))
    const add = withQueryClient(queryClient, useAddTodo)
    const remove = withQueryClient(queryClient, useDeleteTodo)

    add.mutate({ widgetId: 'tasks', id: 'butter', text: 'Masło', position: 'a2' })
    remove.mutate({ id: 'butter', widgetId: 'tasks' })
    // The delete waits in the queue (paused) until the task is saved
    await vi.waitFor(() => expect(remove.isPaused.value).toBe(true))
    expect(ids()).toEqual(['milk', 'bread'])
    expect(api.delete).not.toHaveBeenCalled()

    created.resolve(jsonResponse(201, todo({ id: 'butter', text: 'Masło', position: 'a2' })))
    await vi.waitFor(() => expect(api.delete).toHaveBeenCalledOnce())
  })

  it('keeps showing the latest change while an earlier one is answered', async () => {
    const first = deferred<Response>()
    const second = deferred<Response>()
    api.patch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { mutate } = withQueryClient(queryClient, useUpdateTodo)

    // A quick double click on the checkbox
    mutate({ id: 'milk', widgetId: 'tasks', done: true })
    mutate({ id: 'milk', widgetId: 'tasks', done: false })
    await vi.waitFor(() => expect(cached()?.[0]?.done).toBe(false))

    first.resolve(jsonResponse(200, { ...milk, done: true, version: 2 }))
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2))
    expect(cached()?.[0]?.done).toBe(false)

    second.resolve(jsonResponse(200, { ...milk, done: false, version: 3 }))
    await vi.waitFor(() => expect(cached()?.[0]?.version).toBe(3))
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Bez kolejki zadanie dodane i od razu usunięte offline wraca po przeładowaniu (zadanie 14). Dlaczego?** `DELETE` dotarł do API przed `POST`, dostał 404, a `useDeleteTodo` traktuje 404 jak sukces (zadanie „już usunięte”). Chwilę później `POST` zapisał „Y”. Każda mutacja zrobiła to, co miała, ale w złej kolejności.
2. **Czy bez kolejki szybkie podwójne kliknięcie online też może skończyć się źle?** Tak. Dwa `PATCH` idą równolegle i mogą dotrzeć do API w odwrotnej kolejności. Ostatni zapis wygrywa (F-SYNC-06), więc w bazie zostaje `done: true`, choć użytkownik kliknął dwa razy. Kolejka gwarantuje, że API dostaje zmiany w kolejności kliknięć.
3. **Dlaczego nie `invalidateQueries` po ostatniej zmianie, jak w popularnym wzorcu z bloga TkDodo?** Też by działało, ale każda seria zmian kończyłaby się dodatkowym `GET`. Odpowiedź `PATCH` ma już pełny rekord, więc wystarczy go zapisać, gdy nic nowszego nie czeka.

</details>

---

## Zadanie 8: `TaskSource` i źródło `local`

**Cel:** widget Zadania nie wie, skąd pochodzą zadania. Interfejs `TaskSource` z [03-architektura.md](03-architektura.md#system-widgetów) (w uproszczonej wersji z decyzji 5) opisuje, czego potrzebuje lista, a `useLocalTaskSource(widgetId)` realizuje go przez mutacje z zadania 6 (D11).

**Czego się nauczysz:** adapter między interfejsem UI a warstwą danych, wyczerpujący `switch` po unii z kontrolą TypeScriptu, testy composable z podmienionymi zależnościami (`vi.mock` na module z zapytaniami).

**Pliki:**

- Utwórz: `apps/extension/src/widgets/todo/task-source.ts`, `apps/extension/src/widgets/todo/local-task-source.ts`
- Test: `apps/extension/src/widgets/todo/local-task-source.test.ts`

**Interfejsy:**

- Korzysta z: `useTodos`, `useAddTodo`, `useUpdateTodo`, `useDeleteTodo` (zadanie 6), `positionAfterLast` i `positionBetween` (zadanie 5), `TodoConfig['source']` (Etap 3).
- Wytwarza: typy `TaskItem` i `TaskSource`, funkcje `useTaskSource(source, widgetId)` i `useLocalTaskSource(widgetId)`. Używają ich `TaskList` (zadanie 9) i `TodoWidget` (zadanie 12).

**Kroki:**

- [x] **1. Interfejs** w `task-source.ts`: `TaskItem` to `{ id, text, done }`. `TaskSource` ma `items` (`Readonly<Ref<TaskItem[] | undefined>>`), `isError`, `retry()`, `capabilities: { reorder: boolean }` i metody `add(text)`, `toggle(id)`, `edit(id, text)`, `remove(id)`, `move(id, beforeId, afterId)`. `useTaskSource(source, widgetId)` wybiera implementację przez `switch (source.type)`.
- [x] **2. Czerwone testy** w `local-task-source.test.ts`. `vi.mock('@/queries/todos', …)` zwraca z `useTodos` stałą listę `milk (a0)`, `bread (a1, done)`, `butter (a2)`, a mutacje to `vi.fn()`:
  - `add('Jajka')` woła mutację dodania z `widgetId`, tekstem, wygenerowanym ID i pozycją większą od `'a2'`;
  - `toggle('milk')` woła zmianę z `done: true`, a `toggle('bread')` z `done: false`;
  - `move('butter', 'milk', 'bread')` daje pozycję między `'a0'` a `'a1'`, a `move('butter', null, 'milk')` mniejszą od `'a0'`.

  Oczekiwany wynik: **FAIL**, bo `./local-task-source` nie istnieje.

- [x] **3. Implementacja** `local-task-source.ts`. `items` to wprost `data` z `useTodos` (`TodoDto` ma wszystkie pola `TaskItem`), `isError` z zapytania, `retry` woła `refetch`, `reorder: true`. Nowe ID z `v7` z pakietu `uuid`, jak w `useAddWidget`.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (90 testów w rozszerzeniu)**.
- [x] **5. Eksperyment: nowe źródło w unii.** W `packages/shared/src/widgets.ts` dopisz na chwilę do unii `source` drugi wariant: `z.object({ type: z.literal('todoist') })`. Uruchom `pnpm --filter @one-place/extension typecheck`. **Oczekiwany wynik:** błąd `TS2366: Function lacks ending return statement` w `useTaskSource`. TypeScript pilnuje, żeby każdy typ źródła miał implementację. Usuń dopisany wariant.
- [x] **6.** `pnpm format && pnpm check`, potem commit: `feat(extension): add task source with the local implementation`.

**Pułapki (sprawdzone na prototypie):**

- **`useTaskSource` to composable.** Woła `useTodos` i mutacje, więc musi działać synchronicznie w `setup()`. Zmiana typu źródła w konfiguracji działającego widgetu nie podmieni źródła. W MVP jest tylko `local`, a przyszła zmiana źródła może po prostu zamontować widget od nowa.
- **Sąsiedzi szukani w pełnej liście.** `move` dostaje ID sąsiadów z listy, którą widzi użytkownik, ale ich pozycje czyta z `todos.value`, czyli ze wszystkich zadań. Tak działa przeciąganie przy ukrytych ukończonych (decyzja 3).
- **`toggle` czyta stan z cache.** Lista zgłasza tylko „przełącz to zadanie”. Nowa wartość `done` pochodzi ze źródła, które zna aktualny stan, także po zmianie optymistycznej sprzed chwili.
- **Mock zamiast `QueryClient`.** Ten test sprawdza tłumaczenie wywołań na mutacje. To, że mutacje działają z API, sprawdził już `todos.test.ts`, więc `vi.mock` z prostymi `ref` i `vi.fn()` wystarczy.

<details>
<summary>Podpowiedź</summary>

- Wyczerpujący `switch` bez `default`: przy unii z jednym wariantem TypeScript wie, że każda ścieżka zwraca wartość. Jawny typ wyniku (`: TaskSource`) sprawia, że gdy unia urośnie, błąd pojawi się w samej funkcji (krok 5).
- Pozycja przy przeciąganiu: `positionBetween(find(beforeId)?.position ?? null, find(afterId)?.position ?? null)`, gdzie `find(id)` szuka w `todos.value`.
- W teście ostatnie wywołanie mocka: `mutations.add.mock.lastCall![0]`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/widgets/todo/task-source.ts`

```ts
import type { TodoConfig } from '@one-place/shared'
import type { Ref } from 'vue'
import { useLocalTaskSource } from './local-task-source'

// What the task list needs from a source of tasks (D11). The list does not know where the tasks
// come from: today the One Place API, later e.g. Todoist through the backend.
export interface TaskItem {
  id: string
  text: string
  done: boolean
}

export interface TaskSource {
  // undefined until the first load
  items: Readonly<Ref<TaskItem[] | undefined>>
  isError: Readonly<Ref<boolean>>
  retry(): void
  capabilities: { reorder: boolean }
  add(text: string): void
  toggle(id: string): void
  edit(id: string, text: string): void
  remove(id: string): void
  // The new neighbours of the task, null at the start or the end of the list
  move(id: string, beforeId: string | null, afterId: string | null): void
}

// A composable: call it in setup(). A change of the source in the config needs a new widget.
export function useTaskSource(source: TodoConfig['source'], widgetId: string): TaskSource {
  switch (source.type) {
    case 'local':
      return useLocalTaskSource(widgetId)
  }
}
```

`apps/extension/src/widgets/todo/local-task-source.ts`

```ts
import { v7 as uuidv7 } from 'uuid'
import { positionAfterLast, positionBetween } from '@/lib/positions'
import { useAddTodo, useDeleteTodo, useTodos, useUpdateTodo } from '@/queries/todos'
import type { TaskSource } from './task-source'

// Tasks kept by the One Place API. Positions are fractional indexes, so a move is one PATCH.
export function useLocalTaskSource(widgetId: string): TaskSource {
  const { data: todos, isError, refetch } = useTodos(widgetId)
  const { mutate: addTodo } = useAddTodo()
  const { mutate: updateTodo } = useUpdateTodo()
  const { mutate: deleteTodo } = useDeleteTodo()

  const find = (id: string | null) => todos.value?.find((todo) => todo.id === id)

  return {
    items: todos,
    isError,
    retry: () => void refetch(),
    capabilities: { reorder: true },
    // F-TODO-01: at the end of the list
    add: (text) =>
      addTodo({ widgetId, id: uuidv7(), text, position: positionAfterLast(todos.value ?? []) }),
    toggle: (id) => {
      const todo = find(id)
      if (todo) updateTodo({ id, widgetId, done: !todo.done })
    },
    edit: (id, text) => updateTodo({ id, widgetId, text }),
    remove: (id) => deleteTodo({ id, widgetId }),
    move: (id, beforeId, afterId) => {
      const position = positionBetween(
        find(beforeId)?.position ?? null,
        find(afterId)?.position ?? null,
      )
      updateTodo({ id, widgetId, position })
    },
  }
}
```

`apps/extension/src/widgets/todo/local-task-source.test.ts`

```ts
import type { TodoDto } from '@one-place/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useLocalTaskSource } from './local-task-source'

const mutations = vi.hoisted(() => ({ add: vi.fn(), update: vi.fn(), remove: vi.fn() }))

function todo(id: string, position: string, done = false): TodoDto {
  return {
    id,
    widgetId: 'tasks',
    text: id,
    done,
    position,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    version: 1,
  }
}

// The source only turns calls into mutations, so the queries are replaced with plain functions
vi.mock('@/queries/todos', () => ({
  useTodos: () => ({
    data: ref([todo('milk', 'a0'), todo('bread', 'a1', true), todo('butter', 'a2')]),
    isError: ref(false),
    refetch: vi.fn(),
  }),
  useAddTodo: () => ({ mutate: mutations.add }),
  useUpdateTodo: () => ({ mutate: mutations.update }),
  useDeleteTodo: () => ({ mutate: mutations.remove }),
}))

beforeEach(() => vi.resetAllMocks())

describe('useLocalTaskSource', () => {
  it('adds a task after the last one', () => {
    useLocalTaskSource('tasks').add('Jajka')
    const [input] = mutations.add.mock.lastCall!
    expect(input).toMatchObject({ widgetId: 'tasks', text: 'Jajka', id: expect.any(String) })
    expect(input.position > 'a2').toBe(true)
  })

  it('toggles a task to the opposite of its current state', () => {
    const source = useLocalTaskSource('tasks')
    source.toggle('milk')
    source.toggle('bread')
    expect(mutations.update.mock.calls).toEqual([
      [{ id: 'milk', widgetId: 'tasks', done: true }],
      [{ id: 'bread', widgetId: 'tasks', done: false }],
    ])
  })

  it('moves a task between its new neighbours', () => {
    const source = useLocalTaskSource('tasks')
    source.move('butter', 'milk', 'bread')
    const middle = mutations.update.mock.lastCall![0].position
    expect(middle > 'a0' && middle < 'a1').toBe(true)

    source.move('butter', null, 'milk')
    expect(mutations.update.mock.lastCall![0].position < 'a0').toBe(true)
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Co zmieni się w `TaskList`, gdy dojdzie źródło Todoist?** Nic, jeśli Todoist da się opisać tym samym interfejsem. Dojdzie `useTodoistTaskSource`, nowa gałąź w `switch` i być może `capabilities.reorder: false`, gdy API zewnętrzne nie pozwoli zmieniać kolejności. Lista ukryje wtedy uchwyty (zadanie 11).
2. **Dlaczego `TaskItem` nie ma `position`?** Pozycja to szczegół źródła `local`. Inne źródło może trzymać kolejność jako liczbę albo wcale. Lista potrzebuje tylko kolejności elementów w tablicy i ID sąsiadów.
3. **Co zrobi `toggle` dla ID, którego nie ma w cache?** Nic. Zadanie mogło zniknąć po odświeżeniu (usunięte na innym urządzeniu) między renderem a kliknięciem, a bez znanego stanu nie da się wyliczyć nowej wartości `done`.

</details>

---

## Zadanie 9: `TaskList`: lista, dodawanie, odhaczanie i usuwanie

**Cel:** komponent pokazuje zadania w kolejności, ukończone są przekreślone, pusta lista pokazuje „Brak zadań”, Enter w polu na dole dodaje przycięty tekst, a checkbox i krzyżyk zgłaszają zdarzenia (F-TODO-01, F-TODO-02, F-TODO-04, F-TODO-07). Komponent nie wie nic o API.

**Czego się nauczysz:** komponent czysto prezentacyjny (propsy w dół, zdarzenia w górę), `:model-value` z `@update:model-value` zamiast `v-model` na danych, które nie należą do komponentu, `useTemplateRef`, przewijanie po zmianie danych, a nie po kliknięciu.

**Pliki:**

- Utwórz: `apps/extension/src/widgets/todo/TaskList.vue`
- Zmień: `apps/extension/src/i18n/pl.json`, `apps/extension/src/i18n/en.json`
- Test: `apps/extension/src/widgets/todo/TaskList.test.ts`

**Interfejsy:**

- Korzysta z: `TaskItem` i `TaskSource['capabilities']` (zadanie 8), `TODO_TEXT_MAX_LENGTH` (zadanie 1).
- Wytwarza: `TaskList` z propsami `items` i `capabilities` oraz zdarzeniami `add(text)`, `toggle(id)`, `edit(id, text)`, `remove(id)` i `move(id, beforeId, afterId)`. Zadania 10 i 11 dokładają edycję i przeciąganie, a zadanie 12 podłącza komponent do źródła.

**Kroki:**

- [x] **1. Tłumaczenia.** W `widgets.todo` dopisz `add` („Dodaj zadanie” / „Add a task”), `empty` („Brak zadań” / „No tasks”), `toggle` („Ukończone” / „Done”) i `delete` („Usuń zadanie” / „Delete the task”).
- [x] **2. Czerwone testy** w `TaskList.test.ts` (`// @vitest-environment happy-dom`, pluginy `ui` i `i18n` jak w `TodoSettings.test.ts`):
  - pusta lista pokazuje „No tasks”;
  - wiersze (`li`) mają teksty `['Mleko', 'Chleb']`, a tylko ukończony „Chleb” ma element z klasą `line-through`;
  - `'  Masło  '` i Enter w polu „Add a task” zgłaszają `add` z `'Masło'` i czyszczą pole;
  - `'   '` i Enter nie zgłaszają niczego;
  - kliknięcie drugiego checkboxa zgłasza `toggle` z `'bread'`, a pierwszego krzyżyka `remove` z `'milk'`.

  Oczekiwany wynik: **FAIL**, bo `./TaskList.vue` nie istnieje.

- [x] **3. Implementacja** `TaskList.vue`. Układ (decyzja 2): kolumna na całą wysokość, lista w elemencie z `overflow-y-auto`, który zajmuje resztę miejsca, a `UInput` z ikoną plusa na dole. Checkbox dostaje `:model-value="item.done"` i `@update:model-value="emit('toggle', item.id)"`. Krzyżyk jest widoczny po najechaniu na wiersz (`group-hover:opacity-100`) i przy fokusie z klawiatury (`focus-visible:opacity-100`). Po dodaniu lista przewija się na dół, gdy pojawi się nowe zadanie.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (95 testów w rozszerzeniu)**.
- [x] **5.** `pnpm format && pnpm check`, potem commit: `feat(extension): add task list with add, toggle and delete`.

**Pułapki (sprawdzone na prototypie):**

- **Nie `v-model` na `item.done`.** `item` to obiekt z cache TanStack Query. `v-model` zmieniłby go w miejscu, z pominięciem mutacji: bez zapisu w API, bez cofania przy błędzie i bez kolejki. Lista tylko zgłasza „przełącz”, a nową wartość ustala źródło.
- **Przewijanie po zmianie danych.** Nowe zadanie pojawia się w cache dopiero po asynchronicznym `onMutate`, więc `nextTick` zaraz po `emit('add')` przewinąłby listę za wcześnie. Flaga `scrollToNew` i `watch` na długości listy przewijają, gdy wiersz naprawdę jest w DOM. Flaga nie jest `ref`, bo szablon jej nie czyta.
- **Zdarzenie `move` już w tym zadaniu.** `defineEmits` opisuje cały kontrakt komponentu od razu, choć `edit` i `move` dochodzą w kolejnych zadaniach. Dzięki temu `TodoWidget` w zadaniu 12 nie musi czekać na zmiany typów.
- **`aria-label` przy checkboxie i krzyżyku.** Sam znak „×” nic nie mówi czytnikowi ekranu. Testy szukają przycisków po tych samych etykietach, więc etykiety nie mogą zniknąć niezauważone.

<details>
<summary>Podpowiedź</summary>

- Przewinięcie elementu na dół: `list.value?.scrollTo({ top: list.value.scrollHeight })`, gdzie `list = useTemplateRef('list')`, a w szablonie `ref="list"` na elemencie z `overflow-y-auto`.
- W teście tekst pola po dodaniu: `(input.element as HTMLInputElement).value`.
- Checkbox Nuxt UI renderuje się jako przycisk z `role="checkbox"`, więc w teście `wrapper.findAll('[role="checkbox"]')`.

</details>

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/i18n/pl.json` (w `widgets.todo`, za `description`)

```json
      "add": "Dodaj zadanie",
      "empty": "Brak zadań",
      "toggle": "Ukończone",
      "delete": "Usuń zadanie",
```

`apps/extension/src/i18n/en.json` (w `widgets.todo`, za `description`)

```json
      "add": "Add a task",
      "empty": "No tasks",
      "toggle": "Done",
      "delete": "Delete the task",
```

`apps/extension/src/widgets/todo/TaskList.vue`

```vue
<script setup lang="ts">
import { TODO_TEXT_MAX_LENGTH } from '@one-place/shared'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TaskItem, TaskSource } from './task-source'

// Only shows the tasks and reports what the user did. Where the tasks come from is the business
// of TodoWidget and its TaskSource, so this component is tested without the API.
const props = defineProps<{ items: TaskItem[]; capabilities: TaskSource['capabilities'] }>()
const emit = defineEmits<{
  add: [text: string]
  toggle: [id: string]
  edit: [id: string, text: string]
  remove: [id: string]
  move: [id: string, beforeId: string | null, afterId: string | null]
}>()

const { t } = useI18n()

const newText = ref('')
const list = useTemplateRef('list')
let scrollToNew = false

// F-TODO-01: Enter adds the trimmed text at the end, an empty one is ignored
function add() {
  const text = newText.value.trim()
  if (!text) return
  emit('add', text)
  newText.value = ''
  scrollToNew = true
}

// The new task appears after the optimistic update, so the list scrolls when it gets longer
watch(
  () => props.items.length,
  async () => {
    if (!scrollToNew) return
    scrollToNew = false
    await nextTick()
    list.value?.scrollTo({ top: list.value.scrollHeight })
  },
)
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <!-- F-TODO-07 -->
    <p v-if="items.length === 0" class="flex-1 text-sm text-muted">{{ t('widgets.todo.empty') }}</p>
    <div v-else ref="list" class="-mx-1 min-h-0 flex-1 overflow-y-auto">
      <ul>
        <li
          v-for="item in items"
          :key="item.id"
          class="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-elevated"
        >
          <!-- F-TODO-02 -->
          <UCheckbox
            :model-value="item.done"
            :aria-label="t('widgets.todo.toggle')"
            @update:model-value="emit('toggle', item.id)"
          />
          <span
            class="min-w-0 flex-1 text-sm break-words"
            :class="{ 'text-muted line-through': item.done }"
            >{{ item.text }}</span
          >
          <!-- F-TODO-04: without a confirmation -->
          <UButton
            icon="i-lucide-x"
            :aria-label="t('widgets.todo.delete')"
            color="neutral"
            variant="ghost"
            size="xs"
            class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            @click="emit('remove', item.id)"
          />
        </li>
      </ul>
    </div>
    <UInput
      v-model="newText"
      icon="i-lucide-plus"
      :placeholder="t('widgets.todo.add')"
      :aria-label="t('widgets.todo.add')"
      :maxlength="TODO_TEXT_MAX_LENGTH"
      size="sm"
      class="w-full shrink-0"
      @keydown.enter="add"
    />
  </div>
</template>
```

`apps/extension/src/widgets/todo/TaskList.test.ts`

```ts
// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import TaskList from './TaskList.vue'
import type { TaskItem } from './task-source'

const milk: TaskItem = { id: 'milk', text: 'Mleko', done: false }
const bread: TaskItem = { id: 'bread', text: 'Chleb', done: true }

// happy-dom reports navigator.language as en-US, so the texts are English
function mountList(items: TaskItem[] = [milk, bread]) {
  return mount(TaskList, {
    props: { items, capabilities: { reorder: true } },
    global: { plugins: [ui, i18n] },
  })
}

function newTaskInput(wrapper: ReturnType<typeof mountList>) {
  return wrapper.get('input[aria-label="Add a task"]')
}

describe('TaskList', () => {
  it('shows "No tasks" for an empty list', () => {
    expect(mountList([]).text()).toContain('No tasks')
  })

  it('shows the tasks in order and strikes through the done ones', () => {
    const wrapper = mountList()
    const rows = wrapper.findAll('li')
    expect(rows.map((row) => row.text())).toEqual(['Mleko', 'Chleb'])
    expect(rows[1]!.find('.line-through').exists()).toBe(true)
    expect(rows[0]!.find('.line-through').exists()).toBe(false)
  })

  it('adds the trimmed text on Enter and clears the field', async () => {
    const wrapper = mountList()
    const input = newTaskInput(wrapper)
    await input.setValue('  Masło  ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('add')).toEqual([['Masło']])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('ignores an empty text', async () => {
    const wrapper = mountList()
    const input = newTaskInput(wrapper)
    await input.setValue('   ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('add')).toBeUndefined()
  })

  it('reports a click on the checkbox and on the delete button', async () => {
    const wrapper = mountList()
    await wrapper.findAll('[role="checkbox"]')[1]!.trigger('click')
    await wrapper.findAll('button[aria-label="Delete the task"]')[0]!.trigger('click')
    expect(wrapper.emitted('toggle')).toEqual([['bread']])
    expect(wrapper.emitted('remove')).toEqual([['milk']])
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego Enter na polu „Dodaj zadanie” nie przeładowuje strony, jak w zwykłym formularzu?** Pole nie jest w `<form>`, więc Enter nie wysyła niczego. `UForm` jest tylko w ustawieniach widgetu.
2. **Co zobaczy użytkownik, gdy API odrzuci dodanie (limit 500)?** Zadanie pojawi się i zniknie (cofnięcie w `useAddTodo`), a toast „Osiągnięto limit…” wyjaśni dlaczego. Lista nic o tym nie wie: dostała po prostu nowe `items`.
3. **Dlaczego pole „Dodaj zadanie” nie jest wyłączone, gdy lista ma 500 zadań?** Lista nie zna limitu ani liczby zadań w API (przy „Ukryj ukończone” widzi tylko część). Limit sprawdza serwer, który jest źródłem prawdy, tak jak limit widgetów w Etapie 3.

</details>

---

## Zadanie 10: edycja zadania w miejscu

**Cel:** kliknięcie tekstu zamienia go w pole. Enter albo utrata fokusu zapisuje przycięty tekst, Escape anuluje, a pusty albo niezmieniony tekst niczego nie zapisuje (F-TODO-03). Jedno naciśnięcie klawisza daje najwyżej jeden zapis.

**Czego się nauczysz:** jakie zdarzenia zgłasza przeglądarka, gdy usuwa pole z fokusem, jak to odtworzyć w teście, dlaczego Vue nie przekazuje zdarzeń komponentu po odmontowaniu, stan „co edytuję” jako jedno źródło prawdy.

**Pliki:**

- Zmień: `apps/extension/src/widgets/todo/TaskList.vue`, `apps/extension/src/i18n/pl.json`, `apps/extension/src/i18n/en.json`
- Test: `apps/extension/src/widgets/todo/TaskList.test.ts`

**Interfejsy:**

- Wytwarza: zdarzenie `edit(id, text)`. Źródło zamienia je w `PATCH` z tekstem (zadanie 12).

**Kroki:**

- [x] **1. Tłumaczenia.** `widgets.todo.edit`: „Edytuj zadanie” / „Edit the task”.
- [x] **2. Czerwone testy** w nowym `describe('editing in place')`. Pomocnik `startEditing(wrapper, text)` klika tekst „Mleko” i wpisuje `text` w pole „Edit the task”:
  - Enter, a zaraz potem `blur` zgłaszają `edit` z `['milk', 'Mleko 2%']` **jeden raz**, a pole znika;
  - sam `blur` zapisuje;
  - Escape, a zaraz potem `blur` nie zgłaszają `edit`, a wiersz pokazuje „Mleko”;
  - pusty i niezmieniony tekst z Enterem nie zgłaszają `edit`.

  W dwóch pierwszych scenariuszach z „zaraz potem” wywołaj `void input.trigger('keydown', …)` bez `await`, a dopiero potem `await input.trigger('blur')`. Oczekiwany wynik: **FAIL**, bo tekst nie jest jeszcze klikalny.

- [x] **3. Eksperyment: najprostsza wersja.** Tekst zadania to `<button>`, który ustawia `editingId` i `editText`. Pole `UInput` z `autofocus` ma trzy obsługi: `@keydown.enter="finishEdit(item.id, true)"`, `@keydown.esc="finishEdit(item.id, false)"` i `@blur="finishEdit(item.id, true)"`. `finishEdit(id, save)` ustawia `editingId = null` i przy `save` zgłasza `edit`, jeśli przycięty tekst nie jest pusty i różni się od starego. **Oczekiwany wynik:** testy Entera i Escape **FAIL**: Enter zgłasza `edit` dwa razy, a Escape raz. Wyjaśnienie jest niżej, otwórz je przed krokiem 4.
- [x] **4. Poprawka.** `finishEdit(save)` nie dostaje ID z szablonu, tylko czyta `editingId`. Gdy jest `null`, edycja już się skończyła i funkcja nic nie robi. W przeciwnym razie najpierw czyści `editingId`, potem ewentualnie zgłasza `edit`. Oczekiwany wynik: **PASS (99 testów w rozszerzeniu)**.
- [x] **5. Eksperyment: test z `await`.** Wróć na chwilę do wersji z kroku 3 i w obu testach zamień `void input.trigger('keydown', …)` na `await input.trigger('keydown', …)`. **Oczekiwany wynik:** testy **przechodzą**, choć kod ma błąd. Przywróć poprawkę i `void`.
- [x] **6.** `pnpm format && pnpm check`, potem commit: `feat(extension): edit a task in place`.

<details>
<summary>Wyjaśnienie eksperymentów (otwórz po kroku 3)</summary>

- Enter ustawia `editingId = null`. Vue przy następnym przerysowaniu usuwa pole z DOM. Chrome, usuwając element z fokusem, zgłasza na nim `blur` i `focusout` (sprawdzone w Chrome 156 na prototypie: `input.focus(); input.remove()` daje oba zdarzenia). Obsługa `@blur` wywołuje więc `finishEdit(item.id, true)` drugi raz i drugi raz zgłasza `edit`.
- Escape robi to samo, tylko pierwszy krok nie zapisuje. Drugi, z `blur`, zapisuje tekst, który użytkownik chciał porzucić. W zbudowanej paczce widać to w Network jako `PATCH` po Escape.
- `void` w teście odtwarza kolejność z przeglądarki: `blur` przychodzi, zanim komponent pola zostanie odmontowany. Z `await` test czeka na przerysowanie, pole `UInput` jest już odmontowane, a Vue nie przekazuje zdarzeń (`emit`) komponentu po odmontowaniu. `blur` nie dociera więc do `finishEdit` i błąd jest niewidoczny. W przeglądarce `blur` przychodzi w trakcie usuwania, gdy komponent jeszcze żyje.
- Poprawka robi z `editingId` jedno źródło prawdy: „czy edycja trwa” sprawdza każde wywołanie, a pierwsze, które ją kończy, zamyka drzwi dla następnych.

</details>

**Pułapki (sprawdzone na prototypie):**

- **Tekst jako `<button>`.** Klikalny `<span>` nie dostaje fokusu z klawiatury. Przycisk z `type="button"`, `text-start` i `cursor-text` wygląda jak tekst, a da się do niego dojść Tabem i włączyć edycję Enterem.
- **Niezmieniony tekst nie wysyła `PATCH`.** Kliknięcie w tekst i wyjście z pola to częsty przypadek. Bez porównania każde takie kliknięcie zwiększałoby `version` w bazie.
- **Stary tekst z `props.items`, nie z pola.** `finishEdit` szuka zadania po ID w aktualnych `items`. Gdy w trakcie edycji przyjdzie odświeżenie z innego urządzenia, porównanie idzie do aktualnego tekstu.
- **Ograniczenie długości w polu.** `maxlength` na polu edycji jest takie samo jak na polu dodawania, więc API nigdy nie dostaje tekstu dłuższego niż 500 znaków z tej listy.

<details>
<summary>Podpowiedź</summary>

- W teście tekst zadania znajdziesz po treści: `wrapper.findAll('li button').find((button) => button.text() === 'Mleko')`. Pierwszy przycisk w wierszu to checkbox.
- `UInput` przekazuje `@blur` i `@keydown` do natywnego pola, tak jak w `ContextRow.vue` z Etapu 2.

</details>

<details>
<summary>Rozwiązanie</summary>

`pl.json` i `en.json` (w `widgets.todo`, za `toggle`)

```json
      "edit": "Edytuj zadanie",
```

```json
      "edit": "Edit the task",
```

`apps/extension/src/widgets/todo/TaskList.vue` (nowy kod w `<script setup>` przed `watch`)

```ts
// F-TODO-03: one task at a time is edited in place
const editingId = ref<string | null>(null)
const editText = ref('')

function startEdit(item: TaskItem) {
  editingId.value = item.id
  editText.value = item.text
}

// Enter and Escape close the field, and the browser then reports a blur as well. Clearing
// editingId first makes that second call do nothing.
function finishEdit(save: boolean) {
  const id = editingId.value
  if (id === null) return
  editingId.value = null
  const text = editText.value.trim()
  const item = props.items.find((task) => task.id === id)
  // An empty text cancels the edit, like Escape
  if (save && text && item && text !== item.text) emit('edit', id, text)
}
```

`TaskList.vue` (w szablonie `<span>` z tekstem zastąpiony polem i przyciskiem)

```vue
<UInput
  v-if="editingId === item.id"
  v-model="editText"
  :aria-label="t('widgets.todo.edit')"
  :maxlength="TODO_TEXT_MAX_LENGTH"
  size="sm"
  autofocus
  class="min-w-0 flex-1"
  @keydown.enter="finishEdit(true)"
  @keydown.esc="finishEdit(false)"
  @blur="finishEdit(true)"
/>
<button
  v-else
  type="button"
  class="min-w-0 flex-1 cursor-text text-start text-sm break-words"
  :class="{ 'text-muted line-through': item.done }"
  @click="startEdit(item)"
>
            {{ item.text }}
          </button>
```

`TaskList.test.ts` (nowy `describe` na końcu głównego `describe('TaskList')`)

```ts
describe('editing in place', () => {
  async function startEditing(wrapper: ReturnType<typeof mountList>, text: string) {
    // The text of a task is a button, so it can also be reached with the keyboard
    const milkText = wrapper.findAll('li button').find((button) => button.text() === 'Mleko')
    await milkText!.trigger('click')
    const input = wrapper.get('input[aria-label="Edit the task"]')
    await input.setValue(text)
    return input
  }

  it('saves the trimmed text on Enter only once, although the field also loses focus', async () => {
    const wrapper = mountList()
    const input = await startEditing(wrapper, '  Mleko 2%  ')
    // Without await in between: the browser reports the blur while the field is still there
    void input.trigger('keydown', { key: 'Enter' })
    await input.trigger('blur')
    expect(wrapper.emitted('edit')).toEqual([['milk', 'Mleko 2%']])
    expect(wrapper.find('input[aria-label="Edit the task"]').exists()).toBe(false)
  })

  it('saves when the field loses focus', async () => {
    const wrapper = mountList()
    const input = await startEditing(wrapper, 'Mleko 2%')
    await input.trigger('blur')
    expect(wrapper.emitted('edit')).toEqual([['milk', 'Mleko 2%']])
  })

  it('cancels on Escape, also when the field then loses focus', async () => {
    const wrapper = mountList()
    const input = await startEditing(wrapper, 'Mleko 2%')
    void input.trigger('keydown', { key: 'Escape' })
    await input.trigger('blur')
    expect(wrapper.emitted('edit')).toBeUndefined()
    expect(wrapper.findAll('li')[0]!.text()).toBe('Mleko')
  })

  it('treats an empty or unchanged text as a cancel', async () => {
    const wrapper = mountList()
    await (await startEditing(wrapper, '   ')).trigger('keydown', { key: 'Enter' })
    await (await startEditing(wrapper, 'Mleko')).trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('edit')).toBeUndefined()
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Czy można założyć, że `blur` po usunięciu pola zawsze przyjdzie albo nigdy nie przyjdzie?** Nie. Przeglądarki przez lata różniły się w tym zachowaniu, a Chrome 156 je ma. Kod z poprawką nie zakłada żadnej odpowiedzi: drugie wywołanie po prostu nic nie robi.
2. **Co się stanie, gdy użytkownik kliknie tekst innego zadania, edytując pierwsze?** Pole traci fokus, więc `blur` zapisuje pierwsze zadanie, a kliknięcie włącza edycję drugiego. Jedno `editingId` oznacza, że naraz edytuje się jedno zadanie.
3. **Dlaczego test „Enter only once” sprawdza też, że pole zniknęło?** Bo poprawka mogłaby polegać na usunięciu obsługi `blur`. Wtedy jeden zapis by się zgadzał, ale zapis przy utracie fokusu (drugi test) i zamknięcie pola musiałyby działać inaczej. Test pilnuje całego zachowania, a nie tylko liczby zdarzeń.

</details>

---

## Zadanie 11: przeciąganie zadań

**Cel:** zadania można przeciągać za uchwyt, który pojawia się po najechaniu na wiersz. Po upuszczeniu lista zgłasza `move` z ID zadania i jego nowych sąsiadów (F-TODO-05). Gdy źródło nie umie zmieniać kolejności, uchwytów nie ma.

**Czego się nauczysz:** `VueDraggable` na lokalnej kopii listy (drugi raz po Etapie 2, teraz w komponencie prezentacyjnym), testowanie przeciągania bez przeciągania, `capabilities` jako sposób na różne źródła danych.

**Pliki:**

- Zmień: `apps/extension/src/widgets/todo/TaskList.vue`, `apps/extension/src/i18n/pl.json`, `apps/extension/src/i18n/en.json`
- Test: `apps/extension/src/widgets/todo/TaskList.test.ts`

**Interfejsy:**

- Korzysta z: `vue-draggable-plus` (Etap 2).
- Wytwarza: zdarzenie `move(id, beforeId, afterId)`. Źródło wylicza z niego pozycję (zadanie 8).

**Kroki:**

- [x] **1. Tłumaczenia.** `widgets.todo.drag`: „Przeciągnij, aby zmienić kolejność” / „Drag to change the order”.
- [x] **2. Czerwone testy** w nowym `describe('moving')`. `mountList` dostaje drugi parametr `reorder = true`. Pomocnik `drop(wrapper, order, newIndex)` robi to, co `VueDraggable` po upuszczeniu: `draggable.vm.$emit('update:modelValue', order)`, potem `draggable.vm.$emit('update', { newIndex })`:
  - przy liście `milk, bread, butter` upuszczenie „butter” na indeks 1 (`[milk, butter, bread]`) zgłasza `['butter', 'milk', 'bread']`, a potem na indeks 0 (`[butter, milk, bread]`) zgłasza `['butter', null, 'milk']`;
  - przy `reorder: false` nie ma elementu z etykietą „Drag to change the order”.

  Oczekiwany wynik: **FAIL**, bo w liście nie ma `VueDraggable`.

- [x] **3. Implementacja.** Lokalna kopia `rows` odświeżana przez `watch` na `props.items` (jak `items` w `ManageContexts.vue`). Element z `ref="list"` zostaje, a `<ul>` w nim zastępuje `<VueDraggable v-model="rows" tag="ul" handle=".task-drag-handle" :disabled="!capabilities.reorder" :animation="150" @update="onMove">`. `v-for` idzie po `rows`. Na początku wiersza `UIcon` z `i-lucide-grip-vertical`, klasą `task-drag-handle` i `v-if="capabilities.reorder"`. `onMove` czyta nowy indeks i zgłasza ID sąsiadów z `rows` albo `null` na brzegach.
- [x] **4. Zielone testy.** Oczekiwany wynik: **PASS (101 testów w rozszerzeniu)**.
- [x] **5.** `pnpm format && pnpm check`, potem commit: `feat(extension): reorder tasks by dragging`.

**Pułapki (sprawdzone na prototypie):**

- **Kopia, a nie propsy.** `VueDraggable` zmienia tablicę z `v-model` w trakcie przeciągania. Na `props.items` zmieniałby tablicę z cache, czyli robił „zapis” z pominięciem mutacji. Cache zmienia się dopiero po upuszczeniu, przez `move` i źródło.
- **Sąsiedzi z `rows`, nie z `props.items`.** W chwili zdarzenia `update` kopia jest już w nowej kolejności, a propsy jeszcze w starej. To ta sama zasada co w `ManageContexts.vue`.
- **Osobna klasa uchwytu.** Ramka widgetu w trybie edycji siatki ma uchwyt `.widget-drag-handle` dla `grid-layout-plus`. Uchwyt zadania ma własną klasę, więc przeciąganie zadania w trybie edycji nie przesuwa widgetu (sprawdzone w przeglądarce w zadaniu 12).
- **happy-dom nie przeciąga.** Sortable reaguje na zdarzenia wskaźnika i pozycje elementów na ekranie, których happy-dom nie liczy. Test wywołuje więc te dwa zdarzenia, które `VueDraggable` zgłasza po upuszczeniu. Prawdziwe przeciąganie sprawdzisz w przeglądarce w zadaniu 12.

<details>
<summary>Podpowiedź</summary>

- Typ zdarzenia: `import { type DraggableEvent, VueDraggable } from 'vue-draggable-plus'`, a w `onMove(event: DraggableEvent<TaskItem>)` indeks to `event.newIndex` (może być `undefined`).
- Komponent `VueDraggable` w teście: `wrapper.getComponent(VueDraggable)`.

</details>

<details>
<summary>Rozwiązanie</summary>

`pl.json` i `en.json` (w `widgets.todo`, za `delete`)

```json
      "drag": "Przeciągnij, aby zmienić kolejność",
```

```json
      "drag": "Drag to change the order",
```

`apps/extension/src/widgets/todo/TaskList.vue` (cały plik po zadaniach 9–11)

```vue
<script setup lang="ts">
import { TODO_TEXT_MAX_LENGTH } from '@one-place/shared'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { type DraggableEvent, VueDraggable } from 'vue-draggable-plus'
import { useI18n } from 'vue-i18n'
import type { TaskItem, TaskSource } from './task-source'

// Only shows the tasks and reports what the user did. Where the tasks come from is the business
// of TodoWidget and its TaskSource, so this component is tested without the API.
const props = defineProps<{ items: TaskItem[]; capabilities: TaskSource['capabilities'] }>()
const emit = defineEmits<{
  add: [text: string]
  toggle: [id: string]
  edit: [id: string, text: string]
  remove: [id: string]
  move: [id: string, beforeId: string | null, afterId: string | null]
}>()

const { t } = useI18n()

// VueDraggable reorders this copy while dragging. The cache changes only after the drop.
const rows = ref<TaskItem[]>([])
watch(
  () => props.items,
  (items) => (rows.value = [...items]),
  { immediate: true },
)

// F-TODO-05: `rows` is already in the new order. The source gets the new neighbours, because
// the list may not show every task (hidden completed ones).
function onMove(event: DraggableEvent<TaskItem>) {
  const index = event.newIndex
  const moved = index === undefined ? undefined : rows.value[index]
  if (index === undefined || !moved) return
  emit('move', moved.id, rows.value[index - 1]?.id ?? null, rows.value[index + 1]?.id ?? null)
}

const newText = ref('')
const list = useTemplateRef('list')
let scrollToNew = false

// F-TODO-01: Enter adds the trimmed text at the end, an empty one is ignored
function add() {
  const text = newText.value.trim()
  if (!text) return
  emit('add', text)
  newText.value = ''
  scrollToNew = true
}

// F-TODO-03: one task at a time is edited in place
const editingId = ref<string | null>(null)
const editText = ref('')

function startEdit(item: TaskItem) {
  editingId.value = item.id
  editText.value = item.text
}

// Enter and Escape close the field, and the browser then reports a blur as well. Clearing
// editingId first makes that second call do nothing.
function finishEdit(save: boolean) {
  const id = editingId.value
  if (id === null) return
  editingId.value = null
  const text = editText.value.trim()
  const item = props.items.find((task) => task.id === id)
  // An empty text cancels the edit, like Escape
  if (save && text && item && text !== item.text) emit('edit', id, text)
}

// The new task appears after the optimistic update, so the list scrolls when it gets longer
watch(
  () => props.items.length,
  async () => {
    if (!scrollToNew) return
    scrollToNew = false
    await nextTick()
    list.value?.scrollTo({ top: list.value.scrollHeight })
  },
)
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <!-- F-TODO-07 -->
    <p v-if="items.length === 0" class="flex-1 text-sm text-muted">{{ t('widgets.todo.empty') }}</p>
    <div v-else ref="list" class="-mx-1 min-h-0 flex-1 overflow-y-auto">
      <VueDraggable
        v-model="rows"
        tag="ul"
        handle=".task-drag-handle"
        :disabled="!capabilities.reorder"
        :animation="150"
        @update="onMove"
      >
        <li
          v-for="item in rows"
          :key="item.id"
          class="group flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-elevated"
        >
          <UIcon
            v-if="capabilities.reorder"
            name="i-lucide-grip-vertical"
            class="task-drag-handle size-4 shrink-0 cursor-grab text-dimmed opacity-0 group-hover:opacity-100"
            :aria-label="t('widgets.todo.drag')"
          />
          <!-- F-TODO-02 -->
          <UCheckbox
            :model-value="item.done"
            :aria-label="t('widgets.todo.toggle')"
            @update:model-value="emit('toggle', item.id)"
          />
          <UInput
            v-if="editingId === item.id"
            v-model="editText"
            :aria-label="t('widgets.todo.edit')"
            :maxlength="TODO_TEXT_MAX_LENGTH"
            size="sm"
            autofocus
            class="min-w-0 flex-1"
            @keydown.enter="finishEdit(true)"
            @keydown.esc="finishEdit(false)"
            @blur="finishEdit(true)"
          />
          <button
            v-else
            type="button"
            class="min-w-0 flex-1 cursor-text text-start text-sm break-words"
            :class="{ 'text-muted line-through': item.done }"
            @click="startEdit(item)"
          >
            {{ item.text }}
          </button>
          <!-- F-TODO-04: without a confirmation -->
          <UButton
            icon="i-lucide-x"
            :aria-label="t('widgets.todo.delete')"
            color="neutral"
            variant="ghost"
            size="xs"
            class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            @click="emit('remove', item.id)"
          />
        </li>
      </VueDraggable>
    </div>
    <UInput
      v-model="newText"
      icon="i-lucide-plus"
      :placeholder="t('widgets.todo.add')"
      :aria-label="t('widgets.todo.add')"
      :maxlength="TODO_TEXT_MAX_LENGTH"
      size="sm"
      class="w-full shrink-0"
      @keydown.enter="add"
    />
  </div>
</template>
```

`TaskList.test.ts` (nowy import, `mountList` z parametrem `reorder` i nowy `describe` na końcu)

```ts
import { VueDraggable } from 'vue-draggable-plus'

// …

function mountList(items: TaskItem[] = [milk, bread], reorder = true) {
  return mount(TaskList, {
    props: { items, capabilities: { reorder } },
    global: { plugins: [ui, i18n] },
  })
}

// …

describe('moving', () => {
  const butter: TaskItem = { id: 'butter', text: 'Masło', done: false }

  // happy-dom cannot drag, so the test does what VueDraggable does after a drop:
  // it reorders the list and reports the new index of the moved item
  async function drop(wrapper: ReturnType<typeof mountList>, order: TaskItem[], newIndex: number) {
    const draggable = wrapper.getComponent(VueDraggable)
    draggable.vm.$emit('update:modelValue', order)
    draggable.vm.$emit('update', { newIndex })
    await wrapper.vm.$nextTick()
  }

  it('reports the moved task with its new neighbours', async () => {
    const wrapper = mountList([milk, bread, butter])
    await drop(wrapper, [milk, butter, bread], 1)
    await drop(wrapper, [butter, milk, bread], 0)
    expect(wrapper.emitted('move')).toEqual([
      ['butter', 'milk', 'bread'],
      ['butter', null, 'milk'],
    ])
  })

  it('has no drag handles when the source cannot reorder', () => {
    const wrapper = mountList([milk, bread], false)
    expect(wrapper.find('[aria-label="Drag to change the order"]').exists()).toBe(false)
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Przy „Ukryj ukończone” widać `C, D, E`, a w całej liście między `C` i `D` jest ukryte `B`. Gdzie trafi `E` po przeciągnięciu między `C` i `D`?** Gdzieś między pozycją `C` a pozycją `D`, czyli przed albo za `B`, zależnie od tego, co wyliczy `generateKeyBetween`. Dla użytkownika to bez znaczenia, bo `B` jest ukryte. Na prototypie `E` dostało dokładnie pozycję `B`, a ich kolejność rozstrzyga wtedy `id`.
2. **Dlaczego uchwyt, a nie przeciąganie całego wiersza?** Wiersz ma checkbox, klikalny tekst i krzyżyk. Przeciąganie za cały wiersz łatwo myli się z zaznaczaniem tekstu i kliknięciem, a uchwyt jasno mówi, gdzie chwycić.
3. **Co by się stało bez `watch` na `props.items`?** `rows` zostałoby kopią z pierwszego renderu. Nowe, zmienione i usunięte zadania nie pojawiałyby się na liście, choć cache by się zmieniał.

</details>

---

## Zadanie 12: `TodoWidget` łączy źródło z listą

**Cel:** zaślepka z Etapu 3 staje się widgetem Zadania: tytuł z konfiguracji, szkielety do pierwszego wczytania (F-SYNC-02), komunikat z „Spróbuj ponownie”, gdy zadań nie udało się pobrać, i lista z zadań 9–11 podłączona do źródła. Przy „Ukryj ukończone” lista dostaje tylko nieukończone zadania (decyzja 3).

**Czego się nauczysz:** składanie komponentu z composable i komponentu prezentacyjnego, rozpakowywanie `ref` w szablonie (tylko na najwyższym poziomie), test komponentu z podmienionym źródłem danych, pełny scenariusz w zbudowanej paczce.

**Pliki:**

- Zmień: `apps/extension/src/widgets/todo/TodoWidget.vue`, `apps/extension/src/i18n/pl.json`, `apps/extension/src/i18n/en.json`
- Test: `apps/extension/src/widgets/todo/TodoWidget.test.ts`

**Interfejsy:**

- Korzysta z: `useTaskSource` (zadanie 8), `TaskList` (zadania 9–11), `resolveConfig` i `TodoConfigSchema` (Etap 3).
- Wytwarza: działający widget Zadania. Ustawienia dostają „Ukryj ukończone” w zadaniu 13.

**Kroki:**

- [ ] **1. Tłumaczenia.** `widgets.todo.loadError` („Nie udało się wczytać zadań.” / „Could not load the tasks.”) i `widgets.todo.retry` („Spróbuj ponownie” / „Try again”).
- [ ] **2. Czerwone testy** w `TodoWidget.test.ts`. `vi.mock('./task-source', …)` zwraca z `useTaskSource` obiekt z `items` (współdzielony `ref`, ustawiany w `beforeEach` na „Mleko” i ukończony „Chleb”), `isError: ref(false)`, `retry` i `capabilities`:
  - widget z tytułem „Zakupy” pokazuje go w `h2` i oba zadania;
  - przy `hideCompleted: true` i pustym tytule `h2` to „Tasks”, a lista ma tylko „Mleko”;
  - przy `items` równym `undefined` nie ma wierszy, a są trzy szkielety (`.animate-pulse`).

  Oczekiwany wynik: **FAIL wszystkich trzech testów**, bo zaślepka pokazuje tylko tytuł.

- [ ] **3. Implementacja** `TodoWidget.vue`: `config` jak w zaślepce, `source = useTaskSource(config.value.source, props.widget.id)`, `visible` jako `computed` z filtrem przy `hideCompleted`. Szablon: kolumna z `h2` (z `pe-6`, żeby tytuł nie wchodził pod przycisk menu ramki), potem szkielety albo `UEmpty` z błędem, gdy `visible` jest `undefined`, a w przeciwnym razie `TaskList`, którego zdarzenia idą prosto do metod źródła.
- [ ] **4. Zielone testy.** Oczekiwany wynik: **PASS (104 testy w rozszerzeniu)**.
- [ ] **5. Eksperyment: `ref` w obiekcie.** Zamień w szablonie `v-if="source.isError.value"` na `v-if="source.isError"`. Uruchom typecheck i testy. **Oczekiwany wynik:** typecheck przechodzi, a test szkieletów **FAIL**: widget w trakcie wczytywania pokazuje „Could not load the tasks.”. Vue rozpakowuje w szablonie tylko `ref` z najwyższego poziomu. `source.isError` to obiekt `ref`, który zawsze jest prawdziwy. Przywróć `.value`.
- [ ] **6. W przeglądarce** (zbuduj paczkę i załaduj `.output/chrome-mv3`), z otwartym DevTools → Network:
  - dodaj widget Zadania: od razu widać „Brak zadań” i pole „Dodaj zadanie”, bez szkieletów, a `GET /widgets/:id/todos` wychodzi dopiero po `POST` widgetu;
  - dodaj „Mleko”, „Chleb” i „Masło”, odhacz „Chleb”, zmień „Mleko” na „Mleko 2%” Enterem (**jeden** `PATCH`), zacznij edytować „Masło”, wpisz coś i naciśnij Escape (**żadnego** `PATCH`), usuń „Masło” krzyżykiem;
  - przeładuj kartę: „Mleko 2%” i odhaczony „Chleb” są na swoich miejscach (scenariusz akceptacyjny 2);
  - przeciągnij zadanie za uchwyt w inne miejsce: jeden `PATCH` z samą pozycją, a kolejność zostaje po przeładowaniu (scenariusz 3);
  - włącz „Edytuj pulpit” i przeciągnij zadanie w widgecie: zadanie się przesuwa, a widget stoi w miejscu;
  - dodaj kilkanaście zadań: lista przewija się do każdego nowego, a pole zostaje na dole.
- [ ] **7.** `pnpm format && pnpm check`, potem commit: `feat(extension): show the task list in the todo widget`.

**Pułapki (sprawdzone na prototypie):**

- **Źródło wybierane raz.** `useTaskSource(config.value.source, …)` czyta konfigurację w `setup()`. Zmiana tytułu albo „Ukryj ukończone” działa na żywo przez `computed`, a zmiana źródła wymagałaby nowego widgetu (zadanie 8).
- **Filtrowanie w widgecie, nie w liście.** `TaskList` nie wie o „Ukryj ukończone” i nie musi: dostaje to, co ma pokazać. Dzięki temu przeciąganie zgłasza sąsiadów z widocznej listy, a źródło liczy pozycję z pełnej.
- **Szkielety tylko bez danych.** Gdy zadania są w cache, a odświeżenie się nie uda (API nie działa), widget dalej pokazuje listę z cache. Komunikat błędu pojawia się tylko wtedy, gdy nie ma czego pokazać, tak jak w `ContextDashboard`.
- **Zadania przy przełączaniu kontekstów.** Każdy widget ma własny wpis `['todos', widgetId]`, więc powrót do kontekstu pokazuje jego zadania od razu, z cache.

<details>
<summary>Podpowiedź</summary>

- Akcja w `UEmpty`: `:actions="[{ label: t('widgets.todo.retry'), onClick: source.retry }]"`, jak w ramce widgetu z Etapu 3.
- Zdarzenia listy do źródła: `@add="source.add"`, `@toggle="source.toggle"` i tak dalej. Sygnatury zdarzeń i metod są takie same.
- W teście mock musi zwracać ten sam `ref` `items`, który `beforeEach` ustawia na nowo, więc zadeklaruj go na poziomie modułu testu.

</details>

<details>
<summary>Rozwiązanie</summary>

`pl.json` i `en.json` (w `widgets.todo`, za `drag`)

```json
      "loadError": "Nie udało się wczytać zadań.",
      "retry": "Spróbuj ponownie",
```

```json
      "loadError": "Could not load the tasks.",
      "retry": "Try again",
```

`apps/extension/src/widgets/todo/TodoWidget.vue`

```vue
<script setup lang="ts">
import { TodoConfigSchema, type WidgetDto } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveConfig } from '../config'
import TaskList from './TaskList.vue'
import { useTaskSource } from './task-source'

const props = defineProps<{ widget: WidgetDto }>()
const { t } = useI18n()
const config = computed(() => resolveConfig(TodoConfigSchema, props.widget.config))
const source = useTaskSource(config.value.source, props.widget.id)

// F-TODO-06: a ticked task disappears at once when completed ones are hidden
const visible = computed(() =>
  config.value.hideCompleted
    ? source.items.value?.filter((item) => !item.done)
    : source.items.value,
)
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <h2 class="truncate pe-6 font-semibold text-highlighted">
      {{ config.title || t('widgets.todo.name') }}
    </h2>
    <!-- F-SYNC-02: the tasks of this widget are not in the cache yet -->
    <template v-if="!visible">
      <UEmpty
        v-if="source.isError.value"
        icon="i-lucide-cloud-off"
        :title="t('widgets.todo.loadError')"
        :actions="[{ label: t('widgets.todo.retry'), onClick: source.retry }]"
        variant="naked"
        size="sm"
      />
      <div v-else class="space-y-2">
        <USkeleton v-for="n in 3" :key="n" class="h-6" />
      </div>
    </template>
    <TaskList
      v-else
      :items="visible"
      :capabilities="source.capabilities"
      class="min-h-0 flex-1"
      @add="source.add"
      @toggle="source.toggle"
      @edit="source.edit"
      @remove="source.remove"
      @move="source.move"
    />
  </div>
</template>
```

`apps/extension/src/widgets/todo/TodoWidget.test.ts`

```ts
// @vitest-environment happy-dom
import ui from '@nuxt/ui/vue-plugin'
import type { WidgetDto } from '@one-place/shared'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { i18n } from '@/i18n'
import type { TaskItem } from './task-source'
import TodoWidget from './TodoWidget.vue'

const items = ref<TaskItem[] | undefined>()

vi.mock('./task-source', () => ({
  useTaskSource: () => ({
    items,
    isError: ref(false),
    retry: vi.fn(),
    capabilities: { reorder: true },
  }),
}))

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

function mountWidget(config: unknown) {
  return mount(TodoWidget, {
    props: { widget: widget(config) },
    global: { plugins: [ui, i18n] },
  })
}

beforeEach(() => {
  items.value = [
    { id: 'milk', text: 'Mleko', done: false },
    { id: 'bread', text: 'Chleb', done: true },
  ]
})

describe('TodoWidget', () => {
  it('shows the title and all tasks', () => {
    const wrapper = mountWidget({ title: 'Zakupy' })
    expect(wrapper.get('h2').text()).toBe('Zakupy')
    expect(wrapper.findAll('li').map((row) => row.text())).toEqual(['Mleko', 'Chleb'])
  })

  it('hides completed tasks when the config says so', () => {
    const wrapper = mountWidget({ hideCompleted: true })
    expect(wrapper.get('h2').text()).toBe('Tasks')
    expect(wrapper.findAll('li').map((row) => row.text())).toEqual(['Mleko'])
  })

  it('shows skeletons until the tasks are loaded', () => {
    items.value = undefined
    const wrapper = mountWidget({})
    expect(wrapper.find('li').exists()).toBe(false)
    expect(wrapper.findAll('.animate-pulse').length).toBe(3)
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego test widgetu podmienia `./task-source`, a nie API?** Test sprawdza, co widget robi z danymi źródła (tytuł, filtr, szkielety). Źródło ma własne testy (zadanie 8), a zapytania swoje (zadanie 6). Podmiana API wymagałaby `QueryClient`, cache i odpowiedzi HTTP, które z tym zachowaniem nie mają nic wspólnego.
2. **Gdzie zobaczysz widget w stanie błędu?** Gdy cache nie ma zadań tego widgetu, a API nie odpowiada, np. pierwsze otwarcie karty na nowym urządzeniu przy wyłączonym API. Przy danych w cache błąd odświeżenia jest niewidoczny, a pulpit pokazuje zapisany stan.
3. **Czy przy przełączeniu na kontekst z kilkoma widgetami Zadania wychodzi kilka żądań?** Tak, po jednym `GET /widgets/:id/todos` na widget, gdy dane są nieaktualne. To koszt klucza per widget, który pozwala odświeżać i cofać zmiany jednego widgetu niezależnie od innych.

</details>

---

## Zadanie 13: „Ukryj ukończone” w ustawieniach

**Cel:** ustawienia widgetu Zadania mają przełącznik „Ukryj ukończone” obok tytułu (F-TODO-06). Zapis zmienia konfigurację tak jak tytuł w Etapie 3, więc lista reaguje od razu.

**Czego się nauczysz:** `USwitch` w `UForm`, rozbudowa istniejącego formularza bez psucia jego testów.

**Pliki:**

- Zmień: `apps/extension/src/widgets/todo/TodoSettings.vue`, `apps/extension/src/i18n/pl.json`, `apps/extension/src/i18n/en.json`
- Test: `apps/extension/src/widgets/todo/TodoSettings.test.ts`

**Interfejsy:**

- Korzysta z: `TodoConfigSchema.hideCompleted` (Etap 3), filtra z zadania 12.

**Kroki:**

- [ ] **1. Tłumaczenia.** `widgets.todo.settings.hideCompleted`: „Ukryj ukończone” / „Hide completed”.
- [ ] **2. Czerwony test** w `TodoSettings.test.ts`: dla konfiguracji `{ title: 'Zakupy' }` kliknięcie przełącznika (`[role="switch"]`) i wysłanie formularza zgłaszają `save` z `{ title: 'Zakupy', hideCompleted: true, source: { type: 'local' } }`. Oczekiwany wynik: **FAIL**, bo przełącznika nie ma.
- [ ] **3. Implementacja.** `state` dostaje `hideCompleted: config.hideCompleted`, a pod polem tytułu `UFormField name="hideCompleted"` z `USwitch` i etykietą. Usuń komentarz „Stage 3 has only the title”.
- [ ] **4. Zielone testy.** Oczekiwany wynik: **PASS (105 testów w rozszerzeniu)**. Pierwszy test z Etapu 3 („keeps the other fields of the config”) dalej przechodzi: `hideCompleted: true` z konfiguracji trafia teraz do `state` i wraca w zapisie.
- [ ] **5. W przeglądarce:** odhacz jedno zadanie, włącz „Ukryj ukończone” i zapisz: ukończone znikają. Odhacz kolejne: znika od razu. Wyłącz opcję: wszystkie wracają na swoje miejsca.
- [ ] **6.** `pnpm format && pnpm check`, potem commit: `feat(extension): add "Hide completed" to the todo settings`.

**Pułapki (sprawdzone na prototypie):**

- **Cała konfiguracja w zapisie.** `PATCH /widgets/:id` zastępuje całą konfigurację (Etap 3), więc formularz nadal składa `{ ...config, ...state }`. Bez tego zapis tytułu kasowałby źródło, a zapis przełącznika tytuł.
- **Przełącznik w `UFormField` bez `label`.** Etykietę ma sam `USwitch` (`label`), więc `UFormField` służy tu tylko układowi i nazwie pola.

<details>
<summary>Rozwiązanie</summary>

`pl.json` i `en.json` (w `widgets.todo.settings`, za `titleHelp`)

```json
        "hideCompleted": "Ukryj ukończone"
```

```json
        "hideCompleted": "Hide completed"
```

`apps/extension/src/widgets/todo/TodoSettings.vue`

```vue
<script setup lang="ts">
import { TodoConfigSchema, type TodoConfig, type WidgetDto } from '@one-place/shared'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { formErrors } from '@/i18n/form-errors'
import { resolveConfig } from '../config'

const props = defineProps<{ widget: WidgetDto }>()
const emit = defineEmits<{ save: [config: TodoConfig] }>()

const { t } = useI18n()
const config = resolveConfig(TodoConfigSchema, props.widget.config)
const state = reactive({ title: config.title, hideCompleted: config.hideCompleted })
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
    <UFormField name="hideCompleted">
      <USwitch v-model="state.hideCompleted" :label="t('widgets.todo.settings.hideCompleted')" />
    </UFormField>
    <UButton type="submit" :label="t('widgets.settings.save')" block />
  </UForm>
</template>
```

`apps/extension/src/widgets/todo/TodoSettings.test.ts` (nowy test na końcu `describe`)

```ts
it('saves "Hide completed" and keeps the title', async () => {
  const wrapper = mount(TodoSettings, {
    props: { widget: widget({ title: 'Zakupy' }) },
    global: { plugins: [ui, i18n] },
  })
  await wrapper.get('[role="switch"]').trigger('click')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.emitted('save')).toEqual([
    [{ title: 'Zakupy', hideCompleted: true, source: { type: 'local' } }],
  ])
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego „Ukryj ukończone” jest w konfiguracji widgetu, a nie w stanie UI w `chrome.storage.local`?** Specyfikacja umieszcza je w ustawieniach widgetu (F-TODO-06), więc dotyczy wszystkich urządzeń. Dwa widgety Zadania w jednym kontekście mogą mieć różne ustawienia.
2. **Czy włączenie opcji wysyła coś do API poza `PATCH /widgets/:id`?** Nie. Filtrowanie dzieje się w przeglądarce. Ukończone zadania zostają w cache i w bazie, więc wyłączenie opcji pokazuje je od razu, bez żądania.

</details>

---

## Zadanie 14: budżet, kolejka w przeglądarce i przypadki brzegowe

**Cel:** startowy JS po Etapie 4 mieści się w budżecie, pierwszy render pulpitu z cache trwa poniżej 200 ms także przy długiej liście, a kolejka zapisów, sortowanie w prawdziwym Postgresie, zadanie usunięte na innym urządzeniu i limit 500 działają w zbudowanej paczce.

**Czego się nauczysz:** sprawdzanie kolejności żądań przy symulowanym braku sieci, wyłączanie zabezpieczenia na chwilę, żeby zobaczyć, przed czym chroni, `invalidateQueries` po 404, przygotowanie danych testowych w `psql`.

**Pliki:**

- Zmień: `apps/extension/src/queries/todos.ts`
- Test: `apps/extension/src/queries/todos.test.ts`

**Kroki:**

- [ ] **1. Pomiar.** `pnpm --filter @one-place/extension build && pnpm size`. Oczekiwany wynik: **około 492 kB** (budżet 550 kB). W liście plików z buildu osobno: `TodoWidget` (około 22 kB), `TodoSettings` (około 10 kB) i `vue-draggable-plus` (około 41 kB, ten sam chunk co w oknie kontekstów).
- [ ] **2. Czas pierwszego renderu.** Zbuduj, załaduj `.output/chrome-mv3`, dodaj do widgetu kilkadziesiąt zadań i odczekaj sekundę. Otwórz nową kartę i w konsoli wpisz `performance.getEntriesByName('dashboard-rendered')[0].startTime`. Powtórz kilka razy. Na prototypie, z jednym widgetem i 500 zadaniami, w Chromium headless: 59–73 ms. Wymaganie to poniżej 200 ms.
- [ ] **3. Kolejka offline.** W zbudowanej paczce utwórz nowy kontekst i odczekaj chwilę. DevTools → Network → „Offline”. Dodaj widget Zadania, dodaj „X” i je odhacz, dodaj „Y” i je usuń. Wyłącz tryb Offline. **Oczekiwany wynik:** żądania w kolejności `POST /widgets`, `POST /todos`, `PATCH`, `POST /todos`, `DELETE`, wszystkie 2xx, bez toastów. Po przeładowaniu jest odhaczone „X” i nie ma „Y”.
- [ ] **4. Eksperyment: bez kolejki.** Zakomentuj `scope` w `createQueryClient`, zbuduj i powtórz krok 3 w nowym kontekście. **Oczekiwany wynik:** `POST /todos` wychodzi przed `POST /widgets` i dostaje 404, `PATCH` i `DELETE` też dostają 404, a dwa toasty mówią, że zmiana została cofnięta. Po przeładowaniu nie ma „X”, a usunięte „Y” jest na liście. Kolejność żądań może się różnić między próbami. Przywróć `scope` i zbuduj ponownie.
- [ ] **5. Eksperyment: kolacja w Dockerze.** Zmień na chwilę kolację kolumny: `docker compose exec db psql -U one one_place -c 'alter table todo_items alter column position type text collate "default"'`. Przeciągnij ostatnie zadanie na samą górę listy i przeładuj kartę. **Oczekiwany wynik:** zadanie jest na dole. Dostało pozycję zaczynającą się wielką literą (np. `Zz`), a `en_US.utf8` stawia ją za `a0`. Przywróć: `… alter column position type text collate "C"` i przeładuj: zadanie wraca na górę.
- [ ] **6. Eksperyment: zadanie usunięte na innym urządzeniu.** Usuń zadanie w bazie: `docker compose exec db psql -U one one_place -c "delete from todo_items where text = 'Chleb'"`. Bez przełączania karty odhacz „Chleb”. **Oczekiwany wynik:** `PATCH` z 404, toast „Ten element został już usunięty, np. na innym urządzeniu.”, a „Chleb” zostaje na liście, dopóki nie przejdziesz na inną kartę i z powrotem.
- [ ] **7. Czerwony test.** W `todos.test.ts` dodaj test: `useUpdateTodo` z odpowiedzią 404 `NOT_FOUND` odrzuca mutację, a `queryClient.getQueryState(key)?.isInvalidated` jest `true`. Oczekiwany wynik: **FAIL**.
- [ ] **8. Poprawka.** W `onError` mutacji `useUpdateTodo` po cofnięciu wywołaj `invalidateQueries` dla `todosKey(widgetId)`, gdy `apiErrorInfo(error)?.status === 404`. Oczekiwany wynik: **PASS (106 testów w rozszerzeniu)**. Zbuduj i powtórz krok 6 z innym zadaniem: po `PATCH` z 404 wychodzi `GET`, a zadanie znika.
- [ ] **9. Limit 500.** Uzupełnij widget Zadania do 499 zadań (wpisz swój e-mail; polecenie dotyczy wszystkich widgetów Zadania tego konta):

  ```bash
  docker compose exec db psql -U one one_place -c "insert into todo_items (id, user_id, widget_id, text, position) select gen_random_uuid(), w.user_id, w.id, 'Task ' || n, 'b' || lpad(n::text, 3, '0') from widgets w join \"user\" u on u.id = w.user_id cross join lateral generate_series(1, 499 - (select count(*)::int from todo_items t where t.widget_id = w.id)) n where w.type = 'todo' and u.email = 'twoj@email.pl'"
  ```

  Przejdź na inną kartę i wróć, potem dodaj dwa zadania. **Oczekiwany wynik:** pierwsze zostaje, drugie pojawia się i znika, a toast mówi „Osiągnięto limit. Usuń coś, zanim dodasz kolejny element.”. Na koniec usuń zadania testowe: `delete from todo_items t using "user" u where u.id = t.user_id and u.email = 'twoj@email.pl' and t.text like 'Task %'`.

- [ ] **10. Prywatność.** W zbudowanej paczce przejdź przez kroki 3–9 z otwartym DevTools → Network i filtrem `-domain:localhost`. Nie ma żadnych żądań.
- [ ] **11.** `pnpm format && pnpm check`, potem commit: `fix(extension): refetch tasks after a change of a deleted task`.

**Pułapki (sprawdzone na prototypie):**

- **Ten sam błąd co z układem w Etapie 3.** Cofnięcie przywraca cache sprzed zmiany, ale ten stan był już nieaktualny. 404 przy zmianie zadania mówi wprost, że zadania nie ma, więc warto od razu zapytać serwer.
- **Unieważnienie tylko po 404.** Odrzucony tekst (400) albo brak sieci nie mówią nic o tym, że lista jest nieaktualna. `useDeleteTodo` nie potrzebuje poprawki: 404 traktuje jak sukces, więc zadanie znika samo.
- **`alter table` zmienia też indeks.** Przy zmianie kolacji kolumny Postgres przebudowuje indeks `(widget_id, position)`, więc przywrócenie `"C"` przywraca całe zachowanie, a nie tylko sortowanie w zapytaniu.
- **Tryb Offline w `pnpm dev` blokuje też serwer Vite.** Tak jak w poprzednich etapach, kroki 3 i 4 rób na zbudowanej paczce.

<details>
<summary>Rozwiązanie</summary>

`apps/extension/src/queries/todos.ts` (zmieniony `onError` w `useUpdateTodo`)

```ts
    onError: (error, { widgetId }, rollback) => {
      rollback?.()
      // The task was deleted, e.g. on another device. The rollback brought it back, so the tasks
      // are fetched again to show what the API has.
      if (apiErrorInfo(error)?.status === 404) {
        void queryClient.invalidateQueries({ queryKey: todosKey(widgetId) })
      }
    },
```

`apps/extension/src/queries/todos.test.ts` (nowy `describe` przed `useDeleteTodo`)

```ts
describe('useUpdateTodo after a task was deleted on another device', () => {
  it('fetches the tasks again, so the deleted one disappears', async () => {
    api.patch.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Task not found' } }),
    )
    const { mutateAsync } = withQueryClient(queryClient, useUpdateTodo)
    await expect(mutateAsync({ id: 'bread', widgetId: 'tasks', done: false })).rejects.toThrow()
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })
})
```

</details>

<details>
<summary>Pytania kontrolne (z odpowiedziami)</summary>

1. **Dlaczego w kroku 4 przepada „X”, a nie tylko jego odhaczenie?** `POST /todos` dotarł przed `POST /widgets`, więc API odpowiedziało 404 (widget nie istnieje). Mutacja cofnęła dodanie, a `PATCH` odhaczenia też dostał 404, bo zadania nigdy nie zapisano.
2. **Dlaczego kroku 2 nie robisz z widgetem, którego zadania nie ma w cache?** `dashboard-rendered` mierzy pulpit z ramkami widgetów. Lista zadań ładuje się chwilę później razem z leniwym `TodoWidget`, a z cache pokazuje się bez żądania. Bez cache widać szkielety (F-SYNC-02), a to nie jest scenariusz z wymagania wydajności.
3. **Co się stanie, gdy na innym urządzeniu usunięto cały widget, a tu dodasz do niego zadanie?** `POST` dostanie 404 i dodanie się cofnie. Widget zniknie przy najbliższym odświeżeniu widgetów (powrót do karty). Plan tego nie przyspiesza, bo to rzadki przypadek, który i tak kończy się poprawnym stanem.

</details>

---

## Zadanie 15: domknięcie Etapu 4

**Cel:** spełniona definicja ukończenia Etapu 4, decyzje z tego planu zapisane w dokumentacji, a dokumentacja zgodna z kodem.

**Kroki:**

- [ ] **1. Architektura.** W [03-architektura.md](03-architektura.md):
  - w „Struktura repozytorium”: `src/lib/` (`positions.ts`, `by-position.ts`) i pliki widgetu Zadania (`task-source.ts`, `local-task-source.ts`, `TaskList.vue`);
  - w „API” (zasady): trasy `/widgets/:id/todos` są w routerze zagnieżdżonym w `widgetsRoutes`, a `/todos/:id` w osobnym routerze z własnym `requireAuth`; zadania widgetu innego typu dają `400 VALIDATION_ERROR`, a cudzy widget albo zadanie 404; lista zadań jest sortowana po `(position, id)`;
  - w „Start nowej karty”: startowy JS po Etapie 4 (Twój pomiar, na prototypie około 492 kB), leniwe części (`TodoWidget` z listą, `TodoSettings`, `vue-draggable-plus`) i uwaga, że `byPosition` jest w osobnym pliku, żeby `fractional-indexing` nie trafiał na ścieżkę startową;
  - w „Warstwa danych”: klucz `['todos', widgetId]` i `createWidgetKey` w `queries/keys.ts`; `useTodos` czeka na zapis widgetu, a nowy widget Zadania dostaje w cache pustą listę; usunięcie widgetu i kontekstu usuwa wpisy zadań; zmiana zadania z 404 unieważnia listę zadań; mutacje zadań mają wspólny `mutationKey` i zapisują odpowiedź tylko wtedy, gdy nie czeka nowsza zmiana;
  - w „Zachowanie sieciowe”: wszystkie mutacje mają `scope: { id: 'api' }`, więc idą do API po kolei, w kolejności wykonania, także po powrocie sieci; jedno zawieszone żądanie wstrzymuje następne;
  - w „System widgetów” (źródła danych): `TaskSource` w wersji z decyzji 5 (`items` z `undefined` do pierwszego wczytania, `isError`, `retry`, `capabilities.reorder`, `move` z ID sąsiadów), `TaskItem` bez `position`, filtr „Ukryj ukończone” w `TodoWidget`;
  - w rejestrze decyzji: wspólna kolejka mutacji (odrzucone: równoległe zapisy z 404 po powrocie sieci, blokada pola do zapisu widgetu i zadania).
- [ ] **2. Roadmapa.** Przy Etapie 4 w [04-roadmapa.md](04-roadmapa.md) jest odnośnik do tego planu. Sprawdź, czy zakres się zgadza.
- [ ] **3. Specyfikacja.** W [02-specyfikacja.md](02-specyfikacja.md) w F-SYNC-05 dopisz, że zmiany czekające na sieć są wysyłane w kolejności, w jakiej zostały zrobione. Sprawdź, czy F-TODO-01 … F-TODO-08 zgadzają się z tym, co powstało.
- [ ] **4. Definicja ukończenia** z [roadmapy](04-roadmapa.md#etap-4-widget-zadania):
  - [ ] wszystkie operacje na zadaniach (dodawanie, odhaczanie, edycja, usuwanie, przeciąganie) działają optymistycznie i przetrwają przeładowanie (zadania 12 i 13);
  - [ ] `TaskList` ma testy komponentu niezależne od API (`TaskList.test.ts`, zadania 9–11);
  - [ ] testy API sprawdzają 401 bez sesji, 404 dla cudzego widgetu i zadania, 400 dla niepoprawnych danych i widgetu innego typu oraz 422 przy limicie (`todos.test.ts`);
  - [ ] kolumna `position` w `todo_items` ma kolację `"C"` (test migracji i krok 5 zadania 14);
  - [ ] startowy JS mieści się w budżecie, a pierwszy render z cache trwa poniżej 200 ms.
- [ ] **5.** `pnpm check` (oczekiwany wynik: 31 + 97 + 106 = **234 testy**), potem commit: `docs: add stage 4 results`.

---

## Materiały

| Temat                                           | Gdzie czytać                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| TanStack Query: kolejka mutacji (`scope`)       | https://tanstack.com/query/latest/docs/framework/react/guides/mutations#mutation-scopes             |
| TanStack Query: mutacje optymistyczne           | https://tanstack.com/query/latest/docs/framework/vue/guides/optimistic-updates                      |
| Równoległe zmiany optymistyczne (TkDodo)        | https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query                                 |
| `vue-draggable-plus`                            | https://vue-draggable-plus.pages.dev/en/                                                            |
| Indeksy ułamkowe (`fractional-indexing`)        | https://github.com/rocicorp/fractional-indexing                                                     |
| Postgres: kolacje                               | https://www.postgresql.org/docs/current/collation.html                                              |
| Zdarzenie `blur`                                | https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event                                 |
| Vue: rozpakowywanie `ref` w szablonie           | https://vuejs.org/guide/essentials/reactivity-fundamentals.html#caveat-when-unwrapping-in-templates |
| Vue: `useTemplateRef`                           | https://vuejs.org/api/composition-api-helpers.html#usetemplateref                                   |
| Vue Test Utils: `trigger`                       | https://test-utils.vuejs.org/api/#trigger                                                           |
| Zod: metody tekstu (`trim`, `min`, `max`)       | https://zod.dev/api#strings                                                                         |
| Nuxt UI: Checkbox i Switch                      | https://ui.nuxt.com/docs/components/checkbox, https://ui.nuxt.com/docs/components/switch            |
| Drizzle: kolumny Postgresa (`boolean`, indeksy) | https://orm.drizzle.team/docs/column-types/pg, https://orm.drizzle.team/docs/indexes-constraints    |

## Co dalej

Po Etapie 4 kolejnym krokiem jest [Etap 5: Motywy](04-roadmapa.md#etap-5-motywy): `resolveTheme` w `shared`, kolumny `user_settings.theme` i `contexts.theme_override` z nową migracją i zmianą `CACHE_SCHEMA_VERSION`, `applyTheme` i `theme-boot.js` bez mignięcia oraz sekcja „Wygląd” w ustawieniach kontekstu. Przygotuję dla niego podobny plan nauki, gdy będziesz gotowy.
