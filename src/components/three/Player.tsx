import { useGame } from '../../game/store';
import { Model } from './Model';

// Sahip karakteri (greybox: altın kapsül). Faz 6'da owner.glb takılır.
export function Player() {
  const p = useGame((s) => s.player);
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
    </group>
  );
}
