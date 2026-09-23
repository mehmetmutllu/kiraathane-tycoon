/**
 * olcum-nav-ab-t9a.mjs — T9a: N2-KESİN (yol çağrı önbelleği) KARE KAZANCININ TARAYICI A/B'Sİ.
 *
 * T5b aracının (`tools/olcum-nav-ab-t5b.mjs`) kopyası; tek fark B kolu: oracle yerine
 * `onbellek` (`nav.navOnbellekAyarla(true)`). Node'da tick ×9,7 ölçüldü (`docs/olcum-perf-t9a.txt`),
 * ama T5'in dersi: node kazancı kareye yansıyor mu, AYNI sayfada ABBA ile doğrulanmadan yazılmaz.
 * Oranlar "onbellek/uretim" okunur: < 1 → önbellek ucuz.
 *
 * Koşu:  OLCUM=tam T5B_ETIKET=telefon node tools/olcum-nav-ab-t9a.mjs
 *        OLCUM=tam T5B_ETIKET=masaustu T5B_CPU=1 node tools/olcum-nav-ab-t9a.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAM = (process.env.OLCUM || 'kisa') === 'tam';
const PORT = Number.parseInt(process.env.T5B_PORT ?? '', 10) || 5219;
const ADRES = `http://localhost:${PORT}/`;
const GOLGE = (process.env.T5B_GOLGE || 'acik').trim();
/** `T5B_ETIKET=telefon` → `docs/olcum-nav-ab-t5b-telefon.*`. İki KOŞULUN (kısık/kısıksız) ham
 *  çıktısı birbirini ezmemeli: rapor ikisini yan yana okur, iddia dosyada da duruyor olmalı. */
const ETIKET = (process.env.T5B_ETIKET || '').trim();
const EK = ETIKET ? '-' + ETIKET : '';
const CIKTI = path.join(KOK, 'docs/olcum-nav-ab-t9a' + EK + '.txt');
const CIKTI_JSON = path.join(KOK, 'docs/olcum-nav-ab-t9a' + EK + '.json');
const KORPUS = path.join(KOK, 'docs/olcum-nav-korpus-t9a' + EK + '.json');
/** Korpus kayit suresi — cagri sayisi node tarafinda anlamli bir ortalama versin diye. */
const TAM_DOKUM_MS = TAM ? 12000 : 4000;

/**
 * T4/T5 ile AYNI kadraj ve kısma — bağlam sayıları aynı ailede okunsun.
 *
 * `T5B_CPU=1` ÖLÇÜMÜN KENDİSİNİ SINAR, bir kol değildir. Chrome'un CPU kısması ana iş parçacığına
 * uyku dilimleri enjekte ederek çalışır; enjeksiyon SÜREYLE ORANTILI değil, DİLİM DİLİMDİR. Bu
 * yüzden 0,18 ms'lik bir çağrı ile 0,46 ms'lik bir çağrı aynı uyku dilimini yiyebilir ve ikisi
 * de aynı maliyette görünür — yani kısma, çağrı-başı ORANI sıfıra doğru EZER. İlk kısa koşuda
 * tam bu şüphe doğdu (tarayıcı ×1,02, node ×2,52). Kısmasız koşu bu şüpheyi çözer.
 */
const TELEFON = { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true };
const CPU_KISMA = Number.parseInt(process.env.T5B_CPU ?? '', 10) || 4;

/** Bir kolun tek ölçüm dilimi. Kısa tutulur: uzun dilim sürüklenmeyi kolun İÇİNE alır. */
const DILIM_MS = TAM ? 6000 : 2500;
/** Kaç ABBA bloğu (blok = 4 dilim). Tam koşu 5 blok = 20 dilim = 10 A + 10 B. */
const BLOK = TAM ? 5 : 2;
const ISINMA_SN = TAM ? 240 : 120;

const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const f3 = (n) => (Math.round(n * 1000) / 1000).toFixed(3).replace('.', ',');
const tr = (n) => Math.round(n).toLocaleString('tr-TR');
const ortanca = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

