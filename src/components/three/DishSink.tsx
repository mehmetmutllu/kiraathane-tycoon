import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh, MeshStandardMaterial } from 'three';
import { KayTezgah } from './Kitchen';
import { useGame } from '../../game/store';
import { FRONT_TOP_Y, onHatGovdeleri } from './kitchenLook';

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
 * **`tick.ts`E DOKUNULMADI.** Bu tamamen SUNUM katmanıdır (E3 / D-096 deseni): var olan durumu
 * okur, hiçbir yeni durum üretmez. Okunan iki sayı:
 *   - kirli var mı  = katta bekleyen kap + oyuncunun/bulaşıkçının taşıdığı
 *   - `cleanCups`   = yıkanmış kap havuzu; ARTTIĞI an "yıkandı" demektir (bulaşıkçı lavaboya
 *                     vardığında `dishwasherSystem` tam bunu yapıyor)
 * Yeni bir sayaç eklemek yerine var olan korunum değişkenine bağlanması bilinçli: denge
 * dosyalarına dokunmadan döngü kendiliğinden doğru çalışır.
 */

/** Bulaşıklığın tezgâh üstündeki yeri — modelin kendi ayak izinden türer, elle yazılmaz. */
const RACK_Z = -0.1;
/** Parlamanın süresi (sn). Hafif tutuldu: `feedback_visual_polish` — animasyon göze girmez. */
const FLASH = 0.55;

/**
 * Yıkama parlaması: lavabonun üstünde kısa bir su-mavisi halka açılır ve söner.
 * `useFrame` + tek ref — setState YOK (60 fps'te render tetiklenmez).
 */
function Yikama({ tetik }: { tetik: number }) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  const son = useRef(tetik);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (tetik !== son.current) {
      son.current = tetik;
      t.current = FLASH;
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
  // Kirli var mı: kattaki kaplar + oyuncunun tepsisi + bulaşıkçının leğeni.
  const kirli = useGame(
    (s) =>
      s.dishes.length > 0 ||
      s.carriedDirty + s.carriedDirtyFood > 0 ||
      (s.dishwasher ? s.dishwasher.tray + s.dishwasher.trayFood : 0) > 0,
  );
  // Temiz kap havuzu ARTTIĞINDA yıkama olmuştur — ayrı bir olay/sayaç eklemeye gerek yok.
  const temizSayac = useGame((s) => s.cleanCups);
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
      <Yikama tetik={temizSayac} />
    </group>
  );
}
