/**
 * olcum-nav-korpus-t5b.ts — T5b'nin İKİNCİ YARISI: **aynı korpus, iki ortam.**
 *
 * ## Çözdüğü şey
 * T5 node'da `oracle/üretim = ×2,52` ölçtü. T5b'nin tarayıcı A/B'si — denetim kolu temiz,
 * gölge sabit, ABBA deseni — aynı oranı **×1,04** ölçtü. İkisi de temiz koşu, yani biri
 * "yanlış" değil: **farklı bir şey ölçüyorlar.** İki şüpheli var ve ayrılmaları gerekir:
 *
 *   ① **ORTAM**  — tarayıcıdaki JIT/ölçüm davranışı farkı eziyor olabilir.
 *   ② **KORPUS** — node'un korpusu `tick()`i BAŞSIZ koşturarak toplanıyor
 *                  (`tools/olcum-nav-t5.ts` → `korpusTopla`). O dünyadaki çağrılar
 *                  tarayıcının canlı çağrılarından daha pahalı olabilir (daha uzun arama).
 *
 * Bu araç tarayıcının GERÇEK çağrılarını node'da oynatır. Böylece dört hücrenin dördü de dolar:
 *
 *   |                  | node korpusu | tarayıcı korpusu |
 *   | node'da ölçülen  |    ×2,52     |   BU ARAÇ        |
 *   | tarayıcıda ölç.  |      —       |    ×1,04         |
 *
 * Sonuç ×2,5 civarıysa şüpheli **ORTAM**. ×1,0 civarıysa şüpheli **KORPUS** — ve o zaman
 * `olcum-nav-t5.ts`in başsız dünyası gerçek oyunu temsil etmiyor demektir. Bu ikincisi
 * N2 (yol önbelleği) turunu doğrudan ilgilendirir: o kol da aynı korpusla seçilecekti.
 *
 * ## Yan ürün: BEDAVA EŞİTLİK SINAVI
 * Bekçi (`tests/nav-kol-t5.test.ts`) eşitliği ÜRETİLMİŞ çiftlerde doğruluyor. Burada aynı
 * iddia tarayıcının gerçek çağrılarında sınanır — kol "birebir aynı" diyorsa, oyunun kendi
 * çağrılarında da bir kez bile sapmamalı.
 *
 * Koşu:  npx tsx tools/olcum-nav-korpus-t5b.ts
 *        (girdi: docs/olcum-nav-korpus-t5b.json — `tools/olcum-nav-ab-t5b.mjs` üretir)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findNavPath, navKolAyarla, navKolAdi, type NavGrid } from '../src/game/nav';
import { navPathOracle } from './nav-oracle';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** `T5B_ETIKET=telefon` → o koşulun korpusu. Etiketsiz koşu yoktur: iki KOŞUL da adıyla durur. */
const ETIKET = (process.env.T5B_ETIKET || 'masaustu').trim();
const GIRDI = path.join(KOK, `docs/olcum-nav-korpus-t5b-${ETIKET}.json`);
const CIKTI = path.join(KOK, `docs/olcum-nav-korpus-t5b-${ETIKET}.txt`);

const f2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const f3 = (n: number) => (Math.round(n * 1000) / 1000).toFixed(3).replace('.', ',');
const tr = (n: number) => Math.round(n).toLocaleString('tr-TR');

const satirlar: string[] = [];
const yaz = (s = '') => { satirlar.push(s); console.log(s); };
let cikis = 0;
const damga = (ad: string, tamam: boolean, not = '') => {
  if (!tamam) cikis = 1;
  yaz(`  ${tamam ? '✓' : '✗'} ${ad.padEnd(34)} ${not}`);
};

if (!fs.existsSync(GIRDI)) {
  console.error(`korpus yok: ${path.relative(KOK, GIRDI)}\n→ once: node tools/olcum-nav-ab-t5b.mjs`);
  process.exit(1);
}

interface Dokum {
  izgaraSayisi: number;
  cagriSayisi: number;
  grid: { cols: number; rows: number; cell: number; minX: number; minZ: number; blocked: number[] } | null;
  cagrilar: number[][];
}
const d = JSON.parse(fs.readFileSync(GIRDI, 'utf8')) as Dokum;
if (!d.grid || d.cagrilar.length === 0) {
  console.error('korpus bos veya izgarasiz');
  process.exit(1);
}

const grid: NavGrid = {
  cols: d.grid.cols,
  rows: d.grid.rows,
  cell: d.grid.cell,
  minX: d.grid.minX,
  minZ: d.grid.minZ,
  blocked: Uint8Array.from(d.grid.blocked),
};

yaz('='.repeat(78));
yaz(`T5b · AYNI KORPUS, IKI ORTAM — tarayicinin gercek cagrilari NODE da oynatildi (${ETIKET})`);
yaz('='.repeat(78));
yaz(`korpus     : ${tr(d.cagrilar.length)} cagri · izgara ${grid.cols}x${grid.rows} = ${tr(grid.cols * grid.rows)} hucre`);
const doluluk = Array.from(grid.blocked).filter((x) => x).length;
yaz(`izgara      : ${tr(doluluk)} kapali hucre (%${f2((doluluk / (grid.cols * grid.rows)) * 100)})`);
yaz('');

