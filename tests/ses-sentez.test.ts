/**
 * ses-sentez.test.ts — SENTEZ ÇEKİRDEĞİNİN BEKÇİSİ (Faz E · E4).
 *
 * `audioSynth.ts` bu turun en çok mantık taşıyan yeni dosyası ve ürettiği şey DUYULAMAZ. O yüzden
 * bekçi "kulağa nasıl geliyor" demiyor; sesin FİZİĞİNE dair, ölçülebilir iddiaları tutuyor:
 *
 *   1. DETERMİNİZM — aynı katmanlar her zaman AYNI tamponu üretir. Bu yalnız bir temizlik değil,
 *      ölçümün ön şartı: `tools/olcum-ses-ayirt.ts` bu tamponları okuyor ve `Math.random` kullanan
 *      bir gürültü kaynağı ölçümü koşudan koşuya değiştirirdi.
 *   2. SÜRE KATMANLARDAN TÜRER — katalogda elle yazılı süre yok (E3'ün bakım tuzağı buydu).
 *   3. ZARF — gecikmeden önce mutlak sessizlik, sonda ~sıfır. Gecikme çalışmazsa katmanları
 *      kaydırma diye bir şey kalmaz ve `purchase`ın tok+onay yapısı çöker.
 *   4. GÜRÜLTÜ SÜZGECİ GERÇEKTEN SÜZÜYOR — enerji istenen bandın içinde, uzağında değil.
 *      Bu, E4'ün bütün "fiziksel aile" iddiasının dayandığı tek mekanizma; süzgeç çalışmazsa
 *      `pour` ve `serve` beyaz gürültüye döner ve ayrışma ölçümü de anlamını yitirir.
 *   5. SÜZÜLME (`suzul`) BANDI GERÇEKTEN TAŞIYOR — çay dökme sesi tam olarak "merkez frekansın
 *      yükselmesi"dir; taşımıyorsa ses sabit bir hışırtıdır.
 *   6. İNHARMONİK KISMİLER — enerji tam katlarda DEĞİL, verilen çarpanlarda. Metalik tını
 *      (para, Usta) yalnız bununla üretilebiliyor; klasik dalgayla üretilemez.
 *   7. SINIRLAMA — katmanlar toplandığında çıktı [-1, 1] dışına taşmaz (sert kırpma "tık" üretir).
 */
import { describe, it, expect } from 'vitest';
import { ORNEKLEME, seslendir, sesSuresi, type Katman } from '../src/game/audioSynth';

/** Goertzel: tek bir frekanstaki enerji. Tam FFT'ye gerek yok, tek nokta soruluyor. */
function enerji(pcm: Float32Array, hz: number, bas = 0, uzunluk = pcm.length - bas): number {
  const n = Math.max(1, Math.min(uzunluk, pcm.length - bas));
  const k = (2 * Math.PI * hz) / ORNEKLEME;
  const katsayi = 2 * Math.cos(k);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const s0 = pcm[bas + i] + katsayi * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return (s1 * s1 + s2 * s2 - katsayi * s1 * s2) / (n * n);
}

/** Pencerenin RMS'i — "burada ses var mı" sorusunun sayısı. */
function rms(pcm: Float32Array, bas = 0, uzunluk = pcm.length - bas): number {
  const n = Math.max(1, Math.min(uzunluk, pcm.length - bas));
  let t = 0;
  for (let i = 0; i < n; i++) t += pcm[bas + i] * pcm[bas + i];
  return Math.sqrt(t / n);
}

const ton = (y: Partial<Katman> = {}): Katman =>
  ({ kaynak: 'ton', hz: [440], dalga: 'sine', atak: 0.005, sonme: 0.2, gain: 0.5, ...y });
const gurultu = (y: Partial<Katman> = {}): Katman =>
  ({ kaynak: 'gurultu', hz: [1000], q: 6, atak: 0.005, sonme: 0.2, gain: 0.5, ...y });

