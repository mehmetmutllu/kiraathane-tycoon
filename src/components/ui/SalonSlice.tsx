// Önizleme = "salondan kesilip yapıştırılmış FERAH parça": oyunun KAMERA AÇISI (izometrik 45°, -Z'ye bakan,
// offset (0,d,+d), fov 50) + IŞIK (ambient 0.6 + dirLight [6,12,6]). Zemin tüm canvas'ı doldurur (kenar void
// yok), TEK arka duvar (L köşe/kutu hissi yok). Düz base + checker quad; duvar h=1.2 krem üst + lambri wh=0.5.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { FLOOR_THEMES, WALL_THEMES } from '../../config/palette';

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

// Dama deseni: Scene.tsx CheckerTiles ile aynı (ts=1.3, (i+j)%2 alt-renk kareleri). Merkezden +half'a kadar
// döşer; az kare → instancing gerekmez (düz mesh).
function CheckerPatch({ half, color }: { half: number; color: string }) {
  const ts = 1.3;
  const n = Math.ceil((half * 2) / ts);
  const tiles: [number, number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if ((i + j) % 2 === 0) continue;
      const tx0 = -half + i * ts;
      const tz0 = -half + j * ts;
      const tx1 = Math.min(tx0 + ts, half);
      const tz1 = Math.min(tz0 + ts, half);
      tiles.push([(tx0 + tx1) / 2, (tz0 + tz1) / 2, tx1 - tx0, tz1 - tz0]);
    }
  }
  return (
    <>
      {tiles.map(([cx, cz, w, dd], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.006, cz]}>
          <planeGeometry args={[w, dd]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

// Zemin kesiti: tema base TÜM canvas'ı doldurur (kenar void/çerçeve YOK) + merkezde checker deseni.
// İnce ahşap süpürgelik şeridi duvar dibinde (Scene.tsx Ground katman dilini hatırlatır, ama çerçeve değil).
export function FloorPatch({ floorId, checkerHalf = 4 }: { floorId: string; checkerHalf?: number }) {
  const theme = FLOOR_THEMES[floorId] ?? FLOOR_THEMES.parke;
  return (
    <group>
      {/* tam-taşan zemin: tema base — frame'i her yönde aşar, kenarda void görünmez */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={theme.base} />
      </mesh>
      {theme.kind === 'checker' ? <CheckerPatch half={checkerHalf} color={theme.alt} /> : null}
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
