/**
 * layout-b31.test.ts — Faz B3-1 yerleşim değişmezleri (D-061 kadraj · D-062 servisin taşınması).
 *
 * Kat maket v13 ölçeğine çıktı: 21,2 × 20,6 → **34 × 34**. Bu dosya YERLEŞİMİN kendisini
 * doğrular; oynanış davranışı `logic.test.ts`'te kalır. Ayrı dosya olmasının sebebi: buradaki
 * testler koordinat/geometri iddiaları, B4 (odalar) ve B5 (masa tipleri) bunları TEKRAR
 * değiştirecek — o zaman tek dosya açılıp güncellenir.
 */
import { describe, it, expect } from 'vitest';
import {
  LAYOUT,
  BAND,
  FLOOR_HALF,
  PAD_RADIUS,
  wallSpans,
  servicePlace,
  serviceMoved,
  serviceInArea,
  openServices,
  useGame,
  areaOfTable,
  THE_SERVICE,
  MAX_SERVICES,
} from '../src/game/store';
import { clampToOpenAreas, getNavGrid, REACH_TABLE } from '../src/game/layout';
import { findNavPath } from '../src/game/nav';

const SP = (areasOpen: number) => servicePlace(areasOpen);

describe('B3-1 — kat 34 × 34 ve arka bant', () => {
  it('KAT ÖLÇÜSÜ: zemin 34 × 34; yürünebilir alan arka bandın ÖNÜNDE biter', () => {
    expect(FLOOR_HALF).toBe(17);
    expect(LAYOUT.area.minX).toBe(-FLOOR_HALF);
    expect(LAYOUT.area.maxX).toBe(FLOOR_HALF);
    expect(LAYOUT.area.maxZ).toBe(FLOOR_HALF);
    // Arka bant YÜRÜNMEZ: oynanabilir alan bandın ön çizgisinde biter.
    expect(LAYOUT.area.minZ).toBe(BAND.front);
    expect(BAND.back).toBeLessThan(BAND.front);
    // Bandın üç bloğu bitişik ve katı baştan sona kaplar (aralarında boşluk yok).
    expect(BAND.service.minX).toBe(-FLOOR_HALF);
    expect(BAND.service.maxX).toBe(BAND.stairs.minX);
    expect(BAND.stairs.maxX).toBe(BAND.wc.minX);
    expect(BAND.wc.maxX).toBe(FLOOR_HALF);
  });

  it('ALANLAR: üçü de katın içinde, üst üste binmez, birlikte bandın önünü doldurur', () => {
    const b = LAYOUT.areaBounds;
    expect(b.length).toBe(3);
    for (const a of b) {
      expect(a.minX).toBeGreaterThanOrEqual(-FLOOR_HALF);
      expect(a.maxX).toBeLessThanOrEqual(FLOOR_HALF);
      expect(a.minZ).toBeGreaterThanOrEqual(BAND.front);
      expect(a.maxZ).toBeLessThanOrEqual(FLOOR_HALF);
    }
    for (let i = 0; i < b.length; i++) {
      for (let j = i + 1; j < b.length; j++) {
        const overlap =
          Math.min(b[i].maxX, b[j].maxX) - Math.max(b[i].minX, b[j].minX) > 0.01 &&
          Math.min(b[i].maxZ, b[j].maxZ) - Math.max(b[i].minZ, b[j].minZ) > 0.01;
        expect(overlap, `alan ${i} ile ${j} örtüşüyor`).toBe(false);
      }
    }
    // Üç alanın toplamı = kat eksi bant (boşluk da yok, taşma da).
    const total = b.reduce((s, a) => s + (a.maxX - a.minX) * (a.maxZ - a.minZ), 0);
    expect(total).toBeCloseTo(FLOOR_HALF * 2 * (FLOOR_HALF - BAND.front), 3);
  });

  it('BANT YÜRÜNMEZ: bandın içindeki nokta da kat dışındaki nokta da geri kelepçelenir', () => {
    const [, cz] = clampToOpenAreas(-13, (BAND.front + BAND.back) / 2, 3);
    expect(cz).toBeGreaterThanOrEqual(BAND.front);
    const [ox] = clampToOpenAreas(FLOOR_HALF + 5, 5, 3);
    expect(ox).toBeLessThanOrEqual(FLOOR_HALF);
  });
});

describe('B3-1 — duvarlar ızgaradan değil GEOMETRİDEN türer (wallSpans)', () => {
  it('tek alan açıkken dört kenar da duvarlıdır', () => {
    for (const side of ['left', 'right', 'front', 'back'] as const) {
      expect(wallSpans(0, side, 1).length, side).toBeGreaterThan(0);
    }
  });

  it('AÇIK komşu kenarı kapatır (D-023 tek salon), dış kenar durur', () => {
    expect(wallSpans(0, 'right', 2)).toEqual([]);
    expect(wallSpans(1, 'left', 2)).toEqual([]);
    expect(wallSpans(0, 'left', 2).length).toBeGreaterThan(0);
    expect(wallSpans(1, 'right', 2).length).toBeGreaterThan(0);
  });

  it('bir kenarı İKİ komşu birlikte kapatabilir — eski ızgara sorgusunun anlatamadığı durum', () => {
    // Arka yarının ön kenarını iki ön çeyrek BİRLİKTE kapatır.
    expect(wallSpans(2, 'front', 3)).toEqual([]);
    // Kilitliyken kapanmaz: yalnız 1. alan açıkken a0'ın arka kenarı duvardır.
    expect(wallSpans(0, 'back', 1).length).toBeGreaterThan(0);
    expect(wallSpans(0, 'back', 3)).toEqual([]);
  });
});

