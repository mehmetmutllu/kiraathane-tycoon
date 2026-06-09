/**
 * simulate.ts — Ekonomi v2 (D-010) BOTTLENECK modelini simüle eder ve her kilometre
 * taşına ~ne kadar sürede ulaşıldığını yazar. Dengeleme için config sayıları oynanıp
 * tekrar çalıştırılır.
 *
 * Çalıştır:  npx tsx tools/simulate.ts   (veya)  node --import tsx tools/simulate.ts
 *
 * Model (ZONE'lu, gece 5/7): gelir = Σ_zone min(talep_z, arz_z) × (sabit fiyat + bahşiş) × VERİM.
 *   - talep_z = zone'un masaları / döngü_z   (her masa döngü başına 1 çay tüketir)
 *   - arz_z   = 1 / demlemeSüresi_z          (per-zone ocak, D-022; kendi seviyesi)
 *   - VERİM (profil): idealize tavanın oyuncu tarafından gerçeklenen oranı.
 *     Sim eski sürümde hep 1.0 (idealize) idi; 3-profil raporu için parametre oldu.
 *     VARSAYILAN ÇIKTI yine 1.0 → "ilk-alım 60sn" denetimi DEĞİŞMEDİ.
 *
 * NOT (D-011): manuel tepsi servisi/bardak döngüsü gerçek-zamanlı darboğazlar idealize modellenmez;
 * VERİM çarpanı bu kayıpların toplamını temsil eder (profil gerekçeleri docs/curve-report.md).
 */
import {
  economyConfig as C,
  upgradeCost,
  upgradeOutputMultiplier,
  requiresMet,
  derivedFromPads,
  tableUpgradeCost,
  tableTip,
  MAX_ZONES,
  type GateState,
} from '../src/config/economy.config.ts';

const DT = 1; // saniyelik adım
const TEA_PRICE = C.teaStation.basePrice;
const SOFT_MAX = C.teaStation.upgrade.masterLevel - 1; // ₺ ile çıkılabilen en yüksek seviye
const TABLE_SOFT_MAX = C.tables.upgrade.masterLevel - 1;

// D-015: tables/zonesOpen ayrı tutulmaz; padsDone'dan türetilir (store ile aynı kaynak).
interface State {
  t: number;
  wallet: number;
  lifetime: number;
  stationLevels: number[]; // zone başına ocak seviyesi (v18 modeli)
  tableLevel: number; // idealize: tüm masalar eşit yükseltilir
  padsDone: string[];
}

function gateOf(s: State): GateState {
  return {
    padsDone: s.padsDone,
    tables: derivedFromPads(s.padsDone).tables,
    stationLevel: s.stationLevels[0],
    lifetime: s.lifetime,
  };
}

function brewTimeZ(s: State, z: number): number {
  const { serviceSpeedMult } = derivedFromPads(s.padsDone);
  return (C.npc.orderTime * serviceSpeedMult) / upgradeOutputMultiplier(C.teaStation.upgrade, s.stationLevels[z]);
}

// Zone'un gelir oranı (₺/sn): min(talep, arz) × (fiyat + bahşiş).
function rateZ(s: State, z: number): number {
  const d = derivedFromPads(s.padsDone);
  if (z >= d.zonesOpen) return 0;
  const bt = brewTimeZ(s, z);
  const cycle = C.npc.walkTime + bt + C.npc.eatTime;
  const demand = d.tablesByZone[z] / cycle;
  const supply = 1 / bt;
  return Math.min(demand, supply) * (TEA_PRICE + tableTip(s.tableLevel));
}

function rate(s: State, eff = 1): number {
  const d = derivedFromPads(s.padsDone);
  let r = 0;
  for (let z = 0; z < d.zonesOpen; z++) r += rateZ(s, z);
  return r * eff;
}

// Zone'un ocağı darboğaz mı (talep ≥ arz)? Akıllı oyuncu önce darboğaz ocağı yükseltir.
function ocakBottleneckZ(s: State, z: number): boolean {
  const d = derivedFromPads(s.padsDone);
  if (z >= d.zonesOpen) return false;
  const bt = brewTimeZ(s, z);
  const cycle = C.npc.walkTime + bt + C.npc.eatTime;
  return d.tablesByZone[z] / cycle > (1 / bt) * 0.95;
}

