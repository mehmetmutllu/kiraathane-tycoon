/**
 * layout.ts — SAHNE GEOMETRİSİ: yerleşim (LAYOUT), collision katıları ve personel yol bulma.
 *
 * Faz A2'de store.ts'ten ayrıldı: burada oyun DURUMU yok, yalnız koordinat/geometri var
 * (sabitler + saf fonksiyonlar). Böylece tick sistemleri (tick.ts) store'a bağlanmadan
 * yerleşimi kullanabilir; store.ts bu modülü yeniden dışa aktarır (eski importlar çalışır).
 */
import type { Vec3 } from './types';
import {
  MAX_AREAS,
  MAX_SERVICES,
  SERVICE_AREAS,
  serviceOfTable,
  serviceProduct,
} from './world';
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
// Her pad, açtığı/etkilediği objenin TAM yerinde durur (mekânsal tycoon).
// FAZ 2 REDESIGN v6 (D-017 §1, kullanıcı feedback 2026-06-07: "tek noktada çay-al+servis yapılıyor, yürüme
// döngüsü yok"): MUTFAK ARKA DUVARDA KÜME (ocak+bulaşık+semaver bitişik, AYRILMAZ); MASALAR ÖNE UZAK 2×2 →
// her masa↔ocak mesafesi >2R=3.2 (ön sıra ~4.9, hedef ~5) → tek noktada "çay-al+servis" veya "kirli-al+yıka"
// İMKÂNSIZ, yürüme döngüsü ZORLANIR. Orta geniş koridor (kolon ±2.4, gap 4.8). Collision: oyuncu mobilya+
// sandalye+aktör (HAPSETMEZ); garson/bulaşıkçı masa gövdelerinden GERÇEK rota ile dolaşır (nav.ts BFS).
// --- ALAN ŞABLONU (Faz 3a + D-022): 1. alanın iç yerleşimi = bugüne kadarki mutlak koordinatlar.
// Faz B1: düz diziler artık hangi kavrama ait olduğunu SÖYLER — ALANA göre index'lenenler
// (areaBounds, entrances, tables) ile SERVİSE göre index'lenenler (stations, dishStations,
// stationPickups, waiterHomes, stationUpgradeSpots) ayrıdır. Bugün ikisi 1:1; B2'de servis
// tekilleşince yalnız SERVICE_AREAS listesi değişir, buradaki diziler kendiliğinden takip eder.
// Kullanıcı feedback (2026-06-11): bölme duvarı kalkınca iki salon arasında ölü boşluk kaldı →
// alanlar bitişik (1. alanın maxX'i = 2. alanın minX'i = 5.3; duvar YOK, sınır zemin çizgisi).
// --- YERLEŞİM v3 (2026-06-11 kullanıcı feedback'i, D-025): ALAN-BAŞI MUTFAK + AYNALI ŞABLON.
// Şikayetler: (a) çay ocağı + bulaşık tek köşede küme; (b) 2. alanın servisi sol şeritten → garson
// turu ~19sn > sabır 18sn (müşteri kalkar); (c) yükseltme pad alanı dar; (d) masa pad'leri ocağa
// giriyor; (e) ekran alt duvara yakın, üstler boş. Çözüm: HER alanın çay ocağı KENDİ yan duvarında
// (a0 sol / a1 sağ = şablonun alan merkezine göre AYNALISI), bulaşık ARKA duvarda (ocaktan ayrı),
// masalar sağa+yukarı kaydı, masa pad'leri masanın kapı-tarafı ÇAPRAZINDA (ocak tarafında değil).
// Garson/bulaşıkçı turu artık alandan bağımsız kısa (a1 ocak→en uzak masa ≈ 8.8 br ≈ a0 ile aynı).
const AREA_DX = 10.6;
// M2 (2026-06-12, onaylı plan): kat 2×2 IZGARA. Revizyon (2026-06-11 kullanıcı): z2 (TOST)
// arka-SAĞA taşındı; arka-sol hücre REZERV arsa (alan yok — içerik sonra tasarlanacak).
// a0 ön-sol, a1 ön-sağ, a2 arka-sağ. Arka sıra ön sıranın −z tarafına AREA_DZ kadar kaydırılır.
export const AREA_DZ = 10.3; // sıra derinliği (alan z: -5.3..5.0)
/** Alanın ızgara kolonu (0 sol / 1 sağ) ve sırası (0 ön / 1 arka). */
export const areaCol = (z: number) => (z < 2 ? z : 1);
export const areaRow = (z: number) => (z < 2 ? 0 : 1);
/** (col,row) hücresindeki alan index'i; alan yoksa -1 (arka-sol = rezerv arsa). */
export const areaAt = (col: number, row: number) => {
  for (let z = 0; z < MAX_AREAS; z++) if (areaCol(z) === col && areaRow(z) === row) return z;
  return -1;
};
const AREAS = Array.from({ length: MAX_AREAS }, (_, a) => a);
const SERVICES = Array.from({ length: MAX_SERVICES }, (_, s) => s);
/** Servisin durduğu alan — servis dizilerini alan şablonuna bağlayan TEK yer (B1 ayrışması). */
const svcArea = (s: number) => SERVICE_AREAS[s] ?? 0;
// Alan a için şablon noktası: tek kolonlar alan merkezine göre x-AYNALI (mutfak kendi yan duvarında
// kalır), arka sıra −AREA_DZ kaydırılır (şablon yan-duvar temelli olduğundan rotasyon gerekmez).
const mir = (z: number, v: readonly [number, number, number]): Vec3 => [
  areaCol(z) ? AREA_DX - v[0] : v[0],
  v[1],
  v[2] - areaRow(z) * AREA_DZ,
];
/** Alan-yerel şablon noktasını dünyaya çevir (Scene görselleri için dışa açık). */
export const areaPoint = mir;


