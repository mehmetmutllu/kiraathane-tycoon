// olcum-panel-donusu.mjs — "karakter ekranina girip cikinca T-poz ve basibos tepsiler" (S18).
//
// NEDEN AYRI ARAC: `tools/olcum-kol.mjs` T-pozu OLCUYOR ama yalniz ACILIS yolunda. Kullanicinin
// 2026-09-14'te bildirdigi kusur baska bir yolda doguyor: *"karakter ekranina girdim sonra ciktim
// orada tekrar t pozisyonuna girdi karakter hatta garsonlar falan da ve etrafta tepsiler geziyo"*.
// Yani tetikleyici ACILIS degil, PANELE GIRIP CIKMAK. Ayni olcu, farkli senaryo.
//
// UC SEY OLCULUR, ucu de PANELDEN ONCE ve SONRA:
//   1) DONUK KOL  — gogus-yerel el konumu iki ornek arasinda kipirdiyor mu (T-poz makine olcusu)
//   2) TEPSI BAGI — tasinan tepsi, tasiyanin ellerinin ORTASINDAN ne kadar uzakta? Tepsi ele
//      bagli (S16 · D-114); bag koparsa tepsi sahnede baska bir yerde "gezer".
//   3) BAGLAM/HATA — ikinci `<Canvas>` (panelin kendi WebGL baglami) ana baglami dusuruyor mu,
//      konsola ne yaziliyor.
//
// Calistir: node tools/olcum-panel-donusu.mjs
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const KOK = path.resolve('.');
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = 5414;
const PADS = 'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4'.split(' ');

mkdirSync(OUT, { recursive: true });

const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});

