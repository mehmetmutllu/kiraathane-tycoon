import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
const OUT = 'docs/gorsel/ss';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()); });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

await page.evaluate((pads) => { window.__setState({ padsDone: pads, padFills: {} }); }, PADS);
await page.waitForTimeout(1500);
await page.evaluate(() => {
  window.__setState({ tableLevels: new Array(24).fill(4), stationLevels: [6] });
  document.body.classList.add('dsb-hide-hud');
});
await page.waitForTimeout(1500);

for (const s of [
  { name: 'olcu-plan-oyun', grid: 0 },
  { name: 'olcu-plan-oyun-grid32', grid: 3.2 },
  { name: 'olcu-plan-oyun-grid40', grid: 4 },
]) {
  await page.evaluate((g) => window.__devPlan({ topDown: true, zoom: 1, gridStep: g }), s.grid);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  console.log('shot', s.name);
}
// perspektif kontrol karesi (plan kapalı) — oyuncu salonun ortasına ışınlanır
await page.evaluate(() => { window.__devPlan({ topDown: false, gridStep: 0 }); window.__teleport(-6, 4); });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/olcu-persp-oyun.png` });
console.log('shot olcu-persp-oyun');
await browser.close();
