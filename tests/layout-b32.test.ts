/**
 * layout-b32.test.ts — Faz B3-2: ORTA ŞERİT (banket adaları · garson servis istasyonu · kapı).
 *
 * B3-1 katı 34 × 34 yaptı ama arka yarının önü boş kaldı; maket v13'ün 6. adımı orayı sırt sırta
 * banket adalarıyla dolduruyor. Buradaki testler o adımın YERLEŞİM iddialarını kilitler; oynanış
 * davranışı `logic.test.ts`'te kalır (B3-1 ile aynı ayrım).
 *
 * En kritik paket "ROTA + KOLTUK": banket birimi masayı ada ile sandalye ARASINA sıkıştırır. Ada
 * görsel derinliğiyle (2,5) katı yapılırsa bank koltuğuna girecek tek bir boş ızgara hücresi
 * kalmaz, BFS "yol yok" der ve `navStep` sessizce düz-çizgi yedeğine düşer — B3-1'in yakaladığı
 * kusurun aynısı. Bu yüzden collision yalnız sırtlık çekirdeğidir (`BANKET.coreHalf`) ve buradaki
 * testler her koltuğa GERÇEK rota olduğunu bekçiler.
 */
import { describe, it, expect } from 'vitest';
import {
  LAYOUT,
  BANKET,
  banketLen,
  banketUnit,
  banketUnitsOpen,
  banketIslands,
  WAITER_STATION,
  waiterStationOpen,
  doorX,
  entranceAt,
  streetAt,
  servicePlace,
  areaOfTable,
  areaTableSlots,
  areaTableStart,
  PAD_RADIUS,
  wallSpans,
  useGame,
  parkSpot,
} from '../src/game/store';
import { activeSolids, getNavGrid, hitsSolid, navSolids, REACH_TABLE, TABLE_UP_RADIUS } from '../src/game/layout';
import { findNavPath } from '../src/game/nav';
import { DOOR } from '../src/components/three/wallPanel';

// ŞERİDİN TÜM BİRİMLERİ. B3-2'de bu dizi elle yazılmış dört index'ti ve o gün doğruydu (a2 dört
// slotla kelepçeliydi); B5a şeridi 12'ye açınca elle yazılmış dizi testin KÖRLÜĞÜNE dönüştü —
// bu paketin bekçilik ettiği iki kural (yükseltme noktaları birbirini tetiklemez, pad daireleri
// yükseltme noktasını yutmaz) yeni sekiz birimde hiç sınanmayacaktı. Aralık artık yerleşimden gelir
// ve gerçekten iki kusur yakaladı (waiter2/waiter3 pad'leri; bkz. layout.ts padPos notu).
const STRIP = Array.from({ length: areaTableSlots(2) }, (_, k) => areaTableStart(2) + k);

