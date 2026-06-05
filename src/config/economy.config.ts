/**
 * economy.config.ts — TÜM oyun dengesi sayılarının TEK kaynağı.
 * Kod buradan okur; sayılar koda gömülmez. tools/simulate.ts bu dosyayı simüle eder.
 * Büyük sayılar için break_infinity.js Decimal kullanılır (bkz. src/game/decimal.ts).
 *
 * EKONOMİ v2 (D-010): gelir = throughput zincirinin darboğazı × SABİT fiyat.
 *   - Çay fiyatı sabit taban (basePrice); yükseltme fiyatı DEĞİL HACMİ (çay/dk) büyütür.
 *   - Yükseltmeler/açılışlar sıralı önkoşullarla (`requires`) kilitli.
 *
 * Evrensel 5-seviye yükseltme deseni:
 *   cost_n      = costBase * costGrowth^(n-1)         (n = 1..4, ₺ ile)
 *   output_mult = outputMult^(level)   → THROUGHPUT çarpanı (çay/dk), FİYAT DEĞİL
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
  /** Maliyet geometrik büyüme oranı (r ≈ 1.07–1.15). */
  costGrowth: number;
  /** Her ₺ seviye THROUGHPUT'u (çay/dk) bu kadar çarpar — fiyatı değil. */
  outputMult: number;
  /** Usta seviyesi (genelde 5). */
  masterLevel: number;
  /** L5'i açmak için Elmas maliyeti (ödüllü video alternatifi). */
  masterDiamondCost: number;
  /** L5'in throughput çarpanı (normalden büyük sıçrama). */
  masterOutputMult: number;
}

/**
 * Gating / önkoşul (D-010 §3.4). Bir açılış/yükseltme bu koşullar karşılanmadan
 * görünmez/aktif olmaz. OMURGA = `prev` zinciri; diğerleri tempoyu pürüzsüzleştirir.
 */
export interface Requires {
  /** OMURGA: bu pad id'leri tamamlanmadan açılmaz. */
  prev?: readonly string[];
  /** En az N masa. */
  minTables?: number;
  /** En az N çay ocağı seviyesi. */
  minStationLevel?: number;
  /** DESTEK: toplam kazanılan ₺ yumuşak eşiği (tempo). */
  minLifetime?: number;
}