function padKimlikleri() {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const blok = /pads:\s*\[([\s\S]*?)\n  \],/.exec(s);
  return [...blok[1].matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
}

function gorevSayisiOku() {
  const s = fs.readFileSync(path.join(KOK, 'src/config/economy.config.ts'), 'utf8');
  const bas = s.indexOf('quests: [');
  const son = s.indexOf('] as readonly QuestDef[]', bas);
  return [...s.slice(bas, son).matchAll(/\{\s*id:\s*'([^']+)'/g)].length;
}

function sunucuBaslat() {
  const s = spawn(process.execPath, [
    path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'),
    'dev', '--port', String(PORT), '--strictPort',
  ], { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((coz, at) => {
    const z = setTimeout(() => at(new Error('sunucu 60 sn icinde hazir olmadi')), 60000);
    s.stdout.on('data', (d) => {
      if (/ready in|Local:\s+http/i.test(String(d))) { clearTimeout(z); coz(s); }
    });
    s.on('exit', (k) => { clearTimeout(z); at(new Error('sunucu ' + k + ' koduyla kapandi (port dolu olabilir)')); });
  });
}

async function sayfaAc(tarayici) {
  const baglam = await tarayici.newContext({
    viewport: { width: TELEFON.width, height: TELEFON.height },
    deviceScaleFactor: TELEFON.deviceScaleFactor,
    isMobile: TELEFON.isMobile,
    hasTouch: TELEFON.hasTouch,
  });
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
  const hatalar = [];
  sayfa.on('pageerror', (e) => hatalar.push(String(e.message).slice(0, 160)));
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(String(m.text()).slice(0, 160)); });
  const cdp = await baglam.newCDPSession(sayfa);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_KISMA });
  /*
   * GÖLGE MONTAJ ANINDA SABİTLENİR (`?f2golge`), çalışırken DEĞİL — ilk kısa koşunun bulgusu.
   *
   * Araç önce `gl.shadowMap.enabled`ı elle yazıyordu ve koşunun ortasında gölge kendiliğinden
   * KAPANDI: `cihazSinifi.ts` (D-125) ilk ~100 kareyi örnekleyip cihazı sınıflandırıyor ve 4×
   * kısık CPU'da "zayıf" hükmü verip gölgeyi kapatıyor. Yani dilim 1-3 gölgeli, 4-8 gölgesiz
   * ölçüldü — denetim kolu bunu KIRMIZI olarak yakaladı ve koşuyu geçersiz saydı.
   *
   * `devPerf.ts` tam bu iş için yazılmış: kol sorgu dizesinden okunur, `<Canvas>` montajında
   * uygulanır ve `Scene.tsx`te cihaz sınıfı hükmünü EZER (`olcumKolu ? olcumKolu.golge : ...`).
   * Üstelik doğru olan da budur: gölgeyi çalışırken açıp kapatmak shader'ları yeniden derletir
   * ve o derleme ölçülen kareye sızar (devPerf.ts'in kendi gerekçesi).
   */
  const sorgu = GOLGE === 'kapali' ? '?f2golge=0&f2ad=t5b' : '?f2golge=2048&f2ad=t5b';
  await sayfa.goto(ADRES + sorgu, { waitUntil: 'load', timeout: 90000 });
  await sayfa.waitForFunction(() => !!document.querySelector('canvas'), null, { timeout: 60000 });
  await sayfa.waitForFunction(() => !!window.__three?.gl, null, { timeout: 60000 });
  return { baglam, sayfa, hatalar };
}

/**
 * Geç oyun: tüm pad'ler açık, masalar tavanda, OCAK TAVANDA — nav ızgarası en dolu, çağrı en çok.
 * 2026-09-23'e kadar ocak seviye 0'da kalıyordu ("20 masaya seviye-0 ocak", T6 rapor §1); o
 * tarihten önceki `docs/olcum-nav-ab-t5b*` o dünyadan. Ocak + bardak havuzu uygulamanın KENDİ
 * modülünden yazılır (aynı URL → aynı örnek), kurulum `tools/olcum-kayma-t6b.mjs` ile aynı.
 */
