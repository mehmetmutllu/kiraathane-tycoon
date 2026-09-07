/**
 * room-b4.test.ts — Faz B4: ODA (lavabo) ve Kat 1'in SON gelir kolu.
 *
 * **Bu paketin bekçilik ettiği asıl değişmez: gelir kolunun NEREYE bindiği.**
 * B5b'nin ölçümü (D-066) Kat 1'de throughput kolunun tükendiğini gösterdi — arz servis L6'da
 * 0,78 fincan/sn'de tavan yapıyor, taşıma tavanı tam kadroda 1,25; çay/dk'da kalan tüm baş
 * boşluğu ×1,6 ve sonra ölü. Bu yüzden B4'ün kolu THROUGHPUT'a değil MÜŞTERİ BAŞINA ₺'ye biner
 * ve bunu yaparken fiyat/bahşiş kollarına HİÇ dokunmaz (D-010: çay 5 ₺ sabit).
 *
 * Kolun taşıyıcısı mekân: müşteri ödeyip kalkar, çıkmadan lavaboya uğrar, çıkışta parasını
 * odanın ÖNÜNDEKİ istife bırakır (kullanıcı kararı 2026-09-07). Yani gelir bir çarpanla değil,
 * oyuncunun gidip TOPLADIĞI ikinci bir istifle büyür.
 */
import { describe, it, expect } from 'vitest';
import {
  economyConfig,
  MAX_TABLES,
  lavaboFee,
  lavaboIncomePerCustomer,
  lavaboMaxLevel,
  lavaboUpgradeCost,
  lavaboVisitChance,
  requiresMet,
  type PadDef,
} from '../src/config/economy.config';
import { deriveWorld, roomOpen } from '../src/game/world';
import { BAND, LAYOUT, LAVABO, PAD_RADIUS, useGame } from '../src/game/store';
import { TABLE_UP_RADIUS } from '../src/game/layout';
import { incomeRate, occupiedSeats, hasLeftTable } from '../src/game/rules';
import { defaultSave, loadSave } from '../src/game/save';
import type { Npc, NpcState } from '../src/game/types';

const ALL_PADS = economyConfig.pads.filter((p) => !p.optional).map((p) => p.id);
const dist2 = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const seatedNpc = (id: number, state: NpcState): Npc => ({
  id,
  pos: [...LAYOUT.tables[0].seat] as [number, number, number],
  state,
  timer: 0.01,
  tableIndex: 0,
  seatIndex: 0,
  color: '#ffffff',
  product: 'tea',
});

describe('B4 — ODA modeli: lavabo padsDone içinden türetilir, oturma EKLEMEZ', () => {
  it('lavabo pad tamamlanınca world.rooms büyür; masa/koltuk sayısı DEĞİŞMEZ', () => {
    const before = deriveWorld(ALL_PADS.filter((id) => id !== 'lavabo'));
    const after = deriveWorld(ALL_PADS);
    expect(roomOpen(before, 'lavabo')).toBe(false);
    expect(roomOpen(after, 'lavabo')).toBe(true);
    // ODA'nın tanımı bu: hacim ekler, KAPASİTE eklemez. (Alan pad'i masa getirir, oda getirmez.)
    expect(after.tables.length).toBe(before.tables.length);
    expect(after.areasOpen).toBe(before.areasOpen);
    expect(after.rooms.map((r) => r.kind)).toEqual(['lavabo']);
  });

  it('zincirdeki yeri: waiter3 sonrası, şeritten ÖNCE (D-066 kol sırası)', () => {
    const lav = economyConfig.pads.find((p) => p.id === 'lavabo') as PadDef;
    const t5 = economyConfig.pads.find((p) => p.id === 'z3table5') as PadDef;
    expect((lav.requires as { prev?: string[] }).prev).toEqual(['waiter3']);
    expect((t5.requires as { prev?: string[] }).prev).toEqual(['lavabo']);
    // Gate SIRALANABİLİR olmalı (chain-b5b kuralı): yalnız prev — tempo gate'i taşımıyor.
    expect(Object.keys(lav.requires ?? {})).toEqual(['prev']);
    const upToW3 = ALL_PADS.slice(0, ALL_PADS.indexOf('waiter3') + 1);
    const gate = (done: string[]) => ({ padsDone: done, tables: MAX_TABLES, stationLevel: 6, lifetime: 1e6 });
    expect(requiresMet(lav.requires, gate(upToW3.slice(0, -1)))).toBe(false);
    expect(requiresMet(lav.requires, gate(upToW3))).toBe(true);
  });
});

