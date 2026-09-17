/**
 * olcum-donme-f6.mjs — F6 TUR 3: DÖNDÜRME ANI (ekran yönü K0'ın tek ölçülmemiş yüzeyi).
 *
 * NEDEN VAR. Kullanıcı ① ekran yönünü seçti: *"ana tema dikey ama yatayda da kullanılabilir
 * olmalı; kullanıcı isterse yataya dönebilir veya tablette oynarsa yatay gibi tepki verecek"*
 * → **K0 SERBEST** (kilit yok). D-131 üç DURAN kareyi ölçtü (412×915 · 915×412 · 1280×800) ve
 * hepsini yeşile boyadı. Ama duran kare K0'ın sorusunu cevaplamıyor: kilidi kaldırınca YENİ
 * olan şey kare değil **geçiş**. Oyuncu oynarken çeviriyor; üstelik açık bir ekran varken
 * D-131'in ray ↔ üst şerit takası tam o anda oluyor. O an bugüne dek hiç denenmedi.
 *
 * ANA ÖLÇÜT — TAZE ↔ DÖNEREK. Her hücre aynı boyutu İKİ YOLDAN elde eder:
 *   taze    : tarayıcı doğrudan B boyutunda açılır (D-131'in ölçtüğü yol)
 *   dönerek : A boyutunda açılır, oyun kurulur, sonra CANLI olarak B'ye çevrilir
 * İkisi eşitse geçiş temizdir. Eşit değilse ortada **bayat hâl** var: bir şey ilk düzene göre
 * hesaplanmış ve döndürme onu tazelememiş. Bu ölçüt kendi referansını üretir — dışarıdan
 * "iyi/kötü" eşiği gerektirmez, tutarsızlığın kendisi bulgudur.
 *
 * ÜÇ BÖLÜM:
 *   §J1  HUD döndürme         — 4 yön çifti (telefon P↔Y · tablet P↔Y)
 *   §J2  AÇIK EKRANLA döndürme — 4 çift × 5 panel; panel açık kalıyor mu + yerleşim tazeleniyor mu
 *   §J3  GİDİŞ-DÖNÜŞ          — A→B→A; başladığı yere dönüyor mu (birikimli bozulma denetimi)
 *
 * TUR 1-2'NİN DERSLERİ BU ARACA DA YAZILI:
 *   · HUD sayımı `background-color` alfasına EK OLARAK zemin görselini (gradyan) ve görünür
 *     kenarlığı da sayar — yoksa `.band`/`.botnav` sayımdan düşer (tur 1'in İYİMSER hatası).
 *   · Her hücre bir DÜNYA İMZASI basar; imzasız "ölçtüm" demek aynı sahneyi ölçtüm demek değil.
 *   · `scrollHeight` KULLANILMAZ. F1b §I sondası onun taşan çocukları saymadığını, altı
 *     hücrenin beşinde yanlış olduğunu gösterdi (açık uç ④). Güvenilir sütun **`disarida`**:
 *     gövdenin alt kenarını gerçekten aşan öğe sayısı. Burada o sayılıyor.
 *
 * ÖLÇEMEDİĞİ ŞEY — DÜRÜSTÇE: **çentik/güvenli alan.** Yatayda `env(safe-area-inset-*)` sol/sağa
 * geçer; Playwright çentik taklit edemez, bu yüzden `--sal`/`--sar` her kadrajda 0'dır. Yani bu
 * ölçüm "yatayda çentik HUD'u kesiyor mu" sorusuna CEVAP VERMEZ. Cihaz turunun kalemi.
 *
 * Koşu: node tools/olcum-donme-f6.mjs   ·   OLCUM=kisa ile çift/panel sayısı kısılır
 *       F6_PORT=5216 ile port değiştirilir
 * Çıktı: docs/gorsel/ss/f6-donme-*.png + stdout tablo (ham çıktı: docs/olcum-donme-f6.txt)
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.F6_PORT ?? '', 10) || 5216;
const KISA = (process.env.OLCUM ?? 'tam').toLowerCase() === 'kisa';
const OUT = path.join(KOK, 'docs/gorsel/ss');
fs.mkdirSync(OUT, { recursive: true });

/** Pad listesi ELLE YAZILMAZ (F1b tur 1'in 5. kusuru: liste bayatlamıştı). */
const PADS = (() => {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
})();

