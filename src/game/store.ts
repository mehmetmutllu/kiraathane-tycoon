import { create } from 'zustand';
import { Decimal, D } from './decimal';
import type { Coin, Dish, Npc, Vec3, Waiter } from './types';
import {
  economyConfig as C,
  cupPoolCapacity,
  waiterSpeedNextCost,
  waiterSpeedMaxTier,
  dishSpeedNextCost,
  dishSpeedMaxTier,
  charMaxTier,
  charNextCost,
  waiterTrayMaxTier,
  waiterTrayNextCost,
  dishCarryNextCost,
  dishCarryMaxTier,
  type WaiterUpgrades,
  type ProductId,
  trayCapacityFor,
  type CharStat,
  type CharUpgrades,
} from '../config/economy.config';
import {
  defaultSave,
  defaultStats,
  defaultSettings,
  defaultCharUpgrades,
  defaultWaiterUpgrades,
  loadSave,
  writeSave,
  clearSave,
  type SaveData,
  type SaveStats,
  type SaveSettings,
} from './save';

import {
  LAYOUT,
  openServices,
  servicePlace,
} from './layout';
import { deriveWorld, defaultFloorTheme, MAX_AREAS, MAX_SERVICES, THE_SERVICE, type World } from './world';
// Dünya modeli (ALAN · SERVİS · MASA · ODA) Faz B1'de world.ts'e ayrıldı; store aynı kapıdan sunar.
export {
  deriveWorld,
  defaultFloorTheme,
  serviceOfTable,
  serviceMenu,
  sellsTost,
  isCounter,
  tostShare,
  areaOfTable,
  tablesInArea,
  THE_SERVICE,
  MAX_AREAS,
  MAX_SERVICES,
  MAX_WAITERS,
  TABLES_PER_AREA,
} from './world';
export type { World, Area, Service, Table, Room } from './world';
// Yerleşim/geometri Faz A2'de layout.ts'e taşındı; eski `from './store'` importları kırılmasın diye
// buradan yeniden dışa aktarılır (tek tanım, iki kapı).
export {
  LAYOUT,
  PAD_RADIUS,
  BAND,
  FLOOR_HALF,
  wallSpans,
  hasAreaNeighbor,
  servicePlace,
  serviceInArea,
  serviceMoved,
  openServices,
  parkSpot,
  parkClearance,
  BANKET,
  banketLen,
  banketUnit,
  banketUnitsOpen,
  banketIslands,
  WAITER_STATION,
  waiterStationOpen,
  doorX,
  entranceAt,
  streetAt,
} from './layout';
export type { ServicePlace, AreaSide, BanketIsland, SeatKind } from './layout';
export type { RVec3 } from './layout';

import {
  SAVE_INTERVAL,
  CAM_FOCUS_TTL,
  keepIdentity,
  totalCupPool,
  tableSoftMaxLevel,
  stationSoftMaxLevel,
  stationUpgradeCost,
  incomeRate,
  revealKeys,
  questView,
  questFocusPos,
  computeOfflineEarned,
  type ActiveSpot,
  type GameNotice,
  type QuestView,
  type CamFocus,
  tableThemeUnlocked,
} from './rules';
// Kurallar Faz A2'de rules.ts'e taşındı; eski `from './store'` importları kırılmasın diye yeniden
// dışa aktarılır (tek tanım, iki kapı).
export {
  FILL_TEA,
  FILL_TABLE,
  TEA_PRICE,
  brewTime,
  brewThroughputMult,
  incomeRate,
  dirtyTables,
  totalCupPool,
  occupiedSeats,
  findTableForGroup,
  visiblePads,
  currentPad,
  availableOptionalPads,
  revealKeys,
  stationUpgradeUnlocked0,
  stationUpgradeUnlocked,
  tableUpgradeUnlocked,
  tableUpgradeUnlockedIn,
  tableSoftMaxLevel,
  tableNextCost,
  tableThemeUnlocked,
  stationSoftMaxLevel,
  stationUpgradeCost,
  stationUpgradeCostAt,
  computeOfflineEarned,
  questTargetMet,
  questCounterValue,
  questFocusPos,
} from './rules';
export type { ActiveSpot, GameNotice, QuestView, QuestCtx, CamFocus } from './rules';

import { createTickCtx, runTick } from './tick';


