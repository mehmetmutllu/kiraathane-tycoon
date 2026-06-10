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
  derivedFromPads,
  waiterSpeed,
  waiterSoftMaxLevel as waiterSoftMaxLevelCfg,
  levelProgress,
  MAX_ZONES,
  TABLES_PER_ZONE,
  zoneOfTable,
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
// Zone-2 = AYNI şablon +X offset (ZONE_DX). Global düz diziler (tables 8 slot, stations[2], ...)
// eski kodun index mantığını korur (zone z → masa slotları [z*4, z*4+4)).
const ZONE_DX = 12.0;
const ZONE_OFFSETS = [0, ZONE_DX] as const;
const off = (dx: number, v: readonly [number, number, number]): Vec3 => [v[0] + dx, v[1], v[2]];

const BASE_TABLES = [
  { table: [-2.4, 0, 0.0], seat: [-2.4, 0.6, 1.0], upgradeSpot: [-3.7, 0, 0.0] },
  { table: [2.4, 0, 0.0], seat: [2.4, 0.6, 1.0], upgradeSpot: [3.7, 0, 0.0] },
  { table: [-2.4, 0, 3.0], seat: [-2.4, 0.6, 4.0], upgradeSpot: [-3.7, 0, 3.0] },
  { table: [2.4, 0, 3.0], seat: [2.4, 0.6, 4.0], upgradeSpot: [3.7, 0, 3.0] },
] as const;

const ALL_TABLES = ZONE_OFFSETS.flatMap((dx) =>
  BASE_TABLES.map((t) => ({
    table: off(dx, t.table),
    seat: off(dx, t.seat),
    upgradeSpot: off(dx, t.upgradeSpot),
  })),
);

export const LAYOUT = {
  // Zone başına kapı eşiği + sokak doğuş noktası (müşteri KENDİ zone'unun kapısından girer/çıkar →
  // moveAvoid zone-içi kalır, bölme duvarında takılma riski yok).
  entrances: ZONE_OFFSETS.map((dx) => off(dx, [0, 0.6, 4.8])),
  streets: ZONE_OFFSETS.map((dx) => off(dx, [0, 0.6, 8.0])),
  entrance: [0, 0.6, 4.8] as Vec3, // zone-1 alias (testler/eski kod)
  street: [0, 0.6, 8.0] as Vec3,
  player: [0, 0.6, 1.5] as Vec3,
  // Zone başına çay ocağı (per-zone TEMALI ocak, D-022). Mutfak kümesinin solu, arka duvara 0.
  stations: ZONE_OFFSETS.map((dx) => off(dx, [-1.6, 0, -4.8])),
  // Oynanabilir alan: İKİ zone'u da kapsar (tek bina; bölme duvarı katı engel, geçit z=-0.75).
  area: { minX: -5.3, maxX: 5.3 + ZONE_DX, minZ: -5.3, maxZ: 5.0 },
  // Zone başına yerel alan (duvar çizimi/etiketler için).
  zoneAreas: ZONE_OFFSETS.map((dx) => ({ minX: -5.3 + dx, maxX: 5.3 + dx, minZ: -5.3, maxZ: 5.0 })),
  // Bölme duvarı: iki zone arasında, ortasında GEÇİT (z=gapZ±gapHalf). Geçit HEP açık (zone-2
  // kilitliyken salon boş ve karanlık; pad geçidin ortasında "2. Salon" der).
  divider: { x: 6.0, gapZ: -0.75, gapHalf: 0.9, half: 0.15 }, // (5.3+6.7)/2 — zone sınırlarının ortası
  // Masa slotları — GLOBAL 8 slot (0-3 zone-1, 4-7 zone-2); zone içi 2×2 düzen değişmedi (D-017 §1).
  tables: ALL_TABLES,
  // Pad pozisyonları: açtıkları objenin yerinde. zone2 pad'i bölme geçidinin ORTASINDA.
  padPos: {
    table2: ALL_TABLES[1].table,
    table3: ALL_TABLES[2].table,
    table4: ALL_TABLES[3].table,
    waiter: [-4.6, 0, 1.5] as Vec3, // sol-kenar orta (D-018 §1 kenar-yerleşim)
    dishwasher: [4.6, 0, 1.5] as Vec3, // sağ-kenar orta
    zone2: [6.0, 0, -0.75] as Vec3, // geçit ortası (divider.x, divider.gapZ)
    z2table2: ALL_TABLES[5].table,
    z2table3: ALL_TABLES[6].table,
    z2table4: ALL_TABLES[7].table,
    z2waiter: off(ZONE_DX, [-4.6, 0, 1.5]),
    z2dishwasher: off(ZONE_DX, [4.6, 0, 1.5]),
  } as Record<string, Vec3>,
  // Zone başına mekânsal çay yükseltme noktası: ocağın önünde ama pickup'tan TAM AYRIK. Merkez mesafesi
  // (3.1) ≥ pickupRadius (1.6) + PAD_RADIUS (1.3) → iki daire KESİŞEMEZ (gece fix 2026-06-10).
  upgradeZones: ZONE_OFFSETS.map((dx) => off(dx, [-1.6, 0, -1.7])),
  upgradeZone: [-1.6, 0, -1.7] as Vec3, // zone-1 alias (testler/eski kod)
  // Zone başına personel köşeleri + garson hız yükseltme noktası (D-018 §6 yerleşimi zone-yerel aynı).
  waiterHomes: ZONE_OFFSETS.map((dx) => off(dx, [-4.6, 0, -1.6])),
  waiterHome: [-4.6, 0, -1.6] as Vec3,
  waiterUpgradeSpots: ZONE_OFFSETS.map((dx) => off(dx, [-4.6, 0, -0.9])),
  waiterUpgradeSpot: [-4.6, 0, -0.9] as Vec3,
  // Zone başına bulaşık noktası (per-zone bulaşık köşesi, D-022; mutfak kümesinde ocağın sağı).
  dishStations: ZONE_OFFSETS.map((dx) => off(dx, [0.6, 0, -4.8])),
  dishStation: [0.6, 0, -4.8] as Vec3,
  dishwasherHomes: ZONE_OFFSETS.map((dx) => off(dx, [4.6, 0, -1.6])),
  dishwasherHome: [4.6, 0, -1.6] as Vec3,
  // --- Collision footprint'leri (yarı-boyut [hx,hz]; D-016): GÖRSEL mesh'lere yaslı → oyuncu objeye
  // "değiyor gibi" sokulur, arada boşluk kalmaz. (ocak tezgah 2.2×0.8, bulaşık 1.4×0.8, masa r0.5, sandalye 0.42.)
  playerRadius: 0.35, // oyuncu kapsül görsel yarıçapı = standoff'u görsel kenara denk getirir
  actorRadius: 0.28, // garson/bulaşıkçı engel-kaçınma yarıçapı
  stationHalf: [1.1, 0.4] as [number, number],
  dishHalf: [0.7, 0.4] as [number, number],
  tableHalf: [0.5, 0.5] as [number, number],
  chairHalf: [0.22, 0.22] as [number, number], // sandalye + oturan müşteri
  actorHalf: [0.3, 0.3] as [number, number], // yürüyen müşteri / garson / bulaşıkçı (oyuncu engeli)
} as const;

