import { useGame } from '../../game/store';
import { Model } from './Model';

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

// Garson (greybox: yeşil önlüklü kapsül, sahipten ayırt edilir). Faz 6'da waiter.glb takılır.
export function Waiter() {
  const waiter = useGame((s) => s.waiter);
  if (!waiter) return null;
  return (
    <group position={[waiter.pos[0], 0, waiter.pos[2]]}>
      <Model
        fallback={
          <mesh castShadow position={[0, 0.55, 0]}>
            <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
            <meshStandardMaterial color="#2e8b57" />
          </mesh>
        }
      />
      <WaiterTray count={waiter.tray} />
    </group>
  );
}
