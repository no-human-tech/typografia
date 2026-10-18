import { ABBREVIATIONS_PL, DEFAULT_ABBREVIATIONS_PL, LEGAL_PL, MONTHS_PL, ORPHANS_PL, UNITS } from './lists.js';

/** Twarda spacja U+00A0. Zawsze jako escape — literal jest niewidoczny w diffie. */
export const NBSP = '\u00A0';

export type Lang = 'pl' | 'en';

/** Reguły dodatkowe. Wszystkie domyślnie wyłączone. */
export interface HardSpacesRules {
  /** Liczba + jednostka („50 kW”, „15 %”, „5 tys. zł”) i grupy tysięcy („8 000 zł”). Każdy język. */
  units?: boolean;
  /** Przepisy: „art. 5”, „§ 3”, „ust. 2”, „pkt 1”, „lit. a”. Tylko `pl`. */
  legal?: boolean;
  /** Wszystkie skróty z `ABBREVIATIONS_PL` (domyślnie tylko `DEFAULT_ABBREVIATIONS_PL`): „np. tak”, „nr 5”, „ul. Długa”, „dr Nowak” oraz „2026 r.”, „XIX w.”. Tylko `pl`. */
  abbreviations?: boolean;
  /** Inicjały: „J. Kowalski”, „J.R.R. Tolkien”. Każdy język. */
  initials?: boolean;
  /** Dzień + miesiąc: „17 października”. Tylko `pl`. */
  dates?: boolean;
  /** Spacjowana pauza/półpauza nie zaczyna wiersza: „tekst — dalej”. Każdy język. */
  dashes?: boolean;
}

export interface HardSpacesOptions {
  /** `pl` (domyślnie) — `ORPHANS_PL` i `DEFAULT_ABBREVIATIONS_PL`; `en` — bez list (tylko `extraWords`) i bez reguł polskich. */
  lang?: Lang;
  /** Słowa dokładane do listy sierot (porównanie bez względu na wielkość liter). */
  extraWords?: readonly string[];
  rules?: HardSpacesRules;
}

interface Compiled {
  pl: boolean;
  words: ReadonlySet<string>;
  /** Skróty wiązane z następnym wyrazem: domyślne, wszystkie (reguła `abbreviations`) albo żadne (`en`). */
  abbreviations: ReadonlySet<string>;
  rules: Required<HardSpacesRules>;
}

const lower = (list: readonly string[]): ReadonlySet<string> => new Set(list.map((w) => w.toLowerCase()));

const ORPHANS_SET = lower(ORPHANS_PL);
const EMPTY_SET: ReadonlySet<string> = new Set();
const UNITS_SET: ReadonlySet<string> = new Set(UNITS);
const ABBREVIATIONS_SET = lower(ABBREVIATIONS_PL);
const DEFAULT_ABBREVIATIONS_SET = lower(DEFAULT_ABBREVIATIONS_PL);
const LEGAL_SET = lower(LEGAL_PL);
const MONTHS_SET = lower(MONTHS_PL);

export function compile(opts: HardSpacesOptions | undefined): Compiled {
  const pl = (opts?.lang ?? 'pl') === 'pl';
  const base = pl ? ORPHANS_SET : EMPTY_SET;
  const extra = opts?.extraWords ?? [];
  const words = extra.length === 0 ? base : new Set([...base, ...extra.map((w) => w.toLowerCase())]);
  const r = opts?.rules ?? {};
  const abbreviations = !pl ? EMPTY_SET : (r.abbreviations ?? false) ? ABBREVIATIONS_SET : DEFAULT_ABBREVIATIONS_SET;
  return {
    pl,
    words,
    abbreviations,
    rules: {
      units: r.units ?? false,
      legal: r.legal ?? false,
      abbreviations: r.abbreviations ?? false,
      initials: r.initials ?? false,
      dates: r.dates ?? false,
      dashes: r.dashes ?? false,
    },
  };
}

/*
 * Celowo BEZ lookbehind: rzuca przy parsowaniu modułu na Safari
 * < 16.4 i kładzie cały bundel. Podział po białych znakach nie ma tego problemu
 * ani błędu nakładających się dopasowań przy „u i w”.
 */

