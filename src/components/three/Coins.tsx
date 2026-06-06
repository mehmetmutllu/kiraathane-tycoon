import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import { useGame } from '../../game/store';

// Para mıknatısı/süzülmesi STORE'da gerçek hareket olarak yapılır (oyuncuya akar + yaklaşınca toplanır);
// burada mesh yalnız o anki konumu (x,z) çizer → görsel = mantık. Doğuş pop'u + dönüş görsel tuz-biber.
function Coin({ x, z }: { x: number; z: number }) {
  const ref = useRef<Group>(null);
  const coin = useRef<Mesh>(null);
  const spawn = useRef(0); // doğuş pop'u (0→1 ölçek)
  useFrame((_, dt) => {
    if (ref.current) {
      spawn.current = Math.min(1, spawn.current + dt * 6);
      ref.current.scale.setScalar(spawn.current * (1 - 0.15 * Math.sin(spawn.current * Math.PI)));
    }
    if (coin.current) coin.current.rotation.y += dt * 3; // sikke döner
  });
  return (
    <group ref={ref} position={[x, 0.3, z]} scale={0}>
      <mesh ref={coin} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
}

// Toplanınca yükselip solan "+₺" yazısı (CSS animasyonu floatUp; ~0.9s sonra kaldırılır).
function MoneyFloater({ x, z, value, onDone }: { x: number; z: number; value: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <group position={[x, 1.3, z]}>
      <Html center distanceFactor={9} pointerEvents="none" zIndexRange={[5, 0]}>
        <div className="floater">+₺{value}</div>
      </Html>
    </group>
  );
}

// Yere düşen ₺ paralar — sahip üstünden geçince toplanır (store), toplanınca "+₺" floater belirir.
export function Coins() {
  const coins = useGame((s) => s.coins);
  const prev = useRef<Map<number, { x: number; z: number; value: number }>>(new Map());
  const [floaters, setFloaters] = useState<{ id: number; x: number; z: number; value: number }[]>([]);

  useEffect(() => {
    const cur = new Map(coins.map((c) => [c.id, { x: c.pos[0], z: c.pos[2], value: c.value }]));
    // Önceki karede olup şimdi olmayan = toplandı (lifetime 0 → tek kaybolma nedeni toplama).
    const collected: { id: number; x: number; z: number; value: number }[] = [];
    const p = useGame.getState().player;
    for (const [id, info] of prev.current) {
      if (!cur.has(id)) collected.push({ id, x: p[0], z: p[2], value: info.value });
    }
    prev.current = cur;
    if (collected.length) setFloaters((f) => [...f, ...collected]);
  }, [coins]);

  return (
    <>
      {coins.map((c) => (
        <Coin key={c.id} x={c.pos[0]} z={c.pos[2]} />
      ))}
      {floaters.map((f) => (
        <MoneyFloater
          key={f.id}
          x={f.x}
          z={f.z}
          value={f.value}
          onDone={() => setFloaters((fs) => fs.filter((x) => x.id !== f.id))}
        />
      ))}
    </>
  );
}