/** Bir kolu korpusun tamamında `tekrar` kez koştur; medyan toplam süreyi ms/çağrı'ya çevir. */
function olc(kol: 'uretim' | 'oracle', tekrar: number): number {
  navKolAyarla(kol === 'oracle' ? navPathOracle : null);
  if (navKolAdi() !== kol) throw new Error(`DAMGA IHLALI: ${kol} istendi, ${navKolAdi()} takili`);
  const olcumler: number[] = [];
  for (let t = 0; t < tekrar; t++) {
    const b = process.hrtime.bigint();
    for (const c of d.cagrilar) findNavPath(grid, [c[0], c[1], c[2]], c[3], c[4], c[5]);
    olcumler.push(Number(process.hrtime.bigint() - b) / 1e6);
  }
  olcumler.sort((a, b) => a - b);
  return olcumler[olcumler.length >> 1] / d.cagrilar.length;
}

// ISINMA: iki yol da JIT'lensin, ilk kol avantajlı olmasın.
olc('uretim', 1); olc('oracle', 1);

/* ABBA — node'da da aynı desen: makine sürüklenmesi bir kolun üstüne yazılmasın. */
const TEKRAR = 5;
const aOlc: number[] = [], bOlc: number[] = [];
for (let blok = 0; blok < 3; blok++) {
  aOlc.push(olc('uretim', TEKRAR));
  bOlc.push(olc('oracle', TEKRAR));
  bOlc.push(olc('oracle', TEKRAR));
  aOlc.push(olc('uretim', TEKRAR));
}
navKolAyarla(null);
const ort = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const uretim = ort(aOlc);
const oracle = ort(bOlc);
const oran = oracle / uretim;

yaz('--- §A MALIYET (ayni korpus, node) ---');
yaz(`  uretim : ${f3(uretim)} ms/cagri`);
yaz(`  oracle : ${f3(oracle)} ms/cagri`);
yaz(`  → oracle/uretim = x${f2(oran)}`);
yaz('');

yaz('--- §B DORT HUCRE ---');
yaz('  olculen ortam \\ korpus  |  node korpusu  |  tarayici korpusu');
yaz(`  node                    |     x2,52      |     x${f2(oran)}`);
yaz('  tarayici                |       —        |     x1,04  (olcum-nav-ab-t5b)');
yaz('');
const supheli = oran >= 2.0 ? 'ORTAM' : oran <= 1.4 ? 'KORPUS' : 'KARISIK (ikisi de pay sahibi)';
yaz(`  → SUPHELI: ${supheli}`);
if (supheli === 'KORPUS') {
  yaz('    Yani tarayicinin GERCEK cagrilari node da ucuz. Fark ortamdan degil, olcum');
  yaz('    korpusundan geliyor: `olcum-nav-t5.ts`in BASSIZ dunyasi oyunun gercek cagrilarini');
  yaz('    temsil etmiyor. T5 kolu yanlis degil ama kazanci ABARTILI olculmus.');
} else if (supheli === 'ORTAM') {
  yaz('    Ayni korpus node da x2,5 veriyorsa fark ortamdadir; tarayici olcumu kolun');
  yaz('    kazancini gosteremiyor demektir (JIT/olcum granulerligi).');
}
yaz('');

yaz('--- §C ESITLIK: kol tarayicinin GERCEK cagrilarinda da birebir ayni mi ---');
let sapma = 0, bosUretim = 0, bosOracle = 0;
for (const c of d.cagrilar) {
  navKolAyarla(null);
  const a = findNavPath(grid, [c[0], c[1], c[2]], c[3], c[4], c[5]);
  navKolAyarla(navPathOracle);
  const b = findNavPath(grid, [c[0], c[1], c[2]], c[3], c[4], c[5]);
  if (a === null) bosUretim++;
  if (b === null) bosOracle++;
  if (a === null || b === null) { if ((a === null) !== (b === null)) sapma++; continue; }
  if (a.length !== b.length) { sapma++; continue; }
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) { sapma++; break; }
  }
}
navKolAyarla(null);
yaz(`  karsilastirilan cagri : ${tr(d.cagrilar.length)}`);
yaz(`  yol bulunamayan       : uretim ${tr(bosUretim)} · oracle ${tr(bosOracle)}`);
yaz('');

yaz('--- DAMGALAR ---');
damga('korpus tek izgarali', d.izgaraSayisi === 1, `${d.izgaraSayisi} izgara nesnesi`);
damga('korpus dolu', d.cagrilar.length >= 500, `${tr(d.cagrilar.length)} cagri`);
damga('kol farki YOK (birebir ayni)', sapma === 0, `${tr(sapma)} sapma`);
damga('kol damgasi uretime dondu', navKolAdi() === 'uretim', navKolAdi());
yaz('');

fs.writeFileSync(CIKTI, satirlar.join('\n') + '\n', 'utf8');
console.log(`→ ${path.relative(KOK, CIKTI)}`);
process.exit(cikis);
