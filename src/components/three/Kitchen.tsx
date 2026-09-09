import { Merged, useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh } from 'three';
import { useSandbox } from '../../game/devSandbox';
import { gozDegistir } from './atlasUV';
import { Model } from './Model';
import { PALETTE } from '../../config/palette';
import { useGame } from '../../game/store';
import {
  BACK_Z,
  KITCHEN_S,
  KITCHEN_UNITS,
  MODULE_W,
  NATIVE,
  RAF_MODULLERI,
  FLOOR_KALINLIK,
  fayansKarolari,
  floorKaroModel,
  temaNative,
  zeminEsleme,
  kayGovde,
  modulX,
  type KitchenKey,
  type KitchenUnit,
} from './kitchenLook';
import {
  MaketCezveStation,
  MaketCounter,
  MaketCrates,
  MaketDishSink,
  MaketWallShelf,
  MaketWaterRack,
} from './maketParts';

/**
 * Kitchen.tsx — SERVİS KÖŞESİ, KayKit restaurant-bits ile (S3).
 *
 * NEDEN AYRI DOSYA: mutfak `Scene.tsx`in bant bloğunun içinde yazılıydı; oda 6 parçadan 15
 * üniteye çıkınca orada kalmaya devam etmesi Scene'i şişiriyordu. Ölçü `kitchenLook.ts`te,
 * çizim burada, ikisi de tek konudan sorumlu.
 *
 * SAYI YOK: bu dosyada tek bir koordinat yazılı değil — hepsi `KITCHEN_UNITS`ten okunur ve
 * `tests/kitchen-look.test.ts` orayı bekçiliyor. Buraya elle koordinat yazmak bekçiyi kör eder.
 *
 * GREYBOX-FIRST (CLAUDE.md): her ünite `Model` ile yüklenir, `.gltf` gelmezse ilkel şekle düşer.
 * Karşılığı olan maket parçaları YEDEK olarak duruyor — silinmediler, fallback oldular.
 */

const KAY = '/assets/models/kaykit-restaurant-bits/';

/** Ünitenin greybox yedeği — modelin KENDİ ham ölçüsünden kutu (elle boyut yazılmaz). */
function Kutu({ model, renk, olcek = KITCHEN_S }: { model: KitchenKey; renk: string; olcek?: number }) {
  const n = NATIVE[model];
  return (
    <mesh
      castShadow
      receiveShadow
      position={[0, (n.minY + n.h / 2) * olcek, ((n.minZ + n.maxZ) / 2) * olcek]}
    >
      <boxGeometry args={[n.w * olcek, n.h * olcek, (n.maxZ - n.minZ) * olcek]} />
      <meshStandardMaterial color={renk} flatShading />
    </mesh>
  );
}

/** Modeli olmayan/yüklenmeyen ünitenin yerine ne çizilir. */
function yedek(key: KitchenKey, olcek = KITCHEN_S) {
  switch (key) {
    case 'kitchencounter_straight_A_backsplash':
    case 'kitchencounter_straight_B_backsplash':
      return <MaketCounter len={MODULE_W} pos={[0, 0, 0]} />;
    case 'kitchencounter_sink_backsplash':
      return <MaketDishSink pos={[0, 0, 0]} />;
    case 'stove_multi':
      return <MaketCezveStation pos={[0, 0, 0]} />;
    case 'crate':
    case 'crate_potatoes':
    case 'crate_lid':
      return <MaketCrates pos={[0, 0, 0]} />;
    case 'waterRack':
      return <MaketWaterRack pos={[0, 0, 0]} />;
    case 'fridge_A':
    case 'extractorhood':
      return <Kutu model={key} renk={PALETTE.griddle} olcek={olcek} />;
    case 'oven':
      return <Kutu model={key} renk={PALETTE.griddleLid} olcek={olcek} />;
    case 'kitchencabinet':
      return <Kutu model={key} renk={PALETTE.tableWood} olcek={olcek} />;
    default:
      return <Kutu model={key} renk={PALETTE.plate} olcek={olcek} />;
  }
}

/** Damacana rafının KayKit karşılığı yok — o ünite hep yedeğiyle (elle çizili) gelir. */
const src = (key: KitchenKey): string | undefined => (key === 'waterRack' ? undefined : `${KAY}${key}.gltf`);

function Unite({ u }: { u: KitchenUnit }) {
  const olcek = u.olcek ?? KITCHEN_S;
  return (
    <group position={[u.x, 0, u.z]} rotation={[0, (u.ceyrek * Math.PI) / 2, 0]}>
      <Model
        src={src(u.key)}
        scale={olcek}
        position={[0, u.y ?? 0, 0]}
        fallback={yedek(u.key, olcek)}
      />
    </group>
  );
}

/**
 * ÖN HATTIN GÖVDESİ — oyunun işleyen tezgâhları (çay ocağı · garson istasyonu · bulaşık).
 * Model, o tezgâhın COLLISION kutusuna çekilir (`kayGovde`); üstündeki eşyalar (semaver,
 * bardaklar, sürahiler) çağıran tarafta, kendi yerlerinde kalır.
 */
