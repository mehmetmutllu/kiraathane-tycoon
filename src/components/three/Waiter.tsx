import { useCallback, useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useActorTransform } from './actorTransform';
import { PALETTE } from '../../config/palette';
import { zoneProduct } from '../../config/economy.config';

// Garson tepsisi (Y3: kapasite yükseltilebilir → taşınan HER birim çizilir; baş üstü değil elde).
function WaiterTray({ count, food }: { count: number; food: boolean }) {
  if (count <= 0) return null;
  const w = Math.max(0.3, 0.14 + count * 0.13); // tepsi taşınan adetle genişler
  return (
    <group position={[0, 0.95, 0.4]}>
      <mesh castShadow>
        <boxGeometry args={[w, 0.04, 0.24]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {Array.from({ length: count }, (_, i) => {
        const x = (i - (count - 1) / 2) * 0.13;
        return food ? (
          <mesh key={i} castShadow position={[x, 0.06, 0]}>
            <boxGeometry args={[0.11, 0.05, 0.12]} />
            <meshStandardMaterial color={PALETTE.toast} roughness={0.7} />
          </mesh>
        ) : (
          <mesh key={i} castShadow position={[x, 0.1, 0]}>
            <cylinderGeometry args={[0.045, 0.036, 0.13, 8]} />
            <meshStandardMaterial color="#c0392b" emissive="#7a1f17" emissiveIntensity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

// Tek garson gövdesi (hook'lar per-unit kalsın diye ayrı bileşen).
// Y3: TOSTÇU garson kıyafetle ayrışır — hardal gövde + beyaz kep (M3 tost ustası diliyle uyumlu);
// çay garsonu yeşil kalır.
function WaiterUnit({ kind, zone, tray, food }: { kind: 'a' | 'b'; zone: number; tray: number; food: boolean }) {
  const outerRef = useRef<Group>(null);
  const ref = useRef<Group>(null);
  // Konum store'dan HER KARE okunur ve doğrudan three'ye yazılır (React prop'u değil) — bkz.
  // useActorTransform açıklaması.
  const read = useCallback(() => {
    const w = (kind === 'a' ? useGame.getState().waiters : useGame.getState().waiters2)[zone];
    return w ? ([w.pos[0], w.pos[2]] as const) : null;
  }, [kind, zone]);
  useActorTransform(outerRef, ref, read);
  return (
    <group ref={outerRef}>
      <group ref={ref}>
        <Model
          fallback={
            <group>
              <mesh castShadow position={[0, 0.55, 0]}>
                <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
                <meshStandardMaterial color={food ? PALETTE.foodApron : '#2e8b57'} />
              </mesh>
              {food && (
                <mesh castShadow position={[0, 1.24, 0]}>
                  <cylinderGeometry args={[0.16, 0.18, 0.14, 10]} />
                  <meshStandardMaterial color={PALETTE.foodCap} />
                </mesh>
              )}
            </group>
          }
        />
        <WaiterTray count={tray} food={food} />
      </group>
    </group>
  );
}

// Garsonlar (zone başına en çok 2 — Y4; greybox: yeşil önlüklü kapsül, tostçu hardal+kep).
// Faz 6'da waiter.glb takılır.
export function Waiter() {
  // P0 perf: garson KONUMU artık React'e girmiyor (her kare değişir). Bu seçici yalnız AYRIK
  // durumu okur — hangi zone'da garson var + tepsisinde kaç birim (-1 = garson yok). Çıktı string
  // olduğundan Zustand referansı değil DEĞERİ karşılaştırır; tepsi değişmedikçe render yok.
  const key = useGame(
    (s) =>
      s.waiters.map((w) => (w ? w.tray : -1)).join(',') + '|' + s.waiters2.map((w) => (w ? w.tray : -1)).join(','),
  );
  const [a, b] = key.split('|');
  const traysA = a ? a.split(',').map(Number) : [];
  const traysB = b ? b.split(',').map(Number) : [];
  return (
    <>
      {traysA.map((tray, z) =>
        tray >= 0 ? <WaiterUnit key={z} kind="a" zone={z} tray={tray} food={zoneProduct(z) === 'tost'} /> : null,
      )}
      {traysB.map((tray, z) =>
        tray >= 0 ? (
          <WaiterUnit key={`w2-${z}`} kind="b" zone={z} tray={tray} food={zoneProduct(z) === 'tost'} />
        ) : null,
      )}
    </>
  );
}
