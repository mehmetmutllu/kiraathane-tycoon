/**
 * simulate.ts — Ekonomi curve'ünü simüle eder ve her kilometre taşına ~ne kadar sürede
 * ulaşıldığını yazar. Dengeleme için config sayıları oynanıp tekrar çalıştırılır.
 *
 * Çalıştır:  npx tsx tools/simulate.ts
 *            (veya)  node --import tsx tools/simulate.ts
 *
 * Not: Faz 1 basit modelini simüle eder (tek çay istasyonu + sahip toplaması ideal).
 * Faz 2+ geldikçe garson/istasyon çeşitliliği eklenecek.
 */
import { economyConfig as C, upgradeCost } from '../src/config/economy.config.ts';

const DT = 1; // saniyelik adım

interface State {
  t: number; // geçen süre (sn)
  wallet: number; // anlık ₺
  lifetime: number; // toplam kazanılan ₺
  teaLevel: number; // çay yükseltme seviyesi (0..4 ₺ ile)
  tables: number; // açık masa sayısı
}

function teaPrice(level: number): number {
  return C.teaStation.basePrice * Math.pow(C.teaStation.upgrade.outputMult, level);
}

// Bir masanın saniyelik ortalama ₺ gelir oranı (NPC döngüsü idealize).
function ratePerTable(level: number): number {
  const cycle = C.npc.walkTime + C.npc.orderTime + C.npc.eatTime; // bir müşteri ~12 sn
  return teaPrice(level) / cycle;
}

function totalRate(s: State): number {
  return s.tables * ratePerTable(s.teaLevel);
}

const milestones: { name: string; hit: (s: State) => boolean; done?: boolean }[] = [
  { name: '2. masa pad dolar (150 ₺)', hit: (s) => s.lifetime >= C.pads.table2.cost },
  { name: 'Çay yükseltme L1', hit: (s) => s.teaLevel >= 1 },
  { name: 'Çay yükseltme L4 (Usta öncesi)', hit: (s) => s.teaLevel >= 4 },
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
  const s: State = { t: 0, wallet: 0, lifetime: 0, teaLevel: 0, tables: 1 };
  const MAX_T = 60 * 60 * 6; // 6 saat üst sınır

  console.log('=== Köşe Kıraathanesi — Ekonomi Simülasyonu (Faz 1 modeli) ===\n');
  console.log(`Başlangıç: ${s.tables} masa, çay fiyatı ${teaPrice(0)} ₺, oran ${totalRate(s).toFixed(2)} ₺/sn\n`);

  while (s.t < MAX_T) {
    const inc = totalRate(s) * DT;
    s.wallet += inc;
    s.lifetime += inc;
    s.t += DT;

    // Basit otomatik harcama davranışı: önce 2. masa, sonra çay yükseltmeleri.
    if (s.tables < 2 && s.wallet >= C.pads.table2.cost) {
      s.wallet -= C.pads.table2.cost;
      s.tables = 2;
    } else if (s.tables >= 2 && s.teaLevel < 4) {
      const cost = upgradeCost(C.teaStation.upgrade, s.teaLevel + 1);
      if (s.wallet >= cost) {
        s.wallet -= cost;
        s.teaLevel += 1;
      }
    }

    for (const m of milestones) {
      if (!m.done && m.hit(s)) {
        m.done = true;
        console.log(`  ✓ ${m.name.padEnd(38)} @ ${fmtTime(s.t)}  (oran ${totalRate(s).toFixed(2)} ₺/sn)`);
      }
    }
    if (milestones.every((m) => m.done)) break;
  }

  console.log('\n--- Notlar ---');
  console.log('Hedef tempo: ilk 5-10 dk her ~20-40 sn bir satın alma. Yukarıdaki süreler');
  console.log('bu hedeften çok saparsa economy.config.ts (price/cost/growth) ayarlanmalı.');
  const notHit = milestones.filter((m) => !m.done).map((m) => m.name);
  if (notHit.length) console.log('6 saatte ulaşılamayan:', notHit.join(', '));
}

run();
