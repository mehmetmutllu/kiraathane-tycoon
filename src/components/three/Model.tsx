// Fallback loader: .glb varsa yükle, yoksa (veya hata olursa) ilkel şekle düş.
// Greybox aşamasında src verilmez → her zaman fallback. Faz 6'da src takılır, oynanış kodu değişmez.
import { Suspense, Component, useMemo, useReducer, useEffect, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, MeshStandardMaterial, type Object3D } from 'three';
import { gozDegistir, type Goz } from './atlasUV';
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
/**
 * `esleme`: ATLAS GÖZÜ DEĞİŞTİRME (S6/②). KayKit'in dokusu bir renk şeridi; bir modelin rengini
 * değiştirmenin doğru yolu dokuyu boyamak değil, UV'yi başka bir göze taşımaktır (`atlasUV.ts`).
 * Neden `recolor` yetmiyor: o atlasın KOPYASINI boyar, yani aynı gözü kullanan BAŞKA modeller de
 * renk değiştirir. Göz taşıma yalnız bu modelin geometrisine dokunur.
 * Kullanıcı isteği (2026-09-10): *"mutfaktaki turuncular var ya, onların gri halleri olsun."*
 */
type Xform = {
  scale?: number | Vec3;
  position?: Vec3;
  rotation?: Vec3;
  recolor?: string;
  esleme?: readonly (readonly [Goz, Goz])[];
};

function Glb({ src, scale, position, rotation, recolor, esleme }: { src: string } & Xform) {
  const { scene } = useGLTF(src);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  // Atlas asenkron yüklenir; hazır olunca yeniden boya.
  useEffect(() => (recolor ? onAtlasReady(bump) : undefined), [recolor]);
  const ready = atlasReady();
  const obj = useMemo(() => {
    const clone = scene.clone(true);
    if (esleme?.length)
      clone.traverse((o: Object3D) => {
        const m = o as Mesh;
        if (m.isMesh) m.geometry = gozDegistir(m.geometry, esleme);
      });
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
  }, [scene, recolor, esleme, ready]);
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
