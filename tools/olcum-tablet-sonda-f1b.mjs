/**
 * olcum-tablet-sonda-f1b.mjs — §H'nin NEGATİF SONUCUNU açan sonda.
 *
 * NEDEN VAR: §H koşusu G-55 kolunun (tablet bir basamak yukarı) **en küçük yazıyı hiç
 * değiştirmediğini** söyledi — taban 11 px, kol 11 px. Kullanıcının şikâyeti tam olarak buydu
 * (*"tablette level barını vs biraz daha büyütebilirsin"*), yani kol şikâyeti karşılamıyor.
 *
 * "11 px değişmedi" bir bulgu değil, bir SORU: HANGİ öğe 11 px'te kaldı? Araç bunu söylemeden
 * kol ne düzeltilebilir ne de elenebilir. Bu sonda o tek soruyu cevaplıyor: tabandaki ve koldaki
 * en küçük 12 yazıyı SINIF ADIYLA basar, ayrıca kullanıcının saydığı üç öğenin (madalyon ·
 * kaynak rozeti · yuvarlak düğme) gerçek pikselini ölçer.
 *
 * Koşu: node tools/olcum-tablet-sonda-f1b.mjs   ·   F1B_PORT ile port değiştirilir
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.F1B_PORT ?? '', 10) || 5216;

const PADS = (() => {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
})();

const T_PLUS = `
  .hud { --pill-h: 38px; }
  .lvl-star { width: 52px; height: 52px; left: -13px; }
  .lvl-num { font-size: var(--p4); }
  .lvl-bar { width: 84px; height: 17px; }
  .lvl-text { font-size: var(--p2); line-height: 17px; }
  .cur-item { min-width: 80px; padding: 0 13px 0 27px; }
  .cur-item > svg { width: 36px; height: 36px; }
  .cur-val { font-size: var(--p3); }
  .round-btn { width: 46px; height: 46px; }
  .round-btn > svg { width: 26px; height: 26px; }
  .navtab-label { font-size: var(--p2); }
  .band-title { font-size: var(--p3); }
  .band-sub, .band-count { font-size: var(--p2); }
`;

const SONDA = () => {
  const yazilar = [];
  for (const el of document.querySelectorAll('.hud *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length)) continue;
    yazilar.push({
      sinif: String(el.className.baseVal ?? el.className ?? el.tagName).slice(0, 34),
      px: +Number.parseFloat(cs.fontSize).toFixed(0),
      metin: el.textContent.trim().slice(0, 18),
    });
  }
  yazilar.sort((a, b) => a.px - b.px);

  const olc = (sec) => {
    const el = document.querySelector(sec);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return `${r.width.toFixed(0)}×${r.height.toFixed(0)}`;
  };
  return {
    yazilar: yazilar.slice(0, 12),
    madalyon: olc('.lvl-star'),
    seviyeCubugu: olc('.lvl-bar'),
    kaynakRozeti: olc('.cur-item'),
    kaynakIkonu: olc('.cur-item > svg'),
    yuvarlakDugme: olc('.round-btn'),
    navSekmesi: olc('.navtab'),
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
  const cikti = [];
  try {
    for (const kol of [{ id: 'T0', css: '' }, { id: 'T+', css: T_PLUS }]) {
      const baglam = await tarayici.newContext({
        viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
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
      await s.waitForTimeout(700);
      cikti.push({ kol: kol.id, ...(await s.evaluate(SONDA)) });
      await baglam.close();
    }
  } finally {
    await tarayici.close();
    sunucu.kill();
  }

  console.log('# §H SONDASI — tablet yatayi 1280×800 · G-55 kolunun neyi degistirdigi/degistirmedigi');
  for (const c of cikti) {
    console.log('');
    console.log(`## ${c.kol}`);
    console.log(`  madalyon ${c.madalyon} · seviye cubugu ${c.seviyeCubugu} · kaynak rozeti ${c.kaynakRozeti}`);
    console.log(`  kaynak ikonu ${c.kaynakIkonu} · yuvarlak dugme ${c.yuvarlakDugme} · nav sekmesi ${c.navSekmesi}`);
    console.log('  en kucuk 12 yazi:');
    for (const y of c.yazilar) console.log(`    ${String(y.px + 'px').padStart(5)}  ${y.sinif.padEnd(34)} "${y.metin}"`);
  }
}

main().catch((e) => { console.error('KIRILDI:', e.message); process.exit(1); });
