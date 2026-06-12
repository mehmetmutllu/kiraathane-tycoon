// localStorage kayıt + saveVersion migrasyon. Backend yok: cihaz = veritabanı.
import {
  SAVE_VERSION,
  MAX_ZONES,
  economyConfig,
  requiresMet,
  charMaxTier,
  waiterTrayMaxTier,
  dishCarryMaxTier,
  defaultFloorTheme,
  zoneProduct,
  type CharUpgrades,
  type WaiterUpgrades,
  type PadDef,
  type QuestTarget,
} from '../config/economy.config';

const KEY = 'kiraathane.save';

/**
 * Kalıcı (transient NPC/coin hariç) oyun durumu. Sayılar string Decimal serisi.
 * D-015: tables/stations/serviceSpeedMult/hasWaiter SAKLANMAZ — `padsDone`'dan türetilir
 * (derivedFromPads). Böylece sayaç ile pad listesi yapısal olarak desenkronize olamaz.
 */
/** Kalıcı oyun sayaçları (quest sistemi v16): oyuncu eylemleri + garson taşıması. */
export interface SaveStats {
  /** Oyuncunun ocaktan tepsiye aldığı toplam çay. */
  teaPickups: number;
  /** Oyuncunun ELİYLE masaya bıraktığı toplam çay (garson hariç). */
  teasServed: number;
  /** Yerden toplanan toplam para adedi. */
  coinsCollected: number;
  /** Oyuncunun ELİYLE bulaşıkta yıkadığı toplam kirli bardak (bulaşıkçı hariç). */
  dishesWashed: number;
  /** Garsonun bugüne dek taşıdığı toplam çay (arka-plan reveal şartları). */
  waiterServed: number;
  /** ZONE-BAŞINA garson taşıma sayacı (v21): her salonun hızlandırma noktası KENDİ garsonunun
   *  işini sayar (z2 garsonu tutulur tutulmaz hızlandırma belirmesin — sindirme ilkesi). */
  waiterServedByZone: number[];
  /** ZONE-BAŞINA oyuncu el servisi (v23): zone'lu serveTea görevleri (q_z2serve) YALNIZ o salonun
   *  servisini sayar — eski global sayaç "Yeni salonda 5 çay" görevini zone-1'de de dolduruyordu. */
  teasServedByZone: number[];
}

export function defaultStats(): SaveStats {
  return {
    teaPickups: 0,
    teasServed: 0,
    coinsCollected: 0,
    dishesWashed: 0,
    waiterServed: 0,
    waiterServedByZone: [],
    teasServedByZone: [],
  };
}

/** Oyuncu ayarları (v17 persist). Ses/müzik Faz 6'da, bildirimler Capacitor'da (Faz 5/7) okunur. */
export interface SaveSettings {
  sound: boolean;
  music: boolean;
  notifications: boolean;
}

export function defaultSettings(): SaveSettings {
  return { sound: true, music: true, notifications: true };
}

export interface SaveData {
  saveVersion: number;
  wallet: string;
  diamonds: string;
  lifetime: string;
  /** Zone başına çay ocağı seviyesi (v18; index = zone; per-zone ocak, D-022). */
  stationLevels: number[];
  /** Masa-başı yükseltme seviyeleri (Faz 2h; index = GLOBAL masa slotu; bahşiş+sabır). */
  tableLevels: number[];
  /** Zone başına garson hız seviyesi (v18; 0 = taban, 1 = L2; o zone'da garson tutulduysa anlamlı). */
  waiterLevels: number[];
  padsDone: string[];
  /** Aktif pad'lerin kısmi dolumu (pad id → ₺). Aynı anda birden çok pad doldurulabilir (v5). */
  padFills: Record<string, number>;
  /** Kalıcı eylem sayaçları (quest + arka-plan reveal şartları; v16). */
  stats: SaveStats;
  /** Sıradaki görevin index'i (economyConfig.quests; >= length ⇒ görev hattı bitti; v16). */
  questIndex: number;
  /** Aktif SAYAÇ görevinin başlangıç sayaç değeri (delta hedefi için taban; v16). */
  questBase: number;
  /** Toplam oyuncu XP'si (v17; level `levelProgress(xp)` ile türetilir — ayrı saklanmaz). */
  xp: number;
  /** Oyuncu ayarları (v17). */
  settings: SaveSettings;
  /** Kozmetik mağaza (v19, WP6): zone başına seçili zemin/duvar teması + satın alınan sahiplikler
   *  (`kind:id:zN` anahtarları — tekrar seçmek ücretsiz). */
  floorThemeByZone: string[];
  wallThemeByZone: string[];
  ownedCosmetics: string[];
  /** Karakter yükseltme kademeleri (v20): tepsi/mıknatıs/hız. Karakter seviyesi türetilir. */
  charUpgrades: CharUpgrades;
  /** Garson tepsi yükseltme kademeleri (v27/Y3): çay garsonları ortak + tostçu ayrı eğri. */
  waiterUpgrades: WaiterUpgrades;
  /** Karakter paneli ilk-sefer spotlight'ı görüldü mü (v20; butona dokununca true, bir daha çıkmaz). */
  charPanelSeen: boolean;
  /** Tepsi-boşalt butonu ilk-sefer spotlight'ı görüldü mü (v23; charPanelSeen deseni). */
  trayTipSeen: boolean;
  lastSaved: number; // epoch ms
}

