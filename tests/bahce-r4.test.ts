import { describe, expect, it } from 'vitest';
import {
  ARSA,
  BAHCE,
  ZEMIN_YARI,
  binaAyakIzi,
  bitkiler,
  cimAlanlari,
  cimTonu,
  citDirekleri,
  citParcalari,
  dikdortgenFarki,
  noktaIcinde,
  type Rect,
} from '../src/components/three/bahceLook';
import { ASFALT, KALDIRIM, KALDIRIM_ARKA, STREET_Z0 } from '../src/components/three/streetLook';
import { WALL_M, WALL_T_WAINSCOT } from '../src/components/three/wallPanel';
import { BAND, BAND_SHELL, LAYOUT, entranceAt, streetAt } from '../src/game/layout';

/**
 * ÖLÇÜMÜN MUTLAK SINIRI — `docs/olcum-cevre-r4.txt` §E: ufuk altı boşluğun en uzak taşması
 * 15,12 br. Bekçi bu sayıyı KENDİ kaynağından okumaz; okusaydı sınırı büyüten bir değişikliği
 * göremezdi (mutasyon M11 tam olarak öyle kaçmıştı).
 */
const OLCULEN_EN_UZAK_TASMA = 15.12;

/**
 * BAHÇE BEKÇİSİ — R4 · D-129.
 *
 * Kullanıcının kararı bir GÖRÜNÜM kararı değil bir KAPSAM kararıydı:
 *   *"alan olarak açmadığım her yer öyle olsun, açtıklarım zaten oynanabilir olacak."*
 * Yani bekçinin koruduğu şey çimin rengi değil, **çimin nerede olduğu ve nerede olmadığı**.
 * Üç şey bozulursa karar sessizce kaybolur:
 *   (a) çim açık alanın üstüne taşarsa → oynanan zemin yeşile boyanır
 *   (b) çim kilitli alanı boş bırakırsa → şikâyet edilen çıplak ahşap geri gelir
 *   (c) çim `areasOpen` ile küçülmezse → alan satın almak ekranda hiçbir şey değiştirmez
 * Üçü de aşağıda ayrı ayrı denetleniyor.
 */

const alan = (r: Rect) => (r.maxX - r.minX) * (r.maxZ - r.minZ);
const toplamAlan = (rs: Rect[]) => rs.reduce((t, r) => t + alan(r), 0);

/** ARSA içinde, kenarlara denk gelmeyen örnek noktalar. */
function* ornekNoktalar(adim = 1.7) {
  for (let x = ARSA.minX + 0.37; x < ARSA.maxX; x += adim)
    for (let z = ARSA.minZ + 0.53; z < ARSA.maxZ; z += adim) yield [x, z] as const;
}

