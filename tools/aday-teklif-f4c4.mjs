/**
 * aday-teklif-f4c4.mjs — F4c-4 aday kareleri: Başlangıç Paketi teklif kartı + Paketler sekmesi, METİN ve
 * görsel ağırlık kolları. Kart OYUNUN İÇİNDE, sayfa üstünde yerinde değiştirilerek çizilir (gerçek font, ışık,
 * önizleme tuvali); oyun kodu değişmez. Kullanım: node tools/aday-teklif-f4c4.mjs
 * Çıktı: docs/gorsel/ss/f4c4-teklif-<kol>.png · f4c4-paket-<kol>.png
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BAK_PORT ?? 5253);
const OUT = 'docs/gorsel/ss';

const CSS = `
.ad-kol .teklif-icerik{gap:10px;margin:6px 0 12px;width:100%}
.ad-hero{display:flex;align-items:center;justify-content:center;gap:10px;font-family:var(--font-game);font-weight:800;font-size:44px;line-height:1;color:#fff;text-shadow:0 3px 0 rgba(20,10,50,.55)}
.ad-hero svg{width:40px;height:40px}
.ad-alt{font-family:var(--font-game);font-weight:800;font-size:15px;letter-spacing:.06em;color:#ffd36b;text-transform:uppercase}
.ad-liste{list-style:none;margin:0;padding:0;display:grid;gap:8px;width:100%}
.ad-liste li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(10,4,40,.35);text-align:left;font-size:16px;color:#f2ecff}
.ad-liste li b{font-family:var(--font-game);font-weight:800;font-size:18px;color:#fff}
.ad-liste .ik{flex:0 0 34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.08);font-size:18px}
.pul{background:linear-gradient(135deg,#8a1f2b 0 55%,#f1e7d3 55% 100%)!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)}
.pul-b{display:block;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#8a1f2b 0 55%,#f1e7d3 55% 100%)}
.ad-etiket{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:#ffcf4a;color:#3a2200;font-family:var(--font-game);font-weight:800;font-size:12px;letter-spacing:.03em;vertical-align:2px}
.ad-karolar{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
.ad-karo{border-radius:16px;padding:12px 8px 10px;background:linear-gradient(#4b3a95,#2d2163);box-shadow:inset 0 0 0 2px rgba(255,211,107,.55);display:grid;gap:4px;justify-items:center;color:#fff}
.ad-karo .buyuk{font-family:var(--font-game);font-weight:800;font-size:30px;line-height:1;display:flex;align-items:center;gap:6px}
.ad-karo .buyuk svg{width:26px;height:26px}
.ad-karo span{font-size:14px;color:#e6dcff}
.ad-kurdele{position:absolute;top:-16px;left:50%;transform:translateX(-50%);padding:8px 26px 6px;border-radius:12px;background:linear-gradient(#ffd057,#e69a17);color:#3a2200;font-family:var(--font-game);font-weight:800;font-size:20px;box-shadow:0 4px 0 #9a5a06;white-space:nowrap}
.ad-isik .reward-title{margin-top:10px}
.ad-isik{background:radial-gradient(120% 60% at 50% 0%,#6a4fd0 0%,rgba(0,0,0,0) 70%),var(--card-bg,#2f2566)!important;box-shadow:0 0 0 3px #ffcf4a,0 0 40px rgba(255,207,74,.35)!important}
.ad-cta-fiyat{display:flex;flex-direction:column;align-items:center;line-height:1.05}
.ad-cta-fiyat small{font-size:12px;opacity:.75;font-weight:700}
.ad-not{font-size:13px;color:#b9aee0;margin:-2px 0 10px}
`;

/** Kollar: kartın içeriği. `{gem}` elmas ikonunun SVG'si, `{onizleme}` oyunun önizleme tuvali (taşınır). */
const TEKLIF = {
  // T1 — SAYI KAHRAMAN: 100 💎 kartın en büyük sözü; içindekiler iki satır; not "Şimdi değil"in üstünde.
  t1: `<div class="reward-title">Başlangıç Paketi</div>{onizleme}
    <div class="teklif-icerik">
      <div class="ad-hero">{gem}100</div>
      <ul class="ad-liste">
        <li><span class="ik pul"></span><span><b>Kurucu kıyafeti</b><span class="ad-etiket">YALNIZ BU PAKETTE</span><br>Bordo yelek ve fes</span></li>
      </ul>
    </div>
    <button class="sheet-cta">{fiyat}</button>
    <div class="ad-not">Bir kez alınabilir. Sonra da Mağaza'da durur.</div>
    <button class="sheet-cta ad">Şimdi değil</button>`,
  // T2 — İKİ KARO: paketin iki parçası yan yana eşit ağırlıkta; kurdele başlık.
  t2: `<div class="ad-kurdele">Başlangıç Paketi</div><div class="reward-title">Kıraathanene iyi bir başlangıç</div>{onizleme}
    <div class="teklif-icerik">
      <div class="ad-karolar">
        <div class="ad-karo"><div class="buyuk">{gem}100</div><span>elmas</span></div>
        <div class="ad-karo"><div class="buyuk"><span class="pul-b"></span></div><span>Kurucu kıyafeti<br><b style="color:#ffd36b">yalnız bu pakette</b></span></div>
      </div>
    </div>
    <button class="sheet-cta"><span class="ad-cta-fiyat">Paketi Al<small>{fiyat}</small></span></button>
    <button class="sheet-cta ad">Şimdi değil</button>`,
  // T3 — IŞIKLI KART: altın çerçeve + üstten ışık, içindekiler ✓ listesi, alt başlık altın.
  t3: `<div class="ad-alt">Bir kereye özel</div><div class="reward-title">Başlangıç Paketi</div>{onizleme}
    <div class="teklif-icerik">
      <ul class="ad-liste">
        <li><span class="ik">{gem}</span><span><b>100 elmas</b><br>Kıyafet, tepsi ve dekor için</span></li>
        <li><span class="ik pul"></span><span><b>Kurucu kıyafeti</b><br>Bordo yelek ve fes, yalnız bu pakette</span></li>
      </ul>
    </div>
    <button class="sheet-cta">Al · {fiyat}</button>
    <button class="sheet-cta ad">Şimdi değil</button>`,
};

const sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
sunucu.stdout.on('data', () => {});
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break; } catch { /* henüz yok */ }
  await new Promise((r) => setTimeout(r, 400));
}
const tarayici = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const hatalar = [];
const sayfaAc = async () => {
  const s = await tarayici.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  s.on('pageerror', (e) => hatalar.push(String(e.message)));
  await s.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await s.waitForFunction(() => typeof window.__setState === 'function', null, { timeout: 60000 });
  await s.evaluate(() => window.__setState({ kafeAdi: 'Mutlu Kahvesi', questIndex: 999 }));
  await s.addStyleTag({ content: CSS });
  await s.waitForTimeout(1500);
  return s;
};
try {
  for (const kol of ['t0', ...Object.keys(TEKLIF)]) {
    const s = await sayfaAc();
    await s.evaluate(() => window.__setState({ mastersOwned: ['t0'], satin: { reklamsiz: false, baslangic: false, gunlukGun: -1, islenen: [], teklif: false } }));
    await s.waitForSelector('[data-testid="baslangic-teklif"]', { timeout: 8000 });
    await s.waitForTimeout(1800);
    if (kol !== 't0') {
      await s.evaluate(([html, kol]) => {
        const kart = document.querySelector('.teklif-card');
        const on = kart.querySelector('.shop-preview');
        const gem = kart.querySelector('.odul-sat svg')?.outerHTML ?? '💎';
        const fiyat = '₺ 49,99';
        kart.classList.add('ad-kol');
        if (kol === 't3') kart.classList.add('ad-isik');
        if (kol === 't2') kart.style.overflow = 'visible';
        kart.innerHTML = html.replaceAll('{gem}', gem).replaceAll('{fiyat}', fiyat).replace('{onizleme}', '<i id="on"></i>');
        kart.querySelector('#on').replaceWith(on);
      }, [TEKLIF[kol], kol]);
      await s.waitForTimeout(600);
    }
    await s.screenshot({ path: `${OUT}/f4c4-teklif-${kol}.png` });
    console.log('teklif', kol);
    await s.close();
  }
} catch (e) {
  console.error('HATA', e.message);
} finally {
  await tarayici.close();
  sunucu.kill();
}
console.log(hatalar.length ? 'KONSOL HATALARI: ' + hatalar.slice(0, 5).join(' | ') : 'konsol temiz');
