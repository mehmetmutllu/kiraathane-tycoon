/**
 * simulate.ts — Ekonomi v2 (D-010) BOTTLENECK modelini simüle eder ve her kilometre
 * taşına ~ne kadar sürede ulaşıldığını yazar. Dengeleme için config sayıları oynanıp
 * tekrar çalıştırılır.
 *
 * Çalıştır:  npx tsx tools/simulate.ts   (veya)  node --import tsx tools/simulate.ts
 *
 * Model (B2 — TEK SERVİS): gelir = min(talep, arz) × (ortalama fiyat + bahşiş) × VERİM.
 *   - talep = tüm açık masaların koltukları / döngü   (kat tek noktadan beslenir)
 *     B5a: koltuk sayısı masa TİPİNDEN okunur (dörtlü 1/2/2/4/4 · banket ikilisi 1/2/2/2/2) —
 *     `masa × tableSeats(lvl)` çarpımı orta şerit 12 ikiliye çıkınca talebi ~2 kat abartırdı.
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
  lavaboIncomePerCustomer,
  lavaboUpgradeCost,
  lavaboMaxLevel,
  waiterTrayNextCost,
  waiterSpeedNextCost,
  PRODUCTS,
  type GateState,
  type QuestTarget,
} from '../src/config/economy.config.ts';
import { deriveWorld, tostShare, THE_SERVICE, MAX_SERVICES } from '../src/game/world.ts';
import { getNavGrid, servicePlace, LAYOUT, REACH_TABLE } from '../src/game/layout.ts';
import { findNavPath } from '../src/game/nav.ts';

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
  /** ODA: lavabo seviyesi (B4; 0 = kapalı). Pad açılışı 1, kalanı yükseltme noktasından. */
  lavabo: number;
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
    case 'lavaboLevel': return s.lavabo >= t.level;
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

/** Açık masaların TOPLAM koltuğu — her masa kendi tipinin merdivenini okur (B5a). */
function openSeats(w: ReturnType<typeof deriveWorld>, tableLevel: number): number {
  let n = 0;
  for (const t of w.tables) n += tableSeats(tableLevel, t.kind);
  return n;
}

function brewTimeOf(s: State): number {
  const lv = s.stationLevels[THE_SERVICE];
  return mixAt(lv).prepTime / upgradeOutputMultiplier(C.service.upgrade, lv);
}

/* ─────────────── TAŞIMA KOLU (Ö5, denge-raporu-b5b §5) ───────────────
 * Eski sim gelirin ÜÇÜNCÜ tavanını hiç görmüyordu: çayı biri TAŞIMALI. Demleme ne kadar hızlı
 * olursa olsun, oyuncu + garsonlar saniyede taşıyabildiklerinden fazlasını satamaz. Bu tavan
 * verim çarpanının (0,80/0,55/0,35) içinde SAKLIYDI — yani garson/tepsi/karakter fiyatları
 * ölçülemiyordu ve "3. garson ne satın alıyor" sorusunun sim'de cevabı yoktu.
 *
 * BEKÇİ olarak eklenir, yeniden denge olarak değil: formüle yalnız üçüncü bir `min` terimi girer.
 * Tavan BİLEREK İYİMSER (üst sınır) — masalar arası ara mesafeyi, kirli dönüşünü, bekleme/hedef
 * seçimini saymaz. Yani susuyorsa gerçek oyunda da darboğaz değildir; KONUŞUYORSA gerçek oyun
 * kesinlikle daha kötüdür. Bir bekçinin yanlış alarm vermemesi, geç alarm vermesinden önemlidir.
 */
const CARRY_HANDLE = 0.5; // bardak başına alma+bırakma payı (sn)

