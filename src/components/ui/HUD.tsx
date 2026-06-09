import { useGame, trayCapacity } from '../../game/store';
import { fmt } from '../../game/decimal';

export function HUD() {
  const wallet = useGame((s) => s.wallet);
  const diamonds = useGame((s) => s.diamonds);
  const tables = useGame((s) => s.tables);
  const tray = useGame((s) => s.tray);
  const readyCups = useGame((s) => s.readyCups);
  const cleanCups = useGame((s) => s.cleanCups);
  const dirtyCount = useGame((s) => s.dishes.length);
  const carriedDirty = useGame((s) => s.carriedDirty);
  const offlineEarned = useGame((s) => s.offlineEarned);
  const zone = useGame((s) => s.activeZone);
  const notice = useGame((s) => s.notice);
  const nextStep = useGame((s) => s.nextStepLabel);
  const onboardHint = useGame((s) => s.onboardHint);
  const hardReset = useGame((s) => s.hardReset);

  const zonePct = zone ? Math.min(100, (zone.fill / zone.cost) * 100) : 0;

  const onReset = () => {
    if (window.confirm('Oyunu sıfırla? Bu cihazdaki tüm ilerleme silinecek.')) hardReset();
  };

  return (
    <div className="hud" data-testid="hud">
      <button className="reset-btn" data-testid="reset" onClick={onReset} title="Oyunu sıfırla (test)">
        ↺ Sıfırla
      </button>
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
        <div className="chip" data-testid="tray" title="Tepsindeki çay / kapasite">
          🫖 {tray}/{trayCapacity()}
        </div>
        <div className="chip" data-testid="ready" title="Ocakta bekleyen hazır çay">
          ☕ {readyCups}
        </div>
        <div className="chip" data-testid="clean" title="Temiz bardak (biterse demleme durur)">
          🧼 {cleanCups}
        </div>
        <div className="chip" data-testid="dirty" title="Kirli bardak (topla → bulaşıkta yıka)">
          🧽 {dirtyCount + carriedDirty}
        </div>
      </div>

      {offlineEarned > 0 && (
        <div className="offline" data-testid="offline">
          Yokken kazanılan: ₺ {Math.floor(offlineEarned).toLocaleString('tr-TR')}
        </div>
      )}

      {/* Yeni-özellik bildirimi (D-019 §4): bir özellik açılınca kısa toast (kendi kendine kaybolur). */}
      {notice && (
        <div className="notice" data-testid="notice" key={notice.text}>
          {notice.text}
        </div>
      )}

      {/* İlk-oyun onboarding koç ipucu (Faz 2i) — 2. masa açılana kadar çekirdek döngüyü öğretir */}
      {onboardHint && (
        <div className="coach" data-testid="coach" key={onboardHint}>
          🫖 {onboardHint}
        </div>
      )}

      {/* Sıradaki adım rehberi (bir zone üstünde değilken; onboarding sırasında gizlenir, koç yönlendirir) */}
      {!zone && !onboardHint && nextStep && (
        <div className="next-step" data-testid="next-step">
          👉 {nextStep}
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
    </div>
  );
}
