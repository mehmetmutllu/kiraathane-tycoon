/**
 * tempo-olcutu.test.ts — D-087'NİN BEKÇİSİ: dördüncü tempo ölçütünün PROFİLİ.
 *
 * D-010 §3.6'nın "20 dk'yı aşan tek alım kalmasın" ölçütü, hangi profilde okunacağı hiç
 * yazılmadan yaşadı. Araç onu Normal'de (verim 0,55) basıyordu; kardeş üç ölçüt ise
 * İdealize'de (1,0). D1 turu ölçtü: AYNI eğri İdealize'de 1, Yoğun'da 1, Normal'de 6,
 * Rahat'ta 11 ihlal veriyor — yani hüküm eğriden değil, okuyanın seçtiği profilden geliyordu.
 *
 * Bu bekçi bir eşik listesi değil, **ölçütün sözleşmesi**:
 *   1. Hüküm İDEALİZE'den okunur ve GEÇER; kalan tek aşan D-078'in bilerek bıraktığıdır.
 *   2. Profil seçimi ÖNEMLİDİR — İdealize ile Normal aynı sayıyı vermez (yoksa bu karar
 *      anlamsız olurdu ve sessizce geri alınabilirdi).
 *   3. Normal/Rahat GÖZLEM bandıdır: hüküm onlara BAĞLI DEĞİL.
 *   4. D-087 ekonomiye DOKUNMADI — D1'de ölçülen düzeltici kolların sayıları config'e
 *      girmedi (girerlerse bu test söyler; hangi kolun hangi sayı olduğu D1 raporunda).
 *   5. Elenen kolların ELENME GEREKÇESİ yeniden üretilebilir (ölçüm bir kez değil, her
 *      koşuda doğrulanır): g1 ihlali ARTIRIYOR, m1 ATIL, f4 ölçütü tutturuyor.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KOLLAR, VARSAYILAN, kolAyarla, onbellekTemizle, milestoneTazele, olcutler, m1Ayarla } from '../tools/simulate';
import { DENGE_KOLLARI, geriAl } from '../tools/denge-kollari';
import { economyConfig as C } from '../src/config/economy.config';

/** Ölçüt koşusu PAHALI (iki 12 saatlik profil). Aynı kurulum birden çok testte sorulduğu için
 *  sonuç hatırlanır — kollar saf, aynı kurulum aynı sayıyı verir. */
const bellek = new Map<string, ReturnType<typeof olcutler>>();
function olc(anahtar: string, kur: () => void) {
  const hit = bellek.get(anahtar);
  if (hit) return hit;
  geriAl();
  m1Ayarla(false);
  kolAyarla(VARSAYILAN);
  kur();
  onbellekTemizle();
  milestoneTazele();
  const o = olcutler();
  bellek.set(anahtar, o);
  return o;
}

const taban = () => olc('taban', () => {});

beforeEach(() => {
  kolAyarla(VARSAYILAN);
  onbellekTemizle();
});

afterEach(() => {
  // Denge kolları config'i çalışma anında değiştiriyor; sızdırırsa SONRAKİ test yalan söyler.
  geriAl();
  m1Ayarla(false);
  onbellekTemizle();
  milestoneTazele();
});

describe('1 — hüküm İDEALİZE profilinden okunur ve GEÇER', () => {
  it('dördüncü ölçüt İdealize`de en çok BİR alım aşıyor', { timeout: 60_000 }, () => {
    expect(taban().idealAsan).toBeLessThanOrEqual(1);
  });

  it('kalan tek aşan D-078`in bilerek bıraktığı son basamak: servis L6', { timeout: 60_000 }, () => {
    expect(taban().idealEnUzunEtiket).toBe('servis L6');
  });

  it('o tek aşan 20 dk`nın ÜSTÜNDE — yani "izin verilen 1" gerçekten kullanılıyor', { timeout: 60_000 }, () => {
    // Bu satır olmasa "≤1 geçti" ifadesi hiç aşan olmadığı için de doğru çıkardı ve
    // D-078'in istisnasının hâlâ gerekli olup olmadığı görünmezdi.
    expect(taban().idealEnUzun).toBeGreaterThan(20 * 60);
    // ÜST sınır 26 dk, 30 değil: Yoğun profil (0,80) 29,8 dk veriyor. Gevşek sınırla ölçütü
    // İdealize'den Yoğun'a kaydırmak testi KIRMAZDI — yani profil kilidi kilitlemezdi.
    expect(taban().idealEnUzun).toBeLessThan(26 * 60);
  });
});

