/**
 * shot-s23-panel.mjs — KARAKTER PANELİNİN KARESİ (S23 kadraj ayarı).
 *
 * NEDEN AYRI ARAÇ: `olcum-arayuz-s23.mjs` on satır + üç sekme + beş işaret ölçüyor ve iki
 * dakika sürüyor. Vitrinin kadrajı (kamera uzaklığı ve bakış yüksekliği) GÖZLE ayarlanan bir
 * şey — her denemede tam ölçüm koşmak turu ölçüm değil bekleme yapar. Bu araç yalnız üç sekmenin
 * karesini alır.
 *
 * Kullanım: node tools/shot-s23-panel.mjs [onek]
 *   onek varsayılan `s23b` → docs/gorsel/ss/s23b-{player,waiter,dish}.png
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SS = path.join(KOK, 'docs', 'gorsel', 'ss');
mkdirSync(SS, { recursive: true });
const ONEK = process.argv[2] ?? 's23b';
const PORT = Number.parseInt(process.env.UI_PORT ?? '', 10) || 5236;

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
const hatalar = [];
sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text().slice(0, 160)); });
await sayfa.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
await sayfa.waitForSelector('canvas', { timeout: 20000 });
await sayfa.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
await sayfa.evaluate(() => window.__addMoney(5_000_000));
// Garson/bulaşıkçı sekmeleri ancak personel tutulunca çiziliyor (turu-5 m.7).
await sayfa.evaluate(() => {
  const pads = new Set(window.__game().padsDone ?? []);
  pads.add('waiter');
  pads.add('dishwasher');
  window.__setState({ padsDone: [...pads] });
});
await sayfa.waitForTimeout(900);
await sayfa.click('[data-testid="char"]');
await sayfa.waitForSelector('[data-testid="char-panel"]', { timeout: 10000 });

for (const sekme of ['player', 'waiter', 'dish']) {
  const sec = `[data-testid="char-tab-${sekme}"]`;
  if (await sayfa.locator(sec).count()) await sayfa.click(sec);
  // Gövde GLB'si + klip dosyası yüklensin, idle klibi bir tur dönsün.
  await sayfa.waitForTimeout(2200);
  await sayfa.screenshot({ path: path.join(SS, `${ONEK}-${sekme}.png`) });
}

await tarayici.close();
sunucu.kill();
console.log(`kare: ss/${ONEK}-{player,waiter,dish}.png · konsol hatasi: ${hatalar.length}`);
for (const h of hatalar.slice(0, 3)) console.log('  ! ' + h);
process.exit(0);
