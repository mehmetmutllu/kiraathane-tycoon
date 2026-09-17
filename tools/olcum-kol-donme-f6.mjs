/**
 * olcum-kol-donme-f6.mjs — F6 TUR 3 §M: DÖNDÜRME KUSURUNUN KOLLARI.
 *
 * KUSUR (§J2, tam koşu, 20 hücrenin 1'i):
 *   T1>T2  Karakter   disarida:0→1 · gorunurDugme:6→3 · gizliOdul:0→3
 * Yani **Karakter ekranı tablet portresinde AÇIKKEN yatay çevrilirse** üç ödül düğmesinin üçü
 * de gövdenin dışında kalıyor. Aynı ekran tablet yatayında DOĞRUDAN açılınca tertemiz (0/3).
 * Kusur duran karede yok, yalnız GEÇİŞTE var — bu yüzden D-131 onu göremezdi ve bu yüzden §J
 * yazıldı.
 *
 * MEKANİZMA (kod okunarak):
 *   .sheet-body  { flex: 1; min-height: 0; overflow-y: auto; }   ← kaydıran kap
 *   .char-card   { flex: 1 0 auto; }                             ← **shrink 0**
 *   .char-canvas { flex: 1 1 auto; min-height: 230px; }
 * Tablet portresinde (1280 px yüksek) kart gövdeyi doldurur, tuval büyür. Yatay çevrilince gövde
 * 738 px'e iner ama kartın **shrink'i 0** olduğu için kart o yüksekliği bırakmaz: küçülmesi
 * gereken yerde küçülmez, içerik gövdenin altından taşar. Taze açılışta kart en baştan 738'e
 * göre kurulduğu için sorun çıkmaz. **Kusur bir "yeniden hesaplama" eksiği değil, bir SHRINK
 * KİLİDİ.**
 *
 * DÖRT KOL — her biri mekanizmanın FARKLI bir halkasını hedefler; hangisinin gerçekten yettiği
 * ölçülecek (kod yazılmadan, CSS katmanı olarak gerçek oyunun üstüne uygulanır):
 *   R0  taban (bugün)
 *   RA  kart küçülebilsin      — `.char-card { flex: 1 1 auto }` (shrink kilidini açar)
 *   RB  tuvalin tabanı yüksekliğe bağlansın — `min-height: min(230px, 26vh)`
 *   RC  D-131 dalı tablet yatayını da kapsasın — eşik `max-height: 560px` → `900px`
 *
 * SONDA — kol TELEFONU bozuyor mu? Kusur tablette; düzeltmenin telefon yatayında ve portresinde
 * D-131'in kazandığı yeri geri vermemesi şart. Bu yüzden her kol P1>L1 ve L1>P1'de de koşuluyor,
 * Karakter'in yanında ikinci tanık olarak Hedefler'le.
 *
 * Koşu: node tools/olcum-kol-donme-f6.mjs   ·   OLCUM=kisa ile kol/çift sayısı kısılır
 * Çıktı: docs/gorsel/ss/f6-kol-*.png + stdout (ham: docs/olcum-kol-donme-f6.txt)
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.F6_PORT ?? '', 10) || 5219;
const KISA = (process.env.OLCUM ?? 'tam').toLowerCase() === 'kisa';
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

const PADS = (() => {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
})();

const KADRAJ = {
  P1: { id: 'P1', w: 412, h: 915, dpr: 2.625 },
  L1: { id: 'L1', w: 915, h: 412, dpr: 2.625 },
  T1: { id: 'T1', w: 800, h: 1280, dpr: 2 },
  T2: { id: 'T2', w: 1280, h: 800, dpr: 2 },
};

/** İlk çift KUSURUN kendisi; kalan üçü sonda (kol başka yeri bozuyor mu). */
const CIFTLER = [
  { id: 'T1>L2', a: 'T1', b: 'T2', ad: 'tablet P→Y  ← KUSUR BURADA' },
  { id: 'P1>L1', a: 'P1', b: 'L1', ad: 'telefon P→Y (sonda)' },
  { id: 'L1>P1', a: 'L1', b: 'P1', ad: 'telefon Y→P (sonda)' },
  { id: 'T2>T1', a: 'T2', b: 'T1', ad: 'tablet Y→P (sonda)' },
];

