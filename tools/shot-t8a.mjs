/**
 * shot-t8a.mjs — T8a'nın GÖRSEL KANITI (D-142): 2. garson pad'inin Salon 1'deki yeni yeri ve seviye
 * atlama ödül ekranı. `feedback_visual_polish`: mantık + test yeşil ≠ bitti.
 *
 * Koşu:  node tools/shot-t8a.mjs   ·   T8A_PORT=5218 node tools/shot-t8a.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.T8A_PORT ?? '', 10) || 5218;
const KOK_URL = `http://127.0.0.1:${PORT}`;
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

// Telefon portresi — kalemlerin hepsi orada yaşıyor (HUD yerleşimi en dar burada).
const KADRAJ = { width: 412, height: 915, dpr: 2.625 };

function sunucuKaldir() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, red) => {
    const z = setTimeout(() => red(new Error('sunucu 60 sn icinde hazir olmadi')), 60_000);
    s.stdout.on('data', (d) => { if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); } });
    s.on('exit', (k) => { clearTimeout(z); red(new Error(`sunucu ${k} koduyla kapandi`)); });
  });
}

async function sayfaAc(tarayici) {
  const baglam = await tarayici.newContext({
    viewport: { width: KADRAJ.width, height: KADRAJ.height },
    deviceScaleFactor: KADRAJ.dpr,
    isMobile: true,
    hasTouch: true,
  });
  const s = await baglam.newPage();
  await s.goto(`${KOK_URL}/`, { waitUntil: 'domcontentloaded' });
  await s.waitForFunction(() => typeof window.__game === 'function', { timeout: 30_000 });
  await s.waitForSelector('.splash', { state: 'detached', timeout: 30_000 }).catch(() => {});
  await s.evaluate(() => window.__park?.());
  return { baglam, s };
}

async function main() {
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const uretilen = [];
  try {
    // ① 2. GARSON PAD'İ — Salon 1'in sonu (4 masa açık, görev q_waiter2).
    {
      const { baglam, s } = await sayfaAc(tarayici);
      await s.evaluate(() => {
        window.__resetGame?.();
        window.__setState?.({ padsDone: ['table2', 'table3', 'waiter', 'table4'], charPanelSeen: true, washTipSeen: true, trayTipSeen: true });
        window.__addMoney?.(300);
        window.__setQuest?.('q_waiter2');
        window.__setState?.({ questPhase: 'active', questPhaseT: 0, notice: null, noticeQueue: [], levelUp: null });
      });
      // Oyuncu pad'in 1,5 br doğusunda: kamera oyuncuyu izler, pad kadrajın ortasına girer.
      await s.evaluate(() => { const p = window.__game().padPos; window.__teleport(p[0] + 1.5, p[2]); });
      await s.evaluate(() => window.__advanceTime(2));
      await s.evaluate(() => window.__setState?.({ levelUp: null }));
      await s.waitForTimeout(1200);
      const p = path.join(OUT, 't8a-garson2-pad.png');
      await s.screenshot({ path: p });
      uretilen.push(p);
      await baglam.close();
    }
    // ② SEVİYE ÖDÜL EKRANI — Seviye 5, ₺ + servis hızı geçişi.
    {
      const { baglam, s } = await sayfaAc(tarayici);
      await s.evaluate(() => {
        window.__resetGame?.();
        window.__setState?.({
          charPanelSeen: true, washTipSeen: true, trayTipSeen: true, notice: null, noticeQueue: [],
          levelUp: { level: 5, amount: 1240, carryBefore: 0.06, carryAfter: 0.08 },
        });
      });
      await s.waitForSelector('[data-testid="level-up"]', { timeout: 10_000 });
      await s.waitForTimeout(600);
      const p = path.join(OUT, 't8a-seviye-odul.png');
      await s.screenshot({ path: p });
      uretilen.push(p);
      await baglam.close();
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }
  for (const p of uretilen) console.log(path.relative(KOK, p).split(path.sep).join('/'));
}

main().catch((e) => { console.error(e); process.exit(1); });
