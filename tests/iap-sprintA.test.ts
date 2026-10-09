/**
 * BEKÇİ — Sprint A ① Mağaza: tek uçuş + geri çekilme · fiyat ≠ meşgul · sonuç birleşimi ·
 * uzlaşma (çift 💎 yok, uzlasmaBasi, başlangıç 💎 bir kez) · reklamsız asimetrik eşitleme.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PURCHASES_ERROR_CODE } from '@revenuecat/purchases-typescript-internal-esm';
import {
  hataSonucu, islemdeUrun, magazaDurumu, magazaYenile, sahteArkaUc, satinAlDetay, satinAlmaBaslat,
  satinAlmaMesgul, satinAlimlariGeriYukle, urunFiyati, uzlasmaDinle, type SatinAlCevap, type SatinAlmaArkaUcu,
} from '../src/game/iap';
import { magazaUzlas, reklamsizEsitle, type MusteriOzu } from '../src/game/satinAlimUzlas';
import { applyPurchase } from '../src/game/rules';
import { defaultSatinAlim, type SatinAlim } from '../src/game/save';
import { iapConfig } from '../src/config/iap.config';
import { economyConfig as C } from '../src/config/economy.config';

const U = iapConfig.urun;
const T0 = 1_800_000_000_000;

describe('magazaYenile: tek uçuş + geri çekilme', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  const dusen = (kac: number) => {
    const a = sahteArkaUc();
    let n = 0;
    return { a: { ...a, kur: vi.fn(async () => { if (++n <= kac) throw new Error('ağ'); }) }, n: () => n };
  };

  it('bekleyişler config\'te: 2→4→8→16→30 sn', () => {
    expect([...iapConfig.yeniden]).toEqual([2, 4, 8, 16, 30]);
  });
  it('kur() düşer → yeniden denemelerle kalkar, fiyatlar kendiliğinden gelir', async () => {
    const { a } = dusen(4);
    await satinAlmaBaslat(a);
    expect(magazaDurumu()).toBe('yukleniyor');
    expect(urunFiyati(U.reklamsiz)).toBeNull();
    await vi.advanceTimersByTimeAsync(2000 + 4000 + 8000 + 16000 - 1);
    expect(a.kur).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(1);
    expect(a.kur).toHaveBeenCalledTimes(5);
    expect(magazaDurumu()).toBe('hazir');
    expect(urunFiyati(U.reklamsiz)).toBe('Test');
  });
  it('5 yeniden denemeden sonra durur → yok; "Tekrar dene" baştan başlatır', async () => {
    const { a } = dusen(6);
    await satinAlmaBaslat(a);
    await vi.advanceTimersByTimeAsync(60_000 + 5_000);
    expect(a.kur).toHaveBeenCalledTimes(6);
    expect(magazaDurumu()).toBe('yok');
    await vi.advanceTimersByTimeAsync(600_000);
    expect(a.kur).toHaveBeenCalledTimes(6);
    await magazaYenile('tekrar');
    expect(a.kur).toHaveBeenCalledTimes(7);
    expect(magazaDurumu()).toBe('hazir');
  });
  it('aynı anda gelen çağrılar tek uçuşu paylaşır', async () => {
    const { a } = dusen(1);
    await satinAlmaBaslat(a);
    const p1 = magazaYenile('onPlan');
    const p2 = magazaYenile('paketler');
    expect(p1).toBe(p2);
    await p1;
    expect(a.kur).toHaveBeenCalledTimes(2);
  });
  it('elle çağrı bekleyen geri çekilmeyi iptal eder (çift zamanlayıcı yok)', async () => {
    const { a } = dusen(1);
    await satinAlmaBaslat(a);
    await magazaYenile('tekrar');
    await vi.advanceTimersByTimeAsync(120_000);
    expect(a.kur).toHaveBeenCalledTimes(2);
  });
  it('bazı fiyatlar gelince durum hazır, eksikler için denemeye devam eder', async () => {
    let kac = 0;
    const a = { ...sahteArkaUc(), fiyatlar: vi.fn(async (u: string[]) => (++kac < 3 ? { [u[0]]: '9 ₺' } : Object.fromEntries(u.map((x) => [x, '9 ₺'])))) };
    await satinAlmaBaslat(a);
    expect(magazaDurumu()).toBe('hazir');
    expect(urunFiyati(U.baslangic)).toBeNull();
    await vi.advanceTimersByTimeAsync(6000);
    expect(urunFiyati(U.baslangic)).toBe('9 ₺');
  });
});

describe('fiyat ≠ meşgul · sonuç birleşimi', () => {
  it('satın alma sürerken fiyat görünür, meşgul ayrı okunur', async () => {
    let bitir!: (c: SatinAlCevap) => void;
    const a: SatinAlmaArkaUcu = { ...sahteArkaUc(), satinAl: () => new Promise((r) => { bitir = r; }) };
    await satinAlmaBaslat(a);
    const p = satinAlDetay(U.elmas[0]);
    expect(satinAlmaMesgul()).toBe(true);
    expect(islemdeUrun()).toBe(U.elmas[0]);
    expect(urunFiyati(U.elmas[0])).toBe('Test');
    expect(urunFiyati(U.reklamsiz)).toBe('Test');
    expect((await satinAlDetay(U.reklamsiz)).sonuc).toBe('hata'); // ikinci alım kilitli
    bitir({ sonuc: 'vazgecti' });
    expect((await p).sonuc).toBe('vazgecti');
    expect(satinAlmaMesgul()).toBe(false);
  });
  it('RevenueCat kodları: 1 iptal · 20 bekliyor · 6 zaten sahip · 10/diğer hata', () => {
    expect(PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR).toBe('1');
    expect(PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR).toBe('20');
    expect(PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR).toBe('6');
    expect(PURCHASES_ERROR_CODE.NETWORK_ERROR).toBe('10');
    expect(hataSonucu({ code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR })).toBe('vazgecti');
    expect(hataSonucu({ code: 1 })).toBe('vazgecti');
    expect(hataSonucu({ code: '99', userCancelled: true })).toBe('vazgecti');
    expect(hataSonucu({ code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR })).toBe('bekliyor');
    expect(hataSonucu({ code: PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR })).toBe('zatenSahip');
    expect(hataSonucu({ code: PURCHASES_ERROR_CODE.NETWORK_ERROR })).toBe('hata');
    expect(hataSonucu(new Error('x'))).toBe('hata');
    expect(hataSonucu(undefined)).toBe('hata');
  });
  it('arka uç fırlatırsa hata, meşgul kalmaz', async () => {
    await satinAlmaBaslat({ ...sahteArkaUc(), satinAl: async () => { throw new Error('x'); } });
    expect((await satinAlDetay(U.elmas[0])).sonuc).toBe('hata');
    expect(satinAlmaMesgul()).toBe(false);
  });
  it('sahte arka uç: tamam işlem + müşteri döner, kalıcı ürün ikinci kez zatenSahip → müşteri uzlaşmaya gider', async () => {
    await satinAlmaBaslat(sahteArkaUc());
    const gelen: MusteriOzu[] = [];
    const birak = uzlasmaDinle((m) => gelen.push(m));
    const c = await satinAlDetay(U.reklamsiz);
    expect(c.sonuc).toBe('tamam');
    expect(c.islem?.urun).toBe(U.reklamsiz);
    expect(c.musteri?.hak.reklamsiz).toBe(true);
    expect((await satinAlDetay(U.reklamsiz)).sonuc).toBe('zatenSahip');
    expect(gelen.at(-1)?.hak.reklamsiz).toBe(true);
    expect((await satinAlimlariGeriYukle())?.reklamsiz).toBe(true);
    birak();
  });
  it('yenileme müşteri bilgisini uzlaşma dinleyicisine verir', async () => {
    const gelen: MusteriOzu[] = [];
    const birak = uzlasmaDinle((m) => gelen.push(m));
    await satinAlmaBaslat(sahteArkaUc());
    expect(gelen.length).toBe(1);
    await magazaYenile('onPlan');
    expect(gelen.length).toBe(2);
    birak();
  });
});

describe('magazaUzlas (saf)', () => {
  const yeni = (ek: Partial<SatinAlim> = {}): SatinAlim => ({ ...defaultSatinAlim(), uzlasmaBasi: T0, baslangicElmas: false, ...ek });
  const bilgi = (islemler: MusteriOzu['islemler'], hak: Partial<MusteriOzu['hak']> = {}, kimlik = 'k1'): MusteriOzu =>
    ({ kimlik, hak: { reklamsiz: false, baslangic: false, ...hak }, islemler });

  it('aynı işlem iki kez gelirse 💎 bir kez', () => {
    const i = bilgi([{ kimlik: 'a', urun: U.elmas[1], tarih: T0 + 1 }]);
    const r1 = magazaUzlas(yeni(), i, T0 + 5);
    expect(r1.elmas).toBe(C.iap.diamondPacks[1]);
    const r2 = magazaUzlas(r1.satin, i, T0 + 9);
    expect(r2.elmas).toBe(0);
  });
  it('doğrudan yolun (satinAlimIsle) işlediği işlem uzlaşmada yeniden ödenmez', () => {
    const d = applyPurchase(yeni(), 'a', U.elmas[0])!;
    expect(magazaUzlas(d.satin, bilgi([{ kimlik: 'a', urun: U.elmas[0], tarih: T0 + 1 }]), T0 + 2).elmas).toBe(0);
  });
  it('uzlasmaBasi öncesi işlem yok sayılır, sonrası ödenir', () => {
    const r = magazaUzlas(yeni(), bilgi([
      { kimlik: 'eski', urun: U.elmas[2], tarih: T0 - 1 },
      { kimlik: 'yeni', urun: U.elmas[0], tarih: T0 + 1 },
      { kimlik: 'bozuk', urun: U.elmas[0], tarih: NaN },
    ]), T0 + 2);
    expect(r.elmas).toBe(C.iap.diamondPacks[0]);
    expect(r.satin.islenen).toEqual(['yeni']);
  });
  it('eski kayıt (uzlasmaBasi yok): uzlasmaBasi = şimdi, hiçbir şey verilmez', () => {
    const r = magazaUzlas(defaultSatinAlim(), bilgi([{ kimlik: 'a', urun: U.elmas[2], tarih: T0 - 10 }], { baslangic: true, reklamsiz: true }), T0);
    expect(r.elmas).toBe(0);
    expect(r.satin.uzlasmaBasi).toBe(T0);
    expect(r.satin.baslangicElmas).toBe(false);
    expect(r.satin.islenen).toEqual([]);
    // eski kayıtta başlangıç alınmışsa (applyPurchase 💎 verdi) 💎 sayılmış olur
    expect(magazaUzlas({ ...defaultSatinAlim(), baslangic: true }, bilgi([]), T0).satin.baslangicElmas).toBe(true);
  });
  it('işlemler tarih sırasıyla işlenir; islenen 50 ile sınırlı', () => {
    const islemler = Array.from({ length: 60 }, (_, i) => ({ kimlik: `t${i}`, urun: U.elmas[0], tarih: T0 + 1000 - i }));
    const r = magazaUzlas(yeni(), bilgi(islemler), T0 + 2000);
    expect(r.elmas).toBe(60 * C.iap.diamondPacks[0]);
    expect(r.satin.islenen.length).toBe(50);
    expect(r.satin.islenen.at(-1)).toBe('t0'); // en yeni en sonda
  });
  it('başlangıç 💎\'ı bir kez: işlem + hak birlikte gelince 100, tekrar 0', () => {
    const i = bilgi([{ kimlik: 's', urun: U.baslangic, tarih: T0 + 1 }], { baslangic: true });
    const r1 = magazaUzlas(yeni(), i, T0 + 2);
    expect(r1.elmas).toBe(C.iap.starterDiamonds);
    expect(r1.satin.baslangic).toBe(true);
    expect(r1.satin.baslangicElmas).toBe(true);
    expect(magazaUzlas(r1.satin, i, T0 + 3).elmas).toBe(0);
    expect(magazaUzlas({ ...r1.satin, islenen: [] }, i, T0 + 3).elmas).toBe(0);
  });
  it('kol A: geri yüklemede (işlem uzlasmaBasi öncesi) kıyafet + 💎 bu kayıtta bir kez', () => {
    const i = bilgi([{ kimlik: 's', urun: U.baslangic, tarih: T0 - 999 }], { baslangic: true });
    const r1 = magazaUzlas(yeni(), i, T0 + 2);
    expect(r1.elmas).toBe(C.iap.starterDiamonds);
    expect(r1.satin.baslangic).toBe(true);
    expect(magazaUzlas(r1.satin, i, T0 + 3).elmas).toBe(0);
  });
  it('doğrudan yol başlangıç 💎\'ını verdiyse (baslangicElmas yazılmamış) hak ikinci kez ödemez', () => {
    const d = applyPurchase(yeni({ baslangicElmas: undefined }), 's', U.baslangic)!;
    expect(d.diamonds).toBe(C.iap.starterDiamonds);
    const r = magazaUzlas(d.satin, bilgi([{ kimlik: 's', urun: U.baslangic, tarih: T0 + 1 }], { baslangic: true }), T0 + 2);
    expect(r.elmas).toBe(0);
    expect(r.satin.baslangicElmas).toBe(true);
  });
  it('reklamsız işlemi hakkı kimliğe bağlar', () => {
    const r = magazaUzlas(yeni(), bilgi([{ kimlik: 'r', urun: U.reklamsiz, tarih: T0 + 1 }], { reklamsiz: true }, 'kim'), T0 + 2);
    expect(r.elmas).toBe(0);
    expect(r.satin.reklamsiz).toBe(true);
    expect(r.satin.hakKimlik).toBe('kim');
  });
  it('başka kimlikteki boş mağaza reklamsızı düşürmez, aynı kimlikteki iade düşürür', () => {
    const s = yeni({ reklamsiz: true, hakKimlik: 'kim' });
    expect(magazaUzlas(s, bilgi([], {}, 'anonim'), T0 + 1).satin.reklamsiz).toBe(true);
    expect(magazaUzlas(s, bilgi([], {}, 'kim'), T0 + 1).satin.reklamsiz).toBe(false);
  });
});

describe('reklamsizEsitle (saf)', () => {
  const b = defaultSatinAlim();
  it('false→true hemen, kimlik bağlanır', () => {
    expect(reklamsizEsitle(b, true, 'k')).toMatchObject({ reklamsiz: true, hakKimlik: 'k' });
  });
  it('true→false yalnız aynı kimlikte', () => {
    const s = { ...b, reklamsiz: true, hakKimlik: 'k' };
    expect(reklamsizEsitle(s, false, 'baska').reklamsiz).toBe(true);
    expect(reklamsizEsitle(s, false, 'k').reklamsiz).toBe(false);
    expect(reklamsizEsitle({ ...b, reklamsiz: true }, false, 'k').reklamsiz).toBe(true); // kimliksiz eski hak düşmez
  });
  it('mağaza onaylayınca eski (anonim) bağ kalıcı kimliğe taşınır', () => {
    expect(reklamsizEsitle({ ...b, reklamsiz: true, hakKimlik: 'anon' }, true, 'k').hakKimlik).toBe('k');
  });
});
