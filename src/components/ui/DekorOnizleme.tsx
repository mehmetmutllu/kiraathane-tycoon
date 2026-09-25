import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Canvas } from '@react-three/fiber';
import { KareTavani } from '../three/KareTavani';
import { useGame } from '../../game/store';
import { dekorAcik, vitrinUrunu } from '../../game/vitrin';
import { dekorKaresi } from '../three/DekorCekimi';
import { DUVAR_PAYI, duvarProfili, vitrinYuva } from '../../config/decor';
import { PREVIEW_GL } from '../../config/palette';
import { DekorGovde } from '../three/VitrinDekor';
import { GOVDE } from '../three/vitrinDekorLook';
import { FixedCam, SalonLights, FloorPatch, WallBack } from './SalonSlice';

const abone = (f: () => void) => {
  dekorKaresi.dinleyiciler.add(f);
  return () => dekorKaresi.dinleyiciler.delete(f);
};
const surum = () => dekorKaresi.surum;

/**
 * SALONDAKİ YERİNDE (F4c-4 · D-157): ana sahnenin ayrı kamerayla çekilmiş karesi (`DekorCekimi`).
 * Paylaşılan tuval kutuya takılır; kutu kendi en/boy oranını yazar ki çekim kırpılmadan otursun.
 */
function SalondaOnizleme() {
  const kutu = useRef<HTMLDivElement>(null);
  const kare = useSyncExternalStore(abone, surum);
  useEffect(() => {
    const el = kutu.current;
    const t = dekorKaresi.tuval;
    if (!el || !t) return;
    t.className = 'dekor-kare';
    el.appendChild(t);
    const olc = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) dekorKaresi.enBoy = el.clientWidth / el.clientHeight;
    };
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => {
      ro.disconnect();
      t.remove();
    };
  }, []);
  return <div className="preview-canvas" ref={kutu} data-testid="dekor-salonda" data-kare={kare} />;
}

/**
 * 💎 DEKOR ÖNİZLEMESİ (F4c-2) — mağazanın Dekor sekmesi. `SahipOnizleme` ile aynı sahne (oyunun
 * kamerası, ışığı, zemini, duvarı); eşya salonda çizilen bileşenin AYNISI (`DekorGovde`), duvara
 * salondaki payla yaslanır. Kamera eşyanın boyuna göre yaklaşır: saat ile koltuk aynı karede okunsun.
 */
export function DekorOnizleme({ id }: { id: string }) {
  // Yuvasının salonu açıksa eşya salondaki YERİNDE gösterilir; kapalıysa (kilitli dekor) yalıtık vitrin.
  const salonda = useGame((s) => dekorAcik(id, s.areasOpen));
  if (salonda) {
    return (
      <div className="shop-preview" data-testid="dekor-onizleme">
        <SalondaOnizleme />
      </div>
    );
  }
  return <YalitikOnizleme id={id} />;
}

/** F4c-2'nin yalıtık vitrini — yuvanın salonu henüz açılmamış (kilitli) dekor için. */
function YalitikOnizleme({ id }: { id: string }) {
  const floorId = useGame((s) => s.floorThemeByArea[0] ?? 'parke');
  const wallId = useGame((s) => s.wallThemeByArea[0] ?? 'krem');
  const yuvaId = vitrinUrunu('decor', id)?.yuva ?? '';
  const y = vitrinYuva(yuvaId);
  const g = GOVDE[yuvaId];
  if (!y || !g) return null;
  const tepe = y.y0 + g.maxY;
  // Oyuncu önizlemesi 1,75 boy için d = 2,6 kullanıyor (oran ~1,5); eşya da aynı oranda sığar.
  const d = Math.max(2.2, Math.max(g.maxX - g.minX, tepe) * 1.7);
  return (
    <div className="shop-preview" data-testid="dekor-onizleme">
      <div className="preview-canvas">
        <Canvas dpr={[1, 1.5]} gl={PREVIEW_GL} frameloop="never">
          <KareTavani />
          <FixedCam d={d} ty={Math.max(0.4, tepe * 0.5)} />
          <SalonLights />
          <FloorPatch floorId={floorId} checkerHalf={3} />
          <WallBack wallId={wallId} z={-(duvarProfili(y.y0, y.y1) + DUVAR_PAYI)} width={8} />
          <group position={[0, y.y0, 0]}>
            <DekorGovde yuva={yuvaId} id={id} />
          </group>
        </Canvas>
      </div>
    </div>
  );
}
