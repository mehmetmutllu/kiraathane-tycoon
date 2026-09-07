import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3, BufferGeometry, Float32BufferAttribute, DoubleSide, type Group, type PerspectiveCamera } from 'three';
import type { AreaSide } from '../../game/store';
import { useGame, questFocusPos, LAYOUT, LAVABO, BAND, FLOOR_HALF, wallSpans, servicePlace, stationSoftMaxLevel, stationUpgradeCostAt, stationUpgradeUnlocked, tableSoftMaxLevel, tableUpgradeUnlockedIn, tableNextCost, openServices, doorX as doorAt, entranceAt, banketIslands, BANKET, WAITER_STATION, waiterStationOpen } from '../../game/store';
import { economyConfig, lavaboUpgradeCost } from '../../config/economy.config';
import { areaOfTable, isCounter, THE_SERVICE } from '../../game/world';
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
import { ServicePoint } from './ServicePoint';
import { Customers } from './Customers';
import { Coins } from './Coins';
import { Pad } from './Pad';
import { Decor } from './Decor';
import { MaketLavaboBlock } from './maketParts';
import { perf } from '../../game/perf';
import { devTimeScale, devTopDown, useSandbox } from '../../game/devSandbox';
import { screenPointer } from '../../game/screenPointer';

/** GEÇİCİ (2026-09-07 ölçümü): maketle aynı ton eşlemesi (kapalı) — bkz. Canvas'taki not. */
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
    const target = g.quest && def ? questFocusPos(def.target, g.tableLevels, g.tables, g.areasOpen, def.area ?? 0) : null;
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
    // DEV — ÜSTTEN PLAN: kamera oyuncuyu bırakır, katın merkezine dik tepeden bakar (maketi
    // üstten çevirmenin oyun içi karşılığı). Mesafe fov + en-boy oranından hesaplanır, yani
    // portrede de landscape'te de 34 × 34'ün TAMAMI kadraja sığar. Üretimde bu dal ölü kod.
    if (import.meta.env.DEV) {
      const td = devTopDown();
      if (td) {
        const cam = camera as PerspectiveCamera;
        const aspect = size.width / Math.max(1, size.height);
        const vt = Math.tan((cam.fov * Math.PI) / 360); // dikey yarım-açının tanjantı
        const pad = 1.04; // kenarda ince pay: duvarın dış yüzü de görünsün
        const h = (pad * Math.max(FLOOR_HALF / vt, FLOOR_HALF / (vt * aspect))) / td.zoom;
        camera.position.set(0, h, 0.001); // z'de kıl payı: tam dikeyde lookAt yönü belirsiz kalır
        look.set(0, 0, 0);
        camera.lookAt(look);
        st.current.ready = false; // plandan çıkınca takip kamerası sıçramadan yeniden yerleşir
        return;
      }
    }
    // fit/d YALNIZ ekran boyutu gerçekten değişince (resize/orientation) hesaplanır.
    if (size.width !== st.current.w || size.height !== st.current.h) {
      st.current.w = size.width;
      st.current.h = size.height;
      const aspect = size.width / Math.max(1, size.height);
      // Kamera mesafesi tarihçesi: ilk APK dönemi taban 6 × clamp 1.3 (telefonda ~7.8). 2026-06-09'da
      // 7'ye çekildi, turu-5'te 6.4 + clamp 1.4 (~8.96) oldu, 2026-06-13'te "ilk zamandaki gibi
      // yakın" isteğiyle taban 6'ya döndü. **B3-1 (D-061):** kat 21×21 → 34×34 büyüdüğü için taban
      // 6 elendi (portrede oyuncu hizasında yalnız 4,6 birim = sürekli koridor hissi). Yeni taban
      // 8,5 (~6,5 birim: bir banket adası tam sığar), HUD düğmesi ×1.35 ile 11,5'e çıkar
      // (~8,9 birim: alanın yarısı + arka bandın bir bloğu). Ölçüm: docs/gorsel/kadraj-b3.html.
      const fit = aspect < 1 ? Math.min(1.3, 1 / aspect) : 1;
      st.current.d = 8.5 * fit;
    }
    // KAMERA ODAĞI (quest sistemi): odak varken hedefe kay + hafif zoom; girdi gelince store odağı
    // iptal eder → buradaki damping kendiliğinden oyuncuya geri süzülür (ek durum makinesi yok).
    const focus = g.camFocus;
    const zoomMul = g.camZoomOut ? 1.35 : 1; // B ↔ C kademesi (8,5 ↔ 11,5) — D-061
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