// Masa şablonu (alan-yerel): 2×2, sağa+yukarı kaymış (kolonlar -1.4/3.7, sıralar 2.55/-0.95).
// Koltuklar CHAIR_SPOTS/FOOD_CHAIR_SPOTS ofsetlerinden türetilir (Y2); upgradeSpot = kapı-tarafı
// çapraz köşe (orta koridora bakar; ocak/bulaşık tarafına TAŞMAZ; dwell hareketsiz-dolum olduğundan
// koridordan yürüyerek geçmek para çekmez).
// Açılış sırası ÖN sıradan (kapıya yakın, ocağa uzak — başlangıç masası ocaktan >4 br: yürüme
// döngüsü en baştan zorlanır, D-017 §1) → arka sıra sonra açılır.
// Ferahlama (turu-5 m.12, kamera-map-plan B): kolon aralığı 4.4→5.1 (net koridor ~1.5→2.2),
// sıra aralığı 2.9→3.5 (net koridor 0.0→~0.6 — dikey aradan artık yürünebilir). Alan SABİT.
// Sol kolon −1.6 yerine −1.4: arka-sol masa ocağın çay-al+servis dairesi birleşiğinin DIŞINDA
// kalmalı (>3.2 br; −1.6'da 3.00'a düşüyordu, şimdi 3.33). Açılım öne (+z) verildi.
const BASE_TABLES = [
  { table: [-1.4, 0, 2.55], upgradeSpot: [-0.2, 0, 3.75] },
  { table: [3.7, 0, 2.55], upgradeSpot: [2.5, 0, 3.75] },
  { table: [-1.4, 0, -0.95], upgradeSpot: [-0.2, 0, 0.25] },
  { table: [3.7, 0, -0.95], upgradeSpot: [2.5, 0, 0.25] },
] as const;

