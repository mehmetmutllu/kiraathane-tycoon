/**
 * layout.ts — SAHNE GEOMETRİSİ: yerleşim (LAYOUT), collision katıları ve personel yol bulma.
 *
 * Faz A2'de store.ts'ten ayrıldı: burada oyun DURUMU yok, yalnız koordinat/geometri var
 * (sabitler + saf fonksiyonlar). Böylece tick sistemleri (tick.ts) store'a bağlanmadan
 * yerleşimi kullanabilir; store.ts bu modülü yeniden dışa aktarır (eski importlar çalışır).
 */
import type { Vec3 } from './types';
import { MAX_AREAS, MAX_SERVICES, MAX_WAITERS, THE_SERVICE, areaTableSlots, areaTableStart, tableKindOfArea } from './world';
import { SEATS_OF_KIND, areaOfTableIndex } from '../config/economy.config';
import { ACTOR_RADIUS, PLAYER_RADIUS } from '../config/actor';
import { buildNavGrid, findNavPath, type NavGrid, type NavSolid } from './nav';

export type RVec3 = readonly [number, number, number];

export function dist2D(a: RVec3, b: RVec3): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dz);
}

/** target'a doğru dt*speed kadar ilerlet; varışta true döner. pos yerinde değişir. */
export function moveToward(pos: Vec3, target: RVec3, step: number): boolean {
  const dx = target[0] - pos[0];
  const dz = target[2] - pos[2];
  const d = Math.hypot(dx, dz);
  if (d <= step || d < 0.001) {
    pos[0] = target[0];
    pos[2] = target[2];
    return true;
  }
  pos[0] += (dx / d) * step;
  pos[2] += (dz / d) * step;
  return false;
}

export const NPC_SPEED = 2.6;
export const PAD_RADIUS = 1.3;
// Masa-başı yükseltme noktasının yarıçapı (Faz 2h). Pad'lerden küçük → komşu masanın noktasını tetiklemez.
export const TABLE_UP_RADIUS = 1.0;

// ---- Sahne yerleşimi (dünya birimi, zemin y=0) ----
// B3-1 (D-061 + D-062): kat MAKET v13 ÖLÇEĞİNE taşındı — 21,2 × 20,6 → **34 × 34** (alan ×2,6).
// Bu adımda İÇERİK büyümedi (12 masa · tek servis · aynı pad zinciri); büyüyen KATIN KENDİSİ.
// Orta şerit + banket adaları ve dolgu B3-2'nin; odalar (lavabo · merdiven) B4'ün; masa tipleri B5'in.
//
// ESKİ MODELİN İKİ VARSAYIMI BURADA KALKTI:
//  1) **Alanlar artık EŞ DEĞİL.** Eskiden tek alan şablonu (10,6 × 10,3) 2×2 ızgarada aynalanıp
//     kaydırılıyordu (`AREA_DX/AREA_DZ/mir/areaCol/areaRow/areaAt`). Maket v13'te iki ön çeyrek
//     17 × 17, arka yarı ise 34 × 9,8 — tek şablon bunu anlatamaz. Alanlar artık AÇIK DİKDÖRTGEN
//     LİSTESİ (`AREA_RECTS`); duvarlar da ızgara sorgusundan değil GEOMETRİDEN türer (`wallSpans`).
//  2) **Servisin yeri sabit değil.** Maket v13'ün 3. adımı ocağı sol duvardan ARKA BANDA taşır
//     ("bütün servis buradan verilir") — D-058 de bunu yazıyordu. Servis koordinatları artık
//     `servicePlace(areasOpen)` ile gelir: seviye korunur, YER değişir.
//
// Değişmeyen ilkeler: her pad açtığı objenin TAM yerinde durur (mekânsal tycoon); masa ile servis
// arası tek noktada "çay-al + servis" yapmayı imkânsız kılacak kadar uzaktır (yürüme döngüsü);
// personel masaları GERÇEK rotayla dolaşır (nav.ts BFS).

/** Katın yarı-boyu: zemin x, z ∈ [−17, 17] = 34 × 34. */
export const FLOOR_HALF = 17;

/**
 * ARKA BANT — üç blok, üçü de z = −9,8 hizasında biter (maket v13): **servis bloğu · merdiven ·
 * lavabo**. Bant YÜRÜNEBİLİR ALAN DEĞİLDİR; alanlar z ≥ −9,8'de biter, bant onların arkasındaki
 * kütledir. Servis noktası ile bulaşık bandın ÖN yüzüne gömülüdür (tezgâh gibi: önünden çalışılır,
 * arkasına geçilmez). Bandın içini açmak (lavabo odası + yıkık merdiven) **B4**'ün işi.
 */
export const BAND = {
  front: -9.8,
  back: -16.9,
  service: { minX: -FLOOR_HALF, maxX: -4.6 },
  stairs: { minX: -4.6, maxX: 4.6 },
  wc: { minX: 4.6, maxX: FLOOR_HALF },
} as const;

/**
 * BANDIN BİNA KABUĞU (BM adım 3). Bant artık katı kütle değil, **maketin odaları**: arkasında
 * binanın kendi duvarı, içinde 2,2'lik ara duvarlar var (maket: *"kamera içeri görsün"*).
 *
 * Hat konumu oyunun her yerinde geçerli kuralla aynı: dış duvar kat kenarından **m = 0,5** dışarıda
 * (`Scene.Walls` da aynı payı kullanır) — maket duvarı kat kenarına ORTALAR, oyun dışına koyar; bu
 * fark bandın öncesinde de vardı, bant onu miras alıyor. İÇ YÜZ hattın 0,09 içidir (maketin duvar
 * gövdesi 0,18). Oda mobilyası (lavabolar, kabinler) bu iç yüzlere yaslanır.
 */
export const BAND_SHELL = {
  /** duvar hatları */
  back: BAND.back - 0.5,
  left: -FLOOR_HALF - 0.5,
  right: FLOOR_HALF + 0.5,
  /** iç yüzler — mobilya bunlara yaslanır */
  innerBack: BAND.back - 0.5 + 0.09,
  innerRight: FLOOR_HALF + 0.5 - 0.09,
  innerLeft: -FLOOR_HALF - 0.5 + 0.09,
  /** maketin ODA duvarı (ara bölme) yüksekliği */
  roomH: 2.2,
} as const;

/**
 * LAVABO ODASI (B4) — bandın `wc` bloğunun içi. Oda YÜRÜNMEZ (bant kütlesi); müşteri kapıda
 * kaybolur, `visitTime` sonra aynı yerde belirir ve çıkışta parasını `coinSpot`'a bırakır.
 *
 * `spot` ÜÇ işi birden görür ve bu bilinçli: (1) odayı açan pad, (2) oda açıldıktan sonra onun
 * yükseltme noktası, (3) müşterinin kapı hedefi. Pad bitince listeden düştüğü için ikisi asla
 * aynı anda etkin olmaz — "her obje kendi yerinde yükselir" kuralının en sade hâli.
 */
export const LAVABO = {
  /** Kapının x'i (bandın ön yüzünde) — pad, yükseltme noktası ve müşteri hedefi aynı nokta. */
  spot: [13.4, 0, -9.3] as Vec3,
  /** Kapı eşiği: müşteri buraya varınca içeri girer (görünmez olur). */
  door: [13.4, 0, -9.55] as Vec3,
  /** Çıkarken parasının bırakıldığı yer — lavabonun ÖNÜNDEKİ istif (masalarınkiyle aynı desen). */
  coinSpot: [13.4, 0.3, -8.4] as Vec3,
  /**
   * KAYBOLUŞ YOLU (S7/M2 · G-35 · D-104) — müşteri artık kapı eşiğinde BUHARLAŞMIYOR.
   *
   * Eski davranış bir TASARIMDI ("oda yürünmez, müşteri kapıda kaybolur") ve oda çizilmeden
   * önce doğruydu. Oda çizilip kamera içini görünce kullanıcı onu **hata** olarak okudu — ve
   * ölçüm haklı çıkardı: kayboluş noktası kapının önündeyken **%100** görülüyor ve her iki
   * müşteriden biri oraya uğruyor.
   *
   * Neden İKİ nokta (düz içeri + yana sapma): ölçüm kapı EKSENİNDE içeri yürüyen müşterinin
   * **hiç saklanmadığını** gösterdi (boşluktan bakılıyor, %78–100 görünür). Saklanma yalnız
   * YANA sapınca ve yalnız duvarın dibindeki **0,2–1,2 br**'lik bantta oluyor. `path` da tam
   * bunu yapıyor: önce kapı boşluğundan düz içeri (duvara sürtmesin), sonra yana.
   *
   * NAV'A VE DENGEYE DOKUNMAZ: `clampToOpenAreas` yalnız OYUNCUYA uygulanıyor (tick §oyuncu),
   * müşteri konumu zaten doğrudan yazılıyor. Yürünebilir alan, bant kütlesi ve `maxConcurrent`
   * tavanı aynen duruyor — yeni durumlar `hasLeftTable`'a dahil, yani koltuk ve spawn tavanı
   * eskisi gibi kalkış anında serbest kalıyor.
   */
  wcIn: [13.4, 0, -10.25] as Vec3,
  wcCorner: [11.4, 0, -10.25] as Vec3,
} as const;

