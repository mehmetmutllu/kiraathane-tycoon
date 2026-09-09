/** shot-mutfak-tema.mjs — her mutfak temasının oyun içi karesi (mağaza kartı + karar için). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
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
await page.waitForTimeout(1200);
await page.evaluate(() => document.body.classList.add('dsb-hide-hud'));
await page.evaluate(() => { window.__devPlan({ topDown: false, gridStep: 0 }); window.__teleport(-11, -8.4); });
await page.waitForTimeout(2500);
for (const tema of ['klasik', 'kiremit', 'cini', 'zeytin', 'bakir']) {
  await page.evaluate((t) => window.__setState({ kitchenTheme: t }), tema);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/s4-tema-${tema}.png` });
}
await page.evaluate(() => window.__setState({ kitchenTheme: 'klasik' }));
console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'konsol temiz');
await browser.close();
