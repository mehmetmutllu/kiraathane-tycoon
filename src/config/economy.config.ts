/**
 * economy.config.ts — TÜM oyun dengesi sayılarının TEK kaynağı.
 * Kod buradan okur; sayılar koda gömülmez. tools/simulate.ts bu dosyayı simüle eder.
 * Büyük sayılar için break_infinity.js Decimal kullanılır (bkz. src/game/decimal.ts).
 *
 * EKONOMİ v2 (D-010): gelir = throughput zincirinin darboğazı × SABİT fiyat.
 *   - Çay fiyatı sabit taban (basePrice); yükseltme fiyatı DEĞİL HACMİ (çay/dk) büyütür.
 *   - Yükseltmeler/açılışlar sıralı önkoşullarla (`requires`) kilitli.
 *
 * Evrensel yükseltme deseni:
 *   cost_n      = costBase * costGrowth^(n-1)         (n = 1..maxLevel, ₺ ile)
 *   output_mult = outputMult^(level)   → THROUGHPUT çarpanı (çay/dk), FİYAT DEĞİL
 *   maxLevel    = ₺ tavanı. 💎 "Usta" katmanı Faz D'de kendi tasarımıyla gelecek (bugün YOK).
 */

// v31 (Faz B1, D-058): ALAN/SERVİS/MASA/ODA modeline geçiş. Eski kayıtlardaki pad kimliklerinin
// yeni zincirde karşılığı olmadığı için MİGRASYON YAZILMAZ — eski kayıt bulunursa ilerleme
// sıfırlanır, yalnız ayarlar korunur (save.ts resetKeepingSettings). "İlerleme kaybolmaz" kuralı
// v1.0 mağazaya çıktığı andan itibaren bağlayıcıdır.
export const SAVE_VERSION = 31;

/**
 * ALAN (eski "zone") — mekânsal bölge sayısı, alan başına masa slotu ve o slotların MASA TİPİ.
 * Dört kavramın (ALAN · SERVİS · MASA · ODA) türetmesi `src/game/world.ts`'tedir; burada yalnız
 * SAYILAR durur. Yerleşim (koordinatlar) `layout.ts`'te.
 *
 * **B5a: alan başına masa sayısı ARTIK EŞ DEĞİL.** B3-1'de alanların kendisi eş olmaktan çıkmıştı
 * (ön çeyrekler 17 × 17, arka yarı 34 × 9,8); masa sayısı ise hâlâ tek bir `TABLES_PER_AREA = 4`
 * sabitine kelepçeliydi — yani "arka yarı ön çeyrek kadar masa alır" diyordu. Maket v13'ün orta
 * şeridi iki banket adasının altı sütununa (∓11,7 · ∓8,5 · ∓5,3) İKİ YÜZDEN masa asar: 6 × 2 = 12.
 * Kat toplamı 12 → **20 masa** (8 dörtlü + 12 ikili).
 *
 * Masa slotları GLOBAL index'lidir (alan a → `[areaTableStart(a), areaTableStart(a+1))`);
 * açılış sırası gating'le katı olduğundan açık index'ler DAİMA bitişiktir. Prefix toplamı tek
 * yerde tutulur (`AREA_TABLE_START`) — "a * 4" aritmetiği artık bir YALAN olurdu.
 */
export const TABLE_SLOTS_PER_AREA = [4, 4, 12] as const;
export const MAX_AREAS = TABLE_SLOTS_PER_AREA.length;

/**
 * MASA TİPİ — slotun kaç kişilik olduğunu söyleyen TEK kaynak. Tip alanın PLANINDAN gelir:
 * ön çeyrekler dörtlü kümeler, orta şerit banket ikilileri. `layout.ts` bu tipe göre koltuk
 * YERLERİNİ üretir (o "nerede" sorusudur); koltuk SAYISI burada tanımlıdır.
 *   four  — dört yanı tabure, dörtlü masa (a0 · a1)
 *   deuce — banket ikilisi: koltuk 0 adanın bankı, koltuk 1 karşı sandalye (a2)
 */
export const TABLE_KIND_PER_AREA = ['four', 'four', 'deuce'] as const;
export type TableKind = (typeof TABLE_KIND_PER_AREA)[number];

/** Tipin TAM koltuk sayısı (masa L-max'ta bu kadar kişi oturur). */
export const SEATS_OF_KIND: Record<TableKind, number> = { four: 4, deuce: 2 };

/** Alan `a`'nın ilk global masa index'i (a = MAX_AREAS → toplam masa sayısı). */
export const AREA_TABLE_START: readonly number[] = TABLE_SLOTS_PER_AREA.reduce<number[]>(
  (acc, n) => [...acc, acc[acc.length - 1] + n],
  [0],
);

/** Kattaki TOPLAM masa slotu (bugün 20). */
export const MAX_TABLES = AREA_TABLE_START[MAX_AREAS];

/** Alanın ilk global masa index'i. */
export const areaTableStart = (a: number): number => AREA_TABLE_START[Math.min(Math.max(a, 0), MAX_AREAS)];
/** Alanın masa slotu sayısı. */
export const areaTableSlots = (a: number): number => TABLE_SLOTS_PER_AREA[Math.min(Math.max(a, 0), MAX_AREAS - 1)];
/** Global masa index'i → alan. */
export function areaOfTableIndex(index: number): number {
  for (let a = MAX_AREAS - 1; a > 0; a--) if (index >= AREA_TABLE_START[a]) return a;
  return 0;
}
/** Alanın masa tipi. */
export const tableKindOfArea = (a: number): TableKind =>
  TABLE_KIND_PER_AREA[Math.min(Math.max(a, 0), MAX_AREAS - 1)];
/** Global masa index'inin tipi. */
export const tableKindOf = (index: number): TableKind => tableKindOfArea(areaOfTableIndex(index));
/**
 * ÜRÜN HATTI (M3; D-010 alt kararı "fiyat artışı YENİ menü ürünleriyle"). B2'de ürünün KAYNAĞI
 * değişti: eskiden üçüncü BÖLGENİN ürünüydü, artık tek servis noktasının SEVİYESİNDEN gelir
 * (L5 tost açar — `service.tostLevel`). Çay fiyatı sabit kalır; TOST ikinci hat: pahalı + yavaş
 * hazırlanır (throughput matematiği aynı, sabitler farklı).
 *  - dish: müşterinin masada bıraktığı kirlinin görseli (bardak/tabak; havuz ORTAKTIR — korunum
 *    değişmezi tek kalır, yıkama aynı döngü).
 *  - upgradeCostMult: istasyon ₺ yükseltme maliyet çarpanı (çay eğrisi 20/30/45/68 erken oyun için;
 *    tost tezgâhı geç-oyun → aynı eğri ×20 = 400/600/900/1340/3000/6000, sim ile kalibre).
 */
export type ProductId = 'tea' | 'tost';
export const PRODUCTS = {
  // patienceMult (2026-06-12 feedback turu-4): sabır ürünle çarpılır — tost hazırlığı uzun (çay 6sn)
  // ama müşteri aynı 18sn bekliyordu → tost salonunda sabır kaçışları. Yemek bekleyen müşteri daha
  // sabırlıdır: tost ×1.6 (L0 ~29sn > hazırlık+servis turu).
  tea: { price: 5, prepTime: 6, dish: 'cup', upgradeCostMult: 1, patienceMult: 1 },
  // prepTime 14→11 (turu-5 denge, ONAYLI): arz/talep 1:5-8 ölçüldü (denge-raporu-2026-06-13 §2);
  // +%27 arz + tezgâh L5/L6 paketiyle birlikte darboğaz kapanır.
  tost: { price: 25, prepTime: 11, dish: 'plate', upgradeCostMult: 20, patienceMult: 1.6 },
} as const;

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
  /** Verilirse seviye maliyetleri BU listeden okunur (index = level−1) — formülün yerine geçer.
   *  (turu-5 denge: L5/L6 kuyruğu saf eğriden DİK olsun istendi → açık liste tek kaynak.) */
  costsByLevel?: readonly number[];
  /** Her ₺ seviye THROUGHPUT'u (çay/dk) bu kadar çarpar — fiyatı değil. */
  outputMult: number;
  /** ₺ ile çıkılabilen EN YÜKSEK seviye (tavan). 💎 "Usta" katmanı Faz D'de kendi
   *  tasarımıyla gelecek — o gelene kadar bu tavanın üstünde seviye YOK. */
  maxLevel: number;
}

/**
 * Gating / önkoşul (D-010 §3.4). Bir açılış/yükseltme bu koşullar karşılanmadan
 * görünmez/aktif olmaz. OMURGA = `prev` zinciri; diğerleri tempoyu pürüzsüzleştirir.
 */