describe('1 — DETERMİNİZM (ölçümün ön şartı)', () => {
  it('aynı katmanlar iki koşuda BİREBİR aynı tamponu üretiyor', () => {
    const k = [ton(), gurultu()];
    const a = seslendir(k);
    const b = seslendir(k);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) expect(a[i]).toBe(b[i]);
  });

  it('gürültü katmanı SABİT değil — determinizm "hep sıfır" ile sağlanmıyor', () => {
    // Bu testin varlık sebebi: determinizm testi tek başına, gürültüyü sıfıra sabitleyen bir
    // hatayı da GEÇİRİRDİ. İki test birlikte "deterministik AMA gerçekten gürültü" diyor.
    const p = seslendir([gurultu()]);
    expect(rms(p)).toBeGreaterThan(0.01);
    const farkli = new Set(Array.from(p.slice(0, 500))).size;
    expect(farkli).toBeGreaterThan(100);
  });

  it('farklı katman SIRASI farklı gürültü üretiyor — iki gürültü katmanı aynı diziyi paylaşmıyor', () => {
    // Aynı tohumla üretilseydi iki gürültü katmanı BİREBİR üst üste binerdi (yani tek katman
    // gibi davranırdı, yalnız iki kat yüksek). Tohum katman sırasından türüyor.
    const p = seslendir([gurultu({ gain: 0.5 }), gurultu({ gain: 0.5 })]);
    const tek = seslendir([gurultu({ gain: 1.0 })]);
    let ayni = true;
    for (let i = 0; i < Math.min(p.length, tek.length); i++) {
      if (Math.abs(p[i] - tek[i]) > 1e-6) { ayni = false; break; }
    }
    expect(ayni).toBe(false);
  });
});

describe('2 — SÜRE katmanlardan türüyor', () => {
  it('süre = en uzun katmanın (gecikme + atak + sönme) değeri', () => {
    const k = [ton({ atak: 0.01, sonme: 0.10 }), ton({ gecikme: 0.20, atak: 0.01, sonme: 0.10 })];
    expect(sesSuresi(k)).toBeCloseTo(0.31, 10);
    expect(seslendir(k).length).toBe(Math.round(0.31 * ORNEKLEME));
  });

  it('tek katmanlı sesin süresi de aynı kuralla çıkıyor', () => {
    expect(sesSuresi([ton({ atak: 0.002, sonme: 0.5 })])).toBeCloseTo(0.502, 10);
  });
});

describe('3 — ZARF: gecikme, yükseliş, sönme', () => {
  it('gecikmeden ÖNCE mutlak sessizlik', () => {
    const p = seslendir([ton({ gecikme: 0.1, atak: 0.005, sonme: 0.2 })]);
    const oncesi = Math.round(0.09 * ORNEKLEME);
    for (let i = 0; i < oncesi; i++) expect(p[i]).toBe(0);
  });

  it('gecikmeden SONRA ses var (gecikme sesi yutmuyor)', () => {
    const p = seslendir([ton({ gecikme: 0.1, atak: 0.005, sonme: 0.2 })]);
    expect(rms(p, Math.round(0.11 * ORNEKLEME), Math.round(0.02 * ORNEKLEME))).toBeGreaterThan(0.05);
  });

  it('ses SÖNÜYOR: sonun RMS-i başın RMS-inden çok küçük', () => {
    const p = seslendir([ton({ atak: 0.005, sonme: 0.3 })]);
    const pencere = Math.round(0.02 * ORNEKLEME);
    const bas = rms(p, Math.round(0.01 * ORNEKLEME), pencere);
    const son = rms(p, p.length - pencere, pencere);
    expect(son).toBeLessThan(bas * 0.05);
  });

  it('atak sırasında yükseliyor — ilk örnek tepe değil', () => {
    const p = seslendir([ton({ atak: 0.05, sonme: 0.2 })]);
    const cokErken = rms(p, 0, Math.round(0.005 * ORNEKLEME));
    const atakSonu = rms(p, Math.round(0.045 * ORNEKLEME), Math.round(0.005 * ORNEKLEME));
    expect(atakSonu).toBeGreaterThan(cokErken * 2);
  });
});

describe('4 — GÜRÜLTÜ SÜZGECİ gerçekten süzüyor', () => {
  it('enerji bant merkezinde, uzağında değil', () => {
    const p = seslendir([gurultu({ hz: [2000], q: 10, atak: 0.005, sonme: 0.3 })]);
    const merkez = enerji(p, 2000);
    const uzak = enerji(p, 300);
    expect(merkez).toBeGreaterThan(uzak * 10);
  });

  it('bant merkezi DEĞİŞİNCE enerjinin yeri de değişiyor (merkez sabit kodlanmamış)', () => {
    const alcak = seslendir([gurultu({ hz: [500], q: 10, atak: 0.005, sonme: 0.3 })]);
    const yuksek = seslendir([gurultu({ hz: [4000], q: 10, atak: 0.005, sonme: 0.3 })]);
    expect(enerji(alcak, 500)).toBeGreaterThan(enerji(alcak, 4000) * 10);
    expect(enerji(yuksek, 4000)).toBeGreaterThan(enerji(yuksek, 500) * 10);
  });

  it('yüksek q DAR bant demek — dar bant merkezde daha yoğun', () => {
    const dar = seslendir([gurultu({ hz: [2000], q: 20, atak: 0.005, sonme: 0.3 })]);
    const genis = seslendir([gurultu({ hz: [2000], q: 1, atak: 0.005, sonme: 0.3 })]);
    const darOran = enerji(dar, 2000) / (enerji(dar, 600) + 1e-15);
    const genisOran = enerji(genis, 2000) / (enerji(genis, 600) + 1e-15);
    expect(darOran).toBeGreaterThan(genisOran);
  });
});

