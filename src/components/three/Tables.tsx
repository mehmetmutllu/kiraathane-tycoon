import { Suspense, useMemo, useEffect, Component, type ReactNode } from 'react';
import { useGLTF, Merged } from '@react-three/drei';
import { Mesh, type Object3D, type MeshStandardMaterial } from 'three';
import { useGame } from '../../game/store';
import { LAYOUT } from '../../game/store';
import { Model } from './Model';
import { PALETTE } from '../../config/palette';
import { tableSeats, zoneOfTable, zoneProduct, tableThemeColor } from '../../config/economy.config';
import { recoloredAtlas, atlasReady, onAtlasReady } from './recolor';
import type { Vec3 } from '../../game/types';

// KayKit Furniture Bits (CC0). Native boyutlar (origin tabanda, üst ~y=1.0): table_small 1×1×1,
// table_medium 2×1×2, table_medium_long 3×1×2, chair_stool/_wood 0.75×0.5×0.75, chair_A/_wood 0.75×1.26×0.85.
//
// İLERLEME (kullanıcı 2026-06-14 rev3):
// ÇAY (önceki yaklaşım — kullanıcı "o tabureler daha iyiydi"): tabure HEP chair_stool_wood (ahşap),
//   örtü L1'den gelir, üstüne örtüyle AYNI renk YUMUŞAK MİNDER (puf, overlay). L3'te masa büyür.
//   Sadece renklerle oynanır.
// YEMEK: sandalye MODELİ seviyeyle değişir (overlay yok): L0-L1 #3 chair_A_wood → L2-L3 #4 chair_A →
//   L4 #7 chair_C. Örtü L2'den. Masa L0-L2 TEKLİ küçük (sandalyeler ORTALI), L3'te 4 kişilik uzun.
//   Renkler (mavi asset minderleri) sonra ayarlanacak.
const KAY = '/assets/models/kaykit-furniture-bits/';
const TEA_TABLE_S: Vec3 = [0.66, 0.5, 0.66]; // table_small (çay L0-L2)
const TEA_TABLE_M: Vec3 = [0.45, 0.55, 0.45]; // table_medium (çay L3+)
const STOOL_S = 0.6; // chair_stool_wood
const FOOD_TABLE_SM: Vec3 = [0.7, 0.55, 0.7]; // table_small (yemek L0-L2 tekli)
const FOOD_TABLE_L: Vec3 = [0.5, 0.6, 0.46]; // table_medium_long (yemek L3+)
const FOOD_CHAIR_S = 0.5; // chair_A* / chair_C
// Yemek tekli masada (L0-L2) sandalyeler ORTALI (masa-hizalı): ön/arka merkez.
const SINGLE_FOOD_SPOTS: [number, number][] = [
  [0, 0.72],
  [0, -0.72],
];
// Örtü (tabla ÜSTÜ) yerleşimi — küçük (Sv3) ve büyük (Sv4+) masa. { y: üst yüzey, h/hx/hz: yarı-genişlik }.
const TEA_CLOTH_S = { y: 0.5, h: 0.26 };
const TEA_CLOTH_M = { y: 0.55, h: 0.4 };
const FOOD_CLOTH_SM = { y: 0.55, h: 0.32 };
const FOOD_CLOTH = { y: 0.6, hx: 0.62, hz: 0.4 };

// Tabure (gerçek kıraathane formu): silindir gövde + kırmızı minder. Koltuk kutusu emekli.
function Stool({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.42, 10]} />
        <meshStandardMaterial color={PALETTE.stool} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.07, 10]} />
        <meshStandardMaterial color={PALETTE.stoolCushion} />
      </mesh>
    </group>
  );
}

