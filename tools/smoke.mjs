// Headless tarayıcı duman testi (Playwright MCP yokken yedek; CI'de de kullanılabilir).
// Çalışan dev sunucusuna bağlanır: önce `npm run dev`, sonra `node tools/smoke.mjs`.
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL || 'http://localhost:5173/';
const results = [];
const fail = (m) => {
  results.push(['FAIL', m]);
};
const pass = (m) => {
  results.push(['PASS', m]);
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  pass('Sahne yüklendi (canvas mevcut)');

  await page.waitForFunction(() => typeof window.__game === 'function', { timeout: 10000 });
  const init = await page.evaluate(() => window.__game());
  if (init.tables === 1) pass('Başlangıç: 1 masa');
  else fail(`Başlangıç masa sayısı 1 değil: ${init.tables}`);

  // Klavye hareketi: D tuşu ile +x
  await page.keyboard.down('d');
  await page.waitForTimeout(600);
  await page.keyboard.up('d');
  const moved = await page.evaluate(() => window.__game());
  if (moved.player[0] > init.player[0] + 0.3) pass(`Klavye hareketi çalışıyor (x ${init.player[0]}→${moved.player[0]})`);
  else fail(`Klavye ile hareket olmadı (x ${init.player[0]}→${moved.player[0]})`);

  // Zamanı ileri sar → NPC ödesin, para düşsün
  const after = await page.evaluate(() => window.__advanceTime(120));
  if (after.npcCount > 0) pass(`NPC akışı çalışıyor (npcCount=${after.npcCount})`);
  else fail('NPC oluşmadı');
  if (after.coins > 0 || after.lifetime > 0) pass(`Müşteri ödedi / para düştü (coins=${after.coins}, lifetime=${after.lifetime})`);
  else fail('Para düşmedi (coins=0, lifetime=0)');

  // Çay yükseltme butonu: para ekle → tıkla → seviye artmalı
  const beforeLvl = (await page.evaluate(() => window.__game())).stationLevel;
  await page.evaluate(() => window.__addMoney(100000));
  await page.click('[data-testid="upgrade-station"]');
  const afterLvl = (await page.evaluate(() => window.__game())).stationLevel;
  if (afterLvl === beforeLvl + 1) pass(`Çay yükseltme butonu çalışıyor (L${beforeLvl}→L${afterLvl})`);
  else fail(`Yükseltme butonu seviye artırmadı (L${beforeLvl}→L${afterLvl})`);

  // Generic pad: para ekle + ilk pad'in üstüne ışınla + zamanı sar → 2. masa açılmalı
  const padInfo = await page.evaluate(() => window.__game());
  if (padInfo.currentPad === 'table2' && padInfo.padPos) {
    await page.evaluate(() => window.__addMoney(300));
    await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), padInfo.padPos);
    const afterPad = await page.evaluate(() => window.__advanceTime(8));
    if (afterPad.tables >= 2 && afterPad.padsDone.includes('table2'))
      pass(`Pad sistemi çalışıyor (table2 açıldı, masa=${afterPad.tables}, sıradaki=${afterPad.currentPad})`);
    else fail(`Pad açılmadı (tables=${afterPad.tables}, padsDone=${JSON.stringify(afterPad.padsDone)})`);
  } else {
    fail(`Beklenen ilk pad table2 değil: ${padInfo.currentPad}`);
  }

  // Dikey (portrait) orana çevir → responsive kamera/HUD hatasız mı
  await page.setViewportSize({ width: 412, height: 915 });
  await page.waitForTimeout(500);
  const portrait = await page.evaluate(() => window.__game());
  const canvasOk = await page.$('canvas');
  if (canvasOk && typeof portrait.tables === 'number') pass('Portrait orana uyum sağladı (canvas + durum okunuyor)');
  else fail('Portrait orana geçişte sorun');

  if (consoleErrors.length === 0) pass('Konsol hatası yok');
  else fail(`Konsol hataları: ${consoleErrors.slice(0, 5).join(' | ')}`);
} catch (e) {
  fail('İstisna: ' + e.message);
} finally {
  await browser.close();
}

console.log('\n=== Duman Testi Sonuçları ===');
for (const [s, m] of results) console.log(`  [${s}] ${m}`);
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} geçti.`);
process.exit(failed ? 1 : 0);
