/**
 * wcLook.ts — WC LAVABOSUNUN ÖLÇÜ VE ANKRAJ KATMANI (S6).
 *
 * NEDEN: `maketParts.tsx` bir R3F dosyası (vitest'te import edilemez) → sayı buraya çıkıyor.
 *
 * ---------------------------------------------------------------------------------------------
 * MODEL SEÇİMİ İKİ TURDA OTURDU — ikisi de KULLANICI EKRANDA GÖRDÜKTEN sonra:
 *
 * **Tur 1 (S6/G1):** *"pakette gri renkli hali var, onu kullan."* Atlas gözü ölçüldü;
 * `kitchentable_sink` TEK gözde çıktı (#828c91, doygunluk 0,11) → seçildi. Ekranda **ayaklı**
 * bir çelik tezgâh olarak göründü.
 * **Tur 2 (S6/②):** *"dolaplı ama gri olan var; mutfaktaki turuncular var ya, onların gri
 * halleri olsun."* İstenen şey ayaklı değil **DOLAPLI** gövdeymiş. Ölçüm o modeli buldu:
 * `kitchencounter_sink` — **%70'i zaten gri** [0,3]; turuncu olan yalnız **%16**'lık [3,6]
 * gözü, ki o göz mutfağın tezgâhlarını da turuncu yapan göz (`kitchencounter_straight_A`'nın %52'si).
 *
 * **"Gri hali" ayrı bir MODEL değil, ayrı bir GÖZ.** 238 model tarandı, `*_grey` varyantı yok.
 * KayKit'in dokusu bir renk şeridi olduğu için gri hâli üretmek atlası boyamayı değil UV'yi
 * taşımayı gerektiriyor (`atlasUV.gozDegistir`): [3,6] turuncu → [0,3] gri. Bu YALNIZ bu modelin
 * geometrisine dokunur — mutfaktaki tezgâhlar turuncu kalır. (`recolor.ts` hattı seçilseydi
 * aynı gözü paylaştıkları için onlar da grileşirdi; D-100'ün "aynı göz ortaktır" dersi.)
 * ---------------------------------------------------------------------------------------------
 */
import type { Goz } from './atlasUV';

/** `node tools/model-olc.mjs kaykit-restaurant-bits kitchencounter_sink` — BİREBİR. */
export const LAVABO_NATIVE = {
  w: 2.0,
  h: 1.802,
  d: 2.042,
  minY: 0,
  maxY: 1.802,
  /** Kutu z'de SİMETRİK DEĞİL: tabla öne 0,042 taşıyor. Telafi `LAVABO_DZ`. */
  minZ: -1.0,
  maxZ: 1.042,
  /** Tezgâh üstü: modelin TAM eninde dolu olduğu en yüksek y (ışın profili, %90 eşiği). */
  tablaY: 0.98,
} as const;

/**
 * BUGÜNKÜ ELLE ÇİZİMİN KUTUSU — model bu kutuya çekilir, yani WC'nin yerleşimi, nav'ı ve
 * yürüme açıklığı HİÇ DEĞİŞMEZ.
 */
export const LAVABO_KUTU = { w: 1.36, d: 0.66, tablaY: 0.86 } as const;

/**
 * DÖNÜŞÜM — `kitchenLook.kayGovde` ile aynı desen: modeli hedef kutuya çeken tekdüze OLMAYAN
 * ölçek. Mutfağın ön hattı da böyle çiziliyor (S3/D-099).
 *
 * Çarpıtma bilerek kabul edildi: modelin ASIL istenen parçası (musluk kolu) DİKEY, ve dikey bir
 * kol derinlik ölçeğinden en az etkilenen parçadır. Alternatifler ölçülüp elendi — tekdüze/enden
 * tezgâh üstünü boyun %39'una indiriyordu (gerçek %49), tekdüze/tezgâhtan ise 1,73 × 1,73 br
 * yapıp lavabo aralığını 1,70 → 1,93 açtırıyordu.
 */
export const LAVABO_SCALE: [number, number, number] = [
  LAVABO_KUTU.w / LAVABO_NATIVE.w,
  LAVABO_KUTU.tablaY / LAVABO_NATIVE.tablaY,
  LAVABO_KUTU.d / LAVABO_NATIVE.d,
];

/**
 * Z TELAFİSİ — modelin kutusu origin etrafında simetrik değil (minZ −1,000 · maxZ +1,042).
 * Ölçeklendikten sonra merkez `((minZ + maxZ) / 2) × sz` kadar kaymış olur; bu kadar geri
 * itilmezse gövde lavabo kutusunun ÖNÜNE oturur (`kayGovde`'nin de çözdüğü sapma).
 */
export const LAVABO_DZ = -((LAVABO_NATIVE.minZ + LAVABO_NATIVE.maxZ) / 2) * LAVABO_SCALE[2];