// ARKALIKLI restoran sandalyesi (Y1 yemek alanı kimliği): ahşap iskelet + petrol minder + arkalık.
// Arkalık DIŞ tarafta (oturan masaya bakar): güney sandalye kuzeye, kuzey sandalye güneye döner.
function Chair({ x, z }: { x: number; z: number }) {
  const rotY = z > 0 ? 0 : Math.PI;
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[0.36, 0.05, 0.36]} />
        <meshStandardMaterial color={PALETTE.chairWood} />
      </mesh>
      <mesh castShadow position={[0, 0.47, 0]}>
        <boxGeometry args={[0.3, 0.05, 0.3]} />
        <meshStandardMaterial color={PALETTE.chairCushion} />
      </mesh>
      {[-0.14, 0.14].flatMap((lx) =>
        [-0.14, 0.14].map((lz) => (
          <mesh key={`${lx}${lz}`} castShadow position={[lx, 0.2, lz]}>
            <boxGeometry args={[0.05, 0.4, 0.05]} />
            <meshStandardMaterial color={PALETTE.chairWood} />
          </mesh>
        )),
      )}
      {/* arkalık: 2 dikme + sırt paneli (yerel +z = dış taraf) */}
      {[-0.14, 0.14].map((lx) => (
        <mesh key={lx} castShadow position={[lx, 0.64, 0.155]}>
          <boxGeometry args={[0.05, 0.44, 0.04]} />
          <meshStandardMaterial color={PALETTE.chairWood} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.76, 0.155]}>
        <boxGeometry args={[0.36, 0.2, 0.04]} />
        <meshStandardMaterial color={PALETTE.chairWood} />
      </mesh>
    </group>
  );
}

