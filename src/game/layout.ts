/**
 * layout.ts — SAHNE GEOMETRİSİ: yerleşim (LAYOUT), collision katıları ve personel yol bulma.
 *
 * Faz A2'de store.ts'ten ayrıldı: burada oyun DURUMU yok, yalnız koordinat/geometri var
 * (sabitler + saf fonksiyonlar). Böylece tick sistemleri (tick.ts) store'a bağlanmadan
 * yerleşimi kullanabilir; store.ts bu modülü yeniden dışa aktarır (eski importlar çalışır).
 */
import type { Vec3 } from './types';
import { MAX_ZONES, zoneOfTable, zoneProduct } from '../config/economy.config';
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
// Her pad/zone, açtığı/etkilediği objenin TAM yerinde durur (mekânsal tycoon).
// FAZ 2 REDESIGN v6 (D-017 §1, kullanıcı feedback 2026-06-07: "tek noktada çay-al+servis yapılıyor, yürüme
// döngüsü yok"): MUTFAK ARKA DUVARDA KÜME (ocak+bulaşık+semaver bitişik, AYRILMAZ); MASALAR ÖNE UZAK 2×2 →
// her masa↔ocak mesafesi >2R=3.2 (ön sıra ~4.9, hedef ~5) → tek noktada "çay-al+servis" veya "kirli-al+yıka"
// İMKÂNSIZ, yürüme döngüsü ZORLANIR. Orta geniş koridor (kolon ±2.4, gap 4.8). Collision: oyuncu mobilya+
// sandalye+aktör (HAPSETMEZ); garson/bulaşıkçı masa gövdelerinden GERÇEK rota ile dolaşır (nav.ts BFS).
// --- ZONE ŞABLONU (Faz 3a + D-022): zone-1 iç yerleşimi = bugüne kadarki mutlak koordinatlar.
// Global düz diziler (tables 8 slot, stations[2], ...) eski kodun index mantığını korur
// (zone z → masa slotları [z*4, z*4+4)).
// Kullanıcı feedback (2026-06-11): bölme duvarı kalkınca iki salon arasında ölü boşluk kaldı →
// zone'lar bitişik (zone-1 maxX = zone-2 minX = 5.3; duvar YOK, sınır zemin çizgisi).
// --- YERLEŞİM v3 (2026-06-11 kullanıcı feedback'i, D-025): PER-ZONE MUTFAK + AYNALI ŞABLON.
// Şikayetler: (a) çay ocağı + bulaşık tek köşede küme; (b) zone-2 servisi sol şeritten → garson turu
// ~19sn > sabır 18sn (müşteri kalkar); (c) yükseltme pad alanı dar; (d) masa pad'leri ocağa giriyor;
// (e) ekran alt duvara yakın, üstler boş. Çözüm: HER salonun çay ocağı KENDİ yan duvarında
// (z1 sol / z2 sağ = şablonun zone merkezine göre AYNALISI), bulaşık ARKA duvarda (ocaktan ayrı),
// masalar sağa+yukarı kaydı, masa pad'leri masanın kapı-tarafı ÇAPRAZINDA (ocak tarafında değil).
// Garson/bulaşıkçı turu artık zone'dan bağımsız kısa (z2 ocak→en uzak masa ≈ 8.8 birim ≈ z1 ile aynı).
const ZONE_DX = 10.6;
// M2 (2026-06-12, onaylı plan): kat 2×2 IZGARA. Revizyon (2026-06-11 kullanıcı): z2 (TOST)
// arka-SAĞA taşındı; arka-sol hücre REZERV arsa (zone yok — içerik sonra tasarlanacak).
// z0 ön-sol, z1 ön-sağ, z2 arka-sağ. Arka sıra ön sıranın −z tarafına ZONE_DZ kadar kaydırılır.
export const ZONE_DZ = 10.3; // sıra derinliği (zone alanı z: -5.3..5.0)
/** Zone'un ızgara kolonu (0 sol / 1 sağ) ve sırası (0 ön / 1 arka). */
export const zoneCol = (z: number) => (z < 2 ? z : 1);
export const zoneRow = (z: number) => (z < 2 ? 0 : 1);
/** (col,row) hücresindeki zone index'i; zone yoksa -1 (arka-sol = rezerv arsa). */
export const zoneAt = (col: number, row: number) => {
  for (let z = 0; z < MAX_ZONES; z++) if (zoneCol(z) === col && zoneRow(z) === row) return z;
  return -1;
};
const ZONES = Array.from({ length: MAX_ZONES }, (_, z) => z);
// Zone z için şablon noktası: tek kolonlar zone merkezine göre x-AYNALI (mutfak kendi yan duvarında
// kalır), arka sıra −ZONE_DZ kaydırılır (şablon yan-duvar temelli olduğundan rotasyon gerekmez).
const mir = (z: number, v: readonly [number, number, number]): Vec3 => [
  zoneCol(z) ? ZONE_DX - v[0] : v[0],
  v[1],
  v[2] - zoneRow(z) * ZONE_DZ,
];
/** Zone-yerel şablon noktasını dünyaya çevir (Scene görselleri için dışa açık). */
export const zonePoint = mir;


