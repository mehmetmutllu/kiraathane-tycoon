/**
 * simulate.ts — Ekonomi v2 (D-010) BOTTLENECK modelini simüle eder ve her kilometre
 * taşına ~ne kadar sürede ulaşıldığını yazar. Dengeleme için config sayıları oynanıp
 * tekrar çalıştırılır.
 *
 * Çalıştır:  npx tsx tools/simulate.ts   (veya)  node --import tsx tools/simulate.ts
 *
 * Model (B2 — TEK SERVİS): gelir = min(talep, arz) × (ortalama fiyat + bahşiş) × VERİM.
 *   - talep = tüm açık masaların koltukları / döngü   (kat tek noktadan beslenir)
 *   - arz   = 1 / hazırlamaSüresi                    (tek servis noktası, kendi seviyesi)
 *   - ÜRÜN KARIŞIMI: L5'ten sonra müşterilerin `tostShare(level)` kadarı tost ister → hem fiyat
 *     hem hazırlama süresi ağırlıklı ortalamayla girer (rules.ts incomeRate ile AYNI formül).
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
  tableUpgradeCost,
  tableTip,
  tableSeats,
  charNextCost,
  waiterTrayNextCost,
  waiterSpeedNextCost,
  PRODUCTS,
  type GateState,
  type QuestTarget,
} from '../src/config/economy.config.ts';
import { deriveWorld, tostShare, THE_SERVICE, MAX_SERVICES } from '../src/game/world.ts';

const DT = 1; // saniyelik adım
const TEA_PRICE = C.service.basePrice;
const SOFT_MAX = C.service.upgrade.maxLevel; // ₺ ile çıkılabilen en yüksek seviye
const TABLE_SOFT_MAX = C.tables.upgrade.maxLevel;

// D-015: masa/servis ayrı tutulmaz; padsDone'dan türetilir (store ile aynı kaynak — world.ts).
interface State {
  t: number;
  wallet: number;
  lifetime: number;
  stationLevels: number[]; // servis noktasının seviyesi (B2: tek eleman)
  tableLevel: number; // idealize: tüm masalar eşit yükseltilir
  padsDone: string[];
  /** Karakter kademeleri (v20): quest hattındaki alımlar simüle edilir (T1/T2/M1). */
  char: { tray: number; magnet: number; speed: number };
  /** Personel kademeleri — B2'de gerçekten SATIN ALINIR (eski sim bunları bedava sayıyordu). */
  waiterTray: number;
  waiterSpeed: number;
  /** Görev hattı index'i (M1 ödülleri): tamamlanan görev cüzdana reward ekler. */
  questIdx: number;
}

/** Görev hedefi sim durumunda karşılandı mı? Sayaç görevleri (öğretici) + sim'de modellenmeyen
 *  waiterLevel/tableLevel İDEALİZE tamam sayılır (oyuncu görev hattını takip eder; maliyetleri
 *  küçük — 250/60₺ — tempo ölçümünü bozmaz). */
function questMetSim(s: State, t: QuestTarget): boolean {
  switch (t.type) {
    case 'pad': return s.padsDone.includes(t.id);
    case 'stationLevel': return s.stationLevels[THE_SERVICE] >= t.level;
    case 'charStat': return s.char[t.stat] >= t.tier;
    case 'waiterTray': return s.waiterTray >= t.tier;
    case 'waiterSpeed': return s.waiterSpeed >= t.tier;
    case 'tableLevel': return s.tableLevel >= t.level;
    case 'tablesAtLevel': return s.tableLevel >= t.level; // idealize: tüm masalar eşit seviyede
    // Sayaç görevleri (çay al / servis et / para topla / bulaşık yıka) oynanışla dolar — para
    // harcamaz, tempoyu geciktirmez; idealize modelde ANINDA tamam sayılır.
    default: return true;
  }
}

/** Tamamlanan görevlerin ödüllerini öde (M1) — store'daki quest-advance döngüsünün sim karşılığı. */
function advanceQuests(s: State): void {
  while (s.questIdx < C.quests.length && questMetSim(s, C.quests[s.questIdx].target)) {
    const r = C.quests[s.questIdx].reward ?? 0;
    s.wallet += r;
    s.lifetime += r;
    s.questIdx += 1;
  }
}

