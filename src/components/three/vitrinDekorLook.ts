/**
 * vitrinDekorLook.ts — 💎 DEKORUN ÖLÇÜ KATMANI (F4c-2 · D-155).
 *
 * `decorLook.ts` ile aynı gerekçe: `VitrinDekor.tsx` R3F bileşeni vitest'te import edilemez, yani
 * orada yazılı bir ölçek bekçilenemez. Sayı burada durur, çizim buradan okur, bekçi burayı okur:
 * her ürünün ÇİZİLEN gövdesi (`govde`) kendi yuvasının kutusunun (`config/decor.ts`) içinde kalır —
 * yuva ölçülüp onaylandı, çizim ondan taşarsa ölçüm boşa gider.
 *
 * YEREL ÇERÇEVE: sırt duvarda (z = 0), yüz +z'ye bakar, taban y = 0 (asılı parçada asma tabanı).
 * Ham kutular `node tools/model-olc.mjs <paket> <model>` çıktısı, BİREBİR.
 */
import { DECOR_S, LAMBA_YER_S, NATIVE } from './decorLook';

export const FURNITURE = '/assets/models/kaykit-furniture-bits/';
export const HOLIDAY = '/assets/models/kaykit-holiday-bits/';

/** Ham kutu (model-olc). `decorLook.NATIVE`te olmayan dört model. */
export const VITRIN_NATIVE = {
  armchair: { minX: -0.9, maxX: 0.9, maxY: 1.224, minZ: -0.75, maxZ: 0.85 },
  table_small: { minX: -0.5, maxX: 0.5, maxY: 1.0, minZ: -0.5, maxZ: 0.5 },
  chair_large: { minX: -0.915, maxX: 0.915, maxY: 2.137, minZ: -0.974, maxZ: 0.641 },
  carpet_round_small: { minX: -1.0, maxX: 1.0, maxY: 0.05, minZ: -1.0, maxZ: 1.0 },
} as const;

/**
 * Ölçekler — insan oranından (`feedback_reference_scale_trap`: aktör 1,75). Paketin 0,90'ı
 * koltuğu 1,62 × 1,44 yapıyor (kanepe boyu) → 0,70: 1,26 geniş, sırt 0,86. Yılbaşı koltuğu
 * ham 2,14 yüksek (sırtı insandan uzun) → 0,50: 1,07. Halı 2,0 → 0,70: 1,4 çap, koltuğun önüne.
 */
export const KOLTUK_S = 0.7;
export const YILBASI_S = 0.5;
export const HALI_S = 0.7;
export const MASA_S = DECOR_S;

/** Sırtı z = 0'a getiren kayma (origin model ortasında; sırt `minZ`de). */
const sirtZ = (minZ: number, s: number) => -minZ * s;

export const MASA_UST = VITRIN_NATIVE.table_small.maxY * MASA_S;
export const DOLAP_UST = NATIVE.cabinet_small.maxY * DECOR_S;

/** Yerel gövde kutusu (çizilen her şeyi kapsar). */
export interface Govde {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY: number;
}

const masaGovde = (ustY: number): Govde => ({
  minX: VITRIN_NATIVE.table_small.minX * MASA_S,
  maxX: VITRIN_NATIVE.table_small.maxX * MASA_S,
  minZ: 0,
  maxZ: (VITRIN_NATIVE.table_small.maxZ - VITRIN_NATIVE.table_small.minZ) * MASA_S,
  maxY: ustY,
});

/** İlkel parçaların ölçüleri (çizim ve gövde aynı sayıyı okur). */
export const RADYO = { w: 0.5, h: 0.32, d: 0.24 } as const;
export const SEMAVER = { h: 0.49 } as const;
export const GRAMOFON = { kutu: 0.36, kutuH: 0.14, boruTepe: 0.65 } as const;
export const KANARYA = { direk: 1.4, kafesY: 1.45, kafesR: 0.18, tepe: 1.82, tabanR: 0.22 } as const;
export const TABLO = { w: 1.1, h: 0.75, d: 0.05 } as const;
export const SAAT = { w: 0.42, h: 1.1, d: 0.16 } as const;

