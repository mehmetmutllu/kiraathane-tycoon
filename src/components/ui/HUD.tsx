import {
  useGame,
  currentPad,
  stationSoftMaxLevel,
  stationUpgradeCost,
} from '../../game/store';
import { fmt } from '../../game/decimal';

export function HUD() {
  const wallet = useGame((s) => s.wallet);
  const diamonds = useGame((s) => s.diamonds);
  const tables = useGame((s) => s.tables);
  const padFill = useGame((s) => s.padFill);
  const padsDone = useGame((s) => s.padsDone);
  const offlineEarned = useGame((s) => s.offlineEarned);
  const stationLevel = useGame((s) => s.stationLevel);
  const upgradeStation = useGame((s) => s.upgradeStation);

  const pad = currentPad(padsDone);
  const padPct = pad ? Math.min(100, (padFill / pad.cost) * 100) : 100;

  const softMax = stationSoftMaxLevel();
  const atSoftMax = stationLevel >= softMax;
  const nextCost = stationUpgradeCost(stationLevel);
  const canUpgrade = !atSoftMax && wallet.gte(nextCost);

  return (
    <div className="hud" data-testid="hud">
      <div className="hud-top">
        <div className="chip" data-testid="wallet">
          <span className="cur">₺</span> {fmt(wallet)}
        </div>
        <div className="chip" data-testid="diamonds">
          <span className="cur gem">💎</span> {fmt(diamonds)}
        </div>
        <div className="chip" data-testid="tables">
          🪑 {tables}
        </div>
      </div>

      {offlineEarned > 0 && (
        <div className="offline" data-testid="offline">
          Yokken kazanılan: ₺ {Math.floor(offlineEarned).toLocaleString('tr-TR')}
        </div>
      )}

      {pad && (
        <div className="pad-status" data-testid="pad-status">
          <div className="pad-label">{pad.label} — pad üstünde dur, cüzdandan dolar</div>
          <div className="pad-bar">
            <div className="pad-fill" style={{ width: `${padPct}%` }} />
          </div>
          <div className="pad-num">
            {Math.floor(padFill).toLocaleString('tr-TR')} / {pad.cost.toLocaleString('tr-TR')} ₺
          </div>
        </div>
      )}

      <div className="controls">
        <button
          type="button"
          className="btn upgrade"
          data-testid="upgrade-station"
          disabled={!canUpgrade}
          onClick={() => upgradeStation()}
        >
          <span className="btn-title">
            ☕ Çay {atSoftMax ? `L${softMax} (max)` : `L${stationLevel} → L${stationLevel + 1}`}
          </span>
          <span className="btn-sub">
            {atSoftMax ? 'Usta (L5) 💎 — yakında' : `₺ ${nextCost.toLocaleString('tr-TR')}`}
          </span>
        </button>
      </div>

      <div className="hint">Hareket: WASD / ok tuşları · mobilde sol-alt joystick · paraların üstünden geç</div>
    </div>
  );
}
