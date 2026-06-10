import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group, type MeshBasicMaterial, type MeshStandardMaterial } from 'three';
import { useGame, LAYOUT, stationSoftMaxLevel, stationUpgradeCost, upgradeZoneUnlockedZ, tableSoftMaxLevel, tableUpgradeZoneUnlocked, tableNextCost, waiterSoftMaxLevel, waiterUpgradeCost, waiterUpgradeUnlockedZ } from '../../game/store';
import { GroundMarker } from './GroundMarker';
import { PALETTE, FLOOR_THEMES, WALL_THEMES } from '../../config/palette';
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

// Açık zone'ların çay ocağı MODÜLLERİ (per-zone mutfak, D-025): z1 sol duvar, z2 sağ duvar (aynalı).
// Modül kendi duvarına paralel; ön yüz salona bakar (rotasyon LAYOUT.stationRots'tan).
function Stations() {
  const zonesOpen = useGame((s) => s.zonesOpen);
  const stationLevels = useGame((s) => s.stationLevels);
  const readyCupsByZone = useGame((s) => s.readyCupsByZone);
  return (
    <>
      {LAYOUT.stations.slice(0, zonesOpen).map((p, z) => (
        <group key={z} position={[p[0], 0, p[2]]} rotation={[0, LAYOUT.stationRots[z], 0]}>
          <TeaStation position={[0, 0, 0]} level={stationLevels[z]} readyCups={readyCupsByZone[z]} />
        </group>
      ))}
    </>
  );
}

