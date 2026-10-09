/**
 * BEKÇİ — Sprint A ② reklam dayanıklılığı (tarama raporu §2 #2, #5 · perf #5).
 *  - Takılan reklam en geç `adsConfig.gosterim.ustSinirSn`de çözülür, `reklamEkranda()` false'a döner.
 *  - "Açıldı" olayı gelmezse `acilmaSn`de gösterilemedi sayılır; dinleyiciler her yolda kaldırılır.
 *  - Ödüllü sonuç üç değerli (`odul` / `yarida` / `gosterilemedi`); ödül olayı geldiyse zaman aşımında da kaybolmaz.
 *  - Yükleme hatası sonrası geri çekilerek (15 → 30 → … → 300 sn) yeniden yüklenir.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  dinleyici: new Map<string, () => void>(),
  kaldirilan: 0,
  goster: 'ac' as 'ac' | 'acma',
  hazirlaHata: 0,
  hazirla: 0,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
  registerPlugin: () => ({}),
}));

vi.mock('@capacitor-community/admob', () => {
  const tetikle = (ad: string) => h.dinleyici.get(ad)?.();
  const goster = async () => { if (h.goster === 'ac') tetikle('s'); };
  const hazirla = async () => {
    h.hazirla++;
    if (h.hazirlaHata > 0) { h.hazirlaHata--; throw new Error('yüklenemedi'); }
  };
  return {
    AdmobConsentStatus: { REQUIRED: 'REQUIRED' },
    InterstitialAdPluginEvents: { Dismissed: 'd', FailedToShow: 'f', Showed: 's' },
    RewardAdPluginEvents: { Dismissed: 'd', FailedToShow: 'f', Showed: 's', Rewarded: 'r' },
    AdMob: {
      requestConsentInfo: async () => ({ status: 'OBTAINED', canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }),
      initialize: async () => {},
      prepareInterstitial: hazirla,
      prepareRewardVideoAd: hazirla,
      showInterstitial: goster,
      showRewardVideoAd: goster,
      addListener: async (ad: string, f: () => void) => {
        h.dinleyici.set(ad, f);
        return { remove: async () => { h.kaldirilan++; h.dinleyici.delete(ad); } };
      },
    },
  };
});

import {
  odulluIzleSonuc, odulluReklamHazir, panelKapandi, reklamBaslat, reklamDurumu, reklamEkranda, reklamSaatiKaydir,
} from '../src/game/ads';
import { adsConfig } from '../src/config/ads.config';

const tetikle = (ad: string) => h.dinleyici.get(ad)?.();
/** Bekleyen mikro görevleri (await zinciri) boşalt. */
const bosalt = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

beforeEach(() => {
  vi.useFakeTimers();
  h.dinleyici.clear();
  h.kaldirilan = 0;
  h.goster = 'ac';
  h.hazirlaHata = 0;
  h.hazirla = 0;
});
afterEach(() => { vi.useRealTimers(); });

describe('gösterim bekçisi (AdMob arka ucu, sahte zamanlayıcı)', () => {
  it('açılıp hiç kapanmayan ödüllü reklam üst sınırda çözülür; reklamAcik false, dinleyiciler kalkar', async () => {
    await reklamBaslat();
    expect(odulluReklamHazir()).toBe(true);
    const izle = odulluIzleSonuc();
    await bosalt();
    expect(reklamEkranda()).toBe(true);
    await vi.advanceTimersByTimeAsync(adsConfig.gosterim.ustSinirSn * 1000 - 1);
    expect(reklamEkranda()).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(await izle).toBe('yarida');
    expect(reklamEkranda()).toBe(false);
    expect(h.dinleyici.size).toBe(0);
    expect(h.kaldirilan).toBe(4); // Rewarded + kapandı + başarısız + açıldı
  });

  it('ödül olayı geldiyse zaman aşımında da ödül kaybolmaz', async () => {
    await reklamBaslat();
    const izle = odulluIzleSonuc();
    await bosalt();
    tetikle('r');
    await vi.advanceTimersByTimeAsync(adsConfig.gosterim.ustSinirSn * 1000);
    expect(await izle).toBe('odul');
    expect(reklamDurumu().odullu).toBe(1);
  });

  it('"açıldı" olayı gelmezse kısa sürede gösterilemedi; erken kapanış = yarıda', async () => {
    await reklamBaslat();
    h.goster = 'acma';
    const izle = odulluIzleSonuc();
    await vi.advanceTimersByTimeAsync(adsConfig.gosterim.acilmaSn * 1000);
    expect(await izle).toBe('gosterilemedi');
    expect(reklamEkranda()).toBe(false);

    h.goster = 'ac';
    await vi.advanceTimersByTimeAsync(0);
    const izle2 = odulluIzleSonuc();
    await bosalt();
    tetikle('d');
    expect(await izle2).toBe('yarida');
    expect(reklamDurumu().odullu).toBe(0);
  });

  it('takılan geçişli reklam da üst sınırda çözülür ve sonraki kapanışları kilitlemez', async () => {
    await reklamBaslat();
    reklamSaatiKaydir(adsConfig.gecisli.sogumaSn * 1000);
    const kapanis = panelKapandi();
    await bosalt();
    expect(reklamEkranda()).toBe(true);
    await vi.advanceTimersByTimeAsync(adsConfig.gosterim.ustSinirSn * 1000);
    expect(await kapanis).toBe(true); // açılmıştı: soğuma yeniden kurulur
    expect(reklamEkranda()).toBe(false);
    expect(h.dinleyici.size).toBe(0);
  });
});

describe('yükleme hatası → geri çekilmeli yeniden yükleme', () => {
  it('ilk bekleme ilkSn, sonra iki katı; başarıda hazır olur', async () => {
    h.hazirlaHata = 4; // geçişli + ödüllü ilk deneme, ardından ikişer hata daha
    await reklamBaslat();
    expect(h.hazirla).toBe(2);
    expect(reklamDurumu().odulluHazir).toBe(false);
    const ilk = adsConfig.yeniden.ilkSn * 1000;
    await vi.advanceTimersByTimeAsync(ilk - 1);
    expect(h.hazirla).toBe(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(h.hazirla).toBe(4); // ikisi de yeniden denendi, yine düştü
    await vi.advanceTimersByTimeAsync(ilk * 2 - 1);
    expect(h.hazirla).toBe(4);
    await vi.advanceTimersByTimeAsync(1);
    expect(h.hazirla).toBe(6);
    expect(reklamDurumu().odulluHazir).toBe(true);
    await vi.advanceTimersByTimeAsync(adsConfig.yeniden.tavanSn * 1000 * 2);
    expect(h.hazirla).toBe(6); // hazırken yeniden yükleme yok
  });

  it('geri çekilme tavanı aşmaz', async () => {
    h.hazirlaHata = 1e6;
    await reklamBaslat();
    // 15+30+60+120+240 = 465 sn'de 5 yeniden deneme (tür başına); sonrası her tavanSn'de bir.
    await vi.advanceTimersByTimeAsync(465_000);
    const once = h.hazirla;
    expect(once).toBe(12);
    await vi.advanceTimersByTimeAsync(adsConfig.yeniden.tavanSn * 1000);
    expect(h.hazirla).toBe(once + 2);
  });

  it('sayılar config\'te', () => {
    expect(adsConfig.yeniden).toEqual({ ilkSn: 15, tavanSn: 300 });
    expect(adsConfig.gosterim).toEqual({ acilmaSn: 10, ustSinirSn: 180 });
    expect(adsConfig.izin.gorunurBekleSn).toBe(3);
  });
});