/** WC geçişinin (giriş ve çıkış ayrı ayrı) süresi — görsel zamanlama, dengeye girmez. */
export const WC_GECIS = 0.8;

/**
 * Müşteri geçişin hangi oranından sonra SÖNMEYE başlar. Instancing'de per-instance opaklık yok,
 * o yüzden sönme ÖLÇEKLE yapılır; zaten hedef nokta %0 görünür olduğu için sönme bir yedek,
 * asıl işi köşeye sapma görüyor.
 */
export const WC_SOLMA_ESIGI = 0.6;

/** Geçiş yolu: t ∈ [0,1] → dünya (x, z). İlk yarı kapı boşluğundan düz içeri, ikinci yarı yana. */
export function wcYol(t: number): [number, number] {
  const k = Math.min(1, Math.max(0, t));
  const [ax, , az] = LAVABO.door;
  const [bx, , bz] = LAVABO.wcIn;
  const [cx, , cz] = LAVABO.wcCorner;
  if (k <= 0.5) {
    const u = k * 2;
    return [ax + (bx - ax) * u, az + (bz - az) * u];
  }
  const u = (k - 0.5) * 2;
  return [bx + (cx - bx) * u, bz + (cz - bz) * u];
}

/** Geçiş oranına göre müşterinin ölçeği (1 = tam görünür, 0 = yok). */
export function wcOlcek(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  if (k <= WC_SOLMA_ESIGI) return 1;
  return 1 - (k - WC_SOLMA_ESIGI) / (1 - WC_SOLMA_ESIGI);
}

/**
 * ALAN DİKDÖRTGENLERİ — şablon değil AÇIK LİSTE (maket v13'ün açılma sırası):
 * a0 ön-sol çeyrek · a1 ön-sağ çeyrek · a2 arka yarının tamamı (bandın önü).
 * Ön çeyrekler eş (17 × 17), arka yarı değil (34 × 9,8) — eş olmadıkları için şablon kalktı.
 */
const AREA_RECTS = [
  { minX: -FLOOR_HALF, maxX: 0, minZ: 0, maxZ: FLOOR_HALF },
  { minX: 0, maxX: FLOOR_HALF, minZ: 0, maxZ: FLOOR_HALF },
  { minX: -FLOOR_HALF, maxX: FLOOR_HALF, minZ: BAND.front, maxZ: 0 },
] as const;

const AREAS = Array.from({ length: MAX_AREAS }, (_, a) => a);
const SERVICES = Array.from({ length: MAX_SERVICES }, (_, s) => s);

// ---- Alan kenarları ve duvarlar (ızgara varsayımı YOK) ----
export type AreaSide = 'left' | 'right' | 'front' | 'back';
type Rect = (typeof AREA_RECTS)[number];

const OPPOSITE: Record<AreaSide, AreaSide> = { left: 'right', right: 'left', front: 'back', back: 'front' };
/** Kenarın sabit koordinatı (sol/sağ → x, ön/arka → z). "Ön" = +z (kapı tarafı). */
const sideCoord = (r: Rect, side: AreaSide): number =>
  side === 'left' ? r.minX : side === 'right' ? r.maxX : side === 'front' ? r.maxZ : r.minZ;
/** Kenarın uzandığı aralık (sol/sağ kenar z ekseninde, ön/arka kenar x ekseninde). */
const sideSpan = (r: Rect, side: AreaSide): [number, number] =>
  side === 'left' || side === 'right' ? [r.minZ, r.maxZ] : [r.minX, r.maxX];

/**
 * Alan `a`'nın `side` kenarında DUVAR gereken aralıklar: kenarın tamamından, aynı hat üzerindeki
 * AÇIK komşuların kapattığı parçalar düşülür. Bir kenarı birden çok komşu paylaşabilir (arka
 * yarının ön kenarını iki ön çeyrek BİRLİKTE kapatır) — eski `areaAt(col±1, row)` ızgara sorgusu
 * bunu anlatamıyordu, bu yüzden kalktı. Kilitli komşu "kapalı kenar" sayılır: duvar çizilir.
 */
export function wallSpans(a: number, side: AreaSide, areasOpen: number): [number, number][] {
  const r = AREA_RECTS[a];
  const c = sideCoord(r, side);
  let spans: [number, number][] = [sideSpan(r, side)];
  for (let b = 0; b < areasOpen; b++) {
    if (b === a) continue;
    const o = AREA_RECTS[b];
    if (Math.abs(sideCoord(o, OPPOSITE[side]) - c) > 1e-6) continue; // aynı hatta değil → komşu değil
    const [s0, s1] = sideSpan(o, side);
    spans = spans.flatMap(([x0, x1]): [number, number][] => {
      const rest: [number, number][] = [];
      if (s0 > x0) rest.push([x0, Math.min(s0, x1)]);
      if (s1 < x1) rest.push([Math.max(s1, x0), x1]);
      return rest.filter(([p, q]) => q - p > 0.01);
    });
  }
  return spans;
}

/** Alan `a`'nın `side` kenarında (açık ya da kilitli) bir komşu alan var mı? */
export function hasAreaNeighbor(a: number, side: AreaSide): boolean {
  const c = sideCoord(AREA_RECTS[a], side);
  return AREAS.some((b) => b !== a && Math.abs(sideCoord(AREA_RECTS[b], OPPOSITE[side]) - c) < 1e-6);
}

// ---- ORTA SERIT: BANKET ADALARI (B3-2 — maket v13 adım 6) ----
/**
 * Arka yarının önü (z ∈ [−9,8, 0]) maket v13'te "geniş, tek sıra masalık şerit" olarak bekliyordu.
 * Duvar olmadığı için kafelerin standart çözümü geldi: **SIRT SIRTA BANKET ADASI** — iki yüzlü uzun
 * oturma bankı, ortada ortak sırtlık; her yüzünde ikili masa ve karşısında sandalye. İki ada,
 * ön kümelerle AYNI dikey sütunlarda (x = ∓11,7 · ∓8,5 · ∓5,3).
 *
 * **Adalar TAM BOY doğar (7,6 · maketin ölçüsü), büyüyen şey üstlerindeki MASA sayısıdır.** Önce
 * adaları tek sütunluk (1,2 br) kurup seviyeyle uzatmayı denedim — ekranda 1,2 × 2,5'lik bir kütle
 * banka değil DOLABA benziyor (derinliği boyundan büyük). Bank zaten mekânın sabit donanımıdır;
 * kafede uzayan şey bank değil, bankın önüne dizilen masa sayısıdır. B5'in "var olan masalar yer
 * değiştirmez" sözü aynen duruyor: `banketUnit(u)` u büyüdükçe yalnız YENİ birim üretir, eskiler
 * sabit sütunlarında kalır. (`banketLen` duruyor — B4/B5 farklı boyda bir ada isterse tek kaynak.)
 */
