import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  CapsuleGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Object3D,
  Color,
  MathUtils,
  Group,
  SkinnedMesh,
  AnimationMixer,
  BufferAttribute,
  Box3,
  Vector3,
  type AnimationAction,
  type InstancedMesh,
} from 'three';
import { clone as skinKlon } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useGame } from '../../game/store';
import {
  ACTOR_HEIGHT,
  BUBBLE_Y,
  CAPSULE_RADIUS,
  SEATED_DROP,
  KAY_KOK,
  KAY_SCALE,
  KAY_MUSTERI_GOVDE,
  KAY_OTURMA_KALDIRMA,
  NPC_SKIN_CAP,
} from '../../config/actor';
import { PALETTE } from '../../config/palette';
import { ekipmanMi, basMi, kafaKucult, useKayKlipler, KLIP, LOKOMOSYON, lokomosyonSec, YURUME_ESIGI } from './KayActor';
import { WC_GECIS, wcOlcek } from '../../game/layout';

/**
 * Customers — müşteri gövdeleri (S15 · D-113: skinned).
 *
 * NEDEN DEĞİŞTİ: müşteriler bugüne kadar TEK InstancedMesh kapsüldü (1 çizim, 0,04 ms) ve
 * personel S14'te skinned'e geçince salon ikiye ayrıldı — yürüyen karakterlerin yanında
 * kaymayan kapsüller duruyordu. Kullanıcı "hepsinde skinned çok iyi olur" dedi; bedel S15'te
 * ölçüldü (`docs/karakter-raporu-s15.md` §Ç).
 *
 * MİMARİ — HAVUZ, liste değil. Skinned mesh INSTANCE EDİLEMEZ: her gövde kendi iskeletini ve
 * kendi `AnimationMixer`ını taşır. O yüzden `NPC_SKIN_CAP` kadar gövde BİR KEZ kurulur ve
 * müşteriler bu yuvalara oturur; yuva boşalınca bir sonraki müşteri aynı gövdeyi devralır
 * (renk ve klip yeniden yazılır). Müşteri gelip gitmesi mesh kurmaz.
 *
 * TAVANI AŞAN MÜŞTERİ eski instanced kapsülle çizilir — `maxConcurrent` geç oyunda 80'in
 * üstüne çıkabiliyor ve o kadar skinned gövde ölçülen bütçenin üç katı. Kapsül kolu bu yüzden
 * silinmedi; gerekçe ve sayılar `actor.ts` → `NPC_SKIN_CAP`.
 *
 * GÖVDE BAŞINA İKİ MESH: baş dokusunu korur (yüz/saç boyanmaz — D-112), kol+gövde+bacak tek
 * geometriye kaynar ve rengini KÖŞE RENGİNDEN alır. Ölçüldü: 24 müşteri = 48 çizim / 0,52 ms;
 * aynı sayıda 6 parçalı gövde 216 çizim / 1,78 ms.
 *
 * P0 perf: `npcs` abonelikle DEĞİL `getState()` ile okunur — NPC dizisi her karede yeniden
 * üretiliyor (konum) ve abonelik bu bileşeni her kare render ederdi.
 */

// ---- kapsül kolu (tavanı aşan müşteriler + skinned yüklenene kadar) ----
const BODY_GEO = new CapsuleGeometry(CAPSULE_RADIUS, ACTOR_HEIGHT - 2 * CAPSULE_RADIUS, 6, 10)
  .translate(0, ACTOR_HEIGHT / 2, 0);
const BODY_MAT = new MeshStandardMaterial({ color: '#ffffff' }); // gerçek renk per-instance
const BUBBLE_GEO = new SphereGeometry(0.14, 10, 10);
const BUBBLE_MAT = new MeshStandardMaterial({ color: '#ffd54f', emissive: '#ffb300', emissiveIntensity: 0.4 });
const NPC_CAP = 128; // baloncuk + kapsül kolunun tavanı (npcCount tipik ~10-30); ucuz.

