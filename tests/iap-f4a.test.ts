/**
 * BEKÇİ — F4a satın alımlar (D-152 · `docs/iap-raporu-f4a.md`).
 * Başlangıç 100 💎 (B100) · paketler 25/60/150 (250'lik talebin içinde) · Reklamları Kaldır geçişliyi
 * kaldırır + günde 10 💎 · aynı işlem iki kez ödül vermez · başlangıç 💎'ı bir kez · sıfırlama satın
 * alımı silmez · vitrin 💎 kozmetik turuna dek kapalı · cihazda anahtarsız sahte arka uç YOK.
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '../src/game/store';
import { applyPurchase, adFreeDailyReady, purchaseGrant } from '../src/game/rules';
import { defaultSatinAlim, derinBirlestir, defaultSave, type SaveData } from '../src/game/save';
import { gecisliUygun, reklamDurumu } from '../src/game/ads';
import { satinAl, satinAlmaBaslat, sahteArkaUc, urunFiyati, tumUrunler } from '../src/game/iap';
import { dayIndex } from '../src/game/dailyQuests';
import { economyConfig as C } from '../src/config/economy.config';
import { iapConfig } from '../src/config/iap.config';
import { D } from '../src/game/decimal';

const mem: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};
const oku = (p: string) => readFileSync(p, 'utf8');
const U = iapConfig.urun;
/** 💎'ın bütün talebi (rapor §2): 20 masa × Usta fiyatı − hedeflerin ödediği. */
const HEDEF_ELMAS = C.goals.categories.reduce(
  (a, cat) => a + cat.tiers.reduce((b, _t, ti) => b + (C.goals.diamondByTier[ti] ?? 0), 0), 0);
const TALEP = 20 * C.master.diamondCost - HEDEF_ELMAS;

describe('ölçülen sayılar config\'te (D-152)', () => {
  it('başlangıç 100 · paketler 25/60/150 · reklamsız 10/gün', () => {
    expect(C.iap.starterDiamonds).toBe(100);
    expect([...C.iap.diamondPacks]).toEqual([25, 60, 150]);
    expect(C.iap.removeAdsDiamondsPerDay).toBe(10);
  });
  it('her paket kalan talebin içinde (gün 0\'da ölü 💎 yok)', () => {
    expect(TALEP).toBe(250);
    for (const p of C.iap.diamondPacks) expect(p).toBeLessThanOrEqual(TALEP);
  });
  it('ürün kimlikleri paket boylarıyla aynı sırada ve aynı sayıda', () => {
    expect(U.elmas.length).toBe(C.iap.diamondPacks.length);
    U.elmas.forEach((u, i) => expect(purchaseGrant(u)?.diamonds).toBe(C.iap.diamondPacks[i]));
  });
  it('vitrin kapalı: başlangıç ve elmas 💎 kozmetik turuna dek görünmez', () => {
    expect(iapConfig.vitrin.baslangic).toBe(false);
    expect(iapConfig.vitrin.elmas).toBe(false);
  });
});

describe('satın alım kuralı (saf)', () => {
  const bos = defaultSatinAlim();
  it('Reklamları Kaldır: 💎 yok, bayrak var', () => {
    const r = applyPurchase(bos, 't1', U.reklamsiz)!;
    expect(r.diamonds).toBe(0);
    expect(r.satin.reklamsiz).toBe(true);
  });
  it('başlangıç 💎\'ı YALNIZ bir kez (ikinci işlem ya da mağazanın tekrar bildirimi 0)', () => {
    const a = applyPurchase(bos, 't1', U.baslangic)!;
    expect(a.diamonds).toBe(100);
    expect(a.satin.baslangic).toBe(true);
    expect(applyPurchase(a.satin, 't2', U.baslangic)!.diamonds).toBe(0);
  });
  it('aynı işlem iki kez gelirse hiçbir şey vermez', () => {
    const a = applyPurchase(bos, 't1', U.elmas[1])!;
    expect(a.diamonds).toBe(60);
    expect(applyPurchase(a.satin, 't1', U.elmas[1])).toBeNull();
  });
  it('elmas paketi tekrar tekrar alınır', () => {
    const a = applyPurchase(bos, 't1', U.elmas[0])!;
    const b = applyPurchase(a.satin, 't2', U.elmas[0])!;
    expect(a.diamonds + b.diamonds).toBe(50);
  });
  it('bilinmeyen ürün reddedilir', () => {
    expect(applyPurchase(bos, 't1', 'baska_urun')).toBeNull();
  });
  it('işlenen listesi sınırlı (kayıt şişmez)', () => {
    let s = bos;
    for (let i = 0; i < 80; i++) s = applyPurchase(s, `t${i}`, U.elmas[0])!.satin;
    expect(s.islenen.length).toBe(50);
    expect(s.islenen.at(-1)).toBe('t79');
  });
  it('reklamsız hediye: yalnız reklamsıza, günde bir', () => {
    expect(adFreeDailyReady(bos, 5)).toBe(false);
    const r = { ...bos, reklamsiz: true };
    expect(adFreeDailyReady(r, 5)).toBe(true);
    expect(adFreeDailyReady({ ...r, gunlukGun: 5 }, 5)).toBe(false);
    expect(adFreeDailyReady({ ...r, gunlukGun: 5 }, 6)).toBe(true);
  });
});

describe('geçişli: reklamsız oyuncuya hiç çıkmaz', () => {
  it('soğuma dolsa da false', () => {
    const g = { simdi: 1e9, oturumBasi: 0, sonGecisli: null, panelOdul: false, reklamAcik: false, sogumaSn: 180 };
    expect(gecisliUygun({ ...g, reklamsiz: false })).toBe(true);
    expect(gecisliUygun({ ...g, reklamsiz: true })).toBe(false);
  });
});

