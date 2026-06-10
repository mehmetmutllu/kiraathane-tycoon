import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Character } from './Character';
import { useFacing } from './useFacing';

// Bulaşıkçının taşıdığı kirli bardaklar (gri silindir, garsonun kırmızı çayından ayrılır).
function CarriedDirty({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <group position={[0, 0.95, 0.4]}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.04, 0.24]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} castShadow position={[-0.07 + i * 0.14, 0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
          <meshStandardMaterial color="#8d8276" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Tek bulaşıkçı gövdesi (hook'lar per-unit kalsın diye ayrı bileşen). Quaternius Casual_Hoodie =
// bulaşıkçı (WP3); hareket pos delta'sından (garson deseni).
function DishwasherUnit({ pos, tray }: { pos: [number, number, number]; tray: number }) {
  const ref = useRef<Group>(null);
  const last = useRef<[number, number]>([pos[0], pos[2]]);
  const moving = Math.hypot(pos[0] - last.current[0], pos[2] - last.current[1]) > 0.004;
  last.current = [pos[0], pos[2]];
  useFacing(ref, pos[0], pos[2]);
  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={ref}>
        <Character
          model="Casual_Hoodie.glb"
          anim={moving ? 'Walk' : 'Idle'}
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
