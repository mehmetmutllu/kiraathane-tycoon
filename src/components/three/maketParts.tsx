/**
 * maketParts.tsx — MAKET v13'ÜN PARÇALARININ BİREBİR TRANSKRİPSİYONU.
 *
 * Kullanıcı kararı (2026-09-07): *"maket artifactiyle birebir istiyorum … boyutlara kadar aynı
 * olmak zorunda"*. Bu dosyanın kuralı tek cümle: **`docs/maket/maket-v13.html`'deki fonksiyon ne
 * yazıyorsa o.** Ölçek çarpanı YOK, "kameraya sığsın diye" kısaltma YOK, yeniden kompozisyon YOK.
 * Bir sayı maketten farklıysa hemen yanında NEDEN farklı olduğu yazar ve sebebi ancak şunlardan
 * biri olabilir: (a) oyunun oynanışa bağlı bir koordinatı (pad/işaret yeri), (b) maketin kendi
 * dosyasında zaten parametre olan bir değer.
 *
 * NEDEN BU DOSYA VAR: B6b'nin ilk denemesinde maketin PROGRAMI alındı ama ölçüleri ×0,72 ile
 * küçültülüp 1,15'lik banda kırpıldı (kabin 2,00 → 1,00 · kapı 1,95 → 0,95 · ayna 1,75 → 0,88).
 * Sonuç kabin gibi değil kanat gibi okundu; kullanıcı reddetti ve iş geri alındı. Ders: maketten
 * TRANSKRİPSİYON yapılır, maketten esinlenilmez.
 *
 * MATERYAL: maket `MeshLambertMaterial` kullanıyor, oyun `meshStandardMaterial`. Renkler ve
 * `flatShading` birebir; materyal sınıfı oyunun ışık kurulumuyla (SceneLights) uyumlu kalsın diye
 * oyununki. Geometri segment sayıları maketin kendi önbelleğinden alındı (küre 10 × 8).
 */
import { BAND, LAVABO } from '../../game/store';

/** Maketin `C` paleti — yalnız bu dosyanın kullandığı girdiler, maketteki hex değerleriyle. */
const MC = {
  wallCream: '#e6d7b8',
  wain: '#6d4c41',
  doorWood: '#5d4037',
  floorTile: '#d9cdb4',
  brass: '#d4af37',
  board: '#2f3a33',
  boardFrame: '#4e342e',
  chalk: '#f3ecd9',
  plant: '#3f7d44',
  plant2: '#2f6b3a',
  planter: '#7a5230',
  sink: '#8d9499',
  wc1: '#d9cdb4',
  porcelain: '#f7f3ea',
  steel: '#b0bec5',
  mirror: '#cfe3ea',
  bin: '#546e7a',
} as const;

/**
 * A/B KABUK YÜKSEKLİĞİ (geçici — kullanıcı iki varyantı da görüp seçecek).
 * A = 2,2: maketin ODA duvarı ("ara duvarlar 2.2 — kamera içeri görsün", maketin kendi yorumu).
 * B = 3,2: maketin BİNA duvarı (`WALL_H`).
 * DEV'de `localStorage.maketShellH` ile değiştirilir; karar verilince sabitlenip bu blok silinir.
 */
const SHELL_H = (() => {
  try {
    const v = Number(localStorage.getItem('maketShellH'));
    return Number.isFinite(v) && v > 0 ? v : 2.2;
  } catch {
    return 2.2;
  }
})();

/** Maketin `wall(x1,z1,x2,z2,h)` fonksiyonu — gövde + lambri kuşağı + üst çıta, birebir. */
export function MaketWall({
  x1,
  z1,
  x2,
  z2,
  h,
}: {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  h: number;
}) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  return (
    <group position={[(x1 + x2) / 2, 0, (z1 + z2) / 2]} rotation={[0, Math.atan2(dx, dz), 0]}>
      <mesh position={[0, 0.9 + (h - 0.9) / 2, 0]}>
        <boxGeometry args={[0.18, h - 0.9, len]} />
        <meshStandardMaterial color={MC.wallCream} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.22, 0.9, len]} />
        <meshStandardMaterial color={MC.wain} />
      </mesh>
      <mesh position={[0, 0.94, 0]}>
        <boxGeometry args={[0.26, 0.08, len]} />
        <meshStandardMaterial color={MC.doorWood} />
      </mesh>
    </group>
  );
}

