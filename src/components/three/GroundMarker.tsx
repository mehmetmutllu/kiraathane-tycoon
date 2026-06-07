import { Text } from '@react-three/drei';
import type { Vec3 } from '../../game/types';

/**
 * Sade zemin işareti (D-017 §2): havada Html rozet / iri disk+koni YOK. Yerde UFAK, şeffaf beyazımsı
 * çember + ortasında DÜZ zemin yazısı (ne yapacağı: "Yeni Masa" / "Garson" / "Yükselt") + maliyet.
 * Kategori rengi yalnız ince halka + dolum yayında (yeşil=aç / mavi=opsiyonel / altın=yükseltme).
 * Parası yetiyorsa hafif parlar (afford). Bilgi sade; "gereken yerde" çağıran karar verir (sıralı reveal).
 */
export function GroundMarker({
  pos,
  label,
  sub,
  tint,
  progress = 0,
  afford = false,
  radius = 0.85,
}: {
  pos: Vec3;
  label: string;
  sub?: string;
  tint: string;
  progress?: number;
  afford?: boolean;
  radius?: number;
}) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* şeffaf beyazımsı zemin çemberi */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={afford ? 0.26 : 0.16} depthWrite={false} />
      </mesh>
      {/* ince kategori halkası */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.9, radius, 40]} />
        <meshBasicMaterial color={tint} transparent opacity={afford ? 0.85 : 0.5} depthWrite={false} />
      </mesh>
      {/* dolum yayı (progress) — büyüyen iç disk */}
      {p > 0.001 && (
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[p, p, 1]}>
          <circleGeometry args={[radius * 0.85, 40]} />
          <meshBasicMaterial color={tint} transparent opacity={0.45} depthWrite={false} />
        </mesh>
      )}
      {/* zemin yazısı (havada değil; objenin değil yerin üstünde) */}
      <Text
        position={[0, 0.05, sub ? -0.12 : 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.26}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#1a1a1a"
        maxWidth={radius * 2.1}
        textAlign="center"
      >
        {label}
      </Text>
      {sub && (
        <Text
          position={[0, 0.05, 0.26]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#ffe082"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#1a1a1a"
        >
          {sub}
        </Text>
      )}
    </group>
  );
}
