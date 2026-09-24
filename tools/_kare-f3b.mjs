// F3b görsel doğrulama kareleri (geçici betik) → docs/gorsel/f3b/
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5241;
const SS = path.join(KOK, 'docs', 'gorsel', 'f3b');
mkdirSync(SS, { recursive: true });

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const t = await chromium.launch();
const s = await t.newPage({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const hatalar = [];
s.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
try {
  await s.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
  await s.waitForSelector('canvas', { timeout: 20000 });
  await s.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
  const kare = async (ad) => { await s.waitForTimeout(600); await s.screenshot({ path: path.join(SS, `${ad}.png`) }); };
  const kapatSeviye = async () => { while (await s.$('[data-testid="level-up-ok"]')) { await s.click('[data-testid="level-up-ok"]'); await s.waitForTimeout(80); } };

  // Biraz oyna: kazanç izi dolsun (video ödülü > 0 olsun)
  await s.evaluate(() => window.__advanceTime(60));
  await kapatSeviye();
  // Sv 5+ (video düğmesinin kapısı) ve dolu bir kazanç izi: son 60 sn'de ₺240
  await s.evaluate(() => window.__setState({ xp: 4000, lifetime: 1240, gelirIzi: Array.from({ length: 13 }, (_, i) => 1000 + i * 20) }));
  await kare('01-yan-video-dugmesi');
  console.log('video düğmesi:', !!(await s.$('[data-testid="video-btn"]')), 'kalan:', await s.locator('[data-testid="video-kalan"]').innerText().catch(() => '-'));

  await s.click('[data-testid="video-btn"]');
  await kare('02-video-karti');
  console.log('video kartı:', await s.locator('[data-testid="video-kart"]').innerText());
  await s.click('[data-testid="video-izle"]');
  await s.waitForTimeout(400);
  console.log('izledikten sonra:', await s.locator('[data-testid="video-not"]').innerText());
  await kare('03-video-sonra');
  await s.keyboard.press('Escape');

  await s.evaluate(() => window.__setState({ levelUp: { level: 9, amount: 1234, carryBefore: 0.1, carryAfter: 0.12 } }));
  await kare('04-seviye-izle');
  console.log('seviye düğmeleri:', await s.locator('[data-testid="level-up"] button').allInnerTexts());
  await s.click('[data-testid="level-up-ok"]');

  await s.evaluate(() => window.__setState({ offlineEarned: 400, offlineIzleEki: 400 }));
  await kare('05-cevrimdisi-izle');
  console.log('çevrimdışı düğmeleri:', await s.locator('[data-testid="offline"] button').allInnerTexts());
  await s.click('[data-testid="offline-ok"]');
  await s.evaluate(() => window.__setState({ offlineEarned: 400, offlineIzleEki: 0 }));
  await s.waitForTimeout(300);
  console.log('tavandaki çevrimdışı düğmeleri:', await s.locator('[data-testid="offline"] button').allInnerTexts());
  await s.click('[data-testid="offline-ok"]');

  await s.evaluate(() => { window.__setTableLevel(0, 99); window.__setState({ nearMaster: 'table:0', diamonds: 3 }); });
  await kare('06-usta-izle');
  console.log('usta:', await s.locator('[data-testid="master-bar"]').innerText().catch(() => 'YOK'));
} finally {
  console.log('konsol hataları:', hatalar.length ? hatalar.slice(0, 3) : 'yok');
  await t.close();
  sunucu.kill();
}