const KADRAJ = {
  P1: { id: 'P1', ad: 'telefon portre 20:9', w: 412, h: 915, dpr: 2.625 },
  L1: { id: 'L1', ad: 'telefon yatay 20:9', w: 915, h: 412, dpr: 2.625 },
  T1: { id: 'T1', ad: 'tablet portre 3:4', w: 800, h: 1280, dpr: 2 },
  T2: { id: 'T2', ad: 'tablet yatay 4:3', w: 1280, h: 800, dpr: 2 },
};

/**
 * DÖRT YÖN ÇİFTİ. Her çift İKİ YÖNDE de koşulur: P→Y ile Y→P aynı şey değildir, çünkü
 * hangi düzenin "ilk" kurulduğu bayat hâli belirler. D-131'in dalları asimetrik
 * (ray yalnız kısa yatayda açılır), yani dönüş yolu ayrı bir yüzeydir.
 */
const CIFTLER = [
  { id: 'P1>L1', a: 'P1', b: 'L1', ad: 'telefon: portre → yatay' },
  { id: 'L1>P1', a: 'L1', b: 'P1', ad: 'telefon: yatay → portre' },
  { id: 'T1>T2', a: 'T1', b: 'T2', ad: 'tablet: portre → yatay' },
  { id: 'T2>T1', a: 'T2', b: 'T1', ad: 'tablet: yatay → portre' },
];

/** Beş ekran. `tetik` = paneli açan gerçek HUD düğmesi. */
const PANELLER = [
  { id: 'quests', ad: 'Gorevler', tetik: '[data-testid="quests"]', panel: '[data-testid="quests-panel"]' },
  { id: 'goals', ad: 'Hedefler', tetik: '[data-testid="goals"]', panel: '[data-testid="goals-panel"]' },
  { id: 'shop', ad: 'Magaza', tetik: '[data-testid="shop"]', panel: '[data-testid="shop-panel"]' },
  { id: 'char', ad: 'Karakter', tetik: '[data-testid="char"]', panel: '[data-testid="char-panel"]' },
  { id: 'menu', ad: 'Ayarlar', tetik: '[data-testid="gear"]', panel: '[data-testid="menu"]' },
];

// ───────────────────────────── tarayıcı içinde koşan ölçüler ─────────────────────────────

/**
 * HUD ÖLÇÜSÜ. F1b'den taşındı; sayım kuralı AYNEN korundu ki sayılar D-131'in yayımlanmış
 * sayılarıyla karşılaştırılabilsin (gradyan ve kenarlık de sayılır — tur 1'in iyimser hatası).
 * Buraya EKLENEN: üç.js tuvalinin yeni kadraja OTURUP OTURMADIĞI (döndürmenin asıl riski).
 */
const HUD_OLC = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const oge = [];
  for (const el of document.querySelectorAll('.hud *, .touch-layer *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number.parseFloat(cs.opacity) < 0.05) continue;
    const alfa = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return 0; const p = m[1].split(','); return p[3] !== undefined ? Number.parseFloat(p[3]) : 1; };
    const boyali = alfa(cs.backgroundColor) > 0.05
      || (cs.backgroundImage && cs.backgroundImage !== 'none')
      || (Number.parseFloat(cs.borderTopWidth) > 0 && alfa(cs.borderTopColor) > 0.05)
      || ['SVG', 'svg', 'IMG'].includes(el.tagName);
    if (!boyali) continue;
    oge.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
  const ADIM = 4;
  let kapali = 0, toplam = 0;
  const kapaliMi = (px, py) => oge.some((o) => px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h);
  for (let py = 0; py < vh; py += ADIM) for (let px = 0; px < vw; px += ADIM) { toplam++; if (kapaliMi(px, py)) kapali++; }

  const kacik = (sec) => {
    const el = document.querySelector(sec);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { g: +r.width.toFixed(0), k: +((r.left + r.width / 2) - vw / 2).toFixed(0) };
  };

  /* TUVAL OTURUYOR MU — döndürmenin birinci riski. Tuval eski kadrajda kalırsa sahne ya
     gerilir ya kesilir; CSS'in hiç haberi olmaz, yani HUD sayıları tertemiz çıkarken oyun
     bozuk görünür. Üç sayı ayrı ayrı bakılır çünkü ayrı ayrı bayatlayabiliyorlar. */
  const tuval = document.querySelector('canvas');
  const tr = tuval ? tuval.getBoundingClientRect() : null;
  const t3 = window.__three;
  const cam = t3 ? t3.camera : null;

  return {
    vw, vh,
    hudYuzde: +(100 * kapali / toplam).toFixed(1),
    band: kacik('.band'),
    nav: kacik('.botnav'),
    tasan: oge.filter((o) => o.x < -1 || o.y < -1 || o.x + o.w > vw + 1 || o.y + o.h > vh + 1).length,
    // tuvalin CSS kutusu ekranı kaplıyor mu (px cinsinden sapma)
    tuvalDW: tr ? +(tr.width - vw).toFixed(0) : null,
    tuvalDH: tr ? +(tr.height - vh).toFixed(0) : null,
    // çizim tamponu gerçekten yeniden boyutlandı mı (dpr çarpanıyla)
    tamponW: tuval ? tuval.width : null,
    tamponH: tuval ? tuval.height : null,
    // kameranın en-boyu yeni kadrajla uyumlu mu — 0'dan sapma = bayat kamera
    kamSapma: cam && cam.aspect ? +(cam.aspect - vw / vh).toFixed(4) : null,
  };
};

