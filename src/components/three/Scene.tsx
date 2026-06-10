import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import { useGame, LAYOUT, stationSoftMaxLevel, stationUpgradeCost, upgradeZoneUnlockedZ, tableSoftMaxLevel, tableUpgradeZoneUnlocked, tableNextCost, waiterSoftMaxLevel, waiterUpgradeCost, waiterUpgradeUnlockedZ } from '../../game/store';
import { GroundMarker } from './GroundMarker';
import { PALETTE } from '../../config/palette';
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

// Açık zone'ların çay ocağı MODÜLLERİ (per-zone mekanik, D-022; FİZİKSEL konum sol duvar şeridi, D-023).
// Modül sol duvara paralel: +90° dönük (ön yüz +x, salona bakar). Zone açıldıkça şerit öne uzar.
function Stations() {
  const zonesOpen = useGame((s) => s.zonesOpen);
  const stationLevels = useGame((s) => s.stationLevels);
  const readyCupsByZone = useGame((s) => s.readyCupsByZone);
  return (
    <>
      {LAYOUT.stations.slice(0, zonesOpen).map((p, z) => (
        <group key={z} position={[p[0], 0, p[2]]} rotation={[0, Math.PI / 2, 0]}>
          <TeaStation position={[0, 0, 0]} level={stationLevels[z]} readyCups={readyCupsByZone[z]} />
        </group>
      ))}
      {/* L-köşe dolgu tezgâhı (şerit ile bulaşık kolu arasındaki köşe — salt görsel) */}
      <mesh castShadow receiveShadow position={[-4.1, 0.45, -4.85]}>
        <boxGeometry args={[1.3, 0.9, 0.8]} />
        <meshStandardMaterial color={PALETTE.counterWood} />
      </mesh>
    </>
  );
}

// Çaycı NPC (D-023; kullanıcı tarifi: "duvar ile tezgah arasında çalışan biri"). SALT GÖRSEL —
// mekaniğe dokunmaz: şerit arkası koridorda yürür, bulaşık/çay düzenliyormuş gibi durup eğilir.
function KitchenStaff() {
  const zonesOpen = useGame((s) => s.zonesOpen);
  const ref = useRef<Group>(null);
  const zMin = -4.5;
  const zMax = zonesOpen > 1 ? -0.5 : -2.6; // şerit uzadıkça yürüyüş rotası uzar
  useFrame((st) => {
    const grp = ref.current;
    if (!grp) return;
    const t = st.clock.elapsedTime * 0.3;
    const u = (Math.sin(t) + 1) / 2;
    grp.position.z = zMin + u * (zMax - zMin);
    // Rota ucunda durup tezgâha dönüp "iş yapar" (eğilme); arada yürür (hafif zıplama).
    const speed = Math.abs(Math.cos(t));
    grp.rotation.y = speed < 0.25 ? Math.PI / 2 : Math.cos(t) > 0 ? 0 : Math.PI;
    grp.position.y = speed < 0.25 ? -0.04 + Math.sin(st.clock.elapsedTime * 3) * 0.02 : Math.abs(Math.sin(st.clock.elapsedTime * 7)) * 0.04;
  });
  return (
    <group ref={ref} position={[-5.0, 0, -3]}>
      {/* bacaklar + gövde + önlük + baş (low-poly; palette = tek renk kaynağı) */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[0.26, 0.5, 0.18]} />
        <meshStandardMaterial color={PALETTE.pants} />
      </mesh>
      <mesh castShadow position={[0, 0.66, 0]}>
        <boxGeometry args={[0.3, 0.34, 0.2]} />
        <meshStandardMaterial color={PALETTE.shirt} />
      </mesh>
      <mesh position={[0, 0.6, 0.105]}>
        <boxGeometry args={[0.26, 0.4, 0.02]} />
        <meshStandardMaterial color={PALETTE.apron} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color={PALETTE.skin} />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <cylinderGeometry args={[0.135, 0.14, 0.06, 10]} />
        <meshStandardMaterial color={PALETTE.cap} />
      </mesh>
    </group>
  );
}

