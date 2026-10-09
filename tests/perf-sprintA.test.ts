/**
 * perf-sprintA.test.ts — SPRINT A · PERFORMANS PAKET 1 BEKÇİSİ (kalite 0: görüntü birebir).
 *
 * NE İDDİA EDİYOR:
 *
 *   1. **Cihaz sınıfı sürümlü** (#3a). Eski (sürümsüz) anahtardaki "zayıf" damgası okunmaz ve
 *      silinir; cihaz yeniden ölçülür. Yoksa bir kez yanlış damgalanan telefon gölgeyi kalıcı kaybeder.
 *   2. **`fmt` önbelleği çıktıyı DEĞİŞTİRMEZ.** Önbellekli biçimleyici `toLocaleString`le birebir.
 *   3. **Sahne örtüsü sayaçtır** (#2a): iç içe paneller, çift kapanış — sayaç eksiye düşmez,
 *      son panel kapanmadan sahne çizilmez.
 *   4. **Kendi kendine kıpırdayan dekor gövdesi `CANLI_YUVALAR`da** (#2b). Yalıtık dekor önizlemesi
 *      `frameloop="demand"`; `useFrame`li bir gövde listede yoksa önizlemede DONAR.
 *   5. **Kaynak bekçileri**: opak kabuk örtüyü açar, sahne çizimi öncelik-1 abonede, durağan
 *      önizlemeler `demand`, Merged sınırlı kare, müşteri kırpması açık, gölge türü PCF.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { cihazSinifiOku, cihazSinifiYaz, PERF_SURUM } from '../src/game/cihazSinifi';
import { fmt } from '../src/game/decimal';
import { sahneOrtusuAc, sahneOrtulu } from '../src/components/three/sahneOrtusu';
import { CANLI_YUVALAR } from '../src/components/three/vitrinDekorLook';

const oku = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const sahteDepo = () => {
  const harita = new Map<string, string>();
  return {
    getItem: (k: string) => harita.get(k) ?? null,
    setItem: (k: string, v: string) => void harita.set(k, v),
    removeItem: (k: string) => void harita.delete(k),
    harita,
  };
};

describe('cihaz sınıfı sürümlü (#3a)', () => {
  let depo: ReturnType<typeof sahteDepo>;
  const yedek = globalThis.localStorage;
  beforeEach(() => {
    depo = sahteDepo();
    (globalThis as { localStorage?: unknown }).localStorage = depo;
  });
  afterEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = yedek;
  });

  it('eski sürümsüz "zayıf" damgası okunmaz ve silinir', () => {
    expect(PERF_SURUM).toBeGreaterThanOrEqual(2);
    depo.setItem('kiraathane-cihaz-sinifi', 'zayif');
    expect(cihazSinifiOku()).toBe('bilinmiyor');
    expect(depo.harita.has('kiraathane-cihaz-sinifi')).toBe(false);
  });

  it('bu sürümün damgası yazılır ve okunur', () => {
    cihazSinifiYaz('zayif');
    expect(depo.harita.get(`kiraathane-cihaz-sinifi-v${PERF_SURUM}`)).toBe('zayif');
    expect(cihazSinifiOku()).toBe('zayif');
  });
});

describe('fmt Intl önbelleği (çıktı birebir)', () => {
  const ornekler = [0, 7, 999, 1000, 12_345, 999_999, 1e6, 1_290_000, 999_960_000, 1.5e9, 2.25e12, -4321, -3.3e6];
  const yerel = { tr: 'tr-TR', en: 'en-US' } as const;

  it('1 milyonun altı: toLocaleString ile aynı', () => {
    for (const dil of ['tr', 'en'] as const)
      for (const n of [0, 7, 999, 1000, 12_345, 999_999])
        expect(fmt(n, dil)).toBe(Math.floor(n).toLocaleString(yerel[dil]));
  });

  it('kısaltmalı kol önceki biçimle aynı (tek ondalık, aşağı yuvarlama)', () => {
    expect(fmt(1_290_000, 'tr')).toBe('1,2 Mn');
    expect(fmt(1_290_000, 'en')).toBe('1.2M');
    expect(fmt(999_960_000, 'tr')).toBe('999,9 Mn');
    expect(fmt(2.25e12, 'en')).toBe('2.2T');
    expect(fmt(-3.3e6, 'tr')).toBe('-3,3 Mn');
  });

  it('dil değişince önbellek karışmaz (tr ↔ en art arda)', () => {
    for (const n of ornekler) {
      const tr = fmt(n, 'tr');
      const en = fmt(n, 'en');
      expect(fmt(n, 'tr')).toBe(tr);
      expect(fmt(n, 'en')).toBe(en);
    }
    expect(fmt(12_345, 'tr')).toBe('12.345');
    expect(fmt(12_345, 'en')).toBe('12,345');
  });
});

describe('sahne örtüsü sayacı (#2a)', () => {
  it('iç içe paneller: son panel kapanmadan sahne örtülü kalır', () => {
    expect(sahneOrtulu()).toBe(false);
    const a = sahneOrtusuAc();
    const b = sahneOrtusuAc();
    a();
    expect(sahneOrtulu()).toBe(true);
    b();
    expect(sahneOrtulu()).toBe(false);
  });

  it('çift kapanış sayacı eksiye düşürmez', () => {
    const a = sahneOrtusuAc();
    a();
    a();
    const b = sahneOrtusuAc();
    expect(sahneOrtulu()).toBe(true);
    b();
    expect(sahneOrtulu()).toBe(false);
  });
});

describe('canlı dekor gövdeleri (#2b)', () => {
  it('useFrame kullanan her dekor gövdesi CANLI_YUVALAR içinde, durağan olanlar değil', () => {
    const src = oku('src/components/three/VitrinDekor.tsx');
    // DekorGovde: `case 'yuva': return <Bilesen ... />;`
    const eslesme = [...src.matchAll(/case '([a-z]+)': return <([A-Z][A-Za-z]+)/g)].map((m) => [m[1], m[2]] as const);
    expect(eslesme.length).toBeGreaterThanOrEqual(9);
    for (const [yuva, bilesen] of eslesme) {
      const bas = src.indexOf(`function ${bilesen}(`);
      expect(bas, bilesen).toBeGreaterThanOrEqual(0);
      const son = src.indexOf('\nfunction ', bas + 1);
      const govde = src.slice(bas, son < 0 ? undefined : son);
      expect(CANLI_YUVALAR.has(yuva), `${yuva} (${bilesen})`).toBe(/useFrame\(/.test(govde));
    }
  });
});

describe('kaynak bekçileri', () => {
  it('opak kabuk (Sheet) sahne örtüsünü açar', () => {
    expect(oku('src/components/ui/Sheet.tsx')).toMatch(/useLayoutEffect\(\(\) => sahneOrtusuAc\(\), \[\]\)/);
  });

  it('sahne çizimi öncelik-1 abonede, örtülüyken atlanır', () => {
    const s = oku('src/components/three/Scene.tsx');
    expect(s).toMatch(/if \(sahneOrtulu\(\) && !cekim\)/);
    expect(s).toMatch(/st\.gl\.render\(st\.scene, st\.camera\);[\s\S]{0,80}\}, 1\);/);
    expect(s).toContain('<SahneCizimi />');
    expect(s).toContain("shadows={golgeAcik ? 'percentage' : false}");
  });

  it('durağan önizlemeler frameloop="demand", KareTavani yok', () => {
    for (const p of ['src/components/ui/DioramaPreview.tsx', 'src/components/ui/TableThemePreview.tsx']) {
      const s = oku(p);
      expect(s, p).toContain('frameloop="demand"');
      expect(s, p).not.toContain('<KareTavani');
    }
    expect(oku('src/components/ui/DekorOnizleme.tsx')).toMatch(/CANLI_YUVALAR\.has\(yuvaId\) \? <KareTavani \/> : <KareSayaci \/>/);
  });

  it('Merged örnek matrisleri sınırlı kare okunur', () => {
    for (const p of ['src/components/three/Tables.tsx', 'src/components/three/KayWalls.tsx', 'src/components/three/Kitchen.tsx']) {
      expect(oku(p), p).toMatch(/<Merged [^>]*frames=\{MERGED_KARE\}/);
    }
  });

  it('müşteri gövdeleri kırpılır; görünmeyende animasyon birikir', () => {
    const s = oku('src/components/three/Customers.tsx');
    expect(s).not.toMatch(/mesh\.frustumCulled = false/);
    expect(s).toMatch(/mesh\.boundingSphere = kirpmaKuresi\(geo\)/);
    expect(s).toMatch(/y\.bekleyenDt \+= dt;/);
    expect(s).toMatch(/turGeolari\.get\(kaynak\)/);
  });

  it('joystick sürüklemede React render etmez', () => {
    const s = oku('src/components/ui/Joystick.tsx');
    const move = s.slice(s.indexOf('const move'), s.indexOf('const end'));
    expect(move).not.toMatch(/setStick/);
    expect(move).toMatch(/knob\.current\.style\.transform/);
  });
});
