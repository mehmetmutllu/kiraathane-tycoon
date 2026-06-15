import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Model } from './Model';
import { Table } from './Tables';
import { PALETTE } from '../../config/palette';

// PROTOTİP / KATALOG SAYFASI (oyun değil) — ?proto ile açılır.
// 1) KATALOG: tüm sandalye + masa tipleri, numaralı (isimleriyle) → "L3'te #7 olsun" gibi referans.
// 2) Ok tuşları / WASD ile SERBEST gezme (kamera kayar); fare sürükle = döndür, tekerlek = zoom.
// 3) Arkada ŞU ANKİ ilerleme denemesi (L0-L4). Üretime girmez.

const KAY = '/assets/models/kaykit-furniture-bits/';

// [isim, genişlik, derinlik] — hücreye ~1.4 birime normalize edilir (hepsi karşılaştırılabilir görünür).
const PIECES: [string, number, number][] = [
  ['chair_stool_wood', 0.75, 0.75],
  ['chair_stool', 0.75, 0.75],
  ['chair_A_wood', 0.75, 0.85],
  ['chair_A', 0.75, 0.85],
  ['chair_B_wood', 0.75, 0.85],
  ['chair_B', 0.75, 0.85],
  ['chair_C', 0.75, 0.94],
  ['armchair', 1.8, 1.6],
  ['armchair_pillows', 1.8, 1.6],
  ['couch', 3.0, 1.6],
  ['couch_pillows', 3.0, 1.6],
  ['table_small', 1.0, 1.0],
  ['table_medium', 2.0, 2.0],
  ['table_medium_long', 3.0, 2.0],
  ['table_low', 2.4, 1.5],
];
const COLS = 5;
const CELL = 2.4;
const CELL_FIT = 1.5; // her parça en uzun kenarı bu birime gelecek şekilde ölçeklenir

function Tag({ y, top, sub, subColor }: { y: number; top: string; sub: string; subColor?: string }) {
  return (
    <Html position={[0, y, 0]} center distanceFactor={11}>
      <div
        style={{
          fontFamily: 'Baloo 2, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          color: '#fff',
          background: 'rgba(0,0,0,0.6)',
          padding: '3px 7px',
          borderRadius: 7,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {top}
        <div style={{ fontSize: 10, opacity: 0.9, color: subColor ?? '#cbd5e1' }}>{sub}</div>
      </div>
    </Html>
  );
}

// KATALOG: numaralı tüm parçalar (grid).
function Catalog() {
  const rows = Math.ceil(PIECES.length / COLS);
  return (
    <group position={[0, 0, -3]}>
      <Html position={[(-(COLS - 1) / 2) * CELL - 2.2, 1.6, 0]} center distanceFactor={11}>
        <div style={{ fontFamily: 'Lilita One, system-ui', fontSize: 18, color: '#ffd479', whiteSpace: 'nowrap' }}>
          KATALOG
        </div>
      </Html>
      {PIECES.map(([name, w, d], i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = (col - (COLS - 1) / 2) * CELL;
        const z = -row * CELL;
        const scale = CELL_FIT / Math.max(w, d);
        return (
          <group key={name} position={[x, 0, z]}>
            <Model src={`${KAY}${name}.gltf`} scale={scale} fallback={null} />
            <Tag y={1.3} top={`#${i + 1}`} sub={name} />
          </group>
        );
      })}
      {/* katalog zemini (numara satırlarını ayırt etmek için hafif farklı ton) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -((rows - 1) * CELL) / 2]} receiveShadow>
        <planeGeometry args={[COLS * CELL + 2, rows * CELL + 1.5]} />
        <meshStandardMaterial color="#a98a5f" />
      </mesh>
    </group>
  );
}

// ŞU ANKİ ilerleme denemesi (L0-L4) — referans için arkada.
function ProgressionRow({ food, z, title }: { food: boolean; z: number; title: string }) {
  // Renk Sv3'ten varsayılan ara ton (tier değil; altın tema mağazasında). Sv5 yemek = premium sandalye.
  const tierColor = (lvl: number) => (lvl >= 2 ? PALETTE.defaultTone : '');
  const GAP = 3.0; // tabureler iç içe girmesin diye masalar arası boşluk artırıldı
  const MID = 2;
  return (
    <group position={[0, 0, z]}>
      <Html position={[(-MID - 1) * GAP, 1.0, 0]} center distanceFactor={11}>
        <div style={{ fontFamily: 'Lilita One, system-ui', fontSize: 15, color: '#ffd479', whiteSpace: 'nowrap' }}>
          {title}
        </div>
      </Html>
      {[0, 1, 2, 3, 4].map((lvl, i) => (
        <group key={lvl} position={[(i - MID) * GAP, 0, 0]}>
          <Table x={0} z={0} level={lvl} food={food} />
          <Tag y={1.35} top={`Sv ${lvl + 1}`} sub={tierColor(lvl) || 'çıplak'} subColor={tierColor(lvl) || '#cbd5e1'} />
        </group>
      ))}
    </group>
  );
}

// Ok tuşları / WASD ile serbest gezme: kamerayı + orbit hedefini birlikte kaydırır (pan).
function FreeMove({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const keys = useRef<Record<string, boolean>>({});
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const block = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (block.includes(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    const k = keys.current;
    const fwd = new Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-4) return;
    fwd.normalize();
    const right = new Vector3().crossVectors(fwd, new Vector3(0, 1, 0)).normalize();
    const move = new Vector3();
    if (k['KeyW'] || k['ArrowUp']) move.add(fwd);
    if (k['KeyS'] || k['ArrowDown']) move.sub(fwd);
    if (k['KeyD'] || k['ArrowRight']) move.add(right);
    if (k['KeyA'] || k['ArrowLeft']) move.sub(right);
    if (k['KeyE']) move.y += 1;
    if (k['KeyQ']) move.y -= 1;
    if (move.lengthSq() === 0) return;
    move.normalize().multiplyScalar(9 * dt);
    camera.position.add(move);
    c.target.add(move);
    c.update();
  });
  return null;
}

export function FurniturePrototype() {
  const controls = useRef<OrbitControlsImpl | null>(null);
  return (
    <>
      <Canvas shadows camera={{ position: [0, 8, 19], fov: 50 }} gl={{ antialias: true }} dpr={[1, 2]}>
        <color attach="background" args={['#2a2f38']} />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[6, 14, 6]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-18}
          shadow-camera-right={18}
          shadow-camera-top={12}
          shadow-camera-bottom={-18}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#b89a6e" />
        </mesh>
        <Suspense fallback={null}>
          <Catalog />
          <ProgressionRow food={false} z={6} title="ÇAY (deneme)" />
          <ProgressionRow food z={8.5} title="YEMEK (deneme)" />
        </Suspense>
        <OrbitControls ref={controls} target={[0, 0.5, 7.3]} maxPolarAngle={Math.PI / 2.05} />
        <FreeMove controls={controls} />
      </Canvas>
      <div
        style={{
          position: 'fixed',
          left: 12,
          bottom: 12,
          fontFamily: 'Baloo 2, system-ui',
          fontSize: 13,
          color: '#fff',
          background: 'rgba(0,0,0,0.55)',
          padding: '8px 12px',
          borderRadius: 10,
          lineHeight: 1.4,
          pointerEvents: 'none',
        }}
      >
        <b>Serbest gezme:</b> Ok tuşları / WASD = kay · Q/E = alçal/yüksel · Fare sürükle = döndür · Tekerlek = zoom
      </div>
    </>
  );
}
