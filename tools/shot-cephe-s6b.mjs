/**
 * shot-cephe-s6b.mjs — S6/②'nin görsel doğrulaması (3D sahne testle doğrulanamaz, CLAUDE.md).
 *
 * NEDEN: S7'nin dersi — sayı ile ekran birbirinin yerine geçmiyor. Ölçüm cephenin kadraja
 * %7…%15 girdiğini ve YALNIZ DIŞARIDAN görüldüğünü söylüyor; karar paketine gitmeden önce
 * o şeridin ekranda gerçekte ne kadar yer kapladığına bakılır.
 *
 * Kadrajlar oyuncunun cepheye yaklaştığı hattı tarar (kamera pz + 8,50'de, cephe z 17,50):
 * pz 12,0'de kamera daha 20,5'te (cephe uzak), pz 16,5'te 25,0'te (cephe ekranın altında).
 *
 * Kullanım: npm run dev açıkken → node tools/shot-cephe-s6b.mjs
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
  ['cephe-uzak', 0, 12.0],       // kamera 20,5 — cephe yeni yeni giriyor
  ['cephe-kapi', 0, 15.5],       // kamera 24,0 — kapı bloğu + iki yanı
  ['cephe-esik', 0, 16.5],       // kamera 25,0 — cephe en yakın hâli
  ['cephe-sol-kanat', -9, 16.0], // kapıdan uzak hat: cam gözlerinin duracağı yer
  ['cephe-sag-kanat', 9, 16.0],
  ['cephe-ic', 0, 6.0],          // ölçümün "cephe içeriden hiç görünmez" satırının sağlaması
];
for (const [ad, x, z] of KADRAJ) {
  await page.evaluate(([px, pz]) => window.__teleport(px, pz), [x, z]);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/s6b-${ad}.png` });
  console.log('çekildi:', ad);
}
console.log(errs.length ? 'KONSOL HATASI: ' + errs.join(' | ') : 'konsol temiz');
await browser.close();
