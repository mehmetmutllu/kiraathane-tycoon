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
  trayCapacityForLevel,
  trayUpgradeCost,
  tableUpgradeCost,
  tableTip,
  tablePatience,
  derivedFromPads,
  type PadDef,
  type GateState,
  type Requires,
} from '../config/economy.config';
import { defaultSave, loadSave, writeSave, clearSave, type SaveData } from './save';
import { buildNavGrid, findNavPath, type NavGrid, type NavSolid } from './nav';

// ---- Sahne yerleşimi (dünya birimi, zemin y=0) ----
// Her pad/zone, açtığı/etkilediği objenin TAM yerinde durur (mekânsal tycoon).
// FAZ 2g yerleşim v3 (D-016, kullanıcı feedback 2026-06-07 #2: v2 sıkıştı/hapsetti, masalar iri, personel
// hâlâ masadan geçiyor): ALAN GENİŞ (ferah) ama içerik SOL-ÖN'de TUĞLA (offset) dizilimle → her koltuğa
// açık dikey koridor; SAĞ TARAF BOŞ (büyüme/küçük-başlangıç hissi). Mutfak sol-arka köşede duvara 0.
// Masalar KÜÇÜLDÜ (tableHalf 0.75→0.6). Collision: oyuncu mobilya+sandalye+aktör (HAPSETMEZ: zaten içindeyse
// çıkışa izin); garson/bulaşıkçı masa gövdelerinden DOLAŞIR (moveAvoid).
export const LAYOUT = {
  entrance: [0, 0.6, 4.2] as Vec3,
  player: [0, 0.6, 2.8] as Vec3,
  // Çay ocağı (D-016: zone'un TEK ana ocağı). Arka duvar şeridinin solu, duvara 0.
  stations: [[-3.0, 0, -4.4] as Vec3],
  // Oynanabilir alan BÜYÜK (kullanıcı: "alan baya büyümeli, karakterler alana göre iri"). Masalar köşelere
  // yayılır → orta geniş yürüme alanı, sandalyeler kenarda kalır (koridor tıkanmaz).
  area: { minX: -5.5, maxX: 5.5, minZ: -5.0, maxZ: 4.5 },
  // Masa slotları — 2×2, KÖŞELERE YAYIK (kolon gap 5, satır gap 3.6) → her yön bol açık; sandalye(seat=table z+1)
  // merkezi koridoru tıkamaz. Kolon x -2.5/2.5, satır z -2.2/1.4.
  // upgradeSpot (Faz 2h masa-başı): masanın YANINDA (merkeze doğru +1.2 x), oyuncu burada durunca O masa yükselir.
  tables: [
    { table: [-2.5, 0, -2.2] as Vec3, seat: [-2.5, 0.6, -1.2] as Vec3, upgradeSpot: [-1.3, 0, -2.2] as Vec3 },
    { table: [2.5, 0, -2.2] as Vec3, seat: [2.5, 0.6, -1.2] as Vec3, upgradeSpot: [1.3, 0, -2.2] as Vec3 },
    { table: [-2.5, 0, 1.4] as Vec3, seat: [-2.5, 0.6, 2.4] as Vec3, upgradeSpot: [-1.3, 0, 1.4] as Vec3 },
    { table: [2.5, 0, 1.4] as Vec3, seat: [2.5, 0.6, 2.4] as Vec3, upgradeSpot: [1.3, 0, 1.4] as Vec3 },
  ],
  // Pad pozisyonları: açtıkları objenin yerinde (masa pad'leri sıralı → eş-zamanlı çakışmaz).
  padPos: {
    table2: [2.5, 0, -2.2] as Vec3, // 2. masa slotu
    table3: [-2.5, 0, 1.4] as Vec3, // 3. masa slotu
    table4: [2.5, 0, 1.4] as Vec3, // 4. masa slotu
    samovar: [1.0, 0, -4.4] as Vec3, // arka duvar şeridi, bulaşığın sağı (semavere geçiş)
    waiter: [-4.8, 0, 2.0] as Vec3, // sol-uzak (personel)
    dishwasher: [4.8, 0, 2.0] as Vec3, // sağ-uzak (personel)
  } as Record<string, Vec3>,
  // Mekânsal çay yükseltme noktası: ocağın solunda açık şeritte (masa kapatmaz; sol lane'den erişilir).
  upgradeZone: [-3.5, 0, -3.0] as Vec3,
  // Mekânsal tepsi yükseltme noktası (Faz 2e-B): giriş önü orta (oyuncunun doğal yolu).
  trayUpgradeZone: [0, 0, 3.8] as Vec3,
  // Garson boştayken bekleyeceği köşe (sol-uzak, pad'inin altı).
  waiterHome: [-4.8, 0, 0.8] as Vec3,
  // Bulaşık noktası (Faz 2e): arka duvar şeridi, ocağın sağında. ocaktan dist 2.0>washRadius 1.6
  // (ocakta dururken kirli yıkanmaz; ayrı etkileşim).
  dishStation: [-1.0, 0, -4.4] as Vec3,
  // Bulaşıkçı boştayken bekleyeceği köşe (sağ-uzak, pad'inin altı).
  dishwasherHome: [4.8, 0, 0.8] as Vec3,
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

/** stationLevel'in demleme hız (throughput) çarpanı — çay/dk; fiyatı DEĞİL. */
function brewThroughputMult(level: number): number {
  return upgradeOutputMultiplier(C.teaStation.upgrade, level);
}

/** Bir bardak çayın demlenme süresi (sn) — throughput arttıkça kısalır. */
function brewTime(level: number, serviceSpeedMult: number): number {
  return (C.npc.orderTime * serviceSpeedMult) / brewThroughputMult(level);
}

/** Oyuncunun tepsi kapasitesi (tek turda taşınan çay/kirli). Seviye ile büyür (Faz 2e-B). */
export const trayCapacity = (level = 0) => trayCapacityForLevel(level);
/** ₺ ile çıkılabilen en yüksek tepsi seviyesi. */
export const trayMaxLevel = () => C.serving.trayUpgrade.maxLevel;
/** Mevcut seviyeden bir sonraki tepsi yükseltmesinin maliyeti. */
export const trayNextCost = (level: number) => trayUpgradeCost(level);
/** Tepsi yükseltme noktası şu an aktif mi (önkoşulu karşılandı mı)? */
export function trayUpgradeZoneUnlocked(g: GateState): boolean {
  return requiresMet(C.serving.trayUpgradeRequires, g);
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

function findFreeTable(npcs: Npc[], tables: number): number {
  const used = new Set(npcs.filter((n) => n.state !== 'leaving').map((n) => n.tableIndex));
  for (let i = 0; i < tables; i++) if (!used.has(i)) return i;
  return -1;
}

/** Oyuncunun o an üstünde durduğu/doldurduğu zone (HUD'da alttaki bar). */
export interface ActiveZone {
  kind: 'pad' | 'upgrade';
  label: string;
  fill: number;
  cost: number;
}

export interface GameState {
  // Kalıcı
  wallet: Decimal;
  diamonds: Decimal;
  lifetime: Decimal;
  tables: number;
  stations: number;
  stationLevel: number;
  /** Tepsi kapasite yükseltme seviyesi (Faz 2e-B; persist). */
  trayLevel: number;
  /** Masa-başı yükseltme seviyeleri (Faz 2h; persist; index = masa slotu; bahşiş + sabır). My Hotel oda mantığı. */
  tableLevels: number[];
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
  /** Tepsi yükseltme noktasındaki kısmi dolum (transient; çay yükseltme gibi). */
  trayUpgradeFill: number;
  /** Masa-başı yükseltme noktalarındaki kısmi dolum (transient; index = masa slotu). */
  tableUpgradeFills: number[];
  activeZone: ActiveZone | null;
  nextStepLabel: string;
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

/** HUD için tek satırlık "sıradaki adım" yönlendirmesi. */
export function nextStep(g: GateState): string {
  const pad = currentPad(g);
  if (pad) return `Sıradaki: ${pad.label} (₺${pad.cost})`;
  // Aktif omurga pad yok → ilk açılmamış omurga pad neyle kilitli, onu söyle (opsiyoneller atlanır).
  const undone = (C.pads as readonly PadDef[]).find((p) => !p.optional && !g.padsDone.includes(p.id));
  if (undone) {
    const r = undone.requires as Requires | undefined;
    if (r?.minStationLevel != null && g.stationLevel < r.minStationLevel)
      return `Çay ocağını L${r.minStationLevel} yap → ${undone.label}`;
    if (r?.minLifetime != null && g.lifetime < r.minLifetime)
      return `₺${r.minLifetime} kazan → ${undone.label}`;
    return `${undone.label} için ilerle`;
  }
  if (g.stationLevel < stationSoftMaxLevel()) return 'Çay ocağını yükseltmeye devam et';
  return 'Tüm açılışlar tamam ✓';
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
  trayLevel: 0,
  tableLevels: LAYOUT.tables.map(() => 0),
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
  trayUpgradeFill: 0,
  tableUpgradeFills: LAYOUT.tables.map(() => 0),
  activeZone: null,
  nextStepLabel: '',
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
        incomeRate(derived.tables, save.stationLevel, derived.serviceSpeedMult) * Math.min(elapsed, cap),
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
      // Savunmacı: eski kayıt yeni max'tan yüksek tepsi seviyesi taşıyorsa tavana çek (Faz 2f 8→6).
      trayLevel: Math.min(save.trayLevel, C.serving.trayUpgrade.maxLevel),
      // Masa-başı seviyeleri: slot sayısına normalize et + her birini soft max'a clamp'le.
      tableLevels: LAYOUT.tables.map((_, i) => Math.min(save.tableLevels[i] ?? 0, tableSoftMaxLevel())),
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
      trayUpgradeFill: 0,
      tableUpgradeFills: LAYOUT.tables.map(() => 0),
      activeZone: null,
      nextStepLabel: nextStep({
        padsDone: save.padsDone,
        tables: derived.tables,
        stationLevel: save.stationLevel,
        lifetime: lifetime.toNumber(),
      }),
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
    let trayLevel = s.trayLevel;
    const tableLevels = s.tableLevels.slice(); // masa-başı seviyeler (kopya; bu tick'te yükseltilebilir)
    let readyCups = s.readyCups;
    let brewProgress = s.brewProgress;
    let tray = s.tray;
    let cleanCups = s.cleanCups;
    let carriedDirty = s.carriedDirty;
    let trayUpgradeFill = s.trayUpgradeFill;
    const tableUpgradeFills = s.tableUpgradeFills.slice();
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

    // --- Spawn ---
    const activeCount = npcs.filter((n) => n.state !== 'leaving').length;
    if (spawnTimer <= 0 && activeCount < C.npc.maxConcurrent) {
      const free = findFreeTable(npcs, tables);
      if (free >= 0) {
        npcs.push({
          id: nextId++,
          state: 'toTable',
          pos: [...LAYOUT.entrance] as Vec3,
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
        case 'toTable':
          if (moveAvoid(n.pos, slot.seat, step, obstacles, ar)) {
            // Oturdu; çay servisini bekler. Sabır timer'ı başlar (D-011); OTURDUĞU masanın seviyesi sabrı uzatır (Faz 2h).
            n.state = 'waitingForTea';
            n.timer = tablePatience(tableLevels[n.tableIndex] ?? 0);
          }
          break;
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
            dishes.push({
              id: nextId++,
              pos: [slot.table[0] + (Math.random() - 0.5) * 0.6, 0.95, slot.table[2] + (Math.random() - 0.5) * 0.6],
            });
            n.state = 'leaving';
          }
          break;
        case 'leaving':
          if (moveAvoid(n.pos, LAYOUT.entrance, step, obstacles, ar)) removed.push(n.id);
          break;
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
      // MOBİLYA = KATI engel (asla içinden geçilmez), eksen-başı kayma (diyagonalde kenardan süzülür,
      // kafa kafaya gelince durur). Zorlama istisnası YOK → zorlasan da masanın içine geçemezsin.
      const furn = activeSolids(tables);
      if (dxIn !== 0 && hitsSolid(nx, oldZ, furn, pr)) nx = oldX;
      if (dzIn !== 0 && hitsSolid(nx, nz, furn, pr)) nz = oldZ;
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
        } else {
          keep.push(c);
        }
      }
      coins = keep;
    }

    // --- Servis (D-011): ocakta tepsiyi doldur, bekleyen masalara çay bırak (yakınlık) ---
    const trayCap = trayCapacity(trayLevel);
    // Ocağa yaklaşınca hazır çaylardan tepsi dolar (herhangi bir açık ocak yeterli).
    // Faz 2f "eli boşken" kısıtı (karar 2026-06-06): kirli taşırken (carriedDirty>0) temiz ALINMAZ
    // → tepside hep tek tür (tek renk); "götür → topla → yıka" ritmi korunur.
    if (tray < trayCap && readyCups > 0 && carriedDirty === 0) {
      for (let i = 0; i < stations; i++) {
        if (dist2D(player, LAYOUT.stations[i]) < C.serving.pickupRadius) {
          const take = Math.min(trayCap - tray, readyCups);
          tray += take;
          readyCups -= take;
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
        }
      }
    }

    // --- Bardak döngüsü (Faz 2e): oyuncu masadaki kirli bardakları toplar, bulaşıkta yıkar (yakınlık) ---
    // Faz 2f "eli boşken" kısıtı (simetrik): temiz çay taşırken (tray>0) kirli TOPLANMAZ → tepsi tek renk.
    const dirtyCap = trayCapacity(trayLevel);
    if (tray === 0 && carriedDirty < dirtyCap && dishes.length) {
      const keep: Dish[] = [];
      for (const d of dishes) {
        if (carriedDirty < dirtyCap && dist2D(player, d.pos) < C.cups.collectRadius) carriedDirty += 1;
        else keep.push(d);
      }
      dishes = keep;
    }
    // Bulaşık noktasına yaklaşınca taşınan kirliler yıkanır → temiz havuza döner.
    if (carriedDirty > 0 && dist2D(player, LAYOUT.dishStation) < C.cups.washRadius) {
      cleanCups += carriedDirty;
      carriedDirty = 0;
    }

    // --- Garson (D-012 opsiyonel kısmi assist): ocaktan çay al → en yakın bekleyen masaya götür ---
    // Oyuncudan yavaş + tek tepsili; tek başına büyüyen mekânı döndüremez (oyuncu hâlâ gerekli).
    let waiter: Waiter | null = s.waiter;
    if (hasWaiter) {
      const w: Waiter = waiter
        ? { pos: [...waiter.pos] as Vec3, tray: waiter.tray }
        : { pos: [...LAYOUT.waiterHome] as Vec3, tray: 0 };
      const wStep = C.waiter.moveSpeed * dt;
      const wTrayCap = C.waiter.trayCapacity;
      const waitingNpcs = liveNpcs.filter((n) => n.state === 'waitingForTea');
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

    // --- Pad doldurma (omurga + opsiyonel pad'ler; her pad açtığı objenin yerinde) ---
    // Oyuncu fiziksel olarak aynı anda tek pad'in üstünde olabilir → bulunca işle ve çık.
    const padGate: GateState = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber() };
    const activePads: PadDef[] = [];
    const backbonePad = currentPad(padGate);
    if (backbonePad) activePads.push(backbonePad);
    for (const op of availableOptionalPads(padGate)) activePads.push(op);
    for (const pad of activePads) {
      const padPos = LAYOUT.padPos[pad.id];
      if (!padPos || dist2D(player, padPos) >= PAD_RADIUS) continue;
      let fill = padFills[pad.id] ?? 0;
      if (wallet.gt(0)) {
        const amt = Math.min(pad.fillRate * dt, wallet.toNumber(), pad.cost - fill);
        if (amt > 0) {
          fill += amt;
          wallet = wallet.sub(amt);
        }
      }
      if (fill >= pad.cost) {
        // Pad tamamlandı: SADECE padsDone'a ekle (etkiler türetilir, D-015), kısmi dolumu temizle.
        padsDone = [...padsDone, pad.id];
        const rest = { ...padFills };
        delete rest[pad.id];
        padFills = rest;
        activeZone = null;
      } else {
        padFills = { ...padFills, [pad.id]: fill };
        activeZone = { kind: 'pad', label: pad.label, fill, cost: pad.cost };
      }
      break;
    }

    // --- Mekânsal çay yükseltme noktası (ana ocağın önünde dur → altta bar dolar) ---
    // Gating: önce 2. masa açılmalı (D-010 sırası); aksi halde nokta pasif.
    const upgradeUnlocked = upgradeZoneUnlocked({
      padsDone, tables, stationLevel, lifetime: lifetime.toNumber(),
    });
    if (upgradeUnlocked && stationLevel < stationSoftMaxLevel()) {
      if (dist2D(player, LAYOUT.upgradeZone) < PAD_RADIUS) {
        const cost = stationUpgradeCost(stationLevel);
        if (wallet.gt(0)) {
          const amt = Math.min(C.teaStation.upgradeFillRate * dt, wallet.toNumber(), cost - upgradeFill);
          if (amt > 0) {
            upgradeFill += amt;
            wallet = wallet.sub(amt);
          }
        }
        if (upgradeFill >= cost) {
          stationLevel += 1;
          upgradeFill = 0;
          cleanCups += C.cups.poolPerLevel; // havuz ocak seviyesiyle büyür (Faz 2e)
        }
        const nextCost = stationLevel < stationSoftMaxLevel() ? stationUpgradeCost(stationLevel) : cost;
        activeZone = {
          kind: 'upgrade',
          label: `Çay Ocağı L${stationLevel}${stationLevel < stationSoftMaxLevel() ? ` → L${stationLevel + 1}` : ' (max)'}`,
          fill: upgradeFill,
          cost: nextCost,
        };
      }
    } else {
      upgradeFill = 0;
    }

    // --- Mekânsal tepsi yükseltme noktası (Faz 2e-B): giriş önünde dur → tepsi kapasitesi büyür ---
    // Gating: 3. masadan sonra açılır (trayUpgradeRequires). Çay yükseltme noktasıyla aynı desen.
    const trayUnlocked = trayUpgradeZoneUnlocked({
      padsDone, tables, stationLevel, lifetime: lifetime.toNumber(),
    });
    if (trayUnlocked && trayLevel < trayMaxLevel()) {
      if (dist2D(player, LAYOUT.trayUpgradeZone) < PAD_RADIUS) {
        const cost = trayNextCost(trayLevel);
        if (wallet.gt(0)) {
          const amt = Math.min(C.serving.trayUpgrade.fillRate * dt, wallet.toNumber(), cost - trayUpgradeFill);
          if (amt > 0) {
            trayUpgradeFill += amt;
            wallet = wallet.sub(amt);
          }
        }
        if (trayUpgradeFill >= cost) {
          trayLevel += 1;
          trayUpgradeFill = 0;
        }
        const nextCost = trayLevel < trayMaxLevel() ? trayNextCost(trayLevel) : cost;
        activeZone = {
          kind: 'upgrade',
          label: `Tepsi ${trayCapacity(trayLevel)}${trayLevel < trayMaxLevel() ? ` → ${trayCapacity(trayLevel + 1)}` : ' (max)'}`,
          fill: trayUpgradeFill,
          cost: nextCost,
        };
      }
    } else {
      trayUpgradeFill = 0;
    }

    // --- Mekânsal masa yükseltme (Faz 2h, MASA-BAŞI / My Hotel): her açık masanın YANINDAKİ noktada dur →
    // O masanın bahşişi + sabrı artar. Gating: 2. masa açılınca belirir. Oyuncu aynı anda tek noktada (break). ---
    const tableUnlocked = tableUpgradeZoneUnlocked({
      padsDone, tables, stationLevel, lifetime: lifetime.toNumber(),
    });
    if (tableUnlocked) {
      for (let i = 0; i < tables; i++) {
        if (tableLevels[i] >= tableSoftMaxLevel()) continue;
        if (dist2D(player, LAYOUT.tables[i].upgradeSpot) >= TABLE_UP_RADIUS) continue;
        const cost = tableNextCost(tableLevels[i]);
        let fill = tableUpgradeFills[i] ?? 0;
        if (wallet.gt(0)) {
          const amt = Math.min(C.tables.upgradeFillRate * dt, wallet.toNumber(), cost - fill);
          if (amt > 0) {
            fill += amt;
            wallet = wallet.sub(amt);
          }
        }
        if (fill >= cost) {
          tableLevels[i] += 1;
          fill = 0;
        }
        tableUpgradeFills[i] = fill;
        const nextCost = tableLevels[i] < tableSoftMaxLevel() ? tableNextCost(tableLevels[i]) : cost;
        activeZone = {
          kind: 'upgrade',
          label: `Masa ${i + 1}: L${tableLevels[i]}${tableLevels[i] < tableSoftMaxLevel() ? ` → L${tableLevels[i] + 1} (+${C.tables.tipBase} bahşiş)` : ' (max)'}`,
          fill,
          cost: nextCost,
        };
        break;
      }
    }

    // --- D-015: padsDone değiştiyse türetilen alanlar yeniden hesaplanır (tek yazım noktası) ---
    const out = derivedFromPads(padsDone);
    // Garson pad'i bu frame tamamlandıysa varlığını kur (hasWaiter artık türetilir).
    if (out.hasWaiter && !waiter) waiter = { pos: [...LAYOUT.waiterHome] as Vec3, tray: 0 };
    // Bulaşıkçı pad'i bu frame tamamlandıysa varlığını kur.
    if (out.hasDishwasher && !dishwasher) dishwasher = { pos: [...LAYOUT.dishwasherHome] as Vec3, tray: 0 };

    // --- Periyodik kayıt ---
    let saveTimer = s.saveTimer - dt;
    if (saveTimer <= 0) {
      saveTimer = SAVE_INTERVAL;
      get().saveNow();
    }

    const nextStepLabel = nextStep({ padsDone, tables: out.tables, stationLevel, lifetime: lifetime.toNumber() });

    set({
      npcs: liveNpcs,
      coins,
      dishes,
      wallet,
      lifetime,
      tables: out.tables,
      stations: out.stations,
      stationLevel,
      trayLevel,
      tableLevels,
      serviceSpeedMult: out.serviceSpeedMult,
      padsDone,
      padFills,
      hasWaiter: out.hasWaiter,
      hasDishwasher: out.hasDishwasher,
      upgradeFill,
      trayUpgradeFill,
      tableUpgradeFills,
      activeZone,
      nextStepLabel,
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

  saveNow: () => {
    const s = get();
    // D-015: tables/stations/serviceSpeedMult/hasWaiter KAYDEDİLMEZ — yüklemede padsDone'dan türetilir.
    writeSave({
      ...defaultSave(),
      wallet: s.wallet.toString(),
      diamonds: s.diamonds.toString(),
      lifetime: s.lifetime.toString(),
      stationLevel: s.stationLevel,
      trayLevel: s.trayLevel,
      tableLevels: [...s.tableLevels],
      padsDone: [...s.padsDone],
      padFills: { ...s.padFills },
      lastSaved: Date.now(),
    });
  },

  hardReset: () => {
    clearSave();
    get().init();
  },
}));

export { TEA_PRICE, brewThroughputMult, brewTime, incomeRate };
