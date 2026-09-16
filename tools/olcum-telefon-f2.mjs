/**
 * olcum-telefon-f2.mjs — F2 turu: TELEFON YÜKÜ ölçümü.
 *
 * SORU: telefonda ne kadar ağırız ve ağırlığın kaynağı hangi kol — GÖLGE mi, PİKSEL mi,
 * İNDİRİLEN BAYT mı?
 *
 * KAPSAM DAMGASI (kullanıcı kararı 2026-09-16): cihaz bağlı değil. Ölçümün üç bölümü AYNI
 * GÜVENDE DEĞİL ve rapor bunu ayırmak zorunda:
 *
 *   §A ÖLÜ YÜK      — KESİN. Diskteki bayt ile gerçekten istenen bayt; cihazdan bağımsız.
 *   §B İNDİRME      — KESİN. Bayt dökümü üretim çıktısından (`dist/`) okunur.
 *   §C KARE SÜRESİ  — VEKİL. Masaüstü GPU + CPU kısma + telefon çözünürlüğü.
 *                     Kollar arası SIRALAMA için yeterli, mutlak ms için DEĞİL.
 *
 * İLK KURULUMUN ÜÇ KUSURU (kısa koşu yakaladı, tam koşudan önce kapatıldı):
 *
 * 1) YAZILIM GPU'SU. Headless Chromium varsayılan olarak SwiftShader'a düşer; orada fragment
 *    (piksel) maliyeti gerçek GPU'dakinin kat kat üstündedir, yani dpr kolu şişer ve gölge
 *    kolu bastırılır. Kolların SIRALAMASI bile bozulur. Çözüm: GPU bayrakları + koşan
 *    sürücünün adı ham çıktıya YAZILIR (`UNMASKED_RENDERER_WEBGL`), SwiftShader ise koşu
 *    kendini damgalar. Hangi donanımın ölçtüğünü yazmayan bir kare süresi sayı değildir.
 *
 * 2) KOLLAR AYNI DÜNYAYI ÖLÇMÜYORDU. İlk koşuda gölge AÇIKKEN çizim çağrısı 30, KAPALIYKEN
 *    40 çıktı — gölge geçişi çağrı EKLER, azaltmaz. Sebep: her kol kendi yüklemesinde
 *    rastgele bir oyun durumuna düşüyordu (kaç müşteri geldi, kaç masa açık). Çözüm: her kol
 *    ölçümden önce BİREBİR aynı dünyaya kurulur (tüm pad'ler açık, masa seviyeleri sabit,
 *    oyuncu park noktasında) ve üçgen sayısı kollar arasında denetlenir.
 *
 * 3) TEK ANLIK OKUMA. `gl.info.render.calls` kare başına sıfırlanır; rastgele bir anda okumak
 *    o karenin ne yaptığını söyler, kolun ne yaptığını değil. Çözüm: her karede okunup
 *    ortancası alınır.
 *
 * Koşu:  node tools/olcum-telefon-f2.mjs              (OLCUM=kisa varsayılan, ~2 dk)
 *        OLCUM=tam node tools/olcum-telefon-f2.mjs    (kollar uzun örneklenir, ~6 dk)
 *        F2_PORT=5210 node tools/olcum-telefon-f2.mjs (port çakışırsa)
 *        F2_HEADED=1 ...                              (pencereyi göster — GPU sorununda)
 *
 * Çıktı: stdout (ham) — `docs/olcum-telefon-f2.txt`e yönlendirilir.
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAM = (process.env.OLCUM || 'kisa') === 'tam';
const PORT = Number.parseInt(process.env.F2_PORT ?? '', 10) || 5210;
const ADRES = `http://localhost:${PORT}/`;

/** Telefon taklidi: Pixel 7 sınıfı orta segment. dpr 2,625 → dpr tavanı kolu gerçekten ısırır. */
const TELEFON = { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true };
/** CPU kısma: masaüstü çekirdeği orta-segment telefon çekirdeğinden kabaca 4× hızlı. */
const CPU_KISMA = 4;
const ORNEK_MS = TAM ? 12_000 : 4_000;
const ISINMA_MS = TAM ? 5_000 : 2_500;

const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const mb = (b) => `${f1(b / 1024 / 1024)} MB`;
const tr = (n) => Math.round(n).toLocaleString('tr-TR');

// ---------------------------------------------------------------- dosya tarama

