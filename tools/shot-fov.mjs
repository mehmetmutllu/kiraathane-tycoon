import { chromium } from 'playwright';
// BM adım 4 — kamera ölçümü. Aynı noktadan üç kare: oyun fov 50 (bugün) · fov 34 (maketin fov'u,
// mesafe tan25/tan17 = 1,525 ile telafi edilerek AYNI kapsam) · ara değer 42.
const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
const OUT = 'docs/gorsel/ss';
const mul = (fov) => Math.tan((50 * Math.PI) / 360) / Math.tan((fov * Math.PI) / 360);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
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
  window.__teleport(-6, 2);
});
await page.waitForTimeout(2500);
for (const fov of [50, 42, 34]) {
  await page.evaluate(([f, m]) => window.__devCam({ fov: f, distMul: m }), [fov, mul(fov)]);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/bm4-fov${fov}.png` });
  console.log('fov', fov, 'distMul', mul(fov).toFixed(3));
}
await page.evaluate(() => window.__devCam({ fov: 0, distMul: 0 }));
console.log(errs.length ? 'ERR ' + errs.join('|') : 'konsol temiz');
await browser.close();
