/**
 * magaza-tasarim.mjs — `tools/magaza-tasarim.html`i kare kare çeker (tasarımlı App Store görselleri).
 * Önce ham kareler: node tools/kare-oyun-ici.mjs
 * Kullanım: V=A,B,C C=iphone,ipad D=tr,en I=1,2 node tools/magaza-tasarim.mjs
 * Çıktı: docs/magaza-kareleri/tasarim/<V>/<cihaz>-<dil>-<n>.png (iPhone 1320×2868 · iPad 2064×2752, alfasız).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OLCU = { iphone: [1320, 2868], ipad: [2064, 2752] };
const liste = (ad, vars) => (process.env[ad] ?? vars).split(',');
const VS = liste('V', 'A,B,C'), CS = liste('C', 'iphone,ipad'), DS = liste('D', 'tr,en'), IS = liste('I', '1,2,3,4,5,6');
// V içinde D/E/F varsa tam kadraj şablonu (magaza-tasarim2.html), yoksa çerçeveli şablon. C iki şablonda da var:
// SAYFA=2 ile yeni hâli seçilir.
const sayfaUrl = (v) => pathToFileURL(path.join(KOK, 'tools', 'MNOP'.includes(v) ? 'magaza-tasarim3.html' : 'DEF'.includes(v) || process.env.SAYFA === '2' ? 'magaza-tasarim2.html' : 'magaza-tasarim.html')).href;

const t = await chromium.launch({ args: ['--allow-file-access-from-files'] });
for (const v of VS) for (const c of CS) {
  const [w, h] = OLCU[c];
  const klasor = path.join(KOK, 'docs/magaza-kareleri/tasarim', v + (v === 'C' && process.env.SAYFA === '2' ? '2' : ''));
  mkdirSync(klasor, { recursive: true });
  const s = await t.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const hatalar = [];
  s.on('pageerror', (e) => hatalar.push(e.message));
  s.on('requestfailed', (r) => hatalar.push('yüklenemedi: ' + r.url()));
  for (const d of DS) for (const i of IS) {
    await s.goto(`${sayfaUrl(v)}?c=${c}&i=${i}&v=${v}&d=${d}`, { waitUntil: 'load' });
    await s.evaluate(() => document.fonts.ready);
    await s.evaluate(() => Promise.all([...document.images].map((g) => (g.complete ? 1 : new Promise((r) => { g.onload = g.onerror = r; })))));
    await s.evaluate(() => Promise.all([...document.querySelectorAll('.sahne')].map((d) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = getComputedStyle(d).backgroundImage.slice(5, -2); }))));
    await s.waitForTimeout(200);
    await s.screenshot({ path: path.join(klasor, `${c}-${d}-${i}.png`), omitBackground: false });
  }
  console.log(`${v}/${c}`, hatalar.length ? 'HATA ' + hatalar[0] : 'tamam');
  await s.close();
}
await t.close();
