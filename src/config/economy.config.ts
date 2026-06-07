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

export const SAVE_VERSION = 15;

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

  /**
   * Masa yükseltme (Faz 2h — MASA-BAŞI / My Hotel oda yükseltme mantığı; D-016 §5 "zone-başı" kullanıcı
   * isteğiyle DEĞİŞTİRİLDİ 2026-06-07): HER masanın KENDİ seviyesi var (`tableLevels[i]`), her masanın
   * YANINDA ayrı yükseltme noktası (LAYOUT.tables[i].upgradeSpot). Çay fiyatı SABİT kalır (D-010 bozulmaz).
   * O masanın seviyesi iki şeyi artırır (yalnız o masaya oturan müşteri için):
   *   - BAHŞİŞ: çay fiyatına EK `tipBase × seviye` ₺.
   *   - SABIR: `patiencePerLevel × seviye` sn daha uzun bekler.
   * 2. masa açılınca belirir (upgradeRequires); açma SIRALI değil yükseltme SERBEST/paraleldir.
   * Bekleme-süreli bahşiş (zamanında servis = tam) Faz 4'e ERTELENDİ.
   */
  tables: {
    upgrade: {
      costBase: 60,
      costGrowth: 1.6, // L1 60 / L2 96 / L3 153 / L4 245
      masterLevel: 5, // L5 (Usta) 💎/video — Faz 4; ₺ ile soft max L4
      masterDiamondCost: 12,
    },
    /** Yükseltme noktasında saniyede cüzdandan akan ₺ (mekânsal yükseltme). */
    upgradeFillRate: 60,
    /** Önkoşul: TÜM masalar (4) açılınca belirir (D-019 §3 — masa yükseltmeleri GEÇ oyun derinliği; erken
     *  ekran sade kalsın diye masa-başı yükseltme işaretleri 4. masaya kadar gizli). */
    upgradeRequires: { prev: ['table4'] } satisfies Requires,
    /** Servis başına ek bahşiş = tipBase × masaSeviyesi (L0 = 0 bahşiş, sadece sabit fiyat). */
    tipBase: 2,
    /** Masa seviyesi başına eklenen sabır (sn). */
    patiencePerLevel: 2,
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
    /** Tepsi kapasitesi (D-018: yükseltme KALDIRILDI → sabit). Tek turda taşınan çay/kirli. */
    trayCapacity: 2,
    /** Oyuncunun ocaktan çay alma yakınlığı (dünya birimi). */
    pickupRadius: 1.6,
    /** Oyuncunun masaya çay bırakma yakınlığı. */
    serveRadius: 1.6,
  },

  /**
   * Garson (Faz 2d, opsiyonel — `waiter` pad'iyle tutulur, ZORUNLU değil). KISMİ assist:
   * oyuncudan YAVAŞ ve KÜÇÜK tepsili → tek başına büyüyen mekânı döndüremez; oyuncu hâlâ gerekli.
   * Ocaktan tek çay alır, en yakın bekleyen müşteriye götürür, döner (D-012 bölge-başı personel).
   */
  waiter: {
    /**
     * Seviye-başı hareket hızı (dünya birimi/sn; index = waiterLevel). L1 (taban) = garson tutulunca;
     * L2 = mekânsal yükseltme ile (D-018 §7). Oyuncudan (player.moveSpeed 4.5) HER seviyede yavaş =
     * kısmi assist korunur (D-014: garson tek başına büyüyen mekânı döndüremez). L1 1.8 alan büyüyünce
     * doğrulanmış kullanılır hız; L2 2.6 belirgin hızlanma ama hâlâ oyuncunun çok altında.
     */
    moveSpeedByLevel: [1.8, 2.6],
    /** Tepsi kapasitesi (tek seferde taşıdığı çay). Oyuncununkinden küçük. */
    trayCapacity: 1,
    /** Garson L2 yükseltme maliyeti (₺). Tek seviye (L1→L2); L3+ Faz 4 (💎/video). */
    upgradeCost: 200,
    /** Mekânsal garson yükseltme noktasında saniyede cüzdandan akan ₺. */
    upgradeFillRate: 60,
    /** Yükseltme noktası önkoşulu: garson tutulmuş olmalı (tutulunca belirir). */
    upgradeRequires: { prev: ['waiter'] } satisfies Requires,
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

  /**
   * Bardak döngüsü (Faz 2e §5): bardak SINIRLI kaynak (My Hotel "odayı temizle" karşılığı).
   * Demleme bir TEMİZ bardak harcar; içen müşteri masada KİRLİ bardak bırakır; oyuncu (sonra
   * bulaşıkçı) kirlileri toplayıp BULAŞIK noktasında yıkar → temiz havuza döner. Temiz biterse
   * demleme DURUR → ikinci çember (kirli topla/yıka) zorunlu olur. Havuz ocak seviyesiyle büyür.
   * Bardak sayıları TRANSIENT (her oturumda havuz dolu temizle başlar; readyCups/tray gibi).
   */
  cups: {
    /** L0 toplam bardak havuzu (temiz+kirli+akıştaki tüm bardaklar). */
    poolBase: 10,
    /** Her ocak seviyesi havuza eklenen bardak. */
    poolPerLevel: 2,
    /** Oyuncunun masadaki kirli bardağı toplama yakınlığı. */
    collectRadius: 1.4,
    /** Bulaşık noktasında yıkama yakınlığı (varınca taşınan kirliler temize döner). */
    washRadius: 1.6,
    /**
     * Kirli masa eşiği (D-019): bir masada bu sayıdan FAZLA (>) kirli bardak birikince masa KİRLİ olur.
     * Eşik 2 → 2'den fazla = 3+ kirli ⇒ masa kirli (kullanıcı isteği "2'den fazla / 3+"). Kirli masaya:
     * yeni müşteri OTURMAZ + garson çay GÖTÜRMEZ + üstünde "koku" işareti. Oyuncu eşiğe (≤2) indirene
     * kadar masa kilitli → temizlik baskısı.
     */
    dirtyThreshold: 2,
  },

  /**
   * Bulaşıkçı (Faz 2e opsiyonel — garson deseni: `dishwasher` pad'iyle tutulur, ZORUNLU değil).
   * Kısmi assist: oyuncudan yavaş + küçük taşıma → tek başına yetişmez, oyuncu hâlâ gerekli.
   * Kirli bardakları toplar → bulaşık noktasına götürür → yıkar (temiz havuza döner).
   */
  dishwasher: {
    /** Hareket hızı (dünya birimi/sn). Oyuncudan yavaş. */
    moveSpeed: 1.8,
    /** Tek seferde taşıdığı kirli bardak. */
    carryCapacity: 2,
  },

  /** Yere düşen para. */
  money: {
    /** Düşen para kaç sn sonra kaybolur (0 = asla; Faz 4 otomatik toplayıcı). */
    lifetime: 0,
    /** Sahip karakterinin toplama yarıçapı (dünya birimi). */
    pickupRadius: 1.4,
    /**
     * Faz 2f juice: bu yarıçapa giren para oyuncuya doğru AKAR (klasik tycoon mıknatısı) ve yaklaşınca
     * toplanır. Mıknatıs store'da gerçek hareket olarak yapılır (görsel-only değil) → para asla oyuncuya
     * "yapışıp toplanmadan peşinden gelmez". Hız oyuncu hızından (4.5) yüksek olmalı ki daima yetişip toplasın.
     */
    attractRadius: 2.6,
    attractSpeed: 9,
  },

  /**
   * Satın-alma pad'leri (Roblox-tycoon mantığı; cüzdandan pad'e ₺ akar). SIRALI gating
   * (D-010 §3.4): bir pad `requires` karşılanmadan görünmez/aktif olmaz. Her pad, açtığı
   * objenin TAM yerinde durur (pozisyonlar LAYOUT.padPos). effect:
   *   addTable     → +1 masa (oturma kapasitesi; o masanın yerinde inşa olur)
   *   addStation   → +1 çay ocağı (pişirme kapasitesi; extraStationSpeedFactor ile hızlanır)
   *   serviceSpeed → demleme süresi ×factor (semaver = daha hızlı throughput)
   *   hireWaiter   → garson tut (opsiyonel kısmi servis yardımı; bkz. `waiter`)
   * `optional:true` pad'ler OMURGA zincirini KİLİTLEMEZ: alınmasa da sonraki masalar/ocaklar açılır
   * (oyuncu isterse alır, istemezse kendi gezerek servis eder). `currentPad` opsiyonelleri atlar.
   * Maliyetler tempo hedefine göre ayarlı (ilk alım <90sn; simulate.ts doğrular).
   * BAŞLANGIÇ SALONU = 1 ocak : 4 masa (D-012). Omurga: 2.Masa → (ocak L≥1) → 3.Masa → 4.Masa → Semaver.
   * Tek ana ocak 4 masaya throughput'la yetişir (ocak seviyesi + semaver). 2. ocak Faz 3a'da YENİ salonla
   * otomatik gelir (addStation effect tipi orada kullanılır). Opsiyonel: Garson (2.Masa sonrası).
   */
  pads: [
    { id: 'table2', label: '2. Masa', cost: 35, fillRate: 40, optional: false,
      requires: { minLifetime: 30 }, effect: { type: 'addTable' } },
    // Garson: D-019 reveal sırası — "çay ocağı bir kez yükseltilince" belirir (minStationLevel:1) → 2. masa
    // açılınca aynı anda 4 işaret patlamaz; önce çay yükseltme öğrenilir, sonra garson tanıtılır.
    { id: 'waiter', label: 'Garson Tut', cost: 150, fillRate: 50, optional: true,
      requires: { prev: ['table2'], minStationLevel: 1 }, effect: { type: 'hireWaiter' } },
    // 3. Masa: D-019 §2 — masa açmak ARTIK yükseltme gerektirmez (minStationLevel:1 KALKTI). Ocak doğal
    // darboğaz olarak kalır (oyuncu isteyince yükseltir), zorunlu gate değil.
    { id: 'table3', label: '3. Masa', cost: 120, fillRate: 55, optional: false,
      requires: { prev: ['table2'] }, effect: { type: 'addTable' } },
    { id: 'dishwasher', label: 'Bulaşıkçı Tut', cost: 280, fillRate: 60, optional: true,
      requires: { prev: ['table3'] }, effect: { type: 'hireDishwasher' } },
    { id: 'table4', label: '4. Masa', cost: 300, fillRate: 75, optional: false,
      requires: { prev: ['table3'] }, effect: { type: 'addTable' } },
    // (D-018 adım 5) Ayrı "Semavere Geçiş" pad'i KALDIRILDI: semaver artık çay ocağının üst yükseltmesidir
    // (TeaStation seviyeyle büyüyen semaveri zaten çizer). Tek ocak ₺ yükseltmeleriyle (L4, throughput ×3.32)
    // 4 masaya yetişir; "Usta" master tier (💎/video) Faz 4. Omurga zinciri artık table4'te biter.
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

/** Pad listesinden TÜRETİLEN durum (D-015). Bu alanlar AYRI saklanmaz. */
export interface DerivedState {
  tables: number;
  stations: number;
  serviceSpeedMult: number;
  hasWaiter: boolean;
  hasDishwasher: boolean;
}

/**
 * D-015: `padsDone` TEK doğru kaynak. `tables/stations/serviceSpeedMult/hasWaiter`
 * buradan türetilir → masa sayacı ile pad listesi gibi alanlar yapısal olarak
 * DESENKRONİZE OLAMAZ (eski v6/v7 senkron-yamaları gereksizleşir).
 * `stations` şu an tek salon = tek ocak (D-012); Faz 3a addStation pad'leriyle artacak.
 */
export function derivedFromPads(padsDone: readonly string[]): DerivedState {
  let tables = 1;
  let serviceSpeedMult = 1;
  let hasWaiter = false;
  let hasDishwasher = false;
  const byId = new Map<string, PadDef>((economyConfig.pads as readonly PadDef[]).map((p) => [p.id, p]));
  for (const id of padsDone) {
    const pad = byId.get(id);
    if (!pad) continue;
    switch (pad.effect.type) {
      case 'addTable':
        tables += 1;
        break;
      case 'hireWaiter':
        hasWaiter = true;
        break;
      case 'hireDishwasher':
        hasDishwasher = true;
        break;
    }
  }
  return { tables, stations: 1, serviceSpeedMult, hasWaiter, hasDishwasher };
}

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

/** Toplam bardak havuzu (temiz+kirli+akıştaki): ocak seviyesiyle büyür (Faz 2e §5). */
export function cupPoolCapacity(stationLevel: number): number {
  return economyConfig.cups.poolBase + economyConfig.cups.poolPerLevel * stationLevel;
}

/** Mevcut masa seviyesinden bir sonraki yükseltmenin maliyeti (₺). Faz 2h. */
export function tableUpgradeCost(level: number): number {
  const u = economyConfig.tables.upgrade;
  return Math.floor(u.costBase * Math.pow(u.costGrowth, level));
}

/** Servis başına ek bahşiş (₺) — masa seviyesiyle artar (çay fiyatı sabit kalır). Faz 2h. */
export function tableTip(level: number): number {
  return economyConfig.tables.tipBase * level;
}

/** Müşteri sabrı (sn) — masa seviyesiyle artar (taban + perLevel × seviye). Faz 2h. */
export function tablePatience(level: number): number {
  return economyConfig.npc.patience + economyConfig.tables.patiencePerLevel * level;
}

/** Garson hareket hızı (seviye index'e göre; aşırı seviyede son değere kelepçelenir). Faz 2 D-018 §7. */
export function waiterSpeed(level: number): number {
  const arr = economyConfig.waiter.moveSpeedByLevel;
  return arr[Math.min(Math.max(level, 0), arr.length - 1)];
}

/** ₺ ile çıkılabilen en yüksek garson seviyesi (index; L1=0 taban → L2=1). */
export function waiterSoftMaxLevel(): number {
  return economyConfig.waiter.moveSpeedByLevel.length - 1;
}

/** Verilen seviyedeki toplam çıktı çarpanı (L5 usta sıçramasını da içerir). */
export function upgradeOutputMultiplier(spec: UpgradeSpec, level: number): number {
  const masterReached = level >= spec.masterLevel;
  const softLevels = masterReached ? spec.masterLevel - 1 : level;
  let mult = Math.pow(spec.outputMult, softLevels);
  if (masterReached) mult *= spec.masterOutputMult;
  return mult;
}
