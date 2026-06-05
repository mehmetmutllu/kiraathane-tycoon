import { useGame } from '../../game/store';
import type { Npc } from '../../game/types';
import { Model } from './Model';

function Customer({ npc }: { npc: Npc }) {
  const waiting = npc.state === 'ordering';
  return (
    <group position={[npc.pos[0], 0, npc.pos[2]]}>
      <Model
        fallback={
          <mesh castShadow position={[0, 0, 0]}>
            <capsuleGeometry args={[0.3, 0.6, 6, 10]} />
            <meshStandardMaterial color={npc.color} />
          </mesh>
        }
      />
      {/* "çay bekliyor" baloncuğu */}
      {waiting && (
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial color="#ffd54f" emissive="#ffb300" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}

export function Customers() {
  const npcs = useGame((s) => s.npcs);
  return (
    <>
      {npcs.map((n) => (
        <Customer key={n.id} npc={n} />
      ))}
    </>
  );
}
