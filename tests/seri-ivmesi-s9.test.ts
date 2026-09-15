/**
 * seri-ivmesi-s9.test.ts — SERİ İVMESİNİN BEKÇİSİ (S9 · D-122 kol I2).
 *
 * NE İDDİA EDİYOR — ve neden bu iddialar:
 *
 * Ses doğrulanamaz ("duyuldu mu" diye bir test yok, `ses.test.ts`in başındaki gerekçe). O yüzden
 * burada doğrulanan şey duyulan perde değil, **hangi çalmanın kaçıncı basamakta olduğu** ve
 * perdelemenin **örnek düzeyinde gerçekten uygulandığı**. İkisi ayrı: birincisi motorun sayacı,
 * ikincisi sentezin kendisi. Sayaç doğru olup perdeleme hiç uygulanmasaydı bütün çalmalar aynı
 * perdeden çıkar ve hiçbir denetim kırılmazdı — bu yüzden `perdele` de ayrıca sınanıyor.
 *
 * TURUN ÖLÇÜLEN GEREKÇESİ (`docs/ses-raporu-s17.md` B6-B8):
 *   · Basamaksız hâlde (I1) ardışık iki toplama arasındaki spektral fark **0,00 dB** — mutlak
 *     tabanın (1,65 dB) ALTINDA, yani kulakta aynı perde. "İvme" hissi bu yüzden hiç doğmuyordu.
 *   · I2'de adım farkı **2,82 dB** (tabanın 1,7 katı) — basamak gerçekten duyuluyor.
 *   · I3 (+2 yarım ses, tavan 8) elendi: adım farkı daha büyük ama TAVANDA ilk↔tavan farkı
 *     5,90 → 3,18 dB'ye DÜŞÜYOR, çünkü kısmilerin 3/4'ü 12 kHz üstüne taşıyor.
 *
 * KAPSAM DIŞI, bilerek: perdenin KULAĞA nasıl geldiği (karar panosunda dinlendi, D-122) ve
 * `aralik` kelepçesinin dozu (kol A3 — bugünkü 0,06 bilerek korunuyor, bkz. son blok).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { sesMotoruKur, SES_KATALOG, type SesArkaUc, type SesId } from '../src/game/audio';
import { perdele, seslendir, YARIM_SES } from '../src/game/audioSynth';

function harness(opts: { dosyaVar?: boolean } = {}) {
  const basamaklar: number[] = [];
  const hangi: SesId[] = [];
  let t = 0;
  const arkaUc: SesArkaUc = {
    simdi: () => t,
    kilidiAc: () => {},
    dosyaCal: (_yol, _gain, yarimSes) => {
      if (!opts.dosyaVar) return false;
      basamaklar.push(yarimSes);
      return true;
    },
    sentezCal: (id, _k, yarimSes) => { hangi.push(id); basamaklar.push(yarimSes); },
  };
  const motor = sesMotoruKur(arkaUc, true);
  motor.kilidiAc();
  return { motor, basamaklar, hangi, ilerlet: (sn: number) => { t += sn; } };
}

/** Kelepçeyi geçen aralıklarla `n` kez çal, basamak dizisini döndür. */
function seriCal(id: SesId, n: number, ara: number): number[] {
  const h = harness();
  for (let i = 0; i < n; i++) {
    h.motor.cal(id);
    h.ilerlet(ara);
  }
  return h.basamaklar;
}

const COIN = SES_KATALOG.coin;

describe('1 — katalog: seri yalnız PARA sesinde tanımlı', () => {
  it('coin seri taşıyor ve ölçülen kol I2 (+1 yarım ses, tavan 5, pencere 1,2 sn)', () => {
    expect(COIN.seri).toEqual({ pencere: 1.2, basamak: 1, tavan: 5 });
  });

  it('kalan sekiz sesin HİÇBİRİ seri taşımıyor', () => {
    // Bu olumsuz bekçi bilerek: seri bir "iyileştirme" gibi görünüp sessizce yayılabilir.
    // Merdiven ancak SIK tekrarlanan bir olayda anlam taşır; `level` ya da `master` arka arkaya
    // çalmaz, orada basamak yalnız sesi bozar.
    const seriliOlaylar = (Object.keys(SES_KATALOG) as SesId[]).filter((id) => SES_KATALOG[id].seri);
    expect(seriliOlaylar).toEqual(['coin']);
  });
});

