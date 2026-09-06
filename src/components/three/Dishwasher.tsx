import { useCallback, useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useActorTransform } from './actorTransform';
import { PALETTE } from '../../config/palette';
import { zoneProduct } from '../../config/economy.config';

// Bulaşıkçının taşıdığı kirliler. Çay salonu = gri bardak; TOST salonu = yayvan kirli TABAK
// (turu-5 kullanıcı bug'ı 2026-06-13: "tost garsonu boşları alınca tepsisinde bardak duruyor" —
// bulaşıkçı yalnız KENDİ zone'unun kirlisini topladığından zone ürünü kabın türünü belirler;
// tabak görseli oyuncu tepsisindeki m.11 kalıbıyla aynı: disk + kırıntı).
// v28: leğen yükseltmesiyle 8'e kadar çıkar → 4'lük sıralar; leğen taşınan adetle genişler.
function CarriedDirty({ count, food }: { count: number; food: boolean }) {
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
        if (food) {
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
function DishwasherUnit({ zone, tray, food }: { zone: number; tray: number; food: boolean }) {
  const outerRef = useRef<Group>(null);
  const ref = useRef<Group>(null);
  const read = useCallback(() => {
    const dw = useGame.getState().dishwashers[zone];
    return dw ? ([dw.pos[0], dw.pos[2]] as const) : null;
  }, [zone]);
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
        <CarriedDirty count={tray} food={food} />
      </group>
    </group>
  );
}

// Bulaşıkçılar (zone başına; greybox: gri-mavi önlüklü kapsül). Faz 6'da .glb takılır.
export function Dishwasher() {
  // P0 perf: konum React'e girmez (Waiter ile aynı gerekçe); seçici yalnız var/yok + leğen adedi.
  const key = useGame((s) => s.dishwashers.map((dw) => (dw ? dw.tray : -1)).join(','));
  const trays = key ? key.split(',').map(Number) : [];
  return (
    <>
      {trays.map((tray, z) =>
        tray >= 0 ? <DishwasherUnit key={z} zone={z} tray={tray} food={zoneProduct(z) === 'tost'} /> : null,
      )}
    </>
  );
}
