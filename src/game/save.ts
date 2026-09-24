// localStorage kayıt + saveVersion. Backend yok: cihaz = veritabanı.
// v31 (D-058): migrasyon YOK — eski sürüm bulunursa ilerleme sıfırlanır, ayarlar korunur.
// v32 (D-088): görev hattının kimliği sıra numarası olmaktan çıktı → GERÇEK migrasyon (aşağıda).
import { defaultDaily, type DailyState } from './dailyQuests';
import {
  economyConfig as C,
  type CharUpgrades,
  type WaiterUpgrades,
} from '../config/economy.config';
import { activeQuestIndex, completedQuestIds } from './questProgress';
import type { LevelUpOdul } from './rules';

/**
 * KAYIT ŞEMASI SÜRÜMÜ. Bir denge sayısı değil, bu dosyanın kendi kavramı — bu yüzden
 * `economy.config.ts`'te değil burada durur (D-088; orada dururken her sürüm artışı varyant
 * kapısının commit denetimini boşuna tetikliyordu).
 *
 * 31 → 32: `questIndex: number` yerine `questsDone: string[]` (+ tabanın sahibi `questBaseId`).
 * 33 → 34: garson tepsi kademesinin ANLAMI değişti (D-142: taban 1 → 2, ilk kademe düştü).
 */
export const SAVE_VERSION = 34;

const KEY = 'kiraathane.save';

/**
 * Kalıcı (transient NPC/coin hariç) oyun durumu. Sayılar string Decimal serisi.
 * D-015: masa/servis/personel SAKLANMAZ — `padsDone`'dan türetilir (`deriveWorld`, world.ts).
 * Böylece sayaç ile pad listesi yapısal olarak desenkronize olamaz.
 */
/** Kalıcı oyun sayaçları (quest sistemi v16): oyuncu eylemleri + garson taşıması. */
export interface SaveStats {
  /** Oyuncunun ocaktan tepsiye aldığı toplam çay. */
  teaPickups: number;
  /** Oyuncunun ELİYLE masaya bıraktığı toplam ÜRÜN — çay + tost (garson hariç). */
  teasServed: number;
  /** Oyuncunun ELİYLE masaya bıraktığı toplam TOST (B2: tost artık salona değil tezgâh L5'e bağlı,
   *  bu yüzden "tost servis et" görevi alan sayacıyla değil kendi sayacıyla ölçülür). */
  tostServed: number;
  /** Yerden toplanan toplam para adedi. */
  coinsCollected: number;
  /** Oyuncunun ELİYLE bulaşıkta yıkadığı toplam kirli bardak (bulaşıkçı hariç). */
  dishesWashed: number;
  /** Garsonun bugüne dek taşıdığı toplam çay (arka-plan reveal şartları). */
  waiterServed: number;
  /** SERVİS-BAŞINA garson taşıma sayacı (v21): her servisin hızlandırma noktası KENDİ garsonunun
   *  işini sayar (yeni garson tutulur tutulmaz hızlandırma belirmesin — sindirme ilkesi). */
  waiterServedByService: number[];
  /** ALAN-BAŞINA oyuncu el servisi (v23): alanlı serveTea görevleri YALNIZ o alandaki servisi
   *  sayar — eski global sayaç "Yeni salonda 5 çay" görevini 1. alanda da dolduruyordu. */
  teasServedByArea: number[];
}

export function defaultStats(): SaveStats {
  return {
    teaPickups: 0,
    teasServed: 0,
    tostServed: 0,
    coinsCollected: 0,
    dishesWashed: 0,
    waiterServed: 0,
    waiterServedByService: [],
    teasServedByArea: [],
  };
}

