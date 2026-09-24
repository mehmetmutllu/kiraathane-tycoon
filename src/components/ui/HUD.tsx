import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useGame, goalMetricsOf, tableThemeUnlocked, tableSoftMaxLevel, gorunenCuzdan } from '../../game/store';
import { claimableGoals, collectionBonus, goalViewsForPanel, type GoalView } from '../../game/goals';
import { dailyViews, claimableDailyCount, dayIndex, type DailyQuestView } from '../../game/dailyQuests';
import { dailyCountersOf } from '../../game/store';
import { adFreeDailyReady, masterAdsLeft, masterCost, toastCizilir, questInTransition, videoReward, videoRights, type QuestView } from '../../game/rules';
import { ekranKanali, geriTusu, tepsiIpucuZamani } from '../../game/ekranKanali';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { odulAlindi, odulluIzle, odulluReklamHazir, panelKapandi, reklamAbone, sogumaSifirla } from '../../game/ads';
import { screenPointer } from '../../game/screenPointer';
import { satinAl, satinAlimlariGeriYukle, satinAlmaAbone, satinAlmaSurumu, urunFiyati } from '../../game/iap';
import { basarimlariGoster, bulutAbone, bulutSifirla, bulutSurumu, girisYap, playGamesDurumu } from '../../game/bulut';
import { iapConfig } from '../../config/iap.config';
import { fmt } from '../../game/decimal';
import { SAVE_VERSION } from '../../game/save';
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
  LockIcon,
  CloseIcon,
  ResetIcon,
  TickIcon,
  DotIcon,
  BasinIcon,
} from './icons';
import { Sheet } from './Sheet';
import { CharacterPanel, SahipOnizleme } from './CharacterPanel';
import { baslangicTeklifiGoster, dekorAcik, dekorSalonu, vitrinSahip, vitrinUrunleri, vitrinUrunu, type VitrinTuru } from '../../game/vitrin';
import { dekorPulu, kiyafetPulu, tepsiPulu } from '../../config/kozmetik';
import { DekorOnizleme } from './DekorOnizleme';
import { TableThemePreview } from './TableThemePreview';
import { DioramaPreview } from './DioramaPreview';
import './hud.css';
import { KafeAdiKutusu } from './KafeAdiKutusu';
import { KAFE_ADI_VARSAYILAN } from '../../game/kafeAdi';
import { cihazSinifiOku, golgeAcikMi } from '../../game/cihazSinifi';

/** Oran → yüzde etiketi (0,004 → "+%0,4"). Gelir bonusu tek biçimde yazılsın diye TEK yerde. */
const yuzde = (oran: number): string => `+${oranYuzde(oran)}`;

/** Oran → İŞARETSİZ yüzde (0,036 → "%3,6"). Ödül ekranı ARTIŞI değil TOPLAMI yazıyor (D-128),
 *  yani oradaki sayının başında "+" olmaz: "+%3,6 → +%4,0" iki kez artış vaat ederdi. */
