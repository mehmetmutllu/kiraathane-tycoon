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
  derivedFromPads,
  type PadDef,
  type GateState,
  type Requires,
} from '../config/economy.config';
import { defaultSave, loadSave, writeSave, clearSave, type SaveData } from './save';

// ---- Sahne yerleşimi (dünya birimi, zemin y=0) ----
// Her pad/zone, açtığı/etkilediği objenin TAM yerinde durur (mekânsal tycoon).
export const LAYOUT = {
  entrance: [0, 0.6, 6.5] as Vec3,
  player: [0, 0.6, 2.5] as Vec3,
  // Çay ocağı (D-012: başlangıç salonu TEK ana ocak; 4 masaya throughput'la yetişir).
  // 2. ocak Faz 3a'da YENİ salonla gelir → burada tek eleman.
  stations: [[0, 0, -5] as Vec3],
  bounds: 7,
  // Masa slotları (1 ocak : 4 masa, 2×2 derli toplu) + müşterinin oturduğu yer (seat = table + z+1.1).
  tables: [
    { table: [-2.5, 0, -1.5] as Vec3, seat: [-2.5, 0.6, -0.4] as Vec3 },
    { table: [2.5, 0, -1.5] as Vec3, seat: [2.5, 0.6, -0.4] as Vec3 },
    { table: [-2.5, 0, 1.2] as Vec3, seat: [-2.5, 0.6, 2.3] as Vec3 },
    { table: [2.5, 0, 1.2] as Vec3, seat: [2.5, 0.6, 2.3] as Vec3 },
  ],
  // Pad pozisyonları: açtıkları objenin yerinde.
  padPos: {
    table2: [2.5, 0, -1.5] as Vec3, // 2. masa slotu
    table3: [-2.5, 0, 1.2] as Vec3, // 3. masa slotu
    table4: [2.5, 0, 1.2] as Vec3, // 4. masa slotu
    samovar: [1.6, 0, -3.4] as Vec3, // ana ocağın sağ-önü (semavere geçiş)
    waiter: [-4.5, 0, 4] as Vec3, // personel köşesi (giriş sol-yanı, masalardan uzak)
    dishwasher: [-4.8, 0, -1.0] as Vec3, // bulaşık noktasının yanı (sol duvar)
  } as Record<string, Vec3>,
  // Mekânsal çay yükseltme noktası: ana ocağın sol-önünde dur → altta bar dolar (semaverle çakışmaz).
  upgradeZone: [-1.6, 0, -3.4] as Vec3,
  // Garson boştayken bekleyeceği köşe (personel home).
  waiterHome: [4.5, 0, 4] as Vec3,
  // Bulaşık noktası (Faz 2e): sol duvar, masalardan/yükseltme noktasından uzak. Kirliler burada yıkanır.
  dishStation: [-4.8, 0, -3.0] as Vec3,
  // Bulaşıkçı boştayken bekleyeceği köşe (sol-orta).
  dishwasherHome: [-4.8, 0, 1.5] as Vec3,
} as const;

const NPC_SPEED = 2.6;
const PAD_RADIUS = 1.3;
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

