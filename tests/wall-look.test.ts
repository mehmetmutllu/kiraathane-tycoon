/**
 * wall-look.test.ts — DUVAR HATLARININ BEKÇİSİ (S4).
 *
 * Bu liste S4'ten önce `Scene.Walls`ın içindeydi ve vitest'te import EDİLEMİYORDU
 * (`Scene` → `recolor` → `Image`). Yani bugüne kadar hiç bekçilenmedi: duvarın kaç parça
 * olduğu, hattın nereye düştüğü, kapı boşluğunun gerçekten kesilip kesilmediği yalnız
 * tarayıcıda gözle görülebiliyordu.
 *
 * Beklenen sayılar `docs/olcum-duvar.txt` §2'nin kendisidir — rapor ile test aynı kaynaktan
 * okur, o yüzden biri değişirse diğeri kırılır.
 */
import { describe, expect, it } from 'vitest';
import { BAND, BAND_SHELL, LAYOUT, doorX } from '../src/game/layout';
import {
  BAND_SHELL_RUNS,
  WALL_M,
  WALL_RUNS,
  WALL_T,
  wallDikey,
  wallSideLine,
  wallUzunluk,
} from '../src/components/three/wallLook';
import { DOOR, WALL_H, wallBoxes } from '../src/components/three/wallPanel';
import { WALL_THEMES } from '../src/config/palette';

const uzunluklar = (ao: number) => WALL_RUNS(ao).map((r) => +wallUzunluk(r).toFixed(3));

describe('duvar hatları — parça listesi', () => {
  it('her açık-alan durumunda beklenen parça sayısını verir', () => {
    expect(WALL_RUNS(1)).toHaveLength(5);
    expect(WALL_RUNS(2)).toHaveLength(6);
    expect(WALL_RUNS(3)).toHaveLength(6);
  });

  // ÖLÇÜLEN SAYILAR (docs/olcum-duvar.txt §2). Yerleşim değişirse burası kırılır ve rapor
  // yeniden ölçülmek zorunda kalır — "sayı iki yerde" tuzağının panzehiri budur.
  it('hat uzunlukları ölçüm raporundaki değerlerdir', () => {
    expect(uzunluklar(1)).toEqual([18, 18, 6.8, 6.8, 18]);
    expect(uzunluklar(2)).toEqual([18, 15.3, 18, 18, 15.3, 18]);
    expect(uzunluklar(3)).toEqual([18, 15.3, 18, 15.3, 10.8, 10.8]);
    expect(BAND_SHELL_RUNS().map((r) => +wallUzunluk(r).toFixed(3))).toEqual([35, 7.6, 7.6]);
  });

  // Kalınlık SABİTLE değil ÖLÇÜLEN SAYIYLA karşılaştırılır. İlk hâli `toBe(WALL_T)`ydi ve
  // mutasyon testinde kaçtı: sabit değişince beklenti de değişiyor, yani test kendini doğruluyordu.
  // 0,20 `docs/olcum-duvar.txt` §1'in sayısıdır; KayKit modülünün 0,40'ıyla kıyas ondan okunur.
  it('hepsi 0,20 kalınlığında ve ince eksen gerçekten ince', () => {
    expect(WALL_T).toBe(0.2);
    for (let ao = 1; ao <= 3; ao++)
      for (const r of WALL_RUNS(ao)) {
        expect(Math.min(r.w, r.d)).toBe(0.2);
        expect(wallUzunluk(r)).toBeGreaterThan(0.2);
      }
    for (const r of BAND_SHELL_RUNS()) expect(Math.min(r.w, r.d)).toBe(0.2);
  });
});

