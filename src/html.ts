import { bindText, compile, type HardSpacesOptions } from './core.js';

/** Elementy, których treść jest dosłowna albo nie jest prozą. */
const RAW = new Set(['script', 'style', 'pre', 'code', 'textarea', 'kbd', 'samp', 'template']);

/**
 * Znacznik, komentarz, deklaracja lub instrukcja przetwarzania. Wartości
 * atrybutów w cudzysłowach mogą zawierać `>`.
 */
const MARKUP = /<!--[\s\S]*?-->|<![^>]*>|<\?[\s\S]*?\?>|<\/?([a-zA-Z][\w:-]*)(?:[^>"']|"[^"]*"|'[^']*')*>/g;

/**
 * `hardSpaces` dla fragmentu HTML: zmienia wyłącznie węzły tekstowe. Nie
 * rusza znaczników, atrybutów, komentarzy, encji ani treści
 * script/style/pre/code/textarea/kbd/samp/template. Encje `&nbsp;`, `&#160;`,
 * `&#xA0;` liczą się jako twarda spacja. Wstawia znak U+00A0 (nie encję).
 * Nie wiąże ponad znacznikami: w `<b>i</b> domu` spacja zostaje.
 */
export function hardSpacesHtml(html: string, opts?: HardSpacesOptions): string {
  const c = compile(opts);
  let out = '';
  let pos = 0;
  MARKUP.lastIndex = 0;
  for (let m = MARKUP.exec(html); m !== null; m = MARKUP.exec(html)) {
    out += bindText(html.slice(pos, m.index), c, true) + m[0];
    pos = m.index + m[0].length;
    const name = m[1]?.toLowerCase();
    if (name !== undefined && RAW.has(name) && !m[0].startsWith('</') && !m[0].endsWith('/>')) {
      const close = new RegExp(`</${name}\\s*>`, 'ig');
      close.lastIndex = pos;
      const end = close.exec(html);
      const stop = end === null ? html.length : end.index + end[0].length;
      out += html.slice(pos, stop);
      pos = stop;
      MARKUP.lastIndex = stop;
    }
  }
  return out + bindText(html.slice(pos), c, true);
}