// Kıraathane masası — KARE KALARAK evrilir (kullanıcı 2026-06-11: "masa en başta kare ya, O KARE
// gelişmeli; üzerine örtü gelir"). WP4'ün yuvarlak/sekizgen formları kaldırıldı:
//   L0: çıplak tabla + 4 ince ayak + 1 oturak
//   L1: + çuha YEŞİLİ örtü + 2. oturak
//   L2: + BORDO örtü + sarkan ETEK + 3. oturak
//   L3: + LACİVERT örtü + pirinç kenar bandı + 4. oturak
//   L4: ALTIN örtü + etek + bant (en gösterişli)
// Y1: YEMEK masası DİKDÖRTGEN (1.35×0.85, uzun kenar x) + arkalıklı sandalye (2'ye 2 karşılıklı);
// çay masası kare + tabure kalır. Collision LAYOUT'tan (tableHalf / foodTableHalf).
export function Table({
  x,
  z,
  level,
  food = false,
  greybox = false,
}: {
  x: number;
  z: number;
  level: number;
  food?: boolean;
  greybox?: boolean;
}) {
  // M3: YEMEK masası (tost salonu) kendi örtü paletiyle + sofra prop'larıyla evrilir
  // (kullanıcı: "yemek masaları farklı olabilir, seviye artınca olacak şeyler de artar").
  // İLERLEME (rev6 — CoC tek-şey/seviye + tutarlı iki hat): tek kaynak seatsByLevel 1/2/2/4/4.
  //   Sv1 (L0): çıplak ahşap, 1 koltuk · Sv2 (L1): +1 koltuk · Sv3 (L2): RENK/SÜS gelir (örtü+minder,
  //   ara ton) · Sv4 (L3): masa BÜYÜR (4 koltuk; renk taşınır, tek değişim) · Sv5 (L4): ALTIN (sadece
  //   renk; iki hatta da şekil değişmez → tutarlı).
  const bigTable = level >= 3; // Sv4: masa büyür (4 koltuk)
  // İLERLEME (rev10 — Seçenek A, ALTIN YOK; renk hep native mavi, altın TEMA MAĞAZASINDA pahalı tema):
  //   ÇAY: Sv3 TABURELER minderli (masa ÇIPLAK) · Sv4 +2 tabure + masa büyür · Sv5 ÖRTÜ gelir (finalde).
  //   YEMEK: Sv3 örtü+minder · Sv4 masa büyür · Sv5 dolu chair_C (şekil premium). Renk hep mavi.
  // ÖRTÜ: ÇAY yalnız Sv5 (L4); YEMEK Sv3'ten (L2+). Hepsi varsayılan mavi.
  const clothColor = food ? (level >= 2 ? PALETTE.defaultTone : '') : level >= 4 ? PALETTE.defaultTone : '';
  const cloth = clothColor; // greybox fallback alias
  // Sandalye ofsetleri: çay chairSpots; yemek büyük masada foodChairSpots (2×2), tekli masada ORTALI.
  const spots = food ? (bigTable ? LAYOUT.foodChairSpots : SINGLE_FOOD_SPOTS) : LAYOUT.chairSpots;
  const chairs = Math.min(spots.length, tableSeats(level));
  const skirt = !!clothColor && level >= 4; // greybox fallback
  const rect = food && tableSeats(level) > 2;
  const hw = rect ? 0.675 : 0.475;
  const hd = rect ? 0.425 : 0.475;
  const tableSrc = greybox
    ? undefined
    : food
      ? `${KAY}${bigTable ? 'table_medium_long' : 'table_small'}.gltf`
      : `${KAY}${bigTable ? 'table_medium' : 'table_small'}.gltf`;
  const tableScale = food
    ? bigTable
      ? FOOD_TABLE_L
      : FOOD_TABLE_SM
    : bigTable
      ? TEA_TABLE_M
      : TEA_TABLE_S;
  // SANDALYE ŞEKLİ: YEMEK ahşap→chair_A→chair_C(Sv5 dolu); ÇAY hep tabure (chair_stool).
  const foodChair = level < 2 ? 'chair_A_wood' : level < 4 ? 'chair_A' : 'chair_C';
  const teaChair = level < 2 ? 'chair_stool_wood' : 'chair_stool';
  const chairSrc = greybox ? undefined : `${KAY}${food ? foodChair : teaChair}.gltf`;
  // MİNDER rengi: hep native mavi → recolor YOK. (Altın/teal vb. tema mağazasında satın alınır.)
  const chairRecolor = undefined;
  return (
    <group position={[x, 0, z]}>
      <Model
        src={tableSrc}
        scale={tableScale}
        fallback={
          <group>
            {/* tabla + 4 ince ayak (TÜM seviyelerde aynı iskelet) */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
              <boxGeometry args={[hw * 2, 0.07, hd * 2]} />
              <meshStandardMaterial color={PALETTE.tableWood} />
            </mesh>
            {[-(hw - 0.095), hw - 0.095].flatMap((lx) =>
              [-(hd - 0.095), hd - 0.095].map((lz) => (
                <mesh key={`${lx}${lz}`} castShadow position={[lx, 0.24, lz]}>
                  <boxGeometry args={[0.07, 0.48, 0.07]} />
                  <meshStandardMaterial color={PALETTE.tableLeg} />
                </mesh>
              )),
            )}
            {/* örtü (tabladan hafif taşar) */}
            {cloth ? (
              <mesh castShadow position={[0, 0.55, 0]}>
                <boxGeometry args={[hw * 2 + 0.08, 0.03, hd * 2 + 0.08]} />
                <meshStandardMaterial color={cloth} />
              </mesh>
            ) : null}
            {/* örtü ETEĞİ (L2 ve L4: dört yana sarkan kumaş) */}
            {skirt ? (
              <group>
                {[-(hd + 0.04), hd + 0.04].map((sz) => (
                  <mesh key={sz} castShadow position={[0, 0.43, sz]}>
                    <boxGeometry args={[hw * 2 + 0.08, 0.22, 0.04]} />
                    <meshStandardMaterial color={cloth} />
                  </mesh>
                ))}
                {[-(hw + 0.04), hw + 0.04].map((sx) => (
                  <mesh key={sx} castShadow position={[sx, 0.43, 0]}>
                    <boxGeometry args={[0.04, 0.22, hd * 2 + 0.08]} />
                    <meshStandardMaterial color={cloth} />
                  </mesh>
                ))}
              </group>
            ) : null}
            {/* pirinç kenar bandı (L3+): tabla çevresinde ince çerçeve */}
            {level >= 3 ? (
              <group>
                {[-(hd + 0.015), hd + 0.015].map((sz) => (
                  <mesh key={sz} position={[0, 0.5, sz]}>
                    <boxGeometry args={[hw * 2 + 0.05, 0.075, 0.025]} />
                    <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} />
                  </mesh>
                ))}
                {[-(hw + 0.015), hw + 0.015].map((sx) => (
                  <mesh key={sx} position={[sx, 0.5, 0]}>
                    <boxGeometry args={[0.025, 0.075, hd * 2 + 0.05]} />
                    <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} />
                  </mesh>
                ))}
              </group>
            ) : null}
            {/* YEMEK masası sofra prop'ları (M3): L1+ peçetelik; L2+ ketçap-mayo; L3+ servis tabağı */}
            {food && level >= 1 ? (
              <mesh castShadow position={[-0.22, 0.62, -0.22]}>
                <boxGeometry args={[0.14, 0.1, 0.07]} />
                <meshStandardMaterial color={PALETTE.mayo} />
              </mesh>
            ) : null}
            {food && level >= 2 ? (
              <group position={[0.24, 0, -0.24]}>
                <mesh castShadow position={[-0.045, 0.65, 0]}>
                  <cylinderGeometry args={[0.035, 0.04, 0.16, 8]} />
                  <meshStandardMaterial color={PALETTE.ketchup} />
                </mesh>
                <mesh castShadow position={[0.045, 0.65, 0]}>
                  <cylinderGeometry args={[0.035, 0.04, 0.16, 8]} />
                  <meshStandardMaterial color={PALETTE.mayo} />
                </mesh>
              </group>
            ) : null}
            {food && level >= 3 ? (
              <mesh castShadow position={[0, 0.585, 0.1]}>
                <cylinderGeometry args={[0.13, 0.11, 0.025, 10]} />
                <meshStandardMaterial color={PALETTE.plate} />
              </mesh>
            ) : null}
          </group>
        }
      />
      {/* TIER SİNYALİ — tabla ÜSTÜ örtüsü (Sv3'ten; küçük/büyük masaya göre; sadece üst yüzey). */}
      {clothColor ? (
        food ? (
          bigTable ? (
            <mesh position={[0, FOOD_CLOTH.y, 0]} castShadow>
              <boxGeometry args={[FOOD_CLOTH.hx * 2, 0.04, FOOD_CLOTH.hz * 2]} />
              <meshStandardMaterial color={clothColor} />
            </mesh>
          ) : (
            <mesh position={[0, FOOD_CLOTH_SM.y, 0]} castShadow>
              <boxGeometry args={[FOOD_CLOTH_SM.h * 2, 0.04, FOOD_CLOTH_SM.h * 2]} />
              <meshStandardMaterial color={clothColor} />
            </mesh>
          )
        ) : (
          <mesh position={[0, (bigTable ? TEA_CLOTH_M : TEA_CLOTH_S).y, 0]} castShadow>
            <boxGeometry
              args={[(bigTable ? TEA_CLOTH_M : TEA_CLOTH_S).h * 2, 0.04, (bigTable ? TEA_CLOTH_M : TEA_CLOTH_S).h * 2]}
            />
            <meshStandardMaterial color={clothColor} />
          </mesh>
        )
      ) : null}
      {/* oturaklar — gerçek asset; minderi recolor ile ara ton/altına BOYALI (Sv3+). Ahşap seviyede
          boya yok. Yemek sandalyesi arkalık dışa (masaya bakar). */}
      {spots.slice(0, chairs).map(([sx, sz], i) => (
        <Model
          key={i}
          src={chairSrc}
          scale={food ? FOOD_CHAIR_S : STOOL_S}
          position={[sx, 0, sz]}
          rotation={food ? [0, sz > 0 ? Math.PI : 0, 0] : undefined}
          recolor={chairRecolor}
          fallback={food ? <Chair x={sx} z={sz} /> : <Stool x={sx} z={sz} />}
        />
      ))}
    </group>
  );
}

