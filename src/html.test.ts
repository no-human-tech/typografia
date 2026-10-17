import { describe, expect, it } from 'vitest';
import { NBSP, hardSpaces, hardSpacesHtml } from './index.js';

const nb = (s: string): string => s.replaceAll('~', NBSP);

describe('hardSpacesHtml', () => {
  it('na samym tekście działa jak hardSpaces', () => {
    expect(hardSpacesHtml('i w domu')).toBe(hardSpaces('i w domu'));
  });

  it('zmienia tylko węzły tekstowe, nie atrybuty', () => {
    expect(hardSpacesHtml('<p class="a b" title="i w domu">Dom i w ogrodzie</p>')).toBe(
      nb('<p class="a b" title="i w domu">Dom i~w~ogrodzie</p>'),
    );
    expect(hardSpacesHtml('<a href="https://x.pl/?a b">a b</a>')).toBe(nb('<a href="https://x.pl/?a b">a~b</a>'));
  });

  it('obsługuje > wewnątrz wartości atrybutu', () => {
    expect(hardSpacesHtml(`<p data-x="a > b" data-y='w > z'>w domu</p>`)).toBe(
      nb(`<p data-x="a > b" data-y='w > z'>w~domu</p>`),
    );
  });

  it('nie rusza komentarzy, doctype ani script/style/pre/code/textarea/kbd/samp', () => {
    const raw = [
      '<!DOCTYPE html>',
      '<!-- i w domu -->',
      '<script>const a = "i w domu"; if (a < b) {}</script>',
      '<style>a b { color: red }</style>',
      '<pre>i w <b>domu</b> a b</pre>',
      '<code class="x">a b</code>',
      '<textarea>i w</textarea>',
      '<kbd>w z</kbd>',
      '<SAMP>a b</SAMP>',
    ].join('');
    expect(hardSpacesHtml(raw)).toBe(raw);
    expect(hardSpacesHtml(`${raw}<p>i w</p>`)).toBe(`${raw}${nb('<p>i~w</p>')}`);
  });

  it('niezamknięty element surowy chroni resztę dokumentu', () => {
    expect(hardSpacesHtml('<pre>i w domu')).toBe('<pre>i w domu');
  });

  it('nie rusza encji; &nbsp;, &#160;, &#xA0; traktuje jak twardą spację', () => {
    expect(hardSpacesHtml('i&nbsp;w domu')).toBe(nb('i&nbsp;w~domu'));
    expect(hardSpacesHtml('i&#160;w&#xA0;z domu')).toBe(nb('i&#160;w&#xA0;z~domu'));
    expect(hardSpacesHtml('Tom &amp; i Jerry')).toBe(nb('Tom &amp; i~Jerry'));
    expect(hardSpacesHtml('&bdquo;i co&rdquo; &quot;a b&quot;')).toBe(nb('&bdquo;i~co&rdquo; &quot;a~b&quot;'));
  });

  it('zostawia gołe < w tekście', () => {
    expect(hardSpacesHtml('x < y i z')).toBe(nb('x < y i~z'));
  });

  it('przekazuje opcje', () => {
    expect(hardSpacesHtml('<p>Tak — w domu, 50 kW</p>', { rules: { dashes: true, units: true } })).toBe(
      nb('<p>Tak~— w~domu, 50~kW</p>'),
    );
    expect(hardSpacesHtml('<p>a cat</p>', { lang: 'en' })).toBe('<p>a cat</p>');
  });

  it('jest idempotentna', () => {
    const html = '<p title="a b">W domu i w pracy, 5 kW — <em>a</em> nie</p><code>a b</code>';
    const opts = { rules: { units: true, dashes: true } };
    const once = hardSpacesHtml(html, opts);
    expect(hardSpacesHtml(once, opts)).toBe(once);
  });

  it('nie wiąże ponad znacznikami (ograniczenie opisane w README)', () => {
    expect(hardSpacesHtml('<b>i</b> domu')).toBe('<b>i</b> domu');
  });
});
