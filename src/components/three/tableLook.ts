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
// BM adım 2 (D-073) — ÖLÇÜLER MAKET v13'TEN. Kullanıcı: *"masaların boyutları arasında çok ciddi
// fark var, o boyut oranları da uygulansın"*. Makette iki mobilya dili var ve aralarındaki fark
// büyük: ön çeyreğin dörtlü ÇAY masası `teaTable` **1,75 × 1,75 @ y 0,75**, şeridin ikili kafe
// masası `cafeTable2` **1,00 × 1,00 @ y 0,75**. Oyun ikisini de ~0,9'a indirmişti (fark kayboldu).
// Maket BİTMİŞ HÂLDİR (D-070): en üst kademe maketin ölçüsüdür, alt kademe ondan geriye türer.
const TEA_TABLE_S: Vec3 = [1.1, 0.75, 1.1]; // table_small (native 1) → 1,10 tabla · L0-L2
const TEA_TABLE_M: Vec3 = [0.875, 0.75, 0.875]; // table_medium (native 2) → **1,75** · dörtlü L3+
// table_medium_long — İKİLİNİN L3+ hâli: bistro masası, banka PARALEL uzar (0,99 × 0,70);
// maketin `cafeTable2`'si 1,00 kare, uzun kenar birebir tutuyor. Native 3 × 1 × 2 → x 0,33 · z 0,35.
const TEA_TABLE_L: Vec3 = [0.33, 0.75, 0.35];

// Örtü (tabla ÜSTÜ) plakası. { y: üst yüzey, hx/hz: yarı-genişlik }. Maket örtüsü tablanın
// %92,6'sı (1,62 / 1,75) — oran her kademede korunur.
const TEA_CLOTH_S = { y: 0.75, hx: 0.51, hz: 0.51 };
const TEA_CLOTH_M = { y: 0.75, hx: 0.81, hz: 0.81 };
const TEA_CLOTH_L = { y: 0.75, hx: 0.46, hz: 0.32 };

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
