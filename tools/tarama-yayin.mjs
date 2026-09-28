/**
 * tarama-yayin.mjs — YAYIN ÖNCESİ TAM TARAMA (sprint "yayın"). Rapor: docs/tarama-raporu-sprint-yayin.md
 *
 * Tur tipi TARAMA: oyun koduna dokunmaz, yalnız tarayıcıda sürer ve ölçer. Tekrar koşulabilir.
 *
 * Kullanım:
 *   node tools/tarama-yayin.mjs                     (tüm fazlar, sunucuyu kendi açar — port 5305)
 *   TARAMA_FAZ=hat,kayit node tools/tarama-yayin.mjs
 *   TARAMA_URL=http://localhost:5305/ node ...      (açık sunucuya bağlan, kendin açma)
 *   TARAMA_HAT_SN=21600                             (hat fazının sim-saniye tavanı, vars. 6 sa)
 *
 * Fazlar:
 *   hat   — taze kayıt → T9b botu (tools/tarama-botu-t9b.txt) görev hattını SONUNA kadar yürütür.
 *           15 dk (sim) görev ilerlemezse TAKILMA yazılır ve görev `__setQuest` ile atlatılır (taramanın
 *           devamı için; atlama bulgudur). Her dilimde para/elmas sonlu+negatif-değil denetimi, konsol
 *           hataları, reklam durumu. Sonunda gerçek geç-oyun kaydı `gec-kayit.json` olarak yazılır.
 *   kayit — kaydet-yenile-devam · soğuk çevrimdışı (3 sa) · sıcak dönüş (arka plan 3 sa) · saat geri alma ·
 *           bozuk JSON · daha yeni sürüm · v33/v32/v31 göçü (geç kayıttan türetilir).
 *   ui    — 4 görüntü alanı × (taze · geç) × her ekran/sekme: taşma, kesik metin, örtülen dokunma hedefi,
 *           < 44 px hedef, < 11 px yazı, güvenli alan bandı (CDP safe-area öykünmesi varsa gerçek inset).
 *   reklam— geçişli reklam kuralı canlı: düz kapanış (kontrol) · 💎 satın alma ödülü · çevrimdışı ödülü ·
 *           ödüllü video sonrası 15 sn · seviye ödülü → ardından panel kapanışında geçişli sayacı.
 *   perf  — CPU 4× kısma: taze + geç oyunda 8 sn kare süresi (p50/p95/p99), JS yığını, ilk yükleme.
 *   Her fazda: dış alan adına giden istekler (ağ) + konsol hata/uyarıları.
 *
 * Çıktı: docs/kareler/tarama-yayin/*.jpg + sonuc-<faz>.json
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(KOK, 'docs', 'kareler', 'tarama-yayin');
fs.mkdirSync(OUT, { recursive: true });
const PORT = 5305;
const URL = process.env.TARAMA_URL || `http://localhost:${PORT}/`;
const FAZLAR = (process.env.TARAMA_FAZ || 'hat,kayit,reklam,ui,perf').split(',');
const HAT_SN = Number(process.env.TARAMA_HAT_SN || 21600);
// T9b botu + tek düzeltme: hedefin TAM üstündeyken (dd = 0) yön 0/0 = NaN çıkıyor ve oyuncu konumu
// NaN'a gidiyordu (kamera boşluğa bakar, ekran kararır). Bot kusuru; oyunun girdi kelepçesi yok (bkz. rapor).
const BOT = fs.readFileSync(path.join(KOK, 'tools', 'tarama-botu-t9b.txt'), 'utf8')
  .replace('if (dd < 2.6) {', 'if (dd < 0.02) return [0, 0, false]; if (dd < 2.6) {');
const GEC_KAYIT = path.join(OUT, 'gec-kayit.json');
const AD = 'Tarama Kahvesi';

let sunucu = null;
if (!process.env.TARAMA_URL) {
  sunucu = spawn(process.execPath, [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--config', path.join(KOK, 'tools', 'tarama-vite.config.mjs'), '--port', String(PORT), '--strictPort'], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  sunucu.stdout.on('data', () => {});
  sunucu.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(URL)).ok) break; } catch { /* henüz yok */ }
    await new Promise((r) => setTimeout(r, 500));
  }
}

const tarayici = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
const disIstek = new Map(); // host → { adet, ornek }

/** Yeni bağlam + sayfa; konsol ve ağ dinleyicileri takılı. */
async function yeniSayfa({ w = 390, h = 844, dsf = 2, mobil = true, depo = null } = {}) {
  const baglam = await tarayici.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, isMobile: mobil, hasTouch: mobil, storageState: depo ?? undefined });
  const sayfa = await baglam.newPage();
  const konsol = [];
  sayfa.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') konsol.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  sayfa.on('pageerror', (e) => konsol.push(`pageerror: ${String(e.message).slice(0, 300)}`));
  sayfa.on('response', (r) => { if (r.status() >= 400) konsol.push(`http ${r.status()}: ${r.url().slice(0, 200)}`); });
  sayfa.on('request', (r) => {
    const u = new globalThis.URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http')) {
      const k = disIstek.get(u.hostname) ?? { adet: 0, ornek: r.url() };
      k.adet++;
      disIstek.set(u.hostname, k);
    }
  });
  return { baglam, sayfa, konsol };
}

