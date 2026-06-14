// Fallback loader: .glb varsa yükle, yoksa (veya hata olursa) ilkel şekle düş.
// Greybox aşamasında src verilmez → her zaman fallback. Faz 6'da src takılır, oynanış kodu değişmez.
import { Suspense, Component, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Vec3 } from '../../game/types';

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

// Dönüşüm yalnız YÜKLENEN modele uygulanır (fallback greybox kendi oyun-ölçeğindedir, dokunulmaz).
type Xform = { scale?: number | Vec3; position?: Vec3; rotation?: Vec3 };

function Glb({ src, scale, position, rotation }: { src: string } & Xform) {
  const { scene } = useGLTF(src);
  return <primitive object={scene.clone()} scale={scale} position={position} rotation={rotation} />;
}

export function Model({ src, fallback, ...x }: { src?: string; fallback: ReactNode } & Xform) {
  if (!src) return <>{fallback}</>;
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Glb src={src} {...x} />
      </Suspense>
    </Boundary>
  );
}
