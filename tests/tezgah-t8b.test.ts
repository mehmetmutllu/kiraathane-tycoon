/**
 * T8b · D-143 bekçisi — TEZGÂH ARKASI.
 *
 * K10 (G-68): sol duvar döneminde tezgâh duvardan 0,75 açıldı; çaycı ve bulaşıkçı ARKADA çalışır,
 * arka şerit personele açık, oyuncuya kapalı. K9 (G-70): bırakılan kirli leğende birikir ve
 * `cups.washBatchSec`te bir TOPTAN temize döner. Sayılar: `docs/tezgah-raporu-t8b.md`.
 */
import { describe, it, expect } from 'vitest';
import {
  FLOOR_HALF,
  SOL_DUVAR_PAYI,
  servicePlace,
  getNavGrid,
  getPlayerNavGrid,
  oyuncuKatilari,
  activeSolids,
  hitsSolid,
  LAYOUT,
} from '../src/game/layout';
import type { NavGrid } from '../src/game/nav';
import { ACTOR_RADIUS } from '../src/config/actor';
import { useGame } from '../src/game/store';
import { economyConfig as C } from '../src/config/economy.config';

const DONEMLER = [
  { tables: 4, areasOpen: 1 },
  { tables: 8, areasOpen: 2 },
];

/** Gövdenin z-boyu boyunca arka şeritteki açık hücreler ve TAM açık sütun sayısı. */
function arkaSerit(g: NavGrid, arkaYuz: number, z0: number, z1: number): { sutun: number; hucre: number } {
  let sutun = 0;
  let hucre = 0;
  for (let c = 0; c < g.cols; c++) {
    const x = g.minX + (c + 0.5) * g.cell;
    if (x >= arkaYuz || x <= -FLOOR_HALF) continue;
    let tam = true;
    for (let r = 0; r < g.rows; r++) {
      const z = g.minZ + (r + 0.5) * g.cell;
      if (z < z0 || z > z1) continue;
      if (g.blocked[r * g.cols + c]) tam = false;
      else hucre++;
    }
    if (tam) sutun++;
  }
  return { sutun, hucre };
}

describe('D-143 · K10 — adam tezgâhın ARKASINDA', () => {
  const sp = servicePlace(1);
  const arkaYuz = sp.station[0] - sp.half[0];
  const z0 = sp.station[2] - sp.half[1];
  const z1 = sp.dish[2] + sp.dishHalf[1];

  it('duvar payı 0,75 ve aktör gövdesi (0,56) iki yanda pay bırakarak sığıyor', () => {
    expect(SOL_DUVAR_PAYI).toBe(0.75);
    expect(arkaYuz - -FLOOR_HALF).toBeCloseTo(0.75, 6);
    expect(SOL_DUVAR_PAYI - ACTOR_RADIUS * 2).toBeGreaterThan(0.1);
  });

  it('çaycının yolu ve bulaşıkçının postası duvarla gövde ARASINDA, gövdeye/duvara girmeden', () => {
    for (const p of [sp.dishwasherHome, sp.staffWalk.a, sp.staffWalk.b]) {
      expect(p[0] + ACTOR_RADIUS, 'gövdeye giriyor').toBeLessThanOrEqual(arkaYuz);
      expect(p[0] - ACTOR_RADIUS, 'duvara giriyor').toBeGreaterThanOrEqual(-FLOOR_HALF);
    }
  });

  it('çaycı leğenin arkasına taşmaz — orası bulaşıkçının postası (üst üste binme)', () => {
    const tezgahUcu = sp.station[2] + sp.half[1];
    expect(Math.max(sp.staffWalk.a[2], sp.staffWalk.b[2])).toBeLessThanOrEqual(tezgahUcu);
    expect(sp.dishwasherHome[2]).toBeGreaterThan(tezgahUcu);
  });

  it('arka şerit PERSONELE açık (sürekli sütun), OYUNCUYA kapalı (sıfır hücre)', () => {
    for (const { tables, areasOpen } of DONEMLER) {
      expect(arkaSerit(getNavGrid(tables, areasOpen), arkaYuz, z0, z1).sutun, `personel · alan ${areasOpen}`).toBeGreaterThanOrEqual(1);
      expect(arkaSerit(getPlayerNavGrid(tables, areasOpen), arkaYuz, z0, z1).hucre, `oyuncu · alan ${areasOpen}`).toBe(0);
    }
  });

  it('arka şerit katısı YALNIZ oyuncunun: personel noktaları activeSolids\'te serbest, oyuncununkinde kapalı', () => {
    const w = sp.dishwasherHome;
    expect(hitsSolid(w[0], w[2], activeSolids(8, 2), 0)).toBe(false);
    expect(hitsSolid(w[0], w[2], oyuncuKatilari(8, 2), LAYOUT.playerRadius)).toBe(true);
    // Arka bant döneminde şerit katısı yok (servis taşındı).
    expect(oyuncuKatilari(20, 3).length).toBe(activeSolids(20, 3).length);
  });
});

describe('D-143 · K9 — leğen birikir, TOPTAN yıkanır', () => {
  it('bırakılan kirli leğende bekler; periyotta hepsi birden temize döner (korunum)', () => {
    useGame.getState().hardReset();
    const s0 = useGame.getState();
    const dish = servicePlace(s0.areasOpen).dish;
    useGame.setState({
      player: [dish[0] + 1, 0.6, dish[2]],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      carriedDirty: 3,
      carriedDirtyFood: 1,
      cleanCups: s0.cleanCups - 4,
      legen: { bardak: 0, tabak: 0, t: 0 },
    });
    const temiz0 = useGame.getState().cleanCups;
    useGame.getState().tick(0.05);
    let s = useGame.getState();
    expect(s.carriedDirty + s.carriedDirtyFood).toBe(0);
    expect(s.legen).toMatchObject({ bardak: 3, tabak: 1 });
    expect(s.cleanCups).toBe(temiz0); // henüz yıkanmadı
    // Periyodun hemen öncesi: hâlâ leğende.
    const adim = 0.1; // tick büyük dt'yi kırpar — gerçek kare adımı
    for (let t = 0.05; t + adim < C.cups.washBatchSec - 0.1; t += adim) useGame.getState().tick(adim);
    s = useGame.getState();
    expect(s.legen.bardak + s.legen.tabak, 'periyottan önce yıkandı').toBe(4);
    // Periyot dolunca TOPTAN.
    useGame.getState().tick(adim);
    useGame.getState().tick(adim);
    s = useGame.getState();
    expect(s.legen.bardak + s.legen.tabak).toBe(0);
    expect(s.cleanCups + s.ready.tea + s.ready.tost, 'kaplar temiz havuza dönmedi').toBeGreaterThanOrEqual(temiz0 + 4);
  });
});