/** Sayfayı aç; taze oyunsa kafe adını gir. */
async function ac(sayfa, { ad = true } = {}) {
  await sayfa.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sayfa.waitForSelector('canvas', { timeout: 90000 });
  await sayfa.waitForFunction(() => typeof window.__game === 'function', null, { timeout: 60000 });
  if (ad) {
    const kutu = await sayfa.waitForSelector('[data-testid="kafe-adi"]', { timeout: 4000 }).catch(() => null);
    if (kutu) { await sayfa.fill('[data-testid="kafe-adi-girdi"]', AD); await sayfa.click('[data-testid="kafe-adi-tamam"]'); }
  }
  await sayfa.waitForTimeout(1500);
}

const kare = async (sayfa, ad, tam = false) => {
  const p = path.join(OUT, `${ad}.jpg`);
  await sayfa.screenshot({ path: p, type: 'jpeg', quality: 70, fullPage: tam });
  return path.relative(KOK, p).replaceAll('\\', '/');
};
const yaz = (ad, veri) => fs.writeFileSync(path.join(OUT, `sonuc-${ad}.json`), JSON.stringify(veri, null, 2));
const durum = (sayfa) => sayfa.evaluate(() => {
  const g = window.__game();
  return { wallet: g.wallet, diamonds: g.diamonds, lifetime: g.lifetime, questIndex: g.questIndex, quest: g.quest, padsDone: g.padsDone, tables: g.tables, tableLevels: g.tableLevels, stationLevel: g.stationLevel, level: g.level?.level, xp: g.xp, goalsClaimed: g.goalsClaimed, mastersOwned: g.mastersOwned, offlineEarned: g.offlineEarned, kafeAdi: g.kafeAdi, charUpgrades: g.charUpgrades, waiterUpgrades: g.waiterUpgrades };
});

