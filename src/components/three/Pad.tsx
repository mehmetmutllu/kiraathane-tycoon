import { useGame, LAYOUT, currentPad } from '../../game/store';

// Satın-alma pad'i: sahip üstünde dururken cüzdandan dolar; dolunca pad'in etkisi uygulanır
// ve sıradaki pad aktifleşir. (Generic: config'teki sıralı pad listesi.)
export function Pad() {
  const padsDone = useGame((s) => s.padsDone);
  const padFill = useGame((s) => s.padFill);
  const pad = currentPad(padsDone);
  if (!pad) return null;

  const pos = LAYOUT.padPos[pad.id];
  if (!pos) return null;

  const progress = Math.min(1, padFill / pad.cost);
  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* taban disk */}
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
      {/* dolum diski (büyüyen) */}
      <mesh
        position={[0, 0.04, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[Math.max(0.001, progress), Math.max(0.001, progress), 1]}
      >
        <circleGeometry args={[1.15, 32]} />
        <meshStandardMaterial color="#43a047" emissive="#2e7d32" emissiveIntensity={0.3} transparent opacity={0.85} />
      </mesh>
      {/* üstünde dur işareti */}
      <mesh position={[0, 0.6 + progress * 0.4, 0]}>
        <coneGeometry args={[0.25, 0.5, 4]} />
        <meshStandardMaterial color="#66bb6a" emissive="#43a047" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
