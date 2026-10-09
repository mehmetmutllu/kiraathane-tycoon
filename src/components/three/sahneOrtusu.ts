/**
 * SAHNE ÖRTÜSÜ (Sprint A · perf #2a) — opak tam ekran panel açıkken sahne ÇİZİLMEZ.
 *
 * `Sheet` (D-106) ekranı opak zeminle tamamen örter; altındaki sahneyi saniyede 60 kez çizmek
 * oyuncunun göremediği iş, yani pil. Simülasyon (tick) SÜRER: yalnız `gl.render` atlanır —
 * para, müşteri, ocak panel açıkken de işler, panel kapanınca dünya kaldığı yerden değil
 * olduğu yerden görünür.
 *
 * SAYAÇ, bayrak değil: paneller iç içe açılabilir (mağaza üstünde ödül ekranı); biri kapanınca
 * diğeri hâlâ örtüyorsa çizim başlamamalı. Modül düzeyinde: her karede okunur, store'a girerse
 * her açılış/kapanış bir React render'ı olurdu.
 */
let acik = 0;

/** Bir örtü açar; dönen fonksiyon onu kapatır (iki kez çağrılsa da bir kez sayılır). */
export function sahneOrtusuAc(): () => void {
  acik += 1;
  let kapandi = false;
  return () => {
    if (kapandi) return;
    kapandi = true;
    acik = Math.max(0, acik - 1);
  };
}

/** Sahne şu an opak bir panelin altında mı. */
export const sahneOrtulu = (): boolean => acik > 0;
