/**
 * Usta noktasının BEKLEME (dwell) durumu — sahne yazar, işaret okur.
 *
 * Neden modül değişkeni: dolum her karede değişir. React state'i olsaydı saniyede 60 kez
 * yeniden render olurdu (`activeStep` ile aynı gerekçe, D-038). İki `useFrame` bu nesne
 * üzerinden konuşur; React'e yalnız dolum TAMAMLANINCA bir kez dokunulur.
 */
import type { Vec3 } from './types';
import { inFrame, ustaCercevesi } from './markerFrame';

export const dwellState = {
  /** Şu an beklenen Usta noktası (yoksa null). */
  id: null as string | null,
  /** 0..1 — çerçevenin yeşil dolum oranı. */
  p: 0,
};

/** Modalin açılması için oyuncunun noktada durması gereken süre (sn) — kullanıcı: "1 2 sn". */
export const USTA_BEKLEME = 1.1;

/**
 * K4 (D-146 · T9b B5) — USTA NOKTASI PAD GİBİDİR: yalnız ÇİZİLEN çerçevenin üstünde durunca dolar.
 * Eskiden noktanın 1,9 br yarıçapı masanın servis durağını kapsıyordu; tavandaki masaya çay
 * bırakan oyuncu her durduğunda pencere açılıyordu. İki kural:
 *   ① tetik = `ustaCercevesi()` (masa noktasıyla aynı dikdörtgen — S24 tek kaynak ilkesi)
 *   ② kapatılan pencere, oyuncu o noktadan ÇIKIP yeniden basana kadar dolmaz (`kapali`).
 * Saf fonksiyon: sahne her karede çağırır, test düğüm ağacı olmadan çağırır.
 */
export function ustaKaresi(
  adaylar: readonly { id: string; pos: Vec3 }[],
  px: number,
  pz: number,
  duruyor: boolean,
  dt: number,
  onceki: { p: number; kapali: string | null },
): { id: string | null; p: number; kapali: string | null; acik: string | null } {
  const c = ustaCercevesi();
  const id = adaylar.find((a) => inFrame(px, pz, a.pos, c))?.id ?? null;
  const kapali = onceki.kapali != null && id !== onceki.kapali ? null : onceki.kapali;
  const dolar = id != null && id !== kapali && duruyor;
  const p = dolar ? Math.min(1, onceki.p + dt / USTA_BEKLEME) : 0;
  return { id, p, kapali, acik: dolar && p >= 1 ? id : null };
}
