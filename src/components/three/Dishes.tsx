import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGame, LAYOUT, dirtyTables } from '../../game/store';
import { PALETTE } from '../../config/palette';

// Kirli masa işareti varyantı (WP4 A/B — feedback §C17): 'dirty' = masa KİRLİ görünür (leke) +
// üstünde temizlik süngeri ikonu; 'cloud' = eski yeşil koku bulutu. Sabah kararına kadar 'dirty'.
const DIRTY_VARIANT: 'dirty' | 'cloud' = 'dirty';

// Masalarda bekleyen kirli bardaklar (Faz 2e): lekeli ince-belli bardak. Oyuncu/bulaşıkçı
// toplayınca kaybolur. Greybox: gri-kahve silindir (temiz çay kırmızı/sıcak renkten ayrılır).
export function Dishes() {
  const dishes = useGame((s) => s.dishes);
  // Kirli masalar (D-019): eşiği aşan masalar görsel işaretlenir (müşteri oturmaz baskısı okunur).
  const dirty = useMemo(() => [...dirtyTables(dishes)], [dishes]);
  return (
    <>
      {dishes.map((d) => (
        <mesh key={d.id} castShadow position={[d.pos[0], d.pos[1], d.pos[2]]}>
          <cylinderGeometry args={[0.06, 0.05, 0.16, 8]} />
          <meshStandardMaterial color="#8d8276" roughness={0.9} />
        </mesh>
      ))}
      {dirty.map((i) =>
        DIRTY_VARIANT === 'dirty' ? (
          <DirtyTableMark key={i} pos={LAYOUT.tables[i].table} />
        ) : (
          <StinkCloud key={i} pos={LAYOUT.tables[i].table} />
        ),
      )}
    </>
  );
}

// B-varyantı: masa DİREKT kirli görünür (tabla üstünde leke diskleri) + alçakta süzülen temizlik
// SÜNGERİ ikonu (sarı sünger + köpük) — sezgisel "burayı temizle" çağrısı, havada UI kart değil.
function DirtyTableMark({ pos }: { pos: readonly [number, number, number] }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 1.05 + Math.sin(state.clock.elapsedTime * 2.2) * 0.05;
      ref.current.rotation.y = state.clock.elapsedTime * 0.8;
    }
  });
  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* tabla üstü lekeler (örtünün/tablanın hemen üstünde ince diskler) */}
      {[
        [0.12, 0.1, 0.16],
        [-0.18, -0.08, 0.12],
        [0.02, -0.2, 0.09],
      ].map(([dx, dz, r], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[dx, 0.585 + i * 0.002, dz]}>
          <circleGeometry args={[r, 10]} />
          <meshStandardMaterial color={PALETTE.stain} transparent opacity={0.85} />
        </mesh>
      ))}
      {/* temizlik süngeri ikonu (alçak, döner) */}
      <group ref={ref} position={[0, 1.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.1, 0.15]} />
          <meshStandardMaterial color={PALETTE.sponge} />
        </mesh>
        {[
          [-0.08, 0.08, 0.05, 0.045],
          [0.04, 0.1, -0.03, 0.06],
          [0.1, 0.07, 0.06, 0.04],
        ].map(([bx, by, bz, r], i) => (
          <mesh key={i} position={[bx, by, bz]}>
            <sphereGeometry args={[r, 8, 8]} />
            <meshStandardMaterial color={PALETTE.spongeFoam} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Kirli masa işareti (D-019): masanın hemen üstünde ALÇAK, primitive yeşilimsi "koku" bulutu
// (havada UI/rozet DEĞİL — sade obje işareti, feedback_interaction_model). Hafif yukarı-aşağı süzülür.
function StinkCloud({ pos }: { pos: readonly [number, number, number] }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.position.y = 1.15 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
  });
  return (
    <group ref={ref} position={[pos[0], 1.15, pos[2]]}>
      {/* küçük yeşilimsi, yarı saydam kabarcıklar (koku) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#9ccc65" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0.12, 0.12, 0.04]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#aed581" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh position={[-0.1, 0.16, -0.05]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#c5e1a5" transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
}
