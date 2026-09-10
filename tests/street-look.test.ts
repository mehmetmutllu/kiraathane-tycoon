import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ASFALT,
  CITY_NATIVE,
  CITY_S,
  GORUNUR_Z_SON,
  KALDIRIM,
  KORIDOR_YARIM,
  KORIDOR_Z,
  STREET_PROPS,
  STREET_Z0,
  TENTE,
  cityBoyut,
  koridoruKesiyor,
  propCakisiyor,
  propKutu,
  propX,
  tenteOnY,
  tenteYuzY,
  type StreetModel,
} from '../src/components/three/streetLook';
import { DOOR } from '../src/components/three/wallPanel';
import { ACTOR_HEIGHT, PLAYER_RADIUS } from '../src/config/actor';
import { CAMERA_DIST } from '../src/config/camera';
import { FLOOR_HALF, LAYOUT, doorX, entranceAt, streetAt } from '../src/game/layout';

/** Kapının iki konumu — 1 alan açıkken −8,5, 2+ alan açıkken 0 (DOOR_MOVES_AT). */
const KAPILAR = [doorX(1), doorX(2)];

describe('streetLook — ölçek ve ankraj', () => {
  it('şerit sayıları LAYOUT\'tan sapmaz (Scene ile tek kaynak)', () => {
    expect(STREET_Z0).toBeCloseTo(LAYOUT.area.maxZ + 0.5, 6);
    expect(KALDIRIM.z).toBeCloseTo(STREET_Z0 + 1.2, 6);
    expect(ASFALT.z).toBeCloseTo(STREET_Z0 + 5.5, 6);
  });

  it('CITY_S paketin gerçek ölçüsünü tutturur (bench 1,50 m · streetlight 4,0 m)', () => {
    // Ölçek ORTANCA'dan türedi; her modelde birebir değil ama %15 bandında olmalı — bu banttan
    // çıkarsa `docs/dis-cephe-raporu-s6.md` §A yeniden ölçülmüş demektir.
    expect(cityBoyut('bench').w).toBeGreaterThan(1.5 * 0.85);
    expect(cityBoyut('bench').w).toBeLessThan(1.5 * 1.15);
    expect(cityBoyut('streetlight').h).toBeGreaterThan(4.0 * 0.85);
    expect(cityBoyut('streetlight').h).toBeLessThan(4.0 * 1.15);
  });

  it('mutfağın/dekorun 0,90 ölçeği bu pakete UYGULANMAZ (kontrol kolu elendi)', () => {
    // 0,90'da bank 0,36 br olur — 1,75'lik insanın dizine gelmeyen bir oyuncak. Ölçek bu yüzden
    // 3'ün üstünde; sayı 1'e yaklaşırsa biri paketin karosunu oda karosu sanmış demektir.
    expect(CITY_S).toBeGreaterThan(3);
    expect(CITY_NATIVE.bench.w * 0.9).toBeLessThan(0.5);
  });

  it('streetlight origin\'i bbox\'ın ortasında DEĞİL — kolu −x\'e uzanıyor', () => {
    // S4 "sucuk" dersi: telafi tahminle yazılmaz. Bu asimetri bilinerek taşınıyor; simetrik
    // olduğu varsayılırsa direk kaldırımın dışına düşer.
    const n = CITY_NATIVE.streetlight;
    expect(Math.abs(n.minX)).toBeGreaterThan(Math.abs(n.maxX) * 2);
  });

  it('her modelin ham kutusu dosyada duran .gltf ile eşleşen bir ada sahip', () => {
    for (const m of Object.keys(CITY_NATIVE) as StreetModel[])
      expect(existsSync(`public/assets/models/kaykit-city-builder-bits/${m}.gltf`)).toBe(true);
  });
});

