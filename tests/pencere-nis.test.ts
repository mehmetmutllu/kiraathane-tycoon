import { describe, expect, it } from 'vitest';
import {
  WALL_RUNS,
  pencereBosluklari,
  wallDikey,
  wallPieces,
  wallSideLine,
  wallUzunluk,
} from '../src/components/three/wallLook';
import { WALL_H, WAINSCOT_H, wallBoxes } from '../src/components/three/wallPanel';
import {
  AYNA_H,
  AYNA_Y,
  LAVABO_CARPITMA,
  LAVABO_KUTU,
  LAVABO_NATIVE,
  LAVABO_SCALE,
  muslukAynaPayi,
  muslukTepeY,
} from '../src/components/three/wcLook';
import { WALL_THEMES } from '../src/config/palette';
import { WINDOW, decorItems } from '../src/config/decor';
import { MAX_AREAS } from '../src/game/world';

const TEMA = WALL_THEMES.krem;
const ALANLAR = [1, 2, MAX_AREAS];

/** Bir parçanın çizdiği duvar ALANI (hat uzunluğu × yükseklik). Korunum ölçütünün birimi. */
const parcaAlan = (p: { w: number; d: number; y0?: number; h?: number }): number =>
  Math.max(p.w, p.d) * ((p.h ?? WALL_H) - (p.y0 ?? 0));

describe('pencereBosluklari — boşluk programı config/decor.ts\'ten TÜRER', () => {
  it('her pencere öğesi için bir boşluk üretir (sayı birebir)', () => {
    for (const a of ALANLAR) {
      const pencere = decorItems(a).filter((d) => d.kind === 'pencere');
      expect(pencereBosluklari(a).length).toBe(pencere.length);
    }
  });

  it('boşluğun y aralığı maketin pencere bandı (denizlik 1,15 · baş 2,80)', () => {
    for (const o of pencereBosluklari(MAX_AREAS)) {
      expect(o.y0).toBeCloseTo(WINDOW.sill, 6);
      expect(o.y1).toBeCloseTo(WINDOW.top, 6);
    }
  });

  it('boşluğun eni pencerenin kendi eni (3,20) — iki yere ayrı yazılmıyor', () => {
    const pencere = decorItems(MAX_AREAS).filter((d) => d.kind === 'pencere');
    const boslar = pencereBosluklari(MAX_AREAS);
    for (let i = 0; i < boslar.length; i++)
      expect(boslar[i].b - boslar[i].a).toBeCloseTo(pencere[i].len ?? 3.0, 6);
  });

  it('boşluklar BİRBİRİYLE çakışmaz (wallPieces kesişen açıklık desteklemiyor)', () => {
    const boslar = [...pencereBosluklari(MAX_AREAS)].sort((p, q) => p.a - q.a);
    for (let i = 1; i < boslar.length; i++)
      if (boslar[i].line === boslar[i - 1].line) expect(boslar[i].a).toBeGreaterThan(boslar[i - 1].b);
  });

  it('pencere yalnız DİK duvarda (sağ duvar) — yatay hatta boşluk açılmıyor', () => {
    for (const o of pencereBosluklari(MAX_AREAS)) expect(o.dikey).toBe(true);
  });
});

