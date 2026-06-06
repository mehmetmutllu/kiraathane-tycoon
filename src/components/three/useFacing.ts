import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Group } from 'three';

/**
 * Faz 2f juice: bir grubu hareket YÖNÜNE doğru yumuşakça döndürür (damp; react-spring yok).
 * Her kare son konuma göre yön hesaplar; hareket yoksa son yönü korur. Açı sarması (wrap)
 * kısa yoldan giderilir. Yürüyen tüm karakterlerde (oyuncu/garson/bulaşıkçı/müşteri) kullanılır.
 */
export function useFacing(ref: React.RefObject<Group | null>, x: number, z: number, lambda = 9) {
  const last = useRef<[number, number] | null>(null);
  const target = useRef(0);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (last.current) {
      const dx = x - last.current[0];
      const dz = z - last.current[1];
      if (dx * dx + dz * dz > 1e-5) target.current = Math.atan2(dx, dz);
    }
    last.current = [x, z];
    // Hedef açıyı mevcut açının ±π aralığına çek → en kısa yoldan dön.
    let t = target.current;
    while (t - g.rotation.y > Math.PI) t -= Math.PI * 2;
    while (t - g.rotation.y < -Math.PI) t += Math.PI * 2;
    g.rotation.y = MathUtils.damp(g.rotation.y, t, lambda, dt);
  });
}