/** Oyuncu ayarları (v17 persist). Bildirimler Capacitor'da (Faz 5/7) okunur. */
export interface SaveSettings {
  sound: boolean;
  music: boolean;
  notifications: boolean;
  /**
   * Olay seslerinin seviyesi, 0..1 (S9 · D-122). Anahtarın yanında AYRI durur: "kapat" ile
   * "kıs" farklı isteklerdir — oyuncu sesi tamamen kapatmadan mekânı sessizleştirebilmeli.
   * 1 = bugüne kadarki davranış, yani eski kayıt hiçbir şey kaybetmez.
   */
  soundVolume: number;
  /**
   * Müziğin seviyesi, 0..1. TAVANI ölçülmüş: 1 = `music.ts`teki kazanç, yani dokuz olay sesini
   * kendi bandında +12 dB üstte tutan EN YÜKSEK müzik seviyesi. Slider bu tavanın altını gezer;
   * üstüne çıkamaz, çünkü o an müzik oyunun kendi geri bildirimini örtmeye başlar.
   */
  musicVolume: number;
  /**
   * GÖLGE TERCİHİ (F2 · D-125). 'oto' = cihaz sınıfı karar verir (`game/cihazSinifi.ts`),
   * 'acik'/'kapali' = oyuncunun açık tercihi, ölçümü ezer.
   * ADDITIVE alan → saveVersion ARTMADI (`lavaboLevel` emsali): `ayarlariBirlestir` eksik
   * alanı varsayılanla doldurur, eski kayıt hiçbir şey kaybetmez.
   */
  golge: 'oto' | 'acik' | 'kapali';
}

export function defaultSettings(): SaveSettings {
  return { sound: true, music: true, notifications: true, soundVolume: 1, musicVolume: 1, golge: 'oto' };
}

/**
 * KAYITTAN GELEN AYARLARI VARSAYILANLARLA BİRLEŞTİRİR — ve bu, `loadSave`daki sessiz bir
 * açığı kapatıyor.
 *
 * `{ ...defaultSave(), ...parsed }` yüzeysel bir yayılımdır: `parsed.settings` varsa
 * varsayılan ayar nesnesinin TAMAMINI değiştirir, alan alan birleştirmez. Yani ayarlara
 * eklenen her yeni alan, GÜNCEL SÜRÜMLÜ eski bir kayıtta `undefined` kalırdı — göç bile
 * çalışmazdı, çünkü sürüm zaten güncel. Ses seviyesi bu tuzağa düşerdi: `undefined` bir
 * çarpan sesi tamamen susturur.
 *
 * Buradaki birleştirme alan başına değil NESNE düzeyinde yapılıyor ve bu bilerek: kayıt bir
 * alanı taşımıyorsa varsayılanı geçer, taşıyorsa oyuncunun seçimi geçer.
 *
 * AYNI KAPI, ALAN SİLMEYİ DE KARŞILIYOR (R3 · D-128, `showFps` kaldırıldı): birleştirme
 * BİLİNEN alanları tek tek seçtiği için, eski kayıttaki fazla alan sessizce düşer —
 * `saveVersion` bu yüzden artmadı ve eski kayıt hiçbir şey kaybetmedi.
 */