function gateOf(s: State): GateState {
  return {
    padsDone: s.padsDone,
    tables: deriveWorld(s.padsDone).tables.length,
    stationLevel: s.stationLevels[0],
    lifetime: s.lifetime,
  };
}

/** Seviyedeki ORTALAMA ürün (tost payına göre ağırlıklı fiyat + hazırlık süresi). */
function mixAt(level: number): { price: number; prepTime: number } {
  const p = tostShare(level);
  return {
    price: (1 - p) * PRODUCTS.tea.price + p * PRODUCTS.tost.price,
    prepTime: (1 - p) * PRODUCTS.tea.prepTime + p * PRODUCTS.tost.prepTime,
  };
}

function brewTimeOf(s: State): number {
  const lv = s.stationLevels[THE_SERVICE];
  return mixAt(lv).prepTime / upgradeOutputMultiplier(C.service.upgrade, lv);
}

// SERVİSİN gelir oranı (₺/sn): min(talep, arz) × (ürün fiyatı + bahşiş). M3: tost pahalı+yavaş.
// Y4 kalibrasyonu: talep KOLTUK-temelli (Y2 grupları — masa başına seviyeyle 1→4 koltuk; idealize
// tableLevel'da L0 koltuk=1 → ölçülen erken/orta eğri AYNI kalır, geç-oyun L4 döneminde talep ×4
// olur ve istasyon arzı tavana dayanır — 2. garson + tepsi-3 tam bu pencereyi taşır, compute §1).
function rate(s: State, eff = 1): number {
  const w = deriveWorld(s.padsDone);
  const bt = brewTimeOf(s);
  const cycle = C.npc.walkTime + bt + C.npc.eatTime;
  const demand = (w.tables.length * tableSeats(s.tableLevel)) / cycle;
  const supply = 1 / bt;
  const price = mixAt(s.stationLevels[THE_SERVICE]).price;
  return Math.min(demand, supply) * (price + tableTip(s.tableLevel)) * eff;
}

// Servis noktası darboğaz mı (talep ≥ arz)? Akıllı oyuncu önce onu yükseltir.
// B2'de bu neredeyse HEP doğru: kat büyürken tek nokta besliyor — ilerlemenin ana kolu bu.
function stationBottleneck(s: State): boolean {
  const w = deriveWorld(s.padsDone);
  const bt = brewTimeOf(s);
  const cycle = C.npc.walkTime + bt + C.npc.eatTime;
  return (w.tables.length * tableSeats(s.tableLevel)) / cycle > (1 / bt) * 0.95;
}

function upgradeUnlocked(s: State): boolean {
  if (s.stationLevels[THE_SERVICE] >= SOFT_MAX) return false;
  return requiresMet(C.service.upgradeRequires, gateOf(s));
}

const stationCost = (s: State) => upgradeCost(C.service.upgrade, s.stationLevels[THE_SERVICE] + 1);

// İdealize tek tableLevel: 1. alanın gate'i referans (v21 alan-başı; sim masa seviyesini tekilleştirir).
function tableUpgradeUnlocked(s: State): boolean {
  return requiresMet(C.tables.upgradeRequiresByArea[0], gateOf(s)) && s.tableLevel < TABLE_SOFT_MAX;
}

function currentPad(s: State) {
  const g = gateOf(s);
  return C.pads.find((p) => !p.optional && !s.padsDone.includes(p.id) && requiresMet(p.requires, g)) ?? null;
}

/**
 * OYUNCU DAVRANIŞI — GÖREV HATTI GÜDÜMLÜ (B2'de düzeltildi).
 *
 * Eski sim "her an en ucuz darboğaz ocağı al" diyordu; oyun ise ekranda TEK aktif görev
 * gösteriyor ve oyuncu onu takip ediyor (Tek Odak). Servis merdiveni ucuzken fark küçüktü, ama
 * B2'de tezgâh/tost basamakları pahalı olduğu için "hangi sırayla alınıyor" tempoyu belirleyen
 * şeyin ta kendisi oldu. Bu yüzden sim artık aktif görevin istediğini biriktirip alıyor;
 * hat bitince serbest oyuna (servis merdiveni → masa seviyeleri) düşüyor.
 */
