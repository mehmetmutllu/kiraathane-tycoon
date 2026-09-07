import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshStandardMaterial } from 'three';
import { PALETTE } from '../../config/palette';
import { decorItems, type DecorItem } from '../../config/decor';
import { useGame } from '../../game/store';

/**
 * Decor.tsx — B6a'nın ÇİZİM tarafı. Ne çizileceği burada, NEREYE çizileceği `config/decor.ts`te.
 * İkisi bilerek ayrı (D-068 §3): yerleşim varyantı denemek için tek veri dosyası değişir, bu
 * dosya sabit kalır; çizim varyantı denemek içinse tersi.
 *
 * Hepsi SALT GÖRSEL: hiçbiri collision/nav listesine girmez, oyuncu içinden geçer. Bu bilinçli —
 * dekor engel olursa "görünmez duvar" hissi doğar (M2 dersi) ve her prop bir nav regresyonu
 * riskine dönüşür.
 *
 * ÖLÇEK: maketin düşey ölçüleri ×0,72 (bkz. `config/decor.ts` başlığı). Duvara asılan her şey
 * lambri çıtası (0,54) ile kartonpiyer (1,15) arasındaki banda sığar.
 *
 * YÖN: her parça yerel +z'ye BAKAR. Sol duvar +π/2 · sağ duvar −π/2 · ön duvar π.
 */

// ---- zemin parçaları ----

/** Saksı — mevcut iç mekân saksısının aynısı (B6a'da `DecorProps`ten buraya taşındı), `big` ile büyür. */
function Saksi({ big }: { big: boolean }) {
  const s = big ? 1.25 : 1;
  return (
    <group scale={s}>
      <mesh castShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.44, 8]} />
        <meshStandardMaterial color={PALETTE.planter} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.24, 8, 8]} />
        <meshStandardMaterial color={PALETTE.plant} flatShading />
      </mesh>
      <mesh castShadow position={[0.13, 0.76, 0.06]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color={PALETTE.plantAlt} flatShading />
      </mesh>
    </group>
  );
}

/** Çöp kovası — kapı yanında kuşaklı, servis ucunda küçük ve kuşaksız (eski `DecorProps` deseni). */
function CopKovasi({ rings, scale }: { rings: boolean; scale: number }) {
  return (
    <group scale={scale}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.16, 0.6, 12]} />
        <meshStandardMaterial color={PALETTE.trashBody} metalness={0.3} roughness={0.6} />
      </mesh>
      {rings
        ? [0.14, 0.32, 0.5].map((h) => (
            <mesh key={h} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.187, 0.008, 6, 14]} />
              <meshStandardMaterial color={PALETTE.trashLid} />
            </mesh>
          ))
        : null}
      <mesh castShadow position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.06, 12]} />
        <meshStandardMaterial color={PALETTE.trashLid} metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Portmanto: taban + gövde + dört kol + tepe topuzu + asılı ceket. Boy 1,35 (karakter hizası). */
function Askilik() {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.2, 0.23, 0.05, 10]} />
        <meshStandardMaterial color={PALETTE.doorWood} />
      </mesh>
      <mesh castShadow position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 1.3, 8]} />
        <meshStandardMaterial color={PALETTE.doorWood} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.11, 1.22, -Math.sin(a) * 0.11]} rotation={[0, a, 0.35]}>
            <boxGeometry args={[0.22, 0.035, 0.035]} />
            <meshStandardMaterial color={PALETTE.doorWood} />
          </mesh>
        );
      })}
      <mesh castShadow position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* asılı ceket: askılık "kullanılıyor" görünsün diye (boş portmanto mobilya, dolu olan
          mekân). Dar ve gövdeye yakın — ilk deneme 0,30 genişti ve tepeden bakışta direğe
          çakılmış koyu bir BAYRAK gibi okunuyordu. */}
      <mesh castShadow position={[0.11, 0.9, 0.02]}>
        <boxGeometry args={[0.22, 0.44, 0.15]} />
        <meshStandardMaterial color={PALETTE.coat} flatShading />
      </mesh>
      <mesh castShadow position={[0.11, 1.13, 0.02]}>
        <boxGeometry args={[0.14, 0.12, 0.12]} />
        <meshStandardMaterial color={PALETTE.coatAlt} flatShading />
      </mesh>
    </group>
  );
}

