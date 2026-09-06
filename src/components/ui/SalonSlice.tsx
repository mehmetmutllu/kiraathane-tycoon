// Önizleme = "salondan kesilip yapıştırılmış FERAH parça": oyunun KAMERA AÇISI (izometrik 45°, -Z'ye bakan,
// offset (0,d,+d), fov 50) + oyunun IŞIĞI (`three/lights.tsx` SceneLights — dünyayla AYNI bileşen; kartta
// gördüğün renk salondakiyle birebir aynı olsun diye. Eskiden burada ayrı bir ambient 0.6 + dirLight [6,12,6]
// takımı vardı ve G0'da dünya ısınınca mağaza soğuk kalmıştı = satın alınan renk yanlış görünüyordu).
// Zemin tüm canvas'ı doldurur (kenar void yok), TEK arka duvar (L köşe/kutu hissi yok).
// Düz base + checker quad; duvar h=1.2 krem üst + lambri wh=0.5.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { FLOOR_THEMES, WALL_THEMES } from '../../config/palette';
import { FloorPattern } from '../three/floorPattern';
import { WallPanels } from '../three/wallPanel';

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

/** Önizleme ışığı = SAHNENİN ışığı (tek tanım `three/lights.tsx`te). Ayrı bir "mağaza ışığı" YOK. */
export { SceneLights as SalonLights } from '../three/lights';

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

// TEK arka duvar (L köşe/kutu YOK) — ferah salon hissi. Kamera -Z'ye baktığından duvar uzakta, geniş.
// G3: duvar SAHNEYLE AYNI bileşenden (`WallPanels`) çizilir — süpürgelik/çıta/kartonpiyer profilleri
// dahil, mağazada gördüğün duvar salondakiyle birebir. (Eski `PreviewWall` kopyası silindi.)
export function WallBack({ wallId, z = -2.6, width = 14 }: { wallId: string; z?: number; width?: number }) {
  const th = WALL_THEMES[wallId] ?? WALL_THEMES.krem;
  return <WallPanels slabs={[{ x: 0, z, w: width, d: 0.2, theme: th }]} />;
}
