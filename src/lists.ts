/**
 * Listy słów. Wszystkie zamrożone i małymi literami (porównanie bez względu na
 * wielkość liter), z wyjątkiem `UNITS`, gdzie wielkość liter ma znaczenie
 * (`W` to wat, `MB` to megabajt).
 */

/**
 * Domyślne sieroty: jednoliterowe spójniki i przyimki oraz krótkie spójniki,
 * przyimki i partykuły, które nie powinny zostawać na końcu wiersza.
 */
export const ORPHANS_PL: readonly string[] = Object.freeze([
  'a', 'i', 'o', 'u', 'w', 'z',
  'że', 'ale',
  'na', 'do', 'od', 'po', 'za', 'ze', 'we',
  'lub', 'oraz', 'czy', 'nie', 'bez', 'dla', 'ku', 'by',
  'pod', 'nad', 'przy', 'przez', 'albo', 'to', 'co', 'jak',
  'się', 'ani', 'są', 'jest', 'aby', 'już', 'też', 'tam', 'tu', 'aż', 'bo', 'no', 'niż', 'gdy',
  'iż',
]);

/**
 * Skróty wiązane z następnym wyrazem domyślnie (`lang: 'pl'`, bez reguł),
 * obok `ORPHANS_PL`. Podzbiór `ABBREVIATIONS_PL` — dopasowanie jak w regule
 * `abbreviations`: bez względu na wielkość liter, forma dokładna („np” bez
 * kropki nie jest skrótem).
 */
export const DEFAULT_ABBREVIATIONS_PL: readonly string[] = Object.freeze(['nr', 'np.', 'ok.']);

/**
 * Jednostki i mnożniki wiązane z poprzedzającą liczbą (reguła `units`).
 * Wielkość liter ma znaczenie. Kropka końcowa zdania jest dopuszczalna
 * („5 kg.”), więc skróty z kropką występują tu z nią („tys.”, „szt.”).
 */
export const UNITS: readonly string[] = Object.freeze([
  // waluty i procenty
  'zł', 'gr', 'PLN', 'EUR', 'USD', 'GBP', 'CHF', '€', '$', '%', '‰',
  // mnożniki liczebników
  'tys.', 'mln', 'mld', 'bln',
  // sztuki i krotności
  'szt.', 'kpl.', 'op.', 'os.', '×', 'x',
  // długość, powierzchnia, objętość
  'mm', 'cm', 'dm', 'm', 'km', 'm²', 'm³', 'm2', 'm3', 'cm²', 'km²', 'ha', 'ar',
  'ml', 'l', 'L', 'hl',
  // masa
  'mg', 'g', 'dag', 'kg', 't',
  // czas
  'ms', 's', 'min', 'h', 'godz.',
  // temperatura, kąt
  '°C', '°F', 'K', '°',
  // elektryczność i energia
  'mW', 'W', 'kW', 'MW', 'GW', 'Wh', 'kWh', 'MWh', 'GWh', 'V', 'kV', 'mA', 'Ah', 'mAh',
  'Hz', 'kHz', 'MHz', 'GHz', 'kVA', 'kWp', 'KM',
  // informatyka
  'B', 'kB', 'KB', 'MB', 'GB', 'TB', 'Mb/s', 'Gb/s', 'px', 'pt', 'dpi',
  // ciśnienie, prędkość
  'Pa', 'hPa', 'kPa', 'MPa', 'bar', 'km/h', 'm/s',
]);

/**
 * Skróty, po których nie łamie się wiersza (reguła `abbreviations`).
 * Osobno — wiązane wstecz z liczbą — „r.” (rok) i „w.” (wiek).
 */
export const ABBREVIATIONS_PL: readonly string[] = Object.freeze([
  'nr', 'np.', 'tj.', 'tzw.', 'tzn.', 'ok.', 'm.in.', 'jw.', 'zob.', 'por.', 'wg',
  'ul.', 'al.', 'pl.', 'os.', 'św.', 'im.',
  'p.', 'pan', 'pani', 'dr', 'prof.', 'mgr', 'inż.', 'hab.', 'doc.', 'ks.', 'gen.', 'płk',
  's.', 'str.', 'godz.', 'tel.', 'kom.', 'faks', 'woj.', 'pow.', 'gm.',
]);

/** Oznaczenia jednostek redakcyjnych przepisów (reguła `legal`). */
export const LEGAL_PL: readonly string[] = Object.freeze([
  'art.', '§', 'ust.', 'pkt', 'lit.', 'tiret', 'zd.', 'par.', 'poz.', 'rozdz.', 'dz.', 'cz.',
  'zał.', 'dz.u.', 'dz. u.', 'sygn.',
]);

/** Miesiące w dopełniaczu (reguła `dates`: „17 października”). */
export const MONTHS_PL: readonly string[] = Object.freeze([
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]);
