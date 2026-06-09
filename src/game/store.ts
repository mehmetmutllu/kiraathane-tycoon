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
  type PadDef,
  type GateState,
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
export const LAYOUT = {
  entrance: [0, 0.6, 4.8] as Vec3, // kapı eşiği (ön duvardaki boşluk, x=0)
  // Sokak doğuş noktası: ön duvarın DIŞI (müşteriler buradan yürüyerek kapıya gelir / çıkarken buraya döner).
  street: [0, 0.6, 8.0] as Vec3,
  player: [0, 0.6, 1.5] as Vec3,
  // Çay ocağı (D-016: zone'un TEK ana ocağı). Mutfak kümesinin solu, arka duvara 0.
  stations: [[-1.6, 0, -4.8] as Vec3],
  // Oynanabilir alan — derinlik artırıldı (D-017 §1: mutfak↔masa ayrımı için). Ön/arka koridor + kenar personel.
  area: { minX: -5.3, maxX: 5.3, minZ: -5.3, maxZ: 5.0 },
  // Masa slotları — 2×2, MUTFAKTAN UZAK ÖNDE (kolon x ∓2.4, satır z 0.0/3.0). Ön sıra ocaktan ~4.9 br
  // (>2R=3.2) → tek noktada çay-al+servis imkânsız. seat = table z+1.0 (müşteri masanın önünde, girişe dönük).
  // upgradeSpot (D-018 §1 KENAR-YERLEŞİM): masanın DUVAR-KENARI tarafında (sol kolon → SOLA x≈−3.7, sağ kolon →
  // SAĞA x≈+3.7) → orta "omurga" koridor boş kalır (kullanıcı: "sağdakilerin sağına soldakilerin soluna").
  tables: [
    { table: [-2.4, 0, 0.0] as Vec3, seat: [-2.4, 0.6, 1.0] as Vec3, upgradeSpot: [-3.7, 0, 0.0] as Vec3 },
    { table: [2.4, 0, 0.0] as Vec3, seat: [2.4, 0.6, 1.0] as Vec3, upgradeSpot: [3.7, 0, 0.0] as Vec3 },
    { table: [-2.4, 0, 3.0] as Vec3, seat: [-2.4, 0.6, 4.0] as Vec3, upgradeSpot: [-3.7, 0, 3.0] as Vec3 },
    { table: [2.4, 0, 3.0] as Vec3, seat: [2.4, 0.6, 4.0] as Vec3, upgradeSpot: [3.7, 0, 3.0] as Vec3 },
  ],
  // Pad pozisyonları: açtıkları objenin yerinde (masa pad'leri sıralı → eş-zamanlı çakışmaz).
  padPos: {
    table2: [2.4, 0, 0.0] as Vec3, // 2. masa slotu (ön-sağ)
    table3: [-2.4, 0, 3.0] as Vec3, // 3. masa slotu (arka-sol)
    table4: [2.4, 0, 3.0] as Vec3, // 4. masa slotu (arka-sağ)
    // (samovar pad'i kaldırıldı — D-018 adım 5; semaver = çay ocağı üst yükseltmesi.)
    // Personel pad'leri sol/sağ kenar, masa SATIRLARI ARASINDA (z=1.5) → masa-yükseltme noktalarıyla (z=0/3)
    // çakışmaz (D-018 §1 kenar-yerleşim: upgrade spot [∓3.7,0/3] ile pad [∓4.6,1.5] arası 1.75>PAD_RADIUS).
    waiter: [-4.6, 0, 1.5] as Vec3, // sol-kenar orta (GÖRÜNÜR)
    dishwasher: [4.6, 0, 1.5] as Vec3, // sağ-kenar orta (GÖRÜNÜR)
  } as Record<string, Vec3>,
  // Mekânsal çay yükseltme noktası: ocağın TAM önünde (dist 1.8 > pickupRadius 1.6 → pickup ile çakışmaz;
  // personel pad'lerinden uzak → para çekişmesi yok).
  upgradeZone: [-1.6, 0, -3.0] as Vec3,
  // Garson boştayken bekleyeceği köşe (sol-kenar, pad'inin arkası).
  waiterHome: [-4.6, 0, -1.6] as Vec3,
  // Garson hız yükseltme noktası (D-018 §6): garson köşesinde, tutma pad'inin (z=1.5) ARKASINDA (z=-0.9) →
  // garson tutar tutmaz aynı noktada yükseltmeye akmaz (ayrı bilinçli adım). Masa-yükseltme noktalarından
  // (∓3.7 @ z=0/3) ve pickup/çay-yükseltme'den uzak (çakışma yok).
  waiterUpgradeSpot: [-4.6, 0, -0.9] as Vec3,
  // Bulaşık noktası (Faz 2e): mutfak kümesi, ocağın sağında BİTİŞİK (D-017 §1: ocaktan AYRILMAZ).
  // ocaktan dist 2.2 → footprint'ler çakışmaz ama mutfak kümesi olarak yan yana (kirli yıkama mutfakta).
  dishStation: [0.6, 0, -4.8] as Vec3,
  // Bulaşıkçı boştayken bekleyeceği köşe (sağ-kenar, pad'inin arkası).
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

/** O an SAHNEDE var olan SABİT katı engeller (ocak + bulaşık hep; açık masalar + sandalyeleri). */
function activeSolids(tables: number): Solid[] {
  const solids: Solid[] = [
    { c: LAYOUT.stations[0], h: LAYOUT.stationHalf },
    { c: LAYOUT.dishStation, h: LAYOUT.dishHalf },
  ];
  for (let i = 0; i < tables; i++) {
    solids.push({ c: LAYOUT.tables[i].table, h: LAYOUT.tableHalf });
    solids.push({ c: LAYOUT.tables[i].seat, h: LAYOUT.chairHalf }); // sandalye (içine girilemez)
  }
  // NOT: 'samovar' pad'inin ayrı görünür mesh'i yok → collision EKLENMEZ (görünmez duvar olmasın).
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

/** Personelin GÖVDE engeli saydığı katılar (ocak + bulaşık + açık masalar). Koltuk/semaver hariç. */
function navSolids(tables: number): NavSolid[] {
  const solids: NavSolid[] = [
    { c: LAYOUT.stations[0], h: LAYOUT.stationHalf },
    { c: LAYOUT.dishStation, h: LAYOUT.dishHalf },
  ];
  for (let i = 0; i < tables; i++) solids.push({ c: LAYOUT.tables[i].table, h: LAYOUT.tableHalf });
  return solids;
}

// Izgara masa sayısına göre cache'lenir (masa açılınca yeniden kurulur; her frame değil).
let navCache: { tables: number; grid: NavGrid } | null = null;
function getNavGrid(tables: number): NavGrid {
  if (navCache && navCache.tables === tables) return navCache.grid;
  const grid = buildNavGrid(LAYOUT.area, NAV_CELL, navSolids(tables), LAYOUT.actorRadius);
  navCache = { tables, grid };
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
const PAD_RADIUS = 1.3;
// Masa-başı yükseltme noktasının yarıçapı (Faz 2h). Pad'lerden küçük → komşu masanın noktasını tetiklemez.
const TABLE_UP_RADIUS = 1.0;
// Garson hız yükseltme noktasının yarıçapı (D-018 §6). Komşu masa-yükseltme noktasıyla çakışmayacak küçüklükte.
const WAITER_UP_RADIUS = 1.0;
// DWELL kanonik dolum-noktası id'leri (D-018 §2): pad'ler kendi id'sini kullanır; bunlar yükseltme noktaları.
export const FILL_TEA = 'tea';
export const FILL_TABLE = 'tableUp:'; // gerçek id = FILL_TABLE + masaIndex (ör. 'tableUp:0')
export const FILL_WAITER = 'waiterUp'; // garson hız yükseltme noktası (D-018 §6)
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
  stationLevel: number;
  /** Masa-başı yükseltme seviyeleri (Faz 2h; persist; index = masa slotu; bahşiş + sabır). My Hotel oda mantığı. */
  tableLevels: number[];
  /** Garson hız yükseltme seviyesi (D-018 §6; persist; 0 = taban, 1 = L2). Garson tutulduysa anlamlı. */
  waiterLevel: number;
  serviceSpeedMult: number;
  padsDone: string[];
  /** Aktif pad'lerin kısmi dolumu (pad id → ₺). Eş zamanlı omurga + opsiyonel için kayıt (v5). */
  padFills: Record<string, number>;
  /** Garson tutuldu mu (Faz 2d opsiyonel pad; persist). */
  hasWaiter: boolean;
  /** Bulaşıkçı tutuldu mu (Faz 2e opsiyonel pad; padsDone'dan türetilir). */
  hasDishwasher: boolean;
  // Transient (kaydedilmez — D-011 servis durumu yeniden kurulur)
  player: Vec3;
  npcs: Npc[];
  coins: Coin[];
  npcCount: number;
  /** Garson (hasWaiter ise) — konum/tepsi transient, her oturumda kurulur. */
  waiter: Waiter | null;
  /** Bulaşıkçı (hasDishwasher ise) — konum/taşıdığı kirli transient. */
  dishwasher: Waiter | null;
  /** Ocak hazır-kuyruğundaki demlenmiş çay sayısı. */
  readyCups: number;
  /** Demlenmekte olan bardağın ilerleme süresi (sn). */
  brewProgress: number;
  /** Oyuncunun tepsisinde taşıdığı çay sayısı. */
  tray: number;
  /** Temiz bardak havuzu (demleme bundan harcar; biterse demleme durur). Faz 2e. */
  cleanCups: number;
  /** Masalarda bekleyen kirli bardaklar (mekânsal nesneler). */
  dishes: Dish[];
  /** Oyuncunun bulaşığa götürmek için taşıdığı kirli bardak. */
  carriedDirty: number;
  upgradeFill: number;
  /** Masa-başı yükseltme noktalarındaki kısmi dolum (transient; index = masa slotu). */
  tableUpgradeFills: number[];
  /** Garson hız yükseltme noktasındaki kısmi dolum (transient; D-018 dwell — çıkınca sıfırlanmaz). */
  waiterUpgradeFill: number;
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

/** Görev hedefinin DÜNYA konumu (kamera odak + işaret görünürlüğü). */
export function questFocusPos(target: QuestTarget, tableLevels: number[], tables: number): RVec3 {
  switch (target.type) {
    case 'pickupTea': return LAYOUT.stations[0];
    case 'washDish': return LAYOUT.dishStation;
    case 'pad': return LAYOUT.padPos[target.id] ?? LAYOUT.stations[0];
    case 'stationLevel': return LAYOUT.upgradeZone;
    case 'waiterLevel': return LAYOUT.waiterUpgradeSpot;
    case 'tableLevel': {
      // İlk yükseltilebilir (soft max altı) AÇIK masanın yükseltme noktası.
      for (let i = 0; i < tables; i++) {
        if ((tableLevels[i] ?? 0) < tableSoftMaxLevel()) return LAYOUT.tables[i].upgradeSpot;
      }
      return LAYOUT.tables[0].upgradeSpot;
    }
    default: // serveTea / collectCoin → masa bölgesinin ortası
      return [0, 0, 1.5];
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
    return p && !g.padsDone.includes(p.id) && requiresMet(p.requires, g) ? [p] : [];
  }
  const bp = currentPad(g);
  return bp ? [bp] : [];
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
  stationLevel: 0,
  tableLevels: LAYOUT.tables.map(() => 0),
  waiterLevel: 0,
  serviceSpeedMult: 1,
  padsDone: [],
  padFills: {},
  hasWaiter: false,
  hasDishwasher: false,
  player: [...LAYOUT.player] as Vec3,
  npcs: [],
  coins: [],
  npcCount: 0,
  waiter: null,
  dishwasher: null,
  readyCups: 0,
  brewProgress: 0,
  tray: 0,
  cleanCups: cupPoolCapacity(0),
  dishes: [],
  carriedDirty: 0,
  upgradeFill: 0,
  tableUpgradeFills: LAYOUT.tables.map(() => 0),
  waiterUpgradeFill: 0,
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
    // D-015: tables/stations/serviceSpeedMult/hasWaiter padsDone'dan TÜRETİLİR (ayrı saklanmaz).
    const derived = derivedFromPads(save.padsDone);
    // Çevrimdışı gelir
    const elapsed = Math.max(0, (Date.now() - save.lastSaved) / 1000);
    const cap = C.offline.baseCapHours * 3600;
    let wallet = D(save.wallet);
    let lifetime = D(save.lifetime);
    let offlineEarned = 0;
    if (elapsed > 30) {
      offlineEarned = Math.floor(
        incomeRate(derived.tables, save.stationLevel, derived.serviceSpeedMult) *
          C.offline.rateMult *
          Math.min(elapsed, cap),
      );
      wallet = wallet.add(offlineEarned);
      lifetime = lifetime.add(offlineEarned);
    }
    set({
      wallet,
      lifetime,
      diamonds: D(save.diamonds),
      tables: derived.tables,
      stations: derived.stations,
      stationLevel: save.stationLevel,
      // Masa-başı seviyeleri: slot sayısına normalize et + her birini soft max'a clamp'le.
      tableLevels: LAYOUT.tables.map((_, i) => Math.min(save.tableLevels[i] ?? 0, tableSoftMaxLevel())),
      waiterLevel: Math.min(save.waiterLevel ?? 0, waiterSoftMaxLevelCfg()),
      serviceSpeedMult: derived.serviceSpeedMult,
      padsDone: [...save.padsDone],
      padFills: { ...save.padFills },
      hasWaiter: derived.hasWaiter,
      hasDishwasher: derived.hasDishwasher,
      offlineEarned,
      player: [...LAYOUT.player] as Vec3,
      npcs: [],
      coins: [],
      npcCount: 0,
      waiter: derived.hasWaiter ? { pos: [...LAYOUT.waiterHome] as Vec3, tray: 0 } : null,
      dishwasher: derived.hasDishwasher ? { pos: [...LAYOUT.dishwasherHome] as Vec3, tray: 0 } : null,
      readyCups: 0,
      brewProgress: 0,
      tray: 0,
      // Bardak havuzu her oturumda dolu-temiz başlar (transient; readyCups/tray gibi).
      cleanCups: cupPoolCapacity(save.stationLevel),
      dishes: [],
      carriedDirty: 0,
      upgradeFill: 0,
      tableUpgradeFills: LAYOUT.tables.map(() => 0),
      waiterUpgradeFill: 0,
      activeZone: null,
      notice: null,
      // revealSeen baseline: yüklemede ZATEN açık olan özellikler bildirilmiş sayılır (yeniden yükleme spam'ı yok).
      revealSeen: revealKeys(
        {
          padsDone: save.padsDone,
          tables: derived.tables,
          stationLevel: save.stationLevel,
          lifetime: lifetime.toNumber(),
          waiterServed: save.stats.waiterServed,
        },
        derived.hasWaiter,
        Math.min(save.waiterLevel ?? 0, waiterSoftMaxLevelCfg()),
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
              stationLevel: save.stationLevel,
              waiterLevel: Math.min(save.waiterLevel ?? 0, waiterSoftMaxLevelCfg()),
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
    const stations = derived.stations;
    const serviceSpeedMult = derived.serviceSpeedMult;
    const hasWaiter = derived.hasWaiter;
    const hasDishwasher = derived.hasDishwasher;
    // Müşteri + personel masa GÖVDELERİNDEN dolaşır (D-016 v4): ocak/bulaşık/koltuk engel değil (erişmeli).
    const obstacles = tableSolids(tables);
    const ar = LAYOUT.actorRadius;
    // Personel (garson/bulaşıkçı) BFS ızgarası — masa sayısına göre cache'li.
    const navGrid = getNavGrid(tables);
    let upgradeFill = s.upgradeFill;
    let activeZone: ActiveZone | null = null;
    let stationLevel = s.stationLevel;
    let waiterLevel = s.waiterLevel;
    const tableLevels = s.tableLevels.slice(); // masa-başı seviyeler (kopya; bu tick'te yükseltilebilir)
    let readyCups = s.readyCups;
    let brewProgress = s.brewProgress;
    let tray = s.tray;
    let cleanCups = s.cleanCups;
    let carriedDirty = s.carriedDirty;
    const tableUpgradeFills = s.tableUpgradeFills.slice();
    let waiterUpgradeFill = s.waiterUpgradeFill;
    let notice = s.notice;
    let revealSeen = s.revealSeen;
    let xp = s.xp; // toplam XP (bu tick'te eylem ödülleriyle artabilir; level türetilir)
    const stats: SaveStats = { ...s.stats }; // kalıcı eylem sayaçları (bu tick'te artabilir)
    let questIndex = s.questIndex;
    let questBase = s.questBase;
    let camFocus = s.camFocus;
    let nextId = s.nextId;
    let spawnTimer = s.spawnTimer - dt;

    // --- Ocak hazır-kuyruğu (demleme) — D-011 §3 + bardak döngüsü (Faz 2e §5) ---
    // Ocak, kuyruk dolana kadar çay demler; doluyken durur (teslimat darboğaz olur).
    // Her demleme bir TEMİZ bardak harcar; temiz biterse demleme DURUR (yeni darboğaz → kirli topla/yıka).
    const queueCap = brewQueueCapacity(stationLevel);
    const cupBrewTime = brewTime(stationLevel, serviceSpeedMult);
    if (readyCups < queueCap && cleanCups > 0) {
      brewProgress += dt;
      while (readyCups < queueCap && cleanCups > 0 && brewProgress >= cupBrewTime) {
        readyCups += 1;
        cleanCups -= 1;
        brewProgress -= cupBrewTime;
      }
    }
    if (readyCups >= queueCap || cleanCups <= 0) brewProgress = Math.min(brewProgress, cupBrewTime);

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
          pos: [...LAYOUT.street] as Vec3, // sokakta belir → kapıya yürü → koltuğa (dış dünya hissi)
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
      switch (n.state) {
        case 'toTable': {
          // Önce KAPIYA (sokaktaysa), sonra koltuğa → müşteri kapıdan girip içeri yürür (front-wall gap).
          const goingIn = n.pos[2] > LAYOUT.entrance[2] + 0.2;
          const tgt = goingIn ? LAYOUT.entrance : slot.seat;
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
          const goingOut = n.pos[2] >= LAYOUT.entrance[2] - 0.2;
          const tgt = goingOut ? LAYOUT.street : LAYOUT.entrance;
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
      const furn = activeSolids(tables);
      const stuckInFurn = hitsSolid(oldX, oldZ, furn, pr);
      if (dxIn !== 0 && hitsSolid(nx, oldZ, furn, pr) && !stuckInFurn) nx = oldX;
      if (dzIn !== 0 && hitsSolid(nx, nz, furn, pr) && !stuckInFurn) nz = oldZ;
      // AKTÖRLER (müşteri/garson/bulaşıkçı) = YUMUŞAK: HAPSETMEZ (biri üstüne gelirse ters yöne çıkılır).
      const actors: Solid[] = [];
      for (const n of liveNpcs) actors.push({ c: n.pos, h: LAYOUT.actorHalf });
      if (s.waiter) actors.push({ c: s.waiter.pos, h: LAYOUT.actorHalf });
      if (s.dishwasher) actors.push({ c: s.dishwasher.pos, h: LAYOUT.actorHalf });
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
    if (tray + carriedDirty < trayCap && readyCups > 0) {
      for (let i = 0; i < stations; i++) {
        if (dist2D(player, LAYOUT.stations[i]) < C.serving.pickupRadius) {
          const take = Math.min(trayCap - tray - carriedDirty, readyCups);
          tray += take;
          readyCups -= take;
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
    // Bulaşık noktasına yaklaşınca taşınan kirliler yıkanır → temiz havuza döner.
    if (carriedDirty > 0 && dist2D(player, LAYOUT.dishStation) < C.cups.washRadius) {
      cleanCups += carriedDirty;
      stats.dishesWashed += carriedDirty;
      xp += C.xp.perDishWashed * carriedDirty;
      carriedDirty = 0;
    }

    // --- Garson (D-012 opsiyonel kısmi assist): ocaktan çay al → en yakın bekleyen masaya götür ---
    // Oyuncudan yavaş + tek tepsili; tek başına büyüyen mekânı döndüremez (oyuncu hâlâ gerekli).
    let waiter: Waiter | null = s.waiter;
    if (hasWaiter) {
      const w: Waiter = waiter
        ? { pos: [...waiter.pos] as Vec3, tray: waiter.tray }
        : { pos: [...LAYOUT.waiterHome] as Vec3, tray: 0 };
      const wStep = waiterSpeed(waiterLevel) * dt;
      const wTrayCap = C.waiter.trayCapacity;
      // Garson kirli masaya çay GÖTÜRMEZ (D-019): o masa temizlenene kadar teslimat hedefi sayılmaz
      // (oyuncu hâlâ elle servis edebilir; kirli masa baskısı garsonu da kapsar).
      const waitingNpcs = liveNpcs.filter((n) => n.state === 'waitingForTea' && !dirty.has(n.tableIndex));
      // En yakın açık ocağı bul (yükleme/bekleme hedefi).
      let nearStation = LAYOUT.stations[0];
      let nsd = Infinity;
      for (let i = 0; i < stations; i++) {
        const d = dist2D(w.pos, LAYOUT.stations[i]);
        if (d < nsd) { nsd = d; nearStation = LAYOUT.stations[i]; }
      }
      if (w.tray > 0 && waitingNpcs.length > 0) {
        // Teslimat: en ACİL (sabrı en az kalan = en düşük timer) bekleyene git; eşitlikte en yakın.
        // "En yakın" yerine "en acil" → ön masalar sürekli dolsa da arka masalar AÇLIKTAN ölmez
        // (tüm sabır timer'ları aynı hızda azaldığı için bu pratikte kararlı bir FIFO'dur, salınım yapmaz).
        // Garsonun hız/tepsi limiti değişmez → D-014 "partial assist" tasarımı korunur.
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
        // Servis: masaya BFS rotasıyla yaklaş (engeli gerçekten dolaşır → ön masada kilitlenme/salınım
        // biter), masaya bitişik (REACH_TABLE) gelince teslim et → her taraftan + "tam masaya gelince".
        const targetTable = LAYOUT.tables[best.tableIndex].table;
        if (navStep(w.pos, targetTable, wStep, navGrid, REACH_TABLE, player, obstacles)) {
          best.state = 'drinking';
          best.timer = C.npc.eatTime;
          w.tray -= 1;
          stats.waiterServed += 1;
          xp += C.xp.perWaiterServed;
        }
      } else if (w.tray < wTrayCap && waitingNpcs.length > 0) {
        // Yükleme: ocağa BFS rotasıyla git; bitişik gelince hazır çaydan tepsiye al (yoksa orada bekler).
        if (navStep(w.pos, nearStation, wStep, navGrid, REACH_STATION, player, obstacles) && readyCups > 0) {
          const take = Math.min(wTrayCap - w.tray, readyCups);
          w.tray += take;
          readyCups -= take;
        }
      } else {
        // Boşta: personel köşesine dön.
        navStep(w.pos, LAYOUT.waiterHome, wStep, navGrid, REACH_HOME, player, obstacles);
      }
      waiter = w;
    } else {
      waiter = null;
    }

    // --- Bulaşıkçı (Faz 2e opsiyonel kısmi assist): kirli topla → bulaşığa götür → yıka ---
    // Garson deseni: oyuncudan yavaş + küçük taşıma → tek başına yetişmez (oyuncu hâlâ gerekli).
    let dishwasher: Waiter | null = s.dishwasher;
    if (hasDishwasher) {
      const dw: Waiter = dishwasher
        ? { pos: [...dishwasher.pos] as Vec3, tray: dishwasher.tray }
        : { pos: [...LAYOUT.dishwasherHome] as Vec3, tray: 0 };
      const dStep = C.dishwasher.moveSpeed * dt;
      const dCap = C.dishwasher.carryCapacity;
      if (dw.tray >= dCap || (dw.tray > 0 && dishes.length === 0)) {
        // Dolu (ya da elinde var ama toplanacak kalmadı) → bulaşığa BFS rotasıyla götür, bitişikte yıka.
        if (navStep(dw.pos, LAYOUT.dishStation, dStep, navGrid, REACH_WASH, player, obstacles)) {
          cleanCups += dw.tray;
          dw.tray = 0;
        }
      } else if (dishes.length > 0) {
        // Topla: en yakın kirli bardağa BFS rotasıyla yaklaş; collectRadius'a girince al (kirli masa
        // üstünde, masa gövdesi engel → tam varış imkansız; mesafe-tabanlı toplama).
        let target = dishes[0];
        let td = Infinity;
        for (const d of dishes) {
          const dd = dist2D(dw.pos, d.pos);
          if (dd < td) { td = dd; target = d; }
        }
        if (navStep(dw.pos, target.pos, dStep, navGrid, C.cups.collectRadius, player, obstacles)) {
          dishes = dishes.filter((d) => d.id !== target.id);
          dw.tray += 1;
        }
      } else {
        // Boşta: köşeye dön.
        navStep(dw.pos, LAYOUT.dishwasherHome, dStep, navGrid, REACH_HOME, player, obstacles);
      }
      dishwasher = dw;
    } else {
      dishwasher = null;
    }

    // --- Mekânsal etkileşim noktaları (D-018 §2, HAREKET-TEMELLİ) ---
    // Oyuncu fiziksel olarak aynı anda TEK dolum noktasının üstünde olabilir. Para yalnız oyuncu DURUNCA akar:
    // üstünden GEÇERKEN (hareket halinde) hiç alınmaz, DURDUĞU (input bıraktığı) anda HEMEN başlar (sayaç/countdown YOK).
    const padGate: GateState = {
      padsDone,
      tables,
      stationLevel,
      lifetime: lifetime.toNumber(),
      waiterServed: stats.waiterServed,
    };
    // EKRANDA TEK PAD (quest sistemi): görünürlük visiblePads'ten (Pad.tsx ile aynı kaynak).
    const activePads: PadDef[] = visiblePads(questIndex, padGate);

    const upgradeUnlocked = upgradeZoneUnlocked(padGate) && stationLevel < stationSoftMaxLevel();
    const tableUnlocked = tableUpgradeZoneUnlocked(padGate);
    const waiterUpUnlocked = hasWaiter && waiterUpgradeUnlocked(padGate, waiterLevel);

    // --- Yeni-özellik bildirimi (D-019 §4) ---
    // Bir ikincil özellik (yükseltme/personel) İLK kez açıldığında kısa toast. revealSeen baseline init'te
    // kurulduğu için zaten açık olanlar tekrar bildirmez (yeniden-yükleme spam'ı yok; persist gerekmez).
    for (const [key, text] of revealKeys(padGate, hasWaiter, waiterLevel)) {
      if (!revealSeen.includes(key)) {
        revealSeen = [...revealSeen, key];
        notice = { text, ttl: 4.5 };
        // Yeni açılan noktaya anlık kamera pan ("orada bir şey var" — kullanıcı isteği 2026-06-09).
        const rp =
          key === 'upgrade' ? LAYOUT.upgradeZone
          : key === 'waiterUp' ? LAYOUT.waiterUpgradeSpot
          : key === 'tableUp' ? LAYOUT.tables[0].upgradeSpot
          : null;
        if (rp) camFocus = { pos: [rp[0], rp[1], rp[2]], ttl: CAM_FOCUS_TTL };
      }
    }
    if (notice) {
      const ttl = notice.ttl - dt;
      notice = ttl > 0 ? { text: notice.text, ttl } : null;
    }

    // Oyuncu DURUYOR mu? (input ~0). Para yalnız dururken akar → üstünden geçerken (hareket) alınmaz.
    const fillReady = Math.hypot(input[0], input[1]) <= 0.1;

    // Oyuncunun şu an üstünde durduğu dolum noktasının kanonik id'si (pad.id / FILL_TEA / FILL_TABLE+i).
    let onFillId: string | null = null;
    for (const pad of activePads) {
      const pp = LAYOUT.padPos[pad.id];
      if (pp && dist2D(player, pp) < PAD_RADIUS) { onFillId = pad.id; break; }
    }
    if (!onFillId && upgradeUnlocked && dist2D(player, LAYOUT.upgradeZone) < PAD_RADIUS) onFillId = FILL_TEA;
    if (!onFillId && waiterUpUnlocked && dist2D(player, LAYOUT.waiterUpgradeSpot) < WAITER_UP_RADIUS) onFillId = FILL_WAITER;
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

    // --- Mekânsal çay yükseltme noktası (ana ocağın önünde dur → altta bar dolar) ---
    // Biriken ₺ KORUNUR (çıkınca sıfırlanmaz; D-018 dwell) → para harcanıp boşa gitmez.
    if (onFillId === FILL_TEA) {
      const cost = stationUpgradeCost(stationLevel);
      if (fillReady && wallet.gt(0)) {
        const amt = Math.min(C.teaStation.upgradeFillRate * dt, wallet.toNumber(), cost - upgradeFill);
        if (amt > 0) {
          upgradeFill += amt;
          wallet = wallet.sub(amt);
        }
      }
      if (upgradeFill >= cost) {
        stationLevel += 1;
        xp += C.xp.perUpgrade;
        upgradeFill = 0;
        cleanCups += C.cups.poolPerLevel; // havuz ocak seviyesiyle büyür (Faz 2e)
      }
      const nextCost = stationLevel < stationSoftMaxLevel() ? stationUpgradeCost(stationLevel) : cost;
      // GÖRSEL: ocak L1'den başlar (iç stationLevel 0-tabanlı; etiket +1). Soft max → "Usta" (💎/video, Faz 4).
      activeZone = {
        kind: 'upgrade',
        label: `Çay Ocağı L${stationLevel + 1}${stationLevel < stationSoftMaxLevel() ? ` → L${stationLevel + 2}` : ' (Usta 💎)'}`,
        fill: upgradeFill,
        cost: nextCost,
      };
    }

    // --- Mekânsal garson hız yükseltme (D-018 §6): garsonu tuttuğun noktada dur → garson L2 hızlanır.
    // Biriken ₺ KORUNUR (çıkınca sıfırlanmaz; D-018 dwell). Tek seviye (L1→L2); sonrası max → işaret kapanır.
    if (onFillId === FILL_WAITER) {
      const cost = C.waiter.upgradeCost;
      if (fillReady && wallet.gt(0)) {
        const amt = Math.min(C.waiter.upgradeFillRate * dt, wallet.toNumber(), cost - waiterUpgradeFill);
        if (amt > 0) {
          waiterUpgradeFill += amt;
          wallet = wallet.sub(amt);
        }
      }
      if (waiterUpgradeFill >= cost) {
        waiterLevel += 1;
        xp += C.xp.perUpgrade;
        waiterUpgradeFill = 0;
      }
      // GÖRSEL: garson L1'den başlar (iç waiterLevel 0-tabanlı; etiket +1). Soft max sonrası işaret görünmez.
      activeZone = {
        kind: 'upgrade',
        label: `Garson L${waiterLevel + 1}${waiterLevel < waiterSoftMaxLevelCfg() ? ` → L${waiterLevel + 2} (hız)` : ''}`,
        fill: waiterUpgradeFill,
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
    // Garson pad'i bu frame tamamlandıysa varlığını kur (hasWaiter artık türetilir).
    if (out.hasWaiter && !waiter) waiter = { pos: [...LAYOUT.waiterHome] as Vec3, tray: 0 };
    // Bulaşıkçı pad'i bu frame tamamlandıysa varlığını kur.
    if (out.hasDishwasher && !dishwasher) dishwasher = { pos: [...LAYOUT.dishwasherHome] as Vec3, tray: 0 };

    // --- GÖREV İLERLEMESİ ---
    // Aktif görev karşılandıysa sıradakine geç (aynı tick'te birden çok karşılanabilir — ör. migrasyon
    // sonrası): tamamlama toast'u + kamera YENİ hedefe pan ("orada bir şey var" hissi, kullanıcı isteği).
    const questCtx: QuestCtx = {
      padsDone,
      stationLevel,
      waiterLevel,
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
      const p = questFocusPos(C.quests[questIndex].target, tableLevels, out.tables);
      camFocus = { pos: [p[0], p[1], p[2]], ttl: CAM_FOCUS_TTL };
    }
    // Kamera odağı: joystick/klavye girdisi anında iptal eder (oyuncu kontrolü üstün); süre dolunca biter.
    if (camFocus) {
      const ttl = camFocus.ttl - dt;
      const moving = Math.hypot(input[0], input[1]) > 0.1;
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
      stationLevel,
      tableLevels,
      waiterLevel,
      serviceSpeedMult: out.serviceSpeedMult,
      padsDone,
      padFills,
      hasWaiter: out.hasWaiter,
      hasDishwasher: out.hasDishwasher,
      upgradeFill,
      tableUpgradeFills,
      waiterUpgradeFill,
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
      waiter,
      dishwasher,
      readyCups,
      brewProgress,
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

  // Çay istasyonu yükseltme (₺ ile L1-L4). L5 Usta = 💎/video (Faz 4).
  upgradeStation: () => {
    const s = get();
    if (s.stationLevel >= stationSoftMaxLevel()) return false;
    const cost = stationUpgradeCost(s.stationLevel);
    if (s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      stationLevel: s.stationLevel + 1,
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
    const p = questFocusPos(C.quests[s.questIndex].target, s.tableLevels, s.tables);
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
      stationLevel: s.stationLevel,
      tableLevels: [...s.tableLevels],
      waiterLevel: s.waiterLevel,
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
