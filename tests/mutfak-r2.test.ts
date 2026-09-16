import { describe, expect, it } from 'vitest';
import {
  FLOOR_HALF,
  LAYOUT,
  WAITER_STATION,
  activeSolids,
  clampToOpenAreas,
  hitsSolid,
  servicePlace,
  waiterStationOpen,
} from '../src/game/layout';
import {
  GECIS_ESIGI,
  SERVIS_ISARETLERI,
  SERVIS_SABIT_YERLER,
  SERVIS_TABLA_HX,
  SERVIS_TABLA_HZ,
  eksenTakasi,
  onHat,
  onHatGovdeleri,
  servisIsaretleri,
  yerelKutu,
  type OnHatGovde,
} from '../src/components/three/kitchenLook';
import { PLAYER_RADIUS } from '../src/config/actor';
import { MAX_AREAS, isCounter, sellsTost } from '../src/game/world';
import { economyConfig as C } from '../src/config/economy.config';

/**
 * mutfak-r2.test.ts — R2'NİN BEKÇİSİ (D-127 · G-35 · G-36 · G-37 · G-38).
 *
 * NE KORUYOR. Ön hattın gövde ölçüsü, çağıranın uyguladığı dönüşle AYNI eksende teslim edilmeli.
 * Kusur bunun tersiydi: ölçü DÜNYA ekseninde üretilip YEREL eksende tüketiliyordu ve yalnız
 * `rot ≠ 0` olan dönemde görünüyordu (sol duvar). Arka bant dönemi doğru çalıştığı için hata
 * S3'ten R2'ye kadar kimsenin gözüne batmadı.
 *
 * BU YÜZDEN HER DENETİM İKİ DÖNEMİ BİRDEN GEZER. Tek dönemi denetleyen bir bekçi, bu kusurun
 * TAM OLARAK kaçtığı bekçidir — `rot = 0` tarafı hep yeşil yanardı.
 *
 * Denetimler sahneyi ÇİZMEDEN koşar: ölçü `kitchenLook`ta, kutu `layout`ta, seviye işaretleri
 * `SERVIS_ISARETLERI`nde. `ServicePoint.tsx` yalnız çizer, hiçbir eşiğe karar vermez.
 *
 * Mutasyonla doğrulandı: `node tools/mutasyon-mutfak-r2.mjs`.
 */

