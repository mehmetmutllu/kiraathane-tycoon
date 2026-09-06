import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Group } from 'three';

/**
 * P0 perf (2026-09-06): yürüyen karakterin KONUMU React'ten çıkarıldı. Eskiden konum prop'tu
 * (`<group position={[x, 0, z]}>`) → store'daki konum her karede değiştiğinden bileşen ve
 * altındaki bütün mesh'ler her kare yeniden render ediliyordu (ölçüm: kare başına 3,2 React
 * commit). Artık hem konum hem yön doğrudan three nesnesine yazılır; React yalnız AYRIK
 * değişimlerde (tepsi adedi, kademe, personelin var/yok olması) çalışır.
 *
 * `read()` her karede store'dan güncel konumu döndürür (null → aktör yok, dokunma).
 * Dönüş matematiği useFacing ile BİREBİR aynı.
 */
export function useActorTransform(
  outerRef: React.RefObject<Group | null>,
  ref: React.RefObject<Group | null>,
  read: () => readonly [number, number] | null,
  lambda = 9,
) {
  const last = useRef<[number, number] | null>(null);
  const target = useRef(0);
  useFrame((_, dt) => {
    const o = outerRef.current;
    if (!o) return;
    const p = read();
    if (!p) return;
    const [x, z] = p;
    o.position.set(x, 0, z);
    const g = ref.current;
    if (!g) return;
    if (last.current) {
      const dx = x - last.current[0];
      const dz = z - last.current[1];
      if (dx * dx + dz * dz > 1e-5) target.current = Math.atan2(dx, dz);
    }
    last.current = [x, z];
    let t = target.current;
    while (t - g.rotation.y > Math.PI) t -= Math.PI * 2;
    while (t - g.rotation.y < -Math.PI) t += Math.PI * 2;
    g.rotation.y = MathUtils.damp(g.rotation.y, t, lambda, dt);
  });
}
