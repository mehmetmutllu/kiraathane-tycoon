import { useGame } from '../../game/store';
import { LAYOUT } from '../../game/store';
import { Model } from './Model';
import { PALETTE } from '../../config/palette';
import { tableSeats, zoneOfTable, zoneProduct } from '../../config/economy.config';

// Tabure (gerçek kıraathane formu): silindir gövde + kırmızı minder. Koltuk kutusu emekli.
function Stool({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.42, 10]} />
        <meshStandardMaterial color={PALETTE.stool} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.07, 10]} />
        <meshStandardMaterial color={PALETTE.stoolCushion} />
      </mesh>
    </group>
  );
}

// ARKALIKLI restoran sandalyesi (Y1 yemek alanı kimliği): ahşap iskelet + petrol minder + arkalık.
// Arkalık DIŞ tarafta (oturan masaya bakar): güney sandalye kuzeye, kuzey sandalye güneye döner.
function Chair({ x, z }: { x: number; z: number }) {
  const rotY = z > 0 ? 0 : Math.PI;
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[0.36, 0.05, 0.36]} />
        <meshStandardMaterial color={PALETTE.chairWood} />
      </mesh>
      <mesh castShadow position={[0, 0.47, 0]}>
        <boxGeometry args={[0.3, 0.05, 0.3]} />
        <meshStandardMaterial color={PALETTE.chairCushion} />
      </mesh>
      {[-0.14, 0.14].flatMap((lx) =>
        [-0.14, 0.14].map((lz) => (
          <mesh key={`${lx}${lz}`} castShadow position={[lx, 0.2, lz]}>
            <boxGeometry args={[0.05, 0.4, 0.05]} />
            <meshStandardMaterial color={PALETTE.chairWood} />
          </mesh>
        )),
      )}
      {/* arkalık: 2 dikme + sırt paneli (yerel +z = dış taraf) */}
      {[-0.14, 0.14].map((lx) => (
        <mesh key={lx} castShadow position={[lx, 0.64, 0.155]}>
          <boxGeometry args={[0.05, 0.44, 0.04]} />
          <meshStandardMaterial color={PALETTE.chairWood} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.76, 0.155]}>
        <boxGeometry args={[0.36, 0.2, 0.04]} />
        <meshStandardMaterial color={PALETTE.chairWood} />
      </mesh>
    </group>
  );
}

