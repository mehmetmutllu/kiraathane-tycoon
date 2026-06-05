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
function CameraRig() {
  const { camera } = useThree();
  const target = new Vector3();
  const desired = new Vector3();
  useFrame((_, dt) => {
    const p = useGame.getState().player;
    target.set(p[0], 0.6, p[2]);
    desired.set(p[0], 9, p[2] + 9);
    camera.position.lerp(desired, Math.min(1, dt * 4));
    camera.lookAt(target);
  });
  return null;
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
      <TeaStation />
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
