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

  // QUEST AKIŞI: yukarıdaki doğal oyun (çay al → servis → para topla) ilk 3 görevi bitirmiş olmalı
  // → aktif görev "2. Masayı aç" (q_table2) ve EKRANDA TEK PAD kuralıyla görünür pad = table2.
  await page.evaluate(() => window.__addMoney(300));
  const padInfo = await page.evaluate(() => window.__game());
  if (padInfo.quest && padInfo.quest.id === 'q_table2') pass(`Quest hattı doğal akışla ilerledi (aktif görev: ${padInfo.quest.title})`);
  else fail(`Aktif görev q_table2 değil: ${JSON.stringify(padInfo.quest)} (stats=${JSON.stringify(padInfo.stats)})`);
  if (padInfo.currentPad === 'table2' && padInfo.padPos) {
    await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), padInfo.padPos);
    const afterPad = await page.evaluate(() => window.__advanceTime(8));
    if (afterPad.tables >= 2 && afterPad.padsDone.includes('table2'))
      pass(`Pad sistemi + gating çalışıyor (table2 açıldı, masa=${afterPad.tables}, görev=${afterPad.quest?.title})`);
    else fail(`Pad açılmadı (tables=${afterPad.tables}, padsDone=${JSON.stringify(afterPad.padsDone)})`);
  } else {
    fail(`Beklenen görünür pad table2 değil: ${padInfo.currentPad}`);
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

  // OMURGA (quest hattı, 2026-06-09): table3 → garson → (assist) → garson hız → bulaşıkçı → table4.
  // Personel artık zorunlu halka; pad yalnız kendi görevi aktifken görünür (__setQuest ile atla).
  // 3. Masa (garson önkoşulu).
  await page.evaluate(() => window.__setQuest('q_table3'));
  await page.evaluate(() => window.__addMoney(2000));
  const t3 = await page.evaluate(() => window.__game());
  if (t3.currentPad === 'table3' && t3.padPos) {
    await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), t3.padPos);
    await page.evaluate(() => window.__advanceTime(8));
  }
  if ((await page.evaluate(() => window.__game())).padsDone.includes('table3')) pass('3. Masa açıldı (quest hattı)');
  else fail('3. Masa açılamadı');

  // Garson tut (omurga halkası; quest görevi aktifken pad görünür).
  await page.evaluate(() => window.__setQuest('q_waiter'));
  await page.evaluate(() => window.__addMoney(500));
  const wq = await page.evaluate(() => window.__game());
  if (wq.currentPad === 'waiter' && wq.padPos) {
    pass('Garson pad\'i yalnız kendi görevinde görünüyor (ekranda tek pad)');
    await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), wq.padPos);
    const hired = await page.evaluate(() => window.__advanceTime(8));
    if (hired.hasWaiter) pass('Garson tutuldu (hasWaiter=true)');
    else fail(`Garson tutulamadı (hasWaiter=${hired.hasWaiter})`);
  } else {
    fail(`Garson pad'i görünmüyor (currentPad=${wq.currentPad}, quest=${JSON.stringify(wq.quest)})`);
  }

  // Kısmi assist: oyuncuyu kimseyi servis edemeyeceği uzak köşeye park et → garson tek başına servis edip para düşürmeli.
  await page.evaluate(() => window.__teleport(5.2, 4.2));
  const beforeCoins = (await page.evaluate(() => window.__game())).coins;
  const assisted = await page.evaluate(() => window.__advanceTime(40));
  if (assisted.coins > beforeCoins)
    pass(`Garson kısmi assist çalışıyor (oyuncu uzakta, düşen para ${beforeCoins}→${assisted.coins})`);
  else fail(`Garson servis etmedi (coins ${beforeCoins}→${assisted.coins}, waiterTray=${assisted.waiterTray})`);

  // Garson L2 hız yükseltme: ARKA-PLAN ŞARTI minWaiterServed=20 → garson 20 çay taşımadan işaret kilitli.
  const preGrant = await page.evaluate(() => window.__game());
  if ((preGrant.stats?.waiterServed ?? 0) < 20) {
    pass(`Garson hız yükseltmesi hemen GELMEDİ (waiterServed=${preGrant.stats.waiterServed} < 20 — arka-plan şartı)`);
  } else {
    pass(`Garson 20+ çay taşımış (waiterServed=${preGrant.stats.waiterServed}) — şart doğal karşılandı`);
  }
  await page.evaluate(() => window.__grantStat('waiterServed', 20));
  const wUp = await page.evaluate(() => window.__game());
  const beforeWL = wUp.waiterLevel;
  await page.evaluate(() => window.__addMoney(500));
  await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), wUp.waiterUpgradeSpotPos);
  const wL2 = await page.evaluate(() => window.__advanceTime(6));
  if (wL2.waiterLevel > beforeWL)
    pass(`Garson hız yükseltme çalışıyor (L${beforeWL + 1}→L${wL2.waiterLevel + 1})`);
  else fail(`Garson hız yükseltmedi (waiterLevel ${beforeWL}→${wL2.waiterLevel})`);

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

  // Omurga sonu: bulaşıkçı (table4 önkoşulu) + 4. masa (quest hattıyla).
  for (const [qid, pid] of [['q_dish', 'dishwasher'], ['q_table4', 'table4']]) {
    await page.evaluate((q) => window.__setQuest(q), qid);
    await page.evaluate(() => window.__addMoney(2000));
    const g = await page.evaluate(() => window.__game());
    if (g.currentPad === pid && g.padPos) {
      await page.evaluate((pos) => window.__teleport(pos[0], pos[2]), g.padPos);
      await page.evaluate(() => window.__advanceTime(8));
    }
  }
  const opened = await page.evaluate(() => window.__game());
  if ((opened.padsDone || []).includes('dishwasher') && (opened.padsDone || []).includes('table4'))
    pass(`Omurga tamam (bulaşıkçı + 4. masa, padsDone=${opened.padsDone.length})`);
  else fail(`Bulaşıkçı/4. masa açılmadı (padsDone=${JSON.stringify(opened.padsDone)})`);

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
  // ('opt:waiter' kalktı — personel artık quest hattının zorunlu halkası, opsiyonel pad yok.)
  const reveals = (await page.evaluate(() => window.__game())).revealSeen || [];
  const wantReveals = ['upgrade', 'waiterUp', 'tableUp'];
  const missing = wantReveals.filter((k) => !reveals.includes(k));
  if (missing.length === 0) pass(`Yeni-özellik bildirimi çalışıyor (reveal: ${reveals.join(', ')})`);
  else fail(`Eksik reveal bildirimi: ${missing.join(', ')} (görülen: ${reveals.join(', ')})`);

  // GÖREV BARI DOM'da (HUD redesign): üst-orta quest chip'i + para chip'i var; eski sayaç chip'leri YOK.
  const questBar = await page.$('[data-testid="quest"]');
  const walletChip = await page.$('[data-testid="wallet"]');
  const oldChip = await page.$('[data-testid="tray"]');
  if (walletChip && !oldChip) pass('HUD sade: para chip\'i var, eski sayaç chip\'leri kaldırıldı');
  else fail(`HUD beklenen durumda değil (wallet=${!!walletChip}, eskiChip=${!!oldChip})`);
  if (questBar) pass('Görev barı DOM\'da (quest sistemi)');
  else {
    // Görev hattı bitmişse bar görünmez — bunu da geçerli say (oyun sonu durumu).
    const qNow = await page.evaluate(() => window.__game());
    if (!qNow.quest) pass('Görev barı yok çünkü görev hattı bitti (geçerli)');
    else fail(`Görev barı DOM'da yok ama aktif görev var: ${JSON.stringify(qNow.quest)}`);
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
