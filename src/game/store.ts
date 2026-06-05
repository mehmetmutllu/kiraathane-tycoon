import { create } from 'zustand';
import { Decimal, D } from './decimal';
import type { Coin, Npc, Vec3 } from './types';
import {
  economyConfig as C,
  upgradeOutputMultiplier,
  upgradeCost,
  requiresMet,
  type PadDef,
  type GateState,
  type Requires,
} from '../config/economy.config';
import { defaultSave, loadSave, writeSave, clearSave, type SaveData } from './save';

// ---- Sahne yerleşimi (dünya birimi, zemin y=0) ----
// Her pad/zone, açtığı/etkilediği objenin TAM yerinde durur (mekânsal tycoon).
export const LAYOUT = {
  entrance: [0, 0.6, 6.5] as Vec3,
  player: [0, 0.6, 2] as Vec3,
  // Çay ocakları (stations sayısına göre çizilir). [0] ana ocak.
  stations: [[-2, 0, -5] as Vec3, [2, 0, -5] as Vec3],
  bounds: 7,
  // Masa slotları + müşterinin oturduğu yer (seat).
  tables: [
    { table: [-4, 0, -1] as Vec3, seat: [-4, 0.6, 0.1] as Vec3 },
    { table: [4, 0, -1] as Vec3, seat: [4, 0.6, 0.1] as Vec3 },
    { table: [-4, 0, 2.5] as Vec3, seat: [-4, 0.6, 3.6] as Vec3 },
    { table: [4, 0, 2.5] as Vec3, seat: [4, 0.6, 3.6] as Vec3 },
  ],
  // Pad pozisyonları: açtıkları objenin yerinde.
  padPos: {
    table2: [4, 0, -1] as Vec3, // 2. masa slotu
    table3: [-4, 0, 2.5] as Vec3, // 3. masa slotu
    station2: [2, 0, -5] as Vec3, // 2. ocak yeri
    samovar: [2, 0, -3.4] as Vec3, // ocakların önü (semavere geçiş)
  } as Record<string, Vec3>,
  // Mekânsal çay yükseltme noktası: ana ocağın önünde dur → altta bar dolar.
  upgradeZone: [-2, 0, -3.4] as Vec3,
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

/** Bir müşterinin sipariş/demleme süresi (sn) — throughput arttıkça kısalır. */
function brewTime(level: number, serviceSpeedMult: number): number {
  return (C.npc.orderTime * serviceSpeedMult) / brewThroughputMult(level);
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
  serviceSpeedMult: number;
  padsDone: string[];
  padFill: number;
  // Transient
  player: Vec3;
  npcs: Npc[];
  coins: Coin[];
  npcCount: number;
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
 * Şu an aktif pad: ilk açılmamış VE `requires` koşulu karşılanan pad (yoksa null).
 * Önkoşul zinciri (prev) sayesinde sıralıdır; bir sonraki pad gate'liyse null döner
 * (oyuncu önce önkoşulu — ör. ocak yükseltmesi — tamamlamalı).
 */
export function currentPad(g: GateState): PadDef | null {
  return (C.pads as readonly PadDef[]).find(
    (p) => !g.padsDone.includes(p.id) && requiresMet(p.requires, g),
  ) ?? null;
}

/** İstasyon yükseltme noktası şu an aktif mi (önkoşulu karşılandı mı)? */
export function upgradeZoneUnlocked(g: GateState): boolean {
  return requiresMet(C.teaStation.upgradeRequires, g);
}

/** HUD için tek satırlık "sıradaki adım" yönlendirmesi. */
export function nextStep(g: GateState): string {
  const pad = currentPad(g);
  if (pad) return `Sıradaki: ${pad.label} (₺${pad.cost})`;
  // Aktif pad yok → ilk açılmamış pad neyle kilitli, onu söyle.
  const undone = (C.pads as readonly PadDef[]).find((p) => !g.padsDone.includes(p.id));
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
  padFill: 0,
  player: [...LAYOUT.player] as Vec3,
  npcs: [],
  coins: [],
  npcCount: 0,
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
    // Çevrimdışı gelir
    const elapsed = Math.max(0, (Date.now() - save.lastSaved) / 1000);
    const cap = C.offline.baseCapHours * 3600;
    let wallet = D(save.wallet);
    let lifetime = D(save.lifetime);
    let offlineEarned = 0;
    if (elapsed > 30) {
      offlineEarned = Math.floor(
        incomeRate(save.tables, save.stationLevel, save.serviceSpeedMult) * Math.min(elapsed, cap),
      );
      wallet = wallet.add(offlineEarned);
      lifetime = lifetime.add(offlineEarned);
    }
    set({
      wallet,
      lifetime,
      diamonds: D(save.diamonds),
      tables: save.tables,
      stations: save.stations,
      stationLevel: save.stationLevel,
      serviceSpeedMult: save.serviceSpeedMult,
      padsDone: [...save.padsDone],
      padFill: save.padFill,
      offlineEarned,
      player: [...LAYOUT.player] as Vec3,
      npcs: [],
      coins: [],
      npcCount: 0,
      upgradeFill: 0,
      activeZone: null,
      nextStepLabel: nextStep({
        padsDone: save.padsDone,
        tables: save.tables,
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
    let wallet = s.wallet;
    let lifetime = s.lifetime;
    let tables = s.tables;
    let stations = s.stations;
    let serviceSpeedMult = s.serviceSpeedMult;
    let padsDone = s.padsDone;
    let padFill = s.padFill;
    let upgradeFill = s.upgradeFill;
    let activeZone: ActiveZone | null = null;
    let stationLevel = s.stationLevel;
    let nextId = s.nextId;
    let spawnTimer = s.spawnTimer - dt;

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
            n.state = 'ordering';
            // Demleme süresi: stationLevel throughput'u arttıkça kısalır (fiyat sabit).
            n.timer = brewTime(stationLevel, serviceSpeedMult);
          }
          break;
        case 'ordering':
          n.timer -= dt;
          if (n.timer <= 0) {
            n.state = 'drinking';
            n.timer = C.npc.eatTime;
          }
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

    // --- Pad doldurma (sıradaki aktif pad; pad açtığı objenin yerinde) ---
    const padGate: GateState = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber() };
    const pad = currentPad(padGate);
    if (pad) {
      const padPos = LAYOUT.padPos[pad.id];
      if (padPos && dist2D(player, padPos) < PAD_RADIUS) {
        activeZone = { kind: 'pad', label: pad.label, fill: padFill, cost: pad.cost };
        if (wallet.gt(0)) {
          const amt = Math.min(pad.fillRate * dt, wallet.toNumber(), pad.cost - padFill);
          if (amt > 0) {
            padFill += amt;
            wallet = wallet.sub(amt);
          }
        }
        if (padFill >= pad.cost) {
          // Pad tamamlandı: etkiyi uygula, bir sonrakine geç.
          switch (pad.effect.type) {
            case 'addTable':
              tables = Math.min(LAYOUT.tables.length, tables + 1);
              break;
            case 'addStation':
              stations = Math.min(LAYOUT.stations.length, stations + 1);
              serviceSpeedMult *= C.teaStation.extraStationSpeedFactor;
              break;
            case 'serviceSpeed':
              serviceSpeedMult *= pad.effect.factor;
              break;
          }
          padsDone = [...padsDone, pad.id];
          padFill = 0;
          activeZone = null;
        }
        if (activeZone) activeZone.fill = padFill;
      }
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

    // --- Periyodik kayıt ---
    let saveTimer = s.saveTimer - dt;
    if (saveTimer <= 0) {
      saveTimer = SAVE_INTERVAL;
      get().saveNow();
    }

    const nextStepLabel = nextStep({ padsDone, tables, stationLevel, lifetime: lifetime.toNumber() });

    set({
      npcs: liveNpcs,
      coins,
      wallet,
      lifetime,
      tables,
      stations,
      stationLevel,
      serviceSpeedMult,
      padsDone,
      padFill,
      upgradeFill,
      activeZone,
      nextStepLabel,
      player,
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
    set({ wallet: s.wallet.sub(cost), stationLevel: s.stationLevel + 1 });
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
    writeSave({
      ...defaultSave(),
      wallet: s.wallet.toString(),
      diamonds: s.diamonds.toString(),
      lifetime: s.lifetime.toString(),
      tables: s.tables,
      stations: s.stations,
      stationLevel: s.stationLevel,
      serviceSpeedMult: s.serviceSpeedMult,
      padsDone: [...s.padsDone],
      padFill: s.padFill,
      lastSaved: Date.now(),
    });
  },

  hardReset: () => {
    clearSave();
    get().init();
  },
}));

export { TEA_PRICE, brewThroughputMult, brewTime, incomeRate };
