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

export const SAVE_VERSION = 26;

/**
 * ZONE modeli (Faz 3a + D-022, gece 2026-06-10): zemin kat zone'ları. Her zone kendi TEMALI
 * ocak+bulaşık köşesine sahip (per-zone servis); masa slotları GLOBAL index'lidir
 * (zone z → slotlar [z*TABLES_PER_ZONE, z*TABLES_PER_ZONE+4)). Açılış sırası gating'le katı
 * (zone2 pad'i table4 ister) → açık masa index'leri DAİMA bitişiktir (0..tables-1).
 * M2 (2026-06-12, onaylı plan): kat 2×2 IZGARA. Revizyon (2026-06-11 kullanıcı): zone-4 (maç salonu)
 * ve tuvalet+depo GERİ ALINDI; z2 (TOST) arka-SAĞA taşındı — z0 ön-sol (çay), z1 ön-sağ (çay),
 * z2 arka-sağ (TOST). Arka-sol hücre REZERV arsa (içerik sonra tasarlanacak). Açılış: z1 → z2.
 */
export const TABLES_PER_ZONE = 4;
export const MAX_ZONES = 3;
/** Global masa index'inin ait olduğu zone. */
export function zoneOfTable(tableIndex: number): number {
  return Math.min(MAX_ZONES - 1, Math.floor(tableIndex / TABLES_PER_ZONE));
}

/**
 * ÜRÜN HATTI (M3; D-010 alt kararı "fiyat artışı YENİ menü ürünleriyle"): her zone'un istasyonu
 * TEK ürün üretir. Çay fiyatı sabit kalır; TOST ikinci hat — pahalı + yavaş hazırlanır (throughput
 * matematiği aynı, sabitler farklı → zone başına gelir profili değişir).
 *  - dish: müşterinin masada bıraktığı kirlinin görseli (bardak/tabak; havuz ORTAKTIR — korunum
 *    değişmezi tek kalır, yıkama aynı döngü).
 *  - upgradeCostMult: istasyon ₺ yükseltme maliyet çarpanı (çay eğrisi 20/30/45/68 erken oyun için;
 *    tost tezgâhı geç-oyun → aynı eğri ×20 = 400/600/900/1350, sim ile kalibre).
 */
export type ProductId = 'tea' | 'tost';
export const PRODUCTS = {
  tea: { price: 5, prepTime: 6, dish: 'cup', upgradeCostMult: 1 },
  tost: { price: 25, prepTime: 14, dish: 'plate', upgradeCostMult: 20 },
} as const;
/** Zone → ürün eşlemesi: z2 (arka-sağ) = TOST OCAĞI; diğerleri çay. */
export const ZONE_PRODUCTS: readonly ProductId[] = ['tea', 'tea', 'tost'];
export function zoneProduct(z: number): ProductId {
  return ZONE_PRODUCTS[Math.min(Math.max(z, 0), ZONE_PRODUCTS.length - 1)];
}
/** Zone'un VARSAYILAN zemin teması (Y1 yemek alanı kimliği): tost salonu 'yemek' fayansıyla doğar;
 *  kozmetik mağaza satın alımı yine üstüne yazabilir. */
export function defaultFloorTheme(z: number): string {
  return zoneProduct(z) === 'tost' ? 'yemek' : 'parke';
}

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
  /**
   * ARKA-PLAN ŞARTI (kullanıcı 2026-06-09: "garsonu açtım, hemen hızlandırma geldi — öyle olmasın"):
   * garson en az bu kadar çay taşımadan ilgili yükseltme görünmez → yeni özellik sindirilmeden
   * üstüne yenisi yığılmaz.
   */
  minWaiterServed?: number;
}

/**
 * Görev hedefi (quest sistemi, 2026-06-09). Sayaç hedefleri (count'lu) görev BAŞLADIĞINDAN itibaren
 * delta sayılır; durum hedefleri (pad/level) doğrudan oyun durumundan okunur.
 */
export type QuestTarget =
  | { type: 'pickupTea'; count: number } // ocaktan tepsiye çay al
  // zone verilirse YALNIZ o salondaki servisler sayılır (v23: "Yeni salonda 5 çay" gerçekten
  // salon-2'de saysın — eski global sayaç zone-1 servisini de sayıyordu).
  | { type: 'serveTea'; count: number; zone?: number } // oyuncu eliyle masaya çay bırak
  | { type: 'collectCoin'; count: number } // yerden para topla
  | { type: 'washDish'; count: number } // oyuncu eliyle bulaşıkta kirli yıka
  | { type: 'pad'; id: string } // pad'i tamamla (masa aç / personel tut)
  | { type: 'stationLevel'; level: number } // çay ocağı seviyesi
  | { type: 'waiterLevel'; level: number } // garson hız seviyesi
  | { type: 'tableLevel'; level: number } // HERHANGİ bir masa bu seviyeye ulaşsın
  | { type: 'charStat'; stat: CharStat; tier: number }; // karakter özelliği bu kademeye ulaşsın (v20)

