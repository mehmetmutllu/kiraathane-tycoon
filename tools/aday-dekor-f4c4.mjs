/**
 * aday-dekor-f4c4.mjs — F4c-4 aday kareleri: 💎 dekor salondaki YERİNDE, oyun kamerasından.
 * Kamera görev odağıyla (`camFocus`) yuvaya kayar; `__devCam` mesafe çarpanı yakın/oyun/uzak kademesini verir.
 * Oyun kodu değişmez (yalnız dev kancaları). Sunucuyu kendi kaldırır. Kullanım: node tools/aday-dekor-f4c4.mjs
 * Çıktı: docs/gorsel/ss/f4c4-dekor-<eşya>-<kademe>.png (HUD gizli) + f4c4-dekor-<eşya>-bos-oyun.png (eşya yokken)
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5252);
const OUT = 'docs/gorsel/ss';
const PADS = 'table2 table3 waiter table4 waiter2 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
// eşya id → yuva id
const ESYA = { semaver: 'semaver', koltuk: 'koltuk', saat: 'saat', 'yilbasi-kirmizi': 'yilbasi', tablo: 'tablo' };
// Odak mesafesi 0,72 × oyun; çarpan 1 → yakın · 1,39 → oyun mesafesi · 1,85 → uzak.
const KADEME = { yakin: 1, oyun: 1.39, uzak: 1.85 };

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
try {
  await sayfa.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await sayfa.waitForFunction(() => typeof window.__setState === 'function' && typeof window.__devCam === 'function', null, { timeout: 60000 });
  await sayfa.evaluate((pads) => window.__setState({ kafeAdi: 'Mutlu Kahvesi', questIndex: 999, padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(4) }), PADS);
  await sayfa.waitForTimeout(2500);
  await sayfa.evaluate(() => document.body.classList.add('dsb-hide-hud'));
  // Oyuncu kadraj dışına (kapı önü) — odak hareket olmadıkça sürer.
  await sayfa.evaluate(() => window.__teleport(0, 15.5));
  await sayfa.waitForTimeout(1500);
  // İçeri yön: sol duvar → +x · sağ → −x · lavabo duvarı → +z.
  const iceri = (pos) => (pos[2] < -9 ? [0, 1] : pos[0] < 0 ? [1, 0] : [-1, 0]);
  /**
   * Aynı sahne, AYRI kamera, önizleme kutusunun en-boyunda (720 × 660 px). Oyunun kamerasına dokunmaz:
   * tuval geçici boyutlanır, `gl.render(scene, cam)` + aynı görevde `toDataURL`, sonra eski boyut.
   *  - aci 'oyun'  : oyunun baktığı yön (güneyden, 45° yukarıdan); odak eşyanın 2 br içerisi.
   *  - aci 'vitrin': salonun içinden duvara 3/4 (duvar boyunca güneyden, yukarıdan ~35°; oda karenin yarısı).
   */
  const kare = async (pos, y1, aci, r, dosya) => {
    const url = await sayfa.evaluate(async ([pos, y1, ic, aci, r]) => {
      const u = performance.getEntriesByType('resource').map((x) => x.name).find((n) => /\/deps\/three\.js/.test(n));
      const THREE = await import(u);
      const { gl, scene } = window.__three;
      const eski = gl.getSize(new THREE.Vector2());
      const eskiPr = gl.getPixelRatio();
      gl.setPixelRatio(1);
      gl.setSize(720, 660, false);
      const cam = new THREE.PerspectiveCamera(34, 720 / 660, 0.1, 200);
      const hy = pos[1] + Math.max(0.5, y1 * 0.5);
      const hedef = new THREE.Vector3(pos[0] + ic[0] * (aci === 'oyun' ? 2 : 1.6), hy * (aci === 'oyun' ? 0.4 : 0.8), pos[2] + ic[1] * (aci === 'oyun' ? 2 : 1.6));
      if (aci === 'oyun') cam.position.set(hedef.x, hedef.y + r * 0.72, hedef.z + r * 0.72);
      else {
        // duvara dik (ic) + duvar boyunca kameraya doğru (güney) bileşen
        const boy = ic[1] ? [1, 0] : [0, 1];
        cam.position.set(hedef.x + (ic[0] * 0.5 + boy[0] * 0.75) * r, hedef.y + r * 0.62, hedef.z + (ic[1] * 0.5 + boy[1] * 0.75) * r);
      }
      cam.lookAt(hedef);
      cam.updateProjectionMatrix();
      gl.render(scene, cam);
      const url = gl.domElement.toDataURL('image/png');
      gl.setPixelRatio(eskiPr);
      gl.setSize(eski.x, eski.y, false);
      return url;
    }, [pos, y1, iceri(pos), aci, r]);
    writeFileSync(`${OUT}/${dosya}`, Buffer.from(url.split(',')[1], 'base64'));
  };
  const ACILAR = [['oyun-yakin', 'oyun', 8], ['oyun-uzak', 'oyun', 12], ['vitrin-yakin', 'vitrin', 5.5], ['vitrin-uzak', 'vitrin', 8.5]];
  for (const [esya, yuva] of Object.entries(ESYA)) {
    const { pos, y1 } = await sayfa.evaluate(async (yuva) => {
      const m = await import('/src/config/decor.ts');
      const y = m.vitrinYuva(yuva);
      return { pos: m.yuvaAnkraj(y).pos, y1: y.y1 - y.y0 };
    }, yuva);
    await sayfa.evaluate(() => window.__setState({ ownedCosmetics: [], dekor: {} }));
    await sayfa.waitForTimeout(900);
    await kare(pos, y1, 'vitrin', 8.5, `f4c4-dekor-${esya}-bos.png`);
    await sayfa.evaluate(([esya, yuva]) => window.__setState({ ownedCosmetics: [`decor:${esya}`], dekor: { [yuva]: esya } }), [esya, yuva]);
    await sayfa.waitForTimeout(1500);
    for (const [ad, aci, r] of ACILAR) await kare(pos, y1, aci, r, `f4c4-dekor-${esya}-${ad}.png`);
    console.log('eşya', esya, pos.map((v) => v.toFixed(2)).join(','));
  }
} catch (e) {
  console.error('HATA', e.message);
  await sayfa.screenshot({ path: `${OUT}/f4c4-hata.png` });
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
