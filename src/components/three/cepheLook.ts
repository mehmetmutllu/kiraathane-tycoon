/**
 * cepheLook.ts — GİRİŞ CEPHESİNİN VİTRİNİ (S6/②, D-105).
 *
 * NEDEN AYRI DOSYA: `wallLook.ts` (S4) ve `kitchenLook.ts` (S3) ile aynı gerekçe — geometri
 * saf ve testli, çizim `Scene.tsx`te. `Scene.tsx` vitest'te import EDİLEMEZ (`recolor` → `Image`),
 * yani buradaki sayılar Scene'in içinde dursaydı bekçilenemezdi.
 *
 * NE YAPAR: D-037 cephenin vitrin olmasını 2026-09-05'te karara bağlamıştı (kaide · cam ·
 * alınlık) ama karar oyuna hiç geçmedi; cephe iç duvarla aynı badana kaldı. S6/② turu ölçtü
 * (`docs/cephe-cami-raporu-s6b.md`) ve kullanıcı **C1 + 4 göz + C4b**yi seçti.
 *
 * ÖLÇÜMÜN KARARA ETKİSİ — bu dosyanın sayıları oradan geliyor, tahminden değil:
 *   · Vitrin bir OYNANIŞ kazancı DEĞİL: örtme kazancı **0,0 puan** (kamera 45°'den bakıyor,
 *     ışın cepheyi duvarın tepesinin üstünden geçiyor). Bir KİMLİK kazancı: cephe kadraja
 *     girdiğinde ekranın dikey **%27'sini** kaplıyor ve o bant bugün tamamen boş.
 *   · Camın ardında görünen şerit z **14,88…17,39** — yani giriş bölgesi; oraya **10 dekor
 *     öğesi** düşüyor (paspas · askılık · şemsiyelik · gazetelik · saksılar) ve bugün cephe
 *     onları kapatıyor. Vitrinin göstereceği şey budur.
 *   · Cephe **125/125 konumda yalnız DIŞARIDAN** görülüyor → camın iç yüzü ekrana hiç girmiyor.
 *     Bu yüzden camın arkasına `Decor.Pencere`nin opak "dışarısı gündüz" paneli KONMAZ; o panel
 *     cephede camı bir delik olmaktan çıkarır, kapalı bir renk şeridine çevirirdi.
 */
import { doorX } from '../../game/layout';
import { DOOR, RAIL_TOP, SOVE_W, WALL_H } from './wallPanel';
import { WALL_RUNS, wallUzunluk, type WallHole } from './wallLook';

/**
 * VİTRİNİN ÖLÇÜLERİ — hepsi karar paketinden (D-105).
 *
 * `kaide` neden 0,90 değil de çıtanın üstü: kullanıcı **C4b "lambri korunur"**u seçti. Kaide
 * tam 0,90'a konsaydı lambri kuşağı kalır ama **üstündeki ÇITA yarıda kesilirdi** — `wallBoxes`
 * çıtayı 0,90…0,98 arasında üretir ve parçanın tepesi 0,90 olunca o katman hiç doğmaz. "Lambri
 * korunur" kararının karşılığı kuşak + çıtasıdır, o yüzden sınır çıtanın üstü.
 */
export const VITRIN = {
  /** Camın alt sınırı = lambri çıtasının üstü (C4b — "lambri korunur"). */
  kaide: RAIL_TOP,
  /** Camın üst sınırı = kapı boyu. Ölçüldü: sapma 0,000 → cephe tepesi tek şerit okunur. */
  ust: DOOR.height,
  /** Gözler arası düşey ayak. */
  ayak: 0.36,
  /** Hedef göz eni — karar paketi: 3,35 br ≈ insan boyunun 1,92 katı (dükkân vitrini oranı). */
  gozHedef: 3.35,
  /** Hattın duvar köşesinde bıraktığı pay. */
  kosePay: 0.6,
  /** Hattın kapı sövesinde bıraktığı pay — SÖVENİN KENDİ eninden türer, elle yazılmaz. */
  sovePay: SOVE_W / 2,
  /** Doğrama şeridinin kalınlığı (`Decor.Pencere` ile aynı dil). */
  kasa: 0.05,
} as const;