/** Karakter özellikleri (v20): tepsi kapasitesi / para mıknatısı / hareket hızı. */
export type CharStat = 'tray' | 'magnet' | 'speed';
/** Özellik-başı satın alınmış kademeler (persist v20). Karakter seviyesi = toplam kademe (türetilir). */
export interface CharUpgrades {
  tray: number;
  magnet: number;
  speed: number;
}

/** Sıralı görev (tek aktif; üst görev barında gösterilir, kamera hedefe yönlendirilebilir). */
export interface QuestDef {
  id: string;
  title: string;
  target: QuestTarget;
  /** Hedefin zone'u (kamera odağı doğru salona baksın; yoksa 0). */
  zone?: number;
  /** Tamamlanınca cüzdana eklenen ₺ ödülü (M1, kullanıcı isteği 2026-06-12). Band: sıradaki
   *  pad maliyetinin ~%10-20'si — tempoyu pürüzsüzleştirir, satın almayı oyuncu yerine yapmaz. */
  reward?: number;
}

export const economyConfig = {
  saveVersion: SAVE_VERSION,
  currency: CURRENCY,

  /** Çay istasyonu (Faz 1 çekirdeği). Fiyat/hazırlama TEK kaynak: PRODUCTS.tea (M3 ürün hattı). */
  teaStation: {
    /** Bir bardak çay demlenme süresi (sn) — sipariş timer'ı. */
    baseBrewTime: PRODUCTS.tea.prepTime,
    /** Servis edilen çay başına SABİT ₺ (yükseltme bunu DEĞİL, throughput'u büyütür). */
    basePrice: PRODUCTS.tea.price,
    upgrade: {
      costBase: 20, // garson öncesi: erken yükseltme ucuz, akış hızlansın (kullanıcı 2026-06-09)
      costGrowth: 1.5,
      outputMult: 1.35, // throughput (çay/dk) çarpanı — demleme süresini kısaltır
      masterLevel: 5,
      masterDiamondCost: 15,
      masterOutputMult: 2.0,
    } satisfies UpgradeSpec,
    /**
     * Yükseltme noktasının ZONE-BAŞINA önkoşulu (v21 — kullanıcı 2026-06-12: "zone-2'de de düzen
     * olmalı"): her salonun ocak yükseltmesi O salonun 2. masası açılınca belirir (tür konvansiyonu:
     * önce kapasite, sonra verim — zone-1 deseni aynalanır). index = zone.
     */
    upgradeRequiresByZone: [
      { prev: ['table2'] },
      { prev: ['z2table2'] },
      { prev: ['z3table2'] },
    ] satisfies readonly Requires[],
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
      costGrowth: 1.8, // garson sonrası derinlik: L1 60 / L2 108 / L3 194 / L4 350 (eski 1.6 fazla ucuzdu)
      masterLevel: 5, // L5 (Usta) 💎/video — Faz 4; ₺ ile soft max L4
      masterDiamondCost: 12,
    },
    /** Yükseltme noktasında saniyede cüzdandan akan ₺ (mekânsal yükseltme). */
    upgradeFillRate: 60,
    /** ZONE-BAŞINA önkoşul (v21): o salonun masa yükseltmeleri, O salonun 4 masası da açılınca belirir
     *  (D-019 §3 — masa yükseltmeleri geç-oyun derinliği; erken ekran sade; zone-1 deseni aynalanır). */
    upgradeRequiresByZone: [
      { prev: ['table4'] },
      { prev: ['z2table4'] },
      { prev: ['z3table4'] },
    ] satisfies readonly Requires[],
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
    /** Bir bardak çay demleme süresi (sn) — stationLevel throughput'u bunu kısaltır.
     *  (M3: TEK kaynak PRODUCTS.tea; tost zone'unun süresi PRODUCTS.tost.prepTime.) */
    orderTime: PRODUCTS.tea.prepTime,
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
    // Tepsi kapasitesi ARTIK karakter yükseltmesinden türetilir (v20: character.tray; trayCapacity()).
    // PAYLAŞIMLI tepsi kuralı aynen: çay + kirli AYNI tepsiyi paylaşır, toplam kapasiteyi aşamaz
    // (eski "eli boşken / tek renk" kısıtı deadlock yaptığı için kaldırılmıştı; karışık taşıma kilit-geçirmez).
    /** Oyuncunun ocaktan çay alma yakınlığı (dünya birimi). */
    pickupRadius: 1.6,
    /** Oyuncunun masaya çay bırakma yakınlığı. */
    serveRadius: 1.6,
  },

  /**
   * KARAKTER YÜKSELTMELERİ (v20; docs/character-upgrades-design.md — kullanıcı onaylı):
   * özellik-bazlı satın alma (buyCharUpgrade); karakter seviyesi = toplam kademe (salt görsel).
   * values[kademe] = etkin değer (0 = başlangıç); costs[k] = k → k+1 yükseltmenin ₺ maliyeti.
   * Tepsi T1-T2 BASİT, T3-T4 ÇOK ZOR (kullanıcı: "ilk 4 basit, 5-6 çok zor" — garson varken 5-6
   * kapasite lüks/aspirasyonel para-biriktirme hedefi; kozmetik 10-18k bandını TAKİP eder).
   * Yükseltmeler OYUNCUYU güçlendirir, oyunu otomatikleştirmez (D-014 aktif oynanış korunur).
   */
  character: {
    /** Tepsi kapasitesi (oyuncunun tek turda taşıdığı çay+kirli toplamı). Yeni oyun 2 başlar. */
    // T1/T2 2026-06-11 kullanıcı kararı: 150/500 → 75/150 ("tepsi o kadar olmamalı; azıcık hız katarız").
    tray: { values: [2, 3, 4, 5, 6], costs: [75, 150, 15_000, 60_000] },
    /** Para mıknatısı yarıçapı (dünya birimi; money.attractRadius'un yerini aldı).
     *  M1 250→200 (kullanıcı 2026-06-11: "azıcık insin" — 4. masa dönemiyle hizalanır). */
    magnet: { values: [2.6, 3.4, 4.2, 5.0], costs: [200, 900, 2_800] },
    /** Hareket hızı (dünya birimi/sn; player.moveSpeed'in yerini aldı). Tavan +%20 bilinçli düşük. */
    speed: { values: [4.5, 4.8, 5.1, 5.4], costs: [400, 1_400, 4_500] },
  },

  /**
   * Garson (Faz 2d, opsiyonel — `waiter` pad'iyle tutulur, ZORUNLU değil). KISMİ assist:
   * oyuncudan YAVAŞ ve KÜÇÜK tepsili → tek başına büyüyen mekânı döndüremez; oyuncu hâlâ gerekli.
   * Ocaktan tek çay alır, en yakın bekleyen müşteriye götürür, döner (D-012 bölge-başı personel).
   */
  waiter: {
    /**
     * Seviye-başı hareket hızı (dünya birimi/sn; index = waiterLevel). L1 (taban) = garson tutulunca;
     * L2 = mekânsal yükseltme ile (D-018 §7). Oyuncudan (character.speed taban 4.5) HER seviyede yavaş =
     * kısmi assist korunur (D-014: garson tek başına büyüyen mekânı döndüremez).
     * 2026-06-11 (kullanıcı onaylı): per-zone mutfakla (D-025) mesafeler kısalınca garson "çok hızlı"
     * hissettirdi → 1.8/2.3 → 1.5/2.0. Tur hesabı: ocak→en uzak masa ~8.7 br → L1 tek yön ~5.8sn,
     * tur ~12sn < sabır 18sn (güvenli pay sürer).
     */
    moveSpeedByLevel: [1.5, 2.0],
    /** Tepsi kapasitesi (tek seferde taşıdığı çay). Oyuncununkinden küçük. */
    trayCapacity: 1,
    /** Garson L2 yükseltme maliyeti (₺). Tek seviye (L1→L2); L3+ Faz 4 (💎/video). */
    upgradeCost: 250,
    /** Mekânsal garson yükseltme noktasında saniyede cüzdandan akan ₺. */
    upgradeFillRate: 60,
    /**
     * Yükseltme noktası önkoşulu: garson tutulmuş + en az 20 çay TAŞIMIŞ olmalı (arka-plan şartı;
     * kullanıcı 2026-06-09: tutar tutmaz hızlandırma belirmesin — önce garson işbaşında görülsün).
     */
    upgradeRequires: { prev: ['waiter'], minWaiterServed: 20 } satisfies Requires,
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
     * Faz 2f juice: attractRadius'a (v20: character.magnet kademesinden türetilir — attractRadius())
     * giren para oyuncuya doğru AKAR (klasik tycoon mıknatısı) ve yaklaşınca toplanır. Mıknatıs store'da
     * gerçek hareket olarak yapılır (görsel-only değil) → para asla oyuncuya "yapışıp toplanmadan
     * peşinden gelmez". Hız max oyuncu hızından (5.4) yüksek olmalı ki daima yetişip toplasın.
     */
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
    // QUEST HATTI (2026-06-09, kullanıcı onayı): personel pad'leri OPSİYONEL DEĞİL — sıralı görev hattının
    // zorunlu halkaları (My Perfect Hotel modeli; D-014 "garson opsiyonel" kararı geçersiz). Omurga sırası
    // quests[] ile birebir: table2 → table3 → waiter → dishwasher → table4. Görünürlük quest sisteminde
    // (yalnız aktif görevin pad'i çizilir → "ekranda tek pad"); requires zinciri güvenlik ağı olarak kalır.
    { id: 'table2', label: '2. Masa', cost: 25, fillRate: 40, optional: false, zone: 0,
      requires: { minLifetime: 20 }, effect: { type: 'addTable' } },
    { id: 'table3', label: '3. Masa', cost: 130, fillRate: 55, optional: false, zone: 0,
      requires: { prev: ['table2'] }, effect: { type: 'addTable' } },
    { id: 'waiter', label: 'Garson Tut', cost: 150, fillRate: 50, optional: false, zone: 0,
      requires: { prev: ['table3'] }, effect: { type: 'hireWaiter' } },
    // 2026-06-11 telefon feedback turu-2: 330 "aşırı fazla, git gel bitmiyor" → 200 (kullanıcı verdi).
    { id: 'dishwasher', label: 'Bulaşıkçı Tut', cost: 200, fillRate: 60, optional: false, zone: 0,
      requires: { prev: ['waiter'] }, effect: { type: 'hireDishwasher' } },
    { id: 'table4', label: '4. Masa', cost: 420, fillRate: 75, optional: false, zone: 0,
      requires: { prev: ['dishwasher'] }, effect: { type: 'addTable' } },
    // (D-018 adım 5) Ayrı "Semavere Geçiş" pad'i KALDIRILDI: semaver artık çay ocağının üst yükseltmesidir
    // (TeaStation seviyeyle büyüyen semaveri zaten çizer). Tek ocak ₺ yükseltmeleriyle (L4, throughput ×3.32)
    // 4 masaya yetişir; "Usta" master tier (💎/video) Faz 4. Zone-1 omurgası table4'te biter.
    // --- ZONE-2 zinciri (Faz 3a + D-022, gece 2026-06-10): per-zone TEMALI ocak+bulaşık. Unlock pad'i
    // bölme duvarındaki GEÇİTTE; açılınca zone-2 OTOMATİK 1 ocak (L1) + 1 masa + 1 bulaşık köşesiyle gelir.
    // Maliyetler GECE BAŞLANGIÇ değerleri — curve raporu (madde 5) sabah onayıyla kalibre edilir.
    // −%10 ucuzlatma (kullanıcı 2026-06-11: "git gel çok, çok az ucuzlat") — z2/z3 zincirleri,
    // yuvarlanmış; öğretici (zone-1) pad'leri ve yükseltme eğrileri AYNI kaldı.
    { id: 'zone2', label: '2. Salon', cost: 1100, fillRate: 150, optional: false, zone: 0,
      requires: { prev: ['table4'] }, effect: { type: 'unlockZone' } },
    { id: 'z2table2', label: '2. Masa', cost: 225, fillRate: 80, optional: false, zone: 1,
      requires: { prev: ['zone2'] }, effect: { type: 'addTable' } },
    { id: 'z2waiter', label: 'Garson Tut', cost: 360, fillRate: 80, optional: false, zone: 1,
      requires: { prev: ['z2table2'] }, effect: { type: 'hireWaiter' } },
    { id: 'z2table3', label: '3. Masa', cost: 540, fillRate: 90, optional: false, zone: 1,
      requires: { prev: ['z2waiter'] }, effect: { type: 'addTable' } },
    { id: 'z2dishwasher', label: 'Bulaşıkçı Tut', cost: 720, fillRate: 100, optional: false, zone: 1,
      requires: { prev: ['z2table3'] }, effect: { type: 'hireDishwasher' } },
    { id: 'z2table4', label: '4. Masa', cost: 1000, fillRate: 110, optional: false, zone: 1,
      requires: { prev: ['z2dishwasher'] }, effect: { type: 'addTable' } },
    // --- ZONE-3 zinciri (M2 altyapı + M3 tost): arka-SAĞ salon = TOST OCAĞI (2026-06-11 taşıma).
    // Unlock pad'i z1'in arka geçidi yanında (sıra-arası duvar geçidi). Maliyetler M3 sim kalibrasyonuna
    // açık başlangıç değerleri (~2× z2 zinciri; zone-2 bitiminden ~30-60dk aktif oyun hedefi).
    { id: 'zone3', label: 'Tost Salonu', cost: 3600, fillRate: 250, optional: false, zone: 0,
      requires: { prev: ['z2table4'] }, effect: { type: 'unlockZone' } },
    { id: 'z3table2', label: '2. Masa', cost: 540, fillRate: 110, optional: false, zone: 2,
      requires: { prev: ['zone3'] }, effect: { type: 'addTable' } },
    { id: 'z3waiter', label: 'Garson Tut', cost: 800, fillRate: 120, optional: false, zone: 2,
      requires: { prev: ['z3table2'] }, effect: { type: 'hireWaiter' } },
    { id: 'z3table3', label: '3. Masa', cost: 1250, fillRate: 130, optional: false, zone: 2,
      requires: { prev: ['z3waiter'] }, effect: { type: 'addTable' } },
    { id: 'z3dishwasher', label: 'Bulaşıkçı Tut', cost: 1600, fillRate: 140, optional: false, zone: 2,
      requires: { prev: ['z3table3'] }, effect: { type: 'hireDishwasher' } },
    { id: 'z3table4', label: '4. Masa', cost: 2250, fillRate: 150, optional: false, zone: 2,
      requires: { prev: ['z3dishwasher'] }, effect: { type: 'addTable' } },
  ],

  /**
   * GÖREV HATTI (2026-06-09, Fable brief §1+§4): ilerleme sıralı TEK görevle yönlendirilir.
   * Üst-orta görev barı aktif görevi gösterir; dokununca kamera hedefe kayar. Sayaç hedefleri
   * (count) görev BAŞLADIĞINDAN itibaren DELTA sayılır (kümülatif değil — questBase store'da).
   * Pad görevleri sırasında YALNIZ o pad'in işareti çizilir ("ekranda tek pad").
   * Görev hattı bitince serbest oyun: kalan yükseltme noktaları zaten kalıcı-sade görünür.
   */
  quests: [
    // Karakter görevleri (v20) — zamanlama kullanıcı talimatıyla BİRİNCİ öncelik
    // (docs/character-upgrades-design.md §5): q_charTray1 q_serve5'ten HEMEN ÖNCE (2 masa + tepsi 2
    // darlığı TAM o anda yaşanır; T1=75₺ o noktada rahat); q_charTray2 q_table3→q_waiter ARASI
    // (3 masa solo dönerken kapasite 4 anlamlı — önce kendi gücü, sonra otomasyon); q_charMagnet
    // q_table4 SONRASI (4 masa + garson döneminde yere düşen para zirve yapar). T3/T4 ve hız GÖREVSİZ.
    { id: 'q_pickup', title: 'Ocaktan çay al', target: { type: 'pickupTea', count: 1 }, reward: 3 },
    { id: 'q_serve1', title: 'Çayı müşteriye götür', target: { type: 'serveTea', count: 1 }, reward: 3 },
    { id: 'q_coin', title: 'Yere düşen parayı topla', target: { type: 'collectCoin', count: 1 }, reward: 5 },
    { id: 'q_table2', title: '2. Masayı aç', target: { type: 'pad', id: 'table2' }, reward: 10 },
    { id: 'q_charTray1', title: 'Tepsini büyüt', target: { type: 'charStat', stat: 'tray', tier: 1 }, reward: 15 },
    { id: 'q_serve5', title: '5 çay servis et', target: { type: 'serveTea', count: 5 }, reward: 15 },
    { id: 'q_station2', title: 'Çay ocağını yükselt', target: { type: 'stationLevel', level: 1 }, reward: 10 },
    { id: 'q_wash', title: '3 kirli bardak yıka', target: { type: 'washDish', count: 3 }, reward: 15 },
    { id: 'q_table3', title: '3. Masayı aç', target: { type: 'pad', id: 'table3' }, reward: 25 },
    { id: 'q_charTray2', title: "Tepsini 4'e çıkar", target: { type: 'charStat', stat: 'tray', tier: 2 }, reward: 30 },
    { id: 'q_waiter', title: 'Garson tut', target: { type: 'pad', id: 'waiter' }, reward: 30 },
    { id: 'q_dish', title: 'Bulaşıkçı tut', target: { type: 'pad', id: 'dishwasher' }, reward: 40 },
    { id: 'q_table4', title: '4. Masayı aç', target: { type: 'pad', id: 'table4' }, reward: 60 },
    { id: 'q_charMagnet', title: 'Para mıknatısını güçlendir', target: { type: 'charStat', stat: 'magnet', tier: 1 }, reward: 50 },
    // --- ZONE-2 görev hattı (Faz 3a + D-022): geçitteki pad → yeni salonun kendi zinciri.
    // v22 (kullanıcı 2026-06-11): q_zone2 YÜKSELTME görevlerinin (garson hız + masa) ÖNÜNE alındı —
    // "2. salon için yükseltmelerin tamamlanmasına gerek yok"; tüm zone-1 pad'leri (table4 zinciri) yeter.
    // v23 (görev senkronu, 2026-06-11 turu-2): q_z2serve q_zone2'nin HEMEN arkasına — salon açılınca
    // kamera oraya pan atarken görev oyuncuyu zone-1'e geri yollamasın; önce yeni salonu yaşa,
    // sonra zone-1 yükseltmeleri (q_waiterL2/q_tableL2). target.zone=1: yalnız salon-2 servisleri sayar.
    { id: 'q_zone2', title: '2. Salonu aç', target: { type: 'pad', id: 'zone2' }, reward: 150 },
    { id: 'q_z2serve', title: 'Yeni salonda 5 çay servis et', target: { type: 'serveTea', count: 5, zone: 1 }, zone: 1, reward: 60 },
    { id: 'q_waiterL2', title: 'Garsonu hızlandır', target: { type: 'waiterLevel', level: 1 }, reward: 50 },
    { id: 'q_tableL2', title: 'Bir masayı yükselt', target: { type: 'tableLevel', level: 1 }, reward: 30 },
    { id: 'q_z2table2', title: 'Salon 2: 2. Masayı aç', target: { type: 'pad', id: 'z2table2' }, zone: 1, reward: 50 },
    { id: 'q_z2waiter', title: 'Salon 2: Garson tut', target: { type: 'pad', id: 'z2waiter' }, zone: 1, reward: 80 },
    { id: 'q_z2table3', title: 'Salon 2: 3. Masayı aç', target: { type: 'pad', id: 'z2table3' }, zone: 1, reward: 100 },
    { id: 'q_z2dish', title: 'Salon 2: Bulaşıkçı tut', target: { type: 'pad', id: 'z2dishwasher' }, zone: 1, reward: 120 },
    { id: 'q_z2table4', title: 'Salon 2: 4. Masayı aç', target: { type: 'pad', id: 'z2table4' }, zone: 1, reward: 200 },
    // --- ZONE-3 TOST OCAĞI hattı (M3): ikinci ürün hattının tanıtımı. SONA EKLENDİ (append-only →
    // eski kayıtların questIndex'i İD-eşleme gerektirmeden geçerli kalır; hattı bitirmiş kayıt
    // kaldığı yerden yeni görevlere devam eder).
    { id: 'q_zone3', title: 'Tost Salonunu aç', target: { type: 'pad', id: 'zone3' }, zone: 2, reward: 400 },
    { id: 'q_z3serve', title: 'Tost salonunda 5 sipariş servis et', target: { type: 'serveTea', count: 5, zone: 2 }, zone: 2, reward: 150 },
    { id: 'q_z3table2', title: 'Tost: 2. Masayı aç', target: { type: 'pad', id: 'z3table2' }, zone: 2, reward: 100 },
    { id: 'q_z3waiter', title: 'Tost: Garson tut', target: { type: 'pad', id: 'z3waiter' }, zone: 2, reward: 150 },
    { id: 'q_z3table3', title: 'Tost: 3. Masayı aç', target: { type: 'pad', id: 'z3table3' }, zone: 2, reward: 200 },
    { id: 'q_z3dish', title: 'Tost: Bulaşıkçı tut', target: { type: 'pad', id: 'z3dishwasher' }, zone: 2, reward: 250 },
    { id: 'q_z3table4', title: 'Tost: 4. Masayı aç', target: { type: 'pad', id: 'z3table4' }, zone: 2, reward: 350 },
  ] as readonly QuestDef[],

  // Oyuncu hareket hızı v20'de character.speed kademesinden türetilir (playerSpeed()).

  /**
   * LEVEL/XP sistemi (2026-06-10, kullanıcı onayı): oyuncu seviyesi — ileride kat açma (Faz 3b)
   * ve kozmetik mağaza (tema/zemin/duvar) seviye kapısı olacak. XP kaynakları eylem-temelli
   * (para-temelli değil → ekonomi dengesinden bağımsız, gelir enflasyonundan etkilenmez).
   * Eğri: needFor(L→L+1) = levelBase × levelGrowth^(L-1). Zone-1 sonu ≈ L5-6.
   */
  xp: {
    /** Oyuncunun ELİYLE servis ettiği çay başına XP. */
    perTeaServed: 2,
    /** Garsonun taşıdığı çay başına XP (pasif — daha az). */
    perWaiterServed: 1,
    /** Oyuncunun yıkadığı kirli bardak başına XP. */
    perDishWashed: 1,
    /** Tamamlanan görev başına XP (ana kaynak). */
    perQuest: 25,
    /** Açılan pad (masa/personel) başına XP. */
    perPad: 15,
    /** Her ₺ yükseltme (ocak/garson/masa) başına XP. */
    perUpgrade: 10,
    /** L1→L2 için gereken XP. */
    levelBase: 60,
    /** Seviye başına gereksinim büyümesi. */
    levelGrowth: 1.5,
  },

  /**
   * Çevrimdışı (offline) gelir (kullanıcı isteği 2026-06-09: sert kıs → "birkaç yükseltme parası, oyuncu
   * nefes alsın; zone'u tek seferde bitirmesin"). İki kol birlikte kısar:
   *   - rateMult: offline oranı, idealize aktif oranın bu kadarı (1 = %100; 0.5 = yarı). Gerçek oyuncu
   *     idealize oranı tutturamadığından <1 olması "offline aktiften fazla ödüyor" sorununu da giderir.
   *   - baseCapHours: offline'da SAYILAN en fazla süre (cap). Bundan uzun kalınsa fazlası işlemez.
   */
  offline: {
    baseCapHours: 1,
    /**
     * 2026-06-11 nerf 0.5→0.2 SONRASI kullanıcı geri bildirimi (aynı gün): "yokken kazanılan para
     * aşırı azalmış, 3-4 şey karşılamalı" → 0.2 → 0.5 (kullanıcı önerisi; para tavanı asıl kelepçe).
     * Masa bahşişleri de orana dahil edildi (incomeRate) — ilerledikçe offline da büyür.
     */
    rateMult: 0.5,
    /**
     * PARA tavanı: offline kazanç, sıradaki omurga pad maliyetinin bu ORANINI aşamaz (süre tavanından
     * BAĞIMSIZ ikinci kelepçe). 0.6 → 1.2 (kullanıcı 2026-06-11): sıradaki pad + birkaç yükseltme
     * karşılanır; zone unlock sıradaysa açılır ama salonun İÇİ bitmez ("zone'u tek girişte bitirmesin"
     * ilkesi yumuşatılmış sürer).
     */
    capNextPadFrac: 1.2,
    /** Elmas ile uzatma başına eklenen saat (Faz 4). */
    diamondExtendHours: 8,
  },

  /**
   * KOZMETİK MAĞAZA (WP6, 2026-06-11; feedback §D19): zemin + duvar temaları ZONE-BAŞINA ₺ ile
   * satın alınır — PAHALI (geç oyun para biriktirme hedefi; "tek zone için 10k+"). Satın alınan
   * tema o zone için kalıcı sahipliktir (ownedCosmetics); tekrar seçmek ücretsiz. Görsel karşılıklar
   * palette.ts FLOOR_THEMES/WALL_THEMES'te (zone zemini temanın DÜZ base rengiyle boyanır).
   */
  cosmetics: {
    floorThemes: [
      { id: 'parke', label: 'Klasik Parke', cost: 0 },
      // Yemek salonunun doğuştan teması (Y1, defaultFloorTheme); ücretsiz — diğer salonlara da uygulanabilir.
      { id: 'yemek', label: 'Restoran Fayansı', cost: 0 },
      { id: 'fayans', label: 'Krem Fayans', cost: 10_000 },
      { id: 'dama', label: 'Dama Fayans', cost: 14_000 },
      { id: 'ceviz', label: 'Ceviz Parke', cost: 18_000 },
    ],
    wallThemes: [
      { id: 'krem', label: 'Krem Badana', cost: 0 },
      { id: 'yesil', label: 'Çay Yeşili', cost: 10_000 },
      { id: 'mavi', label: 'Çini Mavisi', cost: 14_000 },
    ],
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
  /** Açık zone sayısı (1 = yalnız zone-1). */
  zonesOpen: number;
  /** Zone başına açık masa sayısı (kapalı zone = 0; açık zone min 1 — Faz 3a oto-masa). */
  tablesByZone: number[];
  /** Zone başına garson tutuldu mu. */
  hasWaiterByZone: boolean[];
  /** Zone başına bulaşıkçı tutuldu mu. */
  hasDishwasherByZone: boolean[];
  /** GLOBAL açık masa sayısı — index'ler BİTİŞİK (zone sırası gating'le katı; HUD/test geri-uyumu). */
  tables: number;
  /** Açık ocak sayısı = zonesOpen (per-zone 1 ocak, D-022). */
  stations: number;
  serviceSpeedMult: number;
  /** Zone-1 garsonu (geri uyum: gate/reveal/testler). */
  hasWaiter: boolean;
  /** Zone-1 bulaşıkçısı (geri uyum). */
  hasDishwasher: boolean;
}

