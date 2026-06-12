import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CylinderGeometry, MeshStandardMaterial, type Group, type Mesh } from 'three';
import { useGame } from '../../game/store';

// FPS (turu-5 m.13): geometry + material TÜM coin'lerde PAYLAŞIMLI (modül seviyesi) — eskiden her
// coin kendi kopyasını yaratıyordu; yerde yüzlerce para birikince GC/VRAM şişiyordu. Görsel AYNI.
const COIN_GEO = new CylinderGeometry(0.22, 0.22, 0.06, 16);
const COIN_MAT = new MeshStandardMaterial({ color: '#ffd700', metalness: 0.7, roughness: 0.25 });

// Para mıknatısı/süzülmesi STORE'da gerçek hareket olarak yapılır (oyuncuya akar + yaklaşınca toplanır);
// burada mesh yalnız o anki konumu (x,z) çizer → görsel = mantık. Doğuş pop'u + dönüş görsel tuz-biber.
// (turu-5 kule istifi denendi, kullanıcı eski görünümü istedi — tek kalıcı değişiklik: paralar
// masa İÇİNE değil moneySpot çevresine düşer; o store'da.)
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
      <mesh ref={coin} castShadow rotation={[Math.PI / 2, 0, 0]} geometry={COIN_GEO} material={COIN_MAT} />
    </group>
  );
}

// Toplanınca yükselip solan "+para" yazısı (CSS animasyonu floatUp; ~0.9s sonra kaldırılır).
// ₺ sembolü display'den kalktı (2026-06-09) → küçük altın para ikonu + sayı.
function MoneyFloater({ x, z, value, onDone }: { x: number; z: number; value: number; onDone: () => void }) {
  // FPS SIZINTI FIX (turu-5 m.13): timer MOUNT'ta BİR KEZ kurulur. Eski deps [onDone] her toplama
  // render'ında (onDone inline closure → yeni referans) timer'ı RESETLİYORDU → aktif oynayışta
  // floater'lar hiç ölmüyor, yüzlerce drei Html birikip FPS'i eritiyordu (ölçüldü: 395 floater).
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <group position={[x, 1.3, z]}>
      <Html center distanceFactor={9} pointerEvents="none" zIndexRange={[5, 0]}>
        <div className="floater">+{value}</div>
      </Html>
    </group>
  );
}

// Yere düşen ₺ paralar — sahip üstünden geçince toplanır (store), toplanınca "+₺" floater belirir.
export function Coins() {
  const coins = useGame((s) => s.coins);
  const prev = useRef<Map<number, { x: number; z: number; value: number }>>(new Map());
  // Floater key'i coin id'sinden BAĞIMSIZ monoton sayaç: oyun sıfırlanınca store nextId başa döner,
  // coin id'leri tekrar eder → id'yle key'lemek "duplicate key" hatası üretirdi (kök neden).
  const floaterSeq = useRef(0);
  const [floaters, setFloaters] = useState<{ id: number; x: number; z: number; value: number }[]>([]);

  useEffect(() => {
    const cur = new Map(coins.map((c) => [c.id, { x: c.pos[0], z: c.pos[2], value: c.value }]));
    // Önceki karede olup şimdi olmayan = toplandı (lifetime 0 → tek kaybolma nedeni toplama).
    // turu-5 m.6-B: kule toplamada onlarca coin AYNI anda gelir → tek TOPLU floater (+toplam);
    // coin başına ayrı yazı hem okunmaz hem Html maliyeti (m.13 dersi).
    let sum = 0;
    const p = useGame.getState().player;
    for (const [id, info] of prev.current) {
      if (!cur.has(id)) sum += info.value;
    }
    prev.current = cur;
    if (sum > 0) setFloaters((f) => [...f, { id: ++floaterSeq.current, x: p[0], z: p[2], value: sum }]);
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
