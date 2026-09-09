/**
 * dailyQuests.ts — GÜNLÜK GÖREVLER (D8; sayısı D7a/D-093'te ölçüldü).
 *
 * NE: her gün havuzdan seçilen `count` (3) kısa iş; toplam ödül `diamondsPerDay` (10 💎).
 * Elmasın GÜN ölçeğindeki tek arzı budur — Usta kuyruğunu (25 💎/basamak) besleyen kanal.
 * Hedefler (`goals.ts`) KALICI koleksiyondur ve bir kez toplanır; bu dosya her gün sıfırlanan
 * kısa işlerdir. İkisi aynı `RewardModal`ı paylaşır, sayaçları paylaşmaz.
 *
 * ÜÇ SAYI TEK YERDE: `count` · `diamondsPerDay` · havuz eşikleri hepsi `economy.config.ts`te.
 * Ödülün kademeye dağılımı burada TÜRETİLİR (`diamondsFor`) — config'e üç ayrı 💎 sayısı
 * yazılsaydı toplam ile parçaların toplamı sessizce ayrışabilirdi (`goals.incomeBonusTotal`
 * dersinin aynısı, D-090).
 *
 * KİMLİK VE TAZELİK — gün numarası tek girdi.
 *   Seçim `pickIds(gün)` ile DETERMİNİSTİK: kayıtta rastgelelik tohumu YOK, test aynı günü
 *   yeniden üretebilir. Deste kalıbı (`shuffle(cycle)` + kayan imleç) iki şeyi birden verir:
 *   aynı gün içinde tekrar yok, ve uzun vadede şablonlar eşit sıklıkta geliyor — saf rastgele
 *   seçimde "üç gün üst üste aynı görev" mümkündü.
 *
 * NEDEN SEÇİLEN KİMLİKLER YİNE DE KAYITTA: havuz GATE'li (garson/tost şablonları ancak
 * açıksa girer). Seçim gün içinde yeniden türetilseydi, oyuncu öğlen garson tutunca havuz
 * genişler ve sabah aldığı görev altından kayardı. Gün dönümünde bir kez seçilir, gün boyu
 * kimlikler kayıtta durur (`questsDone`/`goalsClaimed` deseni).
 *
 * İLERLEME DELTA'DIR: gün dönümünde sayaçların anlık görüntüsü `base`e yazılır, ilerleme
 * `şimdi − base` olarak okunur (`questBase` deseni, v16). Kalıcı sayaçlar sıfırlanmaz.
 */
import { economyConfig as C, type DailyMetric, type DailyQuestDef } from '../config/economy.config';

/** Bir günün, kayıtta duran hâli. ADDITIVE kayıt alanı — sürüm ARTMAZ. */
export interface DailyState {
  /** Yerel gün numarası (`dayIndex`). Değişince görevler yenilenir. */
  day: number;
  /** Bugünün görev kimlikleri — gün dönümünde bir kez seçilir. */
  ids: string[];
  /** Gün başındaki sayaç anlık görüntüsü (şablon kimliği → sayaç). */
  base: Record<string, number>;
  /** Bugün ödülü ALINMIŞ görev kimlikleri. */
  claimed: string[];
}

export const defaultDaily = (): DailyState => ({ day: -1, ids: [], base: {}, claimed: [] });

/** Havuzun okuduğu ham sayaçlar — durumdan TEK yerde derlenir (HUD sayı hesaplamaz). */
export type DailyCounters = Record<DailyMetric, number>;

/** Gate'lerin baktığı dünya durumu — yalnız gün DÖNÜMÜNDE okunur. */
export interface DailyContext {
  /** Açık masa sayısı — hedef ölçeği. */
  tables: number;
  hasWaiter: boolean;
  tostOpen: boolean;
}

export type DailyQuestState = 'progress' | 'claimable' | 'claimed';

/** Bir günlük görevin tam görünümü — HUD bunu olduğu gibi çizer. */
export interface DailyQuestView {
  id: string;
  /** `{N}` yerine somut hedef konmuş metin. */
  label: string;
  target: number;
  cur: number;
  diamonds: number;
  state: DailyQuestState;
}

/**
 * YEREL gün numarası. UTC değil: oyuncunun "günü" saat 00:00'da döner, Greenwich'te değil.
 * (`getTimezoneOffset` yaz saatiyle değişir; dönüm gecesi bir saatlik kayma zararsızdır —
 * yanlış olan, oyuncunun gecesinin ortasında görev yenilemektir.)
 */
export const dayIndex = (ms: number): number =>
  Math.floor((ms - new Date(ms).getTimezoneOffset() * 60_000) / 86_400_000);

const pool = (): readonly DailyQuestDef[] => C.dailyQuests.pool;

/** Bugün havuza girebilen şablonlar — kapalı sistemin görevi seçilmez (imkânsız görev = kayıp 💎). */
export function availableTemplates(ctx: DailyContext): DailyQuestDef[] {
  return pool().filter((t) =>
    t.gate === 'waiter' ? ctx.hasWaiter : t.gate === 'tost' ? ctx.tostOpen : true);
}

