import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshStandardMaterial } from 'three';
import type { Vec3 } from '../../game/types';
import { Model } from './Model';
import { PALETTE } from '../../config/palette';

// Seviyeye göre semaver rengi (greybox görsel değişim).
const LEVEL_COLOR = ['#b08d57', '#c9a063', '#d4af37', '#e0b94a', '#ffd700', '#ffea00'];

// Semaver buharı (Faz 2f juice): tek bir buhar topu yükselip solar, döngüye girer.
function Puff({ baseY, phase }: { baseY: number; phase: number }) {
  const ref = useRef<Mesh>(null);
  const RANGE = 0.6;
  useFrame((st) => {
    const m = ref.current;
    if (!m) return;
    const t = (st.clock.elapsedTime * 0.5 + phase) % 1; // 0→1 döngü
    m.position.y = baseY + t * RANGE;
    m.position.x = Math.sin((t + phase) * Math.PI * 2) * 0.06;
    const s = 0.5 + t * 0.8;
    m.scale.setScalar(s);
    (m.material as MeshStandardMaterial).opacity = (1 - t) * 0.45;
  });
  return (
    <mesh ref={ref} position={[0, baseY, 0]}>
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

// İki katlı çaydanlık (klasik: altta çelik kazan + üstte emaye demlik). Kuzine gözüne oturur.
function Kettle({ x }: { x: number }) {
  return (
    <group position={[x, 1.0, -0.08]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.2, 10]} />
        <meshStandardMaterial color={PALETTE.kettleBottom} metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.09, 0.115, 0.15, 10]} />
        <meshStandardMaterial color={PALETTE.kettleTop} roughness={0.5} />
      </mesh>
      {/* demlik kulpu + alt kazan ağzı */}
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[0.05, 0.014, 6, 10, Math.PI]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh castShadow position={[0.13, 0.02, 0]} rotation={[0, 0, -0.9]}>
        <cylinderGeometry args={[0.02, 0.028, 0.12, 6]} />
        <meshStandardMaterial color={PALETTE.kettleBottom} metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

// KLASİK ÇAY OCAĞI (WP4, feedback §C15): paslanmaz tezgah + koyu kuzine + gözlerde İKİ KATLI
// çaydanlıklar — SAYISI SEVİYEYLE ARTAR (1+level; "seviye = çaydanlık sayısı"). Sağda musluklu
// boyler/semaver (rengi seviyeyle ısınır) + buhar. Hazır çaylar ön sırada (D-011 kuyruk görseli).
export function TeaStation({
  position,
  level = 0,
  readyCups = 0,
}: {
  position: Vec3;
  level?: number;
  /** Tezgâhta bekleyen hazır çay (D-011 hazır-kuyruk) — küçük bardaklar olarak çizilir. */
  readyCups?: number;
}) {
  const color = LEVEL_COLOR[Math.min(level, LEVEL_COLOR.length - 1)];
  const kettles = Math.min(5, 1 + level);
  return (
    <group position={[position[0], 0, position[2]]}>
      <Model
        fallback={
          <group>
            {/* paslanmaz tezgah */}
            <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
              <boxGeometry args={[2.2, 0.9, 0.8]} />
              <meshStandardMaterial color={PALETTE.steel} metalness={0.4} roughness={0.45} />
            </mesh>
            {/* kuzine şeridi (gözlerin oturduğu koyu plaka, tezgâhın arka yarısı) */}
            <mesh castShadow position={[-0.35, 0.925, -0.08]}>
              <boxGeometry args={[1.4, 0.07, 0.5]} />
              <meshStandardMaterial color={PALETTE.steelDark} metalness={0.3} roughness={0.6} />
            </mesh>
            {/* çaydanlıklar (seviye kadar göz dolar; tek sıra) */}
            {Array.from({ length: kettles }).map((_, i) => (
              <Kettle key={i} x={-0.9 + i * 0.28} />
            ))}
            {/* musluklu boyler (sağ uç; rengi seviyeyle ısınır) */}
            <group position={[0.75, 0, 0]}>
              <mesh castShadow position={[0, 1.22, 0]}>
                <cylinderGeometry args={[0.2, 0.24, 0.64, 14]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh castShadow position={[0, 1.6, 0]}>
                <sphereGeometry args={[0.13, 12, 10]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh castShadow position={[0, 1.1, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
                <meshStandardMaterial color="#5d4037" />
              </mesh>
              <Puff baseY={1.78} phase={0} />
              <Puff baseY={1.78} phase={0.5} />
            </group>
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
    </group>
  );
}
