// shot-tepsi.mjs — S16: TAŞIMA pozunu yakın kadrajda yakalar.
//
// NEDEN: kullanıcı "elde tepsi tutma falan sorun" dedi. Tepsi bugün ele DEĞİL, gövdenin yanında
// dünya-uzayında sabit bir noktaya asılı (`KAY_TEPSI_KAYMA`); kollar bu sırada yürüme/durma
// klibini oynuyor. Kusur ancak yakın kadrajda okunur — geniş oyun karesinde tepsi leke oluyor.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';

const KOK = path.resolve('.');
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = 5403;
const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4'.split(' ');

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});

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
  p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message));
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('canvas', { timeout: 60000 });
  await p.waitForTimeout(3500);
  await p.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
  await p.waitForTimeout(1200);
  await p.evaluate(() => {
    window.__setState({ tableLevels: new Array(24).fill(2), stationLevels: [5], wallet: 99999 });
    document.body.classList.add('dsb-hide-hud');
  });
  // OYUNCUNUN ELİNE ÇAY KOY: taşıma pozu ancak tepsi doluyken çiziliyor.
  await p.evaluate(() => window.__setState({ tray: 4, trayFood: 0 }));
  for (let i = 0; i < 4; i++) { await p.evaluate(() => window.__advanceTime?.(15)); await p.waitForTimeout(500); }
  await p.evaluate(() => window.__setState({ tray: 4, trayFood: 1 }));
  await p.waitForTimeout(800);

  const durum = await p.evaluate(() => {
    const g = window.__game();
    return { tray: g.tray, trayFood: g.trayFood, waiterTrays: g.waiterTrays, npc: g.npcCount };
  });
  console.log('durum:', JSON.stringify(durum));

  // SAHNEDEN ÖLÇ: tepsi tahtası gerçekten elin hizasına oturdu mu? Kare bunu önlük plakasıyla
  // karıştırıyor; sayı karıştırmaz. R3F sahnesini canvas'in __r3f kancasından yürüyoruz.
  const olcu = await p.evaluate(() => {
    const cv = document.querySelector('canvas');
    const r3f = cv?.__r3f;
    const kok =
      r3f?.root?.getState?.().scene ??
      r3f?.store?.getState?.().scene ??
      r3f?.getState?.().scene ??
      null;
    if (!kok) return { hata: 'sahne bulunamadi', anahtarlar: r3f ? Object.keys(r3f) : 'canvas.__r3f yok' };
    const out = { handslot: null, tepsiTahta: null, onluk: null };
    const THREE_Vec = (o) => { const v = { x: 0, y: 0, z: 0 }; o.getWorldPosition(v); return { x: +v.x.toFixed(3), y: +v.y.toFixed(3), z: +v.z.toFixed(3) }; };
    kok.traverse((n) => {
      if (n.name === 'handslot.l' && !out.handslot) out.handslot = THREE_Vec(n);
      // CupTray tabanı: kahverengi kutu geometrisi, tepsi grubunun ilk mesh'i.
      if (n.isMesh && n.material?.color && !out.tepsiTahta) {
        const h = n.material.color.getHexString();
        if (h === '6d4c41' || h === '8d6e63') out.tepsiTahta = THREE_Vec(n);
      }
      if (n.isMesh && n.material?.color?.getHexString?.() === '7a2230' && !out.onluk) out.onluk = THREE_Vec(n);
    });
    return out;
  });
  console.log('OLCU:', JSON.stringify(olcu));

  // Kameranın oyuncuya yakınlaşması: dev plan kancası zoom alıyor.
  await p.evaluate(() => window.__devPlan?.({ topDown: false, zoom: 6.5 }));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/s16-tepsi-genis.png` });
  await p.screenshot({ path: `${OUT}/s16-tepsi-yakin.png`, clip: { x: 520, y: 200, width: 380, height: 420 } });
  console.log('konsol hatalari:', hatalar.length ? hatalar.slice(0, 3) : 'YOK');
  await b.close();
} finally {
  sunucu.kill();
}
