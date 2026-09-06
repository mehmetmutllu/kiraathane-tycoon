import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Group, type MeshStandardMaterial } from 'three';
import { useGame, questFocusPos, LAYOUT, stationSoftMaxLevel, stationUpgradeCostAt, stationUpgradeUnlocked, tableSoftMaxLevel, tableUpgradeUnlockedIn, tableNextCost, areaPoint, areaCol, areaRow, areaAt, openServices } from '../../game/store';
import { economyConfig } from '../../config/economy.config';
import { areaOfTable, serviceProduct, SERVICE_AREAS } from '../../game/world';
import { SceneLights } from './lights';
import { GroundMarker } from './GroundMarker';
import { FloorPattern } from './floorPattern';
import { WALL_H, WallPanels, type WallSlab } from './wallPanel';
import { PALETTE, FLOOR_THEMES, WALL_THEMES, LIGHTING } from '../../config/palette';
import { Player } from './Player';
import { Waiter } from './Waiter';
import { Dishwasher } from './Dishwasher';
import { Dishes } from './Dishes';
import { Tables } from './Tables';
import { TeaStation, TostStation } from './TeaStation';
import { Customers } from './Customers';
import { Coins } from './Coins';
import { Pad } from './Pad';
import { perf } from '../../game/perf';
import { devTimeScale } from '../../game/devSandbox';
import { screenPointer } from '../../game/screenPointer';

// Simülasyonu her karede ilerlet (tek kaynak; __advanceTime aynı tick'i çağırır).
// DEV'de sandbox hız çarpanı uygulanır; üretimde `import.meta.env.DEV` false → dal ölü kod.
function Simulation() {
  const tick = useGame((s) => s.tick);
  useFrame((_, dt) => tick(import.meta.env.DEV ? dt * devTimeScale() : dt));
  return null;
}

// AKTİF ADIMIN EKRAN İZDÜŞÜMÜ (plan §9 — Tek Odak'ın görsel kanalı). Aktif görevin dünya hedefi
// kameraya izdüşürülür; ekran dışındaysa HUD kenarda ok gösterir. Store'a YAZMAZ (her kare render
// tetiklemesin) — `perf` gibi singleton'a yazar, HUD ~20Hz okur.
function QuestPointer() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const g = useGame.getState();
    const def = g.questIndex < economyConfig.quests.length ? economyConfig.quests[g.questIndex] : null;
    const target = g.quest && def ? questFocusPos(def.target, g.tableLevels, g.tables, def.area ?? 0) : null;
    if (!target) {
      screenPointer.active = false;
      return;
    }
    v.set(target[0], 0.9, target[2]);
    screenPointer.dist = Math.hypot(target[0] - g.player[0], target[2] - g.player[2]);
    v.project(camera);
    const behind = v.z > 1;
    let x = (v.x * 0.5 + 0.5) * size.width;
    let y = (-v.y * 0.5 + 0.5) * size.height;
    if (behind) {
      x = size.width - x;
      y = size.height - y;
    }
    // Kenar payı: bant/nav'ın altında kalmasın diye üstte 90, altta 170 px korunur.
    const m = 34;
    const minY = 90;
    const maxY = size.height - 170;
    const inside = !behind && x > m && x < size.width - m && y > minY && y < maxY;
    screenPointer.active = true;
    screenPointer.onScreen = inside;
    if (!inside) {
      const cx = size.width / 2;
      const cy = (minY + maxY) / 2;
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy) || 1;
      // Merkezden hedefe doğru ışın, güvenli dikdörtgenin kenarına kırpılır.
      const sx = Math.abs(dx) > 0.001 ? (size.width / 2 - m) / Math.abs(dx) : Infinity;
      const sy = Math.abs(dy) > 0.001 ? (maxY - cy) / Math.abs(dy) : Infinity;
      const s = Math.min(sx, sy);
      screenPointer.x = cx + dx * s;
      screenPointer.y = cy + dy * s;
      screenPointer.angle = (Math.atan2(dy / len, dx / len) * 180) / Math.PI;
    } else {
      screenPointer.x = x;
      screenPointer.y = y;
    }
  });
  return null;
}

// FPS / render bütçesi probe'u (FPS Tier 2). gl.info.render = r3f'de kare başı otomatik resetlenir
// (autoReset true) → calls/triangles ANLIK kare maliyeti. 0.5sn pencerede FPS ortalanır (anlık
// dt gürültüsünü bastırır). Sonuç perf singleton + window.__perf'e yazılır; render YOK (overlay HUD'da).
function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const acc = useRef({ frames: 0, time: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    a.frames += 1;
    a.time += dt;
    if (a.time >= 0.5) {
      perf.fps = Math.round(a.frames / a.time);
      perf.calls = gl.info.render.calls;
      perf.tris = gl.info.render.triangles;
      a.frames = 0;
      a.time = 0;
      // DEV teşhis: sahne/kamera/renderer'ı dışa aç (draw-call dağılımı analizi).
      if (import.meta.env.DEV) (window as unknown as { __three?: unknown }).__three = { gl, scene, camera };
    }
  });
  return null;
}

