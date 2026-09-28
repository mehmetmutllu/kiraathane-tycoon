import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, InstancedMesh, MeshBasicMaterial, Object3D, Shape, ShapeGeometry } from 'three';
import { ONBOARDING } from '../../config/onboarding';
import { activeStep } from '../../game/activeStep';
import { izCizilir, ogreticiAdimi } from '../../game/onboarding';
import { cardQuestIndex } from '../../game/rules';
import { useGame } from '../../game/store';

const IZ = ONBOARDING.iz;

/**
 * E5 — ZEMİN İZİ: oyuncunun ayağından aktif adımın hedefine akan ok başları.
 *
 * Hedefi KENDİSİ hesaplamaz: `activeStep`i okur (Scene'in `QuestPointer`ı yazar; öğretici süresince
 * orası müşteri/para olur). Böylece iz · kenar oku · zemin işareti aynı noktayı gösterir (D-038).
 * Zemine yapışık ve düz — havada kart/ok yok (`feedback_interaction_model`). Hareket tek bir
 * `useFrame` kaydırması; React render'ı tetiklemez.
 */
export function OgreticiIz() {
  const ref = useRef<InstancedMesh>(null);
  const tmp = useMemo(() => new Object3D(), []);
  const geo = useMemo(() => {
    // Geniş "^" ok başı (kollar arası ~120°: dik açılı ok üstten bakınca köşe gibi okunuyordu).
    // Tepe (0, .2), kol uçları (±.5, −.1), kalınlık .26 (dikey). +Y ileri → +Z'ye yatırılır.
    const s = new Shape();
    s.moveTo(0, 0.2);
    s.lineTo(0.5, -0.1);
    s.lineTo(0.5, -0.36);
    s.lineTo(0, -0.06);
    s.lineTo(-0.5, -0.36);
    s.lineTo(-0.5, -0.1);
    s.closePath();
    const g = new ShapeGeometry(s);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: IZ.renk,
        transparent: true,
        opacity: IZ.opaklik,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const zaman = useRef(0);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const g = useGame.getState();
    const adim = ogreticiAdimi({ kartIndex: cardQuestIndex(g), atlandi: g.ogreticiAtlandi, yurudu: true });
    const p = g.player;
    const dx = activeStep.x - p[0];
    const dz = activeStep.z - p[2];
    const uzak = Math.hypot(dx, dz);
    if (!activeStep.has || !izCizilir(adim, g) || uzak < IZ.yakinGizle) {
      m.count = 0;
      return;
    }
    zaman.current = (zaman.current + dt * IZ.hiz) % IZ.aralik;
    const yaw = Math.atan2(dx, dz);
    const ux = dx / uzak;
    const uz = dz / uzak;
    const son = uzak - IZ.yakinGizle * 0.6;
    let n = 0;
    for (let s = IZ.bastanPay + zaman.current; s < son && n < IZ.enCok; s += IZ.aralik) {
      // Uçlarda sönme: iz oyuncudan "doğar", hedefin önünde "söner" — kesik uç yok.
      const f = Math.max(0, Math.min(1, (s - IZ.bastanPay) / IZ.sonum, (son - s) / IZ.sonum));
      tmp.position.set(p[0] + ux * s, IZ.y, p[2] + uz * s);
      tmp.rotation.set(0, yaw, 0);
      tmp.scale.setScalar(IZ.boy * f);
      tmp.updateMatrix();
      m.setMatrixAt(n++, tmp.matrix);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo, mat, IZ.enCok]} frustumCulled={false} renderOrder={3} />;
}