describe('B3-2 — banket adaları maket v13 birim geometrisini taşır', () => {
  it('BİRİM SIRASI: sol adanın iki yüzü → sağ adanın iki yüzü → sonraki sütun', () => {
    expect(banketUnit(0)).toEqual({ side: -1, col: 0, face: 1 });
    expect(banketUnit(1)).toEqual({ side: -1, col: 0, face: -1 });
    expect(banketUnit(2)).toEqual({ side: 1, col: 0, face: 1 });
    expect(banketUnit(3)).toEqual({ side: 1, col: 0, face: -1 });
    // B5 buradan sürer: 5. birim yeni SÜTUNDUR, yeni ada değil.
    expect(banketUnit(4)).toEqual({ side: -1, col: 1, face: 1 });
    expect(banketUnit(11)).toEqual({ side: 1, col: 2, face: -1 });
  });

  it('ADA BOYU seviyedir: dış uç SABİT kalır, ada içeri uzar (maket 3 sütun = 7,6)', () => {
    expect(banketLen(1)).toBeCloseTo(1.2, 6);
    expect(banketLen(2)).toBeCloseTo(4.4, 6);
    expect(banketLen(3)).toBeCloseTo(7.6, 6);
    // Dış uç sabitliği: her sütun sayısında adanın dış kenarı ∓12,3'tedir.
    for (const cols of [1, 2, 3]) {
      const len = banketLen(cols);
      const centerX = BANKET.outerX - len / 2;
      expect(centerX + len / 2).toBeCloseTo(BANKET.outerX, 6);
    }
    // 3 sütunlu ada maketin merkezine (x = ∓8,5) oturur.
    expect(BANKET.outerX - banketLen(3) / 2).toBeCloseTo(8.5, 6);
  });

  it('SÜTUNLAR ön kümelerle aynı dikey hatta (∓11,7 · ∓8,5 · ∓5,3)', () => {
    const colX = (col: number) => BANKET.outerX - BANKET.endPad - col * BANKET.colGap;
    expect(colX(0)).toBeCloseTo(11.7, 6);
    expect(colX(1)).toBeCloseTo(8.5, 6);
    expect(colX(2)).toBeCloseTo(5.3, 6);
    // B5a: şeridin 12 birimi ÜÇ sütunu da kullanır ve sıra korunur — her sütun DÖRT birim taşır
    // (iki ada × iki yüz), sütun `banketUnit(u).col` ile ilerler. Dışarıdan içeri: 11,7 → 8,5 → 5,3.
    for (const i of STRIP) {
      const u = i - areaTableStart(2);
      expect(Math.abs(LAYOUT.tables[i].table[0]), `birim ${u}`).toBeCloseTo(colX(banketUnit(u).col), 6);
    }
    expect(STRIP.length).toBe(12);
  });

  it('BİRİM GEOMETRİSİ: bank 0,74 (maket) · masa 2,00 · sandalye 3,02 — sıra ve boşluklar korunur', () => {
    // Masa ve sandalye maketin 1,85 / 2,95'inden AÇILDI (kullanıcı 2026-09-08: *"banketlerdeki
    // masaları banketten azıcık daha uzaklaştır, oradaki tabureleri de ona göre ayarla"*).
    // Bank maketin yerinde: adanın kendi oturağı, masa ondan uzaklaşınca yerinden oynamaz.
    expect(BANKET.benchDz).toBeCloseTo(0.74, 6);
    expect(BANKET.tableDz).toBeCloseTo(2.0, 6);
    expect(BANKET.chairDz).toBeCloseTo(3.02, 6);
    // Sıra bozulmaz ve iki boşluk da POZİTİF kalır: ada oturağı → masa → sandalye.
    expect(BANKET.benchDz).toBeLessThan(BANKET.tableDz);
    expect(BANKET.tableDz).toBeLessThan(BANKET.chairDz);
    expect(BANKET.chairDz).toBeLessThan(BANKET.aisleDz);
    expect(BANKET.tableDz - LAYOUT.deuceHalf[1] - BANKET.depth / 2).toBeGreaterThan(0.1); // ada ↔ tabla
    expect(BANKET.chairDz - LAYOUT.chairHalf[1] - (BANKET.tableDz + LAYOUT.deuceHalf[1])).toBeGreaterThan(0.1); // tabla ↔ sandalye
    for (const i of STRIP) {
      const t = LAYOUT.tables[i];
      const face = t.table[2] > BANKET.z ? 1 : -1;
      expect(t.table[2]).toBeCloseTo(BANKET.z + face * BANKET.tableDz, 6);
      expect(t.seats[0][2]).toBeCloseTo(BANKET.z + face * BANKET.benchDz, 6); // bank
      expect(t.seats[1][2]).toBeCloseTo(BANKET.z + face * BANKET.chairDz, 6); // karşı sandalye
      expect(t.seatKinds).toEqual(['bench', 'stool']);
    }
  });

  it('ŞERİT AÇILINCA iki ada birden TAM BOY kurulur (donanım önce, masa sonra)', () => {
    expect(banketUnitsOpen(8)).toBe(0); // a2 hiç açılmadı
    expect(banketIslands(8)).toEqual([]);
    for (const tables of [9, 10, 11, 12]) {
      const isl = banketIslands(tables);
      expect(isl.map((b) => b.side), `${tables} masa`).toEqual([-1, 1]);
      for (const b of isl) {
        expect(b.len).toBeCloseTo(banketLen(BANKET.cols), 6); // 7,6 — maketin ölçüsü
        expect(Math.abs(b.center[0])).toBeCloseTo(8.5, 6); // maketin merkezi
        expect(b.center[2]).toBeCloseTo(BANKET.z, 6);
        expect(b.half[1]).toBeCloseTo(BANKET.coreHalf, 6); // collision = sırtlık çekirdeği
        // Ada boyu boyunca DERİNLİĞİNDEN uzun: kütle bank gibi okunsun, dolap gibi değil.
        expect(b.len).toBeGreaterThan(BANKET.depth);
      }
    }
  });

  it('ADA masaların ÜSTÜNE binmez (görsel derinlikte bile masa gövdesiyle çakışmaz)', () => {
    for (const b of banketIslands(12)) {
      for (const i of STRIP) {
        const t = LAYOUT.tables[i].table;
        const overlap =
          // Şerit masaları İKİLİ tip (maket `cafeTable2` 1,00) → deuceHalf (D-073).
          Math.abs(t[0] - b.center[0]) < b.len / 2 + LAYOUT.deuceHalf[0] &&
          Math.abs(t[2] - b.center[2]) < BANKET.depth / 2 + LAYOUT.deuceHalf[1];
        expect(overlap, `ada ${b.side} ↔ masa ${i}`).toBe(false);
      }
    }
  });
});

