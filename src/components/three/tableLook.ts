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
const TEA_TABLE_S: Vec3 = [1.1, 0.75, 1.1]; // table_small (native 1) → 1,10 tabla · DÖRTLÜ L0-L2
const TEA_TABLE_M: Vec3 = [0.875, 0.75, 0.875]; // table_medium (native 2) → **1,75** · dörtlü L3+

// İKİLİ MASA — KARE (kullanıcı 2026-09-07): *"banketlerin masaları ideal boyda olsun ama KARE
// olsun; küçük dememin sebebi dikdörtgen olmasıydı, diğer tek masalar kadar büyük olmasın"*.
// Önceki hâli `table_medium_long`du (0,99 × 0,70): bistro mantığı doğruydu ama dikdörtgen tabla
// 1,75'lik dörtlünün yanında hem küçük hem çarpık okundu. İkili artık dörtlüyle AYNI asseti
// (kare `table_small`) kullanır, yalnız daha küçük kalır — tip farkını tabla ORANI değil BOYU söyler.
// Kademeler: L0-L2 **1,00** (maketin `cafeTable2`'si birebir) → L3+ **1,20**.
// Üst sınırı BANKET geometrisi veriyor: adanın görsel yarı-derinliği 1,25 ve masa merkezi ondan
// 1,85'te; tabla yarısı 0,60'ı geçerse tabla adanın oturağının ÜSTÜNE biner (layout-b32 bekçisi).
// 1,20 hem o sınırda durur hem oranı tutar (dörtlü 1,75'i dört kişiye verir; ikiye düşen ≈ 1,24).
const DEUCE_TABLE_S: Vec3 = [1.0, 0.75, 1.0];
const DEUCE_TABLE_L: Vec3 = [1.2, 0.75, 1.2];

// Örtü (tabla ÜSTÜ) plakası. { y: üst yüzey, hx/hz: yarı-genişlik }. Maket örtüsü tablanın
// %92,6'sı (1,62 / 1,75) — oran her kademede korunur.
const TEA_CLOTH_S = { y: 0.75, hx: 0.51, hz: 0.51 };
const TEA_CLOTH_M = { y: 0.75, hx: 0.81, hz: 0.81 };
const DEUCE_CLOTH_S = { y: 0.75, hx: 0.463, hz: 0.463 };
const DEUCE_CLOTH_L = { y: 0.75, hx: 0.556, hz: 0.556 };

export interface TableLook {
  key: 'table_small' | 'table_medium' | 'table_medium_long';
  scale: Vec3;
  cloth: { y: number; hx: number; hz: number };
}

/**
 * Sv4 (L3) basamağı "masa BÜYÜR": iki tipte de tabla büyür, ikisi de KARE kalır. İkili masa
 * hiçbir seviyede dörtlünün tablasını (1,75 = dört kişilik okuması) almaz — fark boyda durur:
 * 1,00 → 1,20 ↔ 1,10 → 1,75. Böylece L3 iki tipte de gözle görülür TEK bir değişim (D-019).
 */
export function tableLook(kind: TableKind, level: number): TableLook {
  if (kind === 'deuce') {
    return level < 3
      ? { key: 'table_small', scale: DEUCE_TABLE_S, cloth: DEUCE_CLOTH_S }
      : { key: 'table_small', scale: DEUCE_TABLE_L, cloth: DEUCE_CLOTH_L };
  }
  return level < 3
    ? { key: 'table_small', scale: TEA_TABLE_S, cloth: TEA_CLOTH_S }
    : { key: 'table_medium', scale: TEA_TABLE_M, cloth: TEA_CLOTH_M };
}
