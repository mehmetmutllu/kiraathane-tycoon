/**
 * olcum-tablet-f6.mjs — F6 TUR 3 §L: TABLET YATAYI KIRIK, KOLLAR ÖLÇÜLÜYOR.
 *
 * NEDEN VAR. §J (döndürme ölçümü) turun sorusunu *"döndürme temiz mi"* diye sordu ve cevabı
 * TEMİZ çıktı — ama yolda bunu buldu: **tablet yatayında Karakter ekranının ÜÇ ödül düğmesinin
 * ÜÇÜ de ilk ekranda yok** (`gizliOdul 3/3`). Tablet PORTRESİNDE aynı ekran tertemiz (0/3).
 *
 * BU YENİ BİR KUSUR DEĞİL — YENİ BİR KANIT. D-131 *"tablet zaten ölçümde temizdi (1,00–1,06×),
 * oraya dokunmak çalışan bir şeyi bozmak olurdu"* diyerek tableti bilerek dışarıda bıraktı.
 * O cümle **kusurlu ölçüte** dayanıyordu: `scrollHeight` taşan çocukları saymıyor (F1b açık uç
 * ④, altı hücrenin beşinde yanlış). Güvenilir ölçütle (`disarida`) bakınca tablet yatayı temiz
 * değil. Yani D-131'in tableti atlama gerekçesi düştü.
 *
 * KULLANICININ CÜMLESİ KUSURU ÖNCEDEN SÖYLEDİ (`feedback_ui_form_not_color`):
 *   *"tablette oynarsa yatay gibi tepki verecek ya, uygulama ona göre davranmalı"*
 * Tablet yatayı bugün **yatay gibi davranmıyor** — portre gibi davranıyor. Kırılma tam orada.
 *
 * KÖK NEDEN (kod okunarak, ölçümle doğrulanacak):
 *   · `.modal-card.screen { width: min(100%, 520px) }` — kabuk ekran ne kadar genişlerse
 *     genişlesin 520 px'te duruyor.
 *   · Kısa-yatay dalının eşiği `(orientation: landscape) and (max-height: 560px)` — YÜKSEKLİK
 *     temelli. Tablet yatayı 800 px yüksek, eşiğin ÜSTÜNDE, dala girmiyor.
 *   · Ama tablet yatayının yüksekliği (800) tablet portresinin yüksekliğinin (1280) **%62'si**.
 *     Portrede sığan içerik burada sığmıyor; `.char-canvas`ın 230 px'lik taban payı ve
 *     `.char-card`ın taşma kuralsızlığı orada telafi edilmiyor.
 *   Kısacası eşik telefon için ayarlandı, tablet yatayı iki dalın ARASINA düştü.
 *
 * DÖRT KOL (hepsi CSS katmanı olarak GERÇEK oyunun üstüne uygulanır; depoda hiçbir şey değişmez —
 * "göster, sonra karar al" sırası, D-084):
 *   E0  taban (bugün)
 *   EA  eşiği yükselt — kısa-yatay dalı tablet yatayını da kapsar (ray + iki sütun açılır)
 *   EB  EA + kabuk genişler — iki sütuna gerçek yer açılır (520 → 900)
 *   EC  dar hedef — yalnız Karakter'in taşma kuralı, ray/iki sütun YOK (en küçük müdahale)
 *
 * SONDA: kollar tablet PORTRESİNİ ve TELEFONU bozuyor mu? D-131'in kazandığı yerler
 * korunmazsa kol düşer — bu yüzden her kol T1/L1/P1'de de koşuluyor.
 *
 * Koşu: node tools/olcum-tablet-f6.mjs   ·   OLCUM=kisa ile panel/kol sayısı kısılır
 * Çıktı: docs/gorsel/ss/f6-tablet-*.png + stdout (ham: docs/olcum-tablet-f6.txt)
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.F6_PORT ?? '', 10) || 5217;
const KISA = (process.env.OLCUM ?? 'tam').toLowerCase() === 'kisa';
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

const PADS = (() => {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
})();

const KADRAJLAR = [
  { id: 'T2', ad: 'tablet yatay 4:3', w: 1280, h: 800, dpr: 2, asil: true },
  { id: 'T1', ad: 'tablet portre 3:4', w: 800, h: 1280, dpr: 2 },
  { id: 'L1', ad: 'telefon yatay', w: 915, h: 412, dpr: 2.625 },
  { id: 'P1', ad: 'telefon portre', w: 412, h: 915, dpr: 2.625 },
];

/**
 * SIRA §J İLE BİREBİR AYNI — ve bu bir DETAY DEĞİL, ölçümün geçerlilik şartı.
 *
 * İlk yazımda Karakter başa alınmıştı (asıl şüpheli o olduğu için) ve taban **0/3** çıktı;
 * §J'de aynı hücre **3/3** çıkmıştı. Tek göze çarpan fark panel sırasıydı: §J'de Karakter
 * oturumun 4. paneli. İki sayıdan birini seçip devam etmek ölçümü uydurmak olurdu, çünkü §L'nin
 * bütün kol tablosu "taban ne kadar kırık" sayısına dayanıyor: taban 0/3 ise §L'nin tamamı
 * boşa kürek, 3/3 ise düzen değişikliği gerekli.
 *
 * Bu yüzden sıra §J'nin sırasına sabitlendi. Artık iki araç aynı koşulda koşuyor ve E0 satırı
 * §J'nin T2 satırıyla DOĞRUDAN karşılaştırılabilir — E0 hem kol tabanı hem de §J'nin
 * yeniden üretilebilirlik denetimi.
 */