describe('B4 — gelir kolu MÜŞTERİ BAŞINA biner, throughput ve fiyata DEĞİL', () => {
  it('oda kapalıyken (L0) kol sıfırdır → incomeRate birebir B4 öncesi', () => {
    expect(lavaboVisitChance(0)).toBe(0);
    expect(lavaboFee(0)).toBe(0);
    expect(lavaboIncomePerCustomer(0)).toBe(0);
    for (const level of [0, 3, 6]) {
      expect(incomeRate(12, level, 40, 0)).toBeCloseTo(incomeRate(12, level, 40), 10);
    }
  });

  it('çay fiyatı ve bahşiş SABİT kalır — kol yalnız üçüncü bir kalem ekler (D-010 delinmez)', () => {
    // Oda büyürken PRODUCTS ve tipBase'e dokunulmaz; artan tek şey müşteri başına ek ödeme.
    expect(economyConfig.service.basePrice).toBe(5);
    const withRoom = incomeRate(12, 6, 40, lavaboMaxLevel());
    const without = incomeRate(12, 6, 40, 0);
    // Fark TAM OLARAK masa × müşteri-başı-ödeme / döngü kadar (fiyat/bahşiş terimleri aynı).
    expect(withRoom - without).toBeCloseTo(incomeRate(12, 6, 0, lavaboMaxLevel()) - incomeRate(12, 6, 0, 0), 10);
    expect(lavaboIncomePerCustomer(lavaboMaxLevel())).toBeGreaterThan(0);
  });

  it('eğri: her seviye müşteri başına ödemeyi büyütür, ivme dar bir bantta kalır', () => {
    const per = Array.from({ length: lavaboMaxLevel() }, (_, i) => lavaboIncomePerCustomer(i + 1));
    for (let i = 1; i < per.length; i++) {
      expect(per[i], 'seviye ' + (i + 1) + ' > seviye ' + i).toBeGreaterThan(per[i - 1]);
      const ratio = per[i] / per[i - 1];
      // Onaylı ivme (kullanıcı 2026-09-07): gelirin toplam adımı ×1,38. Müşteri başına ödemenin
      // kendi oranı bunun karşılığı olarak ~×1,55 — bandın dışına çıkarsa plato ölçümü yalan olur.
      expect(ratio, 'oran L' + i + '→L' + (i + 1)).toBeGreaterThan(1.4);
      expect(ratio, 'oran L' + i + '→L' + (i + 1)).toBeLessThan(1.7);
    }
    // İKİ okunur sinyal birlikte büyür (tek sinyal yetmez): uğrama oranı VE bırakılan ₺.
    for (let l = 2; l <= lavaboMaxLevel(); l++) {
      expect(lavaboVisitChance(l)).toBeGreaterThan(lavaboVisitChance(l - 1));
      expect(lavaboFee(l)).toBeGreaterThan(lavaboFee(l - 1));
    }
  });

  it('maliyet merdiveni: L1 pad ile gelir, L2..L6 yükseltme noktasından; tavanda null', () => {
    expect(lavaboUpgradeCost(0)).toBeNull(); // oda kapalı → yükseltilecek bir şey yok
    expect(lavaboUpgradeCost(lavaboMaxLevel())).toBeNull(); // ₺ tavanı
    const costs = Array.from({ length: lavaboMaxLevel() - 1 }, (_, i) => lavaboUpgradeCost(i + 1) as number);
    expect(costs.length).toBe(economyConfig.rooms.lavabo.upgradeCosts.length);
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1]);
  });
});

describe('B4 — yerleşim: lavabo noktası hiçbir etkileşimle çakışmaz', () => {
  it('pad ↔ pad ve pad ↔ masa yükseltme mesafeleri eşiğin üstünde', () => {
    const spot = LAVABO.spot;
    expect(LAYOUT.padPos.lavabo).toEqual(spot); // pad ile yükseltme noktası AYNI yer (obje-başı)
    for (const [id, p] of Object.entries(LAYOUT.padPos)) {
      if (id === 'lavabo') continue;
      expect(dist2(spot, p), 'lavabo ile ' + id).toBeGreaterThanOrEqual(2 * PAD_RADIUS);
    }
    for (let i = 0; i < MAX_TABLES; i++) {
      expect(dist2(spot, LAYOUT.tables[i].upgradeSpot), 'lavabo ile masa ' + i + ' yükseltme')
        .toBeGreaterThanOrEqual(PAD_RADIUS + TABLE_UP_RADIUS);
    }
  });

  it('oda bandın wc bloğunun içinde; para istifi YÜRÜNEN alanda (toplanabilir)', () => {
    expect(LAVABO.spot[0]).toBeGreaterThan(BAND.wc.minX);
    expect(LAVABO.spot[0]).toBeLessThan(BAND.wc.maxX);
    // Kapı bandın ön yüzünde; nokta ve istif alanın İÇİNDE kalır (yoksa para toplanamaz).
    expect(LAVABO.coinSpot[2]).toBeGreaterThan(LAYOUT.area.minZ);
    expect(LAVABO.spot[2]).toBeGreaterThan(LAYOUT.area.minZ);
  });
});

