import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import type { Npc } from '../../game/types';
import { Model } from './Model';
import { useFacing } from './useFacing';

function Customer({ npc }: { npc: Npc }) {
  const waiting = npc.state === 'waitingForTea';
  const seated = waiting || npc.state === 'drinking';
  const ref = useRef<Group>(null);
  const bob = useRef<Group>(null);
  useFacing(ref, npc.pos[0], npc.pos[2]);
  // Otururken hafif "nefes" bob'u (juice); yürürken sabit.
  useFrame((st) => {
    const b = bob.current;
    if (!b) return;
    b.position.y = seated ? Math.sin(st.clock.elapsedTime * 2 + npc.id) * 0.04 : 0;
  });
  return (
    <group position={[npc.pos[0], 0, npc.pos[2]]}>
      <group ref={ref}>
        <group ref={bob}>
          <Model
            fallback={
              <mesh castShadow position={[0, 0, 0]}>
                <capsuleGeometry args={[0.3, 0.6, 6, 10]} />
                <meshStandardMaterial color={npc.color} />
              </mesh>
            }
          />
        </group>
      </group>
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
