# @no-human/typografia

Polska typografia: twarde spacje (U+00A0)
tam, gdzie wiersz nie powinien się złamać — po sierotach („i w domu”), między
liczbą a jednostką, po skrótach, przy przepisach, inicjałach, datach
i przed spacjowaną pauzą.

TypeScript, ESM, zero zależności w runtime, Node ≥ 22.12 i każda współczesna
przeglądarka. Kod **nie używa lookbehind** (`(?<=…)` rzuca przy parsowaniu na
Safari < 16.4 i kładzie cały bundel) — test `src/source.test.ts` tego pilnuje.

## Zasady

- Słowniki i dane trzymają **zwykłe spacje**; twarda spacja powstaje przy
  renderze. Nigdy literalny U+00A0 w źródle (niewidoczny w diffie i w grepie,
  znika przy kopiowaniu). W tej paczce pilnuje tego ESLint
  (`no-irregular-whitespace`) i test źródeł.
- Zmieniana jest wyłącznie **pojedyncza zwykła spacja** między dwoma wyrazami.
  Istniejące twarde spacje (także U+202F), encje `&nbsp;`, nowe linie,
  tabulatory i wielokrotne spacje zostają — dlatego każda funkcja jest
  **idempotentna** (dwa przebiegi = jeden).
- Wyrazy nie są modyfikowane, więc adresy URL, e-maile i numery zostają znak
  w znak (najwyżej spacja przed nimi staje się twarda: „lub a@b.pl”).
- Cudzysłowy, dywizy i pauzy nie są zamieniane na inne znaki.

## API

```ts
import {
  NBSP, ORPHANS_PL, DEFAULT_ABBREVIATIONS_PL, UNITS, ABBREVIATIONS_PL, LEGAL_PL, MONTHS_PL, ORPHAN_RE,
  hardSpaces, typeset, hardSpacesDeep, hardSpacesHtml, findOrphans,
  type HardSpacesOptions, type HardSpacesRules, type Lang,
} from '@no-human/typografia';
```

| Eksport | Opis |
|---|---|
| `NBSP` | `'\u00A0'` |
| `ORPHANS_PL` | `readonly string[]` (zamrożona, 46 słów): a, i, o, u, w, z, że, ale, na, do, od, po, za, ze, we, lub, oraz, czy, nie, bez, dla, ku, by, pod, nad, przy, przez, albo, to, co, jak, się, ani, są, jest, aby, już, też, tam, tu, aż, bo, no, niż, gdy, iż |
| `DEFAULT_ABBREVIATIONS_PL` | `readonly string[]` (zamrożona): nr, np., ok. — skróty wiązane domyślnie, podzbiór `ABBREVIATIONS_PL` |
| `hardSpaces(text, opts?)` | domyślnie (`lang: 'pl'`, bez reguł) wiąże z następnym wyrazem 46 słów z `ORPHANS_PL` oraz skróty nr, np., ok. (`DEFAULT_ABBREVIATIONS_PL`) — bez względu na wielkość liter, na początku zdania, po interpunkcji otwierającej `( [ { „ " ' » « “ ‘ – — -`, ciągami („i w domu”) |
| `typeset(text, lang = 'pl', opts?)` | skład w danym języku: `pl` = `hardSpaces` + reguła `dashes`; `en` = bez zmian |
| `hardSpacesDeep(value, opts?)` | `hardSpaces` dla każdego napisu w tablicach i zwykłych obiektach (JSON treści, słowniki); klucze i inne typy bez zmian, wejście niemodyfikowane |
| `hardSpacesHtml(html, opts?)` | to samo dla fragmentu HTML — tylko węzły tekstowe (patrz niżej) |
| `findOrphans(text, opts?)` | niezwiązane sieroty (słowo z `ORPHANS_PL` lub skrót z `DEFAULT_ABBREVIATIONS_PL` przed zwykłą spacją) — do testów i lintów treści |
| `ORPHAN_RE` | `RegExp` bez flagi `g`: słowo z `ORPHANS_PL` lub `DEFAULT_ABBREVIATIONS_PL` przed zwykłą spacją (asercje E2E na wyrenderowanym tekście) |
| `UNITS`, `ABBREVIATIONS_PL`, `LEGAL_PL`, `MONTHS_PL` | listy używane przez reguły (zamrożone) |

### Opcje

```ts
interface HardSpacesOptions {
  lang?: 'pl' | 'en';            // domyślnie 'pl'
  extraWords?: readonly string[]; // dokładane do listy sierot (np. 'się', 'jak')
  rules?: {                       // wszystkie domyślnie false
    units?: boolean;         // „50 kW”, „190 L”, „15 %”, „3 m²”, „5 tys. zł”, „8 000 zł”
    legal?: boolean;         // „art. 5”, „§ 3”, „ust. 2”, „pkt 1”, „lit. a”     (tylko pl)
    abbreviations?: boolean; // wszystkie ABBREVIATIONS_PL: „tj. to”, „ul. Długa”, „dr Nowak”, „2026 r.”, „XIX w.” (tylko pl)
    initials?: boolean;      // „J. Kowalski”, „J.R.R. Tolkien”
    dates?: boolean;         // „17 października”                                (tylko pl)
    dashes?: boolean;        // „tekst — dalej”: pauza/półpauza nie zaczyna wiersza
  };
}
```

