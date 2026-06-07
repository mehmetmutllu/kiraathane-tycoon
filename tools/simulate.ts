/**
 * simulate.ts — Ekonomi v2 (D-010) BOTTLENECK modelini simüle eder ve her kilometre
 * taşına ~ne kadar sürede ulaşıldığını yazar. Dengeleme için config sayıları oynanıp
 * tekrar çalıştırılır.
 *
 * Çalıştır:  npx tsx tools/simulate.ts   (veya)  node --import tsx tools/simulate.ts
 *
 * Model: gelir = (oturma kapasitesi) × SABİT fiyat / döngü süresi.
 *   - Çay fiyatı sabit (basePrice); yükseltme fiyatı DEĞİL throughput'u (çay/dk) artırır.
 *   - Yükseltmeler/açılışlar sıralı önkoşullarla (`requires`) kilitli.
 * Otomatik oyuncu, gating sırasına uyarak parası yettikçe sıradaki adımı alır.
 *
 * NOT (D-011, 2c): çay artık manuel tepsiyle servis ediliyor. Bu simülasyon, oyuncunun/
 * garsonun servise YETİŞTİĞİ ideal durumu (kararlı-durum throughput tavanı) modeller —
 * döngü ≈ yürü + demle + iç. Servis darboğazı (oyuncu yavaşsa müşteri sabırsızlanıp gider)
 * sahnede gerçek; garson hız/tepsi dengesi 2d'de buraya eklenecek.
 * NOT (Faz 2e): bardak döngüsü (temiz biterse demleme durur; kirli topla/yıka) de GERÇEK-ZAMANLI
 * bir darboğazdır, idealize tempoda modellenmez (oyuncu/bulaşıkçı yetişiyor varsayılır).
 */
import {
  economyConfig as C,
  upgradeCost,
  upgradeOutputMultiplier,
  requiresMet,
  derivedFromPads,
  tableUpgradeCost,
  tableTip,
  type GateState,
} from '../src/config/economy.config.ts';

const DT = 1; // saniyelik adım
const TEA_PRICE = C.teaStation.basePrice;
const SOFT_MAX = C.teaStation.upgrade.masterLevel - 1; // ₺ ile çıkılabilen en yüksek seviye
const TABLE_SOFT_MAX = C.tables.upgrade.masterLevel - 1; // ₺ ile çıkılabilen en yüksek masa seviyesi

// D-015: tables/serviceSpeedMult ayrı tutulmaz; padsDone'dan türetilir (store ile aynı kaynak).
interface State {
  t: number;
  wallet: number;
  lifetime: number;
  stationLevel: number;
  tableLevel: number;
  padsDone: string[];
}

function gateOf(s: State): GateState {
  return { padsDone: s.padsDone, tables: derivedFromPads(s.padsDone).tables, stationLevel: s.stationLevel, lifetime: s.lifetime };
}

// Demleme süresi (sn): throughput (stationLevel + servis hızı) arttıkça kısalır.
function brewTime(s: State): number {
  const { serviceSpeedMult } = derivedFromPads(s.padsDone);
  return (C.npc.orderTime * serviceSpeedMult) / upgradeOutputMultiplier(C.teaStation.upgrade, s.stationLevel);
}

// Gelir oranı (₺/sn): servis edilen çay/sn × (sabit fiyat + masa bahşişi).
// DARBOĞAZ modeli (D-019): tek ocak SINIRLI throughput'a sahip → servis hızı, TALEP ile ARZIN MİNİMUMU:
//   - talep (masalar dolu): tables / cycle   (her masa cycle başına 1 çay tüketir)
//   - arz (ocak demleme):   1 / brewTime      (tek ocak brewTime'da 1 çay demler)
// Masa açmak (table3'ten gate kalkınca) tek başına geliri artırmaz; ocak darboğazsa ocak yükseltmek gerekir
// → "tek ocak 4 masaya yetişmeli" gerçeği modellenir (D-019 §2/§3). 1 masada talep<arz → eski davranış (ilk-alım 84sn sabit).
function rate(s: State): number {
  const cycle = C.npc.walkTime + brewTime(s) + C.npc.eatTime;
  const tables = derivedFromPads(s.padsDone).tables;
  const demand = tables / cycle;
  const supply = 1 / brewTime(s);
  return Math.min(demand, supply) * (TEA_PRICE + tableTip(s.tableLevel));
}

// Ocak şu an darboğaz mı (talep ≥ arz)? Akıllı oyuncu bu durumda masadan ÖNCE ocağı yükseltir.
function ocakBottleneck(s: State): boolean {
  const cycle = C.npc.walkTime + brewTime(s) + C.npc.eatTime;
  const demand = derivedFromPads(s.padsDone).tables / cycle;
  const supply = 1 / brewTime(s);
  return demand > supply * 0.95; // 1 masada false (talep<<arz); 2+ masada true → ocak yükselt
}

function tableUpgradeUnlocked(s: State): boolean {
  return requiresMet(C.tables.upgradeRequires, gateOf(s)) && s.tableLevel < TABLE_SOFT_MAX;
}

// Sıradaki aktif OMURGA pad'i (opsiyoneller atlanır; gating karşılanmış, henüz alınmamış).
function currentPad(s: State) {
  const g = gateOf(s);
  return C.pads.find((p) => !p.optional && !s.padsDone.includes(p.id) && requiresMet(p.requires, g)) ?? null;
}

