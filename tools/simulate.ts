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
 */
import {
  economyConfig as C,
  upgradeCost,
  upgradeOutputMultiplier,
  requiresMet,
  type GateState,
} from '../src/config/economy.config.ts';

const DT = 1; // saniyelik adım
const TEA_PRICE = C.teaStation.basePrice;
const SOFT_MAX = C.teaStation.upgrade.masterLevel - 1; // ₺ ile çıkılabilen en yüksek seviye

interface State {
  t: number;
  wallet: number;
  lifetime: number;
  stationLevel: number;
  tables: number;
  stations: number;
  serviceSpeedMult: number;
  padsDone: string[];
}

function gateOf(s: State): GateState {
  return { padsDone: s.padsDone, tables: s.tables, stationLevel: s.stationLevel, lifetime: s.lifetime };
}

// Demleme süresi (sn): throughput (stationLevel + servis hızı) arttıkça kısalır.
function brewTime(s: State): number {
  return (C.npc.orderTime * s.serviceSpeedMult) / upgradeOutputMultiplier(C.teaStation.upgrade, s.stationLevel);
}

// Gelir oranı (₺/sn): oturma kapasitesi × sabit fiyat / müşteri döngü süresi.
function rate(s: State): number {
  const cycle = C.npc.walkTime + brewTime(s) + C.npc.eatTime;
  return (s.tables * TEA_PRICE) / cycle;
}

// Sıradaki aktif pad (gating karşılanmış, henüz alınmamış).
function currentPad(s: State) {
  const g = gateOf(s);
  return C.pads.find((p) => !s.padsDone.includes(p.id) && requiresMet(p.requires, g)) ?? null;
}

function upgradeUnlocked(s: State): boolean {
  return requiresMet(C.teaStation.upgradeRequires, gateOf(s)) && s.stationLevel < SOFT_MAX;
}

// Otomatik oyuncu: sıradaki aktif pad'i ya da (pad gate'liyse) ocak yükseltmesini al.
function trySpend(s: State): void {
  const pad = currentPad(s);
  if (pad) {
    if (s.wallet >= pad.cost) {
      s.wallet -= pad.cost;
      s.padsDone.push(pad.id);
      switch (pad.effect.type) {
        case 'addTable':
          s.tables += 1;
          break;
        case 'addStation':
          s.stations += 1;
          s.serviceSpeedMult *= C.teaStation.extraStationSpeedFactor;
          break;
        case 'serviceSpeed':
          s.serviceSpeedMult *= pad.effect.factor;
          break;
      }
    }
    return;
  }
  // Aktif pad yok → ocak yükseltmesi açıksa onu al (sıradaki pad'in önkoşulu olabilir).
  if (upgradeUnlocked(s)) {
    const cost = upgradeCost(C.teaStation.upgrade, s.stationLevel + 1);
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.stationLevel += 1;
    }
  }
}

const milestones: { name: string; hit: (s: State) => boolean; done?: boolean }[] = [
  { name: 'İlk satın alma (2. Masa)', hit: (s) => s.padsDone.includes('table2') },
  { name: 'Çay ocağı L1 (throughput)', hit: (s) => s.stationLevel >= 1 },
  { name: '3. Masa açıldı', hit: (s) => s.padsDone.includes('table3') },
  { name: '2. Çay Ocağı açıldı', hit: (s) => s.padsDone.includes('station2') },
  { name: 'Semavere geçiş', hit: (s) => s.padsDone.includes('samovar') },
  { name: 'Çay ocağı L4 (Usta öncesi)', hit: (s) => s.stationLevel >= SOFT_MAX },
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
    t: 0, wallet: 0, lifetime: 0, stationLevel: 0, tables: 1, stations: 1, serviceSpeedMult: 1, padsDone: [],
  };
  const MAX_T = 60 * 60 * 6; // 6 saat üst sınır

  console.log('=== Köşe Kıraathanesi — Ekonomi v2 Simülasyonu (bottleneck modeli) ===\n');
  console.log(`Sabit çay fiyatı: ${TEA_PRICE} ₺ · Başlangıç: ${s.tables} masa, oran ${rate(s).toFixed(2)} ₺/sn\n`);

  while (s.t < MAX_T) {
    const inc = rate(s) * DT;
    s.wallet += inc;
    s.lifetime += inc;
    s.t += DT;
    trySpend(s);

    for (const m of milestones) {
      if (!m.done && m.hit(s)) {
        m.done = true;
        console.log(`  ✓ ${m.name.padEnd(34)} @ ${fmtTime(s.t).padStart(7)}  (oran ${rate(s).toFixed(2)} ₺/sn, L${s.stationLevel}, ${s.tables} masa)`);
      }
    }
    if (milestones.every((m) => m.done)) break;
  }

  console.log('\n--- Tempo denetimi (D-010 §3.6) ---');
  console.log('Hedef: ilk satın alma < 90 sn; ilk 5-10 dk her ~20-40 sn bir alım; otomasyon < 15 dk.');
  const notHit = milestones.filter((m) => !m.done).map((m) => m.name);
  if (notHit.length) console.log('6 saatte ulaşılamayan:', notHit.join(', '));
  else console.log('Tüm kilometre taşlarına ulaşıldı.');
}

run();