// ─────────────────────────────── FAZ: HAT ───────────────────────────────
async function fazHat() {
  const { baglam, sayfa, konsol } = await yeniSayfa();
  await ac(sayfa);
  const toplam = await sayfa.evaluate(async () => (await import('/src/config/economy.config.ts')).economyConfig.quests.map((q) => q.id));
  await sayfa.evaluate(`(${BOT})()`);
  const kayit = { toplamGorev: toplam.length, dilimler: [], takilmalar: [], sayiHatasi: [], reklam: [], kareler: [] };
  let sonIdx = -1, sonIlerlemeT = 0, t = 0, sonKare = -10;
  const DILIM = 120;
  while (t < HAT_SN) {
    const r = await sayfa.evaluate((sn) => { try { return window.__bot.run(sn, { stuck: 900 }); } catch (e) { return { hata: String(e && e.stack || e) }; } }, DILIM);
    t += DILIM;
    if (r.hata) { kayit.sayiHatasi.push({ t, botHatasi: r.hata }); break; }
    const s = await sayfa.evaluate(() => {
      const st = window.__game();
      const ads = window.__ads ? window.__ads.durum() : null;
      const cv = document.querySelector('canvas');
      const gl = cv && (cv.getContext('webgl2') || cv.getContext('webgl'));
      return { glKayip: gl ? gl.isContextLost() : 'yok', st: { wallet: st.wallet, diamonds: st.diamonds, lifetime: st.lifetime, xp: st.xp, level: st.level?.level, questIndex: st.questIndex, quest: st.quest, notice: st.notice }, ads };
    });
    for (const [k, v] of Object.entries({ wallet: s.st.wallet, diamonds: s.st.diamonds, lifetime: s.st.lifetime, xp: s.st.xp })) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) kayit.sayiHatasi.push({ t, alan: k, deger: v });
    }
    // DOM'daki para metinlerinde NaN/Infinity/undefined
    const domSayi = await sayfa.evaluate(() => {
      const txt = document.getElementById('root')?.innerText ?? '';
      return (txt.match(/NaN|Infinity|undefined|null|\[object/g) || []).slice(0, 5);
    });
    if (domSayi.length) kayit.sayiHatasi.push({ t, dom: domSayi });
    kayit.dilimler.push({ t, questIndex: s.st.questIndex, quest: s.st.quest?.id, wallet: Math.round(s.st.wallet), diamonds: s.st.diamonds, level: s.st.level, glKayip: s.glKayip, konsol: konsol.length });
    if (s.glKayip === true && !kayit.glKayipT) { kayit.glKayipT = t; kayit.glKayipKonsol = konsol.slice(-10); }
    if (s.ads) kayit.reklam.push({ t, ...s.ads });
    if (s.st.questIndex !== sonIdx) { sonIdx = s.st.questIndex; sonIlerlemeT = t; }
    if (s.st.questIndex >= toplam.length || s.st.quest == null) break;
    if (s.st.questIndex - sonKare >= 8) {
      sonKare = s.st.questIndex;
      kayit.kareler.push(await kare(sayfa, `hat-${String(s.st.questIndex).padStart(2, '0')}-${s.st.quest?.id}`));
    }
    if (t - sonIlerlemeT >= Number(process.env.TARAMA_TAKILMA_SN || 900)) {
      const d = await sayfa.evaluate(() => { const g = window.__game(); return { quest: g.quest, wallet: g.wallet, padCost: g.padCost, currentPad: g.currentPad, padFill: g.padFill, activeSpot: g.activeSpot, tableLevels: g.tableLevels, stationLevel: g.stationLevel, why: window.__bot.lastDecision, log: window.__bot.events.slice(-5) }; });
      kayit.takilmalar.push({ t, idx: s.st.questIndex, ...d, kare: await kare(sayfa, `takilma-${s.st.quest?.id}`) });
      // Pad görevinde botun kuralı "cüzdan ≥ tam fiyat" (kalan değil) → para verilir, hat bozulmaz.
      // Pad dışı görevde `__setQuest` ile atlanır (atlama pad zincirini BOZMAZ — pad görevi atlanmaz).
      if (d.currentPad) {
        await sayfa.evaluate((n) => window.__addMoney(n), Math.max(0, d.padCost - d.wallet) + 50);
        kayit.takilmalar[kayit.takilmalar.length - 1].cozum = 'para-verildi';
      } else {
        const sonraki = toplam[s.st.questIndex + 1];
        if (!sonraki) break;
        await sayfa.evaluate((id) => window.__setQuest(id), sonraki);
        kayit.takilmalar[kayit.takilmalar.length - 1].cozum = 'atlandi';
      }
      sonIlerlemeT = t;
    }
  }
  const son = await durum(sayfa);
  kayit.son = { t, ...son };
  kayit.qTimes = await sayfa.evaluate(() => window.__bot.qTimes);
  kayit.botOlay = await sayfa.evaluate(() => window.__bot.events.filter((e) => e.ev !== 'levelUp').slice(-40));
  kayit.okSapma = await sayfa.evaluate(() => window.__bot.okSapma ?? []);
  kayit.kareler.push(await kare(sayfa, 'hat-son'));
  // Hat sonu yönlendirme: bant ne diyor?
  kayit.hatSonuBant = await sayfa.evaluate(() => document.querySelector('.band')?.innerText ?? null);
  // Hedefler + Usta: toplanabilir hedefleri topla, Usta alınabilir mi
  kayit.hedefler = await sayfa.evaluate(async () => {
    const S = await import('/src/game/store.ts');
    const s = S.useGame.getState();
    const G = await import('/src/game/goals.ts');
    const vs = (G.goalViews ?? G.goalsView ?? (() => null));
    let liste = null;
    try { liste = vs(s); } catch { liste = null; }
    return { claimed: s.goalsClaimed, masters: s.mastersOwned, diamonds: s.diamonds.toNumber(), goalsExport: Object.keys(G), liste };
  });
  await sayfa.waitForTimeout(2500); // periyodik kayıt
  await sayfa.evaluate(() => window.__game && window.__setState({}));
  const depo = await baglam.storageState();
  fs.writeFileSync(GEC_KAYIT, JSON.stringify(depo));
  kayit.konsol = [...new Set(konsol)];
  kayit.konsolAdet = konsol.length;
  await baglam.close();
  yaz('hat', kayit);
  console.log(`hat: ${son.questIndex}/${toplam.length} · ${t} sn · takılma ${kayit.takilmalar.length} · sayı hatası ${kayit.sayiHatasi.length} · konsol ${konsol.length}`);
}