// ÇÖZÜNÜRLÜK BÜTÇESİ (P0 perf, 2026-09-06). Fragment (piksel) maliyeti doğrudan arka tamponun
// piksel sayısıyla ölçeklenir. `dpr={[1,2]}` telefonda doğru ama PC'de TAM EKRAN + Windows ekran
// ölçeklemesi (%125-150 çok yaygın) tamponu 1920×1080 yerine 2400×1350 / 2880×1620 yapıyordu —
// aynı sahne için 1,6-2,25 kat piksel. Burada toplam piksel sayısına tavan konur: küçük tuvalde
// (telefon, UI önizlemeleri) hiçbir şey değişmez, büyük tuvalde dpr 1'e kadar iner. 1'in ALTINA
// İNMEZ — bulanıklık görsel bir karardır, ölçüm kararı değil.
const PIXEL_BUDGET = 2_300_000; // ~1920×1200

function AdaptiveResolution() {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const setDpr = useThree((s) => s.setDpr);
  useEffect(() => {
    const area = Math.max(1, width * height);
    const budgetDpr = Math.sqrt(PIXEL_BUDGET / area);
    setDpr(Math.min(window.devicePixelRatio || 1, 2, Math.max(1, budgetDpr)));
  }, [width, height, setDpr]);
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
      // Kamera mesafesi tarihçesi: ilk APK dönemi taban 6 × clamp 1.3 (telefonda ~7.8). 2026-06-09'da
      // 7'ye çekildi, turu-5'te 6.4 + clamp 1.4 (~8.96) oldu. Ferahlama sonrası kullanıcı isteği
      // (2026-06-13): "ilk zamandaki gibi yakın" → taban 6 + clamp 1.3'e DÖNÜŞ; genel bakış için
      // HUD'da zoom-out butonu var (camZoomOut ×1.45 ≈ eski uzak görünümden biraz geniş).
      const fit = aspect < 1 ? Math.min(1.3, 1 / aspect) : 1;
      st.current.d = 6 * fit;
    }
    // KAMERA ODAĞI (quest sistemi): odak varken hedefe kay + hafif zoom; girdi gelince store odağı
    // iptal eder → buradaki damping kendiliğinden oyuncuya geri süzülür (ek durum makinesi yok).
    const focus = g.camFocus;
    const zoomMul = g.camZoomOut ? 1.45 : 1;
    const d = (focus ? st.current.d * 0.72 : st.current.d) * zoomMul;
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

// Açık SERVİSLERİN çay ocağı MODÜLLERİ (alan-başı mutfak, D-025): a0 sol duvar, a1 sağ duvar (aynalı).
// Modül kendi duvarına paralel; ön yüz salona bakar (rotasyon LAYOUT.stationRots'tan).
function Stations() {
  const areasOpen = useGame((s) => s.areasOpen);
  const stationLevels = useGame((s) => s.stationLevels);
  const readyCupsByService = useGame((s) => s.readyCupsByService);
  return (
    <>
      {LAYOUT.stations.slice(0, areasOpen).map((p, z) => (
        <group key={z} position={[p[0], 0, p[2]]} rotation={[0, LAYOUT.stationRots[z], 0]}>
          {serviceProduct(z) === 'tost' ? (
            <TostStation position={[0, 0, 0]} level={stationLevels[z]} readyCount={readyCupsByService[z]} />
          ) : (
            <TeaStation position={[0, 0, 0]} level={stationLevels[z]} readyCups={readyCupsByService[z]} />
          )}
        </group>
      ))}
    </>
  );
}