const bekle = async () => {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true; } catch { /* bekle */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message.slice(0, 120)));
  p.on('console', (m) => { if (m.type() === 'error') hatalar.push('CONSOLE ' + m.text().slice(0, 120)); });

  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForSelector('canvas', { timeout: 60000 });
  await p.waitForTimeout(3500);
  await p.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), PADS);
  await p.waitForTimeout(1000);
  await p.evaluate(() => {
    window.__setState({ tableLevels: new Array(24).fill(2), stationLevels: [5], wallet: 99999, tray: 4, trayFood: 1 });
    document.body.classList.add('dsb-hide-hud');
  });
  for (let i = 0; i < 5; i++) { await p.evaluate(() => window.__advanceTime?.(20)); await p.waitForTimeout(350); }
  await p.waitForTimeout(1200);

  /** Gogus-yerel el konumu + tepsi baginin olcusu. */
  const orneklem = async () => p.evaluate(() => {
    const kok = window.__three?.scene ?? null;
    if (!kok) return { hata: 'sahne yok (window.__three)' };
    const P = (o) => { o.updateWorldMatrix(true, false); return o.position.clone().setFromMatrixPosition(o.matrixWorld); };
    const govdeler = [];
    kok.traverse((n) => {
      if (!n.isBone || n.name !== 'chest') return;
      let ata = n;
      while (ata.parent && ata.parent !== kok) ata = ata.parent;
      const bul = (ad) => { let r = null; ata.traverse((m) => { if (!r && m.isBone && m.name === ad) r = m; }); return r; };
      const sol = bul('handl'), sag = bul('handr');
      const hsL = bul('handslotl'), hsR = bul('handslotr');
      if (!sol || !sag) return;
      const ys = n.worldToLocal(P(sol)), yg = n.worldToLocal(P(sag));
      const elOrta = hsL && hsR ? P(hsL).add(P(hsR)).multiplyScalar(0.5) : null;
      govdeler.push({
        solX: +ys.x.toFixed(3), solY: +ys.y.toFixed(3), solZ: +ys.z.toFixed(3),
        sagX: +yg.x.toFixed(3), sagY: +yg.y.toFixed(3), sagZ: +yg.z.toFixed(3),
        elOrta: elOrta ? { x: elOrta.x, y: elOrta.y, z: elOrta.z } : null,
      });
    });

    // TEPSILER: CupTray/WaiterTray tahtasi kahverengi kutu (6d4c41 / 8d6e63). Dunya konumlari.
    const tepsiler = [];
    kok.traverse((m) => {
      if (!m.isMesh || !m.material?.color?.getHexString) return;
      const h = m.material.color.getHexString();
      if (h !== '6d4c41' && h !== '8d6e63') return;
      if (!m.visible) return;
      // Gorunurluk zincirini de denetle: ata gizliyse tepsi ekranda yok demektir.
      let gorunur = true, a = m;
      while (a) { if (!a.visible) { gorunur = false; break; } a = a.parent; }
      const v = P(m);
      tepsiler.push({ x: +v.x.toFixed(3), y: +v.y.toFixed(3), z: +v.z.toFixed(3), gorunur });
    });
    return { govdeler, tepsiler };
  });

  const olc = async (etiket) => {
    const a = await orneklem();
    await p.waitForTimeout(300);
    const b2 = await orneklem();
    if (a.hata) { console.log(etiket + ': ' + a.hata); return null; }
    const d = (u, v, k) => Math.abs(u[k] - v[k]);
    let donuk = 0;
    for (let i = 0; i < a.govdeler.length; i++) {
      const x = a.govdeler[i], y = (b2.govdeler ?? [])[i] ?? x;
      const oyn = Math.max(
        d(x, y, 'solX') + d(x, y, 'solY') + d(x, y, 'solZ'),
        d(x, y, 'sagX') + d(x, y, 'sagY') + d(x, y, 'sagZ'));
      if (oyn < 0.002) donuk++;
    }
    // TEPSI BAGI: her gorunur tepsi, EN YAKIN el ortasindan ne kadar uzakta?
    const eller = a.govdeler.map((g) => g.elOrta).filter(Boolean);
    const gorunurTepsi = a.tepsiler.filter((t) => t.gorunur);
    const uzakliklar = gorunurTepsi.map((t) => {
      let en = Infinity;
      for (const e of eller) {
        const dd = Math.hypot(t.x - e.x, t.y - e.y, t.z - e.z);
        if (dd < en) en = dd;
      }
      return en;
    });
    const kopuk = uzakliklar.filter((u) => u > 0.5).length;
    console.log(
      etiket.padEnd(22) +
      ' govde ' + String(a.govdeler.length).padStart(3) +
      ' · DONUK KOL ' + donuk + '/' + a.govdeler.length +
      ' · gorunur tepsi ' + gorunurTepsi.length +
      ' · ele UZAK tepsi (>0,5 br) ' + kopuk +
      ' · en uzak ' + (uzakliklar.length ? Math.max(...uzakliklar).toFixed(2) : '—'));
    return { govde: a.govdeler.length, donuk, tepsi: gorunurTepsi.length, kopuk, uzakliklar };
  };

  const once = await olc('PANELDEN ONCE');
  await p.screenshot({ path: `${OUT}/s18-panel-once.png` });

  // PANELI AC: alt gezinmedeki "Karakter" sekmesi. HUD gizliyse once geri getir.
  await p.evaluate(() => document.body.classList.remove('dsb-hide-hud'));
  await p.waitForTimeout(400);
  const acildi = await p.evaluate(() => {
    const dugmeler = [...document.querySelectorAll('button, [role="button"]')];
    const d = dugmeler.find((x) => /karakter/i.test(x.textContent || ''));
    if (!d) return false;
    d.click();
    return true;
  });
  console.log('panel acildi:', acildi);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/s18-panel-acik.png` });
  const baglamPanel = await p.evaluate(() => document.querySelectorAll('canvas').length);
  console.log('acikken canvas sayisi:', baglamPanel);

  // PANELI KAPAT.
  await p.evaluate(() => {
    const dugmeler = [...document.querySelectorAll('button, [role="button"]')];
    const kapat = dugmeler.find((x) => /^(kapat|✕|×|geri)$/i.test((x.textContent || '').trim()))
      ?? dugmeler.find((x) => /kapat/i.test(x.getAttribute('aria-label') || ''));
    if (kapat) kapat.click();
    else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.body.classList.add('dsb-hide-hud'));
  await p.waitForTimeout(600);

  const sonra = await olc('PANELDEN SONRA');
  await p.screenshot({ path: `${OUT}/s18-panel-sonra.png` });

  console.log('\nkonsol/sayfa hatalari:', hatalar.length ? hatalar.slice(0, 6) : 'yok');
  writeFileSync(`${KOK}/docs/olcum-panel-donusu.json`, JSON.stringify({ once, sonra, hatalar }, null, 2));
  await b.close();
} finally {
  sunucu.kill();
}
