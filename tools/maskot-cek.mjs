// maskot-cek.mjs — tools/maskot.html'i saydam zeminde çeker → docs/magaza-kareleri/maskot/{owner,waiter}.png
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('docs/magaza-kareleri/maskot', { recursive: true });
const PORT = 5313;
const sv = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'tools/vite-kare.config.mjs', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 400)); }
const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const s = await (await b.newContext({ viewport: { width: 700, height: 1000 }, deviceScaleFactor: 2 })).newPage();
const hata = []; s.on('pageerror', (e) => hata.push(e.message)); s.on('console', (m) => m.type() === 'error' && hata.push(m.text()));
for (const [kim, aci] of [['owner', -0.45], ['waiter', 0.45]]) {
  await s.goto(`http://127.0.0.1:${PORT}/tools/maskot.html?kim=${kim}&aci=${aci}`);
  await s.waitForFunction(() => window.MASKOT_HAZIR, null, { timeout: 60000 }).catch(() => hata.push('hazir olmadi'));
  await s.waitForTimeout(2500);
  await s.screenshot({ path: `docs/magaza-kareleri/maskot/${kim}.png`, omitBackground: true });
}
console.log(hata.slice(0, 4).join(' | ') || 'temiz');
await b.close(); sv.kill();
