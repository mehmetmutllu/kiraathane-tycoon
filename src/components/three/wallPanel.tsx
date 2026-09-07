import { useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, Color, MeshStandardMaterial, Object3D, type InstancedMesh } from 'three';
import type { WallTheme } from '../../config/palette';

/**
 * wallPanel.tsx — DUVAR, **maket v13'ün `wall()` fonksiyonunun transkripsiyonu** (BM · D-070).
 *
 * Kullanıcı 2026-09-07: *"duvarlar maketteki gibi değil … duvar birleşimleri hiçbir şey ora gibi
 * değil"*. Ölçüm doğruladı — oyunun duvarı maketin küçültülmüşü değil, BAŞKA bir duvardı:
 *
 * | | maket v13 | oyun (G3) |
 * |---|---|---|
 * | yükseklik | **3,20** | 1,20 |
 * | lambri | **0,90** | 0,50 |
 * | katman | gövde 0,18 · lambri 0,22 · çıta 0,26 | gövde + lambri + süpürgelik + çıta + kartonpiyer |
 * | çıtanın rengi | **KOYU** (doorWood) | AÇIK (trim) |
 *
 * G3 (2026-09-06) duvara süpürgelik + kartonpiyer eklemişti; gerekçesi "kutu hiçbir yerde
 * bitmiyor"du ve o teşhis 1,2'lik KESİK duvar için doğruydu. Maketin 3,2'lik duvarı bu profillere
 * ihtiyaç duymuyor: orada duvarı bitiren şey lambri kuşağının kendisi ve üstündeki KOYU çıta.
 * D-070 gereği maket kazanır; G3'ün beş katmanı maketin üç katmanına indi.
 *
 * MAKETİN KODU (docs/maket/maket-v13.html · `wall`):
 *   box(0.18, h - 0.9, len, C.wallCream)  @ y = 0.9 + (h - 0.9) / 2   → badana gövdesi
 *   box(0.22, 0.9,     len, C.wain)       @ y = 0.45                  → lambri kuşağı
 *   box(0.26, 0.08,    len, C.doorWood)   @ y = 0.94                  → lambri üstü çıta
 * Lambri ve çıta gövdeden KALIN (0,22 · 0,26 ↔ 0,18) — yani gövdeden iki yüzde de taşarlar;
 * duvarın okunan üç şeridi bu kalınlık farkından doğuyor.
 *
 * TEMA: maketin tek duvarı var, oyunun üç teması (mağazadan alınıyor). Eşleme: badana → `cream`,
 * lambri → `wainscot`, çıta → yeni `rail` (maketin `doorWood`'u; lambriden bir tık KOYU).
 */

/** Duvar yüksekliği — maket v13 `WALL_H`. */
export const WALL_H = 3.2;
/** Lambri kuşağının yüksekliği — maket v13 `wall()` içindeki 0,9. */
export const WAINSCOT_H = 0.9;

/** Katman kalınlıkları (maketin kendi sayıları). Gövde en ince, çıta en kalın. */
const T_BODY = 0.18;
const T_WAINSCOT = 0.22;
const T_RAIL = 0.26;
/** Çıtanın yüksekliği ve merkez y'si — maket: box(...,0.08,...) @ y = 0.94. */
const RAIL_H = 0.08;
const RAIL_Y = 0.94;

/**
 * Bir duvar parçasının taban dikdörtgeni (merkez + ölçüler) ve teması.
 * `h` verilmezse `WALL_H`. İnce eksen (w ya da d, hangisi küçükse) KALINLIKTIR; katmanlar o
 * ekseni kendi kalınlıklarıyla değiştirir, uzun eksen olduğu gibi kalır.
 */
export type WallSlab = { x: number; z: number; w: number; d: number; theme: WallTheme; h?: number };

/** Çizilecek renkli kutu — merkez (x,y,z) + kenar uzunlukları. */
export type WallBox = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };

/**
 * Bir duvar parçasını maketin ÜÇ kutusuna çevirir: gövde · lambri · çıta.
 * SAF fonksiyon (birim testi var); çizim `WallPanels`'da.
 */
export function wallBoxes({ x, z, w, d, theme, h: slabH }: WallSlab): WallBox[] {
  const H = slabH ?? WALL_H;
  const alongX = w >= d; // uzun eksen x mi? (yatay duvar) — değilse z (düşey duvar)
  const len = alongX ? w : d;
  // Katman: kalınlığı ince eksene yaz, uzunluğu koru.
  const layer = (t: number, yBot: number, yTop: number, color: string): WallBox => ({
    x,
    y: (yBot + yTop) / 2,
    z,
    w: alongX ? len : t,
    h: yTop - yBot,
    d: alongX ? t : len,
    color,
  });
  return [
    layer(T_BODY, WAINSCOT_H, H, theme.cream), // badana gövdesi
    layer(T_WAINSCOT, 0, WAINSCOT_H, theme.wainscot), // lambri kuşağı
    layer(T_RAIL, RAIL_Y - RAIL_H / 2, RAIL_Y + RAIL_H / 2, theme.rail), // lambri üstü çıta (KOYU)
  ];
}

// Birim küp + BEYAZ materyal: gerçek renk per-instance (instanceColor diffuse ile çarpılır,
// materyal beyaz olduğundan sonuç doğrudan instance rengidir). Modül seviyesinde paylaşılır.
const UNIT_BOX = new BoxGeometry(1, 1, 1);

/** Verilen duvar parçalarını (gövde + lambri + çıta) tek InstancedMesh olarak çizer. */
export function WallPanels({ slabs }: { slabs: WallSlab[] }) {
  const boxes = useMemo(() => slabs.flatMap(wallBoxes), [slabs]);
  const material = useMemo(() => new MeshStandardMaterial({ color: '#ffffff' }), []);
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || boxes.length === 0) return;
    const dummy = new Object3D();
    const col = new Color();
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, col.set(b.color));
    }
    mesh.count = boxes.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [boxes]);

  if (boxes.length === 0) return null;
  return (
    // frustumCulled=false: batch'in sınır küresi origin'de kalır → uzak salona odaklanınca
    // duvarlar toptan kırpılırdı (floorPattern/Tables ile aynı sınıf bug).
    <instancedMesh
      key={boxes.length}
      ref={ref}
      args={[UNIT_BOX, material, boxes.length]}
      receiveShadow
      frustumCulled={false}
    />
  );
}
