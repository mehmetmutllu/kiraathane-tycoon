/**
 * shot-r2-sol-duvar.mjs — R2'nin KANITI: ilk salonun sol duvarındaki servis köşesi.
 *
 * NEDEN AYRI ARAÇ: `shot-mutfak.mjs` TÜM pad'leri açar, yani hep ARKA BANT dönemini çeker.
 * R2'nin kusuru tam olarak öteki dönemde (areasOpen < 3, servis sol duvarda). Bu araç pad
 * listesini o döneme kelepçeler ve kusuru kadraja alır.
 *
 * `areasOpen` elle yazılmaz — pad listesinden TÜRER (`feedback_single_source_of_truth`).
 * `zone2` verilmediği sürece dönem sol duvardır; araç bunu çekmeden önce doğrular.
 *
 * Çalıştır (dev sunucusu ayrı bir kabuğa kaldırılmış olmalı):
 *   node tools/shot-r2-sol-duvar.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

/** SOL DUVAR dönemi: ikinci masa açık, HİÇBİR zone pad'i yok → areasOpen 1-2. */
const PADS = ['table2', 'table3'];
const OUT = 'docs/gorsel/ss';
const PORT = process.env.R2_PORT ?? '5173';
const ad = (process.argv.find((a) => a.startsWith('--ad=')) ?? '--ad=r2-taban').slice(5);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
await page.waitForTimeout(1500);

// DÖNEM DAMGASI: yanlış dönemi çekmek, ölçülen kusuru olmayan bir kareyi kanıt diye sunmaktır.
// `__game` bir FONKSİYONDUR (anlık görüntü üretir), alan değil — `?.areasOpen` sessizce
// undefined döndürüyordu ve damga bilinmeyeni "geçti" sayıyordu. Okunamama da kırılmadır.
const donem = await page.evaluate(() => (typeof window.__game === 'function' ? window.__game().areasOpen : null));
if (typeof donem !== 'number' || donem >= 3) {
  console.error(`!! DAMGA KIRILDI · dönem okunamadı ya da yanlış — areasOpen ${donem} (SOL DUVAR için sayı ve < 3 olmalı)`);
  await browser.close();
  process.exit(1);
}
console.log(`dönem: areasOpen = ${donem} (SOL DUVAR)`);

await page.evaluate(() => document.body.classList.add('dsb-hide-hud'));

// 1) Tezgâhın karşısından — çizilen gövde salona doğru mu uzuyor?
await page.evaluate(() => { window.__devPlan({ topDown: false, gridStep: 0 }); window.__teleport(-13.2, 6.4); });
await page.waitForTimeout(2800);
await page.screenshot({ path: `${OUT}/${ad}-tezgah.png` });

// 2) Bulaşığın karşısından.
await page.evaluate(() => window.__teleport(-13.2, 10.6));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/${ad}-bulasik.png` });

// 3) Hattın boyunca — iki gövde arasındaki boşluk (G-37) tek kadrajda.
await page.evaluate(() => window.__teleport(-13.8, 14.5));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/${ad}-hat.png` });

// 4) Üstten plan — ayak izleri: çizim ile katının ayrı yerde durduğu buradan okunur.
await page.evaluate(() => window.__devPlan({ topDown: true, zoom: 1, gridStep: 0 }));
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/${ad}-plan.png` });

console.log(errs.length ? 'CONSOLE ERRORS:\n' + errs.join('\n') : 'konsol temiz');
await browser.close();