function dosyalar(kok) {
  const out = [];
  if (!fs.existsSync(kok)) return out;
  for (const g of fs.readdirSync(kok, { withFileTypes: true })) {
    const p = path.join(kok, g.name);
    if (g.isDirectory()) out.push(...dosyalar(p));
    else out.push({ yol: p, bayt: fs.statSync(p).size });
  }
  return out;
}

function kaynakMetni() {
  return dosyalar(path.join(KOK, 'src'))
    .filter((d) => /\.(ts|tsx)$/.test(d.yol))
    .map((d) => fs.readFileSync(d.yol, 'utf8'))
    .join('\n');
}

/**
 * §A1 — PAKET DÜZEYİ ERİŞİLEBİLİRLİK.
 * Model yolları her bileşende ELLE YAZILI paket klasöründen kurulur
 * (`const KAY = '/assets/models/kaykit-furniture-bits/'`). Ortak çözücü YOKTUR — aracın
 * varsayımı değil, `src/`de doğrulanan olgu. Adı hiçbir kaynak dosyada geçmeyen paket hiçbir
 * kod yolundan istenemez: "kullanılmıyor gibi" değil, ULAŞILAMAZ.
 */
function paketTaramasi(metin) {
  const kok = path.join(KOK, 'public', 'assets', 'models');
  if (!fs.existsSync(kok)) return [];
  return fs.readdirSync(kok, { withFileTypes: true })
    .filter((g) => g.isDirectory())
    .map((g) => ({
      paket: g.name,
      bayt: dosyalar(path.join(kok, g.name)).reduce((a, d) => a + d.bayt, 0),
      gecis: metin.includes(g.name),
    }))
    .sort((a, b) => b.bayt - a.bayt);
}

/** Tüm pad kimlikleri — dünyayı tek hamlede açmak için (`padsDone` tek doğru kaynak, D-015). */
function padKimlikleri() {
  const s = fs.readFileSync(path.join(KOK, 'src', 'config', 'economy.config.ts'), 'utf8');
  const blok = s.slice(s.indexOf('  pads: ['));
  const son = blok.indexOf('\n  ],');
  return [...blok.slice(0, son).matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------- sunucu

function sunucuBaslat() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, at) => {
    const zamanAsimi = setTimeout(() => at(new Error('sunucu 60 sn icinde hazir olmadi')), 60_000);
    // Hazır sinyali vite'ın KENDİ stdout'undan — porta HTTP atmak, portu tutan YABANCI sunucuyu
    // "hazır" sanma kusurunu doğurur (duman.mjs tasarım kararı 2'nin aynısı).
    s.stdout.on('data', (d) => {
      if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(zamanAsimi); coz(s); }
    });
    s.on('exit', (k) => { clearTimeout(zamanAsimi); at(new Error(`sunucu ${k} koduyla kapandi (port dolu olabilir)`)); });
  });
}

// ---------------------------------------------------------------- tarayıcı

async function sayfaAc(tarayici, sorgu, { istekleriTopla = false } = {}) {
  const baglam = await tarayici.newContext({
    viewport: { width: TELEFON.width, height: TELEFON.height },
    deviceScaleFactor: TELEFON.deviceScaleFactor,
    isMobile: TELEFON.isMobile, hasTouch: TELEFON.hasTouch,
  });
  // KUSUR 4: müşteri gelişi `Math.random`a bağlı, yani her yükleme farklı sayıda NPC doğuruyor
  // ve çizim çağrısı kollar arasında ±22 oynuyordu. Tohumlu üreteçle rastgelelik SABİTLENİR —
  // artık kollar arası her fark yalnız gölge/dpr'den gelir.
  // ...ve tohum DIŞARIDAN sıfırlanabilir olmalı: yükleme sırasında kaç rastgele sayı
  // tüketildiği asset varış sırasına bağlı, yani simülasyon başladığında üretecin durumu
  // kollar arasında kaymış oluyordu (kısa koşu: gölge-kapalı kollarda üçgen %17 sapma).
  // `__tohumla()` simülasyondan HEMEN ÖNCE çağrılır → ileri sarma bit-birebir aynı olur.
  await baglam.addInitScript(() => {
    let t = 0x9e3779b9;
    window.__tohumla = (n) => { t = (n ?? 0x9e3779b9) | 0; return t; };
    Math.random = () => {
      t |= 0; t = (t + 0x6d2b79f5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  });
  const sayfa = await baglam.newPage();
  const istekler = [];
  const hatalar = [];
  sayfa.on('pageerror', (e) => hatalar.push(String(e.message).slice(0, 160)));
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(String(m.text()).slice(0, 160)); });
  if (istekleriTopla) {
    sayfa.on('response', async (r) => {
      const u = new URL(r.url());
      if (!u.pathname.startsWith('/assets/')) return;
      let bayt = 0;
      try { bayt = Number((await r.headerValue('content-length')) || 0); } catch { /* akış kapandı */ }
      istekler.push({ yol: u.pathname, bayt, durum: r.status() });
    });
  }
  const cdp = await baglam.newCDPSession(sayfa);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_KISMA });
  const t0 = Date.now();
  await sayfa.goto(ADRES + sorgu, { waitUntil: 'load', timeout: 90_000 });
  await sayfa.waitForFunction(() => !!document.querySelector('canvas'), null, { timeout: 60_000 });
  await sayfa.waitForFunction(() => !!window.__three?.gl, null, { timeout: 60_000 });
  return { baglam, sayfa, istekler, hatalar, tuvalMs: Date.now() - t0 };
}