describe('bahceLook — dikdörtgen farkı (çimin geometrisi)', () => {
  it('çıkarılan bölge tam olarak çıkar, kalan tam olarak kalır', () => {
    const p: Rect = { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
    const kalan = dikdortgenFarki(p, [{ minX: 2, maxX: 6, minZ: 3, maxZ: 7 }]);
    expect(toplamAlan(kalan)).toBeCloseTo(100 - 16, 6);
    for (const r of kalan) expect(noktaIcinde(r, 4, 5)).toBe(false);
  });

  it('parçalar BİRBİRİYLE ÖRTÜŞMEZ (örtüşen çim düzlemi z-fighting yapar)', () => {
    for (const a of [1, 2, 3]) {
      const rs = cimAlanlari(a);
      for (let i = 0; i < rs.length; i++)
        for (let j = i + 1; j < rs.length; j++) {
          const A = rs[i];
          const B = rs[j];
          const ortusme =
            Math.max(0, Math.min(A.maxX, B.maxX) - Math.max(A.minX, B.minX)) *
            Math.max(0, Math.min(A.maxZ, B.maxZ) - Math.max(A.minZ, B.minZ));
          expect(ortusme).toBeCloseTo(0, 9);
        }
    }
  });

  it('sıfır alanlı parça üretmez', () => {
    for (const a of [1, 2, 3]) for (const r of cimAlanlari(a)) expect(alan(r)).toBeGreaterThan(1e-6);
  });
});

describe('bahceLook — kapsam: açılmamış her yer, açılan hiçbir yer', () => {
  it('(a) AÇIK alanın üstünde çim YOK', () => {
    for (const a of [1, 2, 3]) {
      const cim = cimAlanlari(a);
      for (const acik of LAYOUT.areaBounds.slice(0, a)) {
        // Alanın İÇİNDEN örnekle (kenar payı bırak: duvar hattı zaten alanın dışında).
        for (let x = acik.minX + 0.4; x < acik.maxX; x += 1.3)
          for (let z = acik.minZ + 0.4; z < acik.maxZ; z += 1.3)
            expect(cim.some((r) => noktaIcinde(r, x, z))).toBe(false);
      }
    }
  });

  it('duvarın DIŞ YÜZÜ çimsiz — çim lambrinin altına girmez', () => {
    // Zemin hizasında duvarın en dış yüzünü lambri belirliyor (gövde 0,18'den kalın).
    // Sayı duvarın kendi modülünden geliyor: bahçe kendi payını doğrulayamaz.
    //
    // ÖRNEKLEME DEĞİL TAM HESAP: ilk yazım noktalarla tarıyordu ve elle yazılmış 0,60'lık payı
    // (doğrusu 0,61) yakalayamıyordu — 0,01 br iki örnek noktanın arasından geçiyor. Kenardan
    // ilk çim parçasına olan uzaklık DOĞRUDAN ölçülüyor.
    const disYuz = WALL_M + WALL_T_WAINSCOT / 2;
    const ortusur = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0) > 1e-6;
    for (const a of [1, 2, 3]) {
      const cim = cimAlanlari(a);
      for (const acik of LAYOUT.areaBounds.slice(0, a)) {
        const zKomsu = cim.filter((r) => ortusur(r.minZ, r.maxZ, acik.minZ, acik.maxZ));
        const xKomsu = cim.filter((r) => ortusur(r.minX, r.maxX, acik.minX, acik.maxX));
        const bosluklar = [
          ...zKomsu.filter((r) => r.minX >= acik.maxX - 1e-9).map((r) => r.minX - acik.maxX),
          ...zKomsu.filter((r) => r.maxX <= acik.minX + 1e-9).map((r) => acik.minX - r.maxX),
          ...xKomsu.filter((r) => r.minZ >= acik.maxZ - 1e-9).map((r) => r.minZ - acik.maxZ),
          ...xKomsu.filter((r) => r.maxZ <= acik.minZ + 1e-9).map((r) => acik.minZ - r.maxZ),
        ];
        for (const b of bosluklar) expect(b).toBeGreaterThanOrEqual(disYuz - 1e-9);
      }
    }
  });

  it('KAPI EŞİĞİ ve SOKAK NOKTASI hiçbir zaman çimin üstünde değil', () => {
    // Müşteri bu iki nokta arasında yürüyor. Eski sürümde bunu bir "koridor elemesi" koruyordu;
    // mutasyon o elemenin hiç ateşlenmediğini gösterdi (kapı her zaman ayak izinin içinde).
    // Kural artık bitkinin değil BAHÇENİN değişmezi ve doğrudan burada denetleniyor.
    for (const a of [1, 2, 3]) {
      const cim = cimAlanlari(a);
      const [ex, , ez] = entranceAt(a);
      const [sx, , sz] = streetAt(a);
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const x = ex + (sx - ex) * t;
        const z = ez + (sz - ez) * t;
        expect(cim.some((r) => noktaIcinde(r, x, z))).toBe(false);
      }
    }
  });

  it('(b) ARSA içinde binaya ait OLMAYAN her nokta çimle kaplı', () => {
    for (const a of [1, 2, 3]) {
      const cim = cimAlanlari(a);
      const ayak = binaAyakIzi(a);
      let bakilan = 0;
      for (const [x, z] of ornekNoktalar()) {
        if (ayak.some((r) => noktaIcinde(r, x, z))) continue;
        bakilan++;
        expect(cim.some((r) => noktaIcinde(r, x, z))).toBe(true);
      }
      expect(bakilan).toBeGreaterThan(500); // örneklem gerçekten bakmış olsun
    }
  });

  it('(c) bahçe areasOpen ile KÜÇÜLÜR — her alan açılışı ekranda bir şey değiştirir', () => {
    const a1 = toplamAlan(cimAlanlari(1));
    const a2 = toplamAlan(cimAlanlari(2));
    const a3 = toplamAlan(cimAlanlari(3));
    expect(a2).toBeLessThan(a1);
    expect(a3).toBeLessThan(a2);
    // 2. alan 17 × 17 = 289 br²; duvar payı yüzünden biraz daha büyük düşer.
    expect(a1 - a2).toBeGreaterThan(280);
  });

  it('ARKA BANT, bant çizilmeden önce bahçedir; çizilince TAMAMI bahçe değildir', () => {
    // Orta noktaya bakmak YETMİYOR: bandın maxZ'si yanlış yazılırsa bantla 3. alan arasında
    // ince bir yeşil şerit kalıyor ve orta nokta onu görmüyor. Bütün bant taranır.
    const oncesi = cimAlanlari(2);
    const sonrasi = cimAlanlari(3);
    let bakilan = 0;
    for (let x = BAND_SHELL.left + 0.3; x < BAND_SHELL.right; x += 1.1)
      for (let z = BAND_SHELL.back + 0.3; z < BAND.front; z += 0.37) {
        bakilan++;
        expect(sonrasi.some((r) => noktaIcinde(r, x, z))).toBe(false);
      }
    expect(bakilan).toBeGreaterThan(500);
    expect(oncesi.some((r) => noktaIcinde(r, 0, (BAND.front + BAND.back) / 2))).toBe(true);
  });
});