function trySpend(s: State): void {
  const d = deriveWorld(s.padsDone);
  const q = s.questIdx < C.quests.length ? C.quests[s.questIdx] : null;
  const t = q?.target;

  if (t) {
    switch (t.type) {
      case 'pad': {
        const pad = C.pads.find((p) => p.id === t.id);
        // Görevin pad'i henüz gate'liyse (önkoşul eksik) hattın tıkanmaması için serbest oyuna düş.
        if (pad && requiresMet(pad.requires, gateOf(s))) {
          if (s.wallet >= pad.cost) {
            s.wallet -= pad.cost;
            s.padsDone.push(pad.id);
          }
          return; // biriktiriyor
        }
        break;
      }
      case 'stationLevel': {
        if (upgradeUnlocked(s)) {
          const cost = stationCost(s);
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.stationLevels[THE_SERVICE] += 1;
          }
          return;
        }
        break;
      }
      case 'charStat': {
        const cost = charNextCost(t.stat, s.char[t.stat]);
        if (cost != null) {
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.char[t.stat] += 1;
          }
          return;
        }
        break;
      }
      case 'waiterTray': {
        const cost = waiterTrayNextCost(s.waiterTray);
        if (cost != null) {
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.waiterTray += 1;
          }
          return;
        }
        break;
      }
      case 'waiterSpeed': {
        const cost = waiterSpeedNextCost(s.waiterSpeed);
        if (cost != null) {
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.waiterSpeed += 1;
          }
          return;
        }
        break;
      }
      case 'tableLevel':
      case 'tablesAtLevel': {
        if (tableUpgradeUnlocked(s)) {
          // İdealize: tüm açık masalar birlikte yükselir (alan çarpanları toplanır).
          let cost = 0;
          for (const tb of d.tables) cost += tableUpgradeCost(s.tableLevel, tb.areaIndex);
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.tableLevel += 1;
          }
          return;
        }
        break;
      }
      default:
        break; // sayaç görevi: para harcamaz, altta serbest oyun sürsün
    }
  }

  // SERBEST OYUN (hat bitti ya da aktif görev para istemiyor): önce servis merdiveni
  // (darboğaz olduğu sürece), sonra omurga pad'i, en son masa seviyeleri.
  if (stationBottleneck(s) && upgradeUnlocked(s)) {
    const cost = stationCost(s);
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.stationLevels[THE_SERVICE] += 1;
    }
    return;
  }
  const pad = currentPad(s);
  if (pad) {
    if (s.wallet >= pad.cost) {
      s.wallet -= pad.cost;
      s.padsDone.push(pad.id);
    }
    return;
  }
  if (upgradeUnlocked(s)) {
    const cost = stationCost(s);
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.stationLevels[THE_SERVICE] += 1;
    }
    return;
  }
  if (tableUpgradeUnlocked(s)) {
    let cost = 0;
    for (const tb of d.tables) cost += tableUpgradeCost(s.tableLevel, tb.areaIndex);
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.tableLevel += 1;
    }
  }
}

