import { useGame } from '../../game/store';
import { LAYOUT } from '../../game/store';
import { Model } from './Model';

function Table({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Model
        fallback={
          <group>
            {/* tabla (Faz 2g v3: küçüldü 0.7→0.5) */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.08, 16]} />
              <meshStandardMaterial color="#8d6e63" />
            </mesh>
            {/* ayak */}
            <mesh castShadow position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
              <meshStandardMaterial color="#5d4037" />
            </mesh>
            {/* sandalye (greybox kutu) — koltuk (seat = table z+1.0) konumunda */}
            <mesh castShadow position={[0, 0.25, 1.0]}>
              <boxGeometry args={[0.42, 0.5, 0.42]} />
              <meshStandardMaterial color="#6d4c41" />
            </mesh>
          </group>
        }
      />
    </group>
  );
}

// Açık masaları çiz (Faz 1: pad dolunca 1 → 2).
export function Tables() {
  const tables = useGame((s) => s.tables);
  return (
    <>
      {LAYOUT.tables.slice(0, tables).map((t, i) => (
        <Table key={i} x={t.table[0]} z={t.table[2]} />
      ))}
    </>
  );
}
