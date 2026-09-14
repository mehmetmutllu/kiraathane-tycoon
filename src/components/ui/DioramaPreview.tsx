import { Canvas } from '@react-three/fiber';
import { useGame } from '../../game/store';
import { PREVIEW_GL } from '../../config/palette';
import { Table } from '../three/Tables';
import { FixedCam, SalonLights, FloorPatch, WallBack } from './SalonSlice';

/**
 * Zemin/Duvar önizlemesi — M2 (D-106): yalnız VİTRİN. Oyunun kamera açısı/duruşu/uzaklığıyla
 * salon köşesinden bir kesit (gerçek zemin + duvar + referans masa), "salondan kes-yapıştır".
 *
 * Salon seçimi ve satın alma buradan ÇIKTI: eskiden her açık salon için ayrı bir düğme vardı
 * (üç salon = üç düğme) ve "tek büyük satın alma" (M2) böyle kurulamıyordu. Artık salon bir
 * SEÇİM şeridi, alma tek düğme — ikisi de `ShopPanel`in.
 */
export function DioramaPreview({ kind, id }: { kind: 'floor' | 'wall'; id: string }) {
  const floorThemeByArea = useGame((s) => s.floorThemeByArea);
  const wallThemeByArea = useGame((s) => s.wallThemeByArea);
  const floorId = kind === 'floor' ? id : (floorThemeByArea[0] ?? 'parke');
  const wallId = kind === 'wall' ? id : (wallThemeByArea[0] ?? 'krem');

  return (
    <div className="shop-preview" data-testid="shop-preview">
      <div className="preview-canvas">
        <Canvas dpr={[1, 2]} gl={PREVIEW_GL}>
          <FixedCam d={4.4} ty={0.5} />
          <SalonLights />
          <FloorPatch floorId={floorId} checkerHalf={4} />
          <WallBack wallId={wallId} z={-2.6} />
          {/* referans masa (ölçek/bağlam) — gerçek oyun masası, önde-merkez */}
          <Table x={0.4} z={0.5} level={1} />
        </Canvas>
      </div>
    </div>
  );
}