const PANELLER = [
  { id: 'quests', ad: 'Gorevler', tetik: '[data-testid="quests"]', panel: '[data-testid="quests-panel"]' },
  { id: 'goals', ad: 'Hedefler', tetik: '[data-testid="goals"]', panel: '[data-testid="goals-panel"]' },
  { id: 'shop', ad: 'Magaza', tetik: '[data-testid="shop"]', panel: '[data-testid="shop-panel"]' },
  { id: 'char', ad: 'Karakter', tetik: '[data-testid="char"]', panel: '[data-testid="char-panel"]' },
  { id: 'menu', ad: 'Ayarlar', tetik: '[data-testid="gear"]', panel: '[data-testid="menu"]' },
];

/* Kısa-yatay dalının GÖVDESİ — D-131'in bugün yazdığı kuralların aynısı. Kollar bu gövdeyi
   farklı EŞİKLERLE açıyor; kuralların kendisi tartışma konusu değil (onlar onaylandı), eşiğin
   tablet yatayını kapsayıp kapsamadığı tartışma konusu. */
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

/* EC'nin dar hedefi: ray/iki sütun YOK, yalnız dikeyde sığmayan iki kural. Kolun işi,
   "kırığı kapatmak için düzeni değiştirmek GEREKLİ mi" sorusunu sınamak. Gerekmiyorsa
   en küçük müdahale kazanır. */
const DAR_HEDEF = `
  .char-canvas { min-height: 150px; }
  .char-card { max-height: 100%; overflow-y: auto; }
`;

const KOLLAR = [
  { id: 'E0', ad: 'Taban (bugun)', css: '' },
  {
    id: 'EA', ad: 'Esik yukseldi (ray+2sutun)',
    css: `@media (orientation: landscape) and (max-height: 900px) { ${RAY_GOVDE} }`,
  },
  {
    id: 'EB', ad: 'EA + kabuk genisler',
    css: `@media (orientation: landscape) and (max-height: 900px) { ${RAY_GOVDE} }
          @media (orientation: landscape) and (min-width: 900px) { .modal-card.screen { width: min(100%, 900px); } }`,
  },
  {
    id: 'EC', ad: 'Dar hedef (yalniz tasma)',
    css: `@media (orientation: landscape) and (min-width: 700px) and (max-height: 900px) { ${DAR_HEDEF} }`,
  },
];

// ───────────────────────────── ölçü (tarayıcıda koşar) ─────────────────────────────