// Çaycı NPC (D-023; kullanıcı tarifi: "duvar ile tezgah arasında çalışan biri"). SALT GÖRSEL —
// mekaniğe dokunmaz: kendi ocağının arkasındaki koridorda yürür, durup tezgâha dönüp "iş yapar".
// D-025: her açık zone'un ocağı kendi duvarında → zone-2 açılınca onun da çaycısı belirir (aynalı).
function KitchenHand({ x, faceIn }: { x: number; faceIn: number }) {
  const ref = useRef<Group>(null);
  const zMin = -4.6;
  const zMax = -1.4; // mutfak bloğu boyunca (bulaşık -4.9..-3.5 + ocak -3.6..-1.4)
  useFrame((st) => {
    const grp = ref.current;
    if (!grp) return;
    const t = st.clock.elapsedTime * 0.3;
    const u = (Math.sin(t) + 1) / 2;
    grp.position.z = zMin + u * (zMax - zMin);
    // Rota ucunda durup tezgâha dönüp "iş yapar" (eğilme); arada yürür (hafif zıplama).
    const speed = Math.abs(Math.cos(t));
    grp.rotation.y = speed < 0.25 ? faceIn : Math.cos(t) > 0 ? 0 : Math.PI;
    grp.position.y = speed < 0.25 ? -0.04 + Math.sin(st.clock.elapsedTime * 3) * 0.02 : Math.abs(Math.sin(st.clock.elapsedTime * 7)) * 0.04;
  });
  return (
    <group ref={ref} position={[x, 0, -3]}>
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

function KitchenStaff() {
  const zonesOpen = useGame((s) => s.zonesOpen);
  return (
    <>
      {/* z1: sol duvar arkası (tezgâha dönüş +x); z2: sağ duvar arkası (dönüş −x) */}
      <KitchenHand x={-5.0} faceIn={Math.PI / 2} />
      {zonesOpen > 1 ? <KitchenHand x={15.6} faceIn={-Math.PI / 2} /> : null}
    </>
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
      <group position={[13.8, 0, a.minZ - 1.6]}>
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
      <group position={[14.8, 0, 3.6]} rotation={[0, Math.PI, 0]}>
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
// D-025 rev. A: modül kendi ocağının bitişiğinde, yan duvara paralel (rotasyon ocakla aynı).
function DishStationUnit({ pos, rot }: { pos: readonly [number, number, number]; rot: number }) {
  return (
    <group position={[pos[0], 0, pos[2]]} rotation={[0, rot, 0]}>
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
        <DishStationUnit key={z} pos={p} rot={LAYOUT.stationRots[z]} />
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

// Dama temasının deseni: BÜYÜK düz-renk kare quad'lar (canvas doku DEĞİL — kullanıcı tile dokusunu
// reddetti; low-poly satranç deseni primitive stile uyar). Yalnız alt-renk kareleri çizilir
// (taban zaten base renk); kenarlarda kareler alana kırpılır.
function CheckerTiles({ x0, x1, z0, z1, color }: { x0: number; x1: number; z0: number; z1: number; color: string }) {
  const ts = 1.3;
  const nx = Math.ceil((x1 - x0) / ts);
  const nz = Math.ceil((z1 - z0) / ts);
  const tiles: [number, number, number, number][] = [];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      if ((i + j) % 2 === 0) continue;
      const tx0 = x0 + i * ts;
      const tz0 = z0 + j * ts;
      const tx1 = Math.min(tx0 + ts, x1);
      const tz1 = Math.min(tz0 + ts, z1);
      tiles.push([(tx0 + tx1) / 2, (tz0 + tz1) / 2, tx1 - tx0, tz1 - tz0]);
    }
  }
  return (
    <group>
      {tiles.map(([cx, cz, w, d], i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.006, cz]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  // İki zone'u da kapsayan AHŞAP zemin (DÜZ renk — canvas-tile geri alındı, kullanıcı 2026-06-11:
  // "zemin iğrenç oldu"). WP6 kozmetik teması KORUNUR: zone overlay'i temanın DÜZ base rengi
  // (+dama temasında quad satranç deseni). Kilim o zone'un masa bloğunun altına ortalanır
  // (tek doğru kaynak: LAYOUT.tables — zone-2 aynalı olsa da doğru yere düşer).
  const floorThemeByZone = useGame((s) => s.floorThemeByZone);
  const last = LAYOUT.zoneAreas.length - 1;
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[6, 0, 0]}>
        <planeGeometry args={[38, 18]} />
        <meshStandardMaterial color={PALETTE.floorWood} />
      </mesh>
      {LAYOUT.zoneAreas.map((za, z) => {
        // Overlay DUVARA KADAR uzar (dış kenarlarda +0.55) — duvar dibinde eski renk şerit kalmaz
        // (kullanıcı bug'ı 2026-06-11). Zone'lar arası ortak kenar (x=5.3) olduğu gibi kalır.
        const x0 = za.minX - (z === 0 ? 0.55 : 0);
        const x1 = za.maxX + (z === last ? 0.55 : 0);
        const z0 = za.minZ - 0.55;
        const z1 = za.maxZ + 0.55;
        const theme = FLOOR_THEMES[floorThemeByZone[z] ?? 'parke'] ?? FLOOR_THEMES.parke;
        const zt = LAYOUT.tables.slice(z * 4, z * 4 + 4);
        const ccx = zt.reduce((a, t) => a + t.table[0], 0) / zt.length;
        const ccz = zt.reduce((a, t) => a + t.table[2], 0) / zt.length;
        return (
          <group key={z}>
            {/* y: taban(0) < overlay(0.004) < dama(0.006) < kilim(0.008/0.014) < GroundMarker(0.02). */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.004, (z0 + z1) / 2]}>
              <planeGeometry args={[x1 - x0, z1 - z0]} />
              <meshStandardMaterial color={theme.base} />
            </mesh>
            {theme.kind === 'checker' ? <CheckerTiles x0={x0} x1={x1} z0={z0} z1={z1} color={theme.alt} /> : null}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[ccx, 0.008, ccz]}>
              <planeGeometry args={[7.0, 4.8]} />
              <meshStandardMaterial color={PALETTE.carpetBorder} />
            </mesh>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[ccx, 0.014, ccz]}>
              <planeGeometry args={[6.4, 4.2]} />
              <meshStandardMaterial color={PALETTE.carpet} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// TV köşesi (zone-1 arka duvar): askılı TV + EKRANDA MAÇ OYNAR (WP4, feedback §C16):
// yeşil saha + orta çizgi + gezen top + üst skor bandı; ekran parlaklığı hafif titrer (canlı yayın hissi).
function TvCorner() {
  const ball = useRef<Group>(null);
  const screen = useRef<MeshStandardMaterial>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (ball.current) {
      // Top sahada elips çizer + ara sıra yön değişimi hissi (iki frekansın bileşimi).
      ball.current.position.x = Math.sin(t * 0.9) * 0.5 + Math.sin(t * 2.3) * 0.08;
      ball.current.position.y = Math.cos(t * 1.4) * 0.2;
    }
    if (screen.current) screen.current.emissiveIntensity = 0.5 + Math.sin(t * 7.3) * 0.06;
  });
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
      {/* ekran içeriği (saha + çizgi + top + skor bandı) — çerçeveye paralel grup */}
      <group position={[0, 1.85, 0.18]} rotation={[0.18, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.32, 0.68, 0.02]} />
          <meshStandardMaterial ref={screen} color={PALETTE.tvScreen} emissive={PALETTE.tvScreen} emissiveIntensity={0.5} />
        </mesh>
        {/* orta çizgi + orta yuvarlak */}
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.02, 0.62, 0.004]} />
          <meshStandardMaterial color="#e8f5ee" emissive="#e8f5ee" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.012]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.12, 0.008, 6, 16]} />
          <meshStandardMaterial color="#e8f5ee" emissive="#e8f5ee" emissiveIntensity={0.3} />
        </mesh>
        {/* gezen top */}
        <group ref={ball} position={[0, 0, 0.016]}>
          <mesh>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>
        {/* skor bandı (üst) */}
        <mesh position={[-0.42, 0.27, 0.012]}>
          <boxGeometry args={[0.42, 0.09, 0.004]} />
          <meshStandardMaterial color="#1c2733" emissive="#3a546e" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

// Dekor prop'ları (WP4, feedback §C11: "her yer boş"): detaylı çöp kovası + iç mekân saksıları +
// duvar saati. Salt görsel (yürüme yollarının dışında, collision yok; primitive = nihai stil D-013).
function DecorProps() {
  return (
    <group>
      {/* çöp kovası (kapı yanı): gövde + kapak + sallanan kapak kulpu + yan şeritler */}
      <group position={[1.6, 0, 4.5]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.2, 0.16, 0.6, 12]} />
          <meshStandardMaterial color={PALETTE.trashBody} metalness={0.3} roughness={0.6} />
        </mesh>
        {[0.14, 0.32, 0.5].map((h) => (
          <mesh key={h} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.187, 0.008, 6, 14]} />
            <meshStandardMaterial color={PALETTE.trashLid} />
          </mesh>
        ))}
        <mesh castShadow position={[0, 0.63, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.06, 12]} />
          <meshStandardMaterial color={PALETTE.trashLid} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0.69, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
          <meshStandardMaterial color={PALETTE.trashLid} />
        </mesh>
      </group>
      {/* mutfak ucu çöp kovası (ocak ile garson pad'i arasında, ikisine de girmez) */}
      <group position={[-4.95, 0, -0.9]} scale={0.85}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.2, 0.16, 0.6, 12]} />
          <meshStandardMaterial color={PALETTE.trashBody} metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 0.63, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.06, 12]} />
          <meshStandardMaterial color={PALETTE.trashLid} metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
      {/* iç mekân saksıları (köşeler; sokak saksısının iç versiyonu) */}
      {[
        [4.9, -4.6],
        [4.9, 4.4],
        [-5.0, 2.9],
      ].map(([px, pz]) => (
        <group key={`${px}${pz}`} position={[px, 0, pz]}>
          <mesh castShadow position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.18, 0.14, 0.44, 8]} />
            <meshStandardMaterial color={PALETTE.planter} />
          </mesh>
          <mesh castShadow position={[0, 0.58, 0]}>
            <sphereGeometry args={[0.24, 8, 8]} />
            <meshStandardMaterial color={PALETTE.plant} />
          </mesh>
          <mesh castShadow position={[0, 0.78, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshStandardMaterial color={PALETTE.plant} />
          </mesh>
        </group>
      ))}
      {/* duvar saati (arka duvar — bulaşık tezgâhının solunda boş duvar) */}
      <group position={[-1.6, 2.1, -5.18]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
          <meshStandardMaterial color={PALETTE.wainscot} />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
          <meshStandardMaterial color="#f4efe2" />
        </mesh>
        <mesh position={[0, 0.04, 0.045]}>
          <boxGeometry args={[0.015, 0.09, 0.01]} />
          <meshStandardMaterial color="#2b2b2b" />
        </mesh>
        <mesh position={[0.03, 0, 0.045]} rotation={[0, 0, -Math.PI / 3]}>
          <boxGeometry args={[0.012, 0.07, 0.01]} />
          <meshStandardMaterial color="#2b2b2b" />
        </mesh>
      </group>
    </group>
  );
}

