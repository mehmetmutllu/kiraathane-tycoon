/**
 * shot-hud-r3.mjs — R3 KARAR YÜZEYİ: seviye rozeti ve kese çerçevesi ADAYLARI.
 *
 * NEDEN AYRI ARAÇ: §D ve §E sayıyla kapanmaz. `olcum-hud-r3.mjs` bu iki kolun ölçülebilir
 * yanını (kaç satır, yol kaç px, yatak ne kadar oynuyor) veriyor; ama "hangisi güzel" bir
 * biçim sorusudur ve `feedback_show_dont_ask` kuralı nettir: estetik çatalda kol metinle
 * anlatılmaz, adaylar AYNI KADRAJDA render edilip kullanıcı eleyerek seçer.
 *
 * Adayların hepsi ENJEKTE CSS/DOM'dur — uygulama kaynağına dokunulmaz, yani bu araç bir
 * "yarı uygulama" bırakmaz. Seçilen aday sonra elle koda taşınır.
 *
 * Çıktı: `docs/gorsel/ss/r3-aday-rozet-*.png` · `docs/gorsel/ss/r3-aday-kese-*.png`
 * Koşu:  node tools/shot-hud-r3.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.HUD_PORT ?? '', 10) || 5236;
const SS = path.join(KOK, 'docs', 'gorsel', 'ss');
mkdirSync(SS, { recursive: true });

/** Halka kurulumu — birden çok aday aynı iskeleti farklı ölçülerle kullanıyor. */
const HALKA_DOM = (kal, disari, yuva) => `(() => {
  const med = document.querySelector('.rep-medal');
  const fill = document.querySelector('.rep-fill');
  if (!med) return;
  med.querySelector('.rep-halka')?.remove();
  const oran = fill ? Math.min(1, (parseFloat(fill.style.width) || 0) / 100) : 0;
  const h = document.createElement('i');
  h.className = 'rep-halka';
  h.style.setProperty('--oran', String(oran));
  h.style.setProperty('--kal', '${kal}px');
  h.style.setProperty('--dis', '${disari}px');
  if (${yuva}) h.classList.add('yuvali');
  med.appendChild(h);
})()`;

const HALKA_CSS = `
  .rep-bar { display: none !important; }
  .rep-medal { position: relative; }
  .rep-halka {
    position: absolute; inset: calc(var(--dis) * -1); border-radius: 50%;
    background: conic-gradient(var(--ac) calc(var(--oran) * 360deg), var(--oyuk) 0);
    -webkit-mask: radial-gradient(circle closest-side, transparent calc(100% - var(--kal)), #000 calc(100% - var(--kal)));
    mask: radial-gradient(circle closest-side, transparent calc(100% - var(--kal)), #000 calc(100% - var(--kal)));
    pointer-events: none;
  }
  .rep-halka.yuvali { box-shadow: 0 0 0 2.5px var(--ot), inset 0 0 0 2.5px var(--ot); }
`;

/** ROZET ADAYLARI — sekizi de aynı kadrajda, aynı seviyede (%27 dolu). */
const ROZET = [
  { id: 'A', ad: 'bugunku (madalyon + altinda dar bar)', css: '', dom: null },
  { id: 'B', ad: 'ince halka (4 px), madalyonun disinda', css: HALKA_CSS, dom: HALKA_DOM(4, 5, false) },
  { id: 'C', ad: 'kalin halka (8 px), madalyonun disinda', css: HALKA_CSS, dom: HALKA_DOM(8, 7, false) },
  { id: 'D', ad: 'kalin halka + konturlu yuva (CoC kalibi)', css: HALKA_CSS, dom: HALKA_DOM(7, 7, true) },
  { id: 'E', ad: 'halka madalyonun KENARINA gomulu (dis cap buyumez)', css: HALKA_CSS, dom: HALKA_DOM(6, -2, false) },
  {
    id: 'F', ad: 'madalyon + SAGINDA yatay bar (tek satir, ayri kutu)',
    css: `.rep { flex-direction: row; align-items: center; gap: 6px; } .rep-bar { width: 78px; height: 14px; }`, dom: null,
  },
  {
    id: 'G', ad: 'KAPSUL: madalyon sola gomulu, bar kapsulun icinde (Clash Royale kalibi)',
    css: `
      .rep { flex-direction: row; align-items: center; gap: 0; }
      .rep-medal { z-index: 2; }
      .rep-bar {
        width: 112px; height: 22px; margin-left: -26px;
        border: 2.5px solid var(--ot); border-radius: var(--rr); background: var(--oyuk);
      }
      .rep-fill { inset: 2.5px auto 2.5px 2.5px; }
    `, dom: null,
  },
  {
    id: 'H', ad: 'halka + seviye sayisi buyutulmus, bar yazisi yok',
    css: HALKA_CSS + `.rep-num { font-size: calc(var(--p5) * 1.25); }`, dom: HALKA_DOM(7, 6, true),
  },
];