/** Çarpıtma oranı — en büyük ölçek / en küçük ölçek. Bekçi bunu görünür tutar. */
export const LAVABO_CARPITMA = Math.max(...LAVABO_SCALE) / Math.min(...LAVABO_SCALE);

/**
 * TURUNCU → GRİ. [3,6] `#be5e2f` mutfağın tezgâh gözü; [0,3] `#828c91` paketin grisi ve bu
 * modelin gövdesinin zaten %70'i.
 */
export const LAVABO_GOZ: readonly (readonly [Goz, Goz])[] = [[[3, 6], [0, 3]]];

/**
 * MUSLUK KOLUNUN HAM z ARALIĞI — ölçüldü, varsayılmadı: y > 1,30'daki 166 köşe z ∈ [−0,644, −0,036].
 * Musluk modelin ARKA yarısında; elle çizilen lavabonunki de arkadaydı, o yüzden model
 * DÖNDÜRÜLMEDEN oturuyor ve ayna arkada kalmaya devam ediyor.
 */
export const MUSLUK_Z = { min: -0.644, max: -0.036 } as const;

/** Musluk kolunun dünya tepesi. */
export const muslukTepeY = (): number => LAVABO_NATIVE.maxY * LAVABO_SCALE[1];

/** Musluk kolunun dünya z aralığı (derinlik ölçeği + telafi uygulanmış). */
export const muslukZ = (): { min: number; max: number } => ({
  min: MUSLUK_Z.min * LAVABO_SCALE[2] + LAVABO_DZ,
  max: MUSLUK_Z.max * LAVABO_SCALE[2] + LAVABO_DZ,
});

// ---------------------------------------------------------------------------------------------
//  AYNA — kullanıcı: *"ayna da kaykitten mi bilmiyorum ama ayna oradan olsun"*
// ---------------------------------------------------------------------------------------------
/**
 * ÜÇ PAKETTE "AYNA" MODELİ YOK (238 model tarandı). En yakın karşılık `pictureframe_medium`:
 * ahşap çerçeve + düz tuval. Ölçüm hangi parçanın hangi göz olduğunu söyledi — çerçeve [0,3]
 * (kahve, köşelerin %95'i), TUVAL [0,7] (beyaz, %5 = tek dörtgen). Tuval [1,2] mavisine
 * taşınınca çerçeveli bir AYNA oluyor: çerçeve KayKit'in kendi ahşabı (WC'nin kabin kapılarıyla
 * aynı dil), cam paketin kendi mavisi.
 *
 * `node tools/model-olc.mjs kaykit-furniture-bits pictureframe_medium` → 0,700 × 0,900 × 0,200,
 * **sırtı z = 0'da** (duvara düz yaslanır, telafi gerekmez).
 */
export const AYNA_NATIVE = { w: 0.7, h: 0.9, d: 0.2, minZ: 0, maxZ: 0.2 } as const;

/**
 * TUVALİN YERİ — ölçüldü: [0,7] gözü **4 köşe**, tek dörtgen, `z = 0,150`, x ±0,23 · y ±0,33.
 * Çerçeve [0,3] gözü 84 köşeyle tüm kutuyu sarıyor. Yani modelin ÖN YÜZÜ +z'de ve tuval onun
 * hemen gerisinde.
 *
 * **BU SAYI BİR HATA YAKALADI:** ayna ilk denemede `rotation={[0, π, 0]}` ile konmuştu ve ekranda
 * düz KAHVERENGİ bir dikdörtgen olarak çıktı — çünkü döndürülünce SIRTI odaya bakıyordu.
 * Model zaten doğru yönde (sırtı z = 0, yüzü +z); dönüş GEREKMİYOR.
 */
export const AYNA_TUVAL_Z = 0.15;

/** Gerçek WC aynası ≈ 0,80 boyunda. Ölçek BOYDAN türer (dikey parça). */
export const AYNA_H = 0.8;
export const AYNA_S = AYNA_H / AYNA_NATIVE.h;

/** Aynanın merkez yüksekliği — maketin kendi sayısı (göz hizası). */
export const AYNA_Y = 1.75;

/**
 * LAVABONUN DUVARDAN PAYI — `MaketLavaboBlock` lavaboları `x2 − LAVABO_DUVAR_PAYI`'ya koyuyor.
 *
 * **TÜRETİLİR, YAZILMAZ.** Maket 0,45 yazıyordu ve gövde 0,66 derin olduğu için sırtı duvarın
 * **0,12 önünde** kalıyordu — kullanıcının rafta ve kaloriferde gördüğü kusurun aynısı, sadece
 * kimse bakmamıştı. Pay artık gövdenin yarısından (asimetri telafisi dahil) çözülüyor: sırt
 * duvarın yüzüne DEĞER. Aynanın yeri de buradan türediği için ikisi birlikte hareket eder.
 */