export interface Requires {
  /** OMURGA: bu pad id'leri tamamlanmadan açılmaz. */
  prev?: readonly string[];
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
  /**
   * Y4 gating (plan §3, kullanıcı onaylı): o ALANIN masaları en az `level` olmadan açılmaz —
   * 2. garson EN YOĞUN an gelsin (16 koltuk döneminde istasyon tavanını ancak 2 garson doldurur).
   * `count` verilirse "o alanın EN AZ `count` masası" (verilmezse: hepsi). B5a'da eklendi: a2 dört
   * slottan **12'ye** çıkınca "hepsi" sessizce başka bir koşula dönüşüyordu; sayı yazılınca kastedilen
   * eşik alanın büyümesinden bağımsız kalır.
   */
  allAreaTablesLevel?: { area: number; level: number; count?: number };
}

/**
 * Görev hedefi (quest sistemi, 2026-06-09). Sayaç hedefleri (count'lu) görev BAŞLADIĞINDAN itibaren
 * delta sayılır; durum hedefleri (pad/level) doğrudan oyun durumundan okunur.
 */
export type QuestTarget =
  | { type: 'pickupTea'; count: number } // ocaktan tepsiye çay al
  // area verilirse YALNIZ o alandaki servisler sayılır (v23: "Yeni salonda 5 çay" gerçekten
  // 2. alanda saysın — eski global sayaç 1. alanın servisini de sayıyordu).
  | { type: 'serveTea'; count: number; area?: number } // oyuncu eliyle masaya ÜRÜN bırak (çay+tost)
  | { type: 'serveTost'; count: number } // oyuncu eliyle masaya TOST bırak (B2: tost L5'ten gelir)
  | { type: 'collectCoin'; count: number } // yerden para topla
  | { type: 'washDish'; count: number } // oyuncu eliyle bulaşıkta kirli yıka
  | { type: 'pad'; id: string } // pad'i tamamla (masa aç / personel tut)
  | { type: 'stationLevel'; level: number } // servis noktası bu seviyeye ulaşsın (B2: tek nokta)
  | { type: 'waiterSpeed'; tier: number } // garson hız kademesi (v29: panel)
  | { type: 'tableLevel'; level: number } // HERHANGİ bir masa bu seviyeye ulaşsın
  // v27 görev çeşitliliği (telefon feedback): alanın (yoksa tümü) en az `count` masası `level`+ olsun.
  | { type: 'tablesAtLevel'; level: number; count: number; area?: number }
  // Y3 garson tepsi yükseltmesi: garson havuzunun tepsi kademesi `tier`'a ulaşsın.
  | { type: 'waiterTray'; tier: number }
  | { type: 'charStat'; stat: CharStat; tier: number } // karakter özelliği bu kademeye ulaşsın (v20)
  | { type: 'lavaboLevel'; level: number }; // ODA: lavabo bu seviyeye ulaşsın (B4)

/**
 * Personel yükseltme kademeleri. Kademe 0 = taban (garson tepsisi 1, leğen 2).
 * B2: **"Tostçu Garson" ayrımı KALKTI** — kat tek servis noktasından döndüğü için garsonun türü
 * diye bir şey yok, tek GLOBAL havuz var (plan §4 "garson havuzu global"). Eski `teaTray/tostTray`
 * ve `teaSpeed/tostSpeed` çiftleri tek `tray`/`speed` hattında birleşti.
 * `dishCarry`/`dishSpeed` bulaşıkçınındır (v28/v29; karakter panelinden alınır).
 */
export interface WaiterUpgrades {
  tray: number;
  speed: number;
  dishCarry: number;
  dishSpeed: number;
}

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
  /** Hedefin ALANI (kamera odağı doğru salona baksın; yoksa 0). */
  area?: number;
  /** Tamamlanınca cüzdana eklenen ₺ ödülü (M1, kullanıcı isteği 2026-06-12). Band: sıradaki
   *  pad maliyetinin ~%10-20'si — tempoyu pürüzsüzleştirir, satın almayı oyuncu yerine yapmaz. */
  reward?: number;
}

