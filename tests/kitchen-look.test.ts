import { describe, it, expect } from 'vitest';
import {
  KITCHEN_UNITS,
  KITCHEN_S,
  COUNTER_TOP_Y,
  WALL_UNIT_BOTTOM_Y,
  WALL_UNIT_Y,
  MODULE_W,
  NATIVE,
  BACK_Z,
  LEFT_X,
  RIGHT_X,
  FRONT_Z,
  FRONT_TOP_Y,
  kayGovde,
  unitBox,
  modulX,
  type KitchenUnit,
} from '../src/components/three/kitchenLook';
import { TABLE_TOP_Y } from '../src/components/three/tableLook';
import { WALL_H } from '../src/components/three/wallPanel';

/**
 * S3 BEKÇİSİ — mutfak KayKit'e geçerken kırılabilecek şey ÖLÇÜ ve YERdir, mantık değil.
 * 3D sahne görsel olarak doğrulanamıyor (CLAUDE.md), o yüzden odanın geometrisi burada sınanır:
 * hiçbir ünite odadan taşmaz, hiçbiri diğerinin ayak izine girmez, duvara asılanlar tezgâhın
 * üstünde durur. Bu üç şeyden biri bozulursa mutfak sahnede "içine geçmiş" görünür.
 */

const EPS = 1e-6;
const kesisiyor = (a: ReturnType<typeof unitBox>, b: ReturnType<typeof unitBox>): boolean =>
  a.minX < b.maxX - EPS && b.minX < a.maxX - EPS && a.minZ < b.maxZ - EPS && b.minZ < a.maxZ - EPS;

const ad = (u: KitchenUnit): string => `${u.key}@(${u.x.toFixed(2)}, ${u.z.toFixed(2)})`;

describe('kitchenLook — odanın sınırları', () => {
  it('hiçbir ünite servis bloğundan taşmaz', () => {
    for (const u of KITCHEN_UNITS) {
      const b = unitBox(u);
      expect(b.minX, `${ad(u)} sol duvarı deliyor`).toBeGreaterThanOrEqual(LEFT_X - EPS);
      expect(b.maxX).toBeLessThanOrEqual(RIGHT_X + EPS);
      expect(b.minZ).toBeGreaterThanOrEqual(BACK_Z - EPS);
      expect(b.maxZ).toBeLessThanOrEqual(FRONT_Z + EPS);
    }
  });

  it('ön sınır servis tezgâhının arka yüzünden türer (elle yazılmaz)', () => {
    // PLACE_BACK_BAND: station z = −10,3 · half[1] = 0,5 → arka yüz −10,8.
    expect(FRONT_Z).toBeCloseTo(-10.8, 6);
    expect(FRONT_Z).toBeGreaterThan(BACK_Z);
  });
});

describe('kitchenLook — çakışma', () => {
  it('zemin üniteleri birbirinin ayak izine girmez', () => {
    const zemin = KITCHEN_UNITS.filter((u) => u.kat === 'zemin');
    for (let i = 0; i < zemin.length; i++)
      for (let j = i + 1; j < zemin.length; j++) {
        const a = unitBox(zemin[i]);
        const b = unitBox(zemin[j]);
        expect(kesisiyor(a, b), `${ad(zemin[i])} ile ${ad(zemin[j])} çakışıyor`).toBe(false);
      }
  });

  it('arka duvar hattı gerçekten duvara yaslanır (her modülün sırtı BACK_Z)', () => {
    const hat = KITCHEN_UNITS.filter((u) => u.kat === 'zemin' && unitBox(u).minZ < BACK_Z + 0.01);
    expect(hat.length).toBe(7);
    for (const u of hat) expect(unitBox(u).minZ).toBeCloseTo(BACK_Z, 6);
  });

  it('modüller tek ızgarada, boşluksuz ve bindirmesiz ilerler', () => {
    expect(MODULE_W).toBeCloseTo(1.8, 6);
    for (let k = 1; k < 7; k++) expect(modulX(k) - modulX(k - 1)).toBeCloseTo(MODULE_W, 6);
    // Son modülün doğu kenarı merdiven kovasının duvarını geçmez.
    expect(modulX(6) + MODULE_W / 2).toBeLessThanOrEqual(RIGHT_X + EPS);
  });
});