export function defaultCharUpgrades(): CharUpgrades {
  return { tray: 0, magnet: 0, speed: 0 };
}

export function defaultWaiterUpgrades(): WaiterUpgrades {
  return { teaTray: 0, tostTray: 0, dishCarry: 0 };
}

export function defaultSave(): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    wallet: '0',
    diamonds: '0',
    lifetime: '0',
    stationLevels: [],
    tableLevels: [],
    waiterLevels: [],
    padsDone: [],
    padFills: {},
    stats: defaultStats(),
    questIndex: 0,
    questBase: 0,
    xp: 0,
    settings: defaultSettings(),
    floorThemeByZone: [],
    wallThemeByZone: [],
    ownedCosmetics: [],
    charUpgrades: defaultCharUpgrades(),
    waiterUpgrades: defaultWaiterUpgrades(),
    charPanelSeen: false,
    trayTipSeen: false,
    lastSaved: Date.now(),
  };
}

/**
 * Eski (quest-öncesi) kayıttan görev hattındaki yeri tohumlar (v15→v16). Kural: baştan yürü,
 * - karşılanan DURUM görevi (pad/level) → geç;
 * - karşılanmayan durum görevi → DUR (aktif görev bu: ör. eski kayıtta garson hiç tutulmadıysa
 *   "Garson tut" aktif olur — atlanırsa sonraki görevler garsonsuz kilitlenirdi);
 * - SAYAÇ görevi → ilerisinde karşılanmış bir durum görevi varsa (veya öğretici sayaçsa ve oyuncu
 *   zaten kazanç yapmışsa) tamam say, yoksa DUR.
 */
function seedQuestIndex(d: Record<string, unknown>): number {
  const quests = economyConfig.quests;
  const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
  const stationLevel = Number((Array.isArray(d.stationLevels) ? (d.stationLevels as number[])[0] : d.stationLevel) ?? 0) || 0;
  const waiterLevel = Number((Array.isArray(d.waiterLevels) ? (d.waiterLevels as number[])[0] : d.waiterLevel) ?? 0) || 0;
  const tableLevels = Array.isArray(d.tableLevels) ? (d.tableLevels as number[]).map((n) => Number(n) || 0) : [];
  const lifetime = Number(d.lifetime ?? 0) || 0;
  // charStat (v20): bu fonksiyon yalnız v<16 kayıtlar için çalışır ve onların HEPSİ v20 adımında
  // T2 hediyesi alır → tepsi görevleri (tier ≤ 2) tamam sayılır, mıknatıs/hız sayılmaz.
  const giftChar: CharUpgrades = { tray: 2, magnet: 0, speed: 0 };
  const stateMet = (t: QuestTarget): boolean | null => {
    switch (t.type) {
      case 'pad': return padsDone.includes(t.id);
      // zone'lu ocak görevi (v27): v<16 kayıtlarda tek ocak vardı — zone>0 görevleri karşılanmamış sayılır.
      case 'stationLevel': return (t.zone ?? 0) === 0 && stationLevel >= t.level;
      case 'waiterLevel': return waiterLevel >= t.level;
      case 'tableLevel': return tableLevels.some((l) => l >= t.level);
      case 'tablesAtLevel': return tableLevels.filter((l) => l >= t.level).length >= t.count;
      case 'waiterTray': return false; // v<16 kayıtta tepsi yükseltmesi olamaz (v27'de geldi)
      case 'charStat': return giftChar[t.stat] >= t.tier;
      default: return null; // sayaç görevi — eski kayıttan bilinemez
    }
  };
  let lastStateMet = -1;
  for (let i = 0; i < quests.length; i++) if (stateMet(quests[i].target) === true) lastStateMet = i;
  let idx = 0;
  while (idx < quests.length) {
    const met = stateMet(quests[idx].target);
    if (met === true) { idx++; continue; }
    // Sayaç görevi: ilerisinde yapılmış durum görevi varsa, ya da hiç yoksa bile oyuncu öğreticiyi
    // geçecek kadar kazanmışsa (lifetime ≥ table2 eşiği 20) tamam say.
    const counterDone = met === null && (idx < lastStateMet || (lastStateMet === -1 && lifetime >= 20));
    if (counterDone) { idx++; continue; }
    break;
  }
  return idx;
}

/** v4'teki tek `padFill` sayısı hangi omurga pad'ine aitse o id'yi bulur (opsiyoneller atlanır). */
function backbonePadId(g: { padsDone: string[]; tables: number; stationLevel: number; lifetime: number }): string | null {
  const p = (economyConfig.pads as readonly PadDef[]).find(
    (pd) => !pd.optional && !g.padsDone.includes(pd.id) && requiresMet(pd.requires, g),
  );
  return p ? p.id : null;
}

/** Eski sürüm kayıtları güncel şemaya taşır (ilerleme kaybolmaz). D-015 sonrası eski tables/stations/
 * serviceSpeedMult/hasWaiter alanları SADECE `padsDone`'u doğru kurmak için okunur, kayda yazılmaz. */