describe('wallPieces — duvarı açıklığa göre böler', () => {
  it('AÇIKLIK YOKSA parça listesi aynen döner (bugünkü görüntü bozulmaz)', () => {
    for (const a of ALANLAR) {
      const runs = WALL_RUNS(a);
      expect(wallPieces(runs, [])).toEqual(runs);
    }
  });

  it('KORUNUM: çizilen duvar alanı = eski alan − açıklık alanı', () => {
    for (const a of ALANLAR) {
      const runs = WALL_RUNS(a);
      const boslar = pencereBosluklari(a);
      const eski = runs.reduce((t, r) => t + wallUzunluk(r) * WALL_H, 0);
      const yeni = wallPieces(runs, boslar).reduce((t, p) => t + parcaAlan(p), 0);
      // Açıklığın hattın DIŞINA taşan kısmı sayılmaz — kırpılmış alan hesaplanır.
      const delik = boslar.reduce((t, o) => {
        let alan = 0;
        for (const r of runs) {
          if (o.dikey !== wallDikey(r) || Math.abs(o.line - wallSideLine(r)) >= 0.4) continue;
          const uz = wallUzunluk(r);
          const bas = (wallDikey(r) ? r.z : r.x) - uz / 2;
          const kesim = Math.max(0, Math.min(bas + uz, o.b) - Math.max(bas, o.a));
          alan += kesim * (o.y1 - o.y0);
        }
        return t + alan;
      }, 0);
      expect(yeni).toBeCloseTo(eski - delik, 4);
      // Pencereler `from: 2` — 1 alan açıkken pencere YOK, o yüzden delik 0 olmalı; 2+ alanda
      // sıfırdan büyük olmalı. Bu ayrım testin kendisinde duruyor ki "hiç delinmiyor" hatası
      // sessizce yeşil kalmasın.
      expect(delik > 0).toBe(pencereBosluklari(a).length > 0);
    }
  });

  it('açıklığın İÇİNDE hiç duvar çizilmez', () => {
    const runs = WALL_RUNS(MAX_AREAS);
    const boslar = pencereBosluklari(MAX_AREAS);
    for (const p of wallPieces(runs, boslar)) {
      const uz = wallUzunluk(p);
      const orta = wallDikey(p) ? p.z : p.x;
      const alt = p.y0 ?? 0;
      const ust = p.h ?? WALL_H;
      for (const o of boslar) {
        if (o.dikey !== wallDikey(p) || Math.abs(o.line - wallSideLine(p)) >= 0.4) continue;
        const eksenCakisma = orta + uz / 2 > o.a + 1e-6 && orta - uz / 2 < o.b - 1e-6;
        const yCakisma = ust > o.y0 + 1e-6 && alt < o.y1 - 1e-6;
        expect({ eksenCakisma, yCakisma, ikisi: eksenCakisma && yCakisma }).toEqual({
          eksenCakisma,
          yCakisma,
          ikisi: false,
        });
      }
    }
  });

  it('açıklık başına DÖRT parça doğar (solu · sağı · altı · üstü)', () => {
    const runs = WALL_RUNS(MAX_AREAS);
    const boslar = pencereBosluklari(MAX_AREAS);
    // Üç pencerenin hepsi TEK bir hatta düşüyor → o hat 3 açıklıkla 4 tam + 3 alt + 3 üst = 10 parça.
    const hat = boslar[0].line;
    const oHatta = wallPieces(runs, boslar).filter(
      (p) => wallDikey(p) && Math.abs(wallSideLine(p) - hat) < 0.4,
    );
    const tam = oHatta.filter((p) => (p.y0 ?? 0) === 0 && (p.h ?? WALL_H) === WALL_H);
    const denizlikAlti = oHatta.filter((p) => (p.y0 ?? 0) === 0 && (p.h ?? WALL_H) < WALL_H);
    const lentoUstu = oHatta.filter((p) => (p.y0 ?? 0) > 0);
    expect(denizlikAlti.length).toBe(boslar.length);
    expect(lentoUstu.length).toBe(boslar.length);
    expect(tam.length).toBeGreaterThanOrEqual(1);
  });

  it('parçalar hattın DIŞINA taşmaz', () => {
    const runs = WALL_RUNS(MAX_AREAS);
    const boslar = pencereBosluklari(MAX_AREAS);
    for (const r of runs) {
      const uz = wallUzunluk(r);
      const bas = (wallDikey(r) ? r.z : r.x) - uz / 2;
      const kendi = wallPieces([r], boslar);
      for (const p of kendi) {
        const pu = wallUzunluk(p);
        const po = wallDikey(p) ? p.z : p.x;
        expect(po - pu / 2).toBeGreaterThanOrEqual(bas - 1e-6);
        expect(po + pu / 2).toBeLessThanOrEqual(bas + uz + 1e-6);
      }
    }
  });
});

