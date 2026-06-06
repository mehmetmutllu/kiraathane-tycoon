import { Html } from '@react-three/drei';
import { useGame, LAYOUT, currentPad, availableOptionalPads } from '../../game/store';
import type { PadDef } from '../../config/economy.config';

// Tek bir satın-alma pad'i: sahip üstünde dururken cüzdandan dolar; dolunca etkisi uygulanır.
function PadMarker({ pad, fill }: { pad: PadDef; fill: number }) {
  const pos = LAYOUT.padPos[pad.id];
  if (!pos) return null;
  const progress = Math.min(1, fill / pad.cost);
  // Opsiyonel pad'ler (garson vb.) farklı renk + etiket → omurgadan ayırt edilir.
  const base = pad.optional ? '#1565c0' : '#37474f';
  const fillCol = pad.optional ? '#42a5f5' : '#43a047';
  const fillEmissive = pad.optional ? '#1e88e5' : '#2e7d32';
  const cone = pad.optional ? '#64b5f6' : '#66bb6a';
  return (
    <group position={[pos[0], 0, pos[2]]}>
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color={base} />
      </mesh>
      <mesh
        position={[0, 0.04, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[Math.max(0.001, progress), Math.max(0.001, progress), 1]}
      >
        <circleGeometry args={[1.15, 32]} />
        <meshStandardMaterial color={fillCol} emissive={fillEmissive} emissiveIntensity={0.3} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.6 + progress * 0.4, 0]}>
        <coneGeometry args={[0.25, 0.5, 4]} />
        <meshStandardMaterial color={cone} emissive={fillCol} emissiveIntensity={0.5} />
      </mesh>
      {pad.optional && (
        <Html position={[0, 1.5, 0]} center distanceFactor={9} zIndexRange={[5, 0]}>
          <div className="badge3d">{pad.label} ₺{pad.cost}</div>
        </Html>
      )}
    </group>
  );
}

// Aktif pad'ler: sıradaki omurga pad'i + alınabilir opsiyonel pad'ler (garson). Her biri kendi yerinde.
export function Pad() {
  const padsDone = useGame((s) => s.padsDone);
  const padFills = useGame((s) => s.padFills);
  const tables = useGame((s) => s.tables);
  const stationLevel = useGame((s) => s.stationLevel);
  const lifetime = useGame((s) => s.lifetime);
  const gate = { padsDone, tables, stationLevel, lifetime: lifetime.toNumber() };
  const pads: PadDef[] = [];
  const backbone = currentPad(gate);
  if (backbone) pads.push(backbone);
  pads.push(...availableOptionalPads(gate));
  return (
    <>
      {pads.map((p) => (
        <PadMarker key={p.id} pad={p} fill={padFills[p.id] ?? 0} />
      ))}
    </>
  );
}
