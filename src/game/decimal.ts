// Büyük sayı altyapısı — para/itibar burada Decimal olarak tutulur (ham Number değil).
import Decimal from 'break_infinity.js';

export { Decimal };
export type Numberish = Decimal | number | string;

export const D = (v: Numberish = 0): Decimal => new Decimal(v);

/**
 * K2 (D-146) — PARA TEK BİÇİMDE. Eskiden üç biçim vardı: üst şerit "6.04K" (Türkçede "6.04" binlik
 * okunur), ödül ekranı "+7.474", zemin "9950". Kural: küsurat YOK; < 1 milyon TAM sayı + dilin binlik
 * ayracı; ≥ 1 milyon dilin kısaltması, TEK ondalık. Dil oyuncunun dilidir (`i18n` · `dil()`);
 * çeviri geldiğinde burası oyuncunun seçtiği dili okur, çağıranlar değişmez.
 */
import { dil as aktifDil, type Dil } from '../i18n';
export type { Dil };

const YEREL: Record<Dil, string> = { tr: 'tr-TR', en: 'en-US' };
/** 10^6, 10^9, 10^12 … kısaltmaları. tr: milyon · milyar · trilyon · katrilyon · kentilyon. */
const KISALTMA: Record<Dil, { ayrac: string; birim: string[] }> = {
  tr: { ayrac: ' ', birim: ['Mn', 'Mr', 'Tn', 'Kt', 'Kn'] },
  en: { ayrac: '', birim: ['M', 'B', 'T', 'Qa', 'Qi'] },
};

/**
 * Biçimleyici ÖNBELLEĞİ (Sprint A · perf). `toLocaleString(yerel)` her çağrıda yeni bir
 * `Intl.NumberFormat` kurar (yerel verisini çözer) — `fmt` HUD'da her karede çağrılabiliyor.
 * Dil başına iki biçimleyici bir kez kurulur; çıktı `toLocaleString` ile birebir aynı.
 */
const TAM = new Map<Dil, Intl.NumberFormat>();
const ONDALIK1 = new Map<Dil, Intl.NumberFormat>();
function bicimci(harita: Map<Dil, Intl.NumberFormat>, dil: Dil, secenek?: Intl.NumberFormatOptions) {
  let b = harita.get(dil);
  if (!b) {
    b = new Intl.NumberFormat(YEREL[dil], secenek);
    harita.set(dil, b);
  }
  return b;
}

/** ₺/💎/zemin tutarı — oyundaki HER para gösterimi buradan geçer. */
export function fmt(v: Numberish, dil: Dil = aktifDil()): string {
  const d = D(v);
  if (d.lt(0)) return '-' + fmt(d.neg(), dil);
  if (d.lt(1e6)) return bicimci(TAM, dil).format(Math.floor(d.toNumber()));
  const grup = Math.floor(d.exponent / 3); // 2 = milyon
  const { ayrac, birim } = KISALTMA[dil];
  if (grup - 2 >= birim.length) return d.toExponential(1);
  // Aşağı yuvarlanır: 1,29 Mn "1,3 Mn" yazılırsa oyuncu olmayan parayı görür (ve 999,96 Mn "1000 Mn" olurdu).
  const deger = Math.floor(d.mantissa * Math.pow(10, d.exponent - grup * 3) * 10) / 10;
  return bicimci(ONDALIK1, dil, { maximumFractionDigits: 1 }).format(deger) + ayrac + birim[grup - 2];
}

/** Para OLMAYAN ondalık değer (mıknatıs alanı "2,6", hız "1,5") — dilin ondalık ayracıyla. */
export const sayi = (n: number, dil: Dil = aktifDil()): string =>
  n.toLocaleString(YEREL[dil], { maximumFractionDigits: 2 });
