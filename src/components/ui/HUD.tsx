import { useEffect, useRef, useState } from 'react';
import { useGame, tableThemeUnlocked, tableSoftMaxLevel } from '../../game/store';
import { perf } from '../../game/perf';
import { screenPointer } from '../../game/screenPointer';
import { fmt } from '../../game/decimal';
import { levelProgress, economyConfig, MAX_ZONES } from '../../config/economy.config';
import { FLOOR_THEMES, WALL_THEMES } from '../../config/palette';
import {
  CoinIcon,
  GemIcon,
  StarBadge,
  GearIcon,
  CharIcon,
  TrayEmptyIcon,
  TostEmptyIcon,
  QuestPhoto,
  CheckBadge,
  BangBadge,
  CamZoomIcon,
  QuestListIcon,
  TargetIcon,
  ShopAwningIcon,
  ChevronIcon,
  ReputationIcon,
  PlayAdIcon,
} from './icons';
import { Sheet } from './Sheet';
import { CharacterPanel } from './CharacterPanel';
import { TableThemePreview } from './TableThemePreview';
import { DioramaPreview } from './DioramaPreview';
import './hud.css';

/**
 * HUD — arayüz v2 (plan §9 bilgi mimarisi; docs/plan-kat1-yayin.html).
 *
 *   ÜST ŞERİT   İtibar madalyonu + çubuğu · ₺ · 💎 · ayar
 *   SAHNE       yalnız AKTİF ADIM'ın işareti + ekran kenarı oku (hedef dışarıdaysa)
 *   ALT BANT    AKTİF ADIM — tek satır; Tek Odak'ın metin kanalı (dokun → kamera hedefe)
 *   ALT NAV     Görevler · Hedefler · Mağaza · Karakter
 *
 * Eski dağınık yan buton kümesi (dişli/posta/fırça/karakter) ve sağ-üst görev kartı kaldırıldı:
 * paneller tek bir ALT SAYFA (sheet) kabuğunu paylaşır, böylece yeni ekranlar (Hedefler, günlük
 * görev, ödül) panel panel eklendikçe dağılmaz. Posta K16 ile kaldırıldı.
 *
 * Görsel dil: kıraathane — ceviz/espresso panel, pirinç kenar, krem yazı. Emoji ve CSS ikon YOK
 * (plan §9 zorunlu kuralı): her simge `icons.tsx`'te elle çizilmiş SVG.
 */

