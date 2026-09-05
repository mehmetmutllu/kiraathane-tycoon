/**
 * Aktif adımın EKRAN İZDÜŞÜMÜ (plan §9: "sahnenin üstünde yalnız aktif adımın işareti
 * + ekran kenarı oku (işaret dışarıdaysa)").
 *
 * Sahne tarafı (R3F `useFrame`) her karede buraya yazar, HUD ~20Hz okur. Store'a yazılsaydı
 * her kare React render'ı tetiklerdi — `perf` singleton'uyla aynı kalıp.
 */
export interface ScreenPointer {
  /** Hedef VAR mı (aktif adımın dünya konumu biliniyor mu). */
  active: boolean;
  /** Hedef ekranda görünüyor mu (true ise ok gösterilmez). */
  onScreen: boolean;
  /** Ekran kenarındaki ok konumu (px, viewport). */
  x: number;
  y: number;
  /** Okun bakış açısı (derece; 0 = sağ). */
  angle: number;
  /** Oyuncudan hedefe uzaklık (dünya birimi) — bantta "12 m" gibi gösterilebilir. */
  dist: number;
}

export const screenPointer: ScreenPointer = {
  active: false,
  onScreen: true,
  x: 0,
  y: 0,
  angle: 0,
  dist: 0,
};
