import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const out = 'docs/magaza-kareleri/yukleme'; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
for (const [c, vp, dpr] of [['iphone', { width: 402, height: 874 }, 3], ['ipad', { width: 1032, height: 1376 }, 2]]) {
  const s = await b.newPage({ viewport: vp, deviceScaleFactor: dpr });
  for (const v of [1, 2, 3, 4]) {
    await s.goto(pathToFileURL(path.resolve('tools/yukleme-onizleme.html')).href + '?v=' + v);
    await s.evaluate(() => document.fonts.ready); await s.waitForTimeout(400);
    await s.screenshot({ path: `${out}/${c}-${v}.png` });
  }
}
await b.close(); console.log('tamam');
