// node fark.mjs <a-etiket> <b-etiket> [diff-png-etiketi]  → her görüntü çifti için farklı piksel oranı
import { chromium } from 'file:///C:/xampp/htdocs/kiraathane/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const DIR = 'C:/xampp/htdocs/kiraathane/docs/sprintler/sprint-A/perf/';
const [, , A, B, KAYDET] = process.argv;
const b = await chromium.launch(); const p = await b.newPage();
const out = {};
for (const ad of ['sahne', 'sahne2', 'onizleme-zemin', 'onizleme-duvar', 'onizleme-dekor', 'onizleme-masa']) {
  const fa = `${DIR}${ad}-${A}.png`, fb = `${DIR}${ad}-${B}.png`;
  if (!fs.existsSync(fa) || !fs.existsSync(fb)) continue;
  const r = await p.evaluate(async ([a, b, kaydet]) => {
    const yukle = (s) => new Promise((c) => { const i = new Image(); i.onload = () => c(i); i.src = s; });
    const [ia, ib] = await Promise.all([yukle(a), yukle(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { boyut: 'farkli' };
    const ciz = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height); };
    const da = ciz(ia).data, db = ciz(ib).data;
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height; const x = c.getContext('2d'); const od = x.createImageData(ia.width, ia.height);
    let farkli = 0, enCok = 0; const n = da.length / 4;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (d > enCok) enCok = d;
      if (d > 8) { farkli++; od.data[i] = 255; od.data[i + 3] = 255; } else { const g = (da[i] + da[i+1] + da[i+2]) / 6; od.data[i] = od.data[i+1] = od.data[i+2] = g; od.data[i + 3] = 255; }
    }
    x.putImageData(od, 0, 0);
    return { farkliOran: +(farkli / n * 100).toFixed(3), farkli, enCok, png: kaydet ? c.toDataURL('image/png') : null };
  }, ['data:image/png;base64,' + fs.readFileSync(fa).toString('base64'), 'data:image/png;base64,' + fs.readFileSync(fb).toString('base64'), !!KAYDET]);
  if (r.png) { fs.writeFileSync(`${DIR}fark-${ad}-${KAYDET}.png`, Buffer.from(r.png.split(',')[1], 'base64')); }
  delete r.png; out[ad] = r;
}
console.log(JSON.stringify(out));
await b.close();