// Rezerve servis odaları (floorplan-master.md; D-023): DEPO sol-arka + TUVALET sağ-arka (bina arkasına
// bitişik ek odalar) + MERDİVEN ön-sağ köşe (Faz 3b üst kat). Salt görsel greybox rezerv.
function ReservedRooms() {
  const a = LAYOUT.area;
  return (
    <group>
      {/* DEPO (sol-arka ek oda) */}
      <group position={[-3.2, 0, a.minZ - 1.6]}>
        <mesh castShadow position={[0, 0.7, 0]}>
          <boxGeometry args={[3.0, 1.4, 2.2]} />
          <meshStandardMaterial color={PALETTE.wainscot} />
        </mesh>
        <mesh position={[0, 0.55, 1.11]}>
          <boxGeometry args={[0.9, 1.1, 0.04]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
      </group>
      {/* TUVALET (sağ-arka ek oda) */}
      <group position={[15.2, 0, a.minZ - 1.6]}>
        <mesh castShadow position={[0, 0.7, 0]}>
          <boxGeometry args={[2.4, 1.4, 2.2]} />
          <meshStandardMaterial color={PALETTE.wallCream} />
        </mesh>
        <mesh position={[0, 0.55, 1.11]}>
          <boxGeometry args={[0.8, 1.1, 0.04]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
      </group>
      {/* MERDİVEN (ön-sağ köşe; Faz 3b "üst kat" rezervi — basamak silüeti) */}
      <group position={[16.2, 0, 3.6]} rotation={[0, Math.PI, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} castShadow position={[0, 0.12 + i * 0.24, -i * 0.34]}>
            <boxGeometry args={[1.4, 0.24, 0.34]} />
            <meshStandardMaterial color={PALETTE.lintel} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Mekânsal çay yükseltme noktaları (ZONE BAŞINA; ocağın önünde). Üstünde dur → dolum yayı ilerler.
function UpgradeZone() {
  const zonesOpen = useGame((s) => s.zonesOpen);
  const stationLevels = useGame((s) => s.stationLevels);
  const upgradeFills = useGame((s) => s.upgradeFills);
  const wallet = useGame((s) => s.wallet);
  const padsDone = useGame((s) => s.padsDone);
  const tables = useGame((s) => s.tables);
  const lifetime = useGame((s) => s.lifetime);
  const gate = { padsDone, tables, stationLevel: stationLevels[0], lifetime: lifetime.toNumber() };
  return (
    <>
      {Array.from({ length: zonesOpen }, (_, z) => {
        if (stationLevels[z] >= stationSoftMaxLevel()) return null;
        if (!upgradeZoneUnlockedZ(z, gate)) return null;
        const cost = stationUpgradeCost(stationLevels[z]);
        return (
          <GroundMarker
            key={z}
            pos={LAYOUT.upgradeZones[z]}
            label="Çay Yükselt"
            sub={String(cost)}
            coin
            tint="#ffce54"
            progress={upgradeFills[z] / cost}
            afford={wallet.toNumber() >= cost}
          />
        );
      })}
    </>
  );
}

// Bulaşık noktaları (Faz 2e; ZONE BAŞINA, D-022): kirli bardaklar burada yıkanır.
// (Havadaki etiket KALDIRILDI — lavabo görseli zaten ne olduğunu anlatır; D-017 §2 sadelik.)
function DishStationUnit({ pos }: { pos: readonly [number, number, number] }) {
  return (
    <group position={[pos[0], 0, pos[2]]}>
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

function DishStation() {
  const zonesOpen = useGame((s) => s.zonesOpen);
  return (
    <>
      {LAYOUT.dishStations.slice(0, zonesOpen).map((p, z) => (
        <DishStationUnit key={z} pos={p} />
      ))}
    </>
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
  const stationLevel = useGame((s) => s.stationLevels[0]);
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

// Garson hız yükseltme işaretleri (D-018 §6; ZONE BAŞINA): o zone'da garson tutulunca belirir.
// Tek seviye (L1→L2); L2'ye çıkınca işaret kaybolur. Sade zemin işareti (D-017 §2).
function WaiterUpgradeMarker() {
  const waiters = useGame((s) => s.waiters);
  const waiterLevels = useGame((s) => s.waiterLevels);
  const waiterUpgradeFills = useGame((s) => s.waiterUpgradeFills);
  const wallet = useGame((s) => s.wallet);
  const padsDone = useGame((s) => s.padsDone);
  const tables = useGame((s) => s.tables);
  const stationLevels = useGame((s) => s.stationLevels);
  const lifetime = useGame((s) => s.lifetime);
  const waiterServed = useGame((s) => s.stats.waiterServed);
  const gate = { padsDone, tables, stationLevel: stationLevels[0], lifetime: lifetime.toNumber(), waiterServed };
  const cost = waiterUpgradeCost();
  return (
    <>
      {waiters.map((w, z) => {
        if (!w || waiterLevels[z] >= waiterSoftMaxLevel()) return null;
        // Arka-plan şartı (minWaiterServed): garson 20 çay taşımadan işaret hiç görünmez (store dolumu da kapalı).
        if (!waiterUpgradeUnlockedZ(z, gate, waiterLevels[z])) return null;
        return (
          <GroundMarker
            key={z}
            pos={LAYOUT.waiterUpgradeSpots[z]}
            label="Garson Hız"
            sub={String(cost)}
            coin
            tint="#ffce54"
            radius={0.6}
            progress={waiterUpgradeFills[z] / cost}
            afford={wallet.toNumber() >= cost}
          />
        );
      })}
    </>
  );
}

function Ground() {
  // İki zone'u da kapsayan AHŞAP zemin (görsel kimlik: sıcak parke) + zone başına KIRMIZI KİLİM
  // (masa bölgesinin altında; bordür + iç dikdörtgen — flat low-poly kilim).
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[6, 0, 0]}>
        <planeGeometry args={[38, 18]} />
        <meshStandardMaterial color={PALETTE.floorWood} />
      </mesh>
      {LAYOUT.zoneAreas.map((za, z) => {
        const cx = (za.minX + za.maxX) / 2;
        return (
          <group key={z}>
            {/* y: zemin(0) < kilim(0.008/0.014) < GroundMarker tabanı(0.02) — z-fight yok.
                Kilim masa bölgesini sarar ama kenarlarda AHŞAP görünür (ilk deneme 8.6×6.2 salonu
                bilardo masasına çevirmişti — küçültüldü). */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.008, 1.5]}>
              <planeGeometry args={[6.6, 4.6]} />
              <meshStandardMaterial color={PALETTE.carpetBorder} />
            </mesh>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.014, 1.5]}>
              <planeGeometry args={[6.0, 4.0]} />
              <meshStandardMaterial color={PALETTE.carpet} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// TV köşesi (zone-1 arka duvar, mutfağın sağında): askılı TV + açık ekran. Zone-4 "TV salonu"
// konseptinin öncü dekoru (kat planı: floorplan-master.md).
function TvCorner() {
  return (
    <group position={[3.6, 0, -5.1]}>
      {/* duvar konsolu */}
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.12]} />
        <meshStandardMaterial color={PALETTE.tvStand} />
      </mesh>
      {/* TV çerçevesi */}
      <mesh castShadow position={[0, 1.85, 0.12]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[1.5, 0.85, 0.1]} />
        <meshStandardMaterial color={PALETTE.tvFrame} />
      </mesh>
      {/* ekran (hafif ışıldar — maç yayını hissi) */}
      <mesh position={[0, 1.85, 0.18]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[1.32, 0.68, 0.02]} />
        <meshStandardMaterial color={PALETTE.tvScreen} emissive={PALETTE.tvScreen} emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

// Zone-2 KİLİTLİYKEN üstüne yarı saydam karanlık örtü: "henüz açılmamış salon" hissi (Roblox-tycoon).
// Pad'i geçitte; oyuncu içeri girebilir ama mobilya/müşteri yok.
function LockedZoneShade() {
  const zonesOpen = useGame((s) => s.zonesOpen);
  if (zonesOpen > 1) return null;
  const za = LAYOUT.zoneAreas[1];
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(za.minX + za.maxX) / 2, 0.03, (za.minZ + za.maxZ) / 2]}
      >
        <planeGeometry args={[za.maxX - za.minX + 1, za.maxZ - za.minZ + 1]} />
        <meshStandardMaterial color="#10161c" transparent opacity={0.55} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      {/* zone sınırı zemin çizgisi (duvarsız eşik — D-023): kilitliyken görünür, açılınca tek salon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LAYOUT.zoneBorderX, 0.035, 0]}>
        <planeGeometry args={[0.16, 10.6]} />
        <meshStandardMaterial color="#d9b24a" polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
    </group>
  );
}

// Duvarlar TÜM binayı (iki zone) sarar: arka + sol + sağ + ÖN. TEK KAPI (zone-1 ortası; D-023 —
// tüm müşteriler buradan girer/çıkar). İÇ BÖLME DUVARI YOK: tek salon, zone sınırı zemin çizgisi.
function Walls() {
  const a = LAYOUT.area;
  const m = 0.5; // alan kenarı ile duvar arası küçük pay
  const x0 = a.minX - m, x1 = a.maxX + m, z0 = a.minZ - m, z1 = a.maxZ + m;
  const w = x1 - x0, d = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const h = 1.2;
  const t = 0.2;
  const doorHalf = 1.3; // kapı yarı-genişliği (her entrance x'i merkezli boşluk)
  // Ön duvar parçaları: TEK kapı boşluğu (entrances artık aynı nokta — uniq).
  const doorXs = [...new Set(LAYOUT.entrances.map((e) => e[0]))];
  const cuts = [x0, ...doorXs.flatMap((dx) => [dx - doorHalf, dx + doorHalf]), x1];
  const frontSegs: [number, number][] = [];
  for (let i = 0; i < cuts.length; i += 2) frontSegs.push([cuts[i], cuts[i + 1]]);
  return (
    <group>
      {/* arka duvar */}
      <WallPiece x={cx} z={z0} w={w} dDepth={t} h={h} />
      {/* sol + sağ dış duvarlar */}
      <WallPiece x={x0} z={cz} w={t} dDepth={d} h={h} />
      <WallPiece x={x1} z={cz} w={t} dDepth={d} h={h} />
      {/* ön duvar segmentleri (kapı boşlukları arası) */}
      {frontSegs.map(([sx, ex], i) =>
        ex - sx > 0.01 ? (
          <WallPiece key={i} x={(sx + ex) / 2} z={z1} w={ex - sx} dDepth={t} h={h} />
        ) : null,
      )}
      {/* kapı sövesi + çerçevesi (ön duvarın TAMAMEN önünde — z-fighting yok) */}
      {doorXs.map((dx) => (
        <group key={dx}>
          <mesh position={[dx, h - 0.12, z1 + 0.22]}>
            <boxGeometry args={[doorHalf * 2 + 0.3, 0.24, 0.12]} />
            <meshStandardMaterial color={PALETTE.lintel} />
          </mesh>
          <mesh position={[dx - doorHalf, h / 2, z1 + 0.22]}>
            <boxGeometry args={[0.12, h, 0.12]} />
            <meshStandardMaterial color={PALETTE.doorWood} />
          </mesh>
          <mesh position={[dx + doorHalf, h / 2, z1 + 0.22]}>
            <boxGeometry args={[0.12, h, 0.12]} />
            <meshStandardMaterial color={PALETTE.doorWood} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Duvar parçası: krem üst + koyu ahşap LAMBRİ kuşağı (görsel kimlik — gerçek kıraathane duvarı).
function WallPiece({ x, z, w, dDepth, h }: { x: number; z: number; w: number; dDepth: number; h: number }) {
  const wh = 0.5; // lambri yüksekliği
  return (
    <group>
      <mesh position={[x, wh + (h - wh) / 2, z]}>
        <boxGeometry args={[w, h - wh, dDepth]} />
        <meshStandardMaterial color={PALETTE.wallCream} />
      </mesh>
      <mesh position={[x, wh / 2, z]}>
        <boxGeometry args={[w + 0.04, wh, dDepth + 0.04]} />
        <meshStandardMaterial color={PALETTE.wainscot} />
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
      {/* kaldırım şeridi (TÜM cephe boyu — iki zone'un kapıları da buraya açılır) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[6, 0.04, z1 + 1.2]}>
        <planeGeometry args={[40, 2.4]} />
        <meshStandardMaterial color="#9e9e9e" polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      {/* asfalt cadde */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[6, 0.02, z1 + 5.5]}>
        <planeGeometry args={[56, 6]} />
        <meshStandardMaterial color="#37424a" polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {/* yol orta çizgileri */}
      {[-8, -4, 0, 4, 8, 12, 16, 20].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, z1 + 5.5]}>
          <planeGeometry args={[1.4, 0.18]} />
          <meshStandardMaterial color="#c9b458" polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
        </mesh>
      ))}
      {/* karşı binalar (cadde ötesi cephe) */}
      {[-9, -5.6, -2.2, 1.2, 4.6, 8, 11.4, 14.8, 18.2].map((x, i) => {
        const bh = 4 + ((i * 1.7) % 3);
        return (
          <mesh key={x} castShadow position={[x, bh / 2, z1 + 9]}>
            <boxGeometry args={[3, bh, 2]} />
            <meshStandardMaterial color={buildingColors[i % buildingColors.length]} />
          </mesh>
        );
      })}
      {/* KAPI ÖNÜ (görsel kimlik): TEK kapıda yeşil TENTE + kaldırımda bahçe masaları + saksılar.
          Salt görsel (collision yok); müşteri yolu (kapı hizası) boş bırakıldı. */}
      {LAYOUT.entrances.slice(0, 1).map((e) => (
        <group key={e[0]}>
          {/* TABELA şeridi (dikey — eğimli tente kamera +z'den bakınca ekranı kapatıyordu; dikey yüzey
              üstten bakışta incecik kalır, kimliği taşır) */}
          <mesh castShadow position={[e[0], 1.42, z1 + 0.3]}>
            <boxGeometry args={[3.4, 0.34, 0.06]} />
            <meshStandardMaterial color={PALETTE.awning} />
          </mesh>
          <mesh position={[e[0], 1.22, z1 + 0.31]}>
            <boxGeometry args={[3.4, 0.05, 0.06]} />
            <meshStandardMaterial color={PALETTE.awningStripe} />
          </mesh>
          {/* bahçe masaları (kapının iki yanı, kaldırımda) + tabureler */}
          {[-2.3, 2.3].map((dx) => (
            <group key={dx} position={[e[0] + dx, 0, z1 + 1.15]}>
              <mesh castShadow position={[0, 0.42, 0]}>
                <cylinderGeometry args={[0.36, 0.36, 0.06, 12]} />
                <meshStandardMaterial color={PALETTE.outdoorTable} />
              </mesh>
              <mesh castShadow position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.06, 0.09, 0.4, 8]} />
                <meshStandardMaterial color={PALETTE.tableLeg} />
              </mesh>
              {[-0.55, 0.55].map((sx) => (
                <mesh key={sx} castShadow position={[sx, 0.17, 0]}>
                  <cylinderGeometry args={[0.13, 0.15, 0.34, 8]} />
                  <meshStandardMaterial color={PALETTE.stool} />
                </mesh>
              ))}
            </group>
          ))}
          {/* saksı bitkiler (duvar dibi, kapının iki yanı) */}
          {[-1.7, 1.7].map((dx) => (
            <group key={`p${dx}`} position={[e[0] + dx, 0, z1 + 0.42]}>
              <mesh castShadow position={[0, 0.18, 0]}>
                <cylinderGeometry args={[0.16, 0.12, 0.36, 8]} />
                <meshStandardMaterial color={PALETTE.planter} />
              </mesh>
              <mesh castShadow position={[0, 0.46, 0]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color={PALETTE.plant} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
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
        shadow-camera-right={24}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <Ground />
      <LockedZoneShade />
      <Street />
      <Walls />
      <TvCorner />
      <ReservedRooms />
      <Stations />
      <KitchenStaff />
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
