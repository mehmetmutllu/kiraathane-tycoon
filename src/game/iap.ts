/**
 * iap.ts — SATIN ALMA KATMANI (F4a · D-152). Oyun mağazayı yalnız bu modülden görür.
 *
 * `ads.ts`in deseni: cihazda RevenueCat (`@revenuecat/purchases-capacitor`), tarayıcı/testte SAHTE
 * arka uç. Cihazda anahtar yoksa arka uç KAPALIDIR — sahte arka uç cihaza asla düşmez (bedava ürün olurdu).
 *
 * Bu modül ödül VERMEZ: satın alınanı bildirir, ödülü store verir (`satinAlimIsle`). Kalıcı sahiplikler
 * (reklamsız · başlangıç) mağaza hesabında durur ve `sahiplikler`/`geriYukle` ile okunur; kayıt silinse
 * bile geri gelir. 💎 geri yüklenmez: tüketilmiş üründür (bulut kaydı F4b'de).
 */
import { Capacitor } from '@capacitor/core';
import { iapConfig } from '../config/iap.config';

export interface Islem {
  /** Mağazanın işlem kimliği — aynı işlem iki kez ödül vermesin diye kayıtta tutulur. */
  islem: string;
  urun: string;
}
export interface Sahiplik {
  reklamsiz: boolean;
  baslangic: boolean;
}

export interface SatinAlmaArkaUcu {
  kur(): Promise<void>;
  /** Ürün kimliği → mağazanın yerel fiyat metni ("49,99 ₺", "4,99 €"). */
  fiyatlar(urunler: string[]): Promise<Record<string, string>>;
  /** Oyuncu vazgeçtiyse ya da hata varsa null. */
  satinAl(urun: string): Promise<Islem | null>;
  sahiplikler(): Promise<Sahiplik>;
  geriYukle(): Promise<Sahiplik>;
}

const elmasUrunleri: readonly string[] = iapConfig.urun.elmas;

export const tumUrunler = (): string[] => [
  iapConfig.urun.reklamsiz, iapConfig.urun.baslangic, ...iapConfig.urun.elmas,
];

/** Tarayıcı / test: satın alma anında başarılı, sahiplik bellekte. Ağ çağrısı yok. */
export function sahteArkaUc(): SatinAlmaArkaUcu {
  const sahip = new Set<string>();
  let sayac = 0;
  const oku = (): Sahiplik => ({
    reklamsiz: sahip.has(iapConfig.urun.reklamsiz),
    baslangic: sahip.has(iapConfig.urun.baslangic),
  });
  return {
    kur: async () => {},
    fiyatlar: async (urunler) => Object.fromEntries(urunler.map((u) => [u, 'Test'])),
    satinAl: async (urun) => {
      if (urun !== iapConfig.urun.reklamsiz && urun !== iapConfig.urun.baslangic && !elmasUrunleri.includes(urun))
        return null;
      if (!elmasUrunleri.includes(urun)) sahip.add(urun);
      return { islem: `sahte-${++sayac}`, urun };
    },
    sahiplikler: async () => oku(),
    geriYukle: async () => oku(),
  };
}

async function revenueCatArkaUcu(anahtar: string): Promise<SatinAlmaArkaUcu> {
  const { Purchases, PRODUCT_CATEGORY } = await import('@revenuecat/purchases-capacitor');
  const hakOku = (aktif: Record<string, unknown>): Sahiplik => ({
    reklamsiz: iapConfig.hak.reklamsiz in aktif,
    baslangic: iapConfig.hak.baslangic in aktif,
  });
  const urunGetir = async (kimlikler: string[]) =>
    (await Purchases.getProducts({ productIdentifiers: kimlikler, type: PRODUCT_CATEGORY.NON_SUBSCRIPTION })).products;
  return {
    kur: () => Purchases.configure({ apiKey: anahtar }),
    fiyatlar: async (urunler) =>
      Object.fromEntries((await urunGetir(urunler)).map((p) => [p.identifier, p.priceString])),
    satinAl: async (urun) => {
      const [p] = await urunGetir([urun]);
      if (!p) return null;
      try {
        const r = await Purchases.purchaseStoreProduct({ product: p });
        return { islem: r.transaction?.transactionIdentifier ?? `${urun}:${Date.now()}`, urun: r.productIdentifier };
      } catch {
        return null; // vazgeçti ya da mağaza hatası — oyun için ikisi de "alınmadı"
      }
    },
    sahiplikler: async () => hakOku((await Purchases.getCustomerInfo()).customerInfo.entitlements.active),
    geriYukle: async () => hakOku((await Purchases.restorePurchases()).customerInfo.entitlements.active),
  };
}

// ─── Oturum durumu ───────────────────────────────────────────────────────────────────────────
let arkaUc: SatinAlmaArkaUcu | null = null;
let fiyat: Record<string, string> = {};
let islemde = false;
const dinleyiciler = new Set<() => void>();
let surum = 0;
const bildir = () => { surum++; dinleyiciler.forEach((f) => f()); };
/** React `useSyncExternalStore` anlık görüntüsü — her değişimde artar. */
export const satinAlmaSurumu = () => surum;

async function dene<T>(is: () => Promise<T>, yedek: T): Promise<T> {
  try {
    return await is();
  } catch {
    return yedek;
  }
}

/**
 * Uygulama açılışında bir kez. Mağazanın bildiği sahiplikleri döndürür (okunamadıysa null —
 * o durumda kayıttaki önbellek geçerli kalır). `ozel` verilirse o arka uç kullanılır (test).
 */
export async function satinAlmaBaslat(ozel?: SatinAlmaArkaUcu): Promise<Sahiplik | null> {
  arkaUc = null;
  fiyat = {};
  islemde = false;
  const anahtar = iapConfig.revenueCatAnahtar;
  const secilen = ozel
    ?? (Capacitor.isNativePlatform()
      ? (anahtar ? await dene(() => revenueCatArkaUcu(anahtar), null) : null)
      : sahteArkaUc());
  if (!secilen) { bildir(); return null; }
  const kuruldu = await dene(async () => { await secilen.kur(); return true; }, false);
  if (!kuruldu) { bildir(); return null; }
  arkaUc = secilen;
  fiyat = await dene(() => secilen.fiyatlar(tumUrunler()), {});
  bildir();
  return dene(secilen.sahiplikler, null);
}

/** Mağaza hazır mı ve bu ürünün fiyatı biliniyor mu. Fiyatı bilinmeyen ürün satılmaz. */
export const urunFiyati = (urun: string): string | null => (arkaUc && !islemde ? fiyat[urun] ?? null : null);
export const magazaHazir = () => arkaUc != null;

export function satinAlmaAbone(f: () => void): () => void {
  dinleyiciler.add(f);
  return () => dinleyiciler.delete(f);
}

export async function satinAl(urun: string): Promise<Islem | null> {
  if (!arkaUc || islemde || !fiyat[urun]) return null;
  islemde = true;
  bildir();
  const r = await dene(() => arkaUc!.satinAl(urun), null);
  islemde = false;
  bildir();
  return r;
}

export async function satinAlimlariGeriYukle(): Promise<Sahiplik | null> {
  if (!arkaUc) return null;
  return dene(arkaUc.geriYukle, null);
}