/** Oyuncunun tepsi kapasitesi (tek turda taşınan çay/kirli) — karakter tepsi kademesinden türetilir
 *  (v20; D-018'in "sabit" kararı karakter yükseltmeleriyle değişti). Arg'sız çağrı canlı store'dan okur
 *  (devHooks/testler geri-uyumu). */
export function trayCapacity(tier?: number): number {
  return trayCapacityFor(tier ?? useGame.getState().charUpgrades.tray);
}


export interface GameState {
  // Kalıcı
  wallet: Decimal;
  diamonds: Decimal;
  lifetime: Decimal;
  tables: number;
  stations: number;
  /** Açık ALAN sayısı (deriveWorld anlık görüntüsü; 1 = yalnız 1. alan). */
  areasOpen: number;
  /** SERVİS başına ocak seviyesi (persist v18; D-022). */
  stationLevels: number[];
  /** Masa-başı yükseltme seviyeleri (Faz 2h; persist; index = GLOBAL masa slotu; bahşiş + sabır). */
  tableLevels: number[];
  padsDone: string[];
  /** Aktif pad'lerin kısmi dolumu (pad id → ₺). Eş zamanlı omurga + opsiyonel için kayıt (v5). */
  padFills: Record<string, number>;
  // Transient (kaydedilmez — D-011 servis durumu yeniden kurulur)
  player: Vec3;
  npcs: Npc[];
  coins: Coin[];
  /** Oto-toplanan ama henüz toast'la bildirilmemiş ₺ (transient; toplu bildirim birikimi). */
  autoCollectSum: number;
  /** Oto-toplama toast'ının yeniden çıkabilmesine kalan sn (transient; spam önleme). */
  autoCollectToastCooldown: number;
  npcCount: number;
  /** GLOBAL garson havuzu (B2): düz liste, uzunluk = tutulmuş garson sayısı (0..MAX_WAITERS).
   *  Konum/tepsi transient, her oturumda kurulur. Eskiden servis başına `waiters`+`waiters2` idi. */
  waiters: Waiter[];
  /** Katın TEK bulaşıkçısı (yoksa null) — konum/taşıdığı kirli transient. */
  dishwasher: Waiter | null;
  /** Servisin HAZIR ürünleri — ÜRÜN başına (B2: tek nokta, seviyeye göre iki ürün). */
  ready: Record<ProductId, number>;
  /** Ürün başına birikmiş hazırlama süresi (sn); tezgâh aynı anda tek kalem hazırlar. */
  brewProgress: Record<ProductId, number>;
  /** Oyuncunun tepsisinde taşıdığı çay sayısı. */
  tray: number;
  /** Oyuncunun tepsisinde taşıdığı TOST sayısı (M3 ikinci ürün hattı; kapasite tray+trayFood+
   *  carriedDirty toplamı üzerinden PAYLAŞIMLIDIR). */
  trayFood: number;
  /** Temiz bardak havuzu — GLOBAL tek depo (servisler ortak; korunum değişmezi global kalır). Faz 2e. */
  cleanCups: number;
  /** Masalarda bekleyen kirli bardaklar (mekânsal nesneler). */
  dishes: Dish[];
  /** Oyuncunun bulaşığa götürmek için taşıdığı kirli bardak. */
  carriedDirty: number;
  /** Oyuncunun taşıdığı kirli TABAK (tost bulaşığı; turu-5 m.11 — tepside tabak çizilir).
   *  Transient; yıkama/havuz bardakla ORTAK, yalnız görsel için ayrı sayılır. */
  carriedDirtyFood: number;
  /** SERVİS başına ocak-yükseltme noktası kısmi dolumu (transient; D-018 dwell). */
  upgradeFills: number[];
  /** Masa-başı yükseltme noktalarındaki kısmi dolum (transient; index = GLOBAL masa slotu). */
  tableUpgradeFills: number[];
  activeSpot: ActiveSpot | null;
  /** Yeni-özellik toast'u (D-019 §4) — transient; null ise gösterilmez. AYNI ANDA tek toast. */
  notice: GameNotice | null;
  /** Bekleyen toast kuyruğu (transient): bitiş/reveal/seviye sırayla gösterilir, birbirini ezmez. */
  noticeQueue: GameNotice[];
  /** Bu oturumda zaten bildirilmiş reveal anahtarları (transient; init'te açık olanlarla doldurulur). */
  revealSeen: string[];
  /** Kalıcı eylem sayaçları (quest + arka-plan reveal şartları; v16 persist). */
  stats: SaveStats;
  /** Sıradaki görevin index'i (persist; >= quests.length ⇒ görev hattı bitti). */
  questIndex: number;
  /** Aktif sayaç görevinin başlangıç sayaç değeri (persist; delta hedefi tabanı). */
  questBase: number;
  /** Toplam oyuncu XP'si (persist v17). Seviye `levelProgress(xp)` ile türetilir — ayrı saklanmaz. */
  xp: number;
  /** Oyuncu ayarları (persist v17): ses/müzik/bildirim. */
  settings: SaveSettings;
  /** Kozmetik mağaza (persist v19, WP6): ALAN başına seçili tema + sahiplikler (`kind:id:zN`). */
  floorThemeByArea: string[];
  wallThemeByArea: string[];
  /** GLOBAL masa teması (persist v30): mobilya minder+örtü rengi (recolor atlas). */
  tableTheme: string;
  ownedCosmetics: string[];
  /** Karakter yükseltme kademeleri (persist v20): tepsi/mıknatıs/hız. Karakter seviyesi türetilir. */
  charUpgrades: CharUpgrades;
  /** Garson tepsi yükseltme kademeleri (persist v27/Y3): çay garsonları ortak + tostçu ayrı. */
  waiterUpgrades: WaiterUpgrades;
  /** Karakter paneli ilk-sefer spotlight'ı görüldü mü (persist v20). */
  charPanelSeen: boolean;
  /** Tepsi-boşalt butonu ilk-sefer spotlight'ı görüldü mü (persist v23). */
  trayTipSeen: boolean;
  /** Üst görev barı görünümü (transient; her tick türetilir; null = hat bitti). */
  quest: QuestView | null;
  /** Görev geçiş fazı (transient): active=normal, completing=bitiş flash, gap=yeni görev öncesi boşluk. */
  questPhase: 'active' | 'completing' | 'gap';
  /** Görev geçiş fazı geri sayımı (transient, sn). */
  questPhaseT: number;
  /** Kutlama fazında EKRANDA gösterilen (biten) görevin index'i; -1 = yok (transient).
   *  questIndex bitiş ANINDA ilerler (taban yarışı yok), kart 1,3 sn daha bunu gösterir. */
  questDoneIndex: number;
  /** Kamera odak isteği (transient): görev barına dokununca / yeni şey açılınca hedefe pan. */
  camFocus: CamFocus | null;
  /** Genel-bakış zoom'u (transient): HUD kamera butonu AÇIKKEN kamera uzaklaşır (salonu görmek için). */
  camZoomOut: boolean;
  offlineEarned: number;
  // Dahili
  spawnTimer: number;
  /** Spawn round-robin ALAN imleci (transient): grup dağılımı alanlar arası adil olsun. */
  spawnArea: number;
  saveTimer: number;
  nextId: number;
  inputKeyboard: [number, number];
  inputJoystick: [number, number];
  // Aksiyonlar
  init: () => void;
  tick: (dt: number) => void;
  setKeyboardInput: (x: number, z: number) => void;
  setJoystickInput: (x: number, z: number) => void;
  upgradeStation: () => boolean;
  addMoney: (amount: number) => void;
  /** Görev barına dokununca: kamera aktif görevin hedefine kayar (görev yoksa no-op). */
  focusQuest: () => void;
  toggleCamZoomOut: () => void;
  /** Ayar değiştir (ayarlar modalı) — anında kaydedilir. */
  setSetting: (key: keyof SaveSettings, value: boolean) => void;
  /**
   * Kozmetik tema satın al/uygula (WP6): ALAN AÇIK olmalı; ilk satın alma ₺ düşer (cüzdan yetmezse
   * false), sahip olunan tema ücretsiz yeniden seçilir. Başarıda anında kaydedilir.
   */
  buyCosmetic: (kind: 'floor' | 'wall' | 'table', id: string, area: number) => boolean;
  /**
   * Karakter özelliği satın al (v20, karakter paneli): cüzdan yeterliyse kademe +1 (yetmezse/max'taysa
   * false). Başarıda anında kaydedilir; charStat görevi varsa sonraki tick'te tamamlanır.
   */
  buyCharUpgrade: (stat: CharStat) => boolean;
  /** Garson tepsi kademesi satın al (Y3, garson sekmesi): B2'de tek havuz → tek eğri. */
  buyWaiterTray: () => boolean;
  /** Bulaşıkçı leğen kademesi satın al (v28, Bulaşıkçı sekmesi): tüm salonların bulaşıkçılarına ortak. */
  buyDishCarry: () => boolean;
  /** Garson hız kademesi satın al (v29, garson sekmesi): havuza ortak. */
  buyWaiterSpeed: () => boolean;
  /** Bulaşıkçı hız kademesi satın al (v29, Bulaşıkçı sekmesi): tüm salonlara ortak. */
  buyDishSpeed: () => boolean;
  /** Karakter paneli ilk-sefer spotlight'ını kapat (butona dokununca; persist — bir daha çıkmaz). */
  markCharPanelSeen: () => void;
  /**
   * Tepsiyi boşalt (v23, telefon turu-2): tepsideki ÇAYLAR atılır, bardakları temiz havuza döner
   * (korunum bozulmaz; çay ziyan = küçük bedel, istismarı engeller). Taşınan KİRLİLER kalır —
   * onlar zaten lavaboya gidiyor. Tepsi çayla doluyken müşteriler kalkarsa kilitlenme çözücüsü.
   */
  emptyTray: (kind: 'tea' | 'food') => void;
  /** Tepsi-boşalt butonu ilk-sefer spotlight'ını kapat (persist — bir daha çıkmaz). */
  markTrayTipSeen: () => void;
  saveNow: () => void;
  hardReset: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  wallet: D(0),
  diamonds: D(0),
  lifetime: D(0),
  tables: 1,
  stations: 1,
  areasOpen: 1,
  stationLevels: Array.from({ length: MAX_SERVICES }, () => 0),
  tableLevels: LAYOUT.tables.map(() => 0),
  padsDone: [],
  padFills: {},
  player: [...LAYOUT.player] as Vec3,
  npcs: [],
  coins: [],
  autoCollectSum: 0,
  autoCollectToastCooldown: 0,
  npcCount: 0,
  waiters: [],
  dishwasher: null,
  ready: { tea: 0, tost: 0 },
  brewProgress: { tea: 0, tost: 0 },
  tray: 0,
  trayFood: 0,
  cleanCups: cupPoolCapacity(0),
  dishes: [],
  carriedDirty: 0,
  carriedDirtyFood: 0,
  upgradeFills: Array.from({ length: MAX_AREAS }, () => 0),
  tableUpgradeFills: LAYOUT.tables.map(() => 0),
  activeSpot: null,
  notice: null,
  noticeQueue: [],
  revealSeen: [],
  stats: defaultStats(),
  questIndex: 0,
  questBase: 0,
  questPhase: 'active',
  questPhaseT: 0,
  questDoneIndex: -1,
  xp: 0,
  settings: defaultSettings(),
  floorThemeByArea: Array.from({ length: MAX_AREAS }, (_, z) => defaultFloorTheme(z)),
  wallThemeByArea: Array.from({ length: MAX_AREAS }, () => 'krem'),
  tableTheme: 'mavi',
  ownedCosmetics: [],
  charUpgrades: defaultCharUpgrades(),
  waiterUpgrades: defaultWaiterUpgrades(),
  charPanelSeen: false,
  trayTipSeen: false,
  quest: null,
  camFocus: null,
  camZoomOut: false,
  offlineEarned: 0,
  spawnTimer: 1,
  spawnArea: 0,
  saveTimer: SAVE_INTERVAL,
  nextId: 1,
  inputKeyboard: [0, 0],
  inputJoystick: [0, 0],

