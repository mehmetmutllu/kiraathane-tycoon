import { LAYOUT } from '../../game/store';
import { Model } from './Model';

// Çay istasyonu (greybox: tezgah + semaver silindiri). Faz 6'da tea_station.glb/samovar.glb.
export function TeaStation() {
  const [x, , z] = LAYOUT.station;
  return (
    <group position={[x, 0, z]}>
      <Model
        fallback={
          <group>
            {/* tezgah */}
            <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
              <boxGeometry args={[2.2, 0.9, 0.8]} />
              <meshStandardMaterial color="#795548" />
            </mesh>
            {/* semaver gövde */}
            <mesh castShadow position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.28, 0.34, 0.7, 16]} />
              <meshStandardMaterial color="#b08d57" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* semaver tepe */}
            <mesh castShadow position={[0, 1.62, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color="#c9a063" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        }
      />
    </group>
  );
}
