// Karakter/mobilya oranı ölçüm karesi: oyuncuyu bir masanın yanına ışınla, yakın kadraj al.
// Ayrıca üç aktörün (sahip · garson · müşteri) dünya-uzayı Y sınırlarını three sahnesinden ÖLÇER.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = process.argv[2] || 'docs/gorsel/ss';
const TAG = process.argv[3] || 'oran-once';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.evaluate(() => {
  window.__setState({ padsDone: 'table2 table3 waiter table4'.split(' '), padFills: {} });
});
await page.waitForTimeout(1500);
await page.evaluate(() => { document.body.classList.add('dsb-hide-hud'); window.__teleport(-11.7, 9.9); });
await page.waitForTimeout(3500);
await page.screenshot({ path: `${OUT}/${TAG}-masa.png` });
// yakın kadraj (kamera mesafesini kıs)
await page.evaluate(() => window.__devCam({ distMul: 0.45 }));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/${TAG}-yakin.png` });

// --- ÖLÇÜM: sahnedeki mesh'lerin dünya Y sınırları ---
const m = await page.evaluate(() => {
  const { scene } = window.__three;
  const THREE = window.__THREE_SHIM || null;
  const out = {};
  const box = (obj) => {
    let min = Infinity, max = -Infinity;
    obj.updateWorldMatrix(true, true);
    obj.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      // 8 köşeyi dünyaya taşı
      for (const xi of [bb.min.x, bb.max.x]) for (const yi of [bb.min.y, bb.max.y]) for (const zi of [bb.min.z, bb.max.z]) {
        const v = new o.geometry.boundingBox.min.constructor(xi, yi, zi);
        v.applyMatrix4(o.matrixWorld);
        if (v.y < min) min = v.y;
        if (v.y > max) max = v.y;
      }
    });
    return [min, max];
  };
  scene.traverse((o) => {
    if (o.isInstancedMesh && o.count > 0 && o.geometry) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      out['instanced_' + (o.geometry.type || '?') + '_' + o.count] = { geoY: [bb.min.y, bb.max.y] };
    }
  });
  return out;
});
console.log('INSTANCED', JSON.stringify(m, null, 1));
console.log('ERRS', errs.length, errs.slice(0, 5));
await browser.close();
