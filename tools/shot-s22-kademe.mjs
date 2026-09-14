/**
 * shot-s22-kademe.mjs — S22 KADEME KARELERİ: mutfak seviyeyle büyüyor mu, GÖZLE?
 *
 * Bekçi testi merdivenin kurallarını doğruluyor (kör basamak yok · çakışma yok · üst hiza
 * korunuyor) ama hiçbiri "ekranda doğru görünüyor mu" sorusunu cevaplamıyor — 3D sahne
 * görsel olarak doğrulanamaz (CLAUDE.md). Bu araç altı basamağın altısını da aynı kadrajdan
 * çeker; kareler yan yana konunca merdiven okunur.
 *
 * Kullanım: node tools/shot-s22-kademe.mjs          (altı seviye + iki yakın kare)
 * Çıktı:    docs/gorsel/ss/s22-kademe-L{1..6}.png · s22-ada-L{4,6}.png
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';

const KOK = 'C:/xampp/htdocs/kiraathane';
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = 5422;
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
    window.__setState({ tableLevels: new Array(24).fill(2), wallet: 99999 });
    document.body.classList.add('dsb-hide-hud');
  });
  for (let i = 0; i < 4; i++) { await p.evaluate(() => window.__advanceTime?.(20)); await p.waitForTimeout(400); }

  // ---- Altı basamak, TEK kadraj: kareler yan yana konunca merdiven okunsun.
  for (let L = 1; L <= 6; L++) {
    await p.evaluate((lv) => {
      window.__setState({ stationLevels: [lv] });
      window.__devPlan({ topDown: false, zoom: 1.35 });
      window.__teleport(-12.4, -8.6);
    }, L);
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${OUT}/s22-kademe-L${L}.png` });
    console.log(`L${L} karesi alindi`);
  }

  // ---- Adalar: doğdukları (L4) ve tam donandıkları (L6) an, aynı YAKIN kadraj.
  //
  // TEPEDEN KARE ALINAMIYOR ve bu bir araç kusuru değil: tepeden kamera OYUNCUNUN üstünde
  // duruyor, oyuncu da `clampToOpenAreas` yüzünden mutfağın 0,05 br önünde kalıyor (S20 §E).
  // Yani mutfağın kuşbakışı karesi oyunun içinden çekilemez — plan çizimi ölçüm aracının işi
  // (`docs/olcum-mutfak-kademe.txt` §Y), kameranın değil. Burada perspektif yakın kare var.
  for (const L of [4, 6]) {
    await p.evaluate((lv) => {
      window.__setState({ stationLevels: [lv] });
      window.__devPlan({ topDown: false, zoom: 2.2 });
      window.__teleport(-11.2, -9.4);
    }, L);
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${OUT}/s22-ada-L${L}.png` });
    console.log(`ada L${L} karesi alindi`);
  }

  console.log('konsol hatalari:', hatalar.length ? hatalar.slice(0, 5) : 'YOK');
  await b.close();
} finally {
  sunucu.kill();
}
