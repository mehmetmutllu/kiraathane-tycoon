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

// Sandalye yerleşimi: GÜNEY = gerçek oturma yeri (LAYOUT.tables[i].seat, masaya 0.78), gerisi görsel.
// Seviye başına +1 sandalye (kullanıcı 2026-06-11: "her seviyede bir sandalye gelebilir, 4'ü bulur").
const CHAIR_SPOTS: [number, number][] = [
  [0, 0.78], // S (seat)
  [0, -0.78], // N
  [0.78, 0], // E
  [-0.78, 0], // W
];

// Kıraathane masası — KARE KALARAK evrilir (kullanıcı 2026-06-11: "masa en başta kare ya, O KARE
// gelişmeli; üzerine örtü gelir"). WP4'ün yuvarlak/sekizgen formları kaldırıldı:
//   L0: çıplak kare tabla + 4 ince ayak + 1 tabure
//   L1: + çuha YEŞİLİ kare örtü + 2. tabure
//   L2: + BORDO örtü + sarkan ETEK + 3. tabure
//   L3: + LACİVERT örtü + pirinç kenar bandı + 4. tabure
//   L4: ALTIN örtü + etek + bant (en gösterişli)
// Collision/oturma DEĞİŞMEZ (tableHalf 0.5, seat güney sandalye; salt görsel evrim).
function Table({ x, z, level }: { x: number; z: number; level: number }) {
  const cloth = PALETTE.tableclothByLevel[Math.min(level, PALETTE.tableclothByLevel.length - 1)];
  const chairs = Math.min(CHAIR_SPOTS.length, level + 1);
  const skirt = cloth && (level === 2 || level >= 4);
  return (
    <group position={[x, 0, z]}>
      <Model
        fallback={
          <group>
            {/* kare tabla + 4 ince ayak (TÜM seviyelerde aynı iskelet) */}
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
            {/* örtü (kare, tabladan hafif taşar) */}
            {cloth ? (
              <mesh castShadow position={[0, 0.55, 0]}>
                <boxGeometry args={[1.03, 0.03, 1.03]} />
                <meshStandardMaterial color={cloth} />
              </mesh>
            ) : null}
            {/* örtü ETEĞİ (L2 ve L4: dört yana sarkan kumaş) */}
            {skirt
              ? CHAIR_SPOTS.map(([sx, sz], i) => (
                  <mesh key={i} castShadow position={[sx * 0.66, 0.43, sz * 0.66]}>
                    <boxGeometry args={sz === 0 ? [0.04, 0.22, 1.03] : [1.03, 0.22, 0.04]} />
                    <meshStandardMaterial color={cloth} />
                  </mesh>
                ))
              : null}
            {/* pirinç kenar bandı (L3+): tabla çevresinde ince çerçeve */}
            {level >= 3
              ? CHAIR_SPOTS.map(([sx, sz], i) => (
                  <mesh key={i} position={[sx * 0.63, 0.5, sz * 0.63]}>
                    <boxGeometry args={sz === 0 ? [0.025, 0.075, 1.0] : [1.0, 0.075, 0.025]} />
                    <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} />
                  </mesh>
                ))
              : null}
          </group>
        }
      />
      {/* tabureler: S=oturma (collision LAYOUT'ta), N/E/W salt görsel; sayı seviyeyle artar */}
      {CHAIR_SPOTS.slice(0, chairs).map(([sx, sz], i) => (
        <Stool key={i} x={sx} z={sz} />
      ))}
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