const PANELLER = [
  { id: 'char', ad: 'Karakter', tetik: '[data-testid="char"]', panel: '[data-testid="char-panel"]' },
  { id: 'goals', ad: 'Hedefler', tetik: '[data-testid="goals"]', panel: '[data-testid="goals-panel"]' },
];

/* RC, D-131'in kısa-yatay dalının GÖVDESİNİ aynen taşır; tartışma kuralların kendisinde değil
   (onlar onaylandı), eşiğin tablet yatayını kapsayıp kapsamadığında. */
const RAY_GOVDE = `
  .modal-card.screen { width: 100%; flex-direction: row; }
  .screen-top {
    flex-direction: column; align-items: flex-start; justify-content: flex-start;
    width: clamp(146px, 21vw, 200px); gap: 12px;
    padding: calc(var(--sat) + 12px) 12px 12px calc(var(--sal) + 14px);
    border-right: 3px solid var(--ot);
  }
  .screen-title { flex: none; white-space: normal; overflow: visible; font-size: var(--p4); line-height: 1.2; }
  .screen-purse { flex-direction: column; align-items: flex-start; gap: 3px; margin-top: auto; }
  .sheet-body {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px;
    align-content: start; padding: 12px 14px calc(var(--sab) + 12px);
  }
  .sheet-body > .sheet-pad, .sheet-body > .goals, .sheet-body > ul { display: contents; }
  .sheet-body > .sheet-sec, .sheet-body > .rep-hero, .sheet-body > .usta-strip,
  .sheet-body > .sheet-foot-note, .sheet-body > .qbig, .sheet-body > .char-head { grid-column: 1 / -1; }
  .sheet-body > .goal, .goals > .goal { margin: 0; }
  .char-canvas { min-height: 120px; }
  .char-card { max-height: 86vh; overflow-y: auto; }
`;

const KOLLAR = [
  { id: 'R0', ad: 'Taban (bugun)', css: '' },
  { id: 'RA', ad: 'Kart kuculebilsin (shrink)', css: `.char-card { flex: 1 1 auto; }` },
  { id: 'RB', ad: 'Tuval tabani yukseklige bagli', css: `.char-canvas { min-height: min(230px, 26vh); }` },
  { id: 'RC', ad: 'D-131 dali tableti de kapsasin', css: `@media (orientation: landscape) and (max-height: 900px) { ${RAY_GOVDE} }` },
];

const PANEL_OLC = (sec) => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const kabuk = document.querySelector(`${sec} .modal-card`);
  if (!kabuk) return { yok: true };
  const kr = kabuk.getBoundingClientRect();
  const govde = document.querySelector(`${sec} .sheet-body`) || document.querySelector(`${sec} .char-body`);
  const ust = document.querySelector(`${sec} .screen-top`);
  const ur = ust ? ust.getBoundingClientRect() : null;

  const akanlar = [];
  if (govde) for (const c of govde.children) {
    if (getComputedStyle(c).display === 'contents') akanlar.push(...c.children);
    else akanlar.push(c);
  }
  const gr = govde ? govde.getBoundingClientRect() : null;
  let disarida = 0;
  if (gr) for (const el of akanlar) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.bottom > gr.bottom + 1) disarida++;
  }

  const gorunurMu = (r) => r.top >= -1 && r.bottom <= vh + 1 && r.left >= -1 && r.right <= vw + 1;
  const dugmeler = [...document.querySelectorAll(`${sec} button`)].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && getComputedStyle(b).display !== 'none';
  });
  const govdeKutu = gr || { top: 0, bottom: vh };
  const icinde = (r) => r.top >= govdeKutu.top - 1 && r.bottom <= govdeKutu.bottom + 1;
  let gorunurDugme = 0;
  for (const b of dugmeler) { const r = b.getBoundingClientRect(); if (gorunurMu(r) && icinde(r)) gorunurDugme++; }
  const odul = dugmeler.filter((b) => /claim|buy|cta/i.test((b.getAttribute('data-testid') || '') + b.className));

  let kesilen = 0;
  for (const el of document.querySelectorAll(`${sec} *`)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (getComputedStyle(el).display === 'none') continue;
    if (r.left < -1 || r.right > vw + 1) kesilen++;
  }

  const kart = document.querySelector(`${sec} .char-card`);
  const tuval = document.querySelector(`${sec} .char-canvas`);
  return {
    kabukG: +kr.width.toFixed(0), kabukY: +kr.height.toFixed(0),
    duzen: ur ? (ur.height > ur.width ? 'ray' : 'serit') : null,
    govdeY: gr ? +gr.height.toFixed(0) : null,
    kartY: kart ? +kart.getBoundingClientRect().height.toFixed(0) : null,
    tuvalY: tuval ? +tuval.getBoundingClientRect().height.toFixed(0) : null,
    disarida, akan: akanlar.length,
    gorunurDugme, toplamDugme: dugmeler.length,
    gizliOdul: odul.filter((b) => !icinde(b.getBoundingClientRect())).length, odulToplam: odul.length,
    kesilen,
  };
};

