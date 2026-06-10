import { useState } from 'react';
import { useGame } from '../../game/store';
import { fmt } from '../../game/decimal';
import { levelProgress } from '../../config/economy.config';
import { CoinIcon, GemIcon, StarBadge, GearIcon, MailIcon, QuestPhoto } from './icons';

/**
 * HUD — gerçek tycoon yerleşimi (UI redesign 2026-06-10; referans: My Perfect Hotel HUD grameri).
 *   SOL-ÜST: seviye yıldızı + XP barı; hemen altında küçük dişli (ayarlar) + posta butonları.
 *   SAĞ-ÜST: chip'siz para + elmas (ikon + konturlu rakam, yan yana).
 *   SAĞ-ÜST ALTI: görev kartı — görev fotoğrafı + adı + ilerleme barı (dokun → kamera hedefe).
 *   ALT EKRAN BOŞ (joystick drag-anywhere, görünmez).
 */
export function HUD() {
  const wallet = useGame((s) => s.wallet);
  const diamonds = useGame((s) => s.diamonds);
  const xp = useGame((s) => s.xp);
  const settings = useGame((s) => s.settings);
  const setSetting = useGame((s) => s.setSetting);
  const offlineEarned = useGame((s) => s.offlineEarned);
  const notice = useGame((s) => s.notice);
  const quest = useGame((s) => s.quest);
  const focusQuest = useGame((s) => s.focusQuest);
  const hardReset = useGame((s) => s.hardReset);
  const [offlineSeen, setOfflineSeen] = useState(false);
  const [panel, setPanel] = useState<'settings' | 'mail' | null>(null);

  const lvl = levelProgress(xp);
  const questPct = quest && quest.total != null ? Math.min(100, ((quest.cur ?? 0) / quest.total) * 100) : null;
  const showOffline = offlineEarned > 0 && !offlineSeen;

  const onReset = () => {
    if (window.confirm('Oyunu sıfırla? Bu cihazdaki tüm ilerleme silinecek.')) {
      setPanel(null);
      hardReset();
    }
  };

  return (
    <div className="hud" data-testid="hud">
      {/* SOL-ÜST: seviye + XP barı; altında dişli + posta */}
      <div className="lvl-unit pill" data-testid="level">
        <div className="lvl-star">
          <StarBadge size={56} />
          <span className="lvl-num" data-testid="level-num">{lvl.level}</span>
        </div>
        <div className="lvl-bar">
          <div className="lvl-fill" style={{ width: `${Math.min(100, (lvl.cur / lvl.need) * 100)}%` }} />
          <span className="lvl-text">{lvl.cur}/{lvl.need}</span>
        </div>
      </div>
      <div className="side-btns">
        <button className="icon-btn" data-testid="gear" title="Ayarlar" onClick={() => setPanel('settings')}>
          <GearIcon />
        </button>
        <button className="icon-btn" data-testid="mail" title="Posta" onClick={() => setPanel('mail')}>
          <MailIcon />
        </button>
      </div>

      {/* SAĞ-ÜST: chip'siz para + elmas */}
      <div className="cur-row">
        <div className="cur-item pill" data-testid="wallet">
          <CoinIcon size={34} />
          <span className="cur-val">{fmt(wallet)}</span>
        </div>
        <div className="cur-item pill" data-testid="diamonds">
          <GemIcon size={32} />
          <span className="cur-val">{fmt(diamonds)}</span>
        </div>
      </div>

      {/* SAĞ-ÜST ALTI: görev kartı (foto + ad + ilerleme barı); dokun → kamera hedefe */}
      {quest && (
        <button className="quest-card" data-testid="quest" key={quest.id} onClick={() => focusQuest()}>
          <span className="quest-photo">
            <QuestPhoto target={quest.target} size={46} />
          </span>
          <span className="quest-body">
            <span className="quest-title">{quest.title}</span>
            {questPct != null ? (
              <span className="quest-track">
                <span className="quest-fill" style={{ width: `${questPct}%` }} />
                <span className="quest-count" data-testid="quest-prog">{quest.cur}/{quest.total}</span>
              </span>
            ) : quest.cost != null ? (
              <span className="quest-cost">
                <CoinIcon size={17} />
                {quest.cost}
              </span>
            ) : (
              <span className="quest-track">
                <span className="quest-count">Hedefe git</span>
              </span>
            )}
          </span>
        </button>
      )}

      {/* AYARLAR modalı: ses/müzik/bildirim + sıfırla */}
      {panel === 'settings' && (
        <div className="modal-backdrop" data-testid="menu" onClick={() => setPanel(null)}>
          <div className="modal-card settings-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Ayarlar</div>
            <SettingRow label="Ses" value={settings.sound} onChange={(v) => setSetting('sound', v)} testid="set-sound" />
            <SettingRow label="Müzik" value={settings.music} onChange={(v) => setSetting('music', v)} testid="set-music" />
            <SettingRow
              label="Bildirimler"
              value={settings.notifications}
              onChange={(v) => setSetting('notifications', v)}
              testid="set-notifications"
            />
            <button className="danger-btn" data-testid="reset" onClick={onReset}>
              ↺ Oyunu Sıfırla
            </button>
            <button className="modal-btn" data-testid="settings-ok" onClick={() => setPanel(null)}>
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* POSTA modalı (gelecekte gelen kutusu/ödüller — şimdilik boş) */}
      {panel === 'mail' && (
        <div className="modal-backdrop" data-testid="mail-panel" onClick={() => setPanel(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">📬</div>
            <div className="modal-title">Posta kutun boş</div>
            <div className="modal-sub">Ödüller ve haberler yakında burada görünecek.</div>
            <button className="modal-btn" onClick={() => setPanel(null)}>
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* OFFLINE KAZANÇ — oyun-tarzı kart */}
      {showOffline && (
        <div className="modal-backdrop" data-testid="offline">
          <div className="modal-card">
            <div className="modal-emoji">🌙</div>
            <div className="modal-title">Sen yokken kıraathane çalıştı</div>
            <div className="modal-amount">
              <CoinIcon size={26} /> +{Math.floor(offlineEarned).toLocaleString('tr-TR')}
            </div>
            <button className="modal-btn" data-testid="offline-ok" onClick={() => setOfflineSeen(true)}>
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* Yeni-özellik / görev / seviye toast'u */}
      {notice && (
        <div className="notice" data-testid="notice" key={notice.text}>
          {notice.text}
        </div>
      )}

      {/* Dolum göstergesi TEK: dünya-içi pad halkası (GroundMarker progress). Alt bar + baş üstü
          radial KALDIRILDI (WP5, feedback §D18 — 3 gösterge aynı anda fazlaydı). */}
    </div>
  );
}

function SettingRow({
  label,
  value,
  onChange,
  testid,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testid: string;
}) {
  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <button
        className={`switch${value ? ' on' : ''}`}
        data-testid={testid}
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}
