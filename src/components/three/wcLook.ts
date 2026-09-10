/**
 * wcLook.ts — WC LAVABOSUNUN ÖLÇÜ VE ANKRAJ KATMANI (S6/G1).
 *
 * NEDEN: kullanıcı 2026-09-10'da *"lavabodaki musluklar var ya, mutfakta oraya uygun
 * sırıtmayacak musluklu bir şeyler var, onları koy — ama pakette GRİ renkli hali var, onu
 * kullan"* dedi. `maketParts.MaketSink` elle çizilmiş bir lavabo; model geçişi ölçü ister ve
 * `maketParts.tsx` bir R3F dosyası (vitest'te import edilemez) → sayı buraya çıkıyor.
 *
 * ADAY NASIL SEÇİLDİ — ADINDAN DEĞİL, ATLAS GÖZÜNDEN (rapor §G):
 *  | model                        | gözleri                                   | gri mi |
 *  | kitchentable_sink            | TEK göz [0,3] #828c91 · doygunluk 0,11    | EVET   |
 *  | kitchencounter_sink          | [0,3] gri + [3,6] #be5e2f (doy 0,75)      | hayır  |
 * Mutfakta bugün kullanılan `kitchencounter_sink` turuncu ahşap gövdeli — WC'de sırıtırdı.
 * Kullanıcının tarifi ölçümle birebir tuttu.
 *
 * MUSLUK GERÇEK BİR KOL: ışın profili tezgâhı y ≤ 0,996'da, çanağı 1,02–1,22'de, MUSLUK KOLUNU
 * 1,24'ten yukarıda (en yalnız 0,10) gösteriyor — yani boyun **%81'i** musluk. Kullanıcının
 * istediği şey buydu.
 *
 * MODEL BİR MUTFAK MODÜLÜ, WC LAVABOSU DEĞİL: paketin 2,0'lık karosu 0,90'da 1,80 br eninde bir
 * TEZGÂH eder — lavabo yerinin 1,3 katı eni, 2,7 katı derinliği. Bu yüzden ölçek "0,90" değil,
 * bugünkü lavabo KUTUSUNDAN türetiliyor (kullanıcı kararı: G1 kolu).
 */

/** `node tools/model-olc.mjs kaykit-restaurant-bits kitchentable_sink` — BİREBİR. */
export const LAVABO_NATIVE = {
  w: 2.0,
  h: 1.805,
  d: 2.0,
  minY: -0.004,
  maxY: 1.802,
  /** Tezgâh üstü: modelin TAM eninde dolu olduğu en yüksek y (ışın profili, %90 eşiği).
   *  Sağlaması paketin öbür tezgâhları — `kitchencounter_straight_A` de 1,000. */
  tablaY: 0.996,
} as const;

/**
 * BUGÜNKÜ ELLE ÇİZİMİN KUTUSU — `maketParts.MaketSink`in gövde + tezgâh ölçüleri.
 * Model bu kutuya çekilir, yani WC'nin yerleşimi, nav'ı, yürüme açıklığı HİÇ DEĞİŞMEZ.
 */
export const LAVABO_KUTU = { w: 1.36, d: 0.66, tablaY: 0.86 } as const;

/**
 * G1 DÖNÜŞÜMÜ — `kitchenLook.kayGovde` ile aynı desen: modeli hedef kutuya çeken tekdüze
 * OLMAYAN ölçek. Mutfağın ön hattı da böyle çiziliyor (S3/D-099).
 *
 * **ÇARPITMA 2,62 ve bu bilinerek kabul edildi** (rapor §G, kullanıcı kararı): derinlik ölçeği
 * 0,330, en ölçeği 0,680 → musluk kolu derinlikte basıklaşıyor. Alternatifler ölçüldü:
 *  - G2 tekdüze/enden: çarpıtma yok ama tezgâh üstü boyun %39'una iner (gerçek %49) — insan
 *    oranı bozulur, yani 1,75'lik biri lavaboya EĞİLİR.
 *  - G3 tekdüze/tezgâhtan: çarpıtma yok, oran doğru, ama 1,73 × 1,73 br — odaya bugünkünün
 *    2,6 katı taşar ve lavabo aralığı 1,70 → 1,93 açılmak zorunda kalır (yerleşim değişir).
 * G1 seçildi çünkü tek çarpıtmayan şeyi (yerleşim) koruyor ve modelin ASIL istenen parçası
 * (musluk kolu) dikey — dikey bir kol derinlik ölçeğinden en az etkilenen parçadır.
 */
export const LAVABO_SCALE: [number, number, number] = [
  LAVABO_KUTU.w / LAVABO_NATIVE.w,
  LAVABO_KUTU.tablaY / LAVABO_NATIVE.tablaY,
  LAVABO_KUTU.d / LAVABO_NATIVE.d,
];

/** Çarpıtma oranı — en büyük ölçek / en küçük ölçek. Bekçi bunu görünür tutar. */
export const LAVABO_CARPITMA = Math.max(...LAVABO_SCALE) / Math.min(...LAVABO_SCALE);

/**
 * MUSLUK KOLUNUN HAM z ARALIĞI — ölçüldü, varsayılmadı: y > 1,30'daki 166 köşe z ∈ [−0,644, −0,036].
 * Yani musluk modelin ARKA yarısında. Elle çizilen lavabonun musluğu da arkadaydı (z = −0,2),
 * bu yüzden model DÖNDÜRÜLMEDEN oturuyor.
 */
export const MUSLUK_Z = { min: -0.644, max: -0.036 } as const;

/** Musluk kolunun dünya tepesi. */
export const muslukTepeY = (): number => LAVABO_NATIVE.maxY * LAVABO_SCALE[1];

/** Musluk kolunun dünya z aralığı (derinlik ölçeği uygulanmış). */
export const muslukZ = (): { min: number; max: number } => ({
  min: MUSLUK_Z.min * LAVABO_SCALE[2],
  max: MUSLUK_Z.max * LAVABO_SCALE[2],
});

/**
 * AYNA — elle çizimin kendi sayıları (maket): merkez 1,75 (göz hizası), boy 0,70, z = −0,27.
 *
 * BEKÇİ ÖLÇÜTÜ NEDEN "y'de ÜSTÜNDE" DEĞİL: KayKit musluğu 1,56'ya çıkıyor, aynanın alt kenarı
 * 1,40 — yani ikisi ekranda ÜST ÜSTE BİNİYOR. Bu bir kusur değil, doğrusu bu: gerçek bir lavaboda
 * da musluk aynanın ÖNÜNDE durur. Kusur olacak şey DERİNLİKTE çakışmalarıydı; ölçü onu dışlıyor
 * (musluk z ≤ −0,012, ayna yüzü z = −0,245). Bekçi bu yüzden y'yi değil DERİNLİK PAYINI denetler.
 */
export const AYNA_Y = 1.75;
export const AYNA_H = 0.7;
export const AYNA_Z = -0.27;
export const AYNA_T = 0.05;

/** Musluk ile ayna arasındaki derinlik payı — pozitifse musluk aynanın ÖNÜNDE, temiz. */
export const muslukAynaPayi = (): number => muslukZ().max - (AYNA_Z + AYNA_T / 2);
