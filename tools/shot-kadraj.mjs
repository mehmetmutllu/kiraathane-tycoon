import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
const OUT = 'docs/gorsel/ss';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.evaluate((pads) => { window.__setState({ padsDone: pads, padFills: {} }); }, PADS);
await page.waitForTimeout(1200);
await page.evaluate(() => {
  window.__setState({ tableLevels: new Array(24).fill(4), stationLevels: [6] });
  document.body.classList.add('dsb-hide-hud');
});
await page.waitForTimeout(1200);

// 1) üstten plan
await page.evaluate(() => window.__devPlan({ topDown: true, zoom: 1, gridStep: 0 }));
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/bmm-plan.png` });

// 2) perspektif — salon ortası
await page.evaluate(() => { window.__devPlan({ topDown: false, gridStep: 0 }); window.__teleport(-6, 4); });
await page.waitForTimeout(2800);
await page.screenshot({ path: `${OUT}/bmm-salon.png` });

// 3) kapı önü (ana giriş: söve · lento · alınlık · üst kordon)
await page.evaluate(() => window.__teleport(0, 13));
await page.waitForTimeout(2800);
await page.screenshot({ path: `${OUT}/bmm-kapi.png` });

// 4) arka bant / lavabo
await page.evaluate(() => window.__teleport(8, -5));
await page.waitForTimeout(2800);
await page.screenshot({ path: `${OUT}/bmm-arka.png` });

console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'konsol temiz');
await browser.close();