// Sandalye yerleşimi (masaya göre DÜNYA-ofseti; aynalanmaz — Tables.tsx aynı listeden çizer, Y2 tek kaynak).
// İlk spot = ana oturma yeri (eski .seat); koltuk doluluğu spot sırasıyla dolar.
// Çay masası: 4 yana tabure (S, N, E, W). Yemek masası (Y1): dikdörtgenin uzun kenarlarında
// 2'ye 2 KARŞILIKLI sandalye (G-batı, K-batı, G-doğu, K-doğu) — 2 koltukta karşılıklı çift oturur.
const CHAIR_SPOTS: readonly [number, number][] = [
  [0, 0.78],
  [0, -0.78],
  [0.78, 0],
  [-0.78, 0],
];
const FOOD_CHAIR_SPOTS: readonly [number, number][] = [
  [-0.35, 0.78],
  [-0.35, -0.78],
  [0.35, 0.78],
  [0.35, -0.78],
];

const ALL_TABLES = AREAS.flatMap((a) =>
  BASE_TABLES.map((t, k) => {
    const table = mir(a, t.table);
    // Y2: koltuk POZİSYONLARI spot listesinden türetilir; seats[0] eski .seat ile birebir aynı
    // (çay [0,0.78]; yemek Y1'in x−0.35 G-batı sandalyesi). Masanın TİPİ, ona servis veren
    // noktanın ürününden gelir (B5'te masa tipi masanın kendi özelliği olur).
    const spots =
      serviceProduct(serviceOfTable(a * BASE_TABLES.length + k)) === 'tost' ? FOOD_CHAIR_SPOTS : CHAIR_SPOTS;
    const seats = spots.map(([sx, sz]) => [table[0] + sx, 0.6, table[2] + sz] as Vec3);
    return {
      table,
      seat: seats[0],
      seats,
      upgradeSpot: mir(a, t.upgradeSpot),
    };
  }),
);

// Y1 (yemek alanı kimliği, docs/yemek-alani-garson-plan.md §4.1): TOST servisinin (servis 2) tezgâhı
// yan duvarda değil ARKA duvara paralel "counter" — önü güneye (salona) bakar. Pickup/garson-evi/
// yükseltme noktaları tezgâhla birlikte döner (yan-duvar şablonuyla AYNI göreli geometri: pickup ön
// yüzde +0.85, garson evi pickup'tan 0.9 duvar-boyu, yükseltme pad'i tezgâhtan 2.0 duvar-boyu kapı
// tarafında — pad↔pickup ayrımı [≥pickupRadius+0.3] vitest'te tüm servisler için doğrulanır).
const FOOD_SERVICE = 2;
const FOOD_STATION: Vec3 = [10.6, 0, -14.65];

