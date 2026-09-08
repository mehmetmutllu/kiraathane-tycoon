/**
 * activeStep.ts — AKTİF ADIMIN dünya hedefi + zemin işaretlerinin KATMANI (D-038 · C2).
 *
 * D-038 dört kanal sayar: alt bant metni · kamera odağı · ekran kenarı oku · **dünyadaki işaret**.
 * İlk üçü zaten tek görevden türüyordu; dördüncüsü türemiyordu — C2 ölçümü (`docs/tek-odak-c2.md`)
 * ekranda ortalama 7,8, en çok 16 işaret buldu ve hepsi AYNI görsel ağırlıktaydı, yani "hangisi şu
 * anki adım" okunmuyordu.
 *
 * Çözüm nokta SİLMEK değil (kullanıcı kararı: yükseltme obje-başı, her masanın noktası kendi
 * yanında — My Hotel modeli), **ağırlığı ikiye ayırmak**:
 *   - `aktif`   — aktif adımın işareti: yazı + maliyet + parlak halka + hafif nabız. EN FAZLA BİR TANE.
 *   - `konusan` — oyuncu yaklaştı: yazı + maliyet, nabız yok.
 *   - `sessiz`  — uzakta: küçük, yazısız halka. Yer bilgisi durur, ses durmaz.
 *
 * `activeStep` singleton'ı her karede TEK yerden (Scene'in `QuestPointer`'ı, `questFocusPos` ile)
 * yazılır, işaretler okur. Store'a yazılsaydı her kare React render'ı tetiklerdi — `screenPointer`
 * ve `perf` ile aynı kalıp.
 */

/** Aktif adımın dünya hedefi (Scene her karede yazar; yoksa `has:false`). */
export interface ActiveStep {
  has: boolean;
  x: number;
  z: number;
}

export const activeStep: ActiveStep = { has: false, x: 0, z: 0 };

/**
 * Sessiz bir nokta oyuncu bu kadar yaklaşınca konuşur (dünya birimi).
 * Masa sütun aralığı 3,2 br → yan yana iki masanın arasında durunca ikisi de konuşur (seçim anı),
 * üçüncüsü sessiz kalır. Dolum yarıçapı (1,00) ile karıştırılmamalı: bu yalnız SUNUM eşiği.
 * Katman 3 (sunum) — dondurulmuş ölçü DEĞİL.
 */
export const SPEAK_RADIUS = 3.2;

/** İki ankrajın "aynı nokta" sayılma toleransı (br). İki taraf da aynı sabitten okur, pay küçük. */
const SAME = 0.05;

export type MarkerTier = 'aktif' | 'konusan' | 'sessiz';

/**
 * Bir zemin işaretinin katmanı. SAF — vitest edilebilir; `GroundMarker` her karede bunu çağırır.
 * Aktiflik MESAFEDEN değil aktif adımın hedefinden gelir: uzaktaki aktif adım da yüksek sesle
 * çizilir (kenar oku onu zaten gösteriyor).
 */
export function markerTier(
  pos: readonly [number, number, number],
  step: ActiveStep,
  player: readonly [number, number, number],
  speakRadius: number = SPEAK_RADIUS,
): MarkerTier {
  if (step.has && Math.abs(step.x - pos[0]) < SAME && Math.abs(step.z - pos[2]) < SAME) return 'aktif';
  return Math.hypot(player[0] - pos[0], player[2] - pos[2]) <= speakRadius ? 'konusan' : 'sessiz';
}