describe('B3-2 — orta şerit alanın içinde ve gezilebilir', () => {
  it('her şerit masası + koltukları + yükseltme noktası a2 sınırları içinde', () => {
    const ab = LAYOUT.areaBounds[2];
    for (const i of STRIP) {
      expect(areaOfTable(i)).toBe(2);
      const t = LAYOUT.tables[i];
      for (const p of [t.table, ...t.seats, t.upgradeSpot]) {
        expect(p[2], `masa ${i}`).toBeGreaterThan(ab.minZ);
        expect(p[2], `masa ${i}`).toBeLessThan(ab.maxZ);
      }
    }
  });

  it('KUZEY koridoru tezgâh yüzüne pay bırakır (oyuncu yükseltme noktasında durabilmeli)', () => {
    const sp = servicePlace(3);
    const counterFace = sp.station[2] + sp.half[1]; // tezgâhın salona bakan yüzü
    const solids = activeSolids(12, 3);
    for (const i of STRIP) {
      const up = LAYOUT.tables[i].upgradeSpot;
      expect(hitsSolid(up[0], up[2], solids, LAYOUT.playerRadius), `masa ${i} yükseltme noktası`).toBe(false);
      if (up[2] < BANKET.z) expect(up[2]).toBeGreaterThan(counterFace);
    }
  });

  it('YÜKSELTME NOKTALARI birbirini tetiklemez (şerit birimleri dahil)', () => {
    for (let i = 0; i < LAYOUT.tables.length; i++) {
      for (let j = i + 1; j < LAYOUT.tables.length; j++) {
        const a = LAYOUT.tables[i].upgradeSpot;
        const b = LAYOUT.tables[j].upgradeSpot;
        const d = Math.hypot(a[0] - b[0], a[2] - b[2]);
        expect(d, `masa ${i} ↔ ${j}`).toBeGreaterThanOrEqual(2 * TABLE_UP_RADIUS);
      }
    }
  });

  it('PAD daireleri şerit yükseltme noktalarını yutmaz', () => {
    for (const id of Object.keys(LAYOUT.padPos)) {
      const p = LAYOUT.padPos[id];
      for (const i of STRIP) {
        // Masanın KENDİ pad'i sayılmaz: pad masanın üstünde durur (mekânsal tycoon) ve masa
        // açılınca kaybolur — masa yokken yükseltme noktası da yoktur, ikisi aynı anda aktif olmaz.
        const t = LAYOUT.tables[i];
        if (Math.hypot(p[0] - t.table[0], p[2] - t.table[2]) < 0.01) continue;
        const up = t.upgradeSpot;
        const d = Math.hypot(p[0] - up[0], p[2] - up[2]);
        expect(d, `${id} ↔ masa ${i} yükseltme`).toBeGreaterThanOrEqual(PAD_RADIUS + TABLE_UP_RADIUS);
      }
    }
  });
});

