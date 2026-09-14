import { useCallback, useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { useActorTransform } from './actorTransform';
import { CarriedDirty } from './carriedDirty';
import { KAY_GARSON_TEPSI_KAYMA } from '../../config/actor';
import { KayActor } from './KayActor';

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
      <group ref={ref}>
        <KayActor kind="dishwasher" />
        <group position={KAY_GARSON_TEPSI_KAYMA}>
          <CarriedDirty cups={cups} plates={plates} />
        </group>
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
