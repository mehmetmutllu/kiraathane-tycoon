// Quaternius karakter yükleyici (WP3, 2026-06-11; CC0 — manifest: public/assets/README.md).
// SkeletonUtils.clone ile her instance bağımsız iskelet alır (skinned mesh paylaşılamaz);
// animasyonlar crossfade ile geçer (Idle/Walk/Run/Wave/Interact — optimize-chars.mjs bu seti bırakır).
// .glb yüklenemezse Model.tsx deseniyle ilkel şekle düşer (greybox fallback — D-013/offline güvenliği).
import { Suspense, Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import type { Group, Object3D, Mesh } from 'three';

export const CHAR_BASE = '/assets/models/characters/';

/** Müşteri çeşitliliği havuzu (id → model; HEP FARKLI hissi). Personel/oyuncu ayrı sabit modeller. */
export const CUSTOMER_MODELS = [
  'Casual_2.glb',
  'Casual_Hoodie.glb',
  'Farmer.glb',
  'Punk.glb',
  'Adventurer.glb',
  'W_Casual.glb',
  'W_Formal.glb',
  'W_Suit.glb',
] as const;

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

function CharBody({ src, anim, scale, y }: { src: string; anim: string; scale: number; y: number }) {
  const { scene, animations } = useGLTF(src);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.traverse((o: Object3D) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = true;
        o.frustumCulled = false; // skinned mesh bound'ları animasyonla kayar — kamera kenarında kaybolmasın
      }
    });
    return c;
  }, [scene]);
  const group = useRef<Group>(null);
  const { actions } = useAnimations(animations, group);
  const cur = useRef<string>('');
  useEffect(() => {
    const next = actions[anim] ?? actions['Idle'] ?? Object.values(actions)[0];
    if (!next) return;
    const prev = cur.current ? actions[cur.current] : null;
    if (prev && prev !== next) prev.fadeOut(0.18);
    next.reset().fadeIn(0.18).play();
    cur.current = anim;
  }, [anim, actions]);
  return (
    <group ref={group} scale={scale} position={[0, y, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

/**
 * Karakter: `model` dosya adı (CHAR_BASE altında), `anim` klip adı. Yüklenemezse `fallback` ilkel şekil.
 * scale 0.58 ≈ Quaternius insan boyu (~1.9) → dünya ölçeği ~1.1 (masa 0.8'e gerçekçi oran;
 * 0.5 ekranda kısa kaldı — gece ölçek ayarı).
 */
export function Character({
  model,
  anim = 'Idle',
  scale = 0.58,
  y = 0,
  fallback,
}: {
  model: string;
  anim?: string;
  scale?: number;
  y?: number;
  fallback: ReactNode;
}) {
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <CharBody src={CHAR_BASE + model} anim={anim} scale={scale} y={y} />
      </Suspense>
    </Boundary>
  );
}

// Pop-in olmasın: sahne kurulurken arka planda yüklensin.
useGLTF.preload(CHAR_BASE + 'Worker.glb');
useGLTF.preload(CHAR_BASE + 'Suit.glb');
for (const m of CUSTOMER_MODELS) useGLTF.preload(CHAR_BASE + m);