// Masa şablonu (zone-yerel): 2×2, sağa+yukarı kaymış (kolonlar -1.4/3.7, sıralar 2.55/-0.95).
// Koltuklar CHAIR_SPOTS/FOOD_CHAIR_SPOTS ofsetlerinden türetilir (Y2); upgradeSpot = kapı-tarafı
// çapraz köşe (orta koridora bakar; ocak/bulaşık tarafına TAŞMAZ; dwell hareketsiz-dolum olduğundan
// koridordan yürüyerek geçmek para çekmez).
// Açılış sırası ÖN sıradan (kapıya yakın, ocağa uzak — başlangıç masası ocaktan >4 br: yürüme
// döngüsü en baştan zorlanır, D-017 §1) → arka sıra sonra açılır.
// Ferahlama (turu-5 m.12, kamera-map-plan B): kolon aralığı 4.4→5.1 (net koridor ~1.5→2.2),
// sıra aralığı 2.9→3.5 (net koridor 0.0→~0.6 — dikey aradan artık yürünebilir). Zone alanı SABİT.
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

const ALL_TABLES = ZONES.flatMap((z) =>
  BASE_TABLES.map((t) => {
    const table = mir(z, t.table);
    // Y2: koltuk POZİSYONLARI spot listesinden türetilir; seats[0] eski .seat ile birebir aynı
    // (çay [0,0.78]; yemek Y1'in x−0.35 G-batı sandalyesi).
    const spots = zoneProduct(z) === 'tost' ? FOOD_CHAIR_SPOTS : CHAIR_SPOTS;
    const seats = spots.map(([sx, sz]) => [table[0] + sx, 0.6, table[2] + sz] as Vec3);
    return {
      table,
      seat: seats[0],
      seats,
      upgradeSpot: mir(z, t.upgradeSpot),
    };
  }),
);

// Y1 (yemek alanı kimliği, docs/yemek-alani-garson-plan.md §4.1): TOST salonunun (z2) tezgâhı yan
// duvarda değil ARKA duvara paralel "counter" — önü güneye (salona) bakar. Pickup/garson-evi/yükseltme
// noktaları tezgâhla birlikte döner (yan-duvar şablonuyla AYNI göreli geometri: pickup ön yüzde +0.85,
// garson evi pickup'tan 0.9 duvar-boyu, yükseltme pad'i tezgâhtan 2.0 duvar-boyu kapı tarafında —
// pad↔pickup ayrım değişmezi [≥pickupRadius+0.3] vitest'te tüm zone'lar için doğrulanır).
const FOOD_ZONE = 2;
const FOOD_STATION: Vec3 = [10.6, 0, -14.65];