/** Müşterinin durumu OTURUYOR mu — gerçek oturuş klibi ve kök kaldırması buna bağlı. */
const oturuyorMu = (durum: string) => durum === 'waitingForTea' || durum === 'drinking';

type Yuva = {
  kok: Group;
  mixer: AnimationMixer;
  eylemler: Record<string, AnimationAction>;
  govdeMat: MeshStandardMaterial;
  /** Yuvayı şu an kullanan müşteri — değişince renk yeniden yazılır. */
  npcId: number;
  suAnKlip: string;
  hedefAci: number;
  aci: number;
  sonX: number;
  sonZ: number;
};

/**
 * Havuzu bir kez kurar: her yuvaya bir gövde, iki mesh, bir mixer ve dört eylem.
 * Gövdeler sırayla dağıtılır — salonda tek tip müşteri olmasın.
 */
function useMusteriHavuzu(): { grup: Group; yuvalar: Yuva[]; govdeBoy: number } {
  const dosyalar = useGLTF(KAY_MUSTERI_GOVDE.map((g) => `${KAY_KOK}${g}.glb`));
  const klipler = useKayKlipler();

  // Havuz TAM BİR KEZ kurulur (`useMemo` değil `useRef`): 24 skinned gövde + 48 geometri
  // kaynağı pahalı bir iştir ve memo bağımlılığının kimliği kaydığı anda baştan koşar —
  // ilk denemede birebir bu oldu ve duman testi canvas'ı 15 sn'de göremedi.
  const havuz = useRef<{ grup: Group; yuvalar: Yuva[]; govdeBoy: number } | null>(null);
  if (!havuz.current) {
    havuz.current = ((): { grup: Group; yuvalar: Yuva[]; govdeBoy: number } => {
    const grup = new Group();
    const yuvalar: Yuva[] = [];
    for (let i = 0; i < NPC_SKIN_CAP; i++) {
      const kaynak = dosyalar[i % dosyalar.length].scene;
      const kok = skinKlon(kaynak) as Group;

      // Ekipmanı (pelerin/miğfer) at, parçaları baş ↔ gövde diye ikiye ayır.
      const parcalar: SkinnedMesh[] = [];
      kok.traverse((n) => {
        const m = n as SkinnedMesh;
        if (m.isSkinnedMesh) parcalar.push(m);
      });
      const sivil = parcalar.filter((p) => !ekipmanMi(p.name));
      const bas = sivil.filter((p) => basMi(p.name));
      const govde = sivil.filter((p) => !basMi(p.name));
      const ana = sivil[0] ?? parcalar[0];
      const ust = ana.parent ?? kok;
      parcalar.forEach((p) => p.parent?.remove(p));

      // Gövde rengi KÖŞE RENGİNDEN gelir: gömlek ve pantolon tek mesh'te, ayrı renkte.
      // `govdeMat` yuvaya ait — müşteri değişince `color` yeniden yazılır ve gömlek onunla döner.
      const govdeMat = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, vertexColors: true });
      if (bas.length) {
        const geo = mergeGeometries(bas.map((p) => p.geometry.clone()), false);
        if (geo) {
          const mesh = new SkinnedMesh(geo, ana.material);
          mesh.bind(ana.skeleton, ana.bindMatrix);
          mesh.castShadow = true;
          mesh.frustumCulled = false;
          ust.add(mesh);
        }
      }
      if (govde.length) {
        const geolar = govde.map((p) => {
          const g = p.geometry.clone();
          // Pantolon KOYU, gömlek AÇIK: renk köşeye yazılır, materyal tek kalır.
          const renk = new Color(/leg/i.test(p.name) ? PALETTE.pants : '#ffffff');
          const say = g.attributes.position.count;
          const dizi = new Float32Array(say * 3);
          for (let v = 0; v < say; v++) {
            dizi[v * 3] = renk.r;
            dizi[v * 3 + 1] = renk.g;
            dizi[v * 3 + 2] = renk.b;
          }
          g.setAttribute('color', new BufferAttribute(dizi, 3));
          return g;
        });
        const geo = mergeGeometries(geolar, false);
        if (geo) {
          const mesh = new SkinnedMesh(geo, govdeMat);
          mesh.bind(ana.skeleton, ana.bindMatrix);
          mesh.castShadow = true;
          mesh.frustumCulled = false;
          ust.add(mesh);
        }
      }

      kafaKucult(kok);
      kok.scale.setScalar(KAY_SCALE);
      kok.visible = false;
      grup.add(kok);

      const mixer = new AnimationMixer(kok);
      const eylemler: Record<string, AnimationAction> = {};
      for (const ad of [KLIP.dur, KLIP.otur, ...LOKOMOSYON.yuru]) {
        const klip = klipler.find((c) => c.name === ad);
        if (klip) eylemler[ad] = mixer.clipAction(klip);
      }
      eylemler[KLIP.dur]?.play();
      mixer.setTime(i * 0.17); // faz kaydır: yirmi dört müşteri aynı karede nefes almasın

      yuvalar.push({
        kok, mixer, eylemler, govdeMat,
        npcId: -1, suAnKlip: KLIP.dur, hedefAci: 0, aci: 0, sonX: 0, sonZ: 0,
      });
    }

    // BALONCUK YÜKSEKLİĞİ gövdeden TÜRETİLİR, elle yazılmaz: baş `KAY_KAFA_OLCEK` ile küçüldüğü
    // için siluetin tepesi 1,75 değil (ölçüm: ×0,75'te ~1,52) ve o sayı ölçek değişince kayar.
    // `BUBBLE_Y` kapsül kolunun sabiti olarak yerinde kalıyor — o gövde küçülmedi.
    const ilk = yuvalar[0];
    let govdeBoy = ACTOR_HEIGHT;
    if (ilk) {
      ilk.kok.visible = true;
      ilk.kok.updateMatrixWorld(true);
      const kutu = new Box3().setFromObject(ilk.kok);
      const h = kutu.getSize(new Vector3()).y;
      if (h > 0.1) govdeBoy = h;
      ilk.kok.visible = false;
    }
    return { grup, yuvalar, govdeBoy };
    })();
  }
  return havuz.current;
}

