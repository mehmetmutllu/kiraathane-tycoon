import { create } from 'zustand';
import { Decimal, D } from './decimal';
import type { Coin, Dish, Npc, Vec3, Waiter } from './types';
import {
  economyConfig as C,
  upgradeOutputMultiplier,
  upgradeCost,
  requiresMet,
  brewQueueCapacity,
  cupPoolCapacity,
  tableUpgradeCost,
  tableTip,
  tablePatience,
  tableSeats,
  rollGroupSize,
  derivedFromPads,
  upgradeFillRateFor,
  waiterSpeed,
  waiterSoftMaxLevel as waiterSoftMaxLevelCfg,
  levelProgress,
  MAX_ZONES,
  TABLES_PER_ZONE,
  zoneOfTable,
  PRODUCTS,
  zoneProduct,
  defaultFloorTheme,
  charMaxTier,
  charNextCost,
  waiterTrayMaxTier,
  waiterTrayNextCost,
  waiterTrayCapacityFor,
  dishCarryNextCost,
  dishCarryCapacityFor,
  dishCarryMaxTier,
  type WaiterKind,
  type WaiterUpgrades,
  trayCapacityFor,
  attractRadiusFor,
  playerSpeedFor,
  type CharStat,
  type CharUpgrades,
  type PadDef,
  type GateState,
  type Requires,
  type QuestDef,
  type QuestTarget,
} from '../config/economy.config';
import {
  defaultSave,
  defaultStats,
  defaultSettings,
  defaultCharUpgrades,
  defaultWaiterUpgrades,
  loadSave,
  writeSave,
  clearSave,
  type SaveData,
  type SaveStats,
  type SaveSettings,
} from './save';
import { buildNavGrid, findNavPath, type NavGrid, type NavSolid } from './nav';

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
const ZONE_DZ = 10.3; // sıra derinliği (zone alanı z: -5.3..5.0)
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


// Masa şablonu (zone-yerel): 2×2, sağa+yukarı kaymış (kolonlar -1.2/3.2, sıralar -0.6/2.2).
// Koltuklar CHAIR_SPOTS/FOOD_CHAIR_SPOTS ofsetlerinden türetilir (Y2); upgradeSpot = kapı-tarafı
// çapraz köşe (orta koridora bakar; ocak/bulaşık tarafına TAŞMAZ; dwell hareketsiz-dolum olduğundan
// koridordan yürüyerek geçmek para çekmez).
// Açılış sırası ÖN sıradan (kapıya yakın, ocağa uzak — başlangıç masası ocaktan >4 br: yürüme
// döngüsü en baştan zorlanır, D-017 §1) → arka sıra sonra açılır.
const BASE_TABLES = [
  { table: [-1.2, 0, 1.9], upgradeSpot: [0.0, 0, 3.1] },
  { table: [3.2, 0, 1.9], upgradeSpot: [2.0, 0, 3.1] },
  { table: [-1.2, 0, -1.0], upgradeSpot: [0.0, 0, 0.2] },
  { table: [3.2, 0, -1.0], upgradeSpot: [2.0, 0, 0.2] },
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
    zone2: [4.55, 0, 0.6] as Vec3,
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
  // 2026-06-12 telefon feedback: z 4.4 alt duvara (5.0) fazla yakındı — işaret duvar arkasında
  // kayboluyordu (salon-2'de merdivenle de çakışıyordu; merdiven kaldırıldı) → 3.4'e çekildi.
  waiterUpgradeSpots: ZONES.map((z) => mir(z, [-3.5, 0, 3.4])),
  waiterUpgradeSpot: [-3.5, 0, 3.4] as Vec3,
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
} as const;

/** Collision engeli: merkez (Vec3) + yarı-boyut [hx,hz]. */
interface Solid {
  c: RVec3;
  h: readonly [number, number];
}

// Sıra-arası duvar KALDIRILDI (2026-06-11 kullanıcı: "alan 2 ile alan 3 arasında duvar olmasın") —
// z1↔z2 sınırı artık z0↔z1 gibi tamamen açık (D-023 tek-salon deseni dikey komşuya da uygulanır).
// Kilitli z2 blokajı lockedZoneSolids + clampToOpenZones'ta sürer.

/** KİLİTLİ zone'ların alanları nav için BLOKE (M2): müşteri/personel rotası "boş arsa"dan geçemez
 *  (duvarlar yalnız açık zone'ları sardığından grid'e ayrıca anlatmak gerekir). Arka-sol REZERV
 *  hücre (zone'suz arsa, 2026-06-11) DAİMA bloke — rota oradan kestirme yapamaz. */
