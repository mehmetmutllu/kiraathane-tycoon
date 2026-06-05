// Test/dev kancaları. 3D sahne görsel doğrulanamaz; durum buradan okunur.
// window.__game  -> salt-okunur anlık görüntü
// window.__advanceTime(sn) -> simülasyonu hızlı ileri sar
import { useGame, currentPad, LAYOUT } from './store';
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
    const pad = currentPad(s.padsDone);
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
      coins: s.coins.length,
      padFill: Math.floor(s.padFill),
      currentPad: pad ? pad.id : null,
      padCost: pad ? pad.cost : 0,
      padPos: pad ? LAYOUT.padPos[pad.id] : null,
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