/** Separatory: dowolny ciąg białych znaków (NBSP też jest `\s`). */
const PLAIN_SEP = /(\s+)/;
/** W HTML także encje twardej spacji. */
const HTML_SEP = /((?:\s|&nbsp;|&#0*160;|&#x0*a0;)+)/i;

/** Interpunkcja otwierająca, którą wyraz może mieć przed sobą. */
const LEAD = /^[(„"'»«“‘[{–—-]+/;
const LEAD_HTML = /^(?:[(„"'»«“‘[{–—-]|&[a-zA-Z]+;|&#\d+;|&#x[\da-fA-F]+;)+/;
/** Interpunkcja zamykająca po wyrazie (bez kropki — ta bywa częścią skrótu). */
const TRAIL = /[,;:!?)\]}»«”“"'’…]+$/;

const DASHES: ReadonlySet<string> = new Set(['—', '–', '&mdash;', '&ndash;', '&#8212;', '&#8211;']);
const INITIALS = /^(?:\p{Lu}\.)+$/u;
const ENDS_WITH_DIGIT = /\d$/;
const DIGIT_GROUP_HEAD = /^\d{1,3}$/;
const DIGIT_GROUP_TAIL = /^\d{3}(?:[.,]\d+)?$/;
const NUMBER_OR_ROMAN = /^(?:\d+|[IVXLCDM]+)$/;
const DAY = /^\d{1,2}$/;

function stripDot(s: string): string {
  return s.endsWith('.') ? s.slice(0, -1) : s;
}

function bindsForward(word: string, c: Compiled): boolean {
  const w = word.toLowerCase();
  if (c.words.has(w)) return true;
  if (c.abbreviations.has(w)) return true;
  if (c.pl && c.rules.legal && LEGAL_SET.has(w)) return true;
  return c.rules.initials && INITIALS.test(word);
}

function bindsBackward(word: string, nextRaw: string, c: Compiled): boolean {
  if (c.rules.dashes && DASHES.has(nextRaw)) return true;
  const next = nextRaw.replace(TRAIL, '');
  if (c.rules.units && ENDS_WITH_DIGIT.test(word)) {
    if (UNITS_SET.has(next) || UNITS_SET.has(stripDot(next))) return true;
    // Kropka zamykająca zdanie za nawiasem lub cudzysłowem: „kW).”, „kW”.”, „tys.).”.
    const inner = stripDot(next).replace(TRAIL, '');
    if (inner !== next && (UNITS_SET.has(inner) || UNITS_SET.has(stripDot(inner)))) return true;
    if (DIGIT_GROUP_HEAD.test(word) && DIGIT_GROUP_TAIL.test(stripDot(next))) return true;
  }
  if (!c.pl) return false;
  if (c.rules.abbreviations && NUMBER_OR_ROMAN.test(word) && (next === 'r.' || next === 'w.')) return true;
  return c.rules.dates && DAY.test(word) && MONTHS_SET.has(stripDot(next).toLowerCase());
}

/**
 * Zamienia na twardą tylko POJEDYNCZĄ zwykłą spację między dwoma wyrazami.
 * Istniejące twarde spacje, encje, nowe linie i wielokrotne spacje zostają —
 * stąd idempotencja.
 */
export function bindText(text: string, c: Compiled, html: boolean): string {
  const parts = text.split(html ? HTML_SEP : PLAIN_SEP);
  const lead = html ? LEAD_HTML : LEAD;
  for (let i = 1; i < parts.length - 1; i += 2) {
    if (parts[i] !== ' ') continue;
    const prev = (parts[i - 1] ?? '').replace(lead, '');
    const next = parts[i + 1] ?? '';
    if (prev === '' || next === '') continue;
    if (bindsForward(prev, c) || bindsBackward(prev, next, c)) parts[i] = NBSP;
  }
  return parts.join('');
}

/** Wyrazy z listy sierot lub skróty domyślne, po których stoi zwykła spacja i dalszy tekst. */
export function orphansIn(text: string, c: Compiled): string[] {
  const parts = text.split(PLAIN_SEP);
  const found: string[] = [];
  for (let i = 1; i < parts.length - 1; i += 2) {
    if (parts[i] !== ' ' || (parts[i + 1] ?? '') === '') continue;
    const prev = (parts[i - 1] ?? '').replace(LEAD, '');
    const w = prev.toLowerCase();
    if (prev !== '' && (c.words.has(w) || (c.pl && DEFAULT_ABBREVIATIONS_SET.has(w)))) found.push(prev);
  }
  return found;
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Wykrywa słowo z `ORPHANS_PL` lub `DEFAULT_ABBREVIATIONS_PL` przed zwykłą spacją (do testów E2E). Bez
 * lookbehind i bez flagi `g` (bezpieczne w `test()` wielokrotnie).
 */
export const ORPHAN_RE = new RegExp(
  `(?:^|[\\s(„"'»«“‘[{–—-])(?:${[...ORPHANS_PL, ...DEFAULT_ABBREVIATIONS_PL].sort((a, b) => b.length - a.length).map(escapeRe).join('|')}) (?=\\S)`,
  'iu',
);
