/**
 * marka-adi.test.ts — "kıraathane" oyuncunun gördüğü HİÇBİR yerde yazmaz (kullanıcı kararı 2026-09-28:
 * ad her yerde "Tea House Tycoon"). Yorumlar ve ASCII kimlikler (`kiraathane_…` ürün kimlikleri, depo adı)
 * serbest; yakalanan yalnız Türkçe yazılış (ı ile) — yani ekrana çıkabilecek metin.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const yorumsuz = (k: string) => k.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const dosyalar = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((g) => (g.isDirectory() ? dosyalar(path.join(d, g.name)) : /\.(tsx?|xml|strings)$/.test(g.name) ? [path.join(d, g.name)] : []));

describe('marka adı: kıraathane ekrana çıkmaz', () => {
  it('oyun kodu + uygulama adları (iOS/Android Türkçe) temiz', () => {
    const kaynak = [...dosyalar('src'), 'ios/App/App/tr.lproj/InfoPlist.strings', 'android/app/src/main/res/values-tr/strings.xml'];
    const suclu = kaynak.filter((f) => /[Kk]ıraathane|KIRAATHANE/.test(f.endsWith('.xml') || f.endsWith('.strings') ? readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '') : yorumsuz(readFileSync(f, 'utf8'))));
    expect(suclu).toEqual([]);
  });
});
