// Büyük sayı altyapısı — para/itibar burada Decimal olarak tutulur (ham Number değil).
import Decimal from 'break_infinity.js';

export { Decimal };
export type Numberish = Decimal | number | string;

export const D = (v: Numberish = 0): Decimal => new Decimal(v);

const UNITS = ['', 'K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad', 'ae'];

/** ₺/💎 gösterimi: <1000 tam sayı, sonrası K/M/B... son ekleriyle. */
export function fmt(v: Decimal): string {
  if (v.lt(0)) return '-' + fmt(v.neg());
  if (v.lt(1000)) return Math.floor(v.toNumber()).toString();
  try {
    const exp = v.exponent; // value = mantissa * 10^exp, 1<=mantissa<10
    const group = Math.floor(exp / 3);
    if (group < UNITS.length) {
      const displayed = v.mantissa * Math.pow(10, exp - group * 3);
      return displayed.toFixed(2).replace(/\.?0+$/, '') + UNITS[group];
    }
  } catch {
    /* exponential fallback */
  }
  return v.toExponential(2);
}
