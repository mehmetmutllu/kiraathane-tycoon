/**
 * economy.config.ts — TÜM oyun dengesi sayılarının TEK kaynağı.
 * Kod buradan okur; sayılar koda gömülmez. tools/simulate.ts bu dosyayı simüle eder.
 * Büyük sayılar için break_infinity.js Decimal kullanılır (bkz. src/game/decimal.ts).
 *
 * Evrensel 5-seviye yükseltme deseni:
 *   cost_n      = costBase * costGrowth^(n-1)         (n = 1..4, ₺ ile)
 *   output_mult = outputMult^(level)                  (her seviye çıktıyı çarpar)
 *   L5 (Usta)   = masterDiamondCost 💎 VEYA 1 ödüllü video; outputMult yerine masterOutputMult
 */

export const SAVE_VERSION = 4;

export const CURRENCY = {
  soft: '₺', // Para — müşteriden kazanılır
  hard: '💎', // Elmas — sert para
} as const;

/** Evrensel yükseltme şablonu — her istasyon/masa/çalışan bunu temel alır. */
export interface UpgradeSpec {
  /** L1 yükseltme maliyeti (₺). */
  costBase: number;
  /** Maliyet geometrik büyüme oranı (r). */
  costGrowth: number;
  /** Her ₺ seviye çıktıyı bu kadar çarpar. */
  outputMult: number;
  /** Usta seviyesi (genelde 5). */
  masterLevel: number;
  /** L5'i açmak için Elmas maliyeti (ödüllü video alternatifi). */
  masterDiamondCost: number;
  /** L5'in çıktı çarpanı (normalden büyük sıçrama). */
  masterOutputMult: number;
}

export const economyConfig = {
  saveVersion: SAVE_VERSION,
  currency: CURRENCY,

  /** Çay istasyonu (Faz 1 çekirdeği). */
  teaStation: {
    /** Bir bardak çay demlenme süresi (sn) — sipariş timer'ı. */
    baseBrewTime: 6,
    /** Servis edilen çay başına taban ₺. */
    basePrice: 5,
    upgrade: {
      costBase: 25,
      costGrowth: 1.6,
      outputMult: 1.35,
      masterLevel: 5,
      masterDiamondCost: 15,
      masterOutputMult: 2.0,
    } satisfies UpgradeSpec,
    /** Yükseltme noktasında saniyede cüzdandan akan ₺ (mekânsal yükseltme). */
    upgradeFillRate: 60,
    /** Her ek çay ocağı (station) sipariş süresini bu kadar çarpar (paralel demleme). */
    extraStationSpeedFactor: 0.85,
  },

  /** NPC (müşteri) yaşam döngüsü zamanlamaları (sn). */
  npc: {
    /** İki müşteri gelişi arası süre. */
    spawnInterval: 4,
    /** Boş masaya yürüme/oturma payı. */
    walkTime: 2,
    /** Çay bekleme süresi (servis sonrası). */
    orderTime: 6,
    /** İçip ödeme yapma süresi. */
    eatTime: 4,
    /** Aynı anda mekândaki maksimum müşteri. */
    maxConcurrent: 8,
  },

  /** Yere düşen para. */
  money: {
    /** Düşen para kaç sn sonra kaybolur (0 = asla; Faz 4 otomatik toplayıcı). */
    lifetime: 0,
    /** Sahip karakterinin toplama yarıçapı (dünya birimi). */
    pickupRadius: 1.4,
  },

  /**
   * Satın-alma pad'leri (Roblox-tycoon mantığı; cüzdandan pad'e ₺ akar). Sıralı:
   * bir pad ancak önceki tamamlanınca aktifleşir. Her pad, açtığı objenin TAM yerinde
   * durur (pozisyonlar LAYOUT.padPos). effect:
   *   addTable     → +1 masa (o masanın yerinde inşa olur)
   *   addStation   → +1 çay ocağı (sipariş süresi extraStationSpeedFactor ile hızlanır)
   *   serviceSpeed → sipariş süresi ×factor (semaver = daha hızlı servis)
   */
  pads: [
    { id: 'table2', label: '2. Masa', cost: 150, fillRate: 40, effect: { type: 'addTable' } },
    { id: 'table3', label: '3. Masa', cost: 500, fillRate: 55, effect: { type: 'addTable' } },
    { id: 'station2', label: 'Yeni Çay Ocağı', cost: 1200, fillRate: 75, effect: { type: 'addStation' } },
    { id: 'samovar', label: 'Semavere Geçiş', cost: 3000, fillRate: 110, effect: { type: 'serviceSpeed', factor: 0.7 } },
  ],

  /** Oyuncu sahip karakteri hareketi. */
  player: {
    moveSpeed: 4.5, // dünya birimi / sn
  },

  /** Çevrimdışı (offline) gelir. */
  offline: {
    baseCapHours: 2,
    /** Elmas ile uzatma başına eklenen saat (Faz 4). */
    diamondExtendHours: 8,
  },

  /** Prestige "Renovasyon" (Faz 4). */
  prestige: {
    /** İtibar = floor(repK * sqrt(lifetime₺ / repScale)). */
    repK: 1,
    repScale: 1_000_000,
    /** Kalıcı gelir çarpanı = 1 + İtibar * incomeBonusPerRep. */
    incomeBonusPerRep: 0.02,
  },
} as const;

export type EconomyConfig = typeof economyConfig;
export type PadDef = EconomyConfig['pads'][number];
export type PadEffect = PadDef['effect'];

/** n. ₺ yükseltme seviyesinin maliyeti (level 1..masterLevel-1). */
export function upgradeCost(spec: UpgradeSpec, level: number): number {
  return Math.floor(spec.costBase * Math.pow(spec.costGrowth, level - 1));
}

/** Verilen seviyedeki toplam çıktı çarpanı (L5 usta sıçramasını da içerir). */
export function upgradeOutputMultiplier(spec: UpgradeSpec, level: number): number {
  const masterReached = level >= spec.masterLevel;
  const softLevels = masterReached ? spec.masterLevel - 1 : level;
  let mult = Math.pow(spec.outputMult, softLevels);
  if (masterReached) mult *= spec.masterOutputMult;
  return mult;
}
