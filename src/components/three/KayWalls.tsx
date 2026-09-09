import { Merged, useGLTF } from '@react-three/drei';
import { Component, useMemo, type ReactNode } from 'react';
import { Mesh, type Object3D } from 'three';
import { kayDuvar, type WallRun } from './wallLook';
import { WallPanels } from './wallPanel';
import type { WallTheme } from '../../config/palette';

/**
 * KayWalls.tsx — DUVARIN KAYKIT KİPİ (S4).
 *
 * **Bu bileşen eski duvarın YERİNE geçmez, YANINA durur** (kullanıcı 2026-09-09:
 * *"duvarı direkt komple KayKit'e bağlama, beğenmezsek eskisine dönebilir olalım"*).
 * `wallPanel.WallPanels` (maketin üç katmanı) silinmedi; ikisi de aynı parça listesini
 * (`wallLook.WALL_RUNS`) okuyor ve `Scene` hangisini çizeceğini `kabuk` kipinden seçiyor.
 * Yükleme başarısız olursa da maket duvarına düşülür — `Model.tsx`in fallback kuralı.
 *
 * DÖŞEME: `wallLook.kayModuller` (K4 eş dağıtım). Gerekçesi ve ölçülen dört kolun sayıları
 * `docs/duvar-zemin-raporu-s4.md` §B3'te; burada tek bir koordinat yazılı değil.
 *
 * DRAW-CALL: model tek node/tek mesh/tek materyal (`restaurant` atlası) → `<Merged>` ile
 * ~99 modül **1 draw-call**. `Tables.tsx` aynı deseni 5 mobilya modeli için kullanıyor.
 */

const KAY = '/assets/models/kaykit-restaurant-bits/';
const WALL_URL = `${KAY}wall.gltf`;
useGLTF.preload(WALL_URL);

function firstMesh(o: Object3D): Mesh | null {
  let found: Mesh | null = null;
  o.traverse((c) => {
    if (!found && (c as Mesh).isMesh) found = c as Mesh;
  });
  return found;
}

/** Yükleme hatasında maket duvarına düş (greybox-first · CLAUDE.md fallback kuralı). */
class KayBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

function KayGovde({ runs }: { runs: WallRun[] }) {
  const gltf = useGLTF(WALL_URL);
  const mesh = useMemo(() => firstMesh(gltf.scene), [gltf]);
  const moduller = useMemo(() => kayDuvar(runs), [runs]);
  // Mesh bulunamazsa Boundary'ye düş: `throw` fallback'i tetikler (sessizce boş duvar çizmez).
  if (!mesh) throw new Error('wall.gltf içinde mesh yok');
  return (
    // frustumCulled=false: InstancedMesh'in sınır küresi origin'de (yerel geometri) kalır →
    // uzak salona odaklanınca batch toptan kırpılırdı (Tables/floorPattern ile aynı sınıf bug).
    <Merged meshes={{ wall: mesh }} frustumCulled={false}>
      {(comps) => {
        const C = comps.wall;
        if (!C) return null;
        return (
          <>
            {moduller.map((m, i) => (
              <C key={i} position={[m.x, 0, m.z]} rotation={[0, m.rot, 0]} scale={m.scale} castShadow receiveShadow />
            ))}
          </>
        );
      }}
    </Merged>
  );
}

/**
 * Verilen parçaları KayKit modülleriyle çizer. `theme` yalnız FALLBACK için gerekir
 * (maket duvarı temaya göre boyanır); KayKit kipinde renk atlastan gelir.
 */
export function KayWalls({ runs, theme }: { runs: WallRun[]; theme: WallTheme }) {
  const yedek = <WallPanels slabs={runs.map((r) => ({ x: r.x, z: r.z, w: r.w, d: r.d, theme }))} />;
  if (runs.length === 0) return null;
  return (
    <KayBoundary fallback={yedek}>
      <KayGovde runs={runs} />
    </KayBoundary>
  );
}