/**
 * Her kolu AYNI dünyaya kurar: tüm pad'ler açık, masa seviyeleri sabit, oyuncu park noktasında.
 * Kusur 2'nin panzehiri — kollar arası fark yalnız gölge/dpr'den gelsin.
 */
async function dunyayiKur(sayfa, padler) {
  await sayfa.evaluate((pads) => {
    window.__resetGame?.();
    window.__setState?.({ padsDone: pads, wallet: 1e12, diamonds: 1e6 });
    const masaSayisi = window.__game?.().tables ?? 20;
    for (let i = 0; i < masaSayisi; i++) window.__setTableLevel?.(i, 6);
    window.__park?.();
  }, padler);
  // Kısa, SABİT bir ilerletme: NPC'ler sahneye çıksın. Tohum burada sıfırlanır.
  await sayfa.evaluate(() => { window.__tohumla?.(12345); window.__advanceTime?.(90); });
  await sayfa.evaluate(() => window.__park?.());
  // ...sonra DONDUR. Kısa koşu gösterdi ki ilerleyen simülasyonda NPC sayısı kollar arasında
  // oynuyor ve üçgen sayısı %7,2 kayıyor — yani kollar farklı dünyaları ölçüyordu. Gölge ve
  // dpr'nin maliyeti GPU maliyetidir; onu ölçmek için sahnenin her karede AYNI olması gerekir.
  await sayfa.evaluate(() => window.__zaman?.(0));
  await sayfa.waitForTimeout(400);
}

/** GPU sürücüsünün gerçek adı — kare süresinin hangi donanımdan geldiğini rapor yazsın diye. */
async function surucuAdi(sayfa) {
  return sayfa.evaluate(() => {
    const gl = window.__three?.gl?.getContext?.();
    if (!gl) return 'bilinmiyor';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'maskeli';
  });
}

