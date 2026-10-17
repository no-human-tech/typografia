import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Paczka jest publiczna i nie opisuje, kto jej używa. Lista nazw, których nie
 * może być w repozytorium, przychodzi ze zmiennej środowiska (w CI: zmienna
 * projektu) — trzymana w repozytorium sama byłaby takim opisem.
 */
const forbidden = (process.env.ZAKAZANE_NAZWY ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const root = new URL('..', import.meta.url).pathname;
const src = readdirSync(join(root, 'src')).map((f) => join('src', f));
const files = ['README.md', 'package.json', '.gitlab-ci.yml', 'LICENSE', 'eslint.config.js', ...src];

describe.skipIf(forbidden.length === 0)('neutralność', () => {
  it.each(files.map((f) => [f]))('%s: bez nazw z ZAKAZANE_NAZWY', (f) => {
    const text = readFileSync(join(root, f), 'utf8').toLowerCase();
    expect(forbidden.filter((name) => text.includes(name))).toEqual([]);
  });
});

describe.runIf(process.env.CI)('neutralność w CI', () => {
  it('lista ZAKAZANE_NAZWY jest ustawiona (inaczej test powyżej by się pominął)', () => {
    expect(forbidden.length).toBeGreaterThan(0);
  });
});