describe('bahceLook — sokak sınırı ve katman', () => {
  it('çim SOKAĞA taşmaz (§E: boşluğun yalnız %1,6\'sı ön kenarda)', () => {
    expect(ARSA.maxZ).toBeCloseTo(STREET_Z0, 6);
    for (const a of [1, 2, 3]) for (const r of cimAlanlari(a)) expect(r.maxZ).toBeLessThanOrEqual(STREET_Z0 + 1e-9);
  });

  it('kaldırım ile asfalt arasında DİKİŞ yok (R4\'te 0,10 br\'lik boşluktu)', () => {
    expect(ASFALT.z - ASFALT.d / 2).toBeCloseTo(KALDIRIM_ARKA, 9);
    expect(KALDIRIM_ARKA).toBeCloseTo(KALDIRIM.z + KALDIRIM.d / 2, 9);
  });

  it('çim, alan kaplamasının ÜSTÜNDE ama zemin işaretinin ALTINDA kalır', () => {
    expect(BAHCE.cimY).toBeGreaterThan(0.006); // FloorPattern deseni
    expect(BAHCE.cimY).toBeLessThan(0.02); // GroundMarker
  });

  it('çim TEK RENK DEĞİL — bu turun kendi bulgusu (sapma 1,39 = bitmemiş yüzey)', () => {
    const tonlar = new Set(cimAlanlari(1).map((r) => cimTonu(r).toFixed(4)));
    expect(tonlar.size).toBeGreaterThan(2);
    for (const r of cimAlanlari(1)) {
      expect(cimTonu(r)).toBeGreaterThan(0.9);
      expect(cimTonu(r)).toBeLessThan(1.08);
    }
  });
});