async function kolOlc(tarayici, kol, padler) {
  const { baglam, sayfa, hatalar, tuvalMs } = await sayfaAc(tarayici, kol.sorgu);
  await dunyayiKur(sayfa, padler);
  await sayfa.waitForTimeout(ISINMA_MS);
  const surucu = await surucuAdi(sayfa);
  const olcum = await sayfa.evaluate(async (sure) => {
    const kareler = [], cagrilar = [], ucgenler = [];
    await new Promise((coz) => {
      let onceki = performance.now();
      const bitis = onceki + sure;
      const adim = (t) => {
        kareler.push(t - onceki);
        onceki = t;
        // Kusur 3'ün panzehiri: sayaçlar HER karede okunur, ortancası alınır.
        const bilgi = window.__three?.gl?.info?.render;
        if (bilgi) { cagrilar.push(bilgi.calls); ucgenler.push(bilgi.triangles); }
        if (t < bitis) requestAnimationFrame(adim);
        else coz();
      };
      requestAnimationFrame(adim);
    });
    kareler.shift();
    const orta = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
    const yuzde = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0; };
    const gl = window.__three?.gl;
    const bellek = performance.memory;
    // VARYANT ETKİLİ Mİ: kolun tuttuğunu METİNDEN değil RENDERER'DAN oku (D-084'ün "varyant
    // etkili mi?" denetimi). Sorgu dizesi doğru yazılıp kod yolunda kaybolsaydı, kare süresi
    // sessizce tabanı ölçer ve fark 0 çıkardı — bu satır o sessiz yanlışı imkânsız kılar.
    let golgeHarita = 0;
    window.__three?.scene?.traverse?.((o) => {
      if (o.isDirectionalLight && o.castShadow) golgeHarita = o.shadow?.mapSize?.width ?? 0;
    });
    return {
      npc: window.__game?.().npcCount ?? -1,
      golgeAcik: !!gl?.shadowMap?.enabled,
      golgeHarita,
      kare: kareler.length,
      ortanca: orta(kareler),
      p95: yuzde(kareler, 0.95),
      enKotu: Math.max(...kareler, 0),
      cagri: orta(cagrilar),
      ucgen: orta(ucgenler),
      geometri: gl?.info?.memory?.geometries ?? 0,
      doku: gl?.info?.memory?.textures ?? 0,
      program: gl?.info?.programs?.length ?? 0,
      dpr: gl?.getPixelRatio?.() ?? 0,
      tampon: gl?.domElement ? gl.domElement.width * gl.domElement.height : 0,
      heapMB: bellek ? bellek.usedJSHeapSize / 1048576 : 0,
    };
  }, ORNEK_MS);
  await baglam.close();
  return { ...kol, ...olcum, tuvalMs, surucu, hatalar };
}

// ---------------------------------------------------------------- koşu