/** Gazete/dergi sehpası: iki dikme + üç eğik raf + üstlerinde gazeteler. Boy 0,86. */
function Gazetelik() {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.4]} />
        <meshStandardMaterial color={PALETTE.doorWood} />
      </mesh>
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} castShadow position={[x, 0.45, -0.15]}>
          <boxGeometry args={[0.05, 0.86, 0.05]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.28 + i * 0.26, 0]} rotation={[0.5, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.54, 0.03, 0.28]} />
            <meshStandardMaterial color={PALETTE.tableWood} flatShading />
          </mesh>
          <mesh position={[0, 0.03, 0.02]}>
            <boxGeometry args={[0.44, 0.02, 0.24]} />
            <meshStandardMaterial color={PALETTE.paper} />
          </mesh>
          <mesh position={[0, 0.045, -0.07]}>
            <boxGeometry args={[0.42, 0.01, 0.07]} />
            <meshStandardMaterial color={PALETTE.mustache} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Ayaklı lamba: taban diski + ince bakır gövde + konik abajur + içinde ampul. Boy 1,45. */
function AyakliLamba() {
  return (
    <group>
      <mesh castShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.05, 12]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 1.15, 8]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 1.29, 0]}>
        <cylinderGeometry args={[0.14, 0.26, 0.32, 12, 1, true]} />
        <meshStandardMaterial color={PALETTE.lampShade} flatShading side={2} />
      </mesh>
      <mesh position={[0, 1.19, 0]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={PALETTE.lampGlow} emissive={PALETTE.lampGlow} emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

/** Kapı paspası: dokuma yüzey + koyu kenar. Zemine yapışık (y 0,012 → GroundMarker'ın altında). */
function Paspas() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 1.2]} />
        <meshStandardMaterial color={PALETTE.doormatEdge} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[2.5, 0.96]} />
        <meshStandardMaterial color={PALETTE.doormat} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
      {/* üç hasır çizgisi: düz dikdörtgen zeminde "koyu leke" okunuyordu, çizgi onu DOKUMA yapıyor */}
      {[-0.62, 0, 0.62].map((x) => (
        <mesh key={x} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.004, 0]}>
          <planeGeometry args={[0.1, 0.9]} />
          <meshStandardMaterial color={PALETTE.doormatEdge} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
        </mesh>
      ))}
    </group>
  );
}

// ---- duvara asılanlar (hepsi yerel +z'ye bakar) ----

/** Çerçeveli tablo. */
function Tablo({ len, h }: { len: number; h: number }) {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[len, h, 0.05]} />
        <meshStandardMaterial color={PALETTE.menuBoardFrame} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <boxGeometry args={[len - 0.1, h - 0.1, 0.01]} />
        <meshStandardMaterial color={PALETTE.pictureArt} />
      </mesh>
    </group>
  );
}

/** Duvar saati (eski `DecorProps` saati; yalnız asma yüksekliği duvarın içine indi). */
function DuvarSaati() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
        <meshStandardMaterial color={PALETTE.wainscot} />
      </mesh>
      <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
        <meshStandardMaterial color="#f4efe2" />
      </mesh>
      <mesh position={[0, 0.04, 0.045]}>
        <boxGeometry args={[0.015, 0.09, 0.01]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[0.03, 0, 0.045]} rotation={[0, 0, -Math.PI / 3]}>
        <boxGeometry args={[0.012, 0.07, 0.01]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
    </group>
  );
}