describe('2 — merdiven: basamak basamak çıkar, tavanda DURUR', () => {
  it('sekiz ardışık toplama 0,1 sn arayla: 0,1,2,3,4,5,5,5', () => {
    expect(seriCal('coin', 8, 0.1)).toEqual([0, 1, 2, 3, 4, 5, 5, 5]);
  });

  it('ilk çalma her zaman TABANDA (basamak 0)', () => {
    expect(seriCal('coin', 1, 0.1)).toEqual([0]);
  });

  it('tavan katalogdaki sayıdan türer, teste gömülü değil', () => {
    const { tavan, basamak } = COIN.seri!;
    const dizi = seriCal('coin', tavan + 4, 0.1);
    expect(Math.max(...dizi)).toBe(tavan * basamak);
  });
});

describe('3 — seri KESİLİR: pencereden uzun boşluk tabana döndürür', () => {
  it('pencereden (1,2 sn) uzun ara: merdiven sıfırlanır', () => {
    const h = harness();
    h.motor.cal('coin'); h.ilerlet(0.1);
    h.motor.cal('coin'); h.ilerlet(0.1);
    h.motor.cal('coin');            // burada 2. basamaktayız
    h.ilerlet(1.21);                // pencere AŞILDI
    h.motor.cal('coin');
    expect(h.basamaklar).toEqual([0, 1, 2, 0]);
  });

  it('tam pencere sınırında (1,2 sn) seri SÜRER — sınır dahil', () => {
    const h = harness();
    h.motor.cal('coin');
    h.ilerlet(COIN.seri!.pencere);
    h.motor.cal('coin');
    expect(h.basamaklar).toEqual([0, 1]);
  });

  it('kesilen seri yeniden tırmanabilir', () => {
    const h = harness();
    for (let i = 0; i < 3; i++) { h.motor.cal('coin'); h.ilerlet(0.1); }
    h.ilerlet(2);
    for (let i = 0; i < 3; i++) { h.motor.cal('coin'); h.ilerlet(0.1); }
    expect(h.basamaklar).toEqual([0, 1, 2, 0, 1, 2]);
  });
});

describe('4 — kelepçeye takılan çalma seriyi NE İLERLETİR NE KIRAR', () => {
  it('aralıktan sık çağrı basamak yemiyor (duyulmayan ses merdiven çıkamaz)', () => {
    const h = harness();
    h.motor.cal('coin');            // basamak 0, çalar
    h.ilerlet(0.01);                // aralik 0,06 — kelepçe
    expect(h.motor.cal('coin')).toBe(false);
    h.ilerlet(0.01);
    expect(h.motor.cal('coin')).toBe(false);
    h.ilerlet(0.05);                // toplam 0,07 > 0,06 → geçer
    h.motor.cal('coin');
    expect(h.basamaklar).toEqual([0, 1]);
  });
});

describe('5 — basamak KAYNAKTAN BAĞIMSIZ (D-122: K1 seçildi ama dosya yolu da taşır)', () => {
  it('dosya bırakılmışsa aynı basamak dizisi dosya yoluna gider', () => {
    const h = harness({ dosyaVar: true });
    for (let i = 0; i < 7; i++) { h.motor.cal('coin'); h.ilerlet(0.1); }
    expect(h.basamaklar).toEqual([0, 1, 2, 3, 4, 5, 5]);
    expect(h.hangi).toEqual([]); // sentez hiç çalmadı — dosya üstüne yazdı
  });
});

describe('6 — perdeleme GERÇEKTEN uygulanıyor (sayaç doğru olup ses aynı kalmasın)', () => {
  it('perdele bütün katmanların bütün frekanslarını aynı oranla öteler', () => {
    const p = perdele(COIN.katmanlar, 5);
    const k = Math.pow(YARIM_SES, 5);
    COIN.katmanlar.forEach((kat, i) => {
      kat.hz.forEach((h, j) => expect(p[i].hz[j]).toBeCloseTo(h * k, 9));
    });
  });

  it('gürültü katmanının bant merkezi de ötelenir (tiz geçiş perdeden kopmasın)', () => {
    const gurultu = COIN.katmanlar.findIndex((k) => k.kaynak === 'gurultu');
    expect(gurultu).toBeGreaterThanOrEqual(0);
    const p = perdele(COIN.katmanlar, 5);
    expect(p[gurultu].hz[0]).toBeGreaterThan(COIN.katmanlar[gurultu].hz[0]);
  });

  it('basamak 0 sesi DEĞİŞTİRMEZ (taban her zaman bugünkü ses)', () => {
    expect(seslendir(perdele(COIN.katmanlar, 0))).toEqual(seslendir(COIN.katmanlar));
  });

  it('tavan basamağı tabandan FARKLI örnek dizisi üretir', () => {
    const taban = seslendir(perdele(COIN.katmanlar, 0));
    const tavan = seslendir(perdele(COIN.katmanlar, COIN.seri!.tavan));
    expect(taban.length).toBe(tavan.length); // perde değişir, SÜRE değişmez
    let fark = 0;
    for (let i = 0; i < taban.length; i++) if (Math.abs(taban[i] - tavan[i]) > 1e-6) fark++;
    expect(fark).toBeGreaterThan(taban.length / 10);
  });

  it('perdeleme katalog nesnesini BOZMUYOR (yan etki yok)', () => {
    const once = JSON.stringify(COIN.katmanlar);
    perdele(COIN.katmanlar, 5);
    expect(JSON.stringify(COIN.katmanlar)).toBe(once);
  });
});

