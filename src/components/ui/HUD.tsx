import { useGame, padCost } from '../../game/store';
import { fmt } from '../../game/decimal';

export function HUD() {
  const wallet = useGame((s) => s.wallet);
  const diamonds = useGame((s) => s.diamonds);
  const tables = useGame((s) => s.tables);
  const padFill = useGame((s) => s.padFill);
  const offlineEarned = useGame((s) => s.offlineEarned);

  const padPct = tables >= 2 ? 100 : Math.min(100, (padFill / padCost()) * 100);

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

      {tables < 2 && (
        <div className="pad-status" data-testid="pad-status">
          <div className="pad-label">2. masa pad'i — üstünde dur, cüzdandan dolar</div>
          <div className="pad-bar">
            <div className="pad-fill" style={{ width: `${padPct}%` }} />
          </div>
          <div className="pad-num">
            {Math.floor(padFill)} / {padCost()} ₺
          </div>
        </div>
      )}

      <div className="hint">Hareket: WASD / ok tuşları · mobilde sol-alt joystick · paraların üstünden geç</div>
    </div>
  );
}
