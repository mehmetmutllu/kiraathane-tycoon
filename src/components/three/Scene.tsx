import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGame, LAYOUT, stationSoftMaxLevel, stationUpgradeCost, upgradeZoneUnlocked, tableSoftMaxLevel, tableUpgradeZoneUnlocked, tableNextCost, waiterSoftMaxLevel, waiterUpgradeCost, waiterUpgradeUnlocked } from '../../game/store';
import { GroundMarker } from './GroundMarker';
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
// D-017 §6 (kamera sallanması fix): eski kod konumu kare-hızına BAĞLI lerp'lerken lookAt'ı TAM oyuncuya
// nişanlıyordu → konum geriden gelirken bakış yönü dalgalanıp dünya SALLANIYORDU. Çözüm: kare-hızı BAĞIMSIZ
// damping (1-exp(-k·dt)) AYNI katsayıyla hem konuma hem lookAt hedefine uygulanır → kamera↔hedef offset'i
// rijit kalır (sallanma yok) + dt clamp (hitch sıçramaz) + fit/d YALNIZ gerçek resize'da (her kare size
// okuması mobil viewport titremesini kameraya taşırdı).
function CameraRig() {
  const { camera, size } = useThree();
  const desired = useMemo(() => new Vector3(), []);
  const look = useMemo(() => new Vector3(), []); // pürüzsüzleştirilmiş lookAt hedefi (oyuncuyla aynı damping)
  const tmp = useMemo(() => new Vector3(), []);
  const st = useRef({ d: 0, w: 0, h: 0, ready: false });
  useFrame((_, rawDt) => {
    const dt = Math.min(Math.max(rawDt, 0), 0.05); // clamp: kare atlamasında kamera sıçramasın
    const g = useGame.getState();
    const p = g.player;
    // fit/d YALNIZ ekran boyutu gerçekten değişince (resize/orientation) hesaplanır.
    if (size.width !== st.current.w || size.height !== st.current.h) {
      st.current.w = size.width;
      st.current.h = size.height;
      const aspect = size.width / Math.max(1, size.height);
      // Kullanıcı isteği (2026-06-09): telefonda "çok yakın" hissi → biraz geri çek. Taban d 6→7; portrait'te
      // dar ekran için ölçülü geri çekme (clamp 1.3→1.4).
      const fit = aspect < 1 ? Math.min(1.4, 1 / aspect) : 1;
      st.current.d = 7 * fit;
    }
    // KAMERA ODAĞI (quest sistemi): odak varken hedefe kay + hafif zoom; girdi gelince store odağı
    // iptal eder → buradaki damping kendiliğinden oyuncuya geri süzülür (ek durum makinesi yok).
    const focus = g.camFocus;
    const d = focus ? st.current.d * 0.72 : st.current.d;
    if (focus) {
      desired.set(focus.pos[0], d, focus.pos[2] + d);
      tmp.set(focus.pos[0], 0.6, focus.pos[2]);
    } else {
      desired.set(p[0], d, p[2] + d);
      tmp.set(p[0], 0.6, p[2]);
    }
    if (!st.current.ready) {
      camera.position.copy(desired); // ilk kare: anında yerleş (başlangıç lerp sıçraması olmasın)
      look.copy(tmp);
      st.current.ready = true;
    } else {
      // Kare-hızı bağımsız damping (konum + lookAt AYNI k → sallanma yok). Odak panı biraz yavaş (süzülme hissi).
      const a = 1 - Math.exp(-(focus ? 5 : 8) * dt);
      camera.position.lerp(desired, a);
      look.lerp(tmp, a);
    }
    camera.lookAt(look);
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
          readyCups={i === 0 ? readyCups : 0}
        />
      ))}
    </>
  );
}

// Mekânsal çay yükseltme noktası (ana ocağın önünde). Üstünde dur → dolum yayı ilerler (sade zemin işareti).
function UpgradeZone() {
  const stationLevel = useGame((s) => s.stationLevel);
  const upgradeFill = useGame((s) => s.upgradeFill);
  const wallet = useGame((s) => s.wallet);
  const padsDone = useGame((s) => s.padsDone);
  const tables = useGame((s) => s.tables);
  const lifetime = useGame((s) => s.lifetime);
  if (stationLevel >= stationSoftMaxLevel()) return null;
  if (!upgradeZoneUnlocked({ padsDone, tables, stationLevel, lifetime: lifetime.toNumber() })) return null;
  const cost = stationUpgradeCost(stationLevel);
  return (
    <GroundMarker
      pos={LAYOUT.upgradeZone}
      label="Çay Yükselt"
      sub={String(cost)}
      coin
      tint="#ffce54"
      progress={upgradeFill / cost}
      afford={wallet.toNumber() >= cost}
    />
  );
}

