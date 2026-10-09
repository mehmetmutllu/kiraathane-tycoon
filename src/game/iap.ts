/**
 * iap.ts — SATIN ALMA KATMANI (F4a · D-152 · Sprint A P1/P2). Oyun mağazayı yalnız bu modülden görür.
 *
 * `ads.ts`in deseni: cihazda RevenueCat (`@revenuecat/purchases-capacitor`), tarayıcı/testte SAHTE
 * arka uç. Cihazda anahtar yoksa arka uç KAPALIDIR — sahte arka uç cihaza asla düşmez (bedava ürün olurdu).
 *
 * Bu modül ödül VERMEZ: satın alınanı ve mağazanın müşteri bilgisini (`MusteriOzu`) bildirir; ödülü
 * store verir (`satinAlimIsle` · `magazaUzlas`). Kurulum + fiyat tek uçuşta (`magazaYenile`), düşerse
 * geri çekilmeyle yeniden dener. RevenueCat kalıcı `rcKimlik` ile çalışır (P2): 💎 başka cihazda uzlaşır.
 */
import { iapConfig } from '../config/iap.config';
import { magazaPlatformu } from './platform';
import { kaliciOku, kaliciYaz, rcKimlik } from './kalicilik';
import type { MagazaDurumu, SatinAlSonuc } from './satinAlimTipleri';
import type { MagazaIslemi, MusteriOzu } from './satinAlimUzlas';

export interface Islem {
  /** Mağazanın işlem kimliği — aynı işlem iki kez ödül vermesin diye kayıtta tutulur. */
  islem: string;
  urun: string;
}
export interface Sahiplik {
  reklamsiz: boolean;
  baslangic: boolean;
}
export interface SatinAlCevap {
  sonuc: SatinAlSonuc;
  /** Yalnız `tamam`da (mağaza işlemi bildirmediyse yine yok — uzlaşma `musteri`den yakalar). */
  islem?: Islem;
  musteri?: MusteriOzu;
}

export interface SatinAlmaArkaUcu {
  kur(): Promise<void>;
  /** Ürün kimliği → mağazanın yerel fiyat metni ("49,99 ₺", "4,99 €"). */
  fiyatlar(urunler: string[]): Promise<Record<string, string>>;
  satinAl(urun: string): Promise<SatinAlCevap>;
  musteri(): Promise<MusteriOzu>;
  geriYukle(): Promise<MusteriOzu>;
  /** Mağaza müşteri bilgisini kendiliğinden değiştirince (Ask-to-Buy onayı, iade, başka cihaz). */
  dinle?(cb: (m: MusteriOzu) => void): void;
}

const elmasUrunleri: readonly string[] = iapConfig.urun.elmas;

export const tumUrunler = (): string[] => [
  iapConfig.urun.reklamsiz, iapConfig.urun.baslangic, ...iapConfig.urun.elmas,
];

/**
 * RevenueCat hata kodu → oyunun sonucu (`PURCHASES_ERROR_CODE`, RC Capacitor 13.6.1: 1 iptal ·
 * 6 zaten sahip · 20 ödeme bekliyor · 10 ağ ve geri kalan → hata). Kod eklentide metin gelir.
 */
export function hataSonucu(e: unknown): SatinAlSonuc {
  const h = (e ?? {}) as { code?: unknown; userCancelled?: unknown };
  const k = String(h.code ?? '');
  if (k === '1' || h.userCancelled === true) return 'vazgecti';
  if (k === '20') return 'bekliyor';
  if (k === '6') return 'zatenSahip';
  return 'hata';
}

/** Bir ürünün en yeni işlemi (satın alma dönüşünün customerInfo'sundan gerçek kimlik). */
const sonIslem = (islemler: readonly MagazaIslemi[], urun: string): MagazaIslemi | undefined =>
  islemler.filter((t) => t.urun === urun).sort((a, b) => b.tarih - a.tarih)[0];