interface Kutu {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const en = (k: Kutu) => k.maxX - k.minX;
const boy = (k: Kutu) => k.maxZ - k.minZ;
const alan = (k: Kutu) => en(k) * boy(k);

function kesisim(a: Kutu, b: Kutu): number {
  const w = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const d = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  return w <= 0 || d <= 0 ? 0 : w * d;
}

/** Çizilen gövdenin DÜNYA ayak izi — oyunun uyguladığı dönüşün aynısı. */
function cizimKutusu(merkez: readonly [number, number, number], rot: number, g: OnHatGovde): Kutu {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const ox = g.dx * c;
  const oz = -g.dx * s;
  const hx = Math.abs(c) * (g.w / 2) + Math.abs(s) * (g.d / 2);
  const hz = Math.abs(s) * (g.w / 2) + Math.abs(c) * (g.d / 2);
  return { minX: merkez[0] + ox - hx, maxX: merkez[0] + ox + hx, minZ: merkez[2] + oz - hz, maxZ: merkez[2] + oz + hz };
}

const kutuOf = (c: readonly [number, number, number], h: readonly [number, number]): Kutu => ({
  minX: c[0] - h[0], maxX: c[0] + h[0], minZ: c[2] - h[1], maxZ: c[2] + h[1],
});

interface Govde {
  ad: string;
  merkez: readonly [number, number, number];
  rot: number;
  half: readonly [number, number];
  govde: OnHatGovde;
}

function govdeler(areasOpen: number): Govde[] {
  const p = servicePlace(areasOpen);
  const g = onHatGovdeleri(areasOpen);
  const out: Govde[] = [
    { ad: 'tezgah', merkez: p.station, rot: p.rot, half: p.half, govde: g.station },
    { ad: 'bulasik', merkez: p.dish, rot: p.dishRot, half: p.dishHalf, govde: g.dish },
  ];
  if (waiterStationOpen(areasOpen))
    out.push({ ad: 'garson', merkez: WAITER_STATION.pos, rot: WAITER_STATION.rot, half: WAITER_STATION.half, govde: g.waiter });
  return out;
}

/** İKİ DÖNEM — hiçbir denetim tek dönemde koşmaz (bu kusurun kaçtığı yol tam oydu). */
const DONEMLER = [
  { ad: 'SOL DUVAR', areasOpen: 2, tables: 6 },
  { ad: 'ARKA BANT', areasOpen: MAX_AREAS, tables: 14 },
] as const;

describe('R2 · ön hattın gövdesi kutusuyla aynı yönde (G-35)', () => {
  for (const d of DONEMLER) {
    it(`${d.ad}: her gövdenin UZUN ekseni kutusunun uzun ekseniyle aynı`, () => {
      for (const g of govdeler(d.areasOpen)) {
        const kutu = kutuOf(g.merkez, g.half);
        const cizim = cizimKutusu(g.merkez, g.rot, g.govde);
        // Kutu kare değilse uzun eksen karşılaştırılabilir; kare ise denetim anlamsız olurdu.
        expect(en(kutu), `${g.ad} kutusu kare — denetim anlamını yitirir`).not.toBeCloseTo(boy(kutu), 3);
        expect(en(cizim) >= boy(cizim), `${g.ad} çizimi kutusuna DİK duruyor (90° kusuru)`).toBe(
          en(kutu) >= boy(kutu),
        );
      }
    });

    it(`${d.ad}: çizim kutunun DERİNLİĞİNİ birebir taşır (yalnız uzun eksende genişleyebilir)`, () => {
      for (const g of govdeler(d.areasOpen)) {
        const kutu = kutuOf(g.merkez, g.half);
        const cizim = cizimKutusu(g.merkez, g.rot, g.govde);
        const uzunX = en(kutu) >= boy(kutu);
        // Kısa eksen (derinlik) ASLA değişmez: `onHat` yalnız hattın uzun ekseninde birleştirir.
        const kisaKutu = uzunX ? boy(kutu) : en(kutu);
        const kisaCizim = uzunX ? boy(cizim) : en(cizim);
        expect(kisaCizim, `${g.ad} derinliği kutusundan farklı`).toBeCloseTo(kisaKutu, 6);
        // Uzun eksende yalnız BÜYÜYEBİLİR (birleştirme), küçülemez.
        const uzunKutu = uzunX ? en(kutu) : boy(kutu);
        const uzunCizim = uzunX ? en(cizim) : boy(cizim);
        expect(uzunCizim, `${g.ad} çizimi kutusundan DAR`).toBeGreaterThanOrEqual(uzunKutu - 1e-6);
      }
    });
  }

  it('SOL DUVAR: gövdeler kutularıyla TAM örtüşür (IoU = 1,00) — orada birleştirme yok', () => {
    for (const g of govdeler(2)) {
      const kutu = kutuOf(g.merkez, g.half);
      const cizim = cizimKutusu(g.merkez, g.rot, g.govde);
      const iou = kesisim(kutu, cizim) / (alan(kutu) + alan(cizim) - kesisim(kutu, cizim));
      expect(iou, `${g.ad} IoU`).toBeCloseTo(1, 6);
    }
  });

  it('garson istasyonu YALNIZ dönüşsüz dönemde sahnede — ortak `rot` varsayımı test edilir', () => {
    for (const d of DONEMLER) {
      if (!waiterStationOpen(d.areasOpen)) continue;
      expect(eksenTakasi(servicePlace(d.areasOpen).rot), `${d.ad}: garson istasyonu dönmüş hatta`).toBe(false);
      expect(WAITER_STATION.rot).toBe(0);
    }
  });

  /*
   * EKSEN SÖZLEŞMESİNİN KENDİSİ — bugün hiçbir dönem "dönmüş hat + birleştirme" bileşimini
   * koşmuyor (birleştirme yalnız garson istasyonu sahnedeyken, o da yalnız `rot = 0` döneminde).
   * Mutasyon denemesi bunu gösterdi: `onHatGovdeleri` üzerinden iki mutasyon bekçiden KAÇTI,
   * çünkü yanlışladıkları dal canlı kodda ölüydü. Sözleşme o yüzden DOĞRUDAN koşturuluyor —
   * B1 (erken birleşme) bir gün açılırsa kural sessizce yanlış çalışmasın.
   */
  it('dönmüş hatta birleştirme DÜNYADA doğru yöne uzar (ölü dalın sözleşmesi)', () => {
    const rot = Math.PI / 2;
    const takas = eksenTakasi(rot);
    // Sol duvar düzenine benzer iki gövde: aralarında 1,00 br boşluk (z 5,0 ↔ z 9,0).
    const a = { pos: [-16.2, 0, 5.0] as const, half: [0.5, 1.5] as const };
    const b = { pos: [-16.2, 0, 9.0] as const, half: [0.5, 1.5] as const };
    const [ga, gb] = onHat([yerelKutu(a.pos, a.half, takas), yerelKutu(b.pos, b.half, takas)]);

    /** Yerel gövdeyi oyunun uyguladığı dönüşle dünyaya taşır (Scene.Stations · DishSink). */
    const dunyaZ = (pos: readonly [number, number, number], g: OnHatGovde) => {
      const merkez = pos[2] - g.dx * Math.sin(rot); // yerel +x → dünya −z
      return { min: merkez - g.w / 2, max: merkez + g.w / 2 };
    };
    const za = dunyaZ(a.pos, ga);
    const zb = dunyaZ(b.pos, gb);

    // ① Her gövde KENDİ tarafında kaldı (işaret ters olsaydı yer değiştirirlerdi).
    expect(za.min, 'kuzeydeki gövde güneye kaydı').toBeLessThan(zb.min);
    // ② Dış kenarlar yerinde: birleştirme yalnız ARADAKİ boşluğu yer.
    expect(za.min).toBeCloseTo(a.pos[2] - a.half[1], 6);
    expect(zb.max).toBeCloseTo(b.pos[2] + b.half[1], 6);
    // ③ Aradaki boşluk kapandı ve dikiş tam ORTADA.
    expect(za.max, 'birleştirme boşluğu kapatmadı').toBeCloseTo(zb.min, 6);
    expect(za.max, 'dikiş boşluğun ortasında değil').toBeCloseTo((a.pos[2] + a.half[1] + b.pos[2] - b.half[1]) / 2, 6);
    // ④ Derinlik yerel z'ye gitti (dünya x'i), yani kısa eksen takas edildi.
    expect(ga.d).toBeCloseTo(a.half[0] * 2, 6);
  });

  it('`yerelKutu` dönüşsüz hatta hiçbir şeyi takas etmez', () => {
    const k = yerelKutu([-13, 0, -10.3], [1.6, 0.5], false);
    expect(k.x).toBeCloseTo(-13, 6);
    expect(k.hx).toBeCloseTo(1.6, 6);
    expect(k.hz).toBeCloseTo(0.5, 6);
  });

  it('`eksenTakasi` yalnız ±π/2 için doğru söyler', () => {
    expect(eksenTakasi(0)).toBe(false);
    expect(eksenTakasi(Math.PI)).toBe(false);
    expect(eksenTakasi(Math.PI / 2)).toBe(true);
    expect(eksenTakasi(-Math.PI / 2)).toBe(true);
  });
});

describe('R2 · çizilen gövdenin içinden geçilmez, kutusunda boşluk yoktur (G-36)', () => {
  /** Oyuncunun yürüyerek varabildiği hücreler — oyunun kendi iki kapısıyla. */
  function erisilebilir(tables: number, areasOpen: number, hucre: number): Set<string> {
    const solids = activeSolids(tables, areasOpen);
    const durabilir = (i: number, j: number): boolean => {
      const x = (i + 0.5) * hucre;
      const z = (j + 0.5) * hucre;
      if (Math.abs(x) > FLOOR_HALF || Math.abs(z) > FLOOR_HALF) return false;
      const [cx, cz] = clampToOpenAreas(x, z, areasOpen);
      if (Math.abs(cx - x) > 1e-9 || Math.abs(cz - z) > 1e-9) return false;
      return !hitsSolid(x, z, solids, PLAYER_RADIUS);
    };
    const bas: [number, number] = [Math.floor(LAYOUT.player[0] / hucre), Math.floor(LAYOUT.player[2] / hucre)];
    const gorulen = new Set<string>();
    if (!durabilir(bas[0], bas[1])) return gorulen;
    const yigin: [number, number][] = [bas];
    gorulen.add(`${bas[0]},${bas[1]}`);
    while (yigin.length) {
      const [i, j] = yigin.pop()!;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const a = `${i + di},${j + dj}`;
        if (gorulen.has(a) || !durabilir(i + di, j + dj)) continue;
        gorulen.add(a);
        yigin.push([i + di, j + dj]);
      }
    }
    return gorulen;
  }

  const HUCRE = 0.05;

  for (const d of DONEMLER) {
    it(`${d.ad}: çizilen gövdenin içinde yürünebilen alan YOK`, () => {
      const erisilir = erisilebilir(d.tables, d.areasOpen, HUCRE);
      // Taşma-doldurma gerçekten yayıldı mı — yayılmazsa "0 geçilen" sahte olur, sıfır kendini
      // doğrular (R1'in üçüncü dersi). Eşik: katın kaba açık alanının çeyreği.
      expect(erisilir.size, 'taşma-doldurma kata yayılmadı').toBeGreaterThan(
        (d.areasOpen * FLOOR_HALF * FLOOR_HALF) / (HUCRE * HUCRE) / 4,
      );
      for (const g of govdeler(d.areasOpen)) {
        const c = cizimKutusu(g.merkez, g.rot, g.govde);
        let gecilen = 0;
        for (let i = Math.floor(c.minX / HUCRE); i <= Math.ceil(c.maxX / HUCRE); i++)
          for (let j = Math.floor(c.minZ / HUCRE); j <= Math.ceil(c.maxZ / HUCRE); j++) {
            const x = (i + 0.5) * HUCRE;
            const z = (j + 0.5) * HUCRE;
            if (x < c.minX || x > c.maxX || z < c.minZ || z > c.maxZ) continue;
            if (erisilir.has(`${i},${j}`)) gecilen += HUCRE * HUCRE;
          }
        expect(gecilen, `${g.ad} gövdesinin içinden yürünüyor`).toBeCloseTo(0, 6);
      }
    });

    it(`${d.ad}: katı olup hiçbir gövde çizilmemiş alan YOK (görünmez duvar)`, () => {
      for (const g of govdeler(d.areasOpen)) {
        const kutu = kutuOf(g.merkez, g.half);
        const c = cizimKutusu(g.merkez, g.rot, g.govde);
        // Çizim kutuyu tamamen kapsamalı: kısa eksende birebir, uzun eksende eşit ya da geniş.
        expect(c.minX, `${g.ad} kutusunun batısı çizilmemiş`).toBeLessThanOrEqual(kutu.minX + 1e-6);
        expect(c.maxX, `${g.ad} kutusunun doğusu çizilmemiş`).toBeGreaterThanOrEqual(kutu.maxX - 1e-6);
        expect(c.minZ, `${g.ad} kutusunun kuzeyi çizilmemiş`).toBeLessThanOrEqual(kutu.minZ + 1e-6);
        expect(c.maxZ, `${g.ad} kutusunun güneyi çizilmemiş`).toBeGreaterThanOrEqual(kutu.maxZ - 1e-6);
      }
    });
  }

  it('SOL DUVAR: gövdeler SALONUN dışına taşmaz (tezgâh duvarı 0,79 br deliyordu)', () => {
    for (const g of govdeler(2)) {
      const c = cizimKutusu(g.merkez, g.rot, g.govde);
      for (const [x, z] of [[c.minX, c.minZ], [c.maxX, c.minZ], [c.minX, c.maxZ], [c.maxX, c.maxZ]] as const) {
        // Köşeler açık alanın İÇİNDE kalmalı; kelepçe onları çekiyorsa gövde duvarın dışındadır.
        const [cx, cz] = clampToOpenAreas(x, z, 2);
        expect(Math.hypot(cx - x, cz - z), `${g.ad} köşesi odanın dışında`).toBeLessThan(1e-6);
      }
    }
  });
});

