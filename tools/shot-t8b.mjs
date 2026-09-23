/**
 * shot-t8b.mjs — T8b K10: sol duvar payının üç kolu AYNI KADRAJDAN (0,30 bugün · 0,60 · 0,75 · 0,90).
 *
 * Kolu `window.__solDuvarKolu` (dev) canlı değiştirir; oyun durumu aynı kalır. Dönem sol duvar
 * (areasOpen 2 · bulaşıkçı tutulmuş · ocak L5 = tost açık) — kusurun olduğu dönem. Sunucuyu kendi
 * kaldırır (model-bak deseni). Kullanım: node tools/shot-t8b.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5233);
const OUT = 'docs/gorsel/ss';
const PADS = ['table2', 'table3', 'waiter', 'table4', 'waiter2', 'zone2', 'z2table2', 'z2table3', 'dishwasher'];
const KOLLAR = [
  { ad: 'p030', k: null },
  { ad: 'p060', k: { pay: 0.6, arkada: true } },
  { ad: 'p075', k: { pay: 0.75, arkada: true } },
  { ad: 'p090', k: { pay: 0.9, arkada: true } },
];

const sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', (d) => process.stderr.write(`  [vite] ${d}`));
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* henüz yok */ }
  await new Promise((r) => setTimeout(r, 400));
}

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 });
const hatalar = [];
sayfa.on('pageerror', (e) => hatalar.push(String(e.message)));
sayfa.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
await sayfa.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
await sayfa.waitForFunction(() => typeof window.__solDuvarKolu === 'function', null, { timeout: 30000 });
await sayfa.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {}, stationLevels: [5], questIndex: 999 }), PADS);
await sayfa.waitForTimeout(2000);
const donem = await sayfa.evaluate(() => window.__game().areasOpen);
if (donem !== 2) { console.error(`!! dönem ${donem} (2 olmalı)`); process.exitCode = 1; }
await sayfa.evaluate(() => document.body.classList.add('dsb-hide-hud'));
// Kamera takip ederek yerine oturur; ilk kare oturmadan alınırsa kollar aynı kadrajda olmaz.
await sayfa.evaluate(() => { window.__devPlan({ topDown: false, gridStep: 0 }); window.__teleport(-12.6, 8.2); });
await sayfa.waitForTimeout(4000);

for (const { ad, k } of KOLLAR) {
  await sayfa.evaluate((kol) => window.__solDuvarKolu(kol), k);
  // Dönemi bir an arka banda alıp geri döndür: yerleşime abone bileşenler yeni kolla yeniden çizilir.
  await sayfa.evaluate((pads) => window.__setState({ padsDone: [...pads, 'zone3'] }), PADS);
  await sayfa.waitForTimeout(600);
  await sayfa.evaluate((pads) => window.__setState({ padsDone: pads }), PADS);
  await sayfa.evaluate(() => window.__teleport(-12.6, 8.2));
  await sayfa.waitForTimeout(3500);
  await sayfa.screenshot({ path: `${OUT}/t8b-k10-${ad}.png`, clip: { x: 0, y: 0, width: 620, height: 560 } });
}
await sayfa.evaluate(() => window.__solDuvarKolu(null));
await tarayici.close();
sunucu.kill();
console.log(hatalar.length ? 'KONSOL HATALARI:\n  ' + hatalar.join('\n  ') : 'konsol temiz');
