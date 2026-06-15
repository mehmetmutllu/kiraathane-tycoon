import { Canvas } from '@react-three/fiber';
import { useGame } from '../../game/store';
import { economyConfig } from '../../config/economy.config';
import { Table } from '../three/Tables';
import { CoinIcon } from './icons';
import { FixedCam, SalonLights, FloorPatch, WallCornerL } from './SalonSlice';

/** Zemin/Duvar SAYFA-İÇİ önizleme: oyunun kamera açısı/duruşu/uzaklığıyla salon köşesinden bir kesit
 *  (gerçek zemin + duvar + referans masa) + per-salon satın al. "Salondan kes-yapıştır" hissi. */
export function DioramaPreview({ kind, id }: { kind: 'floor' | 'wall'; id: string }) {
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
    <div className="shop-preview" data-testid="shop-preview">
      <div className="preview-canvas">
        <Canvas dpr={[1, 2]}>
          <FixedCam d={4.0} ty={0.5} />
          <SalonLights />
          <FloorPatch floorId={floorId} half={2.4} />
          <WallCornerL wallId={wallId} half={2.4} />
          {/* referans masa (ölçek/bağlam) — gerçek oyun masası, köşede */}
          <Table x={0.5} z={0.6} level={1} />
        </Canvas>
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
  );
}