// Çaycı NPC (D-023; kullanıcı tarifi: "duvar ile tezgah arasında çalışan biri"). SALT GÖRSEL —
// mekaniğe dokunmaz: kendi ocağının arkasındaki koridorda yürür, durup tezgâha dönüp "iş yapar".
// D-025: her açık SERVİSİN ocağı kendi duvarında → yeni alan açılınca onun da çaycısı belirir (aynalı).
function KitchenHand({ service }: { service: number }) {
  const ref = useRef<Group>(null);
  const zMin = -4.6;
  const zMax = -1.4; // şablon (alan-yerel) mutfak bloğu aralığı (bulaşık -4.9..-3.5 + ocak -3.6..-1.4)
  // Y1: ARKA-duvar tezgâhı (yemek counter'ı, stationRot 0) arkasında x-ekseni boyunca yürünür;
  // yan-duvar mutfaklarında z-ekseni boyunca (eski şablon). Yol istasyon konumundan türetilir.
  const area = SERVICE_AREAS[service] ?? 0;
  const backWall = LAYOUT.stationRots[service] === 0;
  const stPos = LAYOUT.stations[service];
  const span = 1.1; // tezgâh uzun-kenar yarısı (stationHalves uzun ekseni) — uçtan uca tur
  // M2: konum ALAN şablonundan türetilir — sağ kolon aynalı, arka sıra −z kaydırmalı (areaPoint).
  const faceIn = backWall ? 0 : areaCol(area) ? -Math.PI / 2 : Math.PI / 2;
  // useMemo: her render yeni dizi üretirse aşağıdaki kayıt effect'i boşuna yeniden koşar.
  const start = useMemo(
    () =>
      backWall
        ? ([stPos[0] - span, 0, stPos[2] - 0.65] as const)
        : areaPoint(area, [-5.0, 0, -3]),
    [area, backWall, stPos, span],
  );
  // M3: tost ustası çaycıdan kıyafetle ayrışır (hardal önlük + beyaz kep).
  const isFood = serviceProduct(service) === 'tost';
  const apron = isFood ? PALETTE.foodApron : PALETTE.apron;
  const cap = isFood ? PALETTE.foodCap : PALETTE.cap;
  useFrame((st) => {
    const grp = ref.current;
    if (!grp) return;
    const t = st.clock.elapsedTime * 0.3;
    const u = (Math.sin(t) + 1) / 2;
    let walkRot: number;
    if (backWall) {
      grp.position.x = stPos[0] - span + u * span * 2;
      grp.position.z = stPos[2] - 0.65; // duvar ile tezgâh arasındaki koridor
      walkRot = Math.cos(t) > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      const p = areaPoint(area, [-5.0, 0, zMin + u * (zMax - zMin)]);
      grp.position.x = p[0];
      grp.position.z = p[2];
      walkRot = Math.cos(t) > 0 ? 0 : Math.PI;
    }
    // Rota ucunda durup tezgâha dönüp "iş yapar" (eğilme); arada yürür (hafif zıplama).
    const speed = Math.abs(Math.cos(t));
    grp.rotation.y = speed < 0.25 ? faceIn : walkRot;
    grp.position.y = speed < 0.25 ? -0.04 + Math.sin(st.clock.elapsedTime * 3) * 0.02 : Math.abs(Math.sin(st.clock.elapsedTime * 7)) * 0.04;
  });
  return (
    <group ref={ref} position={[start[0], 0, start[2]]}>
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
        <meshStandardMaterial color={apron} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color={PALETTE.skin} />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <cylinderGeometry args={[0.135, 0.14, 0.06, 10]} />
        <meshStandardMaterial color={cap} />
      </mesh>
    </group>
  );
}

function KitchenStaff() {
  const areasOpen = useGame((s) => s.areasOpen);
  // Her açık SERVİSİN kendi çaycısı (M2: konum/yön areaPoint şablonundan).
  return (
    <>
      {openServices(areasOpen).map((sv) => (
        <KitchenHand key={sv} service={sv} />
      ))}
    </>
  );
}

// Rezerve servis odaları (floorplan-master.md; D-023): DEPO sol-arka + TUVALET sağ-arka (bina arkasına
// bitişik ek odalar) + MERDİVEN ön-sağ köşe (Faz 3b üst kat). Salt görsel greybox rezerv.
function ReservedRooms() {
  // 2026-06-11 revizyon: arka-sol hücre kalıcı REZERV arsa → DEPO görseli hep durur;
  // TUVALET (sağ-arka) 3. alan (arka-sağ TOST) açılınca o bölge gerçek salon olduğundan kalkar.
  const fz = LAYOUT.areaBounds[0].minZ; // ön sıranın arka çizgisi
  const areasOpen = useGame((s) => s.areasOpen);
  return (
    <group>
      {/* DEPO (sol-arka ek oda) — rezerv arsada kalıcı görsel */}
      <group position={[-3.2, 0, fz - 1.6]}>
        <mesh castShadow position={[0, 0.7, 0]}>
          <boxGeometry args={[3.0, 1.4, 2.2]} />
          <meshStandardMaterial color={PALETTE.wainscot} />
        </mesh>
        <mesh position={[0, 0.55, 1.11]}>
          <boxGeometry args={[0.9, 1.1, 0.04]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
      </group>
      {/* TUVALET (sağ-arka ek oda) — 3. alan açılınca kalkar */}
      {areasOpen > 1 && areasOpen < 3 && (
        <group position={[13.8, 0, fz - 1.6]}>
          <mesh castShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[2.4, 1.4, 2.2]} />
            <meshStandardMaterial color={PALETTE.wallCream} />
          </mesh>
          <mesh position={[0, 0.55, 1.11]}>
            <boxGeometry args={[0.8, 1.1, 0.04]} />
            <meshStandardMaterial color={PALETTE.doorWood} />
          </mesh>
        </group>
      )}
      {/* Merdiven kaldırıldı (telefon feedback 2026-06-12: garson pad'iyle çakışıyordu; Faz 3b'de yeniden) */}
    </group>
  );
}