export const economyConfig = {
  saveVersion: SAVE_VERSION,
  currency: CURRENCY,

  /**
   * SERVİS NOKTASI — katın TEK üretim yeri (B2; eski ad `teaStation` L4'ten sonra yalandı).
   * **Tek merdiven, iki kimlik** (plan §4): L1-L3 derme çatma çay ocağı · **L4 TEZGÂH** (obje
   * yerini ve görünümünü değiştirir, seviye SIFIRLANMAZ) · **L5 TOST AÇILIR** · L6 son ₺ seviyesi.
   * Fiyat/hazırlama TEK kaynak: PRODUCTS (M3 ürün hattı).
   */
  service: {
    /** Ocak → TEZGÂH dönüşüm seviyesi (mekanik: yalnız görsel/kimlik; throughput eğrisi sürer). */
    counterLevel: 4,
    /** TOST'un açıldığı seviye (B2: ürün bölgeden değil seviyeden gelir). */
    tostLevel: 5,
    /**
     * Gelen müşterinin TOST isteme olasılığı, servis SEVİYESİNE göre (index = seviye).
     * L0-L4 tost yok; L5 açılış payı, L6 "tost arzı genişler". Sipariş nesnesi Faz C'de —
     * bugün müşteri otururken tek ürününü bu orana göre seçer.
     */
    tostShareByLevel: [0, 0, 0, 0, 0, 0.25, 0.35] as readonly number[],
    /** Bir bardak çay demlenme süresi (sn) — sipariş timer'ı. */
    baseBrewTime: PRODUCTS.tea.prepTime,
    /** Servis edilen çay başına SABİT ₺ (yükseltme bunu DEĞİL, throughput'u büyütür). */
    basePrice: PRODUCTS.tea.price,
    upgrade: {
      costBase: 20, // garson öncesi: erken yükseltme ucuz, akış hızlansın (kullanıcı 2026-06-09)
      costGrowth: 1.5,
      /**
       * B2 DENGE (D-060): merdivenin ÜST YARISI kendi ağırlığını taşır.
       * Eskiden L5/L6 "tost tezgâhının" ayrı eğrisiydi ve çay ocağının kendi listesi 150/300'de
       * kalıyordu — tost başka bir SERVİSTEN geldiği için bu sorun değildi. B2'de aynı merdivenin
       * basamakları oldular: 300₺'ye tost açan bir oyun, tostu 20. dakikada verir.
       * Yeni eğri: L1-L3 erken oyun DOKUNULMADI (20/30/45 — plan §5 kaldıraç 2 "erken oyuna
       * dokunulmaz"); L4 TEZGÂH · L5 TOST · L6 son basamak geç-oyunun ana para emicisi.
       * Ölçüm (simulate.ts, Normal profil): tezgâh ~1,7 sa · tost ~2,1 sa · L6 ~3,4 sa.
       */
      costsByLevel: [20, 30, 45, 800, 2400, 9000],
      outputMult: 1.35, // throughput (çay/dk) çarpanı — demleme süresini kısaltır
      maxLevel: 6,
    } satisfies UpgradeSpec,
    /**
     * Yükseltme noktasının önkoşulu: 2. masa açılınca belirir (tür konvansiyonu: önce kapasite,
     * sonra verim). B2: servis TEK olduğu için önkoşul da tek — eski `upgradeRequiresByArea`
     * dizisi (alan başına bir kayıt) anlamını yitirdi.
     */
    upgradeRequires: { prev: ['table2'] } satisfies Requires,
    // Yükseltme dolum hızı: upgradeFillRateFor(cost) — süre 1-6sn kelepçeli (2026-06-12).
  },

  /**
   * Masa yükseltme (Faz 2h — MASA-BAŞI / My Hotel oda yükseltme mantığı; D-016 §5 "alan-başı" kullanıcı
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
      maxLevel: 4, // ₺ tavanı L4 (💎 "Usta" katmanı Faz D)
      /** ALAN-kademeli yükseltme çarpanı (kullanıcı 2026-06-13: "salon 1 sabit, salon 2 biraz,
       *  salon 3 daha da artsın"). 1. alan birebir eski eğri; 2-3 çarpan sonrası 5'e yuvarlanır:
       *  a0 60/108/194/349 · a1 90/160/290/525 · a2 150/270/485/875. */
      areaCostMult: [1, 1.5, 2.5],
    },
    /** ALAN-BAŞINA önkoşul (v21): o alanın masa yükseltmeleri, o alanın masaları açılınca belirir
     *  (D-019 §3 — masa yükseltmeleri geç-oyun derinliği; erken ekran sade).
     *  B5a: a2'nin eşiği bilerek `z3table4`'te BIRAKILDI (12. masada değil). Kural "alan dolunca"
     *  değil "o alan artık boş görünmüyor" — ve asıl sebep tempoyu sabit tutmak: z3table12'ye
     *  bağlamak şeridin masa yükseltmelerini şeridin SONUNA atardı. B5b bu eşiği ölçtü ve
     *  `z3table4`'te BIRAKMAYA karar verdi (D-066): bahşiş kolu servis L6'dan da önce tavanına
     *  ulaşıyor (masa L4 ~43 dk'da), yani eşiği ileri atmak yeni derinlik açmaz, yalnız platoyu
     *  uzatır (`docs/denge-raporu-b5b.md` §2). */
    upgradeRequiresByArea: [
      { prev: ['table4'] },
      { prev: ['z2table4'] },
      { prev: ['z3table4'] },
    ] satisfies readonly Requires[],
    /** Servis başına ek bahşiş = tipBase × masaSeviyesi (L0 = 0 bahşiş, sadece sabit fiyat). */
    tipBase: 2,
    /** Masa seviyesi başına eklenen sabır (sn). */
    patiencePerLevel: 2,
    /**
     * Koltuk sayısı masa SEVİYESİNDEN türetilir (Y2, plan §2 — kayıt şeması değişmez).
     * **B5a: merdiven artık masa TİPİNE ait.** Dörtlü masa L3'te büyüyüp dört kişilik olur;
     * banket ikilisinin dört kişilik hâli YOKTUR (karşısında tek sandalye, sırtında ada var) —
     * o L1'de tam kapasitesine ulaşır ve üst basamakları KONFORU büyütür (bahşiş + sabır),
     * kapasiteyi değil. B3-2'deki `seatsAtTable` kelepçesi bu tabloyu zaten TAKLİT ediyordu
     * (min(seviye, gerçek koltuk)); artık taklit değil tanım — kelepçe savunma olarak kalır.
     * Görsel sandalye sayısı = oturulabilir koltuk (Tables.tsx aynı sayıdan çizer).
     */
    seatsByLevel: {
      four: [1, 2, 2, 4, 4],
      deuce: [1, 2, 2, 2, 2],
    } as Record<TableKind, readonly number[]>,
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
     *  (M3: TEK kaynak PRODUCTS.tea; tost servisinin süresi PRODUCTS.tost.prepTime.) */
    orderTime: PRODUCTS.tea.prepTime,
    /** İçip ödeme yapma süresi. */
    eatTime: 4,
    /**
     * Oturan müşteri çay için bu kadar sn bekler (D-011); süre dolmadan servis
     * edilmezse SESSİZCE kalkıp gider (ödeme yok, ceza yok → çocuk-güvenli).
     */
    patience: 18,
    /** Aynı anda mekândaki maksimum müşteri (taban; gerçek tavan = toplam koltuk + 2, Y2). */
    maxConcurrent: 8,
    /** Grup spawn olasılıkları (Y2, plan §2): 1/2/3/4 kişilik grup — %30/35/20/15 (ort. 2.2).
     *  Hedef masada koltuk yetmezse grup KÜÇÜLÜR (ekonomi korunumu bireysel ödemeyle sürer). */
    groupChances: [0.3, 0.35, 0.2, 0.15],
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
    // turu-5 denge (ONAYLI): KÖPRÜLÜ eğri — T3/T4 ×100 sıçraması "absürt"tü (15k/60k → 5k/18k);
    // T2 150→130 (5B garson-öncesi −%15). Mıknatıs/hız orta kademeler yumuşadı.
    tray: { values: [2, 3, 4, 5, 6], costs: [75, 130, 5_000, 18_000] },
    /** Para mıknatısı yarıçapı (dünya birimi; money.attractRadius'un yerini aldı).
     *  M1 250→200 (kullanıcı 2026-06-11: "azıcık insin" — 4. masa dönemiyle hizalanır). */
    magnet: { values: [2.6, 3.4, 4.2, 5.0], costs: [200, 700, 2_200] },
    /** Hareket hızı (dünya birimi/sn; player.moveSpeed'in yerini aldı). Tavan +%20 bilinçli düşük. */
    speed: { values: [4.5, 4.8, 5.1, 5.4], costs: [400, 1_100, 3_200] },
  },

  /**
   * GARSON HAVUZU (B2: global — D-060). KISMİ assist: oyuncudan YAVAŞ ve KÜÇÜK tepsili → tek başına
   * büyüyen mekânı döndüremez, oyuncu hâlâ gerekli (D-014). Servisten ürün alır, en ACİL bekleyene
   * götürür, döner. Alan-başı garson (D-012) B2'de kalktı: kat tek servisten döndüğü için bir garsonu
   * "şu salonun garsonu" yapan hiçbir şey yok; hepsi aynı havuzdan, hepsi her masaya gider.
   */
  waiter: {
    /** Havuzun tavanı (kullanıcı onayı 2026-09-06): 3 garson + 1 bulaşıkçı. */
    maxWaiters: 3,
    /**
     * HIZ yükseltmesi (v29 — karakter paneline taşındı; eski mekânsal waiterUp pad'i kalktı).
     * speeds[kademe] = hareket hızı (dünya birimi/sn); havuza ORTAK kademe (B2: tür ayrımı yok).
     * Oyuncudan (character.speed taban 4.5) HER kademede yavaş =
     * kısmi assist korunur (D-014). Değerler/₺ eski sistemle aynı (kullanıcı: "garson hızı
     * okey, böyle kalsın"): 1.5→2.0, 250₺.
     * TUR HESABI (C3'te ÖLÇÜLDÜ — eski "L1 tek yön ~5,8 sn, tur ~12 sn < sabır 18 sn" cümlesi
     * kat 21×21 dönemindendi ve bayattı). `docs/kuyruk-raporu-c3.md`, oyuncu yokken ölçülen tam
     * tur: 8 masada 19,7 sn · 12 masada 28,5 sn · 20 masada 30,4 sn. Yani garsonun turu sabrı
     * ÇOKTAN aşıyor — kısmi assist (D-014) tam olarak bu demek: garson tek başına yetişmez.
     */
    speedUpgrades: { speeds: [1.5, 2.0], costs: [250] },
    // Tepsi kapasitesi Y3'te yükseltmeden türetilir: waiterTrayCapacityFor(tier) = 1 + kademe.
    /**
     * Tepsi yükseltme maliyetleri (Y3, plan §3 — onaylı): kademe i+1'in ₺'si. Tepsi = 1 + kademe.
     * B2: tek eğri (eski çay/tostçu ayrı eğrileri birleşti) 1→2→3→4.
     * Karakter panelindeki garson sekmesinden satın alınır (mekânsal değil — character deseni).
     */
    // turu-5 denge (ONAYLI, kullanıcının rakamları): "garson bensiz yetemiyor" — T1 amortismanı
    // 32dk→~16dk; quest sırası AYNI kaldı (v29 migrasyonu gerekmedi).
    trayUpgrades: { costs: [400, 1200, 2500] },
    /**
     * BOŞTA BULAŞIK (D-083, C4): garsonun servis edecek kimsesi kalmayınca (bekleyen yok — ki
     * mekân kilitlenince tam olarak bu olur, çünkü kirli masaya müşteri oturmaz) bulaşık köşesine
     * dönmek yerine masadan KİRLİ toplar ve leğene götürür. Kaç kirli taşıdığı bu sayıdır;
     * 0 = kapalı.
     *
     * NEDEN: bardak KAPALI bir sistemdir (temiz → demleme → müşteri → masada kirli → yıkama →
     * temiz) ve tek kaynağı yıkamadır. Bulaşıkçı zincirde 8. pad'dedir; ondan öncesinde yıkayan
     * TEK kişi oyuncudur, dolayısıyla oyuncu elini çektiğinde mekân ölür (ölçüm:
     * `docs/bardak-raporu-c4.md` — 4 masada 15 dakikada 12 müşteri, dakika 3'ten sonra sıfır,
     * geri dönüşü yok). Havuzu büyütmek çözmez (fazladan bardak temiz durur, masalar yine kirli),
     * servise ORANTILI çare de çözmez (servis durunca çare de durur).
     *
     * NİÇİN GARSON: garson ancak servis edecek kimsesi kalmayınca bu dala düşer, yani kural
     * servisten bir saniye çalmaz — yalnız ölü zamanı değerlendirir. Kısmi assist (D-014)
     * korunur: mekân doldukça garsonun boş vakti biter, kirli birikir, oyuncu yine gerekir.
     *
     * NİÇİN 1: ölçüldü (`docs/olcum-bardak.txt`, AFK · 7 masa) — 1 taşıma **5,53 servis/dk ·
     * terk %38,7**, 2 taşıma 2,87 · %56,1, 4 taşıma 2,47 · %62,2. Sebep: garson kirliyi alınca
     * leğene kadar bağlanıyor; tek bardak = kısa taahhüt = servise hemen dönüş. Büyük leğen
     * BULAŞIKÇININ ayrıcalığı olarak kalıyor (o 2→8 taşır), garson yalnız "geçerken alır".
     */
    idleDishCarry: 1,
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
    /**
     * HIZ yükseltmesi (v29, kullanıcı 2026-06-13: "bulaşıkçı yetişemez diye çekiniyorum, ona hız
     * eklenmeli net bir şekilde"): speeds[kademe] = hareket hızı; karakter panelinin Bulaşıkçı
     * sekmesinden; TÜM salonların bulaşıkçılarına ortak. Taban 2.0 aynı (turu-4); +0.4/kademe
     * (+%20/+%40) — tavan 2.8 hâlâ oyuncudan (4.5+) yavaş = kısmi assist korunur. ₺'ler leğen
     * eğrisinin (600/2000/5000) arasına oturur: kapasite mi hız mı ikilemi anlamlı kalsın.
     */
    speedUpgrades: { speeds: [2.0, 2.4, 2.8], costs: [700, 2200] },
    // Taşıma kapasitesi v28'de yükseltmeden türetilir: dishCarryCapacityFor(tier) = 2 + 2×kademe.
    /**
     * Leğen yükseltme maliyetleri (v28, telefon feedback turu-4: "bulaşıkçı kesinlikle yetmiyor").
     * Y2 grupları tek L4 masada 4 kirli bırakır — taban 2 leğenle bir masa bile tek turda
     * temizlenemiyordu. Kademe i+1'in ₺'si; kapasite 2→4→6→8. Karakter panelinin Bulaşıkçı
     * sekmesinden satın alınır (garson tepsi deseni); TÜM salonların bulaşıkçılarına ortak.
     */
    carryUpgrades: { costs: [600, 2000, 5000] },
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
    /**
     * OTO-TOPLAMA (2026-06-13, kullanıcı: "çok beklediği takdirde otomatik toplanabilir, mesela 3 dk
     * — ama kullanıcı bilsin"): yerde bu süreyi (sn) aşan para kendiliğinden cüzdana girer + HUD
     * toast'u "Bekleyen paralar otomatik toplandı +X" çıkar. Çift amaç: QoL + FPS (m.13: AFK 10dk
     * = 377 coin → FPS 24; 180sn eşiği yerdeki coin sayısını ~115'te tavanlar). Mıknatıs alanındaki
     * coin'lere dokunmaz (zaten oyuncuya akıyor). 0 = kapalı.
     */
    autoCollectAfter: 180,
    /** Oto-toplama toast'ının en sık çıkma aralığı (sn) — sürekli akışta tek tek değil TOPLU bildirir. */
    autoCollectToastEvery: 20,
  },

  /**
   * Satın-alma pad'leri (Roblox-tycoon mantığı; cüzdandan pad'e ₺ akar). SIRALI gating
   * (D-010 §3.4): bir pad `requires` karşılanmadan görünmez/aktif olmaz. Her pad, açtığı
   * objenin TAM yerinde durur (pozisyonlar LAYOUT.padPos). effect:
   *   addTable        → +1 masa (oturma kapasitesi; o masanın yerinde inşa olur)
   *   hireWaiter      → garson tut (kısmi servis yardımı; bkz. `waiter`)
   *   hireDishwasher  → bulaşıkçı tut (kirli bardak döngüsünü kapatır)
   *   unlockArea      → yeni salon aç (o salonun ocağı+ilk masası birlikte gelir)
   * `optional:true` pad'ler OMURGA zincirini KİLİTLEMEZ: alınmasa da sonraki masalar/ocaklar açılır
   * (oyuncu isterse alır, istemezse kendi gezerek servis eder). `currentPad` opsiyonelleri atlar.
   * Maliyetler tempo hedefine göre ayarlı (ilk alım <90sn; simulate.ts doğrular).
   * BAŞLANGIÇ ALANI = 1 servis : 4 masa (D-012). Omurga: 2.Masa → (ocak L≥1) → 3.Masa → Garson →
   * Bulaşıkçı → 4.Masa → 2. Alan. Tek ana ocak 4 masaya throughput'la (ocak seviyesi) yetişir;
   * B1'de her yeni alan KENDİ servisiyle `unlockArea` ile gelir (B2'de servis TEKİLLEŞİR).
   */
  pads: [
    // QUEST HATTI: personel pad'leri sıralı görev hattının zorunlu halkaları (My Perfect Hotel modeli).
    // Görünürlük quest sisteminde (yalnız aktif görevin pad'i çizilir → "ekranda tek pad"); requires
    // zinciri güvenlik ağı olarak kalır.
    // DOLUM HIZLARI: fillRate = cost / hedef-dwell. Bant: öğretici 1.5-3sn · TAVAN 3.5sn.
    //
    // ---- B2 ZİNCİRİ (D-060) — servis tekilleşti, personel GLOBAL havuz ----
    // Kalkanlar: `z2waiter` `z2dishwasher` `z3waiter` `z3dishwasher` `z2waiter2` `z3waiter2`.
    // Alan-başı personel diye bir şey kalmadı: kat tek servis noktasından döner, bir garsonu
    // "2. salonun garsonu" yapan hiçbir şey yok. Havuz = 3 garson + 1 bulaşıkçı (kullanıcı onayı).
    // Bulaşıkçı plan §4'ün 14. adımına taşındı (Bölüm 2) — Bölüm 1 dört adımda biter, otomasyon
    // (garson) 12 dakikadan önce gelir. Zincirin TAMAMI (K2 "alan mekân getirir, masa getirmez"
    // dâhil) Faz C'de yeniden yazılacak; burada yalnız tek servisin gerektirdiği asgari cerrahi var.

    // --- BÖLÜM 1 · 1. Alan (öğretici) ---
    { id: 'table2', label: '2. Masa', cost: 20, fillRate: 13, optional: false, area: 0, // ~1.5sn
      requires: { minLifetime: 20 }, effect: { type: 'addTable' } },
    { id: 'table3', label: '3. Masa', cost: 115, fillRate: 46, optional: false, area: 0, // ~2.5sn
      requires: { prev: ['table2'] }, effect: { type: 'addTable' } },
    { id: 'waiter', label: 'Garson Tut', cost: 130, fillRate: 60, optional: false, area: 0, // ~2.2sn
      requires: { prev: ['table3'] }, effect: { type: 'hireWaiter' } },
    { id: 'table4', label: '4. Masa', cost: 380, fillRate: 109, optional: false, area: 0, // ~3.5sn
      requires: { prev: ['waiter'] }, effect: { type: 'addTable' } },

    // --- BÖLÜM 2 · 2. Alan (10-45 dk) ---
    // Alan açılınca ocak GELMEZ (B2'nin özü): sekiz masa tek ocağa yüklenir → ocak yükseltmesi
    // artık "istersen al" değil, ilerlemenin ta kendisi.
    { id: 'zone2', label: '2. Salon', cost: 750, fillRate: 215, optional: false, area: 0, // ~3.5sn
      requires: { prev: ['table4'] }, effect: { type: 'unlockArea' } },
    { id: 'z2table2', label: '2. Masa', cost: 200, fillRate: 67, optional: false, area: 1, // ~3sn
      requires: { prev: ['zone2'] }, effect: { type: 'addTable' } },
    { id: 'z2table3', label: '3. Masa', cost: 485, fillRate: 139, optional: false, area: 1, // ~3.5sn
      requires: { prev: ['z2table2'] }, effect: { type: 'addTable' } },
    // İkinci darboğaz burada öğretilir: temiz bardak. (Oyuncu bulaşığı ÇOKTAN elle yıkıyor —
    // q_wash Bölüm 1'de; burada işi devralan personel geliyor.)
    { id: 'dishwasher', label: 'Bulaşıkçı Tut', cost: 900, fillRate: 257, optional: false, area: 1, // ~3.5sn
      requires: { prev: ['z2table3'] }, effect: { type: 'hireDishwasher' } },
    { id: 'z2table4', label: '4. Masa', cost: 1400, fillRate: 400, optional: false, area: 1, // ~3.5sn
      requires: { prev: ['dishwasher'] }, effect: { type: 'addTable' } },

    // --- BÖLÜM 3 · 3. Alan + TEZGÂH (45 dk - 2,5 sa) ---
    // Adı artık "Tost Salonu" DEĞİL: tost bir salondan değil tezgâhın L5'inden gelir.
    // FİYAT (B6a): 3400 → **2500**. Ölçüm (`simulate.ts` "EN UZUN BEKLEME"): 3400₺ Normal profilde
    // **26,9 dk** hiçbir şeyin alınamadığı boşluk açıyordu — "20 dk'yı aşan tek alım kalmasın"
    // ölçütünü aşan tek GERÇEK nokta (B4 raporu §7'de kayda geçmişti). Gerekçe fiyat kırmak değil,
    // B5b'nin bulgusunun alan pad'ine de uygulanması: **alan MEKÂN satar, gelir satmaz** — 3. Alan
    // açıldığında oran değişmez (gelir `min(talep, arz, taşıma)` ile kelepçeli, açılan masa arzı
    // büyütmez); oranı büyüten şey hemen arkasından gelen TEZGÂH'tır (L4). 3400 bu pad'i bir gelir
    // çarpanı gibi fiyatlıyordu; 2500 onu sattığı şeye göre fiyatlar. Ölçülen: boşluk 26,9 → 19,8 dk.
    { id: 'zone3', label: '3. Salon', cost: 2500, fillRate: 714, optional: false, area: 0, // ~3.5sn
      requires: { prev: ['z2table4'] }, effect: { type: 'unlockArea' } },
    { id: 'z3table2', label: '2. Masa', cost: 900, fillRate: 257, optional: false, area: 2, // ~3.5sn
      requires: { prev: ['zone3'] }, effect: { type: 'addTable' } },
    { id: 'waiter2', label: '2. Garson', cost: 1600, fillRate: 457, optional: false, area: 0, // ~3.5sn
      requires: { prev: ['z3table2'] }, effect: { type: 'hireWaiter' } },
    { id: 'z3table3', label: '3. Masa', cost: 2200, fillRate: 629, optional: false, area: 2, // ~3.5sn
      requires: { prev: ['waiter2'] }, effect: { type: 'addTable' } },
    { id: 'z3table4', label: '4. Masa', cost: 3200, fillRate: 914, optional: false, area: 2, // ~3.5sn
      requires: { prev: ['z3table3'] }, effect: { type: 'addTable' } },

    // --- BÖLÜM 3b · ORTA ŞERİDİN DOLMASI: banket 5-12 (B5a) ---
    // Maket v13'ün altı banket sütunu iki yüzden masa asar (6 × 2 = 12); B3-2'de adalar TAM BOYDA
    // kuruldu, bu sekiz pad üstlerindeki masaları açar. Adaların boyu DEĞİŞMEZ (D-064) ve açık
    // masalar YER DEĞİŞTİRMEZ — `banketUnit(u)` yalnız yeni birim üretir.
    //
    // MALİYET (B5b · D-066): eğri **×1,15** — 3700'den 9950'ye, toplam 51.100₺.
    // B5a bu sekiz masayı a2'nin kendi son oranıyla (3200/2200 = ×1,4545) fiyatlamıştı; toplam
    // 194.300₺ ediyordu ve o fiyat bir VARSAYIMA dayanıyordu: "masa açmak geliri büyütür".
    // B5b bunu ölçtü, varsayım YANLIŞ (`docs/denge-raporu-b5b.md` §1): gelir
    // `min(talep, arz, taşıma)` ile kelepçeli ve `table3`'ten (≈3. dk) itibaren talep hep en
    // büyük terim — yani AÇILAN HİÇBİR MASA geliri artırmıyor, yalnız oturma/mekân satıyor.
    // Bir masa gelir çarpanı değilse fiyatı da gelir çarpanı gibi olamaz: eğri masanın gerçekte
    // sattığı şeye (alan + atmosfer + yükseltilecek yüzey) göre yassıltıldı.
    // Ölçüldü: şerit dolumu Normal profilde 10,31 sa → **5,28 sa**; Rahat profil ilk kez
    // bitirebiliyor (8,30 sa; eskiden 12 saatte bitmiyordu). ×1,08'e inmenin getirisi 0,5 sa
    // olduğu için gereksiz görüldü. fillRate = maliyet / 3,5 sn (hattın geri kalanıyla aynı).
    // 3. GARSON — B5b'de opsiyonel olmaktan çıkıp OMURGAYA girdi (D-066).
    // Ö5'in ölçümü: tezgâhtan (L4) sonra geliri kelepçeleyen kol arz değil TAŞIMA. 12 masa · L6 ·
    // iki garsonda taşıma 0,66 < arz 0,78 → gelir 13,13 ₺/sn; üçüncü garson taşımayı 0,80'e çıkarıp
    // darboğazı arza geri veriyor → **15,62 ₺/sn (+%19)**, 6000₺ ~40 dk'da amorti. Yani hattın o
    // andaki EN İYİ alımı, ve şeridin sekiz masasının hemen ÖNÜNDE durması gerekiyor: kuyruk sabit
    // hızda beklenmesin diye.
    //
    // Eski hâli `optional: true` + `allAreaTablesLevel` idi ve iki sorun doğuruyordu:
    // (1) görev hattı ona hiç işaret etmiyordu → güdülen oyuncu L6 dönemini %19 eksik gelirle
    //     geçiyordu (sim de öyle yapıyordu — ölçüm bunu gösterdi);
    // (2) `allAreaTablesLevel` bir VEKİLDİ ("şerit kalabalıklaştı" demenin dolaylı yolu) ve masa
    //     yükseltmeleri serbest sırayla alındığı için görev hattının sırasıyla hizalanamıyordu —
    //     zincirin iki ucu (görev sırası ↔ pad gate'i) birbirine karışıyordu. Artık gate ölçümün
    //     söylediği gerçek koşul: **tezgâh son seviyede** (`minStationLevel` = servis ₺-max), ve
    //     onun hemen önündeki görev zaten `q_stationMax`. İki sıra artık AYNI şeyi söylüyor.
    { id: 'waiter3', label: '3. Garson', cost: 6000, fillRate: 1714, optional: false, area: 0, // ~3.5sn
      requires: { prev: ['z3table4'], minStationLevel: 6 }, effect: { type: 'hireWaiter' } },

    // ODA (B4): şeridin masaları ancak lavabodan SONRA başlar. Sıra tesadüf değil — D-066'nın
    // ölçümü platonun tam burada (servis L6 + masa L4 tavanda) başladığını söylüyor; şeridin sekiz
    // masası bugün o donmuş bandın içinde duruyor. Lavabo geliri büyüten TEK kol olduğu için önce
    // o kurulur, seviyeleri sonra şeridin masalarıyla DÖNÜŞÜMLÜ alınır (görev hattı sırası).
    { id: 'lavabo', label: 'Lavabo', cost: 3000, fillRate: 857, optional: false, area: 2, // ~3.5sn
      requires: { prev: ['waiter3'] }, effect: { type: 'openRoom', room: 'lavabo' } },

    { id: 'z3table5', label: '5. Masa', cost: 3700, fillRate: 1057, optional: false, area: 2,
      requires: { prev: ['lavabo'] }, effect: { type: 'addTable' } },
    { id: 'z3table6', label: '6. Masa', cost: 4250, fillRate: 1214, optional: false, area: 2,
      requires: { prev: ['z3table5'] }, effect: { type: 'addTable' } },
    { id: 'z3table7', label: '7. Masa', cost: 4900, fillRate: 1400, optional: false, area: 2,
      requires: { prev: ['z3table6'] }, effect: { type: 'addTable' } },
    { id: 'z3table8', label: '8. Masa', cost: 5650, fillRate: 1614, optional: false, area: 2,
      requires: { prev: ['z3table7'] }, effect: { type: 'addTable' } },
    { id: 'z3table9', label: '9. Masa', cost: 6500, fillRate: 1857, optional: false, area: 2,
      requires: { prev: ['z3table8'] }, effect: { type: 'addTable' } },
    { id: 'z3table10', label: '10. Masa', cost: 7500, fillRate: 2143, optional: false, area: 2,
      requires: { prev: ['z3table9'] }, effect: { type: 'addTable' } },
    { id: 'z3table11', label: '11. Masa', cost: 8650, fillRate: 2471, optional: false, area: 2,
      requires: { prev: ['z3table10'] }, effect: { type: 'addTable' } },
    { id: 'z3table12', label: '12. Masa', cost: 9950, fillRate: 2843, optional: false, area: 2,
      requires: { prev: ['z3table11'] }, effect: { type: 'addTable' } },

  ],

  /**
   * GÖREV HATTI (2026-06-09, Fable brief §1+§4): ilerleme sıralı TEK görevle yönlendirilir.
   * Üst-orta görev barı aktif görevi gösterir; dokununca kamera hedefe kayar. Sayaç hedefleri
   * (count) görev BAŞLADIĞINDAN itibaren DELTA sayılır (kümülatif değil — questBase store'da).
   * Pad görevleri sırasında YALNIZ o pad'in işareti çizilir ("ekranda tek pad").
   * Görev hattı bitince serbest oyun: kalan yükseltme noktaları zaten kalıcı-sade görünür.
   */
  quests: [
    // B2 (D-060): hat yeni zincire göre yeniden dizildi. Kalkanlar alan-başı personel görevleriydi
    // (`q_z2waiter` `q_z2dish` `q_z3waiter` `q_z3dish` `q_z3station` `q_tostTray1`); yerlerine tek
    // servisin KENDİ merdiveni geldi — ocak L1/L2/L3, **TEZGÂH (L4)** ve **TOST (L5)** artık birer
    // görev. Kayıt v31 temiz sıfırlama olduğu için id/sıra eşleme listesi gerekmedi.
    // Karakter görevlerinin yeri korundu (docs/character-upgrades-design.md §5).
    { id: 'q_pickup', title: 'Ocaktan çay al', target: { type: 'pickupTea', count: 1 }, reward: 3 },
    { id: 'q_serve1', title: 'Çayı müşteriye götür', target: { type: 'serveTea', count: 1 }, reward: 3 },
    { id: 'q_coin', title: 'Yere düşen parayı topla', target: { type: 'collectCoin', count: 1 }, reward: 5 },
    { id: 'q_table2', title: '2. Masayı aç', target: { type: 'pad', id: 'table2' }, reward: 10 },
    { id: 'q_charTray1', title: 'Tepsini büyüt', target: { type: 'charStat', stat: 'tray', tier: 1 }, reward: 15 },
    { id: 'q_serve5', title: '5 çay servis et', target: { type: 'serveTea', count: 5 }, reward: 15 },
    { id: 'q_station1', title: 'Çay ocağını yükselt', target: { type: 'stationLevel', level: 1 }, reward: 10 },
    // Bulaşık MEKANİĞİ burada öğrenilir (kirli bardak bu görevden itibaren çıkar — WASH_QUEST_INDEX).
    // Personeli devralması ÇOK sonra (Bölüm 2): önce elle yıkarsın, sonra otomasyonu alırsın.
    { id: 'q_wash', title: '3 kirli bardak yıka', target: { type: 'washDish', count: 3 }, reward: 15 },
    { id: 'q_table3', title: '3. Masayı aç', target: { type: 'pad', id: 'table3' }, reward: 25 },
    { id: 'q_charTray2', title: "Tepsini 4'e çıkar", target: { type: 'charStat', stat: 'tray', tier: 2 }, reward: 30 },
    { id: 'q_waiter', title: 'Garson tut', target: { type: 'pad', id: 'waiter' }, reward: 30 },
    { id: 'q_station2', title: "Ocağı Seviye 2'ye çıkar", target: { type: 'stationLevel', level: 2 }, reward: 40 },
    { id: 'q_table4', title: '4. Masayı aç', target: { type: 'pad', id: 'table4' }, reward: 60 },
    { id: 'q_charMagnet', title: 'Para mıknatısını güçlendir', target: { type: 'charStat', stat: 'magnet', tier: 1 }, reward: 50 },
    // --- BÖLÜM 2 · 2. Alan: alan ocak GETİRMEZ → sekiz masa tek ocağa yüklenir.
    { id: 'q_zone2', title: '2. Salonu aç', target: { type: 'pad', id: 'zone2' }, reward: 150 },
    { id: 'q_z2table2', title: 'Salon 2: 2. Masayı aç', target: { type: 'pad', id: 'z2table2' }, area: 1, reward: 50 },
    { id: 'q_station3', title: "Ocağı Seviye 3'e çıkar", target: { type: 'stationLevel', level: 3 }, reward: 80 },
    { id: 'q_waiterL2', title: 'Garsonu hızlandır', target: { type: 'waiterSpeed', tier: 1 }, reward: 50 },
    { id: 'q_tableL2', title: 'Bir masayı yükselt', target: { type: 'tableLevel', level: 1 }, reward: 30 },
    { id: 'q_z2table3', title: 'Salon 2: 3. Masayı aç', target: { type: 'pad', id: 'z2table3' }, area: 1, reward: 100 },
    { id: 'q_waiterTray1', title: 'Garsonun tepsisini büyüt', target: { type: 'waiterTray', tier: 1 }, reward: 80 },
    { id: 'q_dish', title: 'Bulaşıkçı tut', target: { type: 'pad', id: 'dishwasher' }, area: 1, reward: 120 },
    { id: 'q_z2table4', title: 'Salon 2: 4. Masayı aç', target: { type: 'pad', id: 'z2table4' }, area: 1, reward: 200 },
    { id: 'q_tableL2x2', title: "2 masayı Seviye 2'ye çıkar", target: { type: 'tablesAtLevel', level: 2, count: 2 }, reward: 120 },
    // --- BÖLÜM 3 · 3. Alan + TEZGÂH: mekânın kimliği değişir (derme çatma ocak gider, tezgâh gelir).
    { id: 'q_zone3', title: '3. Salonu aç', target: { type: 'pad', id: 'zone3' }, area: 2, reward: 400 },
    { id: 'q_z3table2', title: 'Salon 3: 2. Masayı aç', target: { type: 'pad', id: 'z3table2' }, area: 2, reward: 100 },
    { id: 'q_counter', title: 'Tezgâhı kur', target: { type: 'stationLevel', level: 4 }, reward: 300 },
    { id: 'q_waiter2', title: '2. Garsonu tut', target: { type: 'pad', id: 'waiter2' }, reward: 250 },
    { id: 'q_z3table3', title: 'Salon 3: 3. Masayı aç', target: { type: 'pad', id: 'z3table3' }, area: 2, reward: 200 },
    // TOST: bir salondan değil, tezgâhın L5'inden gelir.
    { id: 'q_tost', title: 'Tost sacını kur', target: { type: 'stationLevel', level: 5 }, reward: 500 },
    { id: 'q_tost5', title: '5 tost servis et', target: { type: 'serveTost', count: 5 }, reward: 300 },
    { id: 'q_z3table4', title: 'Salon 3: 4. Masayı aç', target: { type: 'pad', id: 'z3table4' }, area: 2, reward: 350 },
    { id: 'q_waiterTray2', title: "Garsonun tepsisini 3'e çıkar", target: { type: 'waiterTray', tier: 2 }, reward: 300 },
    { id: 'q_z1allL4', title: 'Salonun 4 masasını Seviye 4 yap', target: { type: 'tablesAtLevel', level: 4, count: 4, area: 0 }, reward: 400 },
    // --- BÖLÜM 3b · ŞERİDİ DOLDUR (B5a): banketlerin kalan sekiz birimi ---
    // ÖNCE TEZGÂHIN SON BASAMAĞI. Bu görev B5a'da eklendi ve sırası tesadüf değil: şeridin masaları
    // ARZ tavana dayalıyken hiçbir şey hızlandırmaz (B2'nin dersi — kat tek noktadan beslenir), o
    // yüzden L6 masalardan ÖNCE gelir. Hat bittiğinde simülatör zaten bu sırayı seçiyordu (serbest
    // oyun "darboğaz varsa önce servis" der); görev hattı onu görünür kılıyor, değiştirmiyor.
    { id: 'q_stationMax', title: 'Tezgâhı son seviyeye çıkar', target: { type: 'stationLevel', level: 6 }, reward: 800 },
    // ARZ tavana dayandığı anda darboğaz TAŞIMAYA geçer (Ö5 ölçümü) — bu görev tam o anda gelir.
    { id: 'q_waiter3', title: '3. Garsonu tut', target: { type: 'pad', id: 'waiter3' }, area: 0, reward: 600 },
    // Hattın SONUNA eklendiler, araya değil: önlerindeki her görev B5a öncesiyle birebir aynı sırada
    // kalsın (ölçülen altı tempo bandı bu sıraya bağlı). Her zorunlu pad'in bir görevi olması
    // değişmez kural — pad'i görevsiz bırakmak HUD'da "görev bitti ama ekranda pad var" hâli olurdu.
    // ODA + ŞERİT DÖNÜŞÜMLÜ (B4): bir masa → bir lavabo seviyesi → bir masa ... Ölçüm bu sırayı
    // seçti: lavabo seviyeleri şeridin masalarının ARASINA girmezse gelir yine donuyor ve şeridin
    // kuyruğu sabit hızda akıyor (plato 1,42 sa). Dönüşümlü alınınca en uzun düz aralık ~13 dk.
    { id: 'q_lavabo', title: 'Lavaboyu aç', target: { type: 'pad', id: 'lavabo' }, area: 2, reward: 400 },
    { id: 'q_z3table5', title: 'Şerit: 5. Masayı aç', target: { type: 'pad', id: 'z3table5' }, area: 2, reward: 450 },
    { id: 'q_lavabo2', title: 'Lavaboyu büyüt (L2)', target: { type: 'lavaboLevel', level: 2 }, area: 2, reward: 450 },
    { id: 'q_z3table6', title: 'Şerit: 6. Masayı aç', target: { type: 'pad', id: 'z3table6' }, area: 2, reward: 550 },
    { id: 'q_lavabo3', title: 'Lavaboyu büyüt (L3)', target: { type: 'lavaboLevel', level: 3 }, area: 2, reward: 550 },
    { id: 'q_z3table7', title: 'Şerit: 7. Masayı aç', target: { type: 'pad', id: 'z3table7' }, area: 2, reward: 700 },
    { id: 'q_lavabo4', title: 'Lavaboyu büyüt (L4)', target: { type: 'lavaboLevel', level: 4 }, area: 2, reward: 700 },
    { id: 'q_z3table8', title: 'Şerit: 8. Masayı aç', target: { type: 'pad', id: 'z3table8' }, area: 2, reward: 850 },
    { id: 'q_lavabo5', title: 'Lavaboyu büyüt (L5)', target: { type: 'lavaboLevel', level: 5 }, area: 2, reward: 850 },
    { id: 'q_z3table9', title: 'Şerit: 9. Masayı aç', target: { type: 'pad', id: 'z3table9' }, area: 2, reward: 1050 },
    { id: 'q_lavabo6', title: 'Lavaboyu büyüt (L6)', target: { type: 'lavaboLevel', level: 6 }, area: 2, reward: 1050 },
    { id: 'q_z3table10', title: 'Şerit: 10. Masayı aç', target: { type: 'pad', id: 'z3table10' }, area: 2, reward: 1300 },
    { id: 'q_z3table11', title: 'Şerit: 11. Masayı aç', target: { type: 'pad', id: 'z3table11' }, area: 2, reward: 1600 },
    { id: 'q_z3table12', title: 'Şerit: 12. Masayı aç', target: { type: 'pad', id: 'z3table12' }, area: 2, reward: 2000 },
  ] as readonly QuestDef[],

  // Oyuncu hareket hızı v20'de character.speed kademesinden türetilir (playerSpeed()).

  /**
   * LEVEL/XP sistemi (2026-06-10, kullanıcı onayı): oyuncu seviyesi — ileride kat açma (Faz 3b)
   * ve kozmetik mağaza (tema/zemin/duvar) seviye kapısı olacak. XP kaynakları eylem-temelli
   * (para-temelli değil → ekonomi dengesinden bağımsız, gelir enflasyonundan etkilenmez).
   * Eğri: needFor(L→L+1) = levelBase × levelGrowth^(L-1). 1. alanın sonu ≈ L5-6.
   */
  /**
   * ODALAR (B4 — D-066'nın plato kolu). Oda oturma EKLEMEZ; kendi gelir kolunu getirir.
   *
   * **LAVABO — neden ayrı bir gelir KALEMİ, çarpan değil (kullanıcı kararı 2026-09-07):**
   * müşteri masasında ödeyip kalkar, çıkmadan önce lavaboya uğrar, çıkışta lavabonun ÖNÜNDEKİ
   * noktaya para bırakır (Model B′ istifi — masalarınkiyle aynı `Coin`, yalnız düşme noktası
   * farklı; para SUNUMU değişmez). Oyuncu üstünden geçince toplar.
   *
   * **Neden gelirin bu kolu var (ölçüm, B4 raporu):** Kat 1'de throughput kolu TÜKENDİ — arz
   * servis L6'da 0,78 fincan/sn'de tavan yapıyor, taşıma tavanı tam kadroda 1,25. Çay/dk'da kalan
   * tüm baş boşluğu ×1,6 ve sonra ölü (garson tavanı 3, karakter kademeleri bitiyor). Yeni
   * throughput ancak KAT 2 ile gelir. Bu yüzden Kat 1'in son büyüme kolu MÜŞTERİ BAŞINA ₺'dir.
   *
   * **Sayılar (onaylı ivme ×1,38/seviye — B4 ölçümü):** müşteri başına lavabo geliri seviyede
   * ×~1,55 büyür; iki okunur sinyalle taşınır (D: çoklu redundant sinyal):
   *   - `visitChanceByLevel` %30 → %55: lavabo iyileştikçe GÖZLE daha çok müşteri uğrar,
   *   - `feeByLevel` 18 → 86 ₺: bırakılan para büyür (istif daha hızlı kabarır).
   * Çarpımları (5,4 → 47,3 ₺/müşteri) ölçülen hedef eğriyi birebir verir: plato 1,42 sa → ~13 dk,
   * zincir süresi DEĞİŞMEZ (5,35 → 5,27 sa). Fiyat/bahşiş kolları tamamen SABİT kalır → D-010
   * ("çay fiyatı sabit") delinmez.
   */
  rooms: {
    lavabo: {
      /** Oda kaç seviyeye çıkar (pad açılışı = L1; kalan basamaklar yükseltme noktasından). */
      maxLevel: 6,
      /** L1 pad'le gelir; L2..L6 bu maliyetlerle alınır (index = hedef seviye - 2). */
      upgradeCosts: [4_000, 5_000, 7_000, 9_000, 11_500],
      /** Müşterinin çıkarken lavaboya uğrama olasılığı (index = seviye - 1). */
      visitChanceByLevel: [0.30, 0.35, 0.40, 0.45, 0.50, 0.55],
      /** Uğrayan müşterinin lavabonun önüne bıraktığı ₺ (index = seviye - 1). */
      feeByLevel: [18, 24, 32, 44, 60, 86],
      /** Müşteri lavaboda kaç saniye kalır (girer-çıkar). */
      visitTime: 2.5,
    },
  },

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
   * nefes alsın; alanı tek seferde bitirmesin"). İki kol birlikte kısar:
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
     * karşılanır; alan unlock sıradaysa açılır ama alanın İÇİ bitmez ("alanı tek girişte bitirmesin"
     * ilkesi yumuşatılmış sürer).
     */
    // 1.2→1.15 (2026-06-13): masa açma −%10 sonrası z2table2 200₺ oldu — 1.2'de tavan (1320)
    // "zone2 + ilk iç pad" (1300) sınırını aşıyordu; "alan açılır ama içi bitmez" değişmezi korunur.
    capNextPadFrac: 1.15,
    /** Elmas ile uzatma başına eklenen saat (Faz 4). */
    diamondExtendHours: 8,
  },

  /**
   * KOZMETİK MAĞAZA (WP6, 2026-06-11; feedback §D19): zemin + duvar temaları ZONE-BAŞINA ₺ ile
   * satın alınır — PAHALI (geç oyun para biriktirme hedefi; "tek alan için 10k+"). Satın alınan
   * tema o ALAN için kalıcı sahipliktir (ownedCosmetics); tekrar seçmek ücretsiz. Görsel karşılıklar
   * palette.ts FLOOR_THEMES/WALL_THEMES'te (alan zemini temanın DÜZ base rengiyle boyanır).
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
    // MASA teması (2026-06-15): mobilya minderi + örtüsü seçilen renge boyanır (recolor atlas swap;
    // GLOBAL — tüm salonlar; tek-atlas instancing 8 draw-call'da kalır). 'mavi' = native (ücretsiz).
    // Altın en pahalı premium (kullanıcı: "altın tema burada PAHALI satılır"). Sadece kozmetik.
    tableThemes: [
      { id: 'mavi', label: 'Klasik Mavi', cost: 0, color: '#5a93cf' },
      { id: 'bordo', label: 'Bordo Kadife', cost: 12_000, color: '#7c2230' },
      { id: 'zumrut', label: 'Zümrüt Yeşili', cost: 16_000, color: '#1f6f50' },
      { id: 'altin', label: 'Altın Varak', cost: 30_000, color: '#d4af37' },
    ],
  },

} as const;

/**
 * Mekânsal YÜKSELTME dolum hızı (₺/sn) — 2026-06-12 telefon feedback (onaylı): sabit 60₺/sn
 * geç oyunda aşırı bekletiyordu (tost ocağı L4 1350₺ = 22.5sn). Hedef süre = clamp(cost/60, 1, 3.5) sn
 * → erken yükseltmeler 1sn'nin altına düşmez, geç yükseltmeler 3.5sn'yi aşmaz (turu-4 ikinci ayar:
 * kullanıcı tavanı 5'ten 3-3.5sn'ye indirdi).
 */
