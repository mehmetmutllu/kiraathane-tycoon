/**
 * shot-wc-s7.mjs — S7'nin GÖRSEL tabanı: WC odası bugün ekranda NASIL duruyor?
 *
 * NEDEN: §V odanın parçalarının kaç kareden göründüğünü SAYIYLA veriyor, ama "kabin kapıları kötü"
 * bir GÖRSEL yargı ve karar paketine sayı kadar ekran görüntüsü de girmeli. Ayrıca bu tur bir kez
 * daha gösterdi ki (door_A okuması) sayı ile ekran birbirinin yerine geçmiyor.
 *
 * Sunucuyu kendi kaldırır (duman.mjs deseni). Kullanım: node tools/shot-wc-s7.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SHOT_PORT ?? 5198);
const OUT = 'docs/gorsel/ss';
mkdirSync(OUT, { recursive: true });

const PADS =
  'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo'.split(
    ' ',
  );

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', (d) => process.stderr.write(`  [vite] ${d}`));

const url = `http://127.0.0.1:${PORT}/`;
let hazir = false;
for (let i = 0; i < 60 && !hazir; i++) {
  try {
    hazir = (await fetch(url)).ok;
  } catch {
    await new Promise((r) => setTimeout(r, 400));
  }
}
if (!hazir) {
  console.error(`shot-wc: vite ${PORT} portunda ayaga kalkmadi (SHOT_PORT ile degistir)`);
  sunucu.kill();
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
await page.waitForTimeout(1500);
await page.evaluate(() => document.body.classList.add('dsb-hide-hud'));
await page.evaluate(() => window.__devPlan({ topDown: false, gridStep: 0 }));

// Kadrajlar: oyuncunun z tavanı bandın önünde (−9,8) — teleport oraya kelepçelenir, doğrusu bu:
// odaya oyuncu GİREMİYOR, kamera kapının önünden bakıyor. Kararın konusu tam olarak bu manzara.
const KADRAJ = [
  ['kapi-onu', 13.4, -9.0],
  ['kapi-onu-yakin', 13.4, -8.0],
  ['oda-sol', 8.0, -9.0],
  ['oda-genel', 11.0, -6.0],
];
for (const [ad, x, z] of KADRAJ) {
  await page.evaluate(([px, pz]) => window.__teleport(px, pz), [x, z]);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/s7-${ad}.png` });
  console.log('çekildi:', ad);
}
console.log(errs.length ? 'KONSOL HATASI: ' + errs.join(' | ') : 'konsol temiz');
await browser.close();
sunucu.kill();
