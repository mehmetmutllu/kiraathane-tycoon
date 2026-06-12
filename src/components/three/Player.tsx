import { useRef } from 'react';
import type { Group } from 'three';
import { useGame } from '../../game/store';
import { Model } from './Model';
import { useFacing } from './useFacing';
import { PALETTE } from '../../config/palette';
import { trayCapacityFor } from '../../config/economy.config';

// Çaycı karakter v2 (2026-06-11 kullanıcı isteği: "kollar bacaklar falan güzel olsun"): PARÇALI
// gövde (Faz 6 animasyon iskeletine hazırlık — her uzuv ayrı mesh). AYRI bacaklar + ayakkabılar,
// iki simetrik kol (gömlek kollu + ten rengi eller, tepsiye uzanır), gözler + burun.
// Kasket + krem gömlek + bordo önlük + bıyık; flat low-poly (D-013).
// EXPORT: karakter paneli (v20) mini Canvas'ta aynı gövdeyi 3/4 açıdan gösterir.
const SHOE = '#2e2a26';
export function OwnerBody() {
  return (
    <group>
      {/* bacaklar + ayakkabılar (ayrı uzuvlar) */}
      {[-0.11, 0.11].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 0.24, 0]}>
            <capsuleGeometry args={[0.085, 0.24, 4, 8]} />
            <meshStandardMaterial color={PALETTE.pants} />
          </mesh>
          <mesh castShadow position={[0, 0.05, 0.04]}>
            <boxGeometry args={[0.15, 0.09, 0.27]} />
            <meshStandardMaterial color={SHOE} />
          </mesh>
        </group>
      ))}
      {/* kalça (pantolon üstü) */}
      <mesh castShadow position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.24, 0.26, 0.18, 12]} />
        <meshStandardMaterial color={PALETTE.pants} />
      </mesh>
      {/* gömlek gövde + omuz hattı */}
      <mesh castShadow position={[0, 0.67, 0]}>
        <cylinderGeometry args={[0.27, 0.24, 0.32, 12]} />
        <meshStandardMaterial color={PALETTE.shirt} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.29, 0.27, 0.12, 12]} />
        <meshStandardMaterial color={PALETTE.shirt} />
      </mesh>
      {/* önlük (göğüsten dize) + bel bağı */}
      <mesh castShadow position={[0, 0.55, 0.235]} rotation={[0.06, 0, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.05]} />
        <meshStandardMaterial color={PALETTE.apron} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.255, 0.255, 0.05, 12]} />
        <meshStandardMaterial color={PALETTE.apron} />
      </mesh>
      {/* kollar: omuzdan ÖNE-YUKARI tepsiye uzanır; uçta ten rengi eller (tepsi kenarlarını tutar) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.3, 0.86, 0.04]} rotation={[-1.9, 0, s * -0.12]}>
          <mesh castShadow position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.065, 0.26, 4, 8]} />
            <meshStandardMaterial color={PALETTE.shirt} />
          </mesh>
          <mesh castShadow position={[0, -0.33, 0]}>
            <sphereGeometry args={[0.072, 10, 8]} />
            <meshStandardMaterial color={PALETTE.skin} />
          </mesh>
        </group>
      ))}
      {/* baş + yüz (gözler, burun, bıyık) */}
      <mesh castShadow position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.21, 14, 12]} />
        <meshStandardMaterial color={PALETTE.skin} />
      </mesh>
      {[-0.072, 0.072].map((x) => (
        <mesh key={x} position={[x, 1.115, 0.185]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshStandardMaterial color="#2b2118" />
        </mesh>
      ))}
      <mesh position={[0, 1.07, 0.205]}>
        <sphereGeometry args={[0.032, 8, 6]} />
        <meshStandardMaterial color="#d49a55" />
      </mesh>
      <mesh position={[0, 1.018, 0.183]}>
        <boxGeometry args={[0.16, 0.045, 0.04]} />
        <meshStandardMaterial color={PALETTE.mustache} />
      </mesh>
      {/* kasket: tepe + öne vizör */}
      <mesh castShadow position={[0, 1.24, 0]}>
        <cylinderGeometry args={[0.2, 0.23, 0.1, 12]} />
        <meshStandardMaterial color={PALETTE.cap} />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0.2]}>
        <boxGeometry args={[0.3, 0.03, 0.18]} />
        <meshStandardMaterial color={PALETTE.cap} />
      </mesh>
    </group>
  );
}