/**
 * D-015: `padsDone` TEK doğru kaynak. `tables/stations/serviceSpeedMult/hasWaiter`
 * buradan türetilir → masa sayacı ile pad listesi gibi alanlar yapısal olarak
 * DESENKRONİZE OLAMAZ (eski v6/v7 senkron-yamaları gereksizleşir).
 * `stations` şu an tek salon = tek ocak (D-012); Faz 3a addStation pad'leriyle artacak.
 */
export function derivedFromPads(padsDone: readonly string[]): DerivedState {
  const byId = new Map<string, PadDef>((economyConfig.pads as readonly PadDef[]).map((p) => [p.id, p]));
  // 1. geçiş: zone açılışları (zone-2 pad etkileri ancak zone açıkken sayılır — savunmacı).
  let zonesOpen = 1;
  for (const id of padsDone) {
    const pad = byId.get(id);
    if (pad && pad.effect.type === 'unlockZone') zonesOpen = Math.min(MAX_ZONES, zonesOpen + 1);
  }
  const tablesByZone: number[] = Array.from({ length: MAX_ZONES }, (_, z) => (z < zonesOpen ? 1 : 0));
  const hasWaiterByZone = Array.from({ length: MAX_ZONES }, () => false);
  const hasDishwasherByZone = Array.from({ length: MAX_ZONES }, () => false);
  for (const id of padsDone) {
    const pad = byId.get(id);
    if (!pad) continue;
    const z = (pad as { zone?: number }).zone ?? 0;
    if (z >= zonesOpen) continue; // kapalı zone'un pad'i etki edemez (bozuk kayda karşı)
    switch (pad.effect.type) {
      case 'addTable':
        tablesByZone[z] = Math.min(TABLES_PER_ZONE, tablesByZone[z] + 1);
        break;
      case 'hireWaiter':
        hasWaiterByZone[z] = true;
        break;
      case 'hireDishwasher':
        hasDishwasherByZone[z] = true;
        break;
    }
  }
  // Global masa index'leri BİTİŞİK kalmalı: bir zone açıksa ÖNCEKİ tüm zone'lar yapısal olarak doludur
  // (her unlock pad'i önceki zone'un table4'ünü ister); bozuk kayda karşı kelepçe (yoksa slot atlanır,
  // index kayardı). M2: 2 zone'a özel `tablesByZone[0]=...` genellendi (4 zone).
  for (let z = 0; z < zonesOpen - 1; z++) tablesByZone[z] = TABLES_PER_ZONE;
  const tables = tablesByZone.reduce((a, n) => a + n, 0);
  return {
    zonesOpen,
    tablesByZone,
    hasWaiterByZone,
    hasDishwasherByZone,
    tables,
    stations: zonesOpen,
    serviceSpeedMult: 1,
    hasWaiter: hasWaiterByZone[0],
    hasDishwasher: hasDishwasherByZone[0],
  };
}