// Bulaşık noktası (Faz 2e): kirli bardaklar burada yıkanır. Üstünde dur → taşınan kirliler temize döner.
// (Havadaki etiket KALDIRILDI — lavabo görseli zaten ne olduğunu anlatır; D-017 §2 sadelik.)
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
    </group>
  );
}

// Masa-başı yükseltme işaretleri (Faz 2h + D-018 §1 KENAR-YERLEŞİM): her AÇIK masanın DUVAR-KENARI tarafında
// kesik-köşeli kart ("Masa N" + Lvl + ₺maliyet). Orta koridor boş kalır; dwell ile para hemen gitmez.
function TableUpgradeMarkers() {
  const tables = useGame((s) => s.tables);
  const tableLevels = useGame((s) => s.tableLevels);
  const tableUpgradeFills = useGame((s) => s.tableUpgradeFills);
  const wallet = useGame((s) => s.wallet);
  const padsDone = useGame((s) => s.padsDone);
  const stationLevel = useGame((s) => s.stationLevel);
  const lifetime = useGame((s) => s.lifetime);
  if (!tableUpgradeZoneUnlocked({ padsDone, tables, stationLevel, lifetime: lifetime.toNumber() })) return null;
  const cash = wallet.toNumber();
  return (
    <>
      {LAYOUT.tables.slice(0, tables).map((t, i) => {
        const lvl = tableLevels[i] ?? 0;
        if (lvl >= tableSoftMaxLevel()) return null; // max → işaret gizlenir
        const cost = tableNextCost(lvl);
        return (
          <GroundMarker
            key={i}
            pos={t.upgradeSpot}
            label="Masa"
            sub={String(cost)}
            coin
            tint="#ffce54"
            radius={0.6}
            progress={(tableUpgradeFills[i] ?? 0) / cost}
            afford={cash >= cost}
          />
        );
      })}
    </>
  );
}

