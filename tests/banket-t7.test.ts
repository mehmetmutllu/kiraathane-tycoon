/**
 * banket-t7.test.ts — T7'nin BEKÇİSİ (G-82/G-83/G-84 · D-141).
 *
 * Kullanıcı 2026-09-23: *"banketler ortada olmalı ve seviye artınca banket ilerlemeli büyümeli …
 * minder koyarken parça parça değil, yarısında var yarısında yok gibi değil, olanda komple"*.
 * Buradaki iddialar o cümlenin sayıya dökülmüş hâli:
 *   A  şerit İÇ sütundan (kapı eksenine yakın) dışa dolar
 *   B  her açık masa kendi bank yüzünü getirir; masasız bank yüzü YOK
 *   C  ada TEK kademe taşır: dolmadan çıplak ahşap, dolunca en düşük masa seviyesi
 *   D  masa açmak kademeyi ASLA geri götürmez (minder gelip gitmez)
 *   E  her kademe bütün adaya bir şey EKLER (boş basamak yok)
 *   F  katı (collision) çizilen sütunlardan türer — görünmez duvar yok
 *   G  ada başına TEK mesh (T7 ölçümünde parçalı çizici 24 → 88 çağrı çıkarıyordu)
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { BANKET, LAYOUT, banketIslands, banketUnitsOpen } from '../src/game/store';
import { areaTableSlots, areaTableStart } from '../src/game/world';
import {
  ADA_YUZ,
  BANKET_KADEME_MAX,
  adaMasalari,
  banketGorunus,
  banketKademe,
  banketSutunlari,
} from '../src/components/three/banketLook';
import { banketAdaGeo } from '../src/components/three/banketGeo';

const A2 = areaTableStart(2);
const SON = A2 + areaTableSlots(2);
const seviyeler = (lv: number | ((i: number) => number)) =>
  Array.from({ length: SON }, (_, i) => (typeof lv === 'number' ? lv : lv(i)));

describe('A — şerit ortadan dışa', () => {
  it('ilk masa her iki adada da iç sütunda (|x| = 5,3), son masa dış uçta (11,7)', () => {
    expect(Math.abs(LAYOUT.tables[A2].table[0])).toBeCloseTo(5.3, 6);
    expect(Math.abs(LAYOUT.tables[A2 + 2].table[0])).toBeCloseTo(5.3, 6);
    expect(Math.abs(LAYOUT.tables[SON - 1].table[0])).toBeCloseTo(11.7, 6);
  });

  it('açılış sırasında masalar kapı eksenine hiç yaklaşmaz, hep uzaklaşır', () => {
    for (let t = A2 + 1; t < SON; t++) {
      expect(Math.abs(LAYOUT.tables[t].table[0]), `masa ${t}`).toBeGreaterThanOrEqual(Math.abs(LAYOUT.tables[t - 1].table[0]) - 1e-9);
    }
  });
});

describe('B — masasız bank yok', () => {
  it('her anda çizilen yüz sayısı = açık şerit masası sayısı', () => {
    for (let tables = A2; tables <= SON; tables++) {
      const yuz = banketSutunlari(tables).reduce((n, s) => n + +s.yuz[0] + +s.yuz[1], 0);
      expect(yuz, `${tables} masa`).toBe(banketUnitsOpen(tables));
    }
  });

  it('şerit açılmadan hiçbir şey çizilmez', () => {
    expect(banketSutunlari(A2)).toEqual([]);
    expect(banketAdaGeo([], 4)).toBeNull();
  });
});

describe('C/D — ada tek kademe taşır ve kademe geri gitmez', () => {
  it('ada dolmadan kademe 0, masalar tavanda olsa bile', () => {
    for (const side of [-1, 1] as const) {
      const son = Math.max(...adaMasalari(side));
      expect(banketKademe(son, seviyeler(4), side), `ada ${side}`).toBe(0);
      expect(banketKademe(son + 1, seviyeler(4), side), `ada ${side}`).toBe(BANKET_KADEME_MAX);
    }
    expect(adaMasalari(-1)).toHaveLength(ADA_YUZ);
  });

  it('dolu adada kademe = en düşük masa seviyesi (tek masa geride kalırsa ada bekler)', () => {
    const masalar = adaMasalari(-1);
    const lv = seviyeler(3);
    lv[masalar[4]] = 1;
    expect(banketKademe(SON, lv, -1)).toBe(1);
    lv[masalar[4]] = 3;
    expect(banketKademe(SON, lv, -1)).toBe(3);
    // Usta basamağı (L4 üstü) görünüşü taşırmaz.
    expect(banketKademe(SON, seviyeler(9), -1)).toBe(BANKET_KADEME_MAX);
  });

  it('masa açarak ilerlerken kademe hiçbir adımda düşmez', () => {
    // Seviyeler sabitken masa sayısı arttıkça kademe azalmaz (dolmamış adada en düşük seviye okunmaz).
    for (const lv of [0, 1, 2, 3, 4]) {
      for (const side of [-1, 1] as const) {
        let onceki = 0;
        for (let tables = A2; tables <= SON; tables++) {
          const k = banketKademe(tables, seviyeler(lv), side);
          expect(k, `L${lv} ada ${side} · ${tables} masa`).toBeGreaterThanOrEqual(onceki);
          onceki = k;
        }
      }
    }
  });
});

describe('E — her kademe bütün adaya bir şey ekler', () => {
  const ozellik = (k: number) => {
    const g = banketGorunus(k);
    return [g.oturak, g.sirt, g.yastik, g.biye, g.kapitone].filter(Boolean).length + (g.yastik?.length ?? 0);
  };

  it('özellik sayısı her basamakta ARTAR', () => {
    for (let k = 1; k <= BANKET_KADEME_MAX; k++) expect(ozellik(k), `kademe ${k}`).toBeGreaterThan(ozellik(k - 1));
  });

  it('renk de gelişir: ilk minder keten, 2. basamakta bordoya döner (G-84)', () => {
    expect(banketGorunus(0).oturak).toBeNull();
    expect(banketGorunus(1).oturak).not.toBe(banketGorunus(2).oturak);
    expect(banketGorunus(2).oturak).toBe(banketGorunus(4).oturak);
  });
});

describe('F — katı çizilenden türer', () => {
  it('her ada için katının x aralığı = çizilen sütunların x aralığı', () => {
    for (let tables = A2 + 1; tables <= SON; tables++) {
      const sutun = banketSutunlari(tables);
      for (const b of banketIslands(tables)) {
        const s = sutun.filter((k) => k.side === b.side);
        const lo = Math.min(...s.map((k) => k.x - k.len / 2));
        const hi = Math.max(...s.map((k) => k.x + k.len / 2));
        expect(b.center[0] - b.half[0], `${tables} masa · ada ${b.side}`).toBeCloseTo(lo, 6);
        expect(b.center[0] + b.half[0], `${tables} masa · ada ${b.side}`).toBeCloseTo(hi, 6);
        expect(b.center[2]).toBeCloseTo(BANKET.z, 6);
      }
      expect(banketIslands(tables).length).toBe(new Set(sutun.map((k) => k.side)).size);
    }
  });
});

describe('G — ada başına tek mesh', () => {
  it('geometri tek parça ve her kademe onu DEĞİŞTİRİR (her basamak gerçekten çiziliyor)', () => {
    const sutun = banketSutunlari(SON).filter((s) => s.side === -1);
    let onceki = 0;
    for (let k = 0; k <= BANKET_KADEME_MAX; k++) {
      const g = banketAdaGeo(sutun, k)!;
      const n = g.getAttribute('position').count;
      expect(g.getAttribute('color').count).toBe(n);
      if (k >= 1) expect(n, `kademe ${k}`).not.toBe(onceki);
      onceki = n;
      g.dispose();
    }
  });

  it('sahne adayı TEK mesh olarak çiziyor (kaynak denetimi — R3F dosyası import edilemez)', () => {
    const kaynak = readFileSync(new URL('../src/components/three/Scene.tsx', import.meta.url), 'utf8');
    expect(kaynak).toContain('banketAdaGeo(sutunlar, kademe)');
    expect(kaynak).toContain('banketKademe(tables, levels, side)');
    expect(kaynak).not.toContain('banketAday');
  });
});