describe('R2 · başlangıç hattı bitişik (G-37 · B2)', () => {
  it('SOL DUVAR: tezgâh ile bulaşığın KUTULARI değiyor — boşluk 0,00', () => {
    const p = servicePlace(2);
    const tezgahUc = p.station[2] + p.half[1];
    const bulasikBas = p.dish[2] - p.dishHalf[1];
    expect(bulasikBas - tezgahUc, 'iki kutu arasında boşluk var').toBeCloseTo(0, 6);
  });

  it('SOL DUVAR: ÇİZİLEN gövdeler de bitişik (aradan oyuncu geçemez)', () => {
    const gs = govdeler(2);
    const araliklar = gs
      .map((g) => {
        const c = cizimKutusu(g.merkez, g.rot, g.govde);
        return { ad: g.ad, a: c.minZ, b: c.maxZ };
      })
      .sort((p, q) => p.a - q.a);
    for (let i = 0; i < araliklar.length - 1; i++) {
      const bosluk = araliklar[i + 1].a - araliklar[i].b;
      expect(bosluk, `${araliklar[i].ad} ↔ ${araliklar[i + 1].ad} arası açık`).toBeLessThan(GECIS_ESIGI);
    }
  });

  it('bulaşığa bağlı ankrajlar bulaşıkla birlikte taşınmış (elle kalmamış)', () => {
    const p = servicePlace(2);
    const dishZ = p.dish[2];
    // Bulaşıkçının postası bulaşığın 2,0 br kuzeyinde durur — ilişki türemiş olmalı.
    expect(p.dishwasherHome[2] - dishZ, 'bulaşıkçı postası bulaşıktan koptu').toBeCloseTo(2.0, 6);
    // Bulaşıkçı pad'i bulaşığın TAM yanında (aynı z) — pad hedefin konumundadır.
    expect(LAYOUT.padPos.dishwasher[2] - dishZ, 'bulaşıkçı pad\'i boş zemini işaretliyor').toBeCloseTo(0, 6);
    // Çaycının yolu hattın boyunca uzanır: bulaşığın ön ucunu geçmez, tezgâhın arkasında başlar.
    expect(p.staffWalk.b[2]).toBeLessThanOrEqual(dishZ + p.dishHalf[1] + 1e-6);
    expect(p.staffWalk.a[2]).toBeGreaterThanOrEqual(p.station[2] - p.half[1] - 1e-6);
  });

  it('taşınan ankrajların hiçbiri katı engelin İÇİNDE değil', () => {
    const p = servicePlace(2);
    const solids = activeSolids(6, 2);
    const noktalar: [string, readonly [number, number, number]][] = [
      ['dishwasherHome', p.dishwasherHome],
      ['waiterHome', p.waiterHome],
      ['staffWalk.a', p.staffWalk.a],
      ['staffWalk.b', p.staffWalk.b],
      ['pad.dishwasher', LAYOUT.padPos.dishwasher],
      ...p.waiterPosts.map((v, i) => [`waiterPosts[${i}]`, v] as [string, readonly [number, number, number]]),
    ];
    for (const [ad, v] of noktalar) {
      // Personel yarıçapı değil NOKTA denetlenir: bu noktalar durulan yerler, gövde payı ayrı iş.
      expect(hitsSolid(v[0], v[2], solids, 0), `${ad} katı engelin içinde`).toBe(false);
    }
  });
});