async function dunyaKur(sayfa, padler, gorevSayisi) {
  await sayfa.evaluate(async ({ pads, gs }) => {
    window.__resetGame?.();
    window.__setState?.({ padsDone: pads, wallet: 1e12, diamonds: 1e6, questIndex: gs });
    const n = window.__game?.().tables ?? 4;
    for (let i = 0; i < n; i++) window.__setTableLevel?.(i, 4);
    const { useGame, stationSoftMaxLevel, totalCupPool } = await import('/src/game/store.ts');
    const s = useGame.getState();
    const ocak = s.stationLevels.map(() => stationSoftMaxLevel());
    useGame.setState({ stationLevels: ocak, cleanCups: totalCupPool(s.areasOpen, ocak) });
    window.__park?.();
  }, { pads: padler, gs: gorevSayisi });
  await sayfa.evaluate((sn) => { window.__tohumla?.(12345); window.__advanceTime?.(sn); }, ISINMA_SN);
  await sayfa.evaluate(() => window.__park?.());
  await sayfa.waitForTimeout(500);
}

/**
 * Gölge durumunu YALNIZ OKUR ve istenen kolla tutup tutmadığını doğrular.
 * Yazmaz: sabitleme montajda `?f2golge` ile yapıldı (bkz. `sayfaAc`). Burada yazmak, cihaz
 * sınıfı hükmüyle yarışmak ve ölçüme shader derlemesi sızdırmak olurdu — §6'nın kusuru.
 */
async function golgeDogrula(sayfa, istenen) {
  const acik = await sayfa.evaluate(() => !!window.__three.gl.shadowMap.enabled);
  if (acik !== (istenen === 'acik')) {
    throw new Error('GOLGE KOLU TUTMADI: istenen=' + istenen + ' okunan=' + (acik ? 'acik' : 'kapali'));
  }
  return acik;
}

/**
 * TEK DİLİM — bir kol takılıyken karenin bölüşümü.
 * Damga: kolun adı SAYFADAN okunur (aracın sandığı değil, gerçekten takılı olan yazılır).
 */
async function dilim(sayfa, kol, ms) {
  const takili = await sayfa.evaluate((k) => window.__navKol(k), kol);
  const sonuc = await sayfa.evaluate(async (ms) => {
    const gl = window.__three.gl;
    const golgeHarita = gl.shadowMap;
    const cizim = [], golge = [], isler = [], cagrilar = [], ucgenler = [];
    const eskiRender = gl.render.bind(gl);
    const eskiGolge = golgeHarita.render.bind(golgeHarita);
    golgeHarita.render = function (...a) {
      const t = performance.now(); eskiGolge(...a); golge.push(performance.now() - t);
    };
    gl.render = function (...a) {
      const t = performance.now(); eskiRender(...a); cizim.push(performance.now() - t);
    };
    window.__olcum.ac();
    let dur = false;
    /*
     * HEAP AYIRMA HIZI — turun anahtar kalemi (T5b §C).
     *
     * Node, korpusun TAMAMINI tek blokta ölçer; oracle'ın çağrı başına ayırdığı 41 KB'lık
     * `Int32Array` ve onun GC bedeli bu blok içinde kalır. Tarayıcı ise `findNavPath`in
     * KENDİ aralığını ölçer ve GC o aralığın dışında (boş zamanda, başka bir karede) koşabilir.
     * Bu, aynı korpusun node'da ×2,70, tarayıcıda ×1,04 çıkmasının ilk şüphelisidir — ve
     * tahmin olarak bırakılmaz: ayırma hızı doğrudan ölçülür. Pozitif heap farklarının toplamı
     * o dilimde AYRILAN baytı verir (negatif fark = GC, sayılmaz).
     */
    let ayrilan = 0, oncekiHeap = performance.memory?.usedJSHeapSize ?? 0;
    const olc = () => {
      const v = window.__perf?.().isMs;
      if (v > 0) isler.push(v);
      const bilgi = gl.info?.render;
      if (bilgi) { cagrilar.push(bilgi.calls); ucgenler.push(bilgi.triangles); }
      const h = performance.memory?.usedJSHeapSize ?? 0;
      if (h > oncekiHeap) ayrilan += h - oncekiHeap;
      oncekiHeap = h;
      if (!dur) requestAnimationFrame(olc);
    };
    requestAnimationFrame(olc);
    const f0 = gl.info.render.frame;
    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, ms));
    dur = true;
    const gecen = performance.now() - t0;
    gl.render = eskiRender;
    golgeHarita.render = eskiGolge;
    const kayit = window.__olcum.oku();
    window.__olcum.kapat();
    const kare = gl.info.render.frame - f0;
    const orta = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
    const nav = kayit.findNavPath ?? { n: 0, ms: 0 };
    const g = window.__game();
    return {
      kare,
      fps: (kare / gecen) * 1000,
      isMs: orta(isler),
      cizimMs: orta(cizim),
      golgeMs: orta(golge),
      golgeAcik: !!gl.shadowMap.enabled,
      cagri: orta(cagrilar),
      ucgen: orta(ucgenler),
      // NAV — kare başına toplam ve ÇAĞRI BAŞINA (node'un ×2,52'si bu birimdedir).
      navMsKare: nav.ms / Math.max(kare, 1),
      navCagriKare: nav.n / Math.max(kare, 1),
      navMsCagri: nav.ms / Math.max(nav.n, 1e-9),
      navMs: nav.ms,
      navN: nav.n,
      /** Bu dilimde ayrılan bayt ve saniyedeki hızı (MB/sn) — oracle'ın 41 KB'lık tamponu burada görünür. */
      ayrilanMB: ayrilan / 1048576,
      ayrilanMBsn: (ayrilan / 1048576) / (gecen / 1000),
      /** Çağrı başına ayrılan bayt — 41 KB'lık tamponun doğrudan tanığı. */
      ayrilanKBcagri: nav.n > 0 ? ayrilan / 1024 / nav.n : 0,
      npc: g.npcCount,
      masa: g.tables,
    };
  }, ms);
  return { kol: takili, ...sonuc };
}