async function main() {
  const yaz = (s = '') => console.log(s);

  yaz('# F2 — TELEFON YUKU OLCUMU');
  yaz(`# kip: ${TAM ? 'TAM' : 'kisa'} · ornek ${ORNEK_MS} ms/kol · isinma ${ISINMA_MS} ms · CPU kisma ${CPU_KISMA}x`);
  yaz(`# telefon taklidi: ${TELEFON.width}x${TELEFON.height} @ dpr ${TELEFON.deviceScaleFactor}`);
  yaz(`# tarih: ${new Date().toISOString()}`);
  yaz();

  // ---- §A1 (KESIN)
  const metin = kaynakMetni();
  const paketler = paketTaramasi(metin);
  yaz('## §A1 — PAKET ERISILEBILIRLIGI  [KESIN]');
  yaz('paket                              bayt     kodda gecis');
  let olu = 0, canli = 0;
  for (const p of paketler) {
    yaz(`${p.paket.padEnd(33)} ${mb(p.bayt).padStart(9)}   ${p.gecis ? 'VAR' : 'YOK  <-- ULASILAMAZ'}`);
    if (p.gecis) canli += p.bayt; else olu += p.bayt;
  }
  yaz(`TOPLAM: erisilebilir ${mb(canli)} · ULASILAMAZ ${mb(olu)} (%${f1((olu / (olu + canli)) * 100)})`);
  yaz();

  // ---- §B1 (KESIN)
  const dist = dosyalar(path.join(KOK, 'dist'));
  if (dist.length) {
    const grup = {};
    for (const d of dist) {
      const u = (path.extname(d.yol) || '.yok').slice(1).toLowerCase();
      const k = ['glb', 'gltf', 'bin'].includes(u) ? 'model (glb/gltf/bin)'
        : ['png', 'jpg', 'jpeg', 'webp'].includes(u) ? 'doku (png/jpg)'
        : ['ogg', 'mp3', 'wav', 'm4a'].includes(u) ? 'ses'
        : ['woff', 'woff2', 'ttf'].includes(u) ? 'font'
        : u === 'js' ? 'javascript' : u === 'css' ? 'css' : `diger (${u})`;
      grup[k] = (grup[k] || 0) + d.bayt;
    }
    const top = dist.reduce((a, d) => a + d.bayt, 0);
    yaz('## §B1 — URETIM CIKTISI (dist/) BAYT DOKUMU  [KESIN]');
    for (const [k, v] of Object.entries(grup).sort((a, b) => b[1] - a[1])) {
      yaz(`${k.padEnd(24)} ${mb(v).padStart(9)}  %${f1((v / top) * 100)}`);
    }
    yaz(`${'TOPLAM'.padEnd(24)} ${mb(top).padStart(9)}`);
    const apk = path.join(KOK, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(apk)) yaz(`APK (debug, sikistirilmis)  ${mb(fs.statSync(apk).size)}`);
    yaz();
  } else {
    yaz('## §B1 — dist/ YOK (once `npm run build`)'); yaz();
  }

  const padler = padKimlikleri();
  const sunucu = await sunucuBaslat();
  const tarayici = await chromium.launch({
    headless: !process.env.F2_HEADED,
    // Kusur 1: headless varsayılanı SwiftShader'dır. Bu bayraklar gerçek GPU'yu dener;
    // başarısız olursa sürücü adı ham çıktıda görünür ve sayı kendini damgalar.
    // `--disable-gpu-vsync` + `--disable-frame-rate-limit`: kısa koşuda BÜTÜN kollar 33,4 ms'e
    // (30 FPS tavanı) çakılmıştı — tavan altında kalan iş ölçülemez, kollar ayırt edilemezdi.
    // Kilit kalkınca rAF elinden geldiğince hızlı koşar ve kare süresi GERÇEK işi gösterir.
    args: ['--use-gl=angle', '--use-angle=default', '--enable-gpu-rasterization', '--ignore-gpu-blocklist',
      '--disable-gpu-vsync', '--disable-frame-rate-limit'],
  });
  try {
    // ---- §A2 (KESIN — dinamik kanıt)
    yaz('## §A2 — DUNYA TAM ACIKKEN GERCEKTEN ISTENEN ASSETLER  [KESIN]');
    const { baglam, sayfa, istekler, hatalar, tuvalMs } = await sayfaAc(tarayici, '', { istekleriTopla: true });
    await dunyayiKur(sayfa, padler);
    await sayfa.waitForTimeout(ISINMA_MS);
    await sayfa.evaluate(() => window.__advanceTime?.(1800));
    await sayfa.waitForTimeout(TAM ? 5_000 : 2_000);
    const essiz = new Map();
    for (const i of istekler) if (!essiz.has(i.yol)) essiz.set(i.yol, i);
    const diskAssets = dosyalar(path.join(KOK, 'public', 'assets'));
    const diskBayt = diskAssets.reduce((a, d) => a + d.bayt, 0);
    const istenenBayt = [...essiz.values()].reduce((a, i) => a + i.bayt, 0);
    yaz(`diskte asset      : ${tr(diskAssets.length)} dosya · ${mb(diskBayt)}`);
    yaz(`gercekten istenen : ${tr(essiz.size)} dosya · ${mb(istenenBayt)}`);
    yaz(`HIC ISTENMEYEN    : ${tr(diskAssets.length - essiz.size)} dosya · ${mb(diskBayt - istenenBayt)} (%${f1(((diskBayt - istenenBayt) / diskBayt) * 100)})`);
    yaz(`surucu: ${await surucuAdi(sayfa)}`);
    yaz(`konsol hatasi: ${hatalar.length}${hatalar.length ? ' -> ' + hatalar.slice(0, 3).join(' | ') : ''}`);
    yaz(`tuval hazir: ${tuvalMs} ms (CPU ${CPU_KISMA}x kisik, dev sunucusu)`);
    yaz(`acilan pad: ${padler.length} · istenen essiz asset listesi:`);
    for (const y of [...essiz.keys()].sort()) yaz(`  ${y}`);
    await baglam.close();
    yaz();

    // ---- §C (VEKIL)
    const kollar = [
      { ad: 'T  taban (soft 2048, dpr butcesi)', sorgu: '?f2golge=2048&f2ad=T' },
      { ad: 'G0 golge KAPALI', sorgu: '?f2golge=0&f2ad=G0' },
      { ad: 'G1 golge harita 1024', sorgu: '?f2golge=1024&f2ad=G1' },
      { ad: 'G2 golge harita 512', sorgu: '?f2golge=512&f2ad=G2' },
      { ad: 'P1 dpr tavani 1', sorgu: '?f2dpr=1&f2ad=P1' },
      { ad: 'G0+P1 golge kapali + dpr 1', sorgu: '?f2golge=0&f2dpr=1&f2ad=G0P1' },
    ];
    yaz('## §C — KARE SURESI KOLLARI  [VEKIL: cihazda dogrulanmadi]');
    yaz('kol                                 ortanca     p95  enkotu   cagri    ucgen   dpr    tampon px   heap');
    const sonuc = [];
    for (const k of kollar) {
      const r = await kolOlc(tarayici, k, padler);
      sonuc.push(r);
      yaz(`${r.ad.padEnd(35)} ${f2(r.ortanca).padStart(7)} ${f2(r.p95).padStart(7)} ${f2(r.enKotu).padStart(7)} ${tr(r.cagri).padStart(7)} ${tr(r.ucgen).padStart(9)} ${f2(r.dpr).padStart(5)} ${tr(r.tampon).padStart(11)} ${f1(r.heapMB).padStart(6)}`);
      if (r.hatalar.length) yaz(`    ! konsol hatasi: ${r.hatalar.slice(0, 2).join(' | ')}`);
    }
    yaz();
    yaz(`surucu (kare suresini ureten donanim): ${sonuc[0].surucu}`);
    yaz();

    const taban = sonuc[0];
    yaz('## §C2 — TABANA GORE FARK (ortanca kare suresi)');
    for (const r of sonuc.slice(1)) {
      const d = r.ortanca - taban.ortanca;
      yaz(`${r.ad.padEnd(35)} ${d >= 0 ? '+' : ''}${f2(d)} ms  (%${d >= 0 ? '+' : ''}${f1(taban.ortanca ? (d / taban.ortanca) * 100 : 0)})`);
    }
    yaz();

    // ---- korunum
    yaz('## VARYANT ETKI DENETIMI (kol gercekten tuttu mu? — renderer okundu)');
    const bekle = [
      ['T ', true, 2048, 2], ['G0', false, 0, 2], ['G1', true, 1024, 2],
      ['G2', true, 512, 2], ['P1', true, 2048, 1], ['G0+P1', false, 0, 1],
    ];
    let etkiKaldi = 0;
    sonuc.forEach((r, i) => {
      const [ad, gBek, hBek, dBek] = bekle[i];
      const ok = r.golgeAcik === gBek && (!gBek || r.golgeHarita === hBek) && Math.abs(r.dpr - dBek) < 0.01;
      if (!ok) etkiKaldi++;
      yaz(`${ad.padEnd(6)} golge ${String(r.golgeAcik).padEnd(5)} harita ${String(r.golgeHarita).padStart(4)} dpr ${f2(r.dpr)}  (beklenen ${gBek}/${hBek}/${dBek})  ${ok ? 'ETKILI' : 'KALDI <-- kol tutmadi'}`);
    });
    yaz();
    yaz('## KORUNUM DENETIMI (kollar ayni dunyayi mi olctu?)');
    const ucgenler = sonuc.map((r) => r.ucgen);
    const enAz = Math.min(...ucgenler), enCok = Math.max(...ucgenler);
    const sapma = enAz ? ((enCok - enAz) / enAz) * 100 : 0;
    yaz(`ucgen araligi: ${tr(enAz)} … ${tr(enCok)} · sapma %${f1(sapma)}  ${sapma < 2 ? 'GECTI' : 'KALDI <-- kollar farkli dunya olcmus'}`);
    const cagrilar = sonuc.map((r) => r.cagri);
    yaz(`cizim cagrisi araligi: ${tr(Math.min(...cagrilar))} … ${tr(Math.max(...cagrilar))} (tohumlu rastgele ile ayni dunya bekleniyor)`);
    const npcler = sonuc.map((r) => r.npc);
    yaz(`NPC sayisi: ${npcler.join(' · ')}  ${new Set(npcler).size === 1 ? 'GECTI (ayni nufus)' : 'KALDI <-- nufus kollar arasi oynuyor'}`);
    yaz(`tampon piksel: taban ${tr(taban.tampon)} · dpr1 ${tr(sonuc[4].tampon)} · oran ${f2(taban.tampon / Math.max(1, sonuc[4].tampon))}x  ${taban.tampon > sonuc[4].tampon ? 'GECTI' : 'KALDI'}`);
    yaz(`surucu yazilim mi: ${/swiftshader|llvmpipe|software/i.test(sonuc[0].surucu) ? 'EVET <-- kare suresi guvenilmez' : 'hayir (gercek GPU)'}`);
    yaz(`varyant denetimi: ${etkiKaldi === 0 ? 'ALTI KOL DA ETKILI' : etkiKaldi + ' kol TUTMADI'}`);
  } finally {
    await tarayici.close();
    sunucu.kill();
  }
}

main().catch((e) => { console.error('OLCUM KIRILDI:', e.message); process.exit(1); });