describe('store: satın alım akışı', () => {
  beforeEach(() => {
    for (const k of Object.keys(mem)) delete mem[k];
    useGame.getState().init();
  });

  it('Reklamları Kaldır reklam katmanına iner', () => {
    expect(reklamDurumu().reklamsiz).toBe(false);
    useGame.getState().satinAlimIsle({ islem: 'a', urun: U.reklamsiz });
    expect(reklamDurumu().reklamsiz).toBe(true);
  });
  it('💎 cüzdana gelir, aynı işlem ikinci kez gelmez', () => {
    useGame.setState({ diamonds: D(0) });
    expect(useGame.getState().satinAlimIsle({ islem: 'a', urun: U.elmas[2] })).toBe(150);
    expect(useGame.getState().satinAlimIsle({ islem: 'a', urun: U.elmas[2] })).toBeNull();
    expect(useGame.getState().diamonds.toNumber()).toBe(150);
  });
  it('reklamsız hediyesi günde bir kez 10 💎', () => {
    useGame.setState({ diamonds: D(0) });
    expect(useGame.getState().claimAdFreeDaily()).toBe(0);
    useGame.getState().satinAlimIsle({ islem: 'a', urun: U.reklamsiz });
    expect(useGame.getState().claimAdFreeDaily()).toBe(10);
    expect(useGame.getState().claimAdFreeDaily()).toBe(0);
    expect(useGame.getState().diamonds.toNumber()).toBe(10);
    expect(useGame.getState().satin.gunlukGun).toBe(dayIndex(Date.now()));
  });
  it('kayda gider ve geri okunur', () => {
    useGame.getState().satinAlimIsle({ islem: 'a', urun: U.baslangic });
    useGame.getState().saveNow();
    useGame.getState().init();
    expect(useGame.getState().satin.baslangic).toBe(true);
    expect(useGame.getState().satin.islenen).toContain('a');
  });
  it('oyunu sıfırlamak satın alımı silmez (💎 gider)', () => {
    useGame.getState().satinAlimIsle({ islem: 'a', urun: U.reklamsiz });
    useGame.getState().satinAlimIsle({ islem: 'b', urun: U.elmas[0] });
    useGame.getState().hardReset();
    expect(useGame.getState().satin.reklamsiz).toBe(true);
    expect(useGame.getState().diamonds.toNumber()).toBe(0);
    expect(reklamDurumu().reklamsiz).toBe(true);
  });
  it('mağaza kaynaktır: iade edilen reklamsız düşer, 💎 verilmez', () => {
    useGame.getState().satinAlimIsle({ islem: 'a', urun: U.reklamsiz });
    const once = useGame.getState().diamonds.toNumber();
    useGame.getState().sahiplikEsitle({ reklamsiz: false, baslangic: false });
    expect(useGame.getState().satin.reklamsiz).toBe(false);
    expect(reklamDurumu().reklamsiz).toBe(false);
    useGame.getState().sahiplikEsitle({ reklamsiz: true, baslangic: true });
    expect(useGame.getState().diamonds.toNumber()).toBe(once);
  });
});

describe('kayıt: eski kayıt satın alımsız açılır', () => {
  it('satin alanı yoksa varsayılan dolar (sürüm artmaz)', () => {
    const { satin: _yok, ...eski } = defaultSave();
    const b = derinBirlestir(defaultSave(), eski) as SaveData;
    expect(b.satin).toEqual(defaultSatinAlim());
  });
});

describe('satın alma katmanı', () => {
  it('sahte arka uç: fiyat okunur, satın alma işlem döner', async () => {
    const h = await satinAlmaBaslat(sahteArkaUc());
    expect(h).toEqual({ reklamsiz: false, baslangic: false });
    expect(urunFiyati(U.reklamsiz)).toBe('Test');
    const r = await satinAl(U.reklamsiz);
    expect(r?.urun).toBe(U.reklamsiz);
    expect(tumUrunler()).toHaveLength(2 + C.iap.diamondPacks.length);
  });
  it('fiyatı bilinmeyen ürün satılmaz', async () => {
    await satinAlmaBaslat({ ...sahteArkaUc(), fiyatlar: async () => ({}) });
    expect(urunFiyati(U.reklamsiz)).toBeNull();
    expect(await satinAl(U.reklamsiz)).toBeNull();
  });
  it('cihazda anahtar yoksa arka uç KAPALI — sahte arka uç cihaza düşmez', () => {
    const src = oku('src/game/iap.ts');
    expect(src).toMatch(/isNativePlatform\(\)\s*\n?\s*\?\s*\(anahtar \? await dene\(\(\) => revenueCatArkaUcu\(anahtar\), null\) : null\)/);
    expect(iapConfig.revenueCatAnahtar).toBeNull();
  });
});

describe('arayüz kabloları', () => {
  const hud = oku('src/components/ui/HUD.tsx');
  it('paketler sekmesi · geri yükle · reklamsız hediyesi var', () => {
    expect(hud).toContain("{ k: 'paket', label: 'Paketler' }");
    expect(hud).toContain('data-testid="geri-yukle"');
    expect(hud).toContain('data-testid="reklamsiz-hediye-al"');
  });
  it('satın alma düğmesi fiyat bilinmeden basılamaz ve ödül store\'dan geçer', () => {
    expect(hud).toContain('disabled={sahip || !fiyat}');
    expect(hud).toContain('if (r) satinAlimIsle(r);');
  });
  it('açılışta mağaza sahiplikleri eşitlenir', () => {
    expect(oku('src/App.tsx')).toContain('satinAlmaBaslat().then((h) => h && useGame.getState().sahiplikEsitle(h))');
  });
});
