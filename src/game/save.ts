// localStorage kayıt + saveVersion migrasyon. Backend yok: cihaz = veritabanı.
import { SAVE_VERSION, economyConfig, requiresMet, type PadDef, type QuestTarget } from '../config/economy.config';

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
}

export function defaultStats(): SaveStats {
  return { teaPickups: 0, teasServed: 0, coinsCollected: 0, dishesWashed: 0, waiterServed: 0 };
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
  lastSaved: number; // epoch ms
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
  const stateMet = (t: QuestTarget): boolean | null => {
    switch (t.type) {
      case 'pad': return padsDone.includes(t.id);
      case 'stationLevel': return stationLevel >= t.level;
      case 'waiterLevel': return waiterLevel >= t.level;
      case 'tableLevel': return tableLevels.some((l) => l >= t.level);
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
