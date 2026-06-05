import { useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { useGame, LAYOUT, stationSoftMaxLevel, upgradeZoneUnlocked } from '../../game/store';
import { Player } from './Player';
import { Tables } from './Tables';
import { TeaStation } from './TeaStation';
import { Customers } from './Customers';
import { Coins } from './Coins';
import { Pad } from './Pad';

// Simülasyonu her karede ilerlet (tek kaynak; __advanceTime aynı tick'i çağırır).
function Simulation() {
  const tick = useGame((s) => s.tick);
  useFrame((_, dt) => tick(dt));
  return null;
}

// Kamera sahip karakterini yumuşak takip eder (omuz-üstü izometrik).
// Ekran oranına göre çerçeveler: portrait (dar) → kamera geri çekilir; landscape → normal.
// Yön kilidi yok; çevirince otomatik uyum sağlar.
function CameraRig() {
  const { camera, size } = useThree();
  const target = useMemo(() => new Vector3(), []);
  const desired = useMemo(() => new Vector3(), []);
  useFrame((_, dt) => {
    const p = useGame.getState().player;
    const aspect = size.width / Math.max(1, size.height);
    const fit = aspect < 1 ? Math.min(1.7, Math.max(1, 1 / aspect)) : 1;
    const d = 9 * fit;
    target.set(p[0], 0.6, p[2]);
    desired.set(p[0], d, p[2] + d);
    camera.position.lerp(desired, Math.min(1, dt * 4));
    camera.lookAt(target);
  });
  return null;
}

// Açık çay ocaklarını çiz; ana ocak (i=0) seviye + rozet gösterir.
function Stations() {
  const stations = useGame((s) => s.stations);
  const stationLevel = useGame((s) => s.stationLevel);
  return (
    <>
      {LAYOUT.stations.slice(0, stations).map((p, i) => (
        <TeaStation key={i} position={p} level={i === 0 ? stationLevel : 0} showBadge={i === 0} />
      ))}
    </>
  );
}

// Mekânsal çay yükseltme noktası (ana ocağın önünde). Üstünde dur → altta bar dolar.
function UpgradeZone() {
  const stationLevel = useGame((s) => s.stationLevel);
  const padsDone = useGame((s) => s.padsDone);
  const tables = useGame((s) => s.tables);
  const lifetime = useGame((s) => s.lifetime);
  if (stationLevel >= stationSoftMaxLevel()) return null;
  if (!upgradeZoneUnlocked({ padsDone, tables, stationLevel, lifetime: lifetime.toNumber() })) return null;
  const [x, , z] = LAYOUT.upgradeZone;
  return (
    <group position={[x, 0, z]}>
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 32]} />
        <meshStandardMaterial color="#7a5c12" />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 32]} />
        <meshStandardMaterial color="#ffd54f" emissive="#ffb300" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.22, 0.45, 4]} />
        <meshStandardMaterial color="#ffd54f" emissive="#ffb300" emissiveIntensity={0.5} />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={9} zIndexRange={[5, 0]}>
        <div className="badge3d gold">☕ Yükselt</div>
      </Html>
    </group>
  );
}

function Ground() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[18, 18]} />
      <meshStandardMaterial color="#cfb997" />
    </mesh>
  );
}

function Walls() {
  const b = LAYOUT.bounds + 1;
  const h = 1.2;
  const common = { color: '#a1887f' } as const;
  return (
    <group>
      <mesh position={[0, h / 2, -b]}>
        <boxGeometry args={[b * 2, h, 0.2]} />
        <meshStandardMaterial {...common} />
      </mesh>
      <mesh position={[-b, h / 2, 0]}>
        <boxGeometry args={[0.2, h, b * 2]} />
        <meshStandardMaterial {...common} />
      </mesh>
      <mesh position={[b, h / 2, 0]}>
        <boxGeometry args={[0.2, h, b * 2]} />
        <meshStandardMaterial {...common} />
      </mesh>
    </group>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 9, 11], fov: 50 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#1f2933']} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[6, 12, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <Ground />
      <Walls />
      <Stations />
      <Tables />
      <Pad />
      <UpgradeZone />
      <Customers />
      <Coins />
      <Player />
      <CameraRig />
      <Simulation />
    </Canvas>
  );
}
