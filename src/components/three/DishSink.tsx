import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { KayTezgah } from './Kitchen';
import { useGame } from '../../game/store';
import { sinkDirty } from '../../game/rules';
import { FRONT_TOP_Y, onHatGovdeleri } from './kitchenLook';
import { CarriedDirty } from './carriedDirty';

/**
 * DishSink.tsx — BULAŞIK NOKTASI (S4).
 *
 * Kullanıcı 2026-09-09 üç şey istedi ve üçü de aynı pakette çıktı:
 *  ① *"kenarında bulaşık dizmek için olan"* → `kitchentable_sink_large`: ayaklı (altı açık),
 *     süzgeç kenarlı lavabo masası. Çalışma yüzeyi yine native 1,0'da, o yüzden `kayGovde`nin
 *     tabla varsayımı bozulmuyor ve üstündeki hiçbir eşya yer değiştirmiyor.
 *  ② *"kendinden bulaşıklı ve bulaşıksız hâli olan assetler var"* → paket bu ikisini KARDEŞ
 *     veriyor: `kitchentable_sink_large` ↔ `kitchentable_sink_large_decorated`. Aynı gövde,
 *     aynı ayak izi; tek fark üstteki bulaşık istifi (1,802 → 1,947). Yani boş↔dolu geçişi bir
 *     yer değiştirme değil, tek modelin değişmesi — ayrı bir bulaşıklık koymaya gerek yok.
 *  ③ *"millet bulaşık getirince oto kirlenir, NPC gelince bir efektle temiz olur, döngü devam eder"*
 *     → aşağıdaki `yikandi` parlaması.
 *
 * SUNUM katmanı: var olan durumu okur, hiçbir durum üretmez. Okunan iki şey:
 *   - kirli var mı  = TEZGÂHA GELEN ya da LEĞENDE bekleyen kap (`sinkDirty`, G-70 · D-143).
 *   - `legen`       = leğende biriken kirliler (D-143, toplu yıkama). Yığın sayıyla büyür; leğen
 *                     BOŞALDIĞI an "yıkandı" demektir — parlama o anda patlar.
 */

/** Bulaşıklığın tezgâh üstündeki yeri — modelin kendi ayak izinden türer, elle yazılmaz. */
const RACK_Z = -0.1;
/** Leğen yığınında çizilen en çok kap (iki sıra × 4). */
const LEGEN_GORUNEN = 8;
/** Parlamanın süresi (sn). Hafif tutuldu: `feedback_visual_polish` — animasyon göze girmez. */
const FLASH = 0.55;

/**
 * Yıkama parlaması: lavabonun üstünde kısa bir su-mavisi halka açılır ve söner.
 * `useFrame` + tek ref — setState YOK (60 fps'te render tetiklenmez).
 */
function Yikama({ bekleyen }: { bekleyen: number }) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  const son = useRef(bekleyen);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    // Leğen dolu → boş: toplu yıkama oldu (D-143).
    if (bekleyen !== son.current) {
      if (son.current > 0 && bekleyen === 0) t.current = FLASH;
      son.current = bekleyen;
    }
    if (t.current <= 0) {
      if (g.visible) g.visible = false;
      return;
    }
    t.current = Math.max(0, t.current - dt);
    const k = t.current / FLASH; // 1 → 0
    g.visible = true;
    const s = 0.35 + (1 - k) * 0.55;
    g.scale.set(s, 1, s);
    g.position.y = FRONT_TOP_Y + 0.12 + (1 - k) * 0.22;
    const mesh = g.children[0] as Mesh | undefined;
    const mat = mesh?.material as MeshStandardMaterial | undefined;
    if (mat) mat.opacity = k * 0.75;
  });
  return (
    <group ref={ref} visible={false} position={[0, FRONT_TOP_Y + 0.12, RACK_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.34, 20]} />
        <meshStandardMaterial color="#7fc7e8" transparent opacity={0.7} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Bulaşık noktası. `pos`/`rot` yerleşimden gelir (`servicePlace`), buraya koordinat yazılmaz.
 */
export function DishSink({ pos, rot, areasOpen }: { pos: readonly [number, number, number]; rot: number; areasOpen: number }) {
  const govde = onHatGovdeleri(areasOpen).dish;
  // Kirli var mı / gövdenin sahnede olup olmadığı: ikisi de `rules.ts`teki saf yüklemlerden
  // (`sinkDirty` · `dishStationVisible`). Gerekçe orada, tek yerde — G-69/G-70, 2026-09-18.
  const kirli = useGame(sinkDirty);
  const bardak = useGame((s) => s.legen.bardak);
  const tabak = useGame((s) => s.legen.tabak);
  // Boş ↔ dolu: paketin KARDEŞ modelleri. Ayrı bir bulaşıklık koymuyoruz — kullanıcı
  // *"kendinden bulaşıklı ve bulaşıksız hâli olan"* asseti istedi, o yüzden gövdenin kendisi değişir.
  const model = kirli ? 'kitchentable_sink_large_decorated' : 'kitchentable_sink_large';
  return (
    <group position={[pos[0], 0, pos[2]]} rotation={[0, rot, 0]}>
      {/* GÖVDE: altı açık lavabo masası. Modelin z aralığı 2,0, collision kutusu 0,8 →
          `kayGovde` modeli kutuya çeker (S3'te ölçülen dönüşüm, aynen). */}
      <KayTezgah
        model={model}
        w={govde.w}
        d={govde.d}
        dx={govde.dx}
        topY={FRONT_TOP_Y}
        fallback={
          <group>
            <mesh castShadow receiveShadow position={[govde.dx, 0.45, 0]}>
              <boxGeometry args={[govde.w, 0.9, govde.d]} />
              <meshStandardMaterial color="#607d8b" />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <boxGeometry args={[1.0, 0.12, 0.5]} />
              <meshStandardMaterial color="#90a4ae" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        }
      />
      {/* LEĞENDEKİ YIĞIN (D-143): kullanıcının *"birkaç tane bıraktıktan sonra"*sı — sayıyla büyür,
          toplu yıkamada bir anda boşalır. Taşınan kirlinin çizimi ortak (`CarriedDirty`), en çok 8. */}
      <group position={[govde.dx - govde.w / 2 + 0.35, FRONT_TOP_Y - 0.93, -0.3]}>
        <CarriedDirty cups={Math.min(bardak, LEGEN_GORUNEN)} plates={Math.min(tabak, Math.max(0, LEGEN_GORUNEN - bardak))} />
      </group>
      <Yikama bekleyen={bardak + tabak} />
    </group>
  );
}