  init: () => {
    const save: SaveData = loadSave();
    // D-015: masa/servis/personel padsDone'dan TÜRETİLİR (ayrı saklanmaz).
    const world: World = deriveWorld(save.padsDone);
    const openSvc = openServices(world.areasOpen);
    // B3-1 (D-062): servis kümesinin YERİ açık alan sayısına bağlı (3. Alan açılınca arka banda taşınır).
    const initPlace = servicePlace(world.areasOpen);
    const stationLevels = Array.from({ length: MAX_SERVICES }, (_, sv) =>
      Math.min(save.stationLevels[sv] ?? 0, stationSoftMaxLevel()),
    );
    // Karakter kademeleri (v20): bozuk/aşırı değer max kademeye kelepçelenir (stationLevels deseni).
    const charUpgrades: CharUpgrades = {
      tray: Math.max(0, Math.min(save.charUpgrades?.tray ?? 0, charMaxTier('tray'))),
      magnet: Math.max(0, Math.min(save.charUpgrades?.magnet ?? 0, charMaxTier('magnet'))),
      speed: Math.max(0, Math.min(save.charUpgrades?.speed ?? 0, charMaxTier('speed'))),
    };
    // Garson tepsi kademeleri (v27/Y3) + bulaşıkçı leğeni (v28) + hız kademeleri (v29): aynı kelepçe deseni.
    const waiterUpgrades: WaiterUpgrades = {
      tray: Math.max(0, Math.min(save.waiterUpgrades?.tray ?? 0, waiterTrayMaxTier())),
      speed: Math.max(0, Math.min(save.waiterUpgrades?.speed ?? 0, waiterSpeedMaxTier())),
      dishCarry: Math.max(0, Math.min(save.waiterUpgrades?.dishCarry ?? 0, dishCarryMaxTier())),
      dishSpeed: Math.max(0, Math.min(save.waiterUpgrades?.dishSpeed ?? 0, dishSpeedMaxTier())),
    };
    // Çevrimdışı gelir: açık SERVİSLERİN idealize oranları TOPLAMI; süre + PARA tavanlı (computeOfflineEarned).
    const elapsed = Math.max(0, (Date.now() - save.lastSaved) / 1000);
    let wallet = D(save.wallet);
    let lifetime = D(save.lifetime);
    let offlineEarned = 0;
    if (elapsed > 30) {
      // B2: tek servis tüm masaları besler → tek oran (eski "açık servislerin toplamı" döngüsü kalktı).
      let tipTotal = 0;
      for (const t of world.tables) tipTotal += C.tables.tipBase * (save.tableLevels[t.index] ?? 0);
      const rate = incomeRate(world.tables.length, stationLevels[THE_SERVICE], tipTotal);
      offlineEarned = computeOfflineEarned(rate, elapsed, save.padsDone);
      wallet = wallet.add(offlineEarned);
      lifetime = lifetime.add(offlineEarned);
    }
    set({
      wallet,
      lifetime,
      diamonds: D(save.diamonds),
      tables: world.tables.length,
      stations: openSvc.length,
      areasOpen: world.areasOpen,
      stationLevels,
      // Masa-başı seviyeleri: slot sayısına normalize et + her birini soft max'a clamp'le.
      tableLevels: LAYOUT.tables.map((_, i) => Math.min(save.tableLevels[i] ?? 0, tableSoftMaxLevel())),
      padsDone: [...save.padsDone],
      padFills: { ...save.padFills },
      offlineEarned,
      player: [...LAYOUT.player] as Vec3,
      npcs: [],
      coins: [],
      autoCollectSum: 0,
      autoCollectToastCooldown: 0,
      npcCount: 0,
      // GLOBAL havuz: tutulmuş garson sayısı kadar aktör, bekleme noktaları 0.7 br arayla.
      waiters: Array.from({ length: world.services[THE_SERVICE].waiters }, (_, i) => ({
        pos: [initPlace.waiterHome[0] + i * 0.7, 0, initPlace.waiterHome[2]] as Vec3,
        tray: 0,
        trayFood: 0,
      })),
      dishwasher: world.services[THE_SERVICE].hasDishwasher
        ? { pos: [...initPlace.dishwasherHome] as Vec3, tray: 0, trayFood: 0 }
        : null,
      ready: { tea: 0, tost: 0 },
      brewProgress: { tea: 0, tost: 0 },
      tray: 0,
      trayFood: 0,
      // Bardak havuzu her oturumda dolu-temiz başlar (transient). GLOBAL tek depo:
      // açık servis başına taban + o servislerin ocak seviyelerinin toplamı.
      cleanCups: totalCupPool(world.areasOpen, stationLevels),
      dishes: [],
      carriedDirty: 0,
      carriedDirtyFood: 0,
      upgradeFills: Array.from({ length: MAX_SERVICES }, () => 0),
      tableUpgradeFills: LAYOUT.tables.map(() => 0),
      activeSpot: null,
      notice: null,
      noticeQueue: [],
      // revealSeen baseline: yüklemede ZATEN açık olan özellikler bildirilmiş sayılır (yeniden yükleme spam'ı yok).
      revealSeen: revealKeys(
        {
          padsDone: save.padsDone,
          tables: world.tables.length,
          stationLevel: stationLevels[0],
          lifetime: lifetime.toNumber(),
          waiterServed: save.stats.waiterServed,
          waiterServedByService: save.stats.waiterServedByService,
        },
        world.areasOpen,
        stationLevels,
      ).map(([k]) => k),
      stats: { ...save.stats },
      questIndex: save.questIndex,
      questBase: save.questBase,
      questPhase: 'active',
      questPhaseT: 0,
      questDoneIndex: -1,
      xp: save.xp,
      settings: { ...save.settings },
      floorThemeByArea: Array.from({ length: MAX_AREAS }, (_, a) => save.floorThemeByArea[a] ?? defaultFloorTheme(a)),
      wallThemeByArea: Array.from({ length: MAX_AREAS }, (_, a) => save.wallThemeByArea[a] ?? 'krem'),
      tableTheme: save.tableTheme ?? 'mavi',
      ownedCosmetics: [...save.ownedCosmetics],
      charUpgrades,
      waiterUpgrades,
      charPanelSeen: save.charPanelSeen,
      trayTipSeen: save.trayTipSeen,
      quest:
        save.questIndex < C.quests.length
          ? questView(C.quests[save.questIndex], {
              padsDone: save.padsDone,
              stationLevels,
              tableLevels: save.tableLevels,
              stats: save.stats,
              questBase: save.questBase,
              charUpgrades,
              waiterUpgrades,
            })
          : null,
      // İlk oyun (taze kayıt): kamera ilk görevin hedefine kısa pan → "hareketli" onboarding girişi.
      camFocus:
        save.questIndex === 0 && lifetime.lte(0)
          ? (() => {
              const p0 = questFocusPos(C.quests[0].target, save.tableLevels, world.tables.length, world.areasOpen);
              return p0 ? { pos: [p0[0], p0[1], p0[2]] as [number, number, number], ttl: 3 } : null;
            })()
          : null,
      spawnTimer: 1,
      spawnArea: 0,
      saveTimer: SAVE_INTERVAL,
      nextId: 1,
    });
  },

