/**
 * dekor-harita-sayfa.mjs — F4c-2 inceleme sayfası: plan + yürüme ısısı + yuvalar + oyun kadrajları.
 * Girdi: `dekor-harita.mjs` ve `olcum-dekor-yuva-f4c2.ts` çıktıları (docs/gorsel/ss/f4c2-*).
 * Çıktı: argv[2] (varsayılan docs/gorsel/f4c2-dekor-harita.html) — görseller gömülü, tek dosya.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SS = 'docs/gorsel/ss';
const cikti = process.argv[2] ?? 'docs/gorsel/f4c2-dekor-harita.html';
const oku = (f) => JSON.parse(readFileSync(path.join(SS, f), 'utf8'));
const b64 = (f) => `data:image/png;base64,${readFileSync(path.join(SS, f)).toString('base64')}`;

const meta = oku('f4c2-plan-meta.json');
const { yuvalar, dekor } = oku('f4c2-yuvalar.json');
const kadraj = oku('f4c2-kadraj.json');
const isi = [1, 2, 3].map((d) => oku(`f4c2-isi-${d}.json`));
const olcum = readFileSync('docs/olcum-dekor-yuva-f4c2.txt', 'utf8');

// Ölçüm tablosundan dönem-3 satırları (trafik · nokta) — sayılar tam koşudan, elle yazılmaz.
const satir = Object.fromEntries(
  olcum.split('\n').filter((l) => /^\w+\s+\|/.test(l)).map((l) => {
    const p = l.split('|').map((s) => s.trim());
    return [p[0], p.slice(1).map((c) => (/KAPALI/.test(c) ? null : { trafik: c.split(/\s+/)[1], nokta: c.split(/\s+/)[2] }))];
  }),
);
const payi = Object.fromEntries(
  olcum.split('\n').filter((l) => /^\w+\s+\S+\s+(sol|sag|wc)\s/.test(l)).map((l) => [l.split(/\s+/)[0], l.match(/\]\s+(-?\d\.\d{3})/)[1]]),
);

const S = meta.W / 2 / (meta.h * meta.vt); // px / br, zeminde
const px = (x) => meta.W / 2 + x * S;
const pz = (z) => meta.H / 2 + z * S;

const GRUP = {
  sol: { ad: 'Sol arka köşe', renk: 'var(--sol)' },
  sag: { ad: 'Sağ arka köşe', renk: 'var(--sag)' },
  wc: { ad: 'Lavabo duvarı', renk: 'var(--wc)' },
  yil: { ad: 'Yılbaşı takımı', renk: 'var(--yil)' },
};
// Commit #2'den beri yuva kimlikleri `config/decor.ts`ten (radyo · koltuk · … · yilbasi).
const grupOf = (y) => (y.id === 'yilbasi' ? 'yil' : y.duvar);
const SALON = ['1. Salon (baştan)', '2. Salon', '3. Salon'];

function isiSvg(r, d) {
  const vals = r.isi.filter((v) => v > 0).sort((a, b) => a - b);
  const p95 = vals[Math.floor(vals.length * 0.95)] || 1;
  let s = '';
  const c = r.hucre * S;
  for (let iz = 0; iz < r.nz; iz++) {
    for (let ix = 0; ix < r.nx; ix++) {
      const v = r.isi[iz * r.nx + ix];
      if (!v) continue;
      const o = Math.min(1, 0.15 + (0.85 * v) / p95).toFixed(2);
      s += `<rect x="${px(r.x0 + ix * r.hucre).toFixed(1)}" y="${pz(r.z0 + iz * r.hucre).toFixed(1)}" width="${c.toFixed(1)}" height="${c.toFixed(1)}" fill-opacity="${o}"/>`;
    }
  }
  return `<g class="isi" data-donem="${d}" ${d === 3 ? '' : 'hidden'}>${s}</g>`;
}

const dekorSvg = dekor
  .filter((d) => d.y0 < 1.2)
  .map((d) => `<rect x="${px(d.k.minX).toFixed(1)}" y="${pz(d.k.minZ).toFixed(1)}" width="${((d.k.maxX - d.k.minX) * S).toFixed(1)}" height="${((d.k.maxZ - d.k.minZ) * S).toFixed(1)}" class="mevcut"/>`)
  .join('');

function etiketYeri(y) {
  const k = y.kutu;
  const cx = (k.minX + k.maxX) / 2;
  const cz = (k.minZ + k.maxZ) / 2;
  if (y.duvar === 'wc') return { x: px(cx), y: pz(k.maxZ) + 26, anchor: 'middle' };
  const sol = y.duvar === 'sol';
  return { x: px(sol ? k.maxX : k.minX) + (sol ? 10 : -10), y: pz(cz) + 6, anchor: sol ? 'start' : 'end' };
}

const yuvaSvg = yuvalar
  .map((y) => {
    const k = y.kutu;
    const g = grupOf(y);
    const e = etiketYeri(y);
    const w = Math.max(6, (k.maxX - k.minX) * S);
    const h = Math.max(6, (k.maxZ - k.minZ) * S);
    const asili = y.y0 > 0.5;
    return `<g class="yuva ${g}${asili ? ' asili' : ''}"><rect x="${(px((k.minX + k.maxX) / 2) - w / 2).toFixed(1)}" y="${(pz((k.minZ + k.maxZ) / 2) - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>` +
      `<text x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}" text-anchor="${e.anchor}">${y.kod === 'Y' ? `Y·${y.id.slice(1)}` : y.kod}</text></g>`;
  })
  .join('');

function hull(p) {
  const pts = [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up = [];
  for (const q of [...pts].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

const KADRAJ_AD = {
  'sol-arka': 'Sol arka köşe · oyuncu duvara yürüyünce',
  'sag-arka': 'Sağ arka köşe',
  'wc-duvar': 'Lavabo duvarı (tam karşıdan)',
  'sol-on': 'Sol ön · yılbaşı A',
  'sag-on': 'Sağ ön · yılbaşı B',
};
const odak = { 'sol-arka': ['radyo', 'koltuk', 'lamba', 'tablo'], 'sag-arka': ['semaver', 'gramofon', 'kanarya'], 'wc-duvar': ['saat'], 'sol-on': ['yilbasi'], 'sag-on': [] };
const kadrajHtml = kadraj.kadrajlar
  .map((k) => {
    const polys = k.yuva
      .filter((y) => odak[k.ad].includes(y.id) && y.pts.length === 8)
      .map((y) => {
        const yv = yuvalar.find((v) => v.id === y.id);
        const hp = hull(y.pts);
        const cx = hp.reduce((a, p) => a + p[0], 0) / hp.length;
        const top = Math.min(...hp.map((p) => p[1]));
        return `<g class="yuva ${grupOf(yv)}"><polygon points="${hp.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}"/><text x="${cx.toFixed(1)}" y="${(top - 8).toFixed(1)}" text-anchor="middle">${yv.kod === 'Y' ? 'Y' : yv.kod}</text></g>`;
      })
      .join('');
    return `<figure class="kadraj"><div class="tel"><img src="${b64(`f4c2-kadraj-${k.ad}.png`)}" alt="Oyun kamerası: ${KADRAJ_AD[k.ad]}" width="${kadraj.tel.width}" height="${kadraj.tel.height}"><svg viewBox="0 0 ${kadraj.tel.width} ${kadraj.tel.height}" aria-hidden="true">${polys}</svg></div><figcaption>${KADRAJ_AD[k.ad]}</figcaption></figure>`;
  })
  .join('');

const tablo = yuvalar
  .map((y) => {
    const g = grupOf(y);
    const ilk = satir[y.id].findIndex(Boolean);
    const d3 = satir[y.id][2];
    const yer = y.duvar === 'wc' ? `x ${y.boy.toFixed(1)}` : `z ${y.boy.toFixed(1)}`;
    return `<tr><td><span class="nokta ${g}"></span>${y.kod === 'Y' ? `Y · ${y.id === 'yA' ? 'A' : 'B'}` : y.kod}</td><td>${y.ad}</td><td>${GRUP[g].ad} · ${yer}</td><td>${(y.w).toFixed(2)} × ${(y.d).toFixed(2)} · ${y.y1.toFixed(2)} yük.</td><td>${SALON[ilk] ?? '—'}</td><td class="num">${d3.trafik}</td><td class="num">${d3.nokta}</td><td class="num">${payi[y.id]}</td></tr>`;
  })
  .join('');

const html = `<title>Kıraathane Dekor Haritası</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--zemin:#eef0ee;--kagit:#fbfbf9;--murekkep:#1f2a2b;--soluk:#5c6a6b;--cizgi:#d3d8d5;--vurgu:#1f6f6a;
--sol:#c9831a;--sag:#17857e;--wc:#6a55c4;--yil:#c23838;--isi:#e0452b;--mevcut:#2b3a3b}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--zemin:#151b1c;--kagit:#1d2526;--murekkep:#e6ecea;--soluk:#9aa8a7;--cizgi:#34403f;--vurgu:#5fc2b9;--sol:#f0a93f;--sag:#3cc4b9;--wc:#a996ff;--yil:#ff6b6b;--isi:#ff6a4d;--mevcut:#dfe7e5}}
:root[data-theme="dark"]{color-scheme:dark;--zemin:#151b1c;--kagit:#1d2526;--murekkep:#e6ecea;--soluk:#9aa8a7;--cizgi:#34403f;--vurgu:#5fc2b9;--sol:#f0a93f;--sag:#3cc4b9;--wc:#a996ff;--yil:#ff6b6b;--isi:#ff6a4d;--mevcut:#dfe7e5}
body{background:var(--zemin);color:var(--murekkep);font:15px/1.55 "IBM Plex Sans",system-ui,sans-serif;padding-inline:16px}
main{max-width:1180px;margin:0 auto;padding-block:28px 64px;display:grid;gap:40px}
h1,h2{font-family:"Bricolage Grotesque","IBM Plex Sans",sans-serif;text-wrap:balance;margin:0;letter-spacing:-.01em}
h1{font-size:clamp(28px,4.2vw,44px);line-height:1.05}
h2{font-size:22px}
p{margin:0;max-width:68ch}
.ust{display:grid;gap:12px}
.etiket{font:500 12px/1 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--vurgu)}
.ozet{display:flex;flex-wrap:wrap;gap:8px 20px;color:var(--soluk);font-size:14px}
.ozet b{color:var(--murekkep);font-weight:600;font-variant-numeric:tabular-nums}
section{display:grid;gap:16px}
.plan-kutu{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:24px;align-items:start}
@media (max-width:860px){.plan-kutu{grid-template-columns:1fr}}
.plan{position:relative;background:var(--kagit);border:1px solid var(--cizgi);border-radius:6px;overflow:hidden}
.plan img,.plan svg{display:block;width:100%;height:auto}
.plan svg{position:absolute;inset:0;height:100%}
.isi rect{fill:var(--isi)}
.mevcut{fill:none;stroke:var(--mevcut);stroke-width:1.5;stroke-dasharray:3 3;opacity:.6}
.yuva rect,.yuva polygon{fill-opacity:.35;stroke-width:3}
.yuva.asili rect{fill-opacity:0;stroke-dasharray:6 3}
.yuva text{font:600 17px "IBM Plex Mono",monospace;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}
.sol rect,.sol polygon{fill:var(--sol);stroke:var(--sol)} .sol text{fill:var(--sol)}
.sag rect,.sag polygon{fill:var(--sag);stroke:var(--sag)} .sag text{fill:var(--sag)}
.wc rect,.wc polygon{fill:var(--wc);stroke:var(--wc)} .wc text{fill:var(--wc)}
.yil rect,.yil polygon{fill:var(--yil);stroke:var(--yil)} .yil text{fill:var(--yil)}
.yan{display:grid;gap:18px;font-size:14px}
.lejant{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.lejant li{display:flex;gap:10px;align-items:center}
.nokta{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:8px;vertical-align:-1px;flex:none}
.nokta.sol{background:var(--sol)}.nokta.sag{background:var(--sag)}.nokta.wc{background:var(--wc)}.nokta.yil{background:var(--yil)}
.nokta.isi{background:var(--isi)}.nokta.mevcut{border:1.5px dashed var(--mevcut);background:none}
fieldset{border:1px solid var(--cizgi);border-radius:6px;padding:10px 12px;margin:0;display:grid;gap:8px}
legend{font:500 12px "IBM Plex Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--soluk);padding:0 4px}
.dugmeler{display:flex;gap:6px;flex-wrap:wrap}
.dugmeler button{font:500 13px "IBM Plex Sans",sans-serif;border:1px solid var(--cizgi);background:var(--kagit);color:var(--murekkep);border-radius:4px;padding:6px 10px;cursor:pointer}
.dugmeler button[aria-pressed="true"]{background:var(--vurgu);border-color:var(--vurgu);color:var(--kagit)}
button:focus-visible{outline:2px solid var(--vurgu);outline-offset:2px}
.not{color:var(--soluk);font-size:13px}
.kadrajlar{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px}
.kadraj{margin:0;display:grid;gap:8px}
.tel{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--cizgi);background:var(--kagit)}
.tel img,.tel svg{display:block;width:100%;height:auto}
.tel svg{position:absolute;inset:0;height:100%}
.tel .yuva text{font-size:22px}
figcaption{font-size:13px;color:var(--soluk)}
.tablo{overflow-x:auto;border:1px solid var(--cizgi);border-radius:6px;background:var(--kagit)}
table{border-collapse:collapse;width:100%;min-width:820px;font-size:14px}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--cizgi);vertical-align:top}
th{font:500 11px "IBM Plex Mono",monospace;letter-spacing:.07em;text-transform:uppercase;color:var(--soluk)}
tr:last-child td{border-bottom:0}
.num{font:14px "IBM Plex Mono",monospace;font-variant-numeric:tabular-nums;text-align:right}
th.num{text-align:right}
.bulgular{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.bulgu{background:var(--kagit);border:1px solid var(--cizgi);border-radius:6px;padding:14px 16px;display:grid;gap:6px}
.bulgu h3{margin:0;font:600 15px "IBM Plex Sans",sans-serif}
.bulgu p{font-size:14px;color:var(--soluk)}
</style>
<main>
<header class="ust">
<span class="etiket">F4c-2 · 💎 dekor · 1. adım: göster</span>
<h1>Dekor salonun neresine oturuyor</h1>
<p>Bugünkü salon, tamamen açık hâli. Masa, tezgâh, duvar ve yol yerinde; hiçbiri kaydırılmadı. Renkli kutular 💎 ile satılacak dekorun oturacağı yuvalar. Kırmızı ısı, müşteri ve personelin 15 dakikada yürüdüğü yerler.</p>
<div class="ozet"><span><b>9</b> ürün · <b>10</b> yuva (yılbaşına iki aday)</span><span>yuvalardaki trafik <b>%0,0</b> (kapının içindeki denetim kutusunda <b>%41–63</b>)</span><span>duvardan pay <b>0,05 br</b>, çıtanın önünden</span></div>
</header>

<section aria-labelledby="h-plan">
<h2 id="h-plan">Üstten plan</h2>
<div class="plan-kutu">
<div class="plan"><img src="${b64('f4c2-plan.png')}" alt="Salonun üstten görünüşü: üstte mutfak, merdiven ve lavabo; ortada iki banket sırası, önde sekiz dört kişilik masa" width="${meta.W}" height="${meta.H}">
<svg viewBox="0 0 ${meta.W} ${meta.H}" aria-hidden="true">${isi.map((r, i) => isiSvg(r, i + 1)).join('')}<g id="mevcut">${dekorSvg}</g>${yuvaSvg}</svg></div>
<div class="yan">
<ul class="lejant">
<li><span class="nokta sol"></span>Sol arka köşe: radyo, koltuk, lamba, tablo</li>
<li><span class="nokta sag"></span>Sağ arka köşe: semaver, gramofon, kanarya</li>
<li><span class="nokta wc"></span>Lavabo duvarı: sarkaçlı saat</li>
<li><span class="nokta yil"></span>Yılbaşı koltuğu + halı: A ya da B</li>
<li><span class="nokta mevcut"></span>Bugünkü dekor (dokunulmadı)</li>
<li><span class="nokta isi"></span>Yürüme ısısı</li>
</ul>
<fieldset><legend>Yürüme ısısı</legend>
<div class="dugmeler" role="group" aria-label="Isı dönemi">
<button type="button" id="d1" data-d="1" aria-pressed="false">1. Salon</button>
<button type="button" id="d2" data-d="2" aria-pressed="false">2 salon</button>
<button type="button" id="d3" data-d="3" aria-pressed="true">Tam kat</button>
<button type="button" id="d0" data-d="0" aria-pressed="false">Kapalı</button>
</div>
<p class="not">Kesik çerçeve duvara asılı parça (tablo, saat). Yuvaya yakın ısı yok.</p>
</fieldset>
</div>
</div>
</section>

<section aria-labelledby="h-kadraj">
<h2 id="h-kadraj">Oyun kamerasından</h2>
<p>Telefon dikey. Kutuların köşeleri oyunun kendi kamerasıyla izdüşürüldü; sahneye bir şey eklenmedi.</p>
<div class="kadrajlar">${kadrajHtml}</div>
</section>

<section aria-labelledby="h-bulgu">
<h2 id="h-bulgu">Ne gördük</h2>
<div class="bulgular">
<div class="bulgu"><h3>Yürüyüş yolunda değiller</h3><p>On yuvanın onunda da üç dönemde trafik %0,0. Denetim kutusu kapının içinde %41–63 gördü, yani ölçüm kör değil. En yakın pad ya da yükseltme noktası 1,81 br uzakta (sınır 1,0).</p></div>
<div class="bulgu"><h3>Duvara gömülmüyorlar</h3><p>Yere oturan eşyanın sırtı çıtanın (0,26 kalın) 0,05 önünde. Bugünkü konsol sırtını gövdeye (0,18) dayıyor; çıta ile lambri onun içinden geçiyor. Aday karelerinde görülen gömülme bu.</p></div>
<div class="bulgu"><h3>Çoğu 3. Salon'la açılıyor</h3><p>Arka köşeler ve lavabo duvarı 3. Salon açılmadan çizilmiyor. Oyunun başından beri görünen tek yuva yılbaşı A (sol ön, TV ile askı arası).</p></div>
<div class="bulgu"><h3>Yan duvar kadrajın kenarında</h3><p>Dikey telefonda kamera oyuncunun yalnız yaklaşık 4–5 br sağını solunu görüyor. Yan duvardaki eşya, oyuncu o köşeye yürüyünce okunuyor. Lavabo duvarı ise tam karşıdan görünüyor.</p></div>
</div>
</section>

<section aria-labelledby="h-tablo">
<h2 id="h-tablo">Yuvalar</h2>
<div class="tablo"><table>
<thead><tr><th>Kod</th><th>Ürün</th><th>Yer</th><th>Gövde (en × derinlik)</th><th>İlk görünür</th><th class="num">Trafik</th><th class="num">En yakın nokta</th><th class="num">Duvar payı</th></tr></thead>
<tbody>${tablo}</tbody></table></div>
<p class="not">Sayılar: <code>OLCUM=tam npx tsx tools/olcum-dekor-yuva-f4c2.ts</code> (240 sn ısınma + 900 sn kayıt, her dönem). Trafik ve nokta tam kat dönemi. Ölçüler aday modellerinden; koltuk ×0,70, yılbaşı koltuğu ×0,50 küçültülmüş.</p>
</section>
</main>
<script>
(() => {
  const btn = [...document.querySelectorAll('[data-d]')];
  const kat = [...document.querySelectorAll('.isi')];
  const sec = (d) => {
    btn.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.d === d)));
    kat.forEach((g) => { g.hidden = g.dataset.donem !== d; });
  };
  btn.forEach((b) => b.addEventListener('click', () => sec(b.dataset.d)));
})();
</script>
`;
writeFileSync(cikti, html);
console.log(cikti, (html.length / 1024).toFixed(0), 'KB');
