import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useFacing } from './useFacing';

// Bulaşıkçının taşıdığı kirli bardaklar (gri silindir, garsonun kırmızı çayından ayrılır).
// v28: leğen yükseltmesiyle 8'e kadar çıkar → 4'lük sıralar; leğen taşınan adetle genişler.
function CarriedDirty({ count }: { count: number }) {
  if (count <= 0) return null;
  const perRow = Math.min(count, 4);
  const w = Math.max(0.3, 0.14 + perRow * 0.13);
  const depth = count > 4 ? 0.38 : 0.24;
  return (
    <group position={[0, 0.95, 0.4]}>
      <mesh castShadow>
        <boxGeometry args={[w, 0.04, depth]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {Array.from({ length: count }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const rowCount = Math.min(count - row * 4, 4);
        const x = (col - (rowCount - 1) / 2) * 0.14;
        const z = count > 4 ? (row === 0 ? -0.08 : 0.08) : 0;
        return (
          <mesh key={i} castShadow position={[x, 0.1, z]}>
            <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
            <meshStandardMaterial color="#8d8276" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// Tek bulaşıkçı gövdesi (hook'lar per-unit kalsın diye ayrı bileşen).
function DishwasherUnit({ pos, tray }: { pos: [number, number, number]; tray: number }) {
  const ref = useRef<Group>(null);
  useFacing(ref, pos[0], pos[2]);
  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={ref}>
        <Model
          fallback={
            <mesh castShadow position={[0, 0.55, 0]}>
              <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
              <meshStandardMaterial color="#4a6b82" />
            </mesh>
          }
        />
        <CarriedDirty count={tray} />
      </group>
    </group>
  );
}

// Bulaşıkçılar (zone başına; greybox: gri-mavi önlüklü kapsül). Faz 6'da .glb takılır.
export function Dishwasher() {
  const dishwashers = useGame((s) => s.dishwashers);
  return (
    <>
      {dishwashers.map((dw, z) => (dw ? <DishwasherUnit key={z} pos={dw.pos} tray={dw.tray} /> : null))}
    </>
  );
}