export const BANKET = {
  /**
   * Adaların ortak ekseni. Maket v13 bunu z = −2,95'e koyar; oyunda **−3,8**. Fark 0,85 br ve
   * sebebi maketle çelişmek değil, maketin taşımadığı iki oyun nesnesi: şeridin z ekseninde
   * bank + masa + sandalye + **yükseltme noktası** (koridor) sığmak zorunda ve bunun İKİ yüzü var.
   * −2,95'te güney sandalyesi tam z = 0'a, yani a2 ile ön çeyreklerin dikişine düşüyordu; güney
   * yükseltme noktası ise alanın dışına taşıyordu. −3,8 şeridi 0,85 geri alır: iki yüz de kendi
   * alanının içinde kalır ve kuzey koridoru tezgâh yüzüne (z = −8,1) 0,45 br pay bırakır.
   * Birim geometrisi (bank 0,74 · masa 1,85 · sandalye 2,95) maketle BİREBİR aynı.
   */
  z: -3.8,
  /** GÖRSEL derinlik (kaide + iki oturak); Scene bu ölçüyle çizer. */
  depth: 2.5,
  /**
   * COLLISION derinliği yalnız **sırtlık çekirdeği** (0,8 br). Görsel 2,5'in tamamını katı yapmak
   * bank koltuğunu YOL BULMA AÇISINDAN KAPATIYOR: masanın şişirilmiş ayak izi (±0,78) ile adanın
   * şişirilmiş kenarı üst üste biniyor, aradaki koltuğa BFS'in girebileceği tek bir boş hücre
   * kalmıyor ve `navStep` sessizce düz-çizgi yedeğine düşüyordu (B3-1'in `REACH_TABLE` kusurunun
   * aynısı). 0,8'le masa ile ada arasında bir hücrelik servis boşluğu kalır (z ≈ ∓2,15) — garson
   * banket masasına oradan yanaşır. Bedeli: oyuncu oturak minderinin dış yarısına basabilir
   * (sandalyelerin zaten collision'ı yok — D-016 deseni). Adanın İÇİNDEN GEÇİLEMEZ, asıl kural bu.
   */
  coreHalf: 0.4,
  /** Sütun aralığı (ön kümelerin ritmi). */
  colGap: 3.2,
  /** Uçtaki sütunun ada ucuna uzaklığı. */
  endPad: 0.6,
  /** Adanın DIŞ ucu (∓) — ada boyu değişse de sabit kalan uç. */
  outerX: 12.3,
  /** Adanın taşıdığı sütun sayısı (maket: 3 → boy 7,6, merkez x = ∓8,5). */
  cols: 3,
  /** Ada merkezinden: bank oturağı · masa · karşı sandalye · koridordaki yükseltme noktası. */
  benchDz: 0.74,
  /* Kullanıcı 2026-09-08: *"banketlerdeki masaları banketten azıcık daha uzaklaştır, oradaki
     tabureleri de ona göre ayarla"*. Masa 1,85 → 2,00 (adanın oturak kenarı 1,25; tabla yarısı
     0,525 → aradaki boşluk 0,10'dan 0,225'e çıktı); sandalye masayla arasındaki 0,16'yı korumak
     için 2,95 → 3,02'ye çekildi. Koridordaki yükseltme noktası (3,50) YERİNDE kaldı: 3,65'e
     çıkarılınca güney yüzündeki nokta `waiter` pad'inin dairesine giriyordu (2,26 < 2,30 —
     `layout-b32` bekçisi yakaladı). */
  tableDz: 2.0,
  chairDz: 3.02,
  aisleDz: 3.5,
} as const;

/** `cols` sütunluk adanın boyu (dış uç sabit, içeri uzar): 1 → 1,2 · 2 → 4,4 · 3 → 7,6 (maket). */
export const banketLen = (cols: number): number => 2 * BANKET.endPad + (cols - 1) * BANKET.colGap;

/**
 * Banket birimi `u` (a2'nin masa slotu sırası) → hangi ada / sütun / yüz.
 * Sıra: sol adanın iki yüzü → sağ adanın iki yüzü → bir sonraki sütun. Böylece bugünkü dört birim
 * iki adayı da kurar (simetri) ve B5 sütun eklerken ESKİ birimler yerinde kalır.
 */
export function banketUnit(u: number): { side: -1 | 1; col: number; face: -1 | 1 } {
  return {
    side: Math.floor(u / 2) % 2 === 0 ? -1 : 1,
    col: Math.floor(u / 4),
    face: u % 2 === 0 ? 1 : -1,
  };
}

/** Banket biriminin masa merkezi + koltukları + yükseltme noktası (masaya göre ofsetler). */
function banketSpot(u: number): TableSpot {
  const { side, col, face } = banketUnit(u);
  const x = side * (BANKET.outerX - BANKET.endPad - col * BANKET.colGap);
  return {
    at: [x, BANKET.z + face * BANKET.tableDz],
    // Koltuk 0 = BANK (adanın oturağı; ayrı tabure ÇİZİLMEZ), koltuk 1 = karşı sandalye.
    // Masa L0'da tek koltuk açık olduğundan ilk müşteri BANKETE oturur — ikili masanın doğru okuması.
    seats: [
      [0, -face * (BANKET.tableDz - BANKET.benchDz)],
      [0, face * (BANKET.chairDz - BANKET.tableDz)],
    ],
    kinds: ['bench', 'stool'],
    // Yükseltme noktası KORİDORDA (sandalyenin arkası): sütun eklendikçe komşu birimlerinki
    // 3,2 br ayrı kalır (TABLE_UP_RADIUS 1,0) → B5 büyümesinde çakışmaz.
    up: [0, face * (BANKET.aisleDz - BANKET.tableDz)],
  };
}

// ---- Masalar ----
// Sandalye ofsetleri (masaya göre DÜNYA-ofseti; Tables.tsx aynı listeden çizer → görsel sandalye =
// oturulabilir koltuk, Y2 tek kaynak). İlk spot = ana oturma yeri (eski .seat).
// BM adım 2 (D-073): maketin `SEATS4`'ü birebir — dörtlü çay masasının koltukları merkezden
// ∓1,45'te durur (eskiden ∓0,78'di: masa yarım boy olduğu için koltuklar da içeri toplanmıştı).
const CHAIR_SPOTS: readonly [number, number][] = [
  [0, 1.45],
  [0, -1.45],
  [1.45, 0],
  [-1.45, 0],
];

/** Koltuğun GÖRSEL karşılığı: `stool` = ayrı tabure çizilir · `bench` = banket adasının oturağı. */
export type SeatKind = 'stool' | 'bench';

interface TableSpot {
  at: readonly [number, number];
  up: readonly [number, number];
  /** Koltuk ofsetleri (verilmezse dört yanı tabure: CHAIR_SPOTS). */
  seats?: readonly (readonly [number, number])[];
  kinds?: readonly SeatKind[];
}

// Masa konumları — maket v13'ün küme merkezleri. Ön çeyreklerde 2×2 dörtlü masa (aralık 3,2);
// arka yarıda (a2) ORTA ŞERİT: masalar banket adalarının yüzlerine oturur (B3-2).
// Alan başına 4 slot, GLOBAL index (alan a → [a*4, a*4+4)). Açılış sırası KAPIYA yakından
// başlar: ilk masa servise ~7,6 birim uzakta → yürüme döngüsü ilk andan zorlanır (D-017 §1).
// `up` = yükseltme noktasının masaya göre ofseti: kapı tarafına (+z) ve salonun ortasından DIŞA
// bakan çapraz köşe — komşu masanın noktasına da orta koridora da taşmaz.
const TABLE_SPOTS: readonly TableSpot[] = [
  // BM adım 2 (D-073): küme ofseti maketin `teaCluster(..., 3.2)`'sine çıktı — masa aralığı
  // 3,20 → **6,40**. Eski 1,6'lık ofset ŞERİDİN ızgarasıydı ve yanlışlıkla ön çeyreklere de
  // uygulanmıştı (ölçüm: docs/olcu-plan-karar.html). Yükseltme noktası ∓1,25 → ∓2,15: masa 1,75
  // olunca koltuk ∓1,45'e gitti, nokta koltuğun dışında kalmalı.
  // a0 — ön-sol çeyrek (küme merkezi −8,5 / 8,5)
  { at: [-11.7, 11.7], up: [2.15, 2.15] },
  { at: [-5.3, 11.7], up: [2.15, 2.15] },
  { at: [-11.7, 5.3], up: [2.15, -2.15] },
  { at: [-5.3, 5.3], up: [2.15, -2.15] },
  // a1 — ön-sağ çeyrek (küme merkezi 8,5 / 8,5); yükseltme noktaları aynalı
  { at: [5.3, 11.7], up: [-2.15, 2.15] },
  { at: [11.7, 11.7], up: [-2.15, 2.15] },
  { at: [5.3, 5.3], up: [-2.15, -2.15] },
  { at: [11.7, 5.3], up: [-2.15, -2.15] },
  // a2 — ORTA ŞERİT: on iki birim iki adaya dağılır. B3-2'de dördü çizilebiliyordu (a2 dört slotla
  // kelepçeliydi); B5a kelepçeyi kaldırdı → adaların ALTI sütunu (∓11,7 · ∓8,5 · ∓5,3) iki yüzden
  // dolar: 6 × 2 = 12. Adaların BOYU değişmez (D-064), sıra da değişmez — `banketUnit(u)` u
  // büyüdükçe yalnız YENİ birim üretir, açılmış masalar sütunlarında kalır.
  ...Array.from({ length: areaTableSlots(2) }, (_, u) => banketSpot(u)),
];

