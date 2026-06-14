import { useGame } from '../../game/store';
import { LAYOUT } from '../../game/store';
import { Model } from './Model';
import { PALETTE } from '../../config/palette';
import { tableSeats, zoneOfTable, zoneProduct } from '../../config/economy.config';
import type { Vec3 } from '../../game/types';

// KayKit Furniture Bits (CC0) — model yolu + canlı ayarlanan ölçekler.
// Native boyutlar (origin tabanda, üst yüzey ~y=1.0): table_small 1×1×1, table_medium 2×1×2,
// table_medium_long 3×1×2, chair_stool 0.75×0.5×0.75, chair_A 0.75×1.26×0.85.
//
// TIER GÖRSELİ (kullanıcı 2026-06-14): seviye atışı GÖZLE belli olmalı (sandalye sayısını bilmeyen
// "hepsi aynı seviye" sanmamalı). Sinyaller: (1) tabla ÜSTÜNE örtü mesh'i — seviyeye göre renk
// (masanın tamamı değil, sadece üst), (2) tabure TİPİ ilerler (ahşap→minderli) + sayısı, (3) L3'te
// çay masası büyür. Çay masası UFAK (tabureyle orantılı kıraathane masası).
const KAY = '/assets/models/kaykit-furniture-bits/';
const TEA_TABLE_S: Vec3 = [0.66, 0.5, 0.66]; // table_small (L0-L2) — ufak kıraathane masası
const TEA_TABLE_M: Vec3 = [0.45, 0.55, 0.45]; // table_medium (L3+, 4 tabure)
const STOOL_S = 0.6; // chair_stool / chair_stool_wood
const FOOD_TABLE_S: Vec3 = [0.5, 0.6, 0.46]; // table_medium_long
const FOOD_CHAIR_S = 0.5; // chair_A
// Örtü (tabla ÜSTÜ) yerleşimi: { y: üst yüzey, h: yarı-genişlik } — model üstüne oturur (canlı ayar).
const TEA_CLOTH_S = { y: 0.5, h: 0.26 };
const TEA_CLOTH_M = { y: 0.55, h: 0.4 };
const FOOD_CLOTH = { y: 0.6, hx: 0.62, hz: 0.4 };
// Tabure tipi: L0-L1 ahşap (kahve), L2+ minderli. (Sayı seatsByLevel'den: 1/2/2/4.)
const teaStoolSrc = (level: number) =>
  `${KAY}${level >= 2 ? 'chair_stool' : 'chair_stool_wood'}.gltf`;

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
function Table({ x, z, level, food = false }: { x: number; z: number; level: number; food?: boolean }) {
  // M3: YEMEK masası (tost salonu) kendi örtü paletiyle + sofra prop'larıyla evrilir
  // (kullanıcı: "yemek masaları farklı olabilir, seviye artınca olacak şeyler de artar").
  const clothArr = food ? PALETTE.foodTableclothByLevel : PALETTE.tableclothByLevel;
  const cloth = clothArr[Math.min(level, clothArr.length - 1)];
  // Y2 tek kaynak: sandalye ofsetleri LAYOUT'tan (store koltuk pozisyonunu aynı listeden türetir);
  // görsel sandalye sayısı = OTURULABİLİR koltuk (seatsByLevel 1/2/2/4/4 — plan §2).
  const spots = food ? LAYOUT.foodChairSpots : LAYOUT.chairSpots;
  const chairs = Math.min(spots.length, tableSeats(level));
  const skirt = cloth && (level === 2 || level >= 4);
  // Tabla yarıları (x, z): kare 0.475/0.475; yemek dikdörtgeni 0.675/0.425.
  // turu-5 m.10: tost masası 1-2 koltukta KARE görünür ("uzun masa + tek sandalye garip");
  // 4 koltuğa çıkınca (L3+) dikdörtgene büyür. SALT görsel — collision LAYOUT.foodTableHalf sabit.
  const rect = food && tableSeats(level) > 2;
  const hw = rect ? 0.675 : 0.475;
  const hd = rect ? 0.425 : 0.475;
  const tableSrc = food
    ? `${KAY}table_medium_long.gltf`
    : `${KAY}${level >= 3 ? 'table_medium' : 'table_small'}.gltf`;
  const tableScale = food ? FOOD_TABLE_S : level >= 3 ? TEA_TABLE_M : TEA_TABLE_S;
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
      {/* TIER SİNYALİ — tabla ÜSTÜ örtüsü (sadece üst, seviyeye göre renk; KayKit masasının üzerine).
          L0 çıplak (cloth boş). Hafif taşar → "örtü" okunur. */}
      {cloth ? (
        food ? (
          <mesh position={[0, FOOD_CLOTH.y, 0]} castShadow>
            <boxGeometry args={[FOOD_CLOTH.hx * 2, 0.04, FOOD_CLOTH.hz * 2]} />
            <meshStandardMaterial color={cloth} />
          </mesh>
        ) : (
          <mesh position={[0, (level >= 3 ? TEA_CLOTH_M : TEA_CLOTH_S).y, 0]} castShadow>
            <boxGeometry
              args={[
                (level >= 3 ? TEA_CLOTH_M : TEA_CLOTH_S).h * 2,
                0.04,
                (level >= 3 ? TEA_CLOTH_M : TEA_CLOTH_S).h * 2,
              ]}
            />
            <meshStandardMaterial color={cloth} />
          </mesh>
        )
      ) : null}
      {/* oturaklar (Y2): HER sandalye gerçek koltuk — grup üyeleri farklı koltuklara oturur.
          Çay masası: KayKit tabure (L0-1 ahşap → L2+ minderli, tier sinyali). Yemek: chair_A (arkalık
          dışa, oturan masaya bakar). Model yüklenmezse greybox Stool/Chair fallback'i. */}
      {spots.slice(0, chairs).map(([sx, sz], i) =>
        food ? (
          <Model
            key={i}
            src={`${KAY}chair_A.gltf`}
            scale={FOOD_CHAIR_S}
            position={[sx, 0, sz]}
            rotation={[0, sz > 0 ? Math.PI : 0, 0]}
            fallback={<Chair x={sx} z={sz} />}
          />
        ) : (
          <Model
            key={i}
            src={teaStoolSrc(level)}
            scale={STOOL_S}
            position={[sx, 0, sz]}
            fallback={<Stool x={sx} z={sz} />}
          />
        ),
      )}
    </group>
  );
}

// Açık masaları çiz (global bitişik indeksler; zone-2 masaları da otomatik buradan çizilir).
export function Tables() {
  const tables = useGame((s) => s.tables);
  const tableLevels = useGame((s) => s.tableLevels);
  return (
    <>
      {LAYOUT.tables.slice(0, tables).map((t, i) => (
        <Table
          key={i}
          x={t.table[0]}
          z={t.table[2]}
          level={tableLevels[i] ?? 0}
          food={zoneProduct(zoneOfTable(i)) === 'tost'}
        />
      ))}
    </>
  );
}
