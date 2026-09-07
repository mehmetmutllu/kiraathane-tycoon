/**
 * tableLook.ts — MASANIN O SEVİYEDEKİ GÖRÜNÜŞÜ (asset + ölçek + örtü plakası).
 *
 * `Tables.tsx`'ten AYRI bir dosya, çünkü iki çizim hattı da (greybox `Table` bileşeni ve
 * instancing `buildFurniture`) buradan okumak zorunda ve bu eşleme React'e ya da tarayıcı
 * API'lerine hiç bağlı değil — böylece vitest'te doğrudan sınanabilir (Tables.tsx `recolor`
 * üzerinden `Image`'a bağlı, node ortamında import edilemez).
 */
import type { Vec3 } from '../../game/types';
import type { TableKind } from '../../config/economy.config';

// KayKit Furniture Bits (CC0) native boyutlar (origin tabanda, üst ~y=1.0):
// table_small 1×1×1 · table_medium 2×1×2 · table_medium_long 3×1×2.
const TEA_TABLE_S: Vec3 = [0.66, 0.5, 0.66]; // table_small (L0-L2, iki tipte de aynı)
const TEA_TABLE_M: Vec3 = [0.45, 0.55, 0.45]; // table_medium — DÖRTLÜ masanın L3+ hâli (0,9 × 0,9)
// table_medium_long — İKİLİNİN L3+ hâli: bistro masası, banka PARALEL uzar (0,99 × 0,70).
// Native 3 × 1 × 2 → x 0,33 · z 0,35. Genişliği `LAYOUT.tableHalf` (0,5) içinde kalır.
const TEA_TABLE_L: Vec3 = [0.33, 0.55, 0.35];

// Örtü (tabla ÜSTÜ) plakası. { y: üst yüzey, hx/hz: yarı-genişlik }.
const TEA_CLOTH_S = { y: 0.5, hx: 0.26, hz: 0.26 };
const TEA_CLOTH_M = { y: 0.55, hx: 0.4, hz: 0.4 };
const TEA_CLOTH_L = { y: 0.55, hx: 0.42, hz: 0.26 };

export interface TableLook {
  key: 'table_small' | 'table_medium' | 'table_medium_long';
  scale: Vec3;
  cloth: { y: number; hx: number; hz: number };
}

/**
 * Sv4 (L3) basamağı "masa BÜYÜR" idi ve dörtlü masa için doğruydu: iki koltuk dörde çıkarken
 * tabla da büyür. Banket ikilisi dört kişilik OLMAZ (sırtında ada, karşısında tek sandalye var) —
 * o basamakta büyüyecek şeyi kaybetmesin diye tabla KARE'den BİSTROYA döner: banka paralel uzar,
 * derinliği azalır. İki tipte de L3 gözle görülür TEK bir değişimdir (D-019 okunabilirlik), ama
 * ikili masa hiçbir seviyede dört sandalye taşıyormuş gibi görünmez.
 */
export function tableLook(kind: TableKind, level: number): TableLook {
  if (level < 3) return { key: 'table_small', scale: TEA_TABLE_S, cloth: TEA_CLOTH_S };
  return kind === 'deuce'
    ? { key: 'table_medium_long', scale: TEA_TABLE_L, cloth: TEA_CLOTH_L }
    : { key: 'table_medium', scale: TEA_TABLE_M, cloth: TEA_CLOTH_M };
}
