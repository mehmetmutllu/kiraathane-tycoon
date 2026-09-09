import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshStandardMaterial } from 'three';
import type { Vec3 } from '../../game/types';
import { KayTezgah } from './Kitchen';
import { onHatGovdeleri } from './kitchenLook';
import { FRONT_TOP_Y } from './kitchenLook';
import { PALETTE } from '../../config/palette';
import { isCounter, sellsTost } from '../../game/world';

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

/**
 * SERVİS NOKTASI (B2 — D-060): katın TEK üretim objesi. **Tek merdiven, iki kimlik** (plan §4):
 *   L0-L3  derme çatma ÇAY OCAĞI — tezgâh + semaver; semaver seviyeyle büyür/ısınır.
 *   L4+    TEZGÂH — gövde kaplanır (koyu tezgâh ahşabı + pirinç bant), arkaya cezve ocağı gelir.
 *          Obje YER DEĞİŞTİRMEZ, seviye SIFIRLANMAZ: aynı nokta kimlik değiştirir.
 *   L5+    TOST açılır — sac + pres + ekmek kasası eklenir (eski ayrı "TostStation" objesinin
 *          parçaları; artık ayrı bir istasyon değil, aynı tezgâhın üst basamağı).
 * Hazır ürünler tezgâhın sol yarısında: çay ÖN sırada (bardak), tost ARKA sırada (dilim).
 * Faz 6'da .glb takılır; B3'te maket ölçeğinde arka banda taşınacak.
 */