export function ayarlariBirlestir(ham: unknown): SaveSettings {
  const s = (ham && typeof ham === 'object' ? ham : {}) as Partial<SaveSettings>;
  const d = defaultSettings();
  const oran = (v: unknown, varsayilan: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : varsayilan;
  return {
    sound: typeof s.sound === 'boolean' ? s.sound : d.sound,
    music: typeof s.music === 'boolean' ? s.music : d.music,
    notifications: typeof s.notifications === 'boolean' ? s.notifications : d.notifications,
    soundVolume: oran(s.soundVolume, d.soundVolume),
    musicVolume: oran(s.musicVolume, d.musicVolume),
    golge: s.golge === 'acik' || s.golge === 'kapali' || s.golge === 'oto' ? s.golge : d.golge,
  };
}

export interface SaveData {
  saveVersion: number;
  wallet: string;
  diamonds: string;
  lifetime: string;
  /** SERVİS başına ocak seviyesi (v18; index = servis noktası, D-022). */
  stationLevels: number[];
  /** Masa-başı yükseltme seviyeleri (Faz 2h; index = GLOBAL masa slotu; bahşiş+sabır). */
  tableLevels: number[];
  /** ODA: lavabo seviyesi (B4; 0 = oda kapalı). ADDITIVE alan → sürüm ARTMADI: `defaultSave()`
   *  yayılımı eksik alanı 0 ile doldurur, eski v31 kaydı lavabosuz ama sağlam açılır (additive alan deseni). */
  lavaboLevel: number;
  padsDone: string[];
  /** Aktif pad'lerin kısmi dolumu (pad id → ₺). Aynı anda birden çok pad doldurulabilir (v5). */
  padFills: Record<string, number>;
  /**
   * KISMİ ÖDENMİŞ YÜKSELTMELER (G-78, 2026-09-18). ADDITIVE alan → sürüm ARTMADI
   * (`lavaboLevel`/`goalsClaimed`/`mastersOwned` deseni: eksik alanı `defaultSave()` yayılımı
   * doldurur, eski kayıt sağlam açılır).
   *
   * NEDEN EKLENDİ — kullanıcı 2026-09-18: *"çay ocağında yükseltmede 800 altından 300'ünü falan
   * ödeyerek bıraktım, sonra da geri girdim; para zaten verilmişti ama yükseltmede sıfırdan
   * başlıyordu."* Doğrulandı: `padFills` kaydediliyordu ama YÜKSELTME dolumlarının üçü de
   * kaydedilmiyordu, `store.init` her yüklemede sıfıra çekiyordu. Para cüzdandan çıkmıştı →
   * oyuncunun ilerlemesi yanıyordu. CLAUDE.md: *"ilerleme kaybolmaz."*
   *
   * Pad dolumu neden `Record` de bunlar dizi: pad kimliği stringtir ve seyrektir; yükseltmeler
   * SLOT'a bağlıdır (servis index'i / global masa slotu) ve zaten dizi olarak tutuluyorlar.
   */
  /** Servis noktası başına kısmi yükseltme dolumu (₺; index = servis noktası). */
  upgradeFills: number[];
  /** Masa başına kısmi yükseltme dolumu (₺; index = GLOBAL masa slotu). */
  tableUpgradeFills: number[];
  /** Lavabonun kısmi yükseltme dolumu (₺). */
  lavaboFill: number;
  /** Kalıcı eylem sayaçları (quest + arka-plan reveal şartları; v16). */
  stats: SaveStats;
  /** TAMAMLANMIŞ görev kimlikleri (v32; D-088). Konumun TEK kaynağı — index saklanmaz, aktif
   *  görev `activeQuestIndex` ile buradan türetilir (questProgress.ts). `padsDone` deseni. */
  questsDone: string[];
  /** TOPLANMIŞ hedef kimlikleri (D3/D-089; `<kategori>:<kademe>`). `questsDone` deseni: kademe
   *  index'i SAKLANMAZ, her okumada sayaçtan türetilir (`src/game/goals.ts`). ADDITIVE alan →
   *  sürüm ARTMADI: `defaultSave()` yayılımı eksik alanı `[]` ile doldurur, eski v32 kaydı
   *  hedefsiz ama sağlam açılır (`lavaboLevel` deseni). */
  goalsClaimed: string[];
  /** D-093: USTA olmuş objelerin kimlikleri. Additive — kayıt sürümü ARTMADI; eski kayıtta
   *  alan yoksa boş liste okunur (`goalsClaimed`in v32'deki deseni). */
  mastersOwned: string[];
  /** D8: bugünün günlük görevleri (gün · kimlikler · sayaç tabanı · toplananlar). Additive →
   *  sürüm ARTMADI: eksik alan `defaultDaily()` ile dolar, `day: -1` ilk tick'te dönümü tetikler
   *  (`mastersOwned` deseni). Kimlikler NEDEN saklanıyor: havuz gate'li, gün içinde yeniden
   *  türetilse oyuncunun sabah aldığı görev öğlen altından kayardı (`dailyQuests.ts` başlığı). */
  daily: DailyState;
  /** Aktif SAYAÇ görevinin başlangıç sayaç değeri (delta hedefi için taban; v16). */
  questBase: number;
  /** Tabanın AİT OLDUĞU görevin kimliği (v32). Konum bilgisi değil sahiplik etiketi: yüklemede
   *  türetilen aktif görev bu değilse taban bayattır ve sıfırdan kurulur (store.init). */
  questBaseId: string;
  /** Toplam oyuncu XP'si (v17; level `levelProgress(xp)` ile türetilir — ayrı saklanmaz). */
  xp: number;
  /** Oyuncu ayarları (v17). */
  settings: SaveSettings;
  /** Kozmetik mağaza (v19, WP6): ALAN başına seçili zemin/duvar teması + satın alınan sahiplikler
   *  (`kind:id:zN` anahtarları — tekrar seçmek ücretsiz). */
  floorThemeByArea: string[];
  wallThemeByArea: string[];
  /** GLOBAL mutfak teması (v33, S4): tezgâh + dolap + zemin rengi. */
  kitchenTheme: string;
  /** GLOBAL masa teması id'si (mobilya minder+örtü rengi). */
  tableTheme: string;
  ownedCosmetics: string[];
  /** Karakter yükseltme kademeleri (v20): tepsi/mıknatıs/hız. Karakter seviyesi türetilir. */
  charUpgrades: CharUpgrades;
  /** Garson tepsi (v27/Y3) + bulaşıkçı leğen (v28) + personel hız (v29) kademeleri.
   *  v29: eski servis-başı `waiterLevels` buraya katlandı (teaSpeed/tostSpeed) ve kaldırıldı. */
  waiterUpgrades: WaiterUpgrades;
  /** Karakter paneli ilk-sefer spotlight'ı görüldü mü (v20; butona dokununca true, bir daha çıkmaz). */
  charPanelSeen: boolean;
  /** Tepsi-boşalt butonu ilk-sefer spotlight'ı görüldü mü (v23; charPanelSeen deseni). */
  trayTipSeen: boolean;
  /**
   * BULAŞIK ÖĞRETME KARTI görüldü mü (G-63, 2026-09-18). ADDITIVE alan → sürüm ARTMADI
   * (`trayTipSeen` deseni; eksik alanı `defaultSave()` yayılımı `false` ile doldurur).
   *
   * NEDEN VAR — kullanıcı: *"'bulaşık yıka' diyor ama öyle bir şey olmaması gerekiyor. Ona bir
   * uyarıcı, bir modal tarzı bir şey… 'müşteriler çay içtikten sonra masalarda kirli çay birikmeye
   * başlar, bunları alıp bulaşık tezgâhına bırakman gerekiyor' … ondan sonra görev gelmeli."*
   * Mekanik (kirli bardak) ile GÖREV aynı anda doğuyordu; arada öğretme yoktu.
   */
  washTipSeen: boolean;
  /** T9c/A7: alınmamış seviye ödülü (yalnız ₺ > 0 iken). Ekran açıkken uygulama kapanırsa ödül
   *  yanıyordu; yüklemede ekran geri gelir. Additive → sürüm ARTMADI (`washTipSeen` deseni). */
  levelUp: LevelUpOdul | null;
  lastSaved: number; // epoch ms
}

export function defaultCharUpgrades(): CharUpgrades {
  return { tray: 0, magnet: 0, speed: 0 };
}

export function defaultWaiterUpgrades(): WaiterUpgrades {
  return { tray: 0, speed: 0, dishCarry: 0, dishSpeed: 0 };
}

export function defaultSave(): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    wallet: '0',
    diamonds: '0',
    lifetime: '0',
    stationLevels: [],
    tableLevels: [],
    lavaboLevel: 0,
    padsDone: [],
    padFills: {},
    upgradeFills: [],
    tableUpgradeFills: [],
    lavaboFill: 0,
    stats: defaultStats(),
    questsDone: [],
    goalsClaimed: [],
    mastersOwned: [],
    daily: defaultDaily(),
    questBase: 0,
    questBaseId: '',
    xp: 0,
    settings: defaultSettings(),
    floorThemeByArea: [],
    wallThemeByArea: [],
    kitchenTheme: 'klasik',
    tableTheme: 'mavi',
    ownedCosmetics: [],
    charUpgrades: defaultCharUpgrades(),
    waiterUpgrades: defaultWaiterUpgrades(),
    charPanelSeen: false,
    trayTipSeen: false,
    washTipSeen: false,
    levelUp: null,
    lastSaved: Date.now(),
  };
}