// Zone'un ocak yükseltmesi açık mı? (z1: table2 önkoşulu; z2: zone açık olması yeter — store ile aynı.)
function upgradeUnlockedZ(s: State, z: number): boolean {
  if (s.stationLevels[z] >= SOFT_MAX) return false;
  if (z === 0) return requiresMet(C.teaStation.upgradeRequires, gateOf(s));
  return s.padsDone.includes('zone2');
}

function tableUpgradeUnlocked(s: State): boolean {
  return requiresMet(C.tables.upgradeRequires, gateOf(s)) && s.tableLevel < TABLE_SOFT_MAX;
}

function currentPad(s: State) {
  const g = gateOf(s);
  return C.pads.find((p) => !p.optional && !s.padsDone.includes(p.id) && requiresMet(p.requires, g)) ?? null;
}

// Otomatik (akıllı) oyuncu: önce DARBOĞAZ ocak (en ucuz), sonra omurga pad'i, sonra açık ocak,
// en son masa-başı yükseltme (bahşiş). Zone-2 açılınca onun ocağı/masaları da akışa girer.
function trySpend(s: State): void {
  const d = derivedFromPads(s.padsDone);
  // 1) Darboğaz ocaklar (en ucuzu önce)
  let bz = -1;
  let bcost = Infinity;
  for (let z = 0; z < d.zonesOpen; z++) {
    if (ocakBottleneckZ(s, z) && upgradeUnlockedZ(s, z)) {
      const cost = upgradeCost(C.teaStation.upgrade, s.stationLevels[z] + 1);
      if (cost < bcost) { bcost = cost; bz = z; }
    }
  }
  if (bz >= 0) {
    if (s.wallet >= bcost) {
      s.wallet -= bcost;
      s.stationLevels[bz] += 1;
    }
    return;
  }
  // 2) Omurga pad'i
  const pad = currentPad(s);
  if (pad) {
    if (s.wallet >= pad.cost) {
      s.wallet -= pad.cost;
      s.padsDone.push(pad.id);
    }
    return;
  }
  // 3) Açık herhangi bir ocak yükseltmesi
  for (let z = 0; z < d.zonesOpen; z++) {
    if (upgradeUnlockedZ(s, z)) {
      const cost = upgradeCost(C.teaStation.upgrade, s.stationLevels[z] + 1);
      if (s.wallet >= cost) {
        s.wallet -= cost;
        s.stationLevels[z] += 1;
      }
      return;
    }
  }
  // 4) Masa yükseltme (idealize: tüm açık masalar eşit → bir seviye = masa sayısı × maliyet)
  if (tableUpgradeUnlocked(s)) {
    const cost = tableUpgradeCost(s.tableLevel) * d.tables;
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.tableLevel += 1;
    }
  }
}

interface Milestone { name: string; hit: (s: State) => boolean }
const MILESTONES: Milestone[] = [
  { name: 'İlk satın alma (2. Masa)', hit: (s) => s.padsDone.includes('table2') },
  { name: 'Çay ocağı L1 (z1)', hit: (s) => s.stationLevels[0] >= 1 },
  { name: '3. Masa', hit: (s) => s.padsDone.includes('table3') },
  { name: 'Garson', hit: (s) => s.padsDone.includes('waiter') },
  { name: 'Bulaşıkçı', hit: (s) => s.padsDone.includes('dishwasher') },
  { name: '4. Masa (zone-1 dolu)', hit: (s) => s.padsDone.includes('table4') },
  { name: 'Çay ocağı L4 (z1 semaver)', hit: (s) => s.stationLevels[0] >= SOFT_MAX },
  { name: 'ZONE-2 AÇILDI (₺1200)', hit: (s) => s.padsDone.includes('zone2') },
  { name: 'Z2: 2. Masa', hit: (s) => s.padsDone.includes('z2table2') },
  { name: 'Z2: Garson', hit: (s) => s.padsDone.includes('z2waiter') },
  { name: 'Z2: Bulaşıkçı', hit: (s) => s.padsDone.includes('z2dishwasher') },
  { name: 'Z2: 4. Masa (zone-2 dolu)', hit: (s) => s.padsDone.includes('z2table4') },
  { name: 'Masa yükseltme L1 (bahşiş)', hit: (s) => s.tableLevel >= 1 },
  { name: 'lifetime 1.000 ₺', hit: (s) => s.lifetime >= 1_000 },
  { name: 'lifetime 10.000 ₺', hit: (s) => s.lifetime >= 10_000 },
  { name: 'İlk prestige cazip (İtibar ≥ 1)', hit: (s) => s.lifetime >= C.prestige.repScale },
];