export function upgradeFillRateFor(cost: number): number {
  const t = Math.min(3.5, Math.max(1, cost / 60));
  return cost / t;
}

/** Masa temasının rengi (minder+örtü); bilinmeyen id → native mavi. */
export function tableThemeColor(id: string): string {
  return economyConfig.cosmetics.tableThemes.find((t) => t.id === id)?.color ?? '#5a93cf';
}

export type EconomyConfig = typeof economyConfig;
export type PadDef = EconomyConfig['pads'][number];
export type PadEffect = PadDef['effect'];

/**
 * Pad listesinden TÜRETİLEN dünya (D-015) `src/game/world.ts`'e taşındı (Faz B1): `deriveWorld()`
 * artık tek bir `zone` sayacı değil, ALAN · SERVİS · MASA · ODA listelerini üretir.
 */

/** Gating değerlendirmesi için gereken (salt-okunur) ilerleme durumu. */
export interface GateState {
  padsDone: string[];
  tables: number;
  stationLevel: number;
  lifetime: number;
  /** Garsonun bugüne dek taşıdığı çay (arka-plan şartları için; eski çağıranlar vermeyebilir → 0). */
  waiterServed?: number;
  /** SERVİS-BAŞINA garson taşıma sayacı (v21 — her servis kendi garsonunun işini saysın). */
  waiterServedByService?: number[];
  /** Masa-başı seviyeler (Y4 allAreaTablesLevel gate'i için; eski çağıranlar vermeyebilir → gate kapalı). */
  tableLevels?: number[];
}

