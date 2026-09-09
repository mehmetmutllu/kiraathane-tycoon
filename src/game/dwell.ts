/**
 * Usta noktasının BEKLEME (dwell) durumu — sahne yazar, işaret okur.
 *
 * Neden modül değişkeni: dolum her karede değişir. React state'i olsaydı saniyede 60 kez
 * yeniden render olurdu (`activeStep` ile aynı gerekçe, D-038). İki `useFrame` bu nesne
 * üzerinden konuşur; React'e yalnız dolum TAMAMLANINCA bir kez dokunulur.
 */
export const dwellState = {
  /** Şu an beklenen Usta noktası (yoksa null). */
  id: null as string | null,
  /** 0..1 — çerçevenin yeşil dolum oranı. */
  p: 0,
};