  /**
   * Bir simülasyon karesi. Gövde Faz A2'de `tick.ts`'e, 17 sisteme bölündü (sıra orada sabit);
   * burada kalan üç iş: bağlamı kur, sistemleri koştur, sonucu TEK `set()` ile yaz.
   * `keepIdentity` (rules.ts): içeriği değişmeyen alan ESKİ referansına döner → React yalnız
   * gerçekten değişen veriyi yeniden çizer (P0 perf düzeltmesi, 2026-09-06).
   */
  tick: (rawDt: number) => {
    const dt = Math.min(Math.max(rawDt, 0), 0.25);
    if (dt <= 0) return;
    const s = get();

    const c = createTickCtx(s, dt);
    runTick(c);

    // Periyodik kayıt (sistemlerin dışında: store'un işi).
    let saveTimer = s.saveTimer - dt;
    if (saveTimer <= 0) {
      saveTimer = SAVE_INTERVAL;
      get().saveNow();
    }

    set(
      keepIdentity(get() as unknown as Record<string, unknown>, {
        npcs: c.liveNpcs,
        coins: c.coins,
        autoCollectSum: c.autoCollectSum,
        autoCollectToastCooldown: c.autoCollectToastCooldown,
        dishes: c.dishes,
        wallet: c.wallet,
        lifetime: c.lifetime,
        tables: c.out.tables.length,
        stations: openServices(c.out.areasOpen).length,
        areasOpen: c.out.areasOpen,
        stationLevels: c.stationLevels,
        tableLevels: c.tableLevels,
        padsDone: c.padsDone,
        padFills: c.padFills,
        upgradeFills: c.upgradeFills,
        tableUpgradeFills: c.tableUpgradeFills,
        activeSpot: c.activeSpot,
        notice: c.notice,
        noticeQueue: c.noticeQueue,
        revealSeen: c.revealSeen,
        stats: c.stats,
        questIndex: c.questIndex,
        questBase: c.questBase,
        questPhase: c.questPhase,
        questPhaseT: c.questPhaseT,
        questDoneIndex: c.questDoneIndex,
        xp: c.xp,
        quest: c.quest,
        camFocus: c.camFocus,
        player: c.player,
        waiters: c.waiters,
        dishwasher: c.dishwasher,
        ready: c.ready,
        brewProgress: c.brewProgress,
        tray: c.tray,
        trayFood: c.trayFood,
        cleanCups: c.cleanCups,
        carriedDirty: c.carriedDirty,
        carriedDirtyFood: c.carriedDirtyFood,
        spawnTimer: c.spawnTimer,
        spawnArea: c.spawnArea,
        saveTimer,
        nextId: c.nextId,
        npcCount: c.liveNpcs.length,
      }),
    );
  },