describe('B4 — CANLI: müşteri lavaboya uğrar, koltuğu boşalır, para ODANIN ÖNÜNE düşer', () => {
  it('içen müşteri lavaboya girer (görünmez), çıkışta ücreti lavabonun önünde birikir', () => {
    useGame.getState().hardReset();
    // Uğrama OLASILIKLI (kolun parçası). Tek tick'te 20 müşteriyi birden kaldırıyoruz: %55'lik
    // uğrama oranında hiçbirinin uğramama olasılığı ~1e-6 — deneme döngüsü kurmadan (ve diğer
    // CANLI testlerin CPU bütçesini yemeden) kolun çalıştığı görülür.
    const drinkers = Array.from({ length: 20 }, (_, i) => seatedNpc(i + 1, 'drinking'));
    useGame.setState({
      padsDone: [...ALL_PADS], lavaboLevel: lavaboMaxLevel(), spawnTimer: 1e9,
      coins: [], npcs: drinkers,
    });
    useGame.getState().tick(0.1);
    const toWc = useGame.getState().npcs.filter((n) => n.state === 'toWc');
    expect(toWc.length, 'ödeyip kalkanların bir kısmı lavaboya yöneldi').toBeGreaterThan(0);

    // Kapıya kadarki YÜRÜYÜŞ rota testlerinin işi (layout-b32); burası kolun kendisini ölçüyor,
    // o yüzden müşteri kapının hemen önüne konur.
    const near = toWc[0];
    near.pos[0] = LAVABO.spot[0];
    near.pos[2] = LAVABO.spot[2] + 1.2;
    useGame.setState({ coins: [], npcs: [near] });

    let sawInside = false;
    for (let i = 0; i < 200; i++) {
      useGame.getState().tick(0.1);
      const n = useGame.getState().npcs[0];
      if (n?.state === 'inWc') sawInside = true;
      if (!n || n.state === 'leaving') break;
    }
    expect(sawInside, 'müşteri odanın İÇİNDE bir kare geçirdi').toBe(true);
    const newCoins = useGame.getState().coins;
    expect(newCoins.length, 'çıkışta bir ödeme bırakıldı').toBeGreaterThan(0);
    const wc = newCoins[newCoins.length - 1];
    // Para MASANIN yanına değil ODANIN önüne düşer — kolun mekânsal karşılığı bu.
    expect(dist2(wc.pos, LAVABO.coinSpot)).toBeLessThan(1.0);
    expect(dist2(wc.pos, LAYOUT.tables[0].table)).toBeGreaterThan(2.0);
    expect(wc.value).toBeCloseTo(lavaboFee(lavaboMaxLevel()), 6);
  });

  it('lavaboya giden müşteri KOLTUĞU tutmaz (kalkmıştır) — masa yeni gruba açıktır', () => {
    // occupiedSeats, 'leaving' gibi 'toWc'/'inWc' durumlarını da KALKMIŞ sayar; yoksa masa
    // boşken kilitli kalır ve şeridin masaları sebepsiz doluymuş gibi görünürdü.
    expect(hasLeftTable('toWc')).toBe(true);
    expect(hasLeftTable('inWc')).toBe(true);
    expect(hasLeftTable('drinking')).toBe(false);
    expect(occupiedSeats([seatedNpc(1, 'toWc'), seatedNpc(2, 'inWc')]).size).toBe(0);
    expect(occupiedSeats([seatedNpc(1, 'drinking')]).size).toBe(1);
  });
});

/** node test ortamında localStorage yok → gerçek persistence'ı geçici bellek mock'uyla doğrula. */
function withStorage(fn: () => void): void {
  const mem: Record<string, string> = {};
  const g = globalThis as Record<string, unknown>;
  const orig = g.localStorage;
  g.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
  try {
    fn();
  } finally {
    g.localStorage = orig;
  }
}

describe('B4 — kayıt: seviye PERSIST, oda türetilir; çelişki SIZAMAZ', () => {
  it('lavaboLevel kayıtta taşınır (additive alan — sürüm artmadı)', () => withStorage(() => {
    expect(defaultSave().lavaboLevel).toBe(0);
    useGame.getState().hardReset();
    useGame.setState({ padsDone: [...ALL_PADS], lavaboLevel: 4 });
    useGame.getState().saveNow();
    expect(loadSave().lavaboLevel).toBe(4);
    useGame.getState().init();
    expect(useGame.getState().lavaboLevel).toBe(4);
  }));

  it('oda KAPALIYKEN kayıttaki seviye sızamaz; açıkken en az 1 olur', () => withStorage(() => {
    useGame.getState().hardReset();
    useGame.setState({ padsDone: ['table2'], lavaboLevel: 5 });
    useGame.getState().saveNow();
    useGame.getState().init();
    expect(useGame.getState().lavaboLevel).toBe(0);

    useGame.setState({ padsDone: [...ALL_PADS], lavaboLevel: 0 });
    useGame.getState().saveNow();
    useGame.getState().init();
    expect(useGame.getState().lavaboLevel).toBe(1); // oda açıksa kol AKAR (boş kabuk olmaz)
  }));
});