// Mekânsal ocak-yükseltme noktaları (SERVİS BAŞINA; ocağın önünde). Üstünde dur → dolum yayı ilerler.
function StationUpgradeSpots() {
  const areasOpen = useGame((s) => s.areasOpen);
  const stationLevels = useGame((s) => s.stationLevels);
  const upgradeFills = useGame((s) => s.upgradeFills);
  const wallet = useGame((s) => s.wallet);
  const padsDone = useGame((s) => s.padsDone);
  const tables = useGame((s) => s.tables);
  const lifetime = useGame((s) => s.lifetime);
  const gate = { padsDone, tables, stationLevel: stationLevels[0], lifetime: lifetime.toNumber() };
  return (
    <>
      {openServices(areasOpen).map((z: number) => {
        if (stationLevels[z] >= stationSoftMaxLevel()) return null;
        if (!stationUpgradeUnlocked(z, gate)) return null;
        // M3: maliyet + etiket SERVİSİN ÜRÜNÜNDEN (tost tezgâhı kendi çarpanıyla; "Çay Yükselt" yanlış olur).
        const cost = stationUpgradeCostAt(z, stationLevels[z]);
        // KALAN tutar (2026-06-11 feedback: kısmi dolum düşülmüş hali yazsın).
        const remaining = Math.max(0, Math.ceil(cost - upgradeFills[z]));
        return (
          <GroundMarker
            key={z}
            pos={LAYOUT.stationUpgradeSpots[z]}
            label={serviceProduct(z) === 'tost' ? 'Tost Yükselt' : 'Çay Yükselt'}
            sub={String(remaining)}
            coin
            tint="#ffce54"
            progress={upgradeFills[z] / cost}
            afford={wallet.toNumber() >= remaining}
          />
        );
      })}
    </>
  );
}

// Bulaşık noktaları (Faz 2e; SERVİS BAŞINA, D-022): kirli bardaklar burada yıkanır.
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
  const areasOpen = useGame((s) => s.areasOpen);
  return (
    <>
      {LAYOUT.dishStations.slice(0, areasOpen).map((p, z) => (
        <DishStationUnit key={z} pos={p} rot={LAYOUT.dishRots[z]} />
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
  const gate = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber() };
  const cash = wallet.toNumber();
  return (
    <>
      {LAYOUT.tables.slice(0, tables).map((t, i) => {
        // v21: her masanın işareti KENDİ ALANININ gate'ine bağlı (o alanın 4 masası açık mı).
        if (!tableUpgradeUnlockedIn(areaOfTable(i), gate)) return null;
        const lvl = tableLevels[i] ?? 0;
        if (lvl >= tableSoftMaxLevel()) return null; // max → işaret gizlenir
        const cost = tableNextCost(lvl, areaOfTable(i));
        const remaining = Math.max(0, Math.ceil(cost - (tableUpgradeFills[i] ?? 0)));
        return (
          <GroundMarker
            key={i}
            pos={t.upgradeSpot}
            label="Masa"
            sub={String(remaining)}
            coin
            tint="#ffce54"
            radius={0.6}
            progress={(tableUpgradeFills[i] ?? 0) / cost}
            afford={cash >= remaining}
          />
        );
      })}
    </>
  );
}

// (v29: WaiterUpgradeMarker kalktı — garson hızı karakter panelinden satın alınır.)

function Ground() {
  // Tüm alanları kapsayan AHŞAP zemin (DÜZ renk — canvas-tile geri alındı, kullanıcı 2026-06-11:
  // "zemin iğrenç oldu"). WP6 kozmetik teması KORUNUR: alan overlay'i temanın DÜZ base rengi
  // (+dama temasında quad satranç deseni). KİLİM KALDIRILDI (kullanıcı 2026-06-11: "ortadaki halıya
  // gerek yok, daha soft bir zemin") — alan zemini tek yumuşak düz renk.
  const floorThemeByArea = useGame((s) => s.floorThemeByArea);
  // Kilitli ALANIN zemini ÇİZİLMEZ (2026-06-11: karanlık örtü kalktı — kapalı salon "boş arsa";
  // taban ahşap düzlem dışarıda her yerde zaten görünür, kilitli bölge de onunla aynı kalır).
  const areasOpen = useGame((s) => s.areasOpen);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[6, 0, -5.5]}>
        <planeGeometry args={[38, 30]} />
        <meshStandardMaterial color={PALETTE.floorWood} />
      </mesh>
      {LAYOUT.areaBounds.slice(0, areasOpen).map((za, z) => {
        // Overlay DUVARA KADAR uzar (DIŞ/kilitli kenarlarda +0.55) — duvar dibinde eski renk şerit
        // kalmaz (kullanıcı bug'ı 2026-06-11). AÇIK komşuya bakan kenar tam sınırda biter (M2:
        // üst üste binen overlay z-fighting yapardı).
        const col = areaCol(z);
        const row = areaRow(z);
        // Komşular ızgaradan (areaAt; -1 = dış dünya/rezerv arsa = kapalı kenar sayılır).
        const sideN = areaAt(col === 0 ? col + 1 : col - 1, row);
        const vertN = areaAt(col, row === 0 ? 1 : 0);
        const sideOpen = sideN >= 0 && sideN < areasOpen;
        const vertOpen = vertN >= 0 && vertN < areasOpen;
        const x0 = za.minX - (col === 0 || !sideOpen ? 0.55 : 0);
        const x1 = za.maxX + (col === 1 || !sideOpen ? 0.55 : 0);
        const z0 = za.minZ - (row === 1 || !vertOpen ? 0.55 : 0);
        const z1 = za.maxZ + (row === 0 || !vertOpen ? 0.55 : 0);
        const theme = FLOOR_THEMES[floorThemeByArea[z] ?? 'parke'] ?? FLOOR_THEMES.parke;
        return (
          <group key={z}>
            {/* y: taban(0) < tema tabanı(0.004) < desen(0.006) < GroundMarker(0.02).
                G2: plank/tile temada bu düzlem DERZ'dir — tahtaların arasından görünen koyu alt
                katman. Düz/dama temada eskisi gibi zeminin kendi rengi. */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.004, (z0 + z1) / 2]}>
              <planeGeometry args={[x1 - x0, z1 - z0]} />
              <meshStandardMaterial color={theme.grout ?? theme.base} />
            </mesh>
            <FloorPattern theme={theme} x0={x0} x1={x1} z0={z0} z1={z1} />
          </group>
        );
      })}
    </group>
  );
}

