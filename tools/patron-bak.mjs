// patron-bak.mjs — `tools/patron-bak.html`i açar ve karesini alır (S18).
// Sunucuyu kendi kaldırır (duman.mjs / karakter-bak.mjs deseni).
//
// Kullanım: node tools/patron-bak.mjs [cikti.png]
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve('.');
const cikti = process.argv[2] ?? 'docs/gorsel/ss/s18-patron.png';
const PORT = Number(process.env.BAK_PORT ?? 5199);
mkdirSync(path.dirname(path.join(KOK, cikti)), { recursive: true });

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});

const bekle = async () => {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true; } catch { /* bekle */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text().slice(0, 160)); });
  await p.goto(`http://127.0.0.1:${PORT}/tools/patron-bak.html`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__hazir === true, { timeout: 60000 });
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(KOK, cikti) });
  console.log('kare:', cikti, '· hatalar:', hatalar.length ? hatalar.slice(0, 3) : 'yok');
  await b.close();
} finally {
  sunucu.kill();
}
