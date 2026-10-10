// kucuk-resim.mjs — mağaza kozmetiklerinin GERÇEK küçük resimleri (Sprint B · Faz 4).
// Oyunun kendi bileşenleriyle çizer (`tools/kucuk-resim.tsx`), saydam 192×192 webp yazar:
//   public/assets/thumbs/<tur>-<id>.webp  +  kontakt sayfası docs/tasarim/sprint-B/kucuk-resimler.png
// Çalıştır:  npx tsx tools/kucuk-resim.mjs            (liste economy.config'ten; tsx TS'i okur)
//   --yalniz=dekor-koltuk,tepsi-aski   yalnız bunları yeniden çek (kontakt yine hepsinden)
//   --bozuk=armchair                    o modeli 404'le (kırmızı kutu tuzağının mutasyon sınaması)
//   --gecikme=armchair:4000             o modeli geciktir (yüklenmeden çekmiyor mu sınaması)
// Kırmızı yedek kutu sahnede ya da piksellerde görülürse betik HATA ile durur, dosya yazılmaz.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { kucukResimListesi, KUCUK_KLASOR, KUCUK_PX, TOPLAM_SINIR } from './kucuk-resim-liste.ts';

const PORT = 5302;
const KONTAKT = 'docs/tasarim/sprint-B/kucuk-resimler.png';
/** Dekorda piksellerin bu kadarı yedek kırmızısıysa kutu fotoğraflanmış sayılır (ölçüm: notta). */
const KIRMIZI_ESIK = 0.35;
/** Gerçekten kırmızı olan eşyalar (yedekle karışmaz; sahne denetimi yine çalışır). */
const KIRMIZI_SERBEST = new Set(['dekor-yilbasi-kirmizi']);

const arg = (ad) => process.argv.find((a) => a.startsWith(`--${ad}=`))?.slice(ad.length + 3);
const yalniz = arg('yalniz')?.split(',');
const bozuk = arg('bozuk');
const [gecAd, gecMs] = (arg('gecikme') ?? '').split(':');

const liste = kucukResimListesi();
mkdirSync(KUCUK_KLASOR, { recursive: true });
mkdirSync(path.dirname(KONTAKT), { recursive: true });

const sv = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'tools/vite-kare.config.mjs', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
let acik = false;
for (let i = 0; i < 80 && !acik; i++) {
  try { acik = (await fetch(`http://127.0.0.1:${PORT}/tools/kucuk-resim.html`)).ok; } catch { /* bekle */ }
  if (!acik) await new Promise((r) => setTimeout(r, 400));
}
if (!acik) { sv.kill(); throw new Error(`vite ${PORT} açılmadı`); }

const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
if (bozuk) await ctx.route(`**/${bozuk}.gltf`, (r) => r.fulfill({ status: 404, body: '' }));
if (gecAd) await ctx.route(`**/${gecAd}.gltf`, async (r) => { await new Promise((x) => setTimeout(x, Number(gecMs) || 3000)); await r.continue(); });
const s = await ctx.newPage();
const konsol = [];
s.on('console', (m) => m.type() === 'error' && konsol.push(m.text()));

const hatalar = [];
const olculer = [];
try {
  for (const k of liste) {
    const ad = `${k.tur}-${k.id}`;
    if (yalniz && !yalniz.includes(ad)) continue;
    await s.goto(`http://127.0.0.1:${PORT}/tools/kucuk-resim.html?tur=${k.tur}&id=${encodeURIComponent(k.id)}`);
    await s.waitForFunction(() => window.KUCUK?.hazir, null, { timeout: 90_000 });
    const r = await s.evaluate(() => window.KUCUK);
    const o = r.olcu ?? {};
    olculer.push(`${ad.padEnd(24)} dolu ${(o.dolu * 100 || 0).toFixed(0).padStart(3)}%  en ${(o.en * 100 || 0).toFixed(0).padStart(3)}%  boy ${(o.boy * 100 || 0).toFixed(0).padStart(3)}%  kırmızı ${((o.kirmizi ?? 0) * 100).toFixed(1)}%`);
    if (r.hata) { hatalar.push(`${ad}: ${r.hata}`); continue; }
    if (k.tur === 'dekor' && !KIRMIZI_SERBEST.has(ad) && o.kirmizi > KIRMIZI_ESIK) {
      hatalar.push(`${ad}: piksellerin %${(o.kirmizi * 100).toFixed(0)}'i yedek kırmızısı — kutu fotoğraflanmış`);
      continue;
    }
    if (!o.dolu) { hatalar.push(`${ad}: boş kare`); continue; }
    writeFileSync(path.join(KUCUK_KLASOR, k.dosya), Buffer.from(r.webp.split(',')[1], 'base64'));
  }
} finally {
  console.log(olculer.join('\n'));
}

if (hatalar.length) {
  await b.close(); sv.kill();
  console.error(`\nHATA (${hatalar.length}):\n  ${hatalar.join('\n  ')}`);
  process.exit(1);
}

// Kontakt sayfası: bütün resimler etiketli ızgarada (≤ 1600 px).
const SUTUN = 8;
const hucre = liste.map((k) => {
  const p = path.join(KUCUK_KLASOR, k.dosya);
  const src = existsSync(p) ? `data:image/webp;base64,${readFileSync(p).toString('base64')}` : '';
  return `<figure><div class="r">${src ? `<img src="${src}">` : 'YOK'}</div><figcaption><b>${k.tur}-${k.id}</b><br>${k.label}</figcaption></figure>`;
}).join('');
const sayfa = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:12px;background:#f3eee6;font:11px/1.3 system-ui;color:#3b2f25;width:${SUTUN * 194}px}
.g{display:grid;grid-template-columns:repeat(${SUTUN},${KUCUK_PX}px);gap:2px}
figure{margin:0}.r{width:${KUCUK_PX}px;height:${KUCUK_PX}px;background:#e2d8ca;border-radius:10px;display:grid;place-items:center}
img{width:${KUCUK_PX}px;height:${KUCUK_PX}px}figcaption{padding:3px 4px 8px;text-align:center}h1{font-size:14px;margin:0 0 8px}
</style><h1>Kozmetik küçük resimleri — ${liste.length} adet, ${KUCUK_PX}×${KUCUK_PX} webp (oyunun kendi çekimi)</h1><div class="g">${hucre}</div>`;
const ks = await (await b.newContext({ viewport: { width: SUTUN * 194 + 24, height: 600 } })).newPage();
await ks.setContent(sayfa);
await ks.screenshot({ path: KONTAKT, fullPage: true });
await b.close(); sv.kill();

const dosyalar = readdirSync(KUCUK_KLASOR).filter((f) => f.endsWith('.webp'));
const toplam = dosyalar.reduce((t, f) => t + statSync(path.join(KUCUK_KLASOR, f)).size, 0);
console.log(`\n${dosyalar.length} dosya · toplam ${(toplam / 1024).toFixed(1)} KB (sınır ${TOPLAM_SINIR / 1024} KB) · kontakt ${KONTAKT}`);
console.log(konsol.length ? `konsol hatası ${konsol.length}: ${konsol.slice(0, 3).join(' | ')}` : 'konsol hatası 0');