function fmtTime(sec: number): string {
  if (sec < 60) return `${sec.toFixed(0)} sn`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)} dk`;
  return `${(sec / 3600).toFixed(2)} sa`;
}

/** Bir profili koştur; milestone → saniye haritası döner. */
function runProfile(eff: number, log = false): Map<string, number> {
  const s: State = {
    t: 0, wallet: 0, lifetime: 0,
    stationLevels: Array.from({ length: MAX_ZONES }, () => 0),
    tableLevel: 0, padsDone: [],
  };
  const MAX_T = 60 * 60 * 6;
  const done = new Map<string, number>();
  while (s.t < MAX_T) {
    const inc = rate(s, eff) * DT;
    s.wallet += inc;
    s.lifetime += inc;
    s.t += DT;
    trySpend(s);
    for (const m of MILESTONES) {
      if (!done.has(m.name) && m.hit(s)) {
        done.set(m.name, s.t);
        if (log) {
          console.log(
            `  ✓ ${m.name.padEnd(34)} @ ${fmtTime(s.t).padStart(7)}  (oran ${rate(s, eff).toFixed(2)} ₺/sn, z1L${s.stationLevels[0]}/z2L${s.stationLevels[1]}, ${derivedFromPads(s.padsDone).tables} masa)`,
          );
        }
      }
    }
    if (done.size === MILESTONES.length) break;
  }
  return done;
}

function run() {
  console.log('=== Köşe Kıraathanesi — Ekonomi v2 Simülasyonu (zone\'lu bottleneck modeli) ===\n');
  const s0: State = { t: 0, wallet: 0, lifetime: 0, stationLevels: [0, 0], tableLevel: 0, padsDone: [] };
  console.log(`Sabit çay fiyatı: ${TEA_PRICE} ₺ · Başlangıç: 1 masa, oran ${rate(s0).toFixed(2)} ₺/sn\n`);

  console.log('--- İDEALİZE (verim 1.0 — tempo denetimi bununla) ---');
  const ideal = runProfile(1, true);

  console.log('\n--- Tempo denetimi (D-010 §3.6) ---');
  console.log('Hedef: ilk satın alma < 90 sn; ilk 5-10 dk her ~20-40 sn bir alım; otomasyon < 15 dk.');
  const first = ideal.get('İlk satın alma (2. Masa)');
  console.log(first != null && first <= 90 ? `İlk satın alma ${fmtTime(first)} ✓` : `İlk satın alma HEDEF DIŞI: ${first}`);
  const notHit = MILESTONES.filter((m) => !ideal.has(m.name)).map((m) => m.name);
  if (notHit.length) console.log('6 saatte ulaşılamayan:', notHit.join(', '));

  // 3-PROFİL raporu (gece 5/7; gerekçeler docs/curve-report.md)
  const profiles: [string, number][] = [
    ['Yoğun (aktif, verim 0.80)', 0.8],
    ['Normal (verim 0.55)', 0.55],
    ['Rahat (seyrek, verim 0.35)', 0.35],
  ];
  console.log('\n--- 3 PROFİL (milestone → süre) ---');
  const results = profiles.map(([name, eff]) => ({ name, res: runProfile(eff) }));
  const header = 'Milestone'.padEnd(34) + ' | ' + results.map((r) => r.name.split(' ')[0].padStart(8)).join(' | ');
  console.log(header);
  for (const m of MILESTONES) {
    const row = m.name.padEnd(34) + ' | ' +
      results.map((r) => (r.res.has(m.name) ? fmtTime(r.res.get(m.name)!) : '—').padStart(8)).join(' | ');
    console.log(row);
  }

  console.log('\n--- Servis kapasitesi (bilgi) ---');
  console.log(
    `Garson zinciri zorunlu (₺${C.pads.find((p) => p.id === 'waiter')?.cost}): hız L1 ${C.waiter.moveSpeedByLevel[0]}→L2 ${C.waiter.moveSpeedByLevel[1]} br/sn (₺${C.waiter.upgradeCost}), tepsi ${C.waiter.trayCapacity}. ` +
      `Zone-2 zinciri: unlock ₺${C.pads.find((p) => p.id === 'zone2')?.cost} + içi ₺${['z2table2', 'z2waiter', 'z2table3', 'z2dishwasher', 'z2table4'].reduce((a, id) => a + (C.pads.find((p) => p.id === id)?.cost ?? 0), 0)}.`,
  );
}

run();