type Sheet = 'quests' | 'goals' | 'shop' | 'char' | 'settings' | null;

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
  const [sheet, setSheet] = useState<Sheet>(null);

  const lvl = levelProgress(xp);
  const questPct = quest && quest.total != null ? Math.min(100, ((quest.cur ?? 0) / quest.total) * 100) : null;
  const showOffline = offlineEarned > 0 && !offlineSeen;
  // Karakter panelinden alınan görevler (tepsi/garson tepsi/garson hız) → Karakter sekmesi işaretlenir.
  const charQuestActive =
    quest?.target.type === 'charStat' || quest?.target.type === 'waiterTray' || quest?.target.type === 'waiterSpeed';
  const spotlight = charQuestActive && !charPanelSeen && sheet == null && !showOffline;
  const traySpot = tray + trayFood > 0 && !trayTipSeen && sheet == null && !showOffline && !spotlight;

  const openChar = () => {
    markCharPanelSeen();
    setSheet('char');
  };

  const onReset = () => {
    if (window.confirm('Oyunu sıfırla? Bu cihazdaki tüm ilerleme silinecek.')) {
      setSheet(null);
      hardReset();
    }
  };

  return (
    <div className="hud" data-testid="hud">
      {settings.showFps && <FpsOverlay />}

      {/* ───────── ÜST ŞERİT ───────── */}
      <div className="topbar">
        <button
          className="rep"
          data-testid="level"
          title="İtibar"
          onClick={() => setSheet('goals')}
        >
          <span className="rep-medal">
            <ReputationIcon size={38} />
            <i className="rep-num" data-testid="level-num">
              {lvl.level}
            </i>
          </span>
          <span className="rep-bar">
            <span className="rep-fill" style={{ width: `${Math.min(100, (lvl.cur / lvl.need) * 100)}%` }} />
            <span className="rep-text">
              {lvl.cur}/{lvl.need}
            </span>
          </span>
        </button>

        <div className="purse">
          <div className="cur" data-testid="wallet">
            <CoinIcon size={30} />
            <span className="cur-val">{fmt(wallet)}</span>
          </div>
          <div className="cur gem" data-testid="diamonds">
            <GemIcon size={27} />
            <span className="cur-val">{fmt(diamonds)}</span>
          </div>
        </div>

        <button className="round-btn gear" data-testid="gear" title="Ayarlar" onClick={() => setSheet('settings')}>
          <GearIcon size={20} />
        </button>
      </div>

      {/* Aktif adımın ekran-kenarı oku (hedef görüş alanı dışındaysa) */}
      <EdgeArrow onClick={focusQuest} />

      {/* ───────── SAĞ KENAR: genel bakış + tepsiyi boşalt ───────── */}
      <div className="side-stack">
        <button
          className={`round-btn${camZoomOut ? ' on' : ''}`}
          data-testid="cam-zoom"
          title={camZoomOut ? 'Yakınlaş' : 'Genel bakış'}
          onClick={toggleCamZoomOut}
        >
          <CamZoomIcon size={24} out={camZoomOut} />
        </button>
        {trayFood > 0 && (
          <button
            className="round-btn tray-btn"
            data-testid="empty-tray-food"
            title="Tostları bırak"
            onClick={() => {
              markTrayTipSeen();
              emptyTray('food');
            }}
          >
            <TostEmptyIcon size={24} />
            <span className="tray-count" data-testid="tray-count-food">
              {trayFood}
            </span>
          </button>
        )}
        {tray > 0 && (
          <button
            className="round-btn tray-btn"
            data-testid="empty-tray"
            title="Çayları bırak"
            onClick={() => {
              markTrayTipSeen();
              emptyTray('tea');
            }}
          >
            <TrayEmptyIcon size={24} />
            <span className="tray-count" data-testid="tray-count">
              {tray}
            </span>
          </button>
        )}
      </div>
      {traySpot && <div className="spotlight-backdrop" data-testid="tray-spotlight" onClick={markTrayTipSeen} />}
      {traySpot && (
        <div className="tray-tip">Müşteri kalmadıysa tepsini boşaltabilirsin — kaplar temiz rafa döner.</div>
      )}

      {/* ───────── BİLDİRİM (toast) ───────── */}
      {notice && (
        <div className="notice" data-testid="notice" key={notice.text}>
          <span className="notice-badge">
            {notice.kind === 'quest' ? (
              <CheckBadge size={28} />
            ) : notice.kind === 'level' ? (
              <StarBadge size={28} />
            ) : (
              <BangBadge size={28} />
            )}
          </span>
          <span className="notice-text">{notice.text}</span>
          {notice.reward != null && (
            <span className="notice-reward" data-testid="notice-reward">
              <CoinIcon size={16} />+{notice.reward}
            </span>
          )}
        </div>
      )}

      {/* ───────── ALT BANT: AKTİF ADIM (Tek Odak) ───────── */}
      {quest ? (
        <button
          className={`band${quest.done ? ' done' : ''}`}
          data-testid="quest"
          key={quest.id}
          onClick={() => (charQuestActive ? openChar() : focusQuest())}
        >
          <span className="band-photo">
            <QuestPhoto target={quest.target} size={38} />
          </span>
          <span className="band-body">
            <span className="band-title">{quest.title}</span>
            {questPct != null ? (
              <span className="band-track">
                <span className="band-fill" style={{ width: `${questPct}%` }} />
                <span className="band-count" data-testid="quest-prog">
                  {quest.cur}/{quest.total}
                </span>
              </span>
            ) : quest.cost != null ? (
              <span className="band-sub">
                <CoinIcon size={15} />
                {quest.cost.toLocaleString('tr-TR')}
              </span>
            ) : (
              <span className="band-sub dim">{charQuestActive ? 'Karakter panelinden al' : 'Hedefe git'}</span>
            )}
          </span>
          {quest.reward != null && (
            <span className="band-reward" data-testid="quest-reward">
              <CoinIcon size={14} />+{quest.reward}
            </span>
          )}
          <span className="band-go">
            <ChevronIcon size={18} />
          </span>
        </button>
      ) : (
        <div className="band idle">
          <span className="band-body">
            <span className="band-title">Görev hattı tamamlandı — kıraathane senin.</span>
          </span>
        </div>
      )}

      {/* ───────── ALT NAV ───────── */}
      <nav className="botnav">
        <NavTab
          id="quests"
          label="Görevler"
          icon={<QuestListIcon size={25} />}
          active={sheet === 'quests'}
          onClick={() => setSheet(sheet === 'quests' ? null : 'quests')}
        />
        <NavTab
          id="goals"
          label="Hedefler"
          icon={<TargetIcon size={25} />}
          active={sheet === 'goals'}
          onClick={() => setSheet(sheet === 'goals' ? null : 'goals')}
        />
        <NavTab
          id="shop"
          label="Mağaza"
          icon={<ShopAwningIcon size={25} />}
          active={sheet === 'shop'}
          onClick={() => setSheet(sheet === 'shop' ? null : 'shop')}
        />
        <NavTab
          id="char"
          label="Karakter"
          icon={<CharIcon size={25} />}
          active={sheet === 'char'}
          bang={charQuestActive}
          spot={spotlight}
          onClick={() => (sheet === 'char' ? setSheet(null) : openChar())}
        />
      </nav>
      {spotlight && <div className="spotlight-backdrop" data-testid="char-spotlight" onClick={markCharPanelSeen} />}

      {/* ───────── ALT SAYFALAR ───────── */}
      {sheet === 'quests' && <QuestsSheet onClose={() => setSheet(null)} />}
      {sheet === 'goals' && <GoalsSheet onClose={() => setSheet(null)} />}
      {sheet === 'shop' && <ShopPanel onClose={() => setSheet(null)} />}
      {sheet === 'char' && <CharacterPanel onClose={() => setSheet(null)} />}
      {sheet === 'settings' && (
        <Sheet title="Ayarlar" testid="menu" onClose={() => setSheet(null)}>
          <div className="sheet-pad">
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
            <button className="sheet-cta" data-testid="settings-ok" onClick={() => setSheet(null)}>
              Tamam
            </button>
          </div>
        </Sheet>
      )}

      {/* ───────── OFFLINE KAZANÇ (ortak ödül ekranı kalıbı) ───────── */}
      {showOffline && (
        <RewardModal
          testid="offline"
          title="Sen yokken kıraathane çalıştı"
          amount={Math.floor(offlineEarned)}
          onClaim={() => setOfflineSeen(true)}
          claimTestid="offline-ok"
        />
      )}
    </div>
  );
}

