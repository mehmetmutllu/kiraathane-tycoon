import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Character } from './Character';
import { useFacing } from './useFacing';

// Garson elindeki küçük tepsi (kapasite 1 → tek bardak).
function WaiterTray({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <group position={[0, 0.95, 0.4]}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.04, 0.24]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
        <meshStandardMaterial color="#c0392b" emissive="#7a1f17" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

// Tek garson gövdesi (hook'lar per-unit kalsın diye ayrı bileşen). Quaternius Suit = garson (WP3);
// hareket pos delta'sından okunur (store waiters'ı her tick yeni dizi yapar → her tick render).
function WaiterUnit({ pos, tray }: { pos: [number, number, number]; tray: number }) {
  const ref = useRef<Group>(null);
  const last = useRef<[number, number]>([pos[0], pos[2]]);
  const moving = Math.hypot(pos[0] - last.current[0], pos[2] - last.current[1]) > 0.004;
  last.current = [pos[0], pos[2]];
  useFacing(ref, pos[0], pos[2]);
  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={ref}>
        <Character
          model="Suit.glb"
          anim={moving ? 'Walk' : 'Idle'}
          fallback={
            <mesh castShadow position={[0, 0.55, 0]}>
              <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
              <meshStandardMaterial color="#2e8b57" />
            </mesh>
          }
        />
        <WaiterTray count={tray} />
      </group>
    </group>
  );
}

// Garsonlar (zone başına; greybox: yeşil önlüklü kapsül). Faz 6'da waiter.glb takılır.
export function Waiter() {
  const waiters = useGame((s) => s.waiters);
  return (
    <>
      {waiters.map((w, z) => (w ? <WaiterUnit key={z} pos={w.pos} tray={w.tray} /> : null))}
    </>
  );
}