// ─────────────────────────────── FAZ: KAYIT ───────────────────────────────
const KEY = 'kiraathane.save';
async function fazKayit() {
  const sonuc = {};
  const depo = fs.existsSync(GEC_KAYIT) ? JSON.parse(fs.readFileSync(GEC_KAYIT, 'utf8')) : null;
  const { baglam, sayfa, konsol } = await yeniSayfa({ depo });
  await ac(sayfa, { ad: !depo });
  const once = await durum(sayfa);
  await sayfa.evaluate(() => window.__advanceTime(20));
  await sayfa.waitForTimeout(2500);
  const kaydedilen = await durum(sayfa);
  await sayfa.reload({ waitUntil: 'domcontentloaded' });
  await ac(sayfa, { ad: false });
  const sonra = await durum(sayfa);
  const fark = {};
  for (const k of ['questIndex', 'padsDone', 'tables', 'tableLevels', 'stationLevel', 'goalsClaimed', 'mastersOwned', 'kafeAdi', 'charUpgrades', 'waiterUpgrades', 'level']) {
    if (JSON.stringify(kaydedilen[k]) !== JSON.stringify(sonra[k])) fark[k] = { once: kaydedilen[k], sonra: sonra[k] };
  }
  const cuzdanFark = sonra.wallet - kaydedilen.wallet;
  sonuc.yenile = { fark, cuzdanOnce: kaydedilen.wallet, cuzdanSonra: sonra.wallet, cuzdanFark, kafeAdi: sonra.kafeAdi, baslangicQuest: once.questIndex };

  // Soğuk çevrimdışı 3 sa
  const hamKayit = await sayfa.evaluate((k) => localStorage.getItem(k), KEY);
  const kayitObj = JSON.parse(hamKayit);
  const soguk = async (etiket, degis) => {
    const o = structuredClone(kayitObj);
    degis(o);
    await sayfa.evaluate(([k, v]) => { localStorage.setItem(k, v); }, [KEY, JSON.stringify(o)]);
    // Sayfanın kapanırken kaydetmesi göç denemesini ezmesin: yazmayı dondur, sonra yenile.
    await sayfa.evaluate(([k, v]) => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (a, b) { if (a === k) return; return set.call(this, a, b); }; localStorage.setItem.__v = v; }, [KEY, JSON.stringify(o)]);
    const n0 = konsol.length;
    await sayfa.reload({ waitUntil: 'domcontentloaded' });
    await ac(sayfa, { ad: false });
    const d = await durum(sayfa);
    const ekran = await sayfa.$('[data-testid="offline"]');
    const r = { questIndex: d.questIndex, padsDone: d.padsDone.length, wallet: Math.round(d.wallet), offlineEarned: d.offlineEarned, offlineEkrani: !!ekran, yeniKonsol: konsol.slice(n0), kare: await kare(sayfa, `kayit-${etiket}`) };
    const yazilan = await sayfa.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return 'BOZUK'; } }, KEY);
    r.diskteSurum = yazilan && yazilan.saveVersion;
    return r;
  };
  sonuc.cevrimdisi3sa = await soguk('cevrimdisi-3sa', (o) => { o.lastSaved = Date.now() - 3 * 3600e3; });
  sonuc.saatGeri = await soguk('saat-geri', (o) => { o.lastSaved = Date.now() + 5 * 3600e3; });
  sonuc.yeniSurum = await soguk('yeni-surum', (o) => { o.saveVersion = o.saveVersion + 5; });
  sonuc.gocV33 = await soguk('goc-v33', (o) => { o.saveVersion = 33; o.waiterUpgrades = { ...(o.waiterUpgrades || {}), tray: (o.waiterUpgrades?.tray ?? 0) + 1 }; });
  sonuc.gocV32 = await soguk('goc-v32', (o) => { o.saveVersion = 32; delete o.kitchenTheme; });
  sonuc.gocV31 = await soguk('goc-v31', (o) => { o.saveVersion = 31; o.questIndex = 20; delete o.questsDone; });
  sonuc.eksikAlan = await soguk('eksik-alan', (o) => { delete o.stats; o.padsDone = null; o.settings = {}; o.wallet = 'abc'; });
  sonuc.oyuncuNull = await soguk('oyuncu-null', (o) => { if (o.player) o.player = [null, 0.6, null]; o.stationLevels = [null]; });
  sonuc.cokEski = await soguk('cok-eski-v20', (o) => { o.saveVersion = 20; });
  // Bozuk JSON
  await sayfa.evaluate((k) => { localStorage.setItem(k, '{bozuk'); }, KEY).catch(() => {});
  const n0 = konsol.length;
  await sayfa.reload({ waitUntil: 'domcontentloaded' });
  await ac(sayfa, { ad: false });
  sonuc.bozukJson = { durum: await durum(sayfa), kafeAdiKutusu: !!(await sayfa.$('[data-testid="kafe-adi"]')), yeniKonsol: konsol.slice(n0), kare: await kare(sayfa, 'kayit-bozuk-json') };
  await baglam.close();

  // Sıcak dönüş: arka plan → 3 sa → ön plan (yeniden yüklemeden)
  {
    const { baglam, sayfa, konsol } = await yeniSayfa({ depo });
    await ac(sayfa, { ad: !depo });
    const once = await durum(sayfa);
    const r = await sayfa.evaluate(async () => {
      const setGizli = (v) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => v }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); };
      setGizli(true);
      const gercek = Date.now;
      const kay = 3 * 3600e3;
      Date.now = () => gercek() + kay;
      const po = performance.now.bind(performance);
      performance.now = () => po() + kay;
      setGizli(false);
      await new Promise((r) => setTimeout(r, 800));
      const g = window.__game();
      return { offlineEarned: g.offlineEarned, wallet: g.wallet };
    });
    await sayfa.waitForTimeout(800);
    sonuc.sicakDonus = { cuzdanOnce: Math.round(once.wallet), ...r, ekran: !!(await sayfa.$('[data-testid="offline"]')), kare: await kare(sayfa, 'kayit-sicak-donus'), konsol: konsol.slice() };
    await baglam.close();
  }
  sonuc.konsol = [...new Set(konsol)];
  yaz('kayit', sonuc);
  console.log('kayit:', JSON.stringify({ yenile: sonuc.yenile.fark, c3: sonuc.cevrimdisi3sa.offlineEarned, sicak: sonuc.sicakDonus.offlineEarned }));
}