/** Tarayıcı / test: satın alma anında başarılı, işlemler bellekte. Ağ çağrısı yok. */
export function sahteArkaUc(): SatinAlmaArkaUcu {
  const islemler: MagazaIslemi[] = [];
  let sayac = 0;
  const musteri = (): MusteriOzu => ({
    kimlik: 'sahte',
    hak: {
      reklamsiz: islemler.some((t) => t.urun === iapConfig.urun.reklamsiz),
      baslangic: islemler.some((t) => t.urun === iapConfig.urun.baslangic),
    },
    islemler: [...islemler],
  });
  return {
    kur: async () => {},
    fiyatlar: async (urunler) => Object.fromEntries(urunler.map((u) => [u, 'Test'])),
    satinAl: async (urun) => {
      if (urun !== iapConfig.urun.reklamsiz && urun !== iapConfig.urun.baslangic && !elmasUrunleri.includes(urun))
        return { sonuc: 'hata' };
      if (!elmasUrunleri.includes(urun) && islemler.some((t) => t.urun === urun)) return { sonuc: 'zatenSahip' };
      const t = { kimlik: `sahte-${++sayac}`, urun, tarih: Date.now() };
      islemler.push(t);
      return { sonuc: 'tamam', islem: { islem: t.kimlik, urun }, musteri: musteri() };
    },
    musteri: async () => musteri(),
    geriYukle: async () => musteri(),
  };
}

/** `rcKimlik`e geçişin yapıldığı kimlik (anonim RevenueCat kullanıcısı bir kez logIn ile ona bağlanır). */
const GECIS_ANAHTARI = 'kiraathane.rcGecis';

/** Testte modül taklidiyle sınanır; uygulama yalnız `satinAlmaBaslat` yoluyla kullanır. */
export async function revenueCatArkaUcu(anahtar: string): Promise<SatinAlmaArkaUcu> {
  const { Purchases, PRODUCT_CATEGORY } = await import('@revenuecat/purchases-capacitor');
  type Bilgi = Awaited<ReturnType<typeof Purchases.getCustomerInfo>>['customerInfo'];
  let aktifKimlik = '';
  let dinleyici: ((m: MusteriOzu) => void) | null = null;
  const ozu = (b: Bilgi): MusteriOzu => ({
    kimlik: aktifKimlik,
    hak: {
      reklamsiz: iapConfig.hak.reklamsiz in b.entitlements.active,
      baslangic: iapConfig.hak.baslangic in b.entitlements.active,
    },
    islemler: b.nonSubscriptionTransactions.map((t) => ({
      kimlik: t.transactionIdentifier, urun: t.productIdentifier, tarih: Date.parse(t.purchaseDate),
    })),
  });
  const urunGetir = async (kimlikler: string[]) =>
    (await Purchases.getProducts({ productIdentifiers: kimlikler, type: PRODUCT_CATEGORY.NON_SUBSCRIPTION })).products;
  return {
    kur: async () => {
      const kimlik = rcKimlik();
      // Geçiş yapılmış cihaz doğrudan kalıcı kimlikle açılır; yapılmamışta önce (varsa önbellekteki
      // anonim kullanıcıyla) açılır, sonra logIn anonimi kalıcı kimliğe bağlar — eski alımlar taşınır.
      const gecti = kaliciOku(GECIS_ANAHTARI) === kimlik;
      await Purchases.configure(gecti ? { apiKey: anahtar, appUserID: kimlik } : { apiKey: anahtar });
      if (!gecti) {
        try {
          await Purchases.logIn({ appUserID: kimlik });
          kaliciYaz(GECIS_ANAHTARI, kimlik);
        } catch { /* ağ yok: anonim sürer, sonraki açılışta yeniden */ }
      }
      aktifKimlik = await Purchases.getAppUserID().then((r) => r.appUserID, () => (gecti ? kimlik : ''));
      // Android: Play'deki alımları sessizce eşitle (hesap sorusu yok). iOS'ta sessiz restore YOK (şifre sorar).
      if (magazaPlatformu() === 'android') await Purchases.syncPurchases().catch(() => {});
      await Purchases.addCustomerInfoUpdateListener((b) => dinleyici?.(ozu(b))).catch(() => {});
    },
    fiyatlar: async (urunler) =>
      Object.fromEntries((await urunGetir(urunler)).map((p) => [p.identifier, p.priceString])),
    satinAl: async (urun) => {
      const [p] = await urunGetir([urun]);
      if (!p) return { sonuc: 'hata' };
      try {
        const r = await Purchases.purchaseStoreProduct({ product: p });
        const m = ozu(r.customerInfo);
        // Kimlik customerInfo'dan: uzlaşmanın gördüğü uzayla aynı olsun (çift 💎 yok). Yoksa mağazanınki.
        const islem = sonIslem(m.islemler, r.productIdentifier)?.kimlik ?? r.transaction?.transactionIdentifier;
        return { sonuc: 'tamam', musteri: m, ...(islem ? { islem: { islem, urun: r.productIdentifier } } : {}) };
      } catch (e) {
        return { sonuc: hataSonucu(e) };
      }
    },
    musteri: async () => ozu((await Purchases.getCustomerInfo()).customerInfo),
    geriYukle: async () => ozu((await Purchases.restorePurchases()).customerInfo),
    dinle: (cb) => { dinleyici = cb; },
  };
}

