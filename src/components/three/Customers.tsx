import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleGeometry, SphereGeometry, MeshStandardMaterial, Object3D, Color, MathUtils, type InstancedMesh } from 'three';
import { useGame } from '../../game/store';

// FPS Tier 2 (2026-06-13): tüm müşteri gövdeleri TEK InstancedMesh — eskiden her NPC ayrı kapsül
// draw-call'ı (+facing/bob useFrame'i); kalabalık salonda onlarca draw-call. Görsel BİREBİR AYNI:
// aynı kapsül geometrisi + per-instance renk (instanceColor) + facing/bob matriste türetilir.
// NOT: greybox fallback kapsülü instance edilir (Model src'siz → hep fallback); Faz 6'da .glb gelince
// o ayrı bir karar (skinned mesh instancing farklı). "Çay bekliyor" baloncuğu 2. InstancedMesh.
const BODY_GEO = new CapsuleGeometry(0.3, 0.6, 6, 10);
const BODY_MAT = new MeshStandardMaterial({ color: '#ffffff' }); // gerçek renk per-instance (instanceColor çarpar)
const BUBBLE_GEO = new SphereGeometry(0.14, 10, 10);
const BUBBLE_MAT = new MeshStandardMaterial({ color: '#ffd54f', emissive: '#ffb300', emissiveIntensity: 0.4 });
const NPC_CAP = 128; // bol pay (npcCount tipik ~10-30); ucuz.

// useFacing replikası — per-instance durum (son konum + hedef açı + mevcut açı).
type Facing = { lastX: number; lastZ: number; target: number; angle: number };

export function Customers() {
  const npcs = useGame((s) => s.npcs);
  const bodyRef = useRef<InstancedMesh>(null);
  const bubbleRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const col = useMemo(() => new Color(), []);
  const facing = useRef<Map<number, Facing>>(new Map());
  useFrame((st, dt) => {
    const body = bodyRef.current;
    const bubble = bubbleRef.current;
    if (!body || !bubble) return;
    const fmap = facing.current;
    const n = Math.min(npcs.length, NPC_CAP);
    const t = st.clock.elapsedTime;
    let bubbleCount = 0;
    for (let i = 0; i < n; i++) {
      const npc = npcs[i];
      const x = npc.pos[0];
      const z = npc.pos[2];
      // --- facing (useFacing math, per npc): hareket yönüne yumuşak dön; durunca son yönü koru ---
      let f = fmap.get(npc.id);
      if (!f) {
        f = { lastX: x, lastZ: z, target: 0, angle: 0 };
        fmap.set(npc.id, f);
      }
      const dx = x - f.lastX;
      const dz = z - f.lastZ;
      if (dx * dx + dz * dz > 1e-5) f.target = Math.atan2(dx, dz);
      f.lastX = x;
      f.lastZ = z;
      let tg = f.target;
      while (tg - f.angle > Math.PI) tg -= Math.PI * 2;
      while (tg - f.angle < -Math.PI) tg += Math.PI * 2;
      f.angle = MathUtils.damp(f.angle, tg, 9, dt);
      // --- bob: otururken (bekleme/içme) hafif nefes; yürürken sabit (eski Customer'la birebir) ---
      const seated = npc.state === 'waitingForTea' || npc.state === 'drinking';
      const bobY = seated ? Math.sin(t * 2 + npc.id) * 0.04 : 0;
      // Eski transform zinciri Translate(pos)·RotY(facing)·Translate(0,bobY,0); RotY y-ötelemeyi
      // etkilemediğinden = position(x,bobY,z) + RotY(facing). Tek dummy ile birebir.
      dummy.position.set(x, bobY, z);
      dummy.rotation.set(0, f.angle, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      col.set(npc.color);
      body.setColorAt(i, col);
      // "çay bekliyor" baloncuğu (pos grubunda, facing/bob DIŞINDA → sabit y=1.1, dönmez)
      if (npc.state === 'waitingForTea') {
        dummy.position.set(x, 1.1, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        bubble.setMatrixAt(bubbleCount, dummy.matrix);
        bubbleCount++;
      }
    }
    if (fmap.size > n) {
      const live = new Set(npcs.map((c) => c.id));
      for (const id of fmap.keys()) if (!live.has(id)) fmap.delete(id);
    }
    body.count = n;
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    bubble.count = bubbleCount;
    bubble.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={bodyRef} args={[BODY_GEO, BODY_MAT, NPC_CAP]} castShadow frustumCulled={false} />
      <instancedMesh ref={bubbleRef} args={[BUBBLE_GEO, BUBBLE_MAT, NPC_CAP]} frustumCulled={false} />
    </>
  );
}
