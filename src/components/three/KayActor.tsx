import { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  BoxGeometry,
  CylinderGeometry,
  Box3,
  type Object3D,
  type Bone,
  type AnimationAction,
} from 'three';
import { clone as skinKlon } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PALETTE } from '../../config/palette';
import { KAY_KOK, KAY_KLIPLER, KAY_MODEL, KAY_KIYAFET, KAY_SCALE, type ActorKind } from '../../config/actor';

/**
 * KayActor — personel gövdesi: KayKit karakteri + ayrı dosyadaki klip + oyunun kıyafeti.
 *
 * NEDEN BÖYLE (S14 · D-112, ölçüm `docs/karakter-raporu-s14.md`):
 * - Gövdeler fantezi paketinden geliyor ama **ekipman ayrı düğüm** (pelerin/miğfer/şapka);
 *   gizlemek bir satır, mesh düzenleme gerekmiyor (§B3).
 * - Ortaçağ derisi gövdenin DOKUSUNDAydı; gövde ve bacak oyunun paletine boyanınca kıyafet
 *   oluyor. **Baş boyanmaz** — yüz, saç, sakal başın kendi dokusundan gelir; boyanınca saç da
 *   ten rengine dönüyordu (ölçüm turunda birebir bu oldu).
 * - Kasket ve önlük bizim: bugüne kadar `Player.tsx`'te ilkel şekildi, artık `head`/`chest`
 *   KEMİĞİNE takılı — yani yürüme ve oturma klibi onları da taşıyor.
 *
 * Klip seçimi React'ten GEÇMEZ: konum her kare doğrudan three'ye yazılıyor (`actorTransform`),
 * dolayısıyla hız da burada, `useFrame` içinde ölçülür ve eylem çapraz geçişle değiştirilir.
 * Prop'a bağlasaydık her hız değişimi bir React render'ı olurdu.
 */

/** Ekipman parçası: adın SON bölümü (rol) bu köklerden biriyse gövdeye girmez. */
const EKIPMAN = [
  'cape', 'cloak', 'helmet', 'visor', 'hood', 'hat', 'crown', 'shoulder', 'pauldron',
  'pauldrons', 'armor', 'sword', 'shield', 'staff', 'wand', 'bow', 'quiver', 'dagger',
  'axe', 'spellbook', 'horn', 'backpack', 'mask',
];
const ekipmanMi = (ad: string) => {
  const rol = ad.split('_').pop()?.toLowerCase() ?? '';
  return EKIPMAN.some((k) => rol.startsWith(k) || rol.endsWith(k));
};

/** Hangi parça hangi renge boyanır. Baş listede YOK (yukarıdaki gerekçe). */
const PARCA_RENK: readonly (readonly [RegExp, string])[] = [
  [/arm/i, PALETTE.shirt],
  [/body|torso/i, PALETTE.shirt],
  [/leg/i, PALETTE.pants],
];

/** Klip adları — dosya değil KLİP; hangi durumda hangisi çalar. */
const KLIP = {
  dur: 'Idle_A',
  yuru: 'Walking_A',
  tasi: 'Walking_B',
  calis: 'Working_A',
  otur: 'Sit_Chair_Idle',
} as const;
export type KayHal = keyof typeof KLIP;

/** Yürüyor sayılma eşiği (birim/sn). Altında `dur`, üstünde `yuru`. */
const YURUME_ESIGI = 0.25;

function mat(renk: string) {
  return new MeshStandardMaterial({ color: renk, roughness: 0.85 });
}

/**
 * Kimlik parçalarını kemiğe takar. Ölçüler HAM rig biriminde (gövde 2,204 ham = 1,75 dünya);
 * ölçülen hatlar: baş mesh'i y 1,10…2,20 · gövde 0,38…1,24 · baş eni 0,86.
 */