/**
 * KAYIT v31 — TEMİZ SIFIRLAMA, MİGRASYON YOK (D-058 karar 3).
 *
 * Faz B kat 1'in yapısını (alan/servis/masa zinciri) baştan kuruyor: eski kayıtlardaki
 * `padsDone: ['table2','zone2','z3table4'…]` kimliklerinin yeni zincirde karşılığı YOK.
 * Artık var olmayan bir zincir için migrasyon yazılmaz — eski kayıt bulunursa ilerleme sıfırlanır,
 * yalnız AYARLAR (ses · müzik · bildirim · FPS) korunur.
 *
 * Bu fonksiyon artık yalnız **v31'den ESKİ** (ya da tanınmayan) kayıtların düşüş yeri: göç zinciri
 * v32 ile başladı (`migrateV31`). CLAUDE.md'nin "ilerleme kaybolmaz" kuralı v1.0 mağazaya çıktığı
 * andan itibaren bağlayıcı; o gün geldiğinde buraya düşen kayıt kalmamalı.
 */
export function resetKeepingSettings(raw: Record<string, unknown>): SaveData {
  return { ...defaultSave(), settings: ayarlariBirlestir(raw.settings) };
}

/**
 * MİGRASYON v31 → v32 (D-088) — v31'in temiz-sıfırlamasından sonraki İLK gerçek göç.
 *
 * v31'de sıfırlama meşruydu: zincir kimliklerinin yeni modelde karşılığı YOKTU. Burada öyle bir
 * durum yok — hattın görevleri aynı, değişen yalnız KAYDIN o hattı nasıl işaret ettiği. Bu yüzden
 * CLAUDE.md'nin "şema değişince eski kayıt migrate edilir, ilerleme kaybolmaz" kuralı uygulanır.
 *
 * Dönüşüm tek satır: eski `questIndex` bugünkü hattın o index'ine kadarki KİMLİKLERİNE çevrilir.
 * Bu, göçün yapılabildiği tek an — v31 kaydı yazıldığında hat neyse index onu gösteriyordu ve
 * hat o günden bu yana değişmedi. Göçten sonra kaydın konumu bir daha sıra numarasına bağlı olmaz.
 */