export const LAYOUT = {
  // DÜNYA v2 (2026-06-11, kullanıcı tarifi; feedback-2026-06-11.md §G + D-023): duvarsız TEK SALON,
  // TEK KAPI (ön duvar, zone-1 ortası), mutfak = SOL DUVARDA L-ŞERİDİ (ocak modülleri sol duvara paralel,
  // zone açıldıkça şerit öne uzar; bulaşık modülleri arka duvar dibinde L'nin kısa kolu). Per-zone MEKANİK
  // (stations[z]/dishStations[z]/personel) AYNEN korunur — yalnız FİZİKSEL konum şeride taşındı.
  // TÜM müşteriler tek kapıdan girer/çıkar (entrances/streets aynı nokta; dizi geri-uyum için kaldı).
  entrances: ZONES.map(() => [0, 0.6, 4.8] as Vec3),
  streets: ZONES.map(() => [0, 0.6, 8.0] as Vec3),
  entrance: [0, 0.6, 4.8] as Vec3, // alias (testler/eski kod)
  street: [0, 0.6, 8.0] as Vec3,
  player: [0, 0.6, 1.5] as Vec3,
  // Ocak modülleri (D-025 per-zone mutfak): sol kolon SOL duvarda, sağ kolon SAĞ duvarda (aynalı);
  // arka sıra aynı şablonun −z kopyası. Arkada çaycı koridoru (~0.55) her zone'da korunur.
  stations: ZONES.map((z) => (z === FOOD_ZONE ? FOOD_STATION : mir(z, [-4.35, 0, -2.5]))),
  // Modül dönüşü: ön yüz salona bakar (sol kolon +x → +90°; sağ kolon −x → −90°).
  // Y1: yemek zone'unun tezgâhı arka duvarda → dönüşü 0 (ön yüz +z = güney).
  stationRots: ZONES.map((z) => (z === FOOD_ZONE ? 0 : zoneCol(z) ? -Math.PI / 2 : Math.PI / 2)),
  // Bulaşık modülü Y1'de YERİNDE kaldı (kendi yan duvarında) → dönüşü istasyondan bağımsız.
  dishRots: ZONES.map((z) => (zoneCol(z) ? -Math.PI / 2 : Math.PI / 2)),
  // Oynanabilir alan: 2×2 ızgaranın tamamı (tek bina). Oyuncu AÇIK zone'ların BİRLEŞİMİNE
  // kelepçelenir (tick — L-şekil destekli union kelepçesi, M2).
  area: { minX: -5.3, maxX: 5.3 + ZONE_DX, minZ: -5.3 - ZONE_DZ, maxZ: 5.0 },
  // Zone başına yerel alan (zemin/duvar/kamera + kilitli "boş arsa" için).
  zoneAreas: ZONES.map((z) => ({
    minX: -5.3 + zoneCol(z) * ZONE_DX,
    maxX: 5.3 + zoneCol(z) * ZONE_DX,
    minZ: -5.3 - zoneRow(z) * ZONE_DZ,
    maxZ: 5.0 - zoneRow(z) * ZONE_DZ,
  })),
  // Zone-1 | zone-2 sınır çizgisi (görsel; DUVAR YOK — D-023). Zone'lar bitişik → sınır = ortak kenar.
  zoneBorderX: 5.3,
  // Masa slotları — GLOBAL 8 slot (0-3 zone-1, 4-7 zone-2); zone içi 2×2 düzen değişmedi (D-017 §1).
  tables: ALL_TABLES,
  // Pad pozisyonları: açtıkları objenin yerinde. zone2 pad'i zone sınır çizgisinin ortasında.
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
    // Zone sınırının HEMEN zone-1 tarafında (2026-06-11: kilitli salon TAM karanlık örtülü —
    // pad halkası/etiketi karanlığa taşmasın diye eşikten ~0.75 içeri alındı).
    // z 0.6→0.8 (ferahlama): yeni sıra koridorunun merkezi — pad halkası (1.3) iki masa köşesine de değmez.
    zone2: [4.55, 0, 0.8] as Vec3,
    z2table2: ALL_TABLES[5].table,
    z2table3: ALL_TABLES[6].table,
    z2table4: ALL_TABLES[7].table,
    z2waiter: mir(1, [-4.6, 0, 2.2]),
    z2dishwasher: mir(1, [0.2, 0, -4.5]),
    // ZONE-3 (arka-sağ, 2026-06-11 taşıma): unlock pad'i z1'in arka şeridinde, kendi geçidinin
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
  // Zone başına mekânsal çay yükseltme noktası: kendi duvarında, modülün ALTINDA (kapı tarafı —
  // kullanıcı 2026-06-11: "ocağın önünde değil altında, sol duvarda dursun"). PAD MERKEZİ ocağın
  // pickupRadius'unun (1.6) DIŞINDA kalır (merkez ayrımı 2.0) → pad üstünde dururken çay-alma
  // tetiklenmez; ayrıca tick'teki pickup-guard'ı pickup alanı içinde dolumu zaten kilitler (vitest).
  upgradeZones: ZONES.map((z) =>
    z === FOOD_ZONE ? ([FOOD_STATION[0] - 2.0, 0, FOOD_STATION[2]] as Vec3) : mir(z, [-4.35, 0, -0.5]),
  ),
  upgradeZone: [-4.35, 0, -0.5] as Vec3, // zone-1 alias (testler/eski kod)
  // Garson çay-alma noktası: modülün ÖN yüzü (2026-06-11 feedback: bardaklar önde, garson arkadaki
  // çaycı koridorundan ALMASIN — eski merkez+yarıçap hedefi arka koridoru da kabul ediyordu). Aynalı şablon.
  stationPickups: ZONES.map((z) =>
    z === FOOD_ZONE ? ([FOOD_STATION[0], 0, FOOD_STATION[2] + 0.85] as Vec3) : mir(z, [-3.5, 0, -2.5]),
  ),
  // Zone başına personel köşeleri + garson hız noktası (aynalı şablon).
  // Garson boşta ÜST sırada, kendi mutfak bloğunun yanında bekler (2026-06-11 feedback: "sol altta
  // değil üst sırada dursun"). Çay pickup önünden (stationPickups z -2.5) ve bulaşıkçı köşesinden uzak.
  waiterHomes: ZONES.map((z) =>
    z === FOOD_ZONE ? ([FOOD_STATION[0] + 0.9, 0, FOOD_STATION[2] + 0.85] as Vec3) : mir(z, [-3.5, 0, -3.4]),
  ),
  waiterHome: [-3.5, 0, -3.4] as Vec3,
  // (v29: waiterUpgradeSpots kalktı — garson hızı karakter panelinden.)
  // Bulaşık modülleri (D-025 rev. A, kullanıcı 2026-06-11: "bulaşık ocağın yanında olsun"):
  // kendi ocağının HEMEN ÜSTÜNDE, AYNI yan duvarda bitişik (ocak z -3.6..-1.4, bulaşık z -4.9..-3.5
  // → tek mutfak bloğu). Sağ kolon aynalı; arka sıra −z kopyası.
  dishStations: ZONES.map((z) => mir(z, [-4.35, 0, -4.2])),
  dishStation: [-4.35, 0, -4.2] as Vec3,
  dishwasherHomes: ZONES.map((z) => mir(z, [-3.3, 0, -4.2])),
  dishwasherHome: [-3.3, 0, -4.2] as Vec3,
  // --- Collision footprint'leri (yarı-boyut [hx,hz]; D-016): GÖRSEL mesh'lere yaslı → oyuncu objeye
  // "değiyor gibi" sokulur, arada boşluk kalmaz. (ocak tezgah 2.2×0.8, bulaşık 1.4×0.8, masa r0.5, sandalye 0.42.)
  playerRadius: 0.35, // oyuncu kapsül görsel yarıçapı = standoff'u görsel kenara denk getirir
  actorRadius: 0.28, // garson/bulaşıkçı engel-kaçınma yarıçapı
  stationHalf: [0.4, 1.1] as [number, number], // sol duvara paralel modül (uzun kenar z'de — D-023 şerit)
  // Zone-başına istasyon footprint'i (Y1): yemek tezgâhı arka duvara paralel → uzun kenar x'te.
  stationHalves: ZONES.map((z) =>
    z === FOOD_ZONE ? ([1.1, 0.4] as [number, number]) : ([0.4, 1.1] as [number, number]),
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
// z1↔z2 sınırı artık z0↔z1 gibi tamamen açık (D-023 tek-salon deseni dikey komşuya da uygulanır).
// Kilitli z2 blokajı lockedZoneSolids + clampToOpenZones'ta sürer.

/** KİLİTLİ zone'ların alanları nav için BLOKE (M2): müşteri/personel rotası "boş arsa"dan geçemez
 *  (duvarlar yalnız açık zone'ları sardığından grid'e ayrıca anlatmak gerekir). Arka-sol REZERV
 *  hücre (zone'suz arsa, 2026-06-11) DAİMA bloke — rota oradan kestirme yapamaz. */
export function lockedZoneSolids(zonesOpen: number): Solid[] {
  const solids: Solid[] = [];
  for (let z = zonesOpen; z < MAX_ZONES; z++) {
    const za = LAYOUT.zoneAreas[z];
    solids.push({
      c: [(za.minX + za.maxX) / 2, 0, (za.minZ + za.maxZ) / 2],
      h: [(za.maxX - za.minX) / 2, (za.maxZ - za.minZ) / 2],
    });
  }
  // BL hücre = z0 alanının −ZONE_DZ kopyası (zoneAreas formülü, col 0 / row 1).
  solids.push({ c: [0, 0, (-5.3 - ZONE_DZ + (5.0 - ZONE_DZ)) / 2], h: [5.3, (5.0 - -5.3) / 2] });
  return solids;
}

/** O an SAHNEDE var olan SABİT katı engeller (açık zone'ların ocak+bulaşığı; açık masalar + sandalyeler
 *  + sıra-arası duvarlar). Yatay bölme duvarı YOK (D-023). Kapalı zone'un mobilyası ÇİZİLMEZ →
 *  collision da eklenmez (oyuncu zaten açık-zone birleşimine kelepçeli). */
/** Masanın footprint yarısı (Y1): yemek masası dikdörtgen, çay masası kare. */
const tableHalfFor = (i: number): readonly [number, number] =>
  zoneProduct(zoneOfTable(i)) === 'tost' ? LAYOUT.foodTableHalf : LAYOUT.tableHalf;

export function activeSolids(tables: number, zonesOpen: number): Solid[] {
  const solids: Solid[] = [];
  for (let z = 0; z < zonesOpen; z++) {
    solids.push({ c: LAYOUT.stations[z], h: LAYOUT.stationHalves[z] });
    solids.push({ c: LAYOUT.dishStations[z], h: LAYOUT.dishHalf });
  }
  for (let i = 0; i < tables; i++) {
    solids.push({ c: LAYOUT.tables[i].table, h: tableHalfFor(i) });
    solids.push({ c: LAYOUT.tables[i].seat, h: LAYOUT.chairHalf }); // sandalye (içine girilemez)
  }
  return solids;
}

/** Oyuncuyu AÇIK zone'ların BİRLEŞİMİNE kelepçele (M2): nokta hiçbir açık zone'da değilse en yakın
 *  açık-zone-içi noktaya çekilir. 3 zone açıkken L-şekli doğru çalışır (eski tek-eksen openMaxX
 *  kelepçesi 2×2 ızgarada yetmiyordu). */
export function clampToOpenZones(x: number, z: number, zonesOpen: number): [number, number] {
  let bestX = x;
  let bestZ = z;
  let bestD = Infinity;
  for (let i = 0; i < zonesOpen; i++) {
    const za = LAYOUT.zoneAreas[i];
    const cx = Math.max(za.minX, Math.min(za.maxX, x));
    const cz = Math.max(za.minZ, Math.min(za.maxZ, z));
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

/** Personelin GÖVDE engeli saydığı katılar (açık zone'ların ocak+bulaşığı + açık masalar). */
export function navSolids(tables: number, zonesOpen: number): NavSolid[] {
  const solids: NavSolid[] = [];
  for (let z = 0; z < zonesOpen; z++) {
    solids.push({ c: LAYOUT.stations[z], h: LAYOUT.stationHalves[z] });
    solids.push({ c: LAYOUT.dishStations[z], h: LAYOUT.dishHalf });
  }
  for (let i = 0; i < tables; i++) solids.push({ c: LAYOUT.tables[i].table, h: tableHalfFor(i) });
  // Kilitli zone alanları + rezerv arsa rota dışı (sıra-arası duvar 2026-06-11'de kaldırıldı).
  solids.push(...lockedZoneSolids(zonesOpen));
  return solids;
}

// Izgara masa+zone sayısına göre cache'lenir (masa/zone açılınca yeniden kurulur; her frame değil).
let navCache: { key: string; grid: NavGrid } | null = null;
export function getNavGrid(tables: number, zonesOpen: number): NavGrid {
  const key = `${tables}|${zonesOpen}`;
  if (navCache && navCache.key === key) return navCache.grid;
  const grid = buildNavGrid(LAYOUT.area, NAV_CELL, navSolids(tables, zonesOpen), LAYOUT.actorRadius);
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
