# 01. Wizja

## Czym jest One Place

One Place to rozszerzenie do Chrome i Brave, które zastępuje stronę nowej karty konfigurowalnym pulpitem z widgetów. Każda funkcjonalność (zadania, notatki, linki, pogoda, pomodoro, health-checki) jest osobnym widgetem, który użytkownik dodaje, usuwa, przesuwa i skaluje na siatce.

Pulpity są pogrupowane w **konteksty**, np. „Praca” i „Prywatne”. Każdy kontekst ma własny zestaw widgetów, własny układ i opcjonalnie własny wygląd.

## Po co

Nowa karta otwiera się dziesiątki razy dziennie i zwykle nic nie wnosi. One Place zamienia ją w jedno miejsce, w którym od razu widać to, czego potrzebujesz w danym kontekście: zadania, linki, stan serwerów, a w przyszłości szybkie akcje z klawiatury.

## Dla kogo

1. **Teraz:** autor, jako codzienne narzędzie pracy.
2. **Docelowo:** publiczne rozszerzenie w Chrome Web Store.

Rozszerzenie powstaje od początku z myślą o publikacji, co wpływa na decyzje już w MVP: minimum uprawnień, i18n, prywatność i architektura gotowa na wielu użytkowników.

## Zasady produktu

- **Natychmiastowy start.** Nowa karta pokazuje pulpit od razu z lokalnego cache, bez spinnera. Dane z serwera odświeżają się w tle.
- **Serwer jest źródłem prawdy.** Wszystkie dane są synchronizowane z backendem, więc ten sam pulpit jest dostępny na każdym urządzeniu po zalogowaniu. Lokalny storage służy wyłącznie jako cache dla wydajności.
- **Widgety jako moduły.** Dodanie nowego widgetu nie wymaga zmian w rdzeniu pulpitu.
- **Minimum uprawnień.** Rozszerzenie prosi tylko o to, czego potrzebuje teraz. Uprawnienia wrażliwe (np. powiadomienia) są opcjonalne i włączane przez użytkownika.
- **Prywatność.** Bez telemetrii i analityki. Rozszerzenie łączy się wyłącznie z własnym API. Ikony i fonty są w paczce.
- **Przygotowanie zamiast nadmiarowej budowy.** Rzeczy z roadmapy (tło pulpitu, integracje, tryb bez konta) nie są budowane w MVP, ale model danych i interfejsy są tak zaprojektowane, żeby później nie wymagały migracji ani przepisywania.

## MVP (demo)

Pierwsza wersja to demo, które potwierdza architekturę od końca do końca:

- logowanie (e-mail i hasło);
- zarządzanie kontekstami (tworzenie, zmiana nazwy i ikony, kolejność, usuwanie, przełączanie);
- motywy: jasny, ciemny lub systemowy oraz kolor akcentu, globalnie lub z nadpisaniem w kontekście; model przygotowany na późniejszą zmianę tła;
- siatka widgetów z trybem edycji: dodawanie, usuwanie, przesuwanie i zmiana rozmiaru;
- jeden widget: **Zadania** (lista todo).

Widget Zadania wybrano zamiast Pomodoro, bo w pełni sprawdza najbardziej ryzykowną część architektury, czyli synchronizację danych użytkownika z backendem (tworzenie, edycja, usuwanie, kolejność, optymistyczne aktualizacje).

### Poza zakresem MVP

Paleta Cmd+K, pozostałe widgety (Notatki, Linki, Pomodoro, Pogoda, Health-checki), wdrożenie na VPS, reset hasła i magic link, tryb bez konta, tło pulpitu, integracje zewnętrzne (np. Todoist), publikacja w Chrome Web Store. Kolejność tych etapów opisuje [04-roadmapa.md](04-roadmapa.md).

## Kryteria sukcesu MVP

- Wszystkie scenariusze akceptacyjne z [02-specyfikacja.md](02-specyfikacja.md#kryteria-akceptacji-mvp) przechodzą jako testy E2E.
- Pulpit z cache renderuje się w czasie poniżej 200 ms od otwarcia karty, bez mignięcia innym motywem.
- Ten sam pulpit (konteksty, układ, zadania, motyw) jest widoczny po zalogowaniu w drugiej przeglądarce.
- Rozszerzenie działa w aktualnych stabilnych wersjach Chrome i Brave.
- Autor używa go jako domyślnej nowej karty.

## Docelowa wizja (po MVP)

- Komplet widgetów z README: Notatki, Linki, Pomodoro, Pogoda, Health-checki serwerów i endpointów.
- Paleta Cmd+K do nawigacji i akcji z klawiatury, rozszerzalna przez widgety.
- Personalizacja tła (kolor, gradient, obraz), także per kontekst.
- Widgety z wymiennymi źródłami danych (np. Zadania z Todoist).
- Publikacja w Chrome Web Store z trybem bez konta i logowaniem magic linkiem.

## Dokumenty

| Dokument | Zawartość |
|---|---|
| [01-wizja.md](01-wizja.md) | cel, odbiorcy, zasady, zakres MVP |
| [02-specyfikacja.md](02-specyfikacja.md) | słownik, wymagania funkcjonalne i niefunkcjonalne MVP, kryteria akceptacji |
| [03-architektura.md](03-architektura.md) | stack, struktura, model danych, API, rozszerzenie, system widgetów, testy, decyzje i ryzyka |
| [04-roadmapa.md](04-roadmapa.md) | etapy MVP z definicją ukończenia, etapy po MVP, pomysły |