export const LAVABO_DUVAR_PAYI = LAVABO_KUTU.d / 2 - LAVABO_DZ;

/** Gövdenin SIRTININ yerel z'si — bekçi bunun duvarın yüzüyle çakışmasını ister. */
export const lavaboSirtZ = (): number => LAVABO_DZ - LAVABO_KUTU.d / 2;

/**
 * Aynanın SIRTININ oturduğu yerel z = duvarın yüzü. Model `minZ = 0` olduğu için sırt tam bu
 * düzleme oturur. Eski elle çizim −0,27'deydi, yani **duvardan 0,18 önde asılıydı**.
 *
 * TÜRETİLİR, YAZILMAZ: ilk bekçi bunu `−0,45 < aynaOnZ < 0` diye denetliyordu ve M21 mutasyonu
 * (−0,45 → −0,27, yani aynanın havaya geri asılması) o aralıktan KAÇTI. Ölçüt artık aralık
 * değil eşitlik: sırt duvarın yüzünde OLMAK ZORUNDA.
 */
export const AYNA_Z = -LAVABO_DUVAR_PAYI;

/**
 * TUVAL → cam mavisi [1,2] · ÇERÇEVE → gri [0,6].
 *
 * Çerçeve neden de taşındı: modelin kendi ahşabı furniture atlasında [0,3] `#b27052`, yani
 * TURUNCUYA çalan bir kiremit. Ekranda denendi ve WC'nin gri/beyaz diliyle çakıştı — kullanıcının
 * lavabolar için söylediğinin aynısı ("turuncular… gri halleri olsun"). [0,6] `#828c91`
 * lavabonun gövde grisiyle AYNI göz, yani ayna ile lavabo tek malzemeden okunuyor.
 */
export const AYNA_GOZ: readonly (readonly [Goz, Goz])[] = [
  [[0, 7], [1, 2]],
  [[0, 3], [0, 6]],
];

/** Aynanın odaya bakan ÖN yüzünün yerel z'si (sırt + derinlik). */
export const aynaOnZ = (): number => AYNA_Z + AYNA_NATIVE.maxZ * AYNA_S;

/**
 * Musluk ile ayna arasındaki derinlik payı — pozitifse musluk aynanın ÖNÜNDE, temiz.
 *
 * BEKÇİ ÖLÇÜTÜ NEDEN "y'de ÜSTÜNDE" DEĞİL: musluk 1,58'e çıkıyor, aynanın alt kenarı 1,35 —
 * ikisi ekranda üst üste biniyor ve bu KUSUR DEĞİL, doğrusu bu (gerçek lavaboda da musluk
 * aynanın önünde durur). Kusur olacak şey derinlikte iç içe geçmeleriydi.
 */
export const muslukAynaPayi = (): number => muslukZ().max - aynaOnZ();

// =============================================================================================
//  KABİN — T7 (D-141). Kullanıcı 2026-09-23: *"lavabo kapılarından memnun değilim, oda kapısı
//  gibi; oraya düz lavabo kapısı istiyorum, gerekirse asset yerine kendin çiz"*.
// =============================================================================================
/**
 * KayKit `Door_A` (S13/D-111) panelli bir ODA kapısıydı: çerçeve, tabla, tokmak, yere kadar kanat.
 * Tuvalet kabinini kabin yapan üç işaret onda yoktu — **düz laminat kanat, yerden açıklık ve
 * kabinleri üstten bağlayan ray**. Kabin artık bütünüyle ilkel şekille çiziliyor (model yükü de
 * kalktı). Laminat yeşil-gri: WC'nin "tek kahve kütle" itirazı (D-104) aynı hamlede kapandı.
 * Kabin GÖZÜ değişmedi (1,36 kanat gözü · 1,5 bölme adımı): yerleşim, nav ve kayboluş aynı.
 */
export const KABIN_KUTU = { w: 1.36, h: 1.95 } as const;

/** Bölme ve kanat aynı bantta: yerden 0,16 açık, 1,80'de biter (oda duvarı 2,2). */
export const KABIN_BANT = { alt: 0.16, ust: 1.8 } as const;

export const KABIN_KAPI = {
  /** Kanat eni: gözden menteşe ve kilit tarafında 0,02'şer pay. */
  w: KABIN_KUTU.w - 0.04,
  kalinlik: 0.04,
  /** Kol ve dolu/boş göstergesinin yüksekliği. */
  kolY: 1.0,
} as const;

export const KABIN_BOLME = { kalinlik: 0.05, derin: 1.6 } as const;

/** Rayın yüksekliği: kanadın hemen üstü. */
export const KABIN_RAY_Y = KABIN_BANT.ust + 0.04;

export const KABIN_RENK = {
  laminat: '#7fa99b',
  bolme: '#6f978a',
  metal: '#b8c2c4',
  bos: '#4caf50',
  dolu: '#d84b3a',
} as const;

