/**
 * kare-tavani-t4.test.ts — KARE-HIZI TAVANI BEKÇİSİ (T4 · K-A · D-136).
 *
 * NE KORUYOR: `docs/perf-raporu-t4.md` §E'nin bulgusu — oyun erken sahnede **116,7 fps**
 * çiziyordu ve oyuncu 60 üstünü göremez, yalnız pil yanar. Tavan konuldu. Bu dosya tavanın
 * *kâğıt üstünde* değil **her ekran frekansında** tuttuğunu iddia eder.
 *
 * NEDEN BU TESTLER: zamanlayıcının iki inceliği (tolerans · sabit tempo) silinse ekranda hata
 * vermez, yalnız hız sessizce 48'e düşer ya da 72'ye tırmanır — yani K-A'nın kazancı fark
 * edilmeden geri alınabilir. Testler o iki sessiz bozulmayı sayıya çevirir:
 *
 *   1. Tavan yoksa her rAF çizer (ölçüm kolu `?f2fps=0` bunu geri getirir).
 *   2. Ekran = tavan (60/60): her kare çizilir, kare atlanmaz.
 *   3. Ekran tavanın KATI (120/240): tam olarak her 2./4. kare çizilir.
 *   4. Ekran tavana BÖLÜNMÜYOR (144/90): ortalama yine tavanda kalır — **tolerans** bunun için.
 *   5. Tavan AŞILMAZ: hiçbir frekansta ortalama 62'yi geçmez — **sabit tempo** bunun için.
 *   6. Oyun saati gerçek zamanı izler (yavaşlatmaz/hızlandırmaz).
 *   7. Uzun duraklama tek karede en fazla `EN_BUYUK_ADIM_MS` ilerletir (sekme dönüşü).
 *   8. Duraklama sonrası ardışık çizim yığılmaz (yakalama spirali yok).
 */
import { describe, it, expect } from 'vitest';
import { EN_BUYUK_ADIM_MS, KARE_TAVANI_FPS, kareZamanlayici } from '../src/game/kareTavani';

/** Bir ekranı taklit et: `hz` frekansında `sureMs` boyunca rAF tikleri üret. */
function ekranKosusu(tavanFps: number, hz: number, sureMs: number) {
  const dene = kareZamanlayici(tavanFps);
  const adim = 1000 / hz;
  const cizimAnlari: number[] = [];
  let gecen = 0;
  let tik = 0;
  for (let t = 0; t <= sureMs + 1e-9; t += adim) {
    tik++;
    const g = dene(t);
    if (g !== null) {
      cizimAnlari.push(t);
      gecen = g;
    }
  }
  const sure = cizimAnlari.length > 1 ? cizimAnlari[cizimAnlari.length - 1] - cizimAnlari[0] : sureMs;
  return {
    tik,
    cizim: cizimAnlari.length,
    anlar: cizimAnlari,
    gecen,
    fps: ((cizimAnlari.length - 1) / sure) * 1000,
  };
}

describe('kare-hızı tavanı (K-A)', () => {
  it('tavan 0 ise her rAF çizer — ölçüm kolunun tavansız davranışı', () => {
    const k = ekranKosusu(0, 240, 1000);
    expect(k.cizim).toBe(k.tik);
  });

  it('ekran frekansı tavana eşitse hiçbir kare atlanmaz', () => {
    const k = ekranKosusu(60, 60, 2000);
    expect(k.cizim).toBe(k.tik);
    expect(k.fps).toBeGreaterThan(59);
    expect(k.fps).toBeLessThan(61);
  });

  it.each([120, 240])('ekran tavanın katıysa (%i Hz) tam düzenli kare atlar', (hz) => {
    const k = ekranKosusu(60, hz, 2000);
    const oran = hz / 60;
    expect(k.cizim).toBe(Math.floor(k.tik / oran) + (k.tik % oran === 0 ? 0 : 1));
    // Aralıklar birebir eşit: düzensizlik olsa gözle titreme (judder) görünürdü.
    const araliklar = k.anlar.slice(1).map((t, i) => t - k.anlar[i]);
    for (const a of araliklar) expect(a).toBeCloseTo(1000 / 60, 3);
  });

  it.each([90, 144, 165])('ekran tavana bölünmüyorsa (%i Hz) ortalama yine tavanda kalır', (hz) => {
    const k = ekranKosusu(60, hz, 3000);
    // TOLERANS olmadan burası 48 fps'e (144 Hz) düşerdi: hedefin bir saç altındaki kare atılır,
    // bir sonrakine kadar beklenir. Bant dar tutuldu ki o bozulma testi kırsın.
    expect(k.fps).toBeGreaterThan(58);
    expect(k.fps).toBeLessThan(62);
  });

  it.each([60, 90, 120, 144, 165, 240, 333])('tavan hiçbir frekansta (%i Hz) aşılmaz', (hz) => {
    const k = ekranKosusu(KARE_TAVANI_FPS, hz, 3000);
    // SABİT TEMPO olmadan burası 72 fps'e (144 Hz) tırmanırdı: her çizim hedefi kendi anına
    // sıfırlasa, tolerans kadarlık erkenlik her turda birikir.
    expect(k.fps).toBeLessThanOrEqual(62);
  });

  it('oyun saati gerçek zamanı izler — tavan simülasyonu yavaşlatmaz', () => {
    for (const hz of [60, 144, 240]) {
      const k = ekranKosusu(60, hz, 5000);
      // Son çizim 5000'e denk gelmeyebilir; saat son ÇİZİM anına kadar ilerlemiş olmalı.
      expect(k.gecen).toBeGreaterThan(k.anlar[k.anlar.length - 1] / 1000 - 0.05);
      expect(k.gecen).toBeLessThan(k.anlar[k.anlar.length - 1] / 1000 + 0.05);
    }
  });

  it('uzun duraklama tek karede en fazla EN_BUYUK_ADIM_MS ilerletir', () => {
    const dene = kareZamanlayici(60);
    dene(0);
    const oncesi = dene(16.7) ?? 0;
    // Sekme 2 saniye arka planda kaldı: kısılmazsa tek karede 2 sn simülasyon koşar.
    const sonrasi = dene(2016.7) ?? 0;
    expect((sonrasi - oncesi) * 1000).toBeLessThanOrEqual(EN_BUYUK_ADIM_MS + 1e-6);
  });

  it('duraklamadan sonra ardışık çizim yığılmaz (yakalama spirali yok)', () => {
    const dene = kareZamanlayici(60);
    dene(0);
    dene(500); // uzun boşluk
    // Boşluktan hemen sonraki iki tik 60 Hz temposunda gelir; ikisi de çizerse spiral var demektir.
    const a = dene(508.3);
    const b = dene(516.7);
    expect([a, b].filter((x) => x !== null).length).toBeLessThanOrEqual(1);
  });
});