/** Şablonu kimlikten bul (bilinmeyen kimlik = havuzdan kalkmış şablon → görünmez olur). */
export const templateOf = (id: string): DailyQuestDef | undefined => pool().find((t) => t.id === id);

/** Deterministik karıştırıcı (mulberry32) — aynı tohum her yerde aynı desteyi verir. */
function rng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates — `cycle` tohumlu, girdi listesini bozmaz. */
function shuffle<T>(list: readonly T[], cycle: number): T[] {
  const out = list.slice();
  const r = rng(cycle * 0x9e3779b1 + 17);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Günün görev kimlikleri. DESTE KALIBI: imleç `gün × count` konumundan başlar, her `n` şablonluk
 * tur kendi tohumuyla yeniden karılır. Böylece her şablon eşit sıklıkta gelir ve aynı gün içinde
 * tekrar olmaz (imleç deste sınırını aşarsa sonraki destenin başı alınır — `includes` bekçisi
 * o sınırdaki tek olası tekrarı da eler).
 */
export function pickIds(day: number, available: readonly DailyQuestDef[], count: number): string[] {
  const n = available.length;
  if (n === 0 || count <= 0) return [];
  if (n <= count) return available.map((t) => t.id);
  const out: string[] = [];
  let idx = day * count;
  // Üst sınır: en kötü hâlde her tur bir tekrarla karşılaşsa bile `count × n` adımda dolar.
  for (let adim = 0; out.length < count && adim < count * n + n; adim++, idx++) {
    const deste = shuffle(available, Math.floor(idx / n));
    const id = deste[((idx % n) + n) % n].id;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * `i`. görevin 💎 payı. TOPLAM config'te, dağılım burada: taban herkese eşit, artan pay SONA
 * bindirilir (10/3 → 3 · 3 · 4). Parçaların toplamı her zaman `diamondsPerDay`e eşittir.
 */
export function diamondsFor(i: number, count: number, total: number = C.dailyQuests.diamondsPerDay): number {
  if (count <= 0) return 0;
  const taban = Math.floor(total / count);
  const artan = total - taban * count;
  return taban + (i >= count - artan ? 1 : 0);
}

/** Şablonun bugünkü somut hedefi — masa sayısına ölçekli (sabit eşik iki uçta da yanlış olurdu). */
export const targetOf = (t: DailyQuestDef, tables: number): number =>
  Math.max(1, Math.round(t.base + t.perTable * Math.max(0, tables)));

/**
 * GÜN DÖNÜMÜ. Gün değişmediyse ÖNCEKİ NESNEYİ AYNEN döndürür (kimlik korunur → `keepIdentity`
 * gereksiz render yapmaz, `store.tick` bunu her karede çağırabilir).
 */
export function rollDaily(
  prev: DailyState | undefined,
  day: number,
  ctx: DailyContext,
  counters: DailyCounters,
): DailyState {
  if (prev && prev.day === day) return prev;
  const ids = pickIds(day, availableTemplates(ctx), C.dailyQuests.count);
  const base: Record<string, number> = {};
  for (const id of ids) {
    const t = templateOf(id);
    if (t) base[id] = counters[t.metric] ?? 0;
  }
  return { day, ids, base, claimed: [] };
}

/** Bugünün görev kartları — sıra kimlik sırasıdır, 💎 payı o sıradan gelir. */
export function dailyViews(daily: DailyState, ctx: DailyContext, counters: DailyCounters): DailyQuestView[] {
  const claimed = new Set(daily.claimed);
  const out: DailyQuestView[] = [];
  daily.ids.forEach((id, i) => {
    const t = templateOf(id);
    if (!t) return;
    const target = targetOf(t, ctx.tables);
    const cur = Math.max(0, Math.floor((counters[t.metric] ?? 0) - (daily.base[id] ?? 0)));
    out.push({
      id,
      label: t.label.replace('{N}', target.toLocaleString('tr-TR')),
      target,
      cur: Math.min(cur, target),
      diamonds: diamondsFor(i, daily.ids.length),
      state: claimed.has(id) ? 'claimed' : cur >= target ? 'claimable' : 'progress',
    });
  });
  return out;
}

/** Şu an toplanabilir günlük görevlerin sayısı — HUD rozetini besler. */
export const claimableDailyCount = (daily: DailyState, ctx: DailyContext, counters: DailyCounters): number =>
  dailyViews(daily, ctx, counters).filter((v) => v.state === 'claimable').length;

/**
 * Bir günlük görevin ÖDÜLÜ — yalnız gerçekten toplanabilirse döner, yoksa `null`. Doğrulama
 * TEK yerde: store kendi başına eşik kontrolü yapmaz (`claimGoalReward` deseni, D-015 dersi).
 */
export function claimDailyReward(
  id: string,
  daily: DailyState,
  ctx: DailyContext,
  counters: DailyCounters,
): number | null {
  const v = dailyViews(daily, ctx, counters).find((x) => x.id === id);
  return v && v.state === 'claimable' ? v.diamonds : null;
}
