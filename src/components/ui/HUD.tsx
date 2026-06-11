import { useState } from 'react';
import { useGame } from '../../game/store';
import { fmt } from '../../game/decimal';
import { levelProgress, economyConfig } from '../../config/economy.config';
import { FLOOR_THEMES, WALL_THEMES } from '../../config/palette';
import { CoinIcon, GemIcon, StarBadge, GearIcon, MailIcon, BrushIcon, CharIcon, TrayEmptyIcon, TostEmptyIcon, QuestPhoto, CheckBadge, BangBadge } from './icons';
import { CharacterPanel } from './CharacterPanel';

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
  const charPanelSeen = useGame((s) => s.charPanelSeen);
  const markCharPanelSeen = useGame((s) => s.markCharPanelSeen);
  const tray = useGame((s) => s.tray);
  const trayFood = useGame((s) => s.trayFood);
  const emptyTray = useGame((s) => s.emptyTray);
  const trayTipSeen = useGame((s) => s.trayTipSeen);
  const markTrayTipSeen = useGame((s) => s.markTrayTipSeen);
  const [offlineSeen, setOfflineSeen] = useState(false);
  const [panel, setPanel] = useState<'settings' | 'mail' | 'shop' | 'char' | null>(null);

  const lvl = levelProgress(xp);
  const questPct = quest && quest.total != null ? Math.min(100, ((quest.cur ?? 0) / quest.total) * 100) : null;
  const showOffline = offlineEarned > 0 && !offlineSeen;
  // Karakter görevi aktifken butonda altın nabız + "!" rozeti; İLK karakter görevinde tek-seferlik
  // spotlight karartması (dokununca kapanır, persist — bir daha çıkmaz). Tasarım: char-upgrades §6.
  const charQuestActive = quest?.target.type === 'charStat';
  const spotlight = charQuestActive && !charPanelSeen && panel == null && !showOffline;
  // Tepsi-boşalt onboarding'i (v23): buton İLK kez belirdiğinde (tepside çay/tost varken) tek-seferlik
  // spotlight + açıklama balonu (karakter spotlight kalıbı; aynı anda iki spotlight çıkmaz).
  const traySpot = tray + trayFood > 0 && !trayTipSeen && panel == null && !showOffline && !spotlight;

  const openCharPanel = () => {
    markCharPanelSeen();
    setPanel('char');
  };

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
      {/* İlk karakter görevi spotlight'ı: karartma + buton kümesi öne çıkar (tek seferlik) */}
      {spotlight && <div className="spotlight-backdrop" data-testid="char-spotlight" onClick={markCharPanelSeen} />}
      <div className={`side-btns${spotlight ? ' spot' : ''}`}>
        <button className="icon-btn" data-testid="gear" title="Ayarlar" onClick={() => setPanel('settings')}>
          <GearIcon />
        </button>
        <button className="icon-btn" data-testid="mail" title="Posta" onClick={() => setPanel('mail')}>
          <MailIcon />
        </button>
        <button className="icon-btn" data-testid="shop" title="Dekor Mağazası" onClick={() => setPanel('shop')}>
          <BrushIcon />
        </button>
        <button
          className={`icon-btn char-btn${charQuestActive ? ' pulse' : ''}`}
          data-testid="char"
          title="Karakter"
          onClick={openCharPanel}
        >
          <CharIcon />
          {charQuestActive && <span className="char-bang">!</span>}
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
            <span className="quest-title">
              {quest.title}
              {quest.reward != null && (
                <span className="quest-reward" data-testid="quest-reward">
                  <CoinIcon size={14} />+{quest.reward}
                </span>
              )}
            </span>
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

      {/* DEKOR MAĞAZASI modalı (WP6): zemin + duvar temaları zone-başına satın alınır */}
      {panel === 'shop' && <ShopPanel onClose={() => setPanel(null)} />}

      {/* KARAKTER modalı (v20): 3/4 açı önizleme + tepsi/mıknatıs/hız kartları */}
      {panel === 'char' && <CharacterPanel onClose={() => setPanel(null)} />}

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

      {/* TEPSİYİ BOŞALT (v23 + Y1 ayrımı): tepside çay/tost varken sağ-alt butonlar — ÇAY ve TOST
          AYRI boşaltılır (kullanıcı isteği Y1); kaplar temiz rafa döner (dolu tepsiyle kilitlenme çözücü). */}
      {traySpot && <div className="spotlight-backdrop" data-testid="tray-spotlight" onClick={markTrayTipSeen} />}
      {tray + trayFood > 0 && (
        <div className={`tray-unit${traySpot ? ' spot' : ''}`}>
          {traySpot && (
            <div className="tray-tip">Müşteri kalmadıysa tepsini boşaltabilirsin — kaplar temiz rafa döner.</div>
          )}
          {trayFood > 0 && (
            <button
              className="icon-btn tray-btn"
              data-testid="empty-tray-food"
              title="Tostları bırak"
              onClick={() => {
                markTrayTipSeen();
                emptyTray('food');
              }}
            >
              <TostEmptyIcon />
              <span className="tray-count" data-testid="tray-count-food">{trayFood}</span>
            </button>
          )}
          {tray > 0 && (
            <button
              className="icon-btn tray-btn"
              data-testid="empty-tray"
              title="Çayları bırak"
              onClick={() => {
                markTrayTipSeen();
                emptyTray('tea');
              }}
            >
              <TrayEmptyIcon />
              <span className="tray-count" data-testid="tray-count">{tray}</span>
            </button>
          )}
        </div>
      )}

      {/* Yeni-özellik / görev / seviye toast'u — ALT-ORTA (üstteki görev kartıyla çakışmaz);
          türe göre SVG madalyon: görev=yeşil onay, seviye=yıldız, reveal=altın ünlem */}
      {notice && (
        <div className="notice" data-testid="notice" key={notice.text}>
          <span className="notice-badge">
            {notice.kind === 'quest' ? <CheckBadge size={30} /> : notice.kind === 'level' ? <StarBadge size={30} /> : <BangBadge size={30} />}
          </span>
          <span className="notice-text">{notice.text}</span>
          {notice.reward != null && (
            <span className="notice-reward" data-testid="notice-reward">
              <CoinIcon size={18} />+{notice.reward}
            </span>
          )}
        </div>
      )}

      {/* Dolum göstergesi TEK: dünya-içi pad halkası (GroundMarker progress). Alt bar + baş üstü
          radial KALDIRILDI (WP5, feedback §D18 — 3 gösterge aynı anda fazlaydı). */}
    </div>
  );
}