// ─────────────────────────────── FAZ: UI ───────────────────────────────
const GORUNUMLER = [
  { ad: 'tel390', w: 390, h: 844, dsf: 2, mobil: true, inset: { top: 47, bottom: 34, left: 0, right: 0 } },
  { ad: 'tel375', w: 375, h: 667, dsf: 2, mobil: true, inset: { top: 20, bottom: 0, left: 0, right: 0 } },
  { ad: 'ipad-dikey', w: 1024, h: 1366, dsf: 1, mobil: true, inset: { top: 24, bottom: 20, left: 0, right: 0 } },
  { ad: 'ipad-yatay', w: 1366, h: 1024, dsf: 1, mobil: true, inset: { top: 24, bottom: 20, left: 0, right: 0 } },
];

/** Sayfa içi denetim: görünen öğelerde taşma/kesik/küçük hedef/örtülme/küçük yazı/güvenli alan. */
function denetle(inset) {
  const vw = innerWidth, vh = innerHeight;
  const out = { sayfaKaydirma: document.documentElement.scrollWidth > vw + 1, tasma: [], kesik: [], kucukHedef: [], ortulen: [], kucukYazi: [], guvenliAlan: [] };
  const gorunur = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  const ad = (el) => {
    const t = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const c = typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName.toLowerCase();
    return `${el.dataset.testid ? '#' + el.dataset.testid + ' ' : ''}.${c} "${t}"`;
  };
  const kaydirmaAtasi = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX)) return p; } return null; };
  const atadanGizli = (el) => { for (let p = el.parentElement; p && p.id !== 'root'; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.opacity === '0' || cs.visibility === 'hidden') return true; } return false; };
  const els = [...document.querySelectorAll('#root *')].filter((e) => !(e instanceof SVGElement) && e.tagName !== 'CANVAS' && gorunur(e) && !atadanGizli(e));
  const r2 = (r) => [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const yaprakMetin = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const etkilesimli = el.matches('button, a, input, select, [role=button], [role=tab], [role=switch]') || (cs.cursor === 'pointer' && !el.parentElement?.closest('button, a, [role=button]'));
    if ((yaprakMetin || etkilesimli) && (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1)) {
      const ata = kaydirmaAtasi(el);
      if (!ata) out.tasma.push({ el: ad(el), rect: r2(r) });
    }
    if (yaprakMetin && cs.overflow !== 'visible' && (el.scrollWidth > el.clientWidth + 1 || (cs.whiteSpace !== 'nowrap' && el.scrollHeight > el.clientHeight + 2 && cs.overflowY === 'hidden'))) out.kesik.push({ el: ad(el), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
    if (yaprakMetin && cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth) out.kesik.push({ el: ad(el), ellipsis: true });
    if (yaprakMetin && parseFloat(cs.fontSize) < 11) out.kucukYazi.push({ el: ad(el), px: parseFloat(cs.fontSize) });
    if (etkilesimli) {
      if (!el.disabled && (r.width < 44 || r.height < 44)) out.kucukHedef.push({ el: ad(el), w: Math.round(r.width), h: Math.round(r.height) });
      const cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(vh - 1, Math.max(0, r.top + r.height / 2));
      const ust = document.elementFromPoint(cx, cy);
      if (ust && ust !== el && !el.contains(ust) && !ust.contains(el)) {
        const perde = ust.closest('.modal-backdrop, .spotlight-backdrop, .screen-backdrop');
        if (!(perde && !el.closest('.modal-backdrop, .screen-backdrop'))) out.ortulen.push({ el: ad(el), ustunde: ad(ust) });
      }
      if (inset && (r.top < inset.top || r.bottom > vh - inset.bottom || r.left < inset.left || r.right > vw - inset.right)) out.guvenliAlan.push({ el: ad(el), rect: r2(r) });
    } else if (yaprakMetin && inset && (r.top < inset.top || r.bottom > vh - inset.bottom)) out.guvenliAlan.push({ el: ad(el), rect: r2(r), metin: true });
  }
  const tekil = (a) => { const s = new Set(); return a.filter((x) => { const k = JSON.stringify(x); if (s.has(k)) return false; s.add(k); return true; }); };
  for (const k of Object.keys(out)) if (Array.isArray(out[k])) out[k] = tekil(out[k]);
  return out;
}

async function gecDurumKur(sayfa) {
  const PADS = 'table2 table3 waiter table4 waiter2 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(' ');
  await sayfa.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {}, stationLevels: [6], tableLevels: new Array(24).fill(4), diamonds: 320, wallet: 2.5e7, lifetime: 9e7, xp: 90000 }), PADS);
  await sayfa.waitForTimeout(2000);
}