/** Kaç banket birimi AÇIK (a2'de kaç masa açıldıysa o kadar). */
export const banketUnitsOpen = (tables: number): number =>
  Math.max(0, Math.min(areaTableSlots(2), tables - areaTableStart(2)));

export interface BanketIsland {
  side: -1 | 1;
  cols: number;
  len: number;
  /** Görsel merkez (uzun kenar x'te). */
  center: Vec3;
  /** COLLISION yarı-boyu: uzunlukta tam, derinlikte yalnız sırtlık çekirdeği (BANKET.coreHalf). */
  half: readonly [number, number];
}

/**
 * O an SAHNEDE olan banket adaları. Şerit açılınca (a2'nin ilk masası) **iki ada birden** tam boyda
 * kurulur: adalar şeridin DONANIMI, masalar ise sonradan gelen içeriktir — bir kafede bank duvarla
 * birlikte vardır, masası olmayan bank boş bir banktır, eksik bir obje değil. Kullanıcının asıl
 * şikâyeti olan boşluğu da bu kapatır: şerit ilk açıldığı anda mobilyalıdır.
 */
export function banketIslands(tables: number): BanketIsland[] {
  if (banketUnitsOpen(tables) === 0) return [];
  const len = banketLen(BANKET.cols);
  return ([-1, 1] as const).map((side) => ({
    side,
    cols: BANKET.cols,
    len,
    center: [side * (BANKET.outerX - len / 2), 0, BANKET.z] as Vec3,
    half: [len / 2, BANKET.coreHalf] as readonly [number, number],
  }));
}

const ALL_TABLES = TABLE_SPOTS.map((t, i) => {
  const table: Vec3 = [t.at[0], 0, t.at[1]];
  // MASA TİPİ alanın planından gelir (economy.config: `TABLE_KIND_PER_AREA`); burada yalnız o tipin
  // koltuklarının NEREDE olduğu tarif edilir. Dörtlü masa CHAIR_SPOTS'un ilk `SEATS_OF_KIND` yerini
  // kullanır; banket kendi iki yerini verir (bank + karşı sandalye). İki kaynak çakışamaz: dilim
  // sayıyı config'ten okur, banketin kendi listesi ise testle tipe bağlanır.
  const kind = tableKindOfArea(areaOfTableIndex(i));
  const offs = t.seats ?? CHAIR_SPOTS.slice(0, SEATS_OF_KIND[kind]);
  const seats = offs.map(([sx, sz]) => [table[0] + sx, 0.6, table[2] + sz] as Vec3);
  return {
    table,
    kind,
    seat: seats[0],
    seats,
    /** Koltuk ofsetleri (masaya göre) — Tables.tsx tabureleri BURADAN çizer (Y2 tek kaynak). */
    seatOffsets: offs,
    /** Her koltuğun görsel karşılığı; `bench` olanlar için ayrı tabure ÇİZİLMEZ (banket adası). */
    seatKinds: (t.kinds ?? offs.map(() => 'stool' as SeatKind)) as readonly SeatKind[],
    upgradeSpot: [table[0] + t.up[0], 0, table[2] + t.up[1]] as Vec3,
  };
});

// ---- SERVİS KÜMESİNİN YERİ (D-062: 3. Alan açılınca ARKA BANDA taşınır) ----
/**
 * Maket v13'ün 1-2. adımında çay ocağı ilk salonun SOL DUVARINDA durur; 3. adımda arka bandın
 * servis bloğuna taşınır ve "bütün servis buradan verilir". Servis AYNI objedir, SEVİYESİ KORUNUR:
 * D-060'ın "obje yer değiştirmez" kuralı seviye merdiveni içindir (L4 tezgâh dönüşümü yerinde olur);
 * buradaki taşınma bir yükseltme değil, ALAN AÇILIŞININ kendisidir.
 *
 * Bu yüzden servis koordinatları sabit dizi değil: `servicePlace(areasOpen)`. Çağıranların elinde
 * `areasOpen` zaten var (tick ctx · store · Scene) — ripple bu yüzden küçük kaldı.
 */
export interface ServicePlace {
  /** Servisin DURDUĞU alan (yerleşim sorusu; `serviceOfTable` ÜRETİM sorusudur ve hep 0 döner). */
  areaIndex: number;
  station: Vec3;
  /** Ön yüzün baktığı yön: 0 = +z (bant tezgâhı), +π/2 = +x (sol duvar modülü). */
  rot: number;
  half: readonly [number, number];
  /** Garsonun tepsi doldurduğu nokta: modülün ÖN yüzü (arkadaki çaycı koridorundan çay ALINMAZ). */
  pickup: Vec3;
  /** Oyuncunun üstünde durup servisi yükselttiği nokta — çay-alma dairesinin DIŞINDA. */
  upgradeSpot: Vec3;
  dish: Vec3;
  dishRot: number;
  dishHalf: readonly [number, number];
  waiterHome: Vec3;
  dishwasherHome: Vec3;
  /** Çaycının tezgâh boyunca gidip geldiği doğru parçası + iş yaparken baktığı yön (Scene). */
  staffWalk: { a: Vec3; b: Vec3; face: number };
}

/** Servis kaç alan açıkken arka banda taşınır (maket v13 adım 3). */
export const SERVICE_MOVES_AT = 3;
export const serviceMoved = (areasOpen: number): boolean => areasOpen >= SERVICE_MOVES_AT;

/** ADIM 1-2 — ilk salonun SOL DUVARI. Bulaşık ocağın hemen yanında (D-025: "bulaşık ocağın yanında"). */
const PLACE_LEFT_WALL: ServicePlace = {
  areaIndex: 0,
  station: [-16.2, 0, 6.4],
  rot: Math.PI / 2,
  half: [0.5, 1.6],
  pickup: [-15.0, 0, 6.4],
  upgradeSpot: [-15.2, 0, 2.6],
  dish: [-16.2, 0, 10.6],
  dishRot: Math.PI / 2,
  dishHalf: [0.5, 1.0],
  waiterHome: [-14.4, 0, 8.6],
  dishwasherHome: [-14.4, 0, 12.6],
  staffWalk: { a: [-15.1, 0, 4.9], b: [-15.1, 0, 11.4], face: Math.PI / 2 },
};

/**
 * ADIM 3+ — ARKA BANDIN servis bloğu. Tezgâh bandın ÖNÜNDE, salona bakar; arkasında çaycının
 * çalıştığı koridor kalır (maket v13: "hazırlık arkada, semaver ve bardaklar müşterinin gördüğü
 * yerde"). Bandın kendisi (z < −9,8) yürünmez kütledir; arka duvar hattı z = −10,3'te.
 */