// SERVİS NOKTASI (B2: kat çapında TEK obje). Ön yüz salona bakar.
// B3-1 (D-062): 1-2. Alan'da ilk salonun sol duvarında, 3. Alan açılınca ARKA BANDIN servis
// bloğunda — aynı obje, aynı seviye, farklı yer (maket v13 adım 3).
function Stations() {
  const level = useGame((s) => s.stationLevels[THE_SERVICE]);
  const readyTea = useGame((s) => s.ready.tea);
  const readyTost = useGame((s) => s.ready.tost);
  const areasOpen = useGame((s) => s.areasOpen);
  const place = servicePlace(areasOpen);
  const p = place.station;
  return (
    <group position={[p[0], 0, p[2]]} rotation={[0, place.rot, 0]}>
      <ServicePoint position={[0, 0, 0]} level={level} readyTea={readyTea} readyTost={readyTost} />
    </group>
  );
}

// Çaycı NPC (D-023; kullanıcı tarifi: "duvar ile tezgah arasında çalışan biri"). SALT GÖRSEL —
// mekaniğe dokunmaz: kendi ocağının arkasındaki koridorda yürür, durup tezgâha dönüp "iş yapar".
// D-025: her açık SERVİSİN ocağı kendi duvarında → yeni alan açılınca onun da çaycısı belirir (aynalı).
function KitchenHand({ service }: { service: number }) {
  const ref = useRef<Group>(null);
  // B3-1: çaycının yolu artık ŞABLONDAN değil servisin KENDİ yerinden gelir (`staffWalk`) —
  // sol duvar döneminde tezgâhın arkasındaki koridor, arka bant döneminde bloğun içi.
  const areasOpen = useGame((s) => s.areasOpen);
  const place = servicePlace(areasOpen);
  void service;
  const backWall = place.rot === 0;
  const faceIn = place.staffWalk.face;
  const wa = place.staffWalk.a;
  const wb = place.staffWalk.b;
  // useMemo: her render yeni dizi üretirse aşağıdaki kayıt effect'i boşuna yeniden koşar.
  const start = useMemo(() => [wa[0], 0, wa[2]] as const, [wa]);
  // B2: "tost ustası" ayrı bir kişi değil — kat tek servisten döndüğü için tek çaycı var.
  const apron = PALETTE.apron;
  const cap = PALETTE.cap;
  useFrame((st) => {
    const grp = ref.current;
    if (!grp) return;
    const t = st.clock.elapsedTime * 0.3;
    const u = (Math.sin(t) + 1) / 2;
    // Yol = staffWalk doğru parçası; yürüme yönü parçanın kendi ekseninden okunur.
    grp.position.x = wa[0] + u * (wb[0] - wa[0]);
    grp.position.z = wa[2] + u * (wb[2] - wa[2]);
    const walkRot = backWall
      ? (Math.cos(t) > 0 ? Math.PI / 2 : -Math.PI / 2)
      : (Math.cos(t) > 0 ? 0 : Math.PI);
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
// (ReservedRooms KALDIRILDI — B3-2.) Eski 2×2 ızgaranın "rezerv arka-sol arsa"sındaki DEPO ve
// TUVALET kutuları B3-1'de arsa kalkınca sahipsiz kaldı: ikisi de z ≈ −1,6'ya, yani arka yarının
// (a2) tam ortasına düşüyordu — hem KİLİTLİ alanın içinde çiziliyorlardı (D-057'ye aykırı), hem de
// B3-2'nin orta şeridinin üstünde duruyorlardı. Gerçek karşılıkları arka bantta: lavabo ve depo
// B4'te bandın içi açılınca gelecek.

/**
 * BANKET ADALARI (B3-2 — maket v13 adım 6): orta şeridin sırt sırta oturma bankları. İki yüzlü:
 * kaide + gövde, iki yanda oturak minderi, ortada ortak sırtlık ve üstünde ahşap başlık.
 * Ada BOYU birim sayısıyla büyür (`banketIslands`); dış uç sabit kalır, ada içeri doğru uzar —
 * B5 sütun eklediğinde var olan masalar yerinde kalsın diye.
 */
function BanketIslands() {
  const tables = useGame((s) => s.tables);
  const islands = banketIslands(tables);
  if (islands.length === 0) return null;
  const D = BANKET.depth;
  return (
    <group>
      {islands.map((b) => {
        const L = b.len;
        // Sırtlık yastıkları: adanın boyuna göre sığdığı kadar, iki yüze şaşırtmalı.
        const pillows: [number, number][] = [];
        for (let i = 0; i < Math.max(1, Math.floor(L / 3.0)); i++) {
          const px = -L / 2 + 1.4 + i * 3.0;
          if (px > -L / 2 + 0.3 && px < L / 2 - 0.3) pillows.push([px, 0.28]);
          if (px + 1.5 < L / 2 - 0.4) pillows.push([px + 1.5, -0.28]);
        }
        return (
          <group key={b.side} position={b.center}>
            {/* kaide */}
            <mesh castShadow position={[0, 0.1, 0]}>
              <boxGeometry args={[L, 0.2, D]} />
              <meshStandardMaterial color={PALETTE.banketBase} />
            </mesh>
            {/* gövde */}
            <mesh castShadow position={[0, 0.34, 0]}>
              <boxGeometry args={[L - 0.16, 0.3, D - 0.16]} />
              <meshStandardMaterial color={PALETTE.banketBody} />
            </mesh>
            {/* iki yüzün oturak minderleri (y = 0,53 → tabure oturağıyla aynı yükseklik) */}
            {[0.72, -0.72].map((cz) => (
              <mesh key={cz} castShadow position={[0, 0.53, cz]}>
                <boxGeometry args={[L - 0.1, 0.14, 1.02]} />
                <meshStandardMaterial color={PALETTE.banketCushion} />
              </mesh>
            ))}
            {/* ortak sırtlık + iki yüzünün minderi */}
            <mesh castShadow position={[0, 0.85, 0]}>
              <boxGeometry args={[L, 0.78, 0.38]} />
              <meshStandardMaterial color={PALETTE.banketBody} />
            </mesh>
            {[0.21, -0.21].map((cz) => (
              <mesh key={cz} castShadow position={[0, 0.88, cz]}>
                <boxGeometry args={[L - 0.12, 0.62, 0.12]} />
                <meshStandardMaterial color={PALETTE.banketCushion} />
              </mesh>
            ))}
            {/* üst ahşap başlık (adayı bir hacim gibi bitirir) */}
            <mesh castShadow position={[0, 1.28, 0]}>
              <boxGeometry args={[L + 0.12, 0.1, 0.5]} />
              <meshStandardMaterial color={PALETTE.banketBase} />
            </mesh>
            {pillows.map(([px, pz]) => (
              <mesh key={`${px}${pz}`} castShadow position={[px, 0.86, pz]}>
                <boxGeometry args={[0.46, 0.38, 0.16]} />
                <meshStandardMaterial color={PALETTE.banketPillow} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * GARSON SERVİS İSTASYONU (B3-2): tezgâhın sağ ucunda, servis bloğunun ön yüzünde duran aktarma
 * tezgâhı — sürahiler, peçetelik, temiz bardak istifi, uçta kirli bardak tepsisi.
 * Bugün YALNIZ obje + collision: garson tepsisini hâlâ ana tezgâhtan alır (kullanıcı kararı).
 */
function WaiterStation() {
  const areasOpen = useGame((s) => s.areasOpen);
  if (!waiterStationOpen(areasOpen)) return null;
  const [hx, hz] = WAITER_STATION.half;
  return (
    <group position={WAITER_STATION.pos}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[hx * 2, 0.9, hz * 2]} />
        <meshStandardMaterial color={PALETTE.counterWood} />
      </mesh>
      {/* tezgâh tablası (pirinç bantlı üst yüzey — ana tezgâhla aynı dil) */}
      <mesh castShadow position={[0, 0.94, 0]}>
        <boxGeometry args={[hx * 2 + 0.1, 0.08, hz * 2 + 0.08]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* sürahiler */}
      {[-0.95, -0.62].map((x) => (
        <group key={x} position={[x, 0, 0.05]}>
          <mesh castShadow position={[0, 1.15, 0]}>
            <cylinderGeometry args={[0.13, 0.15, 0.34, 10]} />
            <meshStandardMaterial color={PALETTE.plate} />
          </mesh>
          <mesh position={[0, 1.35, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 0.06, 8]} />
            <meshStandardMaterial color={PALETTE.brass} metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* peçetelik */}
      <mesh castShadow position={[-0.26, 1.08, 0.14]}>
        <boxGeometry args={[0.26, 0.2, 0.2]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* temiz bardak istifi (2 sıra × 4) */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} castShadow position={[0.12 + (i % 4) * 0.19, 1.03, -0.14 + Math.floor(i / 4) * 0.22]}>
          <cylinderGeometry args={[0.05, 0.062, 0.1, 8]} />
          <meshStandardMaterial color={PALETTE.plate} />
        </mesh>
      ))}
      {/* uçta kirli bardak tepsisi */}
      <mesh castShadow position={[1.0, 1.0, 0.02]}>
        <boxGeometry args={[0.52, 0.035, 0.38]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.4} roughness={0.5} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} castShadow position={[0.86 + (i % 3) * 0.16, 1.07, -0.08 + Math.floor(i / 3) * 0.2]}>
          <cylinderGeometry args={[0.055, 0.045, 0.11, 8]} />
          <meshStandardMaterial color={PALETTE.plateDirty} />
        </mesh>
      ))}
    </group>
  );
}

// Mekânsal ocak-yükseltme noktaları (SERVİS BAŞINA; ocağın önünde). Üstünde dur → dolum yayı ilerler.
function StationUpgradeSpots() {
  const stationLevels = useGame((s) => s.stationLevels);
  const upgradeFills = useGame((s) => s.upgradeFills);
  const areasOpen = useGame((s) => s.areasOpen);
  const wallet = useGame((s) => s.wallet);
  const padsDone = useGame((s) => s.padsDone);
  const tables = useGame((s) => s.tables);
  const lifetime = useGame((s) => s.lifetime);
  const gate = { padsDone, tables, stationLevel: stationLevels[THE_SERVICE], lifetime: lifetime.toNumber() };
  const level = stationLevels[THE_SERVICE];
  const upPos = servicePlace(areasOpen).upgradeSpot;
  if (level >= stationSoftMaxLevel()) return null;
  if (!stationUpgradeUnlocked(gate)) return null;
  const cost = stationUpgradeCostAt(THE_SERVICE, level);
  // KALAN tutar (2026-06-11 feedback: kısmi dolum düşülmüş hali yazsın).
  const remaining = Math.max(0, Math.ceil(cost - upgradeFills[THE_SERVICE]));
  return (
    <GroundMarker
      pos={upPos}
      // Etiket seviyenin kimliğini söyler: L4'e kadar ocak, sonrası tezgâh (tek merdiven iki kimlik).
      label={isCounter(level) ? 'Tezgâhı Yükselt' : 'Çay Yükselt'}
      sub={String(remaining)}
      coin
      tint="#ffce54"
      progress={upgradeFills[THE_SERVICE] / cost}
      afford={wallet.toNumber() >= remaining}
    />
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
  const place = servicePlace(areasOpen);
  return <DishStationUnit pos={place.dish} rot={place.dishRot} />;
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
      {/* B3-1: taban düzlemi katın tamamını (34 × 34) + arka bandı kaplar. */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[FLOOR_HALF * 2 + 1.2, FLOOR_HALF * 2 + 1.2]} />
        <meshStandardMaterial color={PALETTE.floorWood} />
      </mesh>
      {LAYOUT.areaBounds.slice(0, areasOpen).map((za, z) => {
        // Overlay DUVARA KADAR uzar (DIŞ/kilitli kenarlarda +0.55) — duvar dibinde eski renk şerit
        // kalmaz (kullanıcı bug'ı 2026-06-11). AÇIK komşuya bakan kenar tam sınırda biter (M2:
        // üst üste binen overlay z-fighting yapardı).
        // B3-1: kenarın duvara mı yoksa AÇIK komşuya mı baktığı ızgara sorgusuyla değil
        // geometriyle bulunur — o kenarda duvar parçası varsa (wallSpans boş değilse) overlay
        // duvarın dibine kadar uzar, yoksa tam sınırda biter (üst üste binen overlay z-fighting yapar).
        const ext = (side: 'left' | 'right' | 'front' | 'back') =>
          wallSpans(z, side, areasOpen).length > 0 ? 0.55 : 0;
        const x0 = za.minX - ext('left');
        const x1 = za.maxX + ext('right');
        const z0 = za.minZ - ext('back');
        const z1 = za.maxZ + ext('front');
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

/**
 * MENÜ PANOSU — servis noktasının arkasındaki duvarda. Plan §4'te tezgâhın **L6** basamağının
 * görsel karşılığı ("hazırlık adası + menü tahtası"): menü ancak menüyü hak edecek kadar
 * büyümüş bir tezgâhın arkasında asılır.
 * B2 öncesi bu blok "YEMEK ALANI kimlik paketi"ydi (3. bölge açılınca beliren pano + zemine
 * çatal-bıçak amblemi). Bölge kimliği ürünle birlikte kalktığı için amblem gitti, pano
 * seviyeye bağlandı.
 */
function MenuBoard() {
  const level = useGame((s) => s.stationLevels[THE_SERVICE]);
  const areasOpen = useGame((s) => s.areasOpen);
  if (level < stationSoftMaxLevel()) return null;
  // B3-1: pano servisin ARKASINDAKİ duvara asılır — sol duvar döneminde katın sol kenarına,
  // arka bant döneminde bandın ön yüzünün üstüne (servis nerede ise pano da orada).
  const place = servicePlace(areasOpen);
  const st = place.station;
  const backWall = place.rot === 0;
  const pos: [number, number, number] = backWall ? [st[0], 0, BAND.front - 0.15] : [-FLOOR_HALF + 0.3, 0, st[2]];
  return (
    <group position={pos} rotation={[0, place.rot, 0]}>
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
  // TEK KAPI. B3-2: 2. Alan açılınca cephenin ortasına kayar (maket v13 adım 2) → `doorAt`.
  const dx0 = doorAt(areasOpen);
  type Piece = WallSlab;
  const pieces: Piece[] = [];
  // B3-1: duvarlar ızgara komşuluğundan değil GEOMETRİDEN gelir. `wallSpans(alan, kenar, açık)`
  // o kenarın AÇIK komşularca kapatılmayan parçalarını verir — bir kenarı birden çok komşu
  // paylaşabildiği için (arka yarının ön kenarını iki ön çeyrek BİRLİKTE kapatır) eski
  // `areaAt(col±1, row)` ızgara sorgusu yetmiyordu. Kapı boşluğu yalnız kapıyı içeren parçada açılır.
  const SIDES: AreaSide[] = ['left', 'right', 'front', 'back'];
  for (let z = 0; z < areasOpen; z++) {
    const za = LAYOUT.areaBounds[z];
    const th = themeOf(z);
    for (const side of SIDES) {
      const vertical = side === 'left' || side === 'right';
      // Duvar hattı alan kenarından m kadar dışarıda (oyuncu kelepçe standoff'u ile birebir).
      const line =
        side === 'left' ? za.minX - m : side === 'right' ? za.maxX + m : side === 'front' ? za.maxZ + m : za.minZ - m;
      for (const [s0, s1] of wallSpans(z, side, areasOpen)) {
        const a0 = s0 - m; // uçlar m taşar → köşeler kapanır
        const a1 = s1 + m;
        // Kapı boşluğu parçadan ÇIKARILIR (içinde olmasını beklemek yetmiyor): kapı 2. Alan'da
        // x = 0'a kayınca tam iki ön duvar parçasının DİKİŞİNE düşüyor ve "parçanın içinde mi"
        // sorusuna ikisi de hayır diyordu → kapının önüne duvar örülüyordu (B3-2 testi yakaladı).
        const cut: [number, number] = [dx0 - doorHalf, dx0 + doorHalf];
        const segs: [number, number][] =
          side === 'front'
            ? ([
                [a0, Math.min(a1, cut[0])],
                [Math.max(a0, cut[1]), a1],
              ] as [number, number][])
            : [[a0, a1]];
        for (const [p0, p1] of segs) {
          if (p1 - p0 <= 0.01) continue;
          pieces.push(
            vertical
              ? { x: line, z: (p0 + p1) / 2, w: t, d: p1 - p0, theme: th }
              : { x: (p0 + p1) / 2, z: line, w: p1 - p0, d: t, theme: th },
          );
        }
      }
    }
  }
  const frontEdgeZ = LAYOUT.areaBounds[0].maxZ + m; // kapı sövesi referansı
  return (
    <group>
      <WallPanels slabs={pieces} />
      <BackBand areasOpen={areasOpen} />
      <LavaboFront />
      {/* kapı sövesi + çerçevesi (ön duvarın TAMAMEN önünde — z-fighting yok) */}
      <group>
        <mesh position={[dx0, h - 0.12, frontEdgeZ + 0.22]}>
          <boxGeometry args={[doorHalf * 2 + 0.3, 0.24, 0.12]} />
          <meshStandardMaterial color={PALETTE.lintel} />
        </mesh>
        <mesh position={[dx0 - doorHalf, h / 2, frontEdgeZ + 0.22]}>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
        <mesh position={[dx0 + doorHalf, h / 2, frontEdgeZ + 0.22]}>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * ARKA BANT — servis bloğu · merdiven · lavabo (maket v13; üçü de z = −9,8 hizasında biter).
 * B3-1'de KÜTLE olarak durur: arka yarının duvarının ötesindeki hacim, kamera 45°'den tepesini
 * gördüğü için boş zemin bırakılamaz. İçini açmak (lavabo odası + yıkık merdiven) B4'ün işi;
 * bloklar o zaman kapı boşluğu ve iç geometri kazanır. Bant YÜRÜNMEZ — alanlar z = −9,8'de biter.
 */
function BackBand({ areasOpen }: { areasOpen: number }) {
  // B6b: lavabo ALINDIYSA `wc` bloğu artık katı kütle değil, maket v13'ün odasının BİREBİR
  // transkripsiyonu (`maketParts.MaketLavaboBlock`). Diğer iki blok bu turda değişmedi.
  const lavaboOpen = useGame((s) => s.padsDone.includes('lavabo'));
  if (areasOpen < 3) return null; // arka yarı açılmadan bant görünmez (kilitli alan çizilmez, D-057)
  const d = BAND.front - BAND.back;
  const blocks: [string, { minX: number; maxX: number }, string][] = [
    ['servis', BAND.service, PALETTE.wallCream ?? '#e3d8c1'],
    ['merdiven', BAND.stairs, PALETTE.wallCream ?? '#e3d8c1'],
    ...(lavaboOpen ? [] : ([['lavabo', BAND.wc, PALETTE.wallCream ?? '#e3d8c1']] as [string, { minX: number; maxX: number }, string][])),
  ];
  return (
    <group>
      {blocks.map(([id, blk, color]) => (
        <mesh key={id} position={[(blk.minX + blk.maxX) / 2, WALL_H / 2, (BAND.front + BAND.back) / 2]}>
          <boxGeometry args={[blk.maxX - blk.minX - 0.12, WALL_H, d]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {lavaboOpen && <MaketLavaboBlock />}
    </group>
  );
}


/**
 * LAVABO'nun ön yüzü (B4) — bandın `wc` bloğunun salona bakan yüzünde kapı.
 *
 * İki hâli var ve ikisi de KARAR: kapalıyken **tadilat hâli** (tahta perde + uyarı bandı —
 * "kilitli obje çizilmez" DEĞİL, "kilitli obje yıkık durur"), açıldıktan sonra gerçek kapı.
 * Seviye ÜÇ ayrı sinyalle okunur (tek sinyal yetmez): kapı üstündeki nokta sayısı · fayans
 * şeridinin genişlemesi · kapı kanadının açılıp koyulaşan iç boşluğu.
 * Odanın İÇİ (kabinler, ayna, tavan ışığı) ve yıkık merdiven **B4b**'nin işi.
 */
function LavaboFront() {
  const areasOpen = useGame((s) => s.areasOpen);
  const padsDone = useGame((s) => s.padsDone);
  const level = useGame((s) => s.lavaboLevel);
  const fill = useGame((s) => s.lavaboFill);
  const wallet = useGame((s) => s.wallet);
  if (areasOpen < 3) return null; // bant görünmüyorsa kapısı da yok
  const x = LAVABO.door[0];
  const open = padsDone.includes('lavabo');
  const cost = lavaboUpgradeCost(level);
  const remaining = cost != null ? Math.max(0, Math.ceil(cost - fill)) : 0;
  // AÇIKKEN kapının kendisini `MaketLavaboBlock` çiziyor (gerçek boşluk + lento + WC levhası);
  // burada yalnız SEVİYE sinyalleri kalır. Yüzeyler maketin ön duvarının güney yüzüne göre:
  // duvar z = −9,8'de 0,26 kalınlığında → yüz ≈ −9,67; lento tepesi y = 2,14 (H − 0,06).
  const zw = BAND.front + 0.16; // duvar yüzünün önü
  return (
    <group>
      {!open && (
        <group>
          {/* KAPALIYKEN oda yok: blok katı kütle, kapı yeri TADİLAT hâlinde durur
              (kilitli obje çizilmez DEĞİL, kilitli obje yıkık durur — D-057'nin obje hâli). */}
          <mesh position={[x, 0.6, BAND.front + 0.02]}>
            <planeGeometry args={[1.5, 1.2]} />
            <meshStandardMaterial color="#4a3b2a" />
          </mesh>
          {([-0.5, 0.5] as const).map((sgn, i) => (
            <mesh key={i} position={[x, 0.6, BAND.front + 0.04]} rotation={[0, 0, sgn * 0.55]}>
              <planeGeometry args={[2.4, 0.3]} />
              <meshStandardMaterial color="#a1887f" />
            </mesh>
          ))}
          <mesh position={[x, 0.3, BAND.front + 0.05]}>
            <planeGeometry args={[2.0, 0.16]} />
            <meshStandardMaterial color="#f9a825" />
          </mesh>
        </group>
      )}
      {open && (
        <group>
          {/* ÇİNİ BORDÜR KALDIRILDI (2026-09-07). Seviye sinyali olsun diye kapının iki yanına
              açık mavi şerit koymuştum; maketle yan yana konunca görüldü ki maketin ön duvarındaki
              kesintisiz 0,9 birimlik KOYU LAMBRİ kuşağı kadrajın en güçlü yatay çizgisi ve şeritler
              onu tam ortadan bölüyordu. Maketin duvarında böyle bir kaplama yok.
              AÇIK KALEM: seviye şu an tek sinyalle (lentodaki noktalar) okunuyor; "tek sinyal
              yetmez" kuralı için ikinci sinyal maketi bozmadan bulunmalı. */}
          {/* SİNYAL 2 — lentonun üstünde seviye kadar nokta (maketin lentosu y = 2,14) */}
          {Array.from({ length: level }, (_, i) => (
            <mesh key={i} position={[x - (level - 1) * 0.16 + i * 0.32, 2.14, zw]}>
              <circleGeometry args={[0.08, 10]} />
              <meshStandardMaterial color="#ffce54" />
            </mesh>
          ))}
        </group>
      )}
      {/* Yükseltme noktası: pad bitince AYNI yerde belirir (obje-başı yükseltme). */}
      {open && cost != null && (
        <GroundMarker
          pos={LAVABO.spot}
          label="Lavaboyu Büyüt"
          sub={String(remaining)}
          coin
          tint="#ffce54"
          progress={fill / cost}
          afford={wallet.toNumber() >= remaining}
        />
      )}
    </group>
  );
}

// Dış dünya (D-017 kullanıcı isteği): ön duvarın DIŞINDA sokak + kaldırım + karşı binalar → müşterilerin
// kapıdan girip çıktığı "dış dünya" hissi. Salt görsel (collision yok); low-poly stilize (D-013).
function Street() {
  const areasOpen = useGame((s) => s.areasOpen);
  const e = entranceAt(areasOpen);
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
      {(
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
      )}
    </group>
  );
}

/**
 * DEV — ÖLÇÜ IZGARASI. Zemine seçilen adımda (örn. maket duvarı 3,20 ↔ KayKit modülü 4,00)
 * kırmızı çizgi ağı çizer; katın kenarı ızgaraya oturmuyorsa artan şerit gözle görülür
 * (34 ÷ 4 = 8,5 modül → sağda/önde yarım modül kalır). Yalnız `import.meta.env.DEV`'de
 * render edilir, üretim ağacına hiç girmez.
 */
function MeasureGrid() {
  const step = useSandbox((s) => s.gridStep);
  const geo = useMemo(() => {
    if (!step) return null;
    const H = FLOOR_HALF;
    const W = 0.07; // çizgi kalınlığı (WebGL'de lineWidth çalışmaz → ince şeritler çizilir)
    const pos: number[] = [];
    const quad = (x0: number, z0: number, x1: number, z1: number) => {
      pos.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z0, x1, 0, z1, x0, 0, z1);
    };
    for (let x = -H; x <= H + 1e-6; x += step) quad(x - W, -H, x + W, H);
    for (let z = -H; z <= H + 1e-6; z += step) quad(-H, z - W, H, z + W);
    // katın kendi kenarları: ızgaranın son çizgisi kenara denk gelmiyorsa artan şerit gözükür
    quad(H - W * 2, -H, H, H);
    quad(-H, H - W * 2, H, H);
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    return g;
  }, [step]);
  useEffect(() => () => geo?.dispose(), [geo]);
  if (!geo) return null;
  return (
    <mesh position={[0, 0.05, 0]} geometry={geo} renderOrder={999}>
      <meshBasicMaterial color="#ff1744" transparent opacity={0.9} side={DoubleSide} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

export function Scene() {
  return (
    // GÖLGE AÇIK (D-073 — D-054 kullanıcı tarafından geri alındı, 2026-09-07): maket üstten
    // görüldü ve *"maketteki ışık ve gölgeler baya iyiymiş, gölgeleri tekrar istiyorum"* dendi.
    // Gölge takımı maket v13'ün değerleri (palette.ts LIGHTING): PCFSoft (`shadows="soft"`) ·
    // 2048 harita · bias/normalBias duvar kalınlığına göre · ortografik ±30. Bedeli ölçülmüştü
    // (kare süresi ~+0,6 ms); Faz 7'de telefonda yeniden ölçülecek.
    <Canvas
      shadows="soft"
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
      <SceneLights shadows />
      <Ground />
      <Street />
      <Walls />
      <MenuBoard />
      <Decor />
      <BanketIslands />
      <WaiterStation />
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
      {import.meta.env.DEV && <MeasureGrid />}
      <CameraRig />
      <Simulation />
      <QuestPointer />
      <PerfProbe />
    </Canvas>
  );
}
