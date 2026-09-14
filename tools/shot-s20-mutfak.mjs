/**
 * shot-s20-mutfak.mjs — S20 TABAN KARELERİ: mutfağın şu anki hâli.
 * Üç soru okunacak: (1) mutfağa girilebilen bir açıklık var mı, (2) mutfaktaki NPC
 * (`KitchenHand`) ne yapıyor gibi duruyor, (3) oda içi ne kadar dolu.
 * Sunucuyu kendi kaldırır (shot-s19b.mjs deseni).
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';

const KOK = 'C:/xampp/htdocs/kiraathane';
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = 5421;
const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo'.split(' ');

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));

const bekle = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true; } catch { /* bekle */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  const hatalar = [];
  p.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
  p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('canvas', { timeout: 60000 });
  await p.waitForTimeout(3500);
  await p.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    window.__setState({ tableLevels: new Array(24).fill(2), stationLevels: [4], wallet: 99999 });
    document.body.classList.add('dsb-hide-hud');
  });
  for (let i = 0; i < 4; i++) { await p.evaluate(() => window.__advanceTime?.(20)); await p.waitForTimeout(400); }

  // 1) Oyuncu mutfağın önündeki koridora — tezgâhın batı ucundaki açıklığın hizası.
  await p.evaluate(() => { window.__devPlan({ topDown: false, zoom: 1 }); window.__teleport(-15.6, -8.6); });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${OUT}/s20-mutfak-taban.png` });

  // 2) Mutfağın içi — çaycının hattı (x −14,6…−11,4 · z −11,3).
  await p.evaluate(() => { window.__devPlan({ topDown: false, zoom: 2.4 }); window.__teleport(-13.0, -8.6); });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${OUT}/s20-mutfak-npc.png` });

  // 3) Tepeden plan: mutfak bloğunun ayak izi ve açıklıklar.
  await p.evaluate(() => { window.__devPlan({ topDown: true, zoom: 1.5, gridStep: 1 }); window.__teleport(-11, -8.6); });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${OUT}/s20-mutfak-plan.png` });

  console.log('konsol hatalari:', hatalar.length ? hatalar.slice(0, 5) : 'YOK');
  await b.close();
} finally {
  sunucu.kill();
}
