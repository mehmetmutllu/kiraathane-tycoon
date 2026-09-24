/**
 * dekor-harita.mjs — F4c-2: 💎 dekor yuvalarının salonun BUGÜNKÜ planında nereye oturduğu.
 *
 * Girdi: `tools/olcum-dekor-yuva-f4c2.ts`in yazdığı `docs/gorsel/ss/f4c2-yuvalar.json` (yuva kutuları)
 * ve `f4c2-isi-3.json` (geç oyun yürüme ısısı). Kutular iki yerde hesaplanmaz; burada yalnız çizilir.
 *
 * 1) Tam açık katın üstten plan karesi (DEV `__devPlan`). Kamera analitik: fov 50, tepede, merkeze
 *    bakar → dünya ↔ piksel eşlemesi `plan-meta` ile hesaplanır.
 * 2) Oyun kamerasından (telefon boyu) yuva gruplarının kareleri; her yuvanın 8 köşesi `__izdusur`
 *    ile ekrana düşürülür → `f4c2-kadraj.json`. Düzen DEĞİŞMEZ — sahneye hiçbir şey eklenmez.
 * Kullanım: node tools/dekor-harita.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5241);
const OUT = 'docs/gorsel/ss';
const PADS = 'table2 table3 waiter table4 waiter2 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
/** Oyuncunun durduğu nokta → o noktadan takip kamerasının gördüğü yuvalar. */
const KADRAJ = [
  { ad: 'sol-arka', x: -13.5, z: -1.5 },
  { ad: 'sag-arka', x: 13.5, z: -1.5 },
  { ad: 'wc-duvar', x: 8.2, z: -5.5 },
  { ad: 'sol-on', x: -13.5, z: 14.5 },
  { ad: 'sag-on', x: 13.5, z: 14.5 },
];
const W = 1100;
const H = 1100;
const TEL = { width: 420, height: 860 };

const { yuvalar } = JSON.parse(readFileSync(path.join(KOK, OUT, 'f4c2-yuvalar.json'), 'utf8'));
const kose = (y) => {
  const k = y.kutu;
  const p = [];
  for (const x of [k.minX, k.maxX]) for (const yy of [y.y0, y.y1]) for (const z of [k.minZ, k.maxZ]) p.push([x, yy, z]);
  return p;
};

const sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
sunucu.stdout.on('data', () => {});
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* henüz yok */ }
  await new Promise((r) => setTimeout(r, 400));
}
const tarayici = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const sayfa = await tarayici.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const hatalar = [];
sayfa.on('pageerror', (e) => hatalar.push(String(e.message)));
sayfa.on('console', (m) => m.type() === 'error' && hatalar.push(m.text()));
try {
  await sayfa.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await sayfa.waitForFunction(() => typeof window.__izdusur === 'function', null, { timeout: 30000 });
  await sayfa.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(4), questIndex: 999 }), PADS);
  await sayfa.waitForTimeout(2500);
  await sayfa.evaluate(() => { document.body.classList.add('dsb-hide-hud'); window.__zaman(0); window.__devPlan({ topDown: true, zoom: 1, gridStep: 0 }); });
  await sayfa.waitForTimeout(2500);
  await sayfa.screenshot({ path: `${OUT}/f4c2-plan.png` });
  // Kamera: Scene.tsx üstten plan dalıyla birebir (fov 50 · pay 1,04 · FLOOR_HALF 17).
  const vt = Math.tan((50 * Math.PI) / 360);
  const h = 1.04 * Math.max(17 / vt, 17 / (vt * (W / H)));
  writeFileSync(path.join(KOK, OUT, 'f4c2-plan-meta.json'), JSON.stringify({ W, H, vt, h }));

  // Oyun kadrajı: telefon boyu, zaman akar (kamera takibi dt ister), HUD gizli.
  await sayfa.evaluate(() => { window.__zaman(1); window.__devPlan({ topDown: false, gridStep: 0 }); });
  await sayfa.setViewportSize(TEL);
  const kadrajlar = [];
  for (const k of KADRAJ) {
    await sayfa.evaluate(([x, z]) => window.__teleport(x, z), [k.x, k.z]);
    await sayfa.waitForTimeout(3500);
    // Kare ile izdüşüm AYNI anda: önce dünyayı dondur, sonra ikisini de al.
    await sayfa.evaluate(() => window.__zaman(0));
    await sayfa.waitForTimeout(300);
    const izd = await sayfa.evaluate((ys) => ys.map((p) => window.__izdusur(p)), yuvalar.map(kose));
    await sayfa.screenshot({ path: `${OUT}/f4c2-kadraj-${k.ad}.png` });
    await sayfa.evaluate(() => window.__zaman(1));
    kadrajlar.push({
      ...k,
      yuva: yuvalar.map((y, i) => ({
        id: y.id,
        pts: izd[i].filter(Boolean).map(([nx, ny]) => [((nx + 1) / 2) * TEL.width, ((1 - ny) / 2) * TEL.height]),
      })),
    });
  }
  writeFileSync(path.join(KOK, OUT, 'f4c2-kadraj.json'), JSON.stringify({ tel: TEL, kadrajlar }));
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
