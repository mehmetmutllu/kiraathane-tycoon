// T9d görsel doğrulama kareleri (geçici betik) → docs/gorsel/t9d/
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5239;
const SS = path.join(KOK, 'docs', 'gorsel', 't9d');
mkdirSync(SS, { recursive: true });

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const t = await chromium.launch();
const s = await t.newPage({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const hatalar = [];
s.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
await s.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
await s.waitForSelector('canvas', { timeout: 20000 });
await s.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
const kare = async (ad) => { await s.waitForTimeout(500); await s.screenshot({ path: path.join(SS, `${ad}.png`) }); };
const kapat = async () => { await s.keyboard.press('Escape'); await s.waitForTimeout(300); };

// 1) para biçimi + bildirim genişliği
await s.evaluate(() => window.__setState({ wallet: 6042.7, diamonds: 12 }));
await s.evaluate(() => window.__setState({ notice: { kind: 'reveal', text: 'Bekleyen paralar otomatik toplandı — masalar da temizlendi', ttl: 30, reward: 273.33 } }));
await kare('01-para-bildirim');
console.log('cüzdan:', await s.locator('[data-testid="wallet"]').innerText());
await s.evaluate(() => window.__setState({ notice: null, wallet: 1_290_000 }));
await s.waitForTimeout(200);
console.log('cüzdan 1,29 Mn:', await s.locator('[data-testid="wallet"]').innerText());

// 2) pad görevi: bant kalan tutarı (B8)
await s.evaluate(() => window.__setQuest('q_table2'));
await s.evaluate(() => window.__setState({ padFills: { table2: 7 } }));
await kare('02-bant-kalan');
console.log('bant tutarı:', await s.locator('[data-testid="quest-cost"]').innerText().catch(() => 'YOK'));

// 3) çok adımlı görev sayacı (B7)
await s.evaluate(() => window.__setQuest('q_tableL2x2'));
await s.evaluate(() => window.__setTableLevel(0, 2));
await kare('03-bant-sayac');
console.log('bant sayaç:', await s.locator('[data-testid="quest-prog"]').innerText().catch(() => 'YOK'));

// 4) Sv 2 ekranı (K3)
await s.evaluate(() => window.__setState({ levelUp: { level: 2, amount: 0, carryBefore: 0, carryAfter: 0.02 } }));
await kare('04-seviye2');
console.log('seviye düğmeleri:', await s.locator('[data-testid="level-up"] button').allInnerTexts());
await s.click('[data-testid="level-up-ok"]');

// 5) çaycı paneli: Son seviye + eksik (B12 · K6)
await s.evaluate(() => window.__setState({ wallet: 5 }));
await s.click('[data-testid="char"]');
await kare('05-cayci-panel');
await kapat();

// 6) ayarlar + sıfırlama onayı (K9 · C5)
await s.click('[data-testid="gear"]');
await kare('06-ayarlar');
await s.click('[data-testid="reset"]');
await kare('07-sifirla-onay');
await s.click('[data-testid="reset-no"]');
await kapat();

// 7) hat sonu günlük bandı (K1)
await s.evaluate(() => window.__setState({ questIndex: 999 }));
await s.evaluate(() => window.__advanceTime(1));
await s.waitForTimeout(5600);
await kare('08-hat-sonu-gunluk');
console.log('günlük bant:', await s.locator('[data-testid="daily-band"]').innerText().catch(() => 'YOK'));

// 8) karakter ipucu (B1): ilk dokunuş paneli açar mı
await s.evaluate(() => window.__setState({ charPanelSeen: false }));
await s.evaluate(() => window.__setQuest('q_charTray1'));
await s.waitForTimeout(2500);
await kare('09-cayci-ipucu');
const spot = await s.locator('[data-testid="char-spotlight"]').count();
await s.locator('[data-testid="char"]').tap();
await s.waitForTimeout(400);
console.log('ipucu vardı:', spot, '· ilk dokunuşta panel:', await s.locator('[data-testid="char-panel"]').count());

console.log('konsol hataları:', hatalar.length, hatalar.slice(0, 3));
await t.close();
sunucu.kill();
process.exit(0);
