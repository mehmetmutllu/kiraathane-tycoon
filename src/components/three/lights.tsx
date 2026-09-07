/**
 * lights.tsx — SAHNENİN IŞIK TAKIMI, TEK TANIM.
 *
 * G0'da dünyanın ışığı sıcak yarımküre + krem güneşe geçti (gerekçe: `palette.ts` LIGHTING),
 * ama mağaza önizlemeleri (`SalonSlice`, `DioramaPreview`, `TableThemePreview`, `CharacterPanel`)
 * eski düz beyaz `ambientLight 0.6 + dirLight [6,12,6]` ile kalmıştı. Sonucu bir MAĞAZA HATASIYDI:
 * satın alınan zemin/duvar/masa rengi kartta bir türlü, salonda başka türlü görünüyordu.
 * Önizlemenin tek işi ne alacağını doğru göstermek olduğundan ışık artık tek yerden gelir.
 *
 * Gölge YOK (D-054): yönlü ışık yalnız yüzey yönüne göre aydınlatır.
 * Fog/arka plan burada DEĞİL — onlar dünyaya ait; önizleme küçük bir kesit, sisi olmaz.
 */
import { LIGHTING } from '../../config/palette';

export function SceneLights() {
  return (
    <>
      <hemisphereLight args={[LIGHTING.skyColor, LIGHTING.groundColor, LIGHTING.hemiIntensity]} />
      <directionalLight
        position={LIGHTING.sunPos}
        color={LIGHTING.sunColor}
        intensity={LIGHTING.sunIntensity}
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
