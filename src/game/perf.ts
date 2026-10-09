// FPS / render bütçesi ölçümü (FPS Tier 2 hazırlığı). Canvas içindeki PerfProbe her ~0.5sn'de
// buraya yazar; HUD overlay'i ve window.__perf buradan okur. Modül singleton — Zustand'a sokmadık
// çünkü her kare güncellenir (store re-render'ı tetiklemesin), salt ölçüm verisi.
// draw-call instancing işinin asıl metriği: 200-400 → bir avuç hedefi buradan doğrulanır.
export interface PerfSnapshot {
  fps: number; // son pencere ortalaması
  calls: number; // gl.info.render.calls (kare başı draw-call)
  tris: number; // gl.info.render.triangles
  /**
   * Son karenin İŞİ (ms): `advance()` içinde geçen süre — useFrame aboneleri + `gl.render`.
   * Kare-hızı tavanı (K-A · D-136) gelince kareler-arası SÜRE artık işin maliyeti değil,
   * tavanın aralığıdır (60 fps'te 16,7 ms, sahne ne kadar ucuz olursa olsun). Maliyet ölçülebilir
   * kalsın diye ayrı tutulur: optimizasyonun kazancı buradan okunur, fps'ten değil.
   */
  isMs: number;
}

export const perf: PerfSnapshot = { fps: 0, calls: 0, tris: 0, isMs: 0 };

/**
 * ÜRETİMDE ÖLÇÜM ANAHTARI (Sprint A). Cihazda kare işini okumak için `chrome://inspect` konsolunda
 * `localStorage.setItem('kiraathane-olcum','1')` + yeniden yükle → `window.__perf()` açılır.
 * Kayda değil cihaza ait bir teşhis anahtarı; oyuncuya hiçbir yüzeyde görünmez.
 */
export const OLCUM_ANAHTARI = 'kiraathane-olcum';

export function olcumAcik(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(OLCUM_ANAHTARI) === '1';
  } catch {
    return false; // özel sekme / kapalı depo
  }
}

/** `window.__perf` — DEV kancasıyla aynı biçim: anlık görüntünün kopyası. */
export function perfPenceresiAc(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as { __perf?: () => PerfSnapshot }).__perf = () => ({ ...perf });
}