const LID_HEAT = ['#37474f', '#4e4239', '#6e4a2f', '#9c5b28', '#c0392b', '#e25822'];
export function ServicePoint({
  position,
  level = 0,
  readyTea = 0,
  readyTost = 0,
  areasOpen,
}: {
  position: Vec3;
  /** Ön hattın birleşik gövdesi açık-alan sayısından türer (`onHatGovdeleri`). */
  areasOpen: number;
  level?: number;
  /** Tezgâhta bekleyen hazır çay (D-011 hazır-kuyruk) — ön sırada bardak olarak çizilir. */
  readyTea?: number;
  /** Tezgâhta bekleyen hazır tost — arka sırada dilim olarak çizilir. */
  readyTost?: number;
}) {
  const bodyH = 0.7 + level * 0.12;
  const color = LEVEL_COLOR[Math.min(level, LEVEL_COLOR.length - 1)];
  const counter = isCounter(level); // L4: ocak → TEZGÂH
  const tost = sellsTost(level); // L5: tost açılır
  const lid = LID_HEAT[Math.min(level + 1, LID_HEAT.length - 1)];
  const govde = onHatGovdeleri(areasOpen).station;
  return (
    <group position={[position[0], 0, position[2]]}>
      <group>
        {/* GÖVDE (S3): KayKit tezgâhı, eski kutunun TAM ölçüsüne çekilmiş (2,2 × 0,8, tabla 0,90).
            L4'ün kimlik değişimi gövdenin RENGİNDEN değil artık pirinç banttan okunur — model
            tek dokulu olduğu için seviye rengi yedeğe (greybox) kaldı. */}
        {/* S4: gövde ÖN HATTIN birleşik genişliğinden gelir (`onHatGovde`) — üç tezgâh tek
            banko okunsun diye komşusuyla arasındaki boşluğun ortasına kadar uzar. Collision
            kutusu DEĞİŞMEDİ; elle yazılı 2,2 × 0,8 de kalktı, ölçü kutudan türüyor. */}
        <KayTezgah
          model="kitchencounter_straight_A"
          w={govde.w}
          d={govde.d}
          dx={govde.dx}
          topY={FRONT_TOP_Y}
          fallback={
            <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
              <boxGeometry args={[2.2, 0.9, 0.8]} />
              <meshStandardMaterial color={counter ? PALETTE.counterWood : '#795548'} />
            </mesh>
          }
        />
        <group>
            {counter && (
              <>
                {/* pirinç bant (tezgâhın yüzünü "kafenin yüzü" yapan detay) */}
                <mesh position={[0, 0.86, 0.41]}>
                  <boxGeometry args={[2.2, 0.05, 0.03]} />
                  <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} />
                </mesh>
                {/* arka cezve ocağı (hazırlık tarafı — tezgâhın arkasına geçer) */}
                <group position={[-0.15, 0, -0.55]}>
                  <mesh castShadow position={[0, 0.35, 0]}>
                    <boxGeometry args={[0.9, 0.7, 0.35]} />
                    <meshStandardMaterial color={PALETTE.wainscot} />
                  </mesh>
                  <mesh position={[0, 0.72, 0]}>
                    <boxGeometry args={[0.86, 0.04, 0.31]} />
                    <meshStandardMaterial color={PALETTE.griddle} metalness={0.5} roughness={0.5} />
                  </mesh>
                </group>
              </>
            )}
            {/* Semaver tezgâhın SAĞ yanında; hazır ürünler sol yarıda (gövdeyle kesişmez). */}
            <group position={[0.55, 0, 0]}>
              <mesh castShadow position={[0, 0.9 + bodyH / 2, 0]}>
                <cylinderGeometry args={[0.28, 0.34, bodyH, 16]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh castShadow position={[0, 0.9 + bodyH + 0.12, 0]}>
                <sphereGeometry args={[0.18, 12, 12]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
              </mesh>
              {/* musluk */}
              <mesh castShadow position={[0, 0.9 + bodyH * 0.4, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
                <meshStandardMaterial color="#5d4037" />
              </mesh>
              <Puff baseY={0.9 + bodyH + 0.28} phase={0} />
              <Puff baseY={0.9 + bodyH + 0.28} phase={0.5} />
            </group>

            {/* L5: TOST SACI + PRES — tezgâhın SOL ucunda, ARKA sırada (tabla üstü, 2.2×0.8'in İÇİNDE:
                gövde ±1.1 x / ±0.4 z; sac -1.05..-0.15 aralığında durur, dışarı taşmaz). Ekmek kasası
                arkadaki hazırlık modülünün üstünde — tezgâhın oynanış yüzünü kalabalıklaştırmaz. */}
            {tost && (
              <group position={[-0.6, 0, -0.12]}>
                <mesh castShadow position={[0, 0.94, 0]}>
                  <boxGeometry args={[0.9, 0.06, 0.4]} />
                  <meshStandardMaterial color={PALETTE.griddle} metalness={0.5} roughness={0.4} />
                </mesh>
                {/* pres kapağı: L6'da ikinci pres (kapasite hissi); renk seviyeyle ısınır */}
                {(level >= 6 ? [-0.22, 0.22] : [0]).map((px) => (
                  <group key={px} position={[px, 1.0, -0.16]} rotation={[0.5, 0, 0]}>
                    <mesh castShadow>
                      <boxGeometry args={[0.34, 0.05, 0.3]} />
                      <meshStandardMaterial color={lid} metalness={0.4} roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.06, 0.12]}>
                      <cylinderGeometry args={[0.025, 0.025, 0.1, 8]} />
                      <meshStandardMaterial color="#2b2b2b" />
                    </mesh>
                  </group>
                ))}
                <Puff baseY={1.1} phase={0.25} />
              </group>
            )}
            {/* Ekmek kasası: arkadaki hazırlık modülünün üstünde (yalnız tost açıkken). */}
            {tost && (
              <group position={[0.55, 0, -0.55]}>
                <mesh castShadow position={[0, 0.82, 0]}>
                  <boxGeometry args={[0.42, 0.2, 0.3]} />
                  <meshStandardMaterial color={PALETTE.breadCrate} />
                </mesh>
                {[-0.1, 0.04, 0.18].map((bx, i) => (
                  <mesh key={i} castShadow position={[bx - 0.04, 0.94, (i % 2) * 0.1 - 0.05]}>
                    <sphereGeometry args={[0.06, 8, 6]} />
                    <meshStandardMaterial color={PALETTE.bread} />
                  </mesh>
                ))}
              </group>
            )}

            {/* HAZIR ÇAY — ÖN sıra (oyuncunun aldığı yüz), en çok 4 bardak çizilir. */}
            {Array.from({ length: Math.min(readyTea, 4) }).map((_, i) => (
              <mesh key={`t${i}`} castShadow position={[-1.0 + i * 0.24, 0.96, 0.24]}>
                <cylinderGeometry args={[0.06, 0.05, 0.16, 8]} />
                <meshStandardMaterial color="#c0392b" emissive="#7a1f17" emissiveIntensity={0.25} />
              </mesh>
            ))}
            {/* HAZIR TOST — SACIN ÜSTÜNDE (kızarmış tostlar sacda bekler), en çok 3 dilim. */}
            {Array.from({ length: Math.min(readyTost, 3) }).map((_, i) => (
              <group key={`f${i}`} position={[-0.9 + i * 0.3, 1.0, -0.02]}>
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
      </group>
    </group>
  );
}