export const economyConfig = {
  saveVersion: SAVE_VERSION,
  currency: CURRENCY,

  /** Çay istasyonu (Faz 1 çekirdeği). */
  teaStation: {
    /** Bir bardak çay demlenme süresi (sn) — sipariş timer'ı. */
    baseBrewTime: 6,
    /** Servis edilen çay başına SABİT ₺ (yükseltme bunu DEĞİL, throughput'u büyütür). */
    basePrice: 5,
    upgrade: {
      costBase: 25,
      costGrowth: 1.5,
      outputMult: 1.35, // throughput (çay/dk) çarpanı — demleme süresini kısaltır
      masterLevel: 5,
      masterDiamondCost: 15,
      masterOutputMult: 2.0,
    } satisfies UpgradeSpec,
    /** Yükseltme noktasının önkoşulu: önce 2. masa açılmalı (D-010 §3.4 sırası). */
    upgradeRequires: { prev: ['table2'] } satisfies Requires,
    /** Yükseltme noktasında saniyede cüzdandan akan ₺ (mekânsal yükseltme). */
    upgradeFillRate: 60,
    /** Her ek çay ocağı (station) sipariş süresini bu kadar çarpar (paralel demleme). */
    extraStationSpeedFactor: 0.85,
  },

  /** NPC (müşteri) yaşam döngüsü zamanlamaları (sn). */
  npc: {
    /**
     * Talep, kapasiteyi takip eder (D-010 §3.1): boşalan koltuk bu kadar sn içinde
     * dolar → mekân hep dolu hisseder, darboğaz hep kendi kapasite zinciri olur.
     */
    spawnInterval: 1.6,
    /** Boş masaya yürüme/oturma payı. */
    walkTime: 2,
    /** Bir bardak çay demleme süresi (sn) — stationLevel throughput'u bunu kısaltır. */
    orderTime: 6,
    /** İçip ödeme yapma süresi. */
    eatTime: 4,
    /**
     * Oturan müşteri çay için bu kadar sn bekler (D-011); süre dolmadan servis
     * edilmezse SESSİZCE kalkıp gider (ödeme yok, ceza yok → çocuk-güvenli).
     */
    patience: 18,
    /** Aynı anda mekândaki maksimum müşteri. */
    maxConcurrent: 8,
  },

  /**
   * Servis döngüsü (D-011): çay artık OTOMATİK servis edilmez. Ocak hazır-kuyruğa demler;
   * oyuncu (sonra garson) çayı TEPSİ ile taşır. Yakınlık temelli (dokunma yok, mekânsal).
   */
  serving: {
    /** Tepsi taban kapasitesi (tek turda taşınan çay). Yükseltme Faz 2e (2→4→6→8). */
    trayCapacityBase: 2,
    /** Oyuncunun ocaktan çay alma yakınlığı (dünya birimi). */
    pickupRadius: 1.6,
    /** Oyuncunun masaya çay bırakma yakınlığı. */
    serveRadius: 1.6,
  },

  /**
   * Ocak hazır-kuyruğu (D-011 §3): demlenen çay tezgâhta birikir. Kuyruk doluysa demleme
   * durur (teslimat darboğaz); boşsa servis çay bekler (demleme darboğaz). Kapasite ocak
   * seviyesine bağlı (ayrı upgrade DEĞİL) → ocağı büyütmek hız + kapasite verir.
   */
  brew: {
    /** L0 hazır-kuyruk kapasitesi. */
    queueBase: 3,
    /** Her ocak seviyesi kuyruğa eklenen kapasite. */
    queuePerLevel: 1,
  },

  /** Yere düşen para. */
  money: {
    /** Düşen para kaç sn sonra kaybolur (0 = asla; Faz 4 otomatik toplayıcı). */
    lifetime: 0,
    /** Sahip karakterinin toplama yarıçapı (dünya birimi). */
    pickupRadius: 1.4,
  },

  /**
   * Satın-alma pad'leri (Roblox-tycoon mantığı; cüzdandan pad'e ₺ akar). SIRALI gating
   * (D-010 §3.4): bir pad `requires` karşılanmadan görünmez/aktif olmaz. Her pad, açtığı
   * objenin TAM yerinde durur (pozisyonlar LAYOUT.padPos). effect:
   *   addTable     → +1 masa (oturma kapasitesi; o masanın yerinde inşa olur)
   *   addStation   → +1 çay ocağı (pişirme kapasitesi; extraStationSpeedFactor ile hızlanır)
   *   serviceSpeed → demleme süresi ×factor (semaver = daha hızlı throughput)
   * Maliyetler tempo hedefine göre ayarlı (ilk alım <90sn; simulate.ts doğrular).
   * Zincir: 2.Masa → (ocak L≥1) → 3.Masa → 2.Ocak → Semaver.
   */
  pads: [
    { id: 'table2', label: '2. Masa', cost: 35, fillRate: 40,
      requires: { minLifetime: 30 }, effect: { type: 'addTable' } },
    { id: 'table3', label: '3. Masa', cost: 120, fillRate: 55,
      requires: { prev: ['table2'], minStationLevel: 1 }, effect: { type: 'addTable' } },
    { id: 'station2', label: 'Yeni Çay Ocağı', cost: 360, fillRate: 75,
      requires: { prev: ['table3'] }, effect: { type: 'addStation' } },
    { id: 'samovar', label: 'Semavere Geçiş', cost: 850, fillRate: 110,
      requires: { prev: ['station2'] }, effect: { type: 'serviceSpeed', factor: 0.7 } },
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

/** Gating değerlendirmesi için gereken (salt-okunur) ilerleme durumu. */
export interface GateState {
  padsDone: string[];
  tables: number;
  stationLevel: number;
  lifetime: number;
}

/** Bir `requires` koşulu mevcut ilerleme durumunca karşılanıyor mu? */
export function requiresMet(req: Requires | undefined, g: GateState): boolean {
  if (!req) return true;
  if (req.prev && !req.prev.every((id) => g.padsDone.includes(id))) return false;
  if (req.minTables != null && g.tables < req.minTables) return false;
  if (req.minStationLevel != null && g.stationLevel < req.minStationLevel) return false;
  if (req.minLifetime != null && g.lifetime < req.minLifetime) return false;
  return true;
}

/** n. ₺ yükseltme seviyesinin maliyeti (level 1..masterLevel-1). */
export function upgradeCost(spec: UpgradeSpec, level: number): number {
  return Math.floor(spec.costBase * Math.pow(spec.costGrowth, level - 1));
}

/** Ocak hazır-kuyruğu kapasitesi: ocak seviyesiyle büyür (D-011 §3). */
export function brewQueueCapacity(stationLevel: number): number {
  return economyConfig.brew.queueBase + economyConfig.brew.queuePerLevel * stationLevel;
}

/** Verilen seviyedeki toplam çıktı çarpanı (L5 usta sıçramasını da içerir). */
export function upgradeOutputMultiplier(spec: UpgradeSpec, level: number): number {
  const masterReached = level >= spec.masterLevel;
  const softLevels = masterReached ? spec.masterLevel - 1 : level;
  let mult = Math.pow(spec.outputMult, softLevels);
  if (masterReached) mult *= spec.masterOutputMult;
  return mult;
}
