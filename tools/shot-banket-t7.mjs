/**
 * shot-banket-t7.mjs — T7 BANKET ADAY KARELERİ (G-83/G-84): kollar yan yana, AYNI kadraj.
 *
 * Her kol kendi sayfa yüklemesinde açılır (`?banket=&gorunus=` — src/game/banketAday.ts), çünkü
 * B4 masaların SIRASINI değiştirir ve yerleşim modül yüklenirken kurulur.
 *
 *   BÜYÜME  B0..B4 × dört aşama (şeritte 1 · 3 · 6 · 12 masa) — görünüş R2 (B0 tabanı R0)
 *   GÖRÜNÜŞ R1..R3 × tam şerit, görünen yüzler soldan sağa seviye 0 · 1 · 2 · 3 · 4 · 4
 *
 * Kullanım: node tools/shot-banket-t7.mjs
 * Çıktı:    docs/gorsel/ss/t7-<kol>-<asama>.png
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';

const KOK = 'C:/xampp/htdocs/kiraathane';
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = 5427;
const TABAN = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3'.split(' ');
const seritPadleri = (n) => Array.from({ length: n - 1 }, (_, k) => `z3table${k + 2}`);
const ASAMA = [
  { n: 1, lv: 0 },
  { n: 3, lv: 1 },
  { n: 6, lv: 2 },
  { n: 12, lv: 4 },
];

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

const hatalar = [];
/** Hızlı deneme: `SADECE=B0` yalnız o kolu çeker (kadraj ayarı için). */
const SADECE = process.env.SADECE ?? '';
const KADRAJ = { x: 0, z: +(process.env.KZ ?? 0.3), uzak: +(process.env.KUZAK ?? 1.6) };

async function ac(b, sorgu) {
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  p.on('console', (m) => m.type() === 'error' && hatalar.push(`${sorgu}: ${m.text()}`));
  p.on('pageerror', (e) => hatalar.push(`${sorgu}: PAGEERROR ${e.message}`));
  await p.goto(`http://127.0.0.1:${PORT}/?${sorgu}`, { waitUntil: 'networkidle' });
  await p.waitForSelector('canvas', { timeout: 60000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.body.classList.add('dsb-hide-hud'));
  return p;
}

async function kur(p, n, levels) {
  await p.evaluate(({ pads, levels }) => {
    window.__setState({ padsDone: pads, padFills: {}, wallet: 0 });
    window.__setState({ tableLevels: levels, stationLevels: [4] });
  }, { pads: [...TABAN, ...seritPadleri(n)], levels });
  await p.waitForTimeout(600);
}

/** `uzak` = kamera mesafe çarpanı (`__devCam distMul`); plan zoom'u yalnız tepeden kamerada etkili. */
async function cek(p, dosya, { x = KADRAJ.x, z = KADRAJ.z, uzak = KADRAJ.uzak } = {}) {
  await p.evaluate(({ x, z, uzak }) => {
    window.__devPlan({ topDown: false });
    window.__devCam({ distMul: uzak });
    window.__teleport(x, z);
  }, { x, z, uzak });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${dosya}.png` });
  console.log(`${dosya} alindi`);
}

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });

  // ---- BÜYÜME: beş kol × dört aşama
  for (const [kol, gor] of [['B0', 'R0'], ['B1', 'R2'], ['B2', 'R2'], ['B3', 'R2'], ['B4', 'R2']]) {
    if (SADECE && !SADECE.split(',').includes(kol)) continue;
    const p = await ac(b, `banket=${kol}&gorunus=${gor}`);
    for (const a of ASAMA) {
      const lv = [...new Array(8).fill(2), ...new Array(12).fill(a.lv), ...new Array(4).fill(0)];
      await kur(p, a.n, lv);
      await cek(p, `t7-${kol}-${a.n}`);
    }
    await p.close();
  }

  // ---- GÖRÜNÜŞ: üç kol, tam şerit, görünen (+z) yüzler soldan sağa 0 · 1 · 2 · 3 · 4 · 4
  // +z yüzleri: sol ada col0/1/2 → masa 8/12/16 · sağ ada col2/1/0 → masa 18/14/10.
  const lv = new Array(24).fill(2);
  const sira = { 8: 0, 12: 1, 16: 2, 18: 3, 14: 4, 10: 4 };
  for (const [t, l] of Object.entries(sira)) { lv[+t] = l; lv[+t + 1] = l; }
  for (const gor of ['R1', 'R2', 'R3']) {
    if (SADECE && !SADECE.split(',').includes(gor)) continue;
    const p = await ac(b, `banket=B2&gorunus=${gor}`);
    await kur(p, 12, lv);
    await cek(p, `t7-gorunus-${gor}`, { x: 0, z: 1.5, uzak: 1.6 });
    await cek(p, `t7-gorunus-${gor}-sol`, { x: -8.5, z: 3.0, uzak: 0.85 }); // seviye 0 · 1 · 2
    await cek(p, `t7-gorunus-${gor}-sag`, { x: 8.5, z: 3.0, uzak: 0.85 }); // seviye 3 · 4
    await p.close();
  }

  console.log('konsol hatalari:', hatalar.length ? hatalar.slice(0, 5) : 'YOK');
  await b.close();
} finally {
  sunucu.kill();
}