describe('7 — tek kaynak: yarım ses oranı ve perdeleme İKİ YERDE yazılı değil', () => {
  it('ölçüm metriği YARIM_SES\'i oyun kodundan alıyor, kendi kopyasını tutmuyor', () => {
    const src = readFileSync('tools/ses-metrik.ts', 'utf8');
    expect(src).toMatch(/import\s*\{[^}]*YARIM_SES[^}]*\}\s*from\s*'\.\.\/src\/game\/audioSynth/);
    expect(src).not.toMatch(/const\s+YARIM_SES\s*=/);
  });

  it('dinleme taslağı perdelemeyi oyun kodundan alıyor (panoda duyulan = oyunda çalan)', () => {
    const src = readFileSync('tools/ses-taslak.ts', 'utf8');
    expect(src).toMatch(/import\s*\{[^}]*perdele[^}]*\}\s*from\s*'\.\.\/src\/game\/audioSynth/);
    // İSME değil KULLANIMA bak: ilk hâli yalnız `import`u ve `const olcekle`in yokluğunu
    // arıyordu ve mutasyon M16 KAÇTI — import satırı yerinde dururken çağrının yerine satır
    // içi bir kopya konabiliyordu. (S23'ün öğrettiği aynı kusur: `toMatch(/FloorPatch/)` bir
    // bileşen silinse bile import satırında adı bulduğu için yeşil kalıyordu.)
    expect(src).toMatch(/seslendir\(perdele\(katmanlar, adim\)\)/);
    // Dosyada perde ölçekleyen İKİNCİ bir yol kalmamalı: `hz.map(... * ...)` kalıbı tam olarak
    // elle yazılmış bir perdelemedir ve `perdele`nin kendisi bu dosyada değil.
    expect(src).not.toMatch(/hz:\s*\w+\.hz\.map/);
  });

  it('arka uç her basamağı AYRI önbelleklemek zorunda (tek anahtar = tek perde olurdu)', () => {
    const src = readFileSync('src/game/audioWeb.ts', 'utf8');
    expect(src).toMatch(/\$\{id\}:\$\{yarimSes\}/);
    expect(src).toMatch(/seslendir\(perdele\(katmanlar, yarimSes\)\)/);
  });

  it('dosya yolu perdeyi playbackRate ile uyguluyor', () => {
    const src = readFileSync('src/game/audioWeb.ts', 'utf8');
    expect(src).toMatch(/playbackRate/);
    expect(src).toMatch(/Math\.pow\(2, yarimSes \/ 12\)/);
  });
});

describe('8 — kol A3: coin kelepçesi bilerek GEVŞEK (yığılma ivmenin taşıyıcısı)', () => {
  it('coin aralığı sesin kendi süresinden KISA — üst üste binebilir', () => {
    // A1 (kelepçeyi sesin boyuna çıkar) elendi: seri seyrekleşir ve I2'nin merdiveni görünmez
    // olur. Ölçüldü (B8): beş çakışmada sınırlayıcı sonrası tepe 0,196 — kırpılma YOK.
    const sure = seslendir(COIN.katmanlar).length / 44100;
    expect(COIN.aralik).toBeLessThan(sure);
  });

  it('coin kataloğun EN KISA kelepçesi — en sık olay o', () => {
    const hepsi = (Object.keys(SES_KATALOG) as SesId[]).map((id) => SES_KATALOG[id].aralik);
    expect(COIN.aralik).toBe(Math.min(...hepsi));
  });
});
