import { Html } from '@react-three/drei';
import type { Vec3 } from '../../game/types';
import { Model } from './Model';

// Seviyeye göre semaver rengi (greybox görsel değişim).
const LEVEL_COLOR = ['#b08d57', '#c9a063', '#d4af37', '#e0b94a', '#ffd700', '#ffea00'];

// Çay ocağı (greybox: tezgah + semaver). Seviye arttıkça semaver büyür/rengi ısınır.
// showBadge=true ise üstünde "Çay Lv N" rozeti gösterir. Faz 6'da .glb takılır.
export function TeaStation({
  position,
  level = 0,
  showBadge = false,
  readyCups = 0,
}: {
  position: Vec3;
  level?: number;
  showBadge?: boolean;
  /** Tezgâhta bekleyen hazır çay (D-011 hazır-kuyruk) — küçük bardaklar olarak çizilir. */
  readyCups?: number;
}) {
  const bodyH = 0.7 + level * 0.12;
  const color = LEVEL_COLOR[Math.min(level, LEVEL_COLOR.length - 1)];
  return (
    <group position={[position[0], 0, position[2]]}>
      <Model
        fallback={
          <group>
            {/* tezgah */}
            <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
              <boxGeometry args={[2.2, 0.9, 0.8]} />
              <meshStandardMaterial color="#795548" />
            </mesh>
            {/* semaver gövde (seviyeyle büyür) */}
            <mesh castShadow position={[0, 0.9 + bodyH / 2, 0]}>
              <cylinderGeometry args={[0.28, 0.34, bodyH, 16]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* semaver tepe */}
            <mesh castShadow position={[0, 0.9 + bodyH + 0.12, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* musluk */}
            <mesh castShadow position={[0, 0.9 + bodyH * 0.4, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
              <meshStandardMaterial color="#5d4037" />
            </mesh>
            {/* hazır çaylar (tezgâh önünde sıralı küçük bardaklar) */}
            {Array.from({ length: readyCups }).map((_, i) => (
              <mesh key={i} castShadow position={[-0.5 + (i % 6) * 0.2, 0.96, 0.28]}>
                <cylinderGeometry args={[0.06, 0.05, 0.16, 8]} />
                <meshStandardMaterial color="#c0392b" emissive="#7a1f17" emissiveIntensity={0.25} />
              </mesh>
            ))}
          </group>
        }
      />
      {showBadge && (
        <Html position={[0, 2.3, 0]} center distanceFactor={9} pointerEvents="none" zIndexRange={[5, 0]}>
          <div className="badge3d">Çay Lv {level}</div>
        </Html>
      )}
    </group>
  );
}
