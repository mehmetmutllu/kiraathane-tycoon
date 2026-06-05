// localStorage kayıt + saveVersion migrasyon. Backend yok: cihaz = veritabanı.
import { SAVE_VERSION } from '../config/economy.config';

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
  padFill: number;
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
    padFill: 0,
    lastSaved: Date.now(),
  };
}

/** Eski sürüm kayıtları güncel şemaya taşır (ilerleme kaybolmaz). */
function migrate(raw: Record<string, unknown>): SaveData {
  const data = { ...defaultSave(), ...raw } as SaveData;
  let v = typeof raw.saveVersion === 'number' ? raw.saveVersion : 0;

  // v0/v1/v2 -> v3: eksik alanları default'la, türleri normalize et.
  if (v < 3) {
    data.wallet = String(raw.wallet ?? '0');
    data.diamonds = String(raw.diamonds ?? '0');
    data.lifetime = String(raw.lifetime ?? raw.wallet ?? '0');
    data.tables = Number(raw.tables ?? 1) || 1;
    data.stationLevel = Number(raw.stationLevel ?? 0) || 0;
    data.padFill = Number(raw.padFill ?? 0) || 0;
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
    data.padFill = tables >= 2 ? 0 : Number(raw.padFill ?? 0) || 0;
    v = 4;
  }

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
