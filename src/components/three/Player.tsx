import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useFacing } from './useFacing';
import { PALETTE } from '../../config/palette';

// Çaycı karakter prototipi (gece 6/7): PARÇALI gövde (Faz 6 animasyon iskeletine hazırlık —
// her uzuv ayrı mesh). Kasket + krem gömlek + bordo önlük + bıyık; flat low-poly (D-013).
function OwnerBody() {
  return (
    <group>
      {/* pantolon (alt gövde) */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.56, 12]} />
        <meshStandardMaterial color={PALETTE.pants} />
      </mesh>
      {/* gömlek (üst gövde) */}
      <mesh castShadow position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.3, 0.26, 0.34, 12]} />
        <meshStandardMaterial color={PALETTE.shirt} />
      </mesh>
      {/* önlük (göğüsten dize, önde) */}
      <mesh castShadow position={[0, 0.52, 0.24]} rotation={[0.06, 0, 0]}>
        <boxGeometry args={[0.4, 0.62, 0.06]} />
        <meshStandardMaterial color={PALETTE.apron} />
      </mesh>
      {/* kollar (yanlarda, hafif öne) */}
      <mesh castShadow position={[-0.36, 0.72, 0.12]} rotation={[0.5, 0, 0.15]}>
        <capsuleGeometry args={[0.07, 0.34, 4, 8]} />
        <meshStandardMaterial color={PALETTE.shirt} />
      </mesh>
      <mesh castShadow position={[0.36, 0.72, 0.12]} rotation={[0.5, 0, -0.15]}>
        <capsuleGeometry args={[0.07, 0.34, 4, 8]} />
        <meshStandardMaterial color={PALETTE.skin} />
      </mesh>
      {/* baş */}
      <mesh castShadow position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.21, 14, 12]} />
        <meshStandardMaterial color={PALETTE.skin} />
      </mesh>
      {/* bıyık (yüzün önünde) */}
      <mesh position={[0, 1.02, 0.18]}>
        <boxGeometry args={[0.16, 0.045, 0.04]} />
        <meshStandardMaterial color={PALETTE.mustache} />
      </mesh>
      {/* kasket: tepe + öne vizör */}
      <mesh castShadow position={[0, 1.24, 0]}>
        <cylinderGeometry args={[0.2, 0.23, 0.1, 12]} />
        <meshStandardMaterial color={PALETTE.cap} />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0.2]}>
        <boxGeometry args={[0.3, 0.03, 0.18]} />
        <meshStandardMaterial color={PALETTE.cap} />
      </mesh>
    </group>
  );
}

// Bardakları ellerin ÖNÜNDEKİ tek tepside 3×2 ızgaraya dizer (Faz 2f): max 6 bardak taşmaz,
// Tek ön tepsi, PAYLAŞIMLI kapasite: önce temiz çaylar (kırmızı), sonra kirliler (gri) ardışık dizilir →
// karışık taşımada üst üste binmez (tea + dirty aynı ızgarayı sırayla paylaşır). count 0 ise hiçbir şey çizilmez.
function CupTray({ tea, dirty }: { tea: number; dirty: number }) {
  const total = tea + dirty;
  if (total <= 0) return null;
  const colSpacing = 0.16;
  const rowSpacing = 0.15;
  return (
    <group position={[0, 1.0, 0.45]}>
      {/* tepsi tabanı (3×2 ızgarayı taşıyacak boyut) */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.56, 0.04, 0.38]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {Array.from({ length: total }).map((_, i) => {
        const isDirty = i >= tea;
        const col = i % 3; // 0..2 → x: -1,0,1
        const row = Math.floor(i / 3); // 0..1 → z: arka/ön
        return (
          <mesh key={i} castShadow position={[(col - 1) * colSpacing, 0.1, (row - 0.5) * rowSpacing]}>
            <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
            <meshStandardMaterial
              color={isDirty ? '#8d8276' : '#c0392b'}
              roughness={isDirty ? 0.9 : 0.5}
              emissive={isDirty ? '#000000' : '#7a1f17'}
              emissiveIntensity={isDirty ? 0 : 0.25}
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
  // Segment sayısı ilerlemeyle ORANTILI → her dilim SABİT açıda kalır; büyürken sadece uçta yeni dilim
  // eklenir (tüm yay her frame yeniden dağılıp titremez). depthWrite kapalı + hafif y-offset → z-fighting yok.
  const segments = Math.max(1, Math.round(progress * 48));
  return (
    <group position={[0, 1.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* zemin halkası (soluk) */}
      <mesh renderOrder={1}>
        <ringGeometry args={[0.18, 0.28, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {/* dolan yay (üstten başlar, saat yönünde) — bg'nin hafif üstünde, ayrı render sırası */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.003]} renderOrder={2}>
        <ringGeometry args={[0.18, 0.28, segments, 1, 0, progress * Math.PI * 2]} />
        <meshBasicMaterial color={col} transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Sahip karakteri (greybox: altın kapsül). Faz 6'da owner.glb takılır.
// Taşıma tek ön tepside: çay + kirli PAYLAŞIMLI kapasiteyle ardışık dizilir (karışık taşıma → çakışmaz).
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
        <Model fallback={<OwnerBody />} />
        <CupTray tea={tray} dirty={carriedDirty} />
      </group>
      <HeadRadial />
    </group>
  );
}
