/**
 * i18n — OYUNUN DİLİ (2026-09-28, kullanıcı kararı: İngilizce şart).
 *
 * Kural: telefonun dili Türkçe → Türkçe, diğer herkes → İngilizce; Ayarlar'dan elle seçilebilir (`settings.dil`).
 * Metnin TEK kaynağı koddaki Türkçe dizedir: `t('Mağaza')` Türkçede aynen, İngilizcede `en['Mağaza']` döner.
 * Ayrı anahtar uydurulmaz — Türkçe metin değişirse sözlükteki anahtar da değişir (bekçi: tests/i18n.test.ts).
 *
 * Node-güvenli: `navigator` yalnız `cihazDili()` çağrılınca okunur. Varsayılan 'tr' — testler ve araçlar Türkçe
 * koşar; uygulama açılışta `dilAyarla(ayar)` çağırır (main.tsx).
 */
import { en } from './en';

export type Dil = 'tr' | 'en';
export type DilTercihi = 'oto' | Dil;

let aktif: Dil = 'tr';

/** Cihazın ilk tercih ettiği dil Türkçe mi? Değilse İngilizce (Türkiye dışı herkes). */
export function cihazDili(): Dil {
  try {
    const l = (typeof navigator !== 'undefined' && (navigator.languages?.[0] ?? navigator.language)) || 'tr';
    return l.toLowerCase().startsWith('tr') ? 'tr' : 'en';
  } catch {
    return 'tr';
  }
}

export function dilAyarla(tercih: DilTercihi | undefined): Dil {
  aktif = !tercih || tercih === 'oto' ? cihazDili() : tercih;
  if (typeof document !== 'undefined') document.documentElement.lang = aktif;
  return aktif;
}

export const dil = (): Dil => aktif;

/** Büyük harfe çevirirken dilin kuralı (tr: i → İ). */
export const yerelBuyuk = (s: string): string => s.toLocaleUpperCase(aktif === 'tr' ? 'tr-TR' : 'en-US');

/**
 * Çeviri. `{1}` `{2}` … sırasıyla `args` ile doldurulur: `t('Seviye {1}!', 5)`.
 * Sözlükte olmayan metin Türkçe kalır (eksik çeviri görünür olsun diye — bekçi zaten yakalar).
 */
export function t(tr: string, ...args: (string | number)[]): string {
  const s = aktif === 'en' ? (en[tr] ?? tr) : tr;
  return args.length ? s.replace(/\{(\d+)\}/g, (m, i) => (args[Number(i) - 1] ?? m).toString()) : s;
}