/**
 * PANEL ÖLÇÜSÜ. `scrollHeight` KULLANILMAZ (açık uç ④). Yerine `disarida`: gövdenin alt
 * kenarını gerçekten aşan DOĞRUDAN çocuk sayısı. `display:contents` sarmalayıcılar yüzünden
 * doğrudan çocuk listesi ızgaraya giren gerçek kartlarla aynı değil; bu yüzden ızgara akışına
 * giren yaprakları geziyoruz.
 */
const PANEL_OLC = (sec) => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const kabuk = document.querySelector(`${sec} .modal-card`);
  if (!kabuk) return { yok: true };
  const kr = kabuk.getBoundingClientRect();
  const govde = document.querySelector(`${sec} .sheet-body`) || document.querySelector(`${sec} .char-body`);
  const ust = document.querySelector(`${sec} .screen-top`);
  const ur = ust ? ust.getBoundingClientRect() : null;

  /* Izgaraya GERÇEKTEN giren öğeler: `display:contents` olan sarmalayıcı kendi kutusunu
     üretmez, çocukları akışa girer. Bir düzey açarak o yaprakları topluyoruz. */
  const akanlar = [];
  if (govde) {
    for (const c of govde.children) {
      if (getComputedStyle(c).display === 'contents') akanlar.push(...c.children);
      else akanlar.push(c);
    }
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

  /* KESİLME: panelin içinde ekranın YANINDAN taşan öğe. */
  let kesilen = 0;
  for (const el of document.querySelectorAll(`${sec} *`)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (getComputedStyle(el).display === 'none') continue;
    if (r.left < -1 || r.right > vw + 1) kesilen++;
  }

  /* RAY MI ŞERİT Mİ — D-131'in takası. Üst bölge DİKEY düzendeyse ray, yataysa şerit.
     Döndürmenin ikinci riski tam burada: takas edilmemiş bir hâl kalabilir. */
  const duzen = ur ? (ur.height > ur.width ? 'ray' : 'serit') : null;

  return {
    vw, vh,
    kabukG: +kr.width.toFixed(0), kabukY: +kr.height.toFixed(0),
    ustPx: ur ? +ur.height.toFixed(0) : null,
    ustG: ur ? +ur.width.toFixed(0) : null,
    duzen,
    govdePx: govde ? govde.clientHeight : null,
    disarida, akanToplam: akanlar.length,
    gorunurDugme, toplamDugme: dugmeler.length,
    gizliOdul, odulToplam: odul.length,
    kesilen,
  };
};

/** DÜNYA İMZASI — aynı imza = aynı sahne ölçüldü. */
const IMZA = () => {
  const g = window.__game();
  return `t${g.tables}|s${Object.keys(g.stations ?? {}).length}|a${g.areasOpen ?? '?'}|n${g.npcCount}`;
};

