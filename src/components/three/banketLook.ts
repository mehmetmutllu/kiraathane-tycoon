/**
 * banketLook.ts — BANKET ADASININ O ANKİ HÂLİ: hangi sütun çizilir, her yüz hangi kademede.
 *
 * T7 (G-83/G-84): ada artık tek parça "donanım" değil, SÜTUN × YÜZ parçalarından kurulur. Her yüz
 * tam olarak bir banket birimidir (bir masa) ve o masanın SEVİYESİNİ taşır — obje-başı yükseltme.
 * React'e bağlı değil; vitest'te doğrudan sınanır.
 */
import { BANKET, banketUnit, banketUnitsOpen } from '../../game/layout';
import { areaTableSlots, areaTableStart } from '../../game/world';
import type { Buyume, Gorunus } from '../../game/banketAday';

/** Sütun sınırları, adanın DIŞ ucundan içeri uzaklık: 0 · 2,2 · 5,4 · 7,6 (= banketLen(3)). */
const SINIR = [0, BANKET.endPad + BANKET.colGap / 2, BANKET.endPad + 1.5 * BANKET.colGap, 2 * BANKET.endPad + 2 * BANKET.colGap];

export type YuzDurum = 'acik' | 'iskelet' | 'yok';

export interface BanketYuz {
  face: -1 | 1;
  durum: YuzDurum;
  /** O yüzün masasının seviyesi (açık değilse 0). */
  level: number;
}

export interface BanketSutun {
  side: -1 | 1;
  col: number;
  /** Dünya x merkezi ve sütun boyu (x ekseninde). */
  x: number;
  len: number;
  /** Sırtlık: yüzlerden biri açıksa 'acik', yalnız iskelet sütunsa 'iskelet'. */
  sirt: Exclude<YuzDurum, 'yok'>;
  yuzler: [BanketYuz, BanketYuz];
}

/** Görünüş kademesi (yüz başına): masa merdiveniyle AYNI basamaklar (Tables.tsx). */
export interface YuzGorunus {
  /** Oturak minderi var mı (L2+ — taburenin minderlendiği basamak). */
  minder: boolean;
  /** Sırtlık minderi (L3+ — masanın büyüdüğü basamak). */
  sirtMinder: boolean;
  /** Yastıklar (L4+ — örtünün geldiği basamak). */
  yastik: boolean;
  /** Minder rengi. */
  renk: string;
  /** Ön kenar şeridi (biye / kilim) — yoksa null. */
  serit: string[] | null;
}

const BORDO = '#7a2230';
const BORDO_ACIK = '#9c3a45';
const KETEN = '#b8894a';
const PIRINC = '#d4af37';
const KILIM = ['#d9a441', '#2f5d7c', '#f3ecd9', '#b23a2e'];

export function yuzGorunus(gorunus: Gorunus, level: number): YuzGorunus {
  if (gorunus === 'R0') return { minder: true, sirtMinder: true, yastik: true, renk: BORDO, serit: null };
  const minder = level >= 2;
  const sirtMinder = level >= 3;
  const yastik = level >= 4;
  if (gorunus === 'R1') return { minder, sirtMinder, yastik, renk: BORDO, serit: null };
  if (gorunus === 'R2') {
    return { minder, sirtMinder, yastik, renk: level >= 3 ? BORDO : KETEN, serit: yastik ? [PIRINC] : null };
  }
  return { minder, sirtMinder, yastik, renk: BORDO, serit: yastik ? KILIM : null };
}

export const YASTIK_RENGI = (gorunus: Gorunus, i: number): string =>
  gorunus === 'R3' ? KILIM[i % KILIM.length] : BORDO_ACIK;

/**
 * Sahnede çizilecek sütunlar. `tables` = açık masa sayısı, `levels` = masa seviyeleri (global).
 * Şerit açılmadan (a2'nin ilk masası) hiçbir şey çizilmez — kilitli alan çizilmez (D-057).
 */
export function banketSutunlari(tables: number, levels: readonly number[], buyume: Buyume): BanketSutun[] {
  const acik = banketUnitsOpen(tables);
  if (acik === 0) return [];
  // (side, col, face) → masa index'i; açık değilse -1.
  const birim = new Map<string, number>();
  for (let u = 0; u < areaTableSlots(2); u++) {
    const { side, col, face } = banketUnit(u);
    birim.set(`${side}:${col}:${face}`, u < acik ? areaTableStart(2) + u : -1);
  }
  const out: BanketSutun[] = [];
  for (const side of [-1, 1] as const) {
    for (let col = 0; col < BANKET.cols; col++) {
      const yuzler = ([1, -1] as const).map((face) => {
        const t = birim.get(`${side}:${col}:${face}`) ?? -1;
        return { face, acik: t >= 0, level: t >= 0 ? (levels[t] ?? 0) : 0 };
      });
      const herhangi = yuzler.some((y) => y.acik);
      let durumlar: YuzDurum[];
      if (buyume === 'B0') durumlar = ['acik', 'acik'];
      else if (buyume === 'B3') durumlar = yuzler.map((y) => (y.acik ? 'acik' : 'iskelet'));
      else if (!herhangi) continue;
      else if (buyume === 'B1') durumlar = ['acik', 'acik'];
      else durumlar = yuzler.map((y) => (y.acik ? 'acik' : 'yok')); // B2 · B4
      const d0 = SINIR[col];
      const d1 = SINIR[col + 1];
      out.push({
        side,
        col,
        x: side * (BANKET.outerX - (d0 + d1) / 2),
        len: d1 - d0,
        sirt: durumlar.includes('acik') ? 'acik' : 'iskelet',
        yuzler: [
          { face: 1, durum: durumlar[0], level: yuzler[0].level },
          { face: -1, durum: durumlar[1], level: yuzler[1].level },
        ],
      });
    }
  }
  return out;
}