/** Collision engeli: merkez (Vec3) + yarı-boyut [hx,hz]. */
interface Solid {
  c: RVec3;
  h: readonly [number, number];
}

/** Bölme duvarı katıları (iki segment; ortada geçit). Duvar HEP var (zone-2 kilitliyken de). */
function dividerSolids(): Solid[] {
  const d = LAYOUT.divider;
  const a = LAYOUT.area;
  const z0 = a.minZ - 0.5;
  const z1 = a.maxZ + 0.5;
  const gapLo = d.gapZ - d.gapHalf;
  const gapHi = d.gapZ + d.gapHalf;
  return [
    { c: [d.x, 0, (z0 + gapLo) / 2] as Vec3, h: [d.half, (gapLo - z0) / 2] },
    { c: [d.x, 0, (gapHi + z1) / 2] as Vec3, h: [d.half, (z1 - gapHi) / 2] },
  ];
}

/** O an SAHNEDE var olan SABİT katı engeller (açık zone'ların ocak+bulaşığı; açık masalar + sandalyeler;
 *  bölme duvarı HEP). Kapalı zone'un mobilyası ÇİZİLMEZ → collision da eklenmez (görünmez duvar olmasın). */
function activeSolids(tables: number, zonesOpen: number): Solid[] {
  const solids: Solid[] = [...dividerSolids()];
  for (let z = 0; z < zonesOpen; z++) {
    solids.push({ c: LAYOUT.stations[z], h: LAYOUT.stationHalf });
    solids.push({ c: LAYOUT.dishStations[z], h: LAYOUT.dishHalf });
  }
  for (let i = 0; i < tables; i++) {
    solids.push({ c: LAYOUT.tables[i].table, h: LAYOUT.tableHalf });
    solids.push({ c: LAYOUT.tables[i].seat, h: LAYOUT.chairHalf }); // sandalye (içine girilemez)
  }
  return solids;
}

/** Yalnız açık masa GÖVDELERİ — personel (garson/bulaşıkçı) bunların ETRAFINDAN dolaşır (ocak/bulaşık/
 *  koltuk hariç: personel onlara erişmeli). */
function tableSolids(tables: number): Solid[] {
  const solids: Solid[] = [];
  for (let i = 0; i < tables; i++) solids.push({ c: LAYOUT.tables[i].table, h: LAYOUT.tableHalf });
  return solids;
}

/** (x,z) noktası (yarıçap r şişirilmiş) herhangi bir katı engelin içinde mi? */
function hitsSolid(x: number, z: number, solids: Solid[], r: number): boolean {
  for (const s of solids) {
    if (Math.abs(x - s.c[0]) < s.h[0] + r && Math.abs(z - s.c[2]) < s.h[1] + r) return true;
  }
  return false;
}

/** Engel-kaçınmalı hareket (personel): hedefe doğru git; engele çarparsa eksen-başı KAY (etrafından dolaş).
 *  Varış: hedefe step kadar yaklaşınca true (hedef engel değilse erişilir). pos yerinde değişir. */