export function Customers() {
  const bodyRef = useRef<InstancedMesh>(null);
  const bubbleRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const col = useMemo(() => new Color(), []);
  const { grup, yuvalar, govdeBoy } = useMusteriHavuzu();

  useFrame((st, dt) => {
    const bubble = bubbleRef.current;
    const kapsul = bodyRef.current;
    if (!bubble || !kapsul) return;
    const npcs = useGame.getState().npcs;
    const n = Math.min(npcs.length, NPC_CAP);
    const t = st.clock.elapsedTime;
    let bubbleCount = 0;
    let kapsulCount = 0;

    for (let i = 0; i < n; i++) {
      const npc = npcs[i];
      const x = npc.pos[0];
      const z = npc.pos[2];
      const oturan = oturuyorMu(npc.state);
      // Lavaboya giren müşteri İÇERİDEDİR — çizilmez. Kapı eşiğinde anında yok olmaz:
      // 'wcGiris'/'wcCikis' boyunca kapı boşluğundan yürür ve son %40'ta ölçekle söner.
      const gorunurluk =
        npc.state === 'inWc' ? 0
        : npc.state === 'wcGiris' ? wcOlcek(1 - npc.timer / WC_GECIS)
        : npc.state === 'wcCikis' ? wcOlcek(npc.timer / WC_GECIS)
        : 1;

      if (i < yuvalar.length) {
        // ---- SKINNED YUVA ----
        const y = yuvalar[i];
        if (y.npcId !== npc.id) {
          // Yuva el değiştirdi: gömlek rengi yeni müşteriden gelir (`feedback_color_variety`).
          y.npcId = npc.id;
          y.govdeMat.color.set(npc.color);
          y.sonX = x;
          y.sonZ = z;
        }
        const dx = x - y.sonX;
        const dz = z - y.sonZ;
        const hiz = dt > 0 ? Math.sqrt(dx * dx + dz * dz) / dt : 0;
        if (dx * dx + dz * dz > 1e-5) y.hedefAci = Math.atan2(dx, dz);
        y.sonX = x;
        y.sonZ = z;
        let tg = y.hedefAci;
        while (tg - y.aci > Math.PI) tg -= Math.PI * 2;
        while (tg - y.aci < -Math.PI) tg += Math.PI * 2;
        y.aci = MathUtils.damp(y.aci, tg, 9, dt);

        // Oturan müşteri GERÇEK oturuş klibindedir; kök `KAY_OTURMA_KALDIRMA` kadar kalkar ki
        // kalça taburenin oturağına gelsin (ölçüm §Oturus). Eski `SEATED_DROP` bir kapsül
        // numarasıydı ve skinned gövdede kullanılmaz.
        y.kok.visible = gorunurluk > 0;
        y.kok.position.set(x, oturan ? KAY_OTURMA_KALDIRMA : 0, z);
        y.kok.rotation.y = y.aci;
        y.kok.scale.setScalar(KAY_SCALE * gorunurluk);

        const secim = !oturan && hiz > YURUME_ESIGI ? lokomosyonSec(LOKOMOSYON.yuru, hiz) : null;
        const hedefKlip = oturan ? KLIP.otur : secim ? secim.klip : KLIP.dur;
        const yeni = y.eylemler[hedefKlip];
        if (yeni) {
          yeni.timeScale = secim ? secim.timeScale : 1;
          if (hedefKlip !== y.suAnKlip) {
            const eski = y.eylemler[y.suAnKlip];
            yeni.reset().play();
            if (eski && eski !== yeni) eski.crossFadeTo(yeni, 0.18, false);
            y.suAnKlip = hedefKlip;
          }
        }
        y.mixer.update(dt);
      } else {
        // ---- KAPSÜL KOLU: bütçeyi aşan müşteri (gerekçe actor.ts → NPC_SKIN_CAP) ----
        // Kapsül oturamaz; oturan müşteri `SEATED_DROP` kadar iner ve taburenin üstünde
        // yalnız üst gövde kalır. Bu kol bilerek eski davranışını koruyor.
        const bobY = oturan ? SEATED_DROP + Math.sin(t * 2 + npc.id) * 0.04 : 0;
        dummy.position.set(x, bobY, z);
        dummy.rotation.set(0, 0, 0); // kapsül dönel simetrik — yön taşımaz (eski kolun da etkisi yoktu)
        dummy.scale.setScalar(gorunurluk);
        dummy.updateMatrix();
        kapsul.setMatrixAt(kapsulCount, dummy.matrix);
        col.set(npc.color);
        kapsul.setColorAt(kapsulCount, col);
        kapsulCount++;
      }

      // "çay bekliyor" baloncuğu — baş üstünde, dönmez.
      if (npc.state === 'waitingForTea') {
        const skinned = i < yuvalar.length;
        dummy.position.set(
          x,
          skinned ? govdeBoy + 0.15 + (oturan ? KAY_OTURMA_KALDIRMA - 0.3 : 0) : BUBBLE_Y + SEATED_DROP,
          z,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        bubble.setMatrixAt(bubbleCount, dummy.matrix);
        bubbleCount++;
      }
    }

    // Kullanılmayan yuvaları gizle (müşteri azalınca sahnede hayalet kalmasın).
    for (let i = n; i < yuvalar.length; i++) {
      yuvalar[i].kok.visible = false;
      yuvalar[i].npcId = -1;
    }

    kapsul.count = kapsulCount;
    kapsul.instanceMatrix.needsUpdate = true;
    if (kapsul.instanceColor) kapsul.instanceColor.needsUpdate = true;
    bubble.count = bubbleCount;
    bubble.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <primitive object={grup} />
      <instancedMesh ref={bodyRef} args={[BODY_GEO, BODY_MAT, NPC_CAP]} castShadow frustumCulled={false} />
      <instancedMesh ref={bubbleRef} args={[BUBBLE_GEO, BUBBLE_MAT, NPC_CAP]} frustumCulled={false} />
    </>
  );
}
