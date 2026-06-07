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

  // Zamanı ileri sar → müşteri otursun, ocak hazır-kuyruğa demlesin (D-011)
  const seated = await page.evaluate(() => window.__advanceTime(15));
  if (seated.npcCount > 0) pass(`NPC akışı çalışıyor (npcCount=${seated.npcCount})`);
  else fail('NPC oluşmadı');
  if (seated.readyCups > 0) pass(`Ocak hazır-kuyruğa demledi (readyCups=${seated.readyCups})`);
  else fail(`Hazır çay demlenmedi (readyCups=${seated.readyCups})`);
  if (seated.waitingCount > 0) pass(`Müşteri çay bekliyor (waitingCount=${seated.waitingCount})`);
  else fail(`Bekleyen müşteri yok (waitingCount=${seated.waitingCount})`);

  // Manuel servis: ocağa git (tepsi dolar) → bekleyen koltuğa git (çay bırak) → ödeme + toplama
  const seat = seated.firstWaitingSeat;
  await page.evaluate((p) => window.__teleport(p[0], p[2]), seated.stationPos);
  const loaded = await page.evaluate(() => window.__advanceTime(0.5));
  if (loaded.tray > 0) pass(`Tepsi ocaktan doldu (tray=${loaded.tray}/${loaded.trayCap})`);
  else fail(`Tepsi dolmadı (tray=${loaded.tray})`);

  if (seat) {
    await page.evaluate((p) => window.__teleport(p[0], p[2]), seat);
    const served = await page.evaluate(() => window.__advanceTime(8));
    if (served.lifetime > 0)
      pass(`Manuel servis → ödeme → toplama çalışıyor (lifetime=${Math.floor(served.lifetime)})`);
    else fail(`Servis sonrası para gelmedi (lifetime=${served.lifetime}, tray=${served.tray})`);
  } else {
    fail('Bekleyen müşteri koltuğu bulunamadı (firstWaitingSeat null)');
  }

  // Gating: para ekle (lifetime ≥ 30) → ilk aktif pad table2 olmalı, açılış sırasını doğrula.
  await page.evaluate(() => window.__addMoney(300));
  const padInfo = await page.evaluate(() => window.__game());
  if (padInfo.currentPad === 'table2' && padInfo.padPos) {
    await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), padInfo.padPos);
    const afterPad = await page.evaluate(() => window.__advanceTime(8));
    if (afterPad.tables >= 2 && afterPad.padsDone.includes('table2'))
      pass(`Pad sistemi + gating çalışıyor (table2 açıldı, masa=${afterPad.tables}, sıradaki=${afterPad.nextStep})`);
    else fail(`Pad açılmadı (tables=${afterPad.tables}, padsDone=${JSON.stringify(afterPad.padsDone)})`);
  } else {
    fail(`Beklenen ilk aktif pad table2 değil: ${padInfo.currentPad} (nextStep=${padInfo.nextStep})`);
  }

  // Mekânsal çay yükseltme (table2 sonrası açılır): para ekle + noktaya ışınla + zaman sar → seviye artmalı.
  // (D-019 reveal: ocak yükseltme garsondan ÖNCE — garson "ocak L1 olunca" belirir.)
  const beforeLvl = (await page.evaluate(() => window.__game())).stationLevel;
  await page.evaluate(() => window.__addMoney(100000));
  const uz = (await page.evaluate(() => window.__game())).upgradeZonePos;
  await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), uz);
  const afterUp = await page.evaluate(() => window.__advanceTime(5));
  if (afterUp.stationLevel > beforeLvl)
    pass(`Mekânsal çay yükseltme çalışıyor (L${beforeLvl}→L${afterUp.stationLevel})`);
  else fail(`Yükseltme noktası seviye artırmadı (L${beforeLvl}→L${afterUp.stationLevel})`);

  // Garson (Faz 2d, OPSİYONEL pad): D-019 reveal → ocak L1 SONRASI alınabilir listede olmalı; tutunca hasWaiter=true.
  const optInfo = await page.evaluate(() => window.__game());
  const waiterPad = (optInfo.optionalPads || []).find((p) => p.id === 'waiter');
  if (waiterPad && waiterPad.pos) {
    pass('Garson opsiyonel pad olarak sunuluyor (omurgayı kilitlemez)');
    await page.evaluate(() => window.__addMoney(300));
    await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), waiterPad.pos);
    const hired = await page.evaluate(() => window.__advanceTime(8));
    if (hired.hasWaiter) pass('Garson tutuldu (hasWaiter=true)');
    else fail(`Garson tutulamadı (hasWaiter=${hired.hasWaiter})`);

    // Kısmi assist: oyuncuyu kimseyi servis edemeyeceği uzak köşeye park et → garson tek başına servis edip para düşürmeli.
    // (Yeni sol-yaslı yerleşim: masalar solda; sağ-arka köşe tüm masalardan attract yarıçapı dışında.)
    await page.evaluate(() => window.__teleport(5.2, 4.2));
    const beforeCoins = (await page.evaluate(() => window.__game())).coins;
    const assisted = await page.evaluate(() => window.__advanceTime(40));
    if (assisted.coins > beforeCoins)
      pass(`Garson kısmi assist çalışıyor (oyuncu uzakta, düşen para ${beforeCoins}→${assisted.coins})`);
    else fail(`Garson servis etmedi (coins ${beforeCoins}→${assisted.coins}, waiterTray=${assisted.waiterTray})`);

    // Garson L2 hız yükseltme (D-018 §6): garson tutulunca tuttuğun noktada işaret belirir; üstünde dur → L2 olur.
    const wUp = await page.evaluate(() => window.__game());
    const beforeWL = wUp.waiterLevel;
    await page.evaluate(() => window.__addMoney(500));
    await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), wUp.waiterUpgradeSpotPos);
    const wL2 = await page.evaluate(() => window.__advanceTime(6));
    if (wL2.waiterLevel > beforeWL)
      pass(`Garson hız yükseltme çalışıyor (L${beforeWL + 1}→L${wL2.waiterLevel + 1})`);
    else fail(`Garson hız yükseltmedi (waiterLevel ${beforeWL}→${wL2.waiterLevel})`);
  } else {
    fail(`Garson opsiyonel pad listesinde yok: ${JSON.stringify(optInfo.optionalPads)}`);
  }

  // Bardak döngüsü (Faz 2e): garson servis ederken kirli bardak üretilir → oyuncu toplar → bulaşıkta yıkar.
  await page.evaluate(() => window.__teleport(5.2, 4.2)); // oyuncu uzak köşede; garson servis etsin, kirli birikir
  const cupRun = await page.evaluate(() => window.__advanceTime(30));
  if (cupRun.dirtyCount > 0 || cupRun.carriedDirty > 0) {
    pass(`Kirli bardak üretiliyor (içen müşteri masada bırakıyor, dirty=${cupRun.dirtyCount})`);
    const dishPos = cupRun.firstDishPos;
    if (dishPos) {
      const beforeClean = cupRun.cleanCups;
      await page.evaluate((p) => window.__teleport(p[0], p[2]), dishPos);
      const collected = await page.evaluate(() => window.__advanceTime(0.5));
      if (collected.carriedDirty > 0) pass(`Kirli bardak toplanıyor (carriedDirty=${collected.carriedDirty})`);
      else fail(`Kirli bardak toplanmadı (carriedDirty=${collected.carriedDirty})`);
      // Bulaşığa götür → yıka → temiz havuza döner
      await page.evaluate((p) => window.__teleport(p[0], p[2]), collected.dishStationPos);
      const washed = await page.evaluate(() => window.__advanceTime(0.5));
      if (washed.carriedDirty === 0 && washed.cleanCups + washed.readyCups >= beforeClean)
        pass(`Bulaşıkta yıkanıyor (taşınan→temize döndü, clean+ready=${washed.cleanCups + washed.readyCups})`);
      else fail(`Yıkama olmadı (carriedDirty=${washed.carriedDirty}, clean=${washed.cleanCups})`);
    } else {
      fail('Kirli bardak konumu okunamadı (firstDishPos null)');
    }
  } else {
    fail(`Kirli bardak üretilmedi (dirty=${cupRun.dirtyCount}, carried=${cupRun.carriedDirty})`);
  }

  // (D-018: tepsi yükseltme KALDIRILDI → tepsi sabit 2; ilgili smoke testi de kaldırıldı.)

  // Omurga: 3. ve 4. masayı aç (D-019 §3: masa yükseltme işaretleri TÜM masalar açılınca belirir).
  for (const id of ['table3', 'table4']) {
    await page.evaluate(() => window.__addMoney(2000));
    const g = await page.evaluate(() => window.__game());
    if (g.currentPad === id && g.padPos) {
      await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), g.padPos);
      await page.evaluate(() => window.__advanceTime(8));
    }
  }
  const opened = await page.evaluate(() => window.__game());
  if ((opened.padsDone || []).includes('table4')) pass(`Omurga açıldı (3. + 4. masa, padsDone=${opened.padsDone.length})`);
  else fail(`3./4. masa açılmadı (padsDone=${JSON.stringify(opened.padsDone)})`);

  // Masa yükseltme (Faz 2h, MASA-BAŞI): TÜM masalar açılınca her masanın YANINDAKİ nokta aktif. 0. masanın
  // noktasına git → SADECE o masa yükselir (bahşiş+sabır); komşu masa etkilenmez.
  const preTable = await page.evaluate(() => window.__game());
  if ((preTable.padsDone || []).includes('table4')) {
    const before0 = (preTable.tableLevels || [])[0] ?? 0;
    const before1 = (preTable.tableLevels || [])[1] ?? 0;
    await page.evaluate(() => window.__addMoney(5000));
    await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), preTable.tableUpgradeSpots[0]);
    const afterTable = await page.evaluate(() => window.__advanceTime(6));
    const after0 = (afterTable.tableLevels || [])[0] ?? 0;
    const after1 = (afterTable.tableLevels || [])[1] ?? 0;
    if (after0 > before0 && after1 === before1)
      pass(`Masa-başı yükseltme çalışıyor (0. masa ${before0}→${after0}, 1. masa ${after1} sabit)`);
    else fail(`Masa-başı yükseltme hatalı (0:${before0}→${after0}, 1:${before1}→${after1})`);
  } else {
    fail(`Masa yükseltme için 4. masa açık değil (padsDone=${JSON.stringify(preTable.padsDone)})`);
  }

  // Yeni-özellik bildirimi (D-019 §4): ilerleme boyunca açılan ikincil özellikler bildirilmiş olmalı.
  const reveals = (await page.evaluate(() => window.__game())).revealSeen || [];
  const wantReveals = ['upgrade', 'opt:waiter', 'waiterUp', 'tableUp'];
  const missing = wantReveals.filter((k) => !reveals.includes(k));
  if (missing.length === 0) pass(`Yeni-özellik bildirimi çalışıyor (reveal: ${reveals.join(', ')})`);
  else fail(`Eksik reveal bildirimi: ${missing.join(', ')} (görülen: ${reveals.join(', ')})`);

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
