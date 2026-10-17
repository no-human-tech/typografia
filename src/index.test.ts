import { describe, expect, it } from 'vitest';
import {
  ABBREVIATIONS_PL,
  LEGAL_PL,
  MONTHS_PL,
  NBSP,
  ORPHAN_RE,
  ORPHANS_PL,
  UNITS,
  findOrphans,
  hardSpaces,
  hardSpacesDeep,
  typeset,
  type HardSpacesOptions,
} from './index.js';

/** Czytelny zapis oczekiwanego wyniku: `~` oznacza twardą spację. */
const nb = (s: string): string => s.replaceAll('~', NBSP);

const ALL: HardSpacesOptions = {
  rules: { units: true, legal: true, abbreviations: true, initials: true, dates: true, dashes: true },
};
const hs = (s: string): string => hardSpaces(s, ALL);

describe('stałe', () => {
  it('NBSP to U+00A0', () => {
    expect(NBSP).toBe(String.fromCharCode(0xa0));
  });

  it('ORPHANS_PL zawiera uzgodnioną listę (46 słów)', () => {
    expect([...ORPHANS_PL]).toEqual([
      'a', 'i', 'o', 'u', 'w', 'z', 'że', 'ale', 'na', 'do', 'od', 'po', 'za', 'ze', 'we',
      'lub', 'oraz', 'czy', 'nie', 'bez', 'dla', 'ku', 'by',
      'pod', 'nad', 'przy', 'przez', 'albo', 'to', 'co', 'jak',
      'się', 'ani', 'są', 'jest', 'aby', 'już', 'też', 'tam', 'tu', 'aż', 'bo', 'no', 'niż', 'gdy',
      'iż',
    ]);
    expect(new Set(ORPHANS_PL).size).toBe(46);
  });

  it('wiąże ciągi nowych słów: „tu i tam”, „się z”, „przez API”', () => {
    expect(hardSpaces('Jest tu i tam')).toBe(nb('Jest~tu~i~tam'));
    expect(hardSpaces('Pliki się zapisują przez API')).toBe(nb('Pliki się~zapisują przez~API'));
  });

  it('skróty z kropką nie są na liście — obsługuje je reguła abbreviations', () => {
    expect(hardSpaces('np. tak')).toBe('np. tak');
  });

  it('listy są zamrożone', () => {
    for (const list of [ORPHANS_PL, UNITS, ABBREVIATIONS_PL, LEGAL_PL, MONTHS_PL]) {
      expect(Object.isFrozen(list)).toBe(true);
    }
  });
});