/**
 * MİGRASYON v32 → v33 (S4) — mutfak teması eklendi.
 *
 * Şema EKLEMELİ değişti: yeni alan `kitchenTheme`, eski kayıtta yok. İlerlemeyi etkileyen
 * hiçbir şey değişmediği için göç tek satır — varsayılan tema ('klasik') eski kaydın üstüne
 * eklenir ve oyuncu bugüne kadarki her şeyiyle devam eder. CLAUDE.md: *"şema değişince eski
 * kayıt migrate edilir; ilerleme kaybolmaz."*
 */
function migrateV32(raw: Record<string, unknown>): Record<string, unknown> | null {
  if (raw.saveVersion !== 32) return null;
  return {
    ...defaultSave(),
    ...(raw as object),
    saveVersion: 33,
    kitchenTheme: typeof raw.kitchenTheme === 'string' ? raw.kitchenTheme : 'klasik',
  };
}

/**
 * MİGRASYON v33 → v34 (T8a · D-142) — garson tepsisi 2'li başlıyor.
 *
 * Kapasite = taban + kademe. Taban 1 → 2 oldu ve ₺400'lük ilk kademe merdivenden düştü (tavan
 * yine 4). Kayıtta yalnız KADEME durur; aynı sayı yeni tabanla bir fazla kapasite demek olurdu.
 * Göç kademeyi bir indirir → oyuncunun elindeki kapasite AYNEN korunur (kademe 0'daki oyuncu
 * 1 → 2 kazanır; bu kararın kendisi). Görev kimlikleri dokunulmaz: `q_waiterTray1` hattan çıktı,
 * kaydın listesinde zararsızca durur (D-088).
 */
function migrateV33(raw: Record<string, unknown>): Record<string, unknown> | null {
  if (raw.saveVersion !== 33) return null;
  const wu = (raw.waiterUpgrades ?? {}) as Partial<WaiterUpgrades>;
  return {
    ...raw,
    saveVersion: 34,
    waiterUpgrades: { ...wu, tray: Math.max(0, (wu.tray ?? 0) - 1) },
  };
}

