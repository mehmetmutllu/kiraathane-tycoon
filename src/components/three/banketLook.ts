/**
 * banketLook.ts — BANKET ADASININ O ANKİ HÂLİ: hangi sütun/yüz çizilir, ada hangi kademede.
 *
 * T7 (G-83/G-84, D-141). Kullanıcı: *"önce banketler uzuyacak sonra da minderler gelir … minder
 * koyarken parça parça değil, yarısında var yarısında yok gibi değil, olanda komple"*. İki kural:
 *   BOY    her masa kendi bank YÜZÜNÜ getirir; şerit iç sütundan dışa dolar (`banketUnit`).
 *   KADEME ada TEK kademe taşır. Ada tamamlanana (6 yüz) kadar çıplak ahşap sedirdir; tamamlanınca
 *          kademe = adadaki en düşük masa seviyesi. Böylece minder bütün adaya bir anda gelir ve
 *          yeni masa açılınca hiçbir şey GERİ gitmez (en düşük seviye yalnız ada dolunca okunur).
 * React'e bağlı değil; vitest'te doğrudan sınanır.
 */
import { BANKET, banketColSpan, banketUnit, banketUnitsOpen } from '../../game/layout';
import { areaTableSlots, areaTableStart } from '../../game/world';
import { PALETTE } from '../../config/palette';

export interface BanketSutun {
  side: -1 | 1;
  col: number;
  /** Dünya x merkezi ve sütun boyu (x ekseninde). */
  x: number;
  len: number;
  /** Yüzlerin açık olup olmadığı: [kapı tarafı (+z), tezgâh tarafı (−z)]. */
  yuz: [boolean, boolean];
}

/** Adanın masa (yüz) sayısı: sütun × 2. */
export const ADA_YUZ = BANKET.cols * 2;

/** Kademe tavanı — masa merdiveninin ₺ tavanı (L4) ile aynı basamak. */
export const BANKET_KADEME_MAX = 4;

/** Sahnede çizilecek sütunlar. Şerit açılmadan hiçbir şey çizilmez — kilitli alan çizilmez (D-057). */
export function banketSutunlari(tables: number): BanketSutun[] {
  const acik = banketUnitsOpen(tables);
  const out = new Map<string, BanketSutun>();
  for (let u = 0; u < acik; u++) {
    const { side, col, face } = banketUnit(u);
    const k = `${side}:${col}`;
    let s = out.get(k);
    if (!s) {
      const [d0, d1] = banketColSpan(col);
      s = { side, col, x: side * (BANKET.outerX - (d0 + d1) / 2), len: d1 - d0, yuz: [false, false] };
      out.set(k, s);
    }
    s.yuz[face === 1 ? 0 : 1] = true;
  }
  return [...out.values()];
}

/** Bir adanın masa indeksleri (açık olsun olmasın), şerit sırasıyla. */
export function adaMasalari(side: -1 | 1): number[] {
  const out: number[] = [];
  for (let u = 0; u < areaTableSlots(2); u++) if (banketUnit(u).side === side) out.push(areaTableStart(2) + u);
  return out;
}

/** Adanın görünüş kademesi (0…4): ada dolmadan 0, dolunca masalarının en düşük seviyesi. */
export function banketKademe(tables: number, levels: readonly number[], side: -1 | 1): number {
  const masalar = adaMasalari(side);
  if (masalar.some((t) => t >= tables)) return 0;
  return Math.min(BANKET_KADEME_MAX, ...masalar.map((t) => levels[t] ?? 0));
}

/**
 * Kademenin görünüşü — her basamak bütün adaya bir şey EKLER, hiçbir basamak boş geçmez
 * (`feedback_upgrade_legibility`: madde + renk birlikte, tek sinyal yetmez).
 *   0 çıplak ahşap sedir · 1 keten oturak minderi · 2 minder bordoya döner + sırt minderi
 *   3 + yastıklar · 4 + pirinç biye + kapitone düğme (Usta'ya giden son ₺ basamağı)
 */
export interface BanketGorunus {
  oturak: string | null;
  sirt: string | null;
  yastik: readonly string[] | null;
  biye: string | null;
  kapitone: boolean;
}

export const BANKET_RENK = {
  keten: '#c9a46a',
  bordo: PALETTE.banketCushion,
  yastik: PALETTE.banketPillow,
  hardal: '#d9a441',
  pirinc: '#d4af37',
} as const;

export function banketGorunus(kademe: number): BanketGorunus {
  const k = Math.max(0, Math.min(BANKET_KADEME_MAX, kademe));
  const R = BANKET_RENK;
  return {
    oturak: k === 0 ? null : k === 1 ? R.keten : R.bordo,
    sirt: k >= 2 ? R.bordo : null,
    yastik: k >= 4 ? [R.yastik, R.hardal] : k >= 3 ? [R.yastik] : null,
    biye: k >= 4 ? R.pirinc : null,
    kapitone: k >= 4,
  };
}
