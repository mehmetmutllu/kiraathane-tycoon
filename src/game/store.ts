import { create } from 'zustand';
import { Decimal, D } from './decimal';
import type { Coin, Npc, Vec3 } from './types';
import {
  economyConfig as C,
  upgradeOutputMultiplier,
  upgradeCost,
} from '../config/economy.config';
import { defaultSave, loadSave, writeSave, clearSave, type SaveData } from './save';

// ---- Sahne yerleşimi (dünya birimi, zemin y=0) ----
export const LAYOUT = {
  entrance: [0, 0.6, 7.5] as Vec3,
  player: [0, 0.6, 2] as Vec3,
  station: [0, 0, -5] as Vec3,
  pad: [0, 0, 3.5] as Vec3,
  bounds: 7,
  // Masa slotları + müşterinin oturduğu yer (seat).
  tables: [
    { table: [-3, 0, -1.5] as Vec3, seat: [-3, 0.6, -0.3] as Vec3 },
    { table: [3, 0, -1.5] as Vec3, seat: [3, 0.6, -0.3] as Vec3 },
    { table: [-3, 0, 2.0] as Vec3, seat: [-3, 0.6, 3.2] as Vec3 },
    { table: [3, 0, 2.0] as Vec3, seat: [3, 0.6, 3.2] as Vec3 },
  ],
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

function teaPrice(level: number): number {
  return C.teaStation.basePrice * upgradeOutputMultiplier(C.teaStation.upgrade, level);
}

/** Çevrimdışı gelir oranı (₺/sn) — tek istasyon idealize. */
function incomeRate(tables: number, level: number): number {
  const cycle = C.npc.walkTime + C.npc.orderTime + C.npc.eatTime;
  return (tables * teaPrice(level)) / cycle;
}

function findFreeTable(npcs: Npc[], tables: number): number {
  const used = new Set(npcs.filter((n) => n.state !== 'leaving').map((n) => n.tableIndex));
  for (let i = 0; i < tables; i++) if (!used.has(i)) return i;
  return -1;
}

export interface GameState {
  // Kalıcı
  wallet: Decimal;
  diamonds: Decimal;
  lifetime: Decimal;
  tables: number;
  stationLevel: number;
  padFill: number;
  // Transient
  player: Vec3;
  npcs: Npc[];
  coins: Coin[];
  npcCount: number;
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

export const padCost = () => C.pads.table2.cost;

/** ₺ ile çıkılabilen en yüksek istasyon seviyesi (L5 = Usta, 💎/video — Faz 4). */
export const stationSoftMaxLevel = () => C.teaStation.upgrade.masterLevel - 1;
/** Mevcut seviyeden bir sonraki ₺ yükseltmenin maliyeti. */
export const stationUpgradeCost = (level: number) => upgradeCost(C.teaStation.upgrade, level + 1);

export const useGame = create<GameState>((set, get) => ({
  wallet: D(0),
  diamonds: D(0),
  lifetime: D(0),
  tables: 1,
  stationLevel: 0,
  padFill: 0,
  player: [...LAYOUT.player] as Vec3,
  npcs: [],
  coins: [],
  npcCount: 0,
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
      offlineEarned = Math.floor(incomeRate(save.tables, save.stationLevel) * Math.min(elapsed, cap));
      wallet = wallet.add(offlineEarned);
      lifetime = lifetime.add(offlineEarned);
    }
    set({
      wallet,
      lifetime,
      diamonds: D(save.diamonds),
      tables: save.tables,
      stationLevel: save.stationLevel,
      padFill: save.padFill,
      offlineEarned,
      player: [...LAYOUT.player] as Vec3,
      npcs: [],
      coins: [],
      npcCount: 0,
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
    let padFill = s.padFill;
    let nextId = s.nextId;
    let spawnTimer = s.spawnTimer - dt;
    const padDone = tables >= 2;

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
            n.timer = C.npc.orderTime;
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
            // Öde: parayı masanın yanına düşür.
            coins.push({
              id: nextId++,
              pos: [slot.table[0] + (Math.random() - 0.5), 0.3, slot.table[2] + 0.6 + (Math.random() - 0.5)],
              value: Math.round(teaPrice(s.stationLevel)),
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

    // --- Pad doldurma ---
    if (!padDone) {
      const cost = padCost();
      if (dist2D(player, LAYOUT.pad) < PAD_RADIUS && wallet.gt(0)) {
        const remaining = cost - padFill;
        const amt = Math.min(C.pads.table2.fillRate * dt, wallet.toNumber(), remaining);
        if (amt > 0) {
          padFill += amt;
          wallet = wallet.sub(amt);
          if (padFill >= cost) {
            padFill = cost;
            tables = 2;
          }
        }
      }
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
      wallet,
      lifetime,
      tables,
      padFill,
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
      stationLevel: s.stationLevel,
      padFill: s.padFill,
      lastSaved: Date.now(),
    });
  },

  hardReset: () => {
    clearSave();
    get().init();
  },
}));

export { teaPrice, incomeRate };