const IMZA = () => { const g = window.__game(); return `t${g.tables}|s${Object.keys(g.stations ?? {}).length}|a${g.areasOpen ?? '?'}|n${g.npcCount}`; };

function sunucuKaldir() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, red) => {
    const z = setTimeout(() => red(new Error('sunucu hazir olmadi')), 60_000);
    s.stdout.on('data', (d) => { if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); } });
    s.on('exit', (k) => { clearTimeout(z); red(new Error(`sunucu ${k} koduyla kapandi`)); });
  });
}

async function oturumAc(tarayici, kadraj, kol, hatalar) {
  const baglam = await tarayici.newContext({
    viewport: { width: kadraj.w, height: kadraj.h }, deviceScaleFactor: kadraj.dpr,
    isMobile: true, hasTouch: true,
  });
  const s = await baglam.newPage();
  s.on('pageerror', (e) => hatalar.push(e.message));
  s.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
  await s.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
  await s.waitForTimeout(6000);
  await s.evaluate((pads) => {
    window.__setState({ padsDone: pads, padFills: {}, wallet: 1e9, diamonds: 1e6 });
    window.__zaman(1); window.__advanceTime(1);
  }, PADS);
  await s.waitForTimeout(1500);
  await s.evaluate(() => { window.__zaman(0); window.__teleport(0, 0); });
  await s.waitForTimeout(2200);
  if (kol.css) await s.addStyleTag({ content: kol.css });
  await s.waitForTimeout(600);
  return { baglam, sayfa: s };
}

async function panelAc(sayfa, p) {
  const t = sayfa.locator(p.tetik).first();
  if (!(await t.count())) return false;
  await t.click({ timeout: 4000 }).catch(() => {});
  await sayfa.waitForTimeout(900);
  return (await sayfa.locator(p.panel).count()) > 0;
}