// ---- FPS: mobilya instancing ----
// KayKit mobilya modelleri hepsi TEK mesh + ORTAK atlas materyali (furniture_texture). Model tipi başına
// 1 InstancedMesh (drei <Merged>) → eski ~45 draw-call ~8'e iner. Görsel BİREBİR (aynı geometri+materyal;
// gltf node transformları identity → bake gerekmez). Tema mağazası ileride ortak atlas'ı swap'leyince hepsi
// tek çağrıda boyanır. Greybox fallback (glb yok/yüklenirken) korunur (CLAUDE: fallback loader kuralı).
const FURNITURE = [
  'table_small',
  'table_medium',
  'table_medium_long',
  'chair_stool',
  'chair_stool_wood',
  'chair_A',
  'chair_A_wood',
  'chair_C',
] as const;
type FKey = (typeof FURNITURE)[number];
FURNITURE.forEach((k) => useGLTF.preload(`${KAY}${k}.gltf`));

function firstMesh(o: Object3D): Mesh | null {
  let found: Mesh | null = null;
  o.traverse((c) => {
    if (!found && (c as Mesh).isMesh) found = c as Mesh;
  });
  return found;
}

type Placement = { pos: Vec3; rot?: Vec3; scale: number | Vec3 };
type ClothPlate = { pos: Vec3; size: [number, number, number]; color: string };