/** Maketin `sink()` — gövde · tezgâh · çanak · musluk · boru · ayna çerçevesi + camı. Birebir. */
export function MaketSink({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.3, 0.8, 0.6]} />
        <meshStandardMaterial color={MC.wc1} flatShading />
      </mesh>
      <mesh position={[0, 0.83, 0]}>
        <boxGeometry args={[1.36, 0.06, 0.66]} />
        <meshStandardMaterial color="#f1ece0" />
      </mesh>
      <mesh position={[0, 0.9, 0.04]} scale={[1.35, 1, 1]}>
        <cylinderGeometry args={[0.24, 0.19, 0.12, 12]} />
        <meshStandardMaterial color={MC.porcelain} flatShading />
      </mesh>
      <mesh position={[0, 0.98, -0.2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.22, 6]} />
        <meshStandardMaterial color={MC.steel} />
      </mesh>
      <mesh position={[0, 1.08, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.16, 6]} />
        <meshStandardMaterial color={MC.steel} />
      </mesh>
      <mesh position={[0, 1.75, -0.27]}>
        <boxGeometry args={[0.9, 0.7, 0.04]} />
        <meshStandardMaterial color={MC.boardFrame} />
      </mesh>
      <mesh position={[0, 1.75, -0.265]}>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshStandardMaterial color={MC.mirror} />
      </mesh>
    </group>
  );
}

