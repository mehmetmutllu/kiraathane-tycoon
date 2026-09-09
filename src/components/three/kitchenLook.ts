/**
 * kitchenLook.ts — SERVİS KÖŞESİNİN (mutfak) ÖLÇÜ VE ANKRAJ KATMANI (S3).
 *
 * NEDEN AYRI DOSYA: `Scene.tsx` vitest'te import EDİLEMEZ (`recolor` → `Image`), yani orada
 * yazılı hiçbir sayı bekçilenemez. `tableLook.ts` aynı sorunu masalar için çözmüştü (D-072
 * katman 1); mutfak da aynı deseni izler — sayı burada durur, çizim hattı buradan okur.
 *
 * ÖLÇÜ NEREDEN GELDİ: `node tools/model-olc.mjs kaykit-restaurant-bits <ad>` — modelin kendi
 * gltf accessor'larından. Elle tahmin edilen tek sayı yok.
 *
 * PAKET ÖLÇEĞİ (0,90): KayKit restaurant-bits, furniture-bits ile AYNI ham ölçekte yazılmış
 * (`chair_A` iki pakette de 0,75 geniş) — yani projenin zaten dondurduğu `STOOL_S = 0,90`
 * burada da geçerli. Sağlaması insan boyuyla yapıldı (`feedback_reference_scale_trap`):
 * karakter 1,75 · tezgâh üstü 0,90 = boyun **%51**'i (gerçekte 0,90/1,75 = %51) · masa üstü
 * 0,795 = %45. Yani tezgâh masadan gözle görülür yüksek, gerçek oranında.
 *
 * NEDEN 0,80 DEĞİL: KayKit'in duvarı native 4,0, oyununki `WALL_H` 3,2 → mimari ölçek 0,80
 * çıkıyor. O ölçekte tezgâh üstü 0,80'e, yani masa üstüyle (0,795) AYNI hizaya düşerdi.
 * Mobilya insana göre ölçeklenir, duvar odaya göre; ikisi tek sayıya zorlanmadı. Duvara asılan
 * üniteler bu farkı ÜST HİZADAN kapatır: `WALL_UNIT_Y` aşağıda türetiliyor.
 */
import { BAND, BAND_SHELL, servicePlace } from '../../game/layout';
import { WALL_H } from './wallPanel';

/** KayKit ham ölçek → dünya. `tableLook.STOOL_S` ile aynı sayı, aynı gerekçe. */
export const KITCHEN_S = 0.9;

export type KitchenKey =
  | 'fridge_A'
  // Sırtlıksız gövdeler yalnız ÖN HATTA kullanılır: o tezgâhlar duvara değil salona bakar.
  | 'kitchencounter_straight_A'
  | 'kitchencounter_straight_B'
  | 'kitchencounter_sink'
  | 'kitchencounter_straight_A_backsplash'
  | 'kitchencounter_straight_B_backsplash'
  | 'kitchencounter_sink_backsplash'
  | 'stove_multi'
  | 'oven'
  | 'extractorhood'
  | 'kitchencabinet'
  | 'dishrack_plates'
  | 'crate'
  | 'crate_potatoes'
  | 'crate_lid'
  | 'waterRack';

/**
 * MODELLERİN HAM SINIR KUTUSU — `tools/model-olc.mjs` çıktısı, birebir.
 *
 * `waterRack` KayKit DEĞİL: damacana rafının paket karşılığı yok (KayKit Türk kıraathanesi
 * eşyası içermiyor), elle çizilen `MaketWaterRack` yerinde kalıyor. Ölçüsü yine de buraya
 * yazıldı — çakışma bekçisi odanın TAMAMINI görsün diye, yarısını değil.
 */
