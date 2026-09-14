// shot-s19b.mjs — S19b görsel doğrulaması: oyunu aç, mekânı büyüt, müşteriler otursun,
// sonra kare al. Bu turda okunması gereken üç şey var ve üçü de ancak YAKINDA görünür:
//   (1) oturuş çapası — kalça taburenin oturağında mı, arkadan sarkıyor mu
//   (2) sipariş balonunun İÇİ — artık çizim değil, pişirilmiş model (tost · ince belli bardak)
//   (3) personelin saran önlüğü ile patronun havlu + sıvalı kolu
// `shot-s15.mjs`ten kopyalandı; kadraj ve çıktı adları bu tura göre.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';

const KOK = 'C:/xampp/htdocs/kiraathane';
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = 5411;
const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo'.split(' ');

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));

const bekle = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true; } catch { /* bekle */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  const hatalar = [];
  p.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
  p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('canvas', { timeout: 60000 });
  await p.waitForTimeout(3500);
  await p.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    window.__setState({ tableLevels: new Array(24).fill(3), stationLevels: [5], wallet: 99999 });
    document.body.classList.add('dsb-hide-hud');
  });
  // Müşteriler gelsin ve otursun.
  for (let i = 0; i < 8; i++) { await p.evaluate(() => window.__advanceTime?.(20)); await p.waitForTimeout(600); }
  await p.waitForTimeout(1500);

  const durum = await p.evaluate(() => {
    const g = window.__game();           // __game bir FONKSIYON
    return { npcCount: g.npcCount, tables: g.tables, stations: g.stations };
  });
  console.log('durum:', JSON.stringify(durum));

  await p.screenshot({ path: `${OUT}/s19b-oyun-genis.png` });
  // OTURUŞ ÇAPASI yakın kırpma ile denetlenir: kalça taburenin oturağında mı, havada mı?
  await p.screenshot({ path: `${OUT}/s19b-oturus-yakin.png`, clip: { x: 300, y: 180, width: 520, height: 420 } });

  // YAKIN kadraj: dev kamera kancası varsa kullan, yoksa geniş kare yeter.
  const yakin = await p.evaluate(() => {
    if (!window.__devPlan) return false;
    window.__devPlan({ topDown: false, zoom: 2.6 });
    return true;
  });
  if (yakin) {
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/s19b-oyun-yakin.png` });
  }
  console.log('yakin kadraj:', yakin, '· konsol hatalari:', hatalar.length ? hatalar.slice(0, 5) : 'YOK');
  await b.close();
} finally {
  sunucu.kill();
}