  setKeyboardInput: (x, z) => set({ inputKeyboard: [x, z] }),
  setJoystickInput: (x, z) => set({ inputJoystick: [x, z] }),

  // Zone-1 çay ocağı yükseltme (₺ ile L1-L4; dev kancası/test). L5 Usta = 💎/video (Faz 4).
  upgradeStation: () => {
    const s = get();
    if (s.stationLevels[0] >= stationSoftMaxLevel()) return false;
    const cost = stationUpgradeCost(s.stationLevels[0]);
    if (s.wallet.lt(cost)) return false;
    const stationLevels = s.stationLevels.slice();
    stationLevels[0] += 1;
    set({
      wallet: s.wallet.sub(cost),
      stationLevels,
      xp: s.xp + C.xp.perUpgrade,
      cleanCups: s.cleanCups + C.cups.poolPerLevel, // havuz ocak seviyesiyle büyür (Faz 2e)
    });
    get().saveNow();
    return true;
  },

  // Test/geliştirme yardımcısı: cüzdana para ekle.
  addMoney: (amount) => {
    const s = get();
    set({ wallet: s.wallet.add(amount), lifetime: s.lifetime.add(amount) });
  },

  // Görev barına dokununca: kamera aktif görevin hedefine kayar (kullanıcı onboarding isteği).
  focusQuest: () => {
    const s = get();
    if (s.questIndex >= C.quests.length) return;
    const q = C.quests[s.questIndex];
    const p = questFocusPos(q.target, s.tableLevels, s.tables, s.areasOpen, q.area ?? 0);
    if (p) set({ camFocus: { pos: [p[0], p[1], p[2]], ttl: CAM_FOCUS_TTL } });
  },

