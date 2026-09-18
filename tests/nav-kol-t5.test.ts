/**
 * nav-kol-t5.test.ts — T5 BEKÇİSİ: hızlanan `findNavPath` ESKİSİYLE BİREBİR AYNI yolu döndürür.
 *
 * ## Neyi koruyor
 * T5 üç kol uyguladı (`src/game/nav.ts`): kalıcı tampon + kuşak damgası (N1a), hedef testini
 * pop yerine push'ta yapmak (N1b), hedef hücre maskesini önden kurmak (N1c). Üçü de **hız**
 * için seçildi; iddiaları **davranışın hiç değişmediği**. Ölçüm bunu 12.000 çağrıda gösterdi
 * ama ölçüm bir koşunun fotoğrafıdır — bekçi kalıcı kanıttır.
 *
 * ## Yöntem: ORACLE
 * `tools/nav-oracle.ts` T5 öncesi algoritmanın donmuş kopyasıdır. Her denetim aynı ızgarada,
 * aynı argümanlarla ikisini de çağırır ve **dizileri birebir** karşılaştırır (uzunluk + her
 * waypoint'in x/z'si). Tek bir farkta test düşer.
 *
 * ## Neden rastgele çiftler
 * Elle seçilmiş birkaç başlangıç/hedef, kolların ayrıldığı yeri kaçırır: N1b son BFS katmanında,
 * N1c hedefin çevresindeki hücre kümesinde ayrışır. Bunlar ancak hedefin ızgaraya göre
 * konumu değiştikçe ortaya çıkar. Tohum SABİT (`mulberry32`) — düşen bir denetim tekrar
 * üretilebilir olsun.
 *
 * ## Kapsanan kenar durumlar (ölçüm korpusunda ender, kolların ayrıldığı yer tam burası)
 *   · başlangıç engelin İÇİNDE  → `nearestFreeIdx` snap'i (N1a kuşak damgasına döndü)
 *   · hedef ızgaranın DIŞINDA   → N1c'nin maske kutusu kelepçeleniyor
 *   · hedefe hiçbir hücre yakın değil → N1c erken `null` döner, eski kod ızgarayı gezip dönerdi
 *   · hedef ULAŞILAMAZ (duvarla çevrili) → ikisi de tüm ızgarayı gezip `null` döner
 *   · `reach` çok büyük / çok küçük → maske kutusunun iki ucu
 */
import { describe, it, expect } from 'vitest';
import { buildNavGrid, findNavPath, type NavGrid, type NavSolid } from '../src/game/nav';
import { navPathOracle } from '../tools/nav-oracle';
import { LAYOUT, NAV_CELL, navSolids, getNavGrid, getPlayerNavGrid } from '../src/game/layout';

/** Tohumlu rastgelelik — düşen denetim tekrar üretilebilsin. */
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

function esitMi(a: Yol, b: Yol): boolean {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  return true;
}