/** Aplik: bakır plaka + kol + sarı küre. Işık KAYNAĞI değil (perf); yalnız emissive küre. */
function Aplik() {
  return (
    <group>
      <mesh castShadow position={[0, 0.05, 0.02]}>
        <boxGeometry args={[0.13, 0.22, 0.04]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.45} roughness={0.5} />
      </mesh>
      {/* kol UZUN: yan duvar profilden görünüyor, odaya taşmayan aplik hiç okunmuyor */}
      <mesh position={[0, 0.14, 0.16]}>
        <boxGeometry args={[0.04, 0.04, 0.3]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0.31]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color={PALETTE.lampGlow} emissive={PALETTE.lampGlow} emissiveIntensity={0.75} />
      </mesh>
      <mesh position={[0, 0.16, 0.31]}>
        <cylinderGeometry args={[0.025, 0.1, 0.08, 8]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.45} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Duvar boyu askı rayı: ahşap ray + pirinç kancalar + asılı ceket/şapka. */
function AskiRayi({ len }: { len: number }) {
  const n = Math.max(2, Math.round(len / 0.7));
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[len, 0.1, 0.07]} />
        <meshStandardMaterial color={PALETTE.doorWood} />
      </mesh>
      <mesh position={[0, 0.07, 0.03]}>
        <boxGeometry args={[len, 0.04, 0.12]} />
        <meshStandardMaterial color={PALETTE.wainscot} />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const x = -len / 2 + 0.35 + (i * (len - 0.7)) / (n - 1);
        return (
          <mesh key={i} position={[x, -0.09, 0.06]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshStandardMaterial color={PALETTE.brass} metalness={0.5} roughness={0.4} />
          </mesh>
        );
      })}
      <mesh castShadow position={[-len / 2 + 0.75, -0.32, 0.09]}>
        <boxGeometry args={[0.32, 0.5, 0.13]} />
        <meshStandardMaterial color={PALETTE.coat} flatShading />
      </mesh>
      <mesh castShadow position={[len / 2 - 0.95, -0.3, 0.09]}>
        <boxGeometry args={[0.28, 0.46, 0.12]} />
        <meshStandardMaterial color={PALETTE.coatAlt} flatShading />
      </mesh>
      <mesh position={[len / 2 - 0.3, -0.14, 0.1]} rotation={[1.35, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 12]} />
        <meshStandardMaterial color={PALETTE.cap} />
      </mesh>
    </group>
  );
}

/**
 * KONSOL / BÜFE — duvara YASLANIR ama zemine oturur (Fable'ın A maddesi): 45°'lik kamera bir
 * dolabın ÜST YÜZEYİNİ, 0,6 birimlik duvar şeridinden çok daha iyi okuyor. Üstünde radyo, ters
 * bardak tepsisi ve küçük saksı — "kullanılan mobilya", boş tabla değil.
 */
