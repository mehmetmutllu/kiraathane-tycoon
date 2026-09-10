import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CITA_Y,
  DECOR_MODELS,
  DECOR_S,
  INSAN_ORANI,
  KITAPLIK_DY,
  KONSOL_TOP_Y,
  LAMBA_MASA_H,
  LAMBA_MASA_S,
  LAMBA_YER_H,
  LAMBA_YER_S,
  NATIVE,
  asmaKenar,
  parcaYerlesim,
  govdeMesafe,
  turDunyaKutu,
  turKutu,
  turYaricap,
  varyant,
  type DecorModel,
} from '../src/components/three/decorLook';
import { KITCHEN_S } from '../src/components/three/kitchenLook';
import { WALL_H } from '../src/components/three/wallPanel';
import { ACTOR_HEIGHT } from '../src/config/actor';
import { decorItems, MOUNT, type DecorKind } from '../src/config/decor';
import { LAYOUT, PAD_RADIUS, TABLE_UP_RADIUS, servicePlace, tableSolids } from '../src/game/layout';
import { areaTableSlots, areaTableStart, MAX_AREAS } from '../src/game/world';

const maxTablesFor = (areasOpen: number): number => areaTableStart(areasOpen - 1) + areaTableSlots(areasOpen - 1);
const PAKET = 'public/assets/models/kaykit-furniture-bits/';

/**
 * decor-look — S5 BEKÇİSİ. `docs/dekor-raporu-s5.md`'nin sayılarını kilitler.
 *
 * Bu turun bulduğu kör nokta: bugünkü dekor bekçisi (`tests/layout-b6a.test.ts`) parçaları
 * yalnız MERKEZ noktasıyla denetliyor. Model geçince merkez aynı kalıp gövde büyüyebilir ve
 * bekçi yeşil kalır. Buradaki açıklık testleri gövde KENARINDAN ölçer.
 */
describe('S5 — dekorun ölçek kuralı: mobilya 0,90, aydınlatma gerçek boy', () => {
  it('mobilya ölçeği oyunun TEK ölçeğidir (mutfakla aynı sayı)', () => {
    // Ayrı bir dekor ölçeği türetilirse mutfak hattıyla dekor iki ayrı ritimde okunur.
    expect(DECOR_S).toBe(KITCHEN_S);
  });

  it('AYDINLATMA 0,90 DEĞİL — gerçek boyuna çekilir (ölçümün kapattığı kol)', () => {
    // 0,90'da `lamp_standing` 2,27 br = karakterin %130'u; bu kural onu geri getirmeyi engeller.
    expect(LAMBA_YER_S).not.toBe(DECOR_S);
    expect(LAMBA_MASA_S).not.toBe(DECOR_S);
    expect(NATIVE.lamp_standing.h * LAMBA_YER_S).toBeCloseTo(LAMBA_YER_H, 6);
    expect(NATIVE.lamp_table.h * LAMBA_MASA_S).toBeCloseTo(LAMBA_MASA_H, 6);
  });

  it('İNSAN ORANI: ayaklı lamba karakterden KISA, konsol beline yakın', () => {
    // `feedback_reference_scale_trap` — ölçek önce insanla sağlanır.
    expect(INSAN_ORANI.ayakliLamba).toBeLessThan(1);
    expect(INSAN_ORANI.ayakliLamba).toBeGreaterThan(0.8);
    expect(INSAN_ORANI.konsol).toBeGreaterThan(0.4);
    expect(INSAN_ORANI.konsol).toBeLessThan(0.6);
    expect(NATIVE.lamp_standing.h * DECOR_S / ACTOR_HEIGHT).toBeGreaterThan(1); // 0,90'ın neden düştüğü
  });

  it('SERBEST duran parça z’de itilmez (kaktüs/halı/lamba yerinden kaymaz)', () => {
    for (const [kind, parts] of Object.entries(DECOR_MODELS)) {
      for (const p of parts ?? []) {
        if (p.sirt !== 'serbest') continue;
        expect(parcaYerlesim(p, p.model).z, `${kind}/${p.model}`).toBe(0);
      }
    }
  });

  it('origin x kayması telafi edilir — gövdenin görsel merkezi yuvanın merkezinde', () => {
    for (const [kind, parts] of Object.entries(DECOR_MODELS)) {
      for (const p of parts ?? []) {
        const n = NATIVE[p.model];
        const yer = parcaYerlesim(p, p.model);
        const merkez = yer.x + ((n.minX + n.maxX) / 2) * p.olcek;
        expect(merkez, `${kind}/${p.model} merkez kayması`).toBeCloseTo(p.dx ?? 0, 6);
      }
    }
  });

  it('masa lambası konsolun TABLASINDA durur — havada da değil, gömülü de değil', () => {
    const lamba = DECOR_MODELS.konsol?.find((p) => p.model === 'lamp_table');
    expect(lamba).toBeDefined();
    expect(lamba?.dy).toBeCloseTo(KONSOL_TOP_Y, 6);
    // tabla = dolabın kendi üst yüzü, elle yazılmış bir sayı değil
    expect(KONSOL_TOP_Y).toBeCloseTo(NATIVE.cabinet_medium.maxY * DECOR_S, 6);
  });
});

