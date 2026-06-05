// Fallback loader: .glb varsa yükle, yoksa (veya hata olursa) ilkel şekle düş.
// Greybox aşamasında src verilmez → her zaman fallback. Faz 6'da src takılır, oynanış kodu değişmez.
import { Suspense, Component, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

function Glb({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene.clone()} />;
}

export function Model({ src, fallback }: { src?: string; fallback: ReactNode }) {
  if (!src) return <>{fallback}</>;
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Glb src={src} />
      </Suspense>
    </Boundary>
  );
}
