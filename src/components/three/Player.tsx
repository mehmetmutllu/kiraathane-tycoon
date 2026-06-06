import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useFacing } from './useFacing';

// Bardakları ellerin ÖNÜNDEKİ tek tepside 3×2 ızgaraya dizer (Faz 2f): max 6 bardak taşmaz,
// kafa/sırt istifi yok. "Eli boşken" kısıtı (store) tepside hep TEK tür (renk) garanti eder:
// temiz çay = kırmızı, kirli = gri. count 0 ise hiçbir şey çizilmez.
function CupTray({ count, color, dirty = false }: { count: number; color: string; dirty?: boolean }) {
  if (count <= 0) return null;
  const colSpacing = 0.16;
  const rowSpacing = 0.15;
  return (
    <group position={[0, 1.0, 0.45]}>
      {/* tepsi tabanı (3×2 ızgarayı taşıyacak boyut) */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.56, 0.04, 0.38]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {Array.from({ length: count }).map((_, i) => {
        const col = i % 3; // 0..2 → x: -1,0,1
        const row = Math.floor(i / 3); // 0..1 → z: arka/ön
        return (
          <mesh key={i} castShadow position={[(col - 1) * colSpacing, 0.1, (row - 0.5) * rowSpacing]}>
            <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
            <meshStandardMaterial
              color={color}
              roughness={dirty ? 0.9 : 0.5}
              emissive={dirty ? '#000000' : '#7a1f17'}
              emissiveIntensity={dirty ? 0 : 0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Baş üstü radial (halka) ilerleme: bir zone üstünde dururken doluluk yayı (Faz 2f juice).
// Taşıma DEĞİL görev göstergesi (araştırma §). pad = yeşil, yükseltme = altın.
function HeadRadial() {
  const zone = useGame((s) => s.activeZone);
  if (!zone) return null;
  const progress = Math.max(0.001, Math.min(1, zone.fill / zone.cost));
  const col = zone.kind === 'upgrade' ? '#ffd54f' : '#66bb6a';
  return (
    <group position={[0, 1.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* zemin halkası (soluk) */}
      <mesh>
        <ringGeometry args={[0.18, 0.28, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
      {/* dolan yay (üstten başlar, saat yönünde) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <ringGeometry args={[0.18, 0.28, 32, 1, 0, progress * Math.PI * 2]} />
        <meshBasicMaterial color={col} transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

// Sahip karakteri (greybox: altın kapsül). Faz 6'da owner.glb takılır.
// Taşıma tek ön tepside: "eli boşken" kısıtı sayesinde aynı anda yalnız biri (>0) → çakışmaz.
export function Player() {
  const p = useGame((s) => s.player);
  const tray = useGame((s) => s.tray);
  const carriedDirty = useGame((s) => s.carriedDirty);
  const ref = useRef<Group>(null);
  useFacing(ref, p[0], p[2]);
  return (
    <group position={[p[0], 0, p[2]]}>
      {/* yön dönüşü gövde+tepsiye uygulanır; baş üstü radial dönmesin diye ayrı grupta */}
      <group ref={ref}>
        <Model
          fallback={
            <mesh castShadow position={[0, 0.6, 0]}>
              <capsuleGeometry args={[0.35, 0.7, 6, 12]} />
              <meshStandardMaterial color="#f1c40f" />
            </mesh>
          }
        />
        <CupTray count={tray} color="#c0392b" />
        <CupTray count={carriedDirty} color="#8d8276" dirty />
      </group>
      <HeadRadial />
    </group>
  );
}
