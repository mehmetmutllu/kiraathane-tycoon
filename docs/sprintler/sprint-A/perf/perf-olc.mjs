// Sprint A ④ — önce/sonra ölçüm: sabit kadraj ekran görüntüleri + telefon öykünmesinde kare işi.
// Koşu: node perf-olc.mjs <shot|kare> <etiket>   (sunucu URL: PERF_URL, varsayılan :4100)
import { chromium } from 'file:///C:/xampp/htdocs/kiraathane/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const KOK = 'C:/xampp/htdocs/kiraathane';
const OUT = path.join(KOK, 'docs/sprintler/sprint-A/perf');
const URL = process.env.PERF_URL || 'http://localhost:4100/';
const [, , MOD = 'shot', ETIKET = 'once'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });

function padKimlikleri() {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
}
function gorevSayisi() {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const bas = s.indexOf('quests: [');
  const son = s.indexOf('] as readonly QuestDef[]', bas);
  return [...s.slice(bas, son).matchAll(/\{\s*id:\s*'([^']+)'/g)].length;
}
const PADS = padKimlikleri();
const GS = gorevSayisi();

const tohum = () => {
  let t = 0x9e3779b9;
  window.__tohumla = (n) => { t = (n ?? 0x9e3779b9) | 0; return t; };
  Math.random = () => {
    t |= 0; t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  try { localStorage.setItem('kiraathane-ogretici-atla', '1'); } catch {}
};

async function dunyaKur(sayfa, sn) {
  await sayfa.evaluate(async ({ pads, gs, sn }) => {
    window.__resetGame?.();
    window.__setState?.({ padsDone: pads, wallet: 1e12, diamonds: 1e6, questIndex: gs, ogreticiAtlandi: true, kafeAdi: 'Köşe Kıraathanesi' });
    const { tableSoftMaxLevel } = await import('/src/game/rules.ts');
    const n = window.__game?.().tables ?? 4;
    for (let i = 0; i < n; i++) window.__setTableLevel?.(i, tableSoftMaxLevel());
    const { useGame, stationSoftMaxLevel, totalCupPool } = await import('/src/game/store.ts');
    const s = useGame.getState();
    const ocak = s.stationLevels.map(() => stationSoftMaxLevel());
    useGame.setState({ stationLevels: ocak, cleanCups: totalCupPool(s.areasOpen, ocak) });
    window.__tohumla?.(12345);
    window.__advanceTime?.(sn);
    window.__park?.();
  }, { pads: PADS, gs: GS, sn });
}

async function seviyeKapat(p) {
  for (let i = 0; i < 20; i++) {
    const ok = await p.$('[data-testid="level-up-ok"]');
    if (!ok) return;
    await ok.click().catch(() => {});
    await p.waitForTimeout(80);
  }
}

const SADECE_TUVAL = `body * { visibility: hidden !important; } canvas { visibility: visible !important; }`;

if (MOD === 'shot') {
  const tarayici = await chromium.launch();
  const baglam = await tarayici.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, locale: 'tr-TR' });
  await baglam.addInitScript(tohum);
  const p = await baglam.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => hatalar.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
  await p.clock.install({ time: new Date('2026-01-01T00:00:00') });
  await p.clock.pauseAt(new Date('2026-01-01T00:00:01'));
  await p.goto(URL + '?f2golge=2048&f2ad=perf', { waitUntil: 'load', timeout: 90000 });
  // Yükleme: sahte saat duruyor; ağ gerçek zamanda biter, kareler sabit dilimlerle ilerler.
  for (let i = 0; i < 80; i++) {
    await p.waitForLoadState('networkidle').catch(() => {});
    await p.clock.runFor(250);
    const hazir = await p.evaluate(() => !!window.__three?.gl && typeof window.__game === 'function').catch(() => false);
    if (hazir && i > 30) break;
  }
  await dunyaKur(p, 90);
  for (let i = 0; i < 12; i++) {
    await p.waitForLoadState('networkidle').catch(() => {});
    await p.clock.runFor(250);
  }
  await seviyeKapat(p);
  // Simülasyon donar (NPC konumu sabit), kamera park edilmiş oyuncuya oturur.
  await p.evaluate(async () => { const m = await import('/src/game/devSandbox.ts'); m.useSandbox.setState({ timeScale: 0 }); });
  await p.addStyleTag({ content: SADECE_TUVAL });
  await p.clock.runFor(10000);
  await p.screenshot({ path: path.join(OUT, `sahne-${ETIKET}.png`) });
  // İkinci kadraj: salonun ortası — kenarda yarım görünen müşteriler kırpma sınırını sınar.
  await p.evaluate(async () => { const { useGame } = await import('/src/game/store.ts'); useGame.setState({ player: [1, 0.6, -5] }); });
  await p.clock.runFor(10000);
  await p.screenshot({ path: path.join(OUT, `sahne2-${ETIKET}.png`) });
  await p.addStyleTag({ content: 'body * { visibility: visible !important; }' });

  // Önizlemeler: mağaza → masa teması · zemin · duvar; dekor yalıtık (salonu kapalı semaver).
  await seviyeKapat(p);
  await p.click('[data-testid="shop"]');
  const onizle = async (sekme, ad, once) => {
    await p.click(`[data-testid="shop-tab-${sekme}"]`);
    if (once) await once();
    for (let i = 0; i < 8; i++) { await p.waitForLoadState('networkidle').catch(() => {}); await p.clock.runFor(250); }
    const el = await p.$('.shop-preview .preview-canvas');
    if (el) await el.screenshot({ path: path.join(OUT, `onizleme-${ad}-${ETIKET}.png`) });
    else hatalar.push('onizleme yok: ' + ad);
  };
  await onizle('table', 'masa', async () => { const c = await p.$$('[data-testid^="shop-card-table-"]'); if (c[1]) await c[1].click(); });
  console.log(await p.evaluate(() => [...document.querySelectorAll('[data-testid]')].map(e => e.dataset.testid).filter(t => /shop|panel|level|modal/.test(t)).join(',')));
  await onizle('floor', 'zemin');
  await onizle('wall', 'duvar');
  await p.evaluate(() => window.__setState({ padsDone: [] }));
  await onizle('decor', 'dekor', async () => { await p.click('[data-testid="shop-card-decor-semaver"]'); });
  console.log(JSON.stringify({ hatalar: hatalar.slice(0, 8) }));
  await tarayici.close();
} else if (MOD === 'kare') {
  // Gerçek GPU (RTX 3060, D3D11) + CPU 4× kısma — T9a'nın telefon öykünmesiyle aynı aile.
  const tarayici = await chromium.launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'] });
  const baglam = await tarayici.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, locale: 'tr-TR' });
  await baglam.addInitScript(tohum);
  const p = await baglam.newPage();
  const cdp = await baglam.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(URL + '?f2golge=2048&f2ad=perf', { waitUntil: 'load', timeout: 90000 });
  await p.waitForFunction(() => !!window.__three?.gl && typeof window.__game === 'function', null, { timeout: 90000 });
  await p.waitForTimeout(6000);
  await dunyaKur(p, 120);
  await p.waitForTimeout(4000);
  await seviyeKapat(p);
  const ornek = (ms) => p.evaluate((ms) => new Promise((coz) => {
    const is = [], cagri = [];
    const k0 = window.__kareSayaci ?? 0, s0 = window.__sahneKaresi ?? -1;
    const bas = performance.now();
    requestAnimationFrame(function d() {
      const pf = window.__perf?.();
      if (pf) { is.push(pf.isMs); cagri.push(pf.calls); }
      if (performance.now() - bas < ms) requestAnimationFrame(d);
      else coz({ is, cagri, kare: (window.__kareSayaci ?? 0) - k0, sahne: (window.__sahneKaresi ?? -1) - s0, sn: (performance.now() - bas) / 1000, npc: window.__game().npcCount, musteri: window.__musteriCizim });
    });
  }), ms);
  const ortanca = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
  const ozet = (r) => ({ isP50: +ortanca(r.is).toFixed(2), isOrt: +(r.is.reduce((a, b) => a + b, 0) / Math.max(1, r.is.length)).toFixed(2), cagri: ortanca(r.cagri), karePerSn: +(r.kare / r.sn).toFixed(1), sahnePerSn: +(r.sahne / r.sn).toFixed(1), npc: r.npc, musteri: r.musteri });
  const sonuc = { etiket: ETIKET, oyun: [], panel: [], kapandi: null };
  for (let i = 0; i < 3; i++) sonuc.oyun.push(ozet(await ornek(6000)));
  await p.click('[data-testid="shop"]');
  await p.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) sonuc.panel.push(ozet(await ornek(6000)));
  await p.click('.sheet-back');
  await p.waitForTimeout(1000);
  sonuc.kapandi = ozet(await ornek(4000));
  const yol = path.join(OUT, `kare-${ETIKET}.json`);
  fs.writeFileSync(yol, JSON.stringify(sonuc, null, 1));
  console.log(JSON.stringify(sonuc));
  await tarayici.close();
}