const PLACE_BACK_BAND: ServicePlace = {
  areaIndex: 2,
  /*
   * MUTFAK EŞYALARI MUTFAĞIN İÇİNDE (kullanıcı 2026-09-07: *"mutfak eşyaları şu an mutfak
   * dışında, onları da koy"*). BM adım 3'e kadar bant katı bir kütleydi, servis kümesi de
   * onun 1,2 br ÖNÜNDE salonun zemininde duruyordu (z = −8,6). Bant maketin odalarına dönünce
   * o küme mutfağın dışında kalmış oldu.
   * Küme 1,70 geri alındı: tezgâhın ÖN YÜZÜ artık tam bandın hattında (z = −9,8 = −10,3 + 0,5),
   * yani maketin kurgusu — *"semaver ve bardaklar müşterinin gördüğü yerde, hazırlık arkada"*.
   * ERİŞİM DEĞİŞMEDİ: hem tezgâh hem oyuncunun durabildiği en yakın nokta aynı miktarda kaydı,
   * aradaki 0,85 br sabit (`serving.pickupRadius` 1,6). Çaycının yürüme hattı da tezgâhın
   * ARKASINA, mutfağın içine geçti.
   */
  station: [-13.0, 0, -10.3],
  rot: 0,
  half: [1.6, 0.5],
  pickup: [-13.0, 0, -9.3],
  upgradeSpot: [-15.8, 0, -8.0],
  dish: [-7.4, 0, -10.3],
  dishRot: 0,
  dishHalf: [1.0, 0.5],
  /* BOŞTA BEKLEME NOKTALARI (B6a'da taşındı). Eski değerler (−11,0 / −7,2) ve (−5,6 / −7,2)
     şeridin KUZEY yüzünün yükseltme noktası sırasının (z = −7,3 · x = ∓11,7 · ∓8,5 · ∓5,3)
     üstüne düşüyordu: 1. garson masa 12'nin noktasına 0,71 br, bulaşıkçı ise x = −5,3'ünkine
     **0,32 br** kalıyordu — boşta bekleyen personel oyuncunun yükseltme işaretinin üstünde
     duruyordu (collision yok, tamamen görsel). Kuzey koridoru dar (stol sırası −6,75 ↔ tezgâh
     yüzü −8,1) ve işaret sırası tam ortasında; üç garson o koridora yan yana SIĞMIYOR.
     - Garsonlar adanın DIŞ ucundan (−12,3) sonraki batı cebine çekildi: tezgâhın batı ucunun
       yanı, hiçbir masası/sandalyesi olmayan 4,7 br'lik boşluk. Üçü de (∓0,7 ritmiyle) hem
       `waiter2` pad'inden hem servis yükseltme noktasından uzakta kalır.
     - Bulaşıkçı işinin (bulaşık modülü) önünde kaldı ama İKİ işaret sütununun ARASINA
       (x = −6,9) ve modülün ayak izinin dışına (z = −7,75) alındı.
     Bekçi: `tests/layout-b6a.test.ts` — personel bekleme noktaları AÇIK hiçbir masanın
     yükseltme noktasına 1,4 br'den yakın olamaz. */
  waiterHome: [-14.6, 0, -6.6],
  dishwasherHome: [-6.9, 0, -7.75],
  staffWalk: { a: [-14.6, 0, -11.3], b: [-11.4, 0, -11.3], face: 0 },
};

/**
 * GARSON SERVİS İSTASYONU (B3-2 — maket v13 adım 6: "tezgâhın sağ ucunda"). Sürahi, peçetelik,
 * temiz bardak istifi, uçta kirli bardak tepsisi. Servis bloğunun ön yüzünde, ana tezgâh ile
 * bulaşığın ARASINDAKİ boşluğa oturur (tezgâh x ∈ [−14,6, −11,4] · bulaşık x ∈ [−8,4, −6,4] →
 * aradaki 3,0 br'lik açıklığa 2,6 br'lik istasyon).
 *
 * B3-2'de **yalnız obje + collision**: garson tepsisini hâlâ ana tezgâhtan alır (kullanıcı kararı).
 * Uzak masaların yolunu kısaltan AKTARMA mekaniği oyun davranışını değiştirir ve kendi tempo
 * ölçümünü ister — o yüzden kendi adımında gelir, burada yalnız yeri tutuluyor.
 * Arka bant açılmadan (areasOpen < 3) ortada durmaz.
 */
export const WAITER_STATION = {
  pos: [-9.9, 0, -10.3] as Vec3, // tezgâhla AYNI hizada (BM adım 3: küme mutfağın içine geçti)
  half: [1.3, 0.5] as readonly [number, number],
  rot: 0,
} as const;

/** Garson servis istasyonu sahnede mi (servis arka banda taşındıktan sonra). */
export const waiterStationOpen = (areasOpen: number): boolean => serviceMoved(areasOpen);

/** Servis kümesinin O ANKİ yeri. Kat tek servisten döndüğü için index almaz (world.THE_SERVICE). */
export function servicePlace(areasOpen: number): ServicePlace {
  return serviceMoved(areasOpen) ? PLACE_BACK_BAND : PLACE_LEFT_WALL;
}

/** Servisin durduğu alan — o alan AÇIK olmak zorunda (yerleşim değişmezi; testli). */
export const servicePlaceArea = (areasOpen: number): number => servicePlace(areasOpen).areaIndex;

/**
 * PERSONELİN BOŞTA BEKLEME NOKTALARI — tek kaynak. `waiterHome` bir NOKTA değil bir SIRANIN
 * başıdır: i. garson ondan `WAITER_HOME_GAP` kadar doğuya durur. Bu ritim eskiden üç ayrı yerde
 * (tick'in garson döngüsü, tick'in türetme sistemi, store'un ilk kurulumu) elle yazılıydı; test
 * de aynı aritmetiği dördüncü kez yazmak zorunda kalıyordu. Yerleşim sorusunun cevabı burada
 * durur, çağıranlar okur.
 */
// D-076 notu: bu ritim `actorRadius`'a bağlı (testi öyle bekçiliyor). Kapsül gövdeler boyuna
// uzayıp enine şişmediği için yarıçap 0,28'de kaldı ve 0,7 yerinde durdu.
export const WAITER_HOME_GAP = 0.7;
export const waiterHomeAt = (place: ServicePlace, i: number): Vec3 => [
  place.waiterHome[0] + i * WAITER_HOME_GAP,
  0,
  place.waiterHome[2],
];

/** Havuz tamamen doluyken sahnede olabilecek TÜM personel bekleme noktaları (bekçi testi bunu tarar). */
export const staffIdleSpots = (place: ServicePlace): Vec3[] => [
  ...Array.from({ length: MAX_WAITERS }, (_, i) => waiterHomeAt(place, i)),
  [...place.dishwasherHome] as Vec3,
];

/**
 * TEK KAPI — maket v13: adım 1'de ilk salonun cephesinin ortasında (x = −8,5); **adım 2'de 2. Alan
 * açılınca binanın tam ortasına kayar** (x = 0), çünkü cephe artık 34 birim ve kapı bir çeyreğin
 * değil BİNANIN kapısıdır. Servis gibi bu da bir koordinat sorusu: sabit dizi değil `areasOpen`
 * fonksiyonu (`servicePlace` ile aynı desen).
 */
export const DOOR_MOVES_AT = 2;
export const doorX = (areasOpen: number): number => (areasOpen >= DOOR_MOVES_AT ? 0 : -8.5);
/** Kapının iç eşiği (müşteri önce buraya yürür). */
export const entranceAt = (areasOpen: number): Vec3 => [doorX(areasOpen), 0.6, 16.6];
/** Kapının dışı — müşterinin belirdiği kaldırım noktası. */
export const streetAt = (areasOpen: number): Vec3 => [doorX(areasOpen), 0.6, 20.5];

