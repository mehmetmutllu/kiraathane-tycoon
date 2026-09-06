import { useCallback, useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useActorTransform } from './actorTransform';
import { PALETTE } from '../../config/palette';

// Bulaşıkçının taşıdığı kirliler: gri bardak + yayvan kirli TABAK, KARIŞIK.
// B2: tek bulaşıkçı katın her kabını toplar, o yüzden kabın türü artık "servisin ürünü"nden değil
// KABIN KENDİSİNDEN gelir (leğende ayrı sayılır) — turu-5'teki "tepside yanlış kap" hatası bu
// yüzden geri gelmez. v28: leğen yükseltmesiyle 8'e kadar → 4'lük sıralar.
function CarriedDirty({ cups, plates }: { cups: number; plates: number }) {
  const count = cups + plates;
  if (count <= 0) return null;
  const perRow = Math.min(count, 4);
  const w = Math.max(0.3, 0.14 + perRow * 0.13);
  const depth = count > 4 ? 0.38 : 0.24;
  return (
    <group position={[0, 0.95, 0.4]}>
      <mesh castShadow>
        <boxGeometry args={[w, 0.04, depth]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {Array.from({ length: count }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const rowCount = Math.min(count - row * 4, 4);
        const x = (col - (rowCount - 1) / 2) * 0.14;
        const z = count > 4 ? (row === 0 ? -0.08 : 0.08) : 0;
        if (i >= cups) {
          return (
            <group key={i} position={[x, 0.05, z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.075, 0.06, 0.03, 10]} />
                <meshStandardMaterial color="#b3a896" roughness={0.9} />
              </mesh>
              <mesh position={[0.015, 0.025, 0.01]}>
                <boxGeometry args={[0.05, 0.02, 0.04]} />
                <meshStandardMaterial color={PALETTE.toastDark} roughness={0.9} />
              </mesh>
            </group>
          );
        }
        return (
          <mesh key={i} castShadow position={[x, 0.1, z]}>
            <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
            <meshStandardMaterial color="#8d8276" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// Tek bulaşıkçı gövdesi (hook'lar per-unit kalsın diye ayrı bileşen).
function DishwasherUnit({ cups, plates }: { cups: number; plates: number }) {
  const outerRef = useRef<Group>(null);
  const ref = useRef<Group>(null);
  const read = useCallback(() => {
    const dw = useGame.getState().dishwasher;
    return dw ? ([dw.pos[0], dw.pos[2]] as const) : null;
  }, []);
  useActorTransform(outerRef, ref, read);
  return (
    <group ref={outerRef}>
      <group ref={ref}>
        <Model
          fallback={
            <mesh castShadow position={[0, 0.55, 0]}>
              <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
              <meshStandardMaterial color="#4a6b82" />
            </mesh>
          }
        />
        <CarriedDirty cups={cups} plates={plates} />
      </group>
    </group>
  );
}

// BULAŞIKÇI (B2: kat çapında TEK kişi; greybox: gri-mavi önlüklü kapsül). Faz 6'da .glb takılır.
export function Dishwasher() {
  // P0 perf: konum React'e girmez (Waiter ile aynı gerekçe); seçici yalnız var/yok + leğen içeriği.
  const key = useGame((s) => (s.dishwasher ? `${s.dishwasher.tray}.${s.dishwasher.trayFood}` : ''));
  if (!key) return null;
  const [cups, plates] = key.split('.').map(Number);
  return <DishwasherUnit cups={cups} plates={plates} />;
}
