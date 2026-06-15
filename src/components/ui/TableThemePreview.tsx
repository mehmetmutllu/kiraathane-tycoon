import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGame } from '../../game/store';
import { economyConfig } from '../../config/economy.config';
import { Model } from '../three/Model';
import { CoinIcon } from './icons';

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

// Temalı masa sahnesi: minder + örtü `color`'a boyalı (recolor atlas). "Oyunda nasıl duracaksa öyle".
function PreviewScene({ color }: { color: string }) {
  return (
    <group position={[0, -0.4, 0]}>
      <Model src={`${KAY}table_medium.gltf`} scale={TABLE_SCALE} fallback={null} />
      {/* örtü plakası (tabla üstü) */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {SPOTS.map(([x, z], i) => (
        <Model key={i} src={`${KAY}chair_stool.gltf`} scale={STOOL_SCALE} position={[x, 0, z]} recolor={color} fallback={null} />
      ))}
    </group>
  );
}

/** Masa teması ÖNİZLEME modalı: ortada parmakla DÖNDÜRÜLEBİLİR 3D masa + altında satın al/ücret. */
export function TableThemePreview({ id, onClose }: { id: string; onClose: () => void }) {
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
    <div className="modal-backdrop preview-backdrop" onClick={onClose}>
      <div className="modal-card preview-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{theme.label}</div>
        <div className="preview-canvas">
          <Canvas camera={{ position: [1.7, 1.4, 1.9], fov: 38 }} dpr={[1, 2]}>
            <ambientLight intensity={0.85} />
            <directionalLight position={[3, 5, 2]} intensity={1.1} />
            <PreviewScene color={theme.color} />
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              target={[0, 0.15, 0]}
              minPolarAngle={0.35}
              maxPolarAngle={Math.PI / 2.15}
            />
          </Canvas>
          <span className="preview-hint">Döndürmek için sürükle</span>
        </div>
        <button
          className={`preview-buy${isSel ? ' sel' : ''}`}
          data-testid={`preview-buy-${id}`}
          disabled={isSel || !afford}
          onClick={() => {
            buyCosmetic('table', id, 0);
            onClose();
          }}
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
    </div>
  );
}
