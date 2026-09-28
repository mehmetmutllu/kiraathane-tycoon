/**
 * i18n.test.ts — İKİ DİL BEKÇİSİ (2026-09-28, kullanıcı: "ingilizce şart").
 * (a) koddaki her `t('…')` literal'inin İngilizcesi sözlükte var, `{n}` yer tutucuları iki dilde aynı;
 * (b) ekrana basılan AYAR VERİSİ (görev/pad/hedef/kozmetik adları, öğretici satırları) sözlükte var;
 * (c) arayüzde `t()` dışında kalmış JSX metni yok.
 * Tarayıcıdaki üçüncü göz: `tools/smoke-en.mjs` (duman) — İngilizce kipte ekranda Türkçe kalmıyor.
 */
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { en } from '../src/i18n/en';
import { dilAyarla, t } from '../src/i18n';
import { economyConfig } from '../src/config/economy.config';
import { ONBOARDING } from '../src/config/onboarding';

const DEV = /[\\/](dev[A-Z]\w*|DevSandbox|FurniturePrototype)\.tsx?$|\.d\.ts$/;
const dosyalar = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((g) => {
    const p = path.join(d, g.name);
    return g.isDirectory() ? dosyalar(p) : /\.tsx?$/.test(g.name) && !DEV.test(p) ? [p] : [];
  });
const agac = (f: string) =>
  ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const tutucular = (s: string) => [...s.matchAll(/\{(\d+|N)\}/g)].map((m) => m[1]).sort().join(',');

function tLiteralleri(): { metin: string; yer: string }[] {
  const out: { metin: string; yer: string }[] = [];
  for (const f of dosyalar('src')) {
    const sf = agac(f);
    const gez = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ['t', 'ceviri'].includes(n.expression.text)) {
        const a = n.arguments[0];
        if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)))
          out.push({ metin: a.text, yer: `${path.relative('.', f)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}` });
      }
      ts.forEachChild(n, gez);
    };
    gez(sf);
  }
  return out;
}

/** Ayar nesnesinde ekrana giden metin alanları (yalnız Türkçe metin — kimlikler elenir). */
const METIN_ALANI = new Set(['label', 'title', 'kicker', 'note', 'name']);
function ayarMetinleri(o: unknown, yol = '', out: { metin: string; yer: string }[] = []) {
  if (Array.isArray(o)) o.forEach((x, i) => ayarMetinleri(x, `${yol}[${i}]`, out));
  else if (o && typeof o === 'object')
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && METIN_ALANI.has(k) && /[A-ZÇĞİÖŞÜ ]/.test(v)) out.push({ metin: v, yer: `${yol}.${k}` });
      else ayarMetinleri(v, `${yol}.${k}`, out);
    }
  return out;
}

describe('i18n: iki dil', () => {
  it('(a) her t() literal\'inin İngilizcesi var ve yer tutucuları aynı', () => {
    const lit = tLiteralleri();
    expect(lit.length).toBeGreaterThan(200);
    const eksik = lit.filter((l) => !(l.metin in en)).map((l) => `${l.yer}  ${l.metin}`);
    expect(eksik).toEqual([]);
    const bozuk = lit.filter((l) => l.metin in en && tutucular(l.metin) !== tutucular(en[l.metin])).map((l) => l.metin);
    expect(bozuk).toEqual([]);
  });

  it('(b) ekrana basılan ayar verisi sözlükte', () => {
    const veri = [
      ...ayarMetinleri(economyConfig, 'economyConfig'),
      ...economyConfig.iap.diamondPackLabels.map((m, i) => ({ metin: m, yer: `diamondPackLabels[${i}]` })),
      ...Object.entries(ONBOARDING.metin).map(([k, m]) => ({ metin: m, yer: `ONBOARDING.metin.${k}` })),
    ];
    expect(veri.length).toBeGreaterThan(150);
    expect(veri.filter((v) => !(v.metin in en)).map((v) => `${v.yer}  ${v.metin}`)).toEqual([]);
  });

  it('(c) arayüzde t() dışında JSX metni yok', () => {
    const IZINLI = new Set(['v', '×', '+', '/', '·', '—', '−']);
    const acik: string[] = [];
    for (const f of dosyalar(path.join('src', 'components', 'ui'))) {
      const sf = agac(f);
      const gez = (n: ts.Node) => {
        if (ts.isJsxText(n)) {
          const s = n.text.replace(/\s+/g, ' ').trim();
          if (/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s) && !IZINLI.has(s))
            acik.push(`${path.relative('.', f)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}  ${s}`);
        }
        ts.forEachChild(n, gez);
      };
      gez(sf);
    }
    expect(acik).toEqual([]);
  });

  it('t(): Türkçede aynen, İngilizcede sözlükten, {n} dolar; eksikte Türkçe kalır', () => {
    try {
      dilAyarla('en');
      expect(t('{1} eksik', 5)).toBe('5 short');
      expect(t('Masa')).toBe(en['Masa']);
      expect(t('sözlükte olmayan')).toBe('sözlükte olmayan');
      dilAyarla('tr');
      expect(t('{1} eksik', 5)).toBe('5 eksik');
    } finally {
      dilAyarla('tr');
    }
  });
});
