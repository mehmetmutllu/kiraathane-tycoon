/**
 * oyuncu-dunyasi.test.ts — D-091'İN BEKÇİSİ: oyuncunun ızgarası oyuncunun dünyasını mı kuruyor?
 *
 * NEDEN: `getNavGrid` PERSONELİN dünyasıdır (`navSolids`, sandalyesiz, `actorRadius` 0,28,
 * alan kelepçesi yok). Oyuncu `activeSolids` (sandalyeler KATI) + `playerRadius` (0,47) +
 * `clampToOpenAreas` ile yürür. Ölçüm (`docs/nav-oyuncu-raporu-d5.md`) bu farkın bedelini
 * saydı: dolu katta rotaların %74,1'i oyuncuya kapalı en az bir ara noktadan geçiyordu.
 * `getPlayerNavGrid` o boşluğu kapatır; bu dosya kapalı KALDIĞINI bekçiler.
 *
 * Testler ızgarayı yeniden kurmaz — `getPlayerNavGrid`'i ÇAĞIRIR (D-090'ın dersi: bekçi kendi
 * kopyasını değil, yürürlükteki kabloyu ölçer). Hüküm üç ayaklı:
 *   1) HÜCRE KURALI  — her hücrenin açık/kapalı hâli oyuncunun collision'ının BİREBİR aynısı
 *   2) İKİ DÜNYA     — fark DOĞRU YÖNDE: sandalye ve yarıçap payı oyuncuya kapalı, personele açık
 *   3) ROTA          — kurulan yolun her ara noktası oyuncunun DURABİLDİĞİ bir yer
 */
import { describe, it, expect } from 'vitest';
import {
  LAYOUT,
  NAV_CELL,
  PAD_RADIUS,
  TABLE_UP_RADIUS,
  activeSolids,
  clampToOpenAreas,
  getNavGrid,
  getPlayerNavGrid,
  hitsSolid,
} from '../src/game/layout';
import { findNavPath, type NavGrid } from '../src/game/nav';
import { MAX_AREAS, areaTableSlots, areaTableStart } from '../src/game/world';

/** Zincirin gerçek açıklıkları (yeni alan açılmadan önce öncekilerin masaları dolar). */
const ACIKLIKLAR: { tables: number; areasOpen: number }[] = [];
for (let a = 1; a <= MAX_AREAS; a++) {
  const bas = areaTableStart(a - 1);
  for (let k = 1; k <= areaTableSlots(a - 1); k++) ACIKLIKLAR.push({ tables: bas + k, areasOpen: a });
}
/** Uçlar + bir orta nokta — her testin 20 açıklığı taraması gereksiz (hüküm aynı). */
const ORNEK = [
  { tables: 1, areasOpen: 1 },
  { tables: 4, areasOpen: 1 },
  { tables: 8, areasOpen: 2 },
  { tables: 20, areasOpen: 3 },
];

const merkez = (g: NavGrid, c: number, r: number): [number, number] => [
  g.minX + (c + 0.5) * g.cell,
  g.minZ + (r + 0.5) * g.cell,
];

const acikAlanda = (x: number, z: number, areasOpen: number): boolean => {
  const [cx, cz] = clampToOpenAreas(x, z, areasOpen);
  return cx === x && cz === z;
};

/** Oyuncu bu noktada DURABİLİR mi? (`playerMoveSystem`in iki kuralı: mobilya + açık alan.) */
const durabilir = (x: number, z: number, tables: number, areasOpen: number): boolean =>
  !hitsSolid(x, z, activeSolids(tables, areasOpen), LAYOUT.playerRadius) && acikAlanda(x, z, areasOpen);

