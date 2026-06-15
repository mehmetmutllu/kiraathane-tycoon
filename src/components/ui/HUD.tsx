import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../game/store';
import { perf } from '../../game/perf';
import { fmt } from '../../game/decimal';
import { levelProgress, economyConfig } from '../../config/economy.config';
import { FLOOR_THEMES, WALL_THEMES } from '../../config/palette';
import { CoinIcon, GemIcon, StarBadge, GearIcon, MailIcon, BrushIcon, CharIcon, TrayEmptyIcon, TostEmptyIcon, QuestPhoto, CheckBadge, BangBadge, CamZoomIcon } from './icons';
import { CharacterPanel } from './CharacterPanel';
import { TableThemePreview } from './TableThemePreview';
import { DioramaPreview } from './DioramaPreview';

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
  const camZoomOut = useGame((s) => s.camZoomOut);
  const toggleCamZoomOut = useGame((s) => s.toggleCamZoomOut);
  const [offlineSeen, setOfflineSeen] = useState(false);
  const [panel, setPanel] = useState<'settings' | 'mail' | 'shop' | 'char' | null>(null);

  const lvl = levelProgress(xp);
  const questPct = quest && quest.total != null ? Math.min(100, ((quest.cur ?? 0) / quest.total) * 100) : null;
  const showOffline = offlineEarned > 0 && !offlineSeen;
  // Karakter-PANELİ görevi aktifken butonda altın nabız + "!" rozeti; İLK karakter görevinde
  // tek-seferlik spotlight karartması (dokununca kapanır, persist). Tasarım: char-upgrades §6.
  // v29: garson tepsi/hız görevleri de panelden alınır → onlar da butonu işaret eder
  // (kullanıcı 2026-06-13: "görev de orayı göstersin").
  const charQuestActive =
    quest?.target.type === 'charStat' || quest?.target.type === 'waiterTray' || quest?.target.type === 'waiterSpeed';
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
      {/* DEV/TEŞHİS: ekran-üstü FPS + draw-call sayacı (Ayarlar'dan açılır; FPS Tier 2 ölçümü) */}
      {settings.showFps && <FpsOverlay />}
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
            <SettingRow
              label="FPS Sayacı"
              value={settings.showFps}
              onChange={(v) => setSetting('showFps', v)}
              testid="set-showfps"
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

      {/* KAMERA GENEL-BAKIŞ (2026-06-13): kamera yakınlaştı (taban 6) — bu TOGGLE salonu görmek
          için uzaklaştırır (×1.45). Basılı-tut değil toggle: başparmak joystick/tepsiyle meşgul. */}
      <button
        className={`icon-btn cam-btn${camZoomOut ? ' on' : ''}`}
        data-testid="cam-zoom"
        title={camZoomOut ? 'Yakınlaş' : 'Genel bakış'}
        onClick={toggleCamZoomOut}
      >
        <CamZoomIcon out={camZoomOut} />
      </button>

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
  const zonesOpen = useGame((s) => s.zonesOpen);
  const floorThemeByZone = useGame((s) => s.floorThemeByZone);
  const wallThemeByZone = useGame((s) => s.wallThemeByZone);
  const tableTheme = useGame((s) => s.tableTheme);
  const ownedCosmetics = useGame((s) => s.ownedCosmetics);
  const [tab, setTab] = useState<'table' | 'floor' | 'wall'>('table');
  // Sekme başına ÖNİZLENEN çeşit (sayfa-içi önizleme bunu gösterir). Varsayılan = o an uygulanmış tema.
  const [sel, setSel] = useState<{ table: string; floor: string; wall: string }>(() => ({
    table: tableTheme,
    floor: floorThemeByZone[0] ?? economyConfig.cosmetics.floorThemes[0].id,
    wall: wallThemeByZone[0] ?? economyConfig.cosmetics.wallThemes[0].id,
  }));

  // MASA çeşitleri kaydırılabilir KART şeridi; karta tıkla → üstteki sayfa-içi önizlemeyi günceller.
  const renderTableCards = () =>
    economyConfig.cosmetics.tableThemes.map((t) => {
      const applied = tableTheme === t.id;
      const previewing = sel.table === t.id;
      const owned = t.cost === 0 || ownedCosmetics.includes(`table:${t.id}`);
      return (
        <button
          className={`shop-vcard${previewing ? ' sel' : ''}`}
          key={t.id}
          data-testid={`shop-card-table-${t.id}`}
          onClick={() => setSel((p) => ({ ...p, table: t.id }))}
        >
          <span className="shop-vcard-swatch" style={{ background: t.color }}>
            {applied ? <span className="shop-vcard-badge">✓</span> : owned ? <span className="shop-vcard-badge owned" /> : null}
          </span>
          <span className="shop-vcard-name">{t.label}</span>
          <span className="shop-vcard-cost">
            {t.cost > 0 ? (
              <>
                <CoinIcon size={12} /> {t.cost.toLocaleString('tr-TR')}
              </>
            ) : (
              'Ücretsiz'
            )}
          </span>
        </button>
      );
    });

  // ZEMİN/DUVAR çeşitleri: çift-renk swatch'lı kartlar; karta tıkla → üstteki diorama önizlemeyi günceller.
  const renderThemeCards = (kind: 'floor' | 'wall') => {
    const themes = kind === 'floor' ? economyConfig.cosmetics.floorThemes : economyConfig.cosmetics.wallThemes;
    const selected = kind === 'floor' ? floorThemeByZone : wallThemeByZone;
    return themes.map((t) => {
      const cols =
        kind === 'floor'
          ? [FLOOR_THEMES[t.id]?.base ?? '#999', FLOOR_THEMES[t.id]?.alt ?? '#777']
          : [WALL_THEMES[t.id]?.cream ?? '#999', WALL_THEMES[t.id]?.wainscot ?? '#777'];
      const applied = selected.slice(0, zonesOpen).includes(t.id);
      const previewing = sel[kind] === t.id;
      return (
        <button
          className={`shop-vcard${previewing ? ' sel' : ''}`}
          key={t.id}
          data-testid={`shop-card-${kind}-${t.id}`}
          onClick={() => setSel((p) => ({ ...p, [kind]: t.id }))}
        >
          <span
            className="shop-vcard-swatch"
            style={{ background: `linear-gradient(135deg, ${cols[0]} 0 50%, ${cols[1]} 50% 100%)` }}
          >
            {applied ? <span className="shop-vcard-badge">✓</span> : null}
          </span>
          <span className="shop-vcard-name">{t.label}</span>
          <span className="shop-vcard-cost">
            {t.cost > 0 ? (
              <>
                <CoinIcon size={12} /> {t.cost.toLocaleString('tr-TR')}
              </>
            ) : (
              'Ücretsiz'
            )}
          </span>
        </button>
      );
    });
  };

  const TABS: { k: 'table' | 'floor' | 'wall'; label: string }[] = [
    { k: 'table', label: 'Masa' },
    { k: 'floor', label: 'Zemin' },
    { k: 'wall', label: 'Duvar' },
  ];

  return (
    <div className="modal-backdrop" data-testid="shop-panel" onClick={onClose}>
      <div className="modal-card shop-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Dekor Mağazası</div>
        <div className="shop-tabs">
          {TABS.map(({ k, label }) => (
            <button
              key={k}
              className={`shop-tab${tab === k ? ' active' : ''}`}
              data-testid={`shop-tab-${k}`}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'table' ? (
          <TableThemePreview id={sel.table} />
        ) : (
          <DioramaPreview kind={tab} id={sel[tab]} />
        )}
        <div className="shop-cards">{tab === 'table' ? renderTableCards() : renderThemeCards(tab)}</div>
        <button className="modal-btn" data-testid="shop-ok" onClick={onClose}>
          Tamam
        </button>
      </div>
    </div>
  );
}

/** FPS + draw-call + üçgen overlay'i. perf singleton'unu rAF ile ~4Hz okur (her kare setState YOK;
 *  PerfProbe zaten 0.5sn'de bir yazar). Sol-üst altı, etkileşimsiz; renk FPS'e göre uyarır. */
function FpsOverlay() {
  const [snap, setSnap] = useState({ fps: 0, calls: 0, tris: 0 });
  const raf = useRef(0);
  useEffect(() => {
    let last = 0;
    const loop = (t: number) => {
      if (t - last >= 250) {
        last = t;
        setSnap({ fps: perf.fps, calls: perf.calls, tris: perf.tris });
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  const color = snap.fps >= 50 ? '#7CFC9A' : snap.fps >= 30 ? '#ffce54' : '#ff6b6b';
  return (
    <div
      data-testid="fps-overlay"
      style={{
        position: 'absolute',
        top: 96,
        left: 12,
        zIndex: 50,
        padding: '4px 8px',
        borderRadius: 8,
        background: 'rgba(0,0,0,0.55)',
        font: '700 12px/1.35 ui-monospace, Menlo, Consolas, monospace',
        color: '#e6edf3',
        pointerEvents: 'none',
        whiteSpace: 'pre',
      }}
    >
      <span style={{ color }}>{snap.fps} FPS</span>
      {`\n${snap.calls} draw\n${(snap.tris / 1000).toFixed(1)}k tri`}
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
