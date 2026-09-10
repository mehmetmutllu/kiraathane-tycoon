/**
 * cephe-vitrin.test.ts — S6/②'nin BEKÇİSİ (D-105).
 *
 * Ne bekliyor: cephenin cam bandı kapı bloğuna değmesin, hat artıksız bölünsün, kaide
 * "lambri korunur" kararını (kuşak + ÇITA) gerçekten korusun, cam bandında hiç duvar
 * üretilmesin ve alan açıldıkça ritim bozulmasın.
 *
 * Bu testler `cepheLook` + `wallLook` + `wallPanel` üstünde SAF çalışır — `Scene.tsx` vitest'te
 * import edilemez (`recolor` → `Image`), o yüzden sayı Scene'de değil ölçü katmanında duruyor.
 */
import { describe, expect, it } from 'vitest';
import { doorX } from '../src/game/layout';
import { DOOR, RAIL_TOP, SOVE_DIS, WAINSCOT_H, WALL_H, wallBoxes } from '../src/components/three/wallPanel';
import { WALL_RUNS, wallPieces, wallUzunluk } from '../src/components/three/wallLook';
import { ALINLIK, VITRIN, camYuzeyi, cepheBosluklari, gozSayisi, vitrinGozleri } from '../src/components/three/cepheLook';

const onRuns = (a: number) => WALL_RUNS(a).filter((r) => r.side === 'front');

describe('cephe vitrini — bant ölçüleri (D-105)', () => {
  it('cam ÜSTÜ kapı boyuyla birebir hizalı (cephe tepesi tek şerit)', () => {
    expect(VITRIN.ust).toBe(DOOR.height);
  });

  it('kaide lambri ÇITASININ ÜSTÜ — C4b "lambri korunur" kararının karşılığı', () => {
    expect(VITRIN.kaide).toBeCloseTo(RAIL_TOP, 6);
    expect(VITRIN.kaide).toBeGreaterThan(WAINSCOT_H); // kuşağın üstünde
  });

  it('alınlık camın üstünden duvarın tepesine gider', () => {
    expect(ALINLIK[0]).toBe(VITRIN.ust);
    expect(ALINLIK[1]).toBe(WALL_H);
  });
});

describe('cephe vitrini — gözlerin yerleşimi', () => {
  it('2 alan açıkken yarı başına 4 göz üretir (karar paketi: 3,35 br)', () => {
    const g = vitrinGozleri(2);
    expect(g.length).toBe(8);
    for (const goz of g) expect(goz.en).toBeCloseTo(3.35, 1);
  });

  it('gözler hattı ARTIKSIZ dolduruyor (göz + ayak toplamı = kullanılabilir hat)', () => {
    for (const a of [1, 2]) {
      const gozler = vitrinGozleri(a);
      for (const r of onRuns(a)) {
        const benim = gozler.filter((g) => Math.abs(g.x - r.x) < wallUzunluk(r) / 2 + 1);
        if (benim.length < 2) continue;
        const sirali = [...benim].sort((p, q) => p.x - q.x);
        for (let i = 1; i < sirali.length; i++) {
          const bosluk = sirali[i].x - sirali[i].en / 2 - (sirali[i - 1].x + sirali[i - 1].en / 2);
          expect(bosluk).toBeCloseTo(VITRIN.ayak, 6); // aralarında TAM ayak var, artık yok
        }
      }
    }
  });

  it('hiçbir göz KAPI BLOĞUNA girmiyor (söve dış kenarı ∓2,40)', () => {
    for (const a of [1, 2]) {
      // Sınır vitrinin KENDİ payından değil SÖVENİN gerçek dış kenarından geliyor — yoksa
      // test kendi kendini doğrular ve `sovePay = 0` mutasyonu kaçardı.
      const dis = doorX(a) + SOVE_DIS;
      const ic = doorX(a) - SOVE_DIS;
      for (const g of vitrinGozleri(a)) {
        const sol = g.x - g.en / 2;
        const sag = g.x + g.en / 2;
        expect(sag <= ic + 1e-9 || sol >= dis - 1e-9).toBe(true);
      }
    }
  });

  it('hiçbir göz duvarın KÖŞE PAYINA taşmıyor', () => {
    for (const a of [1, 2]) {
      for (const r of onRuns(a)) {
        const uz = wallUzunluk(r);
        const [x0, x1] = [r.x - uz / 2, r.x + uz / 2];
        for (const g of vitrinGozleri(a)) {
          if (g.x < x0 || g.x > x1) continue;
          expect(g.x - g.en / 2).toBeGreaterThanOrEqual(x0 - 1e-9);
          expect(g.x + g.en / 2).toBeLessThanOrEqual(x1 + 1e-9);
        }
      }
    }
  });

  it('KÖŞE payı duvarın DIŞ ucunda, SÖVE payı kapı ucunda (paylar yer değiştiremez)', () => {
    // Bu denetim bir MUTASYON KAÇTIĞI için eklendi: söve ve köşe paylarını yer değiştiren
    // mutasyon 16 denetimin hepsinden geçiyordu. Sebebi aritmetik — 0,60 + 0,20 iki yönde de
    // aynı toplamı verir, yani hat UZUNLUĞU değişmez, gözler yalnız 0,40 KAYAR. O kayma
    // masum değil: binanın köşesinde payanda kalmaz, cam köşeye dayanır.
    for (const a of [1, 2]) {
      const dx0 = doorX(a);
      for (const r of onRuns(a)) {
        const uz = wallUzunluk(r);
        const [x0, x1] = [r.x - uz / 2, r.x + uz / 2];
        const benim = vitrinGozleri(a).filter((g) => g.x > x0 && g.x < x1);
        if (!benim.length) continue;
        const sirali = [...benim].sort((p, q) => p.x - q.x);
        const solBosluk = sirali[0].x - sirali[0].en / 2 - x0;
        const sagBosluk = x1 - (sirali[sirali.length - 1].x + sirali[sirali.length - 1].en / 2);
        // Kapıya bakan uç hangisiyse SÖVE payını, öteki KÖŞE payını alır.
        const solKapiya = Math.abs(x0 - (dx0 + DOOR.half)) < 0.01;
        expect(solBosluk).toBeCloseTo(solKapiya ? VITRIN.sovePay : VITRIN.kosePay, 6);
        expect(sagBosluk).toBeCloseTo(solKapiya ? VITRIN.kosePay : VITRIN.sovePay, 6);
      }
    }
  });

  it('gözler BİRBİRİYLE kesişmiyor (wallPieces kesişen açıklık desteklemiyor)', () => {
    const g = [...vitrinGozleri(2)].sort((p, q) => p.x - q.x);
    for (let i = 1; i < g.length; i++) {
      expect(g[i].x - g[i].en / 2).toBeGreaterThanOrEqual(g[i - 1].x + g[i - 1].en / 2 - 1e-9);
    }
  });

  it('göz SAYISI değil göz ENİ sabit — alan açılınca ritim korunuyor', () => {
    const bir = vitrinGozleri(1);
    const iki = vitrinGozleri(2);
    const ort = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    // 1 alan açıkken hat kısa; göz sayısı düşer ama göz eni hedefe yakın kalır.
    expect(Math.abs(ort(bir.map((g) => g.en)) - VITRIN.gozHedef)).toBeLessThan(1.0);
    expect(Math.abs(ort(iki.map((g) => g.en)) - VITRIN.gozHedef)).toBeLessThan(1.0);
    expect(bir.length).toBeLessThan(iki.length); // hat uzayınca göz sayısı artar
  });

  it('gozSayisi hedef enden türüyor (14,50 br → tam 4)', () => {
    expect(gozSayisi(14.5)).toBe(4);
    expect(gozSayisi(0.2)).toBe(1); // taban: en az bir göz
    expect(gozSayisi(1000)).toBe(8); // tavan
  });
});

