import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, MeshStandardMaterial, Object3D, PlaneGeometry, type InstancedMesh } from 'three';
import type { FloorTheme } from '../../config/palette';

/**
 * FAZ G2 — ZEMİNE ÖLÇEK REFERANSI, GEOMETRİYLE (plan §8).
 *
 * Teşhis (plan): "dama temalı salon parke temalıdan daha bitmiş duruyor — ve ikisi de düz renk.
 * Fark dokuda değil, ÖLÇEK REFERANSINDA." Zeminde tekrar eden bilinen-boyutlu bir birim yoksa
 * göz mekânın ne kadar büyük olduğunu okuyamıyor; her şey "yüzüyor" hissi verir (D-054'ten sonra
 * gölge yolu kapalı olduğundan ölçek referansının tek kaynağı zemin geometrisi).
 *
 * Doku yolu D-041 ile KAPALI (denendi, geri alındı: 128px doku 38×30 zemine gerildi → moiré,
 * sert derz çizgileri, mipmap'te gri bulanık şerit, tahta başına varyasyon yok). Bu yüzden desen
 * GEOMETRİ: her tahta/karo ayrı bir quad. Moiré yapısal olarak imkânsız, 0 byte asset.
 *
 * İKİ KURAL:
 *  1. **Derz çizgi DEĞİL boşluk.** Quad'lar hücrelerinden `gap` kadar küçük çizilir; aradan
 *     ALTTAKİ koyu taban (`theme.grout`) görünür. Çizgi çizmek ince geometride aliasing yapar,
 *     boşluk yapmaz.
 *  2. **Tahta başına renk sapması** (±%4). Tekrar deseninin gözle sayılabilmesini engeller —
 *     doku denemesinin başarısızlık sebeplerinden biri tam olarak buydu.
 *
 * Maliyet: alan başına TEK InstancedMesh (1 draw call). Matrisler ve renkler mount'ta BİR KEZ
 * yazılır — drei `<Instances>` KULLANILMADI: o, matrisleri HER KARE yeniden hesaplayıp buffer'ı
 * yeniden yüklüyor (kaynakta doğrulandı: `frames = Infinity` dalı), zemin ise hiç kıpırdamıyor.
 */

// Tahta: uzun kenar X'te. Satır başı yarım tahta ofsetlenir (tuğla düzeni) — hizalı derzler
// ızgara gibi durur, kaydırılmış derz gerçek parkenin imzasıdır.
const PLANK_LEN = 2.2;
const PLANK_WIDTH = 0.55;
const PLANK_GAP = 0.045;
const PLANK_JITTER = 0.04; // ±%4

const TILE_GAP = 0.06; // karoda derz daha kalın (gerçek fayans dili)
const TILE_JITTER = 0.02;
const TILE_CELL = 0.7;

// 'dama' teması G2'den ÖNCEKİ hâliyle korunur: bilerek yüksek kontrastlı büyük satranç, ölçek
// referansı zaten var. Sadece çizim yolu ortaklaştı.
const CHECKER_CELL = 1.3;

export type FloorQuad = {
  /** merkez X/Z (dünya) */
  x: number;
  z: number;
  /** kenar uzunlukları — derz boşluğu DÜŞÜLMÜŞ */
  w: number;
  d: number;
  /** temel renge uygulanacak çarpan (1 = sapma yok) */
  tint: number;
};

/** Konuma bağlı, kararlı sözde-rastgele [-1, 1] — aynı tahta her yüklemede aynı tonu alır. */
export function plankNoise(i: number, j: number): number {
  const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return (h - Math.floor(h)) * 2 - 1;
}

/**
 * Bir dikdörtgen alanı temanın desenine göre quad'lara böler. SAF fonksiyon (birim testi var);
 * çizim `FloorPattern`'da. Alan kenarındaki hücreler KIRPILIR — desen duvarın altına taşmaz.
 */
