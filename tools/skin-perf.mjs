/**
 * skin-perf.mjs — skin-perf.html'i kaldırıp sonucu terminale basar (S14).
 * Kullanım: node tools/skin-perf.mjs [N] [model]
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [N = '24', model = 'Ranger'] = process.argv.slice(2);
const PORT = Number(process.env.BAK_PORT ?? 5197);
const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/tools/skin-perf.html`)).ok) break; } catch { /* bekle */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  // GPU ŞART: başsız Chromium öntanımlı olarak SwiftShader'a düşüyor ve 24 skinned gövde
  // 197 ms/kare veriyordu — telefonla ilgisi olmayan bir sayı. Bayraklar gerçek sürücüyü açar;
  // sayfa yine de hangi sürücüde koştuğunu yazdırır, çünkü bayrak her makinede tutmayabilir.
  const t = await chromium.launch({
    args: ['--use-angle=default', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
    headless: false,
  });
  const s = await t.newPage({ viewport: { width: 1280, height: 720 } });
  await s.goto(`http://127.0.0.1:${PORT}/tools/skin-perf.html?n=${N}&model=${model}`, { waitUntil: 'networkidle' });
  await s.waitForFunction(() => document.title === 'hazir', { timeout: 120000 });
  console.log(await s.textContent('#out'));
  await t.close();
} finally {
  sunucu.kill();
}
