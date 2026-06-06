// localStorage kayıt + saveVersion migrasyon. Backend yok: cihaz = veritabanı.
import { SAVE_VERSION, economyConfig, requiresMet, type PadDef } from '../config/economy.config';

const KEY = 'kiraathane.save';

/** Kalıcı (transient NPC/coin hariç) oyun durumu. Sayılar string Decimal serisi. */
export interface SaveData {
  saveVersion: number;
  wallet: string;
  diamonds: string;
  lifetime: string;
  tables: number;
  stations: number;
  stationLevel: number;
  serviceSpeedMult: number;
  padsDone: string[];
  /** Aktif pad'lerin kısmi dolumu (pad id → ₺). Aynı anda birden çok pad doldurulabilir (v5). */
  padFills: Record<string, number>;
  /** Garson tutuldu mu (Faz 2d opsiyonel pad). */
  hasWaiter: boolean;
  lastSaved: number; // epoch ms
}

export function defaultSave(): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    wallet: '0',
    diamonds: '0',
    lifetime: '0',
    tables: 1,
    stations: 1,
    stationLevel: 0,
    serviceSpeedMult: 1,
    padsDone: [],
    padFills: {},
    hasWaiter: false,
    lastSaved: Date.now(),
  };
}

/** v4'teki tek `padFill` sayısı hangi omurga pad'ine aitse o id'yi bulur (opsiyoneller atlanır). */
function backbonePadId(g: { padsDone: string[]; tables: number; stationLevel: number; lifetime: number }): string | null {
  const p = (economyConfig.pads as readonly PadDef[]).find(
    (pd) => !pd.optional && !g.padsDone.includes(pd.id) && requiresMet(pd.requires, g),
  );
  return p ? p.id : null;
}

/** Eski sürüm kayıtları güncel şemaya taşır (ilerleme kaybolmaz). */
export function migrate(raw: Record<string, unknown>): SaveData {
  const data = { ...defaultSave(), ...raw } as SaveData;
  let v = typeof raw.saveVersion === 'number' ? raw.saveVersion : 0;
  // v4'e kadar tek sayıydı; v5'te padFills'e taşınır.
  let pendingFill = Number((raw as { padFill?: unknown }).padFill ?? 0) || 0;

  // v0/v1/v2 -> v3: eksik alanları default'la, türleri normalize et.
  if (v < 3) {
    data.wallet = String(raw.wallet ?? '0');
    data.diamonds = String(raw.diamonds ?? '0');
    data.lifetime = String(raw.lifetime ?? raw.wallet ?? '0');
    data.tables = Number(raw.tables ?? 1) || 1;
    data.stationLevel = Number(raw.stationLevel ?? 0) || 0;
    pendingFill = Number(raw.padFill ?? 0) || 0;
    v = 3;
  }

  // v3 -> v4: tek-amaçlı pad → generic pad listesi.
  // Eski tables>=2 ise 'table2' pad'i tamamlanmış sayılır; yarım padFill korunur.
  if (v < 4) {
    const tables = Number(data.tables ?? 1) || 1;
    data.stations = Number(raw.stations ?? 1) || 1;
    data.serviceSpeedMult = Number(raw.serviceSpeedMult ?? 1) || 1;
    data.padsDone = Array.isArray(raw.padsDone)
      ? (raw.padsDone as string[])
      : tables >= 2
        ? ['table2']
        : [];
    if (tables >= 2) pendingFill = 0;
    v = 4;
  }

  // v4 -> v5: tek `padFill` → `padFills` kaydı (eş zamanlı omurga + opsiyonel pad dolumu için).
  // Eski kısmi dolum, o an aktif olan OMURGA pad'ine atanır (ilerleme kaybolmaz). Garson yok.
  if (v < 5) {
    const padsDone = Array.isArray(data.padsDone) ? data.padsDone : [];
    const id = backbonePadId({
      padsDone,
      tables: Number(data.tables ?? 1) || 1,
      stationLevel: Number(data.stationLevel ?? 0) || 0,
      lifetime: Number(data.lifetime ?? 0) || 0,
    });
    data.padFills = pendingFill > 0 && id ? { [id]: pendingFill } : {};
    data.hasWaiter = false;
    v = 5;
  }

  // v5 -> v6: 'station2' pad'i omurgadan çıkarıldı (D-012: salon = 1 ocak : 4 masa; 2. ocak Faz 3a'da).
  // Referansları temizle, tek salonu (tek ocak) koru — ilerleme kaybolmaz (kazanılan ₺/seviye durur).
  if (v < 6) {
    data.padsDone = (Array.isArray(data.padsDone) ? data.padsDone : []).filter((id) => id !== 'station2');
    if (data.padFills && 'station2' in data.padFills) {
      const { station2: _drop, ...rest } = data.padFills;
      void _drop;
      data.padFills = rest;
    }
    data.stations = 1;
    v = 6;
  }

  // v6 -> v7: addTable pad'lerini mevcut masa SAYISIYLA senkronla. Çizili bir masa varken o masanın
  // pad'i bir daha belirmesin (yoksa pad masayla TAM aynı konumda çakışır). i. addTable = (i+2). masa.
  // AYRI sürüm adımı: v6'da takılı kalmış (senkronsuz) kayıtlar da düzelsin diye.
  if (v < 7) {
    data.padsDone = Array.isArray(data.padsDone) ? data.padsDone : [];
    const addTablePads = (economyConfig.pads as readonly PadDef[]).filter((p) => p.effect.type === 'addTable');
    addTablePads.forEach((p, i) => {
      if ((Number(data.tables) || 1) >= i + 2 && !data.padsDone.includes(p.id)) data.padsDone.push(p.id);
    });
    v = 7;
  }

  delete (data as { padFill?: unknown }).padFill;
  data.saveVersion = SAVE_VERSION;
  return data;
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
