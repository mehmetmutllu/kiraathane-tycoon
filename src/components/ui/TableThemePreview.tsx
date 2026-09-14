import { Canvas } from '@react-three/fiber';
import { economyConfig } from '../../config/economy.config';
import { Model } from '../three/Model';
import { PREVIEW_GL } from '../../config/palette';
import { FixedCam, SalonLights, FloorPatch, WallBack } from './SalonSlice';

const KAY = '/assets/models/kaykit-furniture-bits/';
// In-game çay masası ölçekleri (Tables.tsx ile aynı dil): table_medium + 4 tabure + örtü.
const TABLE_SCALE: [number, number, number] = [0.45, 0.55, 0.45];
const STOOL_SCALE = 0.6;
const SPOTS: [number, number][] = [
  [0, 0.78],
  [0, -0.78],
  [0.78, 0],
  [-0.78, 0],
];

// Temalı masa (Sv5: örtü + minder temaya boyalı), zeminin üstünde — Tables.tsx ile aynı dil.
function ThemedTable({ color }: { color: string }) {
  return (
    <group position={[0, 0, 0]}>
      <Model src={`${KAY}table_medium.gltf`} scale={TABLE_SCALE} fallback={null} />
      {/* örtü plakası (tabla üstü) */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {SPOTS.map(([x, z], i) => (
        <Model key={i} src={`${KAY}chair_stool.gltf`} scale={STOOL_SCALE} position={[x, 0, z]} recolor={color} fallback={null} />
      ))}
    </group>
  );
}

/**
 * Masa teması önizlemesi — M2 (D-106): yalnız VİTRİN, satın alma yok.
 *
 * Satın alma düğmesi buradan ÇIKTI ve ekranın altındaki tek büyük düğmeye taşındı. Sebep
 * M2'nin kendisi: "büyük önizleme + seçim şeridi + TEK büyük satın alma". Alma eylemi üç ayrı
 * bileşende (masa · zemin · duvar) üç ayrı düğmeyken, hangi düğmenin neyi aldığı ekrandan
 * okunmuyordu; şimdi tek yerde ve `ShopPanel` sahibi.
 */
export function TableThemePreview({ id }: { id: string }) {
  const theme = economyConfig.cosmetics.tableThemes.find((t) => t.id === id);
  if (!theme) return null;
  return (
    <div className="shop-preview" data-testid="shop-preview">
      <div className="preview-canvas">
        <Canvas dpr={[1, 2]} gl={PREVIEW_GL}>
          <FixedCam d={3.9} ty={0.5} />
          <SalonLights />
          <FloorPatch floorId="parke" checkerHalf={3} />
          <WallBack wallId="krem" z={-2.1} />
          <ThemedTable color={theme.color} />
        </Canvas>
      </div>
    </div>
  );
}