export const NATIVE: Record<KitchenKey, { w: number; h: number; minY: number; minZ: number; maxZ: number }> = {
  fridge_A: { w: 2.0, h: 2.5, minY: 0, minZ: -1.0, maxZ: 1.24 },
  kitchencounter_straight_A: { w: 2.0, h: 1.0, minY: 0, minZ: -1.0, maxZ: 1.042 },
  kitchencounter_straight_B: { w: 2.0, h: 1.0, minY: 0, minZ: -1.0, maxZ: 1.042 },
  kitchencounter_sink: { w: 2.0, h: 1.802, minY: 0, minZ: -1.0, maxZ: 1.042 },
  kitchencounter_straight_A_backsplash: { w: 2.0, h: 1.2, minY: 0, minZ: -1.0, maxZ: 1.042 },
  kitchencounter_straight_B_backsplash: { w: 2.0, h: 1.2, minY: 0, minZ: -1.0, maxZ: 1.042 },
  kitchencounter_sink_backsplash: { w: 2.0, h: 1.802, minY: 0, minZ: -1.0, maxZ: 1.042 },
  stove_multi: { w: 2.0, h: 1.2, minY: 0, minZ: -1.03, maxZ: 1.258 },
  oven: { w: 2.0, h: 2.02, minY: 0, minZ: -1.03, maxZ: 1.318 },
  // Duvara asılanlar y 2→4 arasında yazılmış, SIRTI z = 0'da (duvara yaslanır).
  extractorhood: { w: 2.0, h: 2.0, minY: 2.0, minZ: 0, maxZ: 1.609 },
  kitchencabinet: { w: 2.0, h: 2.0, minY: 2.0, minZ: 0, maxZ: 1.042 },
  dishrack_plates: { w: 1.2, h: 1.095, minY: 0, minZ: -0.6, maxZ: 0.6 },
  crate: { w: 2.0, h: 0.8, minY: 0, minZ: -1.0, maxZ: 1.0 },
  crate_potatoes: { w: 2.0, h: 0.966, minY: 0, minZ: -1.0, maxZ: 1.0 },
  crate_lid: { w: 2.0, h: 0.2, minY: 0, minZ: -1.0, maxZ: 1.0 },
  // MaketWaterRack (elle çizili): 1,3 en × 1,5 yükseklik × 0,5 derinlik, origin ortada.
  // Ham sayı olarak yazılır ki `unitBox` ölçeği herkese aynı uygulasın.
  waterRack: {
    w: 1.3 / KITCHEN_S,
    h: 1.5 / KITCHEN_S,
    minY: 0,
    minZ: -0.25 / KITCHEN_S,
    maxZ: 0.25 / KITCHEN_S,
  },
};

/** Bir modülün dünya eni — ızgara adımı buradan türer (elle 1,8 yazılmaz). */
export const MODULE_W = NATIVE.kitchencounter_straight_A_backsplash.w * KITCHEN_S;

/** Tezgâhın ÇALIŞMA yüzeyi: sırtlıksız gövde native 1,0 → dünyada 0,90. */
export const COUNTER_TOP_Y = 1.0 * KITCHEN_S;

/**
 * DUVAR ÜNİTELERİNİN düşey kayması. Ünite native 2→4 arasında yazılı (dünyada 3,6 boyunda);
 * ankraj ÜST HİZADIR: ünitenin tepesi duvarın tepesine (`WALL_H`) oturur, altı nereye düşerse
 * oraya düşer. Böylece paketin 4 birimlik oda yüksekliği oyunun 3,2'sine, ünitenin kendi oranı
 * bozulmadan uyar. Sonuç: alt yüz 1,40 → tezgâhla arası 0,50 (gerçek mutfakta ~0,55).
 */
export const WALL_UNIT_Y = WALL_H - (NATIVE.kitchencabinet.minY + NATIVE.kitchencabinet.h) * KITCHEN_S;

/** Duvar ünitesinin dünyadaki ALT yüzü — "tezgâhın üstünde mi" bekçisi bunu okur. */
export const WALL_UNIT_BOTTOM_Y = WALL_UNIT_Y + NATIVE.kitchencabinet.minY * KITCHEN_S;

// ---- ODANIN SINIRLARI (hepsi türetilir; hiçbiri elle yazılmaz) ----
/** Arka duvarın İÇ yüzü — hattın sırtını dayadığı çizgi. */
export const BACK_Z = BAND_SHELL.innerBack;
/** Sol duvarın iç yüzü. */
export const LEFT_X = BAND_SHELL.innerLeft;
/** Doğu sınırı: merdiven kovasının ara duvarı. */
export const RIGHT_X = BAND.service.maxX;
/**
 * ÖN sınır: OYUNUN işleyen servis tezgâhının ARKA yüzü. Mutfak dekoru buradan öne geçemez —
 * geçerse çaycının hattına ve tezgâhın collision kutusuna girer.
 */
