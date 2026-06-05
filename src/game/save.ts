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
  stationLevel: number;
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
    stationLevel: 0,
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