/** §J ile AYNI ölçü — `scrollHeight` yok, `disarida` var (açık uç ④). */
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
  const govdedeGorunur = (r) => r.top >= govdeKutu.top - 1 && r.bottom <= govdeKutu.bottom + 1;
  let gorunurDugme = 0;
  for (const b of dugmeler) {
    const r = b.getBoundingClientRect();
    if (gorunurMu(r) && govdedeGorunur(r)) gorunurDugme++;
  }
  const odul = dugmeler.filter((b) => /claim|buy|cta/i.test((b.getAttribute('data-testid') || '') + b.className));
  const gizliOdul = odul.filter((b) => !govdedeGorunur(b.getBoundingClientRect())).length;

  let kesilen = 0, kucukHedef = 0;
  for (const el of document.querySelectorAll(`${sec} *`)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (getComputedStyle(el).display === 'none') continue;
    if (r.left < -1 || r.right > vw + 1) kesilen++;
  }
  for (const b of dugmeler) {
    const r = b.getBoundingClientRect();
    if (Math.min(r.width, r.height) < 44) kucukHedef++;
  }

  return {
    kabukG: +kr.width.toFixed(0), kabukY: +kr.height.toFixed(0),
    duzen: ur ? (ur.height > ur.width ? 'ray' : 'serit') : null,
    disarida, akanToplam: akanlar.length,
    gorunurDugme, toplamDugme: dugmeler.length,
    gizliOdul, odulToplam: odul.length,
    kesilen, kucukHedef,
  };
};

const IMZA = () => {
  const g = window.__game();
  return `t${g.tables}|s${Object.keys(g.stations ?? {}).length}|a${g.areasOpen ?? '?'}|n${g.npcCount}`;
};

// ─────────────────────────────────── koşucu ───────────────────────────────────

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
  await s.waitForTimeout(2000);
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

/**
 * PANELİ KAPAT — ve KAPANDIĞINI DOĞRULA. İlk koşuda burada `Escape` vardı ve **hiçbir sheet'te
 * klavye kancası olmadığı için** hiçbir şey yapmıyordu: ilk panel açık kalıyor, HUD düğmelerinin
 * üstünü örtüyor, sonraki dördü hiç açılamıyordu. Tablo beş satırın dördünde `ACILMADI` yazdı —
 * o koşudaki bütün kol özeti tek panelin sayısıydı. Artık kapanmazsa araç durur.
 */
async function panelKapat(sayfa, p) {
  const geri = sayfa.locator(`${p.panel} .sheet-back`).first();
  if (await geri.count()) await geri.click({ timeout: 4000 }).catch(() => {});
  await sayfa.waitForTimeout(650);
  if ((await sayfa.locator(p.panel).count()) > 0) {
    throw new Error(`panel kapanmadi: ${p.ad} — sonraki paneller olculemezdi`);
  }
}