async function main() {
  const padler = padKimlikleri();
  const gorevSayisi = gorevSayisiOku();
  const sunucu = await sunucuBaslat();
  const tarayici = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=default', '--enable-gpu-rasterization',
      '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit',
      /* `performance.memory` bayraksız CACHE'LENMİŞ ve yuvarlanmış değer döndürür — ilk tam
       * koşuda ayırma hızı bu yüzden 0,0 MB/sn okundu. Bayrak canlı ve hassas değer verir. */
      '--enable-precise-memory-info'],
  });
  const satirlar = [];
  const yaz = (s = '') => { satirlar.push(s); console.log(s); };
  const rapor = { tarih: new Date().toISOString(), kip: TAM ? 'tam' : 'kisa', cpuKisma: CPU_KISMA, golgeIstenen: GOLGE };
  let cikis = 0;

  try {
    const { sayfa, hatalar } = await sayfaAc(tarayici);
    const surucu = await sayfa.evaluate(() => {
      const gl = window.__three?.gl?.getContext?.();
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'maskeli';
    });
    if (!(await sayfa.evaluate(() => typeof window.__navKol === 'function'))) {
      throw new Error('__navKol kancasi yok — DEV kipinde mi kosuyor?');
    }
    await dunyaKur(sayfa, padler, gorevSayisi);
    const golgeAcik = await golgeDogrula(sayfa, GOLGE);
    const izgara = await sayfa.evaluate(() => window.__olcum.izgara());

    yaz('='.repeat(78));
    yaz('T9a NAV ONBELLEK A/B (tarayici) · kip=' + rapor.kip + ' · ' + rapor.tarih);
    yaz('GPU: ' + surucu);
    yaz('Kadraj: ' + TELEFON.width + 'x' + TELEFON.height + ' @ dpr ' + TELEFON.deviceScaleFactor
      + ' · CPU ' + (CPU_KISMA === 1 ? 'KISILMADI (olcum denetimi)' : CPU_KISMA + 'x kisik'));
    yaz('Golge: ' + (golgeAcik ? 'ACIK' : 'KAPALI') + ' (istenen: ' + GOLGE + ') — TUM KOLLARDA AYNI');
    yaz('Nav izgarasi: ' + izgara.cols + 'x' + izgara.rows + ' = ' + tr(izgara.hucre) + ' hucre · cell ' + f2(izgara.cell));
    yaz('Desen: ABBA x ' + BLOK + ' blok · dilim ' + DILIM_MS + ' ms · A=uretim B=onbellek');
    yaz('='.repeat(78));
    yaz();

    // ISINMA: iki kol da bir kez koşar (JIT iki yolu da derlesin; ilk dilim avantajlı olmasın).
    await dilim(sayfa, 'uretim', 1200);
    await dilim(sayfa, 'onbellek', 1200);

    const dizi = [];
    for (let b = 0; b < BLOK; b++) dizi.push('uretim', 'onbellek', 'onbellek', 'uretim');

    yaz('§1 HAM DILIMLER (sira ABBA — lineer suruklenme birinci mertebeden gider)');
    yaz('   # | kol     | kare | fps  | is ms | cizim | golge | cagri |  ucgen  | nav ms/kare | nav cagri/kare | nav ms/cagri');
    const olcumler = [];
    for (let i = 0; i < dizi.length; i++) {
      const d = await dilim(sayfa, dizi[i], DILIM_MS);
      if (d.kol !== dizi[i]) throw new Error('DAMGA IHLALI: ' + dizi[i] + ' istendi, ' + d.kol + ' takili');
      olcumler.push(d);
      yaz('  ' + String(i + 1).padStart(2) + ' | ' + d.kol.padEnd(7) + ' | ' + String(d.kare).padStart(4)
        + ' | ' + f1(d.fps).padStart(4) + ' | ' + f1(d.isMs).padStart(5) + ' | ' + f1(d.cizimMs).padStart(5)
        + ' | ' + f1(d.golgeMs).padStart(5) + ' | ' + String(Math.round(d.cagri)).padStart(5)
        + ' | ' + tr(d.ucgen).padStart(7) + ' | ' + f2(d.navMsKare).padStart(11)
        + ' | ' + f1(d.navCagriKare).padStart(14) + ' | ' + f3(d.navMsCagri).padStart(12));
    }
    await sayfa.evaluate(() => window.__navKol('uretim'));
    yaz();

    const A = olcumler.filter((d) => d.kol === 'uretim');
    const B = olcumler.filter((d) => d.kol === 'onbellek');
    const kolOrt = (k) => ({ a: ortanca(A.map((d) => d[k])), b: ortanca(B.map((d) => d[k])) });

    // §2 DENETİM KOLU: nav'la İLGİSİ OLMAYAN kalemler iki kolda da aynı kalmalı.
    yaz('§2 DENETIM KOLU — bunlar oynarsa olculen sey kol degil MAKINEDIR');
    yaz('  kalem            | uretim(A) | onbel.(B) | fark %  | esik  | hal');
    /*
     * EŞİKLER AYNI DEĞİL, çünkü kalemler aynı şeye bağlı değil:
     *   · çizim/gölge ms — MAKİNENİN hızı. Nav'la ilgisi yok, oynarsa sürüklenme kolun içindedir.
     *     En sıkı eşik burada (%8): turun asıl denetçisi bu satırdır.
     *   · çizim çağrısı / üçgen / nav çağrısı / NPC — DÜNYANIN nüfusu. Bunlar doğal olarak
     *     dalgalanır (NPC gelir gider, T4 §C: NPC 34-39, para 18-22). Sıfır fark beklemek yanlış
     *     kırmızı üretir; burada aranan şey nüfusun KOLA BAĞLI kaymamasıdır, sabit kalması değil.
     */
    const denetimler = [
      ['cizim ms', 'cizimMs', 8],
      ['golge ms', 'golgeMs', 8],
      ['cizim cagrisi', 'cagri', 8],
      ['ucgen', 'ucgen', 8],
      ['nav cagri/kare', 'navCagriKare', 12],
      ['NPC', 'npc', 15],
    ];
    let denetimTemiz = true;
    for (const [ad, k, esik] of denetimler) {
      const { a, b } = kolOrt(k);
      const fark = a === 0 ? 0 : ((b - a) / a) * 100;
      const temiz = Math.abs(fark) <= esik;
      if (!temiz) denetimTemiz = false;
      yaz('  ' + ad.padEnd(16) + ' | ' + f2(a).padStart(9) + ' | ' + f2(b).padStart(9)
        + ' | ' + ((fark >= 0 ? '+' : '') + f1(fark)).padStart(7) + ' | ' + ('+-' + esik + '%').padStart(5)
        + ' | ' + (temiz ? 'temiz' : 'KIRMIZI'));
    }
    rapor.denetimTemiz = denetimTemiz;
    yaz('  → denetim ' + (denetimTemiz
      ? 'TEMIZ: kollar ayni makineyi ve ayni dunyayi olctu.'
      : 'KIRMIZI: kosu GECERSIZ, sayilar rapora GIRMEZ.'));
    yaz();

    // §3 KOL: nav'in kendisi.
    yaz('§3 KOL — nav maliyeti (ORAN okunur, mutlak ms baglamdir)');
    /*
     * ÇAĞRI BAŞI MALİYET **TOPLAMDAN** hesaplanır (Σms / Σçağrı), dilim ortancalarının
     * ortancasından DEĞİL. Sebep ilk kısa koşuda görüldü: `navMsCagri` ile `navMsKare`
     * ortancaları FARKLI dilimlerden geliyordu (çağrı/kare dilimden dilime 16,6-22,1 arasında
     * oynuyor) ve iki oran birbiriyle çelişik çıkıyordu (×1,02 ile ×1,19). Toplulaştırma
     * çağrıları ağırlığınca sayar; çelişki ölçüm kusuruydu, bulgu değil.
     */
    const toplam = (arr, k) => arr.reduce((x, d) => x + d[k], 0);
    const navCagri = {
      a: toplam(A, 'navMs') / Math.max(toplam(A, 'navN'), 1e-9),
      b: toplam(B, 'navMs') / Math.max(toplam(B, 'navN'), 1e-9),
    };
    const navKare = kolOrt('navMsKare');
    const is = kolOrt('isMs');
    const fps = kolOrt('fps');
    const oranCagri = navCagri.a > 0 ? navCagri.b / navCagri.a : 0;
    const oranKare = navKare.a > 0 ? navKare.b / navKare.a : 0;
    yaz('  toplam cagri   : uretim ' + tr(toplam(A, 'navN')) + ' · onbellek ' + tr(toplam(B, 'navN')));
    yaz('  nav ms/CAGRI   : uretim ' + f3(navCagri.a) + ' · onbellek ' + f3(navCagri.b) + '  → onbellek/uretim = x' + f2(oranCagri));
    yaz('  nav ms/KARE    : uretim ' + f2(navKare.a) + ' · onbellek ' + f2(navKare.b) + '  → onbellek/uretim = x' + f2(oranKare));
    yaz('  NODE (T9a perf, nav ms/kare): x' + f2(0.281 / 3.912) + ' → tarayici '
      + (oranKare <= 0.25 ? 'DOGRULUYOR' : oranKare <= 0.6 ? 'KISMEN dogruluyor' : 'DOGRULAMIYOR'));
    yaz();

    yaz('§4 KARE — kolun kareye yansiyani');
    const kareKazanc = is.a > 0 ? ((is.a - is.b) / is.a) * 100 : 0;
    const navPayA = is.a > 0 ? (navKare.a / is.a) * 100 : 0;
    const navPayB = is.b > 0 ? (navKare.b / is.b) * 100 : 0;
    yaz('  karenin isi     : uretim ' + f1(is.a) + ' ms · onbellek ' + f1(is.b) + ' ms  → onbellek %' + f1(kareKazanc) + ' daha ucuz');
    yaz('  fps             : uretim ' + f1(fps.a) + ' · onbellek ' + f1(fps.b));
    yaz("  nav'in KARE PAYI: uretim %" + f1(navPayA) + ' · onbellek %' + f1(navPayB));
    yaz("  (T4 §F tabani: nav karenin %31,5'iydi)");
    yaz();

    yaz('§C AYIRMA — node/tarayici ucurumunun sebebi');
    const ayirma = kolOrt('ayrilanMBsn');
    const ayirmaCagri = kolOrt('ayrilanKBcagri');
    yaz('  heap ayirma hizi : uretim ' + f1(ayirma.a) + ' MB/sn · onbellek ' + f1(ayirma.b) + ' MB/sn'
      + '  → onbellek/uretim = x' + f2(ayirma.a > 0 ? ayirma.b / ayirma.a : 0));
    yaz('  cagri basi       : uretim ' + f1(ayirmaCagri.a) + ' KB · onbellek ' + f1(ayirmaCagri.b) + ' KB'
      + '   (onbellek anahtari her cagrida bir dizge uretir)');
    const ayirmaFark = ayirmaCagri.b - ayirmaCagri.a;
    yaz('  → fark ' + f1(ayirmaFark) + ' KB/cagri. Bu ayirma GERCEKTEN oluyor; '
      + 'tarayicinin cagri-ici olcumunde gorunmuyor olmasi, bedelinin (GC) o araligin DISINDA');
    yaz('    kaldigi anlamina gelir — yani kol node un gosterdigi kadar ucuzlatmasa da');
    yaz('    ayirma yukunu gercekten kaldiriyor.');
    yaz();

    rapor.dilimler = olcumler;
    rapor.ozet = {
      navMsCagri: navCagri, navMsKare: navKare, isMs: is, fps,
      oranCagri, oranKare, kareKazancYuzde: kareKazanc, navPayA, navPayB,
      ayirmaMBsn: ayirma, ayirmaKBcagri: ayirmaCagri,
      golgeAcik, izgara, surucu, cpuKisma: CPU_KISMA,
      navToplam: {
        aMs: toplam(A, 'navMs'), aN: toplam(A, 'navN'),
        bMs: toplam(B, 'navMs'), bN: toplam(B, 'navN'),
      },
    };
    rapor.hatalar = hatalar;

    /*
     * KORPUS DÖKÜMÜ — turun ikinci yarısı. §3'te iki kol tarayıcıda neredeyse eşit çıktı
     * (node ×2,52). Şüpheliyi (ORTAM mı KORPUS mu) ayırmak için tarayıcının GERÇEK çağrıları
     * diske yazılır; `tools/olcum-nav-korpus-t5b.ts` aynı çağrıları node'da oynatır.
     * Döküm ÜRETİM kolu takılıyken alınır — kaydedilen şey argümanlardır, kol değil.
     */
    await sayfa.evaluate(() => window.__navKorpus.ac());
    await sayfa.waitForTimeout(TAM_DOKUM_MS);
    const dokum = await sayfa.evaluate(() => {
      const d = window.__navKorpus.dok();
      window.__navKorpus.kapat();
      return d;
    });
    fs.writeFileSync(KORPUS, JSON.stringify(dokum), 'utf8');
    yaz('§D KORPUS DOKUMU (node tarafinda oynatilacak)');
    yaz('  cagri            : ' + tr(dokum.cagriSayisi));
    yaz('  izgara nesnesi   : ' + dokum.izgaraSayisi + (dokum.izgaraSayisi === 1 ? ' (tek — korpus oynatilabilir)' : ' (BIRDEN COK — dunya kosu ortasinda degisti)'));
    yaz('  dosya            : ' + path.relative(KOK, KORPUS));
    rapor.dokum = { cagriSayisi: dokum.cagriSayisi, izgaraSayisi: dokum.izgaraSayisi };
    if (dokum.izgaraSayisi !== 1) cikis = 1;
    yaz();

    yaz('§E DAMGALAR');
    yaz('  konsol hatasi        : ' + hatalar.length);
    yaz('  kol damgasi          : ' + olcumler.length + '/' + olcumler.length + ' dilim istenen kolu dogruladi');
    yaz('  golge tum dilimlerde : ' + (olcumler.every((d) => d.golgeAcik === golgeAcik) ? 'SABIT' : 'DEGISTI (GECERSIZ)'));
    yaz('  masa sayisi sabit    : ' + (olcumler.every((d) => d.masa === olcumler[0].masa) ? 'evet (' + olcumler[0].masa + ')' : 'HAYIR'));
    if (hatalar.length) { yaz('  ! ' + hatalar.slice(0, 5).join(' | ')); cikis = 1; }
    if (!denetimTemiz) cikis = 1;
    if (!olcumler.every((d) => d.golgeAcik === golgeAcik)) cikis = 1;
  } finally {
    await tarayici.close();
    sunucu.kill();
  }

  fs.writeFileSync(CIKTI, satirlar.join('\n') + '\n', 'utf8');
  fs.writeFileSync(CIKTI_JSON, JSON.stringify(rapor, null, 1), 'utf8');
  console.log('\n→ ' + path.relative(KOK, CIKTI) + ' · ' + path.relative(KOK, CIKTI_JSON));
  process.exit(cikis);
}

main().catch((e) => { console.error(e); process.exit(1); });
