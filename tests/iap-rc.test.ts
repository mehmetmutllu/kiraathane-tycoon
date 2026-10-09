/**
 * BEKÇİ — Sprint A ① RevenueCat bağdaştırıcısı (sahte eklentiyle): kalıcı kimlik (configure/logIn),
 * Android sessiz syncPurchases (iOS'ta yok), gerçek işlem kimliği, hata kodu → sonuç, dinleyici.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const plt = vi.hoisted(() => ({ p: 'android' as 'android' | 'ios' | null }));
vi.mock('../src/game/platform', () => ({ magazaPlatformu: () => plt.p }));

const rc = vi.hoisted(() => {
  const bilgi = (islemler: { id: string; urun: string; tarih: string }[], aktif: string[] = []) => ({
    entitlements: { active: Object.fromEntries(aktif.map((a) => [a, {}])) },
    nonSubscriptionTransactions: islemler.map((t) => ({
      transactionIdentifier: t.id, productIdentifier: t.urun, purchaseDate: t.tarih,
    })),
  });
  const durum = { kimlik: 'anon_1', dinleyici: null as null | ((b: unknown) => void) };
  const Purchases = {
    configure: vi.fn(async (o: { appUserID?: string }) => { if (o.appUserID) durum.kimlik = o.appUserID; }),
    logIn: vi.fn(async (o: { appUserID: string }) => { durum.kimlik = o.appUserID; return {}; }),
    getAppUserID: vi.fn(async () => ({ appUserID: durum.kimlik })),
    syncPurchases: vi.fn(async () => {}),
    restorePurchases: vi.fn(async () => ({ customerInfo: bilgi([]) })),
    addCustomerInfoUpdateListener: vi.fn(async (cb: (b: unknown) => void) => { durum.dinleyici = cb; return 'id'; }),
    getProducts: vi.fn(async (o: { productIdentifiers: string[] }) => ({
      products: o.productIdentifiers.map((identifier) => ({ identifier, priceString: '9 ₺' })),
    })),
    purchaseStoreProduct: vi.fn(),
    getCustomerInfo: vi.fn(async () => ({ customerInfo: bilgi([]) })),
  };
  return { Purchases, durum, bilgi };
});
vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: rc.Purchases, PRODUCT_CATEGORY: { NON_SUBSCRIPTION: 'NON_SUBSCRIPTION' },
}));

import { revenueCatArkaUcu } from '../src/game/iap';
import { rcKimlik } from '../src/game/kalicilik';
import { iapConfig } from '../src/config/iap.config';
import type { MusteriOzu } from '../src/game/satinAlimUzlas';

const mem: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};
const U = iapConfig.urun;

beforeEach(() => {
  for (const k of Object.keys(mem)) delete mem[k];
  Object.values(rc.Purchases).forEach((f) => f.mockClear());
  rc.durum.kimlik = 'anon_1';
  plt.p = 'android';
});

describe('kalıcı kimlik (P2)', () => {
  it('ilk açılış: anonimle kurulur, logIn kalıcı kimliğe bağlar; sonraki açılış doğrudan kimlikle', async () => {
    await (await revenueCatArkaUcu('k')).kur();
    const k = rcKimlik();
    expect(rc.Purchases.configure).toHaveBeenLastCalledWith({ apiKey: 'k' });
    expect(rc.Purchases.logIn).toHaveBeenCalledWith({ appUserID: k });
    await (await revenueCatArkaUcu('k')).kur();
    expect(rc.Purchases.configure).toHaveBeenLastCalledWith({ apiKey: 'k', appUserID: k });
    expect(rc.Purchases.logIn).toHaveBeenCalledTimes(1);
  });
  it('logIn düşerse kurulum yine biter, sonraki açılışta yeniden denenir', async () => {
    rc.Purchases.logIn.mockRejectedValueOnce({ code: '10' });
    const a = await revenueCatArkaUcu('k');
    await a.kur();
    expect((await a.musteri()).kimlik).toBe('anon_1');
    await (await revenueCatArkaUcu('k')).kur();
    expect(rc.Purchases.logIn).toHaveBeenCalledTimes(2);
    expect(rc.Purchases.configure).toHaveBeenLastCalledWith({ apiKey: 'k' });
  });
});

describe('sessiz eşitleme', () => {
  it('Android açılışta syncPurchases', async () => {
    await (await revenueCatArkaUcu('k')).kur();
    expect(rc.Purchases.syncPurchases).toHaveBeenCalledTimes(1);
    expect(rc.Purchases.restorePurchases).not.toHaveBeenCalled();
  });
  it('iOS\'ta sessiz restore/sync YOK', async () => {
    plt.p = 'ios';
    await (await revenueCatArkaUcu('k')).kur();
    expect(rc.Purchases.syncPurchases).not.toHaveBeenCalled();
    expect(rc.Purchases.restorePurchases).not.toHaveBeenCalled();
  });
});

describe('satın alma', () => {
  it('işlem kimliği customerInfo\'dan (sahte `${urun}:${Date.now()}` yok)', async () => {
    rc.Purchases.purchaseStoreProduct.mockResolvedValueOnce({
      productIdentifier: U.elmas[0],
      transaction: { transactionIdentifier: 'magaza-1' },
      customerInfo: rc.bilgi([
        { id: 'rc-eski', urun: U.elmas[0], tarih: '2026-10-01T00:00:00Z' },
        { id: 'rc-yeni', urun: U.elmas[0], tarih: '2026-10-09T00:00:00Z' },
      ]),
    });
    const a = await revenueCatArkaUcu('k');
    await a.kur();
    const c = await a.satinAl(U.elmas[0]);
    expect(c.sonuc).toBe('tamam');
    expect(c.islem).toEqual({ islem: 'rc-yeni', urun: U.elmas[0] });
    expect(c.musteri?.islemler).toHaveLength(2);
  });
  it('customerInfo işlemi yoksa mağazanın işlem kimliği; ikisi de yoksa islem boş (uzlaşma yakalar)', async () => {
    const a = await revenueCatArkaUcu('k');
    rc.Purchases.purchaseStoreProduct.mockResolvedValueOnce({
      productIdentifier: U.reklamsiz, transaction: { transactionIdentifier: 'magaza-2' }, customerInfo: rc.bilgi([]),
    });
    expect((await a.satinAl(U.reklamsiz)).islem?.islem).toBe('magaza-2');
    rc.Purchases.purchaseStoreProduct.mockResolvedValueOnce({
      productIdentifier: U.reklamsiz, transaction: null, customerInfo: rc.bilgi([], ['reklamsiz']),
    });
    const c = await a.satinAl(U.reklamsiz);
    expect(c.sonuc).toBe('tamam');
    expect(c.islem).toBeUndefined();
    expect(c.musteri?.hak.reklamsiz).toBe(true);
  });
  it('iptal / bekleyen / zaten sahip / ağ ayrı sonuç', async () => {
    const a = await revenueCatArkaUcu('k');
    for (const [code, beklenen] of [['1', 'vazgecti'], ['20', 'bekliyor'], ['6', 'zatenSahip'], ['10', 'hata']] as const) {
      rc.Purchases.purchaseStoreProduct.mockRejectedValueOnce({ code, message: 'x' });
      expect((await a.satinAl(U.elmas[0])).sonuc).toBe(beklenen);
    }
  });
});

describe('dinleyici', () => {
  it('RevenueCat müşteri güncellemesi özüyle dışarı verilir', async () => {
    const a = await revenueCatArkaUcu('k');
    const gelen: MusteriOzu[] = [];
    a.dinle!((m) => gelen.push(m));
    await a.kur();
    rc.durum.dinleyici!(rc.bilgi([{ id: 'x', urun: U.elmas[1], tarih: '2026-10-09T10:00:00Z' }], ['reklamsiz']));
    expect(gelen).toEqual([{
      kimlik: rcKimlik(),
      hak: { reklamsiz: true, baslangic: false },
      islemler: [{ kimlik: 'x', urun: U.elmas[1], tarih: Date.parse('2026-10-09T10:00:00Z') }],
    }]);
  });
});
