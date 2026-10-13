// GEÇİCİ (Sprint C tur 2, D-167): Ametist ekranlarını çeker + zemindeki yazının kontrastını ölçer +
// Başlangıç afişinde sandık konum adaylarını çeker. Koşu: node tools/_ametist-cek.mjs <cikti-klasoru>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { sunucuKomutu, hazirSinyali, sunucuyuBekle, adres } from './duman.mjs';

const KOK = path.resolve('.');
const PORT = Number(process.env.CEK_PORT || 5302);
const URL = adres(PORT);
const CIKTI = path.resolve(process.argv[2] || 'docs/tasarim/sprint-C/ametist');
mkdirSync(CIKTI, { recursive: true });

const { dosya, argv } = sunucuKomutu(PORT, 'dev', KOK);
const sunucu = spawn(dosya, argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
process.on('exit', () => { try { sunucu.kill(); } catch { /* */ } });
if ((await hazirSinyali(sunucu)) !== 'hazir' || !(await sunucuyuBekle(URL, { toplamMs: 15000 }))) {
  console.error('vite kalkmadı'); process.exit(1);
}
const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'tr-TR' });
const page = await ctx.newPage();
const hatalar = [];
page.on('pageerror', (e) => hatalar.push(e.message.slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text().slice(0, 160)); });
const ev = (fn, a) => page.evaluate(fn, a);
const kapatAcik = async () => {
  for (let i = 0; i < 25; i++) {
    let tik = false;
    for (const s of ['[data-testid="level-up-ok"]', '[data-testid="ogretme-ok"]', '[data-testid="offline-ok"]', '[data-testid="goal-reward-ok"]', '[data-testid="daily-reward-ok"]']) {
      const el = await page.$(s);
      if (el) { await el.click().catch(() => {}); tik = true; await page.waitForTimeout(80); }
    }
    if (!tik) return;
  }
};

// Zemin üstündeki yazının kontrastı: yazının rengi ↔ ilk dolu arka plan (degradede ilk renk).
function kontrast() {
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const oran = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const zemin = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const bg = rgb(cs.backgroundColor);
      if (bg.length >= 3 && (bg[3] ?? 1) > 0.5) return { renk: bg.slice(0, 3), kim: e };
      const m = cs.backgroundImage.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8})/i);
      if (m && cs.backgroundImage.includes('gradient')) { const c = rgb(m[1]); if ((c[3] ?? 1) > 0.5) return { renk: c.slice(0, 3), kim: e }; }
    }
    return { renk: [255, 255, 255], kim: null };
  };
  const kok = document.querySelector('.modal-card.screen') || document.body;
  const sonuc = [];
  const w = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT);
  const gor = new Set();
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement; const t = n.textContent.trim();
    if (!el || t.length < 2 || gor.has(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || !el.getClientRects().length) continue;
    gor.add(el);
    const z = zemin(el);
    const r = oran(rgb(cs.color).slice(0, 3), z.renk);
    const px = parseFloat(cs.fontSize); const kalin = Number(cs.fontWeight) >= 700;
    const esik = px >= 24 || (px >= 18.66 && kalin) ? 3 : 4.5;
    if (r < esik) sonuc.push({ metin: t.slice(0, 40), sinif: el.className || el.tagName, zeminSinif: z.kim?.className?.toString().slice(0, 40), renk: cs.color, zemin: `rgb(${z.renk})`, oran: +r.toFixed(2), px });
  }
  return sonuc;
}

await page.goto(URL, { waitUntil: 'commit', timeout: 60000 });
await page.waitForSelector('canvas', { timeout: 60000 });
await page.waitForFunction(() => typeof window.__game === 'function', null, { timeout: 20000 });
await page.waitForSelector('.splash', { state: 'detached', timeout: 15000 }).catch(() => {});
try { await page.waitForSelector('[data-testid="kafe-adi"]', { timeout: 8000 }); await page.fill('[data-testid="kafe-adi-girdi"]', 'Çınar Kahvesi'); await page.click('[data-testid="kafe-adi-tamam"]'); } catch { /* */ }
try { await page.waitForSelector('[data-testid="ogretici"]', { timeout: 8000 }); await page.click('[data-testid="ogretici-atla"]'); } catch { /* */ }
await ev(() => { let g = window.__advanceTime(15); for (let i = 0; i < 20 && g.waitingCount === 0; i++) g = window.__advanceTime(1); });
for (const [q, pad] of [['q_table2', 'table2'], ['q_table3', 'table3'], ['q_waiter', 'waiter'], ['q_table4', 'table4'], ['q_waiter2', 'waiter2'], ['q_zone2', 'zone2'], ['q_z2table2', 'z2table2'], ['q_z2table3', 'z2table3'], ['q_dish', 'dishwasher']]) {
  await ev((q) => window.__setQuest(q), q);
  await ev(() => window.__addMoney(3000));
  const g = await ev(() => window.__game());
  if (g.currentPad === pad && g.padPos) { await ev((p) => window.__teleport(p[0], p[2]), g.padPos); await ev(() => window.__advanceTime(8)); }
  await kapatAcik();
}
await ev(() => window.__park());
await ev(() => window.__setState({ wallet: 48250, diamonds: 140, xp: Math.max(window.__game().xp ?? 0, 4000) }));
await kapatAcik();