export const LAYOUT = {
  // Kapı KOORDİNATLARI `entranceAt/streetAt(areasOpen)`ten gelir; buradaki alanlar 1 alan açıkken
  // geçerli BAŞLANGIÇ değerleridir (oyuncunun doğduğu yer + park/test referansı).
  entrance: entranceAt(1),
  street: streetAt(1),
  player: [-8.5, 0.6, 13.4] as Vec3,
  // Oynanabilir alanın BİRLEŞİM kutusu (nav ızgarası bunun üstüne kurulur). Arka bant DIŞARIDA:
  // alanlar z = −9,8'de biter, bant yürünmez kütledir.
  area: { minX: -FLOOR_HALF, maxX: FLOOR_HALF, minZ: BAND.front, maxZ: FLOOR_HALF },
  areaBounds: AREA_RECTS.map((r) => ({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ })),
  // Masa slotları — GLOBAL 12 slot (alan a → [a*4, a*4+4)).
  tables: ALL_TABLES,
  // Pad pozisyonları: açtıkları objenin TAM yerinde. Alan pad'i o alanın eşiğinde, AÇIK tarafta.
  // Personel pad'leri servisin O ANKİ yerinin yanında durur: `waiter`/`dishwasher` sol-duvar
  // döneminde (1-2 alan), `waiter2`/`waiter3` arka-bant döneminde (3 alan) açılır — zincir sırası
  // bunu garanti eder (economy.config pad listesi), yerleşim ayrıca dallanmaz.
  padPos: {
    table2: ALL_TABLES[1].table,
    table3: ALL_TABLES[2].table,
    table4: ALL_TABLES[3].table,
    waiter: [-12.4, 0, 2.0] as Vec3,
    dishwasher: [-13.4, 0, 10.6] as Vec3,
    zone2: [-1.6, 0, 8.5] as Vec3,
    z2table2: ALL_TABLES[5].table,
    z2table3: ALL_TABLES[6].table,
    z2table4: ALL_TABLES[7].table,
    zone3: [2.0, 0, 1.8] as Vec3,
    // a2'nin masa pad'leri: alanın ilk slotu açılışla gelir, kalan 11'i pad'lerle (B5a).
    ...Object.fromEntries(
      Array.from({ length: areaTableSlots(2) - 1 }, (_, k) => [
        `z3table${k + 2}`,
        ALL_TABLES[areaTableStart(2) + k + 1].table,
      ]),
    ),
    // GARSON PAD'LERİ ŞERİDİN İKİ UCUNDA (B5a'da taşındı). B3-2'de bunlar bandın önündeki
    // koridora konmuştu ve o zaman doğruydu: şerit yalnız DIŞ sütunu (x = ∓11,7) taşıyordu, aradaki
    // 3,2 br'lik ritim boştu. B5a orta ve iç sütunları (∓8,5 · ∓5,3) açınca güney yüzlerinin
    // yükseltme noktaları tam o koridoru dolduruyor — waiter2 masa 13'ün noktasına **0,50 br**,
    // waiter3 masa 17'ninkine 1,77 br kalıyordu (ikisi de PAD_RADIUS + TABLE_UP_RADIUS = 2,3'ün
    // altında: oyuncu garson pad'ini doldurmak için durunca masayı da yükseltmeye başlıyordu).
    // Adaların DIŞ uçlarından (∓12,3) sonrası duvara kadar 4,7 br boş kalır; iki pad oraya çekildi:
    // batıda servis bloğunun önündeki personel şeridi, doğuda onun aynası.
    waiter2: [-14.7, 0, -5.0] as Vec3,
    waiter3: [14.7, 0, -5.0] as Vec3,
    // ODA (B4): lavabonun KAPISININ önünde. x = 13,4 tesadüf değil — şeridin dış sütununun
    // yükseltme noktası [11,7 · −7,3] ile arada 2,55 br kalsın diye (PAD_RADIUS + TABLE_UP_RADIUS
    // = 2,3): oyuncu lavaboyu doldururken masa 12'yi yükseltmeye başlamamalı. Oda açılınca bu pad
    // biter ve AYNI nokta lavabonun yükseltme noktası olur (LAVABO.spot) — obje-başı yükseltme.
    lavabo: LAVABO.spot,
  } as Record<string, Vec3>,
  // --- Collision footprint'leri (yarı-boyut [hx,hz]; D-016): GÖRSEL mesh'lere yaslı → oyuncu objeye
  // "değiyor gibi" sokulur, arada boşluk kalmaz. (ocak tezgah 2.2×0.8, bulaşık 1.4×0.8, masa r0.5, sandalye 0.42.)
  // BM adım 5 (D-076): iki yarıçap da AKTÖR BOYUNDAN türer (`src/config/actor.ts`) — gövde
  // 1,29 → 1,75'e çıkınca omuz genişliği de büyüdü, standoff eski gövdeye göre kalamazdı.
  playerRadius: PLAYER_RADIUS, // oyuncu gövde yarıçapı = standoff'u görsel kenara denk getirir (0,47)
  actorRadius: ACTOR_RADIUS, // garson/bulaşıkçı engel-kaçınma yarıçapı (0,28 — kapsül gövde enine büyümedi)
  // (B3-1: `stationHalf`/`stationHalves`/`dishHalf` KALKTI — servis footprint'i artık yerine
  //  bağlı: sol duvarda uzun kenar z'de, arka bantta x'te. `servicePlace(areasOpen).half`.)
  // BM adım 2 (D-073): iki mobilya dili, iki footprint. Dörtlü ÇAY masası maketin `teaTable`'ı
  // (1,75 → yarı 0,875); şeridin İKİLİ kafe masası `cafeTable2` (1,00 → yarı 0,50).
  tableHalf: [0.84, 0.84] as [number, number], // dörtlü (four) — kare 1,68; REACH_TABLE bundan türer
  deuceHalf: [0.525, 0.525] as [number, number], // ikili (deuce) — kare 1,05 (L3+); banket adasının masası
  // D-076: bu footprint TABURENİN kendisidir, oturan kişinin DEĞİL. (Eski yorum "+ oturan müşteri"
  // diyordu ve gövde büyüyünce buranın da büyümesi gerekirmiş gibi okunuyordu.) Oyunda hiçbir
  // AKTÖR collision katısı değil — NPC'ler birbirinden de geçer; katı olan MOBİLYADIR. Oturan
  // müşterinin üst gövdesi taburenin dışına taşar, yanından geçen garson ona değmiş görünür:
  // greybox'ta kabul (gerçek oturuş pozu Faz 6'da skinned modelle gelir).
  chairHalf: [0.3, 0.3] as [number, number], // tabure gövdesi (maket yarıçapı 0,27 + pay)
  // Sandalye ofsetleri (Y2 tek kaynak): Tables.tsx görsel sandalyeyi, store koltuk pozisyonunu
  // (ALL_TABLES.seats) AYNI listeden türetir — görsel sandalye = oturulabilir koltuk.
  chairSpots: CHAIR_SPOTS,
  // (B6a) `LAYOUT.decor` KALKTI. Çöp kovaları ve saksılar burada, eski 21 × 21 katın
  // koordinatlarıyla duruyordu ve kat 34 × 34'e büyüyünce kimse taşımamıştı. Yeni yeri
  // **`src/config/decor.ts`** — dekorun geometriyle tek ortak yanı koordinat sistemi olması;
  // collision'ı, nav'ı, kaydı yok. Ayrıldığı için artık A/B'de tek dosya değiştirilebiliyor
  // (D-068 §3) ve `layout.ts` yalnız YÜRÜNEN dünyayı anlatıyor.
} as const;

/** Collision engeli: merkez (Vec3) + yarı-boyut [hx,hz]. */
export interface Solid {
  c: RVec3;
  h: readonly [number, number];
}

// Sıra-arası duvar KALDIRILDI (2026-06-11 kullanıcı: "alan 2 ile alan 3 arasında duvar olmasın") —
// a1↔a2 sınırı artık a0↔a1 gibi tamamen açık (D-023 tek-salon deseni dikey komşuya da uygulanır).
// Kilitli alan blokajı lockedAreaSolids + clampToOpenAreas'ta sürer.

/** Servisin durduğu alan açıksa servis de açıktır. Servis kat açıldığı andan itibaren vardır ve
 *  taşındığı alan (a2) ancak areasOpen ≥ 3 iken hedeflenir → koşul "en az bir alan açık"a iner. */
export const openServices = (areasOpen: number): number[] => (areasOpen > 0 ? [...SERVICES] : []);

/** Servis o an bu alanda mı DURUYOR? (YERLEŞİM sorusu — world.serviceOfTable ÜRETİM sorusudur.)
 *  Durmuyorsa −1. B3-1'de cevap `areasOpen`'a bağlı: 3. Alan açılınca servis arka banda taşınır. */
export const serviceInArea = (area: number, areasOpen: number): number =>
  servicePlace(areasOpen).areaIndex === area ? THE_SERVICE : -1;

/** KİLİTLİ alanlar nav için BLOKE (M2): müşteri/personel rotası "boş arsa"dan geçemez
 *  (duvarlar yalnız açık alanları sardığından grid'e ayrıca anlatmak gerekir). Arka-sol REZERV
 *  hücre (alansız arsa, 2026-06-11) DAİMA bloke — rota oradan kestirme yapamaz. */
export function lockedAreaSolids(areasOpen: number): Solid[] {
  const solids: Solid[] = [];
  for (let a = areasOpen; a < MAX_AREAS; a++) {
    const ab = LAYOUT.areaBounds[a];
    solids.push({
      c: [(ab.minX + ab.maxX) / 2, 0, (ab.minZ + ab.maxZ) / 2],
      h: [(ab.maxX - ab.minX) / 2, (ab.maxZ - ab.minZ) / 2],
    });
  }
  // B3-1: eski 2×2 ızgaranın "rezerv arka-sol arsa"sı KALKTI — arka yarı tek alandır (a2), boş
  // hücre yok. Bandın kendisi zaten LAYOUT.area'nın dışında, ayrıca bloke edilmesi gerekmez.
  return solids;
}

/** Masanın footprint yarısı — TİPE bağlı (D-073): dörtlü çay masası 1,75, ikili kafe masası 1,00.
 *  Tip masanın global indeksinden (alanın planından) türer, ayrı bir alan tutulmaz. */
const tableHalfFor = (i: number): readonly [number, number] =>
  LAYOUT.tables[i].kind === 'deuce' ? LAYOUT.deuceHalf : LAYOUT.tableHalf;