describe('B3-1 — servis 3. Alan açılınca ARKA BANDA taşınır (D-062)', () => {
  it('taşınma eşiği: 1-2 alan sol duvar, 3 alan arka bant', () => {
    expect(serviceMoved(1)).toBe(false);
    expect(serviceMoved(2)).toBe(false);
    expect(serviceMoved(3)).toBe(true);
    expect(SP(1).areaIndex).toBe(0);
    expect(SP(3).areaIndex).toBe(2);
    expect(SP(1).station).not.toEqual(SP(3).station);
    expect(MAX_SERVICES).toBe(1); // taşındı ama İKİNCİ bir servis doğmadı
  });

  it('yön: sol duvarda uzun kenar z (+x bakar), arka bantta uzun kenar x (+z bakar)', () => {
    expect(SP(1).half[1]).toBeGreaterThan(SP(1).half[0]);
    expect(SP(1).rot).toBeCloseTo(Math.PI / 2, 6);
    expect(SP(3).half[0]).toBeGreaterThan(SP(3).half[1]);
    expect(SP(3).rot).toBe(0);
  });

  it('YERLEŞİM DEĞİŞMEZİ: servis kümesi her dönemde AÇIK bir alanın içinde', () => {
    for (const areasOpen of [1, 2, 3]) {
      const sp = SP(areasOpen);
      expect(sp.areaIndex).toBeLessThan(areasOpen); // erişilemez tezgâh olamaz
      expect(openServices(areasOpen)).toEqual([THE_SERVICE]);
      expect(serviceInArea(sp.areaIndex, areasOpen)).toBe(THE_SERVICE);
      const ab = LAYOUT.areaBounds[sp.areaIndex];
      for (const pt of [sp.station, sp.dish, sp.pickup, sp.upgradeSpot, sp.waiterHome, sp.dishwasherHome]) {
        expect(pt[0]).toBeGreaterThanOrEqual(ab.minX);
        expect(pt[0]).toBeLessThanOrEqual(ab.maxX);
        expect(pt[2]).toBeGreaterThanOrEqual(ab.minZ);
        expect(pt[2]).toBeLessThanOrEqual(ab.maxZ);
      }
    }
  });

  it('taşınma SEVİYEYİ sıfırlamaz (obje aynı obje, yalnız yeri değişti)', () => {
    useGame.getState().hardReset();
    useGame.setState({ padsDone: ['table2', 'table3', 'waiter', 'table4'], stationLevels: [3] });
    useGame.getState().tick(0.05);
    expect(useGame.getState().areasOpen).toBe(1);
    expect(useGame.getState().stationLevels[THE_SERVICE]).toBe(3);
    useGame.setState({
      padsDone: ['table2', 'table3', 'waiter', 'table4', 'zone2', 'z2table2', 'z2table3',
        'dishwasher', 'z2table4', 'zone3'],
    });
    useGame.getState().tick(0.05);
    expect(useGame.getState().areasOpen).toBe(3);
    expect(useGame.getState().stationLevels[THE_SERVICE]).toBe(3);
  });
});

describe('B3-1 — masalar, pad’ler ve rotalar yeni ölçekte tutarlı', () => {
  it('her masa + sandalyeleri + yükseltme noktası kendi alanının İÇİNDE', () => {
    for (let i = 0; i < LAYOUT.tables.length; i++) {
      const ab = LAYOUT.areaBounds[areaOfTable(i)];
      const t = LAYOUT.tables[i];
      for (const p of [t.table, ...t.seats, t.upgradeSpot]) {
        expect(p[0], `masa ${i}`).toBeGreaterThan(ab.minX);
        expect(p[0], `masa ${i}`).toBeLessThan(ab.maxX);
        expect(p[2], `masa ${i}`).toBeGreaterThan(ab.minZ);
        expect(p[2], `masa ${i}`).toBeLessThan(ab.maxZ);
      }
    }
  });

  it('PAD DOLUM DAİRELERİ KESİŞMEZ: iki pad aynı anda dolmaz', () => {
    const ids = Object.keys(LAYOUT.padPos);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = LAYOUT.padPos[ids[i]];
        const b = LAYOUT.padPos[ids[j]];
        const d = Math.hypot(a[0] - b[0], a[2] - b[2]);
        expect(d, `${ids[i]} ↔ ${ids[j]}`).toBeGreaterThanOrEqual(2 * PAD_RADIUS);
      }
    }
  });

  // Bu test B3-1'de GERÇEK bir kusur yakaladı: masa koordinatları nav ızgarasının hücre
  // merkezlerine denk düşünce BFS "yol yok" diyordu ve garson `navStep`'in düz-çizgi yedeğine
  // düşüyordu (masaya varıyor ama ENGELDEN KAÇMADAN). Çözüm: REACH_TABLE artık NAV_CELL'e bağlı.
  it('ROTA: servis noktasından KATIN HER MASASINA GERÇEK rota var (düz-çizgi yedeğine düşmeden)', () => {
    // B5a: son kademe 12 → 20 (şeridin tamamı). Elle yazılmış "12" bir kör nokta olurdu:
    // yeni sekiz banket birimine rota hiç sınanmazdı.
    for (const [areasOpen, tables] of [[1, 4], [2, 8], [3, 20]] as const) {
      const sp = SP(areasOpen);
      const grid = getNavGrid(tables, areasOpen);
      for (let i = 0; i < tables; i++) {
        const t = LAYOUT.tables[i].table;
        const path = findNavPath(grid, [sp.pickup[0], 0, sp.pickup[2]], t[0], t[2], REACH_TABLE);
        expect(path, `${areasOpen} alan · masa ${i}`).not.toBeNull();
      }
    }
  });
});
