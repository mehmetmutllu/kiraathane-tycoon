/**
 * shot-mutfak.mjs — SERVİS KÖŞESİNİN (mutfak) kadrajı. S3'ün önce/sonra karesi.
 * Bant yürünmez kütle olduğu için oyuncu mutfağa giremez: kadraj bandın ÖNÜNDEN,
 * ara duvarların üstünden bakar. `--ad=<önek>` çıktı adını değiştirir (once/sonra).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
const OUT = 'docs/gorsel/ss';
const ad = (process.argv.find((a) => a.startsWith('--ad=')) ?? '--ad=mutfak').slice(5);
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

// 1) mutfağın karşısı — servis bloğunun ortasından bak
await page.evaluate(() => { window.__devPlan({ topDown: false, gridStep: 0 }); window.__teleport(-11, -8.4); });
await page.waitForTimeout(2800);
await page.screenshot({ path: `${OUT}/${ad}-on.png` });

// 2) batı ucu — sol duvar hattı
await page.evaluate(() => window.__teleport(-15.5, -8.4));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/${ad}-bati.png` });

// 3) doğu ucu — depo köşesi
await page.evaluate(() => window.__teleport(-5.6, -8.4));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/${ad}-dogu.png` });

// 4) üstten plan — ayak izleri
await page.evaluate(() => window.__devPlan({ topDown: true, zoom: 1, gridStep: 0 }));
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/${ad}-plan.png` });

console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'konsol temiz');
await browser.close();