  toggleCamZoomOut: () => set({ camZoomOut: !get().camZoomOut }),

  setSetting: (key, value) => {
    set({ settings: { ...get().settings, [key]: value } });
    get().saveNow();
  },

  // Kozmetik tema satın al/uygula (WP6 — feedback §D19). ALAN açık + tema tanımlı olmalı;
  // sahip değilse cüzdandan düşer (yetmezse false), sahipse ücretsiz uygulanır.
  buyCosmetic: (kind, id, area) => {
    const s = get();
    // MASA teması GLOBAL (alansız): tek tableTheme; sahiplik anahtarı `table:id`.
    if (kind === 'table') {
      if (!tableThemeUnlocked(s)) return false; // 3 salon + tüm masalar max olana dek kilitli
      const theme = C.cosmetics.tableThemes.find((t) => t.id === id);
      if (!theme) return false;
      const key = `table:${id}`;
      let wallet = s.wallet;
      let ownedCosmetics = s.ownedCosmetics;
      if (theme.cost > 0 && !ownedCosmetics.includes(key)) {
        if (wallet.lt(theme.cost)) return false;
        wallet = wallet.sub(theme.cost);
        ownedCosmetics = [...ownedCosmetics, key];
      }
      set({ wallet, ownedCosmetics, tableTheme: id });
      get().saveNow();
      return true;
    }
    if (area < 0 || area >= s.areasOpen) return false;
    const themes = kind === 'floor' ? C.cosmetics.floorThemes : C.cosmetics.wallThemes;
    const theme = themes.find((t) => t.id === id);
    if (!theme) return false;
    const key = `${kind}:${id}:z${area}`;
    let wallet = s.wallet;
    let ownedCosmetics = s.ownedCosmetics;
    if (theme.cost > 0 && !ownedCosmetics.includes(key)) {
      if (wallet.lt(theme.cost)) return false;
      wallet = wallet.sub(theme.cost);
      ownedCosmetics = [...ownedCosmetics, key];
    }
    const arrKey = kind === 'floor' ? 'floorThemeByArea' : 'wallThemeByArea';
    const arr = (kind === 'floor' ? s.floorThemeByArea : s.wallThemeByArea).slice();
    arr[area] = id;
    set({ wallet, ownedCosmetics, [arrKey]: arr });
    get().saveNow();
    return true;
  },