export const YERLESIM = {
  radyo: { dolapZ: sirtZ(NATIVE.cabinet_small.minZ, DECOR_S) },
  koltuk: { z: sirtZ(VITRIN_NATIVE.armchair.minZ, KOLTUK_S) },
  lamba: { z: sirtZ(NATIVE.lamp_standing.minZ, LAMBA_YER_S) },
  masa: { z: sirtZ(VITRIN_NATIVE.table_small.minZ, MASA_S) },
  yilbasi: {
    koltukZ: sirtZ(VITRIN_NATIVE.chair_large.minZ, YILBASI_S),
    haliZ: -VITRIN_NATIVE.carpet_round_small.minZ * HALI_S + 0.05,
  },
} as const;

/** Yuva → çizilen gövde. Bekçi: gövde ⊆ yuva kutusu. */
export const GOVDE: Record<string, Govde> = {
  radyo: {
    minX: NATIVE.cabinet_small.minX * DECOR_S,
    maxX: NATIVE.cabinet_small.maxX * DECOR_S,
    minZ: 0,
    maxZ: (NATIVE.cabinet_small.maxZ - NATIVE.cabinet_small.minZ) * DECOR_S,
    maxY: DOLAP_UST + RADYO.h,
  },
  koltuk: {
    minX: VITRIN_NATIVE.armchair.minX * KOLTUK_S,
    maxX: VITRIN_NATIVE.armchair.maxX * KOLTUK_S,
    minZ: 0,
    maxZ: (VITRIN_NATIVE.armchair.maxZ - VITRIN_NATIVE.armchair.minZ) * KOLTUK_S,
    maxY: VITRIN_NATIVE.armchair.maxY * KOLTUK_S,
  },
  lamba: {
    minX: NATIVE.lamp_standing.minX * LAMBA_YER_S,
    maxX: NATIVE.lamp_standing.maxX * LAMBA_YER_S,
    minZ: 0,
    maxZ: (NATIVE.lamp_standing.maxZ - NATIVE.lamp_standing.minZ) * LAMBA_YER_S,
    maxY: NATIVE.lamp_standing.maxY * LAMBA_YER_S,
  },
  tablo: { minX: -TABLO.w / 2, maxX: TABLO.w / 2, minZ: 0, maxZ: TABLO.d, maxY: TABLO.h },
  semaver: masaGovde(MASA_UST + SEMAVER.h),
  gramofon: masaGovde(MASA_UST + GRAMOFON.boruTepe),
  kanarya: { minX: -KANARYA.tabanR, maxX: KANARYA.tabanR, minZ: 0, maxZ: 2 * KANARYA.tabanR, maxY: KANARYA.tepe },
  saat: { minX: -SAAT.w / 2, maxX: SAAT.w / 2, minZ: 0, maxZ: SAAT.d, maxY: SAAT.h },
  yilbasi: {
    minX: -VITRIN_NATIVE.carpet_round_small.maxX * HALI_S,
    maxX: VITRIN_NATIVE.carpet_round_small.maxX * HALI_S,
    minZ: 0,
    maxZ: Math.max(
      (VITRIN_NATIVE.chair_large.maxZ - VITRIN_NATIVE.chair_large.minZ) * YILBASI_S,
      -VITRIN_NATIVE.carpet_round_small.minZ * HALI_S + 0.05 + VITRIN_NATIVE.carpet_round_small.maxZ * HALI_S,
    ),
    maxY: VITRIN_NATIVE.chair_large.maxY * YILBASI_S,
  },
};

/** Yılbaşı koltuğunun rengi → paketin model adı. */
export const YILBASI_MODEL: Record<string, string> = {
  'yilbasi-kirmizi': 'chair_large_red',
  'yilbasi-yesil': 'chair_large_green',
  'yilbasi-mavi': 'chair_large_blue',
  'yilbasi-kahve': 'chair_large_brown',
};