/** Gating değerlendirmesi için gereken (salt-okunur) ilerleme durumu. */
export interface GateState {
  padsDone: string[];
  tables: number;
  stationLevel: number;
  lifetime: number;
  /** Garsonun bugüne dek taşıdığı çay (arka-plan şartları için; eski çağıranlar vermeyebilir → 0). */
  waiterServed?: number;
  /** ZONE-BAŞINA garson taşıma sayacı (v21 — z2 hızlandırma kendi garsonunun işini saysın). */
  waiterServedByZone?: number[];
}

/** Bir `requires` koşulu mevcut ilerleme durumunca karşılanıyor mu? */
export function requiresMet(req: Requires | undefined, g: GateState): boolean {
  if (!req) return true;
  if (req.prev && !req.prev.every((id) => g.padsDone.includes(id))) return false;
  if (req.minTables != null && g.tables < req.minTables) return false;
  if (req.minStationLevel != null && g.stationLevel < req.minStationLevel) return false;
  if (req.minLifetime != null && g.lifetime < req.minLifetime) return false;
  if (req.minWaiterServed != null && (g.waiterServed ?? 0) < req.minWaiterServed) return false;
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

/** L → L+1 için gereken XP (level 1-tabanlı). */
export function xpForLevel(level: number): number {
  const x = economyConfig.xp;
  return Math.round(x.levelBase * Math.pow(x.levelGrowth, Math.max(0, level - 1)));
}

/** Toplam XP'den seviye + seviye-içi ilerleme: { level, cur, need }. Level 1'den başlar. */
export function levelProgress(totalXp: number): { level: number; cur: number; need: number } {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp));
  let need = xpForLevel(level);
  // 10k seviye guard'ı: bozuk/aşırı xp değerinde sonsuz döngü olmasın.
  while (rest >= need && level < 10_000) {
    rest -= need;
    level += 1;
    need = xpForLevel(level);
  }
  return { level, cur: rest, need };
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