async function main() {
  const t0 = Date.now();
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const kollar = KISA ? KOLLAR.slice(0, 2) : KOLLAR;
  const paneller = PANELLER;
  const kadrajlar = KISA ? KADRAJLAR.slice(0, 1) : KADRAJLAR;

  const sonuc = [];
  for (const kadraj of kadrajlar) {
    for (const kol of kollar) {
      const hatalar = [];
      const { baglam, sayfa } = await oturumAc(tarayici, kadraj, kol, hatalar);
      const imza = await sayfa.evaluate(IMZA);
      for (const p of paneller) {
        const acildi = await panelAc(sayfa, p);
        if (!acildi) throw new Error(`${kadraj.id}/${kol.id}: ${p.ad} acilmadi — kol ozeti eksik panelle hesaplanirdi`);
        const olc = await sayfa.evaluate(PANEL_OLC, p.panel);
        sonuc.push({ kadraj: kadraj.id, kol: kol.id, panel: p.ad, olc, imza, hata: hatalar.length });
        if (kadraj.asil && p.id === 'char') {
          await sayfa.screenshot({ path: path.join(OUT, `f6-tablet-${kol.id}-${p.id}.png`) });
        }
        await panelKapat(sayfa, p);
      }
      await baglam.close();
      console.log(`  ${kadraj.id} / ${kol.id} bitti (imza=${imza}, hata=${hatalar.length})`);
    }
  }

  await tarayici.close();
  sunucu.kill();

  const L = [];
  const yaz = (s = '') => { L.push(s); console.log(s); };
  yaz('');
  yaz('════════════════════════════════════════════════════════════════════════════════');
  yaz(`  F6 TUR 3 §L — TABLET YATAYI: DORT KOL   (kip: ${KISA ? 'KISA' : 'TAM'})`);
  yaz('════════════════════════════════════════════════════════════════════════════════');

  for (const kadraj of kadrajlar) {
    yaz('');
    yaz(`── ${kadraj.id}  ${kadraj.ad}  (${kadraj.w}x${kadraj.h})${kadraj.asil ? '   ← ASIL KADRAJ' : '   (sonda: bozuluyor mu)'}`);
    yaz('');
    yaz('  kol  panel      duzen  kabuk WxH   disarida/akan  gorunur/toplam  GIZLI ODUL  kesilen  kucukHedef  hata');
    for (const r of sonuc.filter((x) => x.kadraj === kadraj.id)) {
      const o = r.olc;
      if (o.yok) { yaz(`  ${r.kol.padEnd(4)} ${r.panel.padEnd(10)} ACILMADI`); continue; }
      yaz(`  ${r.kol.padEnd(4)} ${r.panel.padEnd(10)} ${String(o.duzen).padEnd(6)} ${String(o.kabukG + 'x' + o.kabukY).padStart(10)}  ${String(o.disarida + '/' + o.akanToplam).padStart(13)}  ${String(o.gorunurDugme + '/' + o.toplamDugme).padStart(14)}  ${String(o.gizliOdul + '/' + o.odulToplam).padStart(10)}  ${String(o.kesilen).padStart(7)}  ${String(o.kucukHedef).padStart(10)}  ${String(r.hata).padStart(4)}`);
    }
  }

  /* ÖZET — kolun tek sayısı: asıl kadrajda kaç ödül düğmesi gizli + kaç kart dışarıda. */
  yaz('');
  yaz('── KOL ÖZETİ (asil kadraj T2, bes panel toplami)');
  yaz('');
  yaz('  kol  ad                            GIZLI ODUL  disarida  gorunur dugme  kesilen');
  for (const kol of kollar) {
    const r = sonuc.filter((x) => x.kadraj === 'T2' && x.kol === kol.id && !x.olc.yok);
    const t = (a) => r.reduce((s, x) => s + (x.olc[a] ?? 0), 0);
    yaz(`  ${kol.id.padEnd(4)} ${kol.ad.padEnd(29)} ${String(t('gizliOdul') + '/' + t('odulToplam')).padStart(10)}  ${String(t('disarida')).padStart(8)}  ${String(t('gorunurDugme') + '/' + t('toplamDugme')).padStart(13)}  ${String(t('kesilen')).padStart(7)}`);
  }

  yaz('');
  yaz('OKUMA NOTU');
  yaz('  GIZLI ODUL = ilk ekranda GORUNMEYEN odul-alma dugmesi. Ekranin isi bu; 0 olmali.');
  yaz('  disarida   = govdenin alt kenarini GERCEKTEN asan kart (scrollHeight KULLANILMADI).');
  yaz('  gorunur/toplam: geri dugmesi govdenin DISINDA oldugu icin her hucrede 1 eksik sayilir');
  yaz('                  (sabit yanlilik; kollar arasi karsilastirma gecerli, mutlak deger degil).');
  yaz('  CENTIK OLCULMEDI: Playwright safe-area taklit edemez.');
  yaz('');
  yaz(`  sure: ${((Date.now() - t0) / 1000).toFixed(0)} sn`);

  fs.writeFileSync(path.join(KOK, `docs/olcum-tablet-f6${KISA ? '-kisa' : ''}.txt`), L.join('\n'), 'utf8');
  console.log(`\nham cikti: docs/olcum-tablet-f6${KISA ? '-kisa' : ''}.txt`);
}

main().catch((e) => { console.error(e); process.exit(1); });
