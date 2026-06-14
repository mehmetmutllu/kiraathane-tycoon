// GEZİLEBİLİR GREYBOX PREVIEW (?layout) — yeniden tasarım planının (docs/yeniden-tasarim-plani-2026-06-14)
// mekânsal taslağı. ÇALIŞAN OYUNA DOKUNMAZ: kendi Canvas'ı + kendi yürüme kontrolü (store yok).
// Amaç: yeni alan yerleşimini (2 salon + maç + bahçe + per-salon ocak + WC/depo + merdiven) içinde gezerek
// onaylamak. Primitive greybox (D-013 stili). Onaylanınca gerçek LAYOUT refactor'ı yapılır.
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3, type Mesh } from 'three';
import { PALETTE } from '../config/palette';

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
type Input = { x: number; z: number };

// --- Alan tanımları (kuş bakışı; x sağ, z ön/arka — -z arka duvar, +z giriş) ---
type Area = { id: string; label: string; x0: number; x1: number; z0: number; z1: number; color: string; ocak?: boolean; garden?: boolean };
const AREAS: Area[] = [
  { id: 'salon1', label: 'ANA SALON', x0: -11, x1: -4.5, z0: -3, z1: 2.5, color: '#caa46b', ocak: true },
  { id: 'salon2', label: '2. SALON', x0: -11, x1: -4.5, z0: 2.5, z1: 8, color: '#bd9a63', ocak: true },
  { id: 'mac', label: 'MAÇ ALANI', x0: -4, x1: 4, z0: -3, z1: 3.5, color: '#9a8557', ocak: true },
  { id: 'bahce', label: 'ÇAY BAHÇESİ', x0: 4.5, x1: 12, z0: -3, z1: 4, color: '#6f8f55', ocak: true, garden: true },
];

function Floor({ a }: { a: Area }) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[(a.x0 + a.x1) / 2, 0.01, (a.z0 + a.z1) / 2]}>
      <planeGeometry args={[a.x1 - a.x0, a.z1 - a.z0]} />
      <meshStandardMaterial color={a.color} />
    </mesh>
  );
}

function Wall({ x, z, w, d, h = 1.2 }: { x: number; z: number; w: number; d: number; h?: number }) {
  return (
    <mesh castShadow receiveShadow position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={PALETTE.wallCream} />
    </mesh>
  );
}

function Ocak({ x, z }: { x: number; z: number }) {
  // Salon ocağı (greybox): tezgâh + semaver silindiri.
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.6, 0.9, 0.7]} />
        <meshStandardMaterial color={PALETTE.wainscot} />
      </mesh>
      <mesh castShadow position={[0.45, 1.15, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.5, 12]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.6} roughness={0.35} />
      </mesh>
      <Label pos={[0, 1.7, 0]} text="OCAK" small />
    </group>
  );
}

function TeaTable({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.95, 0.07, 0.95]} />
        <meshStandardMaterial color={PALETTE.tableWood} />
      </mesh>
      {[-0.38, 0.38].flatMap((lx) =>
        [-0.38, 0.38].map((lz) => (
          <mesh key={`${lx}${lz}`} castShadow position={[lx, 0.24, lz]}>
            <boxGeometry args={[0.07, 0.48, 0.07]} />
            <meshStandardMaterial color={PALETTE.tableLeg} />
          </mesh>
        )),
      )}
      {[[-0.7, 0], [0.7, 0], [0, -0.7], [0, 0.7]].map(([sx, sz], i) => (
        <mesh key={i} castShadow position={[sx, 0.21, sz]}>
          <cylinderGeometry args={[0.17, 0.2, 0.42, 10]} />
          <meshStandardMaterial color={PALETTE.stool} />
        </mesh>
      ))}
    </group>
  );
}

function Plant({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.44, 8]} />
        <meshStandardMaterial color={PALETTE.planter} />
      </mesh>
      <mesh castShadow position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshStandardMaterial color={PALETTE.plant} />
      </mesh>
    </group>
  );
}

