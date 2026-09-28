/**
 * kare-oyun-ici.mjs — mağaza görsellerinin HAM oyun içi kareleri (modal/panel YOK, yalnız oynanış).
 * Tasarım şablonu (`tools/magaza-tasarim.html`) bu kareleri telefon/tablet çerçevesine oturtur.
 * Cihazlar: iPhone ekranı 402×874 @3 = 1206×2622 · iPad 13" 1032×1376 @2 = 2064×2752.
 * Kullanım: node tools/kare-oyun-ici.mjs  (SADECE=iphone|ipad) → docs/magaza-kareleri/ham/<cihaz>-<an>.png
 * KIP=tam      → arayüzsüz, tuval ölçüsünde (iPhone 440×956 @3 = 1320×2868) → ham-tam/
 * KIP=panorama → arayüzsüz, 6 tuval enine tek kare (kesintisiz mağaza şeridi) → ham-pano/
 * KIP=reklam   → arayüzsüz, YAKIN kamera, bolluk anları (yerde para, tepeleme tepsi) → ham-reklam/
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5305);
const KIP = process.env.KIP ?? 'cerceve';
const OUT = path.join(KOK, 'docs/magaza-kareleri', KIP === 'tam' ? 'ham-tam' : KIP === 'panorama' ? 'ham-pano' : KIP === 'reklam' ? 'ham-reklam' : 'ham');
mkdirSync(OUT, { recursive: true });
const PADS = 'table2 table3 waiter table4 waiter2 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
const DEKOR = ['radyo', 'koltuk', 'lamba', 'tablo', 'semaver', 'gramofon', 'kanarya', 'saat'];
const CIHAZLAR = [
  { ad: 'iphone', viewport: { width: 402, height: 874 }, dpr: 3, mobil: true, guvenli: [62, 34] },
  { ad: 'ipad', viewport: { width: 1032, height: 1376 }, dpr: 2, mobil: false, guvenli: [24, 20] },
].filter((c) => !process.env.SADECE || c.ad.startsWith(process.env.SADECE));
// Tam/panorama: çerçeve yok → görüntü tuvalin kendisi. iPhone tuvali 440×956 (@3 = 1320×2868).
if (KIP !== 'cerceve') for (const c of CIHAZLAR) {
  if (KIP === 'reklam' && c.ad === 'ipad') c.viewport = { width: 1032, height: 1376 };
  if (c.ad === 'iphone') c.viewport = { width: 440, height: 956 };
  if (KIP === 'panorama') c.viewport = { width: c.viewport.width * 6, height: c.viewport.height };
}

const sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--config', 'tools/vite-kare.config.mjs', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: KOK, stdio: 'ignore' });
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* henüz yok */ }
  await new Promise((r) => setTimeout(r, 400));
}
const tarayici = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const hatalar = [];
try {
  for (const c of CIHAZLAR) {
    const baglam = await tarayici.newContext({ viewport: c.viewport, deviceScaleFactor: c.dpr, hasTouch: true, isMobile: c.mobil });
    const s = await baglam.newPage();
    s.on('pageerror', (e) => hatalar.push(`${c.ad}: ${e.message}`));
    const kare = async (ad, bekle = 1500) => {
      await s.waitForTimeout(bekle);
      await s.screenshot({ path: `${OUT}/${c.ad}-${ad}.png` });
      console.log(c.ad, ad);
    };
    const sar = async (sn, adim = 2) => {
      for (let t = 0; t < sn; t += adim) { await s.evaluate((a) => window.__advanceTime(a), adim); await s.waitForTimeout(120); }
    };
    const temizle = () => s.evaluate(() => window.__setState({ levelUp: null, offlineEarned: 0 }));
    const git = async (x, z, sn = 4) => { await s.evaluate(([a, b]) => window.__teleport(a, b), [x, z]); await sar(sn); await temizle(); };

    await s.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    // Geliştirici düğmesi + alttaki görev kartı mağaza karesinde gürültü: gizlenir (oynanış kalır).
    // Geliştirici düğmesi gizlenir. Güvenli alan cihazınki gibi verilir: çerçevedeki saat/ada
    // arayüzün üstüne binmesin (tarayıcıda env(safe-area-inset-*) 0 döner).
    await s.addStyleTag({ content: `.dsb-fab{display:none!important} :root{--sat:${c.guvenli[0]}px!important;--sab:${c.guvenli[1]}px!important}` });
    // Tam/panorama: arayüz ve joystick gizli — sahne tek başına (başlık tasarımda eklenir).
    const arayuzGizle = () => KIP !== 'cerceve' && s.addStyleTag({ content: '.hud,.joy,.joystick,[class*="joy"]{display:none!important}' });
    await s.waitForSelector('[data-testid="kafe-adi"]', { timeout: 60000 });
    await s.fill('[data-testid="kafe-adi-girdi"]', 'Köşe Kıraathanesi');
    await s.click('[data-testid="kafe-adi-tamam"]');
    await s.waitForTimeout(1500);
    await arayuzGizle();

    if (KIP === 'reklam') {
      // Piyasa kalıbı (Burger Please · Pizza Ready · My Perfect Hotel): kamera yakın, an BOLLUK anı.
      await s.evaluate(([pads, dekor]) => window.__setState({
        padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(3), diamonds: 320, wallet: 48250, xp: 60000, questIndex: 999,
        ownedCosmetics: dekor.map((d) => `decor:${d}`), dekor: Object.fromEntries(dekor.map((d) => [d, d])),
        charUpgrades: { tray: 9, magnet: 3, speed: 3 },
      }), [PADS, DEKOR]);
      await s.waitForTimeout(2000);
      await sar(60);
      await temizle();
      await s.evaluate(() => window.__devCam({ distMul: 0.62 }));
      const paraYagmuru = (x, z, n) => s.evaluate(([x0, z0, k]) => {
        const coins = [];
        for (let i = 0; i < k; i++) { const a = i * 2.39996, r = 0.25 + Math.sqrt(i) * 0.19; coins.push({ id: 900000 + i, pos: [x0 + Math.cos(a) * r, 0.05 + Math.max(0, 1.7 - r) * 0.42, z0 + Math.sin(a) * r], value: 25, age: 0 }); }
        window.__setState({ coins });
      }, [x, z, n]);
      const cek = async (ad, x, z, ek) => { await git(x, z, 3); if (ek) await ek(); await s.evaluate(() => window.__zaman(0)); await kare(ad, 1800); await s.evaluate(() => window.__zaman(1)); };
      await cek('para', -3, 8.6, () => paraYagmuru(-2.2, 8.0, 150));
      await cek('tepsi', -8.5, 4.5, () => s.evaluate(() => window.__setState({ coins: [], tray: 12 })));
      await cek('salon', -1.6, 6.2, () => s.evaluate(() => window.__setState({ tray: 6 })));
      await cek('garson', -8.5, 7.5, () => s.evaluate(() => window.__setState({ tray: 0 })));
      await cek('mutfak', -13.0, -8.6);
      await cek('yeni-salon', 3.5, -2.5);
      await s.evaluate(() => window.__devCam({ distMul: 0 }));
      await baglam.close();
      continue;
    }

    if (KIP === 'panorama') {
      await s.evaluate(([pads, dekor]) => window.__setState({
        padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(3), diamonds: 320, wallet: 48250, xp: 60000, questIndex: 999,
        ownedCosmetics: dekor.map((d) => `decor:${d}`), dekor: Object.fromEntries(dekor.map((d) => [d, d])),
      }), [PADS, DEKOR]);
      await s.waitForTimeout(2000);
      await sar(60);
      await temizle();
      for (const [ad, x, z] of [['orta', -3, 4], ['salon', -3, 8], ['arka', -3, 0]]) { await git(x, z); await kare(ad, 3000); }
      await baglam.close();
      continue;
    }

    // İLK SERVİS — erken oyun, elde çay.
    await s.evaluate(() => window.__setState({ padsDone: ['table2', 'table3'], padFills: {}, xp: 400, wallet: 180 }));
    await sar(30);
    await temizle();
    await git(-12.2, 9.4);
    await s.evaluate(() => window.__setState({ tray: 2 }));
    await kare('ilk-servis', 2500);

    // GEÇ OYUN — üç salon, masalar yükseltilmiş, dekor yerinde.
    await s.evaluate(([pads, dekor]) => window.__setState({
      padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(3), diamonds: 320, wallet: 48250, xp: 60000, questIndex: 999,
      ownedCosmetics: dekor.map((d) => `decor:${d}`), dekor: Object.fromEntries(dekor.map((d) => [d, d])),
    }), [PADS, DEKOR]);
    await s.waitForTimeout(2000);
    await sar(60);
    await temizle();
    await git(-3, 8.6);
    await kare('dolu-salon', 3000);
    await git(-1.6, 6.2);
    await kare('salon-2', 2500);
    await git(0, 1.2);
    await kare('salon-3', 2500);
    await git(3.5, -2.5);
    await kare('salon-3b', 2500);
    await s.evaluate(() => window.__setState({ tray: 3 }));
    await git(-8.5, 4.5);
    await kare('garson-servis', 2500);
    await git(-13.0, -8.6, 6);
    await kare('mutfak', 3000);

    // GENİŞ BAKIŞ — kamera uzak kipte, dolu salon.
    await git(-3, 6.5);
    await s.click('[data-testid="cam-zoom"]').catch(() => {});
    await sar(4);
    await kare('genis', 3000);
    await baglam.close();
  }
} catch (e) {
  console.error('HATA', e.message);
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