/** Menteşeden kanat ORTASINA olan mesafe — kapı hem kapalı hem aralık çizilirken buradan konur. */
export const KABIN_MENTESE_ORTA = KABIN_KUTU.w / 2;

/** Maketin aralık kapısının açısı (rad) — gerçek MENTEŞE etrafında döner. */
export const KABIN_ARALIK_ACI = 0.55;

// =============================================================================================
//  SEVİYE SİNYALİ — S7/L (G-36 · D-104)
// =============================================================================================
/**
 * SEVİYE ARTIK MEKÂNSAL OKUNUYOR: lavabo sayısı VE kabin kapısı sayısı birlikte büyür.
 *
 * NEDEN İKİSİ BİRDEN — ölçüm tek başına lavabonun yetmediğini gösterdi:
 * doğu duvarı **7,40 br** ve 1,36'lık gövdeyle **en çok 5** lavabo alıyor; üstelik en öndeki
 * slot ön duvarın kör bandında kalıp **%0** görünüyor. Yani mekânsal sayı gerçekte **4**
 * kademe taşıyor, `maxLevel` ise **6**. Kabin kapısı kolu (%27 ile odanın en görünür parçası)
 * kalan iki kademeyi taşır ve `feedback_upgrade_legibility`nin istediği **çoklu redundant
 * sinyali** de aynı hamlede kurar.
 *
 * Kural: **her seviye tam bir şeyi büyütür** — L1(2+2) → L2(3+2) → L3(3+3) → L4(4+3) →
 * L5(4+4) → L6(4+5). Hiçbir yükseltme "ekranda hiçbir şey değişmedi" hissi bırakmaz.
 *
 * DENGEYE DOKUNMAZ: bu iki dizi yalnız ÇİZİMİ sürüyor; `economy.config.rooms.lavabo`
 * (maliyet · uğrama olasılığı · ücret) hiç oynamadı, varyant kapısı açılmadı.
 */
export const LAVABO_SAYI_BY_LEVEL = [2, 3, 3, 4, 4, 4] as const;
export const KABIN_SAYI_BY_LEVEL = [2, 2, 3, 3, 4, 5] as const;

/**
 * ODANIN ETKİN SEVİYESİ — `feedback_single_source_of_truth`: iki alan ayrışabiliyor.
 *
 * Oda `padsDone.includes('lavabo')` ile ÇİZİLİYOR, sayılar ise `lavaboLevel`den geliyor. Oyunda
 * ikisini `tick` birlikte kuruyor (pad bitince `lavaboLevel = max(level, 1)`), ama dev kancası
 * `__setState({ padsDone })` bu bağı atlıyor — ve GÖRSEL TUR bunu yakaladı: oda açık, seviye 0,
 * içi bomboş. Eski kod sabit "üç lavabo / dört kabin" çizdiği için kusur görünmüyordu; sayı
 * seviyeye bağlanınca ortaya çıktı.
 *
 * Yama değil TÜRETME: oda açıkken seviye tanım gereği en az 1'dir, kural burada yazılı.
 */
export const wcSeviye = (level: number, odaAcik: boolean): number =>
  odaAcik ? Math.max(1, level) : 0;

/** Seviye → çizilecek lavabo sayısı (0 = oda kapalı). */
export const lavaboSayisi = (level: number): number =>
  level <= 0 ? 0 : LAVABO_SAYI_BY_LEVEL[Math.min(level, LAVABO_SAYI_BY_LEVEL.length) - 1];

/** Seviye → çizilecek kabin kapısı sayısı (0 = oda kapalı). Bölme sayısı bunun bir fazlası. */
export const kabinSayisi = (level: number): number =>
  level <= 0 ? 0 : KABIN_SAYI_BY_LEVEL[Math.min(level, KABIN_SAYI_BY_LEVEL.length) - 1];

/**
 * LAVABO SLOTLARI — merkezleri arası mesafe artık gövde eniyle AYNI (bitişik dizi).
 * Eski sabit 1,70'ti ve duvara yalnız 4 tane sığdırıyordu; 1,36 beşe çıkarıyor, biz dördünü
 * kullanıyoruz (beşincisi §V'de %0 görünür çıktı).
 */
export const LAVABO_SLOT_ARALIK = LAVABO_KUTU.w;

/** i. slotun arka duvardan (odanın iç yüzünden) uzaklığı — z'si çağıran tarafta toplanır. */
export const lavaboSlotOfset = (i: number): number => LAVABO_KUTU.w / 2 + i * LAVABO_SLOT_ARALIK;

/** Bölmelerin x adımı ve ilk bölmenin odanın sol kenarından ofseti (maketin sayıları). */
export const KABIN_ADIM = 1.5;
export const KABIN_X_OFSET = 0.4;
