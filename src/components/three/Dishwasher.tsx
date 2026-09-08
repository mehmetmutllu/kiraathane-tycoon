import { useCallback, useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useActorTransform } from './actorTransform';
import { CarriedDirty } from './carriedDirty';
import { actorScale, AUTHORED_HEIGHT, authoredRadius } from '../../config/actor';

const DW_R = authoredRadius('dishwasher');
const DW_CAP: [number, number, number, number] = [DW_R, AUTHORED_HEIGHT.dishwasher - 2 * DW_R, 6, 12];

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
      {/* D-076: garsonunkiyle aynı kapsül, aynı düzeltme (taban 0,07 gömülüydü) + aynı ölçek. */}
      <group ref={ref} scale={actorScale('dishwasher')}>
        <Model
          fallback={
            <mesh castShadow position={[0, AUTHORED_HEIGHT.dishwasher / 2, 0]}>
              <capsuleGeometry args={DW_CAP} />
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