/** Servis noktasından açık masalara ORTALAMA gerçek (BFS) yol — ızgara gibi cache'lenir. */
const distCache = new Map<string, number>();
function avgServeDist(tables: number, areasOpen: number): number {
  const key = `${tables}|${areasOpen}`;
  const hit = distCache.get(key);
  if (hit != null) return hit;
  const sp = servicePlace(areasOpen);
  const grid = getNavGrid(tables, areasOpen);
  let total = 0;
  let n = 0;
  for (let i = 0; i < tables; i++) {
    const t = LAYOUT.tables[i].table;
    const path = findNavPath(grid, [sp.pickup[0], 0, sp.pickup[2]], t[0], t[2], REACH_TABLE);
    if (!path || path.length === 0) continue;
    let d = Math.hypot(path[0][0] - sp.pickup[0], path[0][1] - sp.pickup[2]);
    for (let k = 1; k < path.length; k++) d += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
    total += d;
    n += 1;
  }
  const avg = n > 0 ? total / n : 0;
  distCache.set(key, avg);
  return avg;
}

/** Bir taşıyıcının bardak/sn'si: tepsi dolusu götür, boş dön. */
const carrierRate = (tray: number, speed: number, dist: number): number =>
  tray / ((2 * dist) / speed + tray * CARRY_HANDLE);

/** TAŞIMA tavanı (bardak/sn) = oyuncu + garson havuzu. */
function carryRateOf(s: State): number {
  const w = deriveWorld(s.padsDone);
  const dist = avgServeDist(w.tables.length, w.areasOpen);
  if (dist <= 0) return Infinity; // masa yokken tavan yok
  const player = carrierRate(C.character.tray.values[s.char.tray], C.character.speed.values[s.char.speed], dist);
  const wSpeed = C.waiter.speedUpgrades.speeds[s.waiterSpeed];
  const waiters = w.services[THE_SERVICE]?.waiters ?? 0;
  return player + waiters * carrierRate(1 + s.waiterTray, wSpeed, dist);
}

// SERVİSİN gelir oranı (₺/sn): min(talep, arz) × (ürün fiyatı + bahşiş). M3: tost pahalı+yavaş.
// Y4 kalibrasyonu: talep KOLTUK-temelli (Y2 grupları — masa başına seviyeyle 1→4 koltuk; idealize
// tableLevel'da L0 koltuk=1 → ölçülen erken/orta eğri AYNI kalır, geç-oyun L4 döneminde talep ×4
// olur ve istasyon arzı tavana dayanır — 2. garson + tepsi-3 tam bu pencereyi taşır, compute §1).
function rate(s: State, eff = 1): number {
  const w = deriveWorld(s.padsDone);
  const bt = brewTimeOf(s);
  const cycle = C.npc.walkTime + bt + C.npc.eatTime;
  const demand = openSeats(w, s.tableLevel) / cycle;
  const supply = 1 / bt;
  const price = mixAt(s.stationLevels[THE_SERVICE]).price;
  // B4 ODA KOLU: servis edilen her müşteri çıkarken lavaboya uğrayabilir ve parasını odanın
  // önüne bırakır → gelir MÜŞTERİ BAŞINA büyür. Üç tavanın (talep/arz/taşıma) HİÇBİRİNİ
  // gevşetmez, yalnız aynı akışın ₺'sini artırır — Kat 1'de throughput kolu tükendiği için
  // (arz L6'da 0,78 fincan/sn, taşıma tavanı 1,25) geriye kalan tek büyüme yönü budur.
  const perCustomer = price + tableTip(s.tableLevel) + lavaboIncomePerCustomer(s.lavabo);
  return Math.min(demand, supply, carryRateOf(s)) * perCustomer * eff;
}

/** Geliri o an KİM kelepçeliyor — üç kolun hangisi (rapor/teşhis için). */
function bindingArm(s: State): 'talep' | 'arz' | 'taşıma' {
  const w = deriveWorld(s.padsDone);
  const bt = brewTimeOf(s);
  const demand = openSeats(w, s.tableLevel) / (C.npc.walkTime + bt + C.npc.eatTime);
  const arms: [string, number][] = [['talep', demand], ['arz', 1 / bt], ['taşıma', carryRateOf(s)]];
  arms.sort((a, b) => a[1] - b[1]);
  return arms[0][0] as 'talep' | 'arz' | 'taşıma';
}

