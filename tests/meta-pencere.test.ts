/**
 * meta-pencere.test.ts — D-095'İN BEKÇİSİ: meta katmanın YIĞINI ne yapıyor.
 *
 * D9 turu, Faz D'nin üç ödül kanadını ilk kez AYNI koşuda ölçtü:
 *   H  hedef koleksiyonunun kalıcı gelir çarpanı  (D-090)
 *   R  İtibar'ın taşıma çarpanı                    (D-092)
 *   E  Usta katmanı + günlük görev 💎 arzı          (D-093/094)
 * Sonuç: D-087'nin 20 dk ölçütü yığın altında HÜKÜM PROFİLİNDE TEMİZ, karşılığında zincir
 * %20,1 kısaldı ve bu bedel D-095'te bilerek kabul edildi.
 *
 * BU BEKÇİ NE İDDİA EDİYOR (D8'in dersi: bekçi kodun ne YAPTIĞINI değil, sayının ne OLMASI
 * GEREKTİĞİNİ yazar — yoksa kodla birlikte sessizce kayar):
 *   1. Yığın açıkken hüküm profilinde 20 dk'yı aşan alım YOKTUR. D-087 kapandı; ekonomiye
 *      dokunan bir değişiklik onu yeniden açarsa burası kırılır.
 *   2. Kapatan katman R'dir — H ve E tek başlarına kapatmıyor. "Meta katman kapattı" cümlesi
 *      yanlış; hangi katmanın ödediği bilgisi bu testte durur.
 *   3. Katmanlar TOPLANIYOR. D-090 Bulgu 10'un toplanamaması knob'lar arasındaydı, katmanlar
 *      arasında değil — bu ayrım ölçüldü ve burada kilitleniyor.
 *   4. Zincir borcu D-095'in yazdığı BANTTA. Bant hem alttan hem üstten kapalı: borç büyürse
 *      de küçülürse de karar yeniden okunmalı (küçülmesi bir katmanın sessizce ölmesi demek).
 *   5. D-079'un açılış ölçütleri yığın altında da geçiyor — meta katman erken oyuna sızmıyor.
 *   6. Kelepçe hâlâ TAŞIMADA: bir sonraki denge kolunun kanalı değişmedi.
 *   7. Üç kanca da KAPALIYKEN taban birebir korunuyor (sızıntı yok).
 */
import { describe, it, expect, afterAll } from 'vitest';
import {
  olcutler, onbellekTemizle, milestoneTazele, m1Ayarla, kolAyarla, VARSAYILAN,
  hedefAkisiAyarla, hedefCarpaniAyarla, itibarAyarla, ustaAyarla, darbogazDagilimi,
} from '../tools/simulate';
import { HEDEF_KOLLARI } from '../tools/hedef-kollari';
import { ITIBAR_KOLLARI, kayitSifirla as itibarKayitSifirla } from '../tools/itibar-kollari';
import { USTA_KOLLARI, kayitSifirla as ustaKayitSifirla, sonKosuAlimlari } from '../tools/usta-kollari';

const SINIR = 20 * 60;

/** Ölçüt koşusu PAHALI (iki 12 saatlik profil). Aynı bileşim birden çok testte sorulduğu için
 *  sonuç hatırlanır — kancalar saf, aynı bileşim aynı sayıyı verir. */
const bellek = new Map<string, ReturnType<typeof olcutler> & { alim: number }>();

function kur(h: boolean, r: boolean, e: boolean): void {
  itibarKayitSifirla();
  ustaKayitSifirla();
  kolAyarla(VARSAYILAN);
  m1Ayarla(false);
  hedefAkisiAyarla(null);
  hedefCarpaniAyarla(h ? HEDEF_KOLLARI.hUYGF.carpanFabrika!(1) : null);
  itibarAyarla(r ? ITIBAR_KOLLARI.rUYG.fabrika(1) : null);
  ustaAyarla(e ? USTA_KOLLARI.eUYG.fabrika(1) : null);
  onbellekTemizle();
  milestoneTazele();
}

/** `ad` üç harfli maske: 'H', 'R', 'E' harflerinin bulunması o kancayı açar. 'M0' = üçü kapalı. */
function olc(ad: string) {
  const hit = bellek.get(ad);
  if (hit) return hit;
  kur(ad.includes('H'), ad.includes('R'), ad.includes('E'));
  const o = { ...olcutler(), alim: sonKosuAlimlari().length };
  bellek.set(ad, o);
  return o;
}

/** Kancalar test dosyasının DIŞINA sızmamalı: tüm kancalar kapatılıp dünya tabana döner. */
afterAll(() => {
  kur(false, false, false);
});

const T = { timeout: 120_000 };

