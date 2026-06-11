import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useFacing } from './useFacing';
import { PALETTE } from '../../config/palette';
import { zoneProduct } from '../../config/economy.config';

// Garson elindeki küçük tepsi (kapasite 1 → tek birim; M3: zone'un ürünü çay bardağı ya da tost).
function WaiterTray({ count, food }: { count: number; food: boolean }) {
  if (count <= 0) return null;
  return (
    <group position={[0, 0.95, 0.4]}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.04, 0.24]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {food ? (
        <mesh castShadow position={[0, 0.06, 0]}>
          <boxGeometry args={[0.16, 0.05, 0.12]} />
          <meshStandardMaterial color={PALETTE.toast} roughness={0.7} />
        </mesh>
      ) : (
        <mesh castShadow position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
          <meshStandardMaterial color="#c0392b" emissive="#7a1f17" emissiveIntensity={0.25} />
        </mesh>
      )}
    </group>
  );
}

// Tek garson gövdesi (hook'lar per-unit kalsın diye ayrı bileşen).
function WaiterUnit({ pos, tray, food }: { pos: [number, number, number]; tray: number; food: boolean }) {
  const ref = useRef<Group>(null);
  useFacing(ref, pos[0], pos[2]);
  return (
    <group position={[pos[0], 0, pos[2]]}>
      <group ref={ref}>
        <Model
          fallback={
            <mesh castShadow position={[0, 0.55, 0]}>
              <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
              <meshStandardMaterial color="#2e8b57" />
            </mesh>
          }
        />
        <WaiterTray count={tray} food={food} />
      </group>
    </group>
  );
}

// Garsonlar (zone başına; greybox: yeşil önlüklü kapsül). Faz 6'da waiter.glb takılır.
export function Waiter() {
  const waiters = useGame((s) => s.waiters);
  return (
    <>
      {waiters.map((w, z) =>
        w ? <WaiterUnit key={z} pos={w.pos} tray={w.tray} food={zoneProduct(z) === 'tost'} /> : null,
      )}
    </>
  );
}