export const FRONT_Z = servicePlace(3).station[2] - servicePlace(3).half[1];

export type Kat = 'zemin' | 'tezgah' | 'duvar';

export interface KitchenUnit {
  key: KitchenKey;
  /** Modülün dünya merkezi. */
  x: number;
  z: number;
  /** Çeyrek dönüş sayısı (0 = ön yüz +z'ye bakar, 1 = +x, 2 = −z, 3 = −x). */
  ceyrek: 0 | 1 | 2 | 3;
  kat: Kat;
  /** Düşey kayma (duvar üniteleri ve tezgâh üstü eşyalar için). */
  y?: number;
  /**
   * Ünitenin KENDİ ölçeği. Varsayılan `KITCHEN_S`. Kasa gibi KÜÇÜK objeler paketin 2×2'lik
   * modül ölçeğinde absürt büyüyor (0,90'da 1,80 br = palet sandığı); onlar gerçek boyuna
   * çekilir. Kullanıcı 2026-09-09: *"kasa olduğu için daha küçük yapabilirsin"*.
   */
  olcek?: number;
}

/** Sırtı arka duvara dayanan modülün z merkezi — modelin KENDİ minZ'sinden türer. */
const arkaZ = (key: KitchenKey): number => BACK_Z - NATIVE[key].minZ * KITCHEN_S;

/** k. modülün x merkezi: sol duvardan başlar, modül eniyle ilerler. */
export const modulX = (k: number): number => LEFT_X + MODULE_W / 2 + k * MODULE_W;

/** Tezgâh sırasındaki modüllerin çalışma yüzeyi (dishrack gibi üstüne konanlar buraya oturur). */
const TEZGAH_Z = arkaZ('kitchencounter_straight_B_backsplash');

/** Batı duvarına dönen modülün x merkezi — sırtı sol duvarda, `arkaZ` ile aynı türetme. */
const BATI_X = LEFT_X - NATIVE.kitchencounter_straight_B_backsplash.minZ * KITCHEN_S;

/** Depo kasalarının z hattı: soğutucunun ön yüzünün 0,4 önünde, hattı kesmez. */
const DEPO_Z = -13.9;

/**
 * KASA ÖLÇEĞİ. KayKit'in kasası da 2×2'lik modül karosunda yazılı; `KITCHEN_S` ile 1,80 br
 * enine çıkıyordu ve arkasındaki fırının önünü kapatıyordu (kullanıcı 2026-09-09).
 * Gerçek bir meyve/erzak kasası ~0,60 × 0,35. Seçilen 0,45 → **0,90 × 0,36**: hem gerçek
 * kasa oranı, hem iki kasa yan yana tam BİR modül eni (1,80) — hat ritmi bozulmuyor.
 * 1,82 boyundaki fırının önünü artık 0,36'lık bir kutu kapatamaz.
 */
const KASA_S = 0.45;

/**
 * MUTFAĞIN YERLEŞİMİ — arka duvarda 7 modüllük tek hat, doğu ucunda depo.
 *
 * Hat okunabilir bir iş sırası anlatır (maket v13'ün kurgusu): soğutucu → hazırlık → ocak →
 * bardak/tezgâh → hazırlık → bulaşık → fırın. Depo en doğuda, merdiven kovasının dibinde.
 * Duvar dolapları hattın İKİ ucuna değil, ÇALIŞMA modüllerinin üstüne asılır; çay bardağı
 * rafları (elle çizili `MaketWallShelf`) ortadaki iki modülün üstünde kalır — o yüzden
 * 3. ve 4. modülün üstü boştur.
 */
