// vitrin-adaylari.mjs — `tools/vitrin-adaylari.html`in dört sayfasının karesini alır (F4c).
// Sunucuyu kendi kaldırır (patron-bak.mjs deseni).
//
// Kullanım: node tools/vitrin-adaylari.mjs [kiyafet tepsi tabela dekor]
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const KOK = path.resolve('.');
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : ['kiyafet', 'tepsi', 'tabela', 'dekor'];
const PORT = Number(process.env.BAK_PORT ?? 5199);
const KLASOR = 'docs/gorsel/ss';
mkdirSync(path.join(KOK, KLASOR), { recursive: true });

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
  for (const s of SAYFALAR) {
    const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
    const hatalar = [];
    p.on('pageerror', (e) => hatalar.push(e.message.slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text().slice(0, 200)); });
    await p.goto(`http://127.0.0.1:${PORT}/tools/vitrin-adaylari.html?sayfa=${s}`, { waitUntil: 'networkidle' });
    try { await p.waitForFunction(() => window.__hazir === true, { timeout: 60000 }); } catch { /* hata listesinde */ }
    await p.waitForTimeout(500);
    const cikti = `${KLASOR}/f4c-aday-${s}.png`;
    await p.screenshot({ path: path.join(KOK, cikti) });
    console.log('kare:', cikti, '· hatalar:', hatalar.length ? hatalar.slice(0, 3) : 'yok');
    await p.close();
  }
  await b.close();
} finally {
  sunucu.kill();
}