function Label({ pos, text, small }: { pos: [number, number, number]; text: string; small?: boolean }) {
  return (
    <group position={pos}>
      <Html center distanceFactor={small ? 14 : 10} pointerEvents="none" zIndexRange={[10, 0]}>
        <div
          style={{
            font: `800 ${small ? 13 : 20}px Baloo 2, system-ui, sans-serif`,
            color: '#fff',
            background: 'rgba(0,0,0,0.45)',
            padding: small ? '2px 6px' : '4px 12px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          {text}
        </div>
      </Html>
    </group>
  );
}

// Maç alanı TV duvarı + sıralar
function MatchArea() {
  return (
    <group>
      <mesh castShadow position={[0, 1.4, -2.9]}>
        <boxGeometry args={[3.2, 1.8, 0.12]} />
        <meshStandardMaterial color="#1c2733" emissive="#26506e" emissiveIntensity={0.5} />
      </mesh>
      {[-1.2, 0.2, 1.6].map((z) => (
        <mesh key={z} castShadow position={[0, 0.3, z]}>
          <boxGeometry args={[3.0, 0.45, 0.5]} />
          <meshStandardMaterial color={PALETTE.stool} />
        </mesh>
      ))}
    </group>
  );
}

// WC odası (fotoğraf kalıbı): kabinler + lavabo + kağıt yuvarlakları + DEPO
function WCRoom() {
  return (
    <group position={[9.5, 0, -5]}>
      {/* oda zemini (fayans tonu) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[5, 3.2]} />
        <meshStandardMaterial color="#67b6c9" />
      </mesh>
      {/* 3 kabin bölmesi */}
      {[-1.5, 0, 1.5].map((x) => (
        <group key={x} position={[x, 0, -0.6]}>
          <mesh castShadow position={[0.75, 0.6, 0]}>
            <boxGeometry args={[0.08, 1.2, 1.4]} />
            <meshStandardMaterial color={PALETTE.doorWood} />
          </mesh>
          {/* klozet */}
          <mesh castShadow position={[0, 0.4, -0.4]}>
            <boxGeometry args={[0.4, 0.5, 0.5]} />
            <meshStandardMaterial color="#f4f4f4" />
          </mesh>
          {/* kağıt yuvarlağı (önünde) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0.9]}>
            <ringGeometry args={[0.22, 0.32, 20]} />
            <meshStandardMaterial color="#ffce54" />
          </mesh>
        </group>
      ))}
      {/* lavabo sırası */}
      <mesh castShadow position={[0, 0.5, 1.3]}>
        <boxGeometry args={[3.6, 0.2, 0.4]} />
        <meshStandardMaterial color="#90a4ae" metalness={0.4} roughness={0.5} />
      </mesh>
      <Label pos={[0, 1.7, 0]} text="WC" small />
    </group>
  );
}

function Depot() {
  return (
    <group position={[5.6, 0, -5.4]}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[1.6, 1.2, 1.4]} />
        <meshStandardMaterial color={PALETTE.wainscot} />
      </mesh>
      <Label pos={[0, 1.7, 0]} text="DEPO (kağıt)" small />
    </group>
  );
}

function Stairs() {
  return (
    <group position={[-9.5, 0, -5]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} castShadow position={[0, 0.15 + i * 0.25, -0.7 + i * 0.4]}>
          <boxGeometry args={[2.2, 0.25, 0.5]} />
          <meshStandardMaterial color={PALETTE.wainscot} />
        </mesh>
      ))}
      <Label pos={[0, 2.0, 0]} text="ÜST KAT ↑ (oyun salonu)" small />
    </group>
  );
}

function Walker({ inputRef }: { inputRef: React.RefObject<Input> }) {
  const { camera } = useThree();
  const ref = useRef<Mesh>(null);
  const pos = useRef(new Vector3(0, 0.6, 6.5));
  const tmp = useRef(new Vector3());
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const i = inputRef.current ?? { x: 0, z: 0 };
    const speed = 5;
    pos.current.x = clamp(pos.current.x + i.x * speed * dt, -10.5, 11.5);
    pos.current.z = clamp(pos.current.z + i.z * speed * dt, -6, 8.5);
    if (ref.current) ref.current.position.set(pos.current.x, 0.6, pos.current.z);
    const d = 9;
    const a = 1 - Math.exp(-8 * dt);
    camera.position.lerp(tmp.current.set(pos.current.x, d, pos.current.z + d), a);
    camera.lookAt(pos.current.x, 0.6, pos.current.z);
  });
  return (
    <mesh ref={ref} position={[0, 0.6, 6.5]} castShadow>
      <capsuleGeometry args={[0.3, 0.6, 6, 10]} />
      <meshStandardMaterial color={PALETTE.shirt} />
    </mesh>
  );
}