  // Karakter özelliği satın al (v20 — panel butonundan; mekânsal pad değil, kullanıcı onaylı tasarım).
  buyCharUpgrade: (stat) => {
    const s = get();
    const tier = s.charUpgrades[stat];
    const cost = charNextCost(stat, tier);
    if (cost == null || s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      charUpgrades: { ...s.charUpgrades, [stat]: tier + 1 },
      xp: s.xp + C.xp.perUpgrade,
    });
    get().saveNow();
    return true;
  },

  // Garson tepsi kademesi satın al (Y3 — karakter panelinin garson sekmelerinden; buyCharUpgrade deseni).
  buyWaiterTray: () => {
    const s = get();
    const tier = s.waiterUpgrades.tray;
    const cost = waiterTrayNextCost(tier);
    if (cost == null || s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      waiterUpgrades: { ...s.waiterUpgrades, tray: tier + 1 },
      xp: s.xp + C.xp.perUpgrade,
    });
    get().saveNow();
    return true;
  },

  // Bulaşıkçı leğen kademesi satın al (v28 — Bulaşıkçı sekmesi; buyWaiterTray deseni).
  buyDishCarry: () => {
    const s = get();
    const tier = s.waiterUpgrades.dishCarry;
    const cost = dishCarryNextCost(tier);
    if (cost == null || s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      waiterUpgrades: { ...s.waiterUpgrades, dishCarry: tier + 1 },
      xp: s.xp + C.xp.perUpgrade,
    });
    get().saveNow();
    return true;
  },

  // Garson hız kademesi satın al (v29 — eski mekânsal waiterUp pad'inin panel karşılığı).
  buyWaiterSpeed: () => {
    const s = get();
    const tier = s.waiterUpgrades.speed;
    const cost = waiterSpeedNextCost(tier);
    if (cost == null || s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      waiterUpgrades: { ...s.waiterUpgrades, speed: tier + 1 },
      xp: s.xp + C.xp.perUpgrade,
    });
    get().saveNow();
    return true;
  },

  // Bulaşıkçı hız kademesi satın al (v29 — kullanıcı: "bulaşıkçıya hız eklenmeli net bir şekilde").
  buyDishSpeed: () => {
    const s = get();
    const tier = s.waiterUpgrades.dishSpeed;
    const cost = dishSpeedNextCost(tier);
    if (cost == null || s.wallet.lt(cost)) return false;
    set({
      wallet: s.wallet.sub(cost),
      waiterUpgrades: { ...s.waiterUpgrades, dishSpeed: tier + 1 },
      xp: s.xp + C.xp.perUpgrade,
    });
    get().saveNow();
    return true;
  },

  markCharPanelSeen: () => {
    if (get().charPanelSeen) return;
    set({ charPanelSeen: true });
    get().saveNow();
  },

  // Y1: çay ve tost AYRI butonlardan boşaltılır (kind) — kaplar ortak temiz havuza döner (korunum);
  // kirliler tepside KALIR.
  emptyTray: (kind) => {
    const s = get();
    const n = kind === 'food' ? s.trayFood : s.tray;
    if (n <= 0) return;
    set(
      kind === 'food'
        ? { trayFood: 0, cleanCups: s.cleanCups + n }
        : { tray: 0, cleanCups: s.cleanCups + n },
    );
  },

  markTrayTipSeen: () => {
    if (get().trayTipSeen) return;
    set({ trayTipSeen: true });
    get().saveNow();
  },

  saveNow: () => {
    const s = get();
    // D-015: tables/stations/hasWaiter KAYDEDİLMEZ — yüklemede padsDone'dan türetilir.
    writeSave({
      ...defaultSave(),
      wallet: s.wallet.toString(),
      diamonds: s.diamonds.toString(),
      lifetime: s.lifetime.toString(),
      stationLevels: [...s.stationLevels],
      tableLevels: [...s.tableLevels],
      padsDone: [...s.padsDone],
      padFills: { ...s.padFills },
      stats: { ...s.stats },
      questIndex: s.questIndex,
      questBase: s.questBase,
      xp: s.xp,
      settings: { ...s.settings },
      floorThemeByArea: [...s.floorThemeByArea],
      wallThemeByArea: [...s.wallThemeByArea],
      tableTheme: s.tableTheme,
      ownedCosmetics: [...s.ownedCosmetics],
      charUpgrades: { ...s.charUpgrades },
      waiterUpgrades: { ...s.waiterUpgrades },
      charPanelSeen: s.charPanelSeen,
      trayTipSeen: s.trayTipSeen,
      lastSaved: Date.now(),
    });
  },

  hardReset: () => {
    clearSave();
    get().init();
  },
}));