export function migrate(raw: Record<string, unknown>): SaveData {
  // Gevşek çalışma kaydı: eski (artık saklanmayan) alanlar burada okunur, sona kalan v8 şemasına yazılmaz.
  const d: Record<string, unknown> = { ...raw };
  let v = typeof raw.saveVersion === 'number' ? raw.saveVersion : 0;
  // Giriş sürümü (v20 questIndex id-eşlemesi için): v<16 kayıtlarda questIndex zaten YENİ listeyle
  // tohumlanır (seedQuestIndex güncel C.quests'i kullanır) → onlara id-eşleme uygulanmaz.
  const entryV = v;
  // v4'e kadar tek sayıydı; v5'te padFills'e taşınır.
  let pendingFill = Number((raw as { padFill?: unknown }).padFill ?? 0) || 0;

  // v0/v1/v2 -> v3: eksik alanları default'la, türleri normalize et.
  if (v < 3) {
    d.wallet = String(raw.wallet ?? '0');
    d.diamonds = String(raw.diamonds ?? '0');
    d.lifetime = String(raw.lifetime ?? raw.wallet ?? '0');
    d.tables = Number(raw.tables ?? 1) || 1;
    d.stationLevel = Number(raw.stationLevel ?? 0) || 0;
    pendingFill = Number(raw.padFill ?? 0) || 0;
    v = 3;
  }

  // v3 -> v4: tek-amaçlı pad → generic pad listesi.
  // Eski tables>=2 ise 'table2' pad'i tamamlanmış sayılır; yarım padFill korunur.
  if (v < 4) {
    const tables = Number(d.tables ?? 1) || 1;
    d.padsDone = Array.isArray(raw.padsDone)
      ? (raw.padsDone as string[])
      : tables >= 2
        ? ['table2']
        : [];
    if (tables >= 2) pendingFill = 0;
    v = 4;
  }

  // v4 -> v5: tek `padFill` → `padFills` kaydı (eş zamanlı omurga + opsiyonel pad dolumu için).
  // Eski kısmi dolum, o an aktif olan OMURGA pad'ine atanır (ilerleme kaybolmaz).
  if (v < 5) {
    const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
    const id = backbonePadId({
      padsDone,
      tables: Number(d.tables ?? 1) || 1,
      stationLevel: Number(d.stationLevel ?? 0) || 0,
      lifetime: Number(d.lifetime ?? 0) || 0,
    });
    d.padFills = pendingFill > 0 && id ? { [id]: pendingFill } : {};
    v = 5;
  }

  // v5 -> v6: 'station2' pad'i omurgadan çıkarıldı (D-012: salon = 1 ocak : 4 masa; 2. ocak Faz 3a'da).
  // Referansları temizle — ilerleme kaybolmaz (kazanılan ₺/seviye durur).
  if (v < 6) {
    d.padsDone = (Array.isArray(d.padsDone) ? (d.padsDone as string[]) : []).filter((id) => id !== 'station2');
    if (d.padFills && typeof d.padFills === 'object' && 'station2' in (d.padFills as object)) {
      const { station2: _drop, ...rest } = d.padFills as Record<string, number>;
      void _drop;
      d.padFills = rest;
    }
    v = 6;
  }

  // v6 -> v7: addTable pad'lerini eski masa SAYISIYLA senkronla. Çizili bir masa varken o masanın
  // pad'i bir daha belirmesin (yoksa pad masayla TAM aynı konumda çakışır). i. addTable = (i+2). masa.
  if (v < 7) {
    const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
    const addTablePads = (economyConfig.pads as readonly PadDef[]).filter((p) => p.effect.type === 'addTable');
    addTablePads.forEach((p, i) => {
      if ((Number(d.tables) || 1) >= i + 2 && !padsDone.includes(p.id)) padsDone.push(p.id);
    });
    d.padsDone = padsDone;
    v = 7;
  }

  // v7 -> v8 (D-015): tables/stations/serviceSpeedMult/hasWaiter ARTIK saklanmaz; padsDone'dan türetilir.
  // Eski 'hasWaiter' true ise 'waiter' pad'ini padsDone'a taşı ki türetme onu yakalasın (garson korunur).
  // (table sayacı v7 adımında zaten padsDone'a senkronlandı; serviceSpeed/samovar pad olarak zaten padsDone'da.)
  if (v < 8) {
    const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
    if (d.hasWaiter === true && !padsDone.includes('waiter')) padsDone.push('waiter');
    d.padsDone = padsDone;
    v = 8;
  }

  // v8 -> v9 (Faz 2e-B): tepsi kapasite yükseltme seviyesi eklenmişti. D-018'de tray yükseltme TAMAMEN
  // kaldırıldı (v12→v13) → bu adım artık sadece sürüm ilerletir (trayLevel v13'te düşürülür).
  if (v < 9) v = 9;
  // v9 -> v10 (Faz 2f): max tepsi kapasitesi ayarıydı; tray yükseltme kaldırıldığı için sadece sürüm ilerletir.
  if (v < 10) v = 10;

  // v10 -> v11 (Faz 2h): tek (zone-geneli) masa yükseltme seviyesi eklendi.
  if (v < 11) {
    d.tableLevel = Math.min(
      Number(d.tableLevel ?? 0) || 0,
      economyConfig.tables.upgrade.masterLevel - 1,
    );
    v = 11;
  }

  // v11 -> v12 (Faz 2h rework): masa yükseltme ZONE-geneli → MASA-BAŞI (kullanıcı isteği 2026-06-07).
  // Eski tek `tableLevel` her masa slotuna uygulanır (ilerleme korunur); artık `tableLevels` dizisi.
  if (v < 12) {
    const slots = economyConfig.pads.filter((p) => p.effect.type === 'addTable').length + 1; // 1 başlangıç + addTable'lar
    const cap = economyConfig.tables.upgrade.masterLevel - 1;
    const old = Math.min(Number(d.tableLevel ?? 0) || 0, cap);
    d.tableLevels = Array.isArray(d.tableLevels)
      ? (d.tableLevels as number[]).map((n) => Math.min(Number(n) || 0, cap))
      : Array.from({ length: slots }, () => old);
    delete d.tableLevel;
    v = 12;
  }

  // v12 -> v13 (D-018): TRAY YÜKSELTME KALDIRILDI → `trayLevel` persist alanı düşer (tepsi sabit 2).
  if (v < 13) {
    delete d.trayLevel;
    v = 13;
  }

  // v13 -> v14 (D-018 adım 5): 'samovar' ayrı pad'i KALDIRILDI (semaver = çay ocağı üst yükseltmesi).
  // Eski kayıttan 'samovar' referanslarını temizle (ilerleme/₺ korunur; dead id kalmaz; station2 deseni).
  if (v < 14) {
    d.padsDone = (Array.isArray(d.padsDone) ? (d.padsDone as string[]) : []).filter((id) => id !== 'samovar');
    if (d.padFills && typeof d.padFills === 'object' && 'samovar' in (d.padFills as object)) {
      const { samovar: _drop, ...rest } = d.padFills as Record<string, number>;
      void _drop;
      d.padFills = rest;
    }
    v = 14;
  }

  // v14 -> v15 (D-018 adım 6): garson L2 hız yükseltmesi → yeni `waiterLevel` persist alanı (eksikse 0).
  if (v < 15) {
    d.waiterLevel = Math.min(
      Number(d.waiterLevel ?? 0) || 0,
      economyConfig.waiter.moveSpeedByLevel.length - 1,
    );
    v = 15;
  }

  // v15 -> v16 (QUEST SİSTEMİ): kalıcı eylem sayaçları (stats) + questIndex/questBase eklendi.
  // Eski oyuncu görev hattının başına DÜŞMEZ: questIndex mevcut ilerlemeden tohumlanır (yapılmış
  // durum görevleri + öncesindeki sayaç görevleri tamam sayılır). Garson zaten tutulmuşsa
  // waiterServed=20 tohumlanır ki hız-yükseltme işareti (minWaiterServed) elinden alınmasın.
  if (v < 16) {
    const stats = defaultStats();
    const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
    if (padsDone.includes('waiter')) stats.waiterServed = 20;
    d.stats = stats;
    d.questIndex = seedQuestIndex(d);
    d.questBase = 0;
    v = 16;
  }

  // v16 -> v17 (LEVEL/XP + AYARLAR): toplam `xp` + `settings` eklendi. Eski oyuncu Level 1'e
  // DÜŞMEZ: xp mevcut ilerlemeden (stats sayaçları + questIndex + padsDone + ₺ seviyeleri)
  // config'teki XP oranlarıyla tohumlanır — sanki baştan beri XP kazanıyormuş gibi.
  if (v < 17) {
    const x = economyConfig.xp;
    const st = (d.stats && typeof d.stats === 'object' ? d.stats : {}) as Partial<SaveStats>;
    const tableLevels = Array.isArray(d.tableLevels) ? (d.tableLevels as number[]) : [];
    const upgrades =
      (Number(d.stationLevel ?? 0) || 0) +
      (Number(d.waiterLevel ?? 0) || 0) +
      tableLevels.reduce((a, n) => a + (Number(n) || 0), 0);
    d.xp =
      (Number(st.teasServed ?? 0) || 0) * x.perTeaServed +
      (Number(st.waiterServed ?? 0) || 0) * x.perWaiterServed +
      (Number(st.dishesWashed ?? 0) || 0) * x.perDishWashed +
      (Number(d.questIndex ?? 0) || 0) * x.perQuest +
      (Array.isArray(d.padsDone) ? (d.padsDone as string[]).length : 0) * x.perPad +
      upgrades * x.perUpgrade;
    d.settings = defaultSettings();
    v = 17;
  }

  // v17 -> v18 (ZONE-2, Faz 3a + D-022): per-zone ocak + garson → skaler `stationLevel`/`waiterLevel`
  // DİZİYE taşınır (eski değerler zone-1'e; zone-2 sıfırdan başlar). İlerleme kaybolmaz.
  if (v < 18) {
    d.stationLevels = [Number(d.stationLevel ?? 0) || 0];
    d.waiterLevels = [Number(d.waiterLevel ?? 0) || 0];
    delete d.stationLevel;
    delete d.waiterLevel;
    v = 18;
  }

  // v18 -> v19 (KOZMETİK MAĞAZA, WP6): zone başına zemin/duvar tema seçimi + sahiplik listesi.
  // Eski oyuncu default temalarla başlar (boş dizi = init'te 'parke'/'krem' doldurulur).
  if (v < 19) {
    d.floorThemeByZone = [];
    d.wallThemeByZone = [];
    d.ownedCosmetics = [];
    v = 19;
  }

  // v19 -> v20 (KARAKTER YÜKSELTMELERİ): charUpgrades + charPanelSeen eklendi; quest hattına 3 görev
  // (q_charTray1/q_charTray2/q_charMagnet) ARAYA girdi → questIndex İD-EŞLEMELİ taşınır (index kayar!).
  if (v < 20) {
    // Eski kayda T2 HEDİYE (bugüne kadarki kapasite 4 korunur — kullanıcı onaylı). Yeni oyun 0 (=2) başlar;
    // bu kod yoluna hiç girmez (defaultSave). v<16'dan gelen ÇOK eski kayıtlarda da ilerleme varsa kapasite
    // 4'tü → aynı hediye geçerli.
    d.charUpgrades = { tray: 2, magnet: 0, speed: 0 };
    d.charPanelSeen = false;
    // questIndex id-eşleme: v19 görev sırası (charStat görevleri YOKKEN) → aktif görevin İD'si bulunur,
    // yeni listedeki index'i yazılır. v<16 girişlerinde questIndex seedQuestIndex ile zaten YENİ listede.
    if (entryV >= 16) {
      const OLD_QUEST_IDS = [
        'q_pickup', 'q_serve1', 'q_coin', 'q_table2', 'q_serve5', 'q_station2', 'q_wash', 'q_table3',
        'q_waiter', 'q_dish', 'q_table4', 'q_waiterL2', 'q_tableL2', 'q_zone2', 'q_z2serve',
        'q_z2table2', 'q_z2waiter', 'q_z2table3', 'q_z2dish', 'q_z2table4',
      ];
      const oldIdx = Math.max(0, Number(d.questIndex ?? 0) || 0);
      if (oldIdx >= OLD_QUEST_IDS.length) {
        d.questIndex = economyConfig.quests.length; // hat bitmişti → yeni hatta da bitmiş sayılır
      } else {
        const ni = economyConfig.quests.findIndex((q) => q.id === OLD_QUEST_IDS[oldIdx]);
        if (ni >= 0) d.questIndex = ni;
      }
    }
    v = 20;
  }

  // v20 -> v21 (ZONE-BAŞI GARSON SAYACI): stats.waiterServedByZone eklendi. Eski global sayaç
  // zone-1'e yazılır (z1 hızlandırma işareti elinden alınmaz); z2 garsonu zaten tutulmuşsa z2'ye
  // eşik tohumlanır (bugün görünür olan işaret yarın kaybolmasın), yoksa 0'dan sayar.
  if (v < 21) {
    const st = (d.stats && typeof d.stats === 'object' ? d.stats : {}) as Partial<SaveStats>;
    const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
    const minServed = economyConfig.waiter.upgradeRequires.minWaiterServed ?? 0;
    d.stats = {
      ...st,
      waiterServedByZone: [
        Number(st.waiterServed ?? 0) || 0,
        padsDone.includes('z2waiter') ? minServed : 0,
      ],
    };
    v = 21;
  }

  // v21 -> v22 (GÖREV SIRASI): q_zone2, yükseltme görevlerinin (q_waiterL2/q_tableL2) ÖNÜNE alındı
  // (kullanıcı: 2. salon için yükseltme gerekmesin). questIndex İD-EŞLEMELİ taşınır — yalnız
  // entryV >= 20 girişlerde (v20/v21 sırasını kullanan kayıtlar): daha eski girişler v20 adımında /
  // seedQuestIndex'te zaten GÜNCEL listeye eşlendi, ikinci eşleme bozardı.
  if (v < 22) {
    if (entryV >= 20) {
      const V21_QUEST_IDS = [
        'q_pickup', 'q_serve1', 'q_coin', 'q_table2', 'q_charTray1', 'q_serve5', 'q_station2',
        'q_wash', 'q_table3', 'q_charTray2', 'q_waiter', 'q_dish', 'q_table4', 'q_charMagnet',
        'q_waiterL2', 'q_tableL2', 'q_zone2', 'q_z2serve', 'q_z2table2', 'q_z2waiter',
        'q_z2table3', 'q_z2dish', 'q_z2table4',
      ];
      const oldIdx = Math.max(0, Number(d.questIndex ?? 0) || 0);
      if (oldIdx >= V21_QUEST_IDS.length) {
        d.questIndex = economyConfig.quests.length;
      } else {
        const ni = economyConfig.quests.findIndex((q) => q.id === V21_QUEST_IDS[oldIdx]);
        if (ni >= 0) d.questIndex = ni;
      }
    }
    // GÜVENLİK (tüm girişler): aktif görev q_zone2'nin İLERİSİNDE ama zone2 pad'i alınmamışsa
    // (eski sırada yükseltme görevleri zone2'den ÖNCEYDİ) q_zone2 atlanmış olur → hat z2 görevlerinde
    // kilitlenirdi. questIndex q_zone2'ye geri çekilir; zaten tamamlanmış sonraki görevler tick'teki
    // auto-advance ile anında geçilir (ilerleme kaybolmaz).
    {
      const zi = economyConfig.quests.findIndex((q) => q.id === 'q_zone2');
      const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
      const qi = Number(d.questIndex ?? 0) || 0;
      if (zi >= 0 && qi > zi && !padsDone.includes('zone2')) d.questIndex = zi;
    }
    v = 22;
  }

  // v22 -> v23 (GÖREV SENKRONU + ZONE-BAŞI SERVİS SAYACI, telefon turu-2 2026-06-11):
  // q_z2serve, q_zone2'nin HEMEN arkasına alındı (salon açılınca görev oyuncuyu zone-1'e geri
  // yollamasın); stats.teasServedByZone eklendi (zone'lu serveTea görevleri o salonu sayar).
  if (v < 23) {
    // Zone-başı servis tohumlama: global sayaç zone-1'e (tarihsel servisler fiilen ağırlıkla z1;
    // z2 payı bilinemez → z2 0'dan sayar — görev "yeni" servis istediğinden adil).
    const st = (d.stats && typeof d.stats === 'object' ? d.stats : {}) as Partial<SaveStats>;
    d.stats = { ...st, teasServedByZone: [Number(st.teasServed ?? 0) || 0, 0] };
    // questIndex İD-eşleme: yalnız entryV >= 22 (v22 SIRASINI ham index olarak kullanan kayıtlar) —
    // daha eski girişler önceki adımlarda zaten GÜNCEL listeye İD ile eşlendi.
    if (entryV >= 22) {
      const V22_QUEST_IDS = [
        'q_pickup', 'q_serve1', 'q_coin', 'q_table2', 'q_charTray1', 'q_serve5', 'q_station2',
        'q_wash', 'q_table3', 'q_charTray2', 'q_waiter', 'q_dish', 'q_table4', 'q_charMagnet',
        'q_zone2', 'q_waiterL2', 'q_tableL2', 'q_z2serve', 'q_z2table2', 'q_z2waiter',
        'q_z2table3', 'q_z2dish', 'q_z2table4',
      ];
      const oldIdx = Math.max(0, Number(d.questIndex ?? 0) || 0);
      if (oldIdx >= V22_QUEST_IDS.length) {
        d.questIndex = economyConfig.quests.length;
      } else {
        const oldId = V22_QUEST_IDS[oldIdx];
        // Eski sırada zone2 ile z2serve ARASINDAKİ yükseltme görevlerindeyse → q_z2serve'e alınır
        // (yoksa yeni sırada q_z2serve sessizce atlanırdı); tamamlanmış yükseltme görevleri
        // sonrasında tick auto-advance ile anında geçilir (ilerleme kaybolmaz).
        const targetId = oldId === 'q_waiterL2' || oldId === 'q_tableL2' ? 'q_z2serve' : oldId;
        const ni = economyConfig.quests.findIndex((q) => q.id === targetId);
        if (ni >= 0) d.questIndex = ni;
      }
    }
    // Aktif görev q_z2serve ise eski questBase GLOBAL sayaca göreydi → yeni sayacın (z2=0) tabanı 0.
    {
      const qi = Number(d.questIndex ?? 0) || 0;
      if (economyConfig.quests[qi]?.id === 'q_z2serve') d.questBase = 0;
    }
    v = 23;
  }

  // v23/v24 -> v25 (2026-06-11 kullanıcı kararı): M4 (tuvalet+depo) ve M5 (maç salonu) GERİ ALINDI;
  // tost salonu (z2) arka-sağa taşındı (konum kayıtta tutulmaz → taşıma migrasyon istemez).
  // v24 kayıtlardaki kaldırılan pad'ler düşülür, harcanan/yarım dolan ₺ İADE edilir (ilerleme
  // kaybolmaz ilkesi). v24'ün tuvalet alanları (paperStock vb.) sona kalan şemaya yazılmayarak düşer;
  // kaldırılan görevlerin (q_wc.., q_zone4..) hepsi listenin SONUNDAYDI → questIndex clamp'i yeter.
  if (v < 25) {
    const removed: Record<string, number> = {
      wc: 3000, cleaner: 2000, zone4: 9000, z4table2: 1200, z4waiter: 1800,
      z4table3: 2600, z4dishwasher: 3400, z4table4: 4500,
    };
    const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
    let refund = 0;
    for (const id of padsDone) if (id in removed) refund += removed[id];
    d.padsDone = padsDone.filter((id) => !(id in removed));
    if (d.padFills && typeof d.padFills === 'object') {
      const fills = { ...(d.padFills as Record<string, number>) };
      for (const id of Object.keys(fills)) {
        if (id in removed) {
          refund += Number(fills[id]) || 0;
          delete fills[id];
        }
      }
      d.padFills = fills;
    }
    if (refund > 0) d.wallet = String((Number(d.wallet) || 0) + refund);
    v = 25;
  }

  // v25 -> v26 (Y1 yemek alanı kimliği): tost salonunun zemini kendi varsayılanına ('yemek' fayansı)
  // ayrılır. Yalnız ESKİ varsayılan ('parke' ya da boş) üstüne yazılır — oyuncunun bilinçli uyguladığı
  // satın-alma teması korunur (parke=varsayılan olduğundan ayrım yapılamaz; tasarlanan kimlik kazanır).
  if (v < 26) {
    const arr = Array.isArray(d.floorThemeByZone) ? [...(d.floorThemeByZone as string[])] : [];
    for (let z = 0; z < MAX_ZONES; z++) {
      if (zoneProduct(z) === 'tost' && (arr[z] == null || arr[z] === 'parke')) arr[z] = defaultFloorTheme(z);
    }
    d.floorThemeByZone = arr;
    v = 26;
  }

  // v26 -> v27 (GÖREV HATTI YENİDEN TASARIMI + Y3 garson tepsileri, 2026-06-12 telefon feedback):
  // q_z2serve KALDIRILDI ("yine 5 çay" tekrarı), q_z3serve → q_tost5 (aynı hedef, yeni başlık);
  // araya çeşit görevleri girdi (q_z2station/q_tableL2x2/q_waiterTray1/q_z3station/q_tostTray1)
  // → questIndex İD-EŞLEMELİ taşınır. waiterUpgrades alanı eklendi (Y3; default 0).
  if (v < 27) {
    if (!d.waiterUpgrades || typeof d.waiterUpgrades !== 'object') {
      d.waiterUpgrades = defaultWaiterUpgrades();
    }
    const quests = economyConfig.quests;
    let oldActiveId: string | null = null;
    // İD-eşleme: yalnız entryV >= 23 (v23-v26 sırasını ham index olarak kullanan kayıtlar);
    // daha eski girişler önceki adımlarda güncel listeye eşlendi (kaçaklar aşağıdaki ağa düşer).
    if (entryV >= 23) {
      const V26_QUEST_IDS = [
        'q_pickup', 'q_serve1', 'q_coin', 'q_table2', 'q_charTray1', 'q_serve5', 'q_station2',
        'q_wash', 'q_table3', 'q_charTray2', 'q_waiter', 'q_dish', 'q_table4', 'q_charMagnet',
        'q_zone2', 'q_z2serve', 'q_waiterL2', 'q_tableL2', 'q_z2table2', 'q_z2waiter',
        'q_z2table3', 'q_z2dish', 'q_z2table4', 'q_zone3', 'q_z3serve', 'q_z3table2',
        'q_z3waiter', 'q_z3table3', 'q_z3dish', 'q_z3table4',
      ];
      // Kaldırılanların en yakın eşdeğeri: q_z3serve ≈ q_tost5 (birebir aynı hedef → questBase
      // korunur, kısmi sayaç ilerlemesi kaybolmaz); q_z2serve'in eşdeğeri yok → sıradaki pad görevi.
      const ALIAS: Record<string, string> = { q_z2serve: 'q_z2table2', q_z3serve: 'q_tost5' };
      const oldIdx = Math.max(0, Number(d.questIndex ?? 0) || 0);
      if (oldIdx >= V26_QUEST_IDS.length) {
        d.questIndex = quests.length;
      } else {
        oldActiveId = ALIAS[V26_QUEST_IDS[oldIdx]] ?? V26_QUEST_IDS[oldIdx];
        const ni = quests.findIndex((q) => q.id === oldActiveId);
        if (ni >= 0) d.questIndex = ni;
      }
    }
    // GÜVENLİK AĞI (tüm girişler — v22'deki q_zone2 geri-çekmesinin GENELLENMİŞ hali): aktif görevin
    // GERİSİNDE pad'i alınmamış pad-görevi kalamaz ("ekranda tek pad" kuralında atlanan pad görevi
    // zinciri kilitler). En erken eksik pad-görevine çekilir; tamamlanmış aradakiler tick'teki
    // auto-advance ile anında geçilir (ilerleme kaybolmaz).
    {
      const padsDone = Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [];
      const qi = Math.max(0, Number(d.questIndex ?? 0) || 0);
      // Hattı BİTİRMİŞ kayda dokunma (yeni görevler dayatılmaz — v20 m2 davranışı; serbest oyunda
      // pad'ler omurga fallback'iyle zaten görünür). Yalnız hat İÇİNDEKİ kayıtlarda geri çek.
      if (qi < quests.length) {
        for (let i = 0; i < qi; i++) {
          const t = quests[i].target;
          if (t.type === 'pad' && !padsDone.includes(t.id)) {
            d.questIndex = i;
            break;
          }
        }
      }
    }
    // questBase tutarlılığı: aktif görev SAYAÇ değilse taban 0 (bayat değer sızmasın); sayaçsa ve
    // görev DEĞİŞTİYSE şimdiki kümülatif değere tohumlanır (delta adil başlar); aynı/eşdeğer sayaç
    // görevindeyse (q_z3serve≈q_tost5 alias'ı dahil) taban KORUNUR — kısmi ilerleme kaybolmaz.
    {
      const qi = Number(d.questIndex ?? 0) || 0;
      const q = quests[qi];
      if (q) {
        const st = (d.stats && typeof d.stats === 'object' ? d.stats : {}) as Partial<SaveStats>;
        const t = q.target as { type: string; zone?: number };
        const counter =
          t.type === 'pickupTea' ? Number(st.teaPickups ?? 0) || 0
          : t.type === 'serveTea'
            ? t.zone != null
              ? Number((st.teasServedByZone ?? [])[t.zone] ?? 0) || 0
              : Number(st.teasServed ?? 0) || 0
          : t.type === 'collectCoin' ? Number(st.coinsCollected ?? 0) || 0
          : t.type === 'washDish' ? Number(st.dishesWashed ?? 0) || 0
          : null;
        if (counter == null) d.questBase = 0;
        else if (q.id !== oldActiveId) d.questBase = counter;
      }
    }
    v = 27;
  }

  // v27 -> v28 (BULAŞIKÇI LEĞENİ, 2026-06-12 telefon feedback turu-4): waiterUpgrades.dishCarry
  // alanı eklendi (default 0 — aşağıdaki normalize bloğu ekler/kelepçeler). Başka şema değişikliği yok.
  if (v < 28) {
    v = 28;
  }

  // Sona kalan v16 şeması: türetilen alanlar (tables/stations/serviceSpeedMult/hasWaiter), eski `padFill`,
  // kaldırılan `trayLevel` ve 'samovar' referansı yazılmaz; stats/questIndex/questBase eklendi (v16).
  const rawStats = (d.stats && typeof d.stats === 'object' ? d.stats : {}) as Partial<SaveStats>;
  return {
    saveVersion: SAVE_VERSION,
    wallet: String(d.wallet ?? '0'),
    diamonds: String(d.diamonds ?? '0'),
    lifetime: String(d.lifetime ?? '0'),
    stationLevels: Array.isArray(d.stationLevels)
      ? (d.stationLevels as number[]).map((n) => Number(n) || 0)
      : [],
    tableLevels: Array.isArray(d.tableLevels) ? (d.tableLevels as number[]).map((n) => Number(n) || 0) : [],
    waiterLevels: Array.isArray(d.waiterLevels)
      ? (d.waiterLevels as number[]).map((n) =>
          Math.min(Number(n) || 0, economyConfig.waiter.moveSpeedByLevel.length - 1),
        )
      : [],
    padsDone: Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [],
    padFills:
      d.padFills && typeof d.padFills === 'object' ? (d.padFills as Record<string, number>) : {},
    stats: {
      teaPickups: Number(rawStats.teaPickups ?? 0) || 0,
      teasServed: Number(rawStats.teasServed ?? 0) || 0,
      coinsCollected: Number(rawStats.coinsCollected ?? 0) || 0,
      dishesWashed: Number(rawStats.dishesWashed ?? 0) || 0,
      waiterServed: Number(rawStats.waiterServed ?? 0) || 0,
      waiterServedByZone: Array.isArray(rawStats.waiterServedByZone)
        ? rawStats.waiterServedByZone.map((n) => Number(n) || 0)
        : [],
      teasServedByZone: Array.isArray(rawStats.teasServedByZone)
        ? rawStats.teasServedByZone.map((n) => Number(n) || 0)
        : [],
    },
    questIndex: Math.max(0, Math.min(Number(d.questIndex ?? 0) || 0, economyConfig.quests.length)),
    questBase: Math.max(0, Number(d.questBase ?? 0) || 0),
    xp: Math.max(0, Number(d.xp ?? 0) || 0),
    settings: (() => {
      const raw = (d.settings && typeof d.settings === 'object' ? d.settings : {}) as Partial<SaveSettings>;
      const def = defaultSettings();
      return {
        sound: typeof raw.sound === 'boolean' ? raw.sound : def.sound,
        music: typeof raw.music === 'boolean' ? raw.music : def.music,
        notifications: typeof raw.notifications === 'boolean' ? raw.notifications : def.notifications,
      };
    })(),
    floorThemeByZone: Array.isArray(d.floorThemeByZone) ? (d.floorThemeByZone as string[]) : [],
    wallThemeByZone: Array.isArray(d.wallThemeByZone) ? (d.wallThemeByZone as string[]) : [],
    ownedCosmetics: Array.isArray(d.ownedCosmetics) ? (d.ownedCosmetics as string[]) : [],
    charUpgrades: (() => {
      const raw = (d.charUpgrades && typeof d.charUpgrades === 'object' ? d.charUpgrades : {}) as Partial<CharUpgrades>;
      const clamp = (stat: keyof CharUpgrades) =>
        Math.max(0, Math.min(Number(raw[stat] ?? 0) || 0, charMaxTier(stat)));
      return { tray: clamp('tray'), magnet: clamp('magnet'), speed: clamp('speed') };
    })(),
    waiterUpgrades: (() => {
      const raw = (d.waiterUpgrades && typeof d.waiterUpgrades === 'object' ? d.waiterUpgrades : {}) as Partial<WaiterUpgrades>;
      return {
        teaTray: Math.max(0, Math.min(Number(raw.teaTray ?? 0) || 0, waiterTrayMaxTier('tea'))),
        tostTray: Math.max(0, Math.min(Number(raw.tostTray ?? 0) || 0, waiterTrayMaxTier('tost'))),
        dishCarry: Math.max(0, Math.min(Number(raw.dishCarry ?? 0) || 0, dishCarryMaxTier())),
      };
    })(),
    charPanelSeen: d.charPanelSeen === true,
    trayTipSeen: d.trayTipSeen === true,
    lastSaved: Number(d.lastSaved ?? Date.now()) || Date.now(),
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.saveVersion === SAVE_VERSION) return { ...defaultSave(), ...(parsed as object) } as SaveData;
    return migrate(parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, lastSaved: Date.now() }));
  } catch {
    /* quota / private mode — sessiz geç */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