// Servis noktası darboğaz mı (talep ≥ arz)? Akıllı oyuncu önce onu yükseltir.
// B2'de bu neredeyse HEP doğru: kat büyürken tek nokta besliyor — ilerlemenin ana kolu bu.
function stationBottleneck(s: State): boolean {
  const w = deriveWorld(s.padsDone);
  const bt = brewTimeOf(s);
  const cycle = C.npc.walkTime + bt + C.npc.eatTime;
  return openSeats(w, s.tableLevel) / cycle > (1 / bt) * 0.95;
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
            if (pad.effect.type === 'openRoom') s.lavabo = Math.max(s.lavabo, 1);
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
      case 'lavaboLevel': {
        const cost = lavaboUpgradeCost(s.lavabo);
        if (cost != null) {
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.lavabo += 1;
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
      if (pad.effect.type === 'openRoom') s.lavabo = Math.max(s.lavabo, 1);
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
  const lavCost = lavaboUpgradeCost(s.lavabo);
  if (lavCost != null) {
    if (s.wallet >= lavCost) {
      s.wallet -= lavCost;
      s.lavabo += 1;
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
  { name: 'Z3: 4. Masa', hit: (s) => s.padsDone.includes('z3table4') },
  // B5a: orta şerit 12 banket birimine açıldı — kat 20 masa. Zincirin son iki uğrağı.
  { name: 'LAVABO açıldı', hit: (s) => s.padsDone.includes('lavabo') },
  { name: `Lavabo L${lavaboMaxLevel()} (oda tavanı)`, hit: (s) => s.lavabo >= lavaboMaxLevel() },
  { name: 'Şerit yarısı (16. masa)', hit: (s) => s.padsDone.includes('z3table8') },
  { name: 'ŞERİT DOLDU (20. masa)', hit: (s) => s.padsDone.includes('z3table12') },
  { name: 'Masa yükseltme L1 (bahşiş)', hit: (s) => s.tableLevel >= 1 },
  { name: 'lifetime 1.000 ₺', hit: (s) => s.lifetime >= 1_000 },
  { name: 'lifetime 10.000 ₺', hit: (s) => s.lifetime >= 10_000 },
];

const NL = String.fromCharCode(10);

function fmtTime(sec: number): string {
  if (sec < 60) return `${sec.toFixed(0)} sn`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)} dk`;
  return `${(sec / 3600).toFixed(2)} sa`;
}

/**
 * SATIN ALMA OLAYI — tempo denetiminin ikinci ölçütü için (D-010 §3.6: "20 dk'yı aşan tek alım
 * kalmasın"). Milestone listesi zincirin TAMAMINI taşımaz (karakter kademeleri, masa seviyeleri,
 * ara pad'ler dışarıda kalır); oysa oyuncunun hissettiği bekleme iki ARDIŞIK ALIM arasındaki
 * boşluktur. Bu yüzden ölçüm milestone'lardan değil, harcamanın kendisinden türer.
 */
interface Buy { t: number; label: string }

/** Harcama sayaçlarının anlık görüntüsü — trySpend'in NE aldığını fark ile okuruz. */
function spendSnap(s: State) {
  return {
    pads: s.padsDone.length,
    lastPad: s.padsDone[s.padsDone.length - 1] ?? '',
    st: s.stationLevels[THE_SERVICE],
    tl: s.tableLevel,
    tray: s.char.tray, magnet: s.char.magnet, speed: s.char.speed,
    wt: s.waiterTray, ws: s.waiterSpeed, lav: s.lavabo,
  };
}
type Snap = ReturnType<typeof spendSnap>;

/** İki anlık görüntü arasındaki fark bir alımsa etiketi, değilse null. */
function boughtLabel(a: Snap, b: Snap): string | null {
  if (b.pads > a.pads) return `pad: ${b.lastPad}`;
  if (b.st > a.st) return `servis L${b.st}`;
  if (b.tl > a.tl) return `masa seviyesi L${b.tl}`;
  if (b.lav > a.lav) return `lavabo L${b.lav}`;
  if (b.tray > a.tray) return `karakter: tepsi ${b.tray}`;
  if (b.magnet > a.magnet) return `karakter: mıknatıs ${b.magnet}`;
  if (b.speed > a.speed) return `karakter: hız ${b.speed}`;
  if (b.wt > a.wt) return `garson tepsi ${b.wt}`;
  if (b.ws > a.ws) return `garson hız ${b.ws}`;
  return null;
}

/** Bir profili koştur; milestone → saniye haritası döner. `buys` verilirse alım hattı da dolar. */
function runProfile(eff: number, log = false, buys?: Buy[]): Map<string, number> {
  const s: State = {
    t: 0, wallet: 0, lifetime: 0,
    stationLevels: Array.from({ length: MAX_SERVICES }, () => 0),
    tableLevel: 0, padsDone: [],
    char: { tray: 0, magnet: 0, speed: 0 },
    waiterTray: 0, waiterSpeed: 0,
    questIdx: 0, lavabo: 0,
  };
  const MAX_T = 60 * 60 * 12; // B5a: şeridin 12 birimi 6 saatin ötesine taşıyor — ölçüm penceresi büyüdü
  const done = new Map<string, number>();
  while (s.t < MAX_T) {
    const inc = rate(s, eff) * DT;
    s.wallet += inc;
    s.lifetime += inc;
    s.t += DT;
    const before = buys ? spendSnap(s) : null;
    trySpend(s);
    if (before) {
      const label = boughtLabel(before, spendSnap(s));
      if (label) buys!.push({ t: s.t, label });
    }
    advanceQuests(s); // M1: görev ödülleri cüzdana
    for (const m of MILESTONES) {
      if (!done.has(m.name) && m.hit(s)) {
        done.set(m.name, s.t);
        if (log) {
          console.log(
            `  ✓ ${m.name.padEnd(34)} @ ${fmtTime(s.t).padStart(7)}  (oran ${rate(s, eff).toFixed(2)} ₺/sn, servis L${s.stationLevels[0]}, ${deriveWorld(s.padsDone).tables.length} masa, darboğaz: ${bindingArm(s)})`,
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
    char: { tray: 0, magnet: 0, speed: 0 }, waiterTray: 0, waiterSpeed: 0, questIdx: 0, lavabo: 0,
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
  const results = profiles.map(([name, eff]) => {
    const buys: Buy[] = [];
    return { name, res: runProfile(eff, false, buys), buys };
  });
  const header = 'Milestone'.padEnd(34) + ' | ' + results.map((r) => r.name.split(' ')[0].padStart(8)).join(' | ');
  console.log(header);
  for (const m of MILESTONES) {
    const row = m.name.padEnd(34) + ' | ' +
      results.map((r) => (r.res.has(m.name) ? fmtTime(r.res.get(m.name)!) : '—').padStart(8)).join(' | ');
    console.log(row);
  }

  /* --- EN UZUN BEKLEME (D-010 §3.6'nın ikinci ölçütü) ---
     "20 dk'yı aşan tek alım kalmasın." Bekleme = iki ARDIŞIK alım arasındaki boşluk; etiketi
     boşluğu BİTİREN alımdır (oyuncu o süre boyunca ONUN için biriktiriyordu). B4 raporunun
     §7'sinde elle ölçülen bu sayı burada kalıcı bir bekçi oldu. */
  console.log(NL + '--- EN UZUN BEKLEME (ardışık iki alım arası) ---');
  const WAIT_LIMIT = 20 * 60;
  for (const r of results) {
    const gaps = r.buys.map((b, i) => ({ ...b, gap: b.t - (i === 0 ? 0 : r.buys[i - 1].t) }));
    gaps.sort((a, b) => b.gap - a.gap);
    const worst = gaps.slice(0, 3);
    const over = gaps.filter((g) => g.gap > WAIT_LIMIT).length;
    console.log(
      `  ${r.name.split(' ')[0].padEnd(7)} en uzun ${fmtTime(worst[0]?.gap ?? 0).padStart(7)} → ${worst[0]?.label ?? '—'}` +
        `   (20 dk'yı aşan: ${over})`,
    );
    for (const g of worst.slice(1)) console.log(`          ardından ${fmtTime(g.gap).padStart(7)} → ${g.label}`);
  }

  // ÜÇ KOL tablosu (Ö5): geliri hangi tavan kelepçeliyor, ve garson/tepsi ne satın alıyor.
  console.log('\n--- ÜÇ KOL (talep / arz / TAŞIMA) — bardak/sn ---');
  const scenes: [string, Partial<State>][] = [
    ['4 masa · L2 · garson 1', { padsDone: ['table2', 'table3', 'waiter', 'table4'], stationLevels: [2], tableLevel: 0, char: { tray: 1, magnet: 0, speed: 0 }, waiterTray: 0, waiterSpeed: 0 }],
    ['8 masa · L3 · garson 1', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4'], stationLevels: [3], tableLevel: 1, char: { tray: 2, magnet: 1, speed: 0 }, waiterTray: 1, waiterSpeed: 1 }],
    ['12 masa · L6 · garson 2', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4','zone3','z3table2','waiter2','z3table3','z3table4'], stationLevels: [6], tableLevel: 4, char: { tray: 2, magnet: 1, speed: 0 }, waiterTray: 2, waiterSpeed: 1 }],
    ['12 masa · L6 · garson 3', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4','zone3','z3table2','waiter2','z3table3','z3table4','waiter3'], stationLevels: [6], tableLevel: 4, char: { tray: 2, magnet: 1, speed: 0 }, waiterTray: 2, waiterSpeed: 1 }],
    ['20 masa · L6 · garson 3', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4','zone3','z3table2','waiter2','z3table3','z3table4','waiter3','z3table5','z3table6','z3table7','z3table8','z3table9','z3table10','z3table11','z3table12'], stationLevels: [6], tableLevel: 4, char: { tray: 4, magnet: 3, speed: 3 }, waiterTray: 3, waiterSpeed: 1 }],
  ];
  for (const [name, patch] of scenes) {
    const st: State = { t: 0, wallet: 0, lifetime: 0, stationLevels: [0], tableLevel: 0, padsDone: [],
      char: { tray: 0, magnet: 0, speed: 0 }, waiterTray: 0, waiterSpeed: 0, questIdx: 0, lavabo: 0, ...patch } as State;
    const w = deriveWorld(st.padsDone);
    const b = brewTimeOf(st);
    const demand = openSeats(w, st.tableLevel) / (C.npc.walkTime + b + C.npc.eatTime);
    console.log(
      `  ${name.padEnd(24)} yol ${avgServeDist(w.tables.length, w.areasOpen).toFixed(1).padStart(5)} br · ` +
        `talep ${demand.toFixed(2)} · arz ${(1 / b).toFixed(2)} · taşıma ${carryRateOf(st).toFixed(2)} → ` +
        `darboğaz ${bindingArm(st).toUpperCase()} · gelir ${rate(st).toFixed(2)} ₺/sn`,
    );
  }

  console.log('\n--- Servis kapasitesi (bilgi) ---');
  console.log(
    `Garson havuzu (ilk ₺${C.pads.find((p) => p.id === 'waiter')?.cost}): hız ${C.waiter.speedUpgrades.speeds.join('→')} br/sn (₺${C.waiter.speedUpgrades.costs.join('/')}; panel), tepsi 1+kademe (₺${C.waiter.trayUpgrades.costs.join('/')}). ` +
      `Servis merdiveni: ₺${(C.service.upgrade.costsByLevel ?? []).join('/')} (L4 tezgâh, L5 tost).`,
  );
}

run();
