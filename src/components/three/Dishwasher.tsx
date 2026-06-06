import { useGame } from '../../game/store';
import { Model } from './Model';

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

// Bulaşıkçı (greybox: gri-mavi önlüklü kapsül, garson/sahipten ayırt edilir). Faz 6'da .glb takılır.
export function Dishwasher() {
  const dishwasher = useGame((s) => s.dishwasher);
  if (!dishwasher) return null;
  return (
    <group position={[dishwasher.pos[0], 0, dishwasher.pos[2]]}>
      <Model
        fallback={
          <mesh castShadow position={[0, 0.55, 0]}>
            <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
            <meshStandardMaterial color="#4a6b82" />
          </mesh>
        }
      />
      <CarriedDirty count={dishwasher.tray} />
    </group>
  );
}