function kiyafetTak(kok: Object3D, kind: ActorKind) {
  const kemikler = new Map<string, Bone>();
  kok.traverse((n) => {
    if ((n as Bone).isBone) kemikler.set(n.name, n as Bone);
  });
  kok.updateWorldMatrix(true, true);
  const q = new Quaternion();
  const tak = (kemikAd: string, mesh: Mesh | Group, nokta: Vector3) => {
    const k = kemikler.get(kemikAd);
    if (!k) return;
    k.add(mesh);
    mesh.position.copy(k.worldToLocal(nokta.clone()));
    mesh.quaternion.copy(k.getWorldQuaternion(q).invert()); // kemiğin kendi dönüşünü geri al
  };

  const kiyafet = KAY_KIYAFET[kind];
  if (kiyafet.kasket) {
    // Kasket SABİT yükseklikte duramaz: her gövdenin saçı farklı yükseliyor (Ranger'ın saçı
    // 2,28'e, mankenin kafası 2,20'ye çıkıyor) ve sabit 2,06 saçın İÇİNDE kalıyordu — oyunda
    // alın bandı gibi okundu. Ölçü başın kendi kutusundan alınır, yani her gövdede oturur.
    const bas = new Box3();
    kok.traverse((n) => {
      const m = n as Mesh;
      if (m.isMesh && m.visible && /head|skull/i.test(m.name)) bas.union(new Box3().setFromObject(m));
    });
    const tepe = bas.isEmpty() ? 2.2 : bas.max.y;
    const yaricap = bas.isEmpty() ? 0.44 : ((bas.max.x - bas.min.x) / 2) * 0.98;
    const kasket = new Group();
    kasket.add(new Mesh(new CylinderGeometry(yaricap * 0.94, yaricap, 0.16, 14), mat(PALETTE.cap)));
    const vizor = new Mesh(new BoxGeometry(yaricap * 1.15, 0.045, yaricap * 0.7), mat(PALETTE.cap));
    vizor.position.set(0, -0.06, yaricap * 0.95);
    kasket.add(vizor);
    tak('head', kasket, new Vector3(0, tepe - 0.05, 0));
  }
  if (kiyafet.onluk) {
    tak('chest', new Mesh(new BoxGeometry(0.58, 0.72, 0.08), mat(PALETTE.apron)), new Vector3(0, 0.78, 0.3));
    tak('hips', new Mesh(new CylinderGeometry(0.35, 0.35, 0.07, 14), mat(PALETTE.apron)), new Vector3(0, 0.48, 0));
  }
}

/** Klip dosyalarının hepsini yükle ve tek listede topla (hepsi aynı rig'e bağlı). */
function useKayKlipler() {
  const yollar = useMemo(() => KAY_KLIPLER.map((f) => `${KAY_KOK}${f}.glb`), []);
  const dosyalar = useGLTF(yollar);
  return useMemo(() => dosyalar.flatMap((d) => d.animations), [dosyalar]);
}

export function KayActor({ kind, hal }: { kind: ActorKind; hal?: KayHal }) {
  const { scene } = useGLTF(`${KAY_KOK}${KAY_MODEL[kind]}.glb`);
  const klipler = useKayKlipler();
  const ref = useRef<Group>(null);

  const govde = useMemo(() => {
    // SkeletonUtils: skinned mesh'te düz klon bütün kopyaları TEK iskelete bağlar.
    const o = skinKlon(scene);
    o.traverse((n) => {
      const m = n as Mesh;
      if (!m.isMesh) return;
      if (ekipmanMi(m.name)) {
        m.visible = false;
        return;
      }
      m.castShadow = true;
      const e = PARCA_RENK.find(([d]) => d.test(m.name));
      if (e) m.material = mat(e[1]);
    });
    kiyafetTak(o, kind);
    return o;
  }, [scene, kind]);

  const { actions } = useAnimations(klipler, ref);

  // Başlangıç: dur. (Eylemler ilk karede hazır olur; hal değişimi useFrame'de yürür.)
  const suAn = useRef<KayHal>('dur');
  useEffect(() => {
    const a = actions[KLIP.dur];
    a?.reset().play();
    return () => {
      a?.stop();
    };
  }, [actions]);

  const sonKonum = useRef<Vector3 | null>(null);
  const dunya = useRef(new Vector3());
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g || dt <= 0) return;
    g.getWorldPosition(dunya.current);
    let hiz = 0;
    if (sonKonum.current) {
      const dx = dunya.current.x - sonKonum.current.x;
      const dz = dunya.current.z - sonKonum.current.z;
      hiz = Math.sqrt(dx * dx + dz * dz) / dt;
    } else sonKonum.current = new Vector3();
    sonKonum.current.copy(dunya.current);

    // `hal` verilmişse o kazanır (oturan müşteri, tezgâhta çalışan çaycı); yoksa hız karar verir.
    const hedef: KayHal = hal ?? (hiz > YURUME_ESIGI ? 'yuru' : 'dur');
    if (hedef === suAn.current) return;
    const yeni: AnimationAction | null = actions[KLIP[hedef]] ?? null;
    const eski: AnimationAction | null = actions[KLIP[suAn.current]] ?? null;
    if (!yeni) return;
    yeni.reset().play();
    if (eski && eski !== yeni) eski.crossFadeTo(yeni, 0.18, false);
    suAn.current = hedef;
  });

  return (
    <group ref={ref} scale={KAY_SCALE}>
      <primitive object={govde} />
    </group>
  );
}

KAY_KLIPLER.forEach((f) => useGLTF.preload(`${KAY_KOK}${f}.glb`));
Object.values(KAY_MODEL).forEach((m) => useGLTF.preload(`${KAY_KOK}${m}.glb`));
