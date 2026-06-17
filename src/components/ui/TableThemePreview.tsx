import { Canvas } from '@react-three/fiber';
import { useGame } from '../../game/store';
import { economyConfig } from '../../config/economy.config';
import { Model } from '../three/Model';
import { CoinIcon } from './icons';
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

/** Masa teması SAYFA-İÇİ önizleme: oyunun kamera açısı/duruşu/uzaklığıyla salondan bir kesit + satın al. */
export function TableThemePreview({ id }: { id: string }) {
  const tableTheme = useGame((s) => s.tableTheme);
  const ownedCosmetics = useGame((s) => s.ownedCosmetics);
  const wallet = useGame((s) => s.wallet);
  const buyCosmetic = useGame((s) => s.buyCosmetic);
  const theme = economyConfig.cosmetics.tableThemes.find((t) => t.id === id);
  if (!theme) return null;
  const isSel = tableTheme === id;
  const owned = theme.cost === 0 || ownedCosmetics.includes(`table:${id}`);
  const afford = owned || wallet.toNumber() >= theme.cost;

  return (
    <div className="shop-preview" data-testid="shop-preview">
      <div className="preview-canvas">
        <Canvas dpr={[1, 2]}>
          <FixedCam d={3.4} ty={0.42} />
          <SalonLights />
          <FloorPatch floorId="parke" checkerHalf={3} />
          <WallBack wallId="krem" z={-2.1} />
          <ThemedTable color={theme.color} />
        </Canvas>
      </div>
      <button
        className={`preview-buy${isSel ? ' sel' : ''}`}
        data-testid={`preview-buy-${id}`}
        disabled={isSel || !afford}
        onClick={() => buyCosmetic('table', id, 0)}
      >
        {isSel ? (
          '✓ Seçili'
        ) : owned ? (
          'Uygula'
        ) : (
          <>
            Satın Al · {theme.cost.toLocaleString('tr-TR')} <CoinIcon size={16} />
          </>
        )}
      </button>
    </div>
  );
}
