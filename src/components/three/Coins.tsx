import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CylinderGeometry, MeshStandardMaterial, Object3D, type InstancedMesh } from 'three';
import { useGame } from '../../game/store';

// FPS (turu-5 m.13): geometry + material TÜM coin'lerde PAYLAŞIMLI (modül seviyesi). FPS Tier 2
// (2026-06-13): tüm coin'ler TEK InstancedMesh'te → eskiden her coin ayrı draw-call (yerde ~215 →
// 215 draw-call); şimdi 1 draw-call. Görsel BİREBİR AYNI (aynı geo/mat; per-instance matris orijinal
// group+mesh dönüşümünü tıpatıp üretir — üniform ölçek dönüşle komütatif olduğundan T·S·R = T·R·S).
const COIN_GEO = new CylinderGeometry(0.22, 0.22, 0.06, 16);
const COIN_MAT = new MeshStandardMaterial({ color: '#ffd700', metalness: 0.7, roughness: 0.25 });
// Tampon kapasitesi: oto-toplama coin'i ~215'te tavanlıyor (m.13); 1024 bol pay (burst'ler için), ucuz.
const COIN_CAP = 1024;

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
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  // Coin başına doğuş-pop ilerleyişi + dönüş fazı (id ile; eski Coin bileşeninin useRef'lerinin yerini
  // tutar — coin mount'ta spawn 0 / spin 0'dan başlar, faz farkı doğal olarak doğuş zamanından gelir).
  const anim = useRef<Map<number, { spawn: number; spin: number }>>(new Map());
  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = anim.current;
    const n = Math.min(coins.length, COIN_CAP);
    for (let i = 0; i < n; i++) {
      const c = coins[i];
      let st = m.get(c.id);
      if (!st) {
        st = { spawn: 0, spin: 0 };
        m.set(c.id, st);
      }
      st.spawn = Math.min(1, st.spawn + dt * 6);
      st.spin += dt * 3;
      const s = st.spawn * (1 - 0.15 * Math.sin(st.spawn * Math.PI)); // eski doğuş-pop eğrisi
      dummy.position.set(c.pos[0], 0.3, c.pos[2]);
      dummy.rotation.set(Math.PI / 2, st.spin, 0); // eski: mesh rotX=PI/2 + group spin (üniform ölçek komütatif)
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    // Toplanan coin'lerin anim durumunu temizle (Map sızıntısı olmasın).
    if (m.size > n) {
      const liveIds = new Set(coins.map((c) => c.id));
      for (const id of m.keys()) if (!liveIds.has(id)) m.delete(id);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  });
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
      {/* TEK InstancedMesh — tüm coin'ler 1 draw-call (matrisler useFrame'de). castShadow korunur
          (eski Coin mesh'i gölge atıyordu). count her kare gerçek coin sayısına ayarlanır. */}
      <instancedMesh
        ref={meshRef}
        args={[COIN_GEO, COIN_MAT, COIN_CAP]}
        castShadow
        frustumCulled={false}
      />
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