// Zone-2 KİLİTLİYKEN TAM GİZLİ (kullanıcı 2026-06-11: "açılmadan hiç ama hiç görünmesin"):
// salon, eski yarı saydam örtü yerine TAM OPAK karanlık HACİMLE örtülür (void — zemin/duvar/dekor
// hiçbiri seçilemez; zone-1'den bakınca salonun bittiği yerde düz karanlık görünür). Pad açılınca
// ~1.8sn'de karanlıktan aydınlığa FADE (kamera panı zaten yeni salona döner) → "karanlıktan çıkış"
// reveal'i. Fade bitince örtü tamamen kalkar (maliyet sıfır).
function LockedZoneShade() {
  const zonesOpen = useGame((s) => s.zonesOpen);
  const mat = useRef<MeshBasicMaterial>(null);
  const [gone, setGone] = useState(false);
  useFrame((_, dt) => {
    if (!mat.current || zonesOpen <= 1) return;
    mat.current.opacity = Math.max(0, mat.current.opacity - dt / 1.8);
    if (mat.current.opacity <= 0) setGone(true);
  });
  if (gone) return null;
  // Hacim zone-2'nin TÜM iç alanı + dış duvarlarını kaplar (sağ/arka/ön duvar payları dahil);
  // zone-1 tarafına TAŞMAZ (sınır x=zoneBorderX'te keskin karanlık yüzü = salonun "sonu").
  const za = LAYOUT.zoneAreas[1];
  const x0 = za.minX;
  const x1 = za.maxX + 0.8; // dış duvar (area+0.5 + kalınlık) payı
  const z0 = za.minZ - 0.8;
  const z1 = za.maxZ + 0.8;
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, 1.1, (z0 + z1) / 2]} renderOrder={999}>
        <boxGeometry args={[x1 - x0, 2.2, z1 - z0]} />
        <meshBasicMaterial ref={mat} color="#070a0e" transparent opacity={1} depthWrite={false} />
      </mesh>
      {/* zone sınırı zemin çizgisi (duvarsız eşik — D-023): kilitliyken eşiği işaretler, açılınca tek salon */}
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
  // WP6: duvar teması zone-başına (wallThemeByZone persist): arka duvar zone sınırında ikiye bölünür,
  // sol dış duvar = zone-1, sağ dış = zone-2; ön segmentler orta noktasının zone'una boyanır.
  const wallThemeByZone = useGame((s) => s.wallThemeByZone);
  const themeOf = (z: number) => WALL_THEMES[wallThemeByZone[z] ?? 'krem'] ?? WALL_THEMES.krem;
  const themeAtX = (x: number) => themeOf(x < LAYOUT.zoneBorderX ? 0 : 1);
  const a = LAYOUT.area;
  const m = 0.5; // alan kenarı ile duvar arası küçük pay
  const x0 = a.minX - m, x1 = a.maxX + m, z0 = a.minZ - m, z1 = a.maxZ + m;
  const d = z1 - z0;
  const cz = (z0 + z1) / 2;
  const h = 1.2;
  const t = 0.2;
  const bx = LAYOUT.zoneBorderX;
  const doorHalf = 1.3; // kapı yarı-genişliği (her entrance x'i merkezli boşluk)
  // Ön duvar parçaları: TEK kapı boşluğu (entrances artık aynı nokta — uniq) + zone sınırı kesiği.
  const doorXs = [...new Set(LAYOUT.entrances.map((e) => e[0]))];
  const cuts = [x0, ...doorXs.flatMap((dx) => [dx - doorHalf, dx + doorHalf]), x1];
  const frontSegs: [number, number][] = [];
  for (let i = 0; i < cuts.length; i += 2) {
    const [sx, ex] = [cuts[i], cuts[i + 1]];
    if (sx < bx && ex > bx) frontSegs.push([sx, bx], [bx, ex]); // tema sınırında böl
    else frontSegs.push([sx, ex]);
  }
  return (
    <group>
      {/* arka duvar (zone sınırında tema bölmesi) */}
      <WallPiece x={(x0 + bx) / 2} z={z0} w={bx - x0} dDepth={t} h={h} theme={themeOf(0)} />
      <WallPiece x={(bx + x1) / 2} z={z0} w={x1 - bx} dDepth={t} h={h} theme={themeOf(1)} />
      {/* sol + sağ dış duvarlar */}
      <WallPiece x={x0} z={cz} w={t} dDepth={d} h={h} theme={themeOf(0)} />
      <WallPiece x={x1} z={cz} w={t} dDepth={d} h={h} theme={themeOf(1)} />
      {/* ön duvar segmentleri (kapı boşlukları arası) */}
      {frontSegs.map(([sx, ex], i) =>
        ex - sx > 0.01 ? (
          <WallPiece key={i} x={(sx + ex) / 2} z={z1} w={ex - sx} dDepth={t} h={h} theme={themeAtX((sx + ex) / 2)} />
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

// Duvar parçası: badana üst + lambri kuşağı. Renkler tema'dan (WP6 kozmetik; default krem).
function WallPiece({
  x,
  z,
  w,
  dDepth,
  h,
  theme,
}: {
  x: number;
  z: number;
  w: number;
  dDepth: number;
  h: number;
  theme?: { cream: string; wainscot: string };
}) {
  const wh = 0.5; // lambri yüksekliği
  const cream = theme?.cream ?? PALETTE.wallCream;
  const wainscot = theme?.wainscot ?? PALETTE.wainscot;
  return (
    <group>
      <mesh position={[x, wh + (h - wh) / 2, z]}>
        <boxGeometry args={[w, h - wh, dDepth]} />
        <meshStandardMaterial color={cream} />
      </mesh>
      <mesh position={[x, wh / 2, z]}>
        <boxGeometry args={[w + 0.04, wh, dDepth + 0.04]} />
        <meshStandardMaterial color={wainscot} />
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
      <DecorProps />
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
