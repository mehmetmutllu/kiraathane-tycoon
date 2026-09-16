import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5234;
const SS = path.join(KOK, 'docs', 'gorsel', 'ss');
const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const t = await chromium.launch();
const s = await t.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
s.on('console', (m) => { if (m.type() === 'error') console.log('KONSOL:', m.text().slice(0, 140)); });
await s.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
await s.waitForSelector('canvas', { timeout: 20000 });
await s.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
await s.evaluate(() => window.__addMoney(5_000_000));
await s.evaluate(() => window.__advanceTime(180));
await s.waitForTimeout(900);
await s.evaluate(() => window.__setState({ diamonds: 500, xp: 340, settings: { ...window.__game().settings, showFps: true } }));
await s.waitForTimeout(500);

// FPS + topbar birlikte: sol üst köşe
await s.screenshot({ path: path.join(SS, 'recon-ustkose.png'), clip: { x: 0, y: 0, width: 390, height: 190 } });

// ÖDÜL EKRANI: hedefler panelinden toplanabilir bir kademe
const acildi = await s.evaluate(() => {
  window.__setState({ stats: { ...window.__game().stats, teasServed: 500, dishesWashed: 300 }, lifetime: 900000 });
  return true;
});
await s.click('[data-testid="level"]');
await s.waitForSelector('[data-testid="goals-panel"]', { timeout: 8000 }).catch(() => {});
await s.waitForTimeout(700);
await s.screenshot({ path: path.join(SS, 'recon-hedefler.png') });
const btn = s.locator('[data-testid="goals-panel"] .goal-claim, [data-testid="goals-panel"] button').filter({ hasText: /Al/ }).first();
if (await btn.count()) { await btn.click(); await s.waitForTimeout(700); }
const modal = s.locator('[data-testid="goal-reward"]');
console.log('modal var mi:', await modal.count(), '· acildi', acildi);
if (await modal.count()) await s.screenshot({ path: path.join(SS, 'recon-odul.png') });
await s.close(); await t.close(); sunucu.kill(); process.exit(0);
