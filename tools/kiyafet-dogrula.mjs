/**
 * kiyafet-dogrula.mjs — `tools/kiyafet-dogrula.html`i açar ve karesini alır (S19b).
 * Sunucuyu kendi kaldırır; port TARANARAK seçilir ve sayfanın SURUM damgası denetlenir
 * (gerekçe `tools/olcum-oturus.mjs`: portta asılı kalan eski sunucu bayat sayfa servis ediyordu).
 *
 * Kullanım: node tools/kiyafet-dogrula.mjs [cikti.png]
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cikti = process.argv[2] ?? 'docs/gorsel/ss/s19b-kiyafet.png';

async function bosPort(baslangic) {
  for (let port = baslangic; port < baslangic + 40; port++) {
    try {
      await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(700) });
    } catch {
      return port;
    }
  }
  throw new Error('bos port bulunamadi');
}
const PORT = Number(process.env.BAK_PORT ?? (await bosPort(5400)));
const BEKLENEN_SURUM = Number(
  readFileSync(path.join(KOK, 'tools/kiyafet-dogrula.html'), 'utf8').match(/const SURUM = (\d+)/)[1],
);

mkdirSync(path.dirname(path.join(KOK, cikti)), { recursive: true });

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});

const bekle = async () => {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true;
    } catch {
      /* sunucu daha ayakta değil */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 820 }, deviceScaleFactor: 2 });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message.slice(0, 160)));
  p.on('console', (m) => {
    if (m.type() === 'error') hatalar.push(m.text().slice(0, 160));
  });
  await p.goto(`http://127.0.0.1:${PORT}/tools/kiyafet-dogrula.html`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__hazir === true, { timeout: 90000 });
  const surum = await p.evaluate(() => window.__surum);
  if (surum !== BEKLENEN_SURUM) throw new Error(`BAYAT SAYFA: sunucu ${surum}, dosya ${BEKLENEN_SURUM} (port ${PORT})`);
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(KOK, cikti) });
  console.log('kare:', cikti, '· hatalar:', hatalar.length ? hatalar.slice(0, 3) : 'yok');
  await b.close();
} finally {
  sunucu.kill();
}
