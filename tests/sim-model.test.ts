/**
 * sim-model.test.ts — C5 MODEL KOLLARININ BEKÇİSİ (D-086).
 *
 * `simulate.ts` bir ölçüm aracı değil, denge kararlarının DAYANAĞI: C1/B5b/B4a'nın geç-oyun
 * hükümleri onun sayılarından çıktı. C5 ölçtü ki taban model 20 masada gerçeğin %169'unu
 * söylüyordu — yani yanlış bir modele yaslanmak, yanlış bir ölçüme yaslanmakla aynı şey.
 *
 * Bu yüzden bekçi bir eşik listesi değil, **modelin sözleşmesi**:
 *   1. Yürürlükteki model gerçeğe ESKİSİNDEN daha yakın (ölçülen G1-G4 debisiyle kıyaslanır).
 *   2. Masa yükseltmesi KALEM KALEM — 20 masa tek kalemde yükselemez (C1'in sahte 21,4 dk'sı).
 *   3. Taşıma turu MASALAR ARASI mesafeyi içerir — ama tepsi 1 iken içermez (tek durak).
 *   4. Açılış penceresinin üç ölçütü model kollarından ETKİLENMEZ (D-079 bağımsız).
 *   5. `eski` kol C5 öncesi modeli hâlâ üretebilir — yoksa "daha iyi mi" sorusu sorulamaz.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  KOLLAR, VARSAYILAN, kolAyarla, onbellekTemizle, olcutler, modelDebisi, GERCEK,
  carrierRate, avgInterTableDist,
} from '../tools/simulate';

/** Bir kolun ölçülen G1-G4 debisinden ORTALAMA sapması. */
function ortSapma(kol: string): number {
  kolAyarla(KOLLAR[kol]);
  onbellekTemizle();
  const s = GERCEK.map((g) => Math.abs(modelDebisi(g) - g.olculen) / g.olculen);
  return s.reduce((a, b) => a + b, 0) / s.length;
}

/** Kol başına ölçüt koşusu PAHALI (iki 12 saatlik profil). Aynı kol birden çok testte
 *  sorulduğu için sonuç hatırlanır — model kolları saf, aynı kol aynı sayıyı verir. */
const olcutBellek = new Map<string, ReturnType<typeof olcutler>>();
function olcutlerle(kol: string) {
  const hit = olcutBellek.get(kol);
  if (hit) return hit;
  kolAyarla(KOLLAR[kol]);
  onbellekTemizle();
  const o = olcutler();
  olcutBellek.set(kol, o);
  return o;
}

beforeEach(() => {
  kolAyarla(VARSAYILAN);
  onbellekTemizle();
});

describe('1 — model gerçeğe yaklaştı (asıl sözleşme)', () => {
  it('yürürlükteki model, ölçülen debiden en çok %12 sapar', () => {
    expect(ortSapma('secilen')).toBeLessThanOrEqual(0.12);
  });

  it('C5 ÖNCESİ model en az %30 sapıyordu — iyileşme gerçek, gürültü değil', () => {
    expect(ortSapma('eski')).toBeGreaterThanOrEqual(0.3);
  });

  it('yeni model eskisinden en az iki kat yakın', () => {
    expect(ortSapma('secilen') * 2).toBeLessThan(ortSapma('eski'));
  });

  it('eski model geç oyunu ABARTIYORDU, erken oyunu az söylüyordu (sapma tek yönlü değil)', () => {
    kolAyarla(KOLLAR.eski);
    onbellekTemizle();
    const g1 = modelDebisi(GERCEK[0]) / GERCEK[0].olculen;
    const g4 = modelDebisi(GERCEK[3]) / GERCEK[3].olculen;
    expect(g1).toBeLessThan(1);
    expect(g4).toBeGreaterThan(1.4);
  });
});

describe('2 — masa yükseltmesi KALEM KALEM (k2)', () => {
  it('20 masa tek kalemde yükselmez: en uzun masa beklemesi 5 dk altında', { timeout: 60_000 }, () => {
    const o = olcutlerle('secilen');
    expect(o.masaEnUzun).toBeLessThan(5 * 60);
  });

  it('kalem kalem OLMAYAN model o beklemeyi 20 dk üstünde gösteriyordu', { timeout: 60_000 }, () => {
    const o = olcutlerle('eski');
    expect(o.masaEnUzun).toBeGreaterThan(20 * 60);
  });

  it('kalem kalem kol, model↔gerçek sapmasını DEĞİŞTİRMEZ (saf defter düzeltmesi)', () => {
    // k2 anlık senaryoları etkilemez: senaryolarda tüm masalar zaten aynı seviyede.
    expect(ortSapma('k2')).toBeCloseTo(ortSapma('eski'), 6);
  });
});