// ---- Karakter yükseltmeleri (v20) — kademe → değer türeticileri (TEK kaynak: economyConfig.character) ----

/** Özelliğin max kademesi (= satın alınabilir yükseltme sayısı). */
export function charMaxTier(stat: CharStat): number {
  return economyConfig.character[stat].costs.length;
}

/** Kademenin etkin değeri (taşan/bozuk kademe son değere kelepçelenir). */
export function charValue(stat: CharStat, tier: number): number {
  const arr = economyConfig.character[stat].values;
  return arr[Math.min(Math.max(tier, 0), arr.length - 1)];
}

/** tier → tier+1 yükseltmenin ₺ maliyeti; max kademede null. */
export function charNextCost(stat: CharStat, tier: number): number | null {
  const costs = economyConfig.character[stat].costs;
  return tier >= 0 && tier < costs.length ? costs[tier] : null;
}

/** Karakter seviyesi = alınan toplam kademe (salt görsel rozet; HUD yıldız-seviyesinden ayrı). */
export function charLevel(u: CharUpgrades): number {
  return u.tray + u.magnet + u.speed;
}

/** Oyuncunun tepsi kapasitesi (çay+kirli PAYLAŞIMLI toplam) — tepsi kademesinden. */
export function trayCapacityFor(tier: number): number {
  return charValue('tray', tier);
}

/** Para mıknatısı yarıçapı — mıknatıs kademesinden. */
export function attractRadiusFor(tier: number): number {
  return charValue('magnet', tier);
}

/** Oyuncu hareket hızı (dünya birimi/sn) — hız kademesinden. */
export function playerSpeedFor(tier: number): number {
  return charValue('speed', tier);
}

/** Verilen seviyedeki toplam çıktı çarpanı (L5 usta sıçramasını da içerir). */
export function upgradeOutputMultiplier(spec: UpgradeSpec, level: number): number {
  const masterReached = level >= spec.masterLevel;
  const softLevels = masterReached ? spec.masterLevel - 1 : level;
  let mult = Math.pow(spec.outputMult, softLevels);
  if (masterReached) mult *= spec.masterOutputMult;
  return mult;
}