describe('bahceLook — bitkiler', () => {
  it('hiçbir bitki binanın içinde ya da dibinde değil', () => {
    for (const a of [1, 2, 3]) {
      const ayak = binaAyakIzi(a);
      for (const b of bitkiler(a))
        for (const r of ayak)
          expect(
            noktaIcinde(
              { minX: r.minX - BAHCE.binaPayi, maxX: r.maxX + BAHCE.binaPayi, minZ: r.minZ - BAHCE.binaPayi, maxZ: r.maxZ + BAHCE.binaPayi },
              b.x,
              b.z,
            ),
          ).toBe(false);
    }
  });

  it('hiçbir bitki görünmez menzilin ötesinde değil (uzağa konan süs, konmamış süstür)', () => {
    // Sınır ÖLÇÜMDEN geliyor, `BAHCE.bitkiMenzil`den değil: kendi sabitini okuyan bir bekçi,
    // o sabit büyüdüğünde hiçbir şey söylemez.
    expect(BAHCE.bitkiMenzil).toBeLessThanOrEqual(OLCULEN_EN_UZAK_TASMA);
    const sinir = ZEMIN_YARI + OLCULEN_EN_UZAK_TASMA;
    for (const a of [1, 2, 3])
      for (const b of bitkiler(a)) {
        expect(Math.abs(b.x)).toBeLessThanOrEqual(sinir);
        expect(b.z).toBeGreaterThanOrEqual(-sinir);
        expect(b.z).toBeLessThanOrEqual(STREET_Z0);
      }
  });

  it('her aşamada bitki VAR ve alan açıldıkça azalır', () => {
    const n1 = bitkiler(1).length;
    const n3 = bitkiler(3).length;
    expect(n1).toBeGreaterThan(40);
    expect(n3).toBeGreaterThan(20);
    expect(n3).toBeLessThan(n1);
  });

  it('hem ağaç hem çalı var, boyları ayrışıyor', () => {
    const b = bitkiler(1);
    const agac = b.filter((x) => x.tur === 'agac');
    const cali = b.filter((x) => x.tur === 'cali');
    expect(agac.length).toBeGreaterThan(5);
    expect(cali.length).toBeGreaterThan(agac.length);
    expect(Math.min(...agac.map((x) => x.boy))).toBeGreaterThan(Math.max(...cali.map((x) => x.boy)));
  });

  it('yerleşim KARARLI — aynı çağrı aynı bahçeyi verir', () => {
    expect(bitkiler(2)).toEqual(bitkiler(2));
  });
});

describe('bahceLook — çit', () => {
  it('ÖN kenarda çit yok (müşteri oradan giriyor)', () => {
    const on = ZEMIN_YARI + BAHCE.citPay;
    for (const p of citParcalari()) expect(p.z + p.d / 2).toBeLessThanOrEqual(STREET_Z0 + 1e-9);
    for (const d of citDirekleri()) expect(d.z).toBeLessThanOrEqual(STREET_Z0 + 1e-9);
    // üç hat var: sol · sağ · arka
    expect(citParcalari()).toHaveLength(3);
    expect(citParcalari().filter((p) => Math.abs(Math.abs(p.x) - on) < 1e-9)).toHaveLength(2);
  });

  it('çit zemin karesinin DIŞINDA ve çimin İÇİNDE', () => {
    const on = ZEMIN_YARI + BAHCE.citPay;
    expect(on).toBeGreaterThan(ZEMIN_YARI);
    expect(on).toBeLessThan(ZEMIN_YARI + BAHCE.disPay); // arkasında hâlâ çim var
    const cim = cimAlanlari(3);
    for (const d of citDirekleri()) expect(cim.some((r) => noktaIcinde(r, d.x, d.z))).toBe(true);
  });

  it('direkler aralıklı ve köşede çift direk yok', () => {
    const d = citDirekleri();
    expect(d.length).toBeGreaterThan(30);
    const anahtar = new Set(d.map((p) => `${p.x.toFixed(4)}|${p.z.toFixed(4)}`));
    expect(anahtar.size).toBe(d.length);
  });
});
