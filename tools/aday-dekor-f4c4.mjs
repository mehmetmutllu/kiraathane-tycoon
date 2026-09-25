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
   * OTOMATİK KADRAJ (kullanıcı 2026-09-25: "bazıları belli olmuyor ve ortalı değil"). Aynı sahne, AYRI kamera,
   * önizleme kutusunun en-boyunda (720 × 660). Eşyanın ÇİZİLEN gövdesi ölçülür (yuva kutusunun içinde merkezi
   * kalan mesh'lerin dünya kutusu) → kamera o kutunun MERKEZİNE bakar ve mesafe, kutunun ekranda dikeyin `pay`
   * kadarını kaplayacağı yerden seçilir. Yön: 'oyun' = oyunun kamerası (güneyden 45°) · 'capraz' = duvara 3/4
   * (duvardan içeri + duvar boyunca kameraya doğru + yukarı). Oyunun kamerasına dokunmaz (`gl.render` + `toDataURL`).
   */
  const kare = async (yuva, yon, pay, dosya) => {
    const r = await sayfa.evaluate(async ([yuva, yon, pay]) => {
      const u = performance.getEntriesByType('resource').map((x) => x.name).find((n) => /\/deps\/three\.js/.test(n));
      const THREE = await import(u);
      const m = await import('/src/config/decor.ts');
      const y = m.vitrinYuva(yuva);
      const k = m.yuvaKutu(y);
      const { gl, scene } = window.__three;
      scene.updateMatrixWorld(true);
      const kutu = new THREE.Box3();
      const t = new THREE.Box3();
      const c = new THREE.Vector3();
      scene.traverse((o) => {
        if (!o.isMesh || o.isSkinnedMesh || !o.visible) return;
        t.setFromObject(o);
        t.getCenter(c);
        if (c.x < k.minX - 0.15 || c.x > k.maxX + 0.15 || c.z < k.minZ - 0.15 || c.z > k.maxZ + 0.15) return;
        if (c.y < y.y0 - 0.05 || c.y > y.y1 + 0.1 || t.max.y - t.min.y > 4) return;
        kutu.union(t);
      });
      if (kutu.isEmpty()) return { bos: true };
      const merkez = kutu.getCenter(new THREE.Vector3());
      const boy = kutu.getSize(new THREE.Vector3());
      const pos = m.yuvaAnkraj(y).pos;
      const ic = pos[2] < -9 ? [0, 1] : pos[0] < 0 ? [1, 0] : [-1, 0];
      let d;
      if (yon === 'oyun') d = new THREE.Vector3(0, 1, 1);
      else if (ic[1]) d = new THREE.Vector3(0.45, 0.75, 1); // karşı duvar: hafif yandan
      else d = new THREE.Vector3(ic[0] * 0.8, 0.85, 0.9); // yan duvar: içeriden, güneyden
      d.normalize();
      const fov = 34;
      // Eşyanın kameraya dik düzlemdeki kaba boyu: en büyük kenar (yassı tablo/saat de okunur kalsın).
      const olcu = Math.max(boy.y, Math.max(boy.x, boy.z) * 0.8, 0.45);
      const uzak = olcu / pay / (2 * Math.tan((fov * Math.PI) / 360));
      const eski = gl.getSize(new THREE.Vector2());
      const eskiPr = gl.getPixelRatio();
      gl.setPixelRatio(1);
      gl.setSize(720, 660, false);
      const cam = new THREE.PerspectiveCamera(fov, 720 / 660, 0.1, 200);
      cam.position.copy(merkez).addScaledVector(d, uzak);
      cam.lookAt(merkez);
      cam.updateProjectionMatrix();
      gl.render(scene, cam);
      const url = gl.domElement.toDataURL('image/png');
      gl.setPixelRatio(eskiPr);
      gl.setSize(eski.x, eski.y, false);
      return { url, boy: boy.toArray().map((v) => +v.toFixed(2)), uzak: +uzak.toFixed(2) };
    }, [yuva, yon, pay]);
    if (r.bos) { console.log('  gövde bulunamadı', yuva); return; }
    writeFileSync(`${OUT}/${dosya}`, Buffer.from(r.url.split(',')[1], 'base64'));
    return r;
  };
  const ESYALAR = { radyo: 'radyo', koltuk: 'koltuk', lamba: 'lamba', tablo: 'tablo', semaver: 'semaver', gramofon: 'gramofon', kanarya: 'kanarya', saat: 'saat', 'yilbasi-kirmizi': 'yilbasi' };
  const KOLLAR = [['oyun', 'oyun', 0.3], ['capraz', 'capraz', 0.3], ['capraz-orta', 'capraz', 0.38], ['capraz-yakin', 'capraz', 0.45]];
  for (const [esya, yuva] of Object.entries(ESYALAR)) {
    await sayfa.evaluate(([esya, yuva]) => window.__setState({ ownedCosmetics: [`decor:${esya}`], dekor: { [yuva]: esya } }), [esya, yuva]);
    await sayfa.waitForTimeout(1500);
    const satir = [];
    for (const [ad, yon, pay] of KOLLAR) {
      const r = await kare(yuva, yon, pay, `f4c4-oto-${esya}-${ad}.png`);
      if (r) satir.push(`${ad} uzak ${r.uzak}`);
    }
    console.log('eşya', esya, satir.join(' · '));
  }
} catch (e) {
  console.error('HATA', e.message);
  await sayfa.screenshot({ path: `${OUT}/f4c4-hata.png` });
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
