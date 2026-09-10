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
