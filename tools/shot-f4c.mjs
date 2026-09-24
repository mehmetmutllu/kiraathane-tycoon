/**
 * shot-f4c.mjs — F4c 💎 vitrini: oyunda KIYAFET ve TEPSİ kareleri + mağaza sekmesi + başlangıç teklifi.
 * Sunucuyu kendi kaldırır (shot-t8b deseni). Kullanım: node tools/shot-f4c.mjs
 * Çıktı: docs/gorsel/ss/f4c-oyun-<ad>.png · f4c-magaza-*.png · f4c-teklif.png
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5234);
const OUT = 'docs/gorsel/ss';
const KIYAFET = ['klasik', 'kurucu', 'yesil', 'sef', 'yazlik', 'kislik', 'altin'];
const TEPSI = ['klasik', 'bakir', 'emaye', 'aski', 'altin'];
const HEPSI = [...KIYAFET.map((k) => `outfit:${k}`), ...TEPSI.map((t) => `tray:${t}`)];

const sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
sunucu.stdout.on('data', () => {});
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* henüz yok */ }
  await new Promise((r) => setTimeout(r, 400));
}
const tarayici = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const sayfa = await tarayici.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2 });
const hatalar = [];
sayfa.on('pageerror', (e) => hatalar.push(String(e.message)));
sayfa.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
try {
  await sayfa.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await sayfa.waitForFunction(() => typeof window.__setState === 'function', null, { timeout: 30000 });
  await sayfa.evaluate((h) => window.__setState({ ownedCosmetics: h, satin: { reklamsiz: false, baslangic: true, gunlukGun: -1, islenen: [], teklif: true }, tray: 3, questIndex: 999 }), HEPSI);
  await sayfa.waitForTimeout(2500);
  await sayfa.evaluate(() => document.body.classList.add('dsb-hide-hud'));
  const kare = { x: 110, y: 250, width: 200, height: 330 };
  for (const k of KIYAFET) {
    await sayfa.evaluate((id) => window.__setState({ outfit: id, trayLook: 'klasik' }), k);
    await sayfa.waitForTimeout(1200);
    await sayfa.screenshot({ path: `${OUT}/f4c-oyun-k-${k}.png`, clip: kare });
  }
  for (const t of TEPSI) {
    await sayfa.evaluate((id) => window.__setState({ outfit: 'klasik', trayLook: id }), t);
    await sayfa.waitForTimeout(1200);
    await sayfa.screenshot({ path: `${OUT}/f4c-oyun-t-${t}.png`, clip: kare });
  }
  await sayfa.evaluate(() => document.body.classList.remove('dsb-hide-hud'));
  await sayfa.evaluate(() => window.__setState({ outfit: 'kurucu', trayLook: 'aski', diamonds: 40 }));
  await sayfa.click('[data-testid="shop"]');
  await sayfa.waitForTimeout(1500);
  await sayfa.click('[data-testid="shop-card-outfit-altin"]');
  await sayfa.waitForTimeout(1500);
  await sayfa.screenshot({ path: `${OUT}/f4c-magaza-kiyafet.png` });
  await sayfa.click('[data-testid="shop-tab-tray"]');
  await sayfa.click('[data-testid="shop-card-tray-altin"]');
  await sayfa.waitForTimeout(1500);
  await sayfa.screenshot({ path: `${OUT}/f4c-magaza-tepsi.png` });
  await sayfa.keyboard.press('Escape');
  await sayfa.waitForTimeout(600);
  await sayfa.evaluate(() => window.__setState({ outfit: 'klasik', trayLook: 'klasik', mastersOwned: ['t0'], satin: { reklamsiz: false, baslangic: false, gunlukGun: -1, islenen: [], teklif: false } }));
  await sayfa.waitForSelector('[data-testid="baslangic-teklif"]', { timeout: 8000 });
  await sayfa.waitForTimeout(1500);
  await sayfa.screenshot({ path: `${OUT}/f4c-teklif.png` });
  // Kontak baskı: oyundaki on iki kare tek sayfada (kıyafet + tepsi aynı kadrajda karşılaştırılsın).
  const kareler = [...KIYAFET.map((k) => ['k', k]), ...TEPSI.map((t) => ['t', t])];
  const img = ([t, a]) =>
    `<figure><img src="data:image/png;base64,${readFileSync(path.join(KOK, OUT, `f4c-oyun-${t}-${a}.png`)).toString('base64')}"><figcaption>${t.toUpperCase()} ${a}</figcaption></figure>`;
  const montaj = await tarayici.newPage({ viewport: { width: 1230, height: 700 } });
  await montaj.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(6,200px);gap:4px;font:12px sans-serif}figure{margin:0}img{width:200px;display:block}</style>${kareler.map(img).join('')}`);
  await montaj.screenshot({ path: `${OUT}/f4c-oyun-montaj.png`, fullPage: true });
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