describe('hardSpaces — sieroty (domyślnie)', () => {
  it.each(ORPHANS_PL.map((w) => [w]))('wiąże „%s” z następnym wyrazem', (word) => {
    expect(hardSpaces(`tekst ${word} dalej`)).toBe(`tekst ${word}${NBSP}dalej`);
  });

  it.each(ORPHANS_PL.map((w) => [w.charAt(0).toUpperCase() + w.slice(1)]))(
    'wiąże „%s” na początku zdania',
    (word) => {
      expect(hardSpaces(`${word} dalej`)).toBe(`${word}${NBSP}dalej`);
      expect(hardSpaces(`Koniec. ${word} dalej`)).toBe(`Koniec. ${word}${NBSP}dalej`);
    },
  );

  it('wiąże wielkimi literami', () => {
    expect(hardSpaces('W DOMU I W PRACY')).toBe(nb('W~DOMU I~W~PRACY'));
  });

  it('wiąże ciąg sierot', () => {
    expect(hardSpaces('był i w domu')).toBe(nb('był i~w~domu'));
    expect(hardSpaces('u i w nas')).toBe(nb('u~i~w~nas'));
  });

  it('wiąże po interpunkcji, nawiasie i cudzysłowie', () => {
    expect(hardSpaces('tak, i nie')).toBe(nb('tak, i~nie'));
    expect(hardSpaces('(w domu)')).toBe(nb('(w~domu)'));
    expect(hardSpaces('„i coś dalej”')).toBe(nb('„i~coś dalej”'));
    expect(hardSpaces('"a potem"')).toBe(nb('"a~potem"'));
    expect(hardSpaces("'z nami'")).toBe(nb("'z~nami'"));
    expect(hardSpaces('»w tym«')).toBe(nb('»w~tym«'));
    expect(hardSpaces('[o tym]')).toBe(nb('[o~tym]'));
    expect(hardSpaces('tekst — w środku')).toBe(nb('tekst — w~środku'));
  });

  it('nie wiąże wyrazu, który tylko przypomina sierotę', () => {
    expect(hardSpaces('ala ma kota')).toBe('ala ma kota');
    expect(hardSpaces('na-wpół zrobione')).toBe('na-wpół zrobione');
    expect(hardSpaces('i/lub tak')).toBe('i/lub tak');
    expect(hardSpaces('litera a. Potem')).toBe('litera a. Potem');
    expect(hardSpaces('tak, a, b')).toBe('tak, a, b');
  });

  it('nie wiąże sieroty na końcu tekstu ani przez nową linię, tabulator, kilka spacji', () => {
    expect(hardSpaces('dom i')).toBe('dom i');
    expect(hardSpaces('dom i ')).toBe('dom i ');
    expect(hardSpaces('dom i\ndalej')).toBe('dom i\ndalej');
    expect(hardSpaces('dom i\tdalej')).toBe('dom i\tdalej');
    expect(hardSpaces('i  dalej')).toBe('i  dalej');
  });

  it('nie rusza istniejących twardych spacji ani encji &nbsp;', () => {
    expect(hardSpaces(nb('i~w domu'))).toBe(nb('i~w~domu'));
    expect(hardSpaces('i&nbsp;w')).toBe('i&nbsp;w');
    const nnbsp = String.fromCharCode(0x202f);
    expect(hardSpaces(`i${nnbsp}w`)).toBe(`i${nnbsp}w`);
  });

  it('nie zmienia adresów URL ani e-maili', () => {
    const url = 'https://example.com/a/i/w?z=1&a=2#o';
    expect(hardSpaces(`patrz ${url} teraz`)).toBe(`patrz ${url} teraz`);
    expect(hs(`patrz ${url} teraz`)).toBe(`patrz ${url} teraz`);
    expect(hardSpaces('pisz: a@w.pl lub i.z@o.pl')).toBe(nb('pisz: a@w.pl lub~i.z@o.pl'));
    expect(hardSpaces('www.w.pl i https://a.pl/z w')).toBe(nb('www.w.pl i~https://a.pl/z w'));
  });

  it('domyślnie nie stosuje żadnych reguł poza listą słów', () => {
    const s = 'Ok. 50 kW, art. 5, J. Kowalski, 17 maja 2026 r. — koniec';
    expect(hardSpaces(s)).toBe(s);
  });

  it('extraWords dokłada słowa (bez względu na wielkość liter)', () => {
    expect(hardSpaces('wtem coś się stało', { extraWords: ['coś', 'Wtem'] })).toBe(nb('wtem~coś~się~stało'));
  });

  it('zachowuje pusty tekst', () => {
    expect(hardSpaces('')).toBe('');
  });
});

describe('hardSpaces — lang', () => {
  it('angielski domyślnie bez zmian', () => {
    const s = 'Sign in with a portal — 50 kW, J. Smith, 1 000 users';
    expect(hardSpaces(s, { lang: 'en' })).toBe(s);
  });

  it('angielski: extraWords i reguły niezależne od języka działają, polskie nie', () => {
    expect(hardSpaces('a cat in a box', { lang: 'en', extraWords: ['a', 'an', 'the'] })).toBe(
      nb('a~cat in a~box'),
    );
    expect(hardSpaces('A 50 kW unit by J. K. Rowling — ok. 5 maja, art. 5', { ...ALL, lang: 'en' })).toBe(
      nb('A 50~kW unit by J.~K.~Rowling~— ok. 5 maja, art. 5'),
    );
  });
});

