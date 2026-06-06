import { useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { useGame, LAYOUT, stationSoftMaxLevel, upgradeZoneUnlocked, trayMaxLevel, trayUpgradeZoneUnlocked } from '../../game/store';
import { Player } from './Player';
import { Waiter } from './Waiter';
import { Dishwasher } from './Dishwasher';
import { Dishes } from './Dishes';
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
    const d = 8 * fit;
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
  const readyCups = useGame((s) => s.readyCups);
  return (
    <>
      {LAYOUT.stations.slice(0, stations).map((p, i) => (
        <TeaStation
          key={i}
          position={p}
          level={i === 0 ? stationLevel : 0}
          showBadge={i === 0}
          readyCups={i === 0 ? readyCups : 0}
        />
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

// Bulaşık noktası (Faz 2e): kirli bardaklar burada yıkanır. Üstünde dur → taşınan kirliler temize döner.
function DishStation() {
  const [x, , z] = LAYOUT.dishStation;
  return (
    <group position={[x, 0, z]}>
      {/* tezgah */}
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.4, 0.9, 0.8]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>
      {/* lavabo çukuru */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[1.0, 0.12, 0.5]} />
        <meshStandardMaterial color="#90a4ae" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* musluk */}
      <mesh castShadow position={[0, 1.15, -0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color="#b0bec5" metalness={0.6} roughness={0.3} />
      </mesh>
      <Html position={[0, 1.7, 0]} center distanceFactor={9} pointerEvents="none" zIndexRange={[5, 0]}>
        <div className="badge3d">🧼 Bulaşık</div>
      </Html>
    </group>
  );
}

// Mekânsal tepsi yükseltme noktası (Faz 2e-B): giriş önünde. Üstünde dur → kapasite 2→4→6 (Faz 2f max 6).
function TrayUpgradeZone() {
  const trayLevel = useGame((s) => s.trayLevel);
  const padsDone = useGame((s) => s.padsDone);
  const tables = useGame((s) => s.tables);
  const stationLevel = useGame((s) => s.stationLevel);
  const lifetime = useGame((s) => s.lifetime);
  if (trayLevel >= trayMaxLevel()) return null;
  if (!trayUpgradeZoneUnlocked({ padsDone, tables, stationLevel, lifetime: lifetime.toNumber() })) return null;
  const [x, , z] = LAYOUT.trayUpgradeZone;
  return (
    <group position={[x, 0, z]}>
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 32]} />
        <meshStandardMaterial color="#12466b" />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 32]} />
        <meshStandardMaterial color="#4fc3f7" emissive="#0288d1" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[0.22, 0.45, 4]} />
        <meshStandardMaterial color="#4fc3f7" emissive="#0288d1" emissiveIntensity={0.5} />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={9} zIndexRange={[5, 0]}>
        <div className="badge3d">🫖 Tepsi</div>
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
      <DishStation />
      <Tables />
      <Pad />
      <UpgradeZone />
      <TrayUpgradeZone />
      <Customers />
      <Coins />
      <Dishes />
      <Player />
      <Waiter />
      <Dishwasher />
      <CameraRig />
      <Simulation />
    </Canvas>
  );
}
