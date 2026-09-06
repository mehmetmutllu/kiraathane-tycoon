import { useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, Color, MeshStandardMaterial, Object3D, type InstancedMesh } from 'three';
import type { WallTheme } from '../../config/palette';

/**
 * FAZ G3 — DUVAR BİTİMİ (plan §G3).
 *
 * Teşhis: duvar iki düz kuşaktı (krem badana + lambri) ve kutunun kendisi hiçbir yerde
 * BİTMİYORDU — ne zeminle buluştuğu yerde, ne lambrinin üstünde, ne de tepesinde. Sonuç:
 * "kutuya renk sürülmüş" görüntüsü. Gerçek bir odada bu üç hattın hepsinde çıkıntılı bir
 * profil vardır ve göz mekânı oradan okur.
 *
 * G3 üç ince profil ekler:
 *  1. **Süpürgelik** (0,08) — zemin↔duvar birleşimi. Zeminin ALTINDAN başlar (y=0'da eş düzlem
 *     yüz kalmasın → z-fighting yok) ve duvardan en çok o taşar.
 *  2. **Lambri üstü çıta** (0,04) — kuşağı üstten kapatır.
 *  3. **Kartonpiyer/üst kapak** (0,05 + 0,015 taşma) — duvar tepesi; gövdenin üst yüzünü gömer.
 *
 * ÜÇÜ DE TEK TON (`theme.trim`, badanadan AÇIK). İlk denemede süpürgelik ve çıta plandaki koyu
 * ahşaptı (#5d4037) ve ölçüldü: lambri kuşağıyla TEK bir koyu kütleye karışıyorlar, telefon
 * kadrajında hiç okunmuyorlar (`docs/gorsel/ss/g3-karsilastirma.png`, A↔B↔C). Gölge olmadığı
 * için (D-054) yatay hattı ayıran tek sinyal DEĞER farkı.
 *
 * ÇIKINTI SIRASI (yüz başına): gövde 0 < lambri 0,02 < kartonpiyer 0,045 < çıta 0,05 <
 * süpürgelik 0,06. Kademeli olduğu için hiçbir yüz eş düzlemde kalmaz.
 *
 * Maliyet: TÜM duvarlar + profiller **TEK InstancedMesh** (1 draw call). Öncesinde parça
 * başına 2 mesh vardı (3 alanda ~26 draw call) ve profillerle 5 kata çıkacaktı. Matrisler
 * ve renkler mount'ta BİR KEZ yazılır (floorPattern.tsx ile aynı desen; drei `<Instances>`
 * her kare yeniden hesapladığı için kullanılmıyor).
 *
 * TEK KAYNAK: mağaza önizlemesi (`SalonSlice.WallBack`) de bu bileşeni kullanır — mağazada
 * gördüğün duvar salondakiyle birebir aynı (G2'de zemin için kurulan kural).
 */

/** Duvar yüksekliği. Kesit duvarı: kamera tepeden baktığı için tavana kadar çıkmaz. */
export const WALL_H = 1.2;
/** Lambri kuşağının yüksekliği (duvarın alt bandı). */
export const WAINSCOT_H = 0.5;

const SKIRT_H = 0.08; // süpürgeliğin zemin üstünde GÖRÜNEN yüksekliği
const SKIRT_SINK = 0.02; // zeminin altına gömülen pay (eş düzlem yüz olmasın)
const RAIL_H = 0.04; // lambri üstü çıta
const CORNICE_H = 0.05; // üst kapak şeridinin duvara oturan payı
const CORNICE_LIP = 0.015; // duvar tepesini aşan pay (gövdenin üst yüzü gömülsün → z-fighting yok)

const OUT_WAINSCOT = 0.02;
const OUT_CORNICE = 0.045;
const OUT_RAIL = 0.05;
const OUT_SKIRT = 0.06;

/** Bir duvar parçasının taban dikdörtgeni (merkez + ölçüler) ve teması. */
export type WallSlab = { x: number; z: number; w: number; d: number; theme: WallTheme };

/** Çizilecek renkli kutu — merkez (x,y,z) + kenar uzunlukları. */
export type WallBox = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };

/**
 * Bir duvar parçasını 5 renkli kutuya çevirir: gövde · lambri · süpürgelik · çıta · kartonpiyer.
 * SAF fonksiyon (birim testi var); çizim `WallPanels`'da.
 */
export function wallBoxes({ x, z, w, d, theme }: WallSlab): WallBox[] {
  // out: her YÜZDEN dışa taşma; yTop/yBot: kutunun dikey aralığı.
  const box = (out: number, yBot: number, yTop: number, color: string): WallBox => ({
    x,
    y: (yBot + yTop) / 2,
    z,
    w: w + 2 * out,
    h: yTop - yBot,
    d: d + 2 * out,
    color,
  });
  return [
    box(0, WAINSCOT_H, WALL_H, theme.cream), // badana gövdesi
    box(OUT_WAINSCOT, 0, WAINSCOT_H, theme.wainscot), // lambri kuşağı
    box(OUT_SKIRT, -SKIRT_SINK, SKIRT_H, theme.trim), // süpürgelik
    box(OUT_RAIL, WAINSCOT_H, WAINSCOT_H + RAIL_H, theme.trim), // lambri üstü çıta
    box(OUT_CORNICE, WALL_H - CORNICE_H, WALL_H + CORNICE_LIP, theme.trim), // kartonpiyer
  ];
}

// Birim küp + BEYAZ materyal: gerçek renk per-instance (instanceColor diffuse ile çarpılır,
// materyal beyaz olduğundan sonuç doğrudan instance rengidir). Modül seviyesinde paylaşılır.
const UNIT_BOX = new BoxGeometry(1, 1, 1);

/** Verilen duvar parçalarını (gövde + üç profil) tek InstancedMesh olarak çizer. */
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