describe('reguła units', () => {
  const u = (s: string): string => hardSpaces(s, { rules: { units: true } });

  it('wiąże liczbę z jednostką', () => {
    expect(u('moc 50 kW i 190 L')).toBe(nb('moc 50~kW i~190~L'));
    expect(u('kosztuje 1299,99 zł.')).toBe(nb('kosztuje 1299,99~zł.'));
    expect(u('rabat 15 %')).toBe(nb('rabat 15~%'));
    expect(u('2 × 113 kW')).toBe(nb('2~× 113~kW'));
    expect(u('20 °C, 3 m²')).toBe(nb('20~°C, 3~m²'));
    expect(u('(10 kg)')).toBe(nb('(10~kg)'));
    expect(u('5 tys. zł i 3 mln zł')).toBe(nb('5~tys. zł i~3~mln zł'));
    expect(u('5 kWh')).toBe(nb('5~kWh'));
  });

  it('wiąże grupy tysięcy', () => {
    expect(u('8 000 zł')).toBe(nb('8~000~zł'));
    expect(u('1 234 567,89 PLN')).toBe(nb('1~234~567,89~PLN'));
  });

  it('nie wiąże liczby ze zwykłym wyrazem ani z wydłużoną jednostką', () => {
    expect(u('mam 5 kotów')).toBe('mam 5 kotów');
    expect(u('5 kWa')).toBe('5 kWa');
    expect(u('w latach 1990 2000')).toBe(nb('w~latach 1990 2000'));
  });
});

describe('reguła abbreviations', () => {
  const a = (s: string): string => hardSpaces(s, { rules: { abbreviations: true } });

  it('wiąże skrót z następnym wyrazem', () => {
    expect(a('ul. Długa 5')).toBe(nb('ul.~Długa 5'));
    expect(a('faktura nr 12')).toBe(nb('faktura nr~12'));
    expect(a('Np. tak, tj. tak, tzw. coś')).toBe(nb('Np.~tak, tj.~tak, tzw.~coś'));
    expect(a('dr Nowak i prof. Wiśniewski')).toBe(nb('dr~Nowak i~prof.~Wiśniewski'));
    expect(a('ok. 5 min')).toBe(nb('ok.~5 min'));
  });

  it('wiąże rok z „r.” i wiek z „w.”', () => {
    expect(a('w 2026 r. firma')).toBe(nb('w~2026~r. firma'));
    expect(a('XIX w. i XX w.')).toBe(nb('XIX~w. i~XX~w.'));
  });
});

describe('reguła legal', () => {
  it('wiąże oznaczenie przepisu z numerem', () => {
    expect(hardSpaces('art. 112 ust. 1 pkt 3 lit. a § 5', { rules: { legal: true } })).toBe(
      nb('art.~112 ust.~1 pkt~3 lit.~a~§~5'),
    );
    expect(hardSpaces('Art. 5', { rules: { legal: true } })).toBe(nb('Art.~5'));
  });
});

describe('reguły initials i dates', () => {
  it('wiąże inicjały z nazwiskiem', () => {
    const i = (s: string): string => hardSpaces(s, { rules: { initials: true } });
    expect(i('J. Kowalski')).toBe(nb('J.~Kowalski'));
    expect(i('J.R.R. Tolkien')).toBe(nb('J.R.R.~Tolkien'));
    expect(i('Ł. Żak')).toBe(nb('Ł.~Żak'));
  });

  it('wiąże dzień z nazwą miesiąca', () => {
    const d = (s: string): string => hardSpaces(s, { rules: { dates: true } });
    expect(d('17 października 2026')).toBe(nb('17~października 2026'));
    expect(d('od 3 stycznia')).toBe(nb('od~3~stycznia'));
    expect(d('1 Maja')).toBe(nb('1~Maja'));
    expect(d('123 maja')).toBe('123 maja');
  });
});

describe('reguła dashes', () => {
  const d = (s: string): string => hardSpaces(s, { rules: { dashes: true } });

  it('wiąże spacjowaną pauzę i półpauzę z poprzednim wyrazem', () => {
    expect(d('Firma — i tyle wszystkiego')).toBe(nb('Firma~— i~tyle wszystkiego'));
    expect(d('2020 – 2026')).toBe(nb('2020~– 2026'));
  });

  it('nie rusza dywizu ani pauzy bez spacji', () => {
    expect(d('biało-czerwony')).toBe('biało-czerwony');
    expect(d('słowo—słowo')).toBe('słowo—słowo');
    expect(d('x - y')).toBe('x - y');
  });
});