/** OYUN DURUMU — döndürme ilerlemeyi yutuyor mu? En sert denetim bu. */
const DURUM = () => {
  const g = window.__game();
  return {
    wallet: String(g.wallet), diamonds: String(g.diamonds),
    tables: g.tables, npc: g.npcCount,
    stations: Object.keys(g.stations ?? {}).length,
    areas: g.areasOpen ?? null,
  };
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

/**
 * Bir kadrajda oturum açar, dünyayı KURAR ve dondurur.
 * Sıra kasıtlı (F1b'den): yaz → bir tur türet → dondur. `tick.ts` dünyayı her karede
 * `padsDone`tan türetiyor; zaman önce durursa türetme hiç koşmaz ve sahne boş kalır.
 */
async function oturumAc(tarayici, kadraj, hatalar) {
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
  await s.waitForTimeout(2500);
  return { baglam, sayfa: s };
}

/**
 * CANLI DÖNDÜRME. Gerçek cihazda olan şey budur: aynı belge, aynı JS yığını, yalnız kadraj
 * değişir. `setViewportSize` bunu birebir yapar (yeni bağlam açmaz, sayfayı yeniden yüklemez).
 * Bekleme cömert: `resize`ı borulayan kod (Scene.tsx) bir sonraki karede hesaplıyor.
 */
async function dondur(sayfa, kadraj) {
  await sayfa.setViewportSize({ width: kadraj.w, height: kadraj.h });
  await sayfa.waitForTimeout(1800);
}

async function panelAc(sayfa, p) {
  const t = sayfa.locator(p.tetik).first();
  if (!(await t.count())) return false;
  await t.click({ timeout: 4000 }).catch(() => {});
  await sayfa.waitForTimeout(900);
  return (await sayfa.locator(p.panel).count()) > 0;
}

/**
 * PANELİ KAPAT — ve KAPANDIĞINI DOĞRULA.
 *
 * İlk yazımda burada `Escape` vardı. **Hiçbir sheet'te klavye kancası yok** (`Sheet.tsx`te
 * yalnız `.sheet-back` düğmesi `onClose` çağırıyor; `keydown` dinleyicisi sadece DevSandbox'ta),
 * yani `Escape` hiçbir şey yapmıyordu. Sonuç: taze döngüde ilk panel açılıyor, kapanmıyor,
 * üstünü örttüğü için sonraki dördü hiç açılamıyor ve `tazePanel` onlar için `{yok:true}`
 * kalıyordu.
 *
 * BU SESSİZ BİR ÖLÇÜM YALANI ÜRETİYORDU: `fark()` bir alan iki tarafın BİRİNDE bile undefined
 * ise o alanı atlıyor; `{yok:true}` referansında bütün alanlar undefined olduğu için fark
 * **boş** dönüyordu — yani karşılaştırma hiç yapılmadığı hâlde çıktı "— temiz —" yazıyordu.
 * (§J2'nin ilk koşusundaki "20/20 temiz" satırlarının dördü bu yüzden geçersizdi.)
 *
 * O yüzden kapatma artık: gerçek geri düğmesine bas + panelin GİTTİĞİNİ doğrula. Gitmiyorsa
 * araç susmaz, **durur** — eksik ölçmektense hiç ölçmemek.
 */
async function panelKapat(sayfa, p) {
  const geri = sayfa.locator(`${p.panel} .sheet-back`).first();
  if (await geri.count()) await geri.click({ timeout: 4000 }).catch(() => {});
  await sayfa.waitForTimeout(650);
  if ((await sayfa.locator(p.panel).count()) > 0) {
    throw new Error(`panel kapanmadi: ${p.ad} — olcum gecersiz olurdu (bkz. panelKapat yorumu)`);
  }
}

/** İki ölçüm nesnesinin sayısal alanlarını karşılaştır; farklı olanları döndür. */
function fark(taze, donerek, alanlar) {
  const f = [];
  for (const a of alanlar) {
    const x = taze?.[a], y = donerek?.[a];
    if (x === undefined || y === undefined) continue;
    const xs = typeof x === 'object' && x ? JSON.stringify(x) : x;
    const ys = typeof y === 'object' && y ? JSON.stringify(y) : y;
    if (xs !== ys) f.push(`${a}:${xs}→${ys}`);
  }
  return f;
}

const HUD_ALAN = ['hudYuzde', 'band', 'nav', 'tasan', 'tuvalDW', 'tuvalDH', 'tamponW', 'tamponH'];
const PANEL_ALAN = ['kabukG', 'kabukY', 'ustPx', 'ustG', 'duzen', 'govdePx', 'disarida', 'gorunurDugme', 'toplamDugme', 'gizliOdul', 'kesilen'];

async function main() {
  const t0 = Date.now();
  const sunucu = await sunucuKaldir();
  const tarayici = await chromium.launch();
  const ciftler = KISA ? CIFTLER.slice(0, 1) : CIFTLER;
  const paneller = KISA ? PANELLER.slice(0, 2) : PANELLER;

  const j1 = [], j2 = [], j3 = [];

  /* TAZE REFERANSLAR — her kadraj bir kez, doğrudan açılarak ölçülür. Karşılaştırmanın
     sol tarafı budur ve D-131'in ölçtüğü yoldur. */
  const tazeHud = {};
  const tazePanel = {};
  for (const k of Object.values(KADRAJ)) {
    if (KISA && !['P1', 'L1'].includes(k.id)) continue;
    const hatalar = [];
    const { baglam, sayfa } = await oturumAc(tarayici, k, hatalar);
    tazeHud[k.id] = { ...(await sayfa.evaluate(HUD_OLC)), imza: await sayfa.evaluate(IMZA), hata: hatalar.length };
    tazePanel[k.id] = {};
    for (const p of paneller) {
      const acildi = await panelAc(sayfa, p);
      if (!acildi) throw new Error(`taze ${k.id}: ${p.ad} acilmadi — referans eksik kalirdi, olcum gecersiz`);
      tazePanel[k.id][p.id] = await sayfa.evaluate(PANEL_OLC, p.panel);
      await panelKapat(sayfa, p);
    }
    await baglam.close();
    console.log(`  taze ${k.id} olculdu (${k.w}x${k.h}) imza=${tazeHud[k.id].imza}`);
  }

  /* KANARYA — karşılaştırıcı ÖLÜ OLMASIN. Bu ölçümün bütün bulgusu `fark()`in boş çıkmasına
     dayanıyor; `fark()` her zaman boş dönen bozuk bir işlev olsaydı ölçüm de tertemiz görünür,
     üstelik hiçbir tutarsızlık üretmezdi. (F1b tur 1'in İYİMSER hatası tam bu biçimdeydi:
     sonucun kendisinden anlaşılmıyordu.) İki FARKLI kadrajın farkı boş çıkarsa araç kırıktır. */
  {
    const a = Object.keys(tazeHud)[0], b = Object.keys(tazeHud)[1];
    const kanarya = fark(tazeHud[a], tazeHud[b], HUD_ALAN);
    if (!kanarya.length) throw new Error(`KANARYA OLDU: ${a} ile ${b} farkli kadrajlar ama fark() bos dondu — karsilastirici kirik, olcum gecersiz.`);
    console.log(`  kanarya ok: ${a}↔${b} farki ${kanarya.length} alanda goruldu`);

    /* İKİNCİ KANARYA — PANEL tarafı. İlk koşuda HUD kanaryası yeşildi ama panel referansları
       `{yok:true}` olduğu için panel farkları sahte "temiz" veriyordu: kanarya yalnız denetlediği
       yüzeyi korur. Bu yüzden panel karşılaştırması da ayrıca sınanıyor. */
    for (const p of paneller) {
      if (tazePanel[a]?.[p.id]?.yok || tazePanel[b]?.[p.id]?.yok) {
        throw new Error(`KANARYA OLDU: ${p.ad} referansi bos (${a}/${b}) — panel farklari sahte temiz cikardi.`);
      }
      const kp = fark(tazePanel[a][p.id], tazePanel[b][p.id], PANEL_ALAN);
      if (!kp.length) throw new Error(`KANARYA OLDU: ${p.ad} panelinde ${a} ile ${b} farki bos — panel karsilastiricisi kirik.`);
    }
    console.log(`  panel kanaryasi ok: ${paneller.length} panelin hepsinde ${a}↔${b} farki goruldu`);
  }

  /* §J1 + §J3 — HUD döndürme ve gidiş-dönüş, tek oturumda. */
  for (const c of ciftler) {
    const A = KADRAJ[c.a], B = KADRAJ[c.b];
    const hatalar = [];
    const { baglam, sayfa } = await oturumAc(tarayici, A, hatalar);

    const durumOnce = await sayfa.evaluate(DURUM);
    const hataOnce = hatalar.length;

    await dondur(sayfa, B);
    const hudB = await sayfa.evaluate(HUD_OLC);
    const durumSonra = await sayfa.evaluate(DURUM);
    const imzaB = await sayfa.evaluate(IMZA);
    await sayfa.screenshot({ path: path.join(OUT, `f6-donme-${c.id.replace('>', '-')}.png`) });

    j1.push({
      cift: c.id, ad: c.ad, hedef: B.id,
      hud: hudB,
      imza: imzaB,
      hataGecis: hatalar.length - hataOnce,
      durumKorundu: JSON.stringify(durumOnce) === JSON.stringify(durumSonra),
      durumOnce, durumSonra,
      fark: fark(tazeHud[B.id]?.hud ?? tazeHud[B.id], hudB, HUD_ALAN),
    });

    /* §J3 — geri dön. Başladığı kadraja dönünce taze A ile aynı mı? */
    await dondur(sayfa, A);
    const hudA2 = await sayfa.evaluate(HUD_OLC);
    j3.push({
      cift: `${c.a}>${c.b}>${c.a}`,
      hud: hudA2,
      hataToplam: hatalar.length,
      fark: fark(tazeHud[A.id], hudA2, HUD_ALAN),
    });

    await baglam.close();
    console.log(`  §J1/§J3 ${c.id} bitti (hata gecis=${hatalar.length - hataOnce})`);
  }

  /* §J2 — AÇIK EKRANLA döndürme. Panel A'da açılır, sonra çevrilir; panel kapanıyor mu,
     yerleşim (ray↔şerit) takas oluyor mu, sayılar taze B ile eşit mi. */
  for (const c of ciftler) {
    const A = KADRAJ[c.a], B = KADRAJ[c.b];
    for (const p of paneller) {
      const hatalar = [];
      const { baglam, sayfa } = await oturumAc(tarayici, A, hatalar);
      const acildi = await panelAc(sayfa, p);
      if (!acildi) {
        j2.push({ cift: c.id, panel: p.ad, acilmadi: true });
        await baglam.close();
        continue;
      }
      const hataOnce = hatalar.length;
      await dondur(sayfa, B);
      const acikKaldi = (await sayfa.locator(p.panel).count()) > 0;
      const olc = acikKaldi ? await sayfa.evaluate(PANEL_OLC, p.panel) : { kapandi: true };
      if (acikKaldi && !KISA) {
        await sayfa.screenshot({ path: path.join(OUT, `f6-donme-${c.id.replace('>', '-')}-${p.id}.png`) });
      }
      j2.push({
        cift: c.id, panel: p.ad, hedef: B.id,
        acikKaldi, olc,
        hataGecis: hatalar.length - hataOnce,
        fark: acikKaldi ? fark(tazePanel[B.id]?.[p.id], olc, PANEL_ALAN) : ['PANEL KAPANDI'],
      });
      await baglam.close();
    }
    console.log(`  §J2 ${c.id} bitti`);
  }

  await tarayici.close();
  sunucu.kill();

  // ─────────────────────────────── çıktı ───────────────────────────────
  const L = [];
  const yaz = (s = '') => { L.push(s); console.log(s); };

  yaz('');
  yaz('════════════════════════════════════════════════════════════════════════════════');
  yaz(`  F6 TUR 3 — DÖNDÜRME ANI ÖLÇÜMÜ   (kip: ${KISA ? 'KISA' : 'TAM'})`);
  yaz('════════════════════════════════════════════════════════════════════════════════');

  yaz('');
  yaz('§J1 — HUD DÖNDÜRME (canli oturum cevrildi; taze ile karsilastirildi)');
  yaz('');
  yaz('  cift        hedef  HUD%   tasan  tuval dW/dH  tampon WxH     kamSapma  hata  durum  imza');
  for (const r of j1) {
    const h = r.hud;
    yaz(`  ${r.cift.padEnd(11)} ${r.hedef.padEnd(6)} ${String(h.hudYuzde).padStart(5)}  ${String(h.tasan).padStart(5)}  ${String(h.tuvalDW + '/' + h.tuvalDH).padStart(11)}  ${String(h.tamponW + 'x' + h.tamponH).padStart(12)}  ${String(h.kamSapma).padStart(8)}  ${String(r.hataGecis).padStart(4)}  ${(r.durumKorundu ? 'ok' : 'YUTTU').padStart(5)}  ${r.imza}`);
  }
  yaz('');
  yaz('  TAZE ↔ DÖNEREK FARKI (bos = gecis temiz):');
  for (const r of j1) yaz(`    ${r.cift.padEnd(11)} ${r.fark.length ? r.fark.join(' · ') : '— temiz —'}`);

  yaz('');
  yaz('§J3 — GIDIS-DONUS (A→B→A; basladigi yere donuyor mu)');
  yaz('');
  for (const r of j3) yaz(`    ${r.cift.padEnd(14)} hata=${String(r.hataToplam).padStart(3)}  ${r.fark.length ? r.fark.join(' · ') : '— temiz —'}`);

  yaz('');
  yaz('§J2 — ACIK EKRANLA DONDURME');
  yaz('');
  yaz('  cift        panel      acik  duzen  kabuk WxH    ust WxH     disarida/akan  gorunur/toplam  gizliOdul  kesilen  hata');
  for (const r of j2) {
    if (r.acilmadi) { yaz(`  ${r.cift.padEnd(11)} ${r.panel.padEnd(10)} ACILMADI`); continue; }
    const o = r.olc;
    if (!r.acikKaldi) { yaz(`  ${r.cift.padEnd(11)} ${r.panel.padEnd(10)} KAPANDI`); continue; }
    yaz(`  ${r.cift.padEnd(11)} ${r.panel.padEnd(10)} ${(r.acikKaldi ? 'evet' : 'HAYIR').padEnd(5)} ${String(o.duzen).padEnd(6)} ${String(o.kabukG + 'x' + o.kabukY).padStart(11)}  ${String(o.ustG + 'x' + o.ustPx).padStart(10)}  ${String(o.disarida + '/' + o.akanToplam).padStart(13)}  ${String(o.gorunurDugme + '/' + o.toplamDugme).padStart(14)}  ${String(o.gizliOdul + '/' + o.odulToplam).padStart(9)}  ${String(o.kesilen).padStart(7)}  ${String(r.hataGecis).padStart(4)}`);
  }
  yaz('');
  yaz('  TAZE ↔ DÖNEREK FARKI (bos = gecis temiz):');
  for (const r of j2) {
    if (r.acilmadi) continue;
    yaz(`    ${r.cift.padEnd(11)} ${r.panel.padEnd(10)} ${r.fark.length ? r.fark.join(' · ') : '— temiz —'}`);
  }

  yaz('');
  yaz('OKUMA NOTU');
  yaz('  tuval dW/dH = ucjs tuvalinin CSS kutusunun ekrandan sapmasi (px). 0/0 = tam oturmus.');
  yaz('  tampon WxH  = cizim tamponunun gercek boyutu; donusten sonra yeni kadraj x dpr olmali.');
  yaz('  kamSapma    = kameranin en-boyu eksi kadrajin en-boyu. 0 = kamera tazelenmis.');
  yaz('  disarida    = govdenin alt kenarini GERCEKTEN asan kart sayisi (scrollHeight KULLANILMADI).');
  yaz('  duzen       = ust bolge dikeyse "ray", yataysa "serit" (D-131 takasi).');
  yaz('  durum       = wallet/tables/npc/stations/areas dondurmeden sonra ayni mi.');
  yaz('  CENTIK OLCULMEDI: Playwright safe-area taklit edemez, --sal/--sar her kadrajda 0.');
  yaz('');
  yaz(`  sure: ${((Date.now() - t0) / 1000).toFixed(0)} sn`);

  fs.writeFileSync(path.join(KOK, `docs/olcum-donme-f6${KISA ? '-kisa' : ''}.txt`), L.join('\n'), 'utf8');
  console.log(`\nham cikti: docs/olcum-donme-f6${KISA ? '-kisa' : ''}.txt`);
}

main().catch((e) => { console.error(e); process.exit(1); });