/** Maketin `wcSign()` — koyu plaka + çerçeve + iki beyaz figür. Birebir. */
export function MaketWcSign({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh>
        <boxGeometry args={[0.5, 0.34, 0.04]} />
        <meshStandardMaterial color={MC.board} />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[0.54, 0.38, 0.03]} />
        <meshStandardMaterial color={MC.boardFrame} />
      </mesh>
      {[-0.1, 0.1].map((x, i) => (
        <group key={x}>
          <mesh position={[x, 0.09, 0.03]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color={MC.chalk} />
          </mesh>
          {i ? (
            <mesh position={[x, -0.03, 0.03]}>
              <cylinderGeometry args={[0.03, 0.07, 0.14, 6]} />
              <meshStandardMaterial color={MC.chalk} flatShading />
            </mesh>
          ) : (
            <mesh position={[x, -0.03, 0.03]}>
              <boxGeometry args={[0.06, 0.14, 0.03]} />
              <meshStandardMaterial color={MC.chalk} />
            </mesh>
          )}
          <mesh position={[x - 0.015, -0.13, 0.03]}>
            <boxGeometry args={[0.02, 0.06, 0.02]} />
            <meshStandardMaterial color={MC.chalk} />
          </mesh>
          <mesh position={[x + 0.015, -0.13, 0.03]}>
            <boxGeometry args={[0.02, 0.06, 0.02]} />
            <meshStandardMaterial color={MC.chalk} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Maketin `plant(big)` — saksı + iki yaprak kümesi. Birebir. */
export function MaketPlant({ pos, big = false }: { pos: [number, number, number]; big?: boolean }) {
  const r = big ? 0.34 : 0.24;
  return (
    <group position={pos}>
      <mesh position={[0, big ? 0.25 : 0.18, 0]}>
        <cylinderGeometry args={[r, r * 0.78, big ? 0.5 : 0.36, 10]} />
        <meshStandardMaterial color={MC.planter} flatShading />
      </mesh>
      <mesh position={[0, big ? 0.85 : 0.6, 0]} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[big ? 0.46 : 0.32, 10, 8]} />
        <meshStandardMaterial color={MC.plant} flatShading />
      </mesh>
      <mesh position={[big ? 0.28 : 0.18, big ? 1.2 : 0.85, 0.1]}>
        <sphereGeometry args={[big ? 0.3 : 0.2, 10, 8]} />
        <meshStandardMaterial color={MC.plant2} flatShading />
      </mesh>
    </group>
  );
}

/**
 * Maketin `lavaboBlock(x1, x2, zBack, zFront, doorX)` — arka duvarda dört kabin, doğu duvarında
 * üç lavabo, ön duvarda tek kapı boşluğu; ara duvarlar 2,2 ("kamera içeri görür"), zemin fayans.
 * Maketin çağrısı: `lavaboBlock(4.6, 16.9, -16.87, -9.8, 13.2)`.
 *
 * OYUNA BAĞLI TEK FARK: `doorX` 13,2 değil **13,4** — kapı noktası aynı zamanda pad'in, yükseltme
 * noktasının ve müşterinin hedefi (`LAVABO.spot`) ve o x, masa 12'nin yükseltme noktasına 2,55 br
 * kalsın diye B4a'da ölçülerek seçilmişti. Geri kalan her sayı maketin.
 *
 * `shellH`: binanın arka/yan duvarının yüksekliği (A = 2,2 · B = 3,2). Maket bu duvarları
 * `buildFloor1` içinde ayrı çiziyor (`wall(-17,-17,17,-17)` → `WALL_H` = 3,2); oyunda o duvarlar
 * bandın kütlesiydi, o yüzden burada parametre.
 */
export function MaketLavaboBlock({ shellH = SHELL_H }: { shellH?: number }) {
  const H = 2.2; // maketin lavaboBlock'undaki sabit
  const x1 = BAND.wc.minX; // 4,6 — maketle aynı
  const x2 = 16.9; // maketin çağrısındaki değer (duvarın İÇ yüzü; oyunun FLOOR_HALF'ı 17 = eksen)
  const zBack = -16.87; // maketin çağrısındaki değer
  const zFront = BAND.front; // −9,8 — maketle aynı
  const doorX = LAVABO.door[0]; // 13,4 (oynanışa bağlı; maket 13,2)

  const p0 = x1 + 0.4;
  const zp = zBack + 0.8;
  const zd = zBack + 1.6;

  return (
    <group>
      {/* binanın kabuğu: arka duvar + doğu duvarı (maket bunları buildFloor1'de çiziyor) */}
      <MaketWall x1={x1} z1={zBack} x2={x2} z2={zBack} h={shellH} />
      <MaketWall x1={x2} z1={zBack} x2={x2} z2={zFront} h={shellH} />
      {/* batı duvarı: merdiven kovasıyla ortak (maket: wall(4.6,-16.9,4.6,-9.8, 2.2)) */}
      <MaketWall x1={x1} z1={-16.9} x2={x1} z2={zFront} h={H} />

      {/* ön duvar, kapı boşluğunun iki yanı + lento */}
      <MaketWall x1={x1} z1={zFront} x2={doorX - 0.7} z2={zFront} h={H} />
      <MaketWall x1={doorX + 0.7} z1={zFront} x2={x2} z2={zFront} h={H} />
      <mesh position={[doorX, H - 0.06, zFront]}>
        <boxGeometry args={[1.6, 0.12, 0.3]} />
        <meshStandardMaterial color={MC.doorWood} />
      </mesh>

      {/* fayans zemin (maketin floorPatch'i: 0,2 kalınlığında kutu, üstü y'de) */}
      <mesh position={[(x1 + x2) / 2, 0.012 - 0.1, (zBack + zFront) / 2]}>
        <boxGeometry args={[x2 - x1 - 0.2, 0.2, zFront - zBack - 0.2]} />
        <meshStandardMaterial color="#cfd8dc" />
      </mesh>

      {/* arka duvar boyunca BEŞ bölme, aralarında DÖRT kabin kapısı */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`p${i}`} position={[p0 + i * 1.5, 1.0, zp]}>
          <boxGeometry args={[0.06, 2.0, 1.6]} />
          <meshStandardMaterial color={MC.wain} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => {
        const cx = p0 + 0.75 + i * 1.5;
        const ajar = i === 2; // maket: üçüncü kapı aralık, içeride klozet görünür
        return (
          <group key={`c${i}`}>
            <mesh
              position={ajar ? [cx - 0.2, 0.975, zd + 0.3] : [cx, 0.975, zd]}
              rotation={[0, ajar ? 0.55 : 0, 0]}
            >
              <boxGeometry args={[1.36, 1.95, 0.06]} />
              <meshStandardMaterial color={MC.doorWood} flatShading />
            </mesh>
            <mesh position={[cx + 0.5, 0.95, zd + 0.05]}>
              <sphereGeometry args={[0.03, 10, 8]} />
              <meshStandardMaterial color={MC.brass} />
            </mesh>
            {ajar && (
              <group>
                <mesh position={[cx, 0.2, zBack + 0.65]}>
                  <cylinderGeometry args={[0.2, 0.16, 0.4, 10]} />
                  <meshStandardMaterial color={MC.porcelain} flatShading />
                </mesh>
                <mesh position={[cx, 0.6, zBack + 0.3]}>
                  <boxGeometry args={[0.4, 0.4, 0.18]} />
                  <meshStandardMaterial color={MC.porcelain} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* doğu duvarı boyunca üç lavabo + ortadakinin yanında sabunluk */}
      {[-1.7, 0, 1.7].map((dz, k) => (
        <group key={`s${k}`}>
          <MaketSink pos={[x2 - 0.45, 0, zBack + 2.4 + dz]} rot={-Math.PI / 2} />
          {k === 1 && (
            <mesh position={[x2 - 1.0, 0.9, zBack + 2.4 + dz]}>
              <cylinderGeometry args={[0.05, 0.05, 0.14, 8]} />
              <meshStandardMaterial color="#f1ece0" />
            </mesh>
          )}
        </group>
      ))}

      {/* çöp kovaları, levha, saksı */}
      <mesh position={[x2 - 1.2, 0.18, zBack + 0.7]}>
        <cylinderGeometry args={[0.14, 0.12, 0.36, 8]} />
        <meshStandardMaterial color={MC.bin} />
      </mesh>
      <mesh position={[doorX - 1.4, 0.18, zFront - 0.6]}>
        <cylinderGeometry args={[0.14, 0.12, 0.36, 8]} />
        <meshStandardMaterial color={MC.bin} />
      </mesh>
      <MaketWcSign pos={[doorX - 1.3, 1.85, zFront + 0.16]} />
      <MaketPlant pos={[doorX + 1.5, 0, zFront - 0.7]} />
    </group>
  );
}
