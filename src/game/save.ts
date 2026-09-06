// localStorage kayıt + saveVersion. Backend yok: cihaz = veritabanı.
// v31 (D-058): migrasyon YOK — eski sürüm bulunursa ilerleme sıfırlanır, ayarlar korunur.
import {
  SAVE_VERSION,
  type CharUpgrades,
  type WaiterUpgrades,
} from '../config/economy.config';

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

/** Oyuncu ayarları (v17 persist). Ses/müzik Faz 6'da, bildirimler Capacitor'da (Faz 5/7) okunur. */
export interface SaveSettings {
  sound: boolean;
  music: boolean;
  notifications: boolean;
  /** Dev/teşhis: ekran-üstü FPS + draw-call sayacı (default kapalı; additive — sürüm artmadı). */
  showFps: boolean;
}

export function defaultSettings(): SaveSettings {
  return { sound: true, music: true, notifications: true, showFps: false };
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
  /** Kozmetik mağaza (v19, WP6): ALAN başına seçili zemin/duvar teması + satın alınan sahiplikler
   *  (`kind:id:zN` anahtarları — tekrar seçmek ücretsiz). */
  floorThemeByArea: string[];
  wallThemeByArea: string[];
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
    padsDone: [],
    padFills: {},
    stats: defaultStats(),
    questIndex: 0,
    questBase: 0,
    xp: 0,
    settings: defaultSettings(),
    floorThemeByArea: [],
    wallThemeByArea: [],
    tableTheme: 'mavi',
    ownedCosmetics: [],
    charUpgrades: defaultCharUpgrades(),
    waiterUpgrades: defaultWaiterUpgrades(),
    charPanelSeen: false,
    trayTipSeen: false,
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
 * CLAUDE.md'nin "ilerleme kaybolmaz" kuralı **v1.0 mağazaya çıktığı andan itibaren** bağlayıcıdır;
 * o gün geldiğinde bu fonksiyonun yerini gerçek migrasyon zinciri alır.
 */
export function resetKeepingSettings(raw: Record<string, unknown>): SaveData {
  const def = defaultSave();
  const s = (raw.settings && typeof raw.settings === 'object' ? raw.settings : {}) as Partial<SaveSettings>;
  return {
    ...def,
    settings: {
      sound: typeof s.sound === 'boolean' ? s.sound : def.settings.sound,
      music: typeof s.music === 'boolean' ? s.music : def.settings.music,
      notifications: typeof s.notifications === 'boolean' ? s.notifications : def.settings.notifications,
      showFps: typeof s.showFps === 'boolean' ? s.showFps : def.settings.showFps,
    },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.saveVersion === SAVE_VERSION) return { ...defaultSave(), ...(parsed as object) } as SaveData;
    return resetKeepingSettings(parsed);
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
