/**
 * lights.tsx — SAHNENİN IŞIK TAKIMI, TEK TANIM.
 *
 * G0'da dünyanın ışığı sıcak yarımküre + krem güneşe geçti (gerekçe: `palette.ts` LIGHTING),
 * ama mağaza önizlemeleri (`SalonSlice`, `DioramaPreview`, `TableThemePreview`, `CharacterPanel`)
 * eski düz beyaz `ambientLight 0.6 + dirLight [6,12,6]` ile kalmıştı. Sonucu bir MAĞAZA HATASIYDI:
 * satın alınan zemin/duvar/masa rengi kartta bir türlü, salonda başka türlü görünüyordu.
 * Önizlemenin tek işi ne alacağını doğru göstermek olduğundan ışık artık tek yerden gelir.
 *
 * GÖLGE AÇIK (D-073, D-054 geri alındı): dünyayı çizen sahne `shadows` ile çağırır; mağaza
 * önizlemeleri (küçük diorama kesitleri) gölgesiz kalır — 34 × 34'lük gölge kamerası oraya
 * uymaz ve kartın işi ışığı değil RENGİ göstermek.
 * Fog/arka plan burada DEĞİL — onlar dünyaya ait; önizleme küçük bir kesit, sisi olmaz.
 */
import { LIGHTING } from '../../config/palette';

export function SceneLights({ shadows = false }: { shadows?: boolean } = {}) {
  return (
    <>
      <hemisphereLight args={[LIGHTING.skyColor, LIGHTING.groundColor, LIGHTING.hemiIntensity]} />
      <directionalLight
        position={LIGHTING.sunPos}
        color={LIGHTING.sunColor}
        intensity={LIGHTING.sunIntensity}
        castShadow={shadows}
        shadow-mapSize-width={LIGHTING.shadowMapSize}
        shadow-mapSize-height={LIGHTING.shadowMapSize}
        shadow-bias={LIGHTING.shadowBias}
        shadow-normalBias={LIGHTING.shadowNormalBias}
        shadow-camera-left={-LIGHTING.shadowExtent}
        shadow-camera-right={LIGHTING.shadowExtent}
        shadow-camera-top={LIGHTING.shadowExtent}
        shadow-camera-bottom={-LIGHTING.shadowExtent}
        shadow-camera-near={LIGHTING.shadowNear}
        shadow-camera-far={LIGHTING.shadowFar}
      />
      {/* Soğuk dolgu ışığı (B6b) — güneşin görmediği yüzler sarıya boğulmasın diye. Gerekçe palette.ts. */}
      <directionalLight
        position={LIGHTING.fillPos}
        color={LIGHTING.fillColor}
        intensity={LIGHTING.fillIntensity}
      />
    </>
  );
}
