/**
 * shot-dekor-s5.mjs — S5 dekor geçişinin görsel doğrulaması.
 * Üç kadraj: giriş (paspas + lamba + kaktüs) · sol duvar (konsol + tablo) · sağ duvar (kitaplık).
 * Kullanım: npm run dev açıkken → node tools/shot-dekor-s5.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo'.split(' ');
const OUT = 'docs/gorsel/ss';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
await page.waitForTimeout(1500);
await page.evaluate(() => document.body.classList.add('dsb-hide-hud'));
await page.evaluate(() => window.__devPlan({ topDown: false, gridStep: 0 }));

const KADRAJ = [
  ['giris', 0, 12.5],
  ['sol-duvar', -13.5, 6.0],
  ['sag-duvar', 13.5, 12.5],
  ['kitaplik', 13.0, 14.6],
  ['tablo', -13.5, 3.0],
];
for (const [ad, x, z] of KADRAJ) {
  await page.evaluate(([px, pz]) => window.__teleport(px, pz), [x, z]);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/s5-dekor-${ad}.png` });
  console.log('çekildi:', ad);
}
console.log(errs.length ? 'KONSOL HATASI: ' + errs.join(' | ') : 'konsol temiz');
await browser.close();
