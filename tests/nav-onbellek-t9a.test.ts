/**
 * nav-onbellek-t9a.test.ts — T9a BEKÇİSİ (D-145): N2-KESİN çağrı önbelleği ÇIKTIYI DEĞİŞTİRMEZ.
 *
 * ## Neyi koruyor
 * `findNavPath` artık (ızgara, başlangıç HÜCRESİ, tx, tz, reach) anahtarıyla önbelleklenir. Kazanç
 * büyük (tick ×10,1) ama iddia davranışın HİÇ değişmediği — T5'in yol önbelleği aynı iddiayla
 * yola çıkıp duvardan geçen adımı ×19 artırmıştı. Önbellek sessizce yanlış anahtarlanırsa
 * (reach unutulur, hücre yerine kaba bir kutu kullanılır, ızgara değişince temizlenmez) oyun
 * çalışmaya devam eder ama personel BAYAT bir rotayı izler; hiçbir şey çökmez, bu test düşer.
 *
 * ## Yöntem
 * Her sorgu iki kez sorulur: önbellek KAPALI (T5'in birebir algoritması) ve AÇIK (sıcak önbellek).
 * Sorgular aynı hücre içinde farklı konumlardan, farklı `reach`lerle ve iki ızgara arasında gidip
 * gelerek sorulur — anahtarın her parçası ayrı ayrı sınanır. En sonda oyunun kendisi iki kolda
 * koşturulur ve durumun tamamı karşılaştırılır.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { buildNavGrid, findNavPath, navOnbellekAyarla, navOnbellekAcik, type NavGrid } from '../src/game/nav';
import { LAYOUT, NAV_CELL, navSolids, getNavGrid } from '../src/game/layout';
import { useGame, parkSpot, stationSoftMaxLevel, totalCupPool } from '../src/game/store';
import { economyConfig } from '../src/config/economy.config';
import { D } from '../src/game/decimal';
import { seedRandom } from '../tools/olcum-lib';

/** Modül yüklendiği andaki hâl — hiçbir test dokunmadan (üretimin gördüğü varsayılan). */
const VARSAYILAN_ACIK = navOnbellekAcik();

afterEach(() => navOnbellekAyarla(true));

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Yol = [number, number][] | null;
const kopya = (y: Yol): Yol => (y ? y.map(([x, z]) => [x, z] as [number, number]) : null);

/** Önbelleksiz (T5 algoritması) cevap — karşılaştırmanın doğrusu. */
function dogru(grid: NavGrid, s: [number, number, number], tx: number, tz: number, reach: number): Yol {
  navOnbellekAyarla(false);
  const y = kopya(findNavPath(grid, s, tx, tz, reach));
  return y;
}

/** Sıcak önbellekten cevap — önbellek TEMİZLENMEDEN açılır (ayarla temizler; bu yüzden bayrak
 *  yalnız bir kez açılır ve sorgular arka arkaya sorulur). */
function sorgula(sorgular: { grid: NavGrid; s: [number, number, number]; tx: number; tz: number; reach: number }[]) {
  const beklenen = sorgular.map((q) => dogru(q.grid, q.s, q.tx, q.tz, q.reach));
  navOnbellekAyarla(true);
  const gelen = sorgular.map((q) => kopya(findNavPath(q.grid, q.s, q.tx, q.tz, q.reach)));
  return { beklenen, gelen };
}

const REACHLER = [0.4, 0.45, 0.5, 1.0, 1.68];

