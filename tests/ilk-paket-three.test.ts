import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * İLK PAKET BEKÇİSİ (Faz F kod-bölme).
 *
 * Tek parça derleme 1.633 kB'tı; açılış ekranı three + r3f + drei inene kadar çizilemiyordu.
 * Sahne ve 3D önizlemeler `lazy()` ile ayrı parçaya alındı, açılış ekranı ilerlemeyi
 * `game/yukleme` köprüsünden okuyor. Bölmeyi bozan şey tek bir STATİK import: `config/decor`un
 * `wallPanel`i (three'li) çekmesi bütün 3D'yi ilk pakete geri taşımıştı.
 *
 * Denetim: `src/main.tsx`ten yalnız statik `import … from` / `export … from` kenarları izlenir
 * (`import()` dinamik = ayrı parça, sayılmaz; `import type` derlemede silinir, sayılmaz).
 * Ulaşılan hiçbir modül `three` / `@react-three/*` / `three-stdlib` import etmemeli.
 */
const YASAK = /^(three|three-stdlib|@react-three\/.+)(\/.*)?$/;
const kodu = (m: string) => m.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function coz(kimden: string, yol: string): string | null {
  const taban = resolve(dirname(kimden), yol);
  for (const u of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(taban + u) && (u !== '' || /\.(tsx?|css)$/.test(taban))) return taban + u;
  }
  return null;
}

function statikAgac(giris: string): { dosyalar: Set<string>; ihlal: string[] } {
  const dosyalar = new Set<string>();
  const ihlal: string[] = [];
  const kuyruk = [resolve(giris)];
  while (kuyruk.length) {
    const d = kuyruk.pop()!;
    if (dosyalar.has(d) || !/\.tsx?$/.test(d)) continue;
    dosyalar.add(d);
    const m = kodu(readFileSync(d, 'utf8'));
    const re = /(?:^|;|\n)\s*(import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
    for (const k of m.matchAll(re)) {
      if (k[2]) continue;
      const hedef = k[3];
      if (hedef.startsWith('.')) {
        const c = coz(d, hedef);
        if (c) kuyruk.push(c);
      } else if (YASAK.test(hedef)) {
        ihlal.push(`${d.replace(resolve('.'), '')} → ${hedef}`);
      }
    }
  }
  return { dosyalar, ihlal };
}

describe('ilk paket — three/r3f açılış ekranının yoluna girmez', () => {
  it('main.tsx statik import ağacı three / @react-three içermez', () => {
    const { dosyalar, ihlal } = statikAgac('src/main.tsx');
    // Ağaç gerçekten yürüdü mü: HUD ve açılış ekranı ilk pakette olmalı.
    const adlar = [...dosyalar].map((f) => f.replace(/\\/g, '/'));
    expect(adlar.some((f) => f.endsWith('components/ui/HUD.tsx'))).toBe(true);
    expect(adlar.some((f) => f.endsWith('components/ui/SplashScreen.tsx'))).toBe(true);
    expect(ihlal).toEqual([]);
  });

  it('Scene yalnız dinamik import ile yüklenir', () => {
    const app = kodu(readFileSync('src/App.tsx', 'utf8'));
    expect(app).toMatch(/lazy\(\(\) => import\('\.\/components\/three\/Scene'\)/);
    expect(app).not.toMatch(/^import[^;]*from '\.\/components\/three\/Scene'/m);
  });
});
