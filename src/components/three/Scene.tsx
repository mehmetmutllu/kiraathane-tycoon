import { useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGame, LAYOUT } from '../../game/store';
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

// Açık çaydanlık yerlerini çiz (stations sayısına göre).
function Stations() {
  const stations = useGame((s) => s.stations);
  return (
    <>
      {LAYOUT.stations.slice(0, stations).map((p, i) => (
        <TeaStation key={i} position={p} />
      ))}
    </>
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
      <Customers />
      <Coins />
      <Player />
      <CameraRig />
      <Simulation />
    </Canvas>
  );
}