function migrateV31(raw: Record<string, unknown>): Record<string, unknown> | null {
  if (raw.saveVersion !== 31) return null;
  const index = typeof raw.questIndex === 'number' ? raw.questIndex : 0;
  const questsDone = completedQuestIds(C.quests, index);
  const active = C.quests[activeQuestIndex(C.quests, questsDone)];
  const { questIndex: _drop, ...rest } = raw as Record<string, unknown> & { questIndex?: number };
  return {
    ...defaultSave(),
    ...(rest as object),
    saveVersion: 33,
    questsDone,
    questBase: typeof raw.questBase === 'number' ? raw.questBase : 0,
    // Taban eski kayıtta aktif olan görevin tabanıydı; göç konumu değiştirmediği için sahibi de aynı.
    questBaseId: active?.id ?? '',
  };
}

/**
 * T9c/A6 — kaydı varsayılanla DERİN birleştirir. Yüzeysel `...` iç alanları kurtarmıyordu: eksik
 * `stats.waiterServedByService` her karede TypeError, `padsDone: null` init'te çöküş (beyaz ekran).
 * Kural: nesne → anahtar anahtar iner (kayıttaki fazla anahtarlar korunur — `padFills` gibi
 * sözlükler); dizi → kayıttaki dizi ya da varsayılan; ilkel → tür tutuyorsa kayıt, tutmuyorsa
 * varsayılan (sayı ↔ dizge Decimal alanları için çevrilir). Varsayılanı `null` olan alan kaydı
 * olduğu gibi alır (anlamını okuyan doğrular).
 */
export function derinBirlestir(def: unknown, raw: unknown): unknown {
  if (raw === undefined) return def;
  if (def === null || def === undefined) return raw;
  if (Array.isArray(def)) return Array.isArray(raw) ? raw : def;
  if (typeof def === 'object') {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return def;
    const out: Record<string, unknown> = { ...(def as Record<string, unknown>) };
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      out[k] = k in out ? derinBirlestir(out[k], v) : v;
    }
    return out;
  }
  if (typeof def === 'number') {
    const n = typeof raw === 'string' ? Number(raw) : raw;
    return typeof n === 'number' && Number.isFinite(n) ? n : def;
  }
  if (typeof def === 'string' && typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return typeof raw === typeof def ? raw : def;
}

/**
 * T9c/A5 — YAZMA KİLİDİ. Kayıt bu paketten DAHA YENİ sürümle yazılmışsa (eski APK'ya geri dönüş)
 * eskiden `resetKeepingSettings` ilerlemeyi siliyor, 2 sn sonra periyodik kayıt da yeni kaydın
 * üstüne yazıyordu. Artık kayıt en iyi çabayla okunur ve bu oturumda DİSKE YAZILMAZ — yeni sürüm
 * yüklendiğinde kayıt olduğu gibi durur. Kilidi yalnız bilinçli sıfırlama (`clearSave`) açar.
 */
let yazmaKilidi = false;
export function kayitKilitli(): boolean {
  return yazmaKilidi;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Ayarlar HER yolda birleştirilir: yüzeysel yayılım eski kaydın eksik ayar alanlarını
    // `undefined` bırakırdı ve göç bunu yakalayamazdı (sürüm zaten güncel). Bkz. `ayarlariBirlestir`.
    const ayarla = (d: Record<string, unknown>): SaveData => {
      const b = derinBirlestir(defaultSave(), d) as SaveData;
      return { ...b, saveVersion: SAVE_VERSION, settings: ayarlariBirlestir(d.settings) };
    };
    yazmaKilidi = typeof parsed.saveVersion === 'number' && parsed.saveVersion > SAVE_VERSION;
    if (parsed.saveVersion === SAVE_VERSION || yazmaKilidi) return ayarla(parsed);
    // Göç zinciri ADIM ADIM: her göç bir sonraki sürümü üretir (v31 → v33 → v34, v32 → v33 → v34).
    let d: Record<string, unknown> | null = parsed;
    for (const goc of [migrateV31, migrateV32, migrateV33]) d = (d && goc(d)) ?? d;
    return d && d.saveVersion === SAVE_VERSION ? ayarla(d) : resetKeepingSettings(parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  if (yazmaKilidi) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, lastSaved: Date.now() }));
  } catch {
    /* quota / private mode — sessiz geç */
  }
}

export function clearSave(): void {
  yazmaKilidi = false;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