function biciml(y: Yol): string {
  if (y === null) return 'null';
  return `${y.length} wp [${y.slice(0, 3).map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`).join(' ')}…]`;
}

/** Bir çifti iki algoritmayla koştur; fark varsa okunur bir mesajla düş. */
function karsilastir(
  ad: string,
  g: NavGrid,
  s: readonly [number, number, number],
  tx: number,
  tz: number,
  reach: number,
): void {
  const yeni = findNavPath(g, s, tx, tz, reach);
  const eski = navPathOracle(g, s, tx, tz, reach);
  if (!esitMi(yeni, eski)) {
    throw new Error(
      `${ad}: yol AYRIŞTI\n  start=[${s[0].toFixed(3)}, ${s[2].toFixed(3)}] hedef=[${tx.toFixed(3)}, ${tz.toFixed(3)}] reach=${reach}\n` +
      `  yeni  ${biciml(yeni)}\n  oracle ${biciml(eski)}`,
    );
  }
}

/** Rastgele engellerle sentetik ızgara — gerçek yerleşimin kapsamadığı topolojiler. */
function sentetikIzgara(r: () => number, cols: number, rows: number, doluluk: number): NavGrid {
  const g: NavGrid = {
    cols, rows, cell: 0.3, minX: -cols * 0.15, minZ: -rows * 0.15,
    blocked: new Uint8Array(cols * rows),
  };
  for (let i = 0; i < cols * rows; i++) if (r() < doluluk) g.blocked[i] = 1;
  return g;
}

const dunyaIzgaralari = (): { ad: string; g: NavGrid }[] => {
  const out: { ad: string; g: NavGrid }[] = [];
  const enCokAlan = LAYOUT.areaBounds.length; // 3 (dordunculeri kelepce cokertirdi)
  for (const [masa, alan] of [[4, 1], [8, 2], [LAYOUT.tables.length, enCokAlan]] as [number, number][]) {
    out.push({ ad: `personel ${masa}masa/${alan}alan`, g: getNavGrid(masa, alan) });
    out.push({ ad: `oyuncu ${masa}masa/${alan}alan`, g: getPlayerNavGrid(masa, alan) });
  }
  return out;
};

describe('T5 nav kolları — oracle ile birebir aynı', () => {
  it('gerçek dünya ızgaralarında rastgele 1.500 çift', () => {
    const r = rng(20260919);
    let sayi = 0;
    for (const { ad, g } of dunyaIzgaralari()) {
      const genisX = g.cols * g.cell;
      const genisZ = g.rows * g.cell;
      for (let i = 0; i < 250; i++) {
        const sx = g.minX + r() * genisX;
        const sz = g.minZ + r() * genisZ;
        const tx = g.minX + r() * genisX;
        const tz = g.minZ + r() * genisZ;
        const reach = 0.3 + r() * 1.5;
        karsilastir(`${ad} #${i}`, g, [sx, 0.6, sz], tx, tz, reach);
        sayi++;
      }
    }
    expect(sayi).toBe(1500);
  });

  it('gerçek hedeflere (masa · koltuk · servis) gerçek başlangıçlardan', () => {
    const g = getNavGrid(LAYOUT.tables.length, LAYOUT.areaBounds.length);
    const reachler = [0.4, 0.45, 0.5, 1.4, 1.47, 1.68]; // korpusta görülen tüm reach değerleri
    let sayi = 0;
    for (const t of LAYOUT.tables) {
      for (const baslangic of [t.seat, t.upgradeSpot, LAYOUT.tables[0].table]) {
        for (const reach of reachler) {
          karsilastir('gerçek hedef', g, [baslangic[0], 0.6, baslangic[2]], t.table[0], t.table[2], reach);
          sayi++;
        }
      }
    }
    expect(sayi).toBeGreaterThan(100);
  });

  it('başlangıç engelin İÇİNDE (nearestFreeIdx snap kolu)', () => {
    const g = getNavGrid(LAYOUT.tables.length, LAYOUT.areaBounds.length);
    let bloklu = 0;
    for (const t of LAYOUT.tables) {
      const [c, rr] = [
        Math.floor((t.table[0] - g.minX) / g.cell),
        Math.floor((t.table[2] - g.minZ) / g.cell),
      ];
      if (c < 0 || c >= g.cols || rr < 0 || rr >= g.rows) continue;
      if (!g.blocked[rr * g.cols + c]) continue;
      bloklu++;
      for (const hedef of LAYOUT.tables) {
        karsilastir('masa içinden', g, [t.table[0], 0.6, t.table[2]], hedef.table[0], hedef.table[2], 1.4);
      }
    }
    // Masa merkezleri ızgarada KAPALI olmalı; değilse bu denetim boşa koşuyor demektir.
    expect(bloklu).toBeGreaterThan(0);
  });

  it('hedef ızgaranın DIŞINDA / hiçbir hücre menzilde değil', () => {
    const g = getNavGrid(LAYOUT.tables.length, LAYOUT.areaBounds.length);
    const disHedefler: [number, number][] = [
      [g.minX - 50, 0], [g.minX + g.cols * g.cell + 50, 0],
      [0, g.minZ - 50], [0, g.minZ + g.rows * g.cell + 50],
      [g.minX - 1e6, g.minZ - 1e6],
    ];
    for (const [tx, tz] of disHedefler) {
      for (const reach of [0.4, 1.68, 5]) {
        karsilastir('ızgara dışı hedef', g, [LAYOUT.tables[0].seat[0], 0.6, LAYOUT.tables[0].seat[2]], tx, tz, reach);
      }
    }
    // Menzil sıfıra yakınsa hiçbir hücre merkezi yakalanmayabilir — iki kod da null demeli.
    for (const reach of [0, 1e-6, 0.01]) {
      karsilastir('menzil ~0', g, [0, 0.6, 0], 0.15, 0.15, reach);
    }
  });

  it('ULAŞILAMAZ hedef — ikisi de tüm ızgarayı gezip null döner', () => {
    // Ortada duvarla çevrili bir oda: içine giriş yok.
    const solids: NavSolid[] = [
      { c: [0, 0, 2], h: [3, 0.2] }, { c: [0, 0, -2], h: [3, 0.2] },
      { c: [2, 0, 0], h: [0.2, 3] }, { c: [-2, 0, 0], h: [0.2, 3] },
    ];
    const g = buildNavGrid({ minX: -6, maxX: 6, minZ: -6, maxZ: 6 }, NAV_CELL, solids, 0.28);
    karsilastir('kapalı oda', g, [-5, 0.6, -5], 0, 0, 0.4);
    expect(findNavPath(g, [-5, 0.6, -5], 0, 0, 0.4)).toBeNull();
  });

  it('sentetik ızgaralar — farklı boyut ve doluluk, 2.400 çift', () => {
    const r = rng(777);
    let sayi = 0;
    for (const [cols, rows] of [[9, 7], [31, 23], [64, 48], [114, 90]] as [number, number][]) {
      for (const doluluk of [0, 0.1, 0.35]) {
        const g = sentetikIzgara(r, cols, rows, doluluk);
        for (let i = 0; i < 200; i++) {
          const sx = g.minX + r() * cols * g.cell;
          const sz = g.minZ + r() * rows * g.cell;
          const tx = g.minX + r() * cols * g.cell;
          const tz = g.minZ + r() * rows * g.cell;
          karsilastir(`sentetik ${cols}x${rows} d=${doluluk} #${i}`, g, [sx, 0.6, sz], tx, tz, 0.3 + r() * 1.5);
          sayi++;
        }
      }
    }
    expect(sayi).toBe(2400);
  });

  it('ızgara boyu DEĞİŞİNCE kalıcı tampon doğru büyür (küçük → büyük → küçük)', () => {
    const r = rng(42);
    const kucuk = sentetikIzgara(r, 11, 9, 0.15);
    // 200×160 = 32.000 hücre, dünyanın en büyük ızgarasından (114×90 = 10.260) BÜYÜK.
    // Neden böyle: bu denetim önce 114×90 kullanıyordu, ama dosyadaki ÖNCEKİ denetimler
    // tamponu zaten o boyda kurduğu için BÜYÜME hiç denenmiyordu — mutasyon sınavı bunu
    // yakaladı (`tools/mutasyon-nav-t5.mjs` M5 kaçmıştı). Artık sıradan bağımsız.
    const buyuk = sentetikIzgara(r, 200, 160, 0.15);
    // Sıra önemli: tampon önce küçüğe göre kurulur, sonra büyümek zorunda kalır, sonra
    // küçüğe dönülünce ESKİ kuşak damgaları tamponda durur — kirli damga okunmamalı.
    for (const g of [kucuk, buyuk, kucuk, buyuk, kucuk]) {
      for (let i = 0; i < 60; i++) {
        const sx = g.minX + r() * g.cols * g.cell;
        const sz = g.minZ + r() * g.rows * g.cell;
        const tx = g.minX + r() * g.cols * g.cell;
        const tz = g.minZ + r() * g.rows * g.cell;
        karsilastir(`boyut değişimi ${g.cols}x${g.rows} #${i}`, g, [sx, 0.6, sz], tx, tz, 0.3 + r() * 1.2);
      }
    }
  });

  it('aynı çağrı arka arkaya AYNI yolu döndürür (kalıcı tampon sızdırmıyor)', () => {
    const g = getNavGrid(LAYOUT.tables.length, LAYOUT.areaBounds.length);
    const s: [number, number, number] = [LAYOUT.tables[0].seat[0], 0.6, LAYOUT.tables[0].seat[2]];
    const hedef = LAYOUT.tables[LAYOUT.tables.length - 1].table;
    const ilk = findNavPath(g, s, hedef[0], hedef[2], 1.4);
    for (let i = 0; i < 50; i++) {
      // Araya BAŞKA çağrılar girsin: tampon paylaşıldığı için kirlenme ancak böyle görünür.
      findNavPath(g, [0, 0.6, 0], LAYOUT.tables[1].table[0], LAYOUT.tables[1].table[2], 0.5);
      expect(esitMi(findNavPath(g, s, hedef[0], hedef[2], 1.4), ilk)).toBe(true);
    }
  });

  it('navSolids ızgarası (yerleşimden türeyen) — servis noktalarına', () => {
    const g = buildNavGrid(LAYOUT.area, NAV_CELL, navSolids(LAYOUT.tables.length, LAYOUT.areaBounds.length), LAYOUT.actorRadius);
    const r = rng(31337);
    for (let i = 0; i < 300; i++) {
      const t = LAYOUT.tables[Math.floor(r() * LAYOUT.tables.length)];
      const sx = g.minX + r() * g.cols * g.cell;
      const sz = g.minZ + r() * g.rows * g.cell;
      karsilastir(`navSolids #${i}`, g, [sx, 0.6, sz], t.table[0], t.table[2], 0.4 + r());
    }
  });
});