describe('1 — D-087 KAPANDI: yığın açıkken hüküm profilinde 20 dk aşılmıyor', () => {
  it('HRE (yürürlükteki oyun) İdealize`de HİÇ alım aşmıyor', T, () => {
    expect(olc('HRE').idealAsan).toBe(0);
  });

  it('en uzun bekleme 20 dk`nın ALTINDA ve payı var (≤ 19 dk)', T, () => {
    // Üst sınır 19 dk, 20 değil: tam eşikte duran bir sayı "geçti" derdi ama ölçütün hiç payı
    // kalmazdı; D-095 kararı 18,0 dk'lık pay üstüne verildi.
    expect(olc('HRE').idealEnUzun).toBeLessThan(19 * 60);
  });

  it('yığından ÖNCE (M0) aynı ölçüt aşılıyordu — kapanış gerçek bir değişiklik', T, () => {
    // Bu satır olmasa "HRE temiz" ifadesi eğri zaten temiz olsaydı da doğru çıkardı ve
    // meta katmanın bir şey yapıp yapmadığı görünmezdi.
    expect(olc('M0').idealAsan).toBe(1);
    expect(olc('M0').idealEnUzun).toBeGreaterThan(SINIR);
  });

  it('gözlem bandı (Normal) da 6`dan 2`ye indi', T, () => {
    expect(olc('M0').normalAsan).toBe(6);
    expect(olc('HRE').normalAsan).toBe(2);
  });
});

describe('2 — kapatan katman R`dir; H ve E tek başlarına kapatmıyor', () => {
  it('R tek başına hükmü kapatıyor', T, () => {
    expect(olc('R').idealAsan).toBe(0);
  });

  it('H tek başına kapatmıyor — hâlâ bir aşan var', T, () => {
    expect(olc('H').idealAsan).toBe(1);
    expect(olc('H').idealEnUzun).toBeGreaterThan(SINIR);
  });

  it('E tek başına kapatmıyor — hâlâ bir aşan var', T, () => {
    expect(olc('E').idealAsan).toBe(1);
    expect(olc('E').idealEnUzun).toBeGreaterThan(SINIR);
  });

  it('E gözlem bandında da tek başına HİÇBİR ihlali kapatmıyor (bileşimde ödüyor)', T, () => {
    expect(olc('E').normalAsan).toBe(olc('M0').normalAsan);
    // ...ama atıl DEĞİL: 12 sa'de Usta alınıyor, yoksa satır ölçüm olmazdı.
    expect(olc('E').alim).toBeGreaterThan(0);
  });

  it('E ATIL DEĞİL: ihlale dokunmasa da zinciri ölçülebilir biçimde kısaltıyor', T, () => {
    // İLK HÂLİ BU SATIRI İÇERMİYORDU ve mutasyon onu buldu: `master.tipMult` 1,5 → 1
    // yapıldığında (Usta'nın etkisi tamamen ölür) yirmi bir testin YİRMİ BİRİ de geçiyordu.
    // Sebep: E'nin tek ölçülebilir izi ihlal sayısında değil ŞERİT'te — ölçülen %−1,7.
    // Bant %−1,0'da kesiliyor: etki ölürse buradan görünür.
    const dE = ((olc('E').serit ?? NaN) - (olc('M0').serit ?? NaN)) / (olc('M0').serit ?? NaN);
    expect(dE).toBeLessThan(-0.01);
  });
});

describe('3 — katmanlar TOPLANIYOR (D-090 Bulgu 10 bir kat yukarıda tekrarlamıyor)', () => {
  const delta = (ad: string, oku: (o: ReturnType<typeof olc>) => number) => oku(olc(ad)) - oku(olc('M0'));
  const beklenen = (oku: (o: ReturnType<typeof olc>) => number) =>
    oku(olc('M0')) + delta('H', oku) + delta('R', oku) + delta('E', oku);

  it('ihlal sayısı (İdealize · HÜKÜM): toplam TAM olarak parçaların toplamı', T, () => {
    expect(olc('HRE').idealAsan).toBe(beklenen((o) => o.idealAsan));
  });

  it('ihlal sayısı (Normal): toplam TAM olarak parçaların toplamı', T, () => {
    expect(olc('HRE').normalAsan).toBe(beklenen((o) => o.normalAsan));
  });

  it('en uzun bekleme: sapma %5`in altında (sürekli ölçüde tam eşitlik beklenmez)', T, () => {
    const b = beklenen((o) => o.normalEnUzun);
    expect(Math.abs(olc('HRE').normalEnUzun - b) / b).toBeLessThan(0.05);
  });

  it('ŞERİT: sapma %5`in altında', T, () => {
    const b = beklenen((o) => o.serit ?? NaN);
    expect(Math.abs((olc('HRE').serit ?? NaN) - b) / b).toBeLessThan(0.05);
  });

  it('üç katman GERÇEKTEN üst üste biniyor: HRE her tekil koldan farklı', T, () => {
    for (const ad of ['H', 'R', 'E']) {
      expect(olc('HRE').normalEnUzun).not.toBe(olc(ad).normalEnUzun);
    }
  });
});

