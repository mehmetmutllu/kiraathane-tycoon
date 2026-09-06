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
// P0 perf (2026-09-06): `coins` ARTIK abonelikle okunmuyor. Coin listesi her karede değişir
// (lifetime sayacı) → `useGame((s) => s.coins)` bu bileşeni HER KARE render ediyordu, oysa JSX'in
// coin listesiyle işi yok (matrisler useFrame'de yazılıyor). Liste `getState()` ile okunur; toplama
// tespiti de aynı useFrame'de yapılır (eski useEffect[coins] aboneliğin tek sebebiydi).
export function Coins() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  // Coin başına doğuş-pop ilerleyişi + dönüş fazı (id ile; eski Coin bileşeninin useRef'lerinin yerini
  // tutar — coin mount'ta spawn 0 / spin 0'dan başlar, faz farkı doğal olarak doğuş zamanından gelir).
  const anim = useRef<Map<number, { spawn: number; spin: number }>>(new Map());
  const prev = useRef<Map<number, number>>(new Map()); // id -> deger (onceki kare)
  // Floater key'i coin id'sinden BAGIMSIZ monoton sayac: oyun sifirlaninca store nextId basa doner,
  // coin id'leri tekrar eder -> id'yle key'lemek "duplicate key" hatasi uretirdi (kok neden).
  const floaterSeq = useRef(0);
  const [floaters, setFloaters] = useState<{ id: number; x: number; z: number; value: number }[]>([]);

  // Toplama tespiti (eski useEffect[coins]'in aynisi, artik useFrame icinde): onceki karede olup
  // simdi olmayan coin = toplandi (lifetime 0 -> tek kaybolma nedeni toplama). turu-5 m.6-B: kule
  // toplamada onlarca coin AYNI anda gelir -> tek TOPLU floater; coin basina yazi hem okunmaz hem
  // Html maliyeti (m.13 dersi).
  const collect = (coins: { id: number; pos: readonly number[]; value: number }[]) => {
    const p = prev.current;
    let sum = 0;
    const seen = new Set<number>();
    for (const c of coins) seen.add(c.id);
    for (const [id, value] of p) if (!seen.has(id)) sum += value;
    p.clear();
    for (const c of coins) p.set(c.id, c.value);
    if (sum > 0) {
      const pl = useGame.getState().player;
      setFloaters((f) => [...f, { id: ++floaterSeq.current, x: pl[0], z: pl[2], value: sum }]);
    }
  };

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const coins = useGame.getState().coins;
    collect(coins);
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
