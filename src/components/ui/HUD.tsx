import { useGame } from '../../game/store';
import { fmt } from '../../game/decimal';

export function HUD() {
  const wallet = useGame((s) => s.wallet);
  const diamonds = useGame((s) => s.diamonds);
  const tables = useGame((s) => s.tables);
  const offlineEarned = useGame((s) => s.offlineEarned);
  const zone = useGame((s) => s.activeZone);

  const zonePct = zone ? Math.min(100, (zone.fill / zone.cost) * 100) : 0;

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

      {/* Üstünde durulan zone (pad/yükseltme) — altta dolan bar */}
      {zone && (
        <div className="zone-bar" data-testid="zone-bar" data-kind={zone.kind}>
          <div className="zone-label">
            {zone.kind === 'upgrade' ? '☕ ' : '🏗️ '}
            {zone.label}
          </div>
          <div className="zone-track">
            <div className="zone-fill" style={{ width: `${zonePct}%` }} />
          </div>
          <div className="zone-num">
            {Math.floor(zone.fill).toLocaleString('tr-TR')} / {zone.cost.toLocaleString('tr-TR')} ₺
          </div>
        </div>
      )}

      <div className="hint">
        WASD / ok tuşları · mobilde joystick · paraları topla · yeşil zeminlerin üstünde dur (masa, ocak, yükseltme)
      </div>
    </div>
  );
}
