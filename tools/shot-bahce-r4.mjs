/**
 * shot-bahce-r4.mjs — D-129'un SONUÇ KARELERİ: bahçe `areasOpen` ile geri çekiliyor mu?
 *
 * Kararın kendisi bir kapsam kararıydı (*"alan olarak açmadığım her yer öyle olsun"*), yani
 * doğrulanacak şey tek bir kare değil DİZİ: aynı noktadan, yalnız açık alan sayısı değişerek.
 * 1 alan → sağ yarı ve arka yarı bahçe · 2 alan → yalnız arka yarı · 3 alan → yalnız dış kuşak.
 *
 * Kullanım: node tools/shot-bahce-r4.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const KOK = path.resolve('.');
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = Number(process.env.R4_PORT || 5430);

const A2 = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4'.split(' ');
const A3 =
  'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8'.split(
    ' ',
  );

/** Aynı konumdan üç aşama + iki yakın kare. */
const KARELER = [
  { ad: 'alan1', pads: [], konum: [-8.5, 8] },
  { ad: 'alan2', pads: A2, konum: [-8.5, 8] },
  { ad: 'alan3', pads: A3, konum: [-8.5, 8] },
  { ad: 'alan1-kenar', pads: [], konum: [-14, 3] },
  { ad: 'alan1-sag', pads: [], konum: [-2, 6] },
  { ad: 'alan3-dis', pads: A3, konum: [14, 8] },
];

mkdirSync(OUT, { recursive: true });
const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', () => {});
const bekle = async () => {
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true;
    } catch {
      /* bekle */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const hatalar = [];
  for (const k of KARELER) {
    const p = await b.newPage({ viewport: { width: 1100, height: 750 }, deviceScaleFactor: 1 });
    p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message));
    p.on('console', (m) => {
      if (m.type() === 'error') hatalar.push('CONSOLE ' + m.text());
    });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await p.waitForSelector('canvas', { timeout: 60000 });
    await p.waitForTimeout(3200);
    if (k.pads.length) {
      await p.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), k.pads);
      await p.waitForTimeout(1400);
    }
    await p.evaluate(() => {
      document.body.classList.add('dsb-hide-hud');
      window.__devPlan({ topDown: false, gridStep: 0 });
    });
    await p.evaluate(([x, z]) => window.__teleport(x, z), k.konum);
    await p.waitForTimeout(2600);
    const durum = await p.evaluate(() => {
      const g = window.__game();
      return { areasOpen: g.areasOpen, perf: window.__perf ? window.__perf() : null };
    });
    await p.screenshot({ path: `${OUT}/r4-son-${k.ad}.png` });
    console.log(
      `${k.ad.padEnd(13)} areasOpen=${durum.areasOpen} · çizim çağrısı ${durum.perf?.calls ?? '?'} · üçgen ${durum.perf?.tris ?? '?'} → r4-son-${k.ad}.png`,
    );
    await p.close();
  }
  console.log(hatalar.length ? 'KONSOL HATASI:\n' + hatalar.join('\n') : 'konsol temiz — 0 hata');
  await b.close();
} finally {
  sunucu.kill();
}