describe('idempotencja', () => {
  const samples = [
    'W domu i w pracy, a także z nami — 5 kW i 2026 r. o godz. 12',
    'Firma Demo Sp. z o.o., ul. Długa 5, nr 12, J. Kowalski, 17 października 2026 r., 8 000 zł',
    'art. 112 ust. 1 § 3, patrz https://a.pl/i/w lub a@w.pl',
  ];
  it.each(samples.map((s) => [s]))('%s', (s) => {
    for (const f of [hardSpaces, hs, (x: string) => typeset(x), (x: string) => typeset(x, 'en')]) {
      const once = f(s);
      expect(f(once)).toBe(once);
    }
  });
});

describe('typeset', () => {
  it('po polsku = sieroty + pauza', () => {
    expect(typeset('Sprzedaż i fakturowanie', 'pl')).toBe(nb('Sprzedaż i~fakturowanie'));
    expect(typeset('Firma — i to')).toBe(nb('Firma~— i~to'));
    expect(typeset('50 kW')).toBe('50 kW');
  });

  it('po angielsku bez zmian', () => {
    expect(typeset('Sign in with a portal — now', 'en')).toBe('Sign in with a portal — now');
  });

  it('przyjmuje te same opcje co hardSpaces', () => {
    expect(typeset('50 kW i nr 5', 'pl', { rules: { units: true, abbreviations: true } })).toBe(
      nb('50~kW i~nr~5'),
    );
    expect(typeset('x — y', 'pl', { rules: { dashes: false } })).toBe('x — y');
  });

  it('nie zmienia cudzysłowów', () => {
    expect(typeset('"cytat" i „cytat”')).toBe(nb('"cytat" i~„cytat”'));
  });
});

describe('hardSpacesDeep', () => {
  it('przechodzi rekurencyjnie po napisach, nie rusza kluczy ani innych typów', () => {
    const input = {
      'i w': 'i w domu',
      n: 5,
      b: true,
      z: null,
      u: undefined,
      list: ['a b', { deep: 'o tym' }, 7],
    };
    expect(hardSpacesDeep(input)).toEqual({
      'i w': nb('i~w~domu'),
      n: 5,
      b: true,
      z: null,
      u: undefined,
      list: [nb('a~b'), { deep: nb('o~tym') }, 7],
    });
    expect(input.list[0]).toBe('a b');
  });

  it('przekazuje opcje i działa na samym napisie', () => {
    expect(hardSpacesDeep('50 kW', { rules: { units: true } })).toBe(nb('50~kW'));
    expect(hardSpacesDeep(['a b'], { lang: 'en' })).toEqual(['a b']);
  });
});

describe('findOrphans / ORPHAN_RE', () => {
  it('wykrywa niezwiązane sieroty', () => {
    expect(findOrphans('I w domu, a potem z nami')).toEqual(['I', 'w', 'a', 'z']);
    expect(findOrphans(hardSpaces('I w domu, a potem z nami'))).toEqual([]);
    expect(findOrphans('(i tak) „w dom”')).toEqual(['i', 'w']);
    expect(findOrphans('ala ma kota i')).toEqual([]);
  });

  it('bierze pod uwagę extraWords i lang', () => {
    expect(findOrphans('jak to', { extraWords: ['jak'] })).toEqual(['jak']);
    expect(findOrphans('a cat', { lang: 'en' })).toEqual([]);
  });

  it('ORPHAN_RE wykrywa słowo z ORPHANS_PL przed zwykłą spacją', () => {
    expect(ORPHAN_RE.test('dom i ogród')).toBe(true);
    expect(ORPHAN_RE.test('W domu')).toBe(true);
    expect(ORPHAN_RE.test(hardSpaces('dom i ogród'))).toBe(false);
    expect(ORPHAN_RE.test('ala ma kota')).toBe(false);
    expect(ORPHAN_RE.flags).not.toContain('g');
  });
});