describe('D-091 · oyuncunun ızgarası (getPlayerNavGrid)', () => {
  it('1) HÜCRE KURALI — açık hücre = oyuncunun DURABİLDİĞİ hücre, istisnasız', () => {
    for (const { tables, areasOpen } of ORNEK) {
      const g = getPlayerNavGrid(tables, areasOpen);
      let acik = 0;
      for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.cols; c++) {
          const [x, z] = merkez(g, c, r);
          const bekle = x > LAYOUT.area.maxX || z > LAYOUT.area.maxZ ? false : durabilir(x, z, tables, areasOpen);
          const gercek = !g.blocked[r * g.cols + c];
          expect(gercek, `alan ${areasOpen} masa ${tables} · hücre (${x.toFixed(2)}, ${z.toFixed(2)})`).toBe(bekle);
          if (gercek) acik++;
        }
      }
      expect(acik, `alan ${areasOpen} masa ${tables} · hiç açık hücre yok`).toBeGreaterThan(0);
    }
  });

  it('2a) İKİ DÜNYA — SANDALYE oyuncuya kapalı, personele açık', () => {
    const tables = 4;
    const areasOpen = 1;
    const pg = getPlayerNavGrid(tables, areasOpen);
    const sg = getNavGrid(tables, areasOpen);
    let sandalyeHucresi = 0;
    for (let i = 0; i < tables; i++) {
      const [sx, , sz] = LAYOUT.tables[i].seat;
      const c = Math.floor((sx - pg.minX) / pg.cell);
      const r = Math.floor((sz - pg.minZ) / pg.cell);
      const idx = r * pg.cols + c;
      expect(pg.blocked[idx], `masa ${i + 1} sandalyesi oyuncuya AÇIK görünüyor`).toBe(1);
      if (!sg.blocked[idx]) sandalyeHucresi++;
    }
    // Personel sandalyeyi hiç görmez (`navSolids` sandalyesiz) — dördü de onun için açık olmalı.
    expect(sandalyeHucresi, 'sandalye hücreleri personele de kapalı — iki dünya ayrışmıyor').toBe(tables);
  });

  it('2b) İKİ DÜNYA — YARIÇAP PAYI (0,28 ↔ 0,47) masanın kenarında ayrışır', () => {
    const tables = 4;
    const areasOpen = 1;
    const pg = getPlayerNavGrid(tables, areasOpen);
    const sg = getNavGrid(tables, areasOpen);
    let ayrisan = 0;
    for (let i = 0; i < pg.blocked.length; i++) if (!sg.blocked[i] && pg.blocked[i]) ayrisan++;
    // Ölçülen taban: alan 1 · 4 masa → 206 ayrışan hücre (docs/olcum-nav-oyuncu.txt).
    // Bant geniş tutuldu: yerleşimin her küçük oynaması testi kırmasın, ama AYRIŞMANIN KENDİSİ
    // (sandalye + yarıçap payı) düşerse yakalansın.
    expect(ayrisan).toBeGreaterThan(120);
    expect(ayrisan).toBeLessThan(320);
  });

  it('2c) İKİ DÜNYA — KİLİTLİ ALAN oyuncuya kapalı (personel kelepçesi yoktur)', () => {
    const pg = getPlayerNavGrid(4, 1); // yalnız a0 açık
    const kilitli = LAYOUT.areaBounds[1]; // a1 kapalı
    const x = (kilitli.minX + kilitli.maxX) / 2;
    const z = (kilitli.minZ + kilitli.maxZ) / 2;
    const c = Math.floor((x - pg.minX) / pg.cell);
    const r = Math.floor((z - pg.minZ) / pg.cell);
    expect(pg.blocked[r * pg.cols + c], 'kilitli alan oyuncuya açık görünüyor').toBe(1);
    // Aynı nokta 2 alan açıkken AÇILMALI (kelepçe alana bağlı, sabit maske değil).
    const pg2 = getPlayerNavGrid(8, 2);
    expect(pg2.blocked[r * pg2.cols + c], 'alan açıldı ama ızgara hâlâ kapalı').toBe(0);
  });

  it('3) ROTA — kurulan yolun HER ara noktasında oyuncu durabilir', () => {
    for (const { tables, areasOpen } of ORNEK) {
      const g = getPlayerNavGrid(tables, areasOpen);
      const bas = [LAYOUT.player[0], LAYOUT.player[1], LAYOUT.player[2]] as const;
      const hedefler: { ad: string; x: number; z: number; r: number }[] = [];
      for (let i = 0; i < tables; i++) {
        const u = LAYOUT.tables[i].upgradeSpot;
        hedefler.push({ ad: `masa${i + 1} yükseltme`, x: u[0], z: u[2], r: TABLE_UP_RADIUS });
      }
      for (const [id, p] of Object.entries(LAYOUT.padPos)) {
        if (!acikAlanda(p[0], p[2], areasOpen)) continue;
        hedefler.push({ ad: `pad ${id}`, x: p[0], z: p[2], r: PAD_RADIUS });
      }
      let yolBulunan = 0;
      for (const h of hedefler) {
        const yol = findNavPath(g, bas, h.x, h.z, h.r);
        if (!yol || !yol.length) continue;
        yolBulunan++;
        for (const [wx, wz] of yol) {
          expect(
            durabilir(wx, wz, tables, areasOpen),
            `alan ${areasOpen} masa ${tables} · ${h.ad} · ara nokta (${wx.toFixed(2)}, ${wz.toFixed(2)}) oyuncuya KAPALI`,
          ).toBe(true);
        }
      }
      expect(yolBulunan, `alan ${areasOpen} masa ${tables} · hiç rota kurulamadı`).toBeGreaterThan(0);
    }
  });

  it('4) ÖNBELLEK — ızgara hem masa hem alan sayısına göre tazelenir', () => {
    const a = getPlayerNavGrid(1, 1);
    const b = getPlayerNavGrid(4, 1);
    const c = getPlayerNavGrid(4, 2);
    const say = (g: NavGrid) => g.blocked.reduce((t: number, v: number) => t + (v ? 0 : 1), 0);
    // Masa eklendi → açık hücre AZALIR. Alan açıldı → ARTAR. İkisi de önbellek anahtarında olmalı.
    expect(say(a), 'masa sayısı önbellek anahtarında değil').toBeGreaterThan(say(b));
    expect(say(c), 'alan sayısı önbellek anahtarında değil').toBeGreaterThan(say(b));
    // Aynı anahtar ARKA ARKAYA aynı nesneyi vermeli (ızgara her karede yeniden kurulmaz).
    // Önbellek TEK YUVALI — `navCache` ile aynı desen: oyunda tek açıklık yürürlüktedir, araç ve
    // testler açıklık değiştirdiğinde ızgara yeniden kurulur (11k hücre, ölçülmüş maliyet yok).
    const d = getPlayerNavGrid(9, 3);
    expect(getPlayerNavGrid(9, 3)).toBe(d);
  });

  it('5) YERLEŞİM — zincirin HER açıklığında oyuncunun dünyası tek parça', () => {
    // Ölçümün k3 hükmü (cep 0 · bileşen 1) bir YERLEŞİM güvencesidir: mobilya oynayınca oyuncu
    // bir cebe hapsolabilir ya da içerik kilitli kalabilir. 20 açıklığın hepsi taranır.
    for (const { tables, areasOpen } of ACIKLIKLAR) {
      const g = getPlayerNavGrid(tables, areasOpen);
      const bil = new Int32Array(g.blocked.length).fill(-1);
      const bas = [LAYOUT.player[0], LAYOUT.player[1], LAYOUT.player[2]] as const;
      let sc = Math.floor((bas[0] - g.minX) / g.cell);
      let sr = Math.floor((bas[2] - g.minZ) / g.cell);
      sc = Math.max(0, Math.min(g.cols - 1, sc));
      sr = Math.max(0, Math.min(g.rows - 1, sr));
      const basIdx = sr * g.cols + sc;
      expect(g.blocked[basIdx], `alan ${areasOpen} masa ${tables} · oyuncunun doğduğu hücre KAPALI`).toBe(0);
      const q = [basIdx];
      bil[basIdx] = 0;
      let bagli = 1;
      for (let h = 0; h < q.length; h++) {
        const idx = q[h];
        const r = Math.floor(idx / g.cols);
        const c = idx - r * g.cols;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
          const nc = c + dc;
          const nr = r + dr;
          if (nc < 0 || nc >= g.cols || nr < 0 || nr >= g.rows) continue;
          const ni = nr * g.cols + nc;
          if (g.blocked[ni] || bil[ni] >= 0) continue;
          if (dc !== 0 && dr !== 0 && (g.blocked[r * g.cols + nc] || g.blocked[nr * g.cols + c])) continue;
          bil[ni] = 0;
          q.push(ni);
          bagli++;
        }
      }
      const acik = g.blocked.reduce((t: number, v: number) => t + (v ? 0 : 1), 0);
      expect(bagli, `alan ${areasOpen} masa ${tables} · doğuş bileşeni dışında ${acik - bagli} hücrelik CEP var`).toBe(acik);
    }
  });

  it('6) HÜCRE BOYU — oyuncu ızgarası personelinkiyle AYNI ızgaradır (hücreler karşılaştırılabilir)', () => {
    const pg = getPlayerNavGrid(4, 1);
    const sg = getNavGrid(4, 1);
    expect(pg.cell).toBe(NAV_CELL);
    expect([pg.cols, pg.rows, pg.minX, pg.minZ]).toEqual([sg.cols, sg.rows, sg.minX, sg.minZ]);
  });
});
