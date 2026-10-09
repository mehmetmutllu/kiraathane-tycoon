/**
 * kalicilik.ts — Sprint A ortak sözleşmesi (gövde: ajan ③). Ana depo @capacitor/preferences
 * (iOS UserDefaults / Android SharedPreferences — OS silmez); localStorage hızlı kopya.
 * `kalicilikHazirla()` render ÖNCESİ bir kez beklenir; sonra okuma SENKRON (önbellekten).
 */

/** Preferences'tan önbelleğe okur; localStorage'da olup Preferences'ta olmayanı taşır. */
export async function kalicilikHazirla(): Promise<void> {}

export function kaliciOku(anahtar: string): string | null {
  try { return localStorage.getItem(anahtar); } catch { return null; }
}

/** Önbellek + localStorage'a hemen, Preferences'a arka planda yazar. */
export function kaliciYaz(anahtar: string, deger: string): void {
  try { localStorage.setItem(anahtar, deger); } catch { /* yok */ }
}

/** Kalıcı RevenueCat kimliği (UUID) — yoksa üretir ve yazar. */
export function rcKimlik(): string {
  const a = 'kiraathane.rcKimlik';
  let k = kaliciOku(a);
  if (!k) { k = crypto.randomUUID(); kaliciYaz(a, k); }
  return k;
}