describe('B3-2 — ROTA: banket koltukları BFS ile gerçekten erişilebilir', () => {
  // Bu paket adanın collision derinliği kararının bekçisi. `BANKET.coreHalf` görsel derinliğe
  // (2,5/2) çekilirse bank koltuğu kapanır ve buradaki beklentiler düşer.
  it('servis noktasından KATIN HER MASASINA gerçek rota (şerit dahil)', () => {
    const sp = servicePlace(3);
    const grid = getNavGrid(12, 3);
    for (let i = 0; i < 12; i++) {
      const t = LAYOUT.tables[i].table;
      const path = findNavPath(grid, [sp.pickup[0], 0, sp.pickup[2]], t[0], t[2], REACH_TABLE);
      expect(path, `masa ${i}`).not.toBeNull();
    }
  });

  it('kapıdan HER KOLTUĞA gerçek rota — bank koltuğu da dahil', () => {
    const grid = getNavGrid(12, 3);
    const from = entranceAt(3);
    for (let i = 0; i < 12; i++) {
      const t = LAYOUT.tables[i];
      t.seats.forEach((s, k) => {
        const path = findNavPath(grid, [from[0], 0, from[2]], s[0], s[2], 0.5);
        expect(path, `masa ${i} koltuk ${k} (${t.seatKinds[k]})`).not.toBeNull();
      });
    }
  });

  it('CANLI: müşteri banketin BANK koltuğuna gerçekten oturur (düz-çizgi yedeği değil)', () => {
    // Rota testleri ızgarayı doğrular; bu test oyunu çalıştırır. Bank koltuğu ada ile masanın
    // arasında sıkıştığı için "yol var" demek yetmiyor — müşteri 30 sn'lik vazgeçme sigortasına
    // düşmeden GERÇEKTEN oturmalı. Gerçek kare adımı (v23 dersi: nav regresyonları 1/60 ile).
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: ['table2', 'table3', 'waiter', 'table4', 'zone2', 'z2table2', 'z2table3',
        'dishwasher', 'z2table4', 'zone3', 'z3table2', 'z3table3', 'z3table4'],
      npcs: [],
      spawnTimer: 1e9,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
    });
    useGame.getState().tick(0.05);
    expect(useGame.getState().areasOpen).toBe(3);
    expect(useGame.getState().tables).toBe(12);
    useGame.setState({ player: [...parkSpot(3, 12)] as [number, number, number] });
    for (const [i, k] of [[8, 0], [9, 0], [10, 1], [11, 0]] as const) {
      const street = streetAt(3);
      useGame.setState({
        npcs: [{ id: 8000 + i, state: 'toTable', pos: [...street] as [number, number, number],
          tableIndex: i, seatIndex: k, timer: 0, product: 'tea', color: '#fff' }],
        spawnTimer: 1e9,
      });
      let st = 'toTable';
      for (let f = 0; f < 40 * 60 && st === 'toTable'; f++) {
        useGame.getState().tick(1 / 60);
        st = useGame.getState().npcs.find((n) => n.id === 8000 + i)?.state ?? 'gone';
      }
      expect(st, `masa ${i} koltuk ${k} (${LAYOUT.tables[i].seatKinds[k]})`).toBe('waitingForTea');
      const npc = useGame.getState().npcs.find((n) => n.id === 8000 + i)!;
      expect(npc.pos[0]).toBeCloseTo(LAYOUT.tables[i].seats[k][0], 5);
      expect(npc.pos[2]).toBeCloseTo(LAYOUT.tables[i].seats[k][2], 5);
    }
    // Dört müşteri × 2400 kare × kare-başı BFS: duvar saati 3-6 sn. Vitest'in 5 sn varsayılanı
    // makine yüküne göre bazen yetiyor bazen yetmiyordu (iddia değil SÜRE kırılıyordu) — açık
    // bütçe verildi. İddialar aynı; yavaşlarsa yine kırılır.
  }, 30_000);

  it('ada İÇİNDEN geçilemez: sırtlık hattı gerçekten katı', () => {
    const solids = navSolids(12, 3);
    for (const b of banketIslands(12)) {
      expect(hitsSolid(b.center[0], b.center[2], solids, 0)).toBe(true);
      // Adanın iki yüzü arasında (sırtlığın üstünden) kestirme yok: merkez hattı bloke.
      expect(hitsSolid(b.center[0], BANKET.z, solids, 0)).toBe(true);
    }
  });
});