// Garson hız yükseltme işareti (D-018 §6): garson tutulunca, tuttuğun noktada belirir (altın = yükseltme).
// Tek seviye (L1→L2); L2'ye çıkınca işaret kaybolur. Sade zemin işareti (D-017 §2).
function WaiterUpgradeMarker() {
  const hasWaiter = useGame((s) => s.hasWaiter);
  const waiterLevel = useGame((s) => s.waiterLevel);
  const fill = useGame((s) => s.waiterUpgradeFill);
  const wallet = useGame((s) => s.wallet);
  const padsDone = useGame((s) => s.padsDone);
  const tables = useGame((s) => s.tables);
  const stationLevel = useGame((s) => s.stationLevel);
  const lifetime = useGame((s) => s.lifetime);
  const waiterServed = useGame((s) => s.stats.waiterServed);
  if (!hasWaiter || waiterLevel >= waiterSoftMaxLevel()) return null;
  // Arka-plan şartı (minWaiterServed): garson 20 çay taşımadan işaret hiç görünmez (store dolumu da kapalı).
  const gate = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber(), waiterServed };
  if (!waiterUpgradeUnlocked(gate, waiterLevel)) return null;
  const cost = waiterUpgradeCost();
  return (
    <GroundMarker
      pos={LAYOUT.waiterUpgradeSpot}
      label="Garson Hız"
      sub={String(cost)}
      coin
      tint="#ffce54"
      radius={0.6}
      progress={fill / cost}
      afford={wallet.toNumber() >= cost}
    />
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

// Duvarlar oynanabilir alanı (asimetrik area) sarar: arka + sol + sağ + ÖN (kapı boşluğuyla).
// Kapı: ön duvarın ortasında x∈[-doorHalf,doorHalf] boşluk → müşteriler buradan girip çıkar (entrance x=0).
function Walls() {
  const a = LAYOUT.area;
  const m = 0.5; // alan kenarı ile duvar arası küçük pay
  const x0 = a.minX - m, x1 = a.maxX + m, z0 = a.minZ - m, z1 = a.maxZ + m;
  const w = x1 - x0, d = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const h = 1.2;
  const t = 0.2;
  const doorHalf = 1.3; // kapı yarı-genişliği (x=0 merkezli boşluk)
  const leftFrontW = -doorHalf - x0; // sol ön parça genişliği
  const rightFrontW = x1 - doorHalf; // sağ ön parça genişliği
  const common = { color: '#a1887f' } as const;
  return (
    <group>
      {/* arka duvar */}
      <mesh position={[cx, h / 2, z0]}>
        <boxGeometry args={[w, h, t]} />
        <meshStandardMaterial {...common} />
      </mesh>
      {/* sol duvar */}
      <mesh position={[x0, h / 2, cz]}>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial {...common} />
      </mesh>
      {/* sağ duvar */}
      <mesh position={[x1, h / 2, cz]}>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial {...common} />
      </mesh>
      {/* ön duvar — SOL parça (kapı boşluğunun solu) */}
      <mesh position={[(x0 - doorHalf) / 2, h / 2, z1]}>
        <boxGeometry args={[leftFrontW, h, t]} />
        <meshStandardMaterial {...common} />
      </mesh>
      {/* ön duvar — SAĞ parça (kapı boşluğunun sağı) */}
      <mesh position={[(doorHalf + x1) / 2, h / 2, z1]}>
        <boxGeometry args={[rightFrontW, h, t]} />
        <meshStandardMaterial {...common} />
      </mesh>
      {/* kapı sövesi (boşluğun üstünde lento) — ön duvarın TAMAMEN ÖNÜNDE (z1+t/2=0.1 → merkez z1+0.22, derinlik
          azaltıldı) → duvar gövdesiyle KESİŞMEZ (eski +0.06 kesişip titriyordu); ince derinlik dış cephede durur. */}
      <mesh position={[0, h - 0.12, z1 + 0.22]}>
        <boxGeometry args={[doorHalf * 2 + 0.3, 0.24, 0.12]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {/* kapı çerçevesi (iki yan direk) — duvarın önünde, kesişmesiz */}
      <mesh position={[-doorHalf, h / 2, z1 + 0.22]}>
        <boxGeometry args={[0.12, h, 0.12]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh position={[doorHalf, h / 2, z1 + 0.22]}>
        <boxGeometry args={[0.12, h, 0.12]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
    </group>
  );
}

// Dış dünya (D-017 kullanıcı isteği): ön duvarın DIŞINDA sokak + kaldırım + karşı binalar → müşterilerin
// kapıdan girip çıktığı "dış dünya" hissi. Salt görsel (collision yok); low-poly stilize (D-013).
function Street() {
  const a = LAYOUT.area;
  const z1 = a.maxZ + 0.5; // ön duvar hattı
  const buildingColors = ['#7e6b8f', '#6b8f7e', '#8f7e6b', '#6b7d8f', '#8f6b7d'];
  // z-fighting fix (kullanıcı: "sokakta/kapıda hareket ederken parazitlenme"): sokak düzlemleri zemin (y=0) ile
  // EŞ-DÜZLEM olunca titriyordu (asfalt zemin kenarıyla çakışıyordu). Net y ayrımı (≥0.02) + polygonOffset →
  // kamera hareket ederken titreme biter. Sokak düzlemleri opak → altındaki zemini kapatır (boşluk görünmez).
  return (
    <group>
      {/* kaldırım şeridi (kapının hemen önü) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, z1 + 1.2]}>
        <planeGeometry args={[24, 2.4]} />
        <meshStandardMaterial color="#9e9e9e" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      {/* asfalt cadde */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z1 + 5.5]}>
        <planeGeometry args={[40, 6]} />
        <meshStandardMaterial color="#37424a" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {/* yol orta çizgileri */}
      {[-8, -4, 0, 4, 8].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, z1 + 5.5]}>
          <planeGeometry args={[1.4, 0.18]} />
          <meshStandardMaterial color="#c9b458" polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
        </mesh>
      ))}
      {/* karşı binalar (cadde ötesi cephe) */}
      {[-9, -5.6, -2.2, 1.2, 4.6, 8].map((x, i) => {
        const bh = 4 + ((i * 1.7) % 3);
        return (
          <mesh key={x} castShadow position={[x, bh / 2, z1 + 9]}>
            <boxGeometry args={[3, bh, 2]} />
            <meshStandardMaterial color={buildingColors[i % buildingColors.length]} />
          </mesh>
        );
      })}
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
      <Street />
      <Walls />
      <Stations />
      <DishStation />
      <Tables />
      <Customers />
      <Coins />
      <Dishes />
      <Player />
      <Waiter />
      <Dishwasher />
      {/* Zemin işaretleri drei <Text> kullanır; troika fontu ilk Text mount olunca yüklenir ve SUSPEND eder.
          Yalnız bu marker'ları ayrı Suspense'e al → font yüklenirken SADECE küçük işaret yazısı bekler,
          DÜNYA (masa/oyuncu/mutfak) hiç kararmaz (kullanıcı bug'ı: "table2 açılınca sahne kararıyor"). */}
      <Suspense fallback={null}>
        <Pad />
        <UpgradeZone />
        <WaiterUpgradeMarker />
        <TableUpgradeMarkers />
      </Suspense>
      <CameraRig />
      <Simulation />
    </Canvas>
  );
}