function upgradeUnlocked(s: State): boolean {
  return requiresMet(C.teaStation.upgradeRequires, gateOf(s)) && s.stationLevel < SOFT_MAX;
}

// Otomatik (akıllı) oyuncu: ocak DARBOĞAZSA masadan önce ocağı yükseltir (throughput'u açar); değilse
// omurga pad'ini (masa/semaver) alır; o da bitince masa-başı yükseltme (bahşiş). D-019: masa gate'i kalktı,
// ama akıllı oyuncu ocağı kendiliğinden yükseltir → tempo eski gated akışa benzer kalır (ilk-alım 84sn sabit).
function trySpend(s: State): void {
  // 1) Ocak darboğazsa ve yükseltme açıksa → önce ocağı yükselt (tek ocak masalara yetişsin).
  if (ocakBottleneck(s) && upgradeUnlocked(s)) {
    const cost = upgradeCost(C.teaStation.upgrade, s.stationLevel + 1);
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.stationLevel += 1;
    }
    return;
  }
  const pad = currentPad(s);
  if (pad) {
    if (s.wallet >= pad.cost) {
      s.wallet -= pad.cost;
      s.padsDone.push(pad.id); // D-015: etkiler (tables/serviceSpeedMult) padsDone'dan türetilir.
    }
    return;
  }
  // Aktif pad yok → ocak yükseltmesi açıksa onu al (sıradaki pad'in önkoşulu olabilir; öncelik omurga akışı).
  if (upgradeUnlocked(s)) {
    const cost = upgradeCost(C.teaStation.upgrade, s.stationLevel + 1);
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.stationLevel += 1;
    }
    return;
  }
  // Omurga + ocak bitti/kilitli → masa yükseltmesi (opsiyonel/paralel gelir artışı; bahşiş) al.
  // MASA-BAŞI (Faz 2h rework): idealize oyuncu tüm açık masaları eşit yükseltir → bir seviye = masa sayısı × maliyet.
  if (tableUpgradeUnlocked(s)) {
    const tables = derivedFromPads(s.padsDone).tables;
    const cost = tableUpgradeCost(s.tableLevel) * tables;
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.tableLevel += 1;
    }
  }
}

const milestones: { name: string; hit: (s: State) => boolean; done?: boolean }[] = [
  { name: 'İlk satın alma (2. Masa)', hit: (s) => s.padsDone.includes('table2') },
  { name: 'Çay ocağı L1 (throughput)', hit: (s) => s.stationLevel >= 1 },
  { name: '3. Masa açıldı', hit: (s) => s.padsDone.includes('table3') },
  { name: '4. Masa açıldı (salon dolu)', hit: (s) => s.padsDone.includes('table4') },
  { name: 'Çay ocağı L4 (semaver/üst, tek ocak 4 masaya yetişir)', hit: (s) => s.stationLevel >= SOFT_MAX },
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

function run() {
  const s: State = {
    t: 0, wallet: 0, lifetime: 0, stationLevel: 0, tableLevel: 0, padsDone: [],
  };
  const MAX_T = 60 * 60 * 6; // 6 saat üst sınır

  console.log('=== Köşe Kıraathanesi — Ekonomi v2 Simülasyonu (bottleneck modeli) ===\n');
  console.log(`Sabit çay fiyatı: ${TEA_PRICE} ₺ · Başlangıç: ${derivedFromPads(s.padsDone).tables} masa, oran ${rate(s).toFixed(2)} ₺/sn\n`);

  while (s.t < MAX_T) {
    const inc = rate(s) * DT;
    s.wallet += inc;
    s.lifetime += inc;
    s.t += DT;
    trySpend(s);

    for (const m of milestones) {
      if (!m.done && m.hit(s)) {
        m.done = true;
        console.log(`  ✓ ${m.name.padEnd(34)} @ ${fmtTime(s.t).padStart(7)}  (oran ${rate(s).toFixed(2)} ₺/sn, L${s.stationLevel}, ${derivedFromPads(s.padsDone).tables} masa)`);
      }
    }
    if (milestones.every((m) => m.done)) break;
  }

  console.log('\n--- Tempo denetimi (D-010 §3.6) ---');
  console.log('Hedef: ilk satın alma < 90 sn; ilk 5-10 dk her ~20-40 sn bir alım; otomasyon < 15 dk.');
  const notHit = milestones.filter((m) => !m.done).map((m) => m.name);
  if (notHit.length) console.log('6 saatte ulaşılamayan:', notHit.join(', '));
  else console.log('Tüm kilometre taşlarına ulaşıldı.');

  console.log('\n--- Servis kapasitesi (Faz 2d, bilgi) ---');
  console.log(
    `Garson OPSİYONEL (₺${C.pads.find((p) => p.id === 'waiter')?.cost ?? '?'}, omurgayı KİLİTLEMEZ): ` +
      `hız L1 ${C.waiter.moveSpeedByLevel[0]}→L2 ${C.waiter.moveSpeedByLevel[1]} br/sn (₺${C.waiter.upgradeCost} yükseltme), ` +
      `tepsi ${C.waiter.trayCapacity}. Oyuncudan yavaş → kısmi assist (ekonomi idealize servis varsayar; sabit).`,
  );
}

run();
