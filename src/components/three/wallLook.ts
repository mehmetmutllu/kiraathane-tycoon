/**
 * wallLook.ts — DUVAR HATLARININ ÖLÇÜ KATMANI (S4).
 *
 * NEDEN AYRI DOSYA: duvar parçalarının listesi `Scene.Walls`ın içinde, bir `for` döngüsünün
 * gövdesinde üretiliyordu. `Scene.tsx` vitest'te import EDİLEMEZ (`recolor` → `Image`), yani o
 * liste bugüne kadar ne bekçilenebildi ne ölçülebildi — "duvar hattı kaç metre, KayKit modülüne
 * bölünüyor mu" sorusu koda bakmadan yanıtlanamıyordu.
 *
 * S3 aynı sorunu mutfak için `kitchenLook.ts` ile çözmüştü (D-072 katman 1 · D-099). Duvar da
 * aynı deseni izler: GEOMETRİ burada (saf, React'siz, testli), ÇİZİM `Scene.tsx`te.
 *
 * BU DOSYA GÖRÜNTÜYÜ DEĞİŞTİRMEZ: `Scene.Walls`ın ürettiği parçaların birebir aynısını üretir
 * (aynı `m`, aynı `t`, aynı kapı kesmesi, aynı sıra). Tek fark, artık okunabilir olması.
 */
import { BAND, BAND_SHELL, LAYOUT, doorX, wallSpans, type AreaSide } from '../../game/layout';
import { DOOR } from './wallPanel';

/** Duvar hattının alan kenarından dışarıdaki payı — oyuncu kelepçe standoff'u ile birebir. */
export const WALL_M = 0.5;

/** Duvar parçasının taban kalınlığı. Katmanlar (gövde 0,18 · lambri 0,22 · çıta 0,26) `wallPanel`'de. */
export const WALL_T = 0.2;

/** Kenar sırası — parça listesinin sırasını belirler, birebir korunur. */
export const WALL_SIDES: readonly AreaSide[] = ['left', 'right', 'front', 'back'] as const;

/**
 * Bir duvar parçası: taban dikdörtgeni + hangi alanın hangi kenarından doğduğu.
 * Tema burada YOK — tema mağazadan gelen bir DURUM (`wallThemeByArea`), geometri değil;
 * `Scene` `area`ya bakıp temayı kendisi giydirir.
 */
export interface WallRun {
  x: number;
  z: number;
  w: number;
  d: number;
  area: number;
  side: AreaSide;
}

/** Parçanın dik mi (sol/sağ kenar) yatay mı (ön/arka kenar) olduğu. */
export const wallDikey = (r: WallRun): boolean => r.side === 'left' || r.side === 'right';

/** Parçanın HAT koordinatı: dik parçada x, yatayda z. */
export const wallSideLine = (r: WallRun): number => (wallDikey(r) ? r.x : r.z);

/** Parçanın uzunluğu (ince eksen kalınlık, kalın eksen uzunluk). */
export const wallUzunluk = (r: WallRun): number => Math.max(r.w, r.d);

/**
 * Açık alanları saran duvar parçaları — `Scene.Walls`ın gövdesinin birebir karşılığı.
 *
 * B3-1: duvarlar ızgara komşuluğundan değil GEOMETRİDEN gelir (`wallSpans`). Kapı boşluğu
 * parçadan ÇIKARILIR (içinde olmasını beklemek yetmiyor: kapı 2. Alan'da x = 0'a kayınca tam
 * iki ön duvar parçasının DİKİŞİNE düşüyor ve ikisi de "içimde değil" diyordu).
 * Arka yarının ARKA kenarı çizilmez — orası `BackBand`in programı (BM adım 3).
 */
export function WALL_RUNS(areasOpen: number): WallRun[] {
  const runs: WallRun[] = [];
  const dx0 = doorX(areasOpen);
  const cut: [number, number] = [dx0 - DOOR.half, dx0 + DOOR.half];
  for (let z = 0; z < areasOpen; z++) {
    const za = LAYOUT.areaBounds[z];
    for (const side of WALL_SIDES) {
      if (side === 'back' && za.minZ === BAND.front) continue;
      const vertical = side === 'left' || side === 'right';
      const line =
        side === 'left'
          ? za.minX - WALL_M
          : side === 'right'
            ? za.maxX + WALL_M
            : side === 'front'
              ? za.maxZ + WALL_M
              : za.minZ - WALL_M;
      for (const [s0, s1] of wallSpans(z, side, areasOpen)) {
        const a0 = s0 - WALL_M; // uçlar m taşar → köşeler kapanır
        const a1 = s1 + WALL_M;
        const segs: [number, number][] =
          side === 'front'
            ? [
                [a0, Math.min(a1, cut[0])],
                [Math.max(a0, cut[1]), a1],
              ]
            : [[a0, a1]];
        for (const [p0, p1] of segs) {
          if (p1 - p0 <= 0.01) continue;
          runs.push(
            vertical
              ? { x: line, z: (p0 + p1) / 2, w: WALL_T, d: p1 - p0, area: z, side }
              : { x: (p0 + p1) / 2, z: line, w: p1 - p0, d: WALL_T, area: z, side },
          );
        }
      }
    }
  }
  return runs;
}

/**
 * ARKA BANDIN BİNA KABUĞU — salonun duvarıyla aynı dilde üç parça (arka + iki yan).
 * `BackBand` çizer; buradan okur. Alan indeksi 2 (arka yarı), teması da onunki.
 */
export function BAND_SHELL_RUNS(): WallRun[] {
  const zf = BAND.front;
  const zb = BAND_SHELL.back;
  const xl = BAND_SHELL.left;
  const xr = BAND_SHELL.right;
  return [
    { x: (xl + xr) / 2, z: zb, w: xr - xl, d: WALL_T, area: 2, side: 'back' },
    { x: xl, z: (zb + zf) / 2, w: WALL_T, d: zf - zb, area: 2, side: 'left' },
    { x: xr, z: (zb + zf) / 2, w: WALL_T, d: zf - zb, area: 2, side: 'right' },
  ];
}