async function fazUi() {
  const sonuc = {};
  const depoGec = fs.existsSync(GEC_KAYIT) ? JSON.parse(fs.readFileSync(GEC_KAYIT, 'utf8')) : null;
  for (const g of GORUNUMLER) {
    for (const asama of ['taze', 'gec']) {
      const { baglam, sayfa, konsol } = await yeniSayfa({ w: g.w, h: g.h, dsf: g.dsf, mobil: g.mobil, depo: asama === 'gec' ? depoGec : null });
      let insetGercek = false;
      try {
        const cdp = await baglam.newCDPSession(sayfa);
        await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: g.inset.top, bottom: g.inset.bottom, left: g.inset.left, right: g.inset.right } });
        insetGercek = true;
      } catch { /* bu Chromium'da yok → yalnız bant denetimi */ }
      const anahtar = `${g.ad}-${asama}`;
      const r = { insetGercek, ekranlar: {} };
      await sayfa.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await sayfa.waitForSelector('canvas', { timeout: 90000 });
      await sayfa.waitForFunction(() => typeof window.__game === 'function', null, { timeout: 60000 });
      if (asama === 'taze') {
        const kutu = await sayfa.waitForSelector('[data-testid="kafe-adi"]', { timeout: 5000 }).catch(() => null);
        if (kutu) {
          await sayfa.waitForTimeout(800);
          r.ekranlar['kafe-adi'] = { ...(await sayfa.evaluate(denetle, g.inset)), kare: await kare(sayfa, `${anahtar}-kafe-adi`) };
          await sayfa.fill('[data-testid="kafe-adi-girdi"]', AD);
          await sayfa.click('[data-testid="kafe-adi-tamam"]');
        }
      } else if (!depoGec) {
        await sayfa.evaluate((ad) => window.__setState({ kafeAdi: ad }), AD);
        await gecDurumKur(sayfa);
      }
      await sayfa.waitForTimeout(2500);
      const kapatSeviye = async () => { for (let i = 0; i < 10; i++) { const b = await sayfa.$('[data-testid="level-up-ok"], [data-testid="offline-ok"]'); if (!b) break; await b.click().catch(() => {}); await sayfa.waitForTimeout(300); } };
      await kapatSeviye();
      const olc = async (ekran) => { await sayfa.waitForTimeout(700); r.ekranlar[ekran] = { ...(await sayfa.evaluate(denetle, g.inset)), kare: await kare(sayfa, `${anahtar}-${ekran}`) }; };
      const tikla = async (sel) => { await kapatSeviye(); const e = await sayfa.$(sel); if (!e) return false; await e.click({ timeout: 3000 }).catch(() => {}); return true; };
      const geri = async () => { const b = await sayfa.$('.sheet-back'); if (b) await b.click().catch(() => {}); else await sayfa.keyboard.press('Escape'); await sayfa.waitForTimeout(500); };
      await olc('hud');
      if (await tikla('[data-testid="quests"]')) { await olc('gorevler'); await geri(); }
      if (await tikla('[data-testid="goals"]')) { await olc('hedefler'); await geri(); }
      if (await tikla('[data-testid="shop"]')) {
        await sayfa.waitForTimeout(800);
        const sekmeler = await sayfa.$$eval('[data-testid^="shop-tab-"]', (a) => a.map((e) => e.dataset.testid));
        for (const s of sekmeler) { await tikla(`[data-testid="${s}"]`); await olc(`magaza-${s.replace('shop-tab-', '')}`); }
        await geri();
      }
      if (await tikla('[data-testid="char"]')) {
        await sayfa.waitForTimeout(500);
        // karakter ipucu karartması varsa kapatıp yeniden
        if (!(await sayfa.$('[data-testid^="char-tab-"]'))) await tikla('[data-testid="char"]');
        const sekmeler = await sayfa.$$eval('[data-testid^="char-tab-"]', (a) => a.map((e) => e.dataset.testid));
        if (!sekmeler.length) await olc('cayci');
        for (const s of sekmeler) { await tikla(`[data-testid="${s}"]`); await olc(`cayci-${s.replace('char-tab-', '')}`); }
        await geri();
      }
      if (await tikla('[data-testid="gear"]')) {
        await olc('ayarlar');
        if (await tikla('[data-testid="reset"]')) { await olc('ayarlar-sifirla'); const no = await sayfa.$('[data-testid="reset-no"]'); if (no) await no.click(); }
        await geri();
      }
      // Ödül ekranları (durum enjekte edilerek)
      await sayfa.evaluate(() => window.__setState({ levelUp: { level: 7, amount: 12345, carryBefore: 3, carryAfter: 4 } }));
      await sayfa.waitForTimeout(600);
      if (await sayfa.$('[data-testid="level-up-ok"]')) await olc('seviye-odulu');
      await sayfa.evaluate(() => window.__setState({ levelUp: null }));
      await sayfa.evaluate(() => window.__setState({ offlineEarned: 45678, offlineIzleEki: 45678 }));
      await sayfa.waitForTimeout(600);
      if (await sayfa.$('[data-testid="offline"]')) await olc('cevrimdisi-odulu');
      await sayfa.evaluate(() => window.__setState({ offlineEarned: 0, offlineIzleEki: 0 }));
      await sayfa.waitForTimeout(400);
      if (await tikla('[data-testid="video-btn"]')) { await sayfa.waitForTimeout(500); if (await sayfa.$('[data-testid="video-kart"]')) await olc('video-teklif'); await sayfa.keyboard.press('Escape'); const k = await sayfa.$('.sheet-back, [data-testid="teklif-kapat"]'); if (k) await k.click().catch(() => {}); }
      if (asama === 'gec') {
        // Usta penceresi: ilk masanın Usta'sını yakına getir
        await sayfa.evaluate(() => { const s = window.__game(); window.__setState({ nearMaster: 'table:0' }); return s; });
        await sayfa.waitForTimeout(700);
        if (await sayfa.$('[data-testid="master-buy"], [data-testid="usta-strip"], [data-testid="master-bar"]')) await olc('usta');
        await sayfa.evaluate(() => window.__setState({ nearMaster: null }));
        await sayfa.evaluate(() => window.__setState({ satin: { ...(window.__game().satin ?? {}), teklif: false } }));
      }
      r.konsol = [...new Set(konsol)];
      sonuc[anahtar] = r;
      await baglam.close();
      const say = (k) => Object.values(r.ekranlar).reduce((n, e) => n + (e[k]?.length ?? 0), 0);
      console.log(`ui ${anahtar}: ekran ${Object.keys(r.ekranlar).length} · taşma ${say('tasma')} · kesik ${say('kesik')} · küçük ${say('kucukHedef')} · örtülen ${say('ortulen')} · güvenli ${say('guvenliAlan')} · konsol ${r.konsol.length}`);
    }
  }
  yaz('ui', sonuc);
}

