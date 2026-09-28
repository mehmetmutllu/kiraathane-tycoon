// Para sayacı (çevrimdışı dönüş ekranı): 0'dan hedefe yumuşak sayma. Saf — zaman dışarıdan gelir.
import { D, type Numberish, type Decimal } from './decimal';

/** Sayma süresi (ms). Denge sayısı değil sunum süresi: 0,8-1,2 sn bandının ortası. */
export const SAYAC_MS = 1000;

/** Ease-out (kübik): hızlı başlar, hedefe yavaşlayarak oturur — sayı "dolar", aşmaz. */
const yavasla = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * `gecenMs` anındaki gösterilecek tutar. Kurallar (bekçi: tests/sayac.test.ts):
 * 0 anında 0 · süre dolunca TAM hedef (kuruşsuz) · arada tam sayı, hedefi asla aşmaz, geri gitmez.
 */
export function sayacDegeri(hedef: Numberish, gecenMs: number, sureMs = SAYAC_MS): Decimal {
  const h = D(hedef).floor();
  if (sureMs <= 0 || gecenMs >= sureMs) return h;
  if (gecenMs <= 0) return D(0);
  return h.mul(yavasla(gecenMs / sureMs)).floor().min(h);
}
