// Önizleme = "salondan kesilip yapıştırılmış FERAH parça": oyunun KAMERA AÇISI (izometrik 45°, -Z'ye bakan,
// offset (0,d,+d), fov 50) + IŞIK (ambient 0.6 + dirLight [6,12,6]). Zemin tüm canvas'ı doldurur (kenar void
// yok), TEK arka duvar (L köşe/kutu hissi yok). Düz base + checker quad; duvar h=1.2 krem üst + lambri wh=0.5.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { FLOOR_THEMES, WALL_THEMES } from '../../config/palette';
import { FloorPattern } from '../three/floorPattern';

// Oyun kamerasıyla AYNI duruş: konum (0,d,+d), bakış (0,ty,0), fov 50 (Scene.tsx CameraRig dili).
export function FixedCam({ d, ty = 0.45 }: { d: number; ty?: number }) {
  const cam = useThree((s) => s.camera);
  useEffect(() => {
    cam.position.set(0, d, d);
    cam.lookAt(0, ty, 0);
    if ('fov' in cam) {
      (cam as { fov: number }).fov = 50;
      cam.updateProjectionMatrix();
    }
  }, [cam, d, ty]);
  return null;
}

export function SalonLights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 12, 6]} intensity={1.1} />
    </>
  );
}

// Zemin kesiti: tema tabanı TÜM canvas'ı doldurur (kenar void/çerçeve YOK) + üstünde temanın deseni.
// G2: desen SAHNEYLE AYNI bileşenden (`FloorPattern`) çizilir — mağazada gördüğün tahta/karo ölçüsü
// salonda göreceğinle birebir aynı, ayrı bir önizleme kopyası yok.
export function FloorPatch({ floorId, checkerHalf = 4 }: { floorId: string; checkerHalf?: number }) {
  const theme = FLOOR_THEMES[floorId] ?? FLOOR_THEMES.parke;
  return (
    <group>
      {/* tam-taşan taban: plank/tile'da DERZ rengi (desen boşluklarından bu görünür) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={theme.grout ?? theme.base} />
      </mesh>
      <FloorPattern theme={theme} x0={-checkerHalf} x1={checkerHalf} z0={-checkerHalf} z1={checkerHalf} />
    </group>
  );
}

// Duvar parçası: Scene.tsx WallPiece ile birebir (krem üst + lambri kuşağı; h=1.2, wh=0.5).
function PreviewWall({ x, z, w, dDepth, theme }: { x: number; z: number; w: number; dDepth: number; theme: { cream: string; wainscot: string } }) {
  const h = 1.2;
  const wh = 0.5;
  return (
    <group>
      <mesh position={[x, wh + (h - wh) / 2, z]}>
        <boxGeometry args={[w, h - wh, dDepth]} />
        <meshStandardMaterial color={theme.cream} />
      </mesh>
      <mesh position={[x, wh / 2, z]}>
        <boxGeometry args={[w + 0.04, wh, dDepth + 0.04]} />
        <meshStandardMaterial color={theme.wainscot} />
      </mesh>
    </group>
  );
}

// TEK arka duvar (L köşe/kutu YOK) — ferah salon hissi. Kamera -Z'ye baktığından duvar uzakta, geniş.
export function WallBack({ wallId, z = -2.6, width = 14 }: { wallId: string; z?: number; width?: number }) {
  const th = WALL_THEMES[wallId] ?? WALL_THEMES.krem;
  return <PreviewWall x={0} z={z} w={width} dDepth={0.2} theme={th} />;
}