export function LayoutPreview() {
  const inputRef = useRef<Input>({ x: 0, z: 0 });
  const [stick, setStick] = useState<{ ox: number; oy: number; kx: number; ky: number } | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  // klavye (WASD/oklar) → inputRef
  useEffect(() => {
    const pressed = new Set<string>();
    const MAP: Record<string, [number, number]> = {
      KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
      KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
    };
    const apply = () => {
      let x = 0, z = 0;
      for (const c of pressed) { const v = MAP[c]; if (v) { x += v[0]; z += v[1]; } }
      const m = Math.hypot(x, z) || 1;
      inputRef.current = { x: x / m, z: z / m };
    };
    const down = (e: KeyboardEvent) => { if (MAP[e.code]) { pressed.add(e.code); apply(); } };
    const up = (e: KeyboardEvent) => { if (pressed.delete(e.code)) apply(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const R = 55;
  const move = (cx: number, cy: number) => {
    const o = origin.current; if (!o) return;
    let dx = cx - o.x, dy = cy - o.y;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    setStick({ ox: o.x, oy: o.y, kx: dx, ky: dy });
    inputRef.current = { x: +(dx / R).toFixed(3), z: +(dy / R).toFixed(3) };
  };
  const end = () => { origin.current = null; setStick(null); inputRef.current = { x: 0, z: 0 }; };

  return (
    <div className="app">
      <Canvas shadows camera={{ position: [0, 9, 15], fov: 50 }} gl={{ antialias: true }} dpr={[1, 2]}>
        <color attach="background" args={['#1f2933']} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 12, 6]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        {/* zemin (taban ahşap) */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0, 1]}>
          <planeGeometry args={[30, 22]} />
          <meshStandardMaterial color={PALETTE.floorWood} />
        </mesh>
        {AREAS.map((a) => (
          <group key={a.id}>
            <Floor a={a} />
            <Label pos={[(a.x0 + a.x1) / 2, 2.2, (a.z0 + a.z1) / 2]} text={a.label} />
            {a.ocak && <Ocak x={(a.x0 + a.x1) / 2} z={a.z0 + 0.6} />}
          </group>
        ))}
        {/* salon masaları */}
        {[[-9, 0], [-6, 0], [-9, 5], [-6, 5]].map(([x, z], i) => <TeaTable key={`t${i}`} x={x} z={z} />)}
        {/* bahçe: masalar + bitkiler */}
        {[[6.5, 0], [9.5, 0], [6.5, 2.5], [9.5, 2.5]].map(([x, z], i) => <TeaTable key={`g${i}`} x={x} z={z} />)}
        {[[5, -2], [11.5, -2], [11.5, 3.5]].map(([x, z], i) => <Plant key={`p${i}`} x={x} z={z} />)}
        <MatchArea />
        <WCRoom />
        <Depot />
        <Stairs />
        {/* dış duvarlar (ön cephede giriş boşluğu) */}
        <Wall x={-11.3} z={1} w={0.3} d={16} />
        <Wall x={12.3} z={1} w={0.3} d={16} />
        <Wall x={0.5} z={-6.9} w={24} d={0.3} />
        <Wall x={-7} z={9.1} w={8.5} d={0.3} />
        <Wall x={7.5} z={9.1} w={9} d={0.3} />
        <Label pos={[0.5, 1.4, 9.1]} text="GİRİŞ" small />
        <Walker inputRef={inputRef} />
      </Canvas>
      {/* dokunmatik gez katmanı + bilgi */}
      <div
        className="touch-layer"
        data-testid="preview-touch"
        onPointerDown={(e) => { origin.current = { x: e.clientX, y: e.clientY }; setStick({ ox: e.clientX, oy: e.clientY, kx: 0, ky: 0 }); }}
        onPointerMove={(e) => { if (origin.current) move(e.clientX, e.clientY); }}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {stick && (
          <div className="joystick" style={{ left: stick.ox, top: stick.oy }}>
            <div className="joystick-knob" style={{ transform: `translate(${stick.kx}px, ${stick.ky}px)` }} />
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', top: 10, left: 10, font: '700 13px Baloo 2, system-ui', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '6px 10px', borderRadius: 8, pointerEvents: 'none' }}>
        GREYBOX PREVIEW — WASD / sürükle ile gez · yeniden-tasarım-plani-2026-06-14
      </div>
    </div>
  );
}