// Açık masaların mobilya parçalarını model-tipine göre grupla (instance yerleşimi) + örtü plakaları.
// Yerleşim/ölçek/rotasyon/örtü mantığı Table ile BİRE BİR (tek kaynak: aynı sabitler + tableSeats).
// clothColor = aktif masa teması rengi (minder atlas recolor ile uyumlu; örtü plakası bununla boyanır).
function buildFurniture(tables: number, tableLevels: number[], clothTone: string) {
  const place = Object.fromEntries(FURNITURE.map((k) => [k, [] as Placement[]])) as Record<FKey, Placement[]>;
  const cloths: ClothPlate[] = [];
  for (let i = 0; i < tables; i++) {
    const t = LAYOUT.tables[i];
    if (!t) continue;
    const [x, , z] = t.table;
    const level = tableLevels[i] ?? 0;
    const food = zoneProduct(zoneOfTable(i)) === 'tost';
    const bigTable = level >= 3;
    const tableKey: FKey = food
      ? bigTable
        ? 'table_medium_long'
        : 'table_small'
      : bigTable
        ? 'table_medium'
        : 'table_small';
    const tableScale = food ? (bigTable ? FOOD_TABLE_L : FOOD_TABLE_SM) : bigTable ? TEA_TABLE_M : TEA_TABLE_S;
    place[tableKey].push({ pos: [x, 0, z], scale: tableScale });

    const chairKey: FKey = food
      ? level < 2
        ? 'chair_A_wood'
        : level < 4
          ? 'chair_A'
          : 'chair_C'
      : level < 2
        ? 'chair_stool_wood'
        : 'chair_stool';
    const chairScale = food ? FOOD_CHAIR_S : STOOL_S;
    const spots = food ? (bigTable ? LAYOUT.foodChairSpots : SINGLE_FOOD_SPOTS) : LAYOUT.chairSpots;
    const nChairs = Math.min(spots.length, tableSeats(level));
    for (const [sx, sz] of spots.slice(0, nChairs)) {
      place[chairKey].push({
        pos: [x + sx, 0, z + sz],
        scale: chairScale,
        rot: food ? [0, sz > 0 ? Math.PI : 0, 0] : undefined,
      });
    }

    const clothColor = food ? (level >= 2 ? clothTone : '') : level >= 4 ? clothTone : '';
    if (clothColor) {
      if (food) {
        const c = bigTable ? FOOD_CLOTH : FOOD_CLOTH_SM;
        const hx = bigTable ? FOOD_CLOTH.hx : FOOD_CLOTH_SM.h;
        const hz = bigTable ? FOOD_CLOTH.hz : FOOD_CLOTH_SM.h;
        cloths.push({ pos: [x, c.y, z], size: [hx * 2, 0.04, hz * 2], color: clothColor });
      } else {
        const c = bigTable ? TEA_CLOTH_M : TEA_CLOTH_S;
        cloths.push({ pos: [x, c.y, z], size: [c.h * 2, 0.04, c.h * 2], color: clothColor });
      }
    }
  }
  return { place, cloths };
}

class FurnitureBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

function InstancedTables({ tables, tableLevels }: { tables: number; tableLevels: number[] }) {
  const tableTheme = useGame((s) => s.tableTheme);
  const themeColor = tableThemeColor(tableTheme);
  const gltfs = useGLTF(FURNITURE.map((k) => `${KAY}${k}.gltf`));
  const meshes = useMemo(() => {
    const o: Record<string, Mesh> = {};
    FURNITURE.forEach((k, i) => {
      const m = firstMesh(gltfs[i].scene);
      if (m) o[k] = m;
    });
    return o;
  }, [gltfs]);
  // Masa teması: ortak atlas materyalinin minder-mavisini tema rengine boyar (recolor) → TÜM mobilya
  // tek atlas swap'iyle yeniden renklenir (instancing 8 draw-call'da kalır). 'mavi' = native (origMap).
  useEffect(() => {
    const native = themeColor.toLowerCase() === PALETTE.defaultTone.toLowerCase();
    const apply = () => {
      Object.values(meshes).forEach((m) => {
        const mat = m.material as MeshStandardMaterial;
        if (mat.userData.__origMap === undefined) mat.userData.__origMap = mat.map;
        const tex = native ? (mat.userData.__origMap as MeshStandardMaterial['map']) : recoloredAtlas(themeColor);
        if (tex) {
          mat.map = tex;
          mat.needsUpdate = true;
        }
      });
    };
    apply();
    if (!native && !atlasReady()) return onAtlasReady(apply);
    return undefined;
  }, [meshes, themeColor]);
  const { place, cloths } = useMemo(
    () => buildFurniture(tables, tableLevels, themeColor),
    [tables, tableLevels, themeColor],
  );
  return (
    <>
      {/* frustumCulled=false: InstancedMesh'in sınır küresi origin'de (local geometri) kaldığından kamera
          uzak salona (örn. salon 2/3) odaklanınca TÜM batch yanlışlıkla kırpılıyordu → masalar kaybolup
          sadece ayrı-mesh örtü plakaları kalıyordu. Per-instance dünya konumları küreye yansımıyor; kırpmayı
          kapatmak doğru çözüm (mobilya zaten ekranda, az sayıda batch). */}
      <Merged meshes={meshes} frustumCulled={false}>
        {(comps) => (
          <>
            {FURNITURE.map((k) => {
              const C = comps[k];
              return C
                ? place[k].map((p, j) => <C key={`${k}-${j}`} position={p.pos} rotation={p.rot} scale={p.scale} />)
                : null;
            })}
          </>
        )}
      </Merged>
      {cloths.map((c, i) => (
        <mesh key={i} position={c.pos} castShadow>
          <boxGeometry args={c.size} />
          <meshStandardMaterial color={c.color} />
        </mesh>
      ))}
    </>
  );
}

function GreyboxTables({ tables, tableLevels }: { tables: number; tableLevels: number[] }) {
  return (
    <>
      {LAYOUT.tables.slice(0, tables).map((t, i) => (
        <Table
          key={i}
          x={t.table[0]}
          z={t.table[2]}
          level={tableLevels[i] ?? 0}
          food={zoneProduct(zoneOfTable(i)) === 'tost'}
          greybox
        />
      ))}
    </>
  );
}

// Açık masaları çiz (instanced; glb yok/yüklenirken greybox). zone-2 masaları da otomatik buradan çizilir.
export function Tables() {
  const tables = useGame((s) => s.tables);
  const tableLevels = useGame((s) => s.tableLevels);
  const fallback = <GreyboxTables tables={tables} tableLevels={tableLevels} />;
  return (
    <FurnitureBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <InstancedTables tables={tables} tableLevels={tableLevels} />
      </Suspense>
    </FurnitureBoundary>
  );
}
