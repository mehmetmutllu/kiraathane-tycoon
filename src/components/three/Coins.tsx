import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useGame } from '../../game/store';

function Coin({ x, z }: { x: number; z: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 3;
  });
  return (
    <mesh ref={ref} castShadow position={[x, 0.3, z]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
      <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.25} />
    </mesh>
  );
}

// Yere düşen ₺ paralar — sahip üstünden geçince toplanır.
export function Coins() {
  const coins = useGame((s) => s.coins);
  return (
    <>
      {coins.map((c) => (
        <Coin key={c.id} x={c.pos[0]} z={c.pos[2]} />
      ))}
    </>
  );
}