describe('wallBoxes — y0 (S6/E3)', () => {
  it('y0 verilmezse davranış AYNI: üç katman (gövde · lambri · çıta)', () => {
    const b = wallBoxes({ x: 0, z: 0, w: 4, d: 0.2, theme: TEMA });
    expect(b.length).toBe(3);
    expect(b[0].h).toBeCloseTo(WALL_H - WAINSCOT_H, 6);
  });

  it('LENTO ŞERİDİ (y0 = 2,80) yalnız gövde üretir — havada lambri/çıta çizilmez', () => {
    const b = wallBoxes({ x: 0, z: 0, w: 3.2, d: 0.2, theme: TEMA, y0: WINDOW.top, h: WALL_H });
    expect(b.length).toBe(1);
    expect(b[0].color).toBe(TEMA.cream);
    expect(b[0].h).toBeCloseTo(WALL_H - WINDOW.top, 6);
    expect(b[0].y).toBeCloseTo((WINDOW.top + WALL_H) / 2, 6);
  });

  it('DENİZLİK ALTI (h = 1,15) lambri ve çıtayı KORUR, gövdeyi kırpar', () => {
    const b = wallBoxes({ x: 0, z: 0, w: 3.2, d: 0.2, theme: TEMA, h: WINDOW.sill });
    expect(b.length).toBe(3);
    const govde = b.find((k) => k.color === TEMA.cream)!;
    expect(govde.h).toBeCloseTo(WINDOW.sill - WAINSCOT_H, 6);
    expect(b.find((k) => k.color === TEMA.wainscot)!.h).toBeCloseTo(WAINSCOT_H, 6);
    expect(b.find((k) => k.color === TEMA.rail)).toBeDefined();
  });

  it('hiçbir kutu y0\'ın altına ya da h\'nin üstüne taşmaz', () => {
    for (const [y0, h] of [
      [0, WALL_H],
      [0, WINDOW.sill],
      [WINDOW.top, WALL_H],
      [1.0, 2.0],
    ] as const)
      for (const k of wallBoxes({ x: 0, z: 0, w: 3.2, d: 0.2, theme: TEMA, y0, h })) {
        expect(k.y - k.h / 2).toBeGreaterThanOrEqual(y0 - 1e-6);
        expect(k.y + k.h / 2).toBeLessThanOrEqual(h + 1e-6);
      }
  });
});

describe('wcLook — KayKit lavabosu (S6/G1)', () => {
  it('tezgâh üstü bugünkü lavaboyla BİREBİR aynı (yerleşim değişmiyor)', () => {
    expect(LAVABO_NATIVE.tablaY * LAVABO_SCALE[1]).toBeCloseTo(LAVABO_KUTU.tablaY, 6);
    expect(LAVABO_NATIVE.w * LAVABO_SCALE[0]).toBeCloseTo(LAVABO_KUTU.w, 6);
    expect(LAVABO_NATIVE.d * LAVABO_SCALE[2]).toBeCloseTo(LAVABO_KUTU.d, 6);
  });

  it('çarpıtma ölçülen değerde (2,62) — sessizce büyürse kol değişmiş demektir', () => {
    expect(LAVABO_CARPITMA).toBeGreaterThan(2.5);
    expect(LAVABO_CARPITMA).toBeLessThan(2.75);
  });

  it('tezgâh üstü 1,75\'lik insanın %49\'unda (gerçek lavabo oranı)', () => {
    expect(LAVABO_KUTU.tablaY / 1.75).toBeGreaterThan(0.45);
    expect(LAVABO_KUTU.tablaY / 1.75).toBeLessThan(0.53);
  });

  it("MUSLUK aynayla DERİNLİKTE çakışmaz (y ekseninde üst üste binmesi doğrusu)", () => {
    // Gerçek bir lavaboda da musluk aynanın önünde durur; kusur olacak şey iç içe geçmeleriydi.
    expect(muslukAynaPayi()).toBeGreaterThan(0.02);
    // Ve gerçekten üst üste biniyorlar — bu satır ölçütün doğru olanı denetlediğini gösterir.
    expect(muslukTepeY()).toBeGreaterThan(AYNA_Y - AYNA_H / 2);
  });

  it('musluk gerçekten bir KOL: modelin boyunun yarısından fazlası tezgâhın üstünde', () => {
    const musluk = LAVABO_NATIVE.maxY - LAVABO_NATIVE.tablaY;
    expect(musluk / LAVABO_NATIVE.tablaY).toBeGreaterThan(0.5);
  });
});
