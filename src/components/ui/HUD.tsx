import { useEffect, useRef, useState } from 'react';
import { useGame, goalMetricsOf, tableThemeUnlocked, tableSoftMaxLevel } from '../../game/store';
import { claimableGoals, collectionBonus, goalViews, type GoalView } from '../../game/goals';
import { dailyViews, claimableDailyCount, type DailyQuestView } from '../../game/dailyQuests';
import { dailyCountersOf } from '../../game/store';
import { masterCost } from '../../game/rules';
import { perf } from '../../game/perf';
import { screenPointer } from '../../game/screenPointer';
import { fmt } from '../../game/decimal';
import { levelProgress, reputationCarryMult, economyConfig, MAX_AREAS } from '../../config/economy.config';
import { floorSwatch, WALL_THEMES } from '../../config/palette';
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

/** Oran → yüzde etiketi (0,004 → "+%0,4"). Gelir bonusu tek biçimde yazılsın diye TEK yerde. */
const yuzde = (oran: number): string =>
  `+%${(oran * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;

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
  // D3: alt nav'daki Hedefler sekmesi, toplanabilir ödül varsa işaretlenir. Sahnede işaret
  // ÇIKMAZ — Tek Odak (D-080) aktif adımın işaretini tek tutar; hedefler panelde bekler.
  const goalsReady = useGame((s) => claimableGoals(goalMetricsOf(s), s.goalsClaimed).length > 0);
  // D8: aynı kural günlük görevler için — Görevler sekmesi işaretlenir, sahnede işaret çıkmaz.
  const dailyReady = useGame((s) => claimableDailyCount(s.daily, s.tables, dailyCountersOf(s)) > 0);
  // D8: oyuncu bir Usta noktasının yanında mı? Sahne katmanı yazar (yakınlık `useFrame`te ölçülür).
  const nearMaster = useGame((s) => s.nearMaster);
  // G-14: kapatılan Usta modali, oyuncu O MASADAN uzaklaşana kadar geri açılmaz. D-094'ün
  // "modal her geçişte ekranı keser" endişesinin karşılığı bu — modal geldi, tuzağı gelmedi.
  const [masterKapali, setMasterKapali] = useState<string | null>(null);
  useEffect(() => {
    if (!nearMaster) setMasterKapali(null);
  }, [nearMaster]);

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

      {/* ───────── BİLDİRİM (toast) ─────────
          G-04 (2026-09-09 kullanıcı): görev tamamlanma toast'ı ARTIK ÇİZİLMEZ. Aynı anda iki yerde
          konuşuyordu — toast "şu görev bitti" derken alt bant zaten tamamlanma hâlini gösteriyordu
          ve oyuncu ikisini yeni görev sanıyordu. Tek ses: bant. `tick.ts`e DOKUNULMADI (sunum
          katmanı kararı, E3/D-096 deseni) — olay hâlâ üretiliyor, yalnız burada çizilmiyor;
          devHooks anlık görüntüsü ve ona bağlı testler değişmedi. */}
      {notice && notice.kind !== 'quest' && (
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

      {/* ───────── USTA MODALİ (G-14) ─────────
          D8'de bu bir alt şeritti ve bandı devralıyordu; kullanıcı 2026-09-09'da şeridi reddedip
          modal istedi. Bant artık devredilmiyor — görev adımı yerinde kalır, Usta önüne modal gelir.
          Kapatılınca oyuncu O MASADAN uzaklaşana kadar geri açılmaz (aşağıdaki effect). */}
      {nearMaster && masterKapali !== nearMaster && (
        <MasterModal id={nearMaster} onClose={() => setMasterKapali(nearMaster)} />
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
            {quest.done ? <CheckBadge size={26} /> : <QuestPhoto target={quest.target} size={38} />}
          </span>
          <span className="band-body">
            <span className="band-title">{quest.title}</span>
            {/* G-04: tamamlanma bandın KENDİ hâlidir — ayrı bir toast yok. */}
            {quest.done ? (
              <span className="band-sub done-sub" data-testid="quest-done">
                Tamamlandı
              </span>
            ) : questPct != null ? (
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
          bang={dailyReady}
          onClick={() => setSheet(sheet === 'quests' ? null : 'quests')}
        />
        <NavTab
          id="goals"
          label="Hedefler"
          icon={<TargetIcon size={25} />}
          active={sheet === 'goals'}
          bang={goalsReady}
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
/**
 * USTA ONAY MODALİ (D8 → G-14 ile revize).
 *
 * **KARAR DÖNDÜ (2026-09-09, kullanıcı):** D-094'te bu bir alt ŞERİT olarak yapılmıştı ve
 * gerekçesi yazılıydı — "modal hareketi keser". Kullanıcı oynadıktan sonra şeridi reddetti ve
 * modal istedi; karar kullanıcınındır. D-094'ün endişesi geçersiz değil, o yüzden **kapatılabilir**
 * ve kapatılan masa için oyuncu uzaklaşana kadar bir daha açılmaz — modalin "her geçişte ekranı
 * kapatma" tuzağı böyle kapanıyor.
 *
 * NEDEN DWELL DEĞİL (değişmedi): ₺ noktaları üstünde durunca dolar, ama 25 💎 tek seferlik premium
 * bir harcamadır — yürürken kazara gitmesi kabul edilemez (`feedback_interaction_model`: etkileşim
 * hareket-temelli, ama PARA harcaması açık onay ister).
 *
 * Reklam butonu Faz 5'te bağlanacak; şimdi pasif ama KAYBOLMAZ (D-039 kalıbı) — yeri belli olsun.
 */
function MasterModal({ id, onClose }: { id: string; onClose: () => void }) {
  const diamonds = useGame((s) => s.diamonds);
  const buyMaster = useGame((s) => s.buyMaster);
  const fiyat = masterCost();
  const yeter = diamonds.toNumber() >= fiyat;
  const masaNo = Number(id.split(':')[1] ?? 0) + 1;
  const kat = economyConfig.master.tipMult.toLocaleString('tr-TR');
  return (
    <div className="modal-backdrop" data-testid="master-bar" data-master={id} onClick={onClose}>
      <div className="modal-card master-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-x master-x" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
        <span className="master-badge">
          <GemIcon size={30} />
        </span>
        <span className="master-head">Masa {masaNo} · Usta</span>
        <span className="master-note">Bahşiş ×{kat} — kalıcı</span>
        <div className="master-acts">
          <button
            className={`master-buy${yeter ? '' : ' off'}`}
            data-testid="master-buy"
            disabled={!yeter}
            onClick={() => buyMaster(id)}
          >
            <GemIcon size={16} />
            {fiyat}
          </button>
          <button className="master-buy ad off" data-testid="master-ad" disabled>
            <PlayAdIcon size={15} />
            İzle
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestsSheet({ onClose }: { onClose: () => void }) {
  const questIndex = useGame((s) => s.questIndex);
  const quest = useGame((s) => s.quest);
  const focusQuest = useGame((s) => s.focusQuest);
  const all = economyConfig.quests;
  const done = all.slice(0, Math.min(questIndex, all.length));
  const upcoming = all.slice(questIndex + 1, questIndex + 4);
  // GÜNLÜK GÖREVLER (D8) burada durur, beşinci bir sekme açılmadan: ikisi de "görev"dir, biri
  // hattın adımı biri günün işi. Sayaç ve eşik `dailyQuests.ts`te — panel yalnız çiziyor.
  const stats = useGame((s) => s.stats);
  const lifetime = useGame((s) => s.lifetime);
  const tables = useGame((s) => s.tables);
  const daily = useGame((s) => s.daily);
  const claimDailyQuest = useGame((s) => s.claimDailyQuest);
  const [gunOdul, setGunOdul] = useState<DailyQuestView | null>(null);
  const gunler = dailyViews(daily, tables, dailyCountersOf({ stats, lifetime }));
  const gunHazir = gunler.filter((g) => g.state === 'claimable').length;
  const gunKalan = gunler.filter((g) => g.state !== 'claimed').reduce((a, g) => a + g.diamonds, 0);

  return (
    <Sheet title="Görevler" testid="quests-panel" onClose={onClose}>
      <div className="sheet-sec" data-testid="daily-sec">
        BUGÜN{gunHazir > 0 ? ` · ${gunHazir} ÖDÜL HAZIR` : ''}
      </div>
      <ul className="goals" data-testid="daily-list">
        {gunler.map((g) => (
          <li
            className={`goal${g.state === 'claimable' ? ' ready' : ''}${g.state === 'claimed' ? ' full' : ''}`}
            key={g.id}
            data-testid={`daily-${g.id}`}
            data-state={g.state}
          >
            <span className="goal-top">
              <b>{g.label}</b>
              <span className="goal-num">
                {g.cur.toLocaleString('tr-TR')}
                <i>/{g.target.toLocaleString('tr-TR')}</i>
              </span>
            </span>
            <span className="goal-track">
              <span className="goal-fill" style={{ width: `${Math.min(100, (g.cur / g.target) * 100)}%` }} />
            </span>
            <span className="goal-foot">
              <span className="goal-note">{g.state === 'claimed' ? 'Bugün alındı' : 'Her gün yenilenir'}</span>
              {g.state === 'claimable' ? (
                <button
                  className="goal-claim"
                  data-testid={`daily-claim-${g.id}`}
                  onClick={() => setGunOdul(g)}
                >
                  Ödülü al
                </button>
              ) : (
                <span className="goal-reward">
                  <GemIcon size={13} />
                  {g.diamonds}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="sheet-foot-note" data-testid="daily-left">
        {gunKalan > 0 ? (
          <>
            Bugün kalan ödül: {gunKalan} <GemIcon size={12} /> · yarın üç yeni görev
          </>
        ) : (
          'Bugünün görevleri bitti — yarın üç yeni görev'
        )}
      </div>

      {gunOdul && (
        <RewardModal
          testid="daily-reward"
          title={gunOdul.label}
          amount={0}
          diamonds={gunOdul.diamonds}
          claimTestid="daily-reward-ok"
          onClaim={() => {
            claimDailyQuest(gunOdul.id);
            setGunOdul(null);
          }}
        />
      )}

      <div className="sheet-sec">KIRAATHANE</div>
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

/**
 * HEDEFLER (koleksiyon, D3/D-089 · ödül kalıbı D3b/D-090): beş kategori, AKTİF kademesiyle tek satır.
 *
 * ÖDÜL GÖRÜNÜRLÜĞÜ: kalıcı gelir çarpanı ölçümde kazandı ama tek zayıflığı GÖRÜNMEZ olmasıydı
 * (rapor Bulgu 16) — cüzdana uçan bir sayı yok. Bu yüzden panel iki yerde gösterir: satırda o
 * kademenin payı (+%0,4) ve üstte KÜMÜLATİF toplam ("Koleksiyon bonusu +%X gelir"). Anlık ve
 * görünür ödül tarafını 💎 taşır.
 * Sayaç da eşik de burada DEĞİL — `goals.ts` durumdan türetir, eşikler `economy.config.ts`te.
 * (D3 öncesi ikisi de bu bileşenin içindeydi: HUD'a gömülü sayı hem CLAUDE.md'yi deliyordu hem
 * hedefleri ölçüm aracının göremeyeceği bir yere koyuyordu.)
 *
 * Dört durum (plan §9): kilitli · ilerliyor · toplanabilir · toplandı. Toplanabilir olan satır
 * ödül ekranını açar — ORTAK bileşen, offline kazancıyla aynı `RewardModal`.
 */
function GoalsSheet({ onClose }: { onClose: () => void }) {
  // Metrikler ALAN ALAN seçilir, tek seferde değil: `useGame((s) => goalMetricsOf(s))` her
  // render'da YENİ bir nesne döndürür ve zustand'ı sonsuz render'a sokar (panel hiç açılmıyordu).
  const stats = useGame((s) => s.stats);
  const lifetime = useGame((s) => s.lifetime);
  const padsDone = useGame((s) => s.padsDone);
  const tableLevels = useGame((s) => s.tableLevels);
  const tables = useGame((s) => s.tables);
  const goalsClaimed = useGame((s) => s.goalsClaimed);
  const mastersOwned = useGame((s) => s.mastersOwned);
  const metrics = goalMetricsOf({ stats, lifetime, padsDone, tableLevels, tables });
  const claimGoal = useGame((s) => s.claimGoal);
  const xp = useGame((s) => s.xp);
  const lvl = levelProgress(xp);
  const [odul, setOdul] = useState<GoalView | null>(null);

  const goals = goalViews(metrics, goalsClaimed);
  const toplanabilir = goals.filter((g) => g.state === 'claimable').length;
  const bonus = collectionBonus(goalsClaimed);
  // Usta sayacı: sahip olunan KİMLİK listesinden türer (kayıtta "kaç Usta" alanı yok, D-093).
  const ustaSahip = mastersOwned.filter((id) => id.startsWith('table:')).length;
  const ustaBekleyen =
    tableLevels.slice(0, tables).filter((l) => l >= tableSoftMaxLevel()).length - ustaSahip;

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
          <small>
            Her hedef itibarını yükseltir · itibar bonusu{' '}
            {yuzde(reputationCarryMult(lvl.level) - 1)} servis hızı
            {bonus > 0 ? ` · koleksiyon bonusu ${yuzde(bonus)} gelir` : ''}.
          </small>
        </span>
      </div>

      {/* USTA ŞERİDİ (D8 · plan §5 "Hedefler panelinden de toplu erişilir: Usta masalar 7/20").
          Burada SATIN ALINMAZ — alım mekânsaldır (masanın yanındaki 💎 noktası). Bu şerit
          koleksiyonun sayacıdır: kaç masa Usta oldu, kaçı sırada bekliyor, elmas yetiyor mu. */}
      <div className="usta-strip" data-testid="usta-strip">
        <span className="usta-count">
          <b data-testid="usta-owned">{ustaSahip}</b>
          <i>/{tables}</i>
        </span>
        <span className="usta-body">
          <b>Usta masalar</b>
          <small>
            {ustaBekleyen > 0
              ? `${ustaBekleyen} masa hazır — yanındaki mavi noktaya git`
              : 'Masayı ₺ tavanına çıkarınca Usta noktası açılır'}
          </small>
        </span>
        <span className="usta-price" data-testid="usta-price">
          <GemIcon size={14} />
          {masterCost()}
        </span>
      </div>

      <div className="sheet-sec">
        KATEGORİLER{toplanabilir > 0 ? ` · ${toplanabilir} ÖDÜL HAZIR` : ''}
      </div>
      <ul className="goals">
        {goals.map((g) => {
          const pct = Math.min(100, (g.cur / g.target) * 100);
          const bitti = g.state === 'claimed';
          return (
            <li
              className={`goal${g.state === 'claimable' ? ' ready' : ''}${bitti ? ' full' : ''}`}
              key={g.categoryId}
              data-testid={`goal-${g.categoryId}`}
              data-state={g.state}
            >
              <span className="goal-top">
                <b>
                  {g.categoryName} <i className="goal-tier">{g.tier + 1}/5</i>
                </b>
                <span className="goal-num">
                  {g.cur.toLocaleString('tr-TR')}
                  <i>/{g.target.toLocaleString('tr-TR')}</i>
                </span>
              </span>
              <span className="goal-track">
                <span className="goal-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="goal-foot">
                <span className="goal-note">{g.note}</span>
                {g.state === 'claimable' ? (
                  <button
                    className="goal-claim"
                    data-testid={`goal-claim-${g.categoryId}`}
                    onClick={() => setOdul(g)}
                  >
                    Ödülü al
                  </button>
                ) : (
                  <span className="goal-reward">
                    <CoinIcon size={13} />
                    {yuzde(g.bonus)}
                    <GemIcon size={13} />
                    {g.diamonds}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {odul && (
        <RewardModal
          testid="goal-reward"
          title={`${odul.categoryName} · ${odul.tier + 1}. kademe`}
          amount={0}
          bonus={odul.bonus}
          diamonds={odul.diamonds}
          claimTestid="goal-reward-ok"
          onClaim={() => {
            claimGoal(odul.id);
            setOdul(null);
          }}
        />
      )}
    </Sheet>
  );
}

/** ORTAK ÖDÜL EKRANI (plan §9): başlık · ödül · [Al] · [▶ İzle, 2× al].
 *  Reklam hazır değilse ikinci buton pasif görünür ama KAYBOLMAZ (D-039 kalıbı). */
function RewardModal({
  testid,
  title,
  amount,
  diamonds = 0,
  bonus = 0,
  onClaim,
  claimTestid,
  adReady = false,
}: {
  testid: string;
  title: string;
  amount: number;
  /** 💎 ödülü (D3: hedefler iki para birimi verir; offline yalnız ₺ verdiği için varsayılan 0). */
  diamonds?: number;
  /** KALICI gelir artışı (oran; D-090). Offline ekranı ₺ verir → varsayılan 0, o ekran değişmedi. */
  bonus?: number;
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
          {amount > 0 && (
            <>
              <CoinIcon size={30} /> +{amount.toLocaleString('tr-TR')}
            </>
          )}
          {bonus > 0 && (
            <>
              <CoinIcon size={30} /> {yuzde(bonus)} kalıcı gelir
            </>
          )}
          {diamonds > 0 && (
            <>
              <GemIcon size={30} /> +{diamonds}
            </>
          )}
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

/** Dekor mağazası (WP6 — feedback §D19): tema satırı = renk önizleme + ad + fiyat + alan uygula
 *  butonları (yalnız AÇIK alanlar). İlk satın alma ₺ düşer; sahip olunan tema ücretsiz seçilir. */
function ShopPanel({ onClose }: { onClose: () => void }) {
  const areasOpen = useGame((s) => s.areasOpen);
  const tables = useGame((s) => s.tables);
  const tableLevels = useGame((s) => s.tableLevels);
  const floorThemeByArea = useGame((s) => s.floorThemeByArea);
  const wallThemeByArea = useGame((s) => s.wallThemeByArea);
  const tableTheme = useGame((s) => s.tableTheme);
  const ownedCosmetics = useGame((s) => s.ownedCosmetics);
  const [tab, setTab] = useState<'table' | 'floor' | 'wall'>('table');
  // Masa teması kilidi: 3 salon + tüm açık masalar max (kullanıcı kararı). Kilitliyse Masa sekmesi
  // satın alma yerine koşulu açıklayan kilit panelini gösterir.
  const tableUnlocked = tableThemeUnlocked({ areasOpen, tables, tableLevels });
  const maxedTables = tableLevels.slice(0, tables).filter((l) => l >= tableSoftMaxLevel()).length;
  // Sekme başına ÖNİZLENEN çeşit (sayfa-içi önizleme bunu gösterir). Varsayılan = o an uygulanmış tema.
  const [sel, setSel] = useState<{ table: string; floor: string; wall: string }>(() => ({
    table: tableTheme,
    floor: floorThemeByArea[0] ?? economyConfig.cosmetics.floorThemes[0].id,
    wall: wallThemeByArea[0] ?? economyConfig.cosmetics.wallThemes[0].id,
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
    const selected = kind === 'floor' ? floorThemeByArea : wallThemeByArea;
    return themes.map((t) => {
      const cols =
        kind === 'floor'
          ? floorSwatch(t.id)
          : [WALL_THEMES[t.id]?.cream ?? '#999', WALL_THEMES[t.id]?.wainscot ?? '#777'];
      const applied = selected.slice(0, areasOpen).includes(t.id);
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
              <span className={areasOpen >= MAX_AREAS ? 'req done' : 'req'}>
                {areasOpen >= MAX_AREAS ? '✓' : '•'} Salon {areasOpen}/{MAX_AREAS}
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