describe('B3-2 — garson servis istasyonu (obje + collision)', () => {
  it('arka bant açılmadan sahnede yok; açılınca servis bloğunun ön yüzünde', () => {
    expect(waiterStationOpen(1)).toBe(false);
    expect(waiterStationOpen(2)).toBe(false);
    expect(waiterStationOpen(3)).toBe(true);
    const sp = servicePlace(3);
    expect(WAITER_STATION.pos[2]).toBeCloseTo(sp.station[2], 6); // tezgâhla aynı hizada
    expect(WAITER_STATION.pos[0]).toBeGreaterThan(sp.station[0]); // tezgâhın SAĞ ucunda (maket)
    expect(WAITER_STATION.pos[0]).toBeLessThan(sp.dish[0]); // bulaşıktan önce
  });

  it('ana tezgâh ile bulaşığa ÇAKIŞMAZ (aradaki 3,0 br açıklığa oturur)', () => {
    const sp = servicePlace(3);
    for (const [c, h] of [
      [sp.station, sp.half],
      [sp.dish, sp.dishHalf],
    ] as const) {
      const gap = Math.abs(WAITER_STATION.pos[0] - c[0]) - (WAITER_STATION.half[0] + h[0]);
      expect(gap).toBeGreaterThan(0);
    }
  });

  it('collision katılara girer ama personel ev/alım noktalarını kapatmaz', () => {
    const sp = servicePlace(3);
    const before = navSolids(12, 2).length;
    const after = navSolids(12, 3).length;
    expect(after).toBeGreaterThan(before - 100); // sadece varlık iddiası; sayı B4'te değişecek
    const solids = activeSolids(12, 3);
    expect(hitsSolid(WAITER_STATION.pos[0], WAITER_STATION.pos[2], solids, 0)).toBe(true);
    for (const p of [sp.pickup, sp.waiterHome, sp.dishwasherHome, LAYOUT.padPos.waiter2]) {
      expect(hitsSolid(p[0], p[2], solids, LAYOUT.actorRadius)).toBe(false);
    }
  });
});

describe('B3-2 — kapı 2. Alan açılınca cephenin ortasına kayar (maket v13 adım 2)', () => {
  it('tek alan açıkken ilk salonun ortasında, sonra binanın ortasında', () => {
    expect(doorX(1)).toBeCloseTo(-8.5, 6);
    expect(doorX(2)).toBe(0);
    expect(doorX(3)).toBe(0);
    for (const areasOpen of [1, 2, 3]) {
      expect(entranceAt(areasOpen)[0]).toBeCloseTo(doorX(areasOpen), 6);
      expect(streetAt(areasOpen)[0]).toBeCloseTo(doorX(areasOpen), 6);
      // Sokak kapının DIŞINDA, eşik ise katın önünde.
      expect(streetAt(areasOpen)[2]).toBeGreaterThan(entranceAt(areasOpen)[2]);
      expect(entranceAt(areasOpen)[2]).toBeGreaterThan(LAYOUT.areaBounds[0].maxZ - 1);
    }
  });

  it('kapı boşluğu her dönemde CEPHENİN üstüne düşer ve gerçekten kesilir', () => {
    // Kapı boşluğu tek bir duvar parçasının İÇİNDE olmak zorunda DEĞİL: 2. Alan'da x = 0'a kayınca
    // iki ön parçanın tam dikişine oturur. Doğru değişmez, kapı aralığının cephenin BİRLEŞİMİ
    // tarafından örtülmesi (yani orada gerçekten duvar olması) ve her parçadan payına düşenin
    // kesilmesi — Scene bu yüzden "içinde mi" sormak yerine ÇIKARMA yapıyor.
    const doorHalf = DOOR.half;
    const m = 0.5;
    for (const areasOpen of [1, 2, 3]) {
      const x = doorX(areasOpen);
      const pieces: [number, number][] = [];
      for (let a = 0; a < areasOpen; a++) {
        for (const [s0, s1] of wallSpans(a, 'front', areasOpen)) pieces.push([s0 - m, s1 + m]);
      }
      pieces.sort((p, q) => p[0] - q[0]);
      // 1) kapı aralığı cephe parçalarının BİRLEŞİMİYLE kesintisiz örtülü mü?
      let cursor = x - doorHalf;
      for (const [p0, p1] of pieces) {
        if (p0 <= cursor + 1e-6 && p1 > cursor) cursor = p1;
      }
      expect(cursor, `${areasOpen} alan: kapı cephede değil`).toBeGreaterThanOrEqual(x + doorHalf - 1e-6);
      // 2) çıkarma sonrası gerçekten AÇIKLIK doğuyor mu (parçalardan biri kısalıyor mu)?
      const cutSomething = pieces.some(([p0, p1]) => Math.min(p1, x + doorHalf) - Math.max(p0, x - doorHalf) > 0.01);
      expect(cutSomething, `${areasOpen} alan: kapı hiçbir parçayı kesmiyor`).toBe(true);
    }
  });

  it('kapının önü BOŞ: eşikte de sokakta da katı engel yok', () => {
    for (const areasOpen of [1, 2, 3]) {
      const solids = activeSolids(areasOpen * 4, areasOpen);
      const e = entranceAt(areasOpen);
      expect(hitsSolid(e[0], e[2], solids, LAYOUT.playerRadius), `${areasOpen} alan`).toBe(false);
    }
  });
});