// Kıraathane masası — KARE KALARAK evrilir (kullanıcı 2026-06-11: "masa en başta kare ya, O KARE
// gelişmeli; üzerine örtü gelir"). WP4'ün yuvarlak/sekizgen formları kaldırıldı:
//   L0: çıplak tabla + 4 ince ayak + 1 oturak
//   L1: + çuha YEŞİLİ örtü + 2. oturak
//   L2: + BORDO örtü + sarkan ETEK + 3. oturak
//   L3: + LACİVERT örtü + pirinç kenar bandı + 4. oturak
//   L4: ALTIN örtü + etek + bant (en gösterişli)
// Y1: YEMEK masası DİKDÖRTGEN (1.35×0.85, uzun kenar x) + arkalıklı sandalye (2'ye 2 karşılıklı);
// çay masası kare + tabure kalır. Collision LAYOUT'tan (tableHalf / foodTableHalf).
function Table({ x, z, level, food = false }: { x: number; z: number; level: number; food?: boolean }) {
  // M3: YEMEK masası (tost salonu) kendi örtü paletiyle + sofra prop'larıyla evrilir
  // (kullanıcı: "yemek masaları farklı olabilir, seviye artınca olacak şeyler de artar").
  const clothArr = food ? PALETTE.foodTableclothByLevel : PALETTE.tableclothByLevel;
  const cloth = clothArr[Math.min(level, clothArr.length - 1)];
  // Y2 tek kaynak: sandalye ofsetleri LAYOUT'tan (store koltuk pozisyonunu aynı listeden türetir);
  // görsel sandalye sayısı = OTURULABİLİR koltuk (seatsByLevel 1/2/2/4/4 — plan §2).
  const spots = food ? LAYOUT.foodChairSpots : LAYOUT.chairSpots;
  const chairs = Math.min(spots.length, tableSeats(level));
  const skirt = cloth && (level === 2 || level >= 4);
  // Tabla yarıları (x, z): kare 0.475/0.475; yemek dikdörtgeni 0.675/0.425.
  const hw = food ? 0.675 : 0.475;
  const hd = food ? 0.425 : 0.475;
  return (
    <group position={[x, 0, z]}>
      <Model
        fallback={
          <group>
            {/* tabla + 4 ince ayak (TÜM seviyelerde aynı iskelet) */}
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
              <boxGeometry args={[hw * 2, 0.07, hd * 2]} />
              <meshStandardMaterial color={PALETTE.tableWood} />
            </mesh>
            {[-(hw - 0.095), hw - 0.095].flatMap((lx) =>
              [-(hd - 0.095), hd - 0.095].map((lz) => (
                <mesh key={`${lx}${lz}`} castShadow position={[lx, 0.24, lz]}>
                  <boxGeometry args={[0.07, 0.48, 0.07]} />
                  <meshStandardMaterial color={PALETTE.tableLeg} />
                </mesh>
              )),
            )}
            {/* örtü (tabladan hafif taşar) */}
            {cloth ? (
              <mesh castShadow position={[0, 0.55, 0]}>
                <boxGeometry args={[hw * 2 + 0.08, 0.03, hd * 2 + 0.08]} />
                <meshStandardMaterial color={cloth} />
              </mesh>
            ) : null}
            {/* örtü ETEĞİ (L2 ve L4: dört yana sarkan kumaş) */}
            {skirt ? (
              <group>
                {[-(hd + 0.04), hd + 0.04].map((sz) => (
                  <mesh key={sz} castShadow position={[0, 0.43, sz]}>
                    <boxGeometry args={[hw * 2 + 0.08, 0.22, 0.04]} />
                    <meshStandardMaterial color={cloth} />
                  </mesh>
                ))}
                {[-(hw + 0.04), hw + 0.04].map((sx) => (
                  <mesh key={sx} castShadow position={[sx, 0.43, 0]}>
                    <boxGeometry args={[0.04, 0.22, hd * 2 + 0.08]} />
                    <meshStandardMaterial color={cloth} />
                  </mesh>
                ))}
              </group>
            ) : null}
            {/* pirinç kenar bandı (L3+): tabla çevresinde ince çerçeve */}
            {level >= 3 ? (
              <group>
                {[-(hd + 0.015), hd + 0.015].map((sz) => (
                  <mesh key={sz} position={[0, 0.5, sz]}>
                    <boxGeometry args={[hw * 2 + 0.05, 0.075, 0.025]} />
                    <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} />
                  </mesh>
                ))}
                {[-(hw + 0.015), hw + 0.015].map((sx) => (
                  <mesh key={sx} position={[sx, 0.5, 0]}>
                    <boxGeometry args={[0.025, 0.075, hd * 2 + 0.05]} />
                    <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} />
                  </mesh>
                ))}
              </group>
            ) : null}
            {/* YEMEK masası sofra prop'ları (M3): L1+ peçetelik; L2+ ketçap-mayo; L3+ servis tabağı */}
            {food && level >= 1 ? (
              <mesh castShadow position={[-0.22, 0.62, -0.22]}>
                <boxGeometry args={[0.14, 0.1, 0.07]} />
                <meshStandardMaterial color={PALETTE.mayo} />
              </mesh>
            ) : null}
            {food && level >= 2 ? (
              <group position={[0.24, 0, -0.24]}>
                <mesh castShadow position={[-0.045, 0.65, 0]}>
                  <cylinderGeometry args={[0.035, 0.04, 0.16, 8]} />
                  <meshStandardMaterial color={PALETTE.ketchup} />
                </mesh>
                <mesh castShadow position={[0.045, 0.65, 0]}>
                  <cylinderGeometry args={[0.035, 0.04, 0.16, 8]} />
                  <meshStandardMaterial color={PALETTE.mayo} />
                </mesh>
              </group>
            ) : null}
            {food && level >= 3 ? (
              <mesh castShadow position={[0, 0.585, 0.1]}>
                <cylinderGeometry args={[0.13, 0.11, 0.025, 10]} />
                <meshStandardMaterial color={PALETTE.plate} />
              </mesh>
            ) : null}
          </group>
        }
      />
      {/* oturaklar (Y2): HER sandalye gerçek koltuk — grup üyeleri farklı koltuklara oturur.
          Çay masası: tabure (4 yana). Yemek masası: arkalıklı sandalye (2'ye 2 karşılıklı). */}
      {spots.slice(0, chairs).map(([sx, sz], i) =>
        food ? <Chair key={i} x={sx} z={sz} /> : <Stool key={i} x={sx} z={sz} />,
      )}
    </group>
  );
}

// Açık masaları çiz (global bitişik indeksler; zone-2 masaları da otomatik buradan çizilir).
export function Tables() {
  const tables = useGame((s) => s.tables);
  const tableLevels = useGame((s) => s.tableLevels);
  return (
    <>
      {LAYOUT.tables.slice(0, tables).map((t, i) => (
        <Table
          key={i}
          x={t.table[0]}
          z={t.table[2]}
          level={tableLevels[i] ?? 0}
          food={zoneProduct(zoneOfTable(i)) === 'tost'}
        />
      ))}
    </>
  );
}