/** O an SAHNEDE var olan SABİT katı engeller (açık servislerin ocak+bulaşığı; açık masalar +
 *  sandalyeler). Yatay bölme duvarı YOK (D-023). Kapalı alanın mobilyası ÇİZİLMEZ → collision da
 *  eklenmez (oyuncu zaten açık alanların birleşimine kelepçeli). */
export function activeSolids(tables: number, areasOpen: number): Solid[] {
  const solids: Solid[] = [];
  if (openServices(areasOpen).length > 0) {
    const sp = servicePlace(areasOpen);
    solids.push({ c: sp.station, h: sp.half });
    solids.push({ c: sp.dish, h: sp.dishHalf });
  }
  if (waiterStationOpen(areasOpen)) solids.push({ c: WAITER_STATION.pos, h: WAITER_STATION.half });
  for (const b of banketIslands(tables)) solids.push({ c: b.center, h: b.half });
  for (let i = 0; i < tables; i++) {
    solids.push({ c: LAYOUT.tables[i].table, h: tableHalfFor(i) });
    solids.push({ c: LAYOUT.tables[i].seat, h: LAYOUT.chairHalf }); // sandalye (içine girilemez)
  }
  return solids;
}

/** Oyuncuyu AÇIK alanların BİRLEŞİMİNE kelepçele (M2): nokta hiçbir açık alanda değilse en yakın
 *  açık-alan-içi noktaya çekilir. 3 alan açıkken L-şekli doğru çalışır (eski tek-eksen openMaxX
 *  kelepçesi 2×2 ızgarada yetmiyordu). */
export function clampToOpenAreas(x: number, z: number, areasOpen: number): [number, number] {
  let bestX = x;
  let bestZ = z;
  let bestD = Infinity;
  for (let a = 0; a < areasOpen; a++) {
    const ab = LAYOUT.areaBounds[a];
    const cx = Math.max(ab.minX, Math.min(ab.maxX, x));
    const cz = Math.max(ab.minZ, Math.min(ab.maxZ, z));
    const d = (cx - x) * (cx - x) + (cz - z) * (cz - z);
    if (d === 0) return [x, z];
    if (d < bestD) {
      bestD = d;
      bestX = cx;
      bestZ = cz;
    }
  }
  return [bestX, bestZ];
}

/** Yalnız açık masa GÖVDELERİ — personel (garson/bulaşıkçı) bunların ETRAFINDAN dolaşır (ocak/bulaşık/
 *  koltuk hariç: personel onlara erişmeli). */
export function tableSolids(tables: number): Solid[] {
  const solids: Solid[] = [];
  for (let i = 0; i < tables; i++) solids.push({ c: LAYOUT.tables[i].table, h: tableHalfFor(i) });
  for (const b of banketIslands(tables)) solids.push({ c: b.center, h: b.half });
  return solids;
}

/** (x,z) noktası (yarıçap r şişirilmiş) herhangi bir katı engelin içinde mi? */
export function hitsSolid(x: number, z: number, solids: Solid[], r: number): boolean {
  for (const s of solids) {
    if (Math.abs(x - s.c[0]) < s.h[0] + r && Math.abs(z - s.c[2]) < s.h[1] + r) return true;
  }
  return false;
}

// --- Personel yol bulma (nav.ts) ---
// Garson/bulaşıkçı GERÇEK rota izler (BFS) → eski moveAvoid eksen-kayması bir masayı dolaşamayıp
// kilitleniyordu (ön masada takılı kalma, arka masa açlığı, salınım). Oyuncu BUNU KULLANMAZ.
// Personel "yanına varınca teslim/al" mesafeleri (GEOMETRİK: footprint yarısı + aktör yarıçapı + küçük pay).
// Masaya BİTİŞİK teslim → "tam masaya gelmeden veriyor" hissi biter (eski serveRadius 1.6 yerine ~1.05).
// Izgara hücre boyu (dünya birimi) — masalar arası koridorları açık tutar. REACH_TABLE bununla
// BAĞLIDIR: aşağıya bak.
export const NAV_CELL = 0.3;

/**
 * Masaya teslim mesafesi. **Izgara hücre boyuna BAĞLIDIR** ve bu bağ B3-1'de bulundu:
 * BFS ızgarası masanın footprint'ini `tableHalf + actorRadius` kadar şişirir, üstüne bir de hücre
 * yuvarlaması biner. Eski değer (0,5 + 0,28 + 0,25 = 1,03) bu yuvarlamayı hesaba katmıyordu; masa
 * koordinatları ızgaraya denk düştüğünde en yakın BOŞ hücre 1,1 br'ye kayıyor ve BFS "yol yok"
 * diyordu. Oyun o zaman `navStep`'in düz-çizgi yedeğine düşüyordu — yani garson masaya varıyordu
 * ama ENGELDEN KAÇMADAN. Kusur eski yerleşimde de vardı, yalnızca masa koordinatları şans eseri
 * ızgaraya denk düşmediği için görünmüyordu (34 × 34'e taşınınca a2 sırası tam hücre merkezine
 * oturdu ve ortaya çıktı — `layout-b31.test.ts` "ROTA" testi bunu kalıcı olarak bekçiliyor).
 * Bedeli: garson masanın kenarına 0,53 yerine 0,63 br kalıyor (10 cm) — düz-çizgi yedeğine
 * düşmemenin karşılığında kabul edildi.
 */
export const REACH_TABLE = LAYOUT.tableHalf[0] + LAYOUT.actorRadius + NAV_CELL + 0.05;
// Tepsi yükleme: ocağın ÖN yüzündeki pickup noktasına varış (2026-06-11: merkez+geniş yarıçap
// arka çaycı koridorunu da kabul ediyordu → garson arkadan çay alıyordu; bardaklar ÖNDE).
export const REACH_PICKUP = 0.45;
/** Bulaşıkta yıkama mesafesi — leğenin O ANKİ footprint'inden türer (sol duvarda uzun kenar z'de,
 *  arka bantta x'te; ikisinde de "leğenin önüne varınca" demek). */
export const reachWash = (areasOpen: number): number => {
  const h = servicePlace(areasOpen).dishHalf;
  return Math.max(h[0], h[1]) + LAYOUT.actorRadius + 0.4;
};
export const REACH_HOME = 0.4; // boştayken köşeye dönüş

/** Personelin GÖVDE engeli saydığı katılar (açık servislerin ocak+bulaşığı + açık masalar). */
export function navSolids(tables: number, areasOpen: number): NavSolid[] {
  const solids: NavSolid[] = [];
  if (openServices(areasOpen).length > 0) {
    const sp = servicePlace(areasOpen);
    solids.push({ c: sp.station, h: sp.half });
    solids.push({ c: sp.dish, h: sp.dishHalf });
  }
  if (waiterStationOpen(areasOpen)) solids.push({ c: WAITER_STATION.pos, h: WAITER_STATION.half });
  for (const b of banketIslands(tables)) solids.push({ c: b.center, h: b.half });
  for (let i = 0; i < tables; i++) solids.push({ c: LAYOUT.tables[i].table, h: tableHalfFor(i) });
  // Kilitli alanlar + rezerv arsa rota dışı (sıra-arası duvar 2026-06-11'de kaldırıldı).
  solids.push(...lockedAreaSolids(areasOpen));
  return solids;
}

// Izgara masa+alan sayısına göre cache'lenir (masa/alan açılınca yeniden kurulur; her frame değil).
let navCache: { key: string; grid: NavGrid } | null = null;
let playerNavCache: { key: string; grid: NavGrid } | null = null;
export function getNavGrid(tables: number, areasOpen: number): NavGrid {
  const key = `${tables}|${areasOpen}`;
  if (navCache && navCache.key === key) return navCache.grid;
  const grid = buildNavGrid(LAYOUT.area, NAV_CELL, navSolids(tables, areasOpen), LAYOUT.actorRadius);
  navCache = { key, grid };
  return grid;
}