export const KITCHEN_UNITS: readonly KitchenUnit[] = [
  { key: 'fridge_A', x: modulX(0), z: arkaZ('fridge_A'), ceyrek: 0, kat: 'zemin' },

  { key: 'kitchencounter_straight_A_backsplash', x: modulX(1), z: arkaZ('kitchencounter_straight_A_backsplash'), ceyrek: 0, kat: 'zemin' },
  { key: 'kitchencabinet', x: modulX(1), z: BACK_Z, ceyrek: 0, kat: 'duvar', y: WALL_UNIT_Y },

  { key: 'stove_multi', x: modulX(2), z: arkaZ('stove_multi'), ceyrek: 0, kat: 'zemin' },
  { key: 'extractorhood', x: modulX(2), z: BACK_Z, ceyrek: 0, kat: 'duvar', y: WALL_UNIT_Y },

  { key: 'kitchencounter_straight_B_backsplash', x: modulX(3), z: TEZGAH_Z, ceyrek: 0, kat: 'zemin' },
  { key: 'dishrack_plates', x: modulX(3), z: TEZGAH_Z + 0.3, ceyrek: 0, kat: 'tezgah', y: COUNTER_TOP_Y },

  { key: 'kitchencounter_straight_A_backsplash', x: modulX(4), z: arkaZ('kitchencounter_straight_A_backsplash'), ceyrek: 0, kat: 'zemin' },

  { key: 'kitchencounter_sink_backsplash', x: modulX(5), z: arkaZ('kitchencounter_sink_backsplash'), ceyrek: 0, kat: 'zemin' },
  { key: 'kitchencabinet', x: modulX(5), z: BACK_Z, ceyrek: 0, kat: 'duvar', y: WALL_UNIT_Y },

  { key: 'oven', x: modulX(6), z: arkaZ('oven'), ceyrek: 0, kat: 'zemin' },

  // BATI DUVARI — hat köşeyi döner (L mutfak). Soğutucunun önündeki boş yüzeyi kapatır ve
  // üstündeki çay bardağı rafına bir dayanak verir; rafın altı boş kalmasın diye.
  { key: 'kitchencounter_straight_B_backsplash', x: BATI_X, z: -14.0, ceyrek: 1, kat: 'zemin' },

  // DEPO — fırının önünde, merdiven kovasının dibinde. İki kasa yan yana, ikisi de İSTİFLİ:
  // açık kasanın üstünde kapak, dolu kasanın üstünde ikinci kasa (depo "kullanılıyor" okunsun).
  { key: 'crate', x: modulX(6) - 0.45, z: DEPO_Z, ceyrek: 0, kat: 'zemin', olcek: KASA_S },
  { key: 'crate_lid', x: modulX(6) - 0.45, z: DEPO_Z, ceyrek: 0, kat: 'tezgah', y: NATIVE.crate.h * KASA_S, olcek: KASA_S },
  { key: 'crate_potatoes', x: modulX(6) + 0.45, z: DEPO_Z, ceyrek: 0, kat: 'zemin', olcek: KASA_S },
  { key: 'crate', x: modulX(6) + 0.45, z: DEPO_Z, ceyrek: 1, kat: 'tezgah', y: NATIVE.crate_potatoes.h * KASA_S, olcek: KASA_S },

  // Damacana rafı: KayKit karşılığı yok, elle çizili duruyor; yeri depo hattının devamı.
  { key: 'waterRack', x: modulX(6) + 0.4, z: -11.9, ceyrek: 3, kat: 'zemin' },
];

/** Duvar rafının (çay bardakları) asıldığı modüller — hattın ortası. */
export const RAF_MODULLERI = [3, 4] as const;

/** Ünitenin dünya AABB'si (çeyrek dönüş uygulanmış). */
export function unitBox(u: KitchenUnit): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
} {
  const n = NATIVE[u.key];
  const S = u.olcek ?? KITCHEN_S;
  const hw = (n.w / 2) * S;
  const z0 = n.minZ * S;
  const z1 = n.maxZ * S;
  const y = u.y ?? 0;
  const dus = { minY: y + n.minY * S, maxY: y + (n.minY + n.h) * S };
  switch (u.ceyrek) {
    case 0:
      return { minX: u.x - hw, maxX: u.x + hw, minZ: u.z + z0, maxZ: u.z + z1, ...dus };
    case 2:
      return { minX: u.x - hw, maxX: u.x + hw, minZ: u.z - z1, maxZ: u.z - z0, ...dus };
    case 1:
      // +π/2: yerel +z → dünya +x
      return { minX: u.x + z0, maxX: u.x + z1, minZ: u.z - hw, maxZ: u.z + hw, ...dus };
    default:
      return { minX: u.x - z1, maxX: u.x - z0, minZ: u.z - hw, maxZ: u.z + hw, ...dus };
  }
}