/** Bir vitrin gözü: hat boyunca `a…b`, yükseklikte `VITRIN.kaide…VITRIN.ust`. */
export interface VitrinGoz {
  /** Gözün merkezi (cephe yatay hat olduğu için x). */
  x: number;
  /** Hattın koordinatı (z). */
  z: number;
  /** Göz eni. */
  en: number;
  /** Hangi alanın duvarından doğduğu — tema `Scene`de giydirilir. */
  area: number;
}

/**
 * Bir hat parçasının vitrine ayrılabilen aralığı: kapıya bakan uç SÖVE payı, dış uç KÖŞE payı
 * bırakır. Hangi ucun kapıya baktığı `dx0 ∓ DOOR.half` ile eşleşmeden TÜRETİLİR — kapı
 * 2. Alan açılınca cephenin ortasına kaydığı için (`doorAt`) sabit yazılamaz.
 */
function kullanilirAralik(a: number, b: number, dx0: number): [number, number] {
  const aKapiya = Math.abs(a - (dx0 + DOOR.half)) < 0.01;
  const bKapiya = Math.abs(b - (dx0 - DOOR.half)) < 0.01;
  return [a + (aKapiya ? VITRIN.sovePay : VITRIN.kosePay), b - (bKapiya ? VITRIN.sovePay : VITRIN.kosePay)];
}

/**
 * Bir aralığa kaç göz sığar? Göz SAYISI değil göz ENİ sabittir: sayı hedef enden TÜRER.
 *
 * Gerekçe: karar "4 göz" derken 14,50 br'lik yarı-hattı görüyordu (2 alan açık). Sayı koda
 * sabitlenseydi 1 alan açıkken hat 6,00 br olduğu için göz eni 1,23'e düşer, cephenin ritmi
 * alan açıldıkça değişirdi. Hedef en sabit tutulunca ritim korunur ve 14,50'de sayı yine
 * tam **4** çıkar ((14,50 + 0,36) / (3,35 + 0,36) = 4,005).
 */
export const gozSayisi = (uzunluk: number): number =>
  Math.max(1, Math.min(8, Math.round((uzunluk + VITRIN.ayak) / (VITRIN.gozHedef + VITRIN.ayak))));

/** Açık alanların ÖN duvarındaki vitrin gözleri (hat boyunca eşit bölünmüş). */
export function vitrinGozleri(areasOpen: number): VitrinGoz[] {
  const dx0 = doorX(areasOpen);
  const out: VitrinGoz[] = [];
  for (const r of WALL_RUNS(areasOpen)) {
    if (r.side !== 'front') continue;
    const uz = wallUzunluk(r);
    const [a, b] = kullanilirAralik(r.x - uz / 2, r.x + uz / 2, dx0);
    const len = b - a;
    if (len <= VITRIN.gozHedef / 2) continue; // vitrin sığmayacak kadar kısa parça (kapı yanı)
    const n = gozSayisi(len);
    const en = (len - (n - 1) * VITRIN.ayak) / n;
    for (let i = 0; i < n; i++) {
      const bas = a + i * (en + VITRIN.ayak);
      out.push({ x: bas + en / 2, z: r.z, en, area: r.area });
    }
  }
  return out;
}

/**
 * Vitrin gözlerinin DUVAR AÇIKLIĞI karşılığı — `wallLook.wallPieces` bunu yiyip cam bandında
 * hiç duvar üretmiyor. Pencere ile BİREBİR aynı mekanizma (`pencereBosluklari`): açıklığın
 * nerede olduğu tek yerde yazılı, duvarın nerede delineceği ondan TÜRÜYOR (D-015).
 */
export const cepheBosluklari = (areasOpen: number): WallHole[] =>
  vitrinGozleri(areasOpen).map((g) => ({
    line: g.z,
    dikey: false,
    a: g.x - g.en / 2,
    b: g.x + g.en / 2,
    y0: VITRIN.kaide,
    y1: VITRIN.ust,
  }));

/** Camın toplam yüzeyi (m²) — raporun sayısıyla karşılaştırılabilsin diye. */
export const camYuzeyi = (areasOpen: number): number =>
  vitrinGozleri(areasOpen).reduce((a, g) => a + g.en * (VITRIN.ust - VITRIN.kaide), 0);

/** Alınlık şeridi: camın üstünden duvarın tepesine. Kapının alınlığıyla aynı aralık. */
export const ALINLIK: readonly [number, number] = [VITRIN.ust, WALL_H];