// ─── Oturum durumu ───────────────────────────────────────────────────────────────────────────
/** undefined = henüz seçilmedi · null = bu cihazda kapalı (anahtar yok). */
let secilen: SatinAlmaArkaUcu | null | undefined;
let arkaUc: SatinAlmaArkaUcu | null = null;
let fiyat: Record<string, string> = {};
let durum: MagazaDurumu = 'yukleniyor';
let islemdeki: string | null = null;
let ucus: Promise<void> | null = null;
let deneme = 0;
let zaman: ReturnType<typeof setTimeout> | null = null;
let nesil = 0;
const dinleyiciler = new Set<() => void>();
const uzlasmaDinleyicileri = new Set<(m: MusteriOzu) => void>();
let surum = 0;
const bildir = () => { surum++; dinleyiciler.forEach((f) => f()); };
const musteriBildir = (m: MusteriOzu) => uzlasmaDinleyicileri.forEach((f) => f(m));
/** React `useSyncExternalStore` anlık görüntüsü — her değişimde artar. */
export const satinAlmaSurumu = () => surum;

async function dene<T>(is: () => Promise<T>, yedek: T): Promise<T> {
  try {
    return await is();
  } catch {
    return yedek;
  }
}

async function arkaUcSec(ozel?: SatinAlmaArkaUcu): Promise<SatinAlmaArkaUcu | null> {
  const platform = magazaPlatformu();
  const anahtar = platform ? iapConfig.revenueCatAnahtar[platform] : null;
  return ozel
    ?? (platform
      ? (anahtar ? await dene(() => revenueCatArkaUcu(anahtar), null) : null)
      : sahteArkaUc());
}

/** Bir deneme: kur (gerekirse) + fiyat + müşteri. */
async function yenileAdim(): Promise<'tamam' | 'tekrar' | 'kapali'> {
  if (secilen === undefined) {
    const s = await arkaUcSec();
    const platform = magazaPlatformu();
    if (!s) return platform && iapConfig.revenueCatAnahtar[platform] ? 'tekrar' : (secilen = null, 'kapali');
    secilen = s;
  }
  if (!secilen) return 'kapali';
  if (!arkaUc) {
    const s = secilen;
    if (!(await dene(async () => { await s.kur(); return true; }, false))) return 'tekrar';
    arkaUc = s;
    s.dinle?.(musteriBildir);
  }
  const a = arkaUc;
  fiyat = { ...fiyat, ...(await dene(() => a.fiyatlar(tumUrunler()), {})) };
  const m = await dene(() => a.musteri(), null);
  if (m) musteriBildir(m);
  return tumUrunler().every((u) => fiyat[u]) ? 'tamam' : 'tekrar';
}

/**
 * Mağazayı kur + fiyatları yenile — TEK UÇUŞ: sürerken gelen çağrı aynı sözü alır. Düşerse
 * `iapConfig.yeniden` bekleyişleriyle yeniden dener, tükenince `yok`. Dışarıdan her çağrı (açılış ·
 * ön plan · Paketler sekmesi · "Tekrar dene") geri çekilmeyi baştan başlatır.
 */