export const LAYOUT = {
  // DÜNYA v2 (2026-06-11, kullanıcı tarifi; feedback-2026-06-11.md §G + D-023): duvarsız TEK SALON,
  // TEK KAPI (ön duvar, 1. alanın ortası), mutfak = SOL DUVARDA L-ŞERİDİ (ocak modülleri sol duvara
  // paralel, alan açıldıkça şerit öne uzar; bulaşık modülleri arka duvar dibinde L'nin kısa kolu).
  // SERVİS mekaniği (stations[s]/dishStations[s]/personel) AYNEN korunur — yalnız FİZİKSEL konum
  // şeride taşındı. TÜM müşteriler tek kapıdan girer/çıkar (entrances/streets ALANA göre index'li).
  entrances: AREAS.map(() => [0, 0.6, 4.8] as Vec3),
  streets: AREAS.map(() => [0, 0.6, 8.0] as Vec3),
  entrance: [0, 0.6, 4.8] as Vec3, // alias (testler/eski kod)
  street: [0, 0.6, 8.0] as Vec3,
  player: [0, 0.6, 1.5] as Vec3,
  // --- SERVİSE göre index'li diziler (ocak/bulaşık/personel/pickup/yükseltme) ---
  // Ocak modülleri (D-025 alan-başı mutfak): sol kolon SOL duvarda, sağ kolon SAĞ duvarda (aynalı);
  // arka sıra aynı şablonun −z kopyası. Arkada çaycı koridoru (~0.55) her alanda korunur.
  stations: SERVICES.map((s) => (s === FOOD_SERVICE ? FOOD_STATION : mir(svcArea(s), [-4.35, 0, -2.5]))),
  // Modül dönüşü: ön yüz salona bakar (sol kolon +x → +90°; sağ kolon −x → −90°).
  // Y1: tost tezgâhı arka duvarda → dönüşü 0 (ön yüz +z = güney).
  stationRots: SERVICES.map((s) => (s === FOOD_SERVICE ? 0 : areaCol(svcArea(s)) ? -Math.PI / 2 : Math.PI / 2)),
  // Bulaşık modülü Y1'de YERİNDE kaldı (kendi yan duvarında) → dönüşü istasyondan bağımsız.
  dishRots: SERVICES.map((s) => (areaCol(svcArea(s)) ? -Math.PI / 2 : Math.PI / 2)),
  // Oynanabilir alanın tamamı: 2×2 ızgara (tek bina). Oyuncu AÇIK alanların BİRLEŞİMİNE
  // kelepçelenir (tick — L-şekil destekli union kelepçesi, M2).
  area: { minX: -5.3, maxX: 5.3 + AREA_DX, minZ: -5.3 - AREA_DZ, maxZ: 5.0 },
  // --- ALANA göre index'li diziler ---
  // Alan başına sınırlar (zemin/duvar/kamera + kilitli "boş arsa" için).
  areaBounds: AREAS.map((a) => ({
    minX: -5.3 + areaCol(a) * AREA_DX,
    maxX: 5.3 + areaCol(a) * AREA_DX,
    minZ: -5.3 - areaRow(a) * AREA_DZ,
    maxZ: 5.0 - areaRow(a) * AREA_DZ,
  })),
  // 1. | 2. alan sınır çizgisi (görsel; DUVAR YOK — D-023). Alanlar bitişik → sınır = ortak kenar.
  areaBorderX: 5.3,
  // Masa slotları — GLOBAL 12 slot (alan a → [a*4, a*4+4)); alan içi 2×2 düzen değişmedi (D-017 §1).
  tables: ALL_TABLES,
  // Pad pozisyonları: açtıkları objenin yerinde. Alan pad'i alan sınır çizgisinin ortasında.
  padPos: {
    table2: ALL_TABLES[1].table,
    table3: ALL_TABLES[2].table,
    table4: ALL_TABLES[3].table,
    // Sol duvarda, çay-yükseltme noktasının altında (2026-06-11: çay pad'i ocağın altına taşındı,
    // dolum daireleri kesişmesin diye garson pad'i güneye kaydı: ayrım 2.71 > 2×PAD_RADIUS 2.6).
    waiter: [-4.6, 0, 2.2] as Vec3,
    // Bulaşıkçı pad'i: mutfak bloğunun arka köşesi açıklığında (çay pad'iyle dolum daireleri
    // KESİŞMEZ: ayrım 3.28 > 2×PAD_RADIUS 2.6 — "pad'ler sık olmasın" isteği).
    dishwasher: [0.2, 0, -4.5] as Vec3,
    // Alan sınırının HEMEN 1. alan tarafında (2026-06-11: kilitli salon TAM karanlık örtülü —
    // pad halkası/etiketi karanlığa taşmasın diye eşikten ~0.75 içeri alındı).
    // z 0.6→0.8 (ferahlama): yeni sıra koridorunun merkezi — pad halkası (1.3) iki masa köşesine de değmez.
    zone2: [4.55, 0, 0.8] as Vec3,
    z2table2: ALL_TABLES[5].table,
    z2table3: ALL_TABLES[6].table,
    z2table4: ALL_TABLES[7].table,
    z2waiter: mir(1, [-4.6, 0, 2.2]),
    z2dishwasher: mir(1, [0.2, 0, -4.5]),
    // 3. ALAN (arka-sağ, 2026-06-11 taşıma): unlock pad'i a1'in arka şeridinde, kendi geçidinin
    // (x 9.0) yanında — dolum daireleri komşularla KESİŞMEZ (z2dishwasher pad [10.4,-4.5] ayrımı 2.71).
    zone3: [7.7, 0, -4.3] as Vec3,
    z3table2: ALL_TABLES[9].table,
    z3table3: ALL_TABLES[10].table,
    z3table4: ALL_TABLES[11].table,
    z3waiter: mir(2, [-4.6, 0, 2.2]),
    // Y1: tezgâh arka duvara taşınınca eski nokta ([10.4,-14.8]) counter footprint'inin içinde
    // kalıyordu → pad bulaşık modülünün önündeki açıklığa (tezgâh kenarına 2.1, bulaşığa 1.25).
    z3dishwasher: [13.3, 0, -14.3] as Vec3,
    // Y4: 2. garson pad'leri — kendi salonunun 1. garson pad'inin TAM yeri (requires prev waiter →
    // eski pad çoktan kaybolmuş; sıfır yeni mekânsal çakışma riski, tematik "garson durağı").
    waiter2: [-4.6, 0, 2.2] as Vec3,
    z2waiter2: mir(1, [-4.6, 0, 2.2]),
    z3waiter2: mir(2, [-4.6, 0, 2.2]),
  } as Record<string, Vec3>,
  // Servis başına mekânsal ocak-yükseltme noktası: kendi duvarında, modülün ALTINDA (kapı tarafı —
  // kullanıcı 2026-06-11: "ocağın önünde değil altında, sol duvarda dursun"). PAD MERKEZİ ocağın
  // pickupRadius'unun (1.6) DIŞINDA kalır (merkez ayrımı 2.0) → pad üstünde dururken çay-alma
  // tetiklenmez; ayrıca tick'teki pickup-guard'ı pickup alanı içinde dolumu zaten kilitler (vitest).
  stationUpgradeSpots: SERVICES.map((s) =>
    s === FOOD_SERVICE ? ([FOOD_STATION[0] - 2.0, 0, FOOD_STATION[2]] as Vec3) : mir(svcArea(s), [-4.35, 0, -0.5]),
  ),
  stationUpgradeSpot: [-4.35, 0, -0.5] as Vec3, // servis-0 alias (testler/eski kod)
  // Garson çay-alma noktası: modülün ÖN yüzü (2026-06-11 feedback: bardaklar önde, garson arkadaki
  // çaycı koridorundan ALMASIN — eski merkez+yarıçap hedefi arka koridoru da kabul ediyordu). Aynalı şablon.
  stationPickups: SERVICES.map((s) =>
    s === FOOD_SERVICE ? ([FOOD_STATION[0], 0, FOOD_STATION[2] + 0.85] as Vec3) : mir(svcArea(s), [-3.5, 0, -2.5]),
  ),
  // Servis başına personel köşeleri (aynalı şablon).
  // Garson boşta ÜST sırada, kendi mutfak bloğunun yanında bekler (2026-06-11 feedback: "sol altta
  // değil üst sırada dursun"). Çay pickup önünden (stationPickups z -2.5) ve bulaşıkçı köşesinden uzak.
  waiterHomes: SERVICES.map((s) =>
    s === FOOD_SERVICE
      ? ([FOOD_STATION[0] + 0.9, 0, FOOD_STATION[2] + 0.85] as Vec3)
      : mir(svcArea(s), [-3.5, 0, -3.4]),
  ),
  waiterHome: [-3.5, 0, -3.4] as Vec3,
  // (v29: waiterUpgradeSpots kalktı — garson hızı karakter panelinden.)
  // Bulaşık modülleri (D-025 rev. A, kullanıcı 2026-06-11: "bulaşık ocağın yanında olsun"):
  // kendi ocağının HEMEN ÜSTÜNDE, AYNI yan duvarda bitişik (ocak z -3.6..-1.4, bulaşık z -4.9..-3.5
  // → tek mutfak bloğu). Sağ kolon aynalı; arka sıra −z kopyası.
  dishStations: SERVICES.map((s) => mir(svcArea(s), [-4.35, 0, -4.2])),
  dishStation: [-4.35, 0, -4.2] as Vec3,
  dishwasherHomes: SERVICES.map((s) => mir(svcArea(s), [-3.3, 0, -4.2])),
  dishwasherHome: [-3.3, 0, -4.2] as Vec3,
  // --- Collision footprint'leri (yarı-boyut [hx,hz]; D-016): GÖRSEL mesh'lere yaslı → oyuncu objeye
  // "değiyor gibi" sokulur, arada boşluk kalmaz. (ocak tezgah 2.2×0.8, bulaşık 1.4×0.8, masa r0.5, sandalye 0.42.)
  playerRadius: 0.35, // oyuncu kapsül görsel yarıçapı = standoff'u görsel kenara denk getirir
  actorRadius: 0.28, // garson/bulaşıkçı engel-kaçınma yarıçapı
  stationHalf: [0.4, 1.1] as [number, number], // sol duvara paralel modül (uzun kenar z'de — D-023 şerit)
  // Servis başına istasyon footprint'i (Y1): tost tezgâhı arka duvara paralel → uzun kenar x'te.
  stationHalves: SERVICES.map((s) =>
    s === FOOD_SERVICE ? ([1.1, 0.4] as [number, number]) : ([0.4, 1.1] as [number, number]),
  ),
  dishHalf: [0.4, 0.7] as [number, number], // yan duvara paralel modül (uzun kenar z'de — ocak gibi)
  tableHalf: [0.5, 0.5] as [number, number],
  // Y1: dikdörtgen yemek masası (görsel 1.35×0.85; uzun kenar x'te — 2'ye 2 sandalye düzeni).
  foodTableHalf: [0.7, 0.45] as [number, number],
  chairHalf: [0.22, 0.22] as [number, number], // sandalye + oturan müşteri
  // Sandalye ofsetleri (Y2 tek kaynak): Tables.tsx görsel sandalyeyi, store koltuk pozisyonunu
  // (ALL_TABLES.seats) AYNI listeden türetir — görsel sandalye = oturulabilir koltuk.
  chairSpots: CHAIR_SPOTS,
  foodChairSpots: FOOD_CHAIR_SPOTS,
  // SALT GÖRSEL DEKOR (collision yok). Konumlar LAYOUT'ta çünkü dünya yerleşimine ait; Scene.
  // DecorProps buradan çizer. (G1 temas gölgesi denemesi geri alındı ama bu tek-kaynak sadeleşmesi
  // kaldı — dekor konumu artık JSX'in içine gömülü değil.)
  // r = zemindeki ayak izi yarıçapı (kova gövdesi / saksı ağzı).
  decor: {
    trashCans: [
      { pos: [2.5, 0, 4.85] as Vec3, scale: 1, rings: true }, // kapı yanı (ön duvar dibi)
      { pos: [-4.95, 0, -0.9] as Vec3, scale: 0.85, rings: false }, // mutfak ucu
    ],
    trashRadius: 0.21,
    planters: [
      [4.9, 0, -4.6],
      [4.9, 0, 4.4],
      [-5.0, 0, 2.9],
    ] as Vec3[],
    planterRadius: 0.18,
  },
} as const;

