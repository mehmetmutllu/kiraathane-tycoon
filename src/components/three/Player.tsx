import { useGame } from '../../game/store';
import { Model } from './Model';

// Elde taşınan tepsi: çay sayısı kadar küçük ince-belli bardak (greybox).
function Tray({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <group position={[0, 1.0, 0.45]}>
      {/* tepsi tabanı */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.04, 0.32]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} castShadow position={[-0.18 + i * 0.12, 0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
          <meshStandardMaterial color="#c0392b" emissive="#7a1f17" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

// Sahip karakteri (greybox: altın kapsül). Faz 6'da owner.glb takılır.
export function Player() {
  const p = useGame((s) => s.player);
  const tray = useGame((s) => s.tray);
  return (
    <group position={[p[0], 0, p[2]]}>
      <Model
        fallback={
          <mesh castShadow position={[0, 0.6, 0]}>
            <capsuleGeometry args={[0.35, 0.7, 6, 12]} />
            <meshStandardMaterial color="#f1c40f" />
          </mesh>
        }
      />
      <Tray count={tray} />
    </group>
  );
}