describe('4 — zincir borcu D-095`in yazdığı BANTTA', () => {
  const dSerit = () => ((olc('HRE').serit ?? NaN) - (olc('M0').serit ?? NaN)) / (olc('M0').serit ?? NaN);

  it('yığının zincir borcu %18 ile %22 arasında (ölçülen %20,1)', T, () => {
    // Bant iki taraftan da kapalı: borç BÜYÜRSE Kat 1 içeriği kararın öngördüğünden hızlı
    // tükenir; KÜÇÜLÜRSE bir katman sessizce ölmüştür ve tempo kazancı da gitmiştir.
    expect(dSerit()).toBeLessThan(-0.18);
    expect(dSerit()).toBeGreaterThan(-0.22);
  });

  it('borç D1`in %7`lik TEK KOL eşiğinin üstünde — istisna hâlâ gerçek', T, () => {
    expect(Math.abs(dSerit())).toBeGreaterThan(0.07);
  });

  it('borcun çoğunu R yiyor: R tek başına %14`ten fazla', T, () => {
    const dR = ((olc('R').serit ?? NaN) - (olc('M0').serit ?? NaN)) / (olc('M0').serit ?? NaN);
    expect(dR).toBeLessThan(-0.14);
    // ...ve H ile E ikisi birlikte bile R'nin yarısı kadar değil: "pahalıyı kıs, ucuzlarla
    // idare et" diye bir kol OLMADIĞININ sayısal karşılığı budur.
    const dH = ((olc('H').serit ?? NaN) - (olc('M0').serit ?? NaN)) / (olc('M0').serit ?? NaN);
    const dE = ((olc('E').serit ?? NaN) - (olc('M0').serit ?? NaN)) / (olc('M0').serit ?? NaN);
    expect(Math.abs(dH + dE)).toBeLessThan(Math.abs(dR));
  });
});

describe('5 — açılış (D-079) yığın altında da sağlam: meta katman erken oyuna sızmıyor', () => {
  it('HRE: ilk alım < 90 sn · açılış boşluğu ≤ 2 dk · otomasyon < 15 dk', T, () => {
    const o = olc('HRE');
    expect(o.ilkAlim!).toBeLessThan(90);
    expect(o.acilisEnUzun).toBeLessThanOrEqual(2 * 60);
    expect(o.otomasyon!).toBeLessThan(15 * 60);
  });

  it('ilk alım ve açılış boşluğu BİREBİR aynı — dört bileşimin dördünde de', T, () => {
    const a = olc('M0');
    for (const ad of ['H', 'R', 'E', 'HRE']) {
      expect(olc(ad).ilkAlim).toBe(a.ilkAlim);
      expect(olc(ad).acilisEnUzun).toBe(a.acilisEnUzun);
    }
  });

  it('otomasyonu YALNIZ H kımıldatıyor ve TEK saniye kadar (bu bekçi onu buldu)', T, () => {
    // Araç dakikaya yuvarlayınca üç satır da "6,1 dk" görünüyordu ve rapor "sekiz satırın
    // sekizinde birebir aynı" diye yazılmıştı. Saniye çözünürlüğünde doğru değil: hedef
    // koleksiyonunun ilk kazanç kademesi (1.000 ₺) GARSONDAN ÖNCE açılıyor, çarpan bir tick
    // sonra yürürlüğe giriyor ve otomasyon 366 → 365 sn'ye kayıyor. Sızıntı gerçek ama
    // D-079'un 15 dk'lık ölçütünün %0,3'ü — bant onu bu ölçekte tutar, büyürse söyler.
    const a = olc('M0').otomasyon!;
    expect(olc('R').otomasyon).toBe(a);
    expect(olc('E').otomasyon).toBe(a);
    expect(a - olc('H').otomasyon!).toBeGreaterThan(0);
    expect(a - olc('H').otomasyon!).toBeLessThanOrEqual(2);
    expect(olc('HRE').otomasyon).toBe(olc('H').otomasyon);
  });
});

describe('6 — kelepçe hâlâ TAŞIMADA: sonraki kolun kanalı değişmedi', () => {
  it('yığın açıkken taşımanın payı hâlâ %85`in üstünde', T, () => {
    kur(true, true, true);
    const d = darbogazDagilimi(0.55);
    const top = Object.values(d).reduce((a, b) => a + b, 0);
    expect((d['taşıma'] ?? 0) / top).toBeGreaterThan(0.85);
  });
});

describe('7 — kancalar kapalıyken taban BİREBİR korunuyor', () => {
  it('üçü de kapalıyken tekrar ölçüm aynı sayıyı veriyor (sızıntı yok)', T, () => {
    const ilk = olc('M0');
    kur(true, true, true);
    olcutler();
    kur(false, false, false);
    const son = olcutler();
    expect(son.normalAsan).toBe(ilk.normalAsan);
    expect(son.normalEnUzun).toBe(ilk.normalEnUzun);
    expect(son.serit).toBe(ilk.serit);
  });
});