const oranYuzde = (oran: number): string =>
  `%${(oran * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;

/**
 * B8 (T9d · D-146): pad görevinde bant ZEMİNLE AYNI tutarı yazar — kalan (maliyet − dolum).
 * Eskiden bant toplamı (9.950), zemin kalanı (4.200) gösteriyordu. Pad dışı görevde maliyet aynen.
 */
function gorevTutari(q: QuestView, padFills: Record<string, number>): number | null {
  if (q.cost == null) return null;
  if (q.target.type !== 'pad') return q.cost;
  return Math.max(0, Math.ceil(q.cost - (padFills[q.target.id] ?? 0)));
}

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
  const offlineIzleEki = useGame((s) => s.offlineIzleEki);
  const notice = useGame((s) => s.notice);
  /**
   * GÖREV HATTI BİTİŞ BANDI 5 SANİYE DURUR (kullanıcı 2026-09-09: *"görev hattı tamamlanınca
   * 'tamamlandı kıraathane senin' yazmasın, 5 sn sonra çıktıktan sonra gitsin"*).
   * Bant kalıcıydı ve ekranın altında sürekli yer kaplıyordu; oysa bir KUTLAMA, bir durum satırı
   * değil. Süre dolunca bant kalkar ve alt nav yukarı toplanır.
   */
  const quest = useGame((s) => s.quest);
  const [bitisGorunur, setBitisGorunur] = useState(true);
  const questBitti = quest == null;
  // Hat yeniden uzarsa (yeni görev eklenirse) bant tekrar hak eder — render sırasında düzeltilir.
  if (!questBitti && !bitisGorunur) setBitisGorunur(true);
  useEffect(() => {
    if (!questBitti) return undefined;
    const t = setTimeout(() => setBitisGorunur(false), 5000);
    return () => clearTimeout(t);
  }, [questBitti]);
  const focusQuest = useGame((s) => s.focusQuest);
  const padFills = useGame((s) => s.padFills);
  const hardReset = useGame((s) => s.hardReset);
  const charPanelSeen = useGame((s) => s.charPanelSeen);
  const markCharPanelSeen = useGame((s) => s.markCharPanelSeen);
  const tray = useGame((s) => s.tray);
  const trayFood = useGame((s) => s.trayFood);
  const emptyTray = useGame((s) => s.emptyTray);
  const trayTipSeen = useGame((s) => s.trayTipSeen);
  // Boolean seçilir (dizi değil): müşteri listesi her karede yenilenir, HUD yalnız cevap değişince çizer.
  const tepsiAni = useGame((s) =>
    tepsiIpucuZamani({ tray: s.tray, trayFood: s.trayFood, teasServed: s.stats.teasServed, npcs: s.npcs }),
  );
  const markTrayTipSeen = useGame((s) => s.markTrayTipSeen);
  // G-63: bulaşık öğretme kartı — mekanik ile görev aynı anda doğuyordu, arada öğretme yoktu.
  const washTipSeen = useGame((s) => s.washTipSeen);
  const markWashTipSeen = useGame((s) => s.markWashTipSeen);
  const focusDish = useGame((s) => s.focusDish);
  const camZoomOut = useGame((s) => s.camZoomOut);
  const toggleCamZoomOut = useGame((s) => s.toggleCamZoomOut);
  const claimOffline = useGame((s) => s.claimOffline);
  const [sheet, setSheet] = useState<Sheet>(null);
  // C5 (T9d): sıfırlama onayı OYUNUN kutusunda — `window.confirm` Capacitor'da çıplak sistem penceresiydi.
  const [sifirlaSor, setSifirlaSor] = useState(false);
  // F4c-3 (D-156): kafe adı — `null` = hiç sorulmadı (açılış kanalı); Ayarlar'dan düzenleme ayrı kip.
  const kafeAdi = useGame((s) => s.kafeAdi);
  const kafeAdiKoy = useGame((s) => s.kafeAdiKoy);
  const [adDuzenle, setAdDuzenle] = useState(false);
  const [adTaslak, setAdTaslak] = useState(kafeAdi ?? KAFE_ADI_VARSAYILAN);
  // F3b (D-150) · G-57: video hakkı kartı. Düğme seviye ₺'si ile AYNI kapıdan açılır (Sv 5): ödül
  // "son dakikanın kazancı" olduğundan ona bağlansaydı oyuncu durunca düğme kaybolup geri gelirdi.
  const [videoAcik, setVideoAcik] = useState(false);
  const videoKalan = useGame((s) => videoRights(s.reklam, Date.now()).kalan);
  // Ayarlar künyesi (E3 · S23) — oyuncunun kendi geçmişi, ekranın boş kalan altını doldurur.
  const stats = useGame((s) => s.stats);
  const lifetime = useGame((s) => s.lifetime);
  const padsDone = useGame((s) => s.padsDone);
  // D3: alt nav'daki Hedefler sekmesi, toplanabilir ödül varsa işaretlenir. Sahnede işaret
  // ÇIKMAZ — Tek Odak (D-080) aktif adımın işaretini tek tutar; hedefler panelde bekler.
  const goalsReady = useGame((s) => claimableGoals(goalMetricsOf(s), s.goalsClaimed).length > 0);
  // D8: aynı kural günlük görevler için — Görevler sekmesi işaretlenir, sahnede işaret çıkmaz.
  const dailyReady = useGame((s) => claimableDailyCount(s.daily, s.tables, dailyCountersOf(s)) > 0);
  // D8: oyuncu bir Usta noktasının yanında mı? Sahne katmanı yazar (yakınlık `useFrame`te ölçülür).
  const nearMaster = useGame((s) => s.nearMaster);
  const levelUp = useGame((s) => s.levelUp);
  const teklifHazir = useGame((s) => iapConfig.vitrin.baslangic && baslangicTeklifiGoster(s));
  const baslangicTeklifKapat = useGame((s) => s.baslangicTeklifKapat);
  const claimLevelUp = useGame((s) => s.claimLevelUp);
  // G-60: görev geçiş penceresi (kutlama + boşluk) — ipucular bu pencerede sıra bekler.
  const questPhase = useGame((s) => s.questPhase);
  // G-14 · K4: kapatılan Usta modali, oyuncu O NOKTADAN çıkıp yeniden basana kadar açılmaz
  // (kilit store'da — `closeMaster` · `dwell.ustaKaresi`).
  const closeMaster = useGame((s) => s.closeMaster);

  const lvl = levelProgress(xp);
  const questPct = quest && quest.total != null ? Math.min(100, ((quest.cur ?? 0) / quest.total) * 100) : null;
  // Karakter panelinden alınan görevler (tepsi/garson tepsi/garson hız) → Karakter sekmesi işaretlenir.
  const charQuestActive =
    quest?.target.type === 'charStat' || quest?.target.type === 'waiterTray' || quest?.target.type === 'waiterSpeed';
  /**
   * G-60 — EKRANI KESEN KANALLAR TEK SIRADAN GEÇER (`src/game/ekranKanali.ts`).
   * Eskiden dört kanalın ilişkisi elle yazılmış `&& !showOffline && !spotlight` zincirleriyle
   * kuruluyordu; sıra bir kural değil, dört ifadenin tesadüfi kesişimiydi. Artık HUD koşul
   * kurmuyor, "şu an hangi kanal üstte" diye soruyor — ikisinin aynı anda açılması imkânsız.
   */
  const gecisPenceresi = questInTransition({ questPhase });
  const kanal = ekranKanali({
    kafeAdiSorulacak: kafeAdi === null,
    cevrimdisiVar: offlineEarned > 0,
    ustaVar: nearMaster != null,
    panelAcik: sheet != null,
    bildirimVar: toastCizilir(notice),
    gecisPenceresi,
    bulasikOgretmeHazir: quest?.target.type === 'washDish' && !washTipSeen,
    karakterIpucuHazir: !!charQuestActive && !charPanelSeen,
    tepsiIpucuHazir: tepsiAni && !trayTipSeen,
    seviyeVar: levelUp != null,
    baslangicTeklifHazir: teklifHazir,
  });
  const teklif = kanal === 'teklif-baslangic';
  const showOffline = kanal === 'cevrimdisi';
  const bulasikOgretme = kanal === 'ogretme-bulasik';
  const spotlight = kanal === 'ipucu-karakter';
  const traySpot = kanal === 'ipucu-tepsi';

  const openChar = () => {
    markCharPanelSeen();
    setSheet('char');
  };

  // A4 (T9c): Android geri tuşu — üstteki ekranı kapatır, yoksa uygulamayı küçültür (`geriTusu`).
  // Web'de Escape aynı işi görür (dev/duman). Dinleyici bir kez bağlanır, eylem her render tazelenir.
  const geri = useRef<() => void>(() => {});
  useEffect(() => {
    geri.current = () => {
      if (adDuzenle) return setAdDuzenle(false);
      if (sifirlaSor) return setSifirlaSor(false);
      if (videoAcik) return setVideoAcik(false);
      const eylem = geriTusu(kanal, sheet != null);
      if (eylem === 'kafe-adi') kafeAdiKoy(adTaslak);
      else if (eylem === 'cevrimdisi') claimOffline();
      else if (eylem === 'usta') closeMaster();
      else if (eylem === 'panel') setSheet(null);
      else if (eylem === 'seviye') claimLevelUp();
      else if (eylem === 'ipucu') {
        if (bulasikOgretme) markWashTipSeen();
        else if (spotlight) markCharPanelSeen();
        else if (traySpot) markTrayTipSeen();
        else if (teklif) baslangicTeklifKapat();
      } else if (Capacitor.isNativePlatform()) void CapApp.minimizeApp();
    };
  });
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') geri.current(); };
    window.addEventListener('keydown', esc);
    const dinleyici = Capacitor.isNativePlatform() ? CapApp.addListener('backButton', () => geri.current()) : null;
    return () => {
      window.removeEventListener('keydown', esc);
      void dinleyici?.then((d) => d.remove());
    };
  }, []);

  // F3 geçişli C1′ (D-144): panel KAPANIŞI reklamı patlatır (soğuma dolduysa). Sekmeden sekmeye
  // geçmek kapanış değildir; kural ve soğuma `ads.ts`te.
  const oncekiSheet = useRef<Sheet>(null);
  useEffect(() => {
    const onceki = oncekiSheet.current;
    oncekiSheet.current = sheet;
    if (onceki != null && sheet == null) void panelKapandi();
  }, [sheet]);

  const onReset = () => {
    setSifirlaSor(false);
    setAdTaslak(KAFE_ADI_VARSAYILAN); // sıfırlamadan sonra ad yeniden sorulur; taslak eski adla kalmasın
    sogumaSifirla();
    setSheet(null);
    hardReset();
    // F4b: bulut yedeği de sıfırlanır — yoksa bir sonraki açılışta "daha ileri" diye geri gelirdi.
    void bulutSifirla();
  };

  return (
    <div className="hud" data-testid="hud">
      {/* ───────── ÜST ŞERİT ───────── */}
      <div className="topbar">
        <button
          className="rep"
          data-testid="level"
          title="Seviye"
          onClick={() => setSheet('goals')}
        >
          <span className="rep-medal">
            <ReputationIcon size={38} />
            <i className="rep-num" data-testid="level-num">
              {lvl.level}
            </i>
          </span>
          {/* Chip'siz şerit: çubuk madalyonun ALTINDA ve onun genişliğinde. İçindeki
              "3/8" yazısı kalktı — 10 px'lik yatağa sığmıyordu ve sayıyı madalyon taşıyor. */}
          <span className="rep-bar">
            <span className="rep-fill" style={{ width: `${Math.min(100, (lvl.cur / lvl.need) * 100)}%` }} />
          </span>
        </button>

        {/* KUTUSUZ kese (D-106): değerler doğrudan sahnenin üstünde, okunabilirliği KONTUR taşır. */}
        <div className="purse">
          <div className="cur" data-testid="wallet">
            <CoinIcon size={34} />
            <span className="cur-val">{fmt(gorunenCuzdan({ wallet, offlineEarned }))}</span>
          </div>
          <div className="cur gem" data-testid="diamonds">
            <GemIcon size={26} />
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
      <div className={`side-stack${traySpot ? ' spot-acik' : ''}`}>
        <button
          className={`round-btn${camZoomOut ? ' on' : ''}`}
          data-testid="cam-zoom"
          title={camZoomOut ? 'Yakınlaş' : 'Genel bakış'}
          onClick={toggleCamZoomOut}
        >
          <CamZoomIcon size={24} out={camZoomOut} />
        </button>
        {lvl.level >= economyConfig.xp.levelRewardFromLevel && (
          <button
            className={`round-btn tray-btn video-btn${videoKalan > 0 ? '' : ' bos'}`}
            data-testid="video-btn"
            title="Reklam izle, para kazan"
            onClick={() => setVideoAcik(true)}
          >
            <PlayAdIcon size={22} />
            {videoKalan > 0 && (
              <span className="tray-count" data-testid="video-kalan">
                {videoKalan}
              </span>
            )}
          </button>
        )}
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
          Hangi türün çizileceği burada DEĞİL, `rules.ts`teki `CIZILEN_TOAST` listesinde durur —
          görev tamamlanma toast'ının çizilmemesi bir kullanıcı kararı (G-04) ve bir kez zaten
          bir tip daralmasıyla sessizce geri alındı (f4b1a52). Olay hâlâ üretiliyor, `tick.ts`e
          DOKUNULMADI (sunum katmanı kararı, E3/D-096 deseni): devHooks anlık görüntüsü ve ona
          bağlı testler değişmedi. Ölçüm: docs/serit-raporu-g1.md §Bulgular 1. */}
      {toastCizilir(notice) && (
        <div className="notice" data-testid="notice" key={notice.text}>
          <span className="notice-badge">
            {notice.kind === 'level' ? <StarBadge size={28} /> : <BangBadge size={28} />}
          </span>
          <span className="notice-text">{notice.text}</span>
          {notice.reward != null && (
            <span className="notice-reward" data-testid="notice-reward">
              {/* TAM SAYI: oto-toplama toplamı kesirli geliyordu ve "273.3333" Türkçe okumada
                  binlik ayracı gibi görünüyordu (kullanıcı: *"273k para toplanmış gibi
                  gözüküyor"*). Para zaten kuruşsuz sunuluyor; burada da yuvarlanır. */}
              <CoinIcon size={16} />+{fmt(notice.reward)}
            </span>
          )}
        </div>
      )}

      {/* ───────── USTA MODALİ (G-14) ─────────
          D8'de bu bir alt şeritti ve bandı devralıyordu; kullanıcı 2026-09-09'da şeridi reddedip
          modal istedi. Bant artık devredilmiyor — görev adımı yerinde kalır, Usta önüne modal gelir.
          Kapatılınca oyuncu O MASADAN uzaklaşana kadar geri açılmaz (aşağıdaki effect).

          G-79 (2026-09-18) — ÇEVRİMDIŞI KAZANÇ EKRANININ ÜSTÜNE BİNMEZ. Kullanıcı: *"oyun ilk
          açıldığında yokkenki geliri görürken, o an bir usta padi üzerinde durduğu için otomatik
          ekrana direk o modal geliyor."* İki modal aynı anda açıktı çünkü Usta'nın kelepçesi
          yoktu; `spotlight` ve `traySpot` bu dosyada zaten `!showOffline` ile kelepçeliydi, desen
          Usta'ya uygulanmamıştı. Tetiğin KENDİSİ de ayrıca düzeltildi (Scene: dwell artık
          yüklemede değil, oyuncu bir kez hareket ettikten sonra dolar). */}
      {kanal === 'usta' && nearMaster && (
        <UstaModal id={nearMaster} onClose={closeMaster} />
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
            {/* G-05: üstte kısa LAKAP (bu hedefin hangi bölüm olduğu), altında NET hedef.
                Eskiden yalnız hedef vardı ve oyuncu "neredeyim"i okuyamıyordu. */}
            <span className="band-kicker">{quest.kicker}</span>
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
              <span className="band-sub" data-testid="quest-cost">
                <CoinIcon size={15} />
                {fmt(gorevTutari(quest, padFills) ?? 0)}
              </span>
            ) : (
              <span className="band-sub dim">{charQuestActive ? 'Çaycı panelinden al' : 'Hedefe git'}</span>
            )}
          </span>
          {quest.reward != null && (
            <span className="band-reward" data-testid="quest-reward">
              <CoinIcon size={14} />+{fmt(quest.reward)}
            </span>
          )}
          <span className="band-go">
            <ChevronIcon size={18} />
          </span>
        </button>
      ) : bitisGorunur ? (
        <div className="band idle">
          <span className="band-body">
            <span className="band-title">Görev hattı tamamlandı — kıraathane senin.</span>
          </span>
        </div>
      ) : (
        <GunlukBant onClick={() => setSheet('quests')} />
      )}

      {/* ───────── ALT NAV ───────── */}
      {/* B1 (T9d): ipucu açıkken alt gezinme KARARTMANIN ÜSTÜNE çıkar. Eskiden sekmenin kendi z'si
          (36) gezinmenin katmanından (13) kaçamıyordu: ilk dokunuş karartmaya gidip yalnız onu
          kapatıyor, panel ikinci dokunuşta açılıyordu. */}
      <nav className={`botnav${spotlight ? ' spot-acik' : ''}`}>
        {/* G-62: görev tamamlanınca Görevler sekmesi kendini gösterir. Bayrak kutlama
            penceresinin KENDİSİ (0,5 + 0,8 sn) — yeni bir sayaç/zamanlayıcı eklenmedi. */}
        <NavTab
          id="quests"
          label="Görevler"
          icon={<QuestListIcon size={25} />}
          active={sheet === 'quests'}
          bang={dailyReady}
          kutla={gecisPenceresi}
          onClick={() => setSheet(sheet === 'quests' ? null : 'quests')}
        />
        {/* G-81: hedef toplanabilir hâle gelince aynı farkındalık. `bang` kalıcı işarettir
            ("hâlâ var"), halka ANIN kendisidir ("az önce oldu"). */}
        <NavTab
          id="goals"
          label="Hedefler"
          icon={<TargetIcon size={25} />}
          active={sheet === 'goals'}
          bang={goalsReady}
          kutla={goalsReady}
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
          label="Çaycı"
          icon={<CharIcon size={25} />}
          active={sheet === 'char'}
          bang={charQuestActive}
          spot={spotlight}
          onClick={() => (sheet === 'char' ? setSheet(null) : openChar())}
        />
      </nav>
      {/* G-64: karartma "bir şey var" der, CÜMLE nereye ve niye dokunulacağını söyler.
          Metin görevin kendi hedefinden türer — hangi kademe isteniyorsa onu yazar, sabit
          bir cümle değil (görev hattı değişirse yönlendirme de değişir). */}
      {/* ───────── G-63 · BULAŞIK ÖĞRETME KARTI ─────────
          Kullanıcı: *"'bulaşık yıka' diyor ama öyle bir şey olmaması gerekiyor. Ona bir uyarıcı,
          bir modal tarzı bir şey de olur… 'müşteriler çay içtikten sonra masalarda kirli çay
          birikmeye başlar, bunları alıp bulaşık tezgâhına bırakman gerekiyor' … ondan sonra
          görev gelmeli"* + *"oraya birden zoom yapar ve ekranda bir yazı çıkar… bulaşığın
          görüldüğü yeri KAPATMAYACAK şekilde"*.
          Kart bu yüzden ekranın ÜST bandında: kamera tezgâha çevrildiğinde hedef kadrajın
          ortasında/altında kalır, yazı onun üstünü örtmez. Kapatınca bir daha çıkmaz (persist). */}
      {bulasikOgretme && <OgretmeBulasik onClose={markWashTipSeen} onShow={focusDish} />}
      {spotlight && <div className="spotlight-backdrop" data-testid="char-spotlight" onClick={markCharPanelSeen} />}
      {spotlight && (
        <div className="char-tip" data-testid="char-tip">
          <b>Buradan yükselt</b>
          Bu yükseltme <u>Çaycı</u> sekmesinde — dokun ve satın al.
        </div>
      )}

      {/* ───────── ALT SAYFALAR ───────── */}
      {sheet === 'quests' && <QuestsSheet onClose={() => setSheet(null)} />}
      {sheet === 'goals' && <GoalsSheet onClose={() => setSheet(null)} />}
      {sheet === 'shop' && <ShopPanel onClose={() => setSheet(null)} />}
      {sheet === 'char' && (
        <CharacterPanel
          onClose={() => setSheet(null)}
          ilkSekme={quest?.target.type === 'waiterTray' || quest?.target.type === 'waiterSpeed' ? 'waiter' : 'player'}
        />
      )}
      {sheet === 'settings' && (
        <Sheet
          title="Ayarlar"
          testid="menu"
          onClose={() => {
            setSifirlaSor(false);
            setSheet(null);
          }}
        >
          <div className="sheet-pad">
            <div className="setting-row">
              <span className="setting-label">Kafenin adı</span>
              <button
                className="kafe-adi-degistir"
                data-testid="set-kafe-adi"
                onClick={() => {
                  setAdTaslak(kafeAdi ?? KAFE_ADI_VARSAYILAN);
                  setAdDuzenle(true);
                }}
              >
                {kafeAdi ?? KAFE_ADI_VARSAYILAN}
              </button>
            </div>
            <SettingRow label="Ses" value={settings.sound} onChange={(v) => setSetting('sound', v)} testid="set-sound" />
            <SettingSlider
              label="Ses seviyesi"
              value={settings.soundVolume}
              disabled={!settings.sound}
              onChange={(v) => setSetting('soundVolume', v)}
              testid="set-sound-vol"
            />
            <SettingRow label="Müzik" value={settings.music} onChange={(v) => setSetting('music', v)} testid="set-music" />
            <SettingSlider
              label="Müzik seviyesi"
              value={settings.musicVolume}
              disabled={!settings.music}
              onChange={(v) => setSetting('musicVolume', v)}
              testid="set-music-vol"
            />
            {/* K9 (T9d · D-146): "Bildirimler" anahtarı KALKTI — hiçbir yer okumuyordu (işlevsiz anahtar
                güven kırar). Ayar kayıtta duruyor (şema değişmedi); bildirim Faz F'de gelince geri döner. */}
            {/* GÖLGELER (F2 · D-125). Varsayılan 'oto': cihaz sınıfı karar verir
                (`game/cihazSinifi.ts`). Anahtara DOKUNULDUĞU an tercih açık hâle gelir ve
                ölçümü ezer — güçlü telefonda kapatmak da, zayıfta açık tutmak da oyuncunun
                hakkı. Gölge D-073'te kullanıcı tarafından özellikle geri istendi, o yüzden
                burada kapatılabilir ama varsayılan olarak kapatılmaz. */}
            <SettingRow
              label="Gölgeler"
              value={golgeAcikMi(settings.golge, cihazSinifiOku())}
              onChange={(v) => setSetting('golge', v ? 'acik' : 'kapali')}
              testid="set-golge"
            />
            {/* E3 (S23 · D-120): ekranın altındaki 525 px'lik ölü alan İÇERİKLE kapanıyor.
                Ölçüm: içerik 782 px'lik gövdenin yalnız %31'ini dolduruyordu — beş ekranın
                en boşu buydu. Seçilmeyen kol E2 idi (satırlar ekrana yayılsın): doluluk
                sayısını %100 yapardı ama dört anahtarı devleştirirdi, yani boşluğu içerik
                değil hava doldururdu.

                KÜNYE bu ekrana ait: kayıt bu cihazda duruyor (backend yok), şema sürümü
                migrasyonun sözleşmesi ve sayaçlar oyuncunun kendi geçmişi. Ayrıca yıkıcı
                düğme artık anahtarların DİBİNDE değil ekranın sonunda — eskiden "FPS Sayacı"
                ile "Oyunu Sıfırla" arasında bir parmak boşluk vardı. */}
            <div className="sheet-sec">KÜNYE</div>
            <div className="kunye" data-testid="kunye">
              <div><span>Kayıt şeması</span><b>v{SAVE_VERSION}</b></div>
              <div><span>Toplam kazanç</span><b>{fmt(lifetime)} ₺</b></div>
              <div><span>Servis edilen çay</span><b>{fmt(stats.teasServed + stats.waiterServed)}</b></div>
              <div><span>Yıkanan bulaşık</span><b>{fmt(stats.dishesWashed)}</b></div>
              <div><span>Açılan nokta</span><b>{padsDone.length}</b></div>
            </div>
            <PlayGamesBolumu />
            <GeriYukle />
            <div className="sheet-foot-note">
              Kayıt bu cihazda tutulur; Play Games'e bağlıysan buluta da yedeklenir. Oyunu sıfırlarsan geri alınamaz.
            </div>
            <button className="danger-btn" data-testid="reset" onClick={() => setSifirlaSor(true)}>
              <ResetIcon size={17} /> Oyunu sıfırla
            </button>
            {sifirlaSor && (
              <div className="modal-backdrop" data-testid="reset-confirm" onClick={() => setSifirlaSor(false)}>
                <div className="modal-card reward-card" onClick={(e) => e.stopPropagation()}>
                  <div className="reward-title">Oyunu sıfırla?</div>
                  <p className="onay-metin">Tüm ilerleme silinecek (bulut yedeği dahil). Geri alınamaz.</p>
                  <button className="danger-btn" data-testid="reset-yes" onClick={onReset}>
                    <ResetIcon size={17} /> Evet, sıfırla
                  </button>
                  <button className="sheet-cta" data-testid="reset-no" onClick={() => setSifirlaSor(false)}>
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
          </div>
        </Sheet>
      )}

      {/* ───────── SEVİYE ATLAMA (D-142 · G-66/G-67) — ortak ödül ekranı ───────── */}
      {kanal === 'seviye' && levelUp && (
        <RewardModal
          testid="level-up"
          title={`Seviye ${levelUp.level}!`}
          amount={levelUp.amount}
          bonus={levelUp.carryAfter - levelUp.carryBefore}
          bonusBefore={levelUp.carryBefore}
          bonusLabel="Servis hızı"
          onClaim={() => claimLevelUp()}
          onIzle={() => claimLevelUp(true)}
          claimTestid="level-up-ok"
        />
      )}

      {teklif && <BaslangicTeklifi onClose={baslangicTeklifKapat} />}

      {videoAcik && <VideoKarti onClose={() => setVideoAcik(false)} />}

      {(kanal === 'kafe-adi' || adDuzenle) && (
        <KafeAdiKutusu
          kip={adDuzenle ? 'duzenle' : 'ilk'}
          taslak={adTaslak}
          onTaslak={setAdTaslak}
          onKaydet={() => {
            kafeAdiKoy(adTaslak);
            setAdDuzenle(false);
          }}
          onVazgec={() => setAdDuzenle(false)}
        />
      )}

      {/* ───────── OFFLINE KAZANÇ (ortak ödül ekranı kalıbı) ───────── */}
      {showOffline && (
        <RewardModal
          testid="offline"
          title="Sen yokken kıraathane çalıştı"
          amount={Math.floor(offlineEarned)}
          onClaim={() => claimOffline()}
          onIzle={offlineIzleEki > 0 ? () => claimOffline(true) : undefined}
          izleEtiket={`İzle, +${fmt(offlineIzleEki)}`}
          claimTestid="offline-ok"
        />
      )}
    </div>
  );
}

/**
 * K1 (T9d · D-146) — HAT SONU: ALT BANTTA GÜNLÜK GÖREV. Hat bitince bant kalkıyordu ve oyuncuya
 * hiçbir yön kalmıyordu (T9b B3). Artık kutlama bandının (5 sn) yerini günün İLK bitmemiş görevi
 * alır; toplanabilir olan öne geçer. Üçü de alınınca "yenileri yarın". Dokununca Görevler açılır —
 * sahnede işaret YOK (D8 kuralı: günlük görev panelde bekler, Tek Odak'ı bölmez).
 * Kat 2 gelince hat yeniden uzar ve bant görev adımına döner.
 */
function GunlukBant({ onClick }: { onClick: () => void }) {
  const stats = useGame((s) => s.stats);
  const lifetime = useGame((s) => s.lifetime);
  const tables = useGame((s) => s.tables);
  const daily = useGame((s) => s.daily);
  const gunler = dailyViews(daily, tables, dailyCountersOf({ stats, lifetime }));
  const g = gunler.find((x) => x.state === 'claimable') ?? gunler.find((x) => x.state !== 'claimed');
  if (!g) {
    return (
      <button className="band done" data-testid="daily-band" data-state="bitti" onClick={onClick}>
        <span className="band-photo">
          <CheckBadge size={26} />
        </span>
        <span className="band-body">
          <span className="band-kicker">BUGÜN</span>
          <span className="band-title">Bugünkü görevleri tamamladın — yenileri yarın</span>
        </span>
      </button>
    );
  }
  const hazir = g.state === 'claimable';
  return (
    <button className={`band${hazir ? ' done' : ''}`} data-testid="daily-band" data-state={g.state} onClick={onClick}>
      <span className="band-photo">{hazir ? <CheckBadge size={26} /> : <QuestListIcon size={30} />}</span>
      <span className="band-body">
        <span className="band-kicker">GÜNLÜK GÖREV</span>
        <span className="band-title">{g.label}</span>
        {hazir ? (
          <span className="band-sub done-sub">Ödülünü al</span>
        ) : (
          <span className="band-track">
            <span className="band-fill" style={{ width: `${Math.min(100, (g.cur / g.target) * 100)}%` }} />
            <span className="band-count">
              {fmt(g.cur)}/{fmt(g.target)}
            </span>
          </span>
        )}
      </span>
      <span className="band-reward">
        <GemIcon size={14} />+{g.diamonds}
      </span>
      <span className="band-go">
        <ChevronIcon size={18} />
      </span>
    </button>
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
  kutla,
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
  /**
   * G-62 — BİR KEZ ÇALAN KUTLAMA HALKASI. `spot`tan farkı süre değil NİYET: `spot` sürekli nabız
   * atan bir TALİMATTIR (oyuncu oraya gitmeli), bu kısa bir FARKINDALIKtır (oyuncu isterse bakar).
   * Zamanlayıcı YOK: halka `animation-iteration-count: 2` ile iki kez çalıp durur, yani bayrak
   * açık kalsa bile efekt birikmez. Bayrak da zaten var olan bir durumdan türer (kutlama
   * penceresi / hazır ödül) — HUD yeni bir durum taşımaz.
   */
  kutla?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`navtab${active ? ' active' : ''}${spot ? ' spot' : ''}${kutla ? ' kutla' : ''}`}
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
/**
 * G-63 — BULAŞIK DÖNGÜSÜNÜN ÖĞRETME KARTI (2026-09-18).
 *
 * NEDEN MODAL DEĞİL, ÜST BANT: kullanıcı iki şeyi aynı cümlede istedi — *"oraya birden zoom
 * yapar ve ekranda bir yazı çıkar"* AMA *"bulaşığın görüldüğü yeri kapatmayacak şekilde"*.
 * Ortada duran bir modal kamerayı çevirmenin anlamını yok ederdi: gösterilen şeyin üstüne
 * perde çekmiş olurduk. Kart ekranın üst bandında durur, kamera hedefi alt-orta kadrajda bırakır.
 *
 * NEDEN BİR KEZ: `washTipSeen` kayıtta (additive alan, `trayTipSeen` deseni). Öğretme bir
 * DURUM değil bir AN — ikinci kez görülürse gürültü olur.
 *
 * SIRA: `ekranKanali` bunu ipucuların ÖNÜNE koyar ama kutlama/bildirim penceresinin ARKASINA —
 * yani "görev bitti → kutlama → kart → görev" sırası kullanıcının tarif ettiği gibi akar.
 */
function OgretmeBulasik({ onClose, onShow }: { onClose: () => void; onShow: () => void }) {
  // Kamera yalnız kart AÇILIRKEN bir kez çevrilir; her render'da değil.
  useEffect(() => {
    onShow();
    // `onShow` store eylemi (kimliği sabit) — bağımlılık listesi bilerek boş: "açılışta bir kez".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="ogretme" data-testid="ogretme-bulasik">
      <span className="ogretme-ikon">
        <BasinIcon size={30} />
      </span>
      <span className="ogretme-body">
        <b>Bulaşık biriyor</b>
        <span>
          Müşteriler çayını içince masada <u>kirli bardak</u> bırakır. Onları topla ve
          bulaşık tezgâhına götür — yıkanan bardaklar temiz rafa döner.
        </span>
      </span>
      <button className="ogretme-ok" data-testid="ogretme-ok" onClick={onClose}>
        Anladım
      </button>
    </div>
  );
}

/**
 * G-57 VİDEO HAKKI (F3b · D-150, kol V60). `rewarded.video.periodSec`te `rights` video; her video
 * son `incomeSec` saniyenin ₺'si — sabit ₺ geç oyunda eriyordu (`odullu-raporu-f3b` §1). Pencere
 * ilk izlemede başlar. Tamamen isteğe bağlı: kapatınca hiçbir şey kaybedilmez.
 */
function VideoKarti({ onClose }: { onClose: () => void }) {
  const claimVideo = useGame((s) => s.claimVideo);
  const kalan = useGame((s) => videoRights(s.reklam, Date.now()).kalan);
  const yenilenmeMs = useGame((s) => videoRights(s.reklam, Date.now()).yenilenmeMs);
  const odul = useGame((s) => videoReward(s.gelirIzi, s.lifetime.toNumber()));
  const hazir = useOdulluHazir();
  const [izleniyor, setIzleniyor] = useState(false);
  const toplam = economyConfig.rewarded.video.rights;
  const izle = async () => {
    if (izleniyor) return;
    setIzleniyor(true);
    if (await odulluIzle()) claimVideo();
    setIzleniyor(false);
  };
  const dk = Math.ceil(yenilenmeMs / 60000);
  const sure = dk >= 60 ? `${Math.floor(dk / 60)} sa ${dk % 60} dk` : `${dk} dk`;
  return (
    <div className="usta-backdrop" data-testid="video-kart" onClick={onClose}>
      <div className="usta-card" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-x usta-x" onClick={onClose} aria-label="Kapat">
          <CloseIcon size={16} />
        </button>
        <span className="usta-badge">
          <CoinIcon size={34} />
        </span>
        <span className="usta-head">+{fmt(odul)}</span>
        <span className="usta-note">Bir reklam izle, son dakikada kazandığın kadar para al</span>
        <div className="usta-acts">
          <button
            className={`master-buy ad${hazir && kalan > 0 && odul > 0 && !izleniyor ? '' : ' off'}`}
            data-testid="video-izle"
            disabled={!hazir || kalan <= 0 || odul <= 0 || izleniyor}
            onClick={izle}
          >
            <PlayAdIcon size={15} />
            İzle
          </button>
        </div>
        <span className="usta-note" data-testid="video-not">
          {kalan <= 0
            ? `Yeni haklar ${sure} sonra`
            : odul <= 0
              ? 'Önce biraz servis yap — ödül son dakikanın kazancı'
              : `Kalan hak: ${kalan}/${toplam}`}
        </span>
      </div>
    </div>
  );
}

function UstaModal({ id, onClose }: { id: string; onClose: () => void }) {
  const diamonds = useGame((s) => s.diamonds);
  const buyMaster = useGame((s) => s.buyMaster);
  const buyMasterAd = useGame((s) => s.buyMasterAd);
  // F3b (D-150): 1 video = 1 Usta, günde `rewarded.masterPerDay`. Hak bittiyse düğme pasif, not yarını söyler.
  const reklamHakki = useGame((s) => masterAdsLeft(s.reklam, dayIndex(Date.now())));
  const hazir = useOdulluHazir();
  const [izleniyor, setIzleniyor] = useState(false);
  const izle = async () => {
    if (izleniyor) return;
    setIzleniyor(true);
    if (await odulluIzle()) buyMasterAd(id);
    setIzleniyor(false);
  };
  const izlenebilir = hazir && reklamHakki > 0 && !izleniyor;
  const fiyat = masterCost();
  const yeter = diamonds.toNumber() >= fiyat;
  const masaNo = Number(id.split(':')[1] ?? 0) + 1;
  const kat = economyConfig.master.tipMult.toLocaleString('tr-TR');
  return (
    <div className="usta-backdrop" data-testid="master-bar" data-master={id} onClick={onClose}>
      <div className="usta-card" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-x usta-x" onClick={onClose} aria-label="Kapat">
          <CloseIcon size={16} />
        </button>
        <span className="usta-badge">
          <GemIcon size={34} />
        </span>
        <span className="usta-head">Masa {masaNo} · Usta</span>
        <span className="usta-note">Bu masanın bahşişi kalıcı olarak ×{kat} olur</span>
        <div className="usta-acts">
          <button
            className={`master-buy${yeter ? '' : ' off'}`}
            data-testid="master-buy"
            disabled={!yeter}
            onClick={() => buyMaster(id)}
          >
            <GemIcon size={16} />
            {fiyat}
          </button>
          <button
            className={`master-buy ad${izlenebilir ? '' : ' off'}`}
            data-testid="master-ad"
            disabled={!izlenebilir}
            onClick={izle}
          >
            <PlayAdIcon size={15} />
            İzle
          </button>
        </div>
        {reklamHakki <= 0 && (
          <span className="usta-note" data-testid="master-ad-yarin">
            Reklamla Usta yarın yeniden
          </span>
        )}
        {!yeter && (
          <span className="eksik" data-testid="eksik">
            <GemIcon size={12} />
            {fmt(fiyat - Math.floor(diamonds.toNumber()))} eksik
          </span>
        )}
      </div>
    </div>
  );
}

/** Reklamları Kaldır'ın günlük 💎'ı (D-040) — günlük görevlerin altında, her gün elle alınır. */
function ReklamsizHediye() {
  const reklamsiz = useGame((s) => s.satin.reklamsiz);
  const hazir = useGame((s) => adFreeDailyReady(s.satin, dayIndex(Date.now())));
  const claimAdFreeDaily = useGame((s) => s.claimAdFreeDaily);
  if (!reklamsiz) return null;
  const odul = economyConfig.iap.removeAdsDiamondsPerDay;
  return (
    <ul className="goals">
      <li
        className={`goal${hazir ? ' ready' : ' full'}`}
        data-testid="reklamsiz-hediye"
        data-state={hazir ? 'claimable' : 'claimed'}
      >
        <span className="goal-top">
          <b>Reklamsız paket hediyesi</b>
        </span>
        <span className="goal-foot">
          <span className="goal-note">{hazir ? 'Her gün yenilenir' : 'Bugün alındı'}</span>
          {hazir ? (
            <button className="goal-claim" data-testid="reklamsiz-hediye-al" onClick={() => claimAdFreeDaily()}>
              Al · {odul} <GemIcon size={13} />
            </button>
          ) : (
            <span className="goal-reward">
              <GemIcon size={13} />
              {odul}
            </span>
          )}
        </span>
      </li>
    </ul>
  );
}

function QuestsSheet({ onClose }: { onClose: () => void }) {
  const questIndex = useGame((s) => s.questIndex);
  const quest = useGame((s) => s.quest);
  const focusQuest = useGame((s) => s.focusQuest);
  const padFills = useGame((s) => s.padFills);
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
                {fmt(g.cur)}
                <i>/{fmt(g.target)}</i>
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
      <ReklamsizHediye />
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
            odulAlindi();
            setGunOdul(null);
          }}
          onIzle={() => {
            claimDailyQuest(gunOdul.id, true);
            odulAlindi();
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
            <span className="qbig-kicker">{quest.kicker}</span>
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
                {fmt(gorevTutari(quest, padFills) ?? 0)}
              </span>
            ) : null}
          </span>
          {quest.reward != null && (
            <span className="qbig-reward">
              <CoinIcon size={16} />+{fmt(quest.reward)}
            </span>
          )}
        </button>
      ) : (
        <div className="sheet-empty">Görev hattı tamamlandı — kıraathane senin.</div>
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
                      <CoinIcon size={13} />+{fmt(q.reward)}
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

  // G-81: ödülü hazır kategoriler listenin ÜSTÜNDE (gerekçe `goals.ts`).
  const goals = goalViewsForPanel(metrics, goalsClaimed);
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
          <b>Seviye {lvl.level}</b>
          <span className="rep-bar wide">
            <span className="rep-fill" style={{ width: `${Math.min(100, (lvl.cur / lvl.need) * 100)}%` }} />
            <span className="rep-text">
              {lvl.cur}/{lvl.need}
            </span>
          </span>
          <small>
            Her hedef seviyeni yükseltir · seviye bonusu{' '}
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
              : 'Masayı para tavanına çıkarınca Usta noktası açılır'}
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
                  {fmt(g.cur)}
                  <i>/{fmt(g.target)}</i>
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
          bonusBefore={bonus}
          diamonds={odul.diamonds}
          claimTestid="goal-reward-ok"
          onClaim={() => {
            claimGoal(odul.id);
            odulAlindi();
            setOdul(null);
          }}
        />
      )}
    </Sheet>
  );
}

/** Ödüllü reklam şu an gösterilebilir mi (F3 · `ads.ts`) — hazır olunca düğmeler kendiliğinden açılır. */
function useOdulluHazir(): boolean {
  return useSyncExternalStore(reklamAbone, odulluReklamHazir);
}

/** ORTAK ÖDÜL EKRANI (plan §9): başlık · ödül · [Al] · [▶ İzle, 2× al].
 *  Reklam hazır değilse ikinci buton pasif görünür ama KAYBOLMAZ (D-039 kalıbı). */
/**
 * BAŞLANGIÇ PAKETİ TEKLİFİ (F4c · D-152 açık kalemi) — ilk Usta'dan sonra BİR KEZ. Paketin içi
 * ekranda: 💎 miktarı + kurucu kıyafeti oyuncunun kendi karakterinde. Geri sayım, "son fırsat",
 * indirim baskısı YOK (monetization.md §2); "Şimdi değil" eşit ağırlıkta, paket Mağaza'da durur.
 */
function BaslangicTeklifi({ onClose }: { onClose: () => void }) {
  useSyncExternalStore(satinAlmaAbone, satinAlmaSurumu);
  const satinAlimIsle = useGame((s) => s.satinAlimIsle);
  const trayLook = useGame((s) => s.trayLook);
  const urun = iapConfig.urun.baslangic;
  const fiyat = urunFiyati(urun);
  const [bekle, setBekle] = useState(false);
  const al = async () => {
    setBekle(true);
    const r = await satinAl(urun);
    if (r) satinAlimIsle(r);
    setBekle(false);
    if (r) onClose();
  };
  return (
    <div className="modal-backdrop" data-testid="baslangic-teklif">
      <div className="modal-card reward-card teklif-card">
        <div className="reward-title">Başlangıç Paketi</div>
        <SahipOnizleme kiyafet="kurucu" tepsi={trayLook} />
        <div className="teklif-icerik">
          <span className="odul-sat">
            <GemIcon size={24} /> {economyConfig.iap.starterDiamonds}
          </span>
          <span className="teklif-not">+ Kurucu kıyafeti: bordo yelek ve fes. Yalnız bu pakette.</span>
        </div>
        <button className="sheet-cta" data-testid="teklif-al" disabled={!fiyat || bekle} onClick={() => void al()}>
          {fiyat ?? 'Mağaza hazır değil'}
        </button>
        <button className="sheet-cta ad" data-testid="teklif-kapat" onClick={onClose}>
          Şimdi değil
        </button>
      </div>
    </div>
  );
}

function RewardModal({
  testid,
  title,
  amount,
  diamonds = 0,
  bonus = 0,
  bonusBefore = 0,
  bonusLabel = 'Kalıcı gelir',
  onClaim,
  claimTestid,
  onIzle,
  izleEtiket,
}: {
  testid: string;
  title: string;
  amount: number;
  /** 💎 ödülü (D3: hedefler iki para birimi verir; offline yalnız ₺ verdiği için varsayılan 0). */
  diamonds?: number;
  /** KALICI gelir artışı (oran; D-090). Offline ekranı ₺ verir → varsayılan 0, o ekran değişmedi. */
  bonus?: number;
  /** Ödül ALINMADAN ÖNCEKİ toplam koleksiyon bonusu (oran). K3 satırı "%3,2 → %3,6" yazabilsin
   *  diye gerekiyor: ekran artışı değil STAT'IN GEÇİŞİNİ gösteriyor (D-128). */
  bonusBefore?: number;
  /** Stat satırının adı — hedefler "Kalıcı gelir", seviye ekranı "Servis hızı" (D-142). */
  bonusLabel?: string;
  onClaim: () => void;
  claimTestid: string;
  /** Ödüllü video izlendi → katlı ödül. "Al"dan AYRI yol (F3 §D: düğme eskiden `onClaim`i çağırıp
   *  "2× al" deyip 1× veriyordu). VERİLMEZSE düğme yok (D-150: hedef ekranı · tavandaki çevrimdışı);
   *  verilir ama reklam hazır değilse pasif çizilir, kaybolmaz (D-039 kalıbı). */
  onIzle?: () => void;
  /** Düğme metni — çevrimdışında tavan eki 2×'ten az olabilir, o yüzden "+X" yazar. */
  izleEtiket?: string;
}) {
  const hazir = useOdulluHazir();
  const [izleniyor, setIzleniyor] = useState(false);
  const izle = async () => {
    if (!onIzle || izleniyor) return;
    setIzleniyor(true);
    // Ödül YALNIZ video sonuna dek izlendiyse verilir; yarıda kalırsa ekran açık kalır, "Al" durur.
    if (await odulluIzle()) onIzle();
    else setIzleniyor(false);
  };
  /** Ödül SATIRLARI — her ödül kendi elemanı. Liste burada kuruluyor ki "+" ayıracı ancak
   *  GERÇEKTEN iki ödül varken çizilsin (tek ödüllü offline ekranı sarkık bir artı taşımasın). */
  const satirlar: { key: string; icerik: React.ReactNode; ikiKat?: boolean }[] = [];
  if (amount > 0) {
    satirlar.push({
      key: 'para',
      icerik: (
        <>
          <CoinIcon size={30} /> +{fmt(amount)}
        </>
      ),
    });
  }
  if (bonus > 0) {
    /* K3 (R3 · D-128) — DELTA DEĞİL, STAT'IN KENDİSİ. Eski satır "🪙 +%0,4 kalıcı gelir"
       beş işareti üst üste bindiriyordu (ikon · + · % · ondalık · iki kelime) ve kullanıcı
       *"çok fazla işaret var"* dedi. Ama asıl sorun işaret sayısı değil SAYININ CILIZLIĞIYDI:
       %0,4 tek başına hiçbir şey hissettirmiyor. Referanslar da bunu söylüyor — Idle Miner
       "Double Cash forever", Idle Restaurant "%30 Profit Boost": sayı kütleli, kelime gündelik.
       Bizim sayımızı kütleleştirmenin yolu toplamı göstermek: oyuncu %3,2 → %3,6 geçişini
       görünce %0,4'ün nereye gittiğini sormuyor. İkon da kalktı (kullanıcı: *"ikon çok karmaşa
       oluşturuyormuş"*); "gelir" kelimesi zaten parayı söylüyor. */
    satirlar.push({
      key: 'bonus',
      ikiKat: true,
      icerik: (
        <>
          <span className="odul-etiket">{bonusLabel}</span>
          <span className="odul-gecis">
            <span className="odul-eski">{oranYuzde(bonusBefore)}</span>
            {/* Ok bir GLİF değil çizim (B6): "→" karakteri ikonun yerine oturmaz. */}
            <span className="odul-ok">
              <ChevronIcon size={17} />
            </span>
            {oranYuzde(bonusBefore + bonus)}
          </span>
        </>
      ),
    });
  }
  if (diamonds > 0) {
    satirlar.push({
      key: 'elmas',
      icerik: (
        <>
          <GemIcon size={30} /> +{diamonds}
        </>
      ),
    });
  }

  /* K3 (T9d · D-146): ikiye katlanacak bir ödül yoksa (Sv 2-4: yalnız servis hızı) "Al" + "İzle, 2×"
     boş bir vaatti — 0 ₺'nin iki katı. O ekran kazanılanı BÜYÜK gösterir ve tek "Harika!" ile kapanır.
     ₺ EKLENMEDİ: Sv 5 kapısı ölçülü (`zincir-raporu-t8a` Bulgu 8). */
  const katlanir = amount > 0 || diamonds > 0;
  const tekSatir = satirlar.length === 1;

  return (
    <div className="modal-backdrop" data-testid={testid}>
      <div className="modal-card reward-card">
        <div className="reward-glow" />
        <div className="reward-title">{title}</div>
        {/* C1 (R3 · D-128): ÖDÜLLER ALT ALTA, ARALARINDA "+". Eskiden üç ödül de aynı metin
            akışındaydı — `.reward-amount`ın doğrudan çocukları svg + metin + svg + metin'di,
            yani ödül diye bir ELEMAN yoktu. Ölçüm bunu sayıya çevirdi: satır kartın iç eninin
            %98'ini dolduruyordu (266,0 / 272,0 → kalan pay 6 px) ve iki ödülü ayıran en büyük
            boşluk 9,58 px'ti — bir ödülün KENDİ parçalarını ayıran 9 px `gap` ile aynı. Göz iki
            ödülü tek uzun cümle olarak okuyordu. Her ödül artık kendi satırı; "+" ikisini
            toplama işareti olarak bağlar. */}
        <div className="reward-amount">
          {satirlar.map((satir, i) => [
            i > 0 ? (
              <span className="odul-arti" key={`${satir.key}-arti`}>
                +
              </span>
            ) : null,
            <span className={`odul-sat${satir.ikiKat ? ' iki-kat' : ''}${tekSatir && satir.ikiKat ? ' tek' : ''}`} key={satir.key}>
              {satir.icerik}
            </span>,
          ])}
        </div>
        <button className="sheet-cta" data-testid={claimTestid} onClick={onClaim}>
          {katlanir ? 'Al' : 'Harika!'}
        </button>
        {katlanir && onIzle && (
          <button
            className={`sheet-cta ad${hazir && !izleniyor ? '' : ' off'}`}
            data-testid={`${testid}-izle`}
            disabled={!hazir || izleniyor}
            onClick={izle}
          >
            <PlayAdIcon size={18} /> {izleEtiket ?? `İzle, ${economyConfig.rewarded.claimMult}× al`}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * DEKOR MAĞAZASI — M2 düzeni (D-106, S12).
 *
 * **Neden M1 ızgara elendi:** ölçüm ürün önizlemesini ~74 px saydı; oyuncu satın aldığı şeyi
 * göremiyordu. M2 bunu 230 px'e çıkarıyor (3,1×) ve bedeli dürüst: ekranda tek seferde tek ürün.
 *
 * Ekranın sırası SABİT ve üç sekmede de aynı: sekme → **vitrin** → (zemin/duvarda salon şeridi)
 * → **seçim şeridi** → ad + fiyat satırı → **tek büyük satın alma**. Alma eylemi artık tek
 * yerde; eskiden üç ayrı önizleme bileşeninin içindeydi ve hangi düğmenin neyi aldığı ekrandan
 * okunmuyordu. Salon seçimi de bir SEÇİM oldu — üç salon üç ayrı satın alma düğmesi değil.
 */
/**
 * PAKETLER (F4a · D-152) — gerçek parayla satılanlar. Fiyat mağazanın yerel metni ("49,99 ₺"); fiyatı
 * bilinmeyen ürün satılmaz. Geri sayım, "son fırsat", indirim baskısı YOK (monetization.md §2).
 * Başlangıç paketi ve elmas paketleri `iapConfig.vitrin` açılana dek görünmez.
 */
function Paketler() {
  useSyncExternalStore(satinAlmaAbone, satinAlmaSurumu);
  const satin = useGame((s) => s.satin);
  const satinAlimIsle = useGame((s) => s.satinAlimIsle);
  const U = iapConfig.urun;
  const P = economyConfig.iap;
  const al = async (urun: string) => {
    const r = await satinAl(urun);
    if (r) satinAlimIsle(r);
  };
  const kart = (urun: string, ad: string, not: string, odul: number | null, sahip: boolean) => {
    const fiyat = urunFiyati(urun);
    return (
      <li className={`goal${sahip ? ' full' : ''}`} key={urun} data-testid={`paket-${urun}`}>
        <span className="goal-top">
          <b>{ad}</b>
          {odul != null && (
            <span className="goal-reward">
              <GemIcon size={13} />
              {odul}
            </span>
          )}
        </span>
        <span className="goal-foot">
          <span className="goal-note">{not}</span>
          <button
            className="goal-claim"
            data-testid={`paket-al-${urun}`}
            disabled={sahip || !fiyat}
            onClick={() => void al(urun)}
          >
            {sahip ? 'Sahipsin' : (fiyat ?? 'Mağaza hazır değil')}
          </button>
        </span>
      </li>
    );
  };
  return (
    <div className="paketler" data-testid="shop-paketler">
      <ul className="goals">
        {kart(
          U.reklamsiz,
          'Reklamları Kaldır',
          `Geçiş reklamları kalkar, ödüllü videolar isteğe bağlı kalır. Her gün +${P.removeAdsDiamondsPerDay} elmas.`,
          null,
          satin.reklamsiz,
        )}
        {iapConfig.vitrin.baslangic &&
          kart(U.baslangic, 'Başlangıç Paketi', 'Bir kez alınır: elmas + yalnız bu pakette olan görünüm.',
            P.starterDiamonds, satin.baslangic)}
        {iapConfig.vitrin.elmas &&
          U.elmas.map((u, i) => kart(u, 'Elmas', 'İstediğin kadar alınır.', P.diamondPacks[i] ?? 0, false))}
      </ul>
      <div className="sheet-foot-note">
        Fiyatlar mağazanın para biriminde. Satın alımların Google hesabına bağlıdır, Ayarlar'dan geri yüklenir.
      </div>
    </div>
  );
}

type Sekme = VitrinTuru | 'table' | 'floor' | 'wall' | 'paket';
/** 💎 ile alınan sekmeler üst satırda (F4c-2) — ₺ sekmeleriyle karışmasın. */
const ELMAS_SEKME: readonly Sekme[] = ['outfit', 'tray', 'decor', 'paket'];

function ShopPanel({ onClose }: { onClose: () => void }) {
  const areasOpen = useGame((s) => s.areasOpen);
  const tables = useGame((s) => s.tables);
  const tableLevels = useGame((s) => s.tableLevels);
  const floorThemeByArea = useGame((s) => s.floorThemeByArea);
  const wallThemeByArea = useGame((s) => s.wallThemeByArea);
  const tableTheme = useGame((s) => s.tableTheme);
  const ownedCosmetics = useGame((s) => s.ownedCosmetics);
  const wallet = useGame((s) => s.wallet);
  const buyCosmetic = useGame((s) => s.buyCosmetic);
  const diamonds = useGame((s) => s.diamonds);
  const outfit = useGame((s) => s.outfit);
  const trayLook = useGame((s) => s.trayLook);
  const satinBaslangic = useGame((s) => s.satin.baslangic);
  const buyGemCosmetic = useGame((s) => s.buyGemCosmetic);
  const dekor = useGame((s) => s.dekor);
  // Masa teması kilidi: 3 salon + tüm açık masalar max (kullanıcı kararı). Kilitliyse Masa sekmesi
  // satın alma yerine koşulu açıklayan kilit panelini gösterir.
  const tableUnlocked = tableThemeUnlocked({ areasOpen, tables, tableLevels });
  /**
   * MAĞAZA SATILACAK BİR ŞEYİN ÜSTÜNDE AÇILIR (E3 · S23 · D-120).
   *
   * Ölçüm mağazayı beş ekranın en boşlarından biri buldu: dikey doluluk %55, altta 342 px ölü
   * alan, içinde 224 px'lik bir delik. Sebep ekranın içeriksiz olması DEĞİLDİ — ekran her
   * açılışta `table` sekmesinde açılıyor ve o sekme erken oyunda KİLİTLİ, yani oyuncu
   * mağazayı açtığında satın alınabilir hiçbir şey görmüyordu. Kilitli sekme duruyor
   * (koşulu anlatması gerekiyor), yalnız varsayılan sekme satılabilir olana kayıyor.
   */
  // F4c: mağaza 💎 vitrininde (Kıyafet) açılır — orası oyunun HER anında satılabilir bir şey gösterir.
  const [tab, setTab] = useState<Sekme>('outfit');
  // Zemin/duvar salon-başı satılır: hangi salona bakıldığı bir SEÇİM, ayrı bir satın alma değil.
  const [zone, setZone] = useState(0);
  const maxedTables = tableLevels.slice(0, tables).filter((l) => l >= tableSoftMaxLevel()).length;
  // Sekme başına ÖNİZLENEN çeşit (vitrin bunu gösterir). Varsayılan = o an uygulanmış tema.
  const [sel, setSel] = useState<{ outfit: string; tray: string; decor: string; table: string; floor: string; wall: string }>(() => ({
    outfit,
    tray: trayLook,
    decor: Object.values(dekor)[0] ?? economyConfig.cosmetics.decor[0].id,
    table: tableTheme,
    floor: floorThemeByArea[0] ?? economyConfig.cosmetics.floorThemes[0].id,
    wall: wallThemeByArea[0] ?? economyConfig.cosmetics.wallThemes[0].id,
  }));

  const TABS: { k: Sekme; label: string }[] = [
    { k: 'outfit', label: 'Kıyafet' },
    { k: 'tray', label: 'Tepsi' },
    { k: 'decor', label: 'Dekor' },
    { k: 'paket', label: 'Paketler' },
    { k: 'table', label: 'Masa' },
    { k: 'floor', label: 'Zemin' },
    { k: 'wall', label: 'Duvar' },
  ];

  const kilitli = tab === 'table' && !tableUnlocked;
  const zn = Math.min(zone, Math.max(0, areasOpen - 1));

  // Seçili çeşidin künyesi — üç sekmenin ORTAK dili (ad · fiyat · sahip mi · uygulanmış mı).
  // Tek yerde çözülüyor ki ad satırı ile satın alma düğmesi asla ayrı şey söylemesin.
  const secili = (() => {
    if (tab === 'paket') return null;
    const id = sel[tab];
    if (tab === 'outfit' || tab === 'tray' || tab === 'decor') {
      const u = vitrinUrunu(tab, id);
      if (!u) return null;
      const durum = { ownedCosmetics, satin: { baslangic: satinBaslangic } };
      const owned = vitrinSahip(durum, tab, id);
      const uygulanan = tab === 'outfit' ? outfit : tab === 'tray' ? trayLook : u.yuva ? dekor[u.yuva] : undefined;
      return {
        id,
        label: u.label,
        cost: u.diamonds,
        owned,
        applied: uygulanan === id && owned,
        alan: 0,
        elmas: true,
        paket: u.paket,
        // Dekor yuvasının salonu açılmadan vitrinde kilitli durur (kullanıcı kararı, D-155).
        kilitSalon: tab === 'decor' && !dekorAcik(id, areasOpen) ? dekorSalonu(id) : 0,
      };
    }
    if (tab === 'table') {
      const t = economyConfig.cosmetics.tableThemes.find((x) => x.id === id);
      if (!t) return null;
      const owned = t.cost === 0 || ownedCosmetics.includes(`table:${id}`);
      return { id, label: t.label, cost: t.cost, owned, applied: tableTheme === id, alan: 0 };
    }
    const themes = tab === 'floor' ? economyConfig.cosmetics.floorThemes : economyConfig.cosmetics.wallThemes;
    const t = themes.find((x) => x.id === id);
    if (!t) return null;
    const applied = (tab === 'floor' ? floorThemeByArea : wallThemeByArea)[zn] === id;
    const owned = t.cost === 0 || ownedCosmetics.includes(`${tab}:${id}:z${zn}`);
    return { id, label: t.label, cost: t.cost, owned, applied, alan: zn };
  })();
  const elmasli = !!secili && 'elmas' in secili;
  const paketUrunu = !!secili && 'paket' in secili && !!secili.paket && !secili.owned;
  const kilitSalon = secili && 'kilitSalon' in secili ? (secili.kilitSalon ?? 0) : 0;
  // Dekor sahnede duruyorsa aynı düğme onu KALDIRIR (sahiplik kalır, tekrar koymak ücretsiz).
  const kaldirilir = tab === 'decor' && !!secili?.applied;
  const bakiye = elmasli ? diamonds.toNumber() : wallet.toNumber();
  const afford = !!secili && !paketUrunu && (secili.owned || bakiye >= secili.cost);

  // Seçim şeridi: renk pulu + "uygulanmış" rozeti. Ad ve fiyat şeritte DEĞİL, altındaki satırda —
  // aynı bilgiyi iki yere yazmak şeridi kalabalıklaştırıyor ve pulu küçültüyordu.
  const chip = (
    key: string,
    testid: string,
    bg: string,
    isSel: boolean,
    applied: boolean,
    onClick: () => void,
  ) => (
    <button key={key} className={`shop-chip${isSel ? ' sel' : ''}`} data-testid={testid} onClick={onClick}>
      <span className="shop-chip-swatch" style={{ background: bg }} />
      {applied && (
        <span className="shop-chip-badge">
          <TickIcon size={11} />
        </span>
      )}
    </button>
  );

  const renderStrip = () => {
    if (tab === 'outfit' || tab === 'tray' || tab === 'decor') {
      const pul = tab === 'outfit' ? kiyafetPulu : tab === 'tray' ? tepsiPulu : dekorPulu;
      return vitrinUrunleri(tab).map((u) => {
        const [a, b] = pul(u.id);
        const uygulanan = tab === 'outfit' ? outfit === u.id : tab === 'tray' ? trayLook === u.id : !!u.yuva && dekor[u.yuva] === u.id;
        return chip(u.id, `shop-card-${tab}-${u.id}`, `linear-gradient(135deg, ${a} 0 55%, ${b} 55% 100%)`, sel[tab] === u.id, uygulanan, () =>
          setSel((p) => ({ ...p, [tab]: u.id })),
        );
      });
    }
    if (tab === 'table') {
      return economyConfig.cosmetics.tableThemes.map((t) =>
        chip(t.id, `shop-card-table-${t.id}`, t.color, sel.table === t.id, tableTheme === t.id, () =>
          setSel((p) => ({ ...p, table: t.id })),
        ),
      );
    }
    if (tab === 'paket') return null;
    const themes = tab === 'floor' ? economyConfig.cosmetics.floorThemes : economyConfig.cosmetics.wallThemes;
    const selected = tab === 'floor' ? floorThemeByArea : wallThemeByArea;
    return themes.map((t) => {
      const cols =
        tab === 'floor'
          ? floorSwatch(t.id)
          : [WALL_THEMES[t.id]?.cream ?? '#999', WALL_THEMES[t.id]?.wainscot ?? '#777'];
      return chip(
        t.id,
        `shop-card-${tab}-${t.id}`,
        `linear-gradient(135deg, ${cols[0]} 0 50%, ${cols[1]} 50% 100%)`,
        sel[tab] === t.id,
        selected[zn] === t.id,
        () => setSel((p) => ({ ...p, [tab]: t.id })),
      );
    });
  };

  return (
    <Sheet title={tab === 'paket' ? 'Paketler' : 'Mağaza'} testid="shop-panel" onClose={onClose}>
      <div className="shop-card">
        <div className="shop-tabs">
          {TABS.map(({ k, label }) => (
            <button
              key={k}
              className={`shop-tab${ELMAS_SEKME.includes(k) ? ' elmas' : ''}${tab === k ? ' active' : ''}`}
              data-testid={`shop-tab-${k}`}
              onClick={() => setTab(k)}
            >
              {label}
              {k === 'table' && !tableUnlocked ? (
                <span className="shop-tab-lock">
                  <LockIcon size={13} />
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === 'paket' ? (
          <Paketler />
        ) : kilitli ? (
          <div className="shop-locked" data-testid="shop-table-locked">
            <div className="shop-locked-icon">
              <LockIcon size={46} />
            </div>
            <div className="shop-locked-title">Masa temaları kilitli</div>
            <div className="shop-locked-desc">
              Tüm salonları aç ve bütün masaları son seviyeye getir; sonra masalarını renklendirebilirsin.
            </div>
            <div className="shop-locked-reqs">
              <span className={areasOpen >= MAX_AREAS ? 'req done' : 'req'}>
                {areasOpen >= MAX_AREAS ? <TickIcon size={12} /> : <DotIcon size={12} />} Salon{' '}
                {areasOpen}/{MAX_AREAS}
              </span>
              <span className={maxedTables >= tables && tables > 0 ? 'req done' : 'req'}>
                {maxedTables >= tables && tables > 0 ? <TickIcon size={12} /> : <DotIcon size={12} />} Son seviye
                masa {maxedTables}/{tables}
              </span>
            </div>
          </div>
        ) : (
          <>
            {tab === 'outfit' || tab === 'tray' ? (
              <SahipOnizleme
                kiyafet={tab === 'outfit' ? sel.outfit : outfit}
                tepsi={tab === 'tray' ? sel.tray : trayLook}
              />
            ) : tab === 'decor' ? (
              <DekorOnizleme id={sel.decor} />
            ) : tab === 'table' ? (
              <TableThemePreview id={sel.table} />
            ) : (
              <DioramaPreview kind={tab} id={sel[tab]} />
            )}

            {/* Salon şeridi — zemin/duvar salon-başı satılır; hangi salona baktığın bir SEÇİM. */}
            {(tab === 'floor' || tab === 'wall') && areasOpen > 1 && (
              <div className="shop-zones" data-testid="shop-zones">
                {Array.from({ length: areasOpen }, (_, z) => (
                  <button
                    key={z}
                    className={`shop-zone-btn${zn === z ? ' sel' : ''}`}
                    data-testid={`shop-zone-${z}`}
                    onClick={() => setZone(z)}
                  >
                    Salon {z + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="shop-strip">{renderStrip()}</div>

            {secili && (
              <div className="shop-name-row">
                <b data-testid="shop-sel-name">{secili.label}</b>
                <span>
                  {secili.applied
                    ? tab === 'decor'
                      ? 'Salonda duruyor'
                      : 'Şu an uygulanmış'
                    : kilitSalon
                      ? `${kilitSalon}. Salon açılınca`
                    : secili.owned
                      ? 'Sahipsin'
                      : paketUrunu
                        ? 'Başlangıç Paketi ile gelir'
                        : elmasli
                          ? `${fmt(secili.cost)} elmas`
                          : `${fmt(secili.cost)} ₺`}
                </span>
              </div>
            )}
            {/* B12 (T9d): alım sönükse nedeni yazar. */}
            {secili && !secili.owned && !afford && !paketUrunu && !kilitSalon && (
              <span className="eksik shop-eksik" data-testid="eksik">
                {elmasli ? <GemIcon size={12} /> : <CoinIcon size={12} />}
                {fmt(Math.ceil(secili.cost - bakiye))} eksik
              </span>
            )}
          </>
        )}
      </div>

      {/* TEK BÜYÜK SATIN ALMA — M2'nin hem kazancı hem bedeli bu düğmede. */}
      {!kilitli && secili && (
        <button
          className={`shop-buy${secili.applied && !kaldirilir ? ' sel' : ''}`}
          data-testid="shop-buy"
          disabled={(secili.applied && !kaldirilir) || !!kilitSalon || (paketUrunu ? !iapConfig.vitrin.baslangic : !afford)}
          onClick={() => {
            // Paket ürünü (kurucu) 💎 ile satılmaz: aynı düğme oyuncuyu paketin kendisine götürür.
            if (paketUrunu) setTab('paket');
            else if (tab === 'outfit' || tab === 'tray' || tab === 'decor') buyGemCosmetic(tab, secili.id);
            else if (tab !== 'paket') buyCosmetic(tab, secili.id, secili.alan);
          }}
        >
          {kaldirilir ? (
            'Kaldır'
          ) : secili.applied ? (
            <>
              <TickIcon size={18} /> Uygulandı
            </>
          ) : kilitSalon ? (
            <>
              <LockIcon size={16} /> {kilitSalon}. Salon açılınca
            </>
          ) : secili.owned ? (
            tab === 'decor' ? 'Salona Koy' : 'Uygula'
          ) : paketUrunu ? (
            'Paketlere Git'
          ) : (
            <>
              Satın Al · {fmt(secili.cost)} {elmasli ? <GemIcon size={18} /> : <CoinIcon size={18} />}
            </>
          )}
        </button>
      )}
    </Sheet>
  );
}

/**
 * PLAY GAMES (F4b · D-153). Giriş ZORUNLU DEĞİL: açılışta sessizce denenir, olmazsa burada bir düğme
 * durur. APP_ID girilmemiş cihazda (ya da SDK kurulamadıysa) bölüm hiç çizilmez.
 */
function PlayGamesBolumu() {
  useSyncExternalStore(bulutAbone, bulutSurumu);
  const { kullanilabilir, girisli } = playGamesDurumu();
  const [durum, setDurum] = useState<'bos' | 'bekle' | 'hata'>('bos');
  if (!kullanilabilir) return null;
  const baglan = async () => {
    setDurum('bekle');
    setDurum((await girisYap()) ? 'bos' : 'hata');
  };
  return (
    <>
      <div className="sheet-sec">PLAY GAMES</div>
      {girisli ? (
        <>
          <div className="sheet-foot-note" data-testid="pg-bagli">Bağlısın — ilerlemen buluta yedekleniyor.</div>
          <button className="sheet-cta" data-testid="pg-basarim" onClick={() => void basarimlariGoster()}>
            Başarımlar
          </button>
        </>
      ) : (
        <button className="sheet-cta" data-testid="pg-baglan" disabled={durum === 'bekle'} onClick={() => void baglan()}>
          {durum === 'hata' ? 'Bağlanamadı — tekrar dene' : "Play Games'e bağlan"}
        </button>
      )}
    </>
  );
}

/** "Satın alımları geri yükle" — silip yükleyen ya da telefon değiştiren oyuncu kalıcı ürünlerini alır. */
function GeriYukle() {
  const sahiplikEsitle = useGame((s) => s.sahiplikEsitle);
  const [durum, setDurum] = useState<'bos' | 'bekle' | 'tamam' | 'hata'>('bos');
  const yukle = async () => {
    setDurum('bekle');
    const h = await satinAlimlariGeriYukle();
    if (h) sahiplikEsitle(h);
    setDurum(h ? 'tamam' : 'hata');
  };
  return (
    <button className="sheet-cta" data-testid="geri-yukle" disabled={durum === 'bekle'} onClick={() => void yukle()}>
      {durum === 'tamam'
        ? 'Satın alımlar geri yüklendi'
        : durum === 'hata'
          ? 'Mağazaya ulaşılamadı'
          : 'Satın alımları geri yükle'}
    </button>
  );
}

/* FPS OVERLAY'İ BURADAYDI — R3'te KALDIRILDI (G-46 · D-128). Ölçüm teşhisi ekranın %1,30'u
   değil ÇAKIŞMAYDI: katman ayarlar panelinin içeriğine ve joystick'e biniyordu, telefonda tam
   "Ses seviyesi" kaydırıcısının üstünü örtüyordu (`ss/r3-fps-ayarlar.png`). Oyuncunun ekranında
   teşhis katmanı yoktur; sayılar hâlâ `window.__perf`te (Scene.tsx yazar), teşhis oradan okunur. */

/**
 * SEVİYE KAYDIRICISI (S9 · D-122). Anahtarın ALTINDA ayrı satır — "kapat" ile "kıs" farklı
 * isteklerdir ve tek bir anahtar ikisini birden karşılamıyordu.
 *
 * Anahtar kapalıyken kaydırıcı SÖNÜKLEŞİR ama KALDIRILMAZ: yeri sabit kalsın, panel açılıp
 * kapanırken satırlar zıplamasın. Devre dışı olması zaten `disabled` ile yazılı.
 *
 * Adım 5: kulak 100 kademeyi ayırt etmiyor, 20 kademe sürüklemeyi de rahat bırakıyor.
 */
function SettingSlider({
  label,
  value,
  onChange,
  disabled,
  testid,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  testid: string;
}) {
  const yuzde = Math.round(value * 100);
  return (
    <div className={`setting-slider${disabled ? ' kapali' : ''}`}>
      <span className="setting-label">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={yuzde}
        // Dolu kısmın oranı CSS'e buradan geçiyor: `input[type=range]` kendi değerini bir
        // arka plana çeviremez, oran JS'ten verilmek zorunda.
        style={{ '--dolu': `${yuzde}%` } as React.CSSProperties}
        disabled={disabled}
        data-testid={testid}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <span className="setting-val">%{yuzde}</span>
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