export function KayTezgah({
  model,
  w,
  d,
  dx = 0,
  topY,
  fallback,
}: {
  model: KitchenKey;
  w: number;
  d: number;
  /** Gövdenin ünitenin kendi merkezine göre x kayması — ön hat birleşirken doğar (S4). */
  dx?: number;
  topY: number;
  fallback: React.ReactNode;
}) {
  const t = kayGovde(model, w, d, topY);
  return (
    <Model
      src={src(model)}
      scale={t.scale}
      position={[t.position[0] + dx, t.position[1], t.position[2]]}
      rotation={t.rotation}
      fallback={fallback}
    />
  );
}

/**
 * Çay bardağı rafları (elle çizili `MaketWallShelf`) hattın ORTASINDAKİ iki modülün üstünde
 * kalır: kıraathanenin okunan işareti ince belli bardak dizisidir, KayKit dolabı değil.
 * Duvar dolapları bu yüzden 1. ve 5. modüle asılı (`kitchenLook.KITCHEN_UNITS`).
 *
 * S4: BATI duvarındaki üçüncü raf KALDIRILDI (kullanıcı 2026-09-09: *"3 farklı yerde bardaklık
 * var; arka duvardakiler kalabilir ama soldaki duvarda olan kalksın, zaten onun yerine peçetelik
 * gelir"*). O duvar artık paketin peçetelik rafı ve havluluğunun yeri.
 */
function Raflar() {
  return (
    <group>
      {RAF_MODULLERI.map((k) => (
        <MaketWallShelf key={k} w={MODULE_W - 0.2} pos={[modulX(k), 1.95, BACK_Z + 0.02]} />
      ))}
    </group>
  );
}

/**
 * MUTFAK ZEMİNİ — KayKit karosu (S4).
 *
 * İKİ KOL AÇIK (kullanıcı 2026-09-09): karo boyu `kucuk` (1,60) ↔ `buyuk` (3,20) ve ton
 * `native` (paketin siyah-beyazı) ↔ `kahve`. Karşılaştırma karesi tek koddan çekilsin diye
 * kollar `devSandbox`ta duruyor; seçim yapılınca kazanan kalır, diğeri silinir.
 *
 * TON NASIL UYGULANIYOR: atlas kopyası ÇIKARILMADI. Karo tek materyalli ve `meshStandardMaterial`
 * `color` değeri dokuyla ÇARPILIR — yani beyaz karo doğrudan verilen tona boyanır, siyah karo
 * koyu kalır. Deseni koruyan, bellek maliyeti sıfır olan yol bu. (Atlas kopyası `recolor.ts`
 * hattıdır ve mobilya minderi gibi TEK BİR rengi ayıklamak gerektiğinde şarttır; burada değil.)
 *
 * Yerleşim `kitchenLook.fayansKarolari()`ten gelir — buraya koordinat yazılmaz.
 * `<Merged>`: 40 karo tek draw-call.
 */
/** gltf sahnesindeki ilk mesh. */
function ilkMesh(o: { traverse: (f: (c: object) => void) => void }): Mesh | null {
  const bulunan: Mesh[] = [];
  o.traverse((c) => {
    if (bulunan.length === 0 && (c as Mesh).isMesh) bulunan.push(c as Mesh);
  });
  return bulunan[0] ?? null;
}

/**
 * Modeli temanın gözlerine taşınmış bir KOPYAYLA döndürür. Tema `klasik` ise orijinal döner
 * (klonlama yok). Orijinal geometriye asla dokunulmaz — aynı model başka yerde doğal rengiyle
 * kullanılabilsin.
 */
function temali(mesh: Mesh | null, esleme: ReturnType<typeof zeminEsleme>, native: boolean): Mesh | null {
  if (!mesh || native) return mesh;
  const kopya = mesh.clone();
  kopya.geometry = gozDegistir(mesh.geometry, esleme);
  return kopya;
}

function Fayans() {
  const karo = useSandbox((s) => s.fayansKaro);
  const tema = useGame((s) => s.kitchenTheme);
  const gltf = useGLTF(`${KAY}${floorKaroModel(karo)}.gltf`);
  const mesh = useMemo(
    () => temali(ilkMesh(gltf.scene), zeminEsleme(tema), temaNative(tema)),
    [gltf, tema],
  );
  const karolar = useMemo(() => fayansKarolari(karo), [karo]);
  if (!mesh) return null;
  return (
    <Merged meshes={{ karo: mesh }} frustumCulled={false}>
      {(comps) => {
        const C = comps.karo;
        if (!C) return null;
        return (
          <>
            {karolar.map((k, i) => (
              <C key={i} position={[k.x, -FLOOR_KALINLIK + 0.02, k.z]} scale={k.scale} receiveShadow />
            ))}
          </>
        );
      }}
    </Merged>
  );
}

export function Kitchen() {
  return (
    <group>
      {/* Zemin DUVAR KİPİNDEN BAĞIMSIZ: duvar denemesi reddedildi ama karo zemin kullanıcı
          tarafından beğenildi (2026-09-09) — ikisi ayrı karar, ayrı anahtar. */}
      <Fayans />
      {KITCHEN_UNITS.map((u, i) => (
        <Unite key={`${u.key}-${i}`} u={u} />
      ))}
      <Raflar />
    </group>
  );
}