// ─────────────────────────────── FAZ: PERF ───────────────────────────────
async function fazPerf() {
  const sonuc = {};
  const depoGec = fs.existsSync(GEC_KAYIT) ? JSON.parse(fs.readFileSync(GEC_KAYIT, 'utf8')) : null;
  for (const asama of ['taze', 'gec']) {
    const { baglam, sayfa, konsol } = await yeniSayfa({ depo: asama === 'gec' ? depoGec : null });
    const cdp = await baglam.newCDPSession(sayfa);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Performance.enable');
    const t0 = Date.now();
    await sayfa.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await sayfa.waitForSelector('canvas', { timeout: 120000 });
    const tCanvas = Date.now() - t0;
    await sayfa.waitForFunction(() => typeof window.__game === 'function', null, { timeout: 120000 });
    await sayfa.waitForFunction(() => !document.querySelector('.splash, [data-testid="splash"]'), null, { timeout: 120000 }).catch(() => {});
    const tHazir = Date.now() - t0;
    if (asama === 'taze') { const k = await sayfa.$('[data-testid="kafe-adi"]'); if (k) { await sayfa.fill('[data-testid="kafe-adi-girdi"]', AD); await sayfa.click('[data-testid="kafe-adi-tamam"]'); } }
    else if (!depoGec) await gecDurumKur(sayfa);
    await sayfa.waitForTimeout(4000);
    const kareler = await sayfa.evaluate(() => new Promise((coz) => {
      const d = []; let son = performance.now(); const bitis = son + 8000;
      const f = (t) => { d.push(t - son); son = t; if (t < bitis) requestAnimationFrame(f); else coz(d); };
      requestAnimationFrame(f);
    }));
    kareler.sort((a, b) => a - b);
    const p = (q) => +kareler[Math.min(kareler.length - 1, Math.floor(q * kareler.length))].toFixed(1);
    const m = await cdp.send('Performance.getMetrics');
    const met = Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
    const gl = await sayfa.evaluate(() => { try { const i = window.__perf?.(); return i; } catch { return null; } });
    sonuc[asama] = { yuklemeCanvasMs: tCanvas, yuklemeHazirMs: tHazir, kare: { adet: kareler.length, fps: +(kareler.length / 8).toFixed(1), p50: p(0.5), p95: p(0.95), p99: p(0.99), max: p(1) }, yiginMB: +(met.JSHeapUsedSize / 1048576).toFixed(1), dom: met.Nodes, perfKancasi: gl, konsol: [...new Set(konsol)], not: 'CPU 4× kısma, GPU kısılmadı (masaüstü GPU) — dev sunucusu, üretim derlemesi değil' };
    await baglam.close();
    console.log(`perf ${asama}:`, JSON.stringify(sonuc[asama].kare), 'yükleme', tHazir, 'ms', 'yığın', sonuc[asama].yiginMB);
  }
  yaz('perf', sonuc);
}

