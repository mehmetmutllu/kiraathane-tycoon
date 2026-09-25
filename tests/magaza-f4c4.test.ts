/**
 * BEKÇİ — F4c-4 💎 vitrini cilası (D-157). Ölçüm: `docs/magaza-raporu-f4c4.md`. Kullanıcı kararı ("senin önerin
 * olsun"): dekor salondaki YERİNDE çapraz uzak (%25) · teklif T3 · satın alma metinleri + alım geri bildirimi.
 *
 * Neyi korur:
 *  - KADRAJ: kamera çizilen gövdenin MERKEZİNE bakar (eşya hep ortada — kullanıcı: "ortalı değil"); mesafe eşyayı
 *    dikeyin %25'i yapar (koltuk da kanarya da aynı boyda); açı ÇAPRAZ — yan duvarda odanın İÇİNDEN (oyunun
 *    güneyden bakan kamerası yan duvar eşyasını yandan görüyordu, tablo 0 px: B10).
 *  - ÖNİZLEME GEÇİCİ: alınmamış ürün yalnız önizlemede kendi yuvasında çizilir; yuvanın salonu kapalıysa çizilmez;
 *    kayda / yerleşime / sahipliğe hiç girmez.
 *  - ALIM SESSİZ DEĞİL: 💎/₺ kozmetik alımı bildirim (çizilen tür) + satın alma sesi doğurur; gerçek para alımı
 *    işlenmiş işlem sayacından ses doğurur, geri yükleme (işlem yok) doğurmaz.
 *  - METİN: elmas paketlerinin ayrı adları; eski metinler geri gelmez.
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGame, kayitVerisi } from '../src/game/store';
import { D } from '../src/game/decimal';
import { dekorKadraj } from '../src/game/dekorKadraj';
import { DEKOR_KADRAJ, VITRIN_YUVALARI } from '../src/config/decor';
import { cizilenDekor, gorunenDekor, satinBildirimi } from '../src/game/vitrin';
import { CIZILEN_TOAST, toastCizilir } from '../src/game/rules';
import { sesOlaylari, type SesKesit } from '../src/game/audio';
import { kesitAl } from '../src/game/audioBridge';
import { economyConfig } from '../src/config/economy.config';
import { defaultSatinAlim } from '../src/game/save';

const mem: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};

const dikeyPay = (olcu: number, uzaklik: number) => olcu / (2 * uzaklik * Math.tan((DEKOR_KADRAJ.fov * Math.PI) / 360));

describe('dekor kadrajı (D-157 · B9/B10)', () => {
  it('kullanıcının seçtiği mesafe: eşya dikeyin %25i', () => {
    expect(DEKOR_KADRAJ.pay).toBe(0.25);
  });
  it('kamera gövdenin MERKEZİNE bakar — eşya ortada', () => {
    const k = dekorKadraj([-17.8, 0, -4.7], [-16.9, 0.86, -3.5], 'sol');
    expect(k.hedef[0]).toBeCloseTo(-17.35, 5);
    expect(k.hedef[1]).toBeCloseTo(0.43, 5);
    expect(k.hedef[2]).toBeCloseTo(-4.1, 5);
  });
  it('boy ne olursa olsun eşya aynı payı kaplar (koltuk = kanarya kafesi)', () => {
    const koltuk = dekorKadraj([0, 0, 0], [1.1, 0.86, 1.2], 'sol');
    const kafes = dekorKadraj([0, 0, 0], [0.45, 1.85, 0.45], 'sag');
    const olcu = (b: number, y: number) => Math.max(b, y * DEKOR_KADRAJ.yatayCarpan, DEKOR_KADRAJ.enAzOlcu);
    expect(dikeyPay(olcu(0.86, 1.2), koltuk.uzaklik)).toBeCloseTo(0.25, 5);
    expect(dikeyPay(olcu(1.85, 0.45), kafes.uzaklik)).toBeCloseTo(0.25, 5);
    expect(kafes.uzaklik).toBeGreaterThan(koltuk.uzaklik);
  });
  it('yassı eşya (tablo) yatay kenarıyla okunur — kamera dibine girmez', () => {
    const tablo = dekorKadraj([0, 1.45, 0], [0.05, 2.2, 1.1], 'sol');
    expect(dikeyPay(1.1 * DEKOR_KADRAJ.yatayCarpan, tablo.uzaklik)).toBeCloseTo(0.25, 5);
  });
  it('çok küçük gövdede bile en az ölçüyle durur', () => {
    const k = dekorKadraj([0, 0, 0], [0.1, 0.1, 0.1], 'wc');
    expect(dikeyPay(DEKOR_KADRAJ.enAzOlcu, k.uzaklik)).toBeCloseTo(0.25, 5);
  });
  it('ÇAPRAZ: yan duvarda kamera odanın İÇİNDE (sol → +x, sağ → −x), yukarıda ve güneyde', () => {
    const sol = dekorKadraj([-17.8, 0, -4], [-17, 1, -3], 'sol');
    expect(sol.kamera[0]).toBeGreaterThan(sol.hedef[0] + 1);
    const sag = dekorKadraj([17, 0, -4], [17.8, 1, -3], 'sag');
    expect(sag.kamera[0]).toBeLessThan(sag.hedef[0] - 1);
    for (const k of [sol, sag]) {
      expect(k.kamera[1]).toBeGreaterThan(k.hedef[1] + 1);
      expect(k.kamera[2]).toBeGreaterThan(k.hedef[2] + 1);
    }
  });
  it('karşı duvar (saat) hafif yandan ama büyük ölçüde önden', () => {
    const k = dekorKadraj([8, 1, -9.8], [8.4, 2.1, -9.6], 'wc');
    const dx = k.kamera[0] - k.hedef[0];
    const dz = k.kamera[2] - k.hedef[2];
    expect(dz).toBeGreaterThan(0);
    expect(Math.abs(dx)).toBeGreaterThan(0.1);
    expect(Math.abs(dx)).toBeLessThan(dz);
  });
  it('bütün yuvalar kadraja giriyor (duvar adı yön tablosunda)', () => {
    for (const y of VITRIN_YUVALARI) expect(DEKOR_KADRAJ.yon[y.duvar]).toHaveLength(3);
  });
});

describe('önizleme eşyası GEÇİCİ (cizilenDekor)', () => {
  const taban = { dekor: {}, ownedCosmetics: [] as string[], satin: { baslangic: false }, areasOpen: 1 };
  it('önizleme yoksa görünen dekorla aynı', () => {
    const s = { ...taban, ownedCosmetics: ['decor:yilbasi-kirmizi'], dekor: { yilbasi: 'yilbasi-kirmizi' } };
    expect(cizilenDekor(s, null)).toEqual(gorunenDekor(s));
  });
  it('alınmamış ürün önizlemede kendi yuvasında çizilir', () => {
    expect(cizilenDekor(taban, 'yilbasi-mavi')).toEqual([{ yuva: 'yilbasi', id: 'yilbasi-mavi' }]);
  });
  it('aynı yuvadaki ürünün YERİNE geçer (iki koltuk üst üste çizilmez)', () => {
    const s = { ...taban, ownedCosmetics: ['decor:yilbasi-kirmizi'], dekor: { yilbasi: 'yilbasi-kirmizi' } };
    expect(cizilenDekor(s, 'yilbasi-yesil')).toEqual([{ yuva: 'yilbasi', id: 'yilbasi-yesil' }]);
  });
  it('yuvanın salonu kapalıysa çizilmez (mağaza yalıtık önizlemeye düşer)', () => {
    expect(cizilenDekor(taban, 'semaver')).toEqual([]);
    expect(cizilenDekor({ ...taban, areasOpen: 3 }, 'semaver')).toEqual([{ yuva: 'semaver', id: 'semaver' }]);
  });
  it('bilinmeyen ürün hiçbir şey eklemez', () => {
    expect(cizilenDekor(taban, 'yok-boyle')).toEqual([]);
  });
});

describe('önizleme store alanı kayda girmez', () => {
  beforeEach(() => {
    useGame.getState().hardReset();
  });
  it('setDekorOnizleme yalnız durumu değiştirir: sahiplik, yerleşim, kayıt aynı', () => {
    // Kayıt görüntüsü zaman damgası taşıyor: iki çağrı farklı milisaniyeye düşerse boşa kırılırdı.
    vi.useFakeTimers({ now: new Date('2026-09-25T12:00:00Z') });
    const once = JSON.stringify(kayitVerisi(useGame.getState()));
    useGame.getState().setDekorOnizleme('yilbasi-mavi');
    const s = useGame.getState();
    expect(s.dekorOnizleme).toBe('yilbasi-mavi');
    expect(s.dekor).toEqual({});
    expect(s.ownedCosmetics).toEqual([]);
    expect(JSON.stringify(kayitVerisi(s))).toBe(once);
    expect(JSON.stringify(kayitVerisi(s))).not.toContain('dekorOnizleme');
    vi.useRealTimers();
  });
});

describe('alım sessiz bitmez: bildirim (metin 14)', () => {
  beforeEach(() => {
    useGame.getState().hardReset();
    useGame.setState({ diamonds: D(300), ownedCosmetics: [], dekor: {}, notice: null });
  });
  it('bildirim türü çizilen listede', () => {
    expect(CIZILEN_TOAST).toContain('satin');
  });
  it('dekor alınca "salona kondu", ikinci basışta "salondan kaldırıldı"', () => {
    const al = useGame.getState().buyGemCosmetic;
    al('decor', 'yilbasi-kirmizi');
    let n = useGame.getState().notice;
    expect(toastCizilir(n)).toBe(true);
    expect(n?.kind).toBe('satin');
    expect(n?.text).toBe('Yılbaşı Koltuğu · Kırmızı salona kondu');
    expect(n?.ttl).toBe(economyConfig.cosmetics.bildirimSn);
    al('decor', 'yilbasi-kirmizi');
    n = useGame.getState().notice;
    expect(n?.text).toBe('Yılbaşı Koltuğu · Kırmızı salondan kaldırıldı');
  });
  it('kıyafet ve tepsi de bildirir; alınamayan hiçbir şey bildirmez', () => {
    const al = useGame.getState().buyGemCosmetic;
    al('outfit', 'yesil');
    expect(useGame.getState().notice?.text).toMatch(/giyildi$/);
    useGame.setState({ notice: null, diamonds: D(0) });
    expect(al('tray', 'altin')).toBe(false);
    expect(useGame.getState().notice).toBeNull();
  });
  it('₺ temaları da bildirir (zemin salonuyla)', () => {
    useGame.setState({ wallet: D(1e9) });
    const t = economyConfig.cosmetics.floorThemes.find((x) => x.cost > 0)!;
    expect(useGame.getState().buyCosmetic('floor', t.id, 0)).toBe(true);
    expect(useGame.getState().notice?.text).toBe(`${t.label} · 1. Salon`);
  });
  it('metin ürün adıyla başlar (Türkçe ek ada göre değişmesin)', () => {
    expect(satinBildirimi('decor', 'Gramofon')).toBe('Gramofon salona kondu');
    expect(satinBildirimi('tray', 'Altın Tepsi')).toBe('Altın Tepsi artık elinde');
    expect(satinBildirimi('table', 'Kırmızı')).toBe('Kırmızı uygulandı');
  });
});

describe('alım sessiz bitmez: ses', () => {
  const TABAN: SesKesit = {
    coinsCollected: 0, teaPickups: 0, served: 0, yukseltmeToplam: 0,
    padSayisi: 0, questIndex: 0, seviye: 1, ustaSayisi: 0, odulSayisi: 0, alimSayisi: 0,
  };
  it('alım sayacı artınca satın alma sesi', () => {
    expect(sesOlaylari(TABAN, { ...TABAN, alimSayisi: 1 })).toContain('purchase');
    expect(sesOlaylari(TABAN, TABAN)).not.toContain('purchase');
  });
  it('sayaç = kozmetik sahipliği + İŞLENMİŞ mağaza işlemi; geri yükleme (işlem yok) saymaz', () => {
    useGame.getState().hardReset();
    const once = kesitAl(useGame.getState()).alimSayisi;
    useGame.setState({ diamonds: D(300) });
    useGame.getState().buyGemCosmetic('outfit', 'yesil');
    expect(kesitAl(useGame.getState()).alimSayisi).toBe(once + 1);
    useGame.setState({ satin: { ...defaultSatinAlim(), islenen: ['t1'] } });
    expect(kesitAl(useGame.getState()).alimSayisi).toBe(once + 2);
    useGame.getState().sahiplikEsitle({ reklamsiz: true, baslangic: true });
    expect(kesitAl(useGame.getState()).alimSayisi).toBe(once + 2);
  });
});

describe('metinler (metin tablosu 1-13)', () => {
  // Yalnız KOD (ekrana çıkan metin): gerekçe yorumları eski metni ve yasak kalıpları anarak açıklıyor.
  const hud = readFileSync('src/components/ui/HUD.tsx', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  it('elmas paketlerinin ayrı adları var, sayısı paketlerle aynı', () => {
    const P = economyConfig.iap;
    expect(P.diamondPackLabels).toHaveLength(P.diamondPacks.length);
    expect(new Set(P.diamondPackLabels).size).toBe(P.diamondPackLabels.length);
  });
  it('eski metinler geri gelmez', () => {
    for (const eski of ['Mağaza hazır değil', 'Şu an uygulanmış', "'Paketlere Git'", 'İstediğin kadar alınır', 'Bir kereye özel', 'Fiyatlar mağazanın para biriminde']) {
      expect(hud).not.toContain(eski);
    }
  });
  it('teklif baskı kurmaz: "Şimdi değil" duruyor, geri sayım/son fırsat yok', () => {
    expect(hud).toContain('Şimdi değil');
    expect(hud).toContain('Bir kez alınabilir');
    expect(hud).not.toMatch(/son fırsat|kaçırma|geri sayım/i);
  });
});