function lockedZoneSolids(zonesOpen: number): Solid[] {
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

function activeSolids(tables: number, zonesOpen: number): Solid[] {
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
function clampToOpenZones(x: number, z: number, zonesOpen: number): [number, number] {
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
function tableSolids(tables: number): Solid[] {
  const solids: Solid[] = [];
  for (let i = 0; i < tables; i++) solids.push({ c: LAYOUT.tables[i].table, h: tableHalfFor(i) });
  return solids;
}

/** (x,z) noktası (yarıçap r şişirilmiş) herhangi bir katı engelin içinde mi? */
function hitsSolid(x: number, z: number, solids: Solid[], r: number): boolean {
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
const REACH_TABLE = LAYOUT.tableHalf[0] + LAYOUT.actorRadius + 0.25; // ocaktan masaya servis
// Tepsi yükleme: ocağın ÖN yüzündeki pickup noktasına varış (2026-06-11: merkez+geniş yarıçap
// arka çaycı koridorunu da kabul ediyordu → garson arkadan çay alıyordu; bardaklar ÖNDE).
const REACH_PICKUP = 0.45;
const REACH_WASH = LAYOUT.dishHalf[1] + LAYOUT.actorRadius + 0.4; // bulaşıkta yıkama
const REACH_HOME = 0.4; // boştayken köşeye dönüş

/** Personelin GÖVDE engeli saydığı katılar (açık zone'ların ocak+bulaşığı + açık masalar). */
function navSolids(tables: number, zonesOpen: number): NavSolid[] {
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
function getNavGrid(tables: number, zonesOpen: number): NavGrid {
  const key = `${tables}|${zonesOpen}`;
  if (navCache && navCache.key === key) return navCache.grid;
  const grid = buildNavGrid(LAYOUT.area, NAV_CELL, navSolids(tables, zonesOpen), LAYOUT.actorRadius);
  navCache = { key, grid };
  return grid;
}

/** Personeli hedefe BFS rotasıyla bir adım ilerlet; merkeze `reach` mesafesine girince true. pos yerinde değişir.
 *  `avoid` verilirse (oyuncu konumu) personel onun ÜSTÜNE BİNMEZ → kenarından ayrılır (oyuncuya göre hareket eder);
 *  `avoidSolids` (masa gövdeleri) verilirse oyuncudan kaçarken masaya itilmez. */
function navStep(
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

const NPC_SPEED = 2.6;
export const PAD_RADIUS = 1.3;
// Masa-başı yükseltme noktasının yarıçapı (Faz 2h). Pad'lerden küçük → komşu masanın noktasını tetiklemez.
const TABLE_UP_RADIUS = 1.0;
// Garson hız yükseltme noktasının yarıçapı (D-018 §6). Komşu masa-yükseltme noktasıyla çakışmayacak küçüklükte.
const WAITER_UP_RADIUS = 1.0;
// DWELL kanonik dolum-noktası id'leri (D-018 §2): pad'ler kendi id'sini kullanır; bunlar yükseltme
// noktaları. Zone'lu öneklerdir: gerçek id = önek + index ('tea:0', 'waiterUp:1', 'tableUp:5').
export const FILL_TEA = 'tea:'; // + zone index
export const FILL_TABLE = 'tableUp:'; // + GLOBAL masa index
export const FILL_WAITER = 'waiterUp:'; // + zone index (garson hız yükseltme, D-018 §6)

/** Zone z'nin garson pad id'si (per-zone personel; z>0 → 'z2waiter'/'z3waiter'). */
export const waiterPadId = (z: number) => (z === 0 ? 'waiter' : `z${z + 1}waiter`);

/** Zone z'nin çay-yükseltme noktası açık mı? (v21: her salonun KENDİ 2. masası önkoşul —
 *  upgradeRequiresByZone; zone-1 deseni aynalanır, "önce kapasite sonra verim".) */
export function upgradeZoneUnlockedZ(z: number, g: GateState): boolean {
  return requiresMet(C.teaStation.upgradeRequiresByZone[z], g);
}

/** Zone z'nin masa yükseltmeleri açık mı? (v21: o salonun 4 masası da açılınca — per-zone D-019 §3.) */
export function tableUpgradeUnlockedZ(z: number, g: GateState): boolean {
  return requiresMet(C.tables.upgradeRequiresByZone[z], g);
}

/** Zone z'nin garson-hız noktası açık mı? (v21: o zone'un garsonu + KENDİ garsonunun
 *  minWaiterServed taşıması — z2 garsonu tutulur tutulmaz hızlandırma belirmez, sindirme ilkesi.) */
export function waiterUpgradeUnlockedZ(z: number, g: GateState, level: number): boolean {
  if (!g.padsDone.includes(waiterPadId(z))) return false;
  const minServed = C.waiter.upgradeRequires.minWaiterServed ?? 0;
  // z0 global sayaçla harmanlanır (tarihsel davranış + eski test/dev kancası geri-uyumu);
  // z>0 yalnız KENDİ garsonunun taşımasını sayar.
  const served =
    z === 0
      ? Math.max(g.waiterServed ?? 0, g.waiterServedByZone?.[0] ?? 0)
      : g.waiterServedByZone?.[z] ?? 0;
  if (served < minServed) return false;
  return level < waiterSoftMaxLevelCfg();
}
const SAVE_INTERVAL = 2; // sn
const NPC_COLORS = ['#c0392b', '#27ae60', '#2980b9', '#8e44ad', '#d35400', '#16a085'];

type RVec3 = readonly [number, number, number];

function dist2D(a: RVec3, b: RVec3): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dz);
}

/** target'a doğru dt*speed kadar ilerlet; varışta true döner. pos yerinde değişir. */
function moveToward(pos: Vec3, target: RVec3, step: number): boolean {
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

// EKONOMİ v2 (D-010): çay fiyatı SABİT; seviye fiyatı değil throughput'u (çay/dk) artırır.
const TEA_PRICE = C.teaStation.basePrice;
// Bulaşık öğretilmeden kirli bardak çıkmaz (onboarding gate, 2026-06-10): ilk washDish görevinin index'i.
// Görev hattında yoksa -1 → gate hep açık (questIndex >= -1).
const WASH_QUEST_INDEX = C.quests.findIndex((q) => q.target.type === 'washDish');

/** stationLevel'in demleme hız (throughput) çarpanı — çay/dk; fiyatı DEĞİL. */
function brewThroughputMult(level: number): number {
  return upgradeOutputMultiplier(C.teaStation.upgrade, level);
}

/** Bir birim ürünün hazırlanma süresi (sn) — throughput arttıkça kısalır. prepTime verilmezse çay
 *  (geri uyum: eski çağıranlar/testler); tost zone'u PRODUCTS.tost.prepTime geçer (M3). */
function brewTime(level: number, serviceSpeedMult: number, prepTime: number = C.npc.orderTime): number {
  return (prepTime * serviceSpeedMult) / brewThroughputMult(level);
}

/** Oyuncunun tepsi kapasitesi (tek turda taşınan çay/kirli) — karakter tepsi kademesinden türetilir
 *  (v20; D-018'in "sabit" kararı karakter yükseltmeleriyle değişti). Arg'sız çağrı canlı store'dan okur
 *  (devHooks/testler geri-uyumu). */
export function trayCapacity(tier?: number): number {
  return trayCapacityFor(tier ?? useGame.getState().charUpgrades.tray);
}

/** GLOBAL bardak havuzu kapasitesi: açık zone başına taban + açık ocak seviyeleri toplamı (Faz 3a). */
export function totalCupPool(zonesOpen: number, stationLevels: number[]): number {
  let lv = 0;
  for (let z = 0; z < zonesOpen; z++) lv += stationLevels[z] ?? 0;
  return zonesOpen * C.cups.poolBase + C.cups.poolPerLevel * lv;
}

/** ₺ ile çıkılabilen en yüksek masa seviyesi (L5 = Usta, 💎/video — Faz 4). */
export const tableSoftMaxLevel = () => C.tables.upgrade.masterLevel - 1;
/** Mevcut seviyeden bir sonraki masa yükseltmesinin maliyeti (₺). */
export const tableNextCost = (level: number) => tableUpgradeCost(level);
/** Zone-1 masa yükseltme gate'i (geri uyum: testler/eski çağıranlar; per-zone için tableUpgradeUnlockedZ). */
export function tableUpgradeZoneUnlocked(g: GateState): boolean {
  return tableUpgradeUnlockedZ(0, g);
}

/** Çevrimdışı gelir oranı (₺/sn) — bottleneck idealize: oturma × ürün fiyatı / döngü.
 *  M3: zone verilirse o zone'un ÜRÜNÜ (tost pahalı+yavaş) hesaba girer.
 *  2026-06-11 (kullanıcı): masa BAHŞİŞLERİ de orana dahil — tipTotal = o zone'un açık masalarının
 *  Σ(tipBase × seviye); ilerleme (masa yükseltme) offline kazancı da büyütür. */
function incomeRate(tables: number, level: number, serviceSpeedMult = 1, z = 0, tipTotal = 0): number {
  const prod = PRODUCTS[zoneProduct(z)];
  const cycle = C.npc.walkTime + brewTime(level, serviceSpeedMult, prod.prepTime) + C.npc.eatTime;
  return (tables * prod.price + tipTotal) / cycle;
}

/**
 * Kirli masaların index kümesi (D-019): bir masada eşikten FAZLA (>) kirli kap varsa kirli.
 * Y2: eşik KOLTUKLA ölçeklenir (`dirtyThreshold × koltuk` — plan §2; yoksa 4 kişilik tek grup
 * masayı anında kilitlerdi; L0'da eski davranışla birebir aynı: >2).
 * Kirli masaya yeni müşteri oturmaz + garson çay götürmez → oyuncu eşiğe inene kadar masa kilitli.
 */
function dirtyTables(dishes: Dish[], tableLevels: number[] = []): Set<number> {
  const counts = new Map<number, number>();
  for (const d of dishes) counts.set(d.tableIndex, (counts.get(d.tableIndex) ?? 0) + 1);
  const dirty = new Set<number>();
  for (const [idx, n] of counts)
    if (n > C.cups.dirtyThreshold * tableSeats(tableLevels[idx] ?? 0)) dirty.add(idx);
  return dirty;
}

/** Masa-başı DOLU koltuk indeksleri (leaving sayılmaz — koltuk kalkar kalkmaz boşalır, Y2). */
function occupiedSeats(npcs: Npc[]): Map<number, Set<number>> {
  const occ = new Map<number, Set<number>>();
  for (const n of npcs) {
    if (n.state === 'leaving') continue;
    let set = occ.get(n.tableIndex);
    if (!set) {
      set = new Set();
      occ.set(n.tableIndex, set);
    }
    set.add(n.seatIndex);
  }
  return occ;
}

/** Grup hedefi (Y2, plan §2 + dağılım fix'i): zone'lar ROUND-ROBIN pay alır — global "en çok
 *  boş koltuk" araması, az koltuklu yeni salonu (tost L0=1 koltuk) çay salonlarına karşı sürekli
 *  kaybettirip AÇ bırakıyordu (q_tost5 ilerleyemiyordu). startZone'dan başlayarak boş koltuğu
 *  olan İLK zone seçilir; zone İÇİNDE en çok boş koltuklu temiz masa (eşitlikte düşük index).
 *  Hiç boş koltuk yoksa -1. */
export function findTableForGroup(
  occ: Map<number, Set<number>>,
  tables: number,
  dirty: Set<number>,
  tableLevels: number[],
  zonesOpen: number,
  startZone: number,
): number {
  for (let dz = 0; dz < zonesOpen; dz++) {
    const z = (startZone + dz) % zonesOpen;
    let best = -1;
    let bestFree = 0;
    const end = Math.min((z + 1) * TABLES_PER_ZONE, tables);
    for (let i = z * TABLES_PER_ZONE; i < end; i++) {
      if (dirty.has(i)) continue;
      const free = tableSeats(tableLevels[i] ?? 0) - (occ.get(i)?.size ?? 0);
      if (free > bestFree) {
        bestFree = free;
        best = i;
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

/** Oyuncunun o an üstünde durduğu/doldurduğu zone (HUD'da alttaki bar). */
export interface ActiveZone {
  kind: 'pad' | 'upgrade';
  label: string;
  fill: number;
  cost: number;
}

/** Yeni-özellik bildirimi (D-019 §4): bir özellik İLK kez açılınca beliren kısa toast (ttl = kalan sn).
 *  kind → HUD'daki SVG rozeti seçer (emoji yok — UI game-feel kuralı). */
export interface GameNotice {
  text: string;
  ttl: number;
  kind: 'quest' | 'level' | 'reveal';
  /** Görev ödülü (₺; M1): toast'ta coin ikonu + tutar olarak gösterilir (₺ sembolü display'de yok). */
  reward?: number;
}

/**
 * Şu an açık olan "yeni-özellik" reveal anahtarları (D-019 §4) — v21'den beri ZONE-BAŞINA
 * (kullanıcı 2026-06-12: zone-2 yükseltmeleri de düzenli açılsın + bildirilsin). Bir anahtar
 * revealSeen'de YOKKEN belirirse toast + kamera panı tetiklenir. revealSeen baseline init'te
 * mevcut açık özelliklerle kurulur → yeniden yüklemede zaten açık olanlar tekrar bildirmez.
 * Dönen üçlü: [anahtar, metin, pan hedefi (null = pan yok)].
 */
function revealKeys(
  g: GateState,
  zonesOpen: number,
  stationLevels: number[],
  hasWaiterByZone: boolean[],
  waiterLevels: number[],
): [string, string, RVec3 | null][] {
  const out: [string, string, RVec3 | null][] = [];
  const pre = (z: number) => (z === 0 ? '' : `Salon ${z + 1}: `);
  for (let z = 0; z < zonesOpen; z++) {
    if (upgradeZoneUnlockedZ(z, g) && (stationLevels[z] ?? 0) < stationSoftMaxLevel())
      out.push([`upgrade:${z}`, `Yeni: ${pre(z)}Çay ocağını yükseltebilirsin ☕`, LAYOUT.upgradeZones[z]]);
    if (hasWaiterByZone[z] && waiterUpgradeUnlockedZ(z, g, waiterLevels[z] ?? 0))
      out.push([`waiterUp:${z}`, `Yeni: ${pre(z)}Garsonu hızlandırabilirsin ⚡`, LAYOUT.waiterUpgradeSpots[z]]);
    if (tableUpgradeUnlockedZ(z, g))
      out.push([`tableUp:${z}`, `Yeni: ${pre(z)}Masaları yükseltebilirsin 🪑`, LAYOUT.tables[z * TABLES_PER_ZONE].upgradeSpot]);
  }
  for (const op of availableOptionalPads(g)) out.push([`opt:${op.id}`, `Yeni: ${op.label} 🔓`, null]);
  return out;
}

export interface GameState {
  // Kalıcı
  wallet: Decimal;
  diamonds: Decimal;
  lifetime: Decimal;
  tables: number;
  stations: number;
  /** Açık zone sayısı (derivedFromPads anlık görüntüsü; 1 = yalnız zone-1). */
  zonesOpen: number;
  /** Zone başına çay ocağı seviyesi (persist v18; per-zone ocak, D-022). */
  stationLevels: number[];
  /** Masa-başı yükseltme seviyeleri (Faz 2h; persist; index = GLOBAL masa slotu; bahşiş + sabır). */
  tableLevels: number[];
  /** Zone başına garson hız seviyesi (persist v18; 0 = taban, 1 = L2). */
  waiterLevels: number[];
  serviceSpeedMult: number;
  padsDone: string[];
  /** Aktif pad'lerin kısmi dolumu (pad id → ₺). Eş zamanlı omurga + opsiyonel için kayıt (v5). */
  padFills: Record<string, number>;
  // Transient (kaydedilmez — D-011 servis durumu yeniden kurulur)
  player: Vec3;
  npcs: Npc[];
  coins: Coin[];
  npcCount: number;
  /** Zone başına garson (o zone'da tutulduysa) — konum/tepsi transient, her oturumda kurulur. */
  waiters: (Waiter | null)[];
  /** Zone başına 2. GARSON (Y4 waiter2 pad'leri; claim sistemiyle 1.'den farklı masaya gider). */
  waiters2: (Waiter | null)[];
  /** Zone başına bulaşıkçı — konum/taşıdığı kirli transient. */
  dishwashers: (Waiter | null)[];
  /** Zone başına ocak hazır-kuyruğundaki demlenmiş çay sayısı. */
  readyCupsByZone: number[];
  /** Zone başına demlenmekte olan bardağın ilerleme süresi (sn). */
  brewProgressByZone: number[];
  /** Oyuncunun tepsisinde taşıdığı çay sayısı. */
  tray: number;
  /** Oyuncunun tepsisinde taşıdığı TOST sayısı (M3 ikinci ürün hattı; kapasite tray+trayFood+
   *  carriedDirty toplamı üzerinden PAYLAŞIMLIDIR). */
  trayFood: number;
  /** Temiz bardak havuzu — GLOBAL tek depo (zone'lar ortak; korunum değişmezi global kalır). Faz 2e. */
  cleanCups: number;
  /** Masalarda bekleyen kirli bardaklar (mekânsal nesneler). */
  dishes: Dish[];
  /** Oyuncunun bulaşığa götürmek için taşıdığı kirli bardak. */
  carriedDirty: number;
  /** Oyuncunun taşıdığı kirli TABAK (tost bulaşığı; turu-5 m.11 — tepside tabak çizilir).
   *  Transient; yıkama/havuz bardakla ORTAK, yalnız görsel için ayrı sayılır. */
  carriedDirtyFood: number;
  /** Zone başına çay-yükseltme noktası kısmi dolumu (transient; D-018 dwell). */
  upgradeFills: number[];
  /** Masa-başı yükseltme noktalarındaki kısmi dolum (transient; index = GLOBAL masa slotu). */
  tableUpgradeFills: number[];
  /** Zone başına garson hız yükseltme dolumu (transient; D-018 dwell — çıkınca sıfırlanmaz). */
  waiterUpgradeFills: number[];
  activeZone: ActiveZone | null;
  /** Yeni-özellik toast'u (D-019 §4) — transient; null ise gösterilmez. */
  notice: GameNotice | null;
  /** Bu oturumda zaten bildirilmiş reveal anahtarları (transient; init'te açık olanlarla doldurulur). */
  revealSeen: string[];
  /** Kalıcı eylem sayaçları (quest + arka-plan reveal şartları; v16 persist). */
  stats: SaveStats;
  /** Sıradaki görevin index'i (persist; >= quests.length ⇒ görev hattı bitti). */
  questIndex: number;
  /** Aktif sayaç görevinin başlangıç sayaç değeri (persist; delta hedefi tabanı). */
  questBase: number;
  /** Toplam oyuncu XP'si (persist v17). Seviye `levelProgress(xp)` ile türetilir — ayrı saklanmaz. */
  xp: number;
  /** Oyuncu ayarları (persist v17): ses/müzik/bildirim. */
  settings: SaveSettings;
  /** Kozmetik mağaza (persist v19, WP6): zone başına seçili tema + sahiplikler (`kind:id:zN`). */
  floorThemeByZone: string[];
  wallThemeByZone: string[];
  ownedCosmetics: string[];
  /** Karakter yükseltme kademeleri (persist v20): tepsi/mıknatıs/hız. Karakter seviyesi türetilir. */
  charUpgrades: CharUpgrades;
  /** Garson tepsi yükseltme kademeleri (persist v27/Y3): çay garsonları ortak + tostçu ayrı. */
  waiterUpgrades: WaiterUpgrades;
  /** Karakter paneli ilk-sefer spotlight'ı görüldü mü (persist v20). */
  charPanelSeen: boolean;
  /** Tepsi-boşalt butonu ilk-sefer spotlight'ı görüldü mü (persist v23). */
  trayTipSeen: boolean;
  /** Üst görev barı görünümü (transient; her tick türetilir; null = hat bitti). */
  quest: QuestView | null;
  /** Kamera odak isteği (transient): görev barına dokununca / yeni şey açılınca hedefe pan. */
  camFocus: CamFocus | null;
  offlineEarned: number;
  // Dahili
  spawnTimer: number;
  /** Spawn round-robin zone imleci (transient): grup dağılımı zone'lar arası adil olsun. */
  spawnZone: number;
  saveTimer: number;
  nextId: number;
  inputKeyboard: [number, number];
  inputJoystick: [number, number];
  // Aksiyonlar
  init: () => void;
  tick: (dt: number) => void;
  setKeyboardInput: (x: number, z: number) => void;
  setJoystickInput: (x: number, z: number) => void;
  upgradeStation: () => boolean;
  addMoney: (amount: number) => void;
  /** Görev barına dokununca: kamera aktif görevin hedefine kayar (görev yoksa no-op). */
  focusQuest: () => void;
  /** Ayar değiştir (ayarlar modalı) — anında kaydedilir. */
  setSetting: (key: keyof SaveSettings, value: boolean) => void;
  /**
   * Kozmetik tema satın al/uygula (WP6): zone AÇIK olmalı; ilk satın alma ₺ düşer (cüzdan yetmezse
   * false), sahip olunan tema ücretsiz yeniden seçilir. Başarıda anında kaydedilir.
   */
  buyCosmetic: (kind: 'floor' | 'wall', id: string, zone: number) => boolean;
  /**
   * Karakter özelliği satın al (v20, karakter paneli): cüzdan yeterliyse kademe +1 (yetmezse/max'taysa
   * false). Başarıda anında kaydedilir; charStat görevi varsa sonraki tick'te tamamlanır.
   */
  buyCharUpgrade: (stat: CharStat) => boolean;
  /** Garson tepsi kademesi satın al (Y3, garson sekmesi): tür-başı eğri (çay ortak, tostçu ayrı). */
  buyWaiterTray: (kind: WaiterKind) => boolean;
  /** Bulaşıkçı leğen kademesi satın al (v28, Bulaşıkçı sekmesi): tüm salonların bulaşıkçılarına ortak. */
  buyDishCarry: () => boolean;
  /** Karakter paneli ilk-sefer spotlight'ını kapat (butona dokununca; persist — bir daha çıkmaz). */
  markCharPanelSeen: () => void;
  /**
   * Tepsiyi boşalt (v23, telefon turu-2): tepsideki ÇAYLAR atılır, bardakları temiz havuza döner
   * (korunum bozulmaz; çay ziyan = küçük bedel, istismarı engeller). Taşınan KİRLİLER kalır —
   * onlar zaten lavaboya gidiyor. Tepsi çayla doluyken müşteriler kalkarsa kilitlenme çözücüsü.
   */
  emptyTray: (kind: 'tea' | 'food') => void;
  /** Tepsi-boşalt butonu ilk-sefer spotlight'ını kapat (persist — bir daha çıkmaz). */
  markTrayTipSeen: () => void;
  saveNow: () => void;
  hardReset: () => void;
}

/**
 * Şu an aktif OMURGA pad'i: ilk açılmamış, opsiyonel OLMAYAN, `requires` koşulu karşılanan pad.
 * Opsiyonel pad'ler (ör. garson) atlanır → alınmasalar da omurga (sonraki masa/ocak) açılmaya
 * devam eder. Önkoşul zinciri (prev) sayesinde sıralıdır; sonraki gate'liyse null döner.
 */
export function currentPad(g: GateState): PadDef | null {
  return (C.pads as readonly PadDef[]).find(
    (p) => !p.optional && !g.padsDone.includes(p.id) && requiresMet(p.requires, g),
  ) ?? null;
}

/**
 * Şu an alınabilir opsiyonel pad'ler (garson vb.): açılmamış, `optional:true`, koşulu karşılanan.
 * Omurgadan bağımsız; oyuncu isterse alır. Aynı anda omurga pad'iyle birlikte aktif olabilir.
 */
export function availableOptionalPads(g: GateState): PadDef[] {
  return (C.pads as readonly PadDef[]).filter(
    (p) => p.optional && !g.padsDone.includes(p.id) && requiresMet(p.requires, g),
  );
}

/** Zone-1 istasyon yükseltme gate'i (geri uyum: testler/eski çağıranlar; per-zone için upgradeZoneUnlockedZ). */
export function upgradeZoneUnlocked(g: GateState): boolean {
  return upgradeZoneUnlockedZ(0, g);
}

// ============================== QUEST MOTORU (2026-06-09) ==============================
// İlerleme sıralı TEK görevle yönlendirilir (Fable brief §1+§4; eski nextStep + onboardingHint
// koç bandının yerini alır). Sayaç görevleri questBase'ten DELTA sayılır; durum görevleri
// (pad/level) doğrudan oyun durumundan okunur.

/** Quest değerlendirme bağlamı (salt-okunur anlık görüntü). */
export interface QuestCtx {
  padsDone: string[];
  /** Zone başına ocak seviyesi (v27: zone'lu stationLevel görevleri — "Salon 2'nin ocağını yükselt"). */
  stationLevels: number[];
  waiterLevel: number;
  tableLevels: number[];
  stats: SaveStats;
  questBase: number;
  /** Karakter yükseltme kademeleri (v20; charStat görevleri için). */
  charUpgrades: CharUpgrades;
  /** Garson tepsi kademeleri (v27/Y3; waiterTray görevleri için). */
  waiterUpgrades: WaiterUpgrades;
}

/** Sayaç hedefinin baktığı kümülatif sayaç değeri (durum hedefleri için null). */
export function questCounterValue(target: QuestTarget, stats: SaveStats): number | null {
  switch (target.type) {
    case 'pickupTea': return stats.teaPickups;
    case 'serveTea':
      // zone'lu hedef (v23): yalnız o salonun el servisi sayılır ("Yeni salonda 5 çay" gerçek olsun).
      return target.zone != null ? stats.teasServedByZone[target.zone] ?? 0 : stats.teasServed;
    case 'collectCoin': return stats.coinsCollected;
    case 'washDish': return stats.dishesWashed;
    default: return null;
  }
}

/** Görev hedefi karşılandı mı? */
export function questTargetMet(target: QuestTarget, ctx: QuestCtx): boolean {
  const counter = questCounterValue(target, ctx.stats);
  if (counter != null) {
    const count = (target as { count: number }).count;
    return counter - ctx.questBase >= count;
  }
  switch (target.type) {
    case 'pad': return ctx.padsDone.includes(target.id);
    case 'stationLevel': return (ctx.stationLevels[target.zone ?? 0] ?? 0) >= target.level;
    case 'waiterLevel': return ctx.waiterLevel >= target.level;
    case 'tableLevel': return ctx.tableLevels.some((l) => l >= target.level);
    case 'tablesAtLevel': {
      // zone verilirse yalnız o salonun masa slotları; verilmezse tüm masalar (v27 çeşitlilik).
      const lvls = target.zone != null
        ? ctx.tableLevels.slice(target.zone * TABLES_PER_ZONE, (target.zone + 1) * TABLES_PER_ZONE)
        : ctx.tableLevels;
      return lvls.filter((l) => (l ?? 0) >= target.level).length >= target.count;
    }
    case 'waiterTray':
      return (target.kind === 'tea' ? ctx.waiterUpgrades.teaTray : ctx.waiterUpgrades.tostTray) >= target.tier;
    case 'charStat': return ctx.charUpgrades[target.stat] >= target.tier;
    default: return false;
  }
}

/** HUD görev barı görünümü (transient; her tick türetilir). */
export interface QuestView {
  id: string;
  title: string;
  /** Görev hedefi (HUD görev fotoğrafı hedef tipine göre seçilir). */
  target: QuestTarget;
  /** Sayaç görevlerinde ilerleme (cur/total); durum görevlerinde null. */
  cur: number | null;
  total: number | null;
  /** Pad görevlerinde maliyet (görev barında gösterilir). */
  cost: number | null;
  /** Tamamlama ödülü (₺; M1) — görev kartında coin rozetiyle gösterilir. */
  reward: number | null;
}

function questView(q: QuestDef, ctx: QuestCtx): QuestView {
  const counter = questCounterValue(q.target, ctx.stats);
  const count = counter != null ? (q.target as { count: number }).count : null;
  const pad =
    q.target.type === 'pad'
      ? (C.pads as readonly PadDef[]).find((p) => p.id === (q.target as { id: string }).id)
      : undefined;
  // charStat/waiterTray görevinde maliyet = hedef kademeye ulaştıran satın almanın ₺'si (görev kartında).
  const charCost =
    q.target.type === 'charStat'
      ? charNextCost(q.target.stat, q.target.tier - 1)
      : q.target.type === 'waiterTray'
        ? waiterTrayNextCost(q.target.kind, q.target.tier - 1)
        : null;
  return {
    id: q.id,
    title: q.title,
    target: q.target,
    cur: counter != null && count != null ? Math.max(0, Math.min(count, counter - ctx.questBase)) : null,
    total: count,
    cost: pad ? pad.cost : charCost,
    reward: q.reward ?? null,
  };
}

/** Görev hedefinin DÜNYA konumu (kamera odak + işaret görünürlüğü). zone = görevin salonu
 *  (2026-06-11 fix: z2 görevlerinde kamera zone-1'e zoom atıyordu — hedefler zone-1 alias'larına sabitti).
 *  charStat görevlerinde 3D hedef YOK → null (kamera sıçramaz; yönlendirme HUD buton efektiyle). */
export function questFocusPos(target: QuestTarget, tableLevels: number[], tables: number, zone = 0): RVec3 | null {
  const z = Math.min(Math.max(zone, 0), MAX_ZONES - 1);
  switch (target.type) {
    case 'charStat': return null;
    case 'waiterTray': return null; // panel satın alımı — 3D hedef yok (charStat deseni)
    case 'pickupTea': return LAYOUT.stations[z];
    case 'washDish': return LAYOUT.dishStations[z];
    case 'pad': return LAYOUT.padPos[target.id] ?? LAYOUT.stations[z];
    case 'stationLevel': return LAYOUT.upgradeZones[target.zone ?? z];
    case 'waiterLevel': return LAYOUT.waiterUpgradeSpots[z];
    case 'tableLevel':
    case 'tablesAtLevel': {
      // O zone'dan başlayarak hedef seviyenin ALTINDAKİ ilk açık masanın yükseltme noktası
      // (tablesAtLevel v27: oyuncuyu gerçekten yükseltilecek masaya götürür).
      const goal = target.type === 'tablesAtLevel' ? target.level : tableSoftMaxLevel();
      const z0 = target.type === 'tablesAtLevel' && target.zone != null ? target.zone : z;
      for (let i = z0 * TABLES_PER_ZONE; i < tables; i++) {
        if ((tableLevels[i] ?? 0) < goal) return LAYOUT.tables[i].upgradeSpot;
      }
      return LAYOUT.tables[Math.min(z0 * TABLES_PER_ZONE, tables - 1) || 0].upgradeSpot;
    }
    // serveTea → o salonun OCAĞI/TEZGÂHI (2026-06-12 telefon feedback: salon ortası boştu —
    // özellikle yeni açılan salonda kamera "hiçbir şeye" bakıyordu); collectCoin → masa bölgesi ortası.
    case 'serveTea': return LAYOUT.stations[z];
    default: {
      const za = LAYOUT.zoneAreas[z];
      return [(za.minX + za.maxX) / 2, 0, 1.5 - zoneRow(z) * ZONE_DZ]; // arka sıra kaydırılır (M2)
    }
  }
}

/** Kamera odak isteği (transient): CameraRig bu hedefe kayar/zoom yapar, ttl bitince/girdiyle döner. */
export interface CamFocus {
  pos: [number, number, number];
  ttl: number;
}
const CAM_FOCUS_TTL = 2.2; // sn — kayma + kısa bekleme; joystick girdisi anında iptal eder

/**
 * EKRANDA TEK PAD (quest sistemi): görünür/doldurulabilir pad'ler. Pad görevi sırasında YALNIZ o pad;
 * pad-dışı görevde HİÇ pad; görev hattı bittiyse güvenlik ağı olarak klasik omurga sırası (normalde
 * hat tüm pad'leri kapsadığından boş kalır). Hem tick (dolum) hem Pad.tsx (çizim) BUNU kullanır →
 * görsel ile mantık ayrışamaz.
 */
export function visiblePads(questIndex: number, g: GateState): PadDef[] {
  // Y4: gating'i karşılanan OPSİYONEL pad'ler (2. garsonlar) görev durumundan bağımsız görünür —
  // geç-oyun serbest keşfi; "ekranda tek pad" ilkesi omurga için sürer (opsiyoneller nadir/gate'li).
  const opt = availableOptionalPads(g);
  const q = questIndex < C.quests.length ? C.quests[questIndex] : null;
  if (q) {
    if (q.target.type !== 'pad') return opt;
    const p = (C.pads as readonly PadDef[]).find((pd) => pd.id === (q.target as { id: string }).id);
    // AKTİF görevin hedef pad'inde TEMPO gate'leri (minLifetime vb.) ATLANIR (2026-06-11 fix:
    // "2. Masayı aç" görevi verilmişken table2 minLifetime:20 pad'i gizliyordu — görev hattı sıralı =
    // tempo kaynağı). `prev` OMURGA zinciri yapısal güvenlik ağı olarak KALIR (bozuk kayda karşı).
    const req = p ? (p.requires as Requires | undefined) : undefined;
    const prevOk = !req?.prev || req.prev.every((id) => g.padsDone.includes(id));
    const rest = opt.filter((o) => o.id !== p?.id); // q_waiter2 gibi opsiyonel-hedefli görevde çiftleme olmasın
    return p && !g.padsDone.includes(p.id) && prevOk ? [p, ...rest] : rest;
  }
  const bp = currentPad(g);
  return bp ? [bp, ...opt] : opt;
}

/**
 * Offline kazanç (saf — vitest edilebilir; 2026-06-11 nerf): oran × rateMult × min(süre, süre-tavanı),
 * SONRA PARA tavanı = sıradaki omurga pad maliyeti × capNextPadFrac (tüm pad'ler bittiyse en pahalı pad
 * referans alınır). İki kelepçe birlikte: kapa-aç ~7k verip zone'u tek girişte bitirme bug'ı kapanır.
 */
export function computeOfflineEarned(rate: number, elapsedSec: number, padsDone: readonly string[]): number {
  const capSec = C.offline.baseCapHours * 3600;
  const raw = Math.floor(rate * C.offline.rateMult * Math.min(elapsedSec, capSec));
  const pads = C.pads as readonly PadDef[];
  const next = pads.find((p) => !p.optional && !padsDone.includes(p.id));
  const refCost = next ? next.cost : Math.max(...pads.map((p) => p.cost));
  return Math.min(raw, Math.floor(refCost * C.offline.capNextPadFrac));
}

/** ₺ ile çıkılabilen en yüksek garson seviyesi (index; L1=0 taban → L2=1). */
export const waiterSoftMaxLevel = waiterSoftMaxLevelCfg;
/** Garson L2 yükseltme maliyeti (₺). */
export const waiterUpgradeCost = () => C.waiter.upgradeCost;
/** Garson hız yükseltme noktası şu an aktif mi (garson tutuldu + seviye max değil)? */
export function waiterUpgradeUnlocked(g: GateState, level: number): boolean {
  return requiresMet(C.waiter.upgradeRequires, g) && level < waiterSoftMaxLevelCfg();
}

/** ₺ ile çıkılabilen en yüksek istasyon seviyesi (L5 = Usta, 💎/video — Faz 4). */
export const stationSoftMaxLevel = () => C.teaStation.upgrade.masterLevel - 1;
/** Mevcut seviyeden bir sonraki ₺ yükseltmenin maliyeti (çay eğrisi; zone-farkındalı için *Z). */
export const stationUpgradeCost = (level: number) => upgradeCost(C.teaStation.upgrade, level + 1);
/** Zone'un istasyon yükseltme maliyeti: çay eğrisi × ürünün upgradeCostMult'u (M3 — tost tezgâhı
 *  geç-oyun, çay eğrisi orada komik ucuz kalırdı). */
export const stationUpgradeCostZ = (z: number, level: number) =>
  Math.floor(upgradeCost(C.teaStation.upgrade, level + 1) * PRODUCTS[zoneProduct(z)].upgradeCostMult);

export const useGame = create<GameState>((set, get) => ({
  wallet: D(0),
  diamonds: D(0),
  lifetime: D(0),
  tables: 1,
  stations: 1,
  zonesOpen: 1,
  stationLevels: Array.from({ length: MAX_ZONES }, () => 0),
  tableLevels: LAYOUT.tables.map(() => 0),
  waiterLevels: Array.from({ length: MAX_ZONES }, () => 0),
  serviceSpeedMult: 1,
  padsDone: [],
  padFills: {},
  player: [...LAYOUT.player] as Vec3,
  npcs: [],
  coins: [],
  npcCount: 0,
  waiters: Array.from({ length: MAX_ZONES }, () => null),
  waiters2: Array.from({ length: MAX_ZONES }, () => null),
  dishwashers: Array.from({ length: MAX_ZONES }, () => null),
  readyCupsByZone: Array.from({ length: MAX_ZONES }, () => 0),
  brewProgressByZone: Array.from({ length: MAX_ZONES }, () => 0),
  tray: 0,
  trayFood: 0,
  cleanCups: cupPoolCapacity(0),
  dishes: [],
  carriedDirty: 0,
  carriedDirtyFood: 0,
  upgradeFills: Array.from({ length: MAX_ZONES }, () => 0),
  tableUpgradeFills: LAYOUT.tables.map(() => 0),
  waiterUpgradeFills: Array.from({ length: MAX_ZONES }, () => 0),
  activeZone: null,
  notice: null,
  revealSeen: [],
  stats: defaultStats(),
  questIndex: 0,
  questBase: 0,
  xp: 0,
  settings: defaultSettings(),
  floorThemeByZone: Array.from({ length: MAX_ZONES }, (_, z) => defaultFloorTheme(z)),
  wallThemeByZone: Array.from({ length: MAX_ZONES }, () => 'krem'),
  ownedCosmetics: [],
  charUpgrades: defaultCharUpgrades(),
  waiterUpgrades: defaultWaiterUpgrades(),
  charPanelSeen: false,
  trayTipSeen: false,
  quest: null,
  camFocus: null,
  offlineEarned: 0,
  spawnTimer: 1,
  spawnZone: 0,
  saveTimer: SAVE_INTERVAL,
  nextId: 1,
  inputKeyboard: [0, 0],
  inputJoystick: [0, 0],

  init: () => {
    const save: SaveData = loadSave();
    // D-015: tables/stations/zonesOpen/personel padsDone'dan TÜRETİLİR (ayrı saklanmaz).
    const derived = derivedFromPads(save.padsDone);
    const stationLevels = Array.from({ length: MAX_ZONES }, (_, z) =>
      Math.min(save.stationLevels[z] ?? 0, stationSoftMaxLevel()),
    );
    const waiterLevels = Array.from({ length: MAX_ZONES }, (_, z) =>
      Math.min(save.waiterLevels[z] ?? 0, waiterSoftMaxLevelCfg()),
    );
    // Karakter kademeleri (v20): bozuk/aşırı değer max kademeye kelepçelenir (stationLevels deseni).
    const charUpgrades: CharUpgrades = {
      tray: Math.max(0, Math.min(save.charUpgrades?.tray ?? 0, charMaxTier('tray'))),
      magnet: Math.max(0, Math.min(save.charUpgrades?.magnet ?? 0, charMaxTier('magnet'))),
      speed: Math.max(0, Math.min(save.charUpgrades?.speed ?? 0, charMaxTier('speed'))),
    };
    // Garson tepsi kademeleri (v27/Y3) + bulaşıkçı leğeni (v28): aynı kelepçe deseni.
    const waiterUpgrades: WaiterUpgrades = {
      teaTray: Math.max(0, Math.min(save.waiterUpgrades?.teaTray ?? 0, waiterTrayMaxTier('tea'))),
      tostTray: Math.max(0, Math.min(save.waiterUpgrades?.tostTray ?? 0, waiterTrayMaxTier('tost'))),
      dishCarry: Math.max(0, Math.min(save.waiterUpgrades?.dishCarry ?? 0, dishCarryMaxTier())),
    };
    // Çevrimdışı gelir: açık zone'ların idealize oranları TOPLAMI; süre + PARA tavanlı (computeOfflineEarned).
    const elapsed = Math.max(0, (Date.now() - save.lastSaved) / 1000);
    let wallet = D(save.wallet);
    let lifetime = D(save.lifetime);
    let offlineEarned = 0;
    if (elapsed > 30) {
      let rate = 0;
      for (let z = 0; z < derived.zonesOpen; z++) {
        // O zone'un AÇIK masalarının toplam bahşişi (tipBase × seviye; global slot index'i z*4..).
        let tipTotal = 0;
        for (let i = 0; i < derived.tablesByZone[z]; i++)
          tipTotal += C.tables.tipBase * (save.tableLevels[z * TABLES_PER_ZONE + i] ?? 0);
        rate += incomeRate(derived.tablesByZone[z], stationLevels[z], derived.serviceSpeedMult, z, tipTotal);
      }
      offlineEarned = computeOfflineEarned(rate, elapsed, save.padsDone);
      wallet = wallet.add(offlineEarned);
      lifetime = lifetime.add(offlineEarned);
    }
    set({
      wallet,
      lifetime,
      diamonds: D(save.diamonds),
      tables: derived.tables,
      stations: derived.stations,
      zonesOpen: derived.zonesOpen,
      stationLevels,
      // Masa-başı seviyeleri: slot sayısına normalize et + her birini soft max'a clamp'le.
      tableLevels: LAYOUT.tables.map((_, i) => Math.min(save.tableLevels[i] ?? 0, tableSoftMaxLevel())),
      waiterLevels,
      serviceSpeedMult: derived.serviceSpeedMult,
      padsDone: [...save.padsDone],
      padFills: { ...save.padFills },
      offlineEarned,
      player: [...LAYOUT.player] as Vec3,
      npcs: [],
      coins: [],
      npcCount: 0,
      waiters: Array.from({ length: MAX_ZONES }, (_, z) =>
        derived.hasWaiterByZone[z] ? { pos: [...LAYOUT.waiterHomes[z]] as Vec3, tray: 0 } : null,
      ),
      waiters2: Array.from({ length: MAX_ZONES }, (_, z) =>
        derived.waiterCountByZone[z] >= 2
          ? { pos: [LAYOUT.waiterHomes[z][0] + 0.7, 0, LAYOUT.waiterHomes[z][2]] as Vec3, tray: 0 }
          : null,
      ),
      dishwashers: Array.from({ length: MAX_ZONES }, (_, z) =>
        derived.hasDishwasherByZone[z] ? { pos: [...LAYOUT.dishwasherHomes[z]] as Vec3, tray: 0 } : null,
      ),
      readyCupsByZone: Array.from({ length: MAX_ZONES }, () => 0),
      brewProgressByZone: Array.from({ length: MAX_ZONES }, () => 0),
      tray: 0,
      trayFood: 0,
      // Bardak havuzu her oturumda dolu-temiz başlar (transient). GLOBAL tek depo:
      // zone başına taban + açık zone ocak seviyelerinin toplamı.
      cleanCups: totalCupPool(derived.zonesOpen, stationLevels),
      dishes: [],
      carriedDirty: 0,
      carriedDirtyFood: 0,
      upgradeFills: Array.from({ length: MAX_ZONES }, () => 0),
      tableUpgradeFills: LAYOUT.tables.map(() => 0),
      waiterUpgradeFills: Array.from({ length: MAX_ZONES }, () => 0),
      activeZone: null,
      notice: null,
      // revealSeen baseline: yüklemede ZATEN açık olan özellikler bildirilmiş sayılır (yeniden yükleme spam'ı yok).
      revealSeen: revealKeys(
        {
          padsDone: save.padsDone,
          tables: derived.tables,
          stationLevel: stationLevels[0],
          lifetime: lifetime.toNumber(),
          waiterServed: save.stats.waiterServed,
          waiterServedByZone: save.stats.waiterServedByZone,
        },
        derived.zonesOpen,
        stationLevels,
        derived.hasWaiterByZone,
        waiterLevels,
      ).map(([k]) => k),
      stats: { ...save.stats },
      questIndex: save.questIndex,
      questBase: save.questBase,
      xp: save.xp,
      settings: { ...save.settings },
      floorThemeByZone: Array.from({ length: MAX_ZONES }, (_, z) => save.floorThemeByZone[z] ?? defaultFloorTheme(z)),
      wallThemeByZone: Array.from({ length: MAX_ZONES }, (_, z) => save.wallThemeByZone[z] ?? 'krem'),
      ownedCosmetics: [...save.ownedCosmetics],
      charUpgrades,
      waiterUpgrades,
      charPanelSeen: save.charPanelSeen,
      trayTipSeen: save.trayTipSeen,
      quest:
        save.questIndex < C.quests.length
          ? questView(C.quests[save.questIndex], {
              padsDone: save.padsDone,
              stationLevels,
              waiterLevel: waiterLevels[0],
              tableLevels: save.tableLevels,
              stats: save.stats,
              questBase: save.questBase,
              charUpgrades,
              waiterUpgrades,
            })
          : null,
      // İlk oyun (taze kayıt): kamera ilk görevin hedefine kısa pan → "hareketli" onboarding girişi.
      camFocus:
        save.questIndex === 0 && lifetime.lte(0)
          ? (() => {
              const p0 = questFocusPos(C.quests[0].target, save.tableLevels, derived.tables);
              return p0 ? { pos: [p0[0], p0[1], p0[2]] as [number, number, number], ttl: 3 } : null;
            })()
          : null,
      spawnTimer: 1,
      spawnZone: 0,
      saveTimer: SAVE_INTERVAL,
      nextId: 1,
    });
  },

  tick: (rawDt: number) => {
    const dt = Math.min(Math.max(rawDt, 0), 0.25);
    if (dt <= 0) return;
    const s = get();

    const npcs: Npc[] = s.npcs.map((n) => ({ ...n, pos: [...n.pos] as Vec3 }));
    // pos klonlanır (mıknatıs hareketinde mutasyon önceki state'i bozmasın).
    let coins: Coin[] = s.coins.map((c) => ({ ...c, pos: [...c.pos] as Vec3 }));
    let dishes: Dish[] = s.dishes.map((d) => ({ ...d, pos: [...d.pos] as Vec3 }));
    let wallet = s.wallet;
    let lifetime = s.lifetime;
    let padsDone = s.padsDone;
    let padFills = s.padFills;
    // D-015: tables/stations/serviceSpeedMult/hasWaiter/hasDishwasher padsDone'dan TÜRETİLİR (frame anlık
    // görüntüsü; tick içinde ayrıca mutasyona uğramaz — pad açılınca yalnız padsDone büyür, gerisi türetilir).
    const derived = derivedFromPads(padsDone);
    const tables = derived.tables;
    const zonesOpen = derived.zonesOpen;
    const serviceSpeedMult = derived.serviceSpeedMult;
    // Personelin oyuncudan kaçarken masaya itilmemesi için masa gövdeleri (navStep avoidSolids).
    const obstacles = tableSolids(tables);
    // Personel (garson/bulaşıkçı) BFS ızgarası — masa+zone sayısına göre cache'li.
    const navGrid = getNavGrid(tables, zonesOpen);
    const upgradeFills = s.upgradeFills.slice();
    let activeZone: ActiveZone | null = null;
    const stationLevels = s.stationLevels.slice(); // zone başına ocak seviyesi (bu tick'te yükselebilir)
    const waiterLevels = s.waiterLevels.slice();
    const tableLevels = s.tableLevels.slice(); // masa-başı seviyeler (kopya; bu tick'te yükseltilebilir)
    const readyCupsByZone = s.readyCupsByZone.slice();
    const brewProgressByZone = s.brewProgressByZone.slice();
    let tray = s.tray;
    let trayFood = s.trayFood; // tepsideki tost (M3)
    let cleanCups = s.cleanCups;
    let carriedDirty = s.carriedDirty;
    let carriedDirtyFood = s.carriedDirtyFood;
    const tableUpgradeFills = s.tableUpgradeFills.slice();
    const waiterUpgradeFills = s.waiterUpgradeFills.slice();
    let notice = s.notice;
    let revealSeen = s.revealSeen;
    let xp = s.xp; // toplam XP (bu tick'te eylem ödülleriyle artabilir; level türetilir)
    // Kalıcı eylem sayaçları (bu tick'te artabilir). waiterServedByZone dizisi de klonlanır (v21).
    const stats: SaveStats = { ...s.stats, waiterServedByZone: s.stats.waiterServedByZone.slice() };
    let questIndex = s.questIndex;
    let questBase = s.questBase;
    let camFocus = s.camFocus;
    // Kamera odak tetikleri aynı tick'te üst üste binebilir (reveal + görev geçişi + zone açılışı) —
    // 2026-06-11 fix: tick-içi ÖNCELİK (reveal 1 < görev 2 < zone 3); düşük öncelik yükseği EZEMEZ.
    let camPrio = 0;
    const requestFocus = (pos: RVec3, prio: number) => {
      if (prio >= camPrio) {
        camFocus = { pos: [pos[0], pos[1], pos[2]], ttl: CAM_FOCUS_TTL };
        camPrio = prio;
      }
    };
    let nextId = s.nextId;
    let spawnTimer = s.spawnTimer - dt;
    let spawnZone = s.spawnZone;

    // --- Ocak hazır-kuyruğu (demleme) — D-011 §3 + bardak döngüsü (Faz 2e §5), ZONE BAŞINA ---
    // Her açık zone'un ocağı kendi kuyruğuna demler (per-zone ocak, D-022); TEMİZ bardak GLOBAL havuzdan.
    for (let z = 0; z < zonesOpen; z++) {
      const queueCap = brewQueueCapacity(stationLevels[z]);
      // M3: hazırlama süresi zone'un ÜRÜNÜNDEN (çay 6sn / tost 14sn taban); kap havuzu ORTAK.
      const cupBrewTime = brewTime(stationLevels[z], serviceSpeedMult, PRODUCTS[zoneProduct(z)].prepTime);
      if (readyCupsByZone[z] < queueCap && cleanCups > 0) {
        brewProgressByZone[z] += dt;
        while (readyCupsByZone[z] < queueCap && cleanCups > 0 && brewProgressByZone[z] >= cupBrewTime) {
          readyCupsByZone[z] += 1;
          cleanCups -= 1;
          brewProgressByZone[z] -= cupBrewTime;
        }
      }
      if (readyCupsByZone[z] >= queueCap || cleanCups <= 0)
        brewProgressByZone[z] = Math.min(brewProgressByZone[z], cupBrewTime);
    }

    // Kirli masalar (D-019): eşiği aşan masalar müşteriye/garsona kapalı (temizlik baskısı).
    // Y2: eşik koltukla ölçeklenir → seviye gerekir.
    const dirty = dirtyTables(dishes, tableLevels);

    // --- Spawn (Y2 GRUP sistemi, plan §2) ---
    const activeCount = npcs.filter((n) => n.state !== 'leaving').length;
    // Müşteri tavanı KOLTUK+2 (masa değil — Y2; M3'ün masa+2 fix'inin koltuklu hali).
    let totalSeats = 0;
    for (let i = 0; i < tables; i++) totalSeats += tableSeats(tableLevels[i] ?? 0);
    const maxConcurrent = Math.max(C.npc.maxConcurrent, totalSeats + 2);
    if (spawnTimer <= 0 && activeCount < maxConcurrent) {
      const occ = occupiedSeats(npcs);
      const target = findTableForGroup(occ, tables, dirty, tableLevels, zonesOpen, spawnZone);
      if (target >= 0) {
        // Grup boyu zarla (%30/35/20/15); koltuk yetmezse KÜÇÜLÜR, tavan da aşılmaz.
        const seats = LAYOUT.tables[target].seats;
        const taken = occ.get(target) ?? new Set<number>();
        const freeSeats = tableSeats(tableLevels[target] ?? 0) - taken.size;
        const size = Math.min(rollGroupSize(Math.random()), freeSeats, maxConcurrent - activeCount);
        // KENDİ zone'unun sokağında belir → o zone'un kapısından girer (dış dünya hissi).
        // Üyeler sokakta hafif saçılır (üst üste binmesin); her üye FARKLI koltuğa atanır,
        // çay/timer/ödeme/bahşiş bireysel (ekonomi korunumu bozulmaz).
        const street = LAYOUT.streets[zoneOfTable(target)];
        let placed = 0;
        for (let k = 0; k < seats.length && placed < size; k++) {
          if (taken.has(k)) continue;
          npcs.push({
            id: nextId++,
            state: 'toTable',
            pos: [street[0] + (placed - (size - 1) / 2) * 0.55, street[1], street[2] + placed * 0.35],
            tableIndex: target,
            seatIndex: k,
            timer: 0,
            color: NPC_COLORS[Math.floor(Math.random() * NPC_COLORS.length)],
          });
          placed += 1;
        }
        spawnTimer += C.npc.spawnInterval;
        spawnZone = (zoneOfTable(target) + 1) % zonesOpen; // sıradaki grup bir SONRAKİ zone'dan başlasın
      } else {
        spawnTimer = 0; // koltuk boşalınca hemen denesin
      }
    }

    // --- NPC durum makinesi ---
    const step = NPC_SPEED * dt;
    const removed: number[] = [];
    for (const n of npcs) {
      const slot = LAYOUT.tables[n.tableIndex];
      // Müşteri KENDİ zone'unun kapısını/sokağını kullanır (zone-yerel hareket; bölme duvarı sorunu yok).
      const nEntrance = LAYOUT.entrances[zoneOfTable(n.tableIndex)];
      const nStreet = LAYOUT.streets[zoneOfTable(n.tableIndex)];
      switch (n.state) {
        case 'toTable': {
          // Önce KAPIYA (sokaktaysa düz yürü — dışarıda engel yok), sonra koltuğa BFS rotayla
          // (navStep): eksen-kayması (moveAvoid) ön-sıra masayı dolaşamayıp KİLİTLENİYORDU →
          // müşteri arka masaya hiç oturamıyor, masayı süresiz rezerve ediyordu (telefon bug'ı 2026-06-11).
          const goingIn = n.pos[2] > nEntrance[2] + 0.2;
          // Y2: hedef ATANAN koltuk (grup üyeleri aynı masada farklı koltuğa oturur).
          const seat = slot.seats[n.seatIndex];
          if (goingIn) {
            moveToward(n.pos, nEntrance, step);
          } else if (navStep(n.pos, seat, step, navGrid, 0.5)) {
            // Oturdu (koltuğa tam otur); çay servisini bekler. Sabır timer'ı başlar (D-011);
            // OTURDUĞU masanın seviyesi sabrı uzatır (Faz 2h).
            n.pos[0] = seat[0];
            n.pos[2] = seat[2];
            n.state = 'waitingForTea';
            n.timer = tablePatience(tableLevels[n.tableIndex] ?? 0, zoneProduct(zoneOfTable(n.tableIndex)));
          } else {
            // Sigorta: rota bulunamayıp uzun süre oturamadıysa vazgeçip gider — masa SÜRESİZ
            // rezerve kalamaz (timer toTable'da yürüme-süresi sayacı olarak kullanılır).
            n.timer += dt;
            if (n.timer > 30) n.state = 'leaving';
          }
          break;
        }
        case 'waitingForTea':
          // Çay artık OTO gelmez — oyuncu/garson tepsiyle bırakmalı. Sabır biterse sessizce gider.
          n.timer -= dt;
          if (n.timer <= 0) n.state = 'leaving';
          break;
        case 'drinking':
          n.timer -= dt;
          if (n.timer <= 0) {
            // Öde: parayı masanın yanına düşür — ÜRÜN fiyatı (çay 5 / tost 25, M3) + masa bahşişi (Faz 2h).
            // (turu-5'te kule istifi ve moneySpot saçılımı denendi; kullanıcı İKİSİNİ de beğenmedi →
            // ORİJİNAL davranış geri. Para sunumuna bir daha dokunmadan önce telefonda mockup onayı al.)
            coins.push({
              id: nextId++,
              pos: [slot.table[0] + (Math.random() - 0.5), 0.3, slot.table[2] + 0.6 + (Math.random() - 0.5)],
              value:
                PRODUCTS[zoneProduct(zoneOfTable(n.tableIndex))].price +
                tableTip(tableLevels[n.tableIndex] ?? 0),
            });
            // İçtiği bardak masada KİRLİ kalır (Faz 2e): toplanıp yıkanmalı, yoksa temiz biter.
            // tableIndex ile masaya etiketlenir (D-019): masa-başı eşik aşılınca masa KİRLİ olur.
            // ONBOARDING GATE (kullanıcı 2026-06-10): bulaşık MEKANİĞİ öğretilmeden (q_wash görevi
            // gelmeden) kirli bardak HİÇ çıkmaz — bardak doğrudan temiz havuza döner (korunum bozulmaz,
            // demleme durmaz). q_wash aktif olduğu andan itibaren kirli bırakılır → görevle birlikte öğrenilir.
            if (questIndex >= WASH_QUEST_INDEX) {
              dishes.push({
                id: nextId++,
                pos: [slot.table[0] + (Math.random() - 0.5) * 0.6, 0.95, slot.table[2] + (Math.random() - 0.5) * 0.6],
                tableIndex: n.tableIndex,
                kind: PRODUCTS[zoneProduct(zoneOfTable(n.tableIndex))].dish, // M3: bardak/tabak görseli
              });
            } else {
              cleanCups += 1;
            }
            n.state = 'leaving';
          }
          break;
        case 'leaving': {
          // Önce KAPIYA (içerdeyse BFS rotayla — masalara takılmaz), sonra SOKAĞA düz yürü.
          const nearDoor = n.pos[2] >= nEntrance[2] - 0.2 || dist2D(n.pos, nEntrance) <= 0.45;
          if (nearDoor) {
            if (moveToward(n.pos, nStreet, step)) removed.push(n.id);
          } else {
            navStep(n.pos, nEntrance, step, navGrid, 0.4);
          }
          break;
        }
      }
    }
    const liveNpcs = removed.length ? npcs.filter((n) => !removed.includes(n.id)) : npcs;

    // --- Oyuncu hareketi (D-016: mobilya collision'ı) ---
    // Collision YALNIZ input'la harekette uygulanır (eksen-başı kayma); doğrudan setState/__teleport
    // (testler/dev kancası) input'suz konum atadığında engellenmez → birim/smoke testleri etkilenmez.
    const jMag = Math.hypot(s.inputJoystick[0], s.inputJoystick[1]);
    const input = jMag > 0.05 ? s.inputJoystick : s.inputKeyboard;
    const pr = LAYOUT.playerRadius;
    const oldX = s.player[0];
    const oldZ = s.player[2];
    const moveSpeed = playerSpeedFor(s.charUpgrades.speed); // hız kademesinden (v20)
    const dxIn = input[0] * moveSpeed * dt;
    const dzIn = input[1] * moveSpeed * dt;
    // Oyuncu yalnız AÇIK zone'ların BİRLEŞİMİNDE gezer (M2 union kelepçesi; L-şekil destekli —
    // kilitli salonun "boş arsa"sına girilmez).
    let [nx, nz] = clampToOpenZones(oldX + dxIn, oldZ + dzIn, zonesOpen);
    if (dxIn !== 0 || dzIn !== 0) {
      // MOBİLYA = KATI engel: yeni bir engele GİRİŞ bloklanır (eksen-başı kayma; kafa kafaya gelince durur).
      // AMA oyuncu zaten bir engelin İÇİNDEyse (ör. üstünde masa açıldı) kilitlenmesin → çıkışına izin ver
      // (aktör collision'ındaki desenin aynısı). Böylece "zorlasan da giremezsin" korunur ama hapsolmazsın.
      const furn = activeSolids(tables, zonesOpen);
      const stuckInFurn = hitsSolid(oldX, oldZ, furn, pr);
      if (dxIn !== 0 && hitsSolid(nx, oldZ, furn, pr) && !stuckInFurn) nx = oldX;
      if (dzIn !== 0 && hitsSolid(nx, nz, furn, pr) && !stuckInFurn) nz = oldZ;
      // AKTÖR çarpışması KALDIRILDI (turu-5 m.9): oyuncu müşteri/personel kalabalığının içinden
      // geçer (kalabalıkta yürünemiyordu). Personel zaten navStep separation'ıyla oyuncuya yol verir.
    }
    const player = [nx, s.player[1], nz] as Vec3;

    // --- Para mıknatısı + toplama (Faz 2f juice) ---
    // attractRadius içine giren para oyuncuya doğru GERÇEKTEN akar (hız > oyuncu hızı → daima yetişir),
    // pickupRadius'a varınca toplanır. Mıknatıs store'da yapıldığı için görsel = mantık → "yapışıp
    // toplanmayan para" bug'ı yapısal olarak imkansız (Coins.tsx sadece c.pos'u çizer).
    if (coins.length) {
      const attractR = attractRadiusFor(s.charUpgrades.magnet); // mıknatıs kademesinden (v20)
      const keep: Coin[] = [];
      for (const c of coins) {
        if (dist2D(player, c.pos) < attractR) {
          moveToward(c.pos, player, C.money.attractSpeed * dt);
        }
        if (dist2D(player, c.pos) < C.money.pickupRadius) {
          wallet = wallet.add(c.value);
          lifetime = lifetime.add(c.value);
          stats.coinsCollected += 1;
        } else {
          keep.push(c);
        }
      }
      coins = keep;
    }

    // --- Servis (D-011): ocakta tepsiyi doldur, bekleyen masalara çay bırak (yakınlık) ---
    const trayCap = trayCapacity(s.charUpgrades.tray);
    // Ocağa yaklaşınca hazır çaylardan tepsi dolar (herhangi bir açık ocak yeterli).
    // PAYLAŞIMLI kapasite (2026-06-09): çay + kirli aynı tepsiyi paylaşır → toplam trayCap'i aşamaz.
    // Karışık taşımaya izin verilir (eski "eli boşken" kısıtı kaldırıldı; deadlock'u engeller).
    if (tray + trayFood + carriedDirty + carriedDirtyFood < trayCap) {
      for (let z = 0; z < zonesOpen; z++) {
        if (readyCupsByZone[z] > 0 && dist2D(player, LAYOUT.stations[z]) < C.serving.pickupRadius) {
          const take = Math.min(trayCap - tray - trayFood - carriedDirty - carriedDirtyFood, readyCupsByZone[z]);
          // M3: istasyonun ürünü tepsinin DOĞRU bölmesine gider (çay/tost ayrı sayaç, kapasite ortak).
          if (zoneProduct(z) === 'tost') trayFood += take;
          else tray += take;
          readyCupsByZone[z] -= take;
          if (take > 0) stats.teaPickups += take; // generic "üründen al" sayacı (görevler ortak)
          break;
        }
      }
    }
    // Bekleyen masaya yaklaşınca tepsiden ÜRÜN bırak → müşteri içmeye/yemeye başlar (toplu servis).
    // M3: müşterinin istediği ürün = masasının zone'unun ürünü; tepside O ürün yoksa servis OLMAZ
    // (çayla tost müşterisi doyurulamaz). Servis MASAYA yakınlıkla (her taraftan).
    if (tray > 0 || trayFood > 0) {
      for (const n of liveNpcs) {
        if (tray <= 0 && trayFood <= 0) break;
        if (n.state !== 'waitingForTea') continue;
        const sz = zoneOfTable(n.tableIndex);
        const wantsFood = zoneProduct(sz) === 'tost';
        if (wantsFood ? trayFood <= 0 : tray <= 0) continue;
        if (dist2D(player, LAYOUT.tables[n.tableIndex].table) < C.serving.serveRadius) {
          n.state = 'drinking';
          n.timer = C.npc.eatTime;
          if (wantsFood) trayFood -= 1;
          else tray -= 1;
          stats.teasServed += 1;
          // v23: zone'lu serveTea görevleri o salonu sayar (tost servisi de zone sayacına işler).
          stats.teasServedByZone[sz] = (stats.teasServedByZone[sz] ?? 0) + 1;
          xp += C.xp.perTeaServed;
        }
      }
    }

    // --- Bardak döngüsü (Faz 2e): oyuncu masadaki kirli bardakları toplar, bulaşıkta yıkar (yakınlık) ---
    // PAYLAŞIMLI kapasite (2026-06-09): çay taşırken de kirli toplanabilir → toplam trayCap'i aşamaz.
    if (tray + trayFood + carriedDirty + carriedDirtyFood < trayCap && dishes.length) {
      const keep: Dish[] = [];
      for (const d of dishes) {
        if (tray + trayFood + carriedDirty + carriedDirtyFood < trayCap && dist2D(player, d.pos) < C.cups.collectRadius) {
          // turu-5 m.11: kirli kabın TÜRÜ tepsi görseline taşınır (tabak ≠ bardak); havuz/yıkama ortak.
          if (d.kind === 'plate') carriedDirtyFood += 1;
          else carriedDirty += 1;
        } else keep.push(d);
      }
      dishes = keep;
    }
    // HERHANGİ açık zone'un bulaşık noktasına yaklaşınca taşınan kirliler yıkanır → GLOBAL temiz havuza.
    if (carriedDirty + carriedDirtyFood > 0) {
      for (let z = 0; z < zonesOpen; z++) {
        if (dist2D(player, LAYOUT.dishStations[z]) < C.cups.washRadius) {
          const washed = carriedDirty + carriedDirtyFood;
          cleanCups += washed;
          stats.dishesWashed += washed;
          xp += C.xp.perDishWashed * washed;
          carriedDirty = 0;
          carriedDirtyFood = 0;
          break;
        }
      }
    }

    // --- Garson (D-012 kısmi assist), ZONE BAŞINA: kendi zone'unun ocağından alır, kendi zone'unun
    // bekleyen masalarına götürür (per-zone personel, D-022). Oyuncudan yavaş.
    // Y4: zone başına 2 garsona kadar + CLAIM — 1. garson en acil masayı alır, 2. garson o masayı
    // HARİÇ tutar (deterministik; çift-hedef kargaşası/salınım yok). Sıra sabit: önce 1., sonra 2.
    const waiters: (Waiter | null)[] = s.waiters.slice();
    const waiters2: (Waiter | null)[] = s.waiters2.slice();
    for (let z = 0; z < MAX_ZONES; z++) {
      const wCount = z < zonesOpen ? derived.waiterCountByZone[z] : 0;
      if (wCount === 0) {
        waiters[z] = null;
        waiters2[z] = null;
        continue;
      }
      const wStep = waiterSpeed(waiterLevels[z]) * dt;
      // Y3: tepsi kapasitesi panel yükseltmesinden türetilir (çay garsonları ortak eğri, tostçu ayrı).
      const wTrayCap = waiterTrayCapacityFor(
        zoneProduct(z) === 'tost' ? 'tost' : 'tea',
        zoneProduct(z) === 'tost' ? s.waiterUpgrades.tostTray : s.waiterUpgrades.teaTray,
      );
      const claimed = new Set<number>(); // bu tick'te hedeflenen masa index'leri (Y4 claim)
      const runWaiter = (prev: Waiter | null, homeX: number): Waiter => {
        const home: Vec3 = [LAYOUT.waiterHomes[z][0] + homeX, 0, LAYOUT.waiterHomes[z][2]];
        const w: Waiter = prev
          ? { pos: [...prev.pos] as Vec3, tray: prev.tray }
          : { pos: [...home] as Vec3, tray: 0 };
        // Garson kirli masaya çay GÖTÜRMEZ (D-019) + yalnız KENDİ zone'unun masalarına bakar.
        // Her garson için YENİDEN filtrelenir (1. garsonun bu tick servis ettiği müşteri düşer).
        const waitingNpcs = liveNpcs.filter(
          (n) => n.state === 'waitingForTea' && !dirty.has(n.tableIndex) && zoneOfTable(n.tableIndex) === z,
        );
        // Claim: diğer garsonun hedeflediği masa hariç (yalnız teslimat hedefi seçiminde).
        const claimable = waitingNpcs.filter((n) => !claimed.has(n.tableIndex));
        if (w.tray > 0 && claimable.length > 0) {
          // Teslimat: en ACİL (sabrı en az kalan) bekleyene; eşitlikte en yakın (anti-starvation).
          let best = claimable[0];
          let bestTimer = Infinity;
          let bestDist = Infinity;
          for (const n of claimable) {
            const d = dist2D(w.pos, LAYOUT.tables[n.tableIndex].table);
            if (n.timer < bestTimer - 1e-6 || (Math.abs(n.timer - bestTimer) <= 1e-6 && d < bestDist)) {
              bestTimer = n.timer;
              bestDist = d;
              best = n;
            }
          }
          claimed.add(best.tableIndex);
          const targetTable = LAYOUT.tables[best.tableIndex].table;
          if (navStep(w.pos, targetTable, wStep, navGrid, REACH_TABLE, player, obstacles)) {
            // Y3 (plan §3): TEK durakta o masada bekleyen HERKESE tepsi yettiğince bırakır
            // (grup + tepsi-3 = tek seferde; artan çayla sıradaki acil masaya devam eder).
            for (const n of waitingNpcs) {
              if (w.tray <= 0) break;
              if (n.tableIndex !== best.tableIndex) continue;
              n.state = 'drinking';
              n.timer = C.npc.eatTime;
              w.tray -= 1;
              stats.waiterServed += 1;
              stats.waiterServedByZone[z] = (stats.waiterServedByZone[z] ?? 0) + 1; // v21: zone-başı sayaç
              xp += C.xp.perWaiterServed;
            }
          }
        } else if (w.tray < wTrayCap && waitingNpcs.length > 0) {
          // Yükleme: KENDİ zone'unun ocağının ÖN yüzüne git (bardaklar önde); varınca tepsiye al.
          if (
            navStep(w.pos, LAYOUT.stationPickups[z], wStep, navGrid, REACH_PICKUP, player, obstacles) &&
            readyCupsByZone[z] > 0
          ) {
            const take = Math.min(wTrayCap - w.tray, readyCupsByZone[z]);
            w.tray += take;
            readyCupsByZone[z] -= take;
          }
        } else {
          // Boşta: kendi köşesine dön (2. garson 1.'in 0.7 sağında bekler — üst üste binmez).
          navStep(w.pos, home, wStep, navGrid, REACH_HOME, player, obstacles);
        }
        return w;
      };
      waiters[z] = runWaiter(waiters[z], 0);
      waiters2[z] = wCount >= 2 ? runWaiter(waiters2[z], 0.7) : null;
    }

    // --- Bulaşıkçı (Faz 2e kısmi assist), ZONE BAŞINA: kendi zone'unun kirlilerini toplar,
    // kendi zone'unun bulaşık noktasında yıkar (per-zone bulaşık köşesi, D-022).
    const dishwashers: (Waiter | null)[] = s.dishwashers.slice();
    for (let z = 0; z < MAX_ZONES; z++) {
      if (z >= zonesOpen || !derived.hasDishwasherByZone[z]) {
        dishwashers[z] = null;
        continue;
      }
      const prevDw = dishwashers[z];
      const dw: Waiter = prevDw
        ? { pos: [...prevDw.pos] as Vec3, tray: prevDw.tray }
        : { pos: [...LAYOUT.dishwasherHomes[z]] as Vec3, tray: 0 };
      const dStep = C.dishwasher.moveSpeed * dt;
      const dCap = dishCarryCapacityFor(s.waiterUpgrades.dishCarry);
      const zoneDishes = dishes.filter((d) => zoneOfTable(d.tableIndex) === z);
      if (dw.tray >= dCap || (dw.tray > 0 && zoneDishes.length === 0)) {
        // Dolu (ya da elinde var ama toplanacak kalmadı) → KENDİ zone'unun bulaşığında yıka.
        if (navStep(dw.pos, LAYOUT.dishStations[z], dStep, navGrid, REACH_WASH, player, obstacles)) {
          cleanCups += dw.tray;
          dw.tray = 0;
        }
      } else if (zoneDishes.length > 0) {
        // Topla: kendi zone'undaki en yakın kirli bardağa yaklaş; collectRadius'a girince al.
        let target = zoneDishes[0];
        let td = Infinity;
        for (const d of zoneDishes) {
          const dd = dist2D(dw.pos, d.pos);
          if (dd < td) { td = dd; target = d; }
        }
        if (navStep(dw.pos, target.pos, dStep, navGrid, C.cups.collectRadius, player, obstacles)) {
          dishes = dishes.filter((d) => d.id !== target.id);
          dw.tray += 1;
        }
      } else {
        // Boşta: kendi zone'unun köşesine dön.
        navStep(dw.pos, LAYOUT.dishwasherHomes[z], dStep, navGrid, REACH_HOME, player, obstacles);
      }
      dishwashers[z] = dw;
    }

    // --- Mekânsal etkileşim noktaları (D-018 §2, HAREKET-TEMELLİ) ---
    // Oyuncu fiziksel olarak aynı anda TEK dolum noktasının üstünde olabilir. Para yalnız oyuncu DURUNCA akar:
    // üstünden GEÇERKEN (hareket halinde) hiç alınmaz, DURDUĞU (input bıraktığı) anda HEMEN başlar (sayaç/countdown YOK).
    const padGate: GateState = {
      padsDone,
      tables,
      stationLevel: stationLevels[0],
      lifetime: lifetime.toNumber(),
      waiterServed: stats.waiterServed,
      waiterServedByZone: stats.waiterServedByZone,
      tableLevels, // Y4: allZoneTablesLevel gate'i (2. garson pad'leri)
    };
    // EKRANDA TEK PAD (quest sistemi): görünürlük visiblePads'ten (Pad.tsx ile aynı kaynak).
    const activePads: PadDef[] = visiblePads(questIndex, padGate);

    // --- Yeni-özellik bildirimi (D-019 §4; v21 zone-başına) ---
    // Bir ikincil özellik (yükseltme/personel) İLK kez açıldığında kısa toast + pan. revealSeen baseline
    // init'te kurulduğu için zaten açık olanlar tekrar bildirmez (yeniden-yükleme spam'ı yok; persist gerekmez).
    // turu-5 m.8: karakter-butonu spotlight'ı bekliyorsa (charStat görevi aktif + panel hiç açılmamış)
    // reveal kamera panı BASTIRILIR — ekranda tek yönlendirme kalır (table2 bitişi ertesi tick'te
    // "çay yükselt" reveal'ını ateşliyordu; kamera oraya kayarken spotlight char butonunu gösteriyordu).
    const spotlightPending =
      questIndex < C.quests.length &&
      C.quests[questIndex].target.type === 'charStat' &&
      !s.charPanelSeen;
    for (const [key, text, rp] of revealKeys(padGate, zonesOpen, stationLevels, derived.hasWaiterByZone, waiterLevels)) {
      if (!revealSeen.includes(key)) {
        revealSeen = [...revealSeen, key];
        notice = { text, ttl: 4.5, kind: 'reveal' };
        // Yeni açılan noktaya anlık kamera pan ("orada bir şey var" — kullanıcı isteği 2026-06-09).
        if (rp && !spotlightPending) requestFocus(rp, 1);
      }
    }
    if (notice) {
      const ttl = notice.ttl - dt;
      notice = ttl > 0 ? { ...notice, ttl } : null;
    }

    // Oyuncu DURUYOR mu? (input ~0). Para yalnız dururken akar → üstünden geçerken (hareket) alınmaz.
    const fillReady = Math.hypot(input[0], input[1]) <= 0.1;

    // Oyuncunun şu an üstünde durduğu dolum noktasının kanonik id'si (pad.id / 'tea:z' / 'waiterUp:z' / 'tableUp:i').
    let onFillId: string | null = null;
    for (const pad of activePads) {
      const pp = LAYOUT.padPos[pad.id];
      if (pp && dist2D(player, pp) < PAD_RADIUS) { onFillId = pad.id; break; }
    }
    // GUARD (gece fix 2026-06-10): oyuncu AÇIK bir ocağın pickup yarıçapındaysa niyeti ÇAY ALMAK'tır —
    // yükseltme dolumu kesinlikle başlamaz (mekânsal ayrımın yanında ikinci emniyet).
    let inPickupRange = false;
    for (let z = 0; z < zonesOpen; z++)
      if (dist2D(player, LAYOUT.stations[z]) < C.serving.pickupRadius) { inPickupRange = true; break; }
    if (!onFillId && !inPickupRange) {
      for (let z = 0; z < zonesOpen; z++) {
        if (!upgradeZoneUnlockedZ(z, padGate) || stationLevels[z] >= stationSoftMaxLevel()) continue;
        if (dist2D(player, LAYOUT.upgradeZones[z]) < PAD_RADIUS) { onFillId = FILL_TEA + z; break; }
      }
    }
    if (!onFillId) {
      for (let z = 0; z < zonesOpen; z++) {
        if (!derived.hasWaiterByZone[z]) continue;
        if (!waiterUpgradeUnlockedZ(z, padGate, waiterLevels[z])) continue;
        if (dist2D(player, LAYOUT.waiterUpgradeSpots[z]) < WAITER_UP_RADIUS) { onFillId = FILL_WAITER + z; break; }
      }
    }
    if (!onFillId) {
      for (let i = 0; i < tables; i++) {
        // v21: her masanın yükseltmesi KENDİ zone'unun gate'ine bağlı (o salonun 4 masası açık mı).
        if (!tableUpgradeUnlockedZ(zoneOfTable(i), padGate)) continue;
        if (tableLevels[i] >= tableSoftMaxLevel()) continue;
        if (dist2D(player, LAYOUT.tables[i].upgradeSpot) < TABLE_UP_RADIUS) { onFillId = FILL_TABLE + i; break; }
      }
    }

    // --- Pad doldurma (omurga + opsiyonel; her pad açtığı objenin yerinde) ---
    const activePad = onFillId ? activePads.find((p) => p.id === onFillId) : undefined;
    if (activePad) {
      const padPos = LAYOUT.padPos[activePad.id]!;
      let fill = padFills[activePad.id] ?? 0;
      if (fillReady && wallet.gt(0)) {
        const amt = Math.min(activePad.fillRate * dt, wallet.toNumber(), activePad.cost - fill);
        if (amt > 0) {
          fill += amt;
          wallet = wallet.sub(amt);
        }
      }
      if (fill >= activePad.cost) {
        // Pad tamamlandı: SADECE padsDone'a ekle (etkiler türetilir, D-015), kısmi dolumu temizle.
        padsDone = [...padsDone, activePad.id];
        xp += C.xp.perPad;
        const rest = { ...padFills };
        delete rest[activePad.id];
        padFills = rest;
        activeZone = null;
        // Zone açılışı (Faz 3a): yeni salon kendi bardak stoğuyla gelir + kamera yeni salona pan
        // ("orada yeni bir dünya var" hissi — quest kamerası ayrıca sıradaki göreve döner).
        if (activePad.effect.type === 'unlockZone') {
          cleanCups += C.cups.poolBase;
          // Yeni açılan zone'un merkezine pan (M2: zone index pad listesinden değil, AÇILMIŞ sayıdan).
          const zNew = Math.min(MAX_ZONES, derivedFromPads(padsDone).zonesOpen) - 1;
          const za = LAYOUT.zoneAreas[zNew];
          requestFocus([(za.minX + za.maxX) / 2, 0, (za.minZ + za.maxZ) / 2], 3); // en yüksek öncelik
        }
        // Masa pad'i oyuncunun DURDUĞU yerde belirir → oyuncu masanın içinde kalmasın, anında dışarı it.
        if (activePad.effect.type === 'addTable') {
          // En geniş masa yarısı (yemek masası 0.7) — push-out hiçbir masa tipinde içeride bırakmaz.
          const out = LAYOUT.foodTableHalf[0] + pr + 0.1;
          let ex = player[0] - padPos[0];
          let ez = player[2] - padPos[2];
          const ed = Math.hypot(ex, ez);
          if (ed < out) {
            if (ed < 1e-4) { ex = 0; ez = 1; } else { ex /= ed; ez /= ed; }
            player[0] = padPos[0] + ex * out;
            player[2] = padPos[2] + ez * out;
          }
        }
      } else {
        padFills = { ...padFills, [activePad.id]: fill };
        activeZone = { kind: 'pad', label: activePad.label, fill, cost: activePad.cost };
      }
    }

    // --- Mekânsal çay yükseltme noktası (ZONE BAŞINA; ocağın önünde dur → altta bar dolar) ---
    // Biriken ₺ KORUNUR (çıkınca sıfırlanmaz; D-018 dwell) → para harcanıp boşa gitmez.
    if (onFillId != null && onFillId.startsWith(FILL_TEA)) {
      const z = Number(onFillId.slice(FILL_TEA.length));
      const cost = stationUpgradeCostZ(z, stationLevels[z]); // M3: tost tezgâhı kendi maliyet çarpanıyla
      if (fillReady && wallet.gt(0)) {
        const amt = Math.min(upgradeFillRateFor(cost) * dt, wallet.toNumber(), cost - upgradeFills[z]);
        if (amt > 0) {
          upgradeFills[z] += amt;
          wallet = wallet.sub(amt);
        }
      }
      if (upgradeFills[z] >= cost) {
        stationLevels[z] += 1;
        xp += C.xp.perUpgrade;
        upgradeFills[z] = 0;
        cleanCups += C.cups.poolPerLevel; // havuz ocak seviyesiyle büyür (Faz 2e; global depo)
      }
      const lv = stationLevels[z];
      const nextCost = lv < stationSoftMaxLevel() ? stationUpgradeCostZ(z, lv) : cost;
      const unitName = zoneProduct(z) === 'tost' ? 'Tost Tezgâhı' : 'Çay Ocağı';
      // GÖRSEL: istasyon L1'den başlar (iç seviye 0-tabanlı; etiket +1). Soft max → "Usta" (💎/video, Faz 4).
      activeZone = {
        kind: 'upgrade',
        label: `${unitName} L${lv + 1}${lv < stationSoftMaxLevel() ? ` → L${lv + 2}` : ' (Usta 💎)'}`,
        fill: upgradeFills[z],
        cost: nextCost,
      };
    }

    // --- Mekânsal garson hız yükseltme (D-018 §6, ZONE BAŞINA): o zone'un noktasında dur → garsonu hızlanır.
    // Biriken ₺ KORUNUR (çıkınca sıfırlanmaz; D-018 dwell). Tek seviye (L1→L2); sonrası max → işaret kapanır.
    if (onFillId != null && onFillId.startsWith(FILL_WAITER)) {
      const z = Number(onFillId.slice(FILL_WAITER.length));
      const cost = C.waiter.upgradeCost;
      if (fillReady && wallet.gt(0)) {
        const amt = Math.min(upgradeFillRateFor(cost) * dt, wallet.toNumber(), cost - waiterUpgradeFills[z]);
        if (amt > 0) {
          waiterUpgradeFills[z] += amt;
          wallet = wallet.sub(amt);
        }
      }
      if (waiterUpgradeFills[z] >= cost) {
        waiterLevels[z] += 1;
        xp += C.xp.perUpgrade;
        waiterUpgradeFills[z] = 0;
      }
      const lv = waiterLevels[z];
      // GÖRSEL: garson L1'den başlar (iç seviye 0-tabanlı; etiket +1). Soft max sonrası işaret görünmez.
      activeZone = {
        kind: 'upgrade',
        label: `Garson L${lv + 1}${lv < waiterSoftMaxLevelCfg() ? ` → L${lv + 2} (hız)` : ''}`,
        fill: waiterUpgradeFills[z],
        cost,
      };
    }

    // --- Mekânsal masa yükseltme (Faz 2h, MASA-BAŞI / My Hotel): açık masanın KENARINDAKİ noktada dur → o masanın
    // bahşişi + sabrı artar. Gating: 2. masa açılınca belirir (D-018 §1: işaretler kenara taşındı). ---
    if (onFillId != null && onFillId.startsWith(FILL_TABLE)) {
      const i = Number(onFillId.slice(FILL_TABLE.length));
      const cost = tableNextCost(tableLevels[i]);
      let fill = tableUpgradeFills[i] ?? 0;
      if (fillReady && wallet.gt(0)) {
        const amt = Math.min(upgradeFillRateFor(cost) * dt, wallet.toNumber(), cost - fill);
        if (amt > 0) {
          fill += amt;
          wallet = wallet.sub(amt);
        }
      }
      if (fill >= cost) {
        tableLevels[i] += 1;
        xp += C.xp.perUpgrade;
        fill = 0;
      }
      tableUpgradeFills[i] = fill;
      const nextCost = tableLevels[i] < tableSoftMaxLevel() ? tableNextCost(tableLevels[i]) : cost;
      // GÖRSEL: masa L1'den başlar (iç tableLevels 0-tabanlı; etiket +1). Soft max → "Usta" (💎/video, Faz 4).
      activeZone = {
        kind: 'upgrade',
        label: `Masa ${i + 1}: L${tableLevels[i] + 1}${tableLevels[i] < tableSoftMaxLevel() ? ` → L${tableLevels[i] + 2} (+${C.tables.tipBase} bahşiş)` : ' (Usta 💎)'}`,
        fill,
        cost: nextCost,
      };
    }

    // --- D-015: padsDone değiştiyse türetilen alanlar yeniden hesaplanır (tek yazım noktası) ---
    const out = derivedFromPads(padsDone);
    // Personel pad'i bu frame tamamlandıysa varlığını KENDİ zone'unda kur (türetilir).
    for (let z = 0; z < out.zonesOpen; z++) {
      if (out.hasWaiterByZone[z] && !waiters[z])
        waiters[z] = { pos: [...LAYOUT.waiterHomes[z]] as Vec3, tray: 0 };
      if (out.hasDishwasherByZone[z] && !dishwashers[z])
        dishwashers[z] = { pos: [...LAYOUT.dishwasherHomes[z]] as Vec3, tray: 0 };
    }

    // --- GÖREV İLERLEMESİ ---
    // Aktif görev karşılandıysa sıradakine geç (aynı tick'te birden çok karşılanabilir — ör. migrasyon
    // sonrası): tamamlama toast'u + kamera YENİ hedefe pan ("orada bir şey var" hissi, kullanıcı isteği).
    const questCtx: QuestCtx = {
      padsDone,
      stationLevels,
      waiterLevel: waiterLevels[0],
      tableLevels,
      stats,
      questBase,
      charUpgrades: s.charUpgrades,
      waiterUpgrades: s.waiterUpgrades,
    };
    let questAdvanced = false;
    while (questIndex < C.quests.length && questTargetMet(C.quests[questIndex].target, questCtx)) {
      // Görev ödülü (M1): tamamlanınca cüzdana ₺ — toast'ta coin + tutar gösterilir.
      const qReward = C.quests[questIndex].reward ?? 0;
      if (qReward > 0) {
        wallet = wallet.add(qReward);
        lifetime = lifetime.add(qReward);
      }
      notice = { text: C.quests[questIndex].title, ttl: 3.5, kind: 'quest', reward: qReward > 0 ? qReward : undefined };
      questIndex += 1;
      xp += C.xp.perQuest;
      questAdvanced = true;
      // Sonraki sayaç görevinin delta tabanı = sayacın ŞU ANKİ değeri.
      const nt = questIndex < C.quests.length ? C.quests[questIndex].target : null;
      const counterNow = nt ? questCounterValue(nt, stats) : null;
      questBase = counterNow ?? 0;
      questCtx.questBase = questBase;
    }
    if (questAdvanced && questIndex < C.quests.length) {
      const q = C.quests[questIndex];
      if (q.target.type === 'charStat' && !s.charPanelSeen) {
        // turu-5 m.8: charStat görevi + spotlight bekliyorsa AYNI tick'teki reveal panı da İPTAL —
        // ekranda tek yönlendirme kalır (spotlight). (table2 bitişi hem yükseltme-noktası reveal'ını
        // hem q_charTray1 spotlight'ını tetikliyordu; kamera "çay yükselt"e kayarken ekran kararıyordu.)
        camFocus = null;
      } else {
        const fp = questFocusPos(q.target, tableLevels, out.tables, q.zone ?? 0);
        if (fp) requestFocus(fp, 2); // charStat görevinde 3D hedef yok → kamera sıçramaz (buton efekti yönlendirir)
      }
    }
    // Kamera odağı: joystick/klavye girdisi iptal eder (oyuncu kontrolü üstün); süre dolunca biter.
    // Deadzone 0.25 (2026-06-11 fix: 0.1 joystick titremesinde odağı yanlışlıkla bozuyordu).
    if (camFocus) {
      const ttl = camFocus.ttl - dt;
      const moving = Math.hypot(input[0], input[1]) > 0.25;
      camFocus = ttl > 0 && !moving ? { pos: camFocus.pos, ttl } : null;
    }
    const quest =
      questIndex < C.quests.length ? questView(C.quests[questIndex], questCtx) : null;

    // --- Level-up bildirimi: toplam XP bu tick'te seviye atlattıysa toast (görev toast'ını ezebilir;
    // seviye daha nadir ve daha büyük haber). Level ayrı saklanmaz — levelProgress(xp) türetir. ---
    if (xp !== s.xp) {
      const before = levelProgress(s.xp).level;
      const after = levelProgress(xp).level;
      if (after > before) notice = { text: `Seviye ${after}!`, ttl: 4.5, kind: 'level' };
    }

    // --- Periyodik kayıt ---
    let saveTimer = s.saveTimer - dt;
    if (saveTimer <= 0) {
      saveTimer = SAVE_INTERVAL;
      get().saveNow();
    }

    set({
      npcs: liveNpcs,
      coins,
      dishes,
      wallet,
      lifetime,
      tables: out.tables,
      stations: out.stations,
      zonesOpen: out.zonesOpen,
      stationLevels,
      tableLevels,
      waiterLevels,
      serviceSpeedMult: out.serviceSpeedMult,
      padsDone,
      padFills,
      upgradeFills,
      tableUpgradeFills,
      waiterUpgradeFills,
      activeZone,
      notice,
      revealSeen,
      stats,
      questIndex,
      questBase,
      xp,
      quest,
      camFocus,
      player,
      waiters,
      waiters2,
      dishwashers,
      readyCupsByZone,
      brewProgressByZone,
      tray,
      trayFood,
      cleanCups,
      carriedDirty,
      carriedDirtyFood,
      spawnTimer,
      spawnZone,
      saveTimer,
      nextId,
      npcCount: liveNpcs.length,
    });
  },

  setKeyboardInput: (x, z) => set({ inputKeyboard: [x, z] }),
  setJoystickInput: (x, z) => set({ inputJoystick: [x, z] }),

  // Zone-1 çay ocağı yükseltme (₺ ile L1-L4; dev kancası/test). L5 Usta = 💎/video (Faz 4).
  upgradeStation: () => {
    const s = get();
    if (s.stationLevels[0] >= stationSoftMaxLevel()) return false;
    const cost = stationUpgradeCost(s.stationLevels[0]);
    if (s.wallet.lt(cost)) return false;
    const stationLevels = s.stationLevels.slice();
    stationLevels[0] += 1;
    set({
      wallet: s.wallet.sub(cost),
      stationLevels,
      xp: s.xp + C.xp.perUpgrade,
      cleanCups: s.cleanCups + C.cups.poolPerLevel, // havuz ocak seviyesiyle büyür (Faz 2e)
    });
    get().saveNow();
    return true;
  },

  // Test/geliştirme yardımcısı: cüzdana para ekle.
  addMoney: (amount) => {
    const s = get();
    set({ wallet: s.wallet.add(amount), lifetime: s.lifetime.add(amount) });
  },

  // Görev barına dokununca: kamera aktif görevin hedefine kayar (kullanıcı onboarding isteği).
  focusQuest: () => {
    const s = get();
    if (s.questIndex >= C.quests.length) return;
    const q = C.quests[s.questIndex];
    const p = questFocusPos(q.target, s.tableLevels, s.tables, q.zone ?? 0);
    if (p) set({ camFocus: { pos: [p[0], p[1], p[2]], ttl: CAM_FOCUS_TTL } });
  },

  setSetting: (key, value) => {
    set({ settings: { ...get().settings, [key]: value } });
    get().saveNow();
  },

  // Kozmetik tema satın al/uygula (WP6 — feedback §D19). Zone açık + tema tanımlı olmalı;
  // sahip değilse cüzdandan düşer (yetmezse false), sahipse ücretsiz uygulanır.
  buyCosmetic: (kind, id, zone) => {
    const s = get();
    if (zone < 0 || zone >= s.zonesOpen) return false;
    const themes = kind === 'floor' ? C.cosmetics.floorThemes : C.cosmetics.wallThemes;
    const theme = themes.find((t) => t.id === id);
    if (!theme) return false;
    const key = `${kind}:${id}:z${zone}`;
    let wallet = s.wallet;
    let ownedCosmetics = s.ownedCosmetics;
    if (theme.cost > 0 && !ownedCosmetics.includes(key)) {
      if (wallet.lt(theme.cost)) return false;
      wallet = wallet.sub(theme.cost);
      ownedCosmetics = [...ownedCosmetics, key];
    }
    const arrKey = kind === 'floor' ? 'floorThemeByZone' : 'wallThemeByZone';
    const arr = (kind === 'floor' ? s.floorThemeByZone : s.wallThemeByZone).slice();
    arr[zone] = id;
    set({ wallet, ownedCosmetics, [arrKey]: arr });
    get().saveNow();
    return true;
  },

  // Karakter özelliği satın al (v20 — panel butonundan; mekânsal pad değil, kullanıcı onaylı tasarım).
  buyCharUpgrade: (stat) => {
    const s = get();
    const tier = s.charUpgrades[stat];
    const cost = charNextCost(stat, tier);
    if (cost == null || s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      charUpgrades: { ...s.charUpgrades, [stat]: tier + 1 },
      xp: s.xp + C.xp.perUpgrade,
    });
    get().saveNow();
    return true;
  },

  // Garson tepsi kademesi satın al (Y3 — karakter panelinin garson sekmelerinden; buyCharUpgrade deseni).
  buyWaiterTray: (kind) => {
    const s = get();
    const key = kind === 'tea' ? 'teaTray' : 'tostTray';
    const tier = s.waiterUpgrades[key];
    const cost = waiterTrayNextCost(kind, tier);
    if (cost == null || s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      waiterUpgrades: { ...s.waiterUpgrades, [key]: tier + 1 },
      xp: s.xp + C.xp.perUpgrade,
    });
    get().saveNow();
    return true;
  },

  // Bulaşıkçı leğen kademesi satın al (v28 — Bulaşıkçı sekmesi; buyWaiterTray deseni).
  buyDishCarry: () => {
    const s = get();
    const tier = s.waiterUpgrades.dishCarry;
    const cost = dishCarryNextCost(tier);
    if (cost == null || s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      waiterUpgrades: { ...s.waiterUpgrades, dishCarry: tier + 1 },
      xp: s.xp + C.xp.perUpgrade,
    });
    get().saveNow();
    return true;
  },

  markCharPanelSeen: () => {
    if (get().charPanelSeen) return;
    set({ charPanelSeen: true });
    get().saveNow();
  },

  // Y1: çay ve tost AYRI butonlardan boşaltılır (kind) — kaplar ortak temiz havuza döner (korunum);
  // kirliler tepside KALIR.
  emptyTray: (kind) => {
    const s = get();
    const n = kind === 'food' ? s.trayFood : s.tray;
    if (n <= 0) return;
    set(
      kind === 'food'
        ? { trayFood: 0, cleanCups: s.cleanCups + n }
        : { tray: 0, cleanCups: s.cleanCups + n },
    );
  },

  markTrayTipSeen: () => {
    if (get().trayTipSeen) return;
    set({ trayTipSeen: true });
    get().saveNow();
  },

  saveNow: () => {
    const s = get();
    // D-015: tables/stations/serviceSpeedMult/hasWaiter KAYDEDİLMEZ — yüklemede padsDone'dan türetilir.
    writeSave({
      ...defaultSave(),
      wallet: s.wallet.toString(),
      diamonds: s.diamonds.toString(),
      lifetime: s.lifetime.toString(),
      stationLevels: [...s.stationLevels],
      tableLevels: [...s.tableLevels],
      waiterLevels: [...s.waiterLevels],
      padsDone: [...s.padsDone],
      padFills: { ...s.padFills },
      stats: { ...s.stats },
      questIndex: s.questIndex,
      questBase: s.questBase,
      xp: s.xp,
      settings: { ...s.settings },
      floorThemeByZone: [...s.floorThemeByZone],
      wallThemeByZone: [...s.wallThemeByZone],
      ownedCosmetics: [...s.ownedCosmetics],
      charUpgrades: { ...s.charUpgrades },
      waiterUpgrades: { ...s.waiterUpgrades },
      charPanelSeen: s.charPanelSeen,
      trayTipSeen: s.trayTipSeen,
      lastSaved: Date.now(),
    });
  },

  hardReset: () => {
    clearSave();
    get().init();
  },
}));

export { TEA_PRICE, brewThroughputMult, brewTime, incomeRate, dirtyTables };