describe('2 — profil seçimi ÖNEMLİ (karar boş bir yeniden adlandırma değil)', () => {
  it('İdealize ile Normal AYNI sayıyı vermiyor: 1`e karşı 6', { timeout: 60_000 }, () => {
    const o = taban();
    expect(o.idealAsan).toBe(1);
    expect(o.normalAsan).toBe(6);
  });

  it('Normal profildeki en uzun bekleme İdealize`dekinden belirgin UZUN', { timeout: 60_000 }, () => {
    const o = taban();
    expect(o.normalEnUzun).toBeGreaterThan(o.idealEnUzun * 1.5);
  });

  it('iki profilin en uzun beklemesi AYNI basamağa işaret ediyor (servis L6)', { timeout: 60_000 }, () => {
    // Gözlem bandı hükümden kopuk değil: aynı darboğazı daha büyük büyütmeyle gösteriyor.
    expect(taban().normalEnUzunEtiket).toBe(taban().idealEnUzunEtiket);
  });
});

describe('3 — D-087 EKONOMİYE dokunmadı (D1`in düzeltici kolları config`e girmedi)', () => {
  it('servis merdiveni taban değerlerinde', () => {
    expect(C.service.upgrade.costsByLevel).toEqual([20, 30, 45, 800, 2400, 9000]);
  });

  it('masa bahşişi taban değerinde (g2 kolu uygulanmadı)', () => {
    expect(C.tables.tipBase).toBe(2);
  });

  it('ihlal eden dört pad`in ₺`si taban değerlerinde (f2/f4 kolları uygulanmadı)', () => {
    const g = (id: string) => C.pads.find((p) => p.id === id)?.cost;
    expect([g('z2table4'), g('zone3'), g('z3table3'), g('waiter3')]).toEqual([1400, 2500, 2200, 6000]);
  });

  it('garson merdiveni taban değerlerinde (g1 kolu uygulanmadı)', () => {
    expect(C.waiter.trayUpgrades.costs).toEqual([400, 1200, 2500]);
    expect(C.waiter.speedUpgrades.speeds).toEqual([1.5, 2.0]);
  });

  it('servis merdiveni 6 basamak (b1 kolu uygulanmadı)', () => {
    expect(C.service.upgrade.maxLevel).toBe(6);
  });
});

describe('4 — elenen kolların gerekçesi yeniden üretilebilir', () => {
  it('g1 (taşıma tavanı) ölçütü İYİLEŞTİRMİYOR — ikinci dozda ihlali ARTIRIYOR', { timeout: 90_000 }, () => {
    const o = olc('g1-2', () => DENGE_KOLLARI.g1.uygula(2));
    expect(o.normalAsan).toBeGreaterThan(taban().normalAsan);
  });

  it('m1 (akıllı oyuncu taşıyıcıyı yükseltir) ATIL: hiçbir sayıyı değiştirmiyor', { timeout: 90_000 }, () => {
    // Serbest oyun bloğu görev hattı bitmeden koşmuyor. Biri bunu düzeltirse test kırılır ve
    // D1 raporunun Bulgu 5'i (ve g1'in NEDEN hat üzerinden kurulduğu) yeniden okunmak zorunda kalır.
    const o = olc('m1', () => m1Ayarla(true));
    expect(o.normalAsan).toBe(taban().normalAsan);
    expect(o.normalEnUzun).toBeCloseTo(taban().normalEnUzun, 6);
    expect(o.serit).toBeCloseTo(taban().serit!, 6);
  });

  it('f4 (cerrahi indirim) ×0.80 ölçütü Normal`de de tutturuyordu — ama zinciri kısaltarak', { timeout: 90_000 }, () => {
    const o = olc('f4-080', () => DENGE_KOLLARI.f4.uygula(0.8));
    expect(o.normalAsan).toBe(1);
    expect(o.serit!).toBeLessThan(taban().serit!); // bedeli: Kat 1 içeriği kısalıyor
  });
});

describe('5 — açılışın üç ölçütü D-087`den ETKİLENMEDİ (D-079 sağlam)', () => {
  it('ilk alım < 90 sn · açılış boşluğu ≤ 2 dk · otomasyon < 15 dk', { timeout: 60_000 }, () => {
    const o = taban();
    expect(o.ilkAlim!).toBeLessThan(90);
    expect(o.acilisEnUzun).toBeLessThanOrEqual(2 * 60);
    expect(o.otomasyon!).toBeLessThan(15 * 60);
  });
});