// TV köşesi (1. alanın arka duvarı): askılı TV + EKRANDA MAÇ OYNAR (WP4, feedback §C16):
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

// YEMEK ALANI KİMLİK PAKETİ (Y1, docs/yemek-alani-garson-plan.md §4): tezgâh arkasındaki duvarda
// MENÜ PANOSU (kara tahta + tebeşir satırları + tost silüeti) + salon zeminine ÇATAL-BIÇAK/TOST
// AMBLEMİ (primitive mesh — kendi şeklimiz, hazır asset yok). Salt görsel; tost salonu açılınca belirir.
function FoodCorner() {
  const areasOpen = useGame((s) => s.areasOpen);
  const foodService = 2; // serviceProduct(2)==='tost' — tek yemek servisi
  if (openServices(areasOpen).indexOf(foodService) < 0) return null;
  const st = LAYOUT.stations[foodService]; // arka-duvar counter'ı (Y1) — pano onun üstüne asılır
  const za = LAYOUT.areaBounds[SERVICE_AREAS[foodService]];
  // Amblem salonun oturma alanı ortasında (masa sütunları x 7.4/11.8, sıralar z -8.4/-11.3).
  const ex = (za.minX + za.maxX) / 2 - 1.0;
  const ez = -9.85;
  const mark = PALETTE.wainscot; // koyu kahve işaretler — açık fayansta okunur
  return (
    <group>
      {/* MENÜ PANOSU: duvar konsolu + çerçeve + kara tahta + tebeşir satırları (TvCorner dili) */}
      <group position={[st[0], 0, za.minZ - 0.25]}>
        <mesh castShadow position={[0, 1.35, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshStandardMaterial color={PALETTE.menuBoardFrame} />
        </mesh>
        <mesh castShadow position={[0, 1.78, 0.05]}>
          <boxGeometry args={[2.5, 1.0, 0.08]} />
          <meshStandardMaterial color={PALETTE.menuBoardFrame} />
        </mesh>
        <mesh position={[0, 1.78, 0.1]}>
          <boxGeometry args={[2.3, 0.84, 0.02]} />
          <meshStandardMaterial color={PALETTE.menuBoard} />
        </mesh>
        {/* başlık şeridi + altında 3 menü satırı (satır + fiyat noktası) */}
        <mesh position={[-0.3, 2.08, 0.115]}>
          <boxGeometry args={[1.0, 0.09, 0.01]} />
          <meshStandardMaterial color={PALETTE.menuChalk} />
        </mesh>
        {[1.88, 1.7, 1.52].map((y, i) => (
          <group key={y}>
            <mesh position={[-0.42, y, 0.115]}>
              <boxGeometry args={[1.2 - i * 0.15, 0.05, 0.01]} />
              <meshStandardMaterial color={PALETTE.menuChalk} opacity={0.8} transparent />
            </mesh>
            <mesh position={[0.78, y, 0.115]}>
              <boxGeometry args={[0.18, 0.05, 0.01]} />
              <meshStandardMaterial color={PALETTE.brass} />
            </mesh>
          </group>
        ))}
        {/* panonun sağ alt köşesinde tost silüeti (ekmek + ızgara izi) */}
        <group position={[0.82, 2.0, 0.115]}>
          <mesh>
            <boxGeometry args={[0.3, 0.22, 0.012]} />
            <meshStandardMaterial color={PALETTE.toast} />
          </mesh>
          <mesh position={[0, 0, 0.008]} rotation={[0, 0, 0.6]}>
            <boxGeometry args={[0.3, 0.04, 0.006]} />
            <meshStandardMaterial color={PALETTE.toastDark} />
          </mesh>
        </group>
      </group>
      {/* ZEMİN AMBLEMİ: yuvarlak zemin plakası + çatal (sol) + tost (orta) + bıçak (sağ).
          y katmanı: overlay 0.004 < dama 0.006 < plaka 0.009 < işaret 0.013 < GroundMarker 0.02. */}
      <group position={[ex, 0, ez]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
          <circleGeometry args={[1.15, 28]} />
          <meshStandardMaterial color={PALETTE.foodFloorEmblem} />
        </mesh>
        {/* çatal: sap + boyun + 3 diş */}
        <group position={[-0.62, 0.013, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.32]}>
            <planeGeometry args={[0.09, 0.78]} />
            <meshStandardMaterial color={mark} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.13]}>
            <planeGeometry args={[0.26, 0.14]} />
            <meshStandardMaterial color={mark} />
          </mesh>
          {[-0.095, 0, 0.095].map((dx) => (
            <mesh key={dx} rotation={[-Math.PI / 2, 0, 0]} position={[dx, 0, -0.36]}>
              <planeGeometry args={[0.055, 0.34]} />
              <meshStandardMaterial color={mark} />
            </mesh>
          ))}
        </group>
        {/* tost: 45° kare ekmek + çapraz ızgara izi */}
        <group position={[0, 0.013, 0]} rotation={[0, Math.PI / 4, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.62, 0.62]} />
            <meshStandardMaterial color={mark} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshStandardMaterial color={PALETTE.foodFloorEmblem} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
            <planeGeometry args={[0.66, 0.07]} />
            <meshStandardMaterial color={mark} />
          </mesh>
        </group>
        {/* bıçak: sap + genişleyen ağız */}
        <group position={[0.62, 0.013, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.36]}>
            <planeGeometry args={[0.09, 0.7]} />
            <meshStandardMaterial color={mark} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.03, 0, -0.3]}>
            <planeGeometry args={[0.17, 0.62]} />
            <meshStandardMaterial color={mark} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// Dekor prop'ları (WP4, feedback §C11: "her yer boş"): detaylı çöp kovası + iç mekân saksıları +
// duvar saati. Salt görsel (yürüme yollarının dışında, collision yok; primitive = nihai stil D-013).
function DecorProps() {
  return (
    <group>
      {/* çöp kovaları — konumlar LAYOUT.decor'da (temas gölgesi de oradan okur).
          1) kapı yanı, ÖN DUVAR DİBİ (2026-06-11: yürüme şeridinin ortasındaydı, takılan müşteri
             onun üstünde titreyince "kova engelliyor" hissi verdi) — kuşaklı, tam detay.
          2) mutfak ucu (ocak ile garson pad'i arasında, ikisine de girmez) — küçük, kuşaksız. */}
      {LAYOUT.decor.trashCans.map((t) => (
        <group key={`${t.pos[0]}${t.pos[2]}`} position={[t.pos[0], 0, t.pos[2]]} scale={t.scale}>
          <mesh castShadow position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.2, 0.16, 0.6, 12]} />
            <meshStandardMaterial color={PALETTE.trashBody} metalness={0.3} roughness={0.6} />
          </mesh>
          {t.rings
            ? [0.14, 0.32, 0.5].map((h) => (
                <mesh key={h} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.187, 0.008, 6, 14]} />
                  <meshStandardMaterial color={PALETTE.trashLid} />
                </mesh>
              ))
            : null}
          <mesh castShadow position={[0, 0.63, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.06, 12]} />
            <meshStandardMaterial color={PALETTE.trashLid} metalness={0.3} roughness={0.5} />
          </mesh>
          {t.rings ? (
            <mesh castShadow position={[0, 0.69, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
              <meshStandardMaterial color={PALETTE.trashLid} />
            </mesh>
          ) : null}
        </group>
      ))}
      {/* iç mekân saksıları (köşeler; sokak saksısının iç versiyonu) */}
      {LAYOUT.decor.planters.map(([px, , pz]) => (
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

// Duvarlar yalnız AÇIK ALANLARI sarar (2026-06-11 telefon feedback'i: karanlık örtü hacmi mobilde
// AYDINLIK göründü + alan sınırındaki kelepçe "görünmez engel" hissi verdi → örtü KALDIRILDI, bina
// kilitliyken 1. alanı 4 GERÇEK duvarla biter; sağ duvar alan sınırına oturur = kelepçe duvar olur).
// 2. alan kilitliyken HİÇ ÇİZİLMEZ (yanı düz "boş arsa"); pad açılınca bina sağa uzar (kamera panı var).
// TEK KAPI (1. alanın ortası; D-023 — tüm müşteriler buradan girer/çıkar). Açıkken İÇ BÖLME DUVARI YOK.
function Walls() {
  const areasOpen = useGame((s) => s.areasOpen);
  // WP6: duvar teması ALAN başına (wallThemeByArea persist). M2: duvarlar alan-kenarı başına üretilir →
  // tema bölmesi kendiliğinden doğru (her parça kendi ALANININ temasını giyer).
  const wallThemeByArea = useGame((s) => s.wallThemeByArea);
  const themeOf = (z: number) => WALL_THEMES[wallThemeByArea[z] ?? 'krem'] ?? WALL_THEMES.krem;
  const m = 0.5; // alan kenarı ile dış duvar arası pay (oyuncu kelepçe standoff'u ile birebir)
  const h = WALL_H; // G3: yükseklik + profiller wallPanel.tsx'te (mağaza önizlemesiyle ortak)
  const t = 0.2;
  const doorHalf = 1.3;
  const doorX = LAYOUT.entrances[0][0]; // tek kapı (z0 ön duvarı)
  const isOpen = (z: number) => z >= 0 && z < areasOpen;
  type Piece = WallSlab;
  const pieces: Piece[] = [];
  for (let z = 0; z < areasOpen; z++) {
    const za = LAYOUT.areaBounds[z];
    const col = areaCol(z);
    const row = areaRow(z);
    const th = themeOf(z);
    // Komşular ızgaradan bulunur (areaAt): -1 = dış dünya YA DA alansız rezerv hücre (arka-sol) —
    // ikisi de "kapalı kenar" sayılır, duvar çizilir.
    const leftN = areaAt(col - 1, row);
    const rightN = areaAt(col + 1, row);
    const backN = row === 0 ? areaAt(col, 1) : -1; // ön sıranın arka komşusu
    // Yatay (ön/arka) duvarların x uzanımı: dış/kilitli yan uçlarda m taşar (köşe kapanır),
    // açık yan komşuda tam kenarda biter (komşu kendi parçasını çizer — tema bölmesi).
    const xExtL = leftN === -1 || !isOpen(leftN) ? m : 0;
    const xExtR = rightN === -1 || !isOpen(rightN) ? m : 0;
    const hx0 = za.minX - xExtL;
    const hx1 = za.maxX + xExtR;
    // Dikey (sol/sağ) duvarların z uzanımı: ön kenar dışsa +m; arka kenar açık komşuya bakıyorsa
    // sınırda biter (geçitli sıra-duvarı orayı kapatır), değilse -m.
    const vz0 = za.minZ - (row === 1 || !isOpen(backN) ? m : 0);
    const vz1 = za.maxZ + (row === 0 ? m : 0);
    // SOL kenar (dış ya da kilitli komşu → duvar; açık yatay komşu → duvar YOK, D-023)
    if (leftN === -1 || !isOpen(leftN))
      pieces.push({ x: za.minX - m, z: (vz0 + vz1) / 2, w: t, d: vz1 - vz0, theme: th });
    // SAĞ kenar (kilitliyken alan sınırına oturur = eski "kelepçe duvarı" davranışı)
    if (rightN === -1 || !isOpen(rightN))
      pieces.push({ x: za.maxX + m, z: (vz0 + vz1) / 2, w: t, d: vz1 - vz0, theme: th });
    // ÖN kenar: ön sıra → dış duvar (z0'da kapı boşluğu); arka sıra → geçitli sıra-duvarı (aşağıda).
    if (row === 0) {
      const fz = za.maxZ + m;
      const hasDoor = doorX > za.minX && doorX < za.maxX;
      const segs: [number, number][] = hasDoor
        ? [
            [hx0, doorX - doorHalf],
            [doorX + doorHalf, hx1],
          ]
        : [[hx0, hx1]];
      segs.forEach(([sx, ex]) => {
        if (ex - sx > 0.01)
          pieces.push({ x: (sx + ex) / 2, z: fz, w: ex - sx, d: t, theme: th });
      });
    }
    // ARKA kenar: arka komşu AÇIKSA duvar YOK (2026-06-11: z1↔z2 sınırı tamamen açık — sıra-arası
    // geçitli duvar kaldırıldı); değilse dış duvar.
    if (!(row === 0 && isOpen(backN)) && row === 0)
      pieces.push({ x: (hx0 + hx1) / 2, z: za.minZ - m, w: hx1 - hx0, d: t, theme: th });
    if (row === 1)
      pieces.push({ x: (hx0 + hx1) / 2, z: za.minZ - m, w: hx1 - hx0, d: t, theme: th });
  }
  // L-şekil iç köşe dikmesi (yalnız 3 alan açıkken): a0 arka duvarı (z −5.8) ile a2 SOL duvarı
  // (x 4.8) çapraz buluşur — aradaki boşluk rezerv arka-sol arsaya bakar; dikme kapatır
  // (tamamen rezerv bölgede durur, açık alanlara taşmaz).
  if (areasOpen === 3) {
    const bx = LAYOUT.areaBorderX;
    const bz = LAYOUT.areaBounds[0].minZ;
    pieces.push({ x: bx - m / 2, z: bz - m / 2, w: m + t, d: m + t, theme: themeOf(0) });
  }
  const frontEdgeZ = LAYOUT.areaBounds[0].maxZ + m; // kapı sövesi referansı
  return (
    <group>
      <WallPanels slabs={pieces} />
      {/* kapı sövesi + çerçevesi (ön duvarın TAMAMEN önünde — z-fighting yok) */}
      <group>
        <mesh position={[doorX, h - 0.12, frontEdgeZ + 0.22]}>
          <boxGeometry args={[doorHalf * 2 + 0.3, 0.24, 0.12]} />
          <meshStandardMaterial color={PALETTE.lintel} />
        </mesh>
        <mesh position={[doorX - doorHalf, h / 2, frontEdgeZ + 0.22]}>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
        <mesh position={[doorX + doorHalf, h / 2, frontEdgeZ + 0.22]}>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
      </group>
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
      {/* kaldırım şeridi (TÜM cephe boyu — alanların kapıları da buraya açılır) */}
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
    // SAHNEDE GÖLGE YOK (D-054). `shadows` prop'u bilerek verilmiyor ve yönlü ışık gölge
    // dökmüyor. Dört varyant aynı kareden çekilip karşılaştırıldı (sert gölge · gölgesiz ·
    // yumuşak/VSM · gölgesiz+temas havuzu); kullanıcı GÖLGESİZ olanı seçti — My Hotel'in düz
    // görünümü. Yan kazanç: gölge haritası tek başına kare süresinin yarısını yiyordu
    // (1,31 → 0,67 ms). Mesh'lerdeki castShadow/receiveShadow bayrakları duruyor (bedelsiz;
    // gölge geri istenirse `shadows` + `castShadow` iki satır). Gerekçe: decisions.md D-054.
    <Canvas
      camera={{ position: [0, 9, 11], fov: 50 }}
      gl={{ antialias: true, toneMappingExposure: LIGHTING.exposure }}
      dpr={[1, 2]}
    >
      {/* IŞIK (G0) — renkler palette.ts LIGHTING'te, gerekçe orada yazılı.
          NOT: tone mapping ZATEN ACESFilmic (r3f varsayılanı, `flat` verilmedi) — bu yüzden
          burada yeniden atanmıyor, yalnız exposure ile değer aralığı açılıyor. */}
      <AdaptiveResolution />
      <color attach="background" args={[LIGHTING.background]} />
      <fog attach="fog" args={[LIGHTING.background, LIGHTING.fogNear, LIGHTING.fogFar]} />
      {/* Işık takımı `three/lights.tsx`te TEK tanım — mağaza önizlemeleri de aynı bileşeni
          kullanır, böylece kartta gördüğün renk salondakiyle birebir aynı olur.
          Yönlü ışık gölge DÖKMEZ; yalnız yüzey yönüne göre aydınlatma (hacim hissi) verir. */}
      <SceneLights />
      <Ground />
      <Street />
      <Walls />
      <TvCorner />
      <FoodCorner />
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
        <StationUpgradeSpots />
        <TableUpgradeMarkers />
      </Suspense>
      <CameraRig />
      <Simulation />
      <QuestPointer />
      <PerfProbe />
    </Canvas>
  );
}