describe('R2 · her yükseltme basamağı BİÇİMDEN okunur (G-38 · C2)', () => {
  const maxLevel = C.service.upgrade.maxLevel;

  it('her basamak en az bir RENK DIŞI işaret kazanır', () => {
    for (let L = 0; L < maxLevel; L++) {
      const eklenen = servisIsaretleri(L + 1).filter((a) => !servisIsaretleri(L).includes(a));
      const kimlik = isCounter(L + 1) && !isCounter(L);
      const tost = sellsTost(L + 1) && !sellsTost(L);
      const bicim = eklenen.length + (kimlik ? 1 : 0) + (tost ? 1 : 0);
      expect(bicim, `L${L}→L${L + 1} basamağında biçim işareti yok`).toBeGreaterThanOrEqual(1);
    }
  });

  it('EN PAHALI basamak (L5→L6) da işaret kazanır — ölçümde 0 sinyaldi', () => {
    const eklenen = servisIsaretleri(maxLevel).filter((a) => !servisIsaretleri(maxLevel - 1).includes(a));
    expect(eklenen.length, 'son basamak ekranda iz bırakmıyor').toBeGreaterThanOrEqual(1);
  });

  it('işaretler kimlik/tost ile ÇAKIŞMAZ — aynı sinyal iki kez sayılmaz', () => {
    // L4 ve L5 zaten birer biçim işareti (`world`ten okunur); listede ikinci kez bulunmamalı.
    for (const i of SERVIS_ISARETLERI)
      expect([C.service.counterLevel, C.service.tostLevel], `${i.ad} zaten kimlik/tost basamağında`).not.toContain(
        i.acilir,
      );
  });

  it('hiçbir işaret oyunun tavanının ÜSTÜNDE açılmaz (ulaşılamaz işaret olmaz)', () => {
    for (const i of SERVIS_ISARETLERI) {
      expect(i.acilir, `${i.ad} eşiği geçersiz`).toBeGreaterThanOrEqual(1);
      expect(i.acilir, `${i.ad} hiç açılmaz (tavan L${maxLevel})`).toBeLessThanOrEqual(maxLevel);
    }
  });

  it('işaretler seviyeyle SÖNMEZ — bir kez açılan açık kalır', () => {
    for (let L = 1; L <= maxLevel; L++) {
      const once = servisIsaretleri(L - 1);
      const simdi = servisIsaretleri(L);
      for (const a of once) expect(simdi, `L${L}'te ${a} kayboldu`).toContain(a);
    }
  });

  it('işaretlerin ayak izi TABLANIN içinde ve birbirine girmiyor', () => {
    /* Yerleşim `kitchenLook.SERVIS_ISARETLERI`ten okunur — `ServicePoint.tsx` de oradan çizer.
       İlk yazımda koordinatlar burada KOPYALANMIŞTI ve bir eşyayı bileşende kaydırmak bu bekçiyi
       hiç uyandırmıyordu (`feedback_single_source_of_truth`). */
    const hepsi = [
      ...SERVIS_SABIT_YERLER,
      ...SERVIS_ISARETLERI.map((i) => ({ ad: i.ad, x: i.x, z: i.z, hx: i.hx, hz: i.hz })),
    ];
    for (const y of hepsi) {
      expect(Math.abs(y.x) + y.hx, `${y.ad} tablanın x sınırını aşıyor`).toBeLessThanOrEqual(SERVIS_TABLA_HX + 1e-9);
      expect(Math.abs(y.z) + y.hz, `${y.ad} tablanın z sınırını aşıyor`).toBeLessThanOrEqual(SERVIS_TABLA_HZ + 1e-9);
    }
    for (let i = 0; i < hepsi.length; i++)
      for (let k = i + 1; k < hepsi.length; k++) {
        const a = hepsi[i];
        const b = hepsi[k];
        // Sıfır ayak izli kayıtlar (başka bir gövdenin üstünde duran pres) çakışma sayılmaz.
        if (a.hx + a.hz === 0 || b.hx + b.hz === 0) continue;
        const carpisiyor = Math.abs(a.x - b.x) < a.hx + b.hx && Math.abs(a.z - b.z) < a.hz + b.hz;
        expect(carpisiyor, `${a.ad} ile ${b.ad} üst üste biniyor`).toBe(false);
      }
  });

  it('tabla her iki dönemde de işaretleri taşıyacak kadar geniş', () => {
    for (const d of DONEMLER) {
      const g = onHatGovdeleri(d.areasOpen).station;
      expect(g.w / 2, `${d.ad}: tabla işaretlerin yerleşimine dar`).toBeGreaterThanOrEqual(SERVIS_TABLA_HX - 1e-9);
      expect(g.d / 2, `${d.ad}: tabla derinliği dar`).toBeGreaterThanOrEqual(SERVIS_TABLA_HZ - 1e-9);
    }
  });
});