async function main() {
  const t0 = Date.now();
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const kollar = KISA ? KOLLAR.slice(0, 2) : KOLLAR;
  const ciftler = KISA ? CIFTLER.slice(0, 1) : CIFTLER;
  const paneller = KISA ? PANELLER.slice(0, 1) : PANELLER;

  const sonuc = [];
  for (const kol of kollar) {
    for (const c of ciftler) {
      const A = KADRAJ[c.a], B = KADRAJ[c.b];
      for (const p of paneller) {
        const hatalar = [];
        // ① TAZE: doğrudan B'de aç (referans)
        const t = await oturumAc(tarayici, B, kol, hatalar);
        if (!(await panelAc(t.sayfa, p))) throw new Error(`taze ${B.id}/${p.ad} acilmadi`);
        const taze = await t.sayfa.evaluate(PANEL_OLC, p.panel);
        await t.baglam.close();

        // ② DÖNEREK: A'da aç, canlı çevir
        const d = await oturumAc(tarayici, A, kol, hatalar);
        if (!(await panelAc(d.sayfa, p))) throw new Error(`donerek ${A.id}/${p.ad} acilmadi`);
        await d.sayfa.setViewportSize({ width: B.w, height: B.h });
        await d.sayfa.waitForTimeout(1800);
        const donerek = await d.sayfa.evaluate(PANEL_OLC, p.panel);
        const imza = await d.sayfa.evaluate(IMZA);
        if (c.id === 'T1>L2' && p.id === 'char') {
          await d.sayfa.screenshot({ path: path.join(OUT, `f6-kol-${kol.id}-char.png`) });
        }
        await d.baglam.close();

        sonuc.push({ kol: kol.id, cift: c.id, ad: c.ad, panel: p.ad, taze, donerek, imza, hata: hatalar.length });
      }
      console.log(`  ${kol.id} / ${c.id} bitti`);
    }
  }

  await tarayici.close();
  sunucu.kill();

  const L = [];
  const yaz = (x = '') => { L.push(x); console.log(x); };
  yaz('');
  yaz('════════════════════════════════════════════════════════════════════════════════');
  yaz(`  F6 TUR 3 §M — DONDURME KUSURUNUN KOLLARI   (kip: ${KISA ? 'KISA' : 'TAM'})`);
  yaz('════════════════════════════════════════════════════════════════════════════════');

  for (const c of ciftler) {
    yaz('');
    yaz(`── ${c.id}   ${c.ad}`);
    yaz('');
    yaz('  kol  panel      yol      duzen  govdeY  kartY  tuvalY  disarida/akan  gorunur/toplam  GIZLI ODUL  kesilen');
    for (const r of sonuc.filter((x) => x.cift === c.id)) {
      for (const [yol, o] of [['taze', r.taze], ['donerek', r.donerek]]) {
        yaz(`  ${r.kol.padEnd(4)} ${r.panel.padEnd(10)} ${yol.padEnd(8)} ${String(o.duzen).padEnd(6)} ${String(o.govdeY).padStart(6)} ${String(o.kartY).padStart(6)} ${String(o.tuvalY).padStart(7)}  ${String(o.disarida + '/' + o.akan).padStart(13)}  ${String(o.gorunurDugme + '/' + o.toplamDugme).padStart(14)}  ${String(o.gizliOdul + '/' + o.odulToplam).padStart(10)}  ${String(o.kesilen).padStart(7)}`);
      }
    }
  }

  yaz('');
  yaz('── KOL ÖZETİ — taze ile dönerek EŞİT Mİ (kusur tam olarak bu esitsizlik)');
  yaz('');
  yaz('  kol  ad                              KUSUR HUCRESI (T1>T2 Karakter)          sonda ciftlerinde bozulma');
  const ALAN = ['duzen', 'govdeY', 'kartY', 'tuvalY', 'disarida', 'gorunurDugme', 'gizliOdul', 'kesilen'];
  const esitMi = (r) => ALAN.every((a) => JSON.stringify(r.taze[a]) === JSON.stringify(r.donerek[a]));
  for (const kol of kollar) {
    const kusur = sonuc.find((x) => x.kol === kol.id && x.cift === 'T1>L2' && x.panel === 'Karakter');
    const sondalar = sonuc.filter((x) => x.kol === kol.id && x.cift !== 'T1>L2');
    const bozuk = sondalar.filter((x) => !esitMi(x));
    const kd = kusur ? (esitMi(kusur) ? 'ESIT → KUSUR KAPANDI' : `ESIT DEGIL: ${ALAN.filter((a) => JSON.stringify(kusur.taze[a]) !== JSON.stringify(kusur.donerek[a])).map((a) => `${a} ${kusur.taze[a]}→${kusur.donerek[a]}`).join(' · ')}`) : '-';
    yaz(`  ${kol.id.padEnd(4)} ${kol.ad.padEnd(31)} ${kd}`);
    if (bozuk.length) for (const b of bozuk) yaz(`       ↳ SONDA BOZUK: ${b.cift} ${b.panel} → ${ALAN.filter((a) => JSON.stringify(b.taze[a]) !== JSON.stringify(b.donerek[a])).map((a) => `${a} ${b.taze[a]}→${b.donerek[a]}`).join(' · ')}`);
    else yaz(`       ↳ sonda ciftlerinin hepsi esit (telefon bozulmadi)`);
  }

  yaz('');
  yaz('OKUMA NOTU');
  yaz('  KUSUR = ayni kadrajda "taze acilis" ile "cevirerek varis" farkli sonuc veriyor.');
  yaz('  Kol basarili sayilir ANCAK: kusur hucresi ESIT olur VE sonda ciftleri bozulmaz.');
  yaz('  gorunur/toplam: geri dugmesi govdenin disinda, her hucrede sabit 1 eksik sayilir.');
  yaz('  CENTIK OLCULMEDI: Playwright safe-area taklit edemez.');
  yaz('');
  yaz(`  sure: ${((Date.now() - t0) / 1000).toFixed(0)} sn`);

  fs.writeFileSync(path.join(KOK, `docs/olcum-kol-donme-f6${KISA ? '-kisa' : ''}.txt`), L.join('\n'), 'utf8');
}

main().catch((e) => { console.error(e); process.exit(1); });
