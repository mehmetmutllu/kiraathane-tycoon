/**
 * golge-cihaz.test.ts — GÖLGE / CİHAZ SINIFI BEKÇİSİ (Faz F · F2, D-125).
 *
 * NE İDDİA EDİYOR:
 *
 *   1. **Oyuncunun açık tercihi ölçümü EZER.** Gölge D-073'te kullanıcı tarafından özellikle
 *      geri istendi; ölçüm (%40,3 kare süresi) bir gerekçedir, vesayet değil. "Açık" diyen
 *      oyuncu zayıf telefonda da gölgesini görür.
 *   2. **'oto' yalnız ZAYIF cihazda kapatır.** Sınıf henüz ölçülmediyse gölge AÇIK başlar —
 *      bilinmeyen bir cihaz uğruna ilk izlenimi bozmak yerine ölçüp karar vermek yeğdir.
 *   3. **Sınıf ORTANCAYA bakar, ortalamaya değil.** Tek bir yükleme takılması ortalamayı
 *      bozar, ortancayı bozmaz; güçlü bir cihaz o yüzden zayıf ilan edilmemeli.
 *   4. **Yetersiz örnek sınıflandırmaz.** Yarım ölçümle karar vermek, ölçmemekten kötüdür:
 *      sonuç `localStorage`a yazılıp cihaza YAPIŞIR.
 *   5. **Ayar ADDITIVE göç eder.** `golge` alanı `saveVersion` artırmadan eklendi
 *      (`showFps` emsali); eski kayıt açıldığında alan `undefined` kalmamalı, yoksa
 *      `golgeAcikMi` tanımsız bir tercihle çağrılır.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { golgeAcikMi, sinifBelirle, ZAYIF_ESIGI_MS, ORNEK_KARE, cihazSinifiOku, cihazSinifiYaz } from '../src/game/cihazSinifi';
import { ayarlariBirlestir, defaultSettings } from '../src/game/save';

// Vitest node ortamında `localStorage` yoktur ve modül bunu doğru karşılıyor: depo yoksa
// sessizce 'bilinmiyor'a düşüyor (özel sekme davranışının aynısı). Sınıfın YAZILIP OKUNDUĞUNU
// doğrulamak içinse gerçek bir depoya ihtiyaç var — en küçük taklidi burada kuruluyor.
const sahteDepo = () => {
  const harita = new Map<string, string>();
  return {
    getItem: (k: string) => harita.get(k) ?? null,
    setItem: (k: string, v: string) => void harita.set(k, v),
    removeItem: (k: string) => void harita.delete(k),
    clear: () => harita.clear(),
    key: (i: number) => [...harita.keys()][i] ?? null,
    get length() { return harita.size; },
  } as Storage;
};
globalThis.localStorage = sahteDepo();

/** N örneklik sabit kare süresi dizisi. */
const kareler = (ms: number, n = ORNEK_KARE) => new Array(n).fill(ms);

describe('gölge tercihi × cihaz sınıfı (D-125)', () => {
  it('oyuncunun AÇIK tercihi zayıf cihazda bile kazanır', () => {
    expect(golgeAcikMi('acik', 'zayif')).toBe(true);
    expect(golgeAcikMi('acik', 'guclu')).toBe(true);
    expect(golgeAcikMi('acik', 'bilinmiyor')).toBe(true);
  });

  it('oyuncunun KAPALI tercihi güçlü cihazda bile kazanır', () => {
    expect(golgeAcikMi('kapali', 'guclu')).toBe(false);
    expect(golgeAcikMi('kapali', 'zayif')).toBe(false);
    expect(golgeAcikMi('kapali', 'bilinmiyor')).toBe(false);
  });

  it("'oto' yalnız ZAYIF cihazda kapatır; ölçülmemiş cihazda AÇIK başlar", () => {
    expect(golgeAcikMi('oto', 'zayif')).toBe(false);
    expect(golgeAcikMi('oto', 'guclu')).toBe(true);
    expect(golgeAcikMi('oto', 'bilinmiyor')).toBe(true);
  });
});

describe('cihaz sınıfı ölçümü', () => {
  it('eşiğin ALTI güçlü, ÜSTÜ zayıf', () => {
    expect(sinifBelirle(kareler(ZAYIF_ESIGI_MS - 5))).toBe('guclu');
    expect(sinifBelirle(kareler(ZAYIF_ESIGI_MS + 5))).toBe('zayif');
  });

  it('eşiğin TAM ÜSTÜNDE olmak zayıf yapmaz (sınır dahil güçlü)', () => {
    // `> ESIK` ile `>= ESIK` arasındaki fark: tam eşikte koşan cihaz 45 FPS veriyor demektir
    // ve gölgesi elinden alınmamalı. Bu satır o sınırı kilitler.
    expect(sinifBelirle(kareler(ZAYIF_ESIGI_MS))).toBe('guclu');
  });

  it('tek bir takılma ORTANCAYI bozmaz (ortalama olsaydı bozardı)', () => {
    const iyi = kareler(12);
    iyi[0] = 4000; // tek bir yükleme hitch'i
    // Ortalama ≈ 45 ms (eşiğin çok üstü) ama ortanca 12 ms.
    const ortalama = iyi.reduce((a, b) => a + b, 0) / iyi.length;
    expect(ortalama).toBeGreaterThan(ZAYIF_ESIGI_MS);
    expect(sinifBelirle(iyi)).toBe('guclu');
  });

  it('yetersiz örnekle sınıflandırmaz', () => {
    expect(sinifBelirle(kareler(50, 5))).toBe('bilinmiyor');
    expect(sinifBelirle([])).toBe('bilinmiyor');
  });

  it('depo yoksa sessizce bilinmiyor döner (özel sekme / kapalı depo)', () => {
    const yedek = globalThis.localStorage;
    // @ts-expect-error — depo bilerek kaldırılıyor
    delete globalThis.localStorage;
    expect(cihazSinifiOku()).toBe('bilinmiyor');
    expect(() => cihazSinifiYaz('zayif')).not.toThrow();
    globalThis.localStorage = yedek;
  });

  it('yazılan sınıf geri okunur, bilinmiyor temizler', () => {
    cihazSinifiYaz('zayif');
    expect(cihazSinifiOku()).toBe('zayif');
    cihazSinifiYaz('guclu');
    expect(cihazSinifiOku()).toBe('guclu');
    cihazSinifiYaz('bilinmiyor');
    expect(cihazSinifiOku()).toBe('bilinmiyor');
  });
});

describe('ayarın additive göçü', () => {
  beforeEach(() => cihazSinifiYaz('bilinmiyor'));

  it("varsayılan 'oto'", () => {
    expect(defaultSettings().golge).toBe('oto');
  });

  it('gölge alanı OLMAYAN eski kayıt varsayılanla açılır (undefined kalmaz)', () => {
    const eski = { sound: true, music: false, notifications: true, showFps: false, soundVolume: 1, musicVolume: 0.5 };
    expect(ayarlariBirlestir(eski).golge).toBe('oto');
    expect(ayarlariBirlestir(eski).music).toBe(false); // diğer alanlar korunuyor
  });

  it('geçersiz gölge değeri varsayılana düşer, geçerli olan korunur', () => {
    expect(ayarlariBirlestir({ golge: 'parlak' }).golge).toBe('oto');
    expect(ayarlariBirlestir({ golge: 'kapali' }).golge).toBe('kapali');
    expect(ayarlariBirlestir({ golge: 'acik' }).golge).toBe('acik');
  });
});
