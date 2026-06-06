// Test/dev kancaları. 3D sahne görsel doğrulanamaz; durum buradan okunur.
// window.__game  -> salt-okunur anlık görüntü
// window.__advanceTime(sn) -> simülasyonu hızlı ileri sar
import { useGame, currentPad, availableOptionalPads, LAYOUT, trayCapacity } from './store';
import type { Vec3 } from './types';

declare global {
  interface Window {
    __game?: () => Record<string, unknown>;
    __advanceTime?: (seconds: number) => Record<string, unknown>;
    __resetGame?: () => void;
    __addMoney?: (amount: number) => Record<string, unknown>;
    __upgradeStation?: () => boolean;
    __teleport?: (x: number, z: number) => Record<string, unknown>;
  }
}

export function installDevHooks(): void {
  if (typeof window === 'undefined') return;

  window.__game = () => {
    const s = useGame.getState();
    const gate = {
      padsDone: s.padsDone,
      tables: s.tables,
      stationLevel: s.stationLevel,
      lifetime: s.lifetime.toNumber(),
    };
    const pad = currentPad(gate);
    return {
      wallet: s.wallet.toNumber(),
      diamonds: s.diamonds.toNumber(),
      lifetime: s.lifetime.toNumber(),
      tables: s.tables,
      stations: s.stations,
      stationLevel: s.stationLevel,
      serviceSpeedMult: +s.serviceSpeedMult.toFixed(3),
      padsDone: [...s.padsDone],
      npcCount: s.npcCount,
      // Servis durumu (D-011)
      readyCups: s.readyCups,
      tray: s.tray,
      trayCap: trayCapacity(),
      waitingCount: s.npcs.filter((n) => n.state === 'waitingForTea').length,
      stationPos: LAYOUT.stations[0],
      // Servis edilmeyi bekleyen ilk müşterinin koltuğu (smoke servis testi için) — yoksa null.
      firstWaitingSeat: (() => {
        const w = s.npcs.find((n) => n.state === 'waitingForTea');
        return w ? LAYOUT.tables[w.tableIndex].seat : null;
      })(),
      coins: s.coins.length,
      // Bardak döngüsü (Faz 2e)
      cleanCups: s.cleanCups,
      dirtyCount: s.dishes.length,
      carriedDirty: s.carriedDirty,
      dishStationPos: LAYOUT.dishStation,
      firstDishPos: s.dishes[0] ? s.dishes[0].pos : null,
      hasDishwasher: s.hasDishwasher,
      dishwasherTray: s.dishwasher ? s.dishwasher.tray : 0,
      dishwasherPos: s.dishwasher ? s.dishwasher.pos.map((n) => +n.toFixed(2)) : null,
      padFill: Math.floor(pad ? s.padFills[pad.id] ?? 0 : 0),
      currentPad: pad ? pad.id : null,
      padCost: pad ? pad.cost : 0,
      padPos: pad ? LAYOUT.padPos[pad.id] : null,
      // Opsiyonel pad'ler (garson vb.) — omurgayı kilitlemez; smoke "garson tut" testi için.
      optionalPads: availableOptionalPads(gate).map((p) => ({
        id: p.id,
        cost: p.cost,
        pos: LAYOUT.padPos[p.id],
      })),
      // Garson durumu (Faz 2d)
      hasWaiter: s.hasWaiter,
      waiterTray: s.waiter ? s.waiter.tray : 0,
      waiterPos: s.waiter ? s.waiter.pos.map((n) => +n.toFixed(2)) : null,
      nextStep: s.nextStepLabel,
      upgradeFill: Math.floor(s.upgradeFill),
      upgradeZonePos: LAYOUT.upgradeZone,
      activeZone: s.activeZone ? { kind: s.activeZone.kind, label: s.activeZone.label } : null,
      player: s.player.map((n) => +n.toFixed(2)),
      offlineEarned: s.offlineEarned,
    };
  };

  // Sabit küçük adımlarla ileri sar (NPC durum makinesi stabil kalsın).
  window.__advanceTime = (seconds: number) => {
    const tick = useGame.getState().tick;
    const stepDt = 0.1;
    let remaining = Math.max(0, seconds);
    let guard = 0;
    while (remaining > 0 && guard < 200000) {
      tick(Math.min(stepDt, remaining));
      remaining -= stepDt;
      guard++;
    }
    return window.__game!();
  };

  window.__resetGame = () => useGame.getState().hardReset();

  window.__addMoney = (amount: number) => {
    useGame.getState().addMoney(amount);
    return window.__game!();
  };

  window.__upgradeStation = () => useGame.getState().upgradeStation();

  window.__teleport = (x: number, z: number) => {
    useGame.setState({ player: [x, 0.6, z] as Vec3 });
    return window.__game!();
  };
}
