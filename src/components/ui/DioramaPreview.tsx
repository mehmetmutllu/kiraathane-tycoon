import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGame } from '../../game/store';
import { economyConfig } from '../../config/economy.config';
import { FLOOR_THEMES, WALL_THEMES } from '../../config/palette';
import { Model } from '../three/Model';
import { CoinIcon } from './icons';

const KAY = '/assets/models/kaykit-furniture-bits/';

// Köşe diorama: seçilen zemin + duvar BAĞLAMDA (zemin altta, L-duvar arkada, referans masa).
function DioramaScene({ floorId, wallId }: { floorId: string; wallId: string }) {
  const f = FLOOR_THEMES[floorId] ?? FLOOR_THEMES.parke;
  const w = WALL_THEMES[wallId] ?? WALL_THEMES.krem;
  return (
    <group position={[0, -0.55, 0]}>
      {/* zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color={f.base} />
      </mesh>
      {/* dama temasında birkaç alt-renk kare (bağlam) */}
      {f.kind === 'checker' &&
        ([
          [-0.75, -0.75],
          [0.75, 0.75],
          [-0.75, 0.75],
          [0.75, -0.75],
        ] as [number, number][]).map(([x, z], i) =>
          (i < 2 ? (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, z]}>
              <planeGeometry args={[1.5, 1.5]} />
              <meshStandardMaterial color={f.alt} />
            </mesh>
          ) : null),
        )}
      {/* arka duvar (krem + alt lambri) */}
      <mesh position={[0, 0.75, -1.5]}>
        <boxGeometry args={[3, 1.5, 0.1]} />
        <meshStandardMaterial color={w.cream} />
      </mesh>
      <mesh position={[0, 0.22, -1.44]}>
        <boxGeometry args={[3, 0.44, 0.12]} />
        <meshStandardMaterial color={w.wainscot} />
      </mesh>
      {/* yan duvar (L köşe) */}
      <mesh position={[-1.5, 0.75, 0]}>
        <boxGeometry args={[0.1, 1.5, 3]} />
        <meshStandardMaterial color={w.cream} />
      </mesh>
      <mesh position={[-1.44, 0.22, 0]}>
        <boxGeometry args={[0.12, 0.44, 3]} />
        <meshStandardMaterial color={w.wainscot} />
      </mesh>
      {/* referans masa (ölçek/bağlam) */}
      <Model src={`${KAY}table_small.gltf`} scale={[0.5, 0.5, 0.5]} position={[0.35, 0, 0.35]} fallback={null} />
    </group>
  );
}

/** Zemin/Duvar diorama ÖNİZLEME modalı: bağlamlı köşe (döndürülebilir) + per-salon satın al butonları. */
export function DioramaPreview({ kind, id, onClose }: { kind: 'floor' | 'wall'; id: string; onClose: () => void }) {
  const zonesOpen = useGame((s) => s.zonesOpen);
  const floorThemeByZone = useGame((s) => s.floorThemeByZone);
  const wallThemeByZone = useGame((s) => s.wallThemeByZone);
  const wallet = useGame((s) => s.wallet);
  const ownedCosmetics = useGame((s) => s.ownedCosmetics);
  const buyCosmetic = useGame((s) => s.buyCosmetic);
  const themes = kind === 'floor' ? economyConfig.cosmetics.floorThemes : economyConfig.cosmetics.wallThemes;
  const theme = themes.find((t) => t.id === id);
  if (!theme) return null;
  const selected = kind === 'floor' ? floorThemeByZone : wallThemeByZone;
  const floorId = kind === 'floor' ? id : (floorThemeByZone[0] ?? 'parke');
  const wallId = kind === 'wall' ? id : (wallThemeByZone[0] ?? 'krem');
  const cash = wallet.toNumber();

  return (
    <div className="modal-backdrop preview-backdrop" onClick={onClose}>
      <div className="modal-card preview-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{theme.label}</div>
        <div className="preview-canvas">
          <Canvas camera={{ position: [2.4, 2.0, 2.6], fov: 38 }} dpr={[1, 2]}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[3, 6, 3]} intensity={1.0} />
            <DioramaScene floorId={floorId} wallId={wallId} />
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              target={[0, 0, 0]}
              minPolarAngle={0.25}
              maxPolarAngle={Math.PI / 2.2}
            />
          </Canvas>
          <span className="preview-hint">Döndürmek için sürükle</span>
        </div>
        <div className="preview-zones">
          {Array.from({ length: zonesOpen }, (_, z) => {
            const isSel = selected[z] === id;
            const owned = theme.cost === 0 || ownedCosmetics.includes(`${kind}:${id}:z${z}`);
            const afford = owned || cash >= theme.cost;
            return (
              <button
                key={z}
                className={`shop-zone-btn${isSel ? ' sel' : ''}`}
                data-testid={`preview-${kind}-${id}-z${z}`}
                disabled={isSel || !afford}
                onClick={() => buyCosmetic(kind, id, z)}
              >
                {isSel ? '✓ ' : ''}Salon {z + 1}
              </button>
            );
          })}
        </div>
        {theme.cost > 0 && (
          <div className="preview-price">
            <CoinIcon size={14} /> {theme.cost.toLocaleString('tr-TR')} / salon
          </div>
        )}
      </div>
    </div>
  );
}
