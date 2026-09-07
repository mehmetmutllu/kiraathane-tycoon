// Maketi OYUNLA AYNI KADRAJDAN üstten çeker (ölçü karşılaştırması için).
// Maket fov 34, oyun fov 50 → aynı görünen boyut için mesafe farklı hesaplanır.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1460 }, deviceScaleFactor: 2 });
page.on('console', (m) => { if (m.type() === 'error') console.log('ERR', m.text()); });
await page.goto('http://localhost:8899/maket-v13.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// son adımı seç (kat 1 komple açık)
const steps = await page.$$('#stepTabs .tab');
if (steps.length) await steps[steps.length - 1].click();
await page.waitForTimeout(2500);

// üstten: ele ≈ π/2. Mesafe CANVAS oranından hesaplanır → 34 × 34'ün tamamı kadraja girer
// (oyun tarafındaki CameraRig ile aynı formül; tek fark maketin fov'u 34, oyunun 50).
const dist = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  const aspect = c.clientWidth / c.clientHeight;
  const vt = Math.tan((34 * Math.PI) / 360);
  const d = 1.04 * Math.max(17 / vt, 17 / (vt * aspect));
  window.__bak(0, 1.5533, d, 0, 0, 0);
  return { d, w: c.clientWidth, h: c.clientHeight };
});
console.log('maket kadraj', dist);
await page.waitForTimeout(1500);
// ölçüm karesi: DOM etiketleri ve düğmeler gizlenir (yalnız geometri kalsın)
await page.evaluate(() => {
  const l = document.getElementById('labels'); if (l) l.style.display = 'none';
  document.querySelectorAll('.reset, .hint, .badge, .step-title').forEach((e) => (e.style.display = 'none'));
});
await page.waitForTimeout(400);
const canvas = await page.$('canvas');
await canvas.screenshot({ path: 'docs/gorsel/ss/olcu-plan-maket.png' });
console.log('shot olcu-plan-maket', steps.length, 'adım');
await browser.close();
