// RAPORU ARTIFACT'A HAZIRLA — `docs/<rapor>.html` içindeki kareleri küçültülmüş JPEG data
// URI'lerine çevirip `<rapor>.artifact.html` yazar.
// Neden: yayınlanan artifact'ın CSP'si dış görsel yüklemiyor; kareler dosyanın İÇİNDE olmalı.
// İki yazım da tanınır:
//   `gorsel/ss/<ad>.png`   — eski raporlar (yol metnin içinde geçer)
//   `{{IMG:<ad>}}`         — S13'ten beri; kare `docs/gorsel/<ad>.png`ten alınır ve yer tutucu
//                            src="" içinde durduğu için dosya tarayıcıda da bozuk görünmez.
// Kullanım: node tools/embed-rapor.mjs docs/bm-adim3-4-bant-kamera.html [genisWide=900] [genis=620]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('kullanım: node tools/embed-rapor.mjs docs/<rapor>.html'); process.exit(1); }
const wide = Number(process.argv[3] || 900);
const normal = Number(process.argv[4] || 620);

let html = readFileSync(file, 'utf8');
const names = [...new Set([...html.matchAll(/gorsel\/ss\/([\w.-]+)\.png/g)].map((m) => m[1]))];
const tutucular = [...new Set([...html.matchAll(/\{\{IMG:([\w.-]+)\}\}/g)].map((m) => m[1]))];
if (!names.length && !tutucular.length) { console.log('gömülecek kare yok'); process.exit(0); }
const src = Object.fromEntries([
  ...names.map((n) => [n, 'data:image/png;base64,' + readFileSync(`docs/gorsel/ss/${n}.png`).toString('base64')]),
  ...tutucular.map((n) => [n, 'data:image/png;base64,' + readFileSync(`docs/gorsel/${n}.png`).toString('base64')]),
]);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
const out = await page.evaluate(async ([src, wide, normal]) => {
  const res = {};
  for (const [k, v] of Object.entries(src)) {
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = v; });
    // Tek başına duran geniş kare (plan) daha yüksek çözünürlük hak eder.
    const maxW = k.includes('plan') || k.startsWith('s13-') ? wide : normal;
    const s = Math.min(1, maxW / img.width);
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    res[k] = c.toDataURL('image/jpeg', 0.82);
  }
  return res;
}, [src, wide, normal]);
await browser.close();

let total = 0;
for (const [k, v] of Object.entries(out)) {
  html = html.split(`gorsel/ss/${k}.png`).join(v).split(`{{IMG:${k}}}`).join(v);
  total += v.length;
}
const target = file.replace(/\.html$/, '.artifact.html');
writeFileSync(target, html);
console.log(target, '·', names.length, 'kare ·', (total / 1024 / 1024).toFixed(2), 'MB');
