// Fallback loader: .glb varsa yükle, yoksa (veya hata olursa) ilkel şekle düş.
// Greybox aşamasında src verilmez → her zaman fallback. Faz 6'da src takılır, oynanış kodu değişmez.
import { Suspense, Component, useMemo, useReducer, useEffect, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, type Object3D } from 'three';
import type { Vec3 } from '../../game/types';
import { recoloredAtlas, atlasReady, onAtlasReady } from './recolor';

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
// recolor: verilirse asset'in mavi minderi o hex'e boyanır (recolor.ts, runtime atlas kopyası).
type Xform = { scale?: number | Vec3; position?: Vec3; rotation?: Vec3; recolor?: string };

function Glb({ src, scale, position, rotation, recolor }: { src: string } & Xform) {
  const { scene } = useGLTF(src);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  // Atlas asenkron yüklenir; hazır olunca yeniden boya.
  useEffect(() => (recolor ? onAtlasReady(bump) : undefined), [recolor]);
  const ready = atlasReady();
  const obj = useMemo(() => {
    const clone = scene.clone(true);
    if (recolor) {
      const tex = recoloredAtlas(recolor);
      if (tex)
        clone.traverse((o: Object3D) => {
          const m = o as Mesh;
          if (m.isMesh) {
            const nm = (m.material as MeshStandardMaterial).clone();
            nm.map = tex;
            nm.needsUpdate = true;
            m.material = nm;
          }
        });
    }
    return clone;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, recolor, ready]);
  return <primitive object={obj} scale={scale} position={position} rotation={rotation} />;
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