describe('N2-kesin — anahtarın her parçası', () => {
  const grid = getNavGrid(LAYOUT.tables.length, 3);
  const { minX, minZ, cell, cols, rows } = grid;

  it('aynı hücrenin içindeki farklı konumlar + farklı reach + farklı hedef: 3.000 sorgu birebir', () => {
    const r = rng(20260923);
    const sorgular = [];
    for (let i = 0; i < 1000; i++) {
      const c = Math.floor(r() * cols);
      const w = Math.floor(r() * rows);
      const tx = minX + r() * cols * cell;
      const tz = minZ + r() * rows * cell;
      // Aynı hücrede üç konum: ikisi AYNI hedef/reach (isabet), biri farklı reach (ayrı anahtar).
      for (let k = 0; k < 3; k++) {
        const s: [number, number, number] = [minX + (c + 0.05 + 0.9 * r()) * cell, 0, minZ + (w + 0.05 + 0.9 * r()) * cell];
        const reach = k < 2 ? REACHLER[i % REACHLER.length] : REACHLER[(i + 2) % REACHLER.length];
        sorgular.push({ grid, s, tx, tz, reach });
      }
    }
    const { beklenen, gelen } = sorgula(sorgular);
    let fark = 0;
    for (let i = 0; i < sorgular.length; i++) if (JSON.stringify(beklenen[i]) !== JSON.stringify(gelen[i])) fark++;
    expect(fark).toBe(0);
  });

  it('komşu hücre AYRI anahtardır — hücre sınırının iki yanı karışmaz', () => {
    const r = rng(7);
    const sorgular = [];
    for (let i = 0; i < 600; i++) {
      const c = 1 + Math.floor(r() * (cols - 2));
      const w = 1 + Math.floor(r() * (rows - 2));
      const tx = minX + r() * cols * cell;
      const tz = minZ + r() * rows * cell;
      const reach = REACHLER[i % REACHLER.length];
      const sinir = minX + (c + 1) * cell; // c ile c+1 arasındaki çizgi
      const z = minZ + (w + 0.5) * cell;
      sorgular.push({ grid, s: [sinir - 1e-3, 0, z] as [number, number, number], tx, tz, reach });
      sorgular.push({ grid, s: [sinir + 1e-3, 0, z] as [number, number, number], tx, tz, reach });
    }
    const { beklenen, gelen } = sorgula(sorgular);
    expect(gelen).toEqual(beklenen);
  });

  it('ızgara değişince önbellek temizlenir — aynı anahtar iki ızgarada iki ayrı cevap', () => {
    // Aynı boyut, farklı engel: bir masa eksik. Anahtar (hücre, hedef, reach) iki ızgarada AYNI.
    const a = buildNavGrid(LAYOUT.area, NAV_CELL, navSolids(LAYOUT.tables.length, 3), LAYOUT.actorRadius);
    const b = buildNavGrid(LAYOUT.area, NAV_CELL, navSolids(4, 3), LAYOUT.actorRadius);
    const r = rng(11);
    const sorgular = [];
    let farkliCevap = 0;
    for (let i = 0; i < 400; i++) {
      const s: [number, number, number] = [a.minX + r() * a.cols * a.cell, 0, a.minZ + r() * a.rows * a.cell];
      const t = LAYOUT.tables[i % LAYOUT.tables.length].table;
      const reach = 0.5;
      sorgular.push({ grid: a, s, tx: t[0], tz: t[2], reach });
      sorgular.push({ grid: b, s, tx: t[0], tz: t[2], reach });
      if (JSON.stringify(dogru(a, s, t[0], t[2], reach)) !== JSON.stringify(dogru(b, s, t[0], t[2], reach))) farkliCevap++;
    }
    // Test anlamlı mı: iki ızgara gerçekten farklı cevap veriyor olmalı (yoksa temizlik sınanmaz).
    expect(farkliCevap).toBeGreaterThan(50);
    const { beklenen, gelen } = sorgula(sorgular);
    expect(gelen).toEqual(beklenen);
  });
});

describe('N2-kesin — oyunun kendisi', () => {
  it('üretimde AÇIK (D-145) — varsayılan, kimse açmadan', () => {
    expect(VARSAYILAN_ACIK).toBe(true);
  });

  it('geç oyunda 40 sn: durumun tamamı iki kolda birebir', { timeout: 60_000 }, () => {
    const kos = (acik: boolean) => {
      navOnbellekAyarla(acik);
      seedRandom(4455);
      useGame.getState().hardReset();
      useGame.setState({
        padsDone: economyConfig.pads.map((p) => p.id),
        wallet: D(1e12),
        questIndex: economyConfig.quests.length,
      } as never);
      const s0 = useGame.getState();
      useGame.setState({
        tableLevels: s0.tableLevels.map(() => 4),
        stationLevels: s0.stationLevels.map(() => stationSoftMaxLevel()),
        cleanCups: totalCupPool(s0.areasOpen, s0.stationLevels.map(() => stationSoftMaxLevel())),
      } as never);
      const s1 = useGame.getState();
      useGame.setState({ player: parkSpot(s1.areasOpen, s1.tables) } as never);
      const tick = useGame.getState().tick;
      for (let i = 0; i < 40 * 60; i++) tick(1 / 60);
      const s = useGame.getState();
      return JSON.stringify({
        npcs: s.npcs.map((n) => [n.id, n.state, n.pos]),
        waiters: s.waiters.map((w) => [w.pos, w.tray, w.trayFood]),
        dishwasher: s.dishwasher?.pos,
        dishes: s.dishes.map((d) => [d.id, d.pos]),
        stats: s.stats,
        wallet: s.wallet.toString(),
      });
    };
    const kapali = kos(false);
    const acik = kos(true);
    expect(JSON.parse(kapali).npcs.length).toBeGreaterThan(20); // dünya gerçekten doldu
    expect(acik).toBe(kapali);
  });
});