describe('streetLook — yerleşim bekçisi', () => {
  it('hiçbir parça müşteri koridorunu KESMEZ (iki kapı konumunda da)', () => {
    for (const dx of KAPILAR)
      for (const p of STREET_PROPS)
        expect({ model: p.model, dx, kesiyor: koridoruKesiyor(p, dx) }).toEqual({
          model: p.model,
          dx,
          kesiyor: false,
        });
  });

  it('koridor gerçekten müşterinin yürüdüğü hat (streetAt → entranceAt)', () => {
    for (const dx of KAPILAR) {
      const s = streetAt(dx === doorX(1) ? 1 : 2);
      const g = entranceAt(dx === doorX(1) ? 1 : 2);
      expect(KORIDOR_Z.min).toBeLessThanOrEqual(g[2]);
      expect(KORIDOR_Z.max).toBeGreaterThanOrEqual(s[2]);
      expect(KORIDOR_YARIM).toBeCloseTo(PLAYER_RADIUS * 2, 6);
    }
  });

  it('hiçbir parça GÖRÜNMEYEN şeride konmaz (ölçüm: z > ~20,5\'te kadraj %0)', () => {
    for (const p of STREET_PROPS) {
      const k = propKutu(p, doorX(1));
      expect({ model: p.model, minZ: k.minZ <= GORUNUR_Z_SON }).toEqual({ model: p.model, minZ: true });
    }
    // Sınır kameranın kendi aritmetiğinden gelir: oyuncunun z tavanı + takip mesafesi.
    expect(GORUNUR_Z_SON).toBeLessThan(FLOOR_HALF + CAMERA_DIST);
  });

  it('hiçbir parça salonun İÇİNE taşmaz (ön duvarın önünde kalır)', () => {
    for (const dx of KAPILAR)
      for (const p of STREET_PROPS) {
        const k = propKutu(p, dx);
        expect({ model: p.model, disarida: k.minZ >= STREET_Z0 - 0.01 }).toEqual({
          model: p.model,
          disarida: true,
        });
      }
  });

  it('elle çizilen bahçe masaları ve saksılarla ÇAKIŞMAZ', () => {
    // Bahçe masası kapı ∓2,30 @ z 18,65 (çap 0,72) · saksı kapı ∓1,70 @ z 17,92 (çap 0,32).
    const elle = [
      { dx: -2.3, z: STREET_Z0 + 1.15, r: 0.36 },
      { dx: 2.3, z: STREET_Z0 + 1.15, r: 0.36 },
      { dx: -1.7, z: STREET_Z0 + 0.42, r: 0.16 },
      { dx: 1.7, z: STREET_Z0 + 0.42, r: 0.16 },
    ];
    for (const dx of KAPILAR)
      for (const p of STREET_PROPS) {
        const k = propKutu(p, dx);
        for (const e of elle) {
          const ex = dx + e.dx;
          const carpisma =
            k.maxX > ex - e.r && k.minX < ex + e.r && k.maxZ > e.z - e.r && k.minZ < e.z + e.r;
          expect({ model: p.model, carpisma }).toEqual({ model: p.model, carpisma: false });
        }
      }
  });

  it('hiçbir parça BİRBİRİYLE çakışmaz (iki kapı konumunda da)', () => {
    for (const dx of KAPILAR)
      for (let i = 0; i < STREET_PROPS.length; i++)
        for (let j = i + 1; j < STREET_PROPS.length; j++) {
          const a = STREET_PROPS[i];
          const b = STREET_PROPS[j];
          expect({ a: a.model, b: b.model, dx, cakisma: propCakisiyor(a, b, dx) }).toEqual({
            a: a.model,
            b: b.model,
            dx,
            cakisma: false,
          });
        }
  });

  it("propKutu modelin KAYIK origin'ini hesaba katar (streetlight kolu −x'te)", () => {
    // Simetrik varsayılırsa kutu 0,49 br yanlış yere düşer ve çakışmalar görünmez olur.
    const k = propKutu({ model: 'streetlight', ref: 'kat', x: 0, z: 19.5 }, 0);
    expect(Math.abs(k.minX)).toBeGreaterThan(Math.abs(k.maxX) * 2);
  });

  it('propKutu dönüşü hesaba katar (π/2\'de en ↔ derinlik yer değiştirir)', () => {
    const duz = propKutu({ model: 'car_taxi', ref: 'kat', x: 0, z: 21 }, 0);
    const donuk = propKutu({ model: 'car_taxi', ref: 'kat', x: 0, z: 21, rot: Math.PI / 2 }, 0);
    expect(duz.maxX - duz.minX).toBeCloseTo(donuk.maxZ - donuk.minZ, 6);
    expect(duz.maxZ - duz.minZ).toBeCloseTo(donuk.maxX - donuk.minX, 6);
    // Taksi yola PARALEL durmalı: dönükken x'te uzun, z'de kısa.
    expect(donuk.maxX - donuk.minX).toBeGreaterThan(donuk.maxZ - donuk.minZ);
  });

  it('propX kapıya bağlı parçaları kapıyla taşır, kata bağlı olanları taşımaz', () => {
    const kapi = { model: 'bench' as const, ref: 'kapi' as const, x: -5.4, z: 18.9 };
    const kat = { model: 'bench' as const, ref: 'kat' as const, x: -5.4, z: 18.9 };
    expect(propX(kapi, doorX(2)) - propX(kapi, doorX(1))).toBeCloseTo(doorX(2) - doorX(1), 6);
    expect(propX(kat, doorX(2))).toBeCloseTo(propX(kat, doorX(1)), 6);
  });

  it('kapıya bağlı parçalar KAPININ İKİ YANINA dengeli dağılmış', () => {
    const kapiya = STREET_PROPS.filter((p) => p.ref === 'kapi');
    expect(kapiya.filter((p) => p.x < 0).length).toBe(kapiya.filter((p) => p.x > 0).length);
  });
});

describe('streetLook — tente (F1, kullanıcı kararı)', () => {
  it('maket v13\'ün sayıları BİREBİR taşınmış', () => {
    expect(TENTE.w).toBe(6.4);
    expect(TENTE.h).toBe(0.18);
    expect(TENTE.d).toBe(1.9);
    expect(TENTE.z).toBe(17.9);
    expect(TENTE.rotX).toBe(0.18);
    expect(TENTE.y).toBeCloseTo(DOOR.height - 0.08, 6);
  });

  it('maketin KENDİ kuralı tutuyor: tente duvar yüzünde LENTO hizasında çıkar', () => {
    // Bu, tentenin bbox arka kenarına (2,74) bakınca YANLIŞ görünen ama duvar yüzünde (z 17,50)
    // ölçülünce doğru çıkan sayı. Arka kenar duvarın İÇİNDE kalıyor.
    expect(tenteYuzY()).toBeGreaterThan(DOOR.height - 0.1);
    expect(tenteYuzY()).toBeLessThan(DOOR.height + 0.1);
  });

  it('tentenin altından 1,75\'lik biri geçebiliyor', () => {
    expect(tenteOnY() - ACTOR_HEIGHT).toBeGreaterThan(0.3);
  });

  it('tente kapı boşluğunu iki yandan taşıyor (söveler dahil örtüyor)', () => {
    expect(TENTE.w).toBeGreaterThan(DOOR.half * 2 + 0.6);
  });
});