describe('S5 — konsol yuvası: iki dolap yuvaya SIĞAR', () => {
  const YUVA = 3.0; // `config/decor.ts` konsol öğesinin `len`i

  it('dolapların birleşik eni yuvayı aşmaz ve yuvada ortalanır', () => {
    const k = turKutu('konsol')!;
    const dolaplar = DECOR_MODELS.konsol!.filter((p) => p.model.startsWith('cabinet'));
    let minX = Infinity;
    let maxX = -Infinity;
    for (const p of dolaplar) {
      const n = NATIVE[p.model];
      const yer = parcaYerlesim(p, p.model);
      minX = Math.min(minX, yer.x + n.minX * p.olcek);
      maxX = Math.max(maxX, yer.x + n.maxX * p.olcek);
    }
    expect(maxX - minX).toBeLessThanOrEqual(YUVA);
    // İki `cabinet_medium` (3,60) yuvayı aşardı — kolun neden bu olduğu burada kilitli.
    expect(maxX - minX).toBeGreaterThan(YUVA * 0.8);
    expect(k).toBeTruthy();
  });

  it('dolaplar üst üste binmez', () => {
    const dolaplar = DECOR_MODELS.konsol!.filter((p) => p.model.startsWith('cabinet'));
    const araliklar = dolaplar
      .map((p) => {
        const n = NATIVE[p.model];
        const yer = parcaYerlesim(p, p.model);
        return [yer.x + n.minX * p.olcek, yer.x + n.maxX * p.olcek] as const;
      })
      .sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < araliklar.length; i++)
      expect(araliklar[i][0], 'dolaplar çakışıyor').toBeGreaterThanOrEqual(araliklar[i - 1][1] - 1e-9);
  });
});

describe('S5 — duvar bandı: asılan hiçbir şey çıtaya inmez, duvarın tepesini aşmaz', () => {
  it('tablo ve kitaplık bandın İÇİNDE', () => {
    for (const d of decorItems(MAX_AREAS)) {
      const parts = DECOR_MODELS[d.kind];
      if (!parts) continue;
      // ÖLÇÜT ÖĞEDİR, parçanın sırtı değil: `sirt: 'duvar'` "sırtı duvara yaslı" demek
      // (konsol dolapları da öyle) — ama konsol ZEMİN öğesidir, bandı yoktur.
      if (d.pos[1] <= 0.05) continue;
      for (const p of parts) {
        const { alt, ust } = asmaKenar(p, p.model, d.pos[1]);
        expect(alt, `${d.kind}/${p.model} lambri çıtasının altına indi`).toBeGreaterThan(CITA_Y);
        expect(ust, `${d.kind}/${p.model} duvarın tepesini aştı`).toBeLessThan(WALL_H);
      }
    }
  });

  it('kitaplığın ÜSTÜ tablo bandına oturur — sağ duvar tek üst hizada okunur', () => {
    const raf = DECOR_MODELS.gazetelik![0];
    const { ust } = asmaKenar(raf, raf.model, MOUNT.mid);
    expect(ust).toBeCloseTo(MOUNT.mid, 6);
    expect(KITAPLIK_DY).toBeLessThan(0); // model AŞAĞI kayar, yukarı değil
  });
});

