/**
 * shot-e5.mjs — E5 ÖĞRETİCİNİN GÖRSEL KANITI (telefon dikey 390×844).
 *
 * Taze oyun, gerçek akış: kareler sahte hâl kurmaz — oyuncu gerçekten yürür, ocağa gider,
 * servis eder, para düşer, pad görevine gelinir. Yalnız el animasyonu kare için sabit bir
 * ana dondurulur (Web Animations API; süreyi değil yalnız KAREYİ seçer).
 *
 *   e5-1-yuru    — ilk kare: sürükleyen el + "Ekranı sürükle, yürü"
 *   e5-2-cay-al  — yürüdükten sonra: zemin izi ocağa
 *   e5-3-servis  — tepside çay: iz çay bekleyen müşteriye
 *   e5-4-para    — yerde para: iz paraya
 *   e5-5-pad     — ilk pad: iz alana + "Alanın üstünde dur"
 *   e5-6-bitti   — pad açıldı: öğretici yok, oyun kendi hâlinde
 *
 * Koşu:  node tools/shot-e5.mjs   ·   E5_PORT=5302 node tools/shot-e5.mjs
 *        (E5_URL verilirse çalışan sunucu kullanılır, yenisi açılmaz)
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.E5_PORT ?? '', 10) || 5217;
const URL = process.env.E5_URL || `http://127.0.0.1:${PORT}/`;
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

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

const sunucu = process.env.E5_URL ? null : await sunucuKaldir();
const tarayici = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const hatalar = [];
try {
  const baglam = await tarayici.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const s = await baglam.newPage();
  s.on('pageerror', (e) => hatalar.push(e.message));
  await s.goto(URL, { waitUntil: 'domcontentloaded' });
  await s.waitForFunction(() => typeof window.__game === 'function', { timeout: 60_000 });
  await s.waitForSelector('.splash', { state: 'detached', timeout: 30_000 }).catch(() => {});
  // Taze oyun: ad kutusu kare araçlarında elle geçilir (oyuncu "Tamam" demiş gibi).
  await s.evaluate(() => window.__setState({ kafeAdi: 'Köşe Kahvesi' }));

  const adim = () => s.evaluate(() => document.querySelector('[data-testid="ogretici"]')?.getAttribute('data-adim') ?? null);
  const kare = async (ad, bekle = 700) => {
    await s.waitForTimeout(bekle);
    // El döngüsünü "sürüklenmiş" anda dondur (tur %60).
    await s.evaluate(() => {
      for (const a of document.getAnimations()) {
        const t = a.effect?.getComputedTiming?.();
        if (t && Number.isFinite(t.duration) && t.iterations === Infinity) { a.pause(); a.currentTime = t.duration * 0.6; }
      }
    });
    const d = path.join(OUT, `${ad}.png`);
    await s.screenshot({ path: d });
    console.log(`${ad}.png  adim=${await adim()}`);
  };
  // Kutlama penceresi + bildirim geçsin (ipucular o sırada sıra bekler).
  const gecis = () => s.evaluate(() => window.__advanceTime(2.5));
  const g0 = await s.evaluate(() => window.__game());
  const P = g0.player;

  await kare('e5-1-yuru', 2500);

  // Yürü: gerçek klavye girişi (joystick ile aynı yol).
  await s.keyboard.down('s');
  await s.waitForTimeout(350);
  await s.keyboard.up('s');
  await s.evaluate(() => window.__advanceTime(6));
  await kare('e5-2-cay-al');

  // Ocağa git → tepsi dolar (q_pickup) → müşteri otursun diye zaman sar.
  const d1 = await s.evaluate(() => window.__advanceTime(10));
  await s.evaluate((p) => window.__teleport(p[0], p[2]), d1.stationPos);
  await s.evaluate(() => window.__advanceTime(1.5));
  await gecis();
  await s.evaluate((p) => window.__teleport(p[0], p[2] + 0.8), P);
  await s.evaluate(() => {
    for (let i = 0; i < 60 && window.__game().waitingCount === 0; i++) window.__advanceTime(0.5);
  });
  await kare('e5-3-servis');

  // Servis et (q_serve1) → müşteri içip ödesin → para yerde.
  const seat = await s.evaluate(() => window.__game().firstWaitingSeat);
  if (seat) await s.evaluate((p) => window.__teleport(p[0], p[2]), seat);
  await s.evaluate(() => window.__advanceTime(0.6));
  await s.evaluate((p) => window.__teleport(p[0], p[2] + 0.8), P);
  await s.evaluate(() => {
    for (let i = 0; i < 80 && window.__game().coins === 0; i++) window.__advanceTime(0.25);
  });
  await s.evaluate(() => window.__advanceTime(0.3));
  await kare('e5-4-para');

  // Parayı topla (q_coin) → pad görevi (q_table2).
  const coin = seat;
  if (coin) await s.evaluate((p) => window.__teleport(p[0], p[2]), coin);
  await s.evaluate(() => window.__advanceTime(0.8));
  await gecis();
  await s.evaluate(() => window.__addMoney(200));
  await s.evaluate((p) => window.__teleport(p[0], p[2] + 0.8), P);
  await s.evaluate(() => window.__advanceTime(0.5));
  await kare('e5-5-pad');

  const pad = await s.evaluate(() => window.__game().padPos);
  if (pad) await s.evaluate((p) => window.__teleport(p[0], p[2]), pad);
  await s.evaluate(() => window.__advanceTime(8));
  await gecis();
  await s.evaluate(() => { const lv = document.querySelector('[data-testid="level-up-ok"]'); lv?.click(); });
  await kare('e5-6-bitti');
  const son = await s.evaluate(() => window.__game());
  console.log(`son gorev: ${son.quest?.id} · tables=${son.tables}`);
} finally {
  await tarayici.close();
  sunucu?.kill();
}
if (hatalar.length) {
  console.error('sayfa hatalari:', hatalar);
  process.exit(1);
}
