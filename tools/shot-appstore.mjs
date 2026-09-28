/**
 * shot-appstore.mjs — App Store için HAM ekran görüntüleri (çerçevesiz, yazısız).
 * İki cihaz boyu: iPhone 6,9" (440×956 @3 = 1320×2868) · iPad 13" (1032×1376 @2 = 2064×2752).
 * Altı an: ilk servis · siparişler · dolu salon · mutfak · dekor mağazası · Usta.
 * Sunucuyu kendi kaldırır. Kullanım: node tools/shot-appstore.mjs  (SADECE=iphone|ipad)
 * Çıktı: docs/magaza-kareleri/appstore/<cihaz>-<sıra>-<an>.png
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5304);
const OUT = path.join(KOK, 'docs/magaza-kareleri/appstore');
mkdirSync(OUT, { recursive: true });
const AD = 'Köşe Kıraathanesi';
const PADS = 'table2 table3 waiter table4 waiter2 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
const SALON = (process.env.SALON ?? '-3,8.6').split(',');
const CIHAZLAR = [
  { ad: 'iphone69', viewport: { width: 440, height: 956 }, dpr: 3 },
  { ad: 'ipad13', viewport: { width: 1032, height: 1376 }, dpr: 2 },
].filter((c) => !process.env.SADECE || c.ad.startsWith(process.env.SADECE));

const sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--config', 'tools/vite-kare.config.mjs', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
sunucu.stdout.on('data', () => {});
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* henüz yok */ }
  await new Promise((r) => setTimeout(r, 400));
}
const tarayici = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const hatalar = [];
try {
  for (const c of CIHAZLAR) {
    const baglam = await tarayici.newContext({ viewport: c.viewport, deviceScaleFactor: c.dpr, hasTouch: true, isMobile: c.ad.startsWith('iphone') });
    const s = await baglam.newPage();
    s.on('pageerror', (e) => hatalar.push(`${c.ad}: ${e.message}`));
    s.on('console', (m) => m.type() === 'error' && hatalar.push(`${c.ad}: ${m.text()}`));
    s.on('response', (r) => r.status() >= 400 && hatalar.push(`${c.ad}: ${r.status()} ${r.url()}`));
    let n = 0;
    const kare = async (ad, bekle = 1500) => {
      await s.waitForTimeout(bekle);
      n++;
      await s.screenshot({ path: `${OUT}/${c.ad}-${n}-${ad}.png` });
      console.log(c.ad, n, ad);
    };
    const sar = async (sn, adim = 2) => {
      for (let t = 0; t < sn; t += adim) { await s.evaluate((a) => window.__advanceTime(a), adim); await s.waitForTimeout(120); }
    };
    const modallariKapat = () => s.evaluate(() => window.__setState({ levelUp: null, offlineEarned: 0 }));

    // 1) İLK SERVİS — taze oyun, ad verildi, ilk masalar, elde iki bardak çay.
    await s.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await s.addStyleTag({ content: '.dsb-fab{display:none!important}' });
    await s.waitForSelector('[data-testid="kafe-adi"]', { timeout: 60000 });
    await s.fill('[data-testid="kafe-adi-girdi"]', AD);
    await s.click('[data-testid="kafe-adi-tamam"]');
    await s.waitForTimeout(1500);
    await s.evaluate(() => window.__setState({ padsDone: ['table2', 'table3'], padFills: {}, xp: 400, wallet: 180 }));
    await sar(30);
    await modallariKapat();
    await s.evaluate(() => window.__teleport(-12.2, 9.4));
    await sar(4);
    await modallariKapat();
    await s.evaluate(() => window.__setState({ tray: 2 }));
    await kare('ilk-servis', 2500);

    // 2) DOLU SALON — üç salon açık, masalar yükseltilmiş, müşteriler oturmuş.
    await s.evaluate((pads) => window.__setState({
      padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(3), diamonds: 320, wallet: 48250, xp: 60000, questIndex: 999,
      ownedCosmetics: ['decor:semaver', 'decor:radyo', 'decor:saat', 'decor:gramofon'], dekor: { semaver: 'semaver', radyo: 'radyo', saat: 'saat', gramofon: 'gramofon' },
    }), PADS);
    await s.waitForTimeout(2000);
    await sar(60);
    await modallariKapat();
    await s.evaluate(([x, z]) => window.__teleport(x, z), SALON.map(Number));
    await kare('dolu-salon', 3000);

    // 3) SİPARİŞLER — masa başında sipariş balonları, garsonlar ve müşteriler yakından.
    await s.evaluate(() => window.__setQuest('q_tableL2'));
    const spot = (await s.evaluate(() => window.__game())).tableUpgradeSpots[6];
    await s.evaluate((p) => window.__teleport(p[0] - 1.4, p[2] + 1.6), spot);
    await kare('siparisler', 1500);
    await s.evaluate(() => window.__setState({ questIndex: 999 }));
    await sar(4);
    await modallariKapat();

    // 4) MUTFAK — çaycının hattı, tezgâh önü.
    await s.evaluate(() => window.__teleport(-13.0, -8.6));
    await sar(6);
    await modallariKapat();
    await kare('mutfak', 3000);

    // 5) DEKOR MAĞAZASI — gramofon salondaki yerinde.
    await s.click('[data-testid="shop"]');
    await s.waitForTimeout(1200);
    await s.click('[data-testid="shop-tab-decor"]');
    await s.waitForTimeout(700);
    await s.click('[data-testid="shop-card-decor-kanarya"]');
    await kare('dekor-magazasi', 2500);
    await s.keyboard.press('Escape');
    await s.waitForTimeout(800);

    // 6) USTA — masayı kalıcı ×1,5 bahşişe çıkaran 💎 onayı.
    await s.evaluate(() => { window.__setTableLevel(0, 99); });
    const us = (await s.evaluate(() => window.__game())).tableUpgradeSpots[0];
    await s.evaluate((p) => window.__teleport(p[0], p[2]), us);
    await s.evaluate(() => window.__setState({ nearMaster: 'table:0', diamonds: 320 }));
    await kare('usta', 1800);
    await baglam.close();
  }
} catch (e) {
  console.error('HATA', e.message);
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