describe('duvar hatları — geometriden türeme', () => {
  it('hat, alan kenarının WALL_M kadar DIŞINDA durur', () => {
    for (const r of WALL_RUNS(3)) {
      const za = LAYOUT.areaBounds[r.area];
      const beklenen =
        r.side === 'left'
          ? za.minX - WALL_M
          : r.side === 'right'
            ? za.maxX + WALL_M
            : r.side === 'front'
              ? za.maxZ + WALL_M
              : za.minZ - WALL_M;
      expect(wallSideLine(r)).toBeCloseTo(beklenen, 6);
    }
  });

  it('sol/sağ parçalar dikey, ön/arka parçalar yatay', () => {
    for (const r of WALL_RUNS(3)) expect(wallDikey(r)).toBe(r.side === 'left' || r.side === 'right');
  });

  it('arka yarının ARKA kenarına duvar örülmez (orası BackBand programı)', () => {
    const arka = WALL_RUNS(3).filter((r) => r.side === 'back' && LAYOUT.areaBounds[r.area].minZ === BAND.front);
    expect(arka).toHaveLength(0);
  });

  it('bir alan açıkken komşu kenarlar kapanmaz; üç alan açıkken iç kenarlar kaybolur', () => {
    // 1 alan: sağ kenar da duvar (kelepçe duvarı). 3 alan: alan 0 ile 1 arasında duvar YOK.
    expect(WALL_RUNS(1).some((r) => r.area === 0 && r.side === 'right')).toBe(true);
    expect(WALL_RUNS(3).some((r) => r.area === 0 && r.side === 'right')).toBe(false);
  });
});

describe('kapı boşluğu', () => {
  it('ön duvar kapının iki yanından kesilir, kapının önüne parça düşmez', () => {
    for (const ao of [1, 2, 3]) {
      const dx = doorX(ao);
      for (const r of WALL_RUNS(ao)) {
        if (r.side !== 'front') continue;
        const p0 = r.x - r.w / 2;
        const p1 = r.x + r.w / 2;
        // Parça kapı aralığıyla ÇAKIŞMAMALI.
        expect(p1 <= dx - DOOR.half + 1e-6 || p0 >= dx + DOOR.half - 1e-6).toBe(true);
      }
    }
  });

  it('kapı 2. alanda cephenin ortasına kayınca iki parçanın DİKİŞİNE düşer ve yine kesilir', () => {
    // B3-2'nin yakaladığı hata: kapı x = 0'da, alan 0'ın ön kenarı x = 0'da bitiyor.
    expect(doorX(2)).toBe(0);
    const on = WALL_RUNS(2).filter((r) => r.side === 'front');
    expect(on).toHaveLength(2);
    for (const r of on) expect(Math.abs(r.x) - r.w / 2).toBeGreaterThanOrEqual(DOOR.half - 1e-6);
  });
});

describe('bandın bina kabuğu', () => {
  it('arka + iki yan, hepsi bandın kendi sınırlarından türer', () => {
    const [arka, sol, sag] = BAND_SHELL_RUNS();
    expect(arka.z).toBe(BAND_SHELL.back);
    expect(arka.w).toBeCloseTo(BAND_SHELL.right - BAND_SHELL.left, 6);
    expect(sol.x).toBe(BAND_SHELL.left);
    expect(sag.x).toBe(BAND_SHELL.right);
    expect(sol.d).toBeCloseTo(BAND.front - BAND_SHELL.back, 6);
  });
});

describe('çizim hattı — parça listesi wallPanel ile uyumlu', () => {
  it('her parça maketin ÜÇ katmanına çevrilir ve toplam yükseklik WALL_H olur', () => {
    for (const r of WALL_RUNS(3)) {
      const kutular = wallBoxes({ x: r.x, z: r.z, w: r.w, d: r.d, theme: WALL_THEMES.krem });
      expect(kutular).toHaveLength(3);
      const tepe = Math.max(...kutular.map((b) => b.y + b.h / 2));
      expect(tepe).toBeCloseTo(WALL_H, 6);
      // Uzun eksen korunur: katmanlar yalnız İNCE ekseni değiştirir.
      for (const b of kutular) expect(Math.max(b.w, b.d)).toBeCloseTo(wallUzunluk(r), 6);
    }
  });
});
