import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Box3, PerspectiveCamera, Vector4, type Object3D } from 'three';
import { DEKOR_KADRAJ, vitrinYuva } from '../../config/decor';
import { dekorKadraj } from '../../game/dekorKadraj';
import { useGame } from '../../game/store';
import { vitrinUrunu } from '../../game/vitrin';

/**
 * 💎 DEKOR ÖNİZLEMESİNİN ÇEKİMİ (F4c-4 · D-157). Mağaza eşyayı salondaki YERİNDE gösterir: ana sahne
 * (ışık, gölge, komşu mobilya, çaycılar) AYRI bir kamerayla, tuvalin bir köşesine çizilir ve o bölge
 * aynı görevde paylaşılan 2B tuvale kopyalanır. Bir sonraki ana kare tuvalin tamamını yeniden
 * çizdiği için köşe hiç görünmez (mağaza zaten tam ekran). İkinci bir WebGL bağlamı AÇILMAZ —
 * sahneyi ikinci kez kurmak hem bellek hem "mağazada gördüğün ≠ salondaki" riski olurdu.
 *
 * Eşyanın kendisi `VitrinDekor` tarafından önizleme süresince yuvasına konur (`cizilenDekor`) ve
 * grubunu buraya kaydeder; kadraj o grubun ÇİZİLEN kutusundan kurulur (`dekorKadraj`).
 */

/** Mağazanın önizleme kutusu bu tuvali kendi içine takar; `surum` her çekimde artar. */
export const dekorKaresi = {
  tuval: typeof document === 'undefined' ? null : document.createElement('canvas'),
  /** Kutunun en/boy oranı — kutu takılınca kendi ölçüsünü yazar, çekim o oranda yapılır. */
  enBoy: DEKOR_KADRAJ.enBoy as number,
  surum: 0,
  dinleyiciler: new Set<() => void>(),
};

let onizlemeGrubu: Object3D | null = null;
export const onizlemeGrubuKaydet = (g: Object3D | null) => {
  onizlemeGrubu = g;
};

/** İlk çekimden sonra kaç saniyede bir yenilenir: model geç yüklenir, salon da canlı. */
const YENILEME_SN = 0.5;

export function DekorCekimi() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const cam = useMemo(() => new PerspectiveCamera(DEKOR_KADRAJ.fov, DEKOR_KADRAJ.enBoy, 0.1, 200), []);
  const kutu = useMemo(() => new Box3(), []);
  const eskiVp = useMemo(() => new Vector4(), []);
  const st = useRef({ id: null as string | null, kare: 0, son: -Infinity });

  useFrame((state) => {
    const id = useGame.getState().dekorOnizleme;
    const r = st.current;
    if (id !== r.id) {
      r.id = id;
      r.kare = 0;
      r.son = -Infinity;
    }
    const tuval = dekorKaresi.tuval;
    if (!id || !onizlemeGrubu || !tuval) return;
    // Eşya bu karede takıldıysa matrisleri henüz güncel değil: iki kare bekle.
    if (++r.kare < 3 || state.clock.elapsedTime - r.son < YENILEME_SN) return;
    const y = vitrinYuva(vitrinUrunu('decor', id)?.yuva ?? '');
    onizlemeGrubu.updateWorldMatrix(true, true);
    kutu.setFromObject(onizlemeGrubu);
    if (!y || kutu.isEmpty()) return; // model henüz yüklenmedi
    r.son = state.clock.elapsedTime;

    const k = dekorKadraj(kutu.min.toArray(), kutu.max.toArray(), y.duvar);
    const el = gl.domElement;
    let en = Math.min(DEKOR_KADRAJ.enPx, el.width);
    let boy = Math.round(en / dekorKaresi.enBoy);
    if (boy > el.height) {
      boy = el.height;
      en = Math.round(boy * dekorKaresi.enBoy);
    }
    cam.aspect = en / boy;
    cam.position.set(...k.kamera);
    cam.lookAt(...k.hedef);
    cam.updateProjectionMatrix();

    // setViewport/setScissor MANTIKSAL px ister (piksel oranıyla çarpar) — tuval pikselinden çevrilir.
    const pr = gl.getPixelRatio();
    gl.getViewport(eskiVp);
    gl.setViewport(0, 0, en / pr, boy / pr);
    gl.setScissor(0, 0, en / pr, boy / pr);
    gl.setScissorTest(true);
    gl.render(scene, cam);
    // Aynı görevde kopyalanır: `preserveDrawingBuffer` olmadan tampon ancak görev bitince silinir.
    if (tuval.width !== en || tuval.height !== boy) {
      tuval.width = en;
      tuval.height = boy;
    }
    tuval.getContext('2d')?.drawImage(el, 0, el.height - boy, en, boy, 0, 0, en, boy);
    gl.setScissorTest(false);
    gl.setViewport(eskiVp);
    dekorKaresi.surum++;
    dekorKaresi.dinleyiciler.forEach((f) => f());
  });
  return null;
}