/** Oyuncunun tepsi kapasitesi (tek turda taşınan çay/kirli). Yükseltme Faz 2e (Dilim B). */
export const trayCapacity = () => C.serving.trayCapacityBase;

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
    let coins: Coin[] = s.coins.map((c) => ({ ...c }));
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
    let upgradeFill = s.upgradeFill;
    let activeZone: ActiveZone | null = null;
    let stationLevel = s.stationLevel;
    let readyCups = s.readyCups;
    let brewProgress = s.brewProgress;
    let tray = s.tray;
    let cleanCups = s.cleanCups;
    let carriedDirty = s.carriedDirty;
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
          if (moveToward(n.pos, slot.seat, step)) {
            // Oturdu; çay servisini bekler. Sabır timer'ı başlar (D-011).
            n.state = 'waitingForTea';
            n.timer = C.npc.patience;
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
            // Öde: parayı masanın yanına düşür (fiyat sabit; gelir hacimden gelir).
            coins.push({
              id: nextId++,
              pos: [slot.table[0] + (Math.random() - 0.5), 0.3, slot.table[2] + 0.6 + (Math.random() - 0.5)],
              value: TEA_PRICE,
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
          if (moveToward(n.pos, LAYOUT.entrance, step)) removed.push(n.id);
          break;
      }
    }
    const liveNpcs = removed.length ? npcs.filter((n) => !removed.includes(n.id)) : npcs;

    // --- Oyuncu hareketi ---
    const jMag = Math.hypot(s.inputJoystick[0], s.inputJoystick[1]);
    const input = jMag > 0.05 ? s.inputJoystick : s.inputKeyboard;
    const player = [...s.player] as Vec3;
    player[0] += input[0] * C.player.moveSpeed * dt;
    player[2] += input[1] * C.player.moveSpeed * dt;
    player[0] = Math.max(-LAYOUT.bounds, Math.min(LAYOUT.bounds, player[0]));
    player[2] = Math.max(-LAYOUT.bounds, Math.min(LAYOUT.bounds, player[2]));

    // --- Para toplama (yakınlık) ---
    if (coins.length) {
      const keep: Coin[] = [];
      for (const c of coins) {
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
    const trayCap = trayCapacity();
    // Ocağa yaklaşınca hazır çaylardan tepsi dolar (herhangi bir açık ocak yeterli).
    if (tray < trayCap && readyCups > 0) {
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
    if (tray > 0) {
      for (const n of liveNpcs) {
        if (tray <= 0) break;
        if (n.state !== 'waitingForTea') continue;
        if (dist2D(player, LAYOUT.tables[n.tableIndex].seat) < C.serving.serveRadius) {
          n.state = 'drinking';
          n.timer = C.npc.eatTime;
          tray -= 1;
        }
      }
    }

    // --- Bardak döngüsü (Faz 2e): oyuncu masadaki kirli bardakları toplar, bulaşıkta yıkar (yakınlık) ---
    const dirtyCap = trayCapacity();
    if (carriedDirty < dirtyCap && dishes.length) {
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
          const d = dist2D(w.pos, LAYOUT.tables[n.tableIndex].seat);
          if (n.timer < bestTimer - 1e-6 || (Math.abs(n.timer - bestTimer) <= 1e-6 && d < bestDist)) {
            bestTimer = n.timer;
            bestDist = d;
            best = n;
          }
        }
        if (moveToward(w.pos, LAYOUT.tables[best.tableIndex].seat, wStep)) {
          best.state = 'drinking';
          best.timer = C.npc.eatTime;
          w.tray -= 1;
        }
      } else if (w.tray < wTrayCap && waitingNpcs.length > 0) {
        // Yükleme: ocağa git; varınca hazır çaydan tepsiye al (yoksa orada bekler).
        if (moveToward(w.pos, nearStation, wStep) && readyCups > 0) {
          const take = Math.min(wTrayCap - w.tray, readyCups);
          w.tray += take;
          readyCups -= take;
        }
      } else {
        // Boşta: personel köşesine dön.
        moveToward(w.pos, LAYOUT.waiterHome, wStep);
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
        // Dolu (ya da elinde var ama toplanacak kalmadı) → bulaşığa götür, yıka.
        if (moveToward(dw.pos, LAYOUT.dishStation, dStep)) {
          cleanCups += dw.tray;
          dw.tray = 0;
        }
      } else if (dishes.length > 0) {
        // Topla: en yakın kirli bardağa git; varınca al (kapasiteye kadar tek tek).
        let target = dishes[0];
        let td = Infinity;
        for (const d of dishes) {
          const dd = dist2D(dw.pos, d.pos);
          if (dd < td) { td = dd; target = d; }
        }
        if (moveToward(dw.pos, target.pos, dStep)) {
          dishes = dishes.filter((d) => d.id !== target.id);
          dw.tray += 1;
        }
      } else {
        // Boşta: köşeye dön.
        moveToward(dw.pos, LAYOUT.dishwasherHome, dStep);
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
      serviceSpeedMult: out.serviceSpeedMult,
      padsDone,
      padFills,
      hasWaiter: out.hasWaiter,
      hasDishwasher: out.hasDishwasher,
      upgradeFill,
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
