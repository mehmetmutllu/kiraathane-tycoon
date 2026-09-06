import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CanvasTexture,
  DynamicDrawUsage,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  type InstancedMesh,
} from 'three';
import { useGame, LAYOUT } from '../../game/store';
import { CONTACT_SHADOW as CS } from '../../config/palette';
import { visualActors } from '../../game/visualActors';
import { tableFootprints } from './Tables';

// FAZ G1 — TEMAS GÖLGESİ.
// G0'ın güneş açısı düzeltmesi yönlü gölgeyi görünür kıldı; geriye objenin ALTI kaldı: gölge
// haritası kontak noktasında yumuşamadığı için masa ayağının dibinde ışık sızıyor, obje hafifçe
// "yüzüyordu". Burada her objenin tabanına zemine yatık yumuşak bir elips konur.
// Gerekçe/sayılar: `palette.ts` → CONTACT_SHADOW.
//
// TEK DRAW CALL: hepsi tek InstancedMesh. Geometri ÖNCEDEN yatırıldığı için per-instance matris
// yalnız öteleme + ölçek taşır (rotasyon yok) → kare başı iş = birkaç yüz float yazması.

// Zemine yatık birim quad (XZ düzlemi). Modül düzeyinde: sahnede tek kopya.
const GEO = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

/** Yumuşak daire dokusu: merkezde koyu, `core` yarıçapından sonra 0'a inen radyal degrade.
 *  `alphaMap` olarak kullanılır (renk materyalden gelir) → doku tek kanal iş görür, 64px yeter. */
function blobTexture(): CanvasTexture {
  const px = CS.texSize;
  const c = document.createElement('canvas');
  c.width = px;
  c.height = px;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    g.addColorStop(0, `rgba(255,255,255,${CS.coreAlpha})`);
    g.addColorStop(CS.core, `rgba(255,255,255,${CS.coreAlpha * 0.82})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);
  }
  return new CanvasTexture(c);
}

/** Çizilecek leke: merkez + quad'ın TAM boyutu (ayak izi × ilgili spread × 2). */
type Blob = { x: number; z: number; w: number; d: number };

export function ContactShadows() {
  const ref = useRef<InstancedMesh>(null);
  const tables = useGame((s) => s.tables);
  const tableLevels = useGame((s) => s.tableLevels);
  const zonesOpen = useGame((s) => s.zonesOpen);

  const texture = useMemo(blobTexture, []);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: CS.color,
        alphaMap: texture,
        transparent: true,
        opacity: CS.opacity,
        depthWrite: false, // üst üste binen lekeler birbirini kesmesin (yan yana masa/sandalye)
        toneMapped: false, // koyuluk paletteki değerin AYNISI kalsın (exposure onu açardı)
      }),
    [texture],
  );
  useEffect(() => {
    return () => {
      material.dispose();
      texture.dispose();
    };
  }, [material, texture]);

  // STATİK lekeler: yalnız açık masa / masa seviyesi / açık salon değişince yeniden kurulur.
  const statics = useMemo<Blob[]>(() => {
    const out: Blob[] = [];
    const add = (x: number, z: number, rx: number, rz: number, spread: number) =>
      out.push({ x, z, w: rx * spread * 2, d: rz * spread * 2 });
    // Masalar + oturaklar (yerleşim Tables.tsx'in instance listesinden türer — tek kaynak).
    for (const f of tableFootprints(tables, tableLevels)) add(f.x, f.z, f.rx, f.rz, CS.spread);
    // Her açık salonun ocak/tezgâh ve bulaşık modülü: footprint'ler LAYOUT'ta zaten DÜNYA
    // eksenli yarı-boyut (aynalı salonlarda da doğru) → doğrudan okunur.
    for (let z = 0; z < zonesOpen; z++) {
      const st = LAYOUT.stations[z];
      const sh = LAYOUT.stationHalves[z];
      add(st[0], st[2], sh[0], sh[1], CS.counterSpread);
      const ds = LAYOUT.dishStations[z];
      add(ds[0], ds[2], LAYOUT.dishHalf[0], LAYOUT.dishHalf[1], CS.counterSpread);
    }
    // Salt görsel dekor (çöp kovası / saksı) — konumlar LAYOUT.decor'da, DecorProps ile ortak.
    for (const t of LAYOUT.decor.trashCans) {
      const r = LAYOUT.decor.trashRadius * t.scale;
      add(t.pos[0], t.pos[2], r, r, CS.spread);
    }
    for (const p of LAYOUT.decor.planters) {
      add(p[0], p[2], LAYOUT.decor.planterRadius, LAYOUT.decor.planterRadius, CS.spread);
    }
    return out;
  }, [tables, tableLevels, zonesOpen]);

  // Ön duvar hattı: bunun DIŞI sokak (kaldırım/asfalt düzlemleri daha yüksekte, bkz. CS.streetY).
  const frontWallZ = LAYOUT.zoneAreas[0].maxZ + 0.5;

  const dummy = useMemo(() => new Object3D(), []);

  // İlk karede count=cap ile 320 birim quad origin'de yığılmasın (useFrame'den önce bir render
  // olursa görünürdü).
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const g = useGame.getState();
    let i = 0;
    const put = (x: number, z: number, w: number, d: number) => {
      if (i >= CS.cap) return;
      dummy.position.set(x, z > frontWallZ ? CS.streetY : CS.y, z);
      dummy.scale.set(w, 1, d);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      i++;
    };
    for (const s of statics) put(s.x, s.z, s.w, s.d);
    // AKTÖRLER: hepsi aynı kapsül yarıçapında → tek boy.
    const a = CS.actorRadius * CS.spread * 2;
    put(g.player[0], g.player[2], a, a);
    for (const w of g.waiters) if (w) put(w.pos[0], w.pos[2], a, a);
    for (const w of g.waiters2) if (w) put(w.pos[0], w.pos[2], a, a);
    for (const d of g.dishwashers) if (d) put(d.pos[0], d.pos[2], a, a);
    // Müşteri: YALNIZ ayaktakiler. Oturan müşterinin altında zaten oturağın lekesi var —
    // ikisi üst üste binince o koltuk komşularından belirgin koyu çıkıyor.
    for (const n of g.npcs) if (n.state === 'toTable' || n.state === 'leaving') put(n.pos[0], n.pos[2], a, a);
    // Salt-görsel aktörler (çaycı/tost ustası) kendi konumlarını kayda yazar.
    for (const v of visualActors.values()) put(v.x, v.z, a, a);
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    // frustumCulled=false: instance batch'inin sınır küresi origin'de kalır → uzak salona
    // odaklanınca gölgeler toptan kırpılırdı (Tables/CheckerTiles ile aynı sınıf bug).
    <instancedMesh ref={ref} args={[GEO, material, CS.cap]} frustumCulled={false} renderOrder={-1} />
  );
}