/** Alt nav sekmesi — ikon + etiket; aktifken pirinç kaide yükselir. */
function NavTab({
  id,
  label,
  icon,
  active,
  bang,
  dot,
  spot,
  onClick,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  bang?: boolean;
  /** Sessiz "bak buraya" noktası (tamamlanan hedef var). */
  dot?: boolean;
  spot?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`navtab${active ? ' active' : ''}${spot ? ' spot' : ''}`}
      data-testid={id}
      onClick={onClick}
    >
      <span className="navtab-icon">
        {icon}
        {bang && <span className="navtab-bang">!</span>}
        {!bang && dot && <span className="navtab-dot" />}
      </span>
      <span className="navtab-label">{label}</span>
    </button>
  );
}

/** Ekran-kenarı oku: aktif adımın hedefi görüş alanı dışındayken kenarda titreşen pirinç ok. */
function EdgeArrow({ onClick }: { onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 50) return; // ~20Hz yeter (ok yumuşak kayar, CSS transition taşır)
      last = t;
      const p = screenPointer;
      const on = p.active && !p.onScreen;
      setShown(on);
      const el = ref.current;
      if (on && el) {
        el.style.transform = `translate(-50%,-50%) translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px)`;
        const arrow = el.firstElementChild as HTMLElement | null;
        if (arrow) arrow.style.transform = `rotate(${p.angle.toFixed(0)}deg)`;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (!shown) return null;
  return (
    <button className="edge-arrow" data-testid="edge-arrow" ref={ref} onClick={onClick} title="Hedefe bak">
      <span className="edge-arrow-glyph">
        <ChevronIcon size={22} />
      </span>
    </button>
  );
}

/** GÖREVLER: aktif adım büyük kart + tamamlananlar listesi (plan §9 durumları). */
function QuestsSheet({ onClose }: { onClose: () => void }) {
  const questIndex = useGame((s) => s.questIndex);
  const quest = useGame((s) => s.quest);
  const focusQuest = useGame((s) => s.focusQuest);
  const all = economyConfig.quests;
  const done = all.slice(0, Math.min(questIndex, all.length));
  const upcoming = all.slice(questIndex + 1, questIndex + 4);

  return (
    <Sheet title="Görevler" testid="quests-panel" onClose={onClose}>
      {quest ? (
        <button
          className="qbig"
          data-testid="quest-active"
          onClick={() => {
            focusQuest();
            onClose();
          }}
        >
          <span className="qbig-photo">
            <QuestPhoto target={quest.target} size={62} />
          </span>
          <span className="qbig-body">
            <span className="qbig-kicker">ŞU AN</span>
            <span className="qbig-title">{quest.title}</span>
            {quest.total != null ? (
              <span className="band-track big">
                <span
                  className="band-fill"
                  style={{ width: `${Math.min(100, ((quest.cur ?? 0) / quest.total) * 100)}%` }}
                />
                <span className="band-count">
                  {quest.cur}/{quest.total}
                </span>
              </span>
            ) : quest.cost != null ? (
              <span className="band-sub">
                <CoinIcon size={16} />
                {quest.cost.toLocaleString('tr-TR')}
              </span>
            ) : null}
          </span>
          {quest.reward != null && (
            <span className="qbig-reward">
              <CoinIcon size={16} />+{quest.reward}
            </span>
          )}
        </button>
      ) : (
        <div className="sheet-empty">Görev hattı tamamlandı. Kıraathane tamamen senin.</div>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="sheet-sec">SIRADA</div>
          <ul className="qlist">
            {upcoming.map((q) => (
              <li className="qrow next" key={q.id}>
                <span className="qrow-dot" />
                <span className="qrow-title">{q.title}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {done.length > 0 && (
        <>
          <div className="sheet-sec">TAMAMLANAN · {done.length}</div>
          <ul className="qlist">
            {done
              .slice()
              .reverse()
              .map((q) => (
                <li className="qrow" key={q.id}>
                  <span className="qrow-check">
                    <CheckBadge size={20} />
                  </span>
                  <span className="qrow-title">{q.title}</span>
                  {q.reward != null && (
                    <span className="qrow-reward">
                      <CoinIcon size={13} />+{q.reward}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}

/** HEDEFLER: beş kategori + ilerleme sayaçları + Usta sayacı (plan §9). Sayaçlar GERÇEK
 *  `stats`/durumdan türer — sahte veri yok. Ödül toplama Faz D'de bağlanacak (K5). */
function GoalsSheet({ onClose }: { onClose: () => void }) {
  const stats = useGame((s) => s.stats);
  const lifetime = useGame((s) => s.lifetime);
  const tables = useGame((s) => s.tables);
  const zonesOpen = useGame((s) => s.zonesOpen);
  const tableLevels = useGame((s) => s.tableLevels);
  const xp = useGame((s) => s.xp);
  const lvl = levelProgress(xp);

  const masterTables = tableLevels.slice(0, tables).filter((l) => l >= tableSoftMaxLevel()).length;
  const totalSlots = MAX_ZONES * 4;

  const goals: { key: string; name: string; cur: number; total: number; note: string }[] = [
    {
      key: 'service',
      name: 'Servis',
      cur: stats.teasServed + stats.waiterServed,
      total: 500,
      note: 'Elden ve garsonla yapılan toplam servis',
    },
    { key: 'clean', name: 'Temizlik', cur: stats.dishesWashed, total: 200, note: 'Yıkanan kirli bardak' },
    { key: 'grow', name: 'Büyüme', cur: tables, total: totalSlots, note: `Açılan masa · salon ${zonesOpen}/${MAX_ZONES}` },
    {
      key: 'earn',
      name: 'Kazanç',
      cur: Math.max(0, Math.floor(lifetime.toNumber())),
      total: 1_000_000,
      note: 'Toplam kazanılan ₺',
    },
    { key: 'master', name: 'Usta', cur: masterTables, total: totalSlots, note: 'Usta seviyesine çıkan masa' },
  ];

  return (
    <Sheet title="Hedefler" testid="goals-panel" onClose={onClose}>
      <div className="rep-hero">
        <span className="rep-hero-medal">
          <ReputationIcon size={54} />
          <i>{lvl.level}</i>
        </span>
        <span className="rep-hero-body">
          <b>İtibar {lvl.level}</b>
          <span className="rep-bar wide">
            <span className="rep-fill" style={{ width: `${Math.min(100, (lvl.cur / lvl.need) * 100)}%` }} />
            <span className="rep-text">
              {lvl.cur}/{lvl.need}
            </span>
          </span>
          <small>Her hedef itibarını yükseltir.</small>
        </span>
      </div>

      <div className="sheet-sec">KATEGORİLER</div>
      <ul className="goals">
        {goals.map((g) => {
          const pct = Math.min(100, (g.cur / g.total) * 100);
          const full = g.cur >= g.total;
          return (
            <li className={`goal${full ? ' full' : ''}`} key={g.key} data-testid={`goal-${g.key}`}>
              <span className="goal-top">
                <b>{g.name}</b>
                <span className="goal-num">
                  {g.cur.toLocaleString('tr-TR')}
                  <i>/{g.total.toLocaleString('tr-TR')}</i>
                </span>
              </span>
              <span className="goal-track">
                <span className="goal-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="goal-note">{g.note}</span>
            </li>
          );
        })}
      </ul>
      <div className="sheet-foot-note">Hedef ödülleri bir sonraki güncellemede toplanabilir olacak.</div>
    </Sheet>
  );
}

/** ORTAK ÖDÜL EKRANI (plan §9): başlık · ödül · [Al] · [▶ İzle, 2× al].
 *  Reklam hazır değilse ikinci buton pasif görünür ama KAYBOLMAZ (D-039 kalıbı). */
function RewardModal({
  testid,
  title,
  amount,
  onClaim,
  claimTestid,
  adReady = false,
}: {
  testid: string;
  title: string;
  amount: number;
  onClaim: () => void;
  claimTestid: string;
  adReady?: boolean;
}) {
  return (
    <div className="modal-backdrop" data-testid={testid}>
      <div className="modal-card reward-card">
        <div className="reward-glow" />
        <div className="reward-title">{title}</div>
        <div className="reward-amount">
          <CoinIcon size={30} /> +{amount.toLocaleString('tr-TR')}
        </div>
        <button className="sheet-cta" data-testid={claimTestid} onClick={onClaim}>
          Al
        </button>
        <button className={`sheet-cta ad${adReady ? '' : ' off'}`} disabled={!adReady} onClick={onClaim}>
          <PlayAdIcon size={18} /> İzle, 2× al
        </button>
      </div>
    </div>
  );
}

/** Dekor mağazası (WP6 — feedback §D19): tema satırı = renk önizleme + ad + fiyat + zone uygula
 *  butonları (yalnız AÇIK zone'lar). İlk satın alma ₺ düşer; sahip olunan tema ücretsiz seçilir. */
function ShopPanel({ onClose }: { onClose: () => void }) {
  const zonesOpen = useGame((s) => s.zonesOpen);
  const tables = useGame((s) => s.tables);
  const tableLevels = useGame((s) => s.tableLevels);
  const floorThemeByZone = useGame((s) => s.floorThemeByZone);
  const wallThemeByZone = useGame((s) => s.wallThemeByZone);
  const tableTheme = useGame((s) => s.tableTheme);
  const ownedCosmetics = useGame((s) => s.ownedCosmetics);
  const [tab, setTab] = useState<'table' | 'floor' | 'wall'>('table');
  // Masa teması kilidi: 3 salon + tüm açık masalar max (kullanıcı kararı). Kilitliyse Masa sekmesi
  // satın alma yerine koşulu açıklayan kilit panelini gösterir.
  const tableUnlocked = tableThemeUnlocked({ zonesOpen, tables, tableLevels });
  const maxedTables = tableLevels.slice(0, tables).filter((l) => l >= tableSoftMaxLevel()).length;
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
    <Sheet title="Dekor Mağazası" testid="shop-panel" onClose={onClose}>
      <div className="shop-card">
        <div className="shop-tabs">
          {TABS.map(({ k, label }) => (
            <button
              key={k}
              className={`shop-tab${tab === k ? ' active' : ''}`}
              data-testid={`shop-tab-${k}`}
              onClick={() => setTab(k)}
            >
              {label}
              {k === 'table' && !tableUnlocked ? <span className="shop-tab-lock">🔒</span> : null}
            </button>
          ))}
        </div>
        {tab === 'table' && !tableUnlocked ? (
          <div className="shop-locked" data-testid="shop-table-locked">
            <div className="shop-locked-icon">🔒</div>
            <div className="shop-locked-title">Masa temaları kilitli</div>
            <div className="shop-locked-desc">
              Tüm salonları aç ve bütün masaları son seviyeye getir; sonra masalarını renklendirebilirsin.
            </div>
            <div className="shop-locked-reqs">
              <span className={zonesOpen >= MAX_ZONES ? 'req done' : 'req'}>
                {zonesOpen >= MAX_ZONES ? '✓' : '•'} Salon {zonesOpen}/{MAX_ZONES}
              </span>
              <span className={maxedTables >= tables && tables > 0 ? 'req done' : 'req'}>
                {maxedTables >= tables && tables > 0 ? '✓' : '•'} Max masa {maxedTables}/{tables}
              </span>
            </div>
          </div>
        ) : tab === 'table' ? (
          <TableThemePreview id={sel.table} />
        ) : (
          <DioramaPreview kind={tab} id={sel[tab]} />
        )}
        {tab === 'table' && !tableUnlocked ? null : (
          <div className="shop-cards">{tab === 'table' ? renderTableCards() : renderThemeCards(tab)}</div>
        )}
        <button className="sheet-cta" data-testid="shop-ok" onClick={onClose}>
          Tamam
        </button>
      </div>
    </Sheet>
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