const SAYI = '.modal-card.screen :is(.band-sub, .qbig-reward, .qrow-reward, .goal-num, .goal-reward, .usta-price, .paket-kart-miktar, .char-stat-val i)';
const SAYI_KIP = {
  S1: `${SAYI}{-webkit-text-stroke:3px var(--lila-ot);paint-order:stroke fill;color:#ffd45e}`,
  S2: `${SAYI}{-webkit-text-stroke:0} .modal-card.screen :is(.band-sub,.goal-num){color:#b05f00} .modal-card.screen :is(.qbig-reward,.qrow-reward,.goal-reward){color:#a15c00} .modal-card.screen :is(.usta-price,.paket-kart-miktar){color:#1b6fd0} .modal-card.screen .char-stat-val i{color:#2e8a25}`,
}[process.env.SAYI_KIP];
if (SAYI_KIP) await page.addStyleTag({ content: SAYI_KIP });
const rapor = {};
const cek = async (ad) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(CIKTI, `${ad}.png`) });
  rapor[ad] = await ev(kontrast);
  console.log(ad, rapor[ad].length, 'düşük');
};
const geri = async (panel) => { await page.click(`[data-testid="${panel}"] .sheet-back`); await page.waitForSelector(`[data-testid="${panel}"]`, { state: 'detached', timeout: 5000 }); };
const ac = async (dug, panel) => { await kapatAcik(); await page.click(`[data-testid="${dug}"]`, { timeout: 5000 }); await page.waitForSelector(`[data-testid="${panel}"]`, { timeout: 5000 }); };

for (const [dug, panel, ad] of [['quests', 'quests-panel', 'gorevler'], ['goals', 'goals-panel', 'hedefler'], ['char', 'char-panel', 'cayci'], ['gear', 'menu', 'ayarlar']]) {
  try { await ac(dug, panel); await cek(ad); await geri(panel); } catch (e) { console.log(ad, 'çekilemedi', e.message.split('\n')[0]); }
}
await ac('shop', 'shop-panel');
for (const [k, ad] of [['outfit', 'kiyafet'], ['decor', 'dekor'], ['floor', 'zemin'], ['paket', 'paketler']]) {
  try { await page.click(`[data-testid="shop-tab-${k}"]`, { timeout: 4000 }); await cek(`magaza-${ad}`); } catch (e) { console.log(ad, 'çekilemedi', e.message.split('\n')[0]); }
}

// SANDIK KONUMLARI — afişin kendisi kırpılarak.
const AFIS = '[data-testid="paket-kiraathane_baslangic"], .paket-afis';
const KONUM = { 'D-uygulandi': '/**/' };
for (const [ad, css] of Object.entries(KONUM)) {
  const h = await page.addStyleTag({ content: css });
  await page.waitForTimeout(250);
  const el = await page.$(AFIS);
  if (el) await el.screenshot({ path: path.join(CIKTI, `sandik-${ad}.png`) });
  await h.evaluate((e) => e.remove());
}
// ALINMIŞ HÂL — iki öneri.
const ALINDI = { 'alindi-uygulandi': '/**/' };
await ev(() => document.querySelector('.paket-afis')?.classList.add('full'));
for (const [ad, css] of Object.entries(ALINDI)) {
  const h = await page.addStyleTag({ content: css });
  await page.waitForTimeout(250);
  const el = await page.$('.paket-afis');
  if (el) await el.screenshot({ path: path.join(CIKTI, `${ad}.png`) });
  await h.evaluate((e) => e.remove());
}
writeFileSync(path.join(CIKTI, 'kontrast.json'), JSON.stringify(rapor, null, 1));
console.log('hatalar:', hatalar.length ? hatalar.slice(0, 5) : 'yok');
await browser.close();
process.exit(0);
