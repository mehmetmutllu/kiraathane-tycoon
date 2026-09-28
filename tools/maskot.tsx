/**
 * maskot.tsx — mağaza görselleri için oyunun KENDİ karakterini saydam zeminde büyük çizer (dev aracı,
 * oyuna girmez). Karakter `KayActor`den gelir: salonda gördüğün çaycı/garsonla birebir aynı gövde.
 * Adres (kare sunucusu): /tools/maskot.html?kim=owner|waiter&aci=-0.5&tepsi=6
 * Çekim: tools/magaza-gorsel.mjs (omitBackground → alfalı PNG).
 */
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { KayActor } from '../src/components/three/KayActor';
import { CupTray, tepsiKaymasi } from '../src/components/three/Player';
import { SalonLights } from '../src/components/ui/SalonSlice';

const q = new URLSearchParams(location.search);
const kim = (q.get('kim') ?? 'owner') as 'owner' | 'waiter';
const aci = Number(q.get('aci') ?? -0.5);
const cay = Number(q.get('tepsi') ?? 6);

// eslint-disable-next-line react-refresh/only-export-components -- tek seferlik çekim sayfası, hızlı yenileme gerekmez
function Hazir() {
  (window as unknown as { MASKOT_HAZIR?: boolean }).MASKOT_HAZIR = true;
  return null;
}

createRoot(document.getElementById('kok')!).render(
  <Canvas
    gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
    camera={{ position: [0, 1.3, 4.2], fov: 30 }}
    onCreated={({ gl, camera }) => {
      gl.setClearColor(0x000000, 0);
      camera.lookAt(0, 0.78, 0);
    }}
  >
    <SalonLights />
    <Suspense fallback={null}>
      <group rotation={[0, aci, 0]}>
        <KayActor kind={kim} tasiyor>
          <group position={tepsiKaymasi('klasik')}>
            <CupTray tea={cay} dirty={0} cap={cay} />
          </group>
        </KayActor>
      </group>
      <Hazir />
    </Suspense>
  </Canvas>,
);