describe('cephe vitrini — duvarla birleşme', () => {
  it('cam bandında HİÇ duvar parçası kalmıyor', () => {
    const runs = onRuns(2);
    const parcalar = wallPieces(runs, cepheBosluklari(2));
    const orta = (VITRIN.kaide + VITRIN.ust) / 2;
    for (const g of vitrinGozleri(2)) {
      const ustunde = parcalar.filter((p) => {
        const uz = wallUzunluk(p);
        const y0 = p.y0 ?? 0;
        const y1 = p.h ?? WALL_H;
        return Math.abs(p.x - g.x) < uz / 2 && y0 < orta && y1 > orta;
      });
      expect(ustunde).toHaveLength(0);
    }
  });

  it('gözün ALTINDA lambri kuşağı VE çıtası duruyor (C4b)', () => {
    const parcalar = wallPieces(onRuns(2), cepheBosluklari(2));
    const g = vitrinGozleri(2)[0];
    const kaide = parcalar.find((p) => Math.abs(p.x - g.x) < 0.01 && (p.y0 ?? 0) === 0);
    expect(kaide).toBeDefined();
    const kutular = wallBoxes({
      x: kaide!.x,
      z: kaide!.z,
      w: kaide!.w,
      d: kaide!.d,
      theme: { cream: '#a', wainscot: '#b', rail: '#c' } as never,
      y0: kaide!.y0,
      h: kaide!.h,
    });
    expect(kutular.some((b) => b.color === '#b')).toBe(true); // lambri kuşağı
    expect(kutular.some((b) => b.color === '#c')).toBe(true); // ÇITA — kaide 0,90 olsaydı düşerdi
  });

  it('gözün ÜSTÜNDE alınlık şeridi duruyor ve badana rengiyle', () => {
    const parcalar = wallPieces(onRuns(2), cepheBosluklari(2));
    const g = vitrinGozleri(2)[0];
    const alinlik = parcalar.find((p) => Math.abs(p.x - g.x) < 0.01 && Math.abs((p.y0 ?? 0) - VITRIN.ust) < 1e-9);
    expect(alinlik).toBeDefined();
    const kutular = wallBoxes({
      x: alinlik!.x,
      z: alinlik!.z,
      w: alinlik!.w,
      d: alinlik!.d,
      theme: { cream: '#a', wainscot: '#b', rail: '#c' } as never,
      y0: alinlik!.y0,
      h: alinlik!.h,
    });
    expect(kutular).toHaveLength(1);
    expect(kutular[0].color).toBe('#a'); // yalnız badana — havada asılı lambri yok
  });

  it('vitrin PENCERE açıklıklarıyla çakışmıyor (ikisi aynı wallPieces çağrısına giriyor)', () => {
    for (const g of cepheBosluklari(2)) expect(g.dikey).toBe(false); // cephe YATAY hat
  });

  it('cam yüzeyi raporun sayısıyla tutuyor', () => {
    const boy = VITRIN.ust - VITRIN.kaide;
    expect(camYuzeyi(2)).toBeCloseTo(vitrinGozleri(2).reduce((a, g) => a + g.en, 0) * boy, 6);
    expect(camYuzeyi(2)).toBeGreaterThan(40);
  });

  it('kapalı alan yokken (areasOpen 0) vitrin de yok', () => {
    expect(vitrinGozleri(0)).toHaveLength(0);
  });
});
