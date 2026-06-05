// Test/dev kancaları. 3D sahne görsel doğrulanamaz; durum buradan okunur.
// window.__game  -> salt-okunur anlık görüntü
// window.__advanceTime(sn) -> simülasyonu hızlı ileri sar
import { useGame, padCost } from './store';

declare global {
  interface Window {
    __game?: () => Record<string, unknown>;
    __advanceTime?: (seconds: number) => Record<string, unknown>;
    __resetGame?: () => void;
  }
}

export function installDevHooks(): void {
  if (typeof window === 'undefined') return;

  window.__game = () => {
    const s = useGame.getState();
    return {
      wallet: s.wallet.toNumber(),
      diamonds: s.diamonds.toNumber(),
      lifetime: s.lifetime.toNumber(),
      tables: s.tables,
      stations: 1,
      stationLevel: s.stationLevel,
      npcCount: s.npcCount,
      coins: s.coins.length,
      padFill: Math.floor(s.padFill),
      padCost: padCost(),
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
}
