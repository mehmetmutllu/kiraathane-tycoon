import { useGame } from '../../game/store';
import { LAYOUT } from '../../game/store';
import { Model } from './Model';
import { PALETTE } from '../../config/palette';

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

// Kıraathane masası — SEVİYEYLE ŞEKİL DE EVRİLİR (WP4, feedback §C13: "sadece renk değil şekil"):
//   L0: klasik kare çay evi masası (4 ince ayak, çıplak ahşap)
//   L1: yuvarlak tabla + merkez ayak + çuha yeşili örtü
//   L2: yuvarlak + bordo örtü + örtü ETEĞİ (sarkan kumaş)
//   L3: sekizgen tabla + lacivert örtü + pirinç kenar bandı
//   L4: sekizgen + ALTIN örtü + etek + pirinç bant (en gösterişli)
// Collision/oturma DEĞİŞMEZ (tableHalf 0.5 sabit; salt görsel evrim).
function Table({ x, z, level }: { x: number; z: number; level: number }) {
  const cloth = PALETTE.tableclothByLevel[Math.min(level, PALETTE.tableclothByLevel.length - 1)];
  const seg = level >= 3 ? 8 : 16; // L3+: sekizgen tabla
  return (
    <group position={[x, 0, z]}>
      <Model
        fallback={
          level === 0 ? (
            <group>
              {/* L0: kare tabla + 4 ince ayak */}
              <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                <boxGeometry args={[0.95, 0.07, 0.95]} />
                <meshStandardMaterial color={PALETTE.tableWood} />
              </mesh>
              {[-0.38, 0.38].flatMap((lx) =>
                [-0.38, 0.38].map((lz) => (
                  <mesh key={`${lx}${lz}`} castShadow position={[lx, 0.24, lz]}>
                    <boxGeometry args={[0.07, 0.48, 0.07]} />
                    <meshStandardMaterial color={PALETTE.tableLeg} />
                  </mesh>
                )),
              )}
            </group>
          ) : (
            <group>
              {/* tabla (L3+ sekizgen) */}
              <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 0.08, seg]} />
                <meshStandardMaterial color={PALETTE.tableWood} />
              </mesh>
              {/* örtü diski */}
              {cloth ? (
                <mesh castShadow position={[0, 0.555, 0]}>
                  <cylinderGeometry args={[0.53, 0.53, 0.03, seg]} />
                  <meshStandardMaterial color={cloth} />
                </mesh>
              ) : null}
              {/* örtü ETEĞİ (L2 ve L4: sarkan kumaş konisi) */}
              {cloth && (level === 2 || level >= 4) ? (
                <mesh castShadow position={[0, 0.42, 0]}>
                  <cylinderGeometry args={[0.53, 0.44, 0.24, seg, 1, true]} />
                  <meshStandardMaterial color={cloth} side={2} />
                </mesh>
              ) : null}
              {/* pirinç kenar bandı (L3+) */}
              {level >= 3 ? (
                <mesh position={[0, 0.5, 0]}>
                  <cylinderGeometry args={[0.515, 0.515, 0.085, seg, 1, true]} />
                  <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} side={2} />
                </mesh>
              ) : null}
              {/* merkez ayak */}
              <mesh castShadow position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.1, 0.12, 0.5, 8]} />
                <meshStandardMaterial color={PALETTE.tableLeg} />
              </mesh>
            </group>
          )
        }
      />
      {/* müşteri taburesi (seat konumu — collision/oturma AYNI) + karşı tabure (salt görsel) */}
      <Stool x={0} z={1.0} />
      <Stool x={0} z={-0.95} />
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
        <Table key={i} x={t.table[0]} z={t.table[2]} level={tableLevels[i] ?? 0} />
      ))}
    </>
  );
}