describe('S5 — AYAK İZİ: gövde kenarından açıklık (merkez bekçisinin kör noktası)', () => {
  /** Bir öğenin gövde KENARINDAN en yakın oyun eşiğine kalan açıklık (kutuyla, diskle değil). */
  function aciklik(d: { kind: DecorKind; pos: readonly [number, number, number]; rot: number }, areasOpen: number) {
    const tables = maxTablesFor(areasOpen);
    let en = Infinity;
    let nere = '';
    const bak = (hedef: readonly [number, number, number], esik: number, ad: string) => {
      const a = govdeMesafe(d.kind, d.pos, d.rot, hedef) - esik;
      if (a < en) {
        en = a;
        nere = ad;
      }
    };
    for (let i = 0; i < tables; i++) bak(LAYOUT.tables[i].upgradeSpot, TABLE_UP_RADIUS, `masa ${i}`);
    for (const [id, p] of Object.entries(LAYOUT.padPos)) bak(p, PAD_RADIUS, `pad ${id}`);
    bak(servicePlace(areasOpen).upgradeSpot, 1.2, 'servis');
    for (const s of tableSolids(tables)) bak(s.c, Math.hypot(s.h[0], s.h[1]), 'masa katısı');
    return { en, nere };
  }

  it('KayKit’e geçen hiçbir parça pad’in / yükseltme noktasının / masanın üstüne taşmaz', () => {
    // Ölçülen en dar açıklık 0,51 br (koridor saksısı ↔ zone2 pad kenarı) — `docs/dekor-raporu-s5.md` §B9.
    for (const areasOpen of [1, 2, MAX_AREAS]) {
      for (const d of decorItems(areasOpen)) {
        if (!turDunyaKutu(d.kind, d.rot)) continue; // elle çizili kalanlar eski bekçinin işi
        if (d.pos[1] > 0.05) continue; // duvara asılanları BANT testi denetler
        const { en, nere } = aciklik(d, areasOpen);
        expect(en, `${d.kind} [${d.pos[0]}, ${d.pos[2]}] → ${nere}`).toBeGreaterThan(0.3);
      }
    }
  });

  it('gövde kutusu DÖNÜŞE göre eksen değiştirir (yan duvarda uzun kenar z’dedir)', () => {
    const duz = turDunyaKutu('paspas', 0)!;
    const donuk = turDunyaKutu('paspas', Math.PI / 2)!;
    expect(duz.hx).toBeCloseTo(donuk.hz, 6);
    expect(duz.hz).toBeCloseTo(donuk.hx, 6);
    expect(duz.hx).toBeGreaterThan(duz.hz); // halı x’te uzun
  });

  it('yarıçap gövdenin GERÇEK kutusundan gelir — merkez noktası değil', () => {
    // Halı 2,70 × 1,80: yarıçapı 1,6'nın üstünde olmalı. Merkeze bakan bir bekçi 0 görürdü.
    expect(turYaricap('paspas')).toBeGreaterThan(1.6);
    // Konsol iki parçalı: yarıçap tek dolabınkinden büyük.
    const tekDolap = Math.hypot((NATIVE.cabinet_medium.w * DECOR_S) / 2, (NATIVE.cabinet_medium.maxZ - NATIVE.cabinet_medium.minZ) * DECOR_S);
    expect(turYaricap('konsol')).toBeGreaterThan(tekDolap * 0.9);
    // Modeli olmayan tür 0 döner (elle çizim eski bekçide kalır).
    expect(turYaricap('copKovasi')).toBe(0);
  });
});

