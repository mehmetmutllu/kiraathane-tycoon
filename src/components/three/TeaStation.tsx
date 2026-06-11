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

// Çay ocağı (greybox: tezgah + semaver). Seviye arttıkça semaver büyür/rengi ısınır (seviye GÖRSEL
// olarak okunur; havada "Çay Lv" rozeti KALDIRILDI — D-017 §2 sadelik). Faz 6'da .glb takılır.
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
            {/* Semaver tezgâhın BİR YANINDA (2026-06-11 feedback: bardaklar ortadaki semaverin
                içine gömülüyordu) — bardaklar diğer yarıda 2 sıra, gövdeyle hiç kesişmez. */}
            <group position={[0.55, 0, 0]}>
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
              {/* semaver buharı (tepe küresinin üstünden yükselir) */}
              <Puff baseY={0.9 + bodyH + 0.28} phase={0} />
              <Puff baseY={0.9 + bodyH + 0.28} phase={0.5} />
            </group>
            {/* hazır çaylar — tezgâhın SOL yarısında 2 sıra × 4 (max kuyruk 8; ön sıra önce dolar) */}
            {Array.from({ length: readyCups }).map((_, i) => (
              <mesh key={i} castShadow position={[-1.0 + (i % 4) * 0.24, 0.96, i < 4 ? 0.24 : 0.0]}>
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

/**
 * TOST TEZGÂHI (M3 — zone-3 ürün hattı istasyonu). Çay ocağıyla AYNI footprint/etkileşim
 * (collision/pickup/nav değişmez); görsel kimlik farklı: sac/ızgara + tost presi + ekmek kasası.
 * Seviye görseli: pres kapağı seviyeyle "ısınır" (renk) + L2'den itibaren ikinci pres.
 */
const LID_HEAT = ['#37474f', '#4e4239', '#6e4a2f', '#9c5b28', '#c0392b', '#e25822'];
export function TostStation({
  position,
  level = 0,
  readyCount = 0,
}: {
  position: Vec3;
  level?: number;
  /** Tezgâhta bekleyen hazır tost — sol yarıda dizilir. */
  readyCount?: number;
}) {
  const lid = LID_HEAT[Math.min(level + 1, LID_HEAT.length - 1)];
  return (
    <group position={[position[0], 0, position[2]]}>
      <Model
        fallback={
          <group>
            {/* tezgah (çay ocağıyla aynı iskelet) */}
            <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
              <boxGeometry args={[2.2, 0.9, 0.8]} />
              <meshStandardMaterial color={PALETTE.counterWood} />
            </mesh>
            {/* sac/ızgara + tost presleri (sağ yarı) */}
            <group position={[0.55, 0, 0]}>
              <mesh castShadow position={[0, 0.95, 0]}>
                <boxGeometry args={[1.0, 0.1, 0.62]} />
                <meshStandardMaterial color={PALETTE.griddle} metalness={0.5} roughness={0.4} />
              </mesh>
              {/* pres kapakları: L0-1 tek, L2+ çift (kapasite hissi); renk seviyeyle ısınır */}
              {(level >= 2 ? [-0.26, 0.26] : [0]).map((px) => (
                <group key={px} position={[px, 1.0, -0.1]} rotation={[0.5, 0, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.42, 0.06, 0.5]} />
                    <meshStandardMaterial color={lid} metalness={0.4} roughness={0.5} />
                  </mesh>
                  <mesh position={[0, 0.07, 0.18]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
                    <meshStandardMaterial color="#2b2b2b" />
                  </mesh>
                </group>
              ))}
              {/* buhar (sacdan yükselir) */}
              <Puff baseY={1.15} phase={0} />
              <Puff baseY={1.15} phase={0.5} />
            </group>
            {/* ekmek kasası (sağ uç) */}
            <group position={[1.35, 0, 0]}>
              <mesh castShadow position={[0, 1.0, 0]}>
                <boxGeometry args={[0.42, 0.22, 0.5]} />
                <meshStandardMaterial color={PALETTE.breadCrate} />
              </mesh>
              {[-0.1, 0.04, 0.18].map((bx, i) => (
                <mesh key={i} castShadow position={[bx - 0.04, 1.13, (i % 2) * 0.12 - 0.06]}>
                  <sphereGeometry args={[0.07, 8, 6]} />
                  <meshStandardMaterial color={PALETTE.bread} />
                </mesh>
              ))}
            </group>
            {/* hazır tostlar — sol yarıda 2 sıra × 4 (çay bardak dizilimiyle aynı ızgara) */}
            {Array.from({ length: readyCount }).map((_, i) => (
              <group key={i} position={[-1.0 + (i % 4) * 0.24, 0.95, i < 4 ? 0.24 : -0.04]}>
                <mesh castShadow>
                  <boxGeometry args={[0.18, 0.06, 0.14]} />
                  <meshStandardMaterial color={PALETTE.toast} />
                </mesh>
                <mesh position={[0, 0.035, 0]}>
                  <boxGeometry args={[0.18, 0.012, 0.03]} />
                  <meshStandardMaterial color={PALETTE.toastDark} />
                </mesh>
              </group>
            ))}
          </group>
        }
      />
    </group>
  );
}