// ─────────────────────────────── FAZ: REKLAM (etik kuralı canlı) ───────────────────────────────
// Kural (CLAUDE.md + D-144): geçişli yalnız panel kapanışında, soğuma 3 dk, ÖDÜL EKRANINDAN SONRA YOK.
async function fazReklam() {
  const sonuc = {};
  const depoGec = fs.existsSync(GEC_KAYIT) ? JSON.parse(fs.readFileSync(GEC_KAYIT, 'utf8')) : null;
  const { baglam, sayfa, konsol } = await yeniSayfa({ depo: depoGec });
  await ac(sayfa, { ad: !depoGec });
  await sayfa.waitForTimeout(1500);
  const ads = () => sayfa.evaluate(() => window.__ads.durum());
  const saat = (ms) => sayfa.evaluate((m) => window.__ads.saat(m), ms);
  const tik = async (sel, t = 600) => { const e = await sayfa.$(sel); if (!e) return false; await e.click().catch(() => {}); await sayfa.waitForTimeout(t); return true; };
  const kapatOdul = async () => { for (let i = 0; i < 6; i++) { if (!(await tik('[data-testid="level-up-ok"], [data-testid="offline-ok"], [data-testid="satin-odul-tamam"]', 300))) break; } };
  const geri = () => tik('.sheet-back', 800);
  await kapatOdul();
  sonuc.baslangic = await ads();
  // R0 kontrol: düz aç-kapa, soğuma dolmuş → reklam ÇIKMALI
  await saat(200000);
  let a0 = (await ads()).gecisli;
  await tik('[data-testid="shop"]', 900); await geri();
  sonuc.R0_duzKapanis = { gecisliArtti: (await ads()).gecisli - a0, beklenen: 1 };
  // R1: 💎 paketi satın al → "Harika!" → mağazayı kapat
  await saat(200000);
  a0 = (await ads()).gecisli;
  await tik('[data-testid="shop"]', 900);
  await tik('[data-testid="shop-tab-paket"]', 900);
  const paket = await sayfa.$$eval('[data-testid^="paket-al-"]', (a) => a.map((e) => e.dataset.testid));
  const elmas = paket.find((p) => p.includes('elmas')) ?? paket[0];
  let alindi = false;
  if (elmas) { await tik(`[data-testid="${elmas}"]`, 1200); alindi = !!(await sayfa.$('[data-testid="satin-odul"]')); sonuc.R1_kare = await kare(sayfa, 'reklam-r1-satin-odul'); await tik('[data-testid="satin-odul-tamam"]', 600); }
  await geri();
  sonuc.R1_satinAlmaSonrasi = { paket: elmas, odulEkrani: alindi, gecisliArtti: (await ads()).gecisli - a0, beklenen: 0 };
  // R2: çevrimdışı ödülü bir panel açıkken gelir → "Al" → paneli kapat
  await saat(200000);
  a0 = (await ads()).gecisli;
  await tik('[data-testid="goals"]', 900);
  await sayfa.evaluate(() => window.__setState({ offlineEarned: 5000, offlineIzleEki: 5000 }));
  await sayfa.waitForTimeout(700);
  const offEkran = !!(await sayfa.$('[data-testid="offline-ok"]'));
  sonuc.R2_kare = await kare(sayfa, 'reklam-r2-cevrimdisi-panel-ustu');
  await tik('[data-testid="offline-ok"]', 600);
  await geri();
  sonuc.R2_cevrimdisiOdulSonrasi = { odulEkrani: offEkran, gecisliArtti: (await ads()).gecisli - a0, beklenen: 0 };
  // R3: ödüllü video izlendikten 15 sn sonra panel kapanışı (soğuma ödüllüyle sıfırlanıyor mu?)
  await saat(200000);
  await tik('[data-testid="shop"]', 800); await geri(); // bir geçişli gösterildi → soğuma başladı
  await saat(170000);
  const o0 = (await ads()).odullu;
  let videoIzlendi = false;
  if (await tik('[data-testid="video-btn"]', 800)) { videoIzlendi = await tik('[data-testid="video-izle"]', 1200); await kapatOdul(); const k = await sayfa.$('[data-testid="teklif-kapat"], .modal-close, .sheet-back'); if (k) await k.click().catch(() => {}); }
  const odulluArtti = (await ads()).odullu - o0;
  await saat(15000);
  a0 = (await ads()).gecisli;
  await tik('[data-testid="quests"]', 800); await geri();
  sonuc.R3_odulluSonrasi15sn = { videoIzlendi, odulluArtti, gecisliArtti: (await ads()).gecisli - a0, beklenen: 0 };
  // R4: seviye ödülü (panel açıkken) → "Al" → paneli kapat
  await saat(200000);
  a0 = (await ads()).gecisli;
  await tik('[data-testid="quests"]', 800);
  await sayfa.evaluate(() => window.__setState({ levelUp: { level: 8, amount: 5000, carryBefore: 3, carryAfter: 4 } }));
  await sayfa.waitForTimeout(700);
  const lvEkran = !!(await sayfa.$('[data-testid="level-up-ok"]'));
  await tik('[data-testid="level-up-ok"]', 600);
  await geri();
  sonuc.R4_seviyeOdulSonrasi = { odulEkrani: lvEkran, gecisliArtti: (await ads()).gecisli - a0, beklenen: 0 };
  sonuc.son = await ads();
  sonuc.konsol = [...new Set(konsol)];
  await baglam.close();
  yaz('reklam', sonuc);
  console.log('reklam:', JSON.stringify(sonuc, (k, v) => (k === 'konsol' ? undefined : v)));
}

try {
  if (FAZLAR.includes('reklam')) await fazReklam();
  if (FAZLAR.includes('hat')) await fazHat();
  if (FAZLAR.includes('kayit')) await fazKayit();
  if (FAZLAR.includes('ui')) await fazUi();
  if (FAZLAR.includes('perf')) await fazPerf();
} finally {
  const ag = Object.fromEntries(disIstek);
  const onceki = fs.existsSync(path.join(OUT, 'sonuc-ag.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'sonuc-ag.json'), 'utf8')) : {};
  for (const [h, v] of Object.entries(ag)) onceki[h] = { adet: (onceki[h]?.adet ?? 0) + v.adet, ornek: v.ornek };
  yaz('ag', onceki);
  console.log('dış istekler:', JSON.stringify(ag));
  await tarayici.close();
  if (sunucu) sunucu.kill();
}