/** Dekor mağazası (WP6 — feedback §D19): tema satırı = renk önizleme + ad + fiyat + zone uygula
 *  butonları (yalnız AÇIK zone'lar). İlk satın alma ₺ düşer; sahip olunan tema ücretsiz seçilir. */
function ShopPanel({ onClose }: { onClose: () => void }) {
  const wallet = useGame((s) => s.wallet);
  const zonesOpen = useGame((s) => s.zonesOpen);
  const floorThemeByZone = useGame((s) => s.floorThemeByZone);
  const wallThemeByZone = useGame((s) => s.wallThemeByZone);
  const ownedCosmetics = useGame((s) => s.ownedCosmetics);
  const buyCosmetic = useGame((s) => s.buyCosmetic);
  const cash = wallet.toNumber();

  const renderRows = (kind: 'floor' | 'wall') => {
    const themes = kind === 'floor' ? economyConfig.cosmetics.floorThemes : economyConfig.cosmetics.wallThemes;
    const selected = kind === 'floor' ? floorThemeByZone : wallThemeByZone;
    return themes.map((t) => {
      const sw =
        kind === 'floor'
          ? [FLOOR_THEMES[t.id]?.base ?? '#999', FLOOR_THEMES[t.id]?.alt ?? '#777']
          : [WALL_THEMES[t.id]?.cream ?? '#999', WALL_THEMES[t.id]?.wainscot ?? '#777'];
      return (
        <div className="shop-row" key={`${kind}:${t.id}`}>
          <span className="shop-swatch">
            <i style={{ background: sw[0] }} />
            <i style={{ background: sw[1] }} />
          </span>
          <span className="shop-info">
            <span className="shop-name">{t.label}</span>
            {t.cost > 0 && (
              <span className="shop-cost">
                <CoinIcon size={14} /> {t.cost.toLocaleString('tr-TR')} / salon
              </span>
            )}
          </span>
          <span className="shop-zones">
            {Array.from({ length: zonesOpen }, (_, z) => {
              const isSel = selected[z] === t.id;
              const owned = t.cost === 0 || ownedCosmetics.includes(`${kind}:${t.id}:z${z}`);
              const afford = owned || cash >= t.cost;
              return (
                <button
                  key={z}
                  className={`shop-zone-btn${isSel ? ' sel' : ''}`}
                  data-testid={`shop-${kind}-${t.id}-z${z}`}
                  disabled={isSel || !afford}
                  onClick={() => buyCosmetic(kind, t.id, z)}
                >
                  {isSel ? '✓ ' : ''}S{z + 1}
                </button>
              );
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="modal-backdrop" data-testid="shop-panel" onClick={onClose}>
      <div className="modal-card shop-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Dekor Mağazası</div>
        <div className="shop-section">Zemin</div>
        {renderRows('floor')}
        <div className="shop-section">Duvar</div>
        {renderRows('wall')}
        <button className="modal-btn" data-testid="shop-ok" onClick={onClose}>
          Tamam
        </button>
      </div>
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
