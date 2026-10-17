import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = new URL('.', import.meta.url).pathname;
const sources = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

describe('źródła', () => {
  it.each(sources.map((f) => [f]))('%s: bez lookbehind (Safari < 16.4) i bez literalnej U+00A0', (f) => {
    const text = readFileSync(join(dir, f), 'utf8');
    expect(text).not.toMatch(/\(\?<[=!]/);
    expect(text).not.toContain(String.fromCharCode(0xa0));
  });
});
