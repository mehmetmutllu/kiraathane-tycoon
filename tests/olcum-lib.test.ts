/**
 * olcum-lib.test.ts — ORTAK ÖLÇÜM İSKELETİNİN BEKÇİSİ (D-084 P2).
 *
 * İskelet artık mantık taşıyor: tohum, parmak izi ve DAMGALAR. Damga sessizce bozulursa
 * ölçüm araçları "geçti" der ve sahte sayı üretir — C4'te tam bu oldu (varyant sessizce
 * etkisiz kaldı, sahte bir "fark yok" çıktı). Bu yüzden damgaların KIRILDIĞI da test edilir,
 * geçtiği kadar.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  seedRandom, yuzdelik, pearson, ort, pct, d2,
  izOlustur, damga, botDamgasi, korunumDamgasi, varyantDamgasi, damgaOzeti,
} from '../tools/olcum-lib';

const gercekRandom = Math.random;
afterEach(() => { Math.random = gercekRandom; });

describe('tohum', () => {
  it('aynı tohum aynı diziyi verir, farklı tohum farklı', () => {
    seedRandom(42);
    const a = Array.from({ length: 8 }, () => Math.random());
    seedRandom(42);
    const b = Array.from({ length: 8 }, () => Math.random());
    seedRandom(43);
    const c = Array.from({ length: 8 }, () => Math.random());
    expect(b).toEqual(a);
    expect(c).not.toEqual(a);
    for (const x of a) expect(x).toBeGreaterThanOrEqual(0), expect(x).toBeLessThan(1);
  });
});

describe('istatistik', () => {
  it('yüzdelik sıralı değer döner, boş dizide NaN', () => {
    expect(yuzdelik([5, 1, 3, 2, 4], 0)).toBe(1);
    expect(yuzdelik([5, 1, 3, 2, 4], 0.5)).toBe(3);
    expect(yuzdelik([5, 1, 3, 2, 4], 0.99)).toBe(5);
    expect(yuzdelik([], 0.5)).toBeNaN();
  });
  it('pearson: tam korelasyon +1/-1, sabit dizide NaN', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10);
    expect(pearson([1, 1, 1, 1], [1, 2, 3, 4])).toBeNaN();
    expect(pearson([1, 2], [2, 4])).toBeNaN(); // n < 3
  });
  it('ort / pct / d2', () => {
    expect(ort([2, 4, 6])).toBe(4);
    expect(ort([])).toBeNaN();
    expect(pct(1, 4)).toBe('%25.0');
    expect(pct(1, 0)).toBe('—');
    expect(d2([0, 9, 0], [3, -9, 4])).toBe(5); // y ekseni sayılmaz
  });
});

describe('parmak izi', () => {
  it('aynı dizi aynı izi, tek bir kare farkı izi değiştirir', () => {
    const a = izOlustur(); a.ekle(1, 2, 3); a.ekle(4);
    const b = izOlustur(); b.ekle(1, 2, 3); b.ekle(4);
    const c = izOlustur(); c.ekle(1, 2, 3); c.ekle(4.001);
    expect(b.deger).toBe(a.deger);
    expect(c.deger).not.toBe(a.deger);
  });
  it('SIRA önemli (aynı sayılar farklı sırada farklı iz)', () => {
    const a = izOlustur(); a.ekle(1, 2);
    const b = izOlustur(); b.ekle(2, 1);
    expect(b.deger).not.toBe(a.deger);
  });
});

describe('damgalar', () => {
  let hata: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { hata = vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { hata.mockRestore(); process.exitCode = 0; });

  it('geçen damga sessiz, kırılan damga stderr + çıkış kodu 1', () => {
    expect(damga('sorunsuz', true)).toBe(true);
    expect(hata).not.toHaveBeenCalled();

    expect(damga('bozuk', false, 'sebep')).toBe(false);
    expect(hata).toHaveBeenCalled();
    damgaOzeti();
    expect(process.exitCode).toBe(1);
  });

  it('bot damgası: yürümeyen bot ölçüm sayılmaz (C4 tuzağı ①)', () => {
    expect(botDamgasi('B2', 900, 15)).toBe(true);   // 60 br/dk
    expect(botDamgasi('B2', 30, 15)).toBe(false);   //  2 br/dk — bot sıkışmış
    expect(botDamgasi('B2', 0, 0)).toBe(false);     // hiç koşmamış
  });

  it('korunum damgası: kapalı sistemde sapma kod hatasıdır', () => {
    expect(korunumDamgasi('B2', 0)).toBe(true);
    expect(korunumDamgasi('B2', 1)).toBe(false);
  });

  it('varyant damgası: kontrolle AYNI iz = varyant etkisiz (C4 tuzağı ②)', () => {
    expect(varyantDamgasi('havuz:2', 'aaaa1111', 'bbbb2222')).toBe(true);
    expect(varyantDamgasi('havuz:2', 'aaaa1111', 'aaaa1111')).toBe(false);
  });
});
