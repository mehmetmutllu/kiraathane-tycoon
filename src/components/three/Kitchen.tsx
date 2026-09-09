import { Model } from './Model';
import { PALETTE } from '../../config/palette';
import {
  BACK_Z,
  KITCHEN_S,
  KITCHEN_UNITS,
  LEFT_X,
  MODULE_W,
  NATIVE,
  RAF_MODULLERI,
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
      <Model src={src(u.key)} scale={olcek} position={[0, u.y ?? 0, 0]} fallback={yedek(u.key, olcek)} />
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
  topY,
  fallback,
}: {
  model: KitchenKey;
  w: number;
  d: number;
  topY: number;
  fallback: React.ReactNode;
}) {
  const t = kayGovde(model, w, d, topY);
  return (
    <Model src={src(model)} scale={t.scale} position={t.position} rotation={t.rotation} fallback={fallback} />
  );
}

/**
 * Çay bardağı rafları (elle çizili `MaketWallShelf`) hattın ORTASINDAKİ iki modülün üstünde
 * kalır: kıraathanenin okunan işareti ince belli bardak dizisidir, KayKit dolabı değil.
 * Duvar dolapları bu yüzden 1. ve 5. modüle asılı (`kitchenLook.KITCHEN_UNITS`).
 */
function Raflar() {
  return (
    <group>
      {RAF_MODULLERI.map((k) => (
        <MaketWallShelf key={k} w={MODULE_W - 0.2} pos={[modulX(k), 1.95, BACK_Z + 0.02]} />
      ))}
      {/* batı duvarı: soğutucunun önündeki boş yüzey */}
      <MaketWallShelf w={2.0} pos={[LEFT_X + 0.06, 1.95, -13.6]} rot={Math.PI / 2} />
    </group>
  );
}

export function Kitchen() {
  return (
    <group>
      {KITCHEN_UNITS.map((u, i) => (
        <Unite key={`${u.key}-${i}`} u={u} />
      ))}
      <Raflar />
    </group>
  );
}
