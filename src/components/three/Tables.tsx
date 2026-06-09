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

// Kıraathane masası: yuvarlak ahşap tabla + merkez ayak + İKİ tabure.
// Seviye GÖRSEL okunur (kullanıcı isteği, evrim tablosu docs/visual-identity.md):
// L1(iç 0) çıplak ahşap → L2 yeşil çuha → L3 bordo → L4 lacivert → L5 altın örtü.
function Table({ x, z, level }: { x: number; z: number; level: number }) {
  const cloth = PALETTE.tableclothByLevel[Math.min(level, PALETTE.tableclothByLevel.length - 1)];
  return (
    <group position={[x, 0, z]}>
      <Model
        fallback={
          <group>
            {/* tabla */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.08, 16]} />
              <meshStandardMaterial color={PALETTE.tableWood} />
            </mesh>
            {/* masa örtüsü (seviye ≥ 1): tablanın üstünde hafif taşan ince disk */}
            {cloth ? (
              <mesh castShadow position={[0, 0.555, 0]}>
                <cylinderGeometry args={[0.53, 0.53, 0.03, 16]} />
                <meshStandardMaterial color={cloth} />
              </mesh>
            ) : null}
            {/* ayak */}
            <mesh castShadow position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.5, 8]} />
              <meshStandardMaterial color={PALETTE.tableLeg} />
            </mesh>
          </group>
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