// Bardakları ellerin ÖNÜNDEKİ tek tepside 3×2 ızgaraya dizer (Faz 2f): max 6 bardak taşmaz,
// Tek ön tepsi, PAYLAŞIMLI kapasite: önce temiz çaylar (kırmızı), sonra kirliler (gri) ardışık dizilir →
// karışık taşımada üst üste binmez (tea + dirty aynı ızgarayı sırayla paylaşır). count 0 ise hiçbir şey çizilmez.
// cap (v20): tepsi TABANI kapasiteyle büyür (karakter yükseltmesinin gözle görülür ödülü).
// EXPORT: karakter paneli canlı tepsi önizlemesi aynı bileşeni kullanır.
export function CupTray({
  tea,
  dirty,
  food = 0,
  dirtyFood = 0,
  cap = 6,
}: {
  tea: number;
  dirty: number;
  food?: number;
  /** Kirli TABAK (tost bulaşığı; turu-5 m.11 — bardak değil yayvan tabak çizilir). */
  dirtyFood?: number;
  cap?: number;
}) {
  const total = tea + food + dirty + dirtyFood;
  if (total <= 0) return null;
  const colSpacing = 0.16;
  const rowSpacing = 0.15;
  const cols = Math.min(Math.max(cap, total, 1), 3);
  const rows = Math.ceil(Math.min(Math.max(cap, total, 1), 6) / 3);
  return (
    <group position={[0, 1.0, 0.45]}>
      {/* tepsi tabanı (kapasitenin ızgarasını taşıyacak boyut; ızgaranın gerçek merkezine oturur) */}
      <mesh
        castShadow
        position={[((cols - 1) / 2 - 1) * colSpacing, 0, ((rows - 1) / 2 - 0.5) * rowSpacing]}
      >
        <boxGeometry args={[cols * colSpacing + 0.1, 0.04, rows * rowSpacing + 0.14]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {Array.from({ length: total }).map((_, i) => {
        // Sıra: çaylar (kırmızı) → tostlar (kızarmış dilim, M3) → kirli bardaklar (gri) →
        // kirli tabaklar (yayvan disk); aynı ızgara paylaşılır.
        const isFood = i >= tea && i < tea + food;
        const isDirty = i >= tea + food && i < tea + food + dirty;
        const isDirtyPlate = i >= tea + food + dirty;
        const col = i % 3; // 0..2 → x: -1,0,1
        const row = Math.floor(i / 3); // 0..1 → z: arka/ön
        const px = (col - 1) * colSpacing;
        const pz = (row - 0.5) * rowSpacing;
        if (isFood) {
          return (
            <mesh key={i} castShadow position={[px, 0.06, pz]}>
              <boxGeometry args={[0.14, 0.05, 0.11]} />
              <meshStandardMaterial color={PALETTE.toast} roughness={0.7} />
            </mesh>
          );
        }
        if (isDirtyPlate) {
          // Kirli tabak: yayvan disk + üstünde kırıntı (bardak silüetinden net ayrışır).
          return (
            <group key={i} position={[px, 0.05, pz]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.075, 0.06, 0.03, 10]} />
                <meshStandardMaterial color="#b3a896" roughness={0.9} />
              </mesh>
              <mesh position={[0.015, 0.025, 0.01]}>
                <boxGeometry args={[0.05, 0.02, 0.04]} />
                <meshStandardMaterial color={PALETTE.toastDark} roughness={0.9} />
              </mesh>
            </group>
          );
        }
        return (
          <mesh key={i} castShadow position={[px, 0.1, pz]}>
            <cylinderGeometry args={[0.05, 0.04, 0.14, 8]} />
            <meshStandardMaterial
              color={isDirty ? '#8d8276' : '#c0392b'}
              roughness={isDirty ? 0.9 : 0.5}
              emissive={isDirty ? '#000000' : '#7a1f17'}
              emissiveIntensity={isDirty ? 0 : 0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// (WP5: baş üstü radial KALDIRILDI — tek dolum göstergesi = dünya-içi pad halkası; feedback §D18.)

// Sahip karakteri (primitive çaycı = nihai stil, D-013). Taşıma tek ön tepside
// (karışık taşıma → çakışmaz).
export function Player() {
  const p = useGame((s) => s.player);
  const tray = useGame((s) => s.tray);
  const trayFood = useGame((s) => s.trayFood);
  const carriedDirty = useGame((s) => s.carriedDirty);
  const carriedDirtyFood = useGame((s) => s.carriedDirtyFood);
  const trayTier = useGame((s) => s.charUpgrades.tray);
  const ref = useRef<Group>(null);
  useFacing(ref, p[0], p[2]);
  return (
    <group position={[p[0], 0, p[2]]}>
      <group ref={ref}>
        <Model fallback={<OwnerBody />} />
        <CupTray tea={tray} food={trayFood} dirty={carriedDirty} dirtyFood={carriedDirtyFood} cap={trayCapacityFor(trayTier)} />
      </group>
    </group>
  );
}