describe('kitchenLook — düşey ankraj', () => {
  it('tezgâh üstü 0,90 ve masa üstünden yüksek', () => {
    expect(COUNTER_TOP_Y).toBeCloseTo(0.9, 6);
    expect(COUNTER_TOP_Y).toBeGreaterThan(TABLE_TOP_Y);
  });

  it('duvar ünitesinin tepesi tam duvarın tepesine oturur', () => {
    for (const u of KITCHEN_UNITS.filter((x) => x.kat === 'duvar')) {
      expect(unitBox(u).maxY).toBeCloseTo(WALL_H, 6);
    }
    expect(WALL_UNIT_Y).toBeCloseTo(WALL_H - 3.6, 6);
  });

  it('duvar ünitesi tezgâhın üstünde durur (çalışma payı ≥ 0,45)', () => {
    expect(WALL_UNIT_BOTTOM_Y - COUNTER_TOP_Y).toBeGreaterThanOrEqual(0.45);
    for (const u of KITCHEN_UNITS.filter((x) => x.kat === 'duvar')) {
      expect(unitBox(u).minY).toBeGreaterThanOrEqual(COUNTER_TOP_Y + 0.45);
    }
  });

  it('tezgâh üstü eşyalar altındaki modülün ayak izinin içinde kalır', () => {
    for (const u of KITCHEN_UNITS.filter((x) => x.kat === 'tezgah')) {
      const b = unitBox(u);
      const altinda = KITCHEN_UNITS.filter((z) => z.kat === 'zemin').some((z) => {
        const a = unitBox(z);
        return b.minX >= a.minX - EPS && b.maxX <= a.maxX + EPS && b.minZ >= a.minZ - EPS && b.maxZ <= a.maxZ + EPS;
      });
      expect(altinda, `${ad(u)} boşlukta duruyor`).toBe(true);
    }
  });
});

describe('kitchenLook — paket ölçeği', () => {
  it('KayKit ölçeği tabure hattıyla aynı sayıdır (tek stil kilidi)', () => {
    expect(KITCHEN_S).toBe(0.9);
  });

  it('ham ölçüler modelin kendi gltf sayılarıdır (model-olc.mjs çıktısı)', () => {
    // İki kaçak sayı yeter: modül eni ve duvar ünitesinin ham boyu. Biri değişirse
    // yukarıdaki ızgara ve üst-hiza ankrajı sessizce kayar.
    expect(NATIVE.kitchencounter_straight_A_backsplash.w).toBe(2);
    expect(NATIVE.kitchencabinet.minY + NATIVE.kitchencabinet.h).toBe(4);
  });
});

describe('kitchenLook — ön hat (oyunun işleyen tezgâhları)', () => {
  /** `kayGovde` çıktısını dünya AABB'sine çevirir (Model: önce ölçek, sonra dönüş, sonra konum). */
  const govdeKutu = (key: Parameters<typeof kayGovde>[0], w: number, d: number, topY: number, yon?: 'mutfak' | 'salon') => {
    const t = kayGovde(key, w, d, topY, yon);
    const n = NATIVE[key];
    const ters = Math.abs(t.rotation[1]) > 1e-9;
    const z0 = n.minZ * t.scale[2];
    const z1 = n.maxZ * t.scale[2];
    const [a, b] = ters ? [-z1, -z0] : [z0, z1];
    return {
      w: n.w * t.scale[0],
      minZ: t.position[2] + a,
      maxZ: t.position[2] + b,
      topY: 1.0 * t.scale[1],
    };
  };

  it('gövde tam istenen kutuya oturur (en · derinlik · tabla üstü)', () => {
    for (const [w, d] of [[2.2, 0.8], [2.6, 1.0], [1.4, 0.8]] as const) {
      const k = govdeKutu('kitchencounter_straight_A', w, d, FRONT_TOP_Y);
      expect(k.w).toBeCloseTo(w, 6);
      expect(k.maxZ - k.minZ).toBeCloseTo(d, 6);
      expect(k.topY).toBeCloseTo(FRONT_TOP_Y, 6);
    }
  });

  it('gövde collision kutusunda ORTALIDIR (modelin asimetrik z aralığı telafi edilir)', () => {
    // Model z ∈ [−1,000 → +1,042]: telafi edilmezse gövde kutunun önüne kayar.
    for (const yon of ['mutfak', 'salon'] as const) {
      const k = govdeKutu('kitchencounter_straight_A', 2.2, 0.8, FRONT_TOP_Y, yon);
      expect(k.minZ + k.maxZ).toBeCloseTo(0, 6);
    }
  });

  it('ön hattın çekmeceleri MUTFAĞA bakar (varsayılan yön)', () => {
    // Kullanıcı 2026-09-09: dolap personelin durduğu yüzde açılır.
    expect(kayGovde('kitchencounter_straight_A', 2.2, 0.8, FRONT_TOP_Y).rotation[1]).toBeCloseTo(Math.PI, 6);
    expect(kayGovde('kitchencounter_straight_A', 2.2, 0.8, FRONT_TOP_Y, 'salon').rotation[1]).toBe(0);
  });

  it('ön hattın tabla üstü arka hatla aynı sayıdır', () => {
    expect(FRONT_TOP_Y).toBe(COUNTER_TOP_Y);
  });
});
