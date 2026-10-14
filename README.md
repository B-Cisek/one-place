# One Place

Rozszerzenie do przeglądarek Chrome i Brave, które zastępuje stronę nowej karty pulpitem z widgetów. Pulpit można dowolnie skonfigurować.

Każda funkcjonalność jest osobnym widgetem. Widgety można dodawać, usuwać i układać według potrzeb.

## Planowane funkcjonalności

- **Konteksty**: osobne pulpity dla pracy i spraw prywatnych
- **Todo list**: lista zadań
- **Notatki**: szybkie notatki
- **Linki**: zapisane linki do stron
- **Motyw**: konfiguracja wyglądu
- **Pomodoro**: timer do pracy w blokach czasowych
- **Pogoda**: aktualna pogoda i prognoza
- **Health-checki**: monitoring dostępności serwerów VPS i endpointów
- **Paleta Cmd+K**: szybkie wyszukiwanie i uruchamianie akcji z klawiatury

## Uruchomienie lokalne

### Wymagania

- Node.js 24 lub nowszy
- pnpm 10 (wersję z `packageManager` w `package.json` ustawi `corepack enable`)
- Docker z Docker Compose
- Chrome lub Brave

### Kroki

1. Zainstaluj zależności:

   ```bash
   pnpm install
   ```

2. Uruchom bazę danych (Postgres na porcie 5432):

   ```bash
   docker compose up -d
   ```

3. Skopiuj pliki ze zmiennymi środowiskowymi:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/extension/.env.example apps/extension/.env
   ```

4. W `apps/api/.env` wpisz origin rozszerzenia, żeby API przepuściło jego żądania przez CORS:

   ```
   ALLOWED_ORIGINS=chrome-extension://lclohdcgnfnnkehmmojjpgjicodhjpkh
   ```

   ID wynika z klucza publicznego w `manifest.key` w `apps/extension/wxt.config.ts`, więc jest takie samo na każdym komputerze. Własną parę kluczy, na przykład w forku, wygenerujesz poleceniem `node scripts/generate-extension-key.mjs`. Wypisany `KEY` wklej do `manifest.key`, a `ID` do `ALLOWED_ORIGINS`.

5. Wygeneruj sekret Better Auth i wpisz go do `BETTER_AUTH_SECRET` w `apps/api/.env`:

   ```bash
   openssl rand -base64 32
   ```

6. Utwórz tabele w bazie (migracje drizzle-kit):

   ```bash
   pnpm --filter @one-place/api db:migrate
   ```

7. Uruchom API i rozszerzenie:

   ```bash
   pnpm dev
   ```

   API działa pod `http://localhost:3000` (`/api/health` pokazuje stan API i bazy). WXT uruchamia serwer deweloperski na porcie 3001 i otwiera przeglądarkę z rozszerzeniem. Jeśli przeglądarka się nie otworzy, wejdź na `chrome://extensions`, włącz „Tryb dewelopera”, kliknij „Załaduj rozpakowane” i wskaż `apps/extension/.output/chrome-mv3-dev`.

Przed commitem uruchom `pnpm check` (lint, formatowanie, typy i testy).

Rozmiar startowego JS nowej karty sprawdzisz po buildzie:

```bash
pnpm --filter @one-place/extension build && pnpm size
```

Skrypt sumuje skrypt wejściowy i chunki z `modulepreload` i kończy się błędem, gdy suma przekracza budżet z [specyfikacji](docs/02-specyfikacja.md#wymagania-niefunkcjonalne).

## Dokumentacja

Wizja, specyfikacja, architektura, roadmapa i plan implementacji są w katalogu [docs/](docs/).