/**
 * OYUNCUNUN DÜNYASI — personelinkiyle AYNI ızgara, FARKLI kurallar (D-091).
 *
 * NEDEN AYRI: `getNavGrid` personelin dünyasını kurar — katılar `navSolids` (sandalyesiz),
 * şişirme `actorRadius` (0,28), alan kelepçesi yok. Oyuncu ise `activeSolids` ile (sandalyeler
 * KATI), `playerRadius` (0,47) ile ve `clampToOpenAreas` kelepçesiyle yürür. Yani personelin
 * geçtiği boşluktan oyuncu geçemeyebilir ve BU FARK ÖLÇÜLDÜ (`docs/nav-oyuncu-raporu-d5.md`):
 * dolu katta rotaların **%74,1'i** oyuncuya kapalı en az bir ara noktadan geçiyor, ara
 * noktaların %14,4'ü kapalı hücre. Oyuncu adına personelin ızgarasında rota kurmak, oyuncunun
 * içine giremeyeceği hücrelerden geçen bir yol vermektir; izleyen aktör masaya dayanıp iter.
 *
 * NEDEN DÜNYALARI BİRLEŞTİRMEK DEĞİL: personel masaya ERİŞMEK zorunda; `REACH_TABLE` ve yerleşim
 * testleri `actorRadius`'a çivili, 0,47'ye şişirmek servis koridorlarını kapatır. Ölçüm bunu
 * gereksiz de kılıyor: oyuncunun kendi dünyasında her hedefe yol VAR ve yalnız ×1,069 daha uzun.
 *
 * KİMİN İŞİ DEĞİL: oyuncunun KARE-İÇİ hareketi (`playerMoveSystem`) — o eksen-başı kaymadır ve
 * ızgara kullanmaz. Bu ızgara ROTA soranlar içindir (sim botu, bekçi testi, ileride yol gösterme
 * / oto-yürüme). İkisi aynı katılardan türer: tek doğru kaynak `activeSolids` + `playerRadius`.
 */
export function getPlayerNavGrid(tables: number, areasOpen: number): NavGrid {
  const key = `${tables}|${areasOpen}`;
  if (playerNavCache && playerNavCache.key === key) return playerNavCache.grid;
  const grid = buildNavGrid(LAYOUT.area, NAV_CELL, activeSolids(tables, areasOpen), LAYOUT.playerRadius);
  // AÇIK ALAN KELEPÇESİ: oyuncu `clampToOpenAreas` ile açık alanların birleşimine kapalıdır —
  // personel değildir. Kelepçe ızgaraya anlatılmazsa rota kilitli arsadan kestirme yapar.
  for (let r = 0; r < grid.rows; r++) {
    const z = grid.minZ + (r + 0.5) * grid.cell;
    for (let c = 0; c < grid.cols; c++) {
      const x = grid.minX + (c + 0.5) * grid.cell;
      const [cx, cz] = clampToOpenAreas(x, z, areasOpen);
      if (cx !== x || cz !== z) grid.blocked[r * grid.cols + c] = 1;
    }
  }
  playerNavCache = { key, grid };
  return grid;
}

/** Personeli hedefe BFS rotasıyla bir adım ilerlet; merkeze `reach` mesafesine girince true. pos yerinde değişir.
 *  `avoid` verilirse (oyuncu konumu) personel onun ÜSTÜNE BİNMEZ → kenarından ayrılır (oyuncuya göre hareket eder);
 *  `avoidSolids` (masa gövdeleri) verilirse oyuncudan kaçarken masaya itilmez. */
export function navStep(
  pos: Vec3,
  target: RVec3,
  step: number,
  grid: NavGrid,
  reach: number,
  avoid?: RVec3,
  avoidSolids?: Solid[],
): boolean {
  if (dist2D(pos, target) <= reach) return true;
  const path = findNavPath(grid, pos, target[0], target[2], reach);
  if (path && path.length > 0) {
    moveToward(pos, [path[0][0], pos[1], path[0][1]], step); // bir sonraki waypoint'e
  } else {
    moveToward(pos, target, step); // yol yoksa (nadir) en iyi çaba: doğrudan
  }
  // Oyuncudan ayrış (boids separation): personel oyuncunun ÜSTÜNE binmesin → onu da hesaba katarak kenara geçsin.
  // Oyuncu otoriter (input'la hareket); personel ona yer açar. Masaya itecekse itme (hafif örtüşmeye izin ver).
  if (avoid) {
    const minD = LAYOUT.actorRadius + LAYOUT.playerRadius;
    const dx = pos[0] - avoid[0];
    const dz = pos[2] - avoid[2];
    const d = Math.hypot(dx, dz);
    if (d < minD) {
      const ux = d < 1e-4 ? 1 : dx / d;
      const uz = d < 1e-4 ? 0 : dz / d;
      const nx = avoid[0] + ux * minD;
      const nz = avoid[2] + uz * minD;
      if (!avoidSolids || !hitsSolid(nx, nz, avoidSolids, LAYOUT.actorRadius)) {
        pos[0] = nx;
        pos[2] = nz;
      }
    }
  }
  return dist2D(pos, target) <= reach;
}

/**
 * Bir karede oyuncunun HİÇBİR mekanizmayı tetiklemediği "park noktası" — YERLEŞİMDEN TÜRETİLİR.
 *
 * Faz A3: testler ve duman testi eskiden `[0, 0.6, 6.5]` gibi ELLE yazılmış köşelere park ediyordu;
 * yerleşim değişince (Faz B) bu noktalar sessizce bir masanın/pad'in üstüne düşer ve testler
 * "kimse servis etmiyor" derken aslında servis ediyor olurdu. Burada nokta hesaplanır: açık
 * açık alanlar taranır, KATI engellere girmeyen ve tüm etkileşim noktalarına (ocak, bulaşık,
 * masa+koltuk, pad, yükseltme noktası, kapı) uzaklığı EN BÜYÜK olan hücre seçilir.
 *
 * `minClearance(areasOpen)` seçilen noktanın en yakın etkileşime uzaklığını verir → test bunun
 * yeterli olduğunu doğrular; yerleşim daralırsa test SESSİZCE değil, GÜRÜLTÜYLE düşer.
 */
function interactionPoints(areasOpen: number, tables: number): RVec3[] {
  const pts: RVec3[] = [entranceAt(areasOpen)];
  if (openServices(areasOpen).length > 0) {
    const sp = servicePlace(areasOpen);
    pts.push(sp.station, sp.pickup, sp.dish, sp.upgradeSpot);
  }
  for (let i = 0; i < tables; i++) {
    pts.push(LAYOUT.tables[i].table, LAYOUT.tables[i].seat, LAYOUT.tables[i].upgradeSpot);
  }
  for (const p of Object.values(LAYOUT.padPos)) pts.push(p);
  return pts;
}

function scanParkSpot(areasOpen: number, tables: number, onlyArea?: number): { pos: Vec3; clearance: number } {
  const pts = interactionPoints(areasOpen, tables);
  const solids = activeSolids(tables, areasOpen);
  const step = 0.25;
  let best: Vec3 = [0, 0.6, 0];
  let bestD = -1;
  for (let a = 0; a < areasOpen; a++) {
    if (onlyArea != null && a !== onlyArea) continue;
    const ab = LAYOUT.areaBounds[a];
    for (let x = ab.minX + step; x < ab.maxX; x += step) {
      for (let zz = ab.minZ + step; zz < ab.maxZ; zz += step) {
        if (hitsSolid(x, zz, solids, LAYOUT.playerRadius)) continue;
        let d = Infinity;
        for (const p of pts) d = Math.min(d, Math.hypot(x - p[0], zz - p[2]));
        if (d > bestD) {
          bestD = d;
          best = [+x.toFixed(3), 0.6, +zz.toFixed(3)];
        }
      }
    }
  }
  return { pos: best, clearance: bestD };
}

const parkCache = new Map<string, { pos: Vec3; clearance: number }>();
function parkScan(areasOpen: number, tables: number, onlyArea?: number) {
  const key = `${areasOpen}|${tables}|${onlyArea ?? '*'}`;
  let hit = parkCache.get(key);
  if (!hit) {
    hit = scanParkSpot(areasOpen, tables, onlyArea);
    parkCache.set(key, hit);
  }
  return hit;
}

/** Açık alanlarda hiçbir mekanizmayı tetiklemeyen park noktası (test/duman kancası).
 *  `onlyArea` verilirse yalnız o alanın içinde aranır (alan sınırı testleri). */
export function parkSpot(areasOpen = 1, tables = 4, onlyArea?: number): Vec3 {
  return [...parkScan(areasOpen, tables, onlyArea).pos] as Vec3;
}

/** Park noktasının en yakın etkileşim noktasına uzaklığı (yerleşim daralırsa test bunu yakalar). */
export function parkClearance(areasOpen = 1, tables = 4, onlyArea?: number): number {
  return parkScan(areasOpen, tables, onlyArea).clearance;
}