describe('5 — SÜZÜLME (suzul) bandı taşıyor', () => {
  it('yükselen süpürmede enerji BAŞTA alçak, SONDA yüksek bantta', () => {
    // `pour` sesinin tamamı bu davranış. Taşımıyorsa çay dökme sabit bir hışırtıya döner.
    const p = seslendir([gurultu({ hz: [400, 4000], suzul: true, q: 8, atak: 0.01, sonme: 0.5 })]);
    const pencere = Math.round(0.06 * ORNEKLEME);
    const bas = Math.round(0.02 * ORNEKLEME);
    const son = p.length - pencere - Math.round(0.05 * ORNEKLEME);
    expect(enerji(p, 400, bas, pencere)).toBeGreaterThan(enerji(p, 4000, bas, pencere));
    expect(enerji(p, 4000, son, pencere)).toBeGreaterThan(enerji(p, 400, son, pencere));
  });

  it('suzul KAPALIYKEN basamak: ilk yarı tamamen ilk değerde', () => {
    const p = seslendir([ton({ hz: [400, 1600], suzul: false, atak: 0.005, sonme: 0.4 })]);
    const pencere = Math.round(0.05 * ORNEKLEME);
    const orta = Math.round(0.10 * ORNEKLEME); // ilk basamağın içi
    expect(enerji(p, 400, orta, pencere)).toBeGreaterThan(enerji(p, 1600, orta, pencere) * 10);
  });
});

describe('6 — İNHARMONİK KISMİLER (metalik tını)', () => {
  it('enerji verilen ÇARPANLARDA, tam katlarda değil', () => {
    const temel = 500;
    const p = seslendir([ton({ hz: [temel], kismi: [1, 2.76, 5.40], atak: 0.002, sonme: 0.4 })]);
    // 2.76× var, 2× (harmonik) yok — metalik olmanın tanımı bu.
    expect(enerji(p, temel * 2.76)).toBeGreaterThan(enerji(p, temel * 2) * 10);
    expect(enerji(p, temel * 5.40)).toBeGreaterThan(enerji(p, temel * 3) * 10);
  });

  it('kismi verilmezse klasik dalga: square TEK harmonikler üretiyor', () => {
    const temel = 400;
    const p = seslendir([ton({ hz: [temel], dalga: 'square', atak: 0.002, sonme: 0.4 })]);
    expect(enerji(p, temel * 3)).toBeGreaterThan(enerji(p, temel * 2) * 10);
  });

  it('sine SADE: üçüncü harmonikte kayda değer enerji yok', () => {
    const temel = 400;
    const p = seslendir([ton({ hz: [temel], dalga: 'sine', atak: 0.002, sonme: 0.4 })]);
    expect(enerji(p, temel)).toBeGreaterThan(enerji(p, temel * 3) * 100);
  });
});

describe('7 — SINIRLAMA: katmanlar toplanınca taşma yok', () => {
  it('çok yüksek kazançlı katmanlarda bile çıktı [-1, 1] içinde', () => {
    const p = seslendir([ton({ gain: 5 }), ton({ hz: [660], gain: 5 }), gurultu({ gain: 5 })]);
    for (let i = 0; i < p.length; i++) {
      expect(Math.abs(p[i])).toBeLessThanOrEqual(1);
    }
  });

  it('normal kazançlarda sınırlayıcı sesi EZMİYOR (tepe makul bir aralıkta)', () => {
    const p = seslendir([ton({ gain: 0.16 })]);
    let tepe = 0;
    for (let i = 0; i < p.length; i++) tepe = Math.max(tepe, Math.abs(p[i]));
    expect(tepe).toBeGreaterThan(0.05);
    expect(tepe).toBeLessThan(0.4);
  });
});