export function magazaYenile(neden: string = 'elle'): Promise<void> {
  if (ucus) return ucus;
  if (neden !== 'yeniden') {
    if (zaman) clearTimeout(zaman);
    zaman = null;
    deneme = 0;
  }
  const n = nesil;
  const p = (async () => {
    if (durum !== 'hazir') { durum = 'yukleniyor'; bildir(); }
    const r = await yenileAdim();
    if (n !== nesil) return;
    const fiyatVar = arkaUc != null && Object.keys(fiyat).length > 0;
    if (r === 'tamam') {
      deneme = 0;
      durum = 'hazir';
    } else if (r === 'tekrar' && deneme < iapConfig.yeniden.length) {
      durum = fiyatVar ? 'hazir' : 'yukleniyor';
      zaman = setTimeout(() => { zaman = null; void magazaYenile('yeniden'); }, iapConfig.yeniden[deneme++] * 1000);
    } else {
      durum = fiyatVar ? 'hazir' : 'yok';
    }
    bildir();
  })();
  ucus = p;
  void p.finally(() => { if (ucus === p) ucus = null; });
  return p;
}

/** `hazir`: en az bir fiyat var · `yukleniyor`: deneniyor · `yok`: denemeler tükendi ya da cihazda kapalı. */
export const magazaDurumu = (): MagazaDurumu => durum;

/**
 * Uygulama açılışında bir kez. Mağazanın bildiği sahiplikleri döndürür (okunamadıysa null —
 * o durumda kayıttaki önbellek geçerli kalır). `ozel` verilirse o arka uç kullanılır (test).
 */
export async function satinAlmaBaslat(ozel?: SatinAlmaArkaUcu): Promise<Sahiplik | null> {
  nesil++;
  if (zaman) clearTimeout(zaman);
  zaman = null;
  ucus = null;
  deneme = 0;
  arkaUc = null;
  fiyat = {};
  islemdeki = null;
  durum = 'yukleniyor';
  secilen = ozel ?? undefined;
  await magazaYenile('acilis');
  const a = arkaUc as SatinAlmaArkaUcu | null;
  return a ? dene(async () => (await a.musteri()).hak, null) : null;
}

/** Ürünün mağaza fiyatı (satın alma sürerken de görünür). Fiyatı bilinmeyen ürün satılmaz. */
export const urunFiyati = (urun: string): string | null => (arkaUc ? fiyat[urun] ?? null : null);
export const magazaHazir = () => arkaUc != null;
/** Bir satın alma sürüyor mu (o sırada diğer düğmeler kilitli). */
export const satinAlmaMesgul = () => islemdeki != null;
/** Sürmekte olan satın almanın ürünü — düğmede "Bekleniyor…". */
export const islemdeUrun = () => islemdeki;

export function satinAlmaAbone(f: () => void): () => void {
  dinleyiciler.add(f);
  return () => dinleyiciler.delete(f);
}

/**
 * Mağazanın her müşteri bilgisi (açılış/yenileme · RevenueCat dinleyicisi · geri yükleme · "zaten
 * sahip") buraya gelir → store `magazaUzlas` ile uygular. Satın alma dönüşünün bilgisi `satinAlDetay`
 * cevabındadır (dinleyici de genelde ayrıca getirir; uzlaşma aynı işlemi iki kez ödemez).
 */
export function uzlasmaDinle(cb: (m: MusteriOzu) => void): () => void {
  uzlasmaDinleyicileri.add(cb);
  return () => uzlasmaDinleyicileri.delete(cb);
}

export async function satinAlDetay(urun: string): Promise<SatinAlCevap> {
  const a = arkaUc;
  if (!a || islemdeki || !fiyat[urun]) return { sonuc: 'hata' };
  islemdeki = urun;
  bildir();
  const c = await dene(() => a.satinAl(urun), { sonuc: 'hata' } as SatinAlCevap);
  if (c.sonuc === 'zatenSahip') {
    const m = await dene(() => a.musteri(), null);
    if (m) musteriBildir(m);
  }
  islemdeki = null;
  bildir();
  return c;
}

/** Eski arayüz: yalnız başarılı işlem (sonuç ayrımı için `satinAlDetay` / `useSatinAl`). */
export async function satinAl(urun: string): Promise<Islem | null> {
  return (await satinAlDetay(urun)).islem ?? null;
}

export async function satinAlimlariGeriYukle(): Promise<Sahiplik | null> {
  const a = arkaUc;
  if (!a) return null;
  const m = await dene(() => a.geriYukle(), null);
  if (!m) return null;
  musteriBildir(m);
  return m.hak;
}
