/**
 * shot-magaza-son.mjs — mağazanın ve F4c-3 tabelasının SON HÂLİ, kullanıcı incelemesi için tek turda.
 * Taze oyun → ad kutusu → cephe tabelası → Ayarlar → mağazanın yedi sekmesi (erken + geç oyun) → teklif.
 * Sunucuyu kendi kaldırır (shot-f4c2 deseni). Kullanım: node tools/shot-magaza-son.mjs
 * Çıktı: docs/gorsel/ss/son-<sıra>-<ad>.png
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5251);
const OUT = 'docs/gorsel/ss';
const AD = 'Mutlu Kahvesi';
const PADS = 'table2 table3 waiter table4 waiter2 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');

const sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
sunucu.stdout.on('data', () => {});
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* henüz yok */ }
  await new Promise((r) => setTimeout(r, 400));
}
const tarayici = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const sayfa = await tarayici.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const hatalar = [];
sayfa.on('pageerror', (e) => hatalar.push(String(e.message)));
sayfa.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
let n = 0;
const kare = async (ad, bekle = 1200) => {
  await sayfa.waitForTimeout(bekle);
  n++;
  await sayfa.screenshot({ path: `${OUT}/son-${String(n).padStart(2, '0')}-${ad}.png` });
  console.log('kare', n, ad);
};
const tikla = async (id, bekle = 700) => {
  await sayfa.click(`[data-testid="${id}"]`);
  await sayfa.waitForTimeout(bekle);
};
try {
  // 1) Taze oyun: ad kutusu bir kez.
  await sayfa.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await sayfa.waitForSelector('[data-testid="kafe-adi"]', { timeout: 60000 });
  await kare('ad-kutusu-ilk', 1500);
  await sayfa.fill('[data-testid="kafe-adi-girdi"]', AD);
  await kare('ad-kutusu-yazildi', 400);
  await tikla('kafe-adi-tamam', 1500);
  await kare('ilk-kare-sonrasi', 1500);

  // 2) Cephe tabelası oyun kamerasından.
  await sayfa.evaluate(() => window.__setState({ questIndex: 999 }));
  for (const [ad, x, z] of [['tabela-dogus', -8.5, 13.4], ['tabela-kapi', -8.5, 16.2]]) {
    await sayfa.evaluate(([x, z]) => window.__teleport(x, z), [x, z]);
    await kare(ad, 3500);
  }

  // 3) Ayarlar: ad satırı + düzenleme kutusu.
  await tikla('gear', 1000);
  await kare('ayarlar');
  await tikla('set-kafe-adi', 800);
  await kare('ayarlar-ad-duzenle');
  await tikla('kafe-adi-vazgec', 600);
  await sayfa.keyboard.press('Escape');
  await sayfa.waitForTimeout(600);

  // 4) Mağaza — erken oyun (1. Salon, başlangıç 100 💎).
  await tikla('shop', 1500);
  await kare('magaza-kiyafet');
  await tikla('shop-card-outfit-kurucu');
  await kare('magaza-kiyafet-kurucu-paketli');
  await tikla('shop-tab-tray');
  await tikla('shop-card-tray-altin');
  await kare('magaza-tepsi');
  await tikla('shop-tab-decor');
  await tikla('shop-card-decor-semaver');
  await kare('magaza-dekor-kilitli');
  await tikla('shop-card-decor-yilbasi-kirmizi');
  await kare('magaza-dekor-yilbasi');
  await tikla('shop-tab-paket');
  await kare('magaza-paketler');
  // F4c-4: gerçek parayla alımın karşılığı (dev'de mağaza sahtesi hemen onaylar).
  await sayfa.click('[data-testid="paket-al-kiraathane_reklamsiz"]').catch(() => {});
  await sayfa.waitForSelector('[data-testid="satin-odul"]', { timeout: 4000 }).then(() => kare('paket-alindi', 600)).catch(() => console.log('paket ödül kartı çıkmadı'));
  await sayfa.click('[data-testid="satin-odul-tamam"]').catch(() => {});
  await tikla('shop-tab-table');
  await kare('magaza-masa-kilitli');
  await tikla('shop-tab-floor');
  await kare('magaza-zemin');
  await tikla('shop-tab-wall');
  await kare('magaza-duvar');
  await sayfa.keyboard.press('Escape');
  await sayfa.waitForTimeout(600);

  // 5) Geç oyun: üç salon açık, dekor sahip + yerinde.
  await sayfa.evaluate((pads) => window.__setState({
    padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(4), diamonds: 320,
    ownedCosmetics: ['decor:semaver', 'decor:radyo', 'decor:saat'], dekor: { semaver: 'semaver', radyo: 'radyo', saat: 'saat' },
  }), PADS);
  await sayfa.waitForTimeout(2500);
  await tikla('shop', 1500);
  await tikla('shop-tab-decor');
  await tikla('shop-card-decor-semaver');
  await kare('gec-dekor-salonda');
  await tikla('shop-card-decor-gramofon');
  await kare('gec-dekor-satin-al');
  // F4c-4: alım anı — bildirim (mağazanın üstünde) + satın alma sesi.
  await tikla('shop-buy', 300);
  await kare('gec-dekor-alindi-bildirim', 200);
  // F4c-4 (D-157): dokuz eşyanın salondaki yerinden çekilmiş önizlemesi — mağazanın kendi kutusu.
  for (const esya of ['radyo', 'koltuk', 'lamba', 'tablo', 'semaver', 'gramofon', 'kanarya', 'saat', 'yilbasi-yesil']) {
    await tikla(`shop-card-decor-${esya}`, 1800);
    await sayfa.locator('[data-testid="dekor-onizleme"]').screenshot({ path: `${OUT}/son-onizleme-${esya}.png` });
  }
  await tikla('shop-tab-table');
  await kare('gec-masa');
  await tikla('shop-tab-floor');
  await tikla('shop-zone-2');
  await kare('gec-zemin-salon3');
  await sayfa.keyboard.press('Escape');
  await sayfa.waitForTimeout(600);
  await sayfa.evaluate(() => window.__teleport(-14.2, -1.2));
  await kare('gec-oyunda-dekor', 3500);
  await sayfa.evaluate(() => window.__teleport(-8.5, 16.2));
  await kare('gec-tabela', 3500);

  // 6) Başlangıç teklifi (ilk Usta'dan sonra bir kez).
  await sayfa.evaluate(() => window.__setState({ mastersOwned: ['t0'], satin: { reklamsiz: false, baslangic: false, gunlukGun: -1, islenen: [], teklif: false } }));
  await sayfa.waitForSelector('[data-testid="baslangic-teklif"]', { timeout: 8000 });
  await kare('baslangic-teklif', 1500);
} catch (e) {
  console.error('HATA', n, e.message);
  await sayfa.screenshot({ path: `${OUT}/son-hata.png` });
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