// ---- ÖN HAT: OYUNUN İŞLEYEN TEZGÂHLARI (S3, kullanıcı 2026-09-09) ----
//
// Arka duvardaki dekor hattı serbestçe derinleşebiliyordu (bant yürünmez kütle, 7,1 br derin).
// ÖN hat öyle değil: çay tezgâhı, garson istasyonu ve bulaşık birer COLLISION kutusudur ve
// oyuncu tam önlerinde durur. Bu yüzden KayKit modeli buraya OLDUĞU GİBİ konamaz — modül
// 1,84 derin, collision 1,00. Model kutunun ölçüsüne ÇEKİLİR (eksen başına ölçek), ve
// çekmece yüzleri x-y düzleminde olduğu için gözle okunan tek fark tablanın sığlaşmasıdır —
// bir servis bankosunda zaten istenen şey.
//
// ÇEKMECELER HANGİ YÜZDE (kullanıcı 2026-09-09): ilk uygulamada modelin ön yüzü SALONA
// bakıyordu — yani çekmeceler müşteri tarafına açılıyordu. Gerçek bir servis bankosunda dolap
// personelin durduğu yüzdedir; ön hattın üç tezgâhı da **mutfağa dönük** (`yon = 'mutfak'`,
// varsayılan). Arka duvardaki hat bunun tersi DEĞİL aynı kuralın kendisi: orada da personel
// tezgâhın önünde (mutfağın içinde) durur, o yüzden ön yüz +z'de kalır.
//
// ÜST HİZA: elle çizilen gövdelerin tablası da tam **0,90**'daydı (`boxGeometry` 0,9 boy,
// merkez 0,45). Yani ön hattın üst hizası arka hatla AYNI sayı — ve üstündeki onlarca eşya
// (semaver, hazır bardaklar, tost sacı, sürahiler, peçetelik, kirli bardak tepsisi) tek bir
// koordinat değişmeden yerinde kalıyor. Gövde derinliği de her tezgâhın BUGÜNKÜ derinliğidir;
// takas görsel bir DERİ değişimidir, yeniden yerleşim değil.

/** Ön hattın tabla üstü — arka hatla aynı sayı, eski gövdelerin tablasıyla da aynı. */
export const FRONT_TOP_Y = COUNTER_TOP_Y;

/**
 * Bir KayKit tezgâhını verilen kutuya çeken dönüşüm.
 * `w` gövde eni · `d` derinlik · `topY` tabla üstü. Modelin z aralığı simetrik DEĞİL
 * (−1,000 → +1,042: tabla öne taşar), o yüzden ölçekten sonra bir de ORTALAMA kayması gerekir;
 * aksi hâlde gövde collision kutusunun 2 cm önüne oturur.
 */
export function kayGovde(
  key: KitchenKey,
  w: number,
  d: number,
  topY: number,
  yon: 'mutfak' | 'salon' = 'mutfak',
): {
  scale: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number];
} {
  const n = NATIVE[key];
  const sx = w / n.w;
  const sz = d / (n.maxZ - n.minZ);
  // Gövdenin (sırtlıksız) tablası native y = 1,0'da; ölçek onu `topY`ye getirir.
  const sy = topY / 1.0;
  const merkez = ((n.minZ + n.maxZ) / 2) * sz;
  const arka = yon === 'mutfak';
  return {
    scale: [sx, sy, sz],
    // Dönüş z'yi ters çevirir → ortalama kaymasının işareti de döner.
    position: [0, 0, arka ? merkez : -merkez],
    rotation: [0, arka ? Math.PI : 0, 0],
  };
}
