import { bindText, compile, orphansIn, type HardSpacesOptions, type Lang } from './core.js';

export { NBSP, ORPHAN_RE } from './core.js';
export type { HardSpacesOptions, HardSpacesRules, Lang } from './core.js';
export { ABBREVIATIONS_PL, DEFAULT_ABBREVIATIONS_PL, LEGAL_PL, MONTHS_PL, ORPHANS_PL, UNITS } from './lists.js';
export { hardSpacesHtml } from './html.js';

/**
 * Twarde spacje w tekście. Domyślnie (`lang: 'pl'`, bez reguł) wiąże tylko
 * słowa z `ORPHANS_PL` i skróty z `DEFAULT_ABBREVIATIONS_PL` (nr, np., ok.)
 * z następnym wyrazem. Idempotentna.
 */
export function hardSpaces(text: string, opts?: HardSpacesOptions): string {
  return bindText(text, compile(opts), false);
}

/**
 * Skład tekstu w danym języku: po polsku `hardSpaces` z regułą `dashes`,
 * po angielsku bez zmian (o ile `opts` nie włączy reguł albo `extraWords`).
 */
export function typeset(text: string, lang: Lang = 'pl', opts?: HardSpacesOptions): string {
  return hardSpaces(text, { ...opts, lang, rules: { dashes: lang === 'pl', ...opts?.rules } });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false;
  const proto: unknown = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/**
 * `hardSpaces` dla każdego napisu w tablicach i zwykłych obiektach (np. JSON
 * treści, słowniki i18n). Klucze, liczby, daty i instancje klas bez zmian;
 * zwraca nową strukturę, wejścia nie modyfikuje.
 */
export function hardSpacesDeep<T>(value: T, opts?: HardSpacesOptions): T {
  const c = compile(opts);
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return bindText(v, c, false);
    if (Array.isArray(v)) return v.map(walk);
    if (isPlainObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}

/** Niezwiązane sieroty (słowa z listy przed zwykłą spacją) — do testów i lintów treści. */
export function findOrphans(text: string, opts?: Pick<HardSpacesOptions, 'lang' | 'extraWords'>): string[] {
  return orphansIn(text, compile(opts));
}
