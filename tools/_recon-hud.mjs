import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5233;
const SS = path.join(KOK, 'docs', 'gorsel', 'ss');
mkdirSync(SS, { recursive: true });

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const t = await chromium.launch();
const s = await t.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await s.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
await s.waitForSelector('canvas', { timeout: 20000 });
await s.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
await s.evaluate(() => window.__addMoney(5_000_000));
await s.evaluate(() => window.__advanceTime(120));
await s.waitForTimeout(900);
await s.evaluate(() => window.__setState({ diamonds: 500, xp: 340 }));
await s.waitForTimeout(400);

// 1) üst şerit
await s.locator('.topbar').screenshot({ path: path.join(SS, 'recon-topbar.png') });
await s.screenshot({ path: path.join(SS, 'recon-oyun.png') });

// 2) ayarlar
await s.click('[data-testid="gear"]');
await s.waitForSelector('[data-testid="menu"]');
await s.waitForTimeout(600);
await s.screenshot({ path: path.join(SS, 'recon-ayarlar.png') });
const kaydirici = s.locator('.setting-slider').first();
await kaydirici.screenshot({ path: path.join(SS, 'recon-kaydirici.png') });
// ses seviyesini ortaya çek — uçta kesik görünmeyebilir
await s.evaluate(() => { window.__setState?.({}); });
await s.locator('[data-testid="set-sound-vol"]').fill('45');
await s.waitForTimeout(300);
await kaydirici.screenshot({ path: path.join(SS, 'recon-kaydirici-45.png') });
const kutular = await s.evaluate(() => {
  const r = document.querySelector('.setting-slider');
  const inp = r.querySelector('input');
  const lab = r.querySelector('.setting-label');
  const val = r.querySelector('.setting-val');
  const b = (e) => { const x = e.getBoundingClientRect(); return { x: +x.x.toFixed(1), y: +x.y.toFixed(1), w: +x.width.toFixed(1), h: +x.height.toFixed(1) }; };
  const cs = getComputedStyle(r);
  const tr = getComputedStyle(inp, '::-webkit-slider-runnable-track');
  const th = getComputedStyle(inp, '::-webkit-slider-thumb');
  return { satir: b(r), input: b(inp), label: b(lab), val: b(val),
    satirBorder: { l: cs.borderLeftWidth, b: cs.borderBottomWidth, ml: cs.marginLeft, pl: cs.paddingLeft },
    track: { h: tr.height, border: tr.borderWidth, bg: tr.backgroundImage?.slice(0, 80) },
    thumb: { w: th.width, h: th.height, mt: th.marginTop, border: th.borderWidth } };
});
console.log(JSON.stringify(kutular, null, 1));
await s.close();
await t.close();
sunucu.kill();
process.exit(0);