/** Collision engeli: merkez (Vec3) + yarı-boyut [hx,hz]. */
export interface Solid {
  c: RVec3;
  h: readonly [number, number];
}

// Sıra-arası duvar KALDIRILDI (2026-06-11 kullanıcı: "alan 2 ile alan 3 arasında duvar olmasın") —
// a1↔a2 sınırı artık a0↔a1 gibi tamamen açık (D-023 tek-salon deseni dikey komşuya da uygulanır).
// Kilitli a2 blokajı lockedAreaSolids + clampToOpenAreas'ta sürer.

/** AÇIK alan index'leri kadar servis açıktır: servisin durduğu alan açıksa servis de açıktır.
 *  B2'de tek servis kalınca bu fonksiyon her zaman [0] döner — çağıranlar değişmez. */
export const openServices = (areasOpen: number): number[] => SERVICES.filter((s) => svcArea(s) < areasOpen);

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
  // BL hücre = a0 alanının −AREA_DZ kopyası (areaBounds formülü, col 0 / row 1).
  solids.push({ c: [0, 0, (-5.3 - AREA_DZ + (5.0 - AREA_DZ)) / 2], h: [5.3, (5.0 - -5.3) / 2] });
  return solids;
}

/** Masanın footprint yarısı (Y1): yemek masası dikdörtgen, çay masası kare. */
const tableHalfFor = (i: number): readonly [number, number] =>
  serviceProduct(serviceOfTable(i)) === 'tost' ? LAYOUT.foodTableHalf : LAYOUT.tableHalf;

