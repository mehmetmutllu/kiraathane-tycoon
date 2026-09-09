/**
 * tema-kapak.mjs — MAĞAZA KARTLARININ KAPAK GÖRSELİ (S4).
 *
 * Kullanıcı 2026-09-09: *"markete ... anlık kesit koy, o tasarıma ait görebileceği bir render
 * koy — birebir oyun render'ı ya da ss. ama öbür masalardaki gibi kalitesiz olmasın."*
 *
 * Kartlar bugüne kadar `floorSwatch()` ile İKİ RENKLİ bir kutu gösteriyordu; oyuncunun ne satın
 * aldığını anlatmıyordu. Bu araç her temayı OYUNDA uygular ve mutfağın kadrajından bir kare alır
 * — yani kart artık gerçek oyun görüntüsü. Kareler `public/assets/ui/tema/` altına yazılır ve
 * commit'lenir; çalışma zamanında ek maliyet YOK (kart başına canvas açmak mobilde pahalı).
 *
 * Kullanım: npm run dev açıkken → node tools/tema-kapak.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
const TEMALAR = ['klasik', 'kiremit', 'cini', 'zeytin', 'bakir'];
const OUT = 'public/assets/ui/tema';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
// Kart oranı 16:10; deviceScaleFactor 2 → 640×400 keskin kapak.
const page = await browser.newPage({ viewport: { width: 320, height: 200 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
await page.waitForTimeout(1200);
await page.evaluate(() => document.body.classList.add('dsb-hide-hud'));
// Mutfağın hattını dolduran kadraj: tezgâh + dolap + zemin aynı karede olsun (kartın işi bu üçünü
// göstermek). Oyuncu kadrajın dışında kalsın diye park edilir.
await page.evaluate(() => { window.__devPlan({ topDown: false, gridStep: 0 }); window.__teleport(-11.5, -8.6); });
await page.waitForTimeout(2500);

for (const tema of TEMALAR) {
  await page.evaluate((t) => window.__setState({ kitchenTheme: t }), tema);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/mutfak-${tema}.png` });
  console.log(`  ${OUT}/mutfak-${tema}.png`);
}
await page.evaluate(() => window.__setState({ kitchenTheme: 'klasik' }));
console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'konsol temiz');
await browser.close();