/** KESE ADAYLARI — altı çerçeve dili. */
const KESE = [
  { id: 'A', ad: 'bugunku: KUTUSUZ, okunabilirligi kontur tasiyor (D-106)', css: '' },
  {
    id: 'B', ad: 'hap: koyu dolgu + kontur (her para ayri hap)',
    css: `.cur { padding: 3px 12px 3px 4px; border: 2.5px solid var(--ot); border-radius: var(--rr); background: rgba(27,20,67,0.82); }`,
  },
  {
    id: 'C', ad: 'TEK kese: iki para birimi ayni cercevede, aralarinda ayirac',
    css: `
      .purse { border: 2.5px solid var(--ot); border-radius: 18px; background: rgba(27,20,67,0.82); padding: 4px 12px 5px 8px; gap: 2px; align-items: stretch; }
      .purse .cur + .cur { border-top: 1.5px solid rgba(255,255,255,0.12); padding-top: 3px; }
    `,
  },
  {
    id: 'D', ad: 'hap + ikon cercevenin DISINA tasiyor (Royale kalibi)',
    css: `
      .cur { padding: 3px 12px 3px 18px; border: 2.5px solid var(--ot); border-radius: var(--rr); background: rgba(27,20,67,0.88); }
      .cur > svg { margin-left: -30px; margin-right: 4px; }
    `,
  },
  {
    id: 'E', ad: 'cam: yalniz ince kontur, dolgu yok',
    css: `.cur { padding: 2px 10px 2px 4px; border: 2px solid rgba(16,11,46,0.75); border-radius: var(--rr); background: rgba(16,11,46,0.28); }`,
  },
  {
    id: 'F', ad: 'hap + kenari para birimine gore renkli (altin / buz)',
    css: `
      .cur { padding: 3px 12px 3px 4px; border: 2.5px solid var(--ot); border-radius: var(--rr); background: rgba(27,20,67,0.85); box-shadow: inset 0 0 0 2px var(--para); }
      .cur.gem { box-shadow: inset 0 0 0 2px #8fd8ff; }
    `,
  },
];

const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await sayfa.goto(adres(PORT), { waitUntil: 'networkidle', timeout: 40000 });
await sayfa.waitForSelector('canvas', { timeout: 20000 });
await sayfa.waitForFunction(() => typeof window.__game === 'function', { timeout: 20000 });
await sayfa.evaluate(() => window.__addMoney(5_000_000));
await sayfa.evaluate(() => window.__advanceTime(180));
await sayfa.waitForTimeout(900);
await sayfa.evaluate(() => window.__setState({ diamonds: 500, xp: 340 }));
// DEV düğmesi yalnız `npm run dev`de var ve tam çubuğun üstüne biniyor — karede olmamalı.
await sayfa.addStyleTag({ content: '.dsb-fab, .dsb { display: none !important; }' });
await sayfa.waitForTimeout(600);

async function aday(grup, liste, klip) {
  for (const a of liste) {
    await sayfa.evaluate((c) => {
      document.getElementById('aday')?.remove();
      if (!c) return;
      const s = document.createElement('style'); s.id = 'aday'; s.textContent = c;
      document.head.appendChild(s);
    }, a.css);
    if (a.dom) await sayfa.evaluate((kod) => { new Function(kod)(); }, a.dom);
    else await sayfa.evaluate(() => document.querySelector('.rep-halka')?.remove());
    await sayfa.waitForTimeout(420);
    await sayfa.screenshot({ path: path.join(SS, `r3-aday-${grup}-${a.id}.png`), clip: klip });
    console.log(`${grup} ${a.id} — ${a.ad}`);
  }
  await sayfa.evaluate(() => { document.getElementById('aday')?.remove(); document.querySelector('.rep-halka')?.remove(); });
  await sayfa.waitForTimeout(300);
}

await aday('rozet', ROZET, { x: 0, y: 0, width: 200, height: 110 });
await aday('kese', KESE, { x: 180, y: 0, width: 210, height: 110 });

await sayfa.close();
await tarayici.close();
sunucu.kill();
console.log(`rozet ${ROZET.length} aday · kese ${KESE.length} aday → docs/gorsel/ss/r3-aday-*.png`);
process.exit(0);
