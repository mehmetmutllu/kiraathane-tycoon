/**
 * shot-tek-odak.mjs — C2'nin EN YOĞUN durumunu kadraja alır (katman ayrımı öncesi/sonrası).
 *
 * `tools/olcum-tek-odak.ts` sayıyı veriyor (en yoğun: 16 işaret, tek salonda 12); bu araç aynı
 * durumu gerçek sahnede kurup kareye çeviriyor — karar görsel, sayı tek başına yetmez.
 *
 * Çalıştır (dev sunucusu açıkken):  node tools/shot-tek-odak.mjs [önek]
 *   önek verilmezse `tekodak-` kullanılır (öncesi `tekodak-once-*` olarak saklandı).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

// Son pad (z3table12) BİLEREK açılmadı → ekranda bir de aktif adım pad'i olsun.
const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11'.split(' ');
// 49 = "z3table12 pad'ini aç" görevi → aktif adım salon 3'teki pad, katman ayrımı kadrajda okunur.
const QUEST = 49;
const PRE = process.argv[2] ?? 'tekodak-';
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
// tableLevels 0 → HER masanın yükseltme noktası görünür (ölçümdeki en yoğun durum).
// stationLevels 6 → servis tavanda, o işaret kapalı; kalabalığın kaynağı yalnız masalar olsun.
await page.evaluate((q) => {
  window.__setState({ tableLevels: new Array(24).fill(0), stationLevels: [6], questIndex: q });
}, QUEST);
await page.waitForTimeout(1500);

// 1) üstten plan — kaç işaret olduğu tek bakışta
await page.evaluate(() => window.__devPlan({ topDown: true, zoom: 1, gridStep: 0 }));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/${PRE}plan.png` });

// 2) oyuncunun gördüğü kadraj — salon 3'e bakış (en yoğun alan: 12 işaret)
await page.evaluate(() => { window.__devPlan({ topDown: false, gridStep: 0 }); window.__teleport(0, 5); });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/${PRE}salon3.png` });

// 3) salon 2 kadrajı (4 masa + geçiş)
await page.evaluate(() => window.__teleport(6, 16));
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/${PRE}salon2.png` });

// 4) AKTİF ADIMIN yanı: oyuncu salon 3'teki pad'in yakınında — bir aktif, birkaç konuşan, gerisi sessiz
await page.evaluate(() => window.__teleport(5.3, -2.4));
await page.waitForTimeout(3000);
await page.screenshot({ path: `${OUT}/${PRE}aktif.png` });

console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'konsol temiz');
await browser.close();