interface Milestone { name: string; hit: (s: State) => boolean }
const MILESTONES: Milestone[] = [
  { name: 'İlk satın alma (2. Masa)', hit: (s) => s.padsDone.includes('table2') },
  { name: `Karakter: Tepsi T1 (${charNextCost('tray', 0)}₺)`, hit: (s) => s.char.tray >= 1 },
  { name: 'Çay ocağı L1 (z1)', hit: (s) => s.stationLevels[0] >= 1 },
  { name: '3. Masa', hit: (s) => s.padsDone.includes('table3') },
  { name: `Karakter: Tepsi T2 (${charNextCost('tray', 1)}₺)`, hit: (s) => s.char.tray >= 2 },
  { name: 'Garson', hit: (s) => s.padsDone.includes('waiter') },
  { name: 'Bulaşıkçı', hit: (s) => s.padsDone.includes('dishwasher') },
  { name: '4. Masa (zone-1 dolu)', hit: (s) => s.padsDone.includes('table4') },
  { name: `Karakter: Mıknatıs M1 (${charNextCost('magnet', 0)}₺)`, hit: (s) => s.char.magnet >= 1 },
  { name: 'TEZGÂH kuruldu (L4)', hit: (s) => s.stationLevels[0] >= C.service.counterLevel },
  { name: 'TOST açıldı (L5)', hit: (s) => s.stationLevels[0] >= C.service.tostLevel },
  { name: `Servis ₺-max L${SOFT_MAX}`, hit: (s) => s.stationLevels[0] >= SOFT_MAX },
  { name: `ZONE-2 AÇILDI (₺${C.pads.find((p) => p.id === 'zone2')?.cost})`, hit: (s) => s.padsDone.includes('zone2') },
  { name: 'Z2: 2. Masa', hit: (s) => s.padsDone.includes('z2table2') },
  { name: '2. Garson', hit: (s) => s.padsDone.includes('waiter2') },
  { name: 'Z2: 4. Masa (zone-2 dolu)', hit: (s) => s.padsDone.includes('z2table4') },
  { name: `ZONE-3 AÇILDI (₺${C.pads.find((p) => p.id === 'zone3')?.cost})`, hit: (s) => s.padsDone.includes('zone3') },
  { name: 'Z3: 4. Masa (zone-3 dolu)', hit: (s) => s.padsDone.includes('z3table4') },
  { name: 'Masa yükseltme L1 (bahşiş)', hit: (s) => s.tableLevel >= 1 },
  { name: 'lifetime 1.000 ₺', hit: (s) => s.lifetime >= 1_000 },
  { name: 'lifetime 10.000 ₺', hit: (s) => s.lifetime >= 10_000 },
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
    stationLevels: Array.from({ length: MAX_SERVICES }, () => 0),
    tableLevel: 0, padsDone: [],
    char: { tray: 0, magnet: 0, speed: 0 },
    waiterTray: 0, waiterSpeed: 0,
    questIdx: 0,
  };
  const MAX_T = 60 * 60 * 6;
  const done = new Map<string, number>();
  while (s.t < MAX_T) {
    const inc = rate(s, eff) * DT;
    s.wallet += inc;
    s.lifetime += inc;
    s.t += DT;
    trySpend(s);
    advanceQuests(s); // M1: görev ödülleri cüzdana
    for (const m of MILESTONES) {
      if (!done.has(m.name) && m.hit(s)) {
        done.set(m.name, s.t);
        if (log) {
          console.log(
            `  ✓ ${m.name.padEnd(34)} @ ${fmtTime(s.t).padStart(7)}  (oran ${rate(s, eff).toFixed(2)} ₺/sn, servis L${s.stationLevels[0]}, ${deriveWorld(s.padsDone).tables.length} masa)`,
          );
        }
      }
    }
    if (done.size === MILESTONES.length) break;
  }
  return done;
}

function run() {
  console.log('=== Köşe Kıraathanesi — Ekonomi Simülasyonu (B2: TEK servis, bottleneck) ===\n');
  const s0: State = {
    t: 0, wallet: 0, lifetime: 0, stationLevels: [0], tableLevel: 0, padsDone: [],
    char: { tray: 0, magnet: 0, speed: 0 }, waiterTray: 0, waiterSpeed: 0, questIdx: 0,
  };
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
    `Garson havuzu (ilk ₺${C.pads.find((p) => p.id === 'waiter')?.cost}): hız ${C.waiter.speedUpgrades.speeds.join('→')} br/sn (₺${C.waiter.speedUpgrades.costs.join('/')}; panel), tepsi 1+kademe (₺${C.waiter.trayUpgrades.costs.join('/')}). ` +
      `Servis merdiveni: ₺${(C.service.upgrade.costsByLevel ?? []).join('/')} (L4 tezgâh, L5 tost).`,
  );
}

run();