export function floorQuads(theme: FloorTheme, x0: number, x1: number, z0: number, z1: number): FloorQuad[] {
  const out: FloorQuad[] = [];
  if (theme.kind === 'flat' || x1 <= x0 || z1 <= z0) return out;

  const plank = theme.kind === 'plank';
  const checker = theme.kind === 'checker';
  const cellX = plank ? PLANK_LEN : checker ? CHECKER_CELL : theme.cell ?? TILE_CELL;
  const cellZ = plank ? PLANK_WIDTH : checker ? CHECKER_CELL : theme.cell ?? TILE_CELL;
  // Damada quad'lar bitişik (satranç deseni derzsizdir); plank/tile'da derz = boşluk.
  const gap = checker ? 0 : plank ? PLANK_GAP : TILE_GAP;
  const amp = checker ? 0 : plank ? PLANK_JITTER : TILE_JITTER;

  const rows = Math.ceil((z1 - z0) / cellZ);
  for (let j = 0; j < rows; j++) {
    const cz0 = z0 + j * cellZ;
    const cz1 = Math.min(cz0 + cellZ, z1);
    // Satır başı yarım tahta ofseti (yalnız plank). Sola taşan ilk tahta kenarda kırpılır.
    const startX = x0 - (plank && j % 2 === 1 ? cellX / 2 : 0);
    const cols = Math.ceil((x1 - startX) / cellX);
    for (let i = 0; i < cols; i++) {
      // Damada yalnız alt-renk kareleri çizilir (taban zaten base renk) — eski davranış birebir.
      if (checker && (i + j) % 2 === 0) continue;
      const cx0 = Math.max(startX + i * cellX, x0);
      const cx1 = Math.min(startX + (i + 1) * cellX, x1);
      const w = cx1 - cx0 - gap;
      const d = cz1 - cz0 - gap;
      if (w <= 0.02 || d <= 0.02) continue; // kenardaki kırıntı quad'lar çizilmez
      out.push({
        x: (cx0 + cx1) / 2,
        z: (cz0 + cz1) / 2,
        w,
        d,
        tint: 1 + amp * plankNoise(i, j),
      });
    }
  }
  return out;
}

// Birim düzlem + beyaz materyal: gerçek renk per-instance (instanceColor diffuse ile ÇARPILIR,
// materyal beyaz olduğu için sonuç doğrudan instance rengidir). Modül seviyesinde paylaşılır.
const QUAD_GEO = new PlaneGeometry(1, 1);
QUAD_GEO.rotateX(-Math.PI / 2); // yatır: matris yalnız öteleme + ölçek taşısın

/**
 * Bir zone zemininin desenini tek InstancedMesh olarak çizer.
 * `y` katman sırası: taban(0) < tema tabanı/derz(0.004) < desen(0.006) < GroundMarker(0.02).
 */
export function FloorPattern({
  theme,
  x0,
  x1,
  z0,
  z1,
  y = 0.006,
}: {
  theme: FloorTheme;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  y?: number;
}) {
  const quads = useMemo(() => floorQuads(theme, x0, x1, z0, z1), [theme, x0, x1, z0, z1]);
  // Damada desen rengi `alt` (satranç kareleri), plank/tile'da `base` (tahtanın/karonun yüzü).
  const faceColor = theme.kind === 'checker' ? theme.alt : theme.base;
  const material = useMemo(() => new MeshStandardMaterial({ color: '#ffffff' }), []);
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || quads.length === 0) return;
    const dummy = new Object3D();
    const base = new Color(faceColor);
    const col = new Color();
    for (let i = 0; i < quads.length; i++) {
      const q = quads[i];
      dummy.position.set(q.x, y, q.z);
      dummy.scale.set(q.w, 1, q.d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      col.copy(base).multiplyScalar(q.tint);
      mesh.setColorAt(i, col);
    }
    mesh.count = quads.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [quads, faceColor, y]);

  if (quads.length === 0) return null;
  return (
    // frustumCulled=false: instance batch'inin sınır küresi origin'de kalır → uzak salona
    // odaklanınca desen toptan kırpılırdı (mobilya ile aynı sınıf bug; bkz. Tables.tsx Merged).
    <instancedMesh
      key={quads.length}
      ref={ref}
      args={[QUAD_GEO, material, quads.length]}
      receiveShadow
      frustumCulled={false}
    />
  );
}