/** O an SAHNEDE var olan SABİT katı engeller (açık servislerin ocak+bulaşığı; açık masalar +
 *  sandalyeler). Yatay bölme duvarı YOK (D-023). Kapalı alanın mobilyası ÇİZİLMEZ → collision da
 *  eklenmez (oyuncu zaten açık alanların birleşimine kelepçeli). */
export function activeSolids(tables: number, areasOpen: number): Solid[] {
  const solids: Solid[] = [];
  for (const sv of openServices(areasOpen)) {
    solids.push({ c: LAYOUT.stations[sv], h: LAYOUT.stationHalves[sv] });
    solids.push({ c: LAYOUT.dishStations[sv], h: LAYOUT.dishHalf });
  }
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
const NAV_CELL = 0.3; // ızgara hücre boyu (dünya birimi) — masalar arası koridorları açık tutar.
// Personel "yanına varınca teslim/al" mesafeleri (GEOMETRİK: footprint yarısı + aktör yarıçapı + küçük pay).
// Masaya BİTİŞİK teslim → "tam masaya gelmeden veriyor" hissi biter (eski serveRadius 1.6 yerine ~1.05).
export const REACH_TABLE = LAYOUT.tableHalf[0] + LAYOUT.actorRadius + 0.25; // ocaktan masaya servis
// Tepsi yükleme: ocağın ÖN yüzündeki pickup noktasına varış (2026-06-11: merkez+geniş yarıçap
// arka çaycı koridorunu da kabul ediyordu → garson arkadan çay alıyordu; bardaklar ÖNDE).
export const REACH_PICKUP = 0.45;
export const REACH_WASH = LAYOUT.dishHalf[1] + LAYOUT.actorRadius + 0.4; // bulaşıkta yıkama
export const REACH_HOME = 0.4; // boştayken köşeye dönüş

/** Personelin GÖVDE engeli saydığı katılar (açık servislerin ocak+bulaşığı + açık masalar). */
export function navSolids(tables: number, areasOpen: number): NavSolid[] {
  const solids: NavSolid[] = [];
  for (const sv of openServices(areasOpen)) {
    solids.push({ c: LAYOUT.stations[sv], h: LAYOUT.stationHalves[sv] });
    solids.push({ c: LAYOUT.dishStations[sv], h: LAYOUT.dishHalf });
  }
  for (let i = 0; i < tables; i++) solids.push({ c: LAYOUT.tables[i].table, h: tableHalfFor(i) });
  // Kilitli alanlar + rezerv arsa rota dışı (sıra-arası duvar 2026-06-11'de kaldırıldı).
  solids.push(...lockedAreaSolids(areasOpen));
  return solids;
}

// Izgara masa+alan sayısına göre cache'lenir (masa/alan açılınca yeniden kurulur; her frame değil).
let navCache: { key: string; grid: NavGrid } | null = null;
export function getNavGrid(tables: number, areasOpen: number): NavGrid {
  const key = `${tables}|${areasOpen}`;
  if (navCache && navCache.key === key) return navCache.grid;
  const grid = buildNavGrid(LAYOUT.area, NAV_CELL, navSolids(tables, areasOpen), LAYOUT.actorRadius);
  navCache = { key, grid };
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
  const pts: RVec3[] = [LAYOUT.entrance];
  for (const sv of openServices(areasOpen)) {
    pts.push(LAYOUT.stations[sv], LAYOUT.stationPickups[sv], LAYOUT.dishStations[sv], LAYOUT.stationUpgradeSpots[sv]);
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