describe('S5 — tek kaynak ve kullanıcı kararı', () => {
  it('KayKit’e geçen türler karar paketinde seçilenlerdir (fazlası da eksiği de hata)', () => {
    // S6/②: `denizlikSaksi` LİSTEDEN ÇIKTI — kullanıcı pencere denizliğini ve üstündeki
    // kaktüsü kaldırttı ("düz cam ve ışıklar yeter"). Denizlik yoksa saksı da yok.
    // 2026-09-10 karar paketi: kaktüs GEÇER · paspas mavi GEÇER · gazetelik kitaplığa GEÇER.
    // Çöp kovası ve TV ölçümle elendi; bu liste o kararların tek yazılı hâli.
    expect(Object.keys(DECOR_MODELS).sort()).toEqual(
      ['ayakliLamba', 'buyukSaksi', 'gazetelik', 'konsol', 'paspas', 'saksi', 'tablo'].sort(),
    );
    const gecmeyen: DecorKind[] = ['copKovasi', 'tvUnitesi', 'askilik', 'semsiyelik', 'petek', 'duvarSaati', 'aplik', 'askiRayi', 'pencere'];
    for (const k of gecmeyen) expect(DECOR_MODELS[k], `${k} ölçümle elenmişti`).toBeUndefined();
  });

  it('paspas MAVİ kol — kullanıcı turuncuyu değil maviyi seçti', () => {
    expect(DECOR_MODELS.paspas![0].model).toBe('rug_rectangle_B');
  });

  it('her modelin ham ölçüsü yazılı ve .gltf dosyası diskte', () => {
    for (const parts of Object.values(DECOR_MODELS)) {
      for (const p of parts ?? []) {
        expect(NATIVE[p.model], `${p.model} NATIVE'de yok`).toBeDefined();
        expect(existsSync(`${PAKET}${p.model}.gltf`), `${p.model}.gltf diskte yok`).toBe(true);
      }
    }
    // Varyantlar da diskte olmalı — çizimde `varyant()` onlara dallanıyor.
    for (const m of Object.keys(NATIVE) as DecorModel[])
      expect(existsSync(`${PAKET}${m}.gltf`), `${m}.gltf diskte yok`).toBe(true);
  });

  it('saksılar A/B dönüşümlü — dokuz saksı aynı modelin kopyası değil', () => {
    expect(varyant('cactus_small_A', 0)).toBe('cactus_small_A');
    expect(varyant('cactus_small_A', 1)).toBe('cactus_small_B');
    expect(varyant('cactus_medium_A', 1)).toBe('cactus_medium_B');
    // Varyantı olmayan model kendine döner (halı/lamba/dolap tek modeldir).
    expect(varyant('rug_rectangle_B', 1)).toBe('rug_rectangle_B');
    expect(varyant('cabinet_medium', 1)).toBe('cabinet_medium');
  });

  it('NATIVE sayıları modelin kendi gltf’inden — ölçüm raporundaki değerler', () => {
    // Bu beş sayı raporun §B2/§B3/§B4/§B6 tablolarının girdisi; biri elle değişirse rapor yalan olur.
    expect(NATIVE.lamp_standing.h).toBe(2.52);
    expect(NATIVE.cabinet_medium.w).toBe(2.0);
    expect(NATIVE.pictureframe_large_A.minY).toBe(-0.6);
    expect(NATIVE.rug_rectangle_B.w).toBe(3.0);
    expect(NATIVE.shelf_B_small_decorated.minZ).toBe(0); // duvar rafı olduğunun kanıtı
  });
});