describe('3 — taşıma turu çok duraklı (k1b)', () => {
  it('tepsi 1 iken masalar-arası terim YOKTUR (tek durak, ek yol yok)', () => {
    expect(carrierRate(1, 2, 10, 8)).toBeCloseTo(carrierRate(1, 2, 10, 0), 10);
  });

  it('tepsi 3 iken masalar-arası mesafe turu UZATIR', () => {
    expect(carrierRate(3, 2, 10, 8)).toBeLessThan(carrierRate(3, 2, 10, 0));
  });

  it('masalar-arası mesafe düzenden türer: masa sayısı arttıkça sıfır kalmaz', () => {
    expect(avgInterTableDist(4, 1)).toBeGreaterThan(0);
    expect(avgInterTableDist(20, 3)).toBeGreaterThan(0);
  });

  it('taşıma kolu geç oyunda BAĞLAYICI hâle geliyor (eskiden arz bağlıyordu)', () => {
    // G4 senaryosunda yeni model eskisinden belirgin düşük debi verir — kelepçe taşımaya geçti.
    kolAyarla(KOLLAR.eski); onbellekTemizle();
    const eski = modelDebisi(GERCEK[3]);
    kolAyarla(KOLLAR.secilen); onbellekTemizle();
    expect(modelDebisi(GERCEK[3])).toBeLessThan(eski * 0.7);
  });
});

describe('4 — açılış penceresi model kollarından bağımsız (D-079)', () => {
  const kollar = ['eski', 'k1a', 'k1b', 'k2', 'k3', 'k4', 'secilen'];
  // C3/C4 tuzağı: 5 sn'lik varsayılan zaman aşımı, YEDİ kolu koşan bu testte sahte bir
  // "kırıldı" üretiyordu. Uzun koşan test, kırık test değildir — süre açıkça verilir.
  it('ilk alım · açılış boşluğu · otomasyon yedi kolda da AYNI', { timeout: 120_000 }, () => {
    const taban = olcutlerle('eski');
    for (const k of kollar) {
      const o = olcutlerle(k);
      expect(o.ilkAlim).toBe(taban.ilkAlim);
      expect(o.acilisEnUzun).toBeCloseTo(taban.acilisEnUzun!, 6);
      expect(o.otomasyon).toBe(taban.otomasyon);
    }
  });

  it('D-079 hedefleri yürürlükteki modelde de tutuyor', { timeout: 60_000 }, () => {
    const o = olcutlerle('secilen');
    expect(o.ilkAlim!).toBeLessThanOrEqual(90);
    expect(o.acilisEnUzun).toBeLessThanOrEqual(2 * 60);
    expect(o.otomasyon!).toBeLessThan(15 * 60);
  });
});

describe('5 — kollar birbirinden ayrı durur', () => {
  it('`eski` kol C5 öncesi modeli hâlâ üretir (karşılaştırma zemini kaybolmaz)', () => {
    expect(KOLLAR.eski).toEqual({});
    expect(ortSapma('eski')).toBeGreaterThan(ortSapma('secilen'));
  });

  it('k4 (sabır) hiçbir ölçütü değiştirmez — ölçülen sonuç buydu, kol bu yüzden alınmadı', { timeout: 60_000 }, () => {
    const a = olcutlerle('eski');
    const b = olcutlerle('k4');
    expect(b.masaEnUzun).toBeCloseTo(a.masaEnUzun, 6);
    expect(b.normalEnUzun).toBeCloseTo(a.normalEnUzun, 6);
    expect(ortSapma('k4')).toBeCloseTo(ortSapma('eski'), 6);
  });

  it('kolları TOPLAMAK modeli iyileştirmiyor: hepsi, seçilenden uzak', () => {
    expect(ortSapma('hepsi')).toBeGreaterThan(ortSapma('secilen'));
  });

  it('yürürlükteki model k3/k4 içermez (ölçüm ikisini de elemişti)', () => {
    expect(VARSAYILAN.k3).toBeFalsy();
    expect(VARSAYILAN.k4).toBeFalsy();
    expect(VARSAYILAN.k1a).toBeFalsy();
  });
});