function moveAvoid(pos: Vec3, target: RVec3, step: number, solids: Solid[], r: number): boolean {
  const dx = target[0] - pos[0];
  const dz = target[2] - pos[2];
  const d = Math.hypot(dx, dz);
  if (d <= step || d < 0.001) {
    pos[0] = target[0];
    pos[2] = target[2];
    return true;
  }
  const ux = (dx / d) * step;
  const uz = (dz / d) * step;
  if (!hitsSolid(pos[0] + ux, pos[2] + uz, solids, r)) {
    pos[0] += ux;
    pos[2] += uz;
  } else if (!hitsSolid(pos[0] + ux, pos[2], solids, r)) {
    pos[0] += ux; // x ekseninde kay
  } else if (!hitsSolid(pos[0], pos[2] + uz, solids, r)) {
    pos[2] += uz; // z ekseninde kay
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
const REACH_STATION = LAYOUT.stationHalf[1] + LAYOUT.actorRadius + 0.4; // ocaktan tepsi yükleme
const REACH_WASH = LAYOUT.dishHalf[1] + LAYOUT.actorRadius + 0.4; // bulaşıkta yıkama
const REACH_HOME = 0.4; // boştayken köşeye dönüş

/** Personelin GÖVDE engeli saydığı katılar (açık zone'ların ocak+bulaşığı + açık masalar + bölme duvarı). */
function navSolids(tables: number, zonesOpen: number): NavSolid[] {
  const solids: NavSolid[] = [...dividerSolids()];
  for (let z = 0; z < zonesOpen; z++) {
    solids.push({ c: LAYOUT.stations[z], h: LAYOUT.stationHalf });
    solids.push({ c: LAYOUT.dishStations[z], h: LAYOUT.dishHalf });
  }
  for (let i = 0; i < tables; i++) solids.push({ c: LAYOUT.tables[i].table, h: LAYOUT.tableHalf });
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

/** Zone z'nin garson pad id'si (per-zone personel). */
export const waiterPadId = (z: number) => (z === 0 ? 'waiter' : 'z2waiter');

/** Zone z'nin çay-yükseltme noktası açık mı? (z1: table2 önkoşulu; z2: zone açık olması yeter.) */
export function upgradeZoneUnlockedZ(z: number, g: GateState): boolean {
  return z === 0 ? requiresMet(C.teaStation.upgradeRequires, g) : g.padsDone.includes('zone2');
}

/** Zone z'nin garson-hız noktası açık mı? (o zone'un garsonu + global minWaiterServed + seviye < max) */
export function waiterUpgradeUnlockedZ(z: number, g: GateState, level: number): boolean {
  if (!g.padsDone.includes(waiterPadId(z))) return false;
  const minServed = C.waiter.upgradeRequires.minWaiterServed ?? 0;
  if ((g.waiterServed ?? 0) < minServed) return false;
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

/** Bir bardak çayın demlenme süresi (sn) — throughput arttıkça kısalır. */
function brewTime(level: number, serviceSpeedMult: number): number {
  return (C.npc.orderTime * serviceSpeedMult) / brewThroughputMult(level);
}

/** Oyuncunun tepsi kapasitesi (tek turda taşınan çay/kirli). D-018: sabit (yükseltme kaldırıldı). */
export const trayCapacity = () => C.serving.trayCapacity;

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
/** Masa yükseltme noktası şu an aktif mi (önkoşulu karşılandı mı)? */
export function tableUpgradeZoneUnlocked(g: GateState): boolean {
  return requiresMet(C.tables.upgradeRequires, g);
}

/** Çevrimdışı gelir oranı (₺/sn) — bottleneck idealize: oturma × sabit fiyat / döngü. */
function incomeRate(tables: number, level: number, serviceSpeedMult = 1): number {
  const cycle = C.npc.walkTime + brewTime(level, serviceSpeedMult) + C.npc.eatTime;
  return (tables * TEA_PRICE) / cycle;
}

/**
 * Kirli masaların index kümesi (D-019): bir masada `dirtyThreshold`'tan FAZLA (>) kirli bardak varsa kirli.
 * Kirli masaya yeni müşteri oturmaz + garson çay götürmez → oyuncu eşiğe inene kadar masa kilitli (temizlik baskısı).
 */
function dirtyTables(dishes: Dish[]): Set<number> {
  const counts = new Map<number, number>();
  for (const d of dishes) counts.set(d.tableIndex, (counts.get(d.tableIndex) ?? 0) + 1);
  const dirty = new Set<number>();
  for (const [idx, n] of counts) if (n > C.cups.dirtyThreshold) dirty.add(idx);
  return dirty;
}

function findFreeTable(npcs: Npc[], tables: number, dirty: Set<number>): number {
  const used = new Set(npcs.filter((n) => n.state !== 'leaving').map((n) => n.tableIndex));
  // Kirli masa "boş" sayılmaz (D-019): müşteri temizlenene kadar oturmaz.
  for (let i = 0; i < tables; i++) if (!used.has(i) && !dirty.has(i)) return i;
  return -1;
}

/** Oyuncunun o an üstünde durduğu/doldurduğu zone (HUD'da alttaki bar). */
export interface ActiveZone {
  kind: 'pad' | 'upgrade';
  label: string;
  fill: number;
  cost: number;
}

/** Yeni-özellik bildirimi (D-019 §4): bir özellik İLK kez açılınca beliren kısa toast (ttl = kalan sn). */
export interface GameNotice {
  text: string;
  ttl: number;
}

/**
 * Şu an açık olan "yeni-özellik" reveal anahtarları (D-019 §4). Bir anahtar revealSeen'de YOKKEN belirirse
 * toast tetiklenir. revealSeen baseline init'te mevcut açık özelliklerle kurulur → yeniden yüklemede zaten
 * açık olanlar tekrar bildirmez (persist gerekmez). Omurga masa pad'leri DAHİL DEĞİL (onlar nextStep ile
 * yönlendirilir; bildirim yalnız ikincil özellikler: yükseltmeler + opsiyonel personel).
 */
function revealKeys(g: GateState, hasWaiter: boolean, waiterLevel: number): [string, string][] {
  const out: [string, string][] = [];
  if (requiresMet(C.teaStation.upgradeRequires, g) && g.stationLevel < stationSoftMaxLevel())
    out.push(['upgrade', 'Yeni: Çay ocağını yükseltebilirsin ☕']);
  for (const op of availableOptionalPads(g)) out.push([`opt:${op.id}`, `Yeni: ${op.label} 🔓`]);
  if (hasWaiter && waiterUpgradeUnlocked(g, waiterLevel))
    out.push(['waiterUp', 'Yeni: Garsonu hızlandırabilirsin ⚡']);
  if (tableUpgradeZoneUnlocked(g)) out.push(['tableUp', 'Yeni: Masaları yükseltebilirsin 🪑']);
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
  /** Zone başına bulaşıkçı — konum/taşıdığı kirli transient. */
  dishwashers: (Waiter | null)[];
  /** Zone başına ocak hazır-kuyruğundaki demlenmiş çay sayısı. */
  readyCupsByZone: number[];
  /** Zone başına demlenmekte olan bardağın ilerleme süresi (sn). */
  brewProgressByZone: number[];
  /** Oyuncunun tepsisinde taşıdığı çay sayısı. */
  tray: number;
  /** Temiz bardak havuzu — GLOBAL tek depo (zone'lar ortak; korunum değişmezi global kalır). Faz 2e. */
  cleanCups: number;
  /** Masalarda bekleyen kirli bardaklar (mekânsal nesneler). */
  dishes: Dish[];
  /** Oyuncunun bulaşığa götürmek için taşıdığı kirli bardak. */
  carriedDirty: number;
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
  /** Üst görev barı görünümü (transient; her tick türetilir; null = hat bitti). */
  quest: QuestView | null;
  /** Kamera odak isteği (transient): görev barına dokununca / yeni şey açılınca hedefe pan. */
  camFocus: CamFocus | null;
  offlineEarned: number;
  // Dahili
  spawnTimer: number;
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

/** İstasyon yükseltme noktası şu an aktif mi (önkoşulu karşılandı mı)? */
export function upgradeZoneUnlocked(g: GateState): boolean {
  return requiresMet(C.teaStation.upgradeRequires, g);
}

// ============================== QUEST MOTORU (2026-06-09) ==============================
// İlerleme sıralı TEK görevle yönlendirilir (Fable brief §1+§4; eski nextStep + onboardingHint
// koç bandının yerini alır). Sayaç görevleri questBase'ten DELTA sayılır; durum görevleri
// (pad/level) doğrudan oyun durumundan okunur.

/** Quest değerlendirme bağlamı (salt-okunur anlık görüntü). */
export interface QuestCtx {
  padsDone: string[];
  stationLevel: number;
  waiterLevel: number;
  tableLevels: number[];
  stats: SaveStats;
  questBase: number;
}

/** Sayaç hedefinin baktığı kümülatif sayaç değeri (durum hedefleri için null). */
export function questCounterValue(target: QuestTarget, stats: SaveStats): number | null {
  switch (target.type) {
    case 'pickupTea': return stats.teaPickups;
    case 'serveTea': return stats.teasServed;
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
    case 'stationLevel': return ctx.stationLevel >= target.level;
    case 'waiterLevel': return ctx.waiterLevel >= target.level;
    case 'tableLevel': return ctx.tableLevels.some((l) => l >= target.level);
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
}

function questView(q: QuestDef, ctx: QuestCtx): QuestView {
  const counter = questCounterValue(q.target, ctx.stats);
  const count = counter != null ? (q.target as { count: number }).count : null;
  const pad =
    q.target.type === 'pad'
      ? (C.pads as readonly PadDef[]).find((p) => p.id === (q.target as { id: string }).id)
      : undefined;
  return {
    id: q.id,
    title: q.title,
    target: q.target,
    cur: counter != null && count != null ? Math.max(0, Math.min(count, counter - ctx.questBase)) : null,
    total: count,
    cost: pad ? pad.cost : null,
  };
}

/** Görev hedefinin DÜNYA konumu (kamera odak + işaret görünürlüğü). zone = görevin salonu
 *  (2026-06-11 fix: z2 görevlerinde kamera zone-1'e zoom atıyordu — hedefler zone-1 alias'larına sabitti). */
export function questFocusPos(target: QuestTarget, tableLevels: number[], tables: number, zone = 0): RVec3 {
  const z = Math.min(Math.max(zone, 0), MAX_ZONES - 1);
  switch (target.type) {
    case 'pickupTea': return LAYOUT.stations[z];
    case 'washDish': return LAYOUT.dishStations[z];
    case 'pad': return LAYOUT.padPos[target.id] ?? LAYOUT.stations[z];
    case 'stationLevel': return LAYOUT.upgradeZones[z];
    case 'waiterLevel': return LAYOUT.waiterUpgradeSpots[z];
    case 'tableLevel': {
      // O zone'dan başlayarak ilk yükseltilebilir (soft max altı) AÇIK masanın yükseltme noktası.
      for (let i = z * TABLES_PER_ZONE; i < tables; i++) {
        if ((tableLevels[i] ?? 0) < tableSoftMaxLevel()) return LAYOUT.tables[i].upgradeSpot;
      }
      return LAYOUT.tables[Math.min(z * TABLES_PER_ZONE, tables - 1) || 0].upgradeSpot;
    }
    default: { // serveTea / collectCoin → o zone'un masa bölgesinin ortası
      const za = LAYOUT.zoneAreas[z];
      return [(za.minX + za.maxX) / 2, 0, 1.5];
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
  const q = questIndex < C.quests.length ? C.quests[questIndex] : null;
  if (q) {
    if (q.target.type !== 'pad') return [];
    const p = (C.pads as readonly PadDef[]).find((pd) => pd.id === (q.target as { id: string }).id);
    // AKTİF görevin hedef pad'inde TEMPO gate'leri (minLifetime vb.) ATLANIR (2026-06-11 fix:
    // "2. Masayı aç" görevi verilmişken table2 minLifetime:20 pad'i gizliyordu — görev hattı sıralı =
    // tempo kaynağı). `prev` OMURGA zinciri yapısal güvenlik ağı olarak KALIR (bozuk kayda karşı).
    const req = p ? (p.requires as Requires | undefined) : undefined;
    const prevOk = !req?.prev || req.prev.every((id) => g.padsDone.includes(id));
    return p && !g.padsDone.includes(p.id) && prevOk ? [p] : [];
  }
  const bp = currentPad(g);
  return bp ? [bp] : [];
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
/** Mevcut seviyeden bir sonraki ₺ yükseltmenin maliyeti. */
export const stationUpgradeCost = (level: number) => upgradeCost(C.teaStation.upgrade, level + 1);

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
  dishwashers: Array.from({ length: MAX_ZONES }, () => null),
  readyCupsByZone: Array.from({ length: MAX_ZONES }, () => 0),
  brewProgressByZone: Array.from({ length: MAX_ZONES }, () => 0),
  tray: 0,
  cleanCups: cupPoolCapacity(0),
  dishes: [],
  carriedDirty: 0,
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
  quest: null,
  camFocus: null,
  offlineEarned: 0,
  spawnTimer: 1,
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
    // Çevrimdışı gelir: açık zone'ların idealize oranları TOPLAMI; süre + PARA tavanlı (computeOfflineEarned).
    const elapsed = Math.max(0, (Date.now() - save.lastSaved) / 1000);
    let wallet = D(save.wallet);
    let lifetime = D(save.lifetime);
    let offlineEarned = 0;
    if (elapsed > 30) {
      let rate = 0;
      for (let z = 0; z < derived.zonesOpen; z++)
        rate += incomeRate(derived.tablesByZone[z], stationLevels[z], derived.serviceSpeedMult);
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
      dishwashers: Array.from({ length: MAX_ZONES }, (_, z) =>
        derived.hasDishwasherByZone[z] ? { pos: [...LAYOUT.dishwasherHomes[z]] as Vec3, tray: 0 } : null,
      ),
      readyCupsByZone: Array.from({ length: MAX_ZONES }, () => 0),
      brewProgressByZone: Array.from({ length: MAX_ZONES }, () => 0),
      tray: 0,
      // Bardak havuzu her oturumda dolu-temiz başlar (transient). GLOBAL tek depo:
      // zone başına taban + açık zone ocak seviyelerinin toplamı.
      cleanCups: totalCupPool(derived.zonesOpen, stationLevels),
      dishes: [],
      carriedDirty: 0,
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
        },
        derived.hasWaiter,
        waiterLevels[0],
      ).map(([k]) => k),
      stats: { ...save.stats },
      questIndex: save.questIndex,
      questBase: save.questBase,
      xp: save.xp,
      settings: { ...save.settings },
      quest:
        save.questIndex < C.quests.length
          ? questView(C.quests[save.questIndex], {
              padsDone: save.padsDone,
              stationLevel: stationLevels[0],
              waiterLevel: waiterLevels[0],
              tableLevels: save.tableLevels,
              stats: save.stats,
              questBase: save.questBase,
            })
          : null,
      // İlk oyun (taze kayıt): kamera ilk görevin hedefine kısa pan → "hareketli" onboarding girişi.
      camFocus:
        save.questIndex === 0 && lifetime.lte(0)
          ? (() => {
              const p0 = questFocusPos(C.quests[0].target, save.tableLevels, derived.tables);
              return { pos: [p0[0], p0[1], p0[2]] as [number, number, number], ttl: 3 };
            })()
          : null,
      spawnTimer: 1,
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
    // Müşteri + personel masa GÖVDELERİNDEN dolaşır (D-016 v4): ocak/bulaşık/koltuk engel değil (erişmeli).
    const obstacles = tableSolids(tables);
    const ar = LAYOUT.actorRadius;
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
    let cleanCups = s.cleanCups;
    let carriedDirty = s.carriedDirty;
    const tableUpgradeFills = s.tableUpgradeFills.slice();
    const waiterUpgradeFills = s.waiterUpgradeFills.slice();
    let notice = s.notice;
    let revealSeen = s.revealSeen;
    let xp = s.xp; // toplam XP (bu tick'te eylem ödülleriyle artabilir; level türetilir)
    const stats: SaveStats = { ...s.stats }; // kalıcı eylem sayaçları (bu tick'te artabilir)
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

    // --- Ocak hazır-kuyruğu (demleme) — D-011 §3 + bardak döngüsü (Faz 2e §5), ZONE BAŞINA ---
    // Her açık zone'un ocağı kendi kuyruğuna demler (per-zone ocak, D-022); TEMİZ bardak GLOBAL havuzdan.
    for (let z = 0; z < zonesOpen; z++) {
      const queueCap = brewQueueCapacity(stationLevels[z]);
      const cupBrewTime = brewTime(stationLevels[z], serviceSpeedMult);
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
    const dirty = dirtyTables(dishes);

    // --- Spawn ---
    const activeCount = npcs.filter((n) => n.state !== 'leaving').length;
    if (spawnTimer <= 0 && activeCount < C.npc.maxConcurrent) {
      const free = findFreeTable(npcs, tables, dirty);
      if (free >= 0) {
        npcs.push({
          id: nextId++,
          state: 'toTable',
          // KENDİ zone'unun sokağında belir → o zone'un kapısından girer (dış dünya hissi).
          pos: [...LAYOUT.streets[zoneOfTable(free)]] as Vec3,
          tableIndex: free,
          timer: 0,
          color: NPC_COLORS[Math.floor(Math.random() * NPC_COLORS.length)],
        });
        spawnTimer += C.npc.spawnInterval;
      } else {
        spawnTimer = 0; // masa boşalınca hemen denesin
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
          // Önce KAPIYA (sokaktaysa), sonra koltuğa → müşteri kapıdan girip içeri yürür (front-wall gap).
          const goingIn = n.pos[2] > nEntrance[2] + 0.2;
          const tgt = goingIn ? nEntrance : slot.seat;
          if (moveAvoid(n.pos, tgt, step, obstacles, ar) && !goingIn) {
            // Oturdu; çay servisini bekler. Sabır timer'ı başlar (D-011); OTURDUĞU masanın seviyesi sabrı uzatır (Faz 2h).
            n.state = 'waitingForTea';
            n.timer = tablePatience(tableLevels[n.tableIndex] ?? 0);
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
            // Öde: parayı masanın yanına düşür (çay fiyatı SABİT + OTURDUĞU masanın seviyesi bahşişi, Faz 2h).
            coins.push({
              id: nextId++,
              pos: [slot.table[0] + (Math.random() - 0.5), 0.3, slot.table[2] + 0.6 + (Math.random() - 0.5)],
              value: TEA_PRICE + tableTip(tableLevels[n.tableIndex] ?? 0),
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
              });
            } else {
              cleanCups += 1;
            }
            n.state = 'leaving';
          }
          break;
        case 'leaving': {
          // Önce KAPIYA (içerdeyse), sonra SOKAĞA → müşteri kapıdan çıkıp sokakta kaybolur.
          const goingOut = n.pos[2] >= nEntrance[2] - 0.2;
          const tgt = goingOut ? nStreet : nEntrance;
          if (moveAvoid(n.pos, tgt, step, obstacles, ar) && goingOut) removed.push(n.id);
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
    const A = LAYOUT.area;
    const pr = LAYOUT.playerRadius;
    const oldX = s.player[0];
    const oldZ = s.player[2];
    const dxIn = input[0] * C.player.moveSpeed * dt;
    const dzIn = input[1] * C.player.moveSpeed * dt;
    let nx = Math.max(A.minX, Math.min(A.maxX, oldX + dxIn));
    let nz = Math.max(A.minZ, Math.min(A.maxZ, oldZ + dzIn));
    if (dxIn !== 0 || dzIn !== 0) {
      // MOBİLYA = KATI engel: yeni bir engele GİRİŞ bloklanır (eksen-başı kayma; kafa kafaya gelince durur).
      // AMA oyuncu zaten bir engelin İÇİNDEyse (ör. üstünde masa açıldı) kilitlenmesin → çıkışına izin ver
      // (aktör collision'ındaki desenin aynısı). Böylece "zorlasan da giremezsin" korunur ama hapsolmazsın.
      const furn = activeSolids(tables, zonesOpen);
      const stuckInFurn = hitsSolid(oldX, oldZ, furn, pr);
      if (dxIn !== 0 && hitsSolid(nx, oldZ, furn, pr) && !stuckInFurn) nx = oldX;
      if (dzIn !== 0 && hitsSolid(nx, nz, furn, pr) && !stuckInFurn) nz = oldZ;
      // AKTÖRLER (müşteri/garson/bulaşıkçı) = YUMUŞAK: HAPSETMEZ (biri üstüne gelirse ters yöne çıkılır).
      const actors: Solid[] = [];
      for (const n of liveNpcs) actors.push({ c: n.pos, h: LAYOUT.actorHalf });
      for (const w of s.waiters) if (w) actors.push({ c: w.pos, h: LAYOUT.actorHalf });
      for (const dw of s.dishwashers) if (dw) actors.push({ c: dw.pos, h: LAYOUT.actorHalf });
      if (nx !== oldX && hitsSolid(nx, oldZ, actors, pr) && !hitsSolid(oldX, oldZ, actors, pr)) nx = oldX;
      if (nz !== oldZ && hitsSolid(nx, nz, actors, pr) && !hitsSolid(nx, oldZ, actors, pr)) nz = oldZ;
    }
    const player = [nx, s.player[1], nz] as Vec3;

    // --- Para mıknatısı + toplama (Faz 2f juice) ---
    // attractRadius içine giren para oyuncuya doğru GERÇEKTEN akar (hız > oyuncu hızı → daima yetişir),
    // pickupRadius'a varınca toplanır. Mıknatıs store'da yapıldığı için görsel = mantık → "yapışıp
    // toplanmayan para" bug'ı yapısal olarak imkansız (Coins.tsx sadece c.pos'u çizer).
    if (coins.length) {
      const keep: Coin[] = [];
      for (const c of coins) {
        if (dist2D(player, c.pos) < C.money.attractRadius) {
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
    const trayCap = trayCapacity();
    // Ocağa yaklaşınca hazır çaylardan tepsi dolar (herhangi bir açık ocak yeterli).
    // PAYLAŞIMLI kapasite (2026-06-09): çay + kirli aynı tepsiyi paylaşır → toplam trayCap'i aşamaz.
    // Karışık taşımaya izin verilir (eski "eli boşken" kısıtı kaldırıldı; deadlock'u engeller).
    if (tray + carriedDirty < trayCap) {
      for (let z = 0; z < zonesOpen; z++) {
        if (readyCupsByZone[z] > 0 && dist2D(player, LAYOUT.stations[z]) < C.serving.pickupRadius) {
          const take = Math.min(trayCap - tray - carriedDirty, readyCupsByZone[z]);
          tray += take;
          readyCupsByZone[z] -= take;
          if (take > 0) stats.teaPickups += take;
          break;
        }
      }
    }
    // Bekleyen masaya yaklaşınca tepsiden çay bırak → müşteri içmeye başlar (toplu servis).
    // Servis MASAYA yakınlıkla → masanın HER tarafından bırakılabilir (koltuk değil; arkadan da geçerli).
    if (tray > 0) {
      for (const n of liveNpcs) {
        if (tray <= 0) break;
        if (n.state !== 'waitingForTea') continue;
        if (dist2D(player, LAYOUT.tables[n.tableIndex].table) < C.serving.serveRadius) {
          n.state = 'drinking';
          n.timer = C.npc.eatTime;
          tray -= 1;
          stats.teasServed += 1;
          xp += C.xp.perTeaServed;
        }
      }
    }

    // --- Bardak döngüsü (Faz 2e): oyuncu masadaki kirli bardakları toplar, bulaşıkta yıkar (yakınlık) ---
    // PAYLAŞIMLI kapasite (2026-06-09): çay taşırken de kirli toplanabilir → toplam trayCap'i aşamaz.
    if (tray + carriedDirty < trayCap && dishes.length) {
      const keep: Dish[] = [];
      for (const d of dishes) {
        if (tray + carriedDirty < trayCap && dist2D(player, d.pos) < C.cups.collectRadius) carriedDirty += 1;
        else keep.push(d);
      }
      dishes = keep;
    }
    // HERHANGİ açık zone'un bulaşık noktasına yaklaşınca taşınan kirliler yıkanır → GLOBAL temiz havuza.
    if (carriedDirty > 0) {
      for (let z = 0; z < zonesOpen; z++) {
        if (dist2D(player, LAYOUT.dishStations[z]) < C.cups.washRadius) {
          cleanCups += carriedDirty;
          stats.dishesWashed += carriedDirty;
          xp += C.xp.perDishWashed * carriedDirty;
          carriedDirty = 0;
          break;
        }
      }
    }

    // --- Garson (D-012 kısmi assist), ZONE BAŞINA: kendi zone'unun ocağından alır, kendi zone'unun
    // bekleyen masalarına götürür (per-zone personel, D-022). Oyuncudan yavaş + tek tepsili.
    const waiters: (Waiter | null)[] = s.waiters.slice();
    for (let z = 0; z < MAX_ZONES; z++) {
      if (z >= zonesOpen || !derived.hasWaiterByZone[z]) {
        waiters[z] = null;
        continue;
      }
      const prev = waiters[z];
      const w: Waiter = prev
        ? { pos: [...prev.pos] as Vec3, tray: prev.tray }
        : { pos: [...LAYOUT.waiterHomes[z]] as Vec3, tray: 0 };
      const wStep = waiterSpeed(waiterLevels[z]) * dt;
      const wTrayCap = C.waiter.trayCapacity;
      // Garson kirli masaya çay GÖTÜRMEZ (D-019) + yalnız KENDİ zone'unun masalarına bakar.
      const waitingNpcs = liveNpcs.filter(
        (n) => n.state === 'waitingForTea' && !dirty.has(n.tableIndex) && zoneOfTable(n.tableIndex) === z,
      );
      if (w.tray > 0 && waitingNpcs.length > 0) {
        // Teslimat: en ACİL (sabrı en az kalan) bekleyene; eşitlikte en yakın (anti-starvation).
        let best = waitingNpcs[0];
        let bestTimer = Infinity;
        let bestDist = Infinity;
        for (const n of waitingNpcs) {
          const d = dist2D(w.pos, LAYOUT.tables[n.tableIndex].table);
          if (n.timer < bestTimer - 1e-6 || (Math.abs(n.timer - bestTimer) <= 1e-6 && d < bestDist)) {
            bestTimer = n.timer;
            bestDist = d;
            best = n;
          }
        }
        const targetTable = LAYOUT.tables[best.tableIndex].table;
        if (navStep(w.pos, targetTable, wStep, navGrid, REACH_TABLE, player, obstacles)) {
          best.state = 'drinking';
          best.timer = C.npc.eatTime;
          w.tray -= 1;
          stats.waiterServed += 1;
          xp += C.xp.perWaiterServed;
        }
      } else if (w.tray < wTrayCap && waitingNpcs.length > 0) {
        // Yükleme: KENDİ zone'unun ocağına git; bitişik gelince hazır çaydan tepsiye al.
        if (
          navStep(w.pos, LAYOUT.stations[z], wStep, navGrid, REACH_STATION, player, obstacles) &&
          readyCupsByZone[z] > 0
        ) {
          const take = Math.min(wTrayCap - w.tray, readyCupsByZone[z]);
          w.tray += take;
          readyCupsByZone[z] -= take;
        }
      } else {
        // Boşta: kendi zone'unun personel köşesine dön.
        navStep(w.pos, LAYOUT.waiterHomes[z], wStep, navGrid, REACH_HOME, player, obstacles);
      }
      waiters[z] = w;
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
      const dCap = C.dishwasher.carryCapacity;
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
    };
    // EKRANDA TEK PAD (quest sistemi): görünürlük visiblePads'ten (Pad.tsx ile aynı kaynak).
    const activePads: PadDef[] = visiblePads(questIndex, padGate);

    const tableUnlocked = tableUpgradeZoneUnlocked(padGate);

    // --- Yeni-özellik bildirimi (D-019 §4) ---
    // Bir ikincil özellik (yükseltme/personel) İLK kez açıldığında kısa toast. revealSeen baseline init'te
    // kurulduğu için zaten açık olanlar tekrar bildirmez (yeniden-yükleme spam'ı yok; persist gerekmez).
    for (const [key, text] of revealKeys(padGate, derived.hasWaiter, waiterLevels[0])) {
      if (!revealSeen.includes(key)) {
        revealSeen = [...revealSeen, key];
        notice = { text, ttl: 4.5 };
        // Yeni açılan noktaya anlık kamera pan ("orada bir şey var" — kullanıcı isteği 2026-06-09).
        const rp =
          key === 'upgrade' ? LAYOUT.upgradeZone
          : key === 'waiterUp' ? LAYOUT.waiterUpgradeSpot
          : key === 'tableUp' ? LAYOUT.tables[0].upgradeSpot
          : null;
        if (rp) requestFocus(rp, 1);
      }
    }
    if (notice) {
      const ttl = notice.ttl - dt;
      notice = ttl > 0 ? { text: notice.text, ttl } : null;
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
    if (!onFillId && tableUnlocked) {
      for (let i = 0; i < tables; i++) {
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
          const za = LAYOUT.zoneAreas[1];
          requestFocus([(za.minX + za.maxX) / 2, 0, 0.6], 3); // en yüksek öncelik; TTL eşit (akış pürüzsüz)
        }
        // Masa pad'i oyuncunun DURDUĞU yerde belirir → oyuncu masanın içinde kalmasın, anında dışarı it.
        if (activePad.effect.type === 'addTable') {
          const out = LAYOUT.tableHalf[0] + pr + 0.1;
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
      const cost = stationUpgradeCost(stationLevels[z]);
      if (fillReady && wallet.gt(0)) {
        const amt = Math.min(C.teaStation.upgradeFillRate * dt, wallet.toNumber(), cost - upgradeFills[z]);
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
      const nextCost = lv < stationSoftMaxLevel() ? stationUpgradeCost(lv) : cost;
      // GÖRSEL: ocak L1'den başlar (iç seviye 0-tabanlı; etiket +1). Soft max → "Usta" (💎/video, Faz 4).
      activeZone = {
        kind: 'upgrade',
        label: `Çay Ocağı L${lv + 1}${lv < stationSoftMaxLevel() ? ` → L${lv + 2}` : ' (Usta 💎)'}`,
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
        const amt = Math.min(C.waiter.upgradeFillRate * dt, wallet.toNumber(), cost - waiterUpgradeFills[z]);
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
        const amt = Math.min(C.tables.upgradeFillRate * dt, wallet.toNumber(), cost - fill);
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
      stationLevel: stationLevels[0],
      waiterLevel: waiterLevels[0],
      tableLevels,
      stats,
      questBase,
    };
    let questAdvanced = false;
    while (questIndex < C.quests.length && questTargetMet(C.quests[questIndex].target, questCtx)) {
      notice = { text: `✓ ${C.quests[questIndex].title}`, ttl: 3.5 };
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
      requestFocus(questFocusPos(q.target, tableLevels, out.tables, q.zone ?? 0), 2);
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
      if (after > before) notice = { text: `🎉 Seviye ${after}!`, ttl: 4.5 };
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
      dishwashers,
      readyCupsByZone,
      brewProgressByZone,
      tray,
      cleanCups,
      carriedDirty,
      spawnTimer,
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
    set({ camFocus: { pos: [p[0], p[1], p[2]], ttl: CAM_FOCUS_TTL } });
  },

  setSetting: (key, value) => {
    set({ settings: { ...get().settings, [key]: value } });
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
      lastSaved: Date.now(),
    });
  },

  hardReset: () => {
    clearSave();
    get().init();
  },
}));

export { TEA_PRICE, brewThroughputMult, brewTime, incomeRate, dirtyTables };
