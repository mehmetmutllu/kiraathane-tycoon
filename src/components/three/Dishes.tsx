import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGame, LAYOUT, dirtyTables } from '../../game/store';
import { PALETTE } from '../../config/palette';

// Masalarda bekleyen kirli kaplar (Faz 2e + M3): çay = lekeli ince-belli bardak (gri-kahve silindir),
// tost = kirli TABAK (yayvan disk + kırıntı). Oyuncu/bulaşıkçı toplayınca kaybolur.
export function Dishes() {
  const dishes = useGame((s) => s.dishes);
  // Kirli masalar (D-019): eşiği aşan masaların ÜSTÜNDE alçak primitive "koku" işareti.
  const dirty = useMemo(() => [...dirtyTables(dishes)], [dishes]);
  return (
    <>
      {dishes.map((d) =>
        d.kind === 'plate' ? (
          <group key={d.id} position={[d.pos[0], d.pos[1], d.pos[2]]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.11, 0.09, 0.03, 10]} />
              <meshStandardMaterial color={PALETTE.plateDirty} roughness={0.9} />
            </mesh>
            <mesh position={[0.03, 0.025, -0.02]}>
              <boxGeometry args={[0.05, 0.02, 0.04]} />
              <meshStandardMaterial color={PALETTE.toastDark} roughness={0.9} />
            </mesh>
          </group>
        ) : (
          <mesh key={d.id} castShadow position={[d.pos[0], d.pos[1], d.pos[2]]}>
            <cylinderGeometry args={[0.06, 0.05, 0.16, 8]} />
            <meshStandardMaterial color="#8d8276" roughness={0.9} />
          </mesh>
        ),
      )}
      {dirty.map((i) => (
        <StinkCloud key={i} pos={LAYOUT.tables[i].table} />
      ))}
    </>
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