function Konsol({ len }: { len: number }) {
  const H = 0.72;
  const D = 0.44;
  return (
    <group>
      {/* gövde + tabla + süpürgelik payı */}
      <mesh castShadow position={[0, H / 2 - 0.05, D / 2]}>
        <boxGeometry args={[len, H - 0.1, D]} />
        <meshStandardMaterial color={PALETTE.counterWood} flatShading />
      </mesh>
      <mesh castShadow position={[0, H, D / 2]}>
        <boxGeometry args={[len + 0.08, 0.06, D + 0.06]} />
        <meshStandardMaterial color={PALETTE.tableWood} flatShading />
      </mesh>
      {/* iki kapak çıtası — düz kutu "kutu" kalıyordu, çıta onu MOBİLYA yapıyor */}
      {[-len / 4, len / 4].map((x) => (
        <mesh key={x} position={[x, H / 2 - 0.05, D + 0.015]}>
          <boxGeometry args={[len / 2 - 0.14, H - 0.28, 0.03]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
      ))}
      {[-len / 4, len / 4].map((x) => (
        <mesh key={`k${x}`} position={[x, H / 2 - 0.05, D + 0.05]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial color={PALETTE.brass} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* üstü: radyo · bardak tepsisi · saksı */}
      <mesh castShadow position={[-len / 2 + 0.55, H + 0.14, D / 2]}>
        <boxGeometry args={[0.46, 0.22, 0.24]} />
        <meshStandardMaterial color={PALETTE.wainscot} flatShading />
      </mesh>
      <mesh position={[-len / 2 + 0.45, H + 0.14, D / 2 + 0.13]}>
        <cylinderGeometry args={[0.07, 0.07, 0.02, 10]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, H + 0.05, D / 2]}>
        <boxGeometry args={[0.5, 0.03, 0.3]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.45} roughness={0.45} />
      </mesh>
      {[-0.16, 0, 0.16].map((x) => (
        <mesh key={x} position={[x, H + 0.11, D / 2]}>
          <cylinderGeometry args={[0.045, 0.058, 0.1, 8]} />
          <meshStandardMaterial color="#dfe6ea" />
        </mesh>
      ))}
      <mesh castShadow position={[len / 2 - 0.5, H + 0.13, D / 2]}>
        <cylinderGeometry args={[0.12, 0.1, 0.18, 10]} />
        <meshStandardMaterial color={PALETTE.planter} />
      </mesh>
      <mesh castShadow position={[len / 2 - 0.5, H + 0.3, D / 2]}>
        <sphereGeometry args={[0.17, 8, 8]} />
        <meshStandardMaterial color={PALETTE.plant} flatShading />
      </mesh>
    </group>
  );
}

/** Şemsiyelik: silindir kova + iki şemsiye sapı (kapının bir yanı; askılık öbür yanı). */
function Semsiyelik() {
  return (
    <group>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.17, 0.15, 0.6, 10]} />
        <meshStandardMaterial color={PALETTE.copper} metalness={0.4} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.61, 0]}>
        <cylinderGeometry args={[0.175, 0.175, 0.04, 10]} />
        <meshStandardMaterial color={PALETTE.wainscot} />
      </mesh>
      {([[-0.05, 0.1, PALETTE.coat], [0.06, -0.06, PALETTE.plant]] as const).map(([dx, dz, c], i) => (
        <group key={i} position={[dx, 0, dz]} rotation={[0.12 * (i ? -1 : 1), 0, 0.14 * (i ? 1 : -1)]}>
          <mesh castShadow position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.86, 8]} />
            <meshStandardMaterial color={c} flatShading />
          </mesh>
          <mesh position={[0, 1.06, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 6]} />
            <meshStandardMaterial color={PALETTE.doorWood} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Pencere altı peteği (a1 kimliği: "cam kenarı ısınır"). Dilimli ön yüz + iki bağlantı. */
function Petek({ len }: { len: number }) {
  const n = Math.max(4, Math.round(len / 0.34)); // dilim aralığı: 0,18 iken 9 mesh oluyordu
  return (
    <group>
      <mesh castShadow position={[0, 0.3, 0.1]}>
        <boxGeometry args={[len, 0.5, 0.12]} />
        <meshStandardMaterial color="#e4e0d6" />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-len / 2 + 0.09 + (i * (len - 0.18)) / (n - 1), 0.3, 0.17]}>
          <boxGeometry args={[0.05, 0.44, 0.03]} />
          <meshStandardMaterial color="#cfcabb" />
        </mesh>
      ))}
      {[-len / 2 + 0.1, len / 2 - 0.1].map((x) => (
        <mesh key={x} position={[x, 0.06, 0.05]}>
          <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
          <meshStandardMaterial color={PALETTE.trashLid} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Denizlik saksısı: pencere eşiğine oturan minik çiçek. */
function DenizlikSaksi() {
  return (
    <group>
      <mesh castShadow position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.09, 0.07, 0.14, 8]} />
        <meshStandardMaterial color="#a5563a" />
      </mesh>
      <mesh castShadow position={[0, 0.19, 0]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial color={PALETTE.plantAlt} flatShading />
      </mesh>
      <mesh position={[0.05, 0.26, 0.03]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#d4646a" flatShading />
      </mesh>
    </group>
  );
}

/**
 * PENCERE — "cam kenarı"nın tek görsel kanıtı, ama ÖLÇÜLEREK yeniden kuruldu.
 *
 * İlk deneme maketin penceresini birebir küçültmüştü (koyu ahşap doğrama + yarı saydam cam) ve
 * oyunda **hiç okunmadı**: kamera yatayda tam −z'ye baktığı için z ekseninde uzanan yan duvarlar
 * neredeyse PROFİLDEN görünüyor; duvar yüzü ince bir dilime iniyor, 0,09 derinliğindeki koyu
 * doğrama ise camın önünü tamamen kapatıyor. Ekran görüntüsünde sağ duvar "koyu kahve dikey
 * çubuklar" oluyordu (`b6a-pencere-yakin.png`).
 *
 * Bu yüzden pencere üç sinyale bölündü ve üçü de kameranın GERÇEKTEN gördüğü yerlere kondu:
 *  1. **Derin denizlik** — odaya 0,30 taşar; 45°'lik kamera onun ÜST YÜZEYİNİ görür. Saksı da
 *     buraya oturur.
 *  2. **AÇIK doğrama** — koyu ahşap yerine duvarın açık çıta tonu; ince (0,04) ve az taşar,
 *     böylece camı kapatmaz. Cam da hafif emissive: gündüz ışığı içeri giriyor.
 *  3. **Duvar tepesinde lento kapağı** — duvarın ÜST bandı bu kadrajda geniş ve okunur bir
 *     yüzey; pencerenin oradan da işaretlenmesi "duvarda açıklık var" bilgisini profilden bile
 *     verir.
 */
function Pencere({ len, h, capY }: { len: number; h: number; capY: number }) {
  const t = 0.05;
  return (
    <group>
      {/* cam: krem duvarın önünde açık mavi, hafif ışıklı (dışarısı gündüz) */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[len - 2 * t, h - 2 * t, 0.02]} />
        <meshStandardMaterial
          color={PALETTE.glass}
          emissive={PALETTE.glass}
          emissiveIntensity={0.28}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* doğrama: AÇIK ton, ince — camı kapatmasın */}
      {([
        [0, h / 2 - t / 2, len, t],
        [0, -h / 2 + t / 2, len, t],
      ] as const).map(([x, y, w, hh], i) => (
        <mesh key={`h${i}`} position={[x, y, 0.03]}>
          <boxGeometry args={[w, hh, 0.05]} />
          <meshStandardMaterial color={PALETTE.windowSash} />
        </mesh>
      ))}
      {[-len / 2 + t / 2, len / 2 - t / 2].map((x) => (
        <mesh key={x} position={[x, 0, 0.03]}>
          <boxGeometry args={[t, h, 0.05]} />
          <meshStandardMaterial color={PALETTE.windowSash} />
        </mesh>
      ))}
      {/* DERİN DENİZLİK: odaya taşar → ÜST YÜZEYİ kameradan okunur (asıl sinyal bu). Üstü AÇIK
          (mermer denizlik), altı koyu ahşap konsol: iki ton üst üste gelince şerit "raf" değil
          "pencere eşiği" okunuyor. */}
      <mesh castShadow position={[0, -h / 2 - 0.04, 0.14]}>
        <boxGeometry args={[len + 0.2, 0.06, 0.3]} />
        <meshStandardMaterial color={PALETTE.sill} flatShading />
      </mesh>
      <mesh position={[0, -h / 2 - 0.11, 0.09]}>
        <boxGeometry args={[len + 0.12, 0.08, 0.2]} />
        <meshStandardMaterial color={PALETTE.wainscot} />
      </mesh>
      {/* DUVAR TEPESİ: bu kadrajda yan duvarın gerçekten görünen tek geniş yüzeyi burası. Kesik
          duvarda açıklık gösteremediğimiz için pencerenin bandı duvarın ÜSTÜNE de basılıyor —
          mimari kesit çiziminde camın taranması gibi: profilden bakışta bile "burada açıklık var"
          okunuyor. Uçlarda iki ince kayıt onu "boyanmış duvar" olmaktan çıkarıp doğrama yapıyor. */}
      <mesh position={[0, capY, 0.02]}>
        <boxGeometry args={[len, 0.045, 0.3]} />
        <meshStandardMaterial color={PALETTE.glass} emissive={PALETTE.glass} emissiveIntensity={0.2} />
      </mesh>
      {/* (lento uçlarındaki iki kayıt kaldırıldı — çizim çağrısı bütçesi: bkz. dosya sonu notu) */}
    </group>
  );
}

/**
 * TV ÜNİTESİ — alçak dolap + üstünde televizyon. Ekranda maç oynar (WP4, feedback §C16): yeşil
 * saha + orta çizgi + gezen top + skor bandı; parlaklık hafif titrer (canlı yayın hissi).
 *
 * B6a'da iki şey değişti: (1) TV **duvardan indi**, kendi ünitesinin üstüne oturdu — eskiden
 * y = 1,85'te, yani 1,2'lik kesik duvarın ÜSTÜNDE havada duruyordu; ünite hem o kusuru kapatıyor
 * hem 45°'lik kameraya okunan bir ÜST YÜZEY veriyor. (2) Yeri maket v14'ün sol duvar programına
 * (z = 10,8) oturdu ve **ancak ocak arka banda taşınınca** (areasOpen ≥ 3) beliriyor — o duvar
 * önce ocağın, sonra TV'nin.
 */
function TvUnitesi({ len }: { len: number }) {
  const ball = useRef<Group>(null);
  const screen = useRef<MeshStandardMaterial>(null);
  const UH = 0.42; // ünite yüksekliği
  const D = 0.42; // ünite derinliği (sırtı duvarda)
  const sw = len * 0.78; // ekran genişliği
  const sh = sw * 0.56;
  const sy = UH + 0.1 + sh / 2; // ekran merkezi — üst kenarı ~1,05'te, duvarın altında kalır
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (ball.current) {
      ball.current.position.x = Math.sin(t * 0.9) * sw * 0.3 + Math.sin(t * 2.3) * 0.05;
      ball.current.position.y = Math.cos(t * 1.4) * sh * 0.22;
    }
    if (screen.current) screen.current.emissiveIntensity = 0.5 + Math.sin(t * 7.3) * 0.06;
  });
  return (
    <group>
      {/* alçak ünite: gövde + tabla + iki göz + iki topuz */}
      <mesh castShadow position={[0, UH / 2 - 0.04, D / 2]}>
        <boxGeometry args={[len, UH - 0.08, D]} />
        <meshStandardMaterial color={PALETTE.tvStand} flatShading />
      </mesh>
      <mesh castShadow position={[0, UH, D / 2]}>
        <boxGeometry args={[len + 0.08, 0.06, D + 0.06]} />
        <meshStandardMaterial color={PALETTE.tableWood} flatShading />
      </mesh>
      {[-len / 4, len / 4].map((x) => (
        <mesh key={x} position={[x, UH / 2 - 0.04, D + 0.015]}>
          <boxGeometry args={[len / 2 - 0.16, UH - 0.22, 0.03]} />
          <meshStandardMaterial color={PALETTE.doorWood} />
        </mesh>
      ))}
      {/* ayak: ekranı üniteye bağlar (havada durmasın) */}
      <mesh castShadow position={[0, UH + 0.08, D / 2]}>
        <boxGeometry args={[0.26, 0.1, 0.16]} />
        <meshStandardMaterial color={PALETTE.tvFrame} />
      </mesh>
      <mesh castShadow position={[0, sy, D / 2 + 0.02]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[sw, sh, 0.07]} />
        <meshStandardMaterial color={PALETTE.tvFrame} />
      </mesh>
      <group position={[0, sy, D / 2 + 0.06]} rotation={[0.1, 0, 0]}>
        <mesh>
          <boxGeometry args={[sw - 0.1, sh - 0.1, 0.02]} />
          <meshStandardMaterial
            ref={screen}
            color={PALETTE.tvScreen}
            emissive={PALETTE.tvScreen}
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.016, sh - 0.16, 0.004]} />
          <meshStandardMaterial color="#e8f5ee" emissive="#e8f5ee" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <torusGeometry args={[sh * 0.17, 0.007, 6, 16]} />
          <meshStandardMaterial color="#e8f5ee" emissive="#e8f5ee" emissiveIntensity={0.3} />
        </mesh>
        <group ref={ball} position={[0, 0, 0.016]}>
          <mesh>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>
        <mesh position={[-sw * 0.26, sh * 0.32, 0.012]}>
          <boxGeometry args={[sw * 0.32, 0.06, 0.004]} />
          <meshStandardMaterial color="#1c2733" emissive="#3a546e" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function Piece({ item }: { item: DecorItem }) {
  switch (item.kind) {
    case 'saksi':
      return <Saksi big={false} />;
    case 'buyukSaksi':
      return <Saksi big />;
    case 'copKovasi':
      return <CopKovasi rings={(item.len ?? 1) > 0.9} scale={item.len ?? 1} />;
    case 'askilik':
      return <Askilik />;
    case 'gazetelik':
      return <Gazetelik />;
    case 'ayakliLamba':
      return <AyakliLamba />;
    case 'paspas':
      return <Paspas />;
    case 'tablo':
      return <Tablo len={item.len ?? 0.7} h={item.h ?? 0.5} />;
    case 'duvarSaati':
      return <DuvarSaati />;
    case 'aplik':
      return <Aplik />;
    case 'askiRayi':
      return <AskiRayi len={item.len ?? 3.2} />;
    case 'konsol':
      return <Konsol len={item.len ?? 3.0} />;
    case 'tvUnitesi':
      return <TvUnitesi len={item.len ?? 1.9} />;
    case 'semsiyelik':
      return <Semsiyelik />;
    case 'petek':
      return <Petek len={item.len ?? 1.6} />;
    case 'denizlikSaksi':
      return <DenizlikSaksi />;
    case 'pencere':
      // capY: duvarın TEPESİ (1,20 + kartonpiyer payı) parçanın YEREL eksenine çevrilmiş hâli —
      // lento kapağı pencerenin y'si değişse de duvarın üstünde kalsın.
      return <Pencere len={item.len ?? 3.0} h={item.h ?? 0.48} capY={1.235 - item.pos[1]} />;
    default:
      return null;
  }
}

export function Decor() {
  const areasOpen = useGame((s) => s.areasOpen);
  const items = decorItems(areasOpen);
  return (
    <group>
      {items.map((item, i) => (
        <group key={`${item.kind}${i}`} position={item.pos as [number, number, number]} rotation={[0, item.rot, 0]}>
          <Piece item={item} />
        </group>
      ))}
    </group>
  );
}
