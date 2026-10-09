/**
 * kalicilik.ts — Sprint A ortak sözleşmesi (gövde: ajan ③). Ana depo @capacitor/preferences
 * (iOS UserDefaults / Android SharedPreferences — OS silmez); localStorage hızlı kopya.
 * `kalicilikHazirla()` render ÖNCESİ bir kez beklenir; sonra okuma SENKRON (önbellekten).
 *
 * NEDEN: iOS WKWebView'in localStorage'ı "web sitesi verisi" sayılır; disk sıkışınca ya da uzun süre
 * açılmayan uygulamada OS onu silebilir — kayıt tek başına orada dururken ilerleme giderdi.
 * Preferences native depodur, OS kendiliğinden silmez.
 *
 * Tarayıcıda ve testte Preferences YOK (native değil): her şey doğrudan localStorage'dan geçer —
 * bugünkü davranışın aynısı, testlerin bellek-localStorage'ı da olduğu gibi çalışır.
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/** Preferences'ın kullandığımız dilimi (test sahte depo verebilsin diye arayüz). */
export interface TercihDeposu {
  keys(): Promise<{ keys: string[] }>;
  get(o: { key: string }): Promise<{ value: string | null }>;
  set(o: { key: string; value: string }): Promise<void>;
  remove(o: { key: string }): Promise<void>;
}

/** Hazırlıkta localStorage'dan Preferences'a TAŞINAN anahtarlar (kayıt ailesi + mağaza kimliği). */
const TASINAN = /^kiraathane\.(save(\..+)?|rcKimlik)$/;

let depo: TercihDeposu | null = null;
const onbellek = new Map<string, string>();
let kuyruk: Promise<unknown> = Promise.resolve();

const yerel = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Preferences yazımları SIRAYLA gider (set → remove sırası korunur). Hata oyunu durdurmaz. */
function arkaPlanda(is: (d: TercihDeposu) => Promise<unknown>): void {
  const d = depo;
  if (!d) return;
  kuyruk = kuyruk.then(() => is(d)).catch(() => {});
}

/**
 * Preferences'tan önbelleğe okur; localStorage'da olup Preferences'ta olmayanı taşır. OS'un sildiği
 * hızlı kopya Preferences'tan geri yazılır. İki depoda FARKLI değer varsa ikisi de durur: ana kayıt
 * için hangisinin taze olduğunu `save.ts` zarf sayacıyla seçer (`kaliciYerelOku`).
 * `ozel`: test için sahte depo (`null` = Preferences yokmuş gibi).
 */
export async function kalicilikHazirla(ozel?: TercihDeposu | null): Promise<void> {
  depo = null;
  onbellek.clear();
  kuyruk = Promise.resolve();
  const d = ozel !== undefined ? ozel : Capacitor.isNativePlatform() ? Preferences : null;
  if (!d) return;
  try {
    const { keys } = await d.keys();
    for (const k of keys) {
      const { value } = await d.get({ key: k });
      if (value != null) onbellek.set(k, value);
    }
    const l = yerel();
    if (l) {
      const yerelAnahtarlar: string[] = [];
      for (let i = 0; i < l.length; i++) {
        const k = l.key(i);
        if (k) yerelAnahtarlar.push(k);
      }
      for (const k of yerelAnahtarlar) {
        if (!TASINAN.test(k) || onbellek.has(k)) continue;
        const v = l.getItem(k);
        if (v == null) continue;
        await d.set({ key: k, value: v });
        onbellek.set(k, v);
      }
      for (const [k, v] of onbellek) if (l.getItem(k) == null) l.setItem(k, v);
    }
    depo = d;
  } catch {
    // Preferences okunamadı: bu oturum localStorage ile sürer (bugünkü davranış).
    depo = null;
    onbellek.clear();
  }
}

export function kaliciOku(anahtar: string): string | null {
  if (depo && onbellek.has(anahtar)) return onbellek.get(anahtar)!;
  return kaliciYerelOku(anahtar);
}

/** Yalnız localStorage kopyası — ana kayıtta iki depo ayrıştıysa `save.ts` ikisini de aday sayar. */
export function kaliciYerelOku(anahtar: string): string | null {
  try {
    return yerel()?.getItem(anahtar) ?? null;
  } catch {
    return null;
  }
}

/** Önbellek + localStorage'a hemen, Preferences'a arka planda yazar. */
export function kaliciYaz(anahtar: string, deger: string): void {
  try {
    yerel()?.setItem(anahtar, deger);
  } catch {
    /* kota / gizli kip — Preferences yine yazılır */
  }
  if (!depo) return;
  onbellek.set(anahtar, deger);
  arkaPlanda((d) => d.set({ key: anahtar, value: deger }));
}

export function kaliciSil(anahtar: string): void {
  try {
    yerel()?.removeItem(anahtar);
  } catch {
    /* yok */
  }
  if (!depo) return;
  onbellek.delete(anahtar);
  arkaPlanda((d) => d.remove({ key: anahtar }));
}

/** Bekleyen Preferences yazımları bitince çözülür (test + uygulama kapanışı). */
export const kalicilikBekle = (): Promise<void> => kuyruk.then(() => {});

/** Kalıcı RevenueCat kimliği (UUID) — yoksa üretir ve yazar. */
export function rcKimlik(): string {
  const a = 'kiraathane.rcKimlik';
  let k = kaliciOku(a);
  if (!k) { k = crypto.randomUUID(); kaliciYaz(a, k); }
  return k;
}
