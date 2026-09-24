/**
 * shot-f4c2.mjs — F4c-2 💎 dekor: oyunda yerinde (plan + oyun kamerası) + mağazanın Dekor sekmesi.
 * Sunucuyu kendi kaldırır (shot-f4c deseni). Kullanım: node tools/shot-f4c2.mjs
 * Çıktı: docs/gorsel/ss/f4c2-oyun-*.png · f4c2-magaza-*.png
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5242);
const OUT = 'docs/gorsel/ss';
const PADS = 'table2 table3 waiter table4 waiter2 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
const URUN = ['radyo', 'koltuk', 'lamba', 'tablo', 'semaver', 'gramofon', 'kanarya', 'saat', 'yilbasi-kirmizi', 'yilbasi-yesil', 'yilbasi-mavi', 'yilbasi-kahve'];
const DEKOR = { radyo: 'radyo', koltuk: 'koltuk', lamba: 'lamba', tablo: 'tablo', semaver: 'semaver', gramofon: 'gramofon', kanarya: 'kanarya', saat: 'saat', yilbasi: 'yilbasi-kirmizi' };
const KADRAJ = [
  { ad: 'sol-arka', x: -14.2, z: -1.2 },
  { ad: 'sag-arka', x: 14.2, z: -1.2 },
  { ad: 'wc-duvar', x: 8.2, z: -5.5 },
  { ad: 'sol-on', x: -13.8, z: 14.8 },
  { ad: 'sol-konsol', x: -13.8, z: 9.5 },
];

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
  // 1) Mağaza · 1. Salon: dekor kilitli (yılbaşı hariç).
  await sayfa.evaluate(() => window.__setState({ diamonds: 500, questIndex: 999 }));
  await sayfa.waitForTimeout(1500);
  await sayfa.click('[data-testid="shop"]');
  await sayfa.waitForTimeout(800);
  await sayfa.click('[data-testid="shop-tab-decor"]');
  await sayfa.click('[data-testid="shop-card-decor-semaver"]');
  await sayfa.waitForTimeout(1500);
  await sayfa.screenshot({ path: `${OUT}/f4c2-magaza-kilitli.png` });
  await sayfa.click('[data-testid="shop-card-decor-yilbasi-yesil"]');
  await sayfa.waitForTimeout(1500);
  await sayfa.screenshot({ path: `${OUT}/f4c2-magaza-yilbasi.png` });
  await sayfa.keyboard.press('Escape');
  // 2) Tam kat · her şey sahip + yerinde.
  await sayfa.evaluate(([pads, urun, dekor]) => window.__setState({ padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(4), ownedCosmetics: urun.map((u) => `decor:${u}`), dekor }), [PADS, URUN, DEKOR]);
  await sayfa.waitForTimeout(2500);
  await sayfa.evaluate(() => document.body.classList.add('dsb-hide-hud'));
  for (const k of KADRAJ) {
    await sayfa.evaluate(([x, z]) => window.__teleport(x, z), [k.x, k.z]);
    await sayfa.waitForTimeout(3500);
    await sayfa.screenshot({ path: `${OUT}/f4c2-oyun-${k.ad}.png` });
  }
  // Yakın kare: sağ arka köşe, telefon kadrajının üst yarısı büyütülmüş.
  await sayfa.evaluate(() => window.__teleport(15.6, -2.6));
  await sayfa.waitForTimeout(3500);
  await sayfa.screenshot({ path: `${OUT}/f4c2-oyun-sag-yakin.png`, clip: { x: 160, y: 100, width: 260, height: 420 } });
  await sayfa.evaluate(() => window.__teleport(-15.6, -2.6));
  await sayfa.waitForTimeout(3500);
  await sayfa.screenshot({ path: `${OUT}/f4c2-oyun-sol-yakin.png`, clip: { x: 0, y: 100, width: 260, height: 420 } });
  // Üstten plan.
  await sayfa.setViewportSize({ width: 900, height: 900 });
  await sayfa.evaluate(() => window.__devPlan({ topDown: true, zoom: 1, gridStep: 0 }));
  await sayfa.waitForTimeout(2500);
  await sayfa.screenshot({ path: `${OUT}/f4c2-oyun-plan.png` });
  await sayfa.evaluate(() => window.__devPlan({ topDown: false, gridStep: 0 }));
  // 3) Mağaza · tam kat: sahipsin / salonda duruyor.
  await sayfa.setViewportSize({ width: 420, height: 860 });
  await sayfa.evaluate(() => document.body.classList.remove('dsb-hide-hud'));
  await sayfa.waitForTimeout(1200);
  await sayfa.click('[data-testid="shop"]');
  await sayfa.waitForTimeout(800);
  await sayfa.click('[data-testid="shop-tab-decor"]');
  await sayfa.click('[data-testid="shop-card-decor-gramofon"]');
  await sayfa.waitForTimeout(1500);
  await sayfa.screenshot({ path: `${OUT}/f4c2-magaza-gramofon.png` });
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
