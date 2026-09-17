/**
 * olcum-grid-sonda-f1b.mjs — §I'nin PB kolundaki ÇELİŞKİYİ çözen sonda.
 *
 * NEDEN VAR: §I koşusu PB (iki sütun) kolunda Mağaza · Karakter · Ayarlar için
 * **kaydırma 1,00× ("hiç kaydırma gerekmiyor")** dedi. Karesi (`ss/f1b-yerlesim-PB-shop.png`)
 * bunu yalanladı: kartlar alt kenarda kesik duruyor. Aynı koşunun BAŞKA bir sütunu da
 * çelişiyordu — `dugme(gor/top)` PB/Mağaza'da **4/13** diyor, yani 9 düğme gövdenin dışında.
 * "Kaydırma yok" ile "9 düğme dışarıda" aynı anda doğru olamaz.
 *
 * Şüphe: `scrollHeight`, gövde `display:grid`e çevrilince taşan satırları saymıyor olabilir.
 * Bu sonda iki ölçüyü YAN YANA koyar: `scrollHeight` ile çocukların GERÇEK en alt kenarı.
 * İkisi ayrışıyorsa `kaydirma` sütunu grid kolları için geçersizdir ve rapor öyle yazılır.
 *
 * Koşu: node tools/olcum-grid-sonda-f1b.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.F1B_PORT ?? '', 10) || 5217;

const PADS = (() => {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
})();

const PB_CSS = `@media (orientation: landscape) and (max-height: 480px) {
  .modal-card.screen { width: min(100%, 880px); }
  .sheet-body { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; align-content: start; }
  .sheet-body > .sheet-sec, .sheet-body > .rep-card, .sheet-body > .usta-strip,
  .sheet-body > .sheet-foot-note, .sheet-body > .char-head { grid-column: 1 / -1; }
  .sheet-pad { display: contents; }
}`;

const SONDA = (sec) => {
  const govde = document.querySelector(`${sec} .sheet-body`);
  if (!govde) return { yok: true };
  const gr = govde.getBoundingClientRect();
  let enAlt = gr.top;
  let disarida = 0, toplam = 0;
  for (const el of govde.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (getComputedStyle(el).display === 'none') continue;
    toplam++;
    if (r.bottom > enAlt) enAlt = r.bottom;
    if (r.bottom > gr.bottom + 1) disarida++;
  }
  return {
    govdeClient: govde.clientHeight,
    govdeScroll: govde.scrollHeight,
    gercekIcerik: Math.round(enAlt - gr.top),
    disarida, toplam,
    akis: getComputedStyle(govde).display,
  };
};

function sunucuKaldir() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, red) => {
    const z = setTimeout(() => red(new Error('sunucu 60 sn icinde hazir olmadi')), 60_000);
    s.stdout.on('data', (d) => { if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); } });
    s.on('exit', (k) => { clearTimeout(z); red(new Error(`sunucu ${k} koduyla kapandi`)); });
  });
}

async function main() {
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const satirlar = [];
  try {
    for (const kol of [{ id: 'P0', css: '' }, { id: 'PB', css: PB_CSS }]) {
      const baglam = await tarayici.newContext({
        viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true,
      });
      const s = await baglam.newPage();
      await s.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
      await s.waitForTimeout(6000);
      await s.evaluate((pads) => {
        window.__setState({ padsDone: pads, padFills: {}, wallet: 1e9, diamonds: 1e6 });
        window.__zaman(1); window.__advanceTime(1);
      }, PADS);
      await s.waitForTimeout(1200);
      await s.evaluate(() => { window.__zaman(0); window.__teleport(0, 0); });
      await s.waitForTimeout(1800);
      if (kol.css) await s.addStyleTag({ content: kol.css });
      await s.waitForTimeout(500);
      for (const p of [
        { id: 'shop', tetik: '[data-testid="shop"]', panel: '[data-testid="shop-panel"]' },
        { id: 'menu', tetik: '[data-testid="gear"]', panel: '[data-testid="menu"]' },
        { id: 'char', tetik: '[data-testid="char"]', panel: '[data-testid="char-panel"]' },
      ]) {
        await s.click(p.tetik);
        await s.waitForTimeout(900);
        satirlar.push({ kol: kol.id, panel: p.id, ...(await s.evaluate(SONDA, p.panel)) });
        const geri = await s.$(`${p.panel} .sheet-back`);
        if (geri) await geri.click();
        await s.waitForTimeout(500);
      }
      await baglam.close();
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }

  console.log('# §I SONDASI — "kaydirma 1,00x" iddiasi vs cocuklarin GERCEK en alt kenari');
  console.log('');
  console.log('  kol  panel   akis   govdeClient  govdeScroll  GERCEK icerik  disarida/toplam  scrollHeight dogru mu?');
  for (const r of satirlar) {
    const dogru = Math.abs(r.govdeScroll - r.gercekIcerik) <= 4 ? 'EVET' : '*** HAYIR ***';
    console.log(
      `  ${r.kol.padEnd(4)} ${r.panel.padEnd(7)} ${String(r.akis).padEnd(6)} ${String(r.govdeClient).padStart(11)} ` +
      `${String(r.govdeScroll).padStart(12)} ${String(r.gercekIcerik).padStart(14)} ${String(r.disarida + '/' + r.toplam).padStart(16)}  ${dogru}`
    );
  }
}

main().catch((e) => { console.error('KIRILDI:', e.message); process.exit(1); });
