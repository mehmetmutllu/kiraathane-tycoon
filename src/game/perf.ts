// FPS / render bütçesi ölçümü (FPS Tier 2 hazırlığı). Canvas içindeki PerfProbe her ~0.5sn'de
// buraya yazar; HUD overlay'i ve window.__perf buradan okur. Modül singleton — Zustand'a sokmadık
// çünkü her kare güncellenir (store re-render'ı tetiklemesin), salt ölçüm verisi.
// draw-call instancing işinin asıl metriği: 200-400 → bir avuç hedefi buradan doğrulanır.
export interface PerfSnapshot {
  fps: number; // son pencere ortalaması
  calls: number; // gl.info.render.calls (kare başı draw-call)
  tris: number; // gl.info.render.triangles
}

export const perf: PerfSnapshot = { fps: 0, calls: 0, tris: 0 };