**Skróty domyślne.** Bez opcji wiązane są też „nr”, „np.” i „ok.” — tak
samo jak w regule `abbreviations`: bez względu na wielkość liter, po
interpunkcji otwierającej, tylko w dokładnej formie („np” bez kropki,
„nr.” i „np.,” zostają). Reguła `abbreviations` dokłada pozostałe skróty
z `ABBREVIATIONS_PL` oraz „2026 r.” i „XIX w.”.

**Angielski.** `lang: 'en'` wyłącza listy `ORPHANS_PL`, `DEFAULT_ABBREVIATIONS_PL` i reguły polskie
(`legal`, `abbreviations`, `dates`) — w angielskim „a” i „I” kończą wiersze
i wiązanie ich byłoby błędem. Reguły niezależne od języka (`units`,
`initials`, `dashes`) i `extraWords` działają, jeśli je włączysz. Bez opcji
tekst angielski wychodzi bez zmian.

```ts
hardSpaces('Dom i w ogrodzie');                         // 'Dom i\u00A0w\u00A0ogrodzie'
hardSpaces('faktura nr 5, np. dziś');                   // 'faktura nr\u00A05, np.\u00A0dziś'
hardSpaces('50 kW, nr 5', { rules: { units: true, abbreviations: true } });
typeset(t('nav.sales'), lang);                          // słownik interfejsu w języku użytkownika
hardSpacesDeep(content, { rules: { units: true } });    // cały JSON treści
expect(findOrphans(await page.innerText('main'))).toEqual([]);
```

### HTML

`hardSpacesHtml` zmienia wyłącznie tekst między znacznikami. Nie rusza
znaczników, atrybutów (także z `>` w cudzysłowie), komentarzy, `<!DOCTYPE>`,
encji ani treści `script`, `style`, `pre`, `code`, `textarea`, `kbd`, `samp`,
`template` (niezamknięty taki element chroni resztę dokumentu). `&nbsp;`,
`&#160;`, `&#xA0;` liczą się jako twarda spacja; encje cudzysłowów
(`&bdquo;i`) jak interpunkcja. Wstawiany jest znak U+00A0, nie encja.

Ograniczenie: nie wiąże ponad znacznikami — w `<b>i</b> domu` spacja zostaje.

W React lepiej przepuszczać przez `hardSpaces` same napisy (węzły tekstowe
drzewa, np. w komponencie owijającym tekst), niż składać HTML.

## Instalacja

Paczka jest publiczna w rejestrze npmjs.com — bez `.npmrc` i bez tokenu:

```bash
npm install @no-human/typografia
```

## Rozwój

```bash
npm ci
npm run lint && npm run typecheck && npm test && npm run build
```

Wydanie: podbij `version` w `package.json`, commit na `main`, tag `vX.Y.Z`
(musi równać się wersji). Potok tagu ma ręczny job `publikacja`
(`npm publish` do npmjs.com) z tokenem `NPM_TOKEN` — zmienna projektu
*masked* + *protected* (tagi `v*` muszą być chronione). Bez niej job pada
z czytelnym komunikatem.

## Wersjonowanie

Wersjonowanie semantyczne: zmiana domyślnego zachowania `hardSpaces` lub
list `ORPHANS_PL` i `DEFAULT_ABBREVIATIONS_PL` to wersja główna. Jeśli twarde spacje powstają przy
renderze, nowa wersja działa od razu po jej podniesieniu. Jeśli projekt
zapisuje je w plikach (skrypt przepuszczający słowniki lub dane), po
podniesieniu wersji trzeba ponownie przepuścić teksty i zacommitować wynik.
Pilnuje tego test porównujący zapis z paczką:
`hardSpaces(tekst.replaceAll(NBSP, ' '), opcje) === tekst`.

## Zmiany

- **3.0.0** — domyślne `hardSpaces` (`lang: 'pl'`, bez opcji) wiąże także
  skróty „nr”, „np.” i „ok.” z następnym wyrazem (nowa lista
  `DEFAULT_ABBREVIATIONS_PL`, dopasowanie jak w regule `abbreviations`).
  Dziedziczą to `typeset`, `hardSpacesDeep` i `hardSpacesHtml`; `findOrphans`
  i `ORPHAN_RE` zgłaszają te skróty przed zwykłą spacją. `lang: 'en'` bez
  zmian. Domyślne zachowanie wiąże więcej, stąd wersja główna — teksty
  zapisane w plikach trzeba przepuścić ponownie (patrz Wersjonowanie).
- **2.0.1** — `exports` z warunkiem `default`: paczkę da się wczytać także przez
  `require()` (Node ≥ 22.12), np. w loaderach testów kompilujących do CommonJS.
  Reguła `units` wiąże jednostkę także przed kropką za nawiasem lub cudzysłowem
  („(2 × 113 kW).”, „„50 kW”.”).
- **2.0.0** — `ORPHANS_PL` rozszerzona z 23 do 46 słów (pod, nad, przy, przez,
  albo, to, co, jak, się, ani, są, jest, aby, już, też, tam, tu, aż, bo, no,
  niż, gdy, iż). Domyślne `hardSpaces` wiąże więcej, stąd wersja główna.
- **1.0.0** — pierwsze wydanie.

## Licencja

MIT, © 2026 NO-HUMAN PSA.