/** Bir `requires` koşulu mevcut ilerleme durumunca karşılanıyor mu? */
export function requiresMet(req: Requires | undefined, g: GateState): boolean {
  if (!req) return true;
  if (req.prev && !req.prev.every((id) => g.padsDone.includes(id))) return false;
  if (req.minStationLevel != null && g.stationLevel < req.minStationLevel) return false;
  if (req.minLifetime != null && g.lifetime < req.minLifetime) return false;
  if (req.minWaiterServed != null && (g.waiterServed ?? 0) < req.minWaiterServed) return false;
  if (req.allAreaTablesLevel) {
    const { area, level, count } = req.allAreaTablesLevel;
    const lv = g.tableLevels ?? [];
    let n = 0;
    for (let i = areaTableStart(area); i < areaTableStart(area + 1); i++) {
      if ((lv[i] ?? 0) >= level) n++;
    }
    if (n < (count ?? areaTableSlots(area))) return false;
  }
  return true;
}

/** n. ₺ yükseltme seviyesinin maliyeti (level 1..maxLevel). */
export function upgradeCost(spec: UpgradeSpec, level: number): number {
  const explicit = spec.costsByLevel?.[level - 1];
  if (explicit != null) return explicit;
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

/** Mevcut masa seviyesinden bir sonraki yükseltmenin maliyeti (₺). Faz 2h.
 *  ALAN-kademeli (2026-06-13): 1. alan eski eğriyle BİREBİR; 2-3 çarpanlı + 5'e yuvarlı. */
export function tableUpgradeCost(level: number, area = 0): number {
  const u = economyConfig.tables.upgrade;
  const base = u.costBase * Math.pow(u.costGrowth, level);
  const mult = u.areaCostMult[Math.min(area, u.areaCostMult.length - 1)];
  if (mult === 1) return Math.floor(base);
  return Math.round((base * mult) / 5) * 5;
}

/* ─────────────────────────── ODA: LAVABO (B4) ───────────────────────────
 * Üç sayı da SEVİYEDEN okunur (index = seviye − 1; L0 = oda kapalı, kol yok). Kol gelire
 * müşteri BAŞINA girer: uğrama olasılığı × bırakılan ₺. Throughput'tan bağımsızdır ama onunla
 * ölçeklenir (servis hızlandıkça daha çok müşteri çıkar → istif daha hızlı kabarır). */

/** Lavabonun ₺ ile çıkılabilen en yüksek seviyesi. */
export const lavaboMaxLevel = (): number => economyConfig.rooms.lavabo.maxLevel;

/** Mevcut seviyeden bir sonrakinin maliyeti (₺). L0 (kapalı) ve tavanda `null`. */
export function lavaboUpgradeCost(level: number): number | null {
  const r = economyConfig.rooms.lavabo;
  if (level < 1 || level >= r.maxLevel) return null;
  return r.upgradeCosts[level - 1] ?? null;
}

/** Çıkan müşterinin lavaboya uğrama olasılığı (0 = oda kapalı). */
export function lavaboVisitChance(level: number): number {
  const r = economyConfig.rooms.lavabo;
  if (level < 1) return 0;
  return r.visitChanceByLevel[Math.min(level, r.maxLevel) - 1];
}

/** Uğrayan müşterinin lavabonun önüne bıraktığı ₺ (0 = oda kapalı). */
export function lavaboFee(level: number): number {
  const r = economyConfig.rooms.lavabo;
  if (level < 1) return 0;
  return r.feeByLevel[Math.min(level, r.maxLevel) - 1];
}

/** Servis edilen MÜŞTERİ başına lavabo geliri (₺) — gelir modelinin okuduğu tek sayı. */
export const lavaboIncomePerCustomer = (level: number): number =>
  lavaboVisitChance(level) * lavaboFee(level);

/** Servis başına ek bahşiş (₺) — masa seviyesiyle artar (çay fiyatı sabit kalır). Faz 2h. */
export function tableTip(level: number): number {
  return economyConfig.tables.tipBase * level;
}

/** Müşteri sabrı (sn) — masa seviyesiyle artar (taban + perLevel × seviye), ürünle çarpılır
 *  (tost yavaş hazırlanır → müşterisi daha sabırlı; PRODUCTS.patienceMult). Faz 2h + turu-4. */
export function tablePatience(level: number, product: ProductId = 'tea'): number {
  return (
    (economyConfig.npc.patience + economyConfig.tables.patiencePerLevel * level) *
    PRODUCTS[product].patienceMult
  );
}

/** Masanın koltuk sayısı — TİP + seviyeden TÜRETİLİR (Y2; aşırı seviyede son değere kelepçelenir). */
export function tableSeats(level: number, kind: TableKind = 'four'): number {
  const arr = economyConfig.tables.seatsByLevel[kind];
  return arr[Math.min(Math.max(level, 0), arr.length - 1)];
}

/** Grup boyu (1..4) — [0,1) zarından (Y2; saf fonksiyon → deterministik test edilir). */
export function rollGroupSize(roll: number): number {
  let acc = 0;
  const ch = economyConfig.npc.groupChances;
  for (let i = 0; i < ch.length; i++) {
    acc += ch[i];
    if (roll < acc) return i + 1;
  }
  return ch.length;
}

// ---- Personel HIZ yükseltmeleri (v29 — karakter paneli) — kademe → değer türeticileri ----

/** Garson havuzunun max hız kademesi (= satın alınabilir yükseltme sayısı). */
export function waiterSpeedMaxTier(): number {
  return economyConfig.waiter.speedUpgrades.costs.length;
}

/** Sıradaki hız kademesinin ₺ maliyeti (kademe tavandaysa null). */
export function waiterSpeedNextCost(tier: number): number | null {
  const costs = economyConfig.waiter.speedUpgrades.costs;
  return tier < costs.length ? costs[tier] : null;
}

/** Garson hareket hızı (kademe; aşırı kademede son değere kelepçelenir). */
export function waiterSpeedFor(tier: number): number {
  const arr = economyConfig.waiter.speedUpgrades.speeds;
  return arr[Math.min(Math.max(tier, 0), arr.length - 1)];
}

/** Bulaşıkçının max hız kademesi. */
export function dishSpeedMaxTier(): number {
  return economyConfig.dishwasher.speedUpgrades.costs.length;
}

/** Sıradaki bulaşıkçı hız kademesinin ₺ maliyeti (tavandaysa null). */
export function dishSpeedNextCost(tier: number): number | null {
  const costs = economyConfig.dishwasher.speedUpgrades.costs;
  return tier < costs.length ? costs[tier] : null;
}

/** Bulaşıkçı hareket hızı (kademe; tüm salonlara ortak). */
export function dishSpeedFor(tier: number): number {
  const arr = economyConfig.dishwasher.speedUpgrades.speeds;
  return arr[Math.min(Math.max(tier, 0), arr.length - 1)];
}

// ---- Garson tepsi yükseltmeleri (Y3) — kademe → değer türeticileri ----

/** Garson havuzunun max tepsi kademesi (= satın alınabilir yükseltme sayısı). */
export function waiterTrayMaxTier(): number {
  return economyConfig.waiter.trayUpgrades.costs.length;
}

/** Sıradaki tepsi kademesinin ₺ maliyeti (kademe tavandaysa null). */
export function waiterTrayNextCost(tier: number): number | null {
  const costs = economyConfig.waiter.trayUpgrades.costs;
  return tier < costs.length ? costs[tier] : null;
}

/** Garson tepsi kapasitesi = taban 1 + satın alınmış kademe (Y3). */
export function waiterTrayCapacityFor(tier: number): number {
  return 1 + Math.min(Math.max(tier, 0), waiterTrayMaxTier());
}

// ---- Bulaşıkçı leğen yükseltmeleri (v28) — kademe → değer türeticileri ----

/** Bulaşıkçı leğeninin max kademesi (= satın alınabilir yükseltme sayısı). */
export function dishCarryMaxTier(): number {
  return economyConfig.dishwasher.carryUpgrades.costs.length;
}

/** Sıradaki leğen kademesinin ₺ maliyeti (kademe tavandaysa null). */
export function dishCarryNextCost(tier: number): number | null {
  const costs = economyConfig.dishwasher.carryUpgrades.costs;
  return tier < costs.length ? costs[tier] : null;
}

/** Bulaşıkçı taşıma kapasitesi = taban 2 + 2×kademe (2→4→6→8; tüm salonlara ortak). */
export function dishCarryCapacityFor(tier: number): number {
  return 2 + 2 * Math.min(Math.max(tier, 0), dishCarryMaxTier());
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

/** Verilen seviyedeki toplam çıktı çarpanı (₺ tavanının üstü kırpılır). */
export function upgradeOutputMultiplier(spec: UpgradeSpec, level: number): number {
  return Math.pow(spec.outputMult, Math.min(level, spec.maxLevel));
}
