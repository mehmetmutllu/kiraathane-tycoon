import { useState } from 'react';
import { useGame } from '../../game/store';
import { fmt } from '../../game/decimal';

/**
 * HUD (game-feel redesign 2026-06-09): yalnız GEREKEN bilgi — para + elmas chip'i, üst-orta GÖREV BARI
 * (dokun → kamera hedefe kayar), offline kazanç oyun-tarzı MODAL kart (sol-üstte sabit yazı YOK),
 * sıfırlama ayarlar dişlisi menüsünde. Tepsi/bardak/masa sayaçları KALDIRILDI (bilgi zaten dünyada
 * görünüyor: elindeki tepsi, ocaktaki bardaklar, masalar).
 */
export function HUD() {
  const wallet = useGame((s) => s.wallet);
  const diamonds = useGame((s) => s.diamonds);
  const offlineEarned = useGame((s) => s.offlineEarned);
  const zone = useGame((s) => s.activeZone);
  const notice = useGame((s) => s.notice);
  const quest = useGame((s) => s.quest);
  const focusQuest = useGame((s) => s.focusQuest);
  const hardReset = useGame((s) => s.hardReset);
  const [offlineSeen, setOfflineSeen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const zonePct = zone ? Math.min(100, (zone.fill / zone.cost) * 100) : 0;
  const showOffline = offlineEarned > 0 && !offlineSeen;

  const onReset = () => {
    setMenuOpen(false);
    if (window.confirm('Oyunu sıfırla? Bu cihazdaki tüm ilerleme silinecek.')) hardReset();
  };

  return (
    <div className="hud" data-testid="hud">
      <div className="hud-top">
        <div className="chip" data-testid="wallet">
          <span className="coin-icon" /> {fmt(wallet)}
        </div>
        <div className="chip" data-testid="diamonds">
          <span className="cur gem">💎</span> {fmt(diamonds)}
        </div>
      </div>

      {/* Ayarlar dişlisi (sağ-üst): sıfırlama burada — ekranda ayrı test butonu yok */}
      <button className="gear-btn" data-testid="gear" onClick={() => setMenuOpen((v) => !v)} title="Ayarlar">
        ⚙️
      </button>
      {menuOpen && (
        <div className="menu" data-testid="menu">
          <button className="menu-item" data-testid="reset" onClick={onReset}>
            ↺ Oyunu Sıfırla
          </button>
        </div>
      )}

      {/* GÖREV BARI (üst-orta): tek aktif görev; dokun → kamera hedefe kayar (quest sistemi) */}
      {quest && (
        <button className="quest-bar" data-testid="quest" key={quest.id} onClick={() => focusQuest()}>
          <span className="quest-ico">🎯</span>
          <span className="quest-title">{quest.title}</span>
          {quest.total != null && (
            <span className="quest-prog" data-testid="quest-prog">
              {quest.cur}/{quest.total}
            </span>
          )}
          {quest.cost != null && (
            <span className="quest-cost">
              <span className="coin-icon sm" />
              {quest.cost}
            </span>
          )}
        </button>
      )}

      {/* OFFLINE KAZANÇ — oyun-tarzı kart: Tamam'a basınca kapanır (sabit köşe yazısı değil) */}
      {showOffline && (
        <div className="modal-backdrop" data-testid="offline">
          <div className="modal-card">
            <div className="modal-emoji">🌙</div>
            <div className="modal-title">Sen yokken kıraathane çalıştı</div>
            <div className="modal-amount">
              <span className="coin-icon" /> +{Math.floor(offlineEarned).toLocaleString('tr-TR')}
            </div>
            <button className="modal-btn" data-testid="offline-ok" onClick={() => setOfflineSeen(true)}>
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Yeni-özellik bildirimi (D-019 §4): bir özellik açılınca kısa toast (kendi kendine kaybolur). */}
      {notice && (
        <div className="notice" data-testid="notice" key={notice.text}>
          {notice.text}
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
            <span className="coin-icon sm" /> {Math.floor(zone.fill).toLocaleString('tr-TR')} /{' '}
            {zone.cost.toLocaleString('tr-TR')}
          </div>
        </div>
      )}
    </div>
  );
}
