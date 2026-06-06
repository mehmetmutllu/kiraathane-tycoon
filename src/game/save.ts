// localStorage kayıt + saveVersion migrasyon. Backend yok: cihaz = veritabanı.
import { SAVE_VERSION, economyConfig, requiresMet, type PadDef } from '../config/economy.config';

const KEY = 'kiraathane.save';

/**
 * Kalıcı (transient NPC/coin hariç) oyun durumu. Sayılar string Decimal serisi.
 * D-015: tables/stations/serviceSpeedMult/hasWaiter SAKLANMAZ — `padsDone`'dan türetilir
 * (derivedFromPads). Böylece sayaç ile pad listesi yapısal olarak desenkronize olamaz.
 */
export interface SaveData {
  saveVersion: number;
  wallet: string;
  diamonds: string;
  lifetime: string;
  stationLevel: number;
  padsDone: string[];
  /** Aktif pad'lerin kısmi dolumu (pad id → ₺). Aynı anda birden çok pad doldurulabilir (v5). */
  padFills: Record<string, number>;
  lastSaved: number; // epoch ms
}

export function defaultSave(): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    wallet: '0',
    diamonds: '0',
    lifetime: '0',
    stationLevel: 0,
    padsDone: [],
    padFills: {},
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

  // Sona kalan v8 şeması: türetilen alanlar (tables/stations/serviceSpeedMult/hasWaiter) ve eski `padFill` yazılmaz.
  return {
    saveVersion: SAVE_VERSION,
    wallet: String(d.wallet ?? '0'),
    diamonds: String(d.diamonds ?? '0'),
    lifetime: String(d.lifetime ?? '0'),
    stationLevel: Number(d.stationLevel ?? 0) || 0,
    padsDone: Array.isArray(d.padsDone) ? (d.padsDone as string[]) : [],
    padFills:
      d.padFills && typeof d.padFills === 'object' ? (d.padFills as Record<string, number>) : {},
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
